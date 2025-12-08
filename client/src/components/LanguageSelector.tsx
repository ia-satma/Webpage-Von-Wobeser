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
  className?: string;
}

export default function LanguageSelector({ 
  isScrolled = false, 
  isMobile = false,
  className 
}: LanguageSelectorProps) {
  const { language, setLanguage, getLanguageInfo } = useLanguage();
  const currentLangInfo = getLanguageInfo();

  const handleLanguageChange = (value: string) => {
    setLanguage(value as LanguageCode);
  };

  return (
    <Select value={language} onValueChange={handleLanguageChange}>
      <SelectTrigger 
        className={cn(
          "gap-2 min-w-0 w-auto min-h-[44px] touch-manipulation rounded-md px-3 py-2 font-medium transition-all",
          "focus:ring-2 focus:ring-offset-2 focus:ring-primary/50",
          isMobile 
            ? "bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30" 
            : isScrolled 
              ? "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700" 
              : "bg-black/30 backdrop-blur-sm border border-white/40 text-white hover:bg-black/40",
          className
        )}
        data-testid="select-language-trigger"
        aria-label="Select language"
      >
        <Globe className="w-4 h-4 shrink-0" aria-hidden="true" data-testid="icon-globe" />
        <SelectValue data-testid="text-current-language">
          {currentLangInfo.nameNative}
        </SelectValue>
        <ChevronDown className="w-4 h-4 shrink-0 opacity-70" aria-hidden="true" />
      </SelectTrigger>
      <SelectContent 
        data-testid="select-language-content"
        className="max-h-[300px] z-[100]"
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
