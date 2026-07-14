import { eq } from "drizzle-orm";
import { db } from "../db";
import { siteConfig } from "@shared/schema";

export type ConfigMap = Record<string, { value: string; valueEs: string; type: string }>;

/** Default site-config keys for the editable parts of the mirror frontend. */
const DEFAULTS: Array<{ key: string; value: string; valueEs?: string; type: string; category: string; description: string }> = [
  { key: "hero_video", value: "/images/dron_2026_40.mp4", type: "url", category: "home", description: "Video de fondo del hero (home)" },
  { key: "hero_practice_link", value: "/practice/arbitration", type: "url", category: "home", description: "Enlace al hacer clic en el hero" },
  { key: "banner_title", value: "WE GO WHERE CLIENTS NEED US", valueEs: "VAMOS DONDE EL CLIENTE NOS NECESITA", type: "text", category: "home", description: "Título del banner rojo (home)" },
  { key: "banner_subtitle", value: "New offices of Von Wobeser y Sierra", valueEs: "Nuevas oficinas de Von Wobeser y Sierra", type: "text", category: "home", description: "Subtítulo del banner rojo (home)" },
  { key: "active_languages", value: "es,en", type: "json", category: "translations", description: "Idiomas a los que se traduce el contenido (lista separada por comas). El traductor solo genera estos idiomas por defecto." },
  { key: "site_url", value: "https://www.vonwobeser.com", type: "url", category: "seo", description: "URL pública del sitio (para canonical, Open Graph y datos estructurados). Cámbiala si el dominio final es otro." },
  // Pie de página (aparece en todas las páginas dinámicas). Editable por el cliente.
  { key: "footer_firm", value: "Von Wobeser y Sierra, S.C.", type: "text", category: "footer", description: "Nombre de la firma (pie de página)" },
  { key: "footer_address", value: "Torre SOMA Chapultepec 18th floor. Campos Elíseos 204, Polanco\nAcceso por Calle Arquímedes N.° 10, C.P. 11550, Ciudad de México", type: "text", category: "footer", description: "Dirección del pie de página (una línea por renglón)" },
  { key: "footer_phone", value: "+52 (55) 5258 1000", type: "text", category: "footer", description: "Teléfono del pie de página" },
  { key: "footer_website", value: "vonwobeser.com", type: "text", category: "footer", description: "Sitio web / correo mostrado en el pie" },
  { key: "footer_facebook", value: "https://www.facebook.com/Von-Wobeser-Sierra-SC-1655250134508590/about/?ref=page_internal", type: "url", category: "footer", description: "Enlace de Facebook (pie de página)" },
  { key: "footer_twitter", value: "https://twitter.com/VWySOficial", type: "url", category: "footer", description: "Enlace de Twitter/X (pie de página)" },
  { key: "footer_linkedin", value: "https://mx.linkedin.com/company/von-wobeser-y-sierra", type: "url", category: "footer", description: "Enlace de LinkedIn (pie de página)" },
  // Páginas institucionales (texto editable). Nacen VACÍAS → el sitio muestra el texto original
  // de la plantilla hasta que el cliente edite. valueEs = español, value = inglés.
  { key: "page_firm_intro", value: "", valueEs: "", type: "text", category: "pages", description: "Nuestra Firma — párrafo de introducción" },
  { key: "page_firm_body", value: "", valueEs: "", type: "text", category: "pages", description: "Nuestra Firma — cuerpo del texto" },
  { key: "page_contact_intro", value: "", valueEs: "", type: "text", category: "pages", description: "Contacto — texto de introducción" },
  { key: "page_contact_body", value: "", valueEs: "", type: "text", category: "pages", description: "Contacto — dirección / texto principal" },
  { key: "page_careers_intro", value: "", valueEs: "", type: "text", category: "pages", description: "Carrera en VWyS — párrafo de introducción" },
  { key: "page_careers_body", value: "", valueEs: "", type: "text", category: "pages", description: "Carrera en VWyS — cuerpo del texto" },
  { key: "page_probono_intro", value: "", valueEs: "", type: "text", category: "pages", description: "Pro Bono — párrafo de introducción" },
  { key: "page_probono_body", value: "", valueEs: "", type: "text", category: "pages", description: "Pro Bono — cuerpo del texto" },
  { key: "page_capabilities_body", value: "", valueEs: "", type: "text", category: "pages", description: "Capacidades — párrafo de introducción" },
  { key: "page_privacy_body", value: "", valueEs: "", type: "text", category: "pages", description: "Aviso de Privacidad — texto completo" },
  { key: "page_diversity_intro", value: "", valueEs: "", type: "text", category: "pages", description: "Diversidad e Inclusión — párrafo de introducción" },
  { key: "page_diversity_body", value: "", valueEs: "", type: "text", category: "pages", description: "Diversidad e Inclusión — texto adicional (se muestra arriba de la galería de video, no la reemplaza)" },
  // Galería de video de Diversidad e Inclusión: 1 video principal + 7 miniaturas que lo
  // reemplazan al hacer clic. No son bilingües (es el mismo archivo para ES/EN). Los valores
  // por defecto son las rutas originales de la plantilla capturada (algunas de las miniaturas
  // no tienen archivo real en este espejo — igual que en la plantilla original sin editar).
  { key: "page_diversity_video_main", value: "/images/vw_vid_02.mp4", type: "url", category: "pages", description: "Diversidad e Inclusión — video principal" },
  { key: "page_diversity_video_1", value: "/images/vid_01.mp4", type: "url", category: "pages", description: "Diversidad e Inclusión — video miniatura 1" },
  { key: "page_diversity_video_2", value: "/images/vid_02.mp4", type: "url", category: "pages", description: "Diversidad e Inclusión — video miniatura 2" },
  { key: "page_diversity_video_3", value: "/images/vid_03.mp4", type: "url", category: "pages", description: "Diversidad e Inclusión — video miniatura 3" },
  { key: "page_diversity_video_4", value: "/images/vid_04.mp4", type: "url", category: "pages", description: "Diversidad e Inclusión — video miniatura 4" },
  { key: "page_diversity_video_5", value: "/images/vid_05.mp4", type: "url", category: "pages", description: "Diversidad e Inclusión — video miniatura 5" },
  { key: "page_diversity_video_6", value: "/images/vid_06.mp4", type: "url", category: "pages", description: "Diversidad e Inclusión — video miniatura 6" },
  { key: "page_diversity_video_7", value: "/images/vid_07.mp4", type: "url", category: "pages", description: "Diversidad e Inclusión — video miniatura 7" },
];

// Caché en memoria del site-config: antes se hacía SELECT * en CADA render del
// espejo. Se cachea con TTL corto y se invalida al escribir (upsert/seed).
let _configCache: { map: ConfigMap; at: number } | null = null;
const CONFIG_TTL_MS = 60_000;

/** Fuerza recargar el site-config en la próxima lectura. */
export function invalidateConfigCache(): void {
  _configCache = null;
}

/** Returns all site-config as a {key: {value, valueEs, type}} map (cacheada). */
export async function getConfigMap(): Promise<ConfigMap> {
  if (_configCache && Date.now() - _configCache.at < CONFIG_TTL_MS) return _configCache.map;
  const rows = await db.select().from(siteConfig);
  const map: ConfigMap = {};
  for (const r of rows) map[r.key] = { value: r.value ?? "", valueEs: r.valueEs ?? "", type: r.type };
  _configCache = { map, at: Date.now() };
  return map;
}

/** Insert any missing default keys (non-destructive). */
export async function seedConfigDefaults(): Promise<void> {
  const existing = new Set((await db.select({ key: siteConfig.key }).from(siteConfig)).map((r) => r.key));
  const missing = DEFAULTS.filter((d) => !existing.has(d.key));
  if (!missing.length) return;
  await db.insert(siteConfig).values(
    missing.map((d) => ({ key: d.key, value: d.value, valueEs: d.valueEs ?? d.value, type: d.type, category: d.category, description: d.description })),
  );
  invalidateConfigCache();
}

/** Upsert one key (used by the admin endpoint). */
export async function upsertConfig(key: string, value: string, valueEs?: string): Promise<void> {
  const [existing] = await db.select().from(siteConfig).where(eq(siteConfig.key, key));
  if (existing) {
    await db.update(siteConfig).set({ value, valueEs: valueEs ?? existing.valueEs, updatedAt: new Date() }).where(eq(siteConfig.key, key));
  } else {
    await db.insert(siteConfig).values({ key, value, valueEs: valueEs ?? value, type: "text", category: "general" });
  }
  invalidateConfigCache();
}

export function cfg(map: ConfigMap, key: string, lang: "en" | "es"): string {
  const c = map[key];
  if (!c) return "";
  return lang === "es" ? c.valueEs || c.value : c.value;
}
