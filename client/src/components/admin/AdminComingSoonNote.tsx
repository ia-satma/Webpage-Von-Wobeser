import { Construction } from "lucide-react";

/**
 * Aviso compacto para secciones que YA funcionan en el admin pero cuyo contenido
 * todavía no se muestra en el sitio público — el cliente no ha autorizado conectar
 * este hueco al frontend todavía. Distinto de AdminPageHelp (que explica cómo usar
 * la pantalla, no que le falte conexión).
 */
export function AdminComingSoonNote() {
  return (
    <div
      className="flex items-start gap-3 rounded-md border border-warning/30 bg-warning/10 px-4 py-3 mb-6 text-sm text-foreground/80"
      data-testid="admin-coming-soon-note"
    >
      <Construction className="h-4 w-4 mt-0.5 text-warning flex-shrink-0" />
      <p className="leading-snug">
        <b>En construcción:</b> lo que edites aquí se guarda, pero esta sección todavía no se
        muestra en el sitio público — el cliente no ha autorizado conectar este hueco al
        frontend todavía.
      </p>
    </div>
  );
}
