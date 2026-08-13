import { adminApiRequest } from "@/lib/adminAuth";
import type { News } from "@shared/schema";
import type {
  NewsStats,
  PipelineHttpResult,
  TranslationCountsResponse,
} from "./contracts";

async function parseResponse(response: Response): Promise<PipelineHttpResult> {
  let bodyParsed = true;
  let payload: Record<string, any> = {};
  try {
    payload = await response.json();
  } catch {
    bodyParsed = false;
  }
  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    bodyParsed,
    payload,
  };
}

export async function fetchArticleProcessingStats(): Promise<NewsStats> {
  const response = await adminApiRequest("GET", "/api/admin/news/stats");
  if (!response.ok) throw new Error("Failed to fetch stats");
  return response.json();
}

export async function fetchAdministrativeNews(): Promise<News[]> {
  const response = await adminApiRequest("GET", "/api/admin/news?limit=100");
  if (!response.ok) throw new Error("Failed to fetch administrative news");
  const payload = await response.json();
  return Array.isArray(payload.news) ? payload.news : [];
}

export async function fetchTranslationCounts(): Promise<TranslationCountsResponse> {
  const response = await adminApiRequest("GET", "/api/admin/news/translation-counts");
  if (!response.ok) throw new Error("Failed to fetch translation counts");
  return response.json();
}

export async function createProcessingDraft(articleId: string): Promise<PipelineHttpResult> {
  const response = await adminApiRequest(
    "POST",
    `/api/admin/news/${articleId}/processing-draft`,
  );
  return parseResponse(response);
}

export async function runArticlePipeline(
  articleId: string,
  generateImage: boolean,
): Promise<PipelineHttpResult> {
  const response = await adminApiRequest("POST", `/api/agents/pipeline/${articleId}`, {
    generateImage,
  });
  return parseResponse(response);
}

export async function recoverFailedArticles(): Promise<Record<string, any>> {
  const response = await adminApiRequest("POST", "/api/agents/recover");
  if (!response.ok) {
    const payload = await response.json();
    throw new Error(payload.error || "Recovery failed");
  }
  return response.json();
}
