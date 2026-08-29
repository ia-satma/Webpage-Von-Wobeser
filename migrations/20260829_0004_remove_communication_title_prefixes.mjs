/**
 * Editorial labels were accidentally delivered as part of the title in five
 * Communications. Keep the records and every other editorial field intact:
 * this migration updates only the two localized title columns after checking
 * their exact historical values. A later CMS edit is never overwritten.
 */
export const COMMUNICATION_TITLE_PREFIX_FIXES = [
  {
    slug: "reforma-reglas-ley-antilavado-2026",
    title: "Client alert: Amendment to the General Rules of the Anti-Money Laundering Law (LFPIORPI)",
    titleEs: "Alerta legal: Reforma a las Reglas de Carácter General de la Ley Antilavado (LFPIORPI)",
    correctedTitle: "Amendment to the General Rules of the Anti-Money Laundering Law (LFPIORPI)",
    correctedTitleEs: "Reforma a las Reglas de Carácter General de la Ley Antilavado (LFPIORPI)",
  },
  {
    slug: "client-alert-amendment-to-the-general-law-on-forced-disappearance-of-persons-dis",
    title: "Client Alert: Amendment to the General Law on Forced Disappearance of Persons, Disappearance Committed by Private Parties, and the National Missing Persons System (“LDP”); obligation to Interconnect with the Single Identity Platform (“PUI”)",
    titleEs: 'Alerta a Clientes: Reforma a la Ley General en Materia de Desaparición Forzada de Personas, Desaparición Cometida por Particulares y del Sistema Nacional de Búsqueda de Personas ("LDP"); obligación de interconexión con la Plataforma Única de Identidad ("PUI")',
    correctedTitle: "Amendment to the General Law on Forced Disappearance of Persons, Disappearance Committed by Private Parties, and the National Missing Persons System (“LDP”); obligation to Interconnect with the Single Identity Platform (“PUI”)",
    correctedTitleEs: 'Reforma a la Ley General en Materia de Desaparición Forzada de Personas, Desaparición Cometida por Particulares y del Sistema Nacional de Búsqueda de Personas ("LDP"); obligación de interconexión con la Plataforma Única de Identidad ("PUI")',
  },
  {
    slug: "client-alert-reforma-a-la-ley-general-en-materia-de-desaparicion-forzada-de-pers",
    title: 'Client Alert: Amendment to the General Law on Enforced Disappearance of Persons, Disappearance Committed by Private Parties and the National Search System for Persons ("LDP"); obligation to interconnect with the Single Identity Platform ("PUI")',
    titleEs: 'Client Alert: Reforma a la Ley General en Materia de Desaparición Forzada de Personas, Desaparición Cometida por Particulares y del Sistema Nacional de Búsqueda de Personas (“LDP”); obligación de Interconexión con la Plataforma Única de Identidad (“PUI”)',
    correctedTitle: 'Amendment to the General Law on Enforced Disappearance of Persons, Disappearance Committed by Private Parties and the National Search System for Persons ("LDP"); obligation to interconnect with the Single Identity Platform ("PUI")',
    correctedTitleEs: 'Reforma a la Ley General en Materia de Desaparición Forzada de Personas, Desaparición Cometida por Particulares y del Sistema Nacional de Búsqueda de Personas (“LDP”); obligación de Interconexión con la Plataforma Única de Identidad (“PUI”)',
  },
  {
    slug: "client-alert-amendment-to-the-regulations-of-the-anti-money-laundering-law-aml-l",
    title: "Client Alert: Amendment to the Regulations of the Anti-Money Laundering Law (AML Law)",
    titleEs: "Alerta a Clientes: Reforma al Reglamento de la Ley Antilavado (Ley Antilavado)",
    correctedTitle: "Amendment to the Regulations of the Anti-Money Laundering Law (AML Law)",
    correctedTitleEs: "Reforma al Reglamento de la Ley Antilavado (Ley Antilavado)",
  },
  {
    slug: "client-alert-reforma-al-reglamento-de-la-ley-antilavado-lfpiorpi",
    title: "Client Alert: Amendment to the Regulations of the Anti-Money Laundering Law (LFPIORPI)",
    titleEs: "Client Alert: Reforma al Reglamento de la Ley Antilavado (LFPIORPI)",
    correctedTitle: "Amendment to the Regulations of the Anti-Money Laundering Law (LFPIORPI)",
    correctedTitleEs: "Reforma al Reglamento de la Ley Antilavado (LFPIORPI)",
  },
];

const EDITORIAL_PREFIX_RE = "^(?:alerta\\s+(?:legal|a\\s+clientes)|client\\s+alert|legal\\s+alert)\\s*:\\s*";

export default async function removeCommunicationTitlePrefixes(client) {
  const rows = await client.query(
    `SELECT id, slug, category, published, title, title_es
       FROM news
      WHERE slug = ANY($1::text[])
      FOR UPDATE`,
    [COMMUNICATION_TITLE_PREFIX_FIXES.map((entry) => entry.slug)],
  );
  if (rows.rowCount !== COMMUNICATION_TITLE_PREFIX_FIXES.length) {
    throw new Error(`Expected ${COMMUNICATION_TITLE_PREFIX_FIXES.length} Communication title records, found ${rows.rowCount}`);
  }

  const rowBySlug = new Map(rows.rows.map((row) => [row.slug, row]));
  let pending = 0;
  for (const entry of COMMUNICATION_TITLE_PREFIX_FIXES) {
    const row = rowBySlug.get(entry.slug);
    if (!row || row.published !== true || String(row.category || "").toLowerCase() !== "news") {
      throw new Error(`Expected published Communication News record for ${entry.slug}`);
    }
    const historical = row.title === entry.title && row.title_es === entry.titleEs;
    const corrected = row.title === entry.correctedTitle && row.title_es === entry.correctedTitleEs;
    if (!historical && !corrected) {
      throw new Error(`Refusing to overwrite an unexpected Communication title for ${entry.slug}`);
    }
    if (historical) pending += 1;
  }
  console.log(`[migrations] communication title-prefix preflight targets=${rows.rowCount} pending=${pending}`);

  let changed = 0;
  for (const entry of COMMUNICATION_TITLE_PREFIX_FIXES) {
    const row = rowBySlug.get(entry.slug);
    if (row.title === entry.correctedTitle && row.title_es === entry.correctedTitleEs) continue;
    const updated = await client.query(
      `UPDATE news
          SET title = $1,
              title_es = $2
        WHERE id = $3
          AND title = $4
          AND title_es = $5
        RETURNING id, slug, title, title_es`,
      [entry.correctedTitle, entry.correctedTitleEs, row.id, entry.title, entry.titleEs],
    );
    if (updated.rowCount !== 1) {
      throw new Error(`Unable to update the expected Communication title for ${entry.slug}`);
    }
    changed += 1;
  }

  const remaining = await client.query(
    `SELECT slug, title, title_es
       FROM news
      WHERE published = true
        AND lower(coalesce(category, '')) = 'news'
        AND (title ~* $1 OR title_es ~* $1)`,
    [EDITORIAL_PREFIX_RE],
  );
  if (remaining.rowCount) {
    throw new Error(`Published Communication titles still use editorial prefixes: ${remaining.rows.map((row) => row.slug).join(", ")}`);
  }
  console.log(`[migrations] removed editorial title prefixes from ${changed} Communications`);
}
