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
  { voiceGenerator },
  { presentationGenerator },
  { smartImageGenerator },
  { db },
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
  import('../services/VoiceGenerator'),
  import('../services/PresentationGenerator'),
  import('../services/SmartImageGenerator'),
  import('../db'),
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

test('image agent completes an isolated generated-file flow without provider or database access', async () => {
  const selectMock = mock.method(
    db,
    'select',
    () => ({
      from: () => ({
        where: async () => [{
          id: '11111111-1111-4111-8111-111111111111',
          title: 'Competition update',
          titleEs: 'Actualización de competencia',
          content: 'A sufficiently detailed article body.',
          contentEs: 'Contenido suficientemente detallado para una noticia.',
          published: false,
        }],
      }),
    }) as never,
  );
  const llmMock = mock.method(
    imageSuggestionAgent as unknown as { callLLM: (...args: unknown[]) => Promise<string> },
    'callLLM',
    async () => JSON.stringify({
      imagePrompt: 'A realistic photojournalism scene of an antitrust hearing in Mexico City',
      themes: ['competition', 'regulation'],
      style: 'documentary photography',
    }),
  );
  const imageMock = mock.method(
    smartImageGenerator,
    'generateImage',
    async () => ({
      success: true,
      imageUrl: '/generated-images/isolated-image.png',
      engine: 'gptimage' as const,
      originalPrompt: 'isolated',
      promptWasSanitized: false,
      retryCount: 0,
      transparencyLog: ['simulated'],
    }),
  );

  try {
    const result = await imageSuggestionAgent.execute(
      context('image_suggestion'),
      {
        articleId: '11111111-1111-4111-8111-111111111111',
        applyChanges: false,
      },
    );
    assert.equal(result.success, true);
    assert.equal((result.data as { imageUrl: string }).imageUrl, '/generated-images/isolated-image.png');
    assert.equal(selectMock.mock.callCount(), 1);
    assert.equal(llmMock.mock.callCount(), 1);
    assert.equal(imageMock.mock.callCount(), 1);
  } finally {
    imageMock.mock.restore();
    llmMock.mock.restore();
    selectMock.mock.restore();
  }
});

test('voice agent covers success, timeout and persistence failure without consuming credits', async () => {
  const speechMock = mock.method(
    voiceGenerator,
    'generateSpeech',
    async () => ({
      success: true,
      audioUrl: '/generated-audio/isolated.mp3',
      engine: 'openai_tts' as const,
      sourceText: 'Texto aislado',
      cleanedText: 'Texto aislado',
      voiceId: 'alloy',
      retryCount: 0,
      transparencyLog: ['simulated'],
    }),
  );

  try {
    const result = await voiceAgent.execute(
      context('voice_agent'),
      { text: 'Texto aislado.', sourceType: 'newsletter', voiceId: 'alloy' },
    );
    assert.equal(result.success, true);
    assert.deepEqual((result.data as { audioUrls: string[] }).audioUrls, ['/generated-audio/isolated.mp3']);
    assert.equal(speechMock.mock.callCount(), 1);
  } finally {
    speechMock.mock.restore();
  }

  for (const failure of [
    { errorCode: 'timeout', errorMessage: 'Timeout del TTS de OpenAI' },
    { errorCode: 'save_failed', errorMessage: 'No fue posible guardar el audio' },
  ]) {
    const failureMock = mock.method(
      voiceGenerator,
      'generateSpeech',
      async () => ({
        success: false,
        engine: 'unavailable' as const,
        sourceText: 'Texto aislado',
        voiceId: 'alloy',
        retryCount: 1,
        transparencyLog: ['simulated'],
        ...failure,
      }),
    );
    try {
      const result = await voiceAgent.execute(
        context('voice_agent'),
        { text: 'Texto aislado.', sourceType: 'newsletter', voiceId: 'alloy' },
      );
      assert.equal(result.success, false);
      assert.equal((result.data as { errorCode: string }).errorCode, failure.errorCode);
      assert.match(result.error || '', new RegExp(failure.errorMessage));
    } finally {
      failureMock.mock.restore();
    }
  }
});

test('presentation agent validates render, preview and download metadata without providers or files', async () => {
  const llmMock = mock.method(
    presentationGeneratorAgent as unknown as { callLLM: (...args: unknown[]) => Promise<string> },
    'callLLM',
    async () => JSON.stringify({
      title: 'Panorama regulatorio',
      subtitle: 'Prueba aislada',
      slides: [
        { layout: 'bullets', title: 'Puntos clave', bullets: ['Uno', 'Dos'] },
        { layout: 'closing', title: 'Gracias', bullets: ['Von Wobeser y Sierra'] },
      ],
    }),
  );
  const renderMock = mock.method(
    presentationGenerator,
    'renderAndSave',
    async () => ({
      success: true,
      presentation: {
        id: 'isolated-presentation',
        title: 'Panorama regulatorio',
        slideCount: 3,
        pptxUrl: '/generated-presentations/isolated.pptx',
        pdfUrl: '/generated-presentations/isolated.pdf',
        pngUrls: [
          '/generated-presentations/isolated-cover.png',
          '/generated-presentations/isolated-slide-1.png',
        ],
      },
    }) as never,
  );

  try {
    const result = await presentationGeneratorAgent.execute(
      context('presentation_generator'),
      {
        topic: 'Panorama regulatorio',
        formats: ['pptx', 'pdf', 'png'],
        visuals: false,
      },
    );
    assert.equal(result.success, true);
    const presentation = (result.data as {
      presentation: { pptxUrl: string; pdfUrl: string; pngUrls: string[] };
    }).presentation;
    assert.match(presentation.pptxUrl, /\.pptx$/);
    assert.match(presentation.pdfUrl, /\.pdf$/);
    assert.equal(presentation.pngUrls.length, 2);
    assert.equal(llmMock.mock.callCount(), 1);
    assert.equal(renderMock.mock.callCount(), 1);
  } finally {
    renderMock.mock.restore();
    llmMock.mock.restore();
  }

  const fallbackLlmMock = mock.method(
    presentationGeneratorAgent as unknown as { callLLM: (...args: unknown[]) => Promise<string> },
    'callLLM',
    async () => {
      throw new Error('simulated timeout');
    },
  );
  const failedRenderMock = mock.method(
    presentationGenerator,
    'renderAndSave',
    async () => ({ success: false, error: 'simulated persistence failure' }) as never,
  );
  try {
    const failed = await presentationGeneratorAgent.execute(
      context('presentation_generator'),
      { topic: 'Prueba de error', visuals: false },
    );
    assert.equal(failed.success, false);
    assert.match(failed.error || '', /simulated persistence failure/);
    assert.equal(fallbackLlmMock.mock.callCount(), 1);
    assert.equal(failedRenderMock.mock.callCount(), 1);
  } finally {
    failedRenderMock.mock.restore();
    fallbackLlmMock.mock.restore();
  }
});
