/**
 * Inventario único de tipografía para contenido público editable.
 *
 * No se aceptan fuentes arbitrarias: `auto` conserva la jerarquía de la
 * plantilla, mientras que las otras dos opciones corresponden a la identidad
 * tipográfica institucional. Los campos que no aparecen aquí son técnicos o
 * internos y deliberadamente no exponen controles de tipografía en el CMS.
 */
export const TYPOGRAPHY_FAMILIES = ["auto", "gelasio", "inter"] as const;
export type TypographyFamily = typeof TYPOGRAPHY_FAMILIES[number];
export type TypographyLanguage = "en" | "es";
export type TypographyRole = "editorial" | "body" | "ui";
export type TypographyStyles = Record<string, TypographyFamily>;

export type PublicTypographyField = {
  entityType: string;
  field: string;
  role: TypographyRole;
  rich?: boolean;
};

const fields = (entityType: string, names: readonly string[], role: TypographyRole, rich = false): PublicTypographyField[] =>
  names.map((field) => ({ entityType, field, role, rich }));

/**
 * Esta lista es la única puerta de entrada para preferencias por campo. Al
 * crear un módulo público se registra aquí; URLs, slugs, correos, SEO técnico,
 * prompts, conocimiento interno y datos de formularios se quedan fuera.
 */
export const PUBLIC_TYPOGRAPHY_FIELDS: readonly PublicTypographyField[] = [
  ...fields("news", ["title", "titleEs"], "editorial"),
  ...fields("news", ["excerpt", "excerptEs"], "editorial", true),
  ...fields("news", ["content", "contentEs"], "body", true),
  ...fields("team_member", ["name", "title", "titleEs", "role", "roleEs"], "editorial"),
  ...fields("team_member", ["bioIntro", "bioIntroEs"], "editorial", true),
  ...fields("team_member", ["bio", "bioEs"], "body", true),
  ...fields("practice_group", ["name", "nameEs"], "editorial"),
  ...fields("practice_group", ["description", "descriptionEs"], "editorial", true),
  ...fields("practice_group", ["fullDescription", "fullDescriptionEs"], "body", true),
  ...fields("industry_group", ["name", "nameEs"], "editorial"),
  ...fields("industry_group", ["description", "descriptionEs"], "editorial", true),
  ...fields("industry_group", ["fullDescription", "fullDescriptionEs"], "body", true),
  ...fields("specialized_desk", ["name", "nameEs", "country", "countryEs"], "editorial"),
  ...fields("specialized_desk", ["description", "descriptionEs"], "editorial", true),
  ...fields("specialized_desk", ["fullDescription", "fullDescriptionEs"], "body", true),
  ...fields("event", ["title", "titleEs"], "editorial"),
  ...fields("event", ["description", "descriptionEs"], "body", true),
  ...fields("event", ["location", "locationEs", "eventType", "eventTypeEs"], "ui"),
  ...fields("ranking", ["name", "nameEs", "publication", "publicationEs"], "editorial"),
  ...fields("ranking", ["category", "categoryEs", "ranking", "rankingEs", "description", "descriptionEs"], "body"),
  ...fields("award", ["name", "nameEs", "organization", "organizationEs"], "editorial"),
  ...fields("award", ["category", "categoryEs", "description", "descriptionEs"], "body"),
  ...fields("representative_client", ["name"], "editorial"),
  ...fields("representative_client", ["industry", "industryEs", "description", "descriptionEs"], "body"),
  ...fields("testimonial", ["quote", "quoteEs"], "editorial", true),
  ...fields("testimonial", ["authorName", "authorTitle", "authorTitleEs", "authorCompany", "source", "sourceEs"], "ui"),
  ...fields("job_opening", ["title", "titleEs"], "editorial"),
  ...fields("job_opening", ["department", "departmentEs", "location", "locationEs", "description", "descriptionEs", "requirements", "requirementsEs", "benefits", "benefitsEs"], "body", true),
  ...fields("office", ["name", "nameEs", "city", "country", "countryEs"], "editorial"),
  ...fields("office", ["address", "addressEs", "description", "descriptionEs"], "body", true),
  ...fields("alliance", ["name", "nameEs"], "editorial"),
  ...fields("alliance", ["type", "country", "countryEs", "description", "descriptionEs"], "body", true),
  ...fields("faq", ["question", "questionEs"], "editorial"),
  ...fields("faq", ["answer", "answerEs", "category", "categoryEs"], "body", true),
  ...fields("banner", ["title", "titleEs", "subtitle", "subtitleEs"], "editorial"),
  ...fields("banner", ["linkText", "linkTextEs"], "ui"),
  // `site_config` se valida adicionalmente con la key pública registrada.
  ...fields("site_config", ["value", "valueEs"], "body", true),
];

export function isTypographyFamily(value: unknown): value is TypographyFamily {
  return typeof value === "string" && (TYPOGRAPHY_FAMILIES as readonly string[]).includes(value);
}

export function typographyField(entityType: string, field: string): PublicTypographyField | undefined {
  return PUBLIC_TYPOGRAPHY_FIELDS.find((candidate) => candidate.entityType === entityType && candidate.field === field);
}

export function isPublicTypographyField(entityType: string, field: string): boolean {
  return Boolean(typographyField(entityType, field));
}

export function defaultTypographyRole(entityType: string, field: string): TypographyRole {
  return typographyField(entityType, field)?.role ?? "body";
}

export function defaultFamilyLabel(role: TypographyRole): string {
  return role === "editorial" ? "Gelasio editorial" : "Inter de cuerpo";
}

/** Campo `fooEs` se guarda como español; el resto como inglés. */
export function languageForTypographyField(field: string): TypographyLanguage {
  return field.endsWith("Es") ? "es" : "en";
}

const typographyKey = (field: string, language: TypographyLanguage) => `${field}:${language}`;

export function typographyFamilyFor(styles: TypographyStyles | undefined, field: string, language: TypographyLanguage): TypographyFamily {
  return styles?.[typographyKey(field, language)] || "auto";
}

/** Atributo seguro para el renderer: sólo aparece cuando la elección no es auto. */
export function typographyAttribute(
  styles: TypographyStyles | undefined,
  field: string,
  language: TypographyLanguage,
): Record<string, string> {
  const family = typographyFamilyFor(styles, field, language);
  return family === "auto" ? {} : { "data-vw-font": family };
}
