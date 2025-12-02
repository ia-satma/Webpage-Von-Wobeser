import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/news", async (_req, res) => {
    try {
      const news = await storage.getNews();
      res.json(news);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });

  app.get("/api/news/:id", async (req, res) => {
    try {
      const news = await storage.getNewsById(req.params.id);
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

  return httpServer;
}
