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
        title: language === 'es' ? 'Auditoría iniciada' : 'Audit Started',
        description: data.message || (language === 'es' 
          ? 'La auditoría se está ejecutando en segundo plano. Actualiza para ver resultados.'
          : 'Audit is running in the background. Refresh to see results.'),
      });
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/audits'] });
        queryClient.invalidateQueries({ queryKey: ['/api/audits/latest'] });
        queryClient.invalidateQueries({ queryKey: ['/api/audits/findings/open'] });
      }, 3000);
    },
    onError: (error) => {
      toast({
        title: language === 'es' ? 'Error' : 'Error',
        description: language === 'es' 
          ? 'No se pudo iniciar la auditoría'
          : 'Failed to start audit',
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
