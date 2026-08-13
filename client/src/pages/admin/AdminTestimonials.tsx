import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Quote, Plus, Trash2, Loader2, Pencil, Save, X } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPageHelp } from "@/components/admin/AdminPageHelp";
import { TranslateButton } from "@/components/admin/TranslateButton";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { useAdminAuth, adminApiRequest } from "@/lib/adminAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TypographyFieldControl } from "@/components/admin/TypographyFieldControl";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type Testimonial = {
  id: string;
  quote: string;
  quoteEs: string;
  authorName: string;
  authorTitle?: string | null;
  authorTitleEs?: string | null;
  authorCompany?: string | null;
  authorPhotoUrl?: string | null;
  source?: string | null;
  sourceEs?: string | null;
  year?: number | null;
  isFeatured?: boolean | null;
  published?: boolean | null;
  order?: number | null;
};

const EMPTY = {
  quote: "",
  quoteEs: "",
  authorName: "",
  authorTitle: "",
  authorTitleEs: "",
  authorCompany: "",
  authorPhotoUrl: "",
  source: "",
  sourceEs: "",
  year: "",
  isFeatured: true,
  published: true,
  order: "0",
};

export default function AdminTestimonials() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [form, setForm] = useState({ ...EMPTY });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation("/admin/login");
  }, [authLoading, isAuthenticated, setLocation]);

  const { data: items = [], isLoading, refetch } = useQuery<Testimonial[]>({
    queryKey: ["/api/admin/testimonials"],
    queryFn: async () => {
      const response = await adminApiRequest("GET", "/api/admin/testimonials");
      if (!response.ok) throw new Error("No se pudieron cargar los testimonios.");
      return response.json();
    },
    enabled: isAuthenticated,
  });

  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) => setForm((current) => ({ ...current, [key]: value }));

  const edit = (item: Testimonial) => {
    setEditingId(item.id);
    setForm({
      quote: item.quote || "",
      quoteEs: item.quoteEs || "",
      authorName: item.authorName || "",
      authorTitle: item.authorTitle || "",
      authorTitleEs: item.authorTitleEs || "",
      authorCompany: item.authorCompany || "",
      authorPhotoUrl: item.authorPhotoUrl || "",
      source: item.source || "",
      sourceEs: item.sourceEs || "",
      year: item.year ? String(item.year) : "",
      isFeatured: item.isFeatured !== false,
      published: item.published !== false,
      order: String(item.order ?? 0),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clear = () => {
    setEditingId(null);
    setForm({ ...EMPTY });
  };

  const save = async () => {
    if (!form.quote.trim() || !form.quoteEs.trim() || !form.authorName.trim()) {
      toast({ title: "Faltan datos", description: "La cita en ambos idiomas y el autor o fuente son obligatorios.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const payload = {
        ...form,
        year: form.year ? Number(form.year) : null,
        order: Number(form.order) || 0,
        authorTitle: form.authorTitle || null,
        authorTitleEs: form.authorTitleEs || null,
        authorCompany: form.authorCompany || null,
        authorPhotoUrl: form.authorPhotoUrl || null,
        source: form.source || null,
        sourceEs: form.sourceEs || null,
      };
      const response = editingId
        ? await adminApiRequest("PUT", `/api/admin/testimonials/${editingId}`, payload)
        : await adminApiRequest("POST", "/api/admin/testimonials", payload);
      if (!response.ok) throw new Error("save");
      toast({ title: editingId ? "Testimonio actualizado" : "Testimonio agregado" });
      clear();
      await refetch();
    } catch {
      toast({ title: "No se pudo guardar", description: "Revisa los datos e inténtalo nuevamente.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("¿Eliminar este testimonio?")) return;
    try {
      const response = await adminApiRequest("DELETE", `/api/admin/testimonials/${id}`);
      if (response.ok) {
        toast({ title: "Testimonio eliminado" });
        if (editingId === id) clear();
        await refetch();
      } else {
        toast({ title: "No se pudo eliminar", variant: "destructive" });
      }
    } catch {
      toast({
        title: "No se pudo eliminar",
        description: "No fue posible conectar con el servidor.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <AdminPageHeader title="Testimonios" icon={Quote} />
        <AdminPageHelp pageId="testimonios" manualSectionId="testimonios">
          Administra las citas que rotan en el carrusel superior del home. Los testimonios destacados y publicados se muestran en orden.
        </AdminPageHelp>

        <Card>
          <CardHeader><CardTitle className="text-base">{editingId ? "Editar testimonio" : "Agregar testimonio"}</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="flex justify-end">
              <TranslateButton
                getSource={() => ({ quote: form.quoteEs, authorTitle: form.authorTitleEs, source: form.sourceEs })}
                onApply={(fields) => setForm((current) => ({ ...current, quote: fields.quote ?? current.quote, authorTitle: fields.authorTitle ?? current.authorTitle, source: fields.source ?? current.source }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2"><Label>Cita (español) *</Label><Textarea rows={5} value={form.quoteEs} onChange={(event) => set("quoteEs", event.target.value)} /><TypographyFieldControl entityType="testimonial" entityId={editingId} field="quoteEs" language="es" role="editorial" compact /></div>
              <div className="space-y-1 sm:col-span-2"><Label>Cita (inglés) *</Label><Textarea rows={5} value={form.quote} onChange={(event) => set("quote", event.target.value)} /><TypographyFieldControl entityType="testimonial" entityId={editingId} field="quote" language="en" role="editorial" compact /></div>
              <div className="space-y-1"><Label>Autor o institución *</Label><Input value={form.authorName} onChange={(event) => set("authorName", event.target.value)} placeholder="Latin Lawyer" /><TypographyFieldControl entityType="testimonial" entityId={editingId} field="authorName" language="en" role="ui" compact /></div>
              <div className="space-y-1"><Label>Empresa</Label><Input value={form.authorCompany} onChange={(event) => set("authorCompany", event.target.value)} /></div>
              <div className="space-y-1"><Label>Cargo (español)</Label><Input value={form.authorTitleEs} onChange={(event) => set("authorTitleEs", event.target.value)} /></div>
              <div className="space-y-1"><Label>Cargo (inglés)</Label><Input value={form.authorTitle} onChange={(event) => set("authorTitle", event.target.value)} /></div>
              <div className="space-y-1"><Label>Fuente mostrada (español)</Label><Input value={form.sourceEs} onChange={(event) => set("sourceEs", event.target.value)} placeholder="Latin Lawyer" /></div>
              <div className="space-y-1"><Label>Fuente mostrada (inglés)</Label><Input value={form.source} onChange={(event) => set("source", event.target.value)} placeholder="Latin Lawyer" /></div>
              <div className="space-y-1"><Label>Año</Label><Input type="number" value={form.year} onChange={(event) => set("year", event.target.value)} /></div>
              <div className="space-y-1"><Label>Orden</Label><Input type="number" value={form.order} onChange={(event) => set("order", event.target.value)} /></div>
              <div className="space-y-1 sm:col-span-2"><Label>Foto opcional del autor</Label><ImageUpload value={form.authorPhotoUrl} onChange={(value) => set("authorPhotoUrl", value)} /></div>
            </div>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm"><Switch checked={form.isFeatured} onCheckedChange={(value) => set("isFeatured", value)} /> Destacado en el home</label>
              <label className="flex items-center gap-2 text-sm"><Switch checked={form.published} onCheckedChange={(value) => set("published", value)} /> Publicado</label>
            </div>
            <div className="flex gap-2">
              <Button onClick={save} disabled={busy}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : editingId ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}{editingId ? "Guardar cambios" : "Agregar"}</Button>
              {editingId && <Button variant="outline" onClick={clear} disabled={busy}><X className="mr-2 h-4 w-4" />Cancelar</Button>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Testimonios actuales ({items.length})</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Cargando…</div> : items.length === 0 ? <p className="text-sm text-muted-foreground">Aún no hay testimonios.</p> : (
              <ul className="divide-y">
                {items.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-4 py-4">
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm">“{item.quoteEs}”</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.sourceEs || item.authorName} · orden {item.order ?? 0} · {item.published === false ? "oculto" : item.isFeatured ? "destacado" : "publicado"}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button variant="ghost" size="sm" onClick={() => edit(item)} title="Editar"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => remove(item.id)} title="Eliminar"><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
