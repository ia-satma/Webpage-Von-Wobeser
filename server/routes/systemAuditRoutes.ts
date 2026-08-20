import type { Express, Request, Response } from "express";
import { z } from "zod";
import { authMiddleware, requirePermission } from "../auth";
import { storage } from "../storage";

const findingsPageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  category: z.enum(["links", "navigation", "translations", "performance", "seo", "content", "linguistic", "system"]).optional(),
  severity: z.enum(["critical", "high", "medium", "low"]).optional(),
}).strict();

function pagination(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

function shouldIncludeFindings(value: unknown): boolean {
  return value !== "false" && value !== "0";
}

export function registerSystemAuditRoutes(app: Express): void {
  // System Chronicler API - Nerve Center data
  app.get("/api/system/chronicler", authMiddleware, requirePermission("advanced"), async (req: Request, res: Response) => {
    try {
      const { systemChronicler } = await import('../agents/SystemChronicler');

      const agents = systemChronicler.getAllAgents();
      const timeline = systemChronicler.getEvolutionTimeline();
      const stats = systemChronicler.getSystemStats();

      res.json({
        success: true,
        agents,
        timeline,
        stats,
        categories: {
          brain: systemChronicler.getAgentsByCategory("brain"),
          hands: systemChronicler.getAgentsByCategory("hands"),
          shield: systemChronicler.getAgentsByCategory("shield")
        }
      });
    } catch (error: any) {
      console.error('[SystemChronicler] Error:', error);
      res.status(500).json({ success: false, error: "Failed to load system history" });
    }
  });

  // Record evolution event (admin only)
  app.post("/api/system/chronicler/evolution", authMiddleware, requirePermission("advanced"), async (req: Request, res: Response) => {
    try {
      const { systemChronicler } = await import('../agents/SystemChronicler');
      const parsed = z.object({
        title: z.string().trim().min(1).max(160),
        description: z.string().trim().min(1).max(2_000),
        agentId: z.string().trim().max(120).optional(),
        impact: z.enum(["minor", "major", "critical"]),
        category: z.enum(["security", "intelligence", "performance", "capability"]),
      }).strict().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: "Validation failed" });
      }
      const { title, description, agentId, impact, category } = parsed.data;

      systemChronicler.recordEvolution({
        title,
        description,
        agentId,
        impact,
        category
      });

      res.json({ success: true, message: 'Evolution recorded' });
    } catch (error: any) {
      console.error('[SystemChronicler] Error recording evolution:', error);
      res.status(500).json({ success: false, error: "Failed to record evolution" });
    }
  });

  // Website Audit API routes
  app.get("/api/audits", authMiddleware, requirePermission("advanced"), async (req: Request, res: Response) => {
    try {
      const parsed = z.coerce.number().int().min(1).max(100).default(20).safeParse(req.query.limit);
      if (!parsed.success) return res.status(400).json({ error: "Invalid limit" });
      const limit = parsed.data;
      const audits = await storage.getWebsiteAudits(limit);
      res.json({ success: true, audits });
    } catch (error) {
      console.error("Failed to get audits:", error);
      res.status(500).json({ error: "Failed to fetch audits" });
    }
  });

  app.get("/api/audits/latest", authMiddleware, requirePermission("advanced"), async (req: Request, res: Response) => {
    try {
      const audit = await storage.getLatestWebsiteAudit();
      if (!audit) {
        return res.json({ success: true, audit: null });
      }
      if (!shouldIncludeFindings(req.query.includeFindings)) {
        return res.json({ success: true, audit, findings: [] });
      }
      const findings = await storage.getWebsiteAuditFindings(audit.id);
      res.json({ success: true, audit, findings });
    } catch (error) {
      console.error("Failed to get latest audit:", error);
      res.status(500).json({ error: "Failed to fetch latest audit" });
    }
  });

  app.get("/api/audits/:id/export.csv", authMiddleware, requirePermission("advanced"), async (req: Request, res: Response) => {
    try {
      const audit = await storage.getWebsiteAudit(req.params.id);
      if (!audit) return res.status(404).json({ error: "Audit not found" });
      const findings = await storage.getWebsiteAuditFindings(audit.id);
      const csvCell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
      const headers = ["url", "entity", "entity_id", "field", "language", "original", "suggestion", "type", "severity", "confidence", "reason", "status"];
      const rows = findings.map((finding) => {
        const details = (finding.details || {}) as Record<string, unknown>;
        return [finding.url, finding.entityType, finding.entityId, details.field, finding.language, details.original, details.suggestion || finding.recommendation, finding.issueType, finding.severity, details.confidence, details.reason, finding.status].map(csvCell).join(",");
      });
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="auditoria-${audit.runType}-${audit.id}.csv"`);
      res.send(`\uFEFF${headers.map(csvCell).join(",")}\n${rows.join("\n")}`);
    } catch (error) {
      console.error("Failed to export audit:", error);
      res.status(500).json({ error: "Failed to export audit" });
    }
  });

  app.get("/api/audits/:id", authMiddleware, requirePermission("advanced"), async (req: Request, res: Response) => {
    try {
      const audit = await storage.getWebsiteAudit(req.params.id);
      if (!audit) {
        return res.status(404).json({ error: "Audit not found" });
      }
      if (!shouldIncludeFindings(req.query.includeFindings)) {
        return res.json({ success: true, audit, findings: [] });
      }
      const findings = await storage.getWebsiteAuditFindings(audit.id);
      res.json({ success: true, audit, findings });
    } catch (error) {
      console.error("Failed to get audit:", error);
      res.status(500).json({ error: "Failed to fetch audit" });
    }
  });

  app.get("/api/audits/:id/findings", authMiddleware, requirePermission("advanced"), async (req: Request, res: Response) => {
    try {
      const parsed = findingsPageQuerySchema.safeParse(req.query);
      if (!parsed.success) return res.status(400).json({ error: "Invalid findings query" });
      const { page, limit, category, severity } = parsed.data;
      const result = await storage.getWebsiteAuditFindingsPage({
        auditId: req.params.id,
        category,
        severity,
        limit,
        offset: (page - 1) * limit,
      });
      res.json({
        success: true,
        findings: result.findings,
        pagination: pagination(page, limit, result.total),
      });
    } catch (error) {
      console.error("Failed to get audit findings:", error);
      res.status(500).json({ error: "Failed to fetch findings" });
    }
  });

  app.post("/api/audits/run", authMiddleware, requirePermission("advanced"), async (req: Request, res: Response) => {
    try {
      const parsed = z.object({
        runType: z.enum(['full', 'delta', 'links_only', 'translations_only', 'seo_only', 'content_only', 'linguistic']).default('full'),
        skipModules: z.array(z.enum(['links', 'navigation', 'translations', 'performance', 'seo', 'content'])).max(6).optional(),
        applyChanges: z.boolean().default(false),
      }).strict().safeParse(req.body || {});
      if (!parsed.success) return res.status(400).json({ error: "Invalid audit request" });

      if (parsed.data.runType === "linguistic") {
        const { runLinguisticAudit } = await import("../audits/linguisticAudit");
        const result = await runLinguisticAudit(req.adminUser?.id || "manual");
        return res.json({
          success: true,
          auditId: result.auditId,
          message: `Auditoría lingüística completada: ${result.issuesFound} hallazgos en ${result.pagesScanned} fuentes.`,
        });
      }

      const { orchestrator } = await import('../agents');

      const job = await orchestrator.enqueueJob(
        'website_auditor',
        {
          ...parsed.data,
          triggeredBy: 'manual',
        },
        { priority: 'high' }
      );

      if (!orchestrator.isProcessing()) {
        orchestrator.start();
      }

      res.json({
        success: true,
        jobId: job.id,
        message: 'Audit job queued successfully. Check audit history for results.',
      });
    } catch (error) {
      console.error("Failed to run audit:", error);
      res.status(500).json({ error: "Failed to run audit" });
    }
  });

  app.post("/api/admin/linguistic/check", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    const parsed = z.object({
      text: z.string().max(200_000),
      lang: z.enum(["es", "en"]).default("es"),
    }).strict().safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ error: "Invalid linguistic check request" });
    const { analyzeLinguisticText } = await import("../audits/linguisticAudit");
    res.json({ success: true, findings: analyzeLinguisticText(parsed.data.text, parsed.data.lang) });
  });

  app.get("/api/audits/findings/open", authMiddleware, requirePermission("advanced"), async (req: Request, res: Response) => {
    try {
      const parsed = findingsPageQuerySchema.safeParse(req.query);
      if (!parsed.success) return res.status(400).json({ error: "Invalid findings query" });
      const { page, limit, category, severity } = parsed.data;
      const result = await storage.getWebsiteAuditFindingsPage({
        status: "open",
        category,
        severity,
        limit,
        offset: (page - 1) * limit,
      });
      res.json({
        success: true,
        findings: result.findings,
        pagination: pagination(page, limit, result.total),
      });
    } catch (error) {
      console.error("Failed to get open findings:", error);
      res.status(500).json({ error: "Failed to fetch open findings" });
    }
  });

  // System Health Check - Deep Audit API
  // NOTE: Health check is intentionally public (read-only diagnostic).
  // Destructive operations like reset-zombies require auth.
  // Sin login exponía biografías de abogados, títulos/IDs de artículos y payloads internos de
  // jobs a cualquiera, además de correr 5 escaneos completos de tablas en cada request. Mismo
  // permiso que su ruta hermana /api/health-check/reset-zombies.
  app.get("/api/health-check/run", authMiddleware, requirePermission("advanced"), async (req: Request, res: Response) => {
    try {
      const { systemHealthCheck } = await import('../agents/SystemHealthCheck');
      const report = await systemHealthCheck.runDeepAudit();
      res.json({
        success: true,
        report,
        humanReadable: systemHealthCheck.generateHumanReport(report),
      });
    } catch (error: any) {
      console.error("Health check failed:", error);
      res.status(500).json({ error: "Failed to run health check" });
    }
  });

  app.get("/api/health-check/clamav", authMiddleware, requirePermission("advanced"), async (_req: Request, res: Response) => {
    try {
      const { checkClamAvHealth } = await import("../security/uploads");
      const clamav = await checkClamAvHealth();
      res.setHeader("Cache-Control", "private, no-store");
      res.status(clamav.available || !clamav.required ? 200 : 503).json({
        success: clamav.available,
        clamav,
      });
    } catch {
      res.setHeader("Cache-Control", "private, no-store");
      res.status(503).json({
        success: false,
        clamav: { available: false, required: true, version: null },
      });
    }
  });

  app.post("/api/health-check/reset-zombies", authMiddleware, requirePermission("advanced"), async (req: Request, res: Response) => {
    try {
      const { systemHealthCheck } = await import('../agents/SystemHealthCheck');
      const resetCount = await systemHealthCheck.resetZombieJobs();
      res.json({
        success: true,
        message: `Reset ${resetCount} zombie jobs`,
        resetCount,
      });
    } catch (error: any) {
      console.error("Failed to reset zombies:", error);
      res.status(500).json({ error: "Failed to reset zombie jobs" });
    }
  });

  app.patch("/api/audits/findings/:id", authMiddleware, requirePermission("advanced"), async (req: Request, res: Response) => {
    try {
      const parsed = z.object({
        status: z.enum(["open", "in_progress", "resolved", "ignored", "wont_fix"]),
        resolvedBy: z.string().max(120).optional(),
      }).strict().safeParse(req.body || {});
      if (!parsed.success) return res.status(400).json({ error: "Invalid finding update" });
      const { status, resolvedBy } = parsed.data;

      if (status === 'resolved') {
        const finding = await storage.resolveWebsiteAuditFinding(req.params.id, resolvedBy || 'manual');
        return res.json({ success: true, finding });
      }

      const finding = await storage.updateWebsiteAuditFinding(req.params.id, { status });
      res.json({ success: true, finding });
    } catch (error) {
      console.error("Failed to update finding:", error);
      res.status(500).json({ error: "Failed to update finding" });
    }
  });
}
