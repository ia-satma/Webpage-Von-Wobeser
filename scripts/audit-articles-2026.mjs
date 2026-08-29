#!/usr/bin/env node
/**
 * Auditoría de sólo lectura para los Artículos históricos de Von Wobeser.
 *
 * Esta utilidad nunca altera contenido, relaciones ni visibilidad. Recorre el
 * archivo oficial ES/EN y compara cada p_id con la fila local de category=
 * 'articles'. Los resultados se conservan como evidencia compacta: hashes y
 * métricas, nunca los cuerpos completos de publicaciones de terceros.
 */
import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import { createSqlClient } from "./lib/postgres-sql.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const argValue = (name, fallback) => {
  const prefix = `--${name}=`;
  const value = args.find((arg) => arg.startsWith(prefix));
  return value ? value.slice(prefix.length) : fallback;
};
const hasFlag = (name) => args.includes(name);

if (hasFlag("--apply")) throw new Error("Esta auditoría es exclusivamente de sólo lectura; --apply no está permitido.");
if (hasFlag("--help")) {
  console.log("Uso: npm run content:audit-articles -- [--stamp=YYYY-MM-DD] [--output=RUTA] [--cache=RUTA] [--project-origin=URL] [--concurrency=6]");
  process.exit(0);
}

const STAMP = argValue("stamp", "2026-08-28");
const OUTPUT = path.resolve(ROOT, argValue("output", `output/audits/articulos-${STAMP}`));
const CACHE = path.resolve(argValue("cache", path.join(os.tmpdir(), `vwys-articles-audit-${STAMP.replaceAll("-", "")}`)));
const PROJECT_ORIGIN = argValue("project-origin", process.env.PUBLIC_AUDIT_SITE_URL || "http://localhost:5050").replace(/\/$/, "");
const OFFICIAL_ORIGIN = "https://www.vonwobeser.com";
const CONCURRENCY = Math.max(1, Math.min(10, Number(argValue("concurrency", "6")) || 6));
const MAX_PAGES = Math.max(0, Number(argValue("max-pages", "0")) || 0);
const MAX_DETAILS = Math.max(0, Number(argValue("max-details", "0")) || 0);
const SKIP_LINKS = hasFlag("--skip-links");
// Cambia cuando la semántica de las comprobaciones evoluciona: evita reutilizar
// resultados de auditorías que todavía aceptaban una ruta redirigida a 404.
const FETCH_CACHE_VERSION = "2026-08-29-direct-source-route-v2";
const MAX_REDIRECTS = 8;

const COLLECTIONS = [
  { key: "es", language: "es", url: `${OFFICIAL_ORIGIN}/index.php/publicaciones/articulos` },
  { key: "en", language: "en", url: `${OFFICIAL_ORIGIN}/index.php/publications/articles` },
];
const MONTHS = new Map([
  ["enero", 1], ["febrero", 2], ["marzo", 3], ["abril", 4], ["mayo", 5], ["junio", 6],
  ["julio", 7], ["agosto", 8], ["septiembre", 9], ["octubre", 10], ["noviembre", 11], ["diciembre", 12],
  ["january", 1], ["february", 2], ["march", 3], ["april", 4], ["may", 5], ["june", 6],
  ["july", 7], ["august", 8], ["september", 9], ["october", 10], ["november", 11], ["december", 12],
]);

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const clean = (value) => String(value ?? "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
const normalized = (value) => clean(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const textHash = (value) => sha256(normalized(value));
const unique = (values) => [...new Set(values.filter(Boolean))];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const isHttp = (value) => /^https?:\/\//i.test(String(value ?? ""));
const articlePid = (value) => String(value ?? "").match(/[?&]p_id=(\d+)|p_id-(\d+)/i)?.slice(1).find(Boolean) ?? "";
const isLegacy404Url = (value) => {
  try {
    const url = new URL(value);
    return url.hostname.endsWith("vonwobeser.com") && url.pathname === "/index.php/404";
  } catch { return false; }
};
const toAbsolute = (href, base) => {
  try { return href ? new URL(String(href).replace(/&amp;/g, "&"), base).toString() : ""; } catch { return ""; }
};
const localize = (row, field, language) => language === "es" ? row[`${field}Es`] : row[field];
const projectDetailUrl = (slug, language) => `${PROJECT_ORIGIN}/news/${encodeURIComponent(slug)}${language === "en" ? "?lang=en" : ""}`;
const csvCell = (value) => {
  const text = Array.isArray(value) ? value.join(" | ") : value == null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};
const toCsv = (rows, headers) => `${headers.join(",")}\n${rows.map((row) => headers.map((key) => csvCell(row[key])).join(",")).join("\n")}\n`;

function parseDate(rawValue) {
  const raw = clean(rawValue).replaceAll(".", "");
  if (!raw) return { raw: "", normalized: "", precision: "missing" };
  const unaccented = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  let match = unaccented.match(/\b(\d{1,2})\s+(?:de\s+)?([a-z]+)(?:\s+de)?[,\s]+(\d{4})\b/);
  if (match && MONTHS.has(match[2])) return { raw, normalized: `${match[3]}-${String(MONTHS.get(match[2])).padStart(2, "0")}-${String(Number(match[1])).padStart(2, "0")}`, precision: "day" };
  match = unaccented.match(/\b([a-z]+)[,\s]+(\d{4})\b/);
  if (match && MONTHS.has(match[1])) return { raw, normalized: `${match[2]}-${String(MONTHS.get(match[1])).padStart(2, "0")}`, precision: "month" };
  return { raw, normalized: "", precision: "unparsed" };
}

function comparableHtml(value) {
  return clean(cheerio.load(`<div>${value ?? ""}</div>`)("div").text());
}

function similarity(left, right) {
  const a = new Set(normalized(left).split(" ").filter((word) => word.length > 2));
  const b = new Set(normalized(right).split(" ").filter((word) => word.length > 2));
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const word of a) if (b.has(word)) shared += 1;
  return shared / (a.size + b.size - shared);
}

function compareText(official, project) {
  const source = clean(official);
  const local = clean(project);
  if (!source && !local) return "not_applicable";
  if (!source) return "official_missing";
  if (!local) return "project_missing";
  if (normalized(source) === normalized(local)) return "match";
  return similarity(source, local) >= 0.78 ? "similar" : "different";
}

function sameUrl(left, right) {
  try {
    const a = new URL(left); const b = new URL(right);
    a.hash = ""; b.hash = "";
    if (a.pathname !== "/") a.pathname = a.pathname.replace(/\/$/, "");
    if (b.pathname !== "/") b.pathname = b.pathname.replace(/\/$/, "");
    return a.toString() === b.toString();
  } catch { return false; }
}

function rawHttpUrlsOutsideAnchors($, root) {
  const urls = new Set();
  root.find("*").addBack().contents().each((_index, node) => {
    if (node.type !== "text" || $(node).parents("a,script,style").length) return;
    for (const match of String(node.data ?? "").match(/https?:\/\/[^\s<>"']+/gi) || []) {
      const url = toAbsolute(match.replace(/[),.;:!?]+$/g, ""), "https://invalid.local/");
      if (isHttp(url)) urls.add(url);
    }
  });
  return [...urls];
}

function publicContentLinks($, root, baseUrl) {
  return unique(root.find("a[href]").map((_index, element) =>
    toAbsolute($(element).attr("href"), baseUrl),
  ).get().filter(isHttp));
}

function classifyLink(result, kind) {
  if (result.redirectedToLegacy404) return "roto";
  if (result.error || result.status === 0) return "inaccesible";
  if ([401, 403, 429].includes(result.status)) return "bloqueado";
  if ([404, 410].includes(result.status)) return "roto";
  if (result.status >= 500) return "error";
  if (result.status >= 300 && result.status < 400) return "redireccion";
  if (result.status < 200 || result.status >= 300) return "inaccesible";
  if (kind === "pdf" && !result.signature.startsWith("%PDF-") && !String(result.mime).toLowerCase().includes("pdf")) return "contenido-invalido";
  return result.redirected ? "redireccion-valida" : "correcto";
}

class FetchCache {
  constructor(root) { this.root = root; }
  async init() { await fs.mkdir(this.root, { recursive: true }); }
  paths(url, mode) {
    const key = sha256(`${FETCH_CACHE_VERSION}:${mode}:${url}`);
    return { meta: path.join(this.root, `${key}.json`), body: path.join(this.root, `${key}.body`) };
  }
  async read(url, mode) {
    const files = this.paths(url, mode);
    try {
      const meta = JSON.parse(await fs.readFile(files.meta, "utf8"));
      return { ...meta, body: mode === "probe" ? Buffer.alloc(0) : await fs.readFile(files.body) };
    } catch { return null; }
  }
  async write(url, mode, result) {
    const files = this.paths(url, mode);
    const { body, ...meta } = result;
    await fs.writeFile(files.meta, `${JSON.stringify(meta)}\n`);
    if (mode !== "probe") await fs.writeFile(files.body, body ?? Buffer.alloc(0));
  }
}

const cache = new FetchCache(CACHE);
async function fetchWithRetries(url, { mode = "text", attempts = 3, timeoutMs = 45_000 } = {}) {
  const cached = await cache.read(url, mode);
  if (cached) return { ...cached, cached: true };
  let errorText = "";
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const headers = { "user-agent": "VWYS-Articles-Audit/1.0", accept: "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8" };
      if (mode === "probe") headers.range = "bytes=0-31";
      const redirectChain = [];
      let currentUrl = url;
      for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
        const response = await fetch(currentUrl, { headers, redirect: "manual", signal: controller.signal });
        const location = response.headers.get("location");
        if (response.status >= 300 && response.status < 400 && location) {
          const nextUrl = new URL(location, currentUrl).toString();
          redirectChain.push({ from: currentUrl, status: response.status, to: nextUrl });
          if (isLegacy404Url(nextUrl)) {
            clearTimeout(timer);
            const result = {
              requestedUrl: url, finalUrl: nextUrl, status: 404, redirected: true,
              redirectedToLegacy404: true, redirectChain, mime: response.headers.get("content-type") ?? "",
              signature: "", error: "redirected to legacy /index.php/404", body: Buffer.alloc(0),
            };
            await cache.write(url, mode, result);
            return result;
          }
          if (hop === MAX_REDIRECTS) throw new Error(`too many redirects after ${MAX_REDIRECTS} hops`);
          currentUrl = nextUrl;
          continue;
        }
        let body = Buffer.alloc(0);
        if (mode !== "probe") body = Buffer.from(await response.arrayBuffer());
        else if (response.body) {
          const reader = response.body.getReader();
          const first = await reader.read();
          body = Buffer.from(first.value ?? new Uint8Array());
          await reader.cancel();
        }
        clearTimeout(timer);
        const result = {
          requestedUrl: url, finalUrl: currentUrl, status: response.status, redirected: redirectChain.length > 0,
          redirectedToLegacy404: false, redirectChain, mime: response.headers.get("content-type") ?? "",
          signature: body.subarray(0, 16).toString("latin1"), error: "", body,
        };
        if ((response.status === 429 || response.status >= 500) && attempt < attempts) {
          clearTimeout(timer);
          await sleep(500 * attempt);
          break;
        }
        await cache.write(url, mode, result);
        return result;
      }
    } catch (error) {
      clearTimeout(timer);
      errorText = error?.name === "AbortError" ? `timeout after ${timeoutMs}ms` : String(error?.message ?? error);
      if (attempt < attempts) await sleep(500 * attempt);
    }
  }
  const result = { requestedUrl: url, finalUrl: "", status: 0, redirected: false, redirectedToLegacy404: false, redirectChain: [], mime: "", signature: "", error: errorText, body: Buffer.alloc(0) };
  await cache.write(url, mode, result);
  return result;
}

async function concurrent(items, worker, label) {
  const results = new Array(items.length); let cursor = 0; let done = 0;
  const runners = Array.from({ length: Math.min(CONCURRENCY, Math.max(1, items.length)) }, async () => {
    while (true) {
      const index = cursor++; if (index >= items.length) return;
      results[index] = await worker(items[index]); done += 1;
      if (done === items.length || done % 25 === 0) process.stdout.write(`\r[audit-articles] ${label}: ${done}/${items.length}`);
    }
  });
  await Promise.all(runners);
  if (items.length) process.stdout.write("\n");
  return results;
}

function parseListing(html, collection, listingUrl) {
  const $ = cheerio.load(html); const records = [];
  $(".archive__item").each((_, element) => {
    const root = $(element);
    const anchor = root.find("a[href*='publicacion'], a[href*='publication']").first();
    const detailUrl = toAbsolute(anchor.attr("href"), listingUrl); const legacyId = articlePid(detailUrl);
    if (!legacyId) return;
    records.push({ sourceKey: `${collection.language}:${legacyId}`, language: collection.language, legacyId, listingUrl, detailUrl, title: clean(root.find(".archive__item--ttl").first().text() || anchor.text()), date: parseDate(root.find(".archive__item--date").first().text()) });
  });
  const last = $(".pagination-end a[href*='start=']").attr("href") ?? "";
  const lastStart = Number(new URL(toAbsolute(last, listingUrl) || listingUrl).searchParams.get("start") || 0);
  return { records, lastStart };
}

function parseOfficialDetail(item, result) {
  const $ = cheerio.load(result.body.toString("utf8"));
  const root = $(".single").first().length ? $(".single").first() : $("#main").first();
  const visible = $(".single__meta--name").first();
  const intro = clean($(".single__content--intro").first().text());
  const body = clean($(".single__content--txt").map((_, element) => $(element).text()).get().join(" "));
  const counterparts = $(".header__lang--item").map((_, element) => toAbsolute($(element).attr("href"), item.detailUrl)).get().filter((url) => /\/publicacion|\/publication/i.test(url));
  const links = unique(root.find("a[href]").map((_, element) => toAbsolute($(element).attr("href"), item.detailUrl)).get().filter(isHttp));
  const pdfUrls = links.filter((url) => /\.pdf(?:$|[?#])/i.test(new URL(url).pathname));
  const contentUrls = links.filter((url) => !pdfUrls.includes(url));
  const description = $("meta[name='description']").map((_, element) => clean($(element).attr("content"))).get().find(Boolean) ?? "";
  const ogTitle = clean($("meta[property='og:title']").attr("content"));
  const ogDescription = clean($("meta[property='og:description']").attr("content"));
  const externalContent = contentUrls.filter((url) => !new URL(url).hostname.endsWith("vonwobeser.com"));
  const sourceOnly = !body && externalContent.length > 0;
  return {
    ...item,
    status: result.status, finalUrl: result.finalUrl, fetchError: result.error, mime: result.mime,
    documentTitle: clean($("title").text()), description, ogTitle, ogDescription,
    canonical: toAbsolute($("link[rel='canonical']").attr("href"), item.detailUrl),
    hreflang: $("link[hreflang][href]").map((_, element) => `${$(element).attr("hreflang")}:${toAbsolute($(element).attr("href"), item.detailUrl)}`).get(),
    visibleTitle: clean(visible.text() || item.title), visibleTitleTag: visible.get(0)?.tagName?.toLowerCase() ?? "",
    intro, body, introHash: textHash(intro), bodyHash: textHash(body), sourceOnly,
    counterpartLegacyId: articlePid(counterparts[0]), pdfUrls, contentUrls, externalContent,
  };
}

function matchProjectRecord(official, detailByKey, projectByLegacy) {
  const direct = projectByLegacy.get(official.legacyId) ?? [];
  if (direct.length === 1) return { row: direct[0], status: "legacy_id", counterpartVerified: false };
  if (direct.length > 1) return { row: null, status: "ambiguous_legacy_id", counterpartVerified: false };
  const counterpart = official.counterpartLegacyId ? detailByKey.get(`${official.language === "es" ? "en" : "es"}:${official.counterpartLegacyId}`) : null;
  const reciprocal = counterpart?.counterpartLegacyId === official.legacyId;
  const counterpartRows = reciprocal ? projectByLegacy.get(official.counterpartLegacyId) ?? [] : [];
  if (counterpartRows.length === 1) return { row: counterpartRows[0], status: "verified_language_counterpart", counterpartVerified: true };
  return { row: null, status: counterpartRows.length > 1 ? "ambiguous_language_counterpart" : "project_missing", counterpartVerified: false };
}

function compareRecord(official, match) {
  const row = match.row; const findings = [];
  const add = (code) => findings.push(code);
  if (!official.status || official.status < 200 || official.status >= 300) add("OFFICIAL_DETAIL_INACCESSIBLE");
  if (!row) return { ...official, matchStatus: match.status, projectId: "", projectSlug: "", projectLegacyId: "", projectPublished: "", projectDate: "", dateComparison: "not_applicable", titleComparison: "not_applicable", excerptComparison: "not_applicable", contentComparison: "not_applicable", sourceComparison: "not_applicable", categoryComparison: "not_applicable", findings };
  const projectDate = row.date ? new Date(row.date).toISOString().slice(0, 10) : "";
  const dateComparison = !official.date.normalized ? "official_missing" : !projectDate ? "project_missing" : projectDate.slice(0, 7) === official.date.normalized.slice(0, 7) ? "match" : "different";
  const titleComparison = compareText(official.visibleTitle, localize(row, "title", official.language));
  const excerptComparison = official.sourceOnly ? "source_only" : compareText(official.intro, localize(row, "excerpt", official.language));
  const localContent = comparableHtml(localize(row, "content", official.language));
  const contentComparison = official.sourceOnly ? "source_only" : compareText(`${official.intro} ${official.body}`, localContent);
  const officialSources = unique([...official.externalContent, ...official.pdfUrls]);
  const sourceComparison = official.sourceOnly
    ? (!row.sourceUrl ? "project_missing" : officialSources.some((url) => sameUrl(url, row.sourceUrl)) ? "match" : "different")
    : (!row.sourceUrl ? "not_applicable" : officialSources.some((url) => sameUrl(url, row.sourceUrl)) ? "match" : "different");
  const categoryComparison = String(row.category || "").toLowerCase() === "articles" ? "match" : "different";
  if (dateComparison !== "match") add(`DATE_${dateComparison.toUpperCase()}`);
  if (titleComparison !== "match") add(`TITLE_${titleComparison.toUpperCase()}`);
  if (!official.sourceOnly && excerptComparison === "project_missing") add("EXCERPT_PROJECT_MISSING");
  if (!official.sourceOnly && contentComparison === "project_missing") add("CONTENT_PROJECT_MISSING");
  if (!official.sourceOnly && contentComparison === "different") add("CONTENT_DIFFERENT");
  if (official.sourceOnly && sourceComparison !== "match") add(`SOURCE_${sourceComparison.toUpperCase()}`);
  if (categoryComparison !== "match") add("CATEGORY_DIFFERENT");
  if (row.published !== true) add("PROJECT_NOT_PUBLISHED");
  return { ...official, matchStatus: match.status, projectId: row.id, projectSlug: row.slug, projectLegacyId: row.legacyId || "", projectPublished: String(Boolean(row.published)), projectDate, dateComparison, titleComparison, excerptComparison, contentComparison, sourceComparison, categoryComparison, findings };
}

function parseProjectDocument(language, row, result) {
  const url = projectDetailUrl(row.slug, language);
  if (!result.status || result.status < 200 || result.status >= 300) return { projectId: row.id, language, url, status: result.status, classification: classifyLink(result, "project-detail"), h1Count: 0, h1Text: "", documentTitle: "", description: "", canonical: "", hreflang: [], sourceExpectedUrl: String(row.sourceUrl ?? ""), sourceCtaHref: "", sourceCtaMatches: false, sourceCtaSecure: false, contentLinks: [], rawUrlTexts: [], findings: ["PROJECT_HTML_INACCESSIBLE"] };
  const $ = cheerio.load(result.body.toString("utf8"));
  const h1 = $("h1"); const expectedTitle = localize(row, "title", language);
  const h1Text = clean(h1.first().text()); const findings = [];
  if (h1.length !== 1) findings.push("PROJECT_H1_COUNT_INVALID");
  if (normalized(h1Text) !== normalized(expectedTitle)) findings.push("PROJECT_H1_TITLE_DIFFERENT");
  if (!$("link[rel='canonical']").attr("href")) findings.push("PROJECT_CANONICAL_MISSING");
  const contentRoot = $(".single__content--intro, .single__content--txt");
  const rawUrlTexts = rawHttpUrlsOutsideAnchors($, contentRoot);
  if (rawUrlTexts.length) findings.push("PROJECT_VISIBLE_RAW_URL");
  const sourceExpectedUrl = String(row.sourceUrl ?? "").trim();
  const sourceCta = $(".vw-news-source-link a[href]").first();
  const sourceCtaHref = toAbsolute(sourceCta.attr("href"), url);
  const sourceCtaMatches = !sourceExpectedUrl || sameUrl(sourceCtaHref, sourceExpectedUrl);
  const sourceCtaSecure = !sourceExpectedUrl || (sourceCta.attr("target") === "_blank" && sourceCta.attr("rel") === "noopener noreferrer");
  if (sourceExpectedUrl && (!sourceCtaHref || !sourceCtaMatches || !sourceCtaSecure)) findings.push("PROJECT_SOURCE_CTA_INVALID");
  return { projectId: row.id, language, url, status: result.status, classification: classifyLink(result, "project-detail"), h1Count: h1.length, h1Text, documentTitle: clean($("title").text()), description: clean($("meta[name='description']").attr("content")), canonical: toAbsolute($("link[rel='canonical']").attr("href"), url), hreflang: $("link[hreflang][href]").map((_, element) => `${$(element).attr("hreflang")}:${$(element).attr("href")}`).get(), sourceExpectedUrl, sourceCtaHref, sourceCtaMatches, sourceCtaSecure, contentLinks: publicContentLinks($, contentRoot, url), rawUrlTexts, findings };
}

async function loadProjectArticles() {
  const sql = createSqlClient(process.env.DATABASE_URL);
  try {
    const rows = await sql`
      select id, title, title_es as "titleEs", excerpt, excerpt_es as "excerptEs", content, content_es as "contentEs",
             source_url as "sourceUrl", slug, date, published, category, category_es as "categoryEs", legacy_id as "legacyId"
      from news
      where lower(coalesce(category, '')) = 'articles'
    `;
    return rows;
  } finally { await sql.end(); }
}

async function main() {
  await cache.init(); await fs.mkdir(OUTPUT, { recursive: true });
  console.log(`[audit-articles] Salida: ${OUTPUT}`); console.log(`[audit-articles] Caché temporal: ${CACHE}`);
  const listingRecords = []; const collections = [];
  for (const collection of COLLECTIONS) {
    const firstResult = await fetchWithRetries(collection.url);
    if (firstResult.status < 200 || firstResult.status >= 300) throw new Error(`No se pudo leer ${collection.url}: ${firstResult.status} ${firstResult.error}`);
    const first = parseListing(firstResult.body.toString("utf8"), collection, collection.url);
    const starts = Array.from({ length: Math.floor(first.lastStart / 10) + 1 }, (_, index) => index * 10);
    const pages = await concurrent(MAX_PAGES ? starts.slice(0, MAX_PAGES) : starts, async (start) => {
      const pageUrl = start ? `${collection.url}?start=${start}` : collection.url;
      const result = start === 0 ? firstResult : await fetchWithRetries(pageUrl);
      return { pageUrl, result, parsed: result.status >= 200 && result.status < 300 ? parseListing(result.body.toString("utf8"), collection, pageUrl) : { records: [] } };
    }, `listados ${collection.language}`);
    const records = [...new Map(pages.flatMap((page) => page.parsed.records).map((item) => [item.sourceKey, item])).values()];
    listingRecords.push(...records);
    collections.push({ language: collection.language, pages: pages.length, expectedLastStart: first.lastStart, items: records.length, pageErrors: pages.filter((page) => page.result.status < 200 || page.result.status >= 300).map((page) => ({ url: page.pageUrl, status: page.result.status, error: page.result.error })) });
  }
  const uniqueListings = [...new Map(listingRecords.map((item) => [item.sourceKey, item])).values()];
  const detailTargets = MAX_DETAILS ? uniqueListings.slice(0, MAX_DETAILS) : uniqueListings;
  const officialDetails = await concurrent(detailTargets, async (item) => parseOfficialDetail(item, await fetchWithRetries(item.detailUrl)), "fichas oficiales");
  const detailByKey = new Map(officialDetails.map((item) => [item.sourceKey, item]));
  const projectRows = await loadProjectArticles();
  const projectByLegacy = new Map();
  for (const row of projectRows) {
    const key = String(row.legacyId || "").trim(); if (key) projectByLegacy.set(key, [...(projectByLegacy.get(key) || []), row]);
  }
  const inventory = officialDetails.map((item) => compareRecord(item, matchProjectRecord(item, detailByKey, projectByLegacy)));
  const matchedProjectIds = new Set(inventory.map((item) => item.projectId).filter(Boolean));
  const projectRowById = new Map(projectRows.map((row) => [row.id, row]));
  const projectOnly = projectRows.filter((row) => !matchedProjectIds.has(row.id)).map((row) => ({ id: row.id, legacyId: row.legacyId || "", slug: row.slug, date: row.date ? new Date(row.date).toISOString().slice(0, 10) : "", published: Boolean(row.published), titleEs: row.titleEs, title: row.title, reason: row.legacyId ? "legacy_id_not_in_official_articles" : "without_legacy_id" }));

  const uniqueProjectRows = [...new Map(inventory.filter((item) => item.projectId).map((item) => [item.projectId, projectRows.find((row) => row.id === item.projectId)])).values()];
  const projectDocuments = await concurrent(uniqueProjectRows.flatMap((row) => ["es", "en"].map((language) => ({ row, language }))), async ({ row, language }) => parseProjectDocument(language, row, await fetchWithRetries(projectDetailUrl(row.slug, language))), "cabeceras públicas");
  const linkTargets = [];
  for (const item of inventory) {
    linkTargets.push({ owner: item.sourceKey, source: "official", kind: "official-detail", language: item.language, url: item.detailUrl, existing: item });
    for (const url of item.pdfUrls) linkTargets.push({ owner: item.sourceKey, source: "official", kind: "pdf", language: item.language, url });
    for (const url of item.contentUrls) linkTargets.push({ owner: item.sourceKey, source: "official", kind: "content-link", language: item.language, url });
    if (item.projectSlug && item.sourceComparison !== "not_applicable") {
      const sourceUrl = projectRowById.get(item.projectId)?.sourceUrl ?? "";
      // La fuente configurada y el CTA público se verifican tal cual se entregan
      // al lector. Compartir el p_id con una ficha oficial no prueba que esta URL
      // concreta sea navegable.
      linkTargets.push({ owner: item.sourceKey, source: "project", kind: "source-url", language: item.language, url: sourceUrl });
    }
  }
  for (const document of projectDocuments) {
    const owner = `${document.projectId}:${document.language}`;
    if (document.sourceCtaHref) linkTargets.push({ owner, source: "project-public", kind: "public-source-cta", language: document.language, url: document.sourceCtaHref });
    for (const url of document.contentLinks) linkTargets.push({ owner, source: "project-public", kind: "public-content-link", language: document.language, url });
  }
  const auditableLinkTargets = linkTargets.filter((target) => isHttp(target.url));
  const uniqueLinks = [...new Map(auditableLinkTargets.map((target) => [`${target.kind}:${target.url}`, target])).values()];
  const probes = SKIP_LINKS ? [] : await concurrent(uniqueLinks, async (target) => {
    const result = target.existing ? { status: target.existing.status, finalUrl: target.existing.finalUrl, redirected: target.existing.finalUrl !== target.url, redirectedToLegacy404: false, redirectChain: [], mime: target.existing.mime, signature: "", error: target.existing.fetchError } : await fetchWithRetries(target.url, { mode: "probe" });
    return {
      key: `${target.kind}:${target.url}`, status: result.status, finalUrl: result.finalUrl,
      redirected: result.redirected, redirectedToLegacy404: result.redirectedToLegacy404,
      redirectChain: (result.redirectChain ?? []).map((hop) => `${hop.status}:${hop.from}=>${hop.to}`).join(" | "),
      mime: result.mime, error: result.error, classification: classifyLink(result, target.kind),
    };
  }, "enlaces");
  const probeByKey = new Map(probes.map((probe) => [probe.key, probe]));
  const links = SKIP_LINKS ? [] : auditableLinkTargets.map((target) => ({ ...target, ...probeByKey.get(`${target.kind}:${target.url}`) }));

  const headerByProjectLanguage = new Map(projectDocuments.map((item) => [`${item.projectId}:${item.language}`, item]));
  for (const item of inventory) {
    if (!item.projectId) continue;
    const header = headerByProjectLanguage.get(`${item.projectId}:${item.language}`);
    item.projectHtmlStatus = header?.classification ?? "not_checked";
    item.projectH1Count = header?.h1Count ?? "";
    item.projectH1Comparison = header?.findings.includes("PROJECT_H1_TITLE_DIFFERENT") ? "different" : header?.findings.includes("PROJECT_H1_COUNT_INVALID") ? "invalid_count" : header ? "match" : "not_checked";
    item.projectCanonical = header?.canonical ?? "";
    item.findings.push(...(header?.findings ?? []));
  }

  const rawVisibleUrls = projectDocuments.flatMap((document) => document.rawUrlTexts.map((url) => ({ projectId: document.projectId, language: document.language, pageUrl: document.url, url })));
  const publicLinks = links.filter((item) => item.source === "project-public");
  const headers = ["sourceKey", "language", "legacyId", "counterpartLegacyId", "listingUrl", "officialUrl", "officialStatus", "officialFinalUrl", "officialDateRaw", "officialDateNormalized", "officialDatePrecision", "officialDocumentTitle", "officialDescription", "officialOgTitle", "officialOgDescription", "officialCanonical", "officialHreflang", "officialVisibleTitle", "officialVisibleTitleTag", "officialIntroHash", "officialBodyHash", "officialSourceOnly", "officialPdfUrls", "officialContentUrls", "matchStatus", "projectId", "projectSlug", "projectLegacyId", "projectPublished", "projectDate", "dateComparison", "titleComparison", "excerptComparison", "contentComparison", "sourceComparison", "categoryComparison", "projectHtmlStatus", "projectH1Count", "projectH1Comparison", "projectCanonical", "projectSourceCtaMatches", "projectSourceCtaSecure", "projectVisibleRawUrlCount", "findings"];
  const inventoryRows = inventory.map((item) => ({
    sourceKey: item.sourceKey, language: item.language, legacyId: item.legacyId, counterpartLegacyId: item.counterpartLegacyId, listingUrl: item.listingUrl, officialUrl: item.detailUrl, officialStatus: item.status, officialFinalUrl: item.finalUrl, officialDateRaw: item.date.raw, officialDateNormalized: item.date.normalized, officialDatePrecision: item.date.precision, officialDocumentTitle: item.documentTitle, officialDescription: item.description, officialOgTitle: item.ogTitle, officialOgDescription: item.ogDescription, officialCanonical: item.canonical, officialHreflang: item.hreflang, officialVisibleTitle: item.visibleTitle, officialVisibleTitleTag: item.visibleTitleTag, officialIntroHash: item.introHash, officialBodyHash: item.bodyHash, officialSourceOnly: item.sourceOnly, officialPdfUrls: item.pdfUrls, officialContentUrls: item.contentUrls, matchStatus: item.matchStatus, projectId: item.projectId, projectSlug: item.projectSlug, projectLegacyId: item.projectLegacyId, projectPublished: item.projectPublished, projectDate: item.projectDate, dateComparison: item.dateComparison, titleComparison: item.titleComparison, excerptComparison: item.excerptComparison, contentComparison: item.contentComparison, sourceComparison: item.sourceComparison, categoryComparison: item.categoryComparison, projectHtmlStatus: item.projectHtmlStatus ?? "", projectH1Count: item.projectH1Count ?? "", projectH1Comparison: item.projectH1Comparison ?? "", projectCanonical: item.projectCanonical ?? "", projectSourceCtaMatches: headerByProjectLanguage.get(`${item.projectId}:${item.language}`)?.sourceCtaMatches ?? "", projectSourceCtaSecure: headerByProjectLanguage.get(`${item.projectId}:${item.language}`)?.sourceCtaSecure ?? "", projectVisibleRawUrlCount: headerByProjectLanguage.get(`${item.projectId}:${item.language}`)?.rawUrlTexts.length ?? "", findings: item.findings,
  }));
  const findingCount = (code) => inventory.reduce((total, item) => total + item.findings.filter((finding) => finding === code).length, 0);
  const summary = {
    generatedAt: new Date().toISOString(), mode: "read-only", scope: "articles", sourceCutoff: STAMP,
    officialOrigin: OFFICIAL_ORIGIN, projectOrigin: PROJECT_ORIGIN, parameters: { concurrency: CONCURRENCY, maxPages: MAX_PAGES, maxDetails: MAX_DETAILS, skipLinks: SKIP_LINKS }, collections,
    counts: {
      officialLocalizedEntries: inventory.length, officialSpanishEntries: inventory.filter((item) => item.language === "es").length, officialEnglishEntries: inventory.filter((item) => item.language === "en").length,
      officialDetailsAccessible: inventory.filter((item) => item.status >= 200 && item.status < 300).length, projectArticles: projectRows.length, directLegacyMatches: inventory.filter((item) => item.matchStatus === "legacy_id").length, verifiedLanguageCounterpartMatches: inventory.filter((item) => item.matchStatus === "verified_language_counterpart").length, missingInProject: inventory.filter((item) => item.matchStatus === "project_missing").length, ambiguousMatches: inventory.filter((item) => item.matchStatus.startsWith("ambiguous")).length, projectOnly: projectOnly.length,
      dateMatch: inventory.filter((item) => item.dateComparison === "match").length, sourceOnlyOfficial: inventory.filter((item) => item.sourceOnly).length, linkTargets: links.length, brokenLinks: links.filter((item) => item.classification === "roto").length, inaccessibleLinks: links.filter((item) => item.classification === "inaccesible").length, blockedLinks: links.filter((item) => item.classification === "bloqueado").length, serverErrorLinks: links.filter((item) => item.classification === "error").length,
      publicDetailPages: projectDocuments.length, publicSourceCtasExpected: projectDocuments.filter((item) => item.sourceExpectedUrl).length, publicSourceCtasValid: projectDocuments.filter((item) => item.sourceExpectedUrl && item.sourceCtaMatches && item.sourceCtaSecure).length, publicContentLinks: publicLinks.length, publicBrokenLinks: publicLinks.filter((item) => item.classification === "roto").length, publicVisibleRawUrls: rawVisibleUrls.length,
    },
    findingCounts: Object.fromEntries(unique(inventory.flatMap((item) => item.findings)).sort().map((code) => [code, findingCount(code)])),
  };
  const linkHeaders = ["owner", "source", "kind", "language", "url", "status", "classification", "finalUrl", "redirected", "redirectedToLegacy404", "redirectChain", "mime", "error"];
  const headerHeaders = ["projectId", "language", "url", "status", "classification", "h1Count", "h1Text", "documentTitle", "description", "canonical", "hreflang", "sourceExpectedUrl", "sourceCtaHref", "sourceCtaMatches", "sourceCtaSecure", "contentLinks", "rawUrlTexts", "findings"];
  await Promise.all([
    fs.writeFile(path.join(OUTPUT, `VWYS_Auditoria_Articulos_${STAMP}.resumen.json`), `${JSON.stringify(summary, null, 2)}\n`),
    fs.writeFile(path.join(OUTPUT, `VWYS_Auditoria_Articulos_${STAMP}.inventario.csv`), toCsv(inventoryRows, headers)),
    fs.writeFile(path.join(OUTPUT, `VWYS_Auditoria_Articulos_${STAMP}.diferencias.csv`), toCsv(inventoryRows.filter((row) => row.findings.length), headers)),
    fs.writeFile(path.join(OUTPUT, `VWYS_Auditoria_Articulos_${STAMP}.enlaces.csv`), toCsv(links, linkHeaders)),
    fs.writeFile(path.join(OUTPUT, `VWYS_Auditoria_Articulos_${STAMP}.enlaces-publicos.csv`), toCsv(publicLinks, linkHeaders)),
    fs.writeFile(path.join(OUTPUT, `VWYS_Auditoria_Articulos_${STAMP}.urls-sin-hipervinculo.csv`), toCsv(rawVisibleUrls, ["projectId", "language", "pageUrl", "url"])),
    fs.writeFile(path.join(OUTPUT, `VWYS_Auditoria_Articulos_${STAMP}.cabeceras.csv`), toCsv(projectDocuments, headerHeaders)),
    fs.writeFile(path.join(OUTPUT, `VWYS_Auditoria_Articulos_${STAMP}.proyecto-sin-correspondencia.csv`), toCsv(projectOnly, ["id", "legacyId", "slug", "date", "published", "titleEs", "title", "reason"])),
    fs.writeFile(path.join(OUTPUT, `VWYS_Auditoria_Articulos_${STAMP}.snapshot.json`), `${JSON.stringify({ summary, inventory: inventoryRows, links, publicLinks, rawVisibleUrls, projectDocuments, projectOnly }, null, 2)}\n`),
  ]);
  console.log(JSON.stringify(summary.counts, null, 2));
  console.log(`[audit-articles] Evidencias generadas en ${OUTPUT}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`[audit-articles] ERROR: ${error.stack || error.message}`);
    process.exitCode = 1;
  });
}

export { classifyLink, compareText, matchProjectRecord, parseDate, parseProjectDocument, rawHttpUrlsOutsideAnchors };
