import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  HelpCircle,
  Newspaper,
  FileText,
  FolderOpen,
  Users,
  Briefcase,
  Building2,
  Calendar,
  Award,
  Mail,
  Settings,
  Images,
  Languages,
  ShieldCheck,
  Bot,
  Cog,
  BookOpen,
  Layers,
  Activity,
  BarChart3,
  CheckCircle,
  Sparkles,
} from "lucide-react";

/**
 * Fuente única de verdad de la navegación del admin — reemplaza el NAV_ITEMS que antes
 * vivía duplicado (uno usado en AdminLayout.tsx, otro muerto/sin usar en AdminDashboard.tsx).
 * La consumen tanto el sidebar (AdminLayout.tsx) como los accesos rápidos del Dashboard.
 */
export type AdminNavPermission = "config" | "agents" | "advanced" | "adminOnly";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  requires?: AdminNavPermission;
}

export interface AdminNavGroup {
  id: string;
  label: string | null;
  items: AdminNavItem[];
}

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: "pinned",
    label: null,
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/manual", label: "Manual de uso", icon: HelpCircle },
    ],
  },
  {
    id: "contenido",
    label: "Contenido",
    items: [
      { href: "/admin/news", label: "Noticias", icon: Newspaper },
      { href: "/admin/posts", label: "Blog / Artículos", icon: FileText },
      { href: "/admin/categories", label: "Categorías", icon: FolderOpen },
      { href: "/admin/team", label: "Abogados y equipo", icon: Users },
      { href: "/admin/practice-groups", label: "Áreas de práctica", icon: Briefcase },
      { href: "/admin/industry-groups", label: "Sectores / Industrias", icon: Building2 },
      { href: "/admin/events", label: "Eventos", icon: Calendar },
      { href: "/admin/recognitions", label: "Reconocimientos", icon: Award },
      { href: "/admin/submissions", label: "Solicitudes recibidas", icon: Mail },
    ],
  },
  {
    id: "configuracion",
    label: "Configuración",
    items: [
      { href: "/admin/site-config", label: "Textos, video y logos", icon: Settings, requires: "config" },
      { href: "/admin/gallery", label: "Galería de imágenes", icon: Images, requires: "config" },
      { href: "/admin/translations", label: "Traducciones", icon: Languages, requires: "config" },
      { href: "/admin/users", label: "Usuarios y accesos", icon: ShieldCheck, requires: "adminOnly" },
    ],
  },
  {
    id: "avanzado",
    label: "Avanzado · Agentes IA",
    items: [
      { href: "/admin/agents", label: "Agentes IA", icon: Bot, requires: "agents" },
      { href: "/admin/processing", label: "Procesamiento de artículos", icon: Cog, requires: "advanced" },
      { href: "/admin/knowledge", label: "Base de conocimiento", icon: BookOpen, requires: "advanced" },
      { href: "/admin/explorer", label: "Explorador del sistema", icon: Layers, requires: "advanced" },
      { href: "/admin/health-check", label: "Salud del sistema", icon: Activity, requires: "advanced" },
      { href: "/admin/performance", label: "Rendimiento", icon: BarChart3, requires: "advanced" },
      { href: "/admin/audits", label: "Auditorías del sitio", icon: CheckCircle, requires: "advanced" },
      { href: "/admin/guide", label: "Ecosistema de Agentes (en vivo)", icon: Sparkles, requires: "advanced" },
    ],
  },
];

/** Resalta rutas anidadas (ej. /admin/news/new, /admin/news/:id/edit resaltan "Noticias"). */
export function isNavItemActive(location: string, href: string): boolean {
  const exact = href === "/admin/dashboard" || href === "/admin/manual";
  return exact ? location === href : location === href || location.startsWith(href + "/");
}

/**
 * Evalúa si un item de nav debe mostrarse, dado el estado de permisos ya cargado por
 * useMyPermissions()/useAdminAuth(). Mismo criterio que antes gateaba las secciones de
 * AdminDashboard.tsx (canConfig/hasAgents/hasAdvancedTools/isAdmin).
 */
export function canSeeNavItem(
  item: AdminNavItem,
  ctx: { has: (perm: string) => boolean; isAdmin: boolean },
): boolean {
  if (!item.requires) return true;
  if (item.requires === "adminOnly") return ctx.isAdmin;
  return ctx.has(item.requires);
}
