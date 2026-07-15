import * as cheerio from "cheerio";
import { applySeo, breadcrumbNode, clip } from "./seo";
import { CATEGORIES } from "./renderAttorneyList";
import { renderRichText } from "./sanitize";

type Lang = "en" | "es";

function esc(s: any): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function L(obj: any, base: string, lang: Lang): string {
  return lang === "es" ? obj[base + "Es"] || obj[base] || "" : obj[base] || "";
}

// La plantilla "Desks" del espejo NO es una página de texto simple: es un mapa mundial
// interactivo (SVG) con 4 regiones predefinidas (.desks__item[data-desk="..."]) — solo
// "germany" tiene contenido real capturado; america/asia/canada están vacías en el sitio
// original (regiones del mapa reservadas, nunca llenadas). Mapea el slug de un desk real
// a la región del mapa que le corresponde, cuando existe una; si no hay región para un desk
// (ej. uno nuevo que el cliente agregue después), simplemente no aparece en el mapa — sigue
// siendo alcanzable por su página individual /desk/:slug.
const MAP_REGION_BY_SLUG: Record<string, string> = { "german-desk": "germany" };

// El título del abogado (exactamente "Partner"/"Of Counsel"/"Counsel"/"Associate", ver el
// <Select> de AdminTeamForm) decide bajo qué acordeón del modal aparece — no hay un campo de
// "rol dentro del desk" separado, se reusa la misma categorización que ya usa /attorneys.
const TITLE_TO_CATEGORY: Record<string, keyof typeof CATEGORIES> = {
  Partner: "partners",
  "Of Counsel": "of-counsel",
  Counsel: "counsel",
  Associate: "associates",
};

/**
 * Reconstruye el acordeón "Socios en el Desk / Of Counsel en el Desk / Asociados en el Desk"
 * (`.single__meta--list.seccion_desk`) con los abogados reales asignados al desk, agrupados
 * por categoría. El sitio capturado traía esta lista con nombres de abogados fijos desde el
 * scrape original — se reemplaza por completo con datos de la base. Categorías sin abogados
 * simplemente no aparecen (igual que las regiones del mapa sin desk).
 */
function buildDeskTeamAccordion(members: any[], lang: Lang): string {
  const byCategory: Partial<Record<keyof typeof CATEGORIES, any[]>> = {};
  for (const m of members) {
    if (m.published === false) continue;
    const cat = TITLE_TO_CATEGORY[m.title as string];
    if (!cat) continue;
    (byCategory[cat] ||= []).push(m);
  }
  let html = "";
  for (const cat of Object.keys(CATEGORIES) as (keyof typeof CATEGORIES)[]) {
    const list = byCategory[cat];
    if (!list || !list.length) continue;
    const label = lang === "es" ? `${CATEGORIES[cat].es} en el Desk` : `${CATEGORIES[cat].en} at the Desk`;
    const items = list
      .map(
        (m) =>
          `<p style="font-size:14px; margin-bottom:10px; margin-top:10px; line-height:18px;"><a href="/lawyer/${esc(m.slug)}${lang === "en" ? "?lang=en" : ""}">${esc(m.name)}</a></p>`,
      )
      .join("");
    html += `<li class="accordion">${esc(label)}</li><div style="padding:0 10px; background-color:#bdbcbc;" class="panel">${items}</div>`;
  }
  return html;
}

/**
 * Rellena las regiones del mapa de "Desks" que tengan un desk real correspondiente, dejando
 * las demás regiones tal cual (vacías, como en el sitio original).
 */
export function renderDesksMap(
  templateHtml: string,
  desks: any[],
  lang: Lang = "en",
  teamMembersByDeskId: Record<string, any[]> = {},
): string {
  const $ = cheerio.load(templateHtml);

  for (const desk of desks) {
    if (desk.published === false) continue;
    const region = MAP_REGION_BY_SLUG[desk.slug];
    if (!region) continue;
    const item = $(`.desks__item[data-desk="${region}"]`).first();
    if (!item.length) continue;
    const name = L(desk, "name", lang);
    const country = L(desk, "country", lang) || name;
    item.find(".desks__item--ttl").first().text(country);
    item.find(".desks__item--txt").first().html(renderRichText(L(desk, "fullDescription", lang) || L(desk, "description", lang)));
    // El nombre completo enlaza a la página individual del desk para más detalle.
    item.find(".desks__item--txt").first().append(
      `<p><a href="/desk/${esc(desk.slug)}${lang === "en" ? "?lang=en" : ""}">${esc(name)} →</a></p>`,
    );
    item.find(".seccion_desk").first().html(buildDeskTeamAccordion(teamMembersByDeskId[desk.id] || [], lang));
  }

  $("html").attr("lang", lang === "es" ? "es-mx" : "en-gb");

  const path = lang === "es" ? "/capacidades/desks" : "/capabilities/desks";
  applySeo($, {
    lang,
    path,
    title: `Desks | Von Wobeser y Sierra`,
    description:
      lang === "es"
        ? "Grupos de trabajo especializados de Von Wobeser y Sierra, enfocados en países o sectores específicos."
        : "Specialized cross-practice teams of Von Wobeser y Sierra, focused on specific countries or sectors.",
    type: "website",
    jsonLd: [
      breadcrumbNode(
        [
          { name: lang === "es" ? "Inicio" : "Home", path: "/" },
          { name: lang === "es" ? "Capacidades" : "Capabilities", path: lang === "es" ? "/capacidades" : "/capabilities" },
          { name: "Desks", path },
        ],
        lang,
      ),
    ],
  });

  return $.html();
}

/**
 * Renders an individual desk's detail page. The captured mirror never had a dedicated
 * single-desk template (the Desks page is an interactive map, not a text page) — this reuses
 * the chrome of another institutional page (same nav/footer, `.page__ttl--holder` +
 * `.page__content--body`), which every captured page shares, and injects the desk's own data.
 */
export function renderDeskDetail(templateHtml: string, desk: any, lang: Lang = "en"): string {
  const $ = cheerio.load(templateHtml);

  const name = L(desk, "name", lang);
  const country = L(desk, "country", lang);
  const flag = desk.flagEmoji ? `${desk.flagEmoji} ` : "";
  const titleText = `${flag}${name}${country ? ` — ${country}` : ""}`;

  const ttlHolder = $(".page__ttl--holder").first();
  if (ttlHolder.length) ttlHolder.html(`<span>${esc(titleText.toUpperCase())}</span>`);

  const body = renderRichText(L(desk, "fullDescription", lang) || L(desk, "description", lang));
  $(".page__content--intro").first().remove();
  $(".page__content--body").first().html(body);

  $("html").attr("lang", lang === "es" ? "es-mx" : "en-gb");

  const path = `/desk/${desk.slug}`;
  const desc =
    clip(L(desk, "description", lang) || L(desk, "fullDescription", lang)) ||
    (lang === "es"
      ? `${name} — grupo de trabajo especializado de Von Wobeser y Sierra.`
      : `${name} — a specialized team of Von Wobeser y Sierra.`);

  applySeo($, {
    lang,
    path,
    title: `${name} | Von Wobeser y Sierra`,
    description: desc,
    type: "website",
    jsonLd: [
      breadcrumbNode(
        [
          { name: lang === "es" ? "Inicio" : "Home", path: "/" },
          { name: lang === "es" ? "Capacidades" : "Capabilities", path: lang === "es" ? "/capacidades" : "/capabilities" },
          { name: "Desks", path: lang === "es" ? "/capacidades/desks" : "/capabilities/desks" },
          { name, path },
        ],
        lang,
      ),
    ],
  });

  return $.html();
}
