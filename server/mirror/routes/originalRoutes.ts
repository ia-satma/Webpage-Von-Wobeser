import type { Express } from "express";
import type { MirrorRuntime } from "../runtime";

export function registerMirrorOriginalRoutes(app: Express, runtime: MirrorRuntime): void {
  const {
    ES_CATEGORY,
    ids,
    langOf,
    pubIdMap,
    serveArticlesList,
    serveAttorney,
    serveHome,
    serveIndustry,
    serveList,
    serveNewsDetail,
    serveNewsList,
    servePractice,
    wrap,
  } = runtime;

  // ---------- Original mirror URLs (SEO preserved, nav coherent) --------
  // Home (ES) + news listings
  app.get("/index.php/home", wrap((_req, res) => serveHome("es", res)));
  app.get("/index.php/home/", wrap((_req, res) => serveHome("es", res)));
  // Logo / "inicio" links in the mirror chrome → dynamic home.
  app.get("/index.html", wrap((req, res) => serveHome(langOf(req), res)));
  app.get("/index.php/index.html", wrap((req, res) => serveHome(langOf(req), res)));
  app.get("/index.php/home/index.html", wrap((_req, res) => serveHome("es", res)));
  app.get("/index.php/publications/news/index.html", wrap((req, res) => serveNewsList(langOf(req), res)));
  app.get("/index.php/publicaciones/noticias/index.html", wrap((_req, res) => serveNewsList("es", res)));
  app.get("/index.php/publications/articles/index.html", wrap((req, res) => serveArticlesList(langOf(req), res)));
  app.get("/index.php/publicaciones/articulos/index.html", wrap((_req, res) => serveArticlesList("es", res)));
  // Detalle de publicación por URL original (p_id) → versión dinámica desde la DB.
  app.get("/index.php/publication/p_id-:id.html", wrap((req, res, next) =>
    serveNewsDetail(pubIdMap.get(req.params.id), "en", res, next),
  ));
  app.get("/index.php/publicacion/p_id-:id.html", wrap((req, res, next) =>
    serveNewsDetail(pubIdMap.get(req.params.id), "es", res, next),
  ));

  // Attorney profiles (EN /lawyer, ES /abogado)
  app.get("/index.php/lawyer/l-:id.html", wrap((req, res, next) =>
    serveAttorney(ids.attorney.get(req.params.id), "en", res, next),
  ));
  app.get("/index.php/abogado/l-:id.html", wrap((req, res, next) =>
    serveAttorney(ids.attorney.get(req.params.id), "es", res, next),
  ));

  // Practice / industry (EN legacy numeric path). The ES legacy path uses the SAME numeric
  // IDs (confirmed 1:1 against the captured mirror — p-3 is "Environmental"/"Ambiental" in
  // both folders), so both languages share the same ids.practice/ids.industry maps.
  app.get("/index.php/practice/p-:id.html", wrap((req, res, next) =>
    servePractice(ids.practice.get(req.params.id), "en", res, next),
  ));
  app.get("/index.php/industry/p-:id.html", wrap((req, res, next) =>
    serveIndustry(ids.industry.get(req.params.id), "en", res, next),
  ));
  app.get("/index.php/practica/p-:id.html", wrap((req, res, next) =>
    servePractice(ids.practice.get(req.params.id), "es", res, next),
  ));
  app.get("/index.php/industria/p-:id.html", wrap((req, res, next) =>
    serveIndustry(ids.industry.get(req.params.id), "es", res, next),
  ));

  // Attorney listings (EN + ES category slugs)
  app.get("/index.php/attorneys/:category/index.html", wrap((req, res, next) =>
    serveList(req.params.category, "en", res, next, req.query),
  ));
  app.get("/index.php/abogados/:category/index.html", wrap((req, res, next) =>
    serveList(ES_CATEGORY[req.params.category] || req.params.category, "es", res, next, req.query),
  ));

  // News detail (publication id → news slug not mapped; falls through to static
  // for legacy publications, while in-app /news/:slug links stay dynamic).

}
