import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as cheerio from "cheerio";
import {
  DEFAULT_NAVIGATION_CONFIGURATION,
  NAVIGATION_CHILD_IDS,
  NAVIGATION_DESTINATIONS,
  NAVIGATION_LANDING_CHILD_IDS,
  NAVIGATION_PRIMARY_IDS,
  type NavigationConfiguration,
} from "../../shared/navigation";
import type { NavigationAvailability } from "../mirror/navigationConfiguration";
import type { ConfigMap } from "../mirror/siteConfig";
import { buildSearchableEditorialPages } from "../mirror/searchEditorialPages";

process.env.DATABASE_URL ||= "postgresql://test:test@127.0.0.1:5432/test";

const {
  navigationConfigurationSchema,
  parseNavigationConfiguration,
  resolveNavigationTree,
} = await import("../mirror/navigationConfiguration");
const { applyNavigationMarkup } = await import("../mirror/navigationMarkup");
const { buildPublicNavigationMenu } = await import("../mirror/navigationMenu");
const { isSafeCatalogEmail, isSafeCatalogUrl } = await import("../routes/adminCatalogRoutes");

function cloneConfiguration(): NavigationConfiguration {
  return structuredClone(DEFAULT_NAVIGATION_CONFIGURATION);
}

function readyAvailability(): NavigationAvailability {
  return Object.fromEntries(
    [...NAVIGATION_PRIMARY_IDS, ...Object.values(NAVIGATION_CHILD_IDS).flat()].map((id) => [id, {
      contentReady: true,
      reasonEs: "Contenido disponible",
      reasonEn: "Content available",
    }]),
  ) as NavigationAvailability;
}

test("la navegación definitiva conserva orden, etiquetas y utilidades bilingües", () => {
  assert.deepEqual(NAVIGATION_PRIMARY_IDS, ["firm", "attorneys", "practices", "industries", "perspectives", "talent"]);
  assert.deepEqual(DEFAULT_NAVIGATION_CONFIGURATION.items.map((item) => item.labelEs), [
    "Nuestra firma", "Abogados", "Prácticas", "Industrias", "Perspectivas", "Talento",
  ]);
  assert.deepEqual(DEFAULT_NAVIGATION_CONFIGURATION.items.map((item) => item.labelEn), [
    "Our Firm", "Attorneys", "Practices", "Industries", "Insights", "Careers",
  ]);
  assert.equal(DEFAULT_NAVIGATION_CONFIGURATION.utilities.search.labelEs, "Buscar");
  assert.equal(DEFAULT_NAVIGATION_CONFIGURATION.utilities.search.labelEn, "Search");
  assert.equal(DEFAULT_NAVIGATION_CONFIGURATION.utilities.contact.labelEs, "Contáctanos");
  assert.equal(DEFAULT_NAVIGATION_CONFIGURATION.utilities.contact.labelEn, "Contact us");
  assert.equal(DEFAULT_NAVIGATION_CONFIGURATION.items.find((item) => item.id === "firm")?.children.find((child) => child.id === "firm-alumni")?.visible, false);
  assert.deepEqual(NAVIGATION_LANDING_CHILD_IDS, [
    "firm-overview",
    "attorneys-all",
    "practices-all",
    "industries-all",
    "perspectives-all",
    "talent-work",
  ]);
});

test("el contrato rechaza URLs, IDs duplicados y estructuras parciales", () => {
  assert.equal(navigationConfigurationSchema.safeParse(DEFAULT_NAVIGATION_CONFIGURATION).success, true);
  const arbitraryUrl = cloneConfiguration() as NavigationConfiguration & { pathEs?: string };
  arbitraryUrl.pathEs = "https://example.invalid";
  assert.equal(navigationConfigurationSchema.safeParse(arbitraryUrl).success, false);

  const duplicate = cloneConfiguration();
  duplicate.items[1].id = duplicate.items[0].id;
  assert.equal(navigationConfigurationSchema.safeParse(duplicate).success, false);

  const partial = cloneConfiguration();
  partial.items[0].children.pop();
  assert.equal(navigationConfigurationSchema.safeParse(partial).success, false);
  assert.deepEqual(parseNavigationConfiguration(partial), DEFAULT_NAVIGATION_CONFIGURATION);

  for (const destination of Object.values(NAVIGATION_DESTINATIONS)) {
    assert.match(destination.pathEs, /^\//);
    assert.match(destination.pathEn, /^\//);
    assert.doesNotMatch(destination.pathEs, /^(?:https?:)?\/\//i);
    assert.doesNotMatch(destination.pathEn, /^(?:https?:)?\/\//i);
  }
});

test("el árbol resuelto oculta contenido incompleto y conserva Alumni como futuro", () => {
  const availability = readyAvailability();
  availability["perspectives-events"] = {
    contentReady: false,
    reasonEs: "Requiere un evento",
    reasonEn: "Requires an event",
  };
  availability["firm-alumni"] = {
    contentReady: false,
    reasonEs: "Capacidad futura",
    reasonEn: "Future capability",
    future: true,
  };
  const tree = resolveNavigationTree(cloneConfiguration(), availability, "es");
  const perspectives = tree.items.find((item) => item.id === "perspectives");
  const firm = tree.items.find((item) => item.id === "firm");
  assert.equal(perspectives?.children.find((item) => item.id === "perspectives-events")?.visible, false);
  assert.equal(perspectives?.children.find((item) => item.id === "perspectives-events")?.status, "no-content");
  assert.equal(firm?.children.find((item) => item.id === "firm-alumni")?.visible, false);
  assert.equal(firm?.children.find((item) => item.id === "firm-alumni")?.status, "future");
  assert.deepEqual(tree.utilities, {
    search: { label: "Buscar", required: true },
    language: { label: "ES | EN", required: true },
    contact: { label: "Contáctanos", href: "/contacto", required: true },
  });
});

test("el servidor entrega menú semántico, seguro y sin parpadeo heredado", () => {
  const configuration = cloneConfiguration();
  configuration.items[0].labelEs = '<img src=x onerror="alert(1)">';
  const navigation = resolveNavigationTree(configuration, readyAvailability(), "es");
  navigation.items.find((item) => item.id === "practices")?.children.push({
    id: "practice:arbitration",
    label: "Arbitraje",
    href: "/practice/arbitration",
    configuredVisible: true,
    visible: true,
    status: "ready",
    reason: "Contenido publicado",
    dynamic: "practice",
  });
  const rendered = applyNavigationMarkup(
    '<!doctype html><html><body><nav class="nav menu_JS"><div class="nav__menu--holder"><a href="/old">Anterior</a></div></nav></body></html>',
    { practices: [], industries: [], navigation },
    "es",
  );
  const $ = cheerio.load(rendered);
  assert.equal($("[data-vw-navigation-version=\"2\"]").prop("tagName"), "UL");
  assert.equal($(".vw-nav-v2__item").length, 6);
  assert.equal($(".vw-nav-v2__trigger[aria-expanded=\"false\"]").length, 6);
  assert.equal($("#vw-nav-panel-firm").attr("hidden"), "hidden");
  assert.equal($("[data-vw-destination=\"practice:arbitration\"]").length, 1);
  for (const alias of NAVIGATION_LANDING_CHILD_IDS) {
    assert.equal($(`[data-vw-destination="${alias}"]`).length, 0, `${alias} no debe duplicar el enlace principal`);
  }
  assert.equal($("#vw-nav-panel-firm .vw-nav-v2__landing").text().trim(), "Quiénes somos→");
  assert.equal($("#vw-nav-panel-attorneys .vw-nav-v2__landing").text().trim(), "Ver todos los abogados→");
  assert.equal($("#vw-nav-panel-talent .vw-nav-v2__landing").text().trim(), "Trabaja con nosotros→");
  assert.equal($("[data-vw-nav-search]").text().trim(), "Buscar");
  assert.equal($(".vw-nav-v2__utility--language").text().trim(), "ES | EN");
  assert.equal($(".vw-nav-v2__utility--contact").attr("href"), "/contacto");
  assert.equal($(".vw-nav-v2__panel img").length, 0);
  assert.equal($("a[href=\"/old\"]").length, 0);
});

test("el clic abre escritorio, conserva el acordeón móvil y respeta el cromo blanco histórico", () => {
  const script = readFileSync(new URL("../../frontend-mirror/templates/beez3/js/min/functions.min.js", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../../frontend-mirror/templates/beez3/css/von.css", import.meta.url), "utf8");
  const navigationStyles = styles.slice(
    styles.indexOf("Navegación VWyS v2"),
    styles.indexOf("La bibliografía propia"),
  );
  assert.match(script, /i\(\) \? \(r\(t\), a\(t, !0\)\) : s\(t\)/);
  assert.match(script, /"Escape" !== e\.key/);
  assert.match(script, /o\.off\("\.vwNavV2"\)[\s\S]*?on\("keydown\.vwNavV2"/);
  assert.match(script, /e\.preventDefault\(\), e\.stopPropagation\(\)/);
  assert.match(script, /pointerdown\.vwNavV2/);
  assert.match(navigationStyles, /body\.vwb-navigation-v2 nav\.nav\.menu_JS\s*\{[\s\S]*?background:\s*transparent\s*!important;[\s\S]*?height:\s*72px;[\s\S]*?right:\s*218px;/);
  assert.match(navigationStyles, /@media \(max-width: 1239px\)[\s\S]*?body\.vwb-navigation-v2 nav\.nav\.menu_JS\s*\{[\s\S]*?background:\s*#fff\s*!important;/);
  assert.match(navigationStyles, /\.vw-nav-v2__utility--search,[\s\S]*?\.vw-nav-v2__utility--language\s*\{\s*display:\s*none;/);
  assert.match(navigationStyles, /\.vw-nav-v2__panel:not\(\[hidden\]\)\s*\{[\s\S]*?animation:\s*vw-nav-panel-enter[\s\S]*?border-radius:\s*8px;[\s\S]*?padding:\s*14px 20px 16px;[\s\S]*?width:\s*min\(760px, calc\(100vw - 56px\)\);/);
  assert.match(navigationStyles, /\.vw-nav-v2__item--practices \.vw-nav-v2__panel\s*\{\s*width:\s*min\(960px, calc\(100vw - 56px\)\);/);
  assert.match(navigationStyles, /\.vw-nav-v2__child\s*\{[\s\S]*?font-size:\s*12px;[\s\S]*?min-height:\s*36px;/);
  for (const alias of NAVIGATION_LANDING_CHILD_IDS) {
    assert.match(navigationStyles, new RegExp(`data-vw-destination=\\"${alias}\\"`));
  }
  assert.match(navigationStyles, /@media \(max-width: 1239px\)[\s\S]*?\.vw-nav-v2__panel:not\(\[hidden\]\)\s*\{[\s\S]*?background:\s*#faf9f8;[\s\S]*?border-radius:\s*7px;/);
  assert.doesNotMatch(navigationStyles, /#2d2d2f/i);
});

test("la respuesta pública mantiene los arreglos anteriores y admite 18 prácticas y 7 industrias", () => {
  const practices = Array.from({ length: 18 }, (_, index) => ({
    slug: `practice-${index + 1}`,
    name: `Practice ${index + 1}`,
    nameEs: `Práctica ${index + 1}`,
    published: true,
    order: index,
  }));
  const industries = Array.from({ length: 7 }, (_, index) => ({
    slug: `industry-${index + 1}`,
    name: `Industry ${index + 1}`,
    nameEs: `Industria ${index + 1}`,
    published: true,
    order: index,
  }));
  const menu = buildPublicNavigationMenu({ practices, industries }, "es");
  assert.equal(menu.practices.length, 18);
  assert.equal(menu.industries.length, 7);
  assert.equal(Object.prototype.hasOwnProperty.call(menu, "practices"), true);
  assert.equal(Object.prototype.hasOwnProperty.call(menu, "industries"), true);
});

test("las páginas nuevas, Alumni noindex y el control CMS quedan cableados sin migración", () => {
  const routes = readFileSync(new URL("../mirror/routes/newPublicRoutes.ts", import.meta.url), "utf8");
  const render = readFileSync(new URL("../mirror/renderNewPublicPages.ts", import.meta.url), "utf8");
  const admin = readFileSync(new URL("../../client/src/features/admin/navigation/NavigationSectionCard.tsx", import.meta.url), "utf8");
  const config = readFileSync(new URL("../mirror/siteConfig.ts", import.meta.url), "utf8");
  assert.match(routes, /"\/perspectivas"/);
  assert.match(routes, /"\/insights"/);
  assert.match(routes, /"\/nuestra-firma\/alcance-internacional"/);
  assert.match(routes, /"\/bolsa-de-trabajo\/vacantes"/);
  assert.match(routes, /X-Robots-Tag", "noindex, nofollow, noarchive"/);
  assert.match(render, /robots: "noindex,nofollow,noarchive"/);
  assert.match(admin, /!childInfo\.canActivate/);
  assert.match(config, /nav_structure_v2/);
  assert.doesNotMatch(routes + render + config, /\b(?:ALTER|DROP|CREATE)\s+TABLE\b/i);
});

test("la búsqueda editorial respeta disponibilidad, texto seguro y nunca indexa Alumni", () => {
  const availability = readyAvailability();
  availability["perspectives-events"].contentReady = false;
  availability["firm-international"].contentReady = true;
  availability["talent-openings"].contentReady = true;
  const config: ConfigMap = {
    page_perspectives_title: { value: "<strong>Knowledge</strong>", valueEs: "<em>Perspectivas</em>", type: "text" },
    page_perspectives_intro: { value: "<p>Legal <b>updates</b></p>", valueEs: "<p>Actualizaciones legales</p>", type: "text" },
    page_international_title: { value: "International reach", valueEs: "Alcance internacional", type: "text" },
    page_international_intro: { value: "Global alliances", valueEs: "Alianzas globales", type: "text" },
    page_openings_title: { value: "Openings", valueEs: "Vacantes", type: "text" },
    page_openings_intro: { value: "Current roles", valueEs: "Puestos vigentes", type: "text" },
  };
  const pages = buildSearchableEditorialPages(config, availability);
  assert.equal(pages.some((page) => page.slug === "events"), false);
  assert.equal(pages.some((page) => page.slug === "international-reach"), true);
  assert.equal(pages.some((page) => page.slug === "openings"), true);
  assert.equal(pages.some((page) => page.slug.includes("alumni")), false);
  assert.equal(pages.find((page) => page.slug === "perspectives")?.title, "Knowledge");
  assert.equal(pages.find((page) => page.slug === "perspectives")?.description, "Legal updates");
});

test("el guardado del menú revalida la revisión bajo bloqueo transaccional", () => {
  const routes = readFileSync(new URL("../mirror/routes/adminRoutes.ts", import.meta.url), "utf8");
  assert.match(routes, /pg_advisory_xact_lock\(hashtext\('vw-navigation-v2'\)\)/);
  assert.match(routes, /navigationRevision\(authoritative\)/);
  assert.match(routes, /NAVIGATION_REVISION_STALE/);
});

test("los catálogos públicos rechazan esquemas activos y credenciales en URLs", () => {
  assert.equal(isSafeCatalogUrl("https://vonwobeser.com/path"), true);
  assert.equal(isSafeCatalogUrl("/uploads/logo.png"), true);
  assert.equal(isSafeCatalogUrl("javascript:alert(1)"), false);
  assert.equal(isSafeCatalogUrl("data:text/html,<script>alert(1)</script>"), false);
  assert.equal(isSafeCatalogUrl("https://usuario:secreto@example.com"), false);
  assert.equal(isSafeCatalogUrl("//example.com/redirect"), false);
  assert.equal(isSafeCatalogEmail("talento@vonwobeser.com"), true);
  assert.equal(isSafeCatalogEmail("talento@@example.com"), false);
});
