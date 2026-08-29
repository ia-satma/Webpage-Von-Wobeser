import { getAttorneyFirstSurnameSortKey, getAttorneyFullName, type AttorneyNameSource } from "./attorneyName";

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

export type PublicAttorneyDirectoryOrderMember = AttorneyNameSource & {
  title?: string | null;
  order?: number | null;
  id?: string | null;
};

const PUBLIC_ATTORNEY_NAME_COLLATOR = new Intl.Collator("es-MX", {
  sensitivity: "base",
  ignorePunctuation: true,
  usage: "sort",
});

/**
 * Counsel is the sole public directory category whose order is alphabetical
 * by first surname. All other categories retain their approved editorial
 * sequence. Structured surnames are used so a second surname never changes
 * an attorney's placement.
 */
export function comparePublicAttorneyDirectoryOrder(
  left: PublicAttorneyDirectoryOrderMember,
  right: PublicAttorneyDirectoryOrderMember,
): number {
  if (left.title === "Counsel" && right.title === "Counsel") {
    const surnameOrder = PUBLIC_ATTORNEY_NAME_COLLATOR.compare(
      getAttorneyFirstSurnameSortKey(left),
      getAttorneyFirstSurnameSortKey(right),
    );
    if (surnameOrder !== 0) return surnameOrder;

    const nameOrder = PUBLIC_ATTORNEY_NAME_COLLATOR.compare(
      getAttorneyFullName(left),
      getAttorneyFullName(right),
    );
    if (nameOrder !== 0) return nameOrder;
  }

  const editorialOrder = Number(left.order ?? 0) - Number(right.order ?? 0);
  if (editorialOrder !== 0) return editorialOrder;
  return PUBLIC_ATTORNEY_NAME_COLLATOR.compare(String(left.id ?? left.name ?? ""), String(right.id ?? right.name ?? ""));
}

export const ATTORNEY_ORDER_CATEGORY_IDS = ATTORNEY_ORDER_CATEGORIES.map((category) => category.id) as [
  AttorneyOrderCategoryId,
  ...AttorneyOrderCategoryId[],
];

export function attorneyOrderCategoryById(id: string) {
  return ATTORNEY_ORDER_CATEGORIES.find((category) => category.id === id);
}

/** Official partner sequence, updated with the client's approved seniority order on 27 August 2026. */
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

/** Profiles retained in Administration but no longer published in the directory. */
export const MIRROR_ONLY_ASSOCIATE_NAMES = [
  "Adrian Rodriguez",
  "Christopher Wilkerson",
  "Jose Carlos Aguilar",
  "Jose Luis Ortega",
  "Juan Manuel Moran",
  "Paola Hernandez",
  "Raul Quintero",
  "Regina Forte",
  "Rubén Villegas",
] as const;

/**
 * Approved Associate sequence as of 20 August 2026.
 *
 * The 92 official profiles retain the source directory's surname ordering. The
 * nine additional mirror profiles are retained for Administration, but hidden
 * from the public directory. This list is explicit rather than derived from a
 * name token because compound surnames (for example, Jiménez Roel and Reyes
 * Retana) need editorial placement, not a heuristic.
 */
export const CURRENT_ASSOCIATE_ORDER = [
  "Pablo Aceves",
  "Jose Carlos Aguilar",
  "Sofía Alcántara",
  "Ana Alpízar",
  "Diego Altamirano",
  "Daniel Araujo",
  "Alejandra Arizpe",
  "Alejandro Ávila",
  "Alexander Barnes",
  "Juan Francisco Barrera",
  "Julieta Béjar",
  "Diego Benítez",
  "Edmundo Berumen",
  "Anna-Maria Brandstädter",
  "Carolina Camacho",
  "Regina Castillo",
  "Carlos Cázares",
  "Carlos Cevallos",
  "Raúl Chaidez",
  "Miguel Ángel Chinchilla",
  "Eugenio Chinchillas",
  "Virginia Cornett",
  "Patricio Cortina",
  "Melissa Cruz",
  "Víctor Delgado",
  "Joel Domínguez",
  "Eduardo Estrada",
  "David Fainsod",
  "Darío Figueroa",
  "Roberto Flores",
  "Regina Forte",
  "María García",
  "Montserrat García",
  "Rodrigo García",
  "Andoni Garza",
  "Sarah Gibert",
  "Regina Godínez",
  "José Antonio Gómez",
  "Mariana Gómez-Vallin",
  "Cinthya González",
  "Eliana González",
  "Regina González",
  "Ana Victoria Guevara",
  "Arturo Hernández",
  "Paola Hernandez",
  "Gastón Hinojosa",
  "Amanda Ibáñez",
  "Elías Jalife",
  "Andrés Jiménez",
  "Dolores Jiménez",
  "Mercedes Jiménez Roel",
  "Alfonso Leñero",
  "Margarita Lima",
  "Stefania Lopardo",
  "Diego Lozada",
  "Déborah Luengo",
  "Mario Lugo",
  "Julián Luna",
  "Libna Macías",
  "Laura Maldonado",
  "Gabriela Mancha",
  "Fernando Mancilla",
  "Alondra Marín",
  "Adrián Martínez",
  "Alexa Mendivil",
  "Max Morales",
  "Juan Manuel Moran",
  "Gabriela Negrete",
  "Jose Luis Ortega",
  "Sara Ortiz",
  "Cynthia Osio",
  "Gustavo Padilla",
  "Ernesto Palomares",
  "Ileana Pantiga",
  "Alejandro Pérez",
  "Liliana Pérez",
  "Daniela Pons",
  "Raul Quintero",
  "Christian Ramírez",
  "Juan Arturo Ramos Robles",
  "Sofía Reyes",
  "Patricio Reyes Retana",
  "Adrian Rodriguez",
  "Ricardo Rosas",
  "Ana Ruiz",
  "Mariana Salcedo",
  "Efrén Sánchez",
  "Héctor Sánchez",
  "Jaime Antonio Sánchez",
  "Michael Schreiber",
  "Santiago Torres",
  "Alejandro Torres",
  "Carlos Ugalde",
  "Gustavo Vaca",
  "Jorge Vázquez",
  "Rocío Vega",
  "María Elisa Vera Madrigal",
  "Rubén Villegas",
  "Christopher Wilkerson",
  "Gabriela Zambrano",
  "Bernardo Zatarain",
] as const;
