import { BaseAgent } from '../core/BaseAgent';
import { AgentConfig, AgentResult, ExecutionContext } from '../core/types';
import { voiceGenerator } from '../../services/VoiceGenerator';
import { getConfigMap } from '../../mirror/siteConfig';

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
type VoiceSourceType = typeof VALID_SOURCE_TYPES[number];

export class VoiceAgent extends BaseAgent {
  constructor() {
    super(VOICE_CONFIG);
  }

  async execute(_context: ExecutionContext, payload: Record<string, unknown>): Promise<AgentResult> {
    const { text, sourceType, articleId, voiceId } = payload as {
      text?: string;
      sourceType?: string;
      articleId?: string;
      voiceId?: string;
    };

    if (!text || !text.trim()) {
      return { success: false, error: 'text es requerido (el texto ya generado a convertir en audio).' };
    }
    if (!sourceType || !VALID_SOURCE_TYPES.includes(sourceType as VoiceSourceType)) {
      return { success: false, error: `sourceType debe ser uno de: ${VALID_SOURCE_TYPES.join(', ')}` };
    }

    try {
      // Voz por defecto configurable desde el panel (site_config.tts_voice) si no
      // se pasó una explícita en el payload — misma convención que ga4_measurement_id/etc.
      let resolvedVoiceId = voiceId;
      if (!resolvedVoiceId) {
        const config = await getConfigMap();
        resolvedVoiceId = config.tts_voice?.value || undefined;
      }

      const result = await voiceGenerator.generateSpeech(text, {
        voiceId: resolvedVoiceId,
        sourceType,
        articleId: articleId || null,
      });

      if (!result.success) {
        return {
          success: false,
          error: result.errorMessage || 'La generación de audio falló.',
          data: { errorCode: result.errorCode, transparencyLog: result.transparencyLog },
        };
      }

      return {
        success: true,
        data: {
          audioUrl: result.audioUrl,
          voiceId: result.voiceId,
          sourceType,
          articleId: articleId || null,
          transparencyLog: result.transparencyLog,
        },
      };
    } catch (error: any) {
      console.error('[VoiceAgent] Error:', error);
      return { success: false, error: error?.message || 'Falló la generación de audio.' };
    }
  }
}

export const voiceAgent = new VoiceAgent();
