import type { News } from "@shared/schema";
import { BATCH_CONCURRENCY_LIMIT } from "./constants";
import type {
  BatchProcessingError,
  BatchProgress,
  PipelineArticleResult,
} from "./contracts";
import type { ArticleProcessingCopy } from "./translations";

export function selectProcessingDrafts(articles: News[]): News[] {
  return articles.filter((article) => article.published === false);
}

export function chunkArticles(
  articles: News[],
  size: number = BATCH_CONCURRENCY_LIMIT,
): News[][] {
  if (articles.length === 0) return [];
  const chunks: News[][] = [];
  for (let index = 0; index < articles.length; index += size) {
    chunks.push(articles.slice(index, index + size));
  }
  return chunks;
}

export function countArticlesWithTranslations(counts: Record<string, number>): number {
  return Object.values(counts).filter((count) => count > 0).length;
}

export function formatArticleDate(
  date: string | Date | null | undefined,
  language: string,
): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString(language === "es" ? "es-MX" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function normalizePipelineException(error: unknown): string {
  const message = error && typeof error === "object" && "message" in error
    ? String((error as { message?: unknown }).message || "Unknown error")
    : "Unknown error";
  if (message.includes("429") || message.includes("rate limit")) {
    return "Rate limit exceeded - will retry";
  }
  if (message.includes("timeout") || message.includes("ETIMEDOUT")) {
    return "Request timeout";
  }
  return message;
}

export function pipelinePayloadFailure(payload: Record<string, any>): string | null {
  if (payload.success !== false) return null;
  return Array.isArray(payload.errors) && payload.errors.length
    ? payload.errors.join("; ")
    : "One or more processing stages failed";
}

export function pipelineImageWarning(payload: Record<string, any>): boolean {
  return payload.steps?.image?.success === false && payload.success === true;
}

export function createBatchProgress(total: number): BatchProgress {
  return {
    isProcessing: total > 0,
    total,
    processed: 0,
    successful: 0,
    failed: 0,
    currentBatch: 0,
    totalBatches: Math.ceil(total / BATCH_CONCURRENCY_LIMIT),
    errors: [],
  };
}

export function resolveSettledPipelineResult(
  result: PromiseSettledResult<PipelineArticleResult>,
): PipelineArticleResult {
  if (result.status === "fulfilled") return result.value;
  return {
    success: false,
    error: result.reason?.message || "Promise rejected",
  };
}

export function buildBatchCompletionDescription(input: {
  successful: number;
  processed: number;
  failed: number;
  errors: BatchProcessingError[];
  imageWarnings: number;
  copy: ArticleProcessingCopy;
}): string {
  const { successful, processed, failed, errors, imageWarnings, copy } = input;
  let description = `${successful}/${processed} ${copy.batchComplete}`;
  if (failed > 0) {
    description += `, ${failed} ${copy.batchFailed}`;
    const errorSummary = errors.slice(0, 3)
      .map((error) => `${error.title}: ${error.error}`)
      .join("; ");
    if (errorSummary) {
      description += ` - ${errorSummary}`;
      if (errors.length > 3) description += `... (+${errors.length - 3} more)`;
    }
  }
  if (imageWarnings > 0) {
    description += ` (${imageWarnings} ${copy.imageWarning})`;
  }
  return description;
}
