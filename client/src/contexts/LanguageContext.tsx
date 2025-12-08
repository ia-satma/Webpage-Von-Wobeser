import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, type LanguageCode, type SupportedLanguage } from "@shared/schema";

type DisplayLanguage = "en" | "es";

interface LanguageContextType {
  language: LanguageCode;
  displayLanguage: DisplayLanguage;
  setLanguage: (lang: LanguageCode) => void;
  getLanguageInfo: () => SupportedLanguage;
}

const STORAGE_KEY = "vwb_language";
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
  const { i18n: i18nInstance, ready } = useTranslation();
  const initializedRef = useRef(false);
  
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const stored = getStoredLanguage();
    return stored || DEFAULT_LANGUAGE;
  });

  const displayLanguage = getDisplayLanguage(language);

  const setLanguage = useCallback((lang: LanguageCode) => {
    if (lang === language) return;
    
    setLanguageState(lang);
    
    if (i18nInstance.language !== lang) {
      i18nInstance.changeLanguage(lang);
    }
    
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
    }
  }, [language, i18nInstance]);

  const getLanguageInfo = useCallback((): SupportedLanguage => {
    const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === language);
    return langInfo || SUPPORTED_LANGUAGES[0];
  }, [language]);

  useEffect(() => {
    if (!ready || initializedRef.current) return;
    initializedRef.current = true;
    
    const stored = getStoredLanguage();
    
    if (stored) {
      if (stored !== language) {
        setLanguageState(stored);
      }
      if (i18nInstance.language !== stored) {
        i18nInstance.changeLanguage(stored);
      }
    } else {
      localStorage.setItem(STORAGE_KEY, language);
      if (i18nInstance.language !== language) {
        i18nInstance.changeLanguage(language);
      }
    }
  }, [ready, i18nInstance, language]);

  useEffect(() => {
    const htmlElement = document.documentElement;
    const langCode = HTML_LANG_CODES[language] || language;
    htmlElement.setAttribute("lang", langCode);
    
    if (language === "ar") {
      htmlElement.setAttribute("dir", "rtl");
    } else {
      htmlElement.setAttribute("dir", "ltr");
    }
  }, [language]);

  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      if (isValidLanguageCode(lng) && lng !== language) {
        setLanguageState(lng);
        try {
          localStorage.setItem(STORAGE_KEY, lng);
        } catch {
        }
      }
    };

    i18nInstance.on('languageChanged', handleLanguageChanged);
    return () => {
      i18nInstance.off('languageChanged', handleLanguageChanged);
    };
  }, [i18nInstance, language]);

  return (
    <LanguageContext.Provider value={{ language, displayLanguage, setLanguage, getLanguageInfo }}>
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
