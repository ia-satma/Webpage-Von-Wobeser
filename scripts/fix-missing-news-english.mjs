// Traduce con IA (Claude, vía server/openai.ts) los campos title/excerpt/content de las
// noticias cuya versión en inglés está vacía o es idéntica al español (copiada sin traducir).
// Encontrado al auditar la cobertura real ES/EN base del sitio (no confundir con la caché de
// traducción a 10 idiomas de `news_translations`, que es una feature aparte).
//
// Solo traduce el/los campo(s) que realmente lo necesitan por artículo — si el título ya está
// bien pero el contenido no, no vuelve a tocar el título. Usa una sola llamada al LLM por
// artículo (title+excerpt+content juntos) vía `translateMultipleTexts`.
//
// Uso: node scripts/fix-missing-news-english.mjs           (aplica los cambios)
//      node scripts/fix-missing-news-english.mjs --dry-run (solo lista qué haría, sin llamar al LLM)
import "dotenv/config";
import { createSqlClient } from "./lib/postgres-sql.mjs";
import { translateMultipleTexts } from "../server/openai.ts";

const sql = createSqlClient(process.env.DATABASE_URL);
const DRY_RUN = process.argv.includes("--dry-run");

const rows = await sql`
  select id, slug, title, title_es, excerpt, excerpt_es, content, content_es
  from news
  where title = title_es
     or excerpt = excerpt_es
     or content is null or trim(content) = ''
     or content = content_es
  order by id
`;

console.log(`${DRY_RUN ? "[DRY RUN] " : ""}${rows.length} artículos por corregir.\n`);

let fixed = 0;
let skipped = 0;
let failed = 0;

for (const [i, row] of rows.entries()) {
  const needsTitle = row.title === row.title_es && row.title_es?.trim();
  const needsExcerpt = row.excerpt === row.excerpt_es && row.excerpt_es?.trim();
  const needsContent = (!row.content || !row.content.trim() || row.content === row.content_es) && row.content_es?.trim();

  const fields = [];
  if (needsTitle) fields.push({ key: "title", text: row.title_es });
  if (needsExcerpt) fields.push({ key: "excerpt", text: row.excerpt_es });
  if (needsContent) fields.push({ key: "content", text: row.content_es });

  if (fields.length === 0) {
    // El único ES/EN mismatch era en un campo que ya estaba vacío en español también — nada que traducir.
    console.log(`  [${i + 1}/${rows.length}] ${row.slug} — sin texto fuente en español, se omite`);
    skipped++;
    continue;
  }

  console.log(`  [${i + 1}/${rows.length}] ${row.slug} — traduciendo: ${fields.map((f) => f.key).join(", ")}`);
  if (DRY_RUN) continue;

  try {
    const translated = await translateMultipleTexts(fields, "es", "en");
    const update = {};
    if (needsTitle && translated.title) update.title = translated.title;
    if (needsExcerpt && translated.excerpt) update.excerpt = translated.excerpt;
    if (needsContent && translated.content) update.content = translated.content;

    if (Object.keys(update).length === 0) {
      console.log(`    ⚠ el modelo no devolvió texto usable, se deja como estaba`);
      failed++;
      continue;
    }

    await sql`
      update news set
        title = coalesce(${update.title ?? null}, title),
        excerpt = coalesce(${update.excerpt ?? null}, excerpt),
        content = coalesce(${update.content ?? null}, content)
      where id = ${row.id}
    `;
    fixed++;
  } catch (err) {
    console.log(`    ✗ error: ${err.message}`);
    failed++;
  }
}

console.log(`\n${DRY_RUN ? "Nada escrito (dry-run)." : `Listo — ${fixed} corregidos, ${skipped} omitidos (sin fuente), ${failed} fallidos.`}`);

if (!DRY_RUN) {
  const [remaining] = await sql`
    select count(*)::int as c from news
    where title = title_es
       or excerpt = excerpt_es
       or content is null or trim(content) = ''
       or content = content_es
  `;
  console.log(`Verificación final: ${remaining.c} artículos siguen sin versión en inglés.`);
}
