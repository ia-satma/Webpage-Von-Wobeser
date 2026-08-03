#!/usr/bin/env node
// Corrige el ENRUTAMIENTO de idioma de las noticias: la columna base (title/excerpt/content) debe
// ser INGLÉS y la *_es ESPAÑOL. El workflow a veces etiquetó mal el idioma fuente y escribió el
// inglés en *_es y el español en base (columnas invertidas). Aquí se DETECTA el idioma real de cada
// columna (por stopwords) y, si están invertidas, se INTERCAMBIAN los tres campos.
// Detección deterministic, no usa la etiqueta del subagente.
//   DATABASE_URL="..." node scripts/fix-news-lang-routing.mjs [--apply]
import { createSqlClient } from "./lib/postgres-sql.mjs";
const url = process.env.DATABASE_URL;
if (!url) { console.error("Falta DATABASE_URL."); process.exit(1); }
const APPLY = process.argv.includes("--apply");
const sql = createSqlClient(url);

const strip = (s) => (s || "").replace(/<[^>]*>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").toLowerCase();
const ES = /\b(que|para|con|los|las|una|por|más|según|del|están|este|esta|como|pero|sus|ley|leyes|mediante|sobre|entre|nuevo|nueva|nuevas|nuevos|de la|en el|se publica|reforma|decreto|disposiciones|artículo)\b/gi;
const EN = /\b(the|and|of|to|for|with|that|this|which|will|are|have|been|from|as|by|on|at|was|were|has|its|their|following|amendment|law|decree|provisions|through|new|published)\b/gi;
const score = (t) => { const s = strip(t); return { es: (s.match(ES) || []).length, en: (s.match(EN) || []).length }; };
// ¿el texto parece español? (más marcadores es que en, con margen)
const isEs = (t) => { const { es, en } = score(t); return es >= 2 && es > en; };
const isEn = (t) => { const { es, en } = score(t); return en >= 2 && en > es; };

const rows = await sql`
  select id, slug, title, title_es, excerpt, excerpt_es, content, content_es
  from news where title <> title_es`;

let swap = 0, ok = 0, ambiguous = 0;
const samples = [];
for (const r of rows) {
  // Señal por título+extracto (más fiable que el cuerpo largo)
  const baseTxt = `${r.title} ${r.excerpt}`;
  const esTxt = `${r.title_es} ${r.excerpt_es}`;
  const baseEs = isEs(baseTxt), baseEn = isEn(baseTxt);
  const esEs = isEs(esTxt), esEn = isEn(esTxt);

  if (baseEs && esEn) {
    // Invertido: base=español, *_es=inglés → intercambiar
    swap++;
    if (samples.length < 8) samples.push(`SWAP ${r.slug}: base="${(r.title||"").slice(0,40)}" es="${(r.title_es||"").slice(0,40)}"`);
    if (APPLY) {
      await sql`update news set
        title = ${r.title_es}, title_es = ${r.title},
        excerpt = ${r.excerpt_es}, excerpt_es = ${r.excerpt},
        content = ${r.content_es}, content_es = ${r.content}
        where id = ${r.id}`;
    }
  } else if (baseEn && esEs) {
    ok++; // correcto
  } else {
    ambiguous++; // nombres propios / indetectable → no tocar
  }
}
console.log(`${APPLY ? "APLICADO" : "DRY-RUN"} | analizadas: ${rows.length}`);
console.log(`  correctas (base=EN, *_es=ES): ${ok}`);
console.log(`  INVERTIDAS a intercambiar: ${swap}`);
console.log(`  ambiguas (nombres propios / no claro): ${ambiguous}`);
samples.forEach((s) => console.log("   " + s));
