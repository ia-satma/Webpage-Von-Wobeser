import assert from "node:assert/strict";
import test from "node:test";
import * as cheerio from "cheerio";

process.env.DATABASE_URL ||= "postgresql://test:test@127.0.0.1:5432/test";

const { applyContactForm } = await import("../mirror/formsFix");
const { renderNewsList } = await import("../mirror/renderNews");
const { applyPublicationsSearch, renderGlobalSearch } = await import("../mirror/renderSearch");
const { renderPage } = await import("../mirror/renderPage");

const chrome = `<!doctype html><html lang="es"><head><title>Anterior</title></head><body>
  <header><a class="header__lang--item" href="#">ENG</a></header>
  <section class="page"><div class="page--wrap">
    <div class="page__content"><div class="page__content--intro"></div><div class="page__content--body"></div></div>
    <div class="page__map"><div class="page__map--holder"></div></div>
  </div></section>
  <footer></footer>
</body></html>`;

test("Publicaciones reemplaza acción y tokens Joomla por búsqueda GET", () => {
  const $ = cheerio.load(`${chrome}<div class="page"><div class="search__form faded"><form action="/index.php/results" method="post">
    <input name="q"><select name="kind"><option value="noticias">Noticias</option><option value="articulos">Articulos</option></select>
    <input type="hidden" name="token-antiguo" value="1">
  </form></div></div>`);
  applyPublicationsSearch($, "es");
  const html = $.html();

  assert.match(html, /action="\/publications\/search"/);
  assert.match(html, /method="get"/);
  assert.match(html, /option value="news"/);
  assert.match(html, /option value="articles">Artículos/);
  assert.doesNotMatch(html, /token-antiguo|index\.php\/results/);
});

test("Noticias conserva consulta, idioma y paginación en el archivo", () => {
  const template = `<!doctype html><html lang="en"><head><title>News</title></head><body>
    <div class="archive__filters">
      <form action="/index.php/results" method="post"><input class="news_search" name="q"><input type="hidden" name="kind" value="news"></form>
      <form id="adminForm"><select name="limit"></select></form>
    </div>
    <div class="archive__list"></div><div class="pagination"></div>
  </body></html>`;
  const html = renderNewsList(
    template,
    [{
      slug: "safe-result",
      title: "Safe result",
      titleEs: "Resultado seguro",
      excerpt: "English excerpt",
      excerptEs: "Extracto",
      date: new Date("2026-07-20"),
    }],
    "en",
    { page: 2, totalPages: 3 },
    { query: `arbitration & competition` },
  );

  assert.match(html, /action="\/news" method="get"/);
  assert.match(html, /name="lang" value="en"/);
  assert.match(html, /q=arbitration\+%26\+competition&amp;page=1&amp;lang=en/);
  assert.match(html, /value="arbitration &amp; competition"/);
  assert.doesNotMatch(html, /id="adminForm"|index\.php\/results/);
  assert.match(html, /name="robots" content="noindex,follow"/);
});

test("buscador global escapa contenido y enlaza todos los tipos publicados", () => {
  const html = renderGlobalSearch(
    chrome,
    {
      team: [{ slug: "ana", name: "Ana <script>", roleEs: "Socia" }],
      practiceGroups: [{ slug: "arbitraje", name: "Arbitration", nameEs: "Arbitraje", descriptionEs: "Controversias" }],
      industryGroups: [{ slug: "energia", name: "Energy", nameEs: "Energía", descriptionEs: "Sector energético" }],
      news: [{ slug: "novedad", title: "Update", titleEs: "Novedad", excerptEs: "Información" }],
    },
    `<img src=x onerror=alert(1)>`,
    "es",
  );

  assert.match(html, /href="\/abogado\/ana"/);
  assert.match(html, /href="\/practice\/arbitraje"/);
  assert.match(html, /href="\/industry\/energia"/);
  assert.match(html, /href="\/news\/novedad"/);
  const $ = cheerio.load(html);
  assert.equal($(".vw-global-results img").length, 0);
  assert.equal($("#vw-global-query").attr("value"), `<img src=x onerror=alert(1)>`);
  assert.doesNotMatch(html, /<script>Ana/);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(html, /clamp\(36px,4vw,56px\)/);
  assert.match(html, /background:#f1f1ef;border-block:1px solid #c8c8c6/);
  assert.match(html, /align-items:center;display:inline-flex;justify-content:center/);
  assert.match(html, /transform:translate\(5px,-1px\)/);
});

test("Contacto queda debajo del mapa, usa cuadrícula propia y prácticas administradas", () => {
  const $ = cheerio.load(chrome);
  $(".page__map--holder").html('<iframe src="https://www.google.com/maps/embed?pb=legacy"></iframe>');
  $(".page__content--body").html("<p>Torre SOMA Chapultepec 18th floor. Campos Elíseos 204.</p>");
  applyContactForm(
    $,
    "es",
    {
      contact_form_title: { value: "Write us", valueEs: "Hablemos", type: "text" },
      contact_form_submit_label: { value: "Send", valueEs: "Enviar ahora", type: "text" },
      office_map_embed: { value: "https://www.google.com/maps/embed?pb=official", valueEs: "", type: "url" },
    },
    [
      { slug: "arbitraje", name: "Arbitration", nameEs: "Arbitraje", published: true },
      { slug: "german-desk", name: "German Desk", nameEs: "Desk Alemán", published: true },
      { slug: "oculta", name: "Hidden", nameEs: "Oculta", published: false },
    ],
  );
  const $section = $(".vw-contact-form-section");

  assert.equal($section.length, 1);
  assert.equal($section.parent().hasClass("page--wrap"), true);
  assert.ok($(".page__map").index() < $section.index());
  assert.match($.html(), /Hablemos|Enviar ahora/);
  assert.match($.html(), /option value="arbitraje">Arbitraje/);
  assert.doesNotMatch($.html(), /german-desk|Desk Alemán|value="oculta"/);
  assert.doesNotMatch($.html(), /id="vwContactForm" class="careers__form"/);
  assert.match($.html(), /\.vw-contact-form\{display:grid;grid-template-columns:repeat\(2/);
  assert.match($.html(), /@media\(max-width:720px\).*grid-template-columns:1fr/s);
  assert.match($.html(), /fetch\('\/api\/contact'/);
  assert.equal($("#vw-contact-privacy").attr("required"), "required");
  assert.match($.html(), /name="acceptPrivacy"/);
  assert.match($.html(), /acceptPrivacy:\s*!!form\.acceptPrivacy\.checked/);
  assert.match($.html(), /href="\/aviso"/);
  assert.match($.html(), /Aviso de Privacidad/);
  assert.match($.html(), /\.vw-contact-privacy a\{color:#a5102a;font-weight:500/);
  assert.match($.html(), /Torre SOMA Chapultepec, piso 18/);
  assert.doesNotMatch($.html(), /18th floor/);
  assert.equal($(".page__map--holder iframe").attr("src"), "https://www.google.com/maps/embed?pb=official");
  assert.match($(".page__map--holder iframe").attr("title") || "", /Ubicación de Von Wobeser/);
});

test("Contacto conserva el mapa capturado si la configuración no es un embed seguro de Google Maps", () => {
  const $ = cheerio.load(chrome);
  $(".page__map--holder").html('<iframe src="https://www.google.com/maps/embed?pb=legacy"></iframe>');
  applyContactForm($, "en", {
    office_map_embed: { value: "https://example.com/embed", valueEs: "", type: "url" },
  });

  assert.equal($(".page__map--holder iframe").attr("src"), "https://www.google.com/maps/embed?pb=legacy");
});

test("Contacto permite administrar el consentimiento bilingüe", () => {
  const $ = cheerio.load(chrome.replace('lang="es"', 'lang="en"'));
  applyContactForm(
    $,
    "en",
    {
      contact_form_privacy_intro: { value: "I agree to", valueEs: "Acepto", type: "text" },
      contact_form_privacy_link: { value: "the Privacy Notice", valueEs: "el Aviso", type: "text" },
      contact_form_privacy_path: { value: "/custom-privacy", valueEs: "/aviso-personalizado", type: "url" },
    },
    [],
  );

  assert.match($.html(), /I agree to/);
  assert.match($.html(), /the Privacy Notice/);
  assert.match($.html(), /href="\/custom-privacy"/);
  assert.equal($("#vw-contact-privacy").attr("required"), "required");
});

test("Contacto rechaza destinos de privacidad con protocolos activos", () => {
  const $ = cheerio.load(chrome);
  applyContactForm(
    $,
    "es",
    {
      contact_form_privacy_path: { value: "javascript:alert(1)", valueEs: "javascript:alert(1)", type: "url" },
    },
    [],
  );
  assert.equal($(".vw-contact-privacy a").attr("href"), "/aviso");
  assert.doesNotMatch($.html(), /javascript:/i);
});

test("páginas institucionales generan alternates de rutas ES/EN distintas", () => {
  const htmlEs = renderPage(
    chrome,
    {},
    "es",
    {},
    {
      path: "/contacto",
      title: "Contacto | Von Wobeser y Sierra",
      alternatePaths: { es: "/contacto", en: "/contact" },
    },
  );
  const htmlEn = renderPage(
    chrome.replace('lang="es"', 'lang="en"'),
    {},
    "en",
    {},
    {
      path: "/contact",
      title: "Contact | Von Wobeser y Sierra",
      alternatePaths: { es: "/contacto", en: "/contact" },
    },
  );

  assert.match(htmlEs, /rel="canonical" href="https:\/\/www\.vonwobeser\.com\/contacto"/);
  assert.match(htmlEs, /href="https:\/\/www\.vonwobeser\.com\/contact" hreflang="en"/);
  assert.match(htmlEn, /rel="canonical" href="https:\/\/www\.vonwobeser\.com\/contact"/);
  assert.match(htmlEn, /href="https:\/\/www\.vonwobeser\.com\/contacto" hreflang="es-MX"/);
});
