import partnerSince2026 from "../server/content/partnerSince2026.json" with { type: "json" };

export const PARTNER_SINCE_2026 = partnerSince2026;
const EXPECTED_PARTNER_COUNT = 26;

function assertCatalog(entries) {
  if (
    !Array.isArray(entries)
    || entries.length !== EXPECTED_PARTNER_COUNT
    || new Set(entries.map((entry) => entry.slug)).size !== EXPECTED_PARTNER_COUNT
  ) {
    throw new Error("Partner-since catalog must contain exactly 26 unique partners.");
  }

  for (const entry of entries) {
    if (
      typeof entry.slug !== "string"
      || typeof entry.expectedName !== "string"
      || entry.expectedTitle !== "Partner"
      || !Number.isInteger(entry.year)
      || entry.year < 1900
      || entry.year > 2100
    ) {
      throw new Error("Partner-since catalog contains an invalid entry.");
    }
  }
}

/**
 * Initializes only the approved "Socio de a partir de" years. Every target
 * is locked and checked before writing, so a later Administration edit is
 * never overwritten. The runner wraps this migration in one transaction.
 */
export default async function backfillPartnerSinceYears(client) {
  const entries = PARTNER_SINCE_2026.entries;
  assertCatalog(entries);

  const slugs = entries.map((entry) => entry.slug);
  const located = await client.query(
    `SELECT id, slug, name, title, is_partner, partner_since_year
       FROM team_members
      WHERE slug = ANY($1::text[])
      FOR UPDATE`,
    [slugs],
  );

  if (located.rowCount !== EXPECTED_PARTNER_COUNT) {
    throw new Error(`Expected ${EXPECTED_PARTNER_COUNT} Partner profiles, found ${located.rowCount}.`);
  }

  const memberBySlug = new Map(located.rows.map((member) => [member.slug, member]));
  const pending = [];
  let alreadyCurrent = 0;

  for (const entry of entries) {
    const member = memberBySlug.get(entry.slug);
    if (!member) throw new Error(`Missing Partner profile ${entry.slug}.`);
    if (member.name !== entry.expectedName || member.title !== entry.expectedTitle || member.is_partner !== true) {
      throw new Error(`Partner identity mismatch for ${entry.slug}; refusing to overwrite it.`);
    }
    if (member.partner_since_year === entry.year) {
      alreadyCurrent += 1;
      continue;
    }
    if (member.partner_since_year !== null && member.partner_since_year !== undefined) {
      throw new Error(`Partner-since year for ${entry.slug} was changed in Administration; refusing to overwrite it.`);
    }
    pending.push({ entry, member });
  }

  console.log(`[migrations] partner-since preflight targets=${EXPECTED_PARTNER_COUNT} pending=${pending.length} current=${alreadyCurrent}`);

  for (const { entry, member } of pending) {
    const updated = await client.query(
      `UPDATE team_members
          SET partner_since_year = $1
        WHERE id = $2
          AND slug = $3
          AND name = $4
          AND title = 'Partner'
          AND is_partner IS TRUE
          AND partner_since_year IS NULL
        RETURNING id, slug, name, title, is_partner, partner_since_year`,
      [entry.year, member.id, entry.slug, entry.expectedName],
    );
    const result = updated.rows[0];
    if (
      updated.rowCount !== 1
      || result?.id !== member.id
      || result?.slug !== entry.slug
      || result?.name !== entry.expectedName
      || result?.title !== "Partner"
      || result?.is_partner !== true
      || result?.partner_since_year !== entry.year
    ) {
      throw new Error(`Unable to initialize Partner-since year for ${entry.slug}.`);
    }
  }

  console.log(`[migrations] initialized ${pending.length} Partner-since years; ${alreadyCurrent} already current`);
}
