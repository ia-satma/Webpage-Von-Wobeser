import type { Express, Request, Response } from "express";
import { getCookieConsentConfig, publicConsentPayload } from "../../privacy/cookieConsent";
import { getPublicNavigationMenu } from "../navigationMenu";
import { CATEGORIES } from "../renderAttorneyList";
import { renderNotFound } from "../renderNotFound";
import { getConfigMap } from "../siteConfig";
import { getFaviconHref, setFaviconConfig } from "../seo";
import type { MirrorRuntime } from "../runtime";

export function registerMirrorPublicRoutes(app: Express, runtime: MirrorRuntime): void {
  const {
    TEMPLATES,
    langOf,
    parsePublicPage,
    parsePublicSearch,
    pick,
    redirectAttorneySearch,
    resolvePublicAuthor,
    searchRedirect,
    sendPage,
    serveArticlesList,
    serveAttorney,
    serveAttorneyDirectory,
    serveGlobalSearch,
    serveHome,
    serveIndustry,
    serveList,
    serveNewsDetail,
    serveNewsList,
    serveOfficeShowcase,
    servePractice,
    wrap,
  } = runtime;

  // ---------- Clean dynamic routes --------------------------------------
  app.get("/api/public/site-branding", wrap(async (_req, res) => {
    const config = await getConfigMap();
    setFaviconConfig(config.site_favicon?.value);
    res
      .set("Cache-Control", "no-cache, must-revalidate")
      .json({ favicon: getFaviconHref() });
  }));
  app.get("/api/public/manifest.webmanifest", wrap(async (_req, res) => {
    const config = await getConfigMap();
    setFaviconConfig(config.site_favicon?.value);
    res
      .set("Cache-Control", "no-cache, must-revalidate")
      .type("application/manifest+json")
      .json({
        name: "Von Wobeser y Sierra",
        short_name: "Von Wobeser",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#AC162C",
        icons: [{ src: getFaviconHref(), sizes: "any", purpose: "any" }],
      });
  }));
  app.get("/api/public/navigation-menu", wrap(async (req, res) => {
    res
      .set("Cache-Control", "public, max-age=60, stale-while-revalidate=300")
      .json(await getPublicNavigationMenu(langOf(req)));
  }));
  app.get(["/api/public/privacy-preferences", "/api/public/consent-config"], wrap(async (_req, res) => {
    const payload = publicConsentPayload(await getCookieConsentConfig());
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300").json(payload);
  }));
  app.get(["/vwb-privacy-preferences-config.js", "/vwb-cookie-consent-config.js"], wrap(async (_req, res) => {
    const payload = publicConsentPayload(await getCookieConsentConfig());
    const serialized = JSON.stringify(payload)
      .replace(/</g, "\\u003c")
      .replace(/\u2028/g, "\\u2028")
      .replace(/\u2029/g, "\\u2029");
    res
      .type("application/javascript")
      .set("Cache-Control", "public, max-age=60, stale-while-revalidate=300")
      .send(`window.__VWB_COOKIE_CONSENT_CONFIG__=${serialized};`);
  }));
  app.get("/", wrap((req, res) => serveHome(langOf(req), res, typeof req.query.preview === "string")));
  app.get("/home", wrap((req, res) => serveHome(langOf(req), res, typeof req.query.preview === "string")));
  app.get("/nuevas-oficinas", wrap((_req, res) => serveOfficeShowcase("es", res)));
  app.get("/nuevas-oficinas/", wrap((_req, res) => serveOfficeShowcase("es", res)));
  app.get("/new-offices", wrap((_req, res) => serveOfficeShowcase("en", res)));
  app.get("/new-offices/", wrap((_req, res) => serveOfficeShowcase("en", res)));
  app.get("/nuevas-oficinas/index.html", (_req, res) => res.redirect(301, "/nuevas-oficinas/"));
  app.get("/new-offices/index.html", (_req, res) => res.redirect(301, "/new-offices/"));
  app.get("/search", wrap(async (req, res) => {
    const lang = langOf(req);
    const query = parsePublicSearch(req.query.q, lang, res);
    if (query === null) return;
    await serveGlobalSearch(lang, res, query);
  }));
  app.get("/publications/search", (req, res) => {
    const lang = langOf(req);
    const query = parsePublicSearch(req.query.q, lang, res);
    if (query === null) return;
    res.redirect(303, searchRedirect(req.query.kind, query, lang));
  });
  // Compatibilidad con formularios conservados en caché y páginas estáticas del espejo.
  // La redirección 303 convierte el POST heredado en un GET compartible y seguro.
  app.post(["/index.php/results", "/index.php/resultados"], (req, res) => {
    const requestedLang = req.body?.lang === "en" || req.query.lang === "en" ? "en" : "es";
    res.redirect(303, searchRedirect(req.body?.kind, req.body?.q, requestedLang));
  });
  app.get("/news", wrap(async (req, res) => {
    const lang = langOf(req);
    const query = parsePublicSearch(req.query.q, lang, res);
    if (query === null) return;
    const author = await resolvePublicAuthor(req.query.author, lang, res);
    if (author === null) return;
    await serveNewsList(lang, res, parsePublicPage(req.query.page), query, author);
  }));
  app.get("/news/:slug", wrap((req, res, next) => serveNewsDetail(req.params.slug, langOf(req), res, next)));
  app.get("/articles", wrap(async (req, res) => {
    const lang = langOf(req);
    const query = parsePublicSearch(req.query.q, lang, res);
    if (query === null) return;
    const author = await resolvePublicAuthor(req.query.author, lang, res);
    if (author === null) return;
    await serveArticlesList(lang, res, parsePublicPage(req.query.page), query, author);
  }));
  // Directorio general: filtros y todos los perfiles viven en la misma página.
  app.get("/attorneys", wrap((req, res) => serveAttorneyDirectory(langOf(req), res, req.query)));
  // Compatibilidad con el buscador histórico antes de la ruta por categoría.
  app.get("/attorneys/buscar", wrap((req, res) => {
    redirectAttorneySearch(langOf(req), res, req.query);
    return Promise.resolve();
  }));
  // Listados limpios de las cuatro categorías del submenu de Abogados. Antes
  // estas URLs no tenían handler y caían en el Home inglés del catch-all.
  app.get("/attorneys/:category", wrap((req, res, next) => {
    const lang = langOf(req);
    if (!CATEGORIES[req.params.category]) {
      return sendPage(
        res,
        renderNotFound(pick(TEMPLATES.publications, lang), lang, req.originalUrl),
        404,
      );
    }
    return serveList(req.params.category, lang, res, next, req.query);
  }));
  // El menú "Abogados"/"Attorneys" enlazaba a una página estática solo-buscador, sin
  // listado. Se redirige al listado dinámico, que ya trae el buscador integrado.
  app.get("/index.php/attorneys/index.html", wrap((_req, res) => { res.redirect(302, "/attorneys?lang=en"); return Promise.resolve(); }));
  app.get("/index.php/abogados/index.html", wrap((_req, res) => { res.redirect(302, "/attorneys"); return Promise.resolve(); }));
  app.get("/lawyer/:slug", wrap((req, res, next) => serveAttorney(req.params.slug, langOf(req), res, next)));
  app.get("/abogado/:slug", wrap((req, res, next) => serveAttorney(req.params.slug, "es", res, next)));
  app.get("/practice/:slug", wrap((req, res, next) => servePractice(req.params.slug, langOf(req), res, next)));
  app.get("/industry/:slug", wrap((req, res, next) => serveIndustry(req.params.slug, langOf(req), res, next)));

  // El Desk Alemán fue retirado de la experiencia pública. No se borran sus
  // filas ni relaciones; estas rutas sólo marcan explícitamente el retiro para
  // visitantes, buscadores y enlaces históricos.
  const deskRetired = (req: Request, res: Response) => {
    const en = /capabilities|german-desk/.test(req.path) || req.query.lang === "en";
    const title = en ? "Content retired" : "Contenido retirado";
    const message = en ? "This section is no longer available." : "Esta sección ya no está disponible.";
    res.set("X-Robots-Tag", "noindex");
    res.status(410).type("html").send(`<!doctype html><html lang="${en ? "en" : "es"}"><head><meta charset="utf-8"><title>${title}</title></head><body><p>${message}</p></body></html>`);
  };
  for (const p of [
    "/german-desk", "/desk", "/desk/:slug",
    "/index.php/capacidades/desks/index.html", "/index.php/capacidades/desks/", "/capacidades/desks",
    "/index.php/capabilities/desks/index.html", "/index.php/capabilities/desks/",
    "/index.php/capabilities/capabilities-desks/index.html", "/index.php/capabilities/capabilities-desks/", "/capabilities/desks",
  ]) app.get(p, deskRetired);

}
