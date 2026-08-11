import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, Users } from "lucide-react";
import { adminApiRequest, useAdminAuth } from "@/lib/adminAuth";
import { queryClient } from "@/lib/queryClient";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPageHelp } from "@/components/admin/AdminPageHelp";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

type Candidate = { id: string; name: string; evidence: string };
type ReviewItem = {
  id: string;
  titleEs: string;
  title: string;
  category: string | null;
  published: boolean | null;
  authorCandidates: Candidate[];
};
type ReviewResponse = { news: ReviewItem[]; total: number; page: number; totalPages: number };

const PAGE_SIZE = 12;

/** Revisión explícita del histórico: las sugerencias no escriben nada hasta confirmarse. */
export default function AdminNewsAuthorReview() {
  const { isAuthenticated, isLoading: authLoading, requireAuth } = useAdminAuth();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [selections, setSelections] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!authLoading) requireAuth();
  }, [authLoading, requireAuth]);

  const reviewQuery = useQuery<ReviewResponse>({
    queryKey: ["/api/admin/news/author-review", page],
    queryFn: async () => {
      const response = await adminApiRequest("GET", `/api/admin/news/author-review?page=${page}&limit=${PAGE_SIZE}`);
      if (!response.ok) throw new Error("No se pudo cargar la revisión de autores.");
      return response.json();
    },
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!reviewQuery.data) return;
    setSelections((current) => {
      const next = { ...current };
      for (const item of reviewQuery.data.news) {
        if (!(item.id in next)) next[item.id] = item.authorCandidates.map((candidate) => candidate.id);
      }
      return next;
    });
  }, [reviewQuery.data]);

  const applyMutation = useMutation({
    mutationFn: async ({ newsId, teamMemberIds }: { newsId: string; teamMemberIds: string[] }) => {
      const response = await adminApiRequest("PUT", `/api/admin/news/${newsId}/team-members`, { teamMemberIds });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "No se pudo guardar la relación.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/news/author-review"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/news"] });
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({ title: "Relación guardada", description: "La publicación ya aparecerá en el perfil de las personas aprobadas." });
    },
    onError: (error: Error) => toast({ title: "No se guardó", description: error.message, variant: "destructive" }),
  });

  const toggleCandidate = (newsId: string, candidateId: string, checked: boolean) => {
    setSelections((current) => {
      const selected = current[newsId] || [];
      return {
        ...current,
        [newsId]: checked
          ? (selected.includes(candidateId) ? selected : [...selected, candidateId])
          : selected.filter((id) => id !== candidateId),
      };
    });
  };

  if (authLoading || !isAuthenticated) return null;
  const data = reviewQuery.data;

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminPageHeader
          title="Revisar autores sugeridos"
          icon={Users}
          actions={<Link href="/admin/news"><Button variant="outline" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />Volver a publicaciones</Button></Link>}
        />
        <AdminPageHelp pageId="noticias" manualSectionId="noticias">
          Estas son coincidencias por nombre encontradas en publicaciones que aún no tienen abogados vinculados. Revisa la evidencia y confirma solo los autores correctos; ninguna sugerencia se publica automáticamente.
        </AdminPageHelp>

        {reviewQuery.isLoading ? (
          <div className="space-y-4">{[1, 2, 3].map((key) => <Skeleton key={key} className="h-44 w-full" />)}</div>
        ) : reviewQuery.isError ? (
          <Card><CardContent className="py-10 text-center text-destructive">No fue posible cargar la cola de revisión.</CardContent></Card>
        ) : data?.news.length === 0 ? (
          <Card><CardContent className="py-12 text-center"><p className="font-medium">No hay publicaciones pendientes de vincular.</p><p className="mt-2 text-sm text-muted-foreground">Las publicaciones nuevas se etiquetan directamente desde su formulario.</p></CardContent></Card>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground" data-testid="text-author-review-total">{data?.total ?? 0} publicaciones sin abogados vinculados.</p>
            {data?.news.map((item) => {
              const selected = selections[item.id] || [];
              return (
                <Card key={item.id} data-testid={`author-review-${item.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-base leading-snug">{item.titleEs || item.title}</CardTitle>
                        <div className="mt-2 flex gap-2">
                          <Badge variant="outline">{item.category || "Sin categoría"}</Badge>
                          <Badge variant={item.published ? "default" : "secondary"}>{item.published ? "Publicada" : "Borrador"}</Badge>
                        </div>
                      </div>
                      <Link href={`/admin/news/${item.id}/edit`}><Button variant="outline" size="sm">Abrir editor</Button></Link>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {item.authorCandidates.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No encontramos una coincidencia segura. Puedes asignar abogados manualmente desde el editor.</p>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">Selecciona únicamente a las personas que realmente participan en esta publicación.</p>
                        <div className="space-y-3 rounded-md border p-3">
                          {item.authorCandidates.map((candidate) => (
                            <label key={candidate.id} className="block cursor-pointer rounded-sm p-1 hover:bg-muted">
                              <span className="flex items-center gap-2 font-medium text-sm">
                                <Checkbox
                                  checked={selected.includes(candidate.id)}
                                  onCheckedChange={(checked) => toggleCandidate(item.id, candidate.id, !!checked)}
                                  data-testid={`author-review-checkbox-${item.id}-${candidate.id}`}
                                />
                                {candidate.name}
                              </span>
                              <span className="mt-1 block pl-6 text-xs leading-relaxed text-muted-foreground">“…{candidate.evidence}…”</span>
                            </label>
                          ))}
                        </div>
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            disabled={selected.length === 0 || applyMutation.isPending}
                            onClick={() => applyMutation.mutate({ newsId: item.id, teamMemberIds: selected })}
                            data-testid={`button-approve-authors-${item.id}`}
                          >
                            <Check className="mr-2 h-4 w-4" />Confirmar vínculos
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            {(data?.totalPages || 1) > 1 && (
              <div className="flex items-center justify-between border-t pt-5">
                <Button variant="outline" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>Anterior</Button>
                <span className="text-sm text-muted-foreground">Página {data?.page} de {data?.totalPages}</span>
                <Button variant="outline" disabled={page === data?.totalPages} onClick={() => setPage((current) => current + 1)}>Siguiente</Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
