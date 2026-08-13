import { ArrowUpRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface FirmPreviewProps {
  hasPreviousVersion: boolean;
  restoring: boolean;
  restorePrevious: () => Promise<void>;
}

export function FirmPreview({
  hasPreviousVersion,
  restoring,
  restorePrevious,
}: FirmPreviewProps) {
  return (
    <Card className="mb-5">
      <CardHeader>
        <CardTitle className="text-base">Landing institucional</CardTitle>
        <CardDescription>
          Revisa la landing pública en ambos idiomas. Los textos, medios y visibilidad guardados se reflejan de inmediato.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <a href="/acerca-de" target="_blank" rel="noopener noreferrer">
              Ver español <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href="/about" target="_blank" rel="noopener noreferrer">
              View English <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
        <div className="border-t pt-4">
          <p className="text-sm font-medium">Versión anterior</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Respaldo de la página anterior. La restauración recupera sus textos, pero no vuelve a publicar las rutas antiguas.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {hasPreviousVersion ? (
              <Button asChild variant="ghost" size="sm">
                <a href="/api/admin/site-config/firma/previous-version/preview" target="_blank" rel="noopener noreferrer">
                  Vista previa interna <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                </a>
              </Button>
            ) : (
              <Button variant="ghost" size="sm" disabled>
                Vista previa interna <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={!hasPreviousVersion || restoring}
              onClick={restorePrevious}
            >
              {restoring && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
              Restaurar textos de la versión anterior
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
