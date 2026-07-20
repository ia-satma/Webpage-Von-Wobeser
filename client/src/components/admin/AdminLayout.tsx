import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAdminAuth, useMyPermissions } from "@/lib/adminAuth";
import { ADMIN_NAV_GROUPS, canSeeNavItem, isNavItemActive, type AdminNavGroup, type AdminNavItem } from "@/lib/adminNav";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ChevronDown, LogOut } from "lucide-react";

const OPEN_GROUPS_KEY = "admin-sidebar-open-groups";

function loadOpenGroups(): Set<string> {
  try {
    const raw = window.localStorage.getItem(OPEN_GROUPS_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveOpenGroups(groups: Set<string>) {
  try {
    window.localStorage.setItem(OPEN_GROUPS_KEY, JSON.stringify(Array.from(groups)));
  } catch {
    // localStorage no disponible (modo privado, cuota, etc.) — el plegado simplemente no persiste.
  }
}

function NavItems({ items, location }: { items: AdminNavItem[]; location: string }) {
  return (
    <SidebarMenu>
      {items.map((item) => {
        const Icon = item.icon;
        const active = isNavItemActive(location, item.href);
        const tooltip = item.comingSoon ? `${item.label} (en construcción)` : item.label;
        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton asChild isActive={active} tooltip={tooltip} data-testid={`nav-${item.href.replace(/\//g, "-")}`}>
              <Link href={item.href}>
                <Icon />
                <span className="flex-1 truncate">{item.label}</span>
                {item.comingSoon && (
                  <span
                    className="ml-auto rounded-none bg-warning/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-warning group-data-[collapsible=icon]:hidden"
                    data-testid={`badge-coming-soon-${item.href.replace(/\//g, "-")}`}
                  >
                    En construcción
                  </span>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

/**
 * Un grupo con etiqueta se puede plegar/desplegar por separado (clic en el título) — el
 * estado se recuerda entre navegaciones (localStorage) y el grupo que contiene la página
 * activa se abre solo. En modo icon-only (sidebar colapsado a la barra angosta) el plegado
 * por grupo se ignora — ahí siempre se ven todos los iconos, igual que antes.
 */
function NavGroupSection({
  group,
  visibleItems,
  location,
  isOpen,
  onToggle,
}: {
  group: AdminNavGroup;
  visibleItems: AdminNavItem[];
  location: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const { state } = useSidebar();
  const open = state === "collapsed" || isOpen;

  if (!group.label) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <NavItems items={visibleItems} location={location} />
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <Collapsible open={open} onOpenChange={onToggle}>
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger className="flex w-full items-center justify-between cursor-pointer" data-testid={`nav-group-toggle-${group.id}`}>
            <span>{group.label}</span>
            <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${open ? "" : "-rotate-90"}`} />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <NavItems items={visibleItems} location={location} />
          </SidebarGroupContent>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  );
}

/**
 * Envoltura común de todas las páginas del admin: sidebar con TODAS las secciones
 * (agrupadas y gateadas por permiso, ver client/src/lib/adminNav.ts), colapsable a
 * icon-only en desktop y con drawer automático en móvil (el propio componente Sidebar de
 * shadcn ya resuelve esto — ver client/src/components/ui/sidebar.tsx). Cada grupo con
 * etiqueta además se puede plegar/desplegar individualmente (ver NavGroupSection arriba).
 */
export function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { logout, role } = useAdminAuth();
  const { has } = useMyPermissions();
  const isAdmin = !role || role === "admin" || role === "super_admin";
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => loadOpenGroups());

  // El panel admin siempre va en modo día — nunca modo noche, ni siquiera si el visitante
  // activó el modo oscuro en el sitio público antes de entrar (misma pestaña, mismo <html>,
  // sin ThemeProvider aislado). Se limpia en cada montaje del shell admin, antes del primer
  // pintado, sin tocar la preferencia guardada del sitio público.
  useLayoutEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  // Abre solo, sin cerrar los demás, el grupo que contiene la página actual.
  useEffect(() => {
    const activeGroup = ADMIN_NAV_GROUPS.find((g) => g.items.some((item) => isNavItemActive(location, item.href)));
    if (!activeGroup || openGroups.has(activeGroup.id)) return;
    setOpenGroups((prev) => {
      const next = new Set(prev);
      next.add(activeGroup.id);
      saveOpenGroups(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveOpenGroups(next);
      return next;
    });
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center justify-between gap-2 px-1 py-1">
            <Link href="/admin/dashboard">
              <div className="flex items-center gap-2 cursor-pointer" data-testid="link-admin-home">
                <img src="/logo-color.png" alt="Von Wobeser y Sierra" className="h-7 w-auto group-data-[collapsible=icon]:hidden" />
                <span className="hidden group-data-[collapsible=icon]:inline rounded-none bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">VW</span>
              </div>
            </Link>
            <SidebarTrigger className="hidden md:flex" />
          </div>
        </SidebarHeader>

        <SidebarContent>
          {ADMIN_NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter((item) => canSeeNavItem(item, { has, isAdmin }));
            if (visibleItems.length === 0) return null;
            return (
              <NavGroupSection
                key={group.id}
                group={group}
                visibleItems={visibleItems}
                location={location}
                isOpen={openGroups.has(group.id)}
                onToggle={() => toggleGroup(group.id)}
              />
            );
          })}
        </SidebarContent>

        <SidebarFooter>
          <div className="flex flex-col gap-1 px-1 group-data-[collapsible=icon]:items-center">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-1 py-1 group-data-[collapsible=icon]:hidden"
              data-testid="button-view-site"
            >
              Ver en español <ArrowUpRight className="h-3 w-3" />
            </a>
            <a
              href="/?lang=en"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-1 py-1 group-data-[collapsible=icon]:hidden"
              data-testid="button-view-site-en"
            >
              Ver en inglés <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:flex-col">
            <Button variant="outline" size="sm" onClick={logout} data-testid="button-logout" title="Cerrar sesión" aria-label="Cerrar sesión" className="flex-1 group-data-[collapsible=icon]:flex-none">
              <LogOut className="h-4 w-4" />
              <span className="group-data-[collapsible=icon]:hidden">Cerrar sesión</span>
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex items-center gap-2 border-b border-border p-3 md:hidden sticky top-0 z-30 bg-card/90 backdrop-blur">
          <SidebarTrigger />
          <img src="/logo-color.png" alt="Von Wobeser y Sierra" className="h-6 w-auto" />
          <span className="rounded-none bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">Admin</span>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
