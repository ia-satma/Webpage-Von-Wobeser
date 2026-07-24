import { Router, Request, Response } from 'express';
import { orchestrator } from '../core/AgentOrchestrator';
import { knowledgeStore } from '../core/AgentKnowledge';
import { evolutionTracker } from '../core/AgentEvolution';
import { pcloudStorage } from '../storage/PCloudStorage';
import { dbPersistence } from '../storage/DatabasePersistence';
import { contentAnalyzerAgent } from '../specialized/ContentAnalyzerAgent';
import { AgentType } from '../core/types';
import { db } from '../../db';
import { news } from '../../../shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import {
  agentTypeSchema,
  articleIdSchema,
  parseAgentPayload,
} from '../core/contracts';

const router = Router();
const pipelineAgentTypeSchema = z.enum([
  'formatter',
  'metadata_linker',
  'polyglot_translator',
  'seo_optimizer',
  'content_analyzer',
  'image_suggestion',
  'category_agent',
]);
const stagesSchema = z.array(pipelineAgentTypeSchema).max(7).optional();
const jobStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'failed', 'cancelled']);
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
    const parsedAgent = agentTypeSchema.safeParse(req.params.agentType);
    if (!parsedAgent.success) return res.status(400).json({ error: 'Invalid agent type' });
    const agentType = parsedAgent.data;
    const memoryStats = evolutionTracker.getAgentStats(agentType);
    const knowledge = await knowledgeStore.getStats(agentType);
    
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
    const validatedPayload = parseAgentPayload(parsedAgent.data, parsedPayload.data);
    if (!validatedPayload.success) {
      return res.status(400).json({ error: 'Invalid agent payload', details: validatedPayload.error });
    }
    const payload = validatedPayload.data;

    const result = await orchestrator.executeImmediately(agentType, payload);

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
    
    const allNews = await db
      .select({ id: news.id, title: news.title })
      .from(news)
      .where(eq(news.published, false))
      .limit(limit);
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

router.post('/pipeline/:articleId', async (req: Request, res: Response) => {
  try {
    const parsed = z.object({ stages: stagesSchema }).strict().safeParse(req.body || {});
    const parsedId = articleIdSchema.safeParse(req.params.articleId);
    if (!parsed.success || !parsedId.success) return res.status(400).json({ error: 'Invalid pipeline request' });
    const articleId = parsedId.data;
    const { stages } = parsed.data;

    const result = await orchestrator.runPipeline(articleId, stages as AgentType[] | undefined);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Agent operation failed' });
  }
});

router.post('/audit', async (req: Request, res: Response) => {
  try {
    const parsed = z.object({
      scanType: z.enum(['full', 'translations', 'metadata', 'formatting']).optional(),
    }).strict().safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ error: 'Invalid audit request' });
    const result = await orchestrator.executeImmediately('content_auditor', parsed.data);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Agent operation failed' });
  }
});

router.get('/evolution/proposals', async (req: Request, res: Response) => {
  try {
    const parsed = z.object({
      status: z.enum(['pending', 'approved', 'rejected', 'implemented']).optional(),
      agentType: agentTypeSchema.optional(),
      limit: z.coerce.number().int().min(1).max(200).default(100),
    }).safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid proposal filters' });

    const proposals = await evolutionTracker.getProposals({
      status: parsed.data.status,
      agentType: parsed.data.agentType,
      limit: parsed.data.limit,
    });

    res.json(proposals);
  } catch (error) {
    res.status(500).json({ error: 'Agent operation failed' });
  }
});

router.post('/evolution/proposals/:id/status', async (req: Request, res: Response) => {
  try {
    const parsed = z.object({
      id: z.string().uuid(),
      status: z.enum(['pending', 'approved', 'rejected', 'implemented']),
      afterMetrics: z.record(z.number().finite()).optional(),
    }).strict().safeParse({ id: req.params.id, ...req.body });
    if (!parsed.success) return res.status(400).json({ error: 'Invalid proposal update' });
    const { id, status, afterMetrics } = parsed.data;
    
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
    const parsedAgent = agentTypeSchema.safeParse(req.params.agentType);
    if (!parsedAgent.success) return res.status(400).json({ error: 'Invalid agent type' });
    const documents = await knowledgeStore.getDocuments(parsedAgent.data);
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
    const parsed = z.object({
      agentType: agentTypeSchema.optional(),
      status: jobStatusSchema.optional(),
      limit: z.coerce.number().int().min(1).max(200).default(100),
    }).safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid job filters' });

    const jobs = await orchestrator.getJobHistory({
      agentType: parsed.data.agentType,
      status: parsed.data.status,
      limit: parsed.data.limit,
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
    const { agentType, priority } = parsed.data;
    const validatedPayload = parseAgentPayload(agentType, parsed.data.payload);
    if (!validatedPayload.success) {
      return res.status(400).json({ error: 'Invalid agent payload', details: validatedPayload.error });
    }
    
    const job = await orchestrator.enqueueJob(agentType, validatedPayload.data, { priority });
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
    const parsedId = articleIdSchema.safeParse(req.params.articleId);
    if (!parsedId.success) return res.status(400).json({ error: 'Invalid article id' });
    const result = await orchestrator.executeImmediately('content_analyzer', { articleId: parsedId.data });
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
