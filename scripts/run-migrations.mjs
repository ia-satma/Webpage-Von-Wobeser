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
      if (name.endsWith(".sql")) {
        await client.query(source);
      } else {
        const module = await import(`${pathToFileURL(sourcePath).href}?sha256=${sha256}`);
        if (typeof module.default !== "function") {
          throw new Error(`Data migration must have a default function: ${name}`);
        }
        await module.default(client);
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
