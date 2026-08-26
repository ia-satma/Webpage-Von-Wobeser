import * as cheerio from "cheerio";
import { renderRichText } from "./sanitize";
import { typographyAttribute, type TypographyStyles } from "@shared/editorialTypography";
import { applySeo, articleNode, breadcrumbNode, clip } from "./seo";
import { getLocalizedAttorneyRole, getLocalizedAttorneyTitle } from "@shared/attorneyTitles";
import { getAttorneyPublicName } from "@shared/attorneyName";

type Lang = "en" | "es";

function esc(s: any): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function L(obj: any, base: string, lang: Lang): string {
  if (!obj) return "";
  // No mezclar idiomas silenciosamente. Todas las noticias publicadas nuevas
  // requieren título y extracto ES/EN; en contenido legacy vacío se muestra el
  // extracto del idioma solicitado, no el cuerpo del idioma contrario.
  return lang === "es" ? obj[base + "Es"] || "" : obj[base] || "";
}

const MONTHS: Record<Lang, string[]> = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  es: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
};

function fmtDate(d: any, lang: Lang): string {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "";
  return `${MONTHS[lang][dt.getMonth()]}, ${dt.getFullYear()}`;
}

export type NewsListOpts = {
  /** Ruta base (sin idioma) usada para paginación + SEO + breadcrumb. Default "/news". */
  basePath?: string;
  title?: { en: string; es: string };
  description?: { en: string; es: string };
  crumbLabel?: { en: string; es: string };
  query?: string;
  author?: { name: string; slug: string } | null;
  alternatePaths?: { en: string; es: string };
  /** Cabecera editorial visible de los archivos que el menú trata como una sección propia. */
  editorialHeader?: {
    eyebrow: { en: string; es: string };
    title: { en: string; es: string };
    description: { en: string; es: string };
  };
};

type NewsListPageInfo = {
  page: number;
  totalPages: number;
  /** Total filtrado, para que la barra editorial pueda informar un resultado real. */
  totalItems?: number;
};

const SEARCH_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.3"></circle><path d="m16 16 4.2 4.2"></path></svg>';

/** News listing — replaces the archive cards with DB news (paginated). Reused for both
 *  "Noticias" (default opts) and "Artículos" (opts.basePath="/articles", distinto título). */
export function renderNewsList(
  templateHtml: string,
  news: any[],
  lang: Lang = "en",
  pageInfo?: NewsListPageInfo,
  opts: NewsListOpts = {},
): string {
  const $ = cheerio.load(templateHtml);
  const langSuffix = lang === "en" ? "?lang=en" : "";
  const readMore = lang === "es" ? "Leer más" : "Read more";
  const basePath = opts.basePath || "/news";
  const query = (opts.query || "").trim();
  const author = opts.author || null;

  const cards = news.map((n) => {
    const title = esc(L(n, "title", lang));
    const intro = renderRichText(L(n, "excerpt", lang));
    const href = `/news/${esc(n.slug)}${langSuffix}`;
    return (
      `<div class="archive__item"><a href="${href}">` +
      `<div class="archive__item--ttl">${title}</div></a>` +
      `<div class="archive__item--date">${esc(fmtDate(n.date, lang))}</div>` +
      `<div class="archive__item--intro">${intro || ""}</div>` +
      `<a href="${href}"><div class="more archive__item--btn" style="clear:right;">${readMore}</div></a>` +
      `</div>`
    );
  });

  if (cards.length) {
    $(".archive__list").html(cards.join("\n"));
  } else if (query || author) {
    $(".archive__list").html(
      `<div class="vw-search-empty" role="status">` +
        `<div class="vw-search-empty__title">${lang === "es" ? "No encontramos resultados" : "No results found"}</div>` +
        `<p>${lang === "es" ? "No hay publicaciones vinculadas con los filtros actuales." : "There are no publications connected to the current filters."}</p>` +
      `</div>`,
    );
  } else {
    $(".archive__list").empty();
  }
  $(".pagination").remove(); // quita la paginación estática del template (Joomla)

  // El buscador del archivo queda limitado a esta sección y usa GET para que la
  // consulta se pueda compartir, paginar y alternar de idioma sin perderse.
  // Sustituye el input Joomla de 170 px por la misma jerarquía visual del
  // directorio de Abogados, sin simular filtros que estas listas no tienen.
  const $filterForm = $(".archive__filters form").filter((_, form) => $(form).find(".news_search").length > 0).first();
  if ($filterForm.length) {
    const copy = lang === "es"
      ? {
          label: "Buscar en esta sección",
          placeholder: "Buscar por título, tema o palabra clave…",
          submit: "Buscar",
          clear: "Limpiar búsqueda",
          singular: "resultado",
          plural: "resultados",
          minHint: "Escribe al menos 2 caracteres.",
        }
      : {
          label: "Search this section",
          placeholder: "Search by title, topic or keyword…",
          submit: "Search",
          clear: "Clear search",
          singular: "result",
          plural: "results",
          minHint: "Enter at least 2 characters.",
        };
    const resultCount = pageInfo?.totalItems ?? news.length;
    const resetParams = new URLSearchParams();
    if (author) resetParams.set("author", author.slug);
    if (lang === "en") resetParams.set("lang", "en");
    const resetHref = `${basePath}${resetParams.size ? `?${resetParams.toString()}` : ""}`;
    const inputId = "vw-publications-search-q";
    const hiddenFields = `${lang === "en" ? '<input type="hidden" name="lang" value="en">' : ""}` +
      `${author ? `<input type="hidden" name="author" value="${esc(author.slug)}">` : ""}`;
    const clearLink = query
      ? `<a class="vw-publications-search__clear" href="${esc(resetHref)}">${esc(copy.clear)}</a>`
      : "";

    $filterForm
      .attr({ action: basePath, method: "get", role: "search", class: "vw-publications-search__form" })
      .removeAttr("style")
      .html(
        `${hiddenFields}` +
        `<label class="vw-sr-only" for="${inputId}">${esc(copy.label)}</label>` +
        `<div class="vw-publications-search__field">${SEARCH_ICON}` +
          `<input id="${inputId}" class="news_search" type="search" name="q" value="${esc(query)}" minlength="2" maxlength="200" autocomplete="off" placeholder="${esc(copy.placeholder)}" aria-describedby="vw-publications-search-hint" data-vw-publications-q>` +
        `</div>` +
        `<button class="vw-publications-search__submit" type="submit">${esc(copy.submit)}</button>` +
        `<p class="vw-publications-search__count" role="status" aria-live="polite">${resultCount} ${resultCount === 1 ? copy.singular : copy.plural}</p>` +
        `${clearLink}<span id="vw-publications-search-hint" class="vw-sr-only">${esc(copy.minHint)}</span>`,
      );
    $filterForm.closest(".archive__filters").addClass("vw-publications-search").removeAttr("style");
  }
  // El selector Joomla de cantidad no está conectado al nuevo listado; se elimina para
  // evitar un segundo formulario roto que daba la impresión de que el filtro fallaba.
  $(".archive__filters form#adminForm").remove();

  // Las listas de Artículos y Comunicaciones se presentan como destinos editoriales
  // independientes. La cabecera se inserta junto al archivo (no en la navegación) para
  // que el visitante siempre sepa en qué pestaña está, incluso al llegar desde una URL
  // compartida o después de una búsqueda.
  if (opts.editorialHeader) {
    $(".vw-publications-page__header").remove();
    const header = opts.editorialHeader;
    const $header = $(
      `<header class="vw-publications-page__header" aria-labelledby="vw-publications-page-title">` +
        `<p class="vw-publications-page__eyebrow">${esc(header.eyebrow[lang])}</p>` +
        `<h1 class="vw-publications-page__title" id="vw-publications-page-title">${esc(header.title[lang])}</h1>` +
        `<p class="vw-publications-page__lede">${esc(header.description[lang])}</p>` +
      `</header>`,
    );
    const $filters = $(".archive__filters.vw-publications-search, .archive__filters").first();
    if ($filters.length) $filters.before($header);
    else $(".archive__list").first().before($header);
    $header.closest(".page.archive").addClass("vw-publications-page");
  }

  if (query || author) {
    const summary = [
      author ? `${lang === "es" ? "Publicaciones de" : "Publications by"} ${esc(author.name)}` : "",
      query ? `${lang === "es" ? "Resultados para" : "Results for"} “${esc(query)}”` : "",
    ].filter(Boolean).join(" · ");
    $(".archive__list").before(
      `<div class="vw-search-summary" role="status">` +
        summary +
      `</div>`,
    );
    $("head").append(
      `<style id="vw-news-search-style">` +
        `.vw-search-summary{clear:both;padding:22px 0 10px;color:#b51d35;font-family:var(--vw-font-ui);font-size:16px;letter-spacing:.02em}` +
        `.vw-search-empty{padding:64px 0;border-top:1px solid #b51d35;text-align:center}` +
        `.vw-search-empty__title{font-family:var(--vw-font-editorial);font-size:32px;color:#5f5f5f}` +
        `.vw-search-empty p{font-family:var(--vw-font-body);font-size:16px}` +
      `</style>`,
    );
  }

  // Paginación dinámica
  if (pageInfo && pageInfo.totalPages > 1) {
    const { page, totalPages } = pageInfo;
    const linkPage = (p: number) => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (author) params.set("author", author.slug);
      params.set("page", String(p));
      if (lang === "en") params.set("lang", "en");
      return `${basePath}?${params.toString()}`;
    };
    const parts: string[] = [];
    if (page > 1) parts.push(`<a class="pagination__item" href="${linkPage(page - 1)}">‹ ${lang === "es" ? "Anterior" : "Prev"}</a>`);
    const from = Math.max(1, page - 2), to = Math.min(totalPages, page + 2);
    for (let p = from; p <= to; p++) parts.push(`<a class="pagination__item${p === page ? " is-active" : ""}" href="${linkPage(p)}" style="${p === page ? "font-weight:500;text-decoration:underline;" : ""}margin:0 6px;">${p}</a>`);
    if (page < totalPages) parts.push(`<a class="pagination__item" href="${linkPage(page + 1)}">${lang === "es" ? "Siguiente" : "Next"} ›</a>`);
    $(".archive__list").after(
      `<div class="pagination-dyn" style="text-align:center;padding:30px 0;font-size:14px;">${parts.join(" ")}` +
        `<div style="color:#999;margin-top:8px;">${lang === "es" ? "Página" : "Page"} ${page} / ${totalPages}</div></div>`,
    );
  }

  $("html").attr("lang", lang === "es" ? "es-mx" : "en-gb");
  const defaultTitle = { en: "News & Publications | Von Wobeser y Sierra", es: "Noticias y publicaciones | Von Wobeser y Sierra" };
  const defaultDesc = {
    en: "News, publications and legal updates from Von Wobeser y Sierra, a leading Mexican law firm.",
    es: "Noticias, publicaciones y actualizaciones legales de Von Wobeser y Sierra, firma de abogados líder en México.",
  };
  const defaultCrumb = { en: "News", es: "Noticias" };
  const title = opts.title || defaultTitle;
  const description = opts.description || defaultDesc;
  const crumbLabel = opts.crumbLabel || defaultCrumb;
  applySeo($, {
    lang,
    path: basePath,
    alternatePaths: opts.alternatePaths,
    title: title[lang],
    description: description[lang],
    type: "website",
    robots: query || author ? "noindex,follow" : undefined,
    jsonLd: [
      breadcrumbNode(
        [
          { name: lang === "es" ? "Inicio" : "Home", path: "/" },
          { name: crumbLabel[lang], path: basePath },
        ],
        lang,
      ),
    ],
  });
  return $.html();
}

function buildRelatedAttorneys(attorneys: any[], lang: Lang): string {
  if (!attorneys.length) return "";
  const labels = lang === "es"
    ? { heading: "Autores de esta publicación", view: "Ver perfil" }
    : { heading: "Publication authors", view: "View profile" };
  const cards = attorneys.map((attorney) => {
    const title = getLocalizedAttorneyTitle(attorney, lang) || getLocalizedAttorneyRole(attorney, lang);
    const href = lang === "es"
      ? `/abogado/${encodeURIComponent(attorney.slug)}`
      : `/lawyer/${encodeURIComponent(attorney.slug)}?lang=en`;
    const image = attorney.imageUrl
      ? `<a class="news-related-attorneys__image" href="${href}" aria-hidden="true" tabindex="-1"><img src="${esc(attorney.imageUrl)}" alt="" loading="lazy"></a>`
      : `<span class="news-related-attorneys__image" aria-hidden="true"></span>`;
    return `<article class="news-related-attorneys__item">` +
      image +
      `<div><h3><a href="${href}">${esc(getAttorneyPublicName(attorney))}</a></h3>` +
      `<p>${esc(title)}</p><a class="news-related-attorneys__link" href="${href}">${labels.view}</a></div>` +
      `</article>`;
  }).join("");
  return `<section class="news-related-attorneys" aria-labelledby="news-related-attorneys-title">` +
    `<h2 id="news-related-attorneys-title">${labels.heading}</h2>` +
    `<div class="news-related-attorneys__grid">${cards}</div></section>`;
}

function publicInsightImage(value: unknown): string {
  const source = String(value || "").trim();
  return /^(?:https?:\/\/|\/uploads\/)/i.test(source) ? source : "";
}

/** Contenido relacionado por etiquetas editoriales, autores o categoría. */
function buildRelatedInsights(items: any[], lang: Lang): string {
  if (!items.length) return "";
  const labels = lang === "es"
    ? { heading: "Contenido relacionado", read: "Leer publicación" }
    : { heading: "Related insights", read: "Read publication" };
  const langSuffix = lang === "en" ? "?lang=en" : "";
  const cards = items.map((item) => {
    const title = esc(L(item, "title", lang));
    const category = esc(L(item, "category", lang));
    const date = esc(fmtDate(item.date, lang));
    const href = `/news/${encodeURIComponent(String(item.slug || ""))}${langSuffix}`;
    const image = publicInsightImage(item.imageUrl || item.image);
    const imageMarkup = image
      ? `<div class="news-related-insights__image"><img src="${esc(image)}" alt="" loading="lazy"></div>`
      : "";
    return `<article class="news-related-insights__item">${imageMarkup}` +
      `<div class="news-related-insights__body">` +
      `<div class="news-related-insights__meta">${category}${category && date ? " · " : ""}${date}</div>` +
      `<h3><a href="${href}" aria-label="${esc(`${labels.read}: ${L(item, "title", lang)}`)}">${title}</a></h3>` +
      `<div class="news-related-insights__excerpt">${renderRichText(L(item, "excerpt", lang))}</div>` +
      `</div></article>`;
  }).join("");

  return `<section class="news-related-insights" aria-labelledby="news-related-insights-title">` +
    `<div class="news-related-insights__wrap wrap">` +
    `<div class="news-related-insights__header">` +
    `<h2 id="news-related-insights-title">${labels.heading}</h2>` +
    `</div><div class="news-related-insights__grid">${cards}</div></div></section>`;
}

/** News detail — injects one article into the single layout. */
export function renderNewsDetail(templateHtml: string, item: any, lang: Lang = "en", typography?: TypographyStyles): string {
  const $ = cheerio.load(templateHtml);
  const title = L(item, "title", lang);
  const excerpt = renderRichText(L(item, "excerpt", lang));
  const content = renderRichText(L(item, "content", lang));
  const date = fmtDate(item.date, lang);

  $(".single__meta--name").first().attr(typographyAttribute(typography, lang === "es" ? "titleEs" : "title", lang)).text(title);
  // Show the date inside the meta sidebar (kept minimal, original styling).
  $(".single__meta--list").first().html(date ? `<p style="color:#fff;">${esc(date)}</p>` : "");
  $(".single__content--intro").attr(typographyAttribute(typography, lang === "es" ? "excerptEs" : "excerpt", lang)).html(excerpt || "");
  $(".single__content--txt").attr(typographyAttribute(typography, lang === "es" ? "contentEs" : "content", lang)).html(content || (excerpt ? "" : `<p>${esc(title)}</p>`));
  $(".news-related-attorneys").remove();
  $(".news-related-insights").remove();
  const relatedAttorneys = (item.relatedTeamMembers || []) as any[];
  const relatedAttorneyMarkup = buildRelatedAttorneys(relatedAttorneys, lang);
  if (relatedAttorneyMarkup) $(".single__content--txt").after(relatedAttorneyMarkup);
  const relatedInsightsMarkup = buildRelatedInsights((item.relatedNews || []) as any[], lang);
  if (relatedInsightsMarkup) {
    const $pageWrap = $(".page--wrap").first();
    if ($pageWrap.length) $pageWrap.after(relatedInsightsMarkup);
    else if (relatedAttorneyMarkup) $(".news-related-attorneys").after(relatedInsightsMarkup);
    else $(".single__content--txt").after(relatedInsightsMarkup);
  }

  // --- Botones de acción (Imprimir / Compartir) ---
  // El template original traía Print/Share/Download cableados con jQuery (frágil → el botón de
  // imprimir no funcionaba de forma fiable) y un "Download" apuntando a un PDF viejo FIJO de 2017,
  // sin relación con la noticia (roto para todo el contenido de la BD). Se reconstruyen limpios y
  // accesibles; el estilo y el handler (vanilla, con delegación de eventos) se inyectan de forma
  // global en sendPage, así que funcionan aunque jQuery no cargue.
  const B =
    lang === "es"
      ? { print: "Imprimir", share: "Compartir", printAria: "Imprimir esta publicación", shareAria: "Compartir esta publicación" }
      : { print: "Print", share: "Share", printAria: "Print this publication", shareAria: "Share this publication" };
  const ICON_PRINT =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>';
  const ICON_SHARE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>';
  const btns = $(".single__meta--btns");
  if (btns.length) {
    btns.html(
      `<button type="button" class="vw-doc-btn" data-doc-action="print" aria-label="${esc(B.printAria)}">${ICON_PRINT}<span>${esc(B.print)}</span></button>` +
        `<button type="button" class="vw-doc-btn" data-doc-action="share" aria-label="${esc(B.shareAria)}">${ICON_SHARE}<span>${esc(B.share)}</span></button>`,
    );
  }
  // Elimina el <script> scrapeado que cableaba print/share con jQuery (ya no se usa).
  $("script").each((_i, el) => {
    const js = $(el).html() || "";
    if (js.includes("window.print()") || js.includes("share_url")) $(el).remove();
  });

  $("html").attr("lang", lang === "es" ? "es-mx" : "en-gb");
  const path = `/news/${item.slug}`;
  const desc = clip(excerpt || content || title);
  const iso = item.date ? new Date(item.date).toISOString() : undefined;
  applySeo($, {
    lang,
    path,
    title: `${title} | Von Wobeser y Sierra`,
    description: desc,
    image: item.imageUrl || item.image || undefined,
    type: "article",
    jsonLd: [
      articleNode({
        headline: title,
        description: desc,
        image: item.imageUrl || item.image || undefined,
        path,
        datePublished: iso,
        dateModified: item.updatedAt ? new Date(item.updatedAt).toISOString() : iso,
        authors: relatedAttorneys.map((attorney) => ({
          name: getAttorneyPublicName(attorney),
          path: lang === "es" ? `/abogado/${attorney.slug}` : `/lawyer/${attorney.slug}`,
        })),
        lang,
      }),
      breadcrumbNode(
        [
          { name: lang === "es" ? "Inicio" : "Home", path: "/" },
          { name: lang === "es" ? "Noticias" : "News", path: "/news" },
          { name: title, path },
        ],
        lang,
      ),
    ],
  });
  return $.html();
}
