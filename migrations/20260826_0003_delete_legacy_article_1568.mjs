const LEGACY_ID = "1568";
const EXPECTED_SLUG = "pablo-jimenez-manuel-galicia-humberto-perez-rocha-sheppard-mullin-legal-aspects-";

/**
 * Permanent editorial withdrawal requested for the 2007 Pablo Jiménez /
 * Galicia article. The historic mirror remains untouched as source evidence;
 * this removes only the public database record and its dependent author and
 * translation rows. The identity guard prevents a legacy-id collision from
 * deleting any other publication, and makes re-runs safe.
 */
export default async function deleteLegacyArticle1568(client) {
  const located = await client.query(
    "SELECT id, slug, legacy_id FROM news WHERE legacy_id = $1 FOR UPDATE",
    [LEGACY_ID],
  );

  if (located.rowCount === 0) {
    console.log(`[migrations] legacy article ${LEGACY_ID} already absent`);
    return;
  }
  if (located.rowCount !== 1 || located.rows[0].slug !== EXPECTED_SLUG) {
    throw new Error(`Refusing to delete unexpected legacy article ${LEGACY_ID}`);
  }

  const articleId = located.rows[0].id;
  await client.query("DELETE FROM news_team_members WHERE news_id = $1", [articleId]);
  await client.query("DELETE FROM news_translations WHERE news_id = $1", [articleId]);
  const removed = await client.query("DELETE FROM news WHERE id = $1", [articleId]);
  if (removed.rowCount !== 1) throw new Error(`Unable to delete legacy article ${LEGACY_ID}`);

  console.log(`[migrations] permanently removed legacy article ${LEGACY_ID}`);
}
