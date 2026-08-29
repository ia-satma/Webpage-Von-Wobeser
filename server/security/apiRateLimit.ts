import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { eq, sql } from "drizzle-orm";
import { securityRateLimits } from "@shared/schema";
import { resolveAdminSession, type SharedRateLimitPolicy } from "../auth";
import { db } from "../db";

const READ_POLICY: SharedRateLimitPolicy = {
  maxAttempts: 900,
  windowMs: 5 * 60 * 1000,
  blockDurationMs: 5 * 60 * 1000,
};

const PUBLIC_READ_POLICY: SharedRateLimitPolicy = {
  maxAttempts: 600,
  windowMs: 5 * 60 * 1000,
  blockDurationMs: 5 * 60 * 1000,
};

const WRITE_POLICY: SharedRateLimitPolicy = {
  maxAttempts: 120,
  windowMs: 5 * 60 * 1000,
  blockDurationMs: 10 * 60 * 1000,
};

const PUBLIC_WRITE_POLICY: SharedRateLimitPolicy = {
  maxAttempts: 30,
  windowMs: 15 * 60 * 1000,
  blockDurationMs: 15 * 60 * 1000,
};

const EXPENSIVE_POLICY: SharedRateLimitPolicy = {
  maxAttempts: 30,
  windowMs: 10 * 60 * 1000,
  blockDurationMs: 15 * 60 * 1000,
};

// A multipart upload can legitimately use roughly forty 5 MB chunks. This
// policy is intentionally higher than the ordinary mutation limit, while
// remaining shared between every Autoscale instance.
const UPLOAD_POLICY: SharedRateLimitPolicy = {
  maxAttempts: 300,
  windowMs: 15 * 60 * 1000,
  blockDurationMs: 15 * 60 * 1000,
};

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function pathnameOf(originalUrl: string): string {
  try {
    return new URL(originalUrl, "https://rate-limit.invalid").pathname;
  } catch {
    return "/api/invalid";
  }
}

/**
 * A vCard is a downloadable representation of information already rendered in
 * a published lawyer profile.  Keep this small, public artifact available when
 * the persistent quota store is temporarily unavailable: otherwise the profile
 * advertises a download that can never complete.  The route still verifies
 * that the profile is published before producing any data.
 */
export function isPublicVcardDownloadRoute(method: string, originalUrl: string): boolean {
  if (!new Set(["GET", "HEAD"]).has(method.toUpperCase())) return false;
  const pathname = pathnameOf(originalUrl).replace(/\/+$/g, "");
  return /^\/api\/team\/[^/]+\/vcard$/i.test(pathname);
}

/**
 * Return one of a finite number of buckets. Never put an arbitrary slug, UUID
 * or attacker-controlled unknown path into PostgreSQL's rate-limit key space.
 */
export function apiRouteBucket(method: string, originalUrl: string): string {
  const pathname = pathnameOf(originalUrl).replace(/\/+$/g, "") || "/";
  const upperMethod = method.toUpperCase();

  if (pathname.startsWith("/api/admin/media/upload")) return "admin-media-upload";
  if (pathname.startsWith("/api/admin/presentations/upload")) return "presentation-upload";
  if (pathname.startsWith("/api/admin/presentations/generate")) return "presentation-generate";
  if (pathname.startsWith("/api/agents")) return "agents";
  if (pathname.startsWith("/api/translate") || pathname.startsWith("/api/translations")) return "translations";
  if (pathname.startsWith("/api/audits") || pathname.startsWith("/api/health-check")) return "audits";
  if (pathname.startsWith("/api/security/csp-report")) return "csp-report";
  if (pathname.startsWith("/api/contact")) return "contact";
  if (pathname.startsWith("/api/careers")) return "careers";
  if (pathname.startsWith("/api/newsletter")) return "newsletter";
  if (pathname.startsWith("/api/admin/login")) return "admin-login";
  if (pathname.startsWith("/api/admin")) {
    const section = pathname.split("/")[3]?.replace(/[^a-z0-9_-]/gi, "") || "root";
    return `admin-${section.slice(0, 32)}`;
  }

  // Public collection routes with user-controlled slugs/identifiers share one
  // stable bucket per collection instead of creating unbounded database rows.
  const publicCollection = pathname.match(/^\/api\/(team|news|practice-areas|industries|desks|offices|search)(?:\/|$)/i);
  if (publicCollection) return `public-${publicCollection[1].toLowerCase()}`;

  // Unknown API paths are deliberately coalesced. This also rate-limits 404
  // probing without allowing a unique key for every requested path.
  return SAFE_METHODS.has(upperMethod) ? "public-other-read" : "public-other-write";
}

export function apiRoutePolicy(
  method: string,
  bucket: string,
  authenticated: boolean,
): SharedRateLimitPolicy {
  if (bucket.endsWith("upload")) return UPLOAD_POLICY;
  if (["agents", "translations", "audits", "presentation-generate"].includes(bucket)) {
    return EXPENSIVE_POLICY;
  }
  if (SAFE_METHODS.has(method.toUpperCase())) {
    return authenticated ? READ_POLICY : PUBLIC_READ_POLICY;
  }
  return authenticated ? WRITE_POLICY : PUBLIC_WRITE_POLICY;
}

function requestIdentity(req: Request, userId?: string): string {
  if (userId) return `user:${userId}`;
  const address = req.ip || req.socket.remoteAddress || "unknown";
  return `ip:${address}`;
}

function opaqueRateKey(namespace: string, identifier: string): string {
  return crypto
    .createHash("sha256")
    .update(`${namespace}:${identifier.trim().toLowerCase()}`, "utf8")
    .digest("hex");
}

type RateLimitRow = {
  attempts: number;
  windowStartedAt: Date;
  blockedUntil: Date | null;
};

export function nextApiRateLimitState(
  entry: RateLimitRow | null,
  policy: SharedRateLimitPolicy,
  nowMs: number,
): {
  allowed: boolean;
  attempts: number;
  windowStartedAt: Date;
  blockedUntil: Date | null;
  retryAfter?: number;
} {
  const now = new Date(nowMs);
  if (entry?.blockedUntil && entry.blockedUntil.getTime() > nowMs) {
    return {
      allowed: false,
      ...entry,
      retryAfter: Math.max(1, Math.ceil((entry.blockedUntil.getTime() - nowMs) / 1000)),
    };
  }
  // A block can intentionally outlive the original counting window. Check it
  // before resetting the window so the client cannot wait only for the shorter
  // window and bypass the configured penalty.
  if (!entry || nowMs - entry.windowStartedAt.getTime() > policy.windowMs) {
    return { allowed: true, attempts: 1, windowStartedAt: now, blockedUntil: null };
  }
  if (entry.attempts >= policy.maxAttempts) {
    const blockedUntil = new Date(nowMs + policy.blockDurationMs);
    return {
      allowed: false,
      attempts: entry.attempts,
      windowStartedAt: entry.windowStartedAt,
      blockedUntil,
      retryAfter: Math.max(1, Math.ceil(policy.blockDurationMs / 1000)),
    };
  }
  return {
    allowed: true,
    attempts: entry.attempts + 1,
    windowStartedAt: entry.windowStartedAt,
    blockedUntil: null,
  };
}

async function consumeApiRateLimit(
  namespace: string,
  identifier: string,
  policy: SharedRateLimitPolicy,
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const keyHash = opaqueRateKey(namespace, identifier);
  return db.transaction(async (tx) => {
    // A transaction-scoped lock makes check+increment one operation even when
    // requests hit different Autoscale instances at the same time.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${keyHash}, 0))`);
    const [entry] = await tx
      .select({
        attempts: securityRateLimits.attempts,
        windowStartedAt: securityRateLimits.windowStartedAt,
        blockedUntil: securityRateLimits.blockedUntil,
      })
      .from(securityRateLimits)
      .where(eq(securityRateLimits.keyHash, keyHash));

    const next = nextApiRateLimitState(entry || null, policy, Date.now());
    if (!entry) {
      await tx.insert(securityRateLimits).values({
        keyHash,
        attempts: next.attempts,
        windowStartedAt: next.windowStartedAt,
        blockedUntil: next.blockedUntil,
        updatedAt: new Date(),
      });
    } else if (
      entry.attempts !== next.attempts
      || entry.windowStartedAt.getTime() !== next.windowStartedAt.getTime()
      || entry.blockedUntil?.getTime() !== next.blockedUntil?.getTime()
    ) {
      await tx.update(securityRateLimits).set({
        attempts: next.attempts,
        windowStartedAt: next.windowStartedAt,
        blockedUntil: next.blockedUntil,
        updatedAt: new Date(),
      }).where(eq(securityRateLimits.keyHash, keyHash));
    }

    return { allowed: next.allowed, retryAfter: next.retryAfter };
  });
}

/**
 * Persistent API quota. The existing security_rate_limits table is reused, so
 * limits are shared by all Replit Autoscale instances and introduce no schema
 * or business-data migration.
 */
export async function apiRouteRateLimit(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (req.method === "OPTIONS") {
    next();
    return;
  }

  if (isPublicVcardDownloadRoute(req.method, req.originalUrl)) {
    next();
    return;
  }

  try {
    const resolved = await resolveAdminSession(req);
    const bucket = apiRouteBucket(req.method, req.originalUrl);
    const policy = apiRoutePolicy(req.method, bucket, Boolean(resolved));
    const identity = requestIdentity(req, resolved?.user.id);
    const namespace = `api-route:${req.method.toUpperCase()}:${bucket}`;
    const state = await consumeApiRateLimit(namespace, identity, policy);

    if (!state.allowed) {
      res.setHeader("Retry-After", String(state.retryAfter || 60));
      res.setHeader("Cache-Control", "private, no-store");
      res.status(429).json({
        error: "Too many requests",
        code: "API_RATE_LIMITED",
      });
      return;
    }

    next();
  } catch (error) {
    console.error("API rate limit error:", error instanceof Error ? error.message : "unknown");
    res.setHeader("Cache-Control", "private, no-store");
    res.status(503).json({
      error: "Request protection is temporarily unavailable",
      code: "RATE_LIMIT_UNAVAILABLE",
    });
  }
}
