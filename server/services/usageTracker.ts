import { db } from '../db';
import { apiUsage } from '@shared/schema';

// Precios USD aproximados (actualizables). Chat: por 1M de tokens. Imagen: por imagen.
// OpenAI no expone el saldo por API key, así que el costo se ESTIMA con estos precios.
const CHAT_PRICES: Record<string, { in: number; out: number }> = {
  'gpt-4o': { in: 2.5, out: 10 },
  'gpt-4o-mini': { in: 0.15, out: 0.6 },
};
const DEFAULT_CHAT = { in: 2.5, out: 10 };

type Usage = { prompt_tokens?: number; completion_tokens?: number } | undefined | null;

/** Registra una llamada de chat/traducción. Fire-and-forget: nunca lanza ni bloquea. */
export function recordChatUsage(kind: 'chat' | 'translation', model: string, usage: Usage): void {
  void (async () => {
    try {
      const p = CHAT_PRICES[model] || DEFAULT_CHAT;
      const inTok = usage?.prompt_tokens || 0;
      const outTok = usage?.completion_tokens || 0;
      const costUsd = (inTok / 1e6) * p.in + (outTok / 1e6) * p.out;
      await db.insert(apiUsage).values({ kind, model, promptTokens: inTok, completionTokens: outTok, costUsd });
    } catch {
      /* el tracking nunca debe tumbar la operación real */
    }
  })();
}

/** Registra una imagen generada (costo aproximado según modelo, tamaño y calidad). */
export function recordImageUsage(size: string, model: string = 'dall-e-3', quality?: string): void {
  void (async () => {
    try {
      let costUsd: number;
      if (model === 'gpt-image-1') {
        // gpt-image-1 cobra por tokens; aprox. 1024² por calidad. landscape/portrait cuestan más.
        const base = quality === 'low' ? 0.011 : quality === 'medium' ? 0.042 : 0.167;
        costUsd = size === '1024x1024' ? base : base * 1.5;
      } else {
        costUsd = size === '1024x1024' ? 0.04 : 0.08;
      }
      await db.insert(apiUsage).values({ kind: 'image', model, images: 1, costUsd });
    } catch {
      /* ignore */
    }
  })();
}
