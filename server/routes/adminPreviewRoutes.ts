import type { Express, NextFunction, Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { industryGroups, practiceGroups, teamMemberIndustryGroups, teamMemberPracticeGroups } from "@shared/schema";
import { effectivePermissions, resolveAdminSession } from "../auth";
import { db } from "../db";
import { getEditorialTypography } from "../editorialTypography";
import { pick, sendPage, TEMPLATES, type Lang } from "../mirror/htmlPipeline";
import { renderAttorney } from "../mirror/renderAttorney";
import { renderNewsDetail } from "../mirror/renderNews";
import { cfg, getConfigMap } from "../mirror/siteConfig";
import { isPublicPracticeSlug } from "../mirror/publicPracticeGroups";
import { storage } from "../storage";
import { isMfaRequiredForRole } from "../security/mfa";

const previewLanguage = (value: unknown): Lang => value === "en" ? "en" : "es";

function privatePreviewHeaders(res: Response): void {
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  res.setHeader("Vary", "Cookie");
}

/**
 * Previews must not disclose that a private draft exists. Unlike the general API
 * auth middleware, this endpoint deliberately responds with 404 for visitors
 * without a valid, content-authorized administrative session.
 */
async function privatePreviewAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const resolved = await resolveAdminSession(req);
    if (!resolved || (isMfaRequiredForRole(resolved.user.role) && !resolved.session.mfaVerified)) {
      res.sendStatus(404);
      return;
    }
    if (!effectivePermissions(resolved.user).has("content")) {
      res.sendStatus(404);
      return;
    }
    req.adminUser = resolved.user;
    req.adminSession = resolved.session;
    next();
  } catch {
    res.sendStatus(404);
  }
}

async function previewAttorneyGroups(memberId: string) {
  const [practices, industries] = await Promise.all([
    db.select({ name: practiceGroups.name, nameEs: practiceGroups.nameEs, slug: practiceGroups.slug })
      .from(teamMemberPracticeGroups)
      .innerJoin(practiceGroups, eq(teamMemberPracticeGroups.practiceGroupId, practiceGroups.id))
      .where(and(eq(teamMemberPracticeGroups.teamMemberId, memberId), eq(practiceGroups.published, true))),
    db.select({ name: industryGroups.name, nameEs: industryGroups.nameEs, slug: industryGroups.slug })
      .from(teamMemberIndustryGroups)
      .innerJoin(industryGroups, eq(teamMemberIndustryGroups.industryGroupId, industryGroups.id))
      .where(and(eq(teamMemberIndustryGroups.teamMemberId, memberId), eq(industryGroups.published, true))),
  ]);
  return { practiceGroups: practices.filter((group) => isPublicPracticeSlug(group.slug)), industryGroups: industries };
}

/** Private render of the last saved editor state. It intentionally has no public slug route. */
export function registerAdminPreviewRoutes(app: Express): void {
  app.get("/api/admin/preview/news/:id", privatePreviewAccess, async (req: Request, res: Response) => {
    try {
      const item = await storage.getNewsById(req.params.id);
      if (!item) return res.status(404).json({ error: "News not found" });
      const lang = previewLanguage(req.query.lang);
      const [relations, disabledExternalUrls, typography] = await Promise.all([
        storage.getPublicNewsTeamMemberRelations(item.id),
        storage.getDisabledNewsExternalUrls(item.id),
        getEditorialTypography("news", item.id),
      ]);
      const relatedTeamMembers = relations.map((relation) => ({ ...relation.member, relationshipRole: relation.relationshipRole }));
      const authorIds = relatedTeamMembers.filter((member) => member.relationshipRole === "author").map((member) => member.id);
      const relatedNews = await storage.getEditorialRecommendations({
        excludeNewsId: item.id,
        teamMemberIds: authorIds,
        tags: item.tags || [],
        category: item.category,
        limit: 6,
      }).catch(() => []);
      privatePreviewHeaders(res);
      return sendPage(
        res,
        renderNewsDetail(
          pick(TEMPLATES.newsDetail, lang),
          { ...item, disabledExternalUrls, relatedTeamMembers, relatedNews },
          lang,
          typography,
        ),
      );
    } catch (error) {
      console.error("Render private news preview error:", error);
      return res.status(500).json({ error: "Failed to render preview" });
    }
  });

  app.get("/api/admin/preview/team/:id", privatePreviewAccess, async (req: Request, res: Response) => {
    try {
      const member = await storage.getTeamMemberById(req.params.id);
      if (!member) return res.status(404).json({ error: "Team member not found" });
      const lang = previewLanguage(req.query.lang);
      const [groups, typography, config] = await Promise.all([
        previewAttorneyGroups(member.id),
        getEditorialTypography("team_member", member.id),
        getConfigMap(),
      ]);
      privatePreviewHeaders(res);
      return sendPage(
        res,
        renderAttorney(
          pick(TEMPLATES.attorney, lang),
          { ...member, ...groups, relatedNews: [] },
          lang,
          typography,
          { associateExperienceVisible: cfg(config, "associate_experience_visible", lang).trim().toLowerCase() === "true" },
        ),
      );
    } catch (error) {
      console.error("Render private team preview error:", error);
      return res.status(500).json({ error: "Failed to render preview" });
    }
  });
}
