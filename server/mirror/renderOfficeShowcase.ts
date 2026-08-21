import * as cheerio from "cheerio";
import type { Office, OfficeImage } from "@shared/schema";
import { buildVideoEmbedUrl, parseVideoSource } from "@shared/videoSource";
import { resolveContactLocation } from "./contactLocation";
import { LOCAL_SRI_MANIFEST } from "../security/sriManifest";
import { cfg, type ConfigMap } from "./siteConfig";

type Lang = "en" | "es";

const safeUrl = (value: string, fallback = "") => {
  const trimmed = String(value || "").trim();
  return /^(?:https?:\/\/|\/)/i.test(trimmed) ? trimmed : fallback;
};

function setLines($node: cheerio.Cheerio<any>, value: string): void {
  const lines = String(value || "").split(/\r?\n/);
  $node.empty();
  lines.forEach((line, index) => {
    if (index) $node.append("<br>");
    $node.append(cheerio.load("<span></span>")("span").text(line));
  });
}

function setMeta($: cheerio.CheerioAPI, selector: string, attrs: Record<string, string>): void {
  let node = $(selector).first();
  if (!node.length) {
    $("head").append("<meta>");
    node = $("head meta").last();
  }
  for (const [key, value] of Object.entries(attrs)) node.attr(key, value);
}

/**
 * El micrositio de oficinas fue capturado con un encabezado propio (sólo Inicio
 * e idioma). Conservamos su contenido, pero sustituimos ese cromo aislado por
 * el mismo header/nav del espejo antes de que el pipeline resuelva el preset
 * administrable. Así no se duplican menús ni se crean rutas paralelas.
 */
function applySharedNavigationChrome(
  $: cheerio.CheerioAPI,
  chromeTemplate: string | undefined,
): void {
  if (!chromeTemplate) return;
  const $chrome = cheerio.load(chromeTemplate);
  const header = $chrome("header.header_JS").first();
  const nav = $chrome("nav.nav.menu_JS").first();
  if (!header.length || !nav.length) return;

  const legacyHeader = $("body > div").filter((_, node) => $(node).find(".contenedor_header").length > 0).first();
  if (legacyHeader.length) legacyHeader.remove();
  else $(".contenedor_header").first().remove();

  header.addClass("office-showcase__shared-header");
  nav.addClass("office-showcase__shared-navigation");
  const hero = $(".hero-container").first();
  if (hero.length) {
    hero.before(header);
    hero.before(nav);
  } else {
    $("body").prepend(nav).prepend(header);
  }
  $("body").addClass("office-showcase--shared-navigation");
}

export function renderOfficeShowcase(
  template: string,
  config: ConfigMap,
  lang: Lang,
  office: Office | undefined,
  gallery: OfficeImage[],
  chromeTemplate?: string,
): string {
  const $ = cheerio.load(template);
  const value = (key: string) => cfg(config, key, lang).trim();
  const path = lang === "es" ? "/nuevas-oficinas/" : "/new-offices/";
  const alternatePath = lang === "es" ? "/new-offices/" : "/nuevas-oficinas/";
  const siteUrl = (config.site_url?.value || "https://www.vonwobeser.com").replace(/\/+$/, "");

  $("html").attr("lang", lang);
  $("body").addClass("office-showcase");
  $("title").text(value("office_seo_title"));
  setMeta($, 'meta[name="description"]', { name: "description", content: value("office_seo_description") });
  setMeta($, 'meta[property="og:title"]', { property: "og:title", content: value("office_seo_title") });
  setMeta($, 'meta[property="og:description"]', { property: "og:description", content: value("office_seo_description") });
  setMeta($, 'meta[property="og:image"]', { property: "og:image", content: `${siteUrl}${safeUrl(value("office_seo_image"), "/img/Banner/03.jpg")}` });
  setMeta($, 'meta[property="og:url"]', { property: "og:url", content: `${siteUrl}${path}` });
  $("head link[rel=canonical], head link[rel=alternate]").remove();
  $("head").append(`<link rel="canonical" href="${siteUrl}${path}">`);
  $("head").append(`<link rel="alternate" hreflang="${lang === "es" ? "en" : "es-MX"}" href="${siteUrl}${alternatePath}">`);
  $("head").append(`<link rel="alternate" hreflang="x-default" href="${siteUrl}/nuevas-oficinas/">`);

  applySharedNavigationChrome($, chromeTemplate);

  $(".hero-container").attr("data-office-banner", safeUrl(value("office_banner_image"), "/img/Banner/03.jpg"));
  setLines($(".hero-content h1.titulo_banner").first(), value("office_hero_title"));
  $(".hero-content .texto_banner").first().text(value("office_hero_subtitle"));
  $("#btnScroll span").last().text(value("office_scroll_label"));

  const headings = $("h2.titulos");
  setLines(headings.eq(0), value("office_vision_title"));
  setLines(headings.eq(1), value("office_location_title"));
  setLines(headings.eq(2), value("office_collaboration_title"));
  $(".paragraph-custom").first().text(value("office_vision_body"));
  $(".parrafo-map").first().text(value("office_location_body"));

  const collaborationTexts = $(".col-info-30 p.texto");
  collaborationTexts.eq(0).text(value("office_collaboration_intro"));
  collaborationTexts.eq(1).text(value("office_collaboration_highlight"));
  collaborationTexts.eq(2).text(value("office_collaboration_body"));
  const stats = Array.from({ length: 3 }, (_, index) => ({
    value: value(`office_stat_${index + 1}_value`),
    label: value(`office_stat_${index + 1}_label`),
  }));
  $("#changingTitle").attr("data-office-stats", JSON.stringify(stats));

  $(".quote-text").first().text(`“${value("office_quote")}”`);
  const author = value("office_quote_author");
  const role = value("office_quote_role");
  $(".contenedor_comillas p.p").first().text(`– ${author}${role ? `, ${role}` : ""}`);

  const location = resolveContactLocation(config, lang);
  const officeAddress = lang === "es"
    ? (office?.addressEs || office?.address || "")
    : (office?.address || office?.addressEs || "");
  $(".bg-custom-red.text-center h2").first().text(value("office_address_title"));
  const addressLink = $(".bg-custom-red.text-center p a").first();
  addressLink.attr("href", location.mapLink);
  setLines(addressLink, officeAddress);
  // Es la misma URL administrada que consumen Inicio y Contacto. La validación
  // evita que el micrositio vuelva a aceptar iframes arbitrarios y el CSS lo
  // deja a color, como las demás superficies públicas.
  const map = $("iframe.map-iframe").first();
  if (location.mapEmbed) {
    map.attr({
      src: location.mapEmbed,
      title: lang === "es" ? "Ubicación de Von Wobeser y Sierra" : "Von Wobeser y Sierra location",
      "data-vwb-office-map": "shared",
    });
  } else {
    map.removeAttr("src").attr("data-vwb-office-map", "unavailable");
  }

  const mainVideo = $("#videoPrincipal").first();
  let mainEmbed = $("#videoPrincipalEmbed").first();
  if (!mainEmbed.length && mainVideo.length) {
    mainVideo.after('<iframe id="videoPrincipalEmbed" class="office-video-embed" hidden title="" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" sandbox="allow-scripts allow-same-origin allow-presentation" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>');
    mainEmbed = $("#videoPrincipalEmbed").first();
  }

  for (let index = 0; index < 6; index += 1) {
    const fallbackVideo = `/img/videos/video${index + 1}.mp4`;
    const videoSource = parseVideoSource(value(`office_video_${index + 1}`))
      || parseVideoSource(fallbackVideo);
    const thumbnailUrl = safeUrl(value(`office_video_thumb_${index + 1}`), `/img/miniaturas/miniatura_${index + 1}.jpg`);
    const alt = value(`office_video_alt_${index + 1}`) || (lang === "es" ? `Video de oficinas ${index + 1}` : `Office video ${index + 1}`);
    const thumb = $(".video-thumb").eq(index);
    thumb.removeAttr("data-video data-embed");
    if (videoSource?.kind === "file") {
      thumb.attr("data-video", videoSource.url);
    } else if (videoSource) {
      const embedUrl = buildVideoEmbedUrl(videoSource, { controls: true, playsInline: true });
      if (embedUrl) thumb.attr("data-embed", embedUrl);
    }
    thumb.attr("data-video-title", alt);
    thumb.find("img").attr({ src: thumbnailUrl, alt });
    if (index === 0 && videoSource?.kind === "file") {
      mainVideo.removeAttr("hidden").attr("aria-label", alt);
      mainVideo.find("source").attr("src", videoSource.url);
      mainEmbed.attr("hidden", "").removeAttr("src");
    } else if (index === 0 && videoSource) {
      const embedUrl = buildVideoEmbedUrl(videoSource, { controls: true, playsInline: true });
      mainVideo.attr("hidden", "");
      mainVideo.find("source").removeAttr("src");
      if (embedUrl) mainEmbed.removeAttr("hidden").attr({ src: embedUrl, title: alt });
    }
  }

  const sortedGallery = [...gallery].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).slice(0, 9);
  const publicImages = $(".col-gallery-70 img.gallery-image");
  const modalImages = $("#imageCarousel .carousel-item img");
  sortedGallery.forEach((image, index) => {
    const alt = lang === "es" ? image.altEs : image.alt;
    publicImages.eq(index).attr({ src: safeUrl(image.imageUrl), alt });
    modalImages.eq(index).attr({ src: safeUrl(image.imageUrl), alt });
  });

  // El pie capturado era una variante aislada. Lo marcamos para que el
  // pipeline lo reemplace por el mismo pie configurable del resto del sitio.
  // De esta manera preset, enlaces, redes y datos de contacto tienen una sola
  // fuente de verdad en Administración.
  const legacyFooter = $("footer").first();
  if (legacyFooter.length) {
    legacyFooter.addClass("footer footer_fix");

    // El comunicado sigue siendo una pieza exclusiva de Nuevas oficinas, por
    // lo que se conserva como acción discreta antes del pie compartido.
    const pressHref = safeUrl(value("office_press_pdf"));
    const pressLabel = value("office_press_label");
    if (pressHref && pressLabel) {
      const press = $("<aside></aside>")
        .addClass("office-showcase__press")
        .attr("aria-label", lang === "es" ? "Comunicado de prensa" : "Press release");
      const pressLink = $("<a></a>")
        .attr({ href: pressHref, target: "_blank", rel: "noopener noreferrer" })
        .text(pressLabel);
      press.append(pressLink);
      legacyFooter.before(press);
    }
  }

  // La versión procede del mismo contenido protegido por SRI: una hoja de
  // estilos almacenada en caché nunca se reutiliza con un hash nuevo.
  const officeCssIntegrity = LOCAL_SRI_MANIFEST["/css/estilos_home.css"] || "";
  const officeCssVersion = officeCssIntegrity.replace(/^sha384-/, "").slice(0, 16);
  $('link[href*="estilos_home.css"]').attr(
    "href",
    officeCssVersion ? `/css/estilos_home.css?v=${officeCssVersion}` : "/css/estilos_home.css",
  );
  $('script[src*="funciones_animaciones"]').attr("src", "/js/office-showcase.js?v=20260803-video-providers1");
  return $.html();
}
