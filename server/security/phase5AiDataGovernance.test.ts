import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { ALL_AGENT_IDS } from "../../shared/agentConstants";
import {
  AI_GOVERNANCE_POLICY_VERSION,
  AI_DATA_CLASSIFICATIONS,
} from "../../shared/aiGovernance";
import { executeAiProviderCall } from "../ai/gateway";
import { inspectAiData } from "../ai/dataGovernance";
import { isDurableAiGovernanceAuditEnabled } from "../ai/governanceAudit";
import { AI_AGENT_RUNTIME_POLICY } from "../ai/policy";
import {
  buildProtectedFieldEnvelopes,
  decryptProtectedFieldForRecovery,
} from "./fieldEncryption";

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");

function runtimeSourceFiles(relativeDirectory: string): string[] {
  const directory = path.join(root, relativeDirectory);
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) return runtimeSourceFiles(relativePath);
    if (!entry.isFile() || !/\.(?:ts|mjs)$/.test(entry.name) || entry.name.endsWith(".test.ts")) return [];
    return [relativePath];
  });
}

test("the executable AI policy covers exactly the 14 canonical agents", () => {
  assert.equal(AI_GOVERNANCE_POLICY_VERSION, "2.0.0");
  assert.deepEqual(Object.keys(AI_AGENT_RUNTIME_POLICY).sort(), [...ALL_AGENT_IDS].sort());
  assert.equal(Object.values(AI_AGENT_RUNTIME_POLICY).filter((item) => item.usesExternalProvider).length, 12);
  assert.equal(Object.values(AI_AGENT_RUNTIME_POLICY).filter((item) => !item.usesExternalProvider).length, 2);
  assert.equal(AI_DATA_CLASSIFICATIONS.length, 5);
  for (const policy of Object.values(AI_AGENT_RUNTIME_POLICY)) {
    assert.equal(policy.humanReviewRequired, true);
    assert.ok(policy.purpose.length > 3);
    assert.deepEqual(
      policy.usesExternalProvider ? [...policy.allowedClassifications] : [],
      policy.usesExternalProvider ? ["public", "internal"] : [],
    );
  }
});

test("the data gate allows harmless public/internal material and blocks restricted or detected data", () => {
  const base = {
    purpose: "security_test",
    source: "admin_tool" as const,
  };
  for (const classification of ["public", "internal"] as const) {
    const decision = inspectAiData({ ...base, classification }, "Panorama regulatorio sin datos personales");
    assert.equal(decision.allowed, true);
    assert.deepEqual(decision.reasonCodes, []);
    assert.match(decision.contentSha256, /^[a-f0-9]{64}$/);
  }

  for (const classification of ["personal", "confidential", "privileged"] as const) {
    const decision = inspectAiData({ ...base, classification }, "Contenido de prueba");
    assert.equal(decision.allowed, false);
    assert.ok(decision.reasonCodes.includes(`classification_${classification}_blocked`));
  }

  const detected = inspectAiData(
    { ...base, classification: "internal" },
    "Contacto de prueba persona@example.com; material estrictamente confidencial.",
  );
  assert.equal(detected.allowed, false);
  assert.ok(detected.reasonCodes.includes("personal_email"));
  assert.ok(detected.reasonCodes.includes("express_confidentiality"));

  const numericIdentifier = inspectAiData(
    { ...base, classification: "internal" },
    { reference: 123456789012345678n },
  );
  assert.equal(numericIdentifier.allowed, false);
  assert.ok(numericIdentifier.reasonCodes.includes("financial_identifier"));

  const oversized = inspectAiData(
    { ...base, classification: "internal" },
    "x".repeat(500_001),
  );
  assert.equal(oversized.allowed, false);
  assert.ok(oversized.reasonCodes.includes("inspection_truncated"));
});

test("the central gateway fails closed before invoking a provider", async () => {
  let invoked = 0;
  await assert.rejects(
    executeAiProviderCall({
      context: {
        classification: "personal",
        purpose: "security_test",
        source: "admin_tool",
      },
      payload: "dato personal simulado",
      provider: "openai",
      operation: "chat",
      metered: false,
      invoke: async () => {
        invoked += 1;
        return "should-not-run";
      },
    }),
    (error: unknown) => (
      error instanceof Error
      && error.name === "AiGovernanceBlockedError"
      && (error as Error & { code?: string }).code === "AI_DATA_GOVERNANCE_BLOCKED"
    ),
  );
  assert.equal(invoked, 0);
});

test("production governance audit cannot be disabled by configuration", () => {
  assert.equal(isDurableAiGovernanceAuditEnabled({ NODE_ENV: "production" }), true);
  assert.equal(isDurableAiGovernanceAuditEnabled({
    NODE_ENV: "production",
    AI_GOVERNANCE_AUDIT_ENABLED: "false",
  }), true);
  assert.equal(isDurableAiGovernanceAuditEnabled({ NODE_ENV: "test" }), false);
});

test("all runtime provider operations are wrapped by the central gateway", () => {
  const runtimeFiles = [
    ...runtimeSourceFiles("server"),
    ...runtimeSourceFiles("services"),
  ];
  const providerCall = /(?:chat\.completions\.create|images\.generate|audio\.speech\.create|responses\.create|models\.generateContent)\s*\(/g;
  let total = 0;
  for (const relativePath of runtimeFiles) {
    const source = read(relativePath);
    for (const match of source.matchAll(providerCall)) {
      total += 1;
      const start = Math.max(0, (match.index || 0) - 900);
      const context = source.slice(start, (match.index || 0) + match[0].length + 100);
      assert.match(context, /executeAiProviderCall\s*\(\s*\{/);
      assert.match(context, /invoke:\s*\(\)\s*=>/);
    }
  }
  assert.equal(total, 11);
});

test("additive field encryption is opt-in, authenticated and does not fingerprint plaintext", () => {
  const resourceId = "11111111-1111-4111-8111-111111111111";
  const encodedKey = Buffer.alloc(32, 7).toString("base64url");
  assert.deepEqual(buildProtectedFieldEnvelopes(
    "contact_submission",
    resourceId,
    { email: "persona@example.com" },
    {},
  ), []);

  const [envelope] = buildProtectedFieldEnvelopes(
    "contact_submission",
    resourceId,
    { email: "persona@example.com" },
    {
      APP_FIELD_ENCRYPTION_DUAL_WRITE: "true",
      APP_FIELD_ENCRYPTION_KEY: encodedKey,
      APP_FIELD_ENCRYPTION_KEY_ID: "test-key-v1",
    },
  );
  assert.ok(envelope);
  assert.equal(
    decryptProtectedFieldForRecovery(envelope, encodedKey),
    "persona@example.com",
  );
  assert.equal(
    envelope.contentSha256,
    crypto.createHash("sha256").update(envelope.ciphertext, "utf8").digest("hex"),
  );
  assert.notEqual(
    envelope.contentSha256,
    crypto.createHash("sha256").update("persona@example.com", "utf8").digest("hex"),
  );

  const parts = envelope.ciphertext.split(".");
  parts[3] = `${parts[3].startsWith("A") ? "B" : "A"}${parts[3].slice(1)}`;
  assert.throws(() => decryptProtectedFieldForRecovery({ ...envelope, ciphertext: parts.join(".") }, encodedKey));
});

test("phase 5 migration is additive and cannot touch protected business tables", () => {
  const migration = read("migrations/20260820_0003_ai_data_governance.sql");
  assert.doesNotMatch(migration, /\b(?:DROP|TRUNCATE|DELETE|UPDATE|RENAME|REPLACE)\b/i);
  assert.doesNotMatch(
    migration,
    /ALTER\s+TABLE\s+(?:news|team_members|career_applications|contact_submissions|media_items|admin_users)\b/i,
  );
  const statements = migration.split(";").map((value) => value.trim()).filter(Boolean);
  assert.ok(statements.length > 0);
  for (const statement of statements) {
    assert.match(
      statement,
      /^(?:ALTER\s+TABLE\s+agent_knowledge\s+ADD\s+COLUMN|CREATE\s+TABLE|CREATE\s+(?:UNIQUE\s+)?INDEX)\b/i,
    );
  }
});

test("agent knowledge requires its independent permission and explicit human approval", () => {
  const auth = read("server/auth.ts");
  const routes = read("server/routes/adminKnowledgeRoutes.ts");
  const persistence = read("server/agents/storage/DatabasePersistence.ts");
  const baseAgent = read("server/agents/core/BaseAgent.ts");
  const schema = read("shared/schema/agentsAudits.ts");
  assert.match(auth, /"agent_knowledge_admin"/);
  assert.match(routes, /requirePermission\("agent_knowledge_admin"\)/);
  assert.match(routes, /aiUseConfirmed:\s*z\.literal\(true\)/);
  assert.match(routes, /approvedForAiAt:\s*new Date\(\)/);
  assert.match(persistence, /getApprovedKnowledgeByAgent/);
  assert.match(persistence, /inArray\(agentKnowledge\.dataClassification, \['public', 'internal'\]\)/);
  assert.match(baseAgent, /knowledgeStore\.getApprovedDocuments/);
  assert.match(schema, /default\(["']unclassified["']\)/);
});

test("database role separation is fail-closed when Systems enables enforcement", () => {
  const appDb = read("server/db.ts");
  const migrationRunner = read("scripts/run-migrations.mjs");
  assert.match(appDb, /appDatabaseUrl = process\.env\.DATABASE_APP_URL/);
  assert.match(appDb, /rawConnectionString = appDatabaseUrl \|\| process\.env\.DATABASE_URL/);
  assert.match(appDb, /REQUIRE_SEPARATE_DATABASE_ROLES/);
  assert.match(appDb, /Application and migration database credentials must be different/);
  assert.match(migrationRunner, /DATABASE_MIGRATION_URL \|\| process\.env\.DATABASE_URL/);
  assert.match(migrationRunner, /DATABASE_MIGRATION_URL is required when separate database roles are enforced/);
  assert.match(migrationRunner, /Application and migration database credentials must be different/);
});

test("presentation and knowledge UIs reset confirmation when governed content changes", () => {
  const presentations = read("client/src/pages/admin/AdminPresentations.tsx");
  const quickUse = read("client/src/components/admin/AgentUseCenter.tsx");
  const knowledge = read("client/src/features/admin/knowledge/KnowledgeDocumentDialogs.tsx");
  const image = read("client/src/components/admin/ImageGenButton.tsx");
  const imageRoute = read("server/routes/adminAccessRoutes.ts");
  assert.match(presentations, /setAiUseConfirmed\(false\)/);
  assert.match(presentations, /aiUseConfirmed:\s*true/);
  assert.match(quickUse, /setAiUseConfirmed\(false\)/);
  assert.match(quickUse, /dataClassification/);
  assert.match(knowledge, /setValue\("aiUseConfirmed", false\)/);
  assert.match(image, /confirmedPrompt === currentPrompt/);
  assert.match(image, /\[currentPrompt, dataClassification\]/);
  assert.match(image, /aiUseConfirmed:\s*true/);
  assert.match(imageRoute, /dataClassification:\s*z\.enum\(\["public", "internal"\]\)/);
  assert.match(imageRoute, /aiUseConfirmed:\s*z\.literal\(true\)/);
});
