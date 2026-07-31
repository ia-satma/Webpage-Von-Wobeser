import { useQuery } from "@tanstack/react-query";
import { adminApiRequest } from "@/lib/adminAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, DollarSign, ExternalLink } from "lucide-react";

const KIND_LABELS: Record<string, string> = {
  chat: "Agentes / texto",
  translation: "Traducciones",
  image: "Imágenes",
  tts: "Voz",
};

const money = (n: number) => `$${(Number(n) || 0).toFixed(2)} USD`;

/** Tarjeta de gasto ESTIMADO de la API de IA (OpenAI no expone el saldo por API key). */
export function AiUsageCard() {
  const { data, isLoading, isError } = useQuery<any>({
    queryKey: ["/api/admin/usage/summary"],
    queryFn: async () => {
      const res = await adminApiRequest("GET", "/api/admin/usage/summary");
      if (!res.ok) throw new Error("No se pudo cargar el gasto");
      return res.json();
    },
    refetchInterval: 60000,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Gasto estimado de IA</CardTitle>
        <DollarSign className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2" role="status" aria-label="Calculando gasto estimado">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-3 w-52" />
          </div>
        ) : isError ? (
          <div className="flex items-start gap-2 text-sm text-destructive" role="alert">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            No se pudo calcular el gasto en este momento.
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold tabular-nums">{money(data?.monthUsd)}</div>
            <p className="text-xs text-muted-foreground">
              este mes · {data?.totalCalls ?? 0} llamadas · histórico {money(data?.totalUsd)}
            </p>

            {Array.isArray(data?.byKind) && data.byKind.length > 0 && (
              <div className="mt-3 space-y-0.5">
                {data.byKind.map((k: any) => (
                  <div key={k.kind} className="flex justify-between text-xs text-muted-foreground">
                    <span>{KIND_LABELS[k.kind] || k.kind}</span>
                    <span className="tabular-nums">{money(k.costUsd)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <a
          href="https://platform.openai.com/usage"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Ver saldo real en OpenAI <ExternalLink className="h-3 w-3" />
        </a>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Estimado con precios conocidos del modelo. OpenAI no expone el saldo por API.
        </p>
      </CardContent>
    </Card>
  );
}
