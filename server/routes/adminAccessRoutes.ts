import type { Express, NextFunction, Request, Response } from "express";
import { adminLoginSchema, apiUsage } from "@shared/schema";
import { gte, sql } from "drizzle-orm";
import { z } from "zod";
import {
  SESSION_COOKIE,
  CHALLENGE_COOKIE,
  PASSWORD_MAX,
  PASSWORD_MIN,
  adminSessionUserPayload,
  authCookieOptions,
  authMiddleware,
  checkRateLimit,
  checkSharedRateLimit,
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
  recordSharedRateLimitAttempt,
  rehashVerifiedPassword,
  requirePermission,
  requireRole,
  sanitizeGrants,
  validateNewPassword,
} from "../auth";
import { db } from "../db";
import {
  consumeRecoveryCode,
  decryptTotpSecret,
  encryptTotpSecret,
  generateRecoveryCodes,
  generateTotpSecret,
  isMfaConfigured,
  isMfaRequiredForRole,
  totpAuthUrl,
  verifyTotp,
} from "../security/mfa";
import { pseudonymizeNetworkAddress } from "../security/privacy";
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
    mfaVerified: boolean,
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
      // Este dato permite auditar si la sesión completó el segundo factor. El
      // middleware siempre valida además la cookie opaca, CSRF y el usuario activo.
      mfaVerified,
      ipAddress: pseudonymizeNetworkAddress(ipAddress),
      userAgent,
    });
    res.cookie(SESSION_COOKIE, rawToken, authCookieOptions(8 * 60 * 60 * 1000));
    return {
      csrfToken,
      user: adminSessionUserPayload(user),
    };
  };

  const issueMfaChallenge = async (
    res: Response,
    userId: string,
    purpose: "mfa" | "enroll",
  ) => {
    // Un solo desafío vigente por usuario: evita que códigos o enlaces previos
    // permanezcan utilizables después de un nuevo intento de acceso.
    await storage.deleteAdminAuthChallengesByUserId(userId);
    const rawToken = generateToken();
    await storage.createAdminAuthChallenge({
      userId,
      tokenHash: hashOpaqueToken(rawToken),
      purpose,
      attempts: 0,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    res.cookie(CHALLENGE_COOKIE, rawToken, authCookieOptions(10 * 60 * 1000));
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

      if (isMfaRequiredForRole(user.role)) {
        // Nunca degradar a solo contraseña si la política ya exige MFA. La clave
        // se instala como Secret independiente en el Repl que recibe el proyecto.
        if (!isMfaConfigured()) {
          console.error("MFA is required but MFA_ENCRYPTION_KEY is unavailable");
          return res.status(503).json({
            error: "Two-step verification is not configured",
            code: "MFA_CONFIGURATION_REQUIRED",
          });
        }
        const credential = await storage.getAdminMfaCredential(user.id);
        const purpose = credential?.enabledAt ? "mfa" : "enroll";
        await issueMfaChallenge(res, user.id, purpose);
        return res.status(202).json({
          authenticated: false,
          mfaRequired: true,
          setupRequired: purpose === "enroll",
        });
      }

      await storage.deleteAdminAuthChallengesByUserId(user.id);
      clearAuthCookie(res, CHALLENGE_COOKIE);
      const sessionPayload = await createAuthenticatedSession(res, user, ip, userAgent, false);
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

  const MFA_CODE_POLICY = { maxAttempts: 5, windowMs: 15 * 60 * 1000, blockDurationMs: 30 * 60 * 1000 };
  const mfaCodeSchema = z.object({
    code: z.string().trim().min(1).max(32),
  });
  const recoveryCodeSchema = z.object({
    recoveryCode: z.string().trim().min(1).max(64),
  });

  const resolveMfaChallenge = async (
    req: Request,
    res: Response,
    purpose: "mfa" | "enroll",
  ) => {
    const rawToken = readCookie(req, CHALLENGE_COOKIE);
    if (!rawToken || rawToken.length < 32 || rawToken.length > 256) {
      clearAuthCookie(res, CHALLENGE_COOKIE);
      return null;
    }
    const tokenHash = hashOpaqueToken(rawToken);
    const challenge = await storage.getAdminAuthChallenge(tokenHash);
    if (
      !challenge
      || challenge.purpose !== purpose
      || challenge.expiresAt <= new Date()
      || challenge.attempts >= MFA_CODE_POLICY.maxAttempts
    ) {
      if (challenge) await storage.deleteAdminAuthChallenge(tokenHash);
      clearAuthCookie(res, CHALLENGE_COOKIE);
      return null;
    }
    const user = await storage.getAdminUser(challenge.userId);
    if (!user?.isActive || !isMfaRequiredForRole(user.role)) {
      await storage.deleteAdminAuthChallenge(tokenHash);
      clearAuthCookie(res, CHALLENGE_COOKIE);
      return null;
    }
    return { challenge, user, tokenHash };
  };

  const rejectMfaAttempt = async (
    req: Request,
    res: Response,
    challenge: { id: string; attempts: number },
    tokenHash: string,
    userId: string,
  ) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = `${ip}|${userId}`;
    await recordSharedRateLimitAttempt("mfa", key, MFA_CODE_POLICY);
    const nextAttempts = challenge.attempts + 1;
    if (nextAttempts >= MFA_CODE_POLICY.maxAttempts) {
      await storage.deleteAdminAuthChallenge(tokenHash);
      clearAuthCookie(res, CHALLENGE_COOKIE);
      res.setHeader("Retry-After", String(MFA_CODE_POLICY.blockDurationMs / 1000));
      return res.status(429).json({ error: "Too many verification attempts", code: "MFA_RATE_LIMITED" });
    }
    await storage.updateAdminAuthChallengeAttempts(challenge.id, nextAttempts);
    return res.status(401).json({ error: "Invalid verification code", code: "MFA_INVALID_CODE" });
  };

  const completeMfaLogin = async (
    req: Request,
    res: Response,
    user: { id: string; username: string; email: string; role: string; permissions: string[] | null },
    tokenHash: string,
  ) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || null;
    await storage.deleteAdminAuthChallenge(tokenHash);
    clearAuthCookie(res, CHALLENGE_COOKIE);
    await storage.updateAdminUserLogin(user.id);
    await recordSharedRateLimitAttempt("mfa", `${ip}|${user.id}`, MFA_CODE_POLICY, true);
    const sessionPayload = await createAuthenticatedSession(res, user, ip, userAgent, true);
    return { authenticated: true, ...sessionPayload };
  };

  // La inscripción inicia únicamente después de validar usuario y contraseña y
  // con un desafío HttpOnly de vida corta. El secreto devuelto se usa una sola
  // vez para configurar una app TOTP y nunca se registra en logs.
  app.get("/api/admin/mfa/enroll", requireSameOrigin, async (req: Request, res: Response) => {
    try {
      const resolved = await resolveMfaChallenge(req, res, "enroll");
      if (!resolved) return res.status(401).json({ error: "MFA challenge expired", code: "MFA_CHALLENGE_INVALID" });
      const current = await storage.getAdminMfaCredential(resolved.user.id);
      if (current?.enabledAt) return res.status(409).json({ error: "MFA is already enabled", code: "MFA_ALREADY_ENABLED" });

      const secret = generateTotpSecret();
      await storage.upsertAdminMfaCredential({
        userId: resolved.user.id,
        encryptedSecret: encryptTotpSecret(secret),
        recoveryCodeHashes: [],
        enabledAt: null,
      });
      res.setHeader("Cache-Control", "no-store");
      return res.json({
        issuer: "Von Wobeser",
        accountName: resolved.user.email,
        secret,
        otpauthUrl: totpAuthUrl(resolved.user.email, secret),
      });
    } catch (error) {
      console.error("MFA enrollment start failed:", error instanceof Error ? error.message : "unknown");
      return res.status(500).json({ error: "Could not start MFA enrollment", code: "MFA_ENROLLMENT_FAILED" });
    }
  });

  app.post("/api/admin/mfa/enroll", requireSameOrigin, async (req: Request, res: Response) => {
    try {
      const parsed = mfaCodeSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid verification code", code: "MFA_INVALID_CODE" });
      const resolved = await resolveMfaChallenge(req, res, "enroll");
      if (!resolved) return res.status(401).json({ error: "MFA challenge expired", code: "MFA_CHALLENGE_INVALID" });
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      const rate = await checkSharedRateLimit("mfa", `${ip}|${resolved.user.id}`, MFA_CODE_POLICY);
      if (!rate.allowed) {
        res.setHeader("Retry-After", String(rate.retryAfter || 60));
        return res.status(429).json({ error: "Too many verification attempts", code: "MFA_RATE_LIMITED" });
      }
      const credential = await storage.getAdminMfaCredential(resolved.user.id);
      if (!credential || credential.enabledAt || !verifyTotp(decryptTotpSecret(credential.encryptedSecret), parsed.data.code)) {
        return rejectMfaAttempt(req, res, resolved.challenge, resolved.tokenHash, resolved.user.id);
      }
      const recovery = generateRecoveryCodes();
      await storage.updateAdminMfaCredential(resolved.user.id, {
        recoveryCodeHashes: recovery.hashes,
        enabledAt: new Date(),
      });
      const session = await completeMfaLogin(req, res, resolved.user, resolved.tokenHash);
      return res.json({ ...session, recoveryCodes: recovery.plain });
    } catch (error) {
      console.error("MFA enrollment verification failed:", error instanceof Error ? error.message : "unknown");
      return res.status(500).json({ error: "Could not verify MFA", code: "MFA_VERIFICATION_FAILED" });
    }
  });

  app.post("/api/admin/mfa/verify", requireSameOrigin, async (req: Request, res: Response) => {
    try {
      const parsed = mfaCodeSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid verification code", code: "MFA_INVALID_CODE" });
      const resolved = await resolveMfaChallenge(req, res, "mfa");
      if (!resolved) return res.status(401).json({ error: "MFA challenge expired", code: "MFA_CHALLENGE_INVALID" });
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      const rate = await checkSharedRateLimit("mfa", `${ip}|${resolved.user.id}`, MFA_CODE_POLICY);
      if (!rate.allowed) {
        res.setHeader("Retry-After", String(rate.retryAfter || 60));
        return res.status(429).json({ error: "Too many verification attempts", code: "MFA_RATE_LIMITED" });
      }
      const credential = await storage.getAdminMfaCredential(resolved.user.id);
      if (!credential?.enabledAt || !verifyTotp(decryptTotpSecret(credential.encryptedSecret), parsed.data.code)) {
        return rejectMfaAttempt(req, res, resolved.challenge, resolved.tokenHash, resolved.user.id);
      }
      return res.json(await completeMfaLogin(req, res, resolved.user, resolved.tokenHash));
    } catch (error) {
      console.error("MFA verification failed:", error instanceof Error ? error.message : "unknown");
      return res.status(500).json({ error: "Could not verify MFA", code: "MFA_VERIFICATION_FAILED" });
    }
  });

  app.post("/api/admin/mfa/recovery", requireSameOrigin, async (req: Request, res: Response) => {
    try {
      const parsed = recoveryCodeSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid recovery code", code: "MFA_INVALID_CODE" });
      const resolved = await resolveMfaChallenge(req, res, "mfa");
      if (!resolved) return res.status(401).json({ error: "MFA challenge expired", code: "MFA_CHALLENGE_INVALID" });
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      const rate = await checkSharedRateLimit("mfa", `${ip}|${resolved.user.id}`, MFA_CODE_POLICY);
      if (!rate.allowed) {
        res.setHeader("Retry-After", String(rate.retryAfter || 60));
        return res.status(429).json({ error: "Too many verification attempts", code: "MFA_RATE_LIMITED" });
      }
      const credential = await storage.getAdminMfaCredential(resolved.user.id);
      const remaining = credential?.enabledAt
        ? consumeRecoveryCode(credential.recoveryCodeHashes || [], parsed.data.recoveryCode)
        : null;
      if (!credential || !remaining) {
        return rejectMfaAttempt(req, res, resolved.challenge, resolved.tokenHash, resolved.user.id);
      }
      await storage.updateAdminMfaCredential(resolved.user.id, { recoveryCodeHashes: remaining });
      return res.json(await completeMfaLogin(req, res, resolved.user, resolved.tokenHash));
    } catch (error) {
      console.error("MFA recovery failed:", error instanceof Error ? error.message : "unknown");
      return res.status(500).json({ error: "Could not verify MFA", code: "MFA_VERIFICATION_FAILED" });
    }
  });

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
      await auditLog("create", "admin_user", created.id, actor?.id || "unknown", undefined, req);
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
      await auditLog("update", "admin_user", id, actor?.id || "unknown", undefined, req);
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
      await auditLog("update", "admin_user", idResult.data, actor?.id || "unknown", undefined, req);
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
      await auditLog("delete", "admin_user", id, actor?.id || "unknown", undefined, req);
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
        newPassword: z.string().min(PASSWORD_MIN).max(PASSWORD_MAX),
      }).safeParse(req.body);
      if (!parsed.success) return apiError(res, 400, `La nueva contraseña debe tener entre ${PASSWORD_MIN} y ${PASSWORD_MAX} caracteres`);
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
      await auditLog("update", "admin_user_password", user.id, user.id, undefined, req);
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
