import type { CopyHistoryOrigin } from '../storage/CopyHistory';
import type { BaseAgent } from './BaseAgent';
import { createDefaultOrchestratorRuntime } from './orchestrator/runtime';
import type { PipelineRunOptions } from './orchestrator/publicTypes';
import type {
  AgentEvent,
  AgentJob,
  AgentResult,
  AgentType,
  JobPriority,
  JobStatus,
} from './types';

export type {
  PipelineRunOptions,
  PipelineStageUpdate,
} from './orchestrator/publicTypes';

/**
 * Stable public facade for the agent runtime. Queueing, execution, pipelines,
 * reporting and lifecycle details live in independently testable services.
 */
export class AgentOrchestrator {
  private readonly runtime = createDefaultOrchestratorRuntime();

  isProcessing(): boolean {
    return this.runtime.state.isRunning;
  }

  start(intervalMs: number = 1000): void {
    this.startProcessing(intervalMs);
  }

  async initialize(): Promise<void> {
    return this.runtime.queue.initialize();
  }

  async getFailedJobs(limit: number = 50): Promise<AgentJob[]> {
    return this.runtime.queue.getFailedJobs(limit);
  }

  registerAgent(agent: BaseAgent): void {
    this.runtime.queue.registerAgent(agent);
  }

  getAgent(agentType: AgentType): BaseAgent | undefined {
    return this.runtime.queue.getAgent(agentType);
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
    return this.runtime.queue.enqueueJob(agentType, payload, options);
  }

  async executeImmediately(
    agentType: AgentType,
    payload: Record<string, unknown>,
    execution: { actorId?: string | null; origin?: CopyHistoryOrigin } = {},
  ): Promise<AgentResult> {
    return this.runtime.execution.executeImmediately(agentType, payload, execution);
  }

  async runPipeline(
    articleId: string,
    stages: AgentType[] = [
      'formatter',
      'metadata_linker',
      'polyglot_translator',
      'seo_optimizer',
    ],
    options: PipelineRunOptions = {},
  ): Promise<{ success: boolean; results: Record<AgentType, AgentResult> }> {
    return this.runtime.pipeline.runPipeline(articleId, stages, options);
  }

  async processNextJob(): Promise<AgentJob | null> {
    return this.runtime.processing.processNextJob();
  }

  startProcessing(intervalMs: number = 1000): void {
    this.runtime.processing.startProcessing(intervalMs);
  }

  stopProcessing(): void {
    this.runtime.processing.stopProcessing();
  }

  async getStatus(): Promise<{
    isRunning: boolean;
    queueLength: number;
    activeJobs: number;
    registeredAgents: AgentType[];
    recentJobs: AgentJob[];
    recentEvents: AgentEvent[];
  }> {
    return this.runtime.reporting.getStatus();
  }

  async getJobHistory(options?: {
    agentType?: AgentType;
    status?: JobStatus;
    limit?: number;
  }): Promise<AgentJob[]> {
    return this.runtime.reporting.getJobHistory(options);
  }
}

export const orchestrator = new AgentOrchestrator();
