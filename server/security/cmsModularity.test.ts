import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  AGENT_TYPES,
  KNOWLEDGE_CATEGORIES,
  LANGUAGE_OPTIONS,
} from "../../client/src/features/admin/knowledge/catalogs";
import {
  bulkUploadSchema,
  knowledgeFormSchema,
} from "../../client/src/features/admin/knowledge/contracts";
import {
  buildBulkKnowledgeItems,
  filterKnowledgeDocuments,
} from "../../client/src/features/admin/knowledge/helpers";
import { translations as knowledgeTranslations } from "../../client/src/features/admin/knowledge/translations";
import {
  eventSchema,
  eventTypeOptions,
} from "../../client/src/features/admin/events/contracts";
import {
  countUpcomingEvents,
  eventFormToPayload,
  eventToFormData,
  filterAndSortEvents,
} from "../../client/src/features/admin/events/helpers";
import { eventTranslations } from "../../client/src/features/admin/events/translations";
import {
  createTeamMemberDefaults,
  teamMemberFormSchema,
} from "../../client/src/features/admin/team-form/contracts";
import {
  calculateProfileProgress,
  generateTeamMemberSlug,
  getTeamMemberInitials,
  teamFormToPayload,
  teamMemberToFormData,
} from "../../client/src/features/admin/team-form/helpers";
import { teamFormTranslations } from "../../client/src/features/admin/team-form/translations";
import { AUDIT_RUN_TYPES } from "../../client/src/features/admin/audits/contracts";
import {
  filterAuditFindings,
  selectAuditFindings,
} from "../../client/src/features/admin/audits/helpers";
import { auditTranslations } from "../../client/src/features/admin/audits/translations";
import { createPracticeGroupSchema } from "../../client/src/features/admin/practice-groups/contracts";
import { practiceGroupTranslations } from "../../client/src/features/admin/practice-groups/translations";
import { industryGroupSchema } from "../../client/src/features/admin/industry-groups/contracts";
import { industryGroupTranslations } from "../../client/src/features/admin/industry-groups/translations";
import {
  FIRM_TAB_LABELS,
  HOME_TAB_LABELS,
  PAGES,
} from "../../client/src/features/admin/site-config/registry";
import {
  buildConfigChanges,
  configMapToDraft,
  resolveSiteConfigSection,
  shouldOptimizeHeroVideo,
  visibleCarouselItems,
} from "../../client/src/features/admin/site-config/helpers";
import {
  isPublicTextField,
  typographyRoleFor,
} from "../../client/src/features/admin/site-config/typography";
import {
  ARTICLE_PROCESSING_QUERY_KEYS,
  BATCH_CONCURRENCY_LIMIT,
  BATCH_DELAY_MS,
} from "../../client/src/features/admin/article-processing/constants";
import {
  buildBatchCompletionDescription,
  chunkArticles,
  countArticlesWithTranslations,
  createBatchProgress,
  formatArticleDate,
  normalizePipelineException,
  pipelineImageWarning,
  pipelinePayloadFailure,
  resolveSettledPipelineResult,
  selectProcessingDrafts,
} from "../../client/src/features/admin/article-processing/helpers";
import {
  articleProcessingTranslations,
  processingDraftText,
  selectArticleProcessingCopy,
  selectProcessingDraftCopy,
} from "../../client/src/features/admin/article-processing/translations";
import {
  CONTENT_TYPES,
  SUPPORTED_LANGUAGES,
  TRANSLATION_QUERY_KEYS,
} from "../../client/src/features/admin/translations/constants";
import {
  buildLanguageCoverage,
  buildOverallStats,
  canTranslateArticle,
  filterTranslationArticles,
  getCoverageColor,
  getProgressColor,
  requireAppliedTranslation,
  resolveSavedLanguages,
  toggleActiveLanguage,
} from "../../client/src/features/admin/translations/helpers";
import {
  selectTranslationCopy,
  translations as translationDashboardTranslations,
} from "../../client/src/features/admin/translations/translations";
import type {
  CMSStats,
  TranslationCounts,
} from "../../client/src/features/admin/translations/contracts";
import {
  capabilityGroupToFormData,
  generateCapabilitySlug,
  sortCapabilityGroups,
  toCapabilityCopy,
} from "../../client/src/features/admin/capability-groups/helpers";
import type { CapabilityGroup } from "../../client/src/features/admin/capability-groups/contracts";
import type { Event } from "../../shared/schema";
import type { News } from "../../shared/schema";
import type { TeamMember } from "../../shared/schema";
import type { WebsiteAuditFinding } from "../../shared/schema";
import { readAdminFeatureSources } from "./adminFeatureTestSources";

test("Conocimiento conserva contratos, inventarios y superficie administrativa", () => {
  const source = readAdminFeatureSources("knowledge", "AdminKnowledge.tsx");
  assert.equal((source.match(/adminApiRequest\(/g) || []).length, 5);
  assert.match(source, /adminApiRequest\("GET", "\/api\/admin\/knowledge"\)/);
  assert.match(source, /adminApiRequest\("POST", "\/api\/admin\/knowledge",/);
  assert.match(source, /adminApiRequest\("PUT", `\/api\/admin\/knowledge\/\$\{id\}`,/);
  assert.match(source, /adminApiRequest\("DELETE", `\/api\/admin\/knowledge\/\$\{id\}`\)/);
  assert.match(source, /adminApiRequest\("POST", "\/api\/admin\/knowledge\/bulk",/);
  assert.deepEqual(knowledgeFormSchema.keyof().options, [
    "category", "title", "content", "agentType", "language", "confidence",
    "dataClassification", "aiUseConfirmed",
  ]);
  assert.deepEqual(bulkUploadSchema.keyof().options, [
    "category", "agentType", "data", "dataClassification", "aiUseConfirmed",
  ]);
  assert.equal(KNOWLEDGE_CATEGORIES.length, 5);
  assert.equal(AGENT_TYPES.length, 14);
  assert.equal(LANGUAGE_OPTIONS.length, 10);
  assert.deepEqual(Object.keys(knowledgeTranslations), [
    "en", "es", "de", "zh", "ko", "ja", "ar", "ru", "fr", "it",
  ]);
  const englishKeys = Object.keys(knowledgeTranslations.en);
  for (const translation of Object.values(knowledgeTranslations)) {
    assert.deepEqual(Object.keys(translation), englishKeys);
  }
  assert.equal((source.match(/data-testid=/g) || []).length, 36);
});

test("Conocimiento conserva filtros y sintaxis de carga masiva clave|valor", () => {
  const documents = [
    {
      id: "one",
      category: "legal_glossary",
      title: "Due diligence",
      content: "Legal review",
      agentType: "polyglot_translator",
      metadata: { language: "en" },
      usageCount: 1,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
    {
      id: "two",
      category: "workflow",
      title: "Publication",
      content: "Editorial process",
      agentType: "formatter",
      metadata: {},
      usageCount: 0,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
  ];
  assert.deepEqual(
    filterKnowledgeDocuments(documents, {
      searchQuery: "legal",
      category: "all",
      agent: "polyglot_translator",
      activeTab: "legal_glossary",
    }).map((document) => document.id),
    ["one"],
  );
  assert.deepEqual(
    buildBulkKnowledgeItems({
      category: "legal_glossary",
      agentType: "polyglot_translator",
      data: "due_diligence|Debida diligencia\nmerger|Fusión|corporativa\nsolo_clave",
      dataClassification: "internal",
      aiUseConfirmed: true,
    }),
    [
      {
        category: "legal_glossary",
        agentType: "polyglot_translator",
        title: "due_diligence",
        content: "Debida diligencia",
        metadata: {},
        dataClassification: "internal",
        aiUseConfirmed: true,
      },
      {
        category: "legal_glossary",
        agentType: "polyglot_translator",
        title: "merger",
        content: "Fusión|corporativa",
        metadata: {},
        dataClassification: "internal",
        aiUseConfirmed: true,
      },
      {
        category: "legal_glossary",
        agentType: "polyglot_translator",
        title: "solo_clave",
        content: "solo_clave",
        metadata: {},
        dataClassification: "internal",
        aiUseConfirmed: true,
      },
    ],
  );
});

test("los módulos de Conocimiento respetan los límites de arquitectura", () => {
  const root = process.cwd();
  const adapter = fs.readFileSync(
    path.join(root, "client/src/pages/admin/AdminKnowledge.tsx"),
    "utf8",
  );
  assert.ok(adapter.split("\n").length <= 10);
  const directory = path.join(root, "client/src/features/admin/knowledge");
  for (const name of fs.readdirSync(directory)) {
    if (!name.endsWith(".ts") && !name.endsWith(".tsx")) continue;
    if (name === "translations.ts") continue;
    const lines = fs.readFileSync(path.join(directory, name), "utf8").split("\n").length;
    const limit = name === "AdminKnowledgePage.tsx" ? 250 : 350;
    assert.ok(lines <= limit, `${name} grew to ${lines} lines (limit ${limit})`);
  }
});

test("Eventos conserva contratos, superficie administrativa y traducciones", () => {
  const source = readAdminFeatureSources("events", "AdminEvents.tsx");
  assert.equal((source.match(/adminApiRequest\(/g) || []).length, 4);
  assert.match(source, /adminApiRequest\("GET", "\/api\/admin\/events"\)/);
  assert.match(source, /adminApiRequest\("POST", "\/api\/admin\/events", payload\)/);
  assert.match(source, /adminApiRequest\("PUT", `\/api\/admin\/events\/\$\{editingEvent\.id\}`, payload\)/);
  assert.match(source, /adminApiRequest\("DELETE", `\/api\/admin\/events\/\$\{id\}`\)/);
  assert.deepEqual(eventSchema.keyof().options, [
    "title",
    "titleEs",
    "eventType",
    "date",
    "endDate",
    "location",
    "locationEs",
    "description",
    "descriptionEs",
    "externalUrl",
    "isHighlight",
    "published",
  ]);
  assert.deepEqual(eventTypeOptions.map((option) => option.value), [
    "seminar",
    "conference",
    "webinar",
    "workshop",
  ]);
  assert.deepEqual(Object.keys(eventTranslations), [
    "en", "es", "de", "zh", "ko", "ja", "ar", "ru", "fr", "it",
  ]);
  const englishKeys = Object.keys(eventTranslations.en);
  for (const translation of Object.values(eventTranslations)) {
    assert.deepEqual(Object.keys(translation), englishKeys);
  }
  assert.equal((source.match(/data-testid=/g) || []).length, 32);
});

test("Eventos conserva normalización formulario-API, nulos y filtros de fecha", () => {
  const event = {
    id: "event-one",
    title: "Conference",
    titleEs: "Conferencia",
    eventType: "conference",
    date: "2026-09-20T10:00:00.000Z",
    endDate: null,
    location: null,
    locationEs: null,
    description: "<p>English</p>",
    descriptionEs: "<p>Español</p>",
    externalUrl: null,
    isHighlight: null,
    published: null,
  } as unknown as Event;
  const formData = eventToFormData(event);
  assert.equal(formData.date.toISOString(), "2026-09-20T10:00:00.000Z");
  assert.equal(formData.endDate, null);
  assert.equal(formData.location, "");
  assert.equal(formData.published, true);
  assert.deepEqual(eventFormToPayload(formData), {
    ...formData,
    date: "2026-09-20T10:00:00.000Z",
    endDate: null,
    externalUrl: null,
    location: null,
    locationEs: null,
  });

  const later = {
    ...event,
    id: "event-two",
    eventType: "webinar",
    date: "2026-10-20T10:00:00.000Z",
  } as unknown as Event;
  assert.deepEqual(
    filterAndSortEvents([event, later], {
      type: "all",
      startDate: new Date("2026-09-01T00:00:00.000Z"),
      endDate: new Date("2026-10-31T23:59:59.999Z"),
    }).map((item) => item.id),
    ["event-two", "event-one"],
  );
  assert.deepEqual(
    filterAndSortEvents([event, later], { type: "conference" }).map((item) => item.id),
    ["event-one"],
  );
  assert.equal(countUpcomingEvents([event, later], new Date("2026-10-01T00:00:00.000Z")), 1);
});

test("los módulos de Eventos respetan los límites de arquitectura", () => {
  const root = process.cwd();
  const adapter = fs.readFileSync(
    path.join(root, "client/src/pages/admin/AdminEvents.tsx"),
    "utf8",
  );
  assert.ok(adapter.split("\n").length <= 10);
  const directory = path.join(root, "client/src/features/admin/events");
  for (const name of fs.readdirSync(directory)) {
    if (!name.endsWith(".ts") && !name.endsWith(".tsx")) continue;
    if (name === "translations.ts") continue;
    const lines = fs.readFileSync(path.join(directory, name), "utf8").split("\n").length;
    const limit = name === "AdminEventsPage.tsx" ? 250 : 350;
    assert.ok(lines <= limit, `${name} grew to ${lines} lines (limit ${limit})`);
  }
});

test("Formulario de Abogados conserva contratos, relaciones y superficie administrativa", () => {
  const source = readAdminFeatureSources("team-form", "AdminTeamForm.tsx");
  assert.equal((source.match(/adminApiRequest\(/g) || []).length, 3);
  assert.match(source, /adminApiRequest\("GET", `\/api\/admin\/team\/\$\{params\.id\}`\)/);
  assert.match(source, /adminApiRequest\("POST", "\/api\/admin\/team", data\)/);
  assert.match(source, /adminApiRequest\("PUT", `\/api\/admin\/team\/\$\{params\.id\}`, data\)/);
  assert.match(source, /queryKey: \["\/api\/practice-groups"\]/);
  assert.match(source, /queryKey: \["\/api\/industry-groups"\]/);
  assert.deepEqual(teamMemberFormSchema.keyof().options, [
    "name",
    "slug",
    "title",
    "titleEs",
    "role",
    "roleEs",
    "email",
    "phone",
    "linkedinUrl",
    "imageUrl",
    "bio",
    "bioEs",
    "bioIntro",
    "bioIntroEs",
    "education",
    "affiliations",
    "rankings",
    "publications",
    "languages",
    "languagesEs",
    "isPartner",
    "published",
    "order",
    "practiceGroupIds",
    "industryGroupIds",
  ]);
  assert.deepEqual(Object.keys(teamFormTranslations), ["en", "es"]);
  for (const role of ["Socia", "Asociada", "Asociada Senior"]) {
    assert.match(source, new RegExp(`<SelectItem value="${role}">`));
  }
  assert.equal((source.match(/<TabsTrigger/g) || []).length, 5);
  assert.equal((source.match(/data-testid=/g) || []).length, 19);
  for (const field of ["bioIntro", "bioIntroEs", "bio", "bioEs"]) {
    assert.match(source, new RegExp(`field="${field}"`));
  }
});

test("Formulario de Abogados conserva normalización, slug y vista previa", () => {
  const defaults = createTeamMemberDefaults();
  const payload = teamFormToPayload({
    ...defaults,
    name: "Ana María Núñez",
    slug: "ana-maria-nunez",
    title: "Partner",
    titleEs: "Partner",
    role: "Partner",
    roleEs: "Partner",
  });
  assert.equal(payload.titleEs, "Socio");
  assert.equal(payload.roleEs, "Socio");

  const femininePayload = teamFormToPayload({
    ...defaults,
    name: "Ana María Núñez",
    slug: "ana-maria-nunez",
    title: "Associate",
    titleEs: "Asociada",
    role: "Associate",
    roleEs: "Asociada",
  });
  assert.equal(femininePayload.titleEs, "Asociada");
  assert.equal(femininePayload.roleEs, "Asociada");

  assert.equal(payload.email, null);
  assert.equal(generateTeamMemberSlug("Ana María Núñez"), "ana-maria-nunez");
  assert.equal(getTeamMemberInitials("Ana María Núñez"), "AM");
  assert.equal(calculateProfileProgress(defaults), 0);
  assert.equal(calculateProfileProgress({
    ...defaults,
    name: "Ana",
    title: "Partner",
    titleEs: "Socia",
    role: "Partner",
    roleEs: "Socia",
    email: "ana@example.com",
    imageUrl: "/ana.webp",
    bio: "Bio",
    bioEs: "Biografía",
  }), 100);

  const member = {
    ...defaults,
    id: "member-one",
    published: false,
    bioIntro: "Intro",
    bioIntroEs: "Introducción",
    languagesEs: ["Español"],
    practiceGroupIds: ["practice-one"],
    industryGroupIds: ["industry-one"],
  } as unknown as TeamMember;
  const mapped = teamMemberToFormData(member);
  assert.equal(mapped.published, false);
  assert.equal(mapped.bioIntroEs, "Introducción");
  assert.deepEqual(mapped.practiceGroupIds, ["practice-one"]);
  assert.deepEqual(mapped.industryGroupIds, ["industry-one"]);
});

test("los módulos del Formulario de Abogados respetan los límites de arquitectura", () => {
  const root = process.cwd();
  const adapter = fs.readFileSync(
    path.join(root, "client/src/pages/admin/AdminTeamForm.tsx"),
    "utf8",
  );
  assert.ok(adapter.split("\n").length <= 10);
  const directory = path.join(root, "client/src/features/admin/team-form");
  for (const name of fs.readdirSync(directory)) {
    if (!name.endsWith(".ts") && !name.endsWith(".tsx")) continue;
    if (name === "translations.ts") continue;
    const lines = fs.readFileSync(path.join(directory, name), "utf8").split("\n").length;
    const limit = name === "AdminTeamFormPage.tsx" ? 250 : 350;
    assert.ok(lines <= limit, `${name} grew to ${lines} lines (limit ${limit})`);
  }
});

test("Auditorías conserva contratos, endpoints, idiomas y acciones", () => {
  const source = readAdminFeatureSources("audits", "AdminAudits.tsx");
  assert.equal((source.match(/adminApiRequest\(/g) || []).length, 8);
  for (const contract of [
    /adminApiRequest\("GET", "\/api\/audits\?limit=20"\)/,
    /\/api\/audits\/latest\?includeFindings=false/,
    /\/api\/audits\/\$\{selectedAuditId\}\?includeFindings=false/,
    /\/api\/audits\/\$\{activeAuditId\}\/findings\?\$\{params\.toString\(\)\}/,
    /\/api\/audits\/findings\/open\?page=\$\{openPage\}&limit=\$\{FINDINGS_PAGE_SIZE\}/,
    /adminApiRequest\("POST", "\/api\/audits\/run", \{ runType \}\)/,
    /status: "resolved"/,
    /status: "ignored"/,
  ]) {
    assert.match(source, contract);
  }
  assert.deepEqual(AUDIT_RUN_TYPES, [
    "full",
    "links_only",
    "translations_only",
    "seo_only",
    "content_only",
    "linguistic",
  ]);
  assert.deepEqual(Object.keys(auditTranslations), [
    "en", "es", "de", "zh", "ko", "ja", "ar", "ru", "fr", "it",
  ]);
  const englishKeys = Object.keys(auditTranslations.en);
  for (const translation of Object.values(auditTranslations)) {
    assert.deepEqual(Object.keys(translation), englishKeys);
  }
  for (const testId of [
    "admin-audits-page",
    "select-audit-type",
    "button-run-audit",
    "text-critical-count",
    "text-high-count",
    "text-medium-count",
    "text-low-count",
    "tab-findings",
    "tab-history",
    "tab-open",
    "select-severity-filter",
    "select-category-filter",
    "row-finding-",
    "button-resolve-",
    "row-audit-",
    "button-view-",
    "row-open-",
    "button-resolve-open-",
  ]) {
    assert.match(source, new RegExp(testId));
  }
  assert.match(source, /setTimeout\(\(\) => \{/);
  assert.match(source, /export\.csv/);
});

test("Auditorías conserva filtrado puro y selección histórica", () => {
  const findings = [
    {
      id: "critical-link",
      severity: "critical",
      category: "links",
    },
    {
      id: "medium-content",
      severity: "medium",
      category: "content",
    },
  ] as unknown as WebsiteAuditFinding[];
  assert.deepEqual(
    filterAuditFindings(findings, { severity: "critical", category: "all" }).map(
      (finding) => finding.id,
    ),
    ["critical-link"],
  );
  assert.deepEqual(
    filterAuditFindings(findings, { severity: "all", category: "content" }).map(
      (finding) => finding.id,
    ),
    ["medium-content"],
  );
  assert.deepEqual(selectAuditFindings(null, [], findings), findings);
  assert.deepEqual(selectAuditFindings("historic", [findings[0]], findings), [findings[0]]);
});

test("los módulos de Auditorías respetan los límites de arquitectura", () => {
  const root = process.cwd();
  const adapter = fs.readFileSync(
    path.join(root, "client/src/pages/admin/AdminAudits.tsx"),
    "utf8",
  );
  assert.ok(adapter.split("\n").length <= 10);
  const directory = path.join(root, "client/src/features/admin/audits");
  for (const name of fs.readdirSync(directory)) {
    if (!name.endsWith(".ts") && !name.endsWith(".tsx")) continue;
    if (name === "translations.ts") continue;
    const lines = fs.readFileSync(path.join(directory, name), "utf8").split("\n").length;
    const limit = name === "AdminAuditsPage.tsx" ? 250 : 350;
    assert.ok(lines <= limit, `${name} grew to ${lines} lines (limit ${limit})`);
  }
});

test("Prácticas conserva contrato canónico, endpoints, idiomas y controles editoriales", () => {
  const source = readAdminFeatureSources(
    "practice-groups",
    "AdminPracticeGroups.tsx",
    ["capability-groups"],
  );
  const english = practiceGroupTranslations.en;
  const schema = createPracticeGroupSchema(english);
  assert.deepEqual(schema.keyof().options, [
    "name",
    "nameEs",
    "slug",
    "description",
    "descriptionEs",
    "fullDescription",
    "fullDescriptionEs",
    "iconName",
    "order",
    "published",
    "imageUrl",
  ]);
  assert.equal((source.match(/adminApiRequest\(/g) || []).length, 3);
  assert.match(source, /adminEndpoint: "\/api\/admin\/practice-groups"/);
  assert.match(source, /publicQueryKey: "\/api\/practice-groups"/);
  assert.match(source, /entityType: "practice_group"/);
  assert.match(source, /practiceContentLimits\.introduction/);
  assert.match(source, /practiceContentLimits\.body/);
  assert.deepEqual(Object.keys(practiceGroupTranslations), [
    "en", "es", "de", "zh", "ko", "ja", "ar", "ru", "fr", "it",
  ]);
  assert.equal((source.match(/data-testid=/g) || []).length, 22);
  for (const contract of [
    /recommendedFamily="gelasio"/,
    /recommendedFamily="inter"/,
    /field="description"/,
    /field="descriptionEs"/,
    /field="fullDescription"/,
    /field="fullDescriptionEs"/,
    /field="name"/,
    /field="nameEs"/,
    /switch-published/,
    /ImageUpload/,
  ]) {
    assert.match(source, contract);
  }
});

test("Prácticas conserva slug, orden y normalización del formulario", () => {
  const english = practiceGroupTranslations.en;
  assert.equal(generateCapabilitySlug("Arbitraje y Litigio"), "arbitraje-y-litigio");
  const groups = [
    { id: "later", order: 9 },
    { id: "first", order: 1 },
    { id: "unset", order: null },
  ] as unknown as CapabilityGroup[];
  assert.deepEqual(sortCapabilityGroups(groups).map((group) => group.id), [
    "unset",
    "first",
    "later",
  ]);
  const mapped = capabilityGroupToFormData({
    id: "practice-one",
    name: "Tax",
    nameEs: "Fiscal",
    slug: "tax",
    description: "Intro",
    descriptionEs: "Introducción",
    fullDescription: null,
    fullDescriptionEs: null,
    iconName: null,
    imageUrl: null,
    order: null,
    published: null,
  });
  assert.equal(mapped.fullDescription, "");
  assert.equal(mapped.order, 0);
  assert.equal(mapped.published, true);
  const copy = toCapabilityCopy(english, {
    newGroup: "newPracticeGroup",
    editGroup: "editPracticeGroup",
    noGroups: "noPracticeGroups",
  });
  assert.equal(copy.newGroup, english.newPracticeGroup);
  assert.equal(copy.noGroups, english.noPracticeGroups);
});

test("los módulos de Prácticas y su infraestructura compartida respetan arquitectura", () => {
  const root = process.cwd();
  const adapter = fs.readFileSync(
    path.join(root, "client/src/pages/admin/AdminPracticeGroups.tsx"),
    "utf8",
  );
  assert.ok(adapter.split("\n").length <= 10);
  for (const feature of ["practice-groups", "capability-groups"]) {
    const directory = path.join(root, "client/src/features/admin", feature);
    for (const name of fs.readdirSync(directory)) {
      if (!name.endsWith(".ts") && !name.endsWith(".tsx")) continue;
      if (name === "translations.ts") continue;
      const lines = fs.readFileSync(path.join(directory, name), "utf8").split("\n").length;
      const limit = name.endsWith("Page.tsx") ? 250 : 350;
      assert.ok(lines <= limit, `${feature}/${name} grew to ${lines} lines (limit ${limit})`);
    }
  }
});

test("Industrias conserva contrato canónico, endpoints, idiomas y controles editoriales", () => {
  const source = readAdminFeatureSources(
    "industry-groups",
    "AdminIndustryGroups.tsx",
    ["capability-groups"],
  );
  assert.deepEqual(industryGroupSchema.keyof().options, [
    "name",
    "nameEs",
    "slug",
    "description",
    "descriptionEs",
    "fullDescription",
    "fullDescriptionEs",
    "iconName",
    "order",
    "published",
    "imageUrl",
  ]);
  assert.equal((source.match(/adminApiRequest\(/g) || []).length, 3);
  assert.match(source, /adminEndpoint: "\/api\/admin\/industry-groups"/);
  assert.match(source, /publicQueryKey: "\/api\/industry-groups"/);
  assert.match(source, /entityType: "industry_group"/);
  assert.deepEqual(Object.keys(industryGroupTranslations), [
    "en", "es", "de", "zh", "ko", "ja", "ar", "ru", "fr", "it",
  ]);
  const englishKeys = Object.keys(industryGroupTranslations.en);
  for (const translation of Object.values(industryGroupTranslations)) {
    assert.deepEqual(Object.keys(translation), englishKeys);
  }
  assert.equal((source.match(/data-testid=/g) || []).length, 22);
  for (const contract of [
    /recommendedFamily="gelasio"/,
    /recommendedFamily="inter"/,
    /field="description"/,
    /field="descriptionEs"/,
    /field="fullDescription"/,
    /field="fullDescriptionEs"/,
    /field="name"/,
    /field="nameEs"/,
    /switch-published/,
    /ImageUpload/,
  ]) {
    assert.match(source, contract);
  }
});

test("Industrias conserva límites editoriales, errores técnicos y normalización", () => {
  const valid = {
    name: "Industry",
    nameEs: "Industria",
    slug: "industry",
    description: "Introduction",
    descriptionEs: "Introducción",
    fullDescription: "Body",
    fullDescriptionEs: "Cuerpo",
    iconName: "building",
    order: 0,
    published: true,
    imageUrl: "",
  };
  assert.equal(industryGroupSchema.safeParse(valid).success, true);
  assert.equal(industryGroupSchema.safeParse({
    ...valid,
    description: "x".repeat(501),
  }).success, false);
  assert.equal(industryGroupSchema.safeParse({
    ...valid,
    fullDescription: "x".repeat(5001),
  }).success, false);
  const copy = toCapabilityCopy(
    industryGroupTranslations.en,
    {
      newGroup: "newIndustryGroup",
      editGroup: "editIndustryGroup",
      noGroups: "noIndustryGroups",
    },
    {
      fetch: "Failed to fetch industry groups",
      save: "Failed to save industry group",
      delete: "Failed to delete industry group",
    },
  );
  assert.equal(copy.newGroup, industryGroupTranslations.en.newIndustryGroup);
  assert.equal(copy.fetchError, "Failed to fetch industry groups");
  assert.equal(copy.technicalSaveError, "Failed to save industry group");
  assert.equal(copy.technicalDeleteError, "Failed to delete industry group");
});

test("los módulos de Industrias respetan los límites de arquitectura", () => {
  const root = process.cwd();
  const adapter = fs.readFileSync(
    path.join(root, "client/src/pages/admin/AdminIndustryGroups.tsx"),
    "utf8",
  );
  assert.ok(adapter.split("\n").length <= 10);
  const directory = path.join(root, "client/src/features/admin/industry-groups");
  for (const name of fs.readdirSync(directory)) {
    if (!name.endsWith(".ts") && !name.endsWith(".tsx")) continue;
    if (name === "translations.ts") continue;
    const lines = fs.readFileSync(path.join(directory, name), "utf8").split("\n").length;
    const limit = name.endsWith("Page.tsx") ? 250 : 350;
    assert.ok(lines <= limit, `industry-groups/${name} grew to ${lines} lines (limit ${limit})`);
  }
});

test("Configuración conserva secciones, claves, APIs, query keys y controles", () => {
  const source = readAdminFeatureSources("site-config", "AdminSiteConfig.tsx");
  const registrySource = fs.readFileSync(
    path.join(process.cwd(), "client/src/features/admin/site-config/registry.ts"),
    "utf8",
  );
  const declaredKeys = [...registrySource.matchAll(/key:\s*"([^"]+)"/g)]
    .map((match) => match[1]);
  assert.equal(Object.keys(PAGES).filter((key) => key !== "resumen-firma").length, 15);
  // El inventario incorpora las cabeceras editables de Prácticas, Industrias,
  // Diversidad y Pro Bono, además de los controles del carrusel de Noticias.
  // Conservamos las dos repeticiones intencionales del resumen institucional.
  assert.equal(declaredKeys.length, 226);
  assert.equal(new Set(declaredKeys).size, 224);
  assert.ok(declaredKeys.includes("home_location_visible"));
  for (const key of [
    "home_news_title",
    "page_practices_title",
    "page_industries_title",
    "page_diversity_title",
    "page_probono_title",
  ]) assert.ok(declaredKeys.includes(key), `Falta el control administrativo ${key}`);
  assert.equal((source.match(/adminApiRequest\(/g) || []).length, 6);
  assert.equal((source.match(/queryKey:/g) || []).length, 3);
  assert.equal((source.match(/data-testid=/g) || []).length, 15);
  for (const endpoint of [
    /"GET", "\/api\/admin\/site-config"/,
    /"GET", "\/api\/admin\/practice-groups"/,
    /"GET", "\/api\/admin\/industry-groups"/,
    /"POST", "\/api\/admin\/media\/hero-variants"/,
    /"PUT", `\/api\/admin\/site-config\/\$\{key\}`/,
    /"POST", "\/api\/admin\/site-config\/firma\/restore-previous"/,
  ]) {
    assert.match(source, endpoint);
  }
  assert.equal(HOME_TAB_LABELS.length, 5);
  assert.equal(FIRM_TAB_LABELS.length, 8);
  assert.equal(PAGES.firma.groups.length, 8);
  assert.equal(PAGES["resumen-firma"].groups.length, 8);
});

test("Configuración conserva alias, borradores, video hero, cambios y carruseles", () => {
  assert.equal(resolveSiteConfigSection(), "portada");
  assert.equal(resolveSiteConfigSection("desconocida"), "portada");
  assert.equal(resolveSiteConfigSection("resumen-firma"), "firma");
  assert.equal(resolveSiteConfigSection("contacto"), "contacto");
  assert.deepEqual(configMapToDraft({
    title: { value: "English", valueEs: "Español", type: "text" },
    empty: { value: "", valueEs: "", type: "text" },
  }), {
    title: { value: "English", valueEs: "Español" },
    empty: { value: "", valueEs: "" },
  });
  assert.equal(shouldOptimizeHeroVideo("hero_video_master", "/uploads/master.mp4"), true);
  assert.equal(shouldOptimizeHeroVideo("hero_video_master", "/uploads/home-hero-desktop-v2.mp4"), false);
  assert.equal(shouldOptimizeHeroVideo("hero_video_master", "/uploads/hero-abcdef-desktop.mp4"), false);
  assert.equal(shouldOptimizeHeroVideo("hero_video_master", "https://youtube.com/watch?v=one"), false);
  assert.equal(shouldOptimizeHeroVideo("other", "/uploads/master.mp4"), false);
  assert.deepEqual(buildConfigChanges(
    { key: "title", label: "Título", bilingual: true },
    { title: { value: "Before", valueEs: "Antes", type: "text" } },
    { title: { value: "After", valueEs: "Después" } },
  ), [
    { label: "Título (inglés)", before: "Before", after: "After" },
    { label: "Título (español)", before: "Antes", after: "Después" },
  ]);
  assert.deepEqual(visibleCarouselItems([
    { id: "later", slug: "later", name: "Later", nameEs: "Después", order: 3 },
    { id: "hidden", slug: "hidden", name: "Hidden", nameEs: "Oculta", published: false },
    { id: "desk", slug: "german-desk", name: "Desk", nameEs: "Desk", order: 0 },
    { id: "first", slug: "first", name: "First", nameEs: "Primero", order: 1 },
  ]).map((item) => item.id), ["first", "later"]);
});

test("Configuración conserva la clasificación tipográfica pública", () => {
  assert.equal(isPublicTextField({ key: "home_news_title", label: "Título" }), true);
  assert.equal(typographyRoleFor({ key: "home_news_title", label: "Título" }), "editorial");
  assert.equal(typographyRoleFor({ key: "newsletter_cta", label: "CTA" }), "ui");
  assert.equal(typographyRoleFor({ key: "page_contact_body", label: "Cuerpo" }), "body");
  for (const key of [
    "hero_video_master",
    "footer_email",
    "facebook",
    "home_news_pages",
    "firm_landing_hero_visible",
  ]) {
    assert.equal(isPublicTextField({ key, label: key }), false, key);
  }
});

test("los módulos de Configuración respetan los límites de arquitectura", () => {
  const root = process.cwd();
  const adapter = fs.readFileSync(
    path.join(root, "client/src/pages/admin/AdminSiteConfig.tsx"),
    "utf8",
  );
  assert.ok(adapter.split("\n").length <= 10);
  const directory = path.join(root, "client/src/features/admin/site-config");
  for (const name of fs.readdirSync(directory)) {
    if (!name.endsWith(".ts") && !name.endsWith(".tsx")) continue;
    if (name === "registry.ts") continue;
    const lines = fs.readFileSync(path.join(directory, name), "utf8").split("\n").length;
    const limit = name === "AdminSiteConfigPage.tsx" ? 250 : 350;
    assert.ok(lines <= limit, `site-config/${name} grew to ${lines} lines (limit ${limit})`);
  }
});

test("Procesamiento conserva traducciones y textos protegidos de borradores", () => {
  assert.deepEqual(Object.keys(articleProcessingTranslations), [
    "en", "es", "de", "zh", "ko", "ja", "ar", "ru", "fr", "it",
  ]);
  const englishKeys = Object.keys(articleProcessingTranslations.en);
  for (const translation of Object.values(articleProcessingTranslations)) {
    assert.deepEqual(Object.keys(translation), englishKeys);
  }
  assert.deepEqual(Object.keys(processingDraftText.es), Object.keys(processingDraftText.en));
  assert.equal(selectArticleProcessingCopy("es"), articleProcessingTranslations.es);
  assert.equal(selectArticleProcessingCopy("unknown"), articleProcessingTranslations.en);
  assert.equal(selectProcessingDraftCopy("es"), processingDraftText.es);
  assert.equal(selectProcessingDraftCopy("de"), processingDraftText.en);
});

test("Procesamiento conserva ruta, endpoints, query keys y controles administrativos", () => {
  const source = readAdminFeatureSources(
    "article-processing",
    "AdminArticleProcessing.tsx",
  );
  const appSource = fs.readFileSync(
    path.join(process.cwd(), "client/src/App.tsx"),
    "utf8",
  );
  assert.match(appSource, /lazy\(\(\) => import\("@\/pages\/admin\/AdminArticleProcessing"\)\)/);
  assert.match(appSource, /<Route path="\/admin\/processing" component=\{AdminArticleProcessing\}/);
  assert.equal((source.match(/adminApiRequest\(/g) || []).length, 6);
  for (const endpoint of [
    /"GET", "\/api\/admin\/news\/stats"/,
    /"GET", "\/api\/admin\/news\?limit=100"/,
    /"GET", "\/api\/admin\/news\/translation-counts"/,
    /`\/api\/admin\/news\/\$\{articleId\}\/processing-draft`/,
    /`\/api\/agents\/pipeline\/\$\{articleId\}`/,
    /"POST", "\/api\/agents\/recover"/,
  ]) {
    assert.match(source, endpoint);
  }
  assert.deepEqual(ARTICLE_PROCESSING_QUERY_KEYS, {
    stats: ["/api/admin/news/stats"],
    news: ["/api/admin/news", "agent-processing"],
    translations: ["/api/admin/news/translation-counts"],
  });
  assert.equal((source.match(/data-testid=/g) || []).length, 15);
  for (const testId of [
    "switch-generate-images",
    "button-refresh",
    "button-stop-batch",
    "button-process-all",
    "text-total-articles",
    "text-with-translations",
    "text-processing-status",
    "button-repair-errors",
    "text-no-articles",
    "row-article-",
    "text-title-",
    "text-date-",
    "badge-translations-",
    "button-process-",
    "button-create-processing-draft-",
  ]) {
    assert.match(source, new RegExp(testId));
  }
});

test("Procesamiento conserva invalidaciones, cancelación y estado visible del modal", () => {
  const source = readAdminFeatureSources(
    "article-processing",
    "AdminArticleProcessing.tsx",
  );
  const modalSource = fs.readFileSync(
    path.join(process.cwd(), "client/src/components/PipelineProgressModal.tsx"),
    "utf8",
  );
  assert.match(source, /article\.published !== false/);
  assert.match(source, /selectProcessingDrafts\(articles\)/);
  assert.match(source, /Promise\.allSettled/);
  assert.match(source, /if \(cancelBatchRef\.current\)[\s\S]*?break/);
  assert.match(source, /setTimeout\(resolve, BATCH_DELAY_MS\)/);
  assert.doesNotMatch(source, /AbortController/);
  assert.match(source, /invalidatePipelineResults[\s\S]*ARTICLE_PROCESSING_QUERY_KEYS\.translations[\s\S]*ARTICLE_PROCESSING_QUERY_KEYS\.news/);
  assert.match(source, /refreshAll[\s\S]*ARTICLE_PROCESSING_QUERY_KEYS\.stats[\s\S]*ARTICLE_PROCESSING_QUERY_KEYS\.translations[\s\S]*ARTICLE_PROCESSING_QUERY_KEYS\.news/);
  assert.match(source, /setProgressArticleTitle\(title\)[\s\S]*setPipelineStartError\(null\)[\s\S]*setProgressModalOpen\(true\)/);
  assert.match(source, /setPipelineStartError\(errorMessage\)[\s\S]*throw new Error\(errorMessage\)/);
  assert.match(source, /if \(!open\)[\s\S]*setProcessingArticleId\(null\)[\s\S]*setProgressArticleTitle\(""\)[\s\S]*setPipelineStartError\(null\)/);
  assert.match(source, /startError=\{controller\.pipelineStartError\}/);
  assert.match(modalSource, /startError \? 'error' : 'running'/);
  assert.match(modalSource, /setHasError\(Boolean\(startError\)\)/);
});

test("Procesamiento conserva lotes de tres, orden y selección exclusiva de borradores", () => {
  const articles = Array.from({ length: 7 }, (_, index) => ({
    id: `article-${index}`,
    title: `Article ${index}`,
    titleEs: `Artículo ${index}`,
    published: index % 2 === 0,
  })) as unknown as News[];
  assert.equal(BATCH_CONCURRENCY_LIMIT, 3);
  assert.equal(BATCH_DELAY_MS, 500);
  assert.deepEqual(chunkArticles([]), []);
  assert.deepEqual(chunkArticles(articles.slice(0, 1)).map((batch) => batch.length), [1]);
  assert.deepEqual(chunkArticles(articles.slice(0, 3)).map((batch) => batch.length), [3]);
  assert.deepEqual(chunkArticles(articles.slice(0, 4)).map((batch) => batch.length), [3, 1]);
  assert.deepEqual(chunkArticles(articles).map((batch) => batch.length), [3, 3, 1]);
  assert.deepEqual(chunkArticles(articles).flat().map((article) => article.id), articles.map((article) => article.id));
  assert.deepEqual(selectProcessingDrafts(articles).map((article) => article.id), [
    "article-1", "article-3", "article-5",
  ]);
  assert.deepEqual(createBatchProgress(4), {
    isProcessing: true,
    total: 4,
    processed: 0,
    successful: 0,
    failed: 0,
    currentBatch: 0,
    totalBatches: 2,
    errors: [],
  });
  assert.equal(createBatchProgress(0).isProcessing, false);
});

test("Procesamiento conserva normalización de resultados, errores y advertencias", () => {
  assert.equal(normalizePipelineException(new Error("HTTP 429")), "Rate limit exceeded - will retry");
  assert.equal(normalizePipelineException(new Error("rate limit")), "Rate limit exceeded - will retry");
  assert.equal(normalizePipelineException(new Error("request timeout")), "Request timeout");
  assert.equal(normalizePipelineException(new Error("ETIMEDOUT")), "Request timeout");
  assert.equal(normalizePipelineException(new Error("Other failure")), "Other failure");
  assert.equal(normalizePipelineException("failure"), "Unknown error");
  assert.equal(pipelinePayloadFailure({ success: true }), null);
  assert.equal(pipelinePayloadFailure({ success: false, errors: ["format", "seo"] }), "format; seo");
  assert.equal(pipelinePayloadFailure({ success: false }), "One or more processing stages failed");
  assert.equal(pipelineImageWarning({ success: true, steps: { image: { success: false } } }), true);
  assert.equal(pipelineImageWarning({ success: false, steps: { image: { success: false } } }), false);
  assert.deepEqual(resolveSettledPipelineResult({
    status: "rejected",
    reason: new Error("Promise error"),
  }), { success: false, error: "Promise error" });
});

test("Procesamiento conserva conteos, fecha y resumen detallado del lote", () => {
  assert.equal(countArticlesWithTranslations({ one: 0, two: 1, three: 9 }), 2);
  assert.equal(formatArticleDate(null, "es"), "-");
  const date = "2026-08-13T12:00:00.000Z";
  assert.equal(
    formatArticleDate(date, "es"),
    new Date(date).toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" }),
  );
  const errors = Array.from({ length: 4 }, (_, index) => ({
    articleId: `article-${index}`,
    title: `Article ${index}`,
    error: `Error ${index}`,
  }));
  assert.equal(buildBatchCompletionDescription({
    successful: 2,
    processed: 4,
    failed: 2,
    errors,
    imageWarnings: 1,
    copy: articleProcessingTranslations.en,
  }), "2/4 completed, 2 failed - Article 0: Error 0; Article 1: Error 1; Article 2: Error 2... (+1 more) (1 Image generation failed, article saved without image)");
});

test("los módulos de Procesamiento respetan los límites de arquitectura", () => {
  const root = process.cwd();
  const adapter = fs.readFileSync(
    path.join(root, "client/src/pages/admin/AdminArticleProcessing.tsx"),
    "utf8",
  );
  assert.ok(adapter.split("\n").length <= 10);
  const directory = path.join(root, "client/src/features/admin/article-processing");
  for (const name of fs.readdirSync(directory)) {
    if (!name.endsWith(".ts") && !name.endsWith(".tsx")) continue;
    if (name === "translations.ts") continue;
    const lines = fs.readFileSync(path.join(directory, name), "utf8").split("\n").length;
    const limit = name === "AdminArticleProcessingPage.tsx" ? 250 : 350;
    assert.ok(lines <= limit, `article-processing/${name} grew to ${lines} lines (limit ${limit})`);
  }
});

test("Traducciones conserva sus idiomas, textos y tipos de contenido", () => {
  assert.deepEqual(SUPPORTED_LANGUAGES, [
    "en", "es", "de", "zh", "ko", "ja", "ar", "ru", "fr", "it",
  ]);
  assert.deepEqual(Object.keys(translationDashboardTranslations), SUPPORTED_LANGUAGES);
  const englishKeys = Object.keys(translationDashboardTranslations.en);
  for (const translation of Object.values(translationDashboardTranslations)) {
    assert.deepEqual(Object.keys(translation), englishKeys);
  }
  assert.deepEqual(CONTENT_TYPES.map((contentType) => contentType.value), [
    "all", "news", "practice_groups", "team_members", "industry_groups",
  ]);
  assert.equal(selectTranslationCopy("es"), translationDashboardTranslations.es);
  assert.equal(selectTranslationCopy("unknown"), translationDashboardTranslations.en);
});

test("Traducciones conserva ruta, APIs, query keys, permisos y controles", () => {
  const source = readAdminFeatureSources("translations", "AdminTranslations.tsx");
  const appSource = fs.readFileSync(
    path.join(process.cwd(), "client/src/App.tsx"),
    "utf8",
  );
  assert.match(appSource, /lazy\(\(\) => import\("@\/pages\/admin\/AdminTranslations"\)\)/);
  assert.match(appSource, /<Route path="\/admin\/translations" component=\{AdminTranslations\}/);
  assert.equal((source.match(/adminApiRequest\(/g) || []).length, 5);
  for (const endpoint of [
    /"GET", "\/api\/admin\/cms-stats"/,
    /"GET",[\s\S]*?"\/api\/admin\/news\/translation-counts"/,
    /"POST", "\/api\/admin\/translate"/,
    /"GET",[\s\S]*?"\/api\/admin\/settings\/languages"/,
    /"POST", "\/api\/admin\/settings\/languages"/,
  ]) {
    assert.match(source, endpoint);
  }
  assert.deepEqual(Object.keys(TRANSLATION_QUERY_KEYS), ["stats", "counts", "languages"]);
  assert.deepEqual(TRANSLATION_QUERY_KEYS.stats, ["/api/admin/cms-stats"]);
  assert.deepEqual(TRANSLATION_QUERY_KEYS.counts.root, [
    "/api/admin/news/translation-counts",
  ]);
  assert.deepEqual(TRANSLATION_QUERY_KEYS.counts.forFilter("news"), [
    "/api/admin/news/translation-counts",
    "news",
  ]);
  assert.deepEqual(TRANSLATION_QUERY_KEYS.languages, ["/api/admin/settings/languages"]);
  assert.equal((source.match(/queryKey:/g) || []).length, 7);
  assert.equal((source.match(/data-testid=/g) || []).length, 33);
  for (const testId of [
    "loading-auth",
    "admin-translations-page",
    "button-refresh",
    "tabs-navigation",
    "tab-overview",
    "tab-articles",
    "tab-jobs",
    "tab-languages",
    "lang-toggle-",
    "button-save-languages",
    "card-total-articles",
    "text-total-articles",
    "card-translated-articles",
    "text-translated-articles",
    "card-coverage-rate",
    "text-coverage-rate",
    "card-languages-supported",
    "text-languages-count",
    "card-language-coverage",
    "language-row-",
    "text-coverage-",
    "progress-",
    "select-content-type",
    "option-type-",
    "text-no-articles",
    "row-article-",
    "text-title-",
    "text-type-",
    "badge-lang-",
    "button-translate-",
    "card-recent-jobs",
    "text-no-jobs",
  ]) {
    assert.match(source, new RegExp(testId));
  }
  assert.match(source, /const canManageLanguages = permissionsLoaded && has\("config"\)/);
  assert.match(source, /enabled: isAuthenticated && canManageLanguages/);
  assert.match(source, /controller\.canManageLanguages && \(/);
});

test("Traducciones conserva estadísticas, cobertura, filtros y colores", () => {
  const stats: CMSStats = {
    totalArticles: 4,
    articlesWithTranslations: 3,
    totalTranslations: 8,
    translationsByLanguage: { de: 2, fr: 5 },
    languageCoverage: {
      es: { total: 4, translated: 4 },
      en: { total: 4, translated: 3 },
    },
  };
  assert.deepEqual(buildOverallStats(undefined), {
    total: 0,
    translated: 0,
    coverage: 0,
    languages: 10,
  });
  assert.deepEqual(buildOverallStats(stats), {
    total: 4,
    translated: 3,
    coverage: 75,
    languages: 10,
  });
  const coverage = buildLanguageCoverage(stats);
  assert.equal(coverage.length, 10);
  assert.deepEqual(coverage.find((language) => language.code === "es"), {
    code: "es",
    name: "Spanish",
    native: "Español",
    translated: 4,
    total: 4,
    coverage: 100,
  });
  assert.equal(coverage.find((language) => language.code === "de")?.coverage, 50);
  assert.equal(coverage.find((language) => language.code === "fr")?.coverage, 100);
  assert.deepEqual(buildLanguageCoverage(undefined), []);

  const articles = [
    { articleId: "one", category: "news" },
    { articleId: "two", category: "practice_groups" },
  ] as TranslationCounts[];
  assert.equal(filterTranslationArticles(articles, "all"), articles);
  assert.deepEqual(
    filterTranslationArticles(articles, "news").map((article) => article.articleId),
    ["one"],
  );
  for (const [coverageValue, textClass, progressClass] of [
    [49, "text-red-600", "bg-red-600"],
    [50, "text-orange-600", "bg-orange-600"],
    [70, "text-yellow-600", "bg-yellow-600"],
    [90, "text-green-600", "bg-green-600"],
  ] as const) {
    assert.equal(getCoverageColor(coverageValue), textClass);
    assert.equal(getProgressColor(coverageValue), progressClass);
  }
});

test("Traducciones conserva borradores, resultados aplicados e idiomas activos", () => {
  const draft = {
    articleId: "draft",
    published: false,
    missingLanguages: ["en"],
  } as TranslationCounts;
  assert.equal(canTranslateArticle(draft), true);
  assert.equal(canTranslateArticle({ ...draft, published: true }), false);
  assert.equal(canTranslateArticle({ ...draft, missingLanguages: [] }), false);
  assert.deepEqual(requireAppliedTranslation({
    success: true,
    data: { changesApplied: true },
  }), {
    success: true,
    data: { changesApplied: true },
  });
  assert.throws(
    () => requireAppliedTranslation({ success: true, data: { changesApplied: false } }),
    /La traducción no se guardó en el borrador/,
  );
  assert.throws(
    () => requireAppliedTranslation({ success: false, error: "HTTP failure" }),
    /HTTP failure/,
  );

  assert.deepEqual(toggleActiveLanguage(["es", "en"], "de", true), ["es", "en", "de"]);
  assert.deepEqual(toggleActiveLanguage(["es", "en", "de"], "de", true), ["es", "en", "de"]);
  assert.deepEqual(toggleActiveLanguage(["es", "en", "de"], "de", false), ["es", "en"]);
  assert.deepEqual(toggleActiveLanguage(["es", "en"], "es", false), ["es", "en"]);
  assert.deepEqual(resolveSavedLanguages(["es", "en"], {}), ["es", "en"]);
  assert.deepEqual(resolveSavedLanguages(["es", "en"], {
    activeLanguages: ["es", "de"],
  }), ["es", "de"]);

  const source = readAdminFeatureSources("translations", "AdminTranslations.tsx");
  assert.match(source, /readAdminJson<TranslationRunResult>/);
  assert.match(source, /requireAppliedTranslation\(result\)/);
  assert.match(source, /if \(languages\.length === 0\) return/);
  assert.match(source, /Crea un borrador para traducir/);
  assert.match(source, /disabled=\{isBase\}/);
  assert.match(source, /queryKey: TRANSLATION_QUERY_KEYS\.counts\.forFilter\(contentTypeFilter\)/);
  assert.match(source, /invalidateQueries\(\{ queryKey: TRANSLATION_QUERY_KEYS\.counts\.root \}\)/);
  assert.match(source, /setActiveLangs\(\(current\) => resolveSavedLanguages\(current, data\)\)/);
});

test("los módulos de Traducciones respetan los límites de arquitectura", () => {
  const root = process.cwd();
  const adapter = fs.readFileSync(
    path.join(root, "client/src/pages/admin/AdminTranslations.tsx"),
    "utf8",
  );
  assert.ok(adapter.split("\n").length <= 10);
  const directory = path.join(root, "client/src/features/admin/translations");
  for (const name of fs.readdirSync(directory)) {
    if (!name.endsWith(".ts") && !name.endsWith(".tsx")) continue;
    if (name === "translations.ts") continue;
    const lines = fs.readFileSync(path.join(directory, name), "utf8").split("\n").length;
    const limit = name === "AdminTranslationsPage.tsx" ? 250 : 350;
    assert.ok(lines <= limit, `translations/${name} grew to ${lines} lines (limit ${limit})`);
  }
});
