import { useState, useRef, useEffect } from "react";
import { AdminPageHelp } from "@/components/admin/AdminPageHelp";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAdminAuth, adminApiRequest, getAuthHeaders } from "@/lib/adminAuth";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Trash2, Pencil, Link as LinkIcon, ChevronUp, ChevronDown, PlusCircle, Image } from "lucide-react";
import type { OfficeImage } from "@shared/schema";

export default function GalleryAdmin() {
  const { isAuthenticated, isLoading: authLoading, requireAuth } = useAdminAuth();

  useEffect(() => {
    requireAuth();
  }, [requireAuth]);
  const { toast } = useToast();

  const [urlMode, setUrlMode] = useState(false);
  const [externalUrl, setExternalUrl] = useState("");
  const [altEn, setAltEn] = useState("");
  const [altEs, setAltEs] = useState("");
  const [orderInput, setOrderInput] = useState("0");
  const [editingImage, setEditingImage] = useState<OfficeImage | null>(null);
  const [editAltEn, setEditAltEn] = useState("");
  const [editAltEs, setEditAltEs] = useState("");
  const [editOrder, setEditOrder] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: images = [], isLoading } = useQuery<OfficeImage[]>({
    queryKey: ["/api/office-images"],
    enabled: isAuthenticated,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { imageUrl: string; alt: string; altEs: string; order: number }) => {
      const res = await adminApiRequest("POST", "/api/admin/office-images", data);
      if (!res.ok) throw new Error("No se pudo agregar la imagen");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/office-images"] });
      setExternalUrl("");
      setAltEn("");
      setAltEs("");
      setOrderInput("0");
      toast({ title: "Imagen agregada" });
    },
    onError: () => toast({ title: "No se pudo agregar la imagen", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<OfficeImage> }) => {
      const res = await adminApiRequest("PATCH", `/api/admin/office-images/${id}`, data);
      if (!res.ok) throw new Error("No se pudo actualizar la imagen");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/office-images"] });
      setEditingImage(null);
      toast({ title: "Imagen actualizada" });
    },
    onError: () => toast({ title: "No se pudo actualizar la imagen", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await adminApiRequest("DELETE", `/api/admin/office-images/${id}`);
      if (!res.ok) throw new Error("No se pudo eliminar la imagen");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/office-images"] });
      setDeleteConfirmId(null);
      toast({ title: "Imagen eliminada" });
    },
    onError: () => toast({ title: "No se pudo eliminar la imagen", variant: "destructive" }),
  });

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (altEn) formData.append("alt", altEn);
      if (altEs) formData.append("altEs", altEs);

      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: formData,
      });

      if (!res.ok) throw new Error("Falló la subida");
      const mediaItem = await res.json();

      await createMutation.mutateAsync({
        imageUrl: mediaItem.path,
        alt: altEn,
        altEs: altEs,
        order: parseInt(orderInput) || 0,
      });
    } catch {
      toast({ title: "Falló la subida", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleAddFromUrl = () => {
    if (!externalUrl.trim()) return;
    createMutation.mutate({
      imageUrl: externalUrl.trim(),
      alt: altEn,
      altEs: altEs,
      order: parseInt(orderInput) || 0,
    });
  };

  const handleMoveUp = (img: OfficeImage) => {
    const sorted = [...images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const idx = sorted.findIndex((i) => i.id === img.id);
    if (idx <= 0) return;
    const prev = sorted[idx - 1];
    updateMutation.mutate({ id: img.id, data: { order: prev.order ?? 0 } });
    updateMutation.mutate({ id: prev.id, data: { order: img.order ?? 0 } });
  };

  const handleMoveDown = (img: OfficeImage) => {
    const sorted = [...images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const idx = sorted.findIndex((i) => i.id === img.id);
    if (idx >= sorted.length - 1) return;
    const next = sorted[idx + 1];
    updateMutation.mutate({ id: img.id, data: { order: next.order ?? 0 } });
    updateMutation.mutate({ id: next.id, data: { order: img.order ?? 0 } });
  };

  const openEdit = (img: OfficeImage) => {
    setEditingImage(img);
    setEditAltEn(img.alt || "");
    setEditAltEs(img.altEs || "");
    setEditOrder(String(img.order ?? 0));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-12 w-40" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const sortedImages = [...images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/dashboard">
            <a className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Volver al panel
            </a>
          </Link>
          <div className="w-12 h-px bg-[#AA1A2E] mb-3" />
          <h1 className="font-heading font-light text-foreground text-3xl uppercase tracking-[0.12em]">
            GALERÍA DE OFICINAS
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Administra la galería de fotos de la oficina: sube, reordena y elimina imágenes.
          </p>
        </div>


        <AdminPageHelp>Sube y ordena las fotos de la galería de oficinas del sitio público. Arrástralas o usa las flechas para cambiar el orden.</AdminPageHelp>
        {/* Add Image Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-[0.1em]">
              <PlusCircle className="w-4 h-4 text-[#AA1A2E]" />
              Agregar imagen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mode toggle */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={!urlMode ? "default" : "outline"}
                onClick={() => setUrlMode(false)}
                data-testid="button-upload-mode"
              >
                <Upload className="w-3 h-3 mr-1" />
                Subir archivo
              </Button>
              <Button
                size="sm"
                variant={urlMode ? "default" : "outline"}
                onClick={() => setUrlMode(true)}
                data-testid="button-url-mode"
              >
                <LinkIcon className="w-3 h-3 mr-1" />
                URL externa
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.1em] text-muted-foreground">Texto alternativo (EN)</label>
                <Input
                  value={altEn}
                  onChange={(e) => setAltEn(e.target.value)}
                  placeholder="Vista interior de la oficina"
                  data-testid="input-alt-en"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.1em] text-muted-foreground">Texto alternativo (ES)</label>
                <Input
                  value={altEs}
                  onChange={(e) => setAltEs(e.target.value)}
                  placeholder="Vista interior de oficina"
                  data-testid="input-alt-es"
                />
              </div>
            </div>

            <div className="space-y-1 max-w-[120px]">
              <label className="text-xs uppercase tracking-[0.1em] text-muted-foreground">Orden</label>
              <Input
                type="number"
                value={orderInput}
                onChange={(e) => setOrderInput(e.target.value)}
                data-testid="input-order"
              />
            </div>

            {urlMode ? (
              <div className="flex gap-2">
                <Input
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="flex-1"
                  data-testid="input-external-url"
                />
                <Button
                  onClick={handleAddFromUrl}
                  disabled={!externalUrl.trim() || createMutation.isPending}
                  data-testid="button-add-url"
                >
                  Agregar
                </Button>
              </div>
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  data-testid="input-file-upload"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  data-testid="button-select-file"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? "Subiendo…" : "Seleccionar y subir archivo"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Image Grid */}
        <div>
          <h2 className="text-sm uppercase tracking-[0.12em] text-muted-foreground mb-4">
            Imágenes de la galería ({images.length})
          </h2>

          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-52" />
              ))}
            </div>
          )}

          {!isLoading && images.length === 0 && (
            <Card>
              <CardContent className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
                <Image className="w-8 h-8 opacity-30" />
                <p className="text-sm">Aún no hay imágenes. Agrega tu primera foto arriba.</p>
              </CardContent>
            </Card>
          )}

          {!isLoading && sortedImages.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedImages.map((img, idx) => (
                <Card key={img.id} data-testid={`gallery-card-${img.id}`}>
                  <CardContent className="p-0">
                    {/* Thumbnail */}
                    <div className="relative h-44 overflow-hidden">
                      <img
                        src={img.imageUrl}
                        alt={img.alt || img.altEs || ""}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 tracking-widest">
                        #{img.order ?? idx}
                      </div>
                    </div>

                    {/* Info + Actions */}
                    <div className="p-3 space-y-2">
                      <div className="text-xs text-muted-foreground truncate" title={img.imageUrl}>
                        {img.imageUrl.length > 50 ? "…" + img.imageUrl.slice(-40) : img.imageUrl}
                      </div>
                      {img.alt && (
                        <div className="text-xs text-foreground truncate">{img.alt}</div>
                      )}

                      <div className="flex items-center gap-1 flex-wrap">
                        {/* Move up/down */}
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleMoveUp(img)}
                          disabled={idx === 0 || updateMutation.isPending}
                          aria-label="Subir"
                          data-testid={`button-move-up-${img.id}`}
                        >
                          <ChevronUp className="w-3 h-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleMoveDown(img)}
                          disabled={idx === sortedImages.length - 1 || updateMutation.isPending}
                          aria-label="Bajar"
                          data-testid={`button-move-down-${img.id}`}
                        >
                          <ChevronDown className="w-3 h-3" />
                        </Button>

                        {/* Edit */}
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => openEdit(img)}
                          aria-label="Editar"
                          data-testid={`button-edit-${img.id}`}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>

                        {/* Delete */}
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => setDeleteConfirmId(img.id)}
                          aria-label="Eliminar"
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
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingImage} onOpenChange={(open) => !open && setEditingImage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar imagen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {editingImage && (
              <div className="h-32 overflow-hidden">
                <img
                  src={editingImage.imageUrl}
                  alt={editingImage.alt || ""}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-[0.1em] text-muted-foreground">Texto alternativo (EN)</label>
              <Input
                value={editAltEn}
                onChange={(e) => setEditAltEn(e.target.value)}
                data-testid="input-edit-alt-en"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-[0.1em] text-muted-foreground">Texto alternativo (ES)</label>
              <Input
                value={editAltEs}
                onChange={(e) => setEditAltEs(e.target.value)}
                data-testid="input-edit-alt-es"
              />
            </div>
            <div className="space-y-1 max-w-[120px]">
              <label className="text-xs uppercase tracking-[0.1em] text-muted-foreground">Orden</label>
              <Input
                type="number"
                value={editOrder}
                onChange={(e) => setEditOrder(e.target.value)}
                data-testid="input-edit-order"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingImage(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!editingImage) return;
                updateMutation.mutate({
                  id: editingImage.id,
                  data: {
                    alt: editAltEn,
                    altEs: editAltEs,
                    order: parseInt(editOrder) || 0,
                  },
                });
              }}
              disabled={updateMutation.isPending}
              data-testid="button-save-edit"
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar imagen</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm py-2">
            ¿Seguro que quieres eliminar esta imagen? Esta acción no se puede deshacer.
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
