#!/usr/bin/env node
// Siembra los reconocimientos de firma con los logos REALES que el home ya mostraba,
// para que el home se vea IDÉNTICO por defecto y ahora sea editable desde el panel.
// Idempotente: solo actúa si aún no hay reconocimientos con logo /images/banners/.
//   node scripts/seed-home-recognitions.mjs
import "dotenv/config";
import { createSqlClient } from "./lib/postgres-sql.mjs";
if (!process.env.DATABASE_URL) { console.error("Falta DATABASE_URL."); process.exit(1); }
const sql = createSqlClient(process.env.DATABASE_URL);

const REAL = [
  { name: "Chambers Global",         nameEs: "Chambers Global",         publication: "Chambers and Partners", logo: "/images/banners/Agosto156x156_chambers_global25-1.png", order: 1 },
  { name: "Latin Lawyer",            nameEs: "Latin Lawyer",            publication: "Latin Lawyer",          logo: "/images/banners/LatAm_2026_156px.png",                 order: 2 },
  { name: "The Legal 500",           nameEs: "The Legal 500",           publication: "The Legal 500",         logo: "/images/banners/156x156_chambers_LL250png.png",        order: 3 },
  { name: "Chambers Latin America",  nameEs: "Chambers Latin America",  publication: "Chambers and Partners", logo: "/images/banners/Agosto156x156_chambers_LATAM26.png",   order: 4 },
];

const existing = await sql`select count(*)::int c from rankings where logo_url ilike ${"/images/banners/%"}`;
if (existing[0].c > 0) {
  console.log("Ya hay reconocimientos con logos reales — no se toca (idempotente).");
  process.exit(0);
}
// Quita los placeholders previos (logos /logos/*.png inexistentes) e inserta los reales.
await sql`delete from rankings where logo_url ilike ${"/logos/%"} or logo_url is null`;
for (const r of REAL) {
  await sql`insert into rankings (name, name_es, publication, year, logo_url, "order")
            values (${r.name}, ${r.nameEs}, ${r.publication}, ${2026}, ${r.logo}, ${r.order})`;
}
const total = await sql`select count(*)::int c from rankings`;
console.log(`Listo: ${REAL.length} reconocimientos con logos reales sembrados (total en DB: ${total[0].c}).`);
