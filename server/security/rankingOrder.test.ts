import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as cheerio from "cheerio";

process.env.DATABASE_URL ||= "postgresql://test:test@127.0.0.1:5432/test";

const { hasExactRankingSet, rankingOrderRequestSchema } = await import("../rankings/order");
const { renderHome } = await import("../mirror/renderHome");

test("el contrato de orden acepta una lista completa y rechaza duplicados o más de 200 elementos", () => {
  assert.deepEqual(rankingOrderRequestSchema.parse({ ids: ["a", "b", "c"] }), {
    ids: ["a", "b", "c"],
  });
  assert.equal(rankingOrderRequestSchema.safeParse({ ids: ["a", "a"] }).success, false);
  assert.equal(
    rankingOrderRequestSchema.safeParse({
      ids: Array.from({ length: 201 }, (_, index) => `ranking-${index}`),
    }).success,
    false,
  );
});

test("la detección de concurrencia exige exactamente los registros que siguen en la base", () => {
  assert.equal(hasExactRankingSet(["a", "b", "c"], ["c", "a", "b"]), true);
  assert.equal(hasExactRankingSet(["a", "b", "c"], ["a", "b"]), false);
  assert.equal(hasExactRankingSet(["a", "b"], ["a", "b", "c"]), false);
  assert.equal(hasExactRankingSet(["a", "b"], ["a", "c"]), false);
});

test("el Home conserva el orden manual aunque los años estén mezclados", () => {
  const template = `<!doctype html><html><body>
    <div class="home_rec_JS"><div class="home__rec--slider"></div></div>
  </body></html>`;
  const rankings = [
    { id: "1", name: "Chambers Global", nameEs: "Chambers Global", year: 2025, logoUrl: "/global.webp" },
    { id: "2", name: "Legal 500", nameEs: "Legal 500", year: 2026, logoUrl: "/legal.webp" },
    { id: "3", name: "Latin Lawyer 250", nameEs: "Latin Lawyer 250", year: 2026, logoUrl: "/latin.webp" },
    { id: "4", name: "Chambers Latin America", nameEs: "Chambers Latin America", year: 2026, logoUrl: "/chambers-latam.webp" },
    { id: "5", name: "GAR 100", nameEs: "GAR 100", year: 2025, logoUrl: "/gar.webp" },
  ];

  const $ = cheerio.load(renderHome(template, [], {}, "es", rankings));
  assert.deepEqual(
    $(".home__rec--slider img").toArray().map((element) => $(element).attr("alt")),
    rankings.map((ranking) => ranking.nameEs),
  );
});

test("la migración inicial prioriza los cinco reconocimientos solicitados sin tocar medios", () => {
  const migration = readFileSync(
    new URL("../../migrations/20260727_0002_rankings_display_order.sql", import.meta.url),
    "utf8",
  );
  const expected = [
    "chambers-global",
    "legal-500",
    "latin-lawyer-250",
    "chambers-latin-america",
    "gar-100",
  ];
  let previousPosition = -1;
  for (const marker of expected) {
    const position = migration.indexOf(marker);
    assert.ok(position > previousPosition, `${marker} debe conservar la prioridad solicitada`);
    previousPosition = position;
  }
  assert.doesNotMatch(migration, /SET\s+(logo_url|name|year|external_url)\s*=/i);
});

test("el panel ofrece orden local, controles accesibles y guardado explícito", () => {
  const panel = readFileSync(
    new URL("../../client/src/pages/admin/AdminRecognitions.tsx", import.meta.url),
    "utf8",
  );

  assert.match(panel, /\/api\/admin\/rankings\/order/);
  assert.match(panel, /Guardar orden/);
  assert.match(panel, /Cancelar/);
  assert.match(panel, /aria-label=\{`Subir /);
  assert.match(panel, /aria-label=\{`Bajar /);
  assert.match(panel, /draggable/);
});
