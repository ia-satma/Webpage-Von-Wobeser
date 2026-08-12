import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import * as cheerio from "cheerio";
import {
  CANONICAL_PRACTICES_SNAPSHOT_DATE,
  applyCanonicalPracticeContent,
  canonicalPracticeManifest,
  loadCanonicalPracticeContent,
} from "../content/canonicalPractices";
import {
  normalizeMirrorName,
  parseMirrorMetaName,
  resolvePracticeSlug,
} from "../mirror/practiceIdentity";
import { renderSingle } from "../mirror/renderSingle";
import { renderRichText } from "../mirror/sanitize";
import { practiceContentLimits } from "../../shared/contentLimits";

const mirrorDir = path.resolve(process.cwd(), "frontend-mirror");
const typographyCss = fs.readFileSync(
  path.join(mirrorDir, "templates", "beez3", "css", "typography.css"),
  "utf8",
);

test("el snapshot canónico contiene las 18 prácticas oficiales bilingües y contenido seguro", () => {
  const practices = loadCanonicalPracticeContent(mirrorDir);

  assert.equal(CANONICAL_PRACTICES_SNAPSHOT_DATE, "2026-08-12");
  assert.equal(canonicalPracticeManifest.length, 18);
  assert.equal(practices.length, 18);
  assert.equal(new Set(practices.map((practice) => practice.slug)).size, 18);

  for (const practice of practices) {
    for (const field of [
      practice.name,
      practice.nameEs,
      practice.description,
      practice.descriptionEs,
      practice.fullDescription,
      practice.fullDescriptionEs,
    ]) {
      assert.notEqual(field.trim(), "", `${practice.slug} must have complete content`);
      assert.doesNotMatch(field, /<\/?(?:script|iframe|object|embed)\b|\bon\w+\s*=|\bjavascript\s*:/i);
      assert.doesNotMatch(renderRichText(field), /<script|\bon\w+\s*=|javascript\s*:/i);
    }
    assert.ok(practice.description.length <= practiceContentLimits.introduction, `${practice.slug} EN introduction must fit the CMS editor`);
    assert.ok(practice.descriptionEs.length <= practiceContentLimits.introduction, `${practice.slug} ES introduction must fit the CMS editor`);
    assert.ok(practice.fullDescription.length <= practiceContentLimits.body, `${practice.slug} EN body must fit the CMS editor`);
    assert.ok(practice.fullDescriptionEs.length <= practiceContentLimits.body, `${practice.slug} ES body must fit the CMS editor`);
    for (const field of [practice.fullDescription, practice.fullDescriptionEs]) {
      assert.match(field, /^<p>/, `${practice.slug} must start with a semantic paragraph`);
      assert.doesNotMatch(field, /<br\s*\/?>|<span\b[^>]*style=/i, `${practice.slug} must not retain legacy layout markup`);
      assert.ok((field.match(/<p>/g) || []).length >= 2, `${practice.slug} must retain paragraph rhythm`);
    }
  }
});

test("Arbitraje y Litigio ya no separan incorrectamente la abreviatura S.C.", () => {
  const practices = loadCanonicalPracticeContent(mirrorDir);
  for (const slug of ["arbitration", "litigation"]) {
    const practice = practices.find((candidate) => candidate.slug === slug)!;
    assert.match(practice.description, /S\.C\./);
    assert.doesNotMatch(practice.fullDescription, /^<p>C\./);
    assert.match(practice.descriptionEs, /S\.C\./);
    assert.doesNotMatch(practice.fullDescriptionEs, /^<p>C\./);
  }
});

test("Prácticas dinámicas reserva Gelasio para el destacado e Inter para el cuerpo", () => {
  assert.match(typographyCss, /\.single\[data-vw-content-kind="practice"\][\s\S]*?\.single__content--intro[\s\S]*?font-family:\s*var\(--vw-font-editorial\)\s*!important/);
  assert.match(typographyCss, /\.single\[data-vw-content-kind="practice"\][\s\S]*?\.single__content--txt[\s\S]*?font-family:\s*var\(--vw-font-body\)\s*!important/);
  assert.match(typographyCss, /\.single__content--txt p \+ p\s*\{[\s\S]*?margin-top:\s*1\.35em/);
});

test("los 18 IDs históricos de práctica conservan el slug público correcto", () => {
  const byName = new Map(
    canonicalPracticeManifest.map((practice) => [normalizeMirrorName(practice.name), practice.slug]),
  );

  for (const practice of canonicalPracticeManifest) {
    const source = path.join(mirrorDir, "index.php", "practice", `p-${practice.legacyId}.html`);
    const title = parseMirrorMetaName(fs.readFileSync(source, "utf8"));
    assert.equal(resolvePracticeSlug(title, byName), practice.slug, `p-${practice.legacyId}`);
  }
});

test("la semilla conserva su metadata visual y recibe únicamente los campos editoriales canónicos", () => {
  const seedInput = canonicalPracticeManifest.map((practice, index) => ({
    slug: practice.slug,
    name: "legacy name",
    nameEs: "nombre anterior",
    description: "legacy description",
    descriptionEs: "descripción anterior",
    fullDescription: "legacy body",
    fullDescriptionEs: "cuerpo anterior",
    iconName: "seed-icon",
    order: index + 1,
  }));
  const seeded = applyCanonicalPracticeContent(seedInput);
  const canonical = loadCanonicalPracticeContent(mirrorDir);

  for (const expected of canonical) {
    const actual = seeded.find((practice) => practice.slug === expected.slug)!;
    assert.equal(actual.name, expected.name);
    assert.equal(actual.nameEs, expected.nameEs);
    assert.equal(actual.fullDescription, expected.fullDescription);
    assert.equal(actual.fullDescriptionEs, expected.fullDescriptionEs);
    assert.equal(actual.iconName, "seed-icon");
    assert.equal("legacyId" in actual, false);
    assert.equal("contentSha256" in actual, false);
  }
});

test("el render dinámico mantiene introducción y cuerpo separados", () => {
  const template = fs.readFileSync(
    path.join(mirrorDir, "index.php", "practice", "p-46.html"),
    "utf8",
  );
  const html = renderSingle(template, {
    slug: "arbitration",
    name: "Arbitration",
    nameEs: "Arbitraje",
    description: "<p>Introduction</p>",
    descriptionEs: "<p>Introducción</p>",
    fullDescription: "<p>Body</p>",
    fullDescriptionEs: "<p>Cuerpo</p>",
  }, [], "practice", "en");
  const $ = cheerio.load(html);

  assert.equal($(".single").attr("data-vw-content-kind"), "practice");
  assert.equal($(".single__content--intro").html(), "<p>Introduction</p>");
  assert.equal($(".single__content--txt").html(), "<p>Body</p>");
  assert.doesNotMatch(html, /txt_separado/);
});

test("la migración de prácticas usa parámetros y actualiza las 18 filas editoriales", async () => {
  const migration = await import("../../migrations/20260812_0001_canonical_practice_content.mjs");
  const calls: Array<{ sql: string; values: unknown[] }> = [];

  await migration.default({
    query: async (sql: string, values: unknown[]) => { calls.push({ sql, values }); },
  });

  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /UPDATE practice_groups AS target/i);
  assert.match(calls[0].sql, /full_description_es = source\.full_description_es/i);
  assert.equal(calls[0].values.length, 18 * 7);
  assert.deepEqual(
    calls[0].values.filter((_, index) => index % 7 === 0).sort(),
    canonicalPracticeManifest.map((practice) => practice.slug).sort(),
  );
});
