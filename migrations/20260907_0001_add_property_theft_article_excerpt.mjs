/**
 * The CMDN calendar was delivered without a summary for this published
 * Article, which made its archive card omit the introductory paragraph.
 * This fills only that approved bilingual excerpt. It never changes a later
 * Administration edit, nor any title, URL, date, author, relationship or
 * publication state.
 */
export const PROPERTY_THEFT_ARTICLE_EXCERPT = {
  slug: "property-theft-mexico-risks-protect-property",
  title: "Property Theft in Mexico: Risks and How to Protect Your Property",
  titleEs: "Despojo inmobiliario en México: riesgos y cómo proteger tu propiedad",
  excerpt: "Outdated deeds, unfinished successions and unattended properties expose ownership to risk; keeping records current helps prevent property theft.",
  excerptEs: "Escrituras desactualizadas, sucesiones pendientes y propiedades sin vigilancia ponen en riesgo el patrimonio; actualizarlas ayuda a prevenir el despojo.",
};

export default async function addPropertyTheftArticleExcerpt(client) {
  const target = PROPERTY_THEFT_ARTICLE_EXCERPT;
  const located = await client.query(
    `SELECT id, slug, category, title, title_es, excerpt, excerpt_es
       FROM news
      WHERE slug = $1
      FOR UPDATE`,
    [target.slug],
  );
  if (located.rowCount !== 1) {
    throw new Error("Expected exactly one Property Theft Article");
  }

  const row = located.rows[0];
  const historical = row.title === target.title
    && row.title_es === target.titleEs
    && String(row.category || "").toLowerCase() === "articles"
    && (row.excerpt ?? "") === ""
    && (row.excerpt_es ?? "") === "";
  const corrected = row.title === target.title
    && row.title_es === target.titleEs
    && String(row.category || "").toLowerCase() === "articles"
    && row.excerpt === target.excerpt
    && row.excerpt_es === target.excerptEs;

  if (!historical && !corrected) {
    throw new Error("Refusing to overwrite an Administration edit for the Property Theft Article");
  }
  if (corrected) {
    console.log("[migrations] Property Theft Article excerpt already uses approved bilingual copy");
    return;
  }

  console.log("[migrations] Property Theft Article excerpt preflight targets=1 pending=1");
  const updated = await client.query(
    `UPDATE news
        SET excerpt = $1,
            excerpt_es = $2
      WHERE id = $3
        AND excerpt = ''
        AND excerpt_es = ''
      RETURNING id, slug, excerpt, excerpt_es`,
    [target.excerpt, target.excerptEs, row.id],
  );
  const result = updated.rows[0];
  if (updated.rowCount !== 1
    || result?.id !== row.id
    || result?.slug !== target.slug
    || result?.excerpt !== target.excerpt
    || result?.excerpt_es !== target.excerptEs) {
    throw new Error("Unable to persist the approved Property Theft Article excerpt");
  }
  console.log("[migrations] updated Property Theft Article excerpt");
}
