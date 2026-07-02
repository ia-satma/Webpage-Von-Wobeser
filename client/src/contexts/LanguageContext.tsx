import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, type LanguageCode, type SupportedLanguage } from "@shared/schema";

type DisplayLanguage = "en" | "es";

interface LanguageContextType {
  language: LanguageCode;
  displayLanguage: DisplayLanguage;
  setLanguage: (lang: LanguageCode) => void;
  getLanguageInfo: () => SupportedLanguage;
  isDetecting: boolean;
}

const STORAGE_KEY = "vwb_language";
const DETECTION_KEY = "vwb_language_detected";
const DEFAULT_LANGUAGE: LanguageCode = "en";

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const validLanguageCodes = SUPPORTED_LANGUAGES.map(lang => lang.code);

function isValidLanguageCode(code: string): code is LanguageCode {
  return validLanguageCodes.includes(code as LanguageCode);
}

function getStoredLanguage(): LanguageCode | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isValidLanguageCode(stored)) {
      return stored;
    }
  } catch {
  }
  return null;
}

interface LanguageProviderProps {
  children: ReactNode;
}

function getDisplayLanguage(lang: LanguageCode): DisplayLanguage {
  if (lang === "es") return "es";
  return "en";
}

const HTML_LANG_CODES: Record<LanguageCode, string> = {
  en: "en",
  es: "es-MX",
  de: "de",
  zh: "zh-CN",
  ko: "ko",
  ja: "ja",
  ar: "ar",
  ru: "ru",
  fr: "fr",
  it: "it",
};

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { i18n: i18nInstance } = useTranslation();

  // El PANEL DE ADMINISTRACIÓN es fijo en ESPAÑOL (decisión del cliente): se
  // ignora cualquier idioma guardado o detectado y no se ofrece selector.
  // (El sitio público usa su propio sistema server-side con ?lang=, aparte.)
  const language: LanguageCode = "es";
  const displayLanguage = getDisplayLanguage(language);

  const setLanguage = useCallback((_lang: LanguageCode) => {
    // no-op: el admin permanece en español.
  }, []);

  const getLanguageInfo = useCallback(
    (): SupportedLanguage => SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0],
    [],
  );

  // Fija i18n y el <html lang> a español una sola vez.
  useEffect(() => {
    if (i18nInstance.language !== "es") i18nInstance.changeLanguage("es");
    document.documentElement.setAttribute("lang", HTML_LANG_CODES.es);
    document.documentElement.setAttribute("dir", "ltr");
    try {
      localStorage.setItem(STORAGE_KEY, "es");
    } catch {
      /* ignore */
    }
  }, [i18nInstance]);

  return (
    <LanguageContext.Provider value={{ language, displayLanguage, setLanguage, getLanguageInfo, isDetecting: false }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
