import { useEffect, useState } from "react";
import { AdminPageHelp } from "@/components/admin/AdminPageHelp";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAdminAuth, adminApiRequest } from "@/lib/adminAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Globe2, Plus, Trash2, Loader2, Pencil, Save, X } from "lucide-react";
import { TranslateButton } from "@/components/admin/TranslateButton";

type Desk = {
  id: string;
  name: string; nameEs: string; slug: string;
  country?: string | null; countryEs?: string | null; flagEmoji?: string | null;
  description: string; descriptionEs: string;
  fullDescription?: string | null; fullDescriptionEs?: string | null;
  imageUrl?: string | null; contactEmail?: string | null;
  published?: boolean | null; order?: number | null;
};

const EMPTY = {
  name: "", nameEs: "", slug: "",
  country: "", countryEs: "", flagEmoji: "",
  description: "", descriptionEs: "",
  fullDescription: "", fullDescriptionEs: "",
  imageUrl: "", contactEmail: "",
  published: true, order: 0,
};

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export default function AdminDesks() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY });
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation("/admin/login");
  }, [authLoading, isAuthenticated, setLocation]);

  const { data: items = [], isLoading, refetch } = useQuery<Desk[]>({
    queryKey: ["/api/admin/desks"],
    queryFn: async () => (await adminApiRequest("GET", "/api/admin/desks")).json(),
    enabled: isAuthenticated,
  });

  const set = (k: keyof typeof EMPTY, v: string | boolean | number) => setForm((f) => ({ ...f, [k]: v }));

  const edit = (d: Desk) => {
    setEditingId(d.id);
    setForm({
      name: d.name || "", nameEs: d.nameEs || "", slug: d.slug || "",
      country: d.country || "", countryEs: d.countryEs || "", flagEmoji: d.flagEmoji || "",
      description: d.description || "", descriptionEs: d.descriptionEs || "",
      fullDescription: d.fullDescription || "", fullDescriptionEs: d.fullDescriptionEs || "",
      imageUrl: d.imageUrl || "", contactEmail: d.contactEmail || "",
      published: d.published !== false, order: d.order ?? 0,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => { setEditingId(null); setForm({ ...EMPTY }); };

  const save = async () => {
    if (!form.name || !form.nameEs || !form.slug || !form.description || !form.descriptionEs) {
      toast({ title: "Faltan datos", description: "Nombre (ES/EN), identificador y descripción corta (ES/EN) son obligatorios.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const payload = { ...form, order: Number(form.order) || 0 };
      const res = editingId
        ? await adminApiRequest("PUT", `/api/admin/desks/${editingId}`, payload)
        : await adminApiRequest("POST", "/api/admin/desks", payload);
      if (res.ok) {
        toast({ title: editingId ? "Desk actualizado" : "Desk agregado" });
        setForm({ ...EMPTY });
        setEditingId(null);
        refetch();
      } else {
        toast({ title: editingId ? "Error al actualizar" : "Error al agregar", variant: "destructive" });
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    const res = await adminApiRequest("DELETE", `/api/admin/desks/${id}`);
    if (res.ok) { toast({ title: "Eliminado" }); refetch(); }
    else toast({ title: "Error al eliminar", variant: "destructive" });
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <AdminPageHeader title="Áreas especializadas (desks)" icon={Globe2} />

        <AdminPageHelp pageId="desks" manualSectionId="desks">
          Los "desks" son grupos de trabajo especializados que cruzan varias áreas de práctica (ej. el Desk Alemán, dedicado a clientes/empresas de un país o sector específico).
        </AdminPageHelp>

        <p className="text-muted-foreground text-sm">
          Aparecen en Capacidades → Desks del sitio público. Lo que agregues o edites aquí se refleja de inmediato, en español e inglés.
        </p>

        {/* Alta / edición */}
        <Card>
          <CardHeader><CardTitle className="text-base">{editingId ? "Editar desk" : "Agregar desk"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-end">
              <TranslateButton
                getSource={() => ({ name: form.nameEs, country: form.countryEs, description: form.descriptionEs, fullDescription: form.fullDescriptionEs })}
                onApply={(f) => {
                  if (f.name != null) set("name", f.name);
                  if (f.country != null) set("country", f.country);
                  if (f.description != null) set("description", f.description);
                  if (f.fullDescription != null) set("fullDescription", f.fullDescription);
                }}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Nombre (inglés) *</Label>
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="German Desk" data-testid="input-name" />
              </div>
              <div className="space-y-1">
                <Label>Nombre (español) *</Label>
                <Input value={form.nameEs} onChange={(e) => set("nameEs", e.target.value)} placeholder="Desk Alemán" data-testid="input-nameEs" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Identificador URL (slug) *</Label>
                <div className="flex gap-2">
                  <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="german-desk" className="font-mono text-sm" data-testid="input-slug" />
                  <Button type="button" variant="outline" onClick={() => set("slug", slugify(form.name))} disabled={!form.name}>
                    Generar del nombre
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Aparece en /desk/{form.slug || "..."}</p>
              </div>
              <div className="space-y-1">
                <Label>País (inglés)</Label>
                <Input value={form.country} onChange={(e) => set("country", e.target.value)} placeholder="Germany" data-testid="input-country" />
              </div>
              <div className="space-y-1">
                <Label>País (español)</Label>
                <Input value={form.countryEs} onChange={(e) => set("countryEs", e.target.value)} placeholder="Alemania" data-testid="input-countryEs" />
              </div>
              <div className="space-y-1">
                <Label>Emoji de bandera</Label>
                <Input value={form.flagEmoji} onChange={(e) => set("flagEmoji", e.target.value)} placeholder="🇩🇪" data-testid="input-flagEmoji" />
              </div>
              <div className="space-y-1">
                <Label>Correo de contacto</Label>
                <Input value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} placeholder="desk@vwys.com.mx" data-testid="input-contactEmail" />
              </div>
              <div className="space-y-1">
                <Label>Descripción corta (inglés) *</Label>
                <Textarea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} data-testid="input-description" />
              </div>
              <div className="space-y-1">
                <Label>Descripción corta (español) *</Label>
                <Textarea rows={2} value={form.descriptionEs} onChange={(e) => set("descriptionEs", e.target.value)} data-testid="input-descriptionEs" />
              </div>
              <div className="space-y-1">
                <Label>Descripción completa (inglés)</Label>
                <Textarea rows={6} value={form.fullDescription} onChange={(e) => set("fullDescription", e.target.value)} placeholder="Texto que se muestra en la página individual del desk." data-testid="input-fullDescription" />
              </div>
              <div className="space-y-1">
                <Label>Descripción completa (español)</Label>
                <Textarea rows={6} value={form.fullDescriptionEs} onChange={(e) => set("fullDescriptionEs", e.target.value)} data-testid="input-fullDescriptionEs" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Imagen</Label>
                <ImageUpload value={form.imageUrl} onChange={(v) => set("imageUrl", v)} />
              </div>
              <div className="space-y-1">
                <Label>Orden</Label>
                <Input type="number" value={form.order} onChange={(e) => set("order", e.target.value)} data-testid="input-order" />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={form.published} onCheckedChange={(v) => set("published", v)} data-testid="switch-published" />
                <Label>Publicado</Label>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={save} disabled={busy} data-testid="button-save">
                {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : editingId ? <Save className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                {editingId ? "Guardar cambios" : "Agregar"}
              </Button>
              {editingId && (
                <Button variant="outline" onClick={cancelEdit} disabled={busy} data-testid="button-cancel-edit">
                  <X className="h-4 w-4 mr-1" /> Cancelar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lista */}
        <Card>
          <CardHeader><CardTitle className="text-base">Desks actuales ({items.length})</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</div>
            ) : items.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aún no hay desks. Agrega el primero arriba.</p>
            ) : (
              <ul className="divide-y">
                {items.map((d) => (
                  <li key={d.id} className="py-3 flex items-center justify-between gap-4" data-testid={`row-${d.id}`}>
                    <div>
                      <p className="font-medium">{d.flagEmoji ? `${d.flagEmoji} ` : ""}{d.nameEs}{d.published === false ? " (oculto)" : ""}</p>
                      <p className="text-sm text-muted-foreground">/desk/{d.slug}{d.countryEs ? ` · ${d.countryEs}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => edit(d)} data-testid={`edit-${d.id}`} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => remove(d.id)} data-testid={`del-${d.id}`} title="Eliminar">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
