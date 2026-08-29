import pg from "pg";
import { getPostgresConnectionConfig } from "@shared/postgres-config.mjs";
import { loadBuildProvenance } from "../security/deploymentProvenance";

export const SCHEDULED_TASKS = [
  "security-maintenance",
  "website-audit",
  "legal-alerts",
  "article-link-integrity",
] as const;

export type ScheduledTaskName = typeof SCHEDULED_TASKS[number];
export type ScheduledTaskResult = Record<string, string | number | boolean | null>;

const SAFE_RESULT_KEY = /^[a-z][a-z0-9_]{0,63}$/;
const SAFE_RESULT_STRING = /^[a-z0-9_.:-]{1,128}$/i;

export function isScheduledTaskName(value: string): value is ScheduledTaskName {
  return SCHEDULED_TASKS.includes(value as ScheduledTaskName);
}

export function scheduledWindowStart(taskName: ScheduledTaskName, at = new Date()): Date {
  const date = new Date(at);
  date.setUTCMinutes(0, 0, 0);
  if (taskName === "website-audit") date.setUTCHours(0);
  if (taskName === "legal-alerts") date.setUTCHours(date.getUTCHours() < 12 ? 0 : 12);
  if (taskName === "article-link-integrity") date.setUTCHours(0);
  return date;
}

export function sanitizeScheduledResult(value: ScheduledTaskResult): ScheduledTaskResult {
  const safe: ScheduledTaskResult = {};
  for (const key of Object.keys(value).sort().slice(0, 20)) {
    if (!SAFE_RESULT_KEY.test(key)) continue;
    const item = value[key];
    if (item === null || typeof item === "boolean") safe[key] = item;
    else if (typeof item === "number" && Number.isFinite(item)) safe[key] = item;
    else if (typeof item === "string" && SAFE_RESULT_STRING.test(item)) safe[key] = item;
  }
  return safe;
}

export async function runScheduledTask(
  taskName: ScheduledTaskName,
  operation: () => Promise<ScheduledTaskResult>,
  options: { databaseUrl?: string; now?: Date } = {},
): Promise<{
  taskName: ScheduledTaskName;
  scheduledFor: string;
  status: "completed" | "skipped_locked" | "skipped_duplicate";
  result: ScheduledTaskResult;
}> {
  const databaseUrl = options.databaseUrl || process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  const scheduledFor = scheduledWindowStart(taskName, options.now);
  const client = new pg.Client(getPostgresConnectionConfig(databaseUrl));
  const lockName = `von-wobeser:scheduled:${taskName}`;
  let lockAcquired = false;
  await client.connect();
  try {
    const lock = await client.query<{ acquired: boolean }>(
      "SELECT pg_try_advisory_lock(hashtextextended($1::text, 0)) AS acquired",
      [lockName],
    );
    lockAcquired = lock.rows[0]?.acquired === true;
    if (!lockAcquired) {
      return { taskName, scheduledFor: scheduledFor.toISOString(), status: "skipped_locked", result: {} };
    }

    const provenance = await loadBuildProvenance();
    const started = await client.query<{ id: string }>(`
      INSERT INTO scheduled_task_runs (
        task_name, scheduled_for, status, attempts, result, error_code,
        commit_sha, build_sha256, started_at, completed_at
      ) VALUES ($1, $2, 'running', 1, '{}'::jsonb, NULL, $3, $4, now(), NULL)
      ON CONFLICT (task_name, scheduled_for) DO UPDATE SET
        status = 'running',
        attempts = scheduled_task_runs.attempts + 1,
        result = '{}'::jsonb,
        error_code = NULL,
        commit_sha = EXCLUDED.commit_sha,
        build_sha256 = EXCLUDED.build_sha256,
        started_at = now(),
        completed_at = NULL
      WHERE scheduled_task_runs.status = 'failed'
      RETURNING id
    `, [taskName, scheduledFor, provenance?.commitSha ?? null, provenance?.buildSha256 ?? null]);

    if (!started.rowCount) {
      return { taskName, scheduledFor: scheduledFor.toISOString(), status: "skipped_duplicate", result: {} };
    }

    try {
      const result = sanitizeScheduledResult(await operation());
      await client.query(`
        UPDATE scheduled_task_runs
        SET status = 'completed', result = $2::jsonb, completed_at = now()
        WHERE id = $1
      `, [started.rows[0].id, JSON.stringify(result)]);
      return { taskName, scheduledFor: scheduledFor.toISOString(), status: "completed", result };
    } catch {
      await client.query(`
        UPDATE scheduled_task_runs
        SET status = 'failed', error_code = 'TASK_EXECUTION_FAILED', completed_at = now()
        WHERE id = $1
      `, [started.rows[0].id]).catch(() => undefined);
      throw new Error("Scheduled task execution failed");
    }
  } finally {
    if (lockAcquired) {
      await client.query("SELECT pg_advisory_unlock(hashtextextended($1::text, 0))", [lockName]).catch(() => undefined);
    }
    await client.end();
  }
}
