export const NEWS_1911_LEGACY_ID = "1911";

// Fuente histórica: "Abogados involucrados" de p_id-1911.html.
// Se conservan nombre y cargo para resolver de forma determinista los perfiles
// públicos actuales, sin inferir ni tocar relaciones de otras publicaciones.
export const NEWS_1911_VERIFIED_AUTHORS = [
  { name: "Luis Burgueño", title: "Partner" },
  { name: "Diego Sierra", title: "Partner" },
  { name: "Alberto Córdoba", title: "Partner" },
  { name: "Raymundo Soberanis", title: "Partner" },
  { name: "Max Morales", title: "Associate" },
  { name: "Ricardo Cacho", title: "Partner" },
];

const identity = (row) => `${String(row.name || "").trim()}\u0000${String(row.title || "").trim()}`;

/**
 * Completa exclusivamente la atribución histórica comprobada de p_id 1911.
 * La ejecución inicial requiere las cinco relaciones heredadas detectadas por
 * auditoría y agrega sólo Ricardo Cacho; posteriores ejecuciones son no-ops.
 */
export default async function correctNews1911AuthorRelations(client) {
  const publication = await client.query(
    `SELECT id, legacy_id, published
       FROM news
      WHERE legacy_id = $1
      FOR UPDATE`,
    [NEWS_1911_LEGACY_ID],
  );
  if (publication.rowCount !== 1 || publication.rows[0].published !== true) {
    throw new Error(`Expected one published News record for legacyId ${NEWS_1911_LEGACY_ID}`);
  }
  const newsId = publication.rows[0].id;

  const names = NEWS_1911_VERIFIED_AUTHORS.map((author) => author.name);
  const members = await client.query(
    `SELECT id, name, title, published
       FROM team_members
      WHERE name = ANY($1::text[])
      FOR UPDATE`,
    [names],
  );
  const expectedByIdentity = new Map(NEWS_1911_VERIFIED_AUTHORS.map((author) => [identity(author), author]));
  const memberByIdentity = new Map();
  for (const member of members.rows) {
    const key = identity(member);
    if (expectedByIdentity.has(key)) memberByIdentity.set(key, member);
  }
  if (
    members.rowCount !== NEWS_1911_VERIFIED_AUTHORS.length
    || memberByIdentity.size !== NEWS_1911_VERIFIED_AUTHORS.length
    || [...memberByIdentity.values()].some((member) => member.published !== true)
  ) {
    throw new Error(`Historic author identities for legacyId ${NEWS_1911_LEGACY_ID} no longer match public profiles`);
  }

  const relations = await client.query(
    `SELECT team_member_id, verification_status
       FROM news_team_members
      WHERE news_id = $1
      FOR UPDATE`,
    [newsId],
  );
  const expectedMemberIds = new Set([...memberByIdentity.values()].map((member) => member.id));
  if (relations.rows.some((relation) => !expectedMemberIds.has(relation.team_member_id))) {
    throw new Error(`Unexpected author relation on legacyId ${NEWS_1911_LEGACY_ID}; refusing to overwrite editorial data`);
  }
  const relationByMemberId = new Map(relations.rows.map((relation) => [relation.team_member_id, relation]));

  let verified = 0;
  let inserted = 0;
  for (const author of NEWS_1911_VERIFIED_AUTHORS) {
    const member = memberByIdentity.get(identity(author));
    const relation = relationByMemberId.get(member.id);
    if (relation?.verification_status === "verified_historic") continue;
    if (relation?.verification_status === "legacy_unverified") {
      const result = await client.query(
        `UPDATE news_team_members
            SET verification_status = 'verified_historic'
          WHERE news_id = $1 AND team_member_id = $2 AND verification_status = 'legacy_unverified'`,
        [newsId, member.id],
      );
      if (result.rowCount !== 1) throw new Error(`Unable to verify historic author ${author.name}`);
      verified += 1;
      continue;
    }
    if (relation) throw new Error(`Unexpected verification status for ${author.name}: ${relation.verification_status}`);
    if (author.name !== "Ricardo Cacho") {
      throw new Error(`Missing unexpected historic author ${author.name} on legacyId ${NEWS_1911_LEGACY_ID}`);
    }
    const result = await client.query(
      `INSERT INTO news_team_members (news_id, team_member_id, verification_status)
       VALUES ($1, $2, 'verified_historic')
       ON CONFLICT (news_id, team_member_id) DO NOTHING`,
      [newsId, member.id],
    );
    if (result.rowCount !== 1) throw new Error("Unable to add Ricardo Cacho historic author relation");
    inserted += 1;
  }
  console.log(`[migrations] corrected legacyId ${NEWS_1911_LEGACY_ID}: verified=${verified} inserted=${inserted}`);
}
