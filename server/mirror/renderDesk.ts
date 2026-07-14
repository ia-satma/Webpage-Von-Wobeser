import * as cheerio from "cheerio";
import { applySeo, breadcrumbNode, clip } from "./seo";

type Lang = "en" | "es";

function esc(s: any): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function toParagraphs(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
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

/**
 * Rellena las regiones del mapa de "Desks" que tengan un desk real correspondiente, dejando
 * las demás regiones tal cual (vacías, como en el sitio original).
 */
export function renderDesksMap(templateHtml: string, desks: any[], lang: Lang = "en"): string {
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
    item.find(".desks__item--txt").first().html(toParagraphs(L(desk, "fullDescription", lang) || L(desk, "description", lang)));
    // El nombre completo enlaza a la página individual del desk para más detalle.
    item.find(".desks__item--txt").first().append(
      `<p><a href="/desk/${esc(desk.slug)}${lang === "en" ? "?lang=en" : ""}">${esc(name)} →</a></p>`,
    );
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

  const body = toParagraphs(L(desk, "fullDescription", lang) || L(desk, "description", lang));
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
