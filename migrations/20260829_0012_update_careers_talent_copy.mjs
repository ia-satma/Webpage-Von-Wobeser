export const CAREERS_BODY_EN = "<p>We are a firm in constant growth, with a culture and environment that promotes your potential, consolidating new skills and values.</p><p>Through our career plan, which consists of creating, training and retaining the best talent, we offer professional and personal development which is optimal.</p>";
export const CAREERS_BODY_ES = "<p>Somos un despacho en constante crecimiento, con una cultura y ambiente que promuevan tu potencial, consolidando nuevas habilidades y valores.</p><p>A través de nuestro plan de carrera, el cual consiste en crear, formar y retener el mejor talento, te ofrecemos un desarrollo profesional y personal óptimo.</p>";

const LEGACY_TALENT_PHRASE_EN = "retaining talented lawyers";
const LEGACY_TALENT_PHRASE_ES = "retener abogados talentosos";

/**
 * Replaces only the approved inherited phrase in the editable Career copy.
 * Any other administrator change remains protected: we never replace a whole
 * body just because it is non-empty.
 */
export default async function updateCareersTalentCopy(client) {
  const located = await client.query(
    `SELECT key, value, value_es
       FROM site_config
      WHERE key = 'page_careers_body'
      FOR UPDATE`,
  );
  if (located.rowCount !== 1) {
    throw new Error("Missing site configuration page_careers_body");
  }

  const current = located.rows[0];
  if (current.value === CAREERS_BODY_EN && current.value_es === CAREERS_BODY_ES) {
    console.log("[migrations] Careers body already contains approved talent copy");
    return;
  }

  const currentEn = String(current.value || "");
  const currentEs = String(current.value_es || "");
  const hasLegacyEn = currentEn.includes(LEGACY_TALENT_PHRASE_EN);
  const hasLegacyEs = currentEs.includes(LEGACY_TALENT_PHRASE_ES);
  if (!hasLegacyEn && !hasLegacyEs) {
    throw new Error("Refusing to overwrite custom Careers body copy");
  }

  const nextEn = hasLegacyEn
    ? currentEn.replace(LEGACY_TALENT_PHRASE_EN, "retaining the best talent")
    : currentEn;
  const nextEs = hasLegacyEs
    ? currentEs.replace(LEGACY_TALENT_PHRASE_ES, "retener el mejor talento")
    : currentEs;

  const updated = await client.query(
    `UPDATE site_config
        SET value = $1,
            value_es = $2,
            updated_at = now()
      WHERE key = 'page_careers_body'
      RETURNING key, value, value_es`,
    [nextEn, nextEs],
  );
  const result = updated.rows[0];
  if (
    updated.rowCount !== 1
    || result?.key !== "page_careers_body"
    || result?.value !== nextEn
    || result?.value_es !== nextEs
  ) {
    throw new Error("Unable to persist approved Careers body copy");
  }

  console.log("[migrations] updated editable Careers talent copy");
}
