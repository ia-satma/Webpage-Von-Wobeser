import { useState } from "react";
import { Languages, Menu, Search } from "lucide-react";
import type { NavigationConfiguration } from "@shared/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminNavigationItem } from "./types";

export function NavigationPreview({ configuration, metadata }: { configuration: NavigationConfiguration; metadata: AdminNavigationItem[] }) {
  const [mode, setMode] = useState<"desktop" | "mobile">("desktop");
  const statuses = new Map(metadata.map((item) => [item.id, item]));
  const items = configuration.items.filter((item) => item.visible && statuses.get(item.id)?.status === "ready");

  return (
    <Card data-testid="navigation-preview">
      <CardHeader className="flex-row items-center justify-between gap-4">
        <CardTitle className="font-serif text-xl">Vista previa</CardTitle>
        <div className="flex rounded-md border p-1">
          <Button type="button" size="sm" variant={mode === "desktop" ? "default" : "ghost"} onClick={() => setMode("desktop")}>Escritorio</Button>
          <Button type="button" size="sm" variant={mode === "mobile" ? "default" : "ghost"} onClick={() => setMode("mobile")}>Móvil</Button>
        </div>
      </CardHeader>
      <CardContent>
        {mode === "desktop" ? (
          <div className="overflow-x-auto rounded-md border bg-white p-4">
            <div className="flex min-w-[900px] items-center gap-5">
              <div className="shrink-0 px-3 font-semibold tracking-[.2em] text-[#ac162c]">VON WOBESER</div>
              <div className="flex min-h-13 flex-1 items-stretch rounded-sm bg-[#2d2d2f] text-white shadow-md">
                {items.map((item, index) => (
                  <div key={item.id} className={`flex items-center px-3 text-[11px] ${index ? "border-l border-[#ac162c]" : ""}`}>{item.labelEs}</div>
                ))}
                <div className="ml-auto flex items-center border-l border-white/30 px-3 text-[11px]"><Search className="mr-2 size-3" />{configuration.utilities.search.labelEs}</div>
                <div className="flex items-center gap-1 border-l border-white/30 px-3 text-[11px]"><span className="font-semibold text-[#ac162c]">ES</span><span className="text-white/55">|</span><span>EN</span></div>
                <div className="flex items-center border-l border-white/30 px-3 text-[11px] font-medium">{configuration.utilities.contact.labelEs}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-sm overflow-hidden rounded-md border bg-white shadow-sm">
            <div className="flex min-h-16 items-center justify-between px-4"><span className="font-semibold tracking-[.2em] text-[#ac162c]">VON WOBESER</span><div className="flex gap-4"><Search className="size-5" /><Languages className="size-5" /><Menu className="size-5" /></div></div>
            <div className="bg-[#2d2d2f] px-4 py-2 text-white">
              {items.map((item) => <div key={item.id} className="flex min-h-12 items-center justify-between border-t border-white/15 first:border-0"><span>{item.labelEs}</span><span aria-hidden>⌄</span></div>)}
              <div className="my-3 bg-[#ac162c] px-4 py-3 text-center text-sm font-medium uppercase tracking-wide">{configuration.utilities.contact.labelEs}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
