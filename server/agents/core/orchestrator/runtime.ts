import { createDefaultOrchestratorDependencies, type OrchestratorDependencies } from './dependencies';
import { OrchestratorExecutionService } from './executionService';
import { OrchestratorOutcomeService } from './outcomeService';
import { OrchestratorPipelineService } from './pipelineService';
import { OrchestratorProcessingService } from './processingService';
import { OrchestratorQueueService } from './queueService';
import { OrchestratorReportingService } from './reportingService';
import { createOrchestratorState } from './state';

export class OrchestratorRuntime {
  readonly state = createOrchestratorState();
  readonly outcomes: OrchestratorOutcomeService;
  readonly queue: OrchestratorQueueService;
  readonly execution: OrchestratorExecutionService;
  readonly pipeline: OrchestratorPipelineService;
  readonly processing: OrchestratorProcessingService;
  readonly reporting: OrchestratorReportingService;

  constructor(readonly dependencies: OrchestratorDependencies) {
    this.outcomes = new OrchestratorOutcomeService(dependencies);
    this.queue = new OrchestratorQueueService(this.state, dependencies, this.outcomes);
    this.execution = new OrchestratorExecutionService(
      this.state,
      dependencies,
      this.queue,
      this.outcomes,
    );
    this.pipeline = new OrchestratorPipelineService(
      this.state,
      dependencies,
      this.execution,
    );
    this.processing = new OrchestratorProcessingService(
      this.state,
      dependencies,
      this.queue,
      this.outcomes,
    );
    this.reporting = new OrchestratorReportingService(this.state, dependencies);
  }
}

export function createDefaultOrchestratorRuntime(): OrchestratorRuntime {
  return new OrchestratorRuntime(createDefaultOrchestratorDependencies());
}
