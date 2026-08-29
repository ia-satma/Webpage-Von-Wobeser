export const LEGACY_FIRM_ARTICLE_PAGES = [
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
  sourceUrl: `https://www.vonwobeser.com/index.php/${collection}?p_id=${legacyId}`,
}));

const LEGACY_FIRM_PAGE_SOURCE_RE = "^https://(?:www\\.)?vonwobeser\\.com/index\\.php/(?:publication|publicacion)\\?p_id=[0-9]+$";

/**
 * The old Joomla HTML pages are not an acceptable public source, even when
 * they still return a 200 response. Preserve the URL and the evidence in the
 * admin integrity log, but withdraw these source-only Articles from all public
 * surfaces. The query is based on the current source value, so an editor who
 * has already replaced it with a valid destination is never overwritten.
 */
export default async function deactivateLegacyArticlePages(client) {
  const result = await client.query(
    `SELECT id, legacy_id, category, source_url, published, featured_home
       FROM news
      WHERE lower(coalesce(category, '')) = 'articles'
        AND btrim(coalesce(source_url, '')) ~* $1
      FOR UPDATE`,
    [LEGACY_FIRM_PAGE_SOURCE_RE],
  );
  let unpublished = 0;
  let disabled = 0;
  for (const row of result.rows) {
    const sourceUrl = String(row.source_url ?? "").trim();

    const link = await client.query(
      `INSERT INTO news_external_links (
         news_id, kind, url, normalized_url, status, final_url, failure_code, checked_at, disabled_at
       ) VALUES ($1, 'source', $2, $2, 'disabled', $2, 'LEGACY_FIRM_PAGE', now(), now())
       ON CONFLICT (news_id, normalized_url, kind) DO UPDATE
         SET url = EXCLUDED.url,
             status = EXCLUDED.status,
             final_url = EXCLUDED.final_url,
             failure_code = EXCLUDED.failure_code,
             checked_at = EXCLUDED.checked_at,
             disabled_at = COALESCE(news_external_links.disabled_at, EXCLUDED.disabled_at)
       WHERE news_external_links.url IS DISTINCT FROM EXCLUDED.url
          OR news_external_links.status IS DISTINCT FROM EXCLUDED.status
          OR news_external_links.final_url IS DISTINCT FROM EXCLUDED.final_url
          OR news_external_links.failure_code IS DISTINCT FROM EXCLUDED.failure_code
       RETURNING id`,
      [row.id, sourceUrl],
    );
    if (link.rowCount) disabled += 1;

    const changed = await client.query(
      `UPDATE news
          SET published = false,
              featured_home = false
        WHERE id = $1
          AND legacy_id = $2
          AND lower(coalesce(category, '')) = 'articles'
          AND source_url = $3
          AND (published IS DISTINCT FROM false OR featured_home IS DISTINCT FROM false)
        RETURNING id`,
      [row.id, row.legacy_id, sourceUrl],
    );
    if (changed.rowCount) unpublished += 1;
  }
  console.log(`[migrations] disabled ${disabled} legacy-firm source links and unpublished ${unpublished} Articles`);
}
