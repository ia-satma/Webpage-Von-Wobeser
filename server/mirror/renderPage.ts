import * as cheerio from "cheerio";
import { cfg, type ConfigMap } from "./siteConfig";
import { applySeo, breadcrumbNode, clip } from "./seo";
import { renderRichText } from "./sanitize";

type Lang = "en" | "es";

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
  meta?: {
    path: string;
    title: string;
    description?: string;
    alternatePaths?: { es: string; en: string };
  },
  postProcess?: ($: cheerio.CheerioAPI) => void,
  opts?: { bodyMode?: "replace" | "prepend" },
): string {
  const $ = cheerio.load(templateHtml);

  let introText = "";
  if (keys.intro) {
    const t = cfg(config, keys.intro, lang);
    if (t && t.trim()) { introText = t; $(".page__content--intro").first().html(renderRichText(t)); }
  }
  if (keys.body) {
    const t = cfg(config, keys.body, lang);
    if (t && t.trim()) {
      const $body = $(".page__content--body").first();
      // "prepend": el bloque original tiene contenido no-texto (ej. la galería de video de
      // Diversidad e Inclusión) que NO debe borrarse — el texto editable se inserta antes.
      if (opts?.bodyMode === "prepend") $body.prepend(renderRichText(t));
      else $body.html(renderRichText(t));
    }
  }

  $("html").attr("lang", lang === "es" ? "es-mx" : "en-gb");

  // Los módulos de Contacto, Diversidad y Oficinas pueden insertar mapas o videos.
  // Deben existir antes de applySeo/applyA11y para que el gestor de consentimiento
  // retire sus `src` externos antes de entregar el HTML al navegador.
  postProcess?.($);

  if (meta) {
    const fallbackDesc = clip($(".page__content--intro").first().text()) || undefined;
    applySeo($, {
      lang,
      path: meta.path,
      alternatePaths: meta.alternatePaths,
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
  return $.html();
}
