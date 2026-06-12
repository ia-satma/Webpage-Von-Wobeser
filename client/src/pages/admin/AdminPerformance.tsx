import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { adminApiRequest } from "@/lib/adminAuth";
import { 
  Activity, 
  Cpu, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  Zap,
  Globe2,
  FileText,
  BarChart3,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";

const translations = {
  en: {
    title: "Agent Performance Dashboard",
    subtitle: "Real-time metrics and analytics for AI agents",
    refresh: "Refresh",
    systemStatus: "System Status",
    operational: "Operational",
    degraded: "Degraded",
    offline: "Offline",
    agentMetrics: "Agent Metrics",
    jobQueue: "Job Queue",
    pending: "Pending",
    processing: "Processing",
    completed: "Completed",
    failed: "Failed",
    totalJobs: "Total Jobs",
    successRate: "Success Rate",
    avgProcessingTime: "Avg. Processing Time",
    translationStats: "Translation Statistics",
    cachedTranslations: "Cached Translations",
    languagesCovered: "Languages Covered",
    articlesTranslated: "Articles Translated",
    contentAnalysis: "Content Analysis",
    articlesAnalyzed: "Articles Analyzed",
    avgQualityScore: "Avg. Quality Score",
    seoOptimizations: "SEO Optimizations",
    lastRun: "Last Run",
    never: "Never",
    hoursAgo: "hours ago",
    minutesAgo: "minutes ago",
    justNow: "Just now",
    agentActivity: "Agent Activity",
    noActivity: "No recent activity",
    noData: "No data",
    loading: "Loading metrics..."
  },
  es: {
    title: "Dashboard de Rendimiento de Agentes",
    subtitle: "Métricas y análisis en tiempo real para agentes IA",
    refresh: "Actualizar",
    systemStatus: "Estado del Sistema",
    operational: "Operacional",
    degraded: "Degradado",
    offline: "Fuera de línea",
    agentMetrics: "Métricas de Agentes",
    jobQueue: "Cola de Trabajos",
    pending: "Pendientes",
    processing: "Procesando",
    completed: "Completados",
    failed: "Fallidos",
    totalJobs: "Total de Trabajos",
    successRate: "Tasa de Éxito",
    avgProcessingTime: "Tiempo Promedio",
    translationStats: "Estadísticas de Traducción",
    cachedTranslations: "Traducciones en Caché",
    languagesCovered: "Idiomas Cubiertos",
    articlesTranslated: "Artículos Traducidos",
    contentAnalysis: "Análisis de Contenido",
    articlesAnalyzed: "Artículos Analizados",
    avgQualityScore: "Puntuación Promedio",
    seoOptimizations: "Optimizaciones SEO",
    lastRun: "Última Ejecución",
    never: "Nunca",
    hoursAgo: "horas atrás",
    minutesAgo: "minutos atrás",
    justNow: "Ahora mismo",
    agentActivity: "Actividad de Agentes",
    noActivity: "Sin actividad reciente",
    noData: "Sin datos",
    loading: "Cargando métricas..."
  },
  de: {
    title: "Agent-Leistungs-Dashboard",
    subtitle: "Echtzeit-Metriken und Analysen für KI-Agenten",
    refresh: "Aktualisieren",
    systemStatus: "Systemstatus",
    operational: "Betriebsbereit",
    degraded: "Eingeschränkt",
    offline: "Offline",
    agentMetrics: "Agenten-Metriken",
    jobQueue: "Auftragswarteschlange",
    pending: "Ausstehend",
    processing: "In Bearbeitung",
    completed: "Abgeschlossen",
    failed: "Fehlgeschlagen",
    totalJobs: "Aufträge Gesamt",
    successRate: "Erfolgsrate",
    avgProcessingTime: "Durchschn. Bearbeitungszeit",
    translationStats: "Übersetzungsstatistiken",
    cachedTranslations: "Zwischengespeicherte Übersetzungen",
    languagesCovered: "Abgedeckte Sprachen",
    articlesTranslated: "Übersetzte Artikel",
    contentAnalysis: "Inhaltsanalyse",
    articlesAnalyzed: "Analysierte Artikel",
    avgQualityScore: "Durchschn. Qualitätswert",
    seoOptimizations: "SEO-Optimierungen",
    lastRun: "Letzter Durchlauf",
    never: "Nie",
    hoursAgo: "Stunden zuvor",
    minutesAgo: "Minuten zuvor",
    justNow: "Gerade eben",
    agentActivity: "Agentenaktivität",
    noActivity: "Keine kürzliche Aktivität",
    noData: "Keine Daten",
    loading: "Lade Metriken..."
  },
  zh: {
    title: "代理性能仪表板",
    subtitle: "AI代理的实时指标和分析",
    refresh: "刷新",
    systemStatus: "系统状态",
    operational: "运行正常",
    degraded: "性能下降",
    offline: "离线",
    agentMetrics: "代理指标",
    jobQueue: "任务队列",
    pending: "待处理",
    processing: "处理中",
    completed: "已完成",
    failed: "失败",
    totalJobs: "任务总数",
    successRate: "成功率",
    avgProcessingTime: "平均处理时间",
    translationStats: "翻译统计",
    cachedTranslations: "缓存翻译",
    languagesCovered: "覆盖语言",
    articlesTranslated: "已翻译文章",
    contentAnalysis: "内容分析",
    articlesAnalyzed: "已分析文章",
    avgQualityScore: "平均质量分数",
    seoOptimizations: "SEO优化",
    lastRun: "上次运行",
    never: "从未",
    hoursAgo: "小时前",
    minutesAgo: "分钟前",
    justNow: "刚刚",
    agentActivity: "代理活动",
    noActivity: "无最近活动",
    noData: "无数据",
    loading: "加载指标中..."
  },
  ko: {
    title: "에이전트 성능 대시보드",
    subtitle: "AI 에이전트를 위한 실시간 지표 및 분석",
    refresh: "새로고침",
    systemStatus: "시스템 상태",
    operational: "정상 작동",
    degraded: "성능 저하",
    offline: "오프라인",
    agentMetrics: "에이전트 지표",
    jobQueue: "작업 대기열",
    pending: "대기 중",
    processing: "처리 중",
    completed: "완료됨",
    failed: "실패",
    totalJobs: "총 작업 수",
    successRate: "성공률",
    avgProcessingTime: "평균 처리 시간",
    translationStats: "번역 통계",
    cachedTranslations: "캐시된 번역",
    languagesCovered: "지원 언어",
    articlesTranslated: "번역된 기사",
    contentAnalysis: "콘텐츠 분석",
    articlesAnalyzed: "분석된 기사",
    avgQualityScore: "평균 품질 점수",
    seoOptimizations: "SEO 최적화",
    lastRun: "마지막 실행",
    never: "없음",
    hoursAgo: "시간 전",
    minutesAgo: "분 전",
    justNow: "방금",
    agentActivity: "에이전트 활동",
    noActivity: "최근 활동 없음",
    noData: "데이터 없음",
    loading: "지표 로딩 중..."
  },
  ja: {
    title: "エージェントパフォーマンスダッシュボード",
    subtitle: "AIエージェントのリアルタイムメトリクスと分析",
    refresh: "更新",
    systemStatus: "システム状態",
    operational: "正常稼働",
    degraded: "性能低下",
    offline: "オフライン",
    agentMetrics: "エージェントメトリクス",
    jobQueue: "ジョブキュー",
    pending: "保留中",
    processing: "処理中",
    completed: "完了",
    failed: "失敗",
    totalJobs: "総ジョブ数",
    successRate: "成功率",
    avgProcessingTime: "平均処理時間",
    translationStats: "翻訳統計",
    cachedTranslations: "キャッシュ済み翻訳",
    languagesCovered: "対応言語数",
    articlesTranslated: "翻訳済み記事",
    contentAnalysis: "コンテンツ分析",
    articlesAnalyzed: "分析済み記事",
    avgQualityScore: "平均品質スコア",
    seoOptimizations: "SEO最適化",
    lastRun: "最終実行",
    never: "なし",
    hoursAgo: "時間前",
    minutesAgo: "分前",
    justNow: "たった今",
    agentActivity: "エージェント活動",
    noActivity: "最近の活動なし",
    noData: "データなし",
    loading: "メトリクスを読み込み中..."
  },
  ar: {
    title: "لوحة أداء الوكلاء",
    subtitle: "مقاييس وتحليلات في الوقت الفعلي لوكلاء الذكاء الاصطناعي",
    refresh: "تحديث",
    systemStatus: "حالة النظام",
    operational: "يعمل",
    degraded: "متدهور",
    offline: "غير متصل",
    agentMetrics: "مقاييس الوكلاء",
    jobQueue: "قائمة المهام",
    pending: "قيد الانتظار",
    processing: "قيد المعالجة",
    completed: "مكتمل",
    failed: "فشل",
    totalJobs: "إجمالي المهام",
    successRate: "معدل النجاح",
    avgProcessingTime: "متوسط وقت المعالجة",
    translationStats: "إحصائيات الترجمة",
    cachedTranslations: "الترجمات المخزنة مؤقتاً",
    languagesCovered: "اللغات المغطاة",
    articlesTranslated: "المقالات المترجمة",
    contentAnalysis: "تحليل المحتوى",
    articlesAnalyzed: "المقالات المحللة",
    avgQualityScore: "متوسط درجة الجودة",
    seoOptimizations: "تحسينات SEO",
    lastRun: "آخر تشغيل",
    never: "أبداً",
    hoursAgo: "ساعات مضت",
    minutesAgo: "دقائق مضت",
    justNow: "الآن",
    agentActivity: "نشاط الوكلاء",
    noActivity: "لا يوجد نشاط حديث",
    noData: "لا توجد بيانات",
    loading: "جاري تحميل المقاييس..."
  },
  ru: {
    title: "Панель производительности агентов",
    subtitle: "Метрики и аналитика ИИ-агентов в реальном времени",
    refresh: "Обновить",
    systemStatus: "Состояние системы",
    operational: "Работает",
    degraded: "Снижена",
    offline: "Не в сети",
    agentMetrics: "Метрики агентов",
    jobQueue: "Очередь заданий",
    pending: "Ожидание",
    processing: "Обработка",
    completed: "Завершено",
    failed: "Ошибка",
    totalJobs: "Всего заданий",
    successRate: "Успешность",
    avgProcessingTime: "Среднее время обработки",
    translationStats: "Статистика переводов",
    cachedTranslations: "Кэшированные переводы",
    languagesCovered: "Языков охвачено",
    articlesTranslated: "Переведено статей",
    contentAnalysis: "Анализ контента",
    articlesAnalyzed: "Проанализировано статей",
    avgQualityScore: "Средний балл качества",
    seoOptimizations: "SEO-оптимизации",
    lastRun: "Последний запуск",
    never: "Никогда",
    hoursAgo: "часов назад",
    minutesAgo: "минут назад",
    justNow: "Только что",
    agentActivity: "Активность агентов",
    noActivity: "Нет недавней активности",
    noData: "Нет данных",
    loading: "Загрузка метрик..."
  },
  fr: {
    title: "Tableau de bord des performances des agents",
    subtitle: "Métriques et analyses en temps réel pour les agents IA",
    refresh: "Actualiser",
    systemStatus: "État du système",
    operational: "Opérationnel",
    degraded: "Dégradé",
    offline: "Hors ligne",
    agentMetrics: "Métriques des agents",
    jobQueue: "File d'attente des tâches",
    pending: "En attente",
    processing: "En cours",
    completed: "Terminé",
    failed: "Échoué",
    totalJobs: "Total des tâches",
    successRate: "Taux de réussite",
    avgProcessingTime: "Temps moyen de traitement",
    translationStats: "Statistiques de traduction",
    cachedTranslations: "Traductions en cache",
    languagesCovered: "Langues couvertes",
    articlesTranslated: "Articles traduits",
    contentAnalysis: "Analyse du contenu",
    articlesAnalyzed: "Articles analysés",
    avgQualityScore: "Score de qualité moyen",
    seoOptimizations: "Optimisations SEO",
    lastRun: "Dernière exécution",
    never: "Jamais",
    hoursAgo: "heures",
    minutesAgo: "minutes",
    justNow: "À l'instant",
    agentActivity: "Activité des agents",
    noActivity: "Aucune activité récente",
    noData: "Aucune donnée",
    loading: "Chargement des métriques..."
  },
  it: {
    title: "Dashboard delle prestazioni degli agenti",
    subtitle: "Metriche e analisi in tempo reale per agenti IA",
    refresh: "Aggiorna",
    systemStatus: "Stato del sistema",
    operational: "Operativo",
    degraded: "Degradato",
    offline: "Offline",
    agentMetrics: "Metriche degli agenti",
    jobQueue: "Coda dei lavori",
    pending: "In attesa",
    processing: "In elaborazione",
    completed: "Completato",
    failed: "Fallito",
    totalJobs: "Lavori totali",
    successRate: "Tasso di successo",
    avgProcessingTime: "Tempo medio di elaborazione",
    translationStats: "Statistiche di traduzione",
    cachedTranslations: "Traduzioni in cache",
    languagesCovered: "Lingue coperte",
    articlesTranslated: "Articoli tradotti",
    contentAnalysis: "Analisi del contenuto",
    articlesAnalyzed: "Articoli analizzati",
    avgQualityScore: "Punteggio qualità medio",
    seoOptimizations: "Ottimizzazioni SEO",
    lastRun: "Ultima esecuzione",
    never: "Mai",
    hoursAgo: "ore fa",
    minutesAgo: "minuti fa",
    justNow: "Proprio ora",
    agentActivity: "Attività degli agenti",
    noActivity: "Nessuna attività recente",
    noData: "Nessun dato",
    loading: "Caricamento metriche..."
  }
};

interface JobStats {
  total: number;
  completed: number;
  failed: number;
  pending: number;
}

interface AgentStatus {
  orchestrator?: {
    isRunning: boolean;
    queueLength: number;
    activeJobs: number;
    registeredAgents: string[];
    jobStatsByAgent?: Record<string, JobStats>;
  };
  database?: {
    recentJobs: number;
    failedJobs: number;
    recentEvents: number;
  };
}

export default function AdminPerformance() {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;

  const { data: agentStatus, isLoading, refetch, isRefetching } = useQuery<AgentStatus>({
    queryKey: ['/api/agents/status'],
    queryFn: async () => {
      const res = await adminApiRequest("GET", "/api/agents/status");
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return res.json();
    },
  });

  // Derive completed jobs from per-agent stats when available; otherwise leave null (no invented numbers).
  const jobStats = agentStatus?.orchestrator?.jobStatsByAgent;
  const completedFromStats = jobStats
    ? Object.values(jobStats).reduce((sum, s) => sum + (s.completed || 0), 0)
    : null;

  // Only metrics that come from the real /api/agents/status response are populated.
  // Metrics with no backing data source are null and rendered as an honest empty state.
  const realMetrics = {
    pending: agentStatus?.orchestrator?.queueLength ?? 0,
    processing: agentStatus?.orchestrator?.activeJobs ?? 0,
    completed: completedFromStats,
    failed: agentStatus?.database?.failedJobs ?? null,
    successRate: null as number | null,
    avgTime: null as string | null,
    cachedTranslations: null as number | null,
    languagesCovered: null as number | null,
    articlesTranslated: null as number | null,
    articlesAnalyzed: null as number | null,
    avgQualityScore: null as number | null,
    seoOptimizations: null as number | null,
  };

  const isOperational = agentStatus?.orchestrator?.isRunning === true;
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl" data-testid="admin-performance-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3" data-testid="text-performance-title">
            <Activity className="w-8 h-8 text-primary" />
            {t.title}
          </h1>
          <p className="text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
        <Button 
          onClick={() => refetch()} 
          disabled={isRefetching}
          variant="outline"
          data-testid="button-refresh-metrics"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
          {t.refresh}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card data-testid="card-system-status">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t.systemStatus}</CardTitle>
                <Cpu className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {isOperational ? (
                    <Badge className="bg-green-600">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {t.operational}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {t.degraded}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {agentStatus?.orchestrator?.registeredAgents?.length ?? 0} agents active
                </p>
              </CardContent>
            </Card>
            
            <Card data-testid="card-queue-status">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t.jobQueue}</CardTitle>
                <Zap className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{realMetrics.pending}</div>
                <p className="text-xs text-muted-foreground">
                  {t.pending} • {realMetrics.processing} {t.processing.toLowerCase()}
                </p>
              </CardContent>
            </Card>
            
            <Card data-testid="card-success-rate">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t.successRate}</CardTitle>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {realMetrics.successRate !== null ? (
                  <>
                    <div className="text-2xl font-bold text-green-600">{realMetrics.successRate}%</div>
                    <Progress value={realMetrics.successRate} className="mt-2" />
                  </>
                ) : (
                  <div className="text-2xl font-bold text-muted-foreground" title={t.noData}>—</div>
                )}
              </CardContent>
            </Card>
            
            <Card data-testid="card-processing-time">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t.avgProcessingTime}</CardTitle>
                <Clock className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {realMetrics.avgTime !== null ? (
                  <>
                    <div className="text-2xl font-bold">{realMetrics.avgTime}</div>
                    <p className="text-xs text-muted-foreground">per job</p>
                  </>
                ) : (
                  <div className="text-2xl font-bold text-muted-foreground" title={t.noData}>—</div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card data-testid="card-translation-stats">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe2 className="w-5 h-5 text-blue-500" />
                  {t.translationStats}
                </CardTitle>
                <CardDescription>PolyglotTranslatorAgent performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-muted-foreground" title={t.noData}>
                      {realMetrics.cachedTranslations ?? '—'}
                    </div>
                    <p className="text-xs text-muted-foreground">{t.cachedTranslations}</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-muted-foreground" title={t.noData}>
                      {realMetrics.languagesCovered ?? '—'}
                    </div>
                    <p className="text-xs text-muted-foreground">{t.languagesCovered}</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-muted-foreground" title={t.noData}>
                      {realMetrics.articlesTranslated ?? '—'}
                    </div>
                    <p className="text-xs text-muted-foreground">{t.articlesTranslated}</p>
                  </div>
                </div>
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {t.noData}
                </div>
              </CardContent>
            </Card>
            
            <Card data-testid="card-content-analysis">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-500" />
                  {t.contentAnalysis}
                </CardTitle>
                <CardDescription>ContentAnalyzerAgent performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-muted-foreground" title={t.noData}>
                      {realMetrics.articlesAnalyzed ?? '—'}
                    </div>
                    <p className="text-xs text-muted-foreground">{t.articlesAnalyzed}</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-muted-foreground" title={t.noData}>
                      {realMetrics.avgQualityScore ?? '—'}
                    </div>
                    <p className="text-xs text-muted-foreground">{t.avgQualityScore}</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-muted-foreground" title={t.noData}>
                      {realMetrics.seoOptimizations ?? '—'}
                    </div>
                    <p className="text-xs text-muted-foreground">{t.seoOptimizations}</p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">{t.agentActivity}</h4>
                  <div className="py-4 text-center text-sm text-muted-foreground">
                    {t.noActivity}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card data-testid="card-job-history">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                {t.totalJobs} - {realMetrics.completed ?? '—'}
              </CardTitle>
              <CardDescription>Job completion breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-none">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{realMetrics.pending}</div>
                    <p className="text-sm text-muted-foreground">{t.pending}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-none">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <RefreshCw className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{realMetrics.processing}</div>
                    <p className="text-sm text-muted-foreground">{t.processing}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-none">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{realMetrics.completed ?? '—'}</div>
                    <p className="text-sm text-muted-foreground">{t.completed}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-none">
                  <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{realMetrics.failed ?? '—'}</div>
                    <p className="text-sm text-muted-foreground">{t.failed}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
