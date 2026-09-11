import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import type { Express } from "express";
import type { MirrorRuntime } from "../mirror/runtime";

const BASELINE_ROUTE_COUNT = 218;
const BASELINE_ROUTE_SHA256 = "c27e0fa6e612e6e4b4e10c786fa28c9800ff61caf459b8b162e9453f90301fc6";

type RouteMethod = "get" | "post" | "put" | "patch" | "delete" | "all" | "use";

function createRouteRecorder() {
  const routes: string[] = [];
  const app: Record<string, unknown> = {};
  for (const method of ["get", "post", "put", "patch", "delete", "all", "use"] as RouteMethod[]) {
    app[method] = (...args: unknown[]) => {
      const rawPaths = Array.isArray(args[0]) ? args[0] : [args[0]];
      for (const path of rawPaths) {
        const label = typeof path === "string"
          ? path
          : path instanceof RegExp
            ? path.toString()
            : "<middleware>";
        routes.push(`${method.toUpperCase()} ${label}`);
      }
      return app;
    };
  }
  return { app: app as unknown as Express, routes };
}

function createRuntimeStub(): MirrorRuntime {
  const noop = async () => undefined;
  const fixed = {
    wrap: (handler: unknown) => handler,
    langOf: () => "es" as const,
    ids: { attorney: new Map(), practice: new Map(), industry: new Map() },
    pubIdMap: new Map(),
    mirrorDir: fileURLToPath(new URL("../../frontend-mirror", import.meta.url)),
  };
  return new Proxy(fixed, {
    get(target, property) {
      return property in target ? target[property as keyof typeof target] : noop;
    },
  }) as unknown as MirrorRuntime;
}

test("el espejo conserva exactamente sus 218 métodos, rutas y orden histórico", async () => {
  process.env.DATABASE_URL ||= "postgresql://mirror-contract:mirror-contract@127.0.0.1:5432/mirror-contract";
  const [
    { registerMirrorPublicRoutes },
    { registerMirrorLegacyRedirectRoutes },
    { registerMirrorInstitutionalRoutes },
    { registerMirrorOriginalRoutes },
    { registerMirrorAdminRoutes },
    { registerMirrorAssetAndFallbackRoutes },
  ] = await Promise.all([
    import("../mirror/routes/publicRoutes"),
    import("../mirror/routes/legacyRedirectRoutes"),
    import("../mirror/routes/institutionalRoutes"),
    import("../mirror/routes/originalRoutes"),
    import("../mirror/routes/adminRoutes"),
    import("../mirror/routes/assetFallbackRoutes"),
  ]);
  const { app, routes } = createRouteRecorder();
  const runtime = createRuntimeStub();

  registerMirrorPublicRoutes(app, runtime);
  registerMirrorLegacyRedirectRoutes(app, runtime);
  registerMirrorInstitutionalRoutes(app, runtime);
  registerMirrorOriginalRoutes(app, runtime);
  registerMirrorAdminRoutes(app, runtime);
  registerMirrorAssetAndFallbackRoutes(app, runtime);

  const digest = createHash("sha256").update(routes.join("\n")).digest("hex");
  assert.equal(routes.length, BASELINE_ROUTE_COUNT);
  assert.equal(digest, BASELINE_ROUTE_SHA256);
});

test("index.ts queda como compositor pequeño y registra cada dominio una sola vez", () => {
  const source = readFileSync(new URL("../mirror/index.ts", import.meta.url), "utf8");
  const runtime = readFileSync(new URL("../mirror/runtime.ts", import.meta.url), "utf8");
  const registrations = [
    "registerMirrorPublicRoutes",
    "registerMirrorLegacyRedirectRoutes",
    "registerMirrorInstitutionalRoutes",
    "registerMirrorOriginalRoutes",
    "registerMirrorAdminRoutes",
    "registerMirrorAssetAndFallbackRoutes",
  ];

  let previous = -1;
  for (const registration of registrations) {
    const call = source.indexOf(`${registration}(app`);
    assert.ok(call > previous, `${registration} debe conservar su posición en el compositor`);
    assert.equal(source.indexOf(`${registration}(app`, call + 1), -1, `${registration} no debe duplicarse`);
    previous = call;
  }
  assert.ok(source.split("\n").length <= 200, "mirror/index.ts no debe volver a ser monolítico");
  assert.doesNotMatch(source, /app\.(?:get|post|put|patch|delete|use)\s*\(/);
  assert.doesNotMatch(runtime, /app\.(?:get|post|put|patch|delete|use)\s*\(/);
});

test("la fachada conserva las exportaciones públicas del pipeline HTML", async () => {
  const facade = await import("../mirror/index");
  const pipeline = await import("../mirror/htmlPipeline");
  for (const name of [
    "LANG_TOGGLE_SCRIPT",
    "SEARCH_FORMS_SCRIPT",
    "hardenLegacyClientScripts",
    "injectFooterString",
    "navigationLabelsScript",
    "optimizeLegacyAssets",
    "optimizePublicImageTags",
  ] as const) {
    assert.equal(facade[name], pipeline[name]);
  }
});
