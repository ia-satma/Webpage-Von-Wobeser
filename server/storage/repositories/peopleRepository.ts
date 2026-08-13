import { eq, desc, asc, and, inArray, ilike } from "drizzle-orm";
import { normalizeSpanishPartnerFields } from "@shared/attorneyTitles";
import { type PracticeGroup, type InsertPracticeGroup, type IndustryGroup, type InsertIndustryGroup, type TeamMember, type InsertTeamMember, type RepresentativeMatterDb, type InsertRepresentativeMatter, type SpecializedDesk, type InsertSpecializedDesk, practiceGroups, industryGroups, teamMembers, teamMemberPracticeGroups, teamMemberIndustryGroups, teamMemberDesks, representativeMatters, specializedDesks } from "@shared/schema";
import type { StorageDatabase } from "../types";

export function createPeopleRepository(db: StorageDatabase) {
  class PeopleRepository {
    async getPracticeGroups(): Promise<PracticeGroup[]> {
      return db.select().from(practiceGroups).orderBy(asc(practiceGroups.order));
    }

    async getPracticeGroupById(id: string): Promise<PracticeGroup | undefined> {
      const [group] = await db.select().from(practiceGroups).where(eq(practiceGroups.id, id));
      return group;
    }

    async getPracticeGroupBySlug(slug: string): Promise<PracticeGroup | undefined> {
      const [group] = await db.select().from(practiceGroups).where(eq(practiceGroups.slug, slug));
      return group;
    }

    async createPracticeGroup(group: InsertPracticeGroup): Promise<PracticeGroup> {
      const [item] = await db.insert(practiceGroups).values(group).returning();
      return item;
    }

    async getIndustryGroups(): Promise<IndustryGroup[]> {
      return db.select().from(industryGroups).orderBy(asc(industryGroups.order));
    }

    async getIndustryGroupById(id: string): Promise<IndustryGroup | undefined> {
      const [group] = await db.select().from(industryGroups).where(eq(industryGroups.id, id));
      return group;
    }

    async getIndustryGroupBySlug(slug: string): Promise<IndustryGroup | undefined> {
      const [group] = await db.select().from(industryGroups).where(eq(industryGroups.slug, slug));
      return group;
    }

    async createIndustryGroup(group: InsertIndustryGroup): Promise<IndustryGroup> {
      const [item] = await db.insert(industryGroups).values(group).returning();
      return item;
    }

    async getTeamMembers(): Promise<TeamMember[]> {
      return db.select().from(teamMembers).orderBy(asc(teamMembers.order));
    }

    async getTeamMemberById(id: string): Promise<TeamMember | undefined> {
      const [member] = await db.select().from(teamMembers).where(eq(teamMembers.id, id));
      return member;
    }

    async getTeamMemberBySlug(slug: string): Promise<TeamMember | undefined> {
      const [member] = await db.select().from(teamMembers).where(eq(teamMembers.slug, slug));
      return member;
    }

    async getPartners(): Promise<TeamMember[]> {
      return db.select().from(teamMembers).where(eq(teamMembers.isPartner, true)).orderBy(asc(teamMembers.order));
    }

    async createTeamMember(member: InsertTeamMember): Promise<TeamMember> {
      const normalizedMember = normalizeSpanishPartnerFields(member);
      const [item] = await db.insert(teamMembers).values(normalizedMember as typeof teamMembers.$inferInsert).returning();
      return item;
    }

    async updateTeamMember(id: string, member: Partial<InsertTeamMember>): Promise<TeamMember | undefined> {
      const current = await this.getTeamMemberById(id);
      const normalized = normalizeSpanishPartnerFields({ ...(current ?? {}), ...member });
      const normalizedMember: Partial<InsertTeamMember> = {
        ...member,
        ...(normalized.titleEs !== undefined ? { titleEs: normalized.titleEs } : {}),
        ...(normalized.roleEs !== undefined ? { roleEs: normalized.roleEs } : {}),
      };
      const [item] = await db
        .update(teamMembers)
        .set(normalizedMember as Partial<typeof teamMembers.$inferInsert>)
        .where(eq(teamMembers.id, id))
        .returning();
      return item;
    }

    async deleteTeamMember(id: string): Promise<boolean> {
      const result = await db
        .delete(teamMembers)
        .where(eq(teamMembers.id, id))
        .returning();
      return result.length > 0;
    }

    async getTeamMemberPracticeGroupIds(teamMemberId: string): Promise<string[]> {
      const rows = await db
        .select({ id: teamMemberPracticeGroups.practiceGroupId })
        .from(teamMemberPracticeGroups)
        .where(eq(teamMemberPracticeGroups.teamMemberId, teamMemberId));
      return rows.map((r) => r.id);
    }

    async getTeamMemberIndustryGroupIds(teamMemberId: string): Promise<string[]> {
      const rows = await db
        .select({ id: teamMemberIndustryGroups.industryGroupId })
        .from(teamMemberIndustryGroups)
        .where(eq(teamMemberIndustryGroups.teamMemberId, teamMemberId));
      return rows.map((r) => r.id);
    }

    async setTeamMemberPracticeGroups(teamMemberId: string, practiceGroupIds: string[]): Promise<void> {
      await db.delete(teamMemberPracticeGroups).where(eq(teamMemberPracticeGroups.teamMemberId, teamMemberId));
      if (practiceGroupIds.length === 0) return;
      await db.insert(teamMemberPracticeGroups).values(
        practiceGroupIds.map((practiceGroupId) => ({ teamMemberId, practiceGroupId }))
      );
    }

    async setTeamMemberIndustryGroups(teamMemberId: string, industryGroupIds: string[]): Promise<void> {
      await db.delete(teamMemberIndustryGroups).where(eq(teamMemberIndustryGroups.teamMemberId, teamMemberId));
      if (industryGroupIds.length === 0) return;
      await db.insert(teamMemberIndustryGroups).values(
        industryGroupIds.map((industryGroupId) => ({ teamMemberId, industryGroupId }))
      );
    }

    async searchTeamMembers(filters: { q?: string; title?: string; practiceGroupId?: string }): Promise<TeamMember[]> {
      // Filtrado en SQL (WHERE/ILIKE + join) en vez de traer TODA la tabla y filtrar en JS.
      const conds = [eq(teamMembers.published, true)];
      if (filters.title) conds.push(eq(teamMembers.title, filters.title));
      const q = filters.q?.trim();
      if (q) {
        const like = `%${q.replace(/[%_\\]/g, "\\$&")}%`; // escapa comodines para búsqueda literal
        conds.push(ilike(teamMembers.name, like));
      }
      if (filters.practiceGroupId) {
        const rows = await db
          .select({ id: teamMemberPracticeGroups.teamMemberId })
          .from(teamMemberPracticeGroups)
          .where(eq(teamMemberPracticeGroups.practiceGroupId, filters.practiceGroupId));
        const ids = rows.map((r) => r.id);
        if (ids.length === 0) return [];
        conds.push(inArray(teamMembers.id, ids));
      }
      return db.select().from(teamMembers).where(and(...conds)).orderBy(asc(teamMembers.order));
    }

    // Practice Group update/delete
    async updatePracticeGroup(id: string, group: Partial<InsertPracticeGroup>): Promise<PracticeGroup | undefined> {
      const [item] = await db
        .update(practiceGroups)
        .set(group)
        .where(eq(practiceGroups.id, id))
        .returning();
      return item;
    }

    async deletePracticeGroup(id: string): Promise<boolean> {
      const result = await db
        .delete(practiceGroups)
        .where(eq(practiceGroups.id, id))
        .returning();
      return result.length > 0;
    }

    // Industry Group update/delete
    async updateIndustryGroup(id: string, group: Partial<InsertIndustryGroup>): Promise<IndustryGroup | undefined> {
      const [item] = await db
        .update(industryGroups)
        .set(group)
        .where(eq(industryGroups.id, id))
        .returning();
      return item;
    }

    async deleteIndustryGroup(id: string): Promise<boolean> {
      const result = await db
        .delete(industryGroups)
        .where(eq(industryGroups.id, id))
        .returning();
      return result.length > 0;
    }

    async getRepresentativeMatters(): Promise<RepresentativeMatterDb[]> {
      return db.select().from(representativeMatters).orderBy(desc(representativeMatters.year), asc(representativeMatters.order));
    }

    async createRepresentativeMatter(matter: InsertRepresentativeMatter): Promise<RepresentativeMatterDb> {
      const [item] = await db.insert(representativeMatters).values(matter).returning();
      return item;
    }

    // Specialized Desks CRUD
    async getSpecializedDesks(): Promise<SpecializedDesk[]> {
      return db.select().from(specializedDesks).orderBy(asc(specializedDesks.order));
    }

    async getSpecializedDeskById(id: string): Promise<SpecializedDesk | undefined> {
      const [desk] = await db.select().from(specializedDesks).where(eq(specializedDesks.id, id));
      return desk;
    }

    async createSpecializedDesk(desk: InsertSpecializedDesk): Promise<SpecializedDesk> {
      const [item] = await db.insert(specializedDesks).values(desk).returning();
      return item;
    }

    async updateSpecializedDesk(id: string, deskData: Partial<InsertSpecializedDesk>): Promise<SpecializedDesk | undefined> {
      const [updated] = await db.update(specializedDesks).set(deskData).where(eq(specializedDesks.id, id)).returning();
      return updated;
    }

    async deleteSpecializedDesk(id: string): Promise<boolean> {
      const result = await db.delete(specializedDesks).where(eq(specializedDesks.id, id));
      return (result.rowCount ?? 0) > 0;
    }

    async getDeskTeamMemberIds(deskId: string): Promise<string[]> {
      const rows = await db
        .select({ id: teamMemberDesks.teamMemberId })
        .from(teamMemberDesks)
        .where(eq(teamMemberDesks.deskId, deskId));
      return rows.map((r) => r.id);
    }

    async getTeamMembersByDesk(deskId: string): Promise<TeamMember[]> {
      const ids = await this.getDeskTeamMemberIds(deskId);
      if (ids.length === 0) return [];
      return db.select().from(teamMembers).where(inArray(teamMembers.id, ids)).orderBy(asc(teamMembers.order));
    }

    async setDeskTeamMembers(deskId: string, teamMemberIds: string[]): Promise<void> {
      await db.delete(teamMemberDesks).where(eq(teamMemberDesks.deskId, deskId));
      if (teamMemberIds.length === 0) return;
      await db.insert(teamMemberDesks).values(
        teamMemberIds.map((teamMemberId) => ({ teamMemberId, deskId }))
      );
    }
  }

  return new PeopleRepository();
}
