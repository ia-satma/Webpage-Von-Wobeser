import { storage } from "../storage";
import { NAVIGATION_LANDING_CHILD_IDS } from "@shared/navigation";
import { isPublicPracticeSlug } from "./publicPracticeGroups";
import { localizedGroupLabel, sortGroupsAlphabetically } from "./sortPublicGroups";
import { getConfigMap } from "./siteConfig";
import {
  getNavigationAvailability,
  navigationPresetStateFromConfig,
  resolveNavigationTree,
  type ResolvedNavigationTree,
} from "./navigationConfiguration";

export type NavigationMenuEntry = {
  label: string;
  href: string;
  slug: string;
};

export type PublicNavigationMenu = {
  practices: NavigationMenuEntry[];
  industries: NavigationMenuEntry[];
  navigation?: ResolvedNavigationTree;
};

export type NavigationGroupRecord = {
  slug: string;
  name: string;
  nameEs: string;
  order?: number | null;
  published?: boolean | null;
};

type RawNavigationGroups = {
  practices: NavigationGroupRecord[];
  industries: NavigationGroupRecord[];
};

const CACHE_TTL_MS = 60_000;
const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LANDING_CHILD_IDS = new Set<string>(NAVIGATION_LANDING_CHILD_IDS);

let cache: { expiresAt: number; value: RawNavigationGroups } | null = null;
let inFlight: Promise<RawNavigationGroups> | null = null;

function publicGroups(rows: NavigationGroupRecord[], practices = false): NavigationGroupRecord[] {
  return rows
    .filter((row) => (
      row.published !== false
      && SAFE_SLUG.test(row.slug)
      && (!practices || isPublicPracticeSlug(row.slug))
    ))
    .sort((a, b) => (
      (a.order ?? 0) - (b.order ?? 0)
      || a.name.localeCompare(b.name, "en")
    ));
}

export function buildPublicNavigationMenu(
  groups: RawNavigationGroups,
  lang: "en" | "es",
): PublicNavigationMenu {
  const suffix = lang === "en" ? "?lang=en" : "";
  const mapEntries = (rows: NavigationGroupRecord[], kind: "practice" | "industry") =>
    rows.map((row) => ({
      label: localizedGroupLabel(row, lang),
      href: `/${kind}/${encodeURIComponent(row.slug)}${suffix}`,
      slug: row.slug,
    })).filter((row) => row.label.length > 0);

  return {
    practices: mapEntries(
      sortGroupsAlphabetically(publicGroups(groups.practices, true), lang),
      "practice",
    ),
    industries: mapEntries(publicGroups(groups.industries), "industry"),
  };
}

async function getRawNavigationGroups(): Promise<RawNavigationGroups> {
  if (cache && cache.expiresAt > Date.now()) return cache.value;
  if (inFlight) return inFlight;

  inFlight = Promise.all([
    storage.getPracticeGroups(),
    storage.getIndustryGroups(),
  ])
    .then(([practices, industries]) => {
      const value = { practices, industries };
      cache = { expiresAt: Date.now() + CACHE_TTL_MS, value };
      return value;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

export async function getPublicNavigationMenu(lang: "en" | "es"): Promise<PublicNavigationMenu> {
  const [groups, config] = await Promise.all([getRawNavigationGroups(), getConfigMap()]);
  const menu = buildPublicNavigationMenu(groups, lang);
  const availability = await getNavigationAvailability(config);
  const presetState = navigationPresetStateFromConfig(config);
  const navigation = resolveNavigationTree(
    presetState.configurations[presetState.activePreset],
    availability,
    lang,
    presetState.activePreset,
  );
  const attachDynamicEntries = (
    kind: "practices" | "industries",
    entries: NavigationMenuEntry[],
  ) => {
    const item = navigation.items.find((candidate) => candidate.id === kind);
    if (!item) return;
    item.children.push(...entries.map((entry) => ({
      id: `${kind === "practices" ? "practice" : "industry"}:${entry.slug}` as const,
      label: entry.label,
      href: entry.href,
      configuredVisible: true,
      visible: true,
      status: "ready" as const,
      reason: lang === "es" ? "Contenido publicado" : "Published content",
      dynamic: kind === "practices" ? "practice" as const : "industry" as const,
    })));
  };
  attachDynamicEntries("practices", menu.practices);
  attachDynamicEntries("industries", menu.industries);
  for (const item of navigation.items) {
    item.children = item.children.filter((child) => !LANDING_CHILD_IDS.has(child.id));
  }
  return { ...menu, navigation };
}

export function invalidatePublicNavigationMenuCache(): void {
  cache = null;
  inFlight = null;
}
