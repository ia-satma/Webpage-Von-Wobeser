const HISTORICAL_NAME = "Alejandro Avila";
const CORRECTED_NAME = "Alejandro Ávila";
const EXPECTED_TITLE = "Associate";

/**
 * Corrects the public and administrative spelling without changing the
 * profile's primary key, slug, position, publication state, or relationships.
 * The alternate spelling is accepted only to make a retry safe after an
 * interrupted deploy; any other identity stops the migration.
 */
export default async function correctAlejandroAvilaAccent(client) {
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
    && member.given_names === "Alejandro"
    && member.first_surname === "Ávila"
    && member.second_surname === null
  ) {
    console.log(`[migrations] accented surname already correct for ${member.slug}`);
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
    [CORRECTED_NAME, "Alejandro", "Ávila", member.id],
  );
  const result = updated.rows[0];
  if (
    updated.rowCount !== 1
    || result?.id !== member.id
    || result?.slug !== member.slug
    || result?.title !== EXPECTED_TITLE
    || result?.name !== CORRECTED_NAME
    || result?.given_names !== "Alejandro"
    || result?.first_surname !== "Ávila"
    || result?.second_surname !== null
  ) {
    throw new Error("Unable to persist Alejandro Ávila's corrected name");
  }

  console.log(`[migrations] corrected accented surname for ${result.slug}`);
}
