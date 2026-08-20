/**
 * Public directory categories and their editorial ordering contract.
 *
 * The `title` value is the stable database discriminator used by the mirror;
 * labels are intentionally kept here so the Admin UI and server never drift.
 */
export const ATTORNEY_ORDER_CATEGORIES = [
  { id: "partners", title: "Partner", labelEs: "Socios", labelEn: "Partners" },
  { id: "of-counsel", title: "Of Counsel", labelEs: "Of Counsel", labelEn: "Of Counsel" },
  { id: "counsel", title: "Counsel", labelEs: "Consejeros", labelEn: "Counsel" },
  { id: "associates", title: "Associate", labelEs: "Asociados", labelEn: "Associates" },
] as const;

export type AttorneyOrderCategoryId = (typeof ATTORNEY_ORDER_CATEGORIES)[number]["id"];

export const ATTORNEY_ORDER_CATEGORY_IDS = ATTORNEY_ORDER_CATEGORIES.map((category) => category.id) as [
  AttorneyOrderCategoryId,
  ...AttorneyOrderCategoryId[],
];

export function attorneyOrderCategoryById(id: string) {
  return ATTORNEY_ORDER_CATEGORIES.find((category) => category.id === id);
}

/** Official partner sequence verified against vonwobeser.com on 20 August 2026. */
export const OFFICIAL_PARTNER_ORDER = [
  "Luis Burgueño",
  "Luis Miguel Jiménez",
  "Rupert Hüttler",
  "Fernando Carreño",
  "Edmond Frederic Grieger",
  "Adrián Magallanes",
  "Diego Sierra",
  "Montserrat Manzano",
  "Pablo Saez Williams",
  "Patricia Kaim",
  "Alberto Córdoba",
  "Raymundo Soberanis",
  "Pablo Jiménez",
  "Pablo Fautsch",
  "Jessika Rocha",
  "Ariel Garfio",
  "Rafael Vallejo",
  "Katharina Roehr",
  "Sergio López",
  "Alejandro Torres",
  "Javier Betancourt",
  "Adrián Castillo",
  "Rodrigo Barradas",
  "Michel Llorens",
  "Luis Enrique Torres",
  "Ricardo Cacho",
] as const;
