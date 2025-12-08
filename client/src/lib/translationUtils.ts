export const TEAM_MEMBER_TRANSLATABLE_FIELDS = ['title', 'role', 'bio'] as const;
export const PRACTICE_GROUP_TRANSLATABLE_FIELDS = ['name', 'description', 'fullDescription'] as const;
export const INDUSTRY_GROUP_TRANSLATABLE_FIELDS = ['name', 'description', 'fullDescription'] as const;
export const NEWS_TRANSLATABLE_FIELDS = ['title', 'excerpt', 'content'] as const;
export const EVENT_TRANSLATABLE_FIELDS = ['title', 'description', 'location'] as const;

export type TeamMemberTranslatableField = typeof TEAM_MEMBER_TRANSLATABLE_FIELDS[number];
export type PracticeGroupTranslatableField = typeof PRACTICE_GROUP_TRANSLATABLE_FIELDS[number];
export type IndustryGroupTranslatableField = typeof INDUSTRY_GROUP_TRANSLATABLE_FIELDS[number];
export type NewsTranslatableField = typeof NEWS_TRANSLATABLE_FIELDS[number];
export type EventTranslatableField = typeof EVENT_TRANSLATABLE_FIELDS[number];

export type ContentType = 'team_member' | 'practice_group' | 'industry_group' | 'news' | 'event';

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
    default:
      return [];
  }
}

export function isNativeLanguage(langCode: string): boolean {
  return langCode === 'en' || langCode === 'es';
}

export function getSourceLanguageForContent(): 'en' | 'es' {
  return 'en';
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
  
  if (language === 'en') {
    return fields[fieldName];
  }
  
  if (translations && translations[fieldName]) {
    return translations[fieldName];
  }
  
  return fields[fieldName];
}
