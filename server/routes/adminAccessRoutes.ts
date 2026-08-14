import type { Express, NextFunction, Request, Response } from "express";
import { adminLoginSchema, apiUsage } from "@shared/schema";
import { gte, sql } from "drizzle-orm";
import { z } from "zod";
import {
  SESSION_COOKIE,
  CHALLENGE_COOKIE,
  adminSessionUserPayload,
  authCookieOptions,
  authMiddleware,
  checkRateLimit,
  clearAuthCookie,
  comparePassword,
  deriveCsrfToken,
  generateAdminPassword,
  generateToken,
  getAbsoluteSessionExpiry,
  getSessionExpiry,
  hashOpaqueToken,
  hashPassword,
  passwordNeedsRehash,
  readCookie,
  recordLoginAttempt,
  rehashVerifiedPassword,
  requirePermission,
  requireRole,
  sanitizeGrants,
  validateNewPassword,
} from "../auth";
import { db } from "../db";
import { smartImageGenerator } from "../services/SmartImageGenerator";
import { storage } from "../storage";
import { apiError, auditLog } from "./routeUtils";

export async function registerAdminAccessRoutes(app: Express): Promise<void> {
  // =============================================
  // ADMIN ROUTES
  // =============================================

  // No existe un endpoint público de inicialización. El primer Dueño se crea
  // exclusivamente desde ADMIN_EMAIL + ADMIN_BOOTSTRAP_PASSWORD en Replit Secrets.
  app.all("/api/admin/init", (_req: Request, res: Response) => {
    res.status(410).json({ error: "Initialization endpoint retired" });
  });

  const dummyPasswordHash = await hashPassword("Timing!9vQ2xK7mP");
  const isPendingSchemaMigration = (error: unknown): boolean => {
    const code = (error as { code?: string; cause?: { code?: string } } | null)?.cause?.code
      || (error as { code?: string } | null)?.code;
    return code === "42703" || code === "42P01" || code === "23502";
  };
  const requireSameOrigin = (req: Request, res: Response, next: NextFunction) => {
    const fetchSite = req.header("sec-fetch-site");
    if (fetchSite === "cross-site") {
      return res.status(403).json({ error: "Origin not allowed", code: "ORIGIN_INVALID" });
    }
    const origin = req.header("origin");
    if (!origin) return next(); // CLI, app nativa y pruebas autorizadas no siempre lo envían.
    try {
      const host = req.header("host");
      if (!host || new URL(origin).host !== host) {
        return res.status(403).json({ error: "Origin not allowed", code: "ORIGIN_INVALID" });
      }
      next();
    } catch {
      return res.status(403).json({ error: "Origin not allowed", code: "ORIGIN_INVALID" });
    }
  };

  const createAuthenticatedSession = async (
    res: Response,
    user: {
      id: string;
      username: string;
      email: string;
      role: string;
      permissions: string[] | null;
    },
    ipAddress: string,
    userAgent: string | null,
  ) => {
    const rawToken = generateToken();
    const csrfToken = deriveCsrfToken(rawToken);
    await storage.createAdminSession({
      userId: user.id,
      tokenHash: hashOpaqueToken(rawToken),
      csrfTokenHash: hashOpaqueToken(csrfToken),
      expiresAt: getSessionExpiry(),
      absoluteExpiresAt: getAbsoluteSessionExpiry(),
      lastSeenAt: new Date(),
      // Se conserva la columna histórica para compatibilidad de esquema. MFA está
      // retirado del flujo activo y este valor ya no controla el acceso.
      mfaVerified: true,
      ipAddress,
      userAgent,
    });
    res.cookie(SESSION_COOKIE, rawToken, authCookieOptions(8 * 60 * 60 * 1000));
    return {
      csrfToken,
      user: adminSessionUserPayload(user),
    };
  };

  // Admin Login: nunca devuelve el token de sesión. La sesión final viaja
  // exclusivamente en una cookie HttpOnly.
  app.post("/api/admin/login", requireSameOrigin, async (req: Request, res: Response) => {
    try {
      res.setHeader("Cache-Control", "no-store");
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      const userAgent = req.headers["user-agent"] || null;

      // Registro persistente de accesos (éxitos y fallos). NUNCA guarda contraseñas.
      // Envuelto para que un fallo del log jamás rompa el inicio de sesión.
      const logLogin = async (email: string, success: boolean, userId: string | null = null) => {
        try {
          const identifierHash = hashOpaqueToken(`login:${String(email).trim().toLowerCase()}`);
          const ipHash = hashOpaqueToken(`ip:${ip}`);
          await storage.recordLoginEvent({
            userId,
            // Nombre histórico de columna; contiene un hash SHA-256, nunca el correo.
            email: identifierHash,
            success,
            ipAddress: ipHash,
            userAgent: userAgent?.slice(0, 512) || null,
          });
        } catch (e) {
          console.error("recordLoginEvent failed");
        }
      };

      // Check rate limit
      const attemptedIdentifier = String(req.body?.username || "").trim().toLowerCase();
      const rateIdentifier = `${ip}|${attemptedIdentifier}`;
      const rateCheck = await checkRateLimit(rateIdentifier);
      if (!rateCheck.allowed) {
        console.warn("[SECURITY_ALERT] Login rate limit triggered");
        res.setHeader("Retry-After", String(rateCheck.retryAfter || 60));
        return res.status(429).json({
          error: "Too many login attempts",
          code: "LOGIN_RATE_LIMITED",
          retryAfter: rateCheck.retryAfter,
        });
      }

      // Validate input
      const validation = adminLoginSchema.safeParse(req.body);
      if (!validation.success) {
        await recordLoginAttempt(rateIdentifier, false);
        await logLogin(String((req.body && req.body.username) || ""), false);
        return res.status(400).json({ error: "Invalid credentials", code: "INVALID_CREDENTIALS" });
      }

      const { username, password } = validation.data;

      // Find user by email or username
      let user = await storage.getAdminUserByEmail(username);
      if (!user) {
        user = await storage.getAdminUserByUsername(username);
      }
      if (!user) {
        await comparePassword(password, dummyPasswordHash);
        await recordLoginAttempt(rateIdentifier, false);
        await logLogin(username, false);
        return res.status(401).json({ error: "Invalid credentials", code: "INVALID_CREDENTIALS" });
      }

      // Check if user is active
      if (!user.isActive) {
        await comparePassword(password, dummyPasswordHash);
        await recordLoginAttempt(rateIdentifier, false);
        await logLogin(user.email, false, user.id);
        return res.status(401).json({ error: "Invalid credentials", code: "INVALID_CREDENTIALS" });
      }

      // Verify password
      const validPassword = await comparePassword(password, user.passwordHash);
      if (!validPassword) {
        await recordLoginAttempt(rateIdentifier, false);
        await logLogin(user.email, false, user.id);
        return res.status(401).json({ error: "Invalid credentials", code: "INVALID_CREDENTIALS" });
      }

      await recordLoginAttempt(rateIdentifier, true);
      await logLogin(user.email, true, user.id);
      await storage.updateAdminUserLogin(user.id);

      // Migración perezosa: cualquier bcrypt heredado pasa a Argon2id después de
      // verificarlo. La política de altas no bloquea el login de credenciales antiguas.
      if (passwordNeedsRehash(user.passwordHash)) {
        await storage.setAdminUserPassword(user.id, await rehashVerifiedPassword(password), false);
        user = (await storage.getAdminUser(user.id)) || user;
      }

      // Cualquier desafío antiguo queda inutilizado. Las credenciales TOTP
      // cifradas se conservan en la base como respaldo, pero ya no participan.
      await storage.deleteAdminAuthChallengesByUserId(user.id);
      clearAuthCookie(res, CHALLENGE_COOKIE);
      const sessionPayload = await createAuthenticatedSession(res, user, ip, userAgent);
      return res.json({ authenticated: true, ...sessionPayload });
    } catch (error) {
      console.error("Login error:", error instanceof Error ? error.message : "unknown");
      if (isPendingSchemaMigration(error)) {
        return res.status(503).json({
          error: "El panel requiere completar una actualización de base de datos",
          code: "SCHEMA_MIGRATION_REQUIRED",
        });
      }
      res.status(500).json({ error: "Login failed", code: "LOGIN_FAILED" });
    }
  });

  const retiredMfaApi = (_req: Request, res: Response) => {
    clearAuthCookie(res, CHALLENGE_COOKIE);
    res.status(410).json({
      error: "Two-step verification has been retired",
      code: "MFA_RETIRED",
    });
  };
  app.all(
    ["/api/admin/mfa/enroll", "/api/admin/mfa/verify", "/api/admin/mfa/recovery"],
    requireSameOrigin,
    retiredMfaApi,
  );

  // Contador de gasto ESTIMADO de la API de IA. OpenAI no expone el saldo por API key, así que
  // esto suma tokens/imágenes de NUESTRAS llamadas por el precio conocido del modelo (aproximado).
  app.get("/api/admin/usage/summary", authMiddleware, requireRole("super_admin", "admin"), async (_req: Request, res: Response) => {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const byKind = await db
        .select({
          kind: apiUsage.kind,
          cost: sql<number>`coalesce(sum(${apiUsage.costUsd}), 0)`,
          calls: sql<number>`count(*)::int`,
        })
        .from(apiUsage)
        .where(gte(apiUsage.createdAt, monthStart))
        .groupBy(apiUsage.kind);
      const [totals] = await db
        .select({
          month: sql<number>`coalesce(sum(case when ${apiUsage.createdAt} >= ${monthStart} then ${apiUsage.costUsd} else 0 end), 0)`,
          total: sql<number>`coalesce(sum(${apiUsage.costUsd}), 0)`,
          calls: sql<number>`count(*)::int`,
        })
        .from(apiUsage);
      res.json({
        month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
        monthUsd: Number(totals?.month || 0),
        totalUsd: Number(totals?.total || 0),
        totalCalls: Number(totals?.calls || 0),
        byKind: byKind.map((r) => ({ kind: r.kind, costUsd: Number(r.cost), calls: Number(r.calls) })),
      });
    } catch (error) {
      console.error("Usage summary error:", error);
      res.status(500).json({ error: "Error al calcular el gasto" });
    }
  });

  // Generador de imágenes con IA a demanda (editor de noticias, redes, galería). Recibe un
  // prompt/tema + formato opcional (1:1 / 16:9 / 9:16) y devuelve la URL de la imagen generada.
  app.post("/api/admin/generate-image", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const { prompt, aspect } = (req.body || {}) as { prompt?: string; aspect?: string };
      if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
        return res.status(400).json({ error: "Falta el tema/prompt de la imagen" });
      }
      const result = await smartImageGenerator.generateImage(
        prompt.trim().substring(0, 800),
        `manual-${Date.now()}`,
        typeof aspect === "string" ? aspect : undefined,
      );
      if (!result.success || result.engine === "placeholder") {
        return res.status(502).json({ error: "No se pudo generar la imagen. Revisa la configuración del proveedor." });
      }
      res.json({ imageUrl: result.imageUrl, engine: result.engine });
    } catch {
      res.status(500).json({ error: "Error al generar la imagen" });
    }
  });

  // Estado de sesión: deriva el mismo token CSRF para todas las pestañas de esta
  // sesión. La cookie HttpOnly nunca se expone y PostgreSQL conserva solo el hash.
  app.get("/api/admin/session", authMiddleware, async (req: Request, res: Response) => {
    const user = req.adminUser!;
    const rawSessionToken = readCookie(req, SESSION_COOKIE);
    if (!rawSessionToken) return res.status(401).json({ error: "Authentication required" });
    const csrfToken = deriveCsrfToken(rawSessionToken);
    await storage.rotateAdminSessionCsrf(req.adminSession!.id, hashOpaqueToken(csrfToken));
    res.setHeader("Cache-Control", "no-store");
    res.json({
      authenticated: true,
      csrfToken,
      user: adminSessionUserPayload(user),
    });
  });

  // Perfil del usuario autenticado + sus permisos EFECTIVOS.
  app.get("/api/admin/me", authMiddleware, async (req: Request, res: Response) => {
    const u = req.adminUser!;
    res.json(adminSessionUserPayload(u));
  });

  // Historial de accesos (solo admin/dueño). Nunca expone contraseñas.
  app.get("/api/admin/login-log", authMiddleware, requireRole("super_admin", "admin"), async (req: Request, res: Response) => {
    try {
      const parsed = z.coerce.number().int().min(1).max(500).default(100).safeParse(req.query.limit);
      if (!parsed.success) return res.status(400).json({ error: "Invalid limit" });
      res.json(await storage.getLoginEvents(parsed.data));
    } catch (error) {
      console.error("Login log error:", error);
      return apiError(res, 500, "Failed to load login log");
    }
  });

  // =============================================
  // ADMIN USERS — gestión de accesos (solo admin/dueño)
  // =============================================
  const MANAGEABLE_ROLES = ["super_admin", "admin", "editor", "marketing", "sistemas"];
  const isPrivileged = (r: string) => r === "super_admin" || r === "admin";

  app.get("/api/admin/users", authMiddleware, requirePermission("users"), async (_req: Request, res: Response) => {
    try {
      res.json(await storage.getAdminUsers()); // nunca incluye passwordHash
    } catch (error) {
      console.error("List users error:", error);
      return apiError(res, 500, "Failed to list users");
    }
  });

  app.post("/api/admin/users", authMiddleware, requirePermission("users"), async (req: Request, res: Response) => {
    try {
      const actor = req.adminUser!;
      const parsed = z.object({
        username: z.string().trim().min(1).max(80).optional(),
        email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
        role: z.enum(["super_admin", "admin", "editor", "marketing", "sistemas"]).default("editor"),
      }).strict().safeParse(req.body);
      if (!parsed.success) return apiError(res, 400, "Datos de usuario inválidos");
      const { username, email, role: r } = parsed.data;
      if (!MANAGEABLE_ROLES.includes(r)) return apiError(res, 400, "Rol inválido");
      if (r === "super_admin" && actor.role !== "super_admin") return apiError(res, 403, "Solo un Dueño puede crear otro Dueño");
      const finalUsername = username || email.split("@")[0].toLowerCase();
      const generatedPassword = generateAdminPassword();
      const passwordHash = await hashPassword(generatedPassword);
      const created = await storage.createAdminUser({
        username: finalUsername,
        email,
        passwordHash,
        role: r,
        isActive: true,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
      } as any);
      if (r === "super_admin") {
        console.warn("[SECURITY_ALERT] A super administrator account was created");
      }
      auditLog("create", "admin_user", created.id, actor?.id || "unknown");
      const { passwordHash: _omit, ...safe } = created as any;
      res.setHeader("Cache-Control", "no-store");
      res.status(201).json({ user: safe, generatedPassword });
    } catch (error: any) {
      if (error?.code === "23505" || /unique|duplicate/i.test(String(error?.message))) {
        return apiError(res, 409, "Ya existe un usuario con ese correo o nombre de usuario");
      }
      console.error("Create user error:", error);
      return apiError(res, 500, "Failed to create user");
    }
  });

  app.put("/api/admin/users/:id", authMiddleware, requirePermission("users"), async (req: Request, res: Response) => {
    try {
      const actor = (req as any).adminUser;
      const idResult = z.string().uuid().safeParse(req.params.id);
      if (!idResult.success) return apiError(res, 400, "Identificador inválido");
      const id = idResult.data;
      const target = await storage.getAdminUser(id);
      if (!target) return apiError(res, 404, "Usuario no encontrado");
      const parsed = z.object({
        role: z.enum(["super_admin", "admin", "editor", "marketing", "sistemas"]).optional(),
        isActive: z.boolean().optional(),
        permissions: z.array(z.string().max(60)).max(20).optional(),
      }).strict().safeParse(req.body);
      if (!parsed.success) return apiError(res, 400, "Datos de usuario inválidos");
      const { role, isActive } = parsed.data;
      if ((target.role === "super_admin" || role === "super_admin") && actor.role !== "super_admin") {
        return apiError(res, 403, "Solo un Dueño puede modificar a un Dueño o asignar ese rol");
      }
      if (role !== undefined && !MANAGEABLE_ROLES.includes(role)) return apiError(res, 400, "Rol inválido");
      if (isActive === false && id === actor.id) return apiError(res, 400, "No puedes desactivar tu propia cuenta");
      // Concesiones extra: solo claves de GRANTABLE (nunca `users` → evita escalada de privilegios).
      const permissions = parsed.data.permissions !== undefined ? sanitizeGrants(parsed.data.permissions) : undefined;
      // Anti-lockout: no dejar 0 administradores/dueños activos.
      const willLosePrivilege = (role !== undefined && !isPrivileged(role)) || isActive === false;
      if (isPrivileged(target.role) && willLosePrivilege) {
        const users = await storage.getAdminUsers();
        const otherActivePriv = users.filter((u) => u.isActive && isPrivileged(u.role) && u.id !== id).length;
        if (otherActivePriv < 1) return apiError(res, 400, "Debe quedar al menos un Administrador/Dueño activo");
      }
      const updated = await storage.updateAdminUser(id, {
        ...(role !== undefined ? { role } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
        ...(permissions !== undefined ? { permissions } : {}),
      });
      if (role === "super_admin" && target.role !== "super_admin") {
        console.warn("[SECURITY_ALERT] An account was promoted to super administrator");
      }
      if (role !== undefined || isActive !== undefined) {
        await storage.deleteAdminSessionsByUserId(id);
        await storage.deleteAdminAuthChallengesByUserId(id);
      }
      auditLog("update", "admin_user", id, actor?.id || "unknown");
      const { passwordHash: _o, ...safe } = (updated as any) || {};
      res.json(safe);
    } catch (error) {
      console.error("Update user error:", error);
      return apiError(res, 500, "Failed to update user");
    }
  });

  app.post("/api/admin/users/:id/password", authMiddleware, requirePermission("users"), async (req: Request, res: Response) => {
    try {
      const actor = (req as any).adminUser;
      const idResult = z.string().uuid().safeParse(req.params.id);
      if (!idResult.success) return apiError(res, 400, "Identificador inválido");
      const target = await storage.getAdminUser(idResult.data);
      if (!target) return apiError(res, 404, "Usuario no encontrado");
      if (target.role === "super_admin" && actor.role !== "super_admin" && target.id !== actor.id) {
        return apiError(res, 403, "Solo un Dueño puede cambiar la contraseña de un Dueño");
      }
      const generatedPassword = generateAdminPassword();
      await storage.setAdminUserPassword(idResult.data, await hashPassword(generatedPassword), false);
      await storage.deleteAdminSessionsByUserId(idResult.data);
      await storage.deleteAdminAuthChallengesByUserId(idResult.data);
      auditLog("update", "admin_user", idResult.data, actor?.id || "unknown");
      res.setHeader("Cache-Control", "no-store");
      res.json({ ok: true, generatedPassword });
    } catch (error) {
      console.error("Reset password error:", error);
      return apiError(res, 500, "Failed to reset password");
    }
  });

  app.delete("/api/admin/users/:id", authMiddleware, requirePermission("users"), async (req: Request, res: Response) => {
    try {
      const actor = (req as any).adminUser;
      const idResult = z.string().uuid().safeParse(req.params.id);
      if (!idResult.success) return apiError(res, 400, "Identificador inválido");
      const id = idResult.data;
      if (id === actor.id) return apiError(res, 400, "No puedes eliminar tu propia cuenta");
      const target = await storage.getAdminUser(id);
      if (!target) return apiError(res, 404, "Usuario no encontrado");
      if (target.role === "super_admin" && actor.role !== "super_admin") return apiError(res, 403, "Solo un Dueño puede eliminar a un Dueño");
      if (isPrivileged(target.role)) {
        const users = await storage.getAdminUsers();
        const otherActivePriv = users.filter((u) => u.isActive && isPrivileged(u.role) && u.id !== id).length;
        if (otherActivePriv < 1) return apiError(res, 400, "Debe quedar al menos un Administrador/Dueño activo");
      }
      await storage.deleteAdminSessionsByUserId(id);
      await storage.deleteAdminAuthChallengesByUserId(id);
      await storage.deleteAdminUser(id);
      auditLog("delete", "admin_user", id, actor?.id || "unknown");
      res.json({ ok: true });
    } catch (error) {
      console.error("Delete user error:", error);
      return apiError(res, 500, "Failed to delete user");
    }
  });

  app.post("/api/admin/password/change", authMiddleware, async (req: Request, res: Response) => {
    try {
      const parsed = z.object({
        currentPassword: z.string().min(1).max(128),
        newPassword: z.string().min(12).max(16),
      }).safeParse(req.body);
      if (!parsed.success) return apiError(res, 400, "La nueva contraseña debe tener entre 12 y 16 caracteres");
      const policy = validateNewPassword(parsed.data.newPassword);
      if (!policy.valid) return apiError(res, 400, policy.error);
      const user = req.adminUser!;
      if (!await comparePassword(parsed.data.currentPassword, user.passwordHash)) {
        return apiError(res, 401, "La contraseña actual no es correcta");
      }
      if (await comparePassword(parsed.data.newPassword, user.passwordHash)) {
        return apiError(res, 400, "La nueva contraseña debe ser diferente");
      }
      await storage.setAdminUserPassword(user.id, await hashPassword(parsed.data.newPassword), false);
      await storage.deleteAdminSessionsByUserId(user.id);
      await storage.deleteAdminAuthChallengesByUserId(user.id);
      clearAuthCookie(res, SESSION_COOKIE);
      auditLog("update", "admin_user_password", user.id, user.id);
      res.json({ ok: true, reauthenticationRequired: true });
    } catch (error) {
      console.error("Password change error:", error instanceof Error ? error.message : "unknown");
      apiError(res, 500, "No se pudo cambiar la contraseña");
    }
  });

  app.post("/api/admin/sessions/revoke-all", authMiddleware, async (req: Request, res: Response) => {
    const count = await storage.deleteAdminSessionsByUserId(req.adminUser!.id);
    await storage.deleteAdminAuthChallengesByUserId(req.adminUser!.id);
    clearAuthCookie(res, SESSION_COOKIE);
    res.json({ ok: true, revoked: count });
  });

  // Admin Logout
  app.post("/api/admin/logout", authMiddleware, async (req: Request, res: Response) => {
    try {
      const rawToken = readCookie(req, SESSION_COOKIE);
      if (rawToken) await storage.deleteAdminSession(hashOpaqueToken(rawToken));
      clearAuthCookie(res, SESSION_COOKIE);
      res.json({ success: true });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });
}
