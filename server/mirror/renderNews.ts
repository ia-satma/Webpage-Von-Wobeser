import * as cheerio from "cheerio";
import { renderRichText } from "./sanitize";
import { applySeo, articleNode, breadcrumbNode, clip } from "./seo";

type Lang = "en" | "es";

function esc(s: any): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
};

/** News listing — replaces the archive cards with DB news (paginated). Reused for both
 *  "Noticias" (default opts) and "Artículos" (opts.basePath="/articles", distinto título). */
export function renderNewsList(
  templateHtml: string,
  news: any[],
  lang: Lang = "en",
  pageInfo?: { page: number; totalPages: number },
  opts: NewsListOpts = {},
): string {
  const $ = cheerio.load(templateHtml);
  const langSuffix = lang === "en" ? "?lang=en" : "";
  const readMore = lang === "es" ? "Leer más" : "Read more";
  const basePath = opts.basePath || "/news";
  const query = (opts.query || "").trim();

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
  } else if (query) {
    $(".archive__list").html(
      `<div class="vw-search-empty" role="status">` +
        `<div class="vw-search-empty__title">${lang === "es" ? "No encontramos resultados" : "No results found"}</div>` +
        `<p>${lang === "es" ? "Intenta con otras palabras o revisa la ortografía." : "Try different keywords or check the spelling."}</p>` +
      `</div>`,
    );
  } else {
    $(".archive__list").empty();
  }
  $(".pagination").remove(); // quita la paginación estática del template (Joomla)

  // El buscador del archivo queda limitado a esta sección y usa GET para que la
  // consulta se pueda compartir, paginar y alternar de idioma sin perderse.
  const $filterForm = $(".archive__filters form").filter((_, form) => $(form).find(".news_search").length > 0).first();
  if ($filterForm.length) {
    $filterForm.attr({ action: basePath, method: "get", role: "search" });
    $filterForm.find('input[type="hidden"]').remove();
    const $input = $filterForm.find('input[name="q"]').first();
    $input
      .attr({
        type: "search",
        value: query,
        minlength: "2",
        maxlength: "200",
        autocomplete: "off",
        "aria-label": lang === "es" ? "Buscar en esta sección" : "Search this section",
        placeholder: lang === "es" ? "Buscar" : "Search",
      });
    if (lang === "en") $filterForm.append('<input type="hidden" name="lang" value="en">');
  }
  // El selector Joomla de cantidad no está conectado al nuevo listado; se elimina para
  // evitar un segundo formulario roto que daba la impresión de que el filtro fallaba.
  $(".archive__filters form#adminForm").remove();

  if (query) {
    $(".archive__list").before(
      `<div class="vw-search-summary" role="status">` +
        `${lang === "es" ? "Resultados para" : "Results for"} “${esc(query)}”` +
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
    title: title[lang],
    description: description[lang],
    type: "website",
    robots: query ? "noindex,follow" : undefined,
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

/** News detail — injects one article into the single layout. */
export function renderNewsDetail(templateHtml: string, item: any, lang: Lang = "en"): string {
  const $ = cheerio.load(templateHtml);
  const title = L(item, "title", lang);
  const excerpt = renderRichText(L(item, "excerpt", lang));
  const content = renderRichText(L(item, "content", lang));
  const date = fmtDate(item.date, lang);

  $(".single__meta--name").first().text(title);
  // Show the date inside the meta sidebar (kept minimal, original styling).
  $(".single__meta--list").first().html(date ? `<p style="color:#fff;">${esc(date)}</p>` : "");
  $(".single__content--intro").html(excerpt || "");
  $(".single__content--txt").html(content || (excerpt ? "" : `<p>${esc(title)}</p>`));

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
