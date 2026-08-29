#!/usr/bin/env node
/**
 * Recupera únicamente fechas de Noticias respaldadas por el inventario oficial
 * 2026-08-28. Sin --apply es completamente de sólo lectura. La escritura exige
 * confirmación explícita, una transacción y una coincidencia exacta por fila.
 *
 * Uso:
 *   npm run content:recover-news-dates
 *   CONFIRM_NEWS_DATE_RECOVERY=1 npm run content:recover-news-dates -- --apply
 */
import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createSqlClient } from "./lib/postgres-sql.mjs";
import { NEWS_DATE_RECOVERY_20260828 as INVENTORY } from "./data/news-date-recovery-2026.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APPLY = process.argv.includes("--apply");
const OUTPUT = path.join(ROOT, "output/audits/noticias-fechas-recuperadas-2026-08-28");

if (APPLY && process.env.CONFIRM_NEWS_DATE_RECOVERY !== "1") {
  throw new Error("Para escribir use CONFIRM_NEWS_DATE_RECOVERY=1 junto con --apply.");
}

function csvRows(text) {
  const lines = [];
  let line = "", quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      line += char;
      if (char === '"' && text[index + 1] === '"') line += text[++index];
      else if (char === '"') quoted = false;
    } else if (char === '"') {
      quoted = true;
      line += char;
    } else if (char === "\n") {
      if (line) lines.push(line);
      line = "";
    } else if (char !== "\r") {
      line += char;
    }
  }
  if (line) lines.push(line);

  const parse = (value) => {
    const cells = [];
    let cell = "", inside = false;
    for (let index = 0; index < value.length; index += 1) {
      const char = value[index];
      if (inside) {
        if (char === '"' && value[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else if (char === '"') inside = false;
        else cell += char;
      } else if (char === '"') inside = true;
      else if (char === ",") {
        cells.push(cell);
        cell = "";
      } else cell += char;
    }
    cells.push(cell);
    return cells;
  };
  const header = parse(lines.shift() || "");
  return lines.map((line) => Object.fromEntries(parse(line).map((value, index) => [header[index], value])));
}

function monthDate(month) {
  if (!/^\d{4}-\d{2}$/.test(month)) throw new Error(`Mes oficial inválido: ${month}`);
  // Día técnico de ordenamiento; el render público sólo expone mes y año.
  return `${month}-01T12:00:00.000Z`;
}

function dateText(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

async function loadInventory() {
  const file = path.join(ROOT, INVENTORY.inventoryPath);
  const raw = await fs.readFile(file, "utf8");
  const digest = crypto.createHash("sha256").update(raw).digest("hex");
  if (digest !== INVENTORY.inventorySha256) throw new Error("El inventario de fechas no coincide con su digest versionado.");
  const records = csvRows(raw);
  if (records.length !== INVENTORY.officialEvidenceEntries) {
    throw new Error(`Inventario incompleto: ${records.length}; se esperaban ${INVENTORY.officialEvidenceEntries}.`);
  }
  const candidates = records.filter((record) =>
    record.type === "news" && record.comparison === "project_date_missing",
  );
  if (candidates.length !== INVENTORY.recoverySourceEvidenceEntries) {
    throw new Error(`Subconjunto recuperable inesperado: ${candidates.length}; se esperaban ${INVENTORY.recoverySourceEvidenceEntries}.`);
  }

  const byProject = new Map();
  for (const record of candidates) {
    if (record.projectMatchCount !== "1") {
      throw new Error(`Evidencia no apta para ${record.sourceKey}.`);
    }
    if (!/^[0-9a-f-]{36}$/i.test(record.projectIds || "") || !/^\d+$/.test(record.legacyId || "")) {
      throw new Error(`Destino local inválido para ${record.sourceKey}.`);
    }
    if (!/^\d{4}-\d{2}$/.test(record.officialDateNormalized || "")) {
      throw new Error(`Fecha oficial inválida para ${record.sourceKey}.`);
    }
    const existing = byProject.get(record.projectIds);
    if (existing && existing.month !== record.officialDateNormalized) {
      throw new Error(`Evidencia bilingüe contradictoria para la fila ${record.projectIds}.`);
    }
    const evidence = {
      legacyId: record.legacyId,
      language: record.language,
      sourceUrl: record.officialUrl,
      sourceDateRaw: record.officialDateRaw,
      normalizedMonth: record.officialDateNormalized,
      precision: INVENTORY.precision,
    };
    byProject.set(record.projectIds, existing
      ? { ...existing, evidence: [...existing.evidence, evidence] }
      : { id: record.projectIds, legacyId: record.legacyId, slug: record.projectSlugs, month: record.officialDateNormalized, evidence: [evidence] });
  }
  const rows = [...byProject.values()].sort((left, right) => left.legacyId.localeCompare(right.legacyId, "en", { numeric: true }));
  if (rows.length !== INVENTORY.expectedProjectRows) {
    throw new Error(`Inventario local inesperado: ${rows.length}; se esperaban ${INVENTORY.expectedProjectRows}.`);
  }
  return rows;
}

async function main() {
  const inventory = await loadInventory();
  const sql = createSqlClient(process.env.DATABASE_URL);
  try {
    const ids = inventory.map((entry) => entry.id);
    const localRows = await sql.pool.query(
      "select id, legacy_id, slug, category, date from news where id = any($1::varchar[])",
      [ids],
    );
    if (localRows.rows.length !== inventory.length) throw new Error("Falta al menos una fila local del inventario; no se aplicó ningún cambio.");
    const localById = new Map(localRows.rows.map((row) => [row.id, row]));
    const pending = [];
    const alreadyRecovered = [];
    for (const entry of inventory) {
      const row = localById.get(entry.id);
      // En el archivo histórico, `category` guarda con frecuencia un área de
      // práctica (por ejemplo, "Arbitraje"), no el tipo editorial. El alcance
      // Noticias queda acreditado por el inventario oficial y se protege aquí
      // con el id, legacyId y slug exactos; nunca por esa categoría auxiliar.
      if (String(row?.legacy_id || "") !== entry.legacyId || String(row?.slug || "") !== entry.slug) {
        throw new Error(`La fila ${entry.id} ya no coincide con su evidencia; no se aplicó ningún cambio.`);
      }
      const current = dateText(row.date);
      const expected = `${entry.month}-01`;
      if (!current) pending.push(entry);
      else if (current === expected) alreadyRecovered.push(entry);
      else throw new Error(`La fila ${entry.id} contiene una fecha distinta (${current}); no se sobrescribe.`);
    }

    const report = {
      generatedAt: new Date().toISOString(),
      mode: APPLY ? (pending.length ? "applied" : "already-applied") : "dry-run",
      officialEvidenceEntries: INVENTORY.officialEvidenceEntries,
      recoverySourceEvidenceEntries: INVENTORY.recoverySourceEvidenceEntries,
      verifiedLanguageCounterpartEvidenceEntries: INVENTORY.verifiedLanguageCounterpartEvidenceEntries,
      uniqueProjectRows: inventory.length,
      pendingProjectRows: pending.length,
      alreadyRecoveredProjectRows: alreadyRecovered.length,
      preservedProjectOnlyRows: INVENTORY.expectedProjectOnlyRows,
      precision: INVENTORY.precision,
      changes: pending.map((entry) => ({
        projectId: entry.id,
        legacyId: entry.legacyId,
        slug: entry.slug,
        technicalDate: monthDate(entry.month),
        evidence: entry.evidence,
      })),
    };

    if (APPLY && pending.length) {
      const client = await sql.pool.connect();
      try {
        await client.query("BEGIN");
        for (const entry of pending) {
          const result = await client.query(
            "update news set date = $1 where id = $2 and date is null and legacy_id = $3 and slug = $4 returning id",
            [monthDate(entry.month), entry.id, entry.legacyId, entry.slug],
          );
          if (result.rowCount !== 1) throw new Error(`No se pudo actualizar exactamente una fila para ${entry.id}.`);
        }
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    }

    await fs.mkdir(OUTPUT, { recursive: true });
    await fs.writeFile(path.join(OUTPUT, "VWYS_Recuperacion_Fechas_Noticias_2026-08-28.resumen.json"), `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify({ ...report, changes: report.changes.length }, null, 2));
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(`[news-date-recovery] ERROR: ${error.stack || error.message}`);
  process.exitCode = 1;
});
