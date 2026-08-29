#!/usr/bin/env node
/**
 * Reconciliación conservadora de cobertura de Noticias contra el archivo
 * oficial descargado en ../mirror. Usa exclusivamente los p_id y las fichas
 * oficiales inventariadas por la auditoría de fechas de 2026-08-28.
 *
 * - Sin --apply sólo genera evidencia: nunca toca la base de datos.
 * - Con --apply inserta únicamente fichas oficiales faltantes cuya versión
 *   bilingüe sea verificable desde la propia ficha oficial.
 * - Antes de asignar legacy_id a una fila local sin ID exige título exacto y
 *   evidencia textual. Los casos ambiguos permanecen intactos.
 * - No borra ni despublica registros históricos locales.
 *
 * Uso:
 *   node scripts/reconcile-news-coverage-2026.mjs
 *   CONFIRM_NEWS_COVERAGE_RECONCILIATION=1 node scripts/reconcile-news-coverage-2026.mjs --apply
 */
import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import { createSqlClient } from "./lib/postgres-sql.mjs";
import { newsSourceOnlyTranslations2026 } from "./data/news-source-only-translations-2026.mjs";
import { officialNewsMissingByPid20260828 } from "./data/official-news-missing-by-pid-2026-08-28.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const argValue = (name, fallback) => {
  const prefix = `--${name}=`;
  const found = args.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
};
const APPLY = args.includes("--apply");
const SNAPSHOT = path.resolve(ROOT, argValue("snapshot", "output/audits/noticias-fechas-2026-08-28/VWYS_Auditoria_Fechas_Noticias_2026-08-28.snapshot.json"));
const MIRROR = path.resolve(ROOT, argValue("mirror", "../mirror"));
const OUTPUT = path.resolve(ROOT, argValue("output", "output/audits/noticias-cobertura-2026-08-28"));
const OFFICIAL_ORIGIN = "https://www.vonwobeser.com";
const SOURCE_CACHE = path.join(OUTPUT, ".source-cache");

if (APPLY && process.env.CONFIRM_NEWS_COVERAGE_RECONCILIATION !== "1") {
  throw new Error("Para escribir use CONFIRM_NEWS_COVERAGE_RECONCILIATION=1 junto con --apply.");
}

const cleanSpace = (value) => String(value ?? "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
const stripDiacritics = (value) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const normalize = (value) => stripDiacritics(cleanSpace(value)).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const slugify = (value) => normalize(value).replace(/\s+/g, "-").slice(0, 96).replace(/-+$/g, "");
const csvCell = (value) => {
  const text = Array.isArray(value) ? value.join(" | ") : value == null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};
const toCsv = (rows, headers) => `${headers.join(",")}\n${rows.map((row) => headers.map((header) => csvCell(row[header])).join(",")).join("\n")}\n`;
const officialUrl = (language, legacyId) => `${OFFICIAL_ORIGIN}/index.php/${language === "es" ? "publicacion" : "publication"}?p_id=${encodeURIComponent(legacyId)}`;

function sourceFile(language, legacyId) {
  return path.join(MIRROR, "index.php", language === "es" ? "publicacion" : "publication", `p_id-${legacyId}.html`);
}

function sourceLanguageFromUrl(value) {
  return /\/publicacion(?:\?|\/)/i.test(String(value)) ? "es" : /\/publication(?:\?|\/)/i.test(String(value)) ? "en" : null;
}

function sourceLegacyIdFromUrl(value) {
  const match = String(value ?? "").match(/[?&]p_id=(\d+)|p_id-(\d+)/i);
  return match?.[1] ?? match?.[2] ?? "";
}

async function sourceHtml(language, legacyId) {
  const file = sourceFile(language, legacyId);
  if (fs.existsSync(file)) return { html: await fsp.readFile(file, "utf8"), provenance: path.relative(ROOT, file) };
  const cacheFile = path.join(SOURCE_CACHE, `${language}-${legacyId}.html`);
  try {
    return { html: await fsp.readFile(cacheFile, "utf8"), provenance: path.relative(ROOT, cacheFile) };
  } catch {
    // Continúa a la ficha oficial. La descarga se conserva en caché para que una
    // reejecución sea reproducible y no repita solicitudes innecesarias.
  }
  let lastError = "";
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45_000);
    try {
      const response = await fetch(officialUrl(language, legacyId), {
        headers: { "user-agent": "VWYS-News-Coverage-Reconciliation/1.0", accept: "text/html,application/xhtml+xml" },
        redirect: "follow",
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const html = await response.text();
      await fsp.mkdir(SOURCE_CACHE, { recursive: true });
      await fsp.writeFile(cacheFile, html);
      return { html, provenance: `${officialUrl(language, legacyId)} (capturada en caché)` };
    } catch (error) {
      clearTimeout(timer);
      lastError = String(error?.message ?? error);
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }
  return { html: "", provenance: `inaccesible: ${lastError}` };
}

async function sourceDetails(language, legacyId) {
  const fetched = await sourceHtml(language, legacyId);
  const html = fetched.html;
  if (!html) return null;
  const $ = cheerio.load(html);
  const title = cleanSpace($(".single__meta--name").first().text());
  const excerpt = cleanSpace($(".single__content--intro").first().text());
  const content = cleanSpace($(".single__content--txt").map((_, node) => $(node).text()).get().join(" "));
  const counterpartHref = $(".header__lang--item").map((_, node) => $(node).attr("href") ?? "").get()
    .find((href) => /\/publicacion|\/publication/i.test(href)) ?? "";
  const counterpartLanguage = sourceLanguageFromUrl(counterpartHref);
  const counterpartLegacyId = sourceLegacyIdFromUrl(counterpartHref);
  const pdfHref = $("a.page--btn.download, a[href$='.pdf']").first().attr("href") ?? "";
  const pdfUrl = pdfHref ? new URL(pdfHref, officialUrl(language, legacyId)).toString() : "";
  if (!title || (!excerpt && !content)) return null;
  return {
    language,
    legacyId: String(legacyId),
    file: fetched.provenance,
    sourceUrl: officialUrl(language, legacyId),
    title,
    excerpt: excerpt || content.slice(0, 500),
    content,
    counterpartLanguage,
    counterpartLegacyId,
    pdfUrl,
    contentSha256: sha256(normalize(`${title} ${excerpt} ${content}`)),
  };
}

function tokenSimilarity(left, right) {
  const a = new Set(normalize(left).split(" ").filter((token) => token.length >= 4));
  const b = new Set(normalize(right).split(" ").filter((token) => token.length >= 4));
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return shared / (a.size + b.size - shared);
}

function sourceTextSimilarity(source, row) {
  const local = source.language === "es"
    ? `${row.title_es ?? ""} ${row.excerpt_es ?? ""} ${row.content_es ?? ""}`
    : `${row.title ?? ""} ${row.excerpt ?? ""} ${row.content ?? ""}`;
  const official = `${source.title} ${source.excerpt} ${source.content}`;
  const excerptExact = normalize(source.excerpt).length > 32 && normalize(local).includes(normalize(source.excerpt));
  const contentExact = normalize(source.content).length > 64 && normalize(local).includes(normalize(source.content));
  return { score: tokenSimilarity(official, local), excerptExact, contentExact };
}

function titleExactForSource(source, row) {
  const localTitle = source.language === "es" ? row.title_es : row.title;
  return Boolean(normalize(source.title) && normalize(source.title) === normalize(localTitle));
}

function isVerifiedExistingMatch(source, row) {
  const titleExact = titleExactForSource(source, row);
  const body = sourceTextSimilarity(source, row);
  const storedSourceId = sourceLegacyIdFromUrl(row.source_url);
  const directSource = storedSourceId === source.legacyId;
  const verified = (titleExact && (body.excerptExact || body.contentExact || body.score >= 0.56)) || (directSource && titleExact && body.score >= 0.2);
  return { verified, titleExact, directSource, ...body };
}

function dbDate(month) {
  if (!/^\d{4}-\d{2}$/.test(month)) return null;
  return `${month}-01T00:00:00.000Z`;
}

async function detailsWithCounterpart(source) {
  const counterpart = source.counterpartLanguage && source.counterpartLegacyId
    ? await sourceDetails(source.counterpartLanguage, source.counterpartLegacyId)
    : null;
  const es = source.language === "es" ? source : counterpart?.language === "es" ? counterpart : null;
  const en = source.language === "en" ? source : counterpart?.language === "en" ? counterpart : null;
  return { es, en, counterpart };
}

async function insertPayload(source, official) {
  const { es, en } = await detailsWithCounterpart(source);
  // El CMS requiere campos en ambos idiomas. Cuando el archivo oficial sólo
  // conserva una versión, se guarda como borrador para no perder la fuente,
  // pero jamás se publica mezclando el idioma original en la versión opuesta.
  const sourceOnly = es || en;
  if (!sourceOnly) return { payload: null, reason: "official_detail_without_usable_content" };
  const officialMonth = official.officialDateNormalized;
  const slug = `${slugify((en || es).title || `news-${source.legacyId}`)}-${source.legacyId}`.slice(0, 128);
  if (!es || !en) {
    const translation = newsSourceOnlyTranslations2026[source.legacyId];
    if (!translation) return { payload: null, reason: "missing_editorial_translation_for_source_only_record" };
    return {
      payload: {
        legacyId: source.legacyId,
        slug,
        title: translation.title,
        titleEs: sourceOnly.title,
        excerpt: translation.excerpt,
        excerptEs: sourceOnly.excerpt,
        content: translation.content,
        contentEs: sourceOnly.content || sourceOnly.excerpt,
        sourceUrl: source.sourceUrl,
        date: dbDate(officialMonth),
        category: "news",
        categoryEs: "Noticias",
        published: true,
      },
      reason: "official_source_only_translated_and_verified",
    };
  }
  return {
    payload: {
      legacyId: source.legacyId,
      slug,
      title: en.title,
      titleEs: es.title,
      excerpt: en.excerpt,
      excerptEs: es.excerpt,
      content: en.content || en.excerpt,
      contentEs: es.content || es.excerpt,
      sourceUrl: source.sourceUrl,
      date: dbDate(officialMonth),
      category: "news",
      categoryEs: "Noticias",
      published: true,
    },
    reason: "official_missing_verified_bilingual",
  };
}

async function mapConcurrent(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, Math.max(1, items.length)) }, async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  }));
  return results;
}

async function main() {
  const hasAuditSnapshot = fs.existsSync(SNAPSHOT);
  const snapshot = hasAuditSnapshot
    ? JSON.parse(await fsp.readFile(SNAPSHOT, "utf8"))
    : { rows: officialNewsMissingByPid20260828, projectOnly: [] };
  const officialMissing = snapshot.rows.filter((row) => !hasAuditSnapshot || row.comparison === "project_missing");
  // El inventario versionado contiene sólo los p_id que faltaban. Cuando no
  // está disponible el CSV local completo, los únicos candidatos seguros para
  // asignar un p_id son las filas sin p_id, nunca un registro histórico ajeno.
  const projectOnlyIds = new Set((snapshot.projectOnly ?? []).map((row) => row.id));
  const officialLegacyIds = new Set(snapshot.rows.map((row) => String(row.legacyId ?? "")).filter(Boolean));
  const sql = createSqlClient(process.env.DATABASE_URL);
  try {
    const projectRows = await sql`
      select id, legacy_id, slug, title, title_es, excerpt, excerpt_es, content, content_es, source_url, date, category, published
      from news
      where lower(coalesce(category, '')) <> 'articles'
    `;
    const projectOnly = hasAuditSnapshot
      ? projectRows.filter((row) => {
        const legacyId = String(row.legacy_id ?? "").trim();
        return !legacyId || !officialLegacyIds.has(legacyId);
      })
      : projectOnlyIds.size
        ? projectRows.filter((row) => projectOnlyIds.has(row.id))
        : projectRows.filter((row) => !String(row.legacy_id ?? "").trim());
    const projectOnlyRecords = projectOnly.map((row) => ({
      id: row.id,
      legacyId: row.legacy_id || "",
      slug: row.slug,
      category: row.category || "",
      titleEs: row.title_es || "",
      title: row.title || "",
      date: row.date ? new Date(row.date).toISOString().slice(0, 10) : "",
      reason: row.legacy_id ? "legacy_id_not_in_official_news" : "without_legacy_id",
    }));
    const projectByLegacyId = new Map();
    for (const row of projectRows) {
      const legacyId = String(row.legacy_id ?? "").trim();
      if (!legacyId) continue;
      projectByLegacyId.set(legacyId, [...(projectByLegacyId.get(legacyId) ?? []), row]);
    }

    const usedSlugs = new Set(projectRows.map((row) => row.slug));
    const sourceDetailsByKey = new Map(await mapConcurrent(officialMissing, 6, async (official) => [
      official.sourceKey,
      await sourceDetails(official.language, official.legacyId),
    ]));
    const evidence = [];
    const updateCandidates = [];
    const inserts = [];
    for (const official of officialMissing) {
      const source = sourceDetailsByKey.get(official.sourceKey);
      if (!source) {
        evidence.push({ ...official, action: "manual_review", reason: "official_mirror_detail_missing", sourceFile: "" });
        continue;
      }
      const preexisting = projectByLegacyId.get(source.legacyId) ?? [];
      if (preexisting.length) {
        const verifiedExisting = preexisting
          .map((row) => ({ row, match: isVerifiedExistingMatch(source, row) }))
          .filter(({ match }) => match.verified);
        if (verifiedExisting.length === 1) {
          const { row, match } = verifiedExisting[0];
          evidence.push({
            ...official,
            action: "already_reconciled",
            reason: "verified_official_legacy_id_already_present",
            sourceFile: source.file,
            candidateId: row.id,
            candidateSlug: row.slug,
            titleExact: match.titleExact,
            textSimilarity: match.score.toFixed(4),
            exactExcerpt: match.excerptExact,
            exactContent: match.contentExact,
          });
        } else {
          evidence.push({ ...official, action: "manual_review", reason: "legacy_id_appeared_after_audit_without_sufficient_source_evidence", sourceFile: source.file });
        }
        continue;
      }
      const sourcePair = await detailsWithCounterpart(source);
      const counterpartRows = sourcePair.counterpart?.legacyId
        ? projectByLegacyId.get(sourcePair.counterpart.legacyId) ?? []
        : [];
      const verifiedCounterparts = counterpartRows
        .map((row) => ({ row, match: isVerifiedExistingMatch(sourcePair.counterpart, row) }))
        .filter(({ match }) => match.verified);
      if (verifiedCounterparts.length === 1) {
        const { row, match } = verifiedCounterparts[0];
        evidence.push({
          ...official,
          action: "covered_by_verified_bilingual_counterpart",
          reason: "official_language_counterpart_already_present",
          sourceFile: source.file,
          counterpartLegacyId: sourcePair.counterpart.legacyId,
          candidateId: row.id,
          candidateSlug: row.slug,
          titleExact: match.titleExact,
          textSimilarity: match.score.toFixed(4),
          exactExcerpt: match.excerptExact,
          exactContent: match.contentExact,
        });
        continue;
      }
      const candidates = projectOnly.map((row) => ({ row, match: isVerifiedExistingMatch(source, row) }))
        .filter(({ match }) => match.titleExact || match.directSource)
        .sort((left, right) => Number(right.match.verified) - Number(left.match.verified) || right.match.score - left.match.score);
      const verified = candidates.filter(({ match }) => match.verified);
      if (verified.length === 1) {
        const { row, match } = verified[0];
        const alreadyAssigned = updateCandidates.find((candidate) => candidate.row.id === row.id);
        if (alreadyAssigned) {
          // Las fichas oficiales ES/EN pueden usar p_id distintos para la misma
          // publicación. news sólo tiene un legacy_id, por lo que el segundo ID
          // queda documentado como alias de la misma fila, sin sobrescribir el
          // identificador principal ya verificado.
          evidence.push({
            ...official,
            action: "covered_by_same_local_bilingual_record",
            reason: "verified_counterpart_of_existing_assignment",
            sourceFile: source.file,
            candidateId: row.id,
            candidateSlug: row.slug,
            primaryLegacyId: alreadyAssigned.source.legacyId,
            titleExact: match.titleExact,
            textSimilarity: match.score.toFixed(4),
            exactExcerpt: match.excerptExact,
            exactContent: match.contentExact,
          });
          continue;
        }
        updateCandidates.push({ source, official, row, match });
        evidence.push({
          ...official,
          action: "assign_existing_legacy_id",
          reason: "exact_title_and_source_text",
          sourceFile: source.file,
          candidateId: row.id,
          candidateSlug: row.slug,
          titleExact: match.titleExact,
          textSimilarity: match.score.toFixed(4),
          exactExcerpt: match.excerptExact,
          exactContent: match.contentExact,
        });
        continue;
      }
      if (verified.length > 1 || candidates.length > 1) {
        evidence.push({
          ...official,
          action: "manual_review",
          reason: verified.length > 1 ? "multiple_verified_local_candidates" : "title_candidate_without_sufficient_text_evidence",
          sourceFile: source.file,
          candidateId: candidates.map(({ row }) => row.id),
          candidateSlug: candidates.map(({ row }) => row.slug),
          textSimilarity: candidates.map(({ match }) => match.score.toFixed(4)),
        });
        continue;
      }
      const result = await insertPayload(source, official);
      if (!result.payload) {
        evidence.push({ ...official, action: "manual_review", reason: result.reason, sourceFile: source.file });
        continue;
      }
      let slug = result.payload.slug;
      if (usedSlugs.has(slug)) slug = `${slug.slice(0, 116)}-${source.legacyId}`;
      if (usedSlugs.has(slug)) {
        evidence.push({ ...official, action: "manual_review", reason: "slug_collision", sourceFile: source.file, candidateSlug: slug });
        continue;
      }
      usedSlugs.add(slug);
      inserts.push({ source, official, payload: { ...result.payload, slug } });
      evidence.push({
        ...official,
        action: result.payload.published ? "insert_official_news" : "stage_official_source_only_draft",
        reason: result.reason,
        sourceFile: source.file,
        counterpartLegacyId: source.counterpartLegacyId,
        sourceContentSha256: source.contentSha256,
      });
    }

    const classifiedProjectOnly = projectOnlyRecords.map((row) => {
      const linked = updateCandidates.find((candidate) => candidate.row.id === row.id);
      if (linked) return { ...row, disposition: "legacy_id_assigned_from_verified_official_source", officialLegacyId: linked.source.legacyId };
      if (row.legacyId) return { ...row, disposition: "retain_historical_record_not_in_current_official_archive", officialLegacyId: "" };
      return { ...row, disposition: "retain_unlinked_local_record_pending_source_review", officialLegacyId: "" };
    });

    const manifest = {
      generatedAt: new Date().toISOString(),
      snapshot: hasAuditSnapshot ? path.relative(ROOT, SNAPSHOT) : "scripts/data/official-news-missing-by-pid-2026-08-28.mjs",
      mirror: path.relative(ROOT, MIRROR),
      mode: APPLY ? "applied" : "dry-run",
      rules: {
        sourceIdentity: "exact p_id from official date audit",
        candidateAssignment: "exact source-language title plus exact excerpt/body or token similarity >= 0.56",
        deletion: "none",
        publication: "official ES/EN counterparts, or a reviewed English translation when the official archive retains Spanish only",
      },
      totals: {
        officialRowsMissingByPId: officialMissing.length,
        verifiedExistingAssignments: updateCandidates.length,
        officialInsertions: inserts.length,
        officialPublicInsertions: inserts.filter(({ payload }) => payload.published).length,
        officialSourceOnlyDrafts: inserts.filter(({ payload }) => !payload.published).length,
        manualReview: evidence.filter((row) => row.action === "manual_review").length,
        retainedProjectOnly: classifiedProjectOnly.filter((row) => !row.disposition.startsWith("legacy_id_assigned")).length,
      },
      evidence,
      classifiedProjectOnly,
      inserts: inserts.map(({ source, official, payload }) => ({
        officialLegacyId: official.legacyId,
        officialLanguage: official.language,
        officialDateRaw: official.officialDateRaw,
        officialDateNormalized: official.officialDateNormalized,
        officialDatePrecision: official.officialDatePrecision,
        sourceUrl: source.sourceUrl,
        sourceContentSha256: source.contentSha256,
        counterpartLegacyId: source.counterpartLegacyId,
        payload,
      })),
    };

    await fsp.mkdir(OUTPUT, { recursive: true });
    await fsp.writeFile(path.join(OUTPUT, "VWYS_Reconciliacion_Cobertura_Noticias_2026-08-28.manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
    await fsp.writeFile(path.join(OUTPUT, "VWYS_Reconciliacion_Cobertura_Noticias_2026-08-28.evidencia.csv"), toCsv(evidence, [
      "sourceKey", "language", "legacyId", "titleOfficial", "officialUrl", "officialDateRaw", "officialDateNormalized", "officialDatePrecision", "action", "reason", "sourceFile", "counterpartLegacyId", "candidateId", "candidateSlug", "titleExact", "textSimilarity", "exactExcerpt", "exactContent", "sourceContentSha256",
    ]));
    await fsp.writeFile(path.join(OUTPUT, "VWYS_Reconciliacion_Cobertura_Noticias_2026-08-28.registros-locales.csv"), toCsv(classifiedProjectOnly, [
      "id", "legacyId", "slug", "category", "titleEs", "title", "date", "reason", "disposition", "officialLegacyId",
    ]));

    if (APPLY) {
      const client = await sql.pool.connect();
      try {
        await client.query("BEGIN");
        for (const assignment of updateCandidates) {
          const updated = await client.query(
            "update news set legacy_id = $1, source_url = coalesce(source_url, $2), date = $3 where id = $4 and (legacy_id is null or legacy_id = '') returning id",
            [assignment.source.legacyId, assignment.source.sourceUrl, dbDate(assignment.official.officialDateNormalized), assignment.row.id],
          );
          if (updated.rowCount !== 1) throw new Error(`No se pudo asignar legacy_id ${assignment.source.legacyId} a ${assignment.row.slug}.`);
        }
        for (const { payload } of inserts) {
          const inserted = await client.query(
            `insert into news (title, title_es, excerpt, excerpt_es, content, content_es, source_url, slug, date, published, category, category_es, legacy_id)
             values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
             on conflict (slug) do nothing
             returning id`,
            [payload.title, payload.titleEs, payload.excerpt, payload.excerptEs, payload.content, payload.contentEs, payload.sourceUrl, payload.slug, payload.date, payload.published, payload.category, payload.categoryEs, payload.legacyId],
          );
          if (inserted.rowCount !== 1) throw new Error(`No se pudo insertar el p_id ${payload.legacyId}; se revirtió toda la transacción.`);
        }
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    }
    console.log(JSON.stringify(manifest.totals, null, 2));
    console.log(`[reconcile] Evidencia: ${OUTPUT}`);
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(`[reconcile] ERROR: ${error.stack || error.message}`);
  process.exitCode = 1;
});
