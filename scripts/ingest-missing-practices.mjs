// Ingiere las prácticas REALES del espejo que no están en la DB (ni como variante
// de nombre). Bilingüe (EN practice/ + ES practica/). Idempotente. node scripts/ingest-missing-practices.mjs [--dry-run]
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";

const DRY = process.argv.includes("--dry-run");
const MIRROR = process.env.MIRROR_DIR || path.resolve(process.cwd(), "..", "mirror");
const sql = neon(process.env.DATABASE_URL);
const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[-.,&()]/g, " ").replace(/\s+/g, " ").trim();
const slugify = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const clean = (h) => cheerio.load("<div>" + (h || "") + "</div>")("div").text().replace(/\s+/g, " ").trim();

// Variantes conocidas → mapean a una práctica existente (no son nuevas).
const ALIASES = {
  "labor executive compensations benefits": "labor employment", "international trade customs": "international trade",
  "tax consultancy controversy litigation": "tax", "esg environmental social and governance": "esg environmental social corporate governance",
  "competition antitrust": "antitrust competition", "administrative and regulatory": "administrative law",
  "industrial intellectual property": "intellectual property",
};

const dbRows = await sql`select name, slug from practice_groups`;
const dbNames = new Set(dbRows.map((r) => norm(r.name)));
const dbSlugs = new Set(dbRows.map((r) => r.slug));

function parse(file) {
  if (!fs.existsSync(file)) return null;
  const $ = cheerio.load(fs.readFileSync(file, "utf8"));
  const name = $(".single__meta--name").first().text().trim();
  if (!name) return null;
  return { name, intro: clean($(".single__content--intro").first().html()), body: clean($(".single__content--txt").map((_, e) => $(e).html()).get().join(" ")) };
}

const enDir = path.join(MIRROR, "index.php/practice");
const esDir = path.join(MIRROR, "index.php/practica");
const toAdd = [];
for (const f of fs.readdirSync(enDir)) {
  const m = f.match(/^p-(\d+)\.html$/); if (!m) continue;
  const en = parse(path.join(enDir, f)); if (!en) continue;
  const key = norm(en.name);
  if (dbNames.has(key) || ALIASES[key]) continue; // ya existe o es variante
  const es = parse(path.join(esDir, f)) || en;
  let slug = slugify(en.name), s = slug, k = 2; while (dbSlugs.has(s)) s = `${slug}-${k++}`; dbSlugs.add(s);
  toAdd.push({ id: m[1], slug: s, name: en.name, nameEs: es.name, descEn: en.intro || en.name, descEs: es.intro || es.name, fullEn: en.body, fullEs: es.body });
}

console.log(`Prácticas nuevas a agregar: ${toAdd.length}`);
toAdd.forEach((p) => console.log(`  p-${p.id}: ${p.name} / ${p.nameEs}`));
if (DRY || toAdd.length === 0) { console.log(DRY ? "(dry-run)" : "Nada que agregar."); process.exit(0); }

const q = (v) => (v == null ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);
for (const p of toAdd) {
  await sql(`insert into practice_groups (name, name_es, slug, description, description_es, full_description, full_description_es, "order", published)
    values (${q(p.name)}, ${q(p.nameEs)}, ${q(p.slug)}, ${q(p.descEn.slice(0, 500))}, ${q(p.descEs.slice(0, 500))}, ${q(p.fullEn)}, ${q(p.fullEs)}, 99, true)`);
}
const total = await sql`select count(*)::int n from practice_groups`;
console.log(`✅ Agregadas ${toAdd.length}. Total prácticas: ${total[0].n}`);
