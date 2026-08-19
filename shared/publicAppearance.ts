/**
 * Presets visuales reversibles para bloques públicos que no cambian contenido,
 * URLs ni comportamiento. El contrato vive en shared para que el espejo y el
 * panel de administración validen exactamente los mismos valores cerrados.
 */
export const FOOTER_PRESET_IDS = ["central-2026", "classic-vwys"] as const;
export type FooterPresetId = typeof FOOTER_PRESET_IDS[number];
export const DEFAULT_FOOTER_PRESET: FooterPresetId = "central-2026";

export const ATTORNEY_DIRECTORY_PRESET_IDS = ["editorial-2026", "classic-vwys"] as const;
export type AttorneyDirectoryPresetId = typeof ATTORNEY_DIRECTORY_PRESET_IDS[number];
export const DEFAULT_ATTORNEY_DIRECTORY_PRESET: AttorneyDirectoryPresetId = "editorial-2026";

export type PublicAppearanceState = {
  footerPreset: FooterPresetId;
  attorneyDirectoryPreset: AttorneyDirectoryPresetId;
};

export const PUBLIC_APPEARANCE_PRESET_METADATA = {
  footer: {
    "central-2026": {
      name: "Pie central 2026",
      description: "El pie gris actual, con cinco columnas, ESR, enlaces legales y acceso administrativo discreto.",
    },
    "classic-vwys": {
      name: "Pie clásico VWyS",
      description: "La composición anterior del espejo, alimentada por los mismos datos y enlaces seguros actuales.",
    },
  },
  attorneyDirectory: {
    "editorial-2026": {
      name: "Búsqueda editorial 2026",
      description: "La barra horizontal clara con filtros, iniciales, contador y actualización inmediata.",
    },
    "classic-vwys": {
      name: "Búsqueda clásica VWyS",
      description: "La composición anterior del buscador, conservando los filtros y resultados instantáneos actuales.",
    },
  },
} as const;
