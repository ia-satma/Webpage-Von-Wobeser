import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  BookOpen,
  HelpCircle,
  GraduationCap,
  Layers,
  Network,
  Shield,
  RefreshCw,
  ArrowRight,
  Play,
  Cpu,
  MessageSquare,
  FileEdit,
  Languages,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Workflow
} from "lucide-react";

const translations = {
  en: {
    pageTitle: "Von Wobeser Platform Guide",
    pageSubtitle: "Complete documentation of the AI-powered legal portal ecosystem",
    
    tab1: "Platform Overview",
    tab2: "AI Agent Catalog",
    tab3: "RAG Architecture",
    tab4: "Knowledge Layers",
    tab5: "Tutorials",
    tab6: "FAQ",
    
    platformIntroTitle: "More Than a Website Redesign",
    platformIntroDesc: "The Von Wobeser platform represents a paradigm shift in legal content management. This is not simply a website with a CMS—it is a sophisticated network of specialized AI agents working autonomously to ensure zero operational errors and maximum content quality.",
    
    platformVisionTitle: "Our Vision",
    platformVisionDesc: "\"The best website in Mexico\"—the first legal portal truly supported by ultra-specialized AI agents with zero errors. Every piece of content is automatically processed, optimized, translated, and verified by intelligent agents.",
    
    keyFeaturesTitle: "Key Platform Capabilities",
    feature1: "Autonomous Content Pipeline",
    feature1Desc: "Every article automatically flows through formatting, categorization, SEO optimization, translation to 10 languages, and image generation.",
    feature2: "Zero-Error Guarantee",
    feature2Desc: "Continuous website auditing detects broken links, missing translations, SEO issues, and accessibility problems before users see them.",
    feature3: "Legal-Specialized Translation",
    feature3Desc: "Custom legal glossary ensures accurate terminology across all 10 supported languages with intelligent caching.",
    feature4: "Self-Evolving System",
    feature4Desc: "Agents learn from their work, propose improvements, and continuously enhance their capabilities.",
    feature5: "Brand Compliance",
    feature5Desc: "All generated images follow the Manual de Identidad Corporativa with #AA1A2E burgundy red and professional corporate aesthetics.",
    feature6: "Multi-Language Support",
    feature6Desc: "100% translation coverage in English, Spanish, German, Chinese, Korean, Japanese, Arabic, Russian, French, and Italian.",
    
    agentCatalogTitle: "AI Agent Catalog",
    agentCatalogDesc: "Meet the specialized AI agents that power the Von Wobeser platform",
    
    formatterAgent: "Formatter Agent",
    formatterAgentPurpose: "Content Cleaning & Normalization",
    formatterAgentDesc: "Cleans PDF-extracted articles, fixes broken line breaks, normalizes paragraphs, and removes boilerplate text. Ensures consistent formatting across all content. Uses GPT-4 to intelligently identify and fix formatting issues while preserving legal terminology.",
    formatterAgentCapabilities: "PDF text extraction cleanup, paragraph normalization, boilerplate removal, header/footer detection, consistent spacing",
    
    categoryAgent: "Category Agent",
    categoryAgentPurpose: "Intelligent Classification",
    categoryAgentDesc: "Analyzes article content to automatically classify it into practice areas, industry groups, and legal branches. Uses semantic understanding to identify the most relevant categories for each piece of content.",
    categoryAgentCapabilities: "Practice area detection, industry classification, legal branch identification, tag suggestion, content categorization",
    
    metadataLinkerAgent: "Metadata Linker Agent",
    metadataLinkerPurpose: "Smart Content Connections",
    metadataLinkerAgentDesc: "Analyzes content to automatically link articles with authors, practice areas, and industry groups. Creates intelligent connections between related content, identifying lawyer names within articles and linking them to team member profiles.",
    metadataLinkerCapabilities: "Author identification, practice area linking, industry group matching, related content suggestions, team member detection",
    
    seoOptimizerAgent: "SEO Optimizer Agent",
    seoOptimizerPurpose: "Search Visibility Enhancement",
    seoOptimizerAgentDesc: "Improves titles, meta descriptions, slugs, and keywords for search engine optimization. Ensures maximum visibility for all content while maintaining professional legal tone.",
    seoOptimizerCapabilities: "Title optimization, meta description generation, slug creation, keyword extraction, SEO score calculation",
    
    polyglotTranslatorAgent: "Polyglot Translator Agent",
    polyglotTranslatorPurpose: "Legal Translation Excellence",
    polyglotTranslatorAgentDesc: "Translates content to 10 languages using a specialized legal terminology glossary. Ensures accurate legal translations with smart caching for efficiency. Each translation maintains the formal legal register appropriate for each target language.",
    polyglotTranslatorCapabilities: "10-language translation, legal glossary integration, translation caching, terminology consistency, RTL support (Arabic)",
    
    imageSuggestionAgent: "Image Generator Agent",
    imageSuggestionPurpose: "Visual Content Creation",
    imageSuggestionAgentDesc: "Creates professional images for articles using DALL-E 3. Generates hero images with Von Wobeser brand compliance (#AA1A2E burgundy red, sharp edges, professional corporate aesthetic). Automatically overlays the firm logo on generated images.",
    imageSuggestionCapabilities: "DALL-E 3 generation, brand color compliance, logo overlay, article theme analysis, visual prompt optimization",
    
    contentAuditorAgent: "Content Auditor Agent",
    contentAuditorPurpose: "Quality Assurance",
    contentAuditorAgentDesc: "Scans database for content gaps including missing translations, unlinked authors, formatting issues, and broken links. Generates actionable reports with prioritized recommendations.",
    contentAuditorCapabilities: "Translation gap detection, author verification, format consistency checks, broken link detection, content completeness scoring",
    
    websiteAuditorAgent: "Website Auditor Agent",
    websiteAuditorPurpose: "Continuous Site Monitoring",
    websiteAuditorAgentDesc: "Continuous site quality monitoring. Crawls all pages to detect broken links, missing images, SEO issues, and accessibility problems. Maintains zero-error website standards with automated health checks.",
    websiteAuditorCapabilities: "Page crawling, broken link detection, image verification, SEO analysis, accessibility checking, performance monitoring",
    
    ragArchitectureTitle: "RAG & Agentic Ecosystem Architecture",
    ragArchitectureDesc: "Understanding how agents communicate and collaborate",
    
    ragOverviewTitle: "What is RAG?",
    ragOverviewDesc: "RAG (Retrieval-Augmented Generation) is the foundation of our intelligent system. It combines the power of large language models with a specialized knowledge base of legal information, ensuring that every agent decision is grounded in accurate, firm-specific data.",
    
    agentCommunicationTitle: "Agent Communication Flow",
    agentCommunicationDesc: "Agents don't work in isolation—they form an orchestrated pipeline where each agent's output becomes another's input:",
    
    pipelineStep1: "Article Ingestion",
    pipelineStep1Desc: "New content enters the system via the admin CMS or external import",
    pipelineStep2: "Formatter Agent",
    pipelineStep2Desc: "Cleans and normalizes the raw content",
    pipelineStep3: "Category Agent",
    pipelineStep3Desc: "Classifies into practice areas and industries",
    pipelineStep4: "Metadata Linker",
    pipelineStep4Desc: "Identifies and links authors, related content",
    pipelineStep5: "SEO Optimizer",
    pipelineStep5Desc: "Enhances search visibility and metadata",
    pipelineStep6: "Polyglot Translator",
    pipelineStep6Desc: "Translates to all 9 additional languages",
    pipelineStep7: "Image Generator",
    pipelineStep7Desc: "Creates branded visual content (optional)",
    pipelineStep8: "Quality Audit",
    pipelineStep8Desc: "Final verification and quality scoring",
    
    orchestratorTitle: "The Agent Orchestrator",
    orchestratorDesc: "The central hub that manages the job queue, agent coordination, and pipeline execution. It handles:",
    orchestratorFeature1: "Job Priority Queue: Critical, high, normal, low priority levels",
    orchestratorFeature2: "Parallel Execution: Multiple articles processed simultaneously",
    orchestratorFeature3: "Error Recovery: Automatic retry with exponential backoff",
    orchestratorFeature4: "Progress Tracking: Real-time WebSocket updates to the admin dashboard",
    
    knowledgeLayersTitle: "Knowledge Layer Configuration",
    knowledgeLayersDesc: "How agents learn, remember, and evolve",
    
    knowledgeLayerTitle: "Knowledge Layer",
    knowledgeLayerDesc: "Stores agent learnings, legal glossaries, and insights for continuous improvement. Key components:",
    knowledgeItem1: "Legal Glossary: Specialized terminology in all 10 languages",
    knowledgeItem2: "Agent Insights: Patterns and learnings from past executions",
    knowledgeItem3: "Content Templates: Successful format patterns for different content types",
    knowledgeItem4: "Brand Guidelines: Encoded visual and textual brand rules",
    
    skillsLayerTitle: "Skills Layer",
    skillsLayerDesc: "Tracks agent capabilities, expertise levels, and success rates. Monitors:",
    skillsItem1: "Success Rate: Percentage of successful executions per agent",
    skillsItem2: "Expertise Level: How well each agent performs specific tasks",
    skillsItem3: "Processing Speed: Average time to complete tasks",
    skillsItem4: "Error Patterns: Common failure modes and their solutions",
    
    evolutionLayerTitle: "Evolution Layer",
    evolutionLayerDesc: "Agents propose improvements that are tracked and reviewed for implementation:",
    evolutionItem1: "Improvement Proposals: Agents suggest optimizations based on patterns",
    evolutionItem2: "Admin Review: Proposals require human approval before implementation",
    evolutionItem3: "A/B Testing: New approaches tested against established methods",
    evolutionItem4: "Learning Cycles: Periodic analysis of all agent performance",
    
    cloudPersistenceTitle: "Cloud Persistence (pCloud)",
    cloudPersistenceDesc: "Knowledge and evolution data syncs to pCloud for persistence across sessions. Ensures that agent learnings survive server restarts and can be shared across environments.",
    
    tutorialsTitle: "Platform Tutorials",
    tutorialsDesc: "Step-by-step guides for common tasks",
    
    tutorial1Title: "Processing a New Article",
    tutorial1Steps: [
      "Navigate to Admin > News/Articles in the sidebar",
      "Click 'New Article' or edit an existing one",
      "Enter the content in Spanish (primary) and optionally English",
      "Save the article",
      "Go to 'Article Processing' in the sidebar",
      "Select the article and click 'Process Selected'",
      "Choose whether to include image generation",
      "Monitor the real-time progress in the pipeline modal",
      "Once complete, verify translations in the preview"
    ],
    
    tutorial2Title: "Running a Full Site Audit",
    tutorial2Steps: [
      "Navigate to Admin > Audits in the sidebar",
      "Click 'Run New Audit'",
      "Wait for the crawler to analyze all pages (may take several minutes)",
      "Review the audit results with categorized findings",
      "Address critical issues first (broken links, missing content)",
      "Re-run audit after fixes to verify resolution"
    ],
    
    tutorial3Title: "Managing Translations",
    tutorial3Steps: [
      "Navigate to Admin > Translations in the sidebar",
      "View translation coverage by language",
      "Identify content with missing translations (red indicators)",
      "Click 'Translate' to manually trigger translation for specific items",
      "Review AI-generated translations for accuracy",
      "Edit translations if needed (changes are cached)",
      "Use 'Clear Cache' to regenerate a translation"
    ],
    
    tutorial4Title: "Bulk Processing All Articles",
    tutorial4Steps: [
      "Navigate to Admin > Article Processing",
      "Click 'Process All Articles'",
      "Toggle image generation on/off based on your needs",
      "Confirm the batch operation",
      "Monitor overall progress (this may take significant time for large collections)",
      "Review the summary of processed articles and any failures"
    ],
    
    faqTitle: "Frequently Asked Questions",
    faq1Q: "Why is image generation sometimes slow or failing?",
    faq1A: "DALL-E 3 image generation requires significant API resources. Common issues include: (1) OpenAI rate limits - wait a few minutes between batch operations, (2) Content policy violations - the system will suggest alternative prompts, (3) API credit limits - check your OpenAI billing dashboard. All errors are now logged in detail for debugging.",
    
    faq2Q: "How accurate are the translations?",
    faq2A: "Translations use GPT-4 with a specialized legal glossary to ensure accuracy. However, we recommend having native speakers review critical legal content. The system caches translations, so edits persist across page loads.",
    
    faq3Q: "Can I override the automatic categorization?",
    faq3A: "Yes! Automatic categorization provides suggestions, but you can manually edit practice areas, industry groups, and other metadata in the article editor. Manual changes take precedence over AI suggestions.",
    
    faq4Q: "How often does the website auditor run?",
    faq4A: "Currently, audits are triggered manually from the admin dashboard. You can schedule regular audits or run them after significant content changes. Each audit crawls the entire site and generates a comprehensive report.",
    
    faq5Q: "What happens if an agent fails during the pipeline?",
    faq5A: "The pipeline continues with the remaining agents—one failure doesn't stop the entire process. Failed steps are logged and can be re-run individually. Check the server logs for detailed error messages.",
    
    faq6Q: "How do I add new languages?",
    faq6A: "The current system supports 10 languages. Adding new languages requires updating the translation configuration in the codebase and adding UI translations. Contact the development team for language expansion.",
    
    faq7Q: "What is the Evolution Layer and should I approve proposals?",
    faq7A: "The Evolution Layer contains self-improvement proposals from agents based on patterns they've detected. Review each proposal carefully—approve those that make sense for your content strategy. This is how the system gets smarter over time.",
    
    faq8Q: "How are brand guidelines enforced?",
    faq8A: "All generated images use the Manual de Identidad Corporativa settings (#AA1A2E burgundy red, professional corporate style, sharp edges). The Von Wobeser logo is automatically overlaid on all generated images with a white background for visibility.",
    
    agentStatus: {
      active: "Active",
      ready: "Ready",
      learning: "Learning"
    },
    
    capabilities: "Capabilities",
    purpose: "Purpose"
  },
  es: {
    pageTitle: "Guía de la Plataforma Von Wobeser",
    pageSubtitle: "Documentación completa del ecosistema del portal legal impulsado por IA",
    
    tab1: "Vista General",
    tab2: "Catálogo de Agentes",
    tab3: "Arquitectura RAG",
    tab4: "Capas de Conocimiento",
    tab5: "Tutoriales",
    tab6: "FAQ",
    
    platformIntroTitle: "Más Que un Rediseño Web",
    platformIntroDesc: "La plataforma Von Wobeser representa un cambio de paradigma en la gestión de contenido legal. Esto no es simplemente un sitio web con un CMS—es una red sofisticada de agentes de IA especializados que trabajan de forma autónoma para asegurar cero errores operativos y máxima calidad de contenido.",
    
    platformVisionTitle: "Nuestra Visión",
    platformVisionDesc: "\"El mejor sitio web de México\"—el primer portal legal verdaderamente respaldado por agentes de IA ultra-especializados con cero errores. Cada pieza de contenido es automáticamente procesada, optimizada, traducida y verificada por agentes inteligentes.",
    
    keyFeaturesTitle: "Capacidades Principales de la Plataforma",
    feature1: "Pipeline de Contenido Autónomo",
    feature1Desc: "Cada artículo fluye automáticamente a través de formateo, categorización, optimización SEO, traducción a 10 idiomas y generación de imágenes.",
    feature2: "Garantía de Cero Errores",
    feature2Desc: "Auditoría continua del sitio detecta enlaces rotos, traducciones faltantes, problemas de SEO y accesibilidad antes de que los usuarios los vean.",
    feature3: "Traducción Especializada Legal",
    feature3Desc: "Glosario legal personalizado asegura terminología precisa en los 10 idiomas soportados con caché inteligente.",
    feature4: "Sistema Auto-Evolutivo",
    feature4Desc: "Los agentes aprenden de su trabajo, proponen mejoras y mejoran continuamente sus capacidades.",
    feature5: "Cumplimiento de Marca",
    feature5Desc: "Todas las imágenes generadas siguen el Manual de Identidad Corporativa con rojo burdeos #AA1A2E y estética corporativa profesional.",
    feature6: "Soporte Multi-Idioma",
    feature6Desc: "100% de cobertura de traducción en inglés, español, alemán, chino, coreano, japonés, árabe, ruso, francés e italiano.",
    
    agentCatalogTitle: "Catálogo de Agentes IA",
    agentCatalogDesc: "Conoce a los agentes de IA especializados que impulsan la plataforma Von Wobeser",
    
    formatterAgent: "Agente Formateador",
    formatterAgentPurpose: "Limpieza y Normalización de Contenido",
    formatterAgentDesc: "Limpia artículos extraídos de PDF, corrige saltos de línea rotos, normaliza párrafos y elimina texto repetitivo. Asegura formato consistente en todo el contenido. Usa GPT-4 para identificar y corregir inteligentemente problemas de formato mientras preserva la terminología legal.",
    formatterAgentCapabilities: "Limpieza de texto PDF, normalización de párrafos, eliminación de boilerplate, detección de encabezados/pies, espaciado consistente",
    
    categoryAgent: "Agente de Categorización",
    categoryAgentPurpose: "Clasificación Inteligente",
    categoryAgentDesc: "Analiza el contenido de artículos para clasificarlos automáticamente en áreas de práctica, grupos de industria y ramas legales. Usa comprensión semántica para identificar las categorías más relevantes para cada contenido.",
    categoryAgentCapabilities: "Detección de área de práctica, clasificación industrial, identificación de rama legal, sugerencia de etiquetas, categorización de contenido",
    
    metadataLinkerAgent: "Agente Enlazador de Metadatos",
    metadataLinkerPurpose: "Conexiones Inteligentes de Contenido",
    metadataLinkerAgentDesc: "Analiza contenido para vincular automáticamente artículos con autores, áreas de práctica y grupos industriales. Crea conexiones inteligentes entre contenido relacionado, identificando nombres de abogados dentro de artículos y vinculándolos a perfiles del equipo.",
    metadataLinkerCapabilities: "Identificación de autores, enlace de áreas de práctica, coincidencia de grupos industriales, sugerencias de contenido relacionado, detección de miembros del equipo",
    
    seoOptimizerAgent: "Agente Optimizador SEO",
    seoOptimizerPurpose: "Mejora de Visibilidad en Búsquedas",
    seoOptimizerAgentDesc: "Mejora títulos, meta descripciones, slugs y palabras clave para optimización en motores de búsqueda. Asegura máxima visibilidad para todo el contenido mientras mantiene el tono legal profesional.",
    seoOptimizerCapabilities: "Optimización de títulos, generación de meta descripciones, creación de slugs, extracción de palabras clave, cálculo de puntuación SEO",
    
    polyglotTranslatorAgent: "Agente Traductor Políglota",
    polyglotTranslatorPurpose: "Excelencia en Traducción Legal",
    polyglotTranslatorAgentDesc: "Traduce contenido a 10 idiomas usando un glosario especializado de terminología legal. Asegura traducciones legales precisas con caché inteligente para eficiencia. Cada traducción mantiene el registro legal formal apropiado para cada idioma destino.",
    polyglotTranslatorCapabilities: "Traducción a 10 idiomas, integración de glosario legal, caché de traducciones, consistencia terminológica, soporte RTL (árabe)",
    
    imageSuggestionAgent: "Agente Generador de Imágenes",
    imageSuggestionPurpose: "Creación de Contenido Visual",
    imageSuggestionAgentDesc: "Crea imágenes profesionales para artículos usando DALL-E 3. Genera imágenes hero con cumplimiento de marca Von Wobeser (rojo burdeos #AA1A2E, bordes definidos, estética corporativa profesional). Superpone automáticamente el logo de la firma en las imágenes generadas.",
    imageSuggestionCapabilities: "Generación DALL-E 3, cumplimiento de colores de marca, superposición de logo, análisis de tema del artículo, optimización de prompts visuales",
    
    contentAuditorAgent: "Agente Auditor de Contenido",
    contentAuditorPurpose: "Aseguramiento de Calidad",
    contentAuditorAgentDesc: "Escanea la base de datos en busca de gaps de contenido incluyendo traducciones faltantes, autores sin vincular, problemas de formato y enlaces rotos. Genera informes accionables con recomendaciones priorizadas.",
    contentAuditorCapabilities: "Detección de gaps de traducción, verificación de autores, revisiones de consistencia de formato, detección de enlaces rotos, puntuación de completitud de contenido",
    
    websiteAuditorAgent: "Agente Auditor del Sitio Web",
    websiteAuditorPurpose: "Monitoreo Continuo del Sitio",
    websiteAuditorAgentDesc: "Monitoreo continuo de calidad del sitio. Rastrea todas las páginas para detectar enlaces rotos, imágenes faltantes, problemas de SEO y accesibilidad. Mantiene estándares de cero errores con verificaciones de salud automatizadas.",
    websiteAuditorCapabilities: "Rastreo de páginas, detección de enlaces rotos, verificación de imágenes, análisis SEO, revisión de accesibilidad, monitoreo de rendimiento",
    
    ragArchitectureTitle: "Arquitectura RAG y Ecosistema Agéntico",
    ragArchitectureDesc: "Entendiendo cómo se comunican y colaboran los agentes",
    
    ragOverviewTitle: "¿Qué es RAG?",
    ragOverviewDesc: "RAG (Generación Aumentada por Recuperación) es la base de nuestro sistema inteligente. Combina el poder de grandes modelos de lenguaje con una base de conocimiento especializada en información legal, asegurando que cada decisión de agente esté fundamentada en datos precisos y específicos de la firma.",
    
    agentCommunicationTitle: "Flujo de Comunicación entre Agentes",
    agentCommunicationDesc: "Los agentes no trabajan aislados—forman un pipeline orquestado donde la salida de cada agente se convierte en la entrada de otro:",
    
    pipelineStep1: "Ingesta de Artículo",
    pipelineStep1Desc: "Nuevo contenido entra al sistema vía el CMS admin o importación externa",
    pipelineStep2: "Agente Formateador",
    pipelineStep2Desc: "Limpia y normaliza el contenido crudo",
    pipelineStep3: "Agente de Categorización",
    pipelineStep3Desc: "Clasifica en áreas de práctica e industrias",
    pipelineStep4: "Enlazador de Metadatos",
    pipelineStep4Desc: "Identifica y vincula autores, contenido relacionado",
    pipelineStep5: "Optimizador SEO",
    pipelineStep5Desc: "Mejora visibilidad en búsquedas y metadatos",
    pipelineStep6: "Traductor Políglota",
    pipelineStep6Desc: "Traduce a los 9 idiomas adicionales",
    pipelineStep7: "Generador de Imágenes",
    pipelineStep7Desc: "Crea contenido visual de marca (opcional)",
    pipelineStep8: "Auditoría de Calidad",
    pipelineStep8Desc: "Verificación final y puntuación de calidad",
    
    orchestratorTitle: "El Orquestador de Agentes",
    orchestratorDesc: "El centro de control que gestiona la cola de trabajos, coordinación de agentes y ejecución del pipeline. Maneja:",
    orchestratorFeature1: "Cola de Prioridad de Trabajos: Niveles crítico, alto, normal y bajo",
    orchestratorFeature2: "Ejecución Paralela: Múltiples artículos procesados simultáneamente",
    orchestratorFeature3: "Recuperación de Errores: Reintentos automáticos con backoff exponencial",
    orchestratorFeature4: "Seguimiento de Progreso: Actualizaciones WebSocket en tiempo real al dashboard admin",
    
    knowledgeLayersTitle: "Configuración de Capas de Conocimiento",
    knowledgeLayersDesc: "Cómo los agentes aprenden, recuerdan y evolucionan",
    
    knowledgeLayerTitle: "Capa de Conocimiento",
    knowledgeLayerDesc: "Almacena aprendizajes de agentes, glosarios legales e insights para mejora continua. Componentes clave:",
    knowledgeItem1: "Glosario Legal: Terminología especializada en los 10 idiomas",
    knowledgeItem2: "Insights de Agentes: Patrones y aprendizajes de ejecuciones pasadas",
    knowledgeItem3: "Plantillas de Contenido: Patrones de formato exitosos para diferentes tipos de contenido",
    knowledgeItem4: "Guías de Marca: Reglas visuales y textuales de marca codificadas",
    
    skillsLayerTitle: "Capa de Habilidades",
    skillsLayerDesc: "Rastrea capacidades de agentes, niveles de expertise y tasas de éxito. Monitorea:",
    skillsItem1: "Tasa de Éxito: Porcentaje de ejecuciones exitosas por agente",
    skillsItem2: "Nivel de Expertise: Qué tan bien cada agente realiza tareas específicas",
    skillsItem3: "Velocidad de Procesamiento: Tiempo promedio para completar tareas",
    skillsItem4: "Patrones de Error: Modos comunes de falla y sus soluciones",
    
    evolutionLayerTitle: "Capa de Evolución",
    evolutionLayerDesc: "Los agentes proponen mejoras que son rastreadas y revisadas para implementación:",
    evolutionItem1: "Propuestas de Mejora: Los agentes sugieren optimizaciones basadas en patrones",
    evolutionItem2: "Revisión Admin: Las propuestas requieren aprobación humana antes de implementación",
    evolutionItem3: "Pruebas A/B: Nuevos enfoques probados contra métodos establecidos",
    evolutionItem4: "Ciclos de Aprendizaje: Análisis periódico del rendimiento de todos los agentes",
    
    cloudPersistenceTitle: "Persistencia en la Nube (pCloud)",
    cloudPersistenceDesc: "Conocimiento y datos de evolución se sincronizan a pCloud para persistencia entre sesiones. Asegura que los aprendizajes de agentes sobrevivan reinicios del servidor y puedan compartirse entre entornos.",
    
    tutorialsTitle: "Tutoriales de la Plataforma",
    tutorialsDesc: "Guías paso a paso para tareas comunes",
    
    tutorial1Title: "Procesar un Nuevo Artículo",
    tutorial1Steps: [
      "Navega a Admin > Noticias/Artículos en la barra lateral",
      "Haz clic en 'Nuevo Artículo' o edita uno existente",
      "Ingresa el contenido en español (primario) y opcionalmente en inglés",
      "Guarda el artículo",
      "Ve a 'Procesamiento de Artículos' en la barra lateral",
      "Selecciona el artículo y haz clic en 'Procesar Seleccionados'",
      "Elige si incluir generación de imágenes",
      "Monitorea el progreso en tiempo real en el modal del pipeline",
      "Una vez completo, verifica las traducciones en la vista previa"
    ],
    
    tutorial2Title: "Ejecutar una Auditoría Completa del Sitio",
    tutorial2Steps: [
      "Navega a Admin > Auditorías en la barra lateral",
      "Haz clic en 'Ejecutar Nueva Auditoría'",
      "Espera a que el crawler analice todas las páginas (puede tomar varios minutos)",
      "Revisa los resultados de la auditoría con hallazgos categorizados",
      "Aborda primero los problemas críticos (enlaces rotos, contenido faltante)",
      "Re-ejecuta la auditoría después de las correcciones para verificar resolución"
    ],
    
    tutorial3Title: "Gestionar Traducciones",
    tutorial3Steps: [
      "Navega a Admin > Traducciones en la barra lateral",
      "Ve la cobertura de traducción por idioma",
      "Identifica contenido con traducciones faltantes (indicadores rojos)",
      "Haz clic en 'Traducir' para disparar manualmente la traducción de ítems específicos",
      "Revisa las traducciones generadas por IA para precisión",
      "Edita traducciones si es necesario (los cambios se cachean)",
      "Usa 'Limpiar Caché' para regenerar una traducción"
    ],
    
    tutorial4Title: "Procesamiento Masivo de Todos los Artículos",
    tutorial4Steps: [
      "Navega a Admin > Procesamiento de Artículos",
      "Haz clic en 'Procesar Todos los Artículos'",
      "Activa/desactiva generación de imágenes según tus necesidades",
      "Confirma la operación en lote",
      "Monitorea el progreso general (esto puede tomar tiempo significativo para colecciones grandes)",
      "Revisa el resumen de artículos procesados y cualquier falla"
    ],
    
    faqTitle: "Preguntas Frecuentes",
    faq1Q: "¿Por qué la generación de imágenes a veces es lenta o falla?",
    faq1A: "La generación de imágenes DALL-E 3 requiere recursos significativos de API. Problemas comunes incluyen: (1) Límites de tasa de OpenAI - espera unos minutos entre operaciones en lote, (2) Violaciones de política de contenido - el sistema sugerirá prompts alternativos, (3) Límites de crédito API - verifica tu dashboard de facturación de OpenAI. Todos los errores ahora se registran en detalle para depuración.",
    
    faq2Q: "¿Qué tan precisas son las traducciones?",
    faq2A: "Las traducciones usan GPT-4 con un glosario legal especializado para asegurar precisión. Sin embargo, recomendamos que hablantes nativos revisen contenido legal crítico. El sistema cachea traducciones, así que las ediciones persisten entre cargas de página.",
    
    faq3Q: "¿Puedo anular la categorización automática?",
    faq3A: "¡Sí! La categorización automática provee sugerencias, pero puedes editar manualmente áreas de práctica, grupos industriales y otros metadatos en el editor de artículos. Los cambios manuales tienen precedencia sobre las sugerencias de IA.",
    
    faq4Q: "¿Con qué frecuencia se ejecuta el auditor del sitio web?",
    faq4A: "Actualmente, las auditorías se disparan manualmente desde el dashboard admin. Puedes programar auditorías regulares o ejecutarlas después de cambios significativos de contenido. Cada auditoría rastrea todo el sitio y genera un informe comprensivo.",
    
    faq5Q: "¿Qué pasa si un agente falla durante el pipeline?",
    faq5A: "El pipeline continúa con los agentes restantes—una falla no detiene todo el proceso. Los pasos fallidos se registran y pueden re-ejecutarse individualmente. Revisa los logs del servidor para mensajes de error detallados.",
    
    faq6Q: "¿Cómo agrego nuevos idiomas?",
    faq6A: "El sistema actual soporta 10 idiomas. Agregar nuevos idiomas requiere actualizar la configuración de traducción en el código y agregar traducciones de UI. Contacta al equipo de desarrollo para expansión de idiomas.",
    
    faq7Q: "¿Qué es la Capa de Evolución y debo aprobar propuestas?",
    faq7A: "La Capa de Evolución contiene propuestas de auto-mejora de agentes basadas en patrones que han detectado. Revisa cada propuesta cuidadosamente—aprueba aquellas que tengan sentido para tu estrategia de contenido. Así es como el sistema se vuelve más inteligente con el tiempo.",
    
    faq8Q: "¿Cómo se aplican las guías de marca?",
    faq8A: "Todas las imágenes generadas usan la configuración del Manual de Identidad Corporativa (rojo burdeos #AA1A2E, estilo corporativo profesional, bordes definidos). El logo de Von Wobeser se superpone automáticamente en todas las imágenes generadas con fondo blanco para visibilidad.",
    
    agentStatus: {
      active: "Activo",
      ready: "Listo",
      learning: "Aprendiendo"
    },
    
    capabilities: "Capacidades",
    purpose: "Propósito"
  }
};

const agents = [
  { icon: FileText, key: "formatterAgent", status: "active", color: "text-blue-500" },
  { icon: Layers, key: "categoryAgent", status: "active", color: "text-purple-500" },
  { icon: Link2, key: "metadataLinkerAgent", status: "active", color: "text-green-500" },
  { icon: Target, key: "seoOptimizerAgent", status: "active", color: "text-orange-500" },
  { icon: Languages, key: "polyglotTranslatorAgent", status: "active", color: "text-cyan-500" },
  { icon: Image, key: "imageSuggestionAgent", status: "active", color: "text-pink-500" },
  { icon: Search, key: "contentAuditorAgent", status: "active", color: "text-yellow-500" },
  { icon: Shield, key: "websiteAuditorAgent", status: "active", color: "text-red-500" },
];

const pipelineSteps = [
  { icon: FileEdit, stepKey: "pipelineStep1", color: "bg-gray-500" },
  { icon: FileText, stepKey: "pipelineStep2", color: "bg-blue-500" },
  { icon: Layers, stepKey: "pipelineStep3", color: "bg-purple-500" },
  { icon: Link2, stepKey: "pipelineStep4", color: "bg-green-500" },
  { icon: Target, stepKey: "pipelineStep5", color: "bg-orange-500" },
  { icon: Globe2, stepKey: "pipelineStep6", color: "bg-cyan-500" },
  { icon: Image, stepKey: "pipelineStep7", color: "bg-pink-500" },
  { icon: CheckCircle2, stepKey: "pipelineStep8", color: "bg-emerald-500" },
];

export default function AdminGuide() {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl" data-testid="admin-guide-page">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Bot className="w-10 h-10 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-2" data-testid="text-guide-title">{t.pageTitle}</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t.pageSubtitle}</p>
      </div>
      
      <Tabs defaultValue="platform" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6" data-testid="guide-tabs">
          <TabsTrigger value="platform" data-testid="tab-platform">
            <Sparkles className="w-4 h-4 mr-2 hidden sm:inline" />
            {t.tab1}
          </TabsTrigger>
          <TabsTrigger value="agents" data-testid="tab-agents">
            <Bot className="w-4 h-4 mr-2 hidden sm:inline" />
            {t.tab2}
          </TabsTrigger>
          <TabsTrigger value="architecture" data-testid="tab-architecture">
            <Network className="w-4 h-4 mr-2 hidden sm:inline" />
            {t.tab3}
          </TabsTrigger>
          <TabsTrigger value="knowledge" data-testid="tab-knowledge">
            <Database className="w-4 h-4 mr-2 hidden sm:inline" />
            {t.tab4}
          </TabsTrigger>
          <TabsTrigger value="tutorials" data-testid="tab-tutorials">
            <GraduationCap className="w-4 h-4 mr-2 hidden sm:inline" />
            {t.tab5}
          </TabsTrigger>
          <TabsTrigger value="faq" data-testid="tab-faq">
            <HelpCircle className="w-4 h-4 mr-2 hidden sm:inline" />
            {t.tab6}
          </TabsTrigger>
        </TabsList>
        
        {/* TAB 1: PLATFORM OVERVIEW */}
        <TabsContent value="platform" className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{t.platformIntroTitle}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-lg leading-relaxed">{t.platformIntroDesc}</p>
              
              <Separator className="my-6" />
              
              <div className="bg-primary/5 p-6 rounded-lg border border-primary/10">
                <div className="flex items-start gap-4">
                  <Target className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{t.platformVisionTitle}</h3>
                    <p className="text-muted-foreground italic">{t.platformVisionDesc}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                {t.keyFeaturesTitle}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((num) => {
                  const featureKey = `feature${num}` as keyof typeof t;
                  const featureDescKey = `feature${num}Desc` as keyof typeof t;
                  const icons = [Workflow, Shield, Languages, RefreshCw, Image, Globe2];
                  const Icon = icons[num - 1];
                  const colors = ["text-blue-500", "text-green-500", "text-purple-500", "text-orange-500", "text-pink-500", "text-cyan-500"];
                  
                  return (
                    <Card key={num} className="hover-elevate" data-testid={`feature-card-${num}`}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Icon className={`w-5 h-5 ${colors[num - 1]}`} />
                          {t[featureKey] as string}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{t[featureDescKey] as string}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* TAB 2: AGENT CATALOG */}
        <TabsContent value="agents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-6 h-6 text-primary" />
                {t.agentCatalogTitle}
              </CardTitle>
              <CardDescription>{t.agentCatalogDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {agents.map((agent, idx) => {
                const Icon = agent.icon;
                const nameKey = agent.key as keyof typeof t;
                const purposeKey = `${agent.key}Purpose` as keyof typeof t;
                const descKey = `${agent.key}Desc` as keyof typeof t;
                const capabilitiesKey = `${agent.key}Capabilities` as keyof typeof t;
                
                return (
                  <Card key={idx} className="hover-elevate" data-testid={`agent-detail-${idx}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-muted`}>
                            <Icon className={`w-6 h-6 ${agent.color}`} />
                          </div>
                          <div>
                            <span>{t[nameKey] as string}</span>
                            <p className="text-sm font-normal text-muted-foreground mt-0.5">
                              {t.purpose}: {t[purposeKey] as string}
                            </p>
                          </div>
                        </CardTitle>
                        <Badge 
                          variant="default"
                          className="bg-green-600"
                        >
                          {t.agentStatus.active}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-muted-foreground">{t[descKey] as string}</p>
                      <div>
                        <p className="text-sm font-medium mb-2">{t.capabilities}:</p>
                        <div className="flex flex-wrap gap-2">
                          {(t[capabilitiesKey] as string)?.split(', ').map((cap, capIdx) => (
                            <Badge key={capIdx} variant="outline" className="text-xs">
                              {cap}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* TAB 3: RAG ARCHITECTURE */}
        <TabsContent value="architecture" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="w-6 h-6 text-primary" />
                {t.ragArchitectureTitle}
              </CardTitle>
              <CardDescription>{t.ragArchitectureDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-500" />
                  {t.ragOverviewTitle}
                </h3>
                <p className="text-muted-foreground">{t.ragOverviewDesc}</p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Workflow className="w-5 h-5 text-blue-500" />
                  {t.agentCommunicationTitle}
                </h3>
                <p className="text-muted-foreground mb-6">{t.agentCommunicationDesc}</p>
                
                <div className="relative">
                  {pipelineSteps.map((step, idx) => {
                    const Icon = step.icon;
                    const stepKey = step.stepKey as keyof typeof t;
                    const stepDescKey = `${step.stepKey}Desc` as keyof typeof t;
                    
                    return (
                      <div key={idx} className="flex items-start gap-4 mb-4" data-testid={`pipeline-step-${idx}`}>
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-lg ${step.color} text-white flex items-center justify-center`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          {idx < pipelineSteps.length - 1 && (
                            <div className="w-0.5 h-8 bg-border mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pt-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{idx + 1}</Badge>
                            <h4 className="font-medium">{t[stepKey] as string}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{t[stepDescKey] as string}</p>
                        </div>
                        {idx < pipelineSteps.length - 1 && (
                          <ArrowRight className="w-5 h-5 text-muted-foreground/50 mt-2 hidden lg:block" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <Separator />
              
              <div className="bg-yellow-500/10 p-6 rounded-lg border border-yellow-500/20">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-yellow-500" />
                  {t.orchestratorTitle}
                </h3>
                <p className="text-muted-foreground mb-4">{t.orchestratorDesc}</p>
                <ul className="space-y-2">
                  {[t.orchestratorFeature1, t.orchestratorFeature2, t.orchestratorFeature3, t.orchestratorFeature4].map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-yellow-500 mt-1 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* TAB 4: KNOWLEDGE LAYERS */}
        <TabsContent value="knowledge" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-6 h-6 text-primary" />
                {t.knowledgeLayersTitle}
              </CardTitle>
              <CardDescription>{t.knowledgeLayersDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="knowledge">
                  <AccordionTrigger className="text-left">
                    <span className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <Database className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <span className="font-semibold">{t.knowledgeLayerTitle}</span>
                      </div>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pl-14">
                    <p className="text-muted-foreground mb-4">{t.knowledgeLayerDesc}</p>
                    <ul className="space-y-2">
                      {[t.knowledgeItem1, t.knowledgeItem2, t.knowledgeItem3, t.knowledgeItem4].map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="skills">
                  <AccordionTrigger className="text-left">
                    <span className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <Brain className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <span className="font-semibold">{t.skillsLayerTitle}</span>
                      </div>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pl-14">
                    <p className="text-muted-foreground mb-4">{t.skillsLayerDesc}</p>
                    <ul className="space-y-2">
                      {[t.skillsItem1, t.skillsItem2, t.skillsItem3, t.skillsItem4].map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <BarChart3 className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="evolution">
                  <AccordionTrigger className="text-left">
                    <span className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <Sparkles className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <span className="font-semibold">{t.evolutionLayerTitle}</span>
                      </div>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pl-14">
                    <p className="text-muted-foreground mb-4">{t.evolutionLayerDesc}</p>
                    <ul className="space-y-2">
                      {[t.evolutionItem1, t.evolutionItem2, t.evolutionItem3, t.evolutionItem4].map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <RefreshCw className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="cloud">
                  <AccordionTrigger className="text-left">
                    <span className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cyan-500/10">
                        <Cloud className="w-5 h-5 text-cyan-500" />
                      </div>
                      <div>
                        <span className="font-semibold">{t.cloudPersistenceTitle}</span>
                      </div>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pl-14">
                    <p className="text-muted-foreground">{t.cloudPersistenceDesc}</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* TAB 5: TUTORIALS */}
        <TabsContent value="tutorials" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-primary" />
                {t.tutorialsTitle}
              </CardTitle>
              <CardDescription>{t.tutorialsDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {[1, 2, 3, 4].map((num) => {
                  const titleKey = `tutorial${num}Title` as keyof typeof t;
                  const stepsKey = `tutorial${num}Steps` as keyof typeof t;
                  const icons = [FileText, Search, Languages, Zap];
                  const Icon = icons[num - 1];
                  const colors = ["text-blue-500", "text-orange-500", "text-purple-500", "text-green-500"];
                  
                  return (
                    <AccordionItem key={num} value={`tutorial-${num}`}>
                      <AccordionTrigger className="text-left" data-testid={`tutorial-trigger-${num}`}>
                        <span className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-muted">
                            <Icon className={`w-5 h-5 ${colors[num - 1]}`} />
                          </div>
                          <span className="font-semibold">{t[titleKey] as string}</span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pl-14">
                        <ol className="space-y-3">
                          {(t[stepsKey] as string[]).map((step, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center font-medium">
                                {idx + 1}
                              </div>
                              <span className="text-sm text-muted-foreground pt-0.5">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* TAB 6: FAQ */}
        <TabsContent value="faq" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-primary" />
                {t.faqTitle}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
                  const qKey = `faq${num}Q` as keyof typeof t;
                  const aKey = `faq${num}A` as keyof typeof t;
                  
                  return (
                    <AccordionItem key={num} value={`faq-${num}`} data-testid={`faq-item-${num}`}>
                      <AccordionTrigger className="text-left">
                        <span className="flex items-center gap-3">
                          <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span>{t[qKey] as string}</span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pl-7">
                        <p className="text-muted-foreground">{t[aKey] as string}</p>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
