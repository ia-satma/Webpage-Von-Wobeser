import type { Express } from "express";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { servePersistentManagedMedia } from "./managedMedia";

export function registerPublicAssetRoutes(app: Express): void {
  // El catch-all del espejo se registra antes que el estático general de
  // `public/`. Esta ruta explícita garantiza que el fallback editorial nunca
  // termine convertido en un 404 de texto.
  app.get('/placeholder-article.svg', (_req, res) => {
    const placeholderPath = path.join(process.cwd(), 'public', 'placeholder-article.svg');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.sendFile(placeholderPath);
  });

  // Variantes WebP del directorio. Se publican desde `public` con un nombre
  // determinista y no sustituyen los retratos originales: el `src` conserva el
  // respaldo para archivos nuevos que aún no hayan pasado por media:optimize.
  app.use('/optimized-attorney-photos', express.static(path.join(process.cwd(), 'public', 'optimized-attorney-photos'), {
    maxAge: '365d',
    immutable: true,
  }));

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
  app.get('/generated-images/:filename', async (req, res) => {
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
      // resolved is served only after the explicit generatedImagesDir containment check above.
      return res.sendFile(resolved); // nosemgrep: javascript.express.security.audit.express-res-sendfile.express-res-sendfile
    }
    const publicPath = `/generated-images/${req.params.filename}`;
    if (await servePersistentManagedMedia(req, res, publicPath)) return;
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

  app.get('/generated-audio/:filename', async (req, res) => {
    const resolved = path.resolve(generatedAudioDir, req.params.filename);
    if (resolved !== path.resolve(generatedAudioDir) && !resolved.startsWith(path.resolve(generatedAudioDir) + path.sep)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
      if (req.query.download !== undefined) {
        res.setHeader('Content-Disposition', `attachment; filename="${path.basename(resolved)}"`);
      }
      // resolved is served only after the explicit generatedAudioDir containment check above.
      return res.sendFile(resolved); // nosemgrep: javascript.express.security.audit.express-res-sendfile.express-res-sendfile
    }
    const publicPath = `/generated-audio/${req.params.filename}`;
    if (await servePersistentManagedMedia(req, res, publicPath)) return;
    res.status(404).json({ error: 'Audio not found' });
  });

  app.use('/generated-audio', express.static(generatedAudioDir, {
    maxAge: '365d',
    immutable: true,
  }));

  // Las presentaciones históricas pueden seguir físicamente en disco/App Storage durante la
  // cuarentena, pero nunca vuelven a exponerse por una ruta pública. No se elimina ningún objeto.
  app.use('/generated-presentations', (_req, res) => {
    res.setHeader('Cache-Control', 'private, no-store');
    res.status(404).end();
  });
}
