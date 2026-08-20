import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  // Destacada en la caja de Noticias del hero de la home (curable desde el editor).
  featuredHome: boolean("featured_home").default(false),
  category: text("category").default("press"),
  categoryEs: text("category_es").default("Prensa"),
  // Etiquetas editoriales explícitas: alimentan las recomendaciones entre publicaciones;
  // no sustituyen categorías ni keywords SEO generadas por IA.
  tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
  authorId: varchar("author_id"),
  // Processing status tracking
  processingStatus: text("processing_status").default("pending"), // pending, processing, ready, ready_for_approval, failed, partial_success
  lastError: text("last_error"), // Stores the last error message/code for diagnostics
  lastProcessedAt: timestamp("last_processed_at"),
  failedStep: text("failed_step"), // Which step failed: format, categorize, metadata, seo, translate, image, council
  // Content scheduling: articles with a future publishAt are hidden from public routes
  publishAt: timestamp("publish_at"),
  // ID original de la publicación en el sitio Joomla (p_id), para mapear URLs originales
  legacyId: text("legacy_id"),
  // Automated legal-risk review result (decision support, not legal advice)
  councilVerdict: jsonb("council_verdict"), // Stores CouncilVerdict: { overallStatus, riskFlag, consolidatedFeedback }
}, (t) => ({
  // Acelera ORDER BY date DESC + LIMIT (home, listado de noticias).
  dateIdx: index("news_date_idx").on(t.date),
}));

export const newsCategories = [
  // "news"/"articles" son las categorías reales de la inmensa mayoría del contenido migrado
  // del sitio original (1439 y 284 filas respectivamente) — antes no se podían elegir aquí,
  // así que no había forma de crear un artículo NUEVO marcado como tal desde el panel.
  { value: "news", en: "News", es: "Noticias" },
  { value: "articles", en: "Articles", es: "Artículos" },
  { value: "press", en: "Press", es: "Prensa" },
  { value: "insights", en: "Insights", es: "Insights" },
  { value: "rankings", en: "Rankings", es: "Rankings" },
  { value: "events", en: "Events", es: "Eventos" },
  { value: "alerts", en: "Alerts", es: "Alertas" },
] as const;

export const insertNewsSchema = createInsertSchema(news).omit({ id: true, date: true });
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
}, (t) => ({
  // Cubre el lookup exacto (newsId+language) y el GROUP BY newsId (prefijo).
  newsIdLangIdx: index("news_translations_news_id_language_idx").on(t.newsId, t.language),
}));

export const insertNewsTranslationSchema = createInsertSchema(newsTranslations).omit({ id: true, translatedAt: true });
export type InsertNewsTranslation = z.infer<typeof insertNewsTranslationSchema>;
export type NewsTranslation = typeof newsTranslations.$inferSelect;
