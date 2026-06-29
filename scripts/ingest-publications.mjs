// Migra las ~1,765 publicaciones del espejo a la tabla `news` (dinámicas/editables).
// Empareja EN (publication/p_id-X.html) con ES (publicacion/p_id-X.html) por p_id.
// Idempotente: usa legacy_id para no duplicar (borra y reinserta las migradas).
// Uso: node scripts/ingest-publications.mjs [--dry-run]
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";

const DRY = process.argv.includes("--dry-run");
const MIRROR = process.env.MIRROR_DIR || path.resolve(process.cwd(), "..", "mirror");
const sql = neon(process.env.DATABASE_URL);

const slugify = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
const clean = (h) => cheerio.load("<div>" + h + "</div>")("div").text().replace(/\s+/g, " ").trim();
const MONTHS = { enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5, julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11, january: 0, february: 1, march: 2, april: 3, may: 4, june: 5, july: 6, august: 7, september: 8, october: 9, november: 10, december: 11 };

// --- 1. Mapa p_id -> fecha y categoría (de los listados) ---
function buildDateMap() {
  const map = {}; // p_id -> {date, category}
  const dirs = [
    ["index.php/publications/news", "news"], ["index.php/publications/articles", "articles"],
    ["index.php/publicaciones/noticias", "news"], ["index.php/publicaciones/articulos", "articles"],
  ];
  for (const [dir, cat] of dirs) {
    const full = path.join(MIRROR, dir);
    if (!fs.existsSync(full)) continue;
    for (const f of fs.readdirSync(full)) {
      if (!f.endsWith(".html")) continue;
      const $ = cheerio.load(fs.readFileSync(path.join(full, f), "utf8"));
      $(".archive__item").each((_, el) => {
        const href = $(el).find("a").first().attr("href") || "";
        const m = href.match(/p_id-(\d+)/);
        if (!m) return;
        const dateTxt = $(el).find(".archive__item--date").text().trim();
        let date = null;
        const dm = dateTxt.match(/([A-Za-zÁÉÍÓÚáéíóú]+)[,\s]+(\d{4})/);
        if (dm && MONTHS[dm[1].toLowerCase()] !== undefined) date = new Date(Date.UTC(+dm[2], MONTHS[dm[1].toLowerCase()], 1));
        if (!map[m[1]]) map[m[1]] = { date, category: cat };
        else if (date && !map[m[1]].date) map[m[1]].date = date;
      });
    }
  }
  return map;
}

// --- 2. Parsear una publicación ---
function parsePub(file) {
  if (!fs.existsSync(file)) return null;
  const html = fs.readFileSync(file, "utf8");
  const $ = cheerio.load(html);
  const title = $(".single__meta--name").first().text().trim();
  if (!title) return null;
  const intro = clean($(".single__content--intro").first().html() || "");
  const body = clean($(".single__content--txt").map((_, e) => $(e).html()).get().join(" "));
  const pdf = $("a.page--btn.download").attr("href") || $('a[href$=".pdf"]').attr("href") || "";
  return { title, intro, body, pdf };
}

(async () => {
  console.log("Construyendo mapa de fechas de los listados…");
  const dateMap = buildDateMap();
  console.log(`  ${Object.keys(dateMap).length} p_id con fecha/categoría.`);

  // p_ids del lado EN (publication) ∪ ES (publicacion)
  const enDir = path.join(MIRROR, "index.php/publication");
  const esDir = path.join(MIRROR, "index.php/publicacion");
  const ids = new Set();
  for (const d of [enDir, esDir]) if (fs.existsSync(d)) for (const f of fs.readdirSync(d)) { const m = f.match(/^p_id-(\d+)\.html$/); if (m) ids.add(m[1]); }
  console.log(`  ${ids.size} publicaciones únicas (EN∪ES).`);

  // Dedupe vs las news existentes por título normalizado (preserva las curadas).
  const existing = await sql`select title, title_es from news`;
  const existingTitles = new Set(existing.flatMap((r) => [slugify(r.title), slugify(r.title_es)]).filter(Boolean));

  const rows = [];
  const usedSlugs = new Set();
  for (const id of ids) {
    const en = parsePub(path.join(enDir, `p_id-${id}.html`));
    const es = parsePub(path.join(esDir, `p_id-${id}.html`));
    const main = en || es;
    if (!main) continue;
    const titleEn = en?.title || es?.title;
    const titleEs = es?.title || en?.title;
    if (existingTitles.has(slugify(titleEn)) || existingTitles.has(slugify(titleEs))) continue; // ya existe (curada)
    let slug = slugify(titleEn) || `pub-${id}`;
    let s = slug, k = 2;
    while (usedSlugs.has(s)) s = `${slug}-${k++}`;
    usedSlugs.add(s);
    const meta = dateMap[id] || {};
    const pdfHtml = main.pdf ? ` <p><a href="${main.pdf}" target="_blank">PDF</a></p>` : "";
    rows.push({
      legacy_id: id, slug: s,
      title: titleEn, title_es: titleEs,
      excerpt: (en?.intro || es?.intro || titleEn).slice(0, 500), excerpt_es: (es?.intro || en?.intro || titleEs).slice(0, 500),
      content: (en?.body || en?.intro || "") + pdfHtml, content_es: (es?.body || es?.intro || "") + pdfHtml,
      date: meta.date || null, category: meta.category || "news",
    });
  }
  console.log(`\nA migrar: ${rows.length} publicaciones (las que no existen ya en news).`);
  console.log(`  con fecha: ${rows.filter((r) => r.date).length} | sin fecha: ${rows.filter((r) => !r.date).length}`);
  console.log("  ejemplos:", rows.slice(0, 3).map((r) => `${r.legacy_id}:"${r.title.slice(0, 30)}"`).join(" | "));

  if (DRY) { console.log("\n(dry-run: no se escribió nada)"); process.exit(0); }

  // Idempotente: borrar las previamente migradas (legacy_id no nulo) y reinsertar.
  await sql`alter table news add column if not exists legacy_id text`;
  await sql`delete from news where legacy_id is not null`;
  const q = (v) => (v == null ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);
  let n = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100);
    const values = chunk.map((r) =>
      `(${q(r.title)}, ${q(r.title_es)}, ${q(r.excerpt)}, ${q(r.excerpt_es)}, ${q(r.content)}, ${q(r.content_es)}, ${q(r.slug)}, ${r.date ? `'${r.date.toISOString()}'` : "NULL"}, true, ${q(r.category)}, 'Prensa', ${q(r.legacy_id)})`
    ).join(",");
    await sql(`insert into news (title, title_es, excerpt, excerpt_es, content, content_es, slug, date, published, category, category_es, legacy_id) values ${values}`);
    n += chunk.length; process.stdout.write(`\r  insertadas ${n}/${rows.length}`);
  }
  const total = await sql`select count(*)::int n from news`;
  console.log(`\n✅ Migradas ${n} publicaciones. Total en news ahora: ${total[0].n}`);
})();
