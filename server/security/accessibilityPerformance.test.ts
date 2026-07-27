import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as cheerio from "cheerio";

process.env.DATABASE_URL ||= "postgresql://test:test@127.0.0.1:5432/test";

const { renderHome } = await import("../mirror/renderHome");
const { applyA11y, applySeo, setFaviconConfig } = await import("../mirror/seo");
const {
  hardenLegacyClientScripts,
  navigationLabelsScript,
  optimizeLegacyAssets,
  optimizePublicImageTags,
} = await import("../mirror/index");
const { getCachedPublicPage, invalidatePublicPageCache, publicPageCacheSize } = await import("../mirror/pageCache");
const { buildPublicNavigationMenu } = await import("../mirror/navigationMenu");
const { renderGroupList } = await import("../mirror/renderGroupList");
const { isPublicPracticeSlug } = await import("../mirror/publicPracticeGroups");
const { practiceAreas } = await import("../../shared/schema");

test("el cromo compartido usa lista válida y botón de búsqueda accesible", () => {
  const $ = cheerio.load(`<!doctype html><html lang="es"><head></head><body>
    <header>
      <div class="search_form_cont">
        <div class="eyeglass" style="top:-4px"></div>
        <input id="search_q" name="q">
      </div>
    </header>
    <nav class="nav menu_JS">
      <div class="nav__menu--holder">
        <li class="nav__menu--item"><a href="/nuestra-firma">Nuestra Firma</a></li>
      </div>
    </nav>
  </body></html>`);

  applyA11y($, "es");

  assert.equal($(".nav__menu--holder").prop("tagName"), "UL");
  assert.equal($(".nav__menu--holder > li").length, 1);
  assert.equal($(".eyeglass").prop("tagName"), "BUTTON");
  assert.equal($(".eyeglass").attr("type"), "button");
  assert.equal($(".eyeglass").attr("aria-label"), "Buscar");
  assert.equal($(".eyeglass").attr("aria-controls"), "search_q");
  assert.equal($(".eyeglass").attr("aria-expanded"), "false");
});

test("el favicon administrable conserva su archivo transparente y rompe la caché anterior", () => {
  setFaviconConfig("/uploads/favicon-transparente.png", "transparent-test");
  const $ = cheerio.load('<!doctype html><html><head><link rel="shortcut icon" href="/anterior.ico"></head><body></body></html>');
  applySeo($, { lang: "es", path: "/", title: "Inicio" });

  assert.equal(
    $('link[rel="icon"]').attr("href"),
    "/uploads/favicon-transparente.png?v=transparent-test",
  );
  assert.equal(
    $('link[rel="apple-touch-icon"]').attr("href"),
    "/uploads/favicon-transparente.png?v=transparent-test",
  );
  assert.equal(
    $('link[rel="manifest"]').attr("href"),
    "/api/public/manifest.webmanifest?v=transparent-test",
  );
  assert.equal($('link[href="/anterior.ico"]').length, 0);
});

test("Slick expone carruseles como listas, no como campos listbox sin nombre", () => {
  const slick = readFileSync(
    new URL("../../frontend-mirror/templates/beez3/js/min/slick.min.js", import.meta.url),
    "utf8",
  );

  assert.match(slick, /\$slideTrack\.attr\("role", "list"\)/);
  assert.match(slick, /role: "listitem"/);
  assert.doesNotMatch(slick, /\$slideTrack\.attr\("role", "listbox"\)/);
  assert.doesNotMatch(slick, /role: "option"/);
});

test("la portada nombra los cuatro carruseles y aplica contraste AA al módulo de noticias", () => {
  const template = `<!doctype html><html lang="es"><head><title>Home</title></head><body>
    <header><div class="eyeglass"></div></header>
    <nav class="nav menu_JS"><div class="nav__menu--holder"><li>Inicio</li></div></nav>
    <div class="home__hero" style="background-image:url(/images/home-hero.jpg)">
      <a href="/practice/arbitration"><video id="video_header"><source src="/images/dron_2026_40.mp4"></video></a>
    </div>
    <div class="home_intro_JS"><div>Testimonio</div></div>
    <div class="home_slider_JS"><div>Práctica</div></div>
    <div class="home_slider_JS"><div>Industria</div></div>
    <div class="home_rec_JS"><img src="/ranking.png" alt="Ranking"></div>
    <div class="covid_cont"><div class="covid_title"><h2><span>Noticias</span></h2></div></div>
  </body></html>`;
  const html = renderHome(
    template,
    [],
    {},
    "es",
    [],
    [
      { slug: "arbitration", name: "Arbitration", nameEs: "Arbitraje", imageUrl: "/images/banners/3.jpg", published: true },
      { slug: "administrative-law", name: "Administrative Law", nameEs: "Derecho Administrativo", imageUrl: "/images/banners/13.jpg", published: true },
    ],
  );
  const $ = cheerio.load(html);

  assert.equal($(".home_intro_JS").attr("aria-label"), "Testimonios");
  assert.equal($(".home_slider_JS").eq(0).attr("aria-label"), "Prácticas");
  assert.equal($(".home_slider_JS").eq(0).find(".industria_intro_1").text(), "1");
  assert.equal($(".home_slider_JS").eq(0).text().includes("Derecho Administrativo"), false);
  assert.equal($(".home_slider_JS").eq(1).attr("aria-label"), "Grupos de práctica por industria");
  assert.equal($(".home_rec_JS").attr("aria-label"), "Reconocimientos");
  assert.equal($("#video_header").attr("poster"), "/images/home-hero-poster-v2.webp");
  assert.equal($("#video_header source").eq(0).attr("src"), "/images/home-hero-mobile-v2.mp4");
  assert.equal($("#video_header source").eq(0).attr("media"), "(max-width: 680px)");
  assert.equal($("#video_header source").eq(1).attr("src"), "/images/home-hero-desktop-v2.mp4");
  assert.equal($("#video_header source").eq(1).attr("type"), "video/mp4");
  assert.equal($("#video_header").attr("autoplay"), undefined);
  assert.match($(".home__hero").attr("style") || "", /home-hero-poster-v2\.webp/);
  assert.equal($('link[rel="preload"][href="/images/home-hero-poster-v2.webp"]').attr("fetchpriority"), "high");
  assert.equal($(".home_slider_JS").eq(0).find(".vw-lazy-bg").attr("style"), undefined);
  assert.match($(".home_slider_JS").eq(0).find(".vw-lazy-bg").attr("data-bg-mobile") || "", /-640\.webp$/);
  assert.match($(".home_slider_JS").eq(0).find(".vw-lazy-bg").attr("data-bg-desktop") || "", /-(?:1280|1920)\.webp$/);
  assert.match($("#vw-home-performance-js").text(), /navigator\.connection/);
  assert.equal($(".home_rec_JS img").attr("loading"), "lazy");
  assert.match($("#a11y-contrast").text(), /\.covid_title span/);
  assert.match($("#a11y-contrast").text(), /\.vw-news-carousel__count\{color:#5f5f5f !important\}/);
});

test("el recurso compartido corrige también HTML legacy antes de inicializar el menú", () => {
  const functions = readFileSync(
    new URL("../../frontend-mirror/templates/beez3/js/min/functions.min.js", import.meta.url),
    "utf8",
  );
  const css = readFileSync(
    new URL("../../frontend-mirror/templates/beez3/css/von.css", import.meta.url),
    "utf8",
  );

  assert.match(functions, /function normalizeSharedChromeA11y\(\)/);
  assert.match(functions, /document\.createElement\("ul"\)/);
  assert.match(functions, /document\.createElement\("button"\)/);
  assert.match(functions, /function populateCapabilitySubmenus\(e\)/);
  assert.match(functions, /\/api\/public\/navigation-menu/);
  assert.match(functions, /aria-expanded/);
  assert.ok(functions.indexOf("normalizeSharedChromeA11y()") < functions.lastIndexOf("menuToggle()"));
  assert.match(css, /\.header \.eyeglass:focus-visible/);
  assert.match(css, /nav\.nav\.menu_JS \.nav__menu--holder[\s\S]*list-style: none/);
  assert.match(css, /\.vw-subnav--practices[\s\S]*grid-template-columns: repeat\(2/);
  assert.match(css, /\.vw-subnav--industries/);
});

test("el menú público expone 18 prácticas oficiales y 7 industrias desde contenido publicado", () => {
  const practices = Array.from({ length: 18 }, (_, index) => ({
    slug: `practice-${index + 1}`,
    name: `Practice ${index + 1}`,
    nameEs: `Práctica ${index + 1}`,
    order: index + 1,
    published: true,
  }));
  practices.push(
    {
      slug: "administrative-law",
      name: "Administrative Law",
      nameEs: "Derecho Administrativo",
      order: 19,
      published: true,
    },
    {
      slug: "german-desk",
      name: "German Desk",
      nameEs: "Desk Alemán",
      order: 20,
      published: true,
    },
    {
      slug: "hidden-practice",
      name: "Hidden practice",
      nameEs: "Práctica oculta",
      order: 21,
      published: false,
    },
  );
  const industries = Array.from({ length: 7 }, (_, index) => ({
    slug: `industry-${index + 1}`,
    name: `Industry ${index + 1}`,
    nameEs: `Industria ${index + 1}`,
    order: index + 1,
    published: true,
  }));
  industries.push({
    slug: "hidden-industry",
    name: "Hidden industry",
    nameEs: "Industria oculta",
    order: 8,
    published: false,
  });

  const es = buildPublicNavigationMenu({ practices, industries }, "es");
  const en = buildPublicNavigationMenu({ practices, industries }, "en");

  assert.equal(es.practices.length, 18);
  assert.equal(es.industries.length, 7);
  assert.equal(en.practices.length, 18);
  assert.equal(en.industries.length, 7);
  assert.deepEqual(es.practices[0], {
    label: "Práctica 1",
    href: "/practice/practice-1",
    slug: "practice-1",
  });
  assert.deepEqual(en.industries[6], {
    label: "Industry 7",
    href: "/industry/industry-7?lang=en",
    slug: "industry-7",
  });
  assert.equal(es.practices.some((item) => item.slug === "german-desk"), false);
  assert.equal(es.practices.some((item) => item.slug === "administrative-law"), false);
  assert.equal(isPublicPracticeSlug("immigration-global-mobility"), true);
  assert.equal(isPublicPracticeSlug("projects-infrastructure"), true);

  const injected = navigationLabelsScript({}, "es", es);
  assert.match(injected, /window\.__VW_NAV_MENU_ITEMS__/);
  assert.equal((injected.match(/"href":/g) || []).length, 25);
});

test("la migración conserva Derecho Administrativo como respaldo y solo lo despublica", () => {
  const migration = readFileSync(
    new URL("../../migrations/20260727_0003_retire_administrative_law.sql", import.meta.url),
    "utf8",
  );

  assert.match(migration, /UPDATE\s+practice_groups/i);
  assert.match(migration, /SET\s+published\s*=\s*false/i);
  assert.match(migration, /slug\s*=\s*'administrative-law'/i);
  assert.doesNotMatch(migration, /\bDELETE\b|\bDROP\b/i);
});

test("el inventario oficial contiene exactamente las 18 prácticas vigentes", () => {
  assert.equal(practiceAreas.length, 18);
  assert.deepEqual(
    practiceAreas.map((practice) => practice.value).sort(),
    [
      "antitrust-competition",
      "arbitration",
      "banking-finance",
      "bankruptcy-restructuring",
      "corporate-ma",
      "energy-natural-resources",
      "environmental",
      "esg",
      "immigration-global-mobility",
      "intellectual-property",
      "international-trade",
      "investigations-anticorruption",
      "labor-employment",
      "litigation",
      "projects-infrastructure",
      "real-estate",
      "tax",
      "telecommunications-media-technology",
    ],
  );
  assert.equal(practiceAreas.some((practice) => !isPublicPracticeSlug(practice.value)), false);
});

test("Prácticas usa orden alfabético bilingüe tanto en el menú como en su página", () => {
  const practices = [
    { slug: "labor", name: "Employment", nameEs: "Laboral", order: 1, published: true },
    { slug: "arbitration", name: "Arbitration", nameEs: "Arbitraje", order: 2, published: true },
    { slug: "environmental", name: "Environmental", nameEs: "Ambiental", order: 3, published: true },
    { slug: "tax", name: "Tax", nameEs: "Fiscal", order: 4, published: true },
    { slug: "administrative-law", name: "Administrative Law", nameEs: "Derecho Administrativo", order: 5, published: true },
  ];
  const groups = { practices, industries: [] };
  const esMenu = buildPublicNavigationMenu(groups, "es");
  const enMenu = buildPublicNavigationMenu(groups, "en");

  assert.deepEqual(
    esMenu.practices.map((item) => item.label),
    ["Ambiental", "Arbitraje", "Fiscal", "Laboral"],
  );
  assert.deepEqual(
    enMenu.practices.map((item) => item.label),
    ["Arbitration", "Employment", "Environmental", "Tax"],
  );

  const template = `<!doctype html><html><head></head><body>
    <div class="page__content--body"></div>
  </body></html>`;
  const meta = {
    path: "/capacidades/practicas",
    title: "Prácticas",
    description: "Listado",
    crumbLabel: "Prácticas",
  };
  const esPage = cheerio.load(renderGroupList(template, practices, "/practice/", "es", meta));
  const enPage = cheerio.load(renderGroupList(
    template,
    practices,
    "/practice/",
    "en",
    { ...meta, path: "/capabilities/practices" },
  ));

  assert.deepEqual(
    esPage(".page__content--item").toArray().map((element) => esPage(element).text()),
    ["Ambiental", "Arbitraje", "Fiscal", "Laboral"],
  );
  assert.deepEqual(
    enPage(".page__content--item").toArray().map((element) => enPage(element).text()),
    ["Arbitration", "Employment", "Environmental", "Tax"],
  );
});

test("la carga pública elimina librerías Joomla duplicadas y usa jQuery vigente", () => {
  const html = `
    <script src="/media/jui/js/jquery.min.js"></script>
    <script src="/media/jui/js/jquery-noconflict.js"></script>
    <script src="/media/jui/js/jquery-migrate.min.js"></script>
    <script src="/media/system/js/core.js"></script>
    <script src="/templates/beez3/js/min/jquery_3.3.1.min.js"></script>
    <script src="/templates/beez3/js/min/slick.min.js"></script>
    <link href="/_vendor/fontawesome/all.css" rel="stylesheet">
    <script type="application/json" class="joomla-script-options new">{"legacy":true}</script>`;
  const optimized = optimizeLegacyAssets(html);

  assert.doesNotMatch(optimized, /media\/jui|media\/system\/js\/core|jquery_3\.3\.1/);
  assert.match(optimized, /_vendor\/jquery\/jquery-3\.7\.1\.min\.js/);
  assert.match(optimized, /<script defer src="\/templates\/beez3\/js\/min\/slick\.min\.js"/);
  assert.doesNotMatch(optimized, /fontawesome|joomla-script-options/);
});

test("la optimización responsiva respeta el tamaño CSS del logo institucional", () => {
  const html = optimizePublicImageTags(`
    <img class="header__logo--img" src="/images/vw40.png" style="max-width:180px">
    <img class="banner" src="/images/banners/3.jpg">
  `);
  const $ = cheerio.load(html);
  const logo = $(".header__logo--img");
  const banner = $(".banner");

  assert.equal(logo.attr("width"), undefined);
  assert.equal(logo.attr("height"), undefined);
  assert.equal(logo.attr("fetchpriority"), "high");
  assert.equal(banner.attr("width"), "5184");
  assert.equal(banner.attr("height"), "3456");
  assert.match(banner.attr("srcset") || "", /3-640\.webp 640w/);
});

test("el carrusel heredado no se destruye y reconstruye en cada evento de scroll", () => {
  const legacy = `/* Scroll - activacion de sliders */
    jQuery(window).scroll(function(){
      var height = jQuery(window).scrollTop();
      jQuery(".home_slider_JS").slick('unslick');
    });`;
  const hardened = hardenLegacyClientScripts(legacy);

  assert.match(hardened, /var vwSliderScrollState = ""/);
  assert.match(hardened, /if \(nextState === vwSliderScrollState\) return/);
  assert.match(hardened, /filter\('\.slick-initialized'\)\.slick\('unslick'\)/);
});

test("la caché pública agrupa renderizados simultáneos y permite invalidación administrativa", async () => {
  invalidatePublicPageCache();
  let renders = 0;
  const build = async () => {
    renders += 1;
    await new Promise((resolve) => setTimeout(resolve, 5));
    return `<html data-render="${renders}"></html>`;
  };

  const [first, second] = await Promise.all([
    getCachedPublicPage("home:es", build),
    getCachedPublicPage("home:es", build),
  ]);
  assert.equal(first, second);
  assert.equal(renders, 1);
  assert.equal(publicPageCacheSize(), 1);

  invalidatePublicPageCache();
  const rebuilt = await getCachedPublicPage("home:es", build);
  assert.equal(renders, 2);
  assert.notEqual(rebuilt, first);
});
