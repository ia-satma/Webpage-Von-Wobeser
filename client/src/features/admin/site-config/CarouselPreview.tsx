import { ArrowUpRight, ImageIcon, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CarouselGroup } from "./contracts";
import { visibleCarouselItems } from "./helpers";

interface CarouselCollectionProps {
  title: string;
  items?: CarouselGroup[];
  loading: boolean;
  error: unknown;
  manageHref: string;
}

function CarouselCollection({
  title,
  items,
  loading,
  error,
  manageHref,
}: CarouselCollectionProps) {
  const visibleItems = visibleCarouselItems(items);
  const imageCount = visibleItems.filter((item) => item.imageUrl).length;
  return (
    <section className="space-y-3" aria-label={`Imágenes del carrusel de ${title.toLowerCase()}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-medium">{title}</h3>
          {!loading && !error && (
            <p className="text-xs text-muted-foreground">
              {imageCount} de {visibleItems.length} tarjetas con imagen
            </p>
          )}
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={manageHref}>
            Administrar <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 rounded-lg border p-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando imágenes…
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          No fue posible cargar estas imágenes. Puedes administrarlas desde el botón superior.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visibleItems.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-lg border bg-card">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={`Imagen del carrusel de ${item.nameEs || item.name}`}
                  loading="lazy"
                  className="h-24 w-full object-cover"
                />
              ) : (
                <div className="flex h-24 items-center justify-center gap-2 bg-muted text-xs text-muted-foreground">
                  <ImageIcon className="h-4 w-4" /> Sin imagen
                </div>
              )}
              <p className="line-clamp-2 min-h-12 px-3 py-2 text-xs font-medium">
                {item.nameEs || item.name}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

interface CarouselPreviewProps {
  practice: { data?: CarouselGroup[]; isLoading: boolean; error: unknown };
  industry: { data?: CarouselGroup[]; isLoading: boolean; error: unknown };
}

export function CarouselPreview({ practice, industry }: CarouselPreviewProps) {
  return (
    <Card className="mb-5">
      <CardHeader>
        <CardTitle className="text-base">Imágenes actuales de los carruseles</CardTitle>
        <CardDescription>
          Vista previa de las imágenes publicadas en la portada. Para sustituir una imagen, usa “Administrar” en la sección correspondiente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <CarouselCollection
          title="Prácticas"
          items={practice.data}
          loading={practice.isLoading}
          error={practice.error}
          manageHref="/admin/practice-groups"
        />
        <CarouselCollection
          title="Grupos de práctica por industria"
          items={industry.data}
          loading={industry.isLoading}
          error={industry.error}
          manageHref="/admin/industry-groups"
        />
      </CardContent>
    </Card>
  );
}
