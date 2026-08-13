import type { CopyHistoryOrigin } from '../../storage/CopyHistory';
import type { AgentResult, AgentType, ExecutionContext } from '../types';
import type { OrchestratorDependencies } from './dependencies';
import { countActiveJobsForAgent } from './mappers';
import type { OrchestratorOutcomeService } from './outcomeService';
import type { OrchestratorQueueService } from './queueService';
import { MAX_ACTIVE_JOBS, MAX_RETRY_DELAY_MS, type OrchestratorState } from './state';

export class OrchestratorExecutionService {
  constructor(
    private readonly state: OrchestratorState,
    private readonly dependencies: OrchestratorDependencies,
    private readonly queue: OrchestratorQueueService,
    private readonly outcomes: OrchestratorOutcomeService,
  ) {}

  async executeImmediately(
    agentType: AgentType,
    payload: Record<string, unknown>,
    execution: { actorId?: string | null; origin?: CopyHistoryOrigin } = {},
  ): Promise<AgentResult> {
    const agent = this.state.agents.get(agentType);
    if (!agent) return { success: false, error: `Agent ${agentType} is not registered` };
    if (!agent.enabled) return { success: false, error: `Agent ${agentType} is disabled` };

    const activeForAgent = countActiveJobsForAgent(this.state.activeJobs, agentType);
    if (activeForAgent >= agent.concurrency || this.state.activeJobs.size >= MAX_ACTIVE_JOBS) {
      return { success: false, error: `Agent ${agentType} is currently at capacity` };
    }

    const job = await this.queue.enqueueJob(agentType, payload, { priority: 'high' });
    this.state.jobQueue = this.state.jobQueue.filter((queuedJob) => queuedJob.id !== job.id);

    job.status = 'in_progress';
    job.startedAt = this.dependencies.clock.now();
    this.state.activeJobs.set(job.id, job);

    try {
      const claimed = await this.dependencies.persistence.claimPendingJob(job.id, job.startedAt);
      if (!claimed) return { success: false, error: 'The agent job could not be claimed' };

      await this.outcomes.addEvent(job.id, agentType, 'start', 'Manual job started');
      const context: ExecutionContext = {
        jobId: job.id,
        agentType,
        startTime: job.startedAt,
        metadata: { ...job.payload, source: 'api' },
      };

      let lastResult: AgentResult = { success: false, error: 'Agent execution failed' };
      let lastError: unknown;
      const retryPolicy = agent.retryPolicy;
      // Interactive panel actions intentionally execute once. Background jobs retain retries.
      const attempts = 1;

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
          await this.dependencies.persistence.updateJob(job.id, {
            retryCount: job.retryCount,
            error: lastResult.error || String(lastError),
          });
          const delayMs = Math.min(
            MAX_RETRY_DELAY_MS,
            retryPolicy.backoffMs * retryPolicy.backoffMultiplier ** attempt,
          );
          await this.outcomes.addEvent(
            job.id,
            agentType,
            'error',
            `Manual job failed, retrying (${job.retryCount}/${retryPolicy.maxRetries}) in ${delayMs}ms`,
          );
          await new Promise<void>((resolve) => {
            this.dependencies.clock.setTimeout(resolve, delayMs);
          });
        }
      }

      job.status = lastResult.success ? 'completed' : 'failed';
      job.result = lastResult.data as Record<string, unknown> | undefined;
      job.error = lastResult.success ? undefined : (lastResult.error || String(lastError));
      job.completedAt = this.dependencies.clock.now();
      await this.dependencies.persistence.updateJob(job.id, {
        status: job.status,
        result: job.result,
        error: job.error,
        completedAt: job.completedAt,
      });
      await this.outcomes.addEvent(
        job.id,
        agentType,
        lastResult.success ? 'complete' : 'error',
        lastResult.success ? 'Manual job completed' : 'Manual job failed',
      );

      if (lastResult.success) {
        try {
          const copy = await this.dependencies.persistCopySnapshot({
            jobId: job.id,
            agentType,
            payload: job.payload,
            result: lastResult.data,
            completedAt: job.completedAt,
            actorId: execution.actorId,
            origin: execution.origin || 'manual',
          });
          if (copy) lastResult.copyHistoryId = copy.id;
        } catch (copyError) {
          this.dependencies.logger.error(
            `[Orchestrator] Could not persist copy history for ${job.id}:`,
            copyError,
          );
        }
      }

      await this.outcomes.recordAgentOutcome(
        agentType,
        lastResult,
        job.completedAt.getTime() - job.startedAt.getTime(),
      );
      return lastResult;
    } catch (error) {
      job.status = 'failed';
      job.error = String(error);
      job.completedAt = this.dependencies.clock.now();
      await this.dependencies.persistence.updateJob(job.id, {
        status: 'failed',
        error: job.error,
        completedAt: job.completedAt,
      });
      return { success: false, error: 'Agent execution failed' };
    } finally {
      this.state.activeJobs.delete(job.id);
    }
  }
}
