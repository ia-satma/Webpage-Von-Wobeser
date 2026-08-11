import { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { adminApiRequest } from "@/lib/adminAuth";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { ImageGenButton } from "@/components/admin/ImageGenButton";
import { AdminPageHelp } from "@/components/admin/AdminPageHelp";
import { SocialPostButton, VoiceButton } from "@/components/admin/AgentTools";
import { TranslateButton } from "@/components/admin/TranslateButton";
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

const hasReadableText = (value: string) => value.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").trim().length > 0;

const EMPTY = {
  titleEs: "", title: "", excerptEs: "", excerpt: "", contentEs: "", content: "",
  imageUrl: "", slug: "", category: "press", published: false, featuredHome: false,
  tags: [] as string[],
};

type TeamMemberLite = { id: string; name: string; slug: string };

/**
 * Editor de Noticias (crear / editar). Los borradores pueden prepararse por etapas,
 * pero una noticia publicada requiere título y extracto reales en ambos idiomas.
 */
export default function AdminNewsForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [form, setForm] = useState({ ...EMPTY });
  const [slugTouched, setSlugTouched] = useState(false);
  const [authorIds, setAuthorIds] = useState<string[]>([]);
  const [authorSearch, setAuthorSearch] = useState("");
  const [tagInput, setTagInput] = useState("");

  const set = (k: keyof typeof EMPTY, v: string | boolean | string[]) => setForm((f) => ({ ...f, [k]: v }));

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
      category: n.category || "press", published: !!n.published, featuredHome: !!(n as any).featuredHome,
      tags: (n.tags || []).filter((tag): tag is string => typeof tag === "string"),
    });
    setSlugTouched(true); // no re-generar slug de una noticia existente
  }, [newsQuery.data]);

  // Todos los abogados (para el selector). Ruta pública, sin filtro de publicado.
  const teamQuery = useQuery<TeamMemberLite[]>({
    queryKey: ["/api/team"],
    queryFn: async () => {
      const res = await fetch("/api/team");
      if (!res.ok) throw new Error("No se pudo cargar la lista de abogados");
      return res.json();
    },
  });

  // Al editar, la ruta administrativa también conserva los vínculos de perfiles aún no publicados.
  const authorsQuery = useQuery<TeamMemberLite[]>({
    queryKey: ["/api/admin/news", id, "team-members"],
    enabled: isEdit && !!id,
    queryFn: async () => {
      const res = await adminApiRequest("GET", `/api/admin/news/${id}/team-members`);
      if (!res.ok) throw new Error("No se pudo cargar los abogados relacionados");
      return res.json();
    },
  });

  useEffect(() => {
    if (!authorsQuery.data) return;
    const ids = authorsQuery.data.map((m) => m.id);
    setAuthorIds(ids);
  }, [authorsQuery.data]);

  const toggleAuthor = (memberId: string, checked: boolean) => {
    setAuthorIds((prev) => (checked ? (prev.includes(memberId) ? prev : [...prev, memberId]) : prev.filter((x) => x !== memberId)));
  };

  const addTags = (value: string) => {
    const nextTags = value
      .split(",")
      .map((tag) => tag.trim().replace(/\s+/g, " ").toLocaleLowerCase("es-MX"))
      .filter((tag) => tag.length >= 2 && tag.length <= 60);
    if (!nextTags.length) return;
    setForm((current) => ({
      ...current,
      tags: Array.from(new Set([...current.tags, ...nextTags])).slice(0, 12),
    }));
    setTagInput("");
  };

  const removeTag = (tag: string) => setForm((current) => ({
    ...current,
    tags: current.tags.filter((value) => value !== tag),
  }));

  // Auto-slug desde el título en español mientras no se edite manualmente.
  useEffect(() => {
    if (!isEdit && !slugTouched) setForm((f) => ({ ...f, slug: generateSlug(f.titleEs) }));
  }, [form.titleEs, slugTouched, isEdit]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const catEs = newsCategories.find((c) => c.value === form.category)?.es || "Prensa";
      const payload = {
        titleEs: form.titleEs.trim(),
        title: form.title.trim(),
        excerptEs: form.excerptEs.trim(),
        excerpt: form.excerpt.trim(),
        contentEs: form.contentEs.trim() || null,
        content: form.content.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
        slug: (form.slug.trim() || generateSlug(form.titleEs)),
        category: form.category,
        categoryEs: catEs,
        published: form.published,
        featuredHome: form.featuredHome,
        tags: form.tags,
        teamMemberIds: authorIds,
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

  const spanishReady = hasReadableText(form.titleEs) && hasReadableText(form.excerptEs);
  const englishReady = hasReadableText(form.title) && hasReadableText(form.excerpt);
  const canSave = spanishReady && (!form.published || englishReady) && !saveMutation.isPending;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spanishReady) {
      toast({ title: "Faltan datos", description: "El título y el extracto (en español) son obligatorios.", variant: "destructive" });
      return;
    }
    if (form.published && !englishReady) {
      toast({ title: "Falta la versión en inglés", description: "Para publicar, completa el título y el extracto en inglés o usa el traductor y revisa el resultado.", variant: "destructive" });
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
          {isEdit && id && (
            <div className="flex items-center gap-2">
              <SocialPostButton articleId={id} />
              {form.category === "alerts" && (
                <VoiceButton
                  text={form.contentEs || form.content}
                  sourceType="legal_alerts"
                  articleId={id}
                  label="Generar audio de la alerta"
                />
              )}
            </div>
          )}
        </div>

        <AdminPageHelp pageId="noticias-form" manualSectionId="noticias">
          Llena el contenido en español y revisa también su versión en inglés. Puedes guardar un borrador
          mientras traduces, pero para publicarlo son obligatorios el título y el extracto en ambos idiomas.
          Usa <strong>“Traducir al inglés con IA”</strong> como apoyo y revisa el resultado. Sube una imagen destacada, elige la categoría y activa
          <strong> “Publicada”</strong> cuando quieras que aparezca en el sitio.
        </AdminPageHelp>

        <div className="flex justify-end mb-3">
          <TranslateButton
            getSource={() => ({ title: form.titleEs, excerpt: form.excerptEs, content: form.contentEs })}
            onApply={(f) => setForm((prev) => ({ ...prev, title: f.title ?? prev.title, excerpt: f.excerpt ?? prev.excerpt, content: f.content ?? prev.content }))}
          />
        </div>

        <form onSubmit={submit}>
          <Card>
            <CardHeader><CardTitle className="text-base">Contenido</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="titleEs">Título (español) *</Label>
                <Input id="titleEs" value={form.titleEs} onChange={(e) => set("titleEs", e.target.value)} placeholder="Título de la noticia" data-testid="input-title-es" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="title">Título (inglés) <span className="text-muted-foreground text-xs">— obligatorio al publicar</span></Label>
                <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="English title" data-testid="input-title-en" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="excerptEs">Extracto (español) *</Label>
                <RichTextEditor rows={2} value={form.excerptEs} onChange={(html) => set("excerptEs", html)} placeholder="Resumen corto que aparece en el listado" data-testid="input-excerpt-es" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="excerpt">Extracto (inglés) <span className="text-muted-foreground text-xs">— obligatorio al publicar</span></Label>
                <RichTextEditor rows={2} value={form.excerpt} onChange={(html) => set("excerpt", html)} placeholder="Short summary" data-testid="input-excerpt-en" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contentEs">Contenido (español)</Label>
                <RichTextEditor rows={8} value={form.contentEs} onChange={(html) => set("contentEs", html)} placeholder="Cuerpo de la noticia" data-testid="input-content-es" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="content">Contenido (inglés) <span className="text-muted-foreground text-xs">— opcional</span></Label>
                <RichTextEditor rows={8} value={form.content} onChange={(html) => set("content", html)} placeholder="Body (optional)" data-testid="input-content-en" />
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader><CardTitle className="text-base">Ajustes</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label>Imagen destacada</Label>
                <ImageUpload value={form.imageUrl} onChange={(url) => set("imageUrl", url)} kind="image" />
                <ImageGenButton
                  getPrompt={() => form.titleEs || form.title || ""}
                  onGenerated={(url) => set("imageUrl", url)}
                />
                <p className="text-xs text-muted-foreground">O genera una con IA a partir del título (elige el formato).</p>
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

              <div className="flex items-center gap-3">
                <Switch id="featuredHome" checked={form.featuredHome} onCheckedChange={(v) => set("featuredHome", v)} data-testid="switch-featured-home" />
                <Label htmlFor="featuredHome" className="cursor-pointer">
                  Mostrar en la portada <span className="text-muted-foreground text-xs font-normal">— aparece en la caja de Noticias del inicio (debe estar publicada)</span>
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader><CardTitle className="text-base">Relación editorial</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Define temas y autores para conectar esta publicación con el resto del contenido. Las recomendaciones públicas priorizan las etiquetas, después los autores y finalmente la categoría.
              </p>
              <div className="space-y-2">
                <Label htmlFor="editorial-tags">Etiquetas temáticas</Label>
                <Input
                  id="editorial-tags"
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addTags(tagInput);
                    }
                  }}
                  onBlur={() => addTags(tagInput)}
                  placeholder="Ej. fiscal, inversión extranjera"
                  autoComplete="off"
                  data-testid="input-editorial-tags"
                />
                <p className="text-xs text-muted-foreground">Separa las etiquetas con comas o presiona Enter. Máximo 12 etiquetas.</p>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2" aria-label="Etiquetas seleccionadas">
                    {form.tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`Quitar etiqueta ${tag}`}
                      >
                        {tag} <span aria-hidden="true">×</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="border-t pt-4" />
              <div className="space-y-1.5">
                <Label htmlFor="author-search">Autores de esta publicación</Label>
                <Input
                  id="author-search"
                  value={authorSearch}
                  onChange={(event) => setAuthorSearch(event.target.value)}
                  placeholder="Busca un socio o abogado…"
                  autoComplete="off"
                  data-testid="input-author-search"
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{authorIds.length === 1 ? "1 persona seleccionada" : `${authorIds.length} personas seleccionadas`}</span>
                {authorIds.length > 0 && (
                  <button type="button" className="underline underline-offset-4" onClick={() => setAuthorIds([])}>
                    Limpiar selección
                  </button>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-2 max-h-64 overflow-y-auto border rounded-md p-3" aria-live="polite">
                {teamQuery.isLoading && <p className="text-sm text-muted-foreground col-span-2">Cargando…</p>}
                {teamQuery.isError && <p className="text-sm text-destructive col-span-2">No fue posible cargar el directorio.</p>}
                {(teamQuery.data || [])
                  .filter((member) => member.name.toLocaleLowerCase("es").includes(authorSearch.trim().toLocaleLowerCase("es")))
                  .map((member) => (
                    <label key={member.id} className="flex items-center gap-2 text-sm cursor-pointer rounded-sm px-1 py-1 hover:bg-muted">
                      <Checkbox
                        checked={authorIds.includes(member.id)}
                        onCheckedChange={(checked) => toggleAuthor(member.id, !!checked)}
                        data-testid={`checkbox-author-${member.id}`}
                      />
                      {member.name}
                    </label>
                  ))}
                {!teamQuery.isLoading && !teamQuery.isError && (teamQuery.data || []).filter((member) => member.name.toLocaleLowerCase("es").includes(authorSearch.trim().toLocaleLowerCase("es"))).length === 0 && (
                  <p className="text-sm text-muted-foreground col-span-2">No hay coincidencias.</p>
                )}
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
