import "dotenv/config";
import pg from "pg";
import { ARTICLE_SUMMARY_CURATION_20260826 } from "@shared/articleSummaryCuration2026";
import { getPostgresConnectionConfig } from "@shared/postgres-config.mjs";
import { isLegacyFirmPublicationUrl } from "../server/newsPublicationPolicy";

const shouldApply = process.argv.includes("--apply");
if (shouldApply && process.env.CONFIRM_ARTICLE_SUMMARY_CURATION !== "1") {
  throw new Error("Set CONFIRM_ARTICLE_SUMMARY_CURATION=1 to apply the approved Article curation.");
}

const databaseUrl = process.env.DATABASE_APP_URL || process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_APP_URL or DATABASE_URL is required");

type NewsRow = {
  slug: string;
  category: string | null;
  title: string;
  title_es: string;
  excerpt: string;
  excerpt_es: string;
  source_url: string | null;
};

function plainText(value: string | null | undefined): string {
  return String(value ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
}

function normalize(value: string | null | undefined): string {
  return plainText(value)
    .toLocaleLowerCase("es-MX")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function isPlaceholder(value: string, title: string): boolean {
  const text = plainText(value);
  return !text
    || /^https?:\/\//i.test(text)
    || /^(?:introducci[oó]n|introduction|pdf)$/i.test(text)
    || normalize(text) === normalize(title);
}

function isHttpsSource(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

const client = new pg.Client({ ...getPostgresConnectionConfig(databaseUrl) });
await client.connect();
try {
  await client.query("BEGIN");
  await client.query("LOCK TABLE news IN SHARE ROW EXCLUSIVE MODE");
  const slugs = ARTICLE_SUMMARY_CURATION_20260826.map((entry) => entry.slug);
  const result = await client.query<NewsRow>(
    `SELECT slug, category, title, title_es, excerpt, excerpt_es, source_url
       FROM news
      WHERE slug = ANY($1)
      FOR UPDATE`,
    [slugs],
  );
  const rows = new Map(result.rows.map((row) => [row.slug, row]));
  const missing = slugs.filter((slug) => !rows.has(slug));
  const nonArticles = result.rows.filter((row) => row.category !== "articles").map((row) => row.slug);
  if (missing.length || nonArticles.length || result.rows.length !== ARTICLE_SUMMARY_CURATION_20260826.length) {
    throw new Error([
      `Expected ${ARTICLE_SUMMARY_CURATION_20260826.length} Articles, found ${result.rows.length}.`,
      missing.length ? `Missing: ${missing.join(", ")}.` : "",
      nonArticles.length ? `Not Articles: ${nonArticles.join(", ")}.` : "",
    ].filter(Boolean).join(" "));
  }

  let pending = 0;
  let changed = 0;
  let summaries = 0;
  let sourceOnly = 0;
  for (const entry of ARTICLE_SUMMARY_CURATION_20260826) {
    if (!isHttpsSource(entry.sourceUrl)) throw new Error(`Invalid source URL for ${entry.slug}`);
    const row = rows.get(entry.slug)!;
    const hasPlaceholderExcerpts = isPlaceholder(row.excerpt, row.title) && isPlaceholder(row.excerpt_es, row.title_es);
    const hasTarget = row.excerpt === entry.excerpt
      && row.excerpt_es === entry.excerptEs
      && row.source_url === entry.sourceUrl;
    if (!hasTarget) pending += 1;
    if (entry.excerpt || entry.excerptEs) summaries += 1;
    else sourceOnly += 1;
    if (!shouldApply || hasTarget) continue;

    // No se pisan correcciones editoriales posteriores: sólo reemplazamos los placeholders
    // detectados; la fuente faltante sí se puede completar de forma independiente.
    const update: { sourceUrl?: string | null; sourceUrlChanged?: boolean; excerpt?: string; excerptEs?: string } = {};
    // Sólo se reemplazan URLs que esta curación reconoce expresamente como un
    // apuntador histórico; nunca se pisa una fuente corregida posteriormente.
    if (entry.sourceUrl === null && isLegacyFirmPublicationUrl(row.source_url)) {
      update.sourceUrl = null;
      update.sourceUrlChanged = true;
    } else if (entry.sourceUrl && (!row.source_url || entry.replaceableSourceUrls?.includes(row.source_url))) {
      update.sourceUrl = entry.sourceUrl;
      update.sourceUrlChanged = true;
    }
    if (hasPlaceholderExcerpts) {
      update.excerpt = entry.excerpt;
      update.excerptEs = entry.excerptEs;
    }
    if (!Object.keys(update).length) continue;
    await client.query(
      `UPDATE news
          SET source_url = CASE WHEN $1 THEN $2 ELSE source_url END,
              excerpt = COALESCE($3, excerpt),
              excerpt_es = COALESCE($4, excerpt_es)
        WHERE slug = $5 AND category = 'articles'`,
      [Boolean(update.sourceUrlChanged), update.sourceUrl ?? null, update.excerpt ?? null, update.excerptEs ?? null, entry.slug],
    );
    changed += 1;
  }

  if (!shouldApply) {
    await client.query("ROLLBACK");
    console.log(JSON.stringify({ mode: "dry-run", total: ARTICLE_SUMMARY_CURATION_20260826.length, pending, summaries, sourceOnly }, null, 2));
  } else {
    await client.query("COMMIT");
    console.log(JSON.stringify({ mode: "applied", total: ARTICLE_SUMMARY_CURATION_20260826.length, pending, changed, summaries, sourceOnly }, null, 2));
  }
} catch (error) {
  await client.query("ROLLBACK").catch(() => undefined);
  throw error;
} finally {
  await client.end();
}
