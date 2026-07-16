import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

// Driver estándar de Postgres (node-postgres / pg). Se conecta igual a Neon (SSL) que a
// la Postgres integrada de Replit (red interna del contenedor, sin SSL). Antes usaba
// drizzle-orm/neon-http + @neondatabase/serverless, que SOLO hablaba con el endpoint HTTP
// de Neon; por eso la base "externa" no se podía mover a la integrada de Replit.
// La app no usa transacciones de drizzle, así que el cambio es drop-in.
const connectionString = process.env.DATABASE_URL!;

// SSL: Neon exige sslmode=require; la Postgres de Replit corre en el host interno "helium"
// (o localhost) con sslmode=disable. Detectamos ese caso para NO forzar SSL ahí.
const noSsl =
  /sslmode=disable/.test(connectionString) ||
  /@(helium|localhost|127\.0\.0\.1|postgres)[:/]/.test(connectionString);

const pool = new pg.Pool({
  connectionString,
  ssl: noSsl ? false : { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });
