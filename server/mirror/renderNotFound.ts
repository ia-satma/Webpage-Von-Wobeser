import * as cheerio from "cheerio";
import { applySeo, breadcrumbNode } from "./seo";

type Lang = "en" | "es";

const COPY = {
  es: {
    eyebrow: "ERROR 404",
    title: "Página no encontrada",
    body: "La página que busca no existe, cambió de dirección o ya no está disponible.",
    home: "Ir al inicio",
    back: "Volver",
  },
  en: {
    eyebrow: "ERROR 404",
    title: "Page not found",
    body: "The page you are looking for does not exist, moved, or is no longer available.",
    home: "Go to home",
    back: "Go back",
  },
} as const;

/**
 * Conserva el encabezado y pie del espejo para que un enlace inexistente no
 * termine mostrando el Home con respuesta 200 ni la SPA administrativa.
 */
export function renderNotFound(templateHtml: string, lang: Lang, requestedPath: string): string {
  const $ = cheerio.load(templateHtml);
  const copy = COPY[lang];

  $("html").attr("lang", lang === "es" ? "es-mx" : "en-gb");
  $("#main").html(
    `<main class="vw-not-found" id="main-content">` +
      `<div class="vw-not-found__inner wrap">` +
        `<p class="vw-not-found__eyebrow">${copy.eyebrow}</p>` +
        `<h1>${copy.title}</h1>` +
        `<p class="vw-not-found__body">${copy.body}</p>` +
        `<div class="vw-not-found__actions">` +
          `<a class="vw-not-found__primary" href="/">${copy.home}</a>` +
          `<button class="vw-not-found__secondary" type="button" onclick="history.back()">${copy.back}</button>` +
        `</div>` +
      `</div>` +
    `</main>`,
  );

  applySeo($, {
    lang,
    path: requestedPath || "/404",
    title: `${copy.title} | Von Wobeser y Sierra`,
    description: copy.body,
    robots: "noindex,follow",
    alternatePaths: {
      es: requestedPath || "/404",
      en: `${requestedPath || "/404"}${(requestedPath || "").includes("?") ? "&" : "?"}lang=en`,
    },
    jsonLd: [
      breadcrumbNode(
        [
          { name: lang === "es" ? "Inicio" : "Home", path: "/" },
          { name: copy.title, path: requestedPath || "/404" },
        ],
        lang,
      ),
    ],
  });

  return $.html();
}
