import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Navigation, Save } from "lucide-react";
import type { NavigationConfiguration } from "@shared/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPageHelp } from "@/components/admin/AdminPageHelp";
import { ConfirmChangesDialog } from "@/components/admin/ConfirmChangesDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { adminApiRequest, useAdminAuth } from "@/lib/adminAuth";
import { moveAt, navigationChanges } from "./helpers";
import { NavigationPreview } from "./NavigationPreview";
import { NavigationSectionCard } from "./NavigationSectionCard";
import type { NavigationResponse } from "./types";

export default function AdminNavigationPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [draft, setDraft] = useState<NavigationConfiguration | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation("/admin/login");
  }, [authLoading, isAuthenticated, setLocation]);

  const query = useQuery<NavigationResponse>({
    queryKey: ["/api/admin/site-navigation", "v2"],
    queryFn: async () => {
      const response = await adminApiRequest("GET", "/api/admin/site-navigation");
      if (!response.ok) throw new Error("No se pudo cargar la navegación");
      return response.json();
    },
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (query.data) setDraft(structuredClone(query.data.configuration));
  }, [query.data]);

  const changes = useMemo(() => draft ? navigationChanges(query.data?.configuration, draft) : [], [draft, query.data]);
  const valid = Boolean(draft && draft.items.every((item) => (
    item.labelEs.trim() && item.labelEn.trim()
    && item.children.every((child) => child.labelEs.trim() && child.labelEn.trim())
  )) && draft.utilities.search.labelEs.trim() && draft.utilities.search.labelEn.trim()
    && draft.utilities.contact.labelEs.trim() && draft.utilities.contact.labelEn.trim());

  const save = async () => {
    if (!draft || !query.data) return;
    setSaving(true);
    try {
      const response = await adminApiRequest("PUT", "/api/admin/site-navigation", {
        version: 2,
        revision: query.data.revision,
        configuration: draft,
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "No se pudo guardar la navegación");
      await query.refetch();
      toast({ title: "Navegación guardada", description: "La jerarquía bilingüe quedó actualizada sin cambiar las rutas públicas." });
    } catch (error) {
      toast({ title: "No pudimos guardar la navegación", description: error instanceof Error ? error.message : "Recarga e inténtalo de nuevo.", variant: "destructive" });
    } finally {
      setSaving(false);
      setConfirmOpen(false);
    }
  };

  if (query.isError) {
    return <div className="min-h-screen bg-background p-8"><div className="mx-auto max-w-4xl rounded-md border p-8 text-center"><p>No se pudo cargar la navegación.</p><Button className="mt-4" onClick={() => query.refetch()}>Reintentar</Button></div></div>;
  }
  if (authLoading || query.isLoading || !draft || !query.data) {
    return <div className="min-h-screen bg-background p-8"><div className="mx-auto max-w-6xl space-y-5"><Skeleton className="h-12 w-72" /><Skeleton className="h-56 w-full" /><Skeleton className="h-72 w-full" /></div></div>;
  }

  const metadata = new Map(query.data.items.map((item) => [item.id, item]));
  return (
    <div className="min-h-screen bg-background" data-testid="admin-navigation-page">
      <main id="main-content" className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <AdminPageHeader
          title="Navegación y visibilidad"
          description="Administra la jerarquía bilingüe, el orden y la disponibilidad del menú público. Las rutas permanecen protegidas por el sistema."
          icon={Navigation}
          actions={<Button disabled={!changes.length || !valid || saving} onClick={() => setConfirmOpen(true)} data-testid="save-navigation"><Save className="mr-2 size-4" />Guardar cambios</Button>}
        />
        <AdminPageHelp pageId="site-navigation" manualSectionId="navegacion">
          Los estados Listo, Sin contenido, Oculto y Futuro se calculan con los datos publicados. Un destino sin contenido no puede activarse accidentalmente.
        </AdminPageHelp>
        <NavigationPreview configuration={draft} metadata={query.data.items} />
        <Card>
          <CardHeader><CardTitle className="font-serif text-xl">Utilidades obligatorias</CardTitle></CardHeader>
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
        <div className="flex justify-end"><Button size="lg" disabled={!changes.length || !valid || saving} onClick={() => setConfirmOpen(true)}>{saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}Guardar cambios</Button></div>
        <ConfirmChangesDialog open={confirmOpen} onOpenChange={setConfirmOpen} changes={changes} onConfirm={save} loading={saving} title="Confirmar navegación pública" />
      </main>
    </div>
  );
}
