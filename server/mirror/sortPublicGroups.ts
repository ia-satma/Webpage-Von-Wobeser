export type LocalizedPublicGroup = {
  slug: string;
  name: string;
  nameEs?: string | null;
};

export function localizedGroupLabel(
  group: LocalizedPublicGroup,
  lang: "en" | "es",
): string {
  return (lang === "es" ? group.nameEs || group.name : group.name).trim();
}

export function sortGroupsAlphabetically<T extends LocalizedPublicGroup>(
  groups: T[],
  lang: "en" | "es",
): T[] {
  const collator = new Intl.Collator(lang === "es" ? "es-MX" : "en", {
    sensitivity: "base",
    numeric: true,
    ignorePunctuation: true,
  });

  return [...groups].sort((a, b) => (
    collator.compare(localizedGroupLabel(a, lang), localizedGroupLabel(b, lang))
    || a.slug.localeCompare(b.slug, "en")
  ));
}
