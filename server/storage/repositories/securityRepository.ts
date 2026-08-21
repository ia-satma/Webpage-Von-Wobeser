import { and, asc, desc, eq, gt, inArray, ne, sql } from "drizzle-orm";
import { type AdminUser, type InsertAdminUser, type InsertAdminLoginEvent, type AdminSession, type InsertAdminSession, type AdminMfaCredential, type InsertAdminMfaCredential, type AdminAuthChallenge, type InsertAdminAuthChallenge, adminUsers, adminLoginEvents, adminSessions, adminMfaCredentials, adminAuthChallenges, securityRateLimits } from "@shared/schema";
import type { StorageDatabase } from "../types";
import type { AdminLoginEventWithIdentity } from "../contracts";

export function createSecurityRepository(db: StorageDatabase) {
  class SecurityRepository {
    // Admin User CRUD
    async getAdminUser(id: string): Promise<AdminUser | undefined> {
      const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
      return user;
    }

    async getAdminUserByUsername(username: string): Promise<AdminUser | undefined> {
      const [user] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
      return user;
    }

    async getAdminUserByEmail(email: string): Promise<AdminUser | undefined> {
      const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
      return user;
    }

    async countAdminUsers(): Promise<number> {
      const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(adminUsers);
      return row?.count ?? 0;
    }

    async createAdminUser(user: InsertAdminUser): Promise<AdminUser> {
      const [item] = await db.insert(adminUsers).values(user).returning();
      return item;
    }

    async updateAdminUserLogin(id: string): Promise<AdminUser | undefined> {
      const [user] = await db
        .update(adminUsers)
        .set({ lastLogin: new Date() })
        .where(eq(adminUsers.id, id))
        .returning();
      return user;
    }

    /** Lista de usuarios del panel — SIN passwordHash (nunca se expone el hash). */
    async getAdminUsers(): Promise<Omit<AdminUser, "passwordHash">[]> {
      return db
        .select({
          id: adminUsers.id,
          username: adminUsers.username,
          email: adminUsers.email,
          role: adminUsers.role,
          permissions: adminUsers.permissions,
          createdAt: adminUsers.createdAt,
          lastLogin: adminUsers.lastLogin,
          isActive: adminUsers.isActive,
          mustChangePassword: adminUsers.mustChangePassword,
          passwordChangedAt: adminUsers.passwordChangedAt,
        })
        .from(adminUsers)
        .orderBy(asc(adminUsers.createdAt));
    }

    async updateAdminUser(
      id: string,
      data: Partial<Pick<AdminUser, "role" | "isActive" | "permissions" | "mustChangePassword" | "passwordChangedAt">>,
    ): Promise<AdminUser | undefined> {
      const [user] = await db.update(adminUsers).set(data).where(eq(adminUsers.id, id)).returning();
      return user;
    }

    async setAdminUserPassword(id: string, passwordHash: string, mustChangePassword = false): Promise<boolean> {
      const res = await db
        .update(adminUsers)
        .set({ passwordHash, mustChangePassword, passwordChangedAt: new Date() })
        .where(eq(adminUsers.id, id))
        .returning();
      return res.length > 0;
    }

    async deleteAdminUser(id: string): Promise<boolean> {
      const res = await db.delete(adminUsers).where(eq(adminUsers.id, id)).returning();
      return res.length > 0;
    }

    // --- Historial de inicios de sesión (persistente; nunca guarda contraseñas) ---
    async recordLoginEvent(data: InsertAdminLoginEvent): Promise<void> {
      await db.insert(adminLoginEvents).values(data);
    }

    async getLoginEvents(limit = 100): Promise<AdminLoginEventWithIdentity[]> {
      return db
        .select({
          id: adminLoginEvents.id,
          userId: adminLoginEvents.userId,
          email: adminLoginEvents.email,
          success: adminLoginEvents.success,
          ipAddress: adminLoginEvents.ipAddress,
          userAgent: adminLoginEvents.userAgent,
          createdAt: adminLoginEvents.createdAt,
          userEmail: adminUsers.email,
          username: adminUsers.username,
          userRole: adminUsers.role,
          userExists: sql<boolean>`${adminUsers.id} IS NOT NULL`,
        })
        .from(adminLoginEvents)
        .leftJoin(adminUsers, eq(adminLoginEvents.userId, adminUsers.id))
        .orderBy(desc(adminLoginEvents.createdAt))
        .limit(limit);
    }

    async cleanExpiredSecurityRecords(): Promise<{ loginEvents: number; challenges: number; rateLimits: number }> {
      return db.transaction(async (tx) => {
        const loginEvents = await tx.delete(adminLoginEvents)
          .where(sql`${adminLoginEvents.createdAt} < NOW() - INTERVAL '90 days'`)
          .returning({ id: adminLoginEvents.id });
        const challenges = await tx.delete(adminAuthChallenges)
          .where(sql`${adminAuthChallenges.expiresAt} < NOW()`)
          .returning({ id: adminAuthChallenges.id });
        const rateLimits = await tx.delete(securityRateLimits)
          .where(sql`${securityRateLimits.updatedAt} < NOW() - INTERVAL '2 days'`)
          .returning({ key: securityRateLimits.keyHash });
        return {
          loginEvents: loginEvents.length,
          challenges: challenges.length,
          rateLimits: rateLimits.length,
        };
      });
    }

    // Admin Sessions
    async createAdminSession(session: InsertAdminSession, maximumActiveSessions: 1 | 2): Promise<AdminSession> {
      // El lock es por usuario — no global — para que dos inicios de sesión de la
      // misma cuenta no rebasen la cuota al ocurrir simultáneamente en instancias
      // distintas de Replit. Otras cuentas pueden iniciar sesión en paralelo.
      return db.transaction(async (tx) => {
        await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${`admin-session:${session.userId}`}, 0))`);
        await tx.delete(adminSessions).where(and(
          eq(adminSessions.userId, session.userId),
          sql`${adminSessions.expiresAt} < NOW() OR ${adminSessions.absoluteExpiresAt} < NOW()`,
        ));

        const [created] = await tx.insert(adminSessions).values(session).returning();
        const activeOlderSessions = await tx
          .select({ id: adminSessions.id })
          .from(adminSessions)
          .where(and(
            eq(adminSessions.userId, session.userId),
            ne(adminSessions.id, created.id),
            gt(adminSessions.expiresAt, new Date()),
            gt(adminSessions.absoluteExpiresAt, new Date()),
          ))
          .orderBy(desc(adminSessions.lastSeenAt), desc(adminSessions.createdAt));

        const sessionsToRevoke = activeOlderSessions.slice(Math.max(0, maximumActiveSessions - 1));
        if (sessionsToRevoke.length > 0) {
          await tx.delete(adminSessions).where(inArray(adminSessions.id, sessionsToRevoke.map((entry) => entry.id)));
        }
        return created;
      });
    }

    async getAdminSession(tokenHash: string): Promise<AdminSession | undefined> {
      const [session] = await db.select().from(adminSessions).where(eq(adminSessions.tokenHash, tokenHash));
      return session;
    }

    async touchAdminSession(id: string, expiresAt: Date): Promise<void> {
      await db.update(adminSessions).set({ expiresAt, lastSeenAt: new Date() }).where(eq(adminSessions.id, id));
    }

    async rotateAdminSessionCsrf(id: string, csrfTokenHash: string): Promise<void> {
      await db.update(adminSessions).set({ csrfTokenHash }).where(eq(adminSessions.id, id));
    }

    async deleteAdminSession(tokenHash: string): Promise<boolean> {
      const result = await db.delete(adminSessions).where(eq(adminSessions.tokenHash, tokenHash)).returning();
      return result.length > 0;
    }

    async deleteAdminSessionsByUserId(userId: string): Promise<number> {
      const result = await db.delete(adminSessions).where(eq(adminSessions.userId, userId)).returning();
      return result.length;
    }

    async getActiveAdminSessionsByUserId(userId: string): Promise<AdminSession[]> {
      const now = new Date();
      return db
        .select()
        .from(adminSessions)
        .where(and(
          eq(adminSessions.userId, userId),
          gt(adminSessions.expiresAt, now),
          gt(adminSessions.absoluteExpiresAt, now),
        ))
        .orderBy(desc(adminSessions.lastSeenAt), desc(adminSessions.createdAt));
    }

    async deleteOtherAdminSessionsByUserId(userId: string, currentSessionId: string): Promise<number> {
      const result = await db.delete(adminSessions).where(and(
        eq(adminSessions.userId, userId),
        ne(adminSessions.id, currentSessionId),
      )).returning({ id: adminSessions.id });
      return result.length;
    }

    async deleteAdminSessionByIdForUser(sessionId: string, userId: string): Promise<boolean> {
      const result = await db.delete(adminSessions).where(and(
        eq(adminSessions.id, sessionId),
        eq(adminSessions.userId, userId),
      )).returning({ id: adminSessions.id });
      return result.length > 0;
    }

    async cleanExpiredSessions(): Promise<number> {
      const result = await db
        .delete(adminSessions)
        .where(sql`${adminSessions.expiresAt} < NOW() OR (${adminSessions.absoluteExpiresAt} IS NOT NULL AND ${adminSessions.absoluteExpiresAt} < NOW())`)
        .returning();
      return result.length;
    }

    async getAdminMfaCredential(userId: string): Promise<AdminMfaCredential | undefined> {
      const [credential] = await db.select().from(adminMfaCredentials).where(eq(adminMfaCredentials.userId, userId));
      return credential;
    }

    async upsertAdminMfaCredential(data: InsertAdminMfaCredential): Promise<AdminMfaCredential> {
      const [credential] = await db
        .insert(adminMfaCredentials)
        .values(data)
        .onConflictDoUpdate({
          target: adminMfaCredentials.userId,
          set: {
            encryptedSecret: data.encryptedSecret,
            recoveryCodeHashes: data.recoveryCodeHashes,
            enabledAt: data.enabledAt,
            updatedAt: new Date(),
          },
        })
        .returning();
      return credential;
    }

    async updateAdminMfaCredential(
      userId: string,
      data: Partial<Pick<AdminMfaCredential, "encryptedSecret" | "recoveryCodeHashes" | "enabledAt">>,
    ): Promise<AdminMfaCredential | undefined> {
      const [credential] = await db
        .update(adminMfaCredentials)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(adminMfaCredentials.userId, userId))
        .returning();
      return credential;
    }

    async createAdminAuthChallenge(data: InsertAdminAuthChallenge): Promise<AdminAuthChallenge> {
      const [challenge] = await db.insert(adminAuthChallenges).values(data).returning();
      return challenge;
    }

    async getAdminAuthChallenge(tokenHash: string): Promise<AdminAuthChallenge | undefined> {
      const [challenge] = await db.select().from(adminAuthChallenges).where(eq(adminAuthChallenges.tokenHash, tokenHash));
      return challenge;
    }

    async updateAdminAuthChallengeAttempts(id: string, attempts: number): Promise<void> {
      await db.update(adminAuthChallenges).set({ attempts }).where(eq(adminAuthChallenges.id, id));
    }

    async deleteAdminAuthChallenge(tokenHash: string): Promise<void> {
      await db.delete(adminAuthChallenges).where(eq(adminAuthChallenges.tokenHash, tokenHash));
    }

    async deleteAdminAuthChallengesByUserId(userId: string): Promise<void> {
      await db.delete(adminAuthChallenges).where(eq(adminAuthChallenges.userId, userId));
    }
  }

  return new SecurityRepository();
}
