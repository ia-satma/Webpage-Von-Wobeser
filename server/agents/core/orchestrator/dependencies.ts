import { eq } from 'drizzle-orm';
import { news } from '@shared/schema';
import { db } from '../../../db';
import { legalCouncilService, type LegalCouncilService } from '../../../../services/agents/LegalCouncilService';
import { evolutionTracker, type AgentEvolutionTracker } from '../AgentEvolution';
import { knowledgeStore, type AgentKnowledgeStore } from '../AgentKnowledge';
import { parseAgentPayload } from '../contracts';
import { dbPersistence, type DatabasePersistence } from '../../storage/DatabasePersistence';
import { persistAgentCopySnapshot } from '../../storage/CopyHistory';

type PersistenceMethod =
  | 'claimPendingJob'
  | 'createJob'
  | 'getFailedJobs'
  | 'getJobCounts'
  | 'getJobs'
  | 'getPendingJobs'
  | 'getRecentEvents'
  | 'getRecentJobs'
  | 'logEvent'
  | 'resetInProgressJobsToPending'
  | 'updateJob';

export type OrchestratorPersistence = Pick<DatabasePersistence, PersistenceMethod>;

export type OrchestratorKnowledge = Pick<
  AgentKnowledgeStore,
  'addDocument' | 'addLegalGlossary' | 'addSocialCopyGuide' | 'initialize'
>;

export type OrchestratorEvolution = Pick<
  AgentEvolutionTracker,
  'addProposal' | 'initialize' | 'updateAgentStats'
>;

export type CouncilVerdict = Awaited<ReturnType<LegalCouncilService['evaluateArticle']>>;
export type PipelineArticle = typeof news.$inferSelect;
export type CouncilUpdate = Partial<typeof news.$inferInsert>;

export interface OrchestratorClock {
  now(): Date;
  nowMs(): number;
  setInterval(callback: () => void | Promise<void>, intervalMs: number): ReturnType<typeof setInterval>;
  clearInterval(handle: ReturnType<typeof setInterval>): void;
  setTimeout(callback: () => void, delayMs: number): ReturnType<typeof setTimeout>;
}

export interface OrchestratorLogger {
  log(...values: unknown[]): void;
  error(...values: unknown[]): void;
}

export interface OrchestratorArticleStore {
  findById(articleId: string): Promise<PipelineArticle | undefined>;
  updateCouncil(articleId: string, update: CouncilUpdate): Promise<void>;
}

export interface OrchestratorDependencies {
  persistence: OrchestratorPersistence;
  knowledge: OrchestratorKnowledge;
  evolution: OrchestratorEvolution;
  legalCouncil: Pick<LegalCouncilService, 'evaluateArticle'>;
  articles: OrchestratorArticleStore;
  parsePayload: typeof parseAgentPayload;
  persistCopySnapshot: typeof persistAgentCopySnapshot;
  clock: OrchestratorClock;
  logger: OrchestratorLogger;
}

export function createDefaultOrchestratorDependencies(): OrchestratorDependencies {
  return {
    persistence: dbPersistence,
    knowledge: knowledgeStore,
    evolution: evolutionTracker,
    legalCouncil: legalCouncilService,
    articles: {
      async findById(articleId) {
        const [article] = await db.select().from(news).where(eq(news.id, articleId));
        return article;
      },
      async updateCouncil(articleId, update) {
        await db.update(news).set(update).where(eq(news.id, articleId));
      },
    },
    parsePayload: parseAgentPayload,
    persistCopySnapshot: persistAgentCopySnapshot,
    clock: {
      now: () => new Date(),
      nowMs: () => Date.now(),
      setInterval: (callback, intervalMs) => setInterval(callback, intervalMs),
      clearInterval: (handle) => clearInterval(handle),
      setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
    },
    logger: console,
  };
}
