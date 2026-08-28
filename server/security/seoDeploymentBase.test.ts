import assert from "node:assert/strict";
import test from "node:test";
import * as cheerio from "cheerio";
import { applyA11y, resolvePublicBaseUrl } from "../mirror/seo";
import { renderPublicFooter } from "../mirror/renderFooter";

test("la URL pública prioriza configuración institucional y no usa previews de Replit", () => {
  assert.equal(
    resolvePublicBaseUrl("https://configured.example", {
      SITE_URL: "https://www.vonwobeser.com/",
      REPLIT_DOMAINS: "webpage-von-wobeser-2026.replit.app",
    }),
    "https://www.vonwobeser.com",
  );
  assert.equal(
    resolvePublicBaseUrl("https://configured.example", {
      REPLIT_DOMAINS: "webpage-von-wobeser-2026.replit.app, www.vonwobeser.com",
    }),
    "https://configured.example",
  );
  assert.equal(
    resolvePublicBaseUrl(undefined, {
      REPLIT_DOMAINS: "webpage-von-wobeser-2026.replit.app",
    }),
    "https://www.vonwobeser.com",
  );
  assert.equal(resolvePublicBaseUrl("https://configured.example", {}), "https://configured.example");
});

test("una publicación de Replit conserva el dominio canónico configurado", () => {
  assert.equal(
    resolvePublicBaseUrl("https://configured.example", {
      REPLIT_DEPLOYMENT: "1",
      SITE_URL: "https://www.vonwobeser.com",
      REPLIT_DOMAINS: "webpage-von-wobeser-2026.replit.app",
    }),
    "https://www.vonwobeser.com",
  );
});

test("la navegación publicada deja de enlazar la portada heredada, sin eliminar sus redirecciones", () => {
  const $ = cheerio.load(`
    <html><head></head><body>
      <a id="legacy-es" href="/index.php/home/index.html">Inicio</a>
      <a id="legacy-en" href="/index.html">Home</a>
      <a id="legacy-query" href="/index.php/index.html?lang=en#top">English</a>
      <a id="external" href="https://example.com/index.html">External</a>
    </body></html>
  `);

  applyA11y($, "en");

  assert.equal($("#legacy-es").attr("href"), "/?lang=en");
  assert.equal($("#legacy-en").attr("href"), "/?lang=en");
  assert.equal($("#legacy-query").attr("href"), "/?lang=en#top");
  assert.equal($("#external").attr("href"), "https://example.com/index.html");
});

test("el pie público también enlaza directamente a la portada canónica", () => {
  const footer = renderPublicFooter('<footer class="footer footer_fix"></footer>', {}, "es");
  const $ = cheerio.load(footer);
  assert.equal($(".vwb-site-footer__brand-link").attr("href"), "/");
  assert.doesNotMatch(footer, /index\.php\/home/);
});
