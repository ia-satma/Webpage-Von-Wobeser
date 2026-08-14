import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================
// JOB OPENINGS & INTERNSHIPS MODULE
// ============================================

export const jobOpenings = pgTable("job_openings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  titleEs: text("title_es").notNull(),
  department: text("department"),
  departmentEs: text("department_es"),
  location: text("location"),
  locationEs: text("location_es"),
  type: text("type").notNull().default("full_time"), // full_time, part_time, internship, contract
  level: text("level"), // entry, mid, senior, partner
  description: text("description").notNull(),
  descriptionEs: text("description_es").notNull(),
  requirements: text("requirements"),
  requirementsEs: text("requirements_es"),
  benefits: text("benefits"),
  benefitsEs: text("benefits_es"),
  salaryRange: text("salary_range"),
  applicationEmail: text("application_email"),
  applicationUrl: text("application_url"),
  practiceGroupId: varchar("practice_group_id"),
  isUrgent: boolean("is_urgent").default(false),
  published: boolean("published").default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertJobOpeningSchema = createInsertSchema(jobOpenings).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertJobOpening = z.infer<typeof insertJobOpeningSchema>;
export type JobOpening = typeof jobOpenings.$inferSelect;

export const jobTypes = [
  { value: "full_time", en: "Full Time", es: "Tiempo Completo" },
  { value: "part_time", en: "Part Time", es: "Medio Tiempo" },
  { value: "internship", en: "Internship", es: "Pasantía" },
  { value: "contract", en: "Contract", es: "Contrato" },
] as const;

export const jobLevels = [
  { value: "entry", en: "Entry Level", es: "Nivel de Entrada" },
  { value: "mid", en: "Mid Level", es: "Nivel Medio" },
  { value: "senior", en: "Senior Level", es: "Nivel Senior" },
  { value: "associate", en: "Associate", es: "Asociado" },
  { value: "counsel", en: "Counsel", es: "Counsel" },
  { value: "partner", en: "Partner", es: "Socio" },
] as const;

// ============================================
// OFFICES & LOCATIONS MODULE
// ============================================

export const offices = pgTable("offices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameEs: text("name_es").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  countryEs: text("country_es"),
  address: text("address").notNull(),
  addressEs: text("address_es"),
  phone: text("phone"),
  fax: text("fax"),
  email: text("email"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  timezone: text("timezone"),
  description: text("description"),
  descriptionEs: text("description_es"),
  imageUrl: text("image_url"),
  isHeadquarters: boolean("is_headquarters").default(false),
  published: boolean("published").default(true),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOfficeSchema = createInsertSchema(offices).omit({ id: true, createdAt: true });
export type InsertOffice = z.infer<typeof insertOfficeSchema>;
export type Office = typeof offices.$inferSelect;

// ============================================
// STRATEGIC ALLIANCES MODULE
// ============================================

export const alliances = pgTable("alliances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameEs: text("name_es"),
  type: text("type").notNull().default("network"), // network, association, partnership, correspondent
  description: text("description"),
  descriptionEs: text("description_es"),
  logoUrl: text("logo_url"),
  websiteUrl: text("website_url"),
  country: text("country"),
  countryEs: text("country_es"),
  memberSince: integer("member_since"),
  isFeatured: boolean("is_featured").default(false),
  published: boolean("published").default(true),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAllianceSchema = createInsertSchema(alliances).omit({ id: true, createdAt: true });
export type InsertAlliance = z.infer<typeof insertAllianceSchema>;
export type Alliance = typeof alliances.$inferSelect;

export const allianceTypes = [
  { value: "network", en: "International Network", es: "Red Internacional" },
  { value: "association", en: "Association", es: "Asociación" },
  { value: "partnership", en: "Strategic Partnership", es: "Alianza Estratégica" },
  { value: "correspondent", en: "Correspondent Firm", es: "Firma Corresponsal" },
] as const;

// ============================================
// SPECIALIZED DESKS MODULE
// ============================================

export const specializedDesks = pgTable("specialized_desks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameEs: text("name_es").notNull(),
  slug: text("slug").notNull().unique(),
  country: text("country"),
  countryEs: text("country_es"),
  flagEmoji: text("flag_emoji"),
  description: text("description").notNull(),
  descriptionEs: text("description_es").notNull(),
  fullDescription: text("full_description"),
  fullDescriptionEs: text("full_description_es"),
  imageUrl: text("image_url"),
  contactEmail: text("contact_email"),
  published: boolean("published").default(true),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSpecializedDeskSchema = createInsertSchema(specializedDesks).omit({ id: true, createdAt: true });
export type InsertSpecializedDesk = z.infer<typeof insertSpecializedDeskSchema>;
export type SpecializedDesk = typeof specializedDesks.$inferSelect;

// Link team members to specialized desks
export const teamMemberDesks = pgTable("team_member_desks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamMemberId: varchar("team_member_id").notNull(),
  deskId: varchar("desk_id").notNull(),
  role: text("role"), // lead, member
});

// ============================================
// PRO BONO & CSR MODULE
// ============================================

export const proBonoProjects = pgTable("pro_bono_projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  titleEs: text("title_es").notNull(),
  organization: text("organization"),
  organizationEs: text("organization_es"),
  description: text("description").notNull(),
  descriptionEs: text("description_es").notNull(),
  impact: text("impact"),
  impactEs: text("impact_es"),
  year: integer("year"),
  imageUrl: text("image_url"),
  category: text("category"),
  categoryEs: text("category_es"),
  isFeatured: boolean("is_featured").default(false),
  published: boolean("published").default(true),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProBonoProjectSchema = createInsertSchema(proBonoProjects).omit({ id: true, createdAt: true });
export type InsertProBonoProject = z.infer<typeof insertProBonoProjectSchema>;
export type ProBonoProject = typeof proBonoProjects.$inferSelect;

// ============================================
// DIVERSITY & INCLUSION MODULE
// ============================================

export const diversityInitiatives = pgTable("diversity_initiatives", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  titleEs: text("title_es").notNull(),
  description: text("description").notNull(),
  descriptionEs: text("description_es").notNull(),
  category: text("category"), // gender, disability, lgbtq, age, culture
  categoryEs: text("category_es"),
  impact: text("impact"),
  impactEs: text("impact_es"),
  year: integer("year"),
  imageUrl: text("image_url"),
  isFeatured: boolean("is_featured").default(false),
  published: boolean("published").default(true),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDiversityInitiativeSchema = createInsertSchema(diversityInitiatives).omit({ id: true, createdAt: true });
export type InsertDiversityInitiative = z.infer<typeof insertDiversityInitiativeSchema>;
export type DiversityInitiative = typeof diversityInitiatives.$inferSelect;

// ============================================
// FAQ MODULE
// ============================================

export const faqs = pgTable("faqs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  question: text("question").notNull(),
  questionEs: text("question_es").notNull(),
  answer: text("answer").notNull(),
  answerEs: text("answer_es").notNull(),
  category: text("category"),
  categoryEs: text("category_es"),
  published: boolean("published").default(true),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFaqSchema = createInsertSchema(faqs).omit({ id: true, createdAt: true });
export type InsertFaq = z.infer<typeof insertFaqSchema>;
export type Faq = typeof faqs.$inferSelect;
