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

      const {
        formatterAgent,
        categoryAgent,
        metadataLinkerAgent,
        seoOptimizerAgent,
        polyglotTranslatorAgent,
        imageSuggestionAgent
      } = await import('../agents');

      const createContext = (agentType: string) => ({
        jobId: `${agentType}-${articleId}-${Date.now()}`,
        agentType: agentType as any,
        startTime: new Date(),
        metadata: { articleId },
      });

      const pipelineResults: Record<string, any> = {
        articleId,
        steps: {},
        success: true,
        errors: [],
      };

      const totalSteps = generateImage ? 6 : 5;
      const completedSteps = new Set<string>();

      // Helper to broadcast progress - only count unique step completions
      const emitProgress = (step: string, status: 'running' | 'completed' | 'error', language?: string, message?: string) => {
        let progress = 0;
        if (status === 'completed' && !completedSteps.has(step)) {
          completedSteps.add(step);
        }
        progress = Math.round((completedSteps.size / totalSteps) * 100);

        broadcastPipelineProgress(articleId, {
          step,
          status,
          language,
          progress,
          message,
        });
      };

      // Step 1: FORMAT - Clean and structure the article text
      console.log(`[Pipeline] Step 1: Formatting article ${articleId}`);
      emitProgress('format', 'running', undefined, 'Cleaning article text...');
      try {
        const formatResult = await formatterAgent.execute(
          createContext('formatter'),
          { articleId }
        );
        pipelineResults.steps.format = {
          success: formatResult.success,
          data: formatResult.data,
          error: formatResult.error
        };
        emitProgress('format', formatResult.success ? 'completed' : 'error', undefined, formatResult.success ? 'Article formatted' : formatResult.error);
      } catch (err: any) {
        pipelineResults.steps.format = { success: false, error: "Formatting failed" };
        pipelineResults.errors.push("Format: failed");
        emitProgress('format', 'error', undefined, "Formatting failed");
      }

      // Step 2: CATEGORIZE - Automatically categorize for SEO
      console.log(`[Pipeline] Step 2: Categorizing article ${articleId}`);
      emitProgress('categorize', 'running', undefined, 'Categorizing article...');
      try {
        const categoryResult = await categoryAgent.execute(
          createContext('category_agent'),
          { articleId }
        );
        pipelineResults.steps.categorize = {
          success: categoryResult.success,
          data: categoryResult.data,
          error: categoryResult.error
        };
        emitProgress('categorize', categoryResult.success ? 'completed' : 'error', undefined,
          categoryResult.success ? `Category: ${(categoryResult.data as any)?.primaryCategory || 'assigned'}` : categoryResult.error);
      } catch (err: any) {
        pipelineResults.steps.categorize = { success: false, error: "Categorization failed" };
        pipelineResults.errors.push("Categorize: failed");
        emitProgress('categorize', 'error', undefined, "Categorization failed");
      }

      // Step 3: LINK METADATA - Connect to authors, practice areas, industries
      console.log(`[Pipeline] Step 3: Linking metadata for article ${articleId}`);
      emitProgress('metadata', 'running', undefined, 'Linking authors and practice areas...');
      try {
        const metadataResult = await metadataLinkerAgent.execute(
          createContext('metadata_linker'),
          { articleId }
        );
        pipelineResults.steps.metadata = {
          success: metadataResult.success,
          data: metadataResult.data,
          error: metadataResult.error
        };
        emitProgress('metadata', metadataResult.success ? 'completed' : 'error', undefined,
          metadataResult.success ? 'Metadata linked' : metadataResult.error);
      } catch (err: any) {
        pipelineResults.steps.metadata = { success: false, error: "Metadata linking failed" };
        pipelineResults.errors.push("Metadata: failed");
        emitProgress('metadata', 'error', undefined, "Metadata linking failed");
      }

      // Step 4: SEO OPTIMIZE - Improve titles, descriptions, slugs
      console.log(`[Pipeline] Step 4: SEO optimizing article ${articleId}`);
      emitProgress('seo', 'running', undefined, 'Optimizing for SEO...');
      try {
        const seoResult = await seoOptimizerAgent.execute(
          createContext('seo_optimizer'),
          { articleId }
        );
        pipelineResults.steps.seo = {
          success: seoResult.success,
          data: seoResult.data,
          error: seoResult.error
        };
        emitProgress('seo', seoResult.success ? 'completed' : 'error', undefined,
          seoResult.success ? 'SEO optimized' : seoResult.error);
      } catch (err: any) {
        pipelineResults.steps.seo = { success: false, error: "SEO optimization failed" };
        pipelineResults.errors.push("SEO: failed");
        emitProgress('seo', 'error', undefined, "SEO optimization failed");
      }

      // Step 5: TRANSLATE - Translate to all 9 target languages (source is Spanish)
      const targetLanguages = ['en', 'de', 'zh', 'ko', 'ja', 'ar', 'ru', 'fr', 'it'];
      console.log(`[Pipeline] Step 5: Translating article ${articleId} to ${targetLanguages.length} languages`);
      emitProgress('translate', 'running', undefined, `Translating to ${targetLanguages.length} languages...`);

      try {
        const translateResult = await polyglotTranslatorAgent.execute(
          createContext('polyglot_translator'),
          { articleId }
        );
        pipelineResults.steps.translate = {
          success: translateResult.success,
          data: translateResult.data,
          error: translateResult.error
        };

        const translatedCount = (translateResult.data as any)?.translatedCount || 0;
        const cachedCount = (translateResult.data as any)?.cachedCount || 0;
        emitProgress('translate', translateResult.success ? 'completed' : 'error', undefined,
          translateResult.success
            ? `Translated: ${translatedCount} new, ${cachedCount} cached`
            : translateResult.error);
      } catch (err: any) {
        pipelineResults.steps.translate = { success: false, error: "Translation failed" };
        pipelineResults.errors.push("Translate: failed");
        emitProgress('translate', 'error', undefined, "Translation failed");
      }

      // Step 6: GENERATE IMAGE (optional)
      if (generateImage) {
        console.log(`[Pipeline] Step 6: Generating image for article ${articleId}`);
        emitProgress('image', 'running', undefined, 'Generando la imagen del artículo con OpenAI...');
        try {
          const imageResult = await imageSuggestionAgent.execute(
            createContext('image_suggestion'),
            { articleId }
          );
          pipelineResults.steps.image = {
            success: imageResult.success,
            data: imageResult.data,
            error: imageResult.error
          };
          emitProgress('image', imageResult.success ? 'completed' : 'error', undefined,
            imageResult.success ? 'Image generated' : imageResult.error);
        } catch (err: any) {
          pipelineResults.steps.image = { success: false, error: "Image generation failed" };
          pipelineResults.errors.push("Image: failed");
          emitProgress('image', 'error', undefined, "Image generation failed");
        }
      }

      // Calculate overall success - IMAGE FAILURES DO NOT FAIL THE PIPELINE
      // Core steps: format, categorize, metadata, seo, translate
      // Optional step: image (failure = warning, not error)
      const coreStepKeys = ['format', 'categorize', 'metadata', 'seo', 'translate'];
      const coreSteps = coreStepKeys
        .filter(key => pipelineResults.steps[key])
        .map(key => ({ key, ...pipelineResults.steps[key] }));

      const successfulCoreSteps = coreSteps.filter(s => s.success).length;
      const totalCoreSteps = coreSteps.length;

      // Image is optional - its failure is a warning, not an error
      const imageStep = pipelineResults.steps.image;
      const imageWarning = imageStep && !imageStep.success;

      const stepResults = Object.values(pipelineResults.steps) as any[];
      const successfulSteps = stepResults.filter(s => s.success).length;
      pipelineResults.successfulSteps = successfulSteps;
      pipelineResults.totalSteps = stepResults.length;

      // SUCCESS = all core steps passed (image failure is acceptable)
      pipelineResults.success = successfulCoreSteps === totalCoreSteps;
      pipelineResults.partialSuccess = pipelineResults.success && imageWarning;
      pipelineResults.imageWarning = imageWarning ? (imageStep?.error || 'Image generation failed') : null;

      console.log(`[Pipeline] Completed: ${successfulCoreSteps}/${totalCoreSteps} core steps successful${imageWarning ? ' (image warning)' : ''}`);

      // Broadcast completion
      broadcastPipelineProgress(articleId, {
        step: 'complete',
        status: 'completed',
        progress: 100,
        message: `Pipeline complete: ${successfulSteps}/${stepResults.length} steps successful`,
        data: pipelineResults,
      });

      res.json(pipelineResults);
    } catch (error: any) {
      console.error("Pipeline error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to process article pipeline",
      });
    }
  });

  // Process all articles - FULL RAG AGENTIC PIPELINE for all articles
  app.post("/api/agents/pipeline/process-all", authMiddleware, requirePermission("agents"), async (req: Request, res: Response) => {
    try {
      const allNews = await storage.getNews();

      if (!allNews || allNews.length === 0) {
        return res.json({ success: true, total: 0, successful: 0, message: "No articles to process" });
      }

      const { generateImage = false } = req.body;
      const {
        formatterAgent,
        categoryAgent,
        metadataLinkerAgent,
        seoOptimizerAgent,
        polyglotTranslatorAgent,
        imageSuggestionAgent
      } = await import('../agents');

      const createContext = (agentType: string, articleId: string) => ({
        jobId: `${agentType}-${articleId}-${Date.now()}`,
        agentType: agentType as any,
        startTime: new Date(),
        metadata: { articleId },
      });

      let successfulCount = 0;
      const results: Record<string, any>[] = [];

      for (const article of allNews) {
        console.log(`[Pipeline] Processing article ${article.id}: ${article.titleEs?.substring(0, 50)}...`);
        const articleResult: Record<string, any> = {
          articleId: article.id,
          title: article.titleEs,
          steps: {},
          success: false
        };

        try {
          // Step 1: FORMAT
          try {
            const formatResult = await formatterAgent.execute(
              createContext('formatter', article.id),
              { articleId: article.id }
            );
            articleResult.steps.format = { success: formatResult.success };
          } catch (err: any) {
            console.error(`[Pipeline] Format error for ${article.id}:`, err.message);
            articleResult.steps.format = { success: false, error: "Formatting failed" };
          }

          // Step 2: CATEGORIZE
          try {
            const categoryResult = await categoryAgent.execute(
              createContext('category_agent', article.id),
              { articleId: article.id }
            );
            articleResult.steps.categorize = { success: categoryResult.success };
          } catch (err: any) {
            console.error(`[Pipeline] Categorize error for ${article.id}:`, err.message);
            articleResult.steps.categorize = { success: false, error: "Categorization failed" };
          }

          // Step 3: METADATA
          try {
            const metadataResult = await metadataLinkerAgent.execute(
              createContext('metadata_linker', article.id),
              { articleId: article.id }
            );
            articleResult.steps.metadata = { success: metadataResult.success };
          } catch (err: any) {
            console.error(`[Pipeline] Metadata error for ${article.id}:`, err.message);
            articleResult.steps.metadata = { success: false, error: "Metadata linking failed" };
          }

          // Step 4: SEO
          try {
            const seoResult = await seoOptimizerAgent.execute(
              createContext('seo_optimizer', article.id),
              { articleId: article.id }
            );
            articleResult.steps.seo = { success: seoResult.success };
          } catch (err: any) {
            console.error(`[Pipeline] SEO error for ${article.id}:`, err.message);
            articleResult.steps.seo = { success: false, error: "SEO optimization failed" };
          }

          // Step 5: TRANSLATE
          try {
            const translateResult = await polyglotTranslatorAgent.execute(
              createContext('polyglot_translator', article.id),
              { articleId: article.id }
            );
            articleResult.steps.translate = { success: translateResult.success };
          } catch (err: any) {
            console.error(`[Pipeline] Translate error for ${article.id}:`, err.message);
            articleResult.steps.translate = { success: false, error: "Translation failed" };
          }

          // Step 6: IMAGE (optional)
          if (generateImage) {
            try {
              console.log(`[Pipeline] Starting image generation for ${article.id}...`);
              const imageResult = await imageSuggestionAgent.execute(
                createContext('image_suggestion', article.id),
                { articleId: article.id }
              );
              console.log(`[Pipeline] Image result for ${article.id}:`, imageResult.success ? 'SUCCESS' : imageResult.error);
              articleResult.steps.image = { success: imageResult.success, error: imageResult.error };
            } catch (err: any) {
              console.error(`[Pipeline] Image generation error for ${article.id}:`, err.message);
              articleResult.steps.image = { success: false, error: "Image generation failed" };
            }
          }

          articleResult.success = true;
          successfulCount++;
        } catch (error) {
          console.error(`Error processing article ${article.id}:`, error);
        }

        results.push(articleResult);
      }

      res.json({
        success: true,
        total: allNews.length,
        successful: successfulCount,
        message: `Processed ${successfulCount} of ${allNews.length} articles`,
      });
    } catch (error) {
      console.error("Batch processing error:", error);
      res.status(500).json({ error: "Failed to process articles" });
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
