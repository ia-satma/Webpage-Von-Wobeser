import { EvolutionProposal, AgentType, AgentStats } from './types';
import { dbPersistence } from '../storage/DatabasePersistence';

type LearningCycleEntry = { timestamp: Date; insights: string[]; improvements: string[] };

export class AgentEvolutionTracker {
  private agentStats: Map<AgentType, AgentStats> = new Map();
  private learningCycleHistory: LearningCycleEntry[] = [];
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      await this.loadStatsFromDatabase();
      this.initialized = true;
      console.log('[Evolution] Tracker initialized with persisted stats');
    } catch (error) {
      console.error('[Evolution] Error initializing tracker:', error);
    }
  }

  private async loadStatsFromDatabase(): Promise<void> {
    const jobStats = await dbPersistence.getJobStatsByAgentType();
    const skills = await dbPersistence.getAllSkills();
    const knowledgeStats = await dbPersistence.getKnowledgeStats();
    const proposals = await dbPersistence.getProposals({ limit: 1000 });

    const skillsByAgent: Record<string, number> = {};
    for (const skill of skills) {
      skillsByAgent[skill.agentType] = (skillsByAgent[skill.agentType] || 0) + 1;
    }

    const proposalsByAgent: Record<string, number> = {};
    for (const proposal of proposals) {
      proposalsByAgent[proposal.agentType] = (proposalsByAgent[proposal.agentType] || 0) + 1;
    }

    for (const [agentType, stats] of Object.entries(jobStats)) {
      const agentStats: AgentStats = {
        agentType: agentType as AgentType,
        totalJobs: stats.total,
        completedJobs: stats.completed,
        failedJobs: stats.failed,
        averageExecutionTime: 0,
        successRate: stats.total > 0 ? stats.completed / stats.total : 1,
        skillCount: skillsByAgent[agentType] || 0,
        knowledgeDocuments: knowledgeStats.byAgent[agentType] || 0,
        evolutionProposals: proposalsByAgent[agentType] || 0,
      };
      
      this.agentStats.set(agentType as AgentType, agentStats);
    }

    console.log(`[Evolution] Loaded stats for ${this.agentStats.size} agents from database`);
  }

  async persistSkillUpdate(agentType: AgentType, skillName: string, description?: string): Promise<void> {
    try {
      await dbPersistence.getOrCreateSkill(agentType, skillName, description);
    } catch (error) {
      console.error('[Evolution] Error persisting skill update:', error);
    }
  }

  async addProposal(proposal: Omit<EvolutionProposal, 'id' | 'createdAt'>): Promise<EvolutionProposal> {
    const dbProposal = await dbPersistence.createProposal({
      agentType: proposal.agentType,
      proposalType: proposal.proposalType,
      title: proposal.title,
      description: proposal.description,
      rationale: proposal.rationale,
      impact: proposal.impact,
      status: proposal.status,
      proposedChanges: proposal.proposedChanges,
      metricsBefore: proposal.metrics?.before,
      metricsAfter: proposal.metrics?.after,
    });

    console.log(`[Evolution] New proposal: ${dbProposal.title} (${dbProposal.agentType})`);
    
    const result: EvolutionProposal = {
      id: dbProposal.id,
      agentType: dbProposal.agentType as AgentType,
      proposalType: dbProposal.proposalType as EvolutionProposal['proposalType'],
      title: dbProposal.title,
      description: dbProposal.description,
      rationale: dbProposal.rationale || '',
      impact: dbProposal.impact as EvolutionProposal['impact'],
      status: dbProposal.status as EvolutionProposal['status'],
      proposedChanges: dbProposal.proposedChanges as Record<string, unknown>,
      createdAt: dbProposal.createdAt || new Date(),
      reviewedAt: dbProposal.reviewedAt || undefined,
      implementedAt: dbProposal.implementedAt || undefined,
    };
    if (dbProposal.metricsBefore) {
      result.metrics = {
        before: dbProposal.metricsBefore as Record<string, number>,
        after: dbProposal.metricsAfter as Record<string, number> | undefined,
      };
    }
    return result;
  }

  async getProposals(options?: {
    agentType?: AgentType;
    status?: EvolutionProposal['status'];
    limit?: number;
  }): Promise<EvolutionProposal[]> {
    const dbProposals = await dbPersistence.getProposals({
      agentType: options?.agentType,
      status: options?.status,
      limit: options?.limit,
    });

    return dbProposals.map(p => {
      const proposal: EvolutionProposal = {
        id: p.id,
        agentType: p.agentType as AgentType,
        proposalType: p.proposalType as EvolutionProposal['proposalType'],
        title: p.title,
        description: p.description,
        rationale: p.rationale || '',
        impact: p.impact as EvolutionProposal['impact'],
        status: p.status as EvolutionProposal['status'],
        proposedChanges: p.proposedChanges as Record<string, unknown>,
        createdAt: p.createdAt || new Date(),
        reviewedAt: p.reviewedAt || undefined,
        implementedAt: p.implementedAt || undefined,
      };
      if (p.metricsBefore) {
        proposal.metrics = {
          before: p.metricsBefore as Record<string, number>,
          after: p.metricsAfter as Record<string, number> | undefined,
        };
      }
      return proposal;
    });
  }

  async updateProposalStatus(
    id: string,
    status: EvolutionProposal['status'],
    afterMetrics?: Record<string, number>
  ): Promise<EvolutionProposal | null> {
    const updates: Record<string, unknown> = { status };
    
    if (status === 'approved' || status === 'rejected') {
      updates.reviewedAt = new Date();
    }
    
    if (status === 'implemented') {
      updates.implementedAt = new Date();
      if (afterMetrics) {
        updates.metricsAfter = afterMetrics;
      }
    }

    const dbProposal = await dbPersistence.updateProposal(id, updates);
    if (!dbProposal) return null;

    const result: EvolutionProposal = {
      id: dbProposal.id,
      agentType: dbProposal.agentType as AgentType,
      proposalType: dbProposal.proposalType as EvolutionProposal['proposalType'],
      title: dbProposal.title,
      description: dbProposal.description,
      rationale: dbProposal.rationale || '',
      impact: dbProposal.impact as EvolutionProposal['impact'],
      status: dbProposal.status as EvolutionProposal['status'],
      proposedChanges: dbProposal.proposedChanges as Record<string, unknown>,
      createdAt: dbProposal.createdAt || new Date(),
      reviewedAt: dbProposal.reviewedAt || undefined,
      implementedAt: dbProposal.implementedAt || undefined,
    };
    if (dbProposal.metricsBefore) {
      result.metrics = {
        before: dbProposal.metricsBefore as Record<string, number>,
        after: dbProposal.metricsAfter as Record<string, number> | undefined,
      };
    }
    return result;
  }

  updateAgentStats(agentType: AgentType, stats: Partial<AgentStats>): void {
    const existing = this.agentStats.get(agentType) || {
      agentType,
      totalJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      averageExecutionTime: 0,
      successRate: 1,
      skillCount: 0,
      knowledgeDocuments: 0,
      evolutionProposals: 0,
    };

    const updated = {
      ...existing,
      totalJobs: existing.totalJobs + (stats.totalJobs || 0),
      completedJobs: existing.completedJobs + (stats.completedJobs || 0),
      failedJobs: existing.failedJobs + (stats.failedJobs || 0),
      lastActive: new Date(),
    };

    if (updated.totalJobs > 0) {
      updated.successRate = updated.completedJobs / updated.totalJobs;
    }

    if (stats.averageExecutionTime) {
      updated.averageExecutionTime = 
        (existing.averageExecutionTime * existing.totalJobs + stats.averageExecutionTime) / 
        (existing.totalJobs + 1);
    }

    this.agentStats.set(agentType, updated);
  }

  getAgentStats(agentType?: AgentType): AgentStats[] {
    if (agentType) {
      const stats = this.agentStats.get(agentType);
      return stats ? [stats] : [];
    }
    return Array.from(this.agentStats.values());
  }

  async runLearningCycle(): Promise<{
    insights: string[];
    improvements: string[];
    newProposals: number;
  }> {
    const insights: string[] = [];
    const improvements: string[] = [];
    let newProposals = 0;

    const allStats = this.getAgentStats();

    for (const stats of allStats) {
      if (stats.successRate < 0.8) {
        insights.push(`${stats.agentType} has low success rate (${(stats.successRate * 100).toFixed(1)}%)`);
        
        await this.addProposal({
          agentType: stats.agentType,
          proposalType: 'skill_improvement',
          title: `Improve ${stats.agentType} reliability`,
          description: `Success rate is ${(stats.successRate * 100).toFixed(1)}%, below 80% threshold`,
          rationale: 'Low success rate indicates need for better error handling or input validation',
          impact: 'high',
          status: 'pending',
          proposedChanges: { improveValidation: true, enhanceErrorHandling: true },
          metrics: { before: { successRate: stats.successRate } },
        });
        newProposals++;
      }

      if (stats.averageExecutionTime > 30000) {
        insights.push(`${stats.agentType} is slow (avg ${(stats.averageExecutionTime / 1000).toFixed(1)}s)`);
        improvements.push(`Consider caching for ${stats.agentType}`);
      }
    }

    const pendingProposals = await this.getProposals({ status: 'pending' });
    if (pendingProposals.length > 10) {
      insights.push(`${pendingProposals.length} pending proposals need review`);
    }

    this.learningCycleHistory.push({
      timestamp: new Date(),
      insights,
      improvements,
    });

    if (this.learningCycleHistory.length > 100) {
      this.learningCycleHistory = this.learningCycleHistory.slice(-100);
    }

    console.log(`[Evolution] Learning cycle complete: ${insights.length} insights, ${improvements.length} improvements, ${newProposals} new proposals`);

    return { insights, improvements, newProposals };
  }

  async getSummary(): Promise<{
    totalProposals: number;
    byStatus: Record<string, number>;
    byImpact: Record<string, number>;
    recentCycles: LearningCycleEntry[];
  }> {
    const proposals = await this.getProposals({ limit: 1000 });
    
    const byStatus: Record<string, number> = {};
    const byImpact: Record<string, number> = {};

    proposals.forEach(p => {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
      byImpact[p.impact] = (byImpact[p.impact] || 0) + 1;
    });

    return {
      totalProposals: proposals.length,
      byStatus,
      byImpact,
      recentCycles: this.learningCycleHistory.slice(-10),
    };
  }

  async toJSON(): Promise<{ proposals: EvolutionProposal[]; stats: AgentStats[]; history: LearningCycleEntry[] }> {
    const proposals = await this.getProposals({ limit: 1000 });
    return {
      proposals,
      stats: Array.from(this.agentStats.values()),
      history: this.learningCycleHistory,
    };
  }

  /** Restaura el estado en memoria desde un backup (p.ej. pCloud). Las propuestas viven
   *  en la base (fuente de verdad) y no se rehidratan aquí. */
  async fromJSON(data: { proposals?: EvolutionProposal[]; stats?: AgentStats[]; history?: LearningCycleEntry[] }): Promise<void> {
    if (Array.isArray(data?.stats)) {
      this.agentStats.clear();
      for (const s of data.stats) {
        this.agentStats.set((s as any).agentType as AgentType, s);
      }
    }
    if (Array.isArray(data?.history)) {
      this.learningCycleHistory = data.history;
    }
  }
}

export const evolutionTracker = new AgentEvolutionTracker();
