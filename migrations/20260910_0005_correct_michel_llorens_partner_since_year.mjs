const SLUG = "michel-llorens";
const EXPECTED_NAME = "Michel Llorens";
const EXPECTED_TITLE = "Partner";
const LEGACY_YEAR = 2024;
const TARGET_YEAR = 2026;

/**
 * Corrige el año de sociedad de Michel Llorens conforme a la indicación
 * editorial del cliente. Sólo cambia el dato heredado exacto (2024); una
 * edición posterior desde Administración se conserva y detiene la migración.
 */
export default async function correctMichelLlorensPartnerSinceYear(client) {
  const located = await client.query(
    `SELECT id, slug, name, title, is_partner, partner_since_year,
            show_partner_since, published
       FROM team_members
      WHERE slug = $1
      FOR UPDATE`,
    [SLUG],
  );
  const member = located.rows[0];
  if (located.rowCount !== 1 || !member) {
    throw new Error("Expected exactly one Michel Llorens profile.");
  }
  if (
    member.name !== EXPECTED_NAME
    || member.title !== EXPECTED_TITLE
    || member.is_partner !== true
  ) {
    throw new Error("Michel Llorens profile identity does not match the approved correction.");
  }
  if (member.partner_since_year === TARGET_YEAR) {
    console.log("[migrations] Michel Llorens partner-since year is already current");
    return;
  }
  if (member.partner_since_year !== LEGACY_YEAR) {
    throw new Error("Michel Llorens partner-since year was changed in Administration; refusing to overwrite it.");
  }

  const updated = await client.query(
    `UPDATE team_members
        SET partner_since_year = $1
      WHERE id = $2
        AND slug = $3
        AND name = $4
        AND title = $5
        AND is_partner IS TRUE
        AND partner_since_year = $6
      RETURNING id, slug, name, title, is_partner, partner_since_year,
                show_partner_since, published`,
    [TARGET_YEAR, member.id, SLUG, EXPECTED_NAME, EXPECTED_TITLE, LEGACY_YEAR],
  );
  const result = updated.rows[0];
  if (
    updated.rowCount !== 1
    || result?.id !== member.id
    || result?.slug !== SLUG
    || result?.name !== EXPECTED_NAME
    || result?.title !== EXPECTED_TITLE
    || result?.is_partner !== true
    || result?.partner_since_year !== TARGET_YEAR
    || result?.show_partner_since !== member.show_partner_since
    || result?.published !== member.published
  ) {
    throw new Error("Unable to update only Michel Llorens partner-since year.");
  }
  console.log("[migrations] corrected Michel Llorens partner-since year to 2026");
}
