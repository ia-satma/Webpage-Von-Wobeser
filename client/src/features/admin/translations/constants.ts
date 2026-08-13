export const SUPPORTED_LANGUAGES = [
  "en",
  "es",
  "de",
  "zh",
  "ko",
  "ja",
  "ar",
  "ru",
  "fr",
  "it",
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANG_LABELS: Record<string, string> = {
  es: "Español",
  en: "Inglés",
  de: "Alemán",
  zh: "Chino",
  ko: "Coreano",
  ja: "Japonés",
  ar: "Árabe",
  ru: "Ruso",
  fr: "Francés",
  it: "Italiano",
};

export const LANGUAGE_NAMES: Record<string, { en: string; native: string }> = {
  en: { en: "English", native: "English" },
  es: { en: "Spanish", native: "Español" },
  de: { en: "German", native: "Deutsch" },
  zh: { en: "Chinese", native: "中文" },
  ko: { en: "Korean", native: "한국어" },
  ja: { en: "Japanese", native: "日本語" },
  ar: { en: "Arabic", native: "العربية" },
  ru: { en: "Russian", native: "Русский" },
  fr: { en: "French", native: "Français" },
  it: { en: "Italian", native: "Italiano" },
};

export const CONTENT_TYPES = [
  { value: "all", label: { en: "All Content", es: "Todo el Contenido", de: "Alle Inhalte", zh: "所有内容", ko: "모든 콘텐츠", ja: "すべてのコンテンツ", ar: "جميع المحتوى", ru: "Весь контент", fr: "Tout le Contenu", it: "Tutti i Contenuti" } },
  { value: "news", label: { en: "News", es: "Noticias", de: "Nachrichten", zh: "新闻", ko: "뉴스", ja: "ニュース", ar: "الأخبار", ru: "Новости", fr: "Actualités", it: "Notizie" } },
  { value: "practice_groups", label: { en: "Practice Groups", es: "Áreas de Práctica", de: "Fachbereiche", zh: "业务领域", ko: "업무 분야", ja: "業務分野", ar: "مجالات الممارسة", ru: "Практики", fr: "Domaines de Pratique", it: "Aree di Pratica" } },
  { value: "team_members", label: { en: "Team Members", es: "Miembros del Equipo", de: "Teammitglieder", zh: "团队成员", ko: "팀 구성원", ja: "チームメンバー", ar: "أعضاء الفريق", ru: "Члены команды", fr: "Membres de l'Équipe", it: "Membri del Team" } },
  { value: "industry_groups", label: { en: "Industry Groups", es: "Grupos de Industria", de: "Branchengruppen", zh: "行业组", ko: "산업 그룹", ja: "業界グループ", ar: "مجموعات الصناعة", ru: "Отраслевые группы", fr: "Groupes Industriels", it: "Gruppi Industriali" } },
] as const;

const TRANSLATION_COUNTS_ROOT = ["/api/admin/news/translation-counts"] as const;

export const TRANSLATION_QUERY_KEYS = {
  stats: ["/api/admin/cms-stats"] as const,
  counts: {
    root: TRANSLATION_COUNTS_ROOT,
    forFilter: (contentTypeFilter: string) => [
      ...TRANSLATION_COUNTS_ROOT,
      contentTypeFilter,
    ] as const,
  },
  languages: ["/api/admin/settings/languages"] as const,
};
