import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationModule = await import("../../migrations/20260911_0001_reposition_pablo_fautsch_and_jessika_rocha.mjs");
const { default: repositionPabloFautschAndJessikaRocha } = migrationModule;

const previousSegment = [
  ["pablo-fautsch", "Pablo Fautsch", 12],
  ["jessika-rocha", "Jessika Rocha", 13],
  ["raymundo-soberanis", "Raymundo Soberanis", 14],
  ["pablo-jimenez", "Pablo Jiménez", 15],
  ["ariel-garfio", "Ariel Garfio", 16],
] as const;

const targetOrder = new Map([
  ["pablo-fautsch", 14],
  ["jessika-rocha", 15],
  ["raymundo-soberanis", 12],
  ["pablo-jimenez", 13],
  ["ariel-garfio", 16],
]);

function createClient(orders = new Map(previousSegment.map(([slug, _name, order]) => [slug, order]))) {
  const records = previousSegment.map(([slug, name]) => ({
    id: `${slug}-id`,
    slug,
    name,
    title: "Partner",
    is_partner: true,
    sort_order: orders.get(slug),
    published: true,
  }));
  let updates = 0;

  return {
    records,
    updateCount: () => updates,
    client: {
      query: async (statement: string, values: unknown[] = []) => {
        if (statement.includes("SELECT id, slug, name, title, is_partner") && statement.includes("FOR UPDATE")) {
          return { rowCount: records.length, rows: records };
        }
        if (statement.includes("UPDATE team_members")) {
          const [nextOrder, id, slug, name, previousOrder] = values;
          const record = records.find((candidate) => candidate.id === id);
          assert.ok(record);
          assert.equal(slug, record.slug);
          assert.equal(name, record.name);
          assert.equal(previousOrder, record.sort_order);
          assert.equal(nextOrder, targetOrder.get(record.slug));
          record.sort_order = Number(nextOrder);
          updates += 1;
          return { rowCount: 1, rows: [{ ...record }] };
        }
        throw new Error(`Unexpected query: ${statement}`);
      },
    },
  };
}

test("la migración mueve únicamente el tramo aprobado de cinco Socios", async () => {
  const { client, records, updateCount } = createClient();
  await repositionPabloFautschAndJessikaRocha(client);
  assert.equal(updateCount(), 4);
  assert.deepEqual(
    [...records]
      .sort((left, right) => Number(left.sort_order) - Number(right.sort_order))
      .map((member) => member.name),
    ["Raymundo Soberanis", "Pablo Jiménez", "Pablo Fautsch", "Jessika Rocha", "Ariel Garfio"],
  );
  assert.equal(records.every((member) => member.published), true);

  await repositionPabloFautschAndJessikaRocha(client);
  assert.equal(updateCount(), 4);
});

test("la migración rechaza un orden administrativamente modificado", async () => {
  const orders = new Map(previousSegment.map(([slug, _name, order]) => [slug, order]));
  orders.set("pablo-fautsch", 11);
  const { client, updateCount } = createClient(orders);
  await assert.rejects(
    () => repositionPabloFautschAndJessikaRocha(client),
    /was changed in Administration; refusing to overwrite/i,
  );
  assert.equal(updateCount(), 0);
});

test("el runner permite la corrección de orden sin modificar esquema ni conteos", async () => {
  const runner = await readFile(new URL("../../scripts/run-migrations.mjs", import.meta.url), "utf8");
  assert.match(runner, /20260911_0001_reposition_pablo_fautsch_and_jessika_rocha\.mjs/);
  assert.match(runner, /allowedCountChanges:\s*new Set\(\)/);
});
