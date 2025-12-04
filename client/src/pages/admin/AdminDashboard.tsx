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
  LayoutDashboard
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
    logout: "Cerrar Sesión",
    loading: "Cargando...",
    draft: "Borrador",
    publishedStatus: "Publicado",
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
  const t = translations[language];

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
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
