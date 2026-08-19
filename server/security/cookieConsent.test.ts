import { readMirrorSources } from "./mirrorTestSources";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as cheerio from "cheerio";

process.env.DATABASE_URL ||= "postgresql://test:test@127.0.0.1:5432/test";

const { applyA11y } = await import("../mirror/seo");
const { sanitizeCms } = await import("../mirror/sanitize");

test("el HTML público bloquea analítica y proveedores externos antes del consentimiento", () => {
  const $ = cheerio.load(`<!doctype html><html lang="es"><head>
    <script src="https://www.googletagmanager.com/gtag/js?id=G-TEST"></script>
    <script>gtag('config','G-TEST')</script>
  </head><body>
    <iframe src="https://www.youtube.com/embed/demo"></iframe>
    <iframe src="https://player.vimeo.com/video/123"></iframe>
    <iframe src="https://www.google.com/maps/embed?pb=demo"></iframe>
    <img src="https://i.ytimg.com/vi/demo/hqdefault.jpg" alt="Video">
    <a href="#" data-cookie-preferences>Preferencias de cookies</a>
  </body></html>`);

  applyA11y($, "es");

  assert.equal($('script[src*="googletagmanager"]').length, 0);
  assert.equal($("script").filter((_, node) => /gtag\(/.test($(node).html() || "")).length, 0);
  assert.equal($("iframe[src]").length, 0);
  assert.equal($("iframe[data-vwb-consent-src]").length, 3);
  assert.match($("iframe").eq(0).attr("data-vwb-consent-src") || "", /youtube-nocookie\.com/);
  assert.match($("iframe").eq(1).attr("data-vwb-consent-src") || "", /[?&]dnt=1/);
  assert.equal($('img[src^="https://i.ytimg.com"]').length, 0);
  assert.equal($("img[data-vwb-consent-image-src]").length, 1);
  assert.equal($('link[href^="/vwb-privacy-preferences.css"]').length, 1);
  assert.equal($('script[src^="/vwb-privacy-preferences.js"]').length, 1);
  assert.equal($('link[href^="/vwb-cookie-consent.css"]').length, 0);
  assert.equal($('script[src^="/vwb-cookie-consent.js"]').length, 0);
  assert.equal($('script[src^="/vwb-cookie-consent-config.js"]').length, 0);
});

test("el footer público coloca política y preferencias debajo del aviso de privacidad", () => {
  for (const [lang, path, label, privacyPath, privacyLabel] of [
    ["es", "/politica-de-cookies", "Política de cookies", "/aviso", "Aviso de privacidad"],
    ["en", "/cookie-policy", "Cookie Policy", "/privacy", "Privacy Notice"],
  ] as const) {
    const $ = cheerio.load(`<!doctype html><html><head></head><body><footer><div class="footer--copy">Todos los derechos reservados. <a href="${privacyPath}">${privacyLabel}</a><br>© Von Wobeser</div></footer></body></html>`);
    applyA11y($, lang);
    const $privacy = $(`footer a[href="${privacyPath}"]`);
    const $cookieRow = $privacy.nextAll(".vwb-cookie-footer-row").first();
    assert.equal($(`footer a[href="${path}"]`).text(), label);
    assert.equal($cookieRow.length, 1);
    assert.equal($cookieRow.find(`a[href="${path}"]`).length, 1);
    assert.equal($cookieRow.find('a[data-vwb-cookie-preferences="true"]').length, 1);
    assert.equal($cookieRow.prev().is("br"), true);
  }
});

test("los enlaces de cookies del footer mantienen contraste visible sobre el fondo institucional", () => {
  const css = readFileSync(new URL("../../public/vwb-cookie-consent.css", import.meta.url), "utf8");
  assert.match(css, /\.vwb-cookie-footer-row\{[^}]*color:#f6f3ee/);
  assert.match(css, /\.vwb-cookie-footer-link,\.vwb-cookie-policy-footer-link\{color:#f6f3ee!important/);
  assert.match(css, /font:400 \.82rem\/1\.45 var\(--vwb-body\)/);
});

test("el aviso de Google Maps queda dentro del rectángulo reservado para el mapa", () => {
  const css = readFileSync(new URL("../../public/vwb-cookie-consent.css", import.meta.url), "utf8");

  assert.match(css, /\.page__map--holder>\.vwb-external-consent\{position:absolute;inset:0;width:100%;height:100%;min-height:0;margin:0\}/);
});

test("el gestor conserva elección versionada, respeta GPC sin ocultar el aviso y revoca GA4", () => {
  const source = readFileSync(new URL("../../public/vwb-cookie-consent.js", import.meta.url), "utf8");
  const mirrorSource = readMirrorSources();

  assert.match(source, /vwb_cookie_consent/);
  assert.match(source, /\/api\/public\/privacy-preferences/);
  assert.doesNotMatch(source, /\/api\/public\/consent-config/);
  assert.match(source, /XMLHttpRequest/);
  assert.match(source, /SameSite=Lax/);
  assert.match(source, /Secure/);
  assert.match(source, /const secureAttribute = \(\) => location\.protocol === "https:" \? "; Secure" : ""/);
  assert.match(source, /Max-Age=0; Path=\/; SameSite=Lax\$\{secureAttribute\(\)\}/);
  assert.match(source, /Max-Age=0; Path=\/; Domain=\$\{domain\}; SameSite=Lax\$\{secureAttribute\(\)\}/);
  assert.match(source, /globalPrivacyControl/);
  assert.match(source, /analytics:\s*false/);
  assert.match(source, /external:\s*false/);
  assert.doesNotMatch(source, /globalPrivacyControl\s*===\s*true\s*&&\s*!choice\)\s*write/);
  assert.match(source, /if \(!choice\) banner\(\)/);
  assert.match(source, /_ga_/);
  assert.match(source, /googletagmanager\.com\/gtag\/js/);
  assert.match(source, /vwb:open-cookie-preferences/);
  assert.match(source, /validityMonths/);
  assert.match(mirrorSource, /\/vwb-privacy-preferences\.css/);
  assert.match(mirrorSource, /\/vwb-privacy-preferences\.js/);
  assert.match(mirrorSource, /\/vwb-privacy-preferences-config\.js/);
  assert.match(mirrorSource, /\/api\/public\/privacy-preferences/);
  assert.match(mirrorSource, /res\.sendFile\(assetPath/);
});

test("la política de cookies conserva tablas seguras editables", () => {
  const clean = sanitizeCms('<h2>Tecnologías</h2><table><thead><tr><th>Proveedor</th></tr></thead><tbody><tr><td>Von Wobeser</td></tr></tbody></table><script>alert(1)</script>');
  assert.match(clean, /<table>/);
  assert.match(clean, /<th>Proveedor<\/th>/);
  assert.match(clean, /<td>Von Wobeser<\/td>/);
  assert.doesNotMatch(clean, /<script/);
});

test("la política pública usa la composición editorial y las dos fuentes institucionales", () => {
  const css = readFileSync(new URL("../../public/vwb-cookie-consent.css", import.meta.url), "utf8");
  const mirrorSource = readMirrorSources();
  const policySource = readFileSync(new URL("../privacy/cookieConsent.ts", import.meta.url), "utf8");

  assert.match(css, /--vwb-title:"Gelasio",serif/);
  assert.match(css, /--vwb-body:"Inter",sans-serif/);
  assert.match(css, /\.vwb-cookie-policy__intro/);
  assert.match(css, /\.vwb-cookie-policy__table-shell/);
  assert.doesNotMatch(css, /\.vwb-cookie-policy__legal-note/);
  assert.doesNotMatch(css, /Atkinson|Publico|Geomanist|Optima/);
  assert.match(mirrorSource, /vwb-cookie-policy__table-shell/);
  assert.doesNotMatch(mirrorSource, /policyVersionLabel/);
  assert.match(policySource, /Infraestructura de alojamiento Replit \/ GAESA/);
  assert.match(policySource, /Replit hosting infrastructure \/ GAESA/);
});
