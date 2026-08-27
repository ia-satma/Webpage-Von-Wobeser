import assert from "node:assert/strict";
import test from "node:test";

process.env.DATABASE_URL ||= "postgresql://test:test@127.0.0.1:5432/test";

const [
  evidenceModule,
  reconciliationModule,
  { loadCanonicalAttorneyContent },
  { dedupeAuthorArchivePublications },
] = await Promise.all([
  import("../content/canonicalPublicationAuthorEvidence2026"),
  import("../content/publicationAuthorReconciliation"),
  import("../content/canonicalAttorneys"),
  import("../storage/repositories/newsRepository"),
]);

test("la evidencia histórica de autorías conserva inventario, digest y familias bilingües", () => {
  const evidence = evidenceModule.loadCanonicalPublicationAuthorEvidence();
  const historicAttorneys = evidenceModule.loadCanonicalHistoricAttorneyIdentities(evidence);
  assert.equal(evidence.length, evidenceModule.CANONICAL_PUBLICATION_AUTHOR_EVIDENCE_COUNT);
  assert.equal(
    evidence.reduce((total, item) => total + item.attorneyLegacyIds.length, 0),
    evidenceModule.CANONICAL_PUBLICATION_AUTHOR_REFERENCE_COUNT,
  );
  assert.equal(evidence.filter((item) => item.attorneyLegacyIds.includes("323")).length, 34);

  const families = evidenceModule.publicationFamilyKeys(evidence);
  const languages = evidenceModule.publicationSourceLanguageByLegacyId(evidence);
  assert.equal(families.get("1560"), families.get("1561"));
  assert.equal(languages.get("1560"), "en");
  assert.equal(languages.get("1561"), "es");
  assert.deepEqual(historicAttorneys.get("323"), {
    legacyId: "323",
    name: "Pablo Jiménez",
    title: "Partner",
  });
});

test("la reconciliación añade atribuciones fuente, elimina la contradicción de Pablo y conserva vínculos sin fuente", () => {
  const attorneys = loadCanonicalAttorneyContent();
  const attorney = (legacyId: string) => attorneys.find((item) => item.legacyId === legacyId)!;
  const pablo = attorney("323");
  const luis = attorney("143");
  const lourdes = attorney("190");
  const members = [pablo, luis, lourdes].map((item, index) => ({
    id: `member-${index}`,
    name: item.name,
    title: item.title,
    email: item.email,
    published: true,
  }));
  const memberByName = new Map(members.map((item) => [item.name, item]));
  const result = reconciliationModule.reconcilePublicationAuthors({
    news: [
      { id: "news-406", legacyId: "406", slug: "foreign-trade-implications", published: true },
      { id: "news-1560", legacyId: "1560", slug: "pablo-book", published: true },
      { id: "modern", legacyId: null, slug: "modern-without-source", published: true },
    ],
    members,
    links: [
      { newsId: "news-406", teamMemberId: memberByName.get(luis.name)!.id },
      { newsId: "news-406", teamMemberId: memberByName.get(pablo.name)!.id },
      { newsId: "modern", teamMemberId: memberByName.get(pablo.name)!.id },
    ],
  });

  assert.ok(result.confirmed.some((item) => item.newsId === "news-406" && item.teamMemberId === memberByName.get(luis.name)!.id));
  assert.ok(result.missing.some((item) => item.newsId === "news-1560" && item.teamMemberId === memberByName.get(pablo.name)!.id));
  assert.deepEqual(result.contradictions, [{ newsId: "news-406", teamMemberId: memberByName.get(pablo.name)!.id }]);
  assert.deepEqual(result.retainedWithoutSource, [{ newsId: "modern", teamMemberId: memberByName.get(pablo.name)!.id }]);
});

test("el archivo de autor agrupa las versiones ES/EN antes de paginar", () => {
  const rows = [
    { id: "english", legacyId: "1560" },
    { id: "spanish", legacyId: "1561" },
    { id: "single", legacyId: "406" },
  ] as any[];
  assert.deepEqual(dedupeAuthorArchivePublications(rows as any, "en").map((item) => item.id), ["english", "single"]);
  assert.deepEqual(dedupeAuthorArchivePublications(rows as any, "es").map((item) => item.id), ["spanish", "single"]);
});
