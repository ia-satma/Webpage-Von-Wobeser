const PUBLIC_VERIFICATION_STATUSES = [
  "verified_historic",
  "verified_editorial_2026",
  "verified_manual",
];

/**
 * Historic "Lawyers involved" evidence proves a connection, not authorship,
 * for communications, events and recognitions. Verified Article links and
 * newer source/editor-confirmed credits are promoted to author roles here.
 * Every other historic relation remains a related professional and is retained
 * for Administration.
 */
export default async function backfillArticleAuthorRelationshipRoles(client) {
  const preflight = await client.query(
    `SELECT count(*)::int AS candidates
       FROM news_team_members ntm
       INNER JOIN news n ON n.id = ntm.news_id
      WHERE (
          (lower(coalesce(n.category, '')) = 'articles' AND ntm.verification_status = ANY($1::text[]))
          OR ntm.verification_status IN ('verified_editorial_2026', 'verified_manual')
        )
        AND ntm.relationship_role = 'related'`,
    [PUBLIC_VERIFICATION_STATUSES],
  );
  const result = await client.query(
    `UPDATE news_team_members ntm
        SET relationship_role = 'author'
       FROM news n
      WHERE n.id = ntm.news_id
        AND (
          (lower(coalesce(n.category, '')) = 'articles' AND ntm.verification_status = ANY($1::text[]))
          OR ntm.verification_status IN ('verified_editorial_2026', 'verified_manual')
        )
        AND ntm.relationship_role = 'related'
      RETURNING ntm.id`,
    [PUBLIC_VERIFICATION_STATUSES],
  );
  console.log(`[migrations] verified author roles candidates=${preflight.rows[0]?.candidates ?? 0} updated=${result.rowCount ?? 0}`);
}
