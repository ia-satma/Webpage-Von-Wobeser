import type { Request, Response } from "express";
import { recordAdminAuditEvent } from "../security/adminAudit";

const requestsWithDurableAudit = new WeakSet<Request>();

export function hasDurableAuditForRequest(req: Request): boolean {
  return requestsWithDurableAudit.has(req);
}

export type LinguisticField = { field: string; lang: "es" | "en"; text: unknown };

export async function getLinguisticWarnings(fields: LinguisticField[]) {
  const { analyzeLinguisticText } = await import("../audits/linguisticAudit");
  return fields.flatMap(({ field, lang, text }) =>
    analyzeLinguisticText(text, lang).map((finding) => ({ field, lang, ...finding })),
  );
}

export function apiError(res: Response, status: number, message: string, details?: unknown): void {
  const body: Record<string, unknown> = { error: message };
  if (details !== undefined) body.details = details;
  res.status(status).json(body);
}

export async function auditLog(
  action: "create" | "update" | "delete",
  resource: string,
  resourceId: string | null,
  userId: string,
  details?: Record<string, unknown>,
  req?: Request,
): Promise<void> {
  try {
    await recordAdminAuditEvent({ action, resource, resourceId, actorId: userId, details });
    if (req) requestsWithDurableAudit.add(req);
  } catch {
    // La acción de negocio ya pudo haberse confirmado. No se repite ni se
    // revierte automáticamente y tampoco se imprime el payload o el error.
    console.error("[AUDIT] durable write failed");
  }
}
