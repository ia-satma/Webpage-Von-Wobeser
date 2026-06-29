// Crea en la DB los abogados que están en el espejo pero NO en la base de datos,
// para que queden administrables desde el backend. Lee perfil EN (lawyer/l-*.html)
// y ES (abogado/l-*.html), extrae campos núcleo y relaciones práctica/industria.
//
// Uso: node scripts/ingest-missing-attorneys.mjs [--dry-run]
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";

const DRY = process.argv.includes("--dry-run");
const MIRROR = process.env.MIRROR_DIR || path.resolve(process.cwd(), "..", "mirror");
const EN_DIR = path.join(MIRROR, "index.php", "lawyer");
const ES_DIR = path.join(MIRROR, "index.php", "abogado");
const sql = neon(process.env.DATABASE_URL);

const decode = (s) => String(s).replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ");
const norm = (s) => decode(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[-.,]/g, " ").replace(/\s+/g, " ").trim();
const slugify = (s) => decode(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const clean = (s) => decode(s).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const PRACTICE_ALIASES = {
  "labor executive compensations & benefits": "labor & employment",
  "international trade & customs": "international trade",
  "tax (consultancy controversy & litigation)": "tax",
  "esg (environmental social and governance)": "esg (environmental social & corporate governance)",
  "competition & antitrust": "antitrust & competition",
  "administrative and regulatory": "administrative law",
  "industrial & intellectual property": "intellectual property",
};

// Position (espejo) → title canónico de la DB
function normTitle(pos) {
  const p = norm(pos || "");
  if (p.includes("partner") && !p.includes("of counsel")) return "Partner";
  if (p.includes("of counsel")) return "Of Counsel";
  if (p.includes("counsel")) return "Counsel";
  return "Associate";
}

function extract(html) {
  const meta = (n) => (html.match(new RegExp(`name="${n}" content="([^"]*)"`)) || [])[1] || "";
  const og =
    (html.match(/attorney__meta--img"\s+style="background-image:url\(([^)]+)\)/) || [])[1] ||
    (html.match(/og:image" content="(\/[^"]+)"/) || [])[1] ||
    "";
  const intro = (html.match(/attorney__content--intro"[^>]*>([\s\S]*?)<\/div>/) || [])[1] || "";
  const txt = (html.match(/attorney__content--txt"[^>]*>([\s\S]*?)<\/div>/) || [])[1] || "";
  const bio = clean(intro + " " + txt);
  const practices = [...html.matchAll(/practice\/p-\d+\.html">([^<]+)/g)].map((m) => clean(m[1]));
  const industries = [...html.matchAll(/industry\/p-\d+\.html">([^<]+)/g)].map((m) => clean(m[1]));
  const langBlock = (html.match(/Languages\s*<ul>([\s\S]*?)<\/ul>/) || [])[1] || "";
  const languages = clean(langBlock).split(/[,.]| and /).map((s) => s.trim()).filter((s) => s && s.length < 25);
  return { name: clean(meta("Attorney")), position: clean(meta("Position")), phone: clean(meta("Phone")), email: clean(meta("Mail")), photo: og, bio, practices: [...new Set(practices)], industries: [...new Set(industries)], languages };
}

// --- cargar DB ---
const members = await sql`select id, name, slug from team_members`;
const pgs = await sql`select id, name from practice_groups`;
const igs = await sql`select id, name from industry_groups`;
const memberNames = new Set(members.map((m) => norm(m.name)));
const existingSlugs = new Set(members.map((m) => m.slug));
const pgByName = new Map(pgs.map((p) => [norm(p.name), p.id]));
const igByName = new Map(igs.map((i) => [norm(i.name), i.id]));

// --- recorrer espejo, quedarnos con los que faltan ---
const files = fs.readdirSync(EN_DIR).filter((f) => /^l-\d+\.html$/.test(f));
const toCreate = [];
for (const f of files) {
  const en = extract(fs.readFileSync(path.join(EN_DIR, f), "utf8"));
  if (!en.name || memberNames.has(norm(en.name))) continue;
  let esBio = "", esPos = "";
  const esPath = path.join(ES_DIR, f);
  if (fs.existsSync(esPath)) {
    const es = extract(fs.readFileSync(esPath, "utf8"));
    esBio = es.bio; esPos = es.position;
  }
  let slug = slugify(en.name), i = 2;
  while (existingSlugs.has(slug)) slug = `${slugify(en.name)}-${i++}`;
  existingSlugs.add(slug);
  toCreate.push({ ...en, slug, esBio, esPos, title: normTitle(en.position) });
}

console.log(`Faltantes a crear: ${toCreate.length}`);
toCreate.forEach((a) => console.log(`  · ${a.name} (${a.title}) — ${a.practices.length}p/${a.industries.length}i, foto:${a.photo ? "sí" : "no"}`));

if (DRY) { console.log("\n(dry-run: no se escribió nada)"); process.exit(0); }

// --- insertar ---
let created = 0, rel = 0;
for (const a of toCreate) {
  const q = (s) => (s == null ? null : `'${String(s).replace(/'/g, "''")}'`);
  const langs = JSON.stringify(a.languages || []);
  const isPartner = a.title === "Partner";
  const rows = await sql(`insert into team_members
    (name, slug, title, title_es, role, role_es, bio, bio_es, email, phone, image_url, is_partner, languages, "order")
    values (${q(a.name)}, ${q(a.slug)}, ${q(a.position || a.title)}, ${q(a.esPos || a.position || a.title)},
            ${q(a.position || a.title)}, ${q(a.esPos || a.position || a.title)}, ${q(a.bio)}, ${q(a.esBio)},
            ${q(a.email)}, ${q(a.phone)}, ${q(a.photo)}, ${isPartner}, '${langs}'::jsonb, 999)
    returning id`);
  const mid = rows[0].id;
  created++;
  for (const p of a.practices) {
    const id = pgByName.get(PRACTICE_ALIASES[norm(p)] || norm(p));
    if (id) { await sql(`insert into team_member_practice_groups (team_member_id, practice_group_id) values ('${mid}','${id}')`); rel++; }
  }
  for (const ind of a.industries) {
    const id = igByName.get(norm(ind));
    if (id) { await sql(`insert into team_member_industry_groups (team_member_id, industry_group_id) values ('${mid}','${id}')`); rel++; }
  }
}
const total = await sql`select count(*)::int n from team_members`;
console.log(`\n✅ Creados ${created} abogados + ${rel} relaciones. Total en DB: ${total[0].n}`);
