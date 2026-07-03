import { db } from '../../db';
import { eq, and, desc, inArray, sql } from 'drizzle-orm';
import {
  agentJobs,
  agentEvents,
  agentKnowledge,
  agentSkills,
  agentEvolutionProposals,
  InsertAgentJob,
  InsertAgentEvent,
  InsertAgentKnowledge,
  InsertAgentSkill,
  InsertAgentEvolutionProposal,
  AgentJob as DbAgentJob,
  AgentEvent as DbAgentEvent,
  AgentKnowledge as DbAgentKnowledge,
  AgentSkill as DbAgentSkill,
  AgentEvolutionProposal as DbAgentEvolutionProposal,
} from '@shared/schema';

export class DatabasePersistence {
  async createJob(job: InsertAgentJob): Promise<DbAgentJob> {
    const [created] = await db.insert(agentJobs).values(job).returning();
    return created;
  }

  async updateJob(id: string, updates: Partial<InsertAgentJob>): Promise<DbAgentJob | null> {
    const [updated] = await db.update(agentJobs)
      .set(updates)
      .where(eq(agentJobs.id, id))
      .returning();
    return updated || null;
  }

  async getJob(id: string): Promise<DbAgentJob | null> {
    const [job] = await db.select().from(agentJobs).where(eq(agentJobs.id, id));
    return job || null;
  }

  async getPendingJobs(agentType?: string): Promise<DbAgentJob[]> {
    if (agentType) {
      return db.select().from(agentJobs)
        .where(and(
          eq(agentJobs.status, 'pending'),
          eq(agentJobs.agentType, agentType)
        ))
        .orderBy(desc(agentJobs.createdAt));
    }
    return db.select().from(agentJobs)
      .where(eq(agentJobs.status, 'pending'))
      .orderBy(desc(agentJobs.createdAt));
  }

  async resetInProgressJobsToPending(): Promise<number> {
    const result = await db.update(agentJobs)
      .set({ status: 'pending' })
      .where(eq(agentJobs.status, 'in_progress'))
      .returning();
    return result.length;
  }

  async getFailedJobs(limit = 50): Promise<DbAgentJob[]> {
    return db.select().from(agentJobs)
      .where(eq(agentJobs.status, 'failed'))
      .orderBy(desc(agentJobs.createdAt))
      .limit(limit);
  }

  async getJobStatsByAgentType(): Promise<Record<string, { total: number; completed: number; failed: number; pending: number }>> {
    // GROUP BY (agentType, status) en SQL en vez de traer TODOS los jobs y contar en JS.
    const rows = await db
      .select({ agentType: agentJobs.agentType, status: agentJobs.status, count: sql<number>`count(*)::int` })
      .from(agentJobs)
      .groupBy(agentJobs.agentType, agentJobs.status);
    const stats: Record<string, { total: number; completed: number; failed: number; pending: number }> = {};
    for (const r of rows) {
      if (!stats[r.agentType]) stats[r.agentType] = { total: 0, completed: 0, failed: 0, pending: 0 };
      stats[r.agentType].total += r.count;
      if (r.status === 'completed') stats[r.agentType].completed += r.count;
      else if (r.status === 'failed') stats[r.agentType].failed += r.count;
      else if (r.status === 'pending') stats[r.agentType].pending += r.count;
    }
    return stats;
  }

  async getJobCounts(): Promise<{ pending: number; inProgress: number; completed: number; failed: number }> {
    // GROUP BY status en SQL en vez de traer TODOS los jobs y contar en JS.
    const rows = await db
      .select({ status: agentJobs.status, count: sql<number>`count(*)::int` })
      .from(agentJobs)
      .groupBy(agentJobs.status);
    const counts = { pending: 0, inProgress: 0, completed: 0, failed: 0 };
    for (const r of rows) {
      if (r.status === 'pending') counts.pending = r.count;
      else if (r.status === 'in_progress') counts.inProgress = r.count;
      else if (r.status === 'completed') counts.completed = r.count;
      else if (r.status === 'failed') counts.failed = r.count;
    }
    return counts;
  }

  async getAllSkills(): Promise<DbAgentSkill[]> {
    return db.select().from(agentSkills).orderBy(desc(agentSkills.updatedAt));
  }

  async getJobsByStatus(status: string, limit = 100): Promise<DbAgentJob[]> {
    return db.select().from(agentJobs)
      .where(eq(agentJobs.status, status))
      .orderBy(desc(agentJobs.createdAt))
      .limit(limit);
  }

  async getRecentJobs(limit = 50): Promise<DbAgentJob[]> {
    return db.select().from(agentJobs)
      .orderBy(desc(agentJobs.createdAt))
      .limit(limit);
  }

  async logEvent(event: InsertAgentEvent): Promise<DbAgentEvent> {
    const [created] = await db.insert(agentEvents).values(event).returning();
    return created;
  }

  async getEvents(options: { jobId?: string; agentType?: string; limit?: number }): Promise<DbAgentEvent[]> {
    let query = db.select().from(agentEvents);
    
    if (options.jobId) {
      query = query.where(eq(agentEvents.jobId, options.jobId)) as any;
    }
    if (options.agentType) {
      query = query.where(eq(agentEvents.agentType, options.agentType)) as any;
    }
    
    return query.orderBy(desc(agentEvents.timestamp)).limit(options.limit || 100);
  }

  async getRecentEvents(limit = 50): Promise<DbAgentEvent[]> {
    return db.select().from(agentEvents)
      .orderBy(desc(agentEvents.timestamp))
      .limit(limit);
  }

  async createKnowledge(knowledge: InsertAgentKnowledge): Promise<DbAgentKnowledge> {
    const [created] = await db.insert(agentKnowledge).values(knowledge).returning();
    return created;
  }

  async updateKnowledge(id: string, updates: Partial<InsertAgentKnowledge> & { usageCount?: number }): Promise<DbAgentKnowledge | null> {
    const updateData: Record<string, unknown> = { ...updates, updatedAt: new Date() };
    const [updated] = await db.update(agentKnowledge)
      .set(updateData)
      .where(eq(agentKnowledge.id, id))
      .returning();
    return updated || null;
  }

  async getKnowledge(id: string): Promise<DbAgentKnowledge | null> {
    const [knowledge] = await db.select().from(agentKnowledge).where(eq(agentKnowledge.id, id));
    return knowledge || null;
  }

  async getKnowledgeByAgent(agentType: string): Promise<DbAgentKnowledge[]> {
    return db.select().from(agentKnowledge)
      .where(eq(agentKnowledge.agentType, agentType))
      .orderBy(desc(agentKnowledge.updatedAt));
  }

  async searchKnowledge(agentType: string, query: string, category?: string, limit = 10): Promise<DbAgentKnowledge[]> {
    const docs = await this.getKnowledgeByAgent(agentType);
    const queryLower = query.toLowerCase();
    
    let filtered = docs.filter(doc =>
      doc.content.toLowerCase().includes(queryLower) ||
      doc.title.toLowerCase().includes(queryLower)
    );

    if (category) {
      filtered = filtered.filter(doc => doc.category === category);
    }

    for (const doc of filtered.slice(0, limit)) {
      await this.updateKnowledge(doc.id, { usageCount: (doc.usageCount || 0) + 1 });
    }

    return filtered.slice(0, limit);
  }

  async deleteKnowledge(id: string): Promise<boolean> {
    // Devuelve si realmente se borró algo (antes retornaba true incondicionalmente).
    const result = await db.delete(agentKnowledge).where(eq(agentKnowledge.id, id)).returning();
    return result.length > 0;
  }

  async getAllKnowledge(): Promise<DbAgentKnowledge[]> {
    return db.select().from(agentKnowledge).orderBy(desc(agentKnowledge.updatedAt));
  }

  async createSkill(skill: InsertAgentSkill): Promise<DbAgentSkill> {
    const [created] = await db.insert(agentSkills).values(skill).returning();
    return created;
  }

  async updateSkill(id: string, updates: Partial<InsertAgentSkill>): Promise<DbAgentSkill | null> {
    const [updated] = await db.update(agentSkills)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(agentSkills.id, id))
      .returning();
    return updated || null;
  }

  async getSkillsByAgent(agentType: string): Promise<DbAgentSkill[]> {
    return db.select().from(agentSkills)
      .where(eq(agentSkills.agentType, agentType))
      .orderBy(desc(agentSkills.expertise));
  }

  async getOrCreateSkill(agentType: string, name: string, description?: string): Promise<DbAgentSkill> {
    const [existing] = await db.select().from(agentSkills)
      .where(and(
        eq(agentSkills.agentType, agentType),
        eq(agentSkills.name, name)
      ));
    
    if (existing) return existing;
    
    return this.createSkill({ agentType, name, description });
  }

  async createProposal(proposal: InsertAgentEvolutionProposal): Promise<DbAgentEvolutionProposal> {
    const [created] = await db.insert(agentEvolutionProposals).values(proposal).returning();
    return created;
  }

  async updateProposal(id: string, updates: Partial<InsertAgentEvolutionProposal>): Promise<DbAgentEvolutionProposal | null> {
    const [updated] = await db.update(agentEvolutionProposals)
      .set(updates)
      .where(eq(agentEvolutionProposals.id, id))
      .returning();
    return updated || null;
  }

  async getProposal(id: string): Promise<DbAgentEvolutionProposal | null> {
    const [proposal] = await db.select().from(agentEvolutionProposals).where(eq(agentEvolutionProposals.id, id));
    return proposal || null;
  }

  async getProposals(options: { agentType?: string; status?: string; limit?: number }): Promise<DbAgentEvolutionProposal[]> {
    let conditions = [];
    
    if (options.agentType) {
      conditions.push(eq(agentEvolutionProposals.agentType, options.agentType));
    }
    if (options.status) {
      conditions.push(eq(agentEvolutionProposals.status, options.status));
    }

    if (conditions.length > 0) {
      return db.select().from(agentEvolutionProposals)
        .where(and(...conditions))
        .orderBy(desc(agentEvolutionProposals.createdAt))
        .limit(options.limit || 50);
    }

    return db.select().from(agentEvolutionProposals)
      .orderBy(desc(agentEvolutionProposals.createdAt))
      .limit(options.limit || 50);
  }

  async getKnowledgeStats(agentType?: string): Promise<{
    totalDocuments: number;
    byAgent: Record<string, number>;
    byCategory: Record<string, number>;
    mostUsed: DbAgentKnowledge[];
  }> {
    const allDocs = agentType 
      ? await this.getKnowledgeByAgent(agentType)
      : await this.getAllKnowledge();

    const byAgent: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    allDocs.forEach(doc => {
      byAgent[doc.agentType] = (byAgent[doc.agentType] || 0) + 1;
      byCategory[doc.category] = (byCategory[doc.category] || 0) + 1;
    });

    const mostUsed = [...allDocs]
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 10);

    return {
      totalDocuments: allDocs.length,
      byAgent,
      byCategory,
      mostUsed,
    };
  }
}

export const dbPersistence = new DatabasePersistence();
