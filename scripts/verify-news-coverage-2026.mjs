#!/usr/bin/env node
/** Read-only post-reconciliation verifier. It reuses the complete official
 * 2026-08-28 News inventory (77 pages per language) and validates current DB
 * coverage without re-crawling the same 1,530 source links. */
import "dotenv/config";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import { createSqlClient } from "./lib/postgres-sql.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const argValue = (name, fallback) => {
  const prefix = `--${name}=`;
  const found = args.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
};
const SNAPSHOT = path.resolve(ROOT, argValue("snapshot", "output/audits/noticias-fechas-2026-08-28/VWYS_Auditoria_Fechas_Noticias_2026-08-28.snapshot.json"));
const MANIFEST = path.resolve(ROOT, argValue("manifest", "output/audits/noticias-cobertura-2026-08-28/VWYS_Reconciliacion_Cobertura_Noticias_2026-08-28.manifest.json"));
const BASELINE_INVENTORY = path.resolve(ROOT, argValue("baseline-inventory", "output/audits/noticias-cobertura-2026-08-28/VWYS_Verificacion_Cobertura_Noticias_2026-08-28.inventario.csv"));
const MIRROR = path.resolve(ROOT, argValue("mirror", "../mirror"));
const CACHE = path.resolve(ROOT, argValue("cache", "output/audits/noticias-cobertura-2026-08-28/.source-cache"));
const OUTPUT = path.resolve(ROOT, argValue("output", "output/audits/noticias-cobertura-2026-08-28"));

const clean = (value) => String(value ?? "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
const normalize = (value) => clean(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const csvCell = (value) => {
  const text = Array.isArray(value) ? value.join(" | ") : value == null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};
const toCsv = (rows, headers) => `${headers.join(",")}${rows.length ? `\n${rows.map((row) => headers.map((header) => csvCell(row[header])).join(","))}` : ""}\n`;
const counterpartId = (href) => String(href ?? "").match(/[?&]p_id=(\d+)|p_id-(\d+)/i)?.slice(1).find(Boolean) ?? "";

function parseCsvLine(line) {
  const cells = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && quoted && line[index + 1] === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else {
      cell += character;
    }
  }
  cells.push(cell);
  return cells;
}

async function baselineCounterparts() {
  const csv = await fsp.readFile(BASELINE_INVENTORY, "utf8");
  const [header, ...lines] = csv.trimEnd().split(/\r?\n/);
  const headers = parseCsvLine(header);
  const keyIndex = headers.indexOf("sourceKey");
  const counterpartIndex = headers.indexOf("counterpartLegacyId");
  const methodIndex = headers.indexOf("matchMethod");
  if (keyIndex < 0 || counterpartIndex < 0 || methodIndex < 0) throw new Error("Inventario de verificación sin columnas de contraparte requeridas.");
  return new Map(lines.map(parseCsvLine)
    .filter((cells) => cells[methodIndex] === "verified_language_counterpart" && cells[counterpartIndex])
    .map((cells) => [String(cells[keyIndex]), String(cells[counterpartIndex])]));
}

function sourceHtml(language, legacyId) {
  const candidates = [
    path.join(MIRROR, "index.php", language === "es" ? "publicacion" : "publication", `p_id-${legacyId}.html`),
    path.join(CACHE, `${language}-${legacyId}.html`),
  ];
  for (const file of candidates) if (fs.existsSync(file)) return fs.readFileSync(file, "utf8");
  return "";
}

function officialCounterpart(language, legacyId) {
  const html = sourceHtml(language, legacyId);
  if (!html) return "";
  const $ = cheerio.load(html);
  const href = $(".header__lang--item").map((_, node) => $(node).attr("href") ?? "").get()
    .find((value) => /\/publicacion|\/publication/i.test(value)) ?? "";
  return counterpartId(href);
}

function dateText(value) {
  const text = value instanceof Date ? value.toISOString().slice(0, 10) : String(value ?? "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}

async function main() {
  const [audit, reconciliation, counterpartsFromBaseline] = await Promise.all([
    fsp.readFile(SNAPSHOT, "utf8").then(JSON.parse),
    fsp.readFile(MANIFEST, "utf8").then(JSON.parse),
    baselineCounterparts(),
  ]);
  const officialRows = audit.rows;
  const officialByLegacyId = new Map(officialRows.map((row) => [String(row.legacyId), row]));
  // La reconciliación conserva el p_id de la contraparte que fue comprobada
  // contra la ficha oficial. Esto permite repetir la verificación desde un
  // clon limpio sin versionar HTML de terceros ni volver a rastrear el sitio.
  const counterpartsFromManifest = new Map((reconciliation.evidence ?? [])
    .filter((row) => row.counterpartLegacyId)
    .map((row) => [String(row.sourceKey), String(row.counterpartLegacyId)]));
  const sql = createSqlClient(process.env.DATABASE_URL);
  try {
    const publicRows = await sql`
      select id, legacy_id, slug, title, title_es, date, category
      from news
      where published = true and lower(coalesce(category, '')) <> 'articles'
    `;
    const byLegacy = new Map();
    for (const row of publicRows) {
      const id = String(row.legacy_id ?? "").trim();
      if (id) byLegacy.set(id, [...(byLegacy.get(id) ?? []), row]);
    }
    const officialIds = new Set(officialRows.map((row) => String(row.legacyId)));
    const evidence = officialRows.map((official) => {
      const direct = byLegacy.get(String(official.legacyId)) ?? [];
      const title = official.language === "es" ? (row) => row.title_es : (row) => row.title;
      let rows = direct;
      let method = direct.length === 1 ? "legacy_id" : "";
      let counterpartLegacyId = "";
      if (!rows.length) {
        counterpartLegacyId = counterpartsFromManifest.get(String(official.sourceKey))
          || counterpartsFromBaseline.get(String(official.sourceKey))
          || officialCounterpart(official.language, official.legacyId);
        const counterparts = counterpartLegacyId ? byLegacy.get(counterpartLegacyId) ?? [] : [];
        const counterpartOfficial = officialByLegacyId.get(counterpartLegacyId);
        const counterpartTitle = official.language === "es" ? (row) => row.title : (row) => row.title_es;
        const exact = counterparts.filter((row) =>
          normalize(title(row)) === normalize(official.titleOfficial)
          // La fuente enlaza recíprocamente una versión en el otro idioma. Si
          // el título editorial local varió en el idioma actual, se acepta
          // exclusivamente cuando el título opuesto coincide de forma exacta
          // con esa contraparte oficial; nunca por similitud de texto.
          || Boolean(counterpartOfficial && normalize(counterpartTitle(row)) === normalize(counterpartOfficial.titleOfficial)));
        if (exact.length === 1) {
          rows = exact;
          method = "verified_language_counterpart";
        }
      }
      const row = rows.length === 1 ? rows[0] : null;
      const projectDate = dateText(row?.date);
      const expectedMonth = String(official.officialDateNormalized ?? "").slice(0, 7);
      return {
        sourceKey: official.sourceKey,
        language: official.language,
        legacyId: official.legacyId,
        titleOfficial: official.titleOfficial,
        officialDateRaw: official.officialDateRaw,
        officialDateNormalized: official.officialDateNormalized,
        counterpartLegacyId,
        projectId: row?.id ?? "",
        projectLegacyId: row?.legacy_id ?? "",
        projectSlug: row?.slug ?? "",
        projectDate,
        matchMethod: method,
        coverage: row ? "covered" : rows.length > 1 ? "ambiguous" : "missing",
        dateComparison: !row ? "not_applicable" : !projectDate ? "project_date_missing" : projectDate.slice(0, 7) === expectedMonth ? "date_match" : "date_mismatch",
      };
    });
    const projectOnly = publicRows.filter((row) => !row.legacy_id || !officialIds.has(String(row.legacy_id)));
    const count = (predicate) => evidence.filter(predicate).length;
    const summary = {
      generatedAt: new Date().toISOString(),
      officialAuditSource: path.relative(ROOT, SNAPSHOT),
      officialInventory: {
        localizedEntries: officialRows.length,
        spanishEntries: officialRows.filter((row) => row.language === "es").length,
        englishEntries: officialRows.filter((row) => row.language === "en").length,
        auditVerifiedOfficialDetails: audit.summary?.counts?.inaccessibleOfficialDetails === 0,
      },
      currentPublicProject: {
        rows: publicRows.length,
        coveredOfficialEntries: count((row) => row.coverage === "covered"),
        directLegacyMatches: count((row) => row.matchMethod === "legacy_id"),
        verifiedLanguageCounterpartMatches: count((row) => row.matchMethod === "verified_language_counterpart"),
        missingOfficialEntries: count((row) => row.coverage === "missing"),
        ambiguousOfficialEntries: count((row) => row.coverage === "ambiguous"),
        dateMatch: count((row) => row.dateComparison === "date_match"),
        projectDateMissing: count((row) => row.dateComparison === "project_date_missing"),
        dateMismatch: count((row) => row.dateComparison === "date_mismatch"),
        publicProjectOnlyRows: projectOnly.length,
      },
    };
    await fsp.mkdir(OUTPUT, { recursive: true });
    await fsp.writeFile(path.join(OUTPUT, "VWYS_Verificacion_Cobertura_Noticias_2026-08-28.resumen.json"), `${JSON.stringify(summary, null, 2)}\n`);
    await fsp.writeFile(path.join(OUTPUT, "VWYS_Verificacion_Cobertura_Noticias_2026-08-28.inventario.csv"), toCsv(evidence, [
      "sourceKey", "language", "legacyId", "titleOfficial", "officialDateRaw", "officialDateNormalized", "counterpartLegacyId", "projectId", "projectLegacyId", "projectSlug", "projectDate", "matchMethod", "coverage", "dateComparison",
    ]));
    await fsp.writeFile(path.join(OUTPUT, "VWYS_Verificacion_Cobertura_Noticias_2026-08-28.pendientes-fecha.csv"), toCsv(evidence.filter((row) => row.dateComparison === "project_date_missing"), [
      "sourceKey", "language", "legacyId", "titleOfficial", "officialDateRaw", "officialDateNormalized", "counterpartLegacyId", "projectId", "projectLegacyId", "projectSlug", "projectDate", "matchMethod", "coverage", "dateComparison",
    ]));
    console.log(JSON.stringify(summary.currentPublicProject, null, 2));
    console.log(`[verify] Evidencia: ${OUTPUT}`);
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(`[verify] ERROR: ${error.stack || error.message}`);
  process.exitCode = 1;
});
