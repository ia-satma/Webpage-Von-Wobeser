import { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { adminApiRequest } from "@/lib/adminAuth";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { AdminPageHelp } from "@/components/admin/AdminPageHelp";
import { SocialPostButton } from "@/components/admin/AgentTools";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { newsCategories, type News } from "@shared/schema";

/** slug amigable a partir del título (sin acentos, minúsculas, guiones). */
function generateSlug(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

const EMPTY = {
  titleEs: "", title: "", excerptEs: "", excerpt: "", contentEs: "", content: "",
  imageUrl: "", slug: "", category: "press", published: false,
};

/**
 * Editor de Noticias (crear / editar). El despacho llena el contenido en español;
 * el inglés es opcional (si se deja vacío, se copia del español al guardar).
 */
export default function AdminNewsForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [form, setForm] = useState({ ...EMPTY });
  const [slugTouched, setSlugTouched] = useState(false);

  const set = (k: keyof typeof EMPTY, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  // Cargar la noticia al editar.
  const newsQuery = useQuery<News>({
    queryKey: ["/api/news", id],
    enabled: isEdit,
    queryFn: async () => {
      const res = await adminApiRequest("GET", `/api/news/${id}`);
      if (!res.ok) throw new Error("No se pudo cargar la noticia");
      return res.json();
    },
  });

  useEffect(() => {
    const n = newsQuery.data;
    if (!n) return;
    setForm({
      titleEs: n.titleEs || "", title: n.title || "",
      excerptEs: n.excerptEs || "", excerpt: n.excerpt || "",
      contentEs: n.contentEs || "", content: n.content || "",
      imageUrl: n.imageUrl || "", slug: n.slug || "",
      category: n.category || "press", published: !!n.published,
    });
    setSlugTouched(true); // no re-generar slug de una noticia existente
  }, [newsQuery.data]);

  // Auto-slug desde el título en español mientras no se edite manualmente.
  useEffect(() => {
    if (!isEdit && !slugTouched) setForm((f) => ({ ...f, slug: generateSlug(f.titleEs) }));
  }, [form.titleEs, slugTouched, isEdit]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const catEs = newsCategories.find((c) => c.value === form.category)?.es || "Prensa";
      const payload = {
        titleEs: form.titleEs.trim(),
        title: (form.title.trim() || form.titleEs.trim()),        // inglés opcional → cae al español
        excerptEs: form.excerptEs.trim(),
        excerpt: (form.excerpt.trim() || form.excerptEs.trim()),
        contentEs: form.contentEs.trim() || null,
        content: (form.content.trim() || form.contentEs.trim() || null),
        imageUrl: form.imageUrl.trim() || null,
        slug: (form.slug.trim() || generateSlug(form.titleEs)),
        category: form.category,
        categoryEs: catEs,
        published: form.published,
      };
      const res = isEdit
        ? await adminApiRequest("PUT", `/api/admin/news/${id}`, payload)
        : await adminApiRequest("POST", "/api/admin/news", payload);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "No se pudo guardar");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/news"] });
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({ title: isEdit ? "Noticia actualizada" : "Noticia creada", description: "Los cambios se guardaron." });
      setLocation("/admin/news");
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e?.message || "No se pudo guardar la noticia.", variant: "destructive" });
    },
  });

  const canSave = form.titleEs.trim() && form.excerptEs.trim() && !saveMutation.isPending;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titleEs.trim() || !form.excerptEs.trim()) {
      toast({ title: "Faltan datos", description: "El título y el extracto (en español) son obligatorios.", variant: "destructive" });
      return;
    }
    saveMutation.mutate();
  };

  if (isEdit && newsQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-3xl space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/news">
              <Button variant="ghost" size="icon" data-testid="button-back"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">
              {isEdit ? "Editar noticia" : "Nueva noticia"}
            </h1>
          </div>
          {isEdit && id && <SocialPostButton articleId={id} />}
        </div>

        <AdminPageHelp>
          Llena el contenido <strong>en español</strong> (obligatorio el título y el extracto). El inglés es
          opcional: si lo dejas vacío, se usa el español. Sube una imagen destacada, elige la categoría y activa
          <strong> “Publicada”</strong> cuando quieras que aparezca en el sitio.
        </AdminPageHelp>

        <form onSubmit={submit}>
          <Card>
            <CardHeader><CardTitle className="text-base">Contenido</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="titleEs">Título (español) *</Label>
                <Input id="titleEs" value={form.titleEs} onChange={(e) => set("titleEs", e.target.value)} placeholder="Título de la noticia" data-testid="input-title-es" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="title">Título (inglés) <span className="text-muted-foreground text-xs">— opcional</span></Label>
                <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="English title (optional)" data-testid="input-title-en" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="excerptEs">Extracto (español) *</Label>
                <Textarea id="excerptEs" rows={2} value={form.excerptEs} onChange={(e) => set("excerptEs", e.target.value)} placeholder="Resumen corto que aparece en el listado" data-testid="input-excerpt-es" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="excerpt">Extracto (inglés) <span className="text-muted-foreground text-xs">— opcional</span></Label>
                <Textarea id="excerpt" rows={2} value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} placeholder="Short summary (optional)" data-testid="input-excerpt-en" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contentEs">Contenido (español)</Label>
                <Textarea id="contentEs" rows={8} value={form.contentEs} onChange={(e) => set("contentEs", e.target.value)} placeholder="Cuerpo de la noticia" data-testid="input-content-es" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="content">Contenido (inglés) <span className="text-muted-foreground text-xs">— opcional</span></Label>
                <Textarea id="content" rows={8} value={form.content} onChange={(e) => set("content", e.target.value)} placeholder="Body (optional)" data-testid="input-content-en" />
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader><CardTitle className="text-base">Ajustes</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label>Imagen destacada</Label>
                <ImageUpload value={form.imageUrl} onChange={(url) => set("imageUrl", url)} kind="image" />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Categoría</Label>
                  <Select value={form.category} onValueChange={(v) => set("category", v)}>
                    <SelectTrigger data-testid="select-category"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {newsCategories.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.es}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="slug">URL (slug)</Label>
                  <Input id="slug" value={form.slug} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }} placeholder="se-genera-del-titulo" data-testid="input-slug" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch id="published" checked={form.published} onCheckedChange={(v) => set("published", v)} data-testid="switch-published" />
                <Label htmlFor="published" className="cursor-pointer">
                  Publicada <span className="text-muted-foreground text-xs font-normal">— visible en el sitio</span>
                </Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3 mt-6">
            <Link href="/admin/news"><Button type="button" variant="outline">Cancelar</Button></Link>
            <Button type="submit" disabled={!canSave} data-testid="button-save">
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              {isEdit ? "Guardar cambios" : "Crear noticia"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
