import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Eye, EyeOff, Languages, Loader2, Navigation, Save, Search } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPageHelp } from "@/components/admin/AdminPageHelp";
import { ConfirmChangesDialog, fmtValue, type Change } from "@/components/admin/ConfirmChangesDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { adminApiRequest, useAdminAuth } from "@/lib/adminAuth";

type NavigationId = "firm" | "attorneys" | "practices" | "industries" | "publications" | "careers" | "contact";

type NavigationItem = {
  id: NavigationId;
  labelEn: string;
  labelEs: string;
  visible: boolean;
  pathEs: string;
  pathEn: string;
};

type NavigationResponse = {
  items: NavigationItem[];
  fixed: {
    homeViaLogo: boolean;
    search: boolean;
    language: boolean;
    searchLabelEn: string;
    searchLabelEs: string;
  };
};

const ITEM_NAMES: Record<NavigationId, string> = {
  firm: "Nuestra Firma",
  attorneys: "Abogados",
  practices: "Prácticas",
  industries: "Grupos de práctica por industria",
  publications: "Publicaciones",
  careers: "Carrera en VWyS",
  contact: "Contacto",
};

export default function AdminNavigation() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [draft, setDraft] = useState<NavigationItem[]>([]);
  const [searchDraft, setSearchDraft] = useState({ labelEn: "", labelEs: "" });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation("/admin/login");
  }, [authLoading, isAuthenticated, setLocation]);

  const { data, isLoading, refetch } = useQuery<NavigationResponse>({
    queryKey: ["/api/admin/site-navigation"],
    queryFn: async () => {
      const response = await adminApiRequest("GET", "/api/admin/site-navigation");
      if (!response.ok) throw new Error("No se pudo cargar la navegación");
      return response.json();
    },
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (data) {
      setDraft(data.items.map((item) => ({ ...item })));
      setSearchDraft({ labelEn: data.fixed.searchLabelEn, labelEs: data.fixed.searchLabelEs });
    }
  }, [data]);

  const changes = useMemo<Change[]>(() => {
    if (!data) return [];
    const original = new Map(data.items.map((item) => [item.id, item]));
    const next: Change[] = [];
    for (const item of draft) {
      const before = original.get(item.id);
      if (!before) continue;
      if (before.visible !== item.visible) {
        next.push({
          label: `${ITEM_NAMES[item.id]} — visibilidad`,
          before: before.visible ? "Visible" : "Oculta",
          after: item.visible ? "Visible" : "Oculta",
        });
      }
      if (before.labelEs !== item.labelEs) next.push({ label: `${ITEM_NAMES[item.id]} — español`, before: fmtValue(before.labelEs), after: fmtValue(item.labelEs) });
      if (before.labelEn !== item.labelEn) next.push({ label: `${ITEM_NAMES[item.id]} — inglés`, before: fmtValue(before.labelEn), after: fmtValue(item.labelEn) });
    }
    if (data.fixed.searchLabelEs !== searchDraft.labelEs) next.push({ label: "Búsqueda — español", before: fmtValue(data.fixed.searchLabelEs), after: fmtValue(searchDraft.labelEs) });
    if (data.fixed.searchLabelEn !== searchDraft.labelEn) next.push({ label: "Búsqueda — inglés", before: fmtValue(data.fixed.searchLabelEn), after: fmtValue(searchDraft.labelEn) });
    return next;
  }, [data, draft, searchDraft]);

  const update = (id: NavigationId, patch: Partial<NavigationItem>) => {
    setDraft((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
  };

  const save = async () => {
    setSaving(true);
    try {
      const response = await adminApiRequest("PUT", "/api/admin/site-navigation", {
        searchLabelEn: searchDraft.labelEn,
        searchLabelEs: searchDraft.labelEs,
        items: draft.map(({ id, labelEn, labelEs, visible }) => ({ id, labelEn, labelEs, visible })),
      });
      if (!response.ok) throw new Error("save");
      await refetch();
      toast({ title: "Navegación guardada", description: "El menú público ya refleja los cambios en español e inglés." });
    } catch {
      toast({ title: "No pudimos guardar la navegación", description: "Revisa los textos e inténtalo de nuevo.", variant: "destructive" });
    } finally {
      setSaving(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main id="main-content" className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        <AdminPageHeader
          title="Navegación y visibilidad"
          description="Edita los nombres del menú público y decide qué secciones aparecen en el encabezado."
          icon={Navigation}
          actions={(
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild><a href="/" target="_blank" rel="noreferrer">Vista ES <ArrowUpRight className="h-4 w-4" /></a></Button>
              <Button variant="outline" size="sm" asChild><a href="/?lang=en" target="_blank" rel="noreferrer">Vista EN <ArrowUpRight className="h-4 w-4" /></a></Button>
            </div>
          )}
        />

        <AdminPageHelp pageId="site-navigation" manualSectionId="navegacion">
          Un interruptor controla ambos idiomas. Si ocultas una opción, su página y sus datos se conservan: únicamente deja de aparecer en el menú.
        </AdminPageHelp>

        <Card>
          <CardHeader>
            <CardTitle>Opciones del menú público</CardTitle>
            <CardDescription>Los cambios se aplican a escritorio y móvil después de confirmar y guardar.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando navegación…</div>
            ) : (
              <div className="divide-y divide-border">
                {draft.map((item) => (
                  <section key={item.id} className="grid gap-5 p-5 lg:grid-cols-[minmax(12rem,0.8fr)_minmax(0,1.5fr)_auto] lg:items-start" data-testid={`navigation-item-${item.id}`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {item.visible ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                        <h2 className="font-semibold text-foreground">{ITEM_NAMES[item.id]}</h2>
                      </div>
                      <p className="text-xs text-muted-foreground break-all">{item.pathEs}</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`nav-${item.id}-es`}>Español</Label>
                        <Input id={`nav-${item.id}-es`} value={item.labelEs} onChange={(event) => update(item.id, { labelEs: event.target.value })} maxLength={120} data-testid={`input-navigation-${item.id}-es`} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`nav-${item.id}-en`}>Inglés</Label>
                        <Input id={`nav-${item.id}-en`} value={item.labelEn} onChange={(event) => update(item.id, { labelEn: event.target.value })} maxLength={120} data-testid={`input-navigation-${item.id}-en`} />
                      </div>
                    </div>

                    <div className="flex min-w-44 items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2 lg:mt-6">
                      <Label htmlFor={`nav-${item.id}-visible`} className="cursor-pointer text-sm">{item.visible ? "Visible en el menú" : "Oculta del menú"}</Label>
                      <Switch id={`nav-${item.id}-visible`} checked={item.visible} onCheckedChange={(visible) => update(item.id, { visible })} aria-label={`Mostrar ${ITEM_NAMES[item.id]} en el menú`} data-testid={`switch-navigation-${item.id}`} />
                    </div>
                  </section>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-base">Controles permanentes</CardTitle>
            <CardDescription>Inicio, búsqueda e idioma no se pueden ocultar.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 pt-0 sm:grid-cols-3">
            <div className="flex items-center gap-3"><Navigation className="h-4 w-4 text-primary" /><div><p className="text-sm font-medium">Inicio</p><p className="text-xs text-muted-foreground">Siempre disponible desde el logo</p></div></div>
            <div className="space-y-3 sm:col-span-1">
              <div className="flex items-center gap-3"><Search className="h-4 w-4 text-primary" /><div><p className="text-sm font-medium">Búsqueda</p><p className="text-xs text-muted-foreground">Siempre visible; etiquetas para lectores de pantalla</p></div></div>
              <div className="grid gap-2">
                <Label htmlFor="nav-search-es" className="text-xs">Etiqueta en español</Label>
                <Input id="nav-search-es" value={searchDraft.labelEs} onChange={(event) => setSearchDraft((current) => ({ ...current, labelEs: event.target.value }))} maxLength={120} data-testid="input-navigation-search-es" />
                <Label htmlFor="nav-search-en" className="text-xs">Etiqueta en inglés</Label>
                <Input id="nav-search-en" value={searchDraft.labelEn} onChange={(event) => setSearchDraft((current) => ({ ...current, labelEn: event.target.value }))} maxLength={120} data-testid="input-navigation-search-en" />
              </div>
            </div>
            <div className="flex items-center gap-3"><Languages className="h-4 w-4 text-primary" /><div><p className="text-sm font-medium">Idioma</p><p className="text-xs text-muted-foreground">Siempre visible</p></div></div>
          </CardContent>
        </Card>

        <div className="sticky bottom-4 flex justify-end rounded-xl border border-border bg-background/95 p-3 shadow-lg backdrop-blur">
          <Button onClick={() => setConfirmOpen(true)} disabled={saving || isLoading || changes.length === 0 || !searchDraft.labelEs.trim() || !searchDraft.labelEn.trim() || draft.some((item) => !item.labelEs.trim() || !item.labelEn.trim())} data-testid="button-save-navigation">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar cambios{changes.length ? ` (${changes.length})` : ""}
          </Button>
        </div>
      </main>

      <ConfirmChangesDialog open={confirmOpen} onOpenChange={setConfirmOpen} changes={changes} onConfirm={save} loading={saving} title="Confirmar navegación pública" />
    </div>
  );
}
