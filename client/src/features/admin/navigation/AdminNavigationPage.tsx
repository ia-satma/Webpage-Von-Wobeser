import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Navigation, Save } from "lucide-react";
import type { NavigationConfiguration, NavigationPresetId } from "@shared/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPageHelp } from "@/components/admin/AdminPageHelp";
import { ConfirmChangesDialog, type Change } from "@/components/admin/ConfirmChangesDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { adminApiRequest, useAdminAuth } from "@/lib/adminAuth";
import { moveAt, navigationChanges } from "./helpers";
import { NavigationPresetSelector } from "./NavigationPresetSelector";
import { NavigationPreview } from "./NavigationPreview";
import { NavigationSectionCard } from "./NavigationSectionCard";
import type { NavigationResponse } from "./types";

type NavigationDrafts = Record<NavigationPresetId, NavigationConfiguration>;

export default function AdminNavigationPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<NavigationDrafts | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<NavigationPresetId | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activationTarget, setActivationTarget] = useState<NavigationPresetId | null>(null);
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation("/admin/login");
  }, [authLoading, isAuthenticated, setLocation]);

  const query = useQuery<NavigationResponse>({
    queryKey: ["/api/admin/site-navigation", "presets-v1"],
    queryFn: async () => {
      const response = await adminApiRequest("GET", "/api/admin/site-navigation");
      if (!response.ok) throw new Error("No se pudo cargar la navegación");
      return response.json();
    },
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!query.data) return;
    setDrafts({
      "definitive-2026": structuredClone(query.data.presets["definitive-2026"].configuration),
      "classic-vwys": structuredClone(query.data.presets["classic-vwys"].configuration),
    });
    setSelectedPreset((current) => current || query.data!.activePreset);
  }, [query.data]);

  const draft = drafts && selectedPreset ? drafts[selectedPreset] : null;
  const selectedMetadata = selectedPreset && query.data ? query.data.presets[selectedPreset] : null;
  const changes = useMemo(
    () => draft && selectedMetadata ? navigationChanges(selectedMetadata.configuration, draft) : [],
    [draft, selectedMetadata],
  );
  const valid = Boolean(draft && draft.items.every((item) => (
    item.labelEs.trim() && item.labelEn.trim()
    && item.children.every((child) => child.labelEs.trim() && child.labelEn.trim())
  )) && draft.utilities.search.labelEs.trim() && draft.utilities.search.labelEn.trim()
    && draft.utilities.contact.labelEs.trim() && draft.utilities.contact.labelEn.trim());

  const setDraft = (configuration: NavigationConfiguration) => {
    if (!selectedPreset || !drafts) return;
    setDrafts({ ...drafts, [selectedPreset]: configuration });
  };

  const save = async () => {
    if (!draft || !query.data || !selectedPreset || !selectedMetadata) return;
    setSaving(true);
    try {
      const response = await adminApiRequest("PUT", "/api/admin/site-navigation", {
        version: 2,
        preset: selectedPreset,
        revision: selectedMetadata.revision,
        configuration: draft,
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "No se pudo guardar la navegación");
      await query.refetch();
      toast({
        title: selectedPreset === query.data.activePreset ? "Navegación guardada" : "Respaldo actualizado",
        description: selectedPreset === query.data.activePreset
          ? "La navegación pública quedó actualizada sin cambiar sus rutas."
          : "El diseño alternativo quedó guardado y la navegación pública no cambió.",
      });
    } catch (error) {
      toast({ title: "No pudimos guardar la navegación", description: error instanceof Error ? error.message : "Recarga e inténtalo de nuevo.", variant: "destructive" });
    } finally {
      setSaving(false);
      setConfirmOpen(false);
    }
  };

  const activate = async () => {
    if (!activationTarget || !query.data) return;
    setActivating(true);
    try {
      const response = await adminApiRequest("PUT", "/api/admin/site-navigation/active-preset", {
        preset: activationTarget,
        stateRevision: query.data.stateRevision,
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "No se pudo activar el diseño");
      setSelectedPreset(activationTarget);
      await query.refetch();
      toast({ title: "Diseño activado", description: `${body.presets?.[activationTarget]?.name || "El menú elegido"} ya se usa en el sitio público.` });
    } catch (error) {
      toast({ title: "No pudimos activar el diseño", description: error instanceof Error ? error.message : "Recarga e inténtalo de nuevo.", variant: "destructive" });
    } finally {
      setActivating(false);
      setActivationTarget(null);
    }
  };

  if (query.isError) {
    return <div className="min-h-screen bg-background p-8"><div className="mx-auto max-w-4xl rounded-md border p-8 text-center"><p>No se pudo cargar la navegación.</p><Button className="mt-4" onClick={() => query.refetch()}>Reintentar</Button></div></div>;
  }
  if (authLoading || query.isLoading || !draft || !drafts || !selectedPreset || !selectedMetadata || !query.data) {
    return <div className="min-h-screen bg-background p-8"><div className="mx-auto max-w-6xl space-y-5"><Skeleton className="h-12 w-72" /><Skeleton className="h-56 w-full" /><Skeleton className="h-72 w-full" /></div></div>;
  }

  const metadata = new Map(selectedMetadata.items.map((item) => [item.id, item]));
  const selectedIsActive = query.data.activePreset === selectedPreset;
  const activationChanges: Change[] = activationTarget ? [{
    label: "Diseño público del menú",
    before: query.data.presets[query.data.activePreset].name,
    after: query.data.presets[activationTarget].name,
  }] : [];

  return (
    <div className="min-h-screen bg-background" data-testid="admin-navigation-page">
      <main id="main-content" className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <AdminPageHeader
          title="Navegación y visibilidad"
          description="Administra dos diseños reversibles del menú. Las rutas y el contenido permanecen protegidos por el sistema."
          icon={Navigation}
          actions={<Button disabled={!changes.length || !valid || saving} onClick={() => setConfirmOpen(true)} data-testid="save-navigation"><Save className="mr-2 size-4" />{selectedIsActive ? "Guardar cambios" : "Guardar respaldo"}</Button>}
        />
        <AdminPageHelp pageId="site-navigation" manualSectionId="navegacion">
          El diseño marcado como Activo es el único visible en el sitio. Puedes editar el respaldo sin publicarlo y activarlo después con una confirmación explícita.
        </AdminPageHelp>
        <NavigationPresetSelector
          activePreset={query.data.activePreset}
          selectedPreset={selectedPreset}
          presets={query.data.presets}
          activating={activating}
          onSelect={setSelectedPreset}
          onActivate={setActivationTarget}
        />
        <NavigationPreview configuration={draft} metadata={selectedMetadata.items} preset={selectedPreset} />
        <Card>
          <CardHeader><CardTitle className="text-xl">Utilidades obligatorias</CardTitle></CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <div className="grid gap-4 rounded-md border p-4">
              <p className="text-sm font-medium">Buscar</p>
              <div className="space-y-2"><Label htmlFor="search-es">Español</Label><Input id="search-es" value={draft.utilities.search.labelEs} maxLength={120} onChange={(event) => setDraft({ ...draft, utilities: { ...draft.utilities, search: { ...draft.utilities.search, labelEs: event.target.value } } })} /></div>
              <div className="space-y-2"><Label htmlFor="search-en">Inglés</Label><Input id="search-en" value={draft.utilities.search.labelEn} maxLength={120} onChange={(event) => setDraft({ ...draft, utilities: { ...draft.utilities, search: { ...draft.utilities.search, labelEn: event.target.value } } })} /></div>
            </div>
            <div className="grid gap-4 rounded-md border p-4">
              <p className="text-sm font-medium">Contacto</p>
              <div className="space-y-2"><Label htmlFor="contact-es">Español</Label><Input id="contact-es" value={draft.utilities.contact.labelEs} maxLength={120} onChange={(event) => setDraft({ ...draft, utilities: { ...draft.utilities, contact: { ...draft.utilities.contact, labelEs: event.target.value } } })} /></div>
              <div className="space-y-2"><Label htmlFor="contact-en">Inglés</Label><Input id="contact-en" value={draft.utilities.contact.labelEn} maxLength={120} onChange={(event) => setDraft({ ...draft, utilities: { ...draft.utilities, contact: { ...draft.utilities.contact, labelEn: event.target.value } } })} /></div>
            </div>
          </CardContent>
        </Card>
        <div className="space-y-5">
          {draft.items.map((item, index) => (
            <NavigationSectionCard key={item.id} item={item} meta={metadata.get(item.id)!} index={index} total={draft.items.length}
              onChange={(next) => setDraft({ ...draft, items: draft.items.map((candidate) => candidate.id === item.id ? next : candidate) })}
              onMove={(direction) => setDraft({ ...draft, items: moveAt(draft.items, index, direction) })} />
          ))}
        </div>
        <div className="flex justify-end"><Button size="lg" disabled={!changes.length || !valid || saving} onClick={() => setConfirmOpen(true)}>{saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}{selectedIsActive ? "Guardar cambios" : "Guardar respaldo"}</Button></div>
        <ConfirmChangesDialog open={confirmOpen} onOpenChange={setConfirmOpen} changes={changes} onConfirm={save} loading={saving} title={`Confirmar cambios — ${selectedMetadata.name}`} />
        <ConfirmChangesDialog open={Boolean(activationTarget)} onOpenChange={(open) => !open && setActivationTarget(null)} changes={activationChanges} onConfirm={activate} loading={activating} title="Activar diseño de navegación" />
      </main>
    </div>
  );
}
