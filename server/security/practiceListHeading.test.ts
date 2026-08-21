import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import { renderGroupList } from "../mirror/renderGroupList";

const root = path.resolve(import.meta.dirname, "../..");
const template = `<!doctype html><html><head></head><body>
  <section class="page practices"><div class="page--wrap wrap">
    <div class="capabilities__meta wide"><div class="page__ttl"><div class="page__ttl--holder"><span>LEGACY</span></div></div>
      <div class="page__content"><div class="page__content--body"></div></div>
    </div><div class="capabilities__slider narrow"></div>
  </div></section>
</body></html>`;
const items = [{ slug: "arbitration", name: "Arbitration", nameEs: "Arbitraje" }];
const meta = {
  path: "/capacidades/practicas",
  title: "Prácticas | Von Wobeser y Sierra",
  description: "Listado de prácticas.",
  crumbLabel: "Prácticas",
};

test("el listado de Prácticas usa la cabecera editorial bilingüe y no conserva el título lateral heredado", () => {
  const es = cheerio.load(renderGroupList(template, items, "/practice/", "es", meta, {
    page_practices_eyebrow: { value: "Practices", valueEs: "Prácticas", type: "text" },
    page_practices_title: { value: "Our practices", valueEs: "Nuestras prácticas", type: "text" },
    page_practices_description: { value: "Explore", valueEs: "Conoce nuestras áreas.", type: "text" },
  }));
  const en = cheerio.load(renderGroupList(template, items, "/practice/", "en", { ...meta, path: "/capabilities/practices" }));

  assert.equal(es(".vw-practice-list-page").length, 1);
  assert.equal(es(".vw-practice-list-page__eyebrow").text(), "Prácticas");
  assert.equal(es("h1.vw-practice-list-page__title").text(), "Nuestras prácticas");
  assert.equal(es(".vw-practice-list-page__lede").text(), "Conoce nuestras áreas.");
  assert.equal(es(".capabilities__meta .page__ttl").length, 0);
  assert.equal(en(".vw-practice-list-page__eyebrow").text(), "Practices");
  assert.equal(en("h1.vw-practice-list-page__title").text(), "Our practices");
  assert.match(en(".vw-practice-list-page__title").text(), /^[A-Z][^A-Z]*$/);
});

test("el listado de Industrias usa la misma jerarquía editorial y conserva sus enlaces", () => {
  const es = cheerio.load(renderGroupList(template, [{ slug: "automotive", name: "Automotive", nameEs: "Automotriz" }], "/industry/", "es", {
    ...meta,
    path: "/capacidades/industrias",
    title: "Industrias | Von Wobeser y Sierra",
    crumbLabel: "Industrias",
  }, {
    page_industries_eyebrow: { value: "Industries", valueEs: "Industrias", type: "text" },
    page_industries_title: { value: "Our industries", valueEs: "Nuestras industrias", type: "text" },
    page_industries_description: { value: "Explore our sectors.", valueEs: "Conoce nuestros sectores.", type: "text" },
  }));

  assert.equal(es(".vw-industry-list-page").length, 1);
  assert.equal(es(".vw-industry-list-page__eyebrow").text(), "Industrias");
  assert.equal(es("h1.vw-industry-list-page__title").text(), "Nuestras industrias");
  assert.equal(es(".vw-industry-list-page__lede").text(), "Conoce nuestros sectores.");
  assert.equal(es(".capabilities__meta .page__ttl").length, 0);
  assert.equal(es(".page__content--item").attr("href"), "/industry/automotive");
});

test("las cabeceras de Prácticas e Industrias conservan las tipografías institucionales y escalan en móvil", () => {
  const css = fs.readFileSync(path.join(root, "frontend-mirror/templates/beez3/css/vwb-stability.css"), "utf8");
  assert.match(css, /\.vw-practice-list-page__title,\s*\.vw-industry-list-page__title\s*\{[\s\S]*?var\(--vw-font-editorial\)[\s\S]*?text-transform:\s*none/);
  assert.match(css, /\.vw-practice-list-page__eyebrow,\s*\.vw-industry-list-page__eyebrow\s*\{[\s\S]*?var\(--vw-font-ui\)/);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*?\.vw-practice-list-page__title,\s*\.vw-industry-list-page__title\s*\{[\s\S]*?font-size:\s*34px/);
  assert.match(css, /@media \(min-width: 981px\)[\s\S]*?\.vw-industry-list-page \.capabilities__meta\s*\{[\s\S]*?margin:\s*0/);
  assert.match(css, /\.vw-practice-list-page \.page__content--item\s*\{[\s\S]*?font-size:\s*clamp\(22px,\s*1\.55vw,\s*24px\)/);
  assert.match(css, /\.vw-industry-list-page \.page__content--item\s*\{[\s\S]*?font-size:\s*clamp\(22px/);
  assert.match(css, /@media \(max-width: 980px\)[\s\S]*?\.vw-industry-list-page \.capabilities__slider\s*\{[\s\S]*?height:\s*auto/);
  assert.match(css, /\.vw-industry-list-page \.capabilities__slide--img\s*\{[\s\S]*?aspect-ratio:\s*4\s*\/\s*3[\s\S]*?transform:\s*none[\s\S]*?width:\s*100%/);
});
