import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================
// RANKINGS & AWARDS MODULE
// ============================================

export const rankings = pgTable("rankings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameEs: text("name_es").notNull(),
  publication: text("publication").notNull(),
  publicationEs: text("publication_es"),
  year: integer("year").notNull(),
  category: text("category"),
  categoryEs: text("category_es"),
  ranking: text("ranking"),
  rankingEs: text("ranking_es"),
  description: text("description"),
  descriptionEs: text("description_es"),
  logoUrl: text("logo_url"),
  externalUrl: text("external_url"),
  isHighlight: boolean("is_highlight").default(false),
  published: boolean("published").default(true),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRankingSchema = createInsertSchema(rankings).omit({ id: true, createdAt: true });
export type InsertRanking = z.infer<typeof insertRankingSchema>;
export type FirmRanking = typeof rankings.$inferSelect;

export const awards = pgTable("awards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameEs: text("name_es").notNull(),
  organization: text("organization").notNull(),
  organizationEs: text("organization_es"),
  year: integer("year").notNull(),
  category: text("category"),
  categoryEs: text("category_es"),
  description: text("description"),
  descriptionEs: text("description_es"),
  logoUrl: text("logo_url"),
  certificateUrl: text("certificate_url"),
  isHighlight: boolean("is_highlight").default(false),
  published: boolean("published").default(true),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAwardSchema = createInsertSchema(awards).omit({ id: true, createdAt: true });
export type InsertAward = z.infer<typeof insertAwardSchema>;
export type Award = typeof awards.$inferSelect;

// Link rankings/awards to team members
export const teamMemberRankings = pgTable("team_member_rankings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamMemberId: varchar("team_member_id").notNull(),
  rankingId: varchar("ranking_id").notNull(),
});

export const teamMemberAwards = pgTable("team_member_awards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamMemberId: varchar("team_member_id").notNull(),
  awardId: varchar("award_id").notNull(),
});

// ============================================
// REPRESENTATIVE CLIENTS MODULE
// ============================================

export const representativeClients = pgTable("representative_clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  industry: text("industry"),
  industryEs: text("industry_es"),
  description: text("description"),
  descriptionEs: text("description_es"),
  logoUrl: text("logo_url"),
  websiteUrl: text("website_url"),
  isFeatured: boolean("is_featured").default(false),
  published: boolean("published").default(true),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRepresentativeClientSchema = createInsertSchema(representativeClients).omit({ id: true, createdAt: true });
export type InsertRepresentativeClient = z.infer<typeof insertRepresentativeClientSchema>;
export type RepresentativeClient = typeof representativeClients.$inferSelect;

// Link clients to practice areas
export const clientPracticeGroups = pgTable("client_practice_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  practiceGroupId: varchar("practice_group_id").notNull(),
});

// ============================================
// TESTIMONIALS MODULE
// ============================================

export const testimonials = pgTable("testimonials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quote: text("quote").notNull(),
  quoteEs: text("quote_es").notNull(),
  authorName: text("author_name").notNull(),
  authorTitle: text("author_title"),
  authorTitleEs: text("author_title_es"),
  authorCompany: text("author_company"),
  authorPhotoUrl: text("author_photo_url"),
  source: text("source"),
  sourceEs: text("source_es"),
  year: integer("year"),
  practiceGroupId: varchar("practice_group_id"),
  isFeatured: boolean("is_featured").default(false),
  published: boolean("published").default(true),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTestimonialSchema = createInsertSchema(testimonials).omit({ id: true, createdAt: true });
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
export type Testimonial = typeof testimonials.$inferSelect;
