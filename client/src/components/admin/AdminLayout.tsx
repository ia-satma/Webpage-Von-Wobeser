import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAdminAuth, useMyPermissions } from "@/lib/adminAuth";
import { ADMIN_NAV_GROUPS, canSeeNavItem, isNavItemActive } from "@/lib/adminNav";
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
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { ArrowUpRight, LogOut } from "lucide-react";

/**
 * Envoltura común de todas las páginas del admin: sidebar con TODAS las secciones
 * (agrupadas y gateadas por permiso, ver client/src/lib/adminNav.ts), colapsable a
 * icon-only en desktop y con drawer automático en móvil (el propio componente Sidebar de
 * shadcn ya resuelve esto — ver client/src/components/ui/sidebar.tsx).
 */
export function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { logout, role } = useAdminAuth();
  const { has } = useMyPermissions();
  const isAdmin = !role || role === "admin" || role === "super_admin";

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
              <SidebarGroup key={group.id}>
                {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
                <SidebarGroupContent>
                  <SidebarMenu>
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      const active = isNavItemActive(location, item.href);
                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton asChild isActive={active} tooltip={item.label} data-testid={`nav-${item.href.replace(/\//g, "-")}`}>
                            <Link href={item.href}>
                              <Icon />
                              <span>{item.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
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
            <ThemeToggle />
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
