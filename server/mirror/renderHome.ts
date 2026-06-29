import * as cheerio from "cheerio";
import { cfg, type ConfigMap } from "./siteConfig";

type Lang = "en" | "es";

function esc(s: any): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Serves the original mirror home, injecting backend-editable content:
 * latest news (hero overlay), hero video, and the red-banner texts (siteConfig).
 */
export function renderHome(templateHtml: string, news: any[], config: ConfigMap, lang: Lang = "en"): string {
  const $ = cheerio.load(templateHtml);
  const langSuffix = lang === "en" ? "?lang=en" : "";
  const seeMore = lang === "es" ? "VER MÁS" : "SEE MORE";

  // --- Hero news overlay (latest from DB) -------------------------------
  const items = news.slice(0, 2).map((n) => {
    const title = lang === "es" ? n.titleEs || n.title : n.title;
    return (
      `<div class="news_item">` +
      `<a href="/news/${esc(n.slug)}${langSuffix}"><h3>${esc(title)}</h3></a>` +
      `<a href="/news${langSuffix}"><span>${seeMore}</span></a>` +
      `</div>`
    );
  });
  if (items.length) $(".covid_headlines").html(items.join(""));

  // --- Hero video (editable via siteConfig hero_video) ------------------
  const video = cfg(config, "hero_video", lang);
  if (video) $("#video_header source").attr("src", video);

  // --- Red banner texts (editable) --------------------------------------
  const bTitle = cfg(config, "banner_title", lang);
  const bSubtitle = cfg(config, "banner_subtitle", lang);
  if (bTitle || bSubtitle) {
    const seeMoreLink = $(".home__rojo--txt a").first().attr("href") || "/new-offices/index.html";
    $(".home__rojo--txt").html(
      `<p><span style="font-size: 1.4rem;"><strong>${esc(bTitle)}</strong></span></p>` +
        `<p><span style="font-size: 1.4rem;">${esc(bSubtitle)}</span></p>` +
        `<p style="text-align: right;"><span style="font-size: 1.4rem;">` +
        `<a href="${esc(seeMoreLink)}" target="_blank" rel="alternate noopener noreferrer">${seeMore}</a></span></p>`,
    );
  }

  $("title").text("Von Wobeser y Sierra - We Go Where Clients Need Us");
  $("html").attr("lang", lang === "es" ? "es-mx" : "en-gb");
  return $.html();
}
