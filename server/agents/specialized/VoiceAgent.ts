import { BaseAgent } from '../core/BaseAgent';
import { AgentConfig, AgentResult, ExecutionContext } from '../core/types';
import { voiceGenerator } from '../../services/VoiceGenerator';
import { getConfigMap } from '../../mirror/siteConfig';
import {
  isAiExternalClassificationAllowed,
  type AiDataClassification,
} from '@shared/aiGovernance';

// Agente estructural (como content_auditor/website_auditor): no llama a un LLM de texto —
// toma texto YA generado por otro agente (newsletter/social_media/legal_alerts) y lo convierte
// a voz vía el TTS de OpenAI (reusa la misma "AI Integrations" de Replit ya conectada — ver
// server/services/VoiceGenerator.ts sobre por qué no es ElevenLabs). systemPrompt/model/
// temperature son campos requeridos por AgentConfig pero no se usan en tiempo de ejecución,
// igual que en los otros agentes estructurales.
const VOICE_CONFIG: AgentConfig = {
  agentType: 'voice_agent',
  name: 'Voice Agent',
  description: 'Convierte a audio (voz corporativa vía OpenAI TTS) texto ya generado por newsletter, social_media o legal_alerts.',
  systemPrompt: 'N/A — agente estructural, no llama a un LLM de texto.',
  model: 'n/a',
  temperature: 0,
  maxTokens: 0,
  skills: ['text_to_speech', 'audio_generation'],
  enabled: true,
  concurrency: 2,
  retryPolicy: { maxRetries: 1, backoffMs: 1000, backoffMultiplier: 2 },
};

const VALID_SOURCE_TYPES = ['newsletter', 'social_media', 'legal_alerts'] as const;
const VALID_VOICES = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'onyx', 'nova', 'sage', 'shimmer', 'verse'] as const;
type VoiceSourceType = typeof VALID_SOURCE_TYPES[number];

export class VoiceAgent extends BaseAgent {
  constructor() {
    super(VOICE_CONFIG);
  }

  async execute(_context: ExecutionContext, payload: Record<string, unknown>): Promise<AgentResult> {
    const { text, sourceType, articleId, voiceId, dataClassification, aiUseConfirmed } = payload as {
      text?: string;
      sourceType?: string;
      articleId?: string;
      voiceId?: string;
      dataClassification?: AiDataClassification;
      aiUseConfirmed?: boolean;
    };

    if (!text || !text.trim()) {
      return { success: false, error: 'text es requerido (el texto ya generado a convertir en audio).' };
    }
    if (!sourceType || !VALID_SOURCE_TYPES.includes(sourceType as VoiceSourceType)) {
      return { success: false, error: `sourceType debe ser uno de: ${VALID_SOURCE_TYPES.join(', ')}` };
    }
    if (voiceId && !VALID_VOICES.includes(voiceId as typeof VALID_VOICES[number])) {
      return { success: false, error: `voiceId debe ser uno de: ${VALID_VOICES.join(', ')}` };
    }
    if (
      !dataClassification
      || !isAiExternalClassificationAllowed(dataClassification)
      || aiUseConfirmed !== true
    ) {
      return {
        success: false,
        error: 'Clasifica el texto como público o interno y confirma su uso antes de enviarlo a IA.',
      };
    }

    try {
      // Voz por defecto configurable desde el panel (site_config.tts_voice) si no
      // se pasó una explícita en el payload — misma convención que ga4_measurement_id/etc.
      let resolvedVoiceId = voiceId;
      if (!resolvedVoiceId) {
        const config = await getConfigMap();
        resolvedVoiceId = config.tts_voice?.value || undefined;
      }

      const segments = this.splitForSpeech(text);
      const audioUrls: string[] = [];
      const transparencyLog: string[] = [];
      for (let index = 0; index < segments.length; index++) {
        const result = await voiceGenerator.generateSpeech(segments[index], {
          voiceId: resolvedVoiceId,
          sourceType,
          articleId: articleId || null,
          dataClassification,
        });
        transparencyLog.push(...result.transparencyLog);
        if (!result.success || !result.audioUrl) {
          return {
            success: false,
            error: result.errorMessage || `La generación del segmento ${index + 1} falló.`,
            data: { errorCode: result.errorCode, transparencyLog, completedSegments: audioUrls },
          };
        }
        audioUrls.push(result.audioUrl);
      }

      return {
        success: true,
        data: {
          audioUrl: audioUrls[0],
          audioUrls,
          segmentCount: audioUrls.length,
          voiceId: resolvedVoiceId || 'alloy',
          sourceType,
          articleId: articleId || null,
          transparencyLog,
        },
      };
    } catch (error: any) {
      console.error('[VoiceAgent] Error:', error);
      return { success: false, error: 'Falló la generación de audio.' };
    }
  }

  private splitForSpeech(text: string, maxChars = 3_800): string[] {
    const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
    const segments: string[] = [];
    let current = '';
    for (const sentence of sentences) {
      if (sentence.length > maxChars) {
        if (current) {
          segments.push(current);
          current = '';
        }
        for (let offset = 0; offset < sentence.length; offset += maxChars) {
          segments.push(sentence.slice(offset, offset + maxChars));
        }
      } else if (!current || current.length + sentence.length + 1 <= maxChars) {
        current = current ? `${current} ${sentence}` : sentence;
      } else {
        segments.push(current);
        current = sentence;
      }
    }
    if (current) segments.push(current);
    return segments.length > 0 ? segments : [text.slice(0, maxChars)];
  }
}

export const voiceAgent = new VoiceAgent();
