import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { legalDocuments } from "@shared/schema";
import { cfg, getConfigMap, upsertConfig } from "../mirror/siteConfig";
import { sanitizeCms } from "../mirror/sanitize";

export const COOKIE_POLICY_VERSION = "1.2";

// Leadinfo entrega un identificador de sitio que el navegador puede conocer
// cuando el proveedor está activo; no es una credencial. Aun así, sólo se
// admite el identificador, nunca el fragmento HTML/JS del proveedor. Esto evita
// que el panel se convierta en una vía para inyectar scripts arbitrarios.
const LEADINFO_SITE_ID = /^[A-Za-z0-9_-]{4,160}$/;
const LEADINFO_CONSENT_REVISION = 1;

export function isValidLeadinfoSiteId(value: string): boolean {
  return LEADINFO_SITE_ID.test(value.trim());
}

function parseProductionHostname(value: string): string {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.hostname.toLowerCase() : "";
  } catch {
    return "";
  }
}

export const cookieConsentSchema = z.object({
  version: z.string().trim().min(1).max(24),
  validityMonths: z.coerce.number().int().min(1).max(12),
  analyticsEnabled: z.boolean(),
  leadinfoSiteId: z.string().trim().max(160).refine((value) => value === "" || isValidLeadinfoSiteId(value), {
    message: "El Site ID de Leadinfo sólo puede contener letras, números, guiones y guiones bajos.",
  }),
  leadinfoEnabled: z.boolean(),
  leadinfoDisclosureReviewed: z.boolean(),
  bannerTitle: z.object({ en: z.string().trim().min(1).max(120), es: z.string().trim().min(1).max(120) }),
  bannerBody: z.object({ en: z.string().trim().min(1).max(600), es: z.string().trim().min(1).max(600) }),
  acceptAll: z.object({ en: z.string().trim().min(1).max(80), es: z.string().trim().min(1).max(80) }),
  rejectOptional: z.object({ en: z.string().trim().min(1).max(80), es: z.string().trim().min(1).max(80) }),
  configure: z.object({ en: z.string().trim().min(1).max(80), es: z.string().trim().min(1).max(80) }),
  preferencesTitle: z.object({ en: z.string().trim().min(1).max(120), es: z.string().trim().min(1).max(120) }),
  preferencesBody: z.object({ en: z.string().trim().min(1).max(600), es: z.string().trim().min(1).max(600) }),
  essentialDescription: z.object({ en: z.string().trim().min(1).max(500), es: z.string().trim().min(1).max(500) }),
  analyticsDescription: z.object({ en: z.string().trim().min(1).max(500), es: z.string().trim().min(1).max(500) }),
  leadinfoDescription: z.object({ en: z.string().trim().min(1).max(500), es: z.string().trim().min(1).max(500) }),
  externalDescription: z.object({ en: z.string().trim().min(1).max(500), es: z.string().trim().min(1).max(500) }),
  policyTitle: z.object({ en: z.string().trim().min(1).max(120), es: z.string().trim().min(1).max(120) }),
  policyContent: z.object({ en: z.string().trim().min(50).max(60_000), es: z.string().trim().min(50).max(60_000) }),
}).strict().superRefine((value, context) => {
  if (!value.leadinfoEnabled) return;
  if (!isValidLeadinfoSiteId(value.leadinfoSiteId)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["leadinfoSiteId"], message: "Ingresa un Site ID válido antes de activar Leadinfo." });
  }
  if (!value.leadinfoDisclosureReviewed) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["leadinfoDisclosureReviewed"], message: "Confirma la revisión del aviso de privacidad y cookies antes de activar Leadinfo." });
  }
});

const fallback = {
  version: COOKIE_POLICY_VERSION,
  validityMonths: 6,
  analyticsEnabled: false,
  leadinfoSiteId: "",
  leadinfoEnabled: false,
  leadinfoDisclosureReviewed: false,
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
  leadinfoDescription: {
    en: "Allows Leadinfo to identify visits from companies based on IP addresses and provide business visit analytics.",
    es: "Permite a Leadinfo identificar visitas de empresas con base en direcciones IP y proporcionar analítica de visitas empresariales.",
  },
  externalDescription: { en: "Allows YouTube and Vimeo content to load.", es: "Permite cargar contenido de YouTube y Vimeo." },
  policyTitle: { en: "Cookie Policy", es: "Política de Cookies" },
  policyContent: {
    en: `<p>This policy explains how Von Wobeser y Sierra uses cookies and similar technologies.</p><h2>Technologies</h2><table><thead><tr><th>Provider / technology</th><th>Category</th><th>Purpose</th><th>Duration</th><th>Recipient or transfer</th></tr></thead><tbody><tr><td>Von Wobeser / vwb_cookie_consent</td><td>Essential</td><td>Stores the consent version, authorized categories and decision date.</td><td>Six months</td><td>Von Wobeser; no advertising transfer.</td></tr><tr><td>Von Wobeser / __Host-vwb_admin_session</td><td>Essential</td><td>Protects authenticated administrative sessions.</td><td>Session security limits</td><td>Von Wobeser and its managed infrastructure.</td></tr><tr><td>Replit hosting infrastructure / GAESA</td><td>Essential</td><td>Technical hosting and delivery of the site deployed on Replit.</td><td>Up to 30 days, according to the hosting infrastructure.</td><td>Replit and its delivery infrastructure.</td></tr><tr><td>Google Analytics 4 / _ga and _ga_*</td><td>Analytics</td><td>Aggregate audience measurement, only after consent.</td><td>According to the configured Google service limits</td><td>Google may process information under its applicable terms.</td></tr><tr><td>Google Maps (Contact and Home pages)</td><td>Location service (automatically loaded)</td><td>Displays the office location on the Contact page and when the location section on the Home page approaches the viewport.</td><td>Defined by Google</td><td>Google receives technical connection data according to its applicable policies.</td></tr><tr><td>YouTube (privacy-enhanced mode) and Vimeo (DNT)</td><td>External content</td><td>Displays videos requested by the visitor after consent.</td><td>Defined by each provider</td><td>The selected provider may receive technical connection data.</td></tr></tbody></table><h2>Withdrawing consent</h2><p>You may change or withdraw consent for optional providers at any time through “Cookie preferences” in the footer. Videos and other optional providers will not load again after withdrawal. Google Maps on the Contact page and in the Home location section loads automatically to display the office location. The choice is valid for six months, unless this policy changes first.</p>`,
    es: `<p>Esta política explica cómo Von Wobeser y Sierra utiliza cookies y tecnologías similares.</p><h2>Tecnologías</h2><table><thead><tr><th>Proveedor / tecnología</th><th>Categoría</th><th>Propósito</th><th>Duración</th><th>Destinatario o transferencia</th></tr></thead><tbody><tr><td>Von Wobeser / vwb_cookie_consent</td><td>Esencial</td><td>Guarda la versión, categorías autorizadas y fecha de decisión.</td><td>Seis meses</td><td>Von Wobeser; sin transferencia publicitaria.</td></tr><tr><td>Von Wobeser / __Host-vwb_admin_session</td><td>Esencial</td><td>Protege las sesiones administrativas autenticadas.</td><td>Límites de seguridad de la sesión</td><td>Von Wobeser y su infraestructura administrada.</td></tr><tr><td>Infraestructura de alojamiento Replit / GAESA</td><td>Esencial</td><td>Alojamiento técnico y entrega del sitio desplegado en Replit.</td><td>Hasta 30 días, según la infraestructura de alojamiento.</td><td>Replit y su infraestructura de entrega.</td></tr><tr><td>Google Analytics 4 / _ga y _ga_*</td><td>Analítica</td><td>Medición agregada de audiencia, únicamente con consentimiento.</td><td>Según los límites configurados del servicio de Google</td><td>Google puede tratar información conforme a sus términos aplicables.</td></tr><tr><td>Google Maps (páginas de Contacto e Inicio)</td><td>Servicio de ubicación (carga automática)</td><td>Muestra la ubicación de la oficina en la página de Contacto y al aproximarse a la sección de ubicación en Inicio.</td><td>Definida por Google</td><td>Google recibe datos técnicos de conexión conforme a sus políticas aplicables.</td></tr><tr><td>YouTube (modo de privacidad mejorada) y Vimeo (DNT)</td><td>Contenido externo</td><td>Muestra videos solicitados por el visitante después de su autorización.</td><td>Definida por cada proveedor</td><td>El proveedor seleccionado puede recibir datos técnicos de conexión.</td></tr></tbody></table><h2>Retiro del consentimiento</h2><p>Puedes cambiar o retirar el consentimiento para proveedores opcionales en cualquier momento desde “Preferencias de cookies” en el pie de página. Los videos y otros proveedores opcionales no volverán a cargarse después del retiro. Google Maps en la página de Contacto y en la sección de ubicación de Inicio se carga automáticamente para mostrar la ubicación de la oficina. La elección tendrá una vigencia de seis meses, salvo que esta política cambie antes.</p>`,
  },
};

const MAP_DISCLOSURE_V11 = {
  en: "<tr><td>Google Maps (Contact page)</td><td>Location service (automatically loaded)</td><td>Displays the office location when the Contact page is opened.</td><td>Defined by Google</td><td>Google receives technical connection data according to its applicable policies.</td></tr>",
  es: "<tr><td>Google Maps (página de Contacto)</td><td>Servicio de ubicación (carga automática)</td><td>Muestra la ubicación de la oficina al abrir la página de Contacto.</td><td>Definida por Google</td><td>Google recibe datos técnicos de conexión conforme a sus políticas aplicables.</td></tr>",
};

const MAP_DISCLOSURE_V12 = {
  en: "<tr><td>Google Maps (Contact and Home pages)</td><td>Location service (automatically loaded)</td><td>Displays the office location on the Contact page and when the location section on the Home page approaches the viewport.</td><td>Defined by Google</td><td>Google receives technical connection data according to its applicable policies.</td></tr>",
  es: "<tr><td>Google Maps (páginas de Contacto e Inicio)</td><td>Servicio de ubicación (carga automática)</td><td>Muestra la ubicación de la oficina en la página de Contacto y al aproximarse a la sección de ubicación en Inicio.</td><td>Definida por Google</td><td>Google recibe datos técnicos de conexión conforme a sus políticas aplicables.</td></tr>",
};

const MAP_WITHDRAWAL_V11 = {
  en: "Google Maps on the Contact page is loaded automatically to display the office location.",
  es: "Google Maps en la página de Contacto se carga automáticamente para mostrar la ubicación de la oficina.",
};

const MAP_WITHDRAWAL_V12 = {
  en: "Google Maps on the Contact page and in the Home location section loads automatically to display the office location.",
  es: "Google Maps en la página de Contacto y en la sección de ubicación de Inicio se carga automáticamente para mostrar la ubicación de la oficina.",
};

function hasCurrentMapDisclosure(content: string, contentEs: string): boolean {
  return content.includes(MAP_DISCLOSURE_V12.en)
    && contentEs.includes(MAP_DISCLOSURE_V12.es)
    && content.includes(MAP_WITHDRAWAL_V12.en)
    && contentEs.includes(MAP_WITHDRAWAL_V12.es);
}

function isStandardV11Policy(content: string, contentEs: string): boolean {
  const previousEn = fallback.policyContent.en
    .replace(MAP_DISCLOSURE_V12.en, MAP_DISCLOSURE_V11.en)
    .replace(MAP_WITHDRAWAL_V12.en, MAP_WITHDRAWAL_V11.en);
  const previousEs = fallback.policyContent.es
    .replace(MAP_DISCLOSURE_V12.es, MAP_DISCLOSURE_V11.es)
    .replace(MAP_WITHDRAWAL_V12.es, MAP_WITHDRAWAL_V11.es);
  return content === previousEn && contentEs === previousEs;
}

function isStandardCurrentPolicy(policy: typeof legalDocuments.$inferSelect): boolean {
  return policy.title === fallback.policyTitle.en
    && policy.titleEs === fallback.policyTitle.es
    && policy.content === fallback.policyContent.en
    && policy.contentEs === fallback.policyContent.es;
}

const pair = (map: Awaited<ReturnType<typeof getConfigMap>>, key: string, fallbackPair: { en: string; es: string }) => ({
  en: cfg(map, key, "en") || fallbackPair.en,
  es: cfg(map, key, "es") || fallbackPair.es,
});

type LeadinfoConfig = {
  siteId: string;
  enabled: boolean;
  disclosureReviewed: boolean;
  activationRevision: number;
  productionHostname: string;
};

function isLeadinfoActive(config: LeadinfoConfig): boolean {
  return config.enabled
    && config.disclosureReviewed
    && isValidLeadinfoSiteId(config.siteId)
    && Boolean(config.productionHostname);
}

function leadinfoStatus(config: LeadinfoConfig): "not_configured" | "inactive" | "ready" | "active" {
  if (!isValidLeadinfoSiteId(config.siteId)) return "not_configured";
  if (isLeadinfoActive(config)) return "active";
  if (config.disclosureReviewed && Boolean(config.productionHostname)) return "ready";
  return "inactive";
}

export async function getCookieConsentConfig() {
  const map = await getConfigMap();
  const [policy] = await db.select().from(legalDocuments).where(eq(legalDocuments.type, "cookie_policy")).limit(1);
  const leadinfo: LeadinfoConfig = {
    siteId: (map.leadinfo_site_id?.value || fallback.leadinfoSiteId).trim(),
    enabled: (map.leadinfo_enabled?.value || "false") === "true",
    disclosureReviewed: (map.leadinfo_disclosure_reviewed?.value || "false") === "true",
    activationRevision: Math.max(0, Number.parseInt(map.leadinfo_activation_revision?.value || "0", 10) || 0),
    productionHostname: parseProductionHostname(map.site_url?.value || ""),
  };
  const active = isLeadinfoActive(leadinfo);
  return {
    version: map.cookie_consent_version?.value || policy?.version || fallback.version,
    validityMonths: Number(map.cookie_consent_validity_months?.value || fallback.validityMonths),
    analyticsEnabled: (map.ga4_enabled?.value || "false") === "true",
    ga4Id: map.ga4_measurement_id?.value || "",
    leadinfoSiteId: leadinfo.siteId,
    leadinfoEnabled: leadinfo.enabled,
    leadinfoDisclosureReviewed: leadinfo.disclosureReviewed,
    leadinfoStatus: leadinfoStatus(leadinfo),
    leadinfoActive: active,
    leadinfoActivationRevision: leadinfo.activationRevision,
    leadinfoProductionHostname: leadinfo.productionHostname,
    bannerTitle: pair(map, "cookie_banner_title", fallback.bannerTitle),
    bannerBody: pair(map, "cookie_banner_body", fallback.bannerBody),
    acceptAll: pair(map, "cookie_accept_all", fallback.acceptAll),
    rejectOptional: pair(map, "cookie_reject_optional", fallback.rejectOptional),
    configure: pair(map, "cookie_configure", fallback.configure),
    preferencesTitle: pair(map, "cookie_preferences_title", fallback.preferencesTitle),
    preferencesBody: pair(map, "cookie_preferences_body", fallback.preferencesBody),
    essentialDescription: pair(map, "cookie_essential_description", fallback.essentialDescription),
    analyticsDescription: pair(map, "cookie_analytics_description", fallback.analyticsDescription),
    leadinfoDescription: pair(map, "cookie_leadinfo_description", fallback.leadinfoDescription),
    externalDescription: pair(map, "cookie_external_description", fallback.externalDescription),
    policyTitle: { en: policy?.title || fallback.policyTitle.en, es: policy?.titleEs || fallback.policyTitle.es },
    policyContent: { en: policy?.content || fallback.policyContent.en, es: policy?.contentEs || fallback.policyContent.es },
    // Una política editada en Administración no se toca automáticamente. Aun si
    // ya menciona Maps, se pide a la firma revisar su propia redacción legal.
    locationDisclosureReviewRequired: Boolean(
      policy && (!hasCurrentMapDisclosure(policy.content, policy.contentEs) || !isStandardCurrentPolicy(policy)),
    ),
  };
}

export function publicConsentPayload(config: Awaited<ReturnType<typeof getCookieConsentConfig>>) {
  const {
    locationDisclosureReviewRequired: _locationDisclosureReviewRequired,
    leadinfoSiteId,
    leadinfoEnabled: _leadinfoEnabled,
    leadinfoDisclosureReviewed: _leadinfoDisclosureReviewed,
    leadinfoStatus: _leadinfoStatus,
    leadinfoDescription,
    ...publicConfig
  } = config;
  // El identificador sólo alcanza al navegador cuando la activación ya pasó
  // todas las protecciones del servidor. Con el módulo preparado o apagado la
  // respuesta pública no permite deducir la cuenta de Leadinfo.
  const leadinfoPublic = config.leadinfoActive
    ? {
      leadinfoActive: true,
      leadinfoSiteId,
      leadinfoDescription,
      leadinfoTitle: { en: "Business visitor identification", es: "Identificación de empresas" },
      leadinfoConsentVersion: `${config.version}:leadinfo-${config.leadinfoActivationRevision || LEADINFO_CONSENT_REVISION}`,
    }
    : { leadinfoActive: false, leadinfoActivationRevision: 0, leadinfoProductionHostname: "" };
  return {
    ...publicConfig,
    ...leadinfoPublic,
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

/**
 * Texto fijo de transparencia que se incorpora a la política pública sólo
 * después de una activación válida. No se mezcla con el contenido editable
 * mientras Leadinfo está preparado/inactivo, ni se toma de un campo libre.
 */
export function getLeadinfoPolicyDisclosure(
  config: Awaited<ReturnType<typeof getCookieConsentConfig>>,
  lang: "en" | "es",
): { tableRow: string; heading: string; body: string } | null {
  if (!config.leadinfoActive) return null;
  if (lang === "es") {
    return {
      tableRow: "<tr><td>Leadinfo B.V. / _li_id y _li_ses</td><td>Identificación de empresas</td><td>Reconoce visitas de empresas con base en direcciones IP y proporciona analítica de visitas empresariales, únicamente después de autorización.</td><td>_li_id: dos años; _li_ses: sesión actual</td><td>Leadinfo B.V.; consulta su aviso de privacidad y opción de exclusión.</td></tr>",
      heading: "Leadinfo",
      body: "Con autorización, Von Wobeser y Sierra utiliza Leadinfo B.V. para identificar visitas de empresas con base en direcciones IP y mostrar información empresarial disponible públicamente. Leadinfo utiliza las cookies _li_id y _li_ses para analítica de visitas. El sitio no envía mediante esta integración nombres, correos, currículums ni mensajes de formularios. Puedes consultar el <a href=\"https://www.leadinfo.com/en/privacy/\" target=\"_blank\" rel=\"noopener noreferrer\">aviso de privacidad de Leadinfo</a> y ejercer su <a href=\"https://www.leadinfo.com/en/opt-out\" target=\"_blank\" rel=\"noopener noreferrer\">opción de exclusión</a>.",
    };
  }
  return {
    tableRow: "<tr><td>Leadinfo B.V. / _li_id and _li_ses</td><td>Business visitor identification</td><td>Recognizes company visits based on IP addresses and provides business visit analytics, only after authorization.</td><td>_li_id: two years; _li_ses: current session</td><td>Leadinfo B.V.; see its privacy notice and opt-out option.</td></tr>",
    heading: "Leadinfo",
    body: "With authorization, Von Wobeser y Sierra uses Leadinfo B.V. to identify company visits based on IP addresses and show publicly available company information. Leadinfo uses the _li_id and _li_ses cookies for visit analytics. This integration does not send names, email addresses, CVs or form messages from this website. You can read the <a href=\"https://www.leadinfo.com/en/privacy/\" target=\"_blank\" rel=\"noopener noreferrer\">Leadinfo Privacy Notice</a> and use its <a href=\"https://www.leadinfo.com/en/opt-out\" target=\"_blank\" rel=\"noopener noreferrer\">opt-out option</a>.",
  };
}

export async function saveCookieConsentConfig(input: z.infer<typeof cookieConsentSchema>) {
  const currentMap = await getConfigMap();
  const currentLeadinfo: LeadinfoConfig = {
    siteId: (currentMap.leadinfo_site_id?.value || "").trim(),
    enabled: (currentMap.leadinfo_enabled?.value || "false") === "true",
    disclosureReviewed: (currentMap.leadinfo_disclosure_reviewed?.value || "false") === "true",
    activationRevision: Math.max(0, Number.parseInt(currentMap.leadinfo_activation_revision?.value || "0", 10) || 0),
    productionHostname: parseProductionHostname(currentMap.site_url?.value || ""),
  };
  const nextLeadinfo: LeadinfoConfig = {
    ...currentLeadinfo,
    siteId: input.leadinfoSiteId.trim(),
    enabled: input.leadinfoEnabled,
    disclosureReviewed: input.leadinfoDisclosureReviewed,
  };
  // Una activación nueva invalida por diseño cualquier consentimiento anterior.
  // Apagar y volver a activar genera otra revisión aunque conserve el mismo ID.
  if (isLeadinfoActive(nextLeadinfo) && !isLeadinfoActive(currentLeadinfo)) {
    nextLeadinfo.activationRevision = currentLeadinfo.activationRevision + 1;
  }
  const entries: Array<[string, string, string?]> = [
    ["cookie_consent_version", input.version], ["cookie_consent_validity_months", String(input.validityMonths)],
    ["ga4_enabled", String(input.analyticsEnabled)],
    ["leadinfo_site_id", nextLeadinfo.siteId],
    ["leadinfo_enabled", String(nextLeadinfo.enabled)],
    ["leadinfo_disclosure_reviewed", String(nextLeadinfo.disclosureReviewed)],
    ["leadinfo_activation_revision", String(nextLeadinfo.activationRevision)],
    ["cookie_banner_title", input.bannerTitle.en, input.bannerTitle.es], ["cookie_banner_body", input.bannerBody.en, input.bannerBody.es],
    ["cookie_accept_all", input.acceptAll.en, input.acceptAll.es], ["cookie_reject_optional", input.rejectOptional.en, input.rejectOptional.es],
    ["cookie_configure", input.configure.en, input.configure.es], ["cookie_preferences_title", input.preferencesTitle.en, input.preferencesTitle.es],
    ["cookie_preferences_body", input.preferencesBody.en, input.preferencesBody.es],
    ["cookie_essential_description", input.essentialDescription.en, input.essentialDescription.es],
    ["cookie_analytics_description", input.analyticsDescription.en, input.analyticsDescription.es],
    ["cookie_leadinfo_description", input.leadinfoDescription.en, input.leadinfoDescription.es],
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
    ["leadinfo_site_id", fallback.leadinfoSiteId],
    ["leadinfo_enabled", String(fallback.leadinfoEnabled)],
    ["leadinfo_disclosure_reviewed", String(fallback.leadinfoDisclosureReviewed)],
    ["leadinfo_activation_revision", "0"],
    ["cookie_banner_title", fallback.bannerTitle.en, fallback.bannerTitle.es],
    ["cookie_banner_body", fallback.bannerBody.en, fallback.bannerBody.es],
    ["cookie_accept_all", fallback.acceptAll.en, fallback.acceptAll.es],
    ["cookie_reject_optional", fallback.rejectOptional.en, fallback.rejectOptional.es],
    ["cookie_configure", fallback.configure.en, fallback.configure.es],
    ["cookie_preferences_title", fallback.preferencesTitle.en, fallback.preferencesTitle.es],
    ["cookie_preferences_body", fallback.preferencesBody.en, fallback.preferencesBody.es],
    ["cookie_essential_description", fallback.essentialDescription.en, fallback.essentialDescription.es],
    ["cookie_analytics_description", fallback.analyticsDescription.en, fallback.analyticsDescription.es],
    ["cookie_leadinfo_description", fallback.leadinfoDescription.en, fallback.leadinfoDescription.es],
    ["cookie_external_description", fallback.externalDescription.en, fallback.externalDescription.es],
  ];
  // Inicialización no destructiva: una configuración administrativa existente
  // siempre prevalece, incluso si difiere de los textos predeterminados.
  for (const [key, en, es] of defaults) {
    if (!map[key]) await upsertConfig(key, en, es);
  }

  // La versión 1.2 declara el mismo Google Maps en Contacto e Inicio. La
  // política solo se actualiza cuando conserva exactamente nuestra redacción
  // estándar anterior; una personalización jurídica prevalece y se marca para
  // revisión desde Administración.
  if (
    map.cookie_external_description?.value === "YouTube, Vimeo and Google Maps content."
    && map.cookie_external_description?.valueEs === "Contenido de YouTube, Vimeo y Google Maps."
  ) {
    await upsertConfig("cookie_external_description", fallback.externalDescription.en, fallback.externalDescription.es);
  }
  const [existing] = await db.select().from(legalDocuments).where(eq(legalDocuments.type, "cookie_policy")).limit(1);
  if (!existing) {
    if (["1.0", "1.1"].includes(map.cookie_consent_version?.value || "")) {
      await upsertConfig("cookie_consent_version", fallback.version);
    }
    await db.insert(legalDocuments).values({ type: "cookie_policy", title: fallback.policyTitle.en, titleEs: fallback.policyTitle.es, content: fallback.policyContent.en, contentEs: fallback.policyContent.es, version: fallback.version, published: true });
    return;
  }

  // Solo se migra la política estándar exacta de la versión 1.1. Cualquier
  // redacción jurídica personalizada queda intacta para su revisión en
  // Administración, incluso si reutiliza fragmentos de la versión anterior.
  const policyIsCurrent = hasCurrentMapDisclosure(existing.content, existing.contentEs);
  if (policyIsCurrent) {
    if (["1.0", "1.1"].includes(map.cookie_consent_version?.value || "")) {
      await upsertConfig("cookie_consent_version", fallback.version);
    }
    return;
  }
  if (!isStandardV11Policy(existing.content, existing.contentEs)) return;

  // Compatibilidad con las migraciones previas: este bloque solo puede
  // ejecutarse sobre la política estándar ya validada arriba.
  const legacyMapRowEn = "<tr><td>YouTube (privacy-enhanced mode), Vimeo (DNT) and Google Maps</td><td>External content</td><td>Displays videos or maps requested by the visitor.</td><td>Defined by each provider</td><td>The selected provider may receive technical connection data.</td></tr>";
  const legacyMapRowEs = "<tr><td>YouTube (modo de privacidad mejorada), Vimeo (DNT) y Google Maps</td><td>Contenido externo</td><td>Muestra videos o mapas solicitados por el visitante.</td><td>Definida por cada proveedor</td><td>El proveedor seleccionado puede recibir datos técnicos de conexión.</td></tr>";
  const hasLegacyMapDisclosure = existing.content.includes(legacyMapRowEn)
    && existing.contentEs.includes(legacyMapRowEs);
  if (hasLegacyMapDisclosure) {
    await db.update(legalDocuments)
      .set({
        content: existing.content.replace(legacyMapRowEn, `${MAP_DISCLOSURE_V12.en}<tr><td>YouTube (privacy-enhanced mode) and Vimeo (DNT)</td><td>External content</td><td>Displays videos requested by the visitor after consent.</td><td>Defined by each provider</td><td>The selected provider may receive technical connection data.</td></tr>`),
        contentEs: existing.contentEs.replace(legacyMapRowEs, `${MAP_DISCLOSURE_V12.es}<tr><td>YouTube (modo de privacidad mejorada) y Vimeo (DNT)</td><td>Contenido externo</td><td>Muestra videos solicitados por el visitante después de su autorización.</td><td>Definida por cada proveedor</td><td>El proveedor seleccionado puede recibir datos técnicos de conexión.</td></tr>`),
        version: ["1.0", "1.1"].includes(existing.version || "") ? fallback.version : existing.version,
        updatedAt: new Date(),
      })
      .where(eq(legalDocuments.id, existing.id));
    if (["1.0", "1.1"].includes(map.cookie_consent_version?.value || "")) {
      await upsertConfig("cookie_consent_version", fallback.version);
    }
    return;
  }

  const hasV11Disclosure = existing.content.includes(MAP_DISCLOSURE_V11.en)
    && existing.contentEs.includes(MAP_DISCLOSURE_V11.es)
    && existing.content.includes(MAP_WITHDRAWAL_V11.en)
    && existing.contentEs.includes(MAP_WITHDRAWAL_V11.es);
  if (hasV11Disclosure) {
    await db.update(legalDocuments)
      .set({
        content: existing.content.replace(MAP_DISCLOSURE_V11.en, MAP_DISCLOSURE_V12.en).replace(MAP_WITHDRAWAL_V11.en, MAP_WITHDRAWAL_V12.en),
        contentEs: existing.contentEs.replace(MAP_DISCLOSURE_V11.es, MAP_DISCLOSURE_V12.es).replace(MAP_WITHDRAWAL_V11.es, MAP_WITHDRAWAL_V12.es),
        version: ["1.0", "1.1"].includes(existing.version || "") ? fallback.version : existing.version,
        updatedAt: new Date(),
      })
      .where(eq(legalDocuments.id, existing.id));
    if (["1.0", "1.1"].includes(map.cookie_consent_version?.value || "")) {
      await upsertConfig("cookie_consent_version", fallback.version);
    }
  }
}
