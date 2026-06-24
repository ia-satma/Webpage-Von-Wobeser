import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { orchestrator } from "./agents/core/AgentOrchestrator";
import { storage } from "./storage";

const app = express();
// Detrás del reverse-proxy de Replit (inyecta X-Forwarded-For). Sin esto req.ip es
// la IP del proxy — igual para todos — y el rate-limiting (login + limiters) comparte
// un único bucket: 5 fallos de un atacante bloquean a todos los usuarios.
app.set("trust proxy", 1);
const httpServer = createServer(app);

app.use(compression());

// Cabeceras de seguridad (helmet). Antes no había ninguna: sin X-Frame-Options el sitio
// era encuadrable (clickjacking), sin nosniff el navegador podía adivinar MIME, sin HSTS
// no se forzaba HTTPS, y sin CSP cualquier inyección de script se ejecutaba sin restricción.
//
// CSP — orígenes reales que usa la app (browser):
//   default-src 'self'                         → todo lo no especificado solo desde el propio origen.
//   script-src 'self' 'unsafe-inline'          → bundle propio + el bloque inline JSON-LD (schema.org)
//                                                de client/index.html. En dev se añade 'unsafe-eval'
//                                                y 'unsafe-inline' (Vite HMR necesita eval/inline).
//   style-src 'self' 'unsafe-inline'           → estilos inline de Tailwind/styled + <style>/@font-face
//                                                de index.html + el CSS de Google Fonts.
//                  + https://fonts.googleapis.com
//   font-src 'self' https://fonts.gstatic.com data:  → ficheros .woff de Google Fonts + fuentes embebidas.
//   img-src 'self' data: blob: https:          → imágenes propias/uploads + remotas de artículos
//                                                (imageUrl arbitrario, images.unsplash.com, vonwobeser.com).
//   connect-src 'self'                          → la API es same-origin; en dev se añade ws/wss para
//                                                el HMR de Vite y el WebSocket /ws/pipeline.
//   frame-ancestors 'none'                      → nadie puede embeber el sitio en un <iframe> (anti-clickjacking).
// Las llamadas a OpenAI/Anthropic/Gemini/ipapi son server-side (el navegador NO las hace),
// por eso NO van en connect-src.
const isProd = process.env.NODE_ENV === "production";
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: isProd
          ? ["'self'", "'unsafe-inline'"]
          : ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        connectSrc: isProd ? ["'self'"] : ["'self'", "ws:", "wss:"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        // Google Maps embed (MapSection en Home/Contact/Offices) sirve el iframe
        // desde www.google.com. Sin frameSrc los iframes caen a default-src 'self'
        // y el navegador rechaza el mapa ("Refused to frame"). frameAncestors (arriba)
        // controla quién PUEDE enmarcarnos; frameSrc controla qué PODEMOS enmarcar.
        frameSrc: ["'self'", "https://www.google.com"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        // upgrade-insecure-requests solo en prod; en dev (http://localhost) rompería los assets.
        upgradeInsecureRequests: isProd ? [] : null,
      },
    },
    // HSTS solo tiene sentido sobre HTTPS (prod). En dev se desactiva para no marcar
    // localhost como HTTPS-only en el navegador.
    hsts: isProd ? { maxAge: 15552000, includeSubDomains: true } : false,
    // El SPA y los assets se sirven cross-route; COEP estricto rompería recursos sin CORP.
    crossOriginEmbedderPolicy: false,
    // Permite que imágenes/fuentes de otros orígenes (Google Fonts, unsplash) carguen.
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// CORS: antes reflejaba cualquier origen (origin: true) con credentials → cualquier sitio
// podía hacer peticiones autenticadas. Ahora usa allowlist desde CORS_ORIGIN (coma-separada).
// El sitio sirve front + API en el mismo origen, así que las peticiones normales son
// same-origin y NO dependen de CORS; esto solo cierra el cross-origin abusivo.
const corsOrigin: string[] | false = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean)
  : process.env.NODE_ENV === "production"
    ? false
    : ["http://localhost:5001", "http://localhost:5000"];

app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Rate limiting en endpoints sensibles (antes solo existía en /api/admin/login).
// Traducción → consume OpenAI (ataque de costo); contacto → spam; agentes → abuso autenticado.
const translateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas solicitudes de traducción. Intenta más tarde." },
});
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados envíos. Intenta más tarde." },
});
const agentsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(["/api/translate", "/api/translate-content", "/api/translate-entity"], translateLimiter);
app.use("/api/contact", contactLimiter);
app.use("/api/agents", agentsLimiter);

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
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      // No se vuelca el cuerpo de la respuesta: antes se serializaba completo, filtrando
      // PII y tokens a los logs. En desarrollo se puede inspeccionar con LOG_RESPONSE_BODY=1.
      if (capturedJsonResponse && process.env.LOG_RESPONSE_BODY === "1") {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // El setup previo al listen (registerRoutes + vite/static) se envuelve en try-catch:
  // antes un fallo aquí producía una promise rejection silenciosa (la IIFE no tenía
  // manejo de errores) → el server nunca llegaba a listen y solo se veía "connection
  // refused". Ahora cualquier fallo se loguea de forma explícita y fatal.
  try {
    await registerRoutes(httpServer, app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ error: message });
      throw err;
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
  } catch (err) {
    log(
      `[startup] error fatal durante el setup previo al listen: ${err instanceof Error ? err.stack ?? err.message : err}`,
      "fatal",
    );
    throw err;
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
      // SO_REUSEPORT existe en Linux (Replit) pero no en macOS/algunos BSD,
      // donde listen() lanza ENOTSUP. Solo se habilita donde está soportado.
      reusePort: process.platform === "linux",
    },
    async () => {
      log(`serving on port ${port}`);
      
      // Initialize and start the agent orchestrator
      try {
        await orchestrator.initialize();
        orchestrator.start(2000); // Process jobs every 2 seconds
        log("Agent orchestrator initialized and started", "agents");
      } catch (error) {
        log(`Failed to initialize agent orchestrator: ${error}`, "agents");
      }

      // Hourly maintenance tick — clean expired admin sessions
      setInterval(async () => {
        try {
          const count = await storage.cleanExpiredSessions();
          if (count > 0) {
            log(`[Scheduler] Cleaned ${count} expired sessions`, "scheduler");
          }
        } catch (err) {
          log(`[Scheduler] Error during hourly tick: ${err}`, "scheduler");
        }
      }, 60 * 60 * 1000);
    },
  );
})();
