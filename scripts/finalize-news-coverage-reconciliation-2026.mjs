#!/usr/bin/env node
/**
 * Finaliza de forma segura la primera corrida de reconciliación de Noticias.
 * La corrida inicial reveló que algunas fichas oficiales EN eran la
 * contraparte de una ficha ES ya presente: esas copias se despublican antes
 * de exponer duplicados, sin borrar ningún dato. Las fichas que la fuente
 * conserva sólo en español se completan con su traducción editorial revisada
 * y se publican.
 *
 * No borra contenido histórico ni técnico: las filas duplicadas se identifican
 * por el slug, p_id, URL y título que esta misma reconciliación insertó y se
 * conservan como borradores no públicos en Administración.
 */
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createSqlClient } from "./lib/postgres-sql.mjs";
import { newsSourceOnlyTranslations2026 } from "./data/news-source-only-translations-2026.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const argValue = (name, fallback) => {
  const prefix = `--${name}=`;
  const value = args.find((arg) => arg.startsWith(prefix));
  return value ? value.slice(prefix.length) : fallback;
};
const APPLY = args.includes("--apply");
const AUDIT = path.resolve(ROOT, argValue("audit", "output/audits/noticias-fechas-2026-08-28/VWYS_Auditoria_Fechas_Noticias_2026-08-28.snapshot.json"));
const MANIFEST = path.resolve(ROOT, argValue("manifest", "output/audits/noticias-cobertura-2026-08-28/VWYS_Reconciliacion_Cobertura_Noticias_2026-08-28.manifest.json"));

if (APPLY && process.env.CONFIRM_NEWS_COVERAGE_FINALIZATION !== "1") {
  throw new Error("Para escribir use CONFIRM_NEWS_COVERAGE_FINALIZATION=1 junto con --apply.");
}

async function main() {
  const [audit, manifest] = await Promise.all([
    fs.readFile(AUDIT, "utf8").then(JSON.parse),
    fs.readFile(MANIFEST, "utf8").then(JSON.parse),
  ]);
  const originallyPresent = new Set(audit.rows
    .filter((row) => row.comparison !== "project_missing")
    .map((row) => String(row.legacyId)));
  const duplicateCopies = manifest.inserts.filter((entry) =>
    entry.counterpartLegacyId && originallyPresent.has(String(entry.counterpartLegacyId)));
  const sourceOnlyIds = Object.keys(newsSourceOnlyTranslations2026).sort((a, b) => Number(a) - Number(b));

  const sql = createSqlClient(process.env.DATABASE_URL);
  try {
    const duplicateChecks = [];
    for (const entry of duplicateCopies) {
      const rows = await sql`
        select id, legacy_id, slug, source_url, title, published
        from news
        where legacy_id = ${entry.payload.legacyId}
          and slug = ${entry.payload.slug}
          and source_url = ${entry.payload.sourceUrl}
          and title = ${entry.payload.title}
      `;
      duplicateChecks.push({ legacyId: entry.payload.legacyId, slug: entry.payload.slug, rows: rows.length, ids: rows.map((row) => row.id) });
    }
    const sourceOnlyChecks = [];
    for (const legacyId of sourceOnlyIds) {
      const rows = await sql`
        select id, legacy_id, title, title_es, excerpt, excerpt_es, content, content_es, published
        from news where legacy_id = ${legacyId}
      `;
      sourceOnlyChecks.push({ legacyId, rows });
    }
    const invalidDuplicates = duplicateChecks.filter((check) => check.rows !== 1);
    const invalidSourceOnly = sourceOnlyChecks.filter((check) => check.rows.length !== 1);
    const summary = {
      mode: APPLY ? "applied" : "dry-run",
      duplicateCounterpartCopiesToUnpublish: duplicateCopies.length,
      duplicateCounterpartCopiesVerified: duplicateChecks.filter((check) => check.rows === 1).length,
      sourceOnlyTranslationsToPublish: sourceOnlyIds.length,
      sourceOnlyRowsVerified: sourceOnlyChecks.filter((check) => check.rows.length === 1).length,
      invalidDuplicates,
      invalidSourceOnly: invalidSourceOnly.map((check) => ({ legacyId: check.legacyId, rows: check.rows.length })),
    };
    if (invalidDuplicates.length || invalidSourceOnly.length) {
      throw new Error(`Precondiciones fallidas: ${JSON.stringify(summary)}`);
    }

    if (APPLY) {
      const client = await sql.pool.connect();
      try {
        await client.query("BEGIN");
        for (const entry of duplicateCopies) {
          const result = await client.query(
            "update news set published = false where legacy_id = $1 and slug = $2 and source_url = $3 and title = $4 returning id",
            [entry.payload.legacyId, entry.payload.slug, entry.payload.sourceUrl, entry.payload.title],
          );
          if (result.rowCount !== 1) throw new Error(`No se pudo despublicar de forma segura la copia ${entry.payload.legacyId}.`);
        }
        for (const legacyId of sourceOnlyIds) {
          const translation = newsSourceOnlyTranslations2026[legacyId];
          const result = await client.query(
            "update news set title = $1, excerpt = $2, content = $3, published = true where legacy_id = $4 returning id",
            [translation.title, translation.excerpt, translation.content, legacyId],
          );
          if (result.rowCount !== 1) throw new Error(`No se pudo publicar la traducción de la fuente ${legacyId}.`);
        }
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    }
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(`[news-finalize] ERROR: ${error.stack || error.message}`);
  process.exitCode = 1;
});
