import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as cheerio from "cheerio";

process.env.DATABASE_URL ||= "postgresql://test:test@127.0.0.1:5432/test";

const { renderAttorney } = await import("../mirror/renderAttorney");
const { renderNewsDetail, renderNewsList } = await import("../mirror/renderNews");

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

test("el perfil muestra seis perspectivas editoriales y conserva el archivo bilingüe", () => {
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
  assert.equal($(".attorney-related-insights__item").first().find("a").first().attr("href"), "/news/insight-1");
  assert.equal($(".page--wrap").next(".attorney-related-insights").length, 1);
  assert.equal($(".attorney__meta--list").text().includes("Noticias relacionadas"), false);
  assert.match($(".attorney-related-insights").text(), /Perspectivas relacionadas/);
});

test("el perfil en inglés conserva enlaces relacionados e idioma", () => {
  const html = renderAttorney(attorneyTemplate, {
    name: "Ana Pérez", slug: "ana-perez", title: "Partner", titleEs: "Socia", role: "Partner", roleEs: "Socia",
    bio: "<p>Bio.</p>", relatedNews: [{ slug: "insight", title: "Insight", excerpt: "Summary", category: "Articles", date: "2026-06-01" }],
  }, "en");
  const $ = cheerio.load(html);
  assert.equal($(".attorney-related-insights__more").attr("href"), "/news?author=ana-perez&lang=en");
  assert.equal($(".attorney-related-insights__item h3 a").attr("href"), "/news/insight?lang=en");
});

test("el perfil no crea una sección vacía de perspectivas", () => {
  const html = renderAttorney(attorneyTemplate, {
    name: "Sin publicaciones", slug: "sin-publicaciones", title: "Associate", role: "Associate", bio: "<p>Bio.</p>",
  }, "en");
  assert.equal(cheerio.load(html)(".attorney-related-insights").length, 0);
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
});

test("el panel manda vínculos desde la creación y expone revisión humana", () => {
  const form = readFileSync(new URL("../../client/src/pages/admin/AdminNewsForm.tsx", import.meta.url), "utf8");
  const review = readFileSync(new URL("../../client/src/pages/admin/AdminNewsAuthorReview.tsx", import.meta.url), "utf8");
  const routes = readFileSync(new URL("../routes.ts", import.meta.url), "utf8");
  assert.match(form, /teamMemberIds:\s*authorIds/);
  assert.match(form, /tags:\s*form\.tags/);
  assert.match(form, /input-author-search/);
  assert.match(form, /input-editorial-tags/);
  assert.match(review, /Confirmar vínculos/);
  assert.match(routes, /\/api\/admin\/news\/author-review/);
  assert.match(routes, /createNewsWithTeamMembers/);
  assert.match(routes, /editorialTagsSchema/);
});

test("las perspectivas del perfil se presentan en una franja horizontal antes del footer", () => {
  const css = readFileSync(new URL("../../frontend-mirror/templates/beez3/css/von.css", import.meta.url), "utf8");
  assert.match(css, /\.attorney > \.attorney-related-insights/);
  assert.match(css, /grid-auto-flow: column/);
  assert.match(css, /overflow-x: auto/);
});

test("el detalle recomienda publicaciones por etiquetas, autores y categoría sin repetir la actual", () => {
  const storage = readFileSync(new URL("../storage.ts", import.meta.url), "utf8");
  const mirror = readFileSync(new URL("../mirror/index.ts", import.meta.url), "utf8");
  const css = readFileSync(new URL("../../frontend-mirror/templates/beez3/css/von.css", import.meta.url), "utf8");
  assert.match(storage, /getEditorialRecommendations/);
  assert.match(storage, /arrayOverlaps\(news\.tags, tags\)/);
  assert.match(storage, /ne\(news\.id, opts\.excludeNewsId\)/);
  assert.match(mirror, /excludeNewsId: item\.id/);
  assert.match(mirror, /tags: item\.tags \|\| \[\]/);
  assert.match(css, /\.single > \.news-related-insights/);
});
