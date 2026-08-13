import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AgentButton } from "@/components/admin/AgentButton";
import { Languages, Loader2 } from "lucide-react";
import { adminApiRequest } from "@/lib/adminAuth";
import { useToast } from "@/hooks/use-toast";

/**
 * Botón reutilizable "Traducir al inglés con IA".
 *
 * Reúne los campos en español (via `getSource`), los manda a
 * `POST /api/admin/translate-fields` (que reusa el agente traductor) y aplica el
 * resultado en inglés (via `onApply`) para que el usuario lo revise antes de guardar.
 * NO persiste nada: solo rellena los campos en inglés del formulario.
 *
 * Contrato: las CLAVES de `getSource()` son los nombres de los campos en INGLÉS, y los
 * valores son el texto en español a traducir. `onApply` recibe el mismo mapa de claves
 * con el texto ya traducido. Así cada formulario decide su propio mapeo.
 */
export function TranslateButton({
  getSource,
  onApply,
  label = "Traducir al inglés con IA",
  size = "sm",
  from = "es",
  to = "en",
  className,
}: {
  getSource: () => Record<string, string | null | undefined>;
  onApply: (fields: Record<string, string>) => void;
  label?: string;
  size?: "sm" | "default";
  from?: string;
  to?: string;
  className?: string;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const run = async () => {
    const raw = getSource();
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v === "string" && v.trim()) clean[k] = v;
    }
    if (Object.keys(clean).length === 0) {
      toast({ title: "Nada que traducir", description: "Primero escribe el contenido en español.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await adminApiRequest("POST", "/api/admin/translate-fields", { fields: clean, from, to });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        toast({ title: "No se pudo traducir", description: (e as any)?.error || "Intenta de nuevo en un momento.", variant: "destructive" });
        return;
      }
      const data = await res.json();
      onApply((data?.fields || {}) as Record<string, string>);
      toast({ title: "Traducción lista", description: "Revisa el inglés y guarda cuando estés conforme." });
    } catch {
      toast({
        title: "No se pudo traducir",
        description: "No fue posible conectar con el servicio de traducción. Inténtalo nuevamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AgentButton type="button" size={size} onClick={run} disabled={loading} className={className} icon={loading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Languages className="h-4 w-4 mr-1.5" />} data-testid="button-translate-en">
      {label}
    </AgentButton>
  );
}
