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
  /** <title> completo de la página. */
  title: string;
  description?: string;
  /** Imagen para Open Graph (ruta o URL). Default = logo. */
  image?: string;
  type?: "website" | "article" | "profile";
  /** Nodos JSON-LD específicos de la página (el de Organization se agrega solo). */
  jsonLd?: object[];
  robots?: string;
}

export function applySeo($: cheerio.CheerioAPI, opts: SeoOptions): void {
  const { lang, path } = opts;
  const description = clip(opts.description || DESC[lang]);
  const image = abs(opts.image || DEFAULT_IMAGE);
  const type = opts.type || "website";

  // Canonical de ESTA página (ES = sin sufijo; EN = ?lang=en).
  const esUrl = abs(path);
  const enUrl = abs(path) + (path.includes("?") ? "&" : "?") + "lang=en";
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
  upsertMeta($, "property", "og:title", opts.title);
  upsertMeta($, "property", "og:description", description);
  upsertMeta($, "property", "og:url", canonical);
  upsertMeta($, "property", "og:image", image);
  upsertMeta($, "property", "og:locale", lang === "es" ? "es_MX" : "en_US");
  upsertMeta($, "property", "og:locale:alternate", lang === "es" ? "en_US" : "es_MX");

  // Twitter Card
  upsertMeta($, "name", "twitter:card", "summary_large_image");
  upsertMeta($, "name", "twitter:title", opts.title);
  upsertMeta($, "name", "twitter:description", description);
  upsertMeta($, "name", "twitter:image", image);

  // JSON-LD (Organization siempre + nodos de la página)
  const graph = [organizationNode(lang), ...(opts.jsonLd || [])];
  $('head script[type="application/ld+json"]').remove();
  $("head").append(`<script type="application/ld+json">${jsonLdScript(graph)}</script>`);
}
