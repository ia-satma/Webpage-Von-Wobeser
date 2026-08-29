import * as cheerio from "cheerio";
import { renderRichText } from "./sanitize";
import { typographyAttribute, type TypographyStyles } from "@shared/editorialTypography";
import { applySeo, articleNode, breadcrumbNode, clip } from "./seo";
import { getLocalizedAttorneyRole, getLocalizedAttorneyTitle } from "@shared/attorneyTitles";
import { getAttorneyPublicName } from "@shared/attorneyName";
import { isLegacyFirmPublicationUrl } from "../newsPublicationPolicy";

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

function plainText(value: unknown): string {
  return cheerio.load(String(value ?? "")).text().replace(/\s+/g, " ").trim();
}

function normalizedEditorialText(value: unknown): string {
  return plainText(value)
    .toLocaleLowerCase("es-MX")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

/** Texto breve para los renglones de archivo. El detalle conserva el extracto
 * completo y su formato; aquí evitamos que una línea se recorte visualmente a
 * mitad de palabra en una lista larga. */
function archiveSummary(value: unknown, maxChars = 155): string {
  const text = plainText(value);
  if (text.length <= maxChars) return text;
  const candidate = text.slice(0, maxChars + 1);
  const lastSentence = Math.max(candidate.lastIndexOf(". "), candidate.lastIndexOf("! "), candidate.lastIndexOf("? "));
  if (lastSentence >= Math.floor(maxChars * 0.55)) return candidate.slice(0, lastSentence + 1).trim();
  const lastSpace = candidate.lastIndexOf(" ");
  return `${candidate.slice(0, lastSpace > 0 ? lastSpace : maxChars).trim()}…`;
}

/**
 * Legacy article records occasionally stored the heading, “Introduction”, “PDF” or a raw
 * URL in the excerpt/body slots. Those are metadata placeholders, not editorial copy, and
 * must not be rendered as a second title or as unusable plain text.
 */
function isArticlePlaceholder(value: unknown, title: unknown): boolean {
  const text = plainText(value);
  if (!text) return true;
  if (/^https?:\/\//i.test(text)) return true;
  if (/^(?:introducci[oó]n|introduction|pdf)$/i.test(text)) return true;
  const normalized = normalizedEditorialText(text);
  return Boolean(normalized && normalized === normalizedEditorialText(title));
}

function verifiedSourceUrl(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!raw || raw.length > 2_000) return null;
  // Defensa en profundidad: una ficha olvidada en la base de datos nunca debe
  // volver a ofrecer como CTA la página anterior de la firma.
  if (isLegacyFirmPublicationUrl(raw)) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function sourceLink(url: string | null, lang: Lang, context: "archive" | "detail"): string {
  if (!url) return "";
  const label = lang === "es" ? "Ver publicación original" : "Read original publication";
  const className = context === "archive" ? "vw-news-source-link vw-news-source-link--archive" : "vw-news-source-link";
  return `<p class="${className}"><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a></p>`;
}

const MONTHS: Record<Lang, string[]> = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  es: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
};

function fmtDate(d: any, lang: Lang): string {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "";
  // `date` es editorial y no representa una hora local: UTC impide que el
  // navegador/servidor la desplace al día o mes anterior por su zona horaria.
  return `${MONTHS[lang][dt.getUTCMonth()]}, ${dt.getUTCFullYear()}`;
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
    /** Imagen institucional que equilibra los archivos editoriales extensos. */
    officeVisual?: {
      image: string;
      alt: { en: string; es: string };
      scene: "meeting-room" | "reception";
    };
  };
};

type NewsListPageInfo = {
  page: number;
  totalPages: number;
  /** Total filtrado, para que la barra editorial pueda informar un resultado real. */
  totalItems?: number;
};

/** Conserva filtros e idioma al navegar el archivo. La primera página no lleva
 * `page=1`, para mantener una URL canónica y compartible más limpia. */
function listPageHref(
  basePath: string,
  page: number,
  lang: Lang,
  query: string,
  author: NewsListOpts["author"],
): string {
  const questionMark = basePath.indexOf("?");
  const pathname = questionMark === -1 ? basePath : basePath.slice(0, questionMark);
  const params = new URLSearchParams(questionMark === -1 ? "" : basePath.slice(questionMark + 1));
  if (query) params.set("q", query);
  else params.delete("q");
  if (author) params.set("author", author.slug);
  else params.delete("author");
  if (page > 1) params.set("page", String(page));
  else params.delete("page");
  if (lang === "en") params.set("lang", "en");
  else params.delete("lang");
  return `${pathname}${params.size ? `?${params.toString()}` : ""}`;
}

/** Añade la página únicamente a URLs de archivo indexables. Las búsquedas
 * conservan su canonical base y `noindex,follow`. */
function paginatedArchivePath(path: string, page: number): string {
  const questionMark = path.indexOf("?");
  const pathname = questionMark === -1 ? path : path.slice(0, questionMark);
  const params = new URLSearchParams(questionMark === -1 ? "" : path.slice(questionMark + 1));
  if (page > 1) params.set("page", String(page));
  else params.delete("page");
  return `${pathname}${params.size ? `?${params.toString()}` : ""}`;
}

function renderEditorialPagination(
  basePath: string,
  pageInfo: NewsListPageInfo,
  lang: Lang,
  query: string,
  author: NewsListOpts["author"],
): string {
  const { page, totalPages } = pageInfo;
  const copy = lang === "es"
    ? {
        navigation: "Paginación de publicaciones",
        first: "Primera",
        previous: "Anterior",
        next: "Siguiente",
        last: "Última",
        page: "Página",
        goTo: "Ir a la página",
      }
    : {
        navigation: "Publication pagination",
        first: "First",
        previous: "Prev",
        next: "Next",
        last: "Last",
        page: "Page",
        goTo: "Go to page",
      };
  const href = (targetPage: number) => listPageHref(basePath, targetPage, lang, query, author);
  const link = (targetPage: number, label: string, modifier = "", visibleLabel = label) =>
    `<a class="pagination__item${modifier ? ` ${modifier}` : ""}" href="${esc(href(targetPage))}" aria-label="${esc(label)}">${esc(visibleLabel)}</a>`;
  const current = (targetPage: number) =>
    `<span class="pagination__item is-active" aria-current="page" aria-label="${esc(`${copy.page} ${targetPage}`)}">${targetPage}</span>`;
  const pageLink = (targetPage: number) => targetPage === page
    ? current(targetPage)
    : link(targetPage, `${copy.goTo} ${targetPage}`, "pagination__item--number", String(targetPage));
  const parts: string[] = [];
  const nearbyStart = Math.max(1, page - 1);
  const nearbyEnd = Math.min(totalPages, page + 1);

  if (page > 1) {
    parts.push(link(1, `« ${copy.first}`, "pagination__item--first"));
    parts.push(link(page - 1, `‹ ${copy.previous}`, "pagination__item--previous"));
  }
  if (nearbyStart > 1) {
    if (nearbyStart > 2) parts.push('<span class="pagination__ellipsis" aria-hidden="true">…</span>');
  }
  for (let targetPage = nearbyStart; targetPage <= nearbyEnd; targetPage += 1) parts.push(pageLink(targetPage));
  if (nearbyEnd < totalPages && nearbyEnd < totalPages - 1) {
    parts.push('<span class="pagination__ellipsis" aria-hidden="true">…</span>');
  }
  if (page < totalPages) {
    parts.push(link(page + 1, `${copy.next} ›`, "pagination__item--next"));
    parts.push(link(totalPages, `${copy.last} »`, "pagination__item--last"));
  }

  return (
    `<nav class="pagination-dyn pagination-dyn--editorial" aria-label="${esc(copy.navigation)}">` +
      `<div class="pagination-dyn__controls">${parts.join("")}</div>` +
      `<p class="pagination-dyn__status" aria-live="polite">${esc(`${copy.page} ${page} / ${totalPages}`)}</p>` +
    `</nav>`
  );
}

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
    const rawExcerpt = L(n, "excerpt", lang);
    const articleWithoutSummary = n.category === "articles" && isArticlePlaceholder(rawExcerpt, L(n, "title", lang));
    const intro = articleWithoutSummary ? "" : renderRichText(rawExcerpt);
    const originalSource = sourceLink(verifiedSourceUrl(n.sourceUrl), lang, "archive");
    const href = `/news/${esc(n.slug)}${langSuffix}`;
    const date = fmtDate(n.date, lang);
    const dateMarkup = date ? `<div class="archive__item--date">${esc(date)}</div>` : "";
    // Artículos y Comunicaciones comparten una lectura de archivo editorial:
    // fecha, contenido y acceso al detalle se ordenan como una fila. El resto
    // de los listados conserva el marcado histórico de tarjetas.
    if (opts.editorialHeader) {
      const summary = articleWithoutSummary ? "" : archiveSummary(rawExcerpt);
      return (
        `<article class="archive__item archive__item--editorial">` +
          dateMarkup +
          `<div class="archive__item--content">` +
            `<a class="archive__item--title-link" href="${href}"><h2 class="archive__item--ttl">${title}</h2></a>` +
            `<div class="archive__item--intro">${summary ? `<p>${esc(summary)}</p>` : ""}</div>` +
            originalSource +
          `</div>` +
          `<a class="archive__item--action" href="${href}" aria-label="${esc(`${readMore}: ${L(n, "title", lang)}`)}"><span aria-hidden="true">→</span></a>` +
        `</article>`
      );
    }
    return (
      `<div class="archive__item"><a href="${href}">` +
      `<div class="archive__item--ttl">${title}</div></a>` +
      dateMarkup +
      `<div class="archive__item--intro">${intro || ""}</div>` +
      originalSource +
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
    const $page = $header.closest(".page.archive");
    $page.addClass("vw-publications-page");

    // Artículos y Comunicaciones son listados largos, antes enteramente textuales.
    // La fotografía de las nuevas oficinas vive en una columna secundaria y no se
    // repite por tarjeta; así aporta contexto sin competir con cada publicación.
    if (header.officeVisual) {
      const visual = header.officeVisual;
      const officeHref = lang === "es" ? "/nuevas-oficinas/" : "/new-offices/";
      const label = lang === "es" ? "Nuestras oficinas" : "Our offices";
      const cta = lang === "es" ? "Conoce nuestras oficinas" : "Discover our offices";
      const $list = $(".archive__list").first();
      const $listContainer = $list.closest("form").first();
      const $main = $('<div class="vw-publications-page__content"></div>');
      const $visual = $(
        `<aside class="vw-publications-office" data-vw-office-scene="${visual.scene}" aria-label="${esc(label)}">` +
          `<a class="vw-publications-office__link" href="${officeHref}">` +
            `<figure class="vw-publications-office__figure">` +
              `<img class="vw-publications-office__image" src="${esc(visual.image)}" alt="${esc(visual.alt[lang])}" width="1280" height="720" loading="lazy" decoding="async">` +
              `<figcaption class="vw-publications-office__caption">` +
                `<span class="vw-publications-office__label">${esc(label)}</span>` +
                `<span class="vw-publications-office__cta">${esc(cta)} <span aria-hidden="true">→</span></span>` +
              `</figcaption>` +
            `</figure>` +
          `</a>` +
        `</aside>`,
      );
      const $layout = $('<div class="vw-publications-page__body"></div>');

      // El buscador queda en su propia franja, centrada debajo de la cabecera.
      // Así la retícula editorial empieza después con resultados e imagen al mismo
      // nivel, sin encerrar el control en la columna de publicaciones.
      // La lista puede vivir dentro del formulario heredado de Joomla o como un
      // nodo directo en las plantillas simplificadas usadas por las pruebas.
      // Mover el contenedor completo conserva paginación y resultados de búsqueda.
      if ($listContainer.length) $main.append($listContainer);
      else if ($list.length) $main.append($list);
      $layout.append($main, $visual);
      if ($filters.length) {
        $header.after($filters);
        $filters.after($layout);
      } else {
        $header.after($layout);
      }
    }
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
    if (opts.editorialHeader) {
      $(".archive__list").after(renderEditorialPagination(basePath, pageInfo, lang, query, author));
    } else {
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
  const shouldPaginateEditorialSeo = Boolean(opts.editorialHeader && pageInfo && pageInfo.page > 1 && !query && !author);
  const seoPath = shouldPaginateEditorialSeo ? paginatedArchivePath(basePath, pageInfo!.page) : basePath;
  // Los archivos filtrados no se indexan, pero sí deben conservar autor,
  // búsqueda, página e idioma al alternar ES/EN desde la cabecera pública.
  // Sin estas rutas explícitas applySeo sólo añadía `lang=en` a la base y
  // perdía el filtro de abogado.
  const filteredAlternatePaths = (query || author)
    ? {
        es: listPageHref(basePath, pageInfo?.page || 1, "es", query, author),
        en: listPageHref(basePath, pageInfo?.page || 1, "en", query, author),
      }
    : undefined;
  const seoAlternatePaths = filteredAlternatePaths || (shouldPaginateEditorialSeo && opts.alternatePaths
    ? {
        es: paginatedArchivePath(opts.alternatePaths.es, pageInfo!.page),
        en: paginatedArchivePath(opts.alternatePaths.en, pageInfo!.page),
      }
    : opts.alternatePaths);

  applySeo($, {
    lang,
    path: seoPath,
    alternatePaths: seoAlternatePaths,
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
  const datedItems = items.filter((item) => item?.date && !Number.isNaN(new Date(item.date).getTime()));
  if (!datedItems.length) return "";
  const labels = lang === "es"
    ? { heading: "Contenido relacionado", read: "Leer publicación" }
    : { heading: "Related insights", read: "Read publication" };
  const langSuffix = lang === "en" ? "?lang=en" : "";
  const cards = datedItems.map((item) => {
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
      `<div class="news-related-insights__excerpt">${renderRichText(L(item, "excerpt", lang), {
        disabledExternalUrls: Array.isArray(item?.disabledExternalUrls) ? item.disabledExternalUrls : [],
      })}</div>` +
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
  const isArticle = item.category === "articles";
  const rawExcerpt = L(item, "excerpt", lang);
  const rawContent = L(item, "content", lang);
  const richTextOptions = { disabledExternalUrls: Array.isArray(item.disabledExternalUrls) ? item.disabledExternalUrls : [] };
  const excerpt = isArticle && isArticlePlaceholder(rawExcerpt, title) ? "" : renderRichText(rawExcerpt, richTextOptions);
  const content = isArticle && isArticlePlaceholder(rawContent, title) ? "" : renderRichText(rawContent, richTextOptions);
  const originalSource = sourceLink(verifiedSourceUrl(item.sourceUrl), lang, "detail");
  const date = fmtDate(item.date, lang);

  $(".single__meta--name").first().attr(typographyAttribute(typography, lang === "es" ? "titleEs" : "title", lang)).text(title);
  // Show the date inside the meta sidebar (kept minimal, original styling).
  $(".single__meta--list").first().html(date ? `<p style="color:#fff;">${esc(date)}</p>` : "");
  $(".single__content--intro").attr(typographyAttribute(typography, lang === "es" ? "excerptEs" : "excerpt", lang)).html(excerpt || "");
  $(".single__content--txt").attr(typographyAttribute(typography, lang === "es" ? "contentEs" : "content", lang)).html(content || "");
  if (originalSource) $(".single__content--intro").after(originalSource);
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
