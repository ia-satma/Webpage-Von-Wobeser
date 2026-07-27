import { storage } from "../storage";

export type NavigationMenuEntry = {
  label: string;
  href: string;
  slug: string;
};

export type PublicNavigationMenu = {
  practices: NavigationMenuEntry[];
  industries: NavigationMenuEntry[];
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

let cache: { expiresAt: number; value: RawNavigationGroups } | null = null;
let inFlight: Promise<RawNavigationGroups> | null = null;

function publicGroups(rows: NavigationGroupRecord[], excludeGermanDesk = false): NavigationGroupRecord[] {
  return rows
    .filter((row) => (
      row.published !== false
      && SAFE_SLUG.test(row.slug)
      && (!excludeGermanDesk || row.slug !== "german-desk")
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
      label: (lang === "es" ? row.nameEs : row.name).trim(),
      href: `/${kind}/${encodeURIComponent(row.slug)}${suffix}`,
      slug: row.slug,
    })).filter((row) => row.label.length > 0);

  return {
    practices: mapEntries(publicGroups(groups.practices, true), "practice"),
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
  return buildPublicNavigationMenu(await getRawNavigationGroups(), lang);
}

export function invalidatePublicNavigationMenuCache(): void {
  cache = null;
  inFlight = null;
}
