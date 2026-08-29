/**
 * Reconocimiento editorial entregado por el equipo de Von Wobeser y Sierra el
 * 29 de agosto de 2026. La fecha es la fecha editorial de entrega, no una
 * inferencia desde LinkedIn; el sitio la presenta únicamente como agosto de
 * 2026 y puede ajustarse desde Administración si el equipo proporciona una
 * fecha de publicación distinta.
 *
 * Los 26 nombres son profesionales reconocidos, no autores. Por ello las
 * relaciones se registran como `related`, aunque la evidencia editorial que
 * los vincula a este reconocimiento sea manual y explícita.
 */
export const CHAMBERS_LATIN_AMERICA_2027_RECOGNITION = {
  slug: "von-wobeser-sierra-chambers-latin-america-2027",
  title: "Von Wobeser y Sierra achieves its strongest result to date in Chambers Latin America 2027",
  titleEs: "Von Wobeser y Sierra alcanza su mejor resultado en Chambers Latin America 2027",
  excerpt: "Von Wobeser y Sierra achieved its strongest result to date in Chambers Latin America, with 12 ranked practices and 35 individual recognitions across 26 of the firm's professionals. The 2027 results reflect the strength of our practices and the market's recognition of the experience, expertise, and commitment of our team.",
  excerptEs: "Von Wobeser y Sierra obtuvo su mejor resultado histórico en Chambers Latin America, con 12 prácticas rankeadas y 35 reconocimientos individuales para 26 profesionales de la firma. Los resultados de la edición 2027 reflejan la solidez de nuestras distintas áreas de práctica y el reconocimiento del mercado al conocimiento, experiencia y compromiso de nuestro equipo.",
  sourceUrl: "https://lnkd.in/eWKSyTzj",
  date: "2026-08-29T12:00:00.000Z",
  practices: [
    "Banking & Finance",
    "Competition/Antitrust",
    "Compliance",
    "Corporate/M&A: The Elite",
    "Dispute Resolution: Arbitration",
    "Dispute Resolution: Civil & Commercial Litigation",
    "Energy & Natural Resources: Power",
    "Environment",
    "Intellectual Property",
    "International Trade/WTO",
    "Labour & Employment",
    "Public Law",
  ],
  // El nombre entregado "Alejandro Torres Rivero" corresponde al socio con
  // correo ajtorres@vwys.com.mx, no al homónimo asociado altorres@vwys.com.mx.
  relatedProfessionals: [
    "claus-von-wobeser",
    "luis-burgueno",
    "luis-miguel-jimenez",
    "fernando-carreno",
    "edmond-grieger",
    "adrian-magallanes",
    "diego-sierra",
    "montserrat-manzano",
    "pablo-saez-williams",
    "patricia-kaim",
    "alberto-cordoba",
    "raymundo-soberanis",
    "pablo-fautsch",
    "ariel-garfio",
    "rafael-vallejo",
    "sergio-lopez",
    "alejandro-torres",
    "javier-betancourt",
    "rodrigo-barradas",
    "michel-llorens",
    "ricardo-cacho",
    "manuel-martinez",
    "lourdes-salazar-y-vera",
    "alejandra-arizpe",
    "deborah-luengo",
    "fernando-mancilla",
  ],
};

function unorderedList(items) {
  return `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

function expectedFields() {
  const item = CHAMBERS_LATIN_AMERICA_2027_RECOGNITION;
  return {
    title: item.title,
    title_es: item.titleEs,
    excerpt: item.excerpt,
    excerpt_es: item.excerptEs,
    content: `<h2>Ranked practices</h2>${unorderedList(item.practices)}`,
    content_es: `<h2>Prácticas reconocidas</h2>${unorderedList(item.practices)}`,
    source_url: item.sourceUrl,
    slug: item.slug,
    date: item.date,
    published: true,
    featured_home: false,
    category: "rankings",
    category_es: "Reconocimientos",
    processing_status: "ready",
    last_error: null,
  };
}

function sameExpectedFields(row, expected) {
  return row.title === expected.title
    && row.title_es === expected.title_es
    && row.excerpt === expected.excerpt
    && row.excerpt_es === expected.excerpt_es
    && row.content === expected.content
    && row.content_es === expected.content_es
    && row.source_url === expected.source_url
    && row.slug === expected.slug
    && new Date(row.date).toISOString() === expected.date
    && row.published === expected.published
    && row.featured_home === expected.featured_home
    && row.category === expected.category
    && row.category_es === expected.category_es
    && row.processing_status === expected.processing_status
    && row.last_error === expected.last_error;
}

export default async function publishChambersLatinAmerica2027Recognition(client) {
  const item = CHAMBERS_LATIN_AMERICA_2027_RECOGNITION;
  const expected = expectedFields();
  const [existing, professionals] = await Promise.all([
    client.query(
      `SELECT id, title, title_es, excerpt, excerpt_es, content, content_es, source_url, slug, date,
              published, featured_home, category, category_es, processing_status, last_error
         FROM news
        WHERE slug = $1
        FOR UPDATE`,
      [item.slug],
    ),
    client.query(
      `SELECT id, slug
         FROM team_members
        WHERE slug = ANY($1::text[])
          AND published = true`,
      [item.relatedProfessionals],
    ),
  ]);

  if (professionals.rowCount !== item.relatedProfessionals.length) {
    const found = new Set(professionals.rows.map((row) => row.slug));
    throw new Error(`Missing published Chambers Latin America 2027 professionals: ${item.relatedProfessionals.filter((slug) => !found.has(slug)).join(", ")}`);
  }
  if (existing.rowCount > 1) throw new Error(`Duplicate Chambers Latin America 2027 recognition slug: ${item.slug}`);
  if (existing.rowCount === 1 && !sameExpectedFields(existing.rows[0], expected)) {
    throw new Error("Refusing to overwrite an Administration edit for the Chambers Latin America 2027 recognition");
  }

  let newsId = existing.rows[0]?.id;
  if (!newsId) {
    const created = await client.query(
      `INSERT INTO news (
         title, title_es, excerpt, excerpt_es, content, content_es, source_url, slug, date,
         published, featured_home, category, category_es, processing_status, last_error
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9,
         $10, $11, $12, $13, $14, $15
       ) RETURNING id, slug`,
      [
        expected.title, expected.title_es, expected.excerpt, expected.excerpt_es,
        expected.content, expected.content_es, expected.source_url, expected.slug, expected.date,
        expected.published, expected.featured_home, expected.category, expected.category_es,
        expected.processing_status, expected.last_error,
      ],
    );
    if (created.rowCount !== 1 || created.rows[0]?.slug !== item.slug) {
      throw new Error("Unable to create Chambers Latin America 2027 recognition");
    }
    newsId = created.rows[0].id;
  }

  const professionalIdBySlug = new Map(professionals.rows.map((row) => [row.slug, row.id]));
  for (const professionalSlug of item.relatedProfessionals) {
    await client.query(
      `INSERT INTO news_team_members (news_id, team_member_id, verification_status, relationship_role)
       VALUES ($1, $2, 'verified_manual', 'related')
       ON CONFLICT (news_id, team_member_id) DO UPDATE
         SET verification_status = 'verified_manual',
             relationship_role = 'related'`,
      [newsId, professionalIdBySlug.get(professionalSlug)],
    );
  }

  await client.query(
    `INSERT INTO news_external_links (
       news_id, kind, url, normalized_url, status, final_url, failure_code, checked_at, disabled_at
     ) VALUES ($1, 'source', $2, $2, 'verified', $2, NULL, now(), NULL)
     ON CONFLICT (news_id, normalized_url, kind) DO UPDATE
       SET url = EXCLUDED.url,
           status = 'verified',
           final_url = EXCLUDED.final_url,
           failure_code = NULL,
           checked_at = EXCLUDED.checked_at,
           disabled_at = NULL
     WHERE news_external_links.url IS DISTINCT FROM EXCLUDED.url
        OR news_external_links.status IS DISTINCT FROM 'verified'
        OR news_external_links.final_url IS DISTINCT FROM EXCLUDED.final_url
        OR news_external_links.failure_code IS NOT NULL
        OR news_external_links.disabled_at IS NOT NULL`,
    [newsId, item.sourceUrl],
  );

  console.log(`[migrations] published ${item.slug} with ${item.relatedProfessionals.length} verified related professionals`);
}
