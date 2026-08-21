import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as cheerio from "cheerio";

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

test("Nuevas oficinas reutiliza navegación compartida y sólo carga el embed de Google aprobado", async () => {
  const { renderOfficeShowcase } = await import("../mirror/renderOfficeShowcase");
  const { LOCAL_SRI_MANIFEST } = await import("./sriManifest");
  const officeTemplate = `<!doctype html><html><head><title></title><link rel="stylesheet" href="/css/estilos_home.css"></head><body>
    <div><div class="contenedor_header"><img class="logo"></div></div>
    <section class="hero-container"></section>
    <div class="map-column"><iframe class="map-iframe" src="https://example.invalid/embed"></iframe></div>
    <footer class="legacy-office-footer"><img><a class="mb-1"></a></footer>
  </body></html>`;
  const sharedChrome = `<!doctype html><html><body>
    <header class="header header_JS"><div class="header--wrap"><a class="header__logo" href="/"></a><div class="menu_btn_JS">MENÚ</div><div class="header__lang"><a class="header__lang--item" href="/new-offices/">ENG</a></div></div></header>
    <nav class="nav menu_JS"><div class="nav__menu"><div class="nav__menu--holder"></div></div></nav>
  </body></html>`;
  const config: ConfigMap = {
    office_map_embed: entry("https://www.google.com/maps/embed?pb=official"),
    office_map_directions: entry("https://www.google.com/maps/dir/?api=1&destination=official"),
  };

  const html = renderOfficeShowcase(officeTemplate, config, "es", undefined, [], sharedChrome);
  const $ = cheerio.load(html);
  assert.equal($(".contenedor_header").length, 0);
  assert.equal($("body > header.header_JS").length, 1);
  assert.equal($("body > nav.nav.menu_JS").length, 1);
  assert.ok($("header.header_JS").index() < $("nav.nav.menu_JS").index());
  assert.ok($("nav.nav.menu_JS").index() < $(".hero-container").index());
  assert.equal($("iframe.map-iframe").attr("src"), "https://www.google.com/maps/embed?pb=official");
  assert.equal($("iframe.map-iframe").attr("data-vwb-office-map"), "shared");
  assert.match($("iframe.map-iframe").attr("title") || "", /Ubicación de Von Wobeser/);
  assert.ok($("footer").hasClass("footer_fix"));
  const cssVersion = LOCAL_SRI_MANIFEST["/css/estilos_home.css"].replace(/^sha384-/, "").slice(0, 16);
  assert.equal($("link[href*='estilos_home.css']").attr("href"), `/css/estilos_home.css?v=${cssVersion}`);

  const invalid = renderOfficeShowcase(officeTemplate, {
    office_map_embed: entry("https://example.invalid/maps/embed?pb=unsafe"),
  }, "es", undefined, [], sharedChrome);
  assert.doesNotMatch(invalid, /example\.invalid\/maps\/embed/);
  assert.match(invalid, /data-vwb-office-map="unavailable"/);
  const css = readFileSync("frontend-mirror/css/estilos_home.css", "utf8");
  assert.match(css, /\.map-iframe\s*\{[\s\S]*?filter:\s*none/);

  const stabilityCss = readFileSync("frontend-mirror/templates/beez3/css/vwb-stability.css", "utf8");
  assert.match(stabilityCss, /office-showcase--shared-navigation\s*>\s*header\.header_JS[\s\S]*?\.menu_btn_JS::before/);
  assert.match(stabilityCss, /\.menu_btn_JS::after\s*\{[\s\S]*?display:\s*none/);

  const { renderPublicFooter } = await import("../mirror/renderFooter");
  const withSharedFooter = renderPublicFooter(html, config, "es");
  assert.match(withSharedFooter, /data-vwb-footer-preset="central-2026"/);
  assert.doesNotMatch(withSharedFooter, /legacy-office-footer/);
  const withClassicFooter = renderPublicFooter(html, {
    ...config,
    footer_active_preset: entry("classic-vwys"),
  }, "es");
  assert.match(withClassicFooter, /data-vwb-footer-preset="classic-vwys"/);

  const adminOffices = readFileSync("client/src/pages/admin/AdminOffices.tsx", "utf8");
  assert.match(adminOffices, /Navegación y pie compartidos/);
  assert.match(adminOffices, /href="\/admin\/navigation"/);
  assert.match(adminOffices, /href="\/admin\/site-config\/footer"/);
  assert.doesNotMatch(adminOffices, /office_footer_logo/);
});
