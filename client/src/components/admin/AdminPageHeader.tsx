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
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-primary flex-shrink-0" />}
          <h1 className="text-2xl font-heading font-semibold tracking-tight text-foreground" data-testid="text-page-title">
            {title}
          </h1>
        </div>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}
