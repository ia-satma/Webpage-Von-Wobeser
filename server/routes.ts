import type { Express, NextFunction, Request, Response } from "express";
import type { Server } from "node:http";
import crypto from "node:crypto";
import { WebSocket, WebSocketServer } from "ws";
import { z } from "zod";
import { authMiddleware, requirePermission, resolveAdminSession } from "./auth";
import { isMigrationReadOnlyEnabled } from "./database/maintenance";
import { seed } from "./seed";
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

// Global WebSocket clients map for pipeline progress updates
const pipelineClients: Map<string, { ws: WebSocket; userId: string }> = new Map();

export function broadcastPipelineProgress(articleId: string, data: {
  step: string;
  status: 'running' | 'completed' | 'error';
  language?: string;
  progress?: number;
  message?: string;
  data?: any;
}) {
  const payload = JSON.stringify({ articleId, ...data, timestamp: new Date().toISOString() });
  
  // Broadcast to all connected clients
  pipelineClients.forEach(({ ws }) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
}
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

  // Setup WebSocket server for pipeline progress updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/pipeline' });
  
  // Heartbeat to detect stale connections
  const heartbeatInterval = setInterval(() => {
    pipelineClients.forEach(({ ws }, clientId) => {
      if (ws.readyState !== WebSocket.OPEN) {
        pipelineClients.delete(clientId);
        return;
      }
      try {
        ws.ping();
      } catch (error) {
        console.error('[WebSocket] Heartbeat ping failed for client:', clientId, error);
        pipelineClients.delete(clientId);
      }
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });
  
  wss.on('connection', async (ws, req) => {
    try {
      const origin = req.headers.origin;
      const host = req.headers.host;
      if (!origin || !host || new URL(origin).host !== host) {
        ws.close(1008, "Origin not allowed");
        return;
      }
      const resolved = await resolveAdminSession(req as unknown as Request);
      if (!resolved) {
        ws.close(1008, "Authentication required");
        return;
      }
      const currentConnections = Array.from(pipelineClients.values())
        .filter((client) => client.userId === resolved.user.id).length;
      if (currentConnections >= 3) {
        ws.close(1008, "Connection limit reached");
        return;
      }

      const clientId = crypto.randomBytes(8).toString('hex');
      pipelineClients.set(clientId, { ws, userId: resolved.user.id });
      console.log(`[WebSocket] Pipeline client connected: ${clientId}`);

      ws.on('close', () => {
        pipelineClients.delete(clientId);
        console.log(`[WebSocket] Pipeline client disconnected: ${clientId}`);
      });

      ws.on('error', () => {
        console.error(`[WebSocket] Client error ${clientId}`);
        pipelineClients.delete(clientId);
      });

      ws.on('pong', () => {
        // Client is alive, nothing to do
      });

      ws.send(JSON.stringify({ type: 'connected', clientId }));
    } catch {
      ws.close(1011, "Connection rejected");
    }
  });

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
