import { useCallback, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { News } from "@shared/schema";
import {
  createProcessingDraft,
  fetchAdministrativeNews,
  fetchArticleProcessingStats,
  fetchTranslationCounts,
  recoverFailedArticles,
} from "./api";
import { ARTICLE_PROCESSING_QUERY_KEYS } from "./constants";
import type { NewsStats, TranslationCountsResponse } from "./contracts";
import type {
  ArticleProcessingCopy,
  ProcessingDraftCopy,
} from "./translations";

interface UseArticleProcessingDataOptions {
  enabled: boolean;
  copy: ArticleProcessingCopy;
  draftCopy: ProcessingDraftCopy;
}

export function useArticleProcessingData({
  enabled,
  copy,
  draftCopy,
}: UseArticleProcessingDataOptions) {
  const { toast } = useToast();
  const [creatingDraftArticleId, setCreatingDraftArticleId] = useState<string | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  const statsQuery = useQuery<NewsStats>({
    queryKey: ARTICLE_PROCESSING_QUERY_KEYS.stats,
    queryFn: fetchArticleProcessingStats,
    enabled,
  });

  const newsQuery = useQuery<News[]>({
    queryKey: ARTICLE_PROCESSING_QUERY_KEYS.news,
    queryFn: fetchAdministrativeNews,
    enabled,
  });

  const translationCountsQuery = useQuery<TranslationCountsResponse>({
    queryKey: ARTICLE_PROCESSING_QUERY_KEYS.translations,
    queryFn: fetchTranslationCounts,
    enabled,
  });

  const invalidatePipelineResults = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ARTICLE_PROCESSING_QUERY_KEYS.translations });
    queryClient.invalidateQueries({ queryKey: ARTICLE_PROCESSING_QUERY_KEYS.news });
  }, []);

  const refreshAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ARTICLE_PROCESSING_QUERY_KEYS.stats });
    queryClient.invalidateQueries({ queryKey: ARTICLE_PROCESSING_QUERY_KEYS.translations });
    queryClient.invalidateQueries({ queryKey: ARTICLE_PROCESSING_QUERY_KEYS.news });
  }, []);

  const createProcessingDraftMutation = useMutation({
    mutationFn: async (article: News): Promise<{ draft: News }> => {
      setCreatingDraftArticleId(article.id);
      const result = await createProcessingDraft(article.id);
      if (!result.ok || !result.payload?.draft) {
        throw new Error(result.payload?.error || draftCopy.draftCreateError);
      }
      return result.payload as { draft: News };
    },
    onSuccess: () => {
      toast({
        title: draftCopy.draftCreated,
        description: draftCopy.draftCreatedDescription,
      });
      queryClient.invalidateQueries({ queryKey: ARTICLE_PROCESSING_QUERY_KEYS.news });
      queryClient.invalidateQueries({ queryKey: ARTICLE_PROCESSING_QUERY_KEYS.translations });
      queryClient.invalidateQueries({ queryKey: ARTICLE_PROCESSING_QUERY_KEYS.stats });
    },
    onError: (error: Error) => {
      toast({
        title: draftCopy.draftCreateError,
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => setCreatingDraftArticleId(null),
  });

  const recoverMutation = useMutation({
    mutationFn: recoverFailedArticles,
    onMutate: () => setIsRecovering(true),
    onSuccess: (data) => {
      setIsRecovering(false);
      toast({
        title: copy.repairSuccess,
        description: `${data.recovered} articles recovered`,
      });
      queryClient.invalidateQueries({ queryKey: ARTICLE_PROCESSING_QUERY_KEYS.news });
    },
    onError: (error: Error) => {
      setIsRecovering(false);
      toast({
        title: copy.processError,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    statsQuery,
    newsQuery,
    translationCountsQuery,
    creatingDraftArticleId,
    isRecovering,
    createProcessingDraftMutation,
    recoverMutation,
    invalidatePipelineResults,
    refreshAll,
  };
}

export type ArticleProcessingDataController = ReturnType<typeof useArticleProcessingData>;
