import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  HelpCircle,
  Newspaper,
  FileText,
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
  LineChart,
  Bot,
  Cog,
  BookOpen,
  Layers,
  Activity,
  BarChart3,
  CheckCircle,
  Sparkles,
  Volume2,
  Trophy,
  Handshake,
  Quote,
  Link2,
  MapPin,
  ClipboardList,
  UserPlus,
  Landmark,
  HeartHandshake,
  Lock,
  GraduationCap,
  MessageSquare,
  Presentation,
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
  /**
   * Secciones editables en el panel que TODAVÍA no se muestran en el sitio público —
   * o que directamente aún no tienen pantalla real (apuntan a /admin/coming-soon/:key).
   * El cliente no ha autorizado que estos huecos se conecten al frontend todavía.
   */
  comingSoon?: boolean;
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
    id: "nuestra-firma",
    label: "Nuestra Firma",
    items: [
      { href: "/admin/site-config/firma", label: "Textos — Nuestra Firma", icon: Landmark, requires: "config" },
      { href: "/admin/site-config/probono", label: "Pro Bono", icon: HeartHandshake, requires: "config" },
      { href: "/admin/site-config/diversidad", label: "Diversidad e Inclusión", icon: Sparkles, requires: "config" },
      { href: "/admin/site-config/privacidad", label: "Aviso de Privacidad", icon: Lock, requires: "config" },
    ],
  },
  {
    id: "abogados",
    label: "Abogados",
    items: [
      { href: "/admin/team", label: "Abogados y equipo", icon: Users },
    ],
  },
  {
    id: "capacidades",
    label: "Capacidades",
    items: [
      { href: "/admin/practice-groups", label: "Áreas de práctica", icon: Briefcase },
      { href: "/admin/industry-groups", label: "Sectores / Industrias", icon: Building2 },
      { href: "/admin/desks", label: "Áreas especializadas (desks)", icon: ClipboardList },
      { href: "/admin/site-config/capacidades", label: "Textos — Capacidades", icon: Landmark, requires: "config" },
    ],
  },
  {
    id: "publicaciones",
    label: "Publicaciones",
    items: [
      { href: "/admin/news", label: "Noticias", icon: Newspaper },
    ],
  },
  {
    id: "carrera",
    label: "Carrera en VWyS",
    items: [
      { href: "/admin/site-config/carrera", label: "Textos — Carrera en VWyS", icon: GraduationCap, requires: "config" },
      { href: "/admin/submissions?tab=career", label: "Solicitudes de pasantías", icon: FileText },
    ],
  },
  {
    id: "contacto",
    label: "Contacto",
    items: [
      { href: "/admin/site-config/contacto", label: "Textos — Contacto", icon: Mail, requires: "config" },
      { href: "/admin/submissions?tab=contact", label: "Mensajes de contacto", icon: MessageSquare },
    ],
  },
  {
    id: "otros-contenidos",
    label: "Otros contenidos",
    items: [
      { href: "/admin/recognitions", label: "Reconocimientos", icon: Award },
    ],
  },
  {
    id: "configuracion",
    label: "Configuración",
    items: [
      { href: "/admin/site-config", label: "Portada y pie de página", icon: Settings, requires: "config" },
      { href: "/admin/site-config/seo", label: "SEO — Analytics y verificación", icon: LineChart, requires: "config" },
      { href: "/admin/translations", label: "Traducciones", icon: Languages, requires: "config" },
      { href: "/admin/users", label: "Usuarios y accesos", icon: ShieldCheck, requires: "adminOnly" },
    ],
  },
  {
    id: "construccion",
    label: "En construcción",
    items: [
      { href: "/admin/events", label: "Eventos", icon: Calendar, comingSoon: true },
      { href: "/admin/gallery", label: "Galería de imágenes", icon: Images, requires: "config", comingSoon: true },
      { href: "/admin/coming-soon/premios", label: "Premios", icon: Trophy, comingSoon: true },
      { href: "/admin/coming-soon/clientes", label: "Clientes", icon: Handshake, comingSoon: true },
      { href: "/admin/coming-soon/testimonios", label: "Testimonios", icon: Quote, comingSoon: true },
      { href: "/admin/coming-soon/alianzas", label: "Alianzas", icon: Link2, comingSoon: true },
      { href: "/admin/coming-soon/oficinas", label: "Oficinas", icon: MapPin, comingSoon: true },
      { href: "/admin/coming-soon/vacantes", label: "Vacantes", icon: UserPlus, comingSoon: true },
    ],
  },
  {
    id: "avanzado",
    label: "Avanzado · Agentes IA",
    items: [
      { href: "/admin/agents", label: "Agentes IA", icon: Bot, requires: "agents" },
      { href: "/admin/presentations", label: "Presentaciones IA", icon: Presentation, requires: "agents" },
      { href: "/admin/generated-images", label: "Imágenes generadas por IA", icon: Sparkles, requires: "agents" },
      { href: "/admin/generated-audio", label: "Audio generado por IA", icon: Volume2, requires: "agents" },
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

export interface ComingSoonSection {
  key: string;
  title: string;
  icon: LucideIcon;
  status: "no-screen" | "not-public";
  description: string;
}

/**
 * Contenido de la página /admin/coming-soon/:key — una entrada por sección "en
 * construcción" sin pantalla propia todavía (status "no-screen"). Las secciones que SÍ
 * tienen pantalla real pero aún no se muestran en el sitio público (Galería/Eventos/Blog,
 * status "not-public") no usan esta ruta — su propio AdminPageHeader muestra el badge.
 */
export const COMING_SOON_SECTIONS: ComingSoonSection[] = [
  {
    key: "premios", title: "Premios", icon: Trophy, status: "no-screen",
    description: "Premios y reconocimientos individuales que ha recibido la firma o sus abogados (distinto de \"Reconocimientos\", que son rankings de publicaciones como Chambers o Legal 500).",
  },
  {
    key: "clientes", title: "Clientes", icon: Handshake, status: "no-screen",
    description: "Logos y nombres de clientes representativos de la firma, para mostrar como prueba social en el sitio.",
  },
  {
    key: "testimonios", title: "Testimonios", icon: Quote, status: "no-screen",
    description: "Citas y testimonios de clientes sobre su experiencia trabajando con la firma.",
  },
  {
    key: "alianzas", title: "Alianzas", icon: Link2, status: "no-screen",
    description: "Redes y alianzas internacionales de las que forma parte la firma (ej. asociaciones de despachos aliados).",
  },
  {
    key: "oficinas", title: "Oficinas", icon: MapPin, status: "no-screen",
    description: "Ubicaciones físicas de la firma (dirección, mapa, datos de contacto por oficina), si en algún momento hay más de una sede.",
  },
  {
    key: "vacantes", title: "Vacantes", icon: UserPlus, status: "no-screen",
    description: "Puestos de trabajo abiertos en la firma, para publicarse en la página de Carrera.",
  },
];

/**
 * Resalta rutas anidadas (ej. /admin/news/new, /admin/news/:id/edit resaltan "Noticias";
 * /admin/site-config/firma resalta también "Portada y pie de página", su padre). Ignora "?"
 * del href al comparar — las entradas de Solicitudes usan /admin/submissions?tab=... y
 * wouter's `location` no incluye query.
 */
export function isNavItemActive(location: string, href: string): boolean {
  const path = href.split(/[?#]/)[0];
  const exact = path === "/admin/dashboard" || path === "/admin/manual";
  return exact ? location === path : location === path || location.startsWith(path + "/");
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
