import path from "node:path";
import { pathToFileURL } from "node:url";

const AUDITED_CATEGORIES = ["translations", "content", "seo", "links"] as const;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface QueryResult<Row> {
  rows: Row[];
  rowCount: number | null;
}

interface QueryClient {
  query<Row = Record<string, unknown>>(text: string, values?: unknown[]): Promise<QueryResult<Row>>;
}

interface AuditRow {
  id: string;
  run_type: string;
  status: string;
  started_at: Date | string | null;
  completed_at: Date | string | null;
}

interface CategoryCountRow {
  category: string;
  count: number;
}

export interface AuditFindingCleanupArguments {
  auditId: string | null;
  apply: boolean;
  confirmation: string | null;
}

export interface AuditFindingCleanupPlan {
  auditId: string;
  total: number;
  byCategory: Record<string, number>;
}

function readOption(args: string[], name: string): string | null {
  const prefix = `${name}=`;
  const inline = args.find((argument) => argument.startsWith(prefix));
  if (inline) return inline.slice(prefix.length).trim();
  const index = args.indexOf(name);
  return index >= 0 ? String(args[index + 1] || "").trim() : null;
}

export function parseAuditFindingCleanupArguments(args: string[]): AuditFindingCleanupArguments {
  const auditId = readOption(args, "--audit-id")?.toLowerCase() || null;
  const confirmation = readOption(args, "--confirm")?.toLowerCase() || null;
  const apply = args.includes("--apply");

  if (auditId && !UUID_PATTERN.test(auditId)) {
    throw new Error("--audit-id debe contener un UUID válido.");
  }
  if (confirmation && !UUID_PATTERN.test(confirmation)) {
    throw new Error("--confirm debe contener un UUID válido.");
  }
  if (auditId && confirmation && auditId !== confirmation) {
    throw new Error("La confirmación no coincide con la auditoría indicada.");
  }
  if (apply && !confirmation) {
    throw new Error("Para aplicar, primero ejecuta el dry-run y confirma con --confirm=<audit-id>.");
  }

  return { auditId, apply, confirmation };
}

async function loadAuthoritativeAudit(
  client: QueryClient,
  auditId: string | null,
  lock = false,
): Promise<AuditRow> {
  const result = auditId
    ? await client.query<AuditRow>(
      `SELECT id, run_type, status, started_at, completed_at
         FROM website_audits
        WHERE id = $1
        ${lock ? "FOR UPDATE" : ""}`,
      [auditId],
    )
    : await client.query<AuditRow>(
      `SELECT id, run_type, status, started_at, completed_at
         FROM website_audits
        WHERE status = 'completed'
          AND run_type = 'full'
        ORDER BY completed_at DESC NULLS LAST, started_at DESC NULLS LAST
        LIMIT 1
        ${lock ? "FOR UPDATE" : ""}`,
    );

  if (result.rows.length !== 1) {
    throw new Error(auditId ? "La auditoría indicada no existe." : "No existe una auditoría full completada.");
  }
  const audit = result.rows[0];
  if (audit.status !== "completed" || audit.run_type !== "full") {
    throw new Error("La limpieza requiere una auditoría full con estado completed.");
  }
  return audit;
}

export async function buildAuditFindingCleanupPlan(
  client: QueryClient,
  auditId: string,
): Promise<AuditFindingCleanupPlan> {
  const result = await client.query<CategoryCountRow>(
    `SELECT category, count(*)::int AS count
       FROM website_audit_findings
      WHERE audit_id <> $1
        AND status = 'open'
        AND category = ANY($2::text[])
      GROUP BY category
      ORDER BY category`,
    [auditId, [...AUDITED_CATEGORIES]],
  );
  const byCategory = Object.fromEntries(AUDITED_CATEGORIES.map((category) => [category, 0]));
  for (const row of result.rows) byCategory[row.category] = Number(row.count) || 0;
  return {
    auditId,
    total: Object.values(byCategory).reduce((sum, count) => sum + count, 0),
    byCategory,
  };
}

function printPlan(audit: AuditRow, plan: AuditFindingCleanupPlan): void {
  console.log(`[audits:cleanup] Auditoría autoritativa: ${audit.id} (${audit.run_type}, ${audit.status})`);
  console.log(`[audits:cleanup] Hallazgos históricos abiertos a cerrar: ${plan.total}`);
  console.log(`[audits:cleanup] Por categoría: ${JSON.stringify(plan.byCategory)}`);
}

export async function applyAuditFindingCleanup(
  client: QueryClient,
  options: AuditFindingCleanupArguments,
): Promise<number> {
  await client.query("BEGIN");
  try {
    const audit = await loadAuthoritativeAudit(client, options.auditId, true);
    if (options.confirmation !== audit.id.toLowerCase()) {
      throw new Error(`Confirma exactamente con --confirm=${audit.id}.`);
    }
    const plan = await buildAuditFindingCleanupPlan(client, audit.id);
    printPlan(audit, plan);
    const result = await client.query<{ id: string }>(
      `UPDATE website_audit_findings
          SET status = 'resolved',
              resolved_at = NOW(),
              resolved_by = $3
        WHERE audit_id <> $1
          AND status = 'open'
          AND category = ANY($2::text[])
      RETURNING id`,
      [audit.id, [...AUDITED_CATEGORIES], `superseded:${audit.id}`],
    );
    const updated = result.rowCount ?? result.rows.length;
    if (updated !== plan.total) {
      throw new Error("El alcance cambió durante la limpieza; se revirtió toda la transacción.");
    }
    await client.query("COMMIT");
    return updated;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

export async function main(args = process.argv.slice(2)): Promise<void> {
  if (args.includes("--help")) {
    console.log("Uso: npm run audits:cleanup-open -- [--audit-id=UUID] [--apply --confirm=UUID]");
    return;
  }
  const options = parseAuditFindingCleanupArguments(args);
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
      const updated = await applyAuditFindingCleanup(client, options);
      console.log(`[audits:cleanup] OK: ${updated} hallazgos históricos quedaron resueltos; no se eliminó ninguna fila.`);
      return;
    }

    await client.query("BEGIN TRANSACTION READ ONLY");
    try {
      const audit = await loadAuthoritativeAudit(client, options.auditId);
      const plan = await buildAuditFindingCleanupPlan(client, audit.id);
      printPlan(audit, plan);
      console.log("[audits:cleanup] DRY-RUN: no se escribió nada.");
      console.log(`[audits:cleanup] Para aplicar: npm run audits:cleanup-open -- --audit-id=${audit.id} --apply --confirm=${audit.id}`);
      await client.query("ROLLBACK");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  } finally {
    await client.end();
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  main().catch((error: unknown) => {
    console.error(`[audits:cleanup] ${error instanceof Error ? error.message : "Falló la limpieza controlada."}`);
    process.exitCode = 1;
  });
}
