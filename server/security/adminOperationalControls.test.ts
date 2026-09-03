import { readMirrorSources } from "./mirrorTestSources";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as cheerio from "cheerio";
import { readRouteSources } from "./routeTestSources";
import { readStorageSources } from "./storageTestSources";
import { readSchemaSources } from "./schemaTestSources";
import { readAdminFeatureSources } from "./adminFeatureTestSources";

process.env.DATABASE_URL ||= "postgresql://test:test@127.0.0.1:5432/test";

const { renderHome } = await import("../mirror/renderHome");
const { isNewsTitleCompatible } = await import("../mirror/newsLanguage");

const homeTemplate = `<!doctype html><html lang="es"><head><title>Home</title></head><body>
  <div class="home__hero"><a href="/practice/arbitration"><video id="video_header"></video></a></div>
  <div class="covid_cont"><div class="covid_title"><h2><span>Noticias</span></h2></div><div class="covid_headlines"></div></div>
  <section data-block="practice-carousel"><div class="home_slider_JS"><div>Prácticas</div></div></section>
  <section data-block="experience"><div class="home__gray--txt"><p>Experiencia heredada</p></div></section>
  <section data-block="industry-carousel"><div class="home_slider_JS"><div>Industrias</div></div></section>
  <section data-block="team"><div class="home__gray--txt"><p>Equipo heredado</p></div></section>
  <section class="home__desk"><p>Desk heredado</p></section>
  <div id="bottom"><section class="home__rec"><div class="home__rec--ttl">Reconocimientos</div><div class="home__rec--top">Introducción</div><div class="home__rec--txt">Listado</div><div class="home__rec--slider home_rec_JS"><img src="/logo.png"></div></section></div>
</body></html>`;

const news = Array.from({ length: 20 }, (_, index) => ({
  slug: `noticia-${index + 1}`,
  title: `News ${index + 1}`,
  titleEs: `Noticia ${index + 1}`,
}));

test("el Home muestra cinco páginas por defecto y respeta el rango administrable", () => {
  const defaultHtml = renderHome(homeTemplate, news, {}, "es");
  assert.equal(cheerio.load(defaultHtml)("[data-vw-news-slide]").length, 5);

  const onePage = renderHome(homeTemplate, news, {
    home_news_pages: { value: "1", valueEs: "1", type: "number" },
  }, "es");
  assert.equal(cheerio.load(onePage)("[data-vw-news-slide]").length, 1);

  const tenPages = renderHome(homeTemplate, news, {
    home_news_pages: { value: "10", valueEs: "10", type: "number" },
  }, "en");
  assert.equal(cheerio.load(tenPages)("[data-vw-news-slide]").length, 10);

  const clamped = renderHome(homeTemplate, news, {
    home_news_pages: { value: "999", valueEs: "999", type: "number" },
  }, "es");
  assert.equal(cheerio.load(clamped)("[data-vw-news-slide]").length, 10);
});

test("Noticias del Home conserva exclusivamente el idioma activo y anima la tarjeta con suavidad", () => {
  const mixedNews = [
    { id: "english-only", slug: "english-only", title: "English only", titleEs: "" },
    {
      id: "wrong-spanish-field",
      slug: "wrong-spanish-field",
      title: "Correct English title about a new legal development",
      titleEs: "CFE Awards Projects Under the Mixed Development Scheme and SENER Extends Permits",
    },
    {
      id: "wrong-spanish-administrative",
      slug: "wrong-spanish-administrative",
      title: "Administrative Measures – FIFA World Cup 2026 Opening Match in Mexico City.",
      titleEs: "Administrative Measures – FIFA World Cup 2026 Opening Match in Mexico City.",
    },
    {
      id: "wrong-spanish-plan-mexico",
      slug: "wrong-spanish-plan-mexico",
      title: "Plan Mexico — Immediate Actions for Investment",
      titleEs: "Plan Mexico — Immediate Actions for Investment",
    },
    { id: "bilingual-one", slug: "bilingual-one", title: "English one", titleEs: "Español uno" },
    { id: "bilingual-two", slug: "bilingual-two", title: "English two", titleEs: "Español dos" },
  ];
  const onePageConfig = { home_news_pages: { value: "1", valueEs: "1", type: "number" } };
  const spanishHtml = renderHome(homeTemplate, mixedNews, onePageConfig, "es");
  const englishHtml = renderHome(homeTemplate, mixedNews, onePageConfig, "en");
  const spanish = cheerio.load(spanishHtml);
  const english = cheerio.load(englishHtml);

  assert.deepEqual(spanish(".vw-news-carousel__headline h3").map((_index, node) => spanish(node).text()).get(), [
    "Español uno",
    "Español dos",
  ]);
  assert.equal(spanishHtml.includes("English only"), false);
  assert.equal(spanishHtml.includes("CFE Awards Projects"), false);
  assert.equal(spanishHtml.includes("Administrative Measures"), false);
  assert.equal(spanishHtml.includes("Immediate Actions for Investment"), false);
  assert.deepEqual(english(".vw-news-carousel__headline h3").map((_index, node) => english(node).text()).get(), [
    "English only",
    "Correct English title about a new legal development",
  ]);
  assert.equal(englishHtml.includes("Español uno"), false);
  assert.match(spanish("#vw-news-carousel-style").text(), /border-radius:7px/);
  assert.match(spanish("#vw-news-carousel-script").text(), /panel\.animate/);
  assert.match(spanish("#vw-news-carousel-script").text(), /duration:420/);
  assert.match(spanish("#vw-news-carousel-script").text(), /prefers-reduced-motion: reduce/);
});

test("Noticias del Home se compacta en laptops sin perder la segunda noticia", () => {
  const html = renderHome(homeTemplate, news.slice(0, 4), {
    home_news_pages: { value: "2", valueEs: "2", type: "number" },
  }, "es");
  const $ = cheerio.load(html);
  const baseStyle = $("#vw-news-carousel-style").text();
  const responsiveStyle = $("#vw-news-carousel-responsive-style").text();

  assert.equal($("[data-vw-news-slide]").length, 2);
  assert.equal($("[data-vw-news-slide]").first().find(".news_item").length, 2);
  assert.match(baseStyle, /min-height:300px/);
  assert.match(baseStyle, /min-height:44px/);
  assert.match(
    responsiveStyle,
    /\(min-width:801px\) and \(max-width:1439px\), \(min-width:801px\) and \(max-height:819px\)/,
  );
  assert.match(responsiveStyle, /width:clamp\(360px,30vw,400px\)/);
  assert.match(responsiveStyle, /min-height:245px/);
  assert.match(responsiveStyle, /-webkit-line-clamp:4/);
  assert.match(responsiveStyle, /@media \(max-width:800px\)/);
  assert.match(responsiveStyle, /width:100%/);
  assert.match(responsiveStyle, /grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/);
  assert.match(responsiveStyle, /-webkit-line-clamp:3/);
  assert.match(responsiveStyle, /news_item:nth-child\(2\)\{display:flex;?\}/);
  assert.doesNotMatch(responsiveStyle, /news_item:nth-child\(2\)[^{]*\{[^}]*display:none/);
  assert.doesNotMatch(responsiveStyle, /transform:\s*scale/);
});

test("Noticias del Home conserva título y controles legibles en móvil, contraída o expandida", () => {
  const html = renderHome(homeTemplate, news.slice(0, 4), {
    home_news_pages: { value: "2", valueEs: "2", type: "number" },
  }, "es");
  const $ = cheerio.load(html);
  const responsiveStyle = $("#vw-news-carousel-responsive-style").text();

  assert.equal($(".covid_title h2 span").text(), "Noticias");
  assert.equal($(".covid_cont.vw-news-panel>.vw-news-panel__toggle").length, 1);
  assert.equal($(".covid_cont.vw-news-panel>.vw-news-panel__toggle").attr("aria-expanded"), "true");
  assert.match(responsiveStyle, /La plantilla histórica convierte el panel a 100% de ancho en móvil/);
  assert.match(responsiveStyle, /top:clamp\(2rem,8vw,3rem\)!important/);
  assert.match(responsiveStyle, /\.home__hero>\.covid_cont\.vw-news-panel\.vw-news-panel--minimized/);
  assert.match(responsiveStyle, /width:min\(15rem,calc\(100% - 1rem\)\)!important/);
  assert.match(responsiveStyle, /visibility:visible!important/);
  assert.match(responsiveStyle, /@media \(max-width:600px\)/);
  assert.match(responsiveStyle, /grid-template-columns:minmax\(0,1fr\)!important/);
  assert.match(responsiveStyle, /border-top:1px solid #d2d2ce!important/);
  assert.match(html, /matchMedia\('\(max-width: 800px\)'\)\.matches/);
  assert.match(html, /Boolean\(mobile\)\|\|localStorage\.getItem\(key\)==='1'/);
});

test("el filtro lingüístico del Home es conservador con nombres propios y títulos breves", () => {
  assert.equal(isNewsTitleCompatible("Von Wobeser y Sierra", "es"), true);
  assert.equal(isNewsTitleCompatible("Von Wobeser y Sierra", "en"), true);
  assert.equal(isNewsTitleCompatible("Arbitraje", "es"), true);
  assert.equal(isNewsTitleCompatible("Arbitration", "en"), true);
  assert.equal(isNewsTitleCompatible("México y la Unión Europea firman un nuevo acuerdo", "en"), false);
  assert.equal(isNewsTitleCompatible("Mexico and the European Union sign a new agreement", "es"), false);
  assert.equal(isNewsTitleCompatible("Administrative Measures – FIFA World Cup 2026 Opening Match in Mexico City.", "es"), false);
  assert.equal(isNewsTitleCompatible("Plan Mexico — Immediate Actions for Investment", "es"), false);
});

test("la franja de Nuevas oficinas conserva contenido bilingüe con jerarquía semántica", () => {
  const template = `<!doctype html><html lang="es"><head><title>Home</title></head><body>
    <section><div class="home__rojo"><div class="home__rojo--wrap wrap"><div class="home__rojo--txt">
      <a href="/nuevas-oficinas/">VER MÁS</a>
    </div></div></div></section>
  </body></html>`;
  const config = {
    banner_title: { value: "We go where clients need us", valueEs: "Vamos a donde los clientes nos necesitan", type: "text" },
    banner_subtitle: { value: "New offices of Von Wobeser y Sierra", valueEs: "Nuevas oficinas de Von Wobeser y Sierra", type: "text" },
  };
  const spanish = cheerio.load(renderHome(template, [], config, "es"));
  const english = cheerio.load(renderHome(template.replace('lang="es"', 'lang="en"'), [], config, "en"));

  assert.equal(spanish(".home__rojo--title").prop("tagName"), "H2");
  assert.equal(spanish(".home__rojo--title").text(), "Vamos a donde los clientes nos necesitan");
  assert.equal(spanish(".home__rojo--subtitle").text(), "Nuevas oficinas de Von Wobeser y Sierra");
  assert.equal(spanish(".home__rojo--cta").attr("href"), "/nuevas-oficinas/");
  assert.equal(spanish(".home__rojo--cta").attr("target"), "_blank");
  assert.equal(spanish(".home__rojo--cta").attr("rel"), "alternate noopener noreferrer");
  assert.equal(spanish(".home__rojo--cta").text(), "VER MÁS→");
  assert.equal(spanish(".home__rojo--action").length, 1);
  assert.equal(spanish(".home__rojo--cta-arrow").attr("aria-hidden"), "true");
  assert.equal(spanish(".home__rojo--txt [style]").length, 0);
  assert.equal(english(".home__rojo--title").text(), "We go where clients need us");
  assert.equal(english(".home__rojo--subtitle").text(), "New offices of Von Wobeser y Sierra");
  assert.equal(english(".home__rojo--cta").text(), "SEE MORE→");

  const legacyConfig = {
    banner_title: { value: "WE GO WHERE CLIENTS NEED US", valueEs: "VAMOS A DONDE LOS CLIENTES NOS NECESITAN", type: "text" },
    banner_subtitle: config.banner_subtitle,
  };
  assert.equal(
    cheerio.load(renderHome(template, [], legacyConfig, "es"))(".home__rojo--title").text(),
    "Vamos a donde los clientes nos necesitan",
  );
  assert.equal(
    cheerio.load(renderHome(template.replace('lang="es"', 'lang="en"'), [], legacyConfig, "en"))(".home__rojo--title").text(),
    "We go where clients need us",
  );
});

test("la franja de Nuevas oficinas sale del hero heredado antes de renderizarse", () => {
  const malformedTemplate = `<!doctype html><html lang="es"><head><title>Home</title></head><body>
    <div class="home__hero"><a href="/acerca-de"><video id="video_header"></video></a>
      <section><div class="home__rojo"><div class="home__rojo--wrap wrap"><div class="home__rojo--txt"><a href="/nuevas-oficinas/">VER MÁS</a></div></div></div></section>
    </div>
  </body></html>`;
  const config = {
    banner_title: { value: "We go where clients need us", valueEs: "Vamos a donde los clientes nos necesitan", type: "text" },
    banner_subtitle: { value: "New offices of Von Wobeser y Sierra", valueEs: "Nuevas oficinas de Von Wobeser y Sierra", type: "text" },
  };
  const $ = cheerio.load(renderHome(malformedTemplate, [], config, "es"));

  assert.equal($(".home__hero .home__rojo").length, 0);
  assert.equal($(".home__hero").next("section").find(".home__rojo").length, 1);
  assert.equal($(".home__hero").next("section").find(".home__rojo--title").text(), "Vamos a donde los clientes nos necesitan");
});

test("la plantilla real de Inicio conserva el cromo persistente fuera del hero y la franja antes de los testimonios", () => {
  for (const [templatePath, lang] of [
    ["../../frontend-mirror/index.php/home/index.html", "es"],
    ["../../frontend-mirror/index.html", "en"],
  ] as const) {
    const realTemplate = readFileSync(new URL(templatePath, import.meta.url), "utf8");
    const $ = cheerio.load(renderHome(realTemplate, [], {}, lang));
    const hero = $(".home__hero").first();
    const banner = $(".home__rojo").first();
    const bannerSection = banner.closest("section");
    const header = $("body > header.header_JS").first();
    const navigation = $("body > nav.nav.menu_JS").first();

    assert.equal(header.length, 1, lang);
    assert.equal(navigation.length, 1, lang);
    assert.equal(header.next().is(navigation), true, lang);
    assert.equal(hero.find("header.header_JS, nav.nav.menu_JS").length, 0, lang);
    assert.equal($(".home__rojo").length, 1, lang);
    assert.equal(banner.closest(".home__hero").length, 0, lang);
    assert.equal(bannerSection.prev().is(hero), true, lang);
    assert.equal(bannerSection.next("#nav").length, 1, lang);
    assert.equal($("#nav .home__intro--wrap").length, 1, lang);
  }
});

test("Newsletter oculta solo la etiqueta vacía y permite restaurarla desde configuración", () => {
  const hiddenHtml = renderHome(homeTemplate, [], {}, "es");
  const $hidden = cheerio.load(hiddenHtml);
  assert.equal($hidden(".home__newsletter").length, 1);
  assert.equal($hidden(".home__newsletter--eyebrow").length, 0);
  assert.equal($hidden(".home__newsletter h2").text(), "Suscríbete");
  assert.equal(
    $hidden(".home__newsletter--description").text(),
    "Mantente al día sobre los cambios legales y regulatorios relevantes para tu negocio.",
  );
  assert.equal($hidden(".home__newsletter--field--half").length, 2);
  assert.equal($hidden(".home__newsletter--field--full").length, 1);
  assert.equal($hidden(".home__newsletter.vw-newsletter--compact").length, 1);
  assert.equal($hidden("#newsletter-privacy").attr("required"), "required");
  assert.match(hiddenHtml, /border:1px solid #c7c7c3/);
  assert.match(hiddenHtml, /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(hiddenHtml, /min-height:0;height:auto/);
  assert.match(hiddenHtml, /padding:clamp\(2\.35rem,3\.8vw,3\.4rem\)/);
  assert.match(hiddenHtml, /text-decoration-thickness:1\.5px/);

  const english = cheerio.load(renderHome(homeTemplate.replace('lang="es"', 'lang="en"'), [], {}, "en"));
  assert.equal(english(".home__newsletter h2").text(), "Subscribe");
  assert.equal(
    english(".home__newsletter--description").text(),
    "Stay up to date on legal and regulatory changes relevant to your business.",
  );
  assert.equal(english(".home__newsletter--privacy a").attr("href"), "/privacy");

  const legacyHtml = renderHome(homeTemplate, [], {
    newsletter_eyebrow: { value: "Newsletter", valueEs: "Newsletter", type: "text" },
  }, "es");
  assert.equal(cheerio.load(legacyHtml)(".home__newsletter--eyebrow").length, 0);

  const restoredHtml = renderHome(homeTemplate, [], {
    newsletter_eyebrow: { value: "Updates", valueEs: "Novedades", type: "text" },
  }, "es");
  assert.equal(cheerio.load(restoredHtml)(".home__newsletter--eyebrow").text(), "Novedades");

  const customizedHtml = renderHome(homeTemplate, [], {
    newsletter_title: { value: "Client updates", valueEs: "Actualizaciones para clientes", type: "text" },
    newsletter_description: { value: "Custom copy", valueEs: "Texto personalizado", type: "text" },
  }, "es");
  const $customized = cheerio.load(customizedHtml);
  assert.equal($customized(".home__newsletter h2").text(), "Actualizaciones para clientes");
  assert.equal($customized(".home__newsletter--description").text(), "Texto personalizado");

  const unsafePathHtml = renderHome(homeTemplate, [], {
    newsletter_privacy_path: { value: "javascript:alert(1)", valueEs: "javascript:alert(1)", type: "url" },
  }, "es");
  assert.equal(cheerio.load(unsafePathHtml)(".home__newsletter--privacy a").attr("href"), "/aviso");
});

test("Newsletter conserva un único flujo entre Home, PostgreSQL y Administración", () => {
  const homeSource = readFileSync(new URL("../mirror/renderHome.ts", import.meta.url), "utf8");
  const routesSource = readRouteSources();
  const storageSource = readStorageSources();
  const schemaSource = readSchemaSources();
  const adminSource = readFileSync(
    new URL("../../client/src/pages/admin/AdminNewsletter.tsx", import.meta.url),
    "utf8",
  );
  const siteConfigSource = readFileSync(new URL("../mirror/siteConfig.ts", import.meta.url), "utf8");

  assert.match(homeSource, /fetch\('\/api\/newsletter\/subscribe'/);
  assert.match(homeSource, /acceptPrivacy:form\.elements\.acceptPrivacy\.checked/);
  assert.match(routesSource, /app\.post\("\/api\/newsletter\/subscribe",\s*publicFormLimiter/);
  assert.match(routesSource, /newsletterSubscribeSchema\.safeParse\(req\.body\)/);
  assert.match(routesSource, /storage\.createNewsletterSubscriber/);
  assert.match(routesSource, /storage\.updateNewsletterSubscriber/);
  assert.match(schemaSource, /newsletterSubscribers\s*=\s*pgTable\("newsletter_subscribers"/);
  assert.match(storageSource, /getNewsletterSubscribers\([\s\S]*newsletterSubscribers/);
  assert.match(
    routesSource,
    /"\/api\/admin\/newsletter-subscribers",\s*authMiddleware,\s*requirePermission\("newsletter"\)/,
  );
  assert.match(
    routesSource,
    /app\.delete\("\/api\/admin\/newsletter-subscribers\/:id",\s*authMiddleware,\s*requirePermission\("newsletter"\)/,
  );
  assert.match(routesSource, /storage\.deleteNewsletterSubscriber\(parsedId\.data\)/);
  assert.match(storageSource, /deleteNewsletterSubscriber\(id: string\)/);
  assert.match(adminSource, /\/api\/admin\/newsletter-subscribers/);
  assert.match(adminSource, /DELETE", `\/api\/admin\/newsletter-subscribers\/\$\{subscriber\.id\}`/);
  assert.match(adminSource, /Eliminar permanentemente la suscripción/);
  assert.match(adminSource, /queryClient\.invalidateQueries/);
  for (const key of [
    "newsletter_title",
    "newsletter_description",
    "newsletter_privacy_intro",
    "newsletter_privacy_link",
    "newsletter_privacy_path",
    "newsletter_cta",
    "newsletter_success",
    "newsletter_error",
  ]) {
    assert.match(siteConfigSource, new RegExp(`key:\\s*"${key}"`));
  }
});

test("los tres textos institucionales del Home están ocultos por defecto y se restauran desde el panel", () => {
  const hidden = cheerio.load(renderHome(homeTemplate, [], {}, "es"));
  assert.equal(hidden('[data-block="experience"]').length, 0);
  assert.equal(hidden('[data-block="team"]').length, 0);
  assert.equal(hidden(".home__carousel-separator").length, 1);
  assert.equal(hidden(".home__carousel-separator").next().is('[data-block="industry-carousel"]'), true);
  assert.equal(hidden("#bottom .home__rec--txt").length, 0);
  assert.equal(hidden("#bottom .home__rec--ttl").length, 1);
  assert.equal(hidden("#bottom .home__rec--slider").length, 1);
  assert.equal(hidden("#bottom .home__rec--recognitions").length, 1);

  const hiddenEn = cheerio.load(
    renderHome(homeTemplate.replace('lang="es"', 'lang="en"'), [], {}, "en"),
  );
  assert.equal(hiddenEn('[data-block="experience"]').length, 0);
  assert.equal(hiddenEn('[data-block="team"]').length, 0);
  assert.equal(hiddenEn(".home__carousel-separator").length, 1);
  assert.equal(hiddenEn(".home__carousel-separator").next().is('[data-block="industry-carousel"]'), true);
  assert.equal(hiddenEn("#bottom .home__rec--txt").length, 0);
  assert.equal(hiddenEn("#bottom .home__rec--ttl").length, 1);
  assert.equal(hiddenEn("#bottom .home__rec--slider").length, 1);

  const visibleConfig = {
    home_experience_visible: { value: "true", valueEs: "true", type: "boolean" },
    home_team_stats_visible: { value: "true", valueEs: "true", type: "boolean" },
    home_recognitions_body_visible: { value: "true", valueEs: "true", type: "boolean" },
    home_experience: { value: "Forty years", valueEs: "Cuarenta años", type: "text" },
    home_team_stats: { value: "Team figures", valueEs: "Cifras del equipo", type: "text" },
    home_recognitions_body: { value: "Recognition list", valueEs: "Lista de reconocimientos", type: "text" },
  };
  const visibleEs = cheerio.load(renderHome(homeTemplate, [], visibleConfig, "es"));
  assert.equal(visibleEs('[data-block="experience"]').text().trim(), "Cuarenta años");
  assert.equal(visibleEs('[data-block="team"]').text().trim(), "Cifras del equipo");
  assert.equal(visibleEs(".home__carousel-separator").length, 0);
  assert.equal(visibleEs("#bottom .home__rec--txt").text().trim(), "Lista de reconocimientos");

  const visibleEn = cheerio.load(renderHome(homeTemplate.replace('lang="es"', 'lang="en"'), [], visibleConfig, "en"));
  assert.equal(visibleEn('[data-block="experience"]').text().trim(), "Forty years");
  assert.equal(visibleEn('[data-block="team"]').text().trim(), "Team figures");
  assert.equal(visibleEn(".home__carousel-separator").length, 0);
  assert.equal(visibleEn("#bottom .home__rec--txt").text().trim(), "Recognition list");

  const publicCss = readFileSync(
    new URL("../../frontend-mirror/templates/beez3/css/style.css", import.meta.url),
    "utf8",
  );
  assert.match(publicCss, /#bottom\s+\.home__rec\s+\.home__rec--ttl,[\s\S]*?font-family:\s*var\(--font-body\)\s*!important/);
  assert.match(publicCss, /#bottom\s+\.home__rec\s+\.home__rec--top,[\s\S]*?font-family:\s*var\(--font-title\)\s*!important/);
  assert.match(
    publicCss,
    /\.home__carousel-separator\s*\{[\s\S]*width:\s*100%[\s\S]*height:\s*clamp\(16px, 1\.5vw, 28px\)[\s\S]*background-color:\s*#fff/,
  );
  assert.doesNotMatch(publicCss, /\.home__carousel-section--separated::before/);

  const adminSource = readAdminFeatureSources("site-config", "AdminSiteConfig.tsx");
  for (const key of [
    "home_experience_visible",
    "home_team_stats_visible",
    "home_recognitions_body_visible",
  ]) {
    assert.match(
      adminSource,
      new RegExp(`key:\\s*"${key}"[^}]*control:\\s*"switch"[^}]*defaultValue:\\s*false`),
    );
  }
});

test("Diversidad y Pro Bono se ocultan en Home sin perder su restauración desde el panel", () => {
  const template = `<!doctype html><html lang="es"><head><title>Inicio</title></head><body>
    <div id="bottom">
      <section class="home__rec"><div class="home__rec--ttl">Reconocimientos</div><div class="home__rec--top">Introducción</div></section>
      <section class="home__rec"><div class="home__rec--ttl">Diversidad</div><div class="home__rec--top">Texto diversidad</div></section>
      <section class="home__rec"><div class="home__rec--ttl">Pro Bono</div><div class="home__rec--top">Texto Pro Bono</div></section>
    </div>
  </body></html>`;
  const hidden = cheerio.load(renderHome(template, [], {}, "es"));
  assert.equal(hidden("#bottom .home__rec").length, 1);
  assert.equal(hidden("#bottom").text().includes("Diversidad"), false);
  assert.equal(hidden("#bottom").text().includes("Pro Bono"), false);

  const visibleConfig = {
    home_diversity_visible: { value: "true", valueEs: "true", type: "boolean" },
    home_probono_visible: { value: "true", valueEs: "true", type: "boolean" },
    home_diversity_title: { value: "Diversity & inclusion", valueEs: "Diversidad e inclusión", type: "text" },
    home_diversity_body: { value: "Diversity copy", valueEs: "Texto de diversidad", type: "text" },
    home_probono_title: { value: "Pro Bono", valueEs: "Pro Bono", type: "text" },
    home_probono_body: { value: "Pro Bono copy", valueEs: "Texto Pro Bono", type: "text" },
  };
  const visible = cheerio.load(renderHome(template, [], visibleConfig, "es"));
  assert.equal(visible("#bottom .home__rec").length, 3);
  assert.equal(visible("#bottom .home__rec").eq(1).find(".home__rec--ttl").text(), "Diversidad e inclusión");
  assert.equal(visible("#bottom .home__rec").eq(1).find(".home__rec--top").text(), "Texto de diversidad");
  assert.equal(visible("#bottom .home__rec").eq(2).find(".home__rec--ttl").text(), "Pro Bono");
  assert.equal(visible("#bottom .home__rec").eq(2).find(".home__rec--top").text(), "Texto Pro Bono");

  const adminSource = readAdminFeatureSources("site-config", "AdminSiteConfig.tsx");
  const defaultsSource = readFileSync(new URL("../mirror/siteConfig.ts", import.meta.url), "utf8");
  for (const key of ["home_diversity_visible", "home_probono_visible"]) {
    assert.match(adminSource, new RegExp(`key:\\s*"${key}"[^}]*control:\\s*"switch"[^}]*defaultValue:\\s*false`));
    assert.match(defaultsSource, new RegExp(`key:\\s*"${key}"[^}]*value:\\s*"false"[^}]*type:\\s*"boolean"`));
  }
});

test("el registro de accesos resuelve identidad sin exponer hashes como correo", () => {
  const storageSource = readStorageSources();
  const routesSource = readRouteSources();
  const adminSource = readFileSync(
    new URL("../../client/src/pages/admin/AdminUsers.tsx", import.meta.url),
    "utf8",
  );

  assert.match(storageSource, /leftJoin\(adminUsers,\s*eq\(adminLoginEvents\.userId,\s*adminUsers\.id\)\)/);
  assert.match(storageSource, /userEmail:\s*adminUsers\.email/);
  assert.match(storageSource, /username:\s*adminUsers\.username/);
  assert.match(storageSource, /userRole:\s*adminUsers\.role/);
  assert.match(
    routesSource,
    /"\/api\/admin\/login-log",\s*authMiddleware,\s*requireRole\("super_admin",\s*"admin"\)/,
  );
  assert.match(adminSource, /Usuario no reconocido/);
  assert.match(adminSource, /Usuario eliminado/);
  assert.match(adminSource, /Origen protegido/);
});

test("el gasto estimado de IA solo está disponible para Dueño y Administrador", () => {
  const routesSource = readRouteSources();
  const dashboardSource = readFileSync(
    new URL("../../client/src/pages/admin/AdminDashboard.tsx", import.meta.url),
    "utf8",
  );
  const agentsSource = readFileSync(
    new URL("../../client/src/pages/AdminAgents.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    routesSource,
    /"\/api\/admin\/usage\/summary",\s*authMiddleware,\s*requireRole\("super_admin",\s*"admin"\)/,
  );
  assert.match(dashboardSource, /role === "admin" \|\| role === "super_admin"/);
  assert.match(dashboardSource, /isAdmin && \([\s\S]*?<AiUsageCard/);
  assert.match(agentsSource, /canViewAiUsage && \([\s\S]*?<AiUsageCard/);
});

test("servidor y panel validan de una a diez páginas de noticias", () => {
  const serverSource = readMirrorSources();
  const adminSource = readAdminFeatureSources("site-config", "AdminSiteConfig.tsx");

  assert.match(serverSource, /req\.params\.key === "home_news_pages"/);
  assert.match(serverSource, /z\.coerce\.number\(\)\.int\(\)\.min\(1\)\.max\(10\)/);
  assert.match(adminSource, /key:\s*"home_news_pages"[\s\S]*min:\s*1,\s*max:\s*10/);
});
