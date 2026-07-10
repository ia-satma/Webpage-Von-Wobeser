import * as cheerio from "cheerio";
import { sanitizeCms } from "./sanitize";
import { applySeo, articleNode, breadcrumbNode, clip } from "./seo";

type Lang = "en" | "es";

function esc(s: any): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function L(obj: any, base: string, lang: Lang): string {
  if (!obj) return "";
  return lang === "es" ? obj[base + "Es"] || obj[base] || "" : obj[base] || "";
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

/** News listing — replaces the archive cards with DB news (paginated). */
export function renderNewsList(
  templateHtml: string,
  news: any[],
  lang: Lang = "en",
  pageInfo?: { page: number; totalPages: number },
): string {
  const $ = cheerio.load(templateHtml);
  const langSuffix = lang === "en" ? "?lang=en" : "";
  const readMore = lang === "es" ? "Leer más" : "Read more";

  const cards = news.map((n) => {
    const title = esc(L(n, "title", lang));
    const intro = sanitizeCms(L(n, "excerpt", lang)); // HTML del CMS — sanitizado (anti-XSS)
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

  $(".archive__list").html(cards.join("\n"));
  $(".pagination").remove(); // quita la paginación estática del template (Joomla)

  // Paginación dinámica
  if (pageInfo && pageInfo.totalPages > 1) {
    const { page, totalPages } = pageInfo;
    const linkPage = (p: number) => `/news?page=${p}${lang === "en" ? "&lang=en" : ""}`;
    const parts: string[] = [];
    if (page > 1) parts.push(`<a class="pagination__item" href="${linkPage(page - 1)}">‹ ${lang === "es" ? "Anterior" : "Prev"}</a>`);
    const from = Math.max(1, page - 2), to = Math.min(totalPages, page + 2);
    for (let p = from; p <= to; p++) parts.push(`<a class="pagination__item${p === page ? " is-active" : ""}" href="${linkPage(p)}" style="${p === page ? "font-weight:bold;text-decoration:underline;" : ""}margin:0 6px;">${p}</a>`);
    if (page < totalPages) parts.push(`<a class="pagination__item" href="${linkPage(page + 1)}">${lang === "es" ? "Siguiente" : "Next"} ›</a>`);
    $(".archive__list").after(
      `<div class="pagination-dyn" style="text-align:center;padding:30px 0;font-size:14px;">${parts.join(" ")}` +
        `<div style="color:#999;margin-top:8px;">${lang === "es" ? "Página" : "Page"} ${page} / ${totalPages}</div></div>`,
    );
  }

  $("html").attr("lang", lang === "es" ? "es-mx" : "en-gb");
  applySeo($, {
    lang,
    path: "/news",
    title: lang === "es" ? "Noticias y publicaciones | Von Wobeser y Sierra" : "News & Publications | Von Wobeser y Sierra",
    description:
      lang === "es"
        ? "Noticias, publicaciones y actualizaciones legales de Von Wobeser y Sierra, firma de abogados líder en México."
        : "News, publications and legal updates from Von Wobeser y Sierra, a leading Mexican law firm.",
    type: "website",
    jsonLd: [
      breadcrumbNode(
        [
          { name: lang === "es" ? "Inicio" : "Home", path: "/" },
          { name: lang === "es" ? "Noticias" : "News", path: "/news" },
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
  const excerpt = sanitizeCms(L(item, "excerpt", lang)); // anti-XSS
  const content = sanitizeCms(L(item, "content", lang)); // anti-XSS
  const date = fmtDate(item.date, lang);

  $(".single__meta--name").first().text(title);
  // Show the date inside the meta sidebar (kept minimal, original styling).
  $(".single__meta--list").first().html(date ? `<p style="color:#fff;">${esc(date)}</p>` : "");
  $(".single__content--intro").html(excerpt ? `<p>${excerpt}</p>` : "");
  $(".single__content--txt").html(content || (excerpt ? "" : `<p>${esc(title)}</p>`));

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
