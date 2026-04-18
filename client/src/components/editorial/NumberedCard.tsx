import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface NumberedCardProps {
  index: number;
  title: ReactNode;
  body?: ReactNode;
  icon?: LucideIcon;
  children?: ReactNode;
  dataTestid?: string;
  className?: string;
}

export function NumberedCard({
  index,
  title,
  body,
  icon: Icon,
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
      <div className="grid grid-cols-[auto,1fr] gap-x-4 sm:gap-x-5 h-full">
        <div className="flex items-start">
          <span className="font-serif font-light text-primary text-3xl sm:text-4xl leading-none tabular-nums tracking-tight">
            {padded}
          </span>
        </div>
        <div className="flex flex-col min-w-0">
          {Icon && (
            <Icon className="h-5 w-5 text-primary mb-3" strokeWidth={1.5} aria-hidden="true" />
          )}
          <h3 className="text-foreground uppercase tracking-[0.12em] text-sm font-medium leading-snug">
            {title}
          </h3>
          <span className="block h-px w-10 bg-primary mt-3 mb-4 transition-all duration-300 group-hover:w-16" />
          {body && (
            <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
          )}
          {children}
        </div>
      </div>
    </article>
  );
}
