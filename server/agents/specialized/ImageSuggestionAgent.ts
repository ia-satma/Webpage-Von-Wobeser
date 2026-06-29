import { BaseAgent } from '../core/BaseAgent';
import { AgentConfig, AgentResult, ExecutionContext } from '../core/types';
import { db } from '../../db';
import { news } from '../../../shared/schema';
import { eq } from 'drizzle-orm';
import { smartImageGenerator } from '../../services/SmartImageGenerator';

const VON_WOBESER_BRAND = {
  primaryColor: '#AA1A2E',
  colorName: 'deep burgundy red',
  style: 'professional corporate legal',
  aesthetics: 'sophisticated, elegant, minimalist with sharp edges (no rounded corners)',
};

const IMAGE_CONFIG: AgentConfig = {
  agentType: 'image_suggestion' as any,
  name: 'Image Suggestion Agent',
  description: 'Analyzes article content and generates branded images using DALL-E 3 with Von Wobeser corporate identity',
  systemPrompt: `You are an expert at creating visual content for Von Wobeser y Sierra, a prestigious Mexican law firm.

BRAND GUIDELINES (Manual de Identidad Corporativa):
- Primary Color: ${VON_WOBESER_BRAND.primaryColor} (${VON_WOBESER_BRAND.colorName})
- Style: ${VON_WOBESER_BRAND.style}
- Aesthetics: ${VON_WOBESER_BRAND.aesthetics}
- NO rounded corners - all elements should have sharp, clean edges
- Color palette: burgundy red (#AA1A2E), white, dark grays, and gold accents

When analyzing an article, create an image prompt that:
1. Reflects the article's legal/corporate themes
2. Uses the brand's burgundy red color prominently or as accent
3. Maintains a sophisticated, professional corporate aesthetic
4. Avoids generic stock photo looks - aim for distinctive, elegant visuals
5. Incorporates architectural, geometric, or abstract elements when appropriate
6. Ensures all shapes have sharp corners (no rounded elements)

Return JSON format:
{
  "imagePrompt": "detailed prompt for DALL-E 3 that incorporates brand colors and style",
  "themes": ["theme1", "theme2", "theme3"],
  "style": "description of visual style used"
}`,
  model: 'claude-sonnet-4-6',
  temperature: 0.7,
  maxTokens: 600,
  skills: ['image_generation', 'content_analysis', 'visual_suggestion', 'brand_compliance'],
  enabled: true,
  concurrency: 2,
  retryPolicy: { maxRetries: 2, backoffMs: 1000, backoffMultiplier: 2 },
};

export class ImageSuggestionAgent extends BaseAgent {
  constructor() {
    super(IMAGE_CONFIG);
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

      const content = article.contentEs || article.content || '';
      const title = article.titleEs || article.title || '';
      
      if (!content.trim()) {
        return { success: false, error: 'Article has no content' };
      }

      console.log(`[ImageSuggestionAgent] Starting SMART image generation for article: ${articleId}`);
      console.log(`[ImageSuggestionAgent] Article title: ${title.substring(0, 50)}...`);

      const analysisResult = await this.callLLM(
        [
          {
            role: 'user',
            content: `Article Title: ${title}\n\nArticle Content:\n${content.substring(0, 2000)}...\n\nGenerate an image prompt that follows Von Wobeser brand guidelines (burgundy red #AA1A2E, professional corporate style, sharp edges - no rounded corners).`,
          },
        ],
        { jsonMode: true, maxTokens: 600 }
      );

      const analysis = JSON.parse(analysisResult);
      
      console.log(`[ImageSuggestionAgent] Delegating to SmartImageGenerator with cascade fallback...`);
      
      const imageResult = await smartImageGenerator.generateImage(
        analysis.imagePrompt || `Professional legal article image for: ${title}`,
        articleId
      );

      if (imageResult.success && imageResult.imageUrl) {
        await db.update(news)
          .set({ 
            imageUrl: imageResult.imageUrl,
            processingStatus: imageResult.engine === 'placeholder' ? 'partial_success' : 'ready',
            lastError: imageResult.engine === 'placeholder' ? imageResult.errorMessage : null,
            lastProcessedAt: new Date()
          })
          .where(eq(news.id, articleId));

        const engineMessage = imageResult.promptWasSanitized
          ? `${imageResult.engine.toUpperCase()} (prompt sanitized for safety filters)`
          : imageResult.engine.toUpperCase();

        console.log(`[ImageSuggestionAgent] SUCCESS via ${engineMessage}: ${imageResult.imageUrl}`);

        return {
          success: true,
          data: {
            articleId,
            imageUrl: imageResult.imageUrl,
            engine: imageResult.engine,
            imagePrompt: imageResult.originalPrompt,
            sanitizedPrompt: imageResult.sanitizedPrompt,
            promptWasSanitized: imageResult.promptWasSanitized,
            themes: analysis.themes || [],
            style: analysis.style || 'Von Wobeser corporate',
            brandCompliant: true,
            logoOverlay: imageResult.engine !== 'placeholder',
            imageGenerated: imageResult.engine !== 'placeholder',
            retryCount: imageResult.retryCount,
            transparencyLog: imageResult.transparencyLog,
          },
        };
      }

      return {
        success: false,
        error: imageResult.errorMessage || 'All image generation engines failed',
        data: {
          articleId,
          errorCode: imageResult.errorCode,
          retryCount: imageResult.retryCount,
          transparencyLog: imageResult.transparencyLog,
        },
      };
    } catch (error: any) {
      console.error('[ImageSuggestionAgent] Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate image suggestion',
      };
    }
  }
}

export const imageSuggestionAgent = new ImageSuggestionAgent();
