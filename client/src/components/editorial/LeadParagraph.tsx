import { useLanguage } from "@/contexts/LanguageContext";

interface LeadParagraphProps {
  eyebrow?: string;
  firstParagraph: string;
  restParagraphs?: string[];
  className?: string;
  testId?: string;
}

const LATIN_LANGUAGES = ["en", "es", "de", "fr", "it", "pt"];

export function LeadParagraph({
  eyebrow,
  firstParagraph,
  restParagraphs = [],
  className = "",
  testId,
}: LeadParagraphProps) {
  const { language } = useLanguage();
  const useDropCap = LATIN_LANGUAGES.includes(language);
  const isRtl = language === "ar";

  const dropCapClasses = useDropCap
    ? "first-letter:text-5xl md:first-letter:text-6xl first-letter:font-heading first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:leading-none first-letter:text-[#AA1A2E]"
    : "";

  const accentClasses = isRtl
    ? "border-r border-[#AA1A2E]/40 pr-6 md:pr-8"
    : "border-l border-[#AA1A2E]/40 pl-6 md:pl-8";

  return (
    <div
      className={`${accentClasses} ${className}`}
      data-testid={testId}
    >
      {eyebrow && (
        <p className="text-[10px] tracking-[0.3em] uppercase text-[#AA1A2E] mb-4 font-medium">
          {eyebrow}
        </p>
      )}
      <p
        className={`text-xl md:text-2xl font-heading font-light leading-relaxed text-foreground ${dropCapClasses}`}
      >
        {firstParagraph}
      </p>
      {restParagraphs.map((p, i) => (
        <p
          key={i}
          className="text-base md:text-lg text-muted-foreground leading-relaxed mt-5"
        >
          {p}
        </p>
      ))}
    </div>
  );
}
