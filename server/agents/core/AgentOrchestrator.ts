import { BaseAgent } from './BaseAgent';
import { 
  AgentType, 
  AgentJob, 
  JobStatus, 
  JobPriority,
  AgentEvent,
  ExecutionContext,
  AgentResult 
} from './types';
import { knowledgeStore } from './AgentKnowledge';
import { evolutionTracker } from './AgentEvolution';
import { dbPersistence } from '../storage/DatabasePersistence';
import { legalCouncilService } from '../../../services/agents/LegalCouncilService';
import { db } from '../../db';
import { news } from '@shared/schema';
import { eq } from 'drizzle-orm';

export class AgentOrchestrator {
  private agents: Map<AgentType, BaseAgent> = new Map();
  private jobQueue: AgentJob[] = [];
  private activeJobs: Map<string, AgentJob> = new Map();
  private isRunning: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private isProcessingCycle: boolean = false;
  private initialized: boolean = false;
  // Backoff de reintentos: cuándo (epoch ms) puede volver a correr cada job tras un fallo.
  // En memoria (no toca el AgentJob persistido); se limpia al completar/fallar el job.
  private retryAfter: Map<string, number> = new Map();

  // Errores NO reintetables: validación de entrada / recurso inexistente.
  // Reintentar no los arregla → se falla de una vez en vez de quemar la cola.
  private isNonRetryableError(message: string): boolean {
    const m = message.toLowerCase();
    return (
      m.includes('not found') ||
      m.includes('404') ||
      m.includes('not registered') ||
      m.includes('invalid') ||
      m.includes('validation') ||
      m.includes('missing required') ||
      m.includes('no content')
    );
  }

  isProcessing(): boolean {
    return this.isRunning;
  }

  start(intervalMs: number = 1000): void {
    this.startProcessing(intervalMs);
  }

  async initialize(): Promise<void> {
    // Idempotente: el boot llamaba a initialize() dos veces (initializeAgents en
    // registerRoutes y de nuevo en el callback de listen), recargando jobs por duplicado.
    if (this.initialized) {
      console.log('[Orchestrator] Already initialized, skipping');
      return;
    }
    this.initialized = true;
    console.log('[Orchestrator] Initializing agent system...');
    await knowledgeStore.initialize();
    await knowledgeStore.addLegalGlossary();
    await evolutionTracker.initialize();
    
    await this.loadPendingJobsFromDatabase();
    
    console.log('[Orchestrator] Agent system initialized');
  }

  private async loadPendingJobsFromDatabase(): Promise<void> {
    try {
      const resetCount = await dbPersistence.resetInProgressJobsToPending();
      if (resetCount > 0) {
        console.log(`[Orchestrator] Reset ${resetCount} in_progress jobs to pending for retry`);
      }

      const pendingJobs = await dbPersistence.getPendingJobs();
      console.log(`[Orchestrator] Loading ${pendingJobs.length} pending jobs from database`);
      
      const priorityOrder: Record<JobPriority, number> = {
        critical: 0,
        high: 1,
        normal: 2,
        low: 3,
      };

      const jobs: AgentJob[] = pendingJobs.map(dbJob => ({
        id: dbJob.id,
        agentType: dbJob.agentType as AgentType,
        status: dbJob.status as JobStatus,
        priority: (dbJob.priority || 'normal') as JobPriority,
        payload: dbJob.payload as Record<string, unknown>,
        result: dbJob.result as Record<string, unknown> | undefined,
        error: dbJob.error || undefined,
        retryCount: dbJob.retryCount || 0,
        maxRetries: dbJob.maxRetries || 3,
        createdAt: dbJob.createdAt || new Date(),
        startedAt: dbJob.startedAt || undefined,
        completedAt: dbJob.completedAt || undefined,
        parentJobId: dbJob.parentJobId || undefined,
      }));

      jobs.sort((a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2));
      this.jobQueue.push(...jobs);
      
      const failedJobs = await dbPersistence.getFailedJobs(20);
      if (failedJobs.length > 0) {
        console.log(`[Orchestrator] ${failedJobs.length} failed jobs available for monitoring`);
      }
      
      console.log(`[Orchestrator] Loaded ${this.jobQueue.length} jobs into queue`);
      
      await this.syncQueueWithDatabase();
    } catch (error) {
      console.error('[Orchestrator] Error loading pending jobs:', error);
    }
  }

  private async syncQueueWithDatabase(): Promise<number> {
    try {
      const pendingDbJobs = await dbPersistence.getPendingJobs();
      const existingJobIds = new Set(this.jobQueue.map(j => j.id));
      const activeJobIds = new Set(this.activeJobs.keys());
      
      const priorityOrder: Record<JobPriority, number> = {
        critical: 0,
        high: 1,
        normal: 2,
        low: 3,
      };

      let addedCount = 0;

      for (const dbJob of pendingDbJobs) {
        if (existingJobIds.has(dbJob.id) || activeJobIds.has(dbJob.id)) {
          continue;
        }

        const job: AgentJob = {
          id: dbJob.id,
          agentType: dbJob.agentType as AgentType,
          status: dbJob.status as JobStatus,
          priority: (dbJob.priority || 'normal') as JobPriority,
          payload: dbJob.payload as Record<string, unknown>,
          result: dbJob.result as Record<string, unknown> | undefined,
          error: dbJob.error || undefined,
          retryCount: dbJob.retryCount || 0,
          maxRetries: dbJob.maxRetries || 3,
          createdAt: dbJob.createdAt || new Date(),
          startedAt: dbJob.startedAt || undefined,
          completedAt: dbJob.completedAt || undefined,
          parentJobId: dbJob.parentJobId || undefined,
        };

        const insertIndex = this.jobQueue.findIndex(
          j => priorityOrder[j.priority] > priorityOrder[job.priority]
        );

        if (insertIndex === -1) {
          this.jobQueue.push(job);
        } else {
          this.jobQueue.splice(insertIndex, 0, job);
        }

        addedCount++;
      }

      if (addedCount > 0) {
        console.log(`[Orchestrator] Synced ${addedCount} new jobs from database to in-memory queue`);
      }

      return addedCount;
    } catch (error) {
      console.error('[Orchestrator] Error syncing queue with database:', error);
      return 0;
    }
  }

  async getFailedJobs(limit: number = 50): Promise<AgentJob[]> {
    const dbJobs = await dbPersistence.getFailedJobs(limit);
    return dbJobs.map(j => ({
      id: j.id,
      agentType: j.agentType as AgentType,
      status: j.status as JobStatus,
      priority: (j.priority || 'normal') as JobPriority,
      payload: j.payload as Record<string, unknown>,
      result: j.result as Record<string, unknown> | undefined,
      error: j.error || undefined,
      retryCount: j.retryCount || 0,
      maxRetries: j.maxRetries || 3,
      createdAt: j.createdAt || new Date(),
      startedAt: j.startedAt || undefined,
      completedAt: j.completedAt || undefined,
      parentJobId: j.parentJobId || undefined,
    }));
  }

  registerAgent(agent: BaseAgent): void {
    this.agents.set(agent.agentType, agent);
    console.log(`[Orchestrator] Registered agent: ${agent.name}`);
  }

  getAgent(agentType: AgentType): BaseAgent | undefined {
    return this.agents.get(agentType);
  }

  async enqueueJob(
    agentType: AgentType,
    payload: Record<string, unknown>,
    options?: {
      priority?: JobPriority;
      parentJobId?: string;
      maxRetries?: number;
    }
  ): Promise<AgentJob> {
    const priority = options?.priority || 'normal';
    
    const dbJob = await dbPersistence.createJob({
      agentType,
      status: 'pending',
      priority,
      payload,
      retryCount: 0,
      maxRetries: options?.maxRetries ?? 3,
      parentJobId: options?.parentJobId,
    });

    const job: AgentJob = {
      id: dbJob.id,
      agentType,
      status: 'pending',
      priority,
      payload,
      retryCount: 0,
      maxRetries: options?.maxRetries ?? 3,
      createdAt: dbJob.createdAt || new Date(),
      parentJobId: options?.parentJobId,
    };

    const priorityOrder: Record<JobPriority, number> = {
      critical: 0,
      high: 1,
      normal: 2,
      low: 3,
    };

    const insertIndex = this.jobQueue.findIndex(
      j => priorityOrder[j.priority] > priorityOrder[job.priority]
    );

    if (insertIndex === -1) {
      this.jobQueue.push(job);
    } else {
      this.jobQueue.splice(insertIndex, 0, job);
    }

    await this.addEvent(job.id, agentType, 'start', `Job enqueued for ${agentType}`, { priority: job.priority });

    return job;
  }

  async runPipeline(
    articleId: string,
    stages: AgentType[] = ['formatter', 'metadata_linker', 'polyglot_translator', 'seo_optimizer']
  ): Promise<{ success: boolean; results: Record<AgentType, AgentResult> }> {
    const results: Record<string, AgentResult> = {};
    let currentData: Record<string, unknown> = { articleId };

    console.log(`[Orchestrator] Starting pipeline for article ${articleId}`);

    for (const stage of stages) {
      const agent = this.agents.get(stage);
      if (!agent) {
        console.warn(`[Orchestrator] Agent ${stage} not registered, skipping`);
        continue;
      }

      const context: ExecutionContext = {
        jobId: `pipeline-${articleId}-${stage}`,
        agentType: stage,
        startTime: new Date(),
        metadata: { articleId, pipelineStage: stage },
      };

      try {
        console.log(`[Orchestrator] Running ${stage}...`);
        const result = await agent.execute(context, currentData);
        results[stage] = result;

        if (!result.success) {
          console.error(`[Orchestrator] ${stage} failed:`, result.error);
          return { success: false, results: results as Record<AgentType, AgentResult> };
        }

        if (result.data) {
          currentData = { ...currentData, ...result.data };
        }

        if (result.learnings && result.learnings.length > 0) {
          for (const learning of result.learnings) {
            await knowledgeStore.addDocument({
              agentType: stage,
              category: 'learning',
              title: learning.context,
              content: learning.insight,
              metadata: { confidence: learning.confidence, source: learning.source },
            });
          }
        }

        if (result.evolutionProposals) {
          for (const proposal of result.evolutionProposals) {
            await evolutionTracker.addProposal(proposal);
          }
        }

        evolutionTracker.updateAgentStats(stage, {
          totalJobs: 1,
          completedJobs: result.success ? 1 : 0,
          failedJobs: result.success ? 0 : 1,
          successRate: result.success ? 1 : 0,
        });

      } catch (error) {
        console.error(`[Orchestrator] ${stage} threw error:`, error);
        results[stage] = { success: false, error: String(error) };
        return { success: false, results: results as Record<AgentType, AgentResult> };
      }
    }

    console.log(`[Orchestrator] Pipeline completed for article ${articleId}`);
    
    // Run Legal Council evaluation after pipeline completes
    try {
      console.log(`[Orchestrator] Running Legal Council evaluation for article ${articleId}...`);
      
      // Get article content for evaluation
      const [article] = await db.select().from(news).where(eq(news.id, articleId));
      
      if (article && article.content) {
        const verdict = await legalCouncilService.evaluateArticle(article.content);

        // Mapeo de estado SIN fail-open: SOLO 'approved' habilita publicación
        // (ready_for_approval, único estado que la ruta de validación deja publicar).
        // Antes 'deadlocked'/'escalated'/'pending_revision' caían a ready_for_approval
        // → un empate o un fallo del Consejo auto-habilitaba el artículo sin revisión.
        // Ahora esos casos van a 'needs_manual_review' (estado que NO permite publicar:
        // la ruta /validate exige ready_for_approval) y 'rejected' a 'failed'.
        const newStatus = verdict.overallStatus === 'approved' ? 'ready_for_approval' :
                          verdict.overallStatus === 'rejected' ? 'failed' : 'needs_manual_review';

        // Save verdict and update status
        await db.update(news)
          .set({
            councilVerdict: verdict,
            processingStatus: newStatus,
            lastProcessedAt: new Date(),
            failedStep: verdict.overallStatus === 'rejected' ? 'council' : null,
          })
          .where(eq(news.id, articleId));
        
        console.log(`[Orchestrator] Legal Council verdict: ${verdict.overallStatus}, Risk: ${verdict.riskFlag}`);
        
        results['legal_council'] = {
          success: verdict.overallStatus !== 'rejected',
          data: verdict as unknown as Record<string, unknown>,
        };
      }
    } catch (councilError) {
      console.error(`[Orchestrator] Legal Council evaluation failed:`, councilError);
      // Fail-CLOSED: si el Consejo falla NO se auto-habilita la publicación.
      // Antes esto forzaba ready_for_approval ('still allow article through') → un crash
      // del evaluador publicaba el artículo sin revisión. Ahora queda en
      // 'needs_manual_review' (no publicable por la ruta /validate) a la espera de un humano.
      await db.update(news)
        .set({
          processingStatus: 'needs_manual_review',
          lastProcessedAt: new Date(),
          councilVerdict: {
            overallStatus: 'escalated',
            riskFlag: 'medium',
            consolidatedFeedback: 'Council evaluation failed. Manual review required.',
          },
        })
        .where(eq(news.id, articleId));
    }
    
    return { success: true, results: results as Record<AgentType, AgentResult> };
  }

  async processNextJob(): Promise<AgentJob | null> {
    let job = this.jobQueue.shift();

    if (!job) {
      const syncedCount = await this.syncQueueWithDatabase();
      if (syncedCount > 0) {
        job = this.jobQueue.shift();
      }
    }

    if (!job) return null;

    // Respeta el backoff: si el job aún no vence su nextRetryAt, NO lo corras todavía.
    // Se re-encola al FINAL y se devuelve null (el siguiente ciclo intentará otro job).
    // Esto evita el hot-loop del reintento previo (re-encolaba al frente cada 2s).
    const retryAt = this.retryAfter.get(job.id);
    if (retryAt !== undefined && Date.now() < retryAt) {
      this.jobQueue.push(job);
      return null;
    }
    this.retryAfter.delete(job.id);

    const agent = this.agents.get(job.agentType);
    if (!agent) {
      job.status = 'failed';
      job.error = `Agent ${job.agentType} not registered`;
      await dbPersistence.updateJob(job.id, {
        status: 'failed',
        error: job.error,
        completedAt: new Date(),
      });
      return job;
    }

    job.status = 'in_progress';
    job.startedAt = new Date();
    this.activeJobs.set(job.id, job);
    
    await dbPersistence.updateJob(job.id, {
      status: 'in_progress',
      startedAt: job.startedAt,
    });
    
    await this.addEvent(job.id, job.agentType, 'start', `Job started`);

    const context: ExecutionContext = {
      jobId: job.id,
      agentType: job.agentType,
      startTime: job.startedAt,
      metadata: job.payload,
    };

    try {
      const result = await agent.execute(context, job.payload);
      
      job.status = result.success ? 'completed' : 'failed';
      job.result = result.data as Record<string, unknown>;
      job.error = result.error;
      job.completedAt = new Date();

      await dbPersistence.updateJob(job.id, {
        status: job.status,
        result: job.result,
        error: job.error,
        completedAt: job.completedAt,
      });

      await this.addEvent(job.id, job.agentType, result.success ? 'complete' : 'error', 
        result.success ? 'Job completed successfully' : `Job failed: ${result.error}`);

      const executionTime = job.completedAt.getTime() - job.startedAt.getTime();
      evolutionTracker.updateAgentStats(job.agentType, {
        totalJobs: 1,
        completedJobs: result.success ? 1 : 0,
        failedJobs: result.success ? 0 : 1,
        averageExecutionTime: executionTime,
      });

    } catch (error) {
      job.status = 'failed';
      job.error = String(error);
      job.completedAt = new Date();

      const nonRetryable = this.isNonRetryableError(job.error);

      if (!nonRetryable && job.retryCount < job.maxRetries) {
        job.retryCount++;
        job.status = 'pending';

        // Backoff exponencial con jitter: 2s, 4s, 8s... (cap 5 min) ± jitter aleatorio.
        // Antes se re-encolaba al FRENTE (unshift) y se reintentaba al instante cada
        // ciclo de 2s → hot-loop que quemaba la cola con un solo job fallando.
        // Ahora se re-encola al FINAL y se marca nextRetryAt para no correrlo antes de tiempo.
        const baseDelayMs = 2000;
        const maxDelayMs = 5 * 60 * 1000;
        const expDelay = Math.min(baseDelayMs * 2 ** (job.retryCount - 1), maxDelayMs);
        const jitter = Math.floor(Math.random() * 1000);
        const delayMs = expDelay + jitter;
        this.retryAfter.set(job.id, Date.now() + delayMs);

        this.jobQueue.push(job);

        await dbPersistence.updateJob(job.id, {
          status: 'pending',
          retryCount: job.retryCount,
          error: job.error,
        });

        await this.addEvent(job.id, job.agentType, 'error', `Job failed, retrying (${job.retryCount}/${job.maxRetries}) in ${Math.round(delayMs / 1000)}s`);
      } else {
        // Sin más reintentos, o error no-reintetable (validación/404): falla definitivo.
        this.retryAfter.delete(job.id);
        await dbPersistence.updateJob(job.id, {
          status: 'failed',
          error: job.error,
          completedAt: job.completedAt,
        });

        const reason = nonRetryable ? 'non-retryable error' : 'max retries exhausted';
        await this.addEvent(job.id, job.agentType, 'error', `Job failed permanently (${reason}): ${error}`);
      }
    }

    // Limpia el backoff si el job terminó (completado o fallido definitivo).
    if (job.status === 'completed' || job.status === 'failed') {
      this.retryAfter.delete(job.id);
    }

    this.activeJobs.delete(job.id);

    return job;
  }

  startProcessing(intervalMs: number = 1000): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    this.processingInterval = setInterval(async () => {
      if (this.isProcessingCycle) return;
      
      this.isProcessingCycle = true;
      try {
        await this.syncQueueWithDatabase();
        
        if (this.jobQueue.length > 0 && this.activeJobs.size < 1) {
          await this.processNextJob();
        }
      } finally {
        this.isProcessingCycle = false;
      }
    }, intervalMs);

    console.log('[Orchestrator] Started job processing with immediate DB sync every cycle');
  }

  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.isRunning = false;
    console.log('[Orchestrator] Stopped job processing');
  }

  private async addEvent(jobId: string, agentType: AgentType | string, eventType: AgentEvent['eventType'], message: string, data?: Record<string, unknown>): Promise<void> {
    try {
      await dbPersistence.logEvent({
        jobId,
        agentType,
        eventType,
        message,
        data,
      });
    } catch (error) {
      console.error('[Orchestrator] Failed to log event:', error);
    }
  }

  async getStatus(): Promise<{
    isRunning: boolean;
    queueLength: number;
    activeJobs: number;
    registeredAgents: AgentType[];
    recentJobs: AgentJob[];
    recentEvents: AgentEvent[];
  }> {
    const recentDbJobs = await dbPersistence.getRecentJobs(20);
    const recentDbEvents = await dbPersistence.getRecentEvents(50);
    
    const recentJobs: AgentJob[] = recentDbJobs.map(j => ({
      id: j.id,
      agentType: j.agentType as AgentType,
      status: j.status as JobStatus,
      priority: (j.priority || 'normal') as JobPriority,
      payload: j.payload as Record<string, unknown>,
      result: j.result as Record<string, unknown> | undefined,
      error: j.error || undefined,
      retryCount: j.retryCount || 0,
      maxRetries: j.maxRetries || 3,
      createdAt: j.createdAt || new Date(),
      startedAt: j.startedAt || undefined,
      completedAt: j.completedAt || undefined,
      parentJobId: j.parentJobId || undefined,
    }));

    const recentEvents: AgentEvent[] = recentDbEvents.map(e => ({
      id: e.id,
      jobId: e.jobId,
      agentType: e.agentType as AgentType,
      eventType: e.eventType as AgentEvent['eventType'],
      message: e.message,
      data: e.data as Record<string, unknown> | undefined,
      timestamp: e.timestamp || new Date(),
    }));

    const jobCounts = await dbPersistence.getJobCounts();

    return {
      isRunning: this.isRunning,
      queueLength: jobCounts.pending,
      activeJobs: jobCounts.inProgress,
      registeredAgents: Array.from(this.agents.keys()),
      recentJobs,
      recentEvents,
    };
  }

  async getJobHistory(options?: { agentType?: AgentType; status?: JobStatus; limit?: number }): Promise<AgentJob[]> {
    const dbJobs = await dbPersistence.getJobsByStatus(options?.status || 'completed', options?.limit || 100);
    
    return dbJobs.map(j => ({
      id: j.id,
      agentType: j.agentType as AgentType,
      status: j.status as JobStatus,
      priority: (j.priority || 'normal') as JobPriority,
      payload: j.payload as Record<string, unknown>,
      result: j.result as Record<string, unknown> | undefined,
      error: j.error || undefined,
      retryCount: j.retryCount || 0,
      maxRetries: j.maxRetries || 3,
      createdAt: j.createdAt || new Date(),
      startedAt: j.startedAt || undefined,
      completedAt: j.completedAt || undefined,
      parentJobId: j.parentJobId || undefined,
    }));
  }
}

export const orchestrator = new AgentOrchestrator();
