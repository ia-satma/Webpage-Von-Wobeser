import { readMirrorSources } from "./mirrorTestSources";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as cheerio from "cheerio";
import { readAdminFeatureSources } from "./adminFeatureTestSources";

process.env.DATABASE_URL ||= "postgresql://test:test@127.0.0.1:5432/test";

const { renderHome } = await import("../mirror/renderHome");
const { CATEGORIES, renderAttorneyDirectory, renderAttorneyList } = await import("../mirror/renderAttorneyList");
const { applyA11y, applySeo, setFaviconConfig } = await import("../mirror/seo");
const {
  hardenLegacyClientScripts,
  LANG_TOGGLE_SCRIPT,
  navigationLabelsScript,
  optimizeLegacyAssets,
  optimizePublicImageTags,
  SEARCH_FORMS_SCRIPT,
} = await import("../mirror/index");
const { getCachedPublicPage, invalidatePublicPageCache, publicPageCacheSize } = await import("../mirror/pageCache");
const { buildPublicNavigationMenu } = await import("../mirror/navigationMenu");
const { renderGroupList } = await import("../mirror/renderGroupList");
const { renderNotFound } = await import("../mirror/renderNotFound");
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

test("la lupa abre, enfoca y envía el buscador global bilingüe", () => {
  const css = readFileSync(
    new URL("../../frontend-mirror/templates/beez3/css/von.css", import.meta.url),
    "utf8",
  );

  assert.match(SEARCH_FORMS_SCRIPT, /form\.setAttribute\('action','\/search'\)/);
  assert.match(SEARCH_FORMS_SCRIPT, /input\.setAttribute\('type','search'\)/);
  assert.match(SEARCH_FORMS_SCRIPT, /input\.focus\(\);input\.select\(\)/);
  assert.match(SEARCH_FORMS_SCRIPT, /event\.key==='Enter'/);
  assert.match(SEARCH_FORMS_SCRIPT, /event\.key==='Escape'/);
  assert.match(SEARCH_FORMS_SCRIPT, /window\.location\.assign\('\/search\?'/);
  assert.match(SEARCH_FORMS_SCRIPT, /closest\('\.vw-header-search__submit'\)/);
  assert.match(SEARCH_FORMS_SCRIPT, /vw-header-search__submit/);
  assert.match(SEARCH_FORMS_SCRIPT, /aria-expanded/);
  assert.match(SEARCH_FORMS_SCRIPT, /lang\.name='lang';lang\.value='en'/);
  assert.match(css, /\.search_form_cont\.vw-search-open \.field/);
  assert.match(css, /\.header\.vw-header-search-open/);
  assert.match(css, /\.vw-header-search__submit/);
  assert.match(css, /font-family: "Inter", sans-serif !important/);
  assert.match(css, /#search_q:focus[\s\S]*box-shadow: inset 0 -2px 0 #ac162c[\s\S]*outline: 0/);
  assert.match(css, /\.vw-header-search__submit::before[\s\S]*transform: translateY\(-1px\)/);
  assert.match(css, /\.header\.header_JS \.search_form_cont[\s\S]*right: 170px !important/);
  assert.match(css, /\.header\.header_JS \.search_form_cont[\s\S]*top: 11px !important[\s\S]*transform: none/);
  assert.match(css, /\.header\.header_JS \.menu_btn_JS[\s\S]*right: 108px !important/);
  assert.match(css, /\.header\.header_JS \.header__lang[\s\S]*right: 8px !important/);
  assert.match(css, /\.header\.header_JS \.eyeglass[\s\S]*width: 44px !important/);
});

test("el selector de idioma muestra ES y EN, destaca el activo y conserva rutas alternas", () => {
  const css = readFileSync(
    new URL("../../frontend-mirror/templates/beez3/css/von.css", import.meta.url),
    "utf8",
  );

  assert.match(LANG_TOGGLE_SCRIPT, /vwb-language__option/);
  assert.match(LANG_TOGGLE_SCRIPT, />ES<\/a>/);
  assert.match(LANG_TOGGLE_SCRIPT, />EN<\/a>/);
  assert.match(LANG_TOGGLE_SCRIPT, /vwb-language__separator/);
  assert.match(LANG_TOGGLE_SCRIPT, /aria-current="page"/);
  assert.match(LANG_TOGGLE_SCRIPT, /link\[rel="alternate"\]\[hreflang=/);
  assert.match(css, /\.vwb-language__option:focus-visible/);
  assert.match(css, /\.vwb-language__option\[aria-current="page"\][\s\S]*color: #ac162c/);
  assert.doesNotMatch(LANG_TOGGLE_SCRIPT, /aria-haspopup="menu"/);
  assert.doesNotMatch(css, /\.vwb-language__menu/);
});

test("las cuatro categorías de Abogados tienen ruta limpia bilingüe antes del catch-all", () => {
  const mirrorServer = readMirrorSources();
  const searchRoute = mirrorServer.indexOf('app.get("/attorneys/buscar"');
  const categoryRoute = mirrorServer.indexOf('app.get("/attorneys/:category"');
  const catchAll = mirrorServer.indexOf("app.use((req: Request, res: Response, next: NextFunction)");

  assert.ok(searchRoute >= 0);
  assert.ok(categoryRoute > searchRoute);
  assert.ok(catchAll > categoryRoute);
  assert.match(mirrorServer, /if \(!CATEGORIES\[req\.params\.category\]\)/);
  assert.match(mirrorServer, /renderNotFound\(pick\(TEMPLATES\.publications, lang\), lang, req\.originalUrl\)/);
  assert.match(mirrorServer, /renderNotFound\(pick\(TEMPLATES\.publications, lang\), lang, req\.originalUrl\),\s*404/);
  assert.doesNotMatch(mirrorServer, /Page navigation → dynamic mirror home/);
  assert.match(mirrorServer, /redirectLegacy\(`\/attorneys\/\$\{req\.params\.category\}`, "en"\)/);
  assert.match(mirrorServer, /redirectLegacy\(`\/attorneys\/\$\{ES_CATEGORY\[req\.params\.category\] \|\| req\.params\.category\}`, "es"\)/);
});

test("las rutas públicas, APIs y recursos inexistentes conservan un 404 real", () => {
  const mirrorServer = readMirrorSources();
  const mainServer = readFileSync(new URL("../index.ts", import.meta.url), "utf8");
  const staticServer = readFileSync(new URL("../static.ts", import.meta.url), "utf8");
  const template = `<!doctype html><html lang="es"><head><title>Publicaciones</title></head><body>
    <header></header><div id="main"><section class="page"><div class="page__ttl--holder"><span>Publicaciones</span></div></section></div>
    <footer></footer>
  </body></html>`;
  const $ = cheerio.load(renderNotFound(template, "es", "/ruta-inexistente"));

  assert.equal($("h1").text(), "Página no encontrada");
  assert.equal($('meta[name="robots"]').attr("content"), "noindex,follow");
  assert.match(mirrorServer, /res\.status\(404\)\.type\("text"\)\.send\("Not Found"\)/);
  assert.match(mirrorServer, /renderNotFound\(pick\(TEMPLATES\.publications, lang\)/);
  assert.match(mainServer, /app\.use\("\/api", \(_req, res\)/);
  assert.match(mainServer, /res\.status\(404\)\.json\(\{ error: "Not Found", requestId \}\)/);
  assert.match(staticServer, /req\.path\.startsWith\("\/assets\/"\)/);
  assert.match(staticServer, /res\.status\(404\)\.type\("text"\)\.send\("Not Found"\)/);
});

test("CSP de producción exige nonces y bloquea atributos de script inline", () => {
  const mainServer = readFileSync(new URL("../index.ts", import.meta.url), "utf8");

  assert.match(mainServer, /contentSecurityPolicy:\s*\{[\s\S]*reportOnly:\s*!isProduction/);
  assert.match(mainServer, /scriptSrc:\s*isProduction[\s\S]*cspNonceSource/);
  assert.match(mainServer, /scriptSrcElem:\s*isProduction[\s\S]*cspNonceSource/);
  assert.match(mainServer, /scriptSrcAttr:\s*isProduction\s*\?\s*\["'none'"\]/);
  assert.doesNotMatch(mainServer, /scriptSrc[^\n]*unsafe-eval/);
  assert.match(mainServer, /objectSrc:\s*\["'none'"\]/);
  assert.match(mainServer, /frameAncestors:\s*\["'none'"\]/);
  assert.match(mainServer, /upgradeInsecureRequests/);
});

test("cada página usa un único H1 editorial y elimina encabezados ocultos de Joomla", () => {
  const listing = cheerio.load(`<!doctype html><html lang="es"><head><title>Áreas de práctica</title></head><body>
    <header id="header"><h1 id="logo">Open Source Content Management</h1></header>
    <main><div class="page__ttl--holder"><span>Áreas de práctica</span></div></main>
  </body></html>`);
  applyA11y(listing, "es");
  assert.equal(listing("h1").length, 1);
  assert.equal(listing("h1").text(), "Áreas de práctica");
  assert.equal(listing(".page__ttl--holder > h1").length, 1);
  assert.equal(listing("h1#logo").length, 0);

  const home = cheerio.load(`<!doctype html><html lang="es"><head><title>Inicio | Von Wobeser y Sierra</title></head><body>
    <header id="header"><h1 id="logo">Open Source Content Management</h1></header>
    <section class="home"><div class="home__hero" role="main"></div></section>
    <article class="item-page"><h1>Von Wobeser y Sierra - Home</h1></article>
  </body></html>`);
  applyA11y(home, "es");
  assert.equal(home("h1").length, 1);
  assert.equal(home("h1").attr("class"), "vw-sr-only");
  assert.equal(home("h1").text(), "Inicio");
});

test("la portada alterna entre Visión, misión y valores editorial y su diseño clásico", () => {
  const template = `<!doctype html><html lang="es"><head><title>Inicio</title></head><body>
    <div id="footer-sub"><footer id="footer"><div class="home__rec--wrap wrap">
      <div class="home__rec--ttl">ACERCA DE NOSOTROS</div>
      <div class="home__rec--top"><strong>Visión</strong></div><div class="home__rec--txt">Visión original</div>
      <div class="home__rec--top"><strong>Misión</strong></div><div class="home__rec--txt">Misión original</div>
      <div class="home__rec--top"><strong>Valores</strong></div><div class="home__rec--txt">Integridad: Texto original</div>
    </div><footer class="footer"></footer></footer></div>
  </body></html>`;
  const config = {
    home_about_layout: { value: "editorial", valueEs: "editorial", type: "select" },
    home_about_editorial_title: { value: "Vision, mission and values", valueEs: "Visión, misión y valores", type: "text" },
    home_about_editorial_intro: { value: "Guiding principles.", valueEs: "Principios que nos guían.", type: "text" },
    home_about_title: { value: "ABOUT US", valueEs: "ACERCA DE NOSOTROS", type: "text" },
    home_vision_label: { value: "Vision", valueEs: "Visión", type: "text" },
    home_vision_body: { value: "English vision.", valueEs: "Visión en español.", type: "text" },
    home_mission_label: { value: "Mission", valueEs: "Misión", type: "text" },
    home_mission_body: { value: "English mission.", valueEs: "Misión en español.", type: "text" },
    home_values_label: { value: "Values", valueEs: "Valores", type: "text" },
    home_values_body: { value: "Integrity: We do what we say.\n\nDescription without a title", valueEs: "Integridad: Hacemos lo que decimos.\n\nDescripción sin título", type: "text" },
  };
  const editorialEs = cheerio.load(renderHome(template, [], config, "es"));
  const editorialEn = cheerio.load(renderHome(template.replace('lang="es"', 'lang="en"'), [], config, "en"));
  const classic = cheerio.load(renderHome(template, [], { ...config, home_about_layout: { value: "classic", valueEs: "classic", type: "select" } }, "es"));
  const legacyIntro = cheerio.load(renderHome(template, [], {
    ...config,
    home_about_editorial_intro: {
      value: "The principles that guide our work and our relationship with clients.",
      valueEs: "Los principios que guían nuestro trabajo y nuestra relación con los clientes.",
      type: "text",
    },
  }, "es"));
  const css = readFileSync(new URL("../../frontend-mirror/templates/beez3/css/von.css", import.meta.url), "utf8");
  const admin = readAdminFeatureSources("site-config", "AdminSiteConfig.tsx");
  const server = readMirrorSources();

  assert.equal(editorialEs(".home-about-editorial").length, 1);
  assert.equal(editorialEs("[data-home-about-reveal]").length, 1);
  assert.equal(editorialEs("[data-home-about-reveal-item]").length, 3);
  assert.equal(editorialEs("#vw-home-about-editorial-reveal").length, 1);
  assert.equal(editorialEs("#home-about-editorial-title").text(), "Visión, misión y valores");
  assert.equal(editorialEs(".home-about-editorial__heading > p").text(), "Principios que nos guían.");
  assert.equal(legacyIntro(".home-about-editorial__heading > p").text(), "Los principios que guían nuestro trabajo y nuestra relación con nuestros clientes.");
  assert.equal(editorialEs(".home-about-editorial__principles article").length, 2);
  assert.equal(editorialEs(".home-about-editorial__value-list li").length, 2);
  assert.equal(editorialEs(".home-about-editorial__value-list h4").first().text(), "Integridad");
  assert.equal(editorialEs(".home-about-editorial__value-list li").last().text().includes("Descripción sin título"), true);
  assert.equal(editorialEn("#home-about-editorial-title").text(), "Vision, mission and values");
  assert.equal(editorialEn(".home-about-editorial__value-list h4").first().text(), "Integrity");
  assert.equal(classic(".home-about-editorial").length, 0);
  assert.equal(classic("#vw-home-about-editorial-reveal").length, 0);
  assert.equal(classic(".home__rec--wrap").length, 1);
  assert.equal(classic(".home__rec--ttl").text(), "ACERCA DE NOSOTROS");
  assert.match(css, /\.home-about-editorial__value-list\s*\{[\s\S]*grid-template-columns:\s*repeat\(5/);
  assert.match(css, /\.home-about-editorial__heading\s*\{[^}]*justify-items:\s*center[^}]*margin:\s*0 auto clamp\([^}]*text-align:\s*center/);
  assert.match(css, /\.home-about-editorial__heading\s*>\s*p\s*\{[^}]*max-width:\s*680px[^}]*width:\s*100%/);
  assert.match(css, /@media \(max-width: 980px\)[\s\S]*\.home-about-editorial__value-list\s*\{[\s\S]*repeat\(2/);
  assert.match(css, /@media \(max-width: 620px\)[\s\S]*\.home-about-editorial__value-list\s*\{[\s\S]*grid-template-columns:\s*1fr/);
  assert.match(css, /@media \(min-width: 981px\) and \(prefers-reduced-motion: no-preference\)[\s\S]*translateY\(40px\)[\s\S]*transition: opacity 1s, transform 1s/);
  assert.match(css, /\[data-home-about-reveal-item="1"\][\s\S]*transition-delay: 200ms/);
  const revealScript = editorialEs("#vw-home-about-editorial-reveal").html() || "";
  assert.match(revealScript, /IntersectionObserver/);
  assert.match(revealScript, /prefers-reduced-motion/);
  assert.match(revealScript, /max-width: 980px/);
  assert.match(admin, /home_about_layout/);
  assert.match(admin, /Editorial — retícula de valores/);
  assert.match(server, /z\.enum\(\["editorial", "classic"\]\)/);
});

test("los listados de Abogados conservan categoría, idioma, canonical y hreflang", () => {
  const template = `<!doctype html><html lang="es"><head><title>Abogados</title></head><body>
    <header><a class="header__lang--item" href="#">ENG</a></header>
    <nav><a href="/index.php/attorneys/partners/index.html">Partners</a></nav>
    <main><div class="attorneys__meta"></div><div class="attorneys__list"></div></main>
  </body></html>`;

  for (const category of Object.keys(CATEGORIES)) {
    const es = cheerio.load(renderAttorneyList(template, [], category, "es"));
    const en = cheerio.load(renderAttorneyList(template, [], category, "en"));
    const canonicalPath = `https://www.vonwobeser.com/attorneys/${category}`;

    assert.equal(es("html").attr("lang"), "es-mx");
    assert.equal(en("html").attr("lang"), "en-gb");
    assert.equal(es('link[rel="canonical"]').attr("href"), canonicalPath);
    assert.equal(en('link[rel="canonical"]').attr("href"), `${canonicalPath}?lang=en`);
    assert.equal(es('link[rel="alternate"][hreflang="en"]').attr("href"), `${canonicalPath}?lang=en`);
    assert.equal(en('link[rel="alternate"][hreflang="es-MX"]').attr("href"), canonicalPath);
    assert.equal(es('nav a').attr("href"), "/attorneys/partners");
    assert.equal(en('nav a').attr("href"), "/attorneys/partners?lang=en");
    assert.equal(es(".attorneys__meta").hasClass("attorneys__meta--directory"), true);
    assert.equal(en(".attorneys__meta").hasClass("attorneys__meta--directory"), true);
    assert.equal(es(".attorneys__list").attr("role"), "region");
    assert.equal(es(".attorneys__list").attr("aria-label"), "Lista de abogados");
    assert.equal(en(".attorneys__list").attr("aria-label"), "Attorney list");
    assert.equal(es("#vwb-attorney-directory-pin").length, 0);
  }
});

test("el directorio de abogados agrupa tarjetas, localiza perfiles y filtra desde el servidor", () => {
  const template = `<!doctype html><html lang="es"><head><title>Abogados</title></head><body>
    <header><a class="header__lang--item" href="#">ENG</a></header>
    <section class="page attorneys"><div class="attorneys__meta"></div><div class="attorneys__list"></div></section>
  </body></html>`;
  const attorneys = [
    { id: "1", slug: "maria-nunez", name: "María Núñez", role: "partners", roleLabel: "Socia", imageUrl: "/images/maria.jpg", practiceSlugs: ["tax"] },
    { id: "2", slug: "alan-carreno", name: "Alan Carreño", role: "of-counsel", roleLabel: "Of Counsel", imageUrl: "/images/alan.jpg", practiceSlugs: ["tax"] },
    { id: "3", slug: "berta-torres", name: "Berta Torres", role: "counsel", roleLabel: "Consejera", imageUrl: "/images/berta.jpg", practiceSlugs: ["litigation"] },
    { id: "4", slug: "carlos-arias", name: "Carlos Arias", role: "associates", roleLabel: "Asociado", imageUrl: "/images/carlos.jpg", practiceSlugs: ["litigation"] },
  ] as const;
  const practices = [
    { slug: "tax", name: "Fiscal" },
    { slug: "litigation", name: "Litigio" },
  ];
  const filters = { q: "NUNEZ", role: "partners", practice: "tax", letter: "N" };
  const es = cheerio.load(renderAttorneyDirectory(template, [...attorneys], practices, filters, "es"));
  const en = cheerio.load(renderAttorneyDirectory(template, [...attorneys], practices, { q: "", role: "", practice: "", letter: "" }, "en"));
  const classic = cheerio.load(renderAttorneyDirectory(template, [...attorneys], practices, filters, "es", "classic-vwys"));
  const js = readFileSync(new URL("../../public/attorney-directory.js", import.meta.url), "utf8");
  const css = readFileSync(new URL("../../frontend-mirror/templates/beez3/css/von.css", import.meta.url), "utf8");

  assert.equal(es(".attorney-directory").length, 1);
  assert.equal(es(".attorney-directory").attr("id"), "buscar");
  assert.equal(es(".attorney-directory__filters").attr("id"), undefined);
  assert.equal(es(".attorney-directory__eyebrow").text(), "Nuestro equipo");
  assert.equal(es(".attorney-directory__intro h1").text(), "Abogados");
  assert.match(es(".attorney-directory__intro > p").text(), /Conoce a nuestro equipo/);
  assert.equal(es(".search__form").length, 0);
  assert.equal(es("[data-attorney-result]").length, 4);
  assert.equal(es("[data-attorney-result]:not([hidden])").length, 1);
  assert.equal(es("[data-attorney-result]:not([hidden]) a").attr("href"), "/abogado/maria-nunez");
  assert.equal(es("[data-attorney-result]:not([hidden]) img").attr("loading"), "lazy");
  assert.equal(es("[data-attorney-result]:not([hidden]) img").attr("width"), "640");
  assert.equal(es("[data-attorney-result]:not([hidden]) img").attr("height"), "800");
  assert.equal(es("[data-attorney-result]:not([hidden]) img").attr("data-vwb-image-kind"), "attorney-portrait");
  assert.equal(es("[data-attorney-letter-option][value=\"N\"]").attr("aria-pressed"), "true");
  assert.equal(es("input[data-attorney-letter]").attr("value"), "N");
  assert.equal(es("[data-attorney-initial-label]").text(), "N");
  assert.equal(es(".attorney-directory__initials summary .vw-sr-only").text(), "Búsqueda por inicial:");
  assert.equal(es("[data-attorney-q]").attr("placeholder"), "Buscar por nombre o apellido…");
  assert.equal(es(".attorney-directory__submit").attr("aria-label"), "Buscar");
  assert.equal(es(".attorney-directory__filters [data-attorney-count]").length, 1);
  assert.equal(es('[data-attorney-result][data-name-initials="M|N"]').length, 1);
  assert.equal(es(".attorney-directory__grid").length, 4);
  assert.equal(es('link[rel="canonical"]').attr("href"), "https://www.vonwobeser.com/attorneys");
  assert.equal(en("[data-attorney-result]").first().find("a").attr("href"), "/lawyer/maria-nunez?lang=en");
  assert.equal(en(".attorney-directory").attr("id"), "search");
  assert.equal(en(".attorney-directory__eyebrow").text(), "Our team");
  assert.equal(en(".attorney-directory__intro h1").text(), "Attorneys");
  assert.equal(en('link[rel="canonical"]').attr("href"), "https://www.vonwobeser.com/attorneys?lang=en");
  assert.equal(classic(".attorney-directory").attr("data-attorney-directory-preset"), "classic-vwys");
  assert.equal(classic(".attorney-directory__filter-main").length, 1);
  assert.equal(classic(".attorney-directory__submit").length, 0);
  assert.equal(classic("[data-attorney-q]").attr("value"), "NUNEZ");
  assert.equal(classic("[data-attorney-role]").val(), "partners");
  assert.equal(classic("[data-attorney-letter-option][value=N]").attr("aria-pressed"), "true");
  assert.equal(classic("[data-attorney-result]").first().find("a").attr("href"), "/abogado/maria-nunez");
  assert.equal(classic(".attorney-directory__intro h1").text(), "Abogados");
  assert.match(js, /data-attorney-letter-option/);
  assert.match(js, /data-attorney-initial-label/);
  assert.match(js, /initials\.open = false/);
  assert.match(js, /params\.has\("set-letter"\)/);
  assert.match(js, /"set-letter"\]\.?forEach/);
  assert.match(js, /window\.addEventListener\("popstate"/);
  assert.match(js, /window\.history\[mode \+ "State"\]/);
  assert.match(js, /window\.requestAnimationFrame/);
  assert.match(js, /status\.animate/);
  assert.match(css, /\.attorney-directory__letter:first-child\{grid-column:1\/-1;width:auto\}/);
  assert.match(css, /data-attorney-directory-preset="classic-vwys"/);
  assert.match(css, /scroll-margin-top:24px/);

  const compoundAttorney = {
    id: "5", slug: "luis-miguel-jimenez", name: "Luis Miguel Jiménez", role: "partners", roleLabel: "Socio", imageUrl: "/images/luis.jpg", practiceSlugs: ["tax"],
  };
  const compoundFilters = { q: "", role: "", practice: "", letter: "" };
  const compoundBase = cheerio.load(renderAttorneyDirectory(template, [compoundAttorney], practices, compoundFilters, "es"));
  const compoundFirst = cheerio.load(renderAttorneyDirectory(template, [compoundAttorney], practices, { ...compoundFilters, letter: "L" }, "es"));
  const compoundSurname = cheerio.load(renderAttorneyDirectory(template, [compoundAttorney], practices, { ...compoundFilters, letter: "J" }, "es"));
  const compoundMiddle = cheerio.load(renderAttorneyDirectory(template, [compoundAttorney], practices, { ...compoundFilters, letter: "M" }, "es"));
  assert.equal(compoundBase("[data-attorney-result]").attr("data-name-initials"), "L|J");
  assert.equal(compoundFirst("[data-attorney-result]:not([hidden])").length, 1);
  assert.equal(compoundSurname("[data-attorney-result]:not([hidden])").length, 1);
  assert.equal(compoundMiddle("[data-attorney-result]:not([hidden])").length, 0);

  const accentedCompoundSurname = {
    id: "6", slug: "alvaro-de-la-cruz", name: "Álvaro de la Cruz", role: "associates", roleLabel: "Asociado", imageUrl: "/images/alvaro.jpg", practiceSlugs: ["tax"],
  };
  const accentedFirst = cheerio.load(renderAttorneyDirectory(template, [accentedCompoundSurname], practices, { ...compoundFilters, letter: "A" }, "es"));
  const accentedSurname = cheerio.load(renderAttorneyDirectory(template, [accentedCompoundSurname], practices, { ...compoundFilters, letter: "C" }, "es"));
  const accentedInner = cheerio.load(renderAttorneyDirectory(template, [accentedCompoundSurname], practices, { ...compoundFilters, letter: "L" }, "es"));
  assert.equal(accentedFirst("[data-attorney-result]").attr("data-name-initials"), "A|C");
  assert.equal(accentedFirst("[data-attorney-result]:not([hidden])").length, 1);
  assert.equal(accentedSurname("[data-attorney-result]:not([hidden])").length, 1);
  assert.equal(accentedInner("[data-attorney-result]:not([hidden])").length, 0);
  assert.match(js, /entry\.initials\.indexOf\("\\|" \+ selectedLetter \+ "\\|"\) !== -1/);
});

test("los módulos públicos añadidos usan la línea tipográfica institucional", () => {
  const css = readFileSync(
    new URL("../../frontend-mirror/templates/beez3/css/von.css", import.meta.url),
    "utf8",
  );
  const fontCss = readFileSync(
    new URL("../../frontend-mirror/templates/beez3/css/typography.css", import.meta.url),
    "utf8",
  );
  const customRenderers = [
    "../mirror/renderHome.ts",
    "../mirror/renderNews.ts",
    "../mirror/renderSearch.ts",
    "../mirror/formsFix.ts",
    "../mirror/renderFirmLanding.ts",
    "../mirror/renderAttorneyResults.ts",
  ].map((path) => readFileSync(new URL(path, import.meta.url), "utf8")).join("\n");

  assert.match(fontCss, /--font-title:\s*"Gelasio", serif/);
  assert.match(fontCss, /--font-body:\s*"Inter", sans-serif/);
  assert.match(fontCss, /--vw-font-editorial:\s*var\(--font-title\)/);
  assert.match(fontCss, /--vw-font-ui:\s*var\(--font-body\)/);
  assert.match(fontCss, /--vw-font-body:\s*var\(--font-body\)/);
  assert.match(css, /\.header \.header--btn,[\s\S]*font-family: var\(--vw-font-ui\) !important/);
  assert.match(css, /nav\.nav\.menu_JS \.vw-subnav \.nav__menu--sublink[\s\S]*min-height: 44px/);
  assert.match(css, /\.home__rec \.slick-arrow\.slick-prev[\s\S]*left: 0 !important/);
  assert.match(css, /\.home__rec \.slick-arrow\.slick-next[\s\S]*right: 0 !important/);
  assert.match(css, /\.page__ttl--holder > h1/);
  assert.match(fontCss, /font-family: "Gelasio";[\s\S]*Gelasio-Variable\.woff2/);
  assert.match(fontCss, /font-family: "Inter";[\s\S]*Inter-Variable\.woff2/);
  assert.doesNotMatch(fontCss, /(?:Publico|Geomanist|Optima)[-A-Za-z0-9]*\.(?:woff2?|otf|ttf)/);
  assert.match(customRenderers, /var\(--vw-font-editorial\)/);
  assert.match(customRenderers, /var\(--vw-font-ui\)/);
  assert.match(customRenderers, /var\(--vw-font-body\)/);
  assert.doesNotMatch(customRenderers, /font(?:-family)?:[^;\n]*(?:Geomanist,|Publico,|Publico-roman)/);
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
  assert.equal($("#video_header").attr("poster"), "/images/hero-20260810-fullhd-poster.webp");
  assert.equal($("#video_header").attr("width"), "1920");
  assert.equal($("#video_header").attr("height"), "1080");
  assert.equal($("#video_header source").eq(0).attr("data-vwb-src"), "/images/hero-20260810-fullhd-mobile.mp4");
  assert.equal($("#video_header source").eq(0).attr("media"), "(max-width: 680px)");
  assert.equal($("#video_header source").eq(1).attr("data-vwb-src"), "/images/hero-20260810-fullhd-desktop.mp4");
  assert.equal($("#video_header source").eq(1).attr("type"), "video/mp4");
  assert.equal($("#video_header").attr("autoplay"), "autoplay");
  assert.equal($("[data-vw-home-video-retry] span").last().text().trim(), "Reproducir video");
  assert.match(html, /video\.defaultMuted=true/);
  assert.match(html, /promise\.catch\(showRetry\)/);
  assert.match($(".home__hero").attr("style") || "", /hero-20260810-fullhd-poster\.webp/);
  assert.equal($('link[rel="preload"][href="/images/hero-20260810-fullhd-poster.webp"]').attr("fetchpriority"), "high");
  assert.equal($(".home_slider_JS").eq(0).find(".vw-lazy-bg").attr("style"), undefined);
  assert.match($(".home_slider_JS").eq(0).find(".vw-lazy-bg").attr("data-bg-mobile") || "", /-640\.webp$/);
  assert.match($(".home_slider_JS").eq(0).find(".vw-lazy-bg").attr("data-bg-desktop") || "", /-(?:1280|1920)\.webp$/);
  assert.match($("#vw-home-performance-js").text(), /navigator\.connection/);
  assert.match($("#vw-home-performance-js").text(), /\.slick-cloned\.vw-lazy-bg/);
  assert.match($("#vw-home-performance-js").text(), /\.slick-active\.vw-lazy-bg/);
  assert.match($("#vw-home-performance-js").text(), /data-vw-bg-source/);
  assert.match($("#vw-home-performance-js").text(), /if\(!item\.style\.backgroundImage\)applyBackground\(item,loadedSource\)/);
  assert.match($("#vw-home-performance-js").text(), /data-vw-bg-loading/);
  assert.match($("#vw-home-performance-js").text(), /fallbackProbe\.onload=function\(\)\{applyBackground\(item,fallback\);\}/);
  assert.match($("#vw-home-performance-js").text(), /afterChange\.vwLazyBg/);
  assert.doesNotMatch($("#vw-home-performance-js").text(), /addEventListener\('wheel'/);
  assert.doesNotMatch($("#vw-home-performance-js").text(), /data-vw-wheel-bound/);
  assert.doesNotMatch($("#vw-home-performance-js").text(), /wheelMoved/);
  const carouselScript = readFileSync(
    new URL("../../frontend-mirror/templates/beez3/js/min/functions.min.js", import.meta.url),
    "utf8",
  );
  assert.match(
    carouselScript,
    /\$\("\.home_slider_JS"\)\.each\(function \(\)[\s\S]*?autoplay: !0,[\s\S]*?autoplaySpeed: 4500/,
  );
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
  assert.match(functions, /swipe: !0/);
  assert.match(functions, /draggable: !0/);
  assert.match(functions, /touchMove: !0/);
  assert.match(functions, /function installHistoryNavigationRecovery\(\)/);
  assert.match(functions, /addEventListener\("pagehide", resetPageTransition\)/);
  assert.match(functions, /addEventListener\("pageshow", resetPageTransition\)/);
  assert.match(functions, /addEventListener\("popstate", resetPageTransition\)/);
  assert.match(functions, /\.stop\(!0, !0\)\.hide\(\)\.attr\("aria-hidden", "true"\)/);
  assert.match(functions, /e\.metaKey \|\| e\.ctrlKey \|\| e\.shiftKey \|\| e\.altKey/);
  assert.match(functions, /t\.origin !== window\.location\.origin/);
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
  const navigationConfig = {
    nav_industries: { value: "Industries", valueEs: "Industrias", type: "text" },
  };
  assert.match(navigationLabelsScript(navigationConfig, "es"), /"industries":"Industrias"/);
  assert.match(navigationLabelsScript(navigationConfig, "en"), /"industries":"Industries"/);
  const legacyNavigationConfig = {
    nav_industries: {
      value: "Industry groups",
      valueEs: "Grupos de práctica por industria",
      type: "text",
    },
  };
  assert.match(navigationLabelsScript(legacyNavigationConfig, "es"), /"industries":"Industrias"/);
  assert.match(navigationLabelsScript(legacyNavigationConfig, "en"), /"industries":"Industries"/);
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

test("el carrusel de Prácticas del Home recorre el mismo orden alfabético bilingüe", () => {
  const template = `<!doctype html><html><head></head><body>
    <div class="home_slider_JS"></div>
    <div class="home_slider_JS"></div>
  </body></html>`;
  const practices = [
    { slug: "labor-employment", name: "Employment", nameEs: "Laboral", order: 1, published: true },
    { slug: "arbitration", name: "Arbitration", nameEs: "Arbitraje", order: 2, published: true },
    { slug: "environmental", name: "Environmental", nameEs: "Ambiental", order: 3, published: true },
    { slug: "tax", name: "Tax", nameEs: "Fiscal", order: 4, published: true },
  ];
  const extractSlides = (html: string) => {
    const $ = cheerio.load(html);
    const slides = $(".home_slider_JS").eq(0).children(".home__slider--item").slice(1);
    return {
      labels: slides.toArray().map((element) => $(element).find(".home__slider--wrap > span").eq(1).text()),
      positions: slides.toArray().map((element) => $(element).find(".home__slider--wrap > span").eq(0).text()),
    };
  };

  assert.deepEqual(
    extractSlides(renderHome(template, [], {}, "es", [], practices)),
    {
      labels: ["Ambiental", "Arbitraje", "Fiscal", "Laboral"],
      positions: ["1", "2", "3", "4"],
    },
  );
  assert.deepEqual(
    extractSlides(renderHome(template, [], {}, "en", [], practices)),
    {
      labels: ["Arbitration", "Employment", "Environmental", "Tax"],
      positions: ["1", "2", "3", "4"],
    },
  );
});

test("la carga pública elimina librerías Joomla duplicadas y usa jQuery vigente", () => {
  const html = `
    <script src="/media/jui/js/jquery.min.js"></script>
    <script src="/media/jui/js/jquery-noconflict.js"></script>
    <script src="/media/jui/js/jquery-migrate.min.js"></script>
    <script src="/media/jui/js/bootstrap.min.js"></script>
    <script src="/media/system/js/core.js"></script>
    <script src="/templates/beez3/js/min/jquery_3.3.1.min.js"></script>
    <script src="/templates/beez3/js/min/slick.min.js"></script>
    <link href="/templates/beez3/css/von.css" rel="stylesheet">
    <link href="/_vendor/slick/slick.css" rel="stylesheet">
    <link href="/_vendor/fontawesome/all.css" rel="stylesheet">
    <script type="application/json" class="joomla-script-options new">{"legacy":true}</script>`;
  const optimized = optimizeLegacyAssets(html);

  assert.doesNotMatch(optimized, /media\/jui|media\/system\/js\/core|jquery_3\.3\.1/);
  assert.match(optimized, /_vendor\/jquery\/jquery-3\.7\.1\.min\.js/);
  assert.match(optimized, /<script defer src="\/templates\/beez3\/js\/min\/slick\.min\.js"/);
  assert.match(optimized, /templates\/beez3\/css\/public\.css\?v=20260819-mobile/);
  assert.doesNotMatch(optimized, /_vendor\/slick\/slick\.css/);
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
  assert.equal(logo.attr("sizes"), "220px");
  assert.match(logo.attr("srcset") || "", /vw40-220\.webp 220w/);
  assert.equal(banner.attr("width"), "5184");
  assert.equal(banner.attr("height"), "3456");
  assert.match(banner.attr("srcset") || "", /3-640\.webp 640w/);
});

test("los retratos locales del directorio reciben variantes WebP y conservan su respaldo", () => {
  const html = optimizePublicImageTags(`
    <img src="/partner_photos/luis_burgueno.jpg" width="640" height="800" data-vwb-image-kind="attorney-portrait" alt="">
  `);
  const $ = cheerio.load(html);
  const portrait = $("img");

  assert.equal(portrait.attr("src"), "/partner_photos/luis_burgueno.jpg");
  assert.match(portrait.attr("srcset") || "", /optimized-attorney-photos\/partner_photos\/luis_burgueno-320\.webp 320w/);
  assert.match(portrait.attr("srcset") || "", /optimized-attorney-photos\/partner_photos\/luis_burgueno-640\.webp 640w/);
  assert.equal(portrait.attr("sizes"), "(max-width: 640px) calc(100vw - 32px), (max-width: 980px) calc(50vw - 48px), 280px");
  assert.equal(portrait.attr("loading"), "lazy");
  assert.equal(portrait.attr("width"), "640");
  assert.equal(portrait.attr("height"), "800");
});

test("el carrusel heredado usa visibilidad real sin destruirse durante el scroll", () => {
  const legacy = readFileSync(
    new URL("../../frontend-mirror/index.php/home/index.html", import.meta.url),
    "utf8",
  );
  const hardened = hardenLegacyClientScripts(legacy);

  assert.match(hardened, /IntersectionObserver/);
  assert.match(hardened, /data-vw-in-view/);
  assert.match(hardened, /slickPlay/);
  assert.match(hardened, /slickPause/);
  assert.doesNotMatch(hardened, /slick\('unslick'\)/);
  assert.doesNotMatch(hardened, /scrollTop\(\)/);
  assert.equal((hardened.match(/Activación estable de carruseles según visibilidad/g) || []).length, 1);
});

test("los logos dinámicos de reconocimientos se contienen dentro de cada diapositiva", () => {
  const styles = readFileSync(
    new URL("../../frontend-mirror/templates/beez3/css/style.css", import.meta.url),
    "utf8",
  );
  const publicStyles = readFileSync(
    new URL("../../frontend-mirror/templates/beez3/css/public.css", import.meta.url),
    "utf8",
  );

  assert.match(styles, /\.home__rec--recognitions \.home__rec--slider\s*\{[\s\S]*?overflow:\s*visible/);
  assert.match(publicStyles, /\.slick-list\s*\{[\s\S]*?overflow:\s*hidden/);
  assert.match(styles, /\.home__rec--recognitions \.home__rec--slide\s*\{[\s\S]*?height:\s*158px[\s\S]*?overflow:\s*hidden/);
  assert.match(styles, /\.home__rec--recognitions \.home__rec--item\s*\{[\s\S]*?max-height:\s*calc\(100% - 30px\)[\s\S]*?max-width:\s*calc\(100% - 30px\)[\s\S]*?object-fit:\s*contain/);
  assert.match(styles, /@media \(max-width: 680px\)[\s\S]*?\.home__rec--recognitions \.home__rec--slide\s*\{[\s\S]*?height:\s*107px/);
});

test("el carrusel de testimonios conserva una altura estable entre citas", () => {
  const functions = readFileSync(
    new URL("../../frontend-mirror/templates/beez3/js/min/functions.min.js", import.meta.url),
    "utf8",
  );
  const styles = readFileSync(
    new URL("../../frontend-mirror/templates/beez3/css/style.css", import.meta.url),
    "utf8",
  );

  assert.match(functions, /function syncTestimonialHeights\(\)/);
  assert.match(functions, /adaptiveHeight:\s*!1/);
  assert.match(functions, /prefers-reduced-motion:\s*reduce/);
  assert.match(styles, /\.home__intro\.slick-initialized \.home__intro--item/);
  assert.match(styles, /justify-content:\s*center/);
  assert.match(styles, /\.home__intro\.slick-initialized \.slick-list[\s\S]*transition:\s*none\s*!important/);
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
