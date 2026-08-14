export const BATCH_CONCURRENCY_LIMIT = 3;
export const BATCH_DELAY_MS = 500;

export const ARTICLE_PROCESSING_QUERY_KEYS = {
  stats: ["/api/admin/news/stats"] as const,
  news: ["/api/admin/news", "agent-processing"] as const,
  translations: ["/api/admin/news/translation-counts"] as const,
};
