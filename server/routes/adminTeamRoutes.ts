import type { Express, NextFunction, Request, Response } from "express";
import { insertTeamMemberSchema } from "@shared/schema";
import { z, ZodError } from "zod";
import { authMiddleware, requirePermission } from "../auth";
import { sanitizeFields } from "../mirror/sanitize";
import { storage } from "../storage";
import { apiError, auditLog, getLinguisticWarnings } from "./routeUtils";

export function registerAdminTeamRoutes(app: Express): void {
  // =============================================
  // ADMIN TEAM MEMBERS CRUD
  // =============================================

  // Get all team members (admin)
  app.get("/api/admin/team", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const parsed = z.object({
        page: z.coerce.number().int().min(1).max(100_000).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        search: z.string().trim().max(160).default(""),
        role: z.string().trim().max(80).default(""),
      }).safeParse(req.query);
      if (!parsed.success) return res.status(400).json({ error: "Invalid pagination or filters" });
      const { page, limit, search, role } = parsed.data;

      let members = await storage.getTeamMembers();

      // Filter by search term
      if (search) {
        const searchLower = search.toLowerCase();
        members = members.filter(m =>
          m.name.toLowerCase().includes(searchLower) ||
          (m.email && m.email.toLowerCase().includes(searchLower))
        );
      }

      // Filter by role/title
      if (role && role !== "all") {
        members = members.filter(m => m.title.toLowerCase().includes(role.toLowerCase()));
      }

      const total = members.length;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;
      const paginatedMembers = members.slice(offset, offset + limit);

      res.json({
        members: paginatedMembers,
        total,
        page,
        totalPages,
      });
    } catch (error) {
      console.error("Get admin team members error:", error);
      res.status(500).json({ error: "Failed to fetch team members" });
    }
  });

  // Get single team member (admin)
  app.get("/api/admin/team/:id", authMiddleware, requirePermission("content"), async (req: Request, res: Response, next: NextFunction) => {
    // "stats" es una subruta específica registrada después; no la trates como un id.
    if (req.params.id === "stats") return next();
    try {
      const member = await storage.getTeamMemberById(req.params.id);
      if (!member) {
        return res.status(404).json({ error: "Team member not found" });
      }
      const [practiceGroupIds, industryGroupIds] = await Promise.all([
        storage.getTeamMemberPracticeGroupIds(member.id),
        storage.getTeamMemberIndustryGroupIds(member.id),
      ]);
      res.json({ ...member, practiceGroupIds, industryGroupIds });
    } catch (error) {
      console.error("Get team member error:", error);
      res.status(500).json({ error: "Failed to fetch team member" });
    }
  });

  // Create team member
  app.post("/api/admin/team", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertTeamMemberSchema.parse(req.body);
      sanitizeFields(validatedData, ["bio", "bioEs", "bioIntro", "bioIntroEs"]);
      const member = await storage.createTeamMember(validatedData);
      const practiceGroupIds = Array.isArray(req.body.practiceGroupIds) ? req.body.practiceGroupIds : [];
      const industryGroupIds = Array.isArray(req.body.industryGroupIds) ? req.body.industryGroupIds : [];
      await Promise.all([
        storage.setTeamMemberPracticeGroups(member.id, practiceGroupIds),
        storage.setTeamMemberIndustryGroups(member.id, industryGroupIds),
      ]);
      await auditLog("create", "team", member.id, (req as any).adminUser?.id || "unknown", undefined, req);
      const linguisticWarnings = await getLinguisticWarnings([
        { field: "title", lang: "en", text: member.title },
        { field: "titleEs", lang: "es", text: member.titleEs },
        { field: "bioIntro", lang: "en", text: member.bioIntro },
        { field: "bioIntroEs", lang: "es", text: member.bioIntroEs },
        { field: "bio", lang: "en", text: member.bio },
        { field: "bioEs", lang: "es", text: member.bioEs },
      ]);
      res.status(201).json({ ...member, practiceGroupIds, industryGroupIds, linguisticWarnings });
    } catch (error) {
      if (error instanceof ZodError) {
        return apiError(res, 400, "Validation failed", error.errors);
      }
      console.error("Create team member error:", error);
      return apiError(res, 500, "Failed to create team member");
    }
  });

  // Update team member
  app.put("/api/admin/team/:id", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertTeamMemberSchema.partial().parse(req.body);
      sanitizeFields(validatedData, ["bio", "bioEs", "bioIntro", "bioIntroEs"]);
      // Si el body solo trae practiceGroupIds/industryGroupIds (sin campos propios de
      // teamMembers), no hay nada que actualizar en la tabla principal — Drizzle
      // rechaza un SET vacío. Solo se llama a updateTeamMember si hay campos reales.
      const member = Object.keys(validatedData).length > 0
        ? await storage.updateTeamMember(req.params.id, validatedData)
        : await storage.getTeamMemberById(req.params.id);
      if (!member) {
        return apiError(res, 404, "Team member not found");
      }
      let practiceGroupIds: string[] | undefined;
      let industryGroupIds: string[] | undefined;
      if (Array.isArray(req.body.practiceGroupIds)) {
        practiceGroupIds = req.body.practiceGroupIds;
        await storage.setTeamMemberPracticeGroups(member.id, practiceGroupIds!);
      }
      if (Array.isArray(req.body.industryGroupIds)) {
        industryGroupIds = req.body.industryGroupIds;
        await storage.setTeamMemberIndustryGroups(member.id, industryGroupIds!);
      }
      await auditLog("update", "team", req.params.id, (req as any).adminUser?.id || "unknown", undefined, req);
      const linguisticWarnings = await getLinguisticWarnings([
        { field: "title", lang: "en", text: member.title },
        { field: "titleEs", lang: "es", text: member.titleEs },
        { field: "bioIntro", lang: "en", text: member.bioIntro },
        { field: "bioIntroEs", lang: "es", text: member.bioIntroEs },
        { field: "bio", lang: "en", text: member.bio },
        { field: "bioEs", lang: "es", text: member.bioEs },
      ]);
      res.json({ ...member, ...(practiceGroupIds && { practiceGroupIds }), ...(industryGroupIds && { industryGroupIds }), linguisticWarnings });
    } catch (error) {
      if (error instanceof ZodError) {
        return apiError(res, 400, "Validation failed", error.errors);
      }
      console.error("Update team member error:", error);
      return apiError(res, 500, "Failed to update team member");
    }
  });

  // Delete team member
  app.delete("/api/admin/team/:id", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteTeamMember(req.params.id);
      if (!deleted) {
        return apiError(res, 404, "Team member not found");
      }
      await auditLog("delete", "team", req.params.id, (req as any).adminUser?.id || "unknown", undefined, req);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete team member error:", error);
      return apiError(res, 500, "Failed to delete team member");
    }
  });

  // Get team stats
  app.get("/api/admin/team/stats", authMiddleware, requirePermission("content"), async (_req: Request, res: Response) => {
    try {
      const members = await storage.getTeamMembers();
      const partners = members.filter(m => m.title.toLowerCase().includes("partner") || m.isPartner);
      const ofCounsel = members.filter(m => m.title.toLowerCase().includes("of counsel"));
      const associates = members.filter(m => m.title.toLowerCase().includes("associate"));

      res.json({
        total: members.length,
        partners: partners.length,
        ofCounsel: ofCounsel.length,
        associates: associates.length,
      });
    } catch (error) {
      console.error("Get team stats error:", error);
      res.status(500).json({ error: "Failed to fetch team stats" });
    }
  });
}
