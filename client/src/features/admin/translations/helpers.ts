import {
  LANGUAGE_NAMES,
  SUPPORTED_LANGUAGES,
} from "./constants";
import type {
  CMSStats,
  LanguageCoverageItem,
  OverallTranslationStats,
  TranslationCounts,
  TranslationRunResult,
} from "./contracts";

export function buildLanguageCoverage(
  stats: CMSStats | undefined,
): LanguageCoverageItem[] {
  if (!stats) return [];
  const totalContent = stats.totalArticles || 1;
  return SUPPORTED_LANGUAGES.map((language) => {
    const translated = language === "es"
      ? stats.languageCoverage.es.translated
      : language === "en"
        ? stats.languageCoverage.en.translated
        : stats.translationsByLanguage?.[language] || 0;
    const coverage = Math.round((translated / totalContent) * 100);
    return {
      code: language,
      name: LANGUAGE_NAMES[language]?.en || language,
      native: LANGUAGE_NAMES[language]?.native || language,
      translated,
      total: totalContent,
      coverage: Math.min(coverage, 100),
    };
  });
}

export function buildOverallStats(
  stats: CMSStats | undefined,
): OverallTranslationStats {
  if (!stats) {
    return {
      total: 0,
      translated: 0,
      coverage: 0,
      languages: SUPPORTED_LANGUAGES.length,
    };
  }
  const total = stats.totalArticles || 0;
  const translated = stats.articlesWithTranslations || 0;
  const coverage = total > 0 ? Math.round((translated / total) * 100) : 0;
  return { total, translated, coverage, languages: SUPPORTED_LANGUAGES.length };
}

export function filterTranslationArticles(
  articles: TranslationCounts[],
  contentTypeFilter: string,
): TranslationCounts[] {
  if (contentTypeFilter === "all") return articles;
  return articles.filter((article) => article.category === contentTypeFilter);
}

export function canTranslateArticle(article: TranslationCounts): boolean {
  return article.published === false
    && Array.isArray(article.missingLanguages)
    && article.missingLanguages.length > 0;
}

export function requireAppliedTranslation(
  result: TranslationRunResult,
): TranslationRunResult {
  if (!result.success || result.data?.changesApplied !== true) {
    throw new Error(result.error || "La traducción no se guardó en el borrador.");
  }
  return result;
}

export function resolveSavedLanguages(
  current: string[],
  response: { activeLanguages?: string[] },
): string[] {
  return response.activeLanguages || current;
}

export function toggleActiveLanguage(
  languages: string[],
  code: string,
  enabled: boolean,
): string[] {
  if (!enabled) {
    return code === "es" ? languages : languages.filter((language) => language !== code);
  }
  return Array.from(new Set([...languages, code]));
}

export function getCoverageColor(coverage: number): string {
  if (coverage >= 90) return "text-green-600";
  if (coverage >= 70) return "text-yellow-600";
  if (coverage >= 50) return "text-orange-600";
  return "text-red-600";
}

export function getProgressColor(coverage: number): string {
  if (coverage >= 90) return "bg-green-600";
  if (coverage >= 70) return "bg-yellow-600";
  if (coverage >= 50) return "bg-orange-600";
  return "bg-red-600";
}
