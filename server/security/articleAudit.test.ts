import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { extractUnlinkedHttpUrls, findIntroducedUnlinkedArticleUrls } from "../articleLinkIntegrity";

const auditor = await import("../../scripts/audit-articles-2026.mjs");

test("article audit preserves month precision and never invents a day", () => {
  assert.deepEqual(auditor.parseDate("Abril, 2024"), {
    raw: "Abril, 2024",
    normalized: "2024-04",
    precision: "month",
  });
  assert.deepEqual(auditor.parseDate("12 de March, 2024"), {
    raw: "12 de March, 2024",
    normalized: "2024-03-12",
    precision: "day",
  });
});

test("article audit accepts only p_id or a reciprocal official language counterpart", () => {
  const directRow = { id: "direct", legacyId: "101" };
  const counterpartRow = { id: "counterpart", legacyId: "202" };
  const rows = new Map([["101", [directRow]], ["202", [counterpartRow]]]);
  const reciprocal = new Map([["en:202", { counterpartLegacyId: "101" }]]);

  assert.deepEqual(auditor.matchProjectRecord({ language: "es", legacyId: "101", counterpartLegacyId: "" }, reciprocal, rows), {
    row: directRow,
    status: "legacy_id",
    counterpartVerified: false,
  });
  assert.deepEqual(auditor.matchProjectRecord({ language: "es", legacyId: "999", counterpartLegacyId: "202" }, reciprocal, rows), {
    row: null,
    status: "project_missing",
    counterpartVerified: false,
  });
  assert.deepEqual(auditor.matchProjectRecord({ language: "es", legacyId: "101", counterpartLegacyId: "202" }, reciprocal, new Map([["202", [counterpartRow]]])), {
    row: counterpartRow,
    status: "verified_language_counterpart",
    counterpartVerified: true,
  });
});

test("article audit classifies valid redirects and broken links without writing data", async () => {
  assert.equal(auditor.classifyLink({ status: 200, error: "", redirected: true, mime: "text/html", signature: "" }, "content-link"), "redireccion-valida");
  assert.equal(auditor.classifyLink({ status: 404, error: "", redirected: false, mime: "", signature: "" }, "content-link"), "roto");
  assert.equal(auditor.classifyLink({ status: 404, error: "redirected to legacy /index.php/404", redirected: true, redirectedToLegacy404: true, mime: "", signature: "" }, "public-source-cta"), "roto");
  assert.equal(auditor.compareText("Título oficial", "Título oficial"), "match");
  assert.equal(auditor.compareText("Texto de fuente", ""), "project_missing");

  const source = await readFile(new URL("../../scripts/audit-articles-2026.mjs", import.meta.url), "utf8");
  assert.match(source, /where lower\(coalesce\(category, ''\)\) = 'articles'/);
  assert.match(source, /--apply no está permitido/);
  assert.match(source, /FETCH_CACHE_VERSION = "2026-08-29-direct-source-route-v2"/);
  assert.match(source, /redirectedToLegacy404/);
  assert.doesNotMatch(source, /existing: isOfficialSource && sourcePid/);
  assert.doesNotMatch(source, /\b(update|insert|delete)\s+news\b/i);
});

test("article source audit detects only URLs readers would see outside an anchor", () => {
  const html = '<p>Fuente plana: https://example.com/source.pdf.</p><p><a href="https://example.com/linked.pdf">https://example.com/linked.pdf</a></p>';
  assert.deepEqual(extractUnlinkedHttpUrls(html), ["https://example.com/source.pdf"]);
  assert.deepEqual(
    findIntroducedUnlinkedArticleUrls(
      { content: '<p>Fuente plana: https://example.com/source.pdf</p>' },
      { content: '<p>Fuente plana: https://example.com/source.pdf y https://example.com/new.pdf</p>' },
    ),
    [{ field: "content", url: "https://example.com/new.pdf" }],
  );
});

test("article audit verifies the public CTA and records bare visible URLs", () => {
  const document = auditor.parseProjectDocument("es", {
    id: "article-1", slug: "article-1", titleEs: "Artículo", title: "Article", sourceUrl: "https://example.com/original.pdf",
  }, {
    status: 200,
    finalUrl: "http://localhost:5050/news/article-1",
    redirected: false,
    mime: "text/html",
    signature: "",
    error: "",
    body: Buffer.from('<!doctype html><html><head><link rel="canonical" href="/news/article-1"></head><body><h1>Artículo</h1><div class="single__content--intro"><p>https://example.com/raw.pdf</p><a href="https://example.com/linked.pdf">Fuente</a></div><p class="vw-news-source-link"><a href="https://example.com/original.pdf" target="_blank" rel="noopener noreferrer">Ver publicación original</a></p></body></html>'),
  });
  assert.equal(document.sourceCtaMatches, true);
  assert.equal(document.sourceCtaSecure, true);
  assert.deepEqual(document.contentLinks, ["https://example.com/linked.pdf"]);
  assert.deepEqual(document.rawUrlTexts, ["https://example.com/raw.pdf"]);
  assert.ok(document.findings.includes("PROJECT_VISIBLE_RAW_URL"));
});

test("article source normalizations are limited to their approved historical records", async () => {
  const [migration, routeMigration, runner, routes, authorAudit] = await Promise.all([
    readFile(new URL("../../migrations/20260828_0006_normalize_article_source_links.mjs", import.meta.url), "utf8"),
    readFile(new URL("../../migrations/20260829_0001_normalize_legacy_article_source_routes.mjs", import.meta.url), "utf8"),
    readFile(new URL("../../scripts/run-migrations.mjs", import.meta.url), "utf8"),
    readFile(new URL("../routes/adminNewsRoutes.ts", import.meta.url), "utf8"),
    readFile(new URL("../../scripts/audit-publication-author-relations-2026.ts", import.meta.url), "utf8"),
  ]);
  assert.match(migration, /legacyId: "1699"/);
  assert.match(migration, /legacyId: "1700"/);
  assert.match(migration, /EXPANSION_SOURCE_URL/);
  assert.doesNotMatch(migration, /\b(?:INSERT|DELETE)\s+INTO\s+news\b/i);
  assert.match(routeMigration, /LEGACY_ARTICLE_SOURCE_ROUTE_FIXES/);
  assert.match(routeMigration, /Expected \$\{LEGACY_ARTICLE_SOURCE_ROUTE_FIXES\.length\} legacy Article source rows/);
  assert.match(routeMigration, /refusing to overwrite it/);
  assert.doesNotMatch(routeMigration, /\b(?:INSERT|DELETE)\s+INTO\s+news\b/i);
  assert.match(runner, /20260828_0006_normalize_article_source_links\.mjs/);
  assert.match(runner, /20260829_0001_normalize_legacy_article_source_routes\.mjs/);
  assert.match(routes, /normalizeOriginalSourceUrl/);
  assert.match(routes, /findIntroducedUnlinkedArticleUrls/);
  assert.match(routes, /Published Articles must use Fuente original/);
  assert.match(authorAudit, /articles:\s*\{/);
  assert.match(authorAudit, /publishedWithoutVerifiedAuthors: articlesWithoutVerifiedAuthors/);
});

test("la migración de rutas históricas cambia sólo las dieciséis fuentes exactas y es idempotente", async () => {
  const { default: normalizeLegacyArticleSourceRoutes, LEGACY_ARTICLE_SOURCE_ROUTE_FIXES } = await import("../../migrations/20260829_0001_normalize_legacy_article_source_routes.mjs");
  const rows = LEGACY_ARTICLE_SOURCE_ROUTE_FIXES.map((entry, index) => ({
    id: `article-${index}`,
    legacy_id: entry.legacyId,
    category: "articles",
    source_url: entry.oldUrl,
  }));
  let updates = 0;
  const client = {
    query: async (statement: string, params?: string[]) => {
      if (statement.includes("SELECT id, legacy_id")) return { rowCount: rows.length, rows };
      const [sourceUrl, id, legacyId, oldUrl] = params!;
      const row = rows.find((item) => item.id === id && item.legacy_id === legacyId && item.source_url === oldUrl);
      if (!row) return { rowCount: 0, rows: [] };
      row.source_url = sourceUrl;
      updates += 1;
      return { rowCount: 1, rows: [{ legacy_id: legacyId, source_url: sourceUrl }] };
    },
  };
  await normalizeLegacyArticleSourceRoutes(client);
  assert.equal(updates, 16);
  assert.deepEqual(rows.map((row) => row.source_url), LEGACY_ARTICLE_SOURCE_ROUTE_FIXES.map((entry) => entry.sourceUrl));
  await normalizeLegacyArticleSourceRoutes(client);
  assert.equal(updates, 16);
});
