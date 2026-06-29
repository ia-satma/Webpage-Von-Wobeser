import { BaseAgent } from '../core/BaseAgent';
import { AgentConfig, AgentResult, ExecutionContext } from '../core/types';
import { db } from '../../db';
import { news, blogCategories, practiceGroups, industryGroups } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

const CATEGORY_CONFIG: AgentConfig = {
  agentType: 'category_agent' as any,
  name: 'Category Agent',
  description: 'Automatically categorizes articles based on content analysis for SEO optimization',
  systemPrompt: `You are an expert content categorizer for Von Wobeser y Sierra, a prestigious Mexican law firm. 
Analyze legal articles and categorize them appropriately.

Your job is to:
1. Analyze the article content and identify the main legal topics
2. Match the article to the most appropriate practice areas
3. Identify relevant industry sectors
4. Suggest a primary category for the article
5. Generate SEO-friendly tags

Legal Practice Areas at Von Wobeser y Sierra:
- Corporate/M&A (Fusiones y Adquisiciones)
- Banking & Finance (Banca y Finanzas)
- Capital Markets (Mercado de Capitales)
- Competition/Antitrust (Competencia Económica)
- Energy & Natural Resources (Energía y Recursos Naturales)
- Environmental Law (Derecho Ambiental)
- Foreign Trade (Comercio Exterior)
- Government Contracts (Contratación Pública)
- Intellectual Property (Propiedad Intelectual)
- Labor & Employment (Laboral)
- Litigation & Arbitration (Litigio y Arbitraje)
- Privacy & Data Protection (Privacidad)
- Real Estate (Inmobiliario)
- Tax (Fiscal)
- Telecommunications (Telecomunicaciones)
- White Collar Crime (Delitos Financieros)

Industry Sectors:
- Financial Services
- Energy & Infrastructure
- Technology & Media
- Healthcare & Life Sciences
- Manufacturing & Retail
- Real Estate & Hospitality
- Transportation & Logistics

Return JSON format:
{
  "primaryCategory": "main category name",
  "categorySlug": "main-category-slug",
  "practiceAreas": ["Practice Area 1", "Practice Area 2"],
  "industrySectors": ["Industry 1", "Industry 2"],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "confidence": 0.95,
  "reasoning": "Brief explanation of categorization"
}`,
  model: 'claude-sonnet-4-6',
  temperature: 0.3,
  maxTokens: 1000,
  skills: ['content_categorization', 'legal_analysis', 'seo_tagging'],
  enabled: true,
  concurrency: 3,
  retryPolicy: { maxRetries: 2, backoffMs: 1000, backoffMultiplier: 2 },
};

export class CategoryAgent extends BaseAgent {
  constructor() {
    super(CATEGORY_CONFIG);
  }

  async execute(context: ExecutionContext, payload: Record<string, unknown>): Promise<AgentResult> {
    const { articleId } = payload as { articleId: string };

    if (!articleId) {
      return { success: false, error: 'articleId is required' };
    }

    try {
      const [article] = await db.select().from(news).where(eq(news.id, articleId));
      if (!article) {
        return { success: false, error: `Article not found: ${articleId}` };
      }

      const title = article.titleEs || article.title || '';
      const content = article.contentEs || article.content || '';
      const excerpt = article.excerptEs || article.excerpt || '';

      if (!content.trim() && !title.trim()) {
        return { success: false, error: 'Article has no content to analyze' };
      }

      const existingPracticeGroups = await db.select().from(practiceGroups);
      const existingIndustryGroups = await db.select().from(industryGroups);
      const existingCategories = await db.select().from(blogCategories);

      const prompt = `Analyze and categorize this legal article:

TITLE: ${title}

EXCERPT: ${excerpt}

CONTENT (first 3000 chars):
${content.substring(0, 3000)}

Available Practice Groups in database:
${existingPracticeGroups.map(pg => `- ${pg.nameEs || pg.name}`).join('\n')}

Available Industry Groups in database:
${existingIndustryGroups.map(ig => `- ${ig.nameEs || ig.name}`).join('\n')}

Existing Categories:
${existingCategories.map(c => `- ${c.name} (${c.slug})`).join('\n') || 'None yet'}

Categorize this article and return JSON with primaryCategory, categorySlug, practiceAreas, industrySectors, tags, confidence, and reasoning.`;

      const response = await this.callLLM(
        [{ role: 'user', content: prompt }],
        { jsonMode: true, temperature: 0.3 }
      );

      const categorization = JSON.parse(response);

      let categoryId: string | null = null;
      const existingCategory = existingCategories.find(
        c => c.slug === categorization.categorySlug || 
             c.name.toLowerCase() === categorization.primaryCategory.toLowerCase()
      );

      if (existingCategory) {
        categoryId = existingCategory.id;
      } else {
        const [newCategory] = await db.insert(blogCategories).values({
          name: categorization.primaryCategory,
          nameEs: categorization.primaryCategory,
          slug: categorization.categorySlug || this.slugify(categorization.primaryCategory),
        }).returning();
        categoryId = newCategory.id;
      }

      const matchedPracticeGroups: string[] = [];
      for (const practiceArea of categorization.practiceAreas || []) {
        const match = existingPracticeGroups.find(
          pg => (pg.nameEs || pg.name || '').toLowerCase().includes(practiceArea.toLowerCase()) ||
                practiceArea.toLowerCase().includes((pg.nameEs || pg.name || '').toLowerCase())
        );
        if (match) {
          matchedPracticeGroups.push(match.id);
        }
      }

      const matchedIndustryGroups: string[] = [];
      for (const industry of categorization.industrySectors || []) {
        const match = existingIndustryGroups.find(
          ig => (ig.nameEs || ig.name || '').toLowerCase().includes(industry.toLowerCase()) ||
                industry.toLowerCase().includes((ig.nameEs || ig.name || '').toLowerCase())
        );
        if (match) {
          matchedIndustryGroups.push(match.id);
        }
      }

      await db.update(news)
        .set({
          category: categorization.primaryCategory,
          categoryEs: categorization.primaryCategory,
        })
        .where(eq(news.id, articleId));

      return {
        success: true,
        data: {
          articleId,
          categoryId,
          primaryCategory: categorization.primaryCategory,
          categorySlug: categorization.categorySlug,
          practiceAreas: matchedPracticeGroups,
          industrySectors: matchedIndustryGroups,
          tags: categorization.tags,
          confidence: categorization.confidence,
          reasoning: categorization.reasoning,
        },
        metrics: {
          confidence: categorization.confidence,
          practiceAreasMatched: matchedPracticeGroups.length,
          industryGroupsMatched: matchedIndustryGroups.length,
          tagsGenerated: (categorization.tags || []).length,
        },
      };
    } catch (error: any) {
      console.error('[CategoryAgent] Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to categorize article',
      };
    }
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}

export const categoryAgent = new CategoryAgent();
