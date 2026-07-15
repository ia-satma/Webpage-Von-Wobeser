import * as fs from 'fs';
import * as path from 'path';
import { openai } from '../openai';
import { storage } from '../storage';

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'generated-audio');

// Texto-a-voz vía el TTS de OpenAI, reusando el cliente/credencial de la "AI Integrations" de
// Replit que ya está conectada (AI_INTEGRATIONS_OPENAI_API_KEY/_BASE_URL, ver server/openai.ts).
// ElevenLabs NO forma parte del sistema de "AI Integrations" (Model Farm) de Replit — solo
// OpenAI/Anthropic/Gemini/OpenRouter viven ahí; ElevenLabs solo existe como Connector/Agent
// service en el catálogo amplio de Replit, con un mecanismo de credenciales distinto. Por eso
// se usa OpenAI TTS: cero configuración adicional, misma facturación que los otros 12 agentes.
const DEFAULT_VOICE = 'alloy'; // voces válidas: alloy, ash, ballad, coral, echo, fable, onyx, nova, sage, shimmer, verse
const MODEL = 'tts-1';

// Límite de OpenAI TTS: 4096 caracteres por solicitud.
const MAX_CHARS = 4000;

export interface AudioGenerationResult {
  success: boolean;
  audioUrl?: string;
  engine: 'openai_tts' | 'unavailable';
  sourceText: string;
  cleanedText?: string;
  voiceId: string;
  retryCount: number;
  errorCode?: string;
  errorMessage?: string;
  transparencyLog: string[];
}

/**
 * Limpia texto pensado para lectura visual (HTML, markdown, hashtags, emoji, URLs) antes de
 * mandarlo a texto-a-voz — leer un hashtag o una URL en voz alta suena mal y no aporta nada.
 */
export function cleanTextForSpeech(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, ' ') // tags HTML
    .replace(/https?:\/\/\S+/g, '') // URLs
    .replace(/#[A-Za-zÀ-ÖØ-öø-ÿ0-9_]+/g, '') // hashtags
    .replace(/[\uD83C-\uDBFF][\uDC00-\uDFFF]|[☀-➿]/g, '') // emoji (pares subrogados + símbolos BMP)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

export class VoiceGenerator {
  private transparencyLog: string[] = [];

  private log(message: string): void {
    const entry = `[${new Date().toISOString()}] ${message}`;
    this.transparencyLog.push(entry);
    console.log(`[VoiceGenerator] ${message}`);
  }

  private async callOpenAiTTS(
    text: string,
    voice: string,
  ): Promise<{ buffer?: Buffer; error?: string; errorCode?: string }> {
    try {
      const response = await openai.audio.speech.create(
        { model: MODEL, voice, input: text, response_format: 'mp3' },
        { maxRetries: 2, timeout: 30000 },
      );
      const arrayBuffer = await response.arrayBuffer();
      this.log('Audio generado correctamente');
      return { buffer: Buffer.from(arrayBuffer) };
    } catch (err: any) {
      const status = err?.status;
      if (status === 401) return { error: 'Credencial de OpenAI (AI Integrations) inválida o ausente', errorCode: 'unauthorized' };
      if (status === 429) return { error: 'Cuota/rate limit de OpenAI agotado', errorCode: 'rate_limit' };
      const isTimeout = err?.name === 'APIConnectionTimeoutError' || err?.name === 'AbortError';
      const message = isTimeout ? 'Timeout del TTS de OpenAI' : err?.message || 'Error desconocido';
      this.log(`Falló: ${message}`);
      return { error: message, errorCode: isTimeout ? 'timeout' : (status ? 'http_error' : 'network_error') };
    }
  }

  async generateSpeech(
    rawText: string,
    opts: { voiceId?: string; sourceType: string; articleId?: string | null },
  ): Promise<AudioGenerationResult> {
    this.transparencyLog = [];
    const voice = opts.voiceId?.trim() || DEFAULT_VOICE;
    this.log(`Iniciando generación de audio (fuente: ${opts.sourceType})`);

    const result: AudioGenerationResult = {
      success: false,
      engine: 'unavailable',
      sourceText: rawText,
      voiceId: voice,
      retryCount: 0,
      transparencyLog: [],
    };

    if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
      this.log('AI_INTEGRATIONS_OPENAI_API_KEY no está configurada.');
      result.errorMessage = 'El TTS de OpenAI no está configurado (falta AI_INTEGRATIONS_OPENAI_API_KEY).';
      result.errorCode = 'not_configured';
      result.transparencyLog = [...this.transparencyLog];
      return result;
    }

    const cleaned = cleanTextForSpeech(rawText).slice(0, MAX_CHARS);
    result.cleanedText = cleaned;

    if (!cleaned) {
      result.errorMessage = 'El texto quedó vacío después de limpiarlo para lectura en voz alta.';
      result.errorCode = 'empty_text';
      result.transparencyLog = [...this.transparencyLog];
      return result;
    }

    const ttsResult = await this.callOpenAiTTS(cleaned, voice);
    result.retryCount++;

    if (!ttsResult.buffer) {
      result.errorMessage = ttsResult.error;
      result.errorCode = ttsResult.errorCode;
      result.transparencyLog = [...this.transparencyLog];
      return result;
    }

    try {
      if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      }
      const filename = `${opts.sourceType}-${Date.now()}.mp3`;
      const outputPath = path.join(OUTPUT_DIR, filename);
      fs.writeFileSync(outputPath, ttsResult.buffer);

      result.success = true;
      result.engine = 'openai_tts';
      result.audioUrl = `/generated-audio/${filename}`;
      this.log(`Audio guardado: ${result.audioUrl}`);

      await storage.createGeneratedAudio({
        audioUrl: result.audioUrl,
        sourceText: cleaned,
        voiceId: voice,
        engine: 'openai_tts',
        sourceType: opts.sourceType,
        articleId: opts.articleId ?? null,
      });
    } catch (err: any) {
      this.log(`Fallo al guardar el audio: ${err.message}`);
      result.errorMessage = err.message;
      result.errorCode = 'save_failed';
    }

    result.transparencyLog = [...this.transparencyLog];
    return result;
  }
}

export const voiceGenerator = new VoiceGenerator();
