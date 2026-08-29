const SLUG = "eugenio-chinchillas";
const EXPECTED_NAME = "Eugenio Chinchillas";
const EXPECTED_TITLE = "Associate";

/**
 * Reversibly removes just this profile from public surfaces. The record,
 * editorial order, biography and every historical relationship remain
 * available to Administrators for a future reactivation.
 */
export default async function unpublishEugenioChinchillas(client) {
  const located = await client.query(
    `SELECT id, name, slug, title, published
       FROM team_members
      WHERE slug = $1
      FOR UPDATE`,
    [SLUG],
  );

  if (located.rowCount !== 1) {
    throw new Error(`Expected exactly one team member with slug ${SLUG}, found ${located.rowCount}`);
  }

  const member = located.rows[0];
  if (member.name !== EXPECTED_NAME || member.title !== EXPECTED_TITLE) {
    throw new Error(`Unexpected profile for ${SLUG}: ${member.name} (${member.title})`);
  }
  if (member.published === false) {
    console.log(`[migrations] ${SLUG} already unpublished`);
    return;
  }

  const updated = await client.query(
    `UPDATE team_members
        SET published = false
      WHERE id = $1
        AND published IS DISTINCT FROM false
      RETURNING id, name, slug, title, published`,
    [member.id],
  );
  const result = updated.rows[0];
  if (
    updated.rowCount !== 1
    || result?.id !== member.id
    || result?.name !== EXPECTED_NAME
    || result?.slug !== SLUG
    || result?.title !== EXPECTED_TITLE
    || result?.published !== false
  ) {
    throw new Error(`Unable to unpublish ${SLUG}`);
  }

  console.log(`[migrations] unpublished ${SLUG} while preserving its administrative record`);
}
