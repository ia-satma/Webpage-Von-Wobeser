export type LegacyLanguage = "en" | "es";

const LEGACY_ENGLISH_SECTIONS = /\/(?:attorneys|capabilities|careers|contact|industry|lawyer|new-offices|our-firm|practice|privacy|publication|publications)(?:\/|$)/i;
const PUBLIC_LIST_PAGE_SIZE = 24;

/** Infiere el idioma de una captura histórica; español sigue siendo el predeterminado. */
export function legacyHtmlLanguage(pathname: string, requestedLanguage?: unknown): LegacyLanguage {
  if (requestedLanguage === "en") return "en";
  if (requestedLanguage === "es") return "es";
  return LEGACY_ENGLISH_SECTIONS.test(pathname) ? "en" : "es";
}

/** Corrige el atributo lang incorrecto o ausente antes de aplicar el cromo compartido. */
export function normalizeLegacyHtmlLanguage(html: string, lang: LegacyLanguage): string {
  const locale = lang === "en" ? "en-gb" : "es-mx";
  return html.replace(/<html\b([^>]*)>/i, (_tag, rawAttributes: string) => {
    const attributes = rawAttributes.replace(/\s+lang\s*=\s*(?:["'][^"']*["']|[^\s>]+)/gi, "");
    return `<html${attributes} lang="${locale}">`;
  });
}

/** Convierte el offset Joomla (start-N) a la página dinámica que contiene ese registro. */
export function legacyPaginationDestination(pathname: string): string | null {
  const match = pathname.match(
    /^\/index\.php\/(publications|publicaciones)\/(news|noticias|articles|articulos)\/start-(\d+)\.html$/i,
  );
  if (!match) return null;
  const offset = Number(match[3]);
  if (!Number.isSafeInteger(offset) || offset < 0) return null;
  const lang: LegacyLanguage = match[1].toLowerCase() === "publications" ? "en" : "es";
  const section = /articles|articulos/i.test(match[2]) ? "/articles" : "/news";
  const params = new URLSearchParams({ page: String(Math.floor(offset / PUBLIC_LIST_PAGE_SIZE) + 1) });
  if (lang === "en") params.set("lang", "en");
  return `${section}?${params.toString()}`;
}

/**
 * Sustituye familias incrustadas en el HTML histórico. La pila Arial completa
 * solo se reemplaza dentro de declaraciones CSS típicas para no alterar prosa.
 */
export function normalizeLegacyTypography(html: string): string {
  return html
    .replace(/Publico-(?:Roman|light|medium)/gi, "Gelasio")
    .replace(/Geomanist-(?:Book|light|regular)/gi, "Atkinson Hyperlegible")
    .replace(/OptimaLTStd(?:-Bold)?/gi, "Atkinson Hyperlegible")
    .replace(
      /(?:tahoma\s*,\s*)?arial\s*,\s*helvetica\s*,\s*sans-serif/gi,
      '"Atkinson Hyperlegible", sans-serif',
    );
}
