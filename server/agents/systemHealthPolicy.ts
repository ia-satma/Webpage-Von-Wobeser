const NON_LINGUISTIC_TRANSLATION_FIELDS = new Set([
  'address',
  'email',
  'imageurl',
  'location',
  'mapurl',
  'slug',
  'url',
]);

const hasText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

export function publishedArticleCompletenessIssues(article: {
  category?: string | null;
  title?: string | null;
  excerpt?: string | null;
  excerptEs?: string | null;
  content?: string | null;
  contentEs?: string | null;
  sourceUrl?: string | null;
}): string[] {
  const issues: string[] = [];
  const hasEnglishBody = hasText(article.content);
  const hasSpanishBody = hasText(article.contentEs);
  const isBodylessBibliographicArticle = article.category === 'articles'
    && !hasEnglishBody
    && !hasSpanishBody
    && (
      (hasText(article.excerpt) && hasText(article.excerptEs))
      || /^https:\/\/[^\s]+$/i.test(String(article.sourceUrl || '').trim())
    );

  if (!hasEnglishBody && !isBodylessBibliographicArticle) issues.push('missing English content');
  if (!hasText(article.title)) issues.push('missing English title');
  return issues;
}

export function shouldAuditCachedTranslationLanguage(field: string | null | undefined): boolean {
  return !NON_LINGUISTIC_TRANSLATION_FIELDS.has(String(field || '').trim().toLowerCase());
}
