import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

process.env.DATABASE_URL ||= "postgresql://test:test@127.0.0.1:5432/test";

const {
  publicAppearanceStateFromConfig,
  publicAppearanceStateRevision,
} = await import("../mirror/publicAppearanceConfiguration");
import type { ConfigMap } from "../mirror/siteConfig";

function config(values: Record<string, string>): ConfigMap {
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { value, valueEs: value, type: "select" }]));
}

test("los presets públicos tienen fallback cerrado y revisión determinista", () => {
  const defaults = publicAppearanceStateFromConfig(config({}));
  const active = publicAppearanceStateFromConfig(config({
    footer_active_preset: "classic-vwys",
    attorney_directory_active_preset: "classic-vwys",
  }));
  const invalid = publicAppearanceStateFromConfig(config({
    footer_active_preset: "<script>alert(1)</script>",
    attorney_directory_active_preset: "not-a-preset",
  }));

  assert.deepEqual(defaults, { footerPreset: "central-2026", attorneyDirectoryPreset: "editorial-2026" });
  assert.deepEqual(active, { footerPreset: "classic-vwys", attorneyDirectoryPreset: "classic-vwys" });
  assert.deepEqual(invalid, defaults);
  assert.notEqual(publicAppearanceStateRevision(defaults), publicAppearanceStateRevision(active));
  assert.equal(publicAppearanceStateRevision(defaults).length, 16);
});

test("panel y API de apariencia exigen configuración, revisión y limpieza de caché", () => {
  const routes = readFileSync(new URL("../mirror/routes/adminRoutes.ts", import.meta.url), "utf8");
  const configSource = readFileSync(new URL("../mirror/siteConfig.ts", import.meta.url), "utf8");
  const panel = readFileSync(new URL("../../client/src/features/admin/appearance/AdminPublicAppearancePage.tsx", import.meta.url), "utf8");
  const app = readFileSync(new URL("../../client/src/App.tsx", import.meta.url), "utf8");
  const navigation = readFileSync(new URL("../../client/src/lib/adminNav.ts", import.meta.url), "utf8");

  assert.match(routes, /public-appearance\/active-preset/);
  assert.match(routes, /requirePermission\("config"\)/);
  assert.match(routes, /PUBLIC_APPEARANCE_REVISION_STALE/);
  assert.match(routes, /pg_advisory_xact_lock\(hashtext\('vw-public-appearance-v1'\)\)/);
  assert.match(routes, /invalidatePublicPageCache\(\)/);
  assert.match(configSource, /footer_active_preset/);
  assert.match(configSource, /attorney_directory_active_preset/);
  assert.match(panel, /ConfirmChangesDialog/);
  assert.match(panel, /footer/);
  assert.match(panel, /attorney-directory/);
  assert.match(app, /admin\/public-appearance/);
  assert.match(navigation, /Diseños públicos/);
  assert.doesNotMatch(configSource + routes, /\b(?:ALTER|DROP|CREATE)\s+TABLE\b/i);
});
