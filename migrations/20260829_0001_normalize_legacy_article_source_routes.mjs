export const LEGACY_ARTICLE_SOURCE_ROUTE_FIXES = [
  ["1807", "publicacion"],
  ["1808", "publicacion"],
  ["1809", "publicacion"],
  ["1812", "publicacion"],
  ["1813", "publicacion"],
  ["1815", "publicacion"],
  ["1816", "publicacion"],
  ["1817", "publicacion"],
  ["1822", "publication"],
  ["1823", "publication"],
  ["1824", "publication"],
  ["1827", "publication"],
  ["1828", "publication"],
  ["1830", "publication"],
  ["1831", "publication"],
  ["1832", "publication"],
].map(([legacyId, collection]) => ({
  legacyId,
  oldUrl: `https://www.vonwobeser.com/index.php/${collection}/p_id-${legacyId}.html`,
  sourceUrl: `https://www.vonwobeser.com/index.php/${collection}?p_id=${legacyId}`,
}));

/**
 * Replaces only known legacy Joomla paths that now loop into /index.php/404.
 * Any unexpected Administration edit aborts the surrounding transaction rather
 * than being silently overwritten. A previously corrected row is a no-op.
 */
export default async function normalizeLegacyArticleSourceRoutes(client) {
  const legacyIds = LEGACY_ARTICLE_SOURCE_ROUTE_FIXES.map((entry) => entry.legacyId);
  const result = await client.query(
    `SELECT id, legacy_id, category, source_url
       FROM news
      WHERE legacy_id = ANY($1::text[])
      FOR UPDATE`,
    [legacyIds],
  );
  if (result.rowCount !== LEGACY_ARTICLE_SOURCE_ROUTE_FIXES.length) {
    throw new Error(`Expected ${LEGACY_ARTICLE_SOURCE_ROUTE_FIXES.length} legacy Article source rows, found ${result.rowCount}`);
  }

  const rowsByLegacyId = new Map(result.rows.map((row) => [String(row.legacy_id), row]));
  let updated = 0;
  for (const entry of LEGACY_ARTICLE_SOURCE_ROUTE_FIXES) {
    const row = rowsByLegacyId.get(entry.legacyId);
    if (!row || String(row.category || "").toLowerCase() !== "articles") {
      throw new Error(`Unexpected Article identity for legacyId ${entry.legacyId}`);
    }
    const currentSource = String(row.source_url ?? "").trim();
    if (currentSource === entry.sourceUrl) continue;
    if (currentSource !== entry.oldUrl) {
      throw new Error(`Unexpected source URL for legacyId ${entry.legacyId}; refusing to overwrite it`);
    }
    const changed = await client.query(
      `UPDATE news
          SET source_url = $1
        WHERE id = $2
          AND legacy_id = $3
          AND category = 'articles'
          AND source_url = $4
        RETURNING legacy_id, source_url`,
      [entry.sourceUrl, row.id, entry.legacyId, entry.oldUrl],
    );
    if (changed.rowCount !== 1 || changed.rows[0].source_url !== entry.sourceUrl) {
      throw new Error(`Unable to normalize source URL for legacyId ${entry.legacyId}`);
    }
    updated += 1;
  }
  console.log(`[migrations] normalized ${updated} legacy Article source routes`);
}
