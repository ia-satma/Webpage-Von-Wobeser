import { Info } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Banner de ayuda "para dummies": explica en lenguaje simple qué hace la
 * sección y cómo usarla. Se coloca arriba de cada pantalla del admin.
 */
export function AdminPageHelp({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex items-start gap-3 rounded-md border border-primary/20 bg-primary/5 px-4 py-3 mb-6 text-sm text-foreground/80"
      data-testid="admin-page-help"
    >
      <Info className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
      <p className="leading-snug">{children}</p>
    </div>
  );
}
