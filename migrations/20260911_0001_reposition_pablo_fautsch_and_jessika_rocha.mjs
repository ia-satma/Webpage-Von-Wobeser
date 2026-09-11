const APPROVED_SEGMENT = [
  {
    slug: "pablo-fautsch",
    name: "Pablo Fautsch",
    previousOrder: 12,
    targetOrder: 14,
  },
  {
    slug: "jessika-rocha",
    name: "Jessika Rocha",
    previousOrder: 13,
    targetOrder: 15,
  },
  {
    slug: "raymundo-soberanis",
    name: "Raymundo Soberanis",
    previousOrder: 14,
    targetOrder: 12,
  },
  {
    slug: "pablo-jimenez",
    name: "Pablo Jiménez",
    previousOrder: 15,
    targetOrder: 13,
  },
  {
    slug: "ariel-garfio",
    name: "Ariel Garfio",
    previousOrder: 16,
    targetOrder: 16,
  },
];

/**
 * Aplica la reubicación editorial solicitada sin reordenar al resto de Socios:
 * Raymundo Soberanis → Pablo Jiménez → Pablo Fautsch → Jessika Rocha → Ariel Garfio.
 *
 * Sólo puede partir del tramo heredado exacto. Si alguien ya modificó cualquiera
 * de esos cinco lugares desde Administración, cancela la transacción completa
 * para no sobrescribir ese ajuste.
 */
export default async function repositionPabloFautschAndJessikaRocha(client) {
  const slugs = APPROVED_SEGMENT.map((entry) => entry.slug);
  const located = await client.query(
    `SELECT id, slug, name, title, is_partner, "order" AS sort_order, published
       FROM team_members
      WHERE slug = ANY($1::text[])
      FOR UPDATE`,
    [slugs],
  );

  if (located.rowCount !== APPROVED_SEGMENT.length) {
    throw new Error(`Expected exactly ${APPROVED_SEGMENT.length} approved Partner profiles, found ${located.rowCount}.`);
  }

  const memberBySlug = new Map(located.rows.map((member) => [member.slug, member]));
  for (const entry of APPROVED_SEGMENT) {
    const member = memberBySlug.get(entry.slug);
    if (
      !member
      || member.name !== entry.name
      || member.title !== "Partner"
      || member.is_partner !== true
    ) {
      throw new Error(`Partner identity mismatch for ${entry.slug}; refusing to reorder it.`);
    }
  }

  const alreadyCurrent = APPROVED_SEGMENT.every(
    (entry) => memberBySlug.get(entry.slug)?.sort_order === entry.targetOrder,
  );
  if (alreadyCurrent) {
    console.log("[migrations] approved Pablo Fautsch and Jessika Rocha partner positions are already current");
    return;
  }

  const retainsPreviousOrder = APPROVED_SEGMENT.every(
    (entry) => memberBySlug.get(entry.slug)?.sort_order === entry.previousOrder,
  );
  if (!retainsPreviousOrder) {
    throw new Error("Partner order was changed in Administration; refusing to overwrite it.");
  }

  const changed = APPROVED_SEGMENT.filter((entry) => entry.previousOrder !== entry.targetOrder);
  for (const entry of changed) {
    const member = memberBySlug.get(entry.slug);
    const updated = await client.query(
      `UPDATE team_members
          SET "order" = $1
        WHERE id = $2
          AND slug = $3
          AND name = $4
          AND title = 'Partner'
          AND is_partner IS TRUE
          AND "order" = $5
        RETURNING id, slug, name, title, is_partner, "order" AS sort_order, published`,
      [entry.targetOrder, member.id, entry.slug, entry.name, entry.previousOrder],
    );
    const result = updated.rows[0];
    if (
      updated.rowCount !== 1
      || result?.id !== member.id
      || result?.slug !== entry.slug
      || result?.name !== entry.name
      || result?.title !== "Partner"
      || result?.is_partner !== true
      || result?.sort_order !== entry.targetOrder
      || result?.published !== member.published
    ) {
      throw new Error(`Unable to update only the approved order for ${entry.slug}.`);
    }
  }

  console.log(`[migrations] repositioned ${changed.length} approved Partner records`);
}
