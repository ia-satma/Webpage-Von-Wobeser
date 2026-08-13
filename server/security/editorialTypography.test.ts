import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  PUBLIC_TYPOGRAPHY_FIELDS,
  TYPOGRAPHY_FAMILIES,
  defaultTypographyRole,
  isPublicTypographyField,
  isTypographyFamily,
} from "@shared/editorialTypography";
import { renderSingle } from "../mirror/renderSingle";

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");

test("el inventario central cubre contenido público y limita las familias institucionales", () => {
  assert.deepEqual(TYPOGRAPHY_FAMILIES, ["auto", "gelasio", "inter"]);
  assert.ok(PUBLIC_TYPOGRAPHY_FIELDS.length >= 60);
  assert.ok(isPublicTypographyField("practice_group", "descriptionEs"));
  assert.ok(isPublicTypographyField("team_member", "bioIntro"));
  assert.ok(isPublicTypographyField("news", "content"));
  assert.equal(isPublicTypographyField("news", "slug"), false);
  assert.equal(isPublicTypographyField("team_member", "email"), false);
  assert.equal(isTypographyFamily("Gelasio"), false);
  assert.equal(defaultTypographyRole("practice_group", "description"), "editorial");
  assert.equal(defaultTypographyRole("practice_group", "fullDescription"), "body");
});

test("el render público aplica sólo una elección explícita y auto conserva el HTML legado", () => {
  const template = read("frontend-mirror/index.php/practice/p-5.html");
  const group = {
    id: "practice-1", slug: "arbitration", name: "Arbitration", nameEs: "Arbitraje",
    description: "<p>Introduction</p>", descriptionEs: "<p>Introducción</p>",
    fullDescription: "<p>Body</p>", fullDescriptionEs: "<p>Cuerpo</p>",
  };
  const auto = renderSingle(template, group, [], "practice", "en");
  const explicit = renderSingle(template, group, [], "practice", "en", {
    "description:en": "inter", "fullDescription:en": "gelasio",
  });
  assert.doesNotMatch(auto, /single__content--intro" data-vw-font/);
  assert.match(explicit, /single__content--intro" data-vw-font="inter"/);
  assert.match(explicit, /single__content--txt" data-vw-font="gelasio"/);
});

test("el panel y la API no permiten CSS o fuentes libres", () => {
  const editor = read("client/src/components/admin/RichTextEditor.tsx");
  const routes = read("server/routes.ts");
  const css = read("frontend-mirror/templates/beez3/css/typography.css");
  assert.match(editor, /data-vw-font/);
  assert.match(editor, /Gelasio editorial/);
  assert.match(editor, /Inter de cuerpo/);
  assert.match(editor, /Todo el campo/);
  assert.match(routes, /editorial-typography/);
  assert.match(routes, /isPublicTypographyField/);
  assert.match(css, /\[data-vw-font="gelasio"\]/);
  assert.match(css, /\[data-vw-font="inter"\]/);
  assert.doesNotMatch(editor, /font-family\s*:/i);
});
