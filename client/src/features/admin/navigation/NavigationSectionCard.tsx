import { ArrowDown, ArrowUp, ExternalLink } from "lucide-react";
import type { NavigationPrimaryConfiguration } from "@shared/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { NavigationStatusBadge } from "./NavigationStatusBadge";
import type { AdminNavigationItem } from "./types";

type Props = {
  item: NavigationPrimaryConfiguration;
  meta: AdminNavigationItem;
  index: number;
  total: number;
  onChange: (item: NavigationPrimaryConfiguration) => void;
  onMove: (direction: -1 | 1) => void;
};

export function NavigationSectionCard({ item, meta, index, total, onChange, onMove }: Props) {
  const childMeta = new Map(meta.children.map((child) => [child.id, child]));
  const patch = (value: Partial<NavigationPrimaryConfiguration>) => onChange({ ...item, ...value });
  const updateChild = (childIndex: number, value: Partial<NavigationPrimaryConfiguration["children"][number]>) => {
    patch({ children: item.children.map((child, current) => current === childIndex ? { ...child, ...value } : child) });
  };
  const moveChild = (childIndex: number, direction: -1 | 1) => {
    const destination = childIndex + direction;
    if (destination < 0 || destination >= item.children.length) return;
    const children = [...item.children];
    [children[childIndex], children[destination]] = [children[destination], children[childIndex]];
    patch({ children });
  };

  return (
    <Card data-testid={`navigation-section-${item.id}`}>
      <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="font-serif text-xl">{item.labelEs}</CardTitle>
            <NavigationStatusBadge status={meta.status} />
          </div>
          <a className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground" href={meta.pathEs} target="_blank" rel="noreferrer">
            {meta.pathEs}<ExternalLink className="size-3" />
          </a>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" size="icon" variant="outline" disabled={index === 0} onClick={() => onMove(-1)} aria-label={`Subir ${item.labelEs}`}><ArrowUp className="size-4" /></Button>
          <Button type="button" size="icon" variant="outline" disabled={index === total - 1} onClick={() => onMove(1)} aria-label={`Bajar ${item.labelEs}`}><ArrowDown className="size-4" /></Button>
          <div className="flex items-center gap-2 pl-2">
            <Label htmlFor={`nav-visible-${item.id}`} className="text-xs">Visible</Label>
            <Switch id={`nav-visible-${item.id}`} checked={item.visible} onCheckedChange={(visible) => patch({ visible })} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor={`nav-${item.id}-es`}>Etiqueta en español</Label><Input id={`nav-${item.id}-es`} value={item.labelEs} maxLength={120} onChange={(event) => patch({ labelEs: event.target.value })} /></div>
          <div className="space-y-2"><Label htmlFor={`nav-${item.id}-en`}>Etiqueta en inglés</Label><Input id={`nav-${item.id}-en`} value={item.labelEn} maxLength={120} onChange={(event) => patch({ labelEn: event.target.value })} /></div>
        </div>
        <div className="rounded-md border">
          <div className="border-b bg-muted/40 px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Destinos del desplegable</div>
          <div className="divide-y">
            {item.children.map((child, childIndex) => {
              const childInfo = childMeta.get(child.id)!;
              const cannotActivate = !child.visible && !childInfo.canActivate;
              return (
                <div key={child.id} className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]" data-testid={`navigation-child-${child.id}`}>
                  <div className="space-y-2"><Label htmlFor={`${child.id}-es`}>Español</Label><Input id={`${child.id}-es`} value={child.labelEs} maxLength={120} onChange={(event) => updateChild(childIndex, { labelEs: event.target.value })} /></div>
                  <div className="space-y-2"><Label htmlFor={`${child.id}-en`}>Inglés</Label><Input id={`${child.id}-en`} value={child.labelEn} maxLength={120} onChange={(event) => updateChild(childIndex, { labelEn: event.target.value })} /></div>
                  <div className="flex min-w-48 items-center justify-between gap-3 lg:justify-end">
                    <div className="space-y-1 text-right"><NavigationStatusBadge status={childInfo.status} /><p className="max-w-52 text-xs text-muted-foreground">{childInfo.reasonEs}</p></div>
                    <div className="flex items-center gap-1">
                      <Button type="button" size="icon" variant="ghost" disabled={childIndex === 0} onClick={() => moveChild(childIndex, -1)} aria-label={`Subir ${child.labelEs}`}><ArrowUp className="size-4" /></Button>
                      <Button type="button" size="icon" variant="ghost" disabled={childIndex === item.children.length - 1} onClick={() => moveChild(childIndex, 1)} aria-label={`Bajar ${child.labelEs}`}><ArrowDown className="size-4" /></Button>
                      <Switch checked={child.visible} disabled={cannotActivate} onCheckedChange={(visible) => updateChild(childIndex, { visible })} aria-label={`Mostrar ${child.labelEs}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
