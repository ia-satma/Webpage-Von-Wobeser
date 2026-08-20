import { eq, desc, and, sql, inArray, ilike, or, type SQL } from "drizzle-orm";
import { type ContactSubmission, type InsertContactSubmission, contactSubmissions, type NewsletterSubscriber, type InsertNewsletterSubscriber, newsletterSubscribers, type CareerApplication, type InsertCareerApplication, careerApplications, type ProcessedOfficialSource, type InsertProcessedOfficialSource, processedOfficialSources, protectedFieldEnvelopes } from "@shared/schema";
import { buildProtectedFieldEnvelopes } from "../../security/fieldEncryption";
import type { StorageDatabase } from "../types";

export function createSubmissionRepository(db: StorageDatabase) {
  class SubmissionRepository {
    async createContactSubmission(data: InsertContactSubmission): Promise<ContactSubmission> {
      return db.transaction(async (tx) => {
        const [submission] = await tx.insert(contactSubmissions).values(data).returning();
        const envelopes = buildProtectedFieldEnvelopes("contact_submission", submission.id, {
          full_name: data.fullName,
          email: data.email,
          phone: data.phone,
          company: data.company,
          country: data.country,
          practice_area: data.practiceArea,
          message: data.message,
        });
        if (envelopes.length) await tx.insert(protectedFieldEnvelopes).values(envelopes);
        return submission;
      });
    }

    async getContactSubmissions(): Promise<ContactSubmission[]> {
      return db.select().from(contactSubmissions).orderBy(desc(contactSubmissions.submittedAt));
    }

    async markContactSubmissionRead(id: string): Promise<boolean> {
      const result = await db.update(contactSubmissions).set({ read: true }).where(eq(contactSubmissions.id, id)).returning({ id: contactSubmissions.id });
      return result.length > 0;
    }

    async deleteExpiredContactSubmissions(): Promise<number> {
      const deleted = await db.delete(contactSubmissions)
        .where(sql`${contactSubmissions.submittedAt} < NOW() - INTERVAL '12 months'`)
        .returning({ id: contactSubmissions.id });
      return deleted.length;
    }

    async getNewsletterSubscribers(filters: { search?: string; active?: boolean } = {}): Promise<NewsletterSubscriber[]> {
      const conditions: SQL[] = [];
      if (typeof filters.active === "boolean") conditions.push(eq(newsletterSubscribers.isActive, filters.active));
      const search = filters.search?.trim();
      if (search) {
        const pattern = `%${search.replace(/[%_\\]/g, "\\$&")}%`;
        conditions.push(or(
          ilike(newsletterSubscribers.name, pattern),
          ilike(newsletterSubscribers.email, pattern),
          ilike(newsletterSubscribers.company, pattern),
        )!);
      }
      if (!conditions.length) return db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.subscribedAt));
      return db.select().from(newsletterSubscribers).where(and(...conditions)).orderBy(desc(newsletterSubscribers.subscribedAt));
    }

    async getNewsletterSubscriberByEmail(email: string): Promise<NewsletterSubscriber | undefined> {
      const [subscriber] = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, email));
      return subscriber;
    }

    async getNewsletterSubscriberById(id: string): Promise<NewsletterSubscriber | undefined> {
      const [subscriber] = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.id, id));
      return subscriber;
    }

    async createNewsletterSubscriber(data: InsertNewsletterSubscriber): Promise<NewsletterSubscriber> {
      const [subscriber] = await db.insert(newsletterSubscribers).values(data).returning();
      return subscriber;
    }

    async updateNewsletterSubscriber(id: string, data: Partial<InsertNewsletterSubscriber>): Promise<NewsletterSubscriber | undefined> {
      const [subscriber] = await db.update(newsletterSubscribers).set(data).where(eq(newsletterSubscribers.id, id)).returning();
      return subscriber;
    }

    async createCareerApplication(data: InsertCareerApplication): Promise<CareerApplication> {
      return db.transaction(async (tx) => {
        const [application] = await tx.insert(careerApplications).values(data).returning();
        const envelopes = buildProtectedFieldEnvelopes("career_application", application.id, {
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          address: data.address,
          cv_original_name: data.cvOriginalName,
        });
        if (envelopes.length) await tx.insert(protectedFieldEnvelopes).values(envelopes);
        return application;
      });
    }

    async getCareerApplications(): Promise<CareerApplication[]> {
      return db.select().from(careerApplications).orderBy(desc(careerApplications.submittedAt));
    }

    async getCareerApplication(id: string): Promise<CareerApplication | undefined> {
      const [application] = await db.select().from(careerApplications).where(eq(careerApplications.id, id));
      return application;
    }

    async getCareerApplicationByCvPath(cvPath: string): Promise<CareerApplication | undefined> {
      const [application] = await db.select().from(careerApplications).where(eq(careerApplications.cvPath, cvPath));
      return application;
    }

    async markCareerApplicationRead(id: string): Promise<boolean> {
      const result = await db.update(careerApplications).set({ read: true }).where(eq(careerApplications.id, id)).returning({ id: careerApplications.id });
      return result.length > 0;
    }

    async getExpiredCareerApplications(): Promise<CareerApplication[]> {
      return db.select().from(careerApplications)
        .where(sql`${careerApplications.submittedAt} < NOW() - INTERVAL '12 months'`);
    }

    async deleteCareerApplications(ids: string[]): Promise<number> {
      if (!ids.length) return 0;
      const deleted = await db.delete(careerApplications)
        .where(inArray(careerApplications.id, ids))
        .returning({ id: careerApplications.id });
      return deleted.length;
    }

    async isSourceProcessed(sourceUrl: string): Promise<boolean> {
      const [existing] = await db.select({ id: processedOfficialSources.id }).from(processedOfficialSources).where(eq(processedOfficialSources.sourceUrl, sourceUrl));
      return !!existing;
    }

    async markSourceProcessed(data: InsertProcessedOfficialSource): Promise<ProcessedOfficialSource> {
      const [row] = await db.insert(processedOfficialSources).values(data)
        .onConflictDoUpdate({ target: processedOfficialSources.sourceUrl, set: { status: data.status, newsId: data.newsId, sourceHash: data.sourceHash } })
        .returning();
      return row;
    }
  }

  return new SubmissionRepository();
}
