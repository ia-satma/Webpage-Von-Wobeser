import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("la capa final de estabilidad elimina alturas de viewport y protege el primer render del testimonial", () => {
  const styles = readFileSync(new URL("../../frontend-mirror/templates/beez3/css/vwb-stability.css", import.meta.url), "utf8");

  assert.match(styles, /\.home \.home__intro--wrap\s*\{[\s\S]*?height:\s*auto\s*!important;[\s\S]*?min-height:\s*0\s*!important;[\s\S]*?padding-block:\s*clamp\(2rem, 4vw, 3\.5rem\)\s*!important;/);
  assert.match(styles, /\.home \.home__intro\s*\{\s*padding-block:\s*clamp\(2rem, 4vw, 3\.75rem\)\s*!important;/);
  assert.match(styles, /\.home \.home__intro:not\(\.slick-initialized\)\s*\{[\s\S]*?height:\s*auto\s*!important;[\s\S]*?overflow:\s*hidden;/);
  assert.match(styles, /\.home \.home__intro:not\(\.slick-initialized\) \.home__intro--item:not\(:first-child\)\s*\{\s*display:\s*none;/);
  assert.match(styles, /\.home__hero \+ section \.home__rojo\s*\{\s*margin-top:\s*0;/);
  assert.doesNotMatch(styles, /100vh|100svh|\d+vh/);
});
