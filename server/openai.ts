import OpenAI from "openai";
import { callClaude } from "./llm";

// En Replit, las AI Integrations inyectan AI_INTEGRATIONS_OPENAI_BASE_URL/_API_KEY
// y el modelo por defecto es "gpt-5". En local se admite OPENAI_API_KEY estándar
// (baseURL undefined → api.openai.com) y el modelo puede sobreescribirse con
// OPENAI_TRANSLATE_MODEL para no depender de gpt-5 fuera de Replit.
// El cliente se construye de forma diferida: el server arranca aunque falte la key;
// solo las funciones que llaman a la API fallan, con un mensaje claro.
const OPENAI_BASE_URL =
  process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || undefined;
const OPENAI_API_KEY =
  process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
export const TRANSLATE_MODEL = process.env.OPENAI_TRANSLATE_MODEL || "gpt-5";

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    if (!OPENAI_API_KEY) {
      throw new Error(
        "Falta la API key de OpenAI (AI_INTEGRATIONS_OPENAI_API_KEY en Replit u OPENAI_API_KEY en local). Las funciones de traducción/IA están deshabilitadas hasta configurarla.",
      );
    }
    _openai = new OpenAI({ baseURL: OPENAI_BASE_URL, apiKey: OPENAI_API_KEY });
  }
  return _openai;
}

/** True si hay credenciales de OpenAI configuradas (para degradar features con elegancia). */
export const isOpenAIConfigured = Boolean(OPENAI_API_KEY);

/** Proxy retrocompatible: el código existente sigue usando `openai.chat...`. */
export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    const client = getOpenAI();
    const value = (client as any)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

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

  const raw = await callClaude({
    system: `You are a professional legal translator specializing in corporate law, M&A, litigation, arbitration, and regulatory matters. Translate the following text from ${sourceLanguage} to ${targetLanguage}.

IMPORTANT GUIDELINES:
- Use proper legal terminology and jargon appropriate for the target language
- Maintain formal, professional tone suitable for a top-tier law firm
- Keep legal terms precise and correctly translated according to the legal system of the target language
- Preserve any proper nouns, firm names, and client names
- If there are jurisdiction-specific terms, use the equivalent term in the target legal system
- Do not add explanatory notes or brackets - provide clean translated text only

Respond with JSON in this format: { "translation": "translated text here" }`,
    messages: [{ role: "user", content: text }],
    maxTokens: 4096,
    json: true,
  });

  const result = JSON.parse(raw || "{}");
  return result.translation || text;
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

  const raw = await callClaude({
    system: `You are a professional legal translator. Translate all the following texts from ${sourceLanguage} to ${targetLanguage}. Each text is prefixed with a key followed by a colon. Maintain proper legal terminology.

Respond with JSON where keys are the original keys and values are the translations: { "key1": "translation1", "key2": "translation2" }`,
    messages: [{ role: "user", content: textsForTranslation }],
    maxTokens: 8192,
    json: true,
  });

  return JSON.parse(raw || "{}");
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

  const raw = await callClaude({
    system: `You are a professional legal translator for a top law firm. Based on the provided original text and any existing translations, suggest a translation to ${targetLanguage}.

Use proper legal terminology appropriate for the target language's legal system.

Respond with JSON: { "translation": "your translation", "confidence": 0.95 }
Confidence should be between 0 and 1, where 1 means highly confident.`,
    messages: [
      {
        role: "user",
        content: `Original text:\n${originalText}\n\nExisting translations:\n${existingLanguages || "None available"}`,
      },
    ],
    maxTokens: 4096,
    json: true,
  });

  return JSON.parse(raw || '{"translation": "", "confidence": 0}');
}
