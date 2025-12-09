import { 
  AgentType, 
  AgentConfig, 
  AgentResult, 
  ExecutionContext,
  AgentEvent,
  SkillLearning,
  EvolutionProposal,
  KnowledgeDocument
} from './types';
import { openai } from '../../openai';

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected knowledge: KnowledgeDocument[] = [];
  protected skills: Map<string, { expertise: number; usageCount: number }> = new Map();
  
  constructor(config: AgentConfig) {
    this.config = config;
  }

  get agentType(): AgentType {
    return this.config.agentType;
  }

  get name(): string {
    return this.config.name;
  }

  abstract execute(context: ExecutionContext, payload: Record<string, unknown>): Promise<AgentResult>;

  protected async callLLM(
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
    options?: { temperature?: number; maxTokens?: number; jsonMode?: boolean }
  ): Promise<string> {
    const primaryModel = this.config.model || 'gpt-4o';
    const fallbackModels = ['gpt-4o-mini', 'gpt-3.5-turbo'];
    const allModels = [primaryModel, ...fallbackModels.filter(m => m !== primaryModel)];
    
    let lastError: Error | null = null;
    
    for (const model of allModels) {
      try {
        const response = await openai.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: this.config.systemPrompt },
            ...messages
          ],
          temperature: options?.temperature ?? this.config.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? this.config.maxTokens ?? 4096,
          response_format: options?.jsonMode ? { type: 'json_object' } : undefined,
        });

        return response.choices[0]?.message?.content || '';
      } catch (error: any) {
        lastError = error;
        const isQuotaError = error?.status === 429 || 
                            error?.message?.includes('quota') || 
                            error?.message?.includes('rate limit');
        
        if (isQuotaError && model !== allModels[allModels.length - 1]) {
          console.log(`[${this.name}] Model ${model} quota exceeded, trying fallback...`);
          continue;
        }
        throw error;
      }
    }
    
    throw lastError || new Error('All models failed');
  }

  protected async analyzeForLearnings(
    context: ExecutionContext,
    input: Record<string, unknown>,
    output: AgentResult
  ): Promise<SkillLearning[]> {
    if (!output.success) return [];

    try {
      const analysisPrompt = `Analyze this agent execution and extract key learnings:

Agent: ${this.name}
Input: ${JSON.stringify(input, null, 2)}
Output: ${JSON.stringify(output.data, null, 2)}

Extract 1-3 specific learnings that could improve future executions.
Return JSON: { "learnings": [{ "context": "...", "insight": "...", "confidence": 0.0-1.0 }] }`;

      const response = await this.callLLM(
        [{ role: 'user', content: analysisPrompt }],
        { temperature: 0.3, jsonMode: true }
      );

      const parsed = JSON.parse(response);
      return (parsed.learnings || []).map((l: any) => ({
        id: `learning-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        context: l.context,
        insight: l.insight,
        confidence: l.confidence || 0.7,
        source: 'execution' as const,
        timestamp: new Date(),
      }));
    } catch (error) {
      console.error(`[${this.name}] Failed to analyze learnings:`, error);
      return [];
    }
  }

  protected async proposeEvolution(
    context: ExecutionContext,
    metrics: Record<string, number>
  ): Promise<Omit<EvolutionProposal, 'id' | 'createdAt'>[]> {
    const proposals: Omit<EvolutionProposal, 'id' | 'createdAt'>[] = [];

    if (metrics.errorRate && metrics.errorRate > 0.2) {
      proposals.push({
        agentType: this.agentType,
        proposalType: 'skill_improvement',
        title: `Improve error handling for ${this.name}`,
        description: `Error rate is ${(metrics.errorRate * 100).toFixed(1)}%, which exceeds threshold`,
        rationale: 'High error rate indicates need for improved error handling or input validation',
        impact: 'high',
        status: 'pending',
        proposedChanges: {
          addValidation: true,
          improveErrorMessages: true,
        },
        metrics: { before: metrics },
      });
    }

    if (metrics.avgExecutionTime && metrics.avgExecutionTime > 30000) {
      proposals.push({
        agentType: this.agentType,
        proposalType: 'config_change',
        title: `Optimize ${this.name} performance`,
        description: `Average execution time is ${(metrics.avgExecutionTime / 1000).toFixed(1)}s`,
        rationale: 'Long execution times may impact user experience and system resources',
        impact: 'medium',
        status: 'pending',
        proposedChanges: {
          enableCaching: true,
          reduceBatchSize: true,
        },
        metrics: { before: metrics },
      });
    }

    return proposals;
  }

  protected createEvent(
    jobId: string,
    eventType: AgentEvent['eventType'],
    message: string,
    data?: Record<string, unknown>
  ): AgentEvent {
    return {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      jobId,
      agentType: this.agentType,
      eventType,
      message,
      data,
      timestamp: new Date(),
    };
  }

  protected async searchKnowledge(query: string, limit: number = 5): Promise<KnowledgeDocument[]> {
    const queryLower = query.toLowerCase();
    return this.knowledge
      .filter(doc => 
        doc.content.toLowerCase().includes(queryLower) ||
        doc.title.toLowerCase().includes(queryLower)
      )
      .slice(0, limit);
  }

  public loadKnowledge(documents: KnowledgeDocument[]): void {
    this.knowledge = documents.filter(d => d.agentType === this.agentType);
  }

  public getStats(): { skillCount: number; knowledgeCount: number; topSkills: string[] } {
    const topSkills = Array.from(this.skills.entries())
      .sort((a, b) => b[1].expertise - a[1].expertise)
      .slice(0, 5)
      .map(([name]) => name);

    return {
      skillCount: this.skills.size,
      knowledgeCount: this.knowledge.length,
      topSkills,
    };
  }
}
