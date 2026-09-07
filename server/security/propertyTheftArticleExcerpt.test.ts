import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { renderNewsList } from "../mirror/renderNews";

const migrationModule = await import("../../migrations/20260907_0001_add_property_theft_article_excerpt.mjs");
const { PROPERTY_THEFT_ARTICLE_EXCERPT, default: addPropertyTheftArticleExcerpt } = migrationModule;

function createClient(overrides: Record<string, unknown> = {}) {
  const row: Record<string, unknown> = {
    id: "property-theft-article",
    slug: PROPERTY_THEFT_ARTICLE_EXCERPT.slug,
    category: "articles",
    title: PROPERTY_THEFT_ARTICLE_EXCERPT.title,
    title_es: PROPERTY_THEFT_ARTICLE_EXCERPT.titleEs,
    excerpt: "",
    excerpt_es: "",
    ...overrides,
  };
  let updates = 0;
  return {
    row,
    updateCount: () => updates,
    client: {
      query: async (statement: string, params: unknown[] = []) => {
        if (statement.includes("SELECT id, slug, category") && statement.includes("FOR UPDATE")) {
          return { rowCount: 1, rows: [row] };
        }
        if (statement.includes("UPDATE news")) {
          assert.deepEqual(params, [PROPERTY_THEFT_ARTICLE_EXCERPT.excerpt, PROPERTY_THEFT_ARTICLE_EXCERPT.excerptEs, row.id]);
          assert.equal(row.excerpt, "");
          assert.equal(row.excerpt_es, "");
          row.excerpt = PROPERTY_THEFT_ARTICLE_EXCERPT.excerpt;
          row.excerpt_es = PROPERTY_THEFT_ARTICLE_EXCERPT.excerptEs;
          updates += 1;
          return { rowCount: 1, rows: [{ id: row.id, slug: row.slug, excerpt: row.excerpt, excerpt_es: row.excerpt_es }] };
        }
        throw new Error(`Unexpected query: ${statement}`);
      },
    },
  };
}

test("el extracto faltante se completa una vez y conserva la ficha editable", async () => {
  const { client, row, updateCount } = createClient();
  await addPropertyTheftArticleExcerpt(client);
  assert.equal(row.excerpt, PROPERTY_THEFT_ARTICLE_EXCERPT.excerpt);
  assert.equal(row.excerpt_es, PROPERTY_THEFT_ARTICLE_EXCERPT.excerptEs);
  assert.equal(updateCount(), 1);

  await addPropertyTheftArticleExcerpt(client);
  assert.equal(updateCount(), 1);
});

test("la corrección no sobrescribe un extracto editado desde Administración", async () => {
  const { client, updateCount } = createClient({ excerpt: "Resumen editado desde Administración" });
  await assert.rejects(() => addPropertyTheftArticleExcerpt(client), /Refusing to overwrite an Administration edit/);
  assert.equal(updateCount(), 0);
});

test("la migración aditiva queda registrada para instalaciones actuales y nuevas", async () => {
  const runner = await readFile(new URL("../../scripts/run-migrations.mjs", import.meta.url), "utf8");
  assert.match(runner, /20260907_0001_add_property_theft_article_excerpt\.mjs/);
});

test("el archivo de Artículos muestra título, extracto y fuente original en ambos idiomas", () => {
  const template = "<!doctype html><html><head></head><body><div class=\"archive__list\"></div></body></html>";
  const item = {
    slug: PROPERTY_THEFT_ARTICLE_EXCERPT.slug,
    category: "articles",
    title: PROPERTY_THEFT_ARTICLE_EXCERPT.title,
    titleEs: PROPERTY_THEFT_ARTICLE_EXCERPT.titleEs,
    excerpt: PROPERTY_THEFT_ARTICLE_EXCERPT.excerpt,
    excerptEs: PROPERTY_THEFT_ARTICLE_EXCERPT.excerptEs,
    date: new Date("2026-08-01T00:00:00.000Z"),
    sourceUrl: "https://www.milenio.com/negocios/despojo-inmobiliario-mexico-riesgos-proteger-propiedad?promo_code=10OFF",
  };

  const options = {
    basePath: "/articles",
    editorialHeader: {
      eyebrow: { en: "Insights", es: "Insights" },
      title: { en: "Articles", es: "Artículos" },
      description: { en: "Legal articles", es: "Artículos legales" },
    },
  };
  const english = renderNewsList(template, [item], "en", undefined, options);
  const spanish = renderNewsList(template, [item], "es", undefined, options);

  assert.match(english, new RegExp(PROPERTY_THEFT_ARTICLE_EXCERPT.excerpt));
  assert.match(spanish, new RegExp(PROPERTY_THEFT_ARTICLE_EXCERPT.excerptEs));
  assert.match(english, /Read original publication/);
  assert.match(spanish, /Ver publicación original/);
  assert.match(english, /target="_blank" rel="noopener noreferrer"/);
});
