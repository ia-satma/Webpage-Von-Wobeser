import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  fetchCmsStats,
  fetchLanguageSettings,
  fetchTranslationCounts,
  saveLanguageSettings,
  translateArticle,
} from "./api";
import { TRANSLATION_QUERY_KEYS } from "./constants";
import { resolveSavedLanguages, toggleActiveLanguage } from "./helpers";
import type { TranslationCopy } from "./translations";

interface UseTranslationsDataOptions {
  isAuthenticated: boolean;
  canManageLanguages: boolean;
  contentTypeFilter: string;
  copy: TranslationCopy;
}

export function useTranslationsData({
  isAuthenticated,
  canManageLanguages,
  contentTypeFilter,
  copy,
}: UseTranslationsDataOptions) {
  const { toast } = useToast();
  const [translatingArticleId, setTranslatingArticleId] = useState<string | null>(null);
  const [activeLangs, setActiveLangs] = useState<string[]>([]);

  const cmsStatsQuery = useQuery({
    queryKey: TRANSLATION_QUERY_KEYS.stats,
    queryFn: fetchCmsStats,
    enabled: isAuthenticated,
  });

  const translationCountsQuery = useQuery({
    queryKey: TRANSLATION_QUERY_KEYS.counts.forFilter(contentTypeFilter),
    queryFn: fetchTranslationCounts,
    enabled: isAuthenticated,
  });

  const languagesSettingsQuery = useQuery({
    queryKey: TRANSLATION_QUERY_KEYS.languages,
    queryFn: fetchLanguageSettings,
    enabled: isAuthenticated && canManageLanguages,
  });

  useEffect(() => {
    if (languagesSettingsQuery.data?.activeLanguages) {
      setActiveLangs(languagesSettingsQuery.data.activeLanguages);
    }
  }, [languagesSettingsQuery.data]);

  const translateMutation = useMutation({
    mutationFn: translateArticle,
    onSuccess: () => {
      toast({ title: copy.translateSuccess });
      queryClient.invalidateQueries({ queryKey: TRANSLATION_QUERY_KEYS.counts.root });
      setTranslatingArticleId(null);
    },
    onError: (error) => {
      toast({
        title: copy.translateError,
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
      setTranslatingArticleId(null);
    },
  });

  const translateMissing = useCallback((articleId: string, languages: string[]) => {
    if (languages.length === 0) return;
    setTranslatingArticleId(articleId);
    translateMutation.mutate({ articleId, languages });
  }, [translateMutation]);

  const saveLanguagesMutation = useMutation({
    mutationFn: saveLanguageSettings,
    onSuccess: (data) => {
      setActiveLangs((current) => resolveSavedLanguages(current, data));
      toast({ title: "Idiomas activos guardados" });
      queryClient.invalidateQueries({ queryKey: TRANSLATION_QUERY_KEYS.languages });
    },
    onError: () => toast({
      title: "No se pudieron guardar los idiomas",
      variant: "destructive",
    }),
  });

  const toggleLanguage = useCallback((code: string, enabled: boolean) => {
    setActiveLangs((current) => toggleActiveLanguage(current, code, enabled));
  }, []);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: TRANSLATION_QUERY_KEYS.stats });
    queryClient.invalidateQueries({ queryKey: TRANSLATION_QUERY_KEYS.counts.root });
  }, []);

  const retry = useCallback(() => {
    void cmsStatsQuery.refetch();
    void translationCountsQuery.refetch();
  }, [cmsStatsQuery, translationCountsQuery]);

  return {
    activeLangs,
    cmsStatsQuery,
    languagesSettingsQuery,
    saveLanguagesMutation,
    translatingArticleId,
    translationCountsQuery,
    translateMutation,
    refresh,
    retry,
    toggleLanguage,
    translateMissing,
  };
}

export type TranslationsDataController = ReturnType<typeof useTranslationsData>;
