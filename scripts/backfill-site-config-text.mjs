// Backfill de una sola vez: varias keys de `site_config` (textos de Nuestra Firma, Contacto,
// Carrera, Pro Bono, Capacidades, Aviso de Privacidad, Diversidad, banner del home) quedaron
// vacías por diseño (vacío = "muestra el texto original de la plantilla capturada"), pero eso
// significa que el panel de administración las mostraba en blanco aunque el sitio público sí
// tenía texto real — el usuario lo reportó viendo "Aviso de Privacidad" vacío en el panel.
//
// Este script extrae el texto YA VISIBLE en el HTML capturado (mirror/) y lo escribe en la
// base de datos, para que el panel arranque mostrando el contenido real (editable desde ahí).
// La regla "vacío = original" se queda intacta como red de seguridad — solo se deja de
// depender de ella en silencio para estas keys.
//
// Decisiones tomadas con el usuario antes de correr esto:
// - page_contact_body: se usa la dirección/teléfono YA correctos de footer_address/footer_phone
//   (más actualizados que la dirección vieja que estaba comentada/oculta en el HTML capturado),
//   en vez de extraerla del HTML.
// - page_privacy_body: se acepta texto plano sin negritas en los subtítulos (RESPONSABLE,
//   FINALIDADES, etc.) — mejor que el campo vacío que había, sigue siendo 100% editable.
// - page_diversity_body: sin texto fuente en la plantilla original (solo la galería de video)
//   — se deja vacío a propósito, no hay nada que rellenar.
//
// Uso: node scripts/backfill-site-config-text.mjs           (aplica los cambios)
//      node scripts/backfill-site-config-text.mjs --dry-run (solo imprime lo que haría)
import "dotenv/config";
import * as cheerio from "cheerio";
import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const DRY_RUN = process.argv.includes("--dry-run");
const MIRROR_ROOT = "/Volumes/alejandro /MIRROR VON WOBESER PAGE/mirror";

function readMirrorHtml(relPath) {
  return fs.readFileSync(path.join(MIRROR_ROOT, relPath), "utf-8");
}

// Convierte un fragmento de HTML (párrafos, <br>, encabezados <h1-6>) a texto plano con el
// mismo formato que espera `toParagraphs()` en los renderers: doble salto de línea = nuevo
// párrafo, salto simple = <br>. Los encabezados se tratan como su propio párrafo (se pierde
// el negrita/tamaño, el contenido y el orden se conservan).
function blockToPlainText(innerHtml) {
  const s = innerHtml
    .replace(/<\/(h[1-6])>/gi, "\n\n")
    .replace(/<(h[1-6])[^>]*>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<p[^>]*>/gi, "");
  const $ = cheerio.load(`<div>${s}</div>`);
  return $("div")
    .text()
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractBlock(relPath, selector) {
  const $ = cheerio.load(readMirrorHtml(relPath));
  const el = $(selector).first();
  if (!el.length) throw new Error(`Selector "${selector}" no encontrado en ${relPath}`);
  return blockToPlainText(el.html() || "");
}

function extractLine(relPath, selector, index = 0) {
  const $ = cheerio.load(readMirrorHtml(relPath));
  const el = $(selector).eq(index);
  if (!el.length) throw new Error(`Selector "${selector}"[${index}] no encontrado en ${relPath}`);
  return el.text().replace(/\s+/g, " ").trim();
}

const FILES = {
  firm: { es: "index.php/nuestra-firma/index.html", en: "index.php/our-firm/index.html" },
  contact: { es: "index.php/contacto/index.html", en: "index.php/contact/index.html" },
  careers: { es: "index.php/bolsa-de-trabajo/index.html", en: "index.php/careers/index.html" },
  probono: { es: "index.php/nuestra-firma/probono/index.html", en: "index.php/our-firm/our-firm-probono/index.html" },
  capabilities: { es: "index.php/capacidades/index.html", en: "index.php/capabilities/index.html" },
  privacy: { es: "index.php/aviso/index.html", en: "index.php/privacy/index.html" },
  diversity: { es: "index.php/nuestra-firma/diversidad/index.html", en: "index.php/our-firm/diversity/index.html" },
  homeEs: "index.php/home/index.html",
  homeEn: "index.html",
};

const updates = [];

function addPageTexts(name, files, parts) {
  for (const part of parts) {
    const key = `page_${name}_${part}`;
    const selector = part === "intro" ? ".page__content--intro" : ".page__content--body";
    updates.push({
      key,
      value: extractBlock(files.en, selector),
      valueEs: extractBlock(files.es, selector),
    });
  }
}

addPageTexts("firm", FILES.firm, ["intro", "body"]);
addPageTexts("careers", FILES.careers, ["intro", "body"]);
addPageTexts("probono", FILES.probono, ["intro", "body"]);
addPageTexts("capabilities", FILES.capabilities, ["body"]);
addPageTexts("privacy", FILES.privacy, ["body"]);
addPageTexts("diversity", FILES.diversity, ["intro"]);
// page_diversity_body: sin texto fuente en la plantilla original — no se agrega.

updates.push({
  key: "page_contact_intro",
  value: extractBlock(FILES.contact.en, ".page__content--intro"),
  valueEs: extractBlock(FILES.contact.es, ".page__content--intro"),
});

// Contacto — cuerpo: se usa footer_address/footer_phone (ya correctos y vigentes) en vez del
// texto viejo que estaba oculto en un comentario HTML dentro del capturado.
{
  const [footerAddress] = await sql`select value, value_es from site_config where key = 'footer_address'`;
  const [footerPhone] = await sql`select value, value_es from site_config where key = 'footer_phone'`;
  updates.push({
    key: "page_contact_body",
    value: `${footerAddress.value}\n\nPhone: ${footerPhone.value}`,
    valueEs: `${footerAddress.value_es}\n\nTeléfono: ${footerPhone.value_es}`,
  });
}

// Banner del home — texto simple de una línea (no párrafos): primer <p> = título, segundo = subtítulo.
updates.push({
  key: "banner_title",
  value: extractLine(FILES.homeEn, ".home__rojo--txt p", 0),
  valueEs: extractLine(FILES.homeEs, ".home__rojo--txt p", 0),
});
updates.push({
  key: "banner_subtitle",
  value: extractLine(FILES.homeEn, ".home__rojo--txt p", 1),
  valueEs: extractLine(FILES.homeEs, ".home__rojo--txt p", 1),
});

// Video de Diversidad — el lado "value" (inglés) estaba vacío pero el renderer ya usaba un
// fallback fijo idéntico al valueEs; se completa el campo del panel con ese mismo valor.
updates.push({ key: "page_diversity_video_main", value: "/images/vw_vid_02.mp4", valueEs: null });
updates.push({ key: "page_diversity_video_1", value: "/images/vid_01.mp4", valueEs: null });

// --- Reporte + escritura ------------------------------------------------
console.log(`${DRY_RUN ? "[DRY RUN] " : ""}Backfill de ${updates.length} keys de site_config:\n`);
for (const u of updates) {
  const preview = (s) => (s ? s.slice(0, 70).replace(/\n/g, " ⏎ ") + (s.length > 70 ? "…" : "") : "(sin cambio / vacío)");
  console.log(`  ${u.key}`);
  console.log(`    EN (${u.value?.length ?? 0} chars): ${preview(u.value)}`);
  if (u.valueEs !== null) console.log(`    ES (${u.valueEs?.length ?? 0} chars): ${preview(u.valueEs)}`);
  if (!DRY_RUN) {
    if (u.valueEs === null) {
      await sql`update site_config set value = ${u.value}, updated_at = now() where key = ${u.key}`;
    } else {
      await sql`update site_config set value = ${u.value}, value_es = ${u.valueEs}, updated_at = now() where key = ${u.key}`;
    }
  }
}

console.log(`\n${DRY_RUN ? "Nada escrito (dry-run)." : "Listo — " + updates.length + " keys actualizadas en site_config."}`);
