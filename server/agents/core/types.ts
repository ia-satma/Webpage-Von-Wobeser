export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed' | 'paused';

export type AgentType = 
  | 'formatter'
  | 'metadata_linker'
  | 'polyglot_translator'
  | 'content_auditor'
  | 'seo_optimizer'
  | 'content_analyzer'
  | 'image_suggestion'
  | 'category_agent'
  | 'website_auditor'
  | 'orchestrator';

export type JobStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

export type JobPriority = 'low' | 'normal' | 'high' | 'critical';

export interface AgentJob {
  id: string;
  agentType: AgentType;
  status: JobStatus;
  priority: JobPriority;
  payload: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  parentJobId?: string;
}

export interface AgentEvent {
  id: string;
  jobId: string;
  agentType: AgentType;
  eventType: 'start' | 'progress' | 'complete' | 'error' | 'learning' | 'evolution_proposal';
  message: string;
  data?: Record<string, unknown>;
  timestamp: Date;
}

export interface AgentSkill {
  id: string;
  agentType: AgentType;
  name: string;
  description: string;
  expertise: number;
  usageCount: number;
  successRate: number;
  learnings: SkillLearning[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SkillLearning {
  id: string;
  context: string;
  insight: string;
  confidence: number;
  source: 'execution' | 'feedback' | 'evolution';
  timestamp: Date;
}

export interface KnowledgeDocument {
  id: string;
  agentType: AgentType;
  category: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  embedding?: number[];
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EvolutionProposal {
  id: string;
  agentType: AgentType;
  proposalType: 'skill_improvement' | 'new_skill' | 'config_change' | 'knowledge_update';
  title: string;
  description: string;
  rationale: string;
  impact: 'low' | 'medium' | 'high';
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
  proposedChanges: Record<string, unknown>;
  metrics?: {
    before: Record<string, number>;
    after?: Record<string, number>;
  };
  createdAt: Date;
  reviewedAt?: Date;
  implementedAt?: Date;
}

export interface AgentConfig {
  agentType: AgentType;
  name: string;
  description: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  skills: string[];
  enabled: boolean;
  concurrency: number;
  retryPolicy: {
    maxRetries: number;
    backoffMs: number;
    backoffMultiplier: number;
  };
}

export interface AgentStats {
  agentType: AgentType;
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageExecutionTime: number;
  successRate: number;
  skillCount: number;
  knowledgeDocuments: number;
  evolutionProposals: number;
  lastActive?: Date;
}

export interface ExecutionContext {
  jobId: string;
  agentType: AgentType;
  startTime: Date;
  parentContext?: ExecutionContext;
  metadata: Record<string, unknown>;
}

export interface AgentResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  learnings?: SkillLearning[];
  evolutionProposals?: Omit<EvolutionProposal, 'id' | 'createdAt'>[];
  metrics?: Record<string, number>;
}
