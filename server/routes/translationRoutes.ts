import type { Express, Request, Response } from "express";
import { z } from "zod";
import { authMiddleware, requirePermission } from "../auth";
import { sanitizeCms } from "../mirror/sanitize";
import {
  SUPPORTED_LANGUAGES,
  translateLegalText,
  translateMultipleTexts,
  suggestTranslation,
  type LanguageCode,
} from "../openai";
import { storage } from "../storage";
import { apiError } from "./routeUtils";

export function registerTranslationRoutes(app: Express): void {
  // =============================================
  // TRANSLATION API (AI-powered)

  // GET /api/languages - Get list of supported languages
  app.get("/api/languages", (_req, res) => {
    res.json(SUPPORTED_LANGUAGES);
  });
  const validLanguageCodes = new Set<string>(SUPPORTED_LANGUAGES.map((language) => language.code));
  const languageCodeSchema = z.string().refine((value) => validLanguageCodes.has(value), "Invalid language code");
  const translationTextSchema = z.string().min(1).max(20_000);
  const translationEntitySchema = z.string().uuid();
  const translationKeySchema = z.string().trim().regex(/^[A-Za-z][A-Za-z0-9_]{0,79}$/);
  const boundedTranslationFields = z.record(translationKeySchema, z.string().max(20_000))
    .superRefine((fields, context) => {
      const entries = Object.entries(fields);
      if (entries.length > 25) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "Too many fields" });
      }
      if (entries.reduce((total, [, value]) => total + value.length, 0) > 100_000) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "Translation payload is too large" });
      }
    });

  // Estas 5 rutas llaman al LLM de traducción real (costo de API) y una de ellas escribe en
  // la base de datos para un entityId arbitrario — no deben ser alcanzables sin sesión de
  // admin. authMiddleware+requirePermission("content") en las 5, igual que
  // /api/admin/translate-fields (que ya lo hacía bien).

  // POST /api/translate - Translate single text
  app.post("/api/translate", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const parsed = z.object({
        text: translationTextSchema,
        sourceLanguage: languageCodeSchema,
        targetLanguage: languageCodeSchema,
      }).strict().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid translation request" });
      const { text, sourceLanguage, targetLanguage } = parsed.data;

      const translation = await translateLegalText(
        text,
        sourceLanguage as LanguageCode,
        targetLanguage as LanguageCode
      );

      res.json({ translation, sourceLanguage, targetLanguage });
    } catch (error) {
      console.error("Translation error:", error);
      res.status(500).json({ error: "Failed to translate text" });
    }
  });

  // POST /api/translate/batch - Translate multiple texts
  app.post("/api/translate/batch", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const parsed = z.object({
        texts: z.array(z.object({
          key: translationKeySchema,
          text: translationTextSchema,
        }).strict()).min(1).max(25),
        sourceLanguage: languageCodeSchema,
        targetLanguage: languageCodeSchema,
      }).strict().superRefine((value, context) => {
        if (value.texts.reduce((total, item) => total + item.text.length, 0) > 100_000) {
          context.addIssue({ code: z.ZodIssueCode.custom, message: "Translation payload is too large" });
        }
      }).safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid batch translation request" });
      const { texts, sourceLanguage, targetLanguage } = parsed.data;

      const translations = await translateMultipleTexts(
        texts,
        sourceLanguage as LanguageCode,
        targetLanguage as LanguageCode
      );

      res.json({ translations, sourceLanguage, targetLanguage });
    } catch (error) {
      console.error("Batch translation error:", error);
      res.status(500).json({ error: "Failed to translate texts" });
    }
  });

  // POST /api/translate/suggest - Suggest translation for blog post
  app.post("/api/translate/suggest", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const parsed = z.object({
        originalText: translationTextSchema,
        existingTranslations: z.record(languageCodeSchema, z.string().max(20_000)).optional().default({}),
        targetLanguage: languageCodeSchema,
      }).strict().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid translation suggestion request" });
      const { originalText, existingTranslations, targetLanguage } = parsed.data;

      const result = await suggestTranslation(
        originalText,
        existingTranslations,
        targetLanguage as LanguageCode
      );

      res.json({ ...result, targetLanguage });
    } catch (error) {
      console.error("Translation suggestion error:", error);
      res.status(500).json({ error: "Failed to suggest translation" });
    }
  });

  // POST /api/admin/translate-fields - Traduce un conjunto de campos con nombre (ej. {title, excerpt,
  // content}) de un idioma a otro y DEVUELVE el texto traducido, SIN persistir. Lo usa el botón
  // "Traducir al inglés con IA" del editor: el usuario revisa antes de guardar. Una sola llamada al LLM.
  app.post("/api/admin/translate-fields", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const parsed = z.object({
        fields: boundedTranslationFields,
        from: languageCodeSchema.default("es"),
        to: languageCodeSchema.default("en"),
      }).strict().safeParse(req.body);
      if (!parsed.success) return apiError(res, 400, "Solicitud de traducción inválida");
      const { fields, from, to } = parsed.data;
      // Solo campos con texto real; los vacíos se devuelven vacíos sin gastar tokens.
      const entries = Object.entries(fields as Record<string, unknown>)
        .filter(([, v]) => typeof v === "string" && v.trim())
        .map(([key, v]) => ({ key, text: String(v) }));
      if (entries.length === 0) {
        return res.json({ fields: {}, from, to });
      }
      const translated = await translateMultipleTexts(entries, from as LanguageCode, to as LanguageCode);
      res.json({ fields: translated, from, to });
    } catch (error) {
      console.error("translate-fields error:", error);
      return apiError(res, 500, "No se pudo traducir. Revisa que haya créditos de IA disponibles.");
    }
  });

  // TRANSLATION CACHE API

  // GET /api/translations/:contentType/:entityId/:targetLanguage - Get all cached translations for an entity.
  // Sin login, un entityId de un borrador (published=false) sería legible en otro idioma sin
  // pasar por el filtro de publicado — mismo patrón de fuga que el resto de la API pública.
  app.get("/api/translations/:contentType/:entityId/:targetLanguage", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const parsed = z.object({
        contentType: z.enum(["team_member", "practice_group", "industry_group", "news", "event", "representative_matter"]),
        entityId: translationEntitySchema,
        targetLanguage: languageCodeSchema,
      }).safeParse(req.params);
      if (!parsed.success) return res.status(400).json({ error: "Invalid translation lookup" });
      const { contentType, entityId, targetLanguage } = parsed.data;

      // For news content, first check the newsTranslations table
      if (contentType === 'news') {
        const newsTranslation = await storage.getNewsTranslation(entityId, targetLanguage);
        if (newsTranslation) {
          const translationsMap: Record<string, string> = {};
          if (newsTranslation.title) {
            translationsMap.title = newsTranslation.title;
          }
          if (newsTranslation.excerpt) {
            translationsMap.excerpt = newsTranslation.excerpt;
          }
          if (newsTranslation.content) {
            translationsMap.content = newsTranslation.content;
          }

          // Return if we found any translations
          if (Object.keys(translationsMap).length > 0) {
            return res.json({ translations: translationsMap, contentType, entityId, targetLanguage });
          }
        }
      }

      // Fall back to translationCache lookup
      const translations = await storage.getTranslations(contentType, entityId, targetLanguage);

      const translationsMap: Record<string, string> = {};
      for (const t of translations) {
        if (t.field && t.translatedText) {
          translationsMap[t.field] = t.translatedText;
        }
      }

      res.json({ translations: translationsMap, contentType, entityId, targetLanguage });
    } catch (error) {
      console.error("Get translations error:", error);
      res.status(500).json({ error: "Failed to fetch translations" });
    }
  });

  // POST /api/translate-content - Translate single content and cache it. Sin login, cualquiera
  // podía escribir en translationCache para un entityId real arbitrario (envenenamiento de
  // caché de traducción) además de gastar la API de traducción de pago.
  app.post("/api/translate-content", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const parsed = z.object({
        contentType: z.enum(["team_member", "practice_group", "industry_group", "news", "event", "representative_matter"]),
        entityId: translationEntitySchema,
        field: translationKeySchema,
        sourceText: translationTextSchema,
        sourceLanguage: languageCodeSchema,
        targetLanguage: languageCodeSchema,
      }).strict().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid translation request" });
      const { contentType, entityId, field, sourceText, sourceLanguage, targetLanguage } = parsed.data;

      const existingTranslation = await storage.getTranslation(contentType, entityId, field, targetLanguage);
      if (existingTranslation && existingTranslation.sourceText === sourceText) {
        return res.json({
          translation: existingTranslation.translatedText,
          cached: true,
          contentType,
          entityId,
          field,
          targetLanguage
        });
      }

      const translatedText = await translateLegalText(
        sourceText,
        sourceLanguage as LanguageCode,
        targetLanguage as LanguageCode
      );

      const safeTranslatedText = sanitizeCms(translatedText);
      const saved = await storage.saveTranslation({
        contentType,
        entityId,
        field,
        sourceLanguage,
        targetLanguage,
        sourceText,
        translatedText: safeTranslatedText,
      });

      res.json({
        translation: saved.translatedText,
        cached: false,
        contentType,
        entityId,
        field,
        targetLanguage
      });
    } catch (error) {
      console.error("Translate content error:", error);
      res.status(500).json({ error: "Failed to translate content" });
    }
  });

  // POST /api/translate-entity - Batch translate all translatable fields for an entity
  app.post("/api/translate-entity", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const validContentTypes = ['team_member', 'practice_group', 'industry_group', 'news', 'event', 'representative_matter'] as const;
      const parsed = z.object({
        contentType: z.enum(validContentTypes),
        entityId: translationEntitySchema,
        fields: boundedTranslationFields,
        sourceLanguage: languageCodeSchema,
        targetLanguage: languageCodeSchema,
      }).strict().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid entity translation request" });
      const { contentType, entityId, fields, sourceLanguage, targetLanguage } = parsed.data;

      const validFieldsByContentType: Record<string, readonly string[]> = {
        team_member: ['title', 'role', 'bio', 'degree'],
        practice_group: ['name', 'description', 'fullDescription'],
        industry_group: ['name', 'description', 'fullDescription'],
        news: ['title', 'excerpt', 'content'],
        event: ['title', 'description', 'location'],
        representative_matter: ['title', 'description', 'client'],
      };

      const validFields = validFieldsByContentType[contentType] || [];
      const submittedFields = Object.keys(fields as Record<string, string>);
      const invalidFields = submittedFields.filter(f => !validFields.includes(f));

      if (invalidFields.length > 0) {
        return res.status(400).json({
          error: `Invalid field names for ${contentType}: ${invalidFields.join(', ')}. Valid fields are: ${validFields.join(', ')}`
        });
      }

      const fieldsToTranslate: { key: string; text: string }[] = [];
      const cachedTranslations: Record<string, string> = {};

      for (const [fieldName, text] of Object.entries(fields as Record<string, string>)) {
        if (!text || typeof text !== 'string' || !text.trim()) continue;

        const existingTranslation = await storage.getTranslation(contentType, entityId, fieldName, targetLanguage);
        if (existingTranslation && existingTranslation.sourceText === text && existingTranslation.translatedText) {
          cachedTranslations[fieldName] = existingTranslation.translatedText;
        } else {
          fieldsToTranslate.push({ key: fieldName, text });
        }
      }

      let newTranslations: Record<string, string> = {};
      if (fieldsToTranslate.length > 0) {
        newTranslations = await translateMultipleTexts(
          fieldsToTranslate,
          sourceLanguage as LanguageCode,
          targetLanguage as LanguageCode
        );

        for (const [fieldName, translatedText] of Object.entries(newTranslations)) {
          const originalField = fieldsToTranslate.find(f => f.key === fieldName);
          if (originalField) {
            const safeTranslatedText = sanitizeCms(translatedText);
            await storage.saveTranslation({
              contentType,
              entityId,
              field: fieldName,
              sourceLanguage,
              targetLanguage,
              sourceText: originalField.text,
              translatedText: safeTranslatedText,
            });
            newTranslations[fieldName] = safeTranslatedText;
          }
        }
      }

      const allTranslations = { ...cachedTranslations, ...newTranslations };

      res.json({
        translations: allTranslations,
        contentType,
        entityId,
        targetLanguage,
        cachedCount: Object.keys(cachedTranslations).length,
        translatedCount: Object.keys(newTranslations).length,
      });
    } catch (error) {
      console.error("Translate entity error:", error);
      res.status(500).json({ error: "Failed to translate entity" });
    }
  });
}
