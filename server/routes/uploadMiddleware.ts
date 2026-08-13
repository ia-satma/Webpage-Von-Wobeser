import express, { type NextFunction, type Request, type Response } from "express";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { z } from "zod";
import {
  cvQuarantineDir,
  privatePresentationDir,
  publicMediaQuarantineDir,
  securePhysicalFilename,
} from "../security/uploads";

export const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// La extensión con la que se guarda cada archivo se deriva SOLO del MIME ya validado por
// fileFilter — nunca de file.originalname (controlado por quien sube el archivo). Antes se
// usaba path.extname(file.originalname), lo que permitía subir un archivo con Content-Type
// "application/pdf" (aceptado) pero nombre "x.html": el archivo quedaba servido por
// express.static en /uploads con Content-Type text/html → XSS almacenado, alcanzable sin
// login vía el formulario público de Pasantes. Cualquier MIME no listado aquí (no debería
// pasar fileFilter) cae a ".bin" en vez de heredar una extensión peligrosa.
export const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/ogg": ".ogv",
  "video/quicktime": ".mov",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-powerpoint": ".ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
};

function safeUploadFilename(file: Express.Multer.File): string {
  const ext = MIME_TO_EXT[file.mimetype] || ".bin";
  return securePhysicalFilename(ext);
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, publicMediaQuarantineDir);
    },
    filename: (_req, file, cb) => {
      cb(null, safeUploadFilename(file));
    },
  }),
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB (permite videos del hero)
    files: 1,
    fields: 10,
    fieldSize: 10 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      // image/svg+xml removido: un SVG puede contener <script> y se sirve en /uploads (XSS).
      "application/pdf",
      // Videos (hero, etc.)
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/quicktime",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const e: any = new Error("Invalid file type");
      e.status = 400;
      cb(e);
    }
  },
});

/** Devuelve errores concretos para cargas grandes en vez de dejar que Multer
 * caiga en el manejador genérico. Esto también permite que el panel distinga
 * un límite real de tamaño de un formato inválido o una conexión interrumpida. */
export const receivePublicMediaUpload = (req: Request, res: Response, next: NextFunction): void => {
  upload.single("file")(req, res, (error: any) => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({
        error: "El archivo supera el máximo de 200 MB.",
        code: "MEDIA_FILE_TOO_LARGE",
      });
      return;
    }
    const invalidType = error?.message === "Invalid file type";
    res.status(invalidType ? 415 : 400).json({
      error: invalidType
        ? "Formato no admitido. Usa imágenes JPG, PNG, GIF o WebP; o video MP4, WebM, OGV o MOV."
        : "No se pudo recibir el archivo. Vuelve a seleccionarlo e inténtalo de nuevo.",
      code: invalidType ? "INVALID_MEDIA_TYPE" : "INVALID_MEDIA_UPLOAD",
    });
  });
};

export const receiveMediaChunk = express.raw({
  type: "application/octet-stream",
  limit: "5mb",
});

// Multer dedicado para CVs del formulario de Pasantes — límite y tipos distintos del de
// medios (10MB en vez de 200MB, solo PDF/DOC/DOCX en vez de imágenes/video). Público (sin
// login), así que el mapeo MIME→extensión de arriba es especialmente importante aquí.
export const cvUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, cvQuarantineDir);
    },
    filename: (_req, file, cb) => {
      cb(null, safeUploadFilename(file));
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB basta para un CV
    files: 1,
    fields: 10,
    fieldSize: 8 * 1024,
    parts: 12,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const e: any = new Error("Invalid file type");
      e.status = 400;
      cb(e);
    }
  },
});

// Multer para los documentos de insumo del Generador de Presentaciones (14° agente). Admin-only
// (requirePermission("agents")). Acepta por EXTENSIÓN del nombre original porque el MIME que
// reporta el navegador para .tex/.md es poco fiable (suele venir octet-stream); la extensión con
// la que se GUARDA en disco sigue derivándose del MIME validado (safeUploadFilename) — nunca del
// nombre — así que aceptar por extensión no reintroduce el XSS almacenado. Estos archivos solo
// los lee el parser del servidor; no se ejecutan.
const PRESENTATION_DOC_EXTS = new Set([".pdf", ".doc", ".docx", ".ppt", ".pptx", ".tex", ".txt", ".md"]);
const presentationDocUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, privatePresentationDir);
    },
    filename: (_req, file, cb) => {
      cb(null, safeUploadFilename(file));
    },
  }),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB por documento; el cliente los envía uno por uno
    files: 1,
    fields: 2,
    fieldSize: 4 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const baseWithoutExtension = path.basename(file.originalname || "", ext);
    const disguisedExecutable = /\.(exe|html?|js|svg|php|sh|bat|cmd|com|scr|jar)$/i.test(baseWithoutExtension);
    if (PRESENTATION_DOC_EXTS.has(ext) && !disguisedExecutable) {
      cb(null, true);
    } else {
      const e: any = new Error("Invalid file type");
      e.status = 400;
      cb(e);
    }
  },
});

export const receivePresentationDocument = (req: Request, res: Response, next: NextFunction): void => {
  presentationDocUpload.single("file")(req, res, (error: any) => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({
        error: "El documento supera el máximo seguro de 100 MB por archivo.",
        code: "PRESENTATION_FILE_TOO_LARGE",
      });
      return;
    }
    res.status(400).json({
      error: "Formato no admitido. Usa PDF, DOCX, PPTX, TEX, TXT o MD.",
      code: "INVALID_PRESENTATION_FILE",
    });
  });
};

// La biblioteca agrega ocasionalmente un query de versión para invalidar caché. Se retira antes
// de validar, pero la ruta física continúa limitada a los dos directorios públicos permitidos.
export const presentationMediaPathSchema = z.string()
  .transform((value) => value.split(/[?#]/, 1)[0])
  .refine(
    (value) => /^\/(?:uploads|generated-images)\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value),
    "Ruta de imagen no admitida",
  );
