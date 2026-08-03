#!/usr/bin/env node
// Backfill GRATIS: rellena las columnas EN del sitio (news.title/excerpt/content) con las
// traducciones al inglés ya guardadas en news_translations (language='en') y translation_cache
// (content_type='news', target_language='en'), que el sitio NO lee. Solo toca noticias hoy sin
// traducir (title = title_es) y solo cuando la traducción guardada difiere del español.
// Idempotente. Requiere DATABASE_URL en el entorno.
//   DATABASE_URL="..." node scripts/backfill-news-en.mjs
import { createSqlClient } from "./lib/postgres-sql.mjs";

const url = process.env.DATABASE_URL;
if (!url) { console.error("Falta DATABASE_URL en el entorno."); process.exit(1); }
const sql = createSqlClient(url);

const nz = (s) => (s ?? "").trim();
let fromNT = 0, fromCache = 0;

// --- 1) news_translations (en) ------------------------------------------------
const nts = await sql`
  select nt.news_id, nt.title, nt.excerpt, nt.content
  from news_translations nt
  join news n on n.id = nt.news_id
  where nt.language = 'en' and n.title = n.title_es`;
for (const r of nts) {
  const sets = {};
  if (nz(r.title) && nz(r.title) !== nz(await one(r.news_id, "title_es"))) sets.title = r.title;
  if (nz(r.excerpt)) sets.excerpt = r.excerpt;
  if (nz(r.content)) sets.content = r.content;
  if (!sets.title) continue; // el título es la señal principal de "traducida"
  await applyUpdate(r.news_id, sets);
  fromNT++;
}

// --- 2) translation_cache (news / en) para las que sigan sin traducir --------
const rows = await sql`
  select tc.entity_id, tc.field, tc.translated_text
  from translation_cache tc
  join news n on n.id = tc.entity_id
  where tc.content_type = 'news' and tc.target_language = 'en'
    and n.title = n.title_es and tc.field in ('title','excerpt','content')
    and coalesce(tc.translated_text,'') <> ''`;
const byId = new Map();
for (const r of rows) {
  if (!byId.has(r.entity_id)) byId.set(r.entity_id, {});
  byId.get(r.entity_id)[r.field] = r.translated_text;
}
for (const [id, fields] of byId) {
  if (!nz(fields.title)) continue;
  if (nz(fields.title) === nz(await one(id, "title_es"))) continue; // no difiere → no aporta
  await applyUpdate(id, {
    title: fields.title,
    ...(nz(fields.excerpt) ? { excerpt: fields.excerpt } : {}),
    ...(nz(fields.content) ? { content: fields.content } : {}),
  });
  fromCache++;
}

console.log(`Backfill listo: ${fromNT} desde news_translations + ${fromCache} desde translation_cache.`);
const [{ pend }] = await sql`select count(*)::int pend from news where title = title_es`;
console.log(`Noticias que siguen sin traducir (title = title_es): ${pend}`);

// helpers — solo title_es se consulta; los updates van por campo con plantilla etiquetada
async function one(id, _col) {
  const r = await sql`select title_es as v from news where id = ${id}`;
  return r[0]?.v ?? "";
}
async function applyUpdate(id, sets) {
  if (sets.title != null)   await sql`update news set title   = ${sets.title}   where id = ${id}`;
  if (sets.excerpt != null) await sql`update news set excerpt = ${sets.excerpt} where id = ${id}`;
  if (sets.content != null) await sql`update news set content = ${sets.content} where id = ${id}`;
}
