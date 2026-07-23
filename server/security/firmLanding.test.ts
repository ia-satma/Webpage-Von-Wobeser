import test from "node:test";
import assert from "node:assert/strict";

process.env.DATABASE_URL ||= "postgresql://test:test@127.0.0.1:5432/test";

const { renderFirmLanding } = await import("../mirror/renderFirmLanding");
const { renderHome } = await import("../mirror/renderHome");

const template = `<!doctype html><html lang="es"><head><title>Anterior</title></head><body>
  <header><a class="header__lang--item" href="#">ENG</a></header>
  <div id="top"><section class="page"><div class="page__content">Anterior</div></section></div>
  <footer></footer>
</body></html>`;

test("landing de Firma usa hechos verificados y cifras publicadas", () => {
  const html = renderFirmLanding(template, {}, "es", {
    teamMembers: [{ published: true }, { published: true }, { published: false }],
    practices: [{ published: true, slug: "arbitraje" }, { published: true, slug: "german-desk" }],
    industries: [{ published: true }, { published: false }],
  });

  assert.match(html, /Von Wobeser y Sierra/);
  assert.match(html, /Desde 1986/);
  assert.deepEqual(
    [...html.matchAll(/<dd>(.*?)<\/dd>/g)].map((match) => match[1]),
    ["40+", "2", "1", "1"],
  );
  assert.doesNotMatch(html, /1952|70 años|seven decades|german desk/i);
  assert.doesNotMatch(html, /<section[^>]+id="(?:cultura|diversidad|reconocimientos)"/);
  assert.doesNotMatch(html, /<section[^>]+vw-firm__pathways/);
  assert.match(html, /\.vw-firm__stats\{background:var\(--vw-red\)/);
  assert.match(html, /\.vw-firm__cta\{background:var\(--vw-red\)/);
  assert.match(html, /src="\/img\/Collage\/collage_02\.jpg"/);
  assert.match(html, /src="\/img\/Collage\/collage_07\.jpg"/);
  assert.match(html, /Área de colaboración en las oficinas de Von Wobeser y Sierra/);
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

test("landing de Firma reemplaza copias históricas obsoletas sin sobrescribir configuración", () => {
  const config = {
    firm_landing_history_intro: {
      value: "German Desk and three decades",
      valueEs: "Desk Alemán y tres décadas",
      type: "text",
    },
    firm_landing_history_body: {
      value: "Best Lawyers and Benchmark Litigation",
      valueEs: "Best Lawyers y Benchmark Litigation",
      type: "text",
    },
  };
  const html = renderFirmLanding(template, config, "es");

  assert.match(html, /Fundada en 1986/);
  assert.doesNotMatch(html, /Desk Alemán|Best Lawyers|Benchmark Litigation|tres décadas/i);
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
