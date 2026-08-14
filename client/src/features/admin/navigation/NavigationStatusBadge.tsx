import { Badge } from "@/components/ui/badge";
import type { NavigationStatus } from "./types";

const COPY: Record<NavigationStatus, { label: string; className: string }> = {
  ready: { label: "Listo", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  "no-content": { label: "Sin contenido", className: "border-amber-200 bg-amber-50 text-amber-800" },
  hidden: { label: "Oculto", className: "border-slate-200 bg-slate-50 text-slate-600" },
  future: { label: "Futuro", className: "border-violet-200 bg-violet-50 text-violet-700" },
};

export function NavigationStatusBadge({ status }: { status: NavigationStatus }) {
  const copy = COPY[status];
  return <Badge variant="outline" className={copy.className}>{copy.label}</Badge>;
}
