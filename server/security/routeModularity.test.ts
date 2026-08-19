import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { Express } from "express";

const BASELINE_ROUTE_COUNT = 196;
const BASELINE_ROUTE_SHA256 = "1d16bf8c7a9182c3b71eaf9d143e812db44b3758b94b7c32758befeda15551cd";

type RouteMethod = "get" | "post" | "put" | "patch" | "delete" | "all" | "use";

function createRouteRecorder() {
  const routes: string[] = [];
  const app: Record<string, unknown> = {};
  for (const method of ["get", "post", "put", "patch", "delete", "all", "use"] as RouteMethod[]) {
    app[method] = (path: string | string[]) => {
      const paths = Array.isArray(path) ? path : [path];
      for (const routePath of paths) routes.push(`${method.toUpperCase()} ${routePath}`);
      return app;
    };
  }
  return { app: app as unknown as Express, routes };
}

test("la modularización conserva exactamente los 196 métodos, rutas y su orden", async () => {
  process.env.DATABASE_URL ||= "postgresql://route-contract:route-contract@127.0.0.1:5432/route-contract";
  const [
    { registerAdminAccessRoutes },
    { registerAdminCatalogRoutes },
    { registerAdminKnowledgeRoutes },
    { registerAdminMediaRoutes },
    { registerAdminNewsRoutes },
    { registerAdminSubmissionRoutes },
    { registerAdminTeamRoutes },
    { registerAgentAssetHistoryRoutes },
    { registerAgentPipelineRoutes },
    { registerDiscoveryRoutes },
    { registerLanguageDetectionRoutes },
    { registerNewsWorkflowRoutes },
    { registerOfficeImageRoutes },
    { registerPublicAssetRoutes },
    { registerPublicContentRoutes },
    { registerPublicNewsRoutes },
    { registerPublicUploadRoutes },
    { registerSystemAuditRoutes },
    { registerTranslationRoutes },
  ] = await Promise.all([
    import("../routes/adminAccessRoutes"),
    import("../routes/adminCatalogRoutes"),
    import("../routes/adminKnowledgeRoutes"),
    import("../routes/adminMediaRoutes"),
    import("../routes/adminNewsRoutes"),
    import("../routes/adminSubmissionRoutes"),
    import("../routes/adminTeamRoutes"),
    import("../routes/agentAssetHistoryRoutes"),
    import("../routes/agentPipelineRoutes"),
    import("../routes/discoveryRoutes"),
    import("../routes/languageDetectionRoutes"),
    import("../routes/newsWorkflowRoutes"),
    import("../routes/officeImageRoutes"),
    import("../routes/publicAssetRoutes"),
    import("../routes/publicContentRoutes"),
    import("../routes/publicNewsRoutes"),
    import("../routes/publicUploadRoutes"),
    import("../routes/systemAuditRoutes"),
    import("../routes/translationRoutes"),
  ]);
  const { app, routes } = createRouteRecorder();

  registerPublicAssetRoutes(app);
  registerLanguageDetectionRoutes(app);
  registerPublicNewsRoutes(app);
  registerOfficeImageRoutes(app);
  registerAgentAssetHistoryRoutes(app);
  registerPublicContentRoutes(app);
  registerDiscoveryRoutes(app);
  registerPublicUploadRoutes(app);
  await registerAdminAccessRoutes(app);
  registerAdminNewsRoutes(app);
  registerAdminTeamRoutes(app);
  registerAdminCatalogRoutes(app);
  registerAdminSubmissionRoutes(app);
  registerAdminKnowledgeRoutes(app);
  registerAdminMediaRoutes(app);
  registerNewsWorkflowRoutes(app);
  registerTranslationRoutes(app);
  registerAgentPipelineRoutes(app, () => undefined);
  registerSystemAuditRoutes(app);
  routes.push("USE /api/agents");

  const digest = createHash("sha256").update(routes.join("\n")).digest("hex");
  assert.equal(routes.length, BASELINE_ROUTE_COUNT);
  assert.equal(digest, BASELINE_ROUTE_SHA256);
});

test("routes.ts queda como compositor pequeño y registra todos los dominios una sola vez", () => {
  const source = readFileSync(new URL("../routes.ts", import.meta.url), "utf8");
  const registrations = [
    "registerPublicAssetRoutes",
    "registerLanguageDetectionRoutes",
    "registerPublicNewsRoutes",
    "registerOfficeImageRoutes",
    "registerAgentAssetHistoryRoutes",
    "registerPublicContentRoutes",
    "registerDiscoveryRoutes",
    "registerPublicUploadRoutes",
    "registerAdminAccessRoutes",
    "registerAdminNewsRoutes",
    "registerAdminTeamRoutes",
    "registerAdminCatalogRoutes",
    "registerAdminSubmissionRoutes",
    "registerAdminKnowledgeRoutes",
    "registerAdminMediaRoutes",
    "registerNewsWorkflowRoutes",
    "registerTranslationRoutes",
    "registerAgentPipelineRoutes",
    "registerSystemAuditRoutes",
  ];

  let previous = -1;
  for (const registration of registrations) {
    const call = source.indexOf(`${registration}(app`);
    assert.ok(call > previous, `${registration} debe conservar su posición en el compositor`);
    assert.equal(source.indexOf(`${registration}(app`, call + 1), -1, `${registration} no debe duplicarse`);
    previous = call;
  }
  assert.ok(source.split("\n").length <= 250, "routes.ts no debe volver a convertirse en un archivo monolítico");
});
