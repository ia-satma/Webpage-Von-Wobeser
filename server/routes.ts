import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { seed } from "./seed";
import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import multer from "multer";

// Global WebSocket clients map for pipeline progress updates
const pipelineClients: Map<string, WebSocket> = new Map();

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
  pipelineClients.forEach((client, clientId) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}
import { 
  contactFormSchema, 
  adminLoginSchema, 
  insertBlogPostSchema,
  insertBlogCategorySchema,
  insertBlogTagSchema,
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
  insertSpecializedDeskSchema,
  insertOfficeImageSchema,
  insertNewsletterSubscriberSchema,
  insertFaqSchema,
  insertProBonoProjectSchema,
  insertDiversityInitiativeSchema,
} from "@shared/schema";
import { ZodError } from "zod";
import {
  SUPPORTED_LANGUAGES,
  translateLegalText,
  translateMultipleTexts,
  suggestTranslation,
  type LanguageCode,
} from "./openai";
import {
  hashPassword,
  comparePassword,
  generateToken,
  getSessionExpiry,
  checkRateLimit,
  recordLoginAttempt,
  authMiddleware,
  requireRole,
} from "./auth";

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

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = crypto.randomBytes(8).toString("hex");
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${uniqueSuffix}${ext}`);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "application/pdf",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

function generateVCard(member: any, language: "es" | "en" = "es"): string {
  const title = language === "es" ? member.titleEs : member.title;
  const role = language === "es" ? member.roleEs : member.role;
  
  const safeName = member.name || member.slug?.replace(/-/g, ' ') || 'Unknown';
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
    lines.push(`EMAIL;TYPE=WORK:${member.email}`);
  }
  
  if (member.phone) {
    lines.push(`TEL;TYPE=WORK,VOICE:${member.phone}`);
  }
  
  lines.push(`ADR;TYPE=WORK:;;Torre SOMA Chapultepec Piso 18, Campos Elíseos 204;Ciudad de México;CDMX;11560;México`);
  lines.push(`URL:https://www.vonwobeser.com`);
  
  if (member.linkedinUrl) {
    lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${member.linkedinUrl}`);
  }
  
  if (member.imageUrl) {
    lines.push(`PHOTO;VALUE=URI:${member.imageUrl}`);
  }
  
  lines.push('END:VCARD');
  
  return lines.join('\r\n');
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // El seed se aísla: si la DB/seed falla, NO debe impedir que el server llegue a listen.
  // Antes un fallo aquí abortaba registerRoutes → la IIFE de arranque nunca alcanzaba
  // httpServer.listen() → "connection refused" → secciones vacías sin error claro.
  try {
    await seed();
  } catch (err) {
    console.error(`[seed] fallo, el server seguirá levantando: ${err instanceof Error ? err.stack ?? err.message : err}`);
  }

  // Setup WebSocket server for pipeline progress updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/pipeline' });
  
  // Heartbeat to detect stale connections
  const heartbeatInterval = setInterval(() => {
    pipelineClients.forEach((ws, clientId) => {
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
    // Authenticate via admin session token in the query string before accepting.
    try {
      const url = new URL(req.url || '', 'http://localhost');
      const token = url.searchParams.get('token');
      if (!token) { ws.close(1008, 'Auth required'); return; }
      const session = await storage.getAdminSession(token);
      if (!session || new Date() > session.expiresAt) { ws.close(1008, 'Invalid session'); return; }
    } catch {
      ws.close(1011, 'Auth error');
      return;
    }

    const clientId = crypto.randomBytes(8).toString('hex');
    pipelineClients.set(clientId, ws);
    console.log(`[WebSocket] Pipeline client connected: ${clientId}`);
    
    ws.on('close', () => {
      pipelineClients.delete(clientId);
      console.log(`[WebSocket] Pipeline client disconnected: ${clientId}`);
    });
    
    ws.on('error', (error) => {
      console.error(`[WebSocket] Client error ${clientId}:`, error);
      pipelineClients.delete(clientId);
    });

    ws.on('pong', () => {
      // Client is alive, nothing to do
    });
    
    // Send initial connection confirmation
    ws.send(JSON.stringify({ type: 'connected', clientId }));
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
    const { filename } = req.params;
    // Anti path-traversal: solo nombres simples (sin separadores), y sin '..'.
    if (!/^[A-Za-z0-9._-]+$/.test(filename) || filename.includes('..')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    const filePath = path.join(generatedImagesDir, filename);
    // Defensa en profundidad: el path resuelto debe quedar dentro del directorio.
    if (!filePath.startsWith(generatedImagesDir + path.sep)) {
      return res.status(400).json({ error: 'Invalid path' });
    }
    if (fs.existsSync(filePath)) {
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
      return res.sendFile(filePath);
    }
    res.status(404).json({ error: 'Image not found' });
  });

  app.use('/generated-images', express.static(generatedImagesDir, {
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

      // Skip geolocation for localhost/private IPs — use Accept-Language then English
      if (!clientIp || isPrivateIp(clientIp)) {
        const fromHeader = parseAcceptLanguage(req.headers["accept-language"]);
        return res.json({ language: fromHeader || "en", country: null, source: fromHeader ? "accept-language" : "fallback" });
      }

      // Check cache first
      const cached = geoCache.get(clientIp);
      if (cached && Date.now() - cached.timestamp < GEO_CACHE_TTL) {
        return res.json({ language: cached.language, country: cached.country, source: "cache" });
      }

      // HTTPS geolocation via ipapi.co (free tier, no key required)
      const geoResponse = await fetch(`https://ipapi.co/${clientIp}/json/`, {
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

      geoCache.set(clientIp, { language: mapped, country: countryCode, timestamp: Date.now() });

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
      const news = allNews.filter(n => !n.publishAt || new Date(n.publishAt) <= now);
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

  app.get("/api/news/:idOrSlug", async (req, res) => {
    try {
      const param = req.params.idOrSlug;
      let news = await storage.getNewsBySlug(param);
      if (!news) {
        news = await storage.getNewsById(param);
      }
      if (!news) {
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
      if (!newsItem) {
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

  app.post("/api/admin/office-images", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
    try {
      const parsed = insertOfficeImageSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      const image = await storage.createOfficeImage(parsed.data);
      res.status(201).json(image);
    } catch (error) {
      res.status(500).json({ error: "Failed to create office image" });
    }
  });

  app.patch("/api/admin/office-images/:id", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
    try {
      const patchSchema = insertOfficeImageSchema.pick({ alt: true, altEs: true, order: true }).partial();
      const parsed = patchSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      const updated = await storage.updateOfficeImage(req.params.id, parsed.data);
      if (!updated) return res.status(404).json({ error: "Image not found" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update office image" });
    }
  });

  app.delete("/api/admin/office-images/:id", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteOfficeImage(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Image not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete office image" });
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

  app.get("/api/practice-groups", async (_req, res) => {
    try {
      const groups = await storage.getPracticeGroups();
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
      if (!group) {
        return res.status(404).json({ error: "Practice group not found" });
      }
      res.json(group);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch practice group" });
    }
  });

  app.get("/api/industry-groups", async (_req, res) => {
    try {
      const groups = await storage.getIndustryGroups();
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
      if (!group) {
        return res.status(404).json({ error: "Industry group not found" });
      }
      res.json(group);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch industry group" });
    }
  });

  app.get("/api/team", async (_req, res) => {
    try {
      const members = await storage.getTeamMembers();
      res.set("Cache-Control", "public, max-age=60");
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch team members" });
    }
  });

  app.get("/api/team/partners", async (_req, res) => {
    try {
      const partners = await storage.getPartners();
      res.set("Cache-Control", "public, max-age=60");
      res.json(partners);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch partners" });
    }
  });

  app.get("/api/team/:idOrSlug", async (req, res) => {
    try {
      const param = req.params.idOrSlug;
      let member = await storage.getTeamMemberBySlug(param);
      if (!member) {
        member = await storage.getTeamMemberById(param);
      }
      if (!member) {
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
      if (!member) {
        return res.status(404).json({ error: "Team member not found" });
      }
      
      const vcard = generateVCard(member, language);
      const filename = member.slug.replace(/[^a-z0-9-]/g, '') + '.vcf';
      
      res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
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
      if (!member) {
        return res.status(404).json({ error: "Team member not found" });
      }
      const newsList = await storage.getNewsByTeamMemberId(member.id);
      res.json(newsList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch news for team member" });
    }
  });

  app.post("/api/contact", async (req, res) => {
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

      // No se loguea nombre ni email (PII). Solo el id de la submission.
      console.log(`[Contact] New submission saved with id ${submission.id}`);

      res.json({ success: true, message: "Contact form submitted successfully" });
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(500).json({ error: "Failed to process contact form" });
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
      const limit = parseInt(req.query.limit as string) || 4;
      const eventsList = await storage.getUpcomingEvents(limit);
      res.json(eventsList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch upcoming events" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEventById(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  // =============================================
  // NEWSLETTER (public subscribe + public-facing)
  // =============================================

  app.post("/api/newsletter", async (req: Request, res: Response) => {
    try {
      // Client sends { email, firstName?, lastName? }. The schema stores a single
      // `name` column, so collapse the optional name parts into it.
      const firstName = typeof req.body?.firstName === "string" ? req.body.firstName.trim() : "";
      const lastName = typeof req.body?.lastName === "string" ? req.body.lastName.trim() : "";
      const composedName = [firstName, lastName].filter(Boolean).join(" ").trim();

      const validatedData = insertNewsletterSubscriberSchema.parse({
        email: typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : req.body?.email,
        name: composedName.length > 0 ? composedName : (req.body?.name ?? null),
      });

      const { created } = await storage.createNewsletterSubscriber(validatedData);

      if (!created) {
        return res.status(200).json({
          success: true,
          duplicate: true,
          message: "This email is already subscribed",
        });
      }

      console.log("[Newsletter] New subscriber saved");
      res.status(201).json({ success: true, duplicate: false, message: "Subscribed successfully" });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Newsletter subscribe error:", error);
      res.status(500).json({ error: "Failed to subscribe" });
    }
  });

  // Alias kept for clarity / external callers
  app.post("/api/newsletter/subscribe", async (req: Request, res: Response) => {
    try {
      const firstName = typeof req.body?.firstName === "string" ? req.body.firstName.trim() : "";
      const lastName = typeof req.body?.lastName === "string" ? req.body.lastName.trim() : "";
      const composedName = [firstName, lastName].filter(Boolean).join(" ").trim();

      const validatedData = insertNewsletterSubscriberSchema.parse({
        email: typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : req.body?.email,
        name: composedName.length > 0 ? composedName : (req.body?.name ?? null),
      });

      const { created } = await storage.createNewsletterSubscriber(validatedData);

      if (!created) {
        return res.status(200).json({ success: true, duplicate: true, message: "This email is already subscribed" });
      }

      console.log("[Newsletter] New subscriber saved");
      res.status(201).json({ success: true, duplicate: false, message: "Subscribed successfully" });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Newsletter subscribe error:", error);
      res.status(500).json({ error: "Failed to subscribe" });
    }
  });

  // =============================================
  // FAQS (public read)
  // =============================================

  app.get("/api/faqs", async (_req: Request, res: Response) => {
    try {
      const list = await storage.getFaqs();
      res.json(list);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch FAQs" });
    }
  });

  // =============================================
  // PRO BONO (public read)
  // =============================================

  app.get("/api/pro-bono", async (_req: Request, res: Response) => {
    try {
      const list = await storage.getProBonoProjects();
      res.json(list);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pro bono projects" });
    }
  });

  // =============================================
  // DIVERSITY (public read)
  // =============================================

  app.get("/api/diversity", async (_req: Request, res: Response) => {
    try {
      const list = await storage.getDiversityInitiatives();
      res.json(list);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch diversity initiatives" });
    }
  });

  // =============================================
  // SPECIALIZED DESKS (public read)
  // =============================================

  app.get("/api/desks", async (_req: Request, res: Response) => {
    try {
      const desks = await storage.getSpecializedDesks();
      const published = desks.filter(d => d.published);
      res.set("Cache-Control", "public, max-age=60");
      res.json(published);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch specialized desks" });
    }
  });

  // =============================================
  // ARTICLES (public read) — published blog posts
  // =============================================

  app.get("/api/articles", async (_req: Request, res: Response) => {
    try {
      const posts = await storage.getBlogPosts();
      const published = posts.filter(p => p.status === "published");
      res.set("Cache-Control", "public, max-age=60");
      res.json(published);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch articles" });
    }
  });

  app.get("/api/search", async (req, res) => {
    try {
      const query = (req.query.q as string || '').toLowerCase().trim();
      if (!query || query.length < 2) {
        return res.json({ team: [], practiceGroups: [], industryGroups: [], news: [] });
      }
      
      const [team, practiceGroups, industryGroups, news] = await Promise.all([
        storage.getTeamMembers(),
        storage.getPracticeGroups(),
        storage.getIndustryGroups(),
        storage.getNews(),
      ]);
      
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
      
      const filteredNews = news.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.titleEs.toLowerCase().includes(query) ||
        n.excerpt.toLowerCase().includes(query) ||
        n.excerptEs.toLowerCase().includes(query) ||
        (n.content && n.content.toLowerCase().includes(query)) ||
        (n.contentEs && n.contentEs.toLowerCase().includes(query))
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

  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const baseUrl = 'https://www.vonwobeser.com';
      const today = new Date().toISOString().split('T')[0];

      const staticPages = [
        { loc: '/', changefreq: 'weekly', priority: '1.0' },
        { loc: '/about', changefreq: 'monthly', priority: '0.8' },
        { loc: '/team', changefreq: 'weekly', priority: '0.9' },
        { loc: '/practice-groups', changefreq: 'monthly', priority: '0.8' },
        { loc: '/industry-groups', changefreq: 'monthly', priority: '0.8' },
        { loc: '/news', changefreq: 'daily', priority: '0.9' },
        { loc: '/contact', changefreq: 'monthly', priority: '0.7' },
        { loc: '/careers', changefreq: 'weekly', priority: '0.7' },
        { loc: '/rankings', changefreq: 'monthly', priority: '0.7' },
        { loc: '/offices', changefreq: 'monthly', priority: '0.7' },
        { loc: '/experience', changefreq: 'monthly', priority: '0.7' },
        { loc: '/privacy-policy', changefreq: 'yearly', priority: '0.3' },
        { loc: '/terms', changefreq: 'yearly', priority: '0.3' },
      ];

      const [teamMembers, practiceGroups, industryGroups, newsItems] = await Promise.all([
        storage.getTeamMembers(),
        storage.getPracticeGroups(),
        storage.getIndustryGroups(),
        storage.getNews(),
      ]);

      let urlEntries = '';

      for (const page of staticPages) {
        urlEntries += `
  <url>
    <loc>${baseUrl}${page.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
      }

      for (const member of teamMembers) {
        urlEntries += `
  <url>
    <loc>${baseUrl}/team/${member.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
      }

      for (const group of practiceGroups) {
        urlEntries += `
  <url>
    <loc>${baseUrl}/practice-groups/${group.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
      }

      for (const group of industryGroups) {
        urlEntries += `
  <url>
    <loc>${baseUrl}/industry-groups/${group.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
      }

      for (const newsItem of newsItems) {
        const lastmod = newsItem.date ? new Date(newsItem.date).toISOString().split('T')[0] : today;
        urlEntries += `
  <url>
    <loc>${baseUrl}/news/${newsItem.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
      }

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlEntries}
</urlset>`;

      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.send(sitemap);
    } catch (error) {
      console.error("Sitemap generation error:", error);
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate sitemap</error>');
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static(uploadsDir, {
    maxAge: '1d',
    immutable: true,
  }));

  // =============================================
  // ADMIN ROUTES
  // =============================================

  // Admin Initialization (create first admin user)
  app.post("/api/admin/init", async (req: Request, res: Response) => {
    try {
      // Validate input
      const validation = adminLoginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid input", 
          details: validation.error.errors 
        });
      }

      const { username, password } = validation.data;
      const passwordHash = await hashPassword(password);

      // Check if user with this email already exists
      const existingUser = await storage.getAdminUserByEmail(username);
      if (existingUser) {
        return res.status(403).json({ error: "Admin user with this email already exists" });
      }

      // Create the first admin user
      const user = await storage.createAdminUser({
        username: username.split('@')[0],
        email: username,
        passwordHash,
        role: "super_admin",
        isActive: true,
      });

      res.json({
        success: true,
        message: "Admin user created successfully",
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Init error:", error);
      res.status(500).json({ error: "Initialization failed" });
    }
  });

  // Admin Login
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      
      // Check rate limit
      const rateCheck = checkRateLimit(ip);
      if (!rateCheck.allowed) {
        return res.status(429).json({ 
          error: "Too many login attempts", 
          retryAfter: rateCheck.retryAfter 
        });
      }

      // Validate input
      const validation = adminLoginSchema.safeParse(req.body);
      if (!validation.success) {
        recordLoginAttempt(ip, false);
        return res.status(400).json({ 
          error: "Invalid input", 
          details: validation.error.errors 
        });
      }

      const { username, password } = validation.data;

      // Find user by email or username
      let user = await storage.getAdminUserByEmail(username);
      if (!user) {
        user = await storage.getAdminUserByUsername(username);
      }
      if (!user) {
        await comparePassword(password, "$2b$12$InvalidHashToPreventTimingAttackXXXXXXXXXXXX");
        recordLoginAttempt(ip, false);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check if user is active
      if (!user.isActive) {
        recordLoginAttempt(ip, false);
        return res.status(401).json({ error: "Account is disabled" });
      }

      // Verify password
      const validPassword = await comparePassword(password, user.passwordHash);
      if (!validPassword) {
        recordLoginAttempt(ip, false);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Record successful attempt
      recordLoginAttempt(ip, true);

      // Create session
      const token = generateToken();
      const session = await storage.createAdminSession({
        userId: user.id,
        token,
        expiresAt: getSessionExpiry(),
        ipAddress: ip,
        userAgent: req.headers["user-agent"] || null,
      });

      // Update last login
      await storage.updateAdminUserLogin(user.id);

      res.json({
        token: session.token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Admin Logout
  app.post("/api/admin/logout", authMiddleware, async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        await storage.deleteAdminSession(token);
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });

  // Get current admin user
  app.get("/api/admin/me", authMiddleware, async (req: Request, res: Response) => {
    try {
      const user = req.adminUser!;
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      });
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // =============================================
  // BLOG POSTS CRUD
  // =============================================

  // Get all blog posts with pagination
  app.get("/api/admin/posts", authMiddleware, async (req: Request, res: Response) => {
    try {
      const search = req.query.search as string || "";
      const status = req.query.status as string || "";
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      let posts = await storage.getBlogPosts();
      
      // Filter by search
      if (search) {
        const searchLower = search.toLowerCase();
        posts = posts.filter(post => 
          post.title.toLowerCase().includes(searchLower) ||
          post.titleEs.toLowerCase().includes(searchLower)
        );
      }
      
      // Filter by status
      if (status && status !== "all") {
        posts = posts.filter(post => post.status === status);
      }
      
      const total = posts.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const paginatedPosts = posts.slice(startIndex, startIndex + limit);
      
      res.json({
        posts: paginatedPosts,
        total,
        page,
        totalPages,
      });
    } catch (error) {
      console.error("Get posts error:", error);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  // Get single blog post
  app.get("/api/admin/posts/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const post = await storage.getBlogPostById(req.params.id);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Get post error:", error);
      res.status(500).json({ error: "Failed to fetch post" });
    }
  });

  // Create blog post
  app.post("/api/admin/posts", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
    try {
      const validation = insertBlogPostSchema.safeParse({
        ...req.body,
        authorId: req.adminUser!.id,
      });
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validation.error.errors 
        });
      }

      // Check for duplicate slug
      const existingPost = await storage.getBlogPostBySlug(validation.data.slug);
      if (existingPost) {
        return res.status(400).json({ error: "Slug already exists" });
      }

      const post = await storage.createBlogPost(validation.data);
      res.status(201).json(post);
    } catch (error) {
      console.error("Create post error:", error);
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  // Update blog post
  app.put("/api/admin/posts/:id", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
    try {
      const existingPost = await storage.getBlogPostById(req.params.id);
      if (!existingPost) {
        return res.status(404).json({ error: "Post not found" });
      }

      // Check for duplicate slug if slug is being changed
      if (req.body.slug && req.body.slug !== existingPost.slug) {
        const slugPost = await storage.getBlogPostBySlug(req.body.slug);
        if (slugPost) {
          return res.status(400).json({ error: "Slug already exists" });
        }
      }

      const post = await storage.updateBlogPost(req.params.id, req.body);
      res.json(post);
    } catch (error) {
      console.error("Update post error:", error);
      res.status(500).json({ error: "Failed to update post" });
    }
  });

  // Delete blog post (soft delete)
  app.delete("/api/admin/posts/:id", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteBlogPost(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Post not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete post error:", error);
      res.status(500).json({ error: "Failed to delete post" });
    }
  });

  // =============================================
  // BLOG CATEGORIES CRUD
  // =============================================

  // Get all categories
  app.get("/api/admin/categories", authMiddleware, async (_req: Request, res: Response) => {
    try {
      const categories = await storage.getBlogCategories();
      res.json(categories);
    } catch (error) {
      console.error("Get categories error:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // Get single category
  app.get("/api/admin/categories/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const category = await storage.getBlogCategoryById(req.params.id);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Get category error:", error);
      res.status(500).json({ error: "Failed to fetch category" });
    }
  });

  // Create category
  app.post("/api/admin/categories", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
    try {
      const validation = insertBlogCategorySchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validation.error.errors 
        });
      }

      const category = await storage.createBlogCategory(validation.data);
      res.status(201).json(category);
    } catch (error) {
      console.error("Create category error:", error);
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  // Update category
  app.put("/api/admin/categories/:id", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
    try {
      const category = await storage.updateBlogCategory(req.params.id, req.body);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Update category error:", error);
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  // Delete category
  app.delete("/api/admin/categories/:id", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteBlogCategory(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete category error:", error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // =============================================
  // BLOG TAGS CRUD
  // =============================================

  // Get all tags
  app.get("/api/admin/tags", authMiddleware, async (_req: Request, res: Response) => {
    try {
      const tags = await storage.getBlogTags();
      res.json(tags);
    } catch (error) {
      console.error("Get tags error:", error);
      res.status(500).json({ error: "Failed to fetch tags" });
    }
  });

  // Create tag
  app.post("/api/admin/tags", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
    try {
      const validation = insertBlogTagSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validation.error.errors 
        });
      }

      const tag = await storage.createBlogTag(validation.data);
      res.status(201).json(tag);
    } catch (error) {
      console.error("Create tag error:", error);
      res.status(500).json({ error: "Failed to create tag" });
    }
  });

  // Delete tag
  app.delete("/api/admin/tags/:id", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteBlogTag(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Tag not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete tag error:", error);
      res.status(500).json({ error: "Failed to delete tag" });
    }
  });

  // =============================================
  // ADMIN NEWS CRUD
  // =============================================

  // Get all news with pagination/search
  app.get("/api/admin/news", authMiddleware, async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = (req.query.search as string) || "";
      const category = (req.query.category as string) || "";

      let allNews = await storage.getNews();

      // Filter by search term
      if (search) {
        const searchLower = search.toLowerCase();
        allNews = allNews.filter(n => 
          n.title.toLowerCase().includes(searchLower) ||
          n.titleEs.toLowerCase().includes(searchLower) ||
          n.excerpt.toLowerCase().includes(searchLower) ||
          n.excerptEs.toLowerCase().includes(searchLower)
        );
      }

      // Filter by category
      if (category && category !== "all") {
        allNews = allNews.filter(n => n.category === category);
      }

      const total = allNews.length;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;
      const paginatedNews = allNews.slice(offset, offset + limit);

      res.json({
        news: paginatedNews,
        total,
        page,
        totalPages,
      });
    } catch (error) {
      console.error("Get admin news error:", error);
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });

  // Get news stats
  app.get("/api/admin/news/stats", authMiddleware, async (_req: Request, res: Response) => {
    try {
      const allNews = await storage.getNews();
      const total = allNews.length;
      const published = allNews.filter(n => n.published).length;
      const unpublished = total - published;

      res.json({ total, published, unpublished });
    } catch (error) {
      console.error("Get news stats error:", error);
      res.status(500).json({ error: "Failed to fetch news stats" });
    }
  });

  // Get comprehensive CMS stats for admin dashboard
  app.get("/api/admin/cms-stats", authMiddleware, async (_req: Request, res: Response) => {
    try {
      const allNews = await storage.getNews();
      const totalArticles = allNews.length;
      
      // Get all translations and count by language
      const translationsByLanguage: Record<string, number> = {};
      const articlesWithTranslationsSet = new Set<string>();
      let totalTranslations = 0;
      
      // Fetch translations for all news articles
      for (const newsItem of allNews) {
        const translations = await storage.getNewsTranslations(newsItem.id);
        if (translations.length > 0) {
          articlesWithTranslationsSet.add(newsItem.id);
        }
        for (const translation of translations) {
          totalTranslations++;
          translationsByLanguage[translation.language] = 
            (translationsByLanguage[translation.language] || 0) + 1;
        }
      }
      
      // Get recent articles (last 5)
      const recentArticles = allNews.slice(0, 5).map(n => ({
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
        articlesWithTranslations: articlesWithTranslationsSet.size,
        totalTranslations,
        translationsByLanguage,
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
  app.get("/api/admin/news/translation-counts", authMiddleware, async (_req: Request, res: Response) => {
    try {
      const counts = await storage.getNewsTranslationCounts();
      res.json(counts);
    } catch (error) {
      console.error("Get translation counts error:", error);
      res.status(500).json({ error: "Failed to fetch translation counts" });
    }
  });

  // Get translations for a specific news article
  app.get("/api/admin/news/:id/translations", authMiddleware, async (req: Request, res: Response) => {
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
  app.get("/api/admin/news/:id", authMiddleware, async (req: Request, res: Response) => {
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
  app.post("/api/admin/news", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
    try {
      const validation = insertNewsSchema.safeParse(req.body);
      
      if (!validation.success) {
        return apiError(res, 400, "Validation failed", validation.error.errors);
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
  app.put("/api/admin/news/:id", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
    try {
      const newsItem = await storage.updateNews(req.params.id, req.body);
      if (!newsItem) {
        return apiError(res, 404, "News not found");
      }
      auditLog("update", "news", req.params.id, (req as any).adminUser?.id || "unknown");
      res.json(newsItem);
    } catch (error) {
      console.error("Update news error:", error);
      return apiError(res, 500, "Failed to update news");
    }
  });

  // Delete news
  app.delete("/api/admin/news/:id", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
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
  app.get("/api/admin/team", authMiddleware, async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = (req.query.search as string) || "";
      const role = (req.query.role as string) || "";

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
  app.get("/api/admin/team/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const member = await storage.getTeamMemberById(req.params.id);
      if (!member) {
        return res.status(404).json({ error: "Team member not found" });
      }
      res.json(member);
    } catch (error) {
      console.error("Get team member error:", error);
      res.status(500).json({ error: "Failed to fetch team member" });
    }
  });

  // Create team member
  app.post("/api/admin/team", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertTeamMemberSchema.parse(req.body);
      const member = await storage.createTeamMember(validatedData);
      auditLog("create", "team", member.id, (req as any).adminUser?.id || "unknown");
      res.status(201).json(member);
    } catch (error) {
      if (error instanceof ZodError) {
        return apiError(res, 400, "Validation failed", error.errors);
      }
      console.error("Create team member error:", error);
      return apiError(res, 500, "Failed to create team member");
    }
  });

  // Update team member
  app.put("/api/admin/team/:id", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertTeamMemberSchema.partial().parse(req.body);
      const member = await storage.updateTeamMember(req.params.id, validatedData);
      if (!member) {
        return apiError(res, 404, "Team member not found");
      }
      auditLog("update", "team", req.params.id, (req as any).adminUser?.id || "unknown");
      res.json(member);
    } catch (error) {
      if (error instanceof ZodError) {
        return apiError(res, 400, "Validation failed", error.errors);
      }
      console.error("Update team member error:", error);
      return apiError(res, 500, "Failed to update team member");
    }
  });

  // Delete team member
  app.delete("/api/admin/team/:id", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
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
  app.get("/api/admin/team/stats", authMiddleware, async (_req: Request, res: Response) => {
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
  app.get("/api/admin/practice-groups", authMiddleware, async (_req: Request, res: Response) => {
    try {
      const groups = await storage.getPracticeGroups();
      res.json(groups);
    } catch (error) {
      console.error("Get practice groups error:", error);
      res.status(500).json({ error: "Failed to fetch practice groups" });
    }
  });

  // Create practice group
  app.post("/api/admin/practice-groups", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertPracticeGroupSchema.parse(req.body);
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
  app.put("/api/admin/practice-groups/:id", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertPracticeGroupSchema.partial().parse(req.body);
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
  app.delete("/api/admin/practice-groups/:id", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
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
  app.get("/api/admin/industry-groups", authMiddleware, async (_req: Request, res: Response) => {
    try {
      const groups = await storage.getIndustryGroups();
      res.json(groups);
    } catch (error) {
      console.error("Get industry groups error:", error);
      res.status(500).json({ error: "Failed to fetch industry groups" });
    }
  });

  // Create industry group
  app.post("/api/admin/industry-groups", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertIndustryGroupSchema.parse(req.body);
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
  app.put("/api/admin/industry-groups/:id", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertIndustryGroupSchema.partial().parse(req.body);
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
  app.delete("/api/admin/industry-groups/:id", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
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
  
  app.get("/api/admin/events", authMiddleware, async (_req: Request, res: Response) => {
    try {
      const eventsList = await storage.getEvents();
      res.json(eventsList);
    } catch (error) {
      console.error("Get events error:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.post("/api/admin/events", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertEventSchema.parse(req.body);
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

  app.put("/api/admin/events/:id", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertEventSchema.partial().parse(req.body);
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

  app.delete("/api/admin/events/:id", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
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
  
  app.get("/api/admin/rankings", authMiddleware, async (_req: Request, res: Response) => {
    try {
      const rankingsList = await storage.getRankings();
      res.json(rankingsList);
    } catch (error) {
      console.error("Get rankings error:", error);
      res.status(500).json({ error: "Failed to fetch rankings" });
    }
  });

  app.post("/api/admin/rankings", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
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

  app.put("/api/admin/rankings/:id", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
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

  app.delete("/api/admin/rankings/:id", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
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
  
  app.get("/api/admin/awards", authMiddleware, async (_req: Request, res: Response) => {
    try {
      const awardsList = await storage.getAwards();
      res.json(awardsList);
    } catch (error) {
      console.error("Get awards error:", error);
      res.status(500).json({ error: "Failed to fetch awards" });
    }
  });

  app.post("/api/admin/awards", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
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

  app.put("/api/admin/awards/:id", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
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

  app.delete("/api/admin/awards/:id", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
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
  
  app.get("/api/admin/clients", authMiddleware, async (_req: Request, res: Response) => {
    try {
      const clientsList = await storage.getRepresentativeClients();
      res.json(clientsList);
    } catch (error) {
      console.error("Get clients error:", error);
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.post("/api/admin/clients", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
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

  app.put("/api/admin/clients/:id", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
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

  app.delete("/api/admin/clients/:id", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
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
  
  app.get("/api/admin/testimonials", authMiddleware, async (_req: Request, res: Response) => {
    try {
      const testimonialsList = await storage.getTestimonials();
      res.json(testimonialsList);
    } catch (error) {
      console.error("Get testimonials error:", error);
      res.status(500).json({ error: "Failed to fetch testimonials" });
    }
  });

  app.post("/api/admin/testimonials", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
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

  app.put("/api/admin/testimonials/:id", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
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

  app.delete("/api/admin/testimonials/:id", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
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
  
  app.get("/api/admin/jobs", authMiddleware, async (_req: Request, res: Response) => {
    try {
      const jobsList = await storage.getJobOpenings();
      res.json(jobsList);
    } catch (error) {
      console.error("Get jobs error:", error);
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  app.post("/api/admin/jobs", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
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

  app.put("/api/admin/jobs/:id", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
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

  app.delete("/api/admin/jobs/:id", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
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
  
  app.get("/api/admin/offices", authMiddleware, async (_req: Request, res: Response) => {
    try {
      const officesList = await storage.getOffices();
      res.json(officesList);
    } catch (error) {
      console.error("Get offices error:", error);
      res.status(500).json({ error: "Failed to fetch offices" });
    }
  });

  app.post("/api/admin/offices", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
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

  app.put("/api/admin/offices/:id", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
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

  app.delete("/api/admin/offices/:id", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
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
  
  app.get("/api/admin/alliances", authMiddleware, async (_req: Request, res: Response) => {
    try {
      const alliancesList = await storage.getAlliances();
      res.json(alliancesList);
    } catch (error) {
      console.error("Get alliances error:", error);
      res.status(500).json({ error: "Failed to fetch alliances" });
    }
  });

  app.post("/api/admin/alliances", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
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

  app.put("/api/admin/alliances/:id", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
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

  app.delete("/api/admin/alliances/:id", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
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

  app.get("/api/admin/contact-submissions", authMiddleware, async (_req: Request, res: Response) => {
    try {
      const submissions = await storage.getContactSubmissions();
      res.json(submissions);
    } catch (error) {
      console.error("Get contact submissions error:", error);
      res.status(500).json({ error: "Failed to fetch contact submissions" });
    }
  });

  app.patch("/api/admin/contact-submissions/:id/read", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
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

  // =============================================
  // ADMIN NEWSLETTER SUBSCRIBERS
  // =============================================

  app.get("/api/admin/newsletter/subscribers", authMiddleware, requireRole("super_admin", "editor"), async (_req: Request, res: Response) => {
    try {
      const subscribers = await storage.getNewsletterSubscribers();
      res.json(subscribers);
    } catch (error) {
      console.error("Get newsletter subscribers error:", error);
      res.status(500).json({ error: "Failed to fetch newsletter subscribers" });
    }
  });

  // =============================================
  // ADMIN FAQS CRUD
  // =============================================

  app.get("/api/admin/faqs", authMiddleware, async (_req: Request, res: Response) => {
    try {
      const list = await storage.getAllFaqs();
      res.json(list);
    } catch (error) {
      console.error("Get FAQs error:", error);
      res.status(500).json({ error: "Failed to fetch FAQs" });
    }
  });

  app.post("/api/admin/faqs", authMiddleware, requireRole("super_admin", "editor"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertFaqSchema.parse(req.body);
      const faq = await storage.createFaq(validatedData);
      res.json(faq);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Create FAQ error:", error);
      res.status(500).json({ error: "Failed to create FAQ" });
    }
  });

  app.put("/api/admin/faqs/:id", authMiddleware, requireRole("super_admin", "editor"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertFaqSchema.partial().parse(req.body);
      const updated = await storage.updateFaq(req.params.id, validatedData);
      if (!updated) {
        return res.status(404).json({ error: "FAQ not found" });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Update FAQ error:", error);
      res.status(500).json({ error: "Failed to update FAQ" });
    }
  });

  app.delete("/api/admin/faqs/:id", authMiddleware, requireRole("super_admin", "editor"), async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteFaq(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "FAQ not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete FAQ error:", error);
      res.status(500).json({ error: "Failed to delete FAQ" });
    }
  });

  // =============================================
  // ADMIN PRO BONO CRUD
  // =============================================

  app.get("/api/admin/pro-bono", authMiddleware, async (_req: Request, res: Response) => {
    try {
      const list = await storage.getAllProBonoProjects();
      res.json(list);
    } catch (error) {
      console.error("Get pro bono projects error:", error);
      res.status(500).json({ error: "Failed to fetch pro bono projects" });
    }
  });

  app.post("/api/admin/pro-bono", authMiddleware, requireRole("super_admin", "editor"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertProBonoProjectSchema.parse(req.body);
      const project = await storage.createProBonoProject(validatedData);
      res.json(project);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Create pro bono project error:", error);
      res.status(500).json({ error: "Failed to create pro bono project" });
    }
  });

  app.put("/api/admin/pro-bono/:id", authMiddleware, requireRole("super_admin", "editor"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertProBonoProjectSchema.partial().parse(req.body);
      const updated = await storage.updateProBonoProject(req.params.id, validatedData);
      if (!updated) {
        return res.status(404).json({ error: "Pro bono project not found" });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Update pro bono project error:", error);
      res.status(500).json({ error: "Failed to update pro bono project" });
    }
  });

  app.delete("/api/admin/pro-bono/:id", authMiddleware, requireRole("super_admin", "editor"), async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteProBonoProject(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Pro bono project not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete pro bono project error:", error);
      res.status(500).json({ error: "Failed to delete pro bono project" });
    }
  });

  // =============================================
  // ADMIN DIVERSITY CRUD
  // =============================================

  app.get("/api/admin/diversity", authMiddleware, async (_req: Request, res: Response) => {
    try {
      const list = await storage.getAllDiversityInitiatives();
      res.json(list);
    } catch (error) {
      console.error("Get diversity initiatives error:", error);
      res.status(500).json({ error: "Failed to fetch diversity initiatives" });
    }
  });

  app.post("/api/admin/diversity", authMiddleware, requireRole("super_admin", "editor"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertDiversityInitiativeSchema.parse(req.body);
      const initiative = await storage.createDiversityInitiative(validatedData);
      res.json(initiative);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Create diversity initiative error:", error);
      res.status(500).json({ error: "Failed to create diversity initiative" });
    }
  });

  app.put("/api/admin/diversity/:id", authMiddleware, requireRole("super_admin", "editor"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertDiversityInitiativeSchema.partial().parse(req.body);
      const updated = await storage.updateDiversityInitiative(req.params.id, validatedData);
      if (!updated) {
        return res.status(404).json({ error: "Diversity initiative not found" });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Update diversity initiative error:", error);
      res.status(500).json({ error: "Failed to update diversity initiative" });
    }
  });

  app.delete("/api/admin/diversity/:id", authMiddleware, requireRole("super_admin", "editor"), async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteDiversityInitiative(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Diversity initiative not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete diversity initiative error:", error);
      res.status(500).json({ error: "Failed to delete diversity initiative" });
    }
  });

  // =============================================
  // ADMIN SPECIALIZED DESKS CRUD
  // =============================================
  
  app.get("/api/admin/desks", authMiddleware, async (_req: Request, res: Response) => {
    try {
      const desksList = await storage.getSpecializedDesks();
      res.json(desksList);
    } catch (error) {
      console.error("Get desks error:", error);
      res.status(500).json({ error: "Failed to fetch desks" });
    }
  });

  app.post("/api/admin/desks", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertSpecializedDeskSchema.parse(req.body);
      const desk = await storage.createSpecializedDesk(validatedData);
      res.json(desk);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Create desk error:", error);
      res.status(500).json({ error: "Failed to create desk" });
    }
  });

  app.put("/api/admin/desks/:id", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertSpecializedDeskSchema.partial().parse(req.body);
      const updated = await storage.updateSpecializedDesk(req.params.id, validatedData);
      if (!updated) {
        return res.status(404).json({ error: "Desk not found" });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Update desk error:", error);
      res.status(500).json({ error: "Failed to update desk" });
    }
  });

  app.delete("/api/admin/desks/:id", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteSpecializedDesk(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Desk not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete desk error:", error);
      res.status(500).json({ error: "Failed to delete desk" });
    }
  });

  // =============================================
  // AGENT KNOWLEDGE CRUD (Admin)
  // =============================================

  app.get("/api/admin/knowledge", authMiddleware, async (_req: Request, res: Response) => {
    try {
      const { dbPersistence } = await import('./agents/storage/DatabasePersistence');
      const documents = await dbPersistence.getAllKnowledge();
      res.json(documents);
    } catch (error) {
      console.error("Get knowledge error:", error);
      res.status(500).json({ error: "Failed to fetch knowledge documents" });
    }
  });

  app.post("/api/admin/knowledge", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
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

  app.put("/api/admin/knowledge/:id", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
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

  app.delete("/api/admin/knowledge/:id", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
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

  app.post("/api/admin/knowledge/bulk", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
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
  app.get("/api/admin/media", authMiddleware, async (_req: Request, res: Response) => {
    try {
      const items = await storage.getMediaItems();
      res.json(items);
    } catch (error) {
      console.error("Get media error:", error);
      res.status(500).json({ error: "Failed to fetch media" });
    }
  });

  // Upload media
  app.post("/api/admin/media/upload", authMiddleware, requireRole("editor"), upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const mediaItem = await storage.createMediaItem({
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: `/uploads/${req.file.filename}`,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedBy: req.adminUser!.id,
        alt: req.body.alt || null,
        altEs: req.body.altEs || null,
      });

      res.status(201).json(mediaItem);
    } catch (error) {
      console.error("Upload media error:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Delete media item
  app.delete("/api/admin/media/:id", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
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
  app.post("/api/news/:id/team-members", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
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
  app.delete("/api/news/:id/team-members/:teamMemberId", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
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
  app.post("/api/news/:id/validate", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
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
  app.post("/api/news/:id/council-review", authMiddleware, requireRole("editor"), async (req: Request, res: Response) => {
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

  // POST /api/translate - Translate single text
  app.post("/api/translate", async (req: Request, res: Response) => {
    try {
      const { text, sourceLanguage, targetLanguage } = req.body;

      if (!text || !sourceLanguage || !targetLanguage) {
        return res.status(400).json({ 
          error: "Missing required fields: text, sourceLanguage, targetLanguage" 
        });
      }

      const validCodes = SUPPORTED_LANGUAGES.map(l => l.code);
      if (!validCodes.includes(sourceLanguage) || !validCodes.includes(targetLanguage)) {
        return res.status(400).json({ error: "Invalid language code" });
      }

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
  app.post("/api/translate/batch", async (req: Request, res: Response) => {
    try {
      const { texts, sourceLanguage, targetLanguage } = req.body;

      if (!texts || !Array.isArray(texts) || !sourceLanguage || !targetLanguage) {
        return res.status(400).json({ 
          error: "Missing required fields: texts (array), sourceLanguage, targetLanguage" 
        });
      }

      const validCodes = SUPPORTED_LANGUAGES.map(l => l.code);
      if (!validCodes.includes(sourceLanguage) || !validCodes.includes(targetLanguage)) {
        return res.status(400).json({ error: "Invalid language code" });
      }

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
  app.post("/api/translate/suggest", async (req: Request, res: Response) => {
    try {
      const { originalText, existingTranslations, targetLanguage } = req.body;

      if (!originalText || !targetLanguage) {
        return res.status(400).json({ 
          error: "Missing required fields: originalText, targetLanguage" 
        });
      }

      const validCodes = SUPPORTED_LANGUAGES.map(l => l.code);
      if (!validCodes.includes(targetLanguage)) {
        return res.status(400).json({ error: "Invalid target language code" });
      }

      const result = await suggestTranslation(
        originalText,
        existingTranslations || {},
        targetLanguage as LanguageCode
      );

      res.json({ ...result, targetLanguage });
    } catch (error) {
      console.error("Translation suggestion error:", error);
      res.status(500).json({ error: "Failed to suggest translation" });
    }
  });

  // =============================================
  // TRANSLATION CACHE API
  // =============================================

  // GET /api/translations/:contentType/:entityId/:targetLanguage - Get all cached translations for an entity
  app.get("/api/translations/:contentType/:entityId/:targetLanguage", async (req: Request, res: Response) => {
    try {
      const { contentType, entityId, targetLanguage } = req.params;

      const validCodes: string[] = SUPPORTED_LANGUAGES.map(l => l.code);
      if (!validCodes.includes(targetLanguage)) {
        return res.status(400).json({ error: "Invalid target language code" });
      }

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

  // POST /api/translate-content - Translate single content and cache it
  app.post("/api/translate-content", async (req: Request, res: Response) => {
    try {
      const { contentType, entityId, field, sourceText, sourceLanguage, targetLanguage } = req.body;

      if (!contentType || !entityId || !field || !sourceText || !sourceLanguage || !targetLanguage) {
        return res.status(400).json({ 
          error: "Missing required fields: contentType, entityId, field, sourceText, sourceLanguage, targetLanguage" 
        });
      }

      const validCodes = SUPPORTED_LANGUAGES.map(l => l.code);
      if (!validCodes.includes(sourceLanguage) || !validCodes.includes(targetLanguage)) {
        return res.status(400).json({ error: "Invalid language code" });
      }

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

      const saved = await storage.saveTranslation({
        contentType,
        entityId,
        field,
        sourceLanguage,
        targetLanguage,
        sourceText,
        translatedText,
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
  app.post("/api/translate-entity", async (req: Request, res: Response) => {
    try {
      const { contentType, entityId, fields, sourceLanguage, targetLanguage } = req.body;

      if (!contentType || !entityId || !fields || !sourceLanguage || !targetLanguage) {
        return res.status(400).json({ 
          error: "Missing required fields: contentType, entityId, fields, sourceLanguage, targetLanguage" 
        });
      }

      const validContentTypes = ['team_member', 'practice_group', 'industry_group', 'news', 'event', 'representative_matter'] as const;
      if (!validContentTypes.includes(contentType)) {
        return res.status(400).json({ 
          error: `Invalid contentType. Must be one of: ${validContentTypes.join(', ')}` 
        });
      }

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

      const validCodes = SUPPORTED_LANGUAGES.map(l => l.code);
      if (!validCodes.includes(sourceLanguage) || !validCodes.includes(targetLanguage)) {
        return res.status(400).json({ error: "Invalid language code" });
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
            await storage.saveTranslation({
              contentType,
              entityId,
              field: fieldName,
              sourceLanguage,
              targetLanguage,
              sourceText: originalField.text,
              translatedText,
            });
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
  app.post("/api/agents/generate-image/:articleId", authMiddleware, async (req: Request, res: Response) => {
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
  app.post("/api/agents/pipeline/:articleId", authMiddleware, async (req: Request, res: Response) => {
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
        pipelineResults.steps.format = { success: false, error: err.message };
        pipelineResults.errors.push(`Format: ${err.message}`);
        emitProgress('format', 'error', undefined, err.message);
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
        pipelineResults.steps.categorize = { success: false, error: err.message };
        pipelineResults.errors.push(`Categorize: ${err.message}`);
        emitProgress('categorize', 'error', undefined, err.message);
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
        pipelineResults.steps.metadata = { success: false, error: err.message };
        pipelineResults.errors.push(`Metadata: ${err.message}`);
        emitProgress('metadata', 'error', undefined, err.message);
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
        pipelineResults.steps.seo = { success: false, error: err.message };
        pipelineResults.errors.push(`SEO: ${err.message}`);
        emitProgress('seo', 'error', undefined, err.message);
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
        pipelineResults.steps.translate = { success: false, error: err.message };
        pipelineResults.errors.push(`Translate: ${err.message}`);
        emitProgress('translate', 'error', undefined, err.message);
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
          pipelineResults.steps.image = { success: false, error: err.message };
          pipelineResults.errors.push(`Image: ${err.message}`);
          emitProgress('image', 'error', undefined, err.message);
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
        error: error.message || "Failed to process article pipeline" 
      });
    }
  });

  // Process all articles - FULL RAG AGENTIC PIPELINE for all articles
  app.post("/api/agents/pipeline/process-all", authMiddleware, async (req: Request, res: Response) => {
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
            articleResult.steps.format = { success: false, error: err.message };
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
            articleResult.steps.categorize = { success: false, error: err.message };
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
            articleResult.steps.metadata = { success: false, error: err.message };
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
            articleResult.steps.seo = { success: false, error: err.message };
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
            articleResult.steps.translate = { success: false, error: err.message };
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
              articleResult.steps.image = { success: false, error: err.message };
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
  app.post("/api/agents/recover", authMiddleware, async (req: Request, res: Response) => {
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
        error: error.message || 'Recovery failed' 
      });
    }
  });

  // Get failed articles summary for diagnostics
  app.get("/api/agents/failed-summary", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { getFailedArticlesSummary } = await import('./agents/AutoRecoveryAgent');
      const summary = await getFailedArticlesSummary();
      res.json({ success: true, ...summary });
    } catch (error: any) {
      console.error('[FailedSummary] Error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // System Chronicler API - Nerve Center data
  app.get("/api/system/chronicler", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { systemChronicler } = await import('./agents/SystemChronicler');
      const { dbPersistence } = await import('./agents/storage/DatabasePersistence');

      // El estado de cada agente se deriva de su ACTIVIDAD REAL en la base (jobs y eventos),
      // no del "active" hardcodeado del registro. Un agente sin actividad reciente aparece
      // "dormant"; uno con fallos dominantes, "evolving". Así el dashboard deja de mentir.
      const baseAgents = systemChronicler.getAllAgents();
      const jobStats = await dbPersistence.getJobStatsByAgentType();
      const recentEvents = await dbPersistence.getRecentEvents(200);

      const lastActiveByAgent: Record<string, Date> = {};
      for (const ev of recentEvents as any[]) {
        const at = ev.agentType;
        const ts = ev.createdAt || ev.timestamp;
        if (at && ts && !lastActiveByAgent[at]) lastActiveByAgent[at] = new Date(ts);
      }
      const RECENT_MS = 24 * 60 * 60 * 1000;
      const now = Date.now();

      const agents = baseAgents.map((a) => {
        const js = jobStats[a.id] || { total: 0, completed: 0, failed: 0, pending: 0 };
        const lastActive = lastActiveByAgent[a.id];
        const recentlyActive = lastActive ? now - lastActive.getTime() < RECENT_MS : false;
        let status: "active" | "dormant" | "evolving";
        if (js.pending > 0 || recentlyActive) status = "active";
        else if (js.failed > 0 && js.failed >= js.completed) status = "evolving";
        else if (js.total > 0) status = "active";
        else status = "dormant";
        return {
          ...a,
          status,
          successRate: js.total > 0 ? Math.round((js.completed / js.total) * 100) / 100 : a.successRate,
          lastActive: lastActive || a.lastActive,
          jobsTotal: js.total,
          jobsCompleted: js.completed,
          jobsFailed: js.failed,
        };
      });

      const timeline = systemChronicler.getEvolutionTimeline();
      const baseStats = systemChronicler.getSystemStats();
      const activeAgents = agents.filter((a) => a.status === "active").length;
      const stats = { ...baseStats, totalAgents: agents.length, activeAgents };
      const byCat = (c: string) => agents.filter((a) => a.category === c);

      res.json({
        success: true,
        agents,
        timeline,
        stats,
        categories: { brain: byCat("brain"), hands: byCat("hands"), shield: byCat("shield") },
      });
    } catch (error: any) {
      console.error('[SystemChronicler] Error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Record evolution event (admin only)
  app.post("/api/system/chronicler/evolution", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { systemChronicler } = await import('./agents/SystemChronicler');
      const { title, description, agentId, impact, category } = req.body;
      
      if (!title || !description || !impact || !category) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields: title, description, impact, category' 
        });
      }
      
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
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Website Audit API routes
  app.get("/api/audits", authMiddleware, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const audits = await storage.getWebsiteAudits(limit);
      res.json({ success: true, audits });
    } catch (error) {
      console.error("Failed to get audits:", error);
      res.status(500).json({ error: "Failed to fetch audits" });
    }
  });

  app.get("/api/audits/latest", authMiddleware, async (req: Request, res: Response) => {
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

  app.get("/api/audits/:id", authMiddleware, async (req: Request, res: Response) => {
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

  app.get("/api/audits/:id/findings", authMiddleware, async (req: Request, res: Response) => {
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

  app.post("/api/audits/run", authMiddleware, async (req: Request, res: Response) => {
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

  app.get("/api/audits/findings/open", authMiddleware, async (req: Request, res: Response) => {
    try {
      const findings = await storage.getOpenFindings();
      res.json({ success: true, findings });
    } catch (error) {
      console.error("Failed to get open findings:", error);
      res.status(500).json({ error: "Failed to fetch open findings" });
    }
  });

  // System Health Check - Deep Audit API
  // NOTE: Now admin-only — exposes internal system diagnostics.
  // Destructive operations like reset-zombies require auth.
  app.get("/api/health-check/run", authMiddleware, async (req: Request, res: Response) => {
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
      res.status(500).json({ error: error.message || "Failed to run health check" });
    }
  });

  app.post("/api/health-check/reset-zombies", authMiddleware, async (req: Request, res: Response) => {
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
      res.status(500).json({ error: error.message || "Failed to reset zombie jobs" });
    }
  });

  app.patch("/api/audits/findings/:id", authMiddleware, async (req: Request, res: Response) => {
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

  // Agent system routes
  const agentRoutes = await import('./agents/api/agentRoutes');
  app.use('/api/agents', agentRoutes.default);

  // Initialize agents on server start
  const { initializeAgents } = await import('./agents');
  initializeAgents().catch(err => console.error('[Agents] Initialization error:', err));

  // =============================================
  // LEGACY URL 301 REDIRECTS (SEO)
  // Mapean URLs del sitio viejo (basadas en index.php) a las rutas nuevas del SPA.
  // Se registran ANTES del catch-all del SPA (que se monta en index.ts después de
  // registerRoutes), de modo que estas rutas viejas no caen en un 404 del front.
  // TODO: redirect de detalle requiere legacy_id en migración (W8)
  //   (p.ej. /index.php/lawyer?l=134 → /team/<slug> necesita mapeo old-ID→slug, no disponible aún)
  // =============================================
  const legacyRedirects: Array<[string[], string]> = [
    [["/index.php/attorneys", "/index.php/abogados"], "/team"],
    [["/index.php/our-firm", "/index.php/nuestra-firma"], "/about"],
    [["/index.php/our-firm/diversity", "/index.php/nuestra-firma/diversidad"], "/diversity-inclusion"],
    [["/index.php/our-firm/probono", "/index.php/nuestra-firma/probono"], "/pro-bono"],
    [["/index.php/capabilities", "/index.php/capacidades"], "/practice-groups"],
    [["/index.php/publications", "/index.php/publicaciones"], "/news"],
    [["/index.php/contact", "/index.php/contacto"], "/contact"],
    [["/index.php/careers", "/index.php/bolsa-de-trabajo"], "/careers"],
    [["/index.php/privacy", "/index.php/aviso"], "/privacy-policy"],
    [["/new-offices", "/nuevas-oficinas"], "/offices"],
  ];

  for (const [fromPaths, to] of legacyRedirects) {
    for (const from of fromPaths) {
      app.get(from, (_req: Request, res: Response) => res.redirect(301, to));
    }
  }

  // Genérico final: cualquier otra URL vieja profunda de index.php → home (301)
  // para no dejar 404s. Debe ir después de las rutas index.php específicas de arriba.
  app.get(/^\/index\.php(\/.*)?$/, (_req: Request, res: Response) => res.redirect(301, "/"));

  return httpServer;
}
