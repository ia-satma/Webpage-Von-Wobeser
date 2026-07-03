import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAdminAuth } from "@/lib/adminAuth";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Newspaper, Users, FileText, Settings, ArrowUpRight, LogOut } from "lucide-react";

// Secciones más usadas del admin (barra superior compartida).
const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/news", label: "Noticias", icon: Newspaper },
  { href: "/admin/team", label: "Abogados", icon: Users },
  { href: "/admin/posts", label: "Blog", icon: FileText },
  { href: "/admin/site-config", label: "Configuración", icon: Settings },
];

/**
 * Envoltura común de todas las páginas del admin: barra de navegación superior
 * consistente (logo + secciones + salir), con la sección activa resaltada.
 */
export function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { logout } = useAdminAuth();

  const isActive = (href: string) =>
    href === "/admin/dashboard" ? location === href : location === href || location.startsWith(href + "/");

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/75">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <Link href="/admin/dashboard">
                <div className="flex items-center gap-2.5 cursor-pointer" data-testid="link-admin-home">
                  <img src="/logo-color.png" alt="Von Wobeser y Sierra" className="h-8 w-auto" />
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">Admin</span>
                </div>
              </Link>
              <nav className="hidden md:flex items-center gap-1" data-testid="nav-admin">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link key={item.href} href={item.href}>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                          active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                        data-testid={`nav-${item.label.toLowerCase()}`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-view-site"
              >
                Ver sitio <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
              <Button variant="outline" size="sm" onClick={logout} data-testid="button-logout">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      </header>
      {children}
    </>
  );
}
