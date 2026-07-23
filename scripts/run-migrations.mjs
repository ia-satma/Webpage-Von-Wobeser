import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const parsed = new URL(databaseUrl);
const isReplitInternal = parsed.hostname.endsWith(".replit.dev")
  || parsed.hostname.endsWith(".replit.com")
  || parsed.hostname === "localhost"
  || parsed.hostname === "127.0.0.1";
if (!isReplitInternal) {
  for (const key of ["sslmode", "sslcert", "sslkey", "sslrootcert"]) {
    parsed.searchParams.delete(key);
  }
}

const client = new pg.Client({
  connectionString: parsed.toString(),
  ssl: isReplitInternal ? undefined : { rejectUnauthorized: true },
});

const migrationsDir = path.join(process.cwd(), "migrations");
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
    .filter((name) => /^\d+_[a-z0-9_]+\.sql$/i.test(name))
    .sort();

  for (const name of names) {
    const sql = await fs.readFile(path.join(migrationsDir, name), "utf8");
    const sha256 = crypto.createHash("sha256").update(sql).digest("hex");
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
      await client.query(sql);
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
