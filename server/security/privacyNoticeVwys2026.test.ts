import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as cheerio from "cheerio";
import {
  PRIVACY_NOTICE_VWYS_2026_EN,
  PRIVACY_NOTICE_VWYS_2026_ES,
} from "../content/privacyNoticeVwys2026";
import { renderPage } from "../mirror/renderPage";
import { renderRichText } from "../mirror/sanitize";

const template = `<!doctype html><html><head><title>Privacy</title></head><body>
  <main><div class="page__content--body"><p>Legacy privacy notice.</p></div></main>
</body></html>`;

test("el Aviso VWyS 2026 conserva su contenido ES/EN, contacto y marcador legal", () => {
  for (const [content, requiredHeadings] of [
    [PRIVACY_NOTICE_VWYS_2026_ES, ["RESPONSABLE DEL TRATAMIENTO", "DERECHOS ARCO", "CONTACTO", "Actualizado: agosto de 2026."]],
    [PRIVACY_NOTICE_VWYS_2026_EN, ["DATA CONTROLLER", "ARCO RIGHTS", "CONTACT", "Last updated: August 2026."]],
  ] as const) {
    const safe = renderRichText(content);
    for (const heading of requiredHeadings) assert.match(safe, new RegExp(heading));
    assert.match(safe, /mailto:privacidad@vwys\.com\.mx/);
    assert.match(safe, /\[___\]/);
    assert.doesNotMatch(safe, /<script|\bon\w+\s*=|javascript\s*:/i);
  }
});

test("las rutas de privacidad renderizan el aviso nuevo por idioma", () => {
  const config = {
    page_privacy_body: {
      value: PRIVACY_NOTICE_VWYS_2026_EN,
      valueEs: PRIVACY_NOTICE_VWYS_2026_ES,
      type: "text",
    },
  };
  const es = cheerio.load(renderPage(template, config, "es", { body: "page_privacy_body" }));
  const en = cheerio.load(renderPage(template, config, "en", { body: "page_privacy_body" }));

  assert.equal(es(".page__content--body h2").first().text(), "RESPONSABLE DEL TRATAMIENTO");
  assert.equal(en(".page__content--body h2").first().text(), "DATA CONTROLLER");
  assert.equal(es(".page__content--body").text().includes("Legacy privacy notice."), false);
  assert.equal(en(".page__content--body").text().includes("Legacy privacy notice."), false);
});

test("la actualización es única, conserva respaldo y no permite traducción automática desde Administración", () => {
  const siteConfigSource = readFileSync(new URL("../mirror/siteConfig.ts", import.meta.url), "utf8");
  const registrySource = readFileSync(new URL("../../client/src/features/admin/site-config/registry.ts", import.meta.url), "utf8");
  const fieldControlSource = readFileSync(new URL("../../client/src/features/admin/site-config/SiteConfigFieldControl.tsx", import.meta.url), "utf8");

  assert.match(siteConfigSource, /PRIVACY_NOTICE_VWYS_2026_MIGRATION_KEY/);
  assert.match(siteConfigSource, /PRIVACY_NOTICE_VWYS_2026_PREVIOUS_VERSION_KEY/);
  assert.match(siteConfigSource, /onConflictDoNothing/);
  assert.match(registrySource, /privacidad:[\s\S]*?page_privacy_body[\s\S]*?bilingual: true/);
  assert.match(registrySource, /page_privacy_body[\s\S]*?allowAutoTranslation: false/);
  assert.match(fieldControlSource, /field\.allowAutoTranslation !== false/);
});
