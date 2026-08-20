import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import pg from "pg";
import { getPostgresConnectionConfig } from "../shared/postgres-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const client = new pg.Client({
  ...getPostgresConnectionConfig(databaseUrl),
});

const migrationsDir = path.join(process.cwd(), "migrations");
const strictAdditiveStart = "20260820_0001";

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
    throw new Error(`Strict remediation migration must be SQL: ${name}`);
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

function assertProtectedCountsUnchanged(name, before, after) {
  const changed = Object.entries(before).filter(([tableName, count]) => after[tableName] !== count);
  if (changed.length) {
    const tableNames = changed.map(([tableName]) => tableName).join(",");
    throw new Error(`Protected table counts changed in ${name}: ${tableNames}`);
  }
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
      const countsBefore = strictAdditive ? await getPublicTableCounts() : null;
      const schemaBefore = strictAdditive ? await getSchemaManifestDigest() : null;
      if (countsBefore) {
        console.log(`[migrations] protected-counts before ${name}: ${JSON.stringify(countsBefore)}`);
        console.log(`[migrations] schema-manifest before ${name}: ${schemaBefore}`);
      }
      if (name.endsWith(".sql")) {
        await client.query(source);
      } else {
        const module = await import(`${pathToFileURL(sourcePath).href}?sha256=${sha256}`);
        if (typeof module.default !== "function") {
          throw new Error(`Data migration must have a default function: ${name}`);
        }
        await module.default(client);
      }
      if (countsBefore) {
        const countsAfter = await getPublicTableCounts();
        assertProtectedCountsUnchanged(name, countsBefore, countsAfter);
        console.log(`[migrations] protected-counts after ${name}: ${JSON.stringify(countsAfter)}`);
        console.log(`[migrations] schema-manifest after ${name}: ${await getSchemaManifestDigest()}`);
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
