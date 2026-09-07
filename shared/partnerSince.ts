import { getLocalizedAttorneyTitle } from "./attorneyTitles";

export type PartnerSinceSource = {
  title?: string | null;
  titleEs?: string | null;
  role?: string | null;
  roleEs?: string | null;
  isPartner?: boolean | null;
  partnerSinceYear?: number | null;
  showPartnerSince?: boolean | null;
};

export const PARTNER_SINCE_YEAR_MIN = 1900;
export const PARTNER_SINCE_YEAR_MAX = 2100;

export function isValidPartnerSinceYear(value: unknown): value is number {
  return typeof value === "number"
    && Number.isInteger(value)
    && value >= PARTNER_SINCE_YEAR_MIN
    && value <= PARTNER_SINCE_YEAR_MAX;
}

export function getPartnerSinceLabel(source: PartnerSinceSource, language: "en" | "es"): string | null {
  if (
    source.title !== "Partner"
    || source.showPartnerSince === false
    || !isValidPartnerSinceYear(source.partnerSinceYear)
  ) {
    return null;
  }

  if (language === "en") return `Partner since ${source.partnerSinceYear}`;

  const localizedTitle = getLocalizedAttorneyTitle(source, "es").trim().toLocaleLowerCase("es-MX");
  return `${localizedTitle === "socia" ? "Socia" : "Socio"} desde ${source.partnerSinceYear}`;
}
