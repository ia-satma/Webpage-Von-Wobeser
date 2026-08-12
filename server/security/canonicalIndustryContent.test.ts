import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import * as cheerio from "cheerio";
import {
  CANONICAL_INDUSTRIES_SNAPSHOT_DATE,
  applyCanonicalIndustryContent,
  canonicalIndustryManifest,
  loadCanonicalIndustryContent,
} from "../content/canonicalIndustries";
import { normalizeMirrorName, parseMirrorMetaName } from "../mirror/practiceIdentity";
import { renderSingle } from "../mirror/renderSingle";
import { renderRichText } from "../mirror/sanitize";

const mirrorDir = path.resolve(process.cwd(), "frontend-mirror");
const typographyCss = fs.readFileSync(
  path.join(mirrorDir, "templates", "beez3", "css", "typography.css"),
  "utf8",
);
const adminIndustrySource = fs.readFileSync(
  path.resolve(process.cwd(), "client", "src", "pages", "admin", "AdminIndustryGroups.tsx"),
  "utf8",
);

test("el snapshot canónico contiene las 7 industrias oficiales bilingües y contenido seguro", () => {
  const industries = loadCanonicalIndustryContent(mirrorDir);

  assert.equal(CANONICAL_INDUSTRIES_SNAPSHOT_DATE, "2026-08-12");
  assert.equal(canonicalIndustryManifest.length, 7);
  assert.equal(industries.length, 7);
  assert.equal(new Set(industries.map((industry) => industry.slug)).size, 7);

  for (const industry of industries) {
    for (const field of [
      industry.name,
      industry.nameEs,
      industry.description,
      industry.descriptionEs,
      industry.fullDescription,
      industry.fullDescriptionEs,
    ]) {
      assert.notEqual(field.trim(), "", `${industry.slug} must have complete content`);
      assert.doesNotMatch(field, /<\/?(?:script|iframe|object|embed)\b|\bon\w+\s*=|\bjavascript\s*:/i);
      assert.doesNotMatch(renderRichText(field), /<script|\bon\w+\s*=|javascript\s*:/i);
    }
    for (const field of [industry.fullDescription, industry.fullDescriptionEs]) {
      assert.match(field, /^<p>/, `${industry.slug} must start with a semantic paragraph`);
      assert.doesNotMatch(field, /<br\s*\/?>|<span\b[^>]*style=/i, `${industry.slug} must not retain legacy layout markup`);
      assert.ok((field.match(/<p>/g) || []).length >= 2, `${industry.slug} must retain paragraph rhythm`);
      assert.ok(field.length <= 5_000, `${industry.slug} body must fit the CMS editor`);
    }
    assert.ok(industry.description.length <= 500, `${industry.slug} EN introduction must fit the CMS editor`);
    assert.ok(industry.descriptionEs.length <= 500, `${industry.slug} ES introduction must fit the CMS editor`);
  }
});

test("Industrias dinámicas reserva Gelasio para el destacado e Inter para el cuerpo", () => {
  assert.match(typographyCss, /data-vw-content-kind="industry"/);
  assert.match(typographyCss, /single__content--intro[\s\S]*?font-family:\s*var\(--vw-font-editorial\)\s*!important/);
  assert.match(typographyCss, /single__content--txt[\s\S]*?font-family:\s*var\(--vw-font-body\)\s*!important/);
  assert.match(typographyCss, /single__content--txt p \+ p\s*\{[\s\S]*?margin-top:\s*1\.35em/);
});

test("los 7 IDs históricos de industria conservan el slug público correcto", () => {
  const byName = new Map(
    canonicalIndustryManifest.map((industry) => [normalizeMirrorName(industry.name), industry.slug]),
  );

  for (const industry of canonicalIndustryManifest) {
    const source = path.join(mirrorDir, "index.php", "industry", `p-${industry.legacyId}.html`);
    const title = parseMirrorMetaName(fs.readFileSync(source, "utf8"));
    assert.equal(byName.get(normalizeMirrorName(title)), industry.slug, `p-${industry.legacyId}`);
  }
});

test("la semilla conserva metadata visual y recibe únicamente los campos editoriales canónicos", () => {
  const seedInput = canonicalIndustryManifest.map((industry, index) => ({
    slug: industry.slug,
    name: "legacy name",
    nameEs: "nombre anterior",
    description: "legacy description",
    descriptionEs: "descripción anterior",
    fullDescription: "legacy body",
    fullDescriptionEs: "cuerpo anterior",
    iconName: "seed-icon",
    order: index + 1,
  }));
  const seeded = applyCanonicalIndustryContent(seedInput);
  const canonical = loadCanonicalIndustryContent(mirrorDir);

  for (const expected of canonical) {
    const actual = seeded.find((industry) => industry.slug === expected.slug)!;
    assert.equal(actual.name, expected.name);
    assert.equal(actual.nameEs, expected.nameEs);
    assert.equal(actual.fullDescription, expected.fullDescription);
    assert.equal(actual.fullDescriptionEs, expected.fullDescriptionEs);
    assert.equal(actual.iconName, "seed-icon");
    assert.equal("legacyId" in actual, false);
    assert.equal("contentSha256" in actual, false);
  }
});

test("el render dinámico de Industrias mantiene introducción y cuerpo separados", () => {
  const template = fs.readFileSync(
    path.join(mirrorDir, "index.php", "industry", "p-16.html"),
    "utf8",
  );
  const html = renderSingle(template, {
    slug: "automotive-mobility-manufacturing",
    name: "Automotive, Mobility & Manufacturing",
    nameEs: "Automotriz, Movilidad y Manufactura",
    description: "<p>Introduction</p>",
    descriptionEs: "<p>Introducción</p>",
    fullDescription: "<p>Body</p>",
    fullDescriptionEs: "<p>Cuerpo</p>",
  }, [], "industry", "en");
  const $ = cheerio.load(html);

  assert.equal($(".single").attr("data-vw-content-kind"), "industry");
  assert.equal($(".single__content--intro").html(), "<p>Introduction</p>");
  assert.equal($(".single__content--txt").html(), "<p>Body</p>");
  assert.doesNotMatch(html, /txt_separado/);
});

test("el panel de Industrias expone edición enriquecida y guía de párrafos en ambos idiomas", () => {
  for (const field of [
    "input-description-en",
    "input-description-es",
    "input-full-description-en",
    "input-full-description-es",
  ]) {
    assert.match(adminIndustrySource, new RegExp(`data-testid="${field}"`));
  }
  assert.match(adminIndustrySource, /Presiona Enter para iniciar un párrafo nuevo/);
  assert.match(adminIndustrySource, /negritas, cursivas y listas se conservan al publicar/);
});

test("la migración de Industrias usa parámetros y actualiza las 7 filas editoriales", async () => {
  const migration = await import("../../migrations/20260812_0002_canonical_industry_content.mjs");
  const calls: Array<{ sql: string; values: unknown[] }> = [];

  await migration.default({
    query: async (sql: string, values: unknown[]) => { calls.push({ sql, values }); },
  });

  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /UPDATE industry_groups AS target/i);
  assert.match(calls[0].sql, /full_description_es = source\.full_description_es/i);
  assert.equal(calls[0].values.length, 7 * 7);
  assert.deepEqual(
    calls[0].values.filter((_, index) => index % 7 === 0).sort(),
    canonicalIndustryManifest.map((industry) => industry.slug).sort(),
  );
});
