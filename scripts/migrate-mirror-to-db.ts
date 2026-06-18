/**
 * W8 · Arqueólogo — Content Migration (Tier 1: Abogados + fotos)
 *
 * Pobla la tabla `team_members` con los abogados reales del sitio viejo, parseando
 * los meta-tags de los perfiles del mirror estático. Idempotente: UPSERT por slug.
 *
 * Fuente : MIRROR - VON WOBESER FRONT/mirror/index.php/lawyer/l-*.html
 *          (meta-tags: Attorney, Position, Phone, Mail, Description, og:image)
 * Fotos  : copia el og:image -> client/public/partner_photos/<slug>.<ext>
 *          y setea imageUrl = '/partner_photos/<slug>.<ext>'.
 *
 * Reglas:
 *  - NO borra datos. Para registros existentes (mismo slug) solo RELLENA campos
 *    vacíos/faltantes; nunca sobrescribe datos buenos ya presentes.
 *  - Idempotente: correrlo dos veces no duplica ni daña nada.
 *
 * Uso: npx tsx scripts/migrate-mirror-to-db.ts
 */

import "dotenv/config";
import { readFileSync, readdirSync, existsSync, mkdirSync, copyFileSync } from "fs";
import { join, extname, dirname } from "path";
import { fileURLToPath } from "url";

// El cliente Drizzle (server/db.ts) lanza si DATABASE_URL no está definida y se
// evalúa en tiempo de import; por eso "dotenv/config" va primero (arriba) y `db`
// se importa de forma dinámica después, para garantizar el orden de carga.
const { db } = await import("../server/db");
const { teamMembers } = await import("@shared/schema");
const { eq } = await import("drizzle-orm");

// ---------------------------------------------------------------------------
// Rutas
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const MIRROR_ROOT = join(PROJECT_ROOT, "MIRROR - VON WOBESER FRONT", "mirror");
const LAWYER_DIR = join(MIRROR_ROOT, "index.php", "lawyer");
const PHOTO_DEST_DIR = join(PROJECT_ROOT, "client", "public", "partner_photos");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** kebab-case sin acentos, ascii-safe. */
function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita diacríticos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Extrae el content de un <meta name="X" ...> o <meta property="X" ...>.
 *
 * Importante: para algunas claves (notablemente og:image) el mirror emite DOS
 * etiquetas — primero `<meta property="og:image" content=""/>` (vacía) y luego
 * `<meta name="og:image" content="/images/...jpg"/>` (la buena). Por eso
 * recorremos TODAS las coincidencias y devolvemos el primer content no vacío.
 * `content` puede contener saltos de línea (p.ej. Description), por eso [\s\S].
 */
function extractMeta(html: string, key: string): string {
  const re = new RegExp(
    `<meta\\s+(?:name|property)=["']${key}["']\\s+content=["']([\\s\\S]*?)["']\\s*/?>`,
    "gi",
  );
  for (const m of html.matchAll(re)) {
    const val = m[1].trim();
    if (val) return val; // primer content no vacío gana
  }
  return ""; // todas vacías o ausentes
}

/** Mapea Position (EN) -> { role, roleEs, isPartner }. */
function mapPosition(position: string): { role: string; roleEs: string; isPartner: boolean } {
  const p = position.trim().toLowerCase();
  switch (p) {
    case "partner":
      return { role: "Partner", roleEs: "Socio", isPartner: true };
    case "of counsel":
      return { role: "Of Counsel", roleEs: "Of Counsel", isPartner: false };
    case "counsel":
      return { role: "Counsel", roleEs: "Counsel", isPartner: false };
    case "associate":
      return { role: "Associate", roleEs: "Asociado", isPartner: false };
    default:
      // Posición desconocida: la preservamos tal cual, sin marcarla como socio.
      return { role: position.trim() || "Associate", roleEs: position.trim() || "Asociado", isPartner: false };
  }
}

/** Un valor de DB se considera "vacío" (rellenable) si es null/undefined/string en blanco. */
function isEmpty(v: unknown): boolean {
  return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
}

// ---------------------------------------------------------------------------
// Parseo del mirror
// ---------------------------------------------------------------------------

interface ParsedLawyer {
  file: string;
  name: string;
  slug: string;
  position: string;
  role: string;
  roleEs: string;
  isPartner: boolean;
  phone: string;
  email: string;
  description: string;
  ogImage: string; // ruta tal como aparece en el meta (ej. "/images/Socios/...jpg")
}

function parseLawyers(): { parsed: ParsedLawyer[]; errors: string[] } {
  const errors: string[] = [];
  const files = readdirSync(LAWYER_DIR)
    .filter((f) => /^l-\d+\.html$/.test(f))
    .sort();

  const usedSlugs = new Set<string>();
  const parsed: ParsedLawyer[] = [];

  for (const file of files) {
    try {
      const html = readFileSync(join(LAWYER_DIR, file), "utf8");
      const name = extractMeta(html, "Attorney");
      if (!name) {
        errors.push(`${file}: meta Attorney vacío/ausente — omitido`);
        continue;
      }
      const position = extractMeta(html, "Position");
      const { role, roleEs, isPartner } = mapPosition(position);

      // Slug único dentro de la corrida (maneja homónimos del mirror, p.ej. dos
      // "Alejandro Torres"): el primero toma el base, los demás reciben sufijo.
      let baseSlug = slugify(name);
      if (!baseSlug) baseSlug = slugify(file.replace(/\.html$/, ""));
      let slug = baseSlug;
      let n = 2;
      while (usedSlugs.has(slug)) {
        slug = `${baseSlug}-${n}`;
        n++;
      }
      usedSlugs.add(slug);

      parsed.push({
        file,
        name,
        slug,
        position,
        role,
        roleEs,
        isPartner,
        phone: extractMeta(html, "Phone"),
        email: extractMeta(html, "Mail"),
        // Description multilinea: colapsamos espacios/saltos a un único espacio.
        description: extractMeta(html, "Description").replace(/\s+/g, " ").trim(),
        ogImage: extractMeta(html, "og:image"),
      });
    } catch (e) {
      errors.push(`${file}: error de parseo — ${(e as Error).message}`);
    }
  }

  return { parsed, errors };
}

// ---------------------------------------------------------------------------
// Copia de foto
// ---------------------------------------------------------------------------

/**
 * Copia la foto del og:image a client/public/partner_photos/<slug>.<ext>.
 * Devuelve la ruta pública servible (/partner_photos/...) o null si la fuente
 * no existe / no hay og:image.
 */
function copyPhoto(slug: string, ogImage: string, errors: string[]): string | null {
  if (!ogImage) return null;
  // og:image viene como ruta absoluta del sitio: "/images/...". La resolvemos
  // contra la raíz del mirror.
  const rel = ogImage.replace(/^\/+/, "");
  const src = join(MIRROR_ROOT, rel);
  if (!existsSync(src)) {
    errors.push(`${slug}: foto fuente no existe (${ogImage})`);
    return null;
  }
  let ext = extname(src).toLowerCase();
  if (!ext) ext = ".jpg";
  const destName = `${slug}${ext}`;
  const dest = join(PHOTO_DEST_DIR, destName);
  try {
    if (!existsSync(PHOTO_DEST_DIR)) mkdirSync(PHOTO_DEST_DIR, { recursive: true });
    copyFileSync(src, dest); // idempotente: sobrescribe la misma copia
    return `/partner_photos/${destName}`;
  } catch (e) {
    errors.push(`${slug}: fallo al copiar foto — ${(e as Error).message}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// UPSERT
// ---------------------------------------------------------------------------

async function run(): Promise<void> {
  console.log("W8 · Arqueólogo — migración mirror -> team_members\n");

  const { parsed, errors } = parseLawyers();
  console.log(`Perfiles parseados desde el mirror: ${parsed.length}`);

  let inserted = 0;
  let updated = 0;
  let skipped = 0; // existentes que ya estaban completos (nada que rellenar)
  let photosCopied = 0;

  // Carga existentes una sola vez (clave por slug) para el merge.
  const existingRows = await db.select().from(teamMembers);
  const bySlug = new Map(existingRows.map((r) => [r.slug, r]));

  // `order` para insertados nuevos: tras el máximo actual, para no pisar el orden
  // existente. Socios primero (offset 0), resto después.
  let maxOrder = existingRows.reduce((mx, r) => Math.max(mx, r.order ?? 0), 0);

  for (const law of parsed) {
    const existing = bySlug.get(law.slug);

    // Copiamos la foto SIEMPRE (idempotente). Para registros existentes solo
    // usaremos el imageUrl si el campo está vacío (no pisamos uno bueno).
    const publicPhoto = copyPhoto(law.slug, law.ogImage, errors);
    if (publicPhoto) photosCopied++;

    if (!existing) {
      // INSERT nuevo
      maxOrder++;
      try {
        await db.insert(teamMembers).values({
          name: law.name,
          slug: law.slug,
          // NOT NULL en el schema: usamos role/roleEs como title cuando no hay
          // otro título disponible (el mirror no expone un "title" distinto).
          title: law.role,
          titleEs: law.roleEs,
          role: law.role,
          roleEs: law.roleEs,
          bio: law.description || null,
          // El mirror solo trae bio en inglés; bioEs queda null para que otro
          // proceso de traducción lo complete (no inventamos español).
          bioEs: null,
          email: law.email || null,
          phone: law.phone || null,
          imageUrl: publicPhoto, // null si no se pudo copiar
          isPartner: law.isPartner,
          order: maxOrder,
        });
        inserted++;
      } catch (e) {
        errors.push(`${law.slug}: fallo al insertar — ${(e as Error).message}`);
      }
      continue;
    }

    // UPSERT: solo rellenamos campos vacíos del registro existente.
    const patch: Record<string, unknown> = {};
    if (isEmpty(existing.name) && law.name) patch.name = law.name;
    if (isEmpty(existing.title)) patch.title = law.role;
    if (isEmpty(existing.titleEs)) patch.titleEs = law.roleEs;
    if (isEmpty(existing.role)) patch.role = law.role;
    if (isEmpty(existing.roleEs)) patch.roleEs = law.roleEs;
    if (isEmpty(existing.bio) && law.description) patch.bio = law.description;
    if (isEmpty(existing.email) && law.email) patch.email = law.email;
    if (isEmpty(existing.phone) && law.phone) patch.phone = law.phone;
    if (isEmpty(existing.imageUrl) && publicPhoto) patch.imageUrl = publicPhoto;
    // isPartner: solo lo fijamos si el existente es null/undefined (no pisamos false/true reales).
    if (existing.isPartner === null || existing.isPartner === undefined) {
      patch.isPartner = law.isPartner;
    }

    if (Object.keys(patch).length === 0) {
      skipped++;
      continue;
    }

    try {
      await db.update(teamMembers).set(patch).where(eq(teamMembers.slug, law.slug));
      updated++;
    } catch (e) {
      errors.push(`${law.slug}: fallo al actualizar — ${(e as Error).message}`);
    }
  }

  // -------------------------------------------------------------------------
  // Resumen
  // -------------------------------------------------------------------------
  const finalCount = (await db.select().from(teamMembers)).length;

  console.log("\n================ RESUMEN ================");
  console.log(`Total parseados : ${parsed.length}`);
  console.log(`Inserted        : ${inserted}`);
  console.log(`Updated         : ${updated}  (campos vacíos rellenados)`);
  console.log(`Skipped         : ${skipped}  (ya completos, sin cambios)`);
  console.log(`Fotos copiadas  : ${photosCopied}`);
  console.log(`Errores         : ${errors.length}`);
  if (errors.length) {
    console.log("\n--- Detalle de errores ---");
    for (const e of errors) console.log(`  • ${e}`);
  }
  console.log(`\nTotal team_members en DB (después): ${finalCount}`);
  console.log("========================================\n");
}

run()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("FATAL:", e);
    process.exit(1);
  });
