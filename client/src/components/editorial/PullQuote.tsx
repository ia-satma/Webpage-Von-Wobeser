interface PullQuoteProps {
  quote: string;
  attribution?: string;
  className?: string;
  testId?: string;
}

export function PullQuote({ quote, attribution, className = "", testId }: PullQuoteProps) {
  return (
    <blockquote
      className={`border-l-2 border-[#AA1A2E] pl-6 md:pl-8 py-2 max-w-3xl ${className}`}
      data-testid={testId}
    >
      <p className="text-2xl md:text-3xl font-heading font-light leading-snug text-foreground">
        {quote}
      </p>
      {attribution && (
        <p className="text-[10px] text-[#AA1A2E] tracking-[0.25em] uppercase mt-4 font-medium">
          {attribution}
        </p>
      )}
    </blockquote>
  );
}
