import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Calendar, User, Tag, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminAuth, adminApiRequest } from "@/lib/adminAuth";
import { queryClient } from "@/lib/queryClient";
import { CouncilSafetyCard } from "@/components/admin/CouncilSafetyCard";
import type { News } from "@shared/schema";

const translations = {
  en: {
    title: "Article Review",
    back: "Back to News",
    loading: "Loading article...",
    notFound: "Article not found",
    articleDetails: "Article Details",
    content: "Content",
    publishedOn: "Published on",
    author: "Author",
    category: "Category",
    status: "Processing Status",
    validateSuccess: "Article validated and published successfully",
    validateError: "Failed to validate article",
    rerunCouncil: "Re-run Council Review",
    rerunning: "Running review...",
    rerunSuccess: "Council review completed",
    rerunError: "Failed to run council review",
    pending: "Pending",
    processing: "Processing",
    ready: "Ready",
    readyForApproval: "Ready for Approval",
    failed: "Failed",
    partialSuccess: "Partial Success",
  },
  es: {
    title: "Revisión de Artículo",
    back: "Volver a Noticias",
    loading: "Cargando artículo...",
    notFound: "Artículo no encontrado",
    articleDetails: "Detalles del Artículo",
    content: "Contenido",
    publishedOn: "Publicado el",
    author: "Autor",
    category: "Categoría",
    status: "Estado de Procesamiento",
    validateSuccess: "Artículo validado y publicado exitosamente",
    validateError: "Error al validar el artículo",
    rerunCouncil: "Re-ejecutar Revisión del Consejo",
    rerunning: "Ejecutando revisión...",
    rerunSuccess: "Revisión del consejo completada",
    rerunError: "Error al ejecutar la revisión del consejo",
    pending: "Pendiente",
    processing: "Procesando",
    ready: "Listo",
    readyForApproval: "Listo para Aprobación",
    failed: "Fallido",
    partialSuccess: "Éxito Parcial",
  },
  de: {
    title: "Artikelüberprüfung",
    back: "Zurück zu Nachrichten",
    loading: "Artikel wird geladen...",
    notFound: "Artikel nicht gefunden",
    articleDetails: "Artikeldetails",
    content: "Inhalt",
    publishedOn: "Veröffentlicht am",
    author: "Autor",
    category: "Kategorie",
    status: "Verarbeitungsstatus",
    validateSuccess: "Artikel erfolgreich validiert und veröffentlicht",
    validateError: "Artikel konnte nicht validiert werden",
    rerunCouncil: "Ratsprüfung erneut ausführen",
    rerunning: "Prüfung läuft...",
    rerunSuccess: "Ratsprüfung abgeschlossen",
    rerunError: "Ratsprüfung fehlgeschlagen",
    pending: "Ausstehend",
    processing: "Verarbeitung",
    ready: "Bereit",
    readyForApproval: "Bereit zur Genehmigung",
    failed: "Fehlgeschlagen",
    partialSuccess: "Teilweiser Erfolg",
  },
  zh: {
    title: "文章审核",
    back: "返回新闻",
    loading: "加载文章中...",
    notFound: "未找到文章",
    articleDetails: "文章详情",
    content: "内容",
    publishedOn: "发布于",
    author: "作者",
    category: "类别",
    status: "处理状态",
    validateSuccess: "文章验证并发布成功",
    validateError: "验证文章失败",
    rerunCouncil: "重新运行委员会审核",
    rerunning: "正在审核...",
    rerunSuccess: "委员会审核完成",
    rerunError: "委员会审核失败",
    pending: "待处理",
    processing: "处理中",
    ready: "就绪",
    readyForApproval: "待批准",
    failed: "失败",
    partialSuccess: "部分成功",
  },
  ko: {
    title: "기사 검토",
    back: "뉴스로 돌아가기",
    loading: "기사 로딩 중...",
    notFound: "기사를 찾을 수 없음",
    articleDetails: "기사 세부정보",
    content: "내용",
    publishedOn: "게시일",
    author: "작성자",
    category: "카테고리",
    status: "처리 상태",
    validateSuccess: "기사가 검증되어 게시되었습니다",
    validateError: "기사 검증 실패",
    rerunCouncil: "위원회 검토 재실행",
    rerunning: "검토 중...",
    rerunSuccess: "위원회 검토 완료",
    rerunError: "위원회 검토 실패",
    pending: "대기 중",
    processing: "처리 중",
    ready: "준비됨",
    readyForApproval: "승인 대기",
    failed: "실패",
    partialSuccess: "부분 성공",
  },
  ja: {
    title: "記事レビュー",
    back: "ニュースに戻る",
    loading: "記事を読み込み中...",
    notFound: "記事が見つかりません",
    articleDetails: "記事の詳細",
    content: "コンテンツ",
    publishedOn: "公開日",
    author: "著者",
    category: "カテゴリー",
    status: "処理ステータス",
    validateSuccess: "記事が検証され、公開されました",
    validateError: "記事の検証に失敗しました",
    rerunCouncil: "評議会レビューを再実行",
    rerunning: "レビュー中...",
    rerunSuccess: "評議会レビューが完了しました",
    rerunError: "評議会レビューに失敗しました",
    pending: "保留中",
    processing: "処理中",
    ready: "準備完了",
    readyForApproval: "承認待ち",
    failed: "失敗",
    partialSuccess: "部分的成功",
  },
  ar: {
    title: "مراجعة المقال",
    back: "العودة إلى الأخبار",
    loading: "جاري تحميل المقال...",
    notFound: "المقال غير موجود",
    articleDetails: "تفاصيل المقال",
    content: "المحتوى",
    publishedOn: "نُشر في",
    author: "الكاتب",
    category: "الفئة",
    status: "حالة المعالجة",
    validateSuccess: "تم التحقق من المقال ونشره بنجاح",
    validateError: "فشل التحقق من المقال",
    rerunCouncil: "إعادة تشغيل مراجعة المجلس",
    rerunning: "جاري المراجعة...",
    rerunSuccess: "اكتملت مراجعة المجلس",
    rerunError: "فشلت مراجعة المجلس",
    pending: "معلق",
    processing: "قيد المعالجة",
    ready: "جاهز",
    readyForApproval: "جاهز للموافقة",
    failed: "فشل",
    partialSuccess: "نجاح جزئي",
  },
  ru: {
    title: "Рецензия статьи",
    back: "Назад к новостям",
    loading: "Загрузка статьи...",
    notFound: "Статья не найдена",
    articleDetails: "Детали статьи",
    content: "Содержание",
    publishedOn: "Опубликовано",
    author: "Автор",
    category: "Категория",
    status: "Статус обработки",
    validateSuccess: "Статья подтверждена и опубликована",
    validateError: "Ошибка при подтверждении статьи",
    rerunCouncil: "Повторить проверку совета",
    rerunning: "Выполняется проверка...",
    rerunSuccess: "Проверка совета завершена",
    rerunError: "Ошибка проверки совета",
    pending: "Ожидание",
    processing: "Обработка",
    ready: "Готово",
    readyForApproval: "Готово к утверждению",
    failed: "Ошибка",
    partialSuccess: "Частичный успех",
  },
  fr: {
    title: "Révision de l'article",
    back: "Retour aux actualités",
    loading: "Chargement de l'article...",
    notFound: "Article non trouvé",
    articleDetails: "Détails de l'article",
    content: "Contenu",
    publishedOn: "Publié le",
    author: "Auteur",
    category: "Catégorie",
    status: "Statut de traitement",
    validateSuccess: "Article validé et publié avec succès",
    validateError: "Échec de la validation de l'article",
    rerunCouncil: "Relancer l'examen du conseil",
    rerunning: "Examen en cours...",
    rerunSuccess: "Examen du conseil terminé",
    rerunError: "Échec de l'examen du conseil",
    pending: "En attente",
    processing: "Traitement",
    ready: "Prêt",
    readyForApproval: "Prêt pour approbation",
    failed: "Échoué",
    partialSuccess: "Succès partiel",
  },
  it: {
    title: "Revisione articolo",
    back: "Torna alle notizie",
    loading: "Caricamento articolo...",
    notFound: "Articolo non trovato",
    articleDetails: "Dettagli articolo",
    content: "Contenuto",
    publishedOn: "Pubblicato il",
    author: "Autore",
    category: "Categoria",
    status: "Stato elaborazione",
    validateSuccess: "Articolo convalidato e pubblicato con successo",
    validateError: "Convalida articolo fallita",
    rerunCouncil: "Riesegui revisione del consiglio",
    rerunning: "Revisione in corso...",
    rerunSuccess: "Revisione del consiglio completata",
    rerunError: "Revisione del consiglio fallita",
    pending: "In sospeso",
    processing: "Elaborazione",
    ready: "Pronto",
    readyForApproval: "Pronto per approvazione",
    failed: "Fallito",
    partialSuccess: "Successo parziale",
  },
};

interface AgentVote {
  agentName: string;
  role: string;
  score: number;
  decision: 'approve' | 'reject' | 'abstain' | 'request_revision';
  reasoning: string;
}

type ArticleWithVerdict = Omit<News, 'councilVerdict'> & {
  councilVerdict: {
    overallStatus: 'approved' | 'rejected' | 'pending_revision' | 'escalated' | 'deadlocked';
    riskFlag: 'none' | 'low' | 'medium' | 'high' | 'critical';
    consolidatedFeedback: string;
    agentVotes?: AgentVote[];
    averageScore?: number;
  } | null;
};

export default function AdminArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const { toast } = useToast();
  const { isAuthenticated } = useAdminAuth();
  const t = translations[language as keyof typeof translations] || translations.en;

  const { data: article, isLoading, error, refetch } = useQuery<ArticleWithVerdict>({
    queryKey: ['/api/news', id],
    enabled: !!id && isAuthenticated,
  });

  const validateMutation = useMutation({
    mutationFn: async () => {
      const response = await adminApiRequest('POST', `/api/news/${id}/validate`);
      return response;
    },
    onSuccess: () => {
      toast({ title: t.validateSuccess });
      queryClient.invalidateQueries({ queryKey: ['/api/news', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/news'] });
    },
    onError: () => {
      toast({ title: t.validateError, variant: 'destructive' });
    },
  });

  const rerunCouncilMutation = useMutation({
    mutationFn: async () => {
      const response = await adminApiRequest('POST', `/api/news/${id}/council-review`);
      return response;
    },
    onSuccess: () => {
      toast({ title: t.rerunSuccess });
      refetch();
    },
    onError: () => {
      toast({ title: t.rerunError, variant: 'destructive' });
    },
  });

  const getStatusLabel = (status: string | null | undefined) => {
    switch (status) {
      case 'pending': return t.pending;
      case 'processing': return t.processing;
      case 'ready': return t.ready;
      case 'ready_for_approval': return t.readyForApproval;
      case 'failed': return t.failed;
      case 'partial_success': return t.partialSuccess;
      default: return status || t.pending;
    }
  };

  const getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'ready_for_approval': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'processing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <Link href="/admin/news">
          <Button variant="ghost" className="mb-4" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.back}
          </Button>
        </Link>
        <Card className="border-destructive">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
            <p className="text-destructive">{t.notFound}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6" data-testid="admin-article-detail">
      <div className="flex items-center justify-between">
        <Link href="/admin/news">
          <Button variant="ghost" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.back}
          </Button>
        </Link>
        <Button 
          variant="outline" 
          onClick={() => rerunCouncilMutation.mutate()}
          disabled={rerunCouncilMutation.isPending}
          data-testid="button-rerun-council"
        >
          {rerunCouncilMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          {rerunCouncilMutation.isPending ? t.rerunning : t.rerunCouncil}
        </Button>
      </div>

      <h1 className="text-2xl font-bold text-foreground" data-testid="text-article-title">
        {article.title}
      </h1>

      <CouncilSafetyCard 
        verdict={article.councilVerdict || null}
        onValidate={() => validateMutation.mutate()}
        isValidating={validateMutation.isPending}
        isAdmin={isAuthenticated}
      />

      <Card data-testid="card-article-details">
        <CardHeader>
          <CardTitle>{t.articleDetails}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            {article.date && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{t.publishedOn}: {format(new Date(article.date), 'PPP')}</span>
              </div>
            )}
            {article.category && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Tag className="w-4 h-4" />
                <span>{t.category}: {article.category}</span>
              </div>
            )}
            <Badge className={getStatusColor(article.processingStatus)} data-testid="badge-processing-status">
              {t.status}: {getStatusLabel(article.processingStatus)}
            </Badge>
          </div>

          {article.excerpt && (
            <p className="text-muted-foreground italic border-l-4 border-primary/30 pl-4">
              {article.excerpt}
            </p>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-article-content">
        <CardHeader>
          <CardTitle>{t.content}</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content || '' }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
