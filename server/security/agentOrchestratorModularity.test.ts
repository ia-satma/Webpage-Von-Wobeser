import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

const root = process.cwd();
const facadePath = path.join(root, 'server', 'agents', 'core', 'AgentOrchestrator.ts');
const modulesDirectory = path.join(root, 'server', 'agents', 'core', 'orchestrator');

function parse(filePath: string): ts.SourceFile {
  return ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
}

function hasExport(node: ts.Node): boolean {
  return Boolean(node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword));
}

test('la fachada conserva cuatro exportaciones y los 14 métodos públicos en orden', () => {
  const source = parse(facadePath);
  const exported = new Set<string>();
  let orchestratorClass: ts.ClassDeclaration | undefined;

  for (const statement of source.statements) {
    if (ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
      for (const element of statement.exportClause.elements) exported.add(element.name.text);
    }
    if (ts.isClassDeclaration(statement) && hasExport(statement) && statement.name) {
      exported.add(statement.name.text);
      if (statement.name.text === 'AgentOrchestrator') orchestratorClass = statement;
    }
    if (ts.isVariableStatement(statement) && hasExport(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) exported.add(declaration.name.text);
      }
    }
  }

  assert.deepEqual(
    [...exported].sort(),
    ['AgentOrchestrator', 'PipelineRunOptions', 'PipelineStageUpdate', 'orchestrator'].sort(),
  );
  assert.ok(orchestratorClass);

  const methods = orchestratorClass.members.filter(ts.isMethodDeclaration);
  assert.deepEqual(
    methods.map((method) => method.name.getText(source)),
    [
      'isProcessing',
      'start',
      'initialize',
      'getFailedJobs',
      'registerAgent',
      'getAgent',
      'enqueueJob',
      'executeImmediately',
      'runPipeline',
      'processNextJob',
      'startProcessing',
      'stopProcessing',
      'getStatus',
      'getJobHistory',
    ],
  );

  const signatures = methods.map((method) => {
    assert.ok(method.body);
    return source.text
      .slice(method.getStart(source), method.body.getStart(source))
      .replace(/\s+/g, ' ')
      .trim();
  });
  assert.deepEqual(signatures, [
    'isProcessing(): boolean',
    'start(intervalMs: number = 1000): void',
    'async initialize(): Promise<void>',
    'async getFailedJobs(limit: number = 50): Promise<AgentJob[]>',
    'registerAgent(agent: BaseAgent): void',
    'getAgent(agentType: AgentType): BaseAgent | undefined',
    'async enqueueJob( agentType: AgentType, payload: Record<string, unknown>, options?: { priority?: JobPriority; parentJobId?: string; maxRetries?: number; }, ): Promise<AgentJob>',
    'async executeImmediately( agentType: AgentType, payload: Record<string, unknown>, execution: { actorId?: string | null; origin?: CopyHistoryOrigin } = {}, ): Promise<AgentResult>',
    "async runPipeline( articleId: string, stages: AgentType[] = [ 'formatter', 'metadata_linker', 'polyglot_translator', 'seo_optimizer', ], options: PipelineRunOptions = {}, ): Promise<{ success: boolean; results: Record<AgentType, AgentResult> }>",
    'async processNextJob(): Promise<AgentJob | null>',
    'startProcessing(intervalMs: number = 1000): void',
    'stopProcessing(): void',
    'async getStatus(): Promise<{ isRunning: boolean; queueLength: number; activeJobs: number; registeredAgents: AgentType[]; recentJobs: AgentJob[]; recentEvents: AgentEvent[]; }>',
    'async getJobHistory(options?: { agentType?: AgentType; status?: JobStatus; limit?: number; }): Promise<AgentJob[]>',
  ]);
});

test('la fachada y los servicios respetan límites y dependencias unidireccionales', () => {
  const facade = fs.readFileSync(facadePath, 'utf8');
  assert.ok(facade.split('\n').length <= 250);
  assert.doesNotMatch(facade, /\b(?:db|dbPersistence)\.(?:select|insert|update|delete|execute)\b/);

  const moduleFiles = fs.readdirSync(modulesDirectory)
    .filter((name) => name.endsWith('.ts') && !name.startsWith('._'));
  assert.ok(moduleFiles.length >= 10);
  for (const fileName of moduleFiles) {
    const source = fs.readFileSync(path.join(modulesDirectory, fileName), 'utf8');
    assert.ok(source.split('\n').length <= 350, `${fileName} supera 350 líneas`);
    assert.doesNotMatch(
      source,
      /from\s+['"]\.\.\/AgentOrchestrator['"]/,
      `${fileName} no debe importar la fachada`,
    );
  }
});

test('concurrencia, sincronización, reintentos y pipeline conservan sus constantes', () => {
  const state = fs.readFileSync(path.join(modulesDirectory, 'state.ts'), 'utf8');
  const pipeline = fs.readFileSync(path.join(modulesDirectory, 'pipelineService.ts'), 'utf8');
  const execution = fs.readFileSync(path.join(modulesDirectory, 'executionService.ts'), 'utf8');
  const processing = fs.readFileSync(path.join(modulesDirectory, 'processingService.ts'), 'utf8');

  assert.match(state, /SYNC_INTERVAL_MS = 30_000/);
  assert.match(state, /MAX_ACTIVE_JOBS = 4/);
  assert.match(state, /MAX_RETRY_DELAY_MS = 30_000/);
  assert.match(execution, /const attempts = 1/);
  assert.match(processing, /backoffMultiplier \*\* \(job\.retryCount - 1\)/);
  assert.match(pipeline, /stage === 'content_analyzer'[\s\S]*?\{ articleId \}[\s\S]*?applyChanges: true/);
  assert.match(pipeline, /origin: options\.origin \|\| 'pipeline'/);
  assert.match(processing, /origin: 'scheduled'/);
});
