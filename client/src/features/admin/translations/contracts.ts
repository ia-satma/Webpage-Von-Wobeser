import type { SupportedLanguage } from "./constants";

export interface CMSStats {
  totalArticles: number;
  articlesWithTranslations: number;
  totalTranslations: number;
  translationsByLanguage: Record<string, number>;
  languageCoverage: {
    es: { total: number; translated: number };
    en: { total: number; translated: number };
  };
}

export interface TranslationCounts {
  articleId: string;
  title: string;
  slug: string;
  category: string;
  published: boolean;
  translatedLanguages: string[];
  missingLanguages: string[];
}

export interface TranslationResponse {
  counts: Record<string, number>;
  news: TranslationCounts[];
}

export interface TranslationRunResult {
  success: boolean;
  error?: string;
  data?: { changesApplied?: boolean };
}

export interface TranslationLanguageSettings {
  activeLanguages: string[];
  allLanguages: string[];
}

export interface TranslationJob {
  id: string;
  articleId: string;
  languages: string[];
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export interface LanguageCoverageItem {
  code: SupportedLanguage;
  name: string;
  native: string;
  translated: number;
  total: number;
  coverage: number;
}

export interface OverallTranslationStats {
  total: number;
  translated: number;
  coverage: number;
  languages: number;
}
