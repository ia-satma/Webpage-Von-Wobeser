import type { Express, Request, Response } from "express";
import { insertNewsSchema, news, newsTranslations, teamMembers } from "@shared/schema";
import {
  PUBLIC_TYPOGRAPHY_FIELDS,
  isPublicTypographyField,
  isTypographyFamily,
  type TypographyLanguage,
} from "@shared/editorialTypography";
import { z, ZodError } from "zod";
import { authMiddleware, requirePermission } from "../auth";
import { db } from "../db";
import { getEditorialTypography, replaceEditorialTypography } from "../editorialTypography";
import { invalidatePublicPageCache } from "../mirror/pageCache";
import { sanitizeNewsFields } from "../mirror/sanitize";
import { SUPPORTED_LANGUAGES } from "../openai";
import { storage } from "../storage";
import { apiError, auditLog, getLinguisticWarnings } from "./routeUtils";

export function registerAdminNewsRoutes(app: Express): void {
  // =============================================
  // ADMIN NEWS CRUD
  // =============================================

  const hasCmsText = (value: unknown) => String(value ?? "").replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").trim().length > 0;
  const hasPublishableBilingualNews = (item: { title?: unknown; titleEs?: unknown; excerpt?: unknown; excerptEs?: unknown }) =>
    hasCmsText(item.title) && hasCmsText(item.titleEs) && hasCmsText(item.excerpt) && hasCmsText(item.excerptEs);

  // Get all news with pagination/search
  app.get("/api/admin/news", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const parsed = z.object({
        page: z.coerce.number().int().min(1).max(100_000).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        search: z.string().trim().max(200).default(""),
        category: z.string().trim().max(80).default(""),
      }).safeParse(req.query);
      if (!parsed.success) return res.status(400).json({ error: "Invalid pagination or filters" });
      const { page, limit, search, category } = parsed.data;

      // Filtro + paginado EN SQL (antes traía las ~1.792 noticias completas → 35s).
      const { rows, total } = await storage.getAdminNewsPage({
        limit,
        offset: (page - 1) * limit,
        search,
        category,
      });

      res.json({
        news: rows,
        total,
        page,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      });
    } catch (error) {
      console.error("Get admin news error:", error);
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });

  // Get news stats
  app.get("/api/admin/news/stats", authMiddleware, requirePermission("content"), async (_req: Request, res: Response) => {
    try {
      const { total, published, unpublished } = await storage.getNewsStatusCounts();
      res.json({ total, published, unpublished });
    } catch (error) {
      console.error("Get news stats error:", error);
      res.status(500).json({ error: "Failed to fetch news stats" });
    }
  });

  // Get comprehensive CMS stats for admin dashboard
  app.get("/api/admin/cms-stats", authMiddleware, requirePermission("content"), async (_req: Request, res: Response) => {
    try {
      // Antes: getNews() (1.792 filas) + un getNewsTranslations() POR artículo (N+1)
      // → timeout. Ahora: conteos/agregados en SQL + solo las 5 recientes.
      const [totalArticles, transStats, recent, baseCoverage] = await Promise.all([
        storage.getNewsCount(),
        storage.getTranslationStats(),
        storage.getRecentNews(5),
        storage.getBaseLanguageCoverage(),
      ]);

      const recentArticles = recent.map(n => ({
        id: n.id,
        title: n.title,
        titleEs: n.titleEs,
        slug: n.slug,
        date: n.date,
        category: n.category,
        published: n.published,
      }));

      res.json({
        totalArticles,
        articlesWithTranslations: transStats.articlesWithTranslations,
        totalTranslations: transStats.total,
        translationsByLanguage: transStats.byLanguage,
        // Cobertura REAL español/inglés (columnas base de `news`, no la caché de 10 idiomas
        // de arriba) — ver comentario en storage.getBaseLanguageCoverage().
        languageCoverage: {
          es: { total: baseCoverage.total, translated: baseCoverage.total },
          en: { total: baseCoverage.total, translated: baseCoverage.total - baseCoverage.missingEnglish },
        },
        recentArticles,
        languagesSupported: 10,
        processingStatus: "idle", // Could be connected to actual processing status
      });
    } catch (error) {
      console.error("Get CMS stats error:", error);
      res.status(500).json({ error: "Failed to fetch CMS stats" });
    }
  });

  // Preferencias tipográficas editoriales. La API es deliberadamente estrecha:
  // no permite CSS, nombres de fuentes ni campos fuera del inventario público.
  const typographyTargetSchema = z.object({
    entityType: z.string().min(1).max(64),
    entityId: z.string().min(1).max(160).regex(/^[A-Za-z0-9_-]+$/, "Identificador de contenido inválido"),
  });
  const typographyStylesSchema = z.object({
    styles: z.array(z.object({
      field: z.string().min(1).max(80),
      language: z.enum(["en", "es"]),
      family: z.enum(["auto", "gelasio", "inter"]),
    })).min(1).max(80),
  });

  const validateTypographyTarget = (entityType: string, styles: Array<{ field: string; language: TypographyLanguage; family: string }>) => {
    if (!styles.every((style) => isTypographyFamily(style.family) && isPublicTypographyField(entityType, style.field))) {
      return false;
    }
    return true;
  };

  app.get("/api/admin/editorial-typography/:entityType/:entityId", authMiddleware, requirePermission("content"), async (req, res) => {
    const target = typographyTargetSchema.safeParse(req.params);
    if (!target.success || !PUBLIC_TYPOGRAPHY_FIELDS.some((field) => field.entityType === target.data.entityType)) {
      return res.status(400).json({ error: "Destino tipográfico inválido" });
    }
    return res.json({ styles: await getEditorialTypography(target.data.entityType, target.data.entityId) });
  });

  app.put("/api/admin/editorial-typography/:entityType/:entityId", authMiddleware, requirePermission("content"), async (req, res) => {
    const target = typographyTargetSchema.safeParse(req.params);
    const payload = typographyStylesSchema.safeParse(req.body);
    if (!target.success || !payload.success || !validateTypographyTarget(target.data.entityType, payload.data.styles)) {
      return res.status(400).json({ error: "La tipografía, el idioma o el campo no están permitidos" });
    }
    const styles = await replaceEditorialTypography(
      target.data.entityType,
      target.data.entityId,
      payload.data.styles as Array<{ field: string; language: TypographyLanguage; family: "auto" | "gelasio" | "inter" }>,
    );
    invalidatePublicPageCache();
    return res.json({ styles });
  });

  // El procesamiento usa el mapa compacto `counts`, mientras que el panel de
  // traducciones también necesita el estado detallado por artículo. Entregar ambos
  // en una misma respuesta evita el antiguo contrato inconsistente (el panel esperaba
  // `news`, pero el servidor solo devolvía el mapa de conteos).
  app.get("/api/admin/news/translation-counts", authMiddleware, requirePermission("content"), async (_req: Request, res: Response) => {
    try {
      const [counts, articles, translations] = await Promise.all([
        storage.getNewsTranslationCounts(),
        db.select({
          id: news.id,
          title: news.title,
          titleEs: news.titleEs,
          slug: news.slug,
          category: news.category,
          content: news.content,
          contentEs: news.contentEs,
          published: news.published,
        }).from(news),
        db.select({ newsId: newsTranslations.newsId, language: newsTranslations.language }).from(newsTranslations),
      ]);
      const languageCodes = SUPPORTED_LANGUAGES.map((language) => language.code);
      const translationsByArticle = new Map<string, Set<string>>();
      for (const translation of translations) {
        const languages = translationsByArticle.get(translation.newsId) || new Set<string>();
        languages.add(translation.language);
        translationsByArticle.set(translation.newsId, languages);
      }
      const translationStatus = articles.map((article) => {
        const sourceLanguage = article.contentEs?.trim() ? "es" : "en";
        const translated = translationsByArticle.get(article.id) || new Set<string>();
        translated.add(sourceLanguage);
        const translatedLanguages = languageCodes.filter((language) => translated.has(language));
        return {
          articleId: article.id,
          title: article.titleEs || article.title || article.slug,
          slug: article.slug,
          category: article.category || "news",
          published: article.published === true,
          translatedLanguages,
          missingLanguages: languageCodes.filter((language) => !translated.has(language)),
        };
      });
      res.json({ counts, news: translationStatus });
    } catch (error) {
      console.error("Get translation counts error:", error);
      res.status(500).json({ error: "Failed to fetch translation counts" });
    }
  });

  // Get translations for a specific news article
  app.get("/api/admin/news/:id/translations", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const translations = await storage.getNewsTranslations(id);
      res.json(translations);
    } catch (error) {
      console.error("Get news translations error:", error);
      res.status(500).json({ error: "Failed to fetch translations" });
    }
  });

  const teamMemberIdsSchema = z.array(z.string().uuid()).max(50).transform((ids) => Array.from(new Set(ids)));
  // Las etiquetas son una decisión editorial, no una inferencia opaca sobre el texto.
  // Se normalizan para que "Fiscal" y " fiscal " siempre enlacen el mismo tema.
  const editorialTagsSchema = z.array(z.string().trim().min(2).max(60)).max(12).transform((tags) =>
    Array.from(new Set(tags.map((tag) => tag.replace(/\s+/g, " ").toLocaleLowerCase("es-MX")).filter(Boolean))),
  );
  const adminNewsCreateSchema = insertNewsSchema.extend({
    tags: editorialTagsSchema.default([]),
    teamMemberIds: teamMemberIdsSchema.default([]),
  });
  const adminNewsUpdateSchema = insertNewsSchema.partial().extend({
    tags: editorialTagsSchema.optional(),
    teamMemberIds: teamMemberIdsSchema.optional(),
  });

  const validateNewsTeamMembers = async (ids: string[]) => {
    if (!ids.length) return true;
    const knownIds = new Set((await storage.getTeamMembers()).map((member) => member.id));
    return ids.every((id) => knownIds.has(id));
  };

  // El pipeline modifica el contenido y por diseño solo puede trabajar sobre
  // borradores. En vez de despublicar una nota visible, crea una copia de
  // trabajo con sus relaciones y traducciones para que se revise antes de
  // reemplazar o publicar cualquier cambio.
  app.post("/api/admin/news/:id/processing-draft", authMiddleware, requirePermission("agents"), async (req: Request, res: Response) => {
    try {
      const parsedId = z.string().uuid().safeParse(req.params.id);
      if (!parsedId.success) return apiError(res, 400, "Invalid news id");

      const source = await storage.getNewsById(parsedId.data);
      if (!source) return apiError(res, 404, "News not found");
      if (source.published === false) {
        return apiError(res, 409, "This article is already a draft", { code: "ARTICLE_ALREADY_DRAFT" });
      }

      const draft = await storage.createNewsProcessingDraft(source.id);
      if (!draft) return apiError(res, 409, "The processing draft could not be created", { code: "PROCESSING_DRAFT_NOT_CREATED" });
      await auditLog("create", "news_processing_draft", draft.id, (req as any).adminUser?.id || "unknown", { sourceId: source.id }, req);
      return res.status(201).json({ sourceId: source.id, draft });
    } catch (error) {
      console.error("Create processing draft error:", error);
      return apiError(res, 500, "Failed to create processing draft");
    }
  });

  const normalizeAuthorEvidence = (value: unknown): string => String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  const authorSuggestions = (item: typeof news.$inferSelect, members: typeof teamMembers.$inferSelect[]) => {
    const source = [item.titleEs, item.title, item.excerptEs, item.excerpt, item.contentEs, item.content]
      .filter(Boolean)
      .join(" ")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    const normalizedSource = normalizeAuthorEvidence(source);
    return members
      .map((member) => {
        const candidate = normalizeAuthorEvidence(member.name);
        const index = candidate.split(" ").length >= 2 && candidate.length >= 6
          ? normalizedSource.indexOf(candidate)
          : -1;
        if (index < 0) return null;
        return {
          id: member.id,
          name: member.name,
          evidence: source.slice(Math.max(0, index - 70), Math.min(source.length, index + member.name.length + 110)),
        };
      })
      .filter((candidate): candidate is { id: string; name: string; evidence: string } => candidate !== null);
  };

  // Revisión humana del histórico: las coincidencias son propuestas, nunca relaciones aplicadas.
  app.get("/api/admin/news/author-review", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const parsed = z.object({
        page: z.coerce.number().int().min(1).max(100_000).default(1),
        limit: z.coerce.number().int().min(1).max(50).default(20),
      }).safeParse(req.query);
      if (!parsed.success) return res.status(400).json({ error: "Invalid pagination" });
      const { page, limit } = parsed.data;
      const [{ rows, total }, members] = await Promise.all([
        storage.getNewsWithoutTeamMembersPage({ limit, offset: (page - 1) * limit }),
        storage.getTeamMembers(),
      ]);
      res.json({
        news: rows.map((item) => ({ ...item, authorCandidates: authorSuggestions(item, members) })),
        total,
        page,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      });
    } catch (error) {
      console.error("Get author review queue error:", error);
      res.status(500).json({ error: "Failed to load author review queue" });
    }
  });

  // Get single news by ID
  app.get("/api/admin/news/:id", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const newsItem = await storage.getNewsById(req.params.id);
      if (!newsItem) {
        return res.status(404).json({ error: "News not found" });
      }
      res.json(newsItem);
    } catch (error) {
      console.error("Get news error:", error);
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });

  app.get("/api/admin/news/:id/team-members", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const newsItem = await storage.getNewsById(req.params.id);
      if (!newsItem) return res.status(404).json({ error: "News not found" });
      res.json(await storage.getTeamMembersByNewsId(newsItem.id));
    } catch (error) {
      console.error("Get news team members error:", error);
      res.status(500).json({ error: "Failed to fetch related team members" });
    }
  });

  app.put("/api/admin/news/:id/team-members", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const parsed = z.object({ teamMemberIds: teamMemberIdsSchema }).safeParse(req.body);
      if (!parsed.success) return apiError(res, 400, "Invalid team members", parsed.error.errors);
      const newsItem = await storage.getNewsById(req.params.id);
      if (!newsItem) return apiError(res, 404, "News not found");
      if (!await validateNewsTeamMembers(parsed.data.teamMemberIds)) {
        return apiError(res, 400, "One or more team members do not exist");
      }
      await storage.setTeamMembersForNews(newsItem.id, parsed.data.teamMemberIds);
      await auditLog("update", "news_team_members", newsItem.id, (req as any).adminUser?.id || "unknown", undefined, req);
      res.json({ success: true });
    } catch (error) {
      console.error("Update news team members error:", error);
      return apiError(res, 500, "Failed to update related team members");
    }
  });

  // Create news
  app.post("/api/admin/news", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const validation = adminNewsCreateSchema.safeParse(req.body);

      if (!validation.success) {
        return apiError(res, 400, "Validation failed", validation.error.errors);
      }

      const { teamMemberIds, ...newsData } = validation.data;
      sanitizeNewsFields(newsData);
      if (newsData.published && !hasPublishableBilingualNews(newsData)) {
        return apiError(res, 400, "Published news requires title and excerpt in English and Spanish");
      }

      if (!await validateNewsTeamMembers(teamMemberIds)) {
        return apiError(res, 400, "One or more team members do not exist");
      }

      const newsItem = await storage.createNewsWithTeamMembers(newsData, teamMemberIds);
      const linguisticWarnings = await getLinguisticWarnings([
        { field: "title", lang: "en", text: newsItem.title },
        { field: "titleEs", lang: "es", text: newsItem.titleEs },
        { field: "excerpt", lang: "en", text: newsItem.excerpt },
        { field: "excerptEs", lang: "es", text: newsItem.excerptEs },
        { field: "content", lang: "en", text: newsItem.content },
        { field: "contentEs", lang: "es", text: newsItem.contentEs },
      ]);
      await auditLog("create", "news", newsItem.id, (req as any).adminUser?.id || "unknown", undefined, req);
      res.status(201).json({ ...newsItem, linguisticWarnings });
    } catch (error) {
      console.error("Create news error:", error);
      return apiError(res, 500, "Failed to create news");
    }
  });

  // Update news
  app.put("/api/admin/news/:id", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const parsed = adminNewsUpdateSchema.safeParse(req.body);
      if (!parsed.success) return apiError(res, 400, "Invalid input", parsed.error.errors);
      const { teamMemberIds, ...validated } = parsed.data;
      sanitizeNewsFields(validated);
      const current = await storage.getNewsById(req.params.id);
      if (!current) return apiError(res, 404, "News not found");
      const finalState = { ...current, ...validated };
      if (finalState.published && !hasPublishableBilingualNews(finalState)) {
        return apiError(res, 400, "Published news requires title and excerpt in English and Spanish");
      }
      if (teamMemberIds && !await validateNewsTeamMembers(teamMemberIds)) {
        return apiError(res, 400, "One or more team members do not exist");
      }
      const newsItem = await storage.updateNewsWithTeamMembers(req.params.id, validated, teamMemberIds);
      if (!newsItem) {
        return apiError(res, 404, "News not found");
      }
      const linguisticWarnings = await getLinguisticWarnings([
        { field: "title", lang: "en", text: newsItem.title },
        { field: "titleEs", lang: "es", text: newsItem.titleEs },
        { field: "excerpt", lang: "en", text: newsItem.excerpt },
        { field: "excerptEs", lang: "es", text: newsItem.excerptEs },
        { field: "content", lang: "en", text: newsItem.content },
        { field: "contentEs", lang: "es", text: newsItem.contentEs },
      ]);
      await auditLog("update", "news", req.params.id, (req as any).adminUser?.id || "unknown", undefined, req);
      res.json({ ...newsItem, linguisticWarnings });
    } catch (error) {
      if (error instanceof ZodError) {
        return apiError(res, 400, "Invalid input", error.errors);
      }
      console.error("Update news error:", error);
      return apiError(res, 500, "Failed to update news");
    }
  });

  // Delete news
  app.delete("/api/admin/news/:id", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteNews(req.params.id);
      if (!deleted) {
        return apiError(res, 404, "News not found");
      }
      await auditLog("delete", "news", req.params.id, (req as any).adminUser?.id || "unknown", undefined, req);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete news error:", error);
      return apiError(res, 500, "Failed to delete news");
    }
  });
}
