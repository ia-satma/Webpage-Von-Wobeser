export type AttorneyLanguage = "en" | "es";

export type AttorneyTitleSource = {
  title?: string | null;
  titleEs?: string | null;
  role?: string | null;
  roleEs?: string | null;
  isPartner?: boolean | null;
};

const label = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const normalizedLabel = (value: unknown): string =>
  label(value).toLocaleLowerCase("es-MX");

const isPartnerLabel = (value: unknown): boolean =>
  normalizedLabel(value) === "partner";

const isSpanishPartnerLabel = (value: unknown): boolean => {
  const valueLabel = normalizedLabel(value);
  return valueLabel === "socio" || valueLabel === "socia";
};

const belongsToPartners = (attorney: AttorneyTitleSource): boolean =>
  Boolean(attorney.isPartner) ||
  isPartnerLabel(attorney.title) ||
  isPartnerLabel(attorney.role);

function localizedField(
  attorney: AttorneyTitleSource,
  language: AttorneyLanguage,
  field: "title" | "role",
): string {
  const english = label(attorney[field]);
  const spanish = label(attorney[`${field}Es`]);
  const value = language === "es" ? spanish || english : english || spanish;

  if (!belongsToPartners(attorney)) return value;
  if (language === "es" && isPartnerLabel(value)) return "Socio";
  if (language === "en" && isSpanishPartnerLabel(value)) return "Partner";
  return value;
}

export const getLocalizedAttorneyTitle = (
  attorney: AttorneyTitleSource,
  language: AttorneyLanguage,
): string => localizedField(attorney, language, "title");

export const getLocalizedAttorneyRole = (
  attorney: AttorneyTitleSource,
  language: AttorneyLanguage,
): string => localizedField(attorney, language, "role");

/**
 * Conserva "Socia" y normaliza únicamente el valor histórico inglés que no
 * corresponde al sitio en español. Es seguro aplicarlo en cada guardado.
 */
export function normalizeSpanishPartnerFields<T extends AttorneyTitleSource>(attorney: T): T {
  if (!belongsToPartners(attorney)) return attorney;

  const normalized = { ...attorney };
  if (isPartnerLabel(normalized.titleEs)) normalized.titleEs = "Socio";
  if (isPartnerLabel(normalized.roleEs)) normalized.roleEs = "Socio";
  return normalized;
}
