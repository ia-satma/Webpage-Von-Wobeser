import { useMemo, useState } from "react";
import { ChevronDown, Languages, Menu, Search } from "lucide-react";
import type { NavigationConfiguration, NavigationPresetId } from "@shared/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminNavigationItem } from "./types";

type Props = {
  configuration: NavigationConfiguration;
  metadata: AdminNavigationItem[];
  preset: NavigationPresetId;
};

export function NavigationPreview({ configuration, metadata, preset }: Props) {
  const [mode, setMode] = useState<"desktop" | "mobile">("desktop");
  const statuses = useMemo(() => new Map(metadata.map((item) => [item.id, item])), [metadata]);
  const items = configuration.items.filter((item) => item.visible && statuses.get(item.id)?.status === "ready");
  const sample = items.find((item) => item.children.some((child) => child.visible)) || items[0];
  const childStatus = new Map((statuses.get(sample?.id || "firm")?.children || []).map((item) => [item.id, item]));
  const children = (sample?.children || [])
    .filter((child) => child.visible && childStatus.get(child.id)?.status === "ready")
    .slice(0, preset === "classic-vwys" ? 6 : 8);
  const classic = preset === "classic-vwys";

  return (
    <Card data-testid="navigation-preview">
      <CardHeader className="flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-xl">Vista previa del diseño</CardTitle>
          <p className="text-xs text-muted-foreground">{classic ? "Menú clásico VWyS" : "Menú definitivo 2026"}</p>
        </div>
        <div className="flex rounded-md border p-1">
          <Button type="button" size="sm" variant={mode === "desktop" ? "default" : "ghost"} onClick={() => setMode("desktop")}>Escritorio</Button>
          <Button type="button" size="sm" variant={mode === "mobile" ? "default" : "ghost"} onClick={() => setMode("mobile")}>Móvil</Button>
        </div>
      </CardHeader>
      <CardContent>
        {mode === "desktop" ? (
          <div className="overflow-x-auto rounded-md border bg-[#f1f1ef] p-5">
            <div className="relative min-w-[930px] overflow-hidden border bg-white shadow-[0_12px_30px_rgba(57,48,50,.08)]">
              <div className="flex h-[72px] items-center gap-6 px-7">
                <div className="shrink-0 pr-4 text-[12px] font-semibold tracking-[.2em] text-[#ac162c]">VON WOBESER</div>
                <nav className="flex min-w-0 flex-1 items-stretch justify-center gap-5" aria-label="Vista previa del menú">
                  {items.map((item, index) => (
                    <div key={item.id} className={`relative flex items-center whitespace-nowrap text-[12px] text-[#5e5e5e] ${index === 0 ? "text-[#ac162c]" : ""}`}>
                      {item.labelEs}
                      {index === 0 ? <span className="absolute inset-x-0 bottom-[13px] h-px bg-[#ac162c]" /> : null}
                    </div>
                  ))}
                </nav>
                <div className="flex shrink-0 items-center gap-4 text-[#5e5e5e]">
                  <Search className="size-4" />
                  <span className="text-[11px]"><strong className="font-semibold text-[#ac162c]">ES</strong> <span className="text-[#aaa]">|</span> EN</span>
                  <span className="whitespace-nowrap text-[12px]">{configuration.utilities.contact.labelEs}</span>
                </div>
              </div>
              {sample ? (
                <div className={`absolute left-[255px] top-[62px] z-[1] bg-white ${classic
                  ? "w-[360px] border-t border-[#ac162c] px-3.5 py-2.5 shadow-[0_10px_20px_rgba(62,62,62,.12)]"
                  : "w-[540px] rounded-lg border border-[#5e5e5e]/15 border-t-2 border-t-[#ac162c] px-5 py-3 shadow-[0_18px_44px_rgba(57,48,50,.13)]"}`}
                >
                  <div className={`${classic ? "mb-0" : "mb-1.5 flex items-end justify-between border-b pb-2"}`}>
                    {!classic ? <span className="font-serif text-lg text-[#555557]">{sample.labelEs}</span> : null}
                    <span className={`inline-flex min-h-8 items-center text-[9px] font-medium tracking-[.08em] text-[#ac162c] ${classic ? "w-full justify-between border-b normal-case tracking-[.035em]" : "uppercase"}`}>
                      {classic ? sample.labelEs : "Ver sección"}<span>→</span>
                    </span>
                  </div>
                  <div className={`grid ${classic ? "grid-cols-1" : "grid-cols-2 gap-x-4"}`}>
                    {children.length ? children.map((child) => (
                      <div key={child.id} className="flex min-h-8 items-center justify-between border-b border-[#e7e7e5] text-[10px] text-[#5e5e5e]">
                        <span>{child.labelEs}</span><span className="text-[#ac162c]">→</span>
                      </div>
                    )) : <p className="py-3 text-[10px] text-muted-foreground">El enlace principal abre la sección.</p>}
                  </div>
                </div>
              ) : null}
              <div className="h-[210px] bg-[linear-gradient(135deg,#f8f7f5,#eeece9)]" />
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-sm overflow-hidden rounded-md border bg-white shadow-sm">
            <div className="flex min-h-16 items-center justify-between px-4">
              <span className="text-[11px] font-semibold tracking-[.2em] text-[#ac162c]">VON WOBESER</span>
              <div className="flex gap-4 text-[#5e5e5e]"><Search className="size-5" /><Languages className="size-5" /><Menu className="size-5" /></div>
            </div>
            <div className="border-t bg-white px-4 py-2 text-[#5e5e5e]">
              {items.map((item, index) => (
                <div key={item.id} className="border-t border-[#e2e2e2] first:border-0">
                  <div className="flex min-h-12 items-center justify-between"><span>{item.labelEs}</span><ChevronDown className="size-4" /></div>
                  {index === 0 && sample ? (
                    <div className={`${classic ? "border-l border-[#ac162c]" : "rounded-md border border-[#ebe4e5] border-l-2 border-l-[#ac162c] bg-[#faf9f8]"} mb-2 ml-0.5 px-3 py-1`}>
                      <div className="flex min-h-10 items-center justify-between text-[11px] font-medium text-[#ac162c]"><span>Ver sección</span><span>→</span></div>
                      {children.slice(0, 3).map((child) => <div key={child.id} className="flex min-h-10 items-center justify-between text-xs"><span>{child.labelEs}</span><span className="text-[#ac162c]">→</span></div>)}
                    </div>
                  ) : null}
                </div>
              ))}
              <div className="flex min-h-12 items-center border-t border-[#e2e2e2]">{configuration.utilities.contact.labelEs}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
