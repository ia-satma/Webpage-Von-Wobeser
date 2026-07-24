import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as cheerio from "cheerio";

process.env.DATABASE_URL ||= "postgresql://test:test@127.0.0.1:5432/test";

const { renderHome } = await import("../mirror/renderHome");
const { applyA11y } = await import("../mirror/seo");
const { hardenLegacyClientScripts, optimizeLegacyAssets } = await import("../mirror/index");
const { getCachedPublicPage, invalidatePublicPageCache, publicPageCacheSize } = await import("../mirror/pageCache");

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
    [{ slug: "arbitration", name: "Arbitration", nameEs: "Arbitraje", imageUrl: "/images/banners/3.jpg", published: true }],
  );
  const $ = cheerio.load(html);

  assert.equal($(".home_intro_JS").attr("aria-label"), "Testimonios");
  assert.equal($(".home_slider_JS").eq(0).attr("aria-label"), "Prácticas");
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
  assert.ok(functions.indexOf("normalizeSharedChromeA11y()") < functions.lastIndexOf("menuToggle()"));
  assert.match(css, /\.header \.eyeglass:focus-visible/);
  assert.match(css, /nav\.nav\.menu_JS \.nav__menu--holder[\s\S]*list-style: none/);
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
