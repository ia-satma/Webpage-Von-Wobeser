import assert from "node:assert/strict";
import test from "node:test";
import { renderRichText, sanitizeCms } from "../mirror/sanitize";

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
