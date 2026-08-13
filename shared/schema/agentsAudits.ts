import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { adminUsers } from "./adminSecurity";
import { news } from "./news";

// ============================================
// CONTENT ANALYSIS RESULTS
// ============================================

export interface SEORecommendation {
  keywords: string[];
  titleSuggestion: string;
  metaDescription: string;
  headingImprovements: string[];
  contentGaps: string[];
  internalLinkOpportunities: string[];
}

export interface SpellingGrammarIssue {
  original: string;
  correction: string;
  type: 'spelling' | 'grammar' | 'terminology' | 'style';
  explanation: string;
}

export interface LawyerMention {
  name: string;
  role: string;
  context: string;
}

export interface ContentAnalysisResult {
  seoRecommendations: SEORecommendation;
  categories: {
    primary: string;
    secondary: string[];
  };
  spellingGrammar: SpellingGrammarIssue[];
  lawyersMentioned: LawyerMention[];
  legalBranches: {
    primary: string[];
    secondary: string[];
  };
  industries: {
    primary: string;
    secondary: string[];
  };
  qualityScore: number;
  analysisTimestamp: string;
}

export const contentAnalysis = pgTable("content_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").notNull(),
  analysisResult: jsonb("analysis_result").$type<ContentAnalysisResult>().notNull(),
  qualityScore: integer("quality_score").default(0),
  issuesCount: integer("issues_count").default(0),
  status: text("status").default("completed"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertContentAnalysisSchema = createInsertSchema(contentAnalysis).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertContentAnalysis = z.infer<typeof insertContentAnalysisSchema>;
export type ContentAnalysis = typeof contentAnalysis.$inferSelect;

// ============================================
// AI AGENT SYSTEM TABLES
// ============================================

// Agent jobs queue
export const agentJobs = pgTable("agent_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentType: text("agent_type").notNull(),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, failed, cancelled
  priority: text("priority").notNull().default("normal"), // low, normal, high, critical
  payload: jsonb("payload").notNull(),
  result: jsonb("result"),
  error: text("error"),
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  parentJobId: varchar("parent_job_id"),
  createdAt: timestamp("created_at").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
}, (t) => ({
  // getPendingJobs/getFailedJobs: WHERE status + ORDER BY createdAt; y filtro por agentType.
  statusCreatedIdx: index("agent_jobs_status_created_idx").on(t.status, t.createdAt),
  agentTypeIdx: index("agent_jobs_agent_type_idx").on(t.agentType),
}));

export const insertAgentJobSchema = createInsertSchema(agentJobs).omit({ id: true, createdAt: true });
export type InsertAgentJob = z.infer<typeof insertAgentJobSchema>;
export type AgentJob = typeof agentJobs.$inferSelect;

// Historial editorial inmutable de los resultados textuales de los agentes.  A diferencia de
// agent_jobs (que describe la ejecución técnica), aquí se conserva una instantánea reutilizable
// del resultado final. sourceJobId es único para que reintentos y recuperaciones no dupliquen
// copys; las referencias opcionales usan SET NULL para que el historial sobreviva a la limpieza
// del artículo o del usuario de origen.
export const agentCopyHistory = pgTable("agent_copy_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceJobId: varchar("source_job_id"),
  agentType: text("agent_type").notNull(),
  copyType: text("copy_type").notNull(),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  content: jsonb("content").$type<Record<string, unknown>>().notNull(),
  searchText: text("search_text").notNull(),
  language: text("language").notNull().default("multi"),
  articleId: varchar("article_id").references(() => news.id, { onDelete: "set null" }),
  status: text("status").notNull().default("proposal"), // proposal | applied | draft | recovered
  origin: text("origin").notNull().default("manual"), // manual | pipeline | scheduled | recovered
  actorId: varchar("actor_id").references(() => adminUsers.id, { onDelete: "set null" }),
  archived: boolean("archived").notNull().default(false),
  archivedAt: timestamp("archived_at"),
  archivedBy: varchar("archived_by").references(() => adminUsers.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  sourceJobIdx: uniqueIndex("agent_copy_history_source_job_unique").on(t.sourceJobId),
  createdIdx: index("agent_copy_history_created_idx").on(t.createdAt),
  agentStatusIdx: index("agent_copy_history_agent_status_idx").on(t.agentType, t.status),
  articleIdx: index("agent_copy_history_article_idx").on(t.articleId),
  archivedCreatedIdx: index("agent_copy_history_archived_created_idx").on(t.archived, t.createdAt),
}));

export type AgentCopyHistory = typeof agentCopyHistory.$inferSelect;

// Agent events log
export const agentEvents = pgTable("agent_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull(),
  agentType: text("agent_type").notNull(),
  eventType: text("event_type").notNull(), // start, progress, complete, error, learning, evolution_proposal
  message: text("message").notNull(),
  data: jsonb("data"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertAgentEventSchema = createInsertSchema(agentEvents).omit({ id: true, timestamp: true });
export type InsertAgentEvent = z.infer<typeof insertAgentEventSchema>;
export type AgentEvent = typeof agentEvents.$inferSelect;

// Agent knowledge documents
export const agentKnowledge = pgTable("agent_knowledge", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentType: text("agent_type").notNull(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAgentKnowledgeSchema = createInsertSchema(agentKnowledge).omit({ id: true, createdAt: true, updatedAt: true, usageCount: true });
export type InsertAgentKnowledge = z.infer<typeof insertAgentKnowledgeSchema>;
export type AgentKnowledge = typeof agentKnowledge.$inferSelect;

// Agent skills tracking
export const agentSkills = pgTable("agent_skills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentType: text("agent_type").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  expertise: integer("expertise").default(50), // 0-100
  usageCount: integer("usage_count").default(0),
  successRate: integer("success_rate").default(100), // 0-100
  learnings: jsonb("learnings"), // Array of skill learnings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAgentSkillSchema = createInsertSchema(agentSkills).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAgentSkill = z.infer<typeof insertAgentSkillSchema>;
export type AgentSkill = typeof agentSkills.$inferSelect;

// Evolution proposals from agents
export const agentEvolutionProposals = pgTable("agent_evolution_proposals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentType: text("agent_type").notNull(),
  proposalType: text("proposal_type").notNull(), // skill_improvement, new_skill, config_change, knowledge_update
  title: text("title").notNull(),
  description: text("description").notNull(),
  rationale: text("rationale"),
  impact: text("impact").notNull().default("medium"), // low, medium, high
  status: text("status").notNull().default("pending"), // pending, approved, rejected, implemented
  proposedChanges: jsonb("proposed_changes"),
  metricsBefore: jsonb("metrics_before"),
  metricsAfter: jsonb("metrics_after"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  implementedAt: timestamp("implemented_at"),
});

export const insertAgentEvolutionProposalSchema = createInsertSchema(agentEvolutionProposals).omit({ id: true, createdAt: true });
export type InsertAgentEvolutionProposal = z.infer<typeof insertAgentEvolutionProposalSchema>;
export type AgentEvolutionProposal = typeof agentEvolutionProposals.$inferSelect;

// Website Audits - Summary of audit runs
export const websiteAudits = pgTable("website_audits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  runType: text("run_type").notNull().default("full"), // full, delta, links_only, translations_only, seo_only, content_only
  status: text("status").notNull().default("pending"), // pending, running, completed, failed
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  pagesScanned: integer("pages_scanned").default(0),
  linksChecked: integer("links_checked").default(0),
  translationsChecked: integer("translations_checked").default(0),
  issuesFound: integer("issues_found").default(0),
  criticalCount: integer("critical_count").default(0),
  highCount: integer("high_count").default(0),
  mediumCount: integer("medium_count").default(0),
  lowCount: integer("low_count").default(0),
  metrics: jsonb("metrics"), // Performance metrics, load times, etc.
  triggeredBy: text("triggered_by").default("manual"), // manual, scheduled, webhook
});

export const insertWebsiteAuditSchema = createInsertSchema(websiteAudits).omit({ id: true, startedAt: true });
export type InsertWebsiteAudit = z.infer<typeof insertWebsiteAuditSchema>;
export type WebsiteAudit = typeof websiteAudits.$inferSelect;

// Website Audit Findings - Individual issues found during audits
export const websiteAuditFindings = pgTable("website_audit_findings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  auditId: varchar("audit_id").notNull().references(() => websiteAudits.id, { onDelete: "cascade" }),
  category: text("category").notNull(), // links, navigation, translations, performance, seo, content
  issueType: text("issue_type").notNull(), // broken_link, missing_translation, incomplete_profile, slow_load, missing_meta, etc.
  severity: text("severity").notNull().default("medium"), // critical, high, medium, low
  status: text("status").notNull().default("open"), // open, in_progress, resolved, ignored, wont_fix
  entityType: text("entity_type"), // team_member, news, practice_group, industry_group, page, link
  entityId: varchar("entity_id"), // ID of the affected entity
  language: varchar("language", { length: 5 }), // For translation issues: en, es, de, zh, ko, ja, ar, ru, fr, it
  url: text("url"), // URL where the issue was found
  details: jsonb("details").notNull(), // Detailed issue information
  recommendation: text("recommendation"), // Suggested fix
  ownerAgent: text("owner_agent"), // Agent responsible for fixing: polyglot_translator, seo_optimizer, metadata_linker
  reportedAt: timestamp("reported_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: text("resolved_by"), // agent or manual
  remediationJobId: varchar("remediation_job_id"), // If an agent job was created to fix this
});

export const insertWebsiteAuditFindingSchema = createInsertSchema(websiteAuditFindings).omit({ id: true, reportedAt: true });
export type InsertWebsiteAuditFinding = z.infer<typeof insertWebsiteAuditFindingSchema>;
export type WebsiteAuditFinding = typeof websiteAuditFindings.$inferSelect;

// Audit finding categories and issue types for reference
export const auditCategories = {
  links: {
    issueTypes: ['broken_link', 'redirect_chain', 'external_link_broken', 'anchor_missing'],
    severity: 'critical'
  },
  navigation: {
    issueTypes: ['wrong_destination', 'dead_end', 'orphan_page', 'circular_navigation'],
    severity: 'high'
  },
  translations: {
    issueTypes: ['missing_translation', 'partial_translation', 'untranslated_field', 'language_mismatch'],
    severity: 'high'
  },
  performance: {
    issueTypes: ['slow_page_load', 'large_image', 'unoptimized_asset', 'render_blocking'],
    severity: 'medium'
  },
  seo: {
    issueTypes: ['missing_title', 'missing_description', 'missing_og_tags', 'missing_hreflang', 'duplicate_content', 'missing_alt_text'],
    severity: 'medium'
  },
  content: {
    issueTypes: ['incomplete_profile', 'missing_bio', 'missing_photo', 'empty_section', 'outdated_content', 'missing_practice_areas'],
    severity: 'high'
  }
} as const;
