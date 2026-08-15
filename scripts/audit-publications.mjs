#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_STAMP = "2026-08-14";
const OFFICIAL_ORIGIN = "https://www.vonwobeser.com";
const PROJECT_ORIGIN = "https://webpage-von-wobeser-2026.replit.app";

const argv = process.argv.slice(2);
const argValue = (name, fallback) => {
  const prefix = `--${name}=`;
  const found = argv.find((value) => value.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
};
const hasFlag = (name) => argv.includes(`--${name}`);
const STAMP = argValue("stamp", DEFAULT_STAMP);
const OUTPUT_DIR = path.resolve(ROOT, argValue("output", `output/audits/publicaciones-${STAMP}`));
const CACHE_DIR = path.resolve(argValue("cache", `/tmp/vwys-publications-audit-cache-${STAMP.replaceAll("-", "")}`));
const CONCURRENCY = Math.max(1, Number(argValue("concurrency", "6")) || 6);
const MAX_DETAILS = Math.max(0, Number(argValue("max-details", "0")) || 0);
const MAX_PAGES = Math.max(0, Number(argValue("max-pages", "0")) || 0);
const SKIP_LINKS = hasFlag("skip-links");
const REFRESH = hasFlag("refresh");
const USER_AGENT = "VWYS-Publications-Audit/1.0 (+https://webpage-von-wobeser-2026.replit.app/)";

const COLLECTIONS = [
  { key: "es-news", language: "es", type: "news", url: `${OFFICIAL_ORIGIN}/index.php/publicaciones/noticias` },
  { key: "en-news", language: "en", type: "news", url: `${OFFICIAL_ORIGIN}/index.php/publications/news` },
  { key: "es-articles", language: "es", type: "articles", url: `${OFFICIAL_ORIGIN}/index.php/publicaciones/articulos` },
  { key: "en-articles", language: "en", type: "articles", url: `${OFFICIAL_ORIGIN}/index.php/publications/articles` },
];

const MONTHS = new Map([
  ["enero", 1], ["febrero", 2], ["marzo", 3], ["abril", 4], ["mayo", 5], ["junio", 6],
  ["julio", 7], ["agosto", 8], ["septiembre", 9], ["octubre", 10], ["noviembre", 11], ["diciembre", 12],
  ["january", 1], ["february", 2], ["march", 3], ["april", 4], ["may", 5], ["june", 6],
  ["july", 7], ["august", 8], ["september", 9], ["october", 10], ["november", 11], ["december", 12],
]);

const AUTHOR_EMAIL_ALIASES = new Map([
  ["admartinez", "amartinez"],
  ["alperez", "aperez"],
  ["bcruz", "mcruz"],
  ["efsanchez", "esanchez"],
  ["mgomez", "mvallin"],
  ["preyes", "pretana"],
  ["rrosasg", "rrosas"],
]);

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const cleanSpace = (value) => String(value ?? "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
const stripDiacritics = (value) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const normalizeText = (value) => stripDiacritics(cleanSpace(value)).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const normalizeTitle = (value) => normalizeText(value).replace(/\b(von wobeser y sierra|sc)\b/g, " ").replace(/\s+/g, " ").trim();
const localPart = (email) => String(email ?? "").trim().toLowerCase().split("@")[0];
const absoluteUrl = (href, base) => {
  if (!href) return "";
  try {
    return new URL(String(href).replace(/&amp;/g, "&"), base).toString();
  } catch {
    return "";
  }
};
const publicationId = (url) => {
  const match = String(url ?? "").match(/[?\/-]p_id(?:=|-)(\d+)/i);
  return match?.[1] ?? "";
};
const isHttp = (url) => /^https?:\/\//i.test(String(url ?? ""));
const csvCell = (value) => {
  const text = Array.isArray(value) ? value.join(" | ") : value == null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};
const toCsv = (rows, headers) => `${headers.map(csvCell).join(",")}\n${rows.map((row) => headers.map((key) => csvCell(row[key])).join(",")).join("\n")}\n`;
const unique = (values) => [...new Set(values.filter(Boolean))];
const basenameKey = (url) => {
  try {
    return decodeURIComponent(path.basename(new URL(url).pathname)).toLowerCase().replace(/(?:[_-](?:esp|espanol|spanish|eng|ing|english))(?=\.[^.]+$)/g, "");
  } catch {
    return "";
  }
};

function parseDate(raw) {
  const text = cleanSpace(raw).replace(/[.]/g, "");
  if (!text) return { raw: "", normalized: "", precision: "missing" };
  let match = stripDiacritics(text.toLowerCase()).match(/\b(\d{1,2})\s+(?:de\s+)?([a-z]+)(?:\s+de)?[,\s]+(\d{4})\b/);
  if (match && MONTHS.has(match[2])) {
    const month = MONTHS.get(match[2]);
    return { raw: text, normalized: `${match[3]}-${String(month).padStart(2, "0")}-${String(Number(match[1])).padStart(2, "0")}`, precision: "day" };
  }
  match = stripDiacritics(text.toLowerCase()).match(/\b([a-z]+)[,\s]+(\d{4})\b/);
  if (match && MONTHS.has(match[1])) {
    const month = MONTHS.get(match[1]);
    return { raw: text, normalized: `${match[2]}-${String(month).padStart(2, "0")}`, precision: "month" };
  }
  match = text.match(/\b(\d{4})[-/]([01]?\d)(?:[-/]([0-3]?\d))?\b/);
  if (match) {
    return { raw: text, normalized: `${match[1]}-${String(Number(match[2])).padStart(2, "0")}${match[3] ? `-${String(Number(match[3])).padStart(2, "0")}` : ""}`, precision: match[3] ? "day" : "month" };
  }
  return { raw: text, normalized: "", precision: "unparsed" };
}

function languageScore(text) {
  const words = new Set(normalizeText(text).split(" ").filter(Boolean));
  const esWords = ["el", "la", "los", "las", "de", "del", "que", "para", "con", "una", "por", "se", "en", "como", "mexico"];
  const enWords = ["the", "of", "and", "to", "in", "for", "with", "that", "this", "from", "as", "is", "mexico"];
  const es = esWords.reduce((sum, word) => sum + Number(words.has(word)), 0);
  const en = enWords.reduce((sum, word) => sum + Number(words.has(word)), 0);
  return { es, en, probable: es >= en + 2 ? "es" : en >= es + 2 ? "en" : "unknown" };
}

function similarity(left, right) {
  const a = new Set(normalizeText(left).split(" ").filter((word) => word.length > 2));
  const b = new Set(normalizeText(right).split(" ").filter((word) => word.length > 2));
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const word of a) if (b.has(word)) intersection += 1;
  return intersection / (a.size + b.size - intersection);
}

class FetchCache {
  constructor(root) {
    this.root = root;
  }

  async init() {
    await fs.mkdir(this.root, { recursive: true });
  }

  paths(url, mode) {
    const key = sha256(`${mode}:${url}`);
    return {
      meta: path.join(this.root, `${key}.json`),
      body: path.join(this.root, `${key}.body`),
    };
  }

  async read(url, mode) {
    if (REFRESH) return null;
    const files = this.paths(url, mode);
    try {
      const meta = JSON.parse(await fs.readFile(files.meta, "utf8"));
      const body = mode === "probe" ? Buffer.alloc(0) : await fs.readFile(files.body);
      return { ...meta, body };
    } catch {
      return null;
    }
  }

  async write(url, mode, result) {
    const files = this.paths(url, mode);
    const { body, ...meta } = result;
    await fs.writeFile(files.meta, `${JSON.stringify(meta, null, 2)}\n`);
    if (mode !== "probe") await fs.writeFile(files.body, body ?? Buffer.alloc(0));
  }
}

const cache = new FetchCache(CACHE_DIR);

async function requestWithRetries(url, { mode = "text", attempts = 3, timeoutMs = 60000 } = {}) {
  const cached = await cache.read(url, mode);
  if (cached) return { ...cached, cached: true };
  let lastError = "";
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const startedAt = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const headers = { "user-agent": USER_AGENT, accept: mode === "json" ? "application/json" : "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8" };
      if (mode === "probe") headers.range = "bytes=0-15";
      const response = await fetch(url, { headers, redirect: "follow", signal: controller.signal });
      const headerObject = Object.fromEntries(response.headers.entries());
      let body = Buffer.alloc(0);
      if (mode !== "probe") {
        body = Buffer.from(await response.arrayBuffer());
      } else if (response.body) {
        const reader = response.body.getReader();
        const first = await reader.read();
        body = Buffer.from(first.value ?? new Uint8Array());
        await reader.cancel();
      }
      clearTimeout(timer);
      const result = {
        requestedUrl: url,
        finalUrl: response.url,
        status: response.status,
        ok: response.ok,
        redirected: response.redirected,
        headers: headerObject,
        bytesRead: body.length,
        signature: body.subarray(0, 16).toString("latin1"),
        elapsedMs: Date.now() - startedAt,
        error: "",
        body,
      };
      if ((response.status === 429 || response.status >= 500) && attempt < attempts) {
        await sleep(500 * (2 ** (attempt - 1)));
        continue;
      }
      await cache.write(url, mode, result);
      return result;
    } catch (error) {
      clearTimeout(timer);
      lastError = error?.name === "AbortError" ? `timeout after ${timeoutMs}ms` : String(error?.message ?? error);
      if (attempt < attempts) await sleep(500 * (2 ** (attempt - 1)));
    }
  }
  const result = { requestedUrl: url, finalUrl: "", status: 0, ok: false, redirected: false, headers: {}, bytesRead: 0, signature: "", elapsedMs: 0, error: lastError, body: Buffer.alloc(0) };
  await cache.write(url, mode, result);
  return result;
}

async function mapConcurrent(items, concurrency, worker, label) {
  const results = new Array(items.length);
  let cursor = 0;
  let completed = 0;
  const started = Date.now();
  const runners = Array.from({ length: Math.min(concurrency, Math.max(1, items.length)) }, async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
      completed += 1;
      if (completed === items.length || completed % 25 === 0) {
        const seconds = Math.max(1, Math.round((Date.now() - started) / 1000));
        process.stdout.write(`\r[audit] ${label}: ${completed}/${items.length} (${seconds}s)`);
      }
    }
  });
  await Promise.all(runners);
  if (items.length) process.stdout.write("\n");
  return results;
}

function parseListing(html, collection, pageUrl) {
  const $ = cheerio.load(html);
  const items = [];
  $(".archive__item").each((_, element) => {
    const root = $(element);
    const detailAnchor = root.find("a[href*='publicacion'], a[href*='publication']").first();
    const detailUrl = absoluteUrl(detailAnchor.attr("href"), pageUrl);
    const pid = publicationId(detailUrl);
    if (!detailUrl || !pid) return;
    const pdfUrls = unique(root.find("a[href*='.pdf' i]").map((__, anchor) => absoluteUrl($(anchor).attr("href"), pageUrl)).get());
    const title = cleanSpace(root.find(".archive__item--ttl").first().text() || detailAnchor.text());
    const dateRaw = cleanSpace(root.find(".archive__item--date").first().text());
    const introHtml = root.find(".archive__item--intro").first().html() ?? "";
    const introText = cleanSpace(root.find(".archive__item--intro").first().text());
    items.push({
      sourceKey: `${collection.language}:${pid}`,
      pid,
      language: collection.language,
      type: collection.type,
      detailUrl,
      title,
      titleNormalized: normalizeTitle(title),
      date: parseDate(dateRaw),
      introHtml,
      introText,
      pdfUrls,
      listingUrl: pageUrl,
    });
  });
  const lastHref = $(".pagination-end a[href*='start=']").attr("href") ?? "";
  const lastStart = Number(new URL(absoluteUrl(lastHref, pageUrl) || pageUrl).searchParams.get("start") || 0);
  return { items, lastStart };
}

function detailContentRoot($) {
  const candidates = [$(".single").first(), $("article.item-page").first(), $("#main").first()];
  return candidates.find((candidate) => candidate.length && cleanSpace(candidate.text()).length > 20) ?? $("body");
}

function extractEmailContexts($, root) {
  const html = root.html() ?? "";
  const textWithLines = cheerio.load(`<div>${html.replace(/<br\s*\/?\s*>/gi, "\n").replace(/<\/(p|li|div|h[1-6])>/gi, "\n")}</div>`)("div").text();
  const lines = textWithLines.split(/\n+/).map(cleanSpace).filter(Boolean);
  const emails = [];
  for (let index = 0; index < lines.length; index += 1) {
    const matches = [...lines[index].matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)];
    for (const match of matches) {
      const context = cleanSpace([lines[index - 1], lines[index], lines[index + 1]].filter(Boolean).join(" | "));
      emails.push({ email: match[0].toLowerCase(), context });
    }
  }
  const deduped = new Map();
  for (const entry of emails) if (!deduped.has(entry.email)) deduped.set(entry.email, entry);
  return [...deduped.values()];
}

function parseDetail(html, item, result) {
  const $ = cheerio.load(html);
  const root = detailContentRoot($);
  const title = cleanSpace($(".single__meta--name").first().text() || item.title);
  const introNode = $(".single__content--intro").first();
  const bodyNodes = $(".single__content--txt");
  const introHtml = introNode.html() ?? item.introHtml ?? "";
  const bodyHtml = bodyNodes.map((_, node) => $(node).html() ?? "").get().join("\n");
  const introText = cleanSpace(introNode.text() || item.introText);
  const bodyText = cleanSpace(bodyNodes.text() || root.text());
  const langHref = $(".header__lang--item").map((_, anchor) => $(anchor).attr("href") ?? "").get().find((href) => /publicacion|publication/i.test(href)) ?? "";
  const languageUrl = absoluteUrl(langHref, item.detailUrl);
  const pdfUrls = unique([
    ...item.pdfUrls,
    ...root.find("a[href*='.pdf' i], a.page--btn.download").map((_, anchor) => absoluteUrl($(anchor).attr("href"), item.detailUrl)).get(),
  ]);
  const contentLinks = unique(root.find("a[href]").map((_, anchor) => absoluteUrl($(anchor).attr("href"), item.detailUrl)).get().filter(isHttp));
  const imageUrls = unique(root.find("img[src]").map((_, image) => absoluteUrl($(image).attr("src"), item.detailUrl)).get().filter(isHttp));
  const canonical = absoluteUrl($("link[rel='canonical']").attr("href"), item.detailUrl);
  const hreflang = $("link[hreflang][href]").map((_, link) => ({ language: $(link).attr("hreflang") ?? "", url: absoluteUrl($(link).attr("href"), item.detailUrl) })).get();
  return {
    ...item,
    title,
    titleNormalized: normalizeTitle(title),
    introHtml,
    introText,
    bodyHtml,
    bodyText,
    textHash: sha256(normalizeText(`${introText} ${bodyText}`)),
    probableLanguage: languageScore(`${title} ${introText} ${bodyText}`).probable,
    languageUrl,
    counterpartPid: publicationId(languageUrl),
    pdfUrls,
    contentLinks,
    imageUrls,
    canonical,
    hreflang,
    authors: extractEmailContexts($, root),
    status: result.status,
    finalUrl: result.finalUrl,
    redirected: result.redirected,
    mime: result.headers["content-type"] ?? "",
    fetchError: result.error,
  };
}

class DisjointSet {
  constructor(keys) {
    this.parent = new Map(keys.map((key) => [key, key]));
  }
  find(key) {
    if (!this.parent.has(key)) this.parent.set(key, key);
    const parent = this.parent.get(key);
    if (parent !== key) this.parent.set(key, this.find(parent));
    return this.parent.get(key);
  }
  union(a, b) {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA !== rootB) this.parent.set(rootB, rootA);
  }
}

function pairOfficial(details) {
  const byKey = new Map(details.map((item) => [item.sourceKey, item]));
  const byLanguagePid = new Map(details.map((item) => [`${item.language}:${item.pid}`, item]));
  const dsu = new DisjointSet(details.map((item) => item.sourceKey));
  for (const item of details) {
    if (!item.counterpartPid) continue;
    const counterpartLanguage = item.language === "es" ? "en" : "es";
    const counterpart = byLanguagePid.get(`${counterpartLanguage}:${item.counterpartPid}`);
    if (counterpart) dsu.union(item.sourceKey, counterpart.sourceKey);
  }
  const unpairedEs = details.filter((item) => item.language === "es" && dsu.find(item.sourceKey) === item.sourceKey && !item.counterpartPid);
  const unpairedEn = details.filter((item) => item.language === "en" && dsu.find(item.sourceKey) === item.sourceKey && !item.counterpartPid);
  const enByPdf = new Map();
  for (const item of unpairedEn) {
    for (const pdf of item.pdfUrls) {
      const key = basenameKey(pdf);
      if (!key) continue;
      if (!enByPdf.has(key)) enByPdf.set(key, []);
      enByPdf.get(key).push(item);
    }
  }
  for (const es of unpairedEs) {
    const candidates = unique(es.pdfUrls.flatMap((pdf) => enByPdf.get(basenameKey(pdf)) ?? []).map((entry) => entry.sourceKey)).map((key) => byKey.get(key)).filter(Boolean);
    const compatible = candidates.filter((en) => en.type === es.type && (!es.date.normalized || !en.date.normalized || es.date.normalized.slice(0, 7) === en.date.normalized.slice(0, 7)));
    if (compatible.length === 1) dsu.union(es.sourceKey, compatible[0].sourceKey);
  }
  const components = new Map();
  for (const item of details) {
    const root = dsu.find(item.sourceKey);
    if (!components.has(root)) components.set(root, []);
    components.get(root).push(item);
  }
  return [...components.values()].map((members) => {
    const esItems = members.filter((item) => item.language === "es");
    const enItems = members.filter((item) => item.language === "en");
    const types = unique(members.map((item) => item.type));
    const reciprocal = members.every((item) => {
      if (!item.counterpartPid) return members.length === 1;
      const counterpartLanguage = item.language === "es" ? "en" : "es";
      const counterpart = members.find((candidate) => candidate.language === counterpartLanguage && candidate.pid === item.counterpartPid);
      return Boolean(counterpart && (!counterpart.counterpartPid || counterpart.counterpartPid === item.pid));
    });
    const key = members.map((item) => item.sourceKey).sort().join("|");
    return {
      canonicalId: `official-${sha256(key).slice(0, 16)}`,
      type: types.length === 1 ? types[0] : "mixed",
      types,
      es: esItems[0] ?? null,
      en: enItems[0] ?? null,
      extraEs: esItems.slice(1),
      extraEn: enItems.slice(1),
      reciprocal,
      pairing: members.length > 1 ? (members.some((item) => item.counterpartPid) ? "language-link" : "pdf-fallback") : "unpaired",
      pairingReview: esItems.length > 1 || enItems.length > 1 || types.length > 1 || !reciprocal,
    };
  });
}

function extractProjectPdfUrls(row) {
  const html = `${row.content ?? ""}\n${row.contentEs ?? ""}`;
  const matches = [...html.matchAll(/https?:\/\/[^\s"'<>]+\.pdf(?:\?[^\s"'<>]*)?|\/(?:[^\s"'<>]+\/)*[^\s"'<>]+\.pdf(?:\?[^\s"'<>]*)?/gi)];
  return unique(matches.map((match) => absoluteUrl(match[0], PROJECT_ORIGIN)));
}

function projectMatchScore(row, canonical) {
  const pids = new Set([canonical.es?.pid, canonical.en?.pid].filter(Boolean));
  let score = pids.has(String(row.legacyId ?? "")) ? 100 : 0;
  if (canonical.es?.titleNormalized && normalizeTitle(row.titleEs) === canonical.es.titleNormalized) score += 45;
  if (canonical.en?.titleNormalized && normalizeTitle(row.title) === canonical.en.titleNormalized) score += 45;
  const officialPdfs = new Set(unique([...(canonical.es?.pdfUrls ?? []), ...(canonical.en?.pdfUrls ?? [])].map(basenameKey)));
  if (extractProjectPdfUrls(row).some((url) => officialPdfs.has(basenameKey(url)))) score += 50;
  const officialMonth = (canonical.es?.date.normalized || canonical.en?.date.normalized || "").slice(0, 7);
  if (officialMonth && String(row.date ?? "").slice(0, 7) === officialMonth) score += 10;
  return score;
}

function assignProjectRows(canonicals, rows) {
  const candidates = [];
  for (const canonical of canonicals) {
    for (const row of rows) {
      const score = projectMatchScore(row, canonical);
      if (score >= 45) candidates.push({ canonicalId: canonical.canonicalId, rowId: row.id, score });
    }
  }
  candidates.sort((a, b) => b.score - a.score || a.canonicalId.localeCompare(b.canonicalId) || a.rowId.localeCompare(b.rowId));
  const rowAssignment = new Map();
  const assignments = new Map(canonicals.map((canonical) => [canonical.canonicalId, []]));
  for (const candidate of candidates) {
    const existing = rowAssignment.get(candidate.rowId);
    if (!existing) {
      rowAssignment.set(candidate.rowId, candidate);
      assignments.get(candidate.canonicalId).push(candidate);
    } else if (existing.score === candidate.score && existing.canonicalId !== candidate.canonicalId) {
      existing.ambiguous = true;
    }
  }
  const rowById = new Map(rows.map((row) => [row.id, row]));
  for (const canonical of canonicals) {
    canonical.projectMatches = assignments.get(canonical.canonicalId).map((candidate) => ({ ...rowById.get(candidate.rowId), matchScore: candidate.score, ambiguousMatch: Boolean(candidate.ambiguous) }));
  }
  return rows.filter((row) => !rowAssignment.has(row.id));
}

function compareCanonical(canonical) {
  const matches = canonical.projectMatches ?? [];
  const findings = [];
  const add = (code, severity, message) => findings.push({ code, severity, message });
  if (!canonical.es) add("OFFICIAL_ES_MISSING", "media", "La fuente oficial no ofrece versión española vinculada.");
  if (!canonical.en) add("OFFICIAL_EN_MISSING", "media", "La fuente oficial no ofrece versión inglesa vinculada.");
  if (canonical.pairingReview) add("PAIRING_REVIEW", "alta", "El emparejamiento oficial ES/EN requiere revisión manual.");
  if (!matches.length) add("PROJECT_MISSING", "alta", "La publicación oficial no fue localizada en el proyecto.");
  if (matches.length > 1) add("PROJECT_DUPLICATE", "alta", `La publicación coincide con ${matches.length} registros del proyecto.`);
  for (const row of matches) {
    const titleEs = normalizeTitle(row.titleEs);
    const titleEn = normalizeTitle(row.title);
    if (canonical.es && titleEs !== canonical.es.titleNormalized) add("TITLE_ES_DIFF", "editorial", `Título ES distinto en ${row.slug}.`);
    if (canonical.en && titleEn !== canonical.en.titleNormalized) add("TITLE_EN_DIFF", "editorial", `Título EN distinto en ${row.slug}.`);
    if (!cleanSpace(row.contentEs)) add("CONTENT_ES_MISSING", "alta", `Cuerpo ES vacío en ${row.slug}.`);
    if (!cleanSpace(row.content)) add("CONTENT_EN_MISSING", "alta", `Cuerpo EN vacío en ${row.slug}.`);
    if (cleanSpace(row.contentEs) && cleanSpace(row.content) && normalizeText(row.contentEs) === normalizeText(row.content)) add("CONTENT_DUPLICATED_LANG", "alta", `El cuerpo ES/EN es idéntico en ${row.slug}.`);
    const esLanguage = languageScore(`${row.titleEs} ${row.excerptEs} ${row.contentEs}`).probable;
    const enLanguage = languageScore(`${row.title} ${row.excerpt} ${row.content}`).probable;
    if (esLanguage === "en") add("CONTENT_ES_PROBABLE_EN", "alta", `El contenido ES parece estar en inglés en ${row.slug}.`);
    if (enLanguage === "es") add("CONTENT_EN_PROBABLE_ES", "alta", `El contenido EN parece estar en español en ${row.slug}.`);
    const officialDate = (canonical.es?.date.normalized || canonical.en?.date.normalized || "");
    const projectDate = String(row.date ?? "").slice(0, 10);
    if (!projectDate) add("PROJECT_DATE_MISSING", "media", `Fecha ausente en ${row.slug}.`);
    else if (officialDate && projectDate.slice(0, 7) !== officialDate.slice(0, 7)) add("PROJECT_DATE_DIFF", "media", `Fecha distinta en ${row.slug}: ${projectDate} vs ${officialDate}.`);
    else if (/^\d{4}-\d{2}-01$/.test(projectDate) && (canonical.es?.date.precision === "month" || canonical.en?.date.precision === "month")) add("PROJECT_DATE_INFERRED_DAY", "editorial", `La fecha de ${row.slug} usa día 1 inferido.`);
    const expectedCategory = canonical.type === "articles" ? "articles" : "news";
    if (String(row.category ?? "").toLowerCase() !== expectedCategory) add("CATEGORY_DIFF", "media", `Categoría ${row.category || "vacía"} en ${row.slug}; fuente ${expectedCategory}.`);
    const projectPdfs = new Set(extractProjectPdfUrls(row).map(basenameKey));
    for (const pdf of canonical.es?.pdfUrls ?? []) if (!projectPdfs.has(basenameKey(pdf))) add("PDF_ES_MISSING_PROJECT", "media", `PDF ES no localizado en ${row.slug}.`);
    for (const pdf of canonical.en?.pdfUrls ?? []) if (!projectPdfs.has(basenameKey(pdf))) add("PDF_EN_MISSING_PROJECT", "media", `PDF EN no localizado en ${row.slug}.`);
    if (canonical.es && row.contentEs) {
      const score = similarity(`${canonical.es.introText} ${canonical.es.bodyText}`, row.contentEs);
      if (score < 0.45) add("BODY_ES_DIFF", "editorial", `Baja similitud de cuerpo ES (${score.toFixed(2)}) en ${row.slug}.`);
    }
    if (canonical.en && row.content) {
      const score = similarity(`${canonical.en.introText} ${canonical.en.bodyText}`, row.content);
      if (score < 0.45) add("BODY_EN_DIFF", "editorial", `Baja similitud de cuerpo EN (${score.toFixed(2)}) en ${row.slug}.`);
    }
  }
  const rank = { critica: 4, alta: 3, media: 2, editorial: 1 };
  const severity = findings.reduce((current, finding) => (rank[finding.severity] > rank[current] ? finding.severity : current), findings.length ? "editorial" : "correcto");
  canonical.findings = findings;
  canonical.severity = severity;
  canonical.auditStatus = findings.length ? "hallazgo" : "correcto";
  return canonical;
}

function classifyLink(result, kind) {
  if (result.error || result.status === 0) return "inaccesible";
  if ([401, 403, 429].includes(result.status)) return "bloqueado";
  if ([404, 410].includes(result.status)) return "roto";
  if (result.status >= 500) return "error";
  if (result.status >= 300 && result.status < 400) return "redireccion";
  if (result.status >= 200 && result.status < 300) {
    if (kind === "pdf") {
      const mime = String(result.headers["content-type"] ?? "").toLowerCase();
      const signatureOk = result.signature.startsWith("%PDF-");
      if (!signatureOk && !mime.includes("pdf")) return "contenido-invalido";
    }
    return result.redirected ? "redireccion-valida" : "correcto";
  }
  return "inaccesible";
}

function linkRecord({ owner, source, kind, language, url, result }) {
  return {
    owner,
    source,
    kind,
    language,
    url,
    status: result.status,
    classification: classifyLink(result, kind),
    finalUrl: result.finalUrl,
    redirected: result.redirected,
    mime: result.headers["content-type"] ?? "",
    bytesRead: result.bytesRead,
    signature: result.signature.slice(0, 8),
    elapsedMs: result.elapsedMs,
    error: result.error,
  };
}

async function main() {
  await cache.init();
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  console.log(`[audit] Salida: ${OUTPUT_DIR}`);
  console.log(`[audit] Caché: ${CACHE_DIR}`);
  const listingItems = [];
  const collectionSummary = [];
  for (const collection of COLLECTIONS) {
    const firstResult = await requestWithRetries(collection.url);
    if (!firstResult.ok) throw new Error(`No se pudo leer ${collection.url}: ${firstResult.status} ${firstResult.error}`);
    const first = parseListing(firstResult.body.toString("utf8"), collection, collection.url);
    const starts = Array.from({ length: Math.floor(first.lastStart / 10) + 1 }, (_, index) => index * 10);
    const limitedStarts = MAX_PAGES ? starts.slice(0, MAX_PAGES) : starts;
    const pages = await mapConcurrent(limitedStarts, CONCURRENCY, async (start) => {
      const pageUrl = start ? `${collection.url}?start=${start}` : collection.url;
      const result = start === 0 ? firstResult : await requestWithRetries(pageUrl);
      return { pageUrl, result, parsed: result.ok ? parseListing(result.body.toString("utf8"), collection, pageUrl) : { items: [], lastStart: first.lastStart } };
    }, `listados ${collection.key}`);
    const collectionItems = pages.flatMap((page) => page.parsed.items);
    const deduped = [...new Map(collectionItems.map((item) => [item.sourceKey, item])).values()];
    listingItems.push(...deduped);
    collectionSummary.push({ key: collection.key, expectedLastStart: first.lastStart, pages: pages.length, items: deduped.length, pageErrors: pages.filter((page) => !page.result.ok).map((page) => ({ url: page.pageUrl, status: page.result.status, error: page.result.error })) });
  }
  const uniqueListings = [...new Map(listingItems.map((item) => [item.sourceKey, item])).values()];
  const detailTargets = MAX_DETAILS ? uniqueListings.slice(0, MAX_DETAILS) : uniqueListings;
  console.log(`[audit] Fichas oficiales únicas en alcance: ${detailTargets.length}`);
  const details = (await mapConcurrent(detailTargets, CONCURRENCY, async (item) => {
    const result = await requestWithRetries(item.detailUrl);
    return parseDetail(result.body.toString("utf8"), item, result);
  }, "fichas oficiales")).filter(Boolean);
  const canonicals = pairOfficial(details);
  console.log(`[audit] Publicaciones canónicas: ${canonicals.length}`);

  const projectNewsResult = await requestWithRetries(`${PROJECT_ORIGIN}/api/news`, { mode: "json", attempts: 4, timeoutMs: 120000 });
  if (!projectNewsResult.ok) throw new Error(`No se pudo leer el inventario del proyecto: ${projectNewsResult.status} ${projectNewsResult.error}`);
  const projectRows = JSON.parse(projectNewsResult.body.toString("utf8"));
  const projectTeamResult = await requestWithRetries(`${PROJECT_ORIGIN}/api/team`, { mode: "json", attempts: 4, timeoutMs: 120000 });
  const projectTeam = projectTeamResult.ok ? JSON.parse(projectTeamResult.body.toString("utf8")) : [];
  const unmatchedProjectRows = assignProjectRows(canonicals, projectRows);
  canonicals.forEach(compareCanonical);

  const linkTargets = [];
  for (const canonical of canonicals) {
    for (const language of ["es", "en"]) {
      const item = canonical[language];
      if (!item) continue;
      linkTargets.push({ owner: canonical.canonicalId, source: "oficial", kind: "detalle", language, url: item.detailUrl, existing: item });
      for (const url of item.pdfUrls) linkTargets.push({ owner: canonical.canonicalId, source: "oficial", kind: "pdf", language, url });
      for (const url of item.imageUrls) linkTargets.push({ owner: canonical.canonicalId, source: "oficial", kind: "imagen", language, url });
      for (const url of item.contentLinks.filter((url) => !item.pdfUrls.includes(url))) linkTargets.push({ owner: canonical.canonicalId, source: "oficial", kind: "enlace-contenido", language, url });
    }
    for (const row of canonical.projectMatches ?? []) {
      linkTargets.push({ owner: canonical.canonicalId, source: "proyecto", kind: "detalle", language: "es", url: `${PROJECT_ORIGIN}/news/${encodeURIComponent(row.slug)}` });
      linkTargets.push({ owner: canonical.canonicalId, source: "proyecto", kind: "detalle", language: "en", url: `${PROJECT_ORIGIN}/news/${encodeURIComponent(row.slug)}?lang=en` });
      linkTargets.push({ owner: canonical.canonicalId, source: "proyecto", kind: "autores", language: "multi", url: `${PROJECT_ORIGIN}/api/news/${encodeURIComponent(row.slug)}/authors` });
      for (const url of extractProjectPdfUrls(row)) linkTargets.push({ owner: canonical.canonicalId, source: "proyecto", kind: "pdf", language: "multi", url });
    }
  }
  const uniqueLinkTargets = [...new Map(linkTargets.map((target) => [`${target.kind}:${target.url}`, target])).values()];
  let links = [];
  if (!SKIP_LINKS) {
    links = await mapConcurrent(uniqueLinkTargets, Math.min(CONCURRENCY, 8), async (target) => {
      if (target.existing && target.kind === "detalle") {
        return linkRecord({ ...target, result: { status: target.existing.status, finalUrl: target.existing.finalUrl, redirected: target.existing.redirected, headers: { "content-type": target.existing.mime }, bytesRead: 0, signature: "", elapsedMs: 0, error: target.existing.fetchError } });
      }
      const result = await requestWithRetries(target.url, { mode: "probe", attempts: 3, timeoutMs: 45000 });
      return linkRecord({ ...target, result });
    }, "enlaces");
  }

  const teamByLocalPart = new Map(projectTeam.filter((member) => member.email).map((member) => [localPart(member.email), member]));
  for (const canonical of canonicals) {
    const officialAuthors = unique([...(canonical.es?.authors ?? []), ...(canonical.en?.authors ?? [])].map((author) => author.email));
    canonical.authorAudit = officialAuthors.map((email) => {
      const sourceLocalPart = localPart(email);
      const targetLocalPart = AUTHOR_EMAIL_ALIASES.get(sourceLocalPart) ?? sourceLocalPart;
      const exactMember = teamByLocalPart.get(sourceLocalPart) ?? null;
      const member = exactMember ?? teamByLocalPart.get(targetLocalPart) ?? null;
      return { email, sourceLocalPart, targetLocalPart, matchedProfileId: member?.id ?? "", matchedProfileSlug: member?.slug ?? "", matchedProfileName: member?.name ?? "", method: member ? (exactMember ? "email-local-part" : "explicit-alias") : "unmatched" };
    });
    if (officialAuthors.length && !canonical.authorAudit.some((entry) => entry.matchedProfileId)) canonical.findings.push({ code: "AUTHORS_UNMATCHED", severity: "media", message: "Los contactos oficiales no se resolvieron contra perfiles públicos." });
  }

  const inventoryRows = canonicals.map((canonical) => {
    const projectSlugs = (canonical.projectMatches ?? []).map((row) => row.slug);
    const linkIssues = links.filter((link) => link.owner === canonical.canonicalId && !["correcto", "redireccion-valida"].includes(link.classification));
    const findingCodes = canonical.findings.map((finding) => finding.code);
    return {
      canonicalId: canonical.canonicalId,
      type: canonical.type,
      severity: canonical.severity,
      auditStatus: canonical.auditStatus,
      pairing: canonical.pairing,
      pairingReview: canonical.pairingReview,
      dateEs: canonical.es?.date.normalized ?? "",
      dateEn: canonical.en?.date.normalized ?? "",
      pidEs: canonical.es?.pid ?? "",
      pidEn: canonical.en?.pid ?? "",
      titleEs: canonical.es?.title ?? "",
      titleEn: canonical.en?.title ?? "",
      officialUrlEs: canonical.es?.detailUrl ?? "",
      officialUrlEn: canonical.en?.detailUrl ?? "",
      pdfEs: canonical.es?.pdfUrls ?? [],
      pdfEn: canonical.en?.pdfUrls ?? [],
      officialAuthors: unique([...(canonical.es?.authors ?? []), ...(canonical.en?.authors ?? [])].map((entry) => entry.email)),
      matchedProfiles: canonical.authorAudit.filter((entry) => entry.matchedProfileId).map((entry) => `${entry.matchedProfileName} (${entry.matchedProfileSlug})`),
      projectCount: canonical.projectMatches?.length ?? 0,
      projectSlugs,
      projectIds: (canonical.projectMatches ?? []).map((row) => row.id),
      projectLegacyIds: (canonical.projectMatches ?? []).map((row) => row.legacyId ?? ""),
      findingCodes,
      findings: canonical.findings.map((finding) => finding.message),
      linkIssueCount: linkIssues.length,
      linkIssues: linkIssues.map((link) => `${link.classification}: ${link.url}`),
    };
  });

  const linkHeaders = ["owner", "source", "kind", "language", "url", "status", "classification", "finalUrl", "redirected", "mime", "bytesRead", "signature", "elapsedMs", "error"];
  const inventoryHeaders = ["canonicalId", "type", "severity", "auditStatus", "pairing", "pairingReview", "dateEs", "dateEn", "pidEs", "pidEn", "titleEs", "titleEn", "officialUrlEs", "officialUrlEn", "pdfEs", "pdfEn", "officialAuthors", "matchedProfiles", "projectCount", "projectSlugs", "projectIds", "projectLegacyIds", "findingCodes", "findings", "linkIssueCount", "linkIssues"];
  const summary = {
    generatedAt: new Date().toISOString(),
    sourceCutoff: STAMP,
    officialOrigin: OFFICIAL_ORIGIN,
    projectOrigin: PROJECT_ORIGIN,
    parameters: { concurrency: CONCURRENCY, maxPages: MAX_PAGES, maxDetails: MAX_DETAILS, skipLinks: SKIP_LINKS },
    collections: collectionSummary,
    counts: {
      officialLocalizedEntries: details.length,
      officialCanonicalEntries: canonicals.length,
      officialSpanishEntries: details.filter((item) => item.language === "es").length,
      officialEnglishEntries: details.filter((item) => item.language === "en").length,
      officialNewsEntries: details.filter((item) => item.type === "news").length,
      officialArticleEntries: details.filter((item) => item.type === "articles").length,
      officialUnpaired: canonicals.filter((item) => !item.es || !item.en).length,
      officialPairingReview: canonicals.filter((item) => item.pairingReview).length,
      projectRows: projectRows.length,
      projectLegacyRows: projectRows.filter((row) => row.legacyId).length,
      projectMatchedRows: unique(canonicals.flatMap((item) => (item.projectMatches ?? []).map((row) => row.id))).length,
      projectUnmatchedRows: unmatchedProjectRows.length,
      missingInProject: canonicals.filter((item) => !(item.projectMatches?.length)).length,
      duplicateInProject: canonicals.filter((item) => (item.projectMatches?.length ?? 0) > 1).length,
      correctCanonicals: canonicals.filter((item) => item.auditStatus === "correcto").length,
      canonicalsWithFindings: canonicals.filter((item) => item.auditStatus !== "correcto").length,
      linkTargets: links.length,
      brokenLinks: links.filter((link) => link.classification === "roto").length,
      serverErrorLinks: links.filter((link) => link.classification === "error").length,
      inaccessibleLinks: links.filter((link) => link.classification === "inaccesible").length,
      blockedLinks: links.filter((link) => link.classification === "bloqueado").length,
      invalidContentLinks: links.filter((link) => link.classification === "contenido-invalido").length,
    },
    projectQuality: {
      missingDate: projectRows.filter((row) => !row.date).length,
      inferredDayOne: projectRows.filter((row) => /^\d{4}-\d{2}-01/.test(String(row.date ?? ""))).length,
      missingContentEs: projectRows.filter((row) => !cleanSpace(row.contentEs)).length,
      missingContentEn: projectRows.filter((row) => !cleanSpace(row.content)).length,
      identicalTitleLanguages: projectRows.filter((row) => normalizeTitle(row.title) && normalizeTitle(row.title) === normalizeTitle(row.titleEs)).length,
      identicalBodyLanguages: projectRows.filter((row) => normalizeText(row.content) && normalizeText(row.content) === normalizeText(row.contentEs)).length,
      missingCategory: projectRows.filter((row) => !cleanSpace(row.category)).length,
    },
    findingCounts: Object.fromEntries([...new Set(canonicals.flatMap((item) => item.findings.map((finding) => finding.code)))].sort().map((code) => [code, canonicals.reduce((sum, item) => sum + item.findings.filter((finding) => finding.code === code).length, 0)])),
    linkClassificationCounts: Object.fromEntries([...new Set(links.map((link) => link.classification))].sort().map((classification) => [classification, links.filter((link) => link.classification === classification).length])),
  };
  const snapshot = { summary, canonicals, unmatchedProjectRows, links, projectTeam };
  const base = `VWYS_Auditoria_Publicaciones_${STAMP}`;
  await fs.writeFile(path.join(OUTPUT_DIR, `${base}.snapshot.json`), `${JSON.stringify(snapshot, null, 2)}\n`);
  await fs.writeFile(path.join(OUTPUT_DIR, `${base}.resumen.json`), `${JSON.stringify(summary, null, 2)}\n`);
  await fs.writeFile(path.join(OUTPUT_DIR, `${base}.inventario.csv`), toCsv(inventoryRows, inventoryHeaders));
  await fs.writeFile(path.join(OUTPUT_DIR, `${base}.enlaces.csv`), toCsv(links, linkHeaders));
  await fs.writeFile(path.join(OUTPUT_DIR, `${base}.faltantes.csv`), toCsv(inventoryRows.filter((row) => row.findingCodes.includes("PROJECT_MISSING")), inventoryHeaders));
  console.log(JSON.stringify(summary.counts, null, 2));
  console.log(`[audit] Evidencias generadas en ${OUTPUT_DIR}`);
}

main().catch((error) => {
  console.error(`[audit] ERROR: ${error.stack || error.message}`);
  process.exitCode = 1;
});
