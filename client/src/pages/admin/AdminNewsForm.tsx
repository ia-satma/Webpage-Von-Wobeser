import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { adminApiRequest } from "@/lib/adminAuth";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { TypographyFieldControl } from "@/components/admin/TypographyFieldControl";
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
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCompletionChecklist } from "@/components/admin/AdminCompletionChecklist";
import { AdminEditStatus, useAdminEditRegistration, useAdminEditingState } from "@/components/admin/AdminEditingState";
import { AdminPrivatePreviewButton } from "@/components/admin/AdminPrivatePreviewButton";
import { SocialPostButton, VoiceButton } from "@/components/admin/AgentTools";
import { TranslateButton } from "@/components/admin/TranslateButton";
import { Save, Loader2, RefreshCw } from "lucide-react";
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
  imageUrl: "", sourceUrl: "", date: "", slug: "", category: "press", published: false, featuredHome: false,
  tags: [] as string[],
};

type TeamMemberLite = { id: string; name: string; slug: string };
type RelationshipRole = "author" | "related";
type ProfessionalRelation = {
  member: TeamMemberLite;
  verificationStatus: "verified_historic" | "verified_editorial_2026" | "verified_manual" | "legacy_unverified";
  relationshipRole: RelationshipRole;
};
type ExternalLinkIntegrity = {
  id: string;
  kind: "source" | "content";
  url: string;
  status: "verified" | "disabled";
  finalUrl: string | null;
  failureCode: string | null;
  checkedAt: string;
};
type LinkIntegrityResponse = {
  articleId: string;
  published: boolean;
  sourceUrl: string | null;
  links: ExternalLinkIntegrity[];
  result?: {
    checked: number;
    sourceDisabled: boolean;
    disabledContentLinks: number;
    legacyFirmPageDetected: boolean;
    articleUnpublished: boolean;
  };
};

/**
 * Editor de Noticias (crear / editar). Los borradores pueden prepararse por etapas,
 * pero una noticia publicada requiere título y extracto reales en ambos idiomas.
 * La excepción editorial es un Artículo histórico con fuente HTTPS verificable.
 */
export default function AdminNewsForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [form, setForm] = useState({ ...EMPTY });
  const [isDirty, setIsDirty] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [professionalRoles, setProfessionalRoles] = useState<Partial<Record<string, RelationshipRole>>>({});
  const [sourceProfessionalRoles, setSourceProfessionalRoles] = useState<Record<string, RelationshipRole>>({});
  const [authorSearch, setAuthorSearch] = useState("");
  const [tagInput, setTagInput] = useState("");

  const { requestNavigation } = useAdminEditingState();
  const set = (k: keyof typeof EMPTY, v: string | boolean | string[]) => {
    setIsDirty(true);
    setForm((f) => ({ ...f, [k]: v }));
  };

  // Cargar la noticia al editar.
  const newsQuery = useQuery<News>({
    queryKey: ["/api/admin/news", id],
    enabled: isEdit,
    queryFn: async () => {
      const res = await adminApiRequest("GET", `/api/admin/news/${id}`);
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
      imageUrl: n.imageUrl || "", sourceUrl: n.sourceUrl || "", date: n.date ? String(n.date).slice(0, 10) : "", slug: n.slug || "",
      category: n.category || "press", published: !!n.published, featuredHome: !!(n as any).featuredHome,
      tags: (n.tags || []).filter((tag): tag is string => typeof tag === "string"),
    });
    setSlugTouched(true); // no re-generar slug de una noticia existente
    setIsDirty(false);
  }, [newsQuery.data]);

  // El selector incluye perfiles aún en borrador para que una noticia no pierda
  // vínculos válidos al editarse desde el CMS.
  const teamQuery = useQuery<{ members: TeamMemberLite[] }>({
    queryKey: ["/api/admin/team", "news-form"],
    queryFn: async () => {
      const res = await adminApiRequest("GET", "/api/admin/team?page=1&limit=100");
      if (!res.ok) throw new Error("No se pudo cargar la lista de abogados");
      return res.json();
    },
  });

  // Al editar, la ruta administrativa también conserva los vínculos de perfiles aún no publicados.
  const authorsQuery = useQuery<ProfessionalRelation[]>({
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
    // Only explicit manual approvals are editable.  Source-backed links stay
    // authoritative, while historical links remain internal until an editor
    // deliberately selects that person below.
    const manualRoles = authorsQuery.data
      .filter((relation) => relation.verificationStatus === "verified_manual")
      .reduce<Partial<Record<string, RelationshipRole>>>((next, relation) => {
        next[relation.member.id] = relation.relationshipRole;
        return next;
      }, {});
    setProfessionalRoles(manualRoles);
    const sourceRoles = authorsQuery.data
      .filter((relation) => relation.verificationStatus === "verified_historic" || relation.verificationStatus === "verified_editorial_2026")
      .reduce<Record<string, RelationshipRole>>((next, relation) => {
        next[relation.member.id] = relation.relationshipRole;
        return next;
      }, {});
    setSourceProfessionalRoles(sourceRoles);
  }, [authorsQuery.data]);

  const linkIntegrityQuery = useQuery<LinkIntegrityResponse>({
    queryKey: ["/api/admin/news", id, "link-integrity"],
    enabled: isEdit && !!id && form.category === "articles",
    queryFn: async () => {
      const res = await adminApiRequest("GET", `/api/admin/news/${id}/link-integrity`);
      if (!res.ok) throw new Error("No se pudo cargar el estado de enlaces");
      return res.json();
    },
  });

  const verifyLinksMutation = useMutation({
    mutationFn: async () => {
      const res = await adminApiRequest("POST", `/api/admin/news/${id}/link-integrity/verify`, {});
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "No se pudieron verificar los enlaces");
      }
      return res.json() as Promise<LinkIntegrityResponse>;
    },
    onSuccess: (result) => {
      queryClient.setQueryData(["/api/admin/news", id, "link-integrity"], result);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/news", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      if (!result.published && result.result?.articleUnpublished) set("published", false);
      toast({
        title: result.result?.articleUnpublished ? "Artículo despublicado" : "Enlaces verificados",
        description: result.result?.articleUnpublished
          ? result.result?.legacyFirmPageDetected
            ? "La ficha apunta a la página anterior de la firma y quedó despublicada hasta sustituir la fuente."
            : "La fuente no es verificable. La ficha dejó de ser visible públicamente hasta corregirla."
          : "El estado de los enlaces se actualizó.",
      });
    },
    onError: (error: Error) => toast({ title: "No se pudo verificar", description: error.message, variant: "destructive" }),
  });

  const toggleProfessional = (memberId: string, checked: boolean) => {
    setIsDirty(true);
    setProfessionalRoles((current) => {
      if (!checked) {
        const { [memberId]: _removed, ...rest } = current;
        return rest;
      }
      return memberId in current ? current : { ...current, [memberId]: undefined };
    });
  };

  const setProfessionalRole = (memberId: string, relationshipRole: RelationshipRole) => {
    setIsDirty(true);
    setProfessionalRoles((current) => ({ ...current, [memberId]: relationshipRole }));
  };

  const setSourceProfessionalRole = (memberId: string, relationshipRole: RelationshipRole) => {
    setIsDirty(true);
    setSourceProfessionalRoles((current) => ({ ...current, [memberId]: relationshipRole }));
  };

  const addTags = (value: string) => {
    const nextTags = value
      .split(",")
      .map((tag) => tag.trim().replace(/\s+/g, " ").toLocaleLowerCase("es-MX"))
      .filter((tag) => tag.length >= 2 && tag.length <= 60);
    if (!nextTags.length) return;
    setIsDirty(true);
    setForm((current) => ({
      ...current,
      tags: Array.from(new Set([...current.tags, ...nextTags])).slice(0, 12),
    }));
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setIsDirty(true);
    setForm((current) => ({
      ...current,
      tags: current.tags.filter((value) => value !== tag),
    }));
  };

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
        sourceUrl: form.sourceUrl.trim() || null,
        date: form.date.trim() || undefined,
        slug: (form.slug.trim() || generateSlug(form.titleEs)),
        category: form.category,
        categoryEs: catEs,
        published: form.published,
        featuredHome: form.featuredHome,
        tags: form.tags,
        teamMemberRelations: [
          ...Object.entries(sourceProfessionalRoles).map(([teamMemberId, relationshipRole]) => ({ teamMemberId, relationshipRole })),
          ...Object.entries(professionalRoles)
          .filter((entry): entry is [string, RelationshipRole] => entry[1] === "author" || entry[1] === "related")
          .map(([teamMemberId, relationshipRole]) => ({ teamMemberId, relationshipRole })),
        ],
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/navigation-status"] });
      setIsDirty(false);
      toast({ title: isEdit ? "Noticia actualizada" : "Noticia creada", description: "Los cambios se guardaron." });
      setLocation("/admin/news");
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e?.message || "No se pudo guardar la noticia.", variant: "destructive" });
    },
  });

  const spanishReady = hasReadableText(form.titleEs) && hasReadableText(form.excerptEs);
  const englishReady = hasReadableText(form.title) && hasReadableText(form.excerpt);
  const sourceOnlyArticle = form.category === "articles" && /^https:\/\//i.test(form.sourceUrl.trim());
  const editingPublishedLegacyWithoutDate = isEdit && newsQuery.data?.published === true && !newsQuery.data?.date;
  const dateReady = !form.published || hasReadableText(form.date) || editingPublishedLegacyWithoutDate;
  const selectedProfessionalIds = Object.keys(professionalRoles);
  const pendingProfessionalRoleIds = selectedProfessionalIds.filter((id) => !professionalRoles[id]);
  const canSave = hasReadableText(form.titleEs)
    && dateReady
    && pendingProfessionalRoleIds.length === 0
    && (!form.published || (hasReadableText(form.title) && (englishReady && spanishReady || sourceOnlyArticle)))
    && !saveMutation.isPending;

  useAdminEditRegistration({ id: `news:${id || "new"}`, isDirty, isSaving: saveMutation.isPending });
  const reviewItems = [
    { label: "Contenido", complete: hasReadableText(form.titleEs), hint: "agrega el título en español" },
    { label: "Idiomas", complete: !form.published || (spanishReady && (englishReady || sourceOnlyArticle)), hint: "revisa español e inglés" },
    { label: "Imagen", complete: !!form.imageUrl.trim(), hint: "opcional, pero recomendada" },
    { label: "Fecha y publicación", complete: dateReady, hint: "confirma la fecha editorial" },
    { label: "Revisión final", complete: canSave && !isDirty, hint: "guarda para actualizar la vista previa" },
  ];
  const exitToList = () => requestNavigation(() => setLocation("/admin/news"));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasReadableText(form.titleEs)) {
      toast({ title: "Faltan datos", description: "El título en español es obligatorio.", variant: "destructive" });
      return;
    }
    if (form.published && !hasReadableText(form.date) && !editingPublishedLegacyWithoutDate) {
      toast({ title: "Falta la fecha", description: "Toda nueva publicación visible necesita una fecha editorial verificable.", variant: "destructive" });
      return;
    }
    if (form.published && (!hasReadableText(form.title) || (!(englishReady && spanishReady) && !sourceOnlyArticle))) {
      toast({ title: "Faltan datos", description: "Para publicar completa ambos extractos o, si es un Artículo sin texto verificable, agrega una fuente HTTPS original.", variant: "destructive" });
      return;
    }
    if (pendingProfessionalRoleIds.length) {
      toast({ title: "Falta el tipo de vínculo", description: "Define si cada profesional seleccionado es autor o profesional relacionado.", variant: "destructive" });
      return;
    }
    saveMutation.mutate();
  };

  const sourceVerifiedProfessionals = (authorsQuery.data || []).filter((relation) =>
    relation.verificationStatus === "verified_historic" || relation.verificationStatus === "verified_editorial_2026",
  );
  const sourceVerifiedIds = new Set(sourceVerifiedProfessionals.map((relation) => relation.member.id));
  const legacyAuthorRelations = (authorsQuery.data || []).filter((relation) => relation.verificationStatus === "legacy_unverified");

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
        <AdminPageHeader
          title={isEdit ? "Editar publicación" : "Nueva publicación"}
          description="Los cambios afectan sólo esta publicación. Guarda un borrador antes de abrir la vista previa privada."
          actions={
            <div className="flex flex-wrap items-start justify-end gap-2">
              <AdminEditStatus isDirty={isDirty} isSaving={saveMutation.isPending} published={form.published} />
              <AdminPrivatePreviewButton entity="news" id={id} hasUnsavedChanges={isDirty} />
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
          }
        />

        <AdminPageHelp pageId="noticias-form" manualSectionId="noticias">
          Llena el contenido en español y revisa también su versión en inglés. Puedes guardar un borrador
          mientras traduces. Para publicar son obligatorios el título y el extracto en ambos idiomas;
          un Artículo histórico puede conservar sólo una fuente HTTPS original cuando no hay texto verificable para resumir.
          Usa <strong>“Traducir al inglés con IA”</strong> como apoyo y revisa el resultado. Sube una imagen destacada, elige la categoría y activa
          <strong> “Publicada”</strong> cuando quieras que aparezca en el sitio.
        </AdminPageHelp>

        <div className="flex justify-end mb-3">
          <TranslateButton
            getSource={() => ({ title: form.titleEs, excerpt: form.excerptEs, content: form.contentEs })}
            onApply={(f) => {
              setIsDirty(true);
              setForm((prev) => ({ ...prev, title: f.title ?? prev.title, excerpt: f.excerpt ?? prev.excerpt, content: f.content ?? prev.content }));
            }}
          />
        </div>

        <AdminCompletionChecklist items={reviewItems} />

        <form onSubmit={submit}>
          <Card>
            <CardHeader><CardTitle className="text-base">Contenido</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="titleEs">Título (español) *</Label>
                <Input id="titleEs" value={form.titleEs} onChange={(e) => set("titleEs", e.target.value)} placeholder="Título de la noticia" data-testid="input-title-es" />
                <TypographyFieldControl entityType="news" entityId={id} field="titleEs" language="es" role="editorial" compact />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="title">Título (inglés) <span className="text-muted-foreground text-xs">— obligatorio al publicar</span></Label>
                <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="English title" data-testid="input-title-en" />
                <TypographyFieldControl entityType="news" entityId={id} field="title" language="en" role="editorial" compact />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="excerptEs">Extracto (español) <span className="text-muted-foreground text-xs">— obligatorio salvo Artículos con fuente original</span></Label>
                <RichTextEditor rows={2} value={form.excerptEs} onChange={(html) => set("excerptEs", html)} placeholder="Resumen corto que aparece en el listado" recommendedFamily="gelasio" data-testid="input-excerpt-es" />
                <TypographyFieldControl entityType="news" entityId={id} field="excerptEs" language="es" role="editorial" compact />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="excerpt">Extracto (inglés) <span className="text-muted-foreground text-xs">— obligatorio salvo Artículos con fuente original</span></Label>
                <RichTextEditor rows={2} value={form.excerpt} onChange={(html) => set("excerpt", html)} placeholder="Short summary" recommendedFamily="gelasio" data-testid="input-excerpt-en" />
                <TypographyFieldControl entityType="news" entityId={id} field="excerpt" language="en" role="editorial" compact />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contentEs">Contenido (español)</Label>
                <RichTextEditor rows={8} value={form.contentEs} onChange={(html) => set("contentEs", html)} placeholder="Cuerpo de la noticia" recommendedFamily="inter" data-testid="input-content-es" />
                <TypographyFieldControl entityType="news" entityId={id} field="contentEs" language="es" role="body" compact />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="content">Contenido (inglés) <span className="text-muted-foreground text-xs">— opcional</span></Label>
                <RichTextEditor rows={8} value={form.content} onChange={(html) => set("content", html)} placeholder="Body (optional)" recommendedFamily="inter" data-testid="input-content-en" />
                <TypographyFieldControl entityType="news" entityId={id} field="content" language="en" role="body" compact />
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

              <div className="space-y-1.5">
                <Label htmlFor="sourceUrl">Fuente original <span className="text-muted-foreground text-xs">— opcional</span></Label>
                <Input id="sourceUrl" type="url" value={form.sourceUrl} onChange={(e) => set("sourceUrl", e.target.value)} placeholder="https://…" data-testid="input-source-url" />
                <p className="text-xs text-muted-foreground">Se muestra como enlace clicable en el listado y en el detalle. Es obligatoria si un Artículo publicado no tiene extractos verificables. Las fichas HTML de la página anterior de la firma no se aceptan: el Artículo queda como borrador hasta sustituir la fuente. No pegues una URL como texto: usa este campo o crea un hipervínculo desde el editor.</p>
              </div>

              {isEdit && form.category === "articles" && (
                <div className="rounded-md border p-4 space-y-3" data-testid="article-link-integrity">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <Label>Estado de enlaces</Label>
                      <p className="mt-1 text-xs text-muted-foreground">Las fuentes inválidas y cualquier enlace a la página anterior de la firma despublican la ficha. Los demás enlaces internos inválidos conservan su texto, pero dejan de ser clicables.</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => verifyLinksMutation.mutate()}
                      disabled={verifyLinksMutation.isPending}
                      data-testid="button-verify-article-links"
                    >
                      {verifyLinksMutation.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1 h-4 w-4" />}
                      Verificar ahora
                    </Button>
                  </div>
                  {linkIntegrityQuery.isLoading && <p className="text-sm text-muted-foreground">Cargando estado…</p>}
                  {linkIntegrityQuery.isError && <p className="text-sm text-destructive">No fue posible cargar el estado de enlaces.</p>}
                  {!linkIntegrityQuery.isLoading && !linkIntegrityQuery.isError && (linkIntegrityQuery.data?.links.length || 0) === 0 && (
                    <p className="text-sm text-muted-foreground">Aún no hay enlaces auditados. Guarda o verifica este Artículo para crear su registro.</p>
                  )}
                  <div className="space-y-2" aria-live="polite">
                    {(linkIntegrityQuery.data?.links || []).map((link) => (
                      <div key={link.id} className="rounded border bg-muted/30 p-2 text-xs">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className={link.status === "verified" ? "font-medium text-emerald-700" : "font-medium text-destructive"}>
                            {link.status === "verified" ? "Verificado" : "Desactivado"}
                          </span>
                          <span className="text-muted-foreground">{link.kind === "source" ? "Fuente original" : "Enlace en contenido"}</span>
                          {link.failureCode && <span className="text-destructive">{link.failureCode === "LEGACY_FIRM_PAGE" ? "Página anterior de la firma — Artículo despublicado" : link.failureCode}</span>}
                        </div>
                        <p className="mt-1 break-all text-muted-foreground">{link.url}</p>
                        <p className="mt-1 text-muted-foreground">Revisado: {new Date(link.checkedAt).toLocaleString("es-MX")}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="editorialDate">Fecha editorial <span className="text-muted-foreground text-xs">— obligatoria al publicar</span></Label>
                <Input id="editorialDate" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} data-testid="input-editorial-date" />
                <p className="text-xs text-muted-foreground">En el sitio se muestra mes y año. Los registros históricos sin fuente pueden permanecer sin fecha, pero no aparecerán en Insights.</p>
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
                Las etiquetas organizan recomendaciones editoriales. La autoría y la participación se gestionan por separado: sólo una autoría acreditada aparece como Insight en la ficha de un abogado.
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
                <Label htmlFor="author-search">Profesionales vinculados</Label>
                <Input
                  id="author-search"
                  value={authorSearch}
                  onChange={(event) => setAuthorSearch(event.target.value)}
                  placeholder="Busca un socio o abogado…"
                  autoComplete="off"
                  data-testid="input-author-search"
                />
                <p className="text-xs text-muted-foreground">Selecciona sólo a una persona cuya participación puedas acreditar y después indica el tipo de vínculo. No se crean relaciones por coincidencias de nombre, práctica, industria o texto.</p>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{selectedProfessionalIds.length === 1 ? "1 vínculo manual" : `${selectedProfessionalIds.length} vínculos manuales`}</span>
                {selectedProfessionalIds.length > 0 && (
                  <button type="button" className="underline underline-offset-4" onClick={() => setProfessionalRoles({})}>
                    Limpiar selección
                  </button>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-2 max-h-64 overflow-y-auto border rounded-md p-3" aria-live="polite">
                {teamQuery.isLoading && <p className="text-sm text-muted-foreground col-span-2">Cargando…</p>}
                {teamQuery.isError && <p className="text-sm text-destructive col-span-2">No fue posible cargar el directorio.</p>}
                {(teamQuery.data?.members || [])
                  .filter((member) => !sourceVerifiedIds.has(member.id))
                  .filter((member) => member.name.toLocaleLowerCase("es").includes(authorSearch.trim().toLocaleLowerCase("es")))
                  .map((member) => {
                    const selected = member.id in professionalRoles;
                    const relationshipRole = professionalRoles[member.id];
                    return (
                      <div key={member.id} className="flex flex-wrap items-center gap-2 rounded-sm px-1 py-1 hover:bg-muted">
                        <label className="flex min-w-0 flex-1 items-center gap-2 text-sm cursor-pointer">
                          <Checkbox
                            checked={selected}
                            onCheckedChange={(checked) => toggleProfessional(member.id, !!checked)}
                            data-testid={`checkbox-professional-${member.id}`}
                          />
                          <span className="truncate">{member.name}</span>
                        </label>
                        {selected && (
                          <Select value={relationshipRole || "pending"} onValueChange={(value) => {
                            if (value === "author" || value === "related") setProfessionalRole(member.id, value);
                          }}>
                            <SelectTrigger className="h-8 w-[168px] text-xs" data-testid={`select-professional-role-${member.id}`}><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {!relationshipRole && <SelectItem value="pending" disabled>Elige un tipo</SelectItem>}
                              <SelectItem value="author">Autor/a acreditado/a</SelectItem>
                              <SelectItem value="related">Profesional relacionado</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    );
                  })}
                {!teamQuery.isLoading && !teamQuery.isError && (teamQuery.data?.members || []).filter((member) => !sourceVerifiedIds.has(member.id)).filter((member) => member.name.toLocaleLowerCase("es").includes(authorSearch.trim().toLocaleLowerCase("es"))).length === 0 && (
                  <p className="text-sm text-muted-foreground col-span-2">No hay coincidencias.</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">“Autor/a acreditado/a” requiere crédito visible en la fuente o confirmación editorial expresa y alimenta los Insights del perfil. “Profesional relacionado” se muestra sólo dentro de la publicación y nunca como autoría.</p>
              {sourceVerifiedProfessionals.length > 0 && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
                  <p className="font-medium">Relaciones acreditadas por fuente</p>
                  <p className="mt-1 text-xs">Se conservan porque provienen de una fuente histórica o de un crédito editorial verificable. Sólo cambia el tipo si revisaste la evidencia: al reclasificarlo, Administración registra una confirmación manual.</p>
                  <div className="mt-3 space-y-2">
                    {sourceVerifiedProfessionals.map((relation) => {
                      const relationshipRole = sourceProfessionalRoles[relation.member.id] || relation.relationshipRole;
                      return (
                        <div key={relation.member.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-emerald-200/80 bg-white/60 px-2 py-1.5">
                          <span className="text-xs font-medium">{relation.member.name}</span>
                          <Select value={relationshipRole} onValueChange={(value) => {
                            if (value === "author" || value === "related") setSourceProfessionalRole(relation.member.id, value);
                          }}>
                            <SelectTrigger className="h-8 w-[188px] bg-white text-xs" data-testid={`select-source-professional-role-${relation.member.id}`}><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="author">Autor/a acreditado/a</SelectItem>
                              <SelectItem value="related">Profesional relacionado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {legacyAuthorRelations.length > 0 && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                  <p className="font-medium">Relaciones heredadas sin confirmar</p>
                  <p className="mt-1 text-xs">Se conservan para gestión interna, pero no aparecen en Insights ni en archivos por autor. Selecciona a una persona arriba sólo si confirmas su participación y defines si tuvo autoría o sólo relación profesional.</p>
                  <p className="mt-2">{legacyAuthorRelations.map((relation) => relation.member.name).join(", ")}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={exitToList}>Cancelar</Button>
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
