import {
  adminApiRequest,
  readAdminJson,
} from "@/lib/adminAuth";
import type {
  CMSStats,
  TranslationLanguageSettings,
  TranslationResponse,
  TranslationRunResult,
} from "./contracts";
import { requireAppliedTranslation } from "./helpers";

export async function fetchCmsStats(): Promise<CMSStats> {
  const response = await adminApiRequest("GET", "/api/admin/cms-stats");
  if (!response.ok) throw new Error("Failed to fetch CMS stats");
  return response.json();
}

export async function fetchTranslationCounts(): Promise<TranslationResponse> {
  const response = await adminApiRequest(
    "GET",
    "/api/admin/news/translation-counts",
  );
  if (!response.ok) throw new Error("Failed to fetch translation counts");
  return response.json();
}

export async function translateArticle(input: {
  articleId: string;
  languages: string[];
}): Promise<TranslationRunResult> {
  const response = await adminApiRequest("POST", "/api/admin/translate", input);
  const result = await readAdminJson<TranslationRunResult>(
    response,
    "No se pudo iniciar la traducción.",
  );
  return requireAppliedTranslation(result);
}

export async function fetchLanguageSettings(): Promise<TranslationLanguageSettings> {
  const response = await adminApiRequest(
    "GET",
    "/api/admin/settings/languages",
  );
  if (!response.ok) throw new Error("No se pudieron cargar los idiomas activos.");
  return response.json();
}

export async function saveLanguageSettings(
  languages: string[],
): Promise<Partial<TranslationLanguageSettings> & { ok?: boolean }> {
  const response = await adminApiRequest("POST", "/api/admin/settings/languages", {
    languages,
  });
  if (!response.ok) throw new Error("save failed");
  return response.json();
}
