#!/usr/bin/env node
// Aplica scripts/featured-home.sql a PostgreSQL.
// Idempotente (ADD COLUMN IF NOT EXISTS / CREATE INDEX IF NOT EXISTS) y no destructivo.
//   node scripts/apply-featured-home.mjs
import "dotenv/config";
import { createSqlClient } from "./lib/postgres-sql.mjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

if (!process.env.DATABASE_URL) {
  console.error("Falta DATABASE_URL (define .env). Abortando.");
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlText = fs.readFileSync(path.join(__dirname, "featured-home.sql"), "utf8");
const statements = sqlText
  .split("\n")
  .filter((l) => !l.trim().startsWith("--"))
  .join("\n")
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

const sql = createSqlClient(process.env.DATABASE_URL);
let ok = 0;
for (const stmt of statements) {
  try {
    await sql(stmt);
    console.log("✓", stmt.replace(/\s+/g, " ").slice(0, 72));
    ok++;
  } catch (e) {
    console.error("✗", stmt.slice(0, 72), "\n   ", e.message);
  }
}
console.log(`\nListo: ${ok}/${statements.length} sentencias aplicadas (idempotente).`);
