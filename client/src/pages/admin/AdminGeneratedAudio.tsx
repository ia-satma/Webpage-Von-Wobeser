import { useEffect, useState } from "react";
import { AdminPageHelp } from "@/components/admin/AdminPageHelp";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAdminAuth, adminApiRequest } from "@/lib/adminAuth";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Volume2, Copy, Trash2, ExternalLink, VolumeX } from "lucide-react";
import { Link } from "wouter";

interface GeneratedAudioRow {
  id: string;
  audioUrl: string;
  sourceText: string | null;
  voiceId: string | null;
  engine: string;
  sourceType: string;
  articleId: string | null;
  articleTitle: string | null;
  articleSlug: string | null;
  createdAt: string | null;
}

const ENGINE_LABELS: Record<string, string> = {
  openai_tts: "OpenAI TTS",
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  newsletter: "Boletín",
  social_media: "Redes sociales",
  legal_alerts: "Alerta legal",
};

export default function AdminGeneratedAudio() {
  const { isAuthenticated, isLoading: authLoading, requireAuth } = useAdminAuth();

  useEffect(() => {
    requireAuth();
  }, [requireAuth]);
  const { toast } = useToast();

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: audios = [], isLoading } = useQuery<GeneratedAudioRow[]>({
    queryKey: ["/api/admin/generated-audio"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await adminApiRequest("GET", "/api/admin/generated-audio");
      if (!res.ok) throw new Error("No se pudo cargar el historial de audio.");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await adminApiRequest("DELETE", `/api/admin/generated-audio/${id}`);
      if (!res.ok) throw new Error("No se pudo eliminar el audio");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/generated-audio"] });
      setDeleteConfirmId(null);
      toast({ title: "Audio eliminado del historial" });
    },
    onError: () => toast({ title: "No se pudo eliminar el audio", variant: "destructive" }),
  });

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "URL copiada" });
    } catch {
      toast({ title: "No se pudo copiar la URL", variant: "destructive" });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-12 w-40" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-6xl mx-auto px-6 py-10">
        <AdminPageHeader
          title="AUDIO GENERADO POR IA"
          description="Historial de audio que el agente de voz (OpenAI TTS) ha generado a partir del boletín, posts de redes y alertas legales."
          icon={Volume2}
        />

        <AdminPageHelp pageId="generated-audio">
          Cada vez que usas "Generar audio" desde el boletín, un post de redes o una alerta legal, el archivo queda guardado aquí.
          Copia la URL para reutilizarla o descárgala directamente desde el reproductor.
        </AdminPageHelp>

        <div>
          <h2 className="text-sm uppercase tracking-[0.12em] text-muted-foreground mb-4">
            Audio generado ({audios.length})
          </h2>

          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          )}

          {!isLoading && audios.length === 0 && (
            <Card>
              <CardContent className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
                <VolumeX className="w-8 h-8 opacity-30" />
                <p className="text-sm">Aún no se ha generado ningún audio con IA.</p>
                <p className="text-xs">Usa el botón "Generar audio" en el boletín, un post de redes o una alerta legal.</p>
              </CardContent>
            </Card>
          )}

          {!isLoading && audios.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {audios.map((audio) => (
                <Card key={audio.id} data-testid={`generated-audio-card-${audio.id}`}>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{ENGINE_LABELS[audio.engine] || audio.engine}</Badge>
                      <Badge variant="outline">{SOURCE_TYPE_LABELS[audio.sourceType] || audio.sourceType}</Badge>
                    </div>

                    <audio controls src={audio.audioUrl} className="w-full" data-testid={`audio-player-${audio.id}`} />

                    {audio.sourceText && (
                      <p className="text-xs text-foreground line-clamp-2" title={audio.sourceText}>
                        {audio.sourceText}
                      </p>
                    )}

                    <div className="text-xs text-muted-foreground">
                      {audio.createdAt ? new Date(audio.createdAt).toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" }) : ""}
                    </div>

                    {audio.articleId && audio.articleTitle ? (
                      <Link
                        href={`/admin/news/${audio.articleId}/edit`}
                        className="text-xs text-primary hover:underline flex items-center gap-1 truncate"
                        data-testid={`link-article-${audio.id}`}
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">{audio.articleTitle}</span>
                      </Link>
                    ) : null}

                    <div className="flex items-center gap-1 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyUrl(audio.audioUrl)}
                        data-testid={`button-copy-${audio.id}`}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copiar URL
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setDeleteConfirmId(audio.id)}
                        aria-label="Eliminar del historial"
                        data-testid={`button-delete-${audio.id}`}
                        className="text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar del historial</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm py-2">
            Esto solo quita el audio de este historial — no afecta a lo que ya se haya compartido. No se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
