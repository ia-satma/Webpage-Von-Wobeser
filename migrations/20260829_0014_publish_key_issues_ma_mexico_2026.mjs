import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Memorándum entregado por el equipo editorial el 29 de agosto de 2026.
 * La fecha visible conserva la precisión mes/año de la portada; el día uno
 * sólo permite ordenar el archivo sin presentarse al público.
 */
export const KEY_ISSUES_MA_MEXICO_2026 = {
  slug: "key-issues-ma-cross-border-transactions-mexico-2026",
  title: "Key Issues in M&A and Cross-Border Transactions in Mexico",
  titleEs: "Aspectos clave en fusiones y adquisiciones y operaciones transfronterizas en México",
  excerpt: "This memorandum examines the key legal and regulatory developments shaping M&A and cross-border transactions in Mexico, including changes to the judiciary and regulatory framework, energy and labor reforms, and the 2026 USMCA review. Drawing on Von Wobeser y Sierra’s multidisciplinary experience, it provides practical guidance for counsel, investors, and advisors navigating transactions with a Mexico nexus.",
  excerptEs: "Este memorándum examina los principales desarrollos legales y regulatorios que configuran las operaciones de fusiones y adquisiciones y transfronterizas en México, incluidos cambios en el Poder Judicial y el marco regulatorio, las reformas energéticas y laborales, y la revisión del T-MEC de 2026. Con base en la experiencia multidisciplinaria de Von Wobeser y Sierra, ofrece orientación práctica para asesores jurídicos, inversionistas y consultores que participan en transacciones con conexión con México.",
  sourceUrl: "https://lnkd.in/gzqr-ZmV",
  pdfPath: "/images/PDF_news/2026/2026-06-Key-Issues-MA-Cross-Border-Transactions-Mexico.pdf",
  pdfSha256: "d9014b99eaab117145113dc1ad5e08579882740789d63d35f4bc38791707b7df",
  pdfSize: 7752716,
  date: "2026-06-01T12:00:00.000Z",
  authors: ["luis-burgueno", "pablo-jimenez"],
};

function expectedFields() {
  const item = KEY_ISSUES_MA_MEXICO_2026;
  return {
    title: item.title,
    title_es: item.titleEs,
    excerpt: item.excerpt,
    excerpt_es: item.excerptEs,
    content: `<p><a href="${item.pdfPath}" target="_blank" rel="noopener noreferrer">Download the memorandum (PDF)</a></p>`,
    content_es: `<p><a href="${item.pdfPath}" target="_blank" rel="noopener noreferrer">Descargar el memorándum (PDF)</a></p>`,
    source_url: item.sourceUrl,
    slug: item.slug,
    date: item.date,
    published: true,
    featured_home: false,
    category: "articles",
    category_es: "Artículos",
    processing_status: "ready",
    last_error: null,
  };
}

function sameExpectedFields(row, expected) {
  return row.title === expected.title
    && row.title_es === expected.title_es
    && row.excerpt === expected.excerpt
    && row.excerpt_es === expected.excerpt_es
    && row.content === expected.content
    && row.content_es === expected.content_es
    && row.source_url === expected.source_url
    && row.slug === expected.slug
    && new Date(row.date).toISOString() === expected.date
    && row.published === expected.published
    && row.featured_home === expected.featured_home
    && row.category === expected.category
    && row.category_es === expected.category_es
    && row.processing_status === expected.processing_status
    && row.last_error === expected.last_error;
}

async function assertBundledPdf() {
  const item = KEY_ISSUES_MA_MEXICO_2026;
  const absolutePath = path.join(process.cwd(), "frontend-mirror", item.pdfPath.replace(/^\//, ""));
  const bytes = await fs.readFile(absolutePath);
  const digest = crypto.createHash("sha256").update(bytes).digest("hex");
  if (
    bytes.length !== item.pdfSize
    || !bytes.subarray(0, 5).equals(Buffer.from("%PDF-"))
    || !bytes.subarray(-2048).includes(Buffer.from("%%EOF"))
    || digest !== item.pdfSha256
  ) {
    throw new Error("The approved Key Issues in M&A PDF is missing or its integrity digest changed");
  }
}

export default async function publishKeyIssuesMaMexico2026(client) {
  await assertBundledPdf();
  const item = KEY_ISSUES_MA_MEXICO_2026;
  const expected = expectedFields();
  const [existing, authors] = await Promise.all([
    client.query(
      `SELECT id, title, title_es, excerpt, excerpt_es, content, content_es, source_url, slug, date,
              published, featured_home, category, category_es, processing_status, last_error
         FROM news
        WHERE slug = $1
        FOR UPDATE`,
      [item.slug],
    ),
    client.query(
      `SELECT id, slug
         FROM team_members
        WHERE slug = ANY($1::text[])`,
      [item.authors],
    ),
  ]);

  if (authors.rowCount !== item.authors.length) {
    const found = new Set(authors.rows.map((row) => row.slug));
    throw new Error(`Missing Key Issues in M&A author profiles: ${item.authors.filter((slug) => !found.has(slug)).join(", ")}`);
  }
  if (existing.rowCount > 1) throw new Error(`Duplicate Key Issues in M&A article slug: ${item.slug}`);
  if (existing.rowCount === 1 && !sameExpectedFields(existing.rows[0], expected)) {
    throw new Error("Refusing to overwrite an Administration edit for Key Issues in M&A and Cross-Border Transactions in Mexico");
  }

  let newsId = existing.rows[0]?.id;
  if (!newsId) {
    const created = await client.query(
      `INSERT INTO news (
         title, title_es, excerpt, excerpt_es, content, content_es, source_url, slug, date,
         published, featured_home, category, category_es, processing_status, last_error
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9,
         $10, $11, $12, $13, $14, $15
       ) RETURNING id, slug`,
      [
        expected.title, expected.title_es, expected.excerpt, expected.excerpt_es,
        expected.content, expected.content_es, expected.source_url, expected.slug, expected.date,
        expected.published, expected.featured_home, expected.category, expected.category_es,
        expected.processing_status, expected.last_error,
      ],
    );
    if (created.rowCount !== 1 || created.rows[0]?.slug !== item.slug) {
      throw new Error("Unable to create Key Issues in M&A article");
    }
    newsId = created.rows[0].id;
  }

  const authorIdBySlug = new Map(authors.rows.map((row) => [row.slug, row.id]));
  for (const authorSlug of item.authors) {
    await client.query(
      `INSERT INTO news_team_members (news_id, team_member_id, verification_status, relationship_role)
       VALUES ($1, $2, 'verified_manual', 'author')
       ON CONFLICT (news_id, team_member_id) DO NOTHING`,
      [newsId, authorIdBySlug.get(authorSlug)],
    );
  }

  for (const link of [
    { kind: "source", url: item.sourceUrl, finalUrl: item.sourceUrl },
    { kind: "content", url: item.pdfPath, finalUrl: item.pdfPath },
  ]) {
    await client.query(
      `INSERT INTO news_external_links (
         news_id, kind, url, normalized_url, status, final_url, failure_code, checked_at, disabled_at
       ) VALUES ($1, $2, $3, $3, 'verified', $4, NULL, now(), NULL)
       ON CONFLICT (news_id, normalized_url, kind) DO UPDATE
         SET url = EXCLUDED.url,
             status = EXCLUDED.status,
             final_url = EXCLUDED.final_url,
             failure_code = NULL,
             checked_at = EXCLUDED.checked_at,
             disabled_at = NULL
       WHERE news_external_links.url IS DISTINCT FROM EXCLUDED.url
          OR news_external_links.status IS DISTINCT FROM EXCLUDED.status
          OR news_external_links.final_url IS DISTINCT FROM EXCLUDED.final_url
          OR news_external_links.failure_code IS NOT NULL`,
      [newsId, link.kind, link.url, link.finalUrl],
    );
  }

  console.log(`[migrations] published ${item.slug} with two verified authors and the approved PDF`);
}
