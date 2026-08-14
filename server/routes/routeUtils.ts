import type { Response } from "express";

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

export function auditLog(
  action: "create" | "update" | "delete",
  resource: string,
  resourceId: string | null,
  userId: string,
  details?: Record<string, unknown>,
): void {
  const entry: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    action,
    resource,
    resourceId,
    userId,
  };
  if (details) entry.details = details;
  console.log("[AUDIT]", JSON.stringify(entry));
}
