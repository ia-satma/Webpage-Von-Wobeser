import type { Express, Request, Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { ExecutionContext } from "../agents/core/types";
import { presentationGeneratorAgent } from "../agents/specialized/PresentationGeneratorAgent";
import {
  TEXTUAL_AGENT_TYPES,
  copyPlainText,
  getAgentCopy,
  listAgentCopies,
  setAgentCopyArchived,
} from "../agents/storage/CopyHistory";
import { authMiddleware, requirePermission } from "../auth";
import { listPersistentPublicMediaPaths, persistentPublicMediaExists } from "../media/persistentMedia";
import { extractManyTexts } from "../services/documentText";
import {
  privatePresentationDir,
  removeUploadQuietly,
  scanFileForMalware,
  validatePresentationInput,
} from "../security/uploads";
import { storage } from "../storage";
import { auditLog } from "./routeUtils";
import { presentationMediaPathSchema, receivePresentationDocument } from "./uploadMiddleware";

const generatedImagesDir = path.join(process.cwd(), "public", "generated-images");
const generatedAudioDir = path.join(process.cwd(), "public", "generated-audio");
const generatedPresentationsDir = path.join(process.cwd(), "public", "generated-presentations");

const presentationAssetExists = async (
  publicPath: string | null,
  persistentPaths?: Set<string> | null,
): Promise<boolean> => {
  if (!publicPath || !/^\/generated-presentations\/[A-Za-z0-9._+-]+$/.test(publicPath)) return false;
  const localPath = path.join(generatedPresentationsDir, path.basename(publicPath));
  if (fs.existsSync(localPath) && fs.statSync(localPath).isFile()) return true;
  if (persistentPaths) return persistentPaths.has(publicPath);
  return persistentPublicMediaExists(publicPath);
};

export function registerAgentAssetHistoryRoutes(app: Express): void {
  const generatedAssetAvailable = async (
    publicPath: string,
    localRoot: string,
    persistentPaths: Set<string> | null,
  ): Promise<boolean> => {
    const localPath = path.join(localRoot, path.basename(publicPath));
    if (fs.existsSync(localPath) && fs.statSync(localPath).isFile()) return true;
    if (persistentPaths) return persistentPaths.has(publicPath);
    return persistentPublicMediaExists(publicPath);
  };

  // Historial permanente de imágenes generadas por IA.
  app.get("/api/admin/generated-images", authMiddleware, requirePermission("agents"), async (_req: Request, res: Response) => {
    try {
      const images = await storage.getGeneratedImages();
      const persistentPaths = await listPersistentPublicMediaPaths();
      res.json(await Promise.all(images.map(async (image) => ({
        ...image,
        available: await generatedAssetAvailable(image.imageUrl, generatedImagesDir, persistentPaths),
      }))));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch generated images" });
    }
  });

  app.delete("/api/admin/generated-images/:id", authMiddleware, requirePermission("agents"), (_req: Request, res: Response) => {
    res.status(405).json({ error: "Generated history is permanent", code: "HISTORY_IMMUTABLE" });
  });

  // Historial editorial privado: no hay endpoint público, creación manual ni borrado. Cada fila
  // proviene de una ejecución de agente y conserva la instantánea aunque se elimine el artículo.
  const copyHistoryQuerySchema = z.object({
    page: z.coerce.number().int().min(1).max(10_000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
    search: z.string().trim().max(160).optional(),
    agentType: z.enum(TEXTUAL_AGENT_TYPES).optional(),
    copyType: z.string().trim().max(80).optional(),
    language: z.string().trim().max(12).optional(),
    articleId: z.string().uuid().optional(),
    status: z.enum(["proposal", "applied", "draft", "recovered"]).optional(),
    archived: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    sourceJobId: z.string().uuid().optional(),
  }).strict();

  app.get("/api/admin/copies-ai", authMiddleware, requirePermission("agents"), async (req: Request, res: Response) => {
    const parsed = copyHistoryQuerySchema.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ error: "Invalid copy history filters" });
    try {
      res.json(await listAgentCopies(parsed.data));
    } catch (error) {
      console.error("Copy history list error:", error);
      res.status(500).json({ error: "Failed to load copy history" });
    }
  });

  app.get("/api/admin/copies-ai/:id", authMiddleware, requirePermission("agents"), async (req: Request, res: Response) => {
    if (!z.string().uuid().safeParse(req.params.id).success) return res.status(400).json({ error: "Invalid copy history id" });
    try {
      const copy = await getAgentCopy(req.params.id);
      if (!copy) return res.status(404).json({ error: "Copy history record not found" });
      res.json({ ...copy, plainText: copyPlainText(copy.content) });
    } catch (error) {
      console.error("Copy history detail error:", error);
      res.status(500).json({ error: "Failed to load copy history record" });
    }
  });

  app.post("/api/admin/copies-ai/:id/archive", authMiddleware, requirePermission("agents"), async (req: Request, res: Response) => {
    if (!z.string().uuid().safeParse(req.params.id).success) return res.status(400).json({ error: "Invalid copy history id" });
    const parsed = z.object({ archived: z.boolean() }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid archive request" });
    try {
      const copy = await setAgentCopyArchived(req.params.id, parsed.data.archived, req.adminUser!.id);
      if (!copy) return res.status(404).json({ error: "Copy history record not found" });
      auditLog("update", "agent_copy_history", copy.id, req.adminUser!.id, { archived: copy.archived });
      res.json({ id: copy.id, archived: copy.archived, archivedAt: copy.archivedAt });
    } catch (error) {
      console.error("Copy history archive error:", error);
      res.status(500).json({ error: "Failed to update copy history record" });
    }
  });

  // Historial permanente de audio generado por IA.
  app.get("/api/admin/generated-audio", authMiddleware, requirePermission("agents"), async (_req: Request, res: Response) => {
    try {
      const audio = await storage.getGeneratedAudio();
      const persistentPaths = await listPersistentPublicMediaPaths();
      res.json(await Promise.all(audio.map(async (item) => ({
        ...item,
        available: await generatedAssetAvailable(item.audioUrl, generatedAudioDir, persistentPaths),
      }))));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch generated audio" });
    }
  });

  app.delete("/api/admin/generated-audio/:id", authMiddleware, requirePermission("agents"), (_req: Request, res: Response) => {
    res.status(405).json({ error: "Generated history is permanent", code: "HISTORY_IMMUTABLE" });
  });

  // --- Generador de Presentaciones (14° agente) ---------------------------------------------
  // Los documentos de insumo no se exponen bajo /uploads; el identificador private:
  // solamente vuelve al servidor cuando el administrador solicita generar la presentación.
  app.post("/api/admin/presentations/upload", authMiddleware, requirePermission("agents"), receivePresentationDocument, async (req: Request, res: Response) => {
    if (!req.file) return res.status(400).json({ error: "No se recibió ningún archivo" });
    try {
      if (!await validatePresentationInput(req.file.path, req.file.originalname)) {
        await removeUploadQuietly(req.file.path);
        return res.status(400).json({ error: "El contenido del documento no coincide con un formato permitido." });
      }
      await scanFileForMalware(req.file.path);
      res.json({
        url: `private:presentations/${req.file.filename}`,
        name: path.basename(req.file.originalname).replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 180),
      });
    } catch {
      await removeUploadQuietly(req.file.path);
      res.status(500).json({ error: "No fue posible validar el documento." });
    }
  });

  // Genera la presentación: extrae el texto de los documentos subidos, estructura con IA (o cae a
  // un esquema determinista si no hay créditos), y renderiza PPTX/PDF/PNG con branding.
  app.post("/api/admin/presentations/generate", authMiddleware, requirePermission("agents"), async (req: Request, res: Response) => {
    try {
      const parsed = z.object({
        topic: z.string().trim().max(10_000).default(""),
        docs: z.array(z.object({
          url: z.string().regex(/^private:presentations\/[a-f0-9]{32}\.[a-z0-9]{1,5}$/),
          name: z.string().trim().min(1).max(180),
        }).strict()).max(20).default([]),
        slideCount: z.coerce.number().int().min(3).max(20).default(8),
        lang: z.enum(["es", "en"]).default("es"),
        template: z.enum(["vonwobeser", "minimal", "dark"]).default("vonwobeser"),
        branding: z.enum(["vonwobeser", "custom"]).default("vonwobeser"),
        customLogoUrl: presentationMediaPathSchema.nullable().optional(),
        customPrimaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
        formats: z.array(z.enum(["pptx", "pdf", "png"])).min(1).max(3).default(["pptx", "pdf", "png"]),
        visuals: z.boolean().default(true),
        illustrate: z.boolean().default(false),
        supportImages: z.array(presentationMediaPathSchema).max(30).default([]),
        webSearch: z.boolean().default(false),
      }).strict().safeParse(req.body);
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        const field = issue?.path?.join(".") || "configuración";
        return res.status(400).json({
          error: `Configuración de presentación inválida en “${field}”. Revisa ese campo e inténtalo de nuevo.`,
          code: "INVALID_PRESENTATION_CONFIG",
        });
      }
      const {
        topic,
        docs,
        slideCount,
        lang,
        template,
        branding,
        customLogoUrl,
        customPrimaryColor,
        formats,
        visuals,
        illustrate,
        supportImages,
        webSearch,
      } = parsed.data;

      let documentsText = "";
      let usedDocs: string[] = [];
      let docNotes: string[] = [];
      if (docs.length > 0) {
        const files = docs
          .map((document) => ({
            path: path.join(privatePresentationDir, path.basename(document.url)),
            originalName: document.name,
          }))
          .filter((f) => f.path && fs.existsSync(f.path));
        const extracted = await extractManyTexts(files);
        documentsText = extracted.combinedText;
        usedDocs = extracted.usedDocs;
        docNotes = extracted.notes;
      }

      if (!String(topic || "").trim() && !documentsText.trim()) {
        return res.status(400).json({ error: "Escribe un tema o sube al menos un documento con contenido de texto.", docNotes });
      }

      const context: ExecutionContext = {
        jobId: `manual-${Date.now()}`,
        agentType: "presentation_generator",
        startTime: new Date(),
        metadata: { source: "admin" },
      };

      const result = await presentationGeneratorAgent.execute(context, {
        topic,
        documentsText,
        slideCount,
        lang,
        template,
        branding,
        customLogoUrl,
        customPrimaryColor,
        formats,
        sourceDocs: usedDocs,
        visuals,
        illustrate,
        supportImages,
        webSearch,
      });

      if (!result.success) {
        return res.status(400).json({ error: result.error || "No se pudo generar la presentación.", docNotes });
      }

      res.json({ ...(result.data as Record<string, unknown>), docNotes });
    } catch (error) {
      console.error("[presentations/generate]", error);
      res.status(500).json({ error: "Falló la generación de la presentación." });
    }
  });

  app.get("/api/admin/generated-presentations", authMiddleware, requirePermission("agents"), async (_req: Request, res: Response) => {
    try {
      const presentations = await storage.getGeneratedPresentations();
      // Una sola lectura del inventario evita una petición remota por cada
      // diapositiva al abrir historiales extensos.
      const persistentPaths = await listPersistentPublicMediaPaths();
      const presentationsWithAvailability = await Promise.all(
        presentations.map(async (presentation) => {
          const pngUrls = Array.isArray(presentation.pngUrls) ? presentation.pngUrls : [];
          const [pptxAvailable, pdfAvailable, pngAvailable] = await Promise.all([
            presentationAssetExists(presentation.pptxUrl, persistentPaths),
            presentationAssetExists(presentation.pdfUrl, persistentPaths),
            Promise.all(pngUrls.map((url) => presentationAssetExists(url, persistentPaths))),
          ]);
          return {
            ...presentation,
            availability: {
              pptx: pptxAvailable,
              pdf: pdfAvailable,
              png: pngAvailable,
            },
          };
        }),
      );
      res.json(presentationsWithAvailability);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch generated presentations" });
    }
  });

  app.delete("/api/admin/generated-presentations/:id", authMiddleware, requirePermission("agents"), (_req: Request, res: Response) => {
    res.status(405).json({ error: "Generated history is permanent", code: "HISTORY_IMMUTABLE" });
  });
}
