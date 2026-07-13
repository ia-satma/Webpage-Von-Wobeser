import * as cheerio from "cheerio";
import { cfg, type ConfigMap } from "./siteConfig";
import { applySeo, breadcrumbNode, clip } from "./seo";

type Lang = "en" | "es";

function esc(s: any): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Convierte texto plano editable (con saltos de línea) a párrafos HTML seguros:
// doble salto = nuevo párrafo, salto simple = <br>. Todo escapado (sin inyección).
function toParagraphs(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/**
 * Renderiza una página institucional del espejo (Nuestra Firma, Contacto, Carrera) inyectando
 * el texto editable de siteConfig en `.page__content--intro` / `.page__content--body`.
 * Si la key correspondiente está VACÍA, deja el texto original de la plantilla (fallback).
 */
export function renderPage(
  templateHtml: string,
  config: ConfigMap,
  lang: Lang,
  keys: { intro?: string; body?: string },
  meta?: { path: string; title: string; description?: string },
  postProcess?: ($: cheerio.CheerioAPI) => void,
): string {
  const $ = cheerio.load(templateHtml);

  let introText = "";
  if (keys.intro) {
    const t = cfg(config, keys.intro, lang);
    if (t && t.trim()) { introText = t; $(".page__content--intro").first().html(toParagraphs(t)); }
  }
  if (keys.body) {
    const t = cfg(config, keys.body, lang);
    if (t && t.trim()) $(".page__content--body").first().html(toParagraphs(t));
  }

  $("html").attr("lang", lang === "es" ? "es-mx" : "en-gb");

  if (meta) {
    const fallbackDesc = clip($(".page__content--intro").first().text()) || undefined;
    applySeo($, {
      lang,
      path: meta.path,
      title: meta.title,
      description: meta.description || clip(introText) || fallbackDesc,
      type: "website",
      jsonLd: [
        breadcrumbNode(
          [
            { name: lang === "es" ? "Inicio" : "Home", path: "/" },
            { name: meta.title.split("|")[0].trim(), path: meta.path },
          ],
          lang,
        ),
      ],
    });
  }
  postProcess?.($);
  return $.html();
}
