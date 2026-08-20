import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { getPostgresConnectionConfig } from "@shared/postgres-config.mjs";

// Driver estándar de Postgres (node-postgres / pg). Se conecta a proveedores externos
// con TLS validado y a la Postgres integrada de Replit por su red interna sin SSL.
const rawConnectionString = process.env.DATABASE_URL;
if (!rawConnectionString) throw new Error("DATABASE_URL is required");

const pool = new pg.Pool({
  ...getPostgresConnectionConfig(rawConnectionString, {
    readOnly: process.env.SECURITY_READ_ONLY_SMOKE === "true",
  }),
});

export const db = drizzle(pool, { schema });

export async function closeDatabasePool(): Promise<void> {
  await pool.end();
}
