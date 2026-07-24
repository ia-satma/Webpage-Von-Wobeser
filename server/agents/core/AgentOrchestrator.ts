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
import { parseAgentPayload } from './contracts';

export class AgentOrchestrator {
  private agents: Map<AgentType, BaseAgent> = new Map();
  private jobQueue: AgentJob[] = [];
  private activeJobs: Map<string, AgentJob> = new Map();
  private isRunning: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private isProcessingCycle: boolean = false;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;
  // Reconciliación con la DB: los jobs encolados en-proceso ya entran a la cola
  // local, así que solo hace falta sincronizar cada tanto (jobs externos/huérfanos),
  // no en cada tick. Antes se pegaba a la DB cada 1–2 s aun estando en reposo.
  private lastSyncAt: number = 0;
  private readonly SYNC_INTERVAL_MS = 30_000;
  private readonly MAX_ACTIVE_JOBS = 4;

  isProcessing(): boolean {
    return this.isRunning;
  }

  start(intervalMs: number = 1000): void {
    this.startProcessing(intervalMs);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = this.performInitialization();
    try {
      await this.initializationPromise;
      this.initialized = true;
    } finally {
      this.initializationPromise = null;
    }
  }

  private async performInitialization(): Promise<void> {
    console.log('[Orchestrator] Initializing agent system...');
    await knowledgeStore.initialize();
    await knowledgeStore.addLegalGlossary();
    await knowledgeStore.addSocialCopyGuide();
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
    if (this.agents.has(agent.agentType)) {
      throw new Error(`[Orchestrator] Agent already registered: ${agent.agentType}`);
    }
    this.agents.set(agent.agentType, agent);
    console.log(
      `[Orchestrator] Registered agent: ${agent.name} ` +
      `(enabled=${agent.enabled}, concurrency=${agent.concurrency})`,
    );
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
    const agent = this.agents.get(agentType);
    if (!agent) throw new Error(`Agent ${agentType} is not registered`);
    if (!agent.enabled) throw new Error(`Agent ${agentType} is disabled`);
    const parsedPayload = parseAgentPayload(agentType, payload);
    if (!parsedPayload.success) {
      throw new Error(`Invalid payload for ${agentType}: ${parsedPayload.error}`);
    }

    const priority = options?.priority || 'normal';
    const maxRetries = options?.maxRetries ?? agent.retryPolicy.maxRetries;
    
    const dbJob = await dbPersistence.createJob({
      agentType,
      status: 'pending',
      priority,
      payload: parsedPayload.data,
      retryCount: 0,
      maxRetries,
      parentJobId: options?.parentJobId,
    });

    const job: AgentJob = {
      id: dbJob.id,
      agentType,
      status: 'pending',
      priority,
      payload: parsedPayload.data,
      retryCount: 0,
      maxRetries,
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

  /**
   * Executes an authenticated manual request through the same persistent job
   * lifecycle used by the background queue. This keeps history, events,
   * enabled flags and per-agent concurrency consistent without changing the
   * synchronous API contract used by the admin panel.
   */
  async executeImmediately(
    agentType: AgentType,
    payload: Record<string, unknown>,
  ): Promise<AgentResult> {
    const agent = this.agents.get(agentType);
    if (!agent) return { success: false, error: `Agent ${agentType} is not registered` };
    if (!agent.enabled) return { success: false, error: `Agent ${agentType} is disabled` };

    const activeForAgent = Array.from(this.activeJobs.values())
      .filter((activeJob) => activeJob.agentType === agentType)
      .length;
    if (activeForAgent >= agent.concurrency || this.activeJobs.size >= this.MAX_ACTIVE_JOBS) {
      return { success: false, error: `Agent ${agentType} is currently at capacity` };
    }

    const job = await this.enqueueJob(agentType, payload, { priority: 'high' });
    this.jobQueue = this.jobQueue.filter((queuedJob) => queuedJob.id !== job.id);

    job.status = 'in_progress';
    job.startedAt = new Date();
    this.activeJobs.set(job.id, job);

    try {
      const claimed = await dbPersistence.claimPendingJob(job.id, job.startedAt);
      if (!claimed) return { success: false, error: 'The agent job could not be claimed' };

      await this.addEvent(job.id, agentType, 'start', 'Manual job started');
      const context: ExecutionContext = {
        jobId: job.id,
        agentType,
        startTime: job.startedAt,
        metadata: { ...job.payload, source: 'api' },
      };

      let lastResult: AgentResult = { success: false, error: 'Agent execution failed' };
      let lastError: unknown;
      const retryPolicy = agent.retryPolicy;
      const attempts = retryPolicy.maxRetries + 1;

      for (let attempt = 0; attempt < attempts; attempt++) {
        try {
          lastResult = await agent.execute(context, job.payload);
          if (lastResult.success) break;
          lastError = new Error(lastResult.error || 'Agent returned an unsuccessful result');
        } catch (error) {
          lastError = error;
          lastResult = { success: false, error: String(error) };
        }

        if (attempt < attempts - 1) {
          job.retryCount = attempt + 1;
          await dbPersistence.updateJob(job.id, {
            retryCount: job.retryCount,
            error: lastResult.error || String(lastError),
          });
          const delayMs = Math.min(
            30_000,
            retryPolicy.backoffMs * retryPolicy.backoffMultiplier ** attempt,
          );
          await this.addEvent(
            job.id,
            agentType,
            'error',
            `Manual job failed, retrying (${job.retryCount}/${retryPolicy.maxRetries}) in ${delayMs}ms`,
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }

      job.status = lastResult.success ? 'completed' : 'failed';
      job.result = lastResult.data as Record<string, unknown> | undefined;
      job.error = lastResult.success ? undefined : (lastResult.error || String(lastError));
      job.completedAt = new Date();
      await dbPersistence.updateJob(job.id, {
        status: job.status,
        result: job.result,
        error: job.error,
        completedAt: job.completedAt,
      });
      await this.addEvent(
        job.id,
        agentType,
        lastResult.success ? 'complete' : 'error',
        lastResult.success ? 'Manual job completed' : 'Manual job failed',
      );

      await this.recordAgentOutcome(
        agentType,
        lastResult,
        job.completedAt.getTime() - job.startedAt.getTime(),
      );

      return lastResult;
    } catch (error) {
      job.status = 'failed';
      job.error = String(error);
      job.completedAt = new Date();
      await dbPersistence.updateJob(job.id, {
        status: 'failed',
        error: job.error,
        completedAt: job.completedAt,
      });
      return { success: false, error: 'Agent execution failed' };
    } finally {
      this.activeJobs.delete(job.id);
    }
  }

  async runPipeline(
    articleId: string,
    stages: AgentType[] = ['formatter', 'metadata_linker', 'polyglot_translator', 'seo_optimizer']
  ): Promise<{ success: boolean; results: Record<AgentType, AgentResult> }> {
    const results: Record<string, AgentResult> = {};
    const [pipelineArticle] = await db.select().from(news).where(eq(news.id, articleId));
    if (!pipelineArticle) {
      return {
        success: false,
        results: { formatter: { success: false, error: 'Article not found' } } as Record<AgentType, AgentResult>,
      };
    }
    if (pipelineArticle.published !== false) {
      return {
        success: false,
        results: {
          formatter: {
            success: false,
            error: 'Published articles must be converted to a draft before applying the pipeline',
          },
        } as Record<AgentType, AgentResult>,
      };
    }

    console.log(`[Orchestrator] Starting pipeline for article ${articleId}`);

    for (const stage of stages) {
      const agent = this.agents.get(stage);
      if (!agent || !agent.enabled) {
        console.warn(`[Orchestrator] Agent ${stage} not registered, skipping`);
        continue;
      }

      try {
        console.log(`[Orchestrator] Running ${stage}...`);
        // A pipeline is an explicit authenticated editing action. Agents still
        // enforce their own unpublished-content guard before applying a
        // proposal. Analysis-only stages intentionally receive no write flag.
        const stagePayload: Record<string, unknown> = stage === 'content_analyzer'
          ? { articleId }
          : { articleId, applyChanges: true };
        const result = await this.executeImmediately(stage, stagePayload);
        results[stage] = result;

        if (!result.success) {
          console.error(`[Orchestrator] ${stage} failed:`, result.error);
          return { success: false, results: results as Record<AgentType, AgentResult> };
        }

      } catch (error) {
        console.error(`[Orchestrator] ${stage} threw error:`, error);
        results[stage] = { success: false, error: "Agent stage failed" };
        return { success: false, results: results as Record<AgentType, AgentResult> };
      }
    }

    console.log(`[Orchestrator] Pipeline completed for article ${articleId}`);
    
    // Run Legal Council evaluation after pipeline completes
    try {
      console.log(`[Orchestrator] Running Legal Council evaluation for article ${articleId}...`);
      
      // Get article content for evaluation
      const [article] = await db.select().from(news).where(eq(news.id, articleId));
      
      const councilContent = article?.content || article?.contentEs;
      if (article && councilContent) {
        const verdict = await legalCouncilService.evaluateArticle(councilContent);
        
        // Determine final status based on council verdict
        const newStatus = verdict.overallStatus === 'approved' ? 'ready_for_approval' : 
                          verdict.overallStatus === 'rejected' ? 'failed' : 'ready_for_approval';
        
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
      // Fail-safe: still allow article through with warning
      await db.update(news)
        .set({
          processingStatus: 'ready_for_approval',
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

  private takeNextRunnableJob(): AgentJob | undefined {
    const index = this.jobQueue.findIndex((queuedJob) => {
      const agent = this.agents.get(queuedJob.agentType);
      if (!agent || !agent.enabled) return true;

      const activeForAgent = Array.from(this.activeJobs.values())
        .filter((activeJob) => activeJob.agentType === queuedJob.agentType)
        .length;
      return activeForAgent < agent.concurrency;
    });

    if (index < 0) return undefined;
    return this.jobQueue.splice(index, 1)[0];
  }

  async processNextJob(): Promise<AgentJob | null> {
    let job = this.takeNextRunnableJob();
    
    if (!job) {
      const syncedCount = await this.syncQueueWithDatabase();
      if (syncedCount > 0) {
        job = this.takeNextRunnableJob();
      }
    }
    
    if (!job) return null;

    const agent = this.agents.get(job.agentType);
    if (!agent || !agent.enabled) {
      job.status = 'failed';
      job.error = !agent
        ? `Agent ${job.agentType} not registered`
        : `Agent ${job.agentType} is disabled`;
      await dbPersistence.updateJob(job.id, {
        status: 'failed',
        error: job.error,
        completedAt: new Date(),
      });
      return job;
    }

    const parsedPayload = parseAgentPayload(job.agentType, job.payload);
    if (!parsedPayload.success) {
      job.status = 'failed';
      job.error = `Invalid persisted payload: ${parsedPayload.error}`;
      job.completedAt = new Date();
      await dbPersistence.updateJob(job.id, {
        status: 'failed',
        error: job.error,
        completedAt: job.completedAt,
      });
      await this.addEvent(job.id, job.agentType, 'error', 'Persisted job payload failed validation');
      return job;
    }
    job.payload = parsedPayload.data;

    job.status = 'in_progress';
    job.startedAt = new Date();
    this.activeJobs.set(job.id, job);

    let claimed;
    try {
      claimed = await dbPersistence.claimPendingJob(job.id, job.startedAt);
    } catch (error) {
      this.activeJobs.delete(job.id);
      throw error;
    }
    if (!claimed) {
      this.activeJobs.delete(job.id);
      return null;
    }
    
    await this.addEvent(job.id, job.agentType, 'start', `Job started`);

    const context: ExecutionContext = {
      jobId: job.id,
      agentType: job.agentType,
      startTime: job.startedAt,
      metadata: job.payload,
    };

    try {
      const result = await agent.execute(context, job.payload);
      if (!result.success) {
        throw new Error(result.error || `Agent ${job.agentType} returned an unsuccessful result`);
      }
      
      job.status = 'completed';
      job.result = result.data as Record<string, unknown>;
      job.error = undefined;
      job.completedAt = new Date();

      await dbPersistence.updateJob(job.id, {
        status: job.status,
        result: job.result,
        error: job.error,
        completedAt: job.completedAt,
      });

      await this.addEvent(job.id, job.agentType, 'complete', 'Job completed successfully');

      const executionTime = job.completedAt.getTime() - job.startedAt.getTime();
      await this.recordAgentOutcome(job.agentType, result, executionTime);

    } catch (error) {
      job.status = 'failed';
      job.error = String(error);
      job.completedAt = new Date();

      if (job.retryCount < job.maxRetries) {
        job.retryCount++;
        job.status = 'pending';

        await dbPersistence.updateJob(job.id, {
          status: 'pending',
          retryCount: job.retryCount,
          error: job.error,
        });

        // Backoff exponencial antes de reencolar (2s, 4s, 8s… tope 30s): evita el
        // bucle apretado de reintentos inmediatos ante errores transitorios.
        const retryPolicy = agent.retryPolicy;
        const delayMs = Math.min(
          30_000,
          retryPolicy.backoffMs * retryPolicy.backoffMultiplier ** (job.retryCount - 1),
        );
        const retryJob = job;
        setTimeout(() => {
          if (
            this.isRunning &&
            !this.activeJobs.has(retryJob.id) &&
            !this.jobQueue.some((j) => j.id === retryJob.id)
          ) {
            this.jobQueue.push(retryJob);
          }
        }, delayMs);

        await this.addEvent(job.id, job.agentType, 'error', `Job failed, retrying (${job.retryCount}/${job.maxRetries}) in ${delayMs}ms`);
      } else {
        await dbPersistence.updateJob(job.id, {
          status: 'failed',
          error: job.error,
          completedAt: job.completedAt,
        });
        
        await this.addEvent(job.id, job.agentType, 'error', `Job failed permanently: ${error}`);
        await this.recordAgentOutcome(
          job.agentType,
          { success: false, error: job.error },
          job.startedAt ? job.completedAt.getTime() - job.startedAt.getTime() : 0,
        );
      }
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
        // Sincroniza con la DB solo cada SYNC_INTERVAL_MS (no en cada tick): los
        // jobs encolados en-proceso ya están en la cola local. Si hay trabajo
        // local pendiente, se sincroniza igual para no dejar huérfanos.
        const now = Date.now();
        if (now - this.lastSyncAt >= this.SYNC_INTERVAL_MS) {
          await this.syncQueueWithDatabase();
          this.lastSyncAt = now;
        }

        if (this.jobQueue.length > 0 && this.activeJobs.size < this.MAX_ACTIVE_JOBS) {
          void this.processNextJob().catch((error) => {
            console.error('[Orchestrator] Unhandled job dispatch error:', error);
          });
        }
      } finally {
        this.isProcessingCycle = false;
      }
    }, intervalMs);

    console.log(
      `[Orchestrator] Started job processing (max ${this.MAX_ACTIVE_JOBS} active, DB sync every ${this.SYNC_INTERVAL_MS}ms)`,
    );
  }

  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.isRunning = false;
    console.log('[Orchestrator] Stopped job processing');
  }

  private async recordAgentOutcome(
    agentType: AgentType,
    result: AgentResult,
    executionTime: number,
  ): Promise<void> {
    if (result.success) {
      for (const learning of result.learnings || []) {
        try {
          await knowledgeStore.addDocument({
            agentType,
            category: 'learning',
            title: learning.context,
            content: learning.insight,
            metadata: { confidence: learning.confidence, source: learning.source },
          });
        } catch (error) {
          console.error(`[Orchestrator] Could not persist learning for ${agentType}:`, error);
        }
      }

      for (const proposal of result.evolutionProposals || []) {
        try {
          await evolutionTracker.addProposal(proposal);
        } catch (error) {
          console.error(`[Orchestrator] Could not persist proposal for ${agentType}:`, error);
        }
      }
    }

    evolutionTracker.updateAgentStats(agentType, {
      totalJobs: 1,
      completedJobs: result.success ? 1 : 0,
      failedJobs: result.success ? 0 : 1,
      averageExecutionTime: Math.max(0, executionTime),
      successRate: result.success ? 1 : 0,
    });
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
    const dbJobs = await dbPersistence.getJobs({
      agentType: options?.agentType,
      status: options?.status,
      limit: options?.limit,
    });
    
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
