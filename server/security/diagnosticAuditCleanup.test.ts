import test from "node:test";
import assert from "node:assert/strict";
import {
  applyCleanup,
  assertCleanupPlanIsSafe,
  buildCleanupPlan,
  parseCleanupArguments,
  type CleanupScopeRow,
} from "../../scripts/cleanup-diagnostic-audit-jobs";

const AUDIT_ID = "0be1189d-07c9-49c2-ab66-923eed279bf4";

function scopeRow(overrides: Partial<CleanupScopeRow> = {}): CleanupScopeRow {
  return {
    findingId: "finding-1",
    findingStatus: "in_progress",
    findingEntityId: "article-1",
    findingOwnerAgent: "seo_optimizer",
    remediationJobId: "job-1",
    jobId: "job-1",
    jobAgentType: "seo_optimizer",
    jobStatus: "pending",
    jobPayload: { articleId: "article-1" },
    ...overrides,
  };
}

test("diagnostic cleanup is dry-run by default and requires exact confirmation to apply", () => {
  assert.deepEqual(parseCleanupArguments([`--audit-id=${AUDIT_ID}`]), {
    auditId: AUDIT_ID,
    apply: false,
    confirmation: null,
  });
  assert.throws(
    () => parseCleanupArguments([`--audit-id=${AUDIT_ID}`, "--apply"]),
    /confirma el alcance/i,
  );
  assert.throws(
    () => parseCleanupArguments([`--audit-id=${AUDIT_ID}`, "--apply", "--confirm=11111111-1111-4111-8111-111111111111"]),
    /no coincide/i,
  );
  assert.equal(
    parseCleanupArguments([`--audit-id=${AUDIT_ID}`, "--apply", `--confirm=${AUDIT_ID}`]).apply,
    true,
  );
});

test("diagnostic cleanup deduplicates jobs while reopening every linked finding", () => {
  const plan = buildCleanupPlan([
    scopeRow(),
    scopeRow({ findingId: "finding-2" }),
    scopeRow({
      findingId: "finding-3",
      findingStatus: "open",
      findingEntityId: "article-2",
      remediationJobId: "job-2",
      jobId: "job-2",
      jobStatus: "completed",
      jobPayload: { articleId: "article-2", applyChanges: false },
    }),
  ]);

  assert.equal(plan.linkedFindings, 3);
  assert.equal(plan.uniqueJobs, 2);
  assert.deepEqual(plan.pendingJobIds, ["job-1"]);
  assert.deepEqual(plan.findingsToReopenIds.sort(), ["finding-1", "finding-2"]);
  assert.deepEqual(plan.jobsByStatus, { pending: 1, completed: 1 });
  assert.deepEqual(plan.safetyErrors, []);
  assert.doesNotThrow(() => assertCleanupPlanIsSafe(plan));
});

test("diagnostic cleanup blocks active, authorized or mismatched work", () => {
  const plan = buildCleanupPlan([
    scopeRow({ jobStatus: "in_progress" }),
    scopeRow({
      findingId: "finding-2",
      remediationJobId: "job-2",
      jobId: "job-2",
      jobPayload: { articleId: "article-1", applyChanges: true },
    }),
    scopeRow({
      findingId: "finding-3",
      remediationJobId: "job-3",
      jobId: "job-3",
      jobAgentType: "newsletter",
    }),
    scopeRow({
      findingId: "finding-4",
      remediationJobId: "job-4",
      jobId: "job-4",
      findingEntityId: "article-4",
    }),
  ]);

  assert.ok(plan.safetyErrors.some((message) => /trabajo\(s\) activos/i.test(message)));
  assert.ok(plan.safetyErrors.some((message) => /applyChanges=true/i.test(message)));
  assert.ok(plan.safetyErrors.some((message) => /agente no autorizado/i.test(message)));
  assert.ok(plan.safetyErrors.some((message) => /no coincide con la entidad/i.test(message)));
  assert.throws(() => assertCleanupPlanIsSafe(plan), /limpieza fue bloqueada/i);
});

function transactionalClient(options: { losePendingJob?: boolean } = {}) {
  const statements: string[] = [];
  return {
    statements,
    async query(text: string) {
      const normalized = text.replace(/\s+/g, " ").trim();
      statements.push(normalized);
      if (normalized === "BEGIN" || normalized === "COMMIT" || normalized === "ROLLBACK") {
        return { rows: [], rowCount: null };
      }
      if (normalized.includes("FROM website_audits")) {
        return {
          rows: [{ id: AUDIT_ID, status: "completed", started_at: new Date(), completed_at: new Date() }],
          rowCount: 1,
        };
      }
      if (normalized.startsWith("SELECT") && normalized.includes("FROM website_audit_findings")) {
        return {
          rows: [{
            id: "finding-1",
            status: "in_progress",
            entity_id: "article-1",
            owner_agent: "seo_optimizer",
            remediation_job_id: "job-1",
          }],
          rowCount: 1,
        };
      }
      if (normalized.startsWith("SELECT") && normalized.includes("FROM agent_jobs")) {
        return {
          rows: [{ id: "job-1", agent_type: "seo_optimizer", status: "pending", payload: { articleId: "article-1" } }],
          rowCount: 1,
        };
      }
      if (normalized.startsWith("UPDATE agent_jobs")) {
        const rows = options.losePendingJob ? [] : [{ id: "job-1" }];
        return { rows, rowCount: rows.length };
      }
      if (normalized.startsWith("UPDATE website_audit_findings")) {
        return { rows: [{ id: "finding-1" }], rowCount: 1 };
      }
      throw new Error(`Unexpected SQL in test: ${normalized}`);
    },
  };
}

test("diagnostic cleanup applies cancellation and reopening in one transaction", async () => {
  const client = transactionalClient();
  await applyCleanup(client as never, AUDIT_ID);
  assert.equal(client.statements[0], "BEGIN");
  assert.ok(client.statements.some((statement) => statement.startsWith("UPDATE agent_jobs")));
  assert.ok(client.statements.some((statement) => statement.startsWith("UPDATE website_audit_findings")));
  assert.equal(client.statements.at(-1), "COMMIT");
  assert.equal(client.statements.includes("ROLLBACK"), false);
});

test("diagnostic cleanup rolls back if the queue changes during the transaction", async () => {
  const client = transactionalClient({ losePendingJob: true });
  await assert.rejects(() => applyCleanup(client as never, AUDIT_ID), /cola cambió/i);
  assert.equal(client.statements.at(-1), "ROLLBACK");
  assert.equal(client.statements.includes("COMMIT"), false);
});
