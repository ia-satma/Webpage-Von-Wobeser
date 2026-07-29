import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Hashed JS/CSS bundles are immutable — cache for 1 year
  const assetsPath = path.join(distPath, "assets");
  if (fs.existsSync(assetsPath)) {
    app.use("/assets", express.static(assetsPath, {
      maxAge: "1y",
      immutable: true,
    }));
  }

  app.use(express.static(distPath));

  // Solo las rutas del panel usan el fallback SPA. Una API o archivo
  // inexistente debe conservar un 404 real en vez de devolver index.html.
  app.use("*", (req, res) => {
    if (
      req.path.startsWith("/api/")
      || req.path.startsWith("/assets/")
      || /\.[a-z0-9]+$/i.test(req.path)
    ) {
      res.status(404).type("text").send("Not Found");
      return;
    }
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
