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
  paths: { es: string; en: string };
  title: { es: string; en: string };
  description: { es: string; en: string };
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
    paths: { es: "/perspectivas/comunicaciones", en: "/insights/communications" },
    title: { es: "Comunicaciones", en: "Communications" },
    description: { es: "Comunicaciones y actualidad de Von Wobeser y Sierra.", en: "Communications and news from Von Wobeser y Sierra." },
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
  const { TEMPLATES, pick, sendPage, tpl, wrap } = runtime;
  const notFound = (lang: Lang, path: string, res: Response) => sendPage(
    res,
    renderNotFound(pick(TEMPLATES.publications, lang), lang, path),
    404,
  );

  const serveHub = async (lang: Lang, res: Response) => {
    const [config, articles, rankings, communications, insights, alerts, press, events] = await Promise.all([
      getConfigMap(),
      storage.getPublishedNewsPage(2, 0, "articles"),
      storage.getPublishedNewsPage(2, 0, "rankings"),
      storage.getPublishedNewsPage(2, 0, "news"),
      storage.getPublishedNewsPage(2, 0, "insights"),
      storage.getPublishedNewsPage(2, 0, "alerts"),
      storage.getPublishedNewsPage(2, 0, "press"),
      storage.getEvents(),
    ]);
    const [articleCount, rankingCount, communicationCount, insightCount, alertCount, pressCount] = await Promise.all([
      storage.getPublishedNewsCount("articles"),
      storage.getPublishedNewsCount("rankings"),
      storage.getPublishedNewsCount("news"),
      storage.getPublishedNewsCount("insights"),
      storage.getPublishedNewsCount("alerts"),
      storage.getPublishedNewsCount("press"),
    ]);
    const suffix = lang === "en" ? "?lang=en" : "";
    const eventPath = lang === "es" ? "/perspectivas/eventos" : "/insights/events";
    const eventHighlights = events.slice(0, 2).map((event) => ({
      title: lang === "es" ? event.titleEs : event.title,
      href: `${eventPath}#evento-${encodeURIComponent(event.id)}`,
      date: event.date,
    }));
    const analysis = [...insights, ...alerts]
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
      .slice(0, 2);
    const sections: PerspectiveHubSection[] = [
      { id: "articles", title: lang === "es" ? "Artículos" : "Articles", href: `/articles${suffix}`, count: articleCount, highlights: articles.map((item) => newsHighlight(item, lang)) },
      { id: "events", title: lang === "es" ? "Eventos" : "Events", href: eventPath, count: events.length, highlights: eventHighlights },
      { id: "recognitions", title: lang === "es" ? "Reconocimientos" : "Recognitions", href: lang === "es" ? "/perspectivas/reconocimientos" : "/insights/recognitions", count: rankingCount, highlights: rankings.map((item) => newsHighlight(item, lang)) },
      { id: "communications", title: lang === "es" ? "Comunicaciones" : "Communications", href: lang === "es" ? "/perspectivas/comunicaciones" : "/insights/communications", count: communicationCount, highlights: communications.map((item) => newsHighlight(item, lang)) },
      { id: "analysis", title: lang === "es" ? "Análisis y actualizaciones" : "Analysis and updates", href: lang === "es" ? "/perspectivas/analisis-y-actualizaciones" : "/insights/analysis-and-updates", count: insightCount + alertCount, highlights: analysis.map((item) => newsHighlight(item, lang)) },
      { id: "press", title: lang === "es" ? "Sala de prensa" : "Press room", href: lang === "es" ? "/perspectivas/sala-de-prensa" : "/insights/press-room", count: pressCount, highlights: press.map((item) => newsHighlight(item, lang)) },
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
    const serveCategory = async (lang: Lang, res: Response) => {
      const categories = Array.isArray(page.category) ? page.category : [page.category];
      const batches = await Promise.all(categories.map((category) => storage.getPublishedNewsPage(100, 0, category)));
      const rows = batches.flat().sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
      if (!rows.length) return notFound(lang, page.paths[lang], res);
      sendPage(res, renderNewsList(
        pick(TEMPLATES.newsList, lang),
        rows,
        lang,
        undefined,
        {
          basePath: page.paths[lang],
          alternatePaths: page.paths,
          title: { en: `${page.title.en} | Von Wobeser y Sierra`, es: `${page.title.es} | Von Wobeser y Sierra` },
          description: page.description,
          crumbLabel: page.title,
        },
      ));
    };
    app.get([page.paths.es, `${page.paths.es}/`], wrap((_req, res) => serveCategory("es", res)));
    app.get([page.paths.en, `${page.paths.en}/`], wrap((_req, res) => serveCategory("en", res)));
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
