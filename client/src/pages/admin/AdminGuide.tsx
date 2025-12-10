import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Bot, 
  Sparkles, 
  FileText, 
  Globe2, 
  Link2, 
  Image, 
  Search, 
  CheckCircle2,
  Zap,
  Database,
  Cloud,
  Brain,
  Target,
  Settings,
  Users,
  BookOpen
} from "lucide-react";

const translations = {
  en: {
    title: "AI Agent Ecosystem Guide",
    subtitle: "Understanding the intelligent content management system",
    overview: "Overview",
    overviewDesc: "This CMS is powered by a sophisticated ecosystem of AI agents that work together to ensure content quality, consistency, and multilingual accessibility.",
    agents: "AI Agents",
    agentsDesc: "Specialized agents that handle specific content tasks",
    workflow: "Workflow",
    workflowDesc: "How content flows through the agent pipeline",
    architecture: "Architecture",
    architectureDesc: "Technical foundation and integration points",
    
    // Agent descriptions
    formatterAgent: "Formatter Agent",
    formatterAgentDesc: "Cleans PDF-extracted articles, fixes broken line breaks, normalizes paragraphs, and removes boilerplate text. Ensures consistent formatting across all content.",
    
    metadataLinkerAgent: "Metadata Linker Agent",
    metadataLinkerAgentDesc: "Analyzes content to automatically link articles with authors, practice areas, and industry groups. Creates intelligent connections between related content.",
    
    polyglotTranslatorAgent: "Polyglot Translator Agent",
    polyglotTranslatorAgentDesc: "Translates content to 10 languages using a specialized legal terminology glossary. Ensures accurate legal translations with smart caching for efficiency.",
    
    contentAuditorAgent: "Content Auditor Agent",
    contentAuditorAgentDesc: "Scans database for content gaps including missing translations, unlinked authors, formatting issues, and broken links. Generates actionable reports.",
    
    seoOptimizerAgent: "SEO Optimizer Agent",
    seoOptimizerAgentDesc: "Improves titles, meta descriptions, slugs, and keywords for search engine optimization. Ensures maximum visibility for all content.",
    
    contentAnalyzerAgent: "Content Analyzer Agent",
    contentAnalyzerAgentDesc: "Comprehensive article analysis using GPT-4. Provides SEO recommendations, categorization, spell checking, lawyer identification, and legal branch classification.",
    
    websiteAuditorAgent: "Website Auditor Agent",
    websiteAuditorAgentDesc: "Continuous site quality monitoring. Detects broken links, missing images, SEO issues, and accessibility problems. Maintains zero-error website standards.",
    
    imageGeneratorAgent: "Image Generator Agent",
    imageGeneratorAgentDesc: "Creates professional images for articles when needed. Generates hero images, feature graphics, and visual content using AI.",
    
    // Workflow steps
    step1: "Content Ingestion",
    step1Desc: "New article is uploaded or created",
    step2: "Formatting",
    step2Desc: "FormatterAgent cleans and normalizes the text",
    step3: "Analysis",
    step3Desc: "ContentAnalyzerAgent categorizes and reviews quality",
    step4: "Metadata Linking",
    step4Desc: "MetadataLinkerAgent connects authors and practice areas",
    step5: "SEO Optimization",
    step5Desc: "SEOOptimizerAgent enhances search visibility",
    step6: "Translation",
    step6Desc: "PolyglotTranslatorAgent creates 9 language versions",
    step7: "Visual Enhancement",
    step7Desc: "ImageGeneratorAgent creates accompanying visuals",
    step8: "Quality Audit",
    step8Desc: "WebsiteAuditorAgent performs final quality check",
    
    // Architecture
    orchestrator: "Agent Orchestrator",
    orchestratorDesc: "Central hub managing job queue, agent coordination, and pipeline execution with priority support",
    knowledgeLayer: "Knowledge Layer",
    knowledgeLayerDesc: "Stores agent learnings, legal glossaries, and insights for continuous improvement",
    skillsLayer: "Skills Layer",
    skillsLayerDesc: "Tracks agent capabilities, expertise levels, and success rates",
    evolutionLayer: "Evolution Layer",
    evolutionLayerDesc: "Agents propose improvements that are tracked and reviewed for implementation",
    cloudPersistence: "Cloud Persistence",
    cloudPersistenceDesc: "Knowledge and evolution data syncs to pCloud for persistence across sessions",
    
    // Languages
    supportedLanguages: "Supported Languages",
    languages: ["English", "Spanish", "German", "Chinese", "Korean", "Japanese", "Arabic", "Russian", "French", "Italian"],
    
    // Status badges
    active: "Active",
    ready: "Ready",
    learning: "Learning"
  },
  es: {
    title: "Guía del Ecosistema de Agentes IA",
    subtitle: "Entendiendo el sistema inteligente de gestión de contenido",
    overview: "Resumen",
    overviewDesc: "Este CMS está impulsado por un sofisticado ecosistema de agentes de IA que trabajan juntos para garantizar la calidad del contenido, la consistencia y la accesibilidad multilingüe.",
    agents: "Agentes IA",
    agentsDesc: "Agentes especializados que manejan tareas específicas de contenido",
    workflow: "Flujo de Trabajo",
    workflowDesc: "Cómo fluye el contenido a través del pipeline de agentes",
    architecture: "Arquitectura",
    architectureDesc: "Base técnica y puntos de integración",
    
    // Agent descriptions
    formatterAgent: "Agente Formateador",
    formatterAgentDesc: "Limpia artículos extraídos de PDF, corrige saltos de línea, normaliza párrafos y elimina texto repetitivo. Asegura formato consistente en todo el contenido.",
    
    metadataLinkerAgent: "Agente de Enlace de Metadatos",
    metadataLinkerAgentDesc: "Analiza contenido para vincular automáticamente artículos con autores, áreas de práctica y grupos industriales. Crea conexiones inteligentes entre contenido relacionado.",
    
    polyglotTranslatorAgent: "Agente Traductor Políglota",
    polyglotTranslatorAgentDesc: "Traduce contenido a 10 idiomas usando un glosario especializado de terminología legal. Garantiza traducciones legales precisas con caché inteligente.",
    
    contentAuditorAgent: "Agente Auditor de Contenido",
    contentAuditorAgentDesc: "Escanea la base de datos en busca de gaps de contenido incluyendo traducciones faltantes, autores sin vincular, problemas de formato y enlaces rotos.",
    
    seoOptimizerAgent: "Agente Optimizador SEO",
    seoOptimizerAgentDesc: "Mejora títulos, meta descripciones, slugs y palabras clave para optimización en motores de búsqueda. Asegura máxima visibilidad para todo el contenido.",
    
    contentAnalyzerAgent: "Agente Analizador de Contenido",
    contentAnalyzerAgentDesc: "Análisis comprehensivo de artículos usando GPT-4. Proporciona recomendaciones SEO, categorización, revisión ortográfica, identificación de abogados y clasificación de ramas legales.",
    
    websiteAuditorAgent: "Agente Auditor del Sitio Web",
    websiteAuditorAgentDesc: "Monitoreo continuo de calidad del sitio. Detecta enlaces rotos, imágenes faltantes, problemas de SEO y accesibilidad. Mantiene estándares de cero errores.",
    
    imageGeneratorAgent: "Agente Generador de Imágenes",
    imageGeneratorAgentDesc: "Crea imágenes profesionales para artículos cuando es necesario. Genera imágenes hero, gráficos destacados y contenido visual usando IA.",
    
    // Workflow steps
    step1: "Ingesta de Contenido",
    step1Desc: "Nuevo artículo es cargado o creado",
    step2: "Formateo",
    step2Desc: "FormatterAgent limpia y normaliza el texto",
    step3: "Análisis",
    step3Desc: "ContentAnalyzerAgent categoriza y revisa calidad",
    step4: "Enlace de Metadatos",
    step4Desc: "MetadataLinkerAgent conecta autores y áreas de práctica",
    step5: "Optimización SEO",
    step5Desc: "SEOOptimizerAgent mejora visibilidad en buscadores",
    step6: "Traducción",
    step6Desc: "PolyglotTranslatorAgent crea 9 versiones en diferentes idiomas",
    step7: "Mejora Visual",
    step7Desc: "ImageGeneratorAgent crea visuales acompañantes",
    step8: "Auditoría de Calidad",
    step8Desc: "WebsiteAuditorAgent realiza verificación final de calidad",
    
    // Architecture
    orchestrator: "Orquestador de Agentes",
    orchestratorDesc: "Centro de control que gestiona cola de trabajos, coordinación de agentes y ejecución de pipeline con soporte de prioridades",
    knowledgeLayer: "Capa de Conocimiento",
    knowledgeLayerDesc: "Almacena aprendizajes de agentes, glosarios legales e insights para mejora continua",
    skillsLayer: "Capa de Habilidades",
    skillsLayerDesc: "Rastrea capacidades de agentes, niveles de experiencia y tasas de éxito",
    evolutionLayer: "Capa de Evolución",
    evolutionLayerDesc: "Los agentes proponen mejoras que son rastreadas y revisadas para implementación",
    cloudPersistence: "Persistencia en la Nube",
    cloudPersistenceDesc: "Conocimiento y datos de evolución se sincronizan a pCloud para persistencia entre sesiones",
    
    // Languages
    supportedLanguages: "Idiomas Soportados",
    languages: ["Inglés", "Español", "Alemán", "Chino", "Coreano", "Japonés", "Árabe", "Ruso", "Francés", "Italiano"],
    
    // Status badges
    active: "Activo",
    ready: "Listo",
    learning: "Aprendiendo"
  }
};

const agents = [
  { icon: FileText, key: "formatterAgent", status: "active" },
  { icon: Link2, key: "metadataLinkerAgent", status: "active" },
  { icon: Globe2, key: "polyglotTranslatorAgent", status: "active" },
  { icon: Search, key: "contentAuditorAgent", status: "active" },
  { icon: Target, key: "seoOptimizerAgent", status: "active" },
  { icon: Brain, key: "contentAnalyzerAgent", status: "active" },
  { icon: CheckCircle2, key: "websiteAuditorAgent", status: "active" },
  { icon: Image, key: "imageGeneratorAgent", status: "ready" },
];

export default function AdminGuide() {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl" data-testid="admin-guide-page">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Bot className="w-10 h-10 text-primary" />
          <h1 className="text-3xl font-bold" data-testid="text-guide-title">{t.title}</h1>
        </div>
        <p className="text-muted-foreground text-lg">{t.subtitle}</p>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4" data-testid="guide-tabs">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <BookOpen className="w-4 h-4 mr-2" />
            {t.overview}
          </TabsTrigger>
          <TabsTrigger value="agents" data-testid="tab-agents">
            <Bot className="w-4 h-4 mr-2" />
            {t.agents}
          </TabsTrigger>
          <TabsTrigger value="workflow" data-testid="tab-workflow">
            <Zap className="w-4 h-4 mr-2" />
            {t.workflow}
          </TabsTrigger>
          <TabsTrigger value="architecture" data-testid="tab-architecture">
            <Settings className="w-4 h-4 mr-2" />
            {t.architecture}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {t.overview}
              </CardTitle>
              <CardDescription>{t.overviewDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Globe2 className="w-5 h-5 text-blue-500" />
                      {t.supportedLanguages}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {t.languages.map((lang, idx) => (
                        <Badge key={idx} variant="secondary">{lang}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="w-5 h-5 text-green-500" />
                      {t.agents}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{t.agentsDesc}</p>
                    <div className="flex gap-2 mt-3">
                      <Badge variant="default" className="bg-green-600">8 {t.active}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.agents}</CardTitle>
              <CardDescription>{t.agentsDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agents.map((agent, idx) => {
                  const Icon = agent.icon;
                  const nameKey = agent.key as keyof typeof t;
                  const descKey = `${agent.key}Desc` as keyof typeof t;
                  return (
                    <Card key={idx} className="hover-elevate" data-testid={`agent-card-${idx}`}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Icon className="w-5 h-5 text-primary" />
                            {t[nameKey] as string}
                          </span>
                          <Badge 
                            variant={agent.status === "active" ? "default" : "secondary"}
                            className={agent.status === "active" ? "bg-green-600" : ""}
                          >
                            {agent.status === "active" ? t.active : t.ready}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{t[descKey] as string}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="workflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.workflow}</CardTitle>
              <CardDescription>{t.workflowDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
                  const stepKey = `step${num}` as keyof typeof t;
                  const stepDescKey = `step${num}Desc` as keyof typeof t;
                  return (
                    <div key={num} className="flex items-start gap-4" data-testid={`workflow-step-${num}`}>
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                        {num}
                      </div>
                      <div className="flex-1 pt-1">
                        <h4 className="font-medium">{t[stepKey] as string}</h4>
                        <p className="text-sm text-muted-foreground">{t[stepDescKey] as string}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="architecture" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.architecture}</CardTitle>
              <CardDescription>{t.architectureDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="orchestrator">
                  <AccordionTrigger className="text-left">
                    <span className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      {t.orchestrator}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {t.orchestratorDesc}
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="knowledge">
                  <AccordionTrigger className="text-left">
                    <span className="flex items-center gap-2">
                      <Database className="w-5 h-5 text-blue-500" />
                      {t.knowledgeLayer}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {t.knowledgeLayerDesc}
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="skills">
                  <AccordionTrigger className="text-left">
                    <span className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-purple-500" />
                      {t.skillsLayer}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {t.skillsLayerDesc}
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="evolution">
                  <AccordionTrigger className="text-left">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-green-500" />
                      {t.evolutionLayer}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {t.evolutionLayerDesc}
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="cloud">
                  <AccordionTrigger className="text-left">
                    <span className="flex items-center gap-2">
                      <Cloud className="w-5 h-5 text-cyan-500" />
                      {t.cloudPersistence}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {t.cloudPersistenceDesc}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
