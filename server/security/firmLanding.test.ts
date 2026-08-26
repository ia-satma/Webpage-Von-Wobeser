import { readMirrorSources } from "./mirrorTestSources";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

process.env.DATABASE_URL ||= "postgresql://test:test@127.0.0.1:5432/test";

const { renderFirmLanding } = await import("../mirror/renderFirmLanding");
const { renderHome } = await import("../mirror/renderHome");
const { applyCareersFormFix } = await import("../mirror/formsFix");
const { load } = await import("cheerio");

const template = `<!doctype html><html lang="es"><head><title>Anterior</title></head><body>
  <header><a class="header__lang--item" href="#">ENG</a></header>
  <div id="top"><section class="page"><div class="page__content">Anterior</div></section></div>
  <footer></footer>
</body></html>`;

test("landing de Firma usa hechos verificados y cifras publicadas", () => {
  const html = renderFirmLanding(template, {
    firm_landing_stat_3_value: { value: "19", valueEs: "19", type: "text" },
    firm_landing_stat_2_label: { value: "Attorneys", valueEs: "Abogados", type: "text" },
  }, "es", {
    teamMembers: [{ published: true }, { published: true }, { published: false }],
    practices: [
      { published: true, slug: "arbitraje" },
      { published: true, slug: "administrative-law" },
      { published: true, slug: "german-desk" },
    ],
    industries: [{ published: true }, { published: false }],
  });

  assert.match(html, /Von Wobeser y Sierra/);
  assert.match(html, /Desde 1986/);
  const document = load(html);
  assert.deepEqual(
    document(".vw-firm__stats-grid dd").map((_, element) => document(element).text()).get(),
    ["40+", "Más de 180", "1", "1"],
  );
  assert.equal(document(".vw-firm__stat-value--team .vw-firm__stat-prefix").text(), "Más de");
  assert.equal(document(".vw-firm__stat-value--team .vw-firm__stat-number").text(), "180");
  assert.match(html, /\.vw-firm__stat-value--team\{position:relative;display:block/);
  assert.match(html, /\.vw-firm__stat-prefix\{position:absolute;left:0;bottom:calc\(100% \+ \.45rem\)/);
  assert.match(html, /Integrantes del equipo legal/);
  assert.doesNotMatch(html, /<dt>Abogados<\/dt>/);
  assert.doesNotMatch(html, /1952|70 años|seven decades|german desk/i);
  assert.doesNotMatch(html, /<section[^>]+id="(?:cultura|diversidad|reconocimientos)"/);
  assert.doesNotMatch(html, /<section[^>]+vw-firm__pathways/);
  assert.match(html, /\.vw-firm__stats\{background:var\(--vw-red\)/);
  assert.match(html, /\.vw-firm__cta\{background:var\(--vw-red\)/);
  assert.match(html, /src="\/img\/Collage\/collage_02\.jpg"/);
  assert.match(html, /src="\/img\/Collage\/collage_07\.jpg"/);
  assert.match(html, /Área de colaboración en las oficinas de Von Wobeser y Sierra/);
  assert.match(html, /class="vw-firm__eyebrow">Nuestra firma<\/p>/);
  assert.match(html, /class="vw-firm__container vw-firm__hero-heading"[\s\S]*?class="vw-firm__hero-rule"/);
  assert.equal(document(".vw-firm__hero .vw-firm__feature-media").length, 0);
  assert.equal(document(".vw-firm__history .vw-firm__feature-media").length, 1);
  assert.match(document(".vw-firm__history .vw-firm__feature-media").html() ?? "", /src="\/img\/Collage\/collage_02\.jpg"/);
  assert.equal(document(".vw-firm__history").next().hasClass("vw-firm__stats"), true);
});

test("landing de Firma respeta visibilidad, orden y escape de contenido", () => {
  const config = {
    firm_landing_history_visible: { value: "false", valueEs: "false", type: "boolean" },
    firm_landing_values_order: { value: "1", valueEs: "1", type: "number" },
    firm_landing_stats_order: { value: "2", valueEs: "2", type: "number" },
    firm_landing_title: { value: "Our Firm", valueEs: "<script>alert(1)</script>Nuestra Firma", type: "text" },
  };
  const html = renderFirmLanding(template, config, "es");

  assert.doesNotMatch(html, /id="historia"/);
  assert.ok(html.indexOf('id="valores"') < html.indexOf('id="cifras"'));
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;Nuestra Firma/);
});

test("landing de Firma genera canonical y hreflang con rutas limpias distintas", () => {
  const htmlEs = renderFirmLanding(template, {}, "es");
  const htmlEn = renderFirmLanding(template.replace('lang="es"', 'lang="en"'), {}, "en");

  assert.match(htmlEs, /rel="canonical" href="https:\/\/www\.vonwobeser\.com\/acerca-de"/);
  assert.match(htmlEs, /href="https:\/\/www\.vonwobeser\.com\/about" hreflang="en"/);
  assert.match(htmlEn, /rel="canonical" href="https:\/\/www\.vonwobeser\.com\/about"/);
  assert.match(htmlEn, /href="https:\/\/www\.vonwobeser\.com\/acerca-de" hreflang="es-MX"/);
});

test("landing de Firma conserva un eyebrow personalizado y usa una escala editorial compartida", () => {
  const html = renderFirmLanding(template, {
    firm_landing_eyebrow: { value: "About the firm", valueEs: "La firma", type: "text" },
  }, "es");

  assert.match(html, /class="vw-firm__eyebrow">La firma<\/p>/);
  assert.match(html, /font:400 clamp\(2\.6rem,4\.7vw,4\.75rem\)\/1\.08 var\(--vw-font-editorial\)/);
  assert.match(html, /\.vw-firm__hero\{display:block;min-height:0;padding:clamp\(6rem,7vw,7\.5rem\) 0 2rem/);
  assert.match(html, /@media\(max-width:900px\)\{\.vw-firm__hero\{min-height:0;padding:5\.75rem 0 2\.5rem/);
  assert.match(html, /@media\(max-width:560px\)\{\.vw-firm__hero\{padding:5\.25rem 0 2\.5rem/);
  assert.match(html, /vw-firm__feature-media\{position:relative;display:block;width:min\(100% - 8vw,86rem\);aspect-ratio:21\/7/);
  assert.match(html, /vw-firm__history\{padding:3\.25rem 0 0\}/);
  assert.match(html, /font-family:var\(--vw-font-editorial\)/);
  assert.match(html, /font-family:var\(--vw-font-body\)/);
  assert.doesNotMatch(html, />01 — 05</);
  assert.match(html, /\.vw-firm__values-heading\{display:grid;grid-template-columns:minmax\(0,1fr\)/);
  assert.match(html, /\.vw-firm__values\{background:var\(--vw-paper\);padding:clamp\(3\.75rem,5\.5vw,5\.75rem\)/);
  assert.match(html, /\.vw-firm__history-grid\{display:grid;grid-template-columns:minmax\(20rem,4\.5fr\) minmax\(0,5\.5fr\)/);
  assert.match(html, /\.vw-firm__history-media\{height:clamp\(16rem,23vw,21rem\);margin:2\.2rem 0 0;overflow:hidden\}/);
  assert.doesNotMatch(html, /\.vw-firm__history-media\{[^}]*border-top/);
});

test("landing de Firma ofrece prácticas, industrias y contacto en el CTA final bilingüe", () => {
  const htmlEs = renderFirmLanding(template, {}, "es");
  const htmlEn = renderFirmLanding(template.replace('lang="es"', 'lang="en"'), {}, "en");
  const ctaEs = htmlEs.match(/<section class="vw-firm__section vw-firm__cta[\s\S]*?<\/section>/)?.[0] ?? "";
  const ctaEn = htmlEn.match(/<section class="vw-firm__section vw-firm__cta[\s\S]*?<\/section>/)?.[0] ?? "";

  assert.match(ctaEs, /Prácticas/);
  assert.match(ctaEs, /Industrias/);
  assert.match(ctaEs, /class="vw-firm__eyebrow">VW<\/p>/);
  assert.doesNotMatch(ctaEs, /class="vw-firm__eyebrow">VWyS<\/p>/);
  assert.match(ctaEs, /href="\/capacidades\/industrias"/);
  assert.match(ctaEs, /Contacto/);
  assert.doesNotMatch(ctaEs, /Prácticas legales/);
  assert.match(ctaEn, /Practices/);
  assert.match(ctaEn, /Industries/);
  assert.match(ctaEn, /href="\/capabilities\/industries"/);
  assert.match(ctaEn, /Contact/);
  assert.doesNotMatch(ctaEn, /Legal practices/);
});

test("Carrera y Pasantes usan la jerarquía editorial bilingüe de las subpáginas", () => {
  const spanish = load('<div class="careers__meta"><div class="page__ttl--holder"><span>CARRERA EN VWyS</span></div></div>');
  const english = load('<div class="careers__meta"><div class="page__ttl--holder"><span>CAREER AT VWyS</span></div></div>');
  const interns = load(`<!doctype html><html><head></head><body><section class="page careers"><div class="careers--wrap"><div class="careers__meta"><div class="page__ttl"><div class="page__ttl--holder"><span>PASANTES</span></div></div><div class="careers__content"><div class="page__content--intro"><p>Introducción editable.</p></div></div></div><form id="careersForm"></form></div></section></body></html>`);

  applyCareersFormFix(spanish, "es");
  applyCareersFormFix(english, "en");
  applyCareersFormFix(interns, "es");

  assert.equal(spanish(".page__ttl--holder > span").text(), "CARRERA EN VW");
  assert.equal(english(".page__ttl--holder > span").text(), "CAREER AT VW");
  assert.equal(interns(".vw-careers-header__eyebrow").text(), "Talento");
  assert.equal(interns(".vw-careers-header h1").text(), "Pasantes");
  assert.equal(interns(".vw-careers-header__description").text(), "Introducción editable.");
  assert.equal(interns(".careers__content > .page__content--intro").length, 0);
  assert.match(interns.html(), /\.vw-careers-header h1/);
  assert.match(interns.html(), /grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/);
});

test("Carrera y Pasantes comparten la superficie de formulario de Contacto sin cambiar su envío", () => {
  const page = load(`<!doctype html><html><head></head><body>
    <section class="page careers"><form id="careersForm" class="careers__form" action="" enctype="multipart/form-data">
      <label class="careers__form--label">Nombre<input class="careers__form--input" name="name"></label>
      <label class="careers__form--label">Apellido<input class="careers__form--input" name="l_name"></label>
      <label class="careers__form--label">Correo<input class="careers__form--input" name="mail" type="email"></label>
      <label class="careers__form--label">Teléfono<input class="careers__form--input" name="tel"></label>
      <label class="careers__form--button"><span>Adjuntar CV</span><input name="uploaded_file" type="file"></label>
      <label class="careers__form--label checkbox"><input class="careers__form--checkbox" name="accept" type="checkbox"><span>Aviso de privacidad</span></label>
      <input id="filename" style="border:0">
      <label class="careers__form--label submit" style="margin-top:10px"><input class="careers__form--submit" type="submit"></label>
      <p style="color:#fff">Ayuda</p><img class="loader">
    </form></section></body></html>`);

  applyCareersFormFix(page, "es");

  assert.equal(page("#careersForm").attr("action"), "/api/career-applications");
  assert.equal(page("#careersForm").hasClass("vw-careers-form"), true);
  assert.equal(page("[name='name']").attr("autocomplete"), "given-name");
  assert.equal(page("[name='l_name']").attr("autocomplete"), "family-name");
  assert.equal(page("[name='mail']").attr("autocomplete"), "email");
  assert.equal(page("[name='accept']").attr("required"), "required");
  assert.equal(page(".vw-careers-form__upload").length, 1);
  assert.equal(page(".vw-careers-form__privacy").length, 1);
  assert.equal(page(".vw-careers-form__filename").attr("placeholder"), "Ningún archivo seleccionado");
  assert.equal(page(".vw-careers-form__help").length, 1);
  assert.match(page.html(), /id="vw-careers-form-style"/);
  assert.match(page.html(), /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(page.html(), /width:calc\(50% - 30px\)!important/);
  assert.match(page.html(), /margin:0 0 0 auto!important/);
  assert.match(page.html(), /@media\(max-width:980px\)/);
  assert.match(page.html(), /fetch\('\/api\/career-applications'/);
  assert.match(page.html(), /fileInput\.addEventListener\('change'/);
});

test("el llamado final de Cultura conserva jerarquía móvil sin separar el formulario", () => {
  const culture = load(`<!doctype html><html><head></head><body>
    <section class="page careers"><div class="careers--wrap">
      <div class="careers__meta"><div class="page__ttl"><div class="page__ttl--holder"><span>CARRERA EN VWyS</span></div></div>
        <div class="careers__content">
          <div class="page__content--intro"><p>Introducción editable.</p></div>
          <div class="page__content--body"><p>Contenido editable.</p></div>
          <div class="page__content--intro"><p>Si estás interesado en formar parte de nuestro equipo, contáctanos.</p></div>
        </div>
      </div>
      <form id="careersForm"></form>
    </div></section>
  </body></html>`);

  applyCareersFormFix(culture, "es");

  assert.equal(culture(".vw-careers-copy__cta").text(), "Si estás interesado en formar parte de nuestro equipo, contáctanos.");
  assert.equal(culture("#careersForm").hasClass("vw-careers-form--culture"), true);
  assert.match(culture.html(), /\.vw-careers-copy__cta\{margin:26px 0 0!important;border:0!important;color:#616161;font:400 16px\/1\.68 var\(--vw-font-body\)/);
  assert.match(culture.html(), /\.vw-careers-copy__cta p\{margin:0!important;color:inherit!important;font:inherit!important/);
  assert.match(culture.html(), /\.vw-careers-form--culture\{margin-top:1\.5rem!important/);
});

test("la migración del CTA conserva personalizaciones y convierte solamente los tres valores heredados", () => {
  const migration = readFileSync(
    new URL("../../migrations/20260807_0001_firm_landing_cta_industries.sql", import.meta.url),
    "utf8",
  );

  assert.match(migration, /firm_landing_cta_2_label[\s\S]*Legal practices[\s\S]*Prácticas legales/);
  assert.match(migration, /firm_landing_cta_3_label[\s\S]*value = 'Contact'[\s\S]*value_es = 'Contacto'/);
  assert.match(migration, /firm_landing_cta_3_path[\s\S]*value = '\/contact'[\s\S]*value_es = '\/contacto'/);
  assert.match(migration, /firm_landing_cta_4_label/);
  assert.match(migration, /firm_landing_cta_4_path/);
  assert.doesNotMatch(migration, /DELETE\s+FROM\s+site_config/i);
});

test("landing de Firma usa medios, destinos y metadatos bilingües administrables", () => {
  const config = {
    firm_landing_hero_image: { value: "/media/firm-en.jpg", valueEs: "/media/firm-es.jpg", type: "url" },
    firm_landing_history_image: { value: "/media/history-en.jpg", valueEs: "/media/history-es.jpg", type: "url" },
    firm_landing_history_image_alt: { value: "English office", valueEs: "Oficina en español", type: "text" },
    firm_landing_cta_1_path: { value: "/our-team", valueEs: "/nuestro-equipo", type: "url" },
    firm_landing_canonical: { value: "/about-vwys", valueEs: "/acerca-de-vwys", type: "url" },
    firm_landing_social_title: { value: "About VWyS", valueEs: "Conoce VWyS", type: "text" },
    firm_landing_social_description: { value: "English social copy", valueEs: "Texto social en español", type: "text" },
  };
  const html = renderFirmLanding(template, config, "es");

  assert.match(html, /src="\/media\/firm-es\.jpg"/);
  assert.match(html, /src="\/media\/history-es\.jpg" alt="Oficina en español"/);
  assert.match(html, /href="\/nuestro-equipo"/);
  assert.match(html, /rel="canonical" href="https:\/\/www\.vonwobeser\.com\/acerca-de-vwys"/);
  assert.match(html, /property="og:title" content="Conoce VWyS"/);
  assert.match(html, /name="twitter:description" content="Texto social en español"/);
});

test("landing de Firma muestra la presentación institucional canónica editable", () => {
  const config = {
    page_firm_intro: {
      value: "Our multidisciplinary team provides comprehensive legal advice across the firm's practices and industry groups.",
      valueEs: "Von Wobeser y Sierra nació en 1986 con la excelencia y la integridad como piedras angulares. Hoy, nuestro equipo multidisciplinario brinda asesoría jurídica integral a través de las prácticas y grupos por industria de la firma.",
      type: "text",
    },
    page_firm_body: {
      value: "We work as a strategic partner, combining preventive and responsive legal advice.",
      valueEs: "El medio empresarial y legal reconoce a nuestro equipo por su experiencia, especialización y capacidad para asesorar a compañías líderes durante su desarrollo en México y en el extranjero.\n\nTrabajamos como un socio estratégico, combinando asesoría preventiva y resolutiva con un entendimiento profundo del negocio de cada cliente y de sus asuntos legales más relevantes.",
      type: "text",
    },
  };
  const html = renderFirmLanding(template, config, "es");

  assert.match(html, /piedras angulares/);
  assert.match(html, /El medio empresarial y legal reconoce/);
  assert.match(html, /socio estratégico/);
});

test("el video del home cae en el resumen separado aunque falte configuración", () => {
  const homeTemplate = `<!doctype html><html lang="es"><head><title>Home</title></head><body>
    <a href="/practice/arbitration"><video id="video_header"><source src="/video.mp4"></video></a>
  </body></html>`;
  const htmlEs = renderHome(homeTemplate, [], {}, "es");
  const htmlEn = renderHome(homeTemplate.replace('lang="es"', 'lang="en"'), [], {}, "en");

  assert.match(htmlEs, /href="\/acerca-de"/);
  assert.match(htmlEn, /href="\/about"/);
  assert.doesNotMatch(htmlEs, /href="\/practice\/arbitration"/);
});

test("las rutas de Firma apuntan a la landing canónica y conservan sus subpáginas", async () => {
  const source = readMirrorSources();

  assert.ok(source.includes('["/nuestra-firma", "/nuestra-firma/"]'));
  assert.ok(source.includes('redirectLegacy("/acerca-de", "es")'));
  assert.ok(source.includes('["/our-firm", "/our-firm/"]'));
  assert.ok(source.includes('redirectLegacy("/about", "en")'));
  assert.ok(source.includes('["/index.php/nuestra-firma", "/acerca-de", "es"]'));
  assert.ok(source.includes('["/index.php/our-firm", "/about", "en"]'));
  assert.ok(source.includes('"/nuestra-firma/probono"'));
  assert.ok(source.includes('"/nuestra-firma/diversidad"'));
});

test("el destino administrable del video rechaza protocolos activos", () => {
  const homeTemplate = `<!doctype html><html lang="es"><head><title>Home</title></head><body>
    <a href="/practice/arbitration"><video id="video_header"><source src="/video.mp4"></video></a>
  </body></html>`;
  const config = {
    hero_practice_link: { value: "javascript:alert(1)", valueEs: "javascript:alert(1)", type: "url" },
  };
  const html = renderHome(homeTemplate, [], config, "es");

  assert.match(html, /href="\/acerca-de"/);
  assert.doesNotMatch(html, /javascript:/i);
});
