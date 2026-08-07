import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

process.env.DATABASE_URL ||= "postgresql://test:test@127.0.0.1:5432/test";

const { analyzeLinguisticText } = await import("../audits/linguisticAudit");

test("la auditoría detecta tildes, ortografía, codificación y tono formal", () => {
  const issues = analyzeLinguisticText(
    "Manténgase informado. Reciba en su correo informacion juridica de Mexico y la adminitración. Texto dañado: informaciÃ³n.",
    "es",
  );
  const types = new Set(issues.map((issue) => issue.issueType));

  assert.ok(types.has("missing_accent"));
  assert.ok(types.has("spelling"));
  assert.ok(types.has("mojibake"));
  assert.ok(types.has("tone_mismatch"));
  assert.ok(issues.some((issue) => issue.suggestion.includes("información")));
  assert.ok(issues.some((issue) => issue.suggestion.includes("Mantente informado")));
});

test("la auditoría detecta fragmentos mezclados entre español e inglés", () => {
  assert.ok(analyzeLinguisticText("Consulta nuestros servicios y click here.", "es").some((issue) => issue.issueType === "language_mismatch"));
  assert.ok(analyzeLinguisticText("Read our work and consulta el aviso de privacidad.", "en").some((issue) => issue.issueType === "language_mismatch"));
});

test("la auditoría integral incluye espejo histórico, panel e historiales generados", () => {
  const source = readFileSync(new URL("../audits/linguisticAudit.ts", import.meta.url), "utf8");

  assert.match(source, /const mirrorRoot = getMirrorDir\(\)/);
  assert.match(source, /walk\(mirrorRoot, new Set\(\["\.html"\]\)\)/);
  assert.match(source, /path\.resolve\(process\.cwd\(\), "client\/src"\)/);
  assert.match(source, /generatedImages/);
  assert.match(source, /generatedAudio/);
  assert.match(source, /generatedPresentations/);
  assert.match(source, /createWebsiteAuditFindings/);
  assert.doesNotMatch(source, /openai|anthropic|languageTool|fetch\(/i);
});
