import OpenAI from "openai";

// Using Replit's AI Integrations service - provides OpenAI-compatible API access
// without requiring your own OpenAI API key. Charges are billed to Replit credits.
// Apuntado al endpoint compatible de Claude (Anthropic) — modelo claude-sonnet-4-6.
export const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

// El endpoint compatible de Claude no acepta response_format:json_object; los prompts
// piden JSON y Claude lo devuelve. Este helper extrae el JSON aunque venga con fences.
export function extractJson(s: string): string {
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) return fence[1].trim();
  const start = s.search(/[{[]/);
  const end = Math.max(s.lastIndexOf("}"), s.lastIndexOf("]"));
  if (start >= 0 && end > start) return s.slice(start, end + 1);
  return s.trim();
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
    model: "claude-sonnet-4-6",
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

  const result = JSON.parse(extractJson(response.choices[0].message.content || "{}"));
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

  const response = await openai.chat.completions.create({
    model: "claude-sonnet-4-6",
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

  return JSON.parse(extractJson(response.choices[0].message.content || "{}"));
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
    model: "claude-sonnet-4-6",
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

  return JSON.parse(extractJson(response.choices[0].message.content || '{"translation": "", "confidence": 0}'));
}
