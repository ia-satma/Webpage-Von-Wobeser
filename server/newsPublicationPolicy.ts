function hasCmsText(value: unknown): boolean {
  return String(value ?? "").replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").trim().length > 0;
}

export function isVerifiedNewsSourceUrl(value: unknown): boolean {
  try {
    const url = new URL(String(value ?? "").trim());
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

/**
 * La fecha editorial entra desde Administración como AAAA-MM-DD. Validamos el
 * calendario completo, no sólo el patrón, para evitar que JavaScript normalice
 * silenciosamente valores imposibles como el 31 de febrero.
 */
export function isValidEditorialDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Mediodía UTC evita que la fecha no retroceda por zona horaria al renderizar. */
export function editorialDateAtNoon(value: string): Date {
  return new Date(`${value}T12:00:00.000Z`);
}

/** Un borrador sólo entra al sitio cuando el editor aporta la fecha en esa acción. */
export function requiresExplicitEditorialDate(wasPublished: unknown, willBePublished: unknown): boolean {
  return wasPublished !== true && willBePublished === true;
}

/**
 * Comunicaciones y noticias requieren el resumen bilingüe completo. Únicamente los
 * Artículos históricos pueden publicarse como ficha “solo fuente” cuando no existe
 * texto legible que permita redactar un resumen responsable.
 */
export function hasPublishableNewsContent(item: {
  title?: unknown;
  titleEs?: unknown;
  excerpt?: unknown;
  excerptEs?: unknown;
  category?: unknown;
  sourceUrl?: unknown;
}): boolean {
  const hasTitles = hasCmsText(item.title) && hasCmsText(item.titleEs);
  const hasExcerpts = hasCmsText(item.excerpt) && hasCmsText(item.excerptEs);
  return hasTitles && (hasExcerpts || (item.category === "articles" && isVerifiedNewsSourceUrl(item.sourceUrl)));
}
