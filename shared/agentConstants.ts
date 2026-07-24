/**
 * CANONICAL RUNTIME AGENT INVENTORY
 *
 * This is the single source of truth for agents that can actually be executed
 * by AgentOrchestrator. Infrastructure services such as the orchestrator,
 * Legal Council, Auto Recovery, System Health and System Chronicler are
 * intentionally not counted as runnable content agents.
 */

export const AGENT_CATEGORIES = {
  BRAIN: 'brain',
  HANDS: 'hands',
  SHIELD: 'shield',
} as const;

export type AgentCategory = typeof AGENT_CATEGORIES[keyof typeof AGENT_CATEGORIES];

export const AGENT_IDS = {
  // Analysis and decision support
  CONTENT_ANALYZER: 'content_analyzer',
  CATEGORY_AGENT: 'category_agent',
  METADATA_LINKER: 'metadata_linker',
  LEGAL_ALERTS: 'legal_alerts',

  // Content execution
  FORMATTER: 'formatter',
  POLYGLOT_TRANSLATOR: 'polyglot_translator',
  SEO_OPTIMIZER: 'seo_optimizer',
  IMAGE_SUGGESTION: 'image_suggestion',
  SOCIAL_MEDIA: 'social_media',
  NEWSLETTER: 'newsletter',
  VOICE_AGENT: 'voice_agent',
  PRESENTATION_GENERATOR: 'presentation_generator',

  // Read-only audit
  CONTENT_AUDITOR: 'content_auditor',
  WEBSITE_AUDITOR: 'website_auditor',
} as const;

export type AgentId = typeof AGENT_IDS[keyof typeof AGENT_IDS];

export interface AgentDefinition {
  id: AgentId;
  category: AgentCategory;
  technicalName: string;
  name: string;
  role: string;
  description: string;
  userBenefit: string;
  capabilities: readonly string[];
}

export const AGENT_DEFINITIONS: readonly AgentDefinition[] = [
  {
    id: AGENT_IDS.CONTENT_ANALYZER,
    category: AGENT_CATEGORIES.BRAIN,
    technicalName: 'ContentAnalyzerAgent',
    name: 'Analizador de contenido',
    role: 'Diagnóstico editorial',
    description: 'Analiza artículos y produce recomendaciones editoriales, lingüísticas y de calidad sin publicar contenido.',
    userBenefit: 'Entrega un diagnóstico previo para que el equipo decida qué corregir.',
    capabilities: ['Análisis editorial', 'Detección de menciones', 'Recomendaciones SEO', 'Puntuación de calidad'],
  },
  {
    id: AGENT_IDS.CATEGORY_AGENT,
    category: AGENT_CATEGORIES.BRAIN,
    technicalName: 'CategoryAgent',
    name: 'Clasificador jurídico',
    role: 'Clasificación asistida',
    description: 'Sugiere categorías, prácticas y grupos por industria usando la taxonomía disponible en la base de datos.',
    userBenefit: 'Reduce trabajo manual al organizar publicaciones dentro de la taxonomía institucional.',
    capabilities: ['Clasificación temática', 'Prácticas', 'Industrias', 'Confianza de clasificación'],
  },
  {
    id: AGENT_IDS.METADATA_LINKER,
    category: AGENT_CATEGORIES.BRAIN,
    technicalName: 'MetadataLinkerAgent',
    name: 'Vinculador de metadatos',
    role: 'Relaciones editoriales',
    description: 'Identifica autores y relaciones editoriales candidatas para una publicación.',
    userBenefit: 'Ayuda a conectar cada publicación con sus abogados y áreas relacionadas.',
    capabilities: ['Detección de autores', 'Relaciones con prácticas', 'Relaciones con industrias', 'Metadatos editoriales'],
  },
  {
    id: AGENT_IDS.LEGAL_ALERTS,
    category: AGENT_CATEGORIES.BRAIN,
    technicalName: 'LegalAlertsAgent',
    name: 'Alertas legales',
    role: 'Borradores desde fuentes oficiales',
    description: 'Convierte material de fuentes oficiales permitidas en borradores bilingües sujetos a aprobación humana.',
    userBenefit: 'Acelera la preparación de alertas sin publicarlas automáticamente.',
    capabilities: ['Fuentes oficiales', 'Borrador bilingüe', 'Sanitización', 'Revisión humana'],
  },
  {
    id: AGENT_IDS.FORMATTER,
    category: AGENT_CATEGORIES.HANDS,
    technicalName: 'FormatterAgent',
    name: 'Formateador editorial',
    role: 'Limpieza de contenido',
    description: 'Limpia y estructura texto extraído conservando el lenguaje jurídico.',
    userBenefit: 'Convierte texto desordenado en contenido editable y consistente.',
    capabilities: ['Limpieza de texto', 'Normalización HTML', 'Corrección de saltos', 'Extractos'],
  },
  {
    id: AGENT_IDS.POLYGLOT_TRANSLATOR,
    category: AGENT_CATEGORIES.HANDS,
    technicalName: 'PolyglotTranslatorAgent',
    name: 'Traductor jurídico',
    role: 'Localización multilingüe',
    description: 'Traduce contenido jurídico a los idiomas activos usando glosarios y caché de traducciones.',
    userBenefit: 'Facilita mantener versiones lingüísticas consistentes del contenido.',
    capabilities: ['Traducción jurídica', 'Idiomas activos', 'Glosario institucional', 'Caché'],
  },
  {
    id: AGENT_IDS.SEO_OPTIMIZER,
    category: AGENT_CATEGORIES.HANDS,
    technicalName: 'SEOOptimizerAgent',
    name: 'Optimizador SEO',
    role: 'Recomendaciones de búsqueda',
    description: 'Propone títulos, descripciones, palabras clave y mejoras de indexación.',
    userBenefit: 'Ayuda a mejorar la visibilidad sin sustituir la decisión editorial.',
    capabilities: ['Títulos SEO', 'Metadescripciones', 'Palabras clave', 'Diagnóstico de página'],
  },
  {
    id: AGENT_IDS.IMAGE_SUGGESTION,
    category: AGENT_CATEGORIES.HANDS,
    technicalName: 'ImageSuggestionAgent',
    name: 'Sugerencias visuales',
    role: 'Medios editoriales',
    description: 'Propone o genera una imagen candidata relacionada con una publicación.',
    userBenefit: 'Ofrece alternativas visuales que el editor puede revisar antes de usarlas.',
    capabilities: ['Prompt editorial', 'Generación de imagen', 'Fallback controlado', 'Registro de motor'],
  },
  {
    id: AGENT_IDS.SOCIAL_MEDIA,
    category: AGENT_CATEGORIES.HANDS,
    technicalName: 'SocialMediaAgent',
    name: 'Contenido para redes',
    role: 'Adaptación por canal',
    description: 'Genera borradores adaptados a las redes seleccionadas a partir de noticias existentes.',
    userBenefit: 'Acelera la preparación de publicaciones sociales sin enviarlas.',
    capabilities: ['LinkedIn', 'X', 'Instagram', 'Facebook'],
  },
  {
    id: AGENT_IDS.NEWSLETTER,
    category: AGENT_CATEGORIES.HANDS,
    technicalName: 'NewsletterAgent',
    name: 'Boletín informativo',
    role: 'Compilación editorial',
    description: 'Compila noticias recientes en un borrador de boletín sanitizado.',
    userBenefit: 'Prepara un boletín reutilizando contenido ya publicado.',
    capabilities: ['Selección de noticias', 'Asunto y preheader', 'HTML sanitizado', 'Vista previa'],
  },
  {
    id: AGENT_IDS.VOICE_AGENT,
    category: AGENT_CATEGORIES.HANDS,
    technicalName: 'VoiceAgent',
    name: 'Voz corporativa',
    role: 'Texto a voz',
    description: 'Convierte contenido preparado en audio mediante una voz configurada.',
    userBenefit: 'Permite crear versiones auditivas de contenidos seleccionados.',
    capabilities: ['Texto a voz', 'Limpieza para locución', 'Archivo MP3', 'Trazabilidad'],
  },
  {
    id: AGENT_IDS.PRESENTATION_GENERATOR,
    category: AGENT_CATEGORIES.HANDS,
    technicalName: 'PresentationGeneratorAgent',
    name: 'Generador de presentaciones',
    role: 'Documentos ejecutivos',
    description: 'Estructura y renderiza presentaciones editables a partir de temas y documentos.',
    userBenefit: 'Produce borradores de presentaciones con diseño institucional.',
    capabilities: ['PPTX', 'PDF', 'PNG', 'Estructura editorial'],
  },
  {
    id: AGENT_IDS.CONTENT_AUDITOR,
    category: AGENT_CATEGORIES.SHIELD,
    technicalName: 'ContentAuditorAgent',
    name: 'Auditor de contenido',
    role: 'Control de calidad',
    description: 'Detecta faltantes de contenido, traducción, autoría y formato sin modificar registros.',
    userBenefit: 'Entrega una lista priorizada de problemas editoriales.',
    capabilities: ['Cobertura lingüística', 'Autoría', 'Formato', 'Completitud'],
  },
  {
    id: AGENT_IDS.WEBSITE_AUDITOR,
    category: AGENT_CATEGORIES.SHIELD,
    technicalName: 'WebsiteAuditorAgent',
    name: 'Auditor del sitio',
    role: 'Diagnóstico técnico',
    description: 'Revisa enlaces, imágenes, SEO, traducciones y contenido del sitio.',
    userBenefit: 'Detecta fallos visibles antes de que afecten la experiencia pública.',
    capabilities: ['Enlaces', 'Imágenes', 'SEO', 'Traducciones'],
  },
] as const;

export const AGENT_CATEGORY_MAP = Object.fromEntries(
  AGENT_DEFINITIONS.map((agent) => [agent.id, agent.category]),
) as Record<AgentId, AgentCategory>;

export const EXPECTED_AGENT_COUNTS = {
  [AGENT_CATEGORIES.BRAIN]: AGENT_DEFINITIONS.filter((agent) => agent.category === AGENT_CATEGORIES.BRAIN).length,
  [AGENT_CATEGORIES.HANDS]: AGENT_DEFINITIONS.filter((agent) => agent.category === AGENT_CATEGORIES.HANDS).length,
  [AGENT_CATEGORIES.SHIELD]: AGENT_DEFINITIONS.filter((agent) => agent.category === AGENT_CATEGORIES.SHIELD).length,
  TOTAL: AGENT_DEFINITIONS.length,
} as const;

export const ALL_AGENT_IDS = AGENT_DEFINITIONS.map((agent) => agent.id);

export const BRAIN_AGENT_IDS = AGENT_DEFINITIONS
  .filter((agent) => agent.category === AGENT_CATEGORIES.BRAIN)
  .map((agent) => agent.id);

export const HANDS_AGENT_IDS = AGENT_DEFINITIONS
  .filter((agent) => agent.category === AGENT_CATEGORIES.HANDS)
  .map((agent) => agent.id);

export const SHIELD_AGENT_IDS = AGENT_DEFINITIONS
  .filter((agent) => agent.category === AGENT_CATEGORIES.SHIELD)
  .map((agent) => agent.id);

export function validateAgentInventory(agents: { id: string; category: string }[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const ids = new Set(agents.map((agent) => agent.id));

  if (agents.length !== EXPECTED_AGENT_COUNTS.TOTAL) {
    errors.push(`Expected ${EXPECTED_AGENT_COUNTS.TOTAL} agents, got ${agents.length}`);
  }

  for (const category of Object.values(AGENT_CATEGORIES)) {
    const actual = agents.filter((agent) => agent.category === category).length;
    const expected = EXPECTED_AGENT_COUNTS[category];
    if (actual !== expected) {
      errors.push(`${category}: expected ${expected}, got ${actual}`);
    }
  }

  for (const expectedId of ALL_AGENT_IDS) {
    if (!ids.has(expectedId)) errors.push(`Missing agent: ${expectedId}`);
  }

  for (const agent of agents) {
    if (!ALL_AGENT_IDS.includes(agent.id as AgentId)) {
      errors.push(`Unknown agent: ${agent.id}`);
    }
  }

  return { valid: errors.length === 0, errors };
}
