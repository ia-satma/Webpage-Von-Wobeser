const HISTORICAL_NAME = "Ruben Villegas";
const CORRECTED_NAME = "Rubén Villegas";
const EXPECTED_TITLE = "Associate";

/**
 * Corrects the approved accented spelling while preserving the existing
 * identity, slug, editorial order, publication state and every relation.
 */
export default async function correctRubenVillegasAccent(client) {
  const located = await client.query(
    `SELECT id, name, slug, title, given_names, first_surname, second_surname
       FROM team_members
      WHERE title = $1
        AND name IN ($2, $3)
      FOR UPDATE`,
    [EXPECTED_TITLE, HISTORICAL_NAME, CORRECTED_NAME],
  );

  if (located.rowCount !== 1) {
    throw new Error(`Expected one ${EXPECTED_TITLE} named ${HISTORICAL_NAME}, found ${located.rowCount}`);
  }

  const member = located.rows[0];
  if (
    member.name === CORRECTED_NAME
    && member.given_names === "Rubén"
    && member.first_surname === "Villegas"
    && member.second_surname === null
  ) {
    console.log(`[migrations] accented given name already correct for ${member.slug}`);
    return;
  }

  const updated = await client.query(
    `UPDATE team_members
        SET name = $1,
            given_names = $2,
            first_surname = $3,
            second_surname = NULL
      WHERE id = $4
      RETURNING id, name, slug, title, given_names, first_surname, second_surname`,
    [CORRECTED_NAME, "Rubén", "Villegas", member.id],
  );
  const result = updated.rows[0];
  if (
    updated.rowCount !== 1
    || result?.id !== member.id
    || result?.slug !== member.slug
    || result?.title !== EXPECTED_TITLE
    || result?.name !== CORRECTED_NAME
    || result?.given_names !== "Rubén"
    || result?.first_surname !== "Villegas"
    || result?.second_surname !== null
  ) {
    throw new Error("Unable to persist Rubén Villegas's corrected name");
  }

  console.log(`[migrations] corrected accented given name for ${result.slug}`);
}
