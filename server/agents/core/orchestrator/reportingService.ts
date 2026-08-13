import type { AgentEvent, AgentJob, AgentType, JobStatus } from '../types';
import type { OrchestratorDependencies } from './dependencies';
import { mapPersistedEvent, mapPersistedJob } from './mappers';
import type { OrchestratorState } from './state';

export interface OrchestratorStatus {
  isRunning: boolean;
  queueLength: number;
  activeJobs: number;
  registeredAgents: AgentType[];
  recentJobs: AgentJob[];
  recentEvents: AgentEvent[];
}

export class OrchestratorReportingService {
  constructor(
    private readonly state: OrchestratorState,
    private readonly dependencies: OrchestratorDependencies,
  ) {}

  async getStatus(): Promise<OrchestratorStatus> {
    const recentDbJobs = await this.dependencies.persistence.getRecentJobs(20);
    const recentDbEvents = await this.dependencies.persistence.getRecentEvents(50);
    const recentJobs = recentDbJobs.map((job) => (
      mapPersistedJob(job, this.dependencies.clock.now)
    ));
    const recentEvents = recentDbEvents.map((event) => (
      mapPersistedEvent(event, this.dependencies.clock.now)
    ));
    const jobCounts = await this.dependencies.persistence.getJobCounts();

    return {
      isRunning: this.state.isRunning,
      queueLength: jobCounts.pending,
      activeJobs: jobCounts.inProgress,
      registeredAgents: Array.from(this.state.agents.keys()),
      recentJobs,
      recentEvents,
    };
  }

  async getJobHistory(options?: {
    agentType?: AgentType;
    status?: JobStatus;
    limit?: number;
  }): Promise<AgentJob[]> {
    const jobs = await this.dependencies.persistence.getJobs({
      agentType: options?.agentType,
      status: options?.status,
      limit: options?.limit,
    });
    return jobs.map((job) => mapPersistedJob(job, this.dependencies.clock.now));
  }
}
