import { Globe } from "lucide-react";
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
          "gap-2 min-w-0 w-auto min-h-[36px] touch-manipulation rounded-none font-medium transition-all",
          "focus:ring-2 focus:ring-offset-2 focus:ring-primary/50",
          compact ? "px-2 py-1" : "px-3 py-1.5",
          isMobile 
            ? "bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30" 
            : isScrolled 
              ? "bg-transparent border border-primary/40 text-foreground hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10" 
              : "bg-black/30 backdrop-blur-sm border border-white/30 text-white hover:bg-black/40",
          className
        )}
        data-testid="select-language-trigger"
        aria-label={ariaLabel}
      >
        <Globe className="w-4 h-4 shrink-0 text-primary" aria-hidden="true" data-testid="icon-globe" />
        <SelectValue data-testid="text-current-language">
          {getDisplayName()}
        </SelectValue>
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
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
