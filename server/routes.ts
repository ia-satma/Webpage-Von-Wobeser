import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { seed } from "./seed";
import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import multer from "multer";
import { 
  contactFormSchema, 
  adminLoginSchema, 
  insertBlogPostSchema,
  insertBlogCategorySchema,
  insertBlogTagSchema,
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

  // Serve partner photos from attached_assets/partner_photos
  app.use('/partner_photos', express.static(path.join(process.cwd(), 'attached_assets', 'partner_photos')));
  
  // Serve associate photos from attached_assets/associate_photos
  app.use('/associate_photos', express.static(path.join(process.cwd(), 'attached_assets', 'associate_photos')));
  
  // Serve Of Counsel photos from attached_assets/of_counsel_photos
  app.use('/of_counsel_photos', express.static(path.join(process.cwd(), 'attached_assets', 'of_counsel_photos')));

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

      // Find user
      const user = await storage.getAdminUserByUsername(username);
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

  return httpServer;
}
