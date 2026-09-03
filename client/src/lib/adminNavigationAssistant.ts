import { ADMIN_NAV_GROUPS, isNavItemActive, type AdminNavGroup, type AdminNavItem } from "@/lib/adminNav";

/**
 * Vocabulary used by the assisted navigation.  It deliberately resolves only to
 * existing sections; the command palette never performs a write or delete.
 */
const ACTION_ALIASES: Record<string, string[]> = {
  "/admin/news": ["publicar", "publicación", "publicaciones", "noticia", "noticias", "artículo", "artículos", "borrador", "borradores"],
  "/admin/team": ["perfil", "perfiles", "abogado", "abogados", "equipo", "biografía", "foto"],
  "/admin/submissions?tab=contact": ["solicitud", "solicitudes", "mensaje", "mensajes", "contacto", "inbox"],
  "/admin/submissions?tab=career": ["solicitud", "solicitudes", "pasante", "pasantías", "talento", "cv", "hoja de vida"],
  "/admin/site-config": ["portada", "inicio", "home", "principal"],
  "/admin/site-config/perspectivas": ["portada perspectivas", "perspectivas", "insights"],
  "/admin/navigation": ["menú", "menu", "navegación", "visibilidad"],
  "/admin/public-appearance": ["diseño", "diseños", "apariencia", "colores públicos"],
  "/admin/newsletter": ["newsletter", "suscriptores", "suscripciones"],
  "/admin/site-config/seo": ["seo", "analytics", "google analytics", "verificación"],
};

export type AssistedAdminAction = AdminNavItem & {
  group: Pick<AdminNavGroup, "id" | "label" | "description">;
  searchValue: string;
};

export function getAssistedAdminActions(canView: (item: AdminNavItem) => boolean): AssistedAdminAction[] {
  return ADMIN_NAV_GROUPS.flatMap((group) => group.items
    .filter(canView)
    .map((item) => ({
      ...item,
      group: {
        id: group.id,
        label: group.label,
        description: group.description,
      },
      searchValue: [item.label, group.label, group.description, ...(ACTION_ALIASES[item.href] || [])]
        .filter(Boolean)
        .join(" "),
    })));
}

export type AdminPageContext = {
  groupLabel?: string;
  sectionLabel?: string;
  detailLabel?: string;
  impact?: "site" | "content";
};

function longestActiveItem(location: string): { item: AdminNavItem; group: AdminNavGroup } | undefined {
  const candidates = ADMIN_NAV_GROUPS.flatMap((group) => group.items.map((item) => ({ item, group })))
    .filter(({ item }) => isNavItemActive(location, item.href));
  return candidates.sort((a, b) => b.item.href.length - a.item.href.length)[0];
}

/** Context labels are intentionally descriptive only; they never change navigation. */
export function getAdminPageContext(location: string): AdminPageContext {
  const active = longestActiveItem(location);
  const context: AdminPageContext = active
    ? { groupLabel: active.group.label || undefined, sectionLabel: active.item.label }
    : {};

  if (/^\/admin\/news\/new$/.test(location)) {
    return { groupLabel: "Contenido del sitio", sectionLabel: "Noticias y publicaciones", detailLabel: "Nueva publicación", impact: "content" };
  }
  if (/^\/admin\/news\/[\w-]+\/edit$/.test(location)) {
    return { groupLabel: "Contenido del sitio", sectionLabel: "Noticias y publicaciones", detailLabel: "Editar publicación", impact: "content" };
  }
  if (/^\/admin\/team\/new$/.test(location)) {
    return { groupLabel: "Contenido del sitio", sectionLabel: "Abogados y equipo", detailLabel: "Nuevo perfil", impact: "content" };
  }
  if (/^\/admin\/team\/[\w-]+\/edit$/.test(location)) {
    return { groupLabel: "Contenido del sitio", sectionLabel: "Abogados y equipo", detailLabel: "Editar perfil", impact: "content" };
  }

  if (
    location === "/admin/navigation"
    || location === "/admin/public-appearance"
    || location === "/admin/cookie-consent"
    || location === "/admin/translations"
    || location.startsWith("/admin/site-config")
  ) {
    return { ...context, impact: "site" };
  }

  return context;
}
