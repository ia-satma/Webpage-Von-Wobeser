import { and, asc, eq, or, sql } from "drizzle-orm";
import { adminSessions } from "@shared/schema";
import { db } from "../db";

/**
 * Retira sesiones ya vencidas una por una y siempre por su identificador exacto.
 * No toca usuarios, MFA, formularios, CV, contenido ni medios.
 */
export async function deleteExpiredSessionsByExactId(limit = 500): Promise<number> {
  const safeLimit = Math.max(1, Math.min(Math.trunc(limit), 500));
  const isExpired = or(
    sql`${adminSessions.expiresAt} < NOW()`,
    sql`${adminSessions.absoluteExpiresAt} IS NOT NULL AND ${adminSessions.absoluteExpiresAt} < NOW()`,
  );
  const candidates = await db
    .select({ id: adminSessions.id })
    .from(adminSessions)
    .where(isExpired)
    .orderBy(asc(adminSessions.expiresAt))
    .limit(safeLimit);

  let deleted = 0;
  for (const candidate of candidates) {
    const rows = await db
      .delete(adminSessions)
      .where(and(eq(adminSessions.id, candidate.id), isExpired))
      .returning({ id: adminSessions.id });
    deleted += rows.length;
  }
  return deleted;
}
