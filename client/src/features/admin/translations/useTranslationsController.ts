import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminAuth, useMyPermissions } from "@/lib/adminAuth";
import {
  buildLanguageCoverage,
  buildOverallStats,
  filterTranslationArticles,
} from "./helpers";
import { selectTranslationCopy } from "./translations";
import { useTranslationsData } from "./useTranslationsData";

export function useTranslationsController() {
  const { language } = useLanguage();
  const { isAuthenticated, isLoading: authLoading, requireAuth } = useAdminAuth();
  const { has, loaded: permissionsLoaded } = useMyPermissions();
  const [contentTypeFilter, setContentTypeFilter] = useState("all");
  const copy = selectTranslationCopy(language);
  const canManageLanguages = permissionsLoaded && has("config");

  useEffect(() => {
    if (!authLoading) requireAuth();
  }, [authLoading, requireAuth]);

  const data = useTranslationsData({
    isAuthenticated,
    canManageLanguages,
    contentTypeFilter,
    copy,
  });
  const stats = data.cmsStatsQuery.data;
  const articles = data.translationCountsQuery.data?.news || [];

  return {
    ...data,
    language,
    copy,
    authLoading,
    isAuthenticated,
    canManageLanguages,
    contentTypeFilter,
    setContentTypeFilter,
    overallStats: buildOverallStats(stats),
    languageCoverage: buildLanguageCoverage(stats),
    filteredArticles: filterTranslationArticles(articles, contentTypeFilter),
    loadError: data.cmsStatsQuery.error || data.translationCountsQuery.error,
  };
}

export type TranslationsController = ReturnType<typeof useTranslationsController>;
