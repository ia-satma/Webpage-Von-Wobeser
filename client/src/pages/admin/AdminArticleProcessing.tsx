import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminAuth, adminApiRequest } from "@/lib/adminAuth";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PipelineProgressModal } from "@/components/PipelineProgressModal";
import { 
  ArrowLeft,
  Cog,
  RefreshCw,
  Play,
  FileText,
  Globe,
  Loader2,
  CheckCircle2,
  Languages
} from "lucide-react";
import type { News, NewsTranslation } from "@shared/schema";

const translations = {
  en: {
    title: "Article Processing",
    back: "Back to Dashboard",
    totalArticles: "Total Articles",
    withTranslations: "With Translations",
    processingStatus: "Processing Status",
    processAll: "Process All Articles",
    processing: "Processing...",
    refresh: "Refresh Status",
    titleColumn: "Title",
    date: "Date",
    translationsCount: "Translations",
    actions: "Actions",
    noArticles: "No articles found",
    process: "Process",
    languages: "languages",
    processSuccess: "Article processing started",
    processAllSuccess: "Batch processing started",
    processError: "Failed to start processing",
    loading: "Loading...",
    ready: "Ready",
    complete: "Complete",
  },
  es: {
    title: "Procesamiento de Artículos",
    back: "Volver al Dashboard",
    totalArticles: "Total de Artículos",
    withTranslations: "Con Traducciones",
    processingStatus: "Estado de Procesamiento",
    processAll: "Procesar Todos",
    processing: "Procesando...",
    refresh: "Actualizar Estado",
    titleColumn: "Título",
    date: "Fecha",
    translationsCount: "Traducciones",
    actions: "Acciones",
    noArticles: "No se encontraron artículos",
    process: "Procesar",
    languages: "idiomas",
    processSuccess: "Procesamiento de artículo iniciado",
    processAllSuccess: "Procesamiento por lotes iniciado",
    processError: "Error al iniciar el procesamiento",
    loading: "Cargando...",
    ready: "Listo",
    complete: "Completo",
  },
  de: {
    title: "Artikelverarbeitung",
    back: "Zurück zum Dashboard",
    totalArticles: "Gesamte Artikel",
    withTranslations: "Mit Übersetzungen",
    processingStatus: "Verarbeitungsstatus",
    processAll: "Alle verarbeiten",
    processing: "Wird verarbeitet...",
    refresh: "Status aktualisieren",
    titleColumn: "Titel",
    date: "Datum",
    translationsCount: "Übersetzungen",
    actions: "Aktionen",
    noArticles: "Keine Artikel gefunden",
    process: "Verarbeiten",
    languages: "Sprachen",
    processSuccess: "Artikelverarbeitung gestartet",
    processAllSuccess: "Stapelverarbeitung gestartet",
    processError: "Verarbeitung konnte nicht gestartet werden",
    loading: "Wird geladen...",
    ready: "Bereit",
    complete: "Fertig",
  },
  zh: {
    title: "文章处理",
    back: "返回仪表板",
    totalArticles: "文章总数",
    withTranslations: "已翻译",
    processingStatus: "处理状态",
    processAll: "处理所有文章",
    processing: "处理中...",
    refresh: "刷新状态",
    titleColumn: "标题",
    date: "日期",
    translationsCount: "翻译",
    actions: "操作",
    noArticles: "未找到文章",
    process: "处理",
    languages: "种语言",
    processSuccess: "文章处理已开始",
    processAllSuccess: "批量处理已开始",
    processError: "无法开始处理",
    loading: "加载中...",
    ready: "就绪",
    complete: "完成",
  },
  ko: {
    title: "기사 처리",
    back: "대시보드로 돌아가기",
    totalArticles: "전체 기사",
    withTranslations: "번역된 기사",
    processingStatus: "처리 상태",
    processAll: "모두 처리",
    processing: "처리 중...",
    refresh: "상태 새로고침",
    titleColumn: "제목",
    date: "날짜",
    translationsCount: "번역",
    actions: "작업",
    noArticles: "기사를 찾을 수 없습니다",
    process: "처리",
    languages: "개 언어",
    processSuccess: "기사 처리가 시작되었습니다",
    processAllSuccess: "일괄 처리가 시작되었습니다",
    processError: "처리를 시작할 수 없습니다",
    loading: "로딩 중...",
    ready: "준비됨",
    complete: "완료",
  },
  ja: {
    title: "記事処理",
    back: "ダッシュボードに戻る",
    totalArticles: "記事総数",
    withTranslations: "翻訳あり",
    processingStatus: "処理状況",
    processAll: "すべて処理",
    processing: "処理中...",
    refresh: "状態を更新",
    titleColumn: "タイトル",
    date: "日付",
    translationsCount: "翻訳",
    actions: "アクション",
    noArticles: "記事が見つかりません",
    process: "処理",
    languages: "言語",
    processSuccess: "記事の処理が開始されました",
    processAllSuccess: "バッチ処理が開始されました",
    processError: "処理を開始できませんでした",
    loading: "読み込み中...",
    ready: "準備完了",
    complete: "完了",
  },
  ar: {
    title: "معالجة المقالات",
    back: "العودة إلى لوحة التحكم",
    totalArticles: "إجمالي المقالات",
    withTranslations: "مع الترجمات",
    processingStatus: "حالة المعالجة",
    processAll: "معالجة الكل",
    processing: "جاري المعالجة...",
    refresh: "تحديث الحالة",
    titleColumn: "العنوان",
    date: "التاريخ",
    translationsCount: "الترجمات",
    actions: "الإجراءات",
    noArticles: "لم يتم العثور على مقالات",
    process: "معالجة",
    languages: "لغات",
    processSuccess: "بدأت معالجة المقالة",
    processAllSuccess: "بدأت المعالجة الدفعية",
    processError: "فشل بدء المعالجة",
    loading: "جاري التحميل...",
    ready: "جاهز",
    complete: "مكتمل",
  },
  ru: {
    title: "Обработка статей",
    back: "Вернуться к панели",
    totalArticles: "Всего статей",
    withTranslations: "С переводами",
    processingStatus: "Статус обработки",
    processAll: "Обработать все",
    processing: "Обработка...",
    refresh: "Обновить статус",
    titleColumn: "Заголовок",
    date: "Дата",
    translationsCount: "Переводы",
    actions: "Действия",
    noArticles: "Статьи не найдены",
    process: "Обработать",
    languages: "языков",
    processSuccess: "Обработка статьи начата",
    processAllSuccess: "Пакетная обработка начата",
    processError: "Не удалось начать обработку",
    loading: "Загрузка...",
    ready: "Готово",
    complete: "Завершено",
  },
  fr: {
    title: "Traitement des articles",
    back: "Retour au tableau de bord",
    totalArticles: "Total des articles",
    withTranslations: "Avec traductions",
    processingStatus: "État du traitement",
    processAll: "Traiter tout",
    processing: "Traitement...",
    refresh: "Actualiser",
    titleColumn: "Titre",
    date: "Date",
    translationsCount: "Traductions",
    actions: "Actions",
    noArticles: "Aucun article trouvé",
    process: "Traiter",
    languages: "langues",
    processSuccess: "Traitement de l'article démarré",
    processAllSuccess: "Traitement par lots démarré",
    processError: "Échec du démarrage du traitement",
    loading: "Chargement...",
    ready: "Prêt",
    complete: "Terminé",
  },
  it: {
    title: "Elaborazione articoli",
    back: "Torna alla dashboard",
    totalArticles: "Totale articoli",
    withTranslations: "Con traduzioni",
    processingStatus: "Stato elaborazione",
    processAll: "Elabora tutti",
    processing: "Elaborazione...",
    refresh: "Aggiorna stato",
    titleColumn: "Titolo",
    date: "Data",
    translationsCount: "Traduzioni",
    actions: "Azioni",
    noArticles: "Nessun articolo trovato",
    process: "Elabora",
    languages: "lingue",
    processSuccess: "Elaborazione articolo avviata",
    processAllSuccess: "Elaborazione batch avviata",
    processError: "Impossibile avviare l'elaborazione",
    loading: "Caricamento...",
    ready: "Pronto",
    complete: "Completato",
  },
};

interface NewsStats {
  total: number;
  published: number;
  unpublished: number;
}

interface ArticleWithTranslations extends News {
  translationCount: number;
}

export default function AdminArticleProcessing() {
  const { language } = useLanguage();
  const { isAuthenticated, isLoading: authLoading, requireAuth } = useAdminAuth();
  const { toast } = useToast();
  const t = translations[language as keyof typeof translations] || translations.en;

  const [processingArticleId, setProcessingArticleId] = useState<string | null>(null);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [progressArticleTitle, setProgressArticleTitle] = useState<string>("");

  useEffect(() => {
    if (!authLoading) {
      requireAuth();
    }
  }, [authLoading, requireAuth]);

  const statsQuery = useQuery<NewsStats>({
    queryKey: ["/api/admin/news/stats"],
    queryFn: async () => {
      const res = await adminApiRequest("GET", "/api/admin/news/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const newsQuery = useQuery<News[]>({
    queryKey: ["/api/news"],
    enabled: isAuthenticated,
  });

  const translationCountsQuery = useQuery<Record<string, number>>({
    queryKey: ["/api/admin/news/translation-counts"],
    queryFn: async () => {
      const res = await adminApiRequest("GET", "/api/admin/news/translation-counts");
      if (!res.ok) throw new Error("Failed to fetch translation counts");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const processAllMutation = useMutation({
    mutationFn: async () => {
      const res = await adminApiRequest("POST", "/api/agents/pipeline/process-all", {
        stages: ["formatter", "seo_optimizer", "polyglot_translator"]
      });
      if (!res.ok) throw new Error("Failed to process articles");
      return res.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: t.processAllSuccess,
        description: `${data.successful}/${data.total} articles processed successfully`
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/news/translation-counts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
    },
    onError: () => {
      toast({ title: t.processError, variant: "destructive" });
    },
  });

  const processArticleMutation = useMutation({
    mutationFn: async ({ articleId, title }: { articleId: string; title: string }) => {
      setProcessingArticleId(articleId);
      setProgressArticleTitle(title);
      setProgressModalOpen(true);
      const res = await adminApiRequest("POST", `/api/agents/pipeline/${articleId}`, {
        stages: ["formatter", "seo_optimizer", "polyglot_translator"]
      });
      if (!res.ok) throw new Error("Failed to process article");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t.processSuccess });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/news/translation-counts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      setProcessingArticleId(null);
    },
    onError: () => {
      toast({ title: t.processError, variant: "destructive" });
      setProcessingArticleId(null);
      setProgressModalOpen(false);
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/news/stats"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/news/translation-counts"] });
    queryClient.invalidateQueries({ queryKey: ["/api/news"] });
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString(language === "es" ? "es-MX" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTranslationBadge = (count: number) => {
    if (count === 0) {
      return <Badge variant="outline">0 {t.languages}</Badge>;
    }
    if (count >= 9) {
      return <Badge variant="default" className="bg-green-600"><CheckCircle2 className="mr-1 h-3 w-3" />{count} {t.languages}</Badge>;
    }
    return <Badge variant="secondary">{count} {t.languages}</Badge>;
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

  const news = newsQuery.data || [];
  const translationCounts = translationCountsQuery.data || {};
  const stats = statsQuery.data || { total: 0, published: 0, unpublished: 0 };
  
  const articlesWithTranslations = Object.values(translationCounts).filter(c => c > 0).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="sm" data-testid="button-back">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t.back}
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Cog className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-semibold" data-testid="text-page-title">
                  {t.title}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={newsQuery.isLoading || translationCountsQuery.isLoading}
                data-testid="button-refresh"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {t.refresh}
              </Button>
              <Button
                onClick={() => processAllMutation.mutate()}
                disabled={processAllMutation.isPending}
                data-testid="button-process-all"
              >
                {processAllMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.processing}
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    {t.processAll}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.totalArticles}</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsQuery.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold" data-testid="text-total-articles">
                  {stats.total}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.withTranslations}</CardTitle>
              <Languages className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {translationCountsQuery.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold" data-testid="text-with-translations">
                  {articlesWithTranslations}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.processingStatus}</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-processing-status">
                {processAllMutation.isPending ? t.processing : t.ready}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {newsQuery.isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : news.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="text-no-articles">
                {t.noArticles}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.titleColumn}</TableHead>
                    <TableHead>{t.date}</TableHead>
                    <TableHead>{t.translationsCount}</TableHead>
                    <TableHead className="text-right">{t.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {news.map((article) => (
                    <TableRow key={article.id} data-testid={`row-article-${article.id}`}>
                      <TableCell className="font-medium max-w-md truncate" data-testid={`text-title-${article.id}`}>
                        {language === "es" ? article.titleEs : article.title}
                      </TableCell>
                      <TableCell data-testid={`text-date-${article.id}`}>
                        {formatDate(article.date)}
                      </TableCell>
                      <TableCell data-testid={`badge-translations-${article.id}`}>
                        {getTranslationBadge(translationCounts[article.id] || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => processArticleMutation.mutate({ 
                            articleId: article.id, 
                            title: (language === "es" ? article.titleEs : article.title) || "Article" 
                          })}
                          disabled={processingArticleId === article.id || processAllMutation.isPending}
                          data-testid={`button-process-${article.id}`}
                        >
                          {processingArticleId === article.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {t.processing}
                            </>
                          ) : (
                            <>
                              <Play className="mr-2 h-4 w-4" />
                              {t.process}
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      <PipelineProgressModal
        open={progressModalOpen}
        onOpenChange={setProgressModalOpen}
        articleId={processingArticleId}
        articleTitle={progressArticleTitle}
      />
    </div>
  );
}
