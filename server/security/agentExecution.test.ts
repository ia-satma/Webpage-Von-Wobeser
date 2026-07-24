import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import type { AgentResult, AgentType, ExecutionContext } from '../agents/core/types';

// Los módulos de agentes construyen el cliente Drizzle al importarse. Se proporciona una
// URL deliberadamente no enrutable para poder instanciarlos sin depender de Secrets; ningún
// escenario de este archivo debe intentar abrir la conexión.
process.env.DATABASE_URL ||= 'postgresql://isolated:isolated@127.0.0.1:1/isolated';

const [
  { formatterAgent },
  { metadataLinkerAgent },
  { polyglotTranslatorAgent },
  { seoOptimizerAgent },
  { contentAnalyzerAgent },
  { imageSuggestionAgent },
  { categoryAgent },
  { socialMediaAgent },
  { legalAlertsAgent },
  { voiceAgent },
  { presentationGeneratorAgent },
  { NewsletterAgent },
  { ContentAuditorAgent },
  { WebsiteAuditorAgent },
  { storage },
] = await Promise.all([
  import('../agents/specialized/FormatterAgent'),
  import('../agents/specialized/MetadataLinkerAgent'),
  import('../agents/specialized/PolyglotTranslatorAgent'),
  import('../agents/specialized/SEOOptimizerAgent'),
  import('../agents/specialized/ContentAnalyzerAgent'),
  import('../agents/specialized/ImageSuggestionAgent'),
  import('../agents/specialized/CategoryAgent'),
  import('../agents/specialized/SocialMediaAgent'),
  import('../agents/specialized/LegalAlertsAgent'),
  import('../agents/specialized/VoiceAgent'),
  import('../agents/specialized/PresentationGeneratorAgent'),
  import('../agents/specialized/NewsletterAgent'),
  import('../agents/specialized/ContentAuditorAgent'),
  import('../agents/specialized/WebsiteAuditorAgent'),
  import('../storage'),
]);

interface ExecutableAgent {
  execute(context: ExecutionContext, payload: Record<string, unknown>): Promise<AgentResult>;
}

function context(agentType: AgentType): ExecutionContext {
  return {
    jobId: `isolated-${agentType}`,
    agentType,
    startTime: new Date(),
    metadata: { testMode: 'isolated' },
  };
}

const guardedAgents: Array<{
  id: AgentType;
  agent: ExecutableAgent;
  payload: Record<string, unknown>;
  expectedError: RegExp;
}> = [
  {
    id: 'formatter',
    agent: formatterAgent,
    payload: {},
    expectedError: /articleId or content is required/i,
  },
  {
    id: 'metadata_linker',
    agent: metadataLinkerAgent,
    payload: {},
    expectedError: /articleId is required/i,
  },
  {
    id: 'polyglot_translator',
    agent: polyglotTranslatorAgent,
    payload: {},
    expectedError: /articleId is required/i,
  },
  {
    id: 'seo_optimizer',
    agent: seoOptimizerAgent,
    payload: {},
    expectedError: /articleId is required/i,
  },
  {
    id: 'content_analyzer',
    agent: contentAnalyzerAgent,
    payload: {},
    expectedError: /articleId is required/i,
  },
  {
    id: 'image_suggestion',
    agent: imageSuggestionAgent,
    payload: {},
    expectedError: /articleId is required/i,
  },
  {
    id: 'category_agent',
    agent: categoryAgent,
    payload: {},
    expectedError: /articleId is required/i,
  },
  {
    id: 'social_media',
    agent: socialMediaAgent,
    payload: {},
    expectedError: /articleId es requerido/i,
  },
  {
    id: 'legal_alerts',
    agent: legalAlertsAgent,
    payload: { sourceText: 'texto corto' },
    expectedError: /Proporciona el texto de la fuente/i,
  },
  {
    id: 'voice_agent',
    agent: voiceAgent,
    payload: { sourceType: 'newsletter' },
    expectedError: /text es requerido/i,
  },
  {
    id: 'presentation_generator',
    agent: presentationGeneratorAgent,
    payload: {},
    expectedError: /Escribe un tema o sube/i,
  },
];

test('each guarded agent rejects incomplete work before DB, files or external AI', async (t) => {
  for (const scenario of guardedAgents) {
    await t.test(scenario.id, async () => {
      const result = await scenario.agent.execute(context(scenario.id), scenario.payload);
      assert.equal(result.success, false);
      assert.match(result.error || '', scenario.expectedError);
    });
  }
});

test('newsletter executes against an isolated empty-news adapter', async () => {
  const getNewsMock = mock.method(
    storage,
    'getRecentPublishedNews',
    async () => [],
  );

  try {
    const result = await new NewsletterAgent().execute(
      context('newsletter'),
      { limit: 8, language: 'es' },
    );

    assert.equal(result.success, false);
    assert.match(result.error || '', /No hay noticias recientes/i);
    assert.equal(getNewsMock.mock.callCount(), 1);
  } finally {
    getNewsMock.mock.restore();
  }
});

test('content auditor completes a dry run using only injected in-memory data', async () => {
  const agent = new ContentAuditorAgent({
    loadArticles: async () => [],
    loadTranslationCache: async () => [],
    loadAuthorLinks: async () => [],
    loadActiveLanguages: async () => new Set(['es', 'en']),
  });

  const result = await agent.execute(context('content_auditor'), { scanType: 'full' });

  assert.equal(result.success, true);
  assert.deepEqual(result.data, {
    gaps: [],
    totalGaps: 0,
    stats: {
      articlesScanned: 0,
      translationGaps: 0,
      authorGaps: 0,
      formattingIssues: 0,
      contentIssues: 0,
    },
    tasksSuggested: [],
  });
});

test('website auditor completes an isolated no-module dry run without persistence', async () => {
  const createAuditMock = mock.method(
    storage,
    'createWebsiteAudit',
    async () => ({ id: 'isolated-website-audit' } as never),
  );
  const updateAuditMock = mock.method(
    storage,
    'updateWebsiteAudit',
    async () => ({ id: 'isolated-website-audit' } as never),
  );

  try {
    const result = await new WebsiteAuditorAgent().execute(
      context('website_auditor'),
      {
        runType: 'full',
        skipModules: ['translations', 'content', 'seo', 'links'],
        applyChanges: false,
        triggeredBy: 'isolated-test',
      },
    );

    assert.equal(result.success, true);
    const data = result.data as {
      auditId: string;
      findings: number;
      severityCounts: Record<string, number>;
      metrics: Record<string, number>;
    };
    assert.equal(data.auditId, 'isolated-website-audit');
    assert.equal(data.findings, 0);
    assert.deepEqual(data.severityCounts, { critical: 0, high: 0, medium: 0, low: 0 });
    assert.equal(data.metrics.pagesScanned, 0);
    assert.equal(data.metrics.linksChecked, 0);
    assert.equal(data.metrics.translationsChecked, 0);
    assert.equal(data.metrics.contentItemsChecked, 0);
    assert.equal(typeof data.metrics.startTime, 'number');
    assert.equal(typeof data.metrics.endTime, 'number');
    assert.equal(typeof data.metrics.executionTimeMs, 'number');
    assert.equal(createAuditMock.mock.callCount(), 1);
    assert.equal(updateAuditMock.mock.callCount(), 1);
  } finally {
    createAuditMock.mock.restore();
    updateAuditMock.mock.restore();
  }
});
