import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { CURRENT_ASSOCIATE_ORDER, MIRROR_ONLY_ASSOCIATE_NAMES, OFFICIAL_PARTNER_ORDER } from "@shared/attorneyOrder";

process.env.DATABASE_URL ||= "postgresql://test:test@127.0.0.1:5432/test";

const {
  attorneyOrderCategorySchema,
  attorneyOrderRequestSchema,
  attorneyOrderVersion,
  getAttorneyOrderCategory,
  hasExactAttorneySet,
} = await import("../attorneys/order");
const { canonicalTeamMembersData } = await import("../seed");

test("el contrato de orden de abogados solo acepta categorías públicas e IDs completos sin duplicados", () => {
  assert.deepEqual(attorneyOrderCategorySchema.parse("partners"), "partners");
  assert.equal(attorneyOrderCategorySchema.safeParse("unknown").success, false);
  assert.deepEqual(attorneyOrderRequestSchema.parse({
    category: "counsel",
    version: "a".repeat(64),
    ids: ["00000000-0000-4000-8000-000000000001", "00000000-0000-4000-8000-000000000002"],
  }).category, "counsel");
  assert.equal(attorneyOrderRequestSchema.safeParse({
    category: "partners",
    version: "a".repeat(64),
    ids: ["00000000-0000-4000-8000-000000000001", "00000000-0000-4000-8000-000000000001"],
  }).success, false);
  assert.equal(getAttorneyOrderCategory("associates").title, "Associate");
});

test("la detección de concurrencia exige exactamente los abogados de una categoría", () => {
  assert.equal(hasExactAttorneySet(["a", "b", "c"], ["c", "a", "b"]), true);
  assert.equal(hasExactAttorneySet(["a", "b", "c"], ["a", "b"]), false);
  assert.equal(hasExactAttorneySet(["a", "b"], ["a", "c"]), false);
  assert.equal(hasExactAttorneySet(["a", "b"], ["a", "a"]), false);
  assert.notEqual(
    attorneyOrderVersion([{ id: "a", order: 1 }, { id: "b", order: 2 }]),
    attorneyOrderVersion([{ id: "b", order: 1 }, { id: "a", order: 2 }]),
  );
});

test("las instalaciones nuevas reciben el orden oficial íntegro de Socios", () => {
  const partners = canonicalTeamMembersData
    .filter((member) => member.title === "Partner")
    .sort((left, right) => Number(left.order ?? 0) - Number(right.order ?? 0));

  assert.deepEqual(partners.map((member) => member.name), OFFICIAL_PARTNER_ORDER);
  assert.deepEqual(partners.map((member) => member.order), OFFICIAL_PARTNER_ORDER.map((_, index) => index + 1));
});

test("el tramo ajustado de Socios conserva la secuencia editorial aprobada", () => {
  assert.deepEqual(OFFICIAL_PARTNER_ORDER.slice(9, 16), [
    "Patricia Kaim",
    "Alberto Córdoba",
    "Raymundo Soberanis",
    "Pablo Jiménez",
    "Pablo Fautsch",
    "Jessika Rocha",
    "Ariel Garfio",
  ]);
  assert.equal(new Set(OFFICIAL_PARTNER_ORDER).size, OFFICIAL_PARTNER_ORDER.length);
});

test("las instalaciones nuevas conservan los 101 Asociados y respetan visibilidad editorial", () => {
  const associates = canonicalTeamMembersData
    .filter((member) => member.title === "Associate")
    .sort((left, right) => Number(left.order ?? 0) - Number(right.order ?? 0));

  assert.equal(CURRENT_ASSOCIATE_ORDER.length, 101);
  assert.equal(MIRROR_ONLY_ASSOCIATE_NAMES.length, 9);
  assert.equal(new Set(CURRENT_ASSOCIATE_ORDER.map((name) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase())).size, 101);
  assert.deepEqual(associates.map((member) => member.name), CURRENT_ASSOCIATE_ORDER);
  assert.deepEqual(associates.map((member) => member.order), CURRENT_ASSOCIATE_ORDER.map((_, index) => index + 1));
  assert.deepEqual(
    associates.filter((member) => member.published === false).map((member) => member.name).sort(),
    [...MIRROR_ONLY_ASSOCIATE_NAMES, "Eugenio Chinchillas"].sort(),
  );
});

test("Eugenio Chinchillas queda disponible en Administración pero despublicado", () => {
  const eugenio = canonicalTeamMembersData.find((member) => member.slug === "eugenio-chinchillas");
  assert.equal(eugenio?.name, "Eugenio Chinchillas");
  assert.equal(eugenio?.title, "Associate");
  assert.equal(eugenio?.published, false);
});

test("el panel ofrece orden por categoría, guardado explícito y visibilidad directa", () => {
  const root = process.cwd();
  const panel = readFileSync(new URL("../../client/src/features/admin/team-order/AttorneyOrderPanel.tsx", import.meta.url), "utf8");
  const team = readFileSync(new URL("../../client/src/pages/admin/AdminTeam.tsx", import.meta.url), "utf8");
  const routes = readFileSync(new URL("../routes/adminTeamRoutes.ts", import.meta.url), "utf8");
  const partnerReconciliation = readFileSync(new URL("../../scripts/reconcile-partner-order.ts", import.meta.url), "utf8");
  const associateReconciliation = readFileSync(new URL("../../scripts/reconcile-associate-order.ts", import.meta.url), "utf8");
  const migrationRunner = readFileSync(new URL("../../scripts/run-migrations.mjs", import.meta.url), "utf8");

  assert.match(panel, /\/api\/admin\/team\/order/);
  assert.match(panel, /button-save-attorney-order/);
  assert.match(panel, /button-cancel-attorney-order/);
  assert.match(panel, /draggable/);
  assert.match(panel, /button-attorney-order-up-/);
  assert.match(panel, /button-attorney-order-down-/);
  assert.match(team, /switch-member-published-/);
  assert.match(team, /SelectItem value="counsel"/);
  assert.match(routes, /app\.get\("\/api\/admin\/team\/order"/);
  assert.match(routes, /app\.put\("\/api\/admin\/team\/order"/);
  assert.match(routes, /TEAM_ORDER_STALE/);
  assert.match(routes, /attorneyOrderVersion/);
  assert.match(routes, /invalidatePublicPageCache/);
  assert.match(panel, /orden alfabético por primer apellido/);
  assert.match(panel, /isAlphabeticalCategory/);
  assert.match(partnerReconciliation, /CONFIRM_PARTNER_ORDER_RECONCILIATION/);
  assert.match(partnerReconciliation, /LOCK TABLE team_members IN SHARE ROW EXCLUSIVE MODE/);
  assert.match(associateReconciliation, /CONFIRM_ASSOCIATE_ORDER_RECONCILIATION/);
  assert.match(associateReconciliation, /CURRENT_ASSOCIATE_ORDER/);
  assert.match(associateReconciliation, /MIRROR_ONLY_ASSOCIATE_NAMES/);
  assert.match(associateReconciliation, /Expected exactly/);
  assert.match(associateReconciliation, /LOCK TABLE team_members IN SHARE ROW EXCLUSIVE MODE/);
  assert.match(associateReconciliation, /published = false/);
  assert.match(readFileSync(new URL("../../migrations/20260829_0007_correct_alejandro_avila_accent.mjs", import.meta.url), "utf8"), /CORRECTED_NAME = "Alejandro Ávila"/);
  assert.match(readFileSync(new URL("../../migrations/20260829_0008_correct_ruben_villegas_accent.mjs", import.meta.url), "utf8"), /CORRECTED_NAME = "Rubén Villegas"/);
  const eugenioMigration = readFileSync(new URL("../../migrations/20260829_0009_unpublish_eugenio_chinchillas.mjs", import.meta.url), "utf8");
  assert.match(eugenioMigration, /SET published = false/);
  assert.doesNotMatch(eugenioMigration, /DELETE\s+FROM/i);
  assert.match(migrationRunner, /20260829_0007_correct_alejandro_avila_accent\.mjs/);
  assert.match(migrationRunner, /20260829_0008_correct_ruben_villegas_accent\.mjs/);
  assert.match(migrationRunner, /20260829_0009_unpublish_eugenio_chinchillas\.mjs/);
  assert.ok(existsSync(resolve(root, "package.json")));
});
