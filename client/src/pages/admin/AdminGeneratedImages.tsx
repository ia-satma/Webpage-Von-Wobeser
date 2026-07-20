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
import { Sparkles, Copy, Trash2, ExternalLink, ImageOff, Download } from "lucide-react";
import { Link } from "wouter";
import { downloadHref } from "@/components/admin/ImageUpload";

interface GeneratedImageRow {
  id: string;
  imageUrl: string;
  prompt: string | null;
  sanitizedPrompt: string | null;
  engine: string;
  articleId: string | null;
  articleTitle: string | null;
  articleSlug: string | null;
  createdAt: string | null;
}

const ENGINE_LABELS: Record<string, string> = {
  cloudflare: "Cloudflare (gratis)",
  gemini: "Gemini",
  dalle3: "DALL-E 3",
};

export default function AdminGeneratedImages() {
  const { isAuthenticated, isLoading: authLoading, requireAuth } = useAdminAuth();

  useEffect(() => {
    requireAuth();
  }, [requireAuth]);
  const { toast } = useToast();

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: images = [], isLoading } = useQuery<GeneratedImageRow[]>({
    queryKey: ["/api/admin/generated-images"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await adminApiRequest("GET", "/api/admin/generated-images");
      if (!res.ok) throw new Error("No se pudo cargar el historial de imágenes.");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await adminApiRequest("DELETE", `/api/admin/generated-images/${id}`);
      if (!res.ok) throw new Error("No se pudo eliminar la imagen");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/generated-images"] });
      setDeleteConfirmId(null);
      toast({ title: "Imagen eliminada del historial" });
    },
    onError: () => toast({ title: "No se pudo eliminar la imagen", variant: "destructive" }),
  });

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "URL copiada", description: "Pégala en \"…o pega una URL / ruta\" al elegir imagen en cualquier formulario." });
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
          title="IMÁGENES GENERADAS POR IA"
          description="Historial de imágenes que el agente de imágenes ha generado para las noticias. Reutilízalas copiando su URL."
          icon={Sparkles}
        />

        <AdminPageHelp pageId="generated-images">
          Cada vez que el agente de imágenes genera una imagen para una noticia (no cuenta el placeholder de respaldo), queda guardada aquí.
          Copia la URL de cualquiera y pégala en el campo "…o pega una URL / ruta" de la imagen destacada de otra noticia para reutilizarla sin gastar créditos de nuevo.
        </AdminPageHelp>

        <div>
          <h2 className="text-sm uppercase tracking-[0.12em] text-muted-foreground mb-4">
            Imágenes generadas ({images.length})
          </h2>

          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          )}

          {!isLoading && images.length === 0 && (
            <Card>
              <CardContent className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
                <ImageOff className="w-8 h-8 opacity-30" />
                <p className="text-sm">Aún no se ha generado ninguna imagen con IA.</p>
                <p className="text-xs">Se llenará automáticamente cuando el agente de imágenes genere una para una noticia.</p>
              </CardContent>
            </Card>
          )}

          {!isLoading && images.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((img) => (
                <Card key={img.id} data-testid={`generated-image-card-${img.id}`}>
                  <CardContent className="p-0">
                    <div className="relative h-44 overflow-hidden bg-muted">
                      <img
                        src={img.imageUrl}
                        alt={img.prompt || "Imagen generada por IA"}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <Badge className="absolute top-2 left-2" variant="secondary">
                        {ENGINE_LABELS[img.engine] || img.engine}
                      </Badge>
                    </div>

                    <div className="p-3 space-y-2">
                      {img.prompt && (
                        <p className="text-xs text-foreground line-clamp-2" title={img.prompt}>
                          {img.prompt}
                        </p>
                      )}

                      <div className="text-xs text-muted-foreground">
                        {img.createdAt ? new Date(img.createdAt).toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" }) : ""}
                      </div>

                      {img.articleId && img.articleTitle ? (
                        <Link
                          href={`/admin/news/${img.articleId}/edit`}
                          className="text-xs text-primary hover:underline flex items-center gap-1 truncate"
                          data-testid={`link-article-${img.id}`}
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          <span className="truncate">{img.articleTitle}</span>
                        </Link>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Noticia original eliminada</p>
                      )}

                      <div className="flex items-center gap-1 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyUrl(img.imageUrl)}
                          data-testid={`button-copy-${img.id}`}
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copiar URL
                        </Button>
                        <Button asChild size="sm" variant="outline" data-testid={`button-download-${img.id}`}>
                          <a
                            href={downloadHref(img.imageUrl)}
                            download={img.imageUrl.split("?")[0].split("/").pop() || "imagen.png"}
                            rel="noopener noreferrer"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Descargar
                          </a>
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => setDeleteConfirmId(img.id)}
                          aria-label="Eliminar del historial"
                          data-testid={`button-delete-${img.id}`}
                          className="text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
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
            Esto solo quita la imagen de este historial — no borra el archivo ni afecta a la noticia que la esté usando actualmente. No se puede deshacer.
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
