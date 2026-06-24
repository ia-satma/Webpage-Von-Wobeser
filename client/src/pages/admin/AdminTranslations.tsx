import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminAuth, adminApiRequest } from "@/lib/adminAuth";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Languages, 
  Globe, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  ArrowLeft,
  Clock,
  AlertCircle
} from "lucide-react";

// Sitio bilingüe nativo EN/ES (i18n estático). El backend solo soporta en/es
// (shared/schema.ts), así que el panel refleja cobertura bilingüe, no un flujo
// de traducción a más idiomas.
const SUPPORTED_LANGUAGES = ["en", "es"] as const;

const LANGUAGE_NAMES: Record<string, { en: string; native: string }> = {
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

const CONTENT_TYPES = [
  { value: "all", label: { en: "All Content", es: "Todo el Contenido", de: "Alle Inhalte", zh: "所有内容", ko: "모든 콘텐츠", ja: "すべてのコンテンツ", ar: "جميع المحتوى", ru: "Весь контент", fr: "Tout le Contenu", it: "Tutti i Contenuti" } },
  { value: "news", label: { en: "News", es: "Noticias", de: "Nachrichten", zh: "新闻", ko: "뉴스", ja: "ニュース", ar: "الأخبار", ru: "Новости", fr: "Actualités", it: "Notizie" } },
  { value: "practice_groups", label: { en: "Practice Groups", es: "Áreas de Práctica", de: "Fachbereiche", zh: "业务领域", ko: "업무 분야", ja: "業務分野", ar: "مجالات الممارسة", ru: "Практики", fr: "Domaines de Pratique", it: "Aree di Pratica" } },
  { value: "team_members", label: { en: "Team Members", es: "Miembros del Equipo", de: "Teammitglieder", zh: "团队成员", ko: "팀 구성원", ja: "チームメンバー", ar: "أعضاء الفريق", ru: "Члены команды", fr: "Membres de l'Équipe", it: "Membri del Team" } },
  { value: "industry_groups", label: { en: "Industry Groups", es: "Grupos de Industria", de: "Branchengruppen", zh: "行业组", ko: "산업 그룹", ja: "業界グループ", ar: "مجموعات الصناعة", ru: "Отраслевые группы", fr: "Groupes Industriels", it: "Gruppi Industriali" } },
];

const translations = {
  en: {
    title: "Translation Coverage",
    subtitle: "Monitor and manage multilingual content across the CMS",
    back: "Back to Dashboard",
    overview: "Overview",
    articles: "Articles",
    recentJobs: "Recent Jobs",
    totalArticles: "Total Articles",
    translatedArticles: "Translated",
    coverageRate: "Coverage Rate",
    languagesSupported: "Languages",
    languageCoverage: "Language Coverage",
    filterByType: "Filter by content type",
    articleTitle: "Title",
    contentType: "Type",
    translationStatus: "Translation Status",
    actions: "Actions",
    translate: "Translate",
    translating: "Translating...",
    noArticles: "No articles found",
    translateMissing: "Translate Missing",
    translateAll: "Translate All Missing",
    jobId: "Job ID",
    status: "Status",
    languages: "Languages",
    createdAt: "Created",
    noJobs: "No recent translation jobs",
    pending: "Pending",
    processing: "Processing",
    completed: "Completed",
    failed: "Failed",
    loading: "Loading...",
    refresh: "Refresh",
    translateSuccess: "Translation job started successfully",
    translateError: "Failed to start translation job",
    selectLanguages: "Select languages to translate",
    missingLanguages: "Missing translations",
    languageCoverageDescription: "Translation progress for each supported language",
    recentJobsDescription: "Translation jobs triggered from this dashboard",
  },
  es: {
    title: "Cobertura de Traducción",
    subtitle: "Monitorea y gestiona el contenido multilingüe del CMS",
    back: "Volver al Dashboard",
    overview: "Resumen",
    articles: "Artículos",
    recentJobs: "Trabajos Recientes",
    totalArticles: "Total de Artículos",
    translatedArticles: "Traducidos",
    coverageRate: "Tasa de Cobertura",
    languagesSupported: "Idiomas",
    languageCoverage: "Cobertura por Idioma",
    filterByType: "Filtrar por tipo de contenido",
    articleTitle: "Título",
    contentType: "Tipo",
    translationStatus: "Estado de Traducción",
    actions: "Acciones",
    translate: "Traducir",
    translating: "Traduciendo...",
    noArticles: "No se encontraron artículos",
    translateMissing: "Traducir Faltantes",
    translateAll: "Traducir Todos los Faltantes",
    jobId: "ID del Trabajo",
    status: "Estado",
    languages: "Idiomas",
    createdAt: "Creado",
    noJobs: "Sin trabajos de traducción recientes",
    pending: "Pendiente",
    processing: "Procesando",
    completed: "Completado",
    failed: "Fallido",
    loading: "Cargando...",
    refresh: "Actualizar",
    translateSuccess: "Trabajo de traducción iniciado exitosamente",
    translateError: "Error al iniciar el trabajo de traducción",
    selectLanguages: "Seleccionar idiomas a traducir",
    missingLanguages: "Traducciones faltantes",
    languageCoverageDescription: "Progreso de traducción para cada idioma soportado",
    recentJobsDescription: "Trabajos de traducción iniciados desde este panel",
  },
  de: {
    title: "Übersetzungsabdeckung",
    subtitle: "Überwachen und verwalten Sie mehrsprachige Inhalte im CMS",
    back: "Zurück zum Dashboard",
    overview: "Übersicht",
    articles: "Artikel",
    recentJobs: "Letzte Aufträge",
    totalArticles: "Gesamtartikel",
    translatedArticles: "Übersetzt",
    coverageRate: "Abdeckungsrate",
    languagesSupported: "Sprachen",
    languageCoverage: "Sprachabdeckung",
    filterByType: "Nach Inhaltstyp filtern",
    articleTitle: "Titel",
    contentType: "Typ",
    translationStatus: "Übersetzungsstatus",
    actions: "Aktionen",
    translate: "Übersetzen",
    translating: "Übersetze...",
    noArticles: "Keine Artikel gefunden",
    translateMissing: "Fehlende übersetzen",
    translateAll: "Alle Fehlenden übersetzen",
    jobId: "Auftrags-ID",
    status: "Status",
    languages: "Sprachen",
    createdAt: "Erstellt",
    noJobs: "Keine aktuellen Übersetzungsaufträge",
    pending: "Ausstehend",
    processing: "Verarbeitung",
    completed: "Abgeschlossen",
    failed: "Fehlgeschlagen",
    loading: "Wird geladen...",
    refresh: "Aktualisieren",
    translateSuccess: "Übersetzungsauftrag erfolgreich gestartet",
    translateError: "Übersetzungsauftrag konnte nicht gestartet werden",
    selectLanguages: "Sprachen zum Übersetzen auswählen",
    missingLanguages: "Fehlende Übersetzungen",
    languageCoverageDescription: "Übersetzungsfortschritt für jede unterstützte Sprache",
    recentJobsDescription: "Von diesem Dashboard gestartete Übersetzungsaufträge",
  },
  zh: {
    title: "翻译覆盖率",
    subtitle: "监控和管理CMS中的多语言内容",
    back: "返回仪表板",
    overview: "概览",
    articles: "文章",
    recentJobs: "最近任务",
    totalArticles: "文章总数",
    translatedArticles: "已翻译",
    coverageRate: "覆盖率",
    languagesSupported: "语言",
    languageCoverage: "语言覆盖率",
    filterByType: "按内容类型筛选",
    articleTitle: "标题",
    contentType: "类型",
    translationStatus: "翻译状态",
    actions: "操作",
    translate: "翻译",
    translating: "翻译中...",
    noArticles: "未找到文章",
    translateMissing: "翻译缺失",
    translateAll: "翻译所有缺失",
    jobId: "任务ID",
    status: "状态",
    languages: "语言",
    createdAt: "创建时间",
    noJobs: "无最近翻译任务",
    pending: "待处理",
    processing: "处理中",
    completed: "已完成",
    failed: "失败",
    loading: "加载中...",
    refresh: "刷新",
    translateSuccess: "翻译任务已成功启动",
    translateError: "启动翻译任务失败",
    selectLanguages: "选择要翻译的语言",
    missingLanguages: "缺失翻译",
    languageCoverageDescription: "每种支持语言的翻译进度",
    recentJobsDescription: "从此仪表板触发的翻译任务",
  },
  ko: {
    title: "번역 커버리지",
    subtitle: "CMS의 다국어 콘텐츠 모니터링 및 관리",
    back: "대시보드로 돌아가기",
    overview: "개요",
    articles: "기사",
    recentJobs: "최근 작업",
    totalArticles: "전체 기사",
    translatedArticles: "번역됨",
    coverageRate: "커버리지율",
    languagesSupported: "언어",
    languageCoverage: "언어 커버리지",
    filterByType: "콘텐츠 유형별 필터",
    articleTitle: "제목",
    contentType: "유형",
    translationStatus: "번역 상태",
    actions: "작업",
    translate: "번역",
    translating: "번역 중...",
    noArticles: "기사를 찾을 수 없습니다",
    translateMissing: "누락 번역",
    translateAll: "모든 누락 번역",
    jobId: "작업 ID",
    status: "상태",
    languages: "언어",
    createdAt: "생성됨",
    noJobs: "최근 번역 작업 없음",
    pending: "대기 중",
    processing: "처리 중",
    completed: "완료",
    failed: "실패",
    loading: "로딩 중...",
    refresh: "새로고침",
    translateSuccess: "번역 작업이 성공적으로 시작되었습니다",
    translateError: "번역 작업 시작 실패",
    selectLanguages: "번역할 언어 선택",
    missingLanguages: "누락된 번역",
    languageCoverageDescription: "지원되는 각 언어의 번역 진행률",
    recentJobsDescription: "이 대시보드에서 시작된 번역 작업",
  },
  ja: {
    title: "翻訳カバレッジ",
    subtitle: "CMSの多言語コンテンツを監視・管理",
    back: "ダッシュボードに戻る",
    overview: "概要",
    articles: "記事",
    recentJobs: "最近のジョブ",
    totalArticles: "記事総数",
    translatedArticles: "翻訳済み",
    coverageRate: "カバレッジ率",
    languagesSupported: "言語",
    languageCoverage: "言語カバレッジ",
    filterByType: "コンテンツタイプでフィルター",
    articleTitle: "タイトル",
    contentType: "タイプ",
    translationStatus: "翻訳状態",
    actions: "アクション",
    translate: "翻訳",
    translating: "翻訳中...",
    noArticles: "記事が見つかりません",
    translateMissing: "不足を翻訳",
    translateAll: "すべての不足を翻訳",
    jobId: "ジョブID",
    status: "ステータス",
    languages: "言語",
    createdAt: "作成日",
    noJobs: "最近の翻訳ジョブなし",
    pending: "保留中",
    processing: "処理中",
    completed: "完了",
    failed: "失敗",
    loading: "読み込み中...",
    refresh: "更新",
    translateSuccess: "翻訳ジョブが正常に開始されました",
    translateError: "翻訳ジョブの開始に失敗しました",
    selectLanguages: "翻訳する言語を選択",
    missingLanguages: "不足している翻訳",
    languageCoverageDescription: "各対応言語の翻訳進捗状況",
    recentJobsDescription: "このダッシュボードから開始された翻訳ジョブ",
  },
  ar: {
    title: "تغطية الترجمة",
    subtitle: "مراقبة وإدارة المحتوى متعدد اللغات في نظام إدارة المحتوى",
    back: "العودة إلى لوحة التحكم",
    overview: "نظرة عامة",
    articles: "المقالات",
    recentJobs: "المهام الأخيرة",
    totalArticles: "إجمالي المقالات",
    translatedArticles: "مترجمة",
    coverageRate: "معدل التغطية",
    languagesSupported: "اللغات",
    languageCoverage: "تغطية اللغة",
    filterByType: "تصفية حسب نوع المحتوى",
    articleTitle: "العنوان",
    contentType: "النوع",
    translationStatus: "حالة الترجمة",
    actions: "الإجراءات",
    translate: "ترجمة",
    translating: "جاري الترجمة...",
    noArticles: "لم يتم العثور على مقالات",
    translateMissing: "ترجمة المفقود",
    translateAll: "ترجمة كل المفقود",
    jobId: "معرف المهمة",
    status: "الحالة",
    languages: "اللغات",
    createdAt: "تاريخ الإنشاء",
    noJobs: "لا توجد مهام ترجمة حديثة",
    pending: "قيد الانتظار",
    processing: "قيد المعالجة",
    completed: "مكتمل",
    failed: "فشل",
    loading: "جاري التحميل...",
    refresh: "تحديث",
    translateSuccess: "تم بدء مهمة الترجمة بنجاح",
    translateError: "فشل في بدء مهمة الترجمة",
    selectLanguages: "اختر اللغات للترجمة",
    missingLanguages: "الترجمات المفقودة",
    languageCoverageDescription: "تقدم الترجمة لكل لغة مدعومة",
    recentJobsDescription: "مهام الترجمة التي تم تشغيلها من لوحة التحكم هذه",
  },
  ru: {
    title: "Охват переводов",
    subtitle: "Мониторинг и управление многоязычным контентом CMS",
    back: "Вернуться к панели",
    overview: "Обзор",
    articles: "Статьи",
    recentJobs: "Последние задачи",
    totalArticles: "Всего статей",
    translatedArticles: "Переведено",
    coverageRate: "Процент охвата",
    languagesSupported: "Языки",
    languageCoverage: "Охват по языкам",
    filterByType: "Фильтр по типу контента",
    articleTitle: "Заголовок",
    contentType: "Тип",
    translationStatus: "Статус перевода",
    actions: "Действия",
    translate: "Перевести",
    translating: "Перевод...",
    noArticles: "Статьи не найдены",
    translateMissing: "Перевести отсутствующие",
    translateAll: "Перевести все отсутствующие",
    jobId: "ID задачи",
    status: "Статус",
    languages: "Языки",
    createdAt: "Создано",
    noJobs: "Нет последних задач перевода",
    pending: "Ожидание",
    processing: "Обработка",
    completed: "Завершено",
    failed: "Ошибка",
    loading: "Загрузка...",
    refresh: "Обновить",
    translateSuccess: "Задача перевода успешно запущена",
    translateError: "Не удалось запустить задачу перевода",
    selectLanguages: "Выберите языки для перевода",
    missingLanguages: "Отсутствующие переводы",
    languageCoverageDescription: "Прогресс перевода для каждого поддерживаемого языка",
    recentJobsDescription: "Задачи перевода, запущенные с этой панели",
  },
  fr: {
    title: "Couverture de Traduction",
    subtitle: "Surveiller et gérer le contenu multilingue du CMS",
    back: "Retour au tableau de bord",
    overview: "Aperçu",
    articles: "Articles",
    recentJobs: "Tâches Récentes",
    totalArticles: "Total des Articles",
    translatedArticles: "Traduits",
    coverageRate: "Taux de Couverture",
    languagesSupported: "Langues",
    languageCoverage: "Couverture par Langue",
    filterByType: "Filtrer par type de contenu",
    articleTitle: "Titre",
    contentType: "Type",
    translationStatus: "Statut de Traduction",
    actions: "Actions",
    translate: "Traduire",
    translating: "Traduction...",
    noArticles: "Aucun article trouvé",
    translateMissing: "Traduire les manquants",
    translateAll: "Traduire tous les manquants",
    jobId: "ID de Tâche",
    status: "Statut",
    languages: "Langues",
    createdAt: "Créé",
    noJobs: "Aucune tâche de traduction récente",
    pending: "En attente",
    processing: "En cours",
    completed: "Terminé",
    failed: "Échoué",
    loading: "Chargement...",
    refresh: "Actualiser",
    translateSuccess: "Tâche de traduction démarrée avec succès",
    translateError: "Échec du démarrage de la tâche de traduction",
    selectLanguages: "Sélectionner les langues à traduire",
    missingLanguages: "Traductions manquantes",
    languageCoverageDescription: "Progression de la traduction pour chaque langue prise en charge",
    recentJobsDescription: "Tâches de traduction lancées depuis ce tableau de bord",
  },
  it: {
    title: "Copertura Traduzioni",
    subtitle: "Monitora e gestisci i contenuti multilingue del CMS",
    back: "Torna alla Dashboard",
    overview: "Panoramica",
    articles: "Articoli",
    recentJobs: "Lavori Recenti",
    totalArticles: "Totale Articoli",
    translatedArticles: "Tradotti",
    coverageRate: "Tasso di Copertura",
    languagesSupported: "Lingue",
    languageCoverage: "Copertura per Lingua",
    filterByType: "Filtra per tipo di contenuto",
    articleTitle: "Titolo",
    contentType: "Tipo",
    translationStatus: "Stato Traduzione",
    actions: "Azioni",
    translate: "Traduci",
    translating: "Traducendo...",
    noArticles: "Nessun articolo trovato",
    translateMissing: "Traduci mancanti",
    translateAll: "Traduci tutti i mancanti",
    jobId: "ID Lavoro",
    status: "Stato",
    languages: "Lingue",
    createdAt: "Creato",
    noJobs: "Nessun lavoro di traduzione recente",
    pending: "In attesa",
    processing: "In elaborazione",
    completed: "Completato",
    failed: "Fallito",
    loading: "Caricamento...",
    refresh: "Aggiorna",
    translateSuccess: "Lavoro di traduzione avviato con successo",
    translateError: "Impossibile avviare il lavoro di traduzione",
    selectLanguages: "Seleziona le lingue da tradurre",
    missingLanguages: "Traduzioni mancanti",
    languageCoverageDescription: "Avanzamento della traduzione per ogni lingua supportata",
    recentJobsDescription: "Lavori di traduzione avviati da questa dashboard",
  },
};

interface CMSStats {
  totalNews: number;
  totalTeamMembers: number;
  totalPracticeGroups: number;
  totalIndustryGroups: number;
  translationsByLanguage: Record<string, number>;
}

interface TranslationCounts {
  articleId: string;
  title: string;
  slug: string;
  category: string;
  translatedLanguages: string[];
  missingLanguages: string[];
}

interface TranslationJob {
  id: string;
  articleId: string;
  languages: string[];
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export default function AdminTranslations() {
  const { language } = useLanguage();
  const { isAuthenticated, isLoading: authLoading, requireAuth } = useAdminAuth();
  const { toast } = useToast();
  const t = translations[language as keyof typeof translations] || translations.en;

  const [contentTypeFilter, setContentTypeFilter] = useState("all");

  useEffect(() => {
    if (!authLoading) {
      requireAuth();
    }
  }, [authLoading, requireAuth]);

  const cmsStatsQuery = useQuery<CMSStats>({
    queryKey: ["/api/admin/cms-stats"],
    queryFn: async () => {
      const res = await adminApiRequest("GET", "/api/admin/cms-stats");
      if (!res.ok) throw new Error("Failed to fetch CMS stats");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const translationCountsQuery = useQuery<{ news: TranslationCounts[] }>({
    // translation-status devuelve { news: TranslationCounts[] } (idiomas por
    // artículo), que es lo que este panel consume. NO usar translation-counts:
    // ese devuelve Record<id, count> y lo consume AdminArticleProcessing.
    queryKey: ["/api/admin/news/translation-status", contentTypeFilter],
    queryFn: async () => {
      const res = await adminApiRequest("GET", "/api/admin/news/translation-status");
      if (!res.ok) throw new Error("Failed to fetch translation status");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  // El panel ya NO traduce a más idiomas: el contenido es bilingüe nativo EN/ES,
  // así que no hay "idiomas faltantes" ni botón de traducción. El panel reporta
  // cobertura bilingüe derivada de la lista real de artículos.
  const getLanguageCoverageData = () => {
    const articles = translationCountsQuery.data?.news ?? [];
    const total = articles.length || 1;
    return SUPPORTED_LANGUAGES.map((lang) => {
      const translated = articles.filter((a) => a.translatedLanguages?.includes(lang)).length;
      const coverage = Math.round((translated / total) * 100);
      return {
        code: lang,
        name: LANGUAGE_NAMES[lang]?.en || lang,
        native: LANGUAGE_NAMES[lang]?.native || lang,
        translated,
        total: articles.length,
        coverage: Math.min(coverage, 100),
      };
    });
  };

  const getOverallStats = () => {
    const articles = translationCountsQuery.data?.news ?? [];
    const total = articles.length;
    const fullyCovered = articles.filter((a) =>
      SUPPORTED_LANGUAGES.every((l) => a.translatedLanguages?.includes(l)),
    ).length;
    const coverage = total > 0 ? Math.round((fullyCovered / total) * 100) : 0;
    return { total, translated: fullyCovered, coverage, languages: SUPPORTED_LANGUAGES.length };
  };

  const getFilteredArticles = () => {
    const articles = translationCountsQuery.data?.news || [];
    if (contentTypeFilter === "all") return articles;
    return articles.filter((a) => a.category === contentTypeFilter);
  };

  const getCoverageColor = (coverage: number) => {
    if (coverage >= 90) return "text-green-600";
    if (coverage >= 70) return "text-yellow-600";
    if (coverage >= 50) return "text-orange-600";
    return "text-red-600";
  };

  const getProgressColor = (coverage: number) => {
    if (coverage >= 90) return "bg-green-600";
    if (coverage >= 70) return "bg-yellow-600";
    if (coverage >= 50) return "bg-orange-600";
    return "bg-red-600";
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="loading-auth">
        <div className="text-lg">{t.loading}</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const overallStats = getOverallStats();
  const languageCoverage = getLanguageCoverageData();
  const filteredArticles = getFilteredArticles();

  return (
    <div className="min-h-screen bg-muted dark:bg-gray-900" data-testid="admin-translations-page">
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="sm" data-testid="button-back">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t.back}
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Languages className="h-5 w-5 text-primary" />
                <div>
                  <h1 className="text-xl font-semibold" data-testid="text-page-title">
                    {t.title}
                  </h1>
                  <p className="text-sm text-muted-foreground">{t.subtitle}</p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/admin/cms-stats"] });
                queryClient.invalidateQueries({ queryKey: ["/api/admin/news/translation-status"] });
              }}
              data-testid="button-refresh"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {t.refresh}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList data-testid="tabs-navigation">
            <TabsTrigger value="overview" data-testid="tab-overview">{t.overview}</TabsTrigger>
            <TabsTrigger value="articles" data-testid="tab-articles">{t.articles}</TabsTrigger>
            <TabsTrigger value="jobs" data-testid="tab-jobs">{t.recentJobs}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card data-testid="card-total-articles">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{t.totalArticles}</CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {cmsStatsQuery.isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold" data-testid="text-total-articles">
                      {overallStats.total}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="card-translated-articles">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{t.translatedArticles}</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  {cmsStatsQuery.isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold text-green-600" data-testid="text-translated-articles">
                      {overallStats.translated}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="card-coverage-rate">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{t.coverageRate}</CardTitle>
                  <Languages className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {cmsStatsQuery.isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <>
                      <div className={`text-2xl font-bold ${getCoverageColor(overallStats.coverage)}`} data-testid="text-coverage-rate">
                        {overallStats.coverage}%
                      </div>
                      <Progress value={overallStats.coverage} className="mt-2" />
                    </>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="card-languages-supported">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{t.languagesSupported}</CardTitle>
                  <Globe className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600" data-testid="text-languages-count">
                    {overallStats.languages}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card data-testid="card-language-coverage">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="h-5 w-5 text-primary" />
                  {t.languageCoverage}
                </CardTitle>
                <CardDescription>
                  {t.languageCoverageDescription}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cmsStatsQuery.isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {languageCoverage.map((lang) => (
                      <div key={lang.code} className="space-y-2" data-testid={`language-row-${lang.code}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{lang.name}</span>
                            <span className="text-sm text-muted-foreground">({lang.native})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {lang.translated} / {lang.total}
                            </span>
                            <span className={`font-medium ${getCoverageColor(lang.coverage)}`} data-testid={`text-coverage-${lang.code}`}>
                              {lang.coverage}%
                            </span>
                          </div>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          <div
                            className={`h-full transition-all ${getProgressColor(lang.coverage)}`}
                            style={{ width: `${lang.coverage}%` }}
                            data-testid={`progress-${lang.code}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="articles" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t.articles}</CardTitle>
                  <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
                    <SelectTrigger className="w-48" data-testid="select-content-type">
                      <SelectValue placeholder={t.filterByType} />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value} data-testid={`option-type-${type.value}`}>
                          {type.label[language as keyof typeof type.label] || type.label.en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {translationCountsQuery.isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : filteredArticles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground" data-testid="text-no-articles">
                    {t.noArticles}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.articleTitle}</TableHead>
                        <TableHead>{t.contentType}</TableHead>
                        <TableHead>{t.translationStatus}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredArticles.map((article) => (
                        <TableRow key={article.articleId} data-testid={`row-article-${article.articleId}`}>
                          <TableCell className="font-medium max-w-xs truncate" data-testid={`text-title-${article.articleId}`}>
                            {article.title}
                          </TableCell>
                          <TableCell data-testid={`text-type-${article.articleId}`}>
                            <Badge variant="secondary">{article.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {SUPPORTED_LANGUAGES.map((lang) => {
                                const isTranslated = article.translatedLanguages?.includes(lang);
                                return (
                                  <Badge
                                    key={lang}
                                    variant={isTranslated ? "default" : "outline"}
                                    className={`text-xs ${
                                      isTranslated
                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                    }`}
                                    data-testid={`badge-lang-${article.articleId}-${lang}`}
                                  >
                                    {isTranslated ? (
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                    ) : (
                                      <XCircle className="h-3 w-3 mr-1" />
                                    )}
                                    {lang.toUpperCase()}
                                  </Badge>
                                );
                              })}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4">
            <Card data-testid="card-recent-jobs">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  {t.recentJobs}
                </CardTitle>
                <CardDescription>
                  {t.recentJobsDescription}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground" data-testid="text-no-jobs">
                  <AlertCircle className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
                  {t.noJobs}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
