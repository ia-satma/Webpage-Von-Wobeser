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

test("Newsletter oculta solo la etiqueta vacía y permite restaurarla desde configuración", () => {
  const hiddenHtml = renderHome(homeTemplate, [], {}, "es");
  const $hidden = cheerio.load(hiddenHtml);
  assert.equal($hidden(".home__newsletter").length, 1);
  assert.equal($hidden(".home__newsletter--eyebrow").length, 0);
  assert.equal($hidden(".home__newsletter h2").text(), "Suscríbete");
  assert.equal(
    $hidden(".home__newsletter--description").text(),
    "Recibe en tu correo análisis jurídicos, publicaciones y novedades de Von Wobeser y Sierra.",
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
    "Receive legal analysis, publications and news from Von Wobeser y Sierra directly in your inbox.",
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
  assert.match(adminSource, /\/api\/admin\/newsletter-subscribers/);
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
