import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import type { Affiliation, BarAdmission, Education, Experience, Publication, Ranking, RepresentativeMatter } from "./foundation";

export const practiceGroups = pgTable("practice_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameEs: text("name_es").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  descriptionEs: text("description_es").notNull(),
  fullDescription: text("full_description"),
  fullDescriptionEs: text("full_description_es"),
  iconName: text("icon_name"),
  imageUrl: text("image_url"),
  order: integer("order").default(0),
  published: boolean("published").default(true),
});

export const insertPracticeGroupSchema = createInsertSchema(practiceGroups).omit({ id: true });
export type InsertPracticeGroup = z.infer<typeof insertPracticeGroupSchema>;
export type PracticeGroup = typeof practiceGroups.$inferSelect;

export const industryGroups = pgTable("industry_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameEs: text("name_es").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  descriptionEs: text("description_es").notNull(),
  fullDescription: text("full_description"),
  fullDescriptionEs: text("full_description_es"),
  iconName: text("icon_name"),
  imageUrl: text("image_url"),
  order: integer("order").default(0),
  published: boolean("published").default(true),
});

export const insertIndustryGroupSchema = createInsertSchema(industryGroups).omit({ id: true });
export type InsertIndustryGroup = z.infer<typeof insertIndustryGroupSchema>;
export type IndustryGroup = typeof industryGroups.$inferSelect;

export const teamMembers = pgTable("team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  titleEs: text("title_es").notNull(),
  role: text("role").notNull(),
  roleEs: text("role_es").notNull(),
  bio: text("bio"),
  bioEs: text("bio_es"),
  // La ficha editorial separa el destacado del cuerpo. Los campos `bio` y
  // `bioEs` siguen siendo el cuerpo para compatibilidad con perfiles heredados.
  bioIntro: text("bio_intro"),
  bioIntroEs: text("bio_intro_es"),
  email: text("email"),
  phone: text("phone"),
  imageUrl: text("image_url"),
  linkedinUrl: text("linkedin_url"),
  isPartner: boolean("is_partner").default(false),
  order: integer("order").default(0),
  published: boolean("published").default(true),
  // Extended profile fields
  education: jsonb("education").$type<Education[]>(),
  barAdmissions: jsonb("bar_admissions").$type<BarAdmission[]>(),
  languages: jsonb("languages").$type<string[]>(),
  languagesEs: jsonb("languages_es").$type<string[]>(),
  affiliations: jsonb("affiliations").$type<Affiliation[]>(),
  rankings: jsonb("rankings").$type<Ranking[]>(),
  publications: jsonb("publications").$type<Publication[]>(),
  representativeMatters: jsonb("representative_matters").$type<RepresentativeMatter[]>(),
  experience: jsonb("experience").$type<Experience[]>(),
}, (t) => ({
  // WHERE published + ORDER BY order (listados de abogados, búsqueda).
  publishedOrderIdx: index("team_members_published_order_idx").on(t.published, t.order),
}));

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({ id: true });
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;

export const teamMemberPracticeGroups = pgTable("team_member_practice_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamMemberId: varchar("team_member_id").notNull(),
  practiceGroupId: varchar("practice_group_id").notNull(),
});

export const teamMemberIndustryGroups = pgTable("team_member_industry_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamMemberId: varchar("team_member_id").notNull(),
  industryGroupId: varchar("industry_group_id").notNull(),
});

export const newsTeamMembers = pgTable("news_team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  newsId: varchar("news_id").notNull(),
  teamMemberId: varchar("team_member_id").notNull(),
}, (t) => ({
  newsMemberUnique: uniqueIndex("news_team_members_news_member_unique").on(t.newsId, t.teamMemberId),
  teamNewsIdx: index("news_team_members_team_news_idx").on(t.teamMemberId, t.newsId),
}));

export const insertNewsTeamMemberSchema = createInsertSchema(newsTeamMembers).omit({ id: true });
export type InsertNewsTeamMember = z.infer<typeof insertNewsTeamMemberSchema>;
export type NewsTeamMember = typeof newsTeamMembers.$inferSelect;

// Representative Matters table for Experience page
export const representativeMatters = pgTable("representative_matters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  titleEs: text("title_es").notNull(),
  description: text("description").notNull(),
  descriptionEs: text("description_es").notNull(),
  client: text("client"),
  clientEs: text("client_es"),
  year: integer("year").notNull(),
  practiceAreaSlug: text("practice_area_slug").notNull(),
  industrySlug: text("industry_slug"),
  isHighlight: boolean("is_highlight").default(false),
  order: integer("order").default(0),
});

export const insertRepresentativeMatterSchema = createInsertSchema(representativeMatters).omit({ id: true });
export type InsertRepresentativeMatter = z.infer<typeof insertRepresentativeMatterSchema>;
export type RepresentativeMatterDb = typeof representativeMatters.$inferSelect;
