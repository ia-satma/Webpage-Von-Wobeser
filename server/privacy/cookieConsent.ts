import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { legalDocuments } from "@shared/schema";
import { cfg, getConfigMap, upsertConfig } from "../mirror/siteConfig";
import { sanitizeCms } from "../mirror/sanitize";

export const COOKIE_POLICY_VERSION = "1.0";

export const cookieConsentSchema = z.object({
  version: z.string().trim().min(1).max(24),
  validityMonths: z.coerce.number().int().min(1).max(12),
  analyticsEnabled: z.boolean(),
  bannerTitle: z.object({ en: z.string().trim().min(1).max(120), es: z.string().trim().min(1).max(120) }),
  bannerBody: z.object({ en: z.string().trim().min(1).max(600), es: z.string().trim().min(1).max(600) }),
  acceptAll: z.object({ en: z.string().trim().min(1).max(80), es: z.string().trim().min(1).max(80) }),
  rejectOptional: z.object({ en: z.string().trim().min(1).max(80), es: z.string().trim().min(1).max(80) }),
  configure: z.object({ en: z.string().trim().min(1).max(80), es: z.string().trim().min(1).max(80) }),
  preferencesTitle: z.object({ en: z.string().trim().min(1).max(120), es: z.string().trim().min(1).max(120) }),
  preferencesBody: z.object({ en: z.string().trim().min(1).max(600), es: z.string().trim().min(1).max(600) }),
  essentialDescription: z.object({ en: z.string().trim().min(1).max(500), es: z.string().trim().min(1).max(500) }),
  analyticsDescription: z.object({ en: z.string().trim().min(1).max(500), es: z.string().trim().min(1).max(500) }),
  externalDescription: z.object({ en: z.string().trim().min(1).max(500), es: z.string().trim().min(1).max(500) }),
  policyTitle: z.object({ en: z.string().trim().min(1).max(120), es: z.string().trim().min(1).max(120) }),
  policyContent: z.object({ en: z.string().trim().min(50).max(60_000), es: z.string().trim().min(50).max(60_000) }),
}).strict();

const fallback = {
  version: COOKIE_POLICY_VERSION,
  validityMonths: 6,
  analyticsEnabled: false,
  bannerTitle: { en: "Your privacy, your choice", es: "Tu privacidad, tu decisión" },
  bannerBody: {
    en: "We use essential cookies to operate this site. With your permission, we also use analytics and load content from external providers.",
    es: "Usamos cookies esenciales para operar este sitio. Con tu autorización, también usamos analítica y cargamos contenido de proveedores externos.",
  },
  acceptAll: { en: "Accept all", es: "Aceptar todas" },
  rejectOptional: { en: "Reject non-essential", es: "Rechazar no esenciales" },
  configure: { en: "Configure", es: "Configurar" },
  preferencesTitle: { en: "Cookie preferences", es: "Preferencias de cookies" },
  preferencesBody: { en: "Choose which optional technologies may be used. You can change this decision at any time.", es: "Elige qué tecnologías opcionales pueden utilizarse. Puedes cambiar esta decisión en cualquier momento." },
  essentialDescription: { en: "Required for security, administrative sessions and basic site operation.", es: "Necesarias para seguridad, sesiones administrativas y funcionamiento básico del sitio." },
  analyticsDescription: { en: "Helps us understand aggregate site usage through Google Analytics 4.", es: "Nos ayuda a comprender el uso agregado del sitio mediante Google Analytics 4." },
  externalDescription: { en: "Allows YouTube, Vimeo and Google Maps content to load.", es: "Permite cargar contenido de YouTube, Vimeo y Google Maps." },
  policyTitle: { en: "Cookie Policy", es: "Política de Cookies" },
  policyContent: {
    en: `<p>This policy explains how Von Wobeser y Sierra uses cookies and similar technologies.</p><h2>Technologies</h2><table><thead><tr><th>Provider / technology</th><th>Category</th><th>Purpose</th><th>Duration</th><th>Recipient or transfer</th></tr></thead><tbody><tr><td>Von Wobeser / vwb_cookie_consent</td><td>Essential</td><td>Stores the consent version, authorized categories and decision date.</td><td>Six months</td><td>Von Wobeser; no advertising transfer.</td></tr><tr><td>Von Wobeser / __Host-vwb_admin_session</td><td>Essential</td><td>Protects authenticated administrative sessions.</td><td>Session security limits</td><td>Von Wobeser and its managed infrastructure.</td></tr><tr><td>Google Analytics 4 / _ga and _ga_*</td><td>Analytics</td><td>Aggregate audience measurement, only after consent.</td><td>According to the configured Google service limits</td><td>Google may process information under its applicable terms.</td></tr><tr><td>YouTube (privacy-enhanced mode), Vimeo (DNT) and Google Maps</td><td>External content</td><td>Displays videos or maps requested by the visitor.</td><td>Defined by each provider</td><td>The selected provider may receive technical connection data.</td></tr></tbody></table><h2>Withdrawing consent</h2><p>You may change or withdraw your consent at any time through “Cookie preferences” in the footer. Optional providers will not load again after withdrawal. The choice is valid for six months, unless this policy changes first.</p><p>This technical wording must be validated by the firm's privacy counsel before final publication.</p>`,
    es: `<p>Esta política explica cómo Von Wobeser y Sierra utiliza cookies y tecnologías similares.</p><h2>Tecnologías</h2><table><thead><tr><th>Proveedor / tecnología</th><th>Categoría</th><th>Propósito</th><th>Duración</th><th>Destinatario o transferencia</th></tr></thead><tbody><tr><td>Von Wobeser / vwb_cookie_consent</td><td>Esencial</td><td>Guarda la versión, categorías autorizadas y fecha de decisión.</td><td>Seis meses</td><td>Von Wobeser; sin transferencia publicitaria.</td></tr><tr><td>Von Wobeser / __Host-vwb_admin_session</td><td>Esencial</td><td>Protege las sesiones administrativas autenticadas.</td><td>Límites de seguridad de la sesión</td><td>Von Wobeser y su infraestructura administrada.</td></tr><tr><td>Google Analytics 4 / _ga y _ga_*</td><td>Analítica</td><td>Medición agregada de audiencia, únicamente con consentimiento.</td><td>Según los límites configurados del servicio de Google</td><td>Google puede tratar información conforme a sus términos aplicables.</td></tr><tr><td>YouTube (modo de privacidad mejorada), Vimeo (DNT) y Google Maps</td><td>Contenido externo</td><td>Muestra videos o mapas solicitados por el visitante.</td><td>Definida por cada proveedor</td><td>El proveedor seleccionado puede recibir datos técnicos de conexión.</td></tr></tbody></table><h2>Retiro del consentimiento</h2><p>Puedes cambiar o retirar tu consentimiento en cualquier momento desde “Preferencias de cookies” en el pie de página. Los proveedores opcionales no volverán a cargarse después del retiro. La elección tendrá una vigencia de seis meses, salvo que esta política cambie antes.</p><p>Esta redacción técnica deberá ser validada por el responsable jurídico de privacidad de la firma antes de su publicación definitiva.</p>`,
  },
};

const pair = (map: Awaited<ReturnType<typeof getConfigMap>>, key: string, fallbackPair: { en: string; es: string }) => ({
  en: cfg(map, key, "en") || fallbackPair.en,
  es: cfg(map, key, "es") || fallbackPair.es,
});

export async function getCookieConsentConfig() {
  const map = await getConfigMap();
  const [policy] = await db.select().from(legalDocuments).where(eq(legalDocuments.type, "cookie_policy")).limit(1);
  return {
    version: map.cookie_consent_version?.value || policy?.version || fallback.version,
    validityMonths: Number(map.cookie_consent_validity_months?.value || fallback.validityMonths),
    analyticsEnabled: (map.ga4_enabled?.value || "false") === "true",
    ga4Id: map.ga4_measurement_id?.value || "",
    bannerTitle: pair(map, "cookie_banner_title", fallback.bannerTitle),
    bannerBody: pair(map, "cookie_banner_body", fallback.bannerBody),
    acceptAll: pair(map, "cookie_accept_all", fallback.acceptAll),
    rejectOptional: pair(map, "cookie_reject_optional", fallback.rejectOptional),
    configure: pair(map, "cookie_configure", fallback.configure),
    preferencesTitle: pair(map, "cookie_preferences_title", fallback.preferencesTitle),
    preferencesBody: pair(map, "cookie_preferences_body", fallback.preferencesBody),
    essentialDescription: pair(map, "cookie_essential_description", fallback.essentialDescription),
    analyticsDescription: pair(map, "cookie_analytics_description", fallback.analyticsDescription),
    externalDescription: pair(map, "cookie_external_description", fallback.externalDescription),
    policyTitle: { en: policy?.title || fallback.policyTitle.en, es: policy?.titleEs || fallback.policyTitle.es },
    policyContent: { en: policy?.content || fallback.policyContent.en, es: policy?.contentEs || fallback.policyContent.es },
  };
}

export function publicConsentPayload(config: Awaited<ReturnType<typeof getCookieConsentConfig>>) {
  return {
    ...config,
    essentialTitle: { en: "Essential", es: "Esenciales" },
    analyticsTitle: { en: "Analytics", es: "Analítica" },
    externalTitle: { en: "External content", es: "Contenido externo" },
    externalBlocked: { en: "To view this content, authorize {provider} content.", es: "Para ver este contenido, autoriza el contenido de {provider}." },
    allowExternal: { en: "Allow external content", es: "Autorizar contenido externo" },
    alwaysActive: { en: "Always active", es: "Siempre activas" },
    savePreferences: { en: "Save preferences", es: "Guardar preferencias" },
    cancel: { en: "Cancel", es: "Cancelar" },
    policyLabel: { en: "Cookie Policy", es: "Política de Cookies" },
  };
}

export async function saveCookieConsentConfig(input: z.infer<typeof cookieConsentSchema>) {
  const entries: Array<[string, string, string?]> = [
    ["cookie_consent_version", input.version], ["cookie_consent_validity_months", String(input.validityMonths)],
    ["ga4_enabled", String(input.analyticsEnabled)],
    ["cookie_banner_title", input.bannerTitle.en, input.bannerTitle.es], ["cookie_banner_body", input.bannerBody.en, input.bannerBody.es],
    ["cookie_accept_all", input.acceptAll.en, input.acceptAll.es], ["cookie_reject_optional", input.rejectOptional.en, input.rejectOptional.es],
    ["cookie_configure", input.configure.en, input.configure.es], ["cookie_preferences_title", input.preferencesTitle.en, input.preferencesTitle.es],
    ["cookie_preferences_body", input.preferencesBody.en, input.preferencesBody.es],
    ["cookie_essential_description", input.essentialDescription.en, input.essentialDescription.es],
    ["cookie_analytics_description", input.analyticsDescription.en, input.analyticsDescription.es],
    ["cookie_external_description", input.externalDescription.en, input.externalDescription.es],
  ];
  for (const [key, en, es] of entries) await upsertConfig(key, en, es);
  const [existing] = await db.select().from(legalDocuments).where(eq(legalDocuments.type, "cookie_policy")).limit(1);
  const values = {
    type: "cookie_policy",
    title: input.policyTitle.en,
    titleEs: input.policyTitle.es,
    content: sanitizeCms(input.policyContent.en),
    contentEs: sanitizeCms(input.policyContent.es),
    version: input.version,
    published: true,
    effectiveDate: new Date(),
    updatedAt: new Date(),
  };
  if (existing) await db.update(legalDocuments).set(values).where(eq(legalDocuments.id, existing.id));
  else await db.insert(legalDocuments).values(values);
  return getCookieConsentConfig();
}

export async function seedCookiePolicy() {
  const map = await getConfigMap();
  const defaults: Array<[string, string, string?]> = [
    ["cookie_consent_version", fallback.version],
    ["cookie_consent_validity_months", String(fallback.validityMonths)],
    ["ga4_enabled", String(fallback.analyticsEnabled)],
    ["cookie_banner_title", fallback.bannerTitle.en, fallback.bannerTitle.es],
    ["cookie_banner_body", fallback.bannerBody.en, fallback.bannerBody.es],
    ["cookie_accept_all", fallback.acceptAll.en, fallback.acceptAll.es],
    ["cookie_reject_optional", fallback.rejectOptional.en, fallback.rejectOptional.es],
    ["cookie_configure", fallback.configure.en, fallback.configure.es],
    ["cookie_preferences_title", fallback.preferencesTitle.en, fallback.preferencesTitle.es],
    ["cookie_preferences_body", fallback.preferencesBody.en, fallback.preferencesBody.es],
    ["cookie_essential_description", fallback.essentialDescription.en, fallback.essentialDescription.es],
    ["cookie_analytics_description", fallback.analyticsDescription.en, fallback.analyticsDescription.es],
    ["cookie_external_description", fallback.externalDescription.en, fallback.externalDescription.es],
  ];
  // Inicialización no destructiva: una configuración administrativa existente
  // siempre prevalece, incluso si difiere de los textos predeterminados.
  for (const [key, en, es] of defaults) {
    if (!map[key]) await upsertConfig(key, en, es);
  }
  const [existing] = await db.select().from(legalDocuments).where(eq(legalDocuments.type, "cookie_policy")).limit(1);
  if (!existing) await db.insert(legalDocuments).values({ type: "cookie_policy", title: fallback.policyTitle.en, titleEs: fallback.policyTitle.es, content: fallback.policyContent.en, contentEs: fallback.policyContent.es, version: fallback.version, published: true });
}
