import assert from "node:assert/strict";
import test from "node:test";
import { editorialDateAtNoon, hasPublishableNewsContent, isValidEditorialDate, isVerifiedNewsSourceUrl, requiresExplicitEditorialDate } from "../newsPublicationPolicy";

test("la API acepta Artículos publicados solo con fuente HTTPS verificable", () => {
  const sourceOnlyArticle = {
    title: "Historic publication",
    titleEs: "Publicación histórica",
    excerpt: "",
    excerptEs: "",
    category: "articles",
    sourceUrl: "https://www.vonwobeser.com/original-publication.pdf",
  };
  assert.equal(hasPublishableNewsContent(sourceOnlyArticle), true);
  assert.equal(hasPublishableNewsContent({ ...sourceOnlyArticle, category: "news" }), false);
  assert.equal(hasPublishableNewsContent({ ...sourceOnlyArticle, sourceUrl: "http://example.com/source" }), false);
  assert.equal(hasPublishableNewsContent({ ...sourceOnlyArticle, sourceUrl: "https://user:secret@example.com/source" }), false);
});

test("la API conserva el requisito bilingüe para las demás publicaciones", () => {
  assert.equal(hasPublishableNewsContent({
    title: "English title",
    titleEs: "Título español",
    excerpt: "English summary",
    excerptEs: "Resumen español",
    category: "press",
  }), true);
  assert.equal(hasPublishableNewsContent({
    title: "English title",
    titleEs: "Título español",
    excerpt: "English summary",
    excerptEs: "",
    category: "articles",
  }), false);
  assert.equal(isVerifiedNewsSourceUrl("https://source.example/article"), true);
  assert.equal(isVerifiedNewsSourceUrl("javascript:alert(1)"), false);
});

test("la fecha editorial exige un día real y mantiene su mes en UTC", () => {
  assert.equal(isValidEditorialDate("2026-08-28"), true);
  assert.equal(isValidEditorialDate("2024-02-29"), true);
  assert.equal(isValidEditorialDate("2026-02-29"), false);
  assert.equal(isValidEditorialDate("2026-02-31"), false);
  assert.equal(isValidEditorialDate("2026-8-28"), false);
  assert.equal(editorialDateAtNoon("2026-08-28").toISOString(), "2026-08-28T12:00:00.000Z");
});

test("publicar un borrador exige que la solicitud aporte fecha editorial", () => {
  assert.equal(requiresExplicitEditorialDate(false, true), true);
  assert.equal(requiresExplicitEditorialDate(undefined, true), true);
  assert.equal(requiresExplicitEditorialDate(true, true), false);
  assert.equal(requiresExplicitEditorialDate(false, false), false);
});
