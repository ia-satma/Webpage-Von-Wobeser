import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationModule = await import("../../migrations/20260829_0013_import_cmdn_editorial_calendar_articles.mjs");
const { CMDN_EDITORIAL_CALENDAR_ARTICLES, default: importCmdnEditorialCalendarArticles } = migrationModule;

function createCalendarClient() {
  const news = new Map<string, Record<string, unknown>>();
  const relations = new Set<string>();
  const links = new Map<string, Record<string, unknown>>();
  const authorSlugs = [...new Set(CMDN_EDITORIAL_CALENDAR_ARTICLES.flatMap((entry: { authors: string[] }) => entry.authors))];

  return {
    news,
    relations,
    links,
    client: {
      query: async (statement: string, params: unknown[] = []) => {
        if (statement.includes("FROM news") && statement.includes("FOR UPDATE")) {
          return { rowCount: news.size, rows: [...news.values()] };
        }
        if (statement.includes("FROM team_members")) {
          const requested = params[0] as string[];
          const rows = requested
            .filter((slug) => authorSlugs.includes(slug))
            .map((slug) => ({ id: `member-${slug}`, slug, published: true }));
          return { rowCount: rows.length, rows };
        }
        if (statement.includes("INSERT INTO news (")) {
          const [title, titleEs, excerpt, excerptEs, content, contentEs, sourceUrl, slug, date, published, featuredHome, category, categoryEs, processingStatus, lastError] = params;
          const id = `news-${slug}`;
          const row = {
            id,
            title,
            title_es: titleEs,
            excerpt,
            excerpt_es: excerptEs,
            content,
            content_es: contentEs,
            source_url: sourceUrl,
            slug,
            date,
            published,
            featured_home: featuredHome,
            category,
            category_es: categoryEs,
            processing_status: processingStatus,
            last_error: lastError,
          };
          news.set(String(slug), row);
          return { rowCount: 1, rows: [{ id, slug }] };
        }
        if (statement.includes("INSERT INTO news_team_members")) {
          const [newsId, teamMemberId] = params;
          const key = `${newsId}:${teamMemberId}`;
          if (relations.has(key)) return { rowCount: 0, rows: [] };
          relations.add(key);
          return { rowCount: 1, rows: [{ id: key }] };
        }
        if (statement.includes("INSERT INTO news_external_links")) {
          const [newsId, url, status, finalUrl, failureCode] = params;
          const key = `${newsId}:${url}:source`;
          const current = links.get(key);
          const next = { newsId, url, status, finalUrl, failureCode };
          if (current && JSON.stringify(current) === JSON.stringify(next)) return { rowCount: 0, rows: [] };
          links.set(key, next);
          return { rowCount: 1, rows: [{ id: key }] };
        }
        throw new Error(`Unexpected query in CMDN calendar test: ${statement}`);
      },
    },
  };
}

test("el calendario CMDN conserva los veinticinco registros y publica sólo los diecinueve con fuente", () => {
  assert.equal(CMDN_EDITORIAL_CALENDAR_ARTICLES.length, 25);
  assert.equal(CMDN_EDITORIAL_CALENDAR_ARTICLES.filter((entry: { published: boolean }) => entry.published).length, 19);
  assert.equal(CMDN_EDITORIAL_CALENDAR_ARTICLES.filter((entry: { sourceUrl?: string }) => entry.sourceUrl).length, 19);
  assert.deepEqual(
    CMDN_EDITORIAL_CALENDAR_ARTICLES.filter((entry: { published: boolean }) => !entry.published).map((entry: { row: number }) => entry.row),
    [20, 21, 22, 23, 74, 91],
  );
  assert.equal(CMDN_EDITORIAL_CALENDAR_ARTICLES.find((entry: { row: number }) => entry.row === 6)?.date, "2025-01-28T12:00:00.000Z");
  for (const entry of CMDN_EDITORIAL_CALENDAR_ARTICLES.filter((item: { published: boolean }) => item.published)) {
    assert.match(entry.sourceUrl, /^https:\/\//);
    assert.ok(entry.date);
    assert.ok(entry.authors.length);
  }
});

test("la importación crea artículos editables, autorías manuales y evidencia sin sobrescribir contenido", async () => {
  const { client, news, relations, links } = createCalendarClient();
  await importCmdnEditorialCalendarArticles(client);

  assert.equal(news.size, 25);
  assert.equal([...news.values()].filter((row) => row.published === true).length, 19);
  assert.equal([...news.values()].filter((row) => row.published === false).length, 6);
  assert.equal(relations.size, CMDN_EDITORIAL_CALENDAR_ARTICLES.reduce((total: number, entry: { authors: string[] }) => total + entry.authors.length, 0));
  assert.equal(links.size, 16);
  assert.equal(news.get("sustainable-finance-mexico-regulatory-obligations-applicable-esg-standards")?.published, true);
  assert.equal(news.get("usmca-selective-paused-investment-border-limit")?.published, true);
  assert.equal(links.has("news-usmca-selective-paused-investment-border-limit:https://testigos.aintrmex.com/?naaa=68FCB118-9DC1-46B1-882E-F1EFFC74190E:source"), false);

  const before = { news: news.size, relations: relations.size, links: links.size };
  await importCmdnEditorialCalendarArticles(client);
  assert.deepEqual({ news: news.size, relations: relations.size, links: links.size }, before);
});

test("el runner permite únicamente las tres tablas necesarias para la importación CMDN", async () => {
  const runner = await readFile(new URL("../../scripts/run-migrations.mjs", import.meta.url), "utf8");
  assert.match(runner, /20260829_0013_import_cmdn_editorial_calendar_articles\.mjs/);
  assert.match(runner, /allowedCountChanges:\s*new Set\(\["news", "news_team_members", "news_external_links"\]\)/);
});
