import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Activity,
  AlertTriangle,
  Bell,
  Bot,
  Brain,
  CheckCircle2,
  ExternalLink,
  FileText,
  Globe,
  Image as ImageIcon,
  Loader2,
  Mail,
  Play,
  Presentation,
  Search,
  Share2,
  Sparkles,
  TrendingUp,
  Users,
  Volume2,
  Wand2,
  Zap,
} from "lucide-react";
import { AGENT_DEFINITIONS, type AgentId } from "@shared/agentConstants";
import { adminApiRequest } from "@/lib/adminAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type AgentFilter = "all" | "article" | "create" | "audit";

interface ArticleOption {
  id: string;
  title?: string | null;
  titleEs?: string | null;
  published?: boolean | null;
}

interface ArticleResponse {
  news: ArticleOption[];
}

interface AgentUseCenterProps {
  registeredAgents?: string[];
}

interface AgentLauncherConfig {
  mode: "article" | "newsletter" | "legal" | "voice" | "presentation" | "audit";
  filter: Exclude<AgentFilter, "all">;
  location: string;
  requirement: string;
  href: string;
  hrefLabel: string;
  persistentResult?: string;
}

const AGENT_ICONS: Record<AgentId, typeof Bot> = {
  content_analyzer: Brain,
  category_agent: Zap,
  metadata_linker: Users,
  legal_alerts: Bell,
  formatter: FileText,
  polyglot_translator: Globe,
  seo_optimizer: TrendingUp,
  image_suggestion: ImageIcon,
  social_media: Share2,
  newsletter: Mail,
  voice_agent: Volume2,
  presentation_generator: Presentation,
  content_auditor: Search,
  website_auditor: AlertTriangle,
};

const LAUNCHERS: Record<AgentId, AgentLauncherConfig> = {
  content_analyzer: {
    mode: "article",
    filter: "article",
    location: "Noticias y publicaciones → detalle del artículo",
    requirement: "Selecciona una noticia o artículo.",
    href: "/admin/news",
    hrefLabel: "Abrir publicaciones",
  },
  category_agent: {
    mode: "article",
    filter: "article",
    location: "Procesamiento de artículos",
    requirement: "Selecciona una publicación. La prueba solo propone categorías.",
    href: "/admin/processing",
    hrefLabel: "Abrir procesamiento",
  },
  metadata_linker: {
    mode: "article",
    filter: "article",
    location: "Procesamiento de artículos",
    requirement: "Selecciona una publicación. La prueba no modifica autores ni relaciones.",
    href: "/admin/processing",
    hrefLabel: "Abrir procesamiento",
  },
  legal_alerts: {
    mode: "legal",
    filter: "create",
    location: "Noticias y publicaciones → Crear alerta",
    requirement: "Pega al menos 40 caracteres de una fuente oficial o introduce su URL.",
    href: "/admin/news",
    hrefLabel: "Abrir publicaciones",
    persistentResult: "Si termina correctamente, crea un borrador permanente de alerta para revisión humana.",
  },
  formatter: {
    mode: "article",
    filter: "article",
    location: "Procesamiento de artículos",
    requirement: "Selecciona una publicación. La prueba devuelve una propuesta sin guardarla.",
    href: "/admin/processing",
    hrefLabel: "Abrir procesamiento",
  },
  polyglot_translator: {
    mode: "article",
    filter: "article",
    location: "Procesamiento de artículos / editor de publicación",
    requirement: "Selecciona una publicación y el idioma de destino.",
    href: "/admin/processing",
    hrefLabel: "Abrir procesamiento",
  },
  seo_optimizer: {
    mode: "article",
    filter: "article",
    location: "Procesamiento de artículos / campos SEO",
    requirement: "Selecciona una publicación. La prueba no aplica los cambios sugeridos.",
    href: "/admin/processing",
    hrefLabel: "Abrir procesamiento",
  },
  image_suggestion: {
    mode: "article",
    filter: "create",
    location: "Editor de publicación / Imágenes generadas por IA",
    requirement: "Selecciona una publicación. Esta prueba puede consumir créditos de imagen.",
    href: "/admin/generated-images",
    hrefLabel: "Ver historial de imágenes",
    persistentResult: "La imagen candidata queda registrada en el historial permanente.",
  },
  social_media: {
    mode: "article",
    filter: "create",
    location: "Editor de publicación → Publicaciones para redes",
    requirement: "Selecciona una publicación; se generan borradores para las cuatro redes.",
    href: "/admin/news",
    hrefLabel: "Abrir publicaciones",
  },
  newsletter: {
    mode: "newsletter",
    filter: "create",
    location: "Noticias y publicaciones → Generar boletín",
    requirement: "Elige el idioma y cuántas publicaciones recientes compilar.",
    href: "/admin/news",
    hrefLabel: "Abrir publicaciones",
  },
  voice_agent: {
    mode: "voice",
    filter: "create",
    location: "Editor de publicación / Audio generado por IA",
    requirement: "Escribe o pega el texto que deseas convertir a voz.",
    href: "/admin/generated-audio",
    hrefLabel: "Ver historial de audio",
    persistentResult: "El MP3 generado queda registrado en el historial permanente.",
  },
  presentation_generator: {
    mode: "presentation",
    filter: "create",
    location: "Presentaciones IA",
    requirement: "Escribe un tema. El uso rápido crea un borrador de 5 diapositivas en PPTX.",
    href: "/admin/presentations",
    hrefLabel: "Abrir configurador completo",
    persistentResult: "La presentación queda registrada en el historial permanente.",
  },
  content_auditor: {
    mode: "audit",
    filter: "audit",
    location: "Auditorías del sitio / historial de trabajos",
    requirement: "No requiere datos. Ejecuta un diagnóstico completo sin modificar contenido.",
    href: "/admin/audits",
    hrefLabel: "Abrir auditorías",
  },
  website_auditor: {
    mode: "audit",
    filter: "audit",
    location: "Auditorías del sitio",
    requirement: "No requiere datos. Revisa enlaces, medios, SEO y traducciones sin aplicar cambios.",
    href: "/admin/audits",
    hrefLabel: "Abrir auditorías",
  },
};

const FILTERS: Array<{ id: AgentFilter; label: string }> = [
  { id: "all", label: "Todos (14)" },
  { id: "article", label: "Trabajar artículos" },
  { id: "create", label: "Crear contenido" },
  { id: "audit", label: "Auditar" },
];

function getArticleLabel(article: ArticleOption): string {
  return String(article.titleEs || article.title || "Publicación sin título").trim();
}

function resultText(result: unknown): string {
  if (!result || typeof result !== "object") return String(result || "Ejecución terminada sin detalles adicionales.");
  const record = result as Record<string, unknown>;
  const data = record.data && typeof record.data === "object" ? record.data as Record<string, unknown> : record;
  const preferred = ["message", "summary", "title", "excerpt", "audioUrl", "pptxUrl", "imageUrl", "error"];
  const lines = preferred
    .filter((key) => typeof data[key] === "string" && String(data[key]).trim())
    .map((key) => `${key === "error" ? "Error" : key}: ${String(data[key])}`);
  return lines.length ? lines.join("\n") : JSON.stringify(data, null, 2);
}

export function AgentUseCenter({ registeredAgents = [] }: AgentUseCenterProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<AgentFilter>("all");
  const [selectedId, setSelectedId] = useState<AgentId>(AGENT_DEFINITIONS[0].id);
  const [articleId, setArticleId] = useState("");
  const [language, setLanguage] = useState<"es" | "en">("es");
  const [limit, setLimit] = useState(8);
  const [sourceText, setSourceText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [voiceText, setVoiceText] = useState("");
  const [topic, setTopic] = useState("");
  const [illustrate, setIllustrate] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const registered = useMemo(() => new Set(registeredAgents), [registeredAgents]);
  const selected = AGENT_DEFINITIONS.find((agent) => agent.id === selectedId) || AGENT_DEFINITIONS[0];
  const launcher = LAUNCHERS[selected.id];

  const filteredAgents = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es-MX");
    return AGENT_DEFINITIONS.filter((agent) => {
      const matchesFilter = filter === "all" || LAUNCHERS[agent.id].filter === filter;
      const searchable = `${agent.name} ${agent.role} ${agent.description} ${agent.capabilities.join(" ")}`.toLocaleLowerCase("es-MX");
      return matchesFilter && (!normalized || searchable.includes(normalized));
    });
  }, [filter, query]);

  const { data: articleData, isLoading: loadingArticles } = useQuery<ArticleResponse>({
    queryKey: ["/api/admin/news", "agent-use-center"],
    queryFn: async () => {
      const response = await adminApiRequest("GET", "/api/admin/news?page=1&limit=100");
      if (!response.ok) throw new Error("No se pudieron cargar las publicaciones.");
      return response.json();
    },
  });

  const buildPayload = (): Record<string, unknown> | null => {
    if (launcher.mode === "article") {
      if (!articleId) return null;
      if (selected.id === "polyglot_translator") {
        return { articleId, targetLanguages: [language], forceRetranslate: false, applyChanges: false };
      }
      if (selected.id === "social_media") {
        return { articleId, platforms: ["linkedin", "twitter", "instagram", "facebook"], aspect: "16:9", language };
      }
      if (["formatter", "metadata_linker", "seo_optimizer", "image_suggestion", "category_agent"].includes(selected.id)) {
        return { articleId, applyChanges: false };
      }
      return { articleId };
    }
    if (launcher.mode === "newsletter") return { limit, language };
    if (launcher.mode === "legal") {
      if (!sourceText.trim() && !sourceUrl.trim()) return null;
      return { sourceText: sourceText.trim() || undefined, sourceUrl: sourceUrl.trim() || undefined, triggeredBy: "manual" };
    }
    if (launcher.mode === "voice") {
      if (!voiceText.trim()) return null;
      return { text: voiceText.trim(), sourceType: "legal_alerts" };
    }
    if (launcher.mode === "presentation") {
      if (!topic.trim()) return null;
      return {
        topic: topic.trim(),
        slideCount: 5,
        lang: language,
        template: "vonwobeser",
        branding: "vonwobeser",
        formats: ["pptx"],
        visuals: illustrate,
        illustrate,
        supportImages: [],
        webSearch: false,
      };
    }
    if (selected.id === "content_auditor") return { scanType: "full" };
    return { runType: "full", applyChanges: false, triggeredBy: "manual" };
  };

  const canRun = Boolean(buildPayload()) && registered.has(selected.id) && !running;

  const runSelectedAgent = async () => {
    const payload = buildPayload();
    if (!payload || running) return;
    setRunning(true);
    setResult(null);
    try {
      const response = await adminApiRequest("POST", `/api/agents/run/${selected.id}`, payload);
      const data = await response.json().catch(() => ({}));
      const successful = response.ok && (data?.success !== false);
      setResult({
        ok: successful,
        text: successful
          ? resultText(data)
          : String(data?.details || data?.error || "El agente no pudo completar la ejecución."),
      });
    } catch (error) {
      setResult({ ok: false, text: error instanceof Error ? error.message : "No se pudo conectar con el agente." });
    } finally {
      setRunning(false);
    }
  };

  return (
    <section className="space-y-5" aria-labelledby="agent-use-center-title">
      <div className="border-l-4 border-primary bg-muted/35 px-5 py-4">
        <div className="flex items-start gap-3">
          <Wand2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h2 id="agent-use-center-title" className="text-xl font-semibold">Centro de uso de los 14 agentes</h2>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Selecciona un agente, prepara lo que necesita y ejecútalo sin abandonar esta pantalla. Las pruebas sobre artículos no aplican cambios automáticamente.
            </p>
            <p className="mt-2 text-xs font-semibold text-foreground">
              Las ejecuciones reales pueden consumir créditos de IA. El gasto aproximado solo es visible para Dueños y Administradores.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre, función o capacidad"
            className="pl-10"
            aria-label="Buscar agentes"
            data-testid="input-search-agents"
          />
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Filtrar agentes">
          {FILTERS.map((item) => (
            <Button
              key={item.id}
              type="button"
              size="sm"
              variant={filter === item.id ? "default" : "outline"}
              onClick={() => setFilter(item.id)}
              aria-pressed={filter === item.id}
              data-testid={`filter-agents-${item.id}`}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(280px,0.78fr)_minmax(0,1.72fr)]">
        <div className="border" aria-label="Agentes disponibles">
          {filteredAgents.map((agent) => {
            const Icon = AGENT_ICONS[agent.id];
            const active = agent.id === selected.id;
            const available = registered.has(agent.id);
            return (
              <button
                key={agent.id}
                type="button"
                className={`flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${active ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted/50"}`}
                onClick={() => {
                  setSelectedId(agent.id);
                  setResult(null);
                }}
                data-testid={`button-select-agent-${agent.id}`}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{agent.name}</span>
                  <span className={`block truncate text-xs ${active ? "text-primary-foreground/75" : "text-muted-foreground"}`}>{agent.role}</span>
                </span>
                <span className={`h-2 w-2 shrink-0 rounded-full ${available ? (active ? "bg-white" : "bg-green-600") : "bg-amber-500"}`} title={available ? "Disponible" : "No registrado"} />
              </button>
            );
          })}
          {filteredAgents.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">No hay agentes que coincidan con la búsqueda.</div>
          )}
        </div>

        <div className="min-w-0 border-t-4 border-primary bg-card px-5 py-6 shadow-sm sm:px-7" data-testid={`agent-runner-${selected.id}`}>
          <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-3">
              {(() => {
                const Icon = AGENT_ICONS[selected.id];
                return <Icon className="mt-1 h-6 w-6 shrink-0 text-primary" aria-hidden="true" />;
              })()}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-2xl font-semibold leading-tight">{selected.name}</h3>
                  <Badge variant={registered.has(selected.id) ? "outline" : "secondary"}>
                    {registered.has(selected.id) ? "Disponible" : "No registrado"}
                  </Badge>
                </div>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{selected.description}</p>
              </div>
            </div>
            <Link href={launcher.href}>
              <Button type="button" variant="outline" className="shrink-0" data-testid={`link-agent-module-${selected.id}`}>
                {launcher.hrefLabel}
                <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 border-b py-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Dónde se usa normalmente</p>
              <p className="mt-1 text-sm">{launcher.location}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Qué necesita</p>
              <p className="mt-1 text-sm">{launcher.requirement}</p>
            </div>
          </div>

          <div className="space-y-5 py-5">
            {launcher.mode === "article" && (
              <div className="space-y-2">
                <Label>Publicación para la prueba</Label>
                <Select value={articleId} onValueChange={setArticleId} disabled={loadingArticles}>
                  <SelectTrigger data-testid="select-agent-article">
                    <SelectValue placeholder={loadingArticles ? "Cargando publicaciones…" : "Selecciona una publicación"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(articleData?.news || []).map((article) => (
                      <SelectItem key={article.id} value={article.id}>
                        {getArticleLabel(article)}{article.published ? " · Publicada" : " · Borrador"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selected.id === "polyglot_translator" && (
                  <div className="max-w-xs pt-3">
                    <Label>Idioma de destino</Label>
                    <Select value={language} onValueChange={(value) => setLanguage(value as "es" | "en")}>
                      <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">Inglés</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {launcher.mode === "newsletter" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="agent-news-limit">Cantidad de publicaciones</Label>
                  <Input id="agent-news-limit" type="number" min={1} max={20} value={limit} onChange={(event) => setLimit(Math.max(1, Math.min(20, Number(event.target.value) || 8)))} />
                </div>
                <div className="space-y-2">
                  <Label>Idioma</Label>
                  <Select value={language} onValueChange={(value) => setLanguage(value as "es" | "en")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="es">Español</SelectItem><SelectItem value="en">Inglés</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {launcher.mode === "legal" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="agent-legal-url">URL oficial (opcional)</Label>
                  <Input id="agent-legal-url" type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://www.gob.mx/…" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agent-legal-text">Texto de la fuente</Label>
                  <Textarea id="agent-legal-text" value={sourceText} onChange={(event) => setSourceText(event.target.value)} rows={6} placeholder="Pega aquí el contenido oficial que deseas convertir en una alerta…" />
                </div>
              </div>
            )}

            {launcher.mode === "voice" && (
              <div className="space-y-2">
                <Label htmlFor="agent-voice-text">Texto para audio</Label>
                <Textarea id="agent-voice-text" value={voiceText} onChange={(event) => setVoiceText(event.target.value)} rows={6} placeholder="Escribe o pega el texto que se convertirá en audio…" />
              </div>
            )}

            {launcher.mode === "presentation" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="agent-presentation-topic">Tema de la presentación</Label>
                  <Textarea id="agent-presentation-topic" value={topic} onChange={(event) => setTopic(event.target.value)} rows={5} placeholder="Ej. Cambios regulatorios relevantes para empresas en México…" />
                </div>
                <div className="flex flex-wrap items-center gap-5">
                  <div className="w-44 space-y-2">
                    <Label>Idioma</Label>
                    <Select value={language} onValueChange={(value) => setLanguage(value as "es" | "en")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="es">Español</SelectItem><SelectItem value="en">Inglés</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <Switch id="agent-presentation-images" checked={illustrate} onCheckedChange={setIllustrate} />
                    <Label htmlFor="agent-presentation-images">Generar imágenes</Label>
                  </div>
                </div>
              </div>
            )}

            {launcher.mode === "audit" && (
              <div className="border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                La ejecución es de solo diagnóstico. No publicará ni modificará contenido.
              </div>
            )}

            {launcher.persistentResult && (
              <p className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300">
                <Activity className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {launcher.persistentResult}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 border-t pt-5">
              <Button type="button" onClick={runSelectedAgent} disabled={!canRun} data-testid={`button-run-agent-${selected.id}`}>
                {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Play className="mr-2 h-4 w-4" aria-hidden="true" />}
                {running ? "Ejecutando agente…" : "Ejecutar uso rápido"}
              </Button>
              {!registered.has(selected.id) && <span className="text-sm text-amber-700">El agente no está disponible en el servidor actual.</span>}
              {launcher.mode === "article" && !articleId && <span className="text-sm text-muted-foreground">Selecciona una publicación para continuar.</span>}
            </div>

            {running && (
              <div className="border-l-4 border-primary bg-muted/35 px-4 py-4" role="status" aria-live="polite">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
                  <div>
                    <p className="font-semibold">{selected.name} está trabajando</p>
                    <p className="text-sm text-muted-foreground">La solicitud tiene límites de tiempo; si algo falla, aquí aparecerá la causa.</p>
                  </div>
                </div>
              </div>
            )}

            {result && !running && (
              <div className={`border-l-4 px-4 py-4 ${result.ok ? "border-green-600 bg-green-50 dark:bg-green-950/20" : "border-destructive bg-destructive/5"}`} role="status" aria-live="polite">
                <div className="flex items-center gap-2">
                  {result.ok ? <CheckCircle2 className="h-5 w-5 text-green-700" aria-hidden="true" /> : <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />}
                  <p className="font-semibold">{result.ok ? "Ejecución completada" : "El agente no pudo completar la prueba"}</p>
                </div>
                <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-foreground">{result.text}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
