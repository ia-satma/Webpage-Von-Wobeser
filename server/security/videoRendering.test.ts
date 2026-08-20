import assert from "node:assert/strict";
import test from "node:test";
import * as cheerio from "cheerio";
import { applyDiversityVideoGallery } from "../mirror/diversityVideoGallery";
import type { ConfigMap } from "../mirror/siteConfig";

process.env.DATABASE_URL ||= "postgresql://test:test@localhost:5432/test";

const entry = (value: string, valueEs = value) => ({ value, valueEs, type: "url" });

test("el Home usa una fachada privada para YouTube sin cargarlo como archivo", async () => {
  const { renderHome } = await import("../mirror/renderHome");
  const template = `<!doctype html><html><head></head><body>
    <div class="home__hero"><a href="/old"><video id="video_header"><source src="/old.mp4"></video></a></div>
    <div class="home__desk"></div>
  </body></html>`;
  const config: ConfigMap = {
    hero_video: entry("https://youtu.be/dQw4w9WgXcQ"),
    hero_video_mobile: entry("https://vimeo.com/76979871"),
    hero_video_poster: entry("/images/poster.webp"),
  };

  const html = renderHome(template, [], config, "es");
  const $ = cheerio.load(html);
  const facade = $("[data-vw-home-video-facade]");
  assert.equal(facade.length, 1);
  assert.match(facade.attr("data-vwb-consent-desktop-embed") || "", /^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);
  assert.match(facade.attr("data-vwb-consent-mobile-embed") || "", /^https:\/\/player\.vimeo\.com\/video\/76979871/);
  assert.equal($("#video_header").length, 0);
  assert.equal($("iframe").length, 0, "el proveedor no debe cargarse hasta que el usuario pulse reproducir");
  assert.match(html, /data-vw-home-video-play/);
});

test("el Home conserva video nativo y enlace institucional para archivos", async () => {
  const { renderHome } = await import("../mirror/renderHome");
  const template = `<!doctype html><html><head></head><body>
    <div class="home__hero"><a href="/old"><video id="video_header"></video></a></div>
    <div class="home__desk"></div>
  </body></html>`;
  const config: ConfigMap = {
    hero_video: entry("/uploads/video/desktop.mp4"),
    hero_video_mobile: entry("/uploads/video/mobile.webm"),
    hero_video_poster: entry("/images/poster.webp"),
    hero_practice_link: entry("/about", "/acerca-de"),
  };

  const html = renderHome(template, [], config, "es");
  const $ = cheerio.load(html);
  assert.equal($("#video_header source").length, 2);
  assert.equal($("#video_header source").first().attr("data-vwb-src"), "/uploads/video/mobile.webm");
  assert.equal($("#video_header source").first().attr("src"), undefined, "el video no debe descargarse antes de que el póster pinte");
  assert.equal($("#video_header").parent("a").attr("href"), "/acerca-de");
  assert.equal($("#video_header").parent("a").hasClass("vw-home-video-link"), true);
  assert.equal($("#video_header").attr("autoplay"), "autoplay");
  assert.equal($("#video_header").attr("muted"), "");
  assert.equal($("#video_header").attr("playsinline"), "");
  assert.equal($("[data-vw-home-video-retry]").length, 1);
  assert.equal($("[data-vw-home-video-facade]").length, 0);
});

test("el video nativo se reproduce automáticamente en móvil y ofrece recuperación solo tras un error", async () => {
  const { renderHome } = await import("../mirror/renderHome");
  const template = `<!doctype html><html><head></head><body>
    <div class="home__hero"><a href="/old"><video id="video_header"></video></a></div>
    <div class="home__desk"></div>
  </body></html>`;
  const html = renderHome(template, [], {
    hero_video: entry("/images/desktop.mp4"),
    hero_video_mobile: entry("/images/mobile.mp4"),
    hero_video_poster: entry("/images/poster.webp"),
  }, "en");
  const $ = cheerio.load(html);

  assert.equal($("[data-vw-home-video-retry] span").last().text().trim(), "Retry video");
  assert.match(html, /navigator\.connection&&navigator\.connection\.saveData/);
  assert.match(html, /prefers-reduced-motion: reduce/);
  assert.match(html, /source\[data-vwb-src\]/);
  assert.match(html, /video\.load\(\)/);
  assert.match(html, /requestAnimationFrame/);
  assert.match(html, /video\.preload='auto'/);
  assert.doesNotMatch(html, /reduced\|\|saveData\|\|mobile/);
  assert.match(html, /if\(reduced\|\|saveData\)\{video\.autoplay=false/);
  assert.match(html, /promise\.catch\(showRetry\)/);
  assert.match(html, /\.home__hero #video_header\{[\s\S]*?padding:0!important/);
  assert.doesNotMatch(html, /vw-home-video-facade\{margin-top:/);
  assert.doesNotMatch(html, /#video_header\{display:none\}/);
});

test("Diversidad alterna de forma segura entre archivo, YouTube y Vimeo", () => {
  const $ = cheerio.load(`<!doctype html><html><body>
    <div class="slide_vid"><video id="videoPlayer"><source id="videoSource"></video></div>
    <div class="thumb" name="vw_vid_02"><img></div>
    <div class="thumb" name="vid_01"><img></div>
    <div class="thumb" name="vid_02"><img></div>
    <script>salsa.setAttribute('src', '/images/' + cual + '.mp4');</script>
  </body></html>`);
  const config: ConfigMap = {
    page_diversity_video_main: entry("https://youtu.be/dQw4w9WgXcQ"),
    page_diversity_video_1: entry("/uploads/video/diversity.mp4"),
    page_diversity_video_2: entry("https://vimeo.com/76979871"),
  };

  applyDiversityVideoGallery($, config, "es");
  assert.match($("#vwDiversityEmbed").attr("src") || "", /^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);
  assert.ok($("#videoPlayer").is("[hidden]"));
  assert.equal($(".thumb[name='vid_01']").attr("data-video"), "/uploads/video/diversity.mp4");
  assert.match($(".thumb[name='vid_02']").attr("data-embed") || "", /^https:\/\/player\.vimeo\.com\/video\/76979871/);
  assert.match($.html(), /vwSelectDiversityVideo/);
  assert.doesNotMatch($.html(), /<iframe[^>]+(?:evil|javascript:)/i);
});
