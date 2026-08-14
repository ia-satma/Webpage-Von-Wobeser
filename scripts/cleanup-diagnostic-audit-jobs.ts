import path from "node:path";
import { pathToFileURL } from "node:url";

export const ALLOWED_REMEDIATION_AGENTS = new Set([
  "seo_optimizer",
  "polyglot_translator",
  "metadata_linker",
]);

const KNOWN_JOB_STATUSES = new Set([
  "pending",
  "in_progress",
  "completed",
  "failed",
  "cancelled",
]);

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface CleanupArguments {
  auditId: string;
  apply: boolean;
  confirmation: string | null;
}

export interface CleanupScopeRow {
  findingId: string;
  findingStatus: string;
  findingEntityId: string | null;
  findingOwnerAgent: string | null;
  remediationJobId: string;
  jobId: string | null;
  jobAgentType: string | null;
  jobStatus: string | null;
  jobPayload: Record<string, unknown> | null;
}

export interface CleanupPlan {
  linkedFindings: number;
  uniqueJobs: number;
  pendingJobIds: string[];
  inProgressJobIds: string[];
  findingsToReopenIds: string[];
  jobsByStatus: Record<string, number>;
  jobsByAgent: Record<string, number>;
  safetyErrors: string[];
}

interface QueryResult<Row> {
  rows: Row[];
  rowCount: number | null;
}

interface QueryClient {
  query<Row = Record<string, unknown>>(text: string, values?: unknown[]): Promise<QueryResult<Row>>;
}

interface AuditRow {
  id: string;
  status: string;
  started_at: Date | string | null;
  completed_at: Date | string | null;
}

interface FindingRow {
  id: string;
  status: string;
  entity_id: string | null;
  owner_agent: string | null;
  remediation_job_id: string;
}

interface JobRow {
  id: string;
  agent_type: string;
  status: string;
  payload: Record<string, unknown>;
}

function readOption(args: string[], name: string): string | null {
  const prefix = `${name}=`;
  const inline = args.find((argument) => argument.startsWith(prefix));
  if (inline) return inline.slice(prefix.length).trim();
  const index = args.indexOf(name);
  return index >= 0 ? String(args[index + 1] || "").trim() : null;
}

export function parseCleanupArguments(args: string[]): CleanupArguments {
  const auditId = (readOption(args, "--audit-id") || "").toLowerCase();
  const confirmation = readOption(args, "--confirm")?.toLowerCase() || null;
  const apply = args.includes("--apply");

  if (!UUID_PATTERN.test(auditId)) {
    throw new Error("Indica un UUID válido con --audit-id=<id>.");
  }
  if (confirmation && confirmation !== auditId) {
    throw new Error("La confirmación no coincide exactamente con el ID de la auditoría.");
  }
  if (apply && confirmation !== auditId) {
    throw new Error("Para aplicar, confirma el alcance con --confirm=<mismo-id-de-auditoría>.");
  }

  return { auditId, apply, confirmation };
}

export function buildCleanupPlan(rows: CleanupScopeRow[]): CleanupPlan {
  const findings = new Map(rows.map((row) => [row.findingId, row]));
  const jobs = new Map<string, CleanupScopeRow>();
  const safetyErrors = new Set<string>();

  for (const row of rows) {
    if (!row.jobId || !row.jobAgentType || !row.jobStatus) {
      safetyErrors.add(`El hallazgo ${row.findingId} apunta a un trabajo inexistente.`);
      continue;
    }

    jobs.set(row.jobId, row);
    if (!KNOWN_JOB_STATUSES.has(row.jobStatus)) {
      safetyErrors.add(`El trabajo ${row.jobId} tiene un estado desconocido: ${row.jobStatus}.`);
    }
    if (!ALLOWED_REMEDIATION_AGENTS.has(row.jobAgentType)) {
      safetyErrors.add(`El trabajo ${row.jobId} pertenece a un agente no autorizado: ${row.jobAgentType}.`);
    }
    if (row.findingOwnerAgent !== row.jobAgentType) {
      safetyErrors.add(`El trabajo ${row.jobId} no coincide con el agente dueño del hallazgo ${row.findingId}.`);
    }
    if (
      typeof row.jobPayload?.articleId !== "string"
      || row.jobPayload.articleId !== row.findingEntityId
    ) {
      safetyErrors.add(`El trabajo ${row.jobId} no coincide con la entidad del hallazgo ${row.findingId}.`);
    }
    if (row.jobPayload?.applyChanges === true) {
      safetyErrors.add(`El trabajo ${row.jobId} sí tenía autorización applyChanges=true.`);
    }
  }

  const uniqueJobs = Array.from(jobs.values());
  const pendingJobIds = uniqueJobs
    .filter((row) => row.jobStatus === "pending")
    .map((row) => row.jobId as string);
  const inProgressJobIds = uniqueJobs
    .filter((row) => row.jobStatus === "in_progress")
    .map((row) => row.jobId as string);
  if (inProgressJobIds.length > 0) {
    safetyErrors.add(`Hay ${inProgressJobIds.length} trabajo(s) activos; pausa el sistema y espera a que lleguen a 0.`);
  }

  const jobsByStatus: Record<string, number> = {};
  const jobsByAgent: Record<string, number> = {};
  for (const row of uniqueJobs) {
    const status = row.jobStatus as string;
    const agent = row.jobAgentType as string;
    jobsByStatus[status] = (jobsByStatus[status] || 0) + 1;
    jobsByAgent[agent] = (jobsByAgent[agent] || 0) + 1;
  }

  return {
    linkedFindings: findings.size,
    uniqueJobs: uniqueJobs.length,
    pendingJobIds,
    inProgressJobIds,
    findingsToReopenIds: Array.from(findings.values())
      .filter((row) => row.findingStatus === "in_progress")
      .map((row) => row.findingId),
    jobsByStatus,
    jobsByAgent,
    safetyErrors: Array.from(safetyErrors),
  };
}

export function assertCleanupPlanIsSafe(plan: CleanupPlan): void {
  if (plan.safetyErrors.length > 0) {
    throw new Error(`La limpieza fue bloqueada:\n- ${plan.safetyErrors.join("\n- ")}`);
  }
}

async function loadAudit(client: QueryClient, auditId: string, lock = false): Promise<AuditRow> {
  const result = await client.query<AuditRow>(
    `SELECT id, status, started_at, completed_at
       FROM website_audits
      WHERE id = $1
      ${lock ? "FOR UPDATE" : ""}`,
    [auditId],
  );
  if (result.rows.length !== 1) throw new Error("La auditoría indicada no existe.");
  if (result.rows[0].status !== "completed") {
    throw new Error(`La auditoría debe estar completed; estado actual: ${result.rows[0].status}.`);
  }
  return result.rows[0];
}

async function loadScope(client: QueryClient, auditId: string, lock = false): Promise<CleanupScopeRow[]> {
  const findingsResult = await client.query<FindingRow>(
    `SELECT id, status, entity_id, owner_agent, remediation_job_id
       FROM website_audit_findings
      WHERE audit_id = $1
        AND remediation_job_id IS NOT NULL
      ORDER BY id
      ${lock ? "FOR UPDATE" : ""}`,
    [auditId],
  );
  const jobIds = Array.from(new Set(findingsResult.rows.map((row) => row.remediation_job_id)));
  const jobsResult = jobIds.length > 0
    ? await client.query<JobRow>(
      `SELECT id, agent_type, status, payload
         FROM agent_jobs
        WHERE id = ANY($1::varchar[])
        ${lock ? "FOR UPDATE" : ""}`,
      [jobIds],
    )
    : { rows: [], rowCount: 0 };
  const jobs = new Map(jobsResult.rows.map((row) => [row.id, row]));

  return findingsResult.rows.map((finding) => {
    const job = jobs.get(finding.remediation_job_id);
    return {
      findingId: finding.id,
      findingStatus: finding.status,
      findingEntityId: finding.entity_id,
      findingOwnerAgent: finding.owner_agent,
      remediationJobId: finding.remediation_job_id,
      jobId: job?.id || null,
      jobAgentType: job?.agent_type || null,
      jobStatus: job?.status || null,
      jobPayload: job?.payload || null,
    };
  });
}

function printPlan(audit: AuditRow, plan: CleanupPlan): void {
  console.log(`[agents:cleanup] Auditoría: ${audit.id} (${audit.status})`);
  console.log(`[agents:cleanup] Hallazgos vinculados: ${plan.linkedFindings}`);
  console.log(`[agents:cleanup] Trabajos únicos: ${plan.uniqueJobs}`);
  console.log(`[agents:cleanup] Por estado: ${JSON.stringify(plan.jobsByStatus)}`);
  console.log(`[agents:cleanup] Por agente: ${JSON.stringify(plan.jobsByAgent)}`);
  console.log(`[agents:cleanup] Pendientes a cancelar: ${plan.pendingJobIds.length}`);
  console.log(`[agents:cleanup] Hallazgos a reabrir: ${plan.findingsToReopenIds.length}`);
  if (plan.safetyErrors.length > 0) {
    console.log(`[agents:cleanup] Bloqueos de seguridad:\n- ${plan.safetyErrors.join("\n- ")}`);
  }
}

export async function applyCleanup(client: QueryClient, auditId: string): Promise<void> {
  await client.query("BEGIN");
  try {
    const audit = await loadAudit(client, auditId, true);
    const plan = buildCleanupPlan(await loadScope(client, auditId, true));
    printPlan(audit, plan);
    assertCleanupPlanIsSafe(plan);

    let cancelledCount = 0;
    if (plan.pendingJobIds.length > 0) {
      const cancelled = await client.query<{ id: string }>(
        `UPDATE agent_jobs
            SET status = 'cancelled',
                completed_at = NOW(),
                error = $2
          WHERE id = ANY($1::varchar[])
            AND status = 'pending'
        RETURNING id`,
        [
          plan.pendingJobIds,
          `Cancelled after diagnostic audit ${auditId} enqueued remediation without authorization.`,
        ],
      );
      cancelledCount = cancelled.rows.length;
    }

    let reopenedCount = 0;
    if (plan.findingsToReopenIds.length > 0) {
      const reopened = await client.query<{ id: string }>(
        `UPDATE website_audit_findings
            SET status = 'open',
                resolved_at = NULL,
                resolved_by = NULL
          WHERE id = ANY($1::varchar[])
            AND status = 'in_progress'
        RETURNING id`,
        [plan.findingsToReopenIds],
      );
      reopenedCount = reopened.rows.length;
    }

    if (cancelledCount !== plan.pendingJobIds.length) {
      throw new Error("La cola cambió durante la limpieza; no se aplicó ningún cambio.");
    }
    if (reopenedCount !== plan.findingsToReopenIds.length) {
      throw new Error("Los hallazgos cambiaron durante la limpieza; no se aplicó ningún cambio.");
    }

    await client.query("COMMIT");
    console.log(`[agents:cleanup] OK: ${cancelledCount} trabajos cancelados y ${reopenedCount} hallazgos reabiertos.`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

export async function main(args = process.argv.slice(2)): Promise<void> {
  if (args.includes("--help")) {
    console.log("Uso: npm run agents:cleanup-diagnostic-audit -- --audit-id=UUID [--apply --confirm=UUID]");
    return;
  }

  const options = parseCleanupArguments(args);
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Configura DATABASE_URL antes de ejecutar la limpieza.");

  const [{ default: pg }, { getPostgresConnectionConfig }] = await Promise.all([
    import("pg"),
    import("@shared/postgres-config.mjs"),
  ]);
  const client = new pg.Client(getPostgresConnectionConfig(connectionString));
  await client.connect();

  try {
    if (options.apply) {
      await applyCleanup(client, options.auditId);
      return;
    }

    const audit = await loadAudit(client, options.auditId);
    const plan = buildCleanupPlan(await loadScope(client, options.auditId));
    printPlan(audit, plan);
    assertCleanupPlanIsSafe(plan);
    console.log("[agents:cleanup] DRY-RUN: no se escribió nada.");
    console.log(`[agents:cleanup] Para aplicar: npm run agents:cleanup-diagnostic-audit -- --audit-id=${options.auditId} --apply --confirm=${options.auditId}`);
  } finally {
    await client.end();
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Falló la limpieza controlada.";
    console.error(`[agents:cleanup] ${message}`);
    process.exitCode = 1;
  });
}
