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
    db.select({ id: schema.news.id, legacyId: schema.news.legacyId, slug: schema.news.slug, published: schema.news.published, category: schema.news.category })
      .from(schema.news),
    db.select({ id: schema.teamMembers.id, name: schema.teamMembers.name, title: schema.teamMembers.title, email: schema.teamMembers.email, published: schema.teamMembers.published })
      .from(schema.teamMembers),
    db.select({
      newsId: schema.newsTeamMembers.newsId,
      teamMemberId: schema.newsTeamMembers.teamMemberId,
      verificationStatus: schema.newsTeamMembers.verificationStatus,
      relationshipRole: schema.newsTeamMembers.relationshipRole,
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
  const byRelationshipRole = Object.fromEntries(
    ["author", "related"].map((role) => [
      role,
      linkRows.filter((relation) => relation.relationshipRole === role).length,
    ]),
  );
  const newsById = new Map(newsRows.map((item) => [item.id, item]));
  const publicAuthorLinks = linkRows.filter((relation) =>
    relation.relationshipRole === "author"
    && relation.verificationStatus !== "legacy_unverified",
  );
  // Historic "Lawyers involved" references are public authorship only for
  // Artículos. Other historic content remains a related-professional link;
  // Dropbox 2026 and manual confirmations explicitly identify authors.
  const roleMismatches = linkRows.filter((relation) => {
    const category = String(newsById.get(relation.newsId)?.category || "").toLowerCase();
    if (relation.verificationStatus === "verified_historic") {
      return relation.relationshipRole !== (category === "articles" ? "author" : "related");
    }
    if (relation.verificationStatus === "verified_editorial_2026") return relation.relationshipRole !== "author";
    return false;
  });
  const expectedByKey = new Map(audit.expected.map((relation) => [
    `${relation.newsId}\u0000${relation.teamMemberId}`,
    relation.source === "historic" ? "verified_historic" : "verified_editorial_2026",
  ]));
  const sourceStatusMismatches = linkRows.filter((relation) =>
    expectedByKey.has(`${relation.newsId}\u0000${relation.teamMemberId}`)
    && expectedByKey.get(`${relation.newsId}\u0000${relation.teamMemberId}`) !== relation.verificationStatus,
  ).length;
  const publishedWithoutVerifiedAuthors = newsRows.filter((item) => item.published !== false).filter((item) => !publicAuthorLinks.some((relation) =>
    relation.newsId === item.id
  )).length;
  const articleIds = new Set(newsRows
    .filter((item) => String(item.category || "").toLowerCase() === "articles")
    .map((item) => item.id));
  const forArticles = <T extends { newsId: string }>(rows: T[]) => rows.filter((item) => articleIds.has(item.newsId));
  const articleLinks = linkRows.filter((relation) => articleIds.has(relation.newsId));
  const articleVerification = Object.fromEntries(
    ["verified_historic", "verified_editorial_2026", "verified_manual", "legacy_unverified"].map((status) => [
      status,
      articleLinks.filter((relation) => relation.verificationStatus === status).length,
    ]),
  );
  const articleRows = newsRows.filter((item) => articleIds.has(item.id));
  const articlesWithoutVerifiedAuthors = articleRows.filter((item) => item.published !== false && !articleLinks.some((relation) =>
    relation.newsId === item.id
    && relation.relationshipRole === "author"
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
      roles: byRelationshipRole,
      sourceStatusMismatches,
      roleMismatches: roleMismatches.length,
      publishedWithoutVerifiedAuthors,
    },
    sources: {
      historic: audit.expected.filter((item) => item.source === "historic").length,
      dropbox2026: audit.expected.filter((item) => item.source === "dropbox-2026").length,
    },
    articles: {
      publications: articleRows.length,
      expected: forArticles(audit.expected).length,
      confirmed: forArticles(audit.confirmed).length,
      missing: forArticles(audit.missing).length,
      contradictions: forArticles(audit.contradictions).length,
      retainedWithoutSource: forArticles(audit.retainedWithoutSource).length,
      verification: articleVerification,
      publishedWithoutVerifiedAuthors: articlesWithoutVerifiedAuthors,
    },
  }, null, 2));
} finally {
  await closeDatabasePool();
}
