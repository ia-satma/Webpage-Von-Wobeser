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
import { AgentType, ExecutionContext } from '../core/types';
import { db } from '../../db';
import { news } from '../../../shared/schema';

const router = Router();

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
    res.status(500).json({ error: String(error) });
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
    res.status(500).json({ error: String(error) });
  }
});

router.get('/jobs/failed', async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const failedJobs = await orchestrator.getFailedJobs(limit ? parseInt(limit as string) : 50);
    res.json(failedJobs);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.post('/run/:agentType', async (req: Request, res: Response) => {
  try {
    const { agentType } = req.params;
    const payload = req.body;

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
      default:
        return res.status(400).json({ error: `Unknown agent type: ${agentType}` });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.post('/pipeline/:articleId', async (req: Request, res: Response) => {
  try {
    const { articleId } = req.params;
    const { stages } = req.body;
    
    const result = await orchestrator.runPipeline(articleId, stages);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.post('/pipeline/batch', async (req: Request, res: Response) => {
  try {
    const { articleIds, stages } = req.body;
    
    if (!articleIds || !Array.isArray(articleIds)) {
      return res.status(400).json({ error: 'articleIds array required' });
    }

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
    res.status(500).json({ error: String(error) });
  }
});

router.post('/pipeline/process-all', async (req: Request, res: Response) => {
  try {
    const { stages, limit } = req.body;
    
    const allNews = await db.select({ id: news.id, title: news.title }).from(news);
    const articleIds = limit ? allNews.slice(0, limit).map(n => n.id) : allNews.map(n => n.id);
    
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
        results[articleId] = { success: false, error: String(error) };
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
    res.status(500).json({ error: String(error) });
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
    res.status(500).json({ error: String(error) });
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
    res.status(500).json({ error: String(error) });
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
    res.status(500).json({ error: String(error) });
  }
});

router.post('/evolution/learning-cycle', async (req: Request, res: Response) => {
  try {
    const result = await evolutionTracker.runLearningCycle();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.get('/knowledge/:agentType', async (req: Request, res: Response) => {
  try {
    const { agentType } = req.params;
    const documents = await knowledgeStore.getDocuments(agentType as AgentType);
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.post('/knowledge/:agentType/search', async (req: Request, res: Response) => {
  try {
    const { agentType } = req.params;
    const { query, category, limit } = req.body;
    
    const documents = await knowledgeStore.searchDocuments(
      agentType as AgentType,
      query,
      { category, limit }
    );

    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.get('/pcloud/test', async (req: Request, res: Response) => {
  try {
    const connected = await pcloudStorage.testConnection();
    res.json({ connected });
  } catch (error) {
    res.status(500).json({ error: String(error), connected: false });
  }
});

router.post('/pcloud/sync', async (req: Request, res: Response) => {
  try {
    const result = await pcloudStorage.syncAll();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.post('/pcloud/load', async (req: Request, res: Response) => {
  try {
    const result = await pcloudStorage.loadAll();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: String(error) });
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
    res.status(500).json({ error: String(error) });
  }
});

router.post('/queue', async (req: Request, res: Response) => {
  try {
    const { agentType, payload, priority } = req.body;
    
    const job = await orchestrator.enqueueJob(agentType, payload, { priority });
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.post('/processing/start', async (req: Request, res: Response) => {
  try {
    orchestrator.startProcessing();
    res.json({ message: 'Job processing started' });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.post('/processing/stop', async (req: Request, res: Response) => {
  try {
    orchestrator.stopProcessing();
    res.json({ message: 'Job processing stopped' });
  } catch (error) {
    res.status(500).json({ error: String(error) });
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
    res.status(500).json({ error: String(error) });
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
    res.status(500).json({ error: String(error) });
  }
});

export default router;
