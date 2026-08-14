import { adminApiRequest } from "@/lib/adminAuth";
import type { CarouselGroup, ConfigMap } from "./contracts";

export async function fetchSiteConfig(): Promise<ConfigMap> {
  const response = await adminApiRequest("GET", "/api/admin/site-config");
  if (!response.ok) throw new Error("No se pudo cargar la configuración del sitio.");
  return response.json();
}

export async function fetchPracticeCarousel(): Promise<CarouselGroup[]> {
  const response = await adminApiRequest("GET", "/api/admin/practice-groups");
  if (!response.ok) throw new Error("No se pudieron cargar las prácticas.");
  return response.json();
}

export async function fetchIndustryCarousel(): Promise<CarouselGroup[]> {
  const response = await adminApiRequest("GET", "/api/admin/industry-groups");
  if (!response.ok) throw new Error("No se pudieron cargar los grupos por industria.");
  return response.json();
}

export function optimizeHeroVideo(mediaPath: string): Promise<Response> {
  return adminApiRequest("POST", "/api/admin/media/hero-variants", { mediaPath });
}

export function updateSiteConfig(
  key: string,
  value: string,
  valueEs: string,
): Promise<Response> {
  return adminApiRequest("PUT", `/api/admin/site-config/${key}`, { value, valueEs });
}

export function restorePreviousFirm(): Promise<Response> {
  return adminApiRequest("POST", "/api/admin/site-config/firma/restore-previous", {
    confirm: true,
  });
}
