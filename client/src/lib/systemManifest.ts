/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  SYSTEM MANIFEST - PLATAFORMA LEGAL INTELIGENTE VON WOBESER Y SIERRA        ║
 * ║  "El Portal Jurídico más Avanzado de México" - Powered by AI Agents         ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  Este documento contiene el inventario técnico completo del ecosistema       ║
 * ║  de agentes autónomos, infraestructura de seguridad, y módulos públicos      ║
 * ║  que conforman la plataforma digital de la Firma.                            ║
 * ║                                                                               ║
 * ║  Última Actualización: Diciembre 2024                                         ║
 * ║  Versión del Manifest: 3.0 - "Sistema Nervioso Digital"                      ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

export type SystemCategory = 
  | 'ai_brain'        // El Cerebro - Agentes de Decisión Estratégica
  | 'ai_hands'        // Las Manos - Agentes de Ejecución Operativa
  | 'ai_shield'       // El Escudo - Agentes de Protección y Auditoría
  | 'infrastructure'  // Columna Vertebral - Infraestructura Crítica
  | 'security'        // Bóveda Digital - Seguridad y Cumplimiento
  | 'public_site'     // Vitrina Institucional - Portal Público
  | 'admin_system';   // Centro de Mando - Administración Empresarial

export type SystemStatus = 'production' | 'beta' | 'development';

export interface SystemFeature {
  id: string;
  category: SystemCategory;
  name: string;
  technicalName: string;
  technicalDetail: string;
  userBenefit: string;
  status: SystemStatus;
  keyCapabilities: string[];
  technicalSpecs?: {
    model?: string;
    temperature?: number;
    concurrency?: number;
    retryPolicy?: string;
    languages?: string[];
    [key: string]: unknown;
  };
}

export interface SystemManifestTranslations {
  categories: Record<SystemCategory, { title: string; description: string }>;
  statuses: Record<SystemStatus, string>;
  features: Record<string, { name: string; benefit: string; capabilities: string[] }>;
  ui: {
    searchPlaceholder: string;
    exportReport: string;
    exportSuccess: string;
    technicalDetails: string;
    capabilities: string;
    status: string;
    noResults: string;
    allCategories: string;
    totalAgents: string;
    totalModules: string;
    totalInfrastructure: string;
    generatedOn: string;
    systemOverview: string;
    reportTitle: string;
    reportSubtitle: string;
  };
}

// ════════════════════════════════════════════════════════════════════════════════
// 🧠 EL CEREBRO - AGENTES DE DECISIÓN ESTRATÉGICA (6 Agentes)
// ════════════════════════════════════════════════════════════════════════════════

export const AI_BRAIN_AGENTS: SystemFeature[] = [
  {
    id: 'orchestrator',
    category: 'ai_brain',
    name: 'Centro Neuronal de Orquestación',
    technicalName: 'AgentOrchestrator',
    technicalDetail: 'Sistema nervioso central con cola de prioridad cuádruple (Crítico/Alto/Normal/Bajo), persistencia híbrida memoria-base de datos, coordinación paralela de agentes, reintento exponencial (2s × 2 multiplicador), recuperación automática de trabajos con resetInProgressJobsToPending() al reinicio.',
    userBenefit: 'Operación autónoma 24/7 sin intervención humana. Garantiza cero pérdida de trabajos durante mantenimiento y previene conflictos entre agentes. El corazón que late incansablemente.',
    status: 'production',
    keyCapabilities: [
      'Programación con prioridad cuádruple',
      'Recuperación automática tras reinicio',
      'Coordinación paralela de multi-agentes',
      'Monitoreo en tiempo real de la cola',
      'Sincronización bidireccional BD-Memoria',
    ],
    technicalSpecs: {
      processingInterval: '1000ms',
      priorityLevels: 4,
      retryPolicy: '2s base × 2 multiplier',
      persistence: 'hybrid',
    },
  },
  {
    id: 'legal_council',
    category: 'ai_brain',
    name: 'Consejo de Gobernanza Digital',
    technicalName: 'LegalCouncilService',
    technicalDetail: 'Protocolo de Arbitraje Algorítmico Asíncrono. Tres redes neuronales especializadas (Erudito Legal, Analista de Riesgo, Guardián de Marca) auditan cada contenido con Promise.allSettled para aislamiento a prueba de fallos. Esquema VoteResult con puntuación 0-100, inyección de Abstención Sistémica para agentes fallidos.',
    userBenefit: 'Garantiza la **Soberanía Humana Total** mediante validación por pares algorítmicos. Cada artículo pasa por un tribunal de 3 jueces de IA antes de publicación, protegiendo la reputación institucional.',
    status: 'production',
    keyCapabilities: [
      'Consejo de 3 agentes evaluadores',
      'Puntuación de riesgo institucional',
      'Votos individuales con razonamiento',
      'Feedback consolidado para editores',
      'Aislamiento a prueba de fallos',
    ],
    technicalSpecs: {
      model: 'gpt-4o-mini',
      temperature: 0.3,
      concurrency: 3,
      agents: ['Legal Scholar', 'Risk Analyst', 'Brand Guardian'],
    },
  },
  {
    id: 'content_analyzer',
    category: 'ai_brain',
    name: 'Analizador de Inteligencia de Contenido',
    technicalName: 'ContentAnalyzerAgent',
    technicalDetail: 'GPT-4o con modo JSON, análisis de 18 ramas jurídicas + 15 industrias, revisión ortográfica/gramatical con esquema SpellingGrammarIssue, extracción de menciones de abogados con contexto, recomendaciones SEO (keywords/título/meta/encabezados), puntuación de calidad 0-100.',
    userBenefit: 'Inteligencia profunda que permite optimización SEO automática, categorización sin intervención editorial, y priorización de trabajo basada en puntuación de calidad. Reduce 80% del tiempo de clasificación manual.',
    status: 'production',
    keyCapabilities: [
      'Extracción de keywords SEO',
      'Clasificación en 18 ramas jurídicas',
      'Revisión ortográfica y gramatical',
      'Puntuación de calidad (0-100)',
      'Detección de menciones de abogados',
    ],
    technicalSpecs: {
      model: 'gpt-4o',
      temperature: 0.3,
      maxTokens: 8000,
      concurrency: 2,
    },
  },
  {
    id: 'category_agent',
    category: 'ai_brain',
    name: 'Agente de Taxonomía Inteligente',
    technicalName: 'CategoryAgent',
    technicalDetail: 'GPT-4o-mini con modo JSON, mapeo a practiceGroups/industryGroups/blogCategories existentes, 16 áreas de práctica + 7 sectores industriales, generación de 5 tags por artículo, puntuación de confianza, creación automática de categorías nuevas.',
    userBenefit: 'Elimina el trabajo manual de etiquetado, asegura taxonomía consistente en todo el contenido, y mejora la descubribilidad mediante categorización inteligente basada en contexto legal.',
    status: 'production',
    keyCapabilities: [
      'Auto-categorización contextual',
      'Mapeo a 16 áreas de práctica',
      'Mapeo a 7 sectores industriales',
      '5 tags SEO por artículo',
      'Creación dinámica de categorías',
    ],
    technicalSpecs: {
      model: 'gpt-4o-mini',
      temperature: 0.3,
      concurrency: 3,
    },
  },
  {
    id: 'metadata_linker',
    category: 'ai_brain',
    name: 'Vinculador de Metadatos Relacionales',
    technicalName: 'MetadataLinkerAgent',
    technicalDetail: 'GPT-4o, extracción de patrones de autor → coincidencia fuzzy por apellido vía ilike, matching de slugs de áreas de práctica, matching de slugs de grupos industriales, creación de relaciones en tabla de unión newsTeamMembers.',
    userBenefit: 'Atribución automática contenido-autor, enlaces cruzados entre artículos y áreas de práctica, mejora del SEO mediante internal linking inteligente. Los socios aparecen vinculados automáticamente a sus publicaciones.',
    status: 'production',
    keyCapabilities: [
      'Auto-detección de autores',
      'Vinculación a áreas de práctica',
      'Vinculación a grupos industriales',
      'Internal linking para SEO',
      'Matching fuzzy de nombres',
    ],
    technicalSpecs: {
      model: 'gpt-4o',
      concurrency: 5,
    },
  },
  {
    id: 'system_chronicler',
    category: 'ai_brain',
    name: 'Cronista del Sistema Evolutivo',
    technicalName: 'SystemChronicler',
    technicalDetail: 'Meta-agente con registro de 14 tarjetas de capacidad, agrupación por categoría (cerebro/manos/escudo), tracking de nivel de evolución (1-5), monitoreo de estado (activo/dormido/evolucionando), persistencia JSON (system_evolution.json).',
    userBenefit: 'Sistema auto-documentado que habilita la visualización del Centro Nervioso en Vivo y rastrea la historia de evolución de agentes para insights de mejora continua.',
    status: 'production',
    keyCapabilities: [
      'Registro de 14 agentes',
      'Tracking de evolución (1-5)',
      'Monitoreo de estado en tiempo real',
      'Persistencia de historia',
      'Auto-documentación del sistema',
    ],
  },
];

// ════════════════════════════════════════════════════════════════════════════════
// 🤲 LAS MANOS - AGENTES DE EJECUCIÓN OPERATIVA (4 Agentes)
// ════════════════════════════════════════════════════════════════════════════════

export const AI_HANDS_AGENTS: SystemFeature[] = [
  {
    id: 'polyglot_translator',
    category: 'ai_hands',
    name: 'Motor Neuronal de Localización Semántica',
    technicalName: 'PolyglotTranslatorAgent',
    technicalDetail: 'GPT-4o con temperatura 0.3, soporte para 10 jurisdicciones lingüísticas (EN/ES/DE/ZH/KO/JA/AR/RU/FR/IT), inyección de glosario jurídico desde tabla agentKnowledge (500+ términos), detección de idioma fuente (prioridad español), caché de traducciones en tabla translationCache.',
    userBenefit: 'Barreras de contención anti-"Spanglish" que garantizan 100% de cobertura en los 10 idiomas. Reduce costos de API 90% vía caché inteligente mientras mantiene precisión jurídica impecable.',
    status: 'production',
    keyCapabilities: [
      'Traducción a 10 jurisdicciones',
      'Glosario legal con 500+ términos',
      'Reducción de costos 90% vía caché',
      'Precisión terminológica jurídica',
      'Detección automática de idioma fuente',
    ],
    technicalSpecs: {
      model: 'gpt-4o',
      temperature: 0.3,
      concurrency: 2,
      languages: ['en', 'es', 'de', 'zh', 'ko', 'ja', 'ar', 'ru', 'fr', 'it'],
    },
  },
  {
    id: 'smart_image_generator',
    category: 'ai_hands',
    name: 'Sintetizador Visual con Escudo Legal',
    technicalName: 'SmartImageGenerator + ImageSuggestionAgent',
    technicalDetail: 'DALL-E 3 primario → Gemini 2.5 Flash fallback → Placeholder garantizado. Sanitización de políticas de contenido (28 términos legales sensibles → reemplazos abstractos), inyección de color de marca (#AA1A2E), overlay de logo con Sharp (150px sobre fondo blanco, esquina inferior derecha).',
    userBenefit: 'Generación gráfica con "Sanitización Legal" que reinterpreta conceptos sensibles para asegurar integridad institucional. Previene bloqueos de publicación por censura de IA y garantiza 100% de uptime visual.',
    status: 'production',
    keyCapabilities: [
      'Fallback de 3 motores de imagen',
      'Sanitización de 28 términos sensibles',
      'Overlay automático de logo VWS',
      'Garantía 100% de generación',
      'Inyección de paleta corporativa',
    ],
    technicalSpecs: {
      primaryEngine: 'DALL-E 3',
      fallbackEngine: 'Gemini 2.5 Flash',
      sanitizedTerms: 28,
      logoSize: '150px',
      brandColor: '#AA1A2E',
    },
  },
  {
    id: 'seo_optimizer',
    category: 'ai_hands',
    name: 'Agente de Posicionamiento Orgánico',
    technicalName: 'SEOOptimizerAgent',
    technicalDetail: 'GPT-4o, optimización de título (50-60 caracteres), generación de meta descripción (150-160 caracteres), sugerencia de slug (3-5 keywords), extracción de keywords bilingüe (EN/ES), cálculo de puntuación SEO con delta de mejora.',
    userBenefit: 'Visibilidad de mercado maximizada mediante optimización automática para motores de búsqueda. Estrategia bilingüe de keywords asegura visibilidad en búsquedas en inglés y español.',
    status: 'production',
    keyCapabilities: [
      'Optimización de título (50-60 chars)',
      'Meta descriptions (150-160 chars)',
      'Keywords bilingües EN/ES',
      'Tracking de puntuación SEO',
      'Sugerencia de slugs semánticos',
    ],
    technicalSpecs: {
      model: 'gpt-4o',
      titleLength: '50-60 chars',
      metaLength: '150-160 chars',
    },
  },
  {
    id: 'formatter',
    category: 'ai_hands',
    name: 'Formateador de Contenido Jurídico',
    technicalName: 'FormatterAgent',
    technicalDetail: 'GPT-4o con temperatura 0.2, eliminación de artefactos PDF (marcadores de página, pies, boilerplate), pre-limpieza regex (dirección Von Wobeser, números de página), lógica de merge/split de párrafos, extracción de excerpt (primeras 2-3 oraciones).',
    userBenefit: 'Transforma extractos crudos de PDF en contenido listo para publicación, elimina trabajo manual de formateo, y preserva precisión legal mientras mejora legibilidad.',
    status: 'production',
    keyCapabilities: [
      'Eliminación de artefactos PDF',
      'Reestructuración de párrafos',
      'Generación automática de excerpt',
      'Limpieza de boilerplate',
      'Preservación de precisión legal',
    ],
    technicalSpecs: {
      model: 'gpt-4o',
      temperature: 0.2,
    },
  },
];

// ════════════════════════════════════════════════════════════════════════════════
// 🛡️ EL ESCUDO - AGENTES DE PROTECCIÓN Y AUDITORÍA (4 Agentes)
// ════════════════════════════════════════════════════════════════════════════════

export const AI_SHIELD_AGENTS: SystemFeature[] = [
  {
    id: 'auto_recovery',
    category: 'ai_shield',
    name: 'Arquitectura de Auto-Curación (Self-Healing)',
    technicalName: 'AutoRecoveryAgent',
    technicalDetail: 'Escaneo de processingStatus=failed|error, detección de campo failedStep (image/translate/seo/metadata/format), reintento autónomo con delegación a agente especializado, asignación de placeholder para ítems irrecuperables, registro de auditoría en objetos RecoveryResult.',
    userBenefit: 'Resiliencia operativa que reduce intervención manual a cero. Previene contenido estancado indefinidamente, garantizando cero artículos zombie en el pipeline.',
    status: 'production',
    keyCapabilities: [
      'Detección de artículos fallidos',
      'Lógica de reintento autónomo',
      'Fallback a placeholders',
      'Registro de auditoría de recuperación',
      'Delegación inteligente a agentes',
    ],
    technicalSpecs: {
      scanInterval: 'On-demand',
      failedSteps: ['image', 'translate', 'seo', 'metadata', 'format', 'council'],
    },
  },
  {
    id: 'system_health',
    category: 'ai_shield',
    name: 'Monitor de Salud Sistémica',
    technicalName: 'SystemHealthCheck',
    technicalDetail: 'Auditoría profunda de 5 tipos de issue (zombie_process/incomplete_success/localization_leakage/orphaned_asset/missing_translation), detección de idioma vía scoring de densidad regex, detección zombie: trabajos >10min en in_progress, puntuación de salud ponderada (critical=10, high=5, medium=2, low=1).',
    userBenefit: 'Telemetría operativa en tiempo real con detección proactiva de issues antes de impacto al usuario. Puntuación de salud cuantificada habilita reportes SLA y métricas de confianza del sistema.',
    status: 'production',
    keyCapabilities: [
      'Detección de procesos zombie (>10min)',
      'Escaneo de contaminación de idiomas',
      'Detección de assets huérfanos',
      'Cálculo de puntuación de salud',
      '5 tipos de diagnóstico',
    ],
    technicalSpecs: {
      issueTypes: 5,
      zombieThreshold: '10 minutes',
      severityWeights: { critical: 10, high: 5, medium: 2, low: 1 },
    },
  },
  {
    id: 'content_auditor',
    category: 'ai_shield',
    name: 'Auditor de Completitud de Contenido',
    technicalName: 'ContentAuditorAgent',
    technicalDetail: 'Escaneo completo de base de datos para gaps de contenido, 5 tipos de gap (missing_translation/missing_author/poor_formatting/missing_excerpt/short_content), priorización por severidad (high→medium→low), generación de tareas de remediación.',
    userBenefit: 'Garantía de completitud de contenido que identifica gaps editoriales antes de publicación y genera tareas de remediación accionables automáticamente.',
    status: 'production',
    keyCapabilities: [
      'Detección de 5 tipos de gap',
      'Auditoría de cobertura de traducción',
      'Auditoría de vinculación de autores',
      'Generación de tareas',
      'Priorización por severidad',
    ],
    technicalSpecs: {
      model: 'gpt-4o',
      temperature: 0.2,
      concurrency: 1,
    },
  },
  {
    id: 'website_auditor',
    category: 'ai_shield',
    name: 'Auditor de Calidad Web Integral',
    technicalName: 'WebsiteAuditorAgent',
    technicalDetail: '6 módulos de auditoría (links/navigation/translations/performance/seo/content), escaneo multi-entidad (team_members/news/practice_groups/industry_groups), clasificación de severidad (critical/high/medium/low), persistencia de hallazgos con vinculación a jobs de remediación.',
    userBenefit: 'Aseguramiento de calidad web comprehensivo que reemplaza testing manual. QA automatizado con pipeline de issue-to-fix integrado.',
    status: 'production',
    keyCapabilities: [
      '6 módulos de auditoría',
      'Escaneo multi-entidad',
      'Clasificación de severidad',
      'Vinculación a remediación',
      'Persistencia de hallazgos',
    ],
  },
];

// ════════════════════════════════════════════════════════════════════════════════
// 🔐 BÓVEDA DIGITAL - INFRAESTRUCTURA DE SEGURIDAD (7 Módulos)
// ════════════════════════════════════════════════════════════════════════════════

export const SECURITY_INFRASTRUCTURE: SystemFeature[] = [
  {
    id: 'rate_limiter',
    category: 'security',
    name: 'Guardián de Tasa de Peticiones',
    technicalName: 'RateLimitMiddleware',
    technicalDetail: 'Rate limiting por IP/identifier con ventana de 15 minutos (WINDOW_MS), máximo 5 intentos (MAX_ATTEMPTS), bloqueo de 30 minutos (BLOCK_DURATION_MS), limpieza automática de entradas expiradas cada hora, registro de intentos con timestamp.',
    userBenefit: 'Protección contra ataques de fuerza bruta y abuso de endpoints. Garantiza disponibilidad del servicio y protege credenciales de usuarios.',
    status: 'production',
    keyCapabilities: [
      'Ventana de 15 minutos',
      'Máximo 5 intentos',
      'Bloqueo automático 30 minutos',
      'Limpieza horaria de entradas',
      'Tracking por identificador',
    ],
    technicalSpecs: {
      windowMs: 900000,
      maxAttempts: 5,
      blockDurationMs: 1800000,
      cleanupInterval: 3600000,
    },
  },
  {
    id: 'auth_system',
    category: 'security',
    name: 'Bastión de Autenticación Empresarial',
    technicalName: 'AuthMiddleware + SessionManager',
    technicalDetail: 'Hashing bcrypt con 12 rondas de sal (SALT_ROUNDS), tokens de sesión de 32 bytes (TOKEN_BYTES), duración de sesión 24 horas, validación Bearer token, verificación de expiración, attach de usuario a request, logout automático de sesiones inválidas.',
    userBenefit: 'Seguridad de grado empresarial para protección de acceso administrativo. Tokens criptográficamente seguros y sesiones con expiración automática.',
    status: 'production',
    keyCapabilities: [
      'Bcrypt 12 rondas de sal',
      'Tokens de 256 bits',
      'Sesiones de 24 horas',
      'Validación Bearer estándar',
      'Limpieza automática de sesiones',
    ],
    technicalSpecs: {
      saltRounds: 12,
      tokenBytes: 32,
      sessionDurationHours: 24,
    },
  },
  {
    id: 'zod_validation',
    category: 'security',
    name: 'Bóveda de Integridad de Datos',
    technicalName: 'ZodSchemaValidation',
    technicalDetail: 'Validación estricta de esquemas con Zod + drizzle-zod, 45+ schemas de inserción (insertNewsSchema, insertTeamMemberSchema, etc.), validación de tipos en runtime, mensajes de error estructurados, integración con formularios react-hook-form.',
    userBenefit: 'Validación estricta de esquemas que previene datos malformados. Protección contra inyección de datos maliciosos y garantía de integridad de base de datos.',
    status: 'production',
    keyCapabilities: [
      '45+ schemas de validación',
      'Validación en runtime',
      'Mensajes de error estructurados',
      'Integración con formularios',
      'Type-safety end-to-end',
    ],
    technicalSpecs: {
      schemas: 45,
      integration: 'drizzle-zod',
    },
  },
  {
    id: 'multer_security',
    category: 'security',
    name: 'Centinela de Carga de Archivos',
    technicalName: 'MulterSecurityMiddleware',
    technicalDetail: 'Límite de 10MB por archivo, filtro de MIME types permitidos (image/jpeg, image/png, image/gif, image/webp, image/svg+xml, application/pdf), nombrado único con crypto.randomBytes(8), almacenamiento en directorio uploads con creación automática.',
    userBenefit: 'Protección contra carga de archivos maliciosos. Previene ataques de upload y garantiza que solo archivos seguros ingresen al sistema.',
    status: 'production',
    keyCapabilities: [
      'Límite 10MB por archivo',
      '6 MIME types permitidos',
      'Nombrado criptográfico único',
      'Validación de tipo de archivo',
      'Directorio seguro de uploads',
    ],
    technicalSpecs: {
      maxFileSize: '10MB',
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf'],
    },
  },
  {
    id: 'websocket_security',
    category: 'security',
    name: 'Canal Seguro de Comunicación en Tiempo Real',
    technicalName: 'WebSocketSecurityLayer',
    technicalDetail: 'WebSocket server en /ws/pipeline, heartbeat cada 30 segundos para detección de conexiones obsoletas, limpieza automática de clientes desconectados, broadcast a todos los clientes conectados, confirmación de conexión con clientId único.',
    userBenefit: 'Comunicación bidireccional segura para actualizaciones de progreso de pipeline en tiempo real. Experiencia de usuario fluida sin polling.',
    status: 'production',
    keyCapabilities: [
      'Heartbeat cada 30 segundos',
      'Limpieza automática de stale',
      'Broadcast a múltiples clientes',
      'ClientId único por conexión',
      'Detección de desconexión',
    ],
    technicalSpecs: {
      path: '/ws/pipeline',
      heartbeatInterval: 30000,
    },
  },
  {
    id: 'content_sanitizer',
    category: 'security',
    name: 'Escudo de Sanitización de Contenido',
    technicalName: 'ContentSanitizationLayer',
    technicalDetail: 'Sanitización de 28 términos legales sensibles para generación de imágenes (harassment, corruption, violence, etc.), reemplazos abstractos ("corruption" → "transparency and corporate governance"), inyección de contexto profesional positivo.',
    userBenefit: 'Protección de la imagen institucional mediante filtrado inteligente de conceptos que podrían generar visuales inapropiados. Preserva la elegancia corporativa.',
    status: 'production',
    keyCapabilities: [
      '28 términos sensibles filtrados',
      'Reemplazos semánticos abstractos',
      'Contexto corporativo positivo',
      'Log de cambios transparente',
      'Preservación de intención legal',
    ],
    technicalSpecs: {
      sensitiveTerms: 28,
      replacements: 14,
    },
  },
  {
    id: 'database_persistence',
    category: 'security',
    name: 'Persistencia de Datos con Tolerancia a Fallos',
    technicalName: 'DatabasePersistence + DrizzleORM',
    technicalDetail: 'PostgreSQL serverless (Neon), Drizzle ORM con type-safety completo, JSONB para estructuras flexibles (councilVerdict, metadata), timestamps automáticos, foreign keys con cascade delete, índices optimizados.',
    userBenefit: 'Almacenamiento empresarial con cero pérdida de datos. Escalabilidad automática y backups transparentes. Base sólida para operación crítica.',
    status: 'production',
    keyCapabilities: [
      'PostgreSQL serverless',
      'Type-safety con Drizzle',
      'JSONB para estructuras flexibles',
      'Cascade delete automático',
      'Índices optimizados',
    ],
    technicalSpecs: {
      provider: 'Neon',
      orm: 'Drizzle',
    },
  },
];

// ════════════════════════════════════════════════════════════════════════════════
// 🏗️ COLUMNA VERTEBRAL - INFRAESTRUCTURA CRÍTICA (8 Módulos)
// ════════════════════════════════════════════════════════════════════════════════

export const CORE_INFRASTRUCTURE: SystemFeature[] = [
  {
    id: 'agent_knowledge_store',
    category: 'infrastructure',
    name: 'Repositorio de Conocimiento Institucional',
    technicalName: 'AgentKnowledgeStore',
    technicalDetail: 'Almacenamiento persistente de conocimiento de agentes en tabla agentKnowledge, glosario legal con 500+ términos, búsqueda por agentType/category/query, contador de uso para ranking de relevancia, metadata JSONB para extensibilidad.',
    userBenefit: 'Memoria institucional compartida entre todos los agentes. El conocimiento legal se acumula y mejora con cada uso, creando ventaja competitiva creciente.',
    status: 'production',
    keyCapabilities: [
      'Glosario legal 500+ términos',
      'Búsqueda por categoría/query',
      'Contador de uso',
      'Metadata extensible',
      'Memoria compartida inter-agente',
    ],
  },
  {
    id: 'pcloud_sync',
    category: 'infrastructure',
    name: 'Sincronización en la Nube Persistente',
    technicalName: 'PCloudStorage',
    technicalDetail: 'Autenticación OAuth con pCloud, sincronización bidireccional de conocimiento y evolución, path base /VonWobeser/agents, upload multipart, listado de archivos con metadata, tolerancia a fallos de red.',
    userBenefit: 'Persistencia de conocimiento de agentes a través de sesiones y reinicios. El aprendizaje nunca se pierde.',
    status: 'production',
    keyCapabilities: [
      'Autenticación OAuth',
      'Sync bidireccional',
      'Upload multipart',
      'Tolerancia a fallos',
      'Persistencia cross-session',
    ],
    technicalSpecs: {
      basePath: '/VonWobeser/agents',
      provider: 'pCloud',
    },
  },
  {
    id: 'translation_cache',
    category: 'infrastructure',
    name: 'Acelerador de Entrega de Traducciones',
    technicalName: 'TranslationCacheLayer',
    technicalDetail: 'Caché de traducciones en tabla translationCache con clave única (contentType, entityId, targetLanguage), invalidación selectiva por entidad, reducción 90% de llamadas API, hook useTranslatedContent con fallback a API, persistencia permanente.',
    userBenefit: 'Latencia cero para traducciones previamente generadas. Reduce costos de API 90% y acelera experiencia de usuario dramáticamente.',
    status: 'production',
    keyCapabilities: [
      'Caché por entidad/idioma',
      'Reducción 90% llamadas API',
      'Invalidación selectiva',
      'Persistencia permanente',
      'Fallback automático a API',
    ],
    technicalSpecs: {
      cacheHitRate: '90%',
      keyFormat: 'contentType:entityId:language',
    },
  },
  {
    id: 'job_queue',
    category: 'infrastructure',
    name: 'Orquestador de Procesos en Lote',
    technicalName: 'AgentJobQueue',
    technicalDetail: 'Gestión de carga masiva mediante hilos de ejecución aislados (Sandboxing), cola de prioridad cuádruple, persistencia en tabla agentJobs, status tracking (pending/in_progress/completed/failed), retry automático con backoff exponencial, parent-child job linking.',
    userBenefit: 'Procesamiento simultáneo de altos volúmenes de datos sin comprometer la latencia. Cada trabajo está aislado para prevenir efectos cascada.',
    status: 'production',
    keyCapabilities: [
      'Cola de prioridad cuádruple',
      'Sandboxing de ejecución',
      'Retry con backoff exponencial',
      'Parent-child job linking',
      'Status tracking en tiempo real',
    ],
    technicalSpecs: {
      priorities: ['critical', 'high', 'normal', 'low'],
      maxRetries: 3,
      backoffBase: 2000,
    },
  },
  {
    id: 'evolution_tracker',
    category: 'infrastructure',
    name: 'Sistema de Evolución de Agentes',
    technicalName: 'AgentEvolutionTracker',
    technicalDetail: 'Tracking de skills por agente con expertise level (1-5), success rate percentage, last used timestamp, propuestas de evolución en tabla agentEvolutionProposals con status (pending/approved/rejected), aprendizaje de patrones de éxito.',
    userBenefit: 'Los agentes mejoran continuamente basándose en su rendimiento histórico. Sistema de propuestas permite validación humana de cambios evolutivos.',
    status: 'production',
    keyCapabilities: [
      'Tracking de expertise (1-5)',
      'Success rate por skill',
      'Propuestas de evolución',
      'Validación humana',
      'Aprendizaje de patrones',
    ],
  },
  {
    id: 'geolocation_detector',
    category: 'infrastructure',
    name: 'Detector Geográfico de Idioma',
    technicalName: 'GeolocationLanguageDetector',
    technicalDetail: 'Endpoint /api/detect-language con ip-api.com, mapeo país→idioma para 40+ países (MX→es, DE→de, CN→zh, etc.), fallback a español para países no mapeados, localStorage persistence (vwb_language), HTML lang attribute update.',
    userBenefit: 'Experiencia personalizada desde el primer visit. Visitantes ven contenido en su idioma sin configuración manual.',
    status: 'production',
    keyCapabilities: [
      'Detección IP automática',
      'Mapeo 40+ países',
      'Fallback inteligente',
      'Persistencia en localStorage',
      'Update de lang attribute',
    ],
    technicalSpecs: {
      provider: 'ip-api.com',
      countries: 40,
      fallback: 'es',
    },
  },
  {
    id: 'static_asset_server',
    category: 'infrastructure',
    name: 'Servidor de Assets Estáticos Optimizado',
    technicalName: 'StaticAssetMiddleware',
    technicalDetail: 'Rutas estáticas para /partner_photos, /associate_photos, /of_counsel_photos, /generated-images, servicio desde attached_assets y public, generación de rutas con path.join seguro.',
    userBenefit: 'Entrega rápida de imágenes de equipo y assets generados. Estructura organizada por categoría de miembro.',
    status: 'production',
    keyCapabilities: [
      '4 rutas de fotos',
      'Imágenes generadas por IA',
      'Path seguro',
      'Estructura categorizada',
      'Entrega optimizada',
    ],
  },
  {
    id: 'pipeline_broadcaster',
    category: 'infrastructure',
    name: 'Difusor de Progreso de Pipeline',
    technicalName: 'PipelineProgressBroadcaster',
    technicalDetail: 'WebSocket broadcast en tiempo real a todos los clientes conectados, payload estructurado (articleId, step, status, language, progress, message), timestamp automático, map de clientes activos con limpieza.',
    userBenefit: 'Visibilidad total del progreso de procesamiento de artículos. Los editores ven cada paso del pipeline en vivo.',
    status: 'production',
    keyCapabilities: [
      'Broadcast en tiempo real',
      'Payload estructurado',
      'Tracking por artículo',
      'Múltiples clientes simultáneos',
      'Limpieza automática',
    ],
  },
];

// ════════════════════════════════════════════════════════════════════════════════
// 🌐 VITRINA INSTITUCIONAL - MÓDULOS PÚBLICOS (27 Módulos)
// ════════════════════════════════════════════════════════════════════════════════

export const PUBLIC_MODULES: SystemFeature[] = [
  {
    id: 'multi_language_system',
    category: 'public_site',
    name: 'Sistema Multilingüe de Jurisdicciones',
    technicalName: 'LanguageContext + i18n + useTranslatedContent',
    technicalDetail: '10 jurisdicciones lingüísticas (EN/ES/DE/ZH/KO/JA/AR/RU/FR/IT), hook useTranslatedContent con ciclo cache/mutation, verificación isNativeLanguage() (ES = nativo), detección IP geolocation, persistencia localStorage, integración i18next, RTL para árabe.',
    userBenefit: 'Cobertura 100% sin "Spanglish". Detección automática de idioma por ubicación. Experiencia fluida para clientes internacionales de cualquier jurisdicción.',
    status: 'production',
    keyCapabilities: [
      '10 idiomas soportados',
      'Detección IP automática',
      'RTL para árabe',
      'Caché inteligente',
      'Prioridad nativa español',
    ],
  },
  {
    id: 'team_directory',
    category: 'public_site',
    name: 'Directorio de Talento Legal',
    technicalName: 'Team.tsx + TeamMemberDetail.tsx',
    technicalDetail: 'Filtrado dinámico por práctica/industria, generación vCard con etiquetas en 10 idiomas, cross-linking a artículos relacionados, secciones Educación/Afiliaciones/Rankings/Publicaciones, materias representativas, avatar con fallback a iniciales.',
    userBenefit: 'Perfiles completos de abogados con credenciales profesionales, tarjetas de contacto descargables, y referencias cruzadas automáticas. Construye confianza con clientes potenciales.',
    status: 'production',
    keyCapabilities: [
      'Filtrado práctica/industria',
      'vCard en 10 idiomas',
      'Cross-linking a noticias',
      'Avatar con fallback',
      '6 secciones de perfil',
    ],
  },
  {
    id: 'news_system',
    category: 'public_site',
    name: 'Centro de Noticias y Publicaciones',
    technicalName: 'News.tsx + NewsDetail.tsx + Articles.tsx',
    technicalDetail: 'Scroll infinito con paginación, traducción dinámica vía useTranslatedContent, fallback de imagen con branding VWS, formateo de fecha por locale, filtrado categoría/autor, slugs optimizados para SEO.',
    userBenefit: 'Noticias legales en tiempo real en 10 idiomas con carga inteligente. Posiciona la Firma como líder de pensamiento en asuntos legales mexicanos.',
    status: 'production',
    keyCapabilities: [
      'Scroll infinito',
      'Traducción dinámica',
      'Filtrado por categoría',
      'URLs SEO-optimizadas',
      'Branding automático',
    ],
  },
  {
    id: 'events_calendar',
    category: 'public_site',
    name: 'Calendario de Eventos Institucionales',
    technicalName: 'Events.tsx',
    technicalDetail: '5 tipos de evento con color coding (conference/webinar/sponsorship/speaking/networking), segregación upcoming vs past, linking a URLs externas, display de rango de fechas, ubicación con ícono MapPin.',
    userBenefit: 'Showcase profesional de actividad y engagement de la Firma. Ayuda a clientes a descubrir speaking engagements y oportunidades de networking.',
    status: 'production',
    keyCapabilities: [
      '5 tipos de evento',
      'Color coding visual',
      'Filtro pasado/próximo',
      'Links externos',
      'Display de ubicación',
    ],
  },
  {
    id: 'practice_groups',
    category: 'public_site',
    name: 'Áreas de Práctica Legal',
    technicalName: 'PracticeGroups.tsx + PracticeGroupDetail.tsx',
    technicalDetail: '18 áreas de práctica, páginas de descripción completa, vinculación de team members, cross-referencing de noticias, meta tags SEO.',
    userBenefit: 'Showcase comprehensivo de expertise por área. Ayuda a clientes a encontrar la especialidad correcta para sus necesidades legales.',
    status: 'production',
    keyCapabilities: [
      '18 áreas de práctica',
      'Vinculación de expertos',
      'Noticias relacionadas',
      'Optimización SEO',
      'Descripciones completas',
    ],
  },
  {
    id: 'industry_groups',
    category: 'public_site',
    name: 'Sectores Industriales',
    technicalName: 'IndustryGroups.tsx + IndustryGroupDetail.tsx',
    technicalDetail: '7 sectores industriales, áreas de práctica relacionadas, display de expertise del equipo.',
    userBenefit: 'Showcase de conocimiento profundo por industria. Atrae clientes que buscan experiencia especializada en su sector.',
    status: 'production',
    keyCapabilities: [
      '7 sectores industriales',
      'Vinculación a prácticas',
      'Display de equipo experto',
      'Navegación por sector',
    ],
  },
  {
    id: 'german_desk',
    category: 'public_site',
    name: 'German Desk - Puente Europa-México',
    technicalName: 'GermanDesk.tsx',
    technicalDetail: 'Landing dedicado para clientes alemanes, visualización de mapa mundial, énfasis en toggle DE/EN, contenido de puente cultural, estadísticas de comercio bilateral.',
    userBenefit: 'Servicio especializado para empresas alemanas entrando al mercado mexicano. Demuestra comprensión cultural y capacidad bilingüe.',
    status: 'production',
    keyCapabilities: [
      'Enfoque mercado alemán',
      'Mapa mundial visual',
      'Contenido bilingüe',
      'Estadísticas comerciales',
      'Puente cultural',
    ],
  },
  {
    id: 'careers_portal',
    category: 'public_site',
    name: 'Portal de Talento y Carreras',
    technicalName: 'Careers.tsx',
    technicalDetail: 'Sección de cultura, valores core con íconos (4 valores), grid de beneficios (6 items), listado de posiciones abiertas, detalles de programa de pasantías, contenido completo en 10 idiomas.',
    userBenefit: 'Portal de reclutamiento profesional que muestra cultura y oportunidades. Atrae talento legal de primer nivel.',
    status: 'production',
    keyCapabilities: [
      'Showcase de cultura',
      'Display de beneficios',
      'Posiciones abiertas',
      '10 idiomas completos',
      'Programa de pasantías',
    ],
  },
  {
    id: 'diversity_inclusion',
    category: 'public_site',
    name: 'Diversidad e Inclusión',
    technicalName: 'DiversityInclusion.tsx',
    technicalDetail: 'Display de valores corporativos, estadísticas de diversidad del equipo, showcase de iniciativas.',
    userBenefit: 'Demuestra compromiso con diversidad y prácticas inclusivas. Importante para clientes con conciencia ESG y talento.',
    status: 'production',
    keyCapabilities: [
      'Showcase de valores',
      'Estadísticas de diversidad',
      'Highlights de iniciativas',
      'Compromiso ESG',
    ],
  },
  {
    id: 'pro_bono',
    category: 'public_site',
    name: 'Programa Pro Bono',
    technicalName: 'ProBono.tsx',
    technicalDetail: 'Descripción de programa pro bono, highlights de casos, organizaciones partner.',
    userBenefit: 'Muestra responsabilidad social e impacto comunitario. Construye confianza con clientes socialmente conscientes.',
    status: 'production',
    keyCapabilities: [
      'Overview de programa',
      'Highlights de casos',
      'Organizaciones partner',
      'Impacto social',
    ],
  },
  {
    id: 'rankings_page',
    category: 'public_site',
    name: 'Rankings y Reconocimientos',
    technicalName: 'Rankings.tsx',
    technicalDetail: 'Rankings de directorios legales (Chambers, Legal500), badges de premios, timeline de reconocimientos.',
    userBenefit: 'Validación de terceros de excelencia de la Firma. Construye credibilidad con clientes prospecto que buscan representación de primer nivel.',
    status: 'production',
    keyCapabilities: [
      'Rankings Chambers',
      'Rankings Legal500',
      'Display de premios',
      'Timeline de logros',
    ],
  },
  {
    id: 'contact_page',
    category: 'public_site',
    name: 'Página de Contacto',
    technicalName: 'Contact.tsx',
    technicalDetail: 'Ubicaciones de oficina, formulario de contacto, integración de mapa, links directos teléfono/email.',
    userBenefit: 'Acceso fácil al contacto con múltiples opciones de comunicación. Reduce fricción para clientes potenciales.',
    status: 'production',
    keyCapabilities: [
      'Ubicaciones de oficina',
      'Formulario de contacto',
      'Integración de mapa',
      'Links directos',
    ],
  },
  {
    id: 'office_showcase',
    category: 'public_site',
    name: 'Showcase de Oficinas Premium',
    technicalName: 'Experience.tsx + Offices.tsx + NewOfficesPopup.tsx',
    technicalDetail: 'Galería fotográfica de oficinas, popup de nuevas oficinas, showcase Torre SOMA.',
    userBenefit: 'Tour visual de espacios premium. Demuestra estabilidad e inversión en experiencia del cliente.',
    status: 'production',
    keyCapabilities: [
      'Galería fotográfica',
      'Popup nuevas oficinas',
      'Showcase de ubicación',
      'Tour virtual',
    ],
  },
  {
    id: 'hero_section',
    category: 'public_site',
    name: 'Sección Hero Cinematográfica',
    technicalName: 'HeroSection.tsx',
    technicalDetail: 'Fondo de video, overlay de texto animado, botones CTA.',
    userBenefit: 'Primera impresión impactante con video profesional y call-to-action claro. Captura atención del visitante inmediatamente.',
    status: 'production',
    keyCapabilities: [
      'Fondo de video',
      'Texto animado',
      'Botones CTA',
      'Impacto visual',
    ],
  },
  {
    id: 'stats_section',
    category: 'public_site',
    name: 'Estadísticas Institucionales',
    technicalName: 'StatsSection.tsx',
    technicalDetail: 'Display de estadísticas de la Firma, contadores animados, métricas de oficina.',
    userBenefit: 'Comunicación visual de escala y capacidad. Números que impresionan y generan confianza.',
    status: 'production',
    keyCapabilities: [
      'Contadores animados',
      'Métricas de escala',
      'Display visual',
      'Datos actualizados',
    ],
  },
];

// ════════════════════════════════════════════════════════════════════════════════
// 💼 CENTRO DE MANDO - SISTEMA DE ADMINISTRACIÓN (12 Módulos)
// ════════════════════════════════════════════════════════════════════════════════

export const ADMIN_MODULES: SystemFeature[] = [
  {
    id: 'admin_dashboard',
    category: 'admin_system',
    name: 'Tablero de Control Ejecutivo',
    technicalName: 'AdminDashboard.tsx',
    technicalDetail: 'Vista general de métricas, conteos de contenido, estadísticas de pipeline, accesos rápidos a funciones principales.',
    userBenefit: 'Visión ejecutiva de toda la operación digital en una sola pantalla. Toma de decisiones informada.',
    status: 'production',
    keyCapabilities: [
      'Métricas en tiempo real',
      'Conteos de contenido',
      'Estadísticas de pipeline',
      'Accesos rápidos',
    ],
  },
  {
    id: 'article_management',
    category: 'admin_system',
    name: 'Gestor de Artículos con IA',
    technicalName: 'AdminNews.tsx + AdminArticleDetail.tsx',
    technicalDetail: 'CRUD completo de artículos, integración de Legal Council, botón de validación y publicación, vista de veredicto de agentes, progreso de pipeline en tiempo real.',
    userBenefit: 'Gestión de contenido con supervisión de IA integrada. Cada artículo pasa por validación automática antes de publicación.',
    status: 'production',
    keyCapabilities: [
      'CRUD completo',
      'Integración Legal Council',
      'Validación con un clic',
      'Progreso en tiempo real',
      'Vista de veredicto',
    ],
  },
  {
    id: 'team_management',
    category: 'admin_system',
    name: 'Gestión de Equipo Legal',
    technicalName: 'AdminTeam.tsx',
    technicalDetail: 'CRUD de miembros del equipo, categorización (Partner/Of Counsel/Associate), gestión de fotos, vinculación a áreas de práctica.',
    userBenefit: 'Administración centralizada del directorio de abogados. Perfiles siempre actualizados.',
    status: 'production',
    keyCapabilities: [
      'CRUD de miembros',
      'Categorización por rol',
      'Gestión de fotos',
      'Vinculación a prácticas',
    ],
  },
  {
    id: 'practice_management',
    category: 'admin_system',
    name: 'Gestión de Áreas de Práctica',
    technicalName: 'AdminPracticeGroups.tsx',
    technicalDetail: 'CRUD de 18 áreas de práctica, descripciones bilingües, vinculación de team members.',
    userBenefit: 'Control total sobre taxonomía de servicios legales. Estructura siempre alineada con oferta real.',
    status: 'production',
    keyCapabilities: [
      'CRUD de 18 áreas',
      'Descripciones bilingües',
      'Vinculación de expertos',
    ],
  },
  {
    id: 'agent_nerve_center',
    category: 'admin_system',
    name: 'Centro Nervioso de Agentes en Vivo',
    technicalName: 'NerveCenter.tsx + EvolutionTimeline.tsx',
    technicalDetail: 'Visualización de ecosistema de 14 agentes con refresh automático cada 30 segundos, organización en 3 categorías (Cerebro/Manos/Escudo), nivel de evolución (1-5 puntos), estado de cada agente, timeline narrativo de mejoras con niveles de impacto.',
    userBenefit: 'Visibilidad total del "sistema nervioso digital". Demuestra la sofisticación tecnológica a stakeholders.',
    status: 'production',
    keyCapabilities: [
      'Visualización de 14 agentes',
      'Refresh cada 30 segundos',
      '3 categorías visuales',
      'Niveles de evolución',
      'Timeline de mejoras',
    ],
  },
  {
    id: 'system_explorer',
    category: 'admin_system',
    name: 'Explorador del Sistema',
    technicalName: 'SystemExplorer.tsx',
    technicalDetail: 'Documentación técnica navegable, búsqueda por categoría, exportación de reportes, especificaciones técnicas de cada módulo.',
    userBenefit: 'Documentación viva del sistema completo. Facilita onboarding y auditorías técnicas.',
    status: 'production',
    keyCapabilities: [
      'Documentación navegable',
      'Búsqueda por categoría',
      'Exportación de reportes',
      'Especificaciones técnicas',
    ],
  },
  {
    id: 'pipeline_processor',
    category: 'admin_system',
    name: 'Procesador de Pipeline de Artículos',
    technicalName: 'ArticleProcessor + PipelineProgressModal',
    technicalDetail: 'Pipeline de 9 pasos (format→categorize→metadata→seo→translate×9→image), WebSocket para progreso en tiempo real, modal de visualización paso a paso, reintentos automáticos.',
    userBenefit: 'Procesamiento automatizado completo de artículos. De PDF crudo a publicación multilingüe en un clic.',
    status: 'production',
    keyCapabilities: [
      'Pipeline de 9 pasos',
      'Progreso en tiempo real',
      'Modal de visualización',
      'Reintentos automáticos',
      'Traducción a 9 idiomas',
    ],
  },
  {
    id: 'council_safety_card',
    category: 'admin_system',
    name: 'Tarjeta de Seguridad del Consejo',
    technicalName: 'CouncilSafetyCard.tsx',
    technicalDetail: 'Visualización de veredicto de Legal Council, votos individuales de 3 agentes con puntuación y razonamiento, badges de estado (aprobado/rechazado/revisión), nivel de riesgo, feedback consolidado, botón de validación para admin.',
    userBenefit: 'Visibilidad total de la evaluación de IA de cada artículo. Decisión informada antes de publicar.',
    status: 'production',
    keyCapabilities: [
      'Votos de 3 agentes',
      'Puntuación 0-100',
      'Badges de estado',
      'Nivel de riesgo',
      'Feedback consolidado',
    ],
  },
  {
    id: 'events_management',
    category: 'admin_system',
    name: 'Gestión de Eventos',
    technicalName: 'AdminEvents.tsx',
    technicalDetail: 'CRUD de eventos, 5 tipos de evento, fechas de inicio/fin, URLs externas, publicación selectiva.',
    userBenefit: 'Control completo del calendario de eventos institucionales.',
    status: 'production',
    keyCapabilities: [
      'CRUD de eventos',
      '5 tipos de evento',
      'Gestión de fechas',
      'URLs externas',
    ],
  },
  {
    id: 'media_library',
    category: 'admin_system',
    name: 'Biblioteca de Medios',
    technicalName: 'AdminMedia.tsx',
    technicalDetail: 'Upload de archivos con validación de tipo, gestión de imágenes, límite 10MB, nombrado único.',
    userBenefit: 'Repositorio centralizado de assets visuales. Fácil reutilización de imágenes.',
    status: 'production',
    keyCapabilities: [
      'Upload con validación',
      'Gestión de imágenes',
      'Límite 10MB',
      'Nombrado único',
    ],
  },
  {
    id: 'admin_auth',
    category: 'admin_system',
    name: 'Portal de Acceso Seguro',
    technicalName: 'AdminLogin.tsx + AuthMiddleware',
    technicalDetail: 'Login con bcrypt, sesiones de 24 horas, rate limiting 5 intentos, bloqueo 30 minutos, roles (super_admin/admin/editor).',
    userBenefit: 'Acceso seguro con protección contra ataques. Roles diferenciados para control granular.',
    status: 'production',
    keyCapabilities: [
      'Login seguro',
      'Sesiones 24h',
      'Rate limiting',
      '3 niveles de rol',
      'Bloqueo automático',
    ],
  },
  {
    id: 'audit_dashboard',
    category: 'admin_system',
    name: 'Panel de Auditorías',
    technicalName: 'AdminAgents.tsx',
    technicalDetail: 'Vista de propuestas de evolución, aprobación/rechazo de mejoras, ejecución de auditorías bajo demanda, estadísticas de agentes.',
    userBenefit: 'Gobernanza humana sobre la evolución de IA. Control total sobre cambios propuestos por los agentes.',
    status: 'production',
    keyCapabilities: [
      'Propuestas de evolución',
      'Aprobación/rechazo',
      'Auditorías on-demand',
      'Estadísticas de agentes',
    ],
  },
];

// ════════════════════════════════════════════════════════════════════════════════
// COMBINED EXPORTS
// ════════════════════════════════════════════════════════════════════════════════

export const AI_AGENTS: SystemFeature[] = [
  ...AI_BRAIN_AGENTS,
  ...AI_HANDS_AGENTS,
  ...AI_SHIELD_AGENTS,
];

export const INFRASTRUCTURE_FEATURES: SystemFeature[] = [
  ...SECURITY_INFRASTRUCTURE,
  ...CORE_INFRASTRUCTURE,
];

export const ALL_FEATURES: SystemFeature[] = [
  ...AI_AGENTS,
  ...INFRASTRUCTURE_FEATURES,
  ...PUBLIC_MODULES,
  ...ADMIN_MODULES,
];

// ════════════════════════════════════════════════════════════════════════════════
// SYSTEM STATISTICS
// ════════════════════════════════════════════════════════════════════════════════

export const SYSTEM_STATS = {
  totalAgents: AI_AGENTS.length,
  brainAgents: AI_BRAIN_AGENTS.length,
  handsAgents: AI_HANDS_AGENTS.length,
  shieldAgents: AI_SHIELD_AGENTS.length,
  securityModules: SECURITY_INFRASTRUCTURE.length,
  infrastructureModules: CORE_INFRASTRUCTURE.length,
  publicModules: PUBLIC_MODULES.length,
  adminModules: ADMIN_MODULES.length,
  totalFeatures: ALL_FEATURES.length,
  supportedLanguages: 10,
  practiceAreas: 18,
  industrySectors: 7,
  sensitiveTermsSanitized: 28,
  legalGlossaryTerms: 500,
  version: '3.0',
  codename: 'Sistema Nervioso Digital',
  totalPublicModules: PUBLIC_MODULES.length,
  totalAdminModules: ADMIN_MODULES.length,
  totalInfrastructure: SECURITY_INFRASTRUCTURE.length + CORE_INFRASTRUCTURE.length,
  productionFeatures: ALL_FEATURES.filter(f => f.status === 'production').length,
};

// ════════════════════════════════════════════════════════════════════════════════
// TRANSLATIONS (10 LANGUAGES)
// ════════════════════════════════════════════════════════════════════════════════

export const MANIFEST_TRANSLATIONS: Record<string, SystemManifestTranslations> = {
  es: {
    categories: {
      ai_brain: { title: 'El Cerebro', description: 'Agentes de decisión estratégica y análisis profundo' },
      ai_hands: { title: 'Las Manos', description: 'Agentes de ejecución operativa y transformación' },
      ai_shield: { title: 'El Escudo', description: 'Agentes de protección, auditoría y auto-curación' },
      infrastructure: { title: 'Columna Vertebral', description: 'Infraestructura crítica y persistencia' },
      security: { title: 'Bóveda Digital', description: 'Seguridad, autenticación y validación' },
      public_site: { title: 'Vitrina Institucional', description: 'Portal público y experiencia del visitante' },
      admin_system: { title: 'Centro de Mando', description: 'Administración y control empresarial' },
    },
    statuses: {
      production: 'Producción',
      beta: 'Beta',
      development: 'Desarrollo',
    },
    features: {},
    ui: {
      searchPlaceholder: 'Buscar módulos, agentes o capacidades...',
      exportReport: 'Exportar Reporte',
      exportSuccess: 'Reporte exportado exitosamente',
      technicalDetails: 'Detalles Técnicos',
      capabilities: 'Capacidades Clave',
      status: 'Estado',
      noResults: 'No se encontraron resultados',
      allCategories: 'Todas las Categorías',
      totalAgents: 'Total de Agentes IA',
      totalModules: 'Módulos Públicos',
      totalInfrastructure: 'Infraestructura',
      generatedOn: 'Generado el',
      systemOverview: 'Panorama del Sistema',
      reportTitle: 'Manifest del Sistema',
      reportSubtitle: 'Plataforma Legal Inteligente Von Wobeser y Sierra',
    },
  },
  en: {
    categories: {
      ai_brain: { title: 'The Brain', description: 'Strategic decision agents and deep analysis' },
      ai_hands: { title: 'The Hands', description: 'Operational execution and transformation agents' },
      ai_shield: { title: 'The Shield', description: 'Protection, audit, and self-healing agents' },
      infrastructure: { title: 'The Backbone', description: 'Critical infrastructure and persistence' },
      security: { title: 'Digital Vault', description: 'Security, authentication, and validation' },
      public_site: { title: 'Institutional Showcase', description: 'Public portal and visitor experience' },
      admin_system: { title: 'Command Center', description: 'Administration and enterprise control' },
    },
    statuses: {
      production: 'Production',
      beta: 'Beta',
      development: 'Development',
    },
    features: {},
    ui: {
      searchPlaceholder: 'Search modules, agents, or capabilities...',
      exportReport: 'Export Report',
      exportSuccess: 'Report exported successfully',
      technicalDetails: 'Technical Details',
      capabilities: 'Key Capabilities',
      status: 'Status',
      noResults: 'No results found',
      allCategories: 'All Categories',
      totalAgents: 'Total AI Agents',
      totalModules: 'Public Modules',
      totalInfrastructure: 'Infrastructure',
      generatedOn: 'Generated on',
      systemOverview: 'System Overview',
      reportTitle: 'System Manifest',
      reportSubtitle: 'Von Wobeser y Sierra Intelligent Legal Platform',
    },
  },
  de: {
    categories: {
      ai_brain: { title: 'Das Gehirn', description: 'Strategische Entscheidungsagenten und Tiefenanalyse' },
      ai_hands: { title: 'Die Hände', description: 'Operative Ausführung und Transformationsagenten' },
      ai_shield: { title: 'Der Schild', description: 'Schutz-, Audit- und Selbstheilungsagenten' },
      infrastructure: { title: 'Das Rückgrat', description: 'Kritische Infrastruktur und Persistenz' },
      security: { title: 'Digitaler Tresor', description: 'Sicherheit, Authentifizierung und Validierung' },
      public_site: { title: 'Institutionelles Schaufenster', description: 'Öffentliches Portal und Besuchererlebnis' },
      admin_system: { title: 'Kommandozentrale', description: 'Verwaltung und Unternehmenskontrolle' },
    },
    statuses: {
      production: 'Produktion',
      beta: 'Beta',
      development: 'Entwicklung',
    },
    features: {},
    ui: {
      searchPlaceholder: 'Module, Agenten oder Fähigkeiten suchen...',
      exportReport: 'Bericht exportieren',
      exportSuccess: 'Bericht erfolgreich exportiert',
      technicalDetails: 'Technische Details',
      capabilities: 'Schlüsselfähigkeiten',
      status: 'Status',
      noResults: 'Keine Ergebnisse gefunden',
      allCategories: 'Alle Kategorien',
      totalAgents: 'Gesamt KI-Agenten',
      totalModules: 'Öffentliche Module',
      totalInfrastructure: 'Infrastruktur',
      generatedOn: 'Generiert am',
      systemOverview: 'Systemübersicht',
      reportTitle: 'Systemmanifest',
      reportSubtitle: 'Von Wobeser y Sierra Intelligente Rechtsplattform',
    },
  },
  zh: {
    categories: {
      ai_brain: { title: '大脑', description: '战略决策代理和深度分析' },
      ai_hands: { title: '双手', description: '运营执行和转型代理' },
      ai_shield: { title: '盾牌', description: '保护、审计和自愈代理' },
      infrastructure: { title: '骨干', description: '关键基础设施和持久化' },
      security: { title: '数字保险库', description: '安全、认证和验证' },
      public_site: { title: '机构展示', description: '公共门户和访客体验' },
      admin_system: { title: '指挥中心', description: '管理和企业控制' },
    },
    statuses: {
      production: '生产',
      beta: '测试版',
      development: '开发中',
    },
    features: {},
    ui: {
      searchPlaceholder: '搜索模块、代理或功能...',
      exportReport: '导出报告',
      exportSuccess: '报告导出成功',
      technicalDetails: '技术详情',
      capabilities: '关键能力',
      status: '状态',
      noResults: '未找到结果',
      allCategories: '所有类别',
      totalAgents: 'AI代理总数',
      totalModules: '公共模块',
      totalInfrastructure: '基础设施',
      generatedOn: '生成于',
      systemOverview: '系统概览',
      reportTitle: '系统清单',
      reportSubtitle: 'Von Wobeser y Sierra 智能法律平台',
    },
  },
  ko: {
    categories: {
      ai_brain: { title: '두뇌', description: '전략적 결정 에이전트 및 심층 분석' },
      ai_hands: { title: '손', description: '운영 실행 및 변환 에이전트' },
      ai_shield: { title: '방패', description: '보호, 감사 및 자가 치유 에이전트' },
      infrastructure: { title: '백본', description: '핵심 인프라 및 지속성' },
      security: { title: '디지털 금고', description: '보안, 인증 및 검증' },
      public_site: { title: '기관 쇼케이스', description: '공개 포털 및 방문자 경험' },
      admin_system: { title: '지휘 센터', description: '관리 및 기업 통제' },
    },
    statuses: {
      production: '프로덕션',
      beta: '베타',
      development: '개발 중',
    },
    features: {},
    ui: {
      searchPlaceholder: '모듈, 에이전트 또는 기능 검색...',
      exportReport: '보고서 내보내기',
      exportSuccess: '보고서가 성공적으로 내보내졌습니다',
      technicalDetails: '기술 세부사항',
      capabilities: '핵심 기능',
      status: '상태',
      noResults: '결과를 찾을 수 없습니다',
      allCategories: '모든 카테고리',
      totalAgents: 'AI 에이전트 총계',
      totalModules: '공개 모듈',
      totalInfrastructure: '인프라',
      generatedOn: '생성일',
      systemOverview: '시스템 개요',
      reportTitle: '시스템 매니페스트',
      reportSubtitle: 'Von Wobeser y Sierra 지능형 법률 플랫폼',
    },
  },
  ja: {
    categories: {
      ai_brain: { title: '脳', description: '戦略的意思決定エージェントと深層分析' },
      ai_hands: { title: '手', description: '運用実行と変革エージェント' },
      ai_shield: { title: '盾', description: '保護、監査、自己修復エージェント' },
      infrastructure: { title: 'バックボーン', description: '重要なインフラストラクチャと永続性' },
      security: { title: 'デジタル金庫', description: 'セキュリティ、認証、検証' },
      public_site: { title: '機関ショーケース', description: '公開ポータルと訪問者体験' },
      admin_system: { title: 'コマンドセンター', description: '管理と企業統制' },
    },
    statuses: {
      production: '本番',
      beta: 'ベータ',
      development: '開発中',
    },
    features: {},
    ui: {
      searchPlaceholder: 'モジュール、エージェント、機能を検索...',
      exportReport: 'レポートをエクスポート',
      exportSuccess: 'レポートが正常にエクスポートされました',
      technicalDetails: '技術詳細',
      capabilities: '主要機能',
      status: 'ステータス',
      noResults: '結果が見つかりません',
      allCategories: 'すべてのカテゴリ',
      totalAgents: 'AIエージェント合計',
      totalModules: '公開モジュール',
      totalInfrastructure: 'インフラストラクチャ',
      generatedOn: '生成日',
      systemOverview: 'システム概要',
      reportTitle: 'システムマニフェスト',
      reportSubtitle: 'Von Wobeser y Sierra インテリジェント法律プラットフォーム',
    },
  },
  ar: {
    categories: {
      ai_brain: { title: 'الدماغ', description: 'وكلاء القرار الاستراتيجي والتحليل العميق' },
      ai_hands: { title: 'الأيدي', description: 'وكلاء التنفيذ التشغيلي والتحويل' },
      ai_shield: { title: 'الدرع', description: 'وكلاء الحماية والتدقيق والشفاء الذاتي' },
      infrastructure: { title: 'العمود الفقري', description: 'البنية التحتية الحرجة والاستمرارية' },
      security: { title: 'الخزنة الرقمية', description: 'الأمان والمصادقة والتحقق' },
      public_site: { title: 'واجهة المؤسسة', description: 'البوابة العامة وتجربة الزائر' },
      admin_system: { title: 'مركز القيادة', description: 'الإدارة والتحكم المؤسسي' },
    },
    statuses: {
      production: 'الإنتاج',
      beta: 'بيتا',
      development: 'التطوير',
    },
    features: {},
    ui: {
      searchPlaceholder: 'البحث في الوحدات أو الوكلاء أو القدرات...',
      exportReport: 'تصدير التقرير',
      exportSuccess: 'تم تصدير التقرير بنجاح',
      technicalDetails: 'التفاصيل التقنية',
      capabilities: 'القدرات الرئيسية',
      status: 'الحالة',
      noResults: 'لم يتم العثور على نتائج',
      allCategories: 'جميع الفئات',
      totalAgents: 'إجمالي وكلاء الذكاء الاصطناعي',
      totalModules: 'الوحدات العامة',
      totalInfrastructure: 'البنية التحتية',
      generatedOn: 'تم الإنشاء في',
      systemOverview: 'نظرة عامة على النظام',
      reportTitle: 'بيان النظام',
      reportSubtitle: 'منصة فون ووبيسر وسييرا القانونية الذكية',
    },
  },
  ru: {
    categories: {
      ai_brain: { title: 'Мозг', description: 'Агенты стратегических решений и глубокого анализа' },
      ai_hands: { title: 'Руки', description: 'Агенты операционного выполнения и трансформации' },
      ai_shield: { title: 'Щит', description: 'Агенты защиты, аудита и самовосстановления' },
      infrastructure: { title: 'Основа', description: 'Критическая инфраструктура и постоянство' },
      security: { title: 'Цифровое хранилище', description: 'Безопасность, аутентификация и валидация' },
      public_site: { title: 'Институциональная витрина', description: 'Публичный портал и опыт посетителей' },
      admin_system: { title: 'Командный центр', description: 'Администрирование и корпоративный контроль' },
    },
    statuses: {
      production: 'Продакшн',
      beta: 'Бета',
      development: 'Разработка',
    },
    features: {},
    ui: {
      searchPlaceholder: 'Поиск модулей, агентов или возможностей...',
      exportReport: 'Экспорт отчета',
      exportSuccess: 'Отчет успешно экспортирован',
      technicalDetails: 'Технические детали',
      capabilities: 'Ключевые возможности',
      status: 'Статус',
      noResults: 'Результаты не найдены',
      allCategories: 'Все категории',
      totalAgents: 'Всего ИИ-агентов',
      totalModules: 'Публичные модули',
      totalInfrastructure: 'Инфраструктура',
      generatedOn: 'Создано',
      systemOverview: 'Обзор системы',
      reportTitle: 'Манифест системы',
      reportSubtitle: 'Интеллектуальная юридическая платформа Von Wobeser y Sierra',
    },
  },
  fr: {
    categories: {
      ai_brain: { title: 'Le Cerveau', description: 'Agents de décision stratégique et analyse approfondie' },
      ai_hands: { title: 'Les Mains', description: 'Agents d\'exécution opérationnelle et de transformation' },
      ai_shield: { title: 'Le Bouclier', description: 'Agents de protection, d\'audit et d\'auto-guérison' },
      infrastructure: { title: 'L\'Épine Dorsale', description: 'Infrastructure critique et persistance' },
      security: { title: 'Coffre-fort Numérique', description: 'Sécurité, authentification et validation' },
      public_site: { title: 'Vitrine Institutionnelle', description: 'Portail public et expérience visiteur' },
      admin_system: { title: 'Centre de Commande', description: 'Administration et contrôle d\'entreprise' },
    },
    statuses: {
      production: 'Production',
      beta: 'Bêta',
      development: 'Développement',
    },
    features: {},
    ui: {
      searchPlaceholder: 'Rechercher des modules, agents ou capacités...',
      exportReport: 'Exporter le rapport',
      exportSuccess: 'Rapport exporté avec succès',
      technicalDetails: 'Détails techniques',
      capabilities: 'Capacités clés',
      status: 'Statut',
      noResults: 'Aucun résultat trouvé',
      allCategories: 'Toutes les catégories',
      totalAgents: 'Total des agents IA',
      totalModules: 'Modules publics',
      totalInfrastructure: 'Infrastructure',
      generatedOn: 'Généré le',
      systemOverview: 'Aperçu du système',
      reportTitle: 'Manifeste du système',
      reportSubtitle: 'Plateforme juridique intelligente Von Wobeser y Sierra',
    },
  },
  it: {
    categories: {
      ai_brain: { title: 'Il Cervello', description: 'Agenti decisionali strategici e analisi approfondita' },
      ai_hands: { title: 'Le Mani', description: 'Agenti di esecuzione operativa e trasformazione' },
      ai_shield: { title: 'Lo Scudo', description: 'Agenti di protezione, audit e auto-guarigione' },
      infrastructure: { title: 'La Spina Dorsale', description: 'Infrastruttura critica e persistenza' },
      security: { title: 'Caveau Digitale', description: 'Sicurezza, autenticazione e validazione' },
      public_site: { title: 'Vetrina Istituzionale', description: 'Portale pubblico ed esperienza del visitatore' },
      admin_system: { title: 'Centro di Comando', description: 'Amministrazione e controllo aziendale' },
    },
    statuses: {
      production: 'Produzione',
      beta: 'Beta',
      development: 'Sviluppo',
    },
    features: {},
    ui: {
      searchPlaceholder: 'Cerca moduli, agenti o capacità...',
      exportReport: 'Esporta rapporto',
      exportSuccess: 'Rapporto esportato con successo',
      technicalDetails: 'Dettagli tecnici',
      capabilities: 'Capacità chiave',
      status: 'Stato',
      noResults: 'Nessun risultato trovato',
      allCategories: 'Tutte le categorie',
      totalAgents: 'Totale agenti IA',
      totalModules: 'Moduli pubblici',
      totalInfrastructure: 'Infrastruttura',
      generatedOn: 'Generato il',
      systemOverview: 'Panoramica del sistema',
      reportTitle: 'Manifesto del sistema',
      reportSubtitle: 'Piattaforma legale intelligente Von Wobeser y Sierra',
    },
  },
};

// ════════════════════════════════════════════════════════════════════════════════
// BACKWARDS COMPATIBILITY ALIASES
// ════════════════════════════════════════════════════════════════════════════════

export const INFRASTRUCTURE: SystemFeature[] = INFRASTRUCTURE_FEATURES;

// ════════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════════

export function getManifestTranslations(language: string): SystemManifestTranslations {
  return MANIFEST_TRANSLATIONS[language] || MANIFEST_TRANSLATIONS.es;
}

export function getAllFeatures(): SystemFeature[] {
  return ALL_FEATURES;
}

export function searchFeatures(query: string): SystemFeature[] {
  if (!query.trim()) return ALL_FEATURES;
  
  const lowerQuery = query.toLowerCase();
  return ALL_FEATURES.filter(feature => 
    feature.name.toLowerCase().includes(lowerQuery) ||
    feature.technicalName.toLowerCase().includes(lowerQuery) ||
    feature.technicalDetail.toLowerCase().includes(lowerQuery) ||
    feature.userBenefit.toLowerCase().includes(lowerQuery) ||
    feature.keyCapabilities.some(cap => cap.toLowerCase().includes(lowerQuery))
  );
}

export function getFeaturesByCategory(category: SystemCategory | 'all'): SystemFeature[] {
  if (category === 'all') return ALL_FEATURES;
  return ALL_FEATURES.filter(feature => feature.category === category);
}

export function getTranslations(language: string): SystemManifestTranslations {
  return MANIFEST_TRANSLATIONS[language] || MANIFEST_TRANSLATIONS.es;
}

export function getSystemStats() {
  return SYSTEM_STATS;
}

export function generateMarkdownReport(language: string = 'es'): string {
  const t = getTranslations(language);
  const stats = getSystemStats();
  const now = new Date().toLocaleDateString(language === 'es' ? 'es-ES' : language === 'en' ? 'en-US' : language);
  
  let report = `# ${t.ui.reportTitle}\n\n`;
  report += `## ${t.ui.reportSubtitle}\n\n`;
  report += `**${t.ui.generatedOn}:** ${now}\n\n`;
  report += `---\n\n`;
  
  report += `## ${t.ui.systemOverview}\n\n`;
  report += `- **${t.ui.totalAgents}:** ${stats.totalAgents}\n`;
  report += `- **${t.ui.totalModules}:** ${stats.publicModules}\n`;
  report += `- **${t.ui.totalInfrastructure}:** ${stats.infrastructureModules + stats.securityModules}\n\n`;
  
  const categories: SystemCategory[] = ['ai_brain', 'ai_hands', 'ai_shield', 'infrastructure', 'security', 'public_site', 'admin_system'];
  
  for (const category of categories) {
    const categoryFeatures = getFeaturesByCategory(category);
    if (categoryFeatures.length === 0) continue;
    
    const categoryInfo = t.categories[category];
    report += `## ${categoryInfo.title}\n\n`;
    report += `*${categoryInfo.description}*\n\n`;
    
    for (const feature of categoryFeatures) {
      report += `### ${feature.name}\n\n`;
      report += `**${feature.technicalName}**\n\n`;
      report += `${feature.technicalDetail}\n\n`;
      report += `**${t.ui.capabilities}:**\n`;
      for (const cap of feature.keyCapabilities) {
        report += `- ${cap}\n`;
      }
      report += `\n`;
    }
  }
  
  return report;
}
