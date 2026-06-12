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
    // super_admin tiene acceso total. La taxonomía válida (shared/schema.ts) es
    // super_admin | editor | author, pero los requireRole del código piden
    // ('editor','admin') — 'admin' no existe y 'super_admin' no estaba en ninguna lista,
    // así que el único usuario real (super_admin) recibía 403 en TODO el panel.
    // Este bypass repara los 61 endpoints sin tocarlos y respeta la jerarquía.
    if (req.adminUser.role !== "super_admin" && !roles.includes(req.adminUser.role)) {
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
