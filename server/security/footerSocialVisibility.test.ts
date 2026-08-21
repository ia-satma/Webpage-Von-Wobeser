import assert from "node:assert/strict";
import test from "node:test";
import * as cheerio from "cheerio";

process.env.DATABASE_URL ||= "postgresql://test:test@127.0.0.1:5432/test";

const { injectFooterString } = await import("../mirror/index");
const { renderOfficeShowcase } = await import("../mirror/renderOfficeShowcase");
const { isConfigEnabled } = await import("../mirror/siteConfig");
import type { ConfigMap } from "../mirror/siteConfig";

const config = (values: Record<string, string>): ConfigMap =>
  Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, { value, valueEs: value, type: "text" }]),
  );

const footer = `<footer>
  <div style="width:90px; margin: 0 auto; padding-top:20px;">
    <a href="https://www.facebook.com/original" target="_blank"><img src="/images/icon_facebook_gray.png"></a>
    <a href="https://twitter.com/original" target="_blank"><img src="/images/icon_twitter_gray.png"></a>
    <a href="https://mx.linkedin.com/company/original" target="_blank"><img src="/images/icon_linkedin_gray.png"></a>
  </div>
</footer>`;

test("Facebook permanece oculto por defecto y las demás redes siguen visibles", () => {
  const rendered = injectFooterString(footer, {}, "es");
  const $ = cheerio.load(rendered);

  assert.equal($(".vw-footer-socials a").length, 2);
  assert.equal($(".vw-footer-social--facebook").length, 0);
  assert.equal(isConfigEnabled({}, "footer_facebook_visible", false), false);
});

test("cada red puede ocultarse sin modificar los enlaces de las demás", () => {
  const contentLink = '<main><a href="https://www.facebook.com/contenido">Contenido relacionado</a></main>';
  const rendered = injectFooterString(`${contentLink}${footer}`, config({
    footer_facebook_visible: "false",
    footer_twitter_visible: "true",
    footer_linkedin_visible: "true",
    footer_twitter: "https://x.com/VWySOficial",
    footer_linkedin: "https://www.linkedin.com/company/von-wobeser-y-sierra/",
  }), "es");
  const $ = cheerio.load(rendered);

  assert.equal($('main a[href="https://www.facebook.com/contenido"]').length, 1);
  assert.equal($('footer a[href*="facebook.com"]').length, 0);
  assert.equal($('a[href="https://x.com/VWySOficial"]').length, 1);
  assert.equal($('a[href*="linkedin.com/company/von-wobeser"]').length, 1);
  assert.equal($(".vw-footer-socials a").length, 2);
  assert.equal($(".vw-footer-social--x svg").length, 1);
  assert.equal($(".vw-footer-social--x img").length, 0);
  assert.equal($(".vw-footer-social--x").attr("aria-label"), "X");
  assert.equal($(".vw-footer-social--x").attr("rel"), "noopener noreferrer");
});

test("los iconos históricos se sustituyen por SVG nítidos y Twitter usa X", () => {
  const rendered = injectFooterString(footer, config({ footer_facebook_visible: "true" }), "es");
  const $ = cheerio.load(rendered);

  assert.equal($(".vw-footer-socials img").length, 0);
  assert.equal($(".vw-footer-socials svg").length, 3);
  assert.equal($(".vw-footer-social--facebook").attr("aria-label"), "Facebook");
  assert.equal($(".vw-footer-social--linkedin").attr("aria-label"), "LinkedIn");
  assert.equal($(".vw-footer-social--x").attr("href"), "https://x.com/original");
});

test("el contenedor social desaparece cuando las tres redes están ocultas", () => {
  const rendered = injectFooterString(footer, config({
    footer_facebook_visible: "false",
    footer_twitter_visible: "false",
    footer_linkedin_visible: "false",
  }), "en");

  assert.doesNotMatch(rendered, /vw-footer-socials|facebook\.com|twitter\.com|linkedin\.com/);
});

test("Nuevas Oficinas hereda la visibilidad global de LinkedIn y X desde el pie compartido", async () => {
  const { renderPublicFooter } = await import("../mirror/renderFooter");
  const template = `<!doctype html><html><head></head><body>
    <footer>
      <img src="/logo.png">
      <a class="mb-1"></a>
      <span class="follow-text"></span>
      <a aria-label="LinkedIn" href="https://linkedin.com/original"></a>
      <a aria-label="X" href="https://x.com/original"></a>
    </footer>
  </body></html>`;
  const sharedConfig = config({
    footer_linkedin_visible: "true",
    footer_twitter_visible: "false",
    footer_linkedin: "https://www.linkedin.com/company/von-wobeser-y-sierra/",
  });
  const rendered = renderPublicFooter(renderOfficeShowcase(template, sharedConfig, "es", undefined, []), sharedConfig, "es");
  const $ = cheerio.load(rendered);

  assert.equal($('.vwb-site-footer__social-link[aria-label="LinkedIn"]').length, 1);
  assert.equal($('.vwb-site-footer__social-link[aria-label="X"]').length, 0);
  assert.equal($(".vwb-site-footer__socials h2").text(), "Síguenos");
});
