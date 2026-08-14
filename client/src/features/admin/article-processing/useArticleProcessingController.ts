import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminAuth } from "@/lib/adminAuth";
import { countArticlesWithTranslations } from "./helpers";
import {
  selectArticleProcessingCopy,
  selectProcessingDraftCopy,
} from "./translations";
import { useArticlePipeline } from "./useArticlePipeline";
import { useArticleProcessingData } from "./useArticleProcessingData";

export function useArticleProcessingController() {
  const { language } = useLanguage();
  const { isAuthenticated, isLoading: authLoading, requireAuth } = useAdminAuth();
  const copy = selectArticleProcessingCopy(language);
  const draftCopy = selectProcessingDraftCopy(language);

  useEffect(() => {
    if (!authLoading) requireAuth();
  }, [authLoading, requireAuth]);

  const data = useArticleProcessingData({
    enabled: isAuthenticated,
    copy,
    draftCopy,
  });
  const news = data.newsQuery.data || [];
  const translationCounts = data.translationCountsQuery.data?.counts || {};
  const pipeline = useArticlePipeline({
    articles: news,
    copy,
    draftCopy,
    invalidatePipelineResults: data.invalidatePipelineResults,
  });

  return {
    language,
    copy,
    draftCopy,
    isAuthenticated,
    authLoading,
    news,
    translationCounts,
    stats: data.statsQuery.data || { total: 0, published: 0, unpublished: 0 },
    articlesWithTranslations: countArticlesWithTranslations(translationCounts),
    ...data,
    ...pipeline,
  };
}

export type ArticleProcessingController = ReturnType<typeof useArticleProcessingController>;
