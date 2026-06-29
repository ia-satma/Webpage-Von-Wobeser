import { BaseAgent } from '../core/BaseAgent';
import { AgentConfig, AgentResult, ExecutionContext } from '../core/types';
import { db } from '../../db';
import { news } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

const FORMATTER_CONFIG: AgentConfig = {
  agentType: 'formatter',
  name: 'Article Formatter Agent',
  description: 'Cleans and formats article content extracted from PDFs',
  systemPrompt: `You are an expert document formatter for a prestigious law firm. Your task is to clean and format legal articles extracted from PDFs.

Rules:
1. Fix broken line breaks that split sentences mid-word or mid-phrase
2. Merge paragraphs that were incorrectly split
3. Preserve intentional paragraph breaks (after periods followed by new topics)
4. Remove page markers like "-- 1 of 2 --"
5. Clean up boilerplate footer text (contact info, disclaimers)
6. Preserve the article's structure: title, body, conclusion
7. Keep legal citations and references intact
8. Maintain bullet points and numbered lists
9. Do NOT change the actual content or meaning

Output format:
{
  "title": "cleaned title",
  "content": "cleaned and properly formatted content",
  "excerpt": "first 2-3 sentences as excerpt"
}`,
  model: 'claude-sonnet-4-6',
  temperature: 0.2,
  maxTokens: 8000,
  skills: ['text_cleanup', 'paragraph_detection', 'legal_formatting'],
  enabled: true,
  concurrency: 3,
  retryPolicy: { maxRetries: 3, backoffMs: 1000, backoffMultiplier: 2 },
};

export class FormatterAgent extends BaseAgent {
  constructor() {
    super(FORMATTER_CONFIG);
  }

  async execute(context: ExecutionContext, payload: Record<string, unknown>): Promise<AgentResult> {
    const { articleId, content, title } = payload as { articleId?: string; content?: string; title?: string };

    if (!articleId && !content) {
      return { success: false, error: 'Either articleId or content is required' };
    }

    let originalContent = content as string;
    let originalTitle = title as string;

    if (articleId) {
      const [article] = await db.select().from(news).where(eq(news.id, articleId));
      if (!article) {
        return { success: false, error: `Article not found: ${articleId}` };
      }
      originalContent = article.content || article.contentEs || '';
      originalTitle = article.title || article.titleEs || '';
    }

    if (!originalContent || originalContent.trim().length < 50) {
      return { success: false, error: 'Content too short to format' };
    }

    try {
      const cleanedContent = this.preClean(originalContent);
      
      const prompt = `Clean and format this legal article:

TITLE: ${originalTitle}

CONTENT:
${cleanedContent}

Return JSON with cleaned title, content, and excerpt.`;

      const response = await this.callLLM(
        [{ role: 'user', content: prompt }],
        { temperature: 0.2, jsonMode: true }
      );

      const result = JSON.parse(response);

      if (articleId) {
        await db.update(news)
          .set({
            title: result.title || originalTitle,
            titleEs: result.title || originalTitle,
            content: result.content,
            contentEs: result.content,
            excerpt: result.excerpt,
            excerptEs: result.excerpt,
          })
          .where(eq(news.id, articleId));
      }

      const metrics = {
        originalLength: originalContent.length,
        cleanedLength: result.content.length,
        reductionPercent: ((originalContent.length - result.content.length) / originalContent.length) * 100,
      };

      return {
        success: true,
        data: {
          articleId,
          title: result.title,
          content: result.content,
          excerpt: result.excerpt,
          ...metrics,
        },
        metrics,
      };
    } catch (error) {
      console.error('[FormatterAgent] Formatting failed:', error);
      return { success: false, error: `Formatting failed: ${error}` };
    }
  }

  private preClean(text: string): string {
    return text
      .replace(/-- \d+ of \d+ --/g, '')
      .replace(/VON WOBESER Y SIERRA, S\.C\./g, '')
      .replace(/Paseo de los Tamarindos 60, 05120 Ciudad de México/g, '')
      .replace(/\+52 \(55\) 5258 1000/g, '')
      .replace(/vonwobeser\.com/g, '')
      .replace(/La información incluida en esta nota no constituye[\s\S]*?abogados aquí mencionados\./g, '')
      .replace(/A T E N T A M E N T E/g, '')
      .replace(/Para obtener información adicional, contactar a:/g, '')
      .replace(/[a-z]+@vwys\.com\.mx/gi, '')
      .replace(/\+52 \(55\) \d{4}[- ]\d{4}/g, '')
      .replace(/\n{4,}/g, '\n\n\n')
      .trim();
  }
}

export const formatterAgent = new FormatterAgent();
