import * as cheerio from "cheerio";
import { applySeo, breadcrumbNode, clip } from "./seo";

type Lang = "en" | "es";

type SearchItem = {
  slug: string;
  name?: string | null;
  nameEs?: string | null;
  title?: string | null;
  titleEs?: string | null;
  role?: string | null;
  roleEs?: string | null;
  description?: string | null;
  descriptionEs?: string | null;
  excerpt?: string | null;
  excerptEs?: string | null;
};

export type GlobalSearchResults = {
  team: SearchItem[];
  practiceGroups: SearchItem[];
  industryGroups: SearchItem[];
  news: SearchItem[];
};

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function localized(item: SearchItem, key: "name" | "title" | "role" | "description" | "excerpt", lang: Lang): string {
  const translated = lang === "es" ? item[`${key}Es` as keyof SearchItem] : item[key];
  return String(translated || "");
}

function resultSection(
  title: string,
  items: SearchItem[],
  lang: Lang,
  href: (item: SearchItem) => string,
  label: (item: SearchItem) => string,
  description: (item: SearchItem) => string,
): string {
  if (!items.length) return "";
  const sectionId = `vw-results-${title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
  return (
    `<section class="vw-global-results__group" aria-labelledby="${sectionId}">` +
      `<h2 id="${sectionId}">${esc(title)}</h2>` +
      `<div class="vw-global-results__list">` +
        items.map((item) => {
          const detail = clip(description(item), 180);
          return (
            `<a class="vw-global-result" href="${esc(href(item))}">` +
              `<span class="vw-global-result__title">${esc(label(item))}</span>` +
              (detail ? `<span class="vw-global-result__description">${esc(detail)}</span>` : "") +
              `<span class="vw-global-result__arrow" aria-hidden="true">→</span>` +
            `</a>`
          );
        }).join("") +
      `</div>` +
    `</section>`
  );
}

/**
 * Normaliza el buscador editorial de la landing de Publicaciones. Se conserva la
 * composición del espejo, pero el formulario pasa a una ruta GET propia y deja de
 * enviar tokens y acciones heredadas de Joomla.
 */
export function applyPublicationsSearch($: cheerio.CheerioAPI, lang: Lang): void {
  const $form = $(".page .search__form.faded form, .page form").filter((_, form) => {
    return $(form).find('select[name="kind"]').length > 0;
  }).first();
  if (!$form.length) return;

  $form.attr({ action: "/publications/search", method: "get", role: "search" });
  $form.find('input[type="hidden"]').remove();
  $form.find('input[name="q"]').attr({
    type: "search",
    minlength: "2",
    maxlength: "200",
    required: "required",
    autocomplete: "off",
    "aria-label": lang === "es" ? "Palabras a buscar" : "Search keywords",
  });
  const $kind = $form.find('select[name="kind"]');
  $kind.find("option").each((_, option) => {
    const $option = $(option);
    const value = ($option.attr("value") || "").toLowerCase();
    if (value === "noticias" || value === "news") {
      $option.attr("value", "news").text(lang === "es" ? "Noticias" : "News");
    } else if (value === "articulos" || value === "articles") {
      $option.attr("value", "articles").text(lang === "es" ? "Artículos" : "Articles");
    }
  });
  if (lang === "en") $form.append('<input type="hidden" name="lang" value="en">');
}

export function renderGlobalSearch(
  templateHtml: string,
  results: GlobalSearchResults,
  query: string,
  lang: Lang,
): string {
  const $ = cheerio.load(templateHtml);
  const suffix = lang === "en" ? "?lang=en" : "";
  const total = Object.values(results).reduce((sum, items) => sum + items.length, 0);
  const ready = query.length >= 2;

  const sections = [
    resultSection(
      lang === "es" ? "Abogados y equipo" : "Attorneys and team",
      results.team,
      lang,
      (item) => lang === "es" ? `/abogado/${encodeURIComponent(item.slug)}` : `/lawyer/${encodeURIComponent(item.slug)}?lang=en`,
      (item) => item.name || "",
      (item) => localized(item, "role", lang) || localized(item, "title", lang),
    ),
    resultSection(
      lang === "es" ? "Prácticas" : "Practices",
      results.practiceGroups,
      lang,
      (item) => `/practice/${encodeURIComponent(item.slug)}${suffix}`,
      (item) => localized(item, "name", lang),
      (item) => localized(item, "description", lang),
    ),
    resultSection(
      lang === "es" ? "Grupos de práctica por industria" : "Industry practice groups",
      results.industryGroups,
      lang,
      (item) => `/industry/${encodeURIComponent(item.slug)}${suffix}`,
      (item) => localized(item, "name", lang),
      (item) => localized(item, "description", lang),
    ),
    resultSection(
      lang === "es" ? "Noticias y publicaciones" : "News and publications",
      results.news,
      lang,
      (item) => `/news/${encodeURIComponent(item.slug)}${suffix}`,
      (item) => localized(item, "title", lang),
      (item) => localized(item, "excerpt", lang),
    ),
  ].join("");

  const state = !ready
    ? `<div class="vw-global-results__state" role="status">${lang === "es" ? "Escribe al menos dos caracteres para buscar." : "Enter at least two characters to search."}</div>`
    : total === 0
      ? `<div class="vw-global-results__state" role="status"><strong>${lang === "es" ? "No encontramos resultados." : "No results found."}</strong><span>${lang === "es" ? "Intenta con otras palabras o revisa la ortografía." : "Try different keywords or check the spelling."}</span></div>`
      : sections;

  const page = `
<main class="vw-global-results">
  <div class="vw-global-results__wrap">
    <div class="vw-global-results__eyebrow">${lang === "es" ? "BUSCADOR" : "SEARCH"}</div>
    <h1>${lang === "es" ? "Buscar en el sitio" : "Search the site"}</h1>
    <form class="vw-global-results__form" action="/search" method="get" role="search">
      <label for="vw-global-query">${lang === "es" ? "Palabras" : "Keywords"}</label>
      <div class="vw-global-results__controls">
        <input id="vw-global-query" name="q" type="search" minlength="2" maxlength="200" value="${esc(query)}" autocomplete="off" required>
        ${lang === "en" ? '<input type="hidden" name="lang" value="en">' : ""}
        <button type="submit">${lang === "es" ? "Buscar" : "Search"}<span aria-hidden="true">→</span></button>
      </div>
    </form>
    ${ready && total > 0 ? `<p class="vw-global-results__summary" role="status">${total} ${lang === "es" ? "resultados para" : "results for"} “${esc(query)}”</p>` : ""}
    ${state}
  </div>
</main>`;

  $("section.page").first().replaceWith(page);
  $("html").attr("lang", lang === "es" ? "es-mx" : "en-gb");
  $("head").append(`
<style id="vw-global-search-style">
.vw-global-results{background:#fff;padding:132px 0 100px;color:#5f5f5f}
.vw-global-results__wrap{width:min(1180px,calc(100% - 64px));margin:0 auto}
.vw-global-results__eyebrow{color:#b51d35;font:600 12px/1 var(--vw-font-ui);letter-spacing:.26em;margin-bottom:18px}
.vw-global-results h1{font:400 clamp(36px,4vw,56px)/1.06 var(--vw-font-editorial);margin:0 0 42px;color:#606060}
.vw-global-results__form{background:#f1f1ef;border-block:1px solid #c8c8c6;padding:27px 32px 30px;margin-bottom:34px}
.vw-global-results__form label{display:block;color:#606060;font:600 12px/1 var(--vw-font-ui);letter-spacing:.18em;text-transform:uppercase;margin-bottom:13px}
.vw-global-results__controls{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px}
.vw-global-results__controls input{min-width:0;min-height:48px;border:1px solid #c8c8c6;background:#fff;padding:11px 15px;font:400 17px/1.35 var(--vw-font-ui);color:#333}
.vw-global-results__controls button{align-items:center;display:inline-flex;justify-content:center;min-height:48px;border:0;background:#b51d35;color:#fff;padding:0 25px;font:600 13px/1 var(--vw-font-ui);letter-spacing:.14em;text-transform:uppercase;cursor:pointer}
.vw-global-results__controls button span{display:inline-block;font-size:18px;line-height:1;margin-left:16px;transform:translateY(-1px);transition:transform .2s ease}
.vw-global-results__controls button:hover span,.vw-global-results__controls button:focus-visible span{transform:translate(5px,-1px)}
.vw-global-results__controls input:focus-visible{border-color:#777;box-shadow:inset 0 -2px 0 #b51d35;outline:0}
.vw-global-results__controls button:focus-visible,.vw-global-result:focus-visible{outline:2px solid rgba(181,29,53,.42);outline-offset:3px}
.vw-global-results__summary{font:400 15px/1.5 var(--vw-font-ui);color:#b51d35;margin:0 0 26px}
.vw-global-results__group{border-top:2px solid #b51d35;padding:28px 0 46px}
.vw-global-results__group h2{font:400 clamp(28px,3vw,42px)/1.1 var(--vw-font-editorial);margin:0 0 18px;color:#626262}
.vw-global-results__list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:48px}
.vw-global-result{position:relative;display:grid;gap:8px;padding:22px 44px 22px 0;border-bottom:1px solid #cfcfcf;color:inherit;text-decoration:none}
.vw-global-result__title{font:400 22px/1.2 var(--vw-font-editorial);color:#5c5c5c}
.vw-global-result__description{font:400 14px/1.55 var(--vw-font-body);color:#6a6a6a}
.vw-global-result__arrow{position:absolute;right:4px;top:24px;color:#b51d35;font-size:24px;transition:transform .2s ease}
.vw-global-result:hover .vw-global-result__arrow,.vw-global-result:focus-visible .vw-global-result__arrow{transform:translateX(5px)}
.vw-global-results__state{padding:70px 20px;border-top:2px solid #b51d35;text-align:center;font:400 18px/1.5 var(--vw-font-body)}
.vw-global-results__state strong,.vw-global-results__state span{display:block}
.vw-global-results__state strong{font:400 34px/1.2 var(--vw-font-editorial);margin-bottom:12px}
@media(max-width:760px){
  .vw-global-results{padding:104px 0 72px}
  .vw-global-results__wrap{width:min(100% - 32px,1180px)}
  .vw-global-results h1{font-size:clamp(36px,11vw,48px);margin-bottom:30px}
  .vw-global-results__form{padding:22px 20px 24px}
  .vw-global-results__controls,.vw-global-results__list{grid-template-columns:1fr}
  .vw-global-results__controls button{width:100%}
}
@media(prefers-reduced-motion:reduce){.vw-global-results *{transition:none!important}}
</style>`);

  applySeo($, {
    lang,
    path: "/search",
    title: lang === "es" ? "Buscar | Von Wobeser y Sierra" : "Search | Von Wobeser y Sierra",
    description: lang === "es"
      ? "Busca abogados, prácticas, grupos por industria y publicaciones de Von Wobeser y Sierra."
      : "Search Von Wobeser y Sierra attorneys, practices, industry groups and publications.",
    robots: "noindex,follow",
    type: "website",
    jsonLd: [
      breadcrumbNode(
        [
          { name: lang === "es" ? "Inicio" : "Home", path: "/" },
          { name: lang === "es" ? "Buscar" : "Search", path: "/search" },
        ],
        lang,
      ),
    ],
  });

  return $.html();
}
