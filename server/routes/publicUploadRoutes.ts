import type { Express, NextFunction, Request, Response } from "express";
import express from "express";
import path from "node:path";
import { storage } from "../storage";
import { servePersistentManagedMedia } from "./managedMedia";
import { uploadsDir } from "./uploadMiddleware";

export function registerPublicUploadRoutes(app: Express): void {
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

  // El disco de un Deployment de Replit es efímero. Si la copia caliente de
  // /uploads ya no existe, se sirve la copia persistente de App Storage. Una
  // ausencia real termina aquí con 404 y nunca cae al HTML del home.
  app.use("/uploads", async (req: Request, res: Response) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      return res.status(405).setHeader("Allow", "GET, HEAD").end();
    }
    const publicPath = `/uploads${req.path}`;
    if (await servePersistentManagedMedia(req, res, publicPath)) return;
    res.status(404).json({ error: "Media not found" });
  });
}
