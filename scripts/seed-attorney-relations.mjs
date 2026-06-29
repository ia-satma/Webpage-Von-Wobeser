// Pobla team_member_practice_groups y team_member_industry_groups leyendo del
// espejo HTML (fuente de verdad: cada perfil EN lista sus prácticas e industrias).
// Idempotente: borra y reconstruye las relaciones desde el espejo.
//
// Uso: node scripts/seed-attorney-relations.mjs            (aplica cambios)
//      node scripts/seed-attorney-relations.mjs --dry-run  (solo reporta)
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";

const DRY = process.argv.includes("--dry-run");
const MIRROR = process.env.MIRROR_DIR || path.resolve(process.cwd(), "..", "mirror");
const LAWYER_DIR = path.join(MIRROR, "index.php", "lawyer");

const sql = neon(process.env.DATABASE_URL);

const decode = (s) =>
  String(s)
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#39;|&rsquo;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ");
const norm = (s) =>
  decode(s)
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // quita acentos
    .toLowerCase()
    .replace(/[-.,]/g, " ")                            // guiones/puntos → espacio
    .replace(/\s+/g, " ")
    .trim();

// Prácticas que el espejo nombra distinto a la DB (DB consolidó nombres).
// clave = norm(nombre en espejo) → valor = norm(nombre en DB).
const PRACTICE_ALIASES = {
  "labor executive compensations & benefits": "labor & employment",
  "international trade & customs": "international trade",
  "tax (consultancy controversy & litigation)": "tax",
  "esg (environmental social and governance)": "esg (environmental social & corporate governance)",
  "competition & antitrust": "antitrust & competition",
  "administrative and regulatory": "administrative law",
  "industrial & intellectual property": "intellectual property",
  // Sin equivalente claro en la DB (se reportan, no se fuerzan):
  // "immigration & global mobility", "projects & infrastructure"
};

// --- 1. Parsear el espejo -------------------------------------------------
const files = fs.readdirSync(LAWYER_DIR).filter((f) => /^l-\d+\.html$/.test(f));
const parsed = [];
for (const f of files) {
  const html = fs.readFileSync(path.join(LAWYER_DIR, f), "utf8");
  const name = (html.match(/name="Attorney" content="([^"]*)"/) || [])[1];
  if (!name) continue;
  const practices = [...html.matchAll(/practice\/p-\d+\.html">([^<]+)/g)].map((m) => decode(m[1]).trim());
  const industries = [...html.matchAll(/industry\/p-\d+\.html">([^<]+)/g)].map((m) => decode(m[1]).trim());
  parsed.push({ file: f, name: decode(name).trim(), practices: [...new Set(practices)], industries: [...new Set(industries)] });
}
console.log(`Parseados ${parsed.length} perfiles de abogado del espejo.`);

// --- 2. Cargar la DB ------------------------------------------------------
const members = await sql`select id, name from team_members`;
const pgs = await sql`select id, name from practice_groups`;
const igs = await sql`select id, name from industry_groups`;
const memberByName = new Map(members.map((m) => [norm(m.name), m.id]));
const pgByName = new Map(pgs.map((p) => [norm(p.name), p.id]));
const igByName = new Map(igs.map((i) => [norm(i.name), i.id]));

// --- 3. Cruzar y construir pares -----------------------------------------
const pgPairs = new Set();   // `${memberId}|${pgId}`
const igPairs = new Set();
const unmatchedAttorneys = [];
const unmatchedPractices = new Set();
const unmatchedIndustries = new Set();

for (const a of parsed) {
  const mid = memberByName.get(norm(a.name));
  if (!mid) { unmatchedAttorneys.push(a.name); continue; }
  for (const p of a.practices) {
    const key = PRACTICE_ALIASES[norm(p)] || norm(p);
    const id = pgByName.get(key);
    if (id) pgPairs.add(`${mid}|${id}`); else unmatchedPractices.add(p);
  }
  for (const i of a.industries) {
    const id = igByName.get(norm(i));
    if (id) igPairs.add(`${mid}|${id}`); else unmatchedIndustries.add(i);
  }
}

console.log(`\n── Resultado del cruce ──`);
console.log(`  Abogados emparejados:    ${parsed.length - unmatchedAttorneys.length}/${parsed.length}`);
console.log(`  Relaciones práctica:     ${pgPairs.size}`);
console.log(`  Relaciones industria:    ${igPairs.size}`);
if (unmatchedAttorneys.length) console.log(`  ⚠️ Abogados sin match (${unmatchedAttorneys.length}): ${unmatchedAttorneys.join(", ")}`);
if (unmatchedPractices.size) console.log(`  ⚠️ Prácticas sin match: ${[...unmatchedPractices].join(" | ")}`);
if (unmatchedIndustries.size) console.log(`  ⚠️ Industrias sin match: ${[...unmatchedIndustries].join(" | ")}`);

if (DRY) { console.log("\n(dry-run: no se escribió nada)"); process.exit(0); }

// --- 4. Reconstruir las tablas puente ------------------------------------
const isUuid = (s) => /^[0-9a-fA-F-]{16,40}$/.test(s);
const insertPairs = async (table, col, pairs) => {
  await sql(`delete from ${table}`);
  const rows = [...pairs].map((p) => p.split("|")).filter(([a, b]) => isUuid(a) && isUuid(b));
  for (let k = 0; k < rows.length; k += 200) {
    const chunk = rows.slice(k, k + 200);
    const values = chunk.map(([a, b]) => `('${a}','${b}')`).join(",");
    await sql(`insert into ${table} (team_member_id, ${col}) values ${values}`);
  }
};

await insertPairs("team_member_practice_groups", "practice_group_id", pgPairs);
await insertPairs("team_member_industry_groups", "industry_group_id", igPairs);

const c1 = await sql`select count(*)::int n from team_member_practice_groups`;
const c2 = await sql`select count(*)::int n from team_member_industry_groups`;
console.log(`\n✅ Escrito. team_member_practice_groups=${c1[0].n}, team_member_industry_groups=${c2[0].n}`);
