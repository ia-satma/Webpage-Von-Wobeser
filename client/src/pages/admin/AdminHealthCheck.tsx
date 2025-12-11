import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Skull, 
  FileWarning,
  Languages,
  Image,
  Trash2,
  Clock,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useLanguage } from '@/contexts/LanguageContext';
import { getImpactLabel } from '@/lib/adminTranslations';

interface HealthIssue {
  id: string;
  type: 'zombie_process' | 'incomplete_success' | 'localization_leakage' | 'orphaned_asset' | 'missing_translation';
  severity: 'critical' | 'high' | 'medium' | 'low';
  entityType: 'article' | 'team_member' | 'agent_job' | 'media';
  entityId: string;
  title: string;
  details: string;
  suggestedAction: string;
  detectedAt: string;
}

interface AuditReport {
  runId: string;
  runAt: string;
  durationMs: number;
  summary: {
    totalIssues: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    zombieProcesses: number;
    incompleteSuccess: number;
    localizationLeakage: number;
    orphanedAssets: number;
    missingTranslations: number;
  };
  issues: HealthIssue[];
  healthScore: number;
}

interface HealthCheckResponse {
  success: boolean;
  report: AuditReport;
  humanReadable: string;
}

const translations: Record<string, Record<string, string>> = {
  en: {
    pageTitle: "System Health Check",
    pageDescription: "Deep audit of database integrity, translations, and content quality",
    runAudit: "Run Deep Audit",
    runningAudit: "Running Audit...",
    zombiesReset: "Zombies Reset",
    resetZombies: "Reset Zombies",
    runningInitialCheck: "Running initial health check...",
    healthScore: "Health Score",
    totalIssues: "Total Issues",
    auditDuration: "Audit Duration",
    lastRun: "Last Run",
    issues: "Issues",
    clearFilter: "Clear Filter",
    filterDescription: "Click on issue category cards above to filter",
    zombieProcesses: "Zombie Processes",
    incompleteSuccess: "Incomplete Success",
    localizationLeakage: "Localization Leakage",
    orphanedAssets: "Orphaned Assets",
    missingTranslations: "Missing Translations",
    zombieProcess: "Zombie Process",
    incomplete: "Incomplete",
    orphanedAsset: "Orphaned Asset",
    missingTranslation: "Missing Translation",
    suggestedAction: "Action",
    noIssuesFound: "No issues found",
    systemHealthy: "System is healthy!",
    noTypeIssues: "No {type} issues found",
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
    error: "Error",
    failedToResetZombies: "Failed to reset zombie jobs",
  },
  es: {
    pageTitle: "Verificación del Sistema",
    pageDescription: "Auditoría profunda de integridad de base de datos, traducciones y calidad de contenido",
    runAudit: "Ejecutar Auditoría",
    runningAudit: "Ejecutando Auditoría...",
    zombiesReset: "Zombies Reiniciados",
    resetZombies: "Reiniciar Zombies",
    runningInitialCheck: "Ejecutando verificación inicial...",
    healthScore: "Puntuación de Salud",
    totalIssues: "Problemas Totales",
    auditDuration: "Duración de Auditoría",
    lastRun: "Última Ejecución",
    issues: "Problemas",
    clearFilter: "Limpiar Filtro",
    filterDescription: "Haga clic en las tarjetas de categoría para filtrar",
    zombieProcesses: "Procesos Zombie",
    incompleteSuccess: "Éxito Incompleto",
    localizationLeakage: "Fuga de Localización",
    orphanedAssets: "Recursos Huérfanos",
    missingTranslations: "Traducciones Faltantes",
    zombieProcess: "Proceso Zombie",
    incomplete: "Incompleto",
    orphanedAsset: "Recurso Huérfano",
    missingTranslation: "Traducción Faltante",
    suggestedAction: "Acción",
    noIssuesFound: "No se encontraron problemas",
    systemHealthy: "¡El sistema está saludable!",
    noTypeIssues: "No se encontraron problemas de {type}",
    critical: "Crítico",
    high: "Alto",
    medium: "Medio",
    low: "Bajo",
    error: "Error",
    failedToResetZombies: "Error al reiniciar trabajos zombie",
  },
  de: {
    pageTitle: "Systemzustandsprüfung",
    pageDescription: "Tiefenprüfung der Datenbankintegrität, Übersetzungen und Inhaltsqualität",
    runAudit: "Tiefenprüfung starten",
    runningAudit: "Prüfung läuft...",
    zombiesReset: "Zombies zurückgesetzt",
    resetZombies: "Zombies zurücksetzen",
    runningInitialCheck: "Erstprüfung wird ausgeführt...",
    healthScore: "Gesundheitswert",
    totalIssues: "Gesamtprobleme",
    auditDuration: "Prüfdauer",
    lastRun: "Letzte Ausführung",
    issues: "Probleme",
    clearFilter: "Filter löschen",
    filterDescription: "Klicken Sie auf die Kategoriekarten, um zu filtern",
    zombieProcesses: "Zombie-Prozesse",
    incompleteSuccess: "Unvollständiger Erfolg",
    localizationLeakage: "Lokalisierungsleck",
    orphanedAssets: "Verwaiste Ressourcen",
    missingTranslations: "Fehlende Übersetzungen",
    zombieProcess: "Zombie-Prozess",
    incomplete: "Unvollständig",
    orphanedAsset: "Verwaiste Ressource",
    missingTranslation: "Fehlende Übersetzung",
    suggestedAction: "Aktion",
    noIssuesFound: "Keine Probleme gefunden",
    systemHealthy: "System ist gesund!",
    noTypeIssues: "Keine {type}-Probleme gefunden",
    critical: "Kritisch",
    high: "Hoch",
    medium: "Mittel",
    low: "Niedrig",
    error: "Fehler",
    failedToResetZombies: "Fehler beim Zurücksetzen der Zombie-Jobs",
  },
  zh: {
    pageTitle: "系统健康检查",
    pageDescription: "数据库完整性、翻译和内容质量深度审计",
    runAudit: "运行深度审计",
    runningAudit: "正在运行审计...",
    zombiesReset: "僵尸进程已重置",
    resetZombies: "重置僵尸进程",
    runningInitialCheck: "正在运行初始健康检查...",
    healthScore: "健康评分",
    totalIssues: "问题总数",
    auditDuration: "审计时长",
    lastRun: "上次运行",
    issues: "问题",
    clearFilter: "清除筛选",
    filterDescription: "点击上方的类别卡片进行筛选",
    zombieProcesses: "僵尸进程",
    incompleteSuccess: "不完整成功",
    localizationLeakage: "本地化泄漏",
    orphanedAssets: "孤立资源",
    missingTranslations: "缺失翻译",
    zombieProcess: "僵尸进程",
    incomplete: "不完整",
    orphanedAsset: "孤立资源",
    missingTranslation: "缺失翻译",
    suggestedAction: "建议操作",
    noIssuesFound: "未发现问题",
    systemHealthy: "系统健康！",
    noTypeIssues: "未发现{type}问题",
    critical: "严重",
    high: "高",
    medium: "中",
    low: "低",
    error: "错误",
    failedToResetZombies: "重置僵尸任务失败",
  },
  ko: {
    pageTitle: "시스템 상태 점검",
    pageDescription: "데이터베이스 무결성, 번역 및 콘텐츠 품질 심층 감사",
    runAudit: "심층 감사 실행",
    runningAudit: "감사 실행 중...",
    zombiesReset: "좀비 재설정됨",
    resetZombies: "좀비 재설정",
    runningInitialCheck: "초기 상태 점검 실행 중...",
    healthScore: "상태 점수",
    totalIssues: "전체 문제",
    auditDuration: "감사 소요 시간",
    lastRun: "마지막 실행",
    issues: "문제",
    clearFilter: "필터 지우기",
    filterDescription: "필터링하려면 위의 카테고리 카드를 클릭하세요",
    zombieProcesses: "좀비 프로세스",
    incompleteSuccess: "불완전한 성공",
    localizationLeakage: "로컬라이제이션 누출",
    orphanedAssets: "고아 자산",
    missingTranslations: "누락된 번역",
    zombieProcess: "좀비 프로세스",
    incomplete: "불완전",
    orphanedAsset: "고아 자산",
    missingTranslation: "누락된 번역",
    suggestedAction: "조치",
    noIssuesFound: "문제가 발견되지 않음",
    systemHealthy: "시스템이 정상입니다!",
    noTypeIssues: "{type} 문제가 발견되지 않음",
    critical: "심각",
    high: "높음",
    medium: "중간",
    low: "낮음",
    error: "오류",
    failedToResetZombies: "좀비 작업 재설정 실패",
  },
  ja: {
    pageTitle: "システムヘルスチェック",
    pageDescription: "データベース整合性、翻訳、コンテンツ品質の詳細監査",
    runAudit: "詳細監査を実行",
    runningAudit: "監査実行中...",
    zombiesReset: "ゾンビがリセットされました",
    resetZombies: "ゾンビをリセット",
    runningInitialCheck: "初期ヘルスチェック実行中...",
    healthScore: "ヘルススコア",
    totalIssues: "問題の合計",
    auditDuration: "監査時間",
    lastRun: "最終実行",
    issues: "問題",
    clearFilter: "フィルターをクリア",
    filterDescription: "フィルタリングするには上のカテゴリカードをクリック",
    zombieProcesses: "ゾンビプロセス",
    incompleteSuccess: "不完全な成功",
    localizationLeakage: "ローカライゼーション漏れ",
    orphanedAssets: "孤立アセット",
    missingTranslations: "不足している翻訳",
    zombieProcess: "ゾンビプロセス",
    incomplete: "不完全",
    orphanedAsset: "孤立アセット",
    missingTranslation: "不足翻訳",
    suggestedAction: "アクション",
    noIssuesFound: "問題は見つかりませんでした",
    systemHealthy: "システムは正常です！",
    noTypeIssues: "{type}の問題は見つかりませんでした",
    critical: "重大",
    high: "高",
    medium: "中",
    low: "低",
    error: "エラー",
    failedToResetZombies: "ゾンビジョブのリセットに失敗しました",
  },
  ar: {
    pageTitle: "فحص صحة النظام",
    pageDescription: "تدقيق عميق لسلامة قاعدة البيانات والترجمات وجودة المحتوى",
    runAudit: "تشغيل التدقيق العميق",
    runningAudit: "جاري التدقيق...",
    zombiesReset: "تم إعادة تعيين الزومبي",
    resetZombies: "إعادة تعيين الزومبي",
    runningInitialCheck: "جاري تشغيل الفحص الأولي...",
    healthScore: "درجة الصحة",
    totalIssues: "إجمالي المشاكل",
    auditDuration: "مدة التدقيق",
    lastRun: "آخر تشغيل",
    issues: "المشاكل",
    clearFilter: "مسح الفلتر",
    filterDescription: "انقر على بطاقات الفئات أعلاه للتصفية",
    zombieProcesses: "عمليات الزومبي",
    incompleteSuccess: "نجاح غير مكتمل",
    localizationLeakage: "تسرب الترجمة",
    orphanedAssets: "موارد يتيمة",
    missingTranslations: "ترجمات مفقودة",
    zombieProcess: "عملية زومبي",
    incomplete: "غير مكتمل",
    orphanedAsset: "مورد يتيم",
    missingTranslation: "ترجمة مفقودة",
    suggestedAction: "الإجراء",
    noIssuesFound: "لم يتم العثور على مشاكل",
    systemHealthy: "النظام سليم!",
    noTypeIssues: "لم يتم العثور على مشاكل {type}",
    critical: "حرج",
    high: "عالي",
    medium: "متوسط",
    low: "منخفض",
    error: "خطأ",
    failedToResetZombies: "فشل في إعادة تعيين وظائف الزومبي",
  },
  ru: {
    pageTitle: "Проверка состояния системы",
    pageDescription: "Глубокий аудит целостности базы данных, переводов и качества контента",
    runAudit: "Запустить глубокий аудит",
    runningAudit: "Выполняется аудит...",
    zombiesReset: "Зомби сброшены",
    resetZombies: "Сбросить зомби",
    runningInitialCheck: "Выполняется первичная проверка...",
    healthScore: "Оценка здоровья",
    totalIssues: "Всего проблем",
    auditDuration: "Длительность аудита",
    lastRun: "Последний запуск",
    issues: "Проблемы",
    clearFilter: "Очистить фильтр",
    filterDescription: "Нажмите на карточки категорий выше для фильтрации",
    zombieProcesses: "Зомби-процессы",
    incompleteSuccess: "Неполный успех",
    localizationLeakage: "Утечка локализации",
    orphanedAssets: "Осиротевшие ресурсы",
    missingTranslations: "Отсутствующие переводы",
    zombieProcess: "Зомби-процесс",
    incomplete: "Неполный",
    orphanedAsset: "Осиротевший ресурс",
    missingTranslation: "Отсутствующий перевод",
    suggestedAction: "Действие",
    noIssuesFound: "Проблем не обнаружено",
    systemHealthy: "Система здорова!",
    noTypeIssues: "Проблем типа {type} не обнаружено",
    critical: "Критический",
    high: "Высокий",
    medium: "Средний",
    low: "Низкий",
    error: "Ошибка",
    failedToResetZombies: "Не удалось сбросить зомби-задачи",
  },
  fr: {
    pageTitle: "Vérification de l'état du système",
    pageDescription: "Audit approfondi de l'intégrité de la base de données, des traductions et de la qualité du contenu",
    runAudit: "Lancer l'audit approfondi",
    runningAudit: "Audit en cours...",
    zombiesReset: "Zombies réinitialisés",
    resetZombies: "Réinitialiser les zombies",
    runningInitialCheck: "Vérification initiale en cours...",
    healthScore: "Score de santé",
    totalIssues: "Total des problèmes",
    auditDuration: "Durée de l'audit",
    lastRun: "Dernière exécution",
    issues: "Problèmes",
    clearFilter: "Effacer le filtre",
    filterDescription: "Cliquez sur les cartes de catégorie ci-dessus pour filtrer",
    zombieProcesses: "Processus zombies",
    incompleteSuccess: "Succès incomplet",
    localizationLeakage: "Fuite de localisation",
    orphanedAssets: "Ressources orphelines",
    missingTranslations: "Traductions manquantes",
    zombieProcess: "Processus zombie",
    incomplete: "Incomplet",
    orphanedAsset: "Ressource orpheline",
    missingTranslation: "Traduction manquante",
    suggestedAction: "Action",
    noIssuesFound: "Aucun problème trouvé",
    systemHealthy: "Le système est sain !",
    noTypeIssues: "Aucun problème de type {type} trouvé",
    critical: "Critique",
    high: "Élevé",
    medium: "Moyen",
    low: "Faible",
    error: "Erreur",
    failedToResetZombies: "Échec de la réinitialisation des tâches zombies",
  },
  it: {
    pageTitle: "Controllo stato del sistema",
    pageDescription: "Audit approfondito dell'integrità del database, traduzioni e qualità dei contenuti",
    runAudit: "Esegui audit approfondito",
    runningAudit: "Audit in corso...",
    zombiesReset: "Zombie reimpostati",
    resetZombies: "Reimposta zombie",
    runningInitialCheck: "Esecuzione controllo iniziale...",
    healthScore: "Punteggio salute",
    totalIssues: "Problemi totali",
    auditDuration: "Durata audit",
    lastRun: "Ultima esecuzione",
    issues: "Problemi",
    clearFilter: "Cancella filtro",
    filterDescription: "Clicca sulle schede categoria sopra per filtrare",
    zombieProcesses: "Processi zombie",
    incompleteSuccess: "Successo incompleto",
    localizationLeakage: "Perdita localizzazione",
    orphanedAssets: "Risorse orfane",
    missingTranslations: "Traduzioni mancanti",
    zombieProcess: "Processo zombie",
    incomplete: "Incompleto",
    orphanedAsset: "Risorsa orfana",
    missingTranslation: "Traduzione mancante",
    suggestedAction: "Azione",
    noIssuesFound: "Nessun problema trovato",
    systemHealthy: "Il sistema è sano!",
    noTypeIssues: "Nessun problema di tipo {type} trovato",
    critical: "Critico",
    high: "Alto",
    medium: "Medio",
    low: "Basso",
    error: "Errore",
    failedToResetZombies: "Impossibile reimpostare i lavori zombie",
  },
};

const severityColors = {
  critical: 'bg-red-600 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-black',
  low: 'bg-blue-500 text-white',
};

const typeIcons = {
  zombie_process: Skull,
  incomplete_success: FileWarning,
  localization_leakage: Languages,
  orphaned_asset: Trash2,
  missing_translation: Languages,
};

function getTypeLabel(type: string, lang: string): string {
  const t = translations[lang] || translations.en;
  const typeMap: Record<string, string> = {
    zombie_process: t.zombieProcess,
    incomplete_success: t.incomplete,
    localization_leakage: t.localizationLeakage,
    orphaned_asset: t.orphanedAsset,
    missing_translation: t.missingTranslation,
  };
  return typeMap[type] || type;
}

function getSeverityLabel(severity: string, lang: string): string {
  const t = translations[lang] || translations.en;
  const severityMap: Record<string, string> = {
    critical: t.critical,
    high: t.high,
    medium: t.medium,
    low: t.low,
  };
  return severityMap[severity] || severity;
}

export default function AdminHealthCheck() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language] || translations.en;
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const { data: healthData, isLoading, refetch, isFetching } = useQuery<HealthCheckResponse>({
    queryKey: ['/api/health-check/run'],
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const resetZombiesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/health-check/reset-zombies');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: t.zombiesReset,
        description: data.message,
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: t.error,
        description: error.message || t.failedToResetZombies,
        variant: 'destructive',
      });
    },
  });

  const report = healthData?.report;
  const filteredIssues = report?.issues.filter(
    issue => !selectedType || issue.type === selectedType
  ) || [];

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHealthScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle2 className="h-8 w-8 text-green-500" />;
    if (score >= 50) return <AlertTriangle className="h-8 w-8 text-yellow-500" />;
    return <AlertTriangle className="h-8 w-8 text-red-500" />;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">{t.pageTitle}</h1>
          <p className="text-muted-foreground">
            {t.pageDescription}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => refetch()} 
            disabled={isFetching}
            data-testid="button-run-audit"
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {isFetching ? t.runningAudit : t.runAudit}
          </Button>
          {report && report.summary.zombieProcesses > 0 && (
            <Button 
              variant="destructive" 
              onClick={() => resetZombiesMutation.mutate()}
              disabled={resetZombiesMutation.isPending}
              data-testid="button-reset-zombies"
            >
              <Skull className="h-4 w-4 mr-2" />
              {t.resetZombies} ({report.summary.zombieProcesses})
            </Button>
          )}
        </div>
      </div>

      {isLoading && !report && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">{t.runningInitialCheck}</span>
          </CardContent>
        </Card>
      )}

      {report && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t.healthScore}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  {getHealthScoreIcon(report.healthScore)}
                  <span className={`text-4xl font-bold ${getHealthScoreColor(report.healthScore)}`} data-testid="text-health-score">
                    {report.healthScore}%
                  </span>
                </div>
                <Progress 
                  value={report.healthScore} 
                  className="mt-3 h-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t.totalIssues}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Activity className="h-8 w-8 text-muted-foreground" />
                  <span className="text-4xl font-bold" data-testid="text-total-issues">
                    {report.summary.totalIssues}
                  </span>
                </div>
                <div className="flex gap-1 mt-3">
                  {report.summary.criticalCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {report.summary.criticalCount} {t.critical}
                    </Badge>
                  )}
                  {report.summary.highCount > 0 && (
                    <Badge className="bg-orange-500 text-xs">
                      {report.summary.highCount} {t.high}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t.auditDuration}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-muted-foreground" />
                  <span className="text-4xl font-bold" data-testid="text-duration">
                    {(report.durationMs / 1000).toFixed(1)}s
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Run ID: {report.runId.substring(6, 20)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t.lastRun}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-8 w-8 text-muted-foreground" />
                  <span className="text-lg font-medium" data-testid="text-last-run">
                    {new Date(report.runAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  {new Date(report.runAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card 
              className={`cursor-pointer transition-colors ${selectedType === 'zombie_process' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedType(selectedType === 'zombie_process' ? null : 'zombie_process')}
              data-testid="card-filter-zombies"
            >
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{t.zombieProcesses}</p>
                    <p className="text-2xl font-bold">{report.summary.zombieProcesses}</p>
                  </div>
                  <Skull className="h-6 w-6 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-colors ${selectedType === 'incomplete_success' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedType(selectedType === 'incomplete_success' ? null : 'incomplete_success')}
              data-testid="card-filter-incomplete"
            >
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{t.incompleteSuccess}</p>
                    <p className="text-2xl font-bold">{report.summary.incompleteSuccess}</p>
                  </div>
                  <FileWarning className="h-6 w-6 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-colors ${selectedType === 'localization_leakage' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedType(selectedType === 'localization_leakage' ? null : 'localization_leakage')}
              data-testid="card-filter-leakage"
            >
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{t.localizationLeakage}</p>
                    <p className="text-2xl font-bold">{report.summary.localizationLeakage}</p>
                  </div>
                  <Languages className="h-6 w-6 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-colors ${selectedType === 'orphaned_asset' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedType(selectedType === 'orphaned_asset' ? null : 'orphaned_asset')}
              data-testid="card-filter-orphans"
            >
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{t.orphanedAssets}</p>
                    <p className="text-2xl font-bold">{report.summary.orphanedAssets}</p>
                  </div>
                  <Trash2 className="h-6 w-6 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-colors ${selectedType === 'missing_translation' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedType(selectedType === 'missing_translation' ? null : 'missing_translation')}
              data-testid="card-filter-translations"
            >
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{t.missingTranslations}</p>
                    <p className="text-2xl font-bold">{report.summary.missingTranslations}</p>
                  </div>
                  <Image className="h-6 w-6 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t.issues} ({filteredIssues.length})</span>
                {selectedType && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedType(null)}>
                    {t.clearFilter}
                  </Button>
                )}
              </CardTitle>
              <CardDescription>
                {t.filterDescription}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {filteredIssues.map((issue, index) => {
                    const Icon = typeIcons[issue.type];
                    return (
                      <div 
                        key={issue.id}
                        className="p-4 rounded-md border bg-card"
                        data-testid={`issue-row-${index}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              <Icon className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge className={severityColors[issue.severity]}>
                                  {getSeverityLabel(issue.severity, language).toUpperCase()}
                                </Badge>
                                <Badge variant="outline">
                                  {getTypeLabel(issue.type, language)}
                                </Badge>
                                <Badge variant="secondary">
                                  {issue.entityType}
                                </Badge>
                              </div>
                              <h4 className="font-medium">{issue.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {issue.details}
                              </p>
                              <p className="text-sm text-blue-600 dark:text-blue-400">
                                {t.suggestedAction}: {issue.suggestedAction}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredIssues.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      {selectedType 
                        ? t.noTypeIssues.replace('{type}', getTypeLabel(selectedType, language))
                        : `${t.noIssuesFound}. ${t.systemHealthy}`}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
