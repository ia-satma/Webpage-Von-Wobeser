import express, { type Express, type NextFunction, type Request, type Response } from "express";
import fs from "fs";
import path from "node:path";
import { legacyHtmlLanguage, normalizeLegacyHtmlLanguage } from "../legacyHtml";
import { renderNotFound } from "../renderNotFound";
import type { MirrorRuntime } from "../runtime";

export function registerMirrorAssetAndFallbackRoutes(app: Express, runtime: MirrorRuntime): void {
  const { TEMPLATES, langOf, mirrorDir, pick, sendPage, tpl } = runtime;

  // El espejo registra su 404 antes de que Vite/serveStatic atienda `public/`.
  // Por eso los recursos globales del gestor de consentimiento deben salir de
  // forma explícita aquí; de otro modo el HTML los referencia correctamente,
  // pero el navegador recibe un 404 y el panel nunca puede aparecer.
  const consentAssets: Array<[string, string]> = [
    ["/vwb-cookie-consent.css", "vwb-cookie-consent.css"],
    ["/vwb-cookie-consent.js", "vwb-cookie-consent.js"],
    ["/vwb-legacy-events.js", "vwb-legacy-events.js"],
  ];
  for (const [route, filename] of consentAssets) {
    app.get(route, (_req, res, next) => {
      const assetPath = path.resolve(process.cwd(), "public", filename);
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.sendFile(assetPath, (error) => {
        if (error && !res.headersSent) next(error);
      });
    });
  }

  // Backstop para cualquier captura HTML histórica que no tenga todavía una
  // ruta dinámica o redirección específica. A diferencia de express.static,
  // este paso la hace pasar por sendPage(), que aplica las dos fuentes vigentes,
  // navegación, idioma, accesibilidad y recursos versionados. Los archivos
  // binarios continúan debajo con su caché larga sin ninguna transformación.
  const mirrorRoot = fs.realpathSync(mirrorDir);
  app.use((req: Request, res: Response, next: NextFunction) => {
    if ((req.method !== "GET" && req.method !== "HEAD") || !/\.html$/i.test(req.path)) return next();

    let decodedPath: string;
    try {
      decodedPath = decodeURIComponent(req.path);
    } catch {
      return next();
    }
    const relativePath = decodedPath.replace(/^\/+/, "");
    if (!relativePath || relativePath.split("/").some((segment) => !segment || segment.startsWith("."))) return next();

    const candidate = path.resolve(mirrorRoot, relativePath);
    if (!candidate.startsWith(`${mirrorRoot}${path.sep}`)) return next();

    let resolved: string;
    try {
      resolved = fs.realpathSync(candidate);
      if (!resolved.startsWith(`${mirrorRoot}${path.sep}`) || !fs.statSync(resolved).isFile()) return next();
    } catch {
      return next();
    }

    const lang = legacyHtmlLanguage(decodedPath, req.query.lang);
    const relativeTemplate = path.relative(mirrorRoot, resolved).split(path.sep).join("/");
    const html = normalizeLegacyHtmlLanguage(tpl(relativeTemplate), lang);
    return sendPage(res, html).catch(next);
  });

  // ---------- Static assets (css, js, vendor, images, fonts) ------------
  // Antes se servían con max-age=0 → el navegador revalidaba CSS/JS/imágenes/fuentes
  // en CADA carga. Ahora se cachean fuerte: fuentes y librerías vendor son inmutables
  // (1 año), el resto 30 días. Gran ganancia en visitas repetidas y subrecursos.
  app.use(
    express.static(mirrorDir, {
      index: false,
      maxAge: "30d",
      setHeaders: (res, filePath) => {
        if (/[\\/]templates[\\/]beez3[\\/](?:css[\\/]von\.css|js[\\/]min[\\/](?:functions|slick)\.min\.js)$/i.test(filePath)) {
          // Estos assets cambian navegación y accesibilidad global en los HTML legacy
          // los referencian sin versión; no deben permanecer obsoletos 30 días.
          res.setHeader("Cache-Control", "public, max-age=300, must-revalidate");
        } else if (
          /([\\/]_vendor[\\/]|[\\/]images[\\/]optimized[\\/]|[\\/]images[\\/]home-hero-(?:desktop|mobile|poster)-v\d+\.|\.(?:woff2?|ttf|eot|otf))/i.test(filePath)
        ) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    }),
  );

  // ---------- Public catch-all: mirror 404, never Home/SPA with status 200 --
  // The old React redesign stays reachable ONLY at /admin. An unknown public
  // URL gets a real, branded 404 so crawlers, analytics and visitors can tell
  // it apart from Home. Missing mirror assets return plain text, not HTML.
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    const p = req.path;
    // Admin app, API and Vite/React internals must reach the SPA.
    if (p.startsWith("/@") || /^\/(admin|api|src|node_modules|vite|assets)(\/|$)/.test(p) || p === "/__vite_ping") return next();
    if (/\.[a-z0-9]+$/i.test(p)) {
      res.status(404).type("text").send("Not Found");
      return;
    }
    const lang = langOf(req);
    return sendPage(
      res,
      renderNotFound(pick(TEMPLATES.publications, lang), lang, req.originalUrl),
      404,
    ).catch(next);
  });}
