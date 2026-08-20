import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, index, uniqueIndex, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { news } from "./news";

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

// Historial de imágenes generadas por IA (ImageSuggestionAgent / SmartImageGenerator) — permite
// reutilizar una imagen ya generada más adelante sin volver a gastar créditos de Cloudflare/Gemini.
// No se registran los placeholders (no son un asset real generado, solo un fallback visual).
export const generatedImages = pgTable("generated_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  imageUrl: text("image_url").notNull(),
  prompt: text("prompt"),
  sanitizedPrompt: text("sanitized_prompt"),
  engine: text("engine").notNull(),
  articleId: varchar("article_id").references(() => news.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Registro de consumo de la API de IA (para el contador de gasto ESTIMADO del panel).
// OpenAI no expone el saldo por API key; esto estima el costo sumando tokens/imágenes por
// nuestras propias llamadas y multiplicándolos por el precio conocido del modelo.
export const apiUsage = pgTable("api_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  kind: text("kind").notNull(),                    // 'chat' | 'translation' | 'image' | 'tts'
  model: text("model"),
  promptTokens: integer("prompt_tokens").default(0),
  completionTokens: integer("completion_tokens").default(0),
  images: integer("images").default(0),
  costUsd: doublePrecision("cost_usd").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({ createdIdx: index("api_usage_created_idx").on(t.createdAt) }));

export const insertGeneratedImageSchema = createInsertSchema(generatedImages).omit({ id: true, createdAt: true });
export type InsertGeneratedImage = z.infer<typeof insertGeneratedImageSchema>;
export type GeneratedImage = typeof generatedImages.$inferSelect;

// Historial de audio generado por IA (VoiceAgent / VoiceGenerator, TTS de OpenAI) — boletines,
// posts de redes y alertas legales convertidos a voz. sourceType identifica de qué agente
// salió el texto (newsletter/social_media/legal_alerts); articleId es opcional porque un
// boletín no está ligado a un solo artículo.
export const generatedAudio = pgTable("generated_audio", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  audioUrl: text("audio_url").notNull(),
  sourceText: text("source_text"),
  voiceId: text("voice_id"),
  engine: text("engine").notNull(),
  sourceType: text("source_type").notNull(), // newsletter | social_media | legal_alerts
  articleId: varchar("article_id").references(() => news.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGeneratedAudioSchema = createInsertSchema(generatedAudio).omit({ id: true, createdAt: true });
export type InsertGeneratedAudio = z.infer<typeof insertGeneratedAudioSchema>;
export type GeneratedAudio = typeof generatedAudio.$inferSelect;

// Historial de presentaciones generadas por IA (PresentationGenerator / 14° agente
// presentation_generator). Un mismo registro apunta a los tres formatos generados a partir
// del MISMO modelo de diapositivas: pptxUrl (editable), pdfUrl (una página por diapositiva) y
// pngUrls (una imagen por diapositiva). template = plantilla visual (vonwobeser|minimal|dark);
// branding = perfil de marca aplicado (vonwobeser|custom); sourceDocs = nombres de los
// documentos subidos que se usaron como insumo. PostgreSQL conserva este historial y
// las referencias opacas; las presentaciones nuevas guardan sus binarios en App Storage bajo
// von-wobeser/private/generated-presentations/<uuid>/ y solo se sirven con autorización.
export const generatedPresentations = pgTable("generated_presentations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  topic: text("topic"),
  template: text("template").notNull().default("vonwobeser"),
  branding: text("branding").notNull().default("vonwobeser"),
  lang: text("lang").notNull().default("es"),
  slideCount: integer("slide_count").default(0),
  pptxUrl: text("pptx_url"),
  pdfUrl: text("pdf_url"),
  pngUrls: jsonb("png_urls").$type<string[]>().default([]),
  sourceDocs: jsonb("source_docs").$type<string[]>().default([]),
  engine: text("engine").notNull(),
  status: text("status").notNull().default("active"),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  statusCreatedIdx: index("generated_presentations_status_created_idx").on(table.status, table.createdAt),
}));

export const insertGeneratedPresentationSchema = createInsertSchema(generatedPresentations, {
  // Refina los jsonb a arreglos de strings (drizzle-zod infiere unknown[] por defecto).
  pngUrls: z.array(z.string()).optional(),
  sourceDocs: z.array(z.string()).optional(),
}).omit({ id: true, createdAt: true, status: true, archivedAt: true });
export type InsertGeneratedPresentation = z.infer<typeof insertGeneratedPresentationSchema>;
export type GeneratedPresentation = typeof generatedPresentations.$inferSelect;

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

// Outbox durable para solicitudes futuras de retiro desde el panel. Solicitar no elimina
// el registro ni el objeto: un procesador idempotente debe comprobar referencias y retirar
// exclusivamente el objeto exacto antes de completar la solicitud.
export const mediaDeletionRequests = pgTable("media_deletion_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mediaItemId: varchar("media_item_id").notNull(),
  publicPath: text("public_path").notNull(),
  objectName: text("object_name"),
  status: text("status").notNull().default("pending"),
  requestedBy: varchar("requested_by").notNull(),
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
}, (table) => ({
  mediaItemUnique: uniqueIndex("media_deletion_requests_media_item_idx").on(table.mediaItemId),
  statusRequestedIdx: index("media_deletion_requests_status_requested_idx").on(table.status, table.requestedAt),
}));

export const insertMediaDeletionRequestSchema = createInsertSchema(mediaDeletionRequests)
  .omit({ id: true, requestedAt: true, processedAt: true, attempts: true, lastError: true, status: true });
export type InsertMediaDeletionRequest = z.infer<typeof insertMediaDeletionRequestSchema>;
export type MediaDeletionRequest = typeof mediaDeletionRequests.$inferSelect;
