import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

// Driver estándar de Postgres (node-postgres / pg). Se conecta igual a Neon (SSL) que a
// la Postgres integrada de Replit (red interna del contenedor, sin SSL). Antes usaba
// drizzle-orm/neon-http + @neondatabase/serverless, que SOLO hablaba con el endpoint HTTP
// de Neon; por eso la base "externa" no se podía mover a la integrada de Replit.
// La app no usa transacciones de drizzle, así que el cambio es drop-in.
const rawConnectionString = process.env.DATABASE_URL!;
if (!rawConnectionString) throw new Error("DATABASE_URL is required");
const databaseUrl = new URL(rawConnectionString);

// SSL: Neon exige sslmode=require; la Postgres de Replit corre en el host interno "helium"
// (o localhost) con sslmode=disable. Detectamos ese caso para NO forzar SSL ahí.
const noSsl = databaseUrl.searchParams.get("sslmode") === "disable"
  || ["helium", "localhost", "127.0.0.1", "postgres"].includes(databaseUrl.hostname)
  || databaseUrl.hostname.endsWith(".replit.dev")
  || databaseUrl.hostname.endsWith(".replit.com");

// node-postgres da prioridad a ciertos parámetros SSL de la URL sobre el objeto
// `ssl`; para una base externa se eliminan de la copia en memoria y se impone
// validación de certificado. El Secret original no se modifica.
if (!noSsl) {
  for (const key of ["sslmode", "sslcert", "sslkey", "sslrootcert"]) {
    databaseUrl.searchParams.delete(key);
  }
}

const pool = new pg.Pool({
  connectionString: databaseUrl.toString(),
  // La base interna de Replit no usa TLS; cualquier PostgreSQL externa debe
  // presentar una cadena válida. DATABASE_URL y la cuenta permanecen intactas.
  ssl: noSsl ? false : { rejectUnauthorized: true },
  // Los smoke tests HTTP de seguridad reutilizan el esquema real exclusivamente
  // para lecturas. PostgreSQL rechaza cualquier escritura aunque una ruta o tarea
  // futura se active por accidente.
  ...(process.env.SECURITY_READ_ONLY_SMOKE === "true"
    ? { options: "-c default_transaction_read_only=on" }
    : {}),
});

export const db = drizzle(pool, { schema });
