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
