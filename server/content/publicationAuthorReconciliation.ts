import {
  loadCanonicalDropboxNews2026,
  normalizeCanonicalDropboxIdentity,
} from "./canonicalDropboxNews2026";
import {
  loadCanonicalHistoricAttorneyIdentities,
  loadCanonicalPublicationAuthorEvidence,
} from "./canonicalPublicationAuthorEvidence2026";

export type PublicationAuthorNewsRow = {
  id: string;
  legacyId: string | null;
  slug: string;
  published: boolean | null;
};

export type PublicationAuthorMemberRow = {
  id: string;
  name: string;
  title: string;
  email?: string | null;
  published: boolean | null;
};

export type PublicationAuthorLinkRow = {
  newsId: string;
  teamMemberId: string;
};

export type PublicationAuthorRelation = {
  newsId: string;
  teamMemberId: string;
  source: "historic" | "dropbox-2026";
  legacyPublicationId?: string;
  attorneyLegacyId?: string;
};

export type PublicationAuthorReconciliation = {
  expected: PublicationAuthorRelation[];
  missing: PublicationAuthorRelation[];
  confirmed: PublicationAuthorRelation[];
  contradictions: PublicationAuthorLinkRow[];
  retainedWithoutSource: PublicationAuthorLinkRow[];
};

export const normalizePublicationAuthorIdentity = (value: unknown): string => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/\s+/g, " ")
  .trim()
  .toLowerCase();

const memberIdentity = (member: Pick<PublicationAuthorMemberRow, "name" | "title">) =>
  `${normalizePublicationAuthorIdentity(member.name)}|${normalizePublicationAuthorIdentity(member.title)}`;

const relationKey = (newsId: string, teamMemberId: string) => `${newsId}\u0000${teamMemberId}`;

/**
 * Builds a non-mutating, source-backed relation plan. Existing links are only
 * contradictory if their legacy publication has an explicit historic attorney
 * list that does not include the linked public profile. Links without such a
 * source intentionally remain untouched for the editor to preserve.
 */
export function reconcilePublicationAuthors(input: {
  news: readonly PublicationAuthorNewsRow[];
  members: readonly PublicationAuthorMemberRow[];
  links: readonly PublicationAuthorLinkRow[];
}): PublicationAuthorReconciliation {
  const evidence = loadCanonicalPublicationAuthorEvidence();
  const evidenceByLegacyId = new Map(evidence.map((entry) => [entry.legacyPublicationId, entry]));
  const historicAttorneyIdentities = loadCanonicalHistoricAttorneyIdentities(evidence);
  const publicMembers = input.members.filter((member) => member.published !== false);
  const membersByIdentity = new Map<string, PublicationAuthorMemberRow[]>();
  for (const member of publicMembers) {
    const identity = memberIdentity(member);
    membersByIdentity.set(identity, [...(membersByIdentity.get(identity) || []), member]);
  }
  const publicNews = input.news.filter((item) => item.published !== false);
  const newsByLegacyId = new Map(publicNews
    .filter((item): item is PublicationAuthorNewsRow & { legacyId: string } => Boolean(item.legacyId))
    .map((item) => [item.legacyId, item]));
  const newsBySlug = new Map(publicNews.map((item) => [item.slug, item]));
  const expectedByKey = new Map<string, PublicationAuthorRelation>();

  for (const entry of evidence) {
    const item = newsByLegacyId.get(entry.legacyPublicationId);
    if (!item) continue;
    for (const attorneyLegacyId of entry.attorneyLegacyIds) {
      const historicAttorney = historicAttorneyIdentities.get(attorneyLegacyId);
      const matches = historicAttorney
        ? membersByIdentity.get(memberIdentity(historicAttorney)) || []
        : [];
      if (matches.length !== 1) continue;
      const member = matches[0];
      const relation: PublicationAuthorRelation = {
        newsId: item.id,
        teamMemberId: member.id,
        source: "historic",
        legacyPublicationId: entry.legacyPublicationId,
        attorneyLegacyId,
      };
      expectedByKey.set(relationKey(relation.newsId, relation.teamMemberId), relation);
    }
  }

  for (const item of loadCanonicalDropboxNews2026({ verifyAssets: false })) {
    const news = newsBySlug.get(item.slug);
    if (!news) continue;
    for (const author of item.authors) {
      const authorName = normalizeCanonicalDropboxIdentity(author.name);
      const authorEmail = normalizeCanonicalDropboxIdentity(author.email);
      const matches = publicMembers.filter((member) =>
        normalizeCanonicalDropboxIdentity(member.email || "") === authorEmail
        || normalizeCanonicalDropboxIdentity(member.name) === authorName,
      );
      if (matches.length !== 1) continue;
      const member = matches[0];
      const relation: PublicationAuthorRelation = {
        newsId: news.id,
        teamMemberId: member.id,
        source: "dropbox-2026",
      };
      expectedByKey.set(relationKey(relation.newsId, relation.teamMemberId), relation);
    }
  }

  const existingByKey = new Map(input.links.map((link) => [relationKey(link.newsId, link.teamMemberId), link]));
  const expected = Array.from(expectedByKey.values());
  const confirmed = expected.filter((relation) => existingByKey.has(relationKey(relation.newsId, relation.teamMemberId)));
  const missing = expected.filter((relation) => !existingByKey.has(relationKey(relation.newsId, relation.teamMemberId)));
  const newsById = new Map(publicNews.map((item) => [item.id, item]));
  const contradictions: PublicationAuthorLinkRow[] = [];
  const retainedWithoutSource: PublicationAuthorLinkRow[] = [];

  for (const link of input.links) {
    if (expectedByKey.has(relationKey(link.newsId, link.teamMemberId))) continue;
    const item = newsById.get(link.newsId);
    const historicEvidence = item?.legacyId ? evidenceByLegacyId.get(item.legacyId) : undefined;
    if (historicEvidence?.attorneyLegacyIds.length) contradictions.push(link);
    else retainedWithoutSource.push(link);
  }

  return { expected, missing, confirmed, contradictions, retainedWithoutSource };
}
