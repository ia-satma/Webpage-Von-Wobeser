import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("los rótulos heredados se mantienen horizontales y dentro del flujo", () => {
  const css = fs.readFileSync(
    path.resolve(process.cwd(), "frontend-mirror/templates/beez3/css/von.css"),
    "utf8",
  );

  assert.match(css, /\.page--wrap \.page__ttl\s*\{[\s\S]*?flex:\s*0 0 100%/);
  assert.match(css, /\.page__ttl--holder > h1,[\s\S]*?transform:\s*none/);
  assert.doesNotMatch(css, /\.page__ttl--holder > h1\s*\{[\s\S]*?rotate\(-90deg\)/);
});
