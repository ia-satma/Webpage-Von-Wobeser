import assert from "node:assert/strict";
import test from "node:test";
import { hasPublishableNewsContent, isVerifiedNewsSourceUrl } from "../newsPublicationPolicy";

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
