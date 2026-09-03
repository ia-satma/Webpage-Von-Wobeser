import type { Express, Request, Response } from "express";
import { eq, sql } from "drizzle-orm";
import { careerApplications, contactSubmissions } from "@shared/schema";
import { authMiddleware, effectivePermissions } from "../auth";
import { db } from "../db";
import { storage } from "../storage";

/**
 * Counts for the admin sidebar. This endpoint deliberately returns only aggregate numbers;
 * it never loads names, email addresses, messages, or private documents.
 */
export function registerAdminNavigationRoutes(app: Express): void {
  app.get("/api/admin/navigation-status", authMiddleware, async (req: Request, res: Response) => {
    try {
      const permissions = effectivePermissions(req.adminUser!);
      const payload: { drafts?: number; unreadContact?: number; unreadCareer?: number } = {};
      const queries: Promise<void>[] = [];

      if (permissions.has("content")) {
        queries.push(storage.getNewsStatusCounts().then((counts) => { payload.drafts = counts.unpublished; }));
      }
      if (permissions.has("contact_submissions")) {
        queries.push(
          db.select({ count: sql<number>`count(*)::int` })
            .from(contactSubmissions)
            .where(eq(contactSubmissions.read, false))
            .then(([row]) => { payload.unreadContact = row?.count ?? 0; }),
        );
      }
      if (permissions.has("career_applications")) {
        queries.push(
          db.select({ count: sql<number>`count(*)::int` })
            .from(careerApplications)
            .where(eq(careerApplications.read, false))
            .then(([row]) => { payload.unreadCareer = row?.count ?? 0; }),
        );
      }

      await Promise.all(queries);
      res.setHeader("Cache-Control", "private, no-store");
      return res.json(payload);
    } catch (error) {
      console.error("Get admin navigation status error:", error);
      return res.status(500).json({ error: "Failed to fetch navigation status" });
    }
  });
}
