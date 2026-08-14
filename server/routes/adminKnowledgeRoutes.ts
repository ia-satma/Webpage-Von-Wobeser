import type { Express, Request, Response } from "express";
import { authMiddleware, requirePermission } from "../auth";

async function knowledgePersistence() {
  const { dbPersistence } = await import("../agents/storage/DatabasePersistence");
  return dbPersistence;
}

export function registerAdminKnowledgeRoutes(app: Express): void {
  app.get("/api/admin/knowledge", authMiddleware, requirePermission("content"), async (_req: Request, res: Response) => {
    try {
      const dbPersistence = await knowledgePersistence();
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
      const dbPersistence = await knowledgePersistence();
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
      const dbPersistence = await knowledgePersistence();
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
      const dbPersistence = await knowledgePersistence();
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
      const dbPersistence = await knowledgePersistence();
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
}
