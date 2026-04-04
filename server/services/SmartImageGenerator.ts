import { GoogleGenAI, Modality } from "@google/genai";
import { openai } from '../openai';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const VON_WOBESER_BRAND = {
  primaryColor: '#AA1A2E',
  colorName: 'deep burgundy red',
  style: 'professional corporate legal',
  aesthetics: 'sophisticated, elegant, minimalist with sharp edges',
};

const LOGO_PATH = path.join(process.cwd(), 'attached_assets', 'vonwobeser_logo_hd.png');
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'generated-images');

const geminiAI = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

const SENSITIVE_LEGAL_TERMS = [
  'harassment', 'sexual', 'abuse', 'assault', 'violence', 'murder', 'killing',
  'corruption', 'bribery', 'fraud', 'embezzlement', 'money laundering',
  'drug', 'narcotics', 'trafficking', 'smuggling', 'cartel',
  'terrorism', 'terrorist', 'weapon', 'bomb', 'explosion',
  'rape', 'molestation', 'victim', 'crime scene', 'blood',
  'torture', 'execution', 'death penalty', 'prison', 'jail',
  'extortion', 'blackmail', 'kidnapping', 'ransom'
];

const ABSTRACT_REPLACEMENTS: Record<string, string> = {
  'harassment': 'corporate ethics and workplace harmony',
  'sexual harassment': 'professional workplace standards',
  'corruption': 'transparency and corporate governance',
  'bribery': 'ethical business practices',
  'fraud': 'financial integrity and trust',
  'money laundering': 'financial compliance and regulation',
  'drug': 'regulatory compliance',
  'trafficking': 'international trade law',
  'terrorism': 'security and risk management',
  'crime': 'legal proceedings',
  'victim': 'legal protection',
  'prison': 'justice system',
  'extortion': 'contractual disputes',
  'kidnapping': 'personal security law',
};

export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  engine: 'dalle3' | 'gemini' | 'placeholder';
  originalPrompt: string;
  sanitizedPrompt?: string;
  promptWasSanitized: boolean;
  retryCount: number;
  errorCode?: string;
  errorMessage?: string;
  transparencyLog: string[];
  fallbackUsed?: boolean;
}

export class SmartImageGenerator {
  private transparencyLog: string[] = [];

  private log(message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    this.transparencyLog.push(logEntry);
    console.log(`[SmartImageGenerator] ${message}`);
  }

  sanitizePromptForContentPolicy(prompt: string): { sanitized: string; wasSanitized: boolean; changes: string[] } {
    let sanitized = prompt.toLowerCase();
    const changes: string[] = [];
    let wasSanitized = false;

    for (const term of SENSITIVE_LEGAL_TERMS) {
      if (sanitized.includes(term.toLowerCase())) {
        const replacement = ABSTRACT_REPLACEMENTS[term] || 'professional legal services';
        sanitized = sanitized.replace(new RegExp(term, 'gi'), replacement);
        changes.push(`"${term}" → "${replacement}"`);
        wasSanitized = true;
      }
    }

    if (wasSanitized) {
      sanitized = `Abstract professional visualization: ${sanitized}. Modern corporate office environment with elegant burgundy red (#AA1A2E) accents, scales of justice symbolism, clean geometric shapes, sophisticated lighting, no people in distress, peaceful and professional atmosphere.`;
    } else {
      sanitized = prompt;
    }

    return { sanitized, wasSanitized, changes };
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async downloadImage(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Download timeout')), 30000);
      
      https.get(url, (response) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          clearTimeout(timeout);
          resolve(Buffer.concat(chunks));
        });
        response.on('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      }).on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  private async overlayLogo(imageBuffer: Buffer, outputPath: string): Promise<string> {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const baseImage = sharp(imageBuffer);
    const metadata = await baseImage.metadata();
    const width = metadata.width || 1024;
    const height = metadata.height || 1024;

    const LOGO_WIDTH = 150;
    const PADDING = 12;
    const MARGIN = 20;

    let logoBuffer: Buffer;
    try {
      logoBuffer = await sharp(LOGO_PATH)
        .resize(LOGO_WIDTH, null, { fit: 'inside' })
        .toBuffer();
    } catch (logoError) {
      this.log('Logo file not found, saving image without overlay');
      await baseImage.toFile(outputPath);
      return outputPath;
    }

    const logoMetadata = await sharp(logoBuffer).metadata();
    const logoWidth = logoMetadata.width || LOGO_WIDTH;
    const logoHeight = logoMetadata.height || Math.round(LOGO_WIDTH * 0.5);

    const bgWidth = logoWidth + (PADDING * 2);
    const bgHeight = logoHeight + (PADDING * 2);
    
    const whiteBg = await sharp({
      create: {
        width: bgWidth,
        height: bgHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    }).png().toBuffer();

    const logoOnWhite = await sharp(whiteBg)
      .composite([{ input: logoBuffer, top: PADDING, left: PADDING }])
      .toBuffer();

    await baseImage
      .composite([{
        input: logoOnWhite,
        top: height - bgHeight - MARGIN,
        left: width - bgWidth - MARGIN,
      }])
      .toFile(outputPath);

    return outputPath;
  }

  private parseOpenAIError(error: any): { code: string; isContentPolicy: boolean; isRateLimit: boolean; isTimeout: boolean } {
    const errorCode = error?.code || error?.error?.code || 'unknown';
    const errorMessage = error?.message || error?.error?.message || '';
    const status = error?.status || error?.response?.status;

    return {
      code: errorCode,
      isContentPolicy: errorCode === 'content_policy_violation' || 
                       status === 400 || 
                       errorMessage.toLowerCase().includes('safety') ||
                       errorMessage.toLowerCase().includes('content policy'),
      isRateLimit: errorCode === 'rate_limit_exceeded' || status === 429,
      isTimeout: errorCode === 'timeout' || status === 504 || status === 503 ||
                 errorMessage.toLowerCase().includes('timeout'),
    };
  }

  private async callDalle3(prompt: string, maxRetries: number = 3): Promise<{ url?: string; error?: string; errorCode?: string }> {
    let lastError: any = null;
    const backoffTimes = [0, 5000, 10000, 20000];

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (attempt > 0) {
        const waitTime = backoffTimes[attempt] || 20000;
        this.log(`DALL-E retry ${attempt}/${maxRetries - 1}, waiting ${waitTime / 1000}s...`);
        await this.sleep(waitTime);
      }

      try {
        const image = await openai.images.generate({
          model: 'dall-e-3',
          prompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
        });

        const imageUrl = image.data?.[0]?.url;
        if (imageUrl) {
          this.log(`DALL-E 3 generated image successfully on attempt ${attempt + 1}`);
          return { url: imageUrl };
        }
        lastError = new Error('No image URL returned');
      } catch (err: any) {
        lastError = err;
        const parsed = this.parseOpenAIError(err);
        
        this.log(`DALL-E attempt ${attempt + 1} failed: ${parsed.code} - ${err.message}`);

        if (parsed.isContentPolicy) {
          return { error: 'Content policy violation', errorCode: 'content_policy_violation' };
        }

        if (err?.code === 'billing_hard_limit_reached') {
          return { error: 'OpenAI billing limit reached', errorCode: 'billing_limit' };
        }

        if (!parsed.isRateLimit && !parsed.isTimeout) {
          break;
        }
      }
    }

    return { 
      error: lastError?.message || 'DALL-E generation failed after retries',
      errorCode: lastError?.code || 'unknown'
    };
  }

  private async callGeminiImageGen(prompt: string): Promise<{ buffer?: Buffer; error?: string; errorCode?: string }> {
    try {
      this.log('Attempting Gemini image generation...');
      
      const response = await geminiAI.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      });

      const candidate = response.candidates?.[0];
      const imagePart = candidate?.content?.parts?.find((part: any) => part.inlineData);
      
      if (!imagePart?.inlineData?.data) {
        return { error: 'No image data in Gemini response', errorCode: 'gemini_no_image' };
      }

      const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
      this.log('Gemini image generation successful');
      return { buffer: imageBuffer };
    } catch (err: any) {
      this.log(`Gemini image generation failed: ${err.message}`);
      return { error: err.message, errorCode: 'gemini_error' };
    }
  }

  async generateImage(originalPrompt: string, articleId: string): Promise<ImageGenerationResult> {
    this.transparencyLog = [];
    this.log(`Starting smart image generation for article ${articleId}`);
    
    const result: ImageGenerationResult = {
      success: false,
      engine: 'placeholder',
      originalPrompt,
      promptWasSanitized: false,
      retryCount: 0,
      transparencyLog: [],
    };

    const brandEnhancedPrompt = `${originalPrompt}. Style: Professional corporate legal, color scheme featuring deep burgundy red (#AA1A2E) with white and dark gray accents. Sharp geometric edges, no rounded corners. Sophisticated and elegant composition suitable for a prestigious law firm.`;

    // Step 1: Gemini (primary)
    this.log('Step 1: Attempting Gemini image generation (primary)...');
    const geminiResult = await this.callGeminiImageGen(brandEnhancedPrompt);
    result.retryCount++;

    if (geminiResult.buffer) {
      try {
        const filename = `article-${articleId}-gemini-${Date.now()}.png`;
        const outputPath = path.join(OUTPUT_DIR, filename);

        await this.overlayLogo(geminiResult.buffer, outputPath);

        result.success = true;
        result.engine = 'gemini';
        result.imageUrl = `/generated-images/${filename}`;
        this.log(`SUCCESS: Gemini image saved with logo overlay: ${result.imageUrl}`);
      } catch (saveErr: any) {
        this.log(`Gemini image save failed: ${saveErr.message}`);
      }
    } else {
      this.log(`Gemini failed: ${geminiResult.error}. Trying with sanitized prompt...`);

      const { sanitized, wasSanitized, changes } = this.sanitizePromptForContentPolicy(originalPrompt);
      if (wasSanitized) {
        result.sanitizedPrompt = sanitized;
        result.promptWasSanitized = true;
        this.log(`Prompt sanitized. Changes: ${changes.join(', ')}`);

        const sanitizedBrandPrompt = `${sanitized}. Style: Professional corporate legal, color scheme featuring deep burgundy red (#AA1A2E) with white and dark gray accents. Sharp geometric edges, sophisticated composition.`;
        const sanitizedResult = await this.callGeminiImageGen(sanitizedBrandPrompt);
        result.retryCount++;

        if (sanitizedResult.buffer) {
          try {
            const filename = `article-${articleId}-gemini-${Date.now()}.png`;
            const outputPath = path.join(OUTPUT_DIR, filename);

            await this.overlayLogo(sanitizedResult.buffer, outputPath);

            result.success = true;
            result.engine = 'gemini';
            result.imageUrl = `/generated-images/${filename}`;
            this.log(`SUCCESS: Gemini image (sanitized) saved: ${result.imageUrl}`);
          } catch (saveErr: any) {
            this.log(`Gemini sanitized image save failed: ${saveErr.message}`);
          }
        }
      }
    }

    // Step 2: Placeholder SVG fallback
    if (!result.success) {
      this.log('Step 2: Gemini failed. Assigning placeholder image.');
      result.engine = 'placeholder';
      result.imageUrl = '/placeholder-article.svg';
      result.success = true;
      result.fallbackUsed = true;
      result.errorMessage = geminiResult.error || 'All image generation engines failed';
    }

    result.transparencyLog = [...this.transparencyLog];

    const summaryLog = result.success && result.engine !== 'placeholder'
      ? `Image generated using ${result.engine.toUpperCase()}${result.promptWasSanitized ? ' (prompt sanitized for safety)' : ''}`
      : `Image generation failed, placeholder assigned: ${result.errorMessage}`;

    this.log(summaryLog);

    return result;
  }
}

export const smartImageGenerator = new SmartImageGenerator();
