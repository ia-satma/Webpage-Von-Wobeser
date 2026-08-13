import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth, adminApiRequest, readAdminJson } from "@/lib/adminAuth";
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
  Loader2,
  Share2,
  Mail,
  Bell,
  Volume2,
  Presentation
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AgentUseCenter } from "@/components/admin/AgentUseCenter";
import { AiUsageCard } from "@/components/admin/AiUsageCard";

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

interface JobStats {
  total: number;
  completed: number;
  failed: number;
  pending: number;
}

interface OrchestratorStatus {
  isRunning: boolean;
  queueLength: number;
  activeJobs: number;
  registeredAgents: string[];
  recentJobs: any[];
  recentEvents: any[];
  jobStatsByAgent: Record<string, JobStats>;
}

interface KnowledgeStats {
  totalDocuments: number;
  byAgent: Record<string, number>;
  byCategory?: Record<string, number>;
}

interface EvolutionSummary {
  totalProposals: number;
  byStatus: Record<string, number>;
  recentCycles: any[];
}

interface DatabaseStats {
  recentJobs: number;
  failedJobs: number;
  recentEvents: number;
}

const AGENT_ICONS: Record<string, any> = {
  formatter: FileText,
  metadata_linker: Users,
  polyglot_translator: Globe,
  content_auditor: Search,
  content_analyzer: Brain,
  seo_optimizer: TrendingUp,
  website_auditor: AlertTriangle,
  image_suggestion: Sparkles,
  category_agent: Zap,
  social_media: Share2,
  newsletter: Mail,
  legal_alerts: Bell,
  voice_agent: Volume2,
  presentation_generator: Presentation,
  orchestrator: Bot,
};

const AGENT_NAMES: Record<string, string> = {
  formatter: "Formateador de Artículos",
  metadata_linker: "Enlazador de Metadatos",
  polyglot_translator: "Traductor Multilingüe",
  content_auditor: "Auditor de Contenido",
  content_analyzer: "Analizador de Contenido",
  seo_optimizer: "Optimizador SEO",
  website_auditor: "Auditor del Sitio",
  image_suggestion: "Sugerencia de Imágenes",
  category_agent: "Categorizador",
  social_media: "Redes Sociales",
  newsletter: "Boletín / Newsletter",
  legal_alerts: "Alertas Legales",
  voice_agent: "Generador de Voz",
  presentation_generator: "Generador de Presentaciones",
  orchestrator: "Orquestador",
};

// Descripción tipo manual de cada agente: qué hace y DÓNDE ves el resultado.
const AGENT_DESCRIPTIONS: Record<string, string> = {
  formatter: "Limpia y estructura el texto de un borrador sin copiar un idioma sobre el otro. → Dónde: la propuesta aparece en el trabajo; solo se guarda en la noticia cuando se ejecuta con aplicación de cambios. (usa IA)",
  metadata_linker: "Detecta coincidencias exactas de abogados y sugiere prácticas e industrias de la taxonomía vigente. → Dónde: los candidatos aparecen en el resultado; en borradores puede vincular autores confirmados. (usa IA)",
  polyglot_translator: "Traduce la noticia a los idiomas solicitados manteniendo terminología legal, con caché ligada a la versión exacta del texto fuente. → Dónde: las traducciones aprobadas se ven en 'Traducciones' y en el sitio público. (usa IA)",
  content_auditor: "Revisa noticias y detecta huecos de traducción, autoría y formato de acuerdo con los idiomas activos. → Dónde: el diagnóstico queda en el historial de trabajos del agente. (sin IA)",
  content_analyzer: "Analiza una noticia (calidad, SEO, ortografía, abogados mencionados) y le da una calificación. → Dónde: en el detalle de la noticia (al abrirla desde la lista). (usa IA)",
  seo_optimizer: "Propone títulos, metadescripciones, slug y palabras clave; solo aplica en borradores y cuando el puntaje calculado mejora. → Dónde: resultado del trabajo y campos SEO de la noticia. (usa IA)",
  website_auditor: "Audita enlaces, medios, traducciones, contenido y SEO. Por defecto solo diagnostica; las correcciones reversibles requieren autorización explícita. → Dónde: 'Auditorías del sitio'. (sin IA)",
  image_suggestion: "Genera una imagen candidata y la registra en la biblioteca. Solo la asigna a un borrador con autorización explícita. → Dónde: biblioteca de medios y noticia. (usa IA)",
  category_agent: "Sugiere categoría, prácticas, industrias y etiquetas contra la taxonomía real. Solo guarda la categoría principal en borradores autorizados. → Dónde: resultado del trabajo y editor de noticia. (usa IA)",
  social_media: "Convierte una noticia en borradores ES/EN para las redes elegidas, respetando límites por canal y sin publicar automáticamente. → Dónde: cuadro para copiar al editar una noticia. (usa IA)",
  newsletter: "Compila únicamente noticias publicadas en un boletín ES/EN sanitizado y con enlace de baja. → Dónde: cuadro de boletín en Noticias. (usa IA)",
  legal_alerts: "De una fuente oficial (texto pegado, URL .gob.mx, o automático cada 6h escaneando COFECE) redacta un borrador de alerta. → Dónde: crea una noticia SIN PUBLICAR y te abre su editor; desde el botón 'Crear alerta' en Noticias, o sola en la cola si el escaneo automático encontró algo relevante. (usa IA)",
  voice_agent: "Convierte a audio un texto de boletín, redes o alerta; divide textos largos sin recortarlos silenciosamente. → Dónde: 'Audio generado por IA'. (usa IA)",
  presentation_generator: "Genera una presentación con branding de Von Wobeser a partir de un tema escrito y/o documentos subidos (.pdf/.docx/.pptx/.tex). Descarga en PPTX, PDF y PNG por diapositiva. → Dónde: en su propia pestaña 'Presentaciones IA'. (usa IA)",
  orchestrator: "Coordina la cola de trabajos y ejecuta los agentes en orden. → Dónde: su estado (cola, activos) se ve arriba en esta misma página. (sin IA)",
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
  const { isAuthenticated, isLoading: authLoading, token, role } = useAdminAuth();
  const canViewAiUsage = role === "super_admin" || role === "admin";

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/admin/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const { data: status, isLoading: statusLoading, error: statusError, refetch: refetchStatus } = useQuery<{
    orchestrator: OrchestratorStatus;
    evolution: EvolutionSummary;
    knowledge: KnowledgeStats;
    database: DatabaseStats;
  }>({
    queryKey: ["/api/agents/status"],
    queryFn: async () => {
      const res = await adminApiRequest("GET", "/api/agents/status");
      return readAdminJson<{
        orchestrator: OrchestratorStatus;
        evolution: EvolutionSummary;
        knowledge: KnowledgeStats;
        database: DatabaseStats;
      }>(res, "No se pudo cargar el estado de los agentes.");
    },
    refetchInterval: 5000,
    enabled: isAuthenticated && !!token,
  });

  const { data: proposals } = useQuery<EvolutionProposal[]>({
    queryKey: ["/api/agents/evolution/proposals"],
    queryFn: async () => {
      const res = await adminApiRequest("GET", "/api/agents/evolution/proposals");
      return readAdminJson<EvolutionProposal[]>(res, "No se pudieron cargar las propuestas.");
    },
    enabled: isAuthenticated && !!token,
  });

  const runAuditMutation = useMutation({
    mutationFn: async () => {
      const res = await adminApiRequest("POST", "/api/audits/run", { runType: 'full' });
      return readAdminJson<{ message?: string }>(res, "No se pudo iniciar la auditoría.");
    },
    onSuccess: (data: any) => {
      toast({ 
        title: "Auditoría del sitio iniciada", 
        description: data?.message || "Trabajo de auditoría encolado" 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/agents/status"] });
    },
    onError: (error) => {
      toast({ title: "Falló la auditoría", description: String(error), variant: "destructive" });
    },
  });

  const runLearningCycleMutation = useMutation({
    mutationFn: async () => {
      const res = await adminApiRequest("POST", "/api/agents/evolution/learning-cycle");
      return readAdminJson<{ insights?: unknown[] }>(res, "No se pudo ejecutar el ciclo de aprendizaje.");
    },
    onSuccess: (data: any) => {
      toast({ title: "Ciclo de aprendizaje completado", description: `${data?.insights?.length || 0} hallazgos generados` });
      queryClient.invalidateQueries({ queryKey: ["/api/agents/status"] });
    },
    onError: (error: Error) => {
      toast({ title: "Falló el ciclo de aprendizaje", description: error.message, variant: "destructive" });
    },
  });

  const syncPCloudMutation = useMutation({
    mutationFn: async () => {
      const res = await adminApiRequest("POST", "/api/agents/pcloud/sync");
      return readAdminJson<{ knowledge: boolean; evolution: boolean }>(res, "No se pudo sincronizar a la nube.");
    },
    onSuccess: (data: { knowledge: boolean; evolution: boolean }) => {
      toast({ 
        title: "Sincronización completada", 
        description: `Conocimiento: ${data.knowledge ? 'OK' : 'Falló'}, Evolución: ${data.evolution ? 'OK' : 'Falló'}` 
      });
    },
    onError: () => {
      toast({ title: "Falló la sincronización", variant: "destructive" });
    },
  });

  const startProcessingMutation = useMutation({
    mutationFn: async () => {
      const res = await adminApiRequest("POST", "/api/agents/processing/start");
      return readAdminJson<{ message?: string }>(res, "No se pudo iniciar el procesamiento.");
    },
    onSuccess: () => {
      toast({ title: "Procesamiento iniciado" });
      queryClient.invalidateQueries({ queryKey: ["/api/agents/status"] });
    },
    onError: (error: Error) => {
      toast({ title: "No se pudo iniciar el procesamiento", description: error.message, variant: "destructive" });
    },
  });

  const stopProcessingMutation = useMutation({
    mutationFn: async () => {
      const res = await adminApiRequest("POST", "/api/agents/processing/stop");
      return readAdminJson<{ message?: string }>(res, "No se pudo detener el procesamiento.");
    },
    onSuccess: () => {
      toast({ title: "Procesamiento detenido" });
      queryClient.invalidateQueries({ queryKey: ["/api/agents/status"] });
    },
    onError: (error: Error) => {
      toast({ title: "No se pudo detener el procesamiento", description: error.message, variant: "destructive" });
    },
  });

  const updateProposalMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await adminApiRequest("POST", `/api/agents/evolution/proposals/${id}/status`, { status });
      return readAdminJson<EvolutionProposal>(res, "No se pudo actualizar la propuesta.");
    },
    onSuccess: () => {
      toast({ title: "Propuesta actualizada" });
      queryClient.invalidateQueries({ queryKey: ["/api/agents/evolution/proposals"] });
    },
    onError: (error: Error) => {
      toast({ title: "No se pudo actualizar la propuesta", description: error.message, variant: "destructive" });
    },
  });

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (statusLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando sistema de agentes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="page-admin-agents">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminPageHeader
          title="Sistema de Agentes IA"
          description="Usa, prueba y supervisa los 14 agentes desde un solo lugar"
          icon={Bot}
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchStatus()}
                data-testid="button-refresh-status"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
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
                Sincronizar a la nube
              </Button>
            </>
          }
        />

        {statusError && (
          <Card className="mb-4 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <span>Error al cargar el estado de los agentes: {String(statusError)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Estado del sistema</p>
                  <p className="text-2xl font-bold flex items-center gap-2" data-testid="text-system-status">
                    {status?.orchestrator?.isRunning ? (
                      <>
                        <Activity className="w-5 h-5 text-green-500" />
                        Activo
                      </>
                    ) : (
                      <>
                        <Pause className="w-5 h-5 text-yellow-500" />
                        En pausa
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
              <p className="text-sm text-muted-foreground">Agentes registrados</p>
              <p className="text-2xl font-bold" data-testid="text-agent-count">{status?.orchestrator?.registeredAgents?.length || 0}</p>
              <div className="flex gap-1 mt-2 flex-wrap">
                {status?.orchestrator?.registeredAgents?.map((agent) => {
                  const Icon = AGENT_ICONS[agent] || Bot;
                  return <Icon key={agent} className="w-4 h-4 text-muted-foreground" title={AGENT_NAMES[agent] || agent} />;
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">En cola / Activos</p>
              <p className="text-2xl font-bold" data-testid="text-queue-length">
                {status?.orchestrator?.queueLength || 0} / {status?.orchestrator?.activeJobs || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {status?.database?.recentJobs || 0} trabajos recientes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Conocimiento / Propuestas</p>
              <p className="text-2xl font-bold" data-testid="text-knowledge-count">
                {status?.knowledge?.totalDocuments || 0} / {status?.evolution?.totalProposals || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {status?.database?.failedJobs || 0} trabajos fallidos
              </p>
            </CardContent>
          </Card>
        </div>

        {canViewAiUsage && (
          <div className="mb-8 max-w-sm" data-testid="admin-only-agent-usage">
            <AiUsageCard />
          </div>
        )}

        <Tabs defaultValue="use" className="space-y-4">
          <TabsList className="h-auto flex-wrap justify-start" data-testid="tabs-agent-sections">
            <TabsTrigger value="use" data-testid="tab-agent-use-center">Centro de uso</TabsTrigger>
            <TabsTrigger value="agents" data-testid="tab-agents">Estado de agentes</TabsTrigger>
            <TabsTrigger value="evolution" data-testid="tab-evolution">Evolución</TabsTrigger>
            <TabsTrigger value="jobs" data-testid="tab-jobs">Historial</TabsTrigger>
            <TabsTrigger value="actions" data-testid="tab-actions">Sistema</TabsTrigger>
          </TabsList>

          <TabsContent value="use" className="space-y-4">
            <AgentUseCenter registeredAgents={status?.orchestrator?.registeredAgents || []} />
          </TabsContent>

          <TabsContent value="agents" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {status?.orchestrator?.registeredAgents?.map((agentType) => {
                const Icon = AGENT_ICONS[agentType] || Bot;
                const name = AGENT_NAMES[agentType] || agentType;
                const docs = status?.knowledge?.byAgent?.[agentType] || 0;
                const jobStats = status?.orchestrator?.jobStatsByAgent?.[agentType];
                const totalJobs = jobStats?.total || 0;
                const completedJobs = jobStats?.completed || 0;
                const failedJobs = jobStats?.failed || 0;
                const pendingJobs = jobStats?.pending || 0;
                const successRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;
                
                return (
                  <Card key={agentType} data-testid={`card-agent-${agentType}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Icon className="w-5 h-5 text-primary" />
                        {name}
                      </CardTitle>
                      <CardDescription className="text-xs leading-snug pt-1">
                        {AGENT_DESCRIPTIONS[agentType] || ""}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Trabajos totales</span>
                          <span className="font-medium">{totalJobs}</span>
                        </div>
                        {totalJobs > 0 && (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Tasa de éxito</span>
                              <div className="flex items-center gap-2">
                                <Progress value={successRate} className="w-16 h-2" />
                                <span className="font-medium text-xs">{successRate}%</span>
                              </div>
                            </div>
                            <div className="flex justify-between gap-2">
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                <span className="text-xs text-muted-foreground">{completedJobs}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <XCircle className="w-3 h-3 text-red-500" />
                                <span className="text-xs text-muted-foreground">{failedJobs}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-yellow-500" />
                                <span className="text-xs text-muted-foreground">{pendingJobs}</span>
                              </div>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Docs de conocimiento</span>
                          <span className="font-medium">{docs}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Estado</span>
                          <Badge variant="outline" className={pendingJobs > 0 ? "text-blue-600" : "text-green-600"}>
                            {pendingJobs > 0 ? (
                              <>
                                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                Trabajando
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Listo
                              </>
                            )}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {status?.knowledge?.byCategory && Object.keys(status.knowledge.byCategory).length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Conocimiento por categoría
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 md:grid-cols-4">
                    {Object.entries(status.knowledge.byCategory).map(([category, count]) => (
                      <div key={category} className="flex justify-between items-center p-2 bg-muted/50">
                        <span className="text-sm capitalize">{category.replace(/_/g, ' ')}</span>
                        <Badge variant="secondary">{count as number}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="evolution" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Propuestas de evolución
              </h3>
              <Button 
                variant="outline" 
                onClick={() => runLearningCycleMutation.mutate()}
                disabled={runLearningCycleMutation.isPending}
                data-testid="button-run-learning-cycle"
              >
                <Brain className="w-4 h-4 mr-2" />
                Correr ciclo de aprendizaje
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
                            <Badge variant="outline">impacto {proposal.impact}</Badge>
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
                    <p>Aún no hay propuestas de evolución</p>
                    <p className="text-sm">Corre un ciclo de aprendizaje para generar propuestas</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5" />
                  Trabajos recientes
                  {status?.database?.recentJobs ? (
                    <Badge variant="secondary" className="ml-2">{status.database.recentJobs}</Badge>
                  ) : null}
                </h3>

                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {status?.orchestrator?.recentJobs?.slice().reverse().map((job: any, idx: number) => (
                      <Card key={job.id || idx} className="p-3" data-testid={`job-${job.id || idx}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge className={STATUS_COLORS[job.status] || "bg-gray-500"}>{job.status}</Badge>
                            <span className="font-medium text-sm">{AGENT_NAMES[job.agentType] || job.agentType}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {job.completedAt ? (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(job.completedAt).toLocaleTimeString()}
                              </span>
                            ) : job.startedAt ? (
                              <span className="flex items-center gap-1">
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                En curso
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                En cola
                              </span>
                            )}
                          </div>
                        </div>
                        {job.error && (
                          <p className="text-sm text-red-500 mt-2 truncate" title={job.error}>{job.error}</p>
                        )}
                        {job.result && typeof job.result === 'object' && job.result.success !== undefined && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Resultado: {job.result.success ? 'Éxito' : 'Fallido'}
                          </p>
                        )}
                        {job.copyHistoryId && (
                          <Link
                            href={`/admin/copies-ai?copy=${job.copyHistoryId}`}
                            className="mt-2 inline-flex text-xs font-medium text-primary hover:underline"
                            data-testid={`link-copy-history-${job.id}`}
                          >
                            Ver copy editorial guardado
                          </Link>
                        )}
                      </Card>
                    ))}
                    {(!status?.orchestrator?.recentJobs || status.orchestrator.recentJobs.length === 0) && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Aún no se han ejecutado trabajos</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5" />
                  Eventos recientes
                  {status?.database?.recentEvents ? (
                    <Badge variant="secondary" className="ml-2">{status.database.recentEvents}</Badge>
                  ) : null}
                </h3>

                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {status?.orchestrator?.recentEvents?.slice().reverse().map((event: any, idx: number) => (
                      <Card key={event.id || idx} className="p-3" data-testid={`event-${event.id || idx}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Badge variant="outline" className="shrink-0">{event.type || event.eventType}</Badge>
                            <span className="text-sm truncate">{AGENT_NAMES[event.agentType] || event.agentType}</span>
                          </div>
                          <div className="text-xs text-muted-foreground shrink-0">
                            {event.createdAt && new Date(event.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                        {event.message && (
                          <p className="text-xs text-muted-foreground mt-1 truncate" title={event.message}>{event.message}</p>
                        )}
                      </Card>
                    ))}
                    {(!status?.orchestrator?.recentEvents || status.orchestrator.recentEvents.length === 0) && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Aún no hay eventos registrados</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {status?.database?.failedJobs && status.database.failedJobs > 0 && (
              <Card className="mt-4 border-red-200 dark:border-red-900">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-red-600 dark:text-red-400">
                    <XCircle className="w-4 h-4" />
                    Trabajos fallidos: {status.database.failedJobs}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Hay trabajos fallidos que podrían necesitar atención. Revisa el historial de trabajos para más detalles.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Auditoría de contenido
                  </CardTitle>
                  <CardDescription>
                    Escanea todos los artículos buscando traducciones faltantes, autores y problemas de formato
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
                    Correr auditoría completa
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Ciclo de aprendizaje
                  </CardTitle>
                  <CardDescription>
                    Analiza el desempeño de los agentes y genera propuestas de mejora
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
                    Iniciar aprendizaje
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cloud className="w-5 h-5" />
                    Sincronización en la nube
                  </CardTitle>
                  <CardDescription>
                    Sincroniza el conocimiento y la evolución a pCloud para respaldo
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
                    Sincronizar a pCloud
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Procesar artículos
                  </CardTitle>
                  <CardDescription>
                    Corre el pipeline completo sobre todos los artículos (formatear, enlazar, traducir, optimizar)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/agents/pipeline">
                    <Button className="w-full" data-testid="button-go-pipeline">
                      <Play className="w-4 h-4 mr-2" />
                      Ir al pipeline
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
