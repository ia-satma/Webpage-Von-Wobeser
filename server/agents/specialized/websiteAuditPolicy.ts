import type { IndustryGroup, News, PracticeGroup, TeamMember } from "@shared/schema";

export function isPublishedEntity(entity: { published?: boolean | null }): boolean {
  return entity.published === true;
}

export function isPublicNews(item: News, now: Date = new Date()): boolean {
  if (item.published !== true) return false;
  if (!item.publishAt) return true;
  const publishAt = new Date(item.publishAt);
  return Number.isFinite(publishAt.getTime()) && publishAt.getTime() <= now.getTime();
}

export function visibleTextLength(value: unknown): number {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim().length;
}

export function teamMemberContentIssues(member: TeamMember): string[] {
  const issues: string[] = [];
  if (visibleTextLength(member.bio) < 50) issues.push("Missing or short biography");
  if (!member.imageUrl) issues.push("Missing profile photo");
  if (!member.email) issues.push("Missing email");
  if (!member.phone) issues.push("Missing phone number");
  if (!Array.isArray(member.education) || member.education.length === 0) issues.push("No education listed");
  return issues;
}

export function practiceGroupContentIssues(group: PracticeGroup): string[] {
  return visibleTextLength(group.description) < 100
    && visibleTextLength(group.fullDescription) < 100
    ? ["Missing or short introduction and body"]
    : [];
}

export function industryGroupContentIssues(group: IndustryGroup): string[] {
  return visibleTextLength(group.description) < 100
    && visibleTextLength(group.fullDescription) < 100
    ? ["Missing or short introduction and body"]
    : [];
}

export type NewsSeoIssue = {
  issueType: "missing_slug" | "short_title" | "short_meta_description" | "missing_featured_image";
  severity: "high" | "medium" | "low";
  issue: string;
  recommendation: string;
  ownerAgent: "seo_optimizer" | "image_suggestion";
};

export function newsSeoIssues(item: News): NewsSeoIssue[] {
  const issues: NewsSeoIssue[] = [];
  if (!item.slug) {
    issues.push({
      issueType: "missing_slug",
      severity: "high",
      issue: "Missing SEO-friendly slug",
      recommendation: `Add a stable SEO slug to article "${item.title}"`,
      ownerAgent: "seo_optimizer",
    });
  }
  if (visibleTextLength(item.title) < 20) {
    issues.push({
      issueType: "short_title",
      severity: "low",
      issue: "Title may be too short for SEO",
      recommendation: `Review the SEO title for article "${item.title}"`,
      ownerAgent: "seo_optimizer",
    });
  }
  if (visibleTextLength(item.excerpt) < 50) {
    issues.push({
      issueType: "short_meta_description",
      severity: "medium",
      issue: "Excerpt/meta description too short",
      recommendation: `Write a descriptive excerpt for article "${item.title}"`,
      ownerAgent: "seo_optimizer",
    });
  }
  if (!item.imageUrl) {
    issues.push({
      issueType: "missing_featured_image",
      severity: "low",
      issue: "Missing featured image; institutional fallback remains active",
      recommendation: `Consider adding a featured image to article "${item.title}"`,
      ownerAgent: "image_suggestion",
    });
  }
  return issues;
}
