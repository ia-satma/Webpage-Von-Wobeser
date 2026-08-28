import assert from "node:assert/strict";
import test from "node:test";

const migration = await import("../../migrations/20260828_0001_correct_contact_map_directions.mjs");

test("la migración de indicaciones sustituye sólo el destino histórico de la oficina", async () => {
  const calls: Array<{ sql: string; values: unknown[] }> = [];
  const client = {
    async query(sql: string, values: unknown[] = []) {
      calls.push({ sql, values });
      return {
        rowCount: 1,
        rows: [{ key: "office_map_directions", value: migration.OFFICE_DIRECTIONS_URL, value_es: migration.OFFICE_DIRECTIONS_URL }],
      };
    },
  };

  await migration.default(client as any);

  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /WHERE key = \$2\s+AND \(value = \$3 OR value_es = \$3\)/i);
  assert.deepEqual(calls[0].values, [
    migration.OFFICE_DIRECTIONS_URL,
    "office_map_directions",
    "https://www.google.com/maps/dir/?api=1&destination=19.427559,-99.195333",
  ]);
  assert.match(String(calls[0].values[0]), /Torre%20SOMA%20Chapultepec/);
  assert.match(String(calls[0].values[0]), /Arqu%C3%ADmedes%2010/);
});

test("la migración no falla ni reemplaza una URL que Administración ya modificó", async () => {
  const client = {
    async query() {
      return { rowCount: 0, rows: [] };
    },
  };

  await assert.doesNotReject(migration.default(client as any));
});
