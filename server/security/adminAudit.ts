import { and, desc, eq, sql, type SQL } from "drizzle-orm";
import { adminAuditEvents } from "@shared/schema";
import { db } from "../db";

export type SafeAuditPrimitive = string | number | boolean | null;
export type SafeAuditDetails = Record<string, SafeAuditPrimitive>;

const SAFE_LABEL = /^[a-z0-9][a-z0-9_.:-]{0,79}$/i;
const SAFE_IDENTIFIER = /^[a-z0-9][a-z0-9_.:-]{0,127}$/i;
const BLOCKED_DETAIL_KEY = /(?:auth|body|content|cookie|credential|cv|document|email|file|ip|mail|message|name|pass|phone|prompt|secret|text|token)/i;

function safeLabel(value: unknown, field: string): string {
  const normalized = String(value ?? "").trim();
  if (!SAFE_LABEL.test(normalized)) throw new Error(`Invalid audit ${field}`);
  return normalized;
}

function safeIdentifier(value: unknown): string | null {
  if (value === null || value === undefined || value === "" || value === "unknown") return null;
  const normalized = String(value).trim();
  return SAFE_IDENTIFIER.test(normalized) ? normalized : null;
}

/**
 * Conserva únicamente un conjunto pequeño de metadatos escalares. Los cuerpos,
 * nombres, correos, archivos, prompts, credenciales e identificadores de red se
 * descartan aun cuando un caller intente agregarlos por accidente.
 */
export function sanitizeAuditDetails(details?: Record<string, unknown>): SafeAuditDetails {
  if (!details) return {};
  const safe: SafeAuditDetails = {};
  for (const key of Object.keys(details).sort().slice(0, 20)) {
    if (!SAFE_LABEL.test(key) || BLOCKED_DETAIL_KEY.test(key)) continue;
    const value = details[key];
    if (value === null || typeof value === "boolean") {
      safe[key] = value;
    } else if (typeof value === "number" && Number.isFinite(value)) {
      safe[key] = value;
    } else if (typeof value === "string" && SAFE_IDENTIFIER.test(value)) {
      safe[key] = value;
    }
  }
  return safe;
}

export function auditResourceFromRoute(baseUrl: unknown, routePath: unknown): string {
  const template = `${String(baseUrl || "")}/${String(routePath || "admin-mutation")}`
    .toLowerCase()
    .replace(/:[a-z0-9_]+/g, "item")
    .replace(/^\/*api\/*/, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
  return SAFE_LABEL.test(template) ? template : "admin_mutation";
}

export async function recordAdminAuditEvent(input: {
  action: "create" | "update" | "delete";
  resource: string;
  resourceId: string | null;
  actorId: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  await db.insert(adminAuditEvents).values({
    action: safeLabel(input.action, "action"),
    resource: safeLabel(input.resource, "resource"),
    resourceId: safeIdentifier(input.resourceId),
    actorId: safeIdentifier(input.actorId),
    details: sanitizeAuditDetails(input.details),
  });
}

export async function listAdminAuditEvents(input: {
  page: number;
  limit: number;
  action?: string;
  resource?: string;
  actorId?: string;
}): Promise<{ events: Array<typeof adminAuditEvents.$inferSelect>; total: number }> {
  const conditions: SQL[] = [];
  if (input.action) conditions.push(eq(adminAuditEvents.action, safeLabel(input.action, "action")));
  if (input.resource) conditions.push(eq(adminAuditEvents.resource, safeLabel(input.resource, "resource")));
  if (input.actorId) {
    const actorId = safeIdentifier(input.actorId);
    if (!actorId) return { events: [], total: 0 };
    conditions.push(eq(adminAuditEvents.actorId, actorId));
  }
  const where = conditions.length ? and(...conditions) : undefined;
  const offset = (input.page - 1) * input.limit;

  const rowsBase = db.select().from(adminAuditEvents);
  const countBase = db.select({ count: sql<number>`count(*)::int` }).from(adminAuditEvents);
  const [events, countRows] = await Promise.all([
    (where ? rowsBase.where(where) : rowsBase)
      .orderBy(desc(adminAuditEvents.createdAt), desc(adminAuditEvents.id))
      .limit(input.limit)
      .offset(offset),
    where ? countBase.where(where) : countBase,
  ]);
  return { events, total: countRows[0]?.count ?? 0 };
}
