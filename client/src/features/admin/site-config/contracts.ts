import type { LucideIcon } from "lucide-react";
import type { Change } from "@/components/admin/ConfirmChangesDialog";

export type SiteConfigField = {
  key: string;
  label: string;
  help?: string;
  bilingual?: boolean;
  /** El contenido legal requiere versión revisada; no ofrece traducción automática. */
  allowAutoTranslation?: boolean;
  media?: "image" | "video";
  multiline?: boolean;
  rows?: number;
  control?: "switch" | "number" | "select";
  options?: Array<{ value: string; label: string }>;
  defaultValue?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  patternError?: string;
};

export type SiteConfigFieldGroup = {
  title?: string;
  fields: SiteConfigField[];
};

export type SiteConfigPageDefinition = {
  title: string;
  description: string;
  icon: LucideIcon;
  groups: SiteConfigFieldGroup[];
};

export type ConfigMap = Record<
  string,
  { value: string; valueEs: string; type: string }
>;

export type ConfigDraft = Record<
  string,
  { value: string; valueEs: string }
>;

export type CarouselGroup = {
  id: string;
  slug: string;
  name: string;
  nameEs: string;
  imageUrl?: string | null;
  order?: number | null;
  published?: boolean | null;
};

export type SiteConfigConfirmation = {
  key: string;
  changes: Change[];
};
