import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Contact form schema
export const contactFormSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(120),
  email: z.string().trim().min(1, "Email is required").email("Invalid email address").max(254),
  phone: z.string().trim().max(32).optional(),
  company: z.string().trim().max(160).optional(),
  country: z.string().trim().min(1, "Country is required").max(120),
  practiceArea: z.string().trim().max(120).optional(),
  message: z.string().trim().min(1, "Message is required").max(5_000),
  acceptPrivacy: z.literal(true, {
    errorMap: () => ({ message: "Privacy notice acceptance is required" }),
  }),
}).strict();

export type ContactFormData = z.infer<typeof contactFormSchema>;

// Formulario público de newsletter. Los límites se mantienen deliberadamente
// pequeños para evitar que el home se convierta en una fuente de datos basura.
export const newsletterSubscribeSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120, "Name is too long"),
  email: z.string().trim().min(1, "Email is required").email("Invalid email address").max(254),
  company: z.string().trim().min(1, "Company is required").max(160, "Company is too long"),
  acceptPrivacy: z.literal(true, { errorMap: () => ({ message: "Privacy notice acceptance is required" }) }),
  language: z.enum(["es", "en"]).optional(),
});

export type NewsletterSubscribeData = z.infer<typeof newsletterSubscribeSchema>;

export const contactSubmissions = pgTable("contact_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  country: text("country"),
  practiceArea: text("practice_area"),
  message: text("message").notNull(),
  acceptedPrivacy: boolean("accepted_privacy").notNull().default(false),
  consentedAt: timestamp("consented_at"),
  ipAddress: text("ip_address"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  read: boolean("read").default(false),
});

export const insertContactSubmissionSchema = createInsertSchema(contactSubmissions).omit({ id: true, submittedAt: true, read: true });
export type InsertContactSubmission = z.infer<typeof insertContactSubmissionSchema>;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;

// Solicitudes de pasantías/empleo enviadas desde el formulario público de "Pasantes"
// (antes se perdían: el HTML capturado de Joomla tenía action="" sin backend real).
export const careerApplications = pgTable("career_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  cvPath: text("cv_path").notNull(),
  cvOriginalName: text("cv_original_name"),
  acceptedPrivacy: boolean("accepted_privacy").notNull().default(false),
  ipAddress: text("ip_address"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  read: boolean("read").default(false),
});

export const insertCareerApplicationSchema = createInsertSchema(careerApplications).omit({ id: true, submittedAt: true, read: true });
export type InsertCareerApplication = z.infer<typeof insertCareerApplicationSchema>;
export type CareerApplication = typeof careerApplications.$inferSelect;

// Deduplicación de fuentes oficiales ya escaneadas por el LegalAlertsAgent automático
// (evita crear el mismo borrador de alerta dos veces si el scan corre varias veces).
export const processedOfficialSources = pgTable("processed_official_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceUrl: text("source_url").notNull(),
  sourceHash: text("source_hash").notNull(),
  status: text("status").default("skipped_not_relevant"), // 'draft_created' | 'skipped_not_relevant' | 'skipped_error'
  newsId: varchar("news_id"),
  processedAt: timestamp("processed_at").defaultNow(),
}, (t) => ({
  sourceUrlIdx: uniqueIndex("processed_official_sources_source_url_idx").on(t.sourceUrl),
}));

export const insertProcessedOfficialSourceSchema = createInsertSchema(processedOfficialSources).omit({ id: true, processedAt: true });
export type InsertProcessedOfficialSource = z.infer<typeof insertProcessedOfficialSourceSchema>;
export type ProcessedOfficialSource = typeof processedOfficialSources.$inferSelect;

// Practice areas list for contact form
export const practiceAreas = [
  { value: "corporate-ma", en: "Corporate, Mergers & Acquisitions", es: "Corporativo, Fusiones y Adquisiciones" },
  { value: "antitrust-competition", en: "Competition & Antitrust", es: "Competencia Económica" },
  { value: "arbitration", en: "Arbitration", es: "Arbitraje" },
  { value: "litigation", en: "Litigation", es: "Litigio" },
  { value: "investigations-anticorruption", en: "Investigations, Anti-corruption & Compliance", es: "Investigaciones, Anticorrupción y Compliance" },
  { value: "bankruptcy-restructuring", en: "Bankruptcy & Restructuring", es: "Concursos Mercantiles y Reestructuración" },
  { value: "banking-finance", en: "Banking & Finance", es: "Bancario y Financiero" },
  { value: "energy-natural-resources", en: "Energy & Natural Resources", es: "Energía y Recursos Naturales" },
  { value: "esg", en: "ESG (Environmental, Social and Governance)", es: "ESG (Ambiental, Social y Gobierno Corporativo)" },
  { value: "real-estate", en: "Real Estate", es: "Inmobiliario" },
  { value: "intellectual-property", en: "Industrial & Intellectual Property", es: "Propiedad Industrial e Intelectual" },
  { value: "labor-employment", en: "Labor, Executive Compensations & Benefits", es: "Laboral, Compensación de Ejecutivos y Prestaciones" },
  { value: "tax", en: "Tax (Consultancy, Controversy & Litigation)", es: "Fiscal (Consultoría, Controversias y Litigio)" },
  { value: "international-trade", en: "International Trade & Customs", es: "Comercio Exterior y Aduanas" },
  { value: "telecommunications-media-technology", en: "Telecommunications, Media & Technology", es: "Telecomunicaciones, Medios y Tecnología" },
  { value: "environmental", en: "Environmental", es: "Ambiental" },
  { value: "immigration-global-mobility", en: "Immigration & Global Mobility", es: "Migración y Movilidad Global" },
  { value: "projects-infrastructure", en: "Projects & Infrastructure", es: "Proyectos e Infraestructura" },
] as const;

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
  // Trazabilidad mínima del consentimiento y del punto de captura. No se
  // almacenan datos de marketing adicionales en esta primera entrega.
  consentedAt: timestamp("consented_at"),
  source: text("source").default("home"),
});

export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers).omit({ id: true, subscribedAt: true });
export type InsertNewsletterSubscriber = z.infer<typeof insertNewsletterSubscriberSchema>;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
