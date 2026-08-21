import * as cheerio from "cheerio";
import type { NavigationAvailability } from "./navigationConfiguration";
import type { ConfigMap } from "./siteConfig";

export type SearchableEditorialPage = {
  slug: string;
  title: string;
  titleEs: string;
  description: string;
  descriptionEs: string;
  hrefEn: string;
  hrefEs: string;
};

function plainText(value: string | undefined): string {
  if (!value) return "";
  return cheerio.load(value, null, false).text().replace(/\s+/g, " ").trim();
}

function configText(config: ConfigMap, key: string, language: "en" | "es"): string {
  const entry = config[key];
  return plainText(language === "es" ? entry?.valueEs : entry?.value);
}

function perspectivesTitle(config: ConfigMap, language: "en" | "es"): string {
  const entry = config.page_perspectives_title;
  const raw = String(language === "es" ? entry?.valueEs || "" : entry?.value || "").trim();
  if (!raw || (language === "es" && raw === "Perspectivas")) return "Insights";
  return plainText(raw);
}

/**
 * Registro único de páginas editoriales que pueden aparecer en los dos buscadores
 * públicos. Solo incluye destinos realmente disponibles y nunca expone Alumni.
 */
export function buildSearchableEditorialPages(
  config: ConfigMap,
  availability: NavigationAvailability,
): SearchableEditorialPage[] {
  const pages: Array<SearchableEditorialPage & { ready?: boolean }> = [
    {
      slug: "perspectives",
      title: perspectivesTitle(config, "en"),
      titleEs: perspectivesTitle(config, "es"),
      description: configText(config, "page_perspectives_intro", "en") || "Articles, events, recognitions, communications and legal updates.",
      descriptionEs: configText(config, "page_perspectives_intro", "es") || "Artículos, eventos, reconocimientos, comunicaciones y actualizaciones legales.",
      hrefEn: "/insights",
      hrefEs: "/perspectivas",
    },
    {
      slug: "articles",
      title: "Articles",
      titleEs: "Artículos",
      description: "Legal articles and opinion pieces authored by Von Wobeser y Sierra attorneys.",
      descriptionEs: "Artículos y columnas de opinión escritos por los abogados de Von Wobeser y Sierra.",
      hrefEn: "/articles?lang=en",
      hrefEs: "/articles",
    },
    {
      slug: "events",
      title: "Events",
      titleEs: "Eventos",
      description: "Published events from Von Wobeser y Sierra.",
      descriptionEs: "Eventos publicados por Von Wobeser y Sierra.",
      hrefEn: "/insights/events",
      hrefEs: "/perspectivas/eventos",
      ready: availability["perspectives-events"].contentReady,
    },
    {
      slug: "recognitions",
      title: "Recognitions",
      titleEs: "Reconocimientos",
      description: "Recognitions and rankings published by Von Wobeser y Sierra.",
      descriptionEs: "Reconocimientos y rankings publicados por Von Wobeser y Sierra.",
      hrefEn: "/insights/recognitions",
      hrefEs: "/perspectivas/reconocimientos",
      ready: availability["perspectives-recognitions"].contentReady,
    },
    {
      slug: "communications",
      title: "Communications",
      titleEs: "Comunicaciones",
      description: "Communications and news from Von Wobeser y Sierra.",
      descriptionEs: "Comunicaciones y actualidad de Von Wobeser y Sierra.",
      hrefEn: "/insights/communications",
      hrefEs: "/perspectivas/comunicaciones",
    },
    {
      slug: "analysis-and-updates",
      title: "Analysis and updates",
      titleEs: "Análisis y actualizaciones",
      description: "Analysis and legal updates from Von Wobeser y Sierra.",
      descriptionEs: "Análisis y alertas legales de Von Wobeser y Sierra.",
      hrefEn: "/insights/analysis-and-updates",
      hrefEs: "/perspectivas/analisis-y-actualizaciones",
    },
    {
      slug: "press-room",
      title: "Press room",
      titleEs: "Sala de prensa",
      description: "Media publications and press room from Von Wobeser y Sierra.",
      descriptionEs: "Publicaciones para medios y Sala de prensa de Von Wobeser y Sierra.",
      hrefEn: "/insights/press-room",
      hrefEs: "/perspectivas/sala-de-prensa",
      ready: availability["perspectives-press"].contentReady,
    },
    {
      slug: "international-reach",
      title: configText(config, "page_international_title", "en") || "International reach",
      titleEs: configText(config, "page_international_title", "es") || "Alcance internacional",
      description: configText(config, "page_international_intro", "en"),
      descriptionEs: configText(config, "page_international_intro", "es"),
      hrefEn: "/our-firm/international-reach",
      hrefEs: "/nuestra-firma/alcance-internacional",
      ready: availability["firm-international"].contentReady,
    },
    {
      slug: "openings",
      title: configText(config, "page_openings_title", "en") || "Openings",
      titleEs: configText(config, "page_openings_title", "es") || "Vacantes",
      description: configText(config, "page_openings_intro", "en") || "Current openings at Von Wobeser y Sierra.",
      descriptionEs: configText(config, "page_openings_intro", "es") || "Vacantes vigentes de Von Wobeser y Sierra.",
      hrefEn: "/careers/openings",
      hrefEs: "/bolsa-de-trabajo/vacantes",
      ready: availability["talent-openings"].contentReady,
    },
  ];

  return pages
    .filter((page) => page.ready !== false)
    .map(({ ready: _ready, ...page }) => page);
}
