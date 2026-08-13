import type { Express } from "express";
import type { Lang } from "../htmlPipeline";
import { legacyPaginationDestination } from "../legacyHtml";
import type { MirrorRuntime } from "../runtime";
import { createLegacyRedirect } from "./legacyRedirect";

export function registerMirrorLegacyRedirectRoutes(app: Express, runtime: MirrorRuntime): void {
  const { ES_CATEGORY, ids, langOf, pubIdMap } = runtime;
  const redirectLegacy = createLegacyRedirect(langOf);

  // Canonicaliza las páginas heredadas antes de registrar sus renderizadores de respaldo.
  // De esta forma un enlace o favorito viejo entra una vez a la ruta limpia y el selector
  // de idioma ya no queda atrapado en una URL que fuerza español o inglés.
  const legacyPageRedirects: Array<[string, string, Lang?]> = [
    ["/index.php/home", "/", "es"],
    ["/index.php/home/", "/", "es"],
    ["/index.php/home/index.html", "/", "es"],
    ["/index.html", "/", undefined],
    ["/index.php/index.html", "/", undefined],
    ["/index.php/nuestra-firma", "/acerca-de", "es"],
    ["/index.php/nuestra-firma/index.html", "/acerca-de", "es"],
    ["/index.php/nuestra-firma/", "/acerca-de", "es"],
    ["/index.php/our-firm", "/about", "en"],
    ["/index.php/our-firm/index.html", "/about", "en"],
    ["/index.php/our-firm/", "/about", "en"],
    ["/index.php/contacto/index.html", "/contacto", "es"],
    ["/index.php/contacto/", "/contacto", "es"],
    ["/index.php/contact/index.html", "/contact", "en"],
    ["/index.php/contact/", "/contact", "en"],
    ["/index.php/bolsa-de-trabajo/index.html", "/bolsa-de-trabajo", "es"],
    ["/index.php/bolsa-de-trabajo/", "/bolsa-de-trabajo", "es"],
    ["/index.php/careers/index.html", "/careers", "en"],
    ["/index.php/careers/", "/careers", "en"],
    ["/index.php/capacidades/index.html", "/capacidades", "es"],
    ["/index.php/capacidades/", "/capacidades", "es"],
    ["/index.php/capabilities/index.html", "/capabilities", "en"],
    ["/index.php/capabilities/", "/capabilities", "en"],
    ["/index.php/publicaciones/index.html", "/publicaciones", "es"],
    ["/index.php/publicaciones/", "/publicaciones", "es"],
    ["/index.php/publications/index.html", "/publications", "en"],
    ["/index.php/publications/", "/publications", "en"],
    ["/index.php/publicaciones/noticias/index.html", "/news", "es"],
    ["/index.php/publications/news/index.html", "/news", "en"],
    ["/index.php/publicaciones/articulos/index.html", "/articles", "es"],
    ["/index.php/publications/articles/index.html", "/articles", "en"],
    ["/index.php/aviso/index.html", "/aviso", "es"],
    ["/index.php/aviso/", "/aviso", "es"],
    ["/index.php/privacy/index.html", "/privacy", "en"],
    ["/index.php/privacy/", "/privacy", "en"],
    ["/index.php/capacidades/practicas/index.html", "/capacidades/practicas", "es"],
    ["/index.php/capacidades/practicas/", "/capacidades/practicas", "es"],
    ["/index.php/capabilities/practices/index.html", "/capabilities/practices", "en"],
    ["/index.php/capabilities/practices/", "/capabilities/practices", "en"],
    ["/index.php/capacidades/industrias/index.html", "/capacidades/industrias", "es"],
    ["/index.php/capacidades/industrias/", "/capacidades/industrias", "es"],
    ["/index.php/capabilities/industries/index.html", "/capabilities/industries", "en"],
    ["/index.php/capabilities/industries/", "/capabilities/industries", "en"],
  ];
  for (const [legacy, target, lang] of legacyPageRedirects) app.get(legacy, redirectLegacy(target, lang));

  // La paginación capturada de Joomla usaba offsets de diez elementos. El
  // listado actual pagina en PostgreSQL y es bilingüe; se conserva la posición
  // aproximada del visitante al llevarlo a la página dinámica correspondiente.
  app.get(
    /^\/index\.php\/(?:publications|publicaciones)\/(?:news|noticias|articles|articulos)\/start-\d+\.html$/i,
    (req, res, next) => {
      const destination = legacyPaginationDestination(req.path);
      if (!destination) return next();
      return res.redirect(301, destination);
    },
  );
  app.get("/index.php/publication/p_id-:id.html", (req, res, next) => {
    const slug = pubIdMap.get(req.params.id);
    if (!slug) return next();
    return redirectLegacy(`/news/${slug}`, "en")(req, res);
  });
  app.get("/index.php/publicacion/p_id-:id.html", (req, res, next) => {
    const slug = pubIdMap.get(req.params.id);
    if (!slug) return next();
    return redirectLegacy(`/news/${slug}`, "es")(req, res);
  });
  app.get("/index.php/lawyer/l-:id.html", (req, res, next) => {
    const slug = ids.attorney.get(req.params.id);
    if (!slug) return next();
    return redirectLegacy(`/lawyer/${slug}`, "en")(req, res);
  });
  app.get("/index.php/abogado/l-:id.html", (req, res, next) => {
    const slug = ids.attorney.get(req.params.id);
    if (!slug) return next();
    return redirectLegacy(`/abogado/${slug}`, "es")(req, res);
  });
  for (const [pathPattern, map, prefix, lang] of [
    ["/index.php/practice/p-:id.html", ids.practice, "/practice/", "en"],
    ["/index.php/practica/p-:id.html", ids.practice, "/practice/", "es"],
    ["/index.php/industry/p-:id.html", ids.industry, "/industry/", "en"],
    ["/index.php/industria/p-:id.html", ids.industry, "/industry/", "es"],
  ] as const) {
    app.get(pathPattern, (req, res, next) => {
      const slug = map.get(req.params.id);
      if (!slug) return next();
      return redirectLegacy(`${prefix}${slug}`, lang)(req, res);
    });
  }
  app.get("/index.php/attorneys/:category/index.html", (req, res) =>
    redirectLegacy(`/attorneys/${req.params.category}`, "en")(req, res),
  );
  app.get("/index.php/abogados/:category/index.html", (req, res) =>
    redirectLegacy(`/attorneys/${ES_CATEGORY[req.params.category] || req.params.category}`, "es")(req, res),
  );

}
