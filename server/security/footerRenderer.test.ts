import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import * as cheerio from "cheerio";

process.env.DATABASE_URL ||= "postgresql://test:test@127.0.0.1:5432/test";

const { renderPublicFooter } = await import("../mirror/renderFooter");
import type { ConfigMap } from "../mirror/siteConfig";

const template = '<main><a href="https://example.com">Contenido</a></main><footer class="footer footer_fix"><p>Pie legacy</p></footer>';
const footerStyles = readFileSync(new URL("../../frontend-mirror/templates/beez3/css/von.css", import.meta.url), "utf8");

function config(values: Record<string, string>): ConfigMap {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, { value, valueEs: value, type: "text" }]),
  );
}

test("el footer central conserva los datos, assets y enlaces esperados en español", () => {
  const output = renderPublicFooter(template, config({
    footer_facebook_visible: "false",
    footer_twitter_visible: "true",
    footer_linkedin_visible: "true",
    footer_twitter: "https://x.com/VWySOficial",
    footer_linkedin: "https://mx.linkedin.com/company/von-wobeser-y-sierra",
  }), "es");
  const $ = cheerio.load(output);

  assert.equal($(".vwb-site-footer").length, 1);
  assert.equal($("footer.footer_fix").length, 0);
  assert.equal($(".vwb-site-footer__column").length, 3);
  assert.equal($(".vwb-site-footer__column h2").eq(1).text(), "CAPACIDADES");
  assert.match($(".vwb-site-footer__column").eq(1).text(), /Áreas de Práctica/);
  assert.match($(".vwb-site-footer__column").eq(1).text(), /Grupos Industriales/);
  assert.doesNotMatch($(".vwb-site-footer__column").eq(1).text(), /\b(?:18|7)\b/);
  assert.equal($(".vwb-site-footer__logo").attr("src"), "/images/vw40F.png");
  assert.equal($(".vwb-site-footer__esr img").attr("src"), "/templates/beez3/img/esr.jpg");
  assert.equal($(".vwb-site-footer__social-link img[src=\"/images/icon_linkedin_gray.png\"]").length, 1);
  assert.equal($(".vwb-site-footer__social-link img[src=\"/images/icon_twitter_gray.png\"]").length, 1);
  assert.equal($(".vwb-site-footer__social-link img[src*=facebook]").length, 0);
  assert.equal($("[data-vwb-cookie-preferences=\"true\"]").length, 1);
  assert.equal($(".vwb-site-footer__admin-link").attr("aria-label"), "Panel de administración");
  assert.equal($(".vwb-site-footer__admin-icon").length, 1);
  assert.match(footerStyles, /\.vwb-site-footer__admin-link\s*\{[\s\S]*?opacity:\s*\.3/);
  assert.match(footerStyles, /\.vwb-site-footer__admin-link:focus-visible\s*\{[\s\S]*?opacity:\s*1/);
  assert.match(footerStyles, /\.vwb-site-footer__admin-icon\s*\{[\s\S]*?height:\s*11px[\s\S]*?width:\s*11px/);
});

test("el footer en inglés localiza rutas y neutraliza URLs o texto no confiables", () => {
  const output = renderPublicFooter(template, config({
    footer_firm: '<img src=x onerror=alert(1)>',
    footer_esr_image: "javascript:alert(1)",
    footer_twitter_visible: "true",
    footer_twitter: "javascript:alert(1)",
    footer_linkedin_visible: "false",
  }), "en");
  const $ = cheerio.load(output);

  assert.equal($(".vwb-site-footer__column h2").eq(0).text(), "THE FIRM");
  assert.equal($(".vwb-site-footer__column a[href=\"/capabilities/practices\"]").text(), "Practice areas");
  assert.equal($(".vwb-site-footer__esr img").attr("src"), "/templates/beez3/img/esr.jpg");
  assert.equal($(".vwb-site-footer__social-link").length, 0);
  assert.equal($(".vwb-site-footer__brand img[src=x]").length, 0);
  assert.match($(".vwb-site-footer__brand").text(), /<img src=x onerror=alert\(1\)>/);
  assert.doesNotMatch(output, /javascript:alert/);
});
