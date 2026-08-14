import type { OrchestratorDependencies } from './dependencies';
import type { AgentEvent, AgentResult, AgentType } from '../types';

export class OrchestratorOutcomeService {
  constructor(private readonly dependencies: OrchestratorDependencies) {}

  async addEvent(
    jobId: string,
    agentType: AgentType | string,
    eventType: AgentEvent['eventType'],
    message: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.dependencies.persistence.logEvent({
        jobId,
        agentType,
        eventType,
        message,
        data,
      });
    } catch (error) {
      this.dependencies.logger.error('[Orchestrator] Failed to log event:', error);
    }
  }

  async recordAgentOutcome(
    agentType: AgentType,
    result: AgentResult,
    executionTime: number,
  ): Promise<void> {
    if (result.success) {
      for (const learning of result.learnings || []) {
        try {
          await this.dependencies.knowledge.addDocument({
            agentType,
            category: 'learning',
            title: learning.context,
            content: learning.insight,
            metadata: { confidence: learning.confidence, source: learning.source },
          });
        } catch (error) {
          this.dependencies.logger.error(
            `[Orchestrator] Could not persist learning for ${agentType}:`,
            error,
          );
        }
      }

      for (const proposal of result.evolutionProposals || []) {
        try {
          await this.dependencies.evolution.addProposal(proposal);
        } catch (error) {
          this.dependencies.logger.error(
            `[Orchestrator] Could not persist proposal for ${agentType}:`,
            error,
          );
        }
      }
    }

    this.dependencies.evolution.updateAgentStats(agentType, {
      totalJobs: 1,
      completedJobs: result.success ? 1 : 0,
      failedJobs: result.success ? 0 : 1,
      averageExecutionTime: Math.max(0, executionTime),
      successRate: result.success ? 1 : 0,
    });
  }
}
