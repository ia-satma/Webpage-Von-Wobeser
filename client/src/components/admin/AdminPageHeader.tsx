import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useLocation } from "wouter";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { getAdminPageContext } from "@/lib/adminNavigationAssistant";

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
  const [location] = useLocation();
  const context = getAdminPageContext(location);
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0 space-y-1.5">
          {(context.groupLabel || context.sectionLabel || context.detailLabel) && (
            <Breadcrumb className="text-xs" data-testid="admin-page-breadcrumb">
              <BreadcrumbList className="gap-1.5 text-xs">
                {context.groupLabel && <BreadcrumbItem><BreadcrumbPage>{context.groupLabel}</BreadcrumbPage></BreadcrumbItem>}
                {context.sectionLabel && <><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>{context.sectionLabel}</BreadcrumbPage></BreadcrumbItem></>}
                {context.detailLabel && <><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>{context.detailLabel}</BreadcrumbPage></BreadcrumbItem></>}
              </BreadcrumbList>
            </Breadcrumb>
          )}
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground" data-testid="text-page-title">
            {title}
          </h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
          {context.impact && (
            <Badge variant="outline" className={context.impact === "site" ? "border-amber-200 bg-amber-50 text-amber-950" : "border-sky-200 bg-sky-50 text-sky-900"}>
              {context.impact === "site" ? "Afecta varias páginas del sitio" : "Afecta sólo este contenido"}
            </Badge>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
