import { useState } from "react";
import { adminApiRequest } from "@/lib/adminAuth";
import { useToast } from "@/hooks/use-toast";
import { AgentButton } from "@/components/admin/AgentButton";
import { Loader2 } from "lucide-react";

const ASPECTS = [
  { id: "16:9", label: "Horizontal 16:9" },
  { id: "1:1", label: "Cuadrada 1:1" },
  { id: "9:16", label: "Vertical 9:16" },
];

/**
 * Botón de agente para generar una imagen con IA a demanda, con selector de formato.
 * `getPrompt` devuelve el tema (p. ej. el título de la noticia); `onGenerated` recibe la URL.
 */
export function ImageGenButton({
  getPrompt,
  onGenerated,
  label = "Generar imagen con IA",
  defaultAspect = "16:9",
}: {
  getPrompt: () => string;
  onGenerated: (url: string) => void;
  label?: string;
  defaultAspect?: string;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [aspect, setAspect] = useState(defaultAspect);

  const generate = async () => {
    const prompt = (getPrompt() || "").trim();
    if (!prompt) {
      toast({ title: "Falta el tema", description: "Escribe primero un título/tema para la imagen.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await adminApiRequest("POST", "/api/admin/generate-image", { prompt, aspect });
      const data = await res.json();
      if (!res.ok || !data.imageUrl) throw new Error(data.error || "No se pudo generar la imagen");
      onGenerated(data.imageUrl);
      toast({ title: "Imagen generada", description: `Motor: ${data.engine}` });
    } catch (e: any) {
      toast({ title: "Error al generar la imagen", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={aspect}
        onChange={(e) => setAspect(e.target.value)}
        className="h-9 rounded-none border border-input bg-background px-2 text-sm"
        data-testid="select-image-aspect"
      >
        {ASPECTS.map((a) => (
          <option key={a.id} value={a.id}>{a.label}</option>
        ))}
      </select>
      <AgentButton
        type="button"
        size="sm"
        onClick={generate}
        disabled={loading}
        icon={loading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : undefined}
        data-testid="button-generate-image"
      >
        {label}
      </AgentButton>
    </div>
  );
}
