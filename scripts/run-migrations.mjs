import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import pg from "pg";
import { getPostgresConnectionConfig } from "../shared/postgres-config.mjs";
import { runMigrationWithRedactedLegacyWarnings } from "./legacy-migration-log-redaction.mjs";
import { serializeMigrationClientQueries } from "./migration-query-serialization.mjs";

const databaseUrl = process.env.DATABASE_MIGRATION_URL || process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_MIGRATION_URL or DATABASE_URL is required");
if (process.env.REQUIRE_SEPARATE_DATABASE_ROLES === "true" && !process.env.DATABASE_MIGRATION_URL) {
  throw new Error("DATABASE_MIGRATION_URL is required when separate database roles are enforced");
}
if (
  process.env.REQUIRE_SEPARATE_DATABASE_ROLES === "true"
  && process.env.DATABASE_APP_URL
  && process.env.DATABASE_APP_URL === process.env.DATABASE_MIGRATION_URL
) {
  throw new Error("Application and migration database credentials must be different");
}

const client = new pg.Client({
  ...getPostgresConnectionConfig(databaseUrl),
});

const migrationsDir = path.join(process.cwd(), "migrations");
const strictAdditiveStart = "20260820_0001";
// Replit may provision an approved additive schema migration before this
// runner starts. Reconcile only this exact, verified column so a deployment
// never treats an already-applied migration as a fatal duplicate.
const platformSchemaReconciliations = new Map([
  ["20260826_0001_news_source_url.sql", { table: "news", column: "source_url", dataType: "text" }],
]);
// Las migraciones posteriores al endurecimiento son aditivas por defecto. Esta
// excepción individual conserva una reconciliación editorial comprobable: la
// migración sólo puede cambiar el pivote de autorías y el runner verifica que
// no altere esquema ni conteos de ninguna otra tabla.
const verifiedDataMigrationPolicies = new Map([
  ["20260826_0002_reconcile_publication_authors.mjs", {
    allowedCountChanges: new Set(["news_team_members"]),
  }],
  // Retiro editorial solicitado de una publicación histórica identificada por
  // su legacy id. La migración sólo puede afectar la publicación, su relación
  // de autores y, si existiera, sus traducciones dependientes.
  ["20260826_0003_delete_legacy_article_1568.mjs", {
    allowedCountChanges: new Set(["news", "news_team_members", "news_translations"]),
  }],
  // Corrección editorial de presentación: sólo actualiza los campos
  // estructurados del perfil existente y no altera registros ni esquema.
  ["20260827_0001_edmond_grieger_public_name.mjs", {
    allowedCountChanges: new Set(),
  }],
  // Corrección de una URL pública: actualiza sólo el valor histórico erróneo
  // de indicaciones y deja intacta cualquier edición posterior del panel.
  ["20260828_0001_correct_contact_map_directions.mjs", {
    allowedCountChanges: new Set(),
  }],
  ["20260828_0002_set_verified_contact_map_destination.mjs", {
    allowedCountChanges: new Set(),
  }],
  // Sustituye referencias de galería que ya no existen y sus logotipos por
  // videos y fotogramas reales; conserva cualquier edición diferente del CMS.
  ["20260828_0003_restore_diversity_video_gallery.mjs", {
    allowedCountChanges: new Set(),
  }],
]);

function quoteIdentifier(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function stripSqlComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\n]*/g, " ");
}

function assertStrictAdditiveMigration(name, source) {
  if (!name.endsWith(".sql")) {
    if (!verifiedDataMigrationPolicies.has(name)) {
      throw new Error(`Strict remediation migration must be SQL: ${name}`);
    }
    return;
  }
  const statements = stripSqlComments(source)
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
  if (!statements.length) throw new Error(`Empty strict remediation migration: ${name}`);
  for (const statement of statements) {
    const additive = /^(?:CREATE\s+(?:UNIQUE\s+)?INDEX|CREATE\s+TABLE|ALTER\s+TABLE\s+[a-z0-9_".]+\s+ADD\s+COLUMN)\b/i.test(statement);
    if (!additive) throw new Error(`Non-additive statement blocked in ${name}`);
  }
}

async function getPublicTableCounts() {
  const tables = await client.query(`
    SELECT c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p')
      AND c.relname <> 'app_schema_migrations'
    ORDER BY c.relname
  `);
  const counts = {};
  for (const { table_name: tableName } of tables.rows) {
    const result = await client.query(
      `SELECT count(*)::bigint::text AS count FROM ${quoteIdentifier(tableName)}`,
    );
    counts[tableName] = result.rows[0]?.count ?? "0";
  }
  return counts;
}

async function getSchemaManifestDigest() {
  const result = await client.query(`
    SELECT table_name, column_name, data_type, is_nullable, ordinal_position
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `);
  return crypto.createHash("sha256").update(JSON.stringify(result.rows)).digest("hex");
}

function assertProtectedCountsUnchanged(name, before, after, allowedCountChanges = new Set()) {
  const changed = Object.entries(before).filter(([tableName, count]) =>
    after[tableName] !== count && !allowedCountChanges.has(tableName),
  );
  if (changed.length) {
    const tableNames = changed.map(([tableName]) => tableName).join(",");
    throw new Error(`Protected table counts changed in ${name}: ${tableNames}`);
  }
}

function assertStrictSchemaUnchanged(name, before, after) {
  if (before !== after) throw new Error(`Schema manifest changed in strict data migration: ${name}`);
}

async function isPlatformSchemaMigrationAlreadyApplied(name) {
  const expected = platformSchemaReconciliations.get(name);
  if (!expected) return false;
  const result = await client.query(
    `SELECT data_type
       FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
    [expected.table, expected.column],
  );
  return result.rowCount === 1 && result.rows[0].data_type === expected.dataType;
}

await client.connect();
try {
  await client.query("SELECT pg_advisory_lock($1)", [2026072301]);
  await client.query(`
    CREATE TABLE IF NOT EXISTS app_schema_migrations (
      name text PRIMARY KEY,
      sha256 text NOT NULL,
      applied_at timestamp NOT NULL DEFAULT now()
    )
  `);
  const names = (await fs.readdir(migrationsDir))
    .filter((name) => /^\d+_[a-z0-9_]+\.(?:sql|mjs)$/i.test(name))
    .sort();

  for (const name of names) {
    const sourcePath = path.join(migrationsDir, name);
    const source = await fs.readFile(sourcePath, "utf8");
    const sha256 = crypto.createHash("sha256").update(source).digest("hex");
    const existing = await client.query(
      "SELECT sha256 FROM app_schema_migrations WHERE name = $1",
      [name],
    );
    if (existing.rowCount) {
      if (existing.rows[0].sha256 !== sha256) {
        throw new Error(`Applied migration was modified: ${name}`);
      }
      continue;
    }

    await client.query("BEGIN");
    try {
      const strictAdditive = name >= strictAdditiveStart;
      if (strictAdditive) assertStrictAdditiveMigration(name, source);
      const dataMigrationPolicy = verifiedDataMigrationPolicies.get(name);
      const countsBefore = strictAdditive ? await getPublicTableCounts() : null;
      const schemaBefore = strictAdditive ? await getSchemaManifestDigest() : null;
      if (countsBefore) {
        console.log(`[migrations] protected-counts before ${name}: ${JSON.stringify(countsBefore)}`);
        console.log(`[migrations] schema-manifest before ${name}: ${schemaBefore}`);
      }
      if (name.endsWith(".sql")) {
        if (await isPlatformSchemaMigrationAlreadyApplied(name)) {
          console.log(`[migrations] reconciled platform-applied schema migration ${name}`);
        } else {
          await client.query(source);
        }
      } else {
        const module = await import(`${pathToFileURL(sourcePath).href}?sha256=${sha256}`);
        if (typeof module.default !== "function") {
          throw new Error(`Data migration must have a default function: ${name}`);
        }
        // Every data migration receives a serialized facade over this single
        // pg connection. This makes historical Promise.all reads compatible
        // with pg 9 without altering already-applied migration files.
        await runMigrationWithRedactedLegacyWarnings(
          name,
          module.default,
          serializeMigrationClientQueries(client),
        );
      }
      if (countsBefore) {
        const countsAfter = await getPublicTableCounts();
        assertProtectedCountsUnchanged(name, countsBefore, countsAfter, dataMigrationPolicy?.allowedCountChanges);
        console.log(`[migrations] protected-counts after ${name}: ${JSON.stringify(countsAfter)}`);
        const schemaAfter = await getSchemaManifestDigest();
        if (dataMigrationPolicy) assertStrictSchemaUnchanged(name, schemaBefore, schemaAfter);
        console.log(`[migrations] schema-manifest after ${name}: ${schemaAfter}`);
      }
      await client.query(
        "INSERT INTO app_schema_migrations (name, sha256) VALUES ($1, $2)",
        [name, sha256],
      );
      await client.query("COMMIT");
      console.log(`[migrations] applied ${name}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
} finally {
  await client.query("SELECT pg_advisory_unlock($1)", [2026072301]).catch(() => undefined);
  await client.end();
}
