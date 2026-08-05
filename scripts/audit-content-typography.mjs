#!/usr/bin/env node

import "dotenv/config";
import pg from "pg";
import * as cheerio from "cheerio";
import { getPostgresConnectionConfig } from "../shared/postgres-config.mjs";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) throw new Error("DATABASE_URL is required");

const CMS_TABLES = [
  "news",
  "news_translations",
  "team_members",
  "practice_groups",
  "industry_groups",
  "site_config",
  "rankings",
  "testimonials",
  "offices",
  "office_images",
];

const EMBEDDED_FONT = /(?:font-family\s*:|<font\b[^>]*\bface\s*=)/i;
const LEGACY_FONT_ASSET = /(?:AtkinsonHyperlegible|Publico-(?:Roman|Bold|Italic)|Geomanist|OptimaLTStd|fonts\.googleapis\.com)/i;
const INLINE_FONT = /font-family\s*:\s*([^;}]+)/gi;
const APPROVED_FONT_NAMES = new Set([
  "gelasio",
  "inter",
  "serif",
  "sans-serif",
  "var(--font-title)",
  "var(--font-body)",
]);
const LANGUAGES = ["es", "en"];
const MAX_CONCURRENCY = Math.max(1, Math.min(48, Number(process.env.TYPOGRAPHY_AUDIT_CONCURRENCY || 24)));

function quoteIdentifier(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function inspectValue(value) {
  if (value == null) return false;
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return EMBEDDED_FONT.test(text);
}

async function auditStoredContent(pool) {
  const columnsResult = await pool.query(
    `SELECT table_name, column_name, data_type
       FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ANY($1::text[])
        AND data_type IN ('text', 'character varying', 'json', 'jsonb')
      ORDER BY table_name, ordinal_position`,
    [CMS_TABLES],
  );

  const columnsByTable = new Map();
  for (const column of columnsResult.rows) {
    const list = columnsByTable.get(column.table_name) || [];
    list.push(column.column_name);
    columnsByTable.set(column.table_name, list);
  }

  const findings = [];
  let rowsInspected = 0;
  for (const [table, columns] of columnsByTable) {
    const selectColumns = columns.map(quoteIdentifier).join(", ");
    const result = await pool.query(`SELECT ${selectColumns} FROM ${quoteIdentifier(table)}`);
    rowsInspected += result.rowCount || 0;
    result.rows.forEach((row, rowIndex) => {
      for (const column of columns) {
        if (inspectValue(row[column])) {
          findings.push({ table, column, row: rowIndex + 1 });
        }
      }
    });
  }

  return { rowsInspected, tablesInspected: columnsByTable.size, findings };
}

async function getPublishedSlugs(pool) {
  const result = await pool.query(
    `SELECT slug
       FROM news
      WHERE published IS TRUE
        AND (publish_at IS NULL OR publish_at <= NOW())
      ORDER BY slug`,
  );
  return result.rows.map((row) => row.slug).filter(Boolean);
}

function inspectRenderedPage(html, url) {
  const $ = cheerio.load(html);
  const findings = [];

  $("[style]").each((_index, element) => {
    const style = $(element).attr("style") || "";
    for (const match of style.matchAll(INLINE_FONT)) {
      const names = match[1]
        .split(",")
        .map((name) => name.trim().replace(/^['"]|['"]$/g, "").toLowerCase())
        .filter(Boolean);
      if (names.some((name) => !APPROVED_FONT_NAMES.has(name))) {
        findings.push(`unapproved-inline-font:${names.join(",")}`);
      }
    }
  });

  if (LEGACY_FONT_ASSET.test(html)) findings.push("legacy-font-asset");
  if (!/typography\.css(?:\?[^"']*)?/i.test(html)) findings.push("missing-typography-css");

  return findings.map((kind) => ({ url, kind }));
}

async function auditRenderedPublications(pool, baseUrl) {
  if (!baseUrl) return { pagesInspected: 0, findings: [], skipped: true };

  const slugs = await getPublishedSlugs(pool);
  const jobs = slugs.flatMap((slug) => LANGUAGES.map((lang) => ({ slug, lang })));
  const findings = [];
  let cursor = 0;
  let pagesInspected = 0;

  async function worker() {
    while (cursor < jobs.length) {
      const job = jobs[cursor++];
      const url = new URL(`/news/${encodeURIComponent(job.slug)}`, baseUrl);
      if (job.lang === "en") url.searchParams.set("lang", "en");

      try {
        const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(20_000) });
        if (!response.ok) {
          findings.push({ url: url.toString(), kind: `http-${response.status}` });
          continue;
        }
        const html = await response.text();
        findings.push(...inspectRenderedPage(html, url.toString()));
        pagesInspected += 1;
      } catch (error) {
        findings.push({ url: url.toString(), kind: `request-${error?.name || "error"}` });
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(MAX_CONCURRENCY, jobs.length || 1) }, worker));
  return { publications: slugs.length, pagesInspected, findings, skipped: false };
}

const pool = new Pool({
  ...getPostgresConnectionConfig(connectionString, { readOnly: true }),
  max: 4,
});

try {
  const stored = await auditStoredContent(pool);
  const rendered = await auditRenderedPublications(pool, process.env.TYPOGRAPHY_AUDIT_BASE_URL?.trim());
  const findings = [...stored.findings, ...rendered.findings];

  const report = {
    stored: { ...stored, findings: stored.findings.slice(0, 50) },
    rendered: { ...rendered, findings: rendered.findings.slice(0, 50) },
    totalFindings: findings.length,
    findingsTruncated: findings.length > 50,
    approvedFonts: ["Gelasio", "Inter"],
  };
  console.log(JSON.stringify(report, null, 2));
  if (findings.length > 0) {
    console.error(`[typography-audit] ${findings.length} incumplimientos encontrados.`);
    process.exitCode = 1;
  } else {
    console.log("[typography-audit] Auditoría aprobada: solo Gelasio e Inter.");
  }
} finally {
  await pool.end();
}
