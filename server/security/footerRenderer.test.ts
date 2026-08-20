import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import * as cheerio from "cheerio";
import {
  DEFAULT_NAVIGATION_CONFIGURATION,
  NAVIGATION_CHILD_IDS,
  NAVIGATION_PRIMARY_IDS,
  type NavigationConfiguration,
} from "../../shared/navigation";
import type { NavigationAvailability, ResolvedNavigationTree } from "../mirror/navigationConfiguration";

process.env.DATABASE_URL ||= "postgresql://test:test@127.0.0.1:5432/test";

const { renderPublicFooter } = await import("../mirror/renderFooter");
const { resolveNavigationTree } = await import("../mirror/navigationConfiguration");
import type { ConfigMap } from "../mirror/siteConfig";

const template = '<main><a href="https://example.com">Contenido</a></main><footer class="footer footer_fix"><p>Pie legacy</p></footer>';
const footerStyles = readFileSync(new URL("../../frontend-mirror/templates/beez3/css/von.css", import.meta.url), "utf8");

function config(values: Record<string, string>): ConfigMap {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, { value, valueEs: value, type: "text" }]),
  );
}

function readyNavigation(lang: "es" | "en", mutate?: (value: NavigationConfiguration) => void): ResolvedNavigationTree {
  const configuration = structuredClone(DEFAULT_NAVIGATION_CONFIGURATION);
  mutate?.(configuration);
  const availability = Object.fromEntries(
    [...NAVIGATION_PRIMARY_IDS, ...Object.values(NAVIGATION_CHILD_IDS).flat()].map((id) => [id, {
      contentReady: true,
      reasonEs: "Contenido disponible",
      reasonEn: "Content available",
    }]),
  ) as NavigationAvailability;
  return resolveNavigationTree(configuration, availability, lang, "definitive-2026");
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
  assert.equal($(".vwb-site-footer__column h2").eq(0).text(), "La firma");
  assert.equal($(".vwb-site-footer__column h2").eq(1).text(), "Capacidades");
  assert.equal($(".vwb-site-footer__column a[href=\"/contacto\"]").text(), "Contacto");
  assert.equal($(".vwb-site-footer__column a[href=\"/capacidades/practicas\"]").text(), "Prácticas");
  assert.equal($(".vwb-site-footer__column a[href=\"/capacidades/industrias\"]").text(), "Industrias");
  assert.equal($(".vwb-site-footer__column a[href=\"/perspectivas\"]").text(), "Insights");
  assert.equal($(".vwb-site-footer__column a[href=\"/perspectivas/reconocimientos\"]").text(), "Reconocimientos");
  assert.equal($(".vwb-site-footer__socials h2").text(), "Síguenos");
  assert.match($(".vwb-site-footer__column").eq(1).text(), /Prácticas/);
  assert.match($(".vwb-site-footer__column").eq(1).text(), /Industrias/);
  assert.doesNotMatch($(".vwb-site-footer__column").eq(1).text(), /\b(?:18|7)\b/);
  assert.equal($(".vwb-site-footer__logo").attr("src"), "/images/vw40F.png");
  assert.equal($(".vwb-site-footer__esr img").attr("src"), "/templates/beez3/img/esr.jpg");
  assert.equal($(".vwb-site-footer__social-link img[src=\"/images/icon_linkedin_gray.png\"]").length, 1);
  assert.equal($(".vwb-site-footer__social-link img[src=\"/images/icon_twitter_gray.png\"]").length, 0);
  assert.equal($(".vwb-site-footer__social-link[aria-label=\"X\"] svg.vwb-site-footer__social-icon--x").length, 1);
  assert.equal($(".vwb-site-footer__social-link img[src*=facebook]").length, 0);
  assert.equal($("[data-vwb-cookie-preferences=\"true\"]").length, 1);
  assert.equal($(".vwb-site-footer__admin-link").attr("aria-label"), "Panel de administración");
  assert.equal($(".vwb-site-footer__admin-icon").length, 1);
  assert.match(footerStyles, /\.vwb-site-footer__admin-link\s*\{[\s\S]*?opacity:\s*\.3/);
  assert.match(footerStyles, /\.vwb-site-footer__admin-link:focus-visible\s*\{[\s\S]*?opacity:\s*1/);
  assert.match(footerStyles, /\.vwb-site-footer__admin-icon\s*\{[\s\S]*?height:\s*11px[\s\S]*?width:\s*11px/);
  assert.match(footerStyles, /\.vwb-site-footer h2,[\s\S]*?font-family:\s*var\(--vw-font-ui, "Inter", sans-serif\) !important[\s\S]*?text-transform:\s*none/);
  assert.match(footerStyles, /data-vwb-footer-nav-columns="2"/);
});

test("el footer central toma nombres, destinos y visibilidad de la navegación activa", () => {
  const navigation = readyNavigation("es", (value) => {
    value.items.find((item) => item.id === "firm")!.labelEs = "Firma administrada";
    value.items.find((item) => item.id === "practices")!.labelEs = "Prácticas administradas";
    value.items.find((item) => item.id === "industries")!.visible = false;
    value.items.find((item) => item.id === "talent")!.visible = false;
    const perspectives = value.items.find((item) => item.id === "perspectives")!;
    perspectives.children.find((item) => item.id === "perspectives-recognitions")!.visible = false;
    value.utilities.contact.labelEs = "Escríbenos";
  });
  const output = renderPublicFooter(template, config({}), "es", navigation);
  const $ = cheerio.load(output);

  assert.equal($(".vwb-site-footer__grid").attr("data-vwb-footer-nav-columns"), "3");
  assert.equal($(".vwb-site-footer__column a[href=\"/acerca-de\"]").text(), "Firma administrada");
  assert.equal($(".vwb-site-footer__column a[href=\"/capacidades/practicas\"]").text(), "Prácticas administradas");
  assert.equal($(".vwb-site-footer__column a[href=\"/contacto\"]").text(), "Contacto");
  assert.equal($(".vwb-site-footer__column a[href=\"/bolsa-de-trabajo\"]").length, 0);
  assert.equal($(".vwb-site-footer__column a[href=\"/capacidades/industrias\"]").length, 0);
  assert.equal($(".vwb-site-footer__column a[href=\"/perspectivas/reconocimientos\"]").length, 0);
});

test("el footer central oculta columnas vacías y el clásico sigue independiente del menú", () => {
  const navigation = readyNavigation("en", (value) => {
    value.items.find((item) => item.id === "practices")!.visible = false;
    value.items.find((item) => item.id === "industries")!.visible = false;
    value.items.find((item) => item.id === "perspectives")!.visible = false;
    value.items.find((item) => item.id === "firm")!.labelEn = "Custom firm";
  });
  const central = cheerio.load(renderPublicFooter(template, config({}), "en", navigation));
  assert.equal(central(".vwb-site-footer__grid").attr("data-vwb-footer-nav-columns"), "1");
  assert.equal(central(".vwb-site-footer__column").length, 1);
  assert.equal(central(".vwb-site-footer__column a[href=\"/about\"]").text(), "Custom firm");

  const classic = cheerio.load(renderPublicFooter(template, config({ footer_active_preset: "classic-vwys" }), "en", navigation));
  assert.equal(classic(".vwb-classic-footer__column h2").eq(0).text(), "THE FIRM");
  assert.equal(classic(".vwb-classic-footer").text().includes("Custom firm"), false);
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

  assert.equal($(".vwb-site-footer__column h2").eq(0).text(), "The firm");
  assert.equal($(".vwb-site-footer__column a[href=\"/capabilities/practices\"]").text(), "Practices");
  assert.equal($(".vwb-site-footer__esr img").attr("src"), "/templates/beez3/img/esr.jpg");
  assert.equal($(".vwb-site-footer__social-link").length, 0);
  assert.equal($(".vwb-site-footer__brand img[src=x]").length, 0);
  assert.match($(".vwb-site-footer__brand").text(), /<img src=x onerror=alert\(1\)>/);
  assert.doesNotMatch(output, /javascript:alert/);
});

test("el preset clásico conserva datos actuales y no reutiliza el HTML legacy sin sanitizar", () => {
  const output = renderPublicFooter(template, config({
    footer_active_preset: "classic-vwys",
    footer_firm: "Firma actualizada, S.C.",
    footer_address: "Dirección vigente\nCiudad de México",
    footer_phone: "+52 (55) 5258 1000",
    footer_website: "javascript:alert(1)",
    footer_twitter_visible: "true",
    footer_twitter: "https://x.com/VWySOficial",
    footer_linkedin_visible: "false",
  }), "es");
  const $ = cheerio.load(output);

  assert.equal($(".vwb-classic-footer").length, 1);
  assert.equal($(".vwb-site-footer").length, 0);
  assert.match($(".vwb-classic-footer__brand").text(), /Firma actualizada, S\.C\./);
  assert.equal($(".vwb-classic-footer__contact-row").length, 2);
  assert.equal($(".vwb-classic-footer__column h2").eq(0).text(), "LA FIRMA");
  assert.equal($(".vwb-classic-footer__social-link").length, 1);
  assert.equal($(".vwb-classic-footer__social-link[aria-label=\"X\"] img[src=\"/images/icon_twitter_gray.png\"]").length, 0);
  assert.equal($(".vwb-classic-footer__social-link[aria-label=\"X\"] svg.vwb-site-footer__social-icon--x").length, 1);
  assert.equal($(".vwb-classic-footer [data-vwb-cookie-preferences=true]").length, 1);
  assert.equal($(".vwb-classic-footer__admin-link").attr("aria-label"), "Panel de administración");
  assert.doesNotMatch(output, /javascript:alert/);
  assert.match(footerStyles, /\.vwb-classic-footer\{background:#111/);
});
