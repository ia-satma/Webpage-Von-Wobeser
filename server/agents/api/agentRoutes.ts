import { Router, Request, Response } from 'express';
import { orchestrator } from '../core/AgentOrchestrator';
import { knowledgeStore } from '../core/AgentKnowledge';
import { evolutionTracker } from '../core/AgentEvolution';
import { pcloudStorage } from '../storage/PCloudStorage';
import { dbPersistence } from '../storage/DatabasePersistence';
import { formatterAgent } from '../specialized/FormatterAgent';
import { metadataLinkerAgent } from '../specialized/MetadataLinkerAgent';
import { polyglotTranslatorAgent } from '../specialized/PolyglotTranslatorAgent';
import { contentAuditorAgent } from '../specialized/ContentAuditorAgent';
import { seoOptimizerAgent } from '../specialized/SEOOptimizerAgent';
import { contentAnalyzerAgent } from '../specialized/ContentAnalyzerAgent';
import { imageSuggestionAgent } from '../specialized/ImageSuggestionAgent';
import { categoryAgent } from '../specialized/CategoryAgent';
import { websiteAuditorAgent } from '../specialized/WebsiteAuditorAgent';
import { socialMediaAgent } from '../specialized/SocialMediaAgent';
import { newsletterAgent } from '../specialized/NewsletterAgent';
import { legalAlertsAgent } from '../specialized/LegalAlertsAgent';
import { voiceAgent } from '../specialized/VoiceAgent';
import { presentationGeneratorAgent } from '../specialized/PresentationGeneratorAgent';
import { AgentType, ExecutionContext } from '../core/types';
import { db } from '../../db';
import { news } from '../../../shared/schema';
import { z } from 'zod';

const router = Router();
const agentTypeSchema = z.enum([
  'formatter',
  'metadata_linker',
  'polyglot_translator',
  'content_auditor',
  'seo_optimizer',
  'content_analyzer',
  'image_suggestion',
  'category_agent',
  'website_auditor',
  'social_media',
  'newsletter',
  'legal_alerts',
  'voice_agent',
  'presentation_generator',
]);
const articleIdSchema = z.string().uuid();
const stagesSchema = z.array(agentTypeSchema).max(8).optional();
const boundedPayloadSchema = z.record(z.unknown())
  .refine((payload) => Object.keys(payload).length <= 50, 'Too many payload fields')
  .refine((payload) => Buffer.byteLength(JSON.stringify(payload)) <= 100_000, 'Payload is too large');

router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await orchestrator.getStatus();
    const evolutionSummary = await evolutionTracker.getSummary();
    const knowledgeStats = await knowledgeStore.getStats();
    
    const jobStats = await dbPersistence.getJobStatsByAgentType();
    const failedJobs = await dbPersistence.getFailedJobs(10);
    const recentJobs = await dbPersistence.getRecentJobs(20);
    const recentEvents = await dbPersistence.getRecentEvents(50);
    
    res.json({
      orchestrator: {
        ...status,
        jobStatsByAgent: jobStats,
      },
      evolution: evolutionSummary,
      knowledge: knowledgeStats,
      database: {
        recentJobs: recentJobs.length,
        failedJobs: failedJobs.length,
        recentEvents: recentEvents.length,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Agent operation failed' });
  }
});

router.get('/stats/:agentType', async (req: Request, res: Response) => {
  try {
    const { agentType } = req.params;
    const memoryStats = evolutionTracker.getAgentStats(agentType as AgentType);
    const knowledge = await knowledgeStore.getStats(agentType as AgentType);
    
    const allJobStats = await dbPersistence.getJobStatsByAgentType();
    const jobStats = allJobStats[agentType] || { total: 0, completed: 0, failed: 0, pending: 0 };
    const skills = await dbPersistence.getSkillsByAgent(agentType);
    const proposals = await dbPersistence.getProposals({ agentType });
    
    res.json({ 
      stats: memoryStats,
      database: {
        jobs: jobStats,
        skills: skills.length,
        proposals: proposals.length,
      },
      knowledge 
    });
  } catch (error) {
    res.status(500).json({ error: 'Agent operation failed' });
  }
});

router.get('/jobs/failed', async (req: Request, res: Response) => {
  try {
    const parsed = z.coerce.number().int().min(1).max(100).default(50).safeParse(req.query.limit);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid limit' });
    const failedJobs = await orchestrator.getFailedJobs(parsed.data);
    res.json(failedJobs);
  } catch (error) {
    res.status(500).json({ error: 'Agent operation failed' });
  }
});

router.post('/run/:agentType', async (req: Request, res: Response) => {
  try {
    const parsedAgent = agentTypeSchema.safeParse(req.params.agentType);
    const parsedPayload = boundedPayloadSchema.safeParse(req.body);
    if (!parsedAgent.success || !parsedPayload.success) {
      return res.status(400).json({ error: 'Invalid agent request' });
    }
    const agentType = parsedAgent.data;
    const payload = parsedPayload.data;

    const context: ExecutionContext = {
      jobId: `manual-${Date.now()}`,
      agentType: agentType as AgentType,
      startTime: new Date(),
      metadata: { source: 'api' },
    };

    let result;
    switch (agentType) {
      case 'formatter':
        result = await formatterAgent.execute(context, payload);
        break;
      case 'metadata_linker':
        result = await metadataLinkerAgent.execute(context, payload);
        break;
      case 'polyglot_translator':
        result = await polyglotTranslatorAgent.execute(context, payload);
        break;
      case 'content_auditor':
        result = await contentAuditorAgent.execute(context, payload);
        break;
      case 'seo_optimizer':
        result = await seoOptimizerAgent.execute(context, payload);
        break;
      case 'content_analyzer':
        result = await contentAnalyzerAgent.execute(context, payload);
        break;
      case 'image_suggestion':
        result = await imageSuggestionAgent.execute(context, payload);
        break;
      case 'category_agent':
        result = await categoryAgent.execute(context, payload);
        break;
      case 'website_auditor':
        result = await websiteAuditorAgent.execute(context, payload);
        break;
      case 'social_media':
        result = await socialMediaAgent.execute(context, payload);
        break;
      case 'newsletter':
        result = await newsletterAgent.execute(context, payload);
        break;
      case 'legal_alerts':
        result = await legalAlertsAgent.execute(context, payload);
        break;
      case 'voice_agent':
        result = await voiceAgent.execute(context, payload);
        break;
      case 'presentation_generator':
        result = await presentationGeneratorAgent.execute(context, payload);
        break;
      default:
        return res.status(400).json({ error: `Unknown agent type: ${agentType}` });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Agent operation failed' });
  }
});

router.post('/pipeline/:articleId', async (req: Request, res: Response) => {
  try {
    const parsed = z.object({ stages: stagesSchema }).strict().safeParse(req.body || {});
    const parsedId = articleIdSchema.safeParse(req.params.articleId);
    if (!parsed.success || !parsedId.success) return res.status(400).json({ error: 'Invalid pipeline request' });
    const articleId = parsedId.data;
    const { stages } = parsed.data;
    
    const result = await orchestrator.runPipeline(articleId, stages);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Agent operation failed' });
  }
});

router.post('/pipeline/batch', async (req: Request, res: Response) => {
  try {
    const parsed = z.object({
      articleIds: z.array(articleIdSchema).min(1).max(25).transform((ids) => Array.from(new Set(ids))),
      stages: stagesSchema,
    }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid pipeline batch' });
    const { articleIds, stages } = parsed.data;

    const results: Record<string, any> = {};
    
    for (const articleId of articleIds) {
      results[articleId] = await orchestrator.runPipeline(articleId, stages);
    }

    res.json({ 
      total: articleIds.length,
      successful: Object.values(results).filter((r: any) => r.success).length,
      results 
    });
  } catch (error) {
    res.status(500).json({ error: 'Agent operation failed' });
  }
});

router.post('/pipeline/process-all', async (req: Request, res: Response) => {
  try {
    const parsed = z.object({
      stages: stagesSchema,
      limit: z.coerce.number().int().min(1).max(25).default(25),
    }).strict().safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ error: 'Invalid process request' });
    const { stages, limit } = parsed.data;
    
    const allNews = await db.select({ id: news.id, title: news.title }).from(news).limit(limit);
    const articleIds = allNews.map(n => n.id);
    
    console.log(`[Pipeline] Processing ${articleIds.length} articles...`);
    
    const results: Record<string, any> = {};
    let processed = 0;
    let successful = 0;
    let failed = 0;
    
    for (const articleId of articleIds) {
      try {
        console.log(`[Pipeline] Processing article ${++processed}/${articleIds.length}: ${articleId}`);
        const result = await orchestrator.runPipeline(articleId, stages);
        results[articleId] = result;
        if (result.success) successful++;
        else failed++;
      } catch (error) {
        results[articleId] = { success: false, error: 'Pipeline stage failed' };
        failed++;
      }
    }

    console.log(`[Pipeline] Completed: ${successful} successful, ${failed} failed`);
    
    res.json({ 
      total: articleIds.length,
      successful,
      failed,
      results 
    });
  } catch (error) {
    res.status(500).json({ error: 'Agent operation failed' });
  }
});

router.post('/audit', async (req: Request, res: Response) => {
  try {
    const { scanType } = req.body;
    
    const context: ExecutionContext = {
      jobId: `audit-${Date.now()}`,
      agentType: 'content_auditor',
      startTime: new Date(),
      metadata: { source: 'api' },
    };

    const result = await contentAuditorAgent.execute(context, { scanType });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Agent operation failed' });
  }
});

router.get('/evolution/proposals', async (req: Request, res: Response) => {
  try {
    const { status, agentType, limit } = req.query;
    
    const proposals = await evolutionTracker.getProposals({
      status: status as any,
      agentType: agentType as AgentType,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json(proposals);
  } catch (error) {
    res.status(500).json({ error: 'Agent operation failed' });
  }
});

router.post('/evolution/proposals/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, afterMetrics } = req.body;
    
    const updated = await evolutionTracker.updateProposalStatus(id, status, afterMetrics);
    
    if (!updated) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Agent operation failed' });
  }
});

router.post('/evolution/learning-cycle', async (req: Request, res: Response) => {
  try {
    const result = await evolutionTracker.runLearningCycle();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Agent operation failed' });
  }
});

router.get('/knowledge/:agentType', async (req: Request, res: Response) => {
  try {
    const { agentType } = req.params;
    const documents = await knowledgeStore.getDocuments(agentType as AgentType);
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Agent operation failed' });
  }
});

router.post('/knowledge/:agentType/search', async (req: Request, res: Response) => {
  try {
    const parsedAgent = agentTypeSchema.safeParse(req.params.agentType);
    const parsed = z.object({
      query: z.string().trim().min(1).max(4_000),
      category: z.string().trim().max(80).optional(),
      limit: z.coerce.number().int().min(1).max(50).default(20),
    }).strict().safeParse(req.body);
    if (!parsedAgent.success || !parsed.success) return res.status(400).json({ error: 'Invalid knowledge search' });
    const agentType = parsedAgent.data;
    const { query, category, limit } = parsed.data;
    
    const documents = await knowledgeStore.searchDocuments(
      agentType as AgentType,
      query,
      { category, limit }
    );

    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Agent operation failed' });
  }
});

router.get('/pcloud/test', async (req: Request, res: Response) => {
  try {
    const connected = await pcloudStorage.testConnection();
    res.json({ connected });
  } catch (error) {
    res.status(500).json({ error: 'Storage connection failed', connected: false });
  }
});

router.post('/pcloud/sync', async (req: Request, res: Response) => {
  try {
    const result = await pcloudStorage.syncAll();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Agent operation failed' });
  }
});

router.post('/pcloud/load', async (req: Request, res: Response) => {
  try {
    const result = await pcloudStorage.loadAll();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Agent operation failed' });
  }
});

router.get('/jobs', async (req: Request, res: Response) => {
  try {
    const { agentType, status, limit } = req.query;
    
    const jobs = orchestrator.getJobHistory({
      agentType: agentType as AgentType,
      status: status as any,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Agent operation failed' });
  }
});

router.post('/queue', async (req: Request, res: Response) => {
  try {
    const parsed = z.object({
      agentType: agentTypeSchema,
      payload: boundedPayloadSchema,
      priority: z.enum(['low', 'normal', 'high']).default('normal'),
    }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid queue request' });
    const { agentType, payload, priority } = parsed.data;
    
    const job = await orchestrator.enqueueJob(agentType, payload, { priority });
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: 'Agent operation failed' });
  }
});

router.post('/processing/start', async (req: Request, res: Response) => {
  try {
    orchestrator.startProcessing();
    res.json({ message: 'Job processing started' });
  } catch (error) {
    res.status(500).json({ error: 'Agent operation failed' });
  }
});

router.post('/processing/stop', async (req: Request, res: Response) => {
  try {
    orchestrator.stopProcessing();
    res.json({ message: 'Job processing stopped' });
  } catch (error) {
    res.status(500).json({ error: 'Agent operation failed' });
  }
});

router.post('/analyze/:articleId', async (req: Request, res: Response) => {
  try {
    const { articleId } = req.params;
    
    const context: ExecutionContext = {
      jobId: `analyze-${Date.now()}`,
      agentType: 'content_analyzer',
      startTime: new Date(),
      metadata: { source: 'api' },
    };

    const result = await contentAnalyzerAgent.execute(context, { articleId });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Agent operation failed' });
  }
});

router.get('/analyze/:articleId', async (req: Request, res: Response) => {
  try {
    const { articleId } = req.params;
    const analysis = await contentAnalyzerAgent.getAnalysis(articleId);
    
    if (!analysis) {
      return res.status(404).json({ error: 'No analysis found for this article' });
    }

    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: 'Agent operation failed' });
  }
});

export default router;
