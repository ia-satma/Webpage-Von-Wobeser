import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "DATABASE_URL no está definida. En Replit la inyecta el entorno; en local, expórtala apuntando a tu Postgres (ej. postgresql://localhost:5432/vonwobeser_dev).",
  );
}

// Replit/Neon usa el driver HTTP serverless; un Postgres local (o cualquier host
// no-Neon) usa node-postgres. La detección preserva el comportamiento en Replit
// y habilita desarrollo/verificación local sin tocar la configuración de producción.
const isNeon =
  process.env.REPL_ID !== undefined || /neon\.tech|neon\.|\.neon\b/.test(url);

export const db = isNeon
  ? drizzleNeon(neon(url), { schema })
  : drizzlePg(new pg.Pool({ connectionString: url }), { schema });
