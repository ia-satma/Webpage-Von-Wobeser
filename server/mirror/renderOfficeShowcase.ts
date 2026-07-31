import * as cheerio from "cheerio";
import type { Office, OfficeImage } from "@shared/schema";
import { cfg, isConfigEnabled, type ConfigMap } from "./siteConfig";

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

export function renderOfficeShowcase(
  template: string,
  config: ConfigMap,
  lang: Lang,
  office: Office | undefined,
  gallery: OfficeImage[],
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

  const headerLogo = $(".contenedor_header img.logo")
    .attr("src", safeUrl(value("office_header_logo"), "/images/vw40.png"))
    .attr("alt", "Von Wobeser y Sierra");
  const homePath = lang === "es" ? "/index.php/home/" : "/";
  if (!headerLogo.parent().is("a")) {
    headerLogo.wrap(`<a class="office-home-logo" href="${homePath}" aria-label="${lang === "es" ? "Ir al inicio" : "Go to home"}"></a>`);
  } else {
    headerLogo.parent("a").attr("href", homePath);
  }
  const languageButton = $("#langToggleBtn")
    .text(lang === "es" ? "ENG" : "ESP")
    .attr("aria-label", lang === "es" ? "View this page in English" : "Ver esta página en español")
    .attr("onclick", `window.location.href='${alternatePath}'`);
  const headerActions = languageButton.parent()
    .removeClass("absolute right-4 sm:right-6 lg:right-8")
    .addClass("office-header-actions");
  headerActions.find(".office-home-link").remove();
  languageButton.before($("<a></a>").addClass("office-home-link").attr("href", homePath).text(value("office_home_label")));

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

  const officeAddress = lang === "es"
    ? (office?.addressEs || office?.address || "")
    : (office?.address || office?.addressEs || "");
  $(".bg-custom-red.text-center h2").first().text(value("office_address_title"));
  const addressLink = $(".bg-custom-red.text-center p a").first();
  addressLink.attr("href", safeUrl(value("office_map_directions"), "https://www.google.com/maps"));
  setLines(addressLink, officeAddress);
  $("iframe.map-iframe").attr("src", safeUrl(value("office_map_embed"), "https://www.google.com/maps"));

  for (let index = 0; index < 6; index += 1) {
    const videoUrl = safeUrl(value(`office_video_${index + 1}`), `/img/videos/video${index + 1}.mp4`);
    const thumbnailUrl = safeUrl(value(`office_video_thumb_${index + 1}`), `/img/miniaturas/miniatura_${index + 1}.jpg`);
    const alt = value(`office_video_alt_${index + 1}`);
    const thumb = $(".video-thumb").eq(index);
    thumb.attr("data-video", videoUrl);
    thumb.find("img").attr({ src: thumbnailUrl, alt });
    if (index === 0) $("#videoPrincipal source").attr("src", videoUrl);
  }

  const sortedGallery = [...gallery].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).slice(0, 9);
  const publicImages = $(".col-gallery-70 img.gallery-image");
  const modalImages = $("#imageCarousel .carousel-item img");
  sortedGallery.forEach((image, index) => {
    const alt = lang === "es" ? image.altEs : image.alt;
    publicImages.eq(index).attr({ src: safeUrl(image.imageUrl), alt });
    modalImages.eq(index).attr({ src: safeUrl(image.imageUrl), alt });
  });

  $("footer img").first()
    .attr("src", safeUrl(value("office_footer_logo"), "/img/vw40b.png"))
    .attr("alt", "Von Wobeser y Sierra");
  $("footer a.mb-1").first()
    .attr("href", safeUrl(value("office_press_pdf")))
    .text(value("office_press_label"));
  const linkedinVisible = isConfigEnabled(config, "footer_linkedin_visible");
  const twitterVisible = isConfigEnabled(config, "footer_twitter_visible");
  const linkedin = $("footer a[aria-label=LinkedIn]");
  const twitter = $("footer a[aria-label=X]");
  if (linkedinVisible) linkedin.attr("href", safeUrl(value("office_linkedin")));
  else linkedin.remove();
  if (twitterVisible) twitter.attr("href", safeUrl(value("office_x")));
  else twitter.remove();
  if (linkedinVisible || twitterVisible) $("footer .follow-text").text(value("office_follow_label"));
  else $("footer .follow-text").remove();

  // Versionado explícito: evita conservar una copia incompleta de CSS/JS en caché.
  $('link[href*="estilos_home.css"]').attr("href", "/css/estilos_home.css?v=20260731-gelasio-atkinson4");
  $('script[src*="funciones_animaciones"]').attr("src", "/js/office-showcase.js?v=20260721-offices4");
  return $.html();
}
