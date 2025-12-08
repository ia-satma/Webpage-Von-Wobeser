import { BaseAgent } from '../core/BaseAgent';
import { AgentConfig, AgentResult, ExecutionContext } from '../core/types';
import { knowledgeStore } from '../core/AgentKnowledge';
import { db } from '../../db';
import { news, translationCache } from '../../../shared/schema';
import { eq, and } from 'drizzle-orm';

const LANGUAGES = ['en', 'es', 'de', 'zh', 'ko', 'ja', 'ar', 'ru', 'fr', 'it'] as const;
type Language = typeof LANGUAGES[number];

const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  es: 'Spanish',
  de: 'German',
  zh: 'Chinese (Simplified)',
  ko: 'Korean',
  ja: 'Japanese',
  ar: 'Arabic',
  ru: 'Russian',
  fr: 'French',
  it: 'Italian',
};

const TRANSLATOR_CONFIG: AgentConfig = {
  agentType: 'polyglot_translator',
  name: 'Polyglot Translator Agent',
  description: 'Translates legal content to 10 languages with specialized legal terminology',
  systemPrompt: `You are an expert legal translator for Von Wobeser y Sierra, a prestigious Mexican law firm. Your translations must be:

1. ACCURATE: Preserve legal meaning precisely
2. PROFESSIONAL: Use formal legal register appropriate for corporate communications
3. CONSISTENT: Use the provided glossary for legal terms
4. NATURAL: Read fluently in the target language

Important rules:
- Proper nouns (company names, institution names, people's names) remain unchanged
- Legal concepts MUST be translated appropriately
- Maintain the original structure and formatting
- Keep citations, dates, and references intact

Return JSON:
{
  "title": "translated title",
  "excerpt": "translated excerpt",
  "content": "translated full content"
}`,
  model: 'gpt-4o',
  temperature: 0.3,
  maxTokens: 8000,
  skills: ['legal_translation', 'multilingual', 'terminology_management'],
  enabled: true,
  concurrency: 2,
  retryPolicy: { maxRetries: 3, backoffMs: 2000, backoffMultiplier: 2 },
};

export class PolyglotTranslatorAgent extends BaseAgent {
  constructor() {
    super(TRANSLATOR_CONFIG);
  }

  async execute(context: ExecutionContext, payload: Record<string, unknown>): Promise<AgentResult> {
    const { articleId, targetLanguages, forceRetranslate } = payload as {
      articleId: string;
      targetLanguages?: Language[];
      forceRetranslate?: boolean;
    };

    if (!articleId) {
      return { success: false, error: 'articleId is required' };
    }

    const [article] = await db.select().from(news).where(eq(news.id, articleId));
    if (!article) {
      return { success: false, error: `Article not found: ${articleId}` };
    }

    const sourceContent = {
      title: article.title || article.titleEs,
      excerpt: article.excerpt || article.excerptEs,
      content: article.content || article.contentEs,
    };

    const sourceLanguage = article.title ? 'en' : 'es';
    const languages = targetLanguages || LANGUAGES.filter(l => l !== sourceLanguage);

    const glossaryDocs = await knowledgeStore.searchDocuments('polyglot_translator', 'glossary', { limit: 50 });
    const glossary: Record<string, Record<string, string>> = {};
    
    for (const doc of glossaryDocs) {
      try {
        const translations = JSON.parse(doc.content);
        glossary[doc.title] = translations;
      } catch {}
    }

    const results: Record<string, { title: string; excerpt: string; content: string }> = {};
    const errors: string[] = [];
    let cachedCount = 0;
    let translatedCount = 0;

    for (const lang of languages) {
      if (lang === sourceLanguage) continue;

      if (!forceRetranslate) {
        const cached = await this.getCachedTranslation(articleId, lang);
        if (cached) {
          results[lang] = cached;
          cachedCount++;
          continue;
        }
      }

      try {
        const translation = await this.translateToLanguage(
          sourceContent,
          sourceLanguage,
          lang,
          glossary
        );
        
        results[lang] = translation;
        translatedCount++;

        await this.cacheTranslation(articleId, lang, translation);
      } catch (error) {
        errors.push(`${lang}: ${error}`);
      }
    }

    return {
      success: errors.length === 0,
      data: {
        articleId,
        sourceLanguage,
        translations: results,
        cachedCount,
        translatedCount,
        errors: errors.length > 0 ? errors : undefined,
      },
      metrics: {
        languagesProcessed: Object.keys(results).length,
        cachedHits: cachedCount,
        newTranslations: translatedCount,
        errorCount: errors.length,
      },
    };
  }

  private async translateToLanguage(
    source: { title: string; excerpt: string; content: string },
    sourceLang: Language,
    targetLang: Language,
    glossary: Record<string, Record<string, string>>
  ): Promise<{ title: string; excerpt: string; content: string }> {
    const glossaryTerms = Object.entries(glossary)
      .filter(([_, translations]) => translations[targetLang])
      .map(([term, translations]) => `${term} → ${translations[targetLang]}`)
      .join('\n');

    const prompt = `Translate this legal article from ${LANGUAGE_NAMES[sourceLang]} to ${LANGUAGE_NAMES[targetLang]}.

GLOSSARY (use these translations for legal terms):
${glossaryTerms || 'No specific glossary terms'}

TITLE: ${source.title}

EXCERPT: ${source.excerpt}

CONTENT: ${source.content?.substring(0, 6000) || ''}

Return JSON with translated title, excerpt, and content.`;

    const response = await this.callLLM(
      [{ role: 'user', content: prompt }],
      { temperature: 0.3, jsonMode: true }
    );

    return JSON.parse(response);
  }

  private async getCachedTranslation(
    articleId: string,
    language: Language
  ): Promise<{ title: string; excerpt: string; content: string } | null> {
    const cached = await db.select()
      .from(translationCache)
      .where(and(
        eq(translationCache.entityId, articleId),
        eq(translationCache.contentType, 'news'),
        eq(translationCache.targetLanguage, language)
      ));

    if (cached.length > 0 && cached[0].translations) {
      const translations = cached[0].translations as Record<string, string>;
      if (translations.title && translations.content) {
        return {
          title: translations.title,
          excerpt: translations.excerpt || '',
          content: translations.content,
        };
      }
    }

    return null;
  }

  private async cacheTranslation(
    articleId: string,
    language: Language,
    translation: { title: string; excerpt: string; content: string }
  ): Promise<void> {
    const existing = await db.select()
      .from(translationCache)
      .where(and(
        eq(translationCache.entityId, articleId),
        eq(translationCache.contentType, 'news'),
        eq(translationCache.targetLanguage, language)
      ));

    if (existing.length > 0) {
      await db.update(translationCache)
        .set({
          translations: translation,
          updatedAt: new Date(),
        })
        .where(eq(translationCache.id, existing[0].id));
    } else {
      await db.insert(translationCache).values({
        contentType: 'news',
        entityId: articleId,
        targetLanguage: language,
        translations: translation,
      });
    }
  }
}

export const polyglotTranslatorAgent = new PolyglotTranslatorAgent();
