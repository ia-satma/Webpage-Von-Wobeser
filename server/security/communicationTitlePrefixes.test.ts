import assert from "node:assert/strict";
import test from "node:test";

test("la migración de Comunicaciones cambia exactamente cinco títulos y es idempotente", async () => {
  const {
    default: removeCommunicationTitlePrefixes,
    COMMUNICATION_TITLE_PREFIX_FIXES,
  } = await import("../../migrations/20260829_0004_remove_communication_title_prefixes.mjs");
  const rows = COMMUNICATION_TITLE_PREFIX_FIXES.map((entry, index) => ({
    id: `news-${index}`,
    slug: entry.slug,
    category: "news",
    published: true,
    title: entry.title,
    title_es: entry.titleEs,
    excerpt: `excerpt-${index}`,
    content: `content-${index}`,
    source_url: `https://example.com/${index}`,
    featured_home: false,
  }));
  let updates = 0;
  const client = {
    query: async (statement: string, params?: string[]) => {
      if (statement.includes("SELECT id, slug, category, published, title, title_es")) {
        return { rowCount: rows.length, rows };
      }
      if (statement.includes("UPDATE news")) {
        const [title, titleEs, id, expectedTitle, expectedTitleEs] = params!;
        const row = rows.find((entry) => entry.id === id && entry.title === expectedTitle && entry.title_es === expectedTitleEs);
        if (!row) return { rowCount: 0, rows: [] };
        row.title = title;
        row.title_es = titleEs;
        updates += 1;
        return { rowCount: 1, rows: [row] };
      }
      if (statement.includes("title ~* $1 OR title_es ~* $1")) {
        const prefix = /^(?:alerta\s+(?:legal|a\s+clientes)|client\s+alert|legal\s+alert)\s*:/i;
        const remaining = rows.filter((entry) => prefix.test(entry.title) || prefix.test(entry.title_es));
        return { rowCount: remaining.length, rows: remaining };
      }
      throw new Error(`Unexpected query: ${statement}`);
    },
  };

  await removeCommunicationTitlePrefixes(client);
  assert.equal(updates, 5);
  for (const [index, entry] of COMMUNICATION_TITLE_PREFIX_FIXES.entries()) {
    assert.equal(rows[index].title, entry.correctedTitle);
    assert.equal(rows[index].title_es, entry.correctedTitleEs);
    assert.equal(rows[index].excerpt, `excerpt-${index}`);
    assert.equal(rows[index].content, `content-${index}`);
    assert.equal(rows[index].source_url, `https://example.com/${index}`);
  }

  await removeCommunicationTitlePrefixes(client);
  assert.equal(updates, 5);
});

test("la migración rechaza una edición de Administración que ya no coincide", async () => {
  const {
    default: removeCommunicationTitlePrefixes,
    COMMUNICATION_TITLE_PREFIX_FIXES,
  } = await import("../../migrations/20260829_0004_remove_communication_title_prefixes.mjs");
  const rows = COMMUNICATION_TITLE_PREFIX_FIXES.map((entry, index) => ({
    id: `news-${index}`,
    slug: entry.slug,
    category: "news",
    published: true,
    title: index === 0 ? "Título editado desde Administración" : entry.title,
    title_es: entry.titleEs,
  }));
  const client = {
    query: async (statement: string) => {
      if (statement.includes("SELECT id, slug, category, published, title, title_es")) {
        return { rowCount: rows.length, rows };
      }
      throw new Error(`Unexpected write: ${statement}`);
    },
  };

  await assert.rejects(removeCommunicationTitlePrefixes(client), /Refusing to overwrite an unexpected Communication title/);
});
