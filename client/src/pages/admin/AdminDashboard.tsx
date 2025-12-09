import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminAuth, adminApiRequest } from "@/lib/adminAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  Newspaper
} from "lucide-react";
import type { BlogPost } from "@shared/schema";

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
    translations: "Translations",
    logout: "Logout",
    loading: "Loading...",
    draft: "Draft",
    publishedStatus: "Published",
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
    translations: "Traducciones",
    logout: "Cerrar Sesión",
    loading: "Cargando...",
    draft: "Borrador",
    publishedStatus: "Publicado",
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
    translations: "Übersetzungen",
    logout: "Abmelden",
    loading: "Wird geladen...",
    draft: "Entwurf",
    publishedStatus: "Veröffentlicht",
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
    translations: "翻译",
    logout: "退出登录",
    loading: "加载中...",
    draft: "草稿",
    publishedStatus: "已发布",
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
    translations: "번역",
    logout: "로그아웃",
    loading: "로딩 중...",
    draft: "임시 저장",
    publishedStatus: "게시됨",
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
    translations: "翻訳",
    logout: "ログアウト",
    loading: "読み込み中...",
    draft: "下書き",
    publishedStatus: "公開済み",
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
    translations: "الترجمات",
    logout: "تسجيل الخروج",
    loading: "جاري التحميل...",
    draft: "مسودة",
    publishedStatus: "منشور",
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
    translations: "Переводы",
    logout: "Выйти",
    loading: "Загрузка...",
    draft: "Черновик",
    publishedStatus: "Опубликовано",
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
    translations: "Traductions",
    logout: "Déconnexion",
    loading: "Chargement...",
    draft: "Brouillon",
    publishedStatus: "Publié",
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
    translations: "Traduzioni",
    logout: "Esci",
    loading: "Caricamento...",
    draft: "Bozza",
    publishedStatus: "Pubblicato",
  },
};

interface DashboardStats {
  total: number;
  drafts: number;
  published: number;
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

  const statsQuery = useQuery<DashboardStats>({
    queryKey: ["/api/admin/posts/stats"],
    queryFn: async () => {
      const res = await adminApiRequest("GET", "/api/admin/posts/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const recentPostsQuery = useQuery<BlogPost[]>({
    queryKey: ["/api/admin/posts", { limit: 5 }],
    queryFn: async () => {
      const res = await adminApiRequest("GET", "/api/admin/posts?limit=5");
      if (!res.ok) throw new Error("Failed to fetch posts");
      const data = await res.json();
      return data.posts || [];
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

  const stats = statsQuery.data || { total: 0, drafts: 0, published: 0 };
  const recentPosts = recentPostsQuery.data || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
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
        <p className="text-muted-foreground mb-8" data-testid="text-welcome">
          {t.welcome}
        </p>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card data-testid="card-stats-total">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">{t.totalPosts}</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsQuery.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold" data-testid="text-stats-total">
                  {stats.total}
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-stats-drafts">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">{t.drafts}</CardTitle>
              <FilePenLine className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsQuery.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold" data-testid="text-stats-drafts">
                  {stats.drafts}
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-stats-published">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">{t.published}</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsQuery.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold" data-testid="text-stats-published">
                  {stats.published}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2" data-testid="card-recent-posts">
            <CardHeader>
              <CardTitle>{t.recentPosts}</CardTitle>
              <CardDescription>
                <Link href="/admin/posts">
                  <Button variant="ghost" size="sm" data-testid="link-view-all-posts">
                    {t.allPosts}
                  </Button>
                </Link>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentPostsQuery.isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : recentPosts.length === 0 ? (
                <p className="text-muted-foreground text-sm" data-testid="text-no-posts">
                  {t.noRecentPosts}
                </p>
              ) : (
                <div className="space-y-3">
                  {recentPosts.map((post) => (
                    <div
                      key={post.id}
                      className="flex items-center justify-between p-3 rounded-md border"
                      data-testid={`row-post-${post.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate" data-testid={`text-post-title-${post.id}`}>
                          {language === "es" ? post.titleEs : post.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {post.status === "draft" ? t.draft : t.publishedStatus}
                        </p>
                      </div>
                      <Link href={`/admin/posts/${post.id}/edit`}>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          data-testid={`button-edit-post-${post.id}`}
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
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
