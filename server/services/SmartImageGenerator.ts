import { GoogleGenAI, Modality } from "@google/genai";
import type { AiDataClassification } from '@shared/aiGovernance';
import { getImageClient, hasDedicatedImageClient } from '../openai';
import { AiGovernanceBlockedError } from '../ai/dataGovernance';
import { executeAiProviderCall } from '../ai/gateway';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { storage } from '../storage';
import { getConfigMap } from '../mirror/siteConfig';
import { recordImageUsage } from './usageTracker';
import { AsyncLocalStorage } from 'node:async_hooks';
import {
  deletePersistentMediaObjects,
  persistPublicMediaFiles,
  PersistentMediaUnavailableError,
} from '../media/persistentMedia';

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
  engine: 'cloudflare' | 'gptimage2' | 'gptimage' | 'dalle3' | 'gemini' | 'placeholder';
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
  private readonly logStorage = new AsyncLocalStorage<string[]>();

  private get transparencyLog(): string[] {
    return this.logStorage.getStore() || [];
  }

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
      sanitized = `Realistic documentary photograph: ${sanitized}. Neutral real-world editorial scene, natural lighting, no people in distress, calm and professional atmosphere. Photojournalism, not an illustration.`;
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

    const msg = errorMessage.toLowerCase();
    return {
      code: errorCode,
      // OJO: NO tratar cualquier 400 como content policy — un 400 puede ser tamaño/param
      // inválido (p.ej. size no soportado por el modelo) y eso NO debe abortar el fallback.
      isContentPolicy: errorCode === 'content_policy_violation' ||
                       msg.includes('safety') ||
                       msg.includes('content policy') ||
                       msg.includes('content_policy') ||
                       msg.includes('moderation'),
      isRateLimit: errorCode === 'rate_limit_exceeded' || status === 429,
      isTimeout: errorCode === 'timeout' || status === 504 || status === 503 ||
                 errorMessage.toLowerCase().includes('timeout'),
    };
  }

  // Tamaños que aceptan los modelos GPT Image (son distintos a DALL-E 3):
  // 1024x1024/1536x1024/1024x1536 (no 1792); dall-e-3 usa 1024x1024/1792x1024/1024x1792.
  private gptImageSize(aspect: string): '1024x1024' | '1536x1024' | '1024x1536' {
    const a = (aspect || '1:1').trim();
    return a === '16:9' ? '1536x1024' : a === '9:16' ? '1024x1536' : '1024x1024';
  }
  private dalleSize(aspect: string): '1024x1024' | '1792x1024' | '1024x1792' {
    const a = (aspect || '1:1').trim();
    return a === '16:9' ? '1792x1024' : a === '9:16' ? '1024x1792' : '1024x1024';
  }

  /**
   * Genera una imagen con OpenAI y devuelve el BUFFER final (no una URL).
   * Modelo primario: gpt-image-2 en calidad media. Es el modelo vigente de mayor calidad y
   * `medium` evita el costo/latencia de `high` para imágenes editoriales de redes. Si la cuenta
   * todavía no tiene acceso, se intenta gpt-image-1 y finalmente DALL-E 3.
   */
  private async callOpenAIImage(
    prompt: string,
    maxRetries: number,
    aspect: string,
    classification: AiDataClassification,
  ): Promise<{ buffer?: Buffer; name?: 'gptimage2' | 'gptimage' | 'dalle3'; error?: string; errorCode?: string }> {
    // El proxy de AI Integrations de Replit sirve texto, pero no el endpoint de imágenes.
    // Fallar de inmediato evita esperar un timeout largo contra un endpoint que nunca podrá
    // responder. Cloudflare todavía puede operar como respaldo cuando está configurado.
    if (!hasDedicatedImageClient()) {
      return {
        error: 'Falta una API key directa de OpenAI para generar imágenes',
        errorCode: 'openai_image_key_missing',
      };
    }
    let lastError: any = null;
    const backoffTimes = [0, 5000, 10000, 20000];
    const modelFallbacks = ['gpt-image-2', 'gpt-image-1', 'dall-e-3'] as const;
    let modelIndex = 0;
    let model: (typeof modelFallbacks)[number] = modelFallbacks[modelIndex];
    const IMAGE_QUALITY: 'low' | 'medium' | 'high' = 'medium';

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (attempt > 0) {
        const waitTime = backoffTimes[attempt] || 20000;
        this.log(`OpenAI image retry ${attempt}/${maxRetries - 1}, waiting ${waitTime / 1000}s...`);
        await this.sleep(waitTime);
      }

      try {
        // Cliente dedicado (api.openai.com con OPENAI_IMAGE_API_KEY). El proxy de Replit NO
        // soporta imágenes, por eso se usa getImageClient() apuntado al OpenAI real.
        if (model !== 'dall-e-3') {
          const request = {
            model,
            prompt,
            n: 1,
            size: this.gptImageSize(aspect),
            quality: IMAGE_QUALITY,
            // JPEG reduce el tiempo y el tamaño de la respuesta. El archivo se normaliza con
            // Sharp antes de persistirlo, igual que el resto de imágenes del panel.
            output_format: 'jpeg',
            output_compression: 88,
          } as any;
          const res = await executeAiProviderCall({
            context: {
              classification,
              purpose: 'editorial_image',
              source: 'agent',
              agentId: 'image_suggestion',
            },
            payload: prompt,
            provider: 'openai',
            operation: 'image',
            invoke: () => getImageClient().images.generate(request),
          });
          const b64 = (res.data?.[0] as any)?.b64_json as string | undefined;
          if (b64) {
            this.log(`${model} generó imagen (intento ${attempt + 1}, quality ${IMAGE_QUALITY})`);
            recordImageUsage(this.gptImageSize(aspect), model, IMAGE_QUALITY);
            return {
              buffer: Buffer.from(b64, 'base64'),
              name: model === 'gpt-image-2' ? 'gptimage2' : 'gptimage',
            };
          }
          lastError = new Error(`${model} no devolvió b64_json`);
        } else {
          const request = {
            model: 'dall-e-3',
            prompt,
            n: 1,
            size: this.dalleSize(aspect),
            quality: 'standard' as const,
          };
          const res = await executeAiProviderCall({
            context: {
              classification,
              purpose: 'editorial_image',
              source: 'agent',
              agentId: 'image_suggestion',
            },
            payload: prompt,
            provider: 'openai',
            operation: 'image',
            invoke: () => getImageClient().images.generate(request),
          });
          const url = res.data?.[0]?.url;
          if (url) {
            this.log(`dall-e-3 generó imagen (intento ${attempt + 1})`);
            recordImageUsage(this.dalleSize(aspect), 'dall-e-3');
            return { buffer: await this.downloadImage(url), name: 'dalle3' };
          }
          lastError = new Error('dall-e-3 no devolvió url');
        }
      } catch (err: any) {
        if (err instanceof AiGovernanceBlockedError) throw err;
        lastError = err;
        const parsed = this.parseOpenAIError(err);
        const status = err?.status ?? err?.response?.status;
        const msg = (err?.message || err?.error?.message || '').toLowerCase();
        this.log(`OpenAI image (${model}) intento ${attempt + 1} falló: ${parsed.code} / ${status || "unknown"}`);

        // Modelo no disponible para la cuenta → intenta el siguiente sin aplicar backoff.
        if (
          model !== 'dall-e-3' &&
          (status === 403 ||
            msg.includes('must be verified') ||
            msg.includes('verify your organization') ||
            msg.includes('not have access') ||
            parsed.code === 'model_not_found' ||
            msg.includes('does not exist') ||
            msg.includes('unsupported'))
        ) {
          modelIndex += 1;
          model = modelFallbacks[modelIndex];
          this.log(`Modelo de imagen no disponible; usando respaldo ${model}.`);
          attempt--; // que este intento no consuma un reintento
          continue;
        }

        if (parsed.isContentPolicy) {
          return { error: 'Content policy violation', errorCode: 'content_policy_violation' };
        }
        if (err?.code === 'billing_hard_limit_reached' || msg.includes('billing')) {
          return { error: 'OpenAI billing/credit limit', errorCode: 'billing_limit' };
        }
        if (!parsed.isRateLimit && !parsed.isTimeout) {
          break;
        }
      }
    }

    return {
      error: 'OpenAI image generation failed after retries',
      errorCode: 'openai_generation_failed',
    };
  }

  // Motor gratuito (Cloudflare Workers AI, free tier: 10,000 Neurons/día, sin tarjeta,
  // sin cobro automático al agotarse — las solicitudes solo fallan hasta el reinicio
  // diario a las 00:00 UTC). Se intenta primero para minimizar el uso de Gemini/DALL-E de pago.
  private async callCloudflareFlux(
    prompt: string,
    classification: AiDataClassification,
  ): Promise<{ buffer?: Buffer; error?: string; errorCode?: string }> {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    if (!accountId || !apiToken) {
      return { error: 'Cloudflare no está configurado (faltan credenciales)', errorCode: 'cloudflare_not_configured' };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await executeAiProviderCall({
        context: {
          classification,
          purpose: 'editorial_image',
          source: 'agent',
          agentId: 'image_suggestion',
        },
        payload: prompt,
        provider: 'cloudflare',
        operation: 'image',
        metered: false,
        invoke: () => fetch(
          `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
          {
            method: 'POST',
            signal: controller.signal,
            headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, num_steps: 4 }),
          },
        ),
      });

      if (res.status === 429) {
        return { error: 'Cuota diaria gratuita de Cloudflare agotada', errorCode: 'cloudflare_quota_exhausted' };
      }
      if (!res.ok) {
        return { error: `Cloudflare HTTP ${res.status}`, errorCode: 'cloudflare_http_error' };
      }

      const data: any = await res.json();
      if (!data?.success || !data?.result?.image) {
        return { error: 'Cloudflare no devolvió una imagen', errorCode: 'cloudflare_no_image' };
      }

      this.log('Cloudflare Workers AI (flux-1-schnell) generó la imagen correctamente');
      return { buffer: Buffer.from(data.result.image, 'base64') };
    } catch (err: any) {
      if (err instanceof AiGovernanceBlockedError) throw err;
      const isTimeout = err?.name === 'AbortError';
      return { error: isTimeout ? 'Cloudflare timeout' : 'Cloudflare image generation failed', errorCode: isTimeout ? 'cloudflare_timeout' : 'cloudflare_error' };
    } finally {
      clearTimeout(timer);
    }
  }

  private async callGeminiImageGen(
    prompt: string,
    classification: AiDataClassification,
  ): Promise<{ buffer?: Buffer; error?: string; errorCode?: string }> {
    try {
      this.log('Attempting Gemini image generation...');
      const request = {
        model: "gemini-2.5-flash-image",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      };
      const response = await executeAiProviderCall({
        context: {
          classification,
          purpose: 'editorial_image',
          source: 'agent',
          agentId: 'image_suggestion',
        },
        payload: prompt,
        provider: 'gemini',
        operation: 'image',
        invoke: () => geminiAI.models.generateContent(request),
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
      if (err instanceof AiGovernanceBlockedError) throw err;
      this.log("Gemini image generation failed");
      return { error: 'Gemini image generation failed', errorCode: 'gemini_error' };
    }
  }

  async generateImage(
    originalPrompt: string,
    articleId: string,
    aspectOverride?: string,
    classification: AiDataClassification = 'internal',
  ): Promise<ImageGenerationResult> {
    return this.logStorage.run(
      [],
      () => this.generateImageInternal(originalPrompt, articleId, aspectOverride, classification),
    );
  }

  private async generateImageInternal(
    originalPrompt: string,
    articleId: string,
    aspectOverride: string | undefined,
    classification: AiDataClassification,
  ): Promise<ImageGenerationResult> {
    this.log(`Starting smart image generation for article ${articleId}`);
    
    const result: ImageGenerationResult = {
      success: false,
      engine: 'placeholder',
      originalPrompt,
      promptWasSanitized: false,
      retryCount: 0,
      transparencyLog: [],
    };

    const brandEnhancedPrompt = `${originalPrompt}. Style: realistic editorial documentary photograph, photojournalism, natural lighting, candid real-world scene, high detail, DSLR photo. NOT an illustration, NOT a cartoon, NOT a drawing, NOT a 3D render, NOT digital art. No text, no watermark, no logo, no captions.`;

    // Motor elegible por config (site_config.image_engine): 'openai' (GPT Image 2, principal por
    // defecto) o 'cloudflare' (gratis, requiere credenciales CLOUDFLARE_*). Se intenta el elegido
    // primero y el otro como respaldo. Gemini se retiró del flujo.
    const config = await getConfigMap();
    const primary = (config.image_engine?.value || 'openai').trim().toLowerCase() === 'cloudflare'
      ? 'cloudflare'
      : 'openai';
    const order: Array<'openai' | 'cloudflare'> =
      primary === 'cloudflare' ? ['cloudflare', 'openai'] : ['openai', 'cloudflare'];

    // Proporción elegida (1:1 / 16:9 / 9:16). Cada motor la mapea a su tamaño soportado
    // internamente (gpt-image-1 y dall-e-3 aceptan tamaños distintos).
    const aspect = (aspectOverride || config.image_aspect?.value || '1:1').trim();

    // Ejecuta un motor y devuelve un buffer.
    const runEngine = async (
      engine: 'openai' | 'cloudflare',
      prompt: string,
    ): Promise<{ buffer?: Buffer; name?: 'gptimage2' | 'gptimage' | 'dalle3' | 'cloudflare'; error?: string; errorCode?: string }> => {
      if (engine === 'openai') {
        // callOpenAIImage ya devuelve el buffer final (GPT Image en base64 o fallback descargado).
        const r = await this.callOpenAIImage(prompt, 1, aspect, classification);
        return r.buffer ? { buffer: r.buffer, name: r.name } : { error: r.error, errorCode: r.errorCode };
      }
      const r = await this.callCloudflareFlux(prompt, classification);
      return r.buffer ? { buffer: r.buffer, name: 'cloudflare' } : { error: r.error, errorCode: r.errorCode };
    };

    let lastError = '';
    let savedOutputPath = '';
    let persistedObjectNames: string[] = [];
    for (const engine of order) {
      this.log(`Intentando motor de imágenes: ${engine}${engine === primary ? ' (principal)' : ' (respaldo)'}...`);
      let attempt = await runEngine(engine, brandEnhancedPrompt);
      result.retryCount++;

      // Reintento con prompt saneado si el motor rechaza por política de contenido (términos legales sensibles).
      if (!attempt.buffer && attempt.errorCode === 'content_policy_violation') {
        const { sanitized, wasSanitized, changes } = this.sanitizePromptForContentPolicy(originalPrompt);
        if (wasSanitized) {
          result.sanitizedPrompt = sanitized;
          result.promptWasSanitized = true;
          this.log(`Prompt saneado para ${engine}. Cambios: ${changes.join(', ')}`);
          const sanitizedBrandPrompt = `${sanitized}. Style: realistic editorial documentary photograph, photojournalism, natural lighting. NOT an illustration, NOT a cartoon, NOT a 3D render. No text, no watermark, no logo.`;
          attempt = await runEngine(engine, sanitizedBrandPrompt);
          result.retryCount++;
        }
      }

      if (attempt.buffer) {
        let outputPath = "";
        try {
          const filename = `article-${articleId}-${attempt.name}-${Date.now()}.png`;
          outputPath = path.join(OUTPUT_DIR, filename);
          // Por defecto NO se estampa el logo (el usuario pidió imágenes de fotoperiodismo sin
          // branding). Reactivable poniendo site_config.image_overlay_logo = 'true'.
          const stampLogo = (config.image_overlay_logo?.value || '').trim().toLowerCase() === 'true';
          if (stampLogo) {
            await this.overlayLogo(attempt.buffer, outputPath);
          } else {
            await sharp(attempt.buffer).png().toFile(outputPath);
          }
          const persistence = await persistPublicMediaFiles([{
            absolutePath: outputPath,
            publicPath: `/generated-images/${filename}`,
          }]);
          savedOutputPath = outputPath;
          persistedObjectNames = persistence.objectNames;
          result.success = true;
          result.engine = attempt.name!;
          result.imageUrl = `/generated-images/${filename}`;
          this.log(`SUCCESS: imagen de ${attempt.name} guardada${stampLogo ? ' con logo' : ' (sin logo, foto realista)'}: ${result.imageUrl}`);
          break;
        } catch (saveErr: any) {
          if (outputPath) {
            try {
              fs.unlinkSync(outputPath);
            } catch {
              // El archivo quizá no llegó a crearse.
            }
          }
          if (saveErr instanceof PersistentMediaUnavailableError) {
            this.log('App Storage no está disponible; la imagen no se publicó para evitar pérdida de datos.');
            lastError = 'El almacenamiento persistente de imágenes no está disponible';
            break;
          }
          this.log(`Guardado de ${engine} falló: ${saveErr.message}`);
          lastError = saveErr.message;
        }
      } else {
        this.log(`${engine} falló: ${attempt.error}. Probando el siguiente motor...`);
        lastError = attempt.error || lastError;
      }
    }

    // Fallback final: placeholder SVG.
    if (!result.success) {
      // Pista accionable: la causa #1 en Replit es pedir imágenes contra el proxy de
      // AI Integrations (solo chat) sin una key real de OpenAI para imágenes.
      const hint = !hasDedicatedImageClient()
        ? ' — No se detectó una API key real de OpenAI para imágenes (define OPENAI_IMAGE_API_KEY u OPENAI_API_KEY en Secrets); el proxy de texto de Replit no ofrece el endpoint de imágenes.'
        : ' — Hay una key de OpenAI configurada, pero la generación de imagen falló; revisa acceso al modelo, facturación y crédito.';
      this.log(`Todos los motores fallaron. Asignando placeholder.${hint}`);
      result.engine = 'placeholder';
      result.imageUrl = '/placeholder-article.svg';
      result.success = true;
      result.fallbackUsed = true;
      result.errorMessage = (lastError || 'Todos los motores de imagen fallaron') + hint;
    }

    result.transparencyLog = [...this.transparencyLog];

    const summaryLog = result.success && result.engine !== 'placeholder'
      ? `Image generated using ${result.engine.toUpperCase()}${result.promptWasSanitized ? ' (prompt sanitized for safety)' : ''}`
      : `Image generation failed, placeholder assigned: ${result.errorMessage}`;

    this.log(summaryLog);

    // Registra la imagen en el historial reutilizable (galería del panel) — solo assets reales,
    // no el placeholder de fallback, que no sirve para reutilizarse en otro artículo.
    if (result.success && result.engine !== 'placeholder' && result.imageUrl) {
      // articleId es FK a news.id (UUID). Los llamadores de presentaciones ("presentation-…")
      // y del editor manual ("manual-…") pasan ids SINTÉTICOS que NO existen en news → el INSERT
      // violaba la FK (23503) y se tragaba en el catch → la imagen NUNCA entraba a la galería.
      // Fix: si el articleId no tiene forma de UUID, guardar NULL (la columna es nullable con
      // onDelete:set null, y getGeneratedImages usa leftJoin, así que igual aparece en la galería).
      const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const safeArticleId = articleId && UUID_RE.test(articleId) ? articleId : null;
      const row = {
        imageUrl: result.imageUrl,
        prompt: result.originalPrompt,
        sanitizedPrompt: result.sanitizedPrompt,
        engine: result.engine,
        articleId: safeArticleId,
      };
      let historySaved = false;
      try {
        await storage.createGeneratedImage(row);
        historySaved = true;
      } catch (err: any) {
        // Red de seguridad: si aun con UUID el INSERT falla por FK (noticia borrada entre la
        // generación y el guardado), reintentar con articleId NULL para no perder el asset.
        if (/foreign key|23503/i.test(err?.message || err?.code || '')) {
          try {
            await storage.createGeneratedImage({ ...row, articleId: null });
            historySaved = true;
          } catch (err2: any) {
            this.log(`Failed to record generated image in gallery history (retry): ${err2.message}`);
          }
        } else {
          this.log("Failed to record generated image in gallery history");
        }
      }
      if (!historySaved) {
        // Nunca se reporta una generación como exitosa si el archivo no quedó
        // asociado a su historial permanente. La limpieza es compensatoria de
        // una operación incompleta; no elimina ningún registro ya confirmado.
        await deletePersistentMediaObjects(persistedObjectNames);
        if (savedOutputPath) {
          try {
            fs.unlinkSync(savedOutputPath);
          } catch {
            // El archivo local puede no existir en un deployment efímero.
          }
        }
        result.success = false;
        result.engine = 'placeholder';
        result.imageUrl = undefined;
        result.errorCode = 'history_save_failed';
        result.errorMessage = 'La imagen no pudo registrarse en el historial permanente.';
        this.log('La imagen se descartó porque no pudo registrarse en el historial permanente.');
      }
    }

    return result;
  }
}

export const smartImageGenerator = new SmartImageGenerator();
