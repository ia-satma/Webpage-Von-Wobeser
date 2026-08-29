#!/usr/bin/env node
/**
 * Resolución documentada del único par histórico cuya contraparte oficial
 * tiene p_id distinto y cuyo registro antiguo fue abreviado. La ficha 83
 * reproduce la fuente oficial actual en ambos idiomas; la 82 se conserva
 * como borrador para evitar dos tarjetas públicas del mismo contenido.
 */
import "dotenv/config";
import { createSqlClient } from "./lib/postgres-sql.mjs";

const APPLY = process.argv.includes("--apply");
if (APPLY && process.env.CONFIRM_NEWS_PAIR_82_83 !== "1") {
  throw new Error("Para escribir use CONFIRM_NEWS_PAIR_82_83=1 junto con --apply.");
}

async function main() {
  const sql = createSqlClient(process.env.DATABASE_URL);
  try {
    const rows = await sql`
      select id, legacy_id, title, title_es, date, published, source_url
      from news where legacy_id in ('82', '83') order by legacy_id::int
    `;
    const old = rows.find((row) => row.legacy_id === "82");
    const verified = rows.find((row) => row.legacy_id === "83");
    if (!old || !verified
      || !String(verified.source_url ?? "").includes("p_id=83")
      || !/Fernando Carreño/i.test(String(verified.title))) {
      throw new Error("El estado del par 82/83 no coincide con la evidencia revisada; no se aplicó ningún cambio.");
    }
    const alreadyApplied = old.published === false && verified.published === true;
    if (!alreadyApplied && (old.published !== true || verified.published !== false)) {
      throw new Error("El estado de publicación del par 82/83 es inesperado; no se aplicó ningún cambio.");
    }
    const summary = {
      mode: alreadyApplied ? "already-applied" : APPLY ? "applied" : "dry-run",
      preservedAsDraft: { legacyId: old.legacy_id, title: old.title },
      publishedFromOfficialSource: { legacyId: verified.legacy_id, title: verified.title, sourceUrl: verified.source_url },
    };
    if (APPLY && !alreadyApplied) {
      const client = await sql.pool.connect();
      try {
        await client.query("BEGIN");
        const hidden = await client.query("update news set published = false where id = $1 and published = true returning id", [old.id]);
        const published = await client.query("update news set published = true where id = $1 and published = false returning id", [verified.id]);
        if (hidden.rowCount !== 1 || published.rowCount !== 1) throw new Error("No se pudo alternar el par 82/83 de forma segura.");
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
  console.error(`[resolve-news-pair] ERROR: ${error.stack || error.message}`);
  process.exitCode = 1;
});
