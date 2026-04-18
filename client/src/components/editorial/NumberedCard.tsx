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
      <div className="flex items-center gap-3 mb-5">
        <span className="text-[11px] font-mono text-primary tracking-[0.16em] tabular-nums">
          {padded}
        </span>
        <span className="h-px flex-1 bg-primary/60 transition-colors duration-300 group-hover:bg-primary" />
      </div>
      <h3 className="text-base font-light text-foreground uppercase tracking-[0.12em] mb-3 leading-snug">
        {title}
      </h3>
      {body && (
        <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
      )}
      {children}
    </article>
  );
}
