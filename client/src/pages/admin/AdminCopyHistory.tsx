import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Archive, ArchiveRestore, Check, ClipboardCopy, FileText, Filter, History, Search, X } from "lucide-react";
import { AGENT_DEFINITIONS } from "@shared/agentConstants";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPageHelp } from "@/components/admin/AdminPageHelp";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { adminApiRequest, useAdminAuth } from "@/lib/adminAuth";
import { queryClient } from "@/lib/queryClient";

type CopyStatus = "proposal" | "applied" | "draft" | "recovered";

interface CopyListItem {
  id: string;
  sourceJobId: string | null;
  agentType: string;
  copyType: string;
  title: string;
  excerpt: string | null;
  language: string;
  articleId: string | null;
  articleTitle: string | null;
  articleTitleEs: string | null;
  articleSlug: string | null;
  status: CopyStatus;
  origin: string;
  archived: boolean;
  createdAt: string;
  actorName: string | null;
}

interface CopyListResponse {
  items: CopyListItem[];
  page: number;
  pageSize: number;
  total: number;
}

interface CopyDetail extends CopyListItem {
  content: Record<string, unknown>;
  plainText: string;
  archivedAt: string | null;
}

interface ArticleOption {
  id: string;
  title?: string | null;
  titleEs?: string | null;
}

const STATUS_LABEL: Record<CopyStatus, string> = {
  proposal: "Propuesta",
  applied: "Aplicado",
  draft: "Borrador",
  recovered: "Recuperado",
};

const AGENT_LABEL = Object.fromEntries(AGENT_DEFINITIONS.map((agent) => [agent.id, agent.name]));

function formatDate(value: string | null | undefined): string {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Sin fecha" : date.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminCopyHistory() {
  const { isAuthenticated, isLoading: authLoading, requireAuth } = useAdminAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [agentType, setAgentType] = useState("all");
  const [status, setStatus] = useState<"all" | CopyStatus>("all");
  const [language, setLanguage] = useState("all");
  const [articleId, setArticleId] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    requireAuth();
  }, [requireAuth]);

  const selectedId = useMemo(() => new URLSearchParams(location.split("?")[1] || "").get("copy"), [location]);
  const queryString = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: "25", archived: String(showArchived) });
    if (search.trim()) params.set("search", search.trim());
    if (agentType !== "all") params.set("agentType", agentType);
    if (status !== "all") params.set("status", status);
    if (language !== "all") params.set("language", language);
    if (articleId !== "all") params.set("articleId", articleId);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return params.toString();
  }, [agentType, articleId, from, language, page, search, showArchived, status, to]);

  const copiesQuery = useQuery<CopyListResponse>({
    queryKey: ["/api/admin/copies-ai", queryString],
    enabled: isAuthenticated,
    queryFn: async () => {
      const response = await adminApiRequest("GET", `/api/admin/copies-ai?${queryString}`);
      if (!response.ok) throw new Error("No se pudo cargar el historial de copys.");
      return response.json();
    },
  });

  const articlesQuery = useQuery<{ news: ArticleOption[] }>({
    queryKey: ["/api/admin/news", "copy-history"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const response = await adminApiRequest("GET", "/api/admin/news?page=1&limit=100");
      if (!response.ok) throw new Error("No se pudieron cargar las publicaciones.");
      return response.json();
    },
  });

  const detailQuery = useQuery<CopyDetail>({
    queryKey: ["/api/admin/copies-ai", selectedId],
    enabled: isAuthenticated && Boolean(selectedId),
    queryFn: async () => {
      const response = await adminApiRequest("GET", `/api/admin/copies-ai/${selectedId}`);
      if (!response.ok) throw new Error("No se pudo cargar el copy seleccionado.");
      return response.json();
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const response = await adminApiRequest("POST", `/api/admin/copies-ai/${id}/archive`, { archived });
      if (!response.ok) throw new Error("No se pudo actualizar la visibilidad del copy.");
      return response.json() as Promise<{ archived: boolean }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/copies-ai"] });
      toast({ title: data.archived ? "Copy archivado" : "Copy restaurado", description: "La instantánea se conserva de forma permanente." });
    },
    onError: (error) => toast({ title: "No se pudo actualizar el copy", description: String(error), variant: "destructive" }),
  });

  const resetFilters = () => {
    setSearch("");
    setAgentType("all");
    setStatus("all");
    setLanguage("all");
    setArticleId("all");
    setFrom("");
    setTo("");
    setShowArchived(false);
    setPage(1);
  };

  const copyToClipboard = async () => {
    if (!detailQuery.data?.plainText) return;
    try {
      await navigator.clipboard.writeText(detailQuery.data.plainText);
      toast({ title: "Copy copiado", description: "Puedes pegarlo y editarlo donde lo necesites." });
    } catch {
      toast({ title: "No se pudo copiar", description: "Tu navegador no permitió usar el portapapeles.", variant: "destructive" });
    }
  };

  if (authLoading) return <div className="flex min-h-screen items-center justify-center"><Skeleton className="h-12 w-44" /></div>;
  if (!isAuthenticated) return null;

  const copies = copiesQuery.data?.items || [];
  const selected = detailQuery.data;
  const totalPages = Math.max(1, Math.ceil((copiesQuery.data?.total || 0) / 25));

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl px-6 py-10">
        <AdminPageHeader
          title="COPYS IA"
          description="Historial privado, permanente e inmutable de resultados editoriales generados por los agentes de IA."
          icon={History}
          actions={<Badge variant="outline">{copiesQuery.data?.total || 0} registros</Badge>}
        />

        <AdminPageHelp pageId="copies-ai">
          Cada resultado de texto reutilizable queda guardado al terminar un agente. Puedes buscarlo, copiarlo o archivarlo de la vista principal; nunca se publica ni se borra desde aquí.
        </AdminPageHelp>

        <Card className="mb-6">
          <CardContent className="space-y-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold"><Filter className="h-4 w-4 text-primary" /> Filtrar historial</div>
              <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>Limpiar filtros</Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="relative xl:col-span-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} className="pl-9" placeholder="Buscar en título o contenido" aria-label="Buscar copys IA" />
              </div>
              <Select value={agentType} onValueChange={(value) => { setAgentType(value); setPage(1); }}>
                <SelectTrigger><SelectValue placeholder="Agente" /></SelectTrigger>
                <SelectContent><SelectItem value="all">Todos los agentes</SelectItem>{AGENT_DEFINITIONS.filter((agent) => ["formatter", "polyglot_translator", "seo_optimizer", "content_analyzer", "category_agent", "metadata_linker", "social_media", "newsletter", "legal_alerts"].includes(agent.id)).map((agent) => <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={status} onValueChange={(value) => { setStatus(value as "all" | CopyStatus); setPage(1); }}>
                <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
                <SelectContent><SelectItem value="all">Todos los estados</SelectItem>{Object.entries(STATUS_LABEL).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={language} onValueChange={(value) => { setLanguage(value); setPage(1); }}>
                <SelectTrigger><SelectValue placeholder="Idioma" /></SelectTrigger>
                <SelectContent><SelectItem value="all">Todos los idiomas</SelectItem><SelectItem value="es">Español</SelectItem><SelectItem value="en">Inglés</SelectItem><SelectItem value="multi">Multilingüe</SelectItem></SelectContent>
              </Select>
              <Select value={articleId} onValueChange={(value) => { setArticleId(value); setPage(1); }}>
                <SelectTrigger><SelectValue placeholder="Publicación" /></SelectTrigger>
                <SelectContent><SelectItem value="all">Todas las publicaciones</SelectItem>{(articlesQuery.data?.news || []).map((article) => <SelectItem key={article.id} value={article.id}>{article.titleEs || article.title || "Publicación sin título"}</SelectItem>)}</SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} aria-label="Desde fecha" />
                <Input type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} aria-label="Hasta fecha" />
              </div>
              <div className="flex items-center gap-3 rounded-md border px-3">
                <Switch id="copies-ai-archived" checked={showArchived} onCheckedChange={(value) => { setShowArchived(value); setPage(1); }} />
                <Label htmlFor="copies-ai-archived" className="cursor-pointer text-sm">Ver archivados</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
          <section aria-label="Resultados del historial">
            {copiesQuery.isLoading && <div className="space-y-3">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-28 w-full" />)}</div>}
            {copiesQuery.isError && <Card><CardContent className="p-8 text-sm text-destructive">No se pudo cargar el historial. <Button variant="ghost" className="h-auto px-1 py-0 text-destructive underline" onClick={() => void copiesQuery.refetch()}>Reintentar</Button></CardContent></Card>}
            {!copiesQuery.isLoading && !copiesQuery.isError && copies.length === 0 && <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground"><FileText className="h-9 w-9 opacity-35" /><p className="text-sm">No hay copys que coincidan con estos filtros.</p><p className="max-w-md text-xs">Los siguientes resultados completos de los agentes de texto aparecerán aquí automáticamente.</p></CardContent></Card>}
            <div className="space-y-3">
              {copies.map((copy) => (
                <Card key={copy.id} className={`transition-colors ${selectedId === copy.id ? "border-primary" : "hover:border-primary/40"}`}>
                  <CardContent className="p-4">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <button type="button" className="min-w-0 text-left" onClick={() => setLocation(`/admin/copies-ai?copy=${copy.id}`)} data-testid={`button-open-copy-${copy.id}`}>
                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">{AGENT_LABEL[copy.agentType] || copy.agentType}</p>
                        <h2 className="mt-1 line-clamp-2 text-base font-semibold">{copy.title}</h2>
                        {copy.excerpt && <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{copy.excerpt}</p>}
                      </button>
                      <div className="flex shrink-0 flex-wrap gap-1.5"><Badge variant="secondary">{STATUS_LABEL[copy.status]}</Badge><Badge variant="outline">{copy.language}</Badge>{copy.archived && <Badge variant="outline">Archivado</Badge>}</div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
                      <span>{formatDate(copy.createdAt)}</span><span>{copy.origin === "recovered" ? "Recuperado de historial técnico" : copy.actorName || "Sistema"}</span>
                      {copy.articleId && <Link href={`/admin/news/${copy.articleId}/edit`} className="text-primary hover:underline">{copy.articleTitleEs || copy.articleTitle || "Ver publicación"}</Link>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {!copiesQuery.isLoading && (copiesQuery.data?.total || 0) > 25 && <div className="mt-5 flex items-center justify-between"><span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Anterior</Button><Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Siguiente</Button></div></div>}
          </section>

          <aside className="xl:sticky xl:top-6" aria-label="Detalle del copy">
            {!selectedId && <Card><CardContent className="flex min-h-72 flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground"><History className="h-9 w-9 opacity-35" /><p className="text-sm">Selecciona un copy para ver su contenido completo.</p></CardContent></Card>}
            {selectedId && detailQuery.isLoading && <Skeleton className="h-96 w-full" />}
            {selectedId && detailQuery.isError && <Card><CardContent className="space-y-3 p-6 text-sm text-destructive">No se pudo cargar este copy.<Button size="sm" variant="outline" onClick={() => void detailQuery.refetch()}>Reintentar</Button></CardContent></Card>}
            {selected && <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 border-b pb-4"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">{AGENT_LABEL[selected.agentType] || selected.agentType}</p><h2 className="mt-1 text-lg font-semibold leading-tight">{selected.title}</h2></div><Button variant="ghost" size="icon" aria-label="Cerrar detalle" onClick={() => setLocation("/admin/copies-ai")}><X className="h-4 w-4" /></Button></div>
                <div className="mt-4 flex flex-wrap gap-2"><Badge variant="secondary">{STATUS_LABEL[selected.status]}</Badge><Badge variant="outline">{selected.language}</Badge><Badge variant="outline">{formatDate(selected.createdAt)}</Badge></div>
                {selected.articleId && <Link href={`/admin/news/${selected.articleId}/edit`} className="mt-4 block text-sm font-medium text-primary hover:underline">Abrir publicación relacionada</Link>}
                <pre className="mt-5 max-h-[50vh] overflow-auto whitespace-pre-wrap break-words rounded-md border bg-muted/25 p-4 font-sans text-sm leading-relaxed text-foreground">{selected.plainText}</pre>
                <div className="mt-5 flex flex-wrap gap-2"><Button size="sm" onClick={() => void copyToClipboard()}><ClipboardCopy className="mr-2 h-4 w-4" />Copiar texto</Button><Button size="sm" variant="outline" disabled={archiveMutation.isPending} onClick={() => archiveMutation.mutate({ id: selected.id, archived: !selected.archived })}>{selected.archived ? <ArchiveRestore className="mr-2 h-4 w-4" /> : <Archive className="mr-2 h-4 w-4" />}{selected.archived ? "Restaurar vista" : "Archivar"}</Button></div>
                <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />La instantánea no puede editarse ni eliminarse. Archivar solo la oculta de la vista principal.</p>
              </CardContent>
            </Card>}
          </aside>
        </div>
      </main>
    </div>
  );
}
