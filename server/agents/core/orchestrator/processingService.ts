import type { AgentJob, AgentResult, ExecutionContext } from '../types';
import type { OrchestratorDependencies } from './dependencies';
import type { OrchestratorOutcomeService } from './outcomeService';
import type { OrchestratorQueueService } from './queueService';
import {
  DEFAULT_PROCESSING_INTERVAL_MS,
  MAX_ACTIVE_JOBS,
  MAX_RETRY_DELAY_MS,
  SYNC_INTERVAL_MS,
  type OrchestratorState,
} from './state';

export class OrchestratorProcessingService {
  constructor(
    private readonly state: OrchestratorState,
    private readonly dependencies: OrchestratorDependencies,
    private readonly queue: OrchestratorQueueService,
    private readonly outcomes: OrchestratorOutcomeService,
  ) {}

  async processNextJob(): Promise<AgentJob | null> {
    let job = this.queue.takeNextRunnableJob();
    if (!job) {
      const syncedCount = await this.queue.syncQueueWithDatabase();
      if (syncedCount > 0) job = this.queue.takeNextRunnableJob();
    }
    if (!job) return null;

    const agent = this.state.agents.get(job.agentType);
    if (!agent || !agent.enabled) {
      job.status = 'failed';
      job.error = !agent
        ? `Agent ${job.agentType} not registered`
        : `Agent ${job.agentType} is disabled`;
      await this.dependencies.persistence.updateJob(job.id, {
        status: 'failed',
        error: job.error,
        completedAt: this.dependencies.clock.now(),
      });
      return job;
    }

    const parsedPayload = this.dependencies.parsePayload(job.agentType, job.payload);
    if (!parsedPayload.success) {
      job.status = 'failed';
      job.error = `Invalid persisted payload: ${parsedPayload.error}`;
      job.completedAt = this.dependencies.clock.now();
      await this.dependencies.persistence.updateJob(job.id, {
        status: 'failed',
        error: job.error,
        completedAt: job.completedAt,
      });
      await this.outcomes.addEvent(
        job.id,
        job.agentType,
        'error',
        'Persisted job payload failed validation',
      );
      return job;
    }
    job.payload = parsedPayload.data;

    job.status = 'in_progress';
    job.startedAt = this.dependencies.clock.now();
    this.state.activeJobs.set(job.id, job);

    let claimed;
    try {
      claimed = await this.dependencies.persistence.claimPendingJob(job.id, job.startedAt);
    } catch (error) {
      this.state.activeJobs.delete(job.id);
      throw error;
    }
    if (!claimed) {
      this.state.activeJobs.delete(job.id);
      return null;
    }

    await this.outcomes.addEvent(job.id, job.agentType, 'start', 'Job started');
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
      await this.completeJob(job, result);
    } catch (error) {
      await this.handleJobFailure(job, agent.retryPolicy, error);
    }

    this.state.activeJobs.delete(job.id);
    return job;
  }

  private async completeJob(job: AgentJob, result: AgentResult): Promise<void> {
    job.status = 'completed';
    job.result = result.data as Record<string, unknown>;
    job.error = undefined;
    job.completedAt = this.dependencies.clock.now();
    await this.dependencies.persistence.updateJob(job.id, {
      status: job.status,
      result: job.result,
      error: job.error,
      completedAt: job.completedAt,
    });
    await this.outcomes.addEvent(job.id, job.agentType, 'complete', 'Job completed successfully');

    try {
      await this.dependencies.persistCopySnapshot({
        jobId: job.id,
        agentType: job.agentType,
        payload: job.payload,
        result: result.data,
        completedAt: job.completedAt,
        origin: 'scheduled',
      });
    } catch (copyError) {
      this.dependencies.logger.error(
        `[Orchestrator] Could not persist scheduled copy history for ${job.id}:`,
        copyError,
      );
    }

    const executionTime = job.completedAt.getTime() - job.startedAt!.getTime();
    await this.outcomes.recordAgentOutcome(job.agentType, result, executionTime);
  }

  private async handleJobFailure(
    job: AgentJob,
    retryPolicy: { backoffMs: number; backoffMultiplier: number },
    error: unknown,
  ): Promise<void> {
    job.status = 'failed';
    job.error = String(error);
    job.completedAt = this.dependencies.clock.now();

    if (job.retryCount < job.maxRetries) {
      job.retryCount++;
      job.status = 'pending';
      await this.dependencies.persistence.updateJob(job.id, {
        status: 'pending',
        retryCount: job.retryCount,
        error: job.error,
      });

      const delayMs = Math.min(
        MAX_RETRY_DELAY_MS,
        retryPolicy.backoffMs * retryPolicy.backoffMultiplier ** (job.retryCount - 1),
      );
      const retryJob = job;
      this.dependencies.clock.setTimeout(() => {
        if (
          this.state.isRunning
          && !this.state.activeJobs.has(retryJob.id)
          && !this.state.jobQueue.some((queuedJob) => queuedJob.id === retryJob.id)
        ) {
          this.state.jobQueue.push(retryJob);
        }
      }, delayMs);

      await this.outcomes.addEvent(
        job.id,
        job.agentType,
        'error',
        `Job failed, retrying (${job.retryCount}/${job.maxRetries}) in ${delayMs}ms`,
      );
      return;
    }

    await this.dependencies.persistence.updateJob(job.id, {
      status: 'failed',
      error: job.error,
      completedAt: job.completedAt,
    });
    await this.outcomes.addEvent(
      job.id,
      job.agentType,
      'error',
      `Job failed permanently: ${error}`,
    );
    await this.outcomes.recordAgentOutcome(
      job.agentType,
      { success: false, error: job.error },
      job.startedAt ? job.completedAt.getTime() - job.startedAt.getTime() : 0,
    );
  }

  startProcessing(intervalMs = DEFAULT_PROCESSING_INTERVAL_MS): void {
    if (this.state.isRunning) return;
    this.state.isRunning = true;

    this.state.processingInterval = this.dependencies.clock.setInterval(async () => {
      if (this.state.isProcessingCycle) return;
      this.state.isProcessingCycle = true;
      try {
        const now = this.dependencies.clock.nowMs();
        if (now - this.state.lastSyncAt >= SYNC_INTERVAL_MS) {
          await this.queue.syncQueueWithDatabase();
          this.state.lastSyncAt = now;
        }

        if (this.state.jobQueue.length > 0 && this.state.activeJobs.size < MAX_ACTIVE_JOBS) {
          void this.processNextJob().catch((error) => {
            this.dependencies.logger.error(
              '[Orchestrator] Unhandled job dispatch error:',
              error,
            );
          });
        }
      } finally {
        this.state.isProcessingCycle = false;
      }
    }, intervalMs);

    this.dependencies.logger.log(
      `[Orchestrator] Started job processing (max ${MAX_ACTIVE_JOBS} active, DB sync every ${SYNC_INTERVAL_MS}ms)`,
    );
  }

  stopProcessing(): void {
    if (this.state.processingInterval) {
      this.dependencies.clock.clearInterval(this.state.processingInterval);
      this.state.processingInterval = null;
    }
    this.state.isRunning = false;
    this.dependencies.logger.log('[Orchestrator] Stopped job processing');
  }
}
