import assert from "node:assert/strict";
import test from "node:test";

const { default: setEdmondGriegerPublicName } = await import("../../migrations/20260827_0001_edmond_grieger_public_name.mjs");

test("la migración de Edmond cambia sólo la presentación y conserva identidad", async () => {
  const calls: Array<{ sql: string; values: unknown[] }> = [];
  const client = {
    async query(sql: string, values: unknown[] = []) {
      calls.push({ sql, values });
      if (/SELECT id, name, slug FROM team_members/i.test(sql)) {
        return { rowCount: 1, rows: [{ id: "edmond-id", slug: "edmond-grieger", name: "Edmond Frederic Grieger" }] };
      }
      if (/UPDATE team_members/i.test(sql)) {
        return {
          rowCount: 1,
          rows: [{
            id: "edmond-id",
            slug: "edmond-grieger",
            name: "Edmond Frederic Grieger",
            given_names: "Edmond",
            first_surname: "Grieger",
            second_surname: null,
          }],
        };
      }
      throw new Error(`Unexpected query: ${sql}`);
    },
  };

  await setEdmondGriegerPublicName(client as any);

  assert.equal(calls.length, 2);
  assert.match(calls[0].sql, /WHERE slug = \$1 FOR UPDATE/);
  assert.deepEqual(calls[0].values, ["edmond-grieger"]);
  assert.match(calls[1].sql, /SET given_names = \$1,\s*first_surname = \$2,\s*second_surname = NULL/i);
  assert.deepEqual(calls[1].values, ["Edmond", "Grieger", "edmond-id"]);
  assert.doesNotMatch(calls[1].sql, /SET\s+name\s*=/i);
  assert.doesNotMatch(calls[1].sql, /SET\s+slug\s*=/i);
});

test("la migración rechaza una identidad distinta bajo el slug protegido", async () => {
  const client = {
    async query() {
      return { rowCount: 1, rows: [{ id: "wrong", slug: "edmond-grieger", name: "Edmond G. Grieger" }] };
    },
  };

  await assert.rejects(
    setEdmondGriegerPublicName(client as any),
    /Refusing to update unexpected attorney identity/,
  );
});
