export const CAREERS_BODY_EN = "<p>We are a firm in constant growth, with a culture and environment that promotes your potential, consolidating new skills and values.</p><p>Through our career plan, which consists of creating, training and retaining the best talent, we offer professional and personal development which is optimal.</p>";
export const CAREERS_BODY_ES = "<p>Somos un despacho en constante crecimiento, con una cultura y ambiente que promuevan tu potencial, consolidando nuevas habilidades y valores.</p><p>A través de nuestro plan de carrera, el cual consiste en crear, formar y retener el mejor talento, te ofrecemos un desarrollo profesional y personal óptimo.</p>";

/**
 * Promotes the inherited Career body into the editable configuration only
 * while it is blank. Existing administrator copy is intentionally preserved.
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
  if (String(current.value || "").trim() || String(current.value_es || "").trim()) {
    throw new Error("Refusing to overwrite custom Careers body copy");
  }

  const updated = await client.query(
    `UPDATE site_config
        SET value = $1,
            value_es = $2,
            updated_at = now()
      WHERE key = 'page_careers_body'
      RETURNING key, value, value_es`,
    [CAREERS_BODY_EN, CAREERS_BODY_ES],
  );
  const result = updated.rows[0];
  if (
    updated.rowCount !== 1
    || result?.key !== "page_careers_body"
    || result?.value !== CAREERS_BODY_EN
    || result?.value_es !== CAREERS_BODY_ES
  ) {
    throw new Error("Unable to persist approved Careers body copy");
  }

  console.log("[migrations] updated editable Careers talent copy");
}
