import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import partnerSince2026 from "../content/partnerSince2026.json";

const migrationModule = await import("../../migrations/20260910_0005_correct_michel_llorens_partner_since_year.mjs");
const { default: correctMichelLlorensPartnerSinceYear } = migrationModule;

function createClient(partnerSinceYear = 2024) {
  const record = {
    id: "michel-llorens-id",
    slug: "michel-llorens",
    name: "Michel Llorens",
    title: "Partner",
    is_partner: true,
    partner_since_year: partnerSinceYear,
    show_partner_since: true,
    published: true,
  };
  let updates = 0;

  return {
    record,
    updateCount: () => updates,
    client: {
      query: async (statement: string, values: unknown[] = []) => {
        if (statement.includes("SELECT id, slug, name, title, is_partner, partner_since_year") && statement.includes("FOR UPDATE")) {
          return { rowCount: 1, rows: [record] };
        }
        if (statement.includes("UPDATE team_members")) {
          assert.deepEqual(values, [2026, record.id, "michel-llorens", "Michel Llorens", "Partner", 2024]);
          assert.equal(record.partner_since_year, 2024);
          record.partner_since_year = 2026;
          updates += 1;
          return { rowCount: 1, rows: [{ ...record }] };
        }
        throw new Error(`Unexpected query: ${statement}`);
      },
    },
  };
}

test("el catálogo editorial corrige a Michel Llorens como Socio desde 2026", () => {
  const michel = partnerSince2026.entries.find((entry) => entry.slug === "michel-llorens");
  assert.equal(michel?.year, 2026);
});

test("la migración cambia sólo el valor heredado 2024 y conserva el perfil", async () => {
  const { client, record, updateCount } = createClient();
  await correctMichelLlorensPartnerSinceYear(client);
  assert.equal(record.partner_since_year, 2026);
  assert.equal(record.show_partner_since, true);
  assert.equal(record.published, true);
  assert.equal(updateCount(), 1);

  await correctMichelLlorensPartnerSinceYear(client);
  assert.equal(updateCount(), 1);
});

test("la migración protege una edición administrativa distinta", async () => {
  const { client, updateCount } = createClient(2025);
  await assert.rejects(
    () => correctMichelLlorensPartnerSinceYear(client),
    /was changed in Administration; refusing to overwrite/i,
  );
  assert.equal(updateCount(), 0);
});

test("el runner autoriza la corrección puntual sin cambios de esquema o conteos", async () => {
  const runner = await readFile(new URL("../../scripts/run-migrations.mjs", import.meta.url), "utf8");
  assert.match(runner, /20260910_0005_correct_michel_llorens_partner_since_year\.mjs/);
  assert.match(runner, /allowedCountChanges:\s*new Set\(\)/);
});
