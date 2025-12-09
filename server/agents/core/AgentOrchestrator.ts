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

export class AgentOrchestrator {
  private agents: Map<AgentType, BaseAgent> = new Map();
  private jobQueue: AgentJob[] = [];
  private activeJobs: Map<string, AgentJob> = new Map();
  private isRunning: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private isProcessingCycle: boolean = false;

  isProcessing(): boolean {
    return this.isRunning;
  }

  start(intervalMs: number = 1000): void {
    this.startProcessing(intervalMs);
  }

  async initialize(): Promise<void> {
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

      for (const dbJob of pendingJobs) {
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
      }
      
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

      if (job.retryCount < job.maxRetries) {
        job.retryCount++;
        job.status = 'pending';
        this.jobQueue.unshift(job);
        
        await dbPersistence.updateJob(job.id, {
          status: 'pending',
          retryCount: job.retryCount,
          error: job.error,
        });
        
        await this.addEvent(job.id, job.agentType, 'error', `Job failed, retrying (${job.retryCount}/${job.maxRetries})`);
      } else {
        await dbPersistence.updateJob(job.id, {
          status: 'failed',
          error: job.error,
          completedAt: job.completedAt,
        });
        
        await this.addEvent(job.id, job.agentType, 'error', `Job failed permanently: ${error}`);
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
