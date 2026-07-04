import bcrypt from "bcrypt";
import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import type { AdminUser } from "@shared/schema";

const SALT_ROUNDS = 12;
const TOKEN_BYTES = 32;
const SESSION_DURATION_HOURS = 24;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString("hex");
}

export function getSessionExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + SESSION_DURATION_HOURS);
  return expiry;
}

// Rate limiting for login attempts
interface RateLimitEntry {
  attempts: number;
  lastAttempt: number;
  blockedUntil: number;
}

const loginAttempts = new Map<string, RateLimitEntry>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const BLOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = loginAttempts.get(identifier);

  if (!entry) {
    return { allowed: true };
  }

  // Check if blocked
  if (entry.blockedUntil > now) {
    return { 
      allowed: false, 
      retryAfter: Math.ceil((entry.blockedUntil - now) / 1000) 
    };
  }

  // Reset if window has passed
  if (now - entry.lastAttempt > WINDOW_MS) {
    loginAttempts.delete(identifier);
    return { allowed: true };
  }

  // Check attempts
  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.blockedUntil = now + BLOCK_DURATION_MS;
    return { 
      allowed: false, 
      retryAfter: Math.ceil(BLOCK_DURATION_MS / 1000) 
    };
  }

  return { allowed: true };
}

export function recordLoginAttempt(identifier: string, success: boolean): void {
  const now = Date.now();
  
  if (success) {
    loginAttempts.delete(identifier);
    return;
  }

  const entry = loginAttempts.get(identifier);
  
  if (!entry) {
    loginAttempts.set(identifier, {
      attempts: 1,
      lastAttempt: now,
      blockedUntil: 0,
    });
    return;
  }

  // Reset if window has passed
  if (now - entry.lastAttempt > WINDOW_MS) {
    loginAttempts.set(identifier, {
      attempts: 1,
      lastAttempt: now,
      blockedUntil: 0,
    });
    return;
  }

  entry.attempts++;
  entry.lastAttempt = now;
}

// Extend Express Request to include admin user
declare global {
  namespace Express {
    interface Request {
      adminUser?: AdminUser;
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const token = authHeader.substring(7);

    // Validate session
    const session = await storage.getAdminSession(token);
    
    if (!session) {
      res.status(401).json({ error: "Invalid session" });
      return;
    }

    // Check expiry
    if (new Date() > session.expiresAt) {
      await storage.deleteAdminSession(token);
      res.status(401).json({ error: "Session expired" });
      return;
    }

    // Get admin user
    const adminUser = await storage.getAdminUser(session.userId);
    
    if (!adminUser || !adminUser.isActive) {
      res.status(401).json({ error: "User not found or inactive" });
      return;
    }

    // Attach user to request
    req.adminUser = adminUser;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Authentication error" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.adminUser) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    // super_admin sits above all role checks (full access).
    if (req.adminUser.role !== "super_admin" && !roles.includes(req.adminUser.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}

// =============================================
// Permisos por usuario (rol = permisos base + concesiones extra)
// =============================================
// Áreas del panel. `users` (gestión de accesos) NO es concedible por usuario para evitar escalada.
//  - content:  contenido del sitio (noticias, abogados, prácticas, industrias, eventos, blog, etc.)
//  - agents:   agentes de IA
//  - config:   configuración del sitio (site-config, footer, textos)
//  - advanced: sección avanzada (auditorías, salud, cronista/sistema)
//  - users:    gestión de accesos (solo por rol admin/dueño)
export const PERMISSIONS = ["content", "agents", "config", "advanced", "users"] as const;
export type Permission = (typeof PERMISSIONS)[number];

// Permisos que el Dueño/Admin puede conceder EXTRA a un usuario (aditivos sobre su rol).
export const GRANTABLE: Permission[] = ["content", "agents", "config", "advanced"];

// Permisos base por rol. super_admin/admin obtienen todos (ver effectivePermissions).
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  super_admin: [...PERMISSIONS],
  admin: [...PERMISSIONS],
  editor: ["content", "config"],
  marketing: ["content", "agents"],
  sistemas: ["content", "agents", "advanced"],
};

// Filtra concesiones extra a solo las claves permitidas (nunca `users`).
export function sanitizeGrants(perms: unknown): Permission[] {
  if (!Array.isArray(perms)) return [];
  const set = new Set<Permission>();
  for (const p of perms) {
    if (typeof p === "string" && (GRANTABLE as string[]).includes(p)) set.add(p as Permission);
  }
  return Array.from(set);
}

// Permisos efectivos = base del rol ∪ concesiones extra (acotadas a GRANTABLE).
export function effectivePermissions(user: Pick<AdminUser, "role" | "permissions">): Set<Permission> {
  if (user.role === "super_admin") return new Set(PERMISSIONS);
  const base = ROLE_PERMISSIONS[user.role] ?? [];
  return new Set<Permission>([...base, ...sanitizeGrants(user.permissions)]);
}

export function requirePermission(perm: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.adminUser) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (!effectivePermissions(req.adminUser).has(perm)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}

// Clean up expired entries periodically (every hour)
setInterval(() => {
  const now = Date.now();
  const keys = Array.from(loginAttempts.keys());
  keys.forEach(key => {
    const entry = loginAttempts.get(key);
    if (entry && now - entry.lastAttempt > WINDOW_MS && entry.blockedUntil < now) {
      loginAttempts.delete(key);
    }
  });
}, 60 * 60 * 1000);
