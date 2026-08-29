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
import { readAdminFeatureSources } from "./adminFeatureTestSources";
import { readRouteSources } from "./routeTestSources";

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

test("la semilla aplica el contenido canónico y conserva los perfiles adicionales para Administración", () => {
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

test("la ficha dinámica separa destacado y cuerpo, y muestra las noticias internas una sola vez", () => {
  const template = read("../../frontend-mirror/index.php/lawyer/l-134.html");
  const attorney = loadCanonicalAttorneyContent(mirrorDir).find((candidate) => candidate.slug === "bernardo-zatarain")!;
  const html = renderAttorney(template, {
    ...attorney,
    relatedNews: [{ slug: "already-listed", title: "News title", titleEs: "Noticia listada", excerpt: "x", excerptEs: "x", date: "2026-08-01T12:00:00.000Z" }],
    publications: [{ kind: "news", title: "News title", titleEs: "Noticia listada", url: "/news/already-listed" }],
  }, "es");
  const $ = cheerio.load(html);

  assert.equal($(".attorney").attr("data-vw-content-kind"), "attorney");
  assert.equal($(".attorney__content--intro").html(), attorney.bioIntroEs);
  assert.equal($(".attorney-bio-disclosure .attorney__content--txt").html(), attorney.bioEs);
  assert.equal($(".attorney__content--txt").text().includes($(".attorney__content--intro").text()), false);
  assert.equal($("h1").length, 1);
  assert.equal($("h1.attorney__meta--name").text(), "Bernardo Zatarain");
  assert.equal($(".attorney__meta--list.list_JS").length, 1);
  assert.equal($(".attorney-profile__nav").length, 0);
  assert.equal($(".attorney-related-insights").length, 1);
  assert.equal($(".attorney-related-insights__item h3 a[href='/news/already-listed']").length, 1);
  assert.equal($(".attorney__meta--list a[href='/news/already-listed']").length, 0);
});

test("los reconocimientos históricos muestran sólo el idioma activo en todas las fichas", () => {
  const template = read("../../frontend-mirror/index.php/lawyer/l-134.html");
  const attorneysWithHistoricalRecognitions = loadCanonicalAttorneyContent(mirrorDir)
    .filter((attorney) => attorney.rankings.some((entry) => !entry.ranking && entry.rankingEs && entry.publication && !entry.publicationEs));

  assert.ok(attorneysWithHistoricalRecognitions.length > 0);
  for (const attorney of attorneysWithHistoricalRecognitions) {
    const expectedEs = attorney.rankings
      .filter((entry) => !entry.ranking && entry.rankingEs && entry.publication && !entry.publicationEs)
      .map((entry) => entry.rankingEs);
    const expectedEn = attorney.rankings
      .filter((entry) => !entry.ranking && entry.rankingEs && entry.publication && !entry.publicationEs)
      .map((entry) => entry.publication);
    const spanish = cheerio.load(renderAttorney(template, attorney, "es"));
    const english = cheerio.load(renderAttorney(template, attorney, "en"));

    assert.deepEqual(
      spanish("#recognitions > li").map((_, element) => spanish(element).text().trim()).get(),
      expectedEs,
      `${attorney.slug} must not append the English recognition in Spanish`,
    );
    assert.deepEqual(
      english("#recognitions > li").map((_, element) => english(element).text().trim()).get(),
      expectedEn,
      `${attorney.slug} must not append the Spanish recognition in English`,
    );
  }

  const structuredRecognition = {
    name: "Perfil de prueba",
    slug: "perfil-de-prueba",
    title: "Partner",
    titleEs: "Socio",
    role: "Partner",
    roleEs: "Socio",
    email: "test@example.com",
    phone: "+52 55 0000 0000",
    bioIntro: "<p>English biography.</p>",
    bioIntroEs: "<p>Biografía en español.</p>",
    bio: "<p>English biography.</p>",
    bioEs: "<p>Biografía en español.</p>",
    rankings: [{ ranking: "Band 1", rankingEs: "Banda 1", publication: "Chambers", publicationEs: "Chambers" }],
  };
  const spanishStructured = cheerio.load(renderAttorney(template, structuredRecognition, "es"));
  const englishStructured = cheerio.load(renderAttorney(template, structuredRecognition, "en"));
  assert.equal(spanishStructured("#recognitions > li").text().trim(), "Banda 1 — Chambers");
  assert.equal(englishStructured("#recognitions > li").text().trim(), "Band 1 — Chambers");
});

test("los años de experiencia de Asociados se ocultan de forma reversible", () => {
  const template = read("../../frontend-mirror/index.php/lawyer/l-134.html");
  const associate = {
    name: "Asociada de prueba",
    slug: "asociada-de-prueba",
    title: "Associate",
    titleEs: "Asociada",
    role: "Associate",
    roleEs: "Asociada",
    email: "asociada@example.com",
    phone: "+52 55 0000 0000",
    bioIntro: "<p>She advises clients on labor matters. She has more than five years of experience in employment litigation.</p>",
    bioIntroEs: "<p>Asesora a clientes en asuntos laborales. Cuenta con más de cinco años de experiencia en litigio laboral.</p>",
    bio: "<p>Her professional profile is kept in the CMS.</p>",
    bioEs: "<p>Su perfil profesional se conserva en el CMS.</p>",
  };

  const hidden = cheerio.load(renderAttorney(template, associate, "es", undefined, { associateExperienceVisible: false }));
  assert.match(hidden(".attorney__content--intro").text(), /Asesora a clientes en asuntos laborales\./);
  assert.doesNotMatch(hidden(".attorney__content--intro").text(), /años de experiencia/i);

  const visible = cheerio.load(renderAttorney(template, associate, "es", undefined, { associateExperienceVisible: true }));
  assert.match(visible(".attorney__content--intro").text(), /más de cinco años de experiencia/i);

  const partner = cheerio.load(renderAttorney(template, { ...associate, title: "Partner", titleEs: "Socia" }, "es", undefined, { associateExperienceVisible: false }));
  assert.match(partner(".attorney__content--intro").text(), /más de cinco años de experiencia/i);
});

test("el CMS expone introducción, estructura completa y saneamiento para los perfiles", () => {
  const form = readAdminFeatureSources("team-form", "AdminTeamForm.tsx");
  const routes = readRouteSources();
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
  const siteConfigRegistry = read("../../client/src/features/admin/site-config/registry.ts");
  assert.match(siteConfigRegistry, /key:\s*"associate_experience_visible"[\s\S]*?control:\s*"switch"/);
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

test("la reconciliación de perfiles únicamente repone las columnas editoriales faltantes", async () => {
  const source = read("../../migrations/20260812_0005_reconcile_attorney_editorial_columns.sql");

  assert.match(source, /ALTER TABLE team_members ADD COLUMN IF NOT EXISTS bio_intro text;/);
  assert.match(source, /ALTER TABLE team_members ADD COLUMN IF NOT EXISTS bio_intro_es text;/);
  assert.match(source, /ALTER TABLE team_members ADD COLUMN IF NOT EXISTS languages_es jsonb;/);
  assert.doesNotMatch(source, /\bDROP\s+COLUMN\b/i);
  assert.doesNotMatch(source, /\bDELETE\s+FROM\b/i);
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
