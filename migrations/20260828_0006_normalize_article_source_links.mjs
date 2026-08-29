export const EXPANSION_SOURCE_URL = "https://expansion.mx/opinion/2022/01/03/negocio-contribuya-cambiar-el-mundo";

export const ARTICLE_SOURCE_LINK_NORMALIZATION = [
  { legacyId: "1699", fields: ["content", "content_es"] },
  { legacyId: "1700", fields: ["content"] },
];

function removeRawSourceUrl(value) {
  return String(value)
    .replaceAll(EXPANSION_SOURCE_URL, "")
    .replace(/[ \t]+(<\/(?:p|li|div|span)>)/gi, "$1")
    .replace(/[ \t]+$/g, "");
}

/**
 * Replaces only the client-verified raw Expansion URL in the two historical
 * Articles. Any unexpected editorial change aborts the transaction instead
 * of overwriting an Administration edit. Re-running after success is a no-op.
 */
export default async function normalizeArticleSourceLinks(client) {
  const legacyIds = ARTICLE_SOURCE_LINK_NORMALIZATION.map((entry) => entry.legacyId);
  const result = await client.query(
    `SELECT id, legacy_id, category, source_url, content, content_es
       FROM news
      WHERE legacy_id = ANY($1::text[])
      FOR UPDATE`,
    [legacyIds],
  );
  if (result.rowCount !== ARTICLE_SOURCE_LINK_NORMALIZATION.length) {
    throw new Error(`Expected ${ARTICLE_SOURCE_LINK_NORMALIZATION.length} Article rows, found ${result.rowCount}`);
  }

  const byLegacyId = new Map(result.rows.map((row) => [String(row.legacy_id), row]));
  let updated = 0;
  for (const entry of ARTICLE_SOURCE_LINK_NORMALIZATION) {
    const row = byLegacyId.get(entry.legacyId);
    if (!row || String(row.category || "").toLowerCase() !== "articles") {
      throw new Error(`Unexpected Article identity for legacyId ${entry.legacyId}`);
    }

    const fieldsContainRawUrl = entry.fields.every((field) => String(row[field] ?? "").includes(EXPANSION_SOURCE_URL));
    const fieldsAlreadyNormalized = entry.fields.every((field) => !String(row[field] ?? "").includes(EXPANSION_SOURCE_URL));
    const sourceUrl = String(row.source_url ?? "").trim();
    if (sourceUrl === EXPANSION_SOURCE_URL && fieldsAlreadyNormalized) continue;
    if (sourceUrl || !fieldsContainRawUrl) {
      throw new Error(`Unexpected editorial state for legacyId ${entry.legacyId}; refusing to overwrite it`);
    }

    const content = entry.fields.includes("content") ? removeRawSourceUrl(row.content) : row.content;
    const contentEs = entry.fields.includes("content_es") ? removeRawSourceUrl(row.content_es) : row.content_es;
    const changed = await client.query(
      `UPDATE news
          SET source_url = $1,
              content = $2,
              content_es = $3
        WHERE id = $4
          AND legacy_id = $5
          AND category = 'articles'
          AND (source_url IS NULL OR btrim(source_url) = '')
        RETURNING id, legacy_id, source_url, content, content_es`,
      [EXPANSION_SOURCE_URL, content, contentEs, row.id, entry.legacyId],
    );
    if (changed.rowCount !== 1) throw new Error(`Unable to normalize legacyId ${entry.legacyId}`);
    const persisted = changed.rows[0];
    if (
      persisted.source_url !== EXPANSION_SOURCE_URL
      || entry.fields.some((field) => String(persisted[field] ?? "").includes(EXPANSION_SOURCE_URL))
    ) {
      throw new Error(`Unable to verify normalized Article ${entry.legacyId}`);
    }
    updated += 1;
  }
  console.log(`[migrations] normalized ${updated} Article source-link records`);
}
