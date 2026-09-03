import type { Express, NextFunction, Request, Response } from "express";
import path from "node:path";
import { contactFormSchema, newsletterSubscribeSchema } from "@shared/schema";
import { getLocalizedAttorneyRole, getLocalizedAttorneyTitle } from "@shared/attorneyTitles";
import { getAttorneyPublicName, getAttorneySearchName } from "@shared/attorneyName";
import { z } from "zod";
import { checkSharedRateLimit, recordSharedRateLimitAttempt } from "../auth";
import {
  deletePersistentPrivateCv,
  persistPrivateCvFile,
  PrivateDocumentStorageUnavailableError,
  privateDocumentStorageStatus,
} from "../media/privateDocuments";
import { isPublishedPublicPractice, isPublicPracticeSlug } from "../mirror/publicPracticeGroups";
import { CATEGORIES as ATTORNEY_CATEGORIES } from "../mirror/renderAttorneyList";
import {
  acceptQuarantinedCv,
  removeUploadQuietly,
  scanFileForMalware,
  validateCvFile,
} from "../security/uploads";
import { storage } from "../storage";
import { requestNetworkPseudonym } from "../security/privacy";
import { verifyNewsletterUnsubscribeToken } from "../security/newsletterUnsubscribe";
import { cvUpload } from "./uploadMiddleware";
import { getNavigationAvailability } from "../mirror/navigationConfiguration";
import { buildSearchableEditorialPages } from "../mirror/searchEditorialPages";
import { getConfigMap } from "../mirror/siteConfig";
import { escapeHtmlAttribute } from "../mirror/htmlEscape";

const isNewsPubliclyVisible = (news: { published?: boolean | null; publishAt?: Date | string | null }): boolean =>
  news.published === true && (!news.publishAt || new Date(news.publishAt) <= new Date());

/**
 * The public API follows the same presentation contract as server-rendered
 * pages: second surnames remain in the administrative record, not in browser
 * responses. vCards intentionally continue using the legal/canonical name.
 */
function toPublicTeamMember(member: any) {
  const { givenNames: _givenNames, firstSurname: _firstSurname, secondSurname: _secondSurname, ...publicMember } = member;
  return { ...publicMember, name: getAttorneyPublicName(member) };
}

export function generateVCard(member: any, language: "es" | "en" = "es"): string {
  const vcardText = (value: unknown) => String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
  const safeUri = (value: unknown): string | null => {
    try {
      const url = new URL(String(value ?? ""), "https://www.vonwobeser.com");
      return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
    } catch {
      return null;
    }
  };
  const title = vcardText(getLocalizedAttorneyTitle(member, language));
  const role = vcardText(getLocalizedAttorneyRole(member, language));

  const safeName = vcardText(member.name || member.slug?.replace(/-/g, ' ') || 'Unknown');
  const nameParts = safeName.split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${safeName}`,
    `N:${lastName};${firstName};;;`,
    `ORG:Von Wobeser y Sierra, S.C.`,
    `TITLE:${title}`,
    `ROLE:${role}`,
  ];

  if (member.email) {
    const email = String(member.email).replace(/[\r\n]/g, "").trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) lines.push(`EMAIL;TYPE=WORK:${email}`);
  }

  if (member.phone) {
    const phone = String(member.phone).replace(/[^\d+().\s-]/g, "").slice(0, 40);
    if (phone) lines.push(`TEL;TYPE=WORK,VOICE:${phone}`);
  }

  lines.push(`ADR;TYPE=WORK:;;Torre SOMA Chapultepec Piso 18, Campos Elíseos 204;Ciudad de México;CDMX;11560;México`);
  lines.push(`URL:https://www.vonwobeser.com`);

  const linkedinUrl = safeUri(member.linkedinUrl);
  if (linkedinUrl) {
    lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${linkedinUrl}`);
  }

  const imageUrl = safeUri(member.imageUrl);
  if (imageUrl) {
    lines.push(`PHOTO;VALUE=URI:${imageUrl}`);
  }

  lines.push('END:VCARD');

  return lines.join('\r\n');
}

export function registerPublicContentRoutes(app: Express): void {
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

  // Público (sin authMiddleware): un registro marcado published=false (borrador, perfil
  // dado de baja, etc.) no debe ser alcanzable vía la API solo conociendo su id/slug, aunque
  // el espejo público sí lo filtre correctamente al renderizar HTML. Mismo criterio que
  // isNewsPubliclyVisible más abajo — published=true explícito, no basta con "no false".
  const isPubliclyVisible = (e: { published?: boolean | null }): boolean => e.published === true;

  app.get("/api/practice-groups", async (_req, res) => {
    try {
      const groups = (await storage.getPracticeGroups()).filter(isPublishedPublicPractice);
      res.set("Cache-Control", "public, max-age=60");
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch practice groups" });
    }
  });

  app.get("/api/practice-groups/:idOrSlug", async (req, res) => {
    try {
      const param = req.params.idOrSlug;
      let group = await storage.getPracticeGroupBySlug(param);
      if (!group) {
        group = await storage.getPracticeGroupById(param);
      }
      if (!group || !isPublishedPublicPractice(group)) {
        return res.status(404).json({ error: "Practice group not found" });
      }
      res.json(group);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch practice group" });
    }
  });

  app.get("/api/industry-groups", async (_req, res) => {
    try {
      const groups = (await storage.getIndustryGroups()).filter(isPubliclyVisible);
      res.set("Cache-Control", "public, max-age=60");
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch industry groups" });
    }
  });

  app.get("/api/industry-groups/:idOrSlug", async (req, res) => {
    try {
      const param = req.params.idOrSlug;
      let group = await storage.getIndustryGroupBySlug(param);
      if (!group) {
        group = await storage.getIndustryGroupById(param);
      }
      if (!group || !isPubliclyVisible(group)) {
        return res.status(404).json({ error: "Industry group not found" });
      }
      res.json(group);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch industry group" });
    }
  });

  app.get("/api/team", async (_req, res) => {
    try {
      const members = (await storage.getTeamMembers()).filter(isPubliclyVisible);
      res.set("Cache-Control", "public, max-age=60");
      res.json(members.map(toPublicTeamMember));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch team members" });
    }
  });

  app.get("/api/team/partners", async (_req, res) => {
    try {
      const partners = (await storage.getPartners()).filter(isPubliclyVisible);
      res.set("Cache-Control", "public, max-age=60");
      res.json(partners.map(toPublicTeamMember));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch partners" });
    }
  });

  // Búsqueda de abogados: ?q=nombre&position=partners|of-counsel|counsel|associates&practice=slug
  app.get("/api/team/search", async (req, res) => {
    try {
      const parsed = z.object({
        q: z.string().trim().max(160).optional(),
        position: z.enum(["partners", "of-counsel", "counsel", "associates"]).optional(),
        practice: z.string().trim().regex(/^[a-z0-9-]{1,160}$/).optional(),
      }).safeParse(req.query);
      if (!parsed.success) return res.status(400).json({ error: "Invalid search parameters" });
      const { q, position, practice: practiceSlug } = parsed.data;

      const title = position && ATTORNEY_CATEGORIES[position] ? ATTORNEY_CATEGORIES[position].title : undefined;
      let practiceGroupId: string | undefined;
      if (practiceSlug) {
        const group = await storage.getPracticeGroupBySlug(practiceSlug);
        practiceGroupId = group?.id;
        if (!group) return res.json([]); // práctica inexistente: sin resultados
      }

      const members = await storage.searchTeamMembers({ q, title, practiceGroupId });
      res.set("Cache-Control", "public, max-age=60");
      res.json(members.map(toPublicTeamMember));
    } catch (error) {
      console.error("Team search error:", error);
      res.status(500).json({ error: "Failed to search team members" });
    }
  });

  app.get("/api/team/:idOrSlug", async (req, res) => {
    try {
      const param = req.params.idOrSlug;
      let member = await storage.getTeamMemberBySlug(param);
      if (!member) {
        member = await storage.getTeamMemberById(param);
      }
      if (!member || !isPubliclyVisible(member)) {
        return res.status(404).json({ error: "Team member not found" });
      }
      res.json(toPublicTeamMember(member));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch team member" });
    }
  });

  app.get("/api/team/:idOrSlug/vcard", async (req, res) => {
    try {
      const param = req.params.idOrSlug;
      const langParam = req.query.lang as string;
      const language: "es" | "en" = langParam === "en" ? "en" : "es";

      let member = await storage.getTeamMemberBySlug(param);
      if (!member) {
        member = await storage.getTeamMemberById(param);
      }
      if (!member || !isPubliclyVisible(member)) {
        return res.status(404).json({ error: "Team member not found" });
      }

      const vcard = generateVCard(member, language);
      const filename = member.slug.replace(/[^a-z0-9-]/g, '') + '.vcf';

      res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cache-Control", "no-store");
      res.send(vcard);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate vCard" });
    }
  });

  // Get all news articles related to a team member by slug
  app.get("/api/team/:slug/news", async (req, res) => {
    try {
      const slug = req.params.slug;
      const member = await storage.getTeamMemberBySlug(slug);
      if (!member || !isPubliclyVisible(member)) {
        return res.status(404).json({ error: "Team member not found" });
      }
      const newsList = (await storage.getNewsByTeamMemberId(member.id)).filter(isNewsPubliclyVisible);
      res.json(newsList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch news for team member" });
    }
  });

  // Rate-limit para los 2 formularios PÚBLICOS sin login (contacto y pasantes) — antes no
  // tenían ningún límite de tasa, a diferencia del login. 10 envíos / 15 min por IP basta para
  // uso legítimo (un visitante no manda 10 formularios en 15 min) y frena spam/abuso masivo.
  const PUBLIC_FORM_POLICY = {
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000,
    blockDurationMs: 15 * 60 * 1000,
  };
  const publicFormLimiter = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const identifier = req.ip || req.socket.remoteAddress || "unknown";
      const status = await checkSharedRateLimit("public-form", identifier, PUBLIC_FORM_POLICY);
      if (!status.allowed) {
        res.setHeader("Retry-After", String(status.retryAfter || 60));
        return res.status(429).json({ error: "Demasiados envíos, intenta de nuevo más tarde." });
      }
      await recordSharedRateLimitAttempt("public-form", identifier, PUBLIC_FORM_POLICY);
      next();
    } catch (error) {
      console.error("Public form rate limit error:", error);
      res.status(503).json({ error: "No fue posible procesar el envío en este momento." });
    }
  };

  app.post("/api/contact", publicFormLimiter, async (req, res) => {
    try {
      const validationResult = contactFormSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validationResult.error.errors
        });
      }

      const contactData = validationResult.data;

      const sanitize = (str: string) => str.replace(/<[^>]*>/g, '').trim();

      const sanitizedData = {
        fullName: sanitize(contactData.fullName),
        email: contactData.email.trim().toLowerCase(),
        phone: contactData.phone ? sanitize(contactData.phone) : undefined,
        company: contactData.company ? sanitize(contactData.company) : undefined,
        country: sanitize(contactData.country),
        practiceArea: contactData.practiceArea ? sanitize(contactData.practiceArea) : undefined,
        message: sanitize(contactData.message),
        acceptedPrivacy: true,
        consentedAt: new Date(),
        ipAddress: requestNetworkPseudonym(req),
      };

      const submission = await storage.createContactSubmission(sanitizedData);

      console.log(`[Contact] New submission saved with id ${submission.id}`);

      res.json({ success: true, message: "Contact form submitted successfully" });
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(500).json({ error: "Failed to process contact form" });
    }
  });

  // Newsletter público: el resultado es intencionalmente genérico. Así no se
  // revela si un correo ya estaba registrado y se permite reactivar una baja.
  app.post("/api/newsletter/subscribe", publicFormLimiter, async (req, res) => {
    try {
      const validation = newsletterSubscribeSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Validation failed", details: validation.error.errors });
      }

      const sanitize = (value: string) => value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
      const data = validation.data;
      const email = data.email.trim().toLowerCase();
      const consentedAt = new Date();
      const existing = await storage.getNewsletterSubscriberByEmail(email);

      if (!existing) {
        await storage.createNewsletterSubscriber({
          name: sanitize(data.name),
          email,
          company: sanitize(data.company),
          preferredLanguage: data.language === "en" ? "en" : "es",
          isVerified: false,
          isActive: true,
          consentedAt,
          source: "home",
          unsubscribedAt: null,
        });
      } else if (!existing.isActive) {
        await storage.updateNewsletterSubscriber(existing.id, {
          name: sanitize(data.name),
          company: sanitize(data.company),
          preferredLanguage: data.language === "en" ? "en" : "es",
          isActive: true,
          consentedAt,
          source: "home",
          unsubscribedAt: null,
        });
      }

      res.json({ success: true, message: "Subscription received" });
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      res.status(500).json({ error: "Failed to process subscription" });
    }
  });

  // La visita desde un correo solo muestra confirmación; no modifica estado mediante GET,
  // porque los escáneres automáticos de enlaces podrían activar una baja accidental.
  app.get("/newsletter/unsubscribe", (req, res) => {
    const token = typeof req.query.token === "string" && /^[A-Za-z0-9_-]{60,80}$/.test(req.query.token)
      ? req.query.token
      : "";
    const escapedToken = escapeHtmlAttribute(token);
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Referrer-Policy", "no-referrer");
    // La interpolación usa un valor base64url de longitud acotada y además escape
    // contextual de atributo; no se inserta HTML libre.
    // nosemgrep: javascript.express.security.injection.raw-html-format.raw-html-format
    res.type("html").send(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Baja de newsletter</title></head><body><main><h1>Cancelar suscripción</h1><p>Confirma que deseas dejar de recibir el newsletter.</p><form method="post" action="/api/newsletter/unsubscribe"><input type="hidden" name="token" value="${escapedToken}"><button type="submit">Confirmar baja</button></form></main></body></html>`);
  });

  app.post("/api/newsletter/unsubscribe", publicFormLimiter, async (req, res) => {
    res.setHeader("Cache-Control", "private, no-store");
    const parsed = z.object({ token: z.string().regex(/^[A-Za-z0-9_-]{60,80}$/) }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid unsubscribe request" });
    try {
      const subscriberId = verifyNewsletterUnsubscribeToken(parsed.data.token);
      if (subscriberId) {
        const subscriber = await storage.getNewsletterSubscriberById(subscriberId);
        if (subscriber?.isActive) {
          await storage.updateNewsletterSubscriber(subscriber.id, {
            isActive: false,
            unsubscribedAt: new Date(),
          });
        }
      }
      if (req.is("application/x-www-form-urlencoded")) {
        return res.type("html").send("<!doctype html><html lang=\"es\"><head><meta charset=\"utf-8\"><title>Suscripción cancelada</title></head><body><main><h1>Solicitud procesada</h1><p>Tu preferencia de newsletter fue actualizada.</p></main></body></html>");
      }
      return res.json({ success: true, message: "Unsubscribe request processed" });
    } catch {
      return res.status(503).json({ error: "Unable to process unsubscribe request" });
    }
  });

  // Formulario de "Pasantes" — antes era HTML de Joomla con action="" (no llegaba a
  // ningún lado). Los campos del multipart (name, l_name, mail, tel, comment, accept)
  // vienen tal cual del HTML original capturado; se mapean a las columnas de career_applications.
  app.post("/api/career-applications", publicFormLimiter, cvUpload.single("uploaded_file"), async (req, res) => {
    let acceptedCvPath: string | undefined;
    let acceptedCvStoragePath: string | undefined;
    let acceptedCvPersisted = false;
    try {
      const bodySchema = z.object({
        name: z.string().trim().min(1).max(120),
        l_name: z.string().trim().min(1).max(120),
        mail: z.string().trim().email().max(254),
        tel: z.string().trim().max(32).optional(),
        comment: z.string().trim().max(2_000).optional(),
        accept: z.string().min(1),
      }).strict();
      const validationResult = bodySchema.safeParse(req.body);
      if (!validationResult.success) {
        await removeUploadQuietly(req.file?.path);
        return res.status(400).json({ error: "Revisa los campos obligatorios y el Aviso de Privacidad." });
      }
      if (!req.file) {
        return res.status(400).json({ error: "Adjunta tu hoja de vida (PDF, DOC o DOCX)." });
      }
      if (!await validateCvFile(req.file.path, req.file.mimetype)) {
        await removeUploadQuietly(req.file.path);
        return res.status(400).json({ error: "El contenido del archivo no corresponde a un PDF, DOC o DOCX válido." });
      }
      // En producción, el CV nunca puede permanecer sólo en el disco efímero
      // de Replit. Detectamos la ausencia de App Storage antes de procesar la
      // solicitud para dar una respuesta accionable y no simular un envío que
      // se perdería en el siguiente despliegue.
      const privateStorage = await privateDocumentStorageStatus();
      if (privateStorage.required && !privateStorage.available) {
        await removeUploadQuietly(req.file.path);
        return res.status(503).json({
          error: "La plataforma para recibir hojas de vida está temporalmente no disponible. Intenta de nuevo más tarde.",
          code: "CV_STORAGE_UNAVAILABLE",
        });
      }
      await scanFileForMalware(req.file.path);
      const acceptedCv = await acceptQuarantinedCv(req.file.path, req.file.mimetype);
      acceptedCvPath = acceptedCv.absolutePath;
      acceptedCvStoragePath = acceptedCv.storagePath;
      const persistence = await persistPrivateCvFile(acceptedCv.absolutePath, acceptedCv.storagePath);
      acceptedCvPersisted = persistence.persisted;

      const data = validationResult.data;
      const sanitize = (str: string) => str.replace(/<[^>]*>/g, "").trim();
      const safeOriginalName = path.basename(req.file.originalname)
        .replace(/[\u0000-\u001f\u007f]/g, "")
        .slice(0, 180);

      const application = await storage.createCareerApplication({
        firstName: sanitize(data.name),
        lastName: sanitize(data.l_name),
        email: data.mail.trim().toLowerCase(),
        phone: data.tel ? sanitize(data.tel) : undefined,
        address: data.comment ? sanitize(data.comment) : undefined,
        cvPath: acceptedCv.storagePath,
        cvOriginalName: safeOriginalName,
        acceptedPrivacy: true,
        ipAddress: requestNetworkPseudonym(req),
      });

      console.log(`[CareerApplications] Submission saved with id ${application.id}`);

      if (acceptedCvPersisted) {
        await removeUploadQuietly(acceptedCvPath);
        acceptedCvPath = undefined;
      }

      res.json({ success: true, message: "Application submitted successfully" });
    } catch (error: unknown) {
      await removeUploadQuietly(req.file?.path);
      await removeUploadQuietly(acceptedCvPath);
      if (acceptedCvPersisted && acceptedCvStoragePath) {
        await deletePersistentPrivateCv(acceptedCvStoragePath).catch(() => undefined);
      }
      // No se registra el cuerpo de la solicitud, nombre de archivo ni correo.
      // Basta con un código técnico para investigar sin exponer datos de una
      // candidatura en los logs de producción.
      const rawCode = error instanceof PrivateDocumentStorageUnavailableError
        ? "CV_STORAGE_UNAVAILABLE"
        : (typeof (error as { code?: unknown })?.code === "string"
          ? String((error as { code: string }).code).slice(0, 40)
          : "CAREER_APPLICATION_PROCESSING_FAILED");
      const code = rawCode === "CV_STORAGE_UNAVAILABLE"
        ? "CV_STORAGE_UNAVAILABLE"
        : rawCode === "42P01"
          ? "CAREER_APPLICATIONS_SCHEMA_PENDING"
          : "CAREER_APPLICATION_PROCESSING_FAILED";
      console.error(`[CareerApplications] processing failed code=${code}`);
      if (code === "CV_STORAGE_UNAVAILABLE") {
        return res.status(503).json({
          error: "La plataforma para recibir hojas de vida está temporalmente no disponible. Intenta de nuevo más tarde.",
          code,
        });
      }
      if (code === "CAREER_APPLICATIONS_SCHEMA_PENDING") {
        return res.status(503).json({
          error: "El sistema de solicitudes se está preparando. Intenta de nuevo en unos minutos.",
          code,
        });
      }
      return res.status(500).json({ error: "No fue posible procesar la solicitud.", code });
    }
  });

  app.get("/api/representative-matters", async (_req, res) => {
    try {
      const matters = await storage.getRepresentativeMatters();
      res.json(matters);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch representative matters" });
    }
  });

  app.get("/api/practice-groups/:slug/representative-matters", async (req, res) => {
    try {
      const { slug } = req.params;
      if (!isPublicPracticeSlug(slug)) return res.status(410).json({ error: "Practice group retired" });
      const allMatters = await storage.getRepresentativeMatters();
      const filtered = allMatters.filter(m => m.practiceAreaSlug === slug);
      res.json(filtered);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch representative matters" });
    }
  });

  // Events API routes
  app.get("/api/events", async (_req, res) => {
    try {
      const eventsList = await storage.getEvents();
      res.json(eventsList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/events/upcoming", async (req, res) => {
    try {
      const parsed = z.coerce.number().int().min(1).max(50).default(4).safeParse(req.query.limit);
      if (!parsed.success) return res.status(400).json({ error: "Invalid limit" });
      const limit = parsed.data;
      const eventsList = await storage.getUpcomingEvents(limit);
      res.json(eventsList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch upcoming events" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEventById(req.params.id);
      if (!event || !isPubliclyVisible(event)) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  app.get("/api/search", async (req, res) => {
    try {
      const parsed = z.string().trim().max(200).safeParse(req.query.q || "");
      if (!parsed.success) return res.status(400).json({ error: "Invalid search" });
      const query = parsed.data.toLowerCase();
      if (!query || query.length < 2) {
        return res.json({ team: [], practiceGroups: [], industryGroups: [], news: [], events: [], pages: [] });
      }

      // Noticias vía SQL acotado (ILIKE+LIMIT); el resto son tablas pequeñas. Filtradas a
      // published=true antes de buscar — este endpoint es público, sin authMiddleware.
      const [teamRaw, practiceGroupsRaw, industryGroupsRaw, filteredNews, eventsRaw, config] = await Promise.all([
        storage.getTeamMembers(),
        storage.getPracticeGroups(),
        storage.getIndustryGroups(),
        storage.searchNews(query, 5),
        storage.getEvents(),
        getConfigMap(),
      ]);
      const editorialPages = buildSearchableEditorialPages(config, await getNavigationAvailability(config));
      const team = teamRaw.filter(isPubliclyVisible);
      const practiceGroups = practiceGroupsRaw.filter(isPublishedPublicPractice);
      const industryGroups = industryGroupsRaw.filter(isPubliclyVisible);

      const filteredTeam = team.filter(m =>
        getAttorneySearchName(m).toLowerCase().includes(query) ||
        m.title.toLowerCase().includes(query) ||
        m.titleEs.toLowerCase().includes(query) ||
        m.role.toLowerCase().includes(query) ||
        m.roleEs.toLowerCase().includes(query) ||
        (m.bio && m.bio.toLowerCase().includes(query)) ||
        (m.bioEs && m.bioEs.toLowerCase().includes(query))
      ).slice(0, 10);

      const filteredPractice = practiceGroups.filter(g =>
        g.name.toLowerCase().includes(query) ||
        g.nameEs.toLowerCase().includes(query) ||
        g.description.toLowerCase().includes(query) ||
        g.descriptionEs.toLowerCase().includes(query)
      ).slice(0, 5);

      const filteredIndustry = industryGroups.filter(g =>
        g.name.toLowerCase().includes(query) ||
        g.nameEs.toLowerCase().includes(query) ||
        g.description.toLowerCase().includes(query) ||
        g.descriptionEs.toLowerCase().includes(query)
      ).slice(0, 5);

      const filteredEvents = eventsRaw.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.titleEs.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.descriptionEs.toLowerCase().includes(query) ||
        Boolean(event.location?.toLowerCase().includes(query)) ||
        Boolean(event.locationEs?.toLowerCase().includes(query))
      ).slice(0, 5);
      const pages = editorialPages.filter(page => [page.title, page.titleEs, page.description, page.descriptionEs]
        .some(value => value.toLowerCase().includes(query)));

      res.json({
        team: filteredTeam.map(toPublicTeamMember),
        practiceGroups: filteredPractice,
        industryGroups: filteredIndustry,
        news: filteredNews,
        events: filteredEvents,
        pages,
      });
    } catch (error) {
      res.status(500).json({ error: "Search failed" });
    }
  });
}
