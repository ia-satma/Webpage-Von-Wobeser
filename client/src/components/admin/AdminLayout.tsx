import { useCallback, useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { adminApiRequest, useAdminAuth, useMyPermissions } from "@/lib/adminAuth";
import { ADMIN_NAV_GROUPS, canSeeNavItem, isNavItemActive, type AdminNavGroup, type AdminNavItem } from "@/lib/adminNav";
import { useQuery } from "@tanstack/react-query";
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
import { AdminSessionGuard } from "@/components/admin/AdminSessionGuard";
import { AdminActionSearch } from "@/components/admin/AdminActionSearch";
import { AdminEditingStateProvider, useAdminEditingState } from "@/components/admin/AdminEditingState";
import { ArrowUpRight, BookOpen, ChevronDown, Inbox, LogOut, Settings2, SlidersHorizontal } from "lucide-react";
import adminLogoUrl from "@assets/vonwobeser_logo_hd.png";

const OPEN_GROUPS_KEY = "admin-sidebar-open-groups";

const GROUP_TONES = {
  editorial: {
    icon: BookOpen,
    iconClass: "border-sky-200 bg-sky-100 text-sky-800",
    labelClass: "text-sky-900",
    descriptionClass: "text-sky-900/70",
    badgeClass: "border-sky-200 bg-sky-100 text-sky-800",
  },
  inbox: {
    icon: Inbox,
    iconClass: "border-emerald-200 bg-emerald-100 text-emerald-800",
    labelClass: "text-emerald-900",
    descriptionClass: "text-emerald-900/70",
    badgeClass: "border-emerald-200 bg-emerald-100 text-emerald-800",
  },
  settings: {
    icon: Settings2,
    iconClass: "border-amber-200 bg-amber-100 text-amber-900",
    labelClass: "text-amber-950",
    descriptionClass: "text-amber-950/70",
    badgeClass: "border-amber-200 bg-amber-100 text-amber-900",
  },
  technical: {
    icon: SlidersHorizontal,
    iconClass: "border-amber-200 bg-amber-100 text-amber-900",
    labelClass: "text-amber-950",
    descriptionClass: "text-amber-950/70",
    badgeClass: "border-amber-200 bg-amber-100 text-amber-900",
  },
  neutral: {
    icon: Settings2,
    iconClass: "border-border bg-muted text-muted-foreground",
    labelClass: "text-muted-foreground",
    descriptionClass: "text-muted-foreground",
    badgeClass: "border-border bg-muted text-muted-foreground",
  },
} as const;

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

type NavigationStatus = {
  drafts?: number;
  unreadContact?: number;
  unreadCareer?: number;
};

function navigationCount(item: AdminNavItem, counts?: NavigationStatus): number | undefined {
  if (item.href === "/admin/news") return counts?.drafts;
  if (item.href === "/admin/submissions?tab=contact") return counts?.unreadContact;
  if (item.href === "/admin/submissions?tab=career") return counts?.unreadCareer;
  return undefined;
}

function NavItems({ items, location, counts }: { items: AdminNavItem[]; location: string; counts?: NavigationStatus }) {
  const [, setLocation] = useLocation();
  const { requestNavigation } = useAdminEditingState();
  return (
    <SidebarMenu>
      {items.map((item) => {
        const Icon = item.icon;
        const active = isNavItemActive(location, item.href);
        const tooltip = item.comingSoon ? `${item.label} (en construcción)` : item.label;
        const count = navigationCount(item, counts);
        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton asChild isActive={active} tooltip={tooltip} data-testid={`nav-${item.href.replace(/\//g, "-")}`}>
              <Link
                href={item.href}
                onClick={(event) => {
                  event.preventDefault();
                  requestNavigation(() => setLocation(item.href));
                }}
              >
                <Icon />
                <span className="flex-1 truncate">{item.label}</span>
                {typeof count === "number" && count > 0 && (
                  <span
                    className="ml-auto min-w-5 rounded-full bg-primary px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none text-primary-foreground group-data-[collapsible=icon]:hidden"
                    aria-label={`${count} pendientes`}
                    data-testid={`nav-count-${item.href.replace(/[^a-z0-9]/gi, "-")}`}
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                )}
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

function AdminHomeLink({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const { requestNavigation } = useAdminEditingState();

  return (
    <Link
      href="/admin/dashboard"
      onClick={(event) => {
        event.preventDefault();
        requestNavigation(() => setLocation("/admin/dashboard"));
      }}
    >
      {children}
    </Link>
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
  counts,
  isOpen,
  onToggle,
}: {
  group: AdminNavGroup;
  visibleItems: AdminNavItem[];
  location: string;
  counts?: NavigationStatus;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const { state } = useSidebar();
  const open = state === "collapsed" || isOpen;
  const tone = GROUP_TONES[group.tone || "neutral"];
  const GroupIcon = tone.icon;

  if (!group.label) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <NavItems items={visibleItems} location={location} counts={counts} />
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <Collapsible open={open} onOpenChange={onToggle}>
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted/70 ${tone.labelClass}`} data-testid={`nav-group-toggle-${group.id}`}>
            <span className="flex min-w-0 items-center gap-2">
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${tone.iconClass}`} aria-hidden="true">
                <GroupIcon className="h-3 w-3" />
              </span>
              <span className="truncate">{group.label}</span>
              {group.technical && (
                <span className={`rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${tone.badgeClass}`}>
                  Técnico
                </span>
              )}
            </span>
            <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${open ? "" : "-rotate-90"}`} />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            {group.description && (
              <p className={`px-2 pb-2 pt-0.5 text-[11px] leading-snug ${tone.descriptionClass}`}>
                {group.description}
              </p>
            )}
            <NavItems items={visibleItems} location={location} counts={counts} />
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
function AdminLayoutContents({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { logout, role, user, sessionPolicy } = useAdminAuth();
  const { requestNavigation } = useAdminEditingState();
  const { has, loaded: permissionsLoaded } = useMyPermissions();
  const isAdmin = role === "admin" || role === "super_admin";
  const isSuperAdmin = role === "super_admin";
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => loadOpenGroups());
  const canView = useCallback((item: AdminNavItem) => canSeeNavItem(item, { has, isAdmin, isSuperAdmin }), [has, isAdmin, isSuperAdmin]);
  const navigationStatus = useQuery<NavigationStatus>({
    queryKey: ["/api/admin/navigation-status"],
    enabled: !!user && permissionsLoaded,
    queryFn: async () => {
      const response = await adminApiRequest("GET", "/api/admin/navigation-status");
      if (!response.ok) throw new Error("No se pudieron cargar los indicadores del menú");
      return response.json();
    },
    staleTime: 20_000,
  });

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
    <SidebarProvider className="admin-shell">
      <AdminSessionGuard policy={sessionPolicy} userId={user?.id} />
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center justify-between gap-2 px-1 py-1">
            <AdminHomeLink>
              <div className="flex items-center gap-2 cursor-pointer" data-testid="link-admin-home">
                <img
                  src={adminLogoUrl}
                  alt="Von Wobeser y Sierra"
                  width={240}
                  height={42}
                  className="h-7 w-auto object-contain group-data-[collapsible=icon]:hidden"
                />
                <span className="hidden group-data-[collapsible=icon]:inline rounded-none bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">VW</span>
              </div>
            </AdminHomeLink>
            <SidebarTrigger className="hidden md:flex" />
          </div>
          <div className="px-1 pb-1">
            <AdminActionSearch canView={canView} />
          </div>
        </SidebarHeader>

        <SidebarContent>
          {ADMIN_NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter(canView);
            if (visibleItems.length === 0) return null;
            return (
              <NavGroupSection
                key={group.id}
                group={group}
                visibleItems={visibleItems}
                location={location}
                counts={navigationStatus.data}
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
            <Button variant="outline" size="sm" onClick={() => requestNavigation(logout)} data-testid="button-logout" title="Cerrar sesión" aria-label="Cerrar sesión" className="flex-1 group-data-[collapsible=icon]:flex-none">
              <LogOut className="h-4 w-4" />
              <span className="group-data-[collapsible=icon]:hidden">Cerrar sesión</span>
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex items-center gap-2 border-b border-border p-3 md:hidden sticky top-0 z-30 bg-card/90 backdrop-blur">
          <SidebarTrigger />
          <img src={adminLogoUrl} alt="Von Wobeser y Sierra" width={240} height={42} className="h-6 w-auto object-contain" />
          <span className="rounded-none bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">Admin</span>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminEditingStateProvider>
      <AdminLayoutContents>{children}</AdminLayoutContents>
    </AdminEditingStateProvider>
  );
}
