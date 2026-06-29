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
];

/** Returns all site-config as a {key: {value, valueEs, type}} map. */
export async function getConfigMap(): Promise<ConfigMap> {
  const rows = await db.select().from(siteConfig);
  const map: ConfigMap = {};
  for (const r of rows) map[r.key] = { value: r.value ?? "", valueEs: r.valueEs ?? "", type: r.type };
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
}

/** Upsert one key (used by the admin endpoint). */
export async function upsertConfig(key: string, value: string, valueEs?: string): Promise<void> {
  const [existing] = await db.select().from(siteConfig).where(eq(siteConfig.key, key));
  if (existing) {
    await db.update(siteConfig).set({ value, valueEs: valueEs ?? existing.valueEs, updatedAt: new Date() }).where(eq(siteConfig.key, key));
  } else {
    await db.insert(siteConfig).values({ key, value, valueEs: valueEs ?? value, type: "text", category: "general" });
  }
}

export function cfg(map: ConfigMap, key: string, lang: "en" | "es"): string {
  const c = map[key];
  if (!c) return "";
  return lang === "es" ? c.valueEs || c.value : c.value;
}
