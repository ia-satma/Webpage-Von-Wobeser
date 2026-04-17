interface EyebrowProps {
  label: string;
  className?: string;
  testId?: string;
}

export function Eyebrow({ label, className = "", testId }: EyebrowProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`} data-testid={testId}>
      <div className="w-8 h-px bg-[#AA1A2E] shrink-0" aria-hidden="true" />
      <p className="text-[#AA1A2E] text-[10px] tracking-[0.25em] uppercase font-medium">
        {label}
      </p>
    </div>
  );
}
