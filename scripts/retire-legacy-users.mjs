#!/usr/bin/env node
import "dotenv/config";
import pg from "pg";
import { getPostgresConnectionConfig } from "../shared/postgres-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const confirmDrop = process.argv.includes("--confirm-empty-and-drop");
const expectedColumns = ["id", "username", "password"];
const client = new pg.Client(getPostgresConnectionConfig(databaseUrl));

await client.connect();
try {
  const exists = await client.query("select to_regclass('public.users') is not null as present");
  if (!exists.rows[0].present) {
    console.log("[legacy-users] No existe una tabla public.users heredada. No hay nada que retirar.");
    process.exitCode = 0;
  } else {
    const columns = await client.query(`
      select column_name
      from information_schema.columns
      where table_schema = 'public' and table_name = 'users'
      order by ordinal_position
    `);
    const names = columns.rows.map((row) => row.column_name);
    if (JSON.stringify(names) !== JSON.stringify(expectedColumns)) {
      throw new Error(
        "public.users no coincide exactamente con el modelo heredado esperado; requiere revisión manual y no se modificó.",
      );
    }

    const rows = await client.query("select count(*)::int as count from public.users");
    const count = rows.rows[0].count;
    console.log(`[legacy-users] public.users heredada detectada: ${count} fila(s).`);
    if (!confirmDrop) {
      console.log("[legacy-users] Auditoría terminada sin cambios. Para eliminar una tabla vacía: npm run security:retire-legacy-users -- --confirm-empty-and-drop");
      process.exitCode = 1;
    } else if (count !== 0) {
      throw new Error("La tabla heredada contiene registros. No se eliminó ni se leyeron datos personales o contraseñas.");
    } else {
      await client.query("drop table public.users");
      console.log("[legacy-users] Tabla public.users vacía eliminada de forma confirmada.");
    }
  }
} finally {
  await client.end();
}
