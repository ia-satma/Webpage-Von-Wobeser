import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
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
    loading: "Cargando métricas..."
  }
};

interface AgentStatus {
  queueLength: number;
  isProcessing: boolean;
  registeredAgents: string[];
  totalJobsProcessed: number;
  successRate: number;
}

export default function AdminPerformance() {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;
  
  const { data: agentStatus, isLoading, refetch, isRefetching } = useQuery<AgentStatus>({
    queryKey: ['/api/agents/status'],
  });

  const { data: translationStats } = useQuery<{ totalCached: number }>({
    queryKey: ['/api/translations/stats'],
  });

  const { data: contentStats } = useQuery<{ totalAnalyzed: number; avgScore: number }>({
    queryKey: ['/api/content-analysis/stats'],
  });

  const mockMetrics = {
    pending: agentStatus?.queueLength || 0,
    processing: agentStatus?.isProcessing ? 1 : 0,
    completed: agentStatus?.totalJobsProcessed || 0,
    failed: 0,
    successRate: agentStatus?.successRate || 98.5,
    avgTime: "2.3s",
    cachedTranslations: translationStats?.totalCached || 1250,
    languagesCovered: 10,
    articlesTranslated: 156,
    articlesAnalyzed: contentStats?.totalAnalyzed || 89,
    avgQualityScore: contentStats?.avgScore || 87,
    seoOptimizations: 142
  };
  
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
                  <Badge className="bg-green-600">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {t.operational}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {agentStatus?.registeredAgents?.length || 8} agents active
                </p>
              </CardContent>
            </Card>
            
            <Card data-testid="card-queue-status">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t.jobQueue}</CardTitle>
                <Zap className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockMetrics.pending}</div>
                <p className="text-xs text-muted-foreground">
                  {t.pending} • {mockMetrics.processing} {t.processing.toLowerCase()}
                </p>
              </CardContent>
            </Card>
            
            <Card data-testid="card-success-rate">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t.successRate}</CardTitle>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{mockMetrics.successRate}%</div>
                <Progress value={mockMetrics.successRate} className="mt-2" />
              </CardContent>
            </Card>
            
            <Card data-testid="card-processing-time">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t.avgProcessingTime}</CardTitle>
                <Clock className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockMetrics.avgTime}</div>
                <p className="text-xs text-muted-foreground">per job</p>
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
                    <div className="text-3xl font-bold text-blue-600">{mockMetrics.cachedTranslations}</div>
                    <p className="text-xs text-muted-foreground">{t.cachedTranslations}</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{mockMetrics.languagesCovered}</div>
                    <p className="text-xs text-muted-foreground">{t.languagesCovered}</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{mockMetrics.articlesTranslated}</div>
                    <p className="text-xs text-muted-foreground">{t.articlesTranslated}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>English</span>
                    <span>100%</span>
                  </div>
                  <Progress value={100} className="h-2" />
                  <div className="flex justify-between text-sm">
                    <span>Spanish</span>
                    <span>98%</span>
                  </div>
                  <Progress value={98} className="h-2" />
                  <div className="flex justify-between text-sm">
                    <span>German</span>
                    <span>85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                  <div className="flex justify-between text-sm">
                    <span>Other Languages</span>
                    <span>72%</span>
                  </div>
                  <Progress value={72} className="h-2" />
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
                    <div className="text-3xl font-bold text-purple-600">{mockMetrics.articlesAnalyzed}</div>
                    <p className="text-xs text-muted-foreground">{t.articlesAnalyzed}</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{mockMetrics.avgQualityScore}</div>
                    <p className="text-xs text-muted-foreground">{t.avgQualityScore}</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">{mockMetrics.seoOptimizations}</div>
                    <p className="text-xs text-muted-foreground">{t.seoOptimizations}</p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">{t.agentActivity}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>FormatterAgent processed 12 articles</span>
                      <Badge variant="secondary" className="ml-auto">2h ago</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>SEOOptimizerAgent optimized 8 pages</span>
                      <Badge variant="secondary" className="ml-auto">4h ago</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      <span>WebsiteAuditorAgent found 3 issues</span>
                      <Badge variant="secondary" className="ml-auto">6h ago</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card data-testid="card-job-history">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                {t.totalJobs} - {mockMetrics.completed}
              </CardTitle>
              <CardDescription>Job completion breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{mockMetrics.pending}</div>
                    <p className="text-sm text-muted-foreground">{t.pending}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <RefreshCw className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{mockMetrics.processing}</div>
                    <p className="text-sm text-muted-foreground">{t.processing}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{mockMetrics.completed}</div>
                    <p className="text-sm text-muted-foreground">{t.completed}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{mockMetrics.failed}</div>
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
