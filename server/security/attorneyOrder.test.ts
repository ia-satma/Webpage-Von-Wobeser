import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { OFFICIAL_PARTNER_ORDER } from "@shared/attorneyOrder";

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

test("el panel ofrece orden por categoría, guardado explícito y visibilidad directa", () => {
  const root = process.cwd();
  const panel = readFileSync(new URL("../../client/src/features/admin/team-order/AttorneyOrderPanel.tsx", import.meta.url), "utf8");
  const team = readFileSync(new URL("../../client/src/pages/admin/AdminTeam.tsx", import.meta.url), "utf8");
  const routes = readFileSync(new URL("../routes/adminTeamRoutes.ts", import.meta.url), "utf8");
  const reconciliation = readFileSync(new URL("../../scripts/reconcile-partner-order.ts", import.meta.url), "utf8");

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
  assert.match(reconciliation, /CONFIRM_PARTNER_ORDER_RECONCILIATION/);
  assert.match(reconciliation, /LOCK TABLE team_members IN SHARE ROW EXCLUSIVE MODE/);
  assert.ok(root.endsWith("Webpage-Von-Wobeser"));
});
