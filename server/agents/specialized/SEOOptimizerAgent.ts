import { BaseAgent } from '../core/BaseAgent';
import { AgentConfig, AgentResult, ExecutionContext } from '../core/types';
import { db } from '../../db';
import { news } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

const SEO_CONFIG: AgentConfig = {
  agentType: 'seo_optimizer',
  name: 'SEO Optimizer Agent',
  description: 'Optimizes article titles, meta descriptions, and content for search engines',
  systemPrompt: `You are an SEO specialist for Von Wobeser y Sierra law firm. Your task is to optimize legal articles for search engines while maintaining professional tone.

Optimization rules:
1. TITLES: 50-60 characters, include primary keyword, compelling but professional
2. META DESCRIPTIONS: 150-160 characters, include call-to-action, summarize value
3. EXCERPTS: 200-300 characters, engaging, informative
4. SLUGS: lowercase, hyphenated, keyword-rich, 3-5 words

Important:
- Maintain legal accuracy and professional tone
- Include relevant legal keywords naturally
- Consider both Spanish and English SEO
- Keep firm name prominent where appropriate

Return JSON:
{
  "optimizedTitle": "...",
  "optimizedTitleEs": "...",
  "metaDescription": "...",
  "metaDescriptionEs": "...",
  "suggestedSlug": "...",
  "keywords": ["keyword1", "keyword2"],
  "keywordsEs": ["palabra1", "palabra2"],
  "seoScore": 0-100,
  "improvements": ["improvement1", "improvement2"]
}`,
  model: 'claude-sonnet-4-6',
  temperature: 0.4,
  maxTokens: 2000,
  skills: ['seo_analysis', 'keyword_optimization', 'meta_generation'],
  enabled: true,
  concurrency: 3,
  retryPolicy: { maxRetries: 3, backoffMs: 1000, backoffMultiplier: 2 },
};

export class SEOOptimizerAgent extends BaseAgent {
  constructor() {
    super(SEO_CONFIG);
  }

  async execute(context: ExecutionContext, payload: Record<string, unknown>): Promise<AgentResult> {
    const { articleId, applyChanges } = payload as { articleId: string; applyChanges?: boolean };

    if (!articleId) {
      return { success: false, error: 'articleId is required' };
    }

    const [article] = await db.select().from(news).where(eq(news.id, articleId));
    if (!article) {
      return { success: false, error: `Article not found: ${articleId}` };
    }

    try {
      const currentSeoScore = this.calculateCurrentSeoScore(article);

      const prompt = `Optimize this legal article for SEO:

CURRENT TITLE (EN): ${article.title}
CURRENT TITLE (ES): ${article.titleEs}
CURRENT SLUG: ${article.slug}
CURRENT EXCERPT (EN): ${article.excerpt}
CURRENT EXCERPT (ES): ${article.excerptEs}

CONTENT PREVIEW:
${(article.content || article.contentEs || '').substring(0, 2000)}

Analyze and provide optimized versions. Return JSON with optimizedTitle, optimizedTitleEs, metaDescription, metaDescriptionEs, suggestedSlug, keywords, keywordsEs, seoScore (0-100), and improvements array.`;

      const response = await this.callLLM(
        [{ role: 'user', content: prompt }],
        { temperature: 0.4, jsonMode: true }
      );

      const optimization = JSON.parse(response);

      if (applyChanges && optimization.seoScore > currentSeoScore) {
        const updates: Record<string, unknown> = {};

        if (optimization.optimizedTitle && optimization.optimizedTitle !== article.title) {
          updates.title = optimization.optimizedTitle;
        }
        if (optimization.optimizedTitleEs && optimization.optimizedTitleEs !== article.titleEs) {
          updates.titleEs = optimization.optimizedTitleEs;
        }
        if (optimization.suggestedSlug && optimization.suggestedSlug !== article.slug) {
          const [existing] = await db.select({ id: news.id }).from(news)
            .where(eq(news.slug, optimization.suggestedSlug));
          if (!existing || existing.id === articleId) {
            updates.slug = optimization.suggestedSlug;
          }
        }
        if (optimization.metaDescription && optimization.metaDescription !== article.excerpt) {
          updates.excerpt = optimization.metaDescription;
        }
        if (optimization.metaDescriptionEs && optimization.metaDescriptionEs !== article.excerptEs) {
          updates.excerptEs = optimization.metaDescriptionEs;
        }

        if (Object.keys(updates).length > 0) {
          await db.update(news).set(updates).where(eq(news.id, articleId));
        }
      }

      return {
        success: true,
        data: {
          articleId,
          currentScore: currentSeoScore,
          optimizedScore: optimization.seoScore,
          optimization,
          changesApplied: applyChanges && optimization.seoScore > currentSeoScore,
        },
        metrics: {
          currentScore: currentSeoScore,
          optimizedScore: optimization.seoScore,
          improvement: optimization.seoScore - currentSeoScore,
        },
      };
    } catch (error) {
      console.error('[SEOOptimizerAgent] SEO optimization failed:', error);
      return { success: false, error: `SEO optimization failed: ${error}` };
    }
  }

  private calculateCurrentSeoScore(article: typeof news.$inferSelect): number {
    let score = 0;

    const title = article.title || '';
    if (title.length >= 30 && title.length <= 60) score += 20;
    else if (title.length > 0) score += 10;

    const titleEs = article.titleEs || '';
    if (titleEs.length >= 30 && titleEs.length <= 60) score += 10;
    else if (titleEs.length > 0) score += 5;

    const excerpt = article.excerpt || '';
    if (excerpt.length >= 100 && excerpt.length <= 160) score += 20;
    else if (excerpt.length > 50) score += 10;

    const slug = article.slug || '';
    if (slug.length > 0 && slug.length <= 50 && !slug.includes('_')) score += 15;

    const content = article.content || article.contentEs || '';
    if (content.length > 1000) score += 20;
    else if (content.length > 500) score += 10;

    if (article.title && article.titleEs) score += 10;
    if (article.excerpt && article.excerptEs) score += 5;

    return Math.min(score, 100);
  }
}

export const seoOptimizerAgent = new SEOOptimizerAgent();
