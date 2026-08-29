const REPLACEMENTS = [
  {
    key: "page_practices_title",
    previousValue: "Our practices",
    previousValueEs: "Nuestras prácticas",
    value: "Practice Areas",
    valueEs: "Áreas de Práctica",
  },
  {
    key: "page_practices_description",
    previousValue: "Explore the areas in which we provide specialized legal advice.",
    previousValueEs: "Conoce las áreas en las que ofrecemos asesoría legal especializada.",
    value: "",
    valueEs: "",
  },
];

/**
 * Applies the approved editorial heading change without touching any custom
 * configuration that an administrator may already have saved.
 */
export default async function renamePracticeListingHeading(client) {
  for (const replacement of REPLACEMENTS) {
    const located = await client.query(
      `SELECT key, value, value_es
         FROM site_config
        WHERE key = $1
        FOR UPDATE`,
      [replacement.key],
    );
    if (located.rowCount !== 1) {
      throw new Error(`Missing site configuration ${replacement.key}`);
    }

    const current = located.rows[0];
    if (current.value === replacement.value && current.value_es === replacement.valueEs) continue;
    if (current.value !== replacement.previousValue || current.value_es !== replacement.previousValueEs) {
      throw new Error(`Refusing to overwrite a custom value for ${replacement.key}`);
    }

    const updated = await client.query(
      `UPDATE site_config
          SET value = $1,
              value_es = $2,
              updated_at = now()
        WHERE key = $3
        RETURNING key, value, value_es`,
      [replacement.value, replacement.valueEs, replacement.key],
    );
    const result = updated.rows[0];
    if (
      updated.rowCount !== 1
      || result?.key !== replacement.key
      || result?.value !== replacement.value
      || result?.value_es !== replacement.valueEs
    ) {
      throw new Error(`Unable to update ${replacement.key}`);
    }
  }

  console.log("[migrations] updated Practice Areas heading and removed its subtitle");
}
