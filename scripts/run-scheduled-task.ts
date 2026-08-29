import { initializeAgents, orchestrator } from "../server/agents";
import { runScheduledLegalAlertsScan } from "../server/agents/specialized/legalAlertsScanner";
import { runScheduledTask, isScheduledTaskName, type ScheduledTaskName } from "../server/scheduler/taskRunner";
import { deleteExpiredSessionsByExactId } from "../server/security/expiredSessionCleanup";
import { auditAllArticleExternalLinks } from "../server/articleExternalLinkIntegrity";
import { closeDatabasePool } from "../server/db";

const requestedTask = process.argv[2] || "";
try {
  if (!isScheduledTaskName(requestedTask) || process.argv.length > 3) {
    console.error("Usage: run-scheduled-task <security-maintenance|website-audit|legal-alerts|article-link-integrity>");
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
      // La integridad editorial sí está autorizada a retirar visibilidad de un
      // Artículo cuando su fuente ya no entrega contenido real. No borra filas,
      // no sustituye URLs y deja la evidencia reversible en Administración.
      "article-link-integrity": async () => {
        const result = await auditAllArticleExternalLinks();
        return {
          articles: result.totalArticles,
          links: result.totalLinks,
          source_disabled: result.sourceDisabled,
          content_disabled: result.disabledContentLinks,
        };
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
