import assert from "node:assert/strict";
import test from "node:test";

const migration = await import("../../migrations/20260828_0002_set_verified_contact_map_destination.mjs");

test("la migración usa exactamente el domicilio verificado para las indicaciones", async () => {
  const calls: Array<{ sql: string; values: unknown[] }> = [];
  const client = {
    async query(sql: string, values: unknown[] = []) {
      calls.push({ sql, values });
      return {
        rowCount: 1,
        rows: [{ key: "office_map_directions", value: migration.VERIFIED_DIRECTIONS_URL, value_es: migration.VERIFIED_DIRECTIONS_URL }],
      };
    },
  };

  await migration.default(client as any);

  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /value = ANY\(\$3::text\[\]\) OR value_es = ANY\(\$3::text\[\]\)/i);
  assert.deepEqual(calls[0].values, [
    migration.VERIFIED_DIRECTIONS_URL,
    "office_map_directions",
    [
      "https://www.google.com/maps/dir/?api=1&destination=19.427559,-99.195333",
      "https://www.google.com/maps/dir/?api=1&destination=Torre%20SOMA%20Chapultepec%2C%20Piso%2018%2C%20Campos%20El%C3%ADseos%20204%2C%20Polanco%2C%20acceso%20por%20Calle%20Arqu%C3%ADmedes%2010%2C%2011550%2C%20Ciudad%20de%20M%C3%A9xico",
    ],
  ]);
  assert.match(String(calls[0].values[0]), /Campos%20El%C3%ADseos%20204/);
  assert.match(String(calls[0].values[0]), /Polanco%20IV%20Secc/);
  assert.match(String(calls[0].values[0]), /Miguel%20Hidalgo/);
});

test("la migración deja intacta una URL distinta guardada desde Administración", async () => {
  const client = { async query() { return { rowCount: 0, rows: [] }; } };
  await assert.doesNotReject(migration.default(client as any));
});
