import { useState } from "react";
import type { ReactNode } from "react";
import { Info, X, ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface AdminPageHelpProps {
  pageId: string;
  manualSectionId?: string;
  children: ReactNode;
}

function isDismissed(pageId: string): boolean {
  return typeof window !== "undefined" && localStorage.getItem(`admin-help-dismissed:${pageId}`) === "1";
}

/**
 * Banner de ayuda "para dummies": explica en lenguaje simple qué hace la
 * sección y cómo usarla. Se puede cerrar (recuerda el cierre por página en
 * localStorage) y opcionalmente enlaza a la sección correspondiente del
 * manual completo (/admin/manual).
 */
export function AdminPageHelp({ pageId, manualSectionId, children }: AdminPageHelpProps) {
  const [dismissed, setDismissed] = useState(() => isDismissed(pageId));

  if (dismissed) {
    return (
      <button
        type="button"
        onClick={() => {
          localStorage.removeItem(`admin-help-dismissed:${pageId}`);
          setDismissed(false);
        }}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary mb-6"
        data-testid="admin-page-help-reopen"
      >
        <Info className="h-3.5 w-3.5" /> Mostrar ayuda de esta sección
      </button>
    );
  }

  return (
    <div
      className="flex items-start gap-3 rounded-md border border-primary/20 bg-primary/5 px-4 py-3 mb-6 text-sm text-foreground/80"
      data-testid="admin-page-help"
    >
      <Info className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
      <div className="flex-1 leading-snug">
        <p>{children}</p>
        {manualSectionId && (
          <Link href={`/admin/manual#${manualSectionId}`}>
            <span className="mt-1 inline-flex items-center gap-1 text-primary hover:underline cursor-pointer" data-testid="link-manual-more">
              Ver más en el manual <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        )}
      </div>
      <button
        type="button"
        onClick={() => {
          localStorage.setItem(`admin-help-dismissed:${pageId}`, "1");
          setDismissed(true);
        }}
        className="text-foreground/40 hover:text-foreground flex-shrink-0"
        aria-label="Cerrar ayuda"
        data-testid="button-dismiss-help"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
