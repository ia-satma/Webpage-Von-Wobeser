import assert from 'node:assert/strict';
import test from 'node:test';
import type { BaseAgent } from '../agents/core/BaseAgent';
import type { OrchestratorDependencies } from '../agents/core/orchestrator/dependencies';
import type { OrchestratorRuntime } from '../agents/core/orchestrator/runtime';
import type { AgentJob, AgentResult, AgentType, ExecutionContext } from '../agents/core/types';

process.env.DATABASE_URL ||= 'postgresql://orchestrator:orchestrator@127.0.0.1:5432/orchestrator';

type MemoryJob = {
  id: string;
  agentType: string;
  status: string;
  priority: string | null;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error: string | null;
  retryCount: number | null;
  maxRetries: number | null;
  createdAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  parentJobId: string | null;
};

type HarnessOptions = {
  initializeFailures?: number;
  copyFailure?: boolean;
  claimJobs?: boolean;
  councilFailure?: boolean;
  councilStatus?: 'approved' | 'rejected' | 'escalated';
  parseFailure?: boolean;
};

function memoryJob(
  id: string,
  overrides: Partial<MemoryJob> = {},
): MemoryJob {
  return {
    id,
    agentType: 'formatter',
    status: 'pending',
    priority: 'normal',
    payload: { articleId: 'article-1' },
    result: null,
    error: null,
    retryCount: 0,
    maxRetries: 3,
    createdAt: new Date('2026-08-13T06:00:00.000Z'),
    startedAt: null,
    completedAt: null,
    parentJobId: null,
    ...overrides,
  };
}

function fakeAgent(
  agentType: AgentType,
  execute: (context: ExecutionContext, payload: Record<string, unknown>) => Promise<AgentResult>,
  options: { enabled?: boolean; concurrency?: number; backoffMs?: number; multiplier?: number } = {},
): BaseAgent {
  return {
    agentType,
    name: `Fake ${agentType}`,
    enabled: options.enabled ?? true,
    concurrency: options.concurrency ?? 1,
    retryPolicy: {
      maxRetries: 3,
      backoffMs: options.backoffMs ?? 2_000,
      backoffMultiplier: options.multiplier ?? 2,
    },
    execute,
  } as unknown as BaseAgent;
}

async function createHarness(options: HarnessOptions = {}) {
  const { OrchestratorRuntime: Runtime } = await import('../agents/core/orchestrator/runtime');
  const jobs: MemoryJob[] = [];
  const events: Array<Record<string, unknown>> = [];
  const copies: Array<Record<string, unknown>> = [];
  const articleUpdates: Array<{ articleId: string; update: Record<string, unknown> }> = [];
  const articles = new Map<string, Record<string, unknown>>();
  const timeouts: Array<{ callback: () => void; delayMs: number }> = [];
  const intervals: Array<{ callback: () => void | Promise<void>; intervalMs: number; cleared: boolean }> = [];
  const errors: unknown[][] = [];
  const stats: Array<{ agentType: AgentType; values: Record<string, unknown> }> = [];
  let currentMs = Date.parse('2026-08-13T06:00:00.000Z');
  let nextJobId = 1;
  let initializationFailures = options.initializeFailures || 0;
  let initializeCalls = 0;
  let pendingReads = 0;

  const persistence = {
    async createJob(input: Record<string, unknown>) {
      const job = memoryJob(`job-${nextJobId++}`, {
        agentType: String(input.agentType),
        status: String(input.status),
        priority: String(input.priority),
        payload: input.payload as Record<string, unknown>,
        retryCount: Number(input.retryCount),
        maxRetries: Number(input.maxRetries),
        parentJobId: input.parentJobId ? String(input.parentJobId) : null,
        createdAt: new Date(currentMs),
      });
      jobs.push(job);
      return job;
    },
    async updateJob(id: string, update: Record<string, unknown>) {
      const job = jobs.find((candidate) => candidate.id === id);
      if (!job) return null;
      Object.assign(job, update);
      return job;
    },
    async claimPendingJob(id: string, startedAt: Date) {
      if (options.claimJobs === false) return null;
      const job = jobs.find((candidate) => candidate.id === id && candidate.status === 'pending');
      if (!job) return null;
      job.status = 'in_progress';
      job.startedAt = startedAt;
      return job;
    },
    async getPendingJobs() {
      pendingReads++;
      return jobs.filter((job) => job.status === 'pending');
    },
    async resetInProgressJobsToPending() {
      return 0;
    },
    async getFailedJobs(limit: number) {
      return jobs.filter((job) => job.status === 'failed').slice(0, limit);
    },
    async getRecentJobs(limit: number) {
      return jobs.slice(-limit).reverse();
    },
    async getJobs(filter: { agentType?: string; status?: string; limit?: number }) {
      return jobs
        .filter((job) => !filter.agentType || job.agentType === filter.agentType)
        .filter((job) => !filter.status || job.status === filter.status)
        .slice(0, filter.limit || 100);
    },
    async getJobCounts() {
      return {
        pending: jobs.filter((job) => job.status === 'pending').length,
        inProgress: jobs.filter((job) => job.status === 'in_progress').length,
        completed: jobs.filter((job) => job.status === 'completed').length,
        failed: jobs.filter((job) => job.status === 'failed').length,
      };
    },
    async logEvent(event: Record<string, unknown>) {
      const stored = {
        id: `event-${events.length + 1}`,
        timestamp: new Date(currentMs),
        ...event,
      };
      events.push(stored);
      return stored;
    },
    async getRecentEvents(limit: number) {
      return events.slice(-limit).reverse();
    },
  };

  const dependencies = {
    persistence,
    knowledge: {
      async initialize() {
        initializeCalls++;
        if (initializationFailures > 0) {
          initializationFailures--;
          throw new Error('initialization failed');
        }
      },
      async addLegalGlossary() {},
      async addSocialCopyGuide() {},
      async addDocument() {
        return {};
      },
    },
    evolution: {
      async initialize() {},
      async addProposal() {
        return {};
      },
      updateAgentStats(agentType: AgentType, values: Record<string, unknown>) {
        stats.push({ agentType, values });
      },
    },
    legalCouncil: {
      async evaluateArticle() {
        if (options.councilFailure) throw new Error('council unavailable');
        return {
          overallStatus: options.councilStatus || 'approved',
          riskFlag: 'low',
          consolidatedFeedback: 'Approved',
        };
      },
    },
    articles: {
      async findById(articleId: string) {
        return articles.get(articleId);
      },
      async updateCouncil(articleId: string, update: Record<string, unknown>) {
        articleUpdates.push({ articleId, update });
        const article = articles.get(articleId);
        if (article) Object.assign(article, update);
      },
    },
    parsePayload(_agentType: AgentType, payload: Record<string, unknown>) {
      if (options.parseFailure) return { success: false, error: 'invalid payload' };
      return { success: true, data: payload };
    },
    async persistCopySnapshot(input: Record<string, unknown>) {
      if (options.copyFailure) throw new Error('copy unavailable');
      copies.push(input);
      return { id: `copy-${copies.length}` };
    },
    clock: {
      now: () => new Date(currentMs),
      nowMs: () => currentMs,
      setInterval(callback: () => void | Promise<void>, intervalMs: number) {
        const record = { callback, intervalMs, cleared: false };
        intervals.push(record);
        return record as unknown as ReturnType<typeof setInterval>;
      },
      clearInterval(handle: ReturnType<typeof setInterval>) {
        (handle as unknown as { cleared: boolean }).cleared = true;
      },
      setTimeout(callback: () => void, delayMs: number) {
        const record = { callback, delayMs };
        timeouts.push(record);
        return record as unknown as ReturnType<typeof setTimeout>;
      },
    },
    logger: {
      log() {},
      error(...values: unknown[]) {
        errors.push(values);
      },
    },
  } as unknown as OrchestratorDependencies;

  return {
    runtime: new Runtime(dependencies) as OrchestratorRuntime,
    jobs,
    events,
    copies,
    articles,
    articleUpdates,
    timeouts,
    intervals,
    errors,
    stats,
    advance(ms: number) {
      currentMs += ms;
    },
    get initializeCalls() {
      return initializeCalls;
    },
    get pendingReads() {
      return pendingReads;
    },
  };
}

test('la inicialización concurrente se comparte y puede recuperarse de un fallo', async () => {
  const harness = await createHarness({ initializeFailures: 1 });
  const first = await Promise.allSettled([
    harness.runtime.queue.initialize(),
    harness.runtime.queue.initialize(),
  ]);
  assert.deepEqual(first.map((result) => result.status), ['rejected', 'rejected']);
  assert.equal(harness.initializeCalls, 1);
  assert.equal(harness.runtime.state.initialized, false);
  assert.equal(harness.runtime.state.initializationPromise, null);

  await harness.runtime.queue.initialize();
  await harness.runtime.queue.initialize();
  assert.equal(harness.initializeCalls, 2);
  assert.equal(harness.runtime.state.initialized, true);
});

test('la cola mantiene prioridad estable y no duplica trabajos sincronizados', async () => {
  const harness = await createHarness();
  harness.runtime.queue.registerAgent(fakeAgent('formatter', async () => ({ success: true })));
  await harness.runtime.queue.enqueueJob('formatter', { sequence: 'low' }, { priority: 'low' });
  await harness.runtime.queue.enqueueJob('formatter', { sequence: 'high-1' }, { priority: 'high' });
  await harness.runtime.queue.enqueueJob('formatter', { sequence: 'high-2' }, { priority: 'high' });
  await harness.runtime.queue.enqueueJob('formatter', { sequence: 'critical' }, { priority: 'critical' });

  assert.deepEqual(
    harness.runtime.state.jobQueue.map((job) => job.payload.sequence),
    ['critical', 'high-1', 'high-2', 'low'],
  );
  harness.jobs.push(memoryJob('external-job', { payload: { sequence: 'external' } }));
  assert.equal(await harness.runtime.queue.syncQueueWithDatabase(), 1);
  assert.equal(await harness.runtime.queue.syncQueueWithDatabase(), 0);
  assert.equal(
    harness.runtime.state.jobQueue.filter((job) => job.id === 'external-job').length,
    1,
  );
});

test('la ejecución manual reclama una vez, persiste el copy y limpia capacidad', async () => {
  const harness = await createHarness();
  let executions = 0;
  harness.runtime.queue.registerAgent(fakeAgent('formatter', async (_context, payload) => {
    executions++;
    return { success: true, data: { content: payload.content } };
  }));

  const result = await harness.runtime.execution.executeImmediately(
    'formatter',
    { content: 'Texto' },
    { actorId: 'admin-1', origin: 'manual' },
  );
  assert.equal(result.success, true);
  assert.equal(result.copyHistoryId, 'copy-1');
  assert.equal(executions, 1);
  assert.equal(harness.jobs[0].status, 'completed');
  assert.equal(harness.runtime.state.activeJobs.size, 0);
  assert.equal(harness.copies[0].actorId, 'admin-1');
  assert.equal(harness.copies[0].origin, 'manual');
  assert.deepEqual(
    harness.events.map((event) => event.message),
    ['Job enqueued for formatter', 'Manual job started', 'Manual job completed'],
  );
});

test('capacidad, reclamo fallido y error de historial no ocultan el contrato manual', async () => {
  const capacity = await createHarness();
  capacity.runtime.queue.registerAgent(fakeAgent('formatter', async () => ({ success: true })));
  capacity.runtime.state.activeJobs.set('active', {
    id: 'active',
    agentType: 'formatter',
  } as AgentJob);
  const blocked = await capacity.runtime.execution.executeImmediately('formatter', {});
  assert.match(blocked.error || '', /currently at capacity/);
  assert.equal(capacity.jobs.length, 0);

  const unclaimed = await createHarness({ claimJobs: false });
  let unclaimedExecutions = 0;
  unclaimed.runtime.queue.registerAgent(fakeAgent('formatter', async () => {
    unclaimedExecutions++;
    return { success: true };
  }));
  const claimResult = await unclaimed.runtime.execution.executeImmediately('formatter', {});
  assert.equal(claimResult.error, 'The agent job could not be claimed');
  assert.equal(unclaimedExecutions, 0);
  assert.equal(unclaimed.runtime.state.activeJobs.size, 0);

  const copyFailure = await createHarness({ copyFailure: true });
  copyFailure.runtime.queue.registerAgent(fakeAgent('formatter', async () => ({ success: true })));
  const successful = await copyFailure.runtime.execution.executeImmediately('formatter', {});
  assert.equal(successful.success, true);
  assert.equal(successful.copyHistoryId, undefined);
  assert.ok(copyFailure.errors.some((values) => String(values[0]).includes('copy history')));
});

test('registro, validación y capacidad global rechazan trabajo antes de ejecutarlo', async () => {
  const unregistered = await createHarness();
  await assert.rejects(
    unregistered.runtime.queue.enqueueJob('formatter', {}),
    /not registered/,
  );

  const disabled = await createHarness();
  disabled.runtime.queue.registerAgent(fakeAgent(
    'formatter',
    async () => ({ success: true }),
    { enabled: false },
  ));
  await assert.rejects(disabled.runtime.queue.enqueueJob('formatter', {}), /disabled/);

  const invalid = await createHarness({ parseFailure: true });
  invalid.runtime.queue.registerAgent(fakeAgent('formatter', async () => ({ success: true })));
  await assert.rejects(invalid.runtime.queue.enqueueJob('formatter', {}), /Invalid payload/);
  invalid.jobs.push(memoryJob('persisted-invalid'));
  invalid.runtime.state.jobQueue.push({
    id: 'persisted-invalid',
    agentType: 'formatter',
    status: 'pending',
    priority: 'normal',
    payload: {},
    retryCount: 0,
    maxRetries: 3,
    createdAt: new Date(),
  });
  const invalidJob = await invalid.runtime.processing.processNextJob();
  assert.equal(invalidJob?.status, 'failed');
  assert.match(invalidJob?.error || '', /Invalid persisted payload/);

  const globalCapacity = await createHarness();
  globalCapacity.runtime.queue.registerAgent(fakeAgent(
    'formatter',
    async () => ({ success: true }),
    { concurrency: 10 },
  ));
  for (let index = 0; index < 4; index++) {
    globalCapacity.runtime.state.activeJobs.set(`active-${index}`, {
      id: `active-${index}`,
      agentType: 'content_analyzer',
    } as AgentJob);
  }
  const atCapacity = await globalCapacity.runtime.execution.executeImmediately('formatter', {});
  assert.match(atCapacity.error || '', /currently at capacity/);
  assert.equal(globalCapacity.jobs.length, 0);
});

test('el pipeline conserva orden, payloads, progreso y revisión legal', async () => {
  const harness = await createHarness();
  harness.articles.set('article-1', {
    id: 'article-1',
    published: false,
    content: '<p>Draft</p>',
    contentEs: null,
  });
  const payloads: Array<{ agentType: AgentType; payload: Record<string, unknown> }> = [];
  for (const agentType of ['content_analyzer', 'formatter'] as AgentType[]) {
    harness.runtime.queue.registerAgent(fakeAgent(agentType, async (_context, payload) => {
      payloads.push({ agentType, payload });
      return { success: true, data: { ok: true } };
    }));
  }
  const progress: string[] = [];
  const result = await harness.runtime.pipeline.runPipeline(
    'article-1',
    ['content_analyzer', 'formatter'],
    {
      actorId: 'admin-1',
      onProgress(update) {
        progress.push(`${update.stage}:${update.status}:${update.index}/${update.total}`);
      },
    },
  );

  assert.equal(result.success, true);
  assert.deepEqual(payloads, [
    { agentType: 'content_analyzer', payload: { articleId: 'article-1' } },
    { agentType: 'formatter', payload: { articleId: 'article-1', applyChanges: true } },
  ]);
  assert.deepEqual(progress, [
    'content_analyzer:running:0/3',
    'content_analyzer:completed:0/3',
    'formatter:running:1/3',
    'formatter:completed:1/3',
    'legal_council:running:2/3',
    'legal_council:completed:2/3',
  ]);
  assert.equal(harness.copies.every((copy) => copy.origin === 'pipeline'), true);
  assert.equal(harness.articleUpdates[0].update.processingStatus, 'ready_for_approval');
});

test('el pipeline bloquea publicados, aborta etapas y conserva el fail-safe legal', async () => {
  const missing = await createHarness();
  const missingResult = await missing.runtime.pipeline.runPipeline('missing');
  assert.equal(missingResult.success, false);
  assert.equal(missingResult.results.formatter.error, 'Article not found');

  const published = await createHarness();
  published.articles.set('published', { id: 'published', published: true });
  const blocked = await published.runtime.pipeline.runPipeline('published');
  assert.equal(blocked.success, false);
  assert.match(blocked.results.formatter.error || '', /converted to a draft/);

  const failedStage = await createHarness();
  failedStage.articles.set('draft', { id: 'draft', published: false, content: 'Draft' });
  failedStage.runtime.queue.registerAgent(fakeAgent('formatter', async () => ({
    success: false,
    error: 'format failed',
  })));
  const stageResult = await failedStage.runtime.pipeline.runPipeline('draft', ['formatter']);
  assert.equal(stageResult.success, false);
  assert.equal(failedStage.articleUpdates.length, 0);

  const unavailable = await createHarness();
  unavailable.articles.set('draft', { id: 'draft', published: false, content: 'Draft' });
  const unavailableProgress: string[] = [];
  const unavailableResult = await unavailable.runtime.pipeline.runPipeline('draft', ['formatter'], {
    onProgress(update) {
      unavailableProgress.push(`${update.stage}:${update.status}`);
    },
  });
  assert.equal(unavailableResult.success, false);
  assert.deepEqual(unavailableProgress, ['formatter:error']);

  const throwing = await createHarness();
  throwing.articles.set('draft', { id: 'draft', published: false, content: 'Draft' });
  throwing.runtime.queue.registerAgent(fakeAgent('formatter', async () => {
    throw new Error('agent exploded');
  }));
  const throwingResult = await throwing.runtime.pipeline.runPipeline('draft', ['formatter']);
  assert.equal(throwingResult.success, false);
  assert.match(throwingResult.results.formatter.error || '', /agent exploded/);

  const council = await createHarness({ councilFailure: true });
  council.articles.set('draft', { id: 'draft', published: false, content: 'Draft' });
  council.runtime.queue.registerAgent(fakeAgent('formatter', async () => ({ success: true })));
  const councilProgress: string[] = [];
  const councilResult = await council.runtime.pipeline.runPipeline('draft', ['formatter'], {
    onProgress(update) {
      councilProgress.push(`${update.stage}:${update.status}`);
    },
  });
  assert.equal(councilResult.success, true);
  assert.equal(council.articleUpdates[0].update.processingStatus, 'ready_for_approval');
  assert.match(
    JSON.stringify(council.articleUpdates[0].update.councilVerdict),
    /Manual review required/,
  );
  assert.ok(councilProgress.includes('legal_council:error'));

  const rejected = await createHarness({ councilStatus: 'rejected' });
  rejected.articles.set('draft', { id: 'draft', published: false, content: 'Draft' });
  rejected.runtime.queue.registerAgent(fakeAgent('formatter', async () => ({ success: true })));
  const rejectedResult = await rejected.runtime.pipeline.runPipeline('draft', ['formatter']);
  assert.equal(rejectedResult.success, true);
  assert.equal((rejectedResult.results as Record<string, AgentResult>).legal_council.success, false);
  assert.equal(rejected.articleUpdates[0].update.processingStatus, 'failed');
});

test('la cola programada reintenta con backoff y stop impide reencolar', async () => {
  const harness = await createHarness();
  harness.runtime.queue.registerAgent(fakeAgent(
    'formatter',
    async () => ({ success: false, error: 'temporary' }),
    { backoffMs: 20_000, multiplier: 2 },
  ));
  await harness.runtime.queue.enqueueJob('formatter', {}, { maxRetries: 1 });
  harness.runtime.state.isRunning = true;
  const first = await harness.runtime.processing.processNextJob();
  assert.equal(first?.status, 'pending');
  assert.equal(first?.retryCount, 1);
  assert.equal(harness.timeouts[0].delayMs, 20_000);
  assert.equal(harness.runtime.state.jobQueue.length, 0);

  harness.runtime.processing.stopProcessing();
  harness.timeouts[0].callback();
  assert.equal(harness.runtime.state.jobQueue.length, 0);

  const capped = await createHarness();
  capped.runtime.queue.registerAgent(fakeAgent(
    'formatter',
    async () => ({ success: false, error: 'temporary' }),
    { backoffMs: 40_000, multiplier: 3 },
  ));
  await capped.runtime.queue.enqueueJob('formatter', {}, { maxRetries: 1 });
  capped.runtime.state.isRunning = true;
  await capped.runtime.processing.processNextJob();
  assert.equal(capped.timeouts[0].delayMs, 30_000);
  capped.timeouts[0].callback();
  assert.equal(capped.runtime.state.jobQueue.length, 1);
  await capped.runtime.processing.processNextJob();
  assert.equal(capped.jobs[0].status, 'failed');
  assert.equal(capped.stats.at(-1)?.values.failedJobs, 1);
});

test('el ciclo no se duplica y estado e historial usan conteos persistidos', async () => {
  const harness = await createHarness();
  harness.jobs.push(
    memoryJob('pending'),
    memoryJob('completed', { status: 'completed', completedAt: new Date() }),
  );
  harness.runtime.queue.registerAgent(fakeAgent('formatter', async () => ({ success: true })));
  harness.runtime.state.activeJobs.set('local-capacity-guard', {
    id: 'local-capacity-guard',
    agentType: 'formatter',
  } as AgentJob);
  harness.runtime.processing.startProcessing(250);
  harness.runtime.processing.startProcessing(100);
  assert.equal(harness.intervals.length, 1);
  assert.equal(harness.intervals[0].intervalMs, 250);
  harness.advance(30_000);
  await harness.intervals[0].callback();
  assert.ok(harness.pendingReads >= 1);

  const status = await harness.runtime.reporting.getStatus();
  assert.equal(status.isRunning, true);
  assert.equal(status.queueLength, 1);
  assert.equal(status.activeJobs, 0);
  assert.deepEqual(status.registeredAgents, ['formatter']);
  const history = await harness.runtime.reporting.getJobHistory({ status: 'completed' });
  assert.deepEqual(history.map((job) => job.id), ['completed']);

  harness.runtime.processing.stopProcessing();
  assert.equal(harness.intervals[0].cleared, true);
  assert.equal(harness.runtime.state.isRunning, false);
});
