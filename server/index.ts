import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { registerRoutes, runSecurityMaintenance } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { randomUUID } from "node:crypto";
import { initializeAgents, orchestrator } from "./agents";
import { invalidatePublicPageCache } from "./mirror/pageCache";
import { invalidatePublicNavigationMenuCache } from "./mirror/navigationMenu";

const app = express();
// Detrás del reverse-proxy de Replit (inyecta X-Forwarded-For). Sin esto req.ip es la IP del
// proxy — igual para todos — y el rate-limiting (login) comparte un único bucket: 5 fallos de
// un atacante bloquean a todos los usuarios, incluido el admin real.
app.set("trust proxy", 1);
const httpServer = createServer(app);

app.use(compression());

// Security headers (CSP se afina aparte: el espejo usa inline scripts/estilos + assets externos)
app.use(helmet({
  // El espejo heredado todavía contiene scripts inline. Se recopilan reportes
  // antes de pasar a enforcement para no romper miles de páginas de golpe.
  contentSecurityPolicy: {
    reportOnly: true,
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      // Compatibilidad temporal y explícita con el HTML heredado del espejo:
      // aún contiene scripts y manejadores inline. Mantenerlos declarados en
      // Report-Only evita miles de falsos positivos sin habilitar unsafe-eval.
      // La migración futura a nonces permitirá retirarlos antes de enforcement.
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcElem: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      mediaSrc: ["'self'", "blob:", "https:"],
      connectSrc: ["'self'", "https:", "wss:", "ws:"],
      frameSrc: ["'self'", "https://www.google.com", "https://www.youtube.com", "https://player.vimeo.com"],
      // `upgrade-insecure-requests` es ignorada por los navegadores dentro de una
      // política Report-Only y genera un error de consola que Lighthouse penaliza.
      // Se añadirá cuando la CSP pase a enforcement, no antes.
      reportUri: ["/api/security/csp-report"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
}));
app.use((_req, res, next) => {
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  next();
});

// CORS: solo orígenes en whitelist (CORS_ORIGIN, separados por coma). Sin whitelist NO
// se refleja ningún origen cruzado (el admin se sirve same-origin, así que no se ve afectado).
const corsOrigins = (process.env.CORS_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);
app.use(cors({
  origin: corsOrigins.length ? corsOrigins : false,
  credentials: true,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "X-CSRF-Token"],
}));

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: "256kb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "128kb" }));

app.post(
  "/api/security/csp-report",
  express.json({ type: ["application/csp-report", "application/reports+json"], limit: "32kb" }),
  (req, res) => {
    const report = req.body?.["csp-report"] || (Array.isArray(req.body) ? req.body[0]?.body : null) || {};
    const safe = {
      directive: String(report["effective-directive"] || report.effectiveDirective || "").slice(0, 100),
      disposition: String(report.disposition || "report").slice(0, 20),
      sourceFileOrigin: (() => {
        try { return new URL(String(report["source-file"] || report.sourceFile || "")).origin; } catch { return ""; }
      })(),
    };
    console.warn("[csp-report]", JSON.stringify(safe));
    res.status(204).end();
  },
);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  const requestId = req.header("x-request-id")?.slice(0, 80) || randomUUID();
  res.setHeader("X-Request-Id", requestId);
  let responseShape: string | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    if (Array.isArray(bodyJson)) {
      responseShape = `[${bodyJson.length} items]`;
    } else if (bodyJson && typeof bodyJson === "object") {
      // Nunca registrar valores: login, formularios, credenciales generadas y
      // respuestas de agentes pueden contener secretos o datos personales.
      responseShape = `{${Object.keys(bodyJson).slice(0, 12).join(",")}}`;
    }
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (
      path.startsWith("/api/admin")
      && !["GET", "HEAD", "OPTIONS"].includes(req.method)
      && res.statusCode >= 200
      && res.statusCode < 400
    ) {
      invalidatePublicPageCache();
      invalidatePublicNavigationMenuCache();
    }
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (responseShape) logLine += ` :: ${responseShape}`;

      log(`${logLine} requestId=${requestId}`);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  // Mirror frontend (original site look) wired to our backend. Registered
  // after the API routes and before the SPA catch-all in setupVite/serveStatic.
  const { setupMirror } = await import("./mirror");
  await setupMirror(app);

  // Las APIs desconocidas nunca deben caer en la SPA ni responder HTML 200.
  app.use("/api", (_req, res) => {
    const requestId = String(res.getHeader("X-Request-Id") || "");
    res.status(404).json({ error: "Not Found", requestId });
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const requestId = String(res.getHeader("X-Request-Id") || "");
    const publicMessage = status >= 500 ? "Internal Server Error" : (err.message || "Request failed");

    if (!res.headersSent) res.status(status).json({ error: publicMessage, requestId });
    console.error("[error]", status, requestId, err instanceof Error ? err.message : "unknown");
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      // reusePort (SO_REUSEPORT) is supported on Linux (Replit) but not macOS,
      // where it throws ENOTSUP. Enable it only where the OS supports it.
      ...(process.platform === "linux" ? { reusePort: true } : {}),
    },
    async () => {
      log(`serving on port ${port}`);

      if (process.env.SECURITY_READ_ONLY_SMOKE === "true") {
        log("Read-only security smoke mode active; background workers are disabled", "security");
        return;
      }
      
      // Initialize and start the agent orchestrator
      try {
        await initializeAgents();
        orchestrator.start(2000); // Process jobs every 2 seconds
        log("Agent orchestrator initialized and started", "agents");
      } catch (error) {
        log("Failed to initialize agent orchestrator", "agents");
      }

      // Mantenimiento de seguridad y retención: sesiones, logs de 90 días y
      // formularios/CV con retención de 12 meses.
      setInterval(async () => {
        try {
          const cleaned = await runSecurityMaintenance();
          const total = Object.values(cleaned).reduce((sum, value) => sum + value, 0);
          if (total > 0) {
            log(`[Scheduler] Cleaned ${total} expired security/privacy records`, "scheduler");
          }
        } catch (err) {
          log("[Scheduler] Error during hourly tick", "scheduler");
        }
      }, 60 * 60 * 1000);

      // Auditoría diaria del sitio — antes el "self-healing" solo corría por clic manual en
      // /admin/audits; con esto queda realmente 24/7 sin depender de que alguien lo dispare.
      setInterval(async () => {
        try {
          await orchestrator.enqueueJob("website_auditor", { runType: "full", triggeredBy: "scheduled" });
          log("[Scheduler] Auditoría diaria del sitio encolada", "scheduler");
        } catch (err) {
          log("[Scheduler] Error al encolar la auditoría diaria", "scheduler");
        }
      }, 24 * 60 * 60 * 1000);

      // LegalAlertsAgent en piloto automático — antes requería que un abogado pegara
      // manualmente texto/URL; ahora escanea periódicamente fuentes oficiales (COFECE por
      // ahora) y encola borradores solo para publicaciones relevantes. Nunca autopublica:
      // el borrador sigue naciendo con published:false para revisión humana.
      setInterval(async () => {
        try {
          const { runScheduledLegalAlertsScan } = await import("./agents/specialized/legalAlertsScanner");
          const { enqueued, skipped } = await runScheduledLegalAlertsScan();
          log(`[Scheduler] Escaneo de fuentes oficiales: ${enqueued} alertas encoladas, ${skipped} descartadas`, "scheduler");
        } catch (err) {
          log("[Scheduler] Error en el escaneo de fuentes oficiales", "scheduler");
        }
      }, 12 * 60 * 60 * 1000); // cada 12 h (antes 6 h) para cuidar créditos de IA
    },
  );
})();
