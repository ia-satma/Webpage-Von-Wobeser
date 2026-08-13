import { eq, desc, and } from "drizzle-orm";
import { type WebsiteAudit, type InsertWebsiteAudit, type WebsiteAuditFinding, type InsertWebsiteAuditFinding, websiteAudits, websiteAuditFindings } from "@shared/schema";
import type { StorageDatabase } from "../types";

export function createAuditRepository(db: StorageDatabase) {
  class AuditRepository {
    // Website Audits
    async createWebsiteAudit(audit: InsertWebsiteAudit): Promise<WebsiteAudit> {
      const [item] = await db.insert(websiteAudits).values(audit).returning();
      return item;
    }

    async getWebsiteAudit(id: string): Promise<WebsiteAudit | undefined> {
      const [audit] = await db.select().from(websiteAudits).where(eq(websiteAudits.id, id));
      return audit;
    }

    async getWebsiteAudits(limit: number = 20): Promise<WebsiteAudit[]> {
      return db.select().from(websiteAudits).orderBy(desc(websiteAudits.startedAt)).limit(limit);
    }

    async getLatestWebsiteAudit(): Promise<WebsiteAudit | undefined> {
      const [audit] = await db.select().from(websiteAudits).orderBy(desc(websiteAudits.startedAt)).limit(1);
      return audit;
    }

    async updateWebsiteAudit(id: string, data: Partial<InsertWebsiteAudit>): Promise<WebsiteAudit | undefined> {
      const [item] = await db.update(websiteAudits).set(data).where(eq(websiteAudits.id, id)).returning();
      return item;
    }

    // Website Audit Findings
    async createWebsiteAuditFinding(finding: InsertWebsiteAuditFinding): Promise<WebsiteAuditFinding> {
      const [item] = await db.insert(websiteAuditFindings).values(finding).returning();
      return item;
    }

    async createWebsiteAuditFindings(findings: InsertWebsiteAuditFinding[]): Promise<WebsiteAuditFinding[]> {
      if (findings.length === 0) return [];
      return db.insert(websiteAuditFindings).values(findings).returning();
    }

    async getWebsiteAuditFindings(auditId: string): Promise<WebsiteAuditFinding[]> {
      return db.select().from(websiteAuditFindings).where(eq(websiteAuditFindings.auditId, auditId)).orderBy(desc(websiteAuditFindings.reportedAt));
    }

    async getWebsiteAuditFindingsByCategory(auditId: string, category: string): Promise<WebsiteAuditFinding[]> {
      return db.select().from(websiteAuditFindings).where(
        and(
          eq(websiteAuditFindings.auditId, auditId),
          eq(websiteAuditFindings.category, category)
        )
      ).orderBy(desc(websiteAuditFindings.reportedAt));
    }

    async getWebsiteAuditFindingsBySeverity(auditId: string, severity: string): Promise<WebsiteAuditFinding[]> {
      return db.select().from(websiteAuditFindings).where(
        and(
          eq(websiteAuditFindings.auditId, auditId),
          eq(websiteAuditFindings.severity, severity)
        )
      ).orderBy(desc(websiteAuditFindings.reportedAt));
    }

    async getOpenFindings(): Promise<WebsiteAuditFinding[]> {
      return db.select().from(websiteAuditFindings).where(
        eq(websiteAuditFindings.status, 'open')
      ).orderBy(desc(websiteAuditFindings.reportedAt));
    }

    async updateWebsiteAuditFinding(id: string, data: Partial<InsertWebsiteAuditFinding>): Promise<WebsiteAuditFinding | undefined> {
      const [item] = await db.update(websiteAuditFindings).set(data).where(eq(websiteAuditFindings.id, id)).returning();
      return item;
    }

    async resolveWebsiteAuditFinding(id: string, resolvedBy: string): Promise<WebsiteAuditFinding | undefined> {
      const [item] = await db.update(websiteAuditFindings).set({
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy
      }).where(eq(websiteAuditFindings.id, id)).returning();
      return item;
    }
  }

  return new AuditRepository();
}
