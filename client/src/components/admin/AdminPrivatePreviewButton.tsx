import { Eye, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function AdminPrivatePreviewButton({
  entity,
  id,
  hasUnsavedChanges,
}: {
  entity: "news" | "team";
  id?: string;
  hasUnsavedChanges?: boolean;
}) {
  const disabled = !id || hasUnsavedChanges;
  const openPreview = (language: "es" | "en") => {
    if (!id) return;
    window.open(`/api/admin/preview/${entity}/${encodeURIComponent(id)}?lang=${language}`, "_blank", "noopener,noreferrer");
  };
  return (
    <div className="flex flex-col items-end gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" size="sm" disabled={disabled} title={disabled ? "Guarda el borrador para actualizar la vista previa" : "Vista previa privada"} data-testid={`button-preview-${entity}`}>
            <Eye className="mr-1.5 h-4 w-4" />Vista previa
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => openPreview("es")}><ExternalLink />Español</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => openPreview("en")}><ExternalLink />English</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {disabled && <span className="text-right text-[11px] text-muted-foreground">Guarda el borrador para actualizarla.</span>}
    </div>
  );
}
