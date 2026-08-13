export interface NewsStats {
  total: number;
  published: number;
  unpublished: number;
}

export interface TranslationCountsResponse {
  counts: Record<string, number>;
}

export interface BatchProcessingError {
  articleId: string;
  title: string;
  error: string;
}

export interface BatchProgress {
  isProcessing: boolean;
  total: number;
  processed: number;
  successful: number;
  failed: number;
  currentBatch: number;
  totalBatches: number;
  errors: BatchProcessingError[];
}

export interface PipelineHttpResult {
  ok: boolean;
  status: number;
  statusText: string;
  bodyParsed: boolean;
  payload: Record<string, any>;
}

export interface PipelineArticleResult {
  success: boolean;
  error?: string;
  imageWarning?: boolean;
}
