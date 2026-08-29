import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const { KEY_ISSUES_MA_MEXICO_2026, default: publishKeyIssuesMaMexico2026 } = await import("../../migrations/20260829_0014_publish_key_issues_ma_mexico_2026.mjs");

function createClient() {
  let news: Record<string, unknown> | null = null;
  const relations = new Set<string>();
  const links = new Map<string, Record<string, unknown>>();

  return {
    state: { get news() { return news; }, relations, links },
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
            id: "key-issues-id", title, title_es: titleEs, excerpt, excerpt_es: excerptEs,
            content, content_es: contentEs, source_url: sourceUrl, slug, date, published,
            featured_home: featuredHome, category, category_es: categoryEs,
            processing_status: processingStatus, last_error: lastError,
          };
          return { rowCount: 1, rows: [{ id: "key-issues-id", slug }] };
        }
        if (statement.includes("INSERT INTO news_team_members")) {
          const key = `${params[0]}:${params[1]}`;
          const inserted = !relations.has(key);
          relations.add(key);
          return { rowCount: inserted ? 1 : 0, rows: [] };
        }
        if (statement.includes("INSERT INTO news_external_links")) {
          const key = `${params[0]}:${params[1]}:${params[2]}`;
          links.set(key, { kind: params[1], url: params[2], finalUrl: params[3] });
          return { rowCount: 1, rows: [] };
        }
        throw new Error(`Unexpected Key Issues M&A query: ${statement}`);
      },
    },
  };
}

test("el memorándum de M&A mantiene el PDF, fuente original, fecha de junio y autores explícitos", () => {
  assert.equal(KEY_ISSUES_MA_MEXICO_2026.title, "Key Issues in M&A and Cross-Border Transactions in Mexico");
  assert.equal(KEY_ISSUES_MA_MEXICO_2026.date, "2026-06-01T12:00:00.000Z");
  assert.equal(KEY_ISSUES_MA_MEXICO_2026.sourceUrl, "https://lnkd.in/gzqr-ZmV");
  assert.deepEqual(KEY_ISSUES_MA_MEXICO_2026.authors, ["luis-burgueno", "pablo-jimenez"]);
  assert.match(KEY_ISSUES_MA_MEXICO_2026.pdfPath, /^\/images\/PDF_news\/2026\/.*\.pdf$/);
  assert.match(KEY_ISSUES_MA_MEXICO_2026.pdfSha256, /^[a-f0-9]{64}$/);
  assert.equal(KEY_ISSUES_MA_MEXICO_2026.pdfSize, 7752716);
});

test("la migración publica una sola ficha, conserva PDF verificable y es idempotente", async () => {
  const { client, state } = createClient();
  await publishKeyIssuesMaMexico2026(client);
  assert.equal(state.news?.published, true);
  assert.equal(state.news?.category, "articles");
  assert.match(String(state.news?.content), /Download the memorandum \(PDF\)/);
  assert.match(String(state.news?.content_es), /Descargar el memorándum \(PDF\)/);
  assert.equal(state.relations.size, 2);
  assert.equal(state.links.size, 2);
  assert.ok([...state.links.values()].some((link) => link.kind === "source" && link.url === KEY_ISSUES_MA_MEXICO_2026.sourceUrl));
  assert.ok([...state.links.values()].some((link) => link.kind === "content" && link.url === KEY_ISSUES_MA_MEXICO_2026.pdfPath));

  await publishKeyIssuesMaMexico2026(client);
  assert.equal(state.relations.size, 2);
  assert.equal(state.links.size, 2);
});

test("el runner autoriza sólo el contenido, las autorías y la evidencia del memorándum", async () => {
  const runner = await readFile(new URL("../../scripts/run-migrations.mjs", import.meta.url), "utf8");
  assert.match(runner, /20260829_0014_publish_key_issues_ma_mexico_2026\.mjs/);
  assert.match(runner, /allowedCountChanges:\s*new Set\(\["news", "news_team_members", "news_external_links"\]\)/);
});
