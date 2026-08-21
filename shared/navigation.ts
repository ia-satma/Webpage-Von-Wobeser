/**
 * Contrato estable de la navegación pública VWyS.
 *
 * Las rutas se resuelven únicamente desde este registro. El CMS guarda etiquetas,
 * orden y visibilidad, pero nunca acepta URLs arbitrarias.
 */
export const NAVIGATION_VERSION = 2 as const;

export const NAVIGATION_PRESET_IDS = ["definitive-2026", "classic-vwys"] as const;

export type NavigationPresetId = typeof NAVIGATION_PRESET_IDS[number];

export const DEFAULT_NAVIGATION_PRESET: NavigationPresetId = "definitive-2026";

export const NAVIGATION_PRESET_METADATA: Record<NavigationPresetId, {
  name: string;
  description: string;
}> = {
  "definitive-2026": {
    name: "Menú definitivo 2026",
    description: "La navegación editorial aprobada, con Insights, Talento y desplegables compactos.",
  },
  "classic-vwys": {
    name: "Menú clásico VWyS",
    description: "El encabezado anterior, conservado como respaldo sobre las rutas y la seguridad actuales.",
  },
};

export const NAVIGATION_PRIMARY_IDS = [
  "firm",
  "attorneys",
  "practices",
  "industries",
  "perspectives",
  "talent",
] as const;

export type NavigationPrimaryId = typeof NAVIGATION_PRIMARY_IDS[number];

export const NAVIGATION_CHILD_IDS = {
  firm: [
    "firm-overview",
    "firm-history",
    "firm-value",
    "firm-recognitions",
    "firm-international",
    "firm-probono",
    "firm-diversity",
    "firm-alumni",
  ],
  attorneys: [
    "attorneys-search",
    "attorneys-all",
    "attorneys-partners",
    "attorneys-of-counsel",
    "attorneys-counsel",
    "attorneys-associates",
  ],
  practices: ["practices-all"],
  industries: ["industries-all"],
  perspectives: [
    "perspectives-articles",
    "perspectives-events",
    "perspectives-recognitions",
    "perspectives-communications",
    "perspectives-analysis",
    "perspectives-press",
    "perspectives-all",
    "perspectives-subscribe",
  ],
  talent: [
    "talent-culture",
    "talent-work",
    "talent-interns",
    "talent-openings",
  ],
} as const;

export type NavigationChildId = typeof NAVIGATION_CHILD_IDS[NavigationPrimaryId][number];

/**
 * Destinos ya representados por el enlace editorial del encabezado de cada
 * desplegable. Permanecen en la configuración versionada por compatibilidad,
 * pero no deben repetirse dentro de la lista pública.
 */
export const NAVIGATION_LANDING_CHILD_IDS = [
  "firm-overview",
  "attorneys-all",
  "practices-all",
  "industries-all",
  "perspectives-all",
  "talent-work",
] as const satisfies readonly NavigationChildId[];

export type NavigationLocalizedLabel = {
  labelEn: string;
  labelEs: string;
};

export type NavigationChildConfiguration = NavigationLocalizedLabel & {
  id: NavigationChildId;
  visible: boolean;
};

export type NavigationPrimaryConfiguration = NavigationLocalizedLabel & {
  id: NavigationPrimaryId;
  visible: boolean;
  children: NavigationChildConfiguration[];
};

export type NavigationUtilitiesConfiguration = {
  search: NavigationLocalizedLabel;
  contact: NavigationLocalizedLabel;
};

export type NavigationConfiguration = {
  version: typeof NAVIGATION_VERSION;
  items: NavigationPrimaryConfiguration[];
  utilities: NavigationUtilitiesConfiguration;
};

export type NavigationDestination = {
  pathEs: string;
  pathEn: string;
};

export const NAVIGATION_DESTINATIONS: Record<NavigationPrimaryId | NavigationChildId, NavigationDestination> = {
  firm: { pathEs: "/acerca-de", pathEn: "/about" },
  "firm-overview": { pathEs: "/acerca-de", pathEn: "/about" },
  "firm-history": { pathEs: "/acerca-de#historia", pathEn: "/about#history" },
  "firm-value": { pathEs: "/acerca-de#propuesta-de-valor", pathEn: "/about#value-proposition" },
  "firm-recognitions": { pathEs: "/acerca-de#reconocimientos", pathEn: "/about#recognitions" },
  "firm-international": { pathEs: "/nuestra-firma/alcance-internacional", pathEn: "/our-firm/international-reach" },
  "firm-probono": { pathEs: "/nuestra-firma/probono", pathEn: "/our-firm/our-firm-probono" },
  "firm-diversity": { pathEs: "/nuestra-firma/diversidad", pathEn: "/our-firm/diversity" },
  "firm-alumni": { pathEs: "/nuestra-firma/alumni", pathEn: "/our-firm/alumni" },

  attorneys: { pathEs: "/attorneys", pathEn: "/attorneys?lang=en" },
  "attorneys-search": { pathEs: "/attorneys#buscar", pathEn: "/attorneys?lang=en#search" },
  "attorneys-all": { pathEs: "/attorneys#directorio", pathEn: "/attorneys?lang=en#directory" },
  "attorneys-partners": { pathEs: "/attorneys/partners", pathEn: "/attorneys/partners?lang=en" },
  "attorneys-of-counsel": { pathEs: "/attorneys/of-counsel", pathEn: "/attorneys/of-counsel?lang=en" },
  "attorneys-counsel": { pathEs: "/attorneys/counsel", pathEn: "/attorneys/counsel?lang=en" },
  "attorneys-associates": { pathEs: "/attorneys/associates", pathEn: "/attorneys/associates?lang=en" },

  practices: { pathEs: "/capacidades/practicas", pathEn: "/capabilities/practices" },
  "practices-all": { pathEs: "/capacidades/practicas", pathEn: "/capabilities/practices" },

  industries: { pathEs: "/capacidades/industrias", pathEn: "/capabilities/industries" },
  "industries-all": { pathEs: "/capacidades/industrias", pathEn: "/capabilities/industries" },

  perspectives: { pathEs: "/perspectivas", pathEn: "/insights" },
  "perspectives-articles": { pathEs: "/articles", pathEn: "/articles?lang=en" },
  "perspectives-events": { pathEs: "/perspectivas/eventos", pathEn: "/insights/events" },
  "perspectives-recognitions": { pathEs: "/perspectivas/reconocimientos", pathEn: "/insights/recognitions" },
  "perspectives-communications": { pathEs: "/perspectivas/comunicaciones", pathEn: "/insights/communications" },
  "perspectives-analysis": { pathEs: "/perspectivas/analisis-y-actualizaciones", pathEn: "/insights/analysis-and-updates" },
  "perspectives-press": { pathEs: "/perspectivas/sala-de-prensa", pathEn: "/insights/press-room" },
  "perspectives-all": { pathEs: "/perspectivas", pathEn: "/insights" },
  "perspectives-subscribe": { pathEs: "/#newsletter", pathEn: "/?lang=en#newsletter" },

  talent: { pathEs: "/bolsa-de-trabajo", pathEn: "/careers" },
  "talent-culture": { pathEs: "/bolsa-de-trabajo#cultura", pathEn: "/careers#culture" },
  "talent-work": { pathEs: "/bolsa-de-trabajo", pathEn: "/careers" },
  "talent-interns": { pathEs: "/bolsa-de-trabajo/pasantes", pathEn: "/careers/interns" },
  "talent-openings": { pathEs: "/bolsa-de-trabajo/vacantes", pathEn: "/careers/openings" },
};

const labels: Record<NavigationPrimaryId | NavigationChildId, NavigationLocalizedLabel> = {
  firm: { labelEs: "Nuestra firma", labelEn: "Our Firm" },
  "firm-overview": { labelEs: "Quiénes somos", labelEn: "Who we are" },
  "firm-history": { labelEs: "Historia y trayectoria", labelEn: "History and track record" },
  "firm-value": { labelEs: "Propuesta de valor", labelEn: "Value proposition" },
  "firm-recognitions": { labelEs: "Reconocimientos", labelEn: "Recognitions" },
  "firm-international": { labelEs: "Alcance internacional", labelEn: "International reach" },
  "firm-probono": { labelEs: "Pro Bono", labelEn: "Pro Bono" },
  "firm-diversity": { labelEs: "Diversidad e inclusión", labelEn: "Diversity and inclusion" },
  "firm-alumni": { labelEs: "Alumni", labelEn: "Alumni" },
  attorneys: { labelEs: "Abogados", labelEn: "Attorneys" },
  "attorneys-search": { labelEs: "Buscar abogados", labelEn: "Search attorneys" },
  "attorneys-all": { labelEs: "Ver todos", labelEn: "View all" },
  "attorneys-partners": { labelEs: "Socios", labelEn: "Partners" },
  "attorneys-of-counsel": { labelEs: "Of Counsel", labelEn: "Of Counsel" },
  "attorneys-counsel": { labelEs: "Consejeros", labelEn: "Counsel" },
  "attorneys-associates": { labelEs: "Asociados", labelEn: "Associates" },
  practices: { labelEs: "Prácticas", labelEn: "Practices" },
  "practices-all": { labelEs: "Ver todas las prácticas", labelEn: "View all practices" },
  industries: { labelEs: "Industrias", labelEn: "Industries" },
  "industries-all": { labelEs: "Ver todas las industrias", labelEn: "View all industries" },
  perspectives: { labelEs: "Insights", labelEn: "Insights" },
  "perspectives-articles": { labelEs: "Artículos", labelEn: "Articles" },
  "perspectives-events": { labelEs: "Eventos", labelEn: "Events" },
  "perspectives-recognitions": { labelEs: "Reconocimientos", labelEn: "Recognitions" },
  "perspectives-communications": { labelEs: "Comunicaciones", labelEn: "Communications" },
  "perspectives-analysis": { labelEs: "Análisis y actualizaciones", labelEn: "Analysis and updates" },
  "perspectives-press": { labelEs: "Sala de prensa", labelEn: "Press room" },
  "perspectives-all": { labelEs: "Ver todas", labelEn: "View all" },
  "perspectives-subscribe": { labelEs: "Suscríbete", labelEn: "Subscribe" },
  talent: { labelEs: "Talento", labelEn: "Careers" },
  "talent-culture": { labelEs: "Conoce nuestra cultura", labelEn: "Discover our culture" },
  "talent-work": { labelEs: "Trabaja con nosotros", labelEn: "Work with us" },
  "talent-interns": { labelEs: "Pasantes", labelEn: "Interns" },
  "talent-openings": { labelEs: "Vacantes", labelEn: "Openings" },
};

export const DEFAULT_NAVIGATION_CONFIGURATION: NavigationConfiguration = {
  version: NAVIGATION_VERSION,
  items: NAVIGATION_PRIMARY_IDS.map((id) => ({
    id,
    ...labels[id],
    visible: true,
    children: NAVIGATION_CHILD_IDS[id].map((childId) => ({
      id: childId,
      ...labels[childId],
      // Estos destinos conservan sus rutas y configuración, pero permanecen
      // preparados fuera de la navegación hasta que el equipo los habilite
      // explícitamente desde Administración.
      visible: ![
        "firm-alumni",
        "firm-value",
        "firm-recognitions",
        "perspectives-recognitions",
      ].includes(childId),
    })),
  })) as NavigationPrimaryConfiguration[],
  utilities: {
    search: { labelEs: "Buscar", labelEn: "Search" },
    contact: { labelEs: "Contáctanos", labelEn: "Contact us" },
  },
};

const CLASSIC_VISIBLE_CHILDREN = new Set<NavigationChildId>([
  "firm-probono",
  "firm-diversity",
  "attorneys-partners",
  "attorneys-of-counsel",
  "attorneys-counsel",
  "attorneys-associates",
  "perspectives-articles",
  "perspectives-communications",
  "talent-interns",
]);

const classicLabels: Partial<Record<NavigationPrimaryId | NavigationChildId, NavigationLocalizedLabel>> = {
  firm: { labelEs: "Nuestra Firma", labelEn: "Our Firm" },
  perspectives: { labelEs: "Publicaciones", labelEn: "Publications" },
  talent: { labelEs: "Carrera en VWyS", labelEn: "Careers at VWyS" },
  "perspectives-communications": { labelEs: "Noticias", labelEn: "News" },
};

/**
 * Copia administrable del menú que precedió a la navegación definitiva. Usa el
 * mismo inventario cerrado de destinos; por ello activarlo nunca revive HTML,
 * scripts ni URLs arbitrarias del espejo histórico.
 */
export const DEFAULT_CLASSIC_NAVIGATION_CONFIGURATION: NavigationConfiguration = {
  version: NAVIGATION_VERSION,
  items: DEFAULT_NAVIGATION_CONFIGURATION.items.map((item) => ({
    ...item,
    ...(classicLabels[item.id] || {}),
    children: item.children.map((child) => ({
      ...child,
      ...(classicLabels[child.id] || {}),
      visible: CLASSIC_VISIBLE_CHILDREN.has(child.id),
    })),
  })),
  utilities: {
    search: { labelEs: "Buscar", labelEn: "Search" },
    contact: { labelEs: "Contacto", labelEn: "Contact" },
  },
};
