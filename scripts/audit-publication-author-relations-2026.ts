import "dotenv/config";

// Esta utilidad es explícitamente de solo lectura: sirve para revisar el
// plan antes y después de la migración sin alterar las relaciones editoriales.
process.env.SECURITY_READ_ONLY_SMOKE = "true";

const [{ db, closeDatabasePool }, schema, { reconcilePublicationAuthors }] = await Promise.all([
  import("../server/db"),
  import("../shared/schema"),
  import("../server/content/publicationAuthorReconciliation"),
]);

try {
  const [newsRows, memberRows, linkRows] = await Promise.all([
    db.select({ id: schema.news.id, legacyId: schema.news.legacyId, slug: schema.news.slug, published: schema.news.published })
      .from(schema.news),
    db.select({ id: schema.teamMembers.id, name: schema.teamMembers.name, title: schema.teamMembers.title, email: schema.teamMembers.email, published: schema.teamMembers.published })
      .from(schema.teamMembers),
    db.select({
      newsId: schema.newsTeamMembers.newsId,
      teamMemberId: schema.newsTeamMembers.teamMemberId,
      verificationStatus: schema.newsTeamMembers.verificationStatus,
    })
      .from(schema.newsTeamMembers),
  ]);
  const audit = reconcilePublicationAuthors({ news: newsRows, members: memberRows, links: linkRows });
  const byStatus = Object.fromEntries(
    ["verified_historic", "verified_editorial_2026", "verified_manual", "legacy_unverified"].map((status) => [
      status,
      linkRows.filter((relation) => relation.verificationStatus === status).length,
    ]),
  );
  const expectedByKey = new Map(audit.expected.map((relation) => [
    `${relation.newsId}\u0000${relation.teamMemberId}`,
    relation.source === "historic" ? "verified_historic" : "verified_editorial_2026",
  ]));
  const sourceStatusMismatches = linkRows.filter((relation) =>
    expectedByKey.has(`${relation.newsId}\u0000${relation.teamMemberId}`)
    && expectedByKey.get(`${relation.newsId}\u0000${relation.teamMemberId}`) !== relation.verificationStatus,
  ).length;
  const publishedWithoutVerifiedAuthors = newsRows.filter((item) => item.published !== false).filter((item) => !linkRows.some((relation) =>
    relation.newsId === item.id
    && relation.verificationStatus !== "legacy_unverified",
  )).length;

  console.log(JSON.stringify({
    mode: "read-only",
    expected: audit.expected.length,
    confirmed: audit.confirmed.length,
    missing: audit.missing.length,
    contradictions: audit.contradictions.length,
    retainedWithoutSource: audit.retainedWithoutSource.length,
    verification: {
      ...byStatus,
      sourceStatusMismatches,
      publishedWithoutVerifiedAuthors,
    },
    sources: {
      historic: audit.expected.filter((item) => item.source === "historic").length,
      dropbox2026: audit.expected.filter((item) => item.source === "dropbox-2026").length,
    },
  }, null, 2));
} finally {
  await closeDatabasePool();
}
