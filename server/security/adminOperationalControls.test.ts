import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as cheerio from "cheerio";

process.env.DATABASE_URL ||= "postgresql://test:test@127.0.0.1:5432/test";

const { renderHome } = await import("../mirror/renderHome");

const homeTemplate = `<!doctype html><html lang="es"><head><title>Home</title></head><body>
  <div class="home__hero"><a href="/practice/arbitration"><video id="video_header"></video></a></div>
  <div class="covid_cont"><div class="covid_title"><h2><span>Noticias</span></h2></div><div class="covid_headlines"></div></div>
  <section class="home__desk"><p>Desk heredado</p></section>
</body></html>`;

const news = Array.from({ length: 20 }, (_, index) => ({
  slug: `noticia-${index + 1}`,
  title: `News ${index + 1}`,
  titleEs: `Noticia ${index + 1}`,
}));

test("el Home muestra cinco páginas por defecto y respeta el rango administrable", () => {
  const defaultHtml = renderHome(homeTemplate, news, {}, "es");
  assert.equal(cheerio.load(defaultHtml)("[data-vw-news-slide]").length, 5);

  const onePage = renderHome(homeTemplate, news, {
    home_news_pages: { value: "1", valueEs: "1", type: "number" },
  }, "es");
  assert.equal(cheerio.load(onePage)("[data-vw-news-slide]").length, 1);

  const tenPages = renderHome(homeTemplate, news, {
    home_news_pages: { value: "10", valueEs: "10", type: "number" },
  }, "en");
  assert.equal(cheerio.load(tenPages)("[data-vw-news-slide]").length, 10);

  const clamped = renderHome(homeTemplate, news, {
    home_news_pages: { value: "999", valueEs: "999", type: "number" },
  }, "es");
  assert.equal(cheerio.load(clamped)("[data-vw-news-slide]").length, 10);
});

test("Newsletter oculta solo la etiqueta vacía y permite restaurarla desde configuración", () => {
  const hiddenHtml = renderHome(homeTemplate, [], {}, "es");
  const $hidden = cheerio.load(hiddenHtml);
  assert.equal($hidden(".home__newsletter").length, 1);
  assert.equal($hidden(".home__newsletter--eyebrow").length, 0);
  assert.match($hidden(".home__newsletter h2").text(), /Manténgase informado/);
  assert.equal($hidden("#newsletter-privacy").attr("required"), "required");
  assert.match(hiddenHtml, /font-size:1rem/);
  assert.match(hiddenHtml, /text-decoration-thickness:2px/);

  const legacyHtml = renderHome(homeTemplate, [], {
    newsletter_eyebrow: { value: "Newsletter", valueEs: "Newsletter", type: "text" },
  }, "es");
  assert.equal(cheerio.load(legacyHtml)(".home__newsletter--eyebrow").length, 0);

  const restoredHtml = renderHome(homeTemplate, [], {
    newsletter_eyebrow: { value: "Updates", valueEs: "Novedades", type: "text" },
  }, "es");
  assert.equal(cheerio.load(restoredHtml)(".home__newsletter--eyebrow").text(), "Novedades");

  const unsafePathHtml = renderHome(homeTemplate, [], {
    newsletter_privacy_path: { value: "javascript:alert(1)", valueEs: "javascript:alert(1)", type: "url" },
  }, "es");
  assert.equal(cheerio.load(unsafePathHtml)(".home__newsletter--privacy a").attr("href"), "/aviso");
});

test("el registro de accesos resuelve identidad sin exponer hashes como correo", () => {
  const storageSource = readFileSync(new URL("../storage.ts", import.meta.url), "utf8");
  const routesSource = readFileSync(new URL("../routes.ts", import.meta.url), "utf8");
  const adminSource = readFileSync(
    new URL("../../client/src/pages/admin/AdminUsers.tsx", import.meta.url),
    "utf8",
  );

  assert.match(storageSource, /leftJoin\(adminUsers,\s*eq\(adminLoginEvents\.userId,\s*adminUsers\.id\)\)/);
  assert.match(storageSource, /userEmail:\s*adminUsers\.email/);
  assert.match(storageSource, /username:\s*adminUsers\.username/);
  assert.match(storageSource, /userRole:\s*adminUsers\.role/);
  assert.match(
    routesSource,
    /"\/api\/admin\/login-log",\s*authMiddleware,\s*requireRole\("super_admin",\s*"admin"\)/,
  );
  assert.match(adminSource, /Usuario no reconocido/);
  assert.match(adminSource, /Usuario eliminado/);
  assert.match(adminSource, /Origen protegido/);
});

test("servidor y panel validan de una a diez páginas de noticias", () => {
  const serverSource = readFileSync(new URL("../mirror/index.ts", import.meta.url), "utf8");
  const adminSource = readFileSync(
    new URL("../../client/src/pages/admin/AdminSiteConfig.tsx", import.meta.url),
    "utf8",
  );

  assert.match(serverSource, /req\.params\.key === "home_news_pages"/);
  assert.match(serverSource, /z\.coerce\.number\(\)\.int\(\)\.min\(1\)\.max\(10\)/);
  assert.match(adminSource, /key:\s*"home_news_pages"[\s\S]*min:\s*1,\s*max:\s*10/);
});
