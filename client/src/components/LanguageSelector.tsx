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
          "border-0 bg-transparent focus:ring-0 focus:ring-offset-0 gap-2 min-w-0 w-auto min-h-[44px] touch-manipulation",
          isMobile 
            ? "text-white/90 hover:text-white" 
            : isScrolled 
              ? "text-gray-700 dark:text-gray-300 hover:text-primary" 
              : "text-white/90 hover:text-white",
          className
        )}
        data-testid="select-language-trigger"
        aria-label="Select language"
      >
        <Globe className="w-4 h-4 shrink-0" aria-hidden="true" data-testid="icon-globe" />
        <SelectValue data-testid="text-current-language">
          {currentLangInfo.nameNative}
        </SelectValue>
      </SelectTrigger>
      <SelectContent 
        data-testid="select-language-content"
        className="max-h-[300px]"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <SelectItem 
            key={lang.code} 
            value={lang.code}
            data-testid={`select-language-option-${lang.code}`}
          >
            <span className="flex items-center gap-2">
              <span>{lang.nameNative}</span>
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
