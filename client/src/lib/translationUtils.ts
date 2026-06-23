export const TEAM_MEMBER_TRANSLATABLE_FIELDS = ['title', 'role', 'bio'] as const;
export const PRACTICE_GROUP_TRANSLATABLE_FIELDS = ['name', 'description', 'fullDescription'] as const;
export const INDUSTRY_GROUP_TRANSLATABLE_FIELDS = ['name', 'description', 'fullDescription'] as const;
export const NEWS_TRANSLATABLE_FIELDS = ['title', 'excerpt', 'content'] as const;
export const EVENT_TRANSLATABLE_FIELDS = ['title', 'description', 'location'] as const;
export const REPRESENTATIVE_MATTER_TRANSLATABLE_FIELDS = ['title', 'description', 'client'] as const;

export type TeamMemberTranslatableField = typeof TEAM_MEMBER_TRANSLATABLE_FIELDS[number];
export type PracticeGroupTranslatableField = typeof PRACTICE_GROUP_TRANSLATABLE_FIELDS[number];
export type IndustryGroupTranslatableField = typeof INDUSTRY_GROUP_TRANSLATABLE_FIELDS[number];
export type NewsTranslatableField = typeof NEWS_TRANSLATABLE_FIELDS[number];
export type EventTranslatableField = typeof EVENT_TRANSLATABLE_FIELDS[number];
export type RepresentativeMatterTranslatableField = typeof REPRESENTATIVE_MATTER_TRANSLATABLE_FIELDS[number];

export type ContentType = 'team_member' | 'practice_group' | 'industry_group' | 'news' | 'event' | 'representative_matter';

export function getTranslatableFields(contentType: ContentType): readonly string[] {
  switch (contentType) {
    case 'team_member':
      return TEAM_MEMBER_TRANSLATABLE_FIELDS;
    case 'practice_group':
      return PRACTICE_GROUP_TRANSLATABLE_FIELDS;
    case 'industry_group':
      return INDUSTRY_GROUP_TRANSLATABLE_FIELDS;
    case 'news':
      return NEWS_TRANSLATABLE_FIELDS;
    case 'event':
      return EVENT_TRANSLATABLE_FIELDS;
    case 'representative_matter':
      return REPRESENTATIVE_MATTER_TRANSLATABLE_FIELDS;
    default:
      return [];
  }
}

export function isNativeLanguage(langCode: string): boolean {
  return langCode === 'es';
}

export function getSourceLanguageForContent(): 'en' | 'es' {
  return 'es';
}

export interface TranslatedFieldsMap {
  [fieldName: string]: string | undefined | null;
}

export function getFieldValue(
  fields: TranslatedFieldsMap,
  fieldName: string,
  language: string,
  translations?: TranslatedFieldsMap
): string | undefined | null {
  if (language === 'es') {
    const esFieldName = `${fieldName}Es`;
    return fields[esFieldName] ?? fields[fieldName];
  }

  if (translations && translations[fieldName]) {
    return translations[fieldName];
  }

  return fields[fieldName];
}

/**
 * Devuelve la primera cadena no vacía (ignora null/undefined y strings en blanco).
 */
function firstNonEmpty(...vals: Array<string | null | undefined>): string | undefined {
  for (const v of vals) {
    if (typeof v === "string" && v.trim().length > 0) return v;
  }
  return undefined;
}

/**
 * getDisplayValue — ÚNICA vía de i18n para CONTENIDO data-driven (EN/ES).
 *
 * El sitio es bilingüe estático: cada registro de la API trae el campo base
 * (`field`, en inglés) y su variante en español (`${field}Es`). No hay traducción
 * en runtime ni re-fetch por idioma: el componente re-renderiza al cambiar
 * `language` (vía useLanguage) y este helper elige el campo correcto.
 *
 *   - es  → prefiere `${field}Es`, cae a `field`
 *   - en  → prefiere `field`,        cae a `${field}Es`
 *
 * Reemplazó al hook useTranslatedContent (traducción LLM on-demand, frágil, ya
 * ELIMINADO del proyecto) y a los fallbacks ad-hoc que devolvían `*Es` aun en
 * inglés. Si ambos campos están
 * vacíos devuelve undefined para que el llamador pueda usar una etiqueta i18n.
 */
export function getDisplayValue(
  obj: Record<string, any> | null | undefined,
  field: string,
  language: string,
): string | undefined {
  if (!obj) return undefined;
  const base = obj[field] as string | null | undefined;
  const es = obj[`${field}Es`] as string | null | undefined;
  return language === "es" ? firstNonEmpty(es, base) : firstNonEmpty(base, es);
}
