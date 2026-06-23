import Anthropic from "@anthropic-ai/sdk";

// Capa LLM basada en Claude (Anthropic). Reemplaza a OpenAI para todas las tareas
// de TEXTO de los agentes: análisis, traducción legal, clasificación, SEO, etc.
//
// MAPA DE PROVEEDORES DE IA (este proyecto usa varios, a propósito — no te confíes
// del nombre de los archivos):
//   · Pipeline de agentes (texto) → Claude vía callClaude() [este archivo].
//        Key: ANTHROPIC_API_KEY.
//   · Legal Council (3 jueces)    → OpenAI gpt-4o-mini, fetch directo en
//        services/agents/LegalCouncilService.ts. Keys: AI_INTEGRATIONS_OPENAI_* (Replit)
//        u OPENAI_API_KEY (local).
//   · Imágenes                    → Gemini/DALL-E (server/services/SmartImageGenerator.ts).
//   · server/openai.ts            → MIXTO: sus funciones de traducción usan callClaude(),
//        pero EXPORTA un cliente OpenAI (Proxy, gpt-5) que aún importan routes.ts,
//        SmartImageGenerator.ts y scripts/generateAssociateBios.ts. No es solo-Claude.
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Modelo configurable. Default: el más capaz (opus-4-8). Para alto volumen de
// traducción se puede bajar a claude-sonnet-4-6 o claude-haiku-4-5 vía CLAUDE_MODEL.
export const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-opus-4-8";

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) {
    if (!ANTHROPIC_API_KEY) {
      throw new Error(
        "Falta ANTHROPIC_API_KEY. Configúrala (Replit Secret o .env local) para habilitar los agentes de IA con Claude.",
      );
    }
    // timeout/maxRetries explícitos: el default del SDK es 600000ms (10 min),
    // demasiado para una cola de concurrencia 1 — un job colgado detiene la cola
    // entera. 120s por intento + 2 reintentos acota el peor caso.
    _client = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
      timeout: 120_000,
      maxRetries: 2,
    });
  }
  return _client;
}

/** True si hay credenciales de Claude configuradas (para degradar features con gracia). */
export const isClaudeConfigured = Boolean(ANTHROPIC_API_KEY);

export interface CallClaudeOptions {
  system?: string;
  messages: { role: "user" | "assistant"; content: string }[];
  maxTokens?: number;
  /** Si true, instruye salida JSON y limpia fences de markdown del resultado. */
  json?: boolean;
}

/**
 * Llama a Claude con un system prompt + mensajes y devuelve el texto de la respuesta.
 * Con json=true, instruye respuesta JSON pura y retira ```json fences si aparecen,
 * para mantener compatibilidad con el código que hacía JSON.parse() sobre la salida.
 */
export async function callClaude(opts: CallClaudeOptions): Promise<string> {
  const client = getClient();
  const system = opts.json
    ? `${opts.system || ""}\n\nIMPORTANTE: responde ÚNICAMENTE con JSON válido. Sin texto adicional, sin explicaciones, sin bloques de código markdown.`.trim()
    : opts.system;

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: opts.maxTokens ?? 4096,
    ...(system ? { system } : {}),
    messages: opts.messages.length ? opts.messages : [{ role: "user", content: "" }],
  });

  let text = "";
  for (const block of response.content) {
    if (block.type === "text") text += block.text;
  }

  if (opts.json) {
    text = text
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
  }
  return text;
}
