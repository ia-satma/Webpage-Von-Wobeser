import { BaseAgent } from '../core/BaseAgent';
import { AgentConfig, AgentResult, ExecutionContext } from '../core/types';
import { openai } from '../../openai';
import { db } from '../../db';
import { news } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

const IMAGE_CONFIG: AgentConfig = {
  agentType: 'image_suggestion' as any,
  name: 'Image Suggestion Agent',
  description: 'Analyzes article content and generates fitting images using DALL-E 3',
  systemPrompt: `You are an expert at analyzing legal and corporate content to suggest creative, professional images.

When given an article about a law firm, analyze its content and:
1. Extract key themes and concepts
2. Generate a detailed image prompt that is visual, professional, and aligned with corporate aesthetics
3. Ensure the image concept matches the article tone (formal, professional, sophisticated)

Return JSON format:
{
  "imagePrompt": "detailed prompt for DALL-E 3",
  "themes": ["theme1", "theme2", "theme3"],
  "style": "corporate/professional description"
}`,
  model: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 500,
  skills: ['image_generation', 'content_analysis', 'visual_suggestion'],
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
      // Fetch article
      const [article] = await db.select().from(news).where(eq(news.id, articleId));
      if (!article) {
        return { success: false, error: `Article not found: ${articleId}` };
      }

      const content = article.contentEs || article.content || '';
      const title = article.titleEs || article.title || '';
      
      if (!content.trim()) {
        return { success: false, error: 'Article has no content' };
      }

      // Analyze content and suggest image prompt
      const analysisResult = await this.callLLM(
        [
          {
            role: 'user',
            content: `Article Title: ${title}\n\nArticle Content:\n${content.substring(0, 2000)}...`,
          },
        ],
        { jsonMode: true, maxTokens: 500 }
      );

      const analysis = JSON.parse(analysisResult);
      const imagePrompt = analysis.imagePrompt || 'A professional law firm image';

      // Generate image using DALL-E 3
      try {
        const image = await openai.images.generate({
          model: 'dall-e-3',
          prompt: imagePrompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
        });

        const imageUrl = image.data?.[0]?.url;

        return {
          success: true,
          data: {
            articleId,
            imageUrl,
            imagePrompt,
            themes: analysis.themes || [],
            style: analysis.style || 'professional',
          },
        };
      } catch (imageError: any) {
        console.error('DALL-E 3 generation error:', imageError);
        // Return prompt even if image generation fails
        return {
          success: true,
          data: {
            articleId,
            imagePrompt,
            themes: analysis.themes || [],
            style: analysis.style || 'professional',
            note: 'Image prompt generated but image generation failed',
          },
        };
      }
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
