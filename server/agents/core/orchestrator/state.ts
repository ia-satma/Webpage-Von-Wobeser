import type { BaseAgent } from '../BaseAgent';
import type { AgentJob, AgentType } from '../types';

export const DEFAULT_PROCESSING_INTERVAL_MS = 1_000;
export const SYNC_INTERVAL_MS = 30_000;
export const MAX_ACTIVE_JOBS = 4;
export const MAX_RETRY_DELAY_MS = 30_000;

export interface OrchestratorState {
  agents: Map<AgentType, BaseAgent>;
  jobQueue: AgentJob[];
  activeJobs: Map<string, AgentJob>;
  isRunning: boolean;
  processingInterval: ReturnType<typeof setInterval> | null;
  isProcessingCycle: boolean;
  initialized: boolean;
  initializationPromise: Promise<void> | null;
  lastSyncAt: number;
}

export function createOrchestratorState(): OrchestratorState {
  return {
    agents: new Map(),
    jobQueue: [],
    activeJobs: new Map(),
    isRunning: false,
    processingInterval: null,
    isProcessingCycle: false,
    initialized: false,
    initializationPromise: null,
    lastSyncAt: 0,
  };
}
