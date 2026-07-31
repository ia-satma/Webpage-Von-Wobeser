import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  AGENT_CATEGORIES,
  AGENT_DEFINITIONS,
  ALL_AGENT_IDS,
  EXPECTED_AGENT_COUNTS,
  validateAgentInventory,
  type AgentId,
} from '../../shared/agentConstants';
import {
  categoryOutputSchema,
  formatterOutputSchema,
  parseAgentPayload,
  seoOptimizationSchema,
} from '../agents/core/contracts';

const ARTICLE_ID = '11111111-1111-4111-8111-111111111111';

test('canonical runtime inventory contains 14 unique executable agents', () => {
  assert.equal(AGENT_DEFINITIONS.length, 14);
  assert.equal(new Set(ALL_AGENT_IDS).size, 14);
  assert.equal(EXPECTED_AGENT_COUNTS[AGENT_CATEGORIES.BRAIN], 4);
  assert.equal(EXPECTED_AGENT_COUNTS[AGENT_CATEGORIES.HANDS], 8);
  assert.equal(EXPECTED_AGENT_COUNTS[AGENT_CATEGORIES.SHIELD], 2);
  assert.deepEqual(
    validateAgentInventory(AGENT_DEFINITIONS.map(({ id, category }) => ({ id, category }))),
    { valid: true, errors: [] },
  );
});

test('every runtime agent accepts its smallest valid payload', async (t) => {
  const payloads: Record<AgentId, unknown> = {
    formatter: { content: 'Contenido legal suficientemente largo para ser formateado sin tocar la base de datos.' },
    metadata_linker: { articleId: ARTICLE_ID },
    polyglot_translator: { articleId: ARTICLE_ID, targetLanguages: ['en'] },
    content_auditor: {},
    seo_optimizer: { articleId: ARTICLE_ID },
    content_analyzer: { articleId: ARTICLE_ID },
    image_suggestion: { articleId: ARTICLE_ID },
    category_agent: { articleId: ARTICLE_ID },
    website_auditor: {},
    social_media: { articleId: ARTICLE_ID },
    newsletter: {},
    legal_alerts: { sourceText: 'Fuente oficial simulada con contenido suficiente para elaborar un borrador legal.' },
    voice_agent: { text: 'Texto para audio', sourceType: 'newsletter' },
    presentation_generator: { topic: 'Panorama regulatorio mexicano' },
  };

  for (const id of ALL_AGENT_IDS) {
    await t.test(id, () => {
      const parsed = parseAgentPayload(id, payloads[id]);
      assert.equal(parsed.success, true, `${id} should accept its valid payload`);
    });
  }
});

test('agent contracts reject unsafe identifiers, sizes and options', () => {
  assert.equal(parseAgentPayload('metadata_linker', { articleId: 'not-a-uuid' }).success, false);
  assert.equal(parseAgentPayload('voice_agent', {
    text: 'texto',
    sourceType: 'newsletter',
    voiceId: 'unknown-voice',
  }).success, false);
  assert.equal(parseAgentPayload('presentation_generator', {
    topic: 'tema',
    slideCount: 21,
  }).success, false);
  assert.equal(parseAgentPayload('social_media', {
    articleId: ARTICLE_ID,
    platforms: ['linkedin', 'unknown'],
  }).success, false);
  assert.equal(parseAgentPayload('website_auditor', {
    skipModules: ['database'],
  }).success, false);
  assert.equal(parseAgentPayload('website_auditor', {
    runType: 'full',
    triggeredBy: 'scheduled',
  }).success, true);
  assert.equal(parseAgentPayload('legal_alerts', {
    sourceUrl: 'https://www.dof.gob.mx/nota_detalle.php?codigo=1',
    triggeredBy: 'scheduled',
    matchedPractice: 'Competencia',
  }).success, true);
  const presentationWithVersionedMedia = parseAgentPayload('presentation_generator', {
    topic: 'tema',
    customLogoUrl: '/uploads/logo-institucional.png?v=20260731',
    supportImages: ['/generated-images/portada.jpg?download=0'],
  });
  assert.equal(presentationWithVersionedMedia.success, true);
  if (presentationWithVersionedMedia.success) {
    assert.equal(presentationWithVersionedMedia.data.customLogoUrl, '/uploads/logo-institucional.png');
    assert.deepEqual(presentationWithVersionedMedia.data.supportImages, ['/generated-images/portada.jpg']);
  }
  assert.equal(parseAgentPayload('presentation_generator', {
    topic: 'tema',
    customLogoUrl: '/uploads/../private/secret.png',
  }).success, false);
  assert.equal(parseAgentPayload('presentation_generator', {
    topic: 'tema',
    supportImages: ['https://example.com/remote.png'],
  }).success, false);
});

test('LLM output contracts reject unexpected or oversized data', () => {
  assert.throws(() => formatterOutputSchema.parse({
    title: 'Título',
    content: '<p>Contenido</p>',
    excerpt: 'Extracto',
    debug: 'must not be accepted',
  }));
  assert.throws(() => seoOptimizationSchema.parse({
    seoScore: 120,
    keywords: [],
    keywordsEs: [],
    improvements: [],
  }));
  assert.throws(() => categoryOutputSchema.parse({
    primaryCategory: 'Corporativo',
    practiceAreas: [],
    industrySectors: [],
    tags: [],
    confidence: 1.5,
    reasoning: '',
  }));
});

test('missing runtime agents and conceptual services are rejected by inventory validation', () => {
  const withoutVoice = AGENT_DEFINITIONS
    .filter((agent) => agent.id !== 'voice_agent')
    .map(({ id, category }) => ({ id, category }));
  const missingResult = validateAgentInventory(withoutVoice);
  assert.equal(missingResult.valid, false);
  assert.ok(missingResult.errors.some((error) => error.includes('voice_agent')));

  const withInfrastructureService = [
    ...AGENT_DEFINITIONS.map(({ id, category }) => ({ id, category })),
    { id: 'orchestrator', category: 'brain' },
  ];
  const extraResult = validateAgentInventory(withInfrastructureService);
  assert.equal(extraResult.valid, false);
  assert.ok(extraResult.errors.some((error) => error.includes('Unknown agent: orchestrator')));
});

test('administrative article processing uses private content and the canonical orchestrator', () => {
  const root = process.cwd();
  const adminSource = fs.readFileSync(
    path.join(root, 'client/src/pages/admin/AdminArticleProcessing.tsx'),
    'utf8',
  );
  const routeSource = fs.readFileSync(path.join(root, 'server/routes.ts'), 'utf8');
  const orchestratorSource = fs.readFileSync(
    path.join(root, 'server/agents/core/AgentOrchestrator.ts'),
    'utf8',
  );

  assert.match(adminSource, /\/api\/admin\/news\?limit=100/);
  assert.doesNotMatch(adminSource, /queryKey:\s*\["\/api\/news"\]/);
  assert.ok(
    routeSource.indexOf('"/api/agents/pipeline/process-all"')
      < routeSource.indexOf('"/api/agents/pipeline/:articleId"'),
    'the exact batch route must be registered before the dynamic article route',
  );
  assert.match(orchestratorSource, /parseAgentPayload\(agentType, payload\)/);
  assert.match(routeSource, /orchestrator\.runPipeline\(articleId, stages,\s*\{/);
  assert.match(routeSource, /onProgress:\s*\(\{ stage, status, index, message \}\)/);
  assert.match(routeSource, /legal_council:\s*'council'/);
});

test('interactive AI calls have bounded waits and image generation fails fast without a direct key', () => {
  const root = process.cwd();
  const baseAgentSource = fs.readFileSync(
    path.join(root, 'server/agents/core/BaseAgent.ts'),
    'utf8',
  );
  const imageSource = fs.readFileSync(
    path.join(root, 'server/services/SmartImageGenerator.ts'),
    'utf8',
  );

  assert.match(baseAgentSource, /timeout:\s*60_000/);
  assert.match(baseAgentSource, /maxRetries:\s*0/);
  assert.match(imageSource, /if \(!hasDedicatedImageClient\(\)\)/);
  assert.match(imageSource, /errorCode:\s*'openai_image_key_missing'/);
  assert.match(imageSource, /callOpenAIImage\(prompt, 1, aspect\)/);
});

test('the admin agent center exposes all 14 canonical agents with safe quick-use defaults', () => {
  const root = process.cwd();
  const centerSource = fs.readFileSync(
    path.join(root, 'client/src/components/admin/AgentUseCenter.tsx'),
    'utf8',
  );
  const agentsPageSource = fs.readFileSync(
    path.join(root, 'client/src/pages/AdminAgents.tsx'),
    'utf8',
  );

  assert.match(centerSource, /AGENT_DEFINITIONS\.filter/);
  assert.match(centerSource, /Record<AgentId, AgentLauncherConfig>/);
  assert.match(centerSource, /\/api\/agents\/run\/\$\{selected\.id\}/);
  assert.match(centerSource, /applyChanges:\s*false/g);
  assert.match(centerSource, /Centro de uso de los 14 agentes/);
  assert.match(agentsPageSource, /defaultValue="use"/);
  assert.match(agentsPageSource, /<AgentUseCenter registeredAgents=/);
});
