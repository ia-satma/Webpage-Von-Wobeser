import type { Express, NextFunction, Request, Response } from "express";
import type { Server } from "node:http";
import { z } from "zod";
import { authMiddleware, requirePermission } from "./auth";
import { isMigrationReadOnlyEnabled } from "./database/maintenance";
import { seed } from "./seed";
import { apiRouteRateLimit } from "./security/apiRateLimit";
import {
  broadcastPipelineProgress,
  setupPipelineWebSocket,
} from "./security/pipelineWebSocket";
import { ensurePrivateUploadDirectories } from "./security/uploads";
import { registerAdminAccessRoutes } from "./routes/adminAccessRoutes";
import { registerAdminCatalogRoutes } from "./routes/adminCatalogRoutes";
import { registerAdminKnowledgeRoutes } from "./routes/adminKnowledgeRoutes";
import { registerAdminMediaRoutes } from "./routes/adminMediaRoutes";
import { registerAdminNewsRoutes } from "./routes/adminNewsRoutes";
import { registerAdminSubmissionRoutes } from "./routes/adminSubmissionRoutes";
import { registerAdminTeamRoutes } from "./routes/adminTeamRoutes";
import { registerAgentAssetHistoryRoutes } from "./routes/agentAssetHistoryRoutes";
import { registerAgentPipelineRoutes } from "./routes/agentPipelineRoutes";
import { registerDiscoveryRoutes } from "./routes/discoveryRoutes";
import { registerLanguageDetectionRoutes } from "./routes/languageDetectionRoutes";
import { registerNewsWorkflowRoutes } from "./routes/newsWorkflowRoutes";
import { registerOfficeImageRoutes } from "./routes/officeImageRoutes";
import { registerPublicAssetRoutes } from "./routes/publicAssetRoutes";
import { registerPublicContentRoutes } from "./routes/publicContentRoutes";
import { registerPublicNewsRoutes } from "./routes/publicNewsRoutes";
import { registerPublicUploadRoutes } from "./routes/publicUploadRoutes";
import { registerSystemAuditRoutes } from "./routes/systemAuditRoutes";
import { registerTranslationRoutes } from "./routes/translationRoutes";

export { runSecurityMaintenance } from "./security/maintenance";
export { broadcastPipelineProgress };
export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await ensurePrivateUploadDirectories();
  if (process.env.SECURITY_READ_ONLY_SMOKE !== "true" && !isMigrationReadOnlyEnabled()) {
    await seed();
  }

  // Todas las rutas que llaman `:id` usan claves UUID de PostgreSQL. Validarlas
  // una sola vez evita consultas innecesarias, errores 500 e inputs ambiguos.
  app.param("id", (req: Request, res: Response, next: NextFunction, value: string) => {
    if (!z.string().uuid().safeParse(value).success) {
      return res.status(400).json({ error: "Invalid identifier" });
    }
    next();
  });
  app.param("teamMemberId", (req: Request, res: Response, next: NextFunction, value: string) => {
    if (!z.string().uuid().safeParse(value).success) {
      return res.status(400).json({ error: "Invalid identifier" });
    }
    next();
  });
  app.param("articleId", (req: Request, res: Response, next: NextFunction, value: string) => {
    if (!z.string().uuid().safeParse(value).success) {
      return res.status(400).json({ error: "Invalid identifier" });
    }
    next();
  });

  setupPipelineWebSocket(httpServer);

  // Cuota persistente por familia de ruta y por usuario/IP. Se registra antes
  // de las APIs para cubrir también routers montados, pero después de validar
  // los parámetros comunes y sin afectar archivos/páginas públicas.
  app.use("/api", apiRouteRateLimit);

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

  registerAgentPipelineRoutes(app, broadcastPipelineProgress);

  registerSystemAuditRoutes(app);

  // Agent system routes — PROTEGIDAS: disparar agentes/pipelines/colas requiere admin.
  const agentRoutes = await import('./agents/api/agentRoutes');
  app.use('/api/agents', authMiddleware, requirePermission("agents"), agentRoutes.default);

  // Initialize agents on normal server start. El smoke test de seguridad es
  // deliberadamente de solo lectura y no debe cargar conocimiento ni colas.
  if (process.env.SECURITY_READ_ONLY_SMOKE !== "true" && !isMigrationReadOnlyEnabled()) {
    const { initializeAgents } = await import('./agents');
    initializeAgents().catch(err => console.error('[Agents] Initialization error:', err));
  }

  return httpServer;
}
