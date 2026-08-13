import { type Express } from "express";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { createViteWebSocketOptions } from "./viteWebSocket";

const viteLogger = createLogger();

export async function setupVite(server: Server, app: Express) {
  const serverOptions = {
    middlewareMode: true,
    // Vite 8 moved transport settings from `server.hmr` to `server.ws`.
    // Replit terminates TLS at its proxy, so the browser must use the public
    // WSS endpoint while the actual upgrade still lands on this HTTP server.
    ws: createViteWebSocketOptions(server),
    hmr: { overlay: true },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      // `v` is a reserved Vite dependency-version query. Using it here made
      // Vite reuse a stale transform after optimizeDeps regenerated its
      // hashes, leaving the admin root blank. A neutral query keeps each HTML
      // entry aligned with the currently active dependency graph.
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?entry=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}
