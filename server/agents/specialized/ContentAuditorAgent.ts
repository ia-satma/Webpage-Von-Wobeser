import { BaseAgent } from '../core/BaseAgent';
import { AgentConfig, AgentResult, ExecutionContext } from '../core/types';
import { db } from '../../db';
import { news, translationCache, newsTeamMembers } from '../../../shared/schema';
import { eq, sql } from 'drizzle-orm';

const LANGUAGES = ['en', 'es', 'de', 'zh', 'ko', 'ja', 'ar', 'ru', 'fr', 'it'] as const;

interface ContentGap {
  articleId: string;
  articleTitle: string;
  gapType: 'missing_translation' | 'missing_author' | 'poor_formatting' | 'missing_excerpt' | 'short_content';
  details: string;
  severity: 'low' | 'medium' | 'high';
  suggestedAction: string;
}

const AUDITOR_CONFIG: AgentConfig = {
  agentType: 'content_auditor',
  name: 'Content Auditor Agent',
  description: 'Scans database for content gaps and orchestrates fixes',
  systemPrompt: `You are a content quality auditor for Von Wobeser y Sierra law firm website. Your role is to:

1. Identify content gaps (missing translations, incomplete data)
2. Detect quality issues (poor formatting, short content)
3. Prioritize issues by severity
4. Generate tasks for other agents to fix issues

Be thorough but efficient. Focus on issues that impact user experience.`,
  model: 'gpt-4o',
  temperature: 0.2,
  maxTokens: 4000,
  skills: ['content_analysis', 'gap_detection', 'quality_assessment'],
  enabled: true,
  concurrency: 1,
  retryPolicy: { maxRetries: 2, backoffMs: 5000, backoffMultiplier: 2 },
};

export class ContentAuditorAgent extends BaseAgent {
  constructor() {
    super(AUDITOR_CONFIG);
  }

  async execute(context: ExecutionContext, payload: Record<string, unknown>): Promise<AgentResult> {
    const { scanType } = payload as { scanType?: 'full' | 'translations' | 'metadata' | 'formatting' };
    
    const gaps: ContentGap[] = [];
    const stats = {
      articlesScanned: 0,
      translationGaps: 0,
      authorGaps: 0,
      formattingIssues: 0,
      contentIssues: 0,
    };

    try {
      const articles = await db.select().from(news);
      stats.articlesScanned = articles.length;

      for (const article of articles) {
        if (!scanType || scanType === 'full' || scanType === 'translations') {
          const translationGaps = await this.checkTranslations(article);
          gaps.push(...translationGaps);
          stats.translationGaps += translationGaps.length;
        }

        if (!scanType || scanType === 'full' || scanType === 'metadata') {
          const authorGaps = await this.checkAuthors(article);
          gaps.push(...authorGaps);
          stats.authorGaps += authorGaps.length;
        }

        if (!scanType || scanType === 'full' || scanType === 'formatting') {
          const formattingGaps = this.checkFormatting(article);
          gaps.push(...formattingGaps);
          stats.formattingIssues += formattingGaps.length;

          const contentGaps = this.checkContent(article);
          gaps.push(...contentGaps);
          stats.contentIssues += contentGaps.length;
        }
      }

      gaps.sort((a, b) => {
        const severityOrder = { high: 0, medium: 1, low: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });

      const tasksSuggested = this.generateTasks(gaps);

      return {
        success: true,
        data: {
          gaps: gaps.slice(0, 100),
          totalGaps: gaps.length,
          stats,
          tasksSuggested,
        },
        metrics: {
          ...stats,
          totalGaps: gaps.length,
        },
      };
    } catch (error) {
      return { success: false, error: `Audit failed: ${error}` };
    }
  }

  private async checkTranslations(article: typeof news.$inferSelect): Promise<ContentGap[]> {
    const gaps: ContentGap[] = [];

    const cached = await db.select()
      .from(translationCache)
      .where(eq(translationCache.entityId, article.id));

    const cachedLanguages = new Set(cached.map(c => c.targetLanguage));

    for (const lang of LANGUAGES) {
      if (lang === 'en' || lang === 'es') continue;

      if (!cachedLanguages.has(lang)) {
        gaps.push({
          articleId: article.id,
          articleTitle: article.title || article.titleEs || 'Unknown',
          gapType: 'missing_translation',
          details: `Missing ${lang.toUpperCase()} translation`,
          severity: 'medium',
          suggestedAction: `Run PolyglotTranslatorAgent for ${article.id} targeting ${lang}`,
        });
      }
    }

    return gaps;
  }

  private async checkAuthors(article: typeof news.$inferSelect): Promise<ContentGap[]> {
    const gaps: ContentGap[] = [];

    const authors = await db.select()
      .from(newsTeamMembers)
      .where(eq(newsTeamMembers.newsId, article.id));

    if (authors.length === 0) {
      gaps.push({
        articleId: article.id,
        articleTitle: article.title || article.titleEs || 'Unknown',
        gapType: 'missing_author',
        details: 'No authors linked to this article',
        severity: 'high',
        suggestedAction: `Run MetadataLinkerAgent for ${article.id}`,
      });
    }

    return gaps;
  }

  private checkFormatting(article: typeof news.$inferSelect): ContentGap[] {
    const gaps: ContentGap[] = [];
    const content = article.content || article.contentEs || '';

    const brokenLineBreaks = (content.match(/[a-záéíóúñ]\n[a-záéíóúñ]/gi) || []).length;
    if (brokenLineBreaks > 5) {
      gaps.push({
        articleId: article.id,
        articleTitle: article.title || article.titleEs || 'Unknown',
        gapType: 'poor_formatting',
        details: `${brokenLineBreaks} potential broken line breaks detected`,
        severity: 'high',
        suggestedAction: `Run FormatterAgent for ${article.id}`,
      });
    }

    return gaps;
  }

  private checkContent(article: typeof news.$inferSelect): ContentGap[] {
    const gaps: ContentGap[] = [];
    const content = article.content || article.contentEs || '';
    const excerpt = article.excerpt || article.excerptEs || '';

    if (!excerpt || excerpt.length < 50) {
      gaps.push({
        articleId: article.id,
        articleTitle: article.title || article.titleEs || 'Unknown',
        gapType: 'missing_excerpt',
        details: 'Article has no excerpt or excerpt is too short',
        severity: 'low',
        suggestedAction: `Run FormatterAgent for ${article.id} to generate excerpt`,
      });
    }

    if (content.length < 200) {
      gaps.push({
        articleId: article.id,
        articleTitle: article.title || article.titleEs || 'Unknown',
        gapType: 'short_content',
        details: `Content is only ${content.length} characters`,
        severity: 'medium',
        suggestedAction: 'Review article source or mark as incomplete',
      });
    }

    return gaps;
  }

  private generateTasks(gaps: ContentGap[]): { agentType: string; count: number; priority: string }[] {
    const taskCounts: Record<string, { count: number; highPriority: number }> = {
      formatter: { count: 0, highPriority: 0 },
      metadata_linker: { count: 0, highPriority: 0 },
      polyglot_translator: { count: 0, highPriority: 0 },
    };

    for (const gap of gaps) {
      if (gap.gapType === 'poor_formatting' || gap.gapType === 'missing_excerpt') {
        taskCounts.formatter.count++;
        if (gap.severity === 'high') taskCounts.formatter.highPriority++;
      } else if (gap.gapType === 'missing_author') {
        taskCounts.metadata_linker.count++;
        if (gap.severity === 'high') taskCounts.metadata_linker.highPriority++;
      } else if (gap.gapType === 'missing_translation') {
        taskCounts.polyglot_translator.count++;
        if (gap.severity === 'high') taskCounts.polyglot_translator.highPriority++;
      }
    }

    return Object.entries(taskCounts)
      .filter(([_, data]) => data.count > 0)
      .map(([agentType, data]) => ({
        agentType,
        count: data.count,
        priority: data.highPriority > 0 ? 'high' : 'normal',
      }));
  }
}

export const contentAuditorAgent = new ContentAuditorAgent();
