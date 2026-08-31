import type { Express, Response } from "express";
import { storage } from "../../storage";
import { getConfigMap } from "../siteConfig";
import { getNavigationAvailability } from "../navigationConfiguration";
import { renderNewsList } from "../renderNews";
import { renderNotFound } from "../renderNotFound";
import {
  newsHighlight,
  renderAlumniPage,
  renderEventsPage,
  renderInternationalReach,
  renderOpeningsPage,
  renderPerspectivesHub,
  type PerspectiveHubSection,
} from "../renderNewPublicPages";
import type { Lang } from "../htmlPipeline";
import type { MirrorRuntime } from "../runtime";

type NewsCategoryPage = {
  category: string | string[];
  /** Las secciones editoriales extensas pueden usar un archivo más contenido. */
  pageSize?: number;
  paths: { es: string; en: string };
  title: { es: string; en: string };
  description: { es: string; en: string };
  editorialHeader?: {
    eyebrow: { es: string; en: string };
    officeVisual?: {
      image: string;
      alt: { es: string; en: string };
      scene: "meeting-room" | "reception";
    };
  };
};

const CATEGORY_PAGES: NewsCategoryPage[] = [
  {
    category: "rankings",
    paths: { es: "/perspectivas/reconocimientos", en: "/insights/recognitions" },
    title: { es: "Reconocimientos", en: "Recognitions" },
    description: { es: "Reconocimientos y rankings publicados por Von Wobeser y Sierra.", en: "Recognitions and rankings published by Von Wobeser y Sierra." },
  },
  {
    category: "news",
    pageSize: 6,
    paths: { es: "/perspectivas/comunicaciones", en: "/insights/communications" },
    title: { es: "Comunicaciones", en: "Communications" },
    description: { es: "Comunicaciones y actualidad de Von Wobeser y Sierra.", en: "Communications and news from Von Wobeser y Sierra." },
    editorialHeader: {
      eyebrow: { es: "Insights", en: "Insights" },
      officeVisual: {
        image: "/img/Collage/collage_07.jpg",
        scene: "reception",
        alt: {
          es: "Recepción de las nuevas oficinas de Von Wobeser y Sierra",
          en: "Reception area at Von Wobeser y Sierra's new offices",
        },
      },
    },
  },
  {
    category: ["insights", "alerts"],
    paths: { es: "/perspectivas/analisis-y-actualizaciones", en: "/insights/analysis-and-updates" },
    title: { es: "Análisis y actualizaciones", en: "Analysis and updates" },
    description: { es: "Análisis y alertas legales de Von Wobeser y Sierra.", en: "Analysis and legal updates from Von Wobeser y Sierra." },
  },
  {
    category: "press",
    paths: { es: "/perspectivas/sala-de-prensa", en: "/insights/press-room" },
    title: { es: "Sala de prensa", en: "Press room" },
    description: { es: "Publicaciones para medios y Sala de prensa de Von Wobeser y Sierra.", en: "Media publications and press room from Von Wobeser y Sierra." },
  },
];

function publishedCurrentOpenings<T extends { published?: boolean | null; expiresAt?: Date | string | null }>(rows: T[]): T[] {
  const now = Date.now();
  return rows.filter((row) => row.published === true && (!row.expiresAt || new Date(row.expiresAt).getTime() >= now));
}

export function registerMirrorNewPublicRoutes(app: Express, runtime: MirrorRuntime): void {
  const { TEMPLATES, parsePublicPage, parsePublicSearch, pick, sendPage, tpl, wrap } = runtime;
  const notFound = (lang: Lang, path: string, res: Response) => sendPage(
    res,
    renderNotFound(pick(TEMPLATES.publications, lang), lang, path),
    404,
  );

  const serveHub = async (lang: Lang, res: Response) => {
    const [config, articles, communications, insights, alerts] = await Promise.all([
      getConfigMap(),
      storage.getPublishedNewsPage(2, 0, "articles"),
      storage.getPublishedNewsPage(2, 0, "news"),
      storage.getPublishedNewsPage(2, 0, "insights"),
      storage.getPublishedNewsPage(2, 0, "alerts"),
    ]);
    const [articleCount, communicationCount, insightCount, alertCount] = await Promise.all([
      storage.getPublishedNewsCount("articles"),
      storage.getPublishedNewsCount("news"),
      storage.getPublishedNewsCount("insights"),
      storage.getPublishedNewsCount("alerts"),
    ]);
    const suffix = lang === "en" ? "?lang=en" : "";
    const analysis = [...insights, ...alerts]
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
      .slice(0, 2);
    const sections: PerspectiveHubSection[] = [
      { id: "articles", title: lang === "es" ? "Artículos" : "Articles", href: `/articles${suffix}`, count: articleCount, highlights: articles.map((item) => newsHighlight(item, lang)) },
      { id: "communications", title: lang === "es" ? "Comunicaciones" : "Communications", href: lang === "es" ? "/perspectivas/comunicaciones" : "/insights/communications", count: communicationCount, highlights: communications.map((item) => newsHighlight(item, lang)) },
      { id: "analysis", title: lang === "es" ? "Análisis y actualizaciones" : "Analysis and updates", href: lang === "es" ? "/perspectivas/analisis-y-actualizaciones" : "/insights/analysis-and-updates", count: insightCount + alertCount, highlights: analysis.map((item) => newsHighlight(item, lang)) },
    ];
    sendPage(res, renderPerspectivesHub(pick(TEMPLATES.publications, lang), config, lang, sections));
  };
  app.get(["/perspectivas", "/perspectivas/"], wrap((_req, res) => serveHub("es", res)));
  app.get(["/insights", "/insights/"], wrap((_req, res) => serveHub("en", res)));

  const serveEvents = async (lang: Lang, res: Response) => {
    const events = await storage.getEvents();
    const path = lang === "es" ? "/perspectivas/eventos" : "/insights/events";
    if (!events.length) return notFound(lang, path, res);
    sendPage(res, renderEventsPage(pick(TEMPLATES.publications, lang), events, lang));
  };
  app.get(["/perspectivas/eventos", "/perspectivas/eventos/"], wrap((_req, res) => serveEvents("es", res)));
  app.get(["/insights/events", "/insights/events/"], wrap((_req, res) => serveEvents("en", res)));

  for (const page of CATEGORY_PAGES) {
    const serveCategory = async (lang: Lang, res: Response, requestedPage = 1, query = "") => {
      const categories = Array.isArray(page.category) ? page.category : [page.category];
      const perPage = page.pageSize ?? 24;

      // Comunicaciones comparte ahora la búsqueda paginada y segura de
      // Artículos. Para las rutas secundarias que mezclan categorías se
      // mantiene la misma semántica, unificando primero el resultado ordenado.
      if (categories.length === 1) {
        const category = categories[0];
        const searched = query.length >= 2
          ? await storage.searchPublishedNewsPage({
              query,
              limit: perPage,
              offset: Math.max(0, requestedPage - 1) * perPage,
              category,
            })
          : null;
        const total = searched?.total ?? (query ? 0 : await storage.getPublishedNewsCount(category));
        const totalPages = Math.max(1, Math.ceil(total / perPage));
        const currentPage = Math.min(Math.max(1, requestedPage), totalPages);
        const rows = query.length >= 2 && currentPage !== requestedPage
          ? (await storage.searchPublishedNewsPage({ query, limit: perPage, offset: (currentPage - 1) * perPage, category })).rows
          : searched?.rows ?? (query ? [] : await storage.getPublishedNewsPage(perPage, (currentPage - 1) * perPage, category));
        if (!rows.length && !query) return notFound(lang, page.paths[lang], res);
        return sendPage(res, renderNewsList(
          pick(TEMPLATES.newsList, lang),
          rows,
          lang,
          { page: currentPage, totalPages, totalItems: total },
          {
            basePath: page.paths[lang],
            alternatePaths: page.paths,
            title: { en: `${page.title.en} | Von Wobeser y Sierra`, es: `${page.title.es} | Von Wobeser y Sierra` },
            description: page.description,
            crumbLabel: page.title,
            editorialHeader: page.editorialHeader
              ? { ...page.editorialHeader, title: page.title, description: page.description }
              : undefined,
            query,
          },
        ));
      }

      const batches = await Promise.all(categories.map(async (category) => {
        if (query && query.length < 2) return [];
        if (query) {
          const first = await storage.searchPublishedNewsPage({ query, limit: 1, offset: 0, category });
          return first.total ? (await storage.searchPublishedNewsPage({ query, limit: first.total, offset: 0, category })).rows : [];
        }
        const total = await storage.getPublishedNewsCount(category);
        return total ? storage.getPublishedNewsPage(total, 0, category) : [];
      }));
      const allRows = batches.flat().sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
      if (!allRows.length && !query) return notFound(lang, page.paths[lang], res);
      const totalPages = Math.max(1, Math.ceil(allRows.length / perPage));
      const currentPage = Math.min(Math.max(1, requestedPage), totalPages);
      const rows = allRows.slice((currentPage - 1) * perPage, currentPage * perPage);
      sendPage(res, renderNewsList(
        pick(TEMPLATES.newsList, lang),
        rows,
        lang,
        { page: currentPage, totalPages, totalItems: allRows.length },
        {
          basePath: page.paths[lang],
          alternatePaths: page.paths,
          title: { en: `${page.title.en} | Von Wobeser y Sierra`, es: `${page.title.es} | Von Wobeser y Sierra` },
          description: page.description,
          crumbLabel: page.title,
          editorialHeader: page.editorialHeader
            ? { ...page.editorialHeader, title: page.title, description: page.description }
            : undefined,
          query,
        },
      ));
    };
    app.get([page.paths.es, `${page.paths.es}/`], wrap(async (req, res) => {
      const query = parsePublicSearch(req.query.q, "es", res);
      if (query === null) return;
      await serveCategory("es", res, parsePublicPage(req.query.page), query);
    }));
    app.get([page.paths.en, `${page.paths.en}/`], wrap(async (req, res) => {
      const query = parsePublicSearch(req.query.q, "en", res);
      if (query === null) return;
      await serveCategory("en", res, parsePublicPage(req.query.page), query);
    }));
  }

  const serveInternational = async (lang: Lang, res: Response) => {
    const [config, alliances] = await Promise.all([getConfigMap(), storage.getAlliances()]);
    const path = lang === "es" ? "/nuestra-firma/alcance-internacional" : "/our-firm/international-reach";
    const availability = await getNavigationAvailability(config);
    if (!availability["firm-international"].contentReady) return notFound(lang, path, res);
    sendPage(res, renderInternationalReach(
      pick(TEMPLATES.firm, lang),
      config,
      alliances.filter((alliance) => alliance.published === true),
      lang,
    ));
  };
  app.get(["/nuestra-firma/alcance-internacional", "/nuestra-firma/alcance-internacional/"], wrap((_req, res) => serveInternational("es", res)));
  app.get(["/our-firm/international-reach", "/our-firm/international-reach/"], wrap((_req, res) => serveInternational("en", res)));

  const serveOpenings = async (lang: Lang, res: Response) => {
    const [config, rows] = await Promise.all([getConfigMap(), storage.getJobOpenings()]);
    const openings = publishedCurrentOpenings(rows);
    const path = lang === "es" ? "/bolsa-de-trabajo/vacantes" : "/careers/openings";
    if (!openings.length) return notFound(lang, path, res);
    sendPage(res, renderOpeningsPage(pick(TEMPLATES.careers, lang), config, openings, lang));
  };
  app.get(["/bolsa-de-trabajo/vacantes", "/bolsa-de-trabajo/vacantes/"], wrap((_req, res) => serveOpenings("es", res)));
  app.get(["/careers/openings", "/careers/openings/"], wrap((_req, res) => serveOpenings("en", res)));

  const serveAlumni = async (lang: Lang, res: Response) => {
    const config = await getConfigMap();
    const path = lang === "es" ? "/nuestra-firma/alumni" : "/our-firm/alumni";
    const availability = await getNavigationAvailability(config);
    if (!availability["firm-alumni"].contentReady) return notFound(lang, path, res);
    res.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    sendPage(res, renderAlumniPage(pick(TEMPLATES.firm, lang), config, lang));
  };
  app.get(["/nuestra-firma/alumni", "/nuestra-firma/alumni/"], wrap((_req, res) => serveAlumni("es", res)));
  app.get(["/our-firm/alumni", "/our-firm/alumni/"], wrap((_req, res) => serveAlumni("en", res)));
}
