import { readMirrorSources } from "./mirrorTestSources";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as cheerio from "cheerio";
import { readRouteSources } from "./routeTestSources";
import { readStorageSources } from "./storageTestSources";

process.env.DATABASE_URL ||= "postgresql://test:test@127.0.0.1:5432/test";

const { renderAttorney } = await import("../mirror/renderAttorney");
const { renderNewsDetail, renderNewsList } = await import("../mirror/renderNews");
const { ARTICLE_SUMMARY_CURATION_20260826 } = await import("@shared/articleSummaryCuration2026");

const attorneyTemplate = `<!doctype html><html><head><title>Profile</title></head><body><section class="page attorney"><div class="page--wrap wrap">
  <div class="attorney__meta--name"></div><div class="attorney__meta--role"></div>
  <div class="attorney__meta--img"><img id="foto"></div><div class="attorney__meta--txt"></div>
  <ul class="attorney__meta--list"></ul>
  <main class="attorney__content"><div class="attorney__content--intro"></div><div class="attorney__content--txt"></div></main>
  </div></section></body></html>`;

const newsTemplate = `<!doctype html><html><head><title>Publication</title></head><body><section class="page single"><div class="page--wrap wrap">
  <div class="single__meta--name"></div><div class="single__meta--list"></div><div class="single__meta--btns"></div>
  <main class="single__content"><div class="single__content--intro"></div><div class="single__content--txt"></div></main>
  </div></section></body></html>`;

test("el perfil muestra seis publicaciones propias y conserva el archivo bilingüe", () => {
  const relatedNews = Array.from({ length: 6 }, (_, index) => ({
    slug: `insight-${index + 1}`,
    title: `Insight ${index + 1}`,
    titleEs: `Perspectiva ${index + 1}`,
    excerpt: "A short editorial summary.",
    excerptEs: "Un resumen editorial breve.",
    category: "Articles",
    categoryEs: "Artículos",
    date: new Date(2026, index, 1),
    imageUrl: index === 0 ? "/uploads/insight.jpg" : null,
  }));
  const html = renderAttorney(attorneyTemplate, {
    name: "Ana Pérez",
    slug: "ana-perez",
    title: "Partner",
    titleEs: "Socia",
    role: "Partner",
    roleEs: "Socia",
    bio: "<p>Bio.</p>",
    bioEs: "<p>Biografía.</p>",
    relatedNews,
  }, "es");
  const $ = cheerio.load(html);

  assert.equal($(".attorney-related-insights").length, 1);
  assert.equal($(".attorney-related-insights__item").length, 6);
  assert.equal($(".attorney-related-insights__more").attr("href"), "/news?author=ana-perez");
  assert.equal($(".attorney-related-insights__item").first().find("a").first().attr("href"), "/news/insight-6");
  assert.equal($(".attorney-related-insights__item").first().find("time").text(), "Junio, 2026");
  assert.equal($(".page--wrap").next(".attorney-related-insights").length, 1);
  assert.equal($(".attorney__meta--list").text().includes("Noticias relacionadas"), false);
  assert.match($(".attorney-related-insights").text(), /Publicaciones de Ana Pérez/);
});

test("las publicaciones del perfil se ordenan por fecha descendente y declaran su fecha", () => {
  const html = renderAttorney(attorneyTemplate, {
    name: "Ana Pérez", slug: "ana-perez", title: "Partner", role: "Partner", bio: "<p>Bio.</p>",
    relatedNews: [
      { slug: "without-date", title: "Without date", titleEs: "Sin fecha", excerpt: "Summary", excerptEs: "Resumen", date: null },
      { slug: "older", title: "Older", titleEs: "Anterior", excerpt: "Summary", excerptEs: "Resumen", date: "2023-05-01" },
      { slug: "latest", title: "Most recent", titleEs: "Más reciente", excerpt: "Summary", excerptEs: "Resumen", date: "2026-08-26" },
    ],
  }, "es");
  const $ = cheerio.load(html);
  assert.deepEqual($(".attorney-related-insights__item h3").map((_, item) => $(item).text()).get(), ["Más reciente", "Anterior", "Sin fecha"]);
  assert.equal($(".attorney-related-insights__item").first().find("time").attr("datetime"), "2026-08-26");
  assert.match($(".attorney-related-insights__item").last().find(".attorney-related-insights__meta").text(), /Fecha no disponible/);
});

test("la fecha editorial no retrocede un mes por zona horaria", () => {
  const html = renderAttorney(attorneyTemplate, {
    name: "Ana Pérez", slug: "ana-perez", title: "Partner", role: "Partner", bio: "<p>Bio.</p>",
    relatedNews: [{ slug: "may", title: "May", titleEs: "Mayo", excerpt: "Summary", excerptEs: "Resumen", date: "2022-05-01" }],
  }, "es");
  assert.equal(cheerio.load(html)(".attorney-related-insights time").text(), "Mayo, 2022");
});

test("el perfil en inglés conserva enlaces relacionados e idioma", () => {
  const html = renderAttorney(attorneyTemplate, {
    name: "Ana Pérez", slug: "ana-perez", title: "Partner", titleEs: "Socia", role: "Partner", roleEs: "Socia",
    bio: "<p>Bio.</p>", relatedNews: [{ slug: "insight", title: "Insight", excerpt: "Summary", category: "Articles", date: "2026-06-01" }],
  }, "en");
  const $ = cheerio.load(html);
  assert.match($(".attorney-related-insights").text(), /Publications by Ana Pérez/);
  assert.equal($(".attorney-related-insights__more").attr("href"), "/news?author=ana-perez&lang=en");
  assert.equal($(".attorney-related-insights__item h3 a").attr("href"), "/news/insight?lang=en");
});

test("el perfil no crea una sección vacía de perspectivas", () => {
  const html = renderAttorney(attorneyTemplate, {
    name: "Sin publicaciones", slug: "sin-publicaciones", title: "Associate", role: "Associate", bio: "<p>Bio.</p>",
  }, "en");
  assert.equal(cheerio.load(html)(".attorney-related-insights").length, 0);
});

test("un perfil sin autoría propia muestra lecturas de su práctica sin atribuirlas", () => {
  const html = renderAttorney(attorneyTemplate, {
    name: "Ana Pérez", slug: "ana-perez", title: "Associate", role: "Associate", bio: "<p>Bio.</p>",
    practiceGroups: [{ name: "Corporate M&A", nameEs: "Corporativo / Fusiones y Adquisiciones" }],
    relatedReadings: [{ slug: "practice-reading", title: "Practice reading", titleEs: "Lectura de práctica", excerpt: "Summary", excerptEs: "Resumen", category: "Articles", categoryEs: "Artículos", date: "2026-06-01" }],
  }, "es");
  const $ = cheerio.load(html);
  assert.match($(".attorney-related-insights h2").text(), /Lecturas relacionadas/);
  assert.match($(".attorney-related-insights__description").text(), /Corporativo/);
  assert.doesNotMatch($(".attorney-related-insights").text(), /Publicaciones de Ana Pérez/);
});

test("las lecturas de práctica conservan el orden editorial sin un DISTINCT incompatible", () => {
  const storage = readStorageSources();
  const method = storage.match(/async getRelatedPublishedNewsForTeamMembers[\s\S]*?\n    }\n\n    \/\*\*/)?.[0] || "";
  assert.match(method, /\.select\(\{ item: news \}\)/);
  assert.doesNotMatch(method, /selectDistinct/);
  assert.match(method, /orderBy\(newsDateDescNullsLast\)/);
});

test("la publicación enlaza de vuelta a perfiles activos y expone autores en SEO", () => {
  const html = renderNewsDetail(newsTemplate, {
    slug: "new-rules", title: "New rules", titleEs: "Nuevas reglas", excerpt: "Summary", excerptEs: "Resumen",
    content: "<p>Body.</p>", contentEs: "<p>Cuerpo.</p>", date: "2026-06-01",
    relatedTeamMembers: [{ name: "Ana Pérez", slug: "ana-perez", title: "Partner", titleEs: "Socia", role: "Partner", roleEs: "Socia", imageUrl: "/uploads/ana.jpg" }],
    relatedNews: [
      { slug: "related-insight", title: "Related insight", titleEs: "Perspectiva relacionada", excerpt: "Summary", excerptEs: "Resumen", category: "Articles", categoryEs: "Artículos", date: "2026-05-01" },
      { slug: "another-insight", title: "Another insight", titleEs: "Otra perspectiva", excerpt: "Summary", excerptEs: "Resumen", category: "Articles", categoryEs: "Artículos", date: "2026-04-01" },
    ],
  }, "es");
  const $ = cheerio.load(html);
  assert.equal($(".news-related-attorneys").length, 1);
  assert.equal($(".news-related-attorneys h3 a").attr("href"), "/abogado/ana-perez");
  assert.match($(".news-related-attorneys").text(), /Autores de esta publicación/);
  assert.equal($(".news-related-insights__item").length, 2);
  assert.equal($(".news-related-insights h3 a").first().attr("href"), "/news/related-insight");
  assert.equal($(".page--wrap").next(".news-related-insights").length, 1);
  assert.match(html, /"@type":"Person"/);
  assert.match(html, /Ana Pérez/);
});

test("el archivo conserva el filtro de autor al buscar y paginar", () => {
  const template = `<!doctype html><html><head></head><body><div class="archive__filters"><form><input class="news_search" name="q"></form></div><div class="archive__list"></div><div class="pagination"></div></body></html>`;
  const html = renderNewsList(template, [], "en", { page: 2, totalPages: 3 }, {
    basePath: "/news",
    query: "tax",
    author: { name: "Ana Pérez", slug: "ana-perez" },
  });
  const $ = cheerio.load(html);
  assert.equal($("input[name=author]").attr("value"), "ana-perez");
  assert.match($(".vw-search-summary").text(), /Publications by Ana Pérez/);
  assert.match($(".pagination-dyn").html() || "", /author=ana-perez/);
  assert.match($(".pagination-dyn").html() || "", /lang=en/);
  assert.match($("link[hreflang='es-MX']").attr("href") || "", /\/news\?q=tax&author=ana-perez&page=2$/);
  assert.match($("link[hreflang='en']").attr("href") || "", /\/news\?q=tax&author=ana-perez&page=2&lang=en$/);
});

test("los Artículos no repiten el título ni imprimen URLs crudas, y exponen su fuente segura", () => {
  const archived = renderNewsList(
    `<!doctype html><html><head></head><body><div class="archive__list"></div></body></html>`,
    [{
      slug: "legacy-article",
      category: "articles",
      title: "Legacy article",
      titleEs: "Artículo histórico",
      excerpt: "https://source.example/original.pdf",
      excerptEs: "https://source.example/original.pdf",
      sourceUrl: "https://source.example/original.pdf",
      date: "2026-08-26",
    }],
    "es",
  );
  const detail = renderNewsDetail(newsTemplate, {
    slug: "legacy-article",
    category: "articles",
    title: "Legacy article",
    titleEs: "Artículo histórico",
    excerpt: "Legacy article",
    excerptEs: "Artículo histórico",
    content: "PDF",
    contentEs: "Introducción",
    sourceUrl: "https://source.example/original.pdf",
    date: "2026-08-26",
  }, "es");
  const $archive = cheerio.load(archived);
  const $detail = cheerio.load(detail);

  assert.equal($archive(".archive__item--intro").text().trim(), "");
  assert.equal($archive(".vw-news-source-link a").text().trim(), "Ver publicación original");
  assert.equal($archive(".vw-news-source-link a").attr("href"), "https://source.example/original.pdf");
  assert.equal($archive(".vw-news-source-link a").attr("target"), "_blank");
  assert.equal($archive(".vw-news-source-link a").attr("rel"), "noopener noreferrer");
  assert.equal($detail(".single__content--intro").text().trim(), "");
  assert.equal($detail(".single__content--txt").text().trim(), "");
  assert.equal($detail(".vw-news-source-link a").text().trim(), "Ver publicación original");
  assert.equal($detail(".single__meta--name").text().trim(), "Artículo histórico");
});

test("la curación cubre exactamente los 55 Artículos deficientes con fuente HTTPS", () => {
  assert.equal(ARTICLE_SUMMARY_CURATION_20260826.length, 55);
  assert.equal(new Set(ARTICLE_SUMMARY_CURATION_20260826.map((entry) => entry.slug)).size, 55);
  assert.equal(ARTICLE_SUMMARY_CURATION_20260826.filter((entry) => entry.excerpt && entry.excerptEs).length, 37);
  assert.equal(ARTICLE_SUMMARY_CURATION_20260826.filter((entry) => !entry.excerpt && !entry.excerptEs).length, 18);
  assert.equal(ARTICLE_SUMMARY_CURATION_20260826.filter((entry) => entry.replaceableSourceUrls?.length).length, 6);
  for (const entry of ARTICLE_SUMMARY_CURATION_20260826) {
    assert.match(entry.sourceUrl, /^https:\/\//);
    for (const replaceableSourceUrl of entry.replaceableSourceUrls ?? []) {
      assert.match(replaceableSourceUrl, /^https:\/\//);
      assert.notEqual(replaceableSourceUrl, entry.sourceUrl);
    }
  }
});

test("el panel manda vínculos desde la creación y expone revisión humana", () => {
  const form = readFileSync(new URL("../../client/src/pages/admin/AdminNewsForm.tsx", import.meta.url), "utf8");
  const review = readFileSync(new URL("../../client/src/pages/admin/AdminNewsAuthorReview.tsx", import.meta.url), "utf8");
  const routes = readRouteSources();
  assert.match(form, /teamMemberIds:\s*authorIds/);
  assert.match(form, /tags:\s*form\.tags/);
  assert.match(form, /input-author-search/);
  assert.match(form, /input-editorial-tags/);
  assert.match(form, /input-source-url/);
  assert.match(form, /sourceOnlyArticle/);
  assert.match(review, /Confirmar vínculos/);
  assert.match(routes, /\/api\/admin\/news\/author-review/);
  assert.match(routes, /createNewsWithTeamMembers/);
  assert.match(routes, /editorialTagsSchema/);
  assert.match(routes, /sourceUrlSchema/);
  assert.match(routes, /verified source for Articles/);
});

test("las perspectivas del perfil se presentan en una franja horizontal antes del footer", () => {
  const css = readFileSync(new URL("../../frontend-mirror/templates/beez3/css/von.css", import.meta.url), "utf8");
  assert.match(css, /\.attorney > \.attorney-related-insights/);
  assert.match(css, /grid-auto-flow: column/);
  assert.match(css, /overflow-x: auto/);
});

test("el detalle recomienda publicaciones por etiquetas, autores y categoría sin repetir la actual", () => {
  const storage = readStorageSources();
  const mirror = readMirrorSources();
  const css = readFileSync(new URL("../../frontend-mirror/templates/beez3/css/von.css", import.meta.url), "utf8");
  assert.match(storage, /getEditorialRecommendations/);
  assert.match(storage, /arrayOverlaps\(news\.tags, tags\)/);
  assert.match(storage, /ne\(news\.id, opts\.excludeNewsId\)/);
  assert.match(mirror, /excludeNewsId: item\.id/);
  assert.match(mirror, /tags: item\.tags \|\| \[\]/);
  assert.match(css, /\.single > \.news-related-insights/);
});
