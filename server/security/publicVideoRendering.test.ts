import assert from "node:assert/strict";
import test from "node:test";

import type { ConfigMap } from "../mirror/siteConfig";

process.env.DATABASE_URL ||= "postgresql://test:test@localhost:5432/test";

const entry = (value: string, valueEs = value) => ({ value, valueEs, type: "url" });

test("la Firma usa una fachada segura para YouTube y conserva archivos locales como video", async () => {
  const { renderFirmLanding } = await import("../mirror/renderFirmLanding");
  const template = "<!doctype html><html><head><title></title></head><body><div class=page></div></body></html>";
  const youtubeConfig: ConfigMap = {
    firm_landing_hero_video: entry("https://youtu.be/dQw4w9WgXcQ"),
    firm_landing_hero_image: entry("/images/poster.webp"),
  };
  const youtubeHtml = renderFirmLanding(template, youtubeConfig, "es");
  assert.match(youtubeHtml, /class="vw-firm__video-facade"/);
  assert.match(youtubeHtml, /https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);
  assert.doesNotMatch(youtubeHtml, /<source src="https:\/\/www\.youtube/);

  const fileHtml = renderFirmLanding(template, {
    firm_landing_hero_video: entry("/images/firm.mp4"),
  }, "en");
  assert.match(fileHtml, /<source src="\/images\/firm\.mp4"/);
  assert.doesNotMatch(fileHtml, /<button class="vw-firm__video-facade"/);
});

test("Nuevas oficinas distingue archivos, YouTube y Vimeo sin inyectar URLs arbitrarias", async () => {
  const { renderOfficeShowcase } = await import("../mirror/renderOfficeShowcase");
  const thumbnails = Array.from({ length: 6 }, () => '<div class="video-thumb"><img></div>').join("");
  const template = `<!doctype html><html><head><title></title><link href="/css/estilos_home.css"><script src="/js/funciones_animaciones.js"></script></head><body>
    <div class="video-main"><video id="videoPrincipal"><source></video></div>${thumbnails}<footer><img></footer>
  </body></html>`;
  const config: ConfigMap = {
    office_video_1: entry("https://vimeo.com/76979871"),
    office_video_2: entry("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    office_video_3: entry("/img/videos/tour.mp4"),
  };

  const html = renderOfficeShowcase(template, config, "es", undefined, []);
  assert.match(html, /id="videoPrincipalEmbed"[^>]+src="https:\/\/player\.vimeo\.com\/video\/76979871/);
  assert.match(html, /data-embed="https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);
  assert.match(html, /data-video="\/img\/videos\/tour\.mp4"/);
  assert.doesNotMatch(html, /<source[^>]+(?:youtube|vimeo)/i);
  assert.match(html, /sandbox="allow-scripts allow-same-origin allow-presentation"/);
});
