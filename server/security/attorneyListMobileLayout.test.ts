import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as cheerio from "cheerio";

process.env.DATABASE_URL ||= "postgresql://test:test@127.0.0.1:5432/test";

const { renderAttorneyList } = await import("../mirror/renderAttorneyList");

test("listado histórico de Abogados apila foto, nombre y cargo sin superposición en móvil", () => {
  const styles = readFileSync(new URL("../../frontend-mirror/templates/beez3/css/vwb-stability.css", import.meta.url), "utf8");
  const template = `<!doctype html><html><head></head><body><main>
    <div class="attorneys__meta"></div><div class="attorneys__list"></div>
  </main></body></html>`;
  const html = renderAttorneyList(template, [{
    id: "partner-1",
    slug: "luis-miguel-jimenez",
    name: "Luis Miguel Jiménez",
    title: "Partner",
    titleEs: "Socio",
    imageUrl: "/images/luis.jpg",
    phone: "",
    email: "",
  }], "partners", "es");
  const $ = cheerio.load(html);

  assert.equal($(".attorneys__list--item .img").length, 1);
  assert.equal($(".attorneys__list--item .name").text(), "Luis Miguel Jiménez");
  assert.equal($(".attorneys__list--item .role").text(), "Socio");
  assert.match(styles, /@media \(max-width: 980px\)[\s\S]*?\.attorneys__list--item\s*\{[\s\S]*?display:\s*grid\s*!important;[\s\S]*?grid-template-columns:\s*clamp\(100px, 19vw, 160px\) minmax\(0, 1fr\)/);
  assert.match(styles, /\.attorneys__list--item \.name\s*\{[\s\S]*?position:\s*static\s*!important;[\s\S]*?grid-column:\s*2/);
  assert.match(styles, /\.attorneys__list--item \.role\s*\{[\s\S]*?position:\s*static\s*!important;[\s\S]*?grid-column:\s*2[\s\S]*?margin:\s*0\s*!important;/);
});

test("buscador de Abogados conserva cargos legibles en móvil", () => {
  const styles = readFileSync(new URL("../../frontend-mirror/templates/beez3/css/vwb-stability.css", import.meta.url), "utf8");

  assert.match(styles, /@media \(max-width: 640px\)[\s\S]*?\.attorney-directory__role\s*\{[\s\S]*?font-size:\s*clamp\(12px, 3\.1vw, 14px\);[\s\S]*?letter-spacing:\s*clamp\(2\.25px, 0\.8vw, 4px\);/);
});
