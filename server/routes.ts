import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { seed } from "./seed";
import express from "express";
import path from "path";
import { contactFormSchema } from "@shared/schema";

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

  return httpServer;
}
