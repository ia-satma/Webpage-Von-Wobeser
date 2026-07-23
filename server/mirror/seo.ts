import type * as cheerio from "cheerio";

type Lang = "en" | "es";

// -------------------------------------------------------------------------
// URL base del sitio (para canonical / og:url / JSON-LD absolutos).
// Configurable: por env SITE_URL, o vía setBaseUrl() que setupMirror llama al
// arranque con la key `site_url` de siteConfig si está definida. Default = prod.
// -------------------------------------------------------------------------
let BASE_URL = (process.env.SITE_URL || "https://www.vonwobeser.com").replace(/\/+$/, "");
export function setBaseUrl(url: string | undefined | null): void {
  if (url && /^https?:\/\//i.test(url)) BASE_URL = url.replace(/\/+$/, "");
}
export function getBaseUrl(): string {
  return BASE_URL;
}

// -------------------------------------------------------------------------
// GA4 / Search Console — apagados por default (vacío = no se inyecta nada).
// Se activan solo llenando las keys `ga4_measurement_id` / `google_site_verification`
// en el panel (Configuración → Portada y pie de página → SEO), sin tocar código.
// -------------------------------------------------------------------------
let GA4_MEASUREMENT_ID = "";
let GSC_VERIFICATION = "";
export function setAnalyticsConfig(opts: { ga4MeasurementId?: string | null; searchConsoleVerification?: string | null }): void {
  if (typeof opts.ga4MeasurementId === "string") GA4_MEASUREMENT_ID = opts.ga4MeasurementId.trim();
  if (typeof opts.searchConsoleVerification === "string") GSC_VERIFICATION = opts.searchConsoleVerification.trim();
}

const SITE_NAME = "Von Wobeser y Sierra";
const ORG_LEGAL_NAME = "Von Wobeser y Sierra, S.C.";
const DEFAULT_IMAGE = "/logo-color.png";
const ORG_ID = "#organization";

// Datos institucionales para el nodo Organization/LegalService (structured data).
// Estables (dirección/tel del despacho); alimentan SEO y GEO (motores de IA citan JSON-LD).
const ORG = {
  telephone: "+52 55 5258 1000",
  streetAddress: "Campos Elíseos 204, Polanco (Torre SOMA, piso 18)",
  addressLocality: "Ciudad de México",
  addressRegion: "CDMX",
  postalCode: "11550",
  addressCountry: "MX",
  sameAs: [
    "https://www.facebook.com/Von-Wobeser-Sierra-SC-1655250134508590/about/?ref=page_internal",
    "https://twitter.com/VWySOficial",
    "https://mx.linkedin.com/company/von-wobeser-y-sierra",
  ],
};

const DESC: Record<Lang, string> = {
  es: "Von Wobeser y Sierra es una de las firmas de abogados líderes en México, con reconocimiento internacional en derecho corporativo, litigio, arbitraje y áreas de práctica especializadas.",
  en: "Von Wobeser y Sierra is one of Mexico's leading law firms, internationally recognized in corporate law, litigation, arbitration and specialized practice areas.",
};

// -------------------------------------------------------------------------
// Utilidades
// -------------------------------------------------------------------------
/** Convierte una ruta/URL a URL absoluta con la base del sitio. */
export function abs(pathOrUrl: string): string {
  if (!pathOrUrl) return "";
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return BASE_URL + (pathOrUrl.startsWith("/") ? pathOrUrl : "/" + pathOrUrl);
}

/** Limpia texto (quita HTML, colapsa espacios) y lo recorta para una meta description. */
export function clip(input: any, max = 160): string {
  const s = String(input ?? "")
    .replace(/<[^>]*>/g, " ") // quita tags
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim() + "…";
}

/** Serializa JSON-LD evitando el escape de `</script>` (breakout XSS). */
function jsonLdScript(graph: object[]): string {
  const payload = { "@context": "https://schema.org", "@graph": graph };
  return JSON.stringify(payload).replace(/</g, "\\u003c");
}

/** Inserta o actualiza un <meta name=".."> (o property) con el valor dado. */
function upsertMeta($: cheerio.CheerioAPI, attr: "name" | "property", key: string, content: string): void {
  if (!content) return;
  const sel = `meta[${attr}="${key}"]`;
  const existing = $(sel);
  if (existing.length) {
    existing.first().attr("content", content);
    // Elimina duplicados (algunas plantillas traen 2 descripciones).
    existing.slice(1).remove();
  } else {
    $("head").append(`<meta ${attr}="${key}" content="${escAttr(content)}">`);
  }
}

/** Inserta o reemplaza un <link rel="canonical">. */
function upsertLink($: cheerio.CheerioAPI, rel: string, href: string, hreflang?: string): void {
  if (!href) return;
  const attrs = hreflang ? ` hreflang="${hreflang}"` : "";
  $("head").append(`<link rel="${rel}" href="${escAttr(href)}"${attrs}>`);
}

function escAttr(s: string): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// -------------------------------------------------------------------------
// Nodos JSON-LD (schema.org)
// -------------------------------------------------------------------------
/** Nodo Organization/LegalService de la firma — se incluye en TODAS las páginas. */
export function organizationNode(lang: Lang): object {
  return {
    "@type": ["LegalService", "Organization"],
    "@id": BASE_URL + "/" + ORG_ID,
    name: ORG_LEGAL_NAME,
    alternateName: SITE_NAME,
    url: BASE_URL + "/",
    logo: abs(DEFAULT_IMAGE),
    image: abs(DEFAULT_IMAGE),
    description: DESC[lang],
    telephone: ORG.telephone,
    areaServed: "MX",
    address: {
      "@type": "PostalAddress",
      streetAddress: ORG.streetAddress,
      addressLocality: ORG.addressLocality,
      addressRegion: ORG.addressRegion,
      postalCode: ORG.postalCode,
      addressCountry: ORG.addressCountry,
    },
    sameAs: ORG.sameAs,
  };
}

/** BreadcrumbList a partir de una lista de {name, path}. */
export function breadcrumbNode(items: Array<{ name: string; path: string }>, lang: Lang): object {
  const suffix = lang === "en" ? "?lang=en" : "";
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: abs(it.path) + (it.path === "/" ? "" : suffix),
    })),
  };
}

/** NewsArticle para el detalle de noticia. */
export function articleNode(opts: {
  headline: string;
  description: string;
  image?: string;
  path: string;
  datePublished?: string;
  dateModified?: string;
  lang: Lang;
}): object {
  const suffix = opts.lang === "en" ? "?lang=en" : "";
  const url = abs(opts.path) + suffix;
  const node: any = {
    "@type": "NewsArticle",
    headline: opts.headline,
    description: opts.description,
    image: opts.image ? [abs(opts.image)] : [abs(DEFAULT_IMAGE)],
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    inLanguage: opts.lang === "es" ? "es-MX" : "en",
    author: { "@id": BASE_URL + "/" + ORG_ID },
    publisher: { "@id": BASE_URL + "/" + ORG_ID },
  };
  if (opts.datePublished) node.datePublished = opts.datePublished;
  node.dateModified = opts.dateModified || opts.datePublished || undefined;
  return node;
}

/** Person para el perfil de abogado. */
export function personNode(opts: {
  name: string;
  jobTitle?: string;
  image?: string;
  path: string;
  email?: string;
  telephone?: string;
  description?: string;
  lang: Lang;
}): object {
  const suffix = opts.lang === "en" ? "?lang=en" : "";
  const node: any = {
    "@type": "Person",
    name: opts.name,
    url: abs(opts.path) + suffix,
    worksFor: { "@id": BASE_URL + "/" + ORG_ID },
  };
  if (opts.jobTitle) node.jobTitle = opts.jobTitle;
  if (opts.image) node.image = abs(opts.image);
  if (opts.email) node.email = opts.email;
  if (opts.telephone) node.telephone = opts.telephone;
  if (opts.description) node.description = opts.description;
  return node;
}

/** Service (área de práctica / industria) provisto por la firma. */
export function serviceNode(opts: { name: string; description: string; path: string; lang: Lang }): object {
  const suffix = opts.lang === "en" ? "?lang=en" : "";
  return {
    "@type": "Service",
    name: opts.name,
    description: opts.description,
    url: abs(opts.path) + suffix,
    serviceType: opts.name,
    provider: { "@id": BASE_URL + "/" + ORG_ID },
    areaServed: "MX",
  };
}

// -------------------------------------------------------------------------
// applySeo — punto único que inyecta todo el <head> SEO/GEO en el cheerio $.
// -------------------------------------------------------------------------
export interface SeoOptions {
  lang: Lang;
  /** Ruta canónica SIN el parámetro ?lang (p.ej. /news/mi-noticia). */
  path: string;
  /** Rutas distintas por idioma para páginas institucionales (p.ej. /nuestra-firma y /our-firm). */
  alternatePaths?: { es: string; en: string };
  /** <title> completo de la página. */
  title: string;
  description?: string;
  /** Textos opcionales específicos para Open Graph y Twitter. */
  socialTitle?: string;
  socialDescription?: string;
  /** Imagen para Open Graph (ruta o URL). Default = logo. */
  image?: string;
  type?: "website" | "article" | "profile";
  /** Nodos JSON-LD específicos de la página (el de Organization se agrega solo). */
  jsonLd?: object[];
  robots?: string;
}

// -------------------------------------------------------------------------
// Accesibilidad — correcciones aplicadas a CADA página del espejo (llamada al
// final de applySeo). Arregla los hallazgos reales de Lighthouse móvil sobre
// la plantilla scrapeada: viewport que bloquea el zoom, imágenes sin alt,
// vínculos de íconos sin nombre, buscador sin etiqueta, y falta de landmark
// <main>. Como el header/footer/buscador son chrome compartido, corregir aquí
// una vez cubre todo el sitio.
// -------------------------------------------------------------------------
const SOCIAL_NAMES: Array<[RegExp, string]> = [
  [/facebook|icon_fb|\bfb\b/i, "Facebook"],
  [/twitter|icon_tw|\bx\b|icon_x/i, "Twitter"],
  [/linkedin|icon_in/i, "LinkedIn"],
  [/instagram|icon_ig/i, "Instagram"],
  [/youtube/i, "YouTube"],
];

export function applyA11y($: cheerio.CheerioAPI, lang: Lang): void {
  // 1) Viewport — permitir el zoom (WCAG 1.4.4). Quita maximum-scale/user-scalable=no.
  const VP = "width=device-width, initial-scale=1, viewport-fit=cover";
  const $vp = $('meta[name="viewport"]');
  if ($vp.length) $vp.attr("content", VP);
  else $("head").prepend(`<meta name="viewport" content="${VP}">`);

  // 2) alt en imágenes sin alt: íconos sociales y logo con nombre real; el resto decorativo (alt="").
  $("img:not([alt])").each((_, el) => {
    const $img = $(el);
    const src = ($img.attr("src") || "").toLowerCase();
    const cls = ($img.attr("class") || "").toLowerCase();
    const social = SOCIAL_NAMES.find(([re]) => re.test(src));
    let alt = "";
    if (social) alt = social[1];
    else if (/logo|vonwobeser|vw40|vw_|vw2025/.test(src) || /logo/.test(cls)) alt = "Von Wobeser y Sierra";
    $img.attr("alt", alt);
  });

  // 3) Vínculos sin nombre reconocible (íconos): aria-label desde el dominio del href.
  $("a").each((_, el) => {
    const $a = $(el);
    if (($a.attr("aria-label") || "").trim() || ($a.attr("title") || "").trim()) return;
    if ($a.text().replace(/\s+/g, "")) return; // ya tiene texto visible
    if (($a.find("img[alt]").attr("alt") || "").trim()) return; // ya tiene nombre por el alt del ícono
    const href = ($a.attr("href") || "").toLowerCase();
    const social = SOCIAL_NAMES.find(([re]) => re.test(href));
    if (social) $a.attr("aria-label", social[1]);
  });

  // 4) Buscador — nombre accesible + placeholder localizado.
  const searchLabel = lang === "es" ? "Buscar" : "Search";
  $('input[type="text"], input[type="search"], input:not([type])').each((_, el) => {
    const $i = $(el);
    const id = ($i.attr("id") || "").toLowerCase();
    const name = ($i.attr("name") || "").toLowerCase();
    const cls = ($i.attr("class") || "").toLowerCase();
    const isSearch = name === "q" || /search/.test(id) || /search/.test(cls);
    if (!isSearch) return;
    // Si ya tiene un <label for> asociado, no forzamos aria-label.
    const hasLabel = id && $(`label[for="${id}"]`).length > 0;
    if (!hasLabel && !($i.attr("aria-label") || "").trim()) $i.attr("aria-label", searchLabel);
    if (($i.attr("placeholder") || "").trim()) $i.attr("placeholder", searchLabel);
  });

  // 5) Landmark <main>: si no hay ninguno, marcar el contenedor de contenido principal.
  if ($("main, [role=main]").length === 0) {
    const candidates = [".page__content", ".home__hero", ".wide-container", "#content", ".content", "#main-content"];
    let placed = false;
    for (const sel of candidates) {
      const $c = $(sel).first();
      if ($c.length) { $c.attr("role", "main"); placed = true; break; }
    }
    if (!placed) {
      const $afterHeader = $("header").first().nextAll().filter("div,section,article").first();
      if ($afterHeader.length) $afterHeader.attr("role", "main");
    }
  }

  // 6) Contraste (WCAG 1.4.3): el color de texto BASE del sitio scrapeado es #808080
  //    (~3.95:1 sobre blanco → falla AA). Se oscurece a #5f5f5f (~6:1) el texto que
  //    HEREDA del body + las reglas explícitas que lo resisten (toggle de idioma, botón
  //    de menú, titulares de noticias del hero). NO afecta textos con color propio
  //    (verificado en la página viva: los blancos sobre rojo/hero siguen blancos, porque
  //    tienen su propia regla de color; !important en body no fuerza herencia en hijos
  //    que ya declaran color). Si un re-audit de otra página marcara más grises con regla
  //    propia, se agregan aquí sus selectores.
  if ($("#a11y-contrast").length === 0) {
    $("head").append(
      '<style id="a11y-contrast">' +
      'body{color:#5f5f5f !important}' +
      '.header__lang--item,.header--btn{color:#5f5f5f !important}' +
      '.covid_headlines a,.covid_headlines h3,.news_item a,.news_item h3{color:#5f5f5f !important}' +
      '</style>'
    );
  }
}

export function applySeo($: cheerio.CheerioAPI, opts: SeoOptions): void {
  const { lang, path } = opts;
  const description = clip(opts.description || DESC[lang]);
  const socialTitle = clip(opts.socialTitle || opts.title, 100);
  const socialDescription = clip(opts.socialDescription || description);
  const image = abs(opts.image || DEFAULT_IMAGE);
  const type = opts.type || "website";

  // La mayoría de las páginas comparte ruta y alterna con ?lang=en; algunas landings
  // institucionales tienen rutas limpias distintas por idioma.
  const esUrl = abs(opts.alternatePaths?.es || path);
  const enUrl = opts.alternatePaths
    ? abs(opts.alternatePaths.en)
    : abs(path) + (path.includes("?") ? "&" : "?") + "lang=en";
  const canonical = lang === "es" ? esUrl : enUrl;

  // <title> + description
  $("title").text(opts.title);
  upsertMeta($, "name", "description", description);
  if (opts.robots) upsertMeta($, "name", "robots", opts.robots);

  // Canonical + hreflang (crítico en sitio bilingüe). x-default = ES (idioma principal).
  $('head link[rel="canonical"], head link[rel="alternate"][hreflang]').remove();
  upsertLink($, "canonical", canonical);
  upsertLink($, "alternate", esUrl, "es-MX");
  upsertLink($, "alternate", enUrl, "en");
  upsertLink($, "alternate", esUrl, "x-default");

  // Open Graph
  upsertMeta($, "property", "og:type", type);
  upsertMeta($, "property", "og:site_name", SITE_NAME);
  upsertMeta($, "property", "og:title", socialTitle);
  upsertMeta($, "property", "og:description", socialDescription);
  upsertMeta($, "property", "og:url", canonical);
  upsertMeta($, "property", "og:image", image);
  upsertMeta($, "property", "og:locale", lang === "es" ? "es_MX" : "en_US");
  upsertMeta($, "property", "og:locale:alternate", lang === "es" ? "en_US" : "es_MX");

  // Twitter Card
  upsertMeta($, "name", "twitter:card", "summary_large_image");
  upsertMeta($, "name", "twitter:title", socialTitle);
  upsertMeta($, "name", "twitter:description", socialDescription);
  upsertMeta($, "name", "twitter:image", image);

  // JSON-LD (Organization siempre + nodos de la página)
  const graph = [organizationNode(lang), ...(opts.jsonLd || [])];
  $('head script[type="application/ld+json"]').remove();
  $("head").append(`<script type="application/ld+json">${jsonLdScript(graph)}</script>`);

  // Verificación de Google Search Console (solo si se llenó en el panel).
  $('head meta[name="google-site-verification"]').remove();
  upsertMeta($, "name", "google-site-verification", GSC_VERIFICATION);

  // GA4 (solo si se llenó un Measurement ID válido en el panel — G-XXXXXXX).
  // También quita cualquier snippet de gtag ya incrustado en la plantilla scrapeada
  // (el sitio original tenía uno inline sin el loader de gtag.js — no funcionaba,
  // pero no debe quedar duplicado/conflictuando con el que instala el panel).
  $("head script")
    .filter((_, el) => /gtag\(/.test($(el).html() || ""))
    .remove();
  if (/^G-[A-Z0-9]+$/i.test(GA4_MEASUREMENT_ID)) {
    $("head").append(
      `<script data-ga4 async src="https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}"></script>` +
      `<script data-ga4>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA4_MEASUREMENT_ID}');</script>`
    );
  }

  // Accesibilidad (Lighthouse) — se aplica al final para cubrir también los nodos
  // que otros pasos hayan insertado en el <body> (formularios, listados, etc.).
  applyA11y($, lang);
}
