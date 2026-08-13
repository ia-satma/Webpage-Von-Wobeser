import type { Express, Request, Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { authMiddleware, requirePermission } from "../auth";
import { openPersistentPrivateCvStream } from "../media/privateDocuments";
import { escapeCsvCell } from "../security/csv";
import { resolvePrivateCvStoragePath } from "../security/uploads";
import { storage } from "../storage";
import { auditLog } from "./routeUtils";

const uploadsDir = path.join(process.cwd(), "uploads");

function newsletterFilters(req: Request) {
  const search = typeof req.query.search === "string" ? req.query.search.slice(0, 160) : undefined;
  const state = typeof req.query.active === "string" ? req.query.active : "all";
  return { search, active: state === "active" ? true : state === "inactive" ? false : undefined };
}

export function registerAdminSubmissionRoutes(app: Express): void {
  app.get("/api/admin/contact-submissions", authMiddleware, requirePermission("contact_submissions"), async (_req: Request, res: Response) => {
    try {
      res.json(await storage.getContactSubmissions());
    } catch (error) {
      console.error("Get contact submissions error:", error);
      res.status(500).json({ error: "Failed to fetch contact submissions" });
    }
  });

  app.patch("/api/admin/contact-submissions/:id/read", authMiddleware, requirePermission("contact_submissions"), async (req: Request, res: Response) => {
    try {
      const found = await storage.markContactSubmissionRead(req.params.id);
      if (!found) return res.status(404).json({ error: "Submission not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Mark contact submission read error:", error);
      res.status(500).json({ error: "Failed to update submission" });
    }
  });

  app.get("/api/admin/career-applications", authMiddleware, requirePermission("career_applications"), async (_req: Request, res: Response) => {
    try {
      res.json(await storage.getCareerApplications());
    } catch (error) {
      console.error("Get career applications error:", error);
      res.status(500).json({ error: "Failed to fetch career applications" });
    }
  });

  app.get(
    "/api/admin/career-applications/:id/cv",
    authMiddleware,
    requirePermission("career_applications"),
    requirePermission("private_downloads"),
    async (req: Request, res: Response) => {
      try {
        if (!z.string().uuid().safeParse(req.params.id).success) {
          return res.status(404).json({ error: "Application not found" });
        }
        const application = await storage.getCareerApplication(req.params.id);
        if (!application) return res.status(404).json({ error: "Application not found" });

        let absolutePath = resolvePrivateCvStoragePath(application.cvPath);
        if (!absolutePath && application.cvPath.startsWith("/uploads/")) {
          const legacyPath = path.resolve(uploadsDir, path.basename(application.cvPath));
          if (path.dirname(legacyPath) === path.resolve(uploadsDir)) absolutePath = legacyPath;
        }
        const hasLocalFile = Boolean(absolutePath && fs.existsSync(absolutePath));
        const persistentStream = hasLocalFile ? null : await openPersistentPrivateCvStream(application.cvPath);
        if (!hasLocalFile && !persistentStream) return res.status(404).json({ error: "Document not found" });

        const sourceName = absolutePath || application.cvPath;
        const original = (application.cvOriginalName || path.basename(sourceName))
          .replace(/[\r\n"\\]/g, "_")
          .slice(0, 180);
        const fallback = original.replace(/[^\x20-\x7e]/g, "_") || "cv";
        const extension = path.extname(sourceName).toLowerCase();
        const contentType = extension === ".pdf"
          ? "application/pdf"
          : extension === ".docx"
            ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            : "application/msword";
        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Disposition", `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(original)}`);
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Content-Security-Policy", "sandbox");
        res.setHeader("Cache-Control", "private, no-store");
        auditLog("update", "career_application_cv_download", application.id, req.adminUser!.id);
        if (hasLocalFile && absolutePath) return res.sendFile(absolutePath);
        persistentStream!.once("error", () => {
          if (!res.headersSent) res.status(404).end();
          else res.destroy();
        });
        persistentStream!.pipe(res);
      } catch {
        res.status(500).json({ error: "Failed to download document" });
      }
    },
  );

  app.patch("/api/admin/career-applications/:id/read", authMiddleware, requirePermission("career_applications"), async (req: Request, res: Response) => {
    try {
      const found = await storage.markCareerApplicationRead(req.params.id);
      if (!found) return res.status(404).json({ error: "Application not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Mark career application read error:", error);
      res.status(500).json({ error: "Failed to update application" });
    }
  });

  app.get("/api/admin/newsletter-subscribers", authMiddleware, requirePermission("newsletter"), async (req: Request, res: Response) => {
    try {
      res.json(await storage.getNewsletterSubscribers(newsletterFilters(req)));
    } catch (error) {
      console.error("Get newsletter subscribers error:", error);
      res.status(500).json({ error: "Failed to fetch newsletter subscribers" });
    }
  });

  app.patch("/api/admin/newsletter-subscribers/:id/active", authMiddleware, requirePermission("newsletter"), async (req: Request, res: Response) => {
    try {
      const body = z.object({ isActive: z.boolean() }).safeParse(req.body);
      if (!body.success) return res.status(400).json({ error: "Validation failed", details: body.error.errors });
      const subscriber = await storage.updateNewsletterSubscriber(req.params.id, {
        isActive: body.data.isActive,
        unsubscribedAt: body.data.isActive ? null : new Date(),
      });
      if (!subscriber) return res.status(404).json({ error: "Subscriber not found" });
      res.json(subscriber);
    } catch (error) {
      console.error("Update newsletter subscriber error:", error);
      res.status(500).json({ error: "Failed to update newsletter subscriber" });
    }
  });

  app.get(
    "/api/admin/newsletter-subscribers/export.csv",
    authMiddleware,
    requirePermission("newsletter"),
    requirePermission("exports"),
    async (req: Request, res: Response) => {
      try {
        const subscribers = await storage.getNewsletterSubscribers(newsletterFilters(req));
        const header = ["Nombre", "Correo", "Empresa", "Idioma", "Fecha de suscripción", "Consentimiento", "Origen", "Estado"];
        const rows = subscribers.map((subscriber) => [
          subscriber.name,
          subscriber.email,
          subscriber.company,
          subscriber.preferredLanguage,
          subscriber.subscribedAt?.toISOString() ?? "",
          subscriber.consentedAt?.toISOString() ?? "",
          subscriber.source,
          subscriber.isActive ? "Activo" : "Inactivo",
        ]);
        const csv = [header, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
        auditLog("create", "newsletter_export", null, req.adminUser!.id, {
          rowCount: subscribers.length,
          filtered: Object.values(newsletterFilters(req)).some((value) => value !== undefined),
        });
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("Content-Disposition", "attachment; filename=newsletter-subscribers.csv");
        res.send(`\uFEFF${csv}`);
      } catch (error) {
        console.error("Export newsletter subscribers error:", error);
        res.status(500).json({ error: "Failed to export newsletter subscribers" });
      }
    },
  );

  const retiredDeskApi = (_req: Request, res: Response) => {
    res.status(410).json({ error: "The Desk API has been retired" });
  };
  app.all(["/api/admin/desks", "/api/admin/desks/:id", "/api/admin/desks/:id/team"], retiredDeskApi);
}
