import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as cheerio from "cheerio";
import {
  TALENT_PRIVACY_NOTICE_CANDIDATES_2026_ES,
  TALENT_PRIVACY_NOTICE_CANDIDATES_2026_SOURCE,
} from "../content/talentPrivacyNoticeCandidates2026";
import {
  renderTalentPrivacyNotice,
  TALENT_PRIVACY_NOTICE_PATH,
  TALENT_PRIVACY_NOTICE_TITLE,
} from "../mirror/renderTalentPrivacyNotice";
import { applyCareersFormFix } from "../mirror/formsFix";
import { renderRichText } from "../mirror/sanitize";

const { default: updateCareersTalentCopy } = await import(
  new URL("../../migrations/20260829_0012_update_careers_talent_copy.mjs", import.meta.url).href,
);
const { default: unaccentCareersPageTitle } = await import(
  new URL("../../migrations/20260831_0001_unaccent_careers_page_title.mjs", import.meta.url).href,
);

const noticeTemplate = `<!doctype html><html lang="es"><head><title>Anterior</title></head><body>
  <section class="page"><div class="page__ttl--holder"><span>Anterior</span></div><div class="page__content--body"><p>Texto anterior.</p></div></section>
</body></html>`;

function careersFormTemplate(): string {
  return `<!doctype html><html><head></head><body><section class="page careers"><form id="careersForm" action="">
    <input type="hidden" name="legacy_cms_token" value="1">
    <label class="careers__form--label"><input name="name"></label>
    <label class="careers__form--label"><input name="l_name"></label>
    <label class="careers__form--label"><input name="mail"></label>
    <label class="careers__form--label"><input name="tel"></label>
    <label class="careers__form--label">Dirección<input name="comment"></label>
    <label class="careers__form--button"><span>Adjuntar</span><input name="uploaded_file" type="file"></label>
    <label class="careers__form--label checkbox"><input name="accept" type="checkbox"><span>Aviso de privacidad anterior</span></label>
    <input id="filename"><label class="careers__form--label submit"><input type="submit"></label><p>Ayuda</p><img class="loader">
  </form></section></body></html>`;
}

test("el Aviso de Candidaturas conserva el documento legal, sus secciones y contacto", () => {
  const safe = renderRichText(TALENT_PRIVACY_NOTICE_CANDIDATES_2026_ES);
  for (const heading of [
    "1. RESPONSABLE DEL TRATAMIENTO",
    "2. DATOS PERSONALES TRATADOS",
    "3. FINALIDADES DEL TRATAMIENTO",
    "7. DERECHOS ARCO",
    "12. CONTACTO",
    "13. CONSENTIMIENTO PARA EL TRATAMIENTO DE SUS DATOS PERSONALES",
  ]) assert.match(safe, new RegExp(heading));
  assert.match(safe, /CURP/);
  assert.match(safe, /mailto:privacidad@vwys\.com\.mx/);
  assert.match(safe, /Diego Martínez/);
  assert.match(safe, /\[___\]/);
  assert.match(TALENT_PRIVACY_NOTICE_CANDIDATES_2026_SOURCE, /Formularios candidatos\.docx/);
  assert.doesNotMatch(safe, /<script|\bon\w+\s*=|javascript\s*:/i);
});

test("la página pública de Candidaturas es independiente, editable y conserva su SEO", () => {
  const html = renderTalentPrivacyNotice(noticeTemplate, {
    page_talent_privacy_body: {
      value: "<h2>Texto vigente administrado</h2><p>Contenido de prueba.</p>",
      valueEs: "<p>Respaldo que no debe prevalecer.</p>",
      type: "text",
    },
  });
  const $ = cheerio.load(html);

  assert.equal($("html").attr("lang"), "es-mx");
  assert.equal($("body").hasClass("vwb-talent-privacy-notice"), true);
  assert.equal($(".page__ttl--holder").text(), TALENT_PRIVACY_NOTICE_TITLE);
  assert.equal($(".page__content--body h2").text(), "Texto vigente administrado");
  assert.equal($(".page__content--body").text().includes("Texto anterior."), false);
  assert.equal($(".page__content--body").text().includes("Respaldo que no debe prevalecer."), false);
  assert.match(html, new RegExp(`canonical[^>]+${TALENT_PRIVACY_NOTICE_PATH}`));
  assert.equal($('link[rel="alternate"][hreflang="en"]').length, 0);
});

test("todos los formularios de Talento enlazan el aviso exclusivo, sin alterar su endpoint", () => {
  for (const [lang, linkText, uploadText] of [
    ["es", "Aviso de Privacidad", "Adjunta tu hoja de vida"],
    ["en", "Privacy Notice", "Attach your résumé"],
  ] as const) {
    const $ = cheerio.load(careersFormTemplate());
    applyCareersFormFix($, lang);
    const $form = $("#careersForm");
    const $link = $form.find('[data-vw-privacy-notice="talent-candidates"] a');

    assert.equal($form.attr("action"), "/api/career-applications");
    assert.equal($link.attr("href"), TALENT_PRIVACY_NOTICE_PATH);
    assert.equal($link.attr("target"), "_blank");
    assert.equal($link.attr("rel"), "noopener noreferrer");
    assert.equal($link.attr("hreflang"), "es");
    assert.equal($link.text(), linkText);
    assert.equal($form.find('[name="accept"]').attr("required"), "required");
    assert.equal($form.find('input[type="hidden"]').length, 0);
    assert.equal($form.find('[name="comment"]').length, 0);
    assert.equal($form.find('[name="uploaded_file"]').attr("required"), "required");
    assert.equal($form.find(".vw-careers-form__upload span").first().text(), uploadText);
  }
});

test("las cuatro plantillas de Talento no conservan Dirección y usan la etiqueta de carga vigente", () => {
  for (const [path, uploadText] of [
    ["../../frontend-mirror/index.php/bolsa-de-trabajo/index.html", "Adjunta tu hoja de vida"],
    ["../../frontend-mirror/index.php/bolsa-de-trabajo/pasantes/index.html", "Adjunta tu hoja de vida"],
    ["../../frontend-mirror/index.php/careers/index.html", "Attach your résumé"],
    ["../../frontend-mirror/index.php/careers/interns/index.html", "Attach your résumé"],
  ] as const) {
    const html = readFileSync(new URL(path, import.meta.url), "utf8");
    assert.doesNotMatch(html, /name="comment"/);
    assert.match(html, new RegExp(`<span>${uploadText}</span>`));
  }
});

test("la migración de Carrera corrige sólo la frase heredada y preserva el resto del copy", async () => {
  const saved = {
    key: "page_careers_body",
    value: "<p>English copy kept intact; retaining talented lawyers helps the firm.</p>",
    value_es: "<p>Texto español intacto; crear, formar y retener abogados talentosos.</p>",
  };
  const client = {
    query: async (sql: string, values?: string[]) => {
      if (sql.includes("SELECT key, value, value_es")) return { rowCount: 1, rows: [{ ...saved }] };
      if (sql.includes("UPDATE site_config")) {
        saved.value = values?.[0] ?? saved.value;
        saved.value_es = values?.[1] ?? saved.value_es;
        return { rowCount: 1, rows: [{ ...saved }] };
      }
      throw new Error(`Unexpected query: ${sql}`);
    },
  };

  await updateCareersTalentCopy(client);

  assert.match(saved.value, /English copy kept intact/);
  assert.match(saved.value, /retaining the best talent/);
  assert.match(saved.value_es, /Texto español intacto/);
  assert.match(saved.value_es, /retener el mejor talento/);
});

test("el título de Carrera retira sólo la tilde solicitada y conserva el inglés administrativo", async () => {
  const saved = {
    key: "page_careers_title",
    value: "Your career at Von Wobeser y Sierra",
    value_es: "Tú carrera en Von Wobeser y Sierra",
  };
  const client = {
    query: async (sql: string, values?: string[]) => {
      if (sql.includes("SELECT key, value_es")) return { rowCount: 1, rows: [{ ...saved }] };
      if (sql.includes("UPDATE site_config")) {
        saved.value_es = values?.[0] ?? saved.value_es;
        return { rowCount: 1, rows: [{ key: saved.key, value_es: saved.value_es }] };
      }
      throw new Error(`Unexpected query: ${sql}`);
    },
  };

  await unaccentCareersPageTitle(client);
  await unaccentCareersPageTitle(client);

  assert.equal(saved.value, "Your career at Von Wobeser y Sierra");
  assert.equal(saved.value_es, "Tu carrera en Von Wobeser y Sierra");
});

test("Administración registra, edita de forma segura y no traduce automáticamente el aviso de Candidaturas", () => {
  const siteConfigSource = readFileSync(new URL("../mirror/siteConfig.ts", import.meta.url), "utf8");
  const registrySource = readFileSync(new URL("../../client/src/features/admin/site-config/registry.ts", import.meta.url), "utf8");
  const fieldControlSource = readFileSync(new URL("../../client/src/features/admin/site-config/SiteConfigFieldControl.tsx", import.meta.url), "utf8");
  const adminRoutesSource = readFileSync(new URL("../mirror/routes/adminRoutes.ts", import.meta.url), "utf8");

  assert.match(siteConfigSource, /page_talent_privacy_body[\s\S]*?category: "pages"/);
  assert.match(siteConfigSource, /RICH_TEXT_CONFIG_KEYS[\s\S]*?DEFAULTS\.filter/);
  assert.match(registrySource, /page_talent_privacy_body[\s\S]*?Aviso de Privacidad para Candidaturas/);
  assert.match(registrySource, /page_talent_privacy_body[\s\S]*?allowAutoTranslation: false/);
  assert.match(fieldControlSource, /field\.allowAutoTranslation !== false/);
  assert.match(adminRoutesSource, /isRichTextConfigKey\(req\.params\.key\)[\s\S]*?sanitizeCms/);
  assert.doesNotMatch(renderRichText('<script>alert(1)</script><p>Contenido seguro</p>'), /script|alert\(1\)/i);
});
