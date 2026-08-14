export type PublicNewsLanguage = "en" | "es";

export type LocalizedNewsTitle = {
  title?: string | null;
  titleEs?: string | null;
};

const ENGLISH_MARKERS = new Set([
  "a", "actions", "administrative", "agreement", "an", "and", "are", "awards", "be",
  "by", "changes", "city", "developments", "entry", "extends", "for", "from", "has",
  "have", "immediate", "in", "into", "investment", "is", "its", "match", "measures",
  "new", "of", "on", "opening", "permits", "projects", "protection", "regime",
  "regulations", "sign", "steps", "strategy", "the", "to", "toward", "under", "with",
]);

const SPANISH_MARKERS = new Set([
  "acciones", "acuerdo", "administrativas", "al", "ante", "apertura", "cambios", "ciudad",
  "con", "de", "del", "desde", "el", "en", "entrada", "es", "esta", "este", "estrategia",
  "firman", "hacia", "inmediatas", "inversión", "la", "las", "lineamientos", "los", "medidas",
  "modificaciones", "nueva", "nuevas", "nuevo", "nuevos", "para", "partido", "permisos",
  "por", "protección", "que", "régimen", "regulatorios", "sin", "sobre", "un", "una", "y",
]);

function markerScore(tokens: string[], markers: Set<string>): number {
  return tokens.reduce((score, token) => score + (markers.has(token) ? 1 : 0), 0);
}

/**
 * Rejects only titles with strong evidence that they belong to the other language.
 * Short titles, acronyms and proper names remain valid instead of being guessed.
 */
export function isNewsTitleCompatible(title: unknown, language: PublicNewsLanguage): boolean {
  if (typeof title !== "string" || !title.trim()) return false;

  const normalized = title.normalize("NFC").toLocaleLowerCase("es-MX");
  const tokens = normalized.match(/[a-záéíóúñü]+/g) ?? [];
  if (tokens.length < 3) return true;

  const spanishAccentScore = /[áéíóúñü¿¡]/.test(normalized) ? 2 : 0;
  const spanishScore = markerScore(tokens, SPANISH_MARKERS) + spanishAccentScore;
  const englishScore = markerScore(tokens, ENGLISH_MARKERS);

  if (language === "es") {
    return !(englishScore >= 3 && englishScore >= spanishScore + 2);
  }
  return !(spanishScore >= 3 && spanishScore >= englishScore + 2);
}

export function hasCompatibleLocalizedNewsTitle(
  item: LocalizedNewsTitle,
  language: PublicNewsLanguage,
): boolean {
  return isNewsTitleCompatible(language === "es" ? item.titleEs : item.title, language);
}
