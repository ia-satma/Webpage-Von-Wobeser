import { BaseAgent } from '../core/BaseAgent';
import { AgentConfig, AgentResult, ExecutionContext } from '../core/types';
import { knowledgeStore } from '../core/AgentKnowledge';
import { db } from '../../db';
import { news, translationCache, newsTranslations } from '../../../shared/schema';
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
  model: 'claude-sonnet-4-6',
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

    // Source content - prioritize Spanish (Es) fields as source since most articles are in Spanish
    const sourceContent = {
      title: article.titleEs || article.title || '',
      excerpt: article.excerptEs || article.excerpt || '',
      content: article.contentEs || article.content || '',
    };

    // Default source is Spanish - articles are primarily in Spanish
    // Only consider English as source if content is clearly only in English fields
    const sourceLanguage: Language = 'es';
    
    // Target all 10 languages including English (en) since source is Spanish
    const languages = targetLanguages || LANGUAGES.filter(l => l !== sourceLanguage);

    const glossaryDocs = await knowledgeStore.searchDocuments('polyglot_translator', 'glossary', { limit: 50 });
    const glossary: Record<string, Record<string, string>> = {};
    
    for (const doc of glossaryDocs) {
      try {
        const translations = JSON.parse(doc.content);
        glossary[doc.title] = translations;
      } catch (error) {
        console.error('[PolyglotTranslatorAgent] Failed to parse glossary entry:', doc.title, error);
      }
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
        console.error(`[PolyglotTranslatorAgent] Translation failed for language ${lang}:`, error);
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

Return the translation using EXACTLY these three markers, each on its own line, and nothing else (no JSON, no quotes around the values, no extra commentary):
[[TITLE]]
<translated title here>
[[EXCERPT]]
<translated excerpt here>
[[CONTENT]]
<translated content here, may span multiple paragraphs>

Source to translate:
TITLE: ${source.title}

EXCERPT: ${source.excerpt}

CONTENT: ${source.content?.substring(0, 6000) || ''}`;

    // Formato delimitado (no JSON): evita errores de parseo por comillas/saltos sin escapar
    // en traducciones largas, que rompían JSON.parse.
    const text = await this.callLLM(
      [{ role: 'user', content: prompt }],
      { temperature: 0.3, maxTokens: 8192 }
    );
    const parts = text.split(/\[\[(TITLE|EXCERPT|CONTENT)\]\]/i);
    const map: Record<string, string> = {};
    for (let i = 1; i < parts.length; i += 2) map[parts[i].toUpperCase()] = (parts[i + 1] || '').trim();
    return {
      title: map.TITLE || source.title,
      excerpt: map.EXCERPT || source.excerpt,
      content: map.CONTENT || source.content,
    };
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

    // Also save to news_translations table for direct access
    const existingNewsTranslation = await db.select()
      .from(newsTranslations)
      .where(and(
        eq(newsTranslations.newsId, articleId),
        eq(newsTranslations.language, language)
      ));

    if (existingNewsTranslation.length > 0) {
      await db.update(newsTranslations)
        .set({
          title: translation.title,
          excerpt: translation.excerpt,
          content: translation.content,
          translatedAt: new Date(),
        })
        .where(eq(newsTranslations.id, existingNewsTranslation[0].id));
    } else {
      await db.insert(newsTranslations).values({
        newsId: articleId,
        language: language,
        title: translation.title,
        excerpt: translation.excerpt,
        content: translation.content,
        translatedBy: 'ai',
      });
    }
  }
}

export const polyglotTranslatorAgent = new PolyglotTranslatorAgent();
