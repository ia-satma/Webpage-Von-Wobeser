import * as cheerio from "cheerio";
import type { Alliance, Event, JobOpening, News } from "@shared/schema";
import { renderRichText } from "./sanitize";
import { applySeo, breadcrumbNode, clip } from "./seo";
import type { ConfigMap } from "./siteConfig";

type Lang = "en" | "es";

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function localized(record: Record<string, unknown>, key: string, lang: Lang): string {
  return String(lang === "es" ? record[`${key}Es`] ?? "" : record[key] ?? "");
}

function configText(config: ConfigMap, key: string, lang: Lang): string {
  const entry = config[key];
  return String(lang === "es" ? entry?.valueEs || "" : entry?.value || "");
}

function perspectivesTitle(config: ConfigMap, lang: Lang): string {
  const configured = configText(config, "page_perspectives_title", lang).trim();
  // "Perspectivas" fue el título predeterminado previo al ajuste del menú.
  // Se normaliza solo ese valor exacto, sin sustituir una personalización del CMS.
  if (!configured || (lang === "es" && configured === "Perspectivas")) return "Insights";
  return configured;
}

function safeExternalHref(value: unknown, allowMail = false): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol === "https:" || url.protocol === "http:" || (allowMail && url.protocol === "mailto:")) return url.toString();
  } catch { /* URL inválida: se oculta */ }
  return null;
}

function pageShell(
  templateHtml: string,
  lang: Lang,
  opts: { eyebrow: string; title: string; intro?: string; content: string; className: string },
): cheerio.CheerioAPI {
  const $ = cheerio.load(templateHtml);
  const intro = (opts.intro || "").trim()
    ? `<div class="vw-new-page__intro">${renderRichText(opts.intro)}</div>`
    : "";
  $("section.page").first().replaceWith(
    `<main class="vw-new-page ${esc(opts.className)}" id="main-content">` +
      `<div class="vw-new-page__wrap">` +
        `<p class="vw-new-page__eyebrow">${esc(opts.eyebrow)}</p>` +
        `<h1>${esc(opts.title)}</h1>${intro}${opts.content}` +
      `</div>` +
    `</main>`,
  );
  $("html").attr("lang", lang === "es" ? "es-mx" : "en-gb");
  return $;
}

export type PerspectiveHubSection = {
  id: string;
  title: string;
  href: string;
  count: number;
  highlights: Array<{ title: string; href: string; date?: Date | string | null }>;
};

// Estas colecciones siguen disponibles y administrables de forma individual,
// pero no forman parte de la portada editorial de Insights. La defensa vive
// aquí, junto al renderizado, para que ningún llamador futuro pueda volver a
// exponerlas accidentalmente sólo por tener contenido publicado.
export const HIDDEN_PERSPECTIVES_HUB_SECTION_IDS = new Set([
  "events",
  "recognitions",
  "press",
]);

export function renderPerspectivesHub(
  templateHtml: string,
  config: ConfigMap,
  lang: Lang,
  sections: PerspectiveHubSection[],
): string {
  const available = sections.filter((section) => (
    section.count > 0 && !HIDDEN_PERSPECTIVES_HUB_SECTION_IDS.has(section.id)
  ));
  const cards = available.map((section) => (
    `<article class="vw-perspectives__card">` +
      `<div class="vw-perspectives__card-head"><h2>${esc(section.title)}</h2><span>${section.count}</span></div>` +
      `<div class="vw-perspectives__highlights">` +
        section.highlights.slice(0, 2).map((item) => (
          `<a href="${esc(item.href)}"><span>${esc(item.title)}</span><span aria-hidden="true">→</span></a>`
        )).join("") +
      `</div>` +
      `<a class="vw-new-page__cta" href="${esc(section.href)}">${lang === "es" ? "Ver sección" : "View section"}<span aria-hidden="true">→</span></a>` +
    `</article>`
  )).join("");
  const subscribe = (
    `<aside class="vw-perspectives__subscribe" aria-labelledby="insights-subscribe-title">` +
      `<div><span>${lang === "es" ? "Mantente al día" : "Stay informed"}</span>` +
      `<h2 id="insights-subscribe-title">${lang === "es" ? "Recibe nuestras perspectivas" : "Receive our insights"}</h2></div>` +
      `<a class="vw-perspectives__subscribe-cta" href="${lang === "es" ? "/#newsletter" : "/?lang=en#newsletter"}">${lang === "es" ? "Suscríbete" : "Subscribe"}<span aria-hidden="true">→</span></a>` +
    `</aside>`
  );
  const title = perspectivesTitle(config, lang);
  const $ = pageShell(templateHtml, lang, {
    eyebrow: lang === "es" ? "CONOCIMIENTO Y ACTUALIDAD" : "KNOWLEDGE AND UPDATES",
    title,
    intro: configText(config, "page_perspectives_intro", lang),
    content: `<div class="vw-perspectives__grid">${cards}</div>${subscribe}`,
    className: "vw-perspectives",
  });
  applySeo($, {
    lang,
    path: lang === "es" ? "/perspectivas" : "/insights",
    alternatePaths: { es: "/perspectivas", en: "/insights" },
    title: `${title} | Von Wobeser y Sierra`,
    description: lang === "es"
      ? "Artículos, comunicaciones y análisis de Von Wobeser y Sierra."
      : "Articles, communications and analysis from Von Wobeser y Sierra.",
    type: "website",
    jsonLd: [breadcrumbNode([
      { name: lang === "es" ? "Inicio" : "Home", path: "/" },
      { name: title, path: lang === "es" ? "/perspectivas" : "/insights" },
    ], lang)],
  });
  return $.html();
}

function dateLabel(value: Date | string, lang: Lang): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(lang === "es" ? "es-MX" : "en-US", {
    day: "numeric", month: "long", year: "numeric",
  }).format(date);
}

export function renderEventsPage(templateHtml: string, events: Event[], lang: Lang): string {
  const cards = events.map((event) => {
    const title = localized(event as unknown as Record<string, unknown>, "title", lang);
    const description = localized(event as unknown as Record<string, unknown>, "description", lang);
    const location = localized(event as unknown as Record<string, unknown>, "location", lang);
    const external = safeExternalHref(event.externalUrl);
    return (
      `<article class="vw-collection-card" id="evento-${esc(event.id)}">` +
        `<div class="vw-collection-card__meta"><time datetime="${esc(new Date(event.date).toISOString())}">${esc(dateLabel(event.date, lang))}</time>${location ? `<span>${esc(location)}</span>` : ""}</div>` +
        `<h2>${esc(title)}</h2>${description ? `<div class="vw-collection-card__body">${renderRichText(description)}</div>` : ""}` +
        (external ? `<a class="vw-new-page__cta" href="${esc(external)}" target="_blank" rel="noopener noreferrer">${lang === "es" ? "Más información" : "Learn more"}<span aria-hidden="true">↗</span></a>` : "") +
      `</article>`
    );
  }).join("");
  const title = lang === "es" ? "Eventos" : "Events";
  const $ = pageShell(templateHtml, lang, {
    eyebrow: lang === "es" ? "PERSPECTIVAS" : "INSIGHTS",
    title,
    content: `<div class="vw-collection-grid">${cards}</div>`,
    className: "vw-events-page",
  });
  applySeo($, {
    lang,
    path: lang === "es" ? "/perspectivas/eventos" : "/insights/events",
    alternatePaths: { es: "/perspectivas/eventos", en: "/insights/events" },
    title: `${title} | Von Wobeser y Sierra`,
    description: lang === "es" ? "Eventos publicados por Von Wobeser y Sierra." : "Events published by Von Wobeser y Sierra.",
    type: "website",
  });
  return $.html();
}

export function renderInternationalReach(
  templateHtml: string,
  config: ConfigMap,
  alliances: Alliance[],
  lang: Lang,
): string {
  const title = configText(config, "page_international_title", lang) || (lang === "es" ? "Alcance internacional" : "International reach");
  const cards = alliances.map((alliance) => {
    const name = localized(alliance as unknown as Record<string, unknown>, "name", lang) || alliance.name;
    const description = localized(alliance as unknown as Record<string, unknown>, "description", lang);
    const country = localized(alliance as unknown as Record<string, unknown>, "country", lang);
    const website = safeExternalHref(alliance.websiteUrl);
    const inner = `<h2>${esc(name)}</h2>${country ? `<p class="vw-alliance__country">${esc(country)}</p>` : ""}${description ? renderRichText(description) : ""}`;
    return website
      ? `<a class="vw-alliance" href="${esc(website)}" target="_blank" rel="noopener noreferrer">${inner}<span aria-hidden="true">↗</span></a>`
      : `<article class="vw-alliance">${inner}</article>`;
  }).join("");
  const $ = pageShell(templateHtml, lang, {
    eyebrow: lang === "es" ? "NUESTRA FIRMA" : "OUR FIRM",
    title,
    intro: configText(config, "page_international_intro", lang),
    content: `<div class="vw-new-page__body">${renderRichText(configText(config, "page_international_body", lang))}</div><div class="vw-alliances">${cards}</div>`,
    className: "vw-international-page",
  });
  applySeo($, {
    lang,
    path: lang === "es" ? "/nuestra-firma/alcance-internacional" : "/our-firm/international-reach",
    alternatePaths: { es: "/nuestra-firma/alcance-internacional", en: "/our-firm/international-reach" },
    title: `${title} | Von Wobeser y Sierra`,
    description: clip(configText(config, "page_international_intro", lang), 160),
    type: "website",
  });
  return $.html();
}

export function renderOpeningsPage(
  templateHtml: string,
  config: ConfigMap,
  openings: JobOpening[],
  lang: Lang,
): string {
  const title = configText(config, "page_openings_title", lang) || (lang === "es" ? "Vacantes" : "Openings");
  const cards = openings.map((opening) => {
    const record = opening as unknown as Record<string, unknown>;
    const role = localized(record, "title", lang);
    const department = localized(record, "department", lang);
    const location = localized(record, "location", lang);
    const description = localized(record, "description", lang);
    const applicationUrl = safeExternalHref(opening.applicationUrl);
    const email = String(opening.applicationEmail || "").trim();
    const emailHref = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? `mailto:${email}` : null;
    const href = applicationUrl || emailHref;
    return (
      `<article class="vw-opening">` +
        `<div class="vw-opening__meta">${department ? `<span>${esc(department)}</span>` : ""}${location ? `<span>${esc(location)}</span>` : ""}</div>` +
        `<h2>${esc(role)}</h2><div class="vw-opening__body">${renderRichText(description)}</div>` +
        (href ? `<a class="vw-new-page__cta" href="${esc(href)}"${applicationUrl ? ' target="_blank" rel="noopener noreferrer"' : ""}>${lang === "es" ? "Postularme" : "Apply"}<span aria-hidden="true">→</span></a>` : "") +
      `</article>`
    );
  }).join("");
  const $ = pageShell(templateHtml, lang, {
    eyebrow: lang === "es" ? "TALENTO" : "CAREERS",
    title,
    intro: configText(config, "page_openings_intro", lang),
    content: `<div class="vw-openings">${cards}</div>`,
    className: "vw-openings-page",
  });
  applySeo($, {
    lang,
    path: lang === "es" ? "/bolsa-de-trabajo/vacantes" : "/careers/openings",
    alternatePaths: { es: "/bolsa-de-trabajo/vacantes", en: "/careers/openings" },
    title: `${title} | Von Wobeser y Sierra`,
    description: lang === "es" ? "Vacantes vigentes de Von Wobeser y Sierra." : "Current openings at Von Wobeser y Sierra.",
    type: "website",
  });
  return $.html();
}

export function renderAlumniPage(templateHtml: string, config: ConfigMap, lang: Lang): string {
  const title = configText(config, "page_alumni_title", lang) || "Alumni";
  const $ = pageShell(templateHtml, lang, {
    eyebrow: lang === "es" ? "NUESTRA FIRMA" : "OUR FIRM",
    title,
    intro: configText(config, "page_alumni_intro", lang),
    content: `<div class="vw-new-page__body">${renderRichText(configText(config, "page_alumni_body", lang))}</div>`,
    className: "vw-alumni-page",
  });
  applySeo($, {
    lang,
    path: lang === "es" ? "/nuestra-firma/alumni" : "/our-firm/alumni",
    alternatePaths: { es: "/nuestra-firma/alumni", en: "/our-firm/alumni" },
    title: `${title} | Von Wobeser y Sierra`,
    description: clip(configText(config, "page_alumni_intro", lang), 160),
    robots: "noindex,nofollow,noarchive",
    type: "website",
  });
  return $.html();
}

export function newsHighlight(news: News, lang: Lang): { title: string; href: string; date?: Date | null } {
  return {
    title: localized(news as unknown as Record<string, unknown>, "title", lang),
    href: `/news/${encodeURIComponent(news.slug)}${lang === "en" ? "?lang=en" : ""}`,
    date: news.date,
  };
}
