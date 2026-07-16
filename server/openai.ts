import OpenAI from "openai";
import { recordChatUsage } from "./services/usageTracker";

// Using Replit's AI Integrations service - provides OpenAI-compatible API access
// without requiring your own OpenAI API key. Charges are billed to Replit credits.
// Modelo real de OpenAI (gpt-4o) — antes apuntaba a claude-sonnet-4-6 vía un endpoint
// compatible de Anthropic, un workaround de dev local que no aplica una vez que la
// integración administrada de OpenAI de Replit esté aprovisionada de verdad.
// Lazy initialization: the AI_INTEGRATIONS_OPENAI_API_KEY env var is injected by
// the Replit platform at runtime; we defer client creation to avoid startup crashes
// when the env var isn't resolved yet at import time.
let _openaiClient: OpenAI | null = null;
export function getOpenAIClient(): OpenAI {
  if (!_openaiClient) {
    _openaiClient = new OpenAI({
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    });
  }
  return _openaiClient;
}
// Keep `openai` export for backward compatibility with existing imports.
export const openai: OpenAI = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return (getOpenAIClient() as any)[prop];
  },
});

// No se usa response_format:json_object (evita depender de que el proxy en turno lo
// soporte) — los prompts piden JSON en texto plano. Este helper lo extrae aunque venga
// envuelto en fences de markdown o con texto alrededor.
export function extractJson(s: string): string {
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) return fence[1].trim();
  const start = s.search(/[{[]/);
  const end = Math.max(s.lastIndexOf("}"), s.lastIndexOf("]"));
  if (start >= 0 && end > start) return s.slice(start, end + 1);
  return s.trim();
}

/**
 * Parseo JSON tolerante: NUNCA lanza. Devuelve null si el modelo respondió algo
 * que no es JSON válido (prosa, vacío, JSON malformado). Evita que un
 * `JSON.parse` sin try/catch tumbe la petición.
 */
export function safeParseJson<T = any>(raw: string | null | undefined): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(extractJson(raw)) as T;
  } catch {
    return null;
  }
}

export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", nameNative: "English" },
  { code: "es", name: "Spanish", nameNative: "Español" },
  { code: "de", name: "German", nameNative: "Deutsch" },
  { code: "zh", name: "Chinese", nameNative: "中文" },
  { code: "ko", name: "Korean", nameNative: "한국어" },
  { code: "ja", name: "Japanese", nameNative: "日本語" },
  { code: "ar", name: "Arabic", nameNative: "العربية" },
  { code: "ru", name: "Russian", nameNative: "Русский" },
  { code: "fr", name: "French", nameNative: "Français" },
  { code: "it", name: "Italian", nameNative: "Italiano" },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]["code"];

export async function translateLegalText(
  text: string,
  sourceLanguage: LanguageCode,
  targetLanguage: LanguageCode
): Promise<string> {
  if (sourceLanguage === targetLanguage || !text.trim()) {
    return text;
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a professional legal translator specializing in corporate law, M&A, litigation, arbitration, and regulatory matters. Translate the following text from ${sourceLanguage} to ${targetLanguage}. 
        
IMPORTANT GUIDELINES:
- Use proper legal terminology and jargon appropriate for the target language
- Maintain formal, professional tone suitable for a top-tier law firm
- Keep legal terms precise and correctly translated according to the legal system of the target language
- Preserve any proper nouns, firm names, and client names
- If there are jurisdiction-specific terms, use the equivalent term in the target legal system
- Do not add explanatory notes or brackets - provide clean translated text only

Respond with JSON in this format: { "translation": "translated text here" }`,
      },
      {
        role: "user",
        content: text,
      },
    ],
    max_tokens: 4096,
  });

  recordChatUsage('translation', 'gpt-4o', response.usage as any);
  const result = safeParseJson<{ translation?: string }>(response.choices[0].message.content);
  return result?.translation || text; // si el modelo no devolvió JSON, se conserva el original
}

export async function translateMultipleTexts(
  texts: { key: string; text: string }[],
  sourceLanguage: LanguageCode,
  targetLanguage: LanguageCode
): Promise<Record<string, string>> {
  if (sourceLanguage === targetLanguage || texts.length === 0) {
    return texts.reduce((acc, { key, text }) => ({ ...acc, [key]: text }), {});
  }

  const textsForTranslation = texts.map(({ key, text }) => `${key}: ${text}`).join("\n---\n");

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a professional legal translator. Translate all the following texts from ${sourceLanguage} to ${targetLanguage}. Each text is prefixed with a key followed by a colon. Maintain proper legal terminology.

Respond with JSON where keys are the original keys and values are the translations: { "key1": "translation1", "key2": "translation2" }`,
      },
      {
        role: "user",
        content: textsForTranslation,
      },
    ],
    max_tokens: 8192,
  });

  recordChatUsage('translation', 'gpt-4o', response.usage as any);
  const parsed = safeParseJson<Record<string, string>>(response.choices[0].message.content);
  // Si el modelo no devolvió un objeto JSON, se conservan los textos originales.
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return texts.reduce((acc, { key, text }) => ({ ...acc, [key]: text }), {});
  }
  return parsed;
}

export async function suggestTranslation(
  originalText: string,
  existingTranslations: Record<string, string>,
  targetLanguage: LanguageCode
): Promise<{ translation: string; confidence: number }> {
  const existingLanguages = Object.entries(existingTranslations)
    .filter(([_, text]) => text && text.trim())
    .map(([lang, text]) => `${lang}: ${text}`)
    .join("\n");

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a professional legal translator for a top law firm. Based on the provided original text and any existing translations, suggest a translation to ${targetLanguage}.

Use proper legal terminology appropriate for the target language's legal system.

Respond with JSON: { "translation": "your translation", "confidence": 0.95 }
Confidence should be between 0 and 1, where 1 means highly confident.`,
      },
      {
        role: "user",
        content: `Original text:\n${originalText}\n\nExisting translations:\n${existingLanguages || "None available"}`,
      },
    ],
    max_tokens: 4096,
  });

  recordChatUsage('translation', 'gpt-4o', response.usage as any);
  const parsed = safeParseJson<{ translation?: string; confidence?: number }>(response.choices[0].message.content);
  return {
    translation: parsed?.translation ?? "",
    confidence: typeof parsed?.confidence === "number" ? parsed.confidence : 0,
  };
}
