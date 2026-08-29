import * as cheerio from "cheerio";

/** Campos editoriales que pueden aparecer en el detalle público de un Artículo. */
export const ARTICLE_LINK_TEXT_FIELDS = ["excerpt", "excerptEs", "content", "contentEs"] as const;
export type ArticleLinkTextField = typeof ARTICLE_LINK_TEXT_FIELDS[number];

const RAW_HTTP_URL = /https?:\/\/[^\s<>"']+/gi;

function normalizeHttpUrl(value: string): string | null {
  const trimmed = value.replace(/[),.;:!?]+$/g, "");
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Finds URLs that readers would see as plain text rather than as a real link.
 * URLs already contained by <a> are intentionally excluded: they remain valid
 * inline editorial citations and do not need a duplicate source CTA.
 */
export function extractUnlinkedHttpUrls(value: unknown): string[] {
  const source = String(value ?? "");
  if (!source) return [];
  const $ = cheerio.load(`<article>${source}</article>`);
  const urls = new Set<string>();
  $("article").find("*").addBack().contents().each((_index, node) => {
    if (node.type !== "text" || $(node).parents("a,script,style").length) return;
    const matches = String(node.data ?? "").match(RAW_HTTP_URL) || [];
    for (const match of matches) {
      const normalized = normalizeHttpUrl(match);
      if (normalized) urls.add(normalized);
    }
  });
  return Array.from(urls);
}

export type RawArticleUrlFinding = { field: ArticleLinkTextField; url: string };

export function findUnlinkedArticleUrls(record: Partial<Record<ArticleLinkTextField, unknown>>): RawArticleUrlFinding[] {
  return ARTICLE_LINK_TEXT_FIELDS.flatMap((field) =>
    extractUnlinkedHttpUrls(record[field]).map((url) => ({ field, url })),
  );
}

/**
 * Existing legacy text stays editable. Only a URL newly introduced in a field
 * is rejected, and a draft becoming public is checked in full by the route.
 */
export function findIntroducedUnlinkedArticleUrls(
  current: Partial<Record<ArticleLinkTextField, unknown>>,
  next: Partial<Record<ArticleLinkTextField, unknown>>,
): RawArticleUrlFinding[] {
  return ARTICLE_LINK_TEXT_FIELDS.flatMap((field) => {
    const previous = new Set(extractUnlinkedHttpUrls(current[field]));
    return extractUnlinkedHttpUrls(next[field])
      .filter((url) => !previous.has(url))
      .map((url) => ({ field, url }));
  });
}
