/**
 * Canonical attorney-name handling.
 *
 * `team_members.name` is intentionally retained as the complete editorial
 * identity: it is used by historical credits, id mappings, legacy slugs and
 * audit trails. The three structured fields below are the presentation source
 * for the public site and let Administration retain both surnames.
 */
export type AttorneyNameParts = {
  givenNames: string;
  firstSurname: string;
  secondSurname: string;
};

export type AttorneyNameSource = {
  givenNames?: string | null;
  firstSurname?: string | null;
  secondSurname?: string | null;
  name?: string | null;
};

const normalizeKey = (value: string) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/\s+/g, " ")
  .trim();

const clean = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();

/**
 * These are the only names for which a last-token heuristic would mistake a
 * second surname (or a family-name particle) for the primary surname. The
 * values are explicit so the front-end never guesses legal names.
 */
const CURATED_PARTS: Readonly<Record<string, AttorneyNameParts>> = Object.freeze({
  "pablo saez williams": { givenNames: "Pablo", firstSurname: "Saez", secondSurname: "Williams" },
  "alejandro avila": { givenNames: "Alejandro", firstSurname: "Ávila", secondSurname: "" },
  "ruben villegas": { givenNames: "Rubén", firstSurname: "Villegas", secondSurname: "" },
  "claus von wobeser": { givenNames: "Claus", firstSurname: "von Wobeser", secondSurname: "" },
  "margarita beatriz luna ramos": { givenNames: "Margarita Beatriz", firstSurname: "Luna", secondSurname: "Ramos" },
  "guillermo i. ortiz mayagoitia": { givenNames: "Guillermo I.", firstSurname: "Ortiz", secondSurname: "Mayagoitia" },
  "carlos lopez cordova": { givenNames: "Carlos", firstSurname: "López", secondSurname: "Córdova" },
  "lourdes salazar y vera": { givenNames: "Lourdes", firstSurname: "Salazar", secondSurname: "y Vera" },
  "mercedes jimenez roel": { givenNames: "Mercedes", firstSurname: "Jiménez", secondSurname: "Roel" },
  "patricio reyes retana": { givenNames: "Patricio", firstSurname: "Reyes", secondSurname: "Retana" },
  "juan arturo ramos robles": { givenNames: "Juan Arturo", firstSurname: "Ramos", secondSurname: "Robles" },
  "maria elisa vera madrigal": { givenNames: "María Elisa", firstSurname: "Vera", secondSurname: "Madrigal" },
});

/** Derives safe editable fields for legacy records that pre-date these columns. */
export function deriveAttorneyNameParts(source: AttorneyNameSource): AttorneyNameParts {
  const givenNames = clean(source.givenNames);
  const firstSurname = clean(source.firstSurname);
  const secondSurname = clean(source.secondSurname);
  if (givenNames && firstSurname) return { givenNames, firstSurname, secondSurname };

  const fullName = clean(source.name);
  if (!fullName) return { givenNames: "", firstSurname: "", secondSurname: "" };
  const curated = CURATED_PARTS[normalizeKey(fullName)];
  if (curated) return curated;

  const parts = fullName.split(" ").filter(Boolean);
  if (parts.length < 2) return { givenNames: fullName, firstSurname: "", secondSurname: "" };
  return {
    givenNames: parts.slice(0, -1).join(" "),
    firstSurname: parts.at(-1) || "",
    secondSurname: "",
  };
}

/** Name displayed publicly: name(s) plus the first surname only. */
export function getAttorneyPublicName(source: AttorneyNameSource): string {
  const parts = deriveAttorneyNameParts(source);
  return [parts.givenNames, parts.firstSurname].filter(Boolean).join(" ") || clean(source.name);
}

/** Complete name kept for internal identity, exports and legacy relations. */
export function getAttorneyFullName(source: AttorneyNameSource): string {
  const parts = deriveAttorneyNameParts(source);
  return [parts.givenNames, parts.firstSurname, parts.secondSurname].filter(Boolean).join(" ") || clean(source.name);
}

/** Search remains generous without changing the public label or A–Z rule. */
export function getAttorneySearchName(source: AttorneyNameSource): string {
  return Array.from(new Set([getAttorneyPublicName(source), clean(source.name)].filter(Boolean))).join(" ");
}

/** Stable sort key used for the one-time Associates editorial correction. */
export function getAttorneyFirstSurnameSortKey(source: AttorneyNameSource): string {
  return normalizeKey(deriveAttorneyNameParts(source).firstSurname);
}
