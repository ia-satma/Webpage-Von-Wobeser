import type { ReactNode } from "react";

interface NumberedCardProps {
  index: number;
  title: ReactNode;
  body?: ReactNode;
  children?: ReactNode;
  dataTestid?: string;
  className?: string;
}

export function NumberedCard({
  index,
  title,
  body,
  children,
  dataTestid,
  className = "",
}: NumberedCardProps) {
  const padded = String(index + 1).padStart(2, "0");

  return (
    <article
      className={`group relative h-full flex flex-col bg-card border border-border rounded-none p-6 hover-elevate ${className}`}
      data-testid={dataTestid}
    >
      <h3 className="text-primary uppercase tracking-[0.12em] text-sm font-light leading-snug">
        <span className="tabular-nums font-mono text-[11px] tracking-[0.16em] me-3">
          {padded}
        </span>
        <span className="me-2">—</span>
        <span>{title}</span>
      </h3>
      <span className="block h-px w-10 bg-primary mt-3 mb-4 transition-all duration-300 group-hover:w-16" />
      {body && (
        <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
      )}
      {children}
    </article>
  );
}
