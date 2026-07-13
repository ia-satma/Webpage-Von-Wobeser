#!/usr/bin/env node
// Clasifica el idioma REAL de cada columna (base=EN esperado, *_es=ES esperado) en TODAS las
// noticias, para saber exactamente qué falta. Detección por stopwords sobre title+excerpt.
//   DATABASE_URL="..." node scripts/classify-news-lang.mjs [--dump-bad <n>]
import { neon } from "@neondatabase/serverless";
const url = process.env.DATABASE_URL;
if (!url) { console.error("Falta DATABASE_URL."); process.exit(1); }
const sql = neon(url);

const strip = (s) => (s || "").replace(/<[^>]*>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").toLowerCase();
const ES = /\b(que|para|con|los|las|una|por|más|según|del|están|este|esta|como|pero|sus|leyes|ley|mediante|sobre|entre|nuevas|nuevos|nuevo|nueva|reforma|decreto|disposiciones|nuestra|además|país|jurídico|servicios|siguiente|acuerdo|de la|en el|se publica)\b/gi;
const EN = /\b(the|and|of|to|for|with|that|this|which|will|are|have|been|from|were|has|its|their|following|amendment|provisions|through|published|regarding|between|within|shall|these|those|new|law)\b/gi;
const lang = (t) => {
  const s = strip(t);
  if (s.replace(/[^a-z]/g, "").length < 8) return "x"; // muy corto / nombre propio
  const es = (s.match(ES) || []).length, en = (s.match(EN) || []).length;
  if (es >= 2 && es > en) return "es";
  if (en >= 2 && en > es) return "en";
  return "x";
};

const rows = await sql`select id, slug, title, title_es, excerpt, excerpt_es from news`;
const cat = { correct: [], both_en: [], both_es: [], inverted: [], ambiguous: [] };
for (const r of rows) {
  const b = lang(`${r.title} ${r.excerpt}`);
  const e = lang(`${r.title_es} ${r.excerpt_es}`);
  if (b === "en" && e === "es") cat.correct.push(r);
  else if (b === "en" && e === "en") cat.both_en.push(r);        // falta ESPAÑOL en *_es
  else if (b === "es" && e === "es") cat.both_es.push(r);        // falta INGLÉS en base
  else if (b === "es" && e === "en") cat.inverted.push(r);       // invertido (swap)
  else cat.ambiguous.push(r);                                    // nombres propios / no claro
}
console.log(`TOTAL: ${rows.length}`);
console.log(`  correct (base=EN, *_es=ES):        ${cat.correct.length}`);
console.log(`  both_en (falta ES en columna *_es): ${cat.both_en.length}`);
console.log(`  both_es (falta EN en columna base): ${cat.both_es.length}`);
console.log(`  inverted (base=ES, *_es=EN):        ${cat.inverted.length}`);
console.log(`  ambiguous (nombres propios/corto):  ${cat.ambiguous.length}`);

const dumpIdx = process.argv.indexOf("--dump-bad");
if (dumpIdx > -1) {
  const n = parseInt(process.argv[dumpIdx + 1]) || 5;
  for (const [k, arr] of [["both_en", cat.both_en], ["both_es", cat.both_es], ["inverted", cat.inverted]]) {
    console.log(`\n-- ${k} (muestra ${n}) --`);
    arr.slice(0, n).forEach((r) => console.log(`   ${r.slug}: "${(r.title || "").slice(0, 45)}" | es="${(r.title_es || "").slice(0, 45)}"`));
  }
}
