import { useCallback, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { News } from "@shared/schema";
import { runArticlePipeline } from "./api";
import { BATCH_CONCURRENCY_LIMIT, BATCH_DELAY_MS } from "./constants";
import type {
  BatchProcessingError,
  BatchProgress,
  PipelineArticleResult,
} from "./contracts";
import {
  buildBatchCompletionDescription,
  chunkArticles,
  createBatchProgress,
  normalizePipelineException,
  pipelineImageWarning,
  pipelinePayloadFailure,
  resolveSettledPipelineResult,
  selectProcessingDrafts,
} from "./helpers";
import type {
  ArticleProcessingCopy,
  ProcessingDraftCopy,
} from "./translations";

interface UseArticlePipelineOptions {
  articles: News[];
  copy: ArticleProcessingCopy;
  draftCopy: ProcessingDraftCopy;
  invalidatePipelineResults: () => void;
}

const EMPTY_BATCH_PROGRESS: BatchProgress = {
  isProcessing: false,
  total: 0,
  processed: 0,
  successful: 0,
  failed: 0,
  currentBatch: 0,
  totalBatches: 0,
  errors: [],
};

export function useArticlePipeline({
  articles,
  copy,
  draftCopy,
  invalidatePipelineResults,
}: UseArticlePipelineOptions) {
  const { toast } = useToast();
  const [processingArticleId, setProcessingArticleId] = useState<string | null>(null);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [progressArticleTitle, setProgressArticleTitle] = useState("");
  const [pipelineStartError, setPipelineStartError] = useState<string | null>(null);
  const [generateImages, setGenerateImages] = useState(false);
  const [batchProgress, setBatchProgress] = useState<BatchProgress>(EMPTY_BATCH_PROGRESS);
  const cancelBatchRef = useRef(false);

  const processSingleArticle = useCallback(async (article: News): Promise<PipelineArticleResult> => {
    try {
      if (article.published !== false) {
        return { success: false, error: draftCopy.requiresDraft };
      }
      const result = await runArticlePipeline(article.id, generateImages);
      if (!result.ok) {
        const error = result.bodyParsed
          ? result.payload.error || result.payload.message || `HTTP ${result.status}`
          : `HTTP ${result.status}: ${result.statusText}`;
        return { success: false, error };
      }
      const payloadFailure = pipelinePayloadFailure(result.payload);
      if (payloadFailure) return { success: false, error: payloadFailure };
      return {
        success: true,
        imageWarning: pipelineImageWarning(result.payload),
      };
    } catch (error) {
      return { success: false, error: normalizePipelineException(error) };
    }
  }, [draftCopy.requiresDraft, generateImages]);

  const processBatch = useCallback(async (drafts: News[]) => {
    cancelBatchRef.current = false;
    const batches = chunkArticles(drafts);
    const errors: BatchProcessingError[] = [];
    let successful = 0;
    let failed = 0;
    let processed = 0;
    let imageWarnings = 0;
    setBatchProgress(createBatchProgress(drafts.length));

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      if (cancelBatchRef.current) {
        console.log("[BatchProcessor] Processing cancelled by user");
        break;
      }
      const batch = batches[batchIndex];
      const start = batchIndex * BATCH_CONCURRENCY_LIMIT;
      const end = start + batch.length;
      console.log(
        `[BatchProcessor] Processing batch ${batchIndex + 1}/${batches.length} (articles ${start + 1}-${end})`,
      );
      setBatchProgress((previous) => ({
        ...previous,
        currentBatch: batchIndex + 1,
      }));

      const results = await Promise.allSettled(
        batch.map((article) => processSingleArticle(article)),
      );
      results.forEach((settled, index) => {
        const article = batch[index];
        const result = resolveSettledPipelineResult(settled);
        processed++;
        if (result.success) {
          successful++;
          if (result.imageWarning) imageWarnings++;
        } else {
          failed++;
          errors.push({
            articleId: article.id,
            title: article.titleEs || article.title || "Untitled",
            error: result.error || "Unknown error",
          });
        }
        setBatchProgress((previous) => ({
          ...previous,
          processed,
          successful,
          failed,
          errors: [...errors],
        }));
      });

      if (batchIndex < batches.length - 1 && !cancelBatchRef.current) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    setBatchProgress((previous) => ({ ...previous, isProcessing: false }));
    const wasCancelled = cancelBatchRef.current;
    toast({
      title: wasCancelled ? copy.stopProcessing : copy.processAllSuccess,
      description: buildBatchCompletionDescription({
        successful,
        processed,
        failed,
        errors,
        imageWarnings,
        copy,
      }),
      variant: failed > 0 ? "destructive" : "default",
    });
    cancelBatchRef.current = false;
    invalidatePipelineResults();
  }, [copy, invalidatePipelineResults, processSingleArticle, toast]);

  const stopBatch = useCallback(() => {
    cancelBatchRef.current = true;
    toast({
      title: copy.stopProcessing,
      description: `${batchProgress.processed}/${batchProgress.total} ${copy.batchComplete}`,
    });
  }, [batchProgress, copy, toast]);

  const processAll = useCallback(() => {
    if (articles.length === 0) {
      toast({ title: copy.noArticles, variant: "destructive" });
      return;
    }
    const drafts = selectProcessingDrafts(articles);
    if (drafts.length === 0) {
      toast({
        title: draftCopy.noDrafts,
        description: draftCopy.noDraftsDescription,
        variant: "destructive",
      });
      return;
    }
    processBatch(drafts);
  }, [articles, copy.noArticles, draftCopy, processBatch, toast]);

  const processArticleMutation = useMutation({
    mutationFn: async ({ articleId, title }: { articleId: string; title: string }) => {
      const article = articles.find((item) => item.id === articleId);
      if (!article || article.published !== false) {
        throw new Error(draftCopy.requiresDraft);
      }
      setProcessingArticleId(articleId);
      setProgressArticleTitle(title);
      setPipelineStartError(null);
      setProgressModalOpen(true);
      const result = await runArticlePipeline(articleId, generateImages);
      if (!result.ok) {
        const errorMessage = result.payload?.code === "PUBLISHED_ARTICLE_REQUIRES_DRAFT"
          ? draftCopy.requiresDraft
          : result.payload?.error || result.payload?.message || `Error HTTP ${result.status}`;
        setPipelineStartError(errorMessage);
        throw new Error(errorMessage);
      }
      if (result.payload?.success === false) {
        const details = Array.isArray(result.payload?.errors) && result.payload.errors.length
          ? result.payload.errors.join("; ")
          : result.payload?.error || "Una etapa no pudo completar el procesamiento.";
        throw new Error(details);
      }
      return result.payload;
    },
    onSuccess: (data: Record<string, any>) => {
      toast(data?.imageWarning
        ? {
            title: copy.imageWarning,
            description: String(data.imageWarning),
            variant: "destructive",
          }
        : { title: copy.processSuccess });
      invalidatePipelineResults();
    },
    onError: (error: any) => {
      const errorMessage = error?.message || error?.error || copy.processError;
      toast({
        title: copy.processError,
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleProgressModalOpenChange = (open: boolean) => {
    setProgressModalOpen(open);
    if (!open) {
      setProcessingArticleId(null);
      setProgressArticleTitle("");
      setPipelineStartError(null);
    }
  };

  return {
    processingArticleId,
    progressModalOpen,
    progressArticleTitle,
    pipelineStartError,
    generateImages,
    batchProgress,
    processArticleMutation,
    setGenerateImages,
    processAll,
    stopBatch,
    handleProgressModalOpenChange,
  };
}

export type ArticlePipelineController = ReturnType<typeof useArticlePipeline>;
