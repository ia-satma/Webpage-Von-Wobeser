import type { BaseAgent } from '../BaseAgent';
import type { AgentJob, AgentType, JobPriority } from '../types';
import type { OrchestratorDependencies } from './dependencies';
import {
  countActiveJobsForAgent,
  insertJobByPriority,
  mapPersistedJob,
  sortJobsByPriority,
} from './mappers';
import type { OrchestratorOutcomeService } from './outcomeService';
import type { OrchestratorState } from './state';

export class OrchestratorQueueService {
  constructor(
    private readonly state: OrchestratorState,
    private readonly dependencies: OrchestratorDependencies,
    private readonly outcomes: OrchestratorOutcomeService,
  ) {}

  async initialize(): Promise<void> {
    if (this.state.initialized) return;
    if (this.state.initializationPromise) return this.state.initializationPromise;

    this.state.initializationPromise = this.performInitialization();
    try {
      await this.state.initializationPromise;
      this.state.initialized = true;
    } finally {
      this.state.initializationPromise = null;
    }
  }

  private async performInitialization(): Promise<void> {
    this.dependencies.logger.log('[Orchestrator] Initializing agent system...');
    await this.dependencies.knowledge.initialize();
    await this.dependencies.knowledge.addLegalGlossary();
    await this.dependencies.knowledge.addSocialCopyGuide();
    await this.dependencies.evolution.initialize();

    await this.loadPendingJobsFromDatabase();

    this.dependencies.logger.log('[Orchestrator] Agent system initialized');
  }

  private async loadPendingJobsFromDatabase(): Promise<void> {
    try {
      const resetCount = await this.dependencies.persistence.resetInProgressJobsToPending();
      if (resetCount > 0) {
        this.dependencies.logger.log(
          `[Orchestrator] Reset ${resetCount} in_progress jobs to pending for retry`,
        );
      }

      const pendingJobs = await this.dependencies.persistence.getPendingJobs();
      this.dependencies.logger.log(
        `[Orchestrator] Loading ${pendingJobs.length} pending jobs from database`,
      );

      const jobs = pendingJobs.map((job) => (
        mapPersistedJob(job, this.dependencies.clock.now)
      ));
      sortJobsByPriority(jobs);
      this.state.jobQueue.push(...jobs);

      const failedJobs = await this.dependencies.persistence.getFailedJobs(20);
      if (failedJobs.length > 0) {
        this.dependencies.logger.log(
          `[Orchestrator] ${failedJobs.length} failed jobs available for monitoring`,
        );
      }

      this.dependencies.logger.log(
        `[Orchestrator] Loaded ${this.state.jobQueue.length} jobs into queue`,
      );

      await this.syncQueueWithDatabase();
    } catch (error) {
      this.dependencies.logger.error(
        '[Orchestrator] Error loading pending jobs:',
        error,
      );
    }
  }

  async syncQueueWithDatabase(): Promise<number> {
    try {
      const pendingJobs = await this.dependencies.persistence.getPendingJobs();
      const existingJobIds = new Set(this.state.jobQueue.map((job) => job.id));
      const activeJobIds = new Set(this.state.activeJobs.keys());
      let addedCount = 0;

      for (const persistedJob of pendingJobs) {
        if (existingJobIds.has(persistedJob.id) || activeJobIds.has(persistedJob.id)) {
          continue;
        }

        const job = mapPersistedJob(persistedJob, this.dependencies.clock.now);
        insertJobByPriority(this.state.jobQueue, job);
        addedCount++;
      }

      if (addedCount > 0) {
        this.dependencies.logger.log(
          `[Orchestrator] Synced ${addedCount} new jobs from database to in-memory queue`,
        );
      }

      return addedCount;
    } catch (error) {
      this.dependencies.logger.error(
        '[Orchestrator] Error syncing queue with database:',
        error,
      );
      return 0;
    }
  }

  async getFailedJobs(limit = 50): Promise<AgentJob[]> {
    const jobs = await this.dependencies.persistence.getFailedJobs(limit);
    return jobs.map((job) => mapPersistedJob(job, this.dependencies.clock.now));
  }

  registerAgent(agent: BaseAgent): void {
    if (this.state.agents.has(agent.agentType)) {
      throw new Error(`[Orchestrator] Agent already registered: ${agent.agentType}`);
    }
    this.state.agents.set(agent.agentType, agent);
    this.dependencies.logger.log(
      `[Orchestrator] Registered agent: ${agent.name} `
        + `(enabled=${agent.enabled}, concurrency=${agent.concurrency})`,
    );
  }

  getAgent(agentType: AgentType): BaseAgent | undefined {
    return this.state.agents.get(agentType);
  }

  async enqueueJob(
    agentType: AgentType,
    payload: Record<string, unknown>,
    options?: {
      priority?: JobPriority;
      parentJobId?: string;
      maxRetries?: number;
    },
  ): Promise<AgentJob> {
    const agent = this.state.agents.get(agentType);
    if (!agent) throw new Error(`Agent ${agentType} is not registered`);
    if (!agent.enabled) throw new Error(`Agent ${agentType} is disabled`);

    const parsedPayload = this.dependencies.parsePayload(agentType, payload);
    if (!parsedPayload.success) {
      throw new Error(`Invalid payload for ${agentType}: ${parsedPayload.error}`);
    }

    const priority = options?.priority || 'normal';
    const maxRetries = options?.maxRetries ?? agent.retryPolicy.maxRetries;
    const persistedJob = await this.dependencies.persistence.createJob({
      agentType,
      status: 'pending',
      priority,
      payload: parsedPayload.data,
      retryCount: 0,
      maxRetries,
      parentJobId: options?.parentJobId,
    });

    const job: AgentJob = {
      id: persistedJob.id,
      agentType,
      status: 'pending',
      priority,
      payload: parsedPayload.data,
      retryCount: 0,
      maxRetries,
      createdAt: persistedJob.createdAt || this.dependencies.clock.now(),
      parentJobId: options?.parentJobId,
    };

    insertJobByPriority(this.state.jobQueue, job);
    await this.outcomes.addEvent(
      job.id,
      agentType,
      'start',
      `Job enqueued for ${agentType}`,
      { priority: job.priority },
    );
    return job;
  }

  takeNextRunnableJob(): AgentJob | undefined {
    const index = this.state.jobQueue.findIndex((queuedJob) => {
      const agent = this.state.agents.get(queuedJob.agentType);
      if (!agent || !agent.enabled) return true;
      return countActiveJobsForAgent(this.state.activeJobs, queuedJob.agentType) < agent.concurrency;
    });

    if (index < 0) return undefined;
    return this.state.jobQueue.splice(index, 1)[0];
  }
}
