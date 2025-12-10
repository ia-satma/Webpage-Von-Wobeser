import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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

const typeLabels = {
  zombie_process: 'Zombie Process',
  incomplete_success: 'Incomplete',
  localization_leakage: 'Localization Leakage',
  orphaned_asset: 'Orphaned Asset',
  missing_translation: 'Missing Translation',
};

export default function AdminHealthCheck() {
  const { toast } = useToast();
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
        title: 'Zombies Reset',
        description: data.message,
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset zombie jobs',
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
          <h1 className="text-2xl font-bold" data-testid="text-page-title">System Health Check</h1>
          <p className="text-muted-foreground">
            Deep audit of database integrity, translations, and content quality
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
            {isFetching ? 'Running Audit...' : 'Run Deep Audit'}
          </Button>
          {report && report.summary.zombieProcesses > 0 && (
            <Button 
              variant="destructive" 
              onClick={() => resetZombiesMutation.mutate()}
              disabled={resetZombiesMutation.isPending}
              data-testid="button-reset-zombies"
            >
              <Skull className="h-4 w-4 mr-2" />
              Reset {report.summary.zombieProcesses} Zombies
            </Button>
          )}
        </div>
      </div>

      {isLoading && !report && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Running initial health check...</span>
          </CardContent>
        </Card>
      )}

      {report && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Health Score
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
                  Total Issues
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
                      {report.summary.criticalCount} Critical
                    </Badge>
                  )}
                  {report.summary.highCount > 0 && (
                    <Badge className="bg-orange-500 text-xs">
                      {report.summary.highCount} High
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Audit Duration
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
                  Last Run
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
                    <p className="text-xs text-muted-foreground">Zombie Processes</p>
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
                    <p className="text-xs text-muted-foreground">Incomplete Success</p>
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
                    <p className="text-xs text-muted-foreground">Localization Leakage</p>
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
                    <p className="text-xs text-muted-foreground">Orphaned Assets</p>
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
                    <p className="text-xs text-muted-foreground">Missing Translations</p>
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
                <span>Issues ({filteredIssues.length})</span>
                {selectedType && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedType(null)}>
                    Clear Filter
                  </Button>
                )}
              </CardTitle>
              <CardDescription>
                Click on issue category cards above to filter
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
                                  {issue.severity.toUpperCase()}
                                </Badge>
                                <Badge variant="outline">
                                  {typeLabels[issue.type]}
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
                                Action: {issue.suggestedAction}
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
                        ? `No ${typeLabels[selectedType as keyof typeof typeLabels]} issues found`
                        : 'No issues found. System is healthy!'}
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
