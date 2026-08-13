import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
}, (t) => ({
  // WHERE published + ORDER BY date (listado de eventos).
  publishedDateIdx: index("events_published_date_idx").on(t.published, t.date),
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
  { code: "de", name: "German", nameNative: "Deutsch" },
  { code: "zh", name: "Chinese", nameNative: "中文" },
  { code: "ko", name: "Korean", nameNative: "한국어" },
  { code: "ja", name: "Japanese", nameNative: "日本語" },
  { code: "ar", name: "Arabic", nameNative: "العربية" },
  { code: "ru", name: "Russian", nameNative: "Русский" },
  { code: "fr", name: "French", nameNative: "Français" },
  { code: "it", name: "Italian", nameNative: "Italiano" },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]["code"];
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];
