import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Types for team member structured data
export interface Education {
  school: string;
  schoolEs?: string;
  degree: string;
  degreeEs?: string;
  year?: string;
}

export interface BarAdmission {
  jurisdiction: string;
  jurisdictionEs?: string;
  year?: string;
}

export interface Ranking {
  publication: string;
  ranking: string;
  rankingEs?: string;
  year?: string;
  area?: string;
  areaEs?: string;
}

export interface Publication {
  title: string;
  titleEs?: string;
  journal?: string;
  year?: string;
  url?: string;
}

export interface RepresentativeMatter {
  description: string;
  descriptionEs?: string;
  client?: string;
  year?: string;
}

export interface Affiliation {
  organization: string;
  organizationEs?: string;
  role?: string;
  roleEs?: string;
}

export interface Experience {
  company: string;
  position: string;
  positionEs?: string;
  startYear?: string;
  endYear?: string;
}

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const news = pgTable("news", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  titleEs: text("title_es").notNull(),
  excerpt: text("excerpt").notNull(),
  excerptEs: text("excerpt_es").notNull(),
  content: text("content"),
  contentEs: text("content_es"),
  slug: text("slug").notNull().unique(),
  imageUrl: text("image_url"),
  date: timestamp("date").defaultNow(),
  published: boolean("published").default(true),
  category: text("category").default("press"),
  categoryEs: text("category_es").default("Prensa"),
  authorId: varchar("author_id"),
});

export const newsCategories = [
  { value: "press", en: "Press", es: "Prensa" },
  { value: "insights", en: "Insights", es: "Insights" },
  { value: "rankings", en: "Rankings", es: "Rankings" },
  { value: "events", en: "Events", es: "Eventos" },
  { value: "alerts", en: "Alerts", es: "Alertas" },
] as const;

export const insertNewsSchema = createInsertSchema(news).omit({ id: true, date: true });
export type InsertNews = z.infer<typeof insertNewsSchema>;
export type News = typeof news.$inferSelect;

export const officeImages = pgTable("office_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  imageUrl: text("image_url").notNull(),
  alt: text("alt").notNull(),
  altEs: text("alt_es").notNull(),
  order: integer("order").default(0),
});

export const insertOfficeImageSchema = createInsertSchema(officeImages).omit({ id: true });
export type InsertOfficeImage = z.infer<typeof insertOfficeImageSchema>;
export type OfficeImage = typeof officeImages.$inferSelect;

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
  email: text("email"),
  phone: text("phone"),
  imageUrl: text("image_url"),
  linkedinUrl: text("linkedin_url"),
  isPartner: boolean("is_partner").default(false),
  order: integer("order").default(0),
  // Extended profile fields
  education: jsonb("education").$type<Education[]>(),
  barAdmissions: jsonb("bar_admissions").$type<BarAdmission[]>(),
  languages: jsonb("languages").$type<string[]>(),
  affiliations: jsonb("affiliations").$type<Affiliation[]>(),
  rankings: jsonb("rankings").$type<Ranking[]>(),
  publications: jsonb("publications").$type<Publication[]>(),
  representativeMatters: jsonb("representative_matters").$type<RepresentativeMatter[]>(),
  experience: jsonb("experience").$type<Experience[]>(),
});

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
});

export const insertNewsTeamMemberSchema = createInsertSchema(newsTeamMembers).omit({ id: true });
export type InsertNewsTeamMember = z.infer<typeof insertNewsTeamMemberSchema>;
export type NewsTeamMember = typeof newsTeamMembers.$inferSelect;

export interface SiteContent {
  heroTitle: string;
  heroSubtitle: string;
  visionTitle: string;
  visionText: string;
  locationTitle: string;
  locationText: string;
  statsTitle: string;
  quoteText: string;
  quoteAuthor: string;
  quoteRole: string;
  address: string;
  phone: string;
  email: string;
}

export interface Stat {
  value: string;
  label: string;
  labelEs: string;
}

export interface MenuItem {
  label: string;
  labelEs: string;
  href: string;
}

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

// Contact form schema
export const contactFormSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  phone: z.string().optional(),
  company: z.string().optional(),
  practiceArea: z.string().optional(),
  message: z.string().min(1, "Message is required"),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

// Practice areas list for contact form
export const practiceAreas = [
  { value: "corporate-ma", en: "Corporate, Mergers & Acquisitions", es: "Corporativo, Fusiones y Adquisiciones" },
  { value: "antitrust-competition", en: "Antitrust & Competition", es: "Competencia Económica" },
  { value: "arbitration", en: "Arbitration", es: "Arbitraje" },
  { value: "litigation", en: "Litigation", es: "Litigio" },
  { value: "investigations-anticorruption", en: "Investigations, Anti-corruption & Compliance", es: "Investigaciones, Anticorrupción y Compliance" },
  { value: "bankruptcy-restructuring", en: "Bankruptcy & Restructuring", es: "Concursos Mercantiles y Reestructuración" },
  { value: "banking-finance", en: "Banking & Finance", es: "Bancario y Financiero" },
  { value: "energy-natural-resources", en: "Energy & Natural Resources", es: "Energía y Recursos Naturales" },
  { value: "esg", en: "ESG (Environmental, Social & Corporate Governance)", es: "ESG (Ambiental, Social y Gobierno Corporativo)" },
  { value: "real-estate", en: "Real Estate", es: "Inmobiliario" },
  { value: "intellectual-property", en: "Intellectual Property", es: "Propiedad Intelectual" },
  { value: "labor-employment", en: "Labor & Employment", es: "Laboral" },
  { value: "tax", en: "Tax", es: "Fiscal" },
  { value: "international-trade", en: "International Trade", es: "Comercio Exterior" },
  { value: "telecommunications-media-technology", en: "Telecommunications, Media & Technology", es: "Telecomunicaciones, Medios y Tecnología" },
  { value: "environmental", en: "Environmental", es: "Ambiental" },
  { value: "administrative-law", en: "Administrative Law", es: "Derecho Administrativo" },
  { value: "german-desk", en: "German Desk", es: "Desk Alemán" },
] as const;

// ============================================
// BLOG ADMIN MODULE
// ============================================

// Admin Users with roles
export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("editor"), // super_admin, editor, author
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login"),
  isActive: boolean("is_active").default(true),
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({ id: true, createdAt: true, lastLogin: true });
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;

// Blog Categories
export const blogCategories = pgTable("blog_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameEs: text("name_es").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  descriptionEs: text("description_es"),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBlogCategorySchema = createInsertSchema(blogCategories).omit({ id: true, createdAt: true });
export type InsertBlogCategory = z.infer<typeof insertBlogCategorySchema>;
export type BlogCategory = typeof blogCategories.$inferSelect;

// Blog Tags
export const blogTags = pgTable("blog_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameEs: text("name_es"),
  slug: text("slug").notNull().unique(),
});

export const insertBlogTagSchema = createInsertSchema(blogTags).omit({ id: true });
export type InsertBlogTag = z.infer<typeof insertBlogTagSchema>;
export type BlogTag = typeof blogTags.$inferSelect;

// Blog Posts
export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  titleEs: text("title_es").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content"),
  contentEs: text("content_es"),
  excerpt: text("excerpt"),
  excerptEs: text("excerpt_es"),
  featuredImage: text("featured_image"),
  categoryId: varchar("category_id"),
  authorId: varchar("author_id"),
  status: text("status").notNull().default("draft"), // draft, published, trash
  publishedAt: timestamp("published_at"),
  metaTitle: text("meta_title"),
  metaTitleEs: text("meta_title_es"),
  metaDescription: text("meta_description"),
  metaDescriptionEs: text("meta_description_es"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;

// Blog Post Tags (pivot table)
export const blogPostTags = pgTable("blog_post_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull(),
  tagId: varchar("tag_id").notNull(),
});

// Media Library
export const mediaItems = pgTable("media_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  path: text("path").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size"),
  width: integer("width"),
  height: integer("height"),
  alt: text("alt"),
  altEs: text("alt_es"),
  uploadedBy: varchar("uploaded_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMediaItemSchema = createInsertSchema(mediaItems).omit({ id: true, createdAt: true });
export type InsertMediaItem = z.infer<typeof insertMediaItemSchema>;
export type MediaItem = typeof mediaItems.$inferSelect;

// Admin sessions for token-based auth
export const adminSessions = pgTable("admin_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

export const insertAdminSessionSchema = createInsertSchema(adminSessions).omit({ id: true, createdAt: true });
export type InsertAdminSession = z.infer<typeof insertAdminSessionSchema>;
export type AdminSession = typeof adminSessions.$inferSelect;

// Admin login schema for validation
export const adminLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type AdminLoginData = z.infer<typeof adminLoginSchema>;

// Blog post creation schema with validation
export const blogPostFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  titleEs: z.string().min(1, "Spanish title is required").max(200),
  slug: z.string().min(1, "Slug is required").max(250),
  content: z.string().optional(),
  contentEs: z.string().optional(),
  excerpt: z.string().max(500).optional(),
  excerptEs: z.string().max(500).optional(),
  featuredImage: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.enum(["draft", "published", "trash"]).default("draft"),
  publishedAt: z.date().optional().nullable(),
  metaTitle: z.string().max(70).optional(),
  metaTitleEs: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
  metaDescriptionEs: z.string().max(160).optional(),
  tagIds: z.array(z.string()).optional(),
});

export type BlogPostFormData = z.infer<typeof blogPostFormSchema>;

// ============================================
// EVENTS MODULE
// ============================================

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  titleEs: text("title_es").notNull(),
  description: text("description").notNull(),
  descriptionEs: text("description_es").notNull(),
  date: timestamp("date").notNull(),
  endDate: timestamp("end_date"),
  location: text("location"),
  locationEs: text("location_es"),
  imageUrl: text("image_url"),
  eventType: text("event_type").default("conference"),
  eventTypeEs: text("event_type_es"),
  externalUrl: text("external_url"),
  isHighlight: boolean("is_highlight").default(false),
  published: boolean("published").default(true),
  order: integer("order").default(0),
});

export const insertEventSchema = createInsertSchema(events).omit({ id: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

export const eventTypes = [
  { value: "conference", en: "Conference", es: "Conferencia" },
  { value: "webinar", en: "Webinar", es: "Webinar" },
  { value: "sponsorship", en: "Sponsorship", es: "Patrocinio" },
  { value: "speaking", en: "Speaking Engagement", es: "Ponencia" },
  { value: "networking", en: "Networking Event", es: "Evento de Networking" },
] as const;
