import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import pg from "pg";
import { getPostgresConnectionConfig } from "../shared/postgres-config.mjs";
import { runMigrationWithRedactedLegacyWarnings } from "./legacy-migration-log-redaction.mjs";
import { serializeMigrationClientQueries } from "./migration-query-serialization.mjs";

const databaseUrl = process.env.DATABASE_MIGRATION_URL || process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_MIGRATION_URL or DATABASE_URL is required");
if (process.env.REQUIRE_SEPARATE_DATABASE_ROLES === "true" && !process.env.DATABASE_MIGRATION_URL) {
  throw new Error("DATABASE_MIGRATION_URL is required when separate database roles are enforced");
}
if (
  process.env.REQUIRE_SEPARATE_DATABASE_ROLES === "true"
  && process.env.DATABASE_APP_URL
  && process.env.DATABASE_APP_URL === process.env.DATABASE_MIGRATION_URL
) {
  throw new Error("Application and migration database credentials must be different");
}

const client = new pg.Client({
  ...getPostgresConnectionConfig(databaseUrl),
});

const migrationsDir = path.join(process.cwd(), "migrations");
const strictAdditiveStart = "20260820_0001";
// Replit may provision an approved additive schema migration before this
// runner starts. Reconcile only this exact, verified column so a deployment
// never treats an already-applied migration as a fatal duplicate.
const platformSchemaReconciliations = new Map([
  ["20260826_0001_news_source_url.sql", { table: "news", column: "source_url", dataType: "text" }],
  // Replit can materialize the approved production schema change before the
  // application process starts. The runner still records this exact local
  // migration, but must not attempt to add the same column a second time.
  ["20260828_0004_news_author_verification_status.sql", { table: "news_team_members", column: "verification_status", dataType: "text" }],
  // Igual protección para el rol de relación editorial: Replit puede aplicar
  // el ALTER TABLE aprobado antes del arranque. Sólo se reconcilia si existe
  // exactamente esta columna de texto en la tabla esperada.
  ["20260829_0005_news_team_member_relationship_role.sql", { table: "news_team_members", column: "relationship_role", dataType: "text" }],
]);
// Las migraciones posteriores al endurecimiento son aditivas por defecto. Esta
// excepción individual conserva una reconciliación editorial comprobable: la
// migración sólo puede cambiar el pivote de autorías y el runner verifica que
// no altere esquema ni conteos de ninguna otra tabla.
const verifiedDataMigrationPolicies = new Map([
  ["20260826_0002_reconcile_publication_authors.mjs", {
    allowedCountChanges: new Set(["news_team_members"]),
  }],
  // Retiro editorial solicitado de una publicación histórica identificada por
  // su legacy id. La migración sólo puede afectar la publicación, su relación
  // de autores y, si existiera, sus traducciones dependientes.
  ["20260826_0003_delete_legacy_article_1568.mjs", {
    allowedCountChanges: new Set(["news", "news_team_members", "news_translations"]),
  }],
  // Corrección editorial de presentación: sólo actualiza los campos
  // estructurados del perfil existente y no altera registros ni esquema.
  ["20260827_0001_edmond_grieger_public_name.mjs", {
    allowedCountChanges: new Set(),
  }],
  // Corrección de una URL pública: actualiza sólo el valor histórico erróneo
  // de indicaciones y deja intacta cualquier edición posterior del panel.
  ["20260828_0001_correct_contact_map_directions.mjs", {
    allowedCountChanges: new Set(),
  }],
  ["20260828_0002_set_verified_contact_map_destination.mjs", {
    allowedCountChanges: new Set(),
  }],
  // Sustituye referencias de galería que ya no existen y sus logotipos por
  // videos y fotogramas reales; conserva cualquier edición diferente del CMS.
  ["20260828_0003_restore_diversity_video_gallery.mjs", {
    allowedCountChanges: new Set(),
  }],
  // Clasifica vínculos de autor existentes sin borrarlos ni crear otros: sólo
  // conserva la procedencia verificable para el filtro público conservador.
  ["20260828_0005_backfill_author_verification_status.mjs", {
    allowedCountChanges: new Set(),
  }],
  // Reemplaza una URL visible como texto por su CTA de fuente verificable en
  // dos Artículos históricos; no agrega ni elimina ninguna fila o relación.
  ["20260828_0006_normalize_article_source_links.mjs", {
    allowedCountChanges: new Set(),
  }],
  // Repara una sola publicación de Noticias cuya evidencia histórica acredita
  // seis autores: confirma cinco vínculos existentes y agrega uno faltante.
  ["20260828_0007_correct_news_1911_author_relations.mjs", {
    allowedCountChanges: new Set(["news_team_members"]),
  }],
  // Corrige exclusivamente una familia de rutas Joomla que el sitio legado
  // redirige hoy a 404; no cambia contenido ni cardinalidad de ninguna tabla.
  ["20260829_0001_normalize_legacy_article_source_routes.mjs", {
    allowedCountChanges: new Set(),
  }],
  // Retira de las superficies públicas las fichas HTML de la plataforma
  // anterior y guarda su motivo en la bitácora de integridad. Sólo aumenta la
  // evidencia reversible de enlaces; no elimina ni crea publicaciones.
  ["20260829_0003_deactivate_legacy_article_pages.mjs", {
    allowedCountChanges: new Set(["news_external_links"]),
  }],
  // Corrige etiquetas editoriales entregadas como parte de cinco títulos de
  // Comunicaciones, sin modificar contenido, visibilidad ni relaciones.
  ["20260829_0004_remove_communication_title_prefixes.mjs", {
    allowedCountChanges: new Set(),
  }],
  // Clasifica las relaciones ya verificadas sin borrar, crear ni cambiar
  // contenido: sólo los Artículos acreditados pasan a "author"; las demás
  // publicaciones permanecen como profesionales relacionados.
  ["20260829_0006_backfill_article_author_relationship_roles.mjs", {
    allowedCountChanges: new Set(),
  }],
  // Corrección ortográfica puntual de un perfil existente. Conserva todas las
  // relaciones, slug y visibilidad; sólo normaliza nombre y apellidos.
  ["20260829_0007_correct_alejandro_avila_accent.mjs", {
    allowedCountChanges: new Set(),
  }],
  // Corrección ortográfica puntual equivalente, sin afectar identidad ni
  // relaciones del perfil existente.
  ["20260829_0008_correct_ruben_villegas_accent.mjs", {
    allowedCountChanges: new Set(),
  }],
  // Mantiene el perfil y sus vínculos para Administración, pero despublica
  // únicamente el perfil solicitado del directorio público.
  ["20260829_0009_unpublish_eugenio_chinchillas.mjs", {
    allowedCountChanges: new Set(),
  }],
  // Actualiza únicamente los valores editoriales heredados de la cabecera de
  // Áreas de Práctica; la clave sigue disponible para edición administrativa.
  ["20260829_0010_rename_practice_listing_heading.mjs", {
    allowedCountChanges: new Set(),
  }],
  // Añade el título de Carrera como copy administrable con el texto editorial
  // aprobado; no modifica introducción, cuerpo ni postulaciones.
  ["20260829_0011_add_careers_page_title.mjs", {
    // Esta migración crea exactamente una clave nueva de configuración si
    // todavía no existe; ningún otro conteo puede cambiar.
    allowedCountChanges: new Set(["site_config"]),
  }],
  // Convierte el cuerpo heredado de Carrera en copy administrable con el
  // ajuste aprobado, sin sobrescribir una edición existente del panel.
  ["20260829_0012_update_careers_talent_copy.mjs", {
    allowedCountChanges: new Set(),
  }],
  // Importación editorial entregada por CMDN: agrega registros nuevos, sus
  // autorías manualmente confirmadas y el estado de cada fuente verificable.
  // No modifica publicaciones existentes ni relaciones ajenas al calendario.
  ["20260829_0013_import_cmdn_editorial_calendar_articles.mjs", {
    allowedCountChanges: new Set(["news", "news_team_members", "news_external_links"]),
  }],
  // Memorándum aprobado con sus dos autorías explícitas y evidencia del PDF
  // público; no toca ninguna publicación existente.
  ["20260829_0014_publish_key_issues_ma_mexico_2026.mjs", {
    allowedCountChanges: new Set(["news", "news_team_members", "news_external_links"]),
  }],
  // Reconocimiento Chambers Latin America 2027 entregado por el equipo
  // editorial: crea una sola ficha, sus 26 relaciones profesionales
  // explícitas (no autorías) y la evidencia de su fuente original.
  ["20260829_0015_publish_chambers_latin_america_2027_recognition.mjs", {
    allowedCountChanges: new Set(["news", "news_team_members", "news_external_links"]),
  }],
  // Sustituye únicamente la ruta de imagen de 131 perfiles aprobados. La
  // migración verifica nombre, categoría, checksum del PNG y ruta anterior;
  // no altera contenido, orden, rol ni visibilidad.
  ["20260829_0016_refresh_attorney_white_background_photos.mjs", {
    allowedCountChanges: new Set(),
  }],
  // Ajuste tipográfico puntual solicitado para la cabecera administrable de
  // Carrera. Sólo modifica el valor español heredado cuando coincide de forma
  // exacta; nunca sustituye una edición diferente del panel.
  ["20260831_0001_unaccent_careers_page_title.mjs", {
    allowedCountChanges: new Set(),
  }],
  // Completa exclusivamente el extracto editorial omitido en la importación
  // CMDN. La migración protege toda edición posterior de Administración.
  ["20260907_0001_add_property_theft_article_excerpt.mjs", {
    allowedCountChanges: new Set(),
  }],
  // Inicializa exclusivamente los años aprobados de Socio. La migración
  // bloquea cada perfil y se detiene ante cualquier edición posterior desde
  // Administración; no agrega ni elimina registros.
  ["20260907_0003_backfill_partner_since_years.mjs", {
    allowedCountChanges: new Set(),
  }],
  // Normaliza exclusivamente la etiqueta editorial histórica del enlace de
  // Talento en ambos presets del menú. No crea, elimina ni reordena destinos
  // y conserva cualquier etiqueta personalizada desde Administración.
  ["20260907_0004_navigation_talent_landing_label.mjs", {
    allowedCountChanges: new Set(),
  }],
  // Corrige el destino del copy de Talento después de una interpretación
  // inicial errónea: sólo intercambia etiquetas heredadas exactas y no altera
  // ningún contenido, ruta, visibilidad ni edición posterior del panel.
  ["20260907_0005_correct_talent_culture_navigation_label.mjs", {
    allowedCountChanges: new Set(),
  }],
  // Cambia únicamente la ruta de la fotografía de Bernardo Zatarain y añade
  // una versión de caché. Se detiene ante una edición distinta del panel.
  ["20260910_0001_refresh_bernardo_zatarain_photo.mjs", {
    allowedCountChanges: new Set(),
  }],
  // Retira de Diversidad únicamente las rutas heredadas del recorrido de
  // Nuevas oficinas; conserva videos o miniaturas personalizados del panel.
  ["20260910_0002_remove_new_offices_videos_from_diversity.mjs", {
    allowedCountChanges: new Set(),
  }],
  // Restablece únicamente el carrusel original de Diversidad después de la
  // separación de los videos de Nuevas oficinas, sin borrar personalizaciones.
  ["20260910_0003_restore_diversity_carousel.mjs", {
    allowedCountChanges: new Set(),
  }],
  // Reubica el carrusel restaurado dentro del espejo, para que no dependa
  // de rutas de la plataforma anterior ni de su disponibilidad.
  ["20260910_0004_localize_diversity_videos.mjs", {
    allowedCountChanges: new Set(),
  }],
]);

// Algunos entornos de publicación se crearon sin una publicación histórica
// concreta. La corrección editorial sigue siendo estricta cuando existe su
// objetivo, pero una ausencia total no debe bloquear todas las migraciones ni
// crear una relación inferida. El registro se marca aplicado como no aplicable
// únicamente después de comprobar que no hay ninguna fila con ese legacy id.
const dataMigrationNotApplicableWhenTargetIsAbsent = new Map([
  ["20260828_0007_correct_news_1911_author_relations.mjs", {
    table: "news",
    legacyId: "1911",
  }],
]);

function quoteIdentifier(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function stripSqlComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\n]*/g, " ");
}

function assertStrictAdditiveMigration(name, source) {
  if (!name.endsWith(".sql")) {
    if (!verifiedDataMigrationPolicies.has(name)) {
      throw new Error(`Strict remediation migration must be SQL: ${name}`);
    }
    return;
  }
  const statements = stripSqlComments(source)
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
  if (!statements.length) throw new Error(`Empty strict remediation migration: ${name}`);
  for (const statement of statements) {
    const additive = /^(?:CREATE\s+(?:UNIQUE\s+)?INDEX|CREATE\s+TABLE|ALTER\s+TABLE\s+[a-z0-9_".]+\s+ADD\s+COLUMN)\b/i.test(statement);
    if (!additive) throw new Error(`Non-additive statement blocked in ${name}`);
  }
}

async function getPublicTableCounts() {
  const tables = await client.query(`
    SELECT c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p')
      AND c.relname <> 'app_schema_migrations'
    ORDER BY c.relname
  `);
  const counts = {};
  for (const { table_name: tableName } of tables.rows) {
    const result = await client.query(
      `SELECT count(*)::bigint::text AS count FROM ${quoteIdentifier(tableName)}`,
    );
    counts[tableName] = result.rows[0]?.count ?? "0";
  }
  return counts;
}

async function getSchemaManifestDigest() {
  const result = await client.query(`
    SELECT table_name, column_name, data_type, is_nullable, ordinal_position
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `);
  return crypto.createHash("sha256").update(JSON.stringify(result.rows)).digest("hex");
}

function assertProtectedCountsUnchanged(name, before, after, allowedCountChanges = new Set()) {
  const changed = Object.entries(before).filter(([tableName, count]) =>
    after[tableName] !== count && !allowedCountChanges.has(tableName),
  );
  if (changed.length) {
    const tableNames = changed.map(([tableName]) => tableName).join(",");
    throw new Error(`Protected table counts changed in ${name}: ${tableNames}`);
  }
}

function assertStrictSchemaUnchanged(name, before, after) {
  if (before !== after) throw new Error(`Schema manifest changed in strict data migration: ${name}`);
}

async function isPlatformSchemaMigrationAlreadyApplied(name) {
  const expected = platformSchemaReconciliations.get(name);
  if (!expected) return false;
  const result = await client.query(
    `SELECT data_type
       FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
    [expected.table, expected.column],
  );
  return result.rowCount === 1 && result.rows[0].data_type === expected.dataType;
}

async function isDataMigrationNotApplicable(name) {
  const expected = dataMigrationNotApplicableWhenTargetIsAbsent.get(name);
  if (!expected) return false;
  const result = await client.query(
    `SELECT id FROM ${quoteIdentifier(expected.table)} WHERE legacy_id = $1 LIMIT 2`,
    [expected.legacyId],
  );
  if (result.rowCount !== 0) return false;
  console.log(`[migrations] reconciled not-applicable data migration ${name}: legacyId ${expected.legacyId} is absent`);
  return true;
}

await client.connect();
try {
  await client.query("SELECT pg_advisory_lock($1)", [2026072301]);
  await client.query(`
    CREATE TABLE IF NOT EXISTS app_schema_migrations (
      name text PRIMARY KEY,
      sha256 text NOT NULL,
      applied_at timestamp NOT NULL DEFAULT now()
    )
  `);
  const names = (await fs.readdir(migrationsDir))
    .filter((name) => /^\d+_[a-z0-9_]+\.(?:sql|mjs)$/i.test(name))
    .sort();

  for (const name of names) {
    const sourcePath = path.join(migrationsDir, name);
    const source = await fs.readFile(sourcePath, "utf8");
    const sha256 = crypto.createHash("sha256").update(source).digest("hex");
    const existing = await client.query(
      "SELECT sha256 FROM app_schema_migrations WHERE name = $1",
      [name],
    );
    if (existing.rowCount) {
      if (existing.rows[0].sha256 !== sha256) {
        throw new Error(`Applied migration was modified: ${name}`);
      }
      continue;
    }

    await client.query("BEGIN");
    try {
      const strictAdditive = name >= strictAdditiveStart;
      if (strictAdditive) assertStrictAdditiveMigration(name, source);
      const dataMigrationPolicy = verifiedDataMigrationPolicies.get(name);
      const countsBefore = strictAdditive ? await getPublicTableCounts() : null;
      const schemaBefore = strictAdditive ? await getSchemaManifestDigest() : null;
      if (countsBefore) {
        console.log(`[migrations] protected-counts before ${name}: ${JSON.stringify(countsBefore)}`);
        console.log(`[migrations] schema-manifest before ${name}: ${schemaBefore}`);
      }
      if (name.endsWith(".sql")) {
        if (await isPlatformSchemaMigrationAlreadyApplied(name)) {
          console.log(`[migrations] reconciled platform-applied schema migration ${name}`);
        } else {
          await client.query(source);
        }
      } else if (await isDataMigrationNotApplicable(name)) {
        // La ausencia se comprobó con una consulta acotada y no se modifica
        // contenido. El registro de migración evita que cada despliegue vuelva
        // a detenerse por una corrección sin objetivo en este entorno.
      } else {
        const module = await import(`${pathToFileURL(sourcePath).href}?sha256=${sha256}`);
        if (typeof module.default !== "function") {
          throw new Error(`Data migration must have a default function: ${name}`);
        }
        // Every data migration receives a serialized facade over this single
        // pg connection. This makes historical Promise.all reads compatible
        // with pg 9 without altering already-applied migration files.
        await runMigrationWithRedactedLegacyWarnings(
          name,
          module.default,
          serializeMigrationClientQueries(client),
        );
      }
      if (countsBefore) {
        const countsAfter = await getPublicTableCounts();
        assertProtectedCountsUnchanged(name, countsBefore, countsAfter, dataMigrationPolicy?.allowedCountChanges);
        console.log(`[migrations] protected-counts after ${name}: ${JSON.stringify(countsAfter)}`);
        const schemaAfter = await getSchemaManifestDigest();
        if (dataMigrationPolicy) assertStrictSchemaUnchanged(name, schemaBefore, schemaAfter);
        console.log(`[migrations] schema-manifest after ${name}: ${schemaAfter}`);
      }
      await client.query(
        "INSERT INTO app_schema_migrations (name, sha256) VALUES ($1, $2)",
        [name, sha256],
      );
      await client.query("COMMIT");
      console.log(`[migrations] applied ${name}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
} finally {
  await client.query("SELECT pg_advisory_unlock($1)", [2026072301]).catch(() => undefined);
  await client.end();
}
