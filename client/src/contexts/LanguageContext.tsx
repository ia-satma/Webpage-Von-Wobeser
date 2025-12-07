import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
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

function getInitialLanguage(): LanguageCode {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE;
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isValidLanguageCode(stored)) {
      return stored;
    }
  } catch {
  }
  
  return DEFAULT_LANGUAGE;
}

interface LanguageProviderProps {
  children: ReactNode;
}

function getDisplayLanguage(lang: LanguageCode): DisplayLanguage {
  if (lang === "es") return "es";
  return "en";
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<LanguageCode>(getInitialLanguage);

  const displayLanguage = getDisplayLanguage(language);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
    }
  };

  const getLanguageInfo = (): SupportedLanguage => {
    const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === language);
    return langInfo || SUPPORTED_LANGUAGES[0];
  };

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isValidLanguageCode(stored)) {
      setLanguageState(stored);
    }
  }, []);

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
