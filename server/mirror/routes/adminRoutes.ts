import type { Express } from "express";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { authMiddleware, requirePermission } from "../../auth";
import { db } from "../../db";
import { getEditorialTypography, replaceEditorialTypography } from "../../editorialTypography";
import { getCookieConsentConfig, cookieConsentSchema, saveCookieConsentConfig } from "../../privacy/cookieConsent";
import { storage } from "../../storage";
import { insertOfficeSchema, offices, siteConfig } from "@shared/schema";
import { invalidatePublicPageCache } from "../pageCache";
import { sanitizeCms } from "../sanitize";
import {
  getConfigMap,
  getFirmPreviousVersion,
  invalidateConfigCache,
  isOfficeConfigKey,
  isRichTextConfigKey,
  restoreFirmPreviousVersion,
  upsertConfig,
  type ConfigMap,
} from "../siteConfig";
import { getFaviconHref, setFaviconConfig } from "../seo";
import type { Lang } from "../htmlPipeline";
import type { MirrorRuntime } from "../runtime";
import {
  adminNavigationPayload,
  getNavigationAvailability,
  navigationConfigurationFromConfig,
  navigationConfigurationSchema,
  navigationRevision,
  parseNavigationConfiguration,
  unavailableRequestedDestinations,
} from "../navigationConfiguration";
import { invalidatePublicNavigationMenuCache } from "../navigationMenu";

export function registerMirrorAdminRoutes(app: Express, runtime: MirrorRuntime): void {
  const {
    MANAGED_VIDEO_CONFIG_KEY,
    VIDEO_SOURCE_ERROR,
    escHtml,
    normalizedManagedVideoValue,
    wrap,
  } = runtime;

  // ---------- Admin: micrositio de oficinas ----------------------------
  const officeConfigEntrySchema = z.object({
    value: z.string().max(25_000),
    valueEs: z.string().max(25_000).optional(),
  });
  const officeShowcaseUpdateSchema = z.object({
    config: z.record(officeConfigEntrySchema).optional(),
    office: z.record(z.unknown()).optional(),
  });

  app.get("/api/admin/office-showcase", authMiddleware, requirePermission("config"), wrap(async (_req, res) => {
    const [configMap, officeRows, gallery] = await Promise.all([
      getConfigMap(),
      storage.getOffices(),
      storage.getOfficeImages(),
    ]);
    const config = Object.fromEntries(Object.entries(configMap).filter(([key]) => isOfficeConfigKey(key)));
    const office = officeRows.find((item) => item.isHeadquarters) || officeRows[0] || null;
    res.json({ config, office, gallery: [...gallery].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) });
  }));

  app.put("/api/admin/office-showcase", authMiddleware, requirePermission("config"), wrap(async (req, res) => {
    const payload = officeShowcaseUpdateSchema.parse(req.body || {});
    const currentConfig = await getConfigMap();
    const configEntries = Object.entries(payload.config || {});
    for (const [key, entry] of configEntries) {
      if (!isOfficeConfigKey(key)) {
        res.status(400).json({ error: `Invalid office config key: ${key}` });
        return;
      }
      if (MANAGED_VIDEO_CONFIG_KEY.test(key)) {
        const normalized = normalizedManagedVideoValue(key, entry.value);
        const normalizedEs = normalizedManagedVideoValue(key, entry.valueEs ?? entry.value);
        if (normalized == null || normalizedEs == null) {
          res.status(400).json({ error: VIDEO_SOURCE_ERROR });
          return;
        }
        entry.value = normalized;
        entry.valueEs = normalizedEs;
      }
    }

    const officeInput = payload.office ? { ...payload.office } : null;
    const officeId = typeof officeInput?.id === "string" ? officeInput.id : undefined;
    if (officeInput) {
      delete officeInput.id;
      delete officeInput.createdAt;
    }
    const parsedOffice = officeInput ? insertOfficeSchema.partial().parse(officeInput) : null;

    await db.transaction(async (tx) => {
      for (const [key, entry] of configEntries) {
        const existing = currentConfig[key];
        const type = existing?.type || (/(_video_|_image|_logo|_pdf|_map_|_linkedin|_x$)/.test(key) ? "url" : "text");
        await tx.insert(siteConfig).values({
          key,
          value: entry.value,
          valueEs: entry.valueEs ?? entry.value,
          type,
          category: "offices",
          updatedAt: new Date(),
        }).onConflictDoUpdate({
          target: siteConfig.key,
          set: { value: entry.value, valueEs: entry.valueEs ?? entry.value, updatedAt: new Date() },
        });
      }

      if (parsedOffice && officeId) {
        await tx.update(offices).set(parsedOffice).where(eq(offices.id, officeId));
      } else if (parsedOffice) {
        const completeOffice = insertOfficeSchema.parse(parsedOffice);
        await tx.insert(offices).values(completeOffice);
      }
    });

    invalidateConfigCache();
    const [updatedConfig, updatedOffices, gallery] = await Promise.all([
      getConfigMap(), storage.getOffices(), storage.getOfficeImages(),
    ]);
    res.json({
      ok: true,
      config: Object.fromEntries(Object.entries(updatedConfig).filter(([key]) => isOfficeConfigKey(key))),
      office: updatedOffices.find((item) => item.isHeadquarters) || updatedOffices[0] || null,
      gallery: [...gallery].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    });
  }));

  app.get("/api/admin/site-navigation", authMiddleware, requirePermission("config"), wrap(async (_req, res) => {
    const config = await getConfigMap();
    const configuration = navigationConfigurationFromConfig(config);
    res.json(adminNavigationPayload(configuration, await getNavigationAvailability(config)));
  }));

  app.put("/api/admin/site-navigation", authMiddleware, requirePermission("config"), wrap(async (req, res) => {
    const requestSchema = z.object({
      version: z.literal(2),
      revision: z.string().trim().length(16),
      configuration: navigationConfigurationSchema,
    }).strict();
    const parsed = requestSchema.safeParse(req.body || {});
    if (!parsed.success) {
      res.status(400).json({ error: "Estructura de navegación inválida", details: parsed.error.flatten() });
      return;
    }

    const currentConfig = await getConfigMap();
    const current = navigationConfigurationFromConfig(currentConfig);
    if (parsed.data.revision !== navigationRevision(current)) {
      res.status(409).json({
        error: "La navegación cambió mientras la editabas. Recarga antes de guardar.",
        code: "NAVIGATION_REVISION_STALE",
      });
      return;
    }
    const availability = await getNavigationAvailability(currentConfig);
    const unavailable = unavailableRequestedDestinations(parsed.data.configuration, availability, current);
    if (unavailable.length) {
      res.status(400).json({
        error: "No se pueden activar destinos que todavía no tienen contenido público.",
        code: "NAVIGATION_DESTINATION_NOT_READY",
        destinations: unavailable,
      });
      return;
    }

    const configuration = parsed.data.configuration;
    const byId = new Map(configuration.items.map((item) => [item.id, item]));
    const legacyDefinitions = [
      ["firm", "nav_firm"],
      ["attorneys", "nav_attorneys"],
      ["practices", "nav_practices"],
      ["industries", "nav_industries"],
      ["perspectives", "nav_publications"],
      ["talent", "nav_careers"],
    ] as const;
    const saved = await db.transaction(async (tx) => {
      // Serializa las ediciones del menú y vuelve a comprobar la revisión dentro de
      // la misma transacción. La comprobación previa mejora el mensaje habitual,
      // pero por sí sola permitiría una carrera entre dos administradores.
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('vw-navigation-v2'))`);
      const [storedNavigation] = await tx
        .select({ value: siteConfig.value })
        .from(siteConfig)
        .where(eq(siteConfig.key, "nav_structure_v2"))
        .limit(1);
      let authoritative = current;
      if (storedNavigation?.value) {
        try {
          authoritative = parseNavigationConfiguration(JSON.parse(storedNavigation.value));
        } catch {
          // Un valor heredado inválido conserva el mismo fallback seguro que la lectura pública.
        }
      }
      if (parsed.data.revision !== navigationRevision(authoritative)) return false;

      await tx.insert(siteConfig).values({
        key: "nav_structure_v2",
        value: JSON.stringify(configuration),
        valueEs: JSON.stringify(configuration),
        type: "json",
        category: "navigation",
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: siteConfig.key,
        set: { value: JSON.stringify(configuration), valueEs: JSON.stringify(configuration), updatedAt: new Date() },
      });

      // Mantener las claves históricas sincronizadas permite volver al render previo sin
      // perder etiquetas si hubiera que hacer rollback del código.
      for (const [id, key] of legacyDefinitions) {
        const item = byId.get(id)!;
        await tx.insert(siteConfig).values({
          key,
          value: item.labelEn,
          valueEs: item.labelEs,
          type: "text",
          category: "navigation",
          updatedAt: new Date(),
        }).onConflictDoUpdate({
          target: siteConfig.key,
          set: { value: item.labelEn, valueEs: item.labelEs, updatedAt: new Date() },
        });
        const visible = String(item.visible);
        await tx.insert(siteConfig).values({
          key: `nav_visible_${id === "perspectives" ? "publications" : id === "talent" ? "careers" : id}`,
          value: visible,
          valueEs: visible,
          type: "boolean",
          category: "navigation",
          updatedAt: new Date(),
        }).onConflictDoUpdate({
          target: siteConfig.key,
          set: { value: visible, valueEs: visible, updatedAt: new Date() },
        });
      }
      await tx.insert(siteConfig).values({
        key: "nav_search",
        value: configuration.utilities.search.labelEn,
        valueEs: configuration.utilities.search.labelEs,
        type: "text",
        category: "navigation",
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: siteConfig.key,
        set: { value: configuration.utilities.search.labelEn, valueEs: configuration.utilities.search.labelEs, updatedAt: new Date() },
      });
      await tx.insert(siteConfig).values({
        key: "nav_contact",
        value: configuration.utilities.contact.labelEn,
        valueEs: configuration.utilities.contact.labelEs,
        type: "text",
        category: "navigation",
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: siteConfig.key,
        set: { value: configuration.utilities.contact.labelEn, valueEs: configuration.utilities.contact.labelEs, updatedAt: new Date() },
      });
      return true;
    });
    if (!saved) {
      res.status(409).json({
        error: "La navegación cambió mientras la editabas. Recarga antes de guardar.",
        code: "NAVIGATION_REVISION_STALE",
      });
      return;
    }
    invalidateConfigCache();
    invalidatePublicNavigationMenuCache();
    invalidatePublicPageCache();
    const updatedConfig = await getConfigMap();
    res.json({
      ok: true,
      ...adminNavigationPayload(configuration, await getNavigationAvailability(updatedConfig)),
    });
  }));

  // ---------- Admin: editable site config (texts, hero video, etc.) -----
  app.get("/api/admin/site-config", authMiddleware, requirePermission("config"), wrap(async (_req, res) => {
    res.json(await getConfigMap());
  }));
  // Las preferencias de configuración editorial conservan el mismo formato
  // central, pero respetan el permiso `config` (no el de contenido general).
  const configTypographyPayload = z.object({
    styles: z.array(z.object({
      field: z.enum(["value", "valueEs"]),
      language: z.enum(["en", "es"]),
      family: z.enum(["auto", "gelasio", "inter"]),
    })).min(1).max(2),
  });
  app.get("/api/admin/site-config/:key/typography", authMiddleware, requirePermission("config"), wrap(async (req, res) => {
    const key = String(req.params.key || "");
    const config = (await getConfigMap())[key];
    if (!config || !["text", "html"].includes(config.type)) return res.status(404).json({ error: "Campo editorial no encontrado" });
    res.json({ styles: await getEditorialTypography("site_config", key) });
  }));
  app.put("/api/admin/site-config/:key/typography", authMiddleware, requirePermission("config"), wrap(async (req, res) => {
    const key = String(req.params.key || "");
    const payload = configTypographyPayload.safeParse(req.body);
    const config = (await getConfigMap())[key];
    if (!payload.success || !config || !["text", "html"].includes(config.type)) {
      return res.status(400).json({ error: "Tipografía o campo editorial inválido" });
    }
    const styles = await replaceEditorialTypography("site_config", key, payload.data.styles);
    invalidatePublicPageCache();
    res.json({ styles });
  }));
  // La versión anterior se conserva exclusivamente como respaldo editorial. Esta
  // previsualización requiere sesión administrativa y se marca explícitamente
  // como no indexable para que nunca vuelva a convertirse en una ruta pública.
  app.get("/api/admin/site-config/firma/previous-version/preview", authMiddleware, requirePermission("config"), wrap(async (req, res) => {
    const previous = await getFirmPreviousVersion();
    if (!previous) {
      res.status(404).json({ error: "No existe una versión anterior disponible." });
      return;
    }
    const lang: Lang = req.query.lang === "en" ? "en" : "es";
    const pick = (key: string) => {
      const content = previous.content[key];
      return escHtml(lang === "es" ? content?.valueEs : content?.value).replace(/\n/g, "<br>");
    };
    res.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    res.type("html").send(`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow,noarchive"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${lang === "es" ? "Versión anterior — Nuestra Firma" : "Previous version — Our Firm"}</title><style>body{margin:0;background:#f6f6f4;color:#3f3f3f;font-family:Inter,sans-serif}.vw-preview{max-width:940px;margin:0 auto;padding:56px 28px 72px}.vw-preview__eyebrow{margin:0 0 20px;color:#b71932;font-size:12px;font-weight:500;letter-spacing:.2em;text-transform:uppercase}.vw-preview h1{margin:0 0 34px;font:400 clamp(2.3rem,6vw,4.8rem)/1.02 Gelasio,serif;color:#333}.vw-preview__copy{max-width:760px;font-size:1.1rem;line-height:1.7}.vw-preview__copy p{margin:0 0 24px}</style></head><body><main class="vw-preview"><p class="vw-preview__eyebrow">${lang === "es" ? "Vista interna no indexable" : "Internal, non-indexable preview"}</p><h1>${lang === "es" ? "Versión anterior" : "Previous version"}</h1><section class="vw-preview__copy"><p>${pick("firm_landing_history_intro")}</p><p>${pick("firm_landing_history_body")}</p></section></main></body></html>`);
  }));
  app.post("/api/admin/site-config/firma/restore-previous", authMiddleware, requirePermission("config"), wrap(async (req, res) => {
    if (req.body?.confirm !== true) {
      res.status(400).json({ error: "Confirma la restauración de la versión anterior." });
      return;
    }
    if (!await restoreFirmPreviousVersion()) {
      res.status(404).json({ error: "No existe una versión anterior disponible." });
      return;
    }
    invalidatePublicPageCache();
    res.json({ ok: true });
  }));
  app.get("/api/admin/cookie-consent", authMiddleware, requirePermission("config"), wrap(async (_req, res) => {
    res.json(await getCookieConsentConfig());
  }));
  app.put("/api/admin/cookie-consent", authMiddleware, requirePermission("config"), wrap(async (req, res) => {
    const parsed = cookieConsentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Configuración de privacidad inválida", details: parsed.error.flatten() });
      return;
    }
    const saved = await saveCookieConsentConfig(parsed.data);
    invalidateConfigCache();
    invalidatePublicPageCache();
    res.json(saved);
  }));
  app.put("/api/admin/site-config/:key", authMiddleware, requirePermission("config"), wrap(async (req, res) => {
    let { value, valueEs } = req.body || {};
    if (req.params.key === "home_news_pages") {
      const parsedPages = z.coerce.number().int().min(1).max(10).safeParse(value);
      if (!parsedPages.success) {
        res.status(400).json({ error: "El número de páginas de noticias debe estar entre 1 y 10." });
        return;
      }
      value = String(parsedPages.data);
      valueEs = String(parsedPages.data);
    }
    if (req.params.key === "home_about_layout") {
      const parsedLayout = z.enum(["editorial", "classic"]).safeParse(value);
      if (!parsedLayout.success) {
        res.status(400).json({ error: "El diseño de Visión, Misión y Valores debe ser editorial o clásico." });
        return;
      }
      value = parsedLayout.data;
      valueEs = parsedLayout.data;
    }
    // Solo las claves de prosa de páginas institucionales pasan por el editor de texto
    // enriquecido — el resto (URLs de video, banner corto, redes, teléfono) se guarda tal cual.
    if (isRichTextConfigKey(req.params.key)) {
      value = sanitizeCms(value ?? "");
      if (valueEs != null) valueEs = sanitizeCms(valueEs);
    }
    if (MANAGED_VIDEO_CONFIG_KEY.test(req.params.key)) {
      const normalized = normalizedManagedVideoValue(req.params.key, value);
      const normalizedEs = valueEs == null ? undefined : normalizedManagedVideoValue(req.params.key, valueEs);
      if (normalized == null || normalizedEs === null) {
        res.status(400).json({ error: VIDEO_SOURCE_ERROR });
        return;
      }
      value = normalized;
      if (normalizedEs !== undefined) valueEs = normalizedEs;
    }
    await upsertConfig(req.params.key, value ?? "", valueEs);
    const { analyzeLinguisticText } = await import("../../audits/linguisticAudit");
    const linguisticWarnings = [
      ...analyzeLinguisticText(value ?? "", "en").map((finding) => ({ field: "value", lang: "en", ...finding })),
      ...analyzeLinguisticText(valueEs ?? "", "es").map((finding) => ({ field: "valueEs", lang: "es", ...finding })),
    ];
    let favicon: string | undefined;
    if (req.params.key === "site_favicon") {
      // El cambio debe verse en la siguiente navegación sin reiniciar Replit.
      // Se usa una revisión nueva para romper la caché especial de favicons.
      setFaviconConfig(value ?? "", Date.now());
      favicon = getFaviconHref();
    }
    res.json({ ok: true, key: req.params.key, linguisticWarnings, ...(favicon ? { favicon } : {}) });
  }));

  // ---------- Idiomas de traducción (config global + disparo con selección) --
  // El cliente elige a QUÉ idiomas se traduce el contenido, en vez de siempre a los 10.
  const ALL_LANGS = ["es", "en", "de", "zh", "ko", "ja", "ar", "ru", "fr", "it"];
  const parseLangs = (raw: string | undefined): string[] =>
    (raw || "es,en").split(",").map((s) => s.trim()).filter((c) => ALL_LANGS.includes(c));

  // Idiomas activos (config global): a qué idiomas se traduce por defecto.
  app.get("/api/admin/settings/languages", authMiddleware, requirePermission("config"), wrap(async (_req, res) => {
    const map = await getConfigMap();
    res.json({ activeLanguages: parseLangs(map.active_languages?.value), allLanguages: ALL_LANGS });
  }));
  app.post("/api/admin/settings/languages", authMiddleware, requirePermission("config"), wrap(async (req, res) => {
    const langs = Array.isArray(req.body?.languages)
      ? (req.body.languages as string[]).filter((c) => ALL_LANGS.includes(c))
      : [];
    if (langs.length === 0) { res.status(400).json({ error: "Selecciona al menos un idioma" }); return; }
    if (!langs.includes("es")) langs.unshift("es"); // español = idioma fuente, siempre presente
    const unique = Array.from(new Set(langs));
    await upsertConfig("active_languages", unique.join(","));
    res.json({ ok: true, activeLanguages: unique });
  }));

  // Traduce un borrador a los idiomas indicados (o a los activos globales por defecto).
  // Un contenido publicado nunca se reescribe automáticamente desde el panel.
  app.post("/api/admin/translate", authMiddleware, requirePermission("content"), wrap(async (req, res) => {
    const parsed = z.object({
      articleId: z.string().uuid(),
      languages: z.array(z.enum(["es", "en", "de", "zh", "ko", "ja", "ar", "ru", "fr", "it"])).min(1).max(9).optional(),
    }).strict().safeParse(req.body || {});
    if (!parsed.success) { res.status(400).json({ error: "Solicitud de traducción inválida" }); return; }
    const article = await storage.getNewsById(parsed.data.articleId);
    if (!article) { res.status(404).json({ error: "Artículo no encontrado" }); return; }
    if (article.published !== false) {
      res.status(409).json({
        code: "PUBLISHED_ARTICLE_REQUIRES_DRAFT",
        error: "Crea un borrador antes de aplicar traducciones automáticas.",
      });
      return;
    }
    const map = await getConfigMap();
    const active = parseLangs(map.active_languages?.value);
    const requested = parsed.data.languages?.length
      ? parsed.data.languages.filter((c) => ALL_LANGS.includes(c))
      : active;
    const targetLanguages = requested.filter((c) => c !== "es"); // "es" es la fuente
    if (targetLanguages.length === 0) { res.status(400).json({ error: "Selecciona al menos un idioma de destino" }); return; }
    const { polyglotTranslatorAgent } = await import("../../agents/specialized/PolyglotTranslatorAgent");
    const result = await polyglotTranslatorAgent.execute(
      { jobId: `translate-${article.id}`, agentType: "polyglot_translator", startTime: new Date(), metadata: { source: "admin" } } as any,
      { articleId: article.id, targetLanguages, applyChanges: true },
    );
    if (!result.success) {
      res.status(422).json({ error: result.error || "No se pudieron generar las traducciones." });
      return;
    }
    if ((result.data as { changesApplied?: boolean } | undefined)?.changesApplied !== true) {
      res.status(409).json({ error: "No se guardó ninguna traducción nueva para este borrador." });
      return;
    }
    res.json(result);
  }));

}
