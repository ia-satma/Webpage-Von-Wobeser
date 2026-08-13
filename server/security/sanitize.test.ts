import assert from "node:assert/strict";
import test from "node:test";
import { renderRichText, sanitizeCms, sanitizeFields, sanitizeNewsFields } from "../mirror/sanitize";

test("sanitizeCms elimina scripts, manejadores y javascript URLs", () => {
  const output = sanitizeCms(
    '<p onclick="alert(1)">Texto</p><script>alert(1)</script>'
    + '<a href="javascript:alert(1)" target="_blank">enlace</a>'
    + '<img src="x" onerror="alert(1)">',
  );
  assert.doesNotMatch(output, /script|onclick|onerror|javascript:/i);
  assert.match(output, /rel="noopener noreferrer"/);
});

test("sanitizeCms rechaza data URI activos y conserva raster permitido", () => {
  const active = sanitizeCms('<img src="data:image/svg+xml;base64,PHN2Zz4=">');
  const raster = sanitizeCms('<img src="data:image/png;base64,iVBORw0KGgo=">');
  assert.doesNotMatch(active, /src=/);
  assert.match(raster, /data:image\/png;base64/i);
});

test("renderRichText escapa texto plano antes de convertirlo a párrafos", () => {
  const output = renderRichText("Uno < dos\n\nTres & cuatro");
  assert.equal(output, "<p>Uno &lt; dos</p><p>Tres &amp; cuatro</p>");
});

test("sanitizeCms elimina tipografías pegadas y conserva estilos editoriales permitidos", () => {
  const output = sanitizeCms(
    '<p style="font-family: Arial, sans-serif; font-size: 18px; text-align: center">Texto</p>'
      + '<span style="font-family: Georgia; color: #800000">Título</span>',
  );
  assert.doesNotMatch(output, /font-family|Arial|Georgia/i);
  assert.match(output, /font-size:\s*18px/i);
  assert.match(output, /text-align:\s*center/i);
  assert.match(output, /color:\s*#800000/i);
});

test("sanitizeCms conserva únicamente las marcas institucionales de tipografía", () => {
  const safe = sanitizeCms('<p><span data-vw-font="gelasio">Editorial</span><span data-vw-font="inter">Cuerpo</span></p>');
  const unsafe = sanitizeCms('<p><span data-vw-font="Georgia" style="font-family: Georgia">No permitido</span></p>');
  assert.match(safe, /data-vw-font="gelasio"/);
  assert.match(safe, /data-vw-font="inter"/);
  assert.doesNotMatch(unsafe, /data-vw-font|font-family|Georgia/i);
});

test("Noticias y Artículos eliminan tipografías anteriores en español e inglés antes de guardarse", () => {
  const payload = sanitizeNewsFields({
    titleEs: "Título español",
    title: "English title",
    excerptEs: '<p style="font-family: Publico-Roman; font-size: 18px">Extracto</p>',
    excerpt: '<p style="font-family: Georgia">Excerpt</p>',
    contentEs: '<h2>Título interno</h2><p style="font-family: Arial, sans-serif">Cuerpo</p>',
    content: '<h2>Internal heading</h2><p style="font-family: OptimaLTStd">Body</p>',
  });

  const richText = [payload.excerptEs, payload.excerpt, payload.contentEs, payload.content].join("\n");
  assert.doesNotMatch(richText, /font-family|Publico|Geomanist|Optima|Arial|Georgia/i);
  assert.match(payload.excerptEs, /font-size:\s*18px/i);
  assert.equal(payload.titleEs, "Título español");
  assert.equal(payload.title, "English title");
});

test("Abogados, Prácticas e Industrias eliminan cualquier fuente pegada antes de guardarse", () => {
  const attorney = sanitizeFields({
    bioEs: '<p style="font-family: Times New Roman">Biografía</p>',
    bio: '<p style="font-family: Arial">Biography</p>',
  }, ["bio", "bioEs"]);
  const capability = sanitizeFields({
    descriptionEs: '<p style="font-family: Atkinson Hyperlegible">Descripción</p>',
    description: '<p style="font-family: OptimaLTStd">Description</p>',
    fullDescriptionEs: '<h2 style="font-family: Publico-Roman">Detalle</h2>',
    fullDescription: '<h2 style="font-family: Georgia">Detail</h2>',
  }, ["description", "descriptionEs", "fullDescription", "fullDescriptionEs"]);

  const stored = JSON.stringify({ attorney, capability });
  assert.doesNotMatch(
    stored,
    /font-family|Times New Roman|Arial|Atkinson|Optima|Publico|Georgia/i,
  );
});
