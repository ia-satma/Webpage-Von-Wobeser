import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminAuth, adminApiRequest } from "@/lib/adminAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Clock,
  Play,
  Loader2,
  Link2,
  Languages,
  FileText,
  Search,
  ArrowLeft,
  RefreshCw,
  XCircle,
  Eye,
  Filter
} from "lucide-react";
import type { WebsiteAudit, WebsiteAuditFinding } from "@shared/schema";

const translations = {
  en: {
    title: "Website Audits",
    subtitle: "Monitor website quality, find issues, and track fixes",
    runAudit: "Run Audit",
    runningAudit: "Running Audit...",
    auditHistory: "Audit History",
    openIssues: "Open Issues",
    lastAudit: "Last Audit",
    noAudits: "No audits have been run yet",
    runFirstAudit: "Run your first audit to check website quality",
    findings: "Findings",
    severity: "Severity",
    category: "Category",
    status: "Status",
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
    open: "Open",
    inProgress: "In Progress",
    resolved: "Resolved",
    ignored: "Ignored",
    links: "Links",
    translations: "Translations",
    content: "Content",
    seo: "SEO",
    performance: "Performance",
    navigation: "Navigation",
    issuesFound: "issues found",
    pagesScanned: "pages scanned",
    linksChecked: "links checked",
    translationsChecked: "translations checked",
    executionTime: "Execution time",
    seconds: "seconds",
    viewDetails: "View Details",
    markResolved: "Mark Resolved",
    details: "Details",
    recommendation: "Recommendation",
    entity: "Entity",
    back: "Back",
    refresh: "Refresh",
    fullAudit: "Full Audit",
    linksOnly: "Links Only",
    translationsOnly: "Translations Only",
    seoOnly: "SEO Only",
    contentOnly: "Content Only",
    auditType: "Audit Type",
    startedAt: "Started",
    completedAt: "Completed",
    running: "Running",
    completed: "Completed",
    failed: "Failed",
    pending: "Pending",
    filterBySeverity: "Filter by severity",
    filterByCategory: "Filter by category",
    all: "All",
    auditStarted: "Audit Started",
    auditStartedDesc: "Audit is running in the background. Refresh to see results.",
    error: "Error",
    auditStartError: "Failed to start audit",
  },
  es: {
    title: "Auditorías del Sitio",
    subtitle: "Monitorea la calidad del sitio, encuentra problemas y rastrea correcciones",
    runAudit: "Ejecutar Auditoría",
    runningAudit: "Ejecutando Auditoría...",
    auditHistory: "Historial de Auditorías",
    openIssues: "Problemas Abiertos",
    lastAudit: "Última Auditoría",
    noAudits: "No se han ejecutado auditorías aún",
    runFirstAudit: "Ejecuta tu primera auditoría para verificar la calidad del sitio",
    findings: "Hallazgos",
    severity: "Severidad",
    category: "Categoría",
    status: "Estado",
    critical: "Crítico",
    high: "Alto",
    medium: "Medio",
    low: "Bajo",
    open: "Abierto",
    inProgress: "En Progreso",
    resolved: "Resuelto",
    ignored: "Ignorado",
    links: "Enlaces",
    translations: "Traducciones",
    content: "Contenido",
    seo: "SEO",
    performance: "Rendimiento",
    navigation: "Navegación",
    issuesFound: "problemas encontrados",
    pagesScanned: "páginas escaneadas",
    linksChecked: "enlaces verificados",
    translationsChecked: "traducciones verificadas",
    executionTime: "Tiempo de ejecución",
    seconds: "segundos",
    viewDetails: "Ver Detalles",
    markResolved: "Marcar Resuelto",
    details: "Detalles",
    recommendation: "Recomendación",
    entity: "Entidad",
    back: "Volver",
    refresh: "Actualizar",
    fullAudit: "Auditoría Completa",
    linksOnly: "Solo Enlaces",
    translationsOnly: "Solo Traducciones",
    seoOnly: "Solo SEO",
    contentOnly: "Solo Contenido",
    auditType: "Tipo de Auditoría",
    startedAt: "Iniciado",
    completedAt: "Completado",
    running: "Ejecutando",
    completed: "Completado",
    failed: "Fallido",
    pending: "Pendiente",
    filterBySeverity: "Filtrar por severidad",
    filterByCategory: "Filtrar por categoría",
    all: "Todos",
    auditStarted: "Auditoría iniciada",
    auditStartedDesc: "La auditoría se está ejecutando en segundo plano. Actualiza para ver resultados.",
    error: "Error",
    auditStartError: "No se pudo iniciar la auditoría",
  },
  de: {
    title: "Website-Audits",
    subtitle: "Überwachen Sie die Website-Qualität, finden Sie Probleme und verfolgen Sie Korrekturen",
    runAudit: "Audit ausführen",
    runningAudit: "Audit wird ausgeführt...",
    auditHistory: "Audit-Verlauf",
    openIssues: "Offene Probleme",
    lastAudit: "Letztes Audit",
    noAudits: "Es wurden noch keine Audits durchgeführt",
    runFirstAudit: "Führen Sie Ihr erstes Audit durch, um die Website-Qualität zu prüfen",
    findings: "Ergebnisse",
    severity: "Schweregrad",
    category: "Kategorie",
    status: "Status",
    critical: "Kritisch",
    high: "Hoch",
    medium: "Mittel",
    low: "Niedrig",
    open: "Offen",
    inProgress: "In Bearbeitung",
    resolved: "Gelöst",
    ignored: "Ignoriert",
    links: "Links",
    translations: "Übersetzungen",
    content: "Inhalt",
    seo: "SEO",
    performance: "Leistung",
    navigation: "Navigation",
    issuesFound: "Probleme gefunden",
    pagesScanned: "Seiten gescannt",
    linksChecked: "Links geprüft",
    translationsChecked: "Übersetzungen geprüft",
    executionTime: "Ausführungszeit",
    seconds: "Sekunden",
    viewDetails: "Details anzeigen",
    markResolved: "Als gelöst markieren",
    details: "Details",
    recommendation: "Empfehlung",
    entity: "Entität",
    back: "Zurück",
    refresh: "Aktualisieren",
    fullAudit: "Vollständiges Audit",
    linksOnly: "Nur Links",
    translationsOnly: "Nur Übersetzungen",
    seoOnly: "Nur SEO",
    contentOnly: "Nur Inhalt",
    auditType: "Audit-Typ",
    startedAt: "Gestartet",
    completedAt: "Abgeschlossen",
    running: "Läuft",
    completed: "Abgeschlossen",
    failed: "Fehlgeschlagen",
    pending: "Ausstehend",
    filterBySeverity: "Nach Schweregrad filtern",
    filterByCategory: "Nach Kategorie filtern",
    all: "Alle",
    auditStarted: "Audit gestartet",
    auditStartedDesc: "Das Audit wird im Hintergrund ausgeführt. Aktualisieren Sie, um die Ergebnisse zu sehen.",
    error: "Fehler",
    auditStartError: "Audit konnte nicht gestartet werden",
  },
  zh: {
    title: "网站审计",
    subtitle: "监控网站质量、发现问题并跟踪修复",
    runAudit: "运行审计",
    runningAudit: "正在运行审计...",
    auditHistory: "审计历史",
    openIssues: "未解决问题",
    lastAudit: "最近审计",
    noAudits: "尚未运行任何审计",
    runFirstAudit: "运行您的第一次审计以检查网站质量",
    findings: "发现",
    severity: "严重程度",
    category: "类别",
    status: "状态",
    critical: "严重",
    high: "高",
    medium: "中",
    low: "低",
    open: "未处理",
    inProgress: "处理中",
    resolved: "已解决",
    ignored: "已忽略",
    links: "链接",
    translations: "翻译",
    content: "内容",
    seo: "SEO",
    performance: "性能",
    navigation: "导航",
    issuesFound: "个问题发现",
    pagesScanned: "页面已扫描",
    linksChecked: "链接已检查",
    translationsChecked: "翻译已检查",
    executionTime: "执行时间",
    seconds: "秒",
    viewDetails: "查看详情",
    markResolved: "标记为已解决",
    details: "详情",
    recommendation: "建议",
    entity: "实体",
    back: "返回",
    refresh: "刷新",
    fullAudit: "完整审计",
    linksOnly: "仅链接",
    translationsOnly: "仅翻译",
    seoOnly: "仅SEO",
    contentOnly: "仅内容",
    auditType: "审计类型",
    startedAt: "开始于",
    completedAt: "完成于",
    running: "运行中",
    completed: "已完成",
    failed: "失败",
    pending: "待处理",
    filterBySeverity: "按严重程度筛选",
    filterByCategory: "按类别筛选",
    all: "全部",
    auditStarted: "审计已启动",
    auditStartedDesc: "审计正在后台运行。刷新以查看结果。",
    error: "错误",
    auditStartError: "无法启动审计",
  },
  ko: {
    title: "웹사이트 감사",
    subtitle: "웹사이트 품질을 모니터링하고 문제를 찾아 수정 사항을 추적합니다",
    runAudit: "감사 실행",
    runningAudit: "감사 실행 중...",
    auditHistory: "감사 기록",
    openIssues: "미해결 문제",
    lastAudit: "마지막 감사",
    noAudits: "아직 실행된 감사가 없습니다",
    runFirstAudit: "첫 번째 감사를 실행하여 웹사이트 품질을 확인하세요",
    findings: "발견 사항",
    severity: "심각도",
    category: "카테고리",
    status: "상태",
    critical: "심각",
    high: "높음",
    medium: "중간",
    low: "낮음",
    open: "미처리",
    inProgress: "진행 중",
    resolved: "해결됨",
    ignored: "무시됨",
    links: "링크",
    translations: "번역",
    content: "콘텐츠",
    seo: "SEO",
    performance: "성능",
    navigation: "내비게이션",
    issuesFound: "개 문제 발견",
    pagesScanned: "페이지 스캔됨",
    linksChecked: "링크 확인됨",
    translationsChecked: "번역 확인됨",
    executionTime: "실행 시간",
    seconds: "초",
    viewDetails: "자세히 보기",
    markResolved: "해결됨으로 표시",
    details: "상세",
    recommendation: "권장 사항",
    entity: "엔티티",
    back: "뒤로",
    refresh: "새로고침",
    fullAudit: "전체 감사",
    linksOnly: "링크만",
    translationsOnly: "번역만",
    seoOnly: "SEO만",
    contentOnly: "콘텐츠만",
    auditType: "감사 유형",
    startedAt: "시작",
    completedAt: "완료",
    running: "실행 중",
    completed: "완료됨",
    failed: "실패",
    pending: "대기 중",
    filterBySeverity: "심각도별 필터",
    filterByCategory: "카테고리별 필터",
    all: "전체",
    auditStarted: "감사 시작됨",
    auditStartedDesc: "감사가 백그라운드에서 실행 중입니다. 새로고침하여 결과를 확인하세요.",
    error: "오류",
    auditStartError: "감사를 시작할 수 없습니다",
  },
  ja: {
    title: "ウェブサイト監査",
    subtitle: "ウェブサイトの品質を監視し、問題を見つけ、修正を追跡します",
    runAudit: "監査を実行",
    runningAudit: "監査実行中...",
    auditHistory: "監査履歴",
    openIssues: "未解決の問題",
    lastAudit: "最新の監査",
    noAudits: "まだ監査が実行されていません",
    runFirstAudit: "最初の監査を実行してウェブサイトの品質を確認してください",
    findings: "発見事項",
    severity: "重大度",
    category: "カテゴリ",
    status: "ステータス",
    critical: "重大",
    high: "高",
    medium: "中",
    low: "低",
    open: "未対応",
    inProgress: "対応中",
    resolved: "解決済み",
    ignored: "無視",
    links: "リンク",
    translations: "翻訳",
    content: "コンテンツ",
    seo: "SEO",
    performance: "パフォーマンス",
    navigation: "ナビゲーション",
    issuesFound: "件の問題を発見",
    pagesScanned: "ページをスキャン",
    linksChecked: "リンクをチェック",
    translationsChecked: "翻訳をチェック",
    executionTime: "実行時間",
    seconds: "秒",
    viewDetails: "詳細を見る",
    markResolved: "解決済みにする",
    details: "詳細",
    recommendation: "推奨",
    entity: "エンティティ",
    back: "戻る",
    refresh: "更新",
    fullAudit: "完全監査",
    linksOnly: "リンクのみ",
    translationsOnly: "翻訳のみ",
    seoOnly: "SEOのみ",
    contentOnly: "コンテンツのみ",
    auditType: "監査タイプ",
    startedAt: "開始",
    completedAt: "完了",
    running: "実行中",
    completed: "完了",
    failed: "失敗",
    pending: "保留中",
    filterBySeverity: "重大度でフィルタ",
    filterByCategory: "カテゴリでフィルタ",
    all: "すべて",
    auditStarted: "監査開始",
    auditStartedDesc: "監査はバックグラウンドで実行中です。更新して結果を確認してください。",
    error: "エラー",
    auditStartError: "監査を開始できませんでした",
  },
  ar: {
    title: "تدقيق الموقع",
    subtitle: "راقب جودة الموقع واكتشف المشاكل وتتبع الإصلاحات",
    runAudit: "تشغيل التدقيق",
    runningAudit: "جاري التدقيق...",
    auditHistory: "سجل التدقيق",
    openIssues: "المشاكل المفتوحة",
    lastAudit: "آخر تدقيق",
    noAudits: "لم يتم إجراء أي تدقيق بعد",
    runFirstAudit: "قم بتشغيل أول تدقيق للتحقق من جودة الموقع",
    findings: "النتائج",
    severity: "الخطورة",
    category: "الفئة",
    status: "الحالة",
    critical: "حرج",
    high: "عالي",
    medium: "متوسط",
    low: "منخفض",
    open: "مفتوح",
    inProgress: "قيد التنفيذ",
    resolved: "تم الحل",
    ignored: "تم التجاهل",
    links: "الروابط",
    translations: "الترجمات",
    content: "المحتوى",
    seo: "SEO",
    performance: "الأداء",
    navigation: "التنقل",
    issuesFound: "مشاكل تم العثور عليها",
    pagesScanned: "صفحات تم فحصها",
    linksChecked: "روابط تم فحصها",
    translationsChecked: "ترجمات تم فحصها",
    executionTime: "وقت التنفيذ",
    seconds: "ثواني",
    viewDetails: "عرض التفاصيل",
    markResolved: "تحديد كمحلول",
    details: "التفاصيل",
    recommendation: "التوصية",
    entity: "الكيان",
    back: "رجوع",
    refresh: "تحديث",
    fullAudit: "تدقيق كامل",
    linksOnly: "الروابط فقط",
    translationsOnly: "الترجمات فقط",
    seoOnly: "SEO فقط",
    contentOnly: "المحتوى فقط",
    auditType: "نوع التدقيق",
    startedAt: "بدأ في",
    completedAt: "اكتمل في",
    running: "قيد التشغيل",
    completed: "مكتمل",
    failed: "فشل",
    pending: "قيد الانتظار",
    filterBySeverity: "تصفية حسب الخطورة",
    filterByCategory: "تصفية حسب الفئة",
    all: "الكل",
    auditStarted: "بدأ التدقيق",
    auditStartedDesc: "يعمل التدقيق في الخلفية. قم بالتحديث لرؤية النتائج.",
    error: "خطأ",
    auditStartError: "فشل في بدء التدقيق",
  },
  ru: {
    title: "Аудит сайта",
    subtitle: "Отслеживайте качество сайта, находите проблемы и контролируйте исправления",
    runAudit: "Запустить аудит",
    runningAudit: "Выполняется аудит...",
    auditHistory: "История аудитов",
    openIssues: "Открытые проблемы",
    lastAudit: "Последний аудит",
    noAudits: "Аудиты ещё не проводились",
    runFirstAudit: "Запустите первый аудит для проверки качества сайта",
    findings: "Результаты",
    severity: "Серьёзность",
    category: "Категория",
    status: "Статус",
    critical: "Критический",
    high: "Высокий",
    medium: "Средний",
    low: "Низкий",
    open: "Открыто",
    inProgress: "В работе",
    resolved: "Решено",
    ignored: "Игнорируется",
    links: "Ссылки",
    translations: "Переводы",
    content: "Контент",
    seo: "SEO",
    performance: "Производительность",
    navigation: "Навигация",
    issuesFound: "проблем найдено",
    pagesScanned: "страниц просканировано",
    linksChecked: "ссылок проверено",
    translationsChecked: "переводов проверено",
    executionTime: "Время выполнения",
    seconds: "секунд",
    viewDetails: "Подробнее",
    markResolved: "Отметить решённым",
    details: "Детали",
    recommendation: "Рекомендация",
    entity: "Сущность",
    back: "Назад",
    refresh: "Обновить",
    fullAudit: "Полный аудит",
    linksOnly: "Только ссылки",
    translationsOnly: "Только переводы",
    seoOnly: "Только SEO",
    contentOnly: "Только контент",
    auditType: "Тип аудита",
    startedAt: "Начато",
    completedAt: "Завершено",
    running: "Выполняется",
    completed: "Завершено",
    failed: "Ошибка",
    pending: "Ожидание",
    filterBySeverity: "Фильтр по серьёзности",
    filterByCategory: "Фильтр по категории",
    all: "Все",
    auditStarted: "Аудит запущен",
    auditStartedDesc: "Аудит выполняется в фоновом режиме. Обновите страницу для просмотра результатов.",
    error: "Ошибка",
    auditStartError: "Не удалось запустить аудит",
  },
  fr: {
    title: "Audits du site",
    subtitle: "Surveillez la qualité du site, trouvez les problèmes et suivez les corrections",
    runAudit: "Lancer l'audit",
    runningAudit: "Audit en cours...",
    auditHistory: "Historique des audits",
    openIssues: "Problèmes ouverts",
    lastAudit: "Dernier audit",
    noAudits: "Aucun audit n'a encore été effectué",
    runFirstAudit: "Lancez votre premier audit pour vérifier la qualité du site",
    findings: "Résultats",
    severity: "Sévérité",
    category: "Catégorie",
    status: "Statut",
    critical: "Critique",
    high: "Élevé",
    medium: "Moyen",
    low: "Faible",
    open: "Ouvert",
    inProgress: "En cours",
    resolved: "Résolu",
    ignored: "Ignoré",
    links: "Liens",
    translations: "Traductions",
    content: "Contenu",
    seo: "SEO",
    performance: "Performance",
    navigation: "Navigation",
    issuesFound: "problèmes trouvés",
    pagesScanned: "pages analysées",
    linksChecked: "liens vérifiés",
    translationsChecked: "traductions vérifiées",
    executionTime: "Temps d'exécution",
    seconds: "secondes",
    viewDetails: "Voir les détails",
    markResolved: "Marquer comme résolu",
    details: "Détails",
    recommendation: "Recommandation",
    entity: "Entité",
    back: "Retour",
    refresh: "Actualiser",
    fullAudit: "Audit complet",
    linksOnly: "Liens uniquement",
    translationsOnly: "Traductions uniquement",
    seoOnly: "SEO uniquement",
    contentOnly: "Contenu uniquement",
    auditType: "Type d'audit",
    startedAt: "Démarré",
    completedAt: "Terminé",
    running: "En cours",
    completed: "Terminé",
    failed: "Échoué",
    pending: "En attente",
    filterBySeverity: "Filtrer par sévérité",
    filterByCategory: "Filtrer par catégorie",
    all: "Tous",
    auditStarted: "Audit lancé",
    auditStartedDesc: "L'audit s'exécute en arrière-plan. Actualisez pour voir les résultats.",
    error: "Erreur",
    auditStartError: "Échec du lancement de l'audit",
  },
  it: {
    title: "Audit del sito",
    subtitle: "Monitora la qualità del sito, trova problemi e traccia le correzioni",
    runAudit: "Esegui audit",
    runningAudit: "Audit in corso...",
    auditHistory: "Cronologia audit",
    openIssues: "Problemi aperti",
    lastAudit: "Ultimo audit",
    noAudits: "Nessun audit è stato ancora eseguito",
    runFirstAudit: "Esegui il tuo primo audit per verificare la qualità del sito",
    findings: "Risultati",
    severity: "Gravità",
    category: "Categoria",
    status: "Stato",
    critical: "Critico",
    high: "Alto",
    medium: "Medio",
    low: "Basso",
    open: "Aperto",
    inProgress: "In corso",
    resolved: "Risolto",
    ignored: "Ignorato",
    links: "Link",
    translations: "Traduzioni",
    content: "Contenuto",
    seo: "SEO",
    performance: "Prestazioni",
    navigation: "Navigazione",
    issuesFound: "problemi trovati",
    pagesScanned: "pagine scansionate",
    linksChecked: "link verificati",
    translationsChecked: "traduzioni verificate",
    executionTime: "Tempo di esecuzione",
    seconds: "secondi",
    viewDetails: "Vedi dettagli",
    markResolved: "Segna come risolto",
    details: "Dettagli",
    recommendation: "Raccomandazione",
    entity: "Entità",
    back: "Indietro",
    refresh: "Aggiorna",
    fullAudit: "Audit completo",
    linksOnly: "Solo link",
    translationsOnly: "Solo traduzioni",
    seoOnly: "Solo SEO",
    contentOnly: "Solo contenuto",
    auditType: "Tipo di audit",
    startedAt: "Iniziato",
    completedAt: "Completato",
    running: "In esecuzione",
    completed: "Completato",
    failed: "Fallito",
    pending: "In attesa",
    filterBySeverity: "Filtra per gravità",
    filterByCategory: "Filtra per categoria",
    all: "Tutti",
    auditStarted: "Audit avviato",
    auditStartedDesc: "L'audit è in esecuzione in background. Aggiorna per vedere i risultati.",
    error: "Errore",
    auditStartError: "Impossibile avviare l'audit",
  },
};

function getSeverityIcon(severity: string) {
  switch (severity) {
    case 'critical':
      return <XCircle className="h-4 w-4 text-red-600" />;
    case 'high':
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    case 'medium':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'low':
      return <Info className="h-4 w-4 text-blue-500" />;
    default:
      return <Info className="h-4 w-4" />;
  }
}

function getSeverityBadge(severity: string, t: typeof translations.en) {
  const variants: Record<string, string> = {
    critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  };
  const labels: Record<string, string> = {
    critical: t.critical,
    high: t.high,
    medium: t.medium,
    low: t.low,
  };
  return (
    <Badge className={variants[severity] || ''}>
      {labels[severity] || severity}
    </Badge>
  );
}

function getCategoryIcon(category: string) {
  switch (category) {
    case 'links':
      return <Link2 className="h-4 w-4" />;
    case 'translations':
      return <Languages className="h-4 w-4" />;
    case 'content':
      return <FileText className="h-4 w-4" />;
    case 'seo':
      return <Search className="h-4 w-4" />;
    default:
      return <AlertTriangle className="h-4 w-4" />;
  }
}

function getStatusBadge(status: string, t: typeof translations.en) {
  const variants: Record<string, string> = {
    open: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    ignored: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  };
  const labels: Record<string, string> = {
    open: t.open,
    in_progress: t.inProgress,
    resolved: t.resolved,
    ignored: t.ignored,
  };
  return (
    <Badge className={variants[status] || ''}>
      {labels[status] || status}
    </Badge>
  );
}

export default function AdminAudits() {
  const { language } = useLanguage();
  const { isAuthenticated, isLoading: authLoading, logout } = useAdminAuth();
  const queryClient = useQueryClient();
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [auditType, setAuditType] = useState<string>('full');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const t = translations[language as keyof typeof translations] || translations.en;

  const { data: auditsData, isLoading: auditsLoading } = useQuery({
    queryKey: ['/api/audits'],
    queryFn: async () => {
      const response = await adminApiRequest('GET', '/api/audits?limit=20');
      return response.json();
    },
    enabled: isAuthenticated,
  });

  const { data: latestAuditData, isLoading: latestLoading } = useQuery({
    queryKey: ['/api/audits/latest'],
    queryFn: async () => {
      const response = await adminApiRequest('GET', '/api/audits/latest');
      return response.json();
    },
    enabled: isAuthenticated,
  });

  const { data: selectedAuditData, isLoading: selectedLoading } = useQuery({
    queryKey: ['/api/audits', selectedAuditId],
    queryFn: async () => {
      if (!selectedAuditId) return null;
      const response = await adminApiRequest('GET', `/api/audits/${selectedAuditId}`);
      return response.json();
    },
    enabled: isAuthenticated && !!selectedAuditId,
  });

  const { data: openFindingsData } = useQuery({
    queryKey: ['/api/audits/findings/open'],
    queryFn: async () => {
      const response = await adminApiRequest('GET', '/api/audits/findings/open');
      return response.json();
    },
    enabled: isAuthenticated,
  });

  const { toast } = useToast();

  const runAuditMutation = useMutation({
    mutationFn: async (runType: string) => {
      const response = await adminApiRequest('POST', '/api/audits/run', { runType });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: t.auditStarted,
        description: data.message || t.auditStartedDesc,
      });
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/audits'] });
        queryClient.invalidateQueries({ queryKey: ['/api/audits/latest'] });
        queryClient.invalidateQueries({ queryKey: ['/api/audits/findings/open'] });
      }, 3000);
    },
    onError: (error) => {
      toast({
        title: t.error,
        description: t.auditStartError,
        variant: 'destructive',
      });
    },
  });

  const resolveFindingMutation = useMutation({
    mutationFn: async (findingId: string) => {
      const response = await adminApiRequest('PATCH', `/api/audits/findings/${findingId}`, {
        status: 'resolved',
        resolvedBy: 'manual',
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/audits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/audits', selectedAuditId] });
      queryClient.invalidateQueries({ queryKey: ['/api/audits/findings/open'] });
    },
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const audits: WebsiteAudit[] = auditsData?.audits || [];
  const latestAudit: WebsiteAudit | null = latestAuditData?.audit || null;
  const latestFindings: WebsiteAuditFinding[] = latestAuditData?.findings || [];
  const selectedAudit: WebsiteAudit | null = selectedAuditData?.audit || null;
  const selectedFindings: WebsiteAuditFinding[] = selectedAuditData?.findings || [];
  const openFindings: WebsiteAuditFinding[] = openFindingsData?.findings || [];

  const filteredFindings = (selectedAuditId ? selectedFindings : latestFindings).filter(f => {
    if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
    if (categoryFilter !== 'all' && f.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8" data-testid="admin-audits-page">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t.back}
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
                <ShieldCheck className="h-6 w-6 text-primary" />
                {t.title}
              </h1>
              <p className="text-muted-foreground">{t.subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={auditType} onValueChange={setAuditType}>
              <SelectTrigger className="w-[180px]" data-testid="select-audit-type">
                <SelectValue placeholder={t.auditType} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">{t.fullAudit}</SelectItem>
                <SelectItem value="links_only">{t.linksOnly}</SelectItem>
                <SelectItem value="translations_only">{t.translationsOnly}</SelectItem>
                <SelectItem value="seo_only">{t.seoOnly}</SelectItem>
                <SelectItem value="content_only">{t.contentOnly}</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              onClick={() => runAuditMutation.mutate(auditType)}
              disabled={runAuditMutation.isPending}
              data-testid="button-run-audit"
            >
              {runAuditMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t.runningAudit}
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  {t.runAudit}
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                {t.critical}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-critical-count">
                {latestAudit?.criticalCount || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                {t.high}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-high-count">
                {latestAudit?.highCount || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                {t.medium}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-medium-count">
                {latestAudit?.mediumCount || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-500" />
                {t.low}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-low-count">
                {latestAudit?.lowCount || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {latestAudit && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {t.lastAudit}
              </CardTitle>
              <CardDescription>
                {new Date(latestAudit.startedAt!).toLocaleString(language === 'es' ? 'es-MX' : 'en-US')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{latestAudit.issuesFound}</div>
                  <div className="text-sm text-muted-foreground">{t.issuesFound}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{latestAudit.pagesScanned}</div>
                  <div className="text-sm text-muted-foreground">{t.pagesScanned}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{latestAudit.linksChecked}</div>
                  <div className="text-sm text-muted-foreground">{t.linksChecked}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{latestAudit.translationsChecked}</div>
                  <div className="text-sm text-muted-foreground">{t.translationsChecked}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="findings" className="w-full">
          <TabsList>
            <TabsTrigger value="findings" data-testid="tab-findings">
              {t.findings} ({filteredFindings.length})
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">
              {t.auditHistory} ({audits.length})
            </TabsTrigger>
            <TabsTrigger value="open" data-testid="tab-open">
              {t.openIssues} ({openFindings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="findings" className="space-y-4">
            <div className="flex gap-4">
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-severity-filter">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={t.filterBySeverity} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.all}</SelectItem>
                  <SelectItem value="critical">{t.critical}</SelectItem>
                  <SelectItem value="high">{t.high}</SelectItem>
                  <SelectItem value="medium">{t.medium}</SelectItem>
                  <SelectItem value="low">{t.low}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-category-filter">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={t.filterByCategory} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.all}</SelectItem>
                  <SelectItem value="links">{t.links}</SelectItem>
                  <SelectItem value="translations">{t.translations}</SelectItem>
                  <SelectItem value="content">{t.content}</SelectItem>
                  <SelectItem value="seo">{t.seo}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">{t.severity}</TableHead>
                    <TableHead className="w-[120px]">{t.category}</TableHead>
                    <TableHead>{t.details}</TableHead>
                    <TableHead className="w-[100px]">{t.status}</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFindings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {latestAudit ? t.noAudits : t.runFirstAudit}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFindings.map((finding) => (
                      <TableRow key={finding.id} data-testid={`row-finding-${finding.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getSeverityIcon(finding.severity)}
                            {getSeverityBadge(finding.severity, t)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(finding.category)}
                            <span className="capitalize">{finding.category}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{finding.issueType.replace(/_/g, ' ')}</div>
                            {finding.recommendation && (
                              <div className="text-sm text-muted-foreground">{finding.recommendation}</div>
                            )}
                            {finding.entityType && finding.entityId && (
                              <div className="text-xs text-muted-foreground">
                                {finding.entityType}: {finding.entityId.substring(0, 8)}...
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(finding.status, t)}
                        </TableCell>
                        <TableCell>
                          {finding.status === 'open' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => resolveFindingMutation.mutate(finding.id)}
                              disabled={resolveFindingMutation.isPending}
                              data-testid={`button-resolve-${finding.id}`}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.auditType}</TableHead>
                    <TableHead>{t.startedAt}</TableHead>
                    <TableHead>{t.status}</TableHead>
                    <TableHead>{t.issuesFound}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {audits.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {t.noAudits}
                      </TableCell>
                    </TableRow>
                  ) : (
                    audits.map((audit) => (
                      <TableRow key={audit.id} data-testid={`row-audit-${audit.id}`}>
                        <TableCell className="capitalize">{audit.runType.replace(/_/g, ' ')}</TableCell>
                        <TableCell>
                          {new Date(audit.startedAt!).toLocaleString(language === 'es' ? 'es-MX' : 'en-US')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={audit.status === 'completed' ? 'default' : 'secondary'}>
                            {audit.status === 'running' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                            {audit.status === 'completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                            {audit.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{audit.issuesFound}</span>
                            {(audit.criticalCount || 0) > 0 && (
                              <Badge variant="destructive">{audit.criticalCount} {t.critical}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedAuditId(audit.id)}
                            data-testid={`button-view-${audit.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="open">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">{t.severity}</TableHead>
                    <TableHead className="w-[120px]">{t.category}</TableHead>
                    <TableHead>{t.details}</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {openFindings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        {language === 'es' ? 'No hay problemas abiertos' : 'No open issues'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    openFindings.map((finding) => (
                      <TableRow key={finding.id} data-testid={`row-open-${finding.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getSeverityIcon(finding.severity)}
                            {getSeverityBadge(finding.severity, t)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(finding.category)}
                            <span className="capitalize">{finding.category}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{finding.issueType.replace(/_/g, ' ')}</div>
                            {finding.recommendation && (
                              <div className="text-sm text-muted-foreground">{finding.recommendation}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => resolveFindingMutation.mutate(finding.id)}
                            disabled={resolveFindingMutation.isPending}
                            data-testid={`button-resolve-open-${finding.id}`}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
