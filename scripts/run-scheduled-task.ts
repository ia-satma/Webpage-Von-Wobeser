import { initializeAgents, orchestrator } from "../server/agents";
import { runScheduledLegalAlertsScan } from "../server/agents/specialized/legalAlertsScanner";
import { runScheduledTask, isScheduledTaskName, type ScheduledTaskName } from "../server/scheduler/taskRunner";
import { deleteExpiredSessionsByExactId } from "../server/security/expiredSessionCleanup";
import { closeDatabasePool } from "../server/db";

const requestedTask = process.argv[2] || "";
try {
  if (!isScheduledTaskName(requestedTask) || process.argv.length > 3) {
    console.error("Usage: run-scheduled-task <security-maintenance|website-audit|legal-alerts>");
    process.exitCode = 2;
  } else {
    const operations: Record<ScheduledTaskName, () => Promise<Record<string, string | number | boolean | null>>> = {
      // Alcance deliberadamente limitado: no invoca runSecurityMaintenance y no
      // elimina contactos, CV, medios, noticias, abogados ni contenido comercial.
      "security-maintenance": async () => ({
        expired_sessions: await deleteExpiredSessionsByExactId(),
      }),
      "website-audit": async () => {
        await initializeAgents();
        const result = await orchestrator.executeImmediately(
          "website_auditor",
          { runType: "full", triggeredBy: "scheduled", applyChanges: false },
          { origin: "scheduled" },
        );
        return { success: result.success };
      },
      "legal-alerts": async () => {
        await initializeAgents();
        const { enqueued, skipped } = await runScheduledLegalAlertsScan();
        return { enqueued, skipped };
      },
    };

    try {
      const result = await runScheduledTask(requestedTask, operations[requestedTask]);
      console.log(JSON.stringify(result));
      process.exitCode = 0;
    } catch {
      console.error("Scheduled task failed");
      process.exitCode = 1;
    }
  }
} finally {
  await closeDatabasePool().catch(() => undefined);
}
