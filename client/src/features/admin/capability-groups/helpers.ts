import type {
  CapabilityCopy,
  CapabilityGroup,
  CapabilityGroupFormData,
  CapabilityTranslationSource,
} from "./contracts";

export function createCapabilityGroupDefaults(): CapabilityGroupFormData {
  return {
    name: "",
    nameEs: "",
    slug: "",
    description: "",
    descriptionEs: "",
    fullDescription: "",
    fullDescriptionEs: "",
    iconName: "",
    order: 0,
    published: true,
    imageUrl: "",
  };
}

export function capabilityGroupToFormData(group: CapabilityGroup): CapabilityGroupFormData {
  return {
    name: group.name,
    nameEs: group.nameEs,
    slug: group.slug,
    description: group.description,
    descriptionEs: group.descriptionEs,
    fullDescription: group.fullDescription || "",
    fullDescriptionEs: group.fullDescriptionEs || "",
    iconName: group.iconName || "",
    order: group.order || 0,
    published: group.published !== false,
    imageUrl: group.imageUrl || "",
  };
}

export function generateCapabilitySlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function sortCapabilityGroups(groups: CapabilityGroup[]): CapabilityGroup[] {
  return [...groups].sort((a, b) => (a.order || 0) - (b.order || 0));
}

export function toCapabilityCopy(
  source: CapabilityTranslationSource,
  keys: { newGroup: string; editGroup: string; noGroups: string },
  technicalErrors?: { fetch: string; save: string; delete: string },
): CapabilityCopy {
  return {
    ...(source as Omit<CapabilityCopy, "newGroup" | "editGroup" | "noGroups" | "fetchError" | "technicalSaveError" | "technicalDeleteError">),
    newGroup: source[keys.newGroup],
    editGroup: source[keys.editGroup],
    noGroups: source[keys.noGroups],
    fetchError: technicalErrors?.fetch || source.fetchError,
    technicalSaveError: technicalErrors?.save || source.saveError,
    technicalDeleteError: technicalErrors?.delete || source.deleteError,
  } as CapabilityCopy;
}
