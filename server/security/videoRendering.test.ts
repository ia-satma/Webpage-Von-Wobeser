import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
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

test("el indicador Scroll de Inicio se ancla al borde inferior del video", async () => {
  const { renderHome } = await import("../mirror/renderHome");
  const template = `<!doctype html><html><head></head><body>
    <div class="home__hero"><a href="/old"><video id="video_header"></video></a><div class="home__hero--scroll" style="bottom:310px"><span>Scroll</span></div></div>
  </body></html>`;
  const html = renderHome(template, [], {}, "es");
  const $ = cheerio.load(html);

  assert.doesNotMatch($(".home__hero--scroll").attr("style") || "", /bottom\s*:/i);
  assert.match(html, /\.home__hero>\.home__hero--scroll\{bottom:clamp\(1\.5rem,3vw,3rem\)!important\}/);
  assert.match(html, /\.home__hero>\.home__hero--scroll:after\{display:none!important\}/);
  assert.match(html, /@media \(max-width:680px\)\{[\s\S]*?\.home__hero>\.home__hero--scroll\{bottom:1\.5rem!important\}/);
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

test("Diversidad nunca reutiliza videos de Nuevas oficinas y oculta una galería sin videos propios", () => {
  const $ = cheerio.load(`<!doctype html><html><body>
    <div class="slide_vid"><video id="videoPlayer"><source id="videoSource"></video></div>
    <div class="slide_videos_thumbs">
      <div class="thumb" name="vid_04"><img></div>
      <div class="thumb" name="vw_vid_02"><img></div>
      <div class="thumb" name="vid_01"><img></div>
      <div class="thumb" name="vid_07"><img></div>
    </div>
  </body></html>`);
  const config: ConfigMap = {
    page_diversity_video_main: entry("/images/vw_vid_02.mp4"),
    page_diversity_video_1: entry("/img/videos/video1.mp4"),
    page_diversity_video_4: entry("/img/videos/video4.mp4"),
    page_diversity_thumb_main: entry("/images/diversity-thumbnails/main.jpg"),
    page_diversity_thumb_1: entry("/images/diversity-thumbnails/video-1.jpg"),
    page_diversity_thumb_4: entry("/images/diversity-thumbnails/video-4.jpg"),
  };

  applyDiversityVideoGallery($, config, "es");

  assert.equal($(".slide_videos_thumbs").length, 0);
  assert.doesNotMatch($.html(), /\/img\/videos\/video[1-6]\.mp4/);
});

test("Diversidad conserva los siete fotogramas generados a partir de sus videos", () => {
  const thumbnails = ["main", ...Array.from({ length: 6 }, (_, index) => `video-${index + 1}`)];
  for (const thumbnail of thumbnails) {
    const asset = path.resolve(
      import.meta.dirname,
      `../../frontend-mirror/images/diversity-thumbnails/${thumbnail}.jpg`,
    );
    const bytes = fs.readFileSync(asset);
    assert.deepEqual([...bytes.subarray(0, 3)], [0xff, 0xd8, 0xff], `${thumbnail} debe ser un JPEG válido`);
    assert.ok(bytes.length > 10_000, `${thumbnail} no debe ser un marcador diminuto`);
  }
});

test("Diversidad e Inclusión usa la cabecera editorial bilingüe sin el rótulo vertical legado", () => {
  const template = `<!doctype html><html><body><section class="page"><div class="page--wrap">
    <div class="page__ttl"><span>DIVERSIDAD E INCLUSIÓN</span></div>
    <div class="page__content"><div class="page__content--intro"><p>Texto de introducción.</p></div><div class="page__content--body"><div class="slide_vid"><video id="videoPlayer"><source id="videoSource"></video></div></div></div>
    <aside class="page__sidebar"><img class="img_probono_1"><img class="img_probono_2 img_probono_2_fix"><img class="img_probono_3 fix_3"></aside>
  </div></section></body></html>`;
  const config: ConfigMap = {
    page_diversity_eyebrow: { value: "Our firm", valueEs: "Nuestra firma", type: "text" },
    page_diversity_title: { value: "Diversity & inclusion", valueEs: "Diversidad e inclusión", type: "text" },
    page_diversity_logo_1: entry("/uploads/diversity-1.png"),
    page_diversity_logo_2: entry("/uploads/diversity-2.png"),
    page_diversity_logo_3: entry("/uploads/diversity-3.png"),
  };
  const es = cheerio.load(template);
  const en = cheerio.load(template);
  applyDiversityVideoGallery(es, config, "es");
  applyDiversityVideoGallery(en, config, "en");

  assert.equal(es(".page.vw-diversity-page").attr("aria-labelledby"), "vw-diversity-page-title");
  assert.equal(es(".vw-diversity-page__eyebrow").text(), "Nuestra firma");
  assert.equal(es("h1.vw-diversity-page__title").text(), "Diversidad e inclusión");
  assert.equal(en(".vw-diversity-page__eyebrow").text(), "Our firm");
  assert.equal(en("h1.vw-diversity-page__title").text(), "Diversity & inclusion");
  assert.equal(es(".page__ttl").length, 0);
  assert.deepEqual(es(".page__sidebar > img").map((_, element) => es(element).attr("src")).get(), [
    "/uploads/diversity-1.png",
    "/uploads/diversity-2.png",
    "/uploads/diversity-3.png",
  ]);

  const css = fs.readFileSync(path.resolve(import.meta.dirname, "../../frontend-mirror/templates/beez3/css/vwb-stability.css"), "utf8");
  assert.match(css, /\.vw-diversity-page__title\s*,\s*\.vw-probono-page__title\s*\{[\s\S]*?var\(--vw-font-editorial\)[\s\S]*?text-transform:\s*none/);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*?\.vw-diversity-page__title\s*,\s*\.vw-probono-page__title\s*\{[\s\S]*?font-size:\s*34px/);
  assert.match(css, /@media \(min-width: 801px\)[\s\S]*?\.vw-diversity-page \.page__sidebar > \.img_probono_1,[\s\S]*?position:\s*static !important/);
});
