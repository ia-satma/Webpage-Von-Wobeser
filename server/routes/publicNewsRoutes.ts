import type { Express } from "express";
import { storage } from "../storage";

const isPubliclyVisible = (entity: { published?: boolean | null }): boolean => entity.published === true;

export function registerPublicNewsRoutes(app: Express): void {
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
      const teamMembersList = (await storage.getTeamMembersByNewsId(newsItem.id))
        .filter(isPubliclyVisible);
      res.json(teamMembersList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch authors for news" });
    }
  });
}
