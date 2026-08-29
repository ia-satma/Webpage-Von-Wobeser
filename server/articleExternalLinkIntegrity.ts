import * as cheerio from "cheerio";
import { eq } from "drizzle-orm";
import fs from "node:fs/promises";
import path from "node:path";
import { db } from "./db";
import { news, newsExternalLinks, type News } from "@shared/schema";
import { getMirrorDir } from "./mirror/config";
import { isLegacyFirmPublicationUrl } from "./newsPublicationPolicy";

type DatabaseTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type ArticleExternalLinkKind = "source" | "content";
export type ArticleExternalLinkFailure =
  | "INVALID_URL"
  | "UNSAFE_HOST"
  | "REDIRECT_LIMIT"
  | "REDIRECT_WITHOUT_LOCATION"
  | "LEGACY_FIRM_PAGE"
  | "REDIRECT_TO_LEGACY_404"
  | "HTTP_ERROR"
  | "NETWORK_ERROR"
  | "HTML_EMPTY"
  | "HTML_ERROR_DOCUMENT"
  | "HTML_TITLE_MISMATCH"
  | "LOCAL_ASSET_MISSING"
  | "LOCAL_ASSET_INVALID"
  | "UNSUPPORTED_CONTENT";

export type ArticleExternalLinkCandidate = {
  kind: ArticleExternalLinkKind;
  url: string;
  normalizedUrl: string;
  expectedTitles: string[];
};

export type ArticleExternalLinkVerification = ArticleExternalLinkCandidate & {
  valid: boolean;
  status: number | null;
  finalUrl: string | null;
  failureCode: ArticleExternalLinkFailure | null;
  redirectChain: string[];
  contentType: string;
};

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

const MAX_REDIRECTS = 5;
const CHECK_TIMEOUT_MS = 15_000;
const FIRST_PARTY_HOSTS = new Set(["vonwobeser.com", "www.vonwobeser.com"]);
const ERROR_DOCUMENT = /\b(?:404|not\s+found|page\s+not\s+found|p[aá]gina\s+no\s+encontrada|p[aá]gina\s+no\s+disponible|error\s+404|jerror)\b/i;

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b] = parts;
  return a === 10 || a === 127 || a === 0 || a === 169 && b === 254 || a === 172 && b >= 16 && b <= 31 || a === 192 && b === 168;
}

function isUnsafeHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  return !host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host === "::1" || isPrivateIpv4(host);
}

/** Normaliza sólo la identidad técnica del enlace; no reescribe destinos editoriales. */
export function normalizeArticleExternalUrl(value: unknown): string | null {
  try {
    const url = new URL(String(value ?? "").trim());
    if (!/^https?:$/.test(url.protocol) || url.username || url.password || isUnsafeHost(url.hostname)) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Los artículos heredados también enlazan PDFs que el propio sitio sirve desde
 * /images. Esos recursos no deben salir de la auditoría por no ser URLs
 * absolutas: se verifican contra el mismo directorio estático que publica el
 * espejo. No se aceptan rutas relativas, protocol-relative ni traversal.
 */
export function normalizeArticleContentUrl(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  const external = normalizeArticleExternalUrl(raw);
  if (external) return external;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return null;
  try {
    const parsed = new URL(raw, "https://article-link.local");
    const decodedPath = decodeURIComponent(parsed.pathname);
    if (!decodedPath.startsWith("/") || decodedPath.split("/").some((segment) => segment === ".." || segment === ".")) return null;
    // Las consultas no cambian el archivo que express.static sirve y romperían
    // la identidad única del registro de integridad.
    return decodedPath;
  } catch {
    return null;
  }
}

function isMirrorStaticAsset(url: string): boolean {
  return /^\/(?:images|img|templates)\//i.test(url);
}

async function verifyInternalMirrorAsset(candidate: ArticleExternalLinkCandidate): Promise<ArticleExternalLinkVerification> {
  const normalizedUrl = candidate.normalizedUrl;
  if (!isMirrorStaticAsset(normalizedUrl)) {
    return {
      ...candidate,
      valid: false,
      status: null,
      finalUrl: null,
      failureCode: "UNSUPPORTED_CONTENT",
      redirectChain: [],
      contentType: "",
    };
  }
  try {
    const mirrorRoot = await fs.realpath(getMirrorDir());
    const filePath = path.resolve(mirrorRoot, `.${normalizedUrl}`);
    if (!filePath.startsWith(`${mirrorRoot}${path.sep}`)) {
      return { ...candidate, valid: false, status: null, finalUrl: null, failureCode: "INVALID_URL", redirectChain: [], contentType: "" };
    }
    const stat = await fs.stat(filePath);
    if (!stat.isFile() || stat.size <= 0) {
      return { ...candidate, valid: false, status: 404, finalUrl: normalizedUrl, failureCode: "LOCAL_ASSET_MISSING", redirectChain: [], contentType: "" };
    }
    const prefix = Buffer.alloc(5);
    const handle = await fs.open(filePath, "r");
    try {
      await handle.read(prefix, 0, prefix.length, 0);
    } finally {
      await handle.close();
    }
    const expectsPdf = /\.pdf$/i.test(normalizedUrl);
    if (expectsPdf && prefix.toString("ascii") !== "%PDF-") {
      return { ...candidate, valid: false, status: 200, finalUrl: normalizedUrl, failureCode: "LOCAL_ASSET_INVALID", redirectChain: [], contentType: "application/pdf" };
    }
    return {
      ...candidate,
      valid: true,
      status: 200,
      finalUrl: normalizedUrl,
      failureCode: null,
      redirectChain: [],
      contentType: expectsPdf ? "application/pdf" : "application/octet-stream",
    };
  } catch {
    return { ...candidate, valid: false, status: 404, finalUrl: normalizedUrl, failureCode: "LOCAL_ASSET_MISSING", redirectChain: [], contentType: "" };
  }
}

function isLegacy404(url: string): boolean {
  try {
    const parsed = new URL(url);
    return FIRST_PARTY_HOSTS.has(parsed.hostname.toLowerCase()) && /\/index\.php\/404\/?$/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

function visibleText(html: string): string {
  return cheerio.load(html).text().replace(/\s+/g, " ").trim();
}

async function readSnippet(response: Response, maxBytes = 256_000): Promise<Buffer> {
  if (!response.body) return Buffer.alloc(0);
  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;
  try {
    while (total < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      const remaining = maxBytes - total;
      const chunk = Buffer.from(value.byteOffset === 0 && value.byteLength === value.buffer.byteLength ? value.buffer : value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength));
      chunks.push(chunk.subarray(0, remaining));
      total += Math.min(chunk.length, remaining);
      if (chunk.length > remaining) break;
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  return Buffer.concat(chunks, total);
}

export function collectArticleExternalLinks(item: Pick<News, "sourceUrl" | "excerpt" | "excerptEs" | "content" | "contentEs" | "title" | "titleEs">): ArticleExternalLinkCandidate[] {
  const candidates = new Map<string, ArticleExternalLinkCandidate>();
  const sourceUrl = String(item.sourceUrl ?? "").trim();
  const sourceNormalized = normalizeArticleExternalUrl(sourceUrl);
  if (sourceUrl) {
    // Una fuente mal formada también requiere trazabilidad y debe impedir que
    // un Artículo publicado ofrezca un enlace imposible de abrir.
    const normalizedUrl = sourceNormalized || sourceUrl;
    candidates.set(`source:${normalizedUrl}`, {
      kind: "source",
      url: sourceUrl,
      normalizedUrl,
      expectedTitles: [String(item.title ?? ""), String(item.titleEs ?? "")].filter(Boolean),
    });
  }
  for (const field of [item.excerpt, item.excerptEs, item.content, item.contentEs]) {
    const $ = cheerio.load(String(field ?? ""));
    $("a[href]").each((_index, anchor) => {
      const url = String($(anchor).attr("href") ?? "").trim();
      const normalizedUrl = normalizeArticleContentUrl(url);
      if (!normalizedUrl) return;
      candidates.set(`content:${normalizedUrl}`, {
        kind: "content",
        url,
        normalizedUrl,
        expectedTitles: [],
      });
    });
  }
  return Array.from(candidates.values());
}

export async function verifyArticleExternalLink(
  candidate: ArticleExternalLinkCandidate,
  options: { fetchImpl?: FetchLike; timeoutMs?: number } = {},
): Promise<ArticleExternalLinkVerification> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? CHECK_TIMEOUT_MS;
  if (candidate.kind === "content" && candidate.normalizedUrl.startsWith("/")) {
    return verifyInternalMirrorAsset(candidate);
  }
  const initialUrl = normalizeArticleExternalUrl(candidate.normalizedUrl);
  if (!initialUrl) {
    return { ...candidate, valid: false, status: null, finalUrl: null, failureCode: "INVALID_URL", redirectChain: [], contentType: "" };
  }
  // Una ficha HTML de la firma anterior no es una fuente válida aunque todavía
  // responda con 200. Nunca hacemos una solicitud que pueda legitimarla.
  if (isLegacyFirmPublicationUrl(initialUrl)) {
    return { ...candidate, valid: false, status: null, finalUrl: initialUrl, failureCode: "LEGACY_FIRM_PAGE", redirectChain: [], contentType: "" };
  }
  let currentUrl = initialUrl;
  const redirectChain: string[] = [];
  try {
    for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      let response: Response;
      try {
        response = await fetchImpl(currentUrl, {
          method: "GET",
          redirect: "manual",
          signal: controller.signal,
          headers: {
            accept: "text/html,application/pdf;q=0.9,*/*;q=0.1",
            "user-agent": "VonWobeserLinkVerifier/1.0 (+https://www.vonwobeser.com)",
          },
        });
      } finally {
        clearTimeout(timeout);
      }
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) return { ...candidate, valid: false, status: response.status, finalUrl: currentUrl, failureCode: "REDIRECT_WITHOUT_LOCATION", redirectChain, contentType: "" };
        const next = normalizeArticleExternalUrl(new URL(location, currentUrl).toString());
        if (!next) return { ...candidate, valid: false, status: response.status, finalUrl: currentUrl, failureCode: "UNSAFE_HOST", redirectChain, contentType: "" };
        redirectChain.push(`${response.status}:${currentUrl}=>${next}`);
        if (isLegacyFirmPublicationUrl(next)) return { ...candidate, valid: false, status: response.status, finalUrl: next, failureCode: "LEGACY_FIRM_PAGE", redirectChain, contentType: "" };
        if (isLegacy404(next)) return { ...candidate, valid: false, status: response.status, finalUrl: next, failureCode: "REDIRECT_TO_LEGACY_404", redirectChain, contentType: "" };
        currentUrl = next;
        continue;
      }
      if (response.status < 200 || response.status >= 300) {
        return { ...candidate, valid: false, status: response.status, finalUrl: currentUrl, failureCode: "HTTP_ERROR", redirectChain, contentType: response.headers.get("content-type") || "" };
      }
      if (isLegacyFirmPublicationUrl(currentUrl)) return { ...candidate, valid: false, status: response.status, finalUrl: currentUrl, failureCode: "LEGACY_FIRM_PAGE", redirectChain, contentType: response.headers.get("content-type") || "" };
      if (isLegacy404(currentUrl)) return { ...candidate, valid: false, status: response.status, finalUrl: currentUrl, failureCode: "REDIRECT_TO_LEGACY_404", redirectChain, contentType: response.headers.get("content-type") || "" };
      const contentType = response.headers.get("content-type") || "";
      const body = await readSnippet(response);
      if (/application\/pdf/i.test(contentType) || body.subarray(0, 5).toString("ascii") === "%PDF-") {
        return { ...candidate, valid: body.length > 5, status: response.status, finalUrl: currentUrl, failureCode: body.length > 5 ? null : "HTML_EMPTY", redirectChain, contentType };
      }
      if (!/text\/html|application\/xhtml\+xml/i.test(contentType)) {
        return { ...candidate, valid: false, status: response.status, finalUrl: currentUrl, failureCode: "UNSUPPORTED_CONTENT", redirectChain, contentType };
      }
      const html = body.toString("utf8");
      const $ = cheerio.load(html);
      const title = $("title").first().text().replace(/\s+/g, " ").trim();
      const text = visibleText(html);
      if (text.length < 80) return { ...candidate, valid: false, status: response.status, finalUrl: currentUrl, failureCode: "HTML_EMPTY", redirectChain, contentType };
      if (ERROR_DOCUMENT.test(`${title} ${text.slice(0, 3000)}`)) {
        return { ...candidate, valid: false, status: response.status, finalUrl: currentUrl, failureCode: "HTML_ERROR_DOCUMENT", redirectChain, contentType };
      }
      return { ...candidate, valid: true, status: response.status, finalUrl: currentUrl, failureCode: null, redirectChain, contentType };
    }
    return { ...candidate, valid: false, status: null, finalUrl: currentUrl, failureCode: "REDIRECT_LIMIT", redirectChain, contentType: "" };
  } catch {
    return { ...candidate, valid: false, status: null, finalUrl: currentUrl, failureCode: "NETWORK_ERROR", redirectChain, contentType: "" };
  }
}

async function concurrent<T, R>(items: readonly T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await task(items[index]);
    }
  }));
  return results;
}

export async function verifyArticleExternalLinks(item: Pick<News, "sourceUrl" | "excerpt" | "excerptEs" | "content" | "contentEs" | "title" | "titleEs">, options: { fetchImpl?: FetchLike; timeoutMs?: number } = {}): Promise<ArticleExternalLinkVerification[]> {
  return concurrent(collectArticleExternalLinks(item), 4, (candidate) => verifyArticleExternalLink(candidate, options));
}

export async function persistArticleExternalLinkVerifications(
  item: Pick<News, "id" | "category" | "sourceUrl">,
  verifications: ArticleExternalLinkVerification[],
): Promise<{ sourceDisabled: boolean; disabledContentLinks: number; legacyFirmPageDetected: boolean; articleUnpublished: boolean }> {
  return db.transaction((tx) => persistArticleExternalLinkVerificationsInTransaction(tx, item, verifications));
}

async function persistArticleExternalLinkVerificationsInTransaction(
  tx: DatabaseTransaction,
  item: Pick<News, "id" | "category" | "sourceUrl">,
  verifications: ArticleExternalLinkVerification[],
): Promise<{ sourceDisabled: boolean; disabledContentLinks: number; legacyFirmPageDetected: boolean; articleUnpublished: boolean }> {
  let sourceDisabled = false;
  let disabledContentLinks = 0;
  const legacyFirmPageDetected = verifications.some((result) => result.failureCode === "LEGACY_FIRM_PAGE");
  for (const result of verifications) {
    const disabled = !result.valid;
    if (result.kind === "source" && disabled) sourceDisabled = true;
    if (result.kind === "content" && disabled) disabledContentLinks += 1;
    await tx.insert(newsExternalLinks).values({
      newsId: item.id,
      kind: result.kind,
      url: result.url,
      normalizedUrl: result.normalizedUrl,
      status: disabled ? "disabled" : "verified",
      finalUrl: result.finalUrl,
      failureCode: result.failureCode,
      checkedAt: new Date(),
      disabledAt: disabled ? new Date() : null,
    }).onConflictDoUpdate({
      target: [newsExternalLinks.newsId, newsExternalLinks.normalizedUrl, newsExternalLinks.kind],
      set: {
        url: result.url,
        status: disabled ? "disabled" : "verified",
        finalUrl: result.finalUrl,
        failureCode: result.failureCode,
        checkedAt: new Date(),
        disabledAt: disabled ? new Date() : null,
      },
    });
  }
  let articleUnpublished = false;
  if ((sourceDisabled || legacyFirmPageDetected) && String(item.category || "").toLowerCase() === "articles") {
    const currentSource = normalizeArticleExternalUrl(item.sourceUrl) || String(item.sourceUrl ?? "").trim();
    const failedCurrentSource = verifications.some((result) => result.kind === "source" && !result.valid && result.normalizedUrl === currentSource);
    if (failedCurrentSource || legacyFirmPageDetected) {
      await tx.update(news).set({ published: false, featuredHome: false }).where(eq(news.id, item.id));
      articleUnpublished = true;
    }
  }
  return { sourceDisabled, disabledContentLinks, legacyFirmPageDetected, articleUnpublished };
}

export async function auditAndPersistArticleExternalLinks(item: News, options: { fetchImpl?: FetchLike; timeoutMs?: number } = {}) {
  const verifications = await verifyArticleExternalLinks(item, options);
  const applied = await persistArticleExternalLinkVerifications(item, verifications);
  return { verifications, ...applied };
}

export async function auditAllArticleExternalLinks(options: { fetchImpl?: FetchLike; timeoutMs?: number; apply?: boolean } = {}) {
  const apply = options.apply !== false;
  const articles = await db.select().from(news).where(eq(news.category, "articles"));
  const results = [] as Array<{
    id: string;
    slug: string;
    published: boolean;
    sourceDisabled: boolean;
    disabledContentLinks: number;
    legacyFirmPageDetected: boolean;
    checked: number;
    verifications: ArticleExternalLinkVerification[];
  }>;
  for (const article of articles) {
    const verifications = await verifyArticleExternalLinks(article, options);
    const sourceDisabled = verifications.some((result) => result.kind === "source" && !result.valid);
    const disabledContentLinks = verifications.filter((result) => result.kind === "content" && !result.valid).length;
    const legacyFirmPageDetected = verifications.some((result) => result.failureCode === "LEGACY_FIRM_PAGE");
    results.push({ id: article.id, slug: article.slug, published: article.published === true, sourceDisabled, disabledContentLinks, legacyFirmPageDetected, checked: verifications.length, verifications });
  }
  // La aplicación posterior a la auditoría no deja estados a medias: todos los
  // resultados ya se verificaron, y después se guardan (incluidas las
  // despublicaciones) en una única transacción.
  if (apply) {
    await db.transaction(async (tx) => {
      for (let index = 0; index < articles.length; index += 1) {
        await persistArticleExternalLinkVerificationsInTransaction(tx, articles[index], results[index].verifications);
      }
    });
  }
  return {
    totalArticles: articles.length,
    totalLinks: results.reduce((total, result) => total + result.checked, 0),
    sourceDisabled: results.filter((result) => result.sourceDisabled).length,
    disabledContentLinks: results.reduce((total, result) => total + result.disabledContentLinks, 0),
    legacyFirmPageDetected: results.filter((result) => result.legacyFirmPageDetected).length,
    publicLegacyFirmPageDetected: results.filter((result) => result.published && result.legacyFirmPageDetected).length,
    results,
  };
}
