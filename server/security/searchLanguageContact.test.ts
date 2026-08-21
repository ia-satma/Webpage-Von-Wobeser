import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import * as cheerio from "cheerio";

process.env.DATABASE_URL ||= "postgresql://test:test@127.0.0.1:5432/test";

const { applyContactForm } = await import("../mirror/formsFix");
const { applyInternsContent, applyProBonoMedia } = await import("../mirror/htmlPipeline");
const { renderNewsList } = await import("../mirror/renderNews");
const { applyPublicationsSearch, renderGlobalSearch } = await import("../mirror/renderSearch");
const { renderPage } = await import("../mirror/renderPage");
const { contactFormSchema } = await import("../../shared/schema");

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

test("Pasantes elimina permanentemente la ilustración heredada de siluetas", () => {
  const $ = cheerio.load(`<!doctype html><html><body>
    <section class="page careers">
      <div class="careers__content">
        <div class="page__content--intro"></div>
        <div class="page__content--intro"></div>
        <div class="page__content--body"></div>
        <div class="page__content--intro"></div>
        <div class="page__content--body"></div>
      </div>
      <div class="interns"><img src="/images/interns.png" alt=""></div>
    </section>
  </body></html>`);

  applyInternsContent($, {}, "es");

  assert.equal($(".interns").length, 0);
  assert.equal($('img[src="/images/interns.png"]').length, 0);
  assert.equal($(".page.careers").hasClass("vw-interns-page"), true);
});

test("Pasantes normaliza las negritas heredadas y las del contenido administrable", () => {
  const $ = cheerio.load(`<!doctype html><html><body>
    <section class="page careers"><div class="careers__content">
      <div class="page__content--intro"></div>
      <div class="page__content--intro"></div>
      <div class="page__content--body"><p><span style="font-weight:bold">Texto heredado</span></p></div>
      <div class="page__content--intro"></div>
      <div class="page__content--body"><p><b>Otro texto heredado</b></p></div>
    </div></section>
  </body></html>`);

  applyInternsContent($, {
    page_interns_offer_body: {
      valueEs: '<p><strong>Texto administrable</strong> <span style="font-weight: 700; color:#555">sin jerarquía extra</span></p>',
      value: "",
    },
  }, "es");

  assert.equal($(".careers__content strong, .careers__content b").length, 0);
  assert.equal($(".careers__content [style*='font-weight']").length, 0);
  assert.match($(".careers__content").text(), /Texto administrable/);
  assert.match($(".careers__content").text(), /Texto heredado/);
});

test("Pro Bono usa la cabecera editorial bilingüe y conserva su introducción", () => {
  const $ = cheerio.load(`<!doctype html><html><body>
    <section class="page"><div class="page--wrap">
      <div class="page__ttl"><div class="page__ttl--holder"><h1>PRO BONO</h1></div></div>
      <main class="page__content"><div class="page__content--intro"><p>Introducción histórica.</p></div><div class="page__content--body"><p>Cuerpo original.</p></div></main>
    </div></section>
  </body></html>`);

  applyProBonoMedia($, {
    page_probono_eyebrow: { value: "Our firm", valueEs: "Nuestra firma", type: "text" },
    page_probono_title: { value: "Pro Bono", valueEs: "Pro Bono", type: "text" },
  }, "es");

  assert.equal($(".page.vw-probono-page").attr("aria-labelledby"), "vw-probono-page-title");
  assert.equal($(".page__ttl").length, 0);
  assert.equal($(".vw-probono-page__eyebrow").text(), "Nuestra firma");
  assert.equal($(".vw-probono-page__title").text(), "Pro Bono");
  assert.match($(".page__content--intro").text(), /Introducción histórica/);
  assert.match($(".page__content--body").text(), /Cuerpo original/);

  const css = fs.readFileSync("frontend-mirror/templates/beez3/css/vwb-stability.css", "utf8");
  assert.match(css, /\.vw-probono-page__title[\s\S]*?var\(--vw-font-editorial\)[\s\S]*?text-transform:\s*none/);
  assert.match(css, /\.vw-probono-page \.page__content--intro p[\s\S]*?font:\s*inherit !important/);
  assert.match(css, /\.vw-probono-page \.page__sidebar[\s\S]*?display:\s*flex/);
  assert.match(css, /\.vw-probono-page__logos[\s\S]*?display:\s*grid/);
  assert.match(css, /\.vw-probono-page__logos img[\s\S]*?max-width:\s*min\(100%, 200px\)/);
});

test("Pro Bono coloca sus reconocimientos administrables en la barra lateral", () => {
  const $ = cheerio.load(`<!doctype html><html><body><section class="page"><div class="page--wrap">
    <div class="page__content"><div class="page__content--body"><p>Texto Pro Bono.</p><p class="pro_img">Logo heredado.</p></div></div>
    <aside class="page__sidebar"><a class="page--btn">Imprimir</a><div><div class="img_probono_1"></div></div></aside>
  </div></section></body></html>`);
  const config = {
    page_probono_logo_1: { value: "/media/probono-one.png", valueEs: "", type: "url" as const },
    page_probono_logo_2: { value: "/media/probono-two.png", valueEs: "", type: "url" as const },
  };

  applyProBonoMedia($, config, "es");

  assert.equal($(".page__content--body .pro_img").length, 0);
  assert.equal($(".page__sidebar .img_probono_1").length, 0);
  assert.equal($(".page__sidebar .vw-probono-page__logos img").length, 2);
  assert.equal($(".page__sidebar .vw-probono-page__logos img").first().attr("src"), "/media/probono-one.png");
  assert.equal($(".page__sidebar .vw-probono-page__logos").attr("aria-label"), "Reconocimientos Pro Bono");
});

test("Pro Bono elimina el comentario heredado que ocultaba la galería administrable", () => {
  // La captura histórica deja este comentario sin cierre: el HTML siguiente,
  // incluida cualquier galería que se agregue al sidebar, queda comentado en
  // el navegador si no se sanea antes de renderizarlo.
  const $ = cheerio.load(`<!doctype html><html><body><section class="page"><div class="page--wrap">
    <div class="page__content"><div class="page__content--body"><p>Texto Pro Bono.</p></div></div>
    <aside class="page__sidebar"><a class="page--btn">Imprimir</a><!--<img class="img_probono_1" src="/legacy.png">`);
  const config = {
    page_probono_logo_1: { value: "/media/probono-one.png", valueEs: "", type: "url" as const },
  };

  applyProBonoMedia($, config, "es");

  assert.equal($(".page__sidebar").contents().filter((_index, node) => node.type === "comment").length, 0);
  assert.equal($(".page__sidebar .vw-probono-page__logos img").length, 1);
  assert.equal($(".page__sidebar .vw-probono-page__logos img").attr("loading"), "eager");
  assert.doesNotMatch($.html(), /<!--<img class="img_probono_1"/);
});

test("Pro Bono reemplaza el cuerpo heredado por el contenido administrable sin duplicarlo", () => {
  const paragraph = "Von Wobeser y Sierra se enorgullece de ser una firma líder en lo relativo a la causa pro bono.";
  const template = `<!doctype html><html><body><section class="page"><div class="page--wrap">
    <div class="page__ttl"><div class="page__ttl--holder">PRO BONO</div></div>
    <div class="page__content"><div class="page__content--intro"><p>Introducción.</p></div>
      <div class="page__content--body"><p>Von Wobeser y Sierra se enorgullece de ser una firma líder en lo relativo a la causa <em>pro bono</em>.</p></div>
    </div>
  </div></section></body></html>`;
  const config = {
    page_probono_body: { value: "", valueEs: paragraph, type: "text" as const },
    page_probono_eyebrow: { value: "", valueEs: "Nuestra firma", type: "text" as const },
    page_probono_title: { value: "", valueEs: "Pro Bono", type: "text" as const },
  };
  const html = renderPage(template, config, "es", { body: "page_probono_body" }, undefined, ($) => {
    applyProBonoMedia($, config, "es");
  });
  const $ = cheerio.load(html);
  const body = $(".page__content--body");

  assert.equal(body.find("p").length, 1);
  assert.equal(body.text().match(/Von Wobeser y Sierra se enorgullece/g)?.length, 1);
  assert.equal(body.find("em").text(), "pro bono");
});

test("Artículos y Comunicaciones comparten una cabecera visible y una búsqueda accesible", () => {
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
    { page: 2, totalPages: 3, totalItems: 31 },
    {
      basePath: "/articles",
      query: `arbitration & competition`,
      editorialHeader: {
        eyebrow: { en: "Insights", es: "Insights" },
        title: { en: "Articles", es: "Artículos" },
        description: {
          en: "Legal articles and opinion pieces authored by Von Wobeser y Sierra attorneys.",
          es: "Artículos y columnas de opinión escritos por los abogados de Von Wobeser y Sierra.",
        },
      },
    },
  );

  assert.match(html, /action="\/articles" method="get"/);
  assert.match(html, /name="lang" value="en"/);
  assert.match(html, /q=arbitration\+%26\+competition&amp;page=1&amp;lang=en/);
  assert.match(html, /value="arbitration &amp; competition"/);
  assert.doesNotMatch(html, /id="adminForm"|index\.php\/results/);
  assert.match(html, /name="robots" content="noindex,follow"/);
  const $ = cheerio.load(html);
  assert.equal($(".vw-publications-page__eyebrow").text(), "Insights");
  assert.equal($("h1.vw-publications-page__title").text(), "Articles");
  assert.match($(".vw-publications-page__lede").text(), /Legal articles and opinion pieces/);
  assert.equal($(".vw-publications-page__header").nextAll(".archive__filters").first().hasClass("vw-publications-search"), true);
  assert.equal($(".archive__filters").hasClass("vw-publications-search"), true);
  assert.equal($(".vw-publications-search__field svg").attr("aria-hidden"), "true");
  assert.equal($(".vw-publications-search__submit").text(), "Search");
  assert.equal($(".vw-publications-search__count").text(), "31 results");
  assert.equal($(".vw-publications-search__clear").attr("href"), "/articles?lang=en");
  assert.equal($("#vw-publications-search-q").attr("minlength"), "2");
  assert.equal($("#vw-publications-search-q").attr("placeholder"), "Search by title, topic or keyword…");
  assert.equal($("#vw-publications-search-q").is("[data-vw-publications-q]"), true);

  const communications = cheerio.load(renderNewsList(
    template,
    [],
    "es",
    { page: 1, totalPages: 1, totalItems: 0 },
    {
      basePath: "/perspectivas/comunicaciones",
      editorialHeader: {
        eyebrow: { en: "Insights", es: "Insights" },
        title: { en: "Communications", es: "Comunicaciones" },
        description: {
          en: "Communications and news from Von Wobeser y Sierra.",
          es: "Comunicaciones y actualidad de Von Wobeser y Sierra.",
        },
      },
    },
  ));
  assert.equal(communications("h1.vw-publications-page__title").text(), "Comunicaciones");
  assert.match(communications(".vw-publications-page__lede").text(), /actualidad de Von Wobeser/);
  assert.equal(communications("#vw-publications-search-q").attr("placeholder"), "Buscar por título, tema o palabra clave…");
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

test("Contacto usa la jerarquía aprobada, conserva el mapa y ofrece País y Área de asesoría", () => {
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
      office_map_directions: { value: "https://www.google.com/maps/dir/?api=1&destination=official", valueEs: "", type: "url" },
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
  assert.ok($(".vw-contact-location-section").index() > $section.index());
  assert.equal($(".vw-contact-page__eyebrow").text(), "CONTACTO");
  assert.equal($(".vw-contact-page__title").text(), "Estamos aquí para ayudarte");
  assert.equal(
    $(".vw-contact-page__lede").text(),
    "Ponte en contacto con nosotros o visita nuestras oficinas en Ciudad de México.",
  );
  assert.equal($(".vw-contact-page__details a[href^='mailto:']").attr("href"), "mailto:info@vwys.com.mx");
  assert.match($(".vw-contact-page__details address").text(), /Arquímedes N.º 10/);
  assert.equal($(".vw-contact-location-section__heading h2").text(), "Nuestra ubicación");
  assert.equal($(".vw-contact-page__map-card").length, 1);
  assert.equal($(".vw-contact-page__details").length, 1);
  assert.equal($(".vw-contact-location__action--primary").attr("href"), "https://www.google.com/maps/dir/?api=1&destination=official");
  assert.match($.html(), /Hablemos|Enviar ahora/);
  assert.match($.html(), /option value="arbitraje">Arbitraje/);
  assert.doesNotMatch($.html(), /german-desk|Desk Alemán|value="oculta"/);
  assert.doesNotMatch($.html(), /id="vwContactForm" class="careers__form"/);
  assert.match($.html(), /\.vw-contact-form\{display:grid;grid-template-columns:repeat\(2/);
  assert.match($.html(), /@media\(max-width:720px\).*grid-template-columns:1fr/s);
  assert.match($.html(), /fetch\('\/api\/contact'/);
  assert.equal($("input[name='country']").attr("required"), "required");
  assert.equal($("input[name='country']").attr("autocomplete"), "country-name");
  assert.match($.html(), /country:\s*form\.country\.value/);
  assert.match($.html(), /Área de asesoría \(opcional\)/);
  assert.equal($("#vw-contact-privacy").attr("required"), "required");
  assert.match($.html(), /name="acceptPrivacy"/);
  assert.match($.html(), /acceptPrivacy:\s*!!form\.acceptPrivacy\.checked/);
  assert.match($.html(), /href="\/aviso"/);
  assert.match($.html(), /Aviso de Privacidad/);
  assert.match($.html(), /\.vw-contact-privacy a\{color:#ac162c;font-weight:500/);
  assert.match($.html(), /\.vw-contact-privacy\{display:flex;align-items:center;gap:14px;min-height:56px/);
  assert.match($.html(), /\.vw-contact-field\{display:grid;gap:8px[^}]*text-transform:none/);
  assert.match($.html(), /\.vw-contact-page__title\{[^}]*text-transform:none/);
  assert.match($.html(), /\.vw-contact-page__location\{display:grid;grid-template-columns:minmax\(0,1\.15fr\) minmax\(300px,\.85fr\);gap:24px/);
  assert.match($.html(), /\.vw-contact-page \.page__map\{float:none;width:100%;max-width:none;margin:0\}/);
  assert.match($.html(), /\.vw-contact-page \.page__map--holder\{position:relative;box-sizing:border-box;padding-top:0;background:#dededb\}/);
  assert.match($.html(), /@media\(max-width:980px\)\{\.vw-contact-page__location\{grid-template-columns:1fr\}[^}]*min-height:380px/);
  assert.match($.html(), /@media\(max-width:720px\)\{.*?\.vw-contact-page__location\{margin-top:28px\}.*?min-height:320px/s);
  assert.match($.html(), /@media\(max-width:720px\)\{\.vw-contact-page\{padding-top:112px;padding-bottom:56px\}/);
  assert.doesNotMatch($.html(), /#a5102a/);
  assert.match($.html(), /Torre SOMA Chapultepec, piso 18/);
  assert.doesNotMatch($.html(), /18th floor/);
  assert.equal($(".page__map--holder iframe").attr("src"), "https://www.google.com/maps/embed?pb=official");
  assert.match($(".page__map--holder iframe").attr("title") || "", /Ubicación de Von Wobeser/);
  assert.equal($(".page__map--holder iframe").attr("data-vwb-contact-map"), "always");
});

test("Contacto elimina el punto final heredado del título en ambos idiomas", () => {
  for (const [lang, expected] of [["es", "Estamos aquí para ayudarte"], ["en", "We are here to help"]] as const) {
    const $ = cheerio.load(chrome);
    applyContactForm($, lang, {
      page_contact_title: {
        value: "We are here to help.",
        valueEs: "Estamos aquí para ayudarte.",
        type: "text",
      },
    });
    assert.equal($(".vw-contact-page__title").text(), expected);
  }
});

test("Contacto no conserva un iframe heredado si la configuración no es un embed seguro de Google Maps", () => {
  const $ = cheerio.load(chrome);
  $(".page__map--holder").html('<iframe src="https://www.google.com/maps/embed?pb=legacy"></iframe>');
  applyContactForm($, "en", {
    office_map_embed: { value: "https://example.com/embed", valueEs: "", type: "url" },
  });

  assert.equal($(".page__map--holder iframe").length, 0);
  assert.doesNotMatch($.html(), /example\.com|pb=legacy/);
  assert.equal($(".vw-contact-location__action--primary").attr("href"), "https://www.google.com/maps/dir/?api=1&destination=19.427559,-99.195333");
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

test("Contacto solo abre direcciones de Google Maps administradas", () => {
  const $ = cheerio.load(chrome);
  applyContactForm(
    $,
    "es",
    {
      office_map_directions: { value: "javascript:alert(1)", valueEs: "javascript:alert(1)", type: "url" },
    },
    [],
  );

  const directions = $(".vw-contact-location__action--primary").attr("href");
  assert.equal(directions, "https://www.google.com/maps/dir/?api=1&destination=19.427559,-99.195333");
  assert.doesNotMatch($.html(), /javascript:/i);
});

test("País es obligatorio, se persiste mediante una migración aditiva y conserva datos históricos", () => {
  const valid = contactFormSchema.safeParse({
    fullName: "María González",
    email: "maria@example.com",
    country: "México",
    message: "Solicito asesoría.",
    acceptPrivacy: true,
  });
  assert.equal(valid.success, true);
  assert.equal(contactFormSchema.safeParse({
    fullName: "María González",
    email: "maria@example.com",
    message: "Solicito asesoría.",
    acceptPrivacy: true,
  }).success, false);

  const migration = fs.readFileSync(
    "migrations/20260814_0001_contact_country.sql",
    "utf8",
  );
  assert.match(migration, /ALTER TABLE contact_submissions/i);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS country text/i);
  assert.doesNotMatch(migration, /\bDROP\b|NOT NULL/i);
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
