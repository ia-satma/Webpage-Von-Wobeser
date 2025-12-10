import { BaseAgent } from '../core/BaseAgent';
import { AgentConfig, AgentResult, ExecutionContext } from '../core/types';
import { openai } from '../../openai';
import { db } from '../../db';
import { news } from '../../../shared/schema';
import { eq } from 'drizzle-orm';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

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
  model: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 600,
  skills: ['image_generation', 'content_analysis', 'visual_suggestion', 'brand_compliance'],
  enabled: true,
  concurrency: 2,
  retryPolicy: { maxRetries: 2, backoffMs: 1000, backoffMultiplier: 2 },
};

const LOGO_PATH = path.join(process.cwd(), 'attached_assets', 'vonwobeser_logo_hd.png');
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'generated-images');

async function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

async function overlayLogo(imageBuffer: Buffer, outputPath: string): Promise<string> {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const baseImage = sharp(imageBuffer);
  const metadata = await baseImage.metadata();
  const width = metadata.width || 1024;
  const height = metadata.height || 1024;

  // Brand guideline: Fixed 150px logo width on white background with padding
  const LOGO_WIDTH = 150;
  const PADDING = 12;
  const MARGIN = 20;

  let logoBuffer: Buffer;
  try {
    // Resize logo to fixed 150px width
    logoBuffer = await sharp(LOGO_PATH)
      .resize(LOGO_WIDTH, null, { fit: 'inside' })
      .toBuffer();
  } catch (logoError) {
    console.warn('[ImageSuggestionAgent] Logo file not found, saving image without overlay');
    await baseImage.toFile(outputPath);
    return outputPath;
  }

  const logoMetadata = await sharp(logoBuffer).metadata();
  const logoWidth = logoMetadata.width || LOGO_WIDTH;
  const logoHeight = logoMetadata.height || Math.round(LOGO_WIDTH * 0.5);

  // Create white background with padding
  const bgWidth = logoWidth + (PADDING * 2);
  const bgHeight = logoHeight + (PADDING * 2);
  
  const whiteBg = await sharp({
    create: {
      width: bgWidth,
      height: bgHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  // Composite logo directly on white background (logo is already visible, white bg provides contrast)
  // Note: Sharp doesn't have simple opacity, so we use the logo directly on white background
  // The white background itself provides the branding visibility against any image
  const logoOnWhite = await sharp(whiteBg)
    .composite([
      {
        input: logoBuffer,
        top: PADDING,
        left: PADDING,
      },
    ])
    .toBuffer();

  // Final composite: position in bottom-right corner
  await baseImage
    .composite([
      {
        input: logoOnWhite,
        top: height - bgHeight - MARGIN,
        left: width - bgWidth - MARGIN,
      },
    ])
    .toFile(outputPath);

  console.log(`[ImageSuggestionAgent] Logo overlay applied: ${LOGO_WIDTH}px width, white background with ${PADDING}px padding`);
  return outputPath;
}

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

      console.log(`[ImageSuggestionAgent] Starting image generation for article: ${articleId}`);
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
      
      const brandEnhancedPrompt = `${analysis.imagePrompt}. Style: Professional corporate legal, color scheme featuring deep burgundy red (#AA1A2E) with white and dark gray accents. Sharp geometric edges, no rounded corners. Sophisticated and elegant composition suitable for a prestigious law firm.`;

      console.log(`[ImageSuggestionAgent] Generated prompt: ${brandEnhancedPrompt.substring(0, 100)}...`);
      console.log(`[ImageSuggestionAgent] Calling DALL-E 3 API...`);

      try {
        const image = await openai.images.generate({
          model: 'dall-e-3',
          prompt: brandEnhancedPrompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
        });

        const imageUrl = image.data?.[0]?.url;

        if (!imageUrl) {
          return {
            success: true,
            data: {
              articleId,
              imagePrompt: brandEnhancedPrompt,
              themes: analysis.themes || [],
              style: analysis.style || 'Von Wobeser corporate',
              note: 'No image URL returned from DALL-E',
            },
          };
        }

        console.log(`[ImageSuggestionAgent] DALL-E image generated, downloading and adding logo overlay...`);

        const imageBuffer = await downloadImage(imageUrl);
        
        const filename = `article-${articleId}-${Date.now()}.png`;
        const outputPath = path.join(OUTPUT_DIR, filename);
        
        const savedPath = await overlayLogo(imageBuffer, outputPath);
        const publicUrl = `/generated-images/${filename}`;

        console.log(`[ImageSuggestionAgent] Image saved with logo overlay: ${publicUrl}`);

        await db.update(news)
          .set({ imageUrl: publicUrl })
          .where(eq(news.id, articleId));

        return {
          success: true,
          data: {
            articleId,
            imageUrl: publicUrl,
            originalDalleUrl: imageUrl,
            imagePrompt: brandEnhancedPrompt,
            themes: analysis.themes || [],
            style: analysis.style || 'Von Wobeser corporate',
            brandCompliant: true,
            logoOverlay: true,
          },
        };
      } catch (imageError: any) {
        console.error('[ImageSuggestionAgent] DALL-E 3 generation error:', imageError?.message || imageError);
        console.error('[ImageSuggestionAgent] Error details:', JSON.stringify({
          code: imageError?.code,
          status: imageError?.status,
          type: imageError?.type,
          message: imageError?.message
        }));
        
        let errorMessage = 'Image generation failed';
        if (imageError.code === 'billing_hard_limit_reached') {
          errorMessage = 'OpenAI billing limit reached - please check your API credits';
        } else if (imageError.code === 'content_policy_violation') {
          errorMessage = 'Content policy violation - prompt needs adjustment';
        } else if (imageError.status === 429) {
          errorMessage = 'Rate limit exceeded - please try again later';
        }

        return {
          success: false,
          error: errorMessage,
          data: {
            articleId,
            imagePrompt: brandEnhancedPrompt,
            themes: analysis.themes || [],
            style: analysis.style || 'Von Wobeser corporate',
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
