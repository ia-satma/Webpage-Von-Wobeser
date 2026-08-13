import { and, count, desc, eq, gte, ilike, inArray, isNull, lte, or } from "drizzle-orm";
import { db } from "../../db";
import {
  adminUsers,
  agentCopyHistory,
  agentJobs,
  news,
  type AgentCopyHistory,
} from "@shared/schema";
import type { AgentType } from "../core/types";
import { sanitizeCms } from "../../mirror/sanitize";

export const TEXTUAL_AGENT_TYPES = [
  "formatter",
  "polyglot_translator",
  "seo_optimizer",
  "content_analyzer",
  "category_agent",
  "metadata_linker",
  "social_media",
  "newsletter",
  "legal_alerts",
] as const satisfies readonly AgentType[];

export type TextualAgentType = typeof TEXTUAL_AGENT_TYPES[number];
export type CopyHistoryOrigin = "manual" | "pipeline" | "scheduled" | "recovered";
export type CopyHistoryStatus = "proposal" | "applied" | "draft" | "recovered";

const TEXTUAL_AGENTS = new Set<string>(TEXTUAL_AGENT_TYPES);
const MAX_SNAPSHOT_BYTES = 100_000;
const MAX_SEARCH_TEXT = 12_000;
const HTML_VALUE_KEY = /(?:content|html|excerpt|body|description)$/i;

const COPY_TYPE: Record<TextualAgentType, string> = {
  formatter: "formatted_content",
  polyglot_translator: "translation",
  seo_optimizer: "seo_recommendation",
  content_analyzer: "content_analysis",
  category_agent: "classification",
  metadata_linker: "metadata_links",
  social_media: "social_copy",
  newsletter: "newsletter",
  legal_alerts: "legal_alert",
};

const COPY_TITLE: Record<TextualAgentType, string> = {
  formatter: "Contenido formateado",
  polyglot_translator: "Traducción jurídica",
  seo_optimizer: "Recomendación SEO",
  content_analyzer: "Análisis de contenido",
  category_agent: "Clasificación editorial",
  metadata_linker: "Metadatos relacionados",
  social_media: "Copy para redes sociales",
  newsletter: "Boletín informativo",
  legal_alerts: "Borrador de alerta legal",
};

type JsonRecord = Record<string, unknown>;

export interface PersistCopyInput {
  jobId: string;
  agentType: AgentType;
  payload: JsonRecord;
  result: unknown;
  completedAt?: Date;
  actorId?: string | null;
  origin: CopyHistoryOrigin;
}

export interface CopyHistoryFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  agentType?: string;
  copyType?: string;
  language?: string;
  articleId?: string;
  status?: string;
  archived?: boolean;
  from?: Date;
  to?: Date;
  sourceJobId?: string;
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isTextualAgent(agentType: AgentType | string): agentType is TextualAgentType {
  return TEXTUAL_AGENTS.has(agentType);
}

function safeString(value: unknown, limit = MAX_SNAPSHOT_BYTES): string {
  return typeof value === "string" ? value.replace(/\u0000/g, "").slice(0, limit) : "";
}

function sanitizeValue(value: unknown, key = ""): unknown {
  if (typeof value === "string") {
    const clean = safeString(value);
    return HTML_VALUE_KEY.test(key) ? sanitizeCms(clean) : clean;
  }
  if (typeof value === "number" || typeof value === "boolean" || value === null) return value;
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => sanitizeValue(item, key));
  if (!isRecord(value)) return undefined;

  const output: JsonRecord = {};
  for (const [childKey, childValue] of Object.entries(value)) {
    // Los agentes pueden conservar sus propios campos de diagnóstico, pero no se
    // registran prompts ni secretos aunque una futura implementación los agregue.
    if (/prompt|secret|token|authorization|api[_-]?key/i.test(childKey)) continue;
    const sanitized = sanitizeValue(childValue, childKey);
    if (sanitized !== undefined) output[childKey] = sanitized;
  }
  return output;
}

function stripMarkup(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function collectText(value: unknown, output: string[]): void {
  if (typeof value === "string") {
    const text = stripMarkup(value);
    if (text) output.push(text);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectText(item, output));
    return;
  }
  if (isRecord(value)) Object.values(value).forEach((item) => collectText(item, output));
}

function snapshotText(content: JsonRecord): string {
  const parts: string[] = [];
  collectText(content, parts);
  return parts.join("\n").replace(/\n{3,}/g, "\n\n").slice(0, MAX_SEARCH_TEXT);
}

function firstText(value: unknown): string {
  const parts: string[] = [];
  collectText(value, parts);
  return parts.join(" ").trim();
}

function inferredLanguage(payload: JsonRecord, result: JsonRecord): string {
  if (typeof result.language === "string") return result.language.slice(0, 12);
  if (typeof result.sourceLanguage === "string") return result.sourceLanguage.slice(0, 12);
  if (typeof payload.language === "string") return payload.language.slice(0, 12);
  if (Array.isArray(payload.targetLanguages) && payload.targetLanguages.length === 1 && typeof payload.targetLanguages[0] === "string") {
    return payload.targetLanguages[0].slice(0, 12);
  }
  return "multi";
}

function inferredArticleId(payload: JsonRecord, result: JsonRecord): string | null {
  const candidate = result.articleId || result.newsId || payload.articleId;
  return typeof candidate === "string" && candidate.length <= 120 ? candidate : null;
}

async function existingArticleId(candidate: string | null): Promise<string | null> {
  if (!candidate) return null;
  const [article] = await db.select({ id: news.id }).from(news).where(eq(news.id, candidate));
  return article?.id || null;
}

function titleFor(agentType: TextualAgentType, result: JsonRecord): string {
  const candidate = agentType === "newsletter"
    ? result.subject
    : (result.title || result.titleEs || result.primaryCategory);
  return safeString(candidate, 300).trim() || COPY_TITLE[agentType];
}

function isRecognizableResult(agentType: TextualAgentType, result: JsonRecord): boolean {
  switch (agentType) {
    case "formatter": return typeof result.content === "string" && result.content.trim().length > 0;
    case "polyglot_translator": return isRecord(result.translations) && Object.keys(result.translations).length > 0;
    case "seo_optimizer": return isRecord(result.optimization);
    case "content_analyzer": return isRecord(result.analysis);
    case "category_agent": return typeof result.primaryCategory === "string" || Array.isArray(result.tags);
    case "metadata_linker": return Array.isArray(result.linkedAuthors) || Array.isArray(result.authorCandidates);
    case "social_media": return isRecord(result.posts) && Object.keys(result.posts).length > 0;
    case "newsletter": return typeof result.html === "string" && result.html.trim().length > 0;
    case "legal_alerts": return typeof result.newsId === "string" || typeof result.titleEs === "string";
  }
}

async function legalAlertSnapshot(result: JsonRecord): Promise<JsonRecord> {
  const newsId = typeof result.newsId === "string" ? result.newsId : null;
  if (!newsId) return sanitizeValue(result) as JsonRecord;
  const [draft] = await db.select({
    id: news.id,
    title: news.title,
    titleEs: news.titleEs,
    excerpt: news.excerpt,
    excerptEs: news.excerptEs,
    content: news.content,
    contentEs: news.contentEs,
    slug: news.slug,
    published: news.published,
  }).from(news).where(eq(news.id, newsId));

  return sanitizeValue({
    ...result,
    draft: draft || undefined,
  }) as JsonRecord;
}

function resolvedStatus(agentType: TextualAgentType, payload: JsonRecord, result: JsonRecord, origin: CopyHistoryOrigin): CopyHistoryStatus {
  if (origin === "recovered") return "recovered";
  if (agentType === "legal_alerts") return "draft";
  // `applyChanges` expresa la intención. El estado aplicado solo se asigna cuando el agente
  // confirma que efectivamente escribió el resultado (por ejemplo, puede rechazar un artículo
  // publicado aunque la solicitud llegara con applyChanges=true).
  return payload.applyChanges === true && result.changesApplied === true ? "applied" : "proposal";
}

async function existingCopyForJob(jobId: string): Promise<AgentCopyHistory | null> {
  const [existing] = await db.select().from(agentCopyHistory).where(eq(agentCopyHistory.sourceJobId, jobId));
  return existing || null;
}

/**
 * Persiste una sola instantánea por trabajo técnico. Un problema en el historial nunca debe
 * convertir un resultado válido del agente en un error para la persona que lo ejecutó.
 */
export async function persistAgentCopySnapshot(input: PersistCopyInput): Promise<AgentCopyHistory | null> {
  if (!isTextualAgent(input.agentType) || !isRecord(input.result)) return null;
  if (!isRecognizableResult(input.agentType, input.result)) return null;

  const existing = await existingCopyForJob(input.jobId);
  if (existing) return existing;

  const content = input.agentType === "legal_alerts"
    ? await legalAlertSnapshot(input.result)
    : sanitizeValue(input.result) as JsonRecord;
  const serialized = JSON.stringify(content);
  if (Buffer.byteLength(serialized, "utf8") > MAX_SNAPSHOT_BYTES) return null;

  const text = snapshotText(content);
  if (!text) return null;
  const articleId = await existingArticleId(inferredArticleId(input.payload, input.result));
  const [created] = await db.insert(agentCopyHistory).values({
    sourceJobId: input.jobId,
    agentType: input.agentType,
    copyType: COPY_TYPE[input.agentType],
    title: titleFor(input.agentType, content),
    excerpt: firstText(content).slice(0, 420) || null,
    content,
    searchText: text,
    language: inferredLanguage(input.payload, input.result),
    articleId,
    status: resolvedStatus(input.agentType, input.payload, input.result, input.origin),
    origin: input.origin,
    actorId: input.actorId || null,
    createdAt: input.completedAt || new Date(),
  }).onConflictDoNothing({ target: agentCopyHistory.sourceJobId }).returning();

  return created || existingCopyForJob(input.jobId);
}

/** Recupera resultados ya terminados de agent_jobs sin fabricar copys incompletos. */
export async function recoverHistoricalAgentCopies(): Promise<number> {
  const missing = await db.select({
      id: agentJobs.id,
      agentType: agentJobs.agentType,
      payload: agentJobs.payload,
      result: agentJobs.result,
      completedAt: agentJobs.completedAt,
  }).from(agentJobs)
    .leftJoin(agentCopyHistory, eq(agentCopyHistory.sourceJobId, agentJobs.id))
    .where(and(
      eq(agentJobs.status, "completed"),
      inArray(agentJobs.agentType, [...TEXTUAL_AGENT_TYPES]),
      isNull(agentCopyHistory.id),
    ))
    .orderBy(desc(agentJobs.completedAt));
  let recovered = 0;
  for (const job of missing) {
    const saved = await persistAgentCopySnapshot({
      jobId: job.id,
      agentType: job.agentType as AgentType,
      payload: isRecord(job.payload) ? job.payload : {},
      result: job.result,
      completedAt: job.completedAt || undefined,
      origin: "recovered",
    });
    if (saved) recovered++;
  }
  return recovered;
}

export async function listAgentCopies(filters: CopyHistoryFilters = {}) {
  const page = Math.max(1, Math.floor(filters.page || 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(filters.pageSize || 25)));
  const conditions = [];
  if (filters.search) {
    const search = `%${filters.search.trim().slice(0, 160)}%`;
    conditions.push(or(ilike(agentCopyHistory.title, search), ilike(agentCopyHistory.searchText, search))!);
  }
  if (filters.agentType && isTextualAgent(filters.agentType)) conditions.push(eq(agentCopyHistory.agentType, filters.agentType));
  if (filters.copyType) conditions.push(eq(agentCopyHistory.copyType, filters.copyType.slice(0, 80)));
  if (filters.language) conditions.push(eq(agentCopyHistory.language, filters.language.slice(0, 12)));
  if (filters.articleId) conditions.push(eq(agentCopyHistory.articleId, filters.articleId));
  if (filters.status && ["proposal", "applied", "draft", "recovered"].includes(filters.status)) conditions.push(eq(agentCopyHistory.status, filters.status));
  if (typeof filters.archived === "boolean") conditions.push(eq(agentCopyHistory.archived, filters.archived));
  if (filters.from) conditions.push(gte(agentCopyHistory.createdAt, filters.from));
  if (filters.to) conditions.push(lte(agentCopyHistory.createdAt, filters.to));
  if (filters.sourceJobId) conditions.push(eq(agentCopyHistory.sourceJobId, filters.sourceJobId));
  const where = conditions.length ? and(...conditions) : undefined;

  const items = await db.select({
    id: agentCopyHistory.id,
    sourceJobId: agentCopyHistory.sourceJobId,
    agentType: agentCopyHistory.agentType,
    copyType: agentCopyHistory.copyType,
    title: agentCopyHistory.title,
    excerpt: agentCopyHistory.excerpt,
    language: agentCopyHistory.language,
    articleId: agentCopyHistory.articleId,
    articleTitle: news.title,
    articleTitleEs: news.titleEs,
    articleSlug: news.slug,
    status: agentCopyHistory.status,
    origin: agentCopyHistory.origin,
    archived: agentCopyHistory.archived,
    createdAt: agentCopyHistory.createdAt,
    actorName: adminUsers.username,
  }).from(agentCopyHistory)
    .leftJoin(news, eq(agentCopyHistory.articleId, news.id))
    .leftJoin(adminUsers, eq(agentCopyHistory.actorId, adminUsers.id))
    .where(where)
    .orderBy(desc(agentCopyHistory.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  const [totalRow] = await db.select({ total: count() }).from(agentCopyHistory).where(where);
  return { items, page, pageSize, total: totalRow?.total || 0 };
}

export async function getAgentCopy(id: string) {
  const [item] = await db.select({
    id: agentCopyHistory.id,
    sourceJobId: agentCopyHistory.sourceJobId,
    agentType: agentCopyHistory.agentType,
    copyType: agentCopyHistory.copyType,
    title: agentCopyHistory.title,
    excerpt: agentCopyHistory.excerpt,
    content: agentCopyHistory.content,
    searchText: agentCopyHistory.searchText,
    language: agentCopyHistory.language,
    articleId: agentCopyHistory.articleId,
    articleTitle: news.title,
    articleTitleEs: news.titleEs,
    articleSlug: news.slug,
    status: agentCopyHistory.status,
    origin: agentCopyHistory.origin,
    archived: agentCopyHistory.archived,
    archivedAt: agentCopyHistory.archivedAt,
    createdAt: agentCopyHistory.createdAt,
    actorName: adminUsers.username,
  }).from(agentCopyHistory)
    .leftJoin(news, eq(agentCopyHistory.articleId, news.id))
    .leftJoin(adminUsers, eq(agentCopyHistory.actorId, adminUsers.id))
    .where(eq(agentCopyHistory.id, id));
  return item || null;
}

export async function setAgentCopyArchived(id: string, archived: boolean, actorId: string): Promise<AgentCopyHistory | null> {
  const [updated] = await db.update(agentCopyHistory).set({
    archived,
    archivedAt: archived ? new Date() : null,
    archivedBy: archived ? actorId : null,
  }).where(eq(agentCopyHistory.id, id)).returning();
  return updated || null;
}

export async function getCopyIdsByJobIds(jobIds: string[]): Promise<Map<string, string>> {
  if (!jobIds.length) return new Map();
  const rows = await db.select({ id: agentCopyHistory.id, sourceJobId: agentCopyHistory.sourceJobId })
    .from(agentCopyHistory)
    .where(inArray(agentCopyHistory.sourceJobId, jobIds));
  return new Map(rows.flatMap((row) => row.sourceJobId ? [[row.sourceJobId, row.id] as const] : []));
}

export function copyPlainText(content: unknown): string {
  return snapshotText(isRecord(content) ? content : { content });
}
