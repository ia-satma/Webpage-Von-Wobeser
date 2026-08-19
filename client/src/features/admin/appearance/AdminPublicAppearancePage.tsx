import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Check, Loader2, Paintbrush, PanelBottom, Search, RefreshCw } from "lucide-react";
import {
  PUBLIC_APPEARANCE_PRESET_METADATA,
  type AttorneyDirectoryPresetId,
  type FooterPresetId,
} from "@shared/publicAppearance";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPageHelp } from "@/components/admin/AdminPageHelp";
import { ConfirmChangesDialog, type Change } from "@/components/admin/ConfirmChangesDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { adminApiRequest, useAdminAuth } from "@/lib/adminAuth";

type AppearanceTarget = "footer" | "attorney-directory";
type AppearanceResponse = {
  footerPreset: FooterPresetId;
  attorneyDirectoryPreset: AttorneyDirectoryPresetId;
  stateRevision: string;
  presets: typeof PUBLIC_APPEARANCE_PRESET_METADATA;
};

type PendingActivation = {
  target: AppearanceTarget;
  preset: FooterPresetId | AttorneyDirectoryPresetId;
};

const targetCopy = {
  footer: {
    title: "Pie de página",
    description: "Elige entre el pie clásico y el pie central actual. Los datos, enlaces legales, ESR y acceso administrativo se conservan.",
    icon: PanelBottom,
  },
  "attorney-directory": {
    title: "Buscador de abogados",
    description: "Elige solo la composición de los filtros. El orden editorial, los resultados, las URL y la búsqueda sin recarga permanecen iguales.",
    icon: Search,
  },
} as const;

function AppearancePresetCards({
  target,
  activePreset,
  metadata,
  pending,
  onActivate,
}: {
  target: AppearanceTarget;
  activePreset: FooterPresetId | AttorneyDirectoryPresetId;
  metadata: Record<string, { name: string; description: string }>;
  pending: boolean;
  onActivate: (target: AppearanceTarget, preset: FooterPresetId | AttorneyDirectoryPresetId) => void;
}) {
  const { title, description, icon: Icon } = targetCopy[target];
  return (
    <Card data-testid={`appearance-${target}`}>
      <CardHeader className="gap-2 border-b bg-muted/20">
        <CardTitle className="flex items-center gap-2 text-xl"><Icon className="size-5 text-primary" />{title}</CardTitle>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="grid gap-0 p-0 md:grid-cols-2 md:divide-x">
        {Object.entries(metadata).map(([presetId, preset]) => {
          const active = presetId === activePreset;
          return (
            <section key={presetId} className={`grid min-h-48 content-between gap-6 border-t p-6 first:border-t-0 md:border-t-0 ${active ? "bg-[#faf7f7]" : "bg-background"}`}>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold tracking-tight">{preset.name}</h3>
                  {active ? <span className="inline-flex items-center gap-1 rounded-full border border-emerald-700/20 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800"><Check className="size-3" />Activo</span> : <span className="rounded-full border px-2.5 py-1 text-[11px] font-medium text-muted-foreground">Alternativa</span>}
                </div>
                <p className="max-w-[58ch] text-sm leading-relaxed text-muted-foreground">{preset.description}</p>
              </div>
              {active ? <p className="text-xs text-muted-foreground">Este es el diseño que ve actualmente el sitio público.</p> : <Button type="button" variant="outline" disabled={pending} onClick={() => onActivate(target, presetId as FooterPresetId | AttorneyDirectoryPresetId)} data-testid={`activate-${target}-${presetId}`}><RefreshCw className={`mr-2 size-4 ${pending ? "animate-spin" : ""}`} />Activar este diseño</Button>}
            </section>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default function AdminPublicAppearancePage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [pending, setPending] = useState<PendingActivation | null>(null);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation("/admin/login");
  }, [authLoading, isAuthenticated, setLocation]);

  const query = useQuery<AppearanceResponse>({
    queryKey: ["/api/admin/public-appearance", "presets-v1"],
    queryFn: async () => {
      const response = await adminApiRequest("GET", "/api/admin/public-appearance");
      if (!response.ok) throw new Error("No se pudieron cargar los diseños públicos");
      return response.json();
    },
    enabled: isAuthenticated,
  });

  const changes = useMemo<Change[]>(() => {
    if (!pending || !query.data) return [];
    const isFooter = pending.target === "footer";
    const presets = isFooter ? query.data.presets.footer : query.data.presets.attorneyDirectory;
    const active = isFooter ? query.data.footerPreset : query.data.attorneyDirectoryPreset;
    return [{
      label: isFooter ? "Diseño público del pie" : "Diseño público del buscador",
      before: presets[active as keyof typeof presets].name,
      after: presets[pending.preset as keyof typeof presets].name,
    }];
  }, [pending, query.data]);

  const activate = async () => {
    if (!pending || !query.data) return;
    setActivating(true);
    try {
      const response = await adminApiRequest("PUT", "/api/admin/public-appearance/active-preset", {
        target: pending.target,
        preset: pending.preset,
        stateRevision: query.data.stateRevision,
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "No se pudo activar el diseño");
      await query.refetch();
      toast({ title: "Diseño activado", description: "El sitio público ya muestra la alternativa elegida." });
    } catch (error) {
      toast({ title: "No pudimos activar el diseño", description: error instanceof Error ? error.message : "Recarga e inténtalo de nuevo.", variant: "destructive" });
    } finally {
      setActivating(false);
      setPending(null);
    }
  };

  if (query.isError) {
    return <div className="min-h-screen bg-background p-8"><div className="mx-auto max-w-4xl rounded-md border p-8 text-center"><p>No se pudieron cargar los diseños públicos.</p><Button className="mt-4" onClick={() => query.refetch()}>Reintentar</Button></div></div>;
  }
  if (authLoading || query.isLoading || !query.data) {
    return <div className="min-h-screen bg-background p-8"><div className="mx-auto max-w-6xl space-y-5"><Skeleton className="h-12 w-72" /><Skeleton className="h-64 w-full" /><Skeleton className="h-64 w-full" /></div></div>;
  }

  return (
    <div className="min-h-screen bg-background" data-testid="admin-public-appearance-page">
      <main id="main-content" className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <AdminPageHeader title="Diseños públicos" description="Cambia de forma reversible el pie de página y el buscador de abogados, sin alterar el contenido ni las rutas." icon={Paintbrush} />
        <AdminPageHelp pageId="public-appearance" manualSectionId="disenos-publicos">Cada activación es independiente: puedes combinar cualquier pie con cualquier buscador. La aplicación conserva la seguridad, accesibilidad y datos actuales en ambas alternativas.</AdminPageHelp>
        <AppearancePresetCards target="footer" activePreset={query.data.footerPreset} metadata={query.data.presets.footer} pending={activating} onActivate={(target, preset) => setPending({ target, preset })} />
        <AppearancePresetCards target="attorney-directory" activePreset={query.data.attorneyDirectoryPreset} metadata={query.data.presets.attorneyDirectory} pending={activating} onActivate={(target, preset) => setPending({ target, preset })} />
        <ConfirmChangesDialog open={Boolean(pending)} onOpenChange={(open) => !open && setPending(null)} changes={changes} onConfirm={activate} loading={activating} title="Activar diseño público" />
      </main>
    </div>
  );
}
