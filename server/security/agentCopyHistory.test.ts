import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { sanitizeCms } from "../mirror/sanitize";

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");

test("el historial de copys cubre solo los nueve agentes editoriales reutilizables", () => {
  const history = read("server/agents/storage/CopyHistory.ts");
  for (const agent of ["formatter", "polyglot_translator", "seo_optimizer", "content_analyzer", "category_agent", "metadata_linker", "social_media", "newsletter", "legal_alerts"]) {
    assert.match(history, new RegExp(`"${agent}"`));
  }
  assert.doesNotMatch(history, /"voice_agent",\s*"presentation_generator"/);
});

test("las instantáneas preservan texto seguro y eliminan marcado al copiar", () => {
  const safe = sanitizeCms('<p>Texto <strong>editorial</strong><script>alert(1)</script></p>');
  const plain = safe.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  assert.match(safe, /<strong>editorial<\/strong>/);
  assert.doesNotMatch(safe, /script/i);
  assert.match(plain, /Texto editorial/);
  assert.doesNotMatch(plain, /alert/);
});

test("la migración es aditiva y conserva relaciones aunque se elimine su origen", () => {
  const migration = read("migrations/20260813_0001_agent_copy_history.sql");
  assert.match(migration, /CREATE TABLE IF NOT EXISTS agent_copy_history/i);
  assert.match(migration, /ON DELETE SET NULL/g);
  assert.match(migration, /CREATE UNIQUE INDEX IF NOT EXISTS agent_copy_history_source_job_unique/i);
  assert.doesNotMatch(migration, /\b(?:DROP\s+TABLE|ALTER\s+TABLE|DELETE\s+FROM|UPDATE\s+\w+\s+SET)\b/i);
});

test("las APIs de copys son privadas, archivables y sin borrado definitivo", () => {
  const routes = read("server/routes.ts");
  const page = read("client/src/pages/admin/AdminCopyHistory.tsx");
  const nav = read("client/src/lib/adminNav.ts");
  assert.match(routes, /app\.get\("\/api\/admin\/copies-ai", authMiddleware, requirePermission\("agents"\)/);
  assert.match(routes, /app\.post\("\/api\/admin\/copies-ai\/:id\/archive", authMiddleware, requirePermission\("agents"\)/);
  assert.doesNotMatch(routes, /app\.delete\("\/api\/admin\/copies-ai/);
  assert.match(page, /La instantánea no puede editarse ni eliminarse/);
  assert.match(page, /Copiar texto/);
  assert.match(nav, /href: "\/admin\/copies-ai"/);
});

test("la captura central se ejecuta para solicitudes inmediatas, pipelines y cola", () => {
  const orchestrator = read("server/agents/core/AgentOrchestrator.ts");
  const routes = read("server/agents/api/agentRoutes.ts");
  assert.match(orchestrator, /persistAgentCopySnapshot/);
  assert.match(orchestrator, /origin: execution\.origin \|\| 'manual'/);
  assert.match(orchestrator, /origin: options\.origin \|\| 'pipeline'/);
  assert.match(orchestrator, /origin: 'scheduled'/);
  assert.match(routes, /copyHistoryId/);
  assert.match(routes, /actorId: req\.adminUser\?\.id \|\| null/);
});
