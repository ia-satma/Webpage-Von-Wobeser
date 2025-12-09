import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminAuth, adminApiRequest } from "@/lib/adminAuth";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Pencil, 
  Trash2, 
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Newspaper
} from "lucide-react";
import type { News } from "@shared/schema";

const translations = {
  en: {
    title: "News Articles",
    back: "Back to Dashboard",
    search: "Search by title...",
    filterCategory: "Filter by category",
    all: "All",
    titleColumn: "Title",
    category: "Category",
    date: "Date",
    status: "Status",
    actions: "Actions",
    noNews: "No news articles found",
    edit: "Edit",
    delete: "Delete",
    view: "View",
    confirmDelete: "Are you sure you want to delete this news article?",
    deleteSuccess: "News article deleted successfully",
    deleteError: "Failed to delete news article",
    page: "Page",
    of: "of",
    loading: "Loading...",
    published: "Published",
    unpublished: "Unpublished",
  },
  es: {
    title: "Artículos de Noticias",
    back: "Volver al Dashboard",
    search: "Buscar por título...",
    filterCategory: "Filtrar por categoría",
    all: "Todos",
    titleColumn: "Título",
    category: "Categoría",
    date: "Fecha",
    status: "Estado",
    actions: "Acciones",
    noNews: "No se encontraron artículos de noticias",
    edit: "Editar",
    delete: "Eliminar",
    view: "Ver",
    confirmDelete: "¿Está seguro que desea eliminar este artículo?",
    deleteSuccess: "Artículo eliminado exitosamente",
    deleteError: "Error al eliminar el artículo",
    page: "Página",
    of: "de",
    loading: "Cargando...",
    published: "Publicado",
    unpublished: "No publicado",
  },
  de: {
    title: "Nachrichtenartikel",
    back: "Zurück zum Dashboard",
    search: "Nach Titel suchen...",
    filterCategory: "Nach Kategorie filtern",
    all: "Alle",
    titleColumn: "Titel",
    category: "Kategorie",
    date: "Datum",
    status: "Status",
    actions: "Aktionen",
    noNews: "Keine Nachrichtenartikel gefunden",
    edit: "Bearbeiten",
    delete: "Löschen",
    view: "Ansehen",
    confirmDelete: "Sind Sie sicher, dass Sie diesen Artikel löschen möchten?",
    deleteSuccess: "Artikel erfolgreich gelöscht",
    deleteError: "Fehler beim Löschen des Artikels",
    page: "Seite",
    of: "von",
    loading: "Wird geladen...",
    published: "Veröffentlicht",
    unpublished: "Unveröffentlicht",
  },
  zh: {
    title: "新闻文章",
    back: "返回仪表板",
    search: "按标题搜索...",
    filterCategory: "按类别筛选",
    all: "全部",
    titleColumn: "标题",
    category: "类别",
    date: "日期",
    status: "状态",
    actions: "操作",
    noNews: "未找到新闻文章",
    edit: "编辑",
    delete: "删除",
    view: "查看",
    confirmDelete: "您确定要删除此新闻文章吗？",
    deleteSuccess: "新闻文章删除成功",
    deleteError: "删除新闻文章失败",
    page: "页",
    of: "/",
    loading: "加载中...",
    published: "已发布",
    unpublished: "未发布",
  },
  ko: {
    title: "뉴스 기사",
    back: "대시보드로 돌아가기",
    search: "제목으로 검색...",
    filterCategory: "카테고리별 필터",
    all: "전체",
    titleColumn: "제목",
    category: "카테고리",
    date: "날짜",
    status: "상태",
    actions: "작업",
    noNews: "뉴스 기사를 찾을 수 없습니다",
    edit: "편집",
    delete: "삭제",
    view: "보기",
    confirmDelete: "이 뉴스 기사를 삭제하시겠습니까?",
    deleteSuccess: "뉴스 기사가 성공적으로 삭제되었습니다",
    deleteError: "뉴스 기사 삭제 실패",
    page: "페이지",
    of: "/",
    loading: "로딩 중...",
    published: "게시됨",
    unpublished: "미게시",
  },
  ja: {
    title: "ニュース記事",
    back: "ダッシュボードに戻る",
    search: "タイトルで検索...",
    filterCategory: "カテゴリでフィルター",
    all: "すべて",
    titleColumn: "タイトル",
    category: "カテゴリ",
    date: "日付",
    status: "ステータス",
    actions: "アクション",
    noNews: "ニュース記事が見つかりません",
    edit: "編集",
    delete: "削除",
    view: "表示",
    confirmDelete: "このニュース記事を削除してもよろしいですか？",
    deleteSuccess: "ニュース記事が正常に削除されました",
    deleteError: "ニュース記事の削除に失敗しました",
    page: "ページ",
    of: "/",
    loading: "読み込み中...",
    published: "公開済み",
    unpublished: "未公開",
  },
  ar: {
    title: "مقالات الأخبار",
    back: "العودة إلى لوحة التحكم",
    search: "البحث بالعنوان...",
    filterCategory: "تصفية حسب الفئة",
    all: "الكل",
    titleColumn: "العنوان",
    category: "الفئة",
    date: "التاريخ",
    status: "الحالة",
    actions: "الإجراءات",
    noNews: "لم يتم العثور على مقالات إخبارية",
    edit: "تعديل",
    delete: "حذف",
    view: "عرض",
    confirmDelete: "هل أنت متأكد أنك تريد حذف هذا المقال؟",
    deleteSuccess: "تم حذف المقال بنجاح",
    deleteError: "فشل في حذف المقال",
    page: "صفحة",
    of: "من",
    loading: "جاري التحميل...",
    published: "منشور",
    unpublished: "غير منشور",
  },
  ru: {
    title: "Новостные статьи",
    back: "Вернуться к панели",
    search: "Поиск по заголовку...",
    filterCategory: "Фильтр по категории",
    all: "Все",
    titleColumn: "Заголовок",
    category: "Категория",
    date: "Дата",
    status: "Статус",
    actions: "Действия",
    noNews: "Новостные статьи не найдены",
    edit: "Редактировать",
    delete: "Удалить",
    view: "Просмотр",
    confirmDelete: "Вы уверены, что хотите удалить эту статью?",
    deleteSuccess: "Статья успешно удалена",
    deleteError: "Не удалось удалить статью",
    page: "Страница",
    of: "из",
    loading: "Загрузка...",
    published: "Опубликовано",
    unpublished: "Не опубликовано",
  },
  fr: {
    title: "Articles d'actualités",
    back: "Retour au tableau de bord",
    search: "Rechercher par titre...",
    filterCategory: "Filtrer par catégorie",
    all: "Tous",
    titleColumn: "Titre",
    category: "Catégorie",
    date: "Date",
    status: "Statut",
    actions: "Actions",
    noNews: "Aucun article d'actualité trouvé",
    edit: "Modifier",
    delete: "Supprimer",
    view: "Voir",
    confirmDelete: "Êtes-vous sûr de vouloir supprimer cet article ?",
    deleteSuccess: "Article supprimé avec succès",
    deleteError: "Échec de la suppression de l'article",
    page: "Page",
    of: "sur",
    loading: "Chargement...",
    published: "Publié",
    unpublished: "Non publié",
  },
  it: {
    title: "Articoli di notizie",
    back: "Torna alla dashboard",
    search: "Cerca per titolo...",
    filterCategory: "Filtra per categoria",
    all: "Tutti",
    titleColumn: "Titolo",
    category: "Categoria",
    date: "Data",
    status: "Stato",
    actions: "Azioni",
    noNews: "Nessun articolo di notizie trovato",
    edit: "Modifica",
    delete: "Elimina",
    view: "Visualizza",
    confirmDelete: "Sei sicuro di voler eliminare questo articolo?",
    deleteSuccess: "Articolo eliminato con successo",
    deleteError: "Impossibile eliminare l'articolo",
    page: "Pagina",
    of: "di",
    loading: "Caricamento...",
    published: "Pubblicato",
    unpublished: "Non pubblicato",
  },
};

interface NewsResponse {
  news: News[];
  total: number;
  page: number;
  totalPages: number;
}

const ITEMS_PER_PAGE = 20;

const categoryOptions = [
  { value: "press", en: "Press", es: "Prensa" },
  { value: "insights", en: "Insights", es: "Insights" },
  { value: "rankings", en: "Rankings", es: "Rankings" },
  { value: "events", en: "Events", es: "Eventos" },
  { value: "alerts", en: "Alerts", es: "Alertas" },
];

export default function AdminNews() {
  const { language } = useLanguage();
  const { isAuthenticated, isLoading: authLoading, requireAuth } = useAdminAuth();
  const { toast } = useToast();
  const t = translations[language as keyof typeof translations] || translations.en;

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!authLoading) {
      requireAuth();
    }
  }, [authLoading, requireAuth]);

  const newsQuery = useQuery<NewsResponse>({
    queryKey: ["/api/admin/news", { search, category: categoryFilter, page, limit: ITEMS_PER_PAGE }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      params.set("page", page.toString());
      params.set("limit", ITEMS_PER_PAGE.toString());
      
      const res = await adminApiRequest("GET", `/api/admin/news?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch news");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: async (newsId: string) => {
      const res = await adminApiRequest("DELETE", `/api/admin/news/${newsId}`);
      if (!res.ok) throw new Error("Failed to delete news");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t.deleteSuccess });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/news"] });
    },
    onError: () => {
      toast({ title: t.deleteError, variant: "destructive" });
    },
  });

  const handleDelete = (newsId: string) => {
    if (window.confirm(t.confirmDelete)) {
      deleteMutation.mutate(newsId);
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

  const getStatusBadge = (published: boolean | null) => {
    if (published) {
      return <Badge variant="default">{t.published}</Badge>;
    }
    return <Badge variant="secondary">{t.unpublished}</Badge>;
  };

  const getCategoryLabel = (category: string | null) => {
    const cat = categoryOptions.find(c => c.value === category);
    if (cat) {
      return language === "es" ? cat.es : cat.en;
    }
    return category || "-";
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

  const data = newsQuery.data || { news: [], total: 0, page: 1, totalPages: 1 };

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
                <Newspaper className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-semibold" data-testid="text-page-title">
                  {t.title}
                </h1>
              </div>
            </div>
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
                value={categoryFilter} 
                onValueChange={(value) => {
                  setCategoryFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-48" data-testid="select-category-filter">
                  <SelectValue placeholder={t.filterCategory} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" data-testid="option-category-all">{t.all}</SelectItem>
                  {categoryOptions.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value} data-testid={`option-category-${cat.value}`}>
                      {language === "es" ? cat.es : cat.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {newsQuery.isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : data.news.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="text-no-news">
                {t.noNews}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.titleColumn}</TableHead>
                      <TableHead>{t.category}</TableHead>
                      <TableHead>{t.date}</TableHead>
                      <TableHead>{t.status}</TableHead>
                      <TableHead className="text-right">{t.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.news.map((newsItem) => (
                      <TableRow key={newsItem.id} data-testid={`row-news-${newsItem.id}`}>
                        <TableCell className="font-medium max-w-xs truncate" data-testid={`text-title-${newsItem.id}`}>
                          {language === "es" ? newsItem.titleEs : newsItem.title}
                        </TableCell>
                        <TableCell data-testid={`text-category-${newsItem.id}`}>
                          {getCategoryLabel(newsItem.category)}
                        </TableCell>
                        <TableCell data-testid={`text-date-${newsItem.id}`}>
                          {formatDate(newsItem.date)}
                        </TableCell>
                        <TableCell data-testid={`badge-status-${newsItem.id}`}>
                          {getStatusBadge(newsItem.published)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {newsItem.published && (
                              <Link href={`/news/${newsItem.slug}`}>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  data-testid={`button-view-${newsItem.id}`}
                                  title={t.view}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(newsItem.id)}
                              disabled={deleteMutation.isPending}
                              data-testid={`button-delete-${newsItem.id}`}
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
