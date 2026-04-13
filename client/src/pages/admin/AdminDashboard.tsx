import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminAuth, adminApiRequest } from "@/lib/adminAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  FilePenLine, 
  CheckCircle, 
  PlusCircle, 
  FolderOpen, 
  LogOut,
  LayoutDashboard,
  Bot,
  Globe,
  Newspaper,
  Cog,
  Languages,
  Activity,
  Clock,
  BarChart3,
  Loader2,
  Users,
  Briefcase,
  Building2,
  Calendar,
  BookOpen,
  ChevronRight,
  Layers,
  Images
} from "lucide-react";

const translations = {
  en: {
    title: "Admin Dashboard",
    welcome: "Welcome to the blog management system",
    totalPosts: "Total Posts",
    drafts: "Drafts",
    published: "Published",
    recentPosts: "Recent Posts",
    noRecentPosts: "No posts yet",
    editPost: "Edit",
    quickActions: "Quick Actions",
    newPost: "New Post",
    manageCategories: "Manage Categories",
    allPosts: "All Posts",
    newsArticles: "News Articles",
    aiAgents: "AI Agents",
    articleProcessing: "Article Processing",
    teamMembers: "Team Members",
    translations: "Translations",
    practiceGroups: "Practice Areas",
    industryGroups: "Industry Sectors",
    events: "Events",
    knowledgeBase: "Knowledge Base",
    translationsDashboard: "Translation Coverage",
    healthCheck: "System Health Check",
    platformGuide: "Platform Guide",
    systemExplorer: "System Explorer",
    logout: "Logout",
    loading: "Loading...",
    draft: "Draft",
    publishedStatus: "Published",
    cmsOverview: "CMS Overview",
    translationCoverage: "Translation Coverage",
    articlesTranslated: "articles translated",
    outOf: "out of",
    complete: "complete",
    languageDistribution: "Language Distribution",
    noTranslations: "No translations yet",
    recentActivity: "Recent Activity",
    noRecentActivity: "No recent activity",
    totalArticles: "Total Articles",
    totalTranslations: "Total Translations",
    languagesSupported: "Languages Supported",
    processingStatus: "Processing Status",
    idle: "Idle",
    processing: "Processing",
    viewAll: "View All",
  },
  es: {
    title: "Panel de Administración",
    welcome: "Bienvenido al sistema de gestión del blog",
    totalPosts: "Total de Posts",
    drafts: "Borradores",
    published: "Publicados",
    recentPosts: "Posts Recientes",
    noRecentPosts: "No hay posts aún",
    editPost: "Editar",
    quickActions: "Acciones Rápidas",
    newPost: "Nuevo Post",
    manageCategories: "Gestionar Categorías",
    allPosts: "Todos los Posts",
    newsArticles: "Artículos de Noticias",
    aiAgents: "Agentes IA",
    articleProcessing: "Procesamiento de Artículos",
    teamMembers: "Miembros del Equipo",
    translations: "Traducciones",
    practiceGroups: "Áreas de Práctica",
    industryGroups: "Sectores Industriales",
    events: "Eventos",
    knowledgeBase: "Base de Conocimiento",
    translationsDashboard: "Cobertura de Traducción",
    healthCheck: "Verificación del Sistema",
    platformGuide: "Guía de la Plataforma",
    systemExplorer: "Explorador del Sistema",
    logout: "Cerrar Sesión",
    loading: "Cargando...",
    draft: "Borrador",
    publishedStatus: "Publicado",
    cmsOverview: "Resumen del CMS",
    translationCoverage: "Cobertura de Traducción",
    articlesTranslated: "artículos traducidos",
    outOf: "de",
    complete: "completo",
    languageDistribution: "Distribución por Idioma",
    noTranslations: "Sin traducciones aún",
    recentActivity: "Actividad Reciente",
    noRecentActivity: "Sin actividad reciente",
    totalArticles: "Total de Artículos",
    totalTranslations: "Total de Traducciones",
    languagesSupported: "Idiomas Soportados",
    processingStatus: "Estado del Proceso",
    idle: "Inactivo",
    processing: "Procesando",
    viewAll: "Ver Todo",
  },
  de: {
    title: "Admin-Dashboard",
    welcome: "Willkommen im Blog-Verwaltungssystem",
    totalPosts: "Gesamte Beiträge",
    drafts: "Entwürfe",
    published: "Veröffentlicht",
    recentPosts: "Aktuelle Beiträge",
    noRecentPosts: "Noch keine Beiträge",
    editPost: "Bearbeiten",
    quickActions: "Schnellaktionen",
    newPost: "Neuer Beitrag",
    manageCategories: "Kategorien verwalten",
    allPosts: "Alle Beiträge",
    newsArticles: "Nachrichtenartikel",
    aiAgents: "KI-Agenten",
    articleProcessing: "Artikelverarbeitung",
    teamMembers: "Teammitglieder",
    translations: "Übersetzungen",
    practiceGroups: "Praxisbereiche",
    industryGroups: "Industriesektoren",
    events: "Veranstaltungen",
    knowledgeBase: "Wissensdatenbank",
    translationsDashboard: "Übersetzungsabdeckung",
    healthCheck: "Systemprüfung",
    platformGuide: "Plattform-Leitfaden",
    systemExplorer: "System-Explorer",
    logout: "Abmelden",
    loading: "Wird geladen...",
    draft: "Entwurf",
    publishedStatus: "Veröffentlicht",
    cmsOverview: "CMS-Übersicht",
    translationCoverage: "Übersetzungsabdeckung",
    articlesTranslated: "Artikel übersetzt",
    outOf: "von",
    complete: "abgeschlossen",
    languageDistribution: "Sprachverteilung",
    noTranslations: "Noch keine Übersetzungen",
    recentActivity: "Letzte Aktivität",
    noRecentActivity: "Keine aktuelle Aktivität",
    totalArticles: "Gesamte Artikel",
    totalTranslations: "Gesamte Übersetzungen",
    languagesSupported: "Unterstützte Sprachen",
    processingStatus: "Verarbeitungsstatus",
    idle: "Inaktiv",
    processing: "Verarbeitung",
    viewAll: "Alle anzeigen",
  },
  zh: {
    title: "管理仪表板",
    welcome: "欢迎使用博客管理系统",
    totalPosts: "文章总数",
    drafts: "草稿",
    published: "已发布",
    recentPosts: "最近文章",
    noRecentPosts: "暂无文章",
    editPost: "编辑",
    quickActions: "快捷操作",
    newPost: "新建文章",
    manageCategories: "管理分类",
    allPosts: "所有文章",
    newsArticles: "新闻文章",
    aiAgents: "AI 代理",
    articleProcessing: "文章处理",
    teamMembers: "团队成员",
    translations: "翻译",
    practiceGroups: "执业领域",
    industryGroups: "行业领域",
    events: "活动",
    knowledgeBase: "知识库",
    translationsDashboard: "翻译覆盖率",
    healthCheck: "系统健康检查",
    platformGuide: "平台指南",
    systemExplorer: "系统探索器",
    logout: "退出登录",
    loading: "加载中...",
    draft: "草稿",
    publishedStatus: "已发布",
    cmsOverview: "CMS 概览",
    translationCoverage: "翻译覆盖率",
    articlesTranslated: "篇文章已翻译",
    outOf: "共",
    complete: "完成",
    languageDistribution: "语言分布",
    noTranslations: "暂无翻译",
    recentActivity: "最近活动",
    noRecentActivity: "暂无活动",
    totalArticles: "文章总数",
    totalTranslations: "翻译总数",
    languagesSupported: "支持语言",
    processingStatus: "处理状态",
    idle: "空闲",
    processing: "处理中",
    viewAll: "查看全部",
  },
  ko: {
    title: "관리자 대시보드",
    welcome: "블로그 관리 시스템에 오신 것을 환영합니다",
    totalPosts: "전체 게시물",
    drafts: "임시 저장",
    published: "게시됨",
    recentPosts: "최근 게시물",
    noRecentPosts: "아직 게시물이 없습니다",
    editPost: "편집",
    quickActions: "빠른 작업",
    newPost: "새 게시물",
    manageCategories: "카테고리 관리",
    allPosts: "모든 게시물",
    newsArticles: "뉴스 기사",
    aiAgents: "AI 에이전트",
    articleProcessing: "기사 처리",
    teamMembers: "팀 구성원",
    translations: "번역",
    practiceGroups: "업무 분야",
    industryGroups: "산업 분야",
    events: "이벤트",
    knowledgeBase: "지식 베이스",
    translationsDashboard: "번역 커버리지",
    healthCheck: "시스템 상태 점검",
    platformGuide: "플랫폼 가이드",
    systemExplorer: "시스템 탐색기",
    logout: "로그아웃",
    loading: "로딩 중...",
    draft: "임시 저장",
    publishedStatus: "게시됨",
    cmsOverview: "CMS 개요",
    translationCoverage: "번역 커버리지",
    articlesTranslated: "개 기사 번역됨",
    outOf: "중",
    complete: "완료",
    languageDistribution: "언어 분포",
    noTranslations: "아직 번역이 없습니다",
    recentActivity: "최근 활동",
    noRecentActivity: "최근 활동이 없습니다",
    totalArticles: "전체 기사",
    totalTranslations: "전체 번역",
    languagesSupported: "지원 언어",
    processingStatus: "처리 상태",
    idle: "대기 중",
    processing: "처리 중",
    viewAll: "모두 보기",
  },
  ja: {
    title: "管理ダッシュボード",
    welcome: "ブログ管理システムへようこそ",
    totalPosts: "記事総数",
    drafts: "下書き",
    published: "公開済み",
    recentPosts: "最近の記事",
    noRecentPosts: "記事がまだありません",
    editPost: "編集",
    quickActions: "クイックアクション",
    newPost: "新しい記事",
    manageCategories: "カテゴリを管理",
    allPosts: "すべての記事",
    newsArticles: "ニュース記事",
    aiAgents: "AIエージェント",
    articleProcessing: "記事処理",
    teamMembers: "チームメンバー",
    translations: "翻訳",
    practiceGroups: "業務分野",
    industryGroups: "産業分野",
    events: "イベント",
    knowledgeBase: "ナレッジベース",
    translationsDashboard: "翻訳カバレッジ",
    healthCheck: "システム健全性チェック",
    platformGuide: "プラットフォームガイド",
    systemExplorer: "システムエクスプローラー",
    logout: "ログアウト",
    loading: "読み込み中...",
    draft: "下書き",
    publishedStatus: "公開済み",
    cmsOverview: "CMS概要",
    translationCoverage: "翻訳カバレッジ",
    articlesTranslated: "記事が翻訳済み",
    outOf: "件中",
    complete: "完了",
    languageDistribution: "言語分布",
    noTranslations: "まだ翻訳がありません",
    recentActivity: "最近のアクティビティ",
    noRecentActivity: "最近のアクティビティはありません",
    totalArticles: "記事総数",
    totalTranslations: "翻訳総数",
    languagesSupported: "対応言語",
    processingStatus: "処理状態",
    idle: "待機中",
    processing: "処理中",
    viewAll: "すべて表示",
  },
  ar: {
    title: "لوحة التحكم",
    welcome: "مرحباً بك في نظام إدارة المدونة",
    totalPosts: "إجمالي المقالات",
    drafts: "المسودات",
    published: "المنشورة",
    recentPosts: "المقالات الأخيرة",
    noRecentPosts: "لا توجد مقالات حتى الآن",
    editPost: "تعديل",
    quickActions: "إجراءات سريعة",
    newPost: "مقالة جديدة",
    manageCategories: "إدارة الفئات",
    allPosts: "جميع المقالات",
    newsArticles: "مقالات الأخبار",
    aiAgents: "وكلاء الذكاء الاصطناعي",
    articleProcessing: "معالجة المقالات",
    teamMembers: "أعضاء الفريق",
    translations: "الترجمات",
    practiceGroups: "مجالات الممارسة",
    industryGroups: "القطاعات الصناعية",
    events: "الفعاليات",
    knowledgeBase: "قاعدة المعرفة",
    translationsDashboard: "تغطية الترجمة",
    healthCheck: "فحص صحة النظام",
    platformGuide: "دليل المنصة",
    systemExplorer: "مستكشف النظام",
    logout: "تسجيل الخروج",
    loading: "جاري التحميل...",
    draft: "مسودة",
    publishedStatus: "منشور",
    cmsOverview: "نظرة عامة على CMS",
    translationCoverage: "تغطية الترجمة",
    articlesTranslated: "مقالات مترجمة",
    outOf: "من",
    complete: "مكتمل",
    languageDistribution: "توزيع اللغات",
    noTranslations: "لا توجد ترجمات بعد",
    recentActivity: "النشاط الأخير",
    noRecentActivity: "لا يوجد نشاط حديث",
    totalArticles: "إجمالي المقالات",
    totalTranslations: "إجمالي الترجمات",
    languagesSupported: "اللغات المدعومة",
    processingStatus: "حالة المعالجة",
    idle: "خامل",
    processing: "قيد المعالجة",
    viewAll: "عرض الكل",
  },
  ru: {
    title: "Панель управления",
    welcome: "Добро пожаловать в систему управления блогом",
    totalPosts: "Всего записей",
    drafts: "Черновики",
    published: "Опубликовано",
    recentPosts: "Недавние записи",
    noRecentPosts: "Записей пока нет",
    editPost: "Редактировать",
    quickActions: "Быстрые действия",
    newPost: "Новая запись",
    manageCategories: "Управление категориями",
    allPosts: "Все записи",
    newsArticles: "Новостные статьи",
    aiAgents: "ИИ-агенты",
    articleProcessing: "Обработка статей",
    teamMembers: "Члены команды",
    translations: "Переводы",
    practiceGroups: "Области практики",
    industryGroups: "Отраслевые группы",
    events: "Мероприятия",
    knowledgeBase: "База знаний",
    translationsDashboard: "Охват переводов",
    healthCheck: "Проверка системы",
    platformGuide: "Руководство платформы",
    systemExplorer: "Обозреватель системы",
    logout: "Выйти",
    loading: "Загрузка...",
    draft: "Черновик",
    publishedStatus: "Опубликовано",
    cmsOverview: "Обзор CMS",
    translationCoverage: "Покрытие переводов",
    articlesTranslated: "статей переведено",
    outOf: "из",
    complete: "завершено",
    languageDistribution: "Распределение по языкам",
    noTranslations: "Переводов пока нет",
    recentActivity: "Последняя активность",
    noRecentActivity: "Нет недавней активности",
    totalArticles: "Всего статей",
    totalTranslations: "Всего переводов",
    languagesSupported: "Поддерживаемые языки",
    processingStatus: "Статус обработки",
    idle: "Ожидание",
    processing: "Обработка",
    viewAll: "Показать все",
  },
  fr: {
    title: "Tableau de bord admin",
    welcome: "Bienvenue dans le système de gestion du blog",
    totalPosts: "Total des articles",
    drafts: "Brouillons",
    published: "Publiés",
    recentPosts: "Articles récents",
    noRecentPosts: "Aucun article pour le moment",
    editPost: "Modifier",
    quickActions: "Actions rapides",
    newPost: "Nouvel article",
    manageCategories: "Gérer les catégories",
    allPosts: "Tous les articles",
    newsArticles: "Articles d'actualités",
    aiAgents: "Agents IA",
    articleProcessing: "Traitement des articles",
    teamMembers: "Membres de l'équipe",
    translations: "Traductions",
    practiceGroups: "Domaines de pratique",
    industryGroups: "Secteurs industriels",
    events: "Événements",
    knowledgeBase: "Base de connaissances",
    translationsDashboard: "Couverture des traductions",
    healthCheck: "Vérification du système",
    platformGuide: "Guide de la plateforme",
    systemExplorer: "Explorateur du système",
    logout: "Déconnexion",
    loading: "Chargement...",
    draft: "Brouillon",
    publishedStatus: "Publié",
    cmsOverview: "Aperçu du CMS",
    translationCoverage: "Couverture des traductions",
    articlesTranslated: "articles traduits",
    outOf: "sur",
    complete: "terminé",
    languageDistribution: "Distribution des langues",
    noTranslations: "Pas encore de traductions",
    recentActivity: "Activité récente",
    noRecentActivity: "Aucune activité récente",
    totalArticles: "Total des articles",
    totalTranslations: "Total des traductions",
    languagesSupported: "Langues supportées",
    processingStatus: "État du traitement",
    idle: "Inactif",
    processing: "En cours",
    viewAll: "Voir tout",
  },
  it: {
    title: "Dashboard Admin",
    welcome: "Benvenuto nel sistema di gestione del blog",
    totalPosts: "Totale articoli",
    drafts: "Bozze",
    published: "Pubblicati",
    recentPosts: "Articoli recenti",
    noRecentPosts: "Nessun articolo ancora",
    editPost: "Modifica",
    quickActions: "Azioni rapide",
    newPost: "Nuovo articolo",
    manageCategories: "Gestisci categorie",
    allPosts: "Tutti gli articoli",
    newsArticles: "Articoli di notizie",
    aiAgents: "Agenti IA",
    articleProcessing: "Elaborazione articoli",
    teamMembers: "Membri del team",
    translations: "Traduzioni",
    practiceGroups: "Aree di pratica",
    industryGroups: "Settori industriali",
    events: "Eventi",
    knowledgeBase: "Base di conoscenza",
    translationsDashboard: "Copertura traduzioni",
    healthCheck: "Controllo del sistema",
    platformGuide: "Guida della piattaforma",
    systemExplorer: "Esplora Sistema",
    logout: "Esci",
    loading: "Caricamento...",
    draft: "Bozza",
    publishedStatus: "Pubblicato",
    cmsOverview: "Panoramica CMS",
    translationCoverage: "Copertura traduzioni",
    articlesTranslated: "articoli tradotti",
    outOf: "su",
    complete: "completato",
    languageDistribution: "Distribuzione lingue",
    noTranslations: "Nessuna traduzione ancora",
    recentActivity: "Attività recente",
    noRecentActivity: "Nessuna attività recente",
    totalArticles: "Totale articoli",
    totalTranslations: "Totale traduzioni",
    languagesSupported: "Lingue supportate",
    processingStatus: "Stato elaborazione",
    idle: "Inattivo",
    processing: "In elaborazione",
    viewAll: "Vedi tutto",
  },
  pt: {
    title: "Painel de Admin",
    welcome: "Bem-vindo ao sistema de gerenciamento do blog",
    totalPosts: "Total de Posts",
    drafts: "Rascunhos",
    published: "Publicados",
    recentPosts: "Posts Recentes",
    noRecentPosts: "Nenhum post ainda",
    editPost: "Editar",
    quickActions: "Ações Rápidas",
    newPost: "Novo Post",
    manageCategories: "Gerenciar Categorias",
    allPosts: "Todos os Posts",
    newsArticles: "Artigos de Notícias",
    aiAgents: "Agentes IA",
    articleProcessing: "Processamento de Artigos",
    teamMembers: "Membros da Equipe",
    translations: "Traduções",
    practiceGroups: "Áreas de Prática",
    industryGroups: "Setores Industriais",
    events: "Eventos",
    knowledgeBase: "Base de Conhecimento",
    translationsDashboard: "Cobertura de Tradução",
    platformGuide: "Guia da Plataforma",
    logout: "Sair",
    loading: "Carregando...",
    draft: "Rascunho",
    publishedStatus: "Publicado",
    cmsOverview: "Visão Geral do CMS",
    translationCoverage: "Cobertura de Tradução",
    articlesTranslated: "artigos traduzidos",
    outOf: "de",
    complete: "completo",
    languageDistribution: "Distribuição de Idiomas",
    noTranslations: "Sem traduções ainda",
    recentActivity: "Atividade Recente",
    noRecentActivity: "Sem atividade recente",
    totalArticles: "Total de Artigos",
    totalTranslations: "Total de Traduções",
    languagesSupported: "Idiomas Suportados",
    processingStatus: "Status do Processo",
    idle: "Inativo",
    processing: "Processando",
    viewAll: "Ver Todos",
  },
};

const languageNames: Record<string, string> = {
  en: "English",
  es: "Español",
  de: "Deutsch",
  zh: "中文",
  ko: "한국어",
  ja: "日本語",
  ar: "العربية",
  ru: "Русский",
  fr: "Français",
  it: "Italiano",
};

const languageColors: Record<string, string> = {
  en: "bg-blue-500",
  es: "bg-orange-500",
  de: "bg-yellow-600",
  zh: "bg-red-500",
  ko: "bg-purple-500",
  ja: "bg-pink-500",
  ar: "bg-green-500",
  ru: "bg-indigo-500",
  fr: "bg-cyan-500",
  it: "bg-emerald-500",
};

interface CMSStats {
  totalArticles: number;
  articlesWithTranslations: number;
  totalTranslations: number;
  translationsByLanguage: Record<string, number>;
  recentArticles: Array<{
    id: string;
    title: string;
    titleEs: string;
    slug: string;
    date: string;
    category: string;
    published: boolean;
  }>;
  languagesSupported: number;
  processingStatus: "idle" | "processing";
}

export default function AdminDashboard() {
  const { language } = useLanguage();
  const { isAuthenticated, isLoading: authLoading, logout, requireAuth } = useAdminAuth();
  const t = translations[language as keyof typeof translations] || translations.en;

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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t.loading}</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const cmsStats = cmsStatsQuery.data;
  const translationPercentage = cmsStats 
    ? Math.round((cmsStats.articlesWithTranslations / Math.max(cmsStats.totalArticles, 1)) * 100) 
    : 0;

  const maxTranslationsPerLang = cmsStats 
    ? Math.max(...Object.values(cmsStats.translationsByLanguage), 1) 
    : 1;

  return (
    <div className="min-h-screen bg-muted dark:bg-gray-900">
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LayoutDashboard className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold" data-testid="text-dashboard-title">
                {t.title}
              </h1>
            </div>
            <Button 
              variant="outline" 
              onClick={logout}
              data-testid="button-logout"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t.logout}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <p className="text-muted-foreground" data-testid="text-welcome">
            {t.welcome}
          </p>
          <Badge 
            variant={cmsStats?.processingStatus === "processing" ? "default" : "secondary"}
            className="flex items-center gap-1"
            data-testid="badge-processing-status"
          >
            {cmsStats?.processingStatus === "processing" ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                {t.processing}
              </>
            ) : (
              <>
                <Activity className="h-3 w-3" />
                {t.idle}
              </>
            )}
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card data-testid="card-stats-total-articles">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">{t.totalArticles}</CardTitle>
              <Newspaper className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {cmsStatsQuery.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold" data-testid="text-stats-total-articles">
                  {cmsStats?.totalArticles || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-stats-total-translations">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">{t.totalTranslations}</CardTitle>
              <Languages className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {cmsStatsQuery.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold" data-testid="text-stats-total-translations">
                  {cmsStats?.totalTranslations || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-stats-languages">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">{t.languagesSupported}</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {cmsStatsQuery.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold" data-testid="text-stats-languages">
                  {cmsStats?.languagesSupported || 10}
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-stats-processing">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">{t.processingStatus}</CardTitle>
              <Cog className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {cmsStatsQuery.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="flex items-center gap-2">
                  {cmsStats?.processingStatus === "processing" ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="text-lg font-medium text-primary">{t.processing}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-lg font-medium text-green-600 dark:text-green-400">{t.idle}</span>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          <Card className="lg:col-span-1" data-testid="card-translation-coverage">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {t.translationCoverage}
              </CardTitle>
              <CardDescription>
                {cmsStats ? (
                  <>
                    {cmsStats.articlesWithTranslations} {t.outOf} {cmsStats.totalArticles} {t.articlesTranslated}
                  </>
                ) : (
                  <Skeleton className="h-4 w-32" />
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cmsStatsQuery.isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-8 w-24" />
                </div>
              ) : (
                <>
                  <Progress 
                    value={translationPercentage} 
                    className="h-3 mb-4"
                    data-testid="progress-translation-coverage"
                  />
                  <div className="text-3xl font-bold text-primary" data-testid="text-translation-percentage">
                    {translationPercentage}% {t.complete}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2" data-testid="card-language-distribution">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="h-5 w-5" />
                {t.languageDistribution}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cmsStatsQuery.isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                  ))}
                </div>
              ) : Object.keys(cmsStats?.translationsByLanguage || {}).length === 0 ? (
                <p className="text-muted-foreground text-sm" data-testid="text-no-translations">
                  {t.noTranslations}
                </p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(languageNames).map(([code, name]) => {
                    const count = cmsStats?.translationsByLanguage[code] || 0;
                    const percentage = (count / maxTranslationsPerLang) * 100;
                    return (
                      <div key={code} className="flex items-center gap-3" data-testid={`row-language-${code}`}>
                        <span className="text-sm font-medium w-20 truncate">{name}</span>
                        <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${languageColors[code]} transition-all duration-300`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2" data-testid="card-recent-activity">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {t.recentActivity}
                </CardTitle>
                <Link href="/admin/news">
                  <Button variant="ghost" size="sm" data-testid="button-view-all-news">
                    {t.viewAll}
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {cmsStatsQuery.isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : !cmsStats?.recentArticles?.length ? (
                <p className="text-muted-foreground text-sm" data-testid="text-no-activity">
                  {t.noRecentActivity}
                </p>
              ) : (
                <div className="space-y-3">
                  {cmsStats.recentArticles.map((article) => (
                    <div
                      key={article.id}
                      className="flex items-center justify-between p-3 rounded-none border"
                      data-testid={`row-article-${article.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate" data-testid={`text-article-title-${article.id}`}>
                          {language === "es" ? article.titleEs : article.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {article.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {article.date ? new Date(article.date).toLocaleDateString() : ""}
                          </span>
                        </div>
                      </div>
                      <Link href={`/admin/news`}>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          data-testid={`button-view-article-${article.id}`}
                        >
                          {t.editPost}
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-quick-actions">
            <CardHeader>
              <CardTitle>{t.quickActions}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/posts/new">
                <Button className="w-full justify-start" data-testid="button-new-post">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t.newPost}
                </Button>
              </Link>
              <Link href="/admin/categories">
                <Button variant="outline" className="w-full justify-start" data-testid="button-manage-categories">
                  <FolderOpen className="mr-2 h-4 w-4" />
                  {t.manageCategories}
                </Button>
              </Link>
              <Link href="/admin/posts">
                <Button variant="outline" className="w-full justify-start" data-testid="button-all-posts">
                  <FileText className="mr-2 h-4 w-4" />
                  {t.allPosts}
                </Button>
              </Link>
              <Link href="/admin/news">
                <Button variant="outline" className="w-full justify-start" data-testid="button-news-articles">
                  <Newspaper className="mr-2 h-4 w-4" />
                  {t.newsArticles}
                </Button>
              </Link>
              <Link href="/admin/agents">
                <Button variant="outline" className="w-full justify-start" data-testid="button-ai-agents">
                  <Bot className="mr-2 h-4 w-4" />
                  {t.aiAgents}
                </Button>
              </Link>
              <Link href="/admin/processing">
                <Button variant="outline" className="w-full justify-start" data-testid="button-article-processing">
                  <Cog className="mr-2 h-4 w-4" />
                  {t.articleProcessing}
                </Button>
              </Link>
              <Link href="/admin/team">
                <Button variant="outline" className="w-full justify-start" data-testid="button-team-members">
                  <Users className="mr-2 h-4 w-4" />
                  {t.teamMembers || "Team Members"}
                </Button>
              </Link>
              <Link href="/admin/practice-groups">
                <Button variant="outline" className="w-full justify-start" data-testid="button-practice-groups">
                  <Briefcase className="mr-2 h-4 w-4" />
                  {t.practiceGroups || "Practice Areas"}
                </Button>
              </Link>
              <Link href="/admin/industry-groups">
                <Button variant="outline" className="w-full justify-start" data-testid="button-industry-groups">
                  <Building2 className="mr-2 h-4 w-4" />
                  {t.industryGroups || "Industry Sectors"}
                </Button>
              </Link>
              <Link href="/admin/events">
                <Button variant="outline" className="w-full justify-start" data-testid="button-events">
                  <Calendar className="mr-2 h-4 w-4" />
                  {t.events || "Events"}
                </Button>
              </Link>
              <Link href="/admin/gallery">
                <Button variant="outline" className="w-full justify-start" data-testid="button-gallery">
                  <Images className="mr-2 h-4 w-4" />
                  Office Gallery
                </Button>
              </Link>
              <Link href="/admin/translations">
                <Button variant="outline" className="w-full justify-start" data-testid="button-translations-dashboard">
                  <Languages className="mr-2 h-4 w-4" />
                  {t.translationsDashboard || "Translation Coverage"}
                </Button>
              </Link>
              <Link href="/admin/knowledge">
                <Button variant="outline" className="w-full justify-start" data-testid="button-knowledge-base">
                  <BookOpen className="mr-2 h-4 w-4" />
                  {t.knowledgeBase || "Knowledge Base"}
                </Button>
              </Link>
              <Link href="/admin/health-check">
                <Button variant="outline" className="w-full justify-start bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800" data-testid="button-health-check">
                  <Activity className="mr-2 h-4 w-4 text-red-500" />
                  {t.healthCheck || "System Health Check"}
                </Button>
              </Link>
              <Link href="/admin/guide">
                <Button variant="outline" className="w-full justify-start bg-primary/5 border-primary/20" data-testid="button-platform-guide">
                  <Bot className="mr-2 h-4 w-4 text-primary" />
                  {t.platformGuide || "Platform Guide"}
                </Button>
              </Link>
              <Link href="/admin/explorer">
                <Button variant="outline" className="w-full justify-start bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800" data-testid="button-system-explorer">
                  <Layers className="mr-2 h-4 w-4 text-blue-500" />
                  {t.systemExplorer || "System Explorer"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
