import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from "@/components/ui/command";
import { getAssistedAdminActions } from "@/lib/adminNavigationAssistant";
import type { AdminNavItem } from "@/lib/adminNav";
import { useAdminEditingState } from "@/components/admin/AdminEditingState";

export function AdminActionSearch({ canView }: { canView: (item: AdminNavItem) => boolean }) {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { requestNavigation } = useAdminEditingState();
  const actions = useMemo(() => getAssistedAdminActions(canView), [canView]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    requestNavigation(() => setLocation(href));
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between gap-2 rounded-md border-border bg-background px-2.5 text-left text-xs font-normal text-muted-foreground group-data-[collapsible=icon]:hidden"
        onClick={() => setOpen(true)}
        data-testid="button-admin-action-search"
      >
        <span className="flex min-w-0 items-center gap-2"><Search className="h-3.5 w-3.5" />¿Qué quieres hacer?</span>
        <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px]">⌘K</kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Busca una tarea, sección o acción…" />
        <CommandList>
          <CommandEmpty>No hay una sección disponible para esa búsqueda.</CommandEmpty>
          <CommandGroup heading="Ir a una sección">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <CommandItem key={action.href} value={action.searchValue} onSelect={() => go(action.href)}>
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="min-w-0 flex-1 truncate">{action.label}</span>
                  {action.group.label && <CommandShortcut>{action.group.label}</CommandShortcut>}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
