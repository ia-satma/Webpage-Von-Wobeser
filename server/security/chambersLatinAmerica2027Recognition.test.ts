import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const { CHAMBERS_LATIN_AMERICA_2027_RECOGNITION, default: publishChambersLatinAmerica2027Recognition } = await import("../../migrations/20260829_0015_publish_chambers_latin_america_2027_recognition.mjs");

function createClient() {
  let news: Record<string, unknown> | null = null;
  const relations = new Map<string, { verificationStatus: unknown; relationshipRole: unknown }>();
  let sourceLink: Record<string, unknown> | null = null;
  return {
    state: { get news() { return news; }, relations, get sourceLink() { return sourceLink; } },
    client: {
      query: async (statement: string, params: unknown[] = []) => {
        if (statement.includes("FROM news") && statement.includes("FOR UPDATE")) {
          return news ? { rowCount: 1, rows: [news] } : { rowCount: 0, rows: [] };
        }
        if (statement.includes("FROM team_members")) {
          const requested = params[0] as string[];
          const rows = requested.map((slug) => ({ id: `member-${slug}`, slug }));
          return { rowCount: rows.length, rows };
        }
        if (statement.includes("INSERT INTO news (")) {
          const [title, titleEs, excerpt, excerptEs, content, contentEs, sourceUrl, slug, date, published, featuredHome, category, categoryEs, processingStatus, lastError] = params;
          news = {
            id: "chambers-2027-id", title, title_es: titleEs, excerpt, excerpt_es: excerptEs,
            content, content_es: contentEs, source_url: sourceUrl, slug, date, published,
            featured_home: featuredHome, category, category_es: categoryEs,
            processing_status: processingStatus, last_error: lastError,
          };
          return { rowCount: 1, rows: [{ id: "chambers-2027-id", slug }] };
        }
        if (statement.includes("INSERT INTO news_team_members")) {
          relations.set(`${params[0]}:${params[1]}`, { verificationStatus: "verified_manual", relationshipRole: "related" });
          return { rowCount: 1, rows: [] };
        }
        if (statement.includes("INSERT INTO news_external_links")) {
          sourceLink = { newsId: params[0], url: params[1], finalUrl: params[1], status: "verified" };
          return { rowCount: 1, rows: [] };
        }
        throw new Error(`Unexpected Chambers Latin America 2027 query: ${statement}`);
      },
    },
  };
}

test("el reconocimiento Chambers 2027 conserva bilingüismo, 12 prácticas y 26 profesionales relacionados", () => {
  assert.equal(CHAMBERS_LATIN_AMERICA_2027_RECOGNITION.date, "2026-08-29T12:00:00.000Z");
  assert.equal(CHAMBERS_LATIN_AMERICA_2027_RECOGNITION.practices.length, 12);
  assert.equal(CHAMBERS_LATIN_AMERICA_2027_RECOGNITION.relatedProfessionals.length, 26);
  assert.equal(new Set(CHAMBERS_LATIN_AMERICA_2027_RECOGNITION.relatedProfessionals).size, 26);
  assert.ok(CHAMBERS_LATIN_AMERICA_2027_RECOGNITION.relatedProfessionals.includes("alejandro-torres"));
  assert.ok(!CHAMBERS_LATIN_AMERICA_2027_RECOGNITION.relatedProfessionals.includes("alejandro-torres-associate"));
  assert.equal(CHAMBERS_LATIN_AMERICA_2027_RECOGNITION.sourceUrl, "https://lnkd.in/eWKSyTzj");
});

test("la migración publica un reconocimiento y conserva a los profesionales como relacionados, no como autores", async () => {
  const { client, state } = createClient();
  await publishChambersLatinAmerica2027Recognition(client);
  assert.equal(state.news?.published, true);
  assert.equal(state.news?.category, "rankings");
  assert.equal(state.news?.category_es, "Reconocimientos");
  assert.match(String(state.news?.content), /<h2>Ranked practices<\/h2>/);
  assert.match(String(state.news?.content_es), /<h2>Prácticas reconocidas<\/h2>/);
  assert.equal(state.relations.size, 26);
  assert.deepEqual([...state.relations.values()].every((relation) => relation.verificationStatus === "verified_manual" && relation.relationshipRole === "related"), true);
  assert.equal(state.sourceLink?.url, CHAMBERS_LATIN_AMERICA_2027_RECOGNITION.sourceUrl);

  await publishChambersLatinAmerica2027Recognition(client);
  assert.equal(state.relations.size, 26);
});

test("el runner autoriza sólo el contenido, las relaciones y la evidencia del reconocimiento", async () => {
  const runner = await readFile(new URL("../../scripts/run-migrations.mjs", import.meta.url), "utf8");
  assert.match(runner, /20260829_0015_publish_chambers_latin_america_2027_recognition\.mjs/);
  assert.match(runner, /allowedCountChanges:\s*new Set\(\["news", "news_team_members", "news_external_links"\]\)/);
});

test("el panel etiqueta la categoría técnica rankings como Reconocimientos", async () => {
  const schema = await readFile(new URL("../../shared/schema/news.ts", import.meta.url), "utf8");
  const adminList = await readFile(new URL("../../client/src/pages/admin/AdminNews.tsx", import.meta.url), "utf8");
  assert.match(schema, /value: "rankings", en: "Recognitions", es: "Reconocimientos"/);
  assert.match(adminList, /value: "rankings", en: "Recognitions", es: "Reconocimientos"/);
});
