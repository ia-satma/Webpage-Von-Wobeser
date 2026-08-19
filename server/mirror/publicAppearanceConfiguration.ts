import { createHash } from "node:crypto";
import {
  ATTORNEY_DIRECTORY_PRESET_IDS,
  DEFAULT_ATTORNEY_DIRECTORY_PRESET,
  DEFAULT_FOOTER_PRESET,
  FOOTER_PRESET_IDS,
  PUBLIC_APPEARANCE_PRESET_METADATA,
  type AttorneyDirectoryPresetId,
  type FooterPresetId,
  type PublicAppearanceState,
} from "@shared/publicAppearance";
import type { ConfigMap } from "./siteConfig";

export const FOOTER_ACTIVE_PRESET_KEY = "footer_active_preset";
export const ATTORNEY_DIRECTORY_ACTIVE_PRESET_KEY = "attorney_directory_active_preset";
export const PUBLIC_APPEARANCE_CONFIG_KEYS = [
  FOOTER_ACTIVE_PRESET_KEY,
  ATTORNEY_DIRECTORY_ACTIVE_PRESET_KEY,
] as const;

function enumValue<T extends readonly string[]>(
  value: string | undefined,
  values: T,
  fallback: T[number],
): T[number] {
  return values.includes(value || "") ? value as T[number] : fallback;
}

export function publicAppearanceStateFromConfig(config: ConfigMap): PublicAppearanceState {
  return {
    footerPreset: enumValue(config[FOOTER_ACTIVE_PRESET_KEY]?.value, FOOTER_PRESET_IDS, DEFAULT_FOOTER_PRESET) as FooterPresetId,
    attorneyDirectoryPreset: enumValue(
      config[ATTORNEY_DIRECTORY_ACTIVE_PRESET_KEY]?.value,
      ATTORNEY_DIRECTORY_PRESET_IDS,
      DEFAULT_ATTORNEY_DIRECTORY_PRESET,
    ) as AttorneyDirectoryPresetId,
  };
}

export function footerPresetFromConfig(config: ConfigMap): FooterPresetId {
  return publicAppearanceStateFromConfig(config).footerPreset;
}

export function attorneyDirectoryPresetFromConfig(config: ConfigMap): AttorneyDirectoryPresetId {
  return publicAppearanceStateFromConfig(config).attorneyDirectoryPreset;
}

export function publicAppearanceStateRevision(state: PublicAppearanceState): string {
  return createHash("sha256").update(JSON.stringify(state)).digest("hex").slice(0, 16);
}

export function adminPublicAppearancePayload(state: PublicAppearanceState) {
  return {
    ...state,
    stateRevision: publicAppearanceStateRevision(state),
    presets: PUBLIC_APPEARANCE_PRESET_METADATA,
  };
}
