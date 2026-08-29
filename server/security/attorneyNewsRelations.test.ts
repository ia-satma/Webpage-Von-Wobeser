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

test("el perfil muestra tres publicaciones propias junto a la biografía y conserva el archivo bilingüe", () => {
  const relatedNews = Array.from({ length: 3 }, (_, index) => ({
    slug: `insight-${index + 1}`,
    title: `Insight ${index + 1}`,
    titleEs: `Perspectiva ${index + 1}`,
    excerpt: "A short editorial summary.",
    excerptEs: "Un resumen editorial breve.",
    category: "Articles",
    categoryEs: "Artículos",
    date: new Date(2026, index + 3, 1),
    imageUrl: index === 0 ? "/uploads/insight.jpg" : null,
  }));
  const html = renderAttorney(attorneyTemplate, {
    name: "Ana Pérez",
    slug: "ana-perez",
    title: "Partner",
    titleEs: "Socia",
    role: "Partner",
    roleEs: "Socia",
    bioIntro: "<p>Short professional introduction.</p>",
    bioIntroEs: "<p>Introducción profesional breve.</p>",
    bio: "<p>Professional background.</p>",
    bioEs: "<p>Trayectoria profesional.</p>",
    relatedNews,
  }, "es");
  const $ = cheerio.load(html);

  assert.equal($(".attorney-related-insights").length, 1);
  assert.equal($(".attorney-related-insights__item").length, 3);
  assert.equal($(".attorney-related-insights__more").attr("href"), "/news?author=ana-perez");
  assert.equal($(".attorney-related-insights__item").first().find("a").first().attr("href"), "/news/insight-3");
  assert.equal($(".attorney-related-insights__item").first().find("time").text(), "Junio, 2026");
  assert.equal($(".attorney-bio-disclosure").attr("open"), undefined);
  assert.equal($(".attorney-bio-disclosure__show").text(), "Mostrar biografía completa");
  assert.equal($(".attorney-bio-disclosure__hide").text(), "Ver menos");
  assert.equal($(".attorney-bio-disclosure").next(".attorney-related-insights").length, 1);
  assert.equal($("h1.attorney__meta--name").length, 1);
  assert.equal($("h1").length, 1);
  assert.equal($(".attorney__meta--list.list_JS").length, 1);
  assert.equal($(".attorney-profile__nav").length, 0);
  assert.equal($(".attorney__meta--list").text().includes("Noticias relacionadas"), false);
  assert.match($(".attorney-related-insights h2").text(), /^Insights$/);
});

test("las publicaciones del perfil excluyen fechas ausentes y conservan orden descendente", () => {
  const html = renderAttorney(attorneyTemplate, {
    name: "Ana Pérez", slug: "ana-perez", title: "Partner", role: "Partner", bio: "<p>Bio.</p>",
    relatedNews: [
      { slug: "without-date", title: "Without date", titleEs: "Sin fecha", excerpt: "Summary", excerptEs: "Resumen", date: null },
      { slug: "older", title: "Older", titleEs: "Anterior", excerpt: "Summary", excerptEs: "Resumen", date: "2023-05-01" },
      { slug: "latest", title: "Most recent", titleEs: "Más reciente", excerpt: "Summary", excerptEs: "Resumen", date: "2026-08-26" },
    ],
  }, "es");
  const $ = cheerio.load(html);
  assert.deepEqual($(".attorney-related-insights__item h3").map((_, item) => $(item).text()).get(), ["Más reciente", "Anterior"]);
  assert.equal($(".attorney-related-insights__item").first().find("time").attr("datetime"), "2026-08-26");
  assert.equal($(".attorney-related-insights__item time").length, 2);
  assert.doesNotMatch(html, /Fecha no disponible|Date unavailable/);
});

test("un perfil con sólo publicaciones sin fecha no muestra Insights", () => {
  const html = renderAttorney(attorneyTemplate, {
    name: "Ana Pérez", slug: "ana-perez", title: "Partner", role: "Partner", bio: "<p>Bio.</p>",
    relatedNews: [{ slug: "without-date", title: "Without date", titleEs: "Sin fecha", excerpt: "Summary", excerptEs: "Resumen", date: null }],
  }, "es");
  assert.equal(cheerio.load(html)(".attorney-related-insights").length, 0);
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
  assert.match($(".attorney-related-insights h2").text(), /^Insights$/);
  assert.equal($(".attorney-related-insights__more").attr("href"), "/news?author=ana-perez&lang=en");
  assert.equal($(".attorney-related-insights__item h3 a").attr("href"), "/news/insight?lang=en");
});

test("la columna lateral conserva su acordeón gris y sus relaciones públicas", () => {
  const html = renderAttorney(attorneyTemplate, {
    name: "Ana Pérez", slug: "ana-perez", title: "Partner", titleEs: "Socia", role: "Partner", roleEs: "Socia",
    bioIntro: "<p>Introducción.</p>", bioIntroEs: "<p>Introducción.</p>",
    bio: "<p>Experiencia profesional.</p>", bioEs: "<p>Experiencia profesional.</p>",
    practiceGroups: [{ slug: "corporate", name: "Corporate", nameEs: "Corporativo" }],
    industryGroups: [{ slug: "energy", name: "Energy", nameEs: "Energía" }],
    rankings: [{ ranking: "Band 1", rankingEs: "Banda 1", publication: "Chambers", publicationEs: "Chambers" }],
    education: [{ degree: "Law degree", degreeEs: "Licenciatura en Derecho", school: "University", schoolEs: "Universidad" }],
    affiliations: [{ organization: "Association", organizationEs: "Asociación" }],
    relatedNews: [{ slug: "insight", title: "Insight", titleEs: "Perspectiva", excerpt: "Summary", excerptEs: "Resumen", date: "2026-06-01" }],
  }, "es");
  const $ = cheerio.load(html);

  assert.equal($(".attorney__meta--list.list_JS a[href='/practice/corporate']").text(), "Corporativo");
  assert.equal($(".attorney__meta--list.list_JS a[href='/industry/energy']").text(), "Energía");
  assert.match($(".attorney__meta--list").text(), /Educación y experiencia/);
  assert.match($(".attorney__meta--list").text(), /Afiliaciones y actividades académicas/);
  assert.match($(".attorney__meta--list ul#recognitions").text(), /Banda 1/);
  assert.match($(".attorney__meta--list").text(), /Licenciatura en Derecho/);
  assert.match($(".attorney__meta--list ul#affiliations").text(), /Asociación/);
  assert.equal($(".attorney-profile__nav").length, 0);
  assert.equal($(".attorney__content").text().includes("Banda 1"), false);
  assert.equal($(".attorney__content").text().includes("Licenciatura en Derecho"), false);
  assert.equal($(".attorney-bio-disclosure").attr("open"), undefined);
});

test("el perfil no crea una sección vacía de perspectivas", () => {
  const html = renderAttorney(attorneyTemplate, {
    name: "Sin publicaciones", slug: "sin-publicaciones", title: "Associate", role: "Associate", bio: "<p>Bio.</p>",
  }, "en");
  const $ = cheerio.load(html);
  assert.equal($(".attorney-related-insights").length, 0);
  assert.equal($(".attorney__meta--list.list_JS > li").length, 0);
});

test("un perfil sin autoría propia no recibe lecturas de práctica ni atribuciones inferidas", () => {
  const html = renderAttorney(attorneyTemplate, {
    name: "Ana Pérez", slug: "ana-perez", title: "Associate", role: "Associate", bio: "<p>Bio.</p>",
    practiceGroups: [{ name: "Corporate M&A", nameEs: "Corporativo / Fusiones y Adquisiciones" }],
    relatedReadings: [{ slug: "practice-reading", title: "Practice reading", titleEs: "Lectura de práctica", excerpt: "Summary", excerptEs: "Resumen", category: "Articles", categoryEs: "Artículos", date: "2026-06-01" }],
  }, "es");
  const $ = cheerio.load(html);
  assert.equal($(".attorney-related-insights").length, 0);
});

test("las recomendaciones del detalle sólo consideran relaciones verificadas", () => {
  const storage = readStorageSources();
  const method = storage.match(/async getRelatedPublishedNewsForTeamMembers[\s\S]*?\n    }\n\n    \/\*\*/)?.[0] || "";
  assert.match(method, /\.select\(\{ item: news \}\)/);
  assert.doesNotMatch(method, /selectDistinct/);
  assert.match(method, /orderBy\(newsDateDescNullsLast\)/);
  assert.match(method, /verifiedAuthorRelation/);
  assert.match(method, /isNotNull\(news\.date\)/);
});

test("la publicación enlaza de vuelta a perfiles activos y expone autores en SEO", () => {
  const html = renderNewsDetail(newsTemplate, {
    slug: "new-rules", title: "New rules", titleEs: "Nuevas reglas", excerpt: "Summary", excerptEs: "Resumen",
    content: "<p>Body.</p>", contentEs: "<p>Cuerpo.</p>", date: "2026-06-01",
    relatedTeamMembers: [{ name: "Ana Pérez", slug: "ana-perez", title: "Partner", titleEs: "Socia", role: "Partner", roleEs: "Socia", imageUrl: "/uploads/ana.jpg" }],
    relatedNews: [
      { slug: "related-insight", title: "Related insight", titleEs: "Perspectiva relacionada", excerpt: "Summary", excerptEs: "Resumen", category: "Articles", categoryEs: "Artículos", date: "2026-05-01" },
      { slug: "another-insight", title: "Another insight", titleEs: "Otra perspectiva", excerpt: "Summary", excerptEs: "Resumen", category: "Articles", categoryEs: "Artículos", date: "2026-04-01" },
      { slug: "undated-insight", title: "Undated insight", titleEs: "Perspectiva sin fecha", excerpt: "Summary", excerptEs: "Resumen", category: "Articles", categoryEs: "Artículos", date: null },
    ],
  }, "es");
  const $ = cheerio.load(html);
  assert.equal($(".news-related-attorneys").length, 1);
  assert.equal($(".news-related-attorneys h3 a").attr("href"), "/abogado/ana-perez");
  assert.match($(".news-related-attorneys").text(), /Autores de esta publicación/);
  assert.equal($(".news-related-insights__item").length, 2);
  assert.equal($(".news-related-insights").text().includes("Perspectiva sin fecha"), false);
  assert.equal($(".news-related-insights h3 a").first().attr("href"), "/news/related-insight");
  assert.equal($(".page--wrap").next(".news-related-insights").length, 1);
  assert.match(html, /"@type":"Person"/);
  assert.match(html, /Ana Pérez/);
});

test("las miniaturas de autores mantienen el encuadre vertical sin cortar la cabeza", () => {
  const css = readFileSync(new URL("../../frontend-mirror/templates/beez3/css/von.css", import.meta.url), "utf8");
  const imageFrame = css.match(/\.news-related-attorneys__image\s*\{([\s\S]*?)\n\}/)?.[1] || "";
  const image = css.match(/\.news-related-attorneys__image img\s*\{([\s\S]*?)\n\}/)?.[1] || "";

  assert.match(imageFrame, /width:\s*64px/);
  assert.match(imageFrame, /height:\s*80px/);
  assert.match(image, /object-fit:\s*cover/);
  assert.match(image, /object-position:\s*center top/);
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
  const legacyOfficialRoutes = ARTICLE_SUMMARY_CURATION_20260826.filter((entry) => /vonwobeser\.com\/index\.php\/(?:publication|publicacion)\?p_id=\d+$/.test(entry.sourceUrl));
  assert.equal(legacyOfficialRoutes.length, 16);
  for (const entry of ARTICLE_SUMMARY_CURATION_20260826) {
    assert.match(entry.sourceUrl, /^https:\/\//);
    assert.doesNotMatch(entry.sourceUrl, /\/p_id-\d+\.html$/);
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
  assert.match(form, /input-editorial-date/);
  assert.match(form, /date:\s*form\.date/);
  assert.match(form, /sourceOnlyArticle/);
  assert.match(review, /Confirmar vínculos/);
  assert.match(routes, /\/api\/admin\/news\/author-review/);
  assert.match(routes, /createNewsWithTeamMembers/);
  assert.match(routes, /editorialTagsSchema/);
  assert.match(routes, /sourceUrlSchema/);
  assert.match(routes, /editorialDateSchema/);
  assert.match(routes, /requires a valid editorial date/);
  assert.match(routes, /verified source for Articles/);
});

test("las perspectivas del perfil acompañan la biografía sin carrusel horizontal", () => {
  const css = readFileSync(new URL("../../frontend-mirror/templates/beez3/css/typography.css", import.meta.url), "utf8");
  const legacyCss = readFileSync(new URL("../../frontend-mirror/templates/beez3/css/style.css", import.meta.url), "utf8");
  assert.match(css, /\.attorney-bio-disclosure/);
  assert.match(css, /attorney__content--intro:has\(\+ \.attorney-bio-disclosure\)/);
  assert.match(css, /linear-gradient\(to bottom, rgba\(255, 255, 255, 0\), #fff 88%\)/);
  assert.match(css, /attorney-bio-disclosure\[open\][\s\S]*?max-height:\s*none/);
  assert.match(css, /attorney-bio-disclosure__content[\s\S]*?grid-template-rows:\s*0fr[\s\S]*?transition:\s*grid-template-rows/);
  assert.match(css, /attorney-bio-disclosure\[open\][\s\S]*?grid-template-rows:\s*1fr/);
  assert.match(css, /grid-template-columns:\s*repeat\(auto-fit, minmax\(180px, 1fr\)\)/);
  assert.match(css, /grid-auto-flow:\s*row/);
  assert.match(css, /attorney-related-insights__grid[\s\S]*?gap:\s*14px/);
  assert.match(css, /attorney-related-insights\s*\{[\s\S]*?margin:\s*44px 0 clamp\(64px, 7vw, 104px\)/);
  assert.match(css, /@media \(max-width: 780px\)[\s\S]*?attorney__meta[\s\S]*?padding-bottom:\s*42px/);
  assert.match(css, /attorney-related-insights__item[\s\S]*?background:\s*#fff[\s\S]*?border:\s*1px solid #d4d4d0[\s\S]*?border-radius:\s*3px/);
  assert.match(css, /attorney-related-insights__item[\s\S]*?min-height:\s*280px[\s\S]*?aspect-ratio:\s*auto/);
  assert.match(css, /attorney-related-insights__arrow[\s\S]*?color:\s*rgba\(169, 25, 49, \.76\)[\s\S]*?font-size:\s*20px/);
  assert.match(css, /@media print[\s\S]*?\.attorney-bio-disclosure__content[\s\S]*?display:\s*block\s*!important/);
  assert.doesNotMatch(css, /grid-auto-flow:\s*column/);
  assert.match(legacyCss, /background-color:\s*#c4c4c4/);
  assert.doesNotMatch(css, /background:\s*#f5f5f2/);
});

test("la ficha consulta sólo tres publicaciones verificadas sin modificar el archivo", () => {
  const runtime = readFileSync(new URL("../mirror/runtime.ts", import.meta.url), "utf8");
  const serveAttorney = runtime.match(/const serveAttorney[\s\S]*?\n  };\n\n  const serveList/)?.[0] || "";
  assert.match(serveAttorney, /getPublishedNewsByTeamMemberIdPage\([\s\S]*?limit:\s*3/);
  assert.doesNotMatch(serveAttorney, /getRelatedPublishedNewsForTeamMembers/);
  assert.doesNotMatch(serveAttorney, /getPracticePeerIds/);
});

test("las autorías públicas requieren evidencia y las relaciones heredadas permanecen internas", () => {
  const schema = readFileSync(new URL("../../shared/schema/people.ts", import.meta.url), "utf8");
  const storage = readStorageSources();
  const runtime = readFileSync(new URL("../mirror/runtime.ts", import.meta.url), "utf8");
  const form = readFileSync(new URL("../../client/src/pages/admin/AdminNewsForm.tsx", import.meta.url), "utf8");
  const review = readFileSync(new URL("../../client/src/pages/admin/AdminNewsAuthorReview.tsx", import.meta.url), "utf8");
  const linker = readFileSync(new URL("../agents/specialized/MetadataLinkerAgent.ts", import.meta.url), "utf8");
  const routes = readRouteSources();
  const migrationSql = readFileSync(new URL("../../migrations/20260828_0004_news_author_verification_status.sql", import.meta.url), "utf8");
  const migrationData = readFileSync(new URL("../../migrations/20260828_0005_backfill_author_verification_status.mjs", import.meta.url), "utf8");
  const migrationRunner = readFileSync(new URL("../../scripts/run-migrations.mjs", import.meta.url), "utf8");
  assert.match(schema, /verified_historic/);
  assert.match(schema, /verified_editorial_2026/);
  assert.match(schema, /verified_manual/);
  assert.match(schema, /legacy_unverified/);
  assert.match(schema, /team_verification_news_idx/);
  const authorArchive = storage.match(/async getPublishedNewsByTeamMemberIdPage[\s\S]*?\n    }\n\n    \/\*\*/)?.[0] || "";
  assert.match(authorArchive, /verifiedAuthorRelation/);
  assert.match(storage, /getVerifiedTeamMembersByNewsId/);
  assert.match(storage, /getNewsTeamMemberRelations/);
  assert.match(storage, /verificationStatus: "verified_manual"/);
  assert.match(storage, /confirmedLegacyIds/);
  assert.match(runtime, /getVerifiedTeamMembersByNewsId\(item\.id\)/);
  assert.match(form, /Relaciones heredadas sin confirmar/);
  assert.match(review, /next\[item\.id\] = \[\]/);
  assert.doesNotMatch(linker, /insert\(newsTeamMembers\)/);
  assert.match(routes, /setTeamMembersForNews\(newsItem\.id, parsed\.data\.teamMemberIds\);[\s\S]*?invalidatePublicPageCache\(\)/);
  assert.match(migrationSql, /ADD COLUMN "verification_status" text NOT NULL DEFAULT 'legacy_unverified'/);
  assert.match(migrationSql, /CREATE INDEX "news_team_members_team_verification_news_idx"/);
  assert.match(migrationData, /Historic author evidence inventory or digest changed/);
  assert.match(migrationData, /UPDATE news_team_members SET verification_status/);
  assert.match(migrationRunner, /20260828_0005_backfill_author_verification_status\.mjs/);
});

test("la corrección puntual de la nota 1911 sólo confirma sus seis autores históricos", () => {
  const migration = readFileSync(new URL("../../migrations/20260828_0007_correct_news_1911_author_relations.mjs", import.meta.url), "utf8");
  const migrationRunner = readFileSync(new URL("../../scripts/run-migrations.mjs", import.meta.url), "utf8");
  assert.match(migration, /NEWS_1911_LEGACY_ID = "1911"/);
  for (const name of ["Luis Burgueño", "Diego Sierra", "Alberto Córdoba", "Raymundo Soberanis", "Max Morales", "Ricardo Cacho"]) {
    assert.match(migration, new RegExp(name));
  }
  assert.match(migration, /verification_status = 'verified_historic'/);
  assert.match(migration, /Missing unexpected historic author/);
  assert.doesNotMatch(migration, /\bDELETE\s+FROM\s+news_team_members\b/i);
  assert.match(migrationRunner, /20260828_0007_correct_news_1911_author_relations\.mjs/);
  assert.match(migrationRunner, /dataMigrationNotApplicableWhenTargetIsAbsent/);
  assert.match(migrationRunner, /reconciled not-applicable data migration/);
  assert.match(migrationRunner, /legacyId: "1911"/);
  assert.match(migrationRunner, /WHERE legacy_id = \$1 LIMIT 2/);
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
