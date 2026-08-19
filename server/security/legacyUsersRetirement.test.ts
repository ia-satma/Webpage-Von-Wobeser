import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

test("la retirada de users heredada es explícita, limitada a una tabla vacía y no imprime datos", async () => {
  const source = await readFile(
    path.join(process.cwd(), "scripts", "retire-legacy-users.mjs"),
    "utf8",
  );
  assert.match(source, /--confirm-empty-and-drop/);
  assert.match(source, /expectedColumns = \["id", "username", "password"\]/);
  assert.match(source, /select count\(\*\)::int as count from public\.users/i);
  assert.match(source, /drop table public\.users/i);
  assert.doesNotMatch(source, /select\s+\*\s+from\s+public\.users/i);
});
