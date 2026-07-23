import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { seed } from "./seed";
import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import net from "node:net";
import multer from "multer";
import { optimizeImageIfNeeded } from "./media/optimizeImage";
import { sanitizeCms, sanitizeFields } from "./mirror/sanitize";
import { getConfigMap } from "./mirror/siteConfig";

// Global WebSocket clients map for pipeline progress updates
const pipelineClients: Map<string, { ws: WebSocket; userId: string }> = new Map();

export function broadcastPipelineProgress(articleId: string, data: {
  step: string;
  status: 'running' | 'completed' | 'error';
  language?: string;
  progress?: number;
  message?: string;
  data?: any;
}) {
  const payload = JSON.stringify({ articleId, ...data, timestamp: new Date().toISOString() });
  
  // Broadcast to all connected clients
  pipelineClients.forEach(({ ws }) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
}
import { 
  contactFormSchema,
  newsletterSubscribeSchema,
  adminLoginSchema,
  insertNewsSchema,
  insertTeamMemberSchema,
  insertPracticeGroupSchema,
  insertIndustryGroupSchema,
  insertEventSchema,
  insertRankingSchema,
  insertAwardSchema,
  insertRepresentativeClientSchema,
  insertTestimonialSchema,
  insertJobOpeningSchema,
  insertOfficeSchema,
  insertAllianceSchema,
  insertOfficeImageSchema,
  apiUsage,
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
import { db } from "./db";
import { sql, gte } from "drizzle-orm";
import { smartImageGenerator } from "./services/SmartImageGenerator";
import { presentationGeneratorAgent } from "./agents/specialized/PresentationGeneratorAgent";
import { extractManyTexts } from "./services/documentText";
import type { ExecutionContext } from "./agents/core/types";
import { ZodError, z } from "zod";
import { CATEGORIES as ATTORNEY_CATEGORIES } from "./mirror/renderAttorneyList";
import {
  SUPPORTED_LANGUAGES,
  translateLegalText,
  translateMultipleTexts,
  suggestTranslation,
  type LanguageCode,
} from "./openai";
import {
  hashPassword,
  rehashVerifiedPassword,
  comparePassword,
  passwordNeedsRehash,
  validateNewPassword,
  generateAdminPassword,
  generateToken,
  hashOpaqueToken,
  deriveCsrfToken,
  getSessionExpiry,
  getAbsoluteSessionExpiry,
  checkRateLimit,
  recordLoginAttempt,
  checkSharedRateLimit,
  recordSharedRateLimitAttempt,
  SESSION_COOKIE,
  CHALLENGE_COOKIE,
  authCookieOptions,
  clearAuthCookie,
  readCookie,
  resolveAdminSession,
  authMiddleware,
  requireRole,
  requirePermission,
  effectivePermissions,
  adminSessionUserPayload,
  sanitizeGrants,
} from "./auth";
import {
  consumeRecoveryCode,
  decryptTotpSecret,
  encryptTotpSecret,
  generateRecoveryCodes,
  generateTotpSecret,
  isMfaConfigured,
  totpAuthUrl,
  verifyTotp,
} from "./security/mfa";
import {
  acceptQuarantinedPublicMedia,
  acceptQuarantinedCv,
  cleanExpiredPrivatePresentationInputs,
  cvQuarantineDir,
  ensurePrivateUploadDirectories,
  privatePresentationDir,
  publicMediaQuarantineDir,
  removeUploadQuietly,
  resolvePrivateCvStoragePath,
  scanFileForMalware,
  securePhysicalFilename,
  validateCvFile,
  validatePresentationInput,
  validatePublicMediaSignature,
} from "./security/uploads";
import { escapeCsvCell } from "./security/csv";

function apiError(res: Response, status: number, message: string, details?: unknown): void {
  const body: Record<string, unknown> = { error: message };
  if (details !== undefined) body.details = details;
  res.status(status).json(body);
}

function auditLog(
  action: "create" | "update" | "delete",
  resource: string,
  resourceId: string | null,
  userId: string,
  details?: Record<string, unknown>
): void {
  const entry: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    action,
    resource,
    resourceId,
    userId,
  };
  if (details) entry.details = details;
  console.log("[AUDIT]", JSON.stringify(entry));
}

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export async function runSecurityMaintenance(): Promise<{
  sessions: number;
  loginEvents: number;
  contactSubmissions: number;
  careerApplications: number;
  presentationInputs: number;
}> {
  const sessions = await storage.cleanExpiredSessions();
  const security = await storage.cleanExpiredSecurityRecords();
  const contactSubmissions = await storage.deleteExpiredContactSubmissions();
  const expiredCareers = await storage.getExpiredCareerApplications();
  for (const application of expiredCareers) {
    const privatePath = resolvePrivateCvStoragePath(application.cvPath);
    if (privatePath) {
      await removeUploadQuietly(privatePath);
      continue;
    }
    if (application.cvPath.startsWith("/uploads/")) {
      const legacyPath = path.resolve(uploadsDir, path.basename(application.cvPath));
      if (path.dirname(legacyPath) === path.resolve(uploadsDir)) {
        await removeUploadQuietly(legacyPath);
      }
    }
  }
  const careerApplications = await storage.deleteCareerApplications(expiredCareers.map((item) => item.id));
  const presentationInputs = await cleanExpiredPrivatePresentationInputs();
  return {
    sessions,
    loginEvents: security.loginEvents,
    contactSubmissions,
    careerApplications,
    presentationInputs,
  };
}

// La extensión con la que se guarda cada archivo se deriva SOLO del MIME ya validado por
// fileFilter — nunca de file.originalname (controlado por quien sube el archivo). Antes se
// usaba path.extname(file.originalname), lo que permitía subir un archivo con Content-Type
// "application/pdf" (aceptado) pero nombre "x.html": el archivo quedaba servido por
// express.static en /uploads con Content-Type text/html → XSS almacenado, alcanzable sin
// login vía el formulario público de Pasantes. Cualquier MIME no listado aquí (no debería
// pasar fileFilter) cae a ".bin" en vez de heredar una extensión peligrosa.
const MIME_TO_EXT: Record<string, string> = {
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

// Multer dedicado para CVs del formulario de Pasantes — límite y tipos distintos del de
// medios (10MB en vez de 200MB, solo PDF/DOC/DOCX en vez de imágenes/video). Público (sin
// login), así que el mapeo MIME→extensión de arriba es especialmente importante aquí.
const cvUpload = multer({
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
    fileSize: 30 * 1024 * 1024, // 30MB
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

function generateVCard(member: any, language: "es" | "en" = "es"): string {
  const vcardText = (value: unknown) => String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
  const safeUri = (value: unknown): string | null => {
    try {
      const url = new URL(String(value ?? ""), "https://www.vonwobeser.com");
      return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
    } catch {
      return null;
    }
  };
  const title = vcardText(language === "es" ? member.titleEs : member.title);
  const role = vcardText(language === "es" ? member.roleEs : member.role);
  
  const safeName = vcardText(member.name || member.slug?.replace(/-/g, ' ') || 'Unknown');
  const nameParts = safeName.split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${safeName}`,
    `N:${lastName};${firstName};;;`,
    `ORG:Von Wobeser y Sierra, S.C.`,
    `TITLE:${title}`,
    `ROLE:${role}`,
  ];
  
  if (member.email) {
    const email = String(member.email).replace(/[\r\n]/g, "").trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) lines.push(`EMAIL;TYPE=WORK:${email}`);
  }
  
  if (member.phone) {
    const phone = String(member.phone).replace(/[^\d+().\s-]/g, "").slice(0, 40);
    if (phone) lines.push(`TEL;TYPE=WORK,VOICE:${phone}`);
  }
  
  lines.push(`ADR;TYPE=WORK:;;Torre SOMA Chapultepec Piso 18, Campos Elíseos 204;Ciudad de México;CDMX;11560;México`);
  lines.push(`URL:https://www.vonwobeser.com`);
  
  const linkedinUrl = safeUri(member.linkedinUrl);
  if (linkedinUrl) {
    lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${linkedinUrl}`);
  }
  
  const imageUrl = safeUri(member.imageUrl);
  if (imageUrl) {
    lines.push(`PHOTO;VALUE=URI:${imageUrl}`);
  }
  
  lines.push('END:VCARD');
  
  return lines.join('\r\n');
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await ensurePrivateUploadDirectories();
  if (process.env.SECURITY_READ_ONLY_SMOKE !== "true") {
    await seed();
  }

  // Todas las rutas que llaman `:id` usan claves UUID de PostgreSQL. Validarlas
  // una sola vez evita consultas innecesarias, errores 500 e inputs ambiguos.
  app.param("id", (req: Request, res: Response, next: NextFunction, value: string) => {
    if (!z.string().uuid().safeParse(value).success) {
      return res.status(400).json({ error: "Invalid identifier" });
    }
    next();
  });
  app.param("teamMemberId", (req: Request, res: Response, next: NextFunction, value: string) => {
    if (!z.string().uuid().safeParse(value).success) {
      return res.status(400).json({ error: "Invalid identifier" });
    }
    next();
  });
  app.param("articleId", (req: Request, res: Response, next: NextFunction, value: string) => {
    if (!z.string().uuid().safeParse(value).success) {
      return res.status(400).json({ error: "Invalid identifier" });
    }
    next();
  });

  // Setup WebSocket server for pipeline progress updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/pipeline' });
  
  // Heartbeat to detect stale connections
  const heartbeatInterval = setInterval(() => {
    pipelineClients.forEach(({ ws }, clientId) => {
      if (ws.readyState !== WebSocket.OPEN) {
        pipelineClients.delete(clientId);
        return;
      }
      try {
        ws.ping();
      } catch (error) {
        console.error('[WebSocket] Heartbeat ping failed for client:', clientId, error);
        pipelineClients.delete(clientId);
      }
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });
  
  wss.on('connection', async (ws, req) => {
    try {
      const origin = req.headers.origin;
      const host = req.headers.host;
      if (!origin || !host || new URL(origin).host !== host) {
        ws.close(1008, "Origin not allowed");
        return;
      }
      const resolved = await resolveAdminSession(req as unknown as Request);
      if (!resolved) {
        ws.close(1008, "Authentication required");
        return;
      }
      if ((resolved.user.role === "super_admin" || resolved.user.role === "admin") && !resolved.session.mfaVerified) {
        ws.close(1008, "MFA required");
        return;
      }
      const currentConnections = Array.from(pipelineClients.values())
        .filter((client) => client.userId === resolved.user.id).length;
      if (currentConnections >= 3) {
        ws.close(1008, "Connection limit reached");
        return;
      }

      const clientId = crypto.randomBytes(8).toString('hex');
      pipelineClients.set(clientId, { ws, userId: resolved.user.id });
      console.log(`[WebSocket] Pipeline client connected: ${clientId}`);

      ws.on('close', () => {
        pipelineClients.delete(clientId);
        console.log(`[WebSocket] Pipeline client disconnected: ${clientId}`);
      });

      ws.on('error', () => {
        console.error(`[WebSocket] Client error ${clientId}`);
        pipelineClients.delete(clientId);
      });

      ws.on('pong', () => {
        // Client is alive, nothing to do
      });

      ws.send(JSON.stringify({ type: 'connected', clientId }));
    } catch {
      ws.close(1011, "Connection rejected");
    }
  });

  // Serve partner photos from attached_assets/partner_photos
  app.use('/partner_photos', express.static(path.join(process.cwd(), 'attached_assets', 'partner_photos'), {
    maxAge: '7d',
    immutable: true,
  }));
  
  // Serve associate photos from attached_assets/associate_photos
  app.use('/associate_photos', express.static(path.join(process.cwd(), 'attached_assets', 'associate_photos'), {
    maxAge: '7d',
    immutable: true,
  }));
  
  // Serve Of Counsel photos from attached_assets/of_counsel_photos
  app.use('/of_counsel_photos', express.static(path.join(process.cwd(), 'attached_assets', 'of_counsel_photos'), {
    maxAge: '7d',
    immutable: true,
  }));

  // Serve AI-generated images with Von Wobeser branding
  const generatedImagesDir = path.join(process.cwd(), 'public', 'generated-images');
  if (!fs.existsSync(generatedImagesDir)) {
    fs.mkdirSync(generatedImagesDir, { recursive: true });
  }

  // Explicit route handler — belt-and-suspenders vs SPA catch-all
  app.get('/generated-images/:filename', (req, res) => {
    const resolved = path.resolve(generatedImagesDir, req.params.filename);
    // Contención: el archivo resuelto DEBE quedar dentro del directorio (anti path-traversal).
    if (resolved !== path.resolve(generatedImagesDir) && !resolved.startsWith(path.resolve(generatedImagesDir) + path.sep)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
      // ?download=1 fuerza la descarga a nivel HTTP (los estáticos se sirven inline; el atributo
      // download del <a> no basta cross-origin). filename saneado con basename (sin ruta).
      if (req.query.download !== undefined) {
        res.setHeader('Content-Disposition', `attachment; filename="${path.basename(resolved)}"`);
      }
      return res.sendFile(resolved);
    }
    res.status(404).json({ error: 'Image not found' });
  });

  app.use('/generated-images', express.static(generatedImagesDir, {
    maxAge: '365d',
    immutable: true,
  }));

  // Serve AI-generated audio (VoiceAgent / VoiceGenerator, TTS de OpenAI)
  const generatedAudioDir = path.join(process.cwd(), 'public', 'generated-audio');
  if (!fs.existsSync(generatedAudioDir)) {
    fs.mkdirSync(generatedAudioDir, { recursive: true });
  }

  app.get('/generated-audio/:filename', (req, res) => {
    const resolved = path.resolve(generatedAudioDir, req.params.filename);
    if (resolved !== path.resolve(generatedAudioDir) && !resolved.startsWith(path.resolve(generatedAudioDir) + path.sep)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
      if (req.query.download !== undefined) {
        res.setHeader('Content-Disposition', `attachment; filename="${path.basename(resolved)}"`);
      }
      return res.sendFile(resolved);
    }
    res.status(404).json({ error: 'Audio not found' });
  });

  app.use('/generated-audio', express.static(generatedAudioDir, {
    maxAge: '365d',
    immutable: true,
  }));

  // Serve AI-generated presentations (PresentationGenerator / presentation_generator agent):
  // .pptx, .pdf y las .png por diapositiva. Mismo patrón anti path-traversal que audio/imágenes.
  const generatedPresentationsDir = path.join(process.cwd(), 'public', 'generated-presentations');
  if (!fs.existsSync(generatedPresentationsDir)) {
    fs.mkdirSync(generatedPresentationsDir, { recursive: true });
  }

  app.get('/generated-presentations/:filename', (req, res) => {
    const resolved = path.resolve(generatedPresentationsDir, req.params.filename);
    if (resolved !== path.resolve(generatedPresentationsDir) && !resolved.startsWith(path.resolve(generatedPresentationsDir) + path.sep)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
      if (req.query.download !== undefined) {
        res.setHeader('Content-Disposition', `attachment; filename="${path.basename(resolved)}"`);
      }
      return res.sendFile(resolved);
    }
    res.status(404).json({ error: 'Presentation not found' });
  });

  app.use('/generated-presentations', express.static(generatedPresentationsDir, {
    maxAge: '365d',
    immutable: true,
  }));

  // Geolocation endpoint for automatic language detection
  const COUNTRY_TO_LANGUAGE: Record<string, string> = {
    // Spanish-speaking countries.
    // BR→es is a deliberate fallback: Portuguese ("pt") is not yet a supported UI language.
    // When Portuguese translations are added, remap BR to "pt".
    MX: "es", ES: "es", AR: "es", CO: "es", PE: "es", VE: "es", CL: "es", EC: "es",
    GT: "es", CU: "es", BO: "es", DO: "es", HN: "es", PY: "es", SV: "es", NI: "es",
    CR: "es", PA: "es", UY: "es", PR: "es", BR: "es",
    // German-speaking countries
    DE: "de", AT: "de", CH: "de", LI: "de",
    // Chinese-speaking regions
    CN: "zh", TW: "zh", HK: "zh",
    // Korean
    KR: "ko",
    // Japanese
    JP: "ja",
    // Arabic-speaking countries
    SA: "ar", AE: "ar", EG: "ar", IQ: "ar", MA: "ar", DZ: "ar", SD: "ar", SY: "ar",
    TN: "ar", YE: "ar", JO: "ar", LY: "ar", LB: "ar", OM: "ar", KW: "ar", QA: "ar", BH: "ar",
    // Russian-speaking countries
    RU: "ru", BY: "ru", KZ: "ru", KG: "ru",
    // French-speaking countries
    FR: "fr", BE: "fr", MC: "fr", LU: "fr", SN: "fr", CI: "fr", ML: "fr",
    // Italian-speaking countries
    IT: "it", SM: "it", VA: "it",
    // English-speaking countries (CA corrected from fr → en)
    US: "en", GB: "en", AU: "en", NZ: "en", IE: "en", ZA: "en", NG: "en", GH: "en", KE: "en",
    CA: "en", IN: "en", PH: "en", SG: "en", MY: "en",
    PT: "en", // PT→en fallback: "pt" is not yet a supported UI language; remap when Portuguese translations are added
  };

  // In-memory cache for geolocation results (TTL: 1 hour)
  const geoCache = new Map<string, { language: string; country: string; timestamp: number }>();
  const GEO_CACHE_TTL = 60 * 60 * 1000;

  function parseAcceptLanguage(header: string | undefined): string | null {
    if (!header) return null;
    const supported = ["es", "en", "de", "zh", "ko", "ja", "ar", "ru", "fr", "it"];
    const languages = header.split(",").map(part => {
      const [lang, q] = part.trim().split(";q=");
      return { lang: lang.split("-")[0].toLowerCase(), q: q ? parseFloat(q) : 1.0 };
    }).sort((a, b) => b.q - a.q);
    for (const { lang } of languages) {
      if (supported.includes(lang)) return lang;
    }
    return null;
  }

  function isPrivateIp(ip: string): boolean {
    // Normalize IPv6-mapped IPv4 addresses (e.g. ::ffff:127.0.0.1 → 127.0.0.1)
    const normalized = ip.startsWith("::ffff:") ? ip.slice(7) : ip;
    return (
      normalized === "::1" ||
      normalized === "127.0.0.1" ||
      normalized.startsWith("192.168.") ||
      normalized.startsWith("10.") ||
      normalized.startsWith("172.16.") || normalized.startsWith("172.17.") || normalized.startsWith("172.18.") ||
      normalized.startsWith("172.19.") || normalized.startsWith("172.20.") || normalized.startsWith("172.21.") ||
      normalized.startsWith("172.22.") || normalized.startsWith("172.23.") || normalized.startsWith("172.24.") ||
      normalized.startsWith("172.25.") || normalized.startsWith("172.26.") || normalized.startsWith("172.27.") ||
      normalized.startsWith("172.28.") || normalized.startsWith("172.29.") || normalized.startsWith("172.30.") ||
      normalized.startsWith("172.31.") ||
      normalized.startsWith("fe80:") || // IPv6 link-local
      normalized === "::1"              // IPv6 loopback (explicit for normalized form)
    );
  }

  app.get("/api/detect-language", async (req, res) => {
    try {
      const forwardedFor = req.headers["x-forwarded-for"];
      const clientIp = forwardedFor
        ? (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(",")[0].trim())
        : req.socket.remoteAddress || req.ip;
      const normalizedClientIp = String(clientIp || "").replace(/^::ffff:/, "");

      // Skip geolocation for localhost/private IPs — use Accept-Language then English
      if (!net.isIP(normalizedClientIp) || isPrivateIp(normalizedClientIp)) {
        const fromHeader = parseAcceptLanguage(req.headers["accept-language"]);
        return res.json({ language: fromHeader || "en", country: null, source: fromHeader ? "accept-language" : "fallback" });
      }

      // Check cache first
      const cached = geoCache.get(normalizedClientIp);
      if (cached && Date.now() - cached.timestamp < GEO_CACHE_TTL) {
        return res.json({ language: cached.language, country: cached.country, source: "cache" });
      }

      // HTTPS geolocation via ipapi.co (free tier, no key required)
      const geoResponse = await fetch(`https://ipapi.co/${encodeURIComponent(normalizedClientIp)}/json/`, {
        signal: AbortSignal.timeout(3000),
      });

      if (!geoResponse.ok) {
        const fromHeader = parseAcceptLanguage(req.headers["accept-language"]);
        return res.json({ language: fromHeader || "en", country: null, source: fromHeader ? "accept-language" : "fallback" });
      }

      const geoData = await geoResponse.json() as { country_code?: string; error?: boolean };

      if (geoData.error || !geoData.country_code) {
        const fromHeader = parseAcceptLanguage(req.headers["accept-language"]);
        return res.json({ language: fromHeader || "en", country: null, source: fromHeader ? "accept-language" : "fallback" });
      }

      const countryCode = geoData.country_code.toUpperCase();
      const mapped = COUNTRY_TO_LANGUAGE[countryCode];
      if (!mapped) {
        // Unknown country — fall back to Accept-Language then English
        const fromHeader = parseAcceptLanguage(req.headers["accept-language"]);
        return res.json({ language: fromHeader || "en", country: countryCode, source: fromHeader ? "accept-language" : "fallback" });
      }

      geoCache.set(normalizedClientIp, { language: mapped, country: countryCode, timestamp: Date.now() });

      res.json({ language: mapped, country: countryCode, source: "geolocation" });
    } catch (error) {
      console.error("Language detection error:", error);
      const fromHeader = parseAcceptLanguage(req.headers["accept-language"]);
      res.json({ language: fromHeader || "en", country: null, source: fromHeader ? "accept-language" : "error" });
    }
  });

  app.get("/api/news", async (_req, res) => {
    try {
      const allNews = await storage.getNews();
      const now = new Date();
      const news = allNews.filter(n => n.published === true && (!n.publishAt || new Date(n.publishAt) <= now));
      res.json(news);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });

  app.get("/api/news/published", async (_req, res) => {
    try {
      const allNews = await storage.getNews();
      const now = new Date();
      const news = allNews.filter(n => n.published && (!n.publishAt || new Date(n.publishAt) <= now));
      res.set("Cache-Control", "public, max-age=60");
      res.json(news);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch published news" });
    }
  });

  // Público (sin authMiddleware): un borrador (published=false) o programado a futuro
  // (publishAt) no debe ser alcanzable solo conociendo su slug/id.
  const isNewsPubliclyVisible = (n: { published?: boolean | null; publishAt?: Date | string | null }): boolean =>
    n.published === true && (!n.publishAt || new Date(n.publishAt) <= new Date());

  app.get("/api/news/:idOrSlug", async (req, res) => {
    try {
      const param = req.params.idOrSlug;
      let news = await storage.getNewsBySlug(param);
      if (!news) {
        news = await storage.getNewsById(param);
      }
      if (!news || !isNewsPubliclyVisible(news)) {
        return res.status(404).json({ error: "News not found" });
      }
      res.json(news);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });

  // Get all team members (authors) related to a news article by slug
  app.get("/api/news/:slug/authors", async (req, res) => {
    try {
      const slug = req.params.slug;
      const newsItem = await storage.getNewsBySlug(slug);
      if (!newsItem || !isNewsPubliclyVisible(newsItem)) {
        return res.status(404).json({ error: "News not found" });
      }
      const teamMembersList = await storage.getTeamMembersByNewsId(newsItem.id);
      res.json(teamMembersList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch authors for news" });
    }
  });

  app.get("/api/office-images", async (_req, res) => {
    try {
      const images = await storage.getOfficeImages();
      res.json(images);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch images" });
    }
  });

  app.post("/api/admin/office-images", authMiddleware, requirePermission("config"), async (req: Request, res: Response) => {
    try {
      const parsed = insertOfficeImageSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      const image = await storage.createOfficeImage(parsed.data);
      res.status(201).json(image);
    } catch (error) {
      res.status(500).json({ error: "Failed to create office image" });
    }
  });

  app.patch("/api/admin/office-images/:id", authMiddleware, requirePermission("config"), async (req: Request, res: Response) => {
    try {
      const patchSchema = insertOfficeImageSchema.pick({ imageUrl: true, alt: true, altEs: true, order: true }).partial();
      const parsed = patchSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      const updated = await storage.updateOfficeImage(req.params.id, parsed.data);
      if (!updated) return res.status(404).json({ error: "Image not found" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update office image" });
    }
  });

  app.delete("/api/admin/office-images/:id", authMiddleware, requirePermission("config"), async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteOfficeImage(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Image not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete office image" });
    }
  });

  // Historial de imágenes generadas por IA (ImageSuggestionAgent) — para reutilizarlas después
  // sin volver a gastar créditos de Cloudflare/Gemini. Solo lectura + borrado; se crean desde
  // SmartImageGenerator, no desde el panel.
  app.get("/api/admin/generated-images", authMiddleware, requirePermission("agents"), async (_req: Request, res: Response) => {
    try {
      const images = await storage.getGeneratedImages();
      res.json(images);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch generated images" });
    }
  });

  app.delete("/api/admin/generated-images/:id", authMiddleware, requirePermission("agents"), async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteGeneratedImage(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Image not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete generated image" });
    }
  });

  // Historial de audio generado por IA (VoiceAgent / VoiceGenerator, TTS de OpenAI) — boletín,
  // redes y alertas legales convertidos a voz. Solo lectura + borrado; se crean desde
  // VoiceGenerator, no desde el panel.
  app.get("/api/admin/generated-audio", authMiddleware, requirePermission("agents"), async (_req: Request, res: Response) => {
    try {
      const audio = await storage.getGeneratedAudio();
      res.json(audio);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch generated audio" });
    }
  });

  app.delete("/api/admin/generated-audio/:id", authMiddleware, requirePermission("agents"), async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteGeneratedAudio(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Audio not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete generated audio" });
    }
  });

  // --- Generador de Presentaciones (14° agente) ---------------------------------------------
  // Los documentos de insumo no se exponen bajo /uploads; el identificador private:
  // solamente vuelve al servidor cuando el administrador solicita generar la presentación.
  app.post("/api/admin/presentations/upload", authMiddleware, requirePermission("agents"), presentationDocUpload.single("file"), async (req: Request, res: Response) => {
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
        topic: z.string().trim().max(2_000).default(""),
        docs: z.array(z.object({
          url: z.string().regex(/^private:presentations\/[a-f0-9]{32}\.[a-z0-9]{1,5}$/),
          name: z.string().trim().min(1).max(180),
        }).strict()).max(10).default([]),
        slideCount: z.coerce.number().int().min(3).max(25).default(8),
        lang: z.enum(["es", "en"]).default("es"),
        template: z.enum(["vonwobeser", "minimal", "dark"]).default("vonwobeser"),
        branding: z.enum(["vonwobeser", "custom"]).default("vonwobeser"),
        customLogoUrl: z.string().regex(/^\/(?:uploads|generated-images)\/[A-Za-z0-9._-]+$/).nullable().optional(),
        customPrimaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
        formats: z.array(z.enum(["pptx", "pdf", "png"])).min(1).max(3).default(["pptx", "pdf", "png"]),
        visuals: z.boolean().default(true),
        illustrate: z.boolean().default(false),
        supportImages: z.array(z.string().regex(/^\/(?:uploads|generated-images)\/[A-Za-z0-9._-]+$/)).max(25).default([]),
        webSearch: z.boolean().default(false),
      }).strict().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Configuración de presentación inválida." });
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
      res.json(presentations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch generated presentations" });
    }
  });

  app.delete("/api/admin/generated-presentations/:id", authMiddleware, requirePermission("agents"), async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteGeneratedPresentation(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Presentation not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete generated presentation" });
    }
  });

  app.get("/api/site-content", (_req, res) => {
    try {
      const content = storage.getSiteContent();
      res.json(content);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch site content" });
    }
  });

  app.get("/api/stats", (_req, res) => {
    try {
      const stats = storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Público (sin authMiddleware): un registro marcado published=false (borrador, perfil
  // dado de baja, etc.) no debe ser alcanzable vía la API solo conociendo su id/slug, aunque
  // el espejo público sí lo filtre correctamente al renderizar HTML. Mismo criterio que
  // isNewsPubliclyVisible más abajo — published=true explícito, no basta con "no false".
  const isPubliclyVisible = (e: { published?: boolean | null }): boolean => e.published === true;

  app.get("/api/practice-groups", async (_req, res) => {
    try {
      const groups = (await storage.getPracticeGroups()).filter((group) => isPubliclyVisible(group) && group.slug !== "german-desk");
      res.set("Cache-Control", "public, max-age=60");
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch practice groups" });
    }
  });

  app.get("/api/practice-groups/:idOrSlug", async (req, res) => {
    try {
      const param = req.params.idOrSlug;
      let group = await storage.getPracticeGroupBySlug(param);
      if (!group) {
        group = await storage.getPracticeGroupById(param);
      }
      if (!group || !isPubliclyVisible(group) || group.slug === "german-desk") {
        return res.status(404).json({ error: "Practice group not found" });
      }
      res.json(group);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch practice group" });
    }
  });

  app.get("/api/industry-groups", async (_req, res) => {
    try {
      const groups = (await storage.getIndustryGroups()).filter(isPubliclyVisible);
      res.set("Cache-Control", "public, max-age=60");
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch industry groups" });
    }
  });

  app.get("/api/industry-groups/:idOrSlug", async (req, res) => {
    try {
      const param = req.params.idOrSlug;
      let group = await storage.getIndustryGroupBySlug(param);
      if (!group) {
        group = await storage.getIndustryGroupById(param);
      }
      if (!group || !isPubliclyVisible(group)) {
        return res.status(404).json({ error: "Industry group not found" });
      }
      res.json(group);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch industry group" });
    }
  });

  app.get("/api/team", async (_req, res) => {
    try {
      const members = (await storage.getTeamMembers()).filter(isPubliclyVisible);
      res.set("Cache-Control", "public, max-age=60");
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch team members" });
    }
  });

  app.get("/api/team/partners", async (_req, res) => {
    try {
      const partners = (await storage.getPartners()).filter(isPubliclyVisible);
      res.set("Cache-Control", "public, max-age=60");
      res.json(partners);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch partners" });
    }
  });

  // Búsqueda de abogados: ?q=nombre&position=partners|of-counsel|counsel|associates&practice=slug
  app.get("/api/team/search", async (req, res) => {
    try {
      const parsed = z.object({
        q: z.string().trim().max(160).optional(),
        position: z.enum(["partners", "of-counsel", "counsel", "associates"]).optional(),
        practice: z.string().trim().regex(/^[a-z0-9-]{1,160}$/).optional(),
      }).safeParse(req.query);
      if (!parsed.success) return res.status(400).json({ error: "Invalid search parameters" });
      const { q, position, practice: practiceSlug } = parsed.data;

      const title = position && ATTORNEY_CATEGORIES[position] ? ATTORNEY_CATEGORIES[position].title : undefined;
      let practiceGroupId: string | undefined;
      if (practiceSlug) {
        const group = await storage.getPracticeGroupBySlug(practiceSlug);
        practiceGroupId = group?.id;
        if (!group) return res.json([]); // práctica inexistente: sin resultados
      }

      const members = await storage.searchTeamMembers({ q, title, practiceGroupId });
      res.set("Cache-Control", "public, max-age=60");
      res.json(members);
    } catch (error) {
      console.error("Team search error:", error);
      res.status(500).json({ error: "Failed to search team members" });
    }
  });

  app.get("/api/team/:idOrSlug", async (req, res) => {
    try {
      const param = req.params.idOrSlug;
      let member = await storage.getTeamMemberBySlug(param);
      if (!member) {
        member = await storage.getTeamMemberById(param);
      }
      if (!member || !isPubliclyVisible(member)) {
        return res.status(404).json({ error: "Team member not found" });
      }
      res.json(member);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch team member" });
    }
  });

  app.get("/api/team/:idOrSlug/vcard", async (req, res) => {
    try {
      const param = req.params.idOrSlug;
      const langParam = req.query.lang as string;
      const language: "es" | "en" = langParam === "en" ? "en" : "es";

      let member = await storage.getTeamMemberBySlug(param);
      if (!member) {
        member = await storage.getTeamMemberById(param);
      }
      if (!member || !isPubliclyVisible(member)) {
        return res.status(404).json({ error: "Team member not found" });
      }

      const vcard = generateVCard(member, language);
      const filename = member.slug.replace(/[^a-z0-9-]/g, '') + '.vcf';
      
      res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cache-Control", "no-store");
      res.send(vcard);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate vCard" });
    }
  });

  // Get all news articles related to a team member by slug
  app.get("/api/team/:slug/news", async (req, res) => {
    try {
      const slug = req.params.slug;
      const member = await storage.getTeamMemberBySlug(slug);
      if (!member || !isPubliclyVisible(member)) {
        return res.status(404).json({ error: "Team member not found" });
      }
      const newsList = (await storage.getNewsByTeamMemberId(member.id)).filter(isNewsPubliclyVisible);
      res.json(newsList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch news for team member" });
    }
  });

  // Rate-limit para los 2 formularios PÚBLICOS sin login (contacto y pasantes) — antes no
  // tenían ningún límite de tasa, a diferencia del login. 10 envíos / 15 min por IP basta para
  // uso legítimo (un visitante no manda 10 formularios en 15 min) y frena spam/abuso masivo.
  const PUBLIC_FORM_POLICY = {
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000,
    blockDurationMs: 15 * 60 * 1000,
  };
  const publicFormLimiter = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const identifier = req.ip || req.socket.remoteAddress || "unknown";
      const status = await checkSharedRateLimit("public-form", identifier, PUBLIC_FORM_POLICY);
      if (!status.allowed) {
        res.setHeader("Retry-After", String(status.retryAfter || 60));
        return res.status(429).json({ error: "Demasiados envíos, intenta de nuevo más tarde." });
      }
      await recordSharedRateLimitAttempt("public-form", identifier, PUBLIC_FORM_POLICY);
      next();
    } catch (error) {
      console.error("Public form rate limit error:", error);
      res.status(503).json({ error: "No fue posible procesar el envío en este momento." });
    }
  };

  app.post("/api/contact", publicFormLimiter, async (req, res) => {
    try {
      const validationResult = contactFormSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validationResult.error.errors
        });
      }

      const contactData = validationResult.data;

      const sanitize = (str: string) => str.replace(/<[^>]*>/g, '').trim();

      const sanitizedData = {
        fullName: sanitize(contactData.fullName),
        email: contactData.email.trim().toLowerCase(),
        phone: contactData.phone ? sanitize(contactData.phone) : undefined,
        company: contactData.company ? sanitize(contactData.company) : undefined,
        practiceArea: contactData.practiceArea ? sanitize(contactData.practiceArea) : undefined,
        message: sanitize(contactData.message),
        ipAddress: (() => {
          const fwd = req.headers["x-forwarded-for"];
          const raw = Array.isArray(fwd) ? fwd[0] : fwd;
          return raw?.split(",")[0]?.trim() || req.ip || null;
        })(),
      };

      const submission = await storage.createContactSubmission(sanitizedData);

      console.log(`[Contact] New submission saved with id ${submission.id}`);

      res.json({ success: true, message: "Contact form submitted successfully" });
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(500).json({ error: "Failed to process contact form" });
    }
  });

  // Newsletter público: el resultado es intencionalmente genérico. Así no se
  // revela si un correo ya estaba registrado y se permite reactivar una baja.
  app.post("/api/newsletter/subscribe", publicFormLimiter, async (req, res) => {
    try {
      const validation = newsletterSubscribeSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Validation failed", details: validation.error.errors });
      }

      const sanitize = (value: string) => value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
      const data = validation.data;
      const email = data.email.trim().toLowerCase();
      const consentedAt = new Date();
      const existing = await storage.getNewsletterSubscriberByEmail(email);

      if (!existing) {
        await storage.createNewsletterSubscriber({
          name: sanitize(data.name),
          email,
          company: sanitize(data.company),
          preferredLanguage: data.language === "en" ? "en" : "es",
          isVerified: false,
          isActive: true,
          consentedAt,
          source: "home",
          unsubscribedAt: null,
        });
      } else if (!existing.isActive) {
        await storage.updateNewsletterSubscriber(existing.id, {
          name: sanitize(data.name),
          company: sanitize(data.company),
          preferredLanguage: data.language === "en" ? "en" : "es",
          isActive: true,
          consentedAt,
          source: "home",
          unsubscribedAt: null,
        });
      }

      res.json({ success: true, message: "Subscription received" });
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      res.status(500).json({ error: "Failed to process subscription" });
    }
  });

  // Formulario de "Pasantes" — antes era HTML de Joomla con action="" (no llegaba a
  // ningún lado). Los campos del multipart (name, l_name, mail, tel, comment, accept)
  // vienen tal cual del HTML original capturado; se mapean a las columnas de career_applications.
  app.post("/api/career-applications", publicFormLimiter, cvUpload.single("uploaded_file"), async (req, res) => {
    let acceptedCvPath: string | undefined;
    try {
      const bodySchema = z.object({
        name: z.string().trim().min(1).max(120),
        l_name: z.string().trim().min(1).max(120),
        mail: z.string().trim().email().max(254),
        tel: z.string().trim().max(32).optional(),
        comment: z.string().trim().max(2_000).optional(),
        accept: z.string().min(1),
      }).strict();
      const validationResult = bodySchema.safeParse(req.body);
      if (!validationResult.success) {
        await removeUploadQuietly(req.file?.path);
        return res.status(400).json({ error: "Revisa los campos obligatorios y el Aviso de Privacidad." });
      }
      if (!req.file) {
        return res.status(400).json({ error: "Adjunta tu CV (PDF, DOC o DOCX)." });
      }
      if (!await validateCvFile(req.file.path, req.file.mimetype)) {
        await removeUploadQuietly(req.file.path);
        return res.status(400).json({ error: "El contenido del archivo no corresponde a un PDF, DOC o DOCX válido." });
      }
      await scanFileForMalware(req.file.path);
      const acceptedCv = await acceptQuarantinedCv(req.file.path, req.file.mimetype);
      acceptedCvPath = acceptedCv.absolutePath;

      const data = validationResult.data;
      const sanitize = (str: string) => str.replace(/<[^>]*>/g, "").trim();
      const safeOriginalName = path.basename(req.file.originalname)
        .replace(/[\u0000-\u001f\u007f]/g, "")
        .slice(0, 180);

      const application = await storage.createCareerApplication({
        firstName: sanitize(data.name),
        lastName: sanitize(data.l_name),
        email: data.mail.trim().toLowerCase(),
        phone: data.tel ? sanitize(data.tel) : undefined,
        address: data.comment ? sanitize(data.comment) : undefined,
        cvPath: acceptedCv.storagePath,
        cvOriginalName: safeOriginalName,
        acceptedPrivacy: true,
        ipAddress: (() => {
          const fwd = req.headers["x-forwarded-for"];
          const raw = Array.isArray(fwd) ? fwd[0] : fwd;
          return raw?.split(",")[0]?.trim() || req.ip || null;
        })(),
      });

      console.log(`[CareerApplications] Submission saved with id ${application.id}`);

      res.json({ success: true, message: "Application submitted successfully" });
    } catch (error) {
      await removeUploadQuietly(req.file?.path);
      await removeUploadQuietly(acceptedCvPath);
      console.error("Career application processing failed");
      res.status(500).json({ error: "No fue posible procesar la solicitud." });
    }
  });

  app.get("/api/representative-matters", async (_req, res) => {
    try {
      const matters = await storage.getRepresentativeMatters();
      res.json(matters);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch representative matters" });
    }
  });

  app.get("/api/practice-groups/:slug/representative-matters", async (req, res) => {
    try {
      const { slug } = req.params;
      if (slug === "german-desk") return res.status(410).json({ error: "Practice group retired" });
      const allMatters = await storage.getRepresentativeMatters();
      const filtered = allMatters.filter(m => m.practiceAreaSlug === slug);
      res.json(filtered);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch representative matters" });
    }
  });

  // Events API routes
  app.get("/api/events", async (_req, res) => {
    try {
      const eventsList = await storage.getEvents();
      res.json(eventsList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/events/upcoming", async (req, res) => {
    try {
      const parsed = z.coerce.number().int().min(1).max(50).default(4).safeParse(req.query.limit);
      if (!parsed.success) return res.status(400).json({ error: "Invalid limit" });
      const limit = parsed.data;
      const eventsList = await storage.getUpcomingEvents(limit);
      res.json(eventsList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch upcoming events" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEventById(req.params.id);
      if (!event || !isPubliclyVisible(event)) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  app.get("/api/search", async (req, res) => {
    try {
      const parsed = z.string().trim().max(200).safeParse(req.query.q || "");
      if (!parsed.success) return res.status(400).json({ error: "Invalid search" });
      const query = parsed.data.toLowerCase();
      if (!query || query.length < 2) {
        return res.json({ team: [], practiceGroups: [], industryGroups: [], news: [] });
      }
      
      // Noticias vía SQL acotado (ILIKE+LIMIT); el resto son tablas pequeñas. Filtradas a
      // published=true antes de buscar — este endpoint es público, sin authMiddleware.
      const [teamRaw, practiceGroupsRaw, industryGroupsRaw, filteredNews] = await Promise.all([
        storage.getTeamMembers(),
        storage.getPracticeGroups(),
        storage.getIndustryGroups(),
        storage.searchNews(query, 5),
      ]);
      const team = teamRaw.filter(isPubliclyVisible);
      const practiceGroups = practiceGroupsRaw.filter(isPubliclyVisible);
      const industryGroups = industryGroupsRaw.filter(isPubliclyVisible);

      const filteredTeam = team.filter(m =>
        m.name.toLowerCase().includes(query) ||
        m.title.toLowerCase().includes(query) ||
        m.titleEs.toLowerCase().includes(query) ||
        m.role.toLowerCase().includes(query) ||
        m.roleEs.toLowerCase().includes(query) ||
        (m.bio && m.bio.toLowerCase().includes(query)) ||
        (m.bioEs && m.bioEs.toLowerCase().includes(query))
      ).slice(0, 10);
      
      const filteredPractice = practiceGroups.filter(g =>
        g.name.toLowerCase().includes(query) ||
        g.nameEs.toLowerCase().includes(query) ||
        g.description.toLowerCase().includes(query) ||
        g.descriptionEs.toLowerCase().includes(query)
      ).slice(0, 5);
      
      const filteredIndustry = industryGroups.filter(g =>
        g.name.toLowerCase().includes(query) ||
        g.nameEs.toLowerCase().includes(query) ||
        g.description.toLowerCase().includes(query) ||
        g.descriptionEs.toLowerCase().includes(query)
      ).slice(0, 5);
      
      res.json({
        team: filteredTeam,
        practiceGroups: filteredPractice,
        industryGroups: filteredIndustry,
        news: filteredNews,
      });
    } catch (error) {
      res.status(500).json({ error: "Search failed" });
    }
  });

  app.get("/robots.txt", (_req, res) => {
    const robotsTxt = `# robots.txt for https://www.vonwobeser.com
User-agent: *
Allow: /

# Disallow API endpoints
Disallow: /api/

# Sitemap location
Sitemap: https://www.vonwobeser.com/sitemap.xml
`;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(robotsTxt);
  });

  // llms.txt — índice legible por motores generativos (GEO). Formato llmstxt.org:
  // describe qué es la firma y enlaza sus secciones clave para que la IA cite bien.
  app.get('/llms.txt', (_req, res) => {
    const base = (process.env.SITE_URL || 'https://www.vonwobeser.com').replace(/\/+$/, '');
    const llms = `# Von Wobeser y Sierra, S.C.

> Von Wobeser y Sierra es una de las firmas de abogados líderes en México, con reconocimiento internacional (Chambers, The Legal 500, Latin Lawyer). Ofrece asesoría en derecho corporativo, litigio, arbitraje, competencia económica, propiedad intelectual, laboral, fiscal, ambiental y más. Sede en Ciudad de México. Sitio bilingüe español/inglés (versión en inglés con ?lang=en).

## Secciones principales
- [Inicio](${base}/): presentación de la firma.
- [Nuestra Firma](${base}/nuestra-firma): historia, valores y enfoque.
- [Pro Bono](${base}/nuestra-firma/probono): programa de trabajo pro bono de la firma.
- [Diversidad e Inclusión](${base}/nuestra-firma/diversidad): iniciativas de diversidad e inclusión.
- [Abogados / Socios](${base}/attorneys/partners): directorio del equipo legal.
- [Noticias y publicaciones](${base}/news): actualizaciones legales y de la firma.
- [Contacto](${base}/contacto): datos de contacto y ubicación.
- [Bolsa de trabajo](${base}/bolsa-de-trabajo): oportunidades profesionales.

## Recursos
- [Mapa del sitio (sitemap.xml)](${base}/sitemap.xml)
- Contacto: Torre SOMA, Campos Elíseos 204, Polanco, Ciudad de México — +52 55 5258 1000
`;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(llms);
  });

  // Caché del sitemap (1 h): antes se regeneraba cargando TODAS las tablas en cada
  // hit de crawler. TTL corto para reflejar contenido nuevo sin regenerar por request.
  let sitemapCache: { xml: string; at: number } | null = null;
  const SITEMAP_TTL_MS = 60 * 60 * 1000;

  app.get("/sitemap.xml", async (_req, res) => {
    try {
      if (sitemapCache && Date.now() - sitemapCache.at < SITEMAP_TTL_MS) {
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.send(sitemapCache.xml);
      }
      const baseUrl = (process.env.SITE_URL || 'https://www.vonwobeser.com').replace(/\/+$/, '');
      const today = new Date().toISOString().split('T')[0];
      const xmlEsc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

      // Genera una <url> con alternates reales. Algunas secciones comparten ruta y
      // usan ?lang=en; las institucionales tienen rutas distintas (/contacto|/contact).
      const urlEntry = (esPath: string, enPath: string, changefreq: string, priority: string, lastmod = today) => {
        const es = `${baseUrl}${esPath}`;
        const en = `${baseUrl}${enPath}`;
        return `
  <url>
    <loc>${xmlEsc(es)}</loc>
    <xhtml:link rel="alternate" hreflang="es-MX" href="${xmlEsc(es)}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${xmlEsc(en)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEsc(es)}"/>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
      };

      // Rutas REALES del espejo (antes apuntaba a rutas del viejo SPA que ya no existen).
      const staticPages = [
        { es: '/', en: '/?lang=en', changefreq: 'weekly', priority: '1.0' },
        { es: '/nuevas-oficinas/', en: '/new-offices/', changefreq: 'monthly', priority: '0.8' },
        { es: '/acerca-de', en: '/about', changefreq: 'monthly', priority: '0.8' },
        { es: '/nuestra-firma', en: '/our-firm', changefreq: 'monthly', priority: '0.8' },
        { es: '/nuestra-firma/probono', en: '/our-firm/our-firm-probono', changefreq: 'monthly', priority: '0.6' },
        { es: '/nuestra-firma/diversidad', en: '/our-firm/diversity', changefreq: 'monthly', priority: '0.6' },
        { es: '/capacidades', en: '/capabilities', changefreq: 'monthly', priority: '0.8' },
        { es: '/capacidades/practicas', en: '/capabilities/practices', changefreq: 'weekly', priority: '0.8' },
        { es: '/capacidades/industrias', en: '/capabilities/industries', changefreq: 'weekly', priority: '0.8' },
        { es: '/publicaciones', en: '/publications', changefreq: 'weekly', priority: '0.8' },
        { es: '/news', en: '/news?lang=en', changefreq: 'daily', priority: '0.9' },
        { es: '/articles', en: '/articles?lang=en', changefreq: 'weekly', priority: '0.8' },
        { es: '/attorneys', en: '/attorneys?lang=en', changefreq: 'weekly', priority: '0.8' },
        { es: '/attorneys/partners', en: '/attorneys/partners?lang=en', changefreq: 'weekly', priority: '0.8' },
        { es: '/attorneys/of-counsel', en: '/attorneys/of-counsel?lang=en', changefreq: 'weekly', priority: '0.6' },
        { es: '/attorneys/counsel', en: '/attorneys/counsel?lang=en', changefreq: 'weekly', priority: '0.6' },
        { es: '/attorneys/associates', en: '/attorneys/associates?lang=en', changefreq: 'weekly', priority: '0.6' },
        { es: '/contacto', en: '/contact', changefreq: 'monthly', priority: '0.7' },
        { es: '/bolsa-de-trabajo', en: '/careers', changefreq: 'weekly', priority: '0.7' },
        { es: '/bolsa-de-trabajo/pasantes', en: '/careers/interns', changefreq: 'monthly', priority: '0.6' },
        { es: '/aviso', en: '/privacy', changefreq: 'yearly', priority: '0.4' },
      ];

      const [teamMembers, practiceGroups, industryGroups, newsItems] = await Promise.all([
        storage.getTeamMembers(),
        storage.getPracticeGroups(),
        storage.getIndustryGroups(),
        storage.getNews(),
      ]);

      // array.join en vez de string += en bucle (evita O(n²) de concatenación).
      const parts: string[] = [];

      for (const page of staticPages) parts.push(urlEntry(page.es, page.en, page.changefreq, page.priority));

      for (const member of teamMembers as any[]) {
        if (member.published === false) continue;
        parts.push(urlEntry(`/abogado/${member.slug}`, `/lawyer/${member.slug}?lang=en`, 'monthly', '0.6'));
      }
      for (const group of practiceGroups as any[]) {
        if (group.published === false) continue;
        parts.push(urlEntry(`/practice/${group.slug}`, `/practice/${group.slug}?lang=en`, 'monthly', '0.7'));
      }
      for (const group of industryGroups as any[]) {
        if (group.published === false) continue;
        parts.push(urlEntry(`/industry/${group.slug}`, `/industry/${group.slug}?lang=en`, 'monthly', '0.7'));
      }
      for (const newsItem of newsItems as any[]) {
        if (newsItem.published !== true || (newsItem.publishAt && new Date(newsItem.publishAt) > new Date())) continue;
        const lastmod = newsItem.date ? new Date(newsItem.date).toISOString().split('T')[0] : today;
        parts.push(urlEntry(`/news/${newsItem.slug}`, `/news/${newsItem.slug}?lang=en`, 'monthly', '0.6', lastmod));
      }

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${parts.join('')}
</urlset>`;

      sitemapCache = { xml: sitemap, at: Date.now() };
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(sitemap);
    } catch (error) {
      console.error("Sitemap generation error:", error);
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate sitemap</error>');
    }
  });

  // Los CV históricos que alguna vez quedaron en /uploads tampoco se exponen sin
  // autenticación. Se siguen pudiendo descargar desde el endpoint administrativo.
  app.use("/uploads", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const publicPath = `/uploads/${path.basename(req.path)}`;
      if (await storage.getCareerApplicationByCvPath(publicPath)) {
        return res.status(404).end();
      }
      next();
    } catch {
      res.status(404).end();
    }
  });

  // Serve approved public media
  app.use('/uploads', express.static(uploadsDir, {
    maxAge: '1d',
    immutable: true,
    setHeaders: (res) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Content-Security-Policy", "sandbox");
    },
  }));

  // =============================================
  // ADMIN ROUTES
  // =============================================

  // No existe un endpoint público de inicialización. El primer Dueño se crea
  // exclusivamente desde ADMIN_EMAIL + ADMIN_BOOTSTRAP_PASSWORD en Replit Secrets.
  app.all("/api/admin/init", (_req: Request, res: Response) => {
    res.status(410).json({ error: "Initialization endpoint retired" });
  });

  const dummyPasswordHash = await hashPassword("Timing!9vQ2xK7mP");
  const privilegedRole = (role: string) => role === "super_admin" || role === "admin";
  const isPendingSchemaMigration = (error: unknown): boolean => {
    const code = (error as { code?: string; cause?: { code?: string } } | null)?.cause?.code
      || (error as { code?: string } | null)?.code;
    return code === "42703" || code === "42P01" || code === "23502";
  };
  const requireSameOrigin = (req: Request, res: Response, next: NextFunction) => {
    const fetchSite = req.header("sec-fetch-site");
    if (fetchSite === "cross-site") {
      return res.status(403).json({ error: "Origin not allowed", code: "ORIGIN_INVALID" });
    }
    const origin = req.header("origin");
    if (!origin) return next(); // CLI, app nativa y pruebas autorizadas no siempre lo envían.
    try {
      const host = req.header("host");
      if (!host || new URL(origin).host !== host) {
        return res.status(403).json({ error: "Origin not allowed", code: "ORIGIN_INVALID" });
      }
      next();
    } catch {
      return res.status(403).json({ error: "Origin not allowed", code: "ORIGIN_INVALID" });
    }
  };

  const createAuthenticatedSession = async (
    res: Response,
    user: {
      id: string;
      username: string;
      email: string;
      role: string;
      permissions: string[] | null;
    },
    ipAddress: string,
    userAgent: string | null,
    mfaVerified: boolean,
  ) => {
    const rawToken = generateToken();
    const csrfToken = deriveCsrfToken(rawToken);
    await storage.createAdminSession({
      userId: user.id,
      tokenHash: hashOpaqueToken(rawToken),
      csrfTokenHash: hashOpaqueToken(csrfToken),
      expiresAt: getSessionExpiry(),
      absoluteExpiresAt: getAbsoluteSessionExpiry(),
      lastSeenAt: new Date(),
      mfaVerified,
      ipAddress,
      userAgent,
    });
    res.cookie(SESSION_COOKIE, rawToken, authCookieOptions(8 * 60 * 60 * 1000));
    return {
      csrfToken,
      user: adminSessionUserPayload(user),
    };
  };

  const createLoginChallenge = async (
    res: Response,
    userId: string,
    purpose: "mfa" | "enroll",
  ) => {
    await storage.deleteAdminAuthChallengesByUserId(userId);
    const rawToken = generateToken();
    await storage.createAdminAuthChallenge({
      userId,
      tokenHash: hashOpaqueToken(rawToken),
      purpose,
      attempts: 0,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    res.cookie(CHALLENGE_COOKIE, rawToken, authCookieOptions(10 * 60 * 1000));
  };

  const resolveLoginChallenge = async (req: Request, res: Response) => {
    const rawToken = readCookie(req, CHALLENGE_COOKIE);
    if (!rawToken) return null;
    const tokenHash = hashOpaqueToken(rawToken);
    const challenge = await storage.getAdminAuthChallenge(tokenHash);
    if (!challenge || challenge.expiresAt < new Date() || challenge.attempts >= 5) {
      if (challenge) await storage.deleteAdminAuthChallenge(tokenHash);
      clearAuthCookie(res, CHALLENGE_COOKIE);
      return null;
    }
    const user = await storage.getAdminUser(challenge.userId);
    if (!user?.isActive) return null;
    return { rawToken, tokenHash, challenge, user };
  };

  // Admin Login: nunca devuelve el token de sesión. La sesión final viaja
  // exclusivamente en una cookie HttpOnly, después de MFA cuando corresponde.
  app.post("/api/admin/login", requireSameOrigin, async (req: Request, res: Response) => {
    try {
      res.setHeader("Cache-Control", "no-store");
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      const userAgent = req.headers["user-agent"] || null;

      // Registro persistente de accesos (éxitos y fallos). NUNCA guarda contraseñas.
      // Envuelto para que un fallo del log jamás rompa el inicio de sesión.
      const logLogin = async (email: string, success: boolean, userId: string | null = null) => {
        try {
          const identifierHash = hashOpaqueToken(`login:${String(email).trim().toLowerCase()}`);
          const ipHash = hashOpaqueToken(`ip:${ip}`);
          await storage.recordLoginEvent({
            userId,
            // Nombre histórico de columna; contiene un hash SHA-256, nunca el correo.
            email: identifierHash,
            success,
            ipAddress: ipHash,
            userAgent: userAgent?.slice(0, 512) || null,
          });
        } catch (e) {
          console.error("recordLoginEvent failed");
        }
      };

      // Check rate limit
      const attemptedIdentifier = String(req.body?.username || "").trim().toLowerCase();
      const rateIdentifier = `${ip}|${attemptedIdentifier}`;
      const rateCheck = await checkRateLimit(rateIdentifier);
      if (!rateCheck.allowed) {
        console.warn("[SECURITY_ALERT] Login rate limit triggered");
        res.setHeader("Retry-After", String(rateCheck.retryAfter || 60));
        return res.status(429).json({
          error: "Too many login attempts",
          code: "LOGIN_RATE_LIMITED",
          retryAfter: rateCheck.retryAfter,
        });
      }

      // Validate input
      const validation = adminLoginSchema.safeParse(req.body);
      if (!validation.success) {
        await recordLoginAttempt(rateIdentifier, false);
        await logLogin(String((req.body && req.body.username) || ""), false);
        return res.status(400).json({ error: "Invalid credentials", code: "INVALID_CREDENTIALS" });
      }

      const { username, password } = validation.data;

      // Find user by email or username
      let user = await storage.getAdminUserByEmail(username);
      if (!user) {
        user = await storage.getAdminUserByUsername(username);
      }
      if (!user) {
        await comparePassword(password, dummyPasswordHash);
        await recordLoginAttempt(rateIdentifier, false);
        await logLogin(username, false);
        return res.status(401).json({ error: "Invalid credentials", code: "INVALID_CREDENTIALS" });
      }

      // Check if user is active
      if (!user.isActive) {
        await comparePassword(password, dummyPasswordHash);
        await recordLoginAttempt(rateIdentifier, false);
        await logLogin(user.email, false, user.id);
        return res.status(401).json({ error: "Invalid credentials", code: "INVALID_CREDENTIALS" });
      }

      // Verify password
      const validPassword = await comparePassword(password, user.passwordHash);
      if (!validPassword) {
        await recordLoginAttempt(rateIdentifier, false);
        await logLogin(user.email, false, user.id);
        return res.status(401).json({ error: "Invalid credentials", code: "INVALID_CREDENTIALS" });
      }

      await recordLoginAttempt(rateIdentifier, true);
      await logLogin(user.email, true, user.id);
      await storage.updateAdminUserLogin(user.id);

      // Migración perezosa: cualquier bcrypt heredado pasa a Argon2id después de
      // verificarlo. La política de altas no bloquea el login de credenciales antiguas.
      if (passwordNeedsRehash(user.passwordHash)) {
        await storage.setAdminUserPassword(user.id, await rehashVerifiedPassword(password), false);
        user = (await storage.getAdminUser(user.id)) || user;
      }

      if (privilegedRole(user.role)) {
        if (!isMfaConfigured()) {
          return res.status(503).json({
            error: "MFA is not configured on the server",
            code: "MFA_CONFIGURATION_REQUIRED",
          });
        }
        const credential = await storage.getAdminMfaCredential(user.id);
        const setupRequired = !credential?.enabledAt;
        await createLoginChallenge(res, user.id, setupRequired ? "enroll" : "mfa");
        return res.json({
          authenticated: false,
          mfaRequired: true,
          setupRequired,
          user: { email: user.email, role: user.role },
        });
      }

      const sessionPayload = await createAuthenticatedSession(res, user, ip, userAgent, false);
      return res.json({ authenticated: true, ...sessionPayload });
    } catch (error) {
      console.error("Login error:", error instanceof Error ? error.message : "unknown");
      if (isPendingSchemaMigration(error)) {
        return res.status(503).json({
          error: "El panel requiere completar una actualización de base de datos",
          code: "SCHEMA_MIGRATION_REQUIRED",
        });
      }
      res.status(500).json({ error: "Login failed", code: "LOGIN_FAILED" });
    }
  });

  app.post("/api/admin/mfa/enroll", requireSameOrigin, async (req: Request, res: Response) => {
    try {
      const resolved = await resolveLoginChallenge(req, res);
      if (!resolved || resolved.challenge.purpose !== "enroll") {
        return res.status(401).json({ error: "Enrollment challenge expired", code: "CHALLENGE_EXPIRED" });
      }
      if (!isMfaConfigured()) {
        return res.status(503).json({ error: "MFA is not configured", code: "MFA_CONFIGURATION_REQUIRED" });
      }
      let credential = await storage.getAdminMfaCredential(resolved.user.id);
      let secret: string;
      if (credential && !credential.enabledAt) {
        secret = decryptTotpSecret(credential.encryptedSecret);
      } else if (!credential) {
        secret = generateTotpSecret();
        credential = await storage.upsertAdminMfaCredential({
          userId: resolved.user.id,
          encryptedSecret: encryptTotpSecret(secret),
          recoveryCodeHashes: [],
          enabledAt: null,
        });
      } else {
        return res.status(409).json({ error: "MFA is already enabled" });
      }
      res.setHeader("Cache-Control", "no-store");
      res.json({
        secret,
        otpauthUrl: totpAuthUrl(resolved.user.email, secret),
        issuer: "Von Wobeser",
        account: resolved.user.email,
      });
    } catch (error) {
      console.error("MFA enrollment error:", error instanceof Error ? error.message : "unknown");
      res.status(500).json({ error: "Unable to start MFA enrollment" });
    }
  });

  app.post("/api/admin/mfa/verify", requireSameOrigin, async (req: Request, res: Response) => {
    try {
      const parsed = z.object({ code: z.string().regex(/^\d{6}$/) }).safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid verification code" });
      const resolved = await resolveLoginChallenge(req, res);
      if (!resolved) return res.status(401).json({ error: "Challenge expired", code: "CHALLENGE_EXPIRED" });
      const credential = await storage.getAdminMfaCredential(resolved.user.id);
      if (!credential) return res.status(409).json({ error: "MFA enrollment is incomplete" });
      const secret = decryptTotpSecret(credential.encryptedSecret);
      if (!verifyTotp(secret, parsed.data.code)) {
        await storage.updateAdminAuthChallengeAttempts(resolved.challenge.id, resolved.challenge.attempts + 1);
        return res.status(401).json({ error: "Invalid verification code", code: "INVALID_MFA_CODE" });
      }

      let recoveryCodes: string[] | undefined;
      if (!credential.enabledAt) {
        const generated = generateRecoveryCodes();
        recoveryCodes = generated.plain;
        await storage.updateAdminMfaCredential(resolved.user.id, {
          recoveryCodeHashes: generated.hashes,
          enabledAt: new Date(),
        });
      }

      await storage.deleteAdminAuthChallenge(resolved.tokenHash);
      clearAuthCookie(res, CHALLENGE_COOKIE);
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      const sessionPayload = await createAuthenticatedSession(
        res,
        resolved.user,
        ip,
        req.headers["user-agent"] || null,
        true,
      );
      res.setHeader("Cache-Control", "no-store");
      res.json({ authenticated: true, ...sessionPayload, ...(recoveryCodes ? { recoveryCodes } : {}) });
    } catch (error) {
      console.error("MFA verification error:", error instanceof Error ? error.message : "unknown");
      res.status(500).json({ error: "Unable to verify MFA" });
    }
  });

  app.post("/api/admin/mfa/recovery", requireSameOrigin, async (req: Request, res: Response) => {
    try {
      const parsed = z.object({ recoveryCode: z.string().min(8).max(64) }).safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid recovery code" });
      const resolved = await resolveLoginChallenge(req, res);
      if (!resolved || resolved.challenge.purpose !== "mfa") {
        return res.status(401).json({ error: "Challenge expired", code: "CHALLENGE_EXPIRED" });
      }
      const credential = await storage.getAdminMfaCredential(resolved.user.id);
      if (!credential?.enabledAt) return res.status(409).json({ error: "MFA is not enabled" });
      const remaining = consumeRecoveryCode(credential.recoveryCodeHashes || [], parsed.data.recoveryCode);
      if (!remaining) {
        await storage.updateAdminAuthChallengeAttempts(resolved.challenge.id, resolved.challenge.attempts + 1);
        return res.status(401).json({ error: "Invalid recovery code" });
      }
      await storage.updateAdminMfaCredential(resolved.user.id, { recoveryCodeHashes: remaining });
      await storage.deleteAdminAuthChallenge(resolved.tokenHash);
      clearAuthCookie(res, CHALLENGE_COOKIE);
      const sessionPayload = await createAuthenticatedSession(
        res,
        resolved.user,
        req.ip || req.socket.remoteAddress || "unknown",
        req.headers["user-agent"] || null,
        true,
      );
      res.setHeader("Cache-Control", "no-store");
      res.json({ authenticated: true, ...sessionPayload });
    } catch (error) {
      console.error("MFA recovery error:", error instanceof Error ? error.message : "unknown");
      res.status(500).json({ error: "Unable to use recovery code" });
    }
  });

  // Contador de gasto ESTIMADO de la API de IA. OpenAI no expone el saldo por API key, así que
  // esto suma tokens/imágenes de NUESTRAS llamadas por el precio conocido del modelo (aproximado).
  app.get("/api/admin/usage/summary", authMiddleware, requirePermission("agents"), async (_req: Request, res: Response) => {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const byKind = await db
        .select({
          kind: apiUsage.kind,
          cost: sql<number>`coalesce(sum(${apiUsage.costUsd}), 0)`,
          calls: sql<number>`count(*)::int`,
        })
        .from(apiUsage)
        .where(gte(apiUsage.createdAt, monthStart))
        .groupBy(apiUsage.kind);
      const [totals] = await db
        .select({
          month: sql<number>`coalesce(sum(case when ${apiUsage.createdAt} >= ${monthStart} then ${apiUsage.costUsd} else 0 end), 0)`,
          total: sql<number>`coalesce(sum(${apiUsage.costUsd}), 0)`,
          calls: sql<number>`count(*)::int`,
        })
        .from(apiUsage);
      res.json({
        month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
        monthUsd: Number(totals?.month || 0),
        totalUsd: Number(totals?.total || 0),
        totalCalls: Number(totals?.calls || 0),
        byKind: byKind.map((r) => ({ kind: r.kind, costUsd: Number(r.cost), calls: Number(r.calls) })),
      });
    } catch (error) {
      console.error("Usage summary error:", error);
      res.status(500).json({ error: "Error al calcular el gasto" });
    }
  });

  // Generador de imágenes con IA a demanda (editor de noticias, redes, galería). Recibe un
  // prompt/tema + formato opcional (1:1 / 16:9 / 9:16) y devuelve la URL de la imagen generada.
  app.post("/api/admin/generate-image", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const { prompt, aspect } = (req.body || {}) as { prompt?: string; aspect?: string };
      if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
        return res.status(400).json({ error: "Falta el tema/prompt de la imagen" });
      }
      const result = await smartImageGenerator.generateImage(
        prompt.trim().substring(0, 800),
        `manual-${Date.now()}`,
        typeof aspect === "string" ? aspect : undefined,
      );
      if (!result.success || result.engine === "placeholder") {
        return res.status(502).json({ error: "No se pudo generar la imagen. Revisa la configuración del proveedor." });
      }
      res.json({ imageUrl: result.imageUrl, engine: result.engine });
    } catch {
      res.status(500).json({ error: "Error al generar la imagen" });
    }
  });

  // Estado de sesión: deriva el mismo token CSRF para todas las pestañas de esta
  // sesión. La cookie HttpOnly nunca se expone y PostgreSQL conserva solo el hash.
  app.get("/api/admin/session", authMiddleware, async (req: Request, res: Response) => {
    const user = req.adminUser!;
    const rawSessionToken = readCookie(req, SESSION_COOKIE);
    if (!rawSessionToken) return res.status(401).json({ error: "Authentication required" });
    const csrfToken = deriveCsrfToken(rawSessionToken);
    await storage.rotateAdminSessionCsrf(req.adminSession!.id, hashOpaqueToken(csrfToken));
    res.setHeader("Cache-Control", "no-store");
    res.json({
      authenticated: true,
      csrfToken,
      user: adminSessionUserPayload(user),
    });
  });

  // Perfil del usuario autenticado + sus permisos EFECTIVOS.
  app.get("/api/admin/me", authMiddleware, async (req: Request, res: Response) => {
    const u = req.adminUser!;
    res.json(adminSessionUserPayload(u));
  });

  // Historial de accesos (solo admin/dueño). Nunca expone contraseñas.
  app.get("/api/admin/login-log", authMiddleware, requireRole("super_admin", "admin"), async (req: Request, res: Response) => {
    try {
      const parsed = z.coerce.number().int().min(1).max(500).default(100).safeParse(req.query.limit);
      if (!parsed.success) return res.status(400).json({ error: "Invalid limit" });
      res.json(await storage.getLoginEvents(parsed.data));
    } catch (error) {
      console.error("Login log error:", error);
      return apiError(res, 500, "Failed to load login log");
    }
  });

  // =============================================
  // ADMIN USERS — gestión de accesos (solo admin/dueño)
  // =============================================
  const MANAGEABLE_ROLES = ["super_admin", "admin", "editor", "marketing", "sistemas"];
  const isPrivileged = (r: string) => r === "super_admin" || r === "admin";

  app.get("/api/admin/users", authMiddleware, requirePermission("users"), async (_req: Request, res: Response) => {
    try {
      res.json(await storage.getAdminUsers()); // nunca incluye passwordHash
    } catch (error) {
      console.error("List users error:", error);
      return apiError(res, 500, "Failed to list users");
    }
  });

  app.post("/api/admin/users", authMiddleware, requirePermission("users"), async (req: Request, res: Response) => {
    try {
      const actor = req.adminUser!;
      const parsed = z.object({
        username: z.string().trim().min(1).max(80).optional(),
        email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
        role: z.enum(["super_admin", "admin", "editor", "marketing", "sistemas"]).default("editor"),
      }).strict().safeParse(req.body);
      if (!parsed.success) return apiError(res, 400, "Datos de usuario inválidos");
      const { username, email, role: r } = parsed.data;
      if (!MANAGEABLE_ROLES.includes(r)) return apiError(res, 400, "Rol inválido");
      if (r === "super_admin" && actor.role !== "super_admin") return apiError(res, 403, "Solo un Dueño puede crear otro Dueño");
      const finalUsername = username || email.split("@")[0].toLowerCase();
      const generatedPassword = generateAdminPassword();
      const passwordHash = await hashPassword(generatedPassword);
      const created = await storage.createAdminUser({
        username: finalUsername,
        email,
        passwordHash,
        role: r,
        isActive: true,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
      } as any);
      if (r === "super_admin") {
        console.warn("[SECURITY_ALERT] A super administrator account was created");
      }
      auditLog("create", "admin_user", created.id, actor?.id || "unknown");
      const { passwordHash: _omit, ...safe } = created as any;
      res.setHeader("Cache-Control", "no-store");
      res.status(201).json({ user: safe, generatedPassword });
    } catch (error: any) {
      if (error?.code === "23505" || /unique|duplicate/i.test(String(error?.message))) {
        return apiError(res, 409, "Ya existe un usuario con ese correo o nombre de usuario");
      }
      console.error("Create user error:", error);
      return apiError(res, 500, "Failed to create user");
    }
  });

  app.put("/api/admin/users/:id", authMiddleware, requirePermission("users"), async (req: Request, res: Response) => {
    try {
      const actor = (req as any).adminUser;
      const idResult = z.string().uuid().safeParse(req.params.id);
      if (!idResult.success) return apiError(res, 400, "Identificador inválido");
      const id = idResult.data;
      const target = await storage.getAdminUser(id);
      if (!target) return apiError(res, 404, "Usuario no encontrado");
      const parsed = z.object({
        role: z.enum(["super_admin", "admin", "editor", "marketing", "sistemas"]).optional(),
        isActive: z.boolean().optional(),
        permissions: z.array(z.string().max(60)).max(20).optional(),
      }).strict().safeParse(req.body);
      if (!parsed.success) return apiError(res, 400, "Datos de usuario inválidos");
      const { role, isActive } = parsed.data;
      if ((target.role === "super_admin" || role === "super_admin") && actor.role !== "super_admin") {
        return apiError(res, 403, "Solo un Dueño puede modificar a un Dueño o asignar ese rol");
      }
      if (role !== undefined && !MANAGEABLE_ROLES.includes(role)) return apiError(res, 400, "Rol inválido");
      if (isActive === false && id === actor.id) return apiError(res, 400, "No puedes desactivar tu propia cuenta");
      // Concesiones extra: solo claves de GRANTABLE (nunca `users` → evita escalada de privilegios).
      const permissions = parsed.data.permissions !== undefined ? sanitizeGrants(parsed.data.permissions) : undefined;
      // Anti-lockout: no dejar 0 administradores/dueños activos.
      const willLosePrivilege = (role !== undefined && !isPrivileged(role)) || isActive === false;
      if (isPrivileged(target.role) && willLosePrivilege) {
        const users = await storage.getAdminUsers();
        const otherActivePriv = users.filter((u) => u.isActive && isPrivileged(u.role) && u.id !== id).length;
        if (otherActivePriv < 1) return apiError(res, 400, "Debe quedar al menos un Administrador/Dueño activo");
      }
      const updated = await storage.updateAdminUser(id, {
        ...(role !== undefined ? { role } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
        ...(permissions !== undefined ? { permissions } : {}),
      });
      if (role === "super_admin" && target.role !== "super_admin") {
        console.warn("[SECURITY_ALERT] An account was promoted to super administrator");
      }
      if (role !== undefined || isActive !== undefined) {
        await storage.deleteAdminSessionsByUserId(id);
        await storage.deleteAdminAuthChallengesByUserId(id);
      }
      auditLog("update", "admin_user", id, actor?.id || "unknown");
      const { passwordHash: _o, ...safe } = (updated as any) || {};
      res.json(safe);
    } catch (error) {
      console.error("Update user error:", error);
      return apiError(res, 500, "Failed to update user");
    }
  });

  app.post("/api/admin/users/:id/password", authMiddleware, requirePermission("users"), async (req: Request, res: Response) => {
    try {
      const actor = (req as any).adminUser;
      const idResult = z.string().uuid().safeParse(req.params.id);
      if (!idResult.success) return apiError(res, 400, "Identificador inválido");
      const target = await storage.getAdminUser(idResult.data);
      if (!target) return apiError(res, 404, "Usuario no encontrado");
      if (target.role === "super_admin" && actor.role !== "super_admin" && target.id !== actor.id) {
        return apiError(res, 403, "Solo un Dueño puede cambiar la contraseña de un Dueño");
      }
      const generatedPassword = generateAdminPassword();
      await storage.setAdminUserPassword(idResult.data, await hashPassword(generatedPassword), false);
      await storage.deleteAdminSessionsByUserId(idResult.data);
      await storage.deleteAdminAuthChallengesByUserId(idResult.data);
      auditLog("update", "admin_user", idResult.data, actor?.id || "unknown");
      res.setHeader("Cache-Control", "no-store");
      res.json({ ok: true, generatedPassword });
    } catch (error) {
      console.error("Reset password error:", error);
      return apiError(res, 500, "Failed to reset password");
    }
  });

  app.delete("/api/admin/users/:id", authMiddleware, requirePermission("users"), async (req: Request, res: Response) => {
    try {
      const actor = (req as any).adminUser;
      const idResult = z.string().uuid().safeParse(req.params.id);
      if (!idResult.success) return apiError(res, 400, "Identificador inválido");
      const id = idResult.data;
      if (id === actor.id) return apiError(res, 400, "No puedes eliminar tu propia cuenta");
      const target = await storage.getAdminUser(id);
      if (!target) return apiError(res, 404, "Usuario no encontrado");
      if (target.role === "super_admin" && actor.role !== "super_admin") return apiError(res, 403, "Solo un Dueño puede eliminar a un Dueño");
      if (isPrivileged(target.role)) {
        const users = await storage.getAdminUsers();
        const otherActivePriv = users.filter((u) => u.isActive && isPrivileged(u.role) && u.id !== id).length;
        if (otherActivePriv < 1) return apiError(res, 400, "Debe quedar al menos un Administrador/Dueño activo");
      }
      await storage.deleteAdminSessionsByUserId(id);
      await storage.deleteAdminAuthChallengesByUserId(id);
      await storage.deleteAdminUser(id);
      auditLog("delete", "admin_user", id, actor?.id || "unknown");
      res.json({ ok: true });
    } catch (error) {
      console.error("Delete user error:", error);
      return apiError(res, 500, "Failed to delete user");
    }
  });

  app.post("/api/admin/password/change", authMiddleware, async (req: Request, res: Response) => {
    try {
      const parsed = z.object({
        currentPassword: z.string().min(1).max(128),
        newPassword: z.string().min(12).max(16),
      }).safeParse(req.body);
      if (!parsed.success) return apiError(res, 400, "La nueva contraseña debe tener entre 12 y 16 caracteres");
      const policy = validateNewPassword(parsed.data.newPassword);
      if (!policy.valid) return apiError(res, 400, policy.error);
      const user = req.adminUser!;
      if (!await comparePassword(parsed.data.currentPassword, user.passwordHash)) {
        return apiError(res, 401, "La contraseña actual no es correcta");
      }
      if (await comparePassword(parsed.data.newPassword, user.passwordHash)) {
        return apiError(res, 400, "La nueva contraseña debe ser diferente");
      }
      await storage.setAdminUserPassword(user.id, await hashPassword(parsed.data.newPassword), false);
      await storage.deleteAdminSessionsByUserId(user.id);
      await storage.deleteAdminAuthChallengesByUserId(user.id);
      clearAuthCookie(res, SESSION_COOKIE);
      auditLog("update", "admin_user_password", user.id, user.id);
      res.json({ ok: true, reauthenticationRequired: true });
    } catch (error) {
      console.error("Password change error:", error instanceof Error ? error.message : "unknown");
      apiError(res, 500, "No se pudo cambiar la contraseña");
    }
  });

  app.post("/api/admin/sessions/revoke-all", authMiddleware, async (req: Request, res: Response) => {
    const count = await storage.deleteAdminSessionsByUserId(req.adminUser!.id);
    await storage.deleteAdminAuthChallengesByUserId(req.adminUser!.id);
    clearAuthCookie(res, SESSION_COOKIE);
    res.json({ ok: true, revoked: count });
  });

  // Admin Logout
  app.post("/api/admin/logout", authMiddleware, async (req: Request, res: Response) => {
    try {
      const rawToken = readCookie(req, SESSION_COOKIE);
      if (rawToken) await storage.deleteAdminSession(hashOpaqueToken(rawToken));
      clearAuthCookie(res, SESSION_COOKIE);
      res.json({ success: true });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });

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

  // Get translation counts for all news articles
  app.get("/api/admin/news/translation-counts", authMiddleware, requirePermission("content"), async (_req: Request, res: Response) => {
    try {
      const counts = await storage.getNewsTranslationCounts();
      res.json(counts);
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

  // Create news
  app.post("/api/admin/news", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const validation = insertNewsSchema.safeParse(req.body);
      
      if (!validation.success) {
        return apiError(res, 400, "Validation failed", validation.error.errors);
      }

      sanitizeFields(validation.data, ["content", "contentEs", "excerpt", "excerptEs"]);
      if (validation.data.published && !hasPublishableBilingualNews(validation.data)) {
        return apiError(res, 400, "Published news requires title and excerpt in English and Spanish");
      }

      const newsItem = await storage.createNews(validation.data);
      auditLog("create", "news", newsItem.id, (req as any).adminUser?.id || "unknown");
      res.status(201).json(newsItem);
    } catch (error) {
      console.error("Create news error:", error);
      return apiError(res, 500, "Failed to create news");
    }
  });

  // Update news
  app.put("/api/admin/news/:id", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const validated = insertNewsSchema.partial().parse(req.body); // valida + descarta campos no permitidos (anti mass-assignment)
      sanitizeFields(validated, ["content", "contentEs", "excerpt", "excerptEs"]);
      const current = await storage.getNewsById(req.params.id);
      if (!current) return apiError(res, 404, "News not found");
      const finalState = { ...current, ...validated };
      if (finalState.published && !hasPublishableBilingualNews(finalState)) {
        return apiError(res, 400, "Published news requires title and excerpt in English and Spanish");
      }
      const newsItem = await storage.updateNews(req.params.id, validated);
      if (!newsItem) {
        return apiError(res, 404, "News not found");
      }
      auditLog("update", "news", req.params.id, (req as any).adminUser?.id || "unknown");
      res.json(newsItem);
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
      auditLog("delete", "news", req.params.id, (req as any).adminUser?.id || "unknown");
      res.json({ success: true });
    } catch (error) {
      console.error("Delete news error:", error);
      return apiError(res, 500, "Failed to delete news");
    }
  });

  // =============================================
  // ADMIN TEAM MEMBERS CRUD
  // =============================================

  // Get all team members (admin)
  app.get("/api/admin/team", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const parsed = z.object({
        page: z.coerce.number().int().min(1).max(100_000).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        search: z.string().trim().max(160).default(""),
        role: z.string().trim().max(80).default(""),
      }).safeParse(req.query);
      if (!parsed.success) return res.status(400).json({ error: "Invalid pagination or filters" });
      const { page, limit, search, role } = parsed.data;

      let members = await storage.getTeamMembers();

      // Filter by search term
      if (search) {
        const searchLower = search.toLowerCase();
        members = members.filter(m => 
          m.name.toLowerCase().includes(searchLower) ||
          (m.email && m.email.toLowerCase().includes(searchLower))
        );
      }

      // Filter by role/title
      if (role && role !== "all") {
        members = members.filter(m => m.title.toLowerCase().includes(role.toLowerCase()));
      }

      const total = members.length;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;
      const paginatedMembers = members.slice(offset, offset + limit);

      res.json({
        members: paginatedMembers,
        total,
        page,
        totalPages,
      });
    } catch (error) {
      console.error("Get admin team members error:", error);
      res.status(500).json({ error: "Failed to fetch team members" });
    }
  });

  // Get single team member (admin)
  app.get("/api/admin/team/:id", authMiddleware, requirePermission("content"), async (req: Request, res: Response, next: NextFunction) => {
    // "stats" es una subruta específica registrada después; no la trates como un id.
    if (req.params.id === "stats") return next();
    try {
      const member = await storage.getTeamMemberById(req.params.id);
      if (!member) {
        return res.status(404).json({ error: "Team member not found" });
      }
      const [practiceGroupIds, industryGroupIds] = await Promise.all([
        storage.getTeamMemberPracticeGroupIds(member.id),
        storage.getTeamMemberIndustryGroupIds(member.id),
      ]);
      res.json({ ...member, practiceGroupIds, industryGroupIds });
    } catch (error) {
      console.error("Get team member error:", error);
      res.status(500).json({ error: "Failed to fetch team member" });
    }
  });

  // Create team member
  app.post("/api/admin/team", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertTeamMemberSchema.parse(req.body);
      sanitizeFields(validatedData, ["bio", "bioEs"]);
      const member = await storage.createTeamMember(validatedData);
      const practiceGroupIds = Array.isArray(req.body.practiceGroupIds) ? req.body.practiceGroupIds : [];
      const industryGroupIds = Array.isArray(req.body.industryGroupIds) ? req.body.industryGroupIds : [];
      await Promise.all([
        storage.setTeamMemberPracticeGroups(member.id, practiceGroupIds),
        storage.setTeamMemberIndustryGroups(member.id, industryGroupIds),
      ]);
      auditLog("create", "team", member.id, (req as any).adminUser?.id || "unknown");
      res.status(201).json({ ...member, practiceGroupIds, industryGroupIds });
    } catch (error) {
      if (error instanceof ZodError) {
        return apiError(res, 400, "Validation failed", error.errors);
      }
      console.error("Create team member error:", error);
      return apiError(res, 500, "Failed to create team member");
    }
  });

  // Update team member
  app.put("/api/admin/team/:id", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertTeamMemberSchema.partial().parse(req.body);
      sanitizeFields(validatedData, ["bio", "bioEs"]);
      // Si el body solo trae practiceGroupIds/industryGroupIds (sin campos propios de
      // teamMembers), no hay nada que actualizar en la tabla principal — Drizzle
      // rechaza un SET vacío. Solo se llama a updateTeamMember si hay campos reales.
      const member = Object.keys(validatedData).length > 0
        ? await storage.updateTeamMember(req.params.id, validatedData)
        : await storage.getTeamMemberById(req.params.id);
      if (!member) {
        return apiError(res, 404, "Team member not found");
      }
      let practiceGroupIds: string[] | undefined;
      let industryGroupIds: string[] | undefined;
      if (Array.isArray(req.body.practiceGroupIds)) {
        practiceGroupIds = req.body.practiceGroupIds;
        await storage.setTeamMemberPracticeGroups(member.id, practiceGroupIds!);
      }
      if (Array.isArray(req.body.industryGroupIds)) {
        industryGroupIds = req.body.industryGroupIds;
        await storage.setTeamMemberIndustryGroups(member.id, industryGroupIds!);
      }
      auditLog("update", "team", req.params.id, (req as any).adminUser?.id || "unknown");
      res.json({ ...member, ...(practiceGroupIds && { practiceGroupIds }), ...(industryGroupIds && { industryGroupIds }) });
    } catch (error) {
      if (error instanceof ZodError) {
        return apiError(res, 400, "Validation failed", error.errors);
      }
      console.error("Update team member error:", error);
      return apiError(res, 500, "Failed to update team member");
    }
  });

  // Delete team member
  app.delete("/api/admin/team/:id", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteTeamMember(req.params.id);
      if (!deleted) {
        return apiError(res, 404, "Team member not found");
      }
      auditLog("delete", "team", req.params.id, (req as any).adminUser?.id || "unknown");
      res.json({ success: true });
    } catch (error) {
      console.error("Delete team member error:", error);
      return apiError(res, 500, "Failed to delete team member");
    }
  });

  // Get team stats
  app.get("/api/admin/team/stats", authMiddleware, requirePermission("content"), async (_req: Request, res: Response) => {
    try {
      const members = await storage.getTeamMembers();
      const partners = members.filter(m => m.title.toLowerCase().includes("partner") || m.isPartner);
      const ofCounsel = members.filter(m => m.title.toLowerCase().includes("of counsel"));
      const associates = members.filter(m => m.title.toLowerCase().includes("associate"));

      res.json({
        total: members.length,
        partners: partners.length,
        ofCounsel: ofCounsel.length,
        associates: associates.length,
      });
    } catch (error) {
      console.error("Get team stats error:", error);
      res.status(500).json({ error: "Failed to fetch team stats" });
    }
  });

  // =============================================
  // ADMIN PRACTICE GROUPS CRUD
  // =============================================

  // Get all practice groups (admin)
  app.get("/api/admin/practice-groups", authMiddleware, requirePermission("content"), async (_req: Request, res: Response) => {
    try {
      const groups = await storage.getPracticeGroups();
      res.json(groups);
    } catch (error) {
      console.error("Get practice groups error:", error);
      res.status(500).json({ error: "Failed to fetch practice groups" });
    }
  });

  // Create practice group
  app.post("/api/admin/practice-groups", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertPracticeGroupSchema.parse(req.body);
      sanitizeFields(validatedData, ["description", "descriptionEs", "fullDescription", "fullDescriptionEs"]);
      const group = await storage.createPracticeGroup(validatedData);
      res.status(201).json(group);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Create practice group error:", error);
      res.status(500).json({ error: "Failed to create practice group" });
    }
  });

  // Update practice group
  app.put("/api/admin/practice-groups/:id", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertPracticeGroupSchema.partial().parse(req.body);
      sanitizeFields(validatedData, ["description", "descriptionEs", "fullDescription", "fullDescriptionEs"]);
      const group = await storage.updatePracticeGroup(req.params.id, validatedData);
      if (!group) {
        return res.status(404).json({ error: "Practice group not found" });
      }
      res.json(group);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Update practice group error:", error);
      res.status(500).json({ error: "Failed to update practice group" });
    }
  });

  // Delete practice group
  app.delete("/api/admin/practice-groups/:id", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deletePracticeGroup(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Practice group not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete practice group error:", error);
      res.status(500).json({ error: "Failed to delete practice group" });
    }
  });

  // =============================================
  // ADMIN INDUSTRY GROUPS CRUD
  // =============================================

  // Get all industry groups (admin)
  app.get("/api/admin/industry-groups", authMiddleware, requirePermission("content"), async (_req: Request, res: Response) => {
    try {
      const groups = await storage.getIndustryGroups();
      res.json(groups);
    } catch (error) {
      console.error("Get industry groups error:", error);
      res.status(500).json({ error: "Failed to fetch industry groups" });
    }
  });

  // Create industry group
  app.post("/api/admin/industry-groups", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertIndustryGroupSchema.parse(req.body);
      sanitizeFields(validatedData, ["description", "descriptionEs", "fullDescription", "fullDescriptionEs"]);
      const group = await storage.createIndustryGroup(validatedData);
      res.status(201).json(group);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Create industry group error:", error);
      res.status(500).json({ error: "Failed to create industry group" });
    }
  });

  // Update industry group
  app.put("/api/admin/industry-groups/:id", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertIndustryGroupSchema.partial().parse(req.body);
      sanitizeFields(validatedData, ["description", "descriptionEs", "fullDescription", "fullDescriptionEs"]);
      const group = await storage.updateIndustryGroup(req.params.id, validatedData);
      if (!group) {
        return res.status(404).json({ error: "Industry group not found" });
      }
      res.json(group);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Update industry group error:", error);
      res.status(500).json({ error: "Failed to update industry group" });
    }
  });

  // Delete industry group
  app.delete("/api/admin/industry-groups/:id", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteIndustryGroup(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Industry group not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete industry group error:", error);
      res.status(500).json({ error: "Failed to delete industry group" });
    }
  });

  // =============================================
  // ADMIN EVENTS CRUD
  // =============================================
  
  app.get("/api/admin/events", authMiddleware, requirePermission("content"), async (_req: Request, res: Response) => {
    try {
      const eventsList = await storage.getEvents();
      res.json(eventsList);
    } catch (error) {
      console.error("Get events error:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.post("/api/admin/events", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertEventSchema.parse(req.body);
      sanitizeFields(validatedData, ["description", "descriptionEs"]);
      const event = await storage.createEvent(validatedData);
      res.json(event);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Create event error:", error);
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  app.put("/api/admin/events/:id", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertEventSchema.partial().parse(req.body);
      sanitizeFields(validatedData, ["description", "descriptionEs"]);
      const updated = await storage.updateEvent(req.params.id, validatedData);
      if (!updated) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Update event error:", error);
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  app.delete("/api/admin/events/:id", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteEvent(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete event error:", error);
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  // =============================================
  // ADMIN RANKINGS CRUD
  // =============================================
  
  app.get("/api/admin/rankings", authMiddleware, requirePermission("content"), async (_req: Request, res: Response) => {
    try {
      const rankingsList = await storage.getRankings();
      res.json(rankingsList);
    } catch (error) {
      console.error("Get rankings error:", error);
      res.status(500).json({ error: "Failed to fetch rankings" });
    }
  });

  app.post("/api/admin/rankings", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertRankingSchema.parse(req.body);
      const ranking = await storage.createRanking(validatedData);
      res.json(ranking);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Create ranking error:", error);
      res.status(500).json({ error: "Failed to create ranking" });
    }
  });

  app.put("/api/admin/rankings/:id", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertRankingSchema.partial().parse(req.body);
      const updated = await storage.updateRanking(req.params.id, validatedData);
      if (!updated) {
        return res.status(404).json({ error: "Ranking not found" });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Update ranking error:", error);
      res.status(500).json({ error: "Failed to update ranking" });
    }
  });

  app.delete("/api/admin/rankings/:id", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteRanking(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Ranking not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete ranking error:", error);
      res.status(500).json({ error: "Failed to delete ranking" });
    }
  });

  // =============================================
  // ADMIN AWARDS CRUD
  // =============================================
  
  app.get("/api/admin/awards", authMiddleware, requirePermission("content"), async (_req: Request, res: Response) => {
    try {
      const awardsList = await storage.getAwards();
      res.json(awardsList);
    } catch (error) {
      console.error("Get awards error:", error);
      res.status(500).json({ error: "Failed to fetch awards" });
    }
  });

  app.post("/api/admin/awards", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertAwardSchema.parse(req.body);
      const award = await storage.createAward(validatedData);
      res.json(award);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Create award error:", error);
      res.status(500).json({ error: "Failed to create award" });
    }
  });

  app.put("/api/admin/awards/:id", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertAwardSchema.partial().parse(req.body);
      const updated = await storage.updateAward(req.params.id, validatedData);
      if (!updated) {
        return res.status(404).json({ error: "Award not found" });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Update award error:", error);
      res.status(500).json({ error: "Failed to update award" });
    }
  });

  app.delete("/api/admin/awards/:id", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteAward(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Award not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete award error:", error);
      res.status(500).json({ error: "Failed to delete award" });
    }
  });

  // =============================================
  // ADMIN REPRESENTATIVE CLIENTS CRUD
  // =============================================
  
  app.get("/api/admin/clients", authMiddleware, requirePermission("content"), async (_req: Request, res: Response) => {
    try {
      const clientsList = await storage.getRepresentativeClients();
      res.json(clientsList);
    } catch (error) {
      console.error("Get clients error:", error);
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.post("/api/admin/clients", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertRepresentativeClientSchema.parse(req.body);
      const client = await storage.createRepresentativeClient(validatedData);
      res.json(client);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Create client error:", error);
      res.status(500).json({ error: "Failed to create client" });
    }
  });

  app.put("/api/admin/clients/:id", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertRepresentativeClientSchema.partial().parse(req.body);
      const updated = await storage.updateRepresentativeClient(req.params.id, validatedData);
      if (!updated) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Update client error:", error);
      res.status(500).json({ error: "Failed to update client" });
    }
  });

  app.delete("/api/admin/clients/:id", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteRepresentativeClient(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete client error:", error);
      res.status(500).json({ error: "Failed to delete client" });
    }
  });

  // =============================================
  // ADMIN TESTIMONIALS CRUD
  // =============================================
  
  app.get("/api/admin/testimonials", authMiddleware, requirePermission("content"), async (_req: Request, res: Response) => {
    try {
      const testimonialsList = await storage.getTestimonials();
      res.json(testimonialsList);
    } catch (error) {
      console.error("Get testimonials error:", error);
      res.status(500).json({ error: "Failed to fetch testimonials" });
    }
  });

  app.post("/api/admin/testimonials", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertTestimonialSchema.parse(req.body);
      const testimonial = await storage.createTestimonial(validatedData);
      res.json(testimonial);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Create testimonial error:", error);
      res.status(500).json({ error: "Failed to create testimonial" });
    }
  });

  app.put("/api/admin/testimonials/:id", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertTestimonialSchema.partial().parse(req.body);
      const updated = await storage.updateTestimonial(req.params.id, validatedData);
      if (!updated) {
        return res.status(404).json({ error: "Testimonial not found" });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Update testimonial error:", error);
      res.status(500).json({ error: "Failed to update testimonial" });
    }
  });

  app.delete("/api/admin/testimonials/:id", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteTestimonial(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Testimonial not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete testimonial error:", error);
      res.status(500).json({ error: "Failed to delete testimonial" });
    }
  });

  // =============================================
  // ADMIN JOB OPENINGS CRUD
  // =============================================
  
  app.get("/api/admin/jobs", authMiddleware, requirePermission("content"), async (_req: Request, res: Response) => {
    try {
      const jobsList = await storage.getJobOpenings();
      res.json(jobsList);
    } catch (error) {
      console.error("Get jobs error:", error);
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  app.post("/api/admin/jobs", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertJobOpeningSchema.parse(req.body);
      const job = await storage.createJobOpening(validatedData);
      res.json(job);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Create job error:", error);
      res.status(500).json({ error: "Failed to create job" });
    }
  });

  app.put("/api/admin/jobs/:id", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertJobOpeningSchema.partial().parse(req.body);
      const updated = await storage.updateJobOpening(req.params.id, validatedData);
      if (!updated) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Update job error:", error);
      res.status(500).json({ error: "Failed to update job" });
    }
  });

  app.delete("/api/admin/jobs/:id", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteJobOpening(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete job error:", error);
      res.status(500).json({ error: "Failed to delete job" });
    }
  });

  // =============================================
  // ADMIN OFFICES CRUD
  // =============================================
  
  app.get("/api/admin/offices", authMiddleware, requirePermission("content"), async (_req: Request, res: Response) => {
    try {
      const officesList = await storage.getOffices();
      res.json(officesList);
    } catch (error) {
      console.error("Get offices error:", error);
      res.status(500).json({ error: "Failed to fetch offices" });
    }
  });

  app.post("/api/admin/offices", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertOfficeSchema.parse(req.body);
      const office = await storage.createOffice(validatedData);
      res.json(office);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Create office error:", error);
      res.status(500).json({ error: "Failed to create office" });
    }
  });

  app.put("/api/admin/offices/:id", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertOfficeSchema.partial().parse(req.body);
      const updated = await storage.updateOffice(req.params.id, validatedData);
      if (!updated) {
        return res.status(404).json({ error: "Office not found" });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Update office error:", error);
      res.status(500).json({ error: "Failed to update office" });
    }
  });

  app.delete("/api/admin/offices/:id", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteOffice(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Office not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete office error:", error);
      res.status(500).json({ error: "Failed to delete office" });
    }
  });

  // =============================================
  // ADMIN ALLIANCES CRUD
  // =============================================
  
  app.get("/api/admin/alliances", authMiddleware, requirePermission("content"), async (_req: Request, res: Response) => {
    try {
      const alliancesList = await storage.getAlliances();
      res.json(alliancesList);
    } catch (error) {
      console.error("Get alliances error:", error);
      res.status(500).json({ error: "Failed to fetch alliances" });
    }
  });

  app.post("/api/admin/alliances", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertAllianceSchema.parse(req.body);
      const alliance = await storage.createAlliance(validatedData);
      res.json(alliance);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Create alliance error:", error);
      res.status(500).json({ error: "Failed to create alliance" });
    }
  });

  app.put("/api/admin/alliances/:id", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertAllianceSchema.partial().parse(req.body);
      const updated = await storage.updateAlliance(req.params.id, validatedData);
      if (!updated) {
        return res.status(404).json({ error: "Alliance not found" });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Update alliance error:", error);
      res.status(500).json({ error: "Failed to update alliance" });
    }
  });

  app.delete("/api/admin/alliances/:id", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteAlliance(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Alliance not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete alliance error:", error);
      res.status(500).json({ error: "Failed to delete alliance" });
    }
  });

  // =============================================
  // ADMIN CONTACT SUBMISSIONS
  // =============================================

  app.get("/api/admin/contact-submissions", authMiddleware, requirePermission("contact_submissions"), async (_req: Request, res: Response) => {
    try {
      const submissions = await storage.getContactSubmissions();
      res.json(submissions);
    } catch (error) {
      console.error("Get contact submissions error:", error);
      res.status(500).json({ error: "Failed to fetch contact submissions" });
    }
  });

  app.patch("/api/admin/contact-submissions/:id/read", authMiddleware, requirePermission("contact_submissions"), async (req: Request, res: Response) => {
    try {
      const found = await storage.markContactSubmissionRead(req.params.id);
      if (!found) {
        return res.status(404).json({ error: "Submission not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Mark contact submission read error:", error);
      res.status(500).json({ error: "Failed to update submission" });
    }
  });

  app.get("/api/admin/career-applications", authMiddleware, requirePermission("career_applications"), async (_req: Request, res: Response) => {
    try {
      const applications = await storage.getCareerApplications();
      res.json(applications);
    } catch (error) {
      console.error("Get career applications error:", error);
      res.status(500).json({ error: "Failed to fetch career applications" });
    }
  });

  app.get("/api/admin/career-applications/:id/cv", authMiddleware, requirePermission("career_applications"), requirePermission("private_downloads"), async (req: Request, res: Response) => {
    try {
      if (!z.string().uuid().safeParse(req.params.id).success) {
        return res.status(404).json({ error: "Application not found" });
      }
      const application = await storage.getCareerApplication(req.params.id);
      if (!application) return res.status(404).json({ error: "Application not found" });

      let absolutePath = resolvePrivateCvStoragePath(application.cvPath);
      if (!absolutePath && application.cvPath.startsWith("/uploads/")) {
        const legacyName = path.basename(application.cvPath);
        const legacyPath = path.resolve(uploadsDir, legacyName);
        if (path.dirname(legacyPath) === path.resolve(uploadsDir)) absolutePath = legacyPath;
      }
      if (!absolutePath || !fs.existsSync(absolutePath)) {
        return res.status(404).json({ error: "Document not found" });
      }

      const original = (application.cvOriginalName || path.basename(absolutePath))
        .replace(/[\r\n"\\]/g, "_")
        .slice(0, 180);
      const fallback = original.replace(/[^\x20-\x7e]/g, "_") || "cv";
      const extension = path.extname(absolutePath).toLowerCase();
      const contentType = extension === ".pdf"
        ? "application/pdf"
        : extension === ".docx"
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : "application/msword";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(original)}`);
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Content-Security-Policy", "sandbox");
      res.setHeader("Cache-Control", "private, no-store");
      auditLog("update", "career_application_cv_download", application.id, req.adminUser!.id);
      res.sendFile(absolutePath);
    } catch {
      res.status(500).json({ error: "Failed to download document" });
    }
  });

  app.patch("/api/admin/career-applications/:id/read", authMiddleware, requirePermission("career_applications"), async (req: Request, res: Response) => {
    try {
      const found = await storage.markCareerApplicationRead(req.params.id);
      if (!found) {
        return res.status(404).json({ error: "Application not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Mark career application read error:", error);
      res.status(500).json({ error: "Failed to update application" });
    }
  });

  // =============================================
  // ADMIN NEWSLETTER SUBSCRIBERS
  // =============================================
  const newsletterFilters = (req: Request) => {
    const search = typeof req.query.search === "string" ? req.query.search.slice(0, 160) : undefined;
    const state = typeof req.query.active === "string" ? req.query.active : "all";
    return { search, active: state === "active" ? true : state === "inactive" ? false : undefined };
  };

  app.get("/api/admin/newsletter-subscribers", authMiddleware, requirePermission("newsletter"), async (req: Request, res: Response) => {
    try {
      const subscribers = await storage.getNewsletterSubscribers(newsletterFilters(req));
      res.json(subscribers);
    } catch (error) {
      console.error("Get newsletter subscribers error:", error);
      res.status(500).json({ error: "Failed to fetch newsletter subscribers" });
    }
  });

  app.patch("/api/admin/newsletter-subscribers/:id/active", authMiddleware, requirePermission("newsletter"), async (req: Request, res: Response) => {
    try {
      const body = z.object({ isActive: z.boolean() }).safeParse(req.body);
      if (!body.success) return res.status(400).json({ error: "Validation failed", details: body.error.errors });
      const subscriber = await storage.updateNewsletterSubscriber(req.params.id, {
        isActive: body.data.isActive,
        unsubscribedAt: body.data.isActive ? null : new Date(),
      });
      if (!subscriber) return res.status(404).json({ error: "Subscriber not found" });
      res.json(subscriber);
    } catch (error) {
      console.error("Update newsletter subscriber error:", error);
      res.status(500).json({ error: "Failed to update newsletter subscriber" });
    }
  });

  app.get("/api/admin/newsletter-subscribers/export.csv", authMiddleware, requirePermission("newsletter"), requirePermission("exports"), async (req: Request, res: Response) => {
    try {
      const subscribers = await storage.getNewsletterSubscribers(newsletterFilters(req));
      const header = ["Nombre", "Correo", "Empresa", "Idioma", "Fecha de suscripción", "Consentimiento", "Origen", "Estado"];
      const rows = subscribers.map((subscriber) => [
        subscriber.name,
        subscriber.email,
        subscriber.company,
        subscriber.preferredLanguage,
        subscriber.subscribedAt?.toISOString() ?? "",
        subscriber.consentedAt?.toISOString() ?? "",
        subscriber.source,
        subscriber.isActive ? "Activo" : "Inactivo",
      ]);
      const csv = [header, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
      auditLog(
        "create",
        "newsletter_export",
        null,
        req.adminUser!.id,
        { rowCount: subscribers.length, filtered: Object.values(newsletterFilters(req)).some((value) => value !== undefined) },
      );
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Content-Disposition", "attachment; filename=newsletter-subscribers.csv");
      res.send(`\uFEFF${csv}`);
    } catch (error) {
      console.error("Export newsletter subscribers error:", error);
      res.status(500).json({ error: "Failed to export newsletter subscribers" });
    }
  });

  // El CRUD de Desks queda retirado, pero las tablas y relaciones se conservan
  // como respaldo. Responder 410 evita que la SPA devuelva su HTML por defecto
  // a integraciones antiguas y deja claro que ya no es una API disponible.
  const retiredDeskApi = (_req: Request, res: Response) => {
    res.status(410).json({ error: "The Desk API has been retired" });
  };
  app.all(["/api/admin/desks", "/api/admin/desks/:id", "/api/admin/desks/:id/team"], retiredDeskApi);

  // =============================================
  // AGENT KNOWLEDGE CRUD (Admin)
  // =============================================

  app.get("/api/admin/knowledge", authMiddleware, requirePermission("content"), async (_req: Request, res: Response) => {
    try {
      const { dbPersistence } = await import('./agents/storage/DatabasePersistence');
      const documents = await dbPersistence.getAllKnowledge();
      res.json(documents);
    } catch (error) {
      console.error("Get knowledge error:", error);
      res.status(500).json({ error: "Failed to fetch knowledge documents" });
    }
  });

  app.post("/api/admin/knowledge", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const { category, title, content, agentType, metadata } = req.body;
      if (!category || !title || !content || !agentType) {
        return res.status(400).json({ error: "Missing required fields: category, title, content, agentType" });
      }
      const { dbPersistence } = await import('./agents/storage/DatabasePersistence');
      const document = await dbPersistence.createKnowledge({
        category,
        title,
        content,
        agentType,
        metadata: metadata || {},
      });
      res.status(201).json(document);
    } catch (error) {
      console.error("Create knowledge error:", error);
      res.status(500).json({ error: "Failed to create knowledge document" });
    }
  });

  app.put("/api/admin/knowledge/:id", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { category, title, content, agentType, metadata } = req.body;
      const { dbPersistence } = await import('./agents/storage/DatabasePersistence');
      const existing = await dbPersistence.getKnowledge(id);
      if (!existing) {
        return res.status(404).json({ error: "Knowledge document not found" });
      }
      const updated = await dbPersistence.updateKnowledge(id, {
        ...(category && { category }),
        ...(title && { title }),
        ...(content && { content }),
        ...(agentType && { agentType }),
        ...(metadata && { metadata }),
      });
      res.json(updated);
    } catch (error) {
      console.error("Update knowledge error:", error);
      res.status(500).json({ error: "Failed to update knowledge document" });
    }
  });

  app.delete("/api/admin/knowledge/:id", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { dbPersistence } = await import('./agents/storage/DatabasePersistence');
      const existing = await dbPersistence.getKnowledge(id);
      if (!existing) {
        return res.status(404).json({ error: "Knowledge document not found" });
      }
      await dbPersistence.deleteKnowledge(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete knowledge error:", error);
      res.status(500).json({ error: "Failed to delete knowledge document" });
    }
  });

  app.post("/api/admin/knowledge/bulk", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const { items } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Items array is required" });
      }
      const { dbPersistence } = await import('./agents/storage/DatabasePersistence');
      let created = 0;
      for (const item of items) {
        if (item.category && item.title && item.content && item.agentType) {
          await dbPersistence.createKnowledge({
            category: item.category,
            title: item.title,
            content: item.content,
            agentType: item.agentType,
            metadata: item.metadata || {},
          });
          created++;
        }
      }
      res.status(201).json({ created, total: items.length });
    } catch (error) {
      console.error("Bulk create knowledge error:", error);
      res.status(500).json({ error: "Failed to bulk create knowledge documents" });
    }
  });

  // =============================================
  // MEDIA ITEMS CRUD
  // =============================================

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

      res.json(Array.from(reusable.values()));
    } catch (error) {
      console.error("Get media error:", error);
      res.status(500).json({ error: "Failed to fetch media" });
    }
  });

  // Upload media
  app.post("/api/admin/media/upload", authMiddleware, requirePermission("content"), upload.single("file"), async (req: Request, res: Response) => {
    let acceptedMediaPath: string | undefined;
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      if (!await validatePublicMediaSignature(req.file.path, req.file.mimetype)) {
        await removeUploadQuietly(req.file.path);
        return res.status(400).json({ error: "El contenido del archivo no coincide con su formato." });
      }
      await scanFileForMalware(req.file.path);
      acceptedMediaPath = await acceptQuarantinedPublicMedia(req.file.path, uploadsDir);
      req.file.path = acceptedMediaPath;

      // Imágenes pesadas (>1MB) se redimensionan/recomprimen antes de registrar el tamaño real.
      // Video no se toca en esta ronda (requiere ffmpeg, ver server/media/optimizeVideo.ts).
      let finalSize = req.file.size;
      const optimizedSize = await optimizeImageIfNeeded(req.file.path, req.file.mimetype, req.file.size);
      if (optimizedSize != null) finalSize = optimizedSize;

      const mediaItem = await storage.createMediaItem({
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: `/uploads/${req.file.filename}`,
        mimeType: req.file.mimetype,
        size: finalSize,
        uploadedBy: req.adminUser!.id,
        alt: req.body.alt || null,
        altEs: req.body.altEs || null,
      });

      res.status(201).json(mediaItem);
    } catch (error) {
      await removeUploadQuietly(req.file?.path);
      await removeUploadQuietly(acceptedMediaPath);
      console.error("Upload media validation failed");
      res.status(500).json({ error: "Failed to validate uploaded file" });
    }
  });

  // Delete media item
  app.delete("/api/admin/media/:id", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteMediaItem(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Media item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete media error:", error);
      res.status(500).json({ error: "Failed to delete media" });
    }
  });

  // =============================================
  // NEWS-TEAM MEMBERS RELATIONSHIP (Admin)
  // =============================================

  // Add a team member to a news article
  app.post("/api/news/:id/team-members", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const newsId = req.params.id;
      const { teamMemberId } = req.body;

      if (!teamMemberId) {
        return res.status(400).json({ error: "teamMemberId is required" });
      }

      const newsItem = await storage.getNewsById(newsId);
      if (!newsItem) {
        return res.status(404).json({ error: "News not found" });
      }

      const teamMember = await storage.getTeamMemberById(teamMemberId);
      if (!teamMember) {
        return res.status(404).json({ error: "Team member not found" });
      }

      await storage.addTeamMemberToNews(newsId, teamMemberId);
      res.status(201).json({ success: true, message: "Team member added to news article" });
    } catch (error) {
      console.error("Add team member to news error:", error);
      res.status(500).json({ error: "Failed to add team member to news" });
    }
  });

  // Remove a team member from a news article
  app.delete("/api/news/:id/team-members/:teamMemberId", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const { id: newsId, teamMemberId } = req.params;

      const newsItem = await storage.getNewsById(newsId);
      if (!newsItem) {
        return res.status(404).json({ error: "News not found" });
      }

      await storage.removeTeamMemberFromNews(newsId, teamMemberId);
      res.json({ success: true, message: "Team member removed from news article" });
    } catch (error) {
      console.error("Remove team member from news error:", error);
      res.status(500).json({ error: "Failed to remove team member from news" });
    }
  });

  // =============================================
  // LEGAL COUNCIL API (Human-in-the-Loop)
  // =============================================

  // POST /api/news/:id/validate - Validate and publish article
  app.post("/api/news/:id/validate", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const newsItem = await storage.getNewsById(id);
      
      if (!newsItem) {
        return res.status(404).json({ error: "News article not found" });
      }

      // Only allow validation if ready_for_approval
      if (newsItem.processingStatus !== 'ready_for_approval') {
        return res.status(400).json({ 
          error: "Article must be ready for approval before validation",
          currentStatus: newsItem.processingStatus 
        });
      }

      // Check council verdict exists and is approved
      const verdict = newsItem.councilVerdict as any;
      if (!verdict || verdict.overallStatus === 'rejected') {
        return res.status(400).json({ 
          error: "Article was rejected by the Legal Council",
          verdict 
        });
      }

      // Update status to ready (published)
      await storage.updateNews(id, {
        processingStatus: 'ready',
        published: true,
        lastProcessedAt: new Date(),
      });

      res.json({ 
        success: true, 
        message: "Article validated and published successfully",
        newStatus: 'ready'
      });
    } catch (error) {
      console.error("Validate article error:", error);
      res.status(500).json({ error: "Failed to validate article" });
    }
  });

  // POST /api/news/:id/council-review - Re-run council review
  app.post("/api/news/:id/council-review", authMiddleware, requirePermission("content"), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const newsItem = await storage.getNewsById(id);
      
      if (!newsItem) {
        return res.status(404).json({ error: "News article not found" });
      }

      if (!newsItem.content) {
        return res.status(400).json({ error: "Article has no content to review" });
      }

      // Import and run Legal Council
      const { legalCouncilService } = await import('../services/agents/LegalCouncilService');
      const verdict = await legalCouncilService.evaluateArticle(newsItem.content);

      // Update article with new verdict
      const newStatus = verdict.overallStatus === 'rejected' ? 'failed' : 'ready_for_approval';
      await storage.updateNews(id, {
        councilVerdict: verdict,
        processingStatus: newStatus,
        lastProcessedAt: new Date(),
        failedStep: verdict.overallStatus === 'rejected' ? 'council' : null,
      });

      res.json({ 
        success: true, 
        verdict,
        newStatus
      });
    } catch (error) {
      console.error("Council review error:", error);
      res.status(500).json({ error: "Failed to run council review" });
    }
  });

  // =============================================
  // TRANSLATION API (AI-powered)
  // =============================================

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

  // =============================================
  // TRANSLATION CACHE API
  // =============================================

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

  // =============================================
  // ARTICLE PROCESSING PIPELINE (AI Translation)
  // =============================================

  // Generate image for article
  app.post("/api/agents/generate-image/:articleId", authMiddleware, requirePermission("agents"), async (req: Request, res: Response) => {
    try {
      const { articleId } = req.params;
      
      const article = await storage.getNewsById(articleId);
      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }

      // Use ImageSuggestionAgent
      const { imageSuggestionAgent } = await import('./agents');
      const context = {
        jobId: `img-${articleId}-${Date.now()}`,
        agentType: 'image_suggestion' as any,
        startTime: new Date(),
        metadata: { articleId },
      };

      const result = await imageSuggestionAgent.execute(context, { articleId });

      if (result.success && result.data) {
        res.json({
          success: true,
          ...result.data,
        });
      } else {
        res.status(500).json({ error: result.error || "Failed to generate image" });
      }
    } catch (error) {
      console.error("Image generation error:", error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });

  // Process single article - FULL RAG AGENTIC PIPELINE
  // Runs ALL agents in sequence: Format → Categorize → Link Metadata → SEO → Translate → Image
  app.post("/api/agents/pipeline/:articleId", authMiddleware, requirePermission("agents"), async (req: Request, res: Response) => {
    try {
      const { articleId } = req.params;
      const { generateImage = false } = req.body;
      
      const article = await storage.getNewsById(articleId);
      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }

      const { 
        formatterAgent, 
        categoryAgent, 
        metadataLinkerAgent, 
        seoOptimizerAgent, 
        polyglotTranslatorAgent,
        imageSuggestionAgent 
      } = await import('./agents');

      const createContext = (agentType: string) => ({
        jobId: `${agentType}-${articleId}-${Date.now()}`,
        agentType: agentType as any,
        startTime: new Date(),
        metadata: { articleId },
      });

      const pipelineResults: Record<string, any> = {
        articleId,
        steps: {},
        success: true,
        errors: [],
      };

      const totalSteps = generateImage ? 6 : 5;
      const completedSteps = new Set<string>();

      // Helper to broadcast progress - only count unique step completions
      const emitProgress = (step: string, status: 'running' | 'completed' | 'error', language?: string, message?: string) => {
        let progress = 0;
        if (status === 'completed' && !completedSteps.has(step)) {
          completedSteps.add(step);
        }
        progress = Math.round((completedSteps.size / totalSteps) * 100);
        
        broadcastPipelineProgress(articleId, {
          step,
          status,
          language,
          progress,
          message,
        });
      };

      // Step 1: FORMAT - Clean and structure the article text
      console.log(`[Pipeline] Step 1: Formatting article ${articleId}`);
      emitProgress('format', 'running', undefined, 'Cleaning article text...');
      try {
        const formatResult = await formatterAgent.execute(
          createContext('formatter'),
          { articleId }
        );
        pipelineResults.steps.format = { 
          success: formatResult.success, 
          data: formatResult.data,
          error: formatResult.error 
        };
        emitProgress('format', formatResult.success ? 'completed' : 'error', undefined, formatResult.success ? 'Article formatted' : formatResult.error);
      } catch (err: any) {
        pipelineResults.steps.format = { success: false, error: "Formatting failed" };
        pipelineResults.errors.push("Format: failed");
        emitProgress('format', 'error', undefined, "Formatting failed");
      }

      // Step 2: CATEGORIZE - Automatically categorize for SEO
      console.log(`[Pipeline] Step 2: Categorizing article ${articleId}`);
      emitProgress('categorize', 'running', undefined, 'Categorizing article...');
      try {
        const categoryResult = await categoryAgent.execute(
          createContext('category_agent'),
          { articleId }
        );
        pipelineResults.steps.categorize = { 
          success: categoryResult.success, 
          data: categoryResult.data,
          error: categoryResult.error 
        };
        emitProgress('categorize', categoryResult.success ? 'completed' : 'error', undefined, 
          categoryResult.success ? `Category: ${(categoryResult.data as any)?.primaryCategory || 'assigned'}` : categoryResult.error);
      } catch (err: any) {
        pipelineResults.steps.categorize = { success: false, error: "Categorization failed" };
        pipelineResults.errors.push("Categorize: failed");
        emitProgress('categorize', 'error', undefined, "Categorization failed");
      }

      // Step 3: LINK METADATA - Connect to authors, practice areas, industries
      console.log(`[Pipeline] Step 3: Linking metadata for article ${articleId}`);
      emitProgress('metadata', 'running', undefined, 'Linking authors and practice areas...');
      try {
        const metadataResult = await metadataLinkerAgent.execute(
          createContext('metadata_linker'),
          { articleId }
        );
        pipelineResults.steps.metadata = { 
          success: metadataResult.success, 
          data: metadataResult.data,
          error: metadataResult.error 
        };
        emitProgress('metadata', metadataResult.success ? 'completed' : 'error', undefined, 
          metadataResult.success ? 'Metadata linked' : metadataResult.error);
      } catch (err: any) {
        pipelineResults.steps.metadata = { success: false, error: "Metadata linking failed" };
        pipelineResults.errors.push("Metadata: failed");
        emitProgress('metadata', 'error', undefined, "Metadata linking failed");
      }

      // Step 4: SEO OPTIMIZE - Improve titles, descriptions, slugs
      console.log(`[Pipeline] Step 4: SEO optimizing article ${articleId}`);
      emitProgress('seo', 'running', undefined, 'Optimizing for SEO...');
      try {
        const seoResult = await seoOptimizerAgent.execute(
          createContext('seo_optimizer'),
          { articleId }
        );
        pipelineResults.steps.seo = { 
          success: seoResult.success, 
          data: seoResult.data,
          error: seoResult.error 
        };
        emitProgress('seo', seoResult.success ? 'completed' : 'error', undefined, 
          seoResult.success ? 'SEO optimized' : seoResult.error);
      } catch (err: any) {
        pipelineResults.steps.seo = { success: false, error: "SEO optimization failed" };
        pipelineResults.errors.push("SEO: failed");
        emitProgress('seo', 'error', undefined, "SEO optimization failed");
      }

      // Step 5: TRANSLATE - Translate to all 9 target languages (source is Spanish)
      const targetLanguages = ['en', 'de', 'zh', 'ko', 'ja', 'ar', 'ru', 'fr', 'it'];
      console.log(`[Pipeline] Step 5: Translating article ${articleId} to ${targetLanguages.length} languages`);
      emitProgress('translate', 'running', undefined, `Translating to ${targetLanguages.length} languages...`);
      
      try {
        const translateResult = await polyglotTranslatorAgent.execute(
          createContext('polyglot_translator'),
          { articleId }
        );
        pipelineResults.steps.translate = { 
          success: translateResult.success, 
          data: translateResult.data,
          error: translateResult.error 
        };
        
        const translatedCount = (translateResult.data as any)?.translatedCount || 0;
        const cachedCount = (translateResult.data as any)?.cachedCount || 0;
        emitProgress('translate', translateResult.success ? 'completed' : 'error', undefined, 
          translateResult.success 
            ? `Translated: ${translatedCount} new, ${cachedCount} cached` 
            : translateResult.error);
      } catch (err: any) {
        pipelineResults.steps.translate = { success: false, error: "Translation failed" };
        pipelineResults.errors.push("Translate: failed");
        emitProgress('translate', 'error', undefined, "Translation failed");
      }

      // Step 6: GENERATE IMAGE (optional)
      if (generateImage) {
        console.log(`[Pipeline] Step 6: Generating image for article ${articleId}`);
        emitProgress('image', 'running', undefined, 'Generating article image with DALL-E...');
        try {
          const imageResult = await imageSuggestionAgent.execute(
            createContext('image_suggestion'),
            { articleId }
          );
          pipelineResults.steps.image = { 
            success: imageResult.success, 
            data: imageResult.data,
            error: imageResult.error 
          };
          emitProgress('image', imageResult.success ? 'completed' : 'error', undefined, 
            imageResult.success ? 'Image generated' : imageResult.error);
        } catch (err: any) {
          pipelineResults.steps.image = { success: false, error: "Image generation failed" };
          pipelineResults.errors.push("Image: failed");
          emitProgress('image', 'error', undefined, "Image generation failed");
        }
      }

      // Calculate overall success - IMAGE FAILURES DO NOT FAIL THE PIPELINE
      // Core steps: format, categorize, metadata, seo, translate
      // Optional step: image (failure = warning, not error)
      const coreStepKeys = ['format', 'categorize', 'metadata', 'seo', 'translate'];
      const coreSteps = coreStepKeys
        .filter(key => pipelineResults.steps[key])
        .map(key => ({ key, ...pipelineResults.steps[key] }));
      
      const successfulCoreSteps = coreSteps.filter(s => s.success).length;
      const totalCoreSteps = coreSteps.length;
      
      // Image is optional - its failure is a warning, not an error
      const imageStep = pipelineResults.steps.image;
      const imageWarning = imageStep && !imageStep.success;
      
      const stepResults = Object.values(pipelineResults.steps) as any[];
      const successfulSteps = stepResults.filter(s => s.success).length;
      pipelineResults.successfulSteps = successfulSteps;
      pipelineResults.totalSteps = stepResults.length;
      
      // SUCCESS = all core steps passed (image failure is acceptable)
      pipelineResults.success = successfulCoreSteps === totalCoreSteps;
      pipelineResults.partialSuccess = pipelineResults.success && imageWarning;
      pipelineResults.imageWarning = imageWarning ? (imageStep?.error || 'Image generation failed') : null;

      console.log(`[Pipeline] Completed: ${successfulCoreSteps}/${totalCoreSteps} core steps successful${imageWarning ? ' (image warning)' : ''}`);
      
      // Broadcast completion
      broadcastPipelineProgress(articleId, {
        step: 'complete',
        status: 'completed',
        progress: 100,
        message: `Pipeline complete: ${successfulSteps}/${stepResults.length} steps successful`,
        data: pipelineResults,
      });

      res.json(pipelineResults);
    } catch (error: any) {
      console.error("Pipeline error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to process article pipeline",
      });
    }
  });

  // Process all articles - FULL RAG AGENTIC PIPELINE for all articles
  app.post("/api/agents/pipeline/process-all", authMiddleware, requirePermission("agents"), async (req: Request, res: Response) => {
    try {
      const allNews = await storage.getNews();
      
      if (!allNews || allNews.length === 0) {
        return res.json({ success: true, total: 0, successful: 0, message: "No articles to process" });
      }

      const { generateImage = false } = req.body;
      const { 
        formatterAgent, 
        categoryAgent, 
        metadataLinkerAgent, 
        seoOptimizerAgent, 
        polyglotTranslatorAgent,
        imageSuggestionAgent 
      } = await import('./agents');

      const createContext = (agentType: string, articleId: string) => ({
        jobId: `${agentType}-${articleId}-${Date.now()}`,
        agentType: agentType as any,
        startTime: new Date(),
        metadata: { articleId },
      });

      let successfulCount = 0;
      const results: Record<string, any>[] = [];

      for (const article of allNews) {
        console.log(`[Pipeline] Processing article ${article.id}: ${article.titleEs?.substring(0, 50)}...`);
        const articleResult: Record<string, any> = { 
          articleId: article.id, 
          title: article.titleEs,
          steps: {},
          success: false 
        };

        try {
          // Step 1: FORMAT
          try {
            const formatResult = await formatterAgent.execute(
              createContext('formatter', article.id),
              { articleId: article.id }
            );
            articleResult.steps.format = { success: formatResult.success };
          } catch (err: any) {
            console.error(`[Pipeline] Format error for ${article.id}:`, err.message);
            articleResult.steps.format = { success: false, error: "Formatting failed" };
          }

          // Step 2: CATEGORIZE
          try {
            const categoryResult = await categoryAgent.execute(
              createContext('category_agent', article.id),
              { articleId: article.id }
            );
            articleResult.steps.categorize = { success: categoryResult.success };
          } catch (err: any) {
            console.error(`[Pipeline] Categorize error for ${article.id}:`, err.message);
            articleResult.steps.categorize = { success: false, error: "Categorization failed" };
          }

          // Step 3: METADATA
          try {
            const metadataResult = await metadataLinkerAgent.execute(
              createContext('metadata_linker', article.id),
              { articleId: article.id }
            );
            articleResult.steps.metadata = { success: metadataResult.success };
          } catch (err: any) {
            console.error(`[Pipeline] Metadata error for ${article.id}:`, err.message);
            articleResult.steps.metadata = { success: false, error: "Metadata linking failed" };
          }

          // Step 4: SEO
          try {
            const seoResult = await seoOptimizerAgent.execute(
              createContext('seo_optimizer', article.id),
              { articleId: article.id }
            );
            articleResult.steps.seo = { success: seoResult.success };
          } catch (err: any) {
            console.error(`[Pipeline] SEO error for ${article.id}:`, err.message);
            articleResult.steps.seo = { success: false, error: "SEO optimization failed" };
          }

          // Step 5: TRANSLATE
          try {
            const translateResult = await polyglotTranslatorAgent.execute(
              createContext('polyglot_translator', article.id),
              { articleId: article.id }
            );
            articleResult.steps.translate = { success: translateResult.success };
          } catch (err: any) {
            console.error(`[Pipeline] Translate error for ${article.id}:`, err.message);
            articleResult.steps.translate = { success: false, error: "Translation failed" };
          }

          // Step 6: IMAGE (optional)
          if (generateImage) {
            try {
              console.log(`[Pipeline] Starting image generation for ${article.id}...`);
              const imageResult = await imageSuggestionAgent.execute(
                createContext('image_suggestion', article.id),
                { articleId: article.id }
              );
              console.log(`[Pipeline] Image result for ${article.id}:`, imageResult.success ? 'SUCCESS' : imageResult.error);
              articleResult.steps.image = { success: imageResult.success, error: imageResult.error };
            } catch (err: any) {
              console.error(`[Pipeline] Image generation error for ${article.id}:`, err.message);
              articleResult.steps.image = { success: false, error: "Image generation failed" };
            }
          }

          articleResult.success = true;
          successfulCount++;
        } catch (error) {
          console.error(`Error processing article ${article.id}:`, error);
        }

        results.push(articleResult);
      }

      res.json({
        success: true,
        total: allNews.length,
        successful: successfulCount,
        message: `Processed ${successfulCount} of ${allNews.length} articles`,
      });
    } catch (error) {
      console.error("Batch processing error:", error);
      res.status(500).json({ error: "Failed to process articles" });
    }
  });

  // Auto-Recovery Agent - Repairs failed articles with smart retry logic
  app.post("/api/agents/recover", authMiddleware, requirePermission("agents"), async (req: Request, res: Response) => {
    try {
      console.log('[Recovery] Starting auto-recovery for failed articles...');
      const { recoverFailedItems, getFailedArticlesSummary } = await import('./agents/AutoRecoveryAgent');
      
      const summary = await getFailedArticlesSummary();
      console.log(`[Recovery] Found ${summary.total} failed articles`);
      
      if (summary.total === 0) {
        return res.json({
          success: true,
          message: 'No failed articles to recover',
          recovered: 0,
          stillFailed: 0
        });
      }
      
      const report = await recoverFailedItems();
      
      res.json({
        success: true,
        message: `Recovery complete: ${report.totalRecovered}/${report.totalFailed} articles recovered`,
        recovered: report.totalRecovered,
        stillFailed: report.totalStillFailed,
        results: report.results
      });
    } catch (error: any) {
      console.error('[Recovery] Error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Recovery failed',
      });
    }
  });

  // Get failed articles summary for diagnostics
  app.get("/api/agents/failed-summary", authMiddleware, requirePermission("agents"), async (req: Request, res: Response) => {
    try {
      const { getFailedArticlesSummary } = await import('./agents/AutoRecoveryAgent');
      const summary = await getFailedArticlesSummary();
      res.json({ success: true, ...summary });
    } catch (error: any) {
      console.error('[FailedSummary] Error:', error);
      res.status(500).json({ success: false, error: "Failed to load recovery summary" });
    }
  });

  // System Chronicler API - Nerve Center data
  app.get("/api/system/chronicler", authMiddleware, requirePermission("advanced"), async (req: Request, res: Response) => {
    try {
      const { systemChronicler } = await import('./agents/SystemChronicler');
      
      const agents = systemChronicler.getAllAgents();
      const timeline = systemChronicler.getEvolutionTimeline();
      const stats = systemChronicler.getSystemStats();
      
      res.json({
        success: true,
        agents,
        timeline,
        stats,
        categories: {
          brain: systemChronicler.getAgentsByCategory("brain"),
          hands: systemChronicler.getAgentsByCategory("hands"),
          shield: systemChronicler.getAgentsByCategory("shield")
        }
      });
    } catch (error: any) {
      console.error('[SystemChronicler] Error:', error);
      res.status(500).json({ success: false, error: "Failed to load system history" });
    }
  });

  // Record evolution event (admin only)
  app.post("/api/system/chronicler/evolution", authMiddleware, requirePermission("advanced"), async (req: Request, res: Response) => {
    try {
      const { systemChronicler } = await import('./agents/SystemChronicler');
      const parsed = z.object({
        title: z.string().trim().min(1).max(160),
        description: z.string().trim().min(1).max(2_000),
        agentId: z.string().trim().max(120).optional(),
        impact: z.enum(["minor", "major", "critical"]),
        category: z.enum(["security", "intelligence", "performance", "capability"]),
      }).strict().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: "Validation failed" });
      }
      const { title, description, agentId, impact, category } = parsed.data;
      
      systemChronicler.recordEvolution({
        title,
        description,
        agentId,
        impact,
        category
      });
      
      res.json({ success: true, message: 'Evolution recorded' });
    } catch (error: any) {
      console.error('[SystemChronicler] Error recording evolution:', error);
      res.status(500).json({ success: false, error: "Failed to record evolution" });
    }
  });

  // Website Audit API routes
  app.get("/api/audits", authMiddleware, requirePermission("advanced"), async (req: Request, res: Response) => {
    try {
      const parsed = z.coerce.number().int().min(1).max(100).default(20).safeParse(req.query.limit);
      if (!parsed.success) return res.status(400).json({ error: "Invalid limit" });
      const limit = parsed.data;
      const audits = await storage.getWebsiteAudits(limit);
      res.json({ success: true, audits });
    } catch (error) {
      console.error("Failed to get audits:", error);
      res.status(500).json({ error: "Failed to fetch audits" });
    }
  });

  app.get("/api/audits/latest", authMiddleware, requirePermission("advanced"), async (req: Request, res: Response) => {
    try {
      const audit = await storage.getLatestWebsiteAudit();
      if (!audit) {
        return res.json({ success: true, audit: null });
      }
      const findings = await storage.getWebsiteAuditFindings(audit.id);
      res.json({ success: true, audit, findings });
    } catch (error) {
      console.error("Failed to get latest audit:", error);
      res.status(500).json({ error: "Failed to fetch latest audit" });
    }
  });

  app.get("/api/audits/:id", authMiddleware, requirePermission("advanced"), async (req: Request, res: Response) => {
    try {
      const audit = await storage.getWebsiteAudit(req.params.id);
      if (!audit) {
        return res.status(404).json({ error: "Audit not found" });
      }
      const findings = await storage.getWebsiteAuditFindings(audit.id);
      res.json({ success: true, audit, findings });
    } catch (error) {
      console.error("Failed to get audit:", error);
      res.status(500).json({ error: "Failed to fetch audit" });
    }
  });

  app.get("/api/audits/:id/findings", authMiddleware, requirePermission("advanced"), async (req: Request, res: Response) => {
    try {
      const { category, severity } = req.query;
      let findings;
      
      if (category) {
        findings = await storage.getWebsiteAuditFindingsByCategory(req.params.id, category as string);
      } else if (severity) {
        findings = await storage.getWebsiteAuditFindingsBySeverity(req.params.id, severity as string);
      } else {
        findings = await storage.getWebsiteAuditFindings(req.params.id);
      }
      
      res.json({ success: true, findings });
    } catch (error) {
      console.error("Failed to get audit findings:", error);
      res.status(500).json({ error: "Failed to fetch findings" });
    }
  });

  app.post("/api/audits/run", authMiddleware, requirePermission("advanced"), async (req: Request, res: Response) => {
    try {
      const { runType = 'full', skipModules } = req.body;
      
      const { orchestrator } = await import('./agents');
      
      const job = await orchestrator.enqueueJob(
        'website_auditor',
        {
          runType,
          skipModules,
          triggeredBy: 'manual',
        },
        { priority: 'high' }
      );
      
      if (!orchestrator.isProcessing()) {
        orchestrator.start();
      }
      
      res.json({ 
        success: true, 
        jobId: job.id,
        message: 'Audit job queued successfully. Check audit history for results.',
      });
    } catch (error) {
      console.error("Failed to run audit:", error);
      res.status(500).json({ error: "Failed to run audit" });
    }
  });

  app.get("/api/audits/findings/open", authMiddleware, requirePermission("advanced"), async (req: Request, res: Response) => {
    try {
      const findings = await storage.getOpenFindings();
      res.json({ success: true, findings });
    } catch (error) {
      console.error("Failed to get open findings:", error);
      res.status(500).json({ error: "Failed to fetch open findings" });
    }
  });

  // System Health Check - Deep Audit API
  // NOTE: Health check is intentionally public (read-only diagnostic).
  // Destructive operations like reset-zombies require auth.
  // Sin login exponía biografías de abogados, títulos/IDs de artículos y payloads internos de
  // jobs a cualquiera, además de correr 5 escaneos completos de tablas en cada request. Mismo
  // permiso que su ruta hermana /api/health-check/reset-zombies.
  app.get("/api/health-check/run", authMiddleware, requirePermission("advanced"), async (req: Request, res: Response) => {
    try {
      const { systemHealthCheck } = await import('./agents/SystemHealthCheck');
      const report = await systemHealthCheck.runDeepAudit();
      res.json({ 
        success: true, 
        report,
        humanReadable: systemHealthCheck.generateHumanReport(report),
      });
    } catch (error: any) {
      console.error("Health check failed:", error);
      res.status(500).json({ error: "Failed to run health check" });
    }
  });

  app.post("/api/health-check/reset-zombies", authMiddleware, requirePermission("advanced"), async (req: Request, res: Response) => {
    try {
      const { systemHealthCheck } = await import('./agents/SystemHealthCheck');
      const resetCount = await systemHealthCheck.resetZombieJobs();
      res.json({ 
        success: true, 
        message: `Reset ${resetCount} zombie jobs`,
        resetCount,
      });
    } catch (error: any) {
      console.error("Failed to reset zombies:", error);
      res.status(500).json({ error: "Failed to reset zombie jobs" });
    }
  });

  app.patch("/api/audits/findings/:id", authMiddleware, requirePermission("advanced"), async (req: Request, res: Response) => {
    try {
      const { status, resolvedBy } = req.body;
      
      if (status === 'resolved') {
        const finding = await storage.resolveWebsiteAuditFinding(req.params.id, resolvedBy || 'manual');
        return res.json({ success: true, finding });
      }
      
      const finding = await storage.updateWebsiteAuditFinding(req.params.id, { status });
      res.json({ success: true, finding });
    } catch (error) {
      console.error("Failed to update finding:", error);
      res.status(500).json({ error: "Failed to update finding" });
    }
  });

  // Agent system routes — PROTEGIDAS: disparar agentes/pipelines/colas requiere admin.
  const agentRoutes = await import('./agents/api/agentRoutes');
  app.use('/api/agents', authMiddleware, requirePermission("agents"), agentRoutes.default);

  // Initialize agents on normal server start. El smoke test de seguridad es
  // deliberadamente de solo lectura y no debe cargar conocimiento ni colas.
  if (process.env.SECURITY_READ_ONLY_SMOKE !== "true") {
    const { initializeAgents } = await import('./agents');
    initializeAgents().catch(err => console.error('[Agents] Initialization error:', err));
  }

  return httpServer;
}
