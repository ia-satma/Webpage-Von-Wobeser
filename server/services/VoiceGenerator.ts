import * as fs from 'fs';
import * as path from 'path';
import { hasOpenAITextClient, getOpenAIClient } from '../openai';
import { executeAiProviderCall } from '../ai/gateway';
import { storage } from '../storage';
import { recordAudioUsage } from "./usageTracker";
import { AsyncLocalStorage } from 'node:async_hooks';
import type { AiDataClassification } from '@shared/aiGovernance';
import {
  deletePersistentMediaObjects,
  persistPublicMediaFiles,
} from "../media/persistentMedia";

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'generated-audio');

// Texto-a-voz vía el TTS de OpenAI, reusando la credencial directa del cliente o, como
// respaldo, la integración administrada de Replit (ver server/openai.ts).
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
  private readonly logStorage = new AsyncLocalStorage<string[]>();

  private get transparencyLog(): string[] {
    return this.logStorage.getStore() || [];
  }

  private log(message: string): void {
    const entry = `[${new Date().toISOString()}] ${message}`;
    this.transparencyLog.push(entry);
    console.log(`[VoiceGenerator] ${message}`);
  }

  private async callOpenAiTTS(
    text: string,
    voice: string,
    classification: AiDataClassification,
  ): Promise<{ buffer?: Buffer; error?: string; errorCode?: string }> {
    try {
      const request = { model: MODEL, voice, input: text, response_format: 'mp3' as const };
      const response = await executeAiProviderCall({
        context: {
          classification,
          purpose: 'text_to_speech',
          source: 'agent',
          agentId: 'voice_agent',
        },
        payload: text,
        provider: 'openai',
        operation: 'speech',
        invoke: () => getOpenAIClient().audio.speech.create(
          request,
          // Un intento acotado mantiene la interfaz predecible. El usuario puede reintentar
          // conscientemente; el SDK no repite en silencio la locución completa.
          { maxRetries: 0, timeout: 30_000 },
        ),
      });
      const arrayBuffer = await response.arrayBuffer();
      recordAudioUsage(text.length, MODEL);
      this.log('Audio generado correctamente');
      return { buffer: Buffer.from(arrayBuffer) };
    } catch (err: any) {
      const status = err?.status;
      if (status === 401) return { error: 'Credencial de OpenAI (AI Integrations) inválida o ausente', errorCode: 'unauthorized' };
      if (status === 429) return { error: 'Cuota/rate limit de OpenAI agotado', errorCode: 'rate_limit' };
      const isTimeout = err?.name === 'APIConnectionTimeoutError' || err?.name === 'AbortError';
      const message = isTimeout ? 'Timeout del TTS de OpenAI' : 'No fue posible generar el audio';
      this.log(`Falló: ${message}`);
      return { error: message, errorCode: isTimeout ? 'timeout' : (status ? 'http_error' : 'network_error') };
    }
  }

  async generateSpeech(
    rawText: string,
    opts: {
      voiceId?: string;
      sourceType: string;
      articleId?: string | null;
      dataClassification?: AiDataClassification;
    },
  ): Promise<AudioGenerationResult> {
    return this.logStorage.run([], () => this.generateSpeechInternal(rawText, opts));
  }

  private async generateSpeechInternal(
    rawText: string,
    opts: {
      voiceId?: string;
      sourceType: string;
      articleId?: string | null;
      dataClassification?: AiDataClassification;
    },
  ): Promise<AudioGenerationResult> {
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

    if (!hasOpenAITextClient()) {
      this.log('No hay una credencial de OpenAI configurada para TTS.');
      result.errorMessage = 'El TTS de OpenAI no está configurado (falta OPENAI_API_KEY o la integración de OpenAI de Replit).';
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

    const ttsResult = await this.callOpenAiTTS(
      cleaned,
      voice,
      opts.dataClassification || 'internal',
    );
    result.retryCount++;

    if (!ttsResult.buffer) {
      result.errorMessage = ttsResult.error;
      result.errorCode = ttsResult.errorCode;
      result.transparencyLog = [...this.transparencyLog];
      return result;
    }

    let outputPath = "";
    let persistedObjects: string[] = [];
    try {
      if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      }
      const filename = `${opts.sourceType}-${Date.now()}.mp3`;
      outputPath = path.join(OUTPUT_DIR, filename);
      fs.writeFileSync(outputPath, ttsResult.buffer);
      const publicPath = `/generated-audio/${filename}`;
      const persisted = await persistPublicMediaFiles([{ absolutePath: outputPath, publicPath }]);
      persistedObjects = persisted.objectNames;

      await storage.createGeneratedAudio({
        audioUrl: publicPath,
        sourceText: cleaned,
        voiceId: voice,
        engine: 'openai_tts',
        sourceType: opts.sourceType,
        articleId: opts.articleId ?? null,
      });
      result.success = true;
      result.engine = 'openai_tts';
      result.audioUrl = publicPath;
      this.log(`Audio guardado: ${result.audioUrl}`);
    } catch {
      await deletePersistentMediaObjects(persistedObjects);
      if (outputPath) {
        try { fs.unlinkSync(outputPath); } catch { /* compensación; puede no existir */ }
      }
      this.log("Fallo al guardar el audio");
      result.success = false;
      result.engine = "unavailable";
      result.audioUrl = undefined;
      result.errorMessage = "No fue posible guardar el audio";
      result.errorCode = 'save_failed';
    }

    result.transparencyLog = [...this.transparencyLog];
    return result;
  }
}

export const voiceGenerator = new VoiceGenerator();
