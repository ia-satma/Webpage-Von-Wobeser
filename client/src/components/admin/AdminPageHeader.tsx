import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
}

/**
 * Encabezado de página estandarizado — reemplaza los headers "← Dashboard" + <h1> sueltos
 * que antes duplicaba cada página (ya innecesario: la navegación completa vive en el
 * sidebar). Fija el tamaño de <h1> a text-2xl en las 26 páginas del admin (antes variaba
 * entre text-xl/text-2xl/text-3xl según el archivo).
 */
export function AdminPageHeader({ title, description, icon: Icon, actions }: AdminPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0 space-y-1">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground" data-testid="text-page-title">
            {title}
          </h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
