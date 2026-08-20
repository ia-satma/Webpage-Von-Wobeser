import bcrypt from "bcrypt";
import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { eq, sql } from "drizzle-orm";
import { storage } from "./storage";
import { db } from "./db";
import { securityRateLimits, type AdminSession, type AdminUser } from "@shared/schema";
import { isMfaRequiredForRole } from "./security/mfa";

const TOKEN_BYTES = 32;
const IDLE_SESSION_MINUTES = 30;
const ABSOLUTE_SESSION_HOURS = 8;
const ARGON_MEMORY_KIB = 19_456;
const ARGON_PASSES = 2;
const ARGON_PARALLELISM = 1;
const ARGON_TAG_LENGTH = 32;
export const PASSWORD_MIN = 15;
export const PASSWORD_MAX = 128;
export const GENERATED_PASSWORD_LENGTH = 20;

type NativeArgon2 = (
  algorithm: "argon2id",
  parameters: {
    message: Buffer;
    nonce: Buffer;
    parallelism: number;
    tagLength: number;
    memory: number;
    passes: number;
  },
  callback: (error: Error | null, derivedKey: Buffer) => void,
) => void;

function nativeArgon2(): NativeArgon2 {
  const fn = (crypto as unknown as { argon2?: NativeArgon2 }).argon2;
  if (!fn) {
    throw new Error("Argon2id requires Node.js 24.7 or newer");
  }
  return fn;
}

function deriveArgon2(password: string, salt: Buffer, params = {
  memory: ARGON_MEMORY_KIB,
  passes: ARGON_PASSES,
  parallelism: ARGON_PARALLELISM,
  tagLength: ARGON_TAG_LENGTH,
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    nativeArgon2()("argon2id", {
      message: Buffer.from(password, "utf8"),
      nonce: salt,
      parallelism: params.parallelism,
      tagLength: params.tagLength,
      memory: params.memory,
      passes: params.passes,
    }, (error, result) => error ? reject(error) : resolve(result));
  });
}

async function derivePasswordHash(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const derived = await deriveArgon2(password, salt);
  return `$argon2id$v=19$m=${ARGON_MEMORY_KIB},t=${ARGON_PASSES},p=${ARGON_PARALLELISM}$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

/**
 * Formato autocontenido inspirado en PHC. Permite verificar y actualizar parámetros
 * sin guardar sal ni contraseña en columnas separadas.
 */
export async function hashPassword(password: string): Promise<string> {
  const validation = validateNewPassword(password);
  if (!validation.valid) throw new Error(validation.error);
  return derivePasswordHash(password);
}

/**
 * Rehashea una contraseña heredada DESPUÉS de que comparePassword confirmó su validez.
 * No aplica la política de alta porque el login debe seguir aceptando credenciales
 * anteriores de otra longitud mientras las migra de bcrypt a Argon2id.
 */
export async function rehashVerifiedPassword(password: string): Promise<string> {
  if (typeof password !== "string" || password.length < 1 || password.length > 128) {
    throw new Error("Verified password is outside the supported legacy range");
  }
  return derivePasswordHash(password);
}

export async function comparePassword(password: string, encodedHash: string): Promise<boolean> {
  if (encodedHash.startsWith("$argon2id$")) {
    try {
      const parts = encodedHash.split("$");
      if (parts.length !== 6 || parts[2] !== "v=19") return false;
      const parsed = Object.fromEntries(parts[3].split(",").map((entry) => {
        const [key, value] = entry.split("=");
        return [key, Number(value)];
      }));
      if (!Number.isSafeInteger(parsed.m) || !Number.isSafeInteger(parsed.t) || !Number.isSafeInteger(parsed.p)) return false;
      if (parsed.m < 8 || parsed.m > 1_048_576 || parsed.t < 1 || parsed.t > 20 || parsed.p < 1 || parsed.p > 16) return false;
      const salt = Buffer.from(parts[4], "base64url");
      const expected = Buffer.from(parts[5], "base64url");
      if (salt.length < 16 || expected.length < 16 || expected.length > 128) return false;
      const actual = await deriveArgon2(password, salt, {
        memory: parsed.m,
        passes: parsed.t,
        parallelism: parsed.p,
        tagLength: expected.length,
      });
      return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
    } catch {
      return false;
    }
  }
  if (encodedHash.startsWith("$2")) {
    return bcrypt.compare(password, encodedHash).catch(() => false);
  }
  return false;
}

export function passwordNeedsRehash(encodedHash: string): boolean {
  if (!encodedHash.startsWith("$argon2id$")) return true;
  return !encodedHash.includes(`m=${ARGON_MEMORY_KIB},t=${ARGON_PASSES},p=${ARGON_PARALLELISM}`);
}

const COMMON_PASSWORDS = new Set([
  "password", "password123", "admin", "admin123", "qwerty", "qwerty123",
  "123456789", "1234567890", "letmein", "welcome", "bienvenido",
  "contraseña", "contrasena", "passwordpassword", "vonwobeser", "vonwobeser2026",
]);

export function validateNewPassword(password: unknown): { valid: true } | { valid: false; error: string } {
  if (typeof password !== "string") return { valid: false, error: "La contraseña es obligatoria" };
  if (password.length < PASSWORD_MIN) return { valid: false, error: `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres` };
  if (password.length > PASSWORD_MAX) return { valid: false, error: `La contraseña no puede exceder ${PASSWORD_MAX} caracteres` };
  const normalized = password.normalize("NFKC").toLowerCase().replace(/\s+/g, "");
  if (
    COMMON_PASSWORDS.has(normalized)
    || /(password|contrase(?:n|ñ)a|bienvenido|welcome|qwerty|asdfgh|123456)/.test(normalized)
    || /^(.)\1{11,}$/.test(normalized)
  ) {
    return { valid: false, error: "Elige una contraseña menos común" };
  }
  return { valid: true };
}

export function generateAdminPassword(length = GENERATED_PASSWORD_LENGTH): string {
  if (!Number.isInteger(length) || length < PASSWORD_MIN || length > PASSWORD_MAX) {
    throw new Error(`Generated password length must be between ${PASSWORD_MIN} and ${PASSWORD_MAX}`);
  }
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*-_";
  while (true) {
    let value = "";
    while (value.length < length) {
      const bytes = crypto.randomBytes(length);
      for (let index = 0; index < bytes.length; index += 1) {
        const byte = bytes[index];
        if (byte >= Math.floor(256 / alphabet.length) * alphabet.length) continue;
        value += alphabet[byte % alphabet.length];
        if (value.length === length) break;
      }
    }
    if (validateNewPassword(value).valid) return value;
  }
}

export function generateToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString("base64url");
}

export function hashOpaqueToken(token: string): string {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

export function deriveCsrfToken(rawSessionToken: string): string {
  // Token estable por sesión: permite abrir varias pestañas sin que una invalide
  // a las demás. No revela la cookie aleatoria ni se persiste en texto claro.
  return crypto.createHash("sha256").update(`csrf:${rawSessionToken}`, "utf8").digest("base64url");
}

export function getSessionExpiry(): Date {
  return new Date(Date.now() + IDLE_SESSION_MINUTES * 60 * 1000);
}

export function getAbsoluteSessionExpiry(): Date {
  return new Date(Date.now() + ABSOLUTE_SESSION_HOURS * 60 * 60 * 1000);
}

export function getSessionCookieName(nodeEnv = process.env.NODE_ENV): string {
  return nodeEnv === "production" ? "__Host-vwb_admin_session" : "vwb_admin_session";
}

export function getChallengeCookieName(nodeEnv = process.env.NODE_ENV): string {
  return nodeEnv === "production" ? "__Host-vwb_admin_challenge" : "vwb_admin_challenge";
}

export const SESSION_COOKIE = getSessionCookieName();
export const CHALLENGE_COOKIE = getChallengeCookieName();

export function authCookieOptions(maxAgeMs: number, nodeEnv = process.env.NODE_ENV) {
  return {
    httpOnly: true,
    secure: nodeEnv === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: maxAgeMs,
  };
}

export function clearAuthCookie(res: Response, name: string, nodeEnv = process.env.NODE_ENV): void {
  res.clearCookie(name, {
    httpOnly: true,
    secure: nodeEnv === "production",
    sameSite: "strict",
    path: "/",
  });
}

export function readCookie(req: Request | { headers: { cookie?: string } }, name: string): string | null {
  const header = req.headers.cookie || "";
  for (const part of header.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (rawName === name) {
      try {
        return decodeURIComponent(rawValue.join("="));
      } catch {
        return null;
      }
    }
  }
  return null;
}

const LOGIN_RATE_POLICY = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
  blockDurationMs: 30 * 60 * 1000,
};

export type SharedRateLimitPolicy = {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
};

function rateLimitKey(namespace: string, identifier: string): string {
  return hashOpaqueToken(`${namespace}:${identifier.trim().toLowerCase()}`);
}

export async function checkSharedRateLimit(
  namespace: string,
  identifier: string,
  policy: SharedRateLimitPolicy,
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const keyHash = rateLimitKey(namespace, identifier);
  const [entry] = await db.select().from(securityRateLimits).where(eq(securityRateLimits.keyHash, keyHash));
  if (!entry) return { allowed: true };

  const now = Date.now();
  const windowStart = entry.windowStartedAt.getTime();
  if (entry.blockedUntil && entry.blockedUntil.getTime() > now) {
    return { allowed: false, retryAfter: Math.ceil((entry.blockedUntil.getTime() - now) / 1000) };
  }
  if (now - windowStart > policy.windowMs) {
    await db.delete(securityRateLimits).where(eq(securityRateLimits.keyHash, keyHash));
    return { allowed: true };
  }
  if (entry.attempts >= policy.maxAttempts) {
    const blockedUntil = new Date(now + policy.blockDurationMs);
    await db.update(securityRateLimits).set({ blockedUntil, updatedAt: new Date() }).where(eq(securityRateLimits.keyHash, keyHash));
    return { allowed: false, retryAfter: Math.ceil(policy.blockDurationMs / 1000) };
  }
  return { allowed: true };
}

export async function recordSharedRateLimitAttempt(
  namespace: string,
  identifier: string,
  policy: SharedRateLimitPolicy,
  reset = false,
): Promise<void> {
  const keyHash = rateLimitKey(namespace, identifier);
  if (reset) {
    await db.delete(securityRateLimits).where(eq(securityRateLimits.keyHash, keyHash));
    return;
  }
  const now = new Date();
  const windowCutoff = new Date(now.getTime() - policy.windowMs);
  await db.insert(securityRateLimits).values({
    keyHash,
    attempts: 1,
    windowStartedAt: now,
    updatedAt: now,
  }).onConflictDoUpdate({
    target: securityRateLimits.keyHash,
    set: {
      attempts: sql`CASE WHEN ${securityRateLimits.windowStartedAt} < ${windowCutoff} THEN 1 ELSE ${securityRateLimits.attempts} + 1 END`,
      windowStartedAt: sql`CASE WHEN ${securityRateLimits.windowStartedAt} < ${windowCutoff} THEN NOW() ELSE ${securityRateLimits.windowStartedAt} END`,
      blockedUntil: null,
      updatedAt: now,
    },
  });
}

export async function checkRateLimit(identifier: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  return checkSharedRateLimit("login", identifier, LOGIN_RATE_POLICY);
}

export async function recordLoginAttempt(identifier: string, success: boolean): Promise<void> {
  return recordSharedRateLimitAttempt("login", identifier, LOGIN_RATE_POLICY, success);
}

declare global {
  namespace Express {
    interface Request {
      adminUser?: AdminUser;
      adminSession?: AdminSession;
    }
  }
}

function constantTimeHexEqual(actual: string, expectedHash: string): boolean {
  const actualHash = hashOpaqueToken(actual);
  const left = Buffer.from(actualHash, "hex");
  const right = Buffer.from(expectedHash, "hex");
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export async function resolveAdminSession(req: Request): Promise<{ session: AdminSession; user: AdminUser; rawToken: string } | null> {
  const rawToken = readCookie(req, SESSION_COOKIE);
  if (!rawToken || rawToken.length < 32 || rawToken.length > 256) return null;
  const tokenHash = hashOpaqueToken(rawToken);
  const session = await storage.getAdminSession(tokenHash);
  if (!session) return null;
  const now = new Date();
  const absoluteExpiry = session.absoluteExpiresAt || session.expiresAt;
  if (now > session.expiresAt || now > absoluteExpiry) {
    await storage.deleteAdminSession(tokenHash);
    return null;
  }
  const user = await storage.getAdminUser(session.userId);
  if (!user?.isActive) {
    await storage.deleteAdminSession(tokenHash);
    return null;
  }
  return { session, user, rawToken };
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const resolved = await resolveAdminSession(req);
    if (!resolved) {
      clearAuthCookie(res, SESSION_COOKIE);
      res.status(401).json({ error: "Authentication required", code: "AUTH_REQUIRED" });
      return;
    }
    const { session, user } = resolved;

    // Al activar MFA no se conservan sesiones privilegiadas creadas antes de
    // completar el segundo factor. Esto evita una ventana de transición en la
    // que una cookie previa pueda eludir la nueva política.
    if (isMfaRequiredForRole(user.role) && !session.mfaVerified) {
      await storage.deleteAdminSession(session.tokenHash);
      clearAuthCookie(res, SESSION_COOKIE);
      res.status(401).json({ error: "Two-step verification required", code: "MFA_REQUIRED" });
      return;
    }

    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const csrf = req.header("x-csrf-token");
      if (!csrf || !session.csrfTokenHash || !constantTimeHexEqual(csrf, session.csrfTokenHash)) {
        res.status(403).json({ error: "Invalid CSRF token", code: "CSRF_INVALID" });
        return;
      }
    }

    req.adminUser = user;
    req.adminSession = session;
    const lastSeen = session.lastSeenAt?.getTime() || session.createdAt?.getTime() || 0;
    if (Date.now() - lastSeen > 5 * 60 * 1000) {
      const nextIdle = getSessionExpiry();
      const absolute = session.absoluteExpiresAt || session.expiresAt;
      await storage.touchAdminSession(session.id, nextIdle > absolute ? absolute : nextIdle);
    }
    next();
  } catch (error) {
    console.error("Auth middleware error:", error instanceof Error ? error.message : "unknown");
    res.status(500).json({ error: "Authentication error", code: "AUTH_ERROR" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.adminUser) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (req.adminUser.role !== "super_admin" && !roles.includes(req.adminUser.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}

export const PERMISSIONS = [
  "content",
  "agents",
  "agent_knowledge_admin",
  "config",
  "advanced",
  "contact_submissions",
  "career_applications",
  "newsletter",
  "exports",
  "private_downloads",
  "users",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const GRANTABLE: Permission[] = [
  "content",
  "agents",
  "agent_knowledge_admin",
  "config",
  "advanced",
  "contact_submissions",
  "career_applications",
  "newsletter",
  "exports",
  "private_downloads",
];

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  super_admin: [...PERMISSIONS],
  admin: [...PERMISSIONS],
  editor: ["content", "config"],
  marketing: ["content", "agents"],
  sistemas: ["content", "agents", "advanced"],
};

export function sanitizeGrants(perms: unknown): Permission[] {
  if (!Array.isArray(perms)) return [];
  const set = new Set<Permission>();
  for (const permission of perms) {
    if (typeof permission === "string" && (GRANTABLE as string[]).includes(permission)) {
      set.add(permission as Permission);
    }
  }
  return Array.from(set);
}

export function effectivePermissions(user: Pick<AdminUser, "role" | "permissions">): Set<Permission> {
  if (user.role === "super_admin") return new Set(PERMISSIONS);
  const base = ROLE_PERMISSIONS[user.role] ?? [];
  return new Set<Permission>([...base, ...sanitizeGrants(user.permissions)]);
}

/**
 * Única forma de exponer un usuario autenticado al navegador. Mantener los permisos
 * efectivos dentro del payload evita que el menú administrativo quede incompleto justo
 * después del login.
 */
export function adminSessionUserPayload(
  user: Pick<AdminUser, "id" | "username" | "email" | "role" | "permissions">,
) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    mustChangePassword: false,
    permissions: Array.from(effectivePermissions(user)),
  };
}

export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.adminUser) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (!effectivePermissions(req.adminUser).has(permission)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}
