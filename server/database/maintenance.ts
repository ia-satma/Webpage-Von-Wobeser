import type { Request, Response, NextFunction } from "express";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function isMigrationReadOnlyEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.MIGRATION_READ_ONLY === "true";
}

export function migrationReadOnlyGuard(req: Request, res: Response, next: NextFunction): void {
  if (!isMigrationReadOnlyEnabled() || SAFE_METHODS.has(req.method.toUpperCase())) {
    next();
    return;
  }

  res.setHeader("Retry-After", "300");
  res.status(503).json({
    error: "El sitio se encuentra en mantenimiento. Inténtalo nuevamente en unos minutos.",
    code: "MIGRATION_READ_ONLY",
    requestId: String(res.getHeader("X-Request-Id") || ""),
  });
}
