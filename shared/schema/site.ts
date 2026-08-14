import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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

// Preferencias tipográficas por entidad/campo/idioma. Se mantiene separada de
// cada tabla editorial para que el CMS pueda crecer sin columnas repetidas y
// para que `auto` no altere el contenido legado.
export const editorialTypography = pgTable("editorial_typography", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  field: text("field").notNull(),
  language: varchar("language", { length: 2 }).notNull(),
  family: varchar("family", { length: 12 }).notNull().default("auto"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  targetUnique: uniqueIndex("editorial_typography_target_unique").on(t.entityType, t.entityId, t.field, t.language),
  entityIdx: index("editorial_typography_entity_idx").on(t.entityType, t.entityId),
}));

export const insertEditorialTypographySchema = createInsertSchema(editorialTypography).omit({ id: true, updatedAt: true });
export type EditorialTypography = typeof editorialTypography.$inferSelect;

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
