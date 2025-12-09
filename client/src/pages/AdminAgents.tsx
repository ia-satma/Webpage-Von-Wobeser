import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/lib/adminAuth";
import { 
  Bot, 
  Activity, 
  Brain, 
  Sparkles, 
  RefreshCw, 
  Play, 
  Pause,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Users,
  Globe,
  Search,
  Zap,
  Cloud,
  CloudOff,
  Lightbulb,
  TrendingUp,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { Link, useLocation } from "wouter";

interface AgentStats {
  agentType: string;
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageExecutionTime: number;
  successRate: number;
  skillCount: number;
  knowledgeDocuments: number;
  evolutionProposals: number;
  lastActive?: string;
}

interface EvolutionProposal {
  id: string;
  agentType: string;
  proposalType: string;
  title: string;
  description: string;
  rationale: string;
  impact: string;
  status: string;
  createdAt: string;
}

interface OrchestratorStatus {
  isRunning: boolean;
  queueLength: number;
  activeJobs: number;
  registeredAgents: string[];
  recentJobs: any[];
  recentEvents: any[];
}

const AGENT_ICONS: Record<string, any> = {
  formatter: FileText,
  metadata_linker: Users,
  polyglot_translator: Globe,
  content_auditor: Search,
  seo_optimizer: TrendingUp,
  orchestrator: Bot,
};

const AGENT_NAMES: Record<string, string> = {
  formatter: "Article Formatter",
  metadata_linker: "Metadata Linker",
  polyglot_translator: "Polyglot Translator",
  content_auditor: "Content Auditor",
  seo_optimizer: "SEO Optimizer",
  orchestrator: "Orchestrator",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500",
  in_progress: "bg-blue-500",
  completed: "bg-green-500",
  failed: "bg-red-500",
  cancelled: "bg-gray-500",
  approved: "bg-green-500",
  rejected: "bg-red-500",
  implemented: "bg-purple-500",
};

export default function AdminAgents() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/admin/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useQuery<{
    orchestrator: OrchestratorStatus;
    evolution: { totalProposals: number; byStatus: Record<string, number>; recentCycles: any[] };
    knowledge: { totalDocuments: number; byAgent: Record<string, number> };
  }>({
    queryKey: ["/api/agents/status"],
    refetchInterval: 5000,
  });

  const { data: proposals } = useQuery<EvolutionProposal[]>({
    queryKey: ["/api/agents/evolution/proposals"],
  });

  const runAuditMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/agents/audit", {});
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: "Audit completed", description: `Found ${data?.data?.totalGaps || 0} gaps` });
      queryClient.invalidateQueries({ queryKey: ["/api/agents/status"] });
    },
    onError: (error) => {
      toast({ title: "Audit failed", description: String(error), variant: "destructive" });
    },
  });

  const runLearningCycleMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/agents/evolution/learning-cycle");
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: "Learning cycle completed", description: `${data?.insights?.length || 0} insights generated` });
      queryClient.invalidateQueries({ queryKey: ["/api/agents/status"] });
    },
  });

  const syncPCloudMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/agents/pcloud/sync");
      return res.json();
    },
    onSuccess: (data: { knowledge: boolean; evolution: boolean }) => {
      toast({ 
        title: "Sync completed", 
        description: `Knowledge: ${data.knowledge ? 'OK' : 'Failed'}, Evolution: ${data.evolution ? 'OK' : 'Failed'}` 
      });
    },
    onError: () => {
      toast({ title: "Sync failed", variant: "destructive" });
    },
  });

  const startProcessingMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/agents/processing/start");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Processing started" });
      queryClient.invalidateQueries({ queryKey: ["/api/agents/status"] });
    },
  });

  const stopProcessingMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/agents/processing/stop");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Processing stopped" });
      queryClient.invalidateQueries({ queryKey: ["/api/agents/status"] });
    },
  });

  const updateProposalMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("POST", `/api/agents/evolution/proposals/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Proposal updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/agents/evolution/proposals"] });
    },
  });

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (statusLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading agent system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="page-admin-agents">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon" data-testid="button-back-admin">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Bot className="w-8 h-8 text-primary" />
                AI Agent System
              </h1>
              <p className="text-muted-foreground">Monitor and control autonomous content improvement agents</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetchStatus()}
              data-testid="button-refresh-status"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncPCloudMutation.mutate()}
              disabled={syncPCloudMutation.isPending}
              data-testid="button-sync-pcloud"
            >
              {syncPCloudMutation.isPending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Cloud className="w-4 h-4 mr-2" />
              )}
              Sync to Cloud
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">System Status</p>
                  <p className="text-2xl font-bold flex items-center gap-2">
                    {status?.orchestrator?.isRunning ? (
                      <>
                        <Activity className="w-5 h-5 text-green-500" />
                        Active
                      </>
                    ) : (
                      <>
                        <Pause className="w-5 h-5 text-yellow-500" />
                        Paused
                      </>
                    )}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={status?.orchestrator?.isRunning ? "destructive" : "default"}
                  onClick={() => status?.orchestrator?.isRunning 
                    ? stopProcessingMutation.mutate() 
                    : startProcessingMutation.mutate()
                  }
                  data-testid="button-toggle-processing"
                >
                  {status?.orchestrator?.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Registered Agents</p>
              <p className="text-2xl font-bold">{status?.orchestrator?.registeredAgents?.length || 0}</p>
              <div className="flex gap-1 mt-2">
                {status?.orchestrator?.registeredAgents?.slice(0, 5).map((agent) => {
                  const Icon = AGENT_ICONS[agent] || Bot;
                  return <Icon key={agent} className="w-4 h-4 text-muted-foreground" />;
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Queue Length</p>
              <p className="text-2xl font-bold">{status?.orchestrator?.queueLength || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {status?.orchestrator?.activeJobs || 0} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Knowledge Docs</p>
              <p className="text-2xl font-bold">{status?.knowledge?.totalDocuments || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {status?.evolution?.totalProposals || 0} proposals
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="agents" className="space-y-4">
          <TabsList data-testid="tabs-agent-sections">
            <TabsTrigger value="agents" data-testid="tab-agents">Agents</TabsTrigger>
            <TabsTrigger value="evolution" data-testid="tab-evolution">Evolution</TabsTrigger>
            <TabsTrigger value="jobs" data-testid="tab-jobs">Jobs</TabsTrigger>
            <TabsTrigger value="actions" data-testid="tab-actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {status?.orchestrator?.registeredAgents?.map((agentType) => {
                const Icon = AGENT_ICONS[agentType] || Bot;
                const name = AGENT_NAMES[agentType] || agentType;
                const docs = status?.knowledge?.byAgent?.[agentType] || 0;
                
                return (
                  <Card key={agentType} data-testid={`card-agent-${agentType}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Icon className="w-5 h-5 text-primary" />
                        {name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Knowledge Docs</span>
                          <span className="font-medium">{docs}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status</span>
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Ready
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="evolution" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Evolution Proposals
              </h3>
              <Button 
                variant="outline" 
                onClick={() => runLearningCycleMutation.mutate()}
                disabled={runLearningCycleMutation.isPending}
                data-testid="button-run-learning-cycle"
              >
                <Brain className="w-4 h-4 mr-2" />
                Run Learning Cycle
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-3 mb-6">
              {Object.entries(status?.evolution?.byStatus || {}).map(([statusKey, count]) => (
                <Card key={statusKey}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <Badge className={STATUS_COLORS[statusKey]}>{statusKey}</Badge>
                      <span className="text-2xl font-bold">{count as number}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {proposals?.map((proposal) => (
                  <Card key={proposal.id} data-testid={`proposal-${proposal.id}`}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={STATUS_COLORS[proposal.status]}>{proposal.status}</Badge>
                            <Badge variant="outline">{proposal.impact} impact</Badge>
                            <Badge variant="secondary">{AGENT_NAMES[proposal.agentType]}</Badge>
                          </div>
                          <h4 className="font-medium">{proposal.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{proposal.description}</p>
                        </div>
                        {proposal.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateProposalMutation.mutate({ id: proposal.id, status: "approved" })}
                              data-testid={`button-approve-${proposal.id}`}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateProposalMutation.mutate({ id: proposal.id, status: "rejected" })}
                              data-testid={`button-reject-${proposal.id}`}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(!proposals || proposals.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No evolution proposals yet</p>
                    <p className="text-sm">Run a learning cycle to generate proposals</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Jobs
            </h3>

            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {status?.orchestrator?.recentJobs?.slice().reverse().map((job: any) => (
                  <Card key={job.id} className="p-3" data-testid={`job-${job.id}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={STATUS_COLORS[job.status]}>{job.status}</Badge>
                        <span className="font-medium">{AGENT_NAMES[job.agentType]}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {job.completedAt ? (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(job.completedAt).toLocaleTimeString()}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            Running
                          </span>
                        )}
                      </div>
                    </div>
                    {job.error && (
                      <p className="text-sm text-red-500 mt-2">{job.error}</p>
                    )}
                  </Card>
                ))}
                {(!status?.orchestrator?.recentJobs || status.orchestrator.recentJobs.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No jobs executed yet</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Content Audit
                  </CardTitle>
                  <CardDescription>
                    Scan all articles for missing translations, authors, and formatting issues
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => runAuditMutation.mutate()}
                    disabled={runAuditMutation.isPending}
                    className="w-full"
                    data-testid="button-run-audit"
                  >
                    {runAuditMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4 mr-2" />
                    )}
                    Run Full Audit
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Learning Cycle
                  </CardTitle>
                  <CardDescription>
                    Analyze agent performance and generate improvement proposals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => runLearningCycleMutation.mutate()}
                    disabled={runLearningCycleMutation.isPending}
                    className="w-full"
                    variant="secondary"
                    data-testid="button-run-learning"
                  >
                    {runLearningCycleMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Start Learning
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cloud className="w-5 h-5" />
                    Cloud Sync
                  </CardTitle>
                  <CardDescription>
                    Sync knowledge and evolution data to pCloud for persistence
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => syncPCloudMutation.mutate()}
                    disabled={syncPCloudMutation.isPending}
                    className="w-full"
                    variant="outline"
                    data-testid="button-cloud-sync"
                  >
                    {syncPCloudMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Cloud className="w-4 h-4 mr-2" />
                    )}
                    Sync to pCloud
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Process Articles
                  </CardTitle>
                  <CardDescription>
                    Run the full pipeline on all articles (format, link, translate, optimize)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/agents/pipeline">
                    <Button className="w-full" data-testid="button-go-pipeline">
                      <Play className="w-4 h-4 mr-2" />
                      Go to Pipeline
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
