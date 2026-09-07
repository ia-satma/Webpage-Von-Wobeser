import type { Express, Request, Response } from "express";
import { z } from "zod";
import type { AgentType } from "../agents/core/types";
import { authMiddleware, requirePermission } from "../auth";
import { storage } from "../storage";

export type PipelineProgress = {
  step: string;
  status: "running" | "completed" | "error";
  language?: string;
  progress?: number;
  message?: string;
  data?: unknown;
};

type BroadcastPipelineProgress = (articleId: string, data: PipelineProgress) => void;

export function registerAgentPipelineRoutes(
  app: Express,
  broadcastPipelineProgress: BroadcastPipelineProgress,
): void {
  // =============================================
  // ARTICLE PROCESSING PIPELINE (AI Translation)
  // =============================================

  // Generate image for article
  app.post("/api/agents/generate-image/:articleId", authMiddleware, requirePermission("agents"), async (req: Request, res: Response) => {
    try {
      const parsedId = z.string().uuid().safeParse(req.params.articleId);
      if (!parsedId.success) return res.status(400).json({ error: "Invalid article id" });
      const articleId = parsedId.data;

      const article = await storage.getNewsById(articleId);
      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }
      if (article.published !== false) {
        return res.status(409).json({
          code: "PUBLISHED_ARTICLE_REQUIRES_DRAFT",
          error: "Published articles must be converted to a draft before applying agent changes",
        });
      }

      const { orchestrator } = await import('../agents');
      const result = await orchestrator.executeImmediately('image_suggestion', {
        articleId,
        applyChanges: true,
      }, {
        actorId: req.adminUser?.id || null,
        origin: 'manual',
      });

      if (result.success && result.data) {
        res.json({
          success: true,
          ...result.data,
        });
      } else {
        res.status(500).json({ error: result.error || "Failed to generate image" });
      }
    } catch (error) {
      console.error("Image generation error:", error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });

  // Register the exact batch path before the dynamic :articleId route so that
  // Express never interprets "process-all" as an article identifier.
  app.post("/api/agents/pipeline/process-all", authMiddleware, requirePermission("agents"), async (req: Request, res: Response) => {
    try {
      const parsed = z.object({
        generateImage: z.boolean().default(false),
        limit: z.coerce.number().int().min(1).max(25).default(25),
      }).strict().safeParse(req.body || {});
      if (!parsed.success) return res.status(400).json({ error: "Invalid batch request" });

      const candidates = (await storage.getNews())
        .filter((article) => article.published === false)
        .slice(0, parsed.data.limit);
      const { orchestrator } = await import('../agents');
      const stages: AgentType[] = [
        'formatter',
        'category_agent',
        'metadata_linker',
        'seo_optimizer',
        'polyglot_translator',
      ];

      const results: Record<string, Awaited<ReturnType<typeof orchestrator.runPipeline>>> = {};
      for (const article of candidates) {
        const pipelineResult = await orchestrator.runPipeline(article.id, stages, {
          actorId: req.adminUser?.id || null,
          origin: 'pipeline',
        });
        if (parsed.data.generateImage && pipelineResult.success) {
          pipelineResult.results.image_suggestion = await orchestrator.executeImmediately(
            'image_suggestion',
            { articleId: article.id, applyChanges: true },
            { actorId: req.adminUser?.id || null, origin: 'pipeline' },
          );
        }
        results[article.id] = pipelineResult;
      }

      const successful = Object.values(results).filter((result) => result.success).length;
      return res.json({
        success: successful === candidates.length,
        total: candidates.length,
        successful,
        failed: candidates.length - successful,
        results,
      });
    } catch (error) {
      console.error("Batch processing error:", error);
      return res.status(500).json({ error: "Failed to process articles" });
    }
  });

  // Process single article - FULL RAG AGENTIC PIPELINE
  // Runs ALL agents in sequence: Format → Categorize → Link Metadata → SEO → Translate → Image
  app.post("/api/agents/pipeline/:articleId", authMiddleware, requirePermission("agents"), async (req: Request, res: Response) => {
    try {
      const parsed = z.object({
        articleId: z.string().uuid(),
        generateImage: z.boolean().default(false),
      }).strict().safeParse({ articleId: req.params.articleId, ...(req.body || {}) });
      if (!parsed.success) return res.status(400).json({ error: "Invalid pipeline request" });
      const { articleId, generateImage } = parsed.data;

      const article = await storage.getNewsById(articleId);
      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }
      // No anunciar progreso antes de validar este requisito: de otro modo el
      // panel parece estar procesando algo que el orquestador rechazará.
      if (article.published !== false) {
        return res.status(409).json({
          code: "PUBLISHED_ARTICLE_REQUIRES_DRAFT",
          error: "Published articles must be converted to a draft before applying the pipeline",
        });
      }

      const { orchestrator } = await import('../agents');
      const stages: AgentType[] = [
        'formatter',
        'category_agent',
        'metadata_linker',
        'seo_optimizer',
        'polyglot_translator',
      ];
      broadcastPipelineProgress(articleId, {
        step: 'format',
        status: 'running',
        progress: 2,
        message: 'Preparando el artículo y validando la solicitud',
      });

      const totalVisibleSteps = stages.length + 1 + (generateImage ? 1 : 0);
      const stepAliases: Record<string, string> = {
        formatter: 'format',
        category_agent: 'categorize',
        metadata_linker: 'metadata',
        seo_optimizer: 'seo',
        polyglot_translator: 'translate',
        legal_council: 'council',
        image_suggestion: 'image',
      };
      const result = await orchestrator.runPipeline(articleId, stages, {
        actorId: req.adminUser?.id || null,
        origin: 'pipeline',
        onProgress: ({ stage, status, index, message }) => {
          const completed = status === 'running' ? index : index + 1;
          broadcastPipelineProgress(articleId, {
            step: stepAliases[stage] || stage,
            status,
            progress: Math.max(2, Math.min(98, Math.round((completed / totalVisibleSteps) * 100))),
            message,
          });
        },
      });
      if (generateImage && result.success) {
        const imageIndex = stages.length + 1;
        broadcastPipelineProgress(articleId, {
          step: 'image',
          status: 'running',
          progress: Math.round((imageIndex / totalVisibleSteps) * 100),
          message: 'Generando y guardando la imagen del artículo…',
        });
        result.results.image_suggestion = await orchestrator.executeImmediately(
          'image_suggestion',
          { articleId, applyChanges: true },
          { actorId: req.adminUser?.id || null, origin: 'pipeline' },
        );
        broadcastPipelineProgress(articleId, {
          step: 'image',
          status: result.results.image_suggestion.success ? 'completed' : 'error',
          progress: Math.round(((imageIndex + 1) / totalVisibleSteps) * 100),
          message: result.results.image_suggestion.success
            ? 'Imagen del artículo generada y guardada'
            : (result.results.image_suggestion.error || 'Falló la generación de la imagen del artículo'),
        });
      }
      const steps = Object.fromEntries(
        Object.entries(result.results).map(([agentId, agentResult]) => [
          stepAliases[agentId as AgentType] || agentId,
          agentResult,
        ]),
      );
      const canonicalImageWarning = Boolean(steps.image && !steps.image.success);
      const canonicalPipelineResults = {
        articleId,
        success: result.success,
        steps,
        successfulSteps: Object.values(steps).filter((step) => step.success).length,
        totalSteps: Object.keys(steps).length,
        partialSuccess: result.success && canonicalImageWarning,
        imageWarning: canonicalImageWarning ? (steps.image.error || 'Image generation failed') : null,
        errors: Object.entries(steps)
          .filter(([, step]) => !step.success)
          .map(([step, value]) => `${step}: ${value.error || 'failed'}`),
      };
      broadcastPipelineProgress(articleId, {
        step: 'complete',
        status: result.success ? 'completed' : 'error',
        progress: 100,
        message: result.success ? 'Procesamiento terminado' : 'El procesamiento requiere revisión',
        data: canonicalPipelineResults,
      });
      return res.json(canonicalPipelineResults);
    } catch (error: any) {
      console.error("Pipeline error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to process article pipeline",
      });
    }
  });

  // Auto-Recovery Agent - Repairs failed articles with smart retry logic
  app.post("/api/agents/recover", authMiddleware, requirePermission("agents"), async (req: Request, res: Response) => {
    try {
      console.log('[Recovery] Starting auto-recovery for failed articles...');
      const { recoverFailedItems, getFailedArticlesSummary } = await import('../agents/AutoRecoveryAgent');

      const summary = await getFailedArticlesSummary();
      console.log(`[Recovery] Found ${summary.total} failed articles`);

      if (summary.total === 0) {
        return res.json({
          success: true,
          message: 'No failed articles to recover',
          recovered: 0,
          stillFailed: 0
        });
      }

      const report = await recoverFailedItems();

      res.json({
        success: true,
        message: `Recovery complete: ${report.totalRecovered}/${report.totalFailed} articles recovered`,
        recovered: report.totalRecovered,
        stillFailed: report.totalStillFailed,
        results: report.results
      });
    } catch (error: any) {
      console.error('[Recovery] Error:', error);
      res.status(500).json({
        success: false,
        error: 'Recovery failed',
      });
    }
  });

  // Get failed articles summary for diagnostics
  app.get("/api/agents/failed-summary", authMiddleware, requirePermission("agents"), async (req: Request, res: Response) => {
    try {
      const { getFailedArticlesSummary } = await import('../agents/AutoRecoveryAgent');
      const summary = await getFailedArticlesSummary();
      res.json({ success: true, ...summary });
    } catch (error: any) {
      console.error('[FailedSummary] Error:', error);
      res.status(500).json({ success: false, error: "Failed to load recovery summary" });
    }
  });
}
