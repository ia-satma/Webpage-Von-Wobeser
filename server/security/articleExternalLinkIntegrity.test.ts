import assert from "node:assert/strict";
import test from "node:test";
import {
  collectArticleExternalLinks,
  normalizeArticleContentUrl,
  normalizeArticleExternalUrl,
  verifyArticleExternalLink,
} from "../articleExternalLinkIntegrity";
import { renderRichText } from "../mirror/sanitize";

const publicationHtml = `<!doctype html><html><head><title>Von Wobeser y Sierra - Política Criminal Contemporánea de la Secretaría de Hacienda y Crédito Público, Thomson Reuters (2015)</title></head><body><main><h1>Política Criminal Contemporánea de la Secretaría de Hacienda y Crédito Público, Thomson Reuters (2015)</h1><p>Contenido oficial verificable de la publicación histórica con suficiente detalle editorial para distinguirlo de una página vacía, de navegación o de error.</p></main></body></html>`;

test("la fuente Joomla p_id=1830 se conserva cuando entrega el título y contenido correctos", async () => {
  const [candidate] = collectArticleExternalLinks({
    sourceUrl: "https://www.vonwobeser.com/index.php/publication?p_id=1830",
    title: "Contemporary Criminal Policy of the Ministry of Finance and Public Credit, Thomson Reuters (2015)",
    titleEs: "Política Criminal Contemporánea de la Secretaría de Hacienda y Crédito Público, Thomson Reuters (2015)",
    excerpt: "", excerptEs: "", content: "", contentEs: "",
  });
  const result = await verifyArticleExternalLink(candidate, {
    fetchImpl: async () => new Response(publicationHtml, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }),
  });
  assert.equal(result.valid, true);
  assert.equal(result.finalUrl, candidate.normalizedUrl);
});

test("un 404, una página de error 200 y un redireccionamiento al 404 legado son inválidos", async () => {
  const candidate = {
    kind: "source" as const,
    url: "https://example.com/article",
    normalizedUrl: "https://example.com/article",
    expectedTitles: ["Artículo verificable"],
  };
  const http404 = await verifyArticleExternalLink(candidate, {
    fetchImpl: async () => new Response("No encontrado", { status: 404, headers: { "content-type": "text/html" } }),
  });
  assert.equal(http404.failureCode, "HTTP_ERROR");

  const error200 = await verifyArticleExternalLink(candidate, {
    fetchImpl: async () => new Response("<html><title>404 - Página no encontrada</title><body>La página no encontrada no contiene la publicación solicitada y se muestra este mensaje de error.</body></html>", { status: 200, headers: { "content-type": "text/html" } }),
  });
  assert.equal(error200.failureCode, "HTML_ERROR_DOCUMENT");

  const legacyRedirect = await verifyArticleExternalLink(candidate, {
    fetchImpl: async () => new Response(null, { status: 302, headers: { location: "https://www.vonwobeser.com/index.php/404" } }),
  });
  assert.equal(legacyRedirect.failureCode, "REDIRECT_TO_LEGACY_404");
});

test("un PDF válido y una redirección a contenido real permanecen activos", async () => {
  const candidate = {
    kind: "content" as const,
    url: "https://example.com/document.pdf",
    normalizedUrl: "https://example.com/document.pdf",
    expectedTitles: [],
  };
  let calls = 0;
  const result = await verifyArticleExternalLink(candidate, {
    fetchImpl: async (url) => {
      calls += 1;
      if (calls === 1) return new Response(null, { status: 301, headers: { location: "https://cdn.example.com/document.pdf" } });
      return new Response(Buffer.from("%PDF-1.7 contenido"), { status: 206, headers: { "content-type": "application/pdf" } });
    },
  });
  assert.equal(calls, 2);
  assert.equal(result.valid, true);
  assert.equal(result.finalUrl, "https://cdn.example.com/document.pdf");
});

test("los enlaces desactivados conservan el texto pero no permanecen clicables", () => {
  const html = renderRichText('<p>Consulta <a href="https://example.com/caido">la fuente histórica</a> para más detalle.</p>', {
    disabledExternalUrls: ["https://example.com/caido"],
  });
  assert.match(html, /la fuente histórica/);
  assert.doesNotMatch(html, /href="https:\/\/example\.com\/caido"/);
});

test("los PDFs locales del espejo también se inventarían y se pueden desactivar sin perder su texto", () => {
  const candidates = collectArticleExternalLinks({
    sourceUrl: "", title: "Article", titleEs: "Artículo", excerpt: '<p><a href="/images/PDF_news/2023/documento.pdf">Descargar PDF</a></p>', excerptEs: "", content: "", contentEs: "",
  });
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].normalizedUrl, "/images/PDF_news/2023/documento.pdf");
  assert.equal(normalizeArticleContentUrl("/images/PDF_news/2023/documento.pdf?download=1"), "/images/PDF_news/2023/documento.pdf");
  const html = renderRichText('<p><a href="/images/PDF_news/2023/documento.pdf">Descargar PDF</a></p>', {
    disabledExternalUrls: ["/images/PDF_news/2023/documento.pdf"],
  });
  assert.match(html, /Descargar PDF/);
  assert.doesNotMatch(html, /href=/);
});

test("la normalización rechaza destinos locales y la fuente inválida sigue siendo auditable", () => {
  assert.equal(normalizeArticleExternalUrl("https://localhost/private"), null);
  const candidates = collectArticleExternalLinks({
    sourceUrl: "not a valid URL",
    title: "Article", titleEs: "Artículo", excerpt: "", excerptEs: "", content: "", contentEs: "",
  });
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].kind, "source");
});
