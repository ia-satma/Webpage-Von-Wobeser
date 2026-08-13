import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Type } from "lucide-react";
import { adminApiRequest, readAdminJson } from "@/lib/adminAuth";
import { useToast } from "@/hooks/use-toast";
import type { TypographyFamily, TypographyRole } from "@shared/editorialTypography";

type Props = {
  entityType: string;
  entityId?: string | null;
  field: string;
  language: "en" | "es";
  role: TypographyRole;
  /** Site config uses its own permission-scoped endpoint. */
  endpoint?: string;
  compact?: boolean;
};

const labels: Record<TypographyFamily, string> = {
  auto: "Automático",
  gelasio: "Gelasio editorial",
  inter: "Inter de cuerpo",
};

/** Selector reutilizable para campos cortos públicos. Los nuevos registros se
 * guardan primero y luego pueden recibir una preferencia explícita. */
export function TypographyFieldControl({ entityType, entityId, field, language, role, endpoint, compact = false }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const url = endpoint || (entityId ? `/api/admin/editorial-typography/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}` : "");
  const key = `${field}:${language}`;
  const query = useQuery<{ styles: Record<string, TypographyFamily> }>({
    queryKey: ["editorial-typography", entityType, entityId, endpoint],
    queryFn: async () => readAdminJson(await adminApiRequest("GET", url)),
    enabled: Boolean(url),
    staleTime: 30_000,
  });
  const mutation = useMutation({
    mutationFn: async (family: TypographyFamily) => readAdminJson<{ styles: Record<string, TypographyFamily> }>(
      await adminApiRequest("PUT", url, { styles: [{ field, language, family }] }),
    ),
    onSuccess: (data) => queryClient.setQueryData(["editorial-typography", entityType, entityId, endpoint], data),
    onError: (error: Error) => toast({ variant: "destructive", title: "No se pudo guardar la tipografía", description: error.message }),
  });
  const value = query.data?.styles?.[key] || "auto";
  const recommended = role === "editorial" ? "Gelasio" : "Inter";

  if (!entityId && !endpoint) {
    return <p className="text-xs text-muted-foreground">Guarda este registro antes de elegir una tipografía explícita.</p>;
  }

  return (
    <div className={compact ? "flex items-center gap-2" : "flex flex-wrap items-center gap-2 pt-1"}>
      <Type className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
      <label className="text-xs text-muted-foreground" htmlFor={`font-${entityType}-${entityId || field}-${field}-${language}`}>
        Tipografía
      </label>
      <select
        id={`font-${entityType}-${entityId || field}-${field}-${language}`}
        value={value}
        disabled={query.isLoading || mutation.isPending}
        onChange={(event) => mutation.mutate(event.target.value as TypographyFamily)}
        className="h-8 rounded border border-input bg-background px-2 text-xs text-foreground"
        data-testid={`font-${field}-${language}`}
      >
        {(Object.keys(labels) as TypographyFamily[]).map((family) => <option value={family} key={family}>{labels[family]}</option>)}
      </select>
      {!compact && <span className="text-xs text-muted-foreground">Recomendado: {recommended}.</span>}
    </div>
  );
}
