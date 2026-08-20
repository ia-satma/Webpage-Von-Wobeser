import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");

test("la bitácora descarta detalles sensibles y estructuras complejas", async () => {
  process.env.DATABASE_URL ||= "postgresql://phase4-test:unused@127.0.0.1:1/never_connect";
  const { sanitizeAuditDetails, auditResourceFromRoute } = await import("./adminAudit");
  assert.deepEqual(sanitizeAuditDetails({
    archived: true,
    count: 3,
    sourceId: "7de1ed5d-6c66-4fee-9ef6-54eaa0a0a68b",
    email: "persona@example.com",
    ipAddress: "192.0.2.1",
    prompt: "contenido",
    accessToken: "secreto",
    payload: { nested: true },
    labels: ["uno"],
    freeform: "texto con espacios",
  }), {
    archived: true,
    count: 3,
    sourceId: "7de1ed5d-6c66-4fee-9ef6-54eaa0a0a68b",
  });
  assert.equal(auditResourceFromRoute("/api/admin", "/news/:id"), "admin_news_item");

  const index = read("server/index.ts");
  assert.match(index, /req\.adminUser/);
  assert.match(index, /hasDurableAuditForRequest/);
  assert.match(index, /recordAdminAuditEvent/);
  assert.match(index, /res\.statusCode >= 200/);
});

test("las ventanas del scheduler son deterministas y UTC", async () => {
  process.env.DATABASE_URL ||= "postgresql://phase4-test:unused@127.0.0.1:1/never_connect";
  const { scheduledWindowStart } = await import("../scheduler/taskRunner");
  const instant = new Date("2026-08-20T17:42:59.999Z");
  assert.equal(scheduledWindowStart("security-maintenance", instant).toISOString(), "2026-08-20T17:00:00.000Z");
  assert.equal(scheduledWindowStart("website-audit", instant).toISOString(), "2026-08-20T00:00:00.000Z");
  assert.equal(scheduledWindowStart("legal-alerts", instant).toISOString(), "2026-08-20T12:00:00.000Z");
});

test("las migraciones de remediación son exclusivamente aditivas", () => {
  for (const migration of [
    "migrations/20260820_0001_private_presentations.sql",
    "migrations/20260820_0002_audit_scheduler_provenance.sql",
  ]) {
    const source = read(migration).replace(/\/\*[\s\S]*?\*\//g, " ").replace(/--[^\n]*/g, " ");
    const statements = source.split(";").map((statement) => statement.trim()).filter(Boolean);
    assert.ok(statements.length > 0);
    for (const statement of statements) {
      assert.match(statement, /^(?:CREATE\s+(?:UNIQUE\s+)?INDEX|CREATE\s+TABLE|ALTER\s+TABLE\s+[a-z0-9_".]+\s+ADD\s+COLUMN)\b/i);
    }
  }
});

test("el ejecutor de migraciones compara conteos y revierte ante diferencias", () => {
  const source = read("scripts/run-migrations.mjs");
  assert.match(source, /getPublicTableCounts/);
  assert.match(source, /assertProtectedCountsUnchanged/);
  assert.match(source, /Protected table counts changed/);
  assert.match(source, /await client\.query\("ROLLBACK"\)/);
  assert.match(source, /strictAdditiveStart = "20260820_0001"/);
});

test("las tareas usan lock, idempotencia y resultados sin datos libres", () => {
  const runner = read("server/scheduler/taskRunner.ts");
  assert.match(runner, /pg_try_advisory_lock/);
  assert.match(runner, /ON CONFLICT \(task_name, scheduled_for\) DO UPDATE/);
  assert.match(runner, /scheduled_task_runs\.status = 'failed'/);
  assert.match(runner, /TASK_EXECUTION_FAILED/);
  assert.match(runner, /sanitizeScheduledResult/);

  const command = read("scripts/run-scheduled-task.ts");
  assert.doesNotMatch(command, /runSecurityMaintenance\s*\(/);
  assert.match(command, /deleteExpiredSessionsByExactId/);
  assert.match(command, /applyChanges: false/);
  assert.doesNotMatch(command, /delete(?:TeamMember|News|Contact|Career|Media|Generated)/);

  const cleanup = read("server/security/expiredSessionCleanup.ts");
  assert.match(cleanup, /eq\(adminSessions\.id, candidate\.id\)/);
  assert.doesNotMatch(cleanup, /teamMembers|news|contactSubmissions|careerApplications|mediaItems|generatedPresentations/);
  assert.doesNotMatch(read("server/index.ts"), /setInterval\s*\(/);
});

test("CI conserva SBOM y procedencia con una acción fijada por SHA", () => {
  const workflow = read(".github/workflows/ci.yml");
  assert.match(workflow, /npm run verify:build-evidence/);
  assert.match(workflow, /actions\/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02/);
  assert.match(workflow, /dist\/sbom\.cdx\.json/);
  assert.match(workflow, /dist\/build-provenance\.json/);
  assert.match(workflow, /retention-days: 30/);

  const build = read("script/build.ts");
  assert.match(build, /generateBuildEvidence/);
  const evidence = read("script/buildEvidence.ts");
  assert.match(evidence, /generateCycloneDxSbom/);
  assert.match(evidence, /bomFormat: "CycloneDX"/);
  assert.match(evidence, /specVersion: "1\.5"/);
  assert.doesNotMatch(evidence, /npmSbom/);
  assert.match(evidence, /packageLockSha256/);
  assert.match(evidence, /publicAssetsSha256/);
  assert.match(evidence, /--untracked-files=no/);
});

test("el SBOM CycloneDX nace del lockfile sin invocar npm ni la red", async () => {
  const { generateCycloneDxSbom } = await import("../../script/buildEvidence");
  const bom = generateCycloneDxSbom({
    name: "synthetic-app",
    version: "1.0.0",
    packages: {
      "": { name: "synthetic-app", version: "1.0.0" },
      "node_modules/example": {
        name: "example",
        version: "2.0.0",
        integrity: `sha512-${Buffer.from("synthetic").toString("base64")}`,
      },
    },
  }, "2026-08-20T00:00:00.000Z") as any;
  assert.equal(bom.bomFormat, "CycloneDX");
  assert.equal(bom.specVersion, "1.5");
  assert.equal(bom.components.length, 1);
  assert.equal(bom.components[0].name, "example");
  assert.equal(bom.components[0].hashes[0].alg, "SHA-512");
});

test("la configuración Replit queda documentada pero deliberadamente no activada", () => {
  const runbook = read("docs/security/REPLIT_SCHEDULED_DEPLOYMENTS.md");
  assert.match(runbook, /código preparado; publicaciones programadas no activadas/i);
  assert.match(runbook, /America\/Monterrey/);
  assert.match(runbook, /npm run scheduled:security-maintenance/);
  assert.match(runbook, /npm run scheduled:website-audit/);
  assert.match(runbook, /npm run scheduled:legal-alerts/);
  assert.match(runbook, /No activar `legal-alerts` sin aprobación escrita/);
});
