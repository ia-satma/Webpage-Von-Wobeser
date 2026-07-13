import { useEffect, useState } from "react";
import { AdminPageHelp } from "@/components/admin/AdminPageHelp";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAdminAuth, adminApiRequest } from "@/lib/adminAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Award, Plus, Trash2, Loader2, Pencil, Save, X } from "lucide-react";
import { TranslateButton } from "@/components/admin/TranslateButton";

type Ranking = {
  id: string;
  name: string; nameEs: string;
  publication: string; year: number;
  category?: string | null; logoUrl?: string | null; externalUrl?: string | null;
};

const EMPTY = { name: "", nameEs: "", publication: "", year: new Date().getFullYear(), category: "", logoUrl: "", externalUrl: "" };

export default function AdminRecognitions() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY });
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // null = alta; id = edición

  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation("/admin/login");
  }, [authLoading, isAuthenticated, setLocation]);

  const { data: items = [], isLoading, refetch } = useQuery<Ranking[]>({
    queryKey: ["/api/admin/rankings"],
    queryFn: async () => (await adminApiRequest("GET", "/api/admin/rankings")).json(),
    enabled: isAuthenticated,
  });

  const set = (k: keyof typeof EMPTY, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Cargar un reconocimiento existente en el formulario para editarlo.
  const edit = (r: Ranking) => {
    setEditingId(r.id);
    setForm({
      name: r.name || "", nameEs: r.nameEs || "", publication: r.publication || "",
      year: r.year || new Date().getFullYear(), category: r.category || "",
      logoUrl: r.logoUrl || "", externalUrl: r.externalUrl || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => { setEditingId(null); setForm({ ...EMPTY }); };

  const save = async () => {
    if (!form.name || !form.nameEs || !form.publication) {
      toast({ title: "Faltan datos", description: "Nombre (ES/EN) y publicación son obligatorios.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const payload = { ...form, year: Number(form.year) || new Date().getFullYear() };
      const res = editingId
        ? await adminApiRequest("PUT", `/api/admin/rankings/${editingId}`, payload)
        : await adminApiRequest("POST", "/api/admin/rankings", payload);
      if (res.ok) {
        toast({ title: editingId ? "Reconocimiento actualizado" : "Reconocimiento agregado" });
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
    const res = await adminApiRequest("DELETE", `/api/admin/rankings/${id}`);
    if (res.ok) { toast({ title: "Eliminado" }); refetch(); }
    else toast({ title: "Error al eliminar", variant: "destructive" });
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <AdminPageHeader title="Reconocimientos" icon={Award} />

        <AdminPageHelp pageId="reconocimientos" manualSectionId="reconocimientos">Registra los premios y rankings de la firma (Chambers, Legal 500…) con su logo y año.</AdminPageHelp>

        <p className="text-muted-foreground text-sm">
          Premios y rankings de la firma (Chambers, Legal 500, etc.). Lo que agregues aquí queda guardado en el sistema.
        </p>

        {/* Alta / edición */}
        <Card>
          <CardHeader><CardTitle className="text-base">{editingId ? "Editar reconocimiento" : "Agregar reconocimiento"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-end">
              <TranslateButton
                getSource={() => ({ name: form.nameEs })}
                onApply={(f) => { if (f.name != null) set("name", f.name); }}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Nombre (inglés) *</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Band 1 — Dispute Resolution" data-testid="input-name" /></div>
              <div className="space-y-1"><Label>Nombre (español) *</Label><Input value={form.nameEs} onChange={(e) => set("nameEs", e.target.value)} placeholder="Banda 1 — Resolución de Disputas" data-testid="input-nameEs" /></div>
              <div className="space-y-1"><Label>Publicación *</Label><Input value={form.publication} onChange={(e) => set("publication", e.target.value)} placeholder="Chambers and Partners" data-testid="input-publication" /></div>
              <div className="space-y-1"><Label>Año</Label><Input type="number" value={form.year} onChange={(e) => set("year", e.target.value)} data-testid="input-year" /></div>
              <div className="space-y-1"><Label>Categoría</Label><Input value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="Arbitraje" data-testid="input-category" /></div>
              <div className="space-y-1"><Label>Logo</Label><ImageUpload value={form.logoUrl} onChange={(v) => set("logoUrl", v)} placeholder="/logos/chambers.png" /></div>
              <div className="space-y-1 sm:col-span-2"><Label>Enlace externo</Label><Input value={form.externalUrl} onChange={(e) => set("externalUrl", e.target.value)} placeholder="https://chambers.com/..." data-testid="input-externalUrl" /></div>
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
          <CardHeader><CardTitle className="text-base">Reconocimientos actuales ({items.length})</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</div>
            ) : items.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aún no hay reconocimientos. Agrega el primero arriba.</p>
            ) : (
              <ul className="divide-y">
                {items.map((r) => (
                  <li key={r.id} className="py-3 flex items-center justify-between gap-4" data-testid={`row-${r.id}`}>
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-sm text-muted-foreground">{r.publication}{r.year ? ` · ${r.year}` : ""}{r.category ? ` · ${r.category}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => edit(r)} data-testid={`edit-${r.id}`} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => remove(r.id)} data-testid={`del-${r.id}`} title="Eliminar">
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
