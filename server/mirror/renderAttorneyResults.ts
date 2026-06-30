import * as cheerio from "cheerio";

type Lang = "en" | "es";

function esc(s: any): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Renders the attorney search results as a photo + name grid — the search
 * NAVIGATES here (its own page) instead of expanding results inline, matching
 * the real vonwobeser.com behavior. Reuses the attorney-listing chrome
 * (header/nav/footer) and the site's own .archive__list / .archive__item
 * .search_photo .fotos_abogados grid styles, so it looks native.
 */
export function renderAttorneyResults(templateHtml: string, attorneys: any[], lang: Lang = "en"): string {
  const $ = cheerio.load(templateHtml);
  const langSuffix = lang === "en" ? "?lang=en" : "";

  const t = lang === "es"
    ? { count1: "abogado encontrado", countN: "abogados encontrados", noResults: "No se encontraron abogados con esos criterios.", back: "← Volver al buscador" }
    : { count1: "attorney found", countN: "attorneys found", noResults: "No attorneys found matching those criteria.", back: "← Back to search" };

  const items = attorneys
    .map((a) => {
      const img = esc(a.imageUrl || "");
      const photoStyle =
        `width:200px;height:200px;margin:0 auto;background-size:cover;background-position:center center;background-repeat:no-repeat;` +
        (img ? `background-image:url(${img});` : `background-color:#c4c4c4;`);
      return (
        `<div class="archive__item search_photo fotos_abogados">` +
        `<a href="/lawyer/${esc(a.slug)}${langSuffix}">` +
        `<div style="${photoStyle}"></div>` +
        `<div class="archive__item--ttl" style="text-align:center;width:200px;margin-top:8px;">${esc(a.name)}</div>` +
        `</a></div>`
      );
    })
    .join("");

  const countText = `${attorneys.length} ${attorneys.length === 1 ? t.count1 : t.countN}`;

  // .page--wrap es flex (regla global del sitio), así que cada hijo necesita
  // width:100% para apilarse en vez de acomodarse en la misma fila que el grid.
  const sectionHtml =
    `<div class="page--wrap wrap">` +
    `<p style="width:100%;margin:30px 0 0;"><a href="/attorneys${langSuffix}">${esc(t.back)}</a></p>` +
    (attorneys.length === 0
      ? `<p style="width:100%;margin:24px 0;color:#AA1A2E;">${esc(t.noResults)}</p>`
      : `<p style="width:100%;margin:24px 0 4px;font-family:'Geomanist-Book',serif;letter-spacing:2px;text-transform:uppercase;font-size:13px;color:gray;">${esc(countText)}</p>` +
        `<div class="archive__list" style="width:100%;max-width:575px;">${items}</div>`) +
    `</div>`;

  const $section = $("section.page.attorneys");
  if ($section.length) {
    $section.attr("class", "page archive").attr("style", "padding-top:0;").html(sectionHtml);
  }

  $("title").text(lang === "es" ? "Von Wobeser - Resultados de búsqueda" : "Von Wobeser - Search Results");
  $("html").attr("lang", lang === "es" ? "es-mx" : "en-gb");

  return $.html();
}
