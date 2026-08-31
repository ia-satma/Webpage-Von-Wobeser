const PREVIOUS_SPANISH_TITLE = "Tú carrera en Von Wobeser y Sierra";
export const CAREERS_TITLE_ES = "Tu carrera en Von Wobeser y Sierra";

/**
 * Applies the requested Spanish typography correction without changing the
 * English title or overwriting a later editorial change made in Administration.
 */
export default async function unaccentCareersPageTitle(client) {
  const located = await client.query(
    `SELECT key, value_es
       FROM site_config
      WHERE key = 'page_careers_title'
      FOR UPDATE`,
  );
  if (located.rowCount !== 1) {
    throw new Error("Missing site configuration page_careers_title");
  }

  const current = located.rows[0];
  if (current.value_es === CAREERS_TITLE_ES) {
    console.log("[migrations] Careers page title already uses approved Spanish typography");
    return;
  }
  if (current.value_es !== PREVIOUS_SPANISH_TITLE) {
    throw new Error("Refusing to overwrite a custom Spanish Careers page title");
  }

  const updated = await client.query(
    `UPDATE site_config
        SET value_es = $1,
            updated_at = now()
      WHERE key = 'page_careers_title'
        AND value_es = $2
      RETURNING key, value_es`,
    [CAREERS_TITLE_ES, PREVIOUS_SPANISH_TITLE],
  );
  const result = updated.rows[0];
  if (updated.rowCount !== 1 || result?.key !== "page_careers_title" || result?.value_es !== CAREERS_TITLE_ES) {
    throw new Error("Unable to persist approved Spanish Careers page title");
  }

  console.log("[migrations] updated Careers page title Spanish typography");
}
