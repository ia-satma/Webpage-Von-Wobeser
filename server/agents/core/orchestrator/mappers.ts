import type { OrchestratorPersistence } from './dependencies';
import type { AgentEvent, AgentJob, AgentType, JobPriority, JobStatus } from '../types';

export const PRIORITY_ORDER: Record<JobPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
};

type PersistedJob = Awaited<ReturnType<OrchestratorPersistence['getPendingJobs']>>[number];
type PersistedEvent = Awaited<ReturnType<OrchestratorPersistence['getRecentEvents']>>[number];

export function mapPersistedJob(job: PersistedJob, now: () => Date): AgentJob {
  return {
    id: job.id,
    agentType: job.agentType as AgentType,
    status: job.status as JobStatus,
    priority: (job.priority || 'normal') as JobPriority,
    payload: job.payload as Record<string, unknown>,
    result: job.result as Record<string, unknown> | undefined,
    error: job.error || undefined,
    retryCount: job.retryCount || 0,
    maxRetries: job.maxRetries || 3,
    createdAt: job.createdAt || now(),
    startedAt: job.startedAt || undefined,
    completedAt: job.completedAt || undefined,
    parentJobId: job.parentJobId || undefined,
  };
}

export function mapPersistedEvent(event: PersistedEvent, now: () => Date): AgentEvent {
  return {
    id: event.id,
    jobId: event.jobId,
    agentType: event.agentType as AgentType,
    eventType: event.eventType as AgentEvent['eventType'],
    message: event.message,
    data: event.data as Record<string, unknown> | undefined,
    timestamp: event.timestamp || now(),
  };
}

export function sortJobsByPriority(jobs: AgentJob[]): void {
  jobs.sort((left, right) => (
    (PRIORITY_ORDER[left.priority] ?? 2) - (PRIORITY_ORDER[right.priority] ?? 2)
  ));
}

export function insertJobByPriority(queue: AgentJob[], job: AgentJob): void {
  const insertIndex = queue.findIndex(
    (queuedJob) => PRIORITY_ORDER[queuedJob.priority] > PRIORITY_ORDER[job.priority],
  );

  if (insertIndex === -1) queue.push(job);
  else queue.splice(insertIndex, 0, job);
}

export function countActiveJobsForAgent(
  activeJobs: Map<string, AgentJob>,
  agentType: AgentType,
): number {
  return Array.from(activeJobs.values())
    .filter((activeJob) => activeJob.agentType === agentType)
    .length;
}
