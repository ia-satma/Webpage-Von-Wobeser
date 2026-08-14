import { Check, Eye, RefreshCw } from "lucide-react";
import type { NavigationPresetId } from "@shared/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { NavigationPresetResponse } from "./types";

type Props = {
  activePreset: NavigationPresetId;
  selectedPreset: NavigationPresetId;
  presets: Record<NavigationPresetId, NavigationPresetResponse>;
  activating: boolean;
  onSelect: (preset: NavigationPresetId) => void;
  onActivate: (preset: NavigationPresetId) => void;
};

export function NavigationPresetSelector({
  activePreset,
  selectedPreset,
  presets,
  activating,
  onSelect,
  onActivate,
}: Props) {
  return (
    <Card data-testid="navigation-preset-selector">
      <CardHeader className="gap-2 border-b bg-muted/20">
        <CardTitle className="text-xl">Diseños guardados</CardTitle>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Cambiar el diseño modifica únicamente el encabezado público. Las páginas, el contenido y las rutas permanecen intactos.
        </p>
      </CardHeader>
      <CardContent className="grid gap-0 p-0 lg:grid-cols-2 lg:divide-x">
        {(["definitive-2026", "classic-vwys"] as const).map((presetId) => {
          const preset = presets[presetId];
          const active = activePreset === presetId;
          const selected = selectedPreset === presetId;
          return (
            <section
              key={presetId}
              className={`relative grid min-h-52 content-between gap-7 border-t p-6 first:border-t-0 lg:border-t-0 ${selected ? "bg-[#faf7f7]" : "bg-background"}`}
              data-testid={`navigation-preset-${presetId}`}
            >
              {selected ? <span className="absolute inset-y-0 left-0 w-1 bg-[#ac162c]" aria-hidden="true" /> : null}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold tracking-tight">{preset.name}</h3>
                  {active ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-700/20 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800">
                      <Check className="size-3" />Activo
                    </span>
                  ) : (
                    <span className="rounded-full border px-2.5 py-1 text-[11px] font-medium text-muted-foreground">Respaldo</span>
                  )}
                </div>
                <p className="max-w-[58ch] text-sm leading-relaxed text-muted-foreground">{preset.description}</p>
                <p className="text-xs text-muted-foreground">
                  {preset.configuration.items.filter((item) => item.visible).length} secciones principales · revisión {preset.revision}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant={selected ? "default" : "outline"} onClick={() => onSelect(presetId)}>
                  <Eye className="mr-2 size-4" />{selected ? "Editando este diseño" : "Ver y editar"}
                </Button>
                {!active ? (
                  <Button type="button" variant="outline" disabled={activating} onClick={() => onActivate(presetId)} data-testid={`activate-preset-${presetId}`}>
                    <RefreshCw className={`mr-2 size-4 ${activating ? "animate-spin" : ""}`} />Activar diseño
                  </Button>
                ) : null}
              </div>
            </section>
          );
        })}
      </CardContent>
    </Card>
  );
}
