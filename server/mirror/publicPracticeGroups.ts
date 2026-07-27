export type PublicPracticeCandidate = {
  slug?: string | null;
  published?: boolean | null;
};

/**
 * Legacy records kept in PostgreSQL for historical/reference purposes, but no
 * longer presented as current public practices.
 */
export const RETIRED_PUBLIC_PRACTICE_SLUGS = new Set([
  "administrative-law",
  "german-desk",
]);

export function isPublicPracticeSlug(slug: unknown): boolean {
  return typeof slug === "string"
    && slug.length > 0
    && !RETIRED_PUBLIC_PRACTICE_SLUGS.has(slug);
}

/** Mirror pages treat an absent legacy `published` value as visible. */
export function isVisiblePublicPractice(group: PublicPracticeCandidate): boolean {
  return group.published !== false && isPublicPracticeSlug(group.slug);
}

/** Public JSON APIs require an explicit published state. */
export function isPublishedPublicPractice(group: PublicPracticeCandidate): boolean {
  return group.published === true && isPublicPracticeSlug(group.slug);
}
