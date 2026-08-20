import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { getPostgresConnectionConfig } from "@shared/postgres-config.mjs";
import { attachDatabasePoolErrorHandler } from "./database/poolSafety";

// Driver estándar de Postgres (node-postgres / pg). Se conecta a proveedores externos
// con TLS validado y a la Postgres integrada de Replit por su red interna sin SSL.
const requireSeparatedRoles = process.env.REQUIRE_SEPARATE_DATABASE_ROLES === "true";
const appDatabaseUrl = process.env.DATABASE_APP_URL;
const migrationDatabaseUrl = process.env.DATABASE_MIGRATION_URL;
const rawConnectionString = appDatabaseUrl || process.env.DATABASE_URL;
if (!rawConnectionString) throw new Error("DATABASE_APP_URL or DATABASE_URL is required");
if (requireSeparatedRoles && !appDatabaseUrl) {
  throw new Error("DATABASE_APP_URL is required when separate database roles are enforced");
}
if (requireSeparatedRoles && migrationDatabaseUrl && migrationDatabaseUrl === appDatabaseUrl) {
  throw new Error("Application and migration database credentials must be different");
}

const pool = new pg.Pool({
  ...getPostgresConnectionConfig(rawConnectionString, {
    readOnly: process.env.SECURITY_READ_ONLY_SMOKE === "true",
  }),
});
attachDatabasePoolErrorHandler(pool);

export const db = drizzle(pool, { schema });

export async function closeDatabasePool(): Promise<void> {
  await pool.end();
}
