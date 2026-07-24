import { z } from 'zod';
import { ALL_AGENT_IDS, type AgentId } from '@shared/agentConstants';

export const agentTypeSchema = z.enum(ALL_AGENT_IDS as [AgentId, ...AgentId[]]);
export const articleIdSchema = z.string().uuid();
export const languageSchema = z.enum(['en', 'es', 'de', 'zh', 'ko', 'ja', 'ar', 'ru', 'fr', 'it']);

const articleOnlySchema = z.object({ articleId: articleIdSchema }).strict();
const localMediaPathSchema = z.string().refine(
  (value) => value.startsWith('/uploads/') || value.startsWith('/generated-images/'),
  'Unsupported image path',
);

export const agentPayloadSchemas = {
  formatter: z.object({
    articleId: articleIdSchema.optional(),
    content: z.string().max(100_000).optional(),
    title: z.string().max(500).optional(),
    language: z.enum(['es', 'en']).optional(),
    applyChanges: z.boolean().default(false),
  }).strict().refine((value) => Boolean(value.articleId || value.content), {
    message: 'articleId or content is required',
  }),
  metadata_linker: articleOnlySchema.extend({
    applyChanges: z.boolean().default(false),
  }).strict(),
  polyglot_translator: articleOnlySchema.extend({
    targetLanguages: z.array(languageSchema).max(10).optional(),
    forceRetranslate: z.boolean().default(false),
    applyChanges: z.boolean().default(false),
  }).strict(),
  content_auditor: z.object({
    scanType: z.enum(['full', 'translations', 'metadata', 'formatting']).optional(),
  }).strict(),
  seo_optimizer: articleOnlySchema.extend({
    applyChanges: z.boolean().default(false),
  }).strict(),
  content_analyzer: articleOnlySchema,
  image_suggestion: articleOnlySchema.extend({
    applyChanges: z.boolean().default(false),
  }).strict(),
  category_agent: articleOnlySchema.extend({
    applyChanges: z.boolean().default(false),
  }).strict(),
  website_auditor: z.object({
    runType: z.enum(['full', 'delta', 'links_only', 'translations_only', 'seo_only', 'content_only']).default('full'),
    skipModules: z.array(z.enum(['links', 'navigation', 'translations', 'performance', 'seo', 'content'])).max(6).optional(),
    applyChanges: z.boolean().default(false),
    triggeredBy: z.enum(['manual', 'scheduled']).optional(),
  }).strict(),
  social_media: articleOnlySchema.extend({
    platforms: z.array(z.enum(['linkedin', 'twitter', 'instagram', 'facebook'])).max(4).optional(),
    aspect: z.enum(['1:1', '16:9', '9:16']).optional(),
    language: z.enum(['es', 'en']).default('es'),
  }).strict(),
  newsletter: z.object({
    limit: z.coerce.number().int().min(1).max(20).default(8),
    language: z.enum(['es', 'en']).default('es'),
  }).strict(),
  legal_alerts: z.object({
    sourceText: z.string().trim().min(40).max(50_000).optional(),
    sourceUrl: z.string().url().max(2_000).optional(),
    triggeredBy: z.enum(['manual', 'scheduled']).optional(),
    matchedPractice: z.string().trim().max(160).optional(),
  }).strict().refine((value) => Boolean(value.sourceText || value.sourceUrl), {
    message: 'sourceText or sourceUrl is required',
  }),
  voice_agent: z.object({
    text: z.string().trim().min(1).max(50_000),
    sourceType: z.enum(['newsletter', 'social_media', 'legal_alerts']),
    articleId: articleIdSchema.optional(),
    voiceId: z.enum(['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'onyx', 'nova', 'sage', 'shimmer', 'verse']).optional(),
  }).strict(),
  presentation_generator: z.object({
    topic: z.string().trim().max(10_000).optional(),
    documentsText: z.string().trim().max(80_000).optional(),
    slideCount: z.coerce.number().int().min(3).max(20).default(8),
    lang: z.enum(['es', 'en']).default('es'),
    template: z.enum(['vonwobeser', 'minimal', 'dark']).default('vonwobeser'),
    branding: z.enum(['vonwobeser', 'custom']).default('vonwobeser'),
    customLogoUrl: localMediaPathSchema.nullable().optional(),
    customPrimaryColor: z.string().regex(/^#[0-9a-f]{6}$/i).nullable().optional(),
    formats: z.array(z.enum(['pptx', 'pdf', 'png'])).min(1).max(3).optional(),
    sourceDocs: z.array(z.string().max(255)).max(20).optional(),
    visuals: z.boolean().optional(),
    illustrate: z.boolean().optional(),
    supportImages: z.array(localMediaPathSchema).max(30).optional(),
    webSearch: z.boolean().optional(),
  }).strict().refine((value) => Boolean(value.topic || value.documentsText), {
    message: 'topic or documentsText is required',
  }),
} satisfies Record<AgentId, z.ZodTypeAny>;

export function parseAgentPayload(
  agentType: AgentId,
  payload: unknown,
): { success: true; data: Record<string, unknown> } | { success: false; error: string } {
  const parsed = agentPayloadSchemas[agentType].safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((issue) => issue.message).join('; '),
    };
  }
  return { success: true, data: parsed.data as Record<string, unknown> };
}

const boundedString = z.string().max(100_000);
const shortString = z.string().max(500);

export const formatterOutputSchema = z.object({
  title: shortString,
  content: boundedString,
  excerpt: z.string().max(2_000),
}).strict();

export const metadataAnalysisSchema = z.object({
  practiceAreas: z.array(z.string().trim().max(160)).max(30).default([]),
  industries: z.array(z.string().trim().max(160)).max(30).default([]),
  authorPatterns: z.array(z.string().trim().min(3).max(160)).max(30).default([]),
}).strict();

export const seoOptimizationSchema = z.object({
  optimizedTitle: shortString.optional(),
  optimizedTitleEs: shortString.optional(),
  metaDescription: z.string().max(500).optional(),
  metaDescriptionEs: z.string().max(500).optional(),
  suggestedSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160).optional(),
  keywords: z.array(z.string().max(100)).max(20).default([]),
  keywordsEs: z.array(z.string().max(100)).max(20).default([]),
  seoScore: z.coerce.number().min(0).max(100),
  improvements: z.array(z.string().max(500)).max(30).default([]),
}).strict();

export const categoryOutputSchema = z.object({
  primaryCategory: z.string().trim().min(1).max(160),
  categorySlug: z.string().trim().max(160).optional(),
  practiceAreas: z.array(z.string().trim().max(160)).max(30).default([]),
  industrySectors: z.array(z.string().trim().max(160)).max(30).default([]),
  tags: z.array(z.string().trim().max(100)).max(30).default([]),
  confidence: z.coerce.number().min(0).max(1),
  reasoning: z.string().max(2_000).default(''),
}).strict();

export const contentAnalysisOutputSchema = z.object({
  seoRecommendations: z.object({
    keywords: z.array(z.string().max(100)).max(10).default([]),
    titleSuggestion: z.string().max(500).default(''),
    metaDescription: z.string().max(500).default(''),
    headingImprovements: z.array(z.string().max(500)).max(20).default([]),
    contentGaps: z.array(z.string().max(1_000)).max(20).default([]),
    internalLinkOpportunities: z.array(z.string().max(500)).max(20).default([]),
  }).strict(),
  categories: z.object({
    primary: z.string().max(160).default('Legal News'),
    secondary: z.array(z.string().max(160)).max(20).default([]),
  }).strict(),
  spellingGrammar: z.array(z.object({
    original: z.string().max(1_000),
    correction: z.string().max(1_000),
    type: z.enum(['spelling', 'grammar', 'terminology', 'style']),
    explanation: z.string().max(1_000),
  }).strict()).max(100).default([]),
  lawyersMentioned: z.array(z.object({
    name: z.string().max(160),
    role: z.string().max(300).default(''),
    context: z.string().max(1_000).default(''),
  }).strict()).max(50).default([]),
  legalBranches: z.object({
    primary: z.array(z.string().max(160)).max(20).default([]),
    secondary: z.array(z.string().max(160)).max(20).default([]),
  }).strict(),
  industries: z.object({
    primary: z.string().max(160).default('General'),
    secondary: z.array(z.string().max(160)).max(20).default([]),
  }).strict(),
  qualityScore: z.coerce.number().min(0).max(100),
}).strict();

export const imageAnalysisSchema = z.object({
  imagePrompt: z.string().trim().min(10).max(2_000),
  themes: z.array(z.string().max(100)).max(10).default([]),
  style: z.string().max(200).optional(),
}).strict();

export const socialOutputSchema = z.object({
  posts: z.record(z.object({
    text: z.string().trim().min(1).max(5_000),
    hashtags: z.array(z.string().max(100)).max(30).default([]),
  }).strict()),
  imagePrompt: z.string().max(2_000).optional(),
}).strict();

export const newsletterOutputSchema = z.object({
  subject: z.string().trim().min(1).max(200),
  preheader: z.string().max(300).default(''),
  html: z.string().trim().min(1).max(100_000),
}).strict();

export const legalAlertOutputSchema = z.object({
  titleEs: shortString,
  title: shortString,
  excerptEs: z.string().trim().min(20).max(2_000),
  excerpt: z.string().trim().min(20).max(2_000),
  contentEs: z.string().trim().min(80).max(100_000),
  content: z.string().trim().min(80).max(100_000),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160),
}).strict();
