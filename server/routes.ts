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
} from "@shared/schema";
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
} from "./auth";

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
  
  const nameParts = member.name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${member.name}`,
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
  await seed();

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
      } catch {
        pipelineClients.delete(clientId);
      }
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });
  
  wss.on('connection', (ws, req) => {
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
  app.use('/partner_photos', express.static(path.join(process.cwd(), 'attached_assets', 'partner_photos')));
  
  // Serve associate photos from attached_assets/associate_photos
  app.use('/associate_photos', express.static(path.join(process.cwd(), 'attached_assets', 'associate_photos')));
  
  // Serve Of Counsel photos from attached_assets/of_counsel_photos
  app.use('/of_counsel_photos', express.static(path.join(process.cwd(), 'attached_assets', 'of_counsel_photos')));

  // Geolocation endpoint for automatic language detection
  const COUNTRY_TO_LANGUAGE: Record<string, string> = {
    // Spanish-speaking countries
    MX: "es", ES: "es", AR: "es", CO: "es", PE: "es", VE: "es", CL: "es", EC: "es",
    GT: "es", CU: "es", BO: "es", DO: "es", HN: "es", PY: "es", SV: "es", NI: "es",
    CR: "es", PA: "es", UY: "es", PR: "es",
    // German-speaking countries
    DE: "de", AT: "de", CH: "de", LI: "de",
    // Chinese-speaking regions
    CN: "zh", TW: "zh", HK: "zh", SG: "zh",
    // Korean
    KR: "ko", KP: "ko",
    // Japanese
    JP: "ja",
    // Arabic-speaking countries
    SA: "ar", AE: "ar", EG: "ar", IQ: "ar", MA: "ar", DZ: "ar", SD: "ar", SY: "ar",
    TN: "ar", YE: "ar", JO: "ar", LY: "ar", LB: "ar", OM: "ar", KW: "ar", QA: "ar", BH: "ar",
    // Russian-speaking countries
    RU: "ru", BY: "ru", KZ: "ru", KG: "ru",
    // French-speaking countries
    FR: "fr", BE: "fr", CA: "fr", MC: "fr", LU: "fr", SN: "fr", CI: "fr", ML: "fr",
    // Italian-speaking countries
    IT: "it", SM: "it", VA: "it",
    // English-speaking countries (default)
    US: "en", GB: "en", AU: "en", NZ: "en", IE: "en", ZA: "en", NG: "en", GH: "en", KE: "en",
  };

  app.get("/api/detect-language", async (req, res) => {
    try {
      // Get client IP (handle proxies)
      const forwardedFor = req.headers["x-forwarded-for"];
      const clientIp = forwardedFor 
        ? (typeof forwardedFor === "string" ? forwardedFor.split(",")[0].trim() : forwardedFor[0])
        : req.socket.remoteAddress || req.ip;
      
      // Skip geolocation for localhost/private IPs
      if (!clientIp || clientIp === "::1" || clientIp === "127.0.0.1" || clientIp.startsWith("192.168.") || clientIp.startsWith("10.")) {
        return res.json({ language: "en", country: null, source: "default" });
      }

      // Use free IP geolocation API (ip-api.com - free for non-commercial use)
      const geoResponse = await fetch(`http://ip-api.com/json/${clientIp}?fields=countryCode`);
      
      if (!geoResponse.ok) {
        return res.json({ language: "en", country: null, source: "fallback" });
      }

      const geoData = await geoResponse.json() as { countryCode?: string; status?: string };
      
      if (geoData.status === "fail" || !geoData.countryCode) {
        return res.json({ language: "en", country: null, source: "fallback" });
      }

      const countryCode = geoData.countryCode.toUpperCase();
      const detectedLanguage = COUNTRY_TO_LANGUAGE[countryCode] || "en";

      res.json({ 
        language: detectedLanguage, 
        country: countryCode, 
        source: "geolocation" 
      });
    } catch (error) {
      console.error("Language detection error:", error);
      res.json({ language: "en", country: null, source: "error" });
    }
  });

  app.get("/api/news", async (_req, res) => {
    try {
      const news = await storage.getNews();
      res.json(news);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch news" });
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
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch team members" });
    }
  });

  app.get("/api/team/partners", async (_req, res) => {
    try {
      const partners = await storage.getPartners();
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
      const language = (req.query.lang as "es" | "en") || "es";
      
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
      
      console.log("=== New Contact Form Submission ===");
      console.log("Full Name:", contactData.fullName);
      console.log("Email:", contactData.email);
      console.log("Phone:", contactData.phone || "Not provided");
      console.log("Company:", contactData.company || "Not provided");
      console.log("Practice Area:", contactData.practiceArea || "Not specified");
      console.log("Message:", contactData.message);
      console.log("Submitted at:", new Date().toISOString());
      console.log("===================================");
      
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
  app.use('/uploads', express.static(uploadsDir));

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
  app.post("/api/admin/posts", authMiddleware, async (req: Request, res: Response) => {
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
  app.put("/api/admin/posts/:id", authMiddleware, async (req: Request, res: Response) => {
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
  app.delete("/api/admin/posts/:id", authMiddleware, async (req: Request, res: Response) => {
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
  app.post("/api/admin/categories", authMiddleware, async (req: Request, res: Response) => {
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
  app.put("/api/admin/categories/:id", authMiddleware, async (req: Request, res: Response) => {
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
  app.delete("/api/admin/categories/:id", authMiddleware, async (req: Request, res: Response) => {
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
  app.post("/api/admin/tags", authMiddleware, async (req: Request, res: Response) => {
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
  app.delete("/api/admin/tags/:id", authMiddleware, async (req: Request, res: Response) => {
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
  app.post("/api/admin/news", authMiddleware, async (req: Request, res: Response) => {
    try {
      const validation = insertNewsSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validation.error.errors 
        });
      }

      const newsItem = await storage.createNews(validation.data);
      res.status(201).json(newsItem);
    } catch (error) {
      console.error("Create news error:", error);
      res.status(500).json({ error: "Failed to create news" });
    }
  });

  // Update news
  app.put("/api/admin/news/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const newsItem = await storage.updateNews(req.params.id, req.body);
      if (!newsItem) {
        return res.status(404).json({ error: "News not found" });
      }
      res.json(newsItem);
    } catch (error) {
      console.error("Update news error:", error);
      res.status(500).json({ error: "Failed to update news" });
    }
  });

  // Delete news
  app.delete("/api/admin/news/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteNews(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "News not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete news error:", error);
      res.status(500).json({ error: "Failed to delete news" });
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
  app.post("/api/admin/team", authMiddleware, async (req: Request, res: Response) => {
    try {
      const member = await storage.createTeamMember(req.body);
      res.status(201).json(member);
    } catch (error) {
      console.error("Create team member error:", error);
      res.status(500).json({ error: "Failed to create team member" });
    }
  });

  // Update team member
  app.put("/api/admin/team/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const member = await storage.updateTeamMember(req.params.id, req.body);
      if (!member) {
        return res.status(404).json({ error: "Team member not found" });
      }
      res.json(member);
    } catch (error) {
      console.error("Update team member error:", error);
      res.status(500).json({ error: "Failed to update team member" });
    }
  });

  // Delete team member
  app.delete("/api/admin/team/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteTeamMember(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Team member not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete team member error:", error);
      res.status(500).json({ error: "Failed to delete team member" });
    }
  });

  // Get team stats
  app.get("/api/admin/team/stats", authMiddleware, async (_req: Request, res: Response) => {
    try {
      const members = await storage.getTeamMembers();
      const partners = members.filter(m => m.title.toLowerCase().includes("partner") || m.isPartner);
      const ofCounsel = members.filter(m => m.title.toLowerCase().includes("of counsel"));
      const counsel = members.filter(m => m.title.toLowerCase() === "counsel");
      const associates = members.filter(m => m.title.toLowerCase().includes("associate"));

      res.json({
        total: members.length,
        partners: partners.length,
        ofCounsel: ofCounsel.length,
        counsel: counsel.length,
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
  app.post("/api/admin/practice-groups", authMiddleware, async (req: Request, res: Response) => {
    try {
      const group = await storage.createPracticeGroup(req.body);
      res.status(201).json(group);
    } catch (error) {
      console.error("Create practice group error:", error);
      res.status(500).json({ error: "Failed to create practice group" });
    }
  });

  // Update practice group
  app.put("/api/admin/practice-groups/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const group = await storage.updatePracticeGroup(req.params.id, req.body);
      if (!group) {
        return res.status(404).json({ error: "Practice group not found" });
      }
      res.json(group);
    } catch (error) {
      console.error("Update practice group error:", error);
      res.status(500).json({ error: "Failed to update practice group" });
    }
  });

  // Delete practice group
  app.delete("/api/admin/practice-groups/:id", authMiddleware, async (req: Request, res: Response) => {
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
  app.post("/api/admin/industry-groups", authMiddleware, async (req: Request, res: Response) => {
    try {
      const group = await storage.createIndustryGroup(req.body);
      res.status(201).json(group);
    } catch (error) {
      console.error("Create industry group error:", error);
      res.status(500).json({ error: "Failed to create industry group" });
    }
  });

  // Update industry group
  app.put("/api/admin/industry-groups/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const group = await storage.updateIndustryGroup(req.params.id, req.body);
      if (!group) {
        return res.status(404).json({ error: "Industry group not found" });
      }
      res.json(group);
    } catch (error) {
      console.error("Update industry group error:", error);
      res.status(500).json({ error: "Failed to update industry group" });
    }
  });

  // Delete industry group
  app.delete("/api/admin/industry-groups/:id", authMiddleware, async (req: Request, res: Response) => {
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

  app.post("/api/admin/events", authMiddleware, async (req: Request, res: Response) => {
    try {
      const event = await storage.createEvent(req.body);
      res.json(event);
    } catch (error) {
      console.error("Create event error:", error);
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  app.put("/api/admin/events/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const updated = await storage.updateEvent(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Update event error:", error);
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  app.delete("/api/admin/events/:id", authMiddleware, async (req: Request, res: Response) => {
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

  app.post("/api/admin/rankings", authMiddleware, async (req: Request, res: Response) => {
    try {
      const ranking = await storage.createRanking(req.body);
      res.json(ranking);
    } catch (error) {
      console.error("Create ranking error:", error);
      res.status(500).json({ error: "Failed to create ranking" });
    }
  });

  app.put("/api/admin/rankings/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const updated = await storage.updateRanking(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Ranking not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Update ranking error:", error);
      res.status(500).json({ error: "Failed to update ranking" });
    }
  });

  app.delete("/api/admin/rankings/:id", authMiddleware, async (req: Request, res: Response) => {
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

  app.post("/api/admin/awards", authMiddleware, async (req: Request, res: Response) => {
    try {
      const award = await storage.createAward(req.body);
      res.json(award);
    } catch (error) {
      console.error("Create award error:", error);
      res.status(500).json({ error: "Failed to create award" });
    }
  });

  app.put("/api/admin/awards/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const updated = await storage.updateAward(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Award not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Update award error:", error);
      res.status(500).json({ error: "Failed to update award" });
    }
  });

  app.delete("/api/admin/awards/:id", authMiddleware, async (req: Request, res: Response) => {
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

  app.post("/api/admin/clients", authMiddleware, async (req: Request, res: Response) => {
    try {
      const client = await storage.createRepresentativeClient(req.body);
      res.json(client);
    } catch (error) {
      console.error("Create client error:", error);
      res.status(500).json({ error: "Failed to create client" });
    }
  });

  app.put("/api/admin/clients/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const updated = await storage.updateRepresentativeClient(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Update client error:", error);
      res.status(500).json({ error: "Failed to update client" });
    }
  });

  app.delete("/api/admin/clients/:id", authMiddleware, async (req: Request, res: Response) => {
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

  app.post("/api/admin/testimonials", authMiddleware, async (req: Request, res: Response) => {
    try {
      const testimonial = await storage.createTestimonial(req.body);
      res.json(testimonial);
    } catch (error) {
      console.error("Create testimonial error:", error);
      res.status(500).json({ error: "Failed to create testimonial" });
    }
  });

  app.put("/api/admin/testimonials/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const updated = await storage.updateTestimonial(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Testimonial not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Update testimonial error:", error);
      res.status(500).json({ error: "Failed to update testimonial" });
    }
  });

  app.delete("/api/admin/testimonials/:id", authMiddleware, async (req: Request, res: Response) => {
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

  app.post("/api/admin/jobs", authMiddleware, async (req: Request, res: Response) => {
    try {
      const job = await storage.createJobOpening(req.body);
      res.json(job);
    } catch (error) {
      console.error("Create job error:", error);
      res.status(500).json({ error: "Failed to create job" });
    }
  });

  app.put("/api/admin/jobs/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const updated = await storage.updateJobOpening(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Update job error:", error);
      res.status(500).json({ error: "Failed to update job" });
    }
  });

  app.delete("/api/admin/jobs/:id", authMiddleware, async (req: Request, res: Response) => {
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
  app.post("/api/admin/media/upload", authMiddleware, upload.single("file"), async (req: Request, res: Response) => {
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
  app.delete("/api/admin/media/:id", authMiddleware, async (req: Request, res: Response) => {
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
  app.post("/api/news/:id/team-members", authMiddleware, async (req: Request, res: Response) => {
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
  app.delete("/api/news/:id/team-members/:teamMemberId", authMiddleware, async (req: Request, res: Response) => {
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

      // Calculate overall success
      const stepResults = Object.values(pipelineResults.steps) as any[];
      const successfulSteps = stepResults.filter(s => s.success).length;
      pipelineResults.successfulSteps = successfulSteps;
      pipelineResults.totalSteps = stepResults.length;
      pipelineResults.success = successfulSteps === stepResults.length;

      console.log(`[Pipeline] Completed: ${successfulSteps}/${stepResults.length} steps successful`);
      
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
          } catch {}

          // Step 2: CATEGORIZE
          try {
            const categoryResult = await categoryAgent.execute(
              createContext('category_agent', article.id),
              { articleId: article.id }
            );
            articleResult.steps.categorize = { success: categoryResult.success };
          } catch {}

          // Step 3: METADATA
          try {
            const metadataResult = await metadataLinkerAgent.execute(
              createContext('metadata_linker', article.id),
              { articleId: article.id }
            );
            articleResult.steps.metadata = { success: metadataResult.success };
          } catch {}

          // Step 4: SEO
          try {
            const seoResult = await seoOptimizerAgent.execute(
              createContext('seo_optimizer', article.id),
              { articleId: article.id }
            );
            articleResult.steps.seo = { success: seoResult.success };
          } catch {}

          // Step 5: TRANSLATE
          try {
            const translateResult = await polyglotTranslatorAgent.execute(
              createContext('polyglot_translator', article.id),
              { articleId: article.id }
            );
            articleResult.steps.translate = { success: translateResult.success };
          } catch {}

          // Step 6: IMAGE (optional)
          if (generateImage) {
            try {
              const imageResult = await imageSuggestionAgent.execute(
                createContext('image_suggestion', article.id),
                { articleId: article.id }
              );
              articleResult.steps.image = { success: imageResult.success };
            } catch {}
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

  return httpServer;
}
