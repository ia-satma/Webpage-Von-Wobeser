import { useEffect, useState, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminAuth, adminApiRequest } from "@/lib/adminAuth";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { PipelineProgressModal } from "@/components/PipelineProgressModal";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPageHelp } from "@/components/admin/AdminPageHelp";
import {
  Cog,
  RefreshCw,
  Play,
  FileText,
  Globe,
  Loader2,
  CheckCircle2,
  Languages,
  ImageIcon,
  AlertCircle,
  StopCircle,
  Wrench,
  FilePlus2,
} from "lucide-react";
import type { News, NewsTranslation } from "@shared/schema";

// Concurrency limit for batch processing (max 3 parallel requests)
const BATCH_CONCURRENCY_LIMIT = 3;

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
    processAllSuccess: "Batch processing completed",
    processError: "Failed to start processing",
    loading: "Loading...",
    ready: "Ready",
    complete: "Complete",
    generateImages: "Generate Corporate Images",
    generateImagesDesc: "AI-generated images with VW logo overlay",
    batchProgress: "Processing articles",
    batchOf: "of",
    batchComplete: "completed",
    batchFailed: "failed",
    stopProcessing: "Stop Processing",
    imageWarning: "Image generation failed, article saved without image",
    repairErrors: "Repair Errors",
    repairing: "Repairing...",
    repairSuccess: "Recovery complete",
    repairNoErrors: "No failed articles to repair",
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
    processAllSuccess: "Procesamiento por lotes completado",
    processError: "Error al iniciar el procesamiento",
    loading: "Cargando...",
    ready: "Listo",
    complete: "Completo",
    generateImages: "Generar Imágenes Corporativas",
    generateImagesDesc: "Imágenes con IA y logo VW superpuesto",
    batchProgress: "Procesando artículos",
    batchOf: "de",
    batchComplete: "completados",
    batchFailed: "fallidos",
    stopProcessing: "Detener Procesamiento",
    imageWarning: "Generación de imagen falló, artículo guardado sin imagen",
    repairErrors: "Reparar Errores",
    repairing: "Reparando...",
    repairSuccess: "Recuperación completa",
    repairNoErrors: "No hay artículos fallidos",
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
    processAllSuccess: "Stapelverarbeitung abgeschlossen",
    processError: "Verarbeitung konnte nicht gestartet werden",
    loading: "Wird geladen...",
    ready: "Bereit",
    complete: "Fertig",
    generateImages: "Unternehmensbilder generieren",
    generateImagesDesc: "KI-Bilder mit VW-Logo-Overlay",
    batchProgress: "Artikel werden verarbeitet",
    batchOf: "von",
    batchComplete: "abgeschlossen",
    batchFailed: "fehlgeschlagen",
    stopProcessing: "Verarbeitung stoppen",
    imageWarning: "Bildgenerierung fehlgeschlagen, Artikel ohne Bild gespeichert",
    repairErrors: "Fehler reparieren",
    repairing: "Repariere...",
    repairSuccess: "Wiederherstellung abgeschlossen",
    repairNoErrors: "Keine fehlgeschlagenen Artikel",
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
    processAllSuccess: "批量处理已完成",
    processError: "无法开始处理",
    loading: "加载中...",
    ready: "就绪",
    complete: "完成",
    generateImages: "生成企业图片",
    generateImagesDesc: "带VW标志的AI生成图片",
    batchProgress: "正在处理文章",
    batchOf: "共",
    batchComplete: "已完成",
    batchFailed: "失败",
    stopProcessing: "停止处理",
    imageWarning: "图片生成失败，文章已保存但无图片",
    repairErrors: "修复错误",
    repairing: "修复中...",
    repairSuccess: "恢复完成",
    repairNoErrors: "没有失败的文章",
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
    processAllSuccess: "일괄 처리가 완료되었습니다",
    processError: "처리를 시작할 수 없습니다",
    loading: "로딩 중...",
    ready: "준비됨",
    complete: "완료",
    generateImages: "기업 이미지 생성",
    generateImagesDesc: "VW 로고 오버레이 AI 이미지",
    batchProgress: "기사 처리 중",
    batchOf: "중",
    batchComplete: "완료됨",
    batchFailed: "실패",
    stopProcessing: "처리 중지",
    imageWarning: "이미지 생성 실패, 이미지 없이 기사 저장됨",
    repairErrors: "오류 복구",
    repairing: "복구 중...",
    repairSuccess: "복구 완료",
    repairNoErrors: "실패한 기사 없음",
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
    processAllSuccess: "バッチ処理が完了しました",
    processError: "処理を開始できませんでした",
    loading: "読み込み中...",
    ready: "準備完了",
    complete: "完了",
    generateImages: "企業画像を生成",
    generateImagesDesc: "VWロゴオーバーレイ付きAI画像",
    batchProgress: "記事を処理中",
    batchOf: "中",
    batchComplete: "完了",
    batchFailed: "失敗",
    stopProcessing: "処理を停止",
    imageWarning: "画像生成に失敗、画像なしで記事を保存",
    repairErrors: "エラー修復",
    repairing: "修復中...",
    repairSuccess: "回復完了",
    repairNoErrors: "失敗した記事はありません",
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
    processAllSuccess: "اكتملت المعالجة الدفعية",
    processError: "فشل بدء المعالجة",
    loading: "جاري التحميل...",
    ready: "جاهز",
    complete: "مكتمل",
    generateImages: "إنشاء صور الشركة",
    generateImagesDesc: "صور AI مع شعار VW",
    batchProgress: "معالجة المقالات",
    batchOf: "من",
    batchComplete: "مكتملة",
    batchFailed: "فاشلة",
    stopProcessing: "إيقاف المعالجة",
    imageWarning: "فشل إنشاء الصورة، تم حفظ المقالة بدون صورة",
    repairErrors: "إصلاح الأخطاء",
    repairing: "جاري الإصلاح...",
    repairSuccess: "اكتمل الاسترداد",
    repairNoErrors: "لا توجد مقالات فاشلة",
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
    processAllSuccess: "Пакетная обработка завершена",
    processError: "Не удалось начать обработку",
    loading: "Загрузка...",
    ready: "Готово",
    complete: "Завершено",
    generateImages: "Создать корпоративные изображения",
    generateImagesDesc: "AI-изображения с логотипом VW",
    batchProgress: "Обработка статей",
    batchOf: "из",
    batchComplete: "завершено",
    batchFailed: "неудачно",
    stopProcessing: "Остановить обработку",
    imageWarning: "Генерация изображения не удалась, статья сохранена без изображения",
    repairErrors: "Исправить ошибки",
    repairing: "Исправление...",
    repairSuccess: "Восстановление завершено",
    repairNoErrors: "Нет неудачных статей",
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
    processAllSuccess: "Traitement par lots terminé",
    processError: "Échec du démarrage du traitement",
    loading: "Chargement...",
    ready: "Prêt",
    complete: "Terminé",
    generateImages: "Générer des images corporatives",
    generateImagesDesc: "Images IA avec logo VW",
    batchProgress: "Traitement des articles",
    batchOf: "sur",
    batchComplete: "terminés",
    batchFailed: "échoués",
    stopProcessing: "Arrêter le traitement",
    imageWarning: "Échec de la génération d'image, article enregistré sans image",
    repairErrors: "Réparer les erreurs",
    repairing: "Réparation...",
    repairSuccess: "Récupération terminée",
    repairNoErrors: "Aucun article échoué",
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
    processAllSuccess: "Elaborazione batch completata",
    processError: "Impossibile avviare l'elaborazione",
    loading: "Caricamento...",
    ready: "Pronto",
    complete: "Completato",
    generateImages: "Genera immagini aziendali",
    generateImagesDesc: "Immagini AI con logo VW",
    batchProgress: "Elaborazione articoli",
    batchOf: "di",
    batchComplete: "completati",
    batchFailed: "falliti",
    stopProcessing: "Interrompi elaborazione",
    imageWarning: "Generazione immagine fallita, articolo salvato senza immagine",
    repairErrors: "Ripara errori",
    repairing: "Riparazione...",
    repairSuccess: "Recupero completato",
    repairNoErrors: "Nessun articolo fallito",
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

// Batch processing state interface
interface BatchProgress {
  isProcessing: boolean;
  total: number;
  processed: number;
  successful: number;
  failed: number;
  currentBatch: number;
  totalBatches: number;
  errors: Array<{ articleId: string; title: string; error: string }>;
}

const processingDraftText = {
  es: {
    published: "Publicado",
    draft: "Borrador",
    processDraft: "Procesar borrador",
    createDraft: "Crear borrador",
    creatingDraft: "Creando borrador…",
    draftCreated: "Borrador creado",
    draftCreatedDescription: "La publicación original sigue visible. Procesa la nueva copia cuando estés listo.",
    draftCreateError: "No se pudo crear el borrador de procesamiento",
    noDrafts: "No hay borradores para procesar",
    noDraftsDescription: "Las publicaciones están protegidas. Crea un borrador desde la tabla antes de ejecutar el pipeline.",
    requiresDraft: "Este artículo está publicado. Crea un borrador para procesarlo sin afectar la versión pública.",
  },
  en: {
    published: "Published",
    draft: "Draft",
    processDraft: "Process draft",
    createDraft: "Create draft",
    creatingDraft: "Creating draft…",
    draftCreated: "Draft created",
    draftCreatedDescription: "The published article remains visible. Process the new copy when you are ready.",
    draftCreateError: "Could not create the processing draft",
    noDrafts: "There are no drafts to process",
    noDraftsDescription: "Published articles are protected. Create a draft from the table before running the pipeline.",
    requiresDraft: "This article is published. Create a draft to process it without affecting the public version.",
  },
} as const;

export default function AdminArticleProcessing() {
  const { language } = useLanguage();
  const { isAuthenticated, isLoading: authLoading, requireAuth } = useAdminAuth();
  const { toast } = useToast();
  const t = translations[language as keyof typeof translations] || translations.en;
  const draftText = language === "es" ? processingDraftText.es : processingDraftText.en;

  const [processingArticleId, setProcessingArticleId] = useState<string | null>(null);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [progressArticleTitle, setProgressArticleTitle] = useState<string>("");
  const [pipelineStartError, setPipelineStartError] = useState<string | null>(null);
  const [creatingDraftArticleId, setCreatingDraftArticleId] = useState<string | null>(null);
  const [generateImages, setGenerateImages] = useState(false);
  
  // Batch processing state
  const [batchProgress, setBatchProgress] = useState<BatchProgress>({
    isProcessing: false,
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    currentBatch: 0,
    totalBatches: 0,
    errors: [],
  });
  const cancelBatchRef = useRef(false);
  const [isRecovering, setIsRecovering] = useState(false);

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
    queryKey: ["/api/admin/news", "agent-processing"],
    queryFn: async () => {
      const res = await adminApiRequest("GET", "/api/admin/news?limit=100");
      if (!res.ok) throw new Error("Failed to fetch administrative news");
      const payload = await res.json();
      return Array.isArray(payload.news) ? payload.news : [];
    },
    enabled: isAuthenticated,
  });

  const translationCountsQuery = useQuery<{ counts: Record<string, number> }>({
    queryKey: ["/api/admin/news/translation-counts"],
    queryFn: async () => {
      const res = await adminApiRequest("GET", "/api/admin/news/translation-counts");
      if (!res.ok) throw new Error("Failed to fetch translation counts");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const createProcessingDraftMutation = useMutation({
    mutationFn: async (article: News): Promise<{ draft: News }> => {
      setCreatingDraftArticleId(article.id);
      const res = await adminApiRequest("POST", `/api/admin/news/${article.id}/processing-draft`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.draft) {
        throw new Error(data?.error || draftText.draftCreateError);
      }
      return data;
    },
    onSuccess: () => {
      toast({ title: draftText.draftCreated, description: draftText.draftCreatedDescription });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/news", "agent-processing"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/news/translation-counts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/news/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: draftText.draftCreateError,
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => setCreatingDraftArticleId(null),
  });

  // Process a single article with retry logic and detailed error extraction
  const processSingleArticle = useCallback(async (article: News): Promise<{ success: boolean; error?: string; imageWarning?: boolean }> => {
    try {
      if (article.published !== false) {
        return { success: false, error: draftText.requiresDraft };
      }
      const res = await adminApiRequest("POST", `/api/agents/pipeline/${article.id}`, {
        generateImage: generateImages
      });
      
      if (!res.ok) {
        // Extract specific error message from response
        let errorMessage = "Processing failed";
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorData.message || `HTTP ${res.status}`;
        } catch {
          errorMessage = `HTTP ${res.status}: ${res.statusText}`;
        }
        return { success: false, error: errorMessage };
      }
      
      const result = await res.json();
      if (result.success === false) {
        const error = Array.isArray(result.errors) && result.errors.length
          ? result.errors.join("; ")
          : "One or more processing stages failed";
        return { success: false, error };
      }
      // Check if image generation had a warning (processed but image failed)
      const imageWarning = result.steps?.image?.success === false && result.success === true;
      return { success: true, imageWarning };
    } catch (err: any) {
      // Handle specific error types
      let errorMessage = err.message || "Unknown error";
      if (err.message?.includes("429") || err.message?.includes("rate limit")) {
        errorMessage = "Rate limit exceeded - will retry";
      } else if (err.message?.includes("timeout") || err.message?.includes("ETIMEDOUT")) {
        errorMessage = "Request timeout";
      }
      return { success: false, error: errorMessage };
    }
  }, [draftText.requiresDraft, generateImages]);

  const recoverMutation = useMutation({
    mutationFn: async () => {
      const res = await adminApiRequest("POST", "/api/agents/recover");
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Recovery failed");
      }
      return res.json();
    },
    onMutate: () => {
      setIsRecovering(true);
    },
    onSuccess: (data) => {
      setIsRecovering(false);
      toast({
        title: t.repairSuccess,
        description: `${data.recovered} articles recovered`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/news", "agent-processing"] });
    },
    onError: (error: any) => {
      setIsRecovering(false);
      toast({
        title: t.processError,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Batch processing function with concurrency limit
  const processBatch = useCallback(async (articles: News[]) => {
    cancelBatchRef.current = false;
    const total = articles.length;
    const totalBatches = Math.ceil(total / BATCH_CONCURRENCY_LIMIT);
    const errors: Array<{ articleId: string; title: string; error: string }> = [];
    let successful = 0;
    let failed = 0;
    let processed = 0;
    let imageWarnings = 0;

    setBatchProgress({
      isProcessing: true,
      total,
      processed: 0,
      successful: 0,
      failed: 0,
      currentBatch: 0,
      totalBatches,
      errors: [],
    });

    // Process in batches of BATCH_CONCURRENCY_LIMIT (3)
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      if (cancelBatchRef.current) {
        console.log('[BatchProcessor] Processing cancelled by user');
        break;
      }

      const start = batchIndex * BATCH_CONCURRENCY_LIMIT;
      const end = Math.min(start + BATCH_CONCURRENCY_LIMIT, total);
      const batch = articles.slice(start, end);

      console.log(`[BatchProcessor] Processing batch ${batchIndex + 1}/${totalBatches} (articles ${start + 1}-${end})`);
      
      setBatchProgress(prev => ({
        ...prev,
        currentBatch: batchIndex + 1,
      }));

      // Process batch articles in parallel (max 3 concurrent)
      const batchResults = await Promise.allSettled(
        batch.map(article => processSingleArticle(article))
      );

      // Process batch results
      batchResults.forEach((result, idx) => {
        const article = batch[idx];
        processed++;
        
        if (result.status === 'fulfilled' && result.value.success) {
          successful++;
          if (result.value.imageWarning) {
            imageWarnings++;
          }
        } else {
          failed++;
          const error = result.status === 'fulfilled' 
            ? result.value.error || 'Unknown error'
            : result.reason?.message || 'Promise rejected';
          errors.push({
            articleId: article.id,
            title: article.titleEs || article.title || 'Untitled',
            error,
          });
        }

        setBatchProgress(prev => ({
          ...prev,
          processed,
          successful,
          failed,
          errors: [...errors],
        }));
      });

      // Small delay between batches to avoid overwhelming the server
      if (batchIndex < totalBatches - 1 && !cancelBatchRef.current) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setBatchProgress(prev => ({
      ...prev,
      isProcessing: false,
    }));

    // Show completion toast with error summary
    const wasCancelled = cancelBatchRef.current;
    let description = `${successful}/${processed} ${t.batchComplete}`;
    if (failed > 0) {
      description += `, ${failed} ${t.batchFailed}`;
      const errorSummary = errors.slice(0, 3).map(e => `${e.title}: ${e.error}`).join('; ');
      if (errorSummary) {
        description += ` - ${errorSummary}`;
        if (errors.length > 3) {
          description += `... (+${errors.length - 3} more)`;
        }
      }
    }
    if (imageWarnings > 0) {
      description += ` (${imageWarnings} ${t.imageWarning})`;
    }
    
    toast({
      title: wasCancelled ? t.stopProcessing : t.processAllSuccess,
      description,
      variant: failed > 0 ? "destructive" : "default",
    });

    // Reset cancel flag after completion
    cancelBatchRef.current = false;

    // Invalidate queries to refresh the data
    queryClient.invalidateQueries({ queryKey: ["/api/admin/news/translation-counts"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/news", "agent-processing"] });
  }, [processSingleArticle, t, toast]);

  // Stop batch processing
  const handleStopBatch = useCallback(() => {
    cancelBatchRef.current = true;
    toast({
      title: t.stopProcessing,
      description: `${batchProgress.processed}/${batchProgress.total} ${t.batchComplete}`,
    });
  }, [batchProgress, t, toast]);

  // Start batch processing
  const handleProcessAll = useCallback(() => {
    const articles = newsQuery.data || [];
    if (articles.length === 0) {
      toast({ title: t.noArticles, variant: "destructive" });
      return;
    }
    const drafts = articles.filter((article) => article.published === false);
    if (drafts.length === 0) {
      toast({
        title: draftText.noDrafts,
        description: draftText.noDraftsDescription,
        variant: "destructive",
      });
      return;
    }
    processBatch(drafts);
  }, [draftText.noDrafts, draftText.noDraftsDescription, newsQuery.data, processBatch, t.noArticles, toast]);

  const processArticleMutation = useMutation({
    mutationFn: async ({ articleId, title }: { articleId: string; title: string }) => {
      const article = (newsQuery.data || []).find((item) => item.id === articleId);
      if (!article || article.published !== false) {
        throw new Error(draftText.requiresDraft);
      }
      setProcessingArticleId(articleId);
      setProgressArticleTitle(title);
      setPipelineStartError(null);
      setProgressModalOpen(true);
      const res = await adminApiRequest("POST", `/api/agents/pipeline/${articleId}`, {
        generateImage: generateImages
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errorMessage = data?.code === "PUBLISHED_ARTICLE_REQUIRES_DRAFT"
          ? draftText.requiresDraft
          : (data?.error || data?.message || `Error HTTP ${res.status}`);
        // Este error ocurrió antes de que el pipeline pudiera iniciar. El
        // modal debe reflejarlo como tal, en lugar de conservar un progreso
        // provisional que aparenta estar en curso.
        setPipelineStartError(errorMessage);
        throw new Error(errorMessage);
      }
      if (data?.success === false) {
        const details = Array.isArray(data?.errors) && data.errors.length
          ? data.errors.join("; ")
          : (data?.error || "Una etapa no pudo completar el procesamiento.");
        throw new Error(details);
      }
      return data;
    },
    onSuccess: (data: any) => {
      toast(data?.imageWarning
        ? {
            title: t.imageWarning,
            description: String(data.imageWarning),
            variant: "destructive",
          }
        : { title: t.processSuccess });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/news/translation-counts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/news", "agent-processing"] });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || error?.error || t.processError;
      toast({ 
        title: t.processError, 
        description: errorMessage,
        variant: "destructive" 
      });
      // El modal conserva la etapa fallida y su mensaje para que el administrador pueda
      // identificar qué ocurrió. Se cierra manualmente después de revisar el detalle.
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/news/stats"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/news/translation-counts"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/news", "agent-processing"] });
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
  const translationCounts = translationCountsQuery.data?.counts || {};
  const stats = statsQuery.data || { total: 0, published: 0, unpublished: 0 };
  
  const articlesWithTranslations = Object.values(translationCounts).filter(c => c > 0).length;

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminPageHeader
          title={t.title}
          icon={Cog}
          actions={
            <>
              <div className="flex items-center gap-2 px-3 py-2 rounded-none border bg-muted/50">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <Label htmlFor="generate-images" className="text-xs font-medium cursor-pointer">
                    {t.generateImages}
                  </Label>
                  <span className="text-[10px] text-muted-foreground">{t.generateImagesDesc}</span>
                </div>
                <Switch
                  id="generate-images"
                  checked={generateImages}
                  onCheckedChange={setGenerateImages}
                  data-testid="switch-generate-images"
                />
              </div>
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={newsQuery.isLoading || translationCountsQuery.isLoading}
                data-testid="button-refresh"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {t.refresh}
              </Button>
              {batchProgress.isProcessing ? (
                <Button
                  onClick={handleStopBatch}
                  variant="destructive"
                  data-testid="button-stop-batch"
                >
                  <StopCircle className="mr-2 h-4 w-4" />
                  {t.stopProcessing}
                </Button>
              ) : (
                <Button
                  onClick={handleProcessAll}
                  disabled={batchProgress.isProcessing}
                  data-testid="button-process-all"
                >
                  <Play className="mr-2 h-4 w-4" />
                  {t.processAll}
                </Button>
              )}
            </>
          }
        />
        <AdminPageHelp pageId="article-processing">
          Aquí sigues el proceso automático que analiza y prepara un artículo antes de publicarlo (traducción, clasificación, revisión de calidad).
        </AdminPageHelp>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                {batchProgress.isProcessing ? t.processing : t.ready}
              </div>
              {batchProgress.isProcessing && (
                <div className="mt-2 space-y-1">
                  <Progress value={(batchProgress.processed / batchProgress.total) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {t.batchProgress}: {batchProgress.processed} {t.batchOf} {batchProgress.total}
                    {batchProgress.failed > 0 && (
                      <span className="text-destructive ml-2">({batchProgress.failed} {t.batchFailed})</span>
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recovery Actions Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Auto-Recovery</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                onClick={() => recoverMutation.mutate()}
                disabled={isRecovering || batchProgress.isProcessing}
                data-testid="button-repair-errors"
                className="w-full"
              >
                {isRecovering ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.repairing}
                  </>
                ) : (
                  <>
                    <Wrench className="mr-2 h-4 w-4" />
                    {t.repairErrors}
                  </>
                )}
              </Button>
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
                  {news.map((article) => {
                    const isDraft = article.published === false;
                    const isCreatingDraft = creatingDraftArticleId === article.id;

                    return (
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
                        <div className="flex items-center justify-end gap-2">
                          <Badge variant={isDraft ? "secondary" : "default"}>
                            {isDraft ? draftText.draft : draftText.published}
                          </Badge>
                          {isDraft ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => processArticleMutation.mutate({
                                articleId: article.id,
                                title: (language === "es" ? article.titleEs : article.title) || "Article",
                              })}
                              disabled={processingArticleId === article.id || batchProgress.isProcessing}
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
                                  {draftText.processDraft}
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => createProcessingDraftMutation.mutate(article)}
                              disabled={isCreatingDraft || batchProgress.isProcessing}
                              data-testid={`button-create-processing-draft-${article.id}`}
                            >
                              {isCreatingDraft ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  {draftText.creatingDraft}
                                </>
                              ) : (
                                <>
                                  <FilePlus2 className="mr-2 h-4 w-4" />
                                  {draftText.createDraft}
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      <PipelineProgressModal
        open={progressModalOpen}
        onOpenChange={(open) => {
          setProgressModalOpen(open);
          if (!open) {
            setProcessingArticleId(null);
            setProgressArticleTitle("");
            setPipelineStartError(null);
          }
        }}
        articleId={processingArticleId}
        articleTitle={progressArticleTitle}
        includeImage={generateImages}
        startError={pipelineStartError}
      />
    </div>
  );
}
