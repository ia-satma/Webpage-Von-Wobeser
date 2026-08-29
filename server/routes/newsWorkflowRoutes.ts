import type { Express, Request, Response } from "express";
import { authMiddleware, requirePermission } from "../auth";
import { storage } from "../storage";

export function registerNewsWorkflowRoutes(app: Express): void {
  // =============================================
  // NEWS-TEAM MEMBERS RELATIONSHIP (Admin)
  // =============================================

  // Add a team member to a news article
  app.post("/api/news/:id/team-members", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const newsId = req.params.id;
      const { teamMemberId, relationshipRole } = req.body;

      if (!teamMemberId || !["author", "related"].includes(relationshipRole)) {
        return res.status(400).json({ error: "teamMemberId and relationshipRole (author or related) are required" });
      }

      const newsItem = await storage.getNewsById(newsId);
      if (!newsItem) {
        return res.status(404).json({ error: "News not found" });
      }

      const teamMember = await storage.getTeamMemberById(teamMemberId);
      if (!teamMember) {
        return res.status(404).json({ error: "Team member not found" });
      }

      await storage.addTeamMemberToNews(newsId, teamMemberId, relationshipRole);
      res.status(201).json({ success: true, message: "Team member added to news article" });
    } catch (error) {
      console.error("Add team member to news error:", error);
      res.status(500).json({ error: "Failed to add team member to news" });
    }
  });

  // Remove a team member from a news article
  app.delete("/api/news/:id/team-members/:teamMemberId", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const { id: newsId, teamMemberId } = req.params;

      const newsItem = await storage.getNewsById(newsId);
      if (!newsItem) {
        return res.status(404).json({ error: "News not found" });
      }

      await storage.removeTeamMemberFromNews(newsId, teamMemberId);
      res.json({ success: true, message: "Team member removed from news article" });
    } catch (error) {
      console.error("Remove team member from news error:", error);
      res.status(500).json({ error: "Failed to remove team member from news" });
    }
  });

  // =============================================
  // AUTOMATED LEGAL-RISK REVIEW API (Human-in-the-Loop)
  // =============================================

  // POST /api/news/:id/validate - Validate and publish article
  app.post("/api/news/:id/validate", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const newsItem = await storage.getNewsById(id);

      if (!newsItem) {
        return res.status(404).json({ error: "News article not found" });
      }

      // Only allow validation if ready_for_approval
      if (newsItem.processingStatus !== 'ready_for_approval') {
        return res.status(400).json({
          error: "Article must be ready for approval before validation",
          currentStatus: newsItem.processingStatus
        });
      }

      // La publicación exige una aprobación explícita: estados como
      // `pending_revision` o `escalated` son precisamente una señal para no
      // exponer todavía el contenido.
      const verdict = newsItem.councilVerdict as any;
      if (!verdict || verdict.overallStatus !== 'approved') {
        return res.status(409).json({
          code: "ARTICLE_REQUIRES_COUNCIL_APPROVAL",
          error: "Article requires an approved automated risk review and an authorized human publication decision",
          verdict
        });
      }

      // Update status to ready (published)
      await storage.updateNews(id, {
        processingStatus: 'ready',
        published: true,
        lastProcessedAt: new Date(),
      });

      res.json({
        success: true,
        message: "Article validated and published successfully",
        newStatus: 'ready'
      });
    } catch (error) {
      console.error("Validate article error:", error);
      res.status(500).json({ error: "Failed to validate article" });
    }
  });

  // POST /api/news/:id/council-review - Re-run council review
  app.post("/api/news/:id/council-review", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const newsItem = await storage.getNewsById(id);

      if (!newsItem) {
        return res.status(404).json({ error: "News article not found" });
      }

      if (!newsItem.content) {
        return res.status(400).json({ error: "Article has no content to review" });
      }

      // Run the automated risk review. This is decision support, not legal advice.
      const { legalCouncilService } = await import('../../services/agents/LegalCouncilService');
      const verdict = await legalCouncilService.evaluateArticle(newsItem.content);

      // Update article with new verdict
      const newStatus = verdict.overallStatus === 'rejected' ? 'failed' : 'ready_for_approval';
      await storage.updateNews(id, {
        councilVerdict: verdict,
        processingStatus: newStatus,
        lastProcessedAt: new Date(),
        failedStep: verdict.overallStatus === 'rejected' ? 'council' : null,
      });

      res.json({
        success: true,
        verdict,
        newStatus
      });
    } catch (error) {
      console.error("Council review error:", error);
      res.status(500).json({ error: "Failed to run council review" });
    }
  });
}
