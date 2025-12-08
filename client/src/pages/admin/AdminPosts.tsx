import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminAuth, adminApiRequest } from "@/lib/adminAuth";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  PlusCircle, 
  Search, 
  Pencil, 
  Trash2, 
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  FileText
} from "lucide-react";
import type { BlogPost } from "@shared/schema";

const translations = {
  en: {
    title: "Blog Posts",
    back: "Back to Dashboard",
    newPost: "New Post",
    search: "Search by title...",
    filterStatus: "Filter by status",
    all: "All",
    draft: "Draft",
    published: "Published",
    trash: "Trash",
    titleColumn: "Title",
    author: "Author",
    date: "Date",
    status: "Status",
    actions: "Actions",
    noPosts: "No posts found",
    edit: "Edit",
    delete: "Delete",
    view: "View",
    confirmDelete: "Are you sure you want to delete this post?",
    deleteSuccess: "Post deleted successfully",
    deleteError: "Failed to delete post",
    page: "Page",
    of: "of",
    loading: "Loading...",
  },
  es: {
    title: "Posts del Blog",
    back: "Volver al Dashboard",
    newPost: "Nuevo Post",
    search: "Buscar por título...",
    filterStatus: "Filtrar por estado",
    all: "Todos",
    draft: "Borrador",
    published: "Publicado",
    trash: "Papelera",
    titleColumn: "Título",
    author: "Autor",
    date: "Fecha",
    status: "Estado",
    actions: "Acciones",
    noPosts: "No se encontraron posts",
    edit: "Editar",
    delete: "Eliminar",
    view: "Ver",
    confirmDelete: "¿Está seguro que desea eliminar este post?",
    deleteSuccess: "Post eliminado exitosamente",
    deleteError: "Error al eliminar el post",
    page: "Página",
    of: "de",
    loading: "Cargando...",
  },
  de: {
    title: "Blog-Beiträge",
    back: "Zurück zum Dashboard",
    newPost: "Neuer Beitrag",
    search: "Nach Titel suchen...",
    filterStatus: "Nach Status filtern",
    all: "Alle",
    draft: "Entwurf",
    published: "Veröffentlicht",
    trash: "Papierkorb",
    titleColumn: "Titel",
    author: "Autor",
    date: "Datum",
    status: "Status",
    actions: "Aktionen",
    noPosts: "Keine Beiträge gefunden",
    edit: "Bearbeiten",
    delete: "Löschen",
    view: "Ansehen",
    confirmDelete: "Sind Sie sicher, dass Sie diesen Beitrag löschen möchten?",
    deleteSuccess: "Beitrag erfolgreich gelöscht",
    deleteError: "Fehler beim Löschen des Beitrags",
    page: "Seite",
    of: "von",
    loading: "Wird geladen...",
  },
  zh: {
    title: "博客文章",
    back: "返回仪表板",
    newPost: "新建文章",
    search: "按标题搜索...",
    filterStatus: "按状态筛选",
    all: "全部",
    draft: "草稿",
    published: "已发布",
    trash: "回收站",
    titleColumn: "标题",
    author: "作者",
    date: "日期",
    status: "状态",
    actions: "操作",
    noPosts: "未找到文章",
    edit: "编辑",
    delete: "删除",
    view: "查看",
    confirmDelete: "您确定要删除此文章吗？",
    deleteSuccess: "文章删除成功",
    deleteError: "删除文章失败",
    page: "页",
    of: "/",
    loading: "加载中...",
  },
  ko: {
    title: "블로그 게시물",
    back: "대시보드로 돌아가기",
    newPost: "새 게시물",
    search: "제목으로 검색...",
    filterStatus: "상태별 필터",
    all: "전체",
    draft: "임시 저장",
    published: "게시됨",
    trash: "휴지통",
    titleColumn: "제목",
    author: "작성자",
    date: "날짜",
    status: "상태",
    actions: "작업",
    noPosts: "게시물을 찾을 수 없습니다",
    edit: "편집",
    delete: "삭제",
    view: "보기",
    confirmDelete: "이 게시물을 삭제하시겠습니까?",
    deleteSuccess: "게시물이 성공적으로 삭제되었습니다",
    deleteError: "게시물 삭제 실패",
    page: "페이지",
    of: "/",
    loading: "로딩 중...",
  },
  ja: {
    title: "ブログ記事",
    back: "ダッシュボードに戻る",
    newPost: "新しい記事",
    search: "タイトルで検索...",
    filterStatus: "ステータスでフィルター",
    all: "すべて",
    draft: "下書き",
    published: "公開済み",
    trash: "ゴミ箱",
    titleColumn: "タイトル",
    author: "著者",
    date: "日付",
    status: "ステータス",
    actions: "アクション",
    noPosts: "記事が見つかりません",
    edit: "編集",
    delete: "削除",
    view: "表示",
    confirmDelete: "この記事を削除してもよろしいですか？",
    deleteSuccess: "記事が正常に削除されました",
    deleteError: "記事の削除に失敗しました",
    page: "ページ",
    of: "/",
    loading: "読み込み中...",
  },
  ar: {
    title: "مقالات المدونة",
    back: "العودة إلى لوحة التحكم",
    newPost: "مقالة جديدة",
    search: "البحث بالعنوان...",
    filterStatus: "تصفية حسب الحالة",
    all: "الكل",
    draft: "مسودة",
    published: "منشور",
    trash: "المحذوفات",
    titleColumn: "العنوان",
    author: "الكاتب",
    date: "التاريخ",
    status: "الحالة",
    actions: "الإجراءات",
    noPosts: "لم يتم العثور على مقالات",
    edit: "تعديل",
    delete: "حذف",
    view: "عرض",
    confirmDelete: "هل أنت متأكد أنك تريد حذف هذه المقالة؟",
    deleteSuccess: "تم حذف المقالة بنجاح",
    deleteError: "فشل في حذف المقالة",
    page: "صفحة",
    of: "من",
    loading: "جاري التحميل...",
  },
  ru: {
    title: "Записи блога",
    back: "Вернуться к панели",
    newPost: "Новая запись",
    search: "Поиск по заголовку...",
    filterStatus: "Фильтр по статусу",
    all: "Все",
    draft: "Черновик",
    published: "Опубликовано",
    trash: "Корзина",
    titleColumn: "Заголовок",
    author: "Автор",
    date: "Дата",
    status: "Статус",
    actions: "Действия",
    noPosts: "Записи не найдены",
    edit: "Редактировать",
    delete: "Удалить",
    view: "Просмотр",
    confirmDelete: "Вы уверены, что хотите удалить эту запись?",
    deleteSuccess: "Запись успешно удалена",
    deleteError: "Не удалось удалить запись",
    page: "Страница",
    of: "из",
    loading: "Загрузка...",
  },
  fr: {
    title: "Articles du blog",
    back: "Retour au tableau de bord",
    newPost: "Nouvel article",
    search: "Rechercher par titre...",
    filterStatus: "Filtrer par statut",
    all: "Tous",
    draft: "Brouillon",
    published: "Publié",
    trash: "Corbeille",
    titleColumn: "Titre",
    author: "Auteur",
    date: "Date",
    status: "Statut",
    actions: "Actions",
    noPosts: "Aucun article trouvé",
    edit: "Modifier",
    delete: "Supprimer",
    view: "Voir",
    confirmDelete: "Êtes-vous sûr de vouloir supprimer cet article ?",
    deleteSuccess: "Article supprimé avec succès",
    deleteError: "Échec de la suppression de l'article",
    page: "Page",
    of: "sur",
    loading: "Chargement...",
  },
  it: {
    title: "Articoli del blog",
    back: "Torna alla dashboard",
    newPost: "Nuovo articolo",
    search: "Cerca per titolo...",
    filterStatus: "Filtra per stato",
    all: "Tutti",
    draft: "Bozza",
    published: "Pubblicato",
    trash: "Cestino",
    titleColumn: "Titolo",
    author: "Autore",
    date: "Data",
    status: "Stato",
    actions: "Azioni",
    noPosts: "Nessun articolo trovato",
    edit: "Modifica",
    delete: "Elimina",
    view: "Visualizza",
    confirmDelete: "Sei sicuro di voler eliminare questo articolo?",
    deleteSuccess: "Articolo eliminato con successo",
    deleteError: "Impossibile eliminare l'articolo",
    page: "Pagina",
    of: "di",
    loading: "Caricamento...",
  },
};

interface PostsResponse {
  posts: BlogPost[];
  total: number;
  page: number;
  totalPages: number;
}

const ITEMS_PER_PAGE = 20;

export default function AdminPosts() {
  const { language } = useLanguage();
  const { isAuthenticated, isLoading: authLoading, requireAuth } = useAdminAuth();
  const { toast } = useToast();
  const t = translations[language as keyof typeof translations] || translations.en;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!authLoading) {
      requireAuth();
    }
  }, [authLoading, requireAuth]);

  const postsQuery = useQuery<PostsResponse>({
    queryKey: ["/api/admin/posts", { search, status: statusFilter, page, limit: ITEMS_PER_PAGE }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("page", page.toString());
      params.set("limit", ITEMS_PER_PAGE.toString());
      
      const res = await adminApiRequest("GET", `/api/admin/posts?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch posts");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await adminApiRequest("DELETE", `/api/admin/posts/${postId}`);
      if (!res.ok) throw new Error("Failed to delete post");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t.deleteSuccess });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
    },
    onError: () => {
      toast({ title: t.deleteError, variant: "destructive" });
    },
  });

  const handleDelete = (postId: string) => {
    if (window.confirm(t.confirmDelete)) {
      deleteMutation.mutate(postId);
    }
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString(language === "es" ? "es-MX" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      draft: { variant: "secondary", label: t.draft },
      published: { variant: "default", label: t.published },
      trash: { variant: "destructive", label: t.trash },
    };
    const config = statusMap[status] || statusMap.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

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

  const data = postsQuery.data || { posts: [], total: 0, page: 1, totalPages: 1 };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
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
                <FileText className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-semibold" data-testid="text-page-title">
                  {t.title}
                </h1>
              </div>
            </div>
            <Link href="/admin/posts/new">
              <Button data-testid="button-new-post">
                <PlusCircle className="mr-2 h-4 w-4" />
                {t.newPost}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.search}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
              <Select 
                value={statusFilter} 
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
                  <SelectValue placeholder={t.filterStatus} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" data-testid="option-status-all">{t.all}</SelectItem>
                  <SelectItem value="draft" data-testid="option-status-draft">{t.draft}</SelectItem>
                  <SelectItem value="published" data-testid="option-status-published">{t.published}</SelectItem>
                  <SelectItem value="trash" data-testid="option-status-trash">{t.trash}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {postsQuery.isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : data.posts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="text-no-posts">
                {t.noPosts}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.titleColumn}</TableHead>
                      <TableHead>{t.date}</TableHead>
                      <TableHead>{t.status}</TableHead>
                      <TableHead className="text-right">{t.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.posts.map((post) => (
                      <TableRow key={post.id} data-testid={`row-post-${post.id}`}>
                        <TableCell className="font-medium" data-testid={`text-title-${post.id}`}>
                          {language === "es" ? post.titleEs : post.title}
                        </TableCell>
                        <TableCell data-testid={`text-date-${post.id}`}>
                          {formatDate(post.createdAt)}
                        </TableCell>
                        <TableCell data-testid={`badge-status-${post.id}`}>
                          {getStatusBadge(post.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {post.status === "published" && (
                              <Link href={`/news/${post.slug}`}>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  data-testid={`button-view-${post.id}`}
                                  title={t.view}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                            )}
                            <Link href={`/admin/posts/${post.id}/edit`}>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                data-testid={`button-edit-${post.id}`}
                                title={t.edit}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(post.id)}
                              disabled={deleteMutation.isPending}
                              data-testid={`button-delete-${post.id}`}
                              title={t.delete}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {data.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="text-sm text-muted-foreground" data-testid="text-pagination-info">
                      {t.page} {data.page} {t.of} {data.totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page <= 1}
                        data-testid="button-prev-page"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page >= data.totalPages}
                        data-testid="button-next-page"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
