const SLUG = "edmond-grieger";
const HISTORICAL_NAME = "Edmond Frederic Grieger";
const PRESENTATION_NAME = {
  givenNames: "Edmond",
  firstSurname: "Grieger",
};

/**
 * Keeps the historical editorial identity and every relation intact while
 * changing only the structured fields used by the public attorney directory
 * and profile. The slug and primary key are deliberately not touched.
 */
export default async function setEdmondGriegerPublicName(client) {
  const located = await client.query(
    "SELECT id, name, slug FROM team_members WHERE slug = $1 FOR UPDATE",
    [SLUG],
  );

  if (located.rowCount !== 1) {
    throw new Error(`Expected one attorney with slug ${SLUG}, found ${located.rowCount}`);
  }
  if (located.rows[0].name !== HISTORICAL_NAME) {
    throw new Error(`Refusing to update unexpected attorney identity for ${SLUG}`);
  }

  const updated = await client.query(
    `UPDATE team_members
       SET given_names = $1,
           first_surname = $2,
           second_surname = NULL
     WHERE id = $3
     RETURNING id, name, slug, given_names, first_surname, second_surname`,
    [PRESENTATION_NAME.givenNames, PRESENTATION_NAME.firstSurname, located.rows[0].id],
  );
  const member = updated.rows[0];
  if (
    updated.rowCount !== 1
    || member?.name !== HISTORICAL_NAME
    || member?.slug !== SLUG
    || member?.given_names !== PRESENTATION_NAME.givenNames
    || member?.first_surname !== PRESENTATION_NAME.firstSurname
    || member?.second_surname !== null
  ) {
    throw new Error(`Unable to update the public presentation name for ${SLUG}`);
  }

  console.log(`[migrations] updated public presentation name for ${SLUG}`);
}
