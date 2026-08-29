export const CAREERS_TITLE_EN = "Your career at Von Wobeser y Sierra";
export const CAREERS_TITLE_ES = "Tú carrera en Von Wobeser y Sierra";

/**
 * Makes the public career-page H1 editable from Administration. The upsert is
 * idempotent and does not touch the applications form, its submissions or any
 * of the existing page copy.
 */
export default async function addCareersPageTitle(client) {
  const result = await client.query(
    `INSERT INTO site_config (key, value, value_es, type, category, description)
     VALUES ('page_careers_title', $1, $2, 'text', 'pages', 'Carrera — título principal')
     ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value,
           value_es = EXCLUDED.value_es,
           type = EXCLUDED.type,
           category = EXCLUDED.category,
           description = EXCLUDED.description,
           updated_at = now()
       WHERE site_config.value = 'Career at VW'
         AND site_config.value_es = 'Carrera en VW'
     RETURNING key, value, value_es`,
    [CAREERS_TITLE_EN, CAREERS_TITLE_ES],
  );

  if (result.rowCount === 0) {
    const existing = await client.query(
      "SELECT key, value, value_es FROM site_config WHERE key = 'page_careers_title'",
    );
    const row = existing.rows[0];
    if (existing.rowCount !== 1 || row.value !== CAREERS_TITLE_EN || row.value_es !== CAREERS_TITLE_ES) {
      throw new Error("Refusing to overwrite a custom Careers page title");
    }
    console.log("[migrations] Careers page title already configured");
    return;
  }

  const row = result.rows[0];
  if (row?.key !== "page_careers_title" || row?.value !== CAREERS_TITLE_EN || row?.value_es !== CAREERS_TITLE_ES) {
    throw new Error("Unable to persist the Careers page title");
  }
  console.log("[migrations] configured editable Careers page title");
}
