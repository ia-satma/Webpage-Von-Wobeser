import { Globe, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { SUPPORTED_LANGUAGES, type LanguageCode } from "@shared/schema";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  isScrolled?: boolean;
  isMobile?: boolean;
  compact?: boolean;
  className?: string;
}

const ariaLabels: Record<LanguageCode, string> = {
  en: "Select language",
  es: "Seleccionar idioma",
  de: "Sprache auswählen",
  zh: "选择语言",
  ko: "언어 선택",
  ja: "言語を選択",
  ar: "اختر اللغة",
  ru: "Выбрать язык",
  fr: "Sélectionner la langue",
  it: "Seleziona lingua",
};

export default function LanguageSelector({ 
  isScrolled = false, 
  isMobile = false,
  compact = false,
  className 
}: LanguageSelectorProps) {
  const { language, setLanguage, getLanguageInfo } = useLanguage();
  const currentLangInfo = getLanguageInfo();

  const handleLanguageChange = (value: string) => {
    setLanguage(value as LanguageCode);
  };

  const getDisplayName = () => {
    if (compact) {
      return language.toUpperCase();
    }
    return currentLangInfo.nameNative;
  };

  const ariaLabel = ariaLabels[language] || ariaLabels.en;

  return (
    <Select value={language} onValueChange={handleLanguageChange}>
      <SelectTrigger 
        className={cn(
          "gap-2 min-w-0 w-auto min-h-[44px] touch-manipulation rounded-none font-medium transition-all",
          "focus:ring-2 focus:ring-offset-2 focus:ring-primary/50",
          compact ? "px-2 py-2" : "px-3 py-2",
          isMobile 
            ? "bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30" 
            : isScrolled 
              ? "bg-transparent border border-[#AA1A2E]/40 text-gray-800 dark:text-gray-100 hover:border-[#AA1A2E] hover:bg-[#AA1A2E]/5 dark:hover:bg-[#AA1A2E]/10" 
              : "bg-black/30 backdrop-blur-sm border border-white/30 text-white hover:bg-black/40",
          className
        )}
        data-testid="select-language-trigger"
        aria-label={ariaLabel}
      >
        <Globe className="w-4 h-4 shrink-0 text-[#AA1A2E]" aria-hidden="true" data-testid="icon-globe" />
        <SelectValue data-testid="text-current-language">
          {getDisplayName()}
        </SelectValue>
        {!compact && <ChevronDown className="w-4 h-4 shrink-0 opacity-70" aria-hidden="true" />}
      </SelectTrigger>
      <SelectContent 
        data-testid="select-language-content"
        className="max-h-[300px] z-[100] rounded-none"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <SelectItem 
            key={lang.code} 
            value={lang.code}
            data-testid={`select-language-option-${lang.code}`}
            className="cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span className="font-medium">{lang.nameNative}</span>
              {lang.code !== "en" && lang.code !== "es" && (
                <span className="text-xs text-muted-foreground">({lang.name})</span>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
