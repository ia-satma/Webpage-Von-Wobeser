#!/usr/bin/env node
// Exporta las noticias pendientes (title = title_es) a archivos por lote para el workflow de
// traducción. Cada lote: array de {id, title, excerpt, content} (el texto fuente, en ES o EN).
// Presupuesto por lote: MAX_ITEMS items o MAX_CHARS de texto fuente; un cuerpo gigante va solo.
//   DATABASE_URL="..." node scripts/export-news-pending.mjs <outDir>
import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";

const url = process.env.DATABASE_URL;
if (!url) { console.error("Falta DATABASE_URL."); process.exit(1); }
const outDir = process.argv[2];
if (!outDir) { console.error("Uso: node scripts/export-news-pending.mjs <outDir>"); process.exit(1); }
const inDir = path.join(outDir, "in");
fs.mkdirSync(inDir, { recursive: true });

const MAX_ITEMS = 30;
const MAX_CHARS = 18000;

const sql = neon(url);
const rows = await sql`
  select id, coalesce(title_es,'') as title, coalesce(excerpt_es,'') as excerpt, coalesce(content_es,'') as content
  from news where title = title_es
  order by date desc nulls last`;

const size = (r) => (r.title.length + r.excerpt.length + r.content.length);
const batches = [];
let cur = [], curChars = 0;
for (const r of rows) {
  const s = size(r);
  if (cur.length && (cur.length >= MAX_ITEMS || curChars + s > MAX_CHARS)) {
    batches.push(cur); cur = []; curChars = 0;
  }
  cur.push(r); curChars += s;
  if (curChars >= MAX_CHARS) { batches.push(cur); cur = []; curChars = 0; } // cuerpo grande → cierra lote
}
if (cur.length) batches.push(cur);

const manifest = [];
batches.forEach((b, i) => {
  const n = String(i).padStart(3, "0");
  const inPath = path.join(inDir, `batch_${n}.json`);
  const outPath = path.join(outDir, "out", `batch_${n}.json`);
  fs.writeFileSync(inPath, JSON.stringify(b));
  manifest.push({ inPath, outPath });
});
fs.mkdirSync(path.join(outDir, "out"), { recursive: true });
fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`Pendientes: ${rows.length} → ${batches.length} lotes en ${inDir}`);
console.log(`Manifest: ${path.join(outDir, "manifest.json")}`);
