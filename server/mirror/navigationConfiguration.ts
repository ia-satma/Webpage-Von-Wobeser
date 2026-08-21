import { createHash } from "node:crypto";
import { z } from "zod";
import {
  DEFAULT_CLASSIC_NAVIGATION_CONFIGURATION,
  DEFAULT_NAVIGATION_CONFIGURATION,
  DEFAULT_NAVIGATION_PRESET,
  NAVIGATION_CHILD_IDS,
  NAVIGATION_DESTINATIONS,
  NAVIGATION_PRESET_IDS,
  NAVIGATION_PRESET_METADATA,
  NAVIGATION_PRIMARY_IDS,
  NAVIGATION_VERSION,
  type NavigationChildId,
  type NavigationConfiguration,
  type NavigationPresetId,
  type NavigationPrimaryId,
} from "@shared/navigation";
import { storage } from "../storage";
import type { ConfigMap } from "./siteConfig";

export type NavigationAvailabilityStatus = "ready" | "no-content" | "hidden" | "future";

export type NavigationAvailability = Record<NavigationPrimaryId | NavigationChildId, {
  contentReady: boolean;
  reasonEn: string;
  reasonEs: string;
  future?: boolean;
}>;

export type ResolvedNavigationChild = {
  id: NavigationChildId | `practice:${string}` | `industry:${string}`;
  label: string;
  href: string;
  configuredVisible: boolean;
  visible: boolean;
  status: NavigationAvailabilityStatus;
  reason: string;
  dynamic?: "practice" | "industry";
};

export type ResolvedNavigationPrimary = {
  id: NavigationPrimaryId;
  label: string;
  href: string;
  configuredVisible: boolean;
  visible: boolean;
  status: NavigationAvailabilityStatus;
  reason: string;
  children: ResolvedNavigationChild[];
};

export type ResolvedNavigationTree = {
  version: typeof NAVIGATION_VERSION;
  preset: NavigationPresetId;
  revision: string;
  items: ResolvedNavigationPrimary[];
  utilities: {
    search: { label: string; required: true };
    language: { label: "ES | EN"; required: true };
    contact: { label: string; href: string; required: true };
  };
};

export type NavigationPresetState = {
  activePreset: NavigationPresetId;
  configurations: Record<NavigationPresetId, NavigationConfiguration>;
};

export const NAVIGATION_PRESET_CONFIG_KEYS: Record<NavigationPresetId, string> = {
  "definitive-2026": "nav_structure_v2",
  "classic-vwys": "nav_classic_structure_v2",
};

export const NAVIGATION_ACTIVE_PRESET_KEY = "nav_active_preset";

const ALL_CHILD_IDS = Object.values(NAVIGATION_CHILD_IDS).flat() as NavigationChildId[];
const primaryIdSchema = z.enum(NAVIGATION_PRIMARY_IDS);
const childIdSchema = z.enum(ALL_CHILD_IDS as [NavigationChildId, ...NavigationChildId[]]);
const labelSchema = z.string().trim().min(1).max(120);
const localizedLabelSchema = z.object({
  labelEn: labelSchema,
  labelEs: labelSchema,
}).strict();
const childSchema = localizedLabelSchema.extend({
  id: childIdSchema,
  visible: z.boolean(),
}).strict();
const primarySchema = localizedLabelSchema.extend({
  id: primaryIdSchema,
  visible: z.boolean(),
  children: z.array(childSchema),
}).strict();

export const navigationConfigurationSchema = z.object({
  version: z.literal(NAVIGATION_VERSION),
  items: z.array(primarySchema).length(NAVIGATION_PRIMARY_IDS.length),
  utilities: z.object({
    search: localizedLabelSchema,
    contact: localizedLabelSchema,
  }).strict(),
}).strict().superRefine((configuration, ctx) => {
  const primaryIds = configuration.items.map((item) => item.id);
  if (new Set(primaryIds).size !== primaryIds.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["items"], message: "No se permiten secciones duplicadas." });
  }
  for (const id of NAVIGATION_PRIMARY_IDS) {
    const item = configuration.items.find((candidate) => candidate.id === id);
    if (!item) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["items"], message: `Falta la sección obligatoria ${id}.` });
      continue;
    }
    const expected = NAVIGATION_CHILD_IDS[id] as readonly NavigationChildId[];
    const actual = item.children.map((child) => child.id);
    const exact = actual.length === expected.length
      && new Set(actual).size === actual.length
      && expected.every((childId) => actual.includes(childId));
    if (!exact) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["items", configuration.items.indexOf(item), "children"],
        message: `Los destinos de ${id} no coinciden con el registro permitido.`,
      });
    }
  }
});

function cloneDefault(): NavigationConfiguration {
  return JSON.parse(JSON.stringify(DEFAULT_NAVIGATION_CONFIGURATION)) as NavigationConfiguration;
}

function cloneClassicDefault(): NavigationConfiguration {
  return JSON.parse(JSON.stringify(DEFAULT_CLASSIC_NAVIGATION_CONFIGURATION)) as NavigationConfiguration;
}

export function normalizeLegacyInsightsMenuLabel(configuration: NavigationConfiguration): NavigationConfiguration {
  const item = configuration.items.find((candidate) => candidate.id === "perspectives");
  if (item?.labelEs !== "Perspectivas" || item.labelEn !== "Insights") return configuration;
  return {
    ...configuration,
    items: configuration.items.map((candidate) => candidate.id === "perspectives"
      ? { ...candidate, labelEs: "Insights" }
      : candidate),
  };
}

export function parseNavigationConfiguration(value: unknown): NavigationConfiguration {
  const parsed = navigationConfigurationSchema.safeParse(value);
  return parsed.success ? normalizeLegacyInsightsMenuLabel(parsed.data) : cloneDefault();
}

export function navigationConfigurationFromConfig(config: ConfigMap): NavigationConfiguration {
  const raw = config.nav_structure_v2?.value;
  if (!raw) return cloneDefault();
  try {
    return parseNavigationConfiguration(JSON.parse(raw));
  } catch {
    return cloneDefault();
  }
}

export function classicNavigationConfigurationFromConfig(config: ConfigMap): NavigationConfiguration {
  const raw = config[NAVIGATION_PRESET_CONFIG_KEYS["classic-vwys"]]?.value;
  if (!raw) return cloneClassicDefault();
  try {
    const parsed = navigationConfigurationSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : cloneClassicDefault();
  } catch {
    return cloneClassicDefault();
  }
}

export function navigationPresetFromConfig(config: ConfigMap): NavigationPresetId {
  const raw = config[NAVIGATION_ACTIVE_PRESET_KEY]?.value;
  return NAVIGATION_PRESET_IDS.includes(raw as NavigationPresetId)
    ? raw as NavigationPresetId
    : DEFAULT_NAVIGATION_PRESET;
}

export function navigationPresetStateFromConfig(config: ConfigMap): NavigationPresetState {
  return {
    activePreset: navigationPresetFromConfig(config),
    configurations: {
      "definitive-2026": navigationConfigurationFromConfig(config),
      "classic-vwys": classicNavigationConfigurationFromConfig(config),
    },
  };
}

export function navigationPresetStateRevision(state: NavigationPresetState): string {
  return createHash("sha256").update(JSON.stringify(state)).digest("hex").slice(0, 16);
}

export function navigationRevision(configuration: NavigationConfiguration): string {
  return createHash("sha256").update(JSON.stringify(configuration)).digest("hex").slice(0, 16);
}

const CLASSIC_DESTINATIONS: Partial<Record<NavigationPrimaryId | NavigationChildId, {
  pathEs: string;
  pathEn: string;
}>> = {
  perspectives: { pathEs: "/publicaciones", pathEn: "/publications" },
  "perspectives-communications": { pathEs: "/news", pathEn: "/news?lang=en" },
  talent: { pathEs: "/bolsa-de-trabajo", pathEn: "/careers" },
};

export function navigationDestination(
  id: NavigationPrimaryId | NavigationChildId,
  preset: NavigationPresetId = DEFAULT_NAVIGATION_PRESET,
) {
  return preset === "classic-vwys" && CLASSIC_DESTINATIONS[id]
    ? CLASSIC_DESTINATIONS[id]!
    : NAVIGATION_DESTINATIONS[id];
}

function configBoolean(config: ConfigMap, key: string): boolean {
  return (config[key]?.value || "false").trim().toLowerCase() === "true";
}

function hasBilingual(config: ConfigMap, ...keys: string[]): boolean {
  return keys.every((key) => Boolean(config[key]?.value.trim() && config[key]?.valueEs.trim()));
}

function ready(reasonEs = "Contenido disponible", reasonEn = "Content available") {
  return { contentReady: true, reasonEs, reasonEn };
}

function missing(reasonEs: string, reasonEn: string, future = false) {
  return { contentReady: false, reasonEs, reasonEn, future };
}

export async function getNavigationAvailability(config: ConfigMap, now = new Date()): Promise<NavigationAvailability> {
  const [events, alliances, openings, pressCount, recognitionCount] = await Promise.all([
    storage.getEvents(),
    storage.getAlliances(),
    storage.getJobOpenings(),
    storage.getPublishedNewsCount("press"),
    storage.getPublishedNewsCount("rankings"),
  ]);

  const hasPublishedEvent = events.some((event) => event.published === true);
  const hasPublishedAlliance = alliances.some((alliance) => alliance.published === true);
  const hasCurrentOpening = openings.some((opening) => (
    opening.published === true
    && (!opening.expiresAt || new Date(opening.expiresAt) >= now)
  ));
  const internationalReady = hasPublishedAlliance && hasBilingual(
    config,
    "page_international_intro",
    "page_international_body",
  );
  const alumniReady = configBoolean(config, "page_alumni_published") && hasBilingual(
    config,
    "page_alumni_intro",
    "page_alumni_body",
  );

  const availability = {} as NavigationAvailability;
  for (const id of NAVIGATION_PRIMARY_IDS) availability[id] = ready();
  for (const id of ALL_CHILD_IDS) availability[id] = ready();

  availability["firm-international"] = internationalReady
    ? ready()
    : missing(
      "Requiere introducción y cuerpo bilingües, además de una alianza publicada.",
      "Requires bilingual introduction and body plus one published alliance.",
    );
  availability["firm-alumni"] = alumniReady
    ? ready()
    : missing(
      "Capacidad futura: requiere contenido bilingüe y autorización expresa.",
      "Future capability: bilingual content and explicit approval are required.",
      true,
    );
  availability["perspectives-events"] = hasPublishedEvent
    ? ready()
    : missing("Requiere al menos un evento publicado.", "Requires at least one published event.");
  availability["perspectives-recognitions"] = recognitionCount > 0
    ? ready()
    : missing(
      "Requiere al menos un reconocimiento publicado. La página permanece preparada para activarse desde Administración.",
      "Requires at least one published recognition. The page remains ready to activate from Administration.",
    );
  availability["perspectives-press"] = pressCount > 0
    ? ready()
    : missing("Requiere al menos una publicación de Sala de prensa.", "Requires at least one press publication.");
  availability["talent-openings"] = hasCurrentOpening
    ? ready()
    : missing("Requiere al menos una vacante publicada y vigente.", "Requires at least one current published opening.");

  return availability;
}

function itemState(
  configuredVisible: boolean,
  availability: NavigationAvailability[NavigationPrimaryId | NavigationChildId],
): { visible: boolean; status: NavigationAvailabilityStatus } {
  if (availability.future && !availability.contentReady) return { visible: false, status: "future" };
  if (!configuredVisible) return { visible: false, status: "hidden" };
  if (!availability.contentReady) return { visible: false, status: "no-content" };
  return { visible: true, status: "ready" };
}

export function resolveNavigationTree(
  configuration: NavigationConfiguration,
  availability: NavigationAvailability,
  lang: "en" | "es",
  preset: NavigationPresetId = DEFAULT_NAVIGATION_PRESET,
): ResolvedNavigationTree {
  const labelKey = lang === "es" ? "labelEs" : "labelEn";
  const pathKey = lang === "es" ? "pathEs" : "pathEn";
  const reasonKey = lang === "es" ? "reasonEs" : "reasonEn";
  const items = configuration.items.map((item) => {
    const state = itemState(item.visible, availability[item.id]);
    return {
      id: item.id,
      label: item[labelKey],
      href: navigationDestination(item.id, preset)[pathKey],
      configuredVisible: item.visible,
      ...state,
      reason: availability[item.id][reasonKey],
      children: item.children.map((child) => {
        const childState = itemState(child.visible, availability[child.id]);
        return {
          id: child.id,
          label: child[labelKey],
          href: navigationDestination(child.id, preset)[pathKey],
          configuredVisible: child.visible,
          ...childState,
          reason: availability[child.id][reasonKey],
        };
      }),
    };
  });

  return {
    version: NAVIGATION_VERSION,
    preset,
    revision: navigationRevision(configuration),
    items,
    utilities: {
      search: { label: configuration.utilities.search[labelKey], required: true },
      language: { label: "ES | EN", required: true },
      contact: {
        label: configuration.utilities.contact[labelKey],
        href: lang === "es" ? "/contacto" : "/contact",
        required: true,
      },
    },
  };
}

export function unavailableRequestedDestinations(
  configuration: NavigationConfiguration,
  availability: NavigationAvailability,
  previous?: NavigationConfiguration,
): NavigationChildId[] {
  const previouslyVisible = new Set(
    previous?.items.flatMap((item) => item.children).filter((child) => child.visible).map((child) => child.id) || [],
  );
  return configuration.items.flatMap((item) => item.children)
    .filter((child) => child.visible && !previouslyVisible.has(child.id) && !availability[child.id].contentReady)
    .map((child) => child.id);
}

export function adminNavigationPayload(
  configuration: NavigationConfiguration,
  availability: NavigationAvailability,
  preset: NavigationPresetId = DEFAULT_NAVIGATION_PRESET,
) {
  const es = resolveNavigationTree(configuration, availability, "es", preset);
  const en = resolveNavigationTree(configuration, availability, "en", preset);
  return {
    version: NAVIGATION_VERSION,
    revision: es.revision,
    configuration,
    items: configuration.items.map((item, index) => ({
      ...item,
      order: index,
      pathEs: navigationDestination(item.id, preset).pathEs,
      pathEn: navigationDestination(item.id, preset).pathEn,
      canActivate: availability[item.id].contentReady,
      status: es.items[index].status,
      statusEn: en.items[index].status,
      reasonEs: es.items[index].reason,
      reasonEn: en.items[index].reason,
      children: item.children.map((child, childIndex) => ({
        ...child,
        order: childIndex,
        pathEs: navigationDestination(child.id, preset).pathEs,
        pathEn: navigationDestination(child.id, preset).pathEn,
        canActivate: availability[child.id].contentReady,
        status: es.items[index].children[childIndex].status,
        statusEn: en.items[index].children[childIndex].status,
        reasonEs: es.items[index].children[childIndex].reason,
        reasonEn: en.items[index].children[childIndex].reason,
      })),
    })),
    fixed: {
      homeViaLogo: true,
      search: true,
      language: true,
      contact: true,
      searchLabelEn: configuration.utilities.search.labelEn,
      searchLabelEs: configuration.utilities.search.labelEs,
      contactLabelEn: configuration.utilities.contact.labelEn,
      contactLabelEs: configuration.utilities.contact.labelEs,
    },
    preview: { es, en },
  };
}

export function adminNavigationPresetsPayload(
  state: NavigationPresetState,
  availability: NavigationAvailability,
) {
  const definitive = adminNavigationPayload(
    state.configurations["definitive-2026"],
    availability,
    "definitive-2026",
  );
  const classic = adminNavigationPayload(
    state.configurations["classic-vwys"],
    availability,
    "classic-vwys",
  );
  const active = state.activePreset === "classic-vwys" ? classic : definitive;
  return {
    ...active,
    activePreset: state.activePreset,
    stateRevision: navigationPresetStateRevision(state),
    presets: {
      "definitive-2026": {
        id: "definitive-2026" as const,
        ...NAVIGATION_PRESET_METADATA["definitive-2026"],
        active: state.activePreset === "definitive-2026",
        ...definitive,
      },
      "classic-vwys": {
        id: "classic-vwys" as const,
        ...NAVIGATION_PRESET_METADATA["classic-vwys"],
        active: state.activePreset === "classic-vwys",
        ...classic,
      },
    },
  };
}
