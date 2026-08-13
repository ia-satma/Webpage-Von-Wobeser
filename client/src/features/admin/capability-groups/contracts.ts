import type { LucideIcon } from "lucide-react";
import type { z } from "zod";

export interface CapabilityGroup {
  id: string;
  name: string;
  nameEs: string;
  slug: string;
  description: string;
  descriptionEs: string;
  fullDescription: string | null;
  fullDescriptionEs: string | null;
  iconName: string | null;
  imageUrl: string | null;
  order: number | null;
  published: boolean | null;
}

export interface CapabilityGroupFormData {
  name: string;
  nameEs: string;
  slug: string;
  description: string;
  descriptionEs: string;
  fullDescription?: string;
  fullDescriptionEs?: string;
  iconName?: string;
  order: number;
  published: boolean;
  imageUrl?: string;
}

export interface CapabilityCopy {
  title: string;
  newGroup: string;
  editGroup: string;
  nameEn: string;
  nameEnPlaceholder: string;
  nameEs: string;
  nameEsPlaceholder: string;
  slug: string;
  slugPlaceholder: string;
  slugDescription: string;
  descriptionEn: string;
  descriptionEnPlaceholder: string;
  descriptionEs: string;
  descriptionEsPlaceholder: string;
  fullDescriptionEn: string;
  fullDescriptionEnPlaceholder: string;
  fullDescriptionEs: string;
  fullDescriptionEsPlaceholder: string;
  icon: string;
  iconPlaceholder: string;
  iconDescription: string;
  order: string;
  orderDescription: string;
  save: string;
  cancel: string;
  saving: string;
  nameColumn: string;
  slugColumn: string;
  orderColumn: string;
  actions: string;
  noGroups: string;
  confirmDelete: string;
  saveSuccess: string;
  saveError: string;
  deleteSuccess: string;
  deleteError: string;
  loading: string;
  totalGroups: string;
  fetchError: string;
  technicalSaveError: string;
  technicalDeleteError: string;
}

export interface CapabilityGroupConfig {
  kind: "practice" | "industry";
  adminEndpoint: string;
  publicQueryKey: string;
  entityType: "practice_group" | "industry_group";
  icon: LucideIcon;
  newButtonTestId: string;
  rowTestPrefix: string;
  helpPageId: string;
  helpManualSectionId: string;
  helpText: string;
  imageDescription: string;
  schema: z.ZodTypeAny;
}

export type CapabilityTranslationSource = Record<string, string>;
