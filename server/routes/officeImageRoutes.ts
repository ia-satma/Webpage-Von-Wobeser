import type { Express, Request, Response } from "express";
import { insertOfficeImageSchema } from "@shared/schema";
import { z } from "zod";
import { authMiddleware, requirePermission } from "../auth";
import { storage } from "../storage";

export function registerOfficeImageRoutes(app: Express): void {
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

  app.put("/api/admin/office-images/order", authMiddleware, requirePermission("config"), async (req: Request, res: Response) => {
    const parsed = z.object({
      ids: z.array(z.string().uuid()).min(1).max(100),
    }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid office image order" });

    try {
      const result = await storage.reorderOfficeImages(parsed.data.ids);
      if (!result.ok) {
        return res.status(409).json({
          error: "Office images changed while they were being reordered",
          code: "OFFICE_IMAGES_ORDER_STALE",
          images: result.images,
        });
      }
      res.json(result.images);
    } catch (error) {
      console.error("Reorder office images error:", error);
      res.status(500).json({ error: "Failed to reorder office images" });
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
}
