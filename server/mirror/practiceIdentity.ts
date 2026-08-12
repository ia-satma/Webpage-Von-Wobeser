const decode = (s: string) =>
  String(s).replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"');

export const normalizeMirrorName = (s: string) =>
  decode(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[-.,]/g, " ").replace(/\s+/g, " ").trim();

export const PRACTICE_ALIASES: Record<string, string> = {
  // Esta es una práctica histórica retirada, no una de las 18 públicas.
  "administrative and regulatory": "administrative law",
};

export function parseMirrorMetaName(html: string): string {
  const raw = (html.match(/class=["']single__meta--name["'][^>]*>([\s\S]*?)<\/div>/i) || [])[1] || "";
  return decode(raw.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

export function resolvePracticeSlug(title: string, practicesByName: ReadonlyMap<string, string>): string | undefined {
  const key = PRACTICE_ALIASES[normalizeMirrorName(title)] || normalizeMirrorName(title);
  return practicesByName.get(key);
}
