import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Film, Image as ImageIcon, Search } from "lucide-react";
import { adminApiRequest } from "@/lib/adminAuth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type MediaLibraryItem = {
  id: string;
  filename: string;
  originalName: string;
  path: string;
  mimeType: string;
  size?: number | null;
  alt?: string | null;
  altEs?: string | null;
  createdAt?: string | null;
  sourceLabel?: string | null;
};

const SUPPORTED_LIBRARY_MIMES = {
  image: new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]),
  video: new Set(["video/mp4", "video/webm", "video/ogg", "video/quicktime"]),
};

function readableSize(bytes?: number | null): string {
  if (!bytes || bytes < 1) return "Tamaño no disponible";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readableDate(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export function MediaLibraryPicker({
  open,
  onOpenChange,
  kind,
  currentValue,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: "image" | "video";
  currentValue: string;
  onSelect: (path: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedPath, setSelectedPath] = useState(currentValue);
  const isVideo = kind === "video";

  useEffect(() => {
    if (open) {
      setSearch("");
      setSelectedPath(currentValue);
    }
  }, [currentValue, open]);

  const mediaQuery = useQuery<MediaLibraryItem[]>({
    queryKey: ["/api/admin/media"],
    queryFn: async () => {
      const response = await adminApiRequest("GET", "/api/admin/media");
      if (!response.ok) throw new Error("No se pudo abrir la biblioteca de medios.");
      return response.json();
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const items = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es");
    return (mediaQuery.data || [])
      .filter((item) => SUPPORTED_LIBRARY_MIMES[kind].has(item.mimeType))
      .filter((item) => {
        if (!term) return true;
        return [item.originalName, item.filename, item.alt, item.altEs]
          .filter(Boolean)
          .some((value) => String(value).toLocaleLowerCase("es").includes(term));
      });
  }, [kind, mediaQuery.data, search]);

  const choose = () => {
    if (!selectedPath) return;
    onSelect(selectedPath);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-5xl overflow-hidden p-0">
        <DialogHeader className="border-b px-6 pb-5 pt-6 pr-14">
          <DialogTitle>Biblioteca de {isVideo ? "videos" : "imágenes"}</DialogTitle>
          <DialogDescription>
            Reutiliza un archivo que ya fue cargado al panel. El archivo original no se duplica ni se modifica.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Buscar ${isVideo ? "videos" : "imágenes"} por nombre`}
              className="pl-9"
              aria-label={`Buscar ${isVideo ? "videos" : "imágenes"}`}
              data-testid="input-media-library-search"
            />
          </div>

          <ScrollArea className="h-[min(56dvh,560px)] pr-4">
            {mediaQuery.isLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-label="Cargando archivos">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                    <Skeleton className="h-3 w-4/5" />
                    <Skeleton className="h-3 w-2/5" />
                  </div>
                ))}
              </div>
            ) : mediaQuery.isError ? (
              <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-6 text-center">
                <p className="text-sm font-medium text-destructive">No fue posible cargar la biblioteca.</p>
                <Button type="button" variant="outline" size="sm" onClick={() => mediaQuery.refetch()}>
                  Intentar de nuevo
                </Button>
              </div>
            ) : items.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed px-6 text-center">
                {isVideo ? <Film className="mb-3 h-7 w-7 text-muted-foreground" /> : <ImageIcon className="mb-3 h-7 w-7 text-muted-foreground" />}
                <p className="text-sm font-medium">{search ? "No hay coincidencias" : `Todavía no hay ${isVideo ? "videos" : "imágenes"} reutilizables`}</p>
                <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                  {search ? "Prueba con otro nombre." : "Los archivos que subas desde el panel aparecerán aquí automáticamente."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pb-1 sm:grid-cols-3 lg:grid-cols-4">
                {items.map((item) => {
                  const selected = selectedPath === item.path;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedPath(item.path)}
                      aria-pressed={selected}
                      className={cn(
                        "group overflow-hidden rounded-lg border bg-card text-left transition-[border-color,box-shadow,transform] duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        selected ? "border-primary ring-1 ring-primary" : "border-border hover:border-muted-foreground/50",
                      )}
                      data-testid={`media-library-item-${item.id}`}
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                        {isVideo ? (
                          <>
                            <video src={item.path} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                            <span className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-card/90 px-2 py-1 text-[10px] font-medium text-foreground" aria-hidden="true">
                              <Film className="h-3 w-3" /> Video
                            </span>
                          </>
                        ) : (
                          <img src={item.path} alt={item.altEs || item.alt || item.originalName} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]" loading="lazy" />
                        )}
                        {selected && (
                          <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-label="Seleccionado">
                            <Check className="h-4 w-4" />
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 px-3 py-2.5">
                        <p className="truncate text-xs font-medium" title={item.originalName}>{item.originalName}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {[item.sourceLabel, readableSize(item.size), readableDate(item.createdAt)].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="button" onClick={choose} disabled={!selectedPath || selectedPath === currentValue} data-testid="button-use-library-media">
            Usar archivo seleccionado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
