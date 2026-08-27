import assert from "node:assert/strict";
import test from "node:test";
import { serializeMigrationClientQueries } from "../../scripts/migration-query-serialization.mjs";

test("las migraciones serializan consultas concurrentes sobre un único cliente pg", async () => {
  let active = 0;
  let maxActive = 0;
  const calls: string[] = [];
  const client = {
    async query(statement: string) {
      active += 1;
      maxActive = Math.max(maxActive, active);
      calls.push(statement);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      return { statement };
    },
  };

  const serialized = serializeMigrationClientQueries(client);
  const results = await Promise.all([
    serialized.query("first"),
    serialized.query("second"),
    serialized.query("third"),
  ]);

  assert.equal(maxActive, 1);
  assert.deepEqual(calls, ["first", "second", "third"]);
  assert.deepEqual(results.map((result) => result.statement), ["first", "second", "third"]);
});

test("un error no bloquea consultas posteriores de una migración", async () => {
  const client = {
    async query(statement: string) {
      if (statement === "fails") throw new Error("expected migration failure");
      return { statement };
    },
  };
  const serialized = serializeMigrationClientQueries(client);

  await assert.rejects(serialized.query("fails"), /expected migration failure/);
  assert.deepEqual(await serialized.query("after-failure"), { statement: "after-failure" });
});
