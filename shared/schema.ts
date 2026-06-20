import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Canonical team member categories - source of truth for role taxonomy
// DO NOT duplicate or modify these categories elsewhere
export const TEAM_MEMBER_CATEGORIES = [
  { value: "partner", en: "Partner", es: "Socio" },
  { value: "of-counsel", en: "Of Counsel", es: "Of Counsel" },
  { value: "associate", en: "Associate", es: "Asociado" },
] as const;

export type TeamMemberCategory = typeof TEAM_MEMBER_CATEGORIES[number]["value"];

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
  pdfUrl: text("pdf_url"),
  date: timestamp("date").defaultNow(),
  published: boolean("published").default(true),
  category: text("category").default("press"),
  categoryEs: text("category_es").default("Prensa"),
  authorId: varchar("author_id").references(() => adminUsers.id, { onDelete: "set null" }),
  // Processing status tracking
  processingStatus: text("processing_status").default("pending"), // pending, processing, ready, ready_for_approval, failed, partial_success
  lastError: text("last_error"), // Stores the last error message/code for diagnostics
  lastProcessedAt: timestamp("last_processed_at"),
  failedStep: text("failed_step"), // Which step failed: format, categorize, metadata, seo, translate, image, council
  // Content scheduling: articles with a future publishAt are hidden from public routes
  publishAt: timestamp("publish_at"),
  // Legal Council AI evaluation
  councilVerdict: jsonb("council_verdict"), // Stores CouncilVerdict: { overallStatus, riskFlag, consolidatedFeedback }
});

export const newsCategories = [
  { value: "press", en: "Press", es: "Prensa" },
  { value: "insights", en: "Insights", es: "Insights" },
  { value: "rankings", en: "Rankings", es: "Rankings" },
  { value: "events", en: "Events", es: "Eventos" },
  { value: "alerts", en: "Alerts", es: "Alertas" },
] as const;

export const insertNewsSchema = createInsertSchema(news).omit({ id: true, date: true }).extend({
  title: z.string().max(500),
  titleEs: z.string().max(500),
  excerpt: z.string().max(2000),
  excerptEs: z.string().max(2000),
  content: z.string().max(50000).optional().nullable(),
  contentEs: z.string().max(50000).optional().nullable(),
});
export type InsertNews = z.infer<typeof insertNewsSchema>;
export type News = typeof news.$inferSelect;

export const newsTranslations = pgTable("news_translations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  newsId: varchar("news_id").notNull().references(() => news.id, { onDelete: "cascade" }),
  language: varchar("language", { length: 5 }).notNull(), // en, es, de, zh, ko, ja, ar, ru, fr, it
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content"),
  category: text("category"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  seoKeywords: text("seo_keywords").array(),
  translatedAt: timestamp("translated_at").defaultNow(),
  translatedBy: varchar("translated_by").default("ai"), // "ai" or "manual"
}, (table) => ({
  newsLangIdx: index("news_trans_news_lang_idx").on(table.newsId, table.language),
}));

export const insertNewsTranslationSchema = createInsertSchema(newsTranslations).omit({ id: true, translatedAt: true });
export type InsertNewsTranslation = z.infer<typeof insertNewsTranslationSchema>;
export type NewsTranslation = typeof newsTranslations.$inferSelect;

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
  teamMemberId: varchar("team_member_id").notNull().references(() => teamMembers.id, { onDelete: "cascade" }),
  practiceGroupId: varchar("practice_group_id").notNull().references(() => practiceGroups.id, { onDelete: "cascade" }),
}, (table) => ({
  teamMemberIdx: index("tmpg_team_member_idx").on(table.teamMemberId),
  practiceGroupIdx: index("tmpg_practice_group_idx").on(table.practiceGroupId),
}));

export const teamMemberIndustryGroups = pgTable("team_member_industry_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamMemberId: varchar("team_member_id").notNull().references(() => teamMembers.id, { onDelete: "cascade" }),
  industryGroupId: varchar("industry_group_id").notNull().references(() => industryGroups.id, { onDelete: "cascade" }),
}, (table) => ({
  teamMemberIdx: index("tmig_team_member_idx").on(table.teamMemberId),
  industryGroupIdx: index("tmig_industry_group_idx").on(table.industryGroupId),
}));

export const newsTeamMembers = pgTable("news_team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  newsId: varchar("news_id").notNull().references(() => news.id, { onDelete: "cascade" }),
  teamMemberId: varchar("team_member_id").notNull().references(() => teamMembers.id, { onDelete: "cascade" }),
}, (table) => ({
  newsIdx: index("ntm_news_idx").on(table.newsId),
  teamMemberIdx: index("ntm_team_member_idx").on(table.teamMemberId),
}));

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
}, (table) => ({
  practiceAreaIdx: index("rep_matters_practice_area_idx").on(table.practiceAreaSlug),
  industryIdx: index("rep_matters_industry_idx").on(table.industrySlug),
}));

export const insertRepresentativeMatterSchema = createInsertSchema(representativeMatters).omit({ id: true }).extend({
  title: z.string().max(500),
  titleEs: z.string().max(500),
  description: z.string().max(10000),
  descriptionEs: z.string().max(10000),
});
export type InsertRepresentativeMatter = z.infer<typeof insertRepresentativeMatterSchema>;
export type RepresentativeMatterDb = typeof representativeMatters.$inferSelect;

// Contact form schema
export const contactFormSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(200),
  email: z.string().min(1, "Email is required").email("Invalid email address").max(320),
  phone: z.string().max(50).optional(),
  company: z.string().max(300).optional(),
  practiceArea: z.string().max(200).optional(),
  message: z.string().min(1, "Message is required").max(5000),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

export const contactSubmissions = pgTable("contact_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  practiceArea: text("practice_area"),
  message: text("message").notNull(),
  ipAddress: text("ip_address"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  read: boolean("read").default(false),
});

export const insertContactSubmissionSchema = createInsertSchema(contactSubmissions).omit({ id: true, submittedAt: true, read: true }).extend({
  fullName: z.string().max(200),
  email: z.string().max(320),
  phone: z.string().max(50).optional().nullable(),
  company: z.string().max(300).optional().nullable(),
  practiceArea: z.string().max(200).optional().nullable(),
  message: z.string().max(5000),
});
export type InsertContactSubmission = z.infer<typeof insertContactSubmissionSchema>;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;

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
  categoryId: varchar("category_id").references(() => blogCategories.id, { onDelete: "set null" }),
  authorId: varchar("author_id").references(() => adminUsers.id, { onDelete: "set null" }),
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
  postId: varchar("post_id").notNull().references(() => blogPosts.id, { onDelete: "cascade" }),
  tagId: varchar("tag_id").notNull().references(() => blogTags.id, { onDelete: "cascade" }),
}, (table) => ({
  postIdx: index("bpt_post_idx").on(table.postId),
  tagIdx: index("bpt_tag_idx").on(table.tagId),
}));

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
  userId: varchar("user_id").notNull().references(() => adminUsers.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
}, (table) => ({
  userIdx: index("admin_sessions_user_idx").on(table.userId),
}));

export const insertAdminSessionSchema = createInsertSchema(adminSessions).omit({ id: true, createdAt: true });
export type InsertAdminSession = z.infer<typeof insertAdminSessionSchema>;
export type AdminSession = typeof adminSessions.$inferSelect;

// Admin login schema for validation (accepts email or username)
export const adminLoginSchema = z.object({
  username: z.string().min(1, "Email or username is required"),
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
}, (table) => ({
  publishedDateIdx: index("events_published_date_idx").on(table.published, table.date),
}));

export const insertEventSchema = createInsertSchema(events).omit({ id: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

export const eventTypes = [
  { 
    value: "conference", 
    en: "Conference", 
    es: "Conferencia", 
    de: "Konferenz", 
    zh: "会议", 
    ko: "컨퍼런스", 
    ja: "カンファレンス", 
    ar: "مؤتمر", 
    ru: "Конференция", 
    fr: "Conférence", 
    it: "Conferenza" 
  },
  { 
    value: "webinar", 
    en: "Webinar", 
    es: "Webinar", 
    de: "Webinar", 
    zh: "网络研讨会", 
    ko: "웨비나", 
    ja: "ウェビナー", 
    ar: "ندوة عبر الإنترنت", 
    ru: "Вебинар", 
    fr: "Webinaire", 
    it: "Webinar" 
  },
  { 
    value: "sponsorship", 
    en: "Sponsorship", 
    es: "Patrocinio", 
    de: "Sponsoring", 
    zh: "赞助", 
    ko: "스폰서십", 
    ja: "スポンサーシップ", 
    ar: "رعاية", 
    ru: "Спонсорство", 
    fr: "Parrainage", 
    it: "Sponsorizzazione" 
  },
  { 
    value: "speaking", 
    en: "Speaking Engagement", 
    es: "Ponencia", 
    de: "Vortrag", 
    zh: "演讲活动", 
    ko: "강연", 
    ja: "講演", 
    ar: "مشاركة في التحدث", 
    ru: "Выступление", 
    fr: "Conférence", 
    it: "Intervento" 
  },
  { 
    value: "networking", 
    en: "Networking Event", 
    es: "Evento de Networking", 
    de: "Networking-Veranstaltung", 
    zh: "社交活动", 
    ko: "네트워킹 이벤트", 
    ja: "ネットワーキングイベント", 
    ar: "حدث التواصل", 
    ru: "Нетворкинг", 
    fr: "Événement de réseautage", 
    it: "Evento di networking" 
  },
] as const;

// ============================================
// MULTI-LANGUAGE SUPPORT
// ============================================

// Translation cache table for storing AI-generated translations
export const translationCache = pgTable("translation_cache", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentType: text("content_type").notNull(), // 'team_member', 'practice_group', 'industry_group', 'news', 'site_content'
  entityId: varchar("entity_id").notNull(), // ID of the entity being translated
  field: text("field"), // 'title', 'bio', 'description', etc. - optional when using translations JSONB
  sourceLanguage: text("source_language").default("en"), // Source language code
  targetLanguage: text("target_language").notNull(), // Target language code
  sourceText: text("source_text"), // Original text - optional when using translations JSONB
  translatedText: text("translated_text"), // Translated text - optional when using translations JSONB
  translations: jsonb("translations"), // JSONB for storing multiple translations at once { title, excerpt, content }
  isApproved: boolean("is_approved").default(false), // Whether translation has been reviewed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTranslationCacheSchema = createInsertSchema(translationCache).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTranslationCache = z.infer<typeof insertTranslationCacheSchema>;
export type TranslationCache = typeof translationCache.$inferSelect;

export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", nameNative: "English" },
  { code: "es", name: "Spanish", nameNative: "Español" },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]["code"];
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

// ============================================
// CONTENT ANALYSIS RESULTS
// ============================================

export interface SEORecommendation {
  keywords: string[];
  titleSuggestion: string;
  metaDescription: string;
  headingImprovements: string[];
  contentGaps: string[];
  internalLinkOpportunities: string[];
}

export interface SpellingGrammarIssue {
  original: string;
  correction: string;
  type: 'spelling' | 'grammar' | 'terminology' | 'style';
  explanation: string;
}

export interface LawyerMention {
  name: string;
  role: string;
  context: string;
}

export interface ContentAnalysisResult {
  seoRecommendations: SEORecommendation;
  categories: {
    primary: string;
    secondary: string[];
  };
  spellingGrammar: SpellingGrammarIssue[];
  lawyersMentioned: LawyerMention[];
  legalBranches: {
    primary: string[];
    secondary: string[];
  };
  industries: {
    primary: string;
    secondary: string[];
  };
  qualityScore: number;
  analysisTimestamp: string;
}

export const contentAnalysis = pgTable("content_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").notNull().references(() => news.id, { onDelete: "cascade" }),
  analysisResult: jsonb("analysis_result").$type<ContentAnalysisResult>().notNull(),
  qualityScore: integer("quality_score").default(0),
  issuesCount: integer("issues_count").default(0),
  status: text("status").default("completed"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  articleIdx: index("content_analysis_article_idx").on(table.articleId),
}));

export const insertContentAnalysisSchema = createInsertSchema(contentAnalysis).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertContentAnalysis = z.infer<typeof insertContentAnalysisSchema>;
export type ContentAnalysis = typeof contentAnalysis.$inferSelect;

// ============================================
// AI AGENT SYSTEM TABLES
// ============================================

// Agent jobs queue
export const agentJobs = pgTable("agent_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentType: text("agent_type").notNull(),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, failed, cancelled
  priority: text("priority").notNull().default("normal"), // low, normal, high, critical
  payload: jsonb("payload").notNull(),
  result: jsonb("result"),
  error: text("error"),
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  parentJobId: varchar("parent_job_id").references((): any => agentJobs.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  typeStatusIdx: index("agent_jobs_type_status_idx").on(table.agentType, table.status),
  parentJobIdx: index("agent_jobs_parent_job_idx").on(table.parentJobId),
}));

export const insertAgentJobSchema = createInsertSchema(agentJobs).omit({ id: true, createdAt: true });
export type InsertAgentJob = z.infer<typeof insertAgentJobSchema>;
export type AgentJob = typeof agentJobs.$inferSelect;

// Agent events log
export const agentEvents = pgTable("agent_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => agentJobs.id, { onDelete: "cascade" }),
  agentType: text("agent_type").notNull(),
  eventType: text("event_type").notNull(), // start, progress, complete, error, learning, evolution_proposal
  message: text("message").notNull(),
  data: jsonb("data"),
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => ({
  jobIdx: index("agent_events_job_idx").on(table.jobId),
  agentTypeIdx: index("agent_events_agent_type_idx").on(table.agentType),
}));

export const insertAgentEventSchema = createInsertSchema(agentEvents).omit({ id: true, timestamp: true });
export type InsertAgentEvent = z.infer<typeof insertAgentEventSchema>;
export type AgentEvent = typeof agentEvents.$inferSelect;

// Agent knowledge documents
export const agentKnowledge = pgTable("agent_knowledge", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentType: text("agent_type").notNull(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  agentTypeIdx: index("agent_knowledge_agent_type_idx").on(table.agentType),
}));

export const insertAgentKnowledgeSchema = createInsertSchema(agentKnowledge).omit({ id: true, createdAt: true, updatedAt: true, usageCount: true });
export type InsertAgentKnowledge = z.infer<typeof insertAgentKnowledgeSchema>;
export type AgentKnowledge = typeof agentKnowledge.$inferSelect;

// Agent skills tracking
export const agentSkills = pgTable("agent_skills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentType: text("agent_type").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  expertise: integer("expertise").default(50), // 0-100
  usageCount: integer("usage_count").default(0),
  successRate: integer("success_rate").default(100), // 0-100
  learnings: jsonb("learnings"), // Array of skill learnings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  agentTypeIdx: index("agent_skills_agent_type_idx").on(table.agentType),
}));

export const insertAgentSkillSchema = createInsertSchema(agentSkills).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAgentSkill = z.infer<typeof insertAgentSkillSchema>;
export type AgentSkill = typeof agentSkills.$inferSelect;

// Evolution proposals from agents
export const agentEvolutionProposals = pgTable("agent_evolution_proposals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentType: text("agent_type").notNull(),
  proposalType: text("proposal_type").notNull(), // skill_improvement, new_skill, config_change, knowledge_update
  title: text("title").notNull(),
  description: text("description").notNull(),
  rationale: text("rationale"),
  impact: text("impact").notNull().default("medium"), // low, medium, high
  status: text("status").notNull().default("pending"), // pending, approved, rejected, implemented
  proposedChanges: jsonb("proposed_changes"),
  metricsBefore: jsonb("metrics_before"),
  metricsAfter: jsonb("metrics_after"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  implementedAt: timestamp("implemented_at"),
}, (table) => ({
  agentTypeIdx: index("agent_evolution_agent_type_idx").on(table.agentType),
  statusIdx: index("agent_evolution_status_idx").on(table.status),
}));

export const insertAgentEvolutionProposalSchema = createInsertSchema(agentEvolutionProposals).omit({ id: true, createdAt: true });
export type InsertAgentEvolutionProposal = z.infer<typeof insertAgentEvolutionProposalSchema>;
export type AgentEvolutionProposal = typeof agentEvolutionProposals.$inferSelect;

// Website Audits - Summary of audit runs
export const websiteAudits = pgTable("website_audits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  runType: text("run_type").notNull().default("full"), // full, delta, links_only, translations_only, seo_only, content_only
  status: text("status").notNull().default("pending"), // pending, running, completed, failed
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  pagesScanned: integer("pages_scanned").default(0),
  linksChecked: integer("links_checked").default(0),
  translationsChecked: integer("translations_checked").default(0),
  issuesFound: integer("issues_found").default(0),
  criticalCount: integer("critical_count").default(0),
  highCount: integer("high_count").default(0),
  mediumCount: integer("medium_count").default(0),
  lowCount: integer("low_count").default(0),
  metrics: jsonb("metrics"), // Performance metrics, load times, etc.
  triggeredBy: text("triggered_by").default("manual"), // manual, scheduled, webhook
});

export const insertWebsiteAuditSchema = createInsertSchema(websiteAudits).omit({ id: true, startedAt: true });
export type InsertWebsiteAudit = z.infer<typeof insertWebsiteAuditSchema>;
export type WebsiteAudit = typeof websiteAudits.$inferSelect;

// Website Audit Findings - Individual issues found during audits
export const websiteAuditFindings = pgTable("website_audit_findings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  auditId: varchar("audit_id").notNull().references(() => websiteAudits.id, { onDelete: "cascade" }),
  category: text("category").notNull(), // links, navigation, translations, performance, seo, content
  issueType: text("issue_type").notNull(), // broken_link, missing_translation, incomplete_profile, slow_load, missing_meta, etc.
  severity: text("severity").notNull().default("medium"), // critical, high, medium, low
  status: text("status").notNull().default("open"), // open, in_progress, resolved, ignored, wont_fix
  entityType: text("entity_type"), // team_member, news, practice_group, industry_group, page, link
  entityId: varchar("entity_id"), // ID of the affected entity
  language: varchar("language", { length: 5 }), // For translation issues: en, es, de, zh, ko, ja, ar, ru, fr, it
  url: text("url"), // URL where the issue was found
  details: jsonb("details").notNull(), // Detailed issue information
  recommendation: text("recommendation"), // Suggested fix
  ownerAgent: text("owner_agent"), // Agent responsible for fixing: polyglot_translator, seo_optimizer, metadata_linker
  reportedAt: timestamp("reported_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: text("resolved_by"), // agent or manual
  remediationJobId: varchar("remediation_job_id"), // If an agent job was created to fix this
}, (table) => ({
  auditIdx: index("findings_audit_idx").on(table.auditId),
  entityIdx: index("findings_entity_idx").on(table.entityType, table.entityId),
}));

export const insertWebsiteAuditFindingSchema = createInsertSchema(websiteAuditFindings).omit({ id: true, reportedAt: true });
export type InsertWebsiteAuditFinding = z.infer<typeof insertWebsiteAuditFindingSchema>;
export type WebsiteAuditFinding = typeof websiteAuditFindings.$inferSelect;

// Audit finding categories and issue types for reference
export const auditCategories = {
  links: {
    issueTypes: ['broken_link', 'redirect_chain', 'external_link_broken', 'anchor_missing'],
    severity: 'critical'
  },
  navigation: {
    issueTypes: ['wrong_destination', 'dead_end', 'orphan_page', 'circular_navigation'],
    severity: 'high'
  },
  translations: {
    issueTypes: ['missing_translation', 'partial_translation', 'untranslated_field', 'language_mismatch'],
    severity: 'high'
  },
  performance: {
    issueTypes: ['slow_page_load', 'large_image', 'unoptimized_asset', 'render_blocking'],
    severity: 'medium'
  },
  seo: {
    issueTypes: ['missing_title', 'missing_description', 'missing_og_tags', 'missing_hreflang', 'duplicate_content', 'missing_alt_text'],
    severity: 'medium'
  },
  content: {
    issueTypes: ['incomplete_profile', 'missing_bio', 'missing_photo', 'empty_section', 'outdated_content', 'missing_practice_areas'],
    severity: 'high'
  }
} as const;

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
  teamMemberId: varchar("team_member_id").notNull().references(() => teamMembers.id, { onDelete: "cascade" }),
  rankingId: varchar("ranking_id").notNull().references(() => rankings.id, { onDelete: "cascade" }),
}, (table) => ({
  teamMemberIdx: index("tmr_team_member_idx").on(table.teamMemberId),
  rankingIdx: index("tmr_ranking_idx").on(table.rankingId),
}));

export const teamMemberAwards = pgTable("team_member_awards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamMemberId: varchar("team_member_id").notNull().references(() => teamMembers.id, { onDelete: "cascade" }),
  awardId: varchar("award_id").notNull().references(() => awards.id, { onDelete: "cascade" }),
}, (table) => ({
  teamMemberIdx: index("tma_team_member_idx").on(table.teamMemberId),
  awardIdx: index("tma_award_idx").on(table.awardId),
}));

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
  clientId: varchar("client_id").notNull().references(() => representativeClients.id, { onDelete: "cascade" }),
  practiceGroupId: varchar("practice_group_id").notNull().references(() => practiceGroups.id, { onDelete: "cascade" }),
}, (table) => ({
  clientIdx: index("cpg_client_idx").on(table.clientId),
  practiceGroupIdx: index("cpg_practice_group_idx").on(table.practiceGroupId),
}));

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
  practiceGroupId: varchar("practice_group_id").references(() => practiceGroups.id, { onDelete: "set null" }),
  isFeatured: boolean("is_featured").default(false),
  published: boolean("published").default(true),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  practiceGroupIdx: index("testimonials_practice_group_idx").on(table.practiceGroupId),
}));

export const insertTestimonialSchema = createInsertSchema(testimonials).omit({ id: true, createdAt: true });
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
export type Testimonial = typeof testimonials.$inferSelect;

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
  practiceGroupId: varchar("practice_group_id").references(() => practiceGroups.id, { onDelete: "set null" }),
  isUrgent: boolean("is_urgent").default(false),
  published: boolean("published").default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  practiceGroupIdx: index("job_openings_practice_group_idx").on(table.practiceGroupId),
}));

export const insertJobOpeningSchema = createInsertSchema(jobOpenings).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  title: z.string().max(300),
  titleEs: z.string().max(300),
  description: z.string().max(20000),
  descriptionEs: z.string().max(20000),
  requirements: z.string().max(20000).optional().nullable(),
  requirementsEs: z.string().max(20000).optional().nullable(),
});
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
  teamMemberId: varchar("team_member_id").notNull().references(() => teamMembers.id, { onDelete: "cascade" }),
  deskId: varchar("desk_id").notNull().references(() => specializedDesks.id, { onDelete: "cascade" }),
  role: text("role"), // lead, member
}, (table) => ({
  teamMemberIdx: index("tmd_team_member_idx").on(table.teamMemberId),
  deskIdx: index("tmd_desk_idx").on(table.deskId),
}));

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

// ============================================
// SITE CONFIGURATION MODULE
// ============================================

export const siteConfig = pgTable("site_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value"),
  valueEs: text("value_es"),
  type: text("type").notNull().default("text"), // text, html, url, image, json
  category: text("category").default("general"),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSiteConfigSchema = createInsertSchema(siteConfig).omit({ id: true, updatedAt: true });
export type InsertSiteConfig = z.infer<typeof insertSiteConfigSchema>;
export type SiteConfig = typeof siteConfig.$inferSelect;

// ============================================
// BANNERS & PROMOTIONS MODULE
// ============================================

export const banners = pgTable("banners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  titleEs: text("title_es"),
  subtitle: text("subtitle"),
  subtitleEs: text("subtitle_es"),
  imageUrl: text("image_url"),
  imageUrlMobile: text("image_url_mobile"),
  linkUrl: text("link_url"),
  linkText: text("link_text"),
  linkTextEs: text("link_text_es"),
  position: text("position").notNull().default("hero"), // hero, sidebar, popup, footer
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  published: boolean("published").default(true),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBannerSchema = createInsertSchema(banners).omit({ id: true, createdAt: true });
export type InsertBanner = z.infer<typeof insertBannerSchema>;
export type Banner = typeof banners.$inferSelect;

// ============================================
// NEWSLETTER SUBSCRIBERS MODULE
// ============================================

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name"),
  company: text("company"),
  preferredLanguage: varchar("preferred_language", { length: 5 }).default("es"),
  practiceInterests: text("practice_interests").array(),
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  subscribedAt: timestamp("subscribed_at").defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at"),
});

export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers).omit({ id: true, subscribedAt: true }).extend({
  email: z.string().email().max(320),
  name: z.string().max(200).optional().nullable(),
  company: z.string().max(300).optional().nullable(),
});
export type InsertNewsletterSubscriber = z.infer<typeof insertNewsletterSubscriberSchema>;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;

// ============================================
// LEGAL DOCUMENTS MODULE
// ============================================

export const legalDocuments = pgTable("legal_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // privacy_policy, terms_of_use, cookie_policy, disclaimer
  title: text("title").notNull(),
  titleEs: text("title_es").notNull(),
  content: text("content").notNull(),
  contentEs: text("content_es").notNull(),
  version: text("version").default("1.0"),
  effectiveDate: timestamp("effective_date").defaultNow(),
  published: boolean("published").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLegalDocumentSchema = createInsertSchema(legalDocuments).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLegalDocument = z.infer<typeof insertLegalDocumentSchema>;
export type LegalDocument = typeof legalDocuments.$inferSelect;

export const legalDocumentTypes = [
  { value: "privacy_policy", en: "Privacy Policy", es: "Aviso de Privacidad" },
  { value: "terms_of_use", en: "Terms of Use", es: "Términos de Uso" },
  { value: "cookie_policy", en: "Cookie Policy", es: "Política de Cookies" },
  { value: "disclaimer", en: "Legal Disclaimer", es: "Aviso Legal" },
] as const;
