import type { Express, Request, Response } from "express";
import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import {
  awards,
  banners,
  diversityInitiatives,
  events,
  generatedImages,
  industryGroups,
  news,
  officeImages,
  offices,
  practiceGroups,
  proBonoProjects,
  rankings,
  representativeClients,
  teamMembers,
  testimonials,
} from "@shared/schema";
import { authMiddleware, requirePermission } from "../auth";
import { db } from "../db";
import {
  assembleChunkedMediaUpload,
  ChunkedMediaUploadError,
  createChunkedMediaUpload,
  removeChunkedMediaUpload,
  storeChunkedMediaPart,
} from "../media/chunkedUpload";
import {
  canSanitizeRasterMime,
  generateResponsiveImageVariants,
  optimizeImageIfNeeded,
  sanitizeRasterImage,
} from "../media/optimizeImage";
import { generateHeroVideoVariants } from "../media/optimizeVideo";
import {
  deletePersistentMediaObjects,
  hydratePersistentPublicMedia,
  listPersistentPublicMediaPaths,
  managedMediaObjectName,
  persistPublicMediaFiles,
  persistentMediaStorageStatus,
  PersistentMediaUnavailableError,
} from "../media/persistentMedia";
import { getMirrorDir } from "../mirror/config";
import { getConfigMap, setHeroMediaConfig } from "../mirror/siteConfig";
import {
  acceptQuarantinedPublicMedia,
  inspectVideoContainer,
  publicMediaQuarantineDir,
  removeUploadQuietly,
  scanFileForMalware,
  securePhysicalFilename,
  validatePublicMediaSignature,
} from "../security/uploads";
import { storage } from "../storage";
import {
  MIME_TO_EXT,
  receiveMediaChunk,
  receivePublicMediaUpload,
  uploadsDir,
} from "./uploadMiddleware";

const generatedImagesDir = path.join(process.cwd(), "public", "generated-images");

export function registerAdminMediaRoutes(app: Express): void {
  // =============================================
  // MEDIA ITEMS CRUD
  // =============================================

  app.get("/api/admin/media/storage-status", authMiddleware, requirePermission("content"), async (_req: Request, res: Response) => {
    const status = await persistentMediaStorageStatus();
    res.status(status.required && !status.available ? 503 : 200).json(status);
  });

  // Get all media items
  app.get("/api/admin/media", authMiddleware, requirePermission("content"), async (_req: Request, res: Response) => {
    try {
      const items = await storage.getMediaItems();
      const [
        practiceRefs,
        industryRefs,
        newsRefs,
        teamRefs,
        officeImageRefs,
        officeRefs,
        testimonialRefs,
        rankingRefs,
        awardRefs,
        clientRefs,
        eventRefs,
        proBonoRefs,
        diversityRefs,
        bannerRefs,
        generatedRefs,
        config,
      ] = await Promise.all([
        db.select({ path: practiceGroups.imageUrl, label: practiceGroups.nameEs }).from(practiceGroups),
        db.select({ path: industryGroups.imageUrl, label: industryGroups.nameEs }).from(industryGroups),
        db.select({ path: news.imageUrl, label: news.titleEs }).from(news),
        db.select({ path: teamMembers.imageUrl, label: teamMembers.name }).from(teamMembers),
        db.select({ path: officeImages.imageUrl, label: officeImages.altEs }).from(officeImages),
        db.select({ path: offices.imageUrl, label: offices.nameEs }).from(offices),
        db.select({ path: testimonials.authorPhotoUrl, label: testimonials.authorName }).from(testimonials),
        db.select({ path: rankings.logoUrl, label: rankings.nameEs }).from(rankings),
        db.select({ path: awards.logoUrl, label: awards.nameEs }).from(awards),
        db.select({ path: representativeClients.logoUrl, label: representativeClients.name }).from(representativeClients),
        db.select({ path: events.imageUrl, label: events.titleEs }).from(events),
        db.select({ path: proBonoProjects.imageUrl, label: proBonoProjects.titleEs }).from(proBonoProjects),
        db.select({ path: diversityInitiatives.imageUrl, label: diversityInitiatives.titleEs }).from(diversityInitiatives),
        db.select({ path: banners.imageUrl, mobilePath: banners.imageUrlMobile, label: banners.titleEs }).from(banners),
        db.select({ path: generatedImages.imageUrl, label: generatedImages.prompt }).from(generatedImages),
        getConfigMap(),
      ]);

      // La biblioteca incluye tanto archivos subidos como recursos que ya están en uso.
      // Los recursos históricos se exponen como entradas virtuales: no se duplican ni se
      // insertan en la base, pero pueden seleccionarse desde cualquier ImageUpload.
      const reusable = new Map<string, any>(items.map((item) => [item.path, item]));
      const mimeByExtension: Record<string, string> = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".mp4": "video/mp4",
        ".webm": "video/webm",
        ".ogv": "video/ogg",
        ".ogg": "video/ogg",
        ".mov": "video/quicktime",
      };
      const addReference = (candidate: unknown, label?: unknown) => {
        if (typeof candidate !== "string" || !candidate.trim()) return;
        const mediaPath = candidate.trim();
        if (reusable.has(mediaPath)) return;
        const pathname = mediaPath.split(/[?#]/, 1)[0];
        const extension = path.extname(pathname).toLowerCase();
        const mimeType = mimeByExtension[extension];
        if (!mimeType) return;
        const filename = path.basename(pathname) || `archivo${extension}`;
        const displayLabel = typeof label === "string" && label.trim() ? label.trim() : filename;
        reusable.set(mediaPath, {
          id: `used-${crypto.createHash("sha1").update(mediaPath).digest("hex").slice(0, 16)}`,
          filename,
          originalName: displayLabel,
          path: mediaPath,
          mimeType,
          size: null,
          width: null,
          height: null,
          alt: displayLabel,
          altEs: displayLabel,
          uploadedBy: null,
          createdAt: null,
          sourceLabel: "En uso en el sitio",
        });
      };

      for (const collection of [
        practiceRefs,
        industryRefs,
        newsRefs,
        teamRefs,
        officeImageRefs,
        officeRefs,
        testimonialRefs,
        rankingRefs,
        awardRefs,
        clientRefs,
        eventRefs,
        proBonoRefs,
        diversityRefs,
        generatedRefs,
      ]) {
        for (const item of collection) addReference(item.path, item.label);
      }
      for (const item of bannerRefs) {
        addReference(item.path, item.label);
        addReference(item.mobilePath, `${item.label || "Banner"} — móvil`);
      }
      for (const [key, entry] of Object.entries(config)) {
        const label = key.replaceAll("_", " ");
        addReference(entry.value, label);
        if (entry.valueEs !== entry.value) addReference(entry.valueEs, `${label} — español`);
      }

      const persistentPaths = await listPersistentPublicMediaPaths();
      const classifyAvailability = (item: any) => {
        const cleanPath = String(item.path || "").split(/[?#]/, 1)[0];
        let available: boolean | null = null;
        let storageProvider = "Referencia externa";

        if (cleanPath.startsWith("/uploads/")) {
          const relative = cleanPath.slice("/uploads/".length);
          const local = path.resolve(uploadsDir, relative);
          const localAvailable = local.startsWith(`${path.resolve(uploadsDir)}${path.sep}`)
            && fs.existsSync(local);
          const persistent = persistentPaths?.has(cleanPath) ?? false;
          available = localAvailable || persistent;
          storageProvider = persistent
            ? "App Storage persistente"
            : localAvailable
              ? "Instancia temporal"
              : "Archivo no disponible";
        } else if (cleanPath.startsWith("/generated-images/")) {
          const relative = cleanPath.slice("/generated-images/".length);
          const local = path.resolve(generatedImagesDir, relative);
          const localAvailable = local.startsWith(`${path.resolve(generatedImagesDir)}${path.sep}`)
            && fs.existsSync(local);
          const persistent = persistentPaths?.has(cleanPath) ?? false;
          available = localAvailable || persistent;
          storageProvider = persistent
            ? "App Storage persistente"
            : localAvailable
              ? "Instancia temporal"
              : "Archivo no disponible";
        } else if (/^\/(?:images|img|templates)\//.test(cleanPath)) {
          const local = path.resolve(getMirrorDir(), cleanPath.replace(/^\/+/, ""));
          const mirrorRoot = path.resolve(getMirrorDir());
          available = local.startsWith(`${mirrorRoot}${path.sep}`) && fs.existsSync(local);
          storageProvider = available ? "Incluido en el sitio" : "Archivo no disponible";
        } else if (/^https:\/\//i.test(cleanPath)) {
          available = null;
          storageProvider = "URL externa";
        }

        return { ...item, available, storageProvider };
      };

      res.json(Array.from(reusable.values(), classifyAvailability));
    } catch (error) {
      console.error("Get media error:", error);
      res.status(500).json({ error: "Failed to fetch media" });
    }
  });

  // Finalización compartida por la carga multipart tradicional y la carga
  // fragmentada. Ambas pasan por exactamente la misma validación, cuarentena,
  // saneamiento, App Storage y registro de biblioteca.
  const completePublicMediaUpload = async (req: Request, res: Response): Promise<void> => {
    let acceptedMediaPath: string | undefined;
    let generatedVariantPaths: string[] = [];
    let persistedObjectNames: string[] = [];
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }
      if (!await validatePublicMediaSignature(req.file.path, req.file.mimetype)) {
        await removeUploadQuietly(req.file.path);
        res.status(400).json({ error: "El contenido del archivo no coincide con su formato." });
        return;
      }

      const isVideoUpload = req.file.mimetype.startsWith("video/");
      const videoValidation = isVideoUpload
        ? await inspectVideoContainer(req.file.path, { mimeType: req.file.mimetype })
        : null;
      const validatedVideoContainer = videoValidation?.valid === true;
      if (isVideoUpload && !validatedVideoContainer) {
        await removeUploadQuietly(req.file.path);
        const validatorUnavailable = videoValidation?.valid === false
          && videoValidation.reason === "validator_unavailable";
        const validationTimedOut = videoValidation?.valid === false
          && videoValidation.reason === "validation_timeout";
        const chunkedRetry = res.locals.chunkedMediaUpload === true;
        res.status(validatorUnavailable ? 503 : validationTimedOut ? 422 : 400).json(validatorUnavailable
          ? {
              error: chunkedRetry
                ? "El servidor no pudo iniciar el verificador. Se reintentará sin volver a transferir el video."
                : "El servidor no pudo iniciar el verificador. La carga cambiará automáticamente al modo fragmentado.",
              code: "VIDEO_VALIDATOR_UNAVAILABLE",
            }
          : validationTimedOut
            ? {
                error: "La validación tardó demasiado. Convierte el video a MP4 con H.264 y vuelve a intentarlo.",
                code: "VIDEO_VALIDATION_TIMEOUT",
              }
          : {
              error: "El archivo no es un video reproducible compatible. Usa MP4/H.264, WebM/VP8-VP9, OGV/Theora o MOV con una pista de video real.",
              code: "INVALID_VIDEO_CONTAINER",
            });
        return;
      }

      // Los raster compatibles se decodifican y re-codifican dentro de cuarentena.
      // Así se eliminan EXIF/chunks auxiliares y se neutralizan archivos políglota.
      let sanitizedRaster = false;
      let sanitizedSize = req.file.size;
      if (canSanitizeRasterMime(req.file.mimetype)) {
        try {
          sanitizedSize = await sanitizeRasterImage(req.file.path, req.file.mimetype);
          sanitizedRaster = true;
        } catch {
          await removeUploadQuietly(req.file.path);
          res.status(400).json({
            error: "La imagen está dañada, excede el límite de resolución o no puede procesarse.",
          });
          return;
        }
      }

      try {
        // Un maestro de video grande no debe dejar el request bloqueado un minuto
        // si ClamAV no está listo en una instancia recién iniciada. Se intenta el
        // análisis durante 20 s y, si el scanner no responde, se exige la firma
        // mágica + el contenedor reproducible que ya se validaron arriba.
        await scanFileForMalware(req.file.path, isVideoUpload ? 20_000 : 60_000);
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (message === "Malware detected") {
          await removeUploadQuietly(req.file.path);
          res.status(400).json({ error: "El archivo fue rechazado por seguridad." });
          return;
        }
        // Los raster saneados y los videos cuya firma y contenedor fueron
        // validados pueden continuar si la base de ClamAV no está disponible.
        // El archivo conserva una extensión derivada del MIME y se sirve con
        // nosniff; nunca se interpreta como HTML o script.
        const safeWithoutScanner = message === "Malware scanner unavailable"
          && (sanitizedRaster || validatedVideoContainer);
        if (!safeWithoutScanner) {
          throw error;
        }
        console.warn(`[media-upload] ClamAV no disponible; ${isVideoUpload ? "contenedor de video validado" : "raster saneado"} aceptado.`);
      }

      acceptedMediaPath = await acceptQuarantinedPublicMedia(req.file.path, uploadsDir);
      req.file.path = acceptedMediaPath;

      // Imágenes pesadas (>1MB) se redimensionan/recomprimen antes de registrar el tamaño real.
      // Video no se toca en esta ronda (requiere ffmpeg, ver server/media/optimizeVideo.ts).
      let finalSize = sanitizedSize;
      const optimizedSize = await optimizeImageIfNeeded(req.file.path, req.file.mimetype, sanitizedSize);
      if (optimizedSize != null) finalSize = optimizedSize;
      generatedVariantPaths = await generateResponsiveImageVariants(req.file.path, req.file.mimetype);

      const toPublicUploadsPath = (absolutePath: string): string => {
        const relative = path.relative(uploadsDir, absolutePath);
        if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
          throw new Error("Invalid accepted media path");
        }
        return `/uploads/${relative.split(path.sep).join("/")}`;
      };
      const publicPath = `/uploads/${req.file.filename}`;
      const persistence = await persistPublicMediaFiles([
        { absolutePath: req.file.path, publicPath },
        ...generatedVariantPaths.map((variantPath) => ({
          absolutePath: variantPath,
          publicPath: toPublicUploadsPath(variantPath),
        })),
      ]);
      persistedObjectNames = persistence.objectNames;

      const mediaItem = await storage.createMediaItem({
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: publicPath,
        mimeType: req.file.mimetype,
        size: finalSize,
        uploadedBy: req.adminUser!.id,
        alt: req.body.alt || null,
        altEs: req.body.altEs || null,
      });

      res.status(201).json({
        ...mediaItem,
        available: true,
        storageProvider: persistence.persisted ? "App Storage persistente" : "Desarrollo local",
      });
    } catch (error) {
      await deletePersistentMediaObjects(persistedObjectNames);
      await removeUploadQuietly(req.file?.path);
      await removeUploadQuietly(acceptedMediaPath);
      await Promise.all(generatedVariantPaths.map((variantPath) => removeUploadQuietly(variantPath)));
      console.error("Upload media validation failed", error instanceof Error ? error.message : "unknown");
      if (error instanceof PersistentMediaUnavailableError) {
        res.status(503).json({
          error: "App Storage no está disponible. El archivo no se guardó para evitar que se pierda al publicar.",
        });
        return;
      }
      res.status(500).json({
        error: "No se pudo completar la carga. El archivo anterior permanece sin cambios.",
        code: "MEDIA_UPLOAD_FAILED",
      });
    }
  };

  const chunkedMediaStartSchema = z.object({
    originalName: z.string().trim().min(1).max(180),
    mimeType: z.string().trim().min(1).max(100),
    size: z.number().int().positive().max(200 * 1024 * 1024),
  }).strict();
  const chunkedMediaCompleteSchema = z.object({
    token: z.string().min(40).max(2_000),
    alt: z.string().max(500).optional().default(""),
    altEs: z.string().max(500).optional().default(""),
  }).strict();
  const sendChunkedMediaError = (res: Response, error: unknown): void => {
    if (error instanceof ChunkedMediaUploadError) {
      res.status(error.status).json({ error: error.message, code: error.code });
      return;
    }
    console.error("Chunked media upload failed", error instanceof Error ? error.message : "unknown");
    res.status(500).json({
      error: "No se pudo completar la carga fragmentada. El archivo anterior permanece sin cambios.",
      code: "CHUNK_UPLOAD_FAILED",
    });
  };

  app.post("/api/admin/media/upload/start", authMiddleware, requirePermission("content"), (req: Request, res: Response) => {
    const parsed = chunkedMediaStartSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Indica un archivo compatible de hasta 200 MB.",
        code: "INVALID_CHUNK_UPLOAD_REQUEST",
      });
    }
    try {
      return res.json(createChunkedMediaUpload({
        userId: req.adminUser!.id,
        ...parsed.data,
      }));
    } catch (error) {
      sendChunkedMediaError(res, error);
    }
  });

  app.put(
    "/api/admin/media/upload/chunk",
    authMiddleware,
    requirePermission("content"),
    receiveMediaChunk,
    async (req: Request, res: Response) => {
      const token = typeof req.headers["x-upload-token"] === "string" ? req.headers["x-upload-token"] : "";
      const indexHeader = typeof req.headers["x-chunk-index"] === "string" ? req.headers["x-chunk-index"] : "";
      const checksum = typeof req.headers["x-chunk-sha256"] === "string" ? req.headers["x-chunk-sha256"] : "";
      const index = /^\d{1,2}$/.test(indexHeader) ? Number(indexHeader) : -1;
      if (!token || !Buffer.isBuffer(req.body)) {
        return res.status(400).json({ error: "El fragmento no es válido.", code: "INVALID_MEDIA_CHUNK" });
      }
      try {
        return res.json(await storeChunkedMediaPart(token, req.adminUser!.id, index, req.body, checksum));
      } catch (error) {
        sendChunkedMediaError(res, error);
      }
    },
  );

  app.post("/api/admin/media/upload/abort", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    const parsed = chunkedMediaCompleteSchema.pick({ token: true }).safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "La sesión de carga no es válida.", code: "INVALID_CHUNK_SESSION" });
    }
    const removed = await removeChunkedMediaUpload(parsed.data.token, req.adminUser!.id);
    return res.status(removed ? 200 : 503).json({
      success: removed,
      ...(!removed && {
        error: "La carga se canceló, pero App Storage no confirmó la limpieza completa.",
        code: "CHUNK_CLEANUP_INCOMPLETE",
      }),
    });
  });

  app.post("/api/admin/media/upload/complete", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    const parsed = chunkedMediaCompleteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "La sesión de carga no es válida.", code: "INVALID_CHUNK_SESSION" });
    }
    const token = parsed.data.token;
    let assembledPath = "";
    try {
      // La extensión física se deriva después del MIME firmado; nunca del nombre
      // proporcionado por el navegador.
      const provisional = securePhysicalFilename(".bin");
      assembledPath = path.join(publicMediaQuarantineDir, provisional);
      const assembled = await assembleChunkedMediaUpload(token, req.adminUser!.id, assembledPath);
      const extension = MIME_TO_EXT[assembled.mimeType];
      if (!extension) throw new ChunkedMediaUploadError("El formato no está permitido.", "INVALID_MEDIA_TYPE", 415);
      const filename = securePhysicalFilename(extension);
      const typedPath = path.join(publicMediaQuarantineDir, filename);
      await fs.promises.rename(assembledPath, typedPath);
      assembledPath = typedPath;
      req.file = {
        fieldname: "file",
        originalname: assembled.originalName,
        encoding: "7bit",
        mimetype: assembled.mimeType,
        size: assembled.size,
        destination: publicMediaQuarantineDir,
        filename,
        path: typedPath,
        buffer: Buffer.alloc(0),
      } as Express.Multer.File;
      req.body = { alt: parsed.data.alt, altEs: parsed.data.altEs };
      res.locals.chunkedMediaUpload = true;
      await completePublicMediaUpload(req, res);
    } catch (error) {
      await removeUploadQuietly(assembledPath);
      sendChunkedMediaError(res, error);
    } finally {
      // Un 503 es recuperable (por ejemplo, ffmpeg iniciando en una instancia
      // nueva). Conserva los fragmentos para que el cliente reintente solo la
      // verificación; cualquier respuesta definitiva o /abort sí los elimina.
      if (res.statusCode !== 503) {
        await removeChunkedMediaUpload(token, req.adminUser!.id);
      }
    }
  });

  app.post(
    "/api/admin/media/upload",
    authMiddleware,
    requirePermission("content"),
    receivePublicMediaUpload,
    completePublicMediaUpload,
  );

  const heroVariantSchema = z.object({
    mediaPath: z.string().trim().min(1).max(500).regex(/^\/(?:uploads|images)\/[A-Za-z0-9._/%+-]+$/),
  });

  app.post("/api/admin/media/hero-variants", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    const parsed = heroVariantSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Selecciona un video local válido de la biblioteca." });
    }
    try {
      const cleanPath = parsed.data.mediaPath.split(/[?#]/, 1)[0];
      const allowedVideo = /\.(?:mp4|webm|mov|ogv)$/i.test(cleanPath);
      if (!allowedVideo) return res.status(400).json({ error: "El archivo seleccionado no es un video compatible." });
      if (/^\/uploads\/hero\/(?:masters\/)?hero-[a-f0-9]{16}-(?:desktop|mobile)\.mp4$/i.test(cleanPath)) {
        return res.status(400).json({ error: "Selecciona el video maestro original, no una variante ya optimizada." });
      }

      const baseDirectory = cleanPath.startsWith("/uploads/") ? uploadsDir : getMirrorDir();
      const relativePath = cleanPath.startsWith("/uploads/")
        ? cleanPath.slice("/uploads/".length)
        : cleanPath.replace(/^\/+/, "");
      const sourcePath = path.resolve(baseDirectory, relativePath);
      const resolvedBase = path.resolve(baseDirectory);
      if (!sourcePath.startsWith(`${resolvedBase}${path.sep}`)) {
        return res.status(404).json({ error: "No se encontró el video seleccionado." });
      }
      if (
        !fs.existsSync(sourcePath)
        && cleanPath.startsWith("/uploads/")
        && !await hydratePersistentPublicMedia(cleanPath, sourcePath)
      ) {
        return res.status(404).json({ error: "No se encontró el video seleccionado." });
      }
      if (!fs.existsSync(sourcePath)) return res.status(404).json({ error: "No se encontró el video seleccionado." });

      const outputDirectory = path.join(uploadsDir, "hero");
      const sourceStats = await fsp.stat(sourcePath);
      const masterFingerprint = crypto
        .createHash("sha256")
        .update(`${cleanPath}:${sourceStats.size}:${sourceStats.mtimeMs}`)
        .digest("hex")
        .slice(0, 16);
      const masterExtension = path.extname(cleanPath).toLowerCase() || ".mp4";
      const masterPublicPath = `/uploads/hero/masters/hero-master-${masterFingerprint}${masterExtension}`;
      const masterAbsolutePath = path.join(outputDirectory, "masters", path.basename(masterPublicPath));
      await fsp.mkdir(path.dirname(masterAbsolutePath), { recursive: true });
      if (path.resolve(sourcePath) !== path.resolve(masterAbsolutePath)) {
        try {
          await fsp.access(masterAbsolutePath);
        } catch {
          await fsp.copyFile(sourcePath, masterAbsolutePath);
        }
      }

      const variants = await generateHeroVideoVariants(masterAbsolutePath, outputDirectory);
      await persistPublicMediaFiles([
        {
          absolutePath: masterAbsolutePath,
          publicPath: masterPublicPath,
        },
        {
          absolutePath: path.join(outputDirectory, path.basename(variants.desktopPath)),
          publicPath: variants.desktopPath,
        },
        {
          absolutePath: path.join(outputDirectory, path.basename(variants.mobilePath)),
          publicPath: variants.mobilePath,
        },
        {
          absolutePath: path.join(outputDirectory, path.basename(variants.posterPath)),
          publicPath: variants.posterPath,
        },
      ]);
      await setHeroMediaConfig(masterPublicPath, variants.desktopPath, variants.mobilePath, variants.posterPath);
      res.json({
        ok: true,
        masterPath: masterPublicPath,
        ...variants,
      });
    } catch (error) {
      if (error instanceof PersistentMediaUnavailableError) {
        return res.status(503).json({
          error: "App Storage no está disponible. El video anterior permanece publicado.",
        });
      }
      res.status(500).json({
        error: "No se pudo optimizar el video. La configuración anterior permanece activa.",
      });
    }
  });

  // Solicitud durable de retiro. Esta llamada NO elimina la fila ni el objeto;
  // un procesador idempotente posterior deberá comprobar referencias y actuar
  // sobre el nombre exacto registrado en la outbox.
  app.delete("/api/admin/media/:id", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const item = await storage.getMediaItemById(req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Media item not found" });
      }
      const request = await storage.queueMediaDeletion({
        mediaItemId: item.id,
        publicPath: item.path,
        objectName: managedMediaObjectName(item.path),
        requestedBy: req.adminUser!.id,
      });
      res.status(202).json({
        success: true,
        deletionRequest: { id: request.id, status: request.status, requestedAt: request.requestedAt },
      });
    } catch (error) {
      console.error("Queue media deletion error:", error);
      res.status(500).json({ error: "Failed to queue media deletion" });
    }
  });
}
