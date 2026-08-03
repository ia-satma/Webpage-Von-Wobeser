#!/usr/bin/env node
// Escribe a la BD las traducciones producidas por el workflow. Lee out/batch_*.json (arrays de
// {id, srcLang, title, excerpt, content} = texto en el idioma FALTANTE) y actualiza news:
//   srcLang='es' (fuente español)  -> escribe INGLÉS en columnas base (title/excerpt/content)
//   srcLang='en' (fuente inglés)   -> escribe ESPAÑOL en columnas *_es
// Guarda idempotencia: solo actualiza filas aún pendientes (title = title_es) y en UNA sola
// sentencia por fila (para no romper el guard entre campos).
//   DATABASE_URL="..." node scripts/write-news-translations.mjs <baseDir>
import { createSqlClient } from "./lib/postgres-sql.mjs";
import fs from "fs";
import path from "path";

const url = process.env.DATABASE_URL;
if (!url) { console.error("Falta DATABASE_URL."); process.exit(1); }
const baseDir = process.argv[2];
if (!baseDir) { console.error("Uso: node scripts/write-news-translations.mjs <baseDir>"); process.exit(1); }
const outDir = path.join(baseDir, "out");
if (!fs.existsSync(outDir)) { console.error("No existe", outDir); process.exit(1); }

const sql = createSqlClient(url);
const nz = (s) => (s ?? "").toString();

const files = fs.readdirSync(outDir).filter((f) => /^batch_\d+\.json$/.test(f)).sort();
let updated = 0, skipped = 0, badFiles = 0, items = 0;

for (const f of files) {
  let arr;
  try { arr = JSON.parse(fs.readFileSync(path.join(outDir, f), "utf8")); }
  catch { badFiles++; continue; }
  if (!Array.isArray(arr)) { badFiles++; continue; }
  for (const it of arr) {
    items++;
    if (!it || !it.id || !nz(it.title).trim()) { skipped++; continue; }
    const t = nz(it.title), e = nz(it.excerpt), c = nz(it.content);
    let res;
    if (it.srcLang === "en") {
      // fuente inglés -> rellenar español (columnas *_es), solo si sigue pendiente
      res = await sql`update news set title_es = ${t}, excerpt_es = ${e}, content_es = ${c}
                      where id = ${it.id} and title = title_es returning id`;
    } else {
      // fuente español (default) -> rellenar inglés (columnas base)
      res = await sql`update news set title = ${t}, excerpt = ${e}, content = ${c}
                      where id = ${it.id} and title = title_es returning id`;
    }
    if (res.length) updated++; else skipped++;
  }
}

console.log(`Archivos: ${files.length} (inválidos: ${badFiles}) | items: ${items}`);
console.log(`Actualizadas: ${updated} | omitidas (ya traducidas o sin título): ${skipped}`);
const [{ pend }] = await sql`select count(*)::int pend from news where title = title_es`;
console.log(`Pendientes restantes (title = title_es): ${pend}`);
