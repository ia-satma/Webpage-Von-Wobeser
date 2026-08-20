import type { AgentResult, AgentType } from '../types';
import type { OrchestratorDependencies } from './dependencies';
import type { OrchestratorExecutionService } from './executionService';
import type { PipelineRunOptions } from './publicTypes';
import type { OrchestratorState } from './state';

export const DEFAULT_PIPELINE_STAGES: AgentType[] = [
  'formatter',
  'metadata_linker',
  'polyglot_translator',
  'seo_optimizer',
];

export class OrchestratorPipelineService {
  constructor(
    private readonly state: OrchestratorState,
    private readonly dependencies: OrchestratorDependencies,
    private readonly execution: OrchestratorExecutionService,
  ) {}

  async runPipeline(
    articleId: string,
    stages: AgentType[] = DEFAULT_PIPELINE_STAGES,
    options: PipelineRunOptions = {},
  ): Promise<{ success: boolean; results: Record<AgentType, AgentResult> }> {
    const results: Record<string, AgentResult> = {};
    const pipelineArticle = await this.dependencies.articles.findById(articleId);
    if (!pipelineArticle) {
      return {
        success: false,
        results: {
          formatter: { success: false, error: 'Article not found' },
        } as Record<AgentType, AgentResult>,
      };
    }
    if (pipelineArticle.published !== false) {
      return {
        success: false,
        results: {
          formatter: {
            success: false,
            error: 'Published articles must be converted to a draft before applying the pipeline',
          },
        } as Record<AgentType, AgentResult>,
      };
    }

    this.dependencies.logger.log(`[Orchestrator] Starting pipeline for article ${articleId}`);
    const totalStages = stages.length + 1;

    for (let stageIndex = 0; stageIndex < stages.length; stageIndex++) {
      const stage = stages[stageIndex];
      const agent = this.state.agents.get(stage);
      if (!agent || !agent.enabled) {
        const result = { success: false, error: `Agent ${stage} is unavailable` };
        results[stage] = result;
        await options.onProgress?.({
          stage,
          status: 'error',
          index: stageIndex,
          total: totalStages,
          result,
          message: result.error,
        });
        return { success: false, results: results as Record<AgentType, AgentResult> };
      }

      try {
        this.dependencies.logger.log(`[Orchestrator] Running ${stage}...`);
        await options.onProgress?.({
          stage,
          status: 'running',
          index: stageIndex,
          total: totalStages,
          message: `${agent.name}: trabajando…`,
        });

        const stagePayload: Record<string, unknown> = stage === 'content_analyzer'
          ? { articleId }
          : { articleId, applyChanges: true };
        const result = await this.execution.executeImmediately(stage, stagePayload, {
          actorId: options.actorId,
          origin: options.origin || 'pipeline',
        });
        results[stage] = result;

        await options.onProgress?.({
          stage,
          status: result.success ? 'completed' : 'error',
          index: stageIndex,
          total: totalStages,
          result,
          message: result.success
            ? `${agent.name}: etapa terminada`
            : (result.error || `${agent.name}: etapa fallida`),
        });

        if (!result.success) {
          this.dependencies.logger.error(`[Orchestrator] ${stage} failed:`, result.error);
          return { success: false, results: results as Record<AgentType, AgentResult> };
        }
      } catch (error) {
        this.dependencies.logger.error(`[Orchestrator] ${stage} threw error:`, error);
        results[stage] = { success: false, error: 'Agent stage failed' };
        await options.onProgress?.({
          stage,
          status: 'error',
          index: stageIndex,
          total: totalStages,
          result: results[stage],
          message: 'Agent stage failed',
        });
        return { success: false, results: results as Record<AgentType, AgentResult> };
      }
    }

    this.dependencies.logger.log(`[Orchestrator] Pipeline completed for article ${articleId}`);
    await this.runLegalCouncil(articleId, stages.length, stages.length + 1, results, options);
    return { success: true, results: results as Record<AgentType, AgentResult> };
  }

  private async runLegalCouncil(
    articleId: string,
    stageIndex: number,
    totalStages: number,
    results: Record<string, AgentResult>,
    options: PipelineRunOptions,
  ): Promise<void> {
    try {
      this.dependencies.logger.log(
        `[Orchestrator] Running automated legal-risk review for article ${articleId}...`,
      );
      await options.onProgress?.({
        stage: 'legal_council',
        status: 'running',
        index: stageIndex,
        total: totalStages,
        message: 'Ejecutando la revisión legal final…',
      });

      const article = await this.dependencies.articles.findById(articleId);
      const councilContent = article?.content || article?.contentEs;
      if (article && councilContent) {
        const verdict = await this.dependencies.legalCouncil.evaluateArticle(councilContent);
        const newStatus = verdict.overallStatus === 'approved'
          ? 'ready_for_approval'
          : verdict.overallStatus === 'rejected'
            ? 'failed'
            : 'ready_for_approval';

        await this.dependencies.articles.updateCouncil(articleId, {
          councilVerdict: verdict,
          processingStatus: newStatus,
          lastProcessedAt: this.dependencies.clock.now(),
          failedStep: verdict.overallStatus === 'rejected' ? 'council' : null,
        });

        this.dependencies.logger.log(
          `[Orchestrator] Automated legal-risk review result: ${verdict.overallStatus}, Risk: ${verdict.riskFlag}`,
        );
        results.legal_council = {
          success: verdict.overallStatus !== 'rejected',
          data: verdict as unknown as Record<string, unknown>,
        };
        await options.onProgress?.({
          stage: 'legal_council',
          status: results.legal_council.success ? 'completed' : 'error',
          index: stageIndex,
          total: totalStages,
          result: results.legal_council,
          message: results.legal_council.success
            ? 'Revisión legal final terminada'
            : 'La revisión legal final requiere atención',
        });
      }
    } catch (councilError) {
      this.dependencies.logger.error(
        '[Orchestrator] Automated legal-risk review failed:',
        councilError,
      );
      await this.dependencies.articles.updateCouncil(articleId, {
        processingStatus: 'ready_for_approval',
        lastProcessedAt: this.dependencies.clock.now(),
        councilVerdict: {
          overallStatus: 'escalated',
          riskFlag: 'medium',
          consolidatedFeedback: 'Council evaluation failed. Manual review required.',
        },
      });
      await options.onProgress?.({
        stage: 'legal_council',
        status: 'error',
        index: stageIndex,
        total: totalStages,
        result: { success: false, error: 'Legal review unavailable; manual review required' },
        message: 'La revisión legal no estuvo disponible; se requiere revisión manual',
      });
    }
  }
}
