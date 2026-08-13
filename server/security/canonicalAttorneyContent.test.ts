import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import * as cheerio from "cheerio";
import {
  CANONICAL_ATTORNEYS_SNAPSHOT_DATE,
  CANONICAL_ATTORNEYS_SNAPSHOT_SHA256,
  applyCanonicalAttorneyContent,
  canonicalAttorneySnapshotDigest,
  loadCanonicalAttorneyContent,
  preservedAdditionalAttorneySlugs,
} from "../content/canonicalAttorneys";
import { canonicalPracticeManifest } from "../content/canonicalPractices";
import { renderAttorney } from "../mirror/renderAttorney";
import { renderRichText } from "../mirror/sanitize";

const mirrorDir = path.resolve(process.cwd(), "frontend-mirror");
const read = (relative: string) => fs.readFileSync(new URL(relative, import.meta.url), "utf8");
const safeUrl = /^(?:\/news\/|\/articles\/|https:\/\/vonwobeser\.com\/)/i;

test("el snapshot canónico contiene los 133 abogados oficiales bilingües y contenido seguro", () => {
  const attorneys = loadCanonicalAttorneyContent(mirrorDir);

  assert.equal(CANONICAL_ATTORNEYS_SNAPSHOT_DATE, "2026-08-12");
  assert.equal(attorneys.length, 133);
  assert.equal(new Set(attorneys.map((attorney) => attorney.slug)).size, 133);
  assert.equal(canonicalAttorneySnapshotDigest(mirrorDir), CANONICAL_ATTORNEYS_SNAPSHOT_SHA256);
  assert.ok(attorneys.some((attorney) => attorney.slug === "bernardo-zatarain"));

  for (const attorney of attorneys) {
    for (const field of [
      attorney.name, attorney.title, attorney.titleEs, attorney.email, attorney.phone,
      attorney.bioIntro, attorney.bioIntroEs, attorney.bio, attorney.bioEs,
    ]) {
      assert.notEqual(field.trim(), "", `${attorney.slug} must have canonical profile data`);
      assert.doesNotMatch(field, /<\/?(?:script|iframe|object|embed)\b|\bon\w+\s*=|\bjavascript\s*:/i);
      assert.doesNotMatch(renderRichText(field), /<script|\bon\w+\s*=|javascript\s*:/i);
    }
    for (const field of [attorney.bioIntro, attorney.bioIntroEs, attorney.bio, attorney.bioEs]) {
      assert.match(field, /^<p>/, `${attorney.slug} uses semantic paragraphs`);
      assert.doesNotMatch(field, /<br\s*\/?>/i, `${attorney.slug} has no legacy layout breaks`);
    }
    for (const resource of attorney.publications) {
      assert.ok(resource.kind === "news" || resource.kind === "article");
      assert.match(resource.title, /\S/);
      assert.match(resource.titleEs || "", /\S/);
      if (resource.url) assert.match(resource.url, safeUrl);
    }
  }
});

test("la semilla aplica el contenido canónico y conserva los nueve perfiles adicionales sin tocar", () => {
  const canonical = loadCanonicalAttorneyContent(mirrorDir);
  const source = canonical[0];
  const extras = [...preservedAdditionalAttorneySlugs].map((slug, index) => ({
    name: `Additional ${index}`,
    titleEs: "Asociado",
    slug,
    imageUrl: `/extras/${slug}.jpg`,
    order: 500 + index,
    published: true,
    marker: "must-survive",
  }));
  const seeded = applyCanonicalAttorneyContent([
    {
      name: source.name,
      titleEs: source.titleEs,
      slug: "historic-slug",
      imageUrl: "/historic-photo.jpg",
      order: 17,
      published: false,
      bio: "old body",
    },
    ...extras,
  ]);

  assert.equal(seeded.length, 142);
  const updated = seeded.find((attorney) => attorney.slug === "historic-slug")!;
  assert.equal(updated.imageUrl, "/historic-photo.jpg");
  assert.equal(updated.order, 17);
  assert.equal(updated.published, false);
  assert.equal(updated.bio, source.bio);
  assert.equal(updated.bioIntro, source.bioIntro);
  for (const extra of extras) {
    assert.deepEqual(seeded.find((attorney) => attorney.slug === extra.slug), extra);
  }
});

test("la semilla real publica exactamente 142 perfiles con slugs únicos", async () => {
  process.env.DATABASE_URL ||= "postgresql://test:test@127.0.0.1:5432/test";
  const { canonicalTeamMembersData } = await import("../seed");
  const slugs = canonicalTeamMembersData.map((attorney) => String(attorney.slug));

  assert.equal(canonicalTeamMembersData.length, 142);
  assert.equal(new Set(slugs).size, 142);
  assert.ok(slugs.includes("bernardo-zatarain"));
  for (const slug of preservedAdditionalAttorneySlugs) assert.ok(slugs.includes(slug));
});

test("la ficha dinámica separa destacado y cuerpo, usa idiomas y no duplica noticias", () => {
  const template = read("../../frontend-mirror/index.php/lawyer/l-134.html");
  const attorney = loadCanonicalAttorneyContent(mirrorDir).find((candidate) => candidate.slug === "bernardo-zatarain")!;
  const html = renderAttorney(template, {
    ...attorney,
    relatedNews: [{ slug: "already-listed", title: "News title", titleEs: "Noticia listada", excerpt: "x", excerptEs: "x" }],
    publications: [{ kind: "news", title: "News title", titleEs: "Noticia listada", url: "/news/already-listed" }],
  }, "es");
  const $ = cheerio.load(html);

  assert.equal($(".attorney").attr("data-vw-content-kind"), "attorney");
  assert.equal($(".attorney__content--intro").html(), attorney.bioIntroEs);
  assert.equal($(".attorney__content--txt").html(), attorney.bioEs);
  assert.equal($(".attorney__content--txt").text().includes($(".attorney__content--intro").text()), false);
  assert.match($(".attorney__meta--list").text(), /Español, inglés/);
  assert.equal($(".attorney-related-insights").length, 0);
  assert.equal($(".attorney__meta--list a[href='/news/already-listed']").length, 1);
});

test("el CMS expone introducción, estructura completa y saneamiento para los perfiles", () => {
  const form = read("../../client/src/pages/admin/AdminTeamForm.tsx");
  const routes = read("../routes.ts");
  const typography = read("../../frontend-mirror/templates/beez3/css/typography.css");
  const idMap = read("../mirror/idMap.ts");

  for (const testId of ["textarea-bio-intro", "textarea-bio-intro-es", "textarea-bio", "textarea-bio-es"]) {
    assert.match(form, new RegExp(`data-testid="${testId}"`));
  }
  for (const section of ["Educación y experiencia", "Afiliaciones y actividades académicas", "Reconocimientos", "Noticias y artículos", "Idiomas"]) {
    assert.match(form, new RegExp(section));
  }
  assert.match(form, /value: "news"/);
  assert.match(form, /value: "article"/);
  assert.match(routes, /sanitizeFields\(validatedData, \["bio", "bioEs", "bioIntro", "bioIntroEs"\]\)/);
  assert.match(typography, /\.attorney\[data-vw-content-kind="attorney"\][\s\S]*?\.attorney__content--intro[\s\S]*?var\(--vw-font-editorial\)/);
  assert.match(typography, /\.attorney\[data-vw-content-kind="attorney"\][\s\S]*?\.attorney__content--txt[\s\S]*?var\(--vw-font-body\)/);
  assert.match(typography, /\.attorney__content--txt p \+ p[\s\S]*?margin-top:\s*1\.35em/);
  assert.match(idMap, /attorney\.set\("457", bernardoSlug\)/);
});

test("la migración parametrizada actualiza 132 perfiles, agrega a Bernardo y deja intactos los nueve adicionales", async () => {
  const canonical = loadCanonicalAttorneyContent(mirrorDir);
  const existing = canonical.filter((attorney) => attorney.legacyId !== "457").map((attorney, index) => ({
    id: `official-${index}`,
    name: attorney.name,
    title_es: attorney.titleEs,
    slug: `unchanged-${index}`,
    image_url: `/unchanged-${index}.jpg`,
    published: true,
    order: index,
  }));
  const extras = [...preservedAdditionalAttorneySlugs].map((slug, index) => ({
    id: `extra-${index}`, name: `Extra ${index}`, title_es: "Asociado", slug, image_url: `/extras/${index}.jpg`, published: true, order: 600 + index,
  }));
  const practices = canonicalPracticeManifest.map((practice, index) => ({ id: `practice-${index}`, name_es: practice.nameEs }));
  const industries = [...new Set(canonical.flatMap((attorney) => attorney.industryNames))].map((name, index) => ({ id: `industry-${index}`, name_es: name }));
  const calls: Array<{ sql: string; values: unknown[] }> = [];
  const migration = await import("../../migrations/20260812_0003_canonical_attorney_content.mjs");

  await migration.default({
    query: async (sql: string, values: unknown[] = []) => {
      calls.push({ sql, values });
      if (/SELECT id, name, title_es, email, slug FROM team_members/i.test(sql)) return { rows: [...existing, ...extras] };
      if (/SELECT id, name_es FROM practice_groups/i.test(sql)) return { rows: practices };
      if (/SELECT id, name_es FROM industry_groups/i.test(sql)) return { rows: industries };
      if (/SELECT slug, title, title_es, category FROM news/i.test(sql)) return { rows: [] };
      if (/INSERT INTO team_members/i.test(sql)) return { rows: [{ id: "bernardo-id" }] };
      return { rows: [] };
    },
  });

  const updates = calls.filter((call) => /UPDATE team_members SET/i.test(call.sql));
  const inserted = calls.filter((call) => /INSERT INTO team_members/i.test(call.sql));
  assert.equal(updates.length, 132);
  assert.equal(inserted.length, 1);
  assert.ok(updates.every((call) => !/\bslug\s*=|\bimage_url\s*=|\bpublished\s*=|\b"order"\s*=/i.test(call.sql)));
  assert.ok(updates.every((call) => !String(call.values.at(-1)).startsWith("extra-")));
  assert.doesNotMatch(JSON.stringify(updates.map((call) => call.values)), /javascript:|SEE MORE|VER MÁS/i);
  assert.match(inserted[0].sql, /'bernardo-zatarain'/);
  assert.equal(calls.filter((call) => /ADD COLUMN IF NOT EXISTS (?:bio_intro|bio_intro_es|languages_es)/i.test(call.sql)).length, 3);
});

test("la migración crea el único perfil oficial ausente sin frenar la publicación", async () => {
  const canonical = loadCanonicalAttorneyContent(mirrorDir);
  const missing = canonical.find((attorney) => attorney.name.includes("Anna-Maria"))!;
  const existing = canonical
    .filter((attorney) => attorney.legacyId !== "457" && attorney.legacyId !== missing.legacyId)
    .map((attorney, index) => ({
      id: `official-${index}`,
      name: attorney.name,
      title_es: attorney.titleEs,
      email: attorney.email,
      slug: `unchanged-${index}`,
    }));
  const practices = canonicalPracticeManifest.map((practice, index) => ({ id: `practice-${index}`, name_es: practice.nameEs }));
  const industries = [...new Set(canonical.flatMap((attorney) => attorney.industryNames))].map((name, index) => ({ id: `industry-${index}`, name_es: name }));
  const calls: Array<{ sql: string; values: unknown[] }> = [];
  const migration = await import("../../migrations/20260812_0003_canonical_attorney_content.mjs");

  await migration.default({
    query: async (sql: string, values: unknown[] = []) => {
      calls.push({ sql, values });
      if (/SELECT id, name, title_es, email, slug FROM team_members/i.test(sql)) return { rows: existing };
      if (/SELECT id, name_es FROM practice_groups/i.test(sql)) return { rows: practices };
      if (/SELECT id, name_es FROM industry_groups/i.test(sql)) return { rows: industries };
      if (/SELECT slug, title, title_es, category FROM news/i.test(sql)) return { rows: [] };
      if (/INSERT INTO team_members/i.test(sql)) {
        const isMissingOfficial = values.includes(missing.name);
        return { rows: [{ id: isMissingOfficial ? "missing-official-id" : "bernardo-id", slug: isMissingOfficial ? "anna-maria-brandstadter" : undefined }] };
      }
      return { rows: [] };
    },
  });

  const inserts = calls.filter((call) => /INSERT INTO team_members/i.test(call.sql));
  const missingInsert = inserts.find((call) => call.values.includes(missing.name));
  assert.equal(inserts.length, 2);
  assert.ok(missingInsert);
  assert.equal(missingInsert!.values[1], "anna-maria-brandstadter");
  assert.ok(calls.some((call) => /UPDATE team_members SET/i.test(call.sql) && call.values.at(-1) === "missing-official-id"));
});

test("la migración omite sólo la práctica retirada sin ocultar otros grupos desconocidos", async () => {
  const canonical = loadCanonicalAttorneyContent(mirrorDir);
  const existing = canonical.filter((attorney) => attorney.legacyId !== "457").map((attorney, index) => ({
    id: `official-${index}`,
    name: attorney.name,
    title_es: attorney.titleEs,
    email: attorney.email,
    slug: `unchanged-${index}`,
  }));
  const practices = canonicalPracticeManifest.map((practice, index) => ({ id: `practice-${index}`, name_es: practice.nameEs }));
  const industries = [...new Set(canonical.flatMap((attorney) => attorney.industryNames))].map((name, index) => ({ id: `industry-${index}`, name_es: name }));
  const calls: Array<{ sql: string; values: unknown[] }> = [];
  const migration = await import("../../migrations/20260812_0003_canonical_attorney_content.mjs");

  await migration.default({
    query: async (sql: string, values: unknown[] = []) => {
      calls.push({ sql, values });
      if (/SELECT id, name, title_es, email, slug FROM team_members/i.test(sql)) return { rows: existing };
      if (/SELECT id, name_es FROM practice_groups/i.test(sql)) return { rows: practices };
      if (/SELECT id, name_es FROM industry_groups/i.test(sql)) return { rows: industries };
      if (/SELECT slug, title, title_es, category FROM news/i.test(sql)) return { rows: [] };
      if (/INSERT INTO team_members/i.test(sql)) return { rows: [{ id: "bernardo-id" }] };
      return { rows: [] };
    },
  });

  assert.ok(calls.some((call) => /DELETE FROM team_member_practice_groups/i.test(call.sql)));
  assert.ok(calls.some((call) => /INSERT INTO team_member_practice_groups/i.test(call.sql)));
  assert.doesNotMatch(JSON.stringify(calls), /Unresolved canonical practice groups/);
});
