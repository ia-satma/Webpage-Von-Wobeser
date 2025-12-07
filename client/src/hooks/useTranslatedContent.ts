import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isNativeLanguage, type ContentType, type TranslatedFieldsMap } from "@/lib/translationUtils";

interface TranslationResponse {
  translations: Record<string, string>;
  contentType: string;
  entityId: string;
  targetLanguage: string;
}

interface TranslateEntityResponse {
  translations: Record<string, string>;
  contentType: string;
  entityId: string;
  targetLanguage: string;
  cachedCount: number;
  translatedCount: number;
}

interface UseTranslatedContentOptions {
  contentType: ContentType;
  entityId: string;
  fields: TranslatedFieldsMap;
  enabled?: boolean;
}

interface UseTranslatedContentReturn {
  translatedFields: TranslatedFieldsMap;
  isLoading: boolean;
  isTranslating: boolean;
  error: Error | null;
}

export function useTranslatedContent({
  contentType,
  entityId,
  fields,
  enabled = true,
}: UseTranslatedContentOptions): UseTranslatedContentReturn {
  const { language } = useLanguage();

  const isNative = isNativeLanguage(language);

  const { data: cachedTranslations, isLoading } = useQuery<TranslationResponse>({
    queryKey: ['/api/translations', contentType, entityId, language],
    enabled: enabled && !isNative && !!entityId,
  });

  const translateMutation = useMutation({
    mutationFn: async (data: {
      contentType: string;
      entityId: string;
      fields: Record<string, string>;
      sourceLanguage: string;
      targetLanguage: string;
    }) => {
      const response = await apiRequest('POST', '/api/translate-entity', data);
      return response.json() as Promise<TranslateEntityResponse>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        ['/api/translations', contentType, entityId, language],
        { 
          translations: data.translations, 
          contentType: data.contentType, 
          entityId: data.entityId, 
          targetLanguage: data.targetLanguage 
        }
      );
    },
  });

  const lastTranslationKeyRef = useRef<string>('');

  const fieldsToTranslate = useMemo(() => {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value && typeof value === 'string' && value.trim() && !key.endsWith('Es')) {
        result[key] = value;
      }
    }
    return result;
  }, [fields]);

  const hasCachedTranslations = cachedTranslations?.translations && 
    Object.keys(cachedTranslations.translations).length > 0;
  
  const needsTranslation = !isNative && enabled && !!entityId && !isLoading && 
    !hasCachedTranslations && Object.keys(fieldsToTranslate).length > 0;

  const translationKey = `${contentType}-${entityId}-${language}`;

  useEffect(() => {
    if (needsTranslation && !translateMutation.isPending && lastTranslationKeyRef.current !== translationKey) {
      lastTranslationKeyRef.current = translationKey;
      translateMutation.mutate({
        contentType,
        entityId,
        fields: fieldsToTranslate,
        sourceLanguage: 'en',
        targetLanguage: language,
      });
    }
  }, [needsTranslation, translateMutation.isPending, contentType, entityId, fieldsToTranslate, language, translationKey]);

  const getTranslatedFields = (): TranslatedFieldsMap => {
    if (language === 'es') {
      const esFields: TranslatedFieldsMap = {};
      for (const [key, value] of Object.entries(fields)) {
        if (key.endsWith('Es')) {
          const baseKey = key.slice(0, -2);
          esFields[baseKey] = value ?? fields[baseKey];
        } else if (!fields[`${key}Es`]) {
          esFields[key] = value;
        }
      }
      return esFields;
    }

    if (language === 'en') {
      const enFields: TranslatedFieldsMap = {};
      for (const [key, value] of Object.entries(fields)) {
        if (!key.endsWith('Es')) {
          enFields[key] = value;
        }
      }
      return enFields;
    }

    const translations = cachedTranslations?.translations || translateMutation.data?.translations;
    
    if (translations && Object.keys(translations).length > 0) {
      const translatedFields: TranslatedFieldsMap = {};
      for (const [key, value] of Object.entries(fields)) {
        if (!key.endsWith('Es')) {
          translatedFields[key] = translations[key] ?? value;
        }
      }
      return translatedFields;
    }

    const fallbackFields: TranslatedFieldsMap = {};
    for (const [key, value] of Object.entries(fields)) {
      if (!key.endsWith('Es')) {
        fallbackFields[key] = value;
      }
    }
    return fallbackFields;
  };

  return {
    translatedFields: getTranslatedFields(),
    isLoading,
    isTranslating: translateMutation.isPending,
    error: translateMutation.error as Error | null,
  };
}

export function useSingleTranslation() {
  const { language } = useLanguage();

  const translateMutation = useMutation({
    mutationFn: async (data: {
      contentType: string;
      entityId: string;
      field: string;
      sourceText: string;
      sourceLanguage: string;
      targetLanguage: string;
    }) => {
      const response = await apiRequest('POST', '/api/translate-content', data);
      return response.json();
    },
  });

  const translate = (
    contentType: string,
    entityId: string,
    field: string,
    sourceText: string
  ) => {
    if (isNativeLanguage(language)) {
      return Promise.resolve(sourceText);
    }

    return translateMutation.mutateAsync({
      contentType,
      entityId,
      field,
      sourceText,
      sourceLanguage: 'en',
      targetLanguage: language,
    }).then(res => res.translation);
  };

  return {
    translate,
    isTranslating: translateMutation.isPending,
    error: translateMutation.error as Error | null,
  };
}
