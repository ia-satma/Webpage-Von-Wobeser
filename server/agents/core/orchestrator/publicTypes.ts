import type { CopyHistoryOrigin } from '../../storage/CopyHistory';
import type { AgentResult, AgentType } from '../types';

export interface PipelineStageUpdate {
  stage: AgentType | 'legal_council';
  status: 'running' | 'completed' | 'error';
  index: number;
  total: number;
  result?: AgentResult;
  message: string;
}

export interface PipelineRunOptions {
  onProgress?: (update: PipelineStageUpdate) => void | Promise<void>;
  actorId?: string | null;
  origin?: Extract<CopyHistoryOrigin, 'pipeline' | 'scheduled'>;
}
