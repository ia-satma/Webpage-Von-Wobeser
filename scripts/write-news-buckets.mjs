#!/usr/bin/env node
// Escribe la 2ª pasada (dirección fija). Lee out/{es,en}_*.json (traducciones) y escribe columnas:
//   es_*  (dir=es): traducción ESPAÑOL -> columnas *_es (base EN se queda).
//   en_*  (dir=en): traducción INGLÉS -> columnas base; y preserva el español actual (base) en *_es.
//   DATABASE_URL="..." node scripts/write-news-buckets.mjs <baseDir>
import { createSqlClient } from "./lib/postgres-sql.mjs";
import fs from "fs";
import path from "path";
const url = process.env.DATABASE_URL;
if (!url) { console.error("Falta DATABASE_URL."); process.exit(1); }
const baseDir = process.argv[2];
const outDir = path.join(baseDir, "out");
const sql = createSqlClient(url);
const nz = (s) => (s ?? "").toString();
const files = fs.readdirSync(outDir).filter((f) => /^(es|en)_\d+\.json$/.test(f)).sort();
let up = 0, skip = 0, bad = 0;
for (const f of files) {
  const dir = f.startsWith("es_") ? "es" : "en";
  let arr; try { arr = JSON.parse(fs.readFileSync(path.join(outDir, f), "utf8")); } catch { bad++; continue; }
  if (!Array.isArray(arr)) { bad++; continue; }
  for (const it of arr) {
    if (!it || !it.id || !nz(it.title).trim()) { skip++; continue; }
    const t = nz(it.title), e = nz(it.excerpt), c = nz(it.content);
    if (dir === "es") {
      await sql`update news set title_es = ${t}, excerpt_es = ${e}, content_es = ${c} where id = ${it.id}`;
    } else {
      // preservar el español actual (columna base) en *_es antes de sobrescribir base con inglés
      const cur = (await sql`select title, excerpt, content from news where id = ${it.id}`)[0];
      if (cur) await sql`update news set title_es = ${cur.title}, excerpt_es = ${cur.excerpt}, content_es = ${cur.content} where id = ${it.id}`;
      await sql`update news set title = ${t}, excerpt = ${e}, content = ${c} where id = ${it.id}`;
    }
    up++;
  }
}
console.log(`Archivos: ${files.length} (inválidos: ${bad}) | actualizadas: ${up} | omitidas: ${skip}`);
