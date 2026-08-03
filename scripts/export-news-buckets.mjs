#!/usr/bin/env node
// Segunda pasada: clasifica por el CONTENIDO real de cada columna y exporta 2 buckets con
// DIRECCIÓN FIJA (para no depender de la detección del subagente):
//   needES: la columna base (EN) está bien pero *_es está en INGLÉS -> traducir EN->ES y llenar *_es
//   needEN: la columna *_es (ES) está bien pero base está en ESPAÑOL -> traducir ES->EN y llenar base
// Fuente = el texto correcto de la otra columna. Escribe lotes {id, dir, title, excerpt, content}.
//   DATABASE_URL="..." node scripts/export-news-buckets.mjs <outDir>
import { createSqlClient } from "./lib/postgres-sql.mjs";
import fs from "fs";
import path from "path";
const url = process.env.DATABASE_URL;
if (!url) { console.error("Falta DATABASE_URL."); process.exit(1); }
const outDir = process.argv[2];
if (!outDir) { console.error("Uso: export-news-buckets.mjs <outDir>"); process.exit(1); }
const inDir = path.join(outDir, "in"); fs.mkdirSync(inDir, { recursive: true }); fs.mkdirSync(path.join(outDir,"out"),{recursive:true});
const sql = createSqlClient(url);

const strip = (s) => (s || "").replace(/<[^>]*>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").toLowerCase();
const ES = /\b(que|para|con|los|las|una|por|más|según|del|están|este|esta|como|pero|sus|leyes|ley|mediante|sobre|entre|nuevas|nuevos|nuevo|nueva|reforma|decreto|disposiciones|nuestra|además|país|jurídico|servicios|siguiente|acuerdo)\b/gi;
const EN = /\b(the|and|of|to|for|with|that|this|which|will|are|have|been|from|were|has|its|their|following|amendment|provisions|through|published|regarding|between|within|shall|these|those)\b/gi;
// idioma del texto MÁS informativo disponible (content si tiene prosa, si no title+excerpt)
const langOf = (content, titleExcerpt) => {
  const cs = strip(content);
  const s = cs.replace(/[^a-z]/g, "").length >= 40 ? cs : strip(titleExcerpt);
  if (s.replace(/[^a-z]/g, "").length < 10) return "x";
  const es = (s.match(ES) || []).length, en = (s.match(EN) || []).length;
  if (es >= 2 && es > en * 1.2) return "es";
  if (en >= 2 && en > es * 1.2) return "en";
  return "x";
};

const nz = (s) => (s || "").toString();
const has = (s) => strip(s).replace(/[^a-z]/g, "").length > 3;
const rows = await sql`select id, slug, title, title_es, excerpt, excerpt_es, content, content_es from news`;
const needES = [], needEN = [];
for (const r of rows) {
  // Lo que la página REALMENTE muestra (L = columna_es || base; EN = base):
  const esContent = has(r.content_es) ? r.content_es : r.content;         // fallback como el renderer
  const esTitle = has(r.title_es) ? r.title_es : r.title;
  const esExcerpt = has(r.excerpt_es) ? r.excerpt_es : r.excerpt;
  const esL = langOf(esContent, `${esTitle} ${esExcerpt}`);              // idioma de la página ES
  const enL = langOf(r.content, `${r.title} ${r.excerpt}`);             // idioma de la página EN (base)
  if (esL === "en") {
    // La página en español muestra INGLÉS -> traducir base(EN) a ES y llenar *_es
    needES.push({ id: r.id, dir: "es", title: r.title, excerpt: r.excerpt, content: r.content });
  } else if (enL === "es") {
    // La página en inglés muestra ESPAÑOL -> base es español -> traducir a EN (y preservar ES en *_es)
    needEN.push({ id: r.id, dir: "en", title: r.title, excerpt: r.excerpt, content: r.content });
  }
}

// escribir lotes por tamaño
const MAX_ITEMS = 20, MAX_CHARS = 16000;
const writeBatches = (arr, tag) => {
  const size = (r) => (r.title||"").length + (r.excerpt||"").length + (r.content||"").length;
  const batches = []; let cur = [], c = 0;
  for (const r of arr) { const s = size(r); if (cur.length && (cur.length>=MAX_ITEMS || c+s>MAX_CHARS)) { batches.push(cur); cur=[]; c=0; } cur.push(r); c+=s; if (c>=MAX_CHARS){batches.push(cur);cur=[];c=0;} }
  if (cur.length) batches.push(cur);
  const man = [];
  batches.forEach((b,i)=>{ const n=`${tag}_${String(i).padStart(3,"0")}`; const inP=path.join(inDir,`${n}.json`); fs.writeFileSync(inP, JSON.stringify(b)); man.push({inPath:inP, outPath:path.join(outDir,"out",`${n}.json`), dir:b[0].dir}); });
  return man;
};
const manifest = [...writeBatches(needES, "es"), ...writeBatches(needEN, "en")];
fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`needES (falta español): ${needES.length} | needEN (falta inglés): ${needEN.length}`);
console.log(`Lotes: ${manifest.length} | manifest: ${path.join(outDir,"manifest.json")}`);
