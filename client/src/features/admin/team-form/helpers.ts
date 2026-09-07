import type { TeamMember } from "@shared/schema";
import { normalizeSpanishPartnerFields } from "@shared/attorneyTitles";
import { deriveAttorneyNameParts, getAttorneyFullName } from "@shared/attorneyName";
import type { TeamMemberFormData } from "./contracts";

export function teamMemberToFormData(member: TeamMember): TeamMemberFormData {
  const nameParts = deriveAttorneyNameParts(member);
  return {
    name: member.name || "",
    givenNames: nameParts.givenNames,
    firstSurname: nameParts.firstSurname,
    secondSurname: nameParts.secondSurname,
    slug: member.slug || "",
    title: member.title || "",
    titleEs: member.titleEs || "",
    role: member.role || "",
    roleEs: member.roleEs || "",
    email: member.email || "",
    phone: member.phone || "",
    linkedinUrl: member.linkedinUrl || "",
    imageUrl: member.imageUrl || "",
    bio: member.bio || "",
    bioEs: member.bioEs || "",
    bioIntro: (member as any).bioIntro || "",
    bioIntroEs: (member as any).bioIntroEs || "",
    education: member.education || [],
    affiliations: member.affiliations || [],
    rankings: member.rankings || [],
    publications: member.publications || [],
    languages: member.languages || [],
    languagesEs: (member as any).languagesEs || [],
    isPartner: member.isPartner || false,
    partnerSinceYear: member.partnerSinceYear ?? null,
    showPartnerSince: member.showPartnerSince !== false,
    published: member.published !== false,
    order: member.order || 0,
    practiceGroupIds: (member as any).practiceGroupIds || [],
    industryGroupIds: (member as any).industryGroupIds || [],
  };
}

export function teamFormToPayload(data: TeamMemberFormData) {
  const { order: _editorialOrder, ...editableData } = data;
  return normalizeSpanishPartnerFields({
    ...editableData,
    name: getAttorneyFullName(editableData),
    email: editableData.email || null,
    phone: editableData.phone || null,
    linkedinUrl: editableData.linkedinUrl || null,
    imageUrl: editableData.imageUrl || null,
    bio: editableData.bio || null,
    bioEs: editableData.bioEs || null,
    bioIntro: editableData.bioIntro || null,
    bioIntroEs: editableData.bioIntroEs || null,
  });
}

export function generateTeamMemberSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getTeamMemberInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function calculateProfileProgress(values: TeamMemberFormData): number {
  return Math.min(
    100,
    (values.name ? 15 : 0) +
      (values.title ? 15 : 0) +
      (values.titleEs ? 10 : 0) +
      (values.role ? 10 : 0) +
      (values.roleEs ? 10 : 0) +
      (values.email ? 10 : 0) +
      (values.imageUrl ? 10 : 0) +
      (values.bio ? 10 : 0) +
      (values.bioEs ? 10 : 0),
  );
}
