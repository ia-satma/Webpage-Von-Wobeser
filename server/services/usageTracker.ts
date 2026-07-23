import { db } from '../db';
import { apiUsage } from '@shared/schema';
import { gte, sql } from "drizzle-orm";

// Precios USD aproximados (actualizables). Chat: por 1M de tokens. Imagen: por imagen.
// OpenAI no expone el saldo por API key, así que el costo se ESTIMA con estos precios.
const CHAT_PRICES: Record<string, { in: number; out: number }> = {
  'gpt-4o': { in: 2.5, out: 10 },
  'gpt-4o-mini': { in: 0.15, out: 0.6 },
};
const DEFAULT_CHAT = { in: 2.5, out: 10 };

type Usage = { prompt_tokens?: number; completion_tokens?: number } | undefined | null;

let lastBudgetAlertAt = 0;

export async function assertAiBudget(): Promise<void> {
  const configured = Number(process.env.AI_MONTHLY_BUDGET_USD || "100");
  const monthlyBudget = Number.isFinite(configured) && configured > 0 ? Math.min(configured, 100_000) : 100;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${apiUsage.costUsd}), 0)` })
    .from(apiUsage)
    .where(gte(apiUsage.createdAt, monthStart));
  const total = Number(row?.total || 0);
  if (total >= monthlyBudget) {
    if (Date.now() - lastBudgetAlertAt > 60 * 60 * 1000) {
      lastBudgetAlertAt = Date.now();
      console.warn("[SECURITY_ALERT] Monthly AI budget reached; paid AI calls are paused");
    }
    throw new Error("Monthly AI budget reached");
  }
}

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

/** Registra TTS por caracteres (precio aproximado de tts-1: USD 15 / 1M caracteres). */
export function recordAudioUsage(characters: number, model = "tts-1"): void {
  void (async () => {
    try {
      const safeCharacters = Math.max(0, Math.min(Math.trunc(characters), 100_000));
      const costUsd = safeCharacters / 1_000_000 * 15;
      await db.insert(apiUsage).values({
        kind: "audio",
        model,
        promptTokens: safeCharacters,
        costUsd,
      });
    } catch {
      /* el tracking nunca debe tumbar la operación real */
    }
  })();
}
