import { eq, desc, asc, and, gte, sql } from "drizzle-orm";
import { hasExactRankingSet } from "../../rankings/order";
import { type Event, type InsertEvent, type FirmRanking, type InsertRanking, type Award, type InsertAward, type RepresentativeClient, type InsertRepresentativeClient, type Testimonial, type InsertTestimonial, type JobOpening, type InsertJobOpening, type Office, type InsertOffice, type Alliance, type InsertAlliance, events, rankings, awards, representativeClients, testimonials, jobOpenings, offices, alliances } from "@shared/schema";
import type { StorageDatabase } from "../types";

export function createCatalogRepository(db: StorageDatabase) {
  class CatalogRepository {
    // Events CRUD
    async getEvents(): Promise<Event[]> {
      return db.select().from(events).where(eq(events.published, true)).orderBy(desc(events.date));
    }

    async getAdminEvents(): Promise<Event[]> {
      return db.select().from(events).orderBy(desc(events.date));
    }

    async getEventById(id: string): Promise<Event | undefined> {
      const [event] = await db.select().from(events).where(eq(events.id, id));
      return event;
    }

    async getUpcomingEvents(limit: number = 4): Promise<Event[]> {
      const now = new Date();
      return db
        .select()
        .from(events)
        .where(and(eq(events.published, true), gte(events.date, now)))
        .orderBy(asc(events.date))
        .limit(limit);
    }

    async createEvent(event: InsertEvent): Promise<Event> {
      const [item] = await db.insert(events).values(event).returning();
      return item;
    }

    async updateEvent(id: string, eventData: Partial<InsertEvent>): Promise<Event | undefined> {
      const [updated] = await db.update(events).set(eventData).where(eq(events.id, id)).returning();
      return updated;
    }

    async deleteEvent(id: string): Promise<boolean> {
      const result = await db.delete(events).where(eq(events.id, id));
      return (result.rowCount ?? 0) > 0;
    }

    // Rankings CRUD
    async getRankings(): Promise<FirmRanking[]> {
      return db
        .select()
        .from(rankings)
        .orderBy(
          sql`CASE WHEN ${rankings.order} > 0 THEN 0 ELSE 1 END`,
          asc(rankings.order),
          desc(rankings.year),
          asc(rankings.createdAt),
          asc(rankings.id),
        );
    }

    async getRankingById(id: string): Promise<FirmRanking | undefined> {
      const [ranking] = await db.select().from(rankings).where(eq(rankings.id, id));
      return ranking;
    }

    async createRanking(ranking: InsertRanking): Promise<FirmRanking> {
      return db.transaction(async (tx) => {
        await tx.execute(sql`LOCK TABLE ${rankings} IN SHARE ROW EXCLUSIVE MODE`);
        const [current] = await tx
          .select({ maxOrder: sql<number>`COALESCE(MAX(${rankings.order}), 0)` })
          .from(rankings);
        const nextOrder = Number(current?.maxOrder ?? 0) + 1;
        const [item] = await tx
          .insert(rankings)
          .values({ ...ranking, order: nextOrder })
          .returning();
        return item;
      });
    }

    async updateRanking(id: string, rankingData: Partial<InsertRanking>): Promise<FirmRanking | undefined> {
      const [updated] = await db.update(rankings).set(rankingData).where(eq(rankings.id, id)).returning();
      return updated;
    }

    async deleteRanking(id: string): Promise<boolean> {
      const result = await db.delete(rankings).where(eq(rankings.id, id));
      return (result.rowCount ?? 0) > 0;
    }

    async reorderRankings(ids: string[]): Promise<
      | { ok: true; rankings: FirmRanking[] }
      | { ok: false; reason: "stale" }
    > {
      return db.transaction(async (tx) => {
        // Evita que una alta, baja o segundo reordenamiento modifique el conjunto
        // mientras se validan y asignan las posiciones.
        await tx.execute(sql`LOCK TABLE ${rankings} IN SHARE ROW EXCLUSIVE MODE`);
        const current = await tx.select({ id: rankings.id }).from(rankings);

        if (!hasExactRankingSet(current.map((item) => item.id), ids)) {
          return { ok: false as const, reason: "stale" as const };
        }

        for (let index = 0; index < ids.length; index += 1) {
          const id = ids[index];
          await tx
            .update(rankings)
            .set({ order: index + 1 })
            .where(eq(rankings.id, id));
        }

        const reordered = await tx
          .select()
          .from(rankings)
          .orderBy(asc(rankings.order), asc(rankings.id));
        return { ok: true as const, rankings: reordered };
      });
    }

    // Awards CRUD
    async getAwards(): Promise<Award[]> {
      return db.select().from(awards).orderBy(desc(awards.year), asc(awards.order));
    }

    async getAwardById(id: string): Promise<Award | undefined> {
      const [award] = await db.select().from(awards).where(eq(awards.id, id));
      return award;
    }

    async createAward(award: InsertAward): Promise<Award> {
      const [item] = await db.insert(awards).values(award).returning();
      return item;
    }

    async updateAward(id: string, awardData: Partial<InsertAward>): Promise<Award | undefined> {
      const [updated] = await db.update(awards).set(awardData).where(eq(awards.id, id)).returning();
      return updated;
    }

    async deleteAward(id: string): Promise<boolean> {
      const result = await db.delete(awards).where(eq(awards.id, id));
      return (result.rowCount ?? 0) > 0;
    }

    // Representative Clients CRUD
    async getRepresentativeClients(): Promise<RepresentativeClient[]> {
      return db.select().from(representativeClients).orderBy(asc(representativeClients.order));
    }

    async getRepresentativeClientById(id: string): Promise<RepresentativeClient | undefined> {
      const [client] = await db.select().from(representativeClients).where(eq(representativeClients.id, id));
      return client;
    }

    async createRepresentativeClient(client: InsertRepresentativeClient): Promise<RepresentativeClient> {
      const [item] = await db.insert(representativeClients).values(client).returning();
      return item;
    }

    async updateRepresentativeClient(id: string, clientData: Partial<InsertRepresentativeClient>): Promise<RepresentativeClient | undefined> {
      const [updated] = await db.update(representativeClients).set(clientData).where(eq(representativeClients.id, id)).returning();
      return updated;
    }

    async deleteRepresentativeClient(id: string): Promise<boolean> {
      const result = await db.delete(representativeClients).where(eq(representativeClients.id, id));
      return (result.rowCount ?? 0) > 0;
    }

    // Testimonials CRUD
    async getTestimonials(): Promise<Testimonial[]> {
      return db.select().from(testimonials).orderBy(asc(testimonials.order));
    }

    async getTestimonialById(id: string): Promise<Testimonial | undefined> {
      const [testimonial] = await db.select().from(testimonials).where(eq(testimonials.id, id));
      return testimonial;
    }

    async createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial> {
      const [item] = await db.insert(testimonials).values(testimonial).returning();
      return item;
    }

    async updateTestimonial(id: string, testimonialData: Partial<InsertTestimonial>): Promise<Testimonial | undefined> {
      const [updated] = await db.update(testimonials).set(testimonialData).where(eq(testimonials.id, id)).returning();
      return updated;
    }

    async deleteTestimonial(id: string): Promise<boolean> {
      const result = await db.delete(testimonials).where(eq(testimonials.id, id));
      return (result.rowCount ?? 0) > 0;
    }

    // Job Openings CRUD
    async getJobOpenings(): Promise<JobOpening[]> {
      return db.select().from(jobOpenings).orderBy(desc(jobOpenings.createdAt));
    }

    async getJobOpeningById(id: string): Promise<JobOpening | undefined> {
      const [job] = await db.select().from(jobOpenings).where(eq(jobOpenings.id, id));
      return job;
    }

    async createJobOpening(job: InsertJobOpening): Promise<JobOpening> {
      const [item] = await db.insert(jobOpenings).values(job).returning();
      return item;
    }

    async updateJobOpening(id: string, jobData: Partial<InsertJobOpening>): Promise<JobOpening | undefined> {
      const [updated] = await db.update(jobOpenings).set(jobData).where(eq(jobOpenings.id, id)).returning();
      return updated;
    }

    async deleteJobOpening(id: string): Promise<boolean> {
      const result = await db.delete(jobOpenings).where(eq(jobOpenings.id, id));
      return (result.rowCount ?? 0) > 0;
    }

    // Offices CRUD
    async getOffices(): Promise<Office[]> {
      return db.select().from(offices).orderBy(asc(offices.order));
    }

    async getOfficeById(id: string): Promise<Office | undefined> {
      const [office] = await db.select().from(offices).where(eq(offices.id, id));
      return office;
    }

    async createOffice(office: InsertOffice): Promise<Office> {
      const [item] = await db.insert(offices).values(office).returning();
      return item;
    }

    async updateOffice(id: string, officeData: Partial<InsertOffice>): Promise<Office | undefined> {
      const [updated] = await db.update(offices).set(officeData).where(eq(offices.id, id)).returning();
      return updated;
    }

    async deleteOffice(id: string): Promise<boolean> {
      const result = await db.delete(offices).where(eq(offices.id, id));
      return (result.rowCount ?? 0) > 0;
    }

    // Alliances CRUD
    async getAlliances(): Promise<Alliance[]> {
      return db.select().from(alliances).orderBy(asc(alliances.order));
    }

    async getAllianceById(id: string): Promise<Alliance | undefined> {
      const [alliance] = await db.select().from(alliances).where(eq(alliances.id, id));
      return alliance;
    }

    async createAlliance(alliance: InsertAlliance): Promise<Alliance> {
      const [item] = await db.insert(alliances).values(alliance).returning();
      return item;
    }

    async updateAlliance(id: string, allianceData: Partial<InsertAlliance>): Promise<Alliance | undefined> {
      const [updated] = await db.update(alliances).set(allianceData).where(eq(alliances.id, id)).returning();
      return updated;
    }

    async deleteAlliance(id: string): Promise<boolean> {
      const result = await db.delete(alliances).where(eq(alliances.id, id));
      return (result.rowCount ?? 0) > 0;
    }
  }

  return new CatalogRepository();
}
