# Sistema de Agentes AI - Documentación Técnica

## Índice
1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Agentes Especializados](#agentes-especializados)
3. [Pipeline de Procesamiento de Artículos](#pipeline-de-procesamiento-de-artículos)
4. [API Endpoints](#api-endpoints)
5. [Base de Datos](#base-de-datos)
6. [Ejecución de Auditorías y Pipelines](#ejecución-de-auditorías-y-pipelines)
7. [Sistema de Evolución](#sistema-de-evolución)

---

## Arquitectura del Sistema

El sistema de agentes AI sigue un patrón de orquestación centralizada con agentes especializados que extienden una clase base común.

### Componentes Principales

```
server/agents/
├── core/
│   ├── AgentOrchestrator.ts   # Orquestador central
│   ├── BaseAgent.ts           # Clase base abstracta
│   ├── AgentEvolution.ts      # Sistema de evolución
│   ├── AgentKnowledge.ts      # Almacén de conocimiento
│   └── types.ts               # Tipos TypeScript
├── specialized/
│   ├── FormatterAgent.ts
│   ├── MetadataLinkerAgent.ts
│   ├── PolyglotTranslatorAgent.ts
│   ├── ContentAuditorAgent.ts
│   ├── SEOOptimizerAgent.ts
│   ├── ImageSuggestionAgent.ts
│   ├── CategoryAgent.ts
│   ├── WebsiteAuditorAgent.ts
│   └── ContentAnalyzerAgent.ts
├── storage/
│   ├── DatabasePersistence.ts # Persistencia en PostgreSQL
│   └── PCloudStorage.ts       # Almacenamiento en pCloud
└── api/
    └── agentRoutes.ts         # Endpoints REST
```

### AgentOrchestrator

El `AgentOrchestrator` es el componente central que:

- **Registra agentes**: Mantiene un mapa de agentes disponibles (`Map<AgentType, BaseAgent>`)
- **Gestiona cola de trabajos**: Cola con prioridad (critical, high, normal, low)
- **Ejecuta pipelines**: Secuencia de agentes para procesar artículos
- **Sincroniza con BD**: Carga trabajos pendientes y sincroniza estado
- **Maneja reintentos**: Política de reintentos con backoff exponencial

```typescript
class AgentOrchestrator {
  private agents: Map<AgentType, BaseAgent>;
  private jobQueue: AgentJob[];
  private activeJobs: Map<string, AgentJob>;
  
  // Métodos principales
  async initialize(): Promise<void>;
  registerAgent(agent: BaseAgent): void;
  async enqueueJob(agentType, payload, options?): Promise<AgentJob>;
  async runPipeline(articleId, stages[]): Promise<PipelineResult>;
  async processNextJob(): Promise<AgentJob | null>;
  startProcessing(intervalMs?: number): void;
  stopProcessing(): void;
}
```

### BaseAgent

Clase abstracta que define la estructura común para todos los agentes:

```typescript
abstract class BaseAgent {
  protected config: AgentConfig;
  protected knowledge: KnowledgeDocument[];
  protected skills: Map<string, SkillData>;

  // Método abstracto - cada agente lo implementa
  abstract execute(context: ExecutionContext, payload: Record<string, unknown>): Promise<AgentResult>;

  // Métodos protegidos
  protected async callLLM(messages, options?): Promise<string>;
  protected async analyzeForLearnings(context, input, output): Promise<SkillLearning[]>;
  protected async proposeEvolution(context, metrics): Promise<EvolutionProposal[]>;
}
```

### AgentConfig

Configuración estándar para cada agente:

```typescript
interface AgentConfig {
  agentType: AgentType;           // Identificador único
  name: string;                   // Nombre legible
  description: string;            // Descripción del agente
  systemPrompt: string;           // Prompt del sistema para LLM
  model: string;                  // Modelo OpenAI (gpt-4o, gpt-4o-mini)
  temperature: number;            // Control de aleatoriedad (0-1)
  maxTokens: number;              // Límite de tokens
  skills: string[];               // Habilidades del agente
  enabled: boolean;               // Estado activo
  concurrency: number;            // Trabajos simultáneos
  retryPolicy: {
    maxRetries: number;
    backoffMs: number;
    backoffMultiplier: number;
  };
}
```

---

## Agentes Especializados

### 1. FormatterAgent

**Tipo**: `formatter`  
**Propósito**: Limpia y formatea artículos extraídos de PDFs

**Funcionalidades**:
- Corrige saltos de línea rotos que dividen palabras/frases
- Fusiona párrafos incorrectamente divididos
- Elimina marcadores de página (ej: "-- 1 of 2 --")
- Limpia texto de pie de página (contacto, disclaimers)
- Preserva estructura: título, cuerpo, conclusión
- Mantiene citas legales y listas

**Configuración**:
- Modelo: `gpt-4o`
- Temperatura: `0.2` (alta precisión)
- Max Tokens: `8000`
- Concurrencia: `3`

**Payload**:
```json
{
  "articleId": "uuid",       // ID del artículo en BD
  "content": "string",       // O contenido directo
  "title": "string"          // Título original
}
```

**Resultado**:
```json
{
  "title": "Título limpio",
  "content": "Contenido formateado",
  "excerpt": "Primeras 2-3 oraciones"
}
```

---

### 2. MetadataLinkerAgent

**Tipo**: `metadata_linker`  
**Propósito**: Vincula artículos con autores, áreas de práctica y grupos de industria

**Funcionalidades**:
- Identifica nombres de abogados mencionados en el artículo
- Determina áreas de práctica relevantes
- Identifica sectores industriales aplicables
- Crea relaciones en la tabla `news_team_members`

**Áreas de Práctica Reconocidas**:
- corporate-ma, tax, labor-employment
- energy-natural-resources, antitrust-competition
- litigation-arbitration, compliance-investigations
- international-trade, real-estate
- data-protection-privacy, government-contracts, regulatory

**Configuración**:
- Modelo: `gpt-4o`
- Temperatura: `0.3`
- Max Tokens: `2000`
- Concurrencia: `5`

**Payload**:
```json
{
  "articleId": "uuid"
}
```

**Resultado**:
```json
{
  "practiceAreas": ["slug1", "slug2"],
  "industries": ["slug1"],
  "authorsLinked": ["author-id-1"],
  "authorsFound": 2,
  "practiceAreasMatched": 2
}
```

---

### 3. PolyglotTranslatorAgent

**Tipo**: `polyglot_translator`  
**Propósito**: Traduce contenido legal a 10 idiomas con terminología especializada

**Idiomas Soportados**:
| Código | Idioma |
|--------|--------|
| en | English |
| es | Spanish (fuente) |
| de | German |
| zh | Chinese (Simplified) |
| ko | Korean |
| ja | Japanese |
| ar | Arabic |
| ru | Russian |
| fr | French |
| it | Italian |

**Funcionalidades**:
- Traducciones precisas con registro legal formal
- Uso de glosario de términos legales
- Nombres propios sin traducir
- Mantiene citas, fechas y referencias
- Caché de traducciones para eficiencia

**Configuración**:
- Modelo: `gpt-4o`
- Temperatura: `0.3`
- Max Tokens: `8000`
- Concurrencia: `2`

**Payload**:
```json
{
  "articleId": "uuid",
  "targetLanguages": ["en", "de", "zh"],  // Opcional, por defecto todos
  "forceRetranslate": false               // Fuerza retraducción
}
```

**Resultado**:
```json
{
  "articleId": "uuid",
  "translations": {
    "en": { "title": "...", "excerpt": "...", "content": "..." },
    "de": { "title": "...", "excerpt": "...", "content": "..." }
  },
  "cached": 2,
  "translated": 8
}
```

---

### 4. ContentAuditorAgent

**Tipo**: `content_auditor`  
**Propósito**: Escanea la base de datos para detectar brechas de contenido

**Tipos de Escaneo**:
- `full`: Auditoría completa
- `translations`: Solo traducciones
- `metadata`: Solo metadatos
- `formatting`: Solo formato

**Tipos de Brechas Detectadas**:
| Tipo | Descripción | Severidad |
|------|-------------|-----------|
| missing_translation | Traducción faltante | high |
| missing_author | Sin autor vinculado | medium |
| poor_formatting | Formato deficiente | low |
| missing_excerpt | Sin extracto | medium |
| short_content | Contenido muy corto | low |

**Configuración**:
- Modelo: `gpt-4o`
- Temperatura: `0.2`
- Max Tokens: `4000`
- Concurrencia: `1`

**Payload**:
```json
{
  "scanType": "full"  // full, translations, metadata, formatting
}
```

**Resultado**:
```json
{
  "gaps": [...],
  "stats": {
    "articlesScanned": 150,
    "translationGaps": 45,
    "authorGaps": 12,
    "formattingIssues": 5
  },
  "tasksSuggested": [...]
}
```

---

### 5. SEOOptimizerAgent

**Tipo**: `seo_optimizer`  
**Propósito**: Optimiza títulos, meta descripciones y contenido para SEO

**Reglas de Optimización**:
- Títulos: 50-60 caracteres, incluir keyword principal
- Meta descripciones: 150-160 caracteres con call-to-action
- Extractos: 200-300 caracteres, informativos
- Slugs: lowercase, con guiones, 3-5 palabras

**Configuración**:
- Modelo: `gpt-4o`
- Temperatura: `0.4`
- Max Tokens: `2000`
- Concurrencia: `3`

**Payload**:
```json
{
  "articleId": "uuid",
  "applyChanges": true  // Aplicar cambios a BD
}
```

**Resultado**:
```json
{
  "optimizedTitle": "...",
  "optimizedTitleEs": "...",
  "metaDescription": "...",
  "suggestedSlug": "...",
  "keywords": ["kw1", "kw2"],
  "seoScore": 85,
  "improvements": ["improvement1", "improvement2"],
  "applied": true
}
```

---

### 6. ImageSuggestionAgent

**Tipo**: `image_suggestion`  
**Propósito**: Analiza contenido y genera imágenes con DALL-E 3

**Funcionalidades**:
- Extrae temas y conceptos clave del artículo
- Genera prompt detallado para DALL-E 3
- Crea imagen profesional y corporativa
- Retorna URL de imagen generada

**Configuración**:
- Modelo: `gpt-4o-mini`
- Temperatura: `0.7`
- Max Tokens: `500`
- Concurrencia: `2`

**Payload**:
```json
{
  "articleId": "uuid"
}
```

**Resultado**:
```json
{
  "articleId": "uuid",
  "imageUrl": "https://...",
  "imagePrompt": "Detailed prompt used",
  "themes": ["theme1", "theme2"],
  "style": "corporate/professional"
}
```

---

### 7. CategoryAgent

**Tipo**: `category_agent`  
**Propósito**: Categoriza automáticamente artículos para optimización SEO

**Áreas de Práctica Reconocidas**:
- Corporate/M&A, Banking & Finance
- Capital Markets, Competition/Antitrust
- Energy & Natural Resources, Environmental Law
- Foreign Trade, Government Contracts
- Intellectual Property, Labor & Employment
- Litigation & Arbitration, Privacy & Data Protection
- Real Estate, Tax, Telecommunications
- White Collar Crime

**Sectores Industriales**:
- Financial Services, Energy & Infrastructure
- Technology & Media, Healthcare & Life Sciences
- Manufacturing & Retail, Real Estate & Hospitality
- Transportation & Logistics

**Configuración**:
- Modelo: `gpt-4o-mini`
- Temperatura: `0.3`
- Max Tokens: `1000`
- Concurrencia: `3`

**Payload**:
```json
{
  "articleId": "uuid"
}
```

**Resultado**:
```json
{
  "articleId": "uuid",
  "categoryId": "uuid",
  "primaryCategory": "Tax",
  "categorySlug": "tax",
  "practiceAreas": ["practice-id-1"],
  "industrySectors": ["industry-id-1"],
  "tags": ["fiscal", "SAT", "impuestos"],
  "confidence": 0.95,
  "reasoning": "El artículo trata sobre..."
}
```

---

### 8. WebsiteAuditorAgent

**Tipo**: `website_auditor`  
**Propósito**: Auditoría completa del sitio web

**Módulos de Auditoría**:

| Módulo | Descripción |
|--------|-------------|
| translations | Verifica traducciones faltantes en 10 idiomas |
| content | Revisa perfiles incompletos, descripciones faltantes |
| seo | Audita títulos, slugs, meta descripciones |
| links | Verifica imágenes y enlaces rotos |

**Tipos de Ejecución**:
- `full`: Todos los módulos
- `delta`: Solo cambios recientes
- `links_only`: Solo verificación de enlaces
- `translations_only`: Solo traducciones
- `seo_only`: Solo SEO
- `content_only`: Solo contenido

**Severidades**:
- `critical`: Impacto inmediato en usuarios
- `high`: Afecta experiencia significativamente
- `medium`: Mejora recomendada
- `low`: Optimización opcional

**Configuración**:
- Modelo: `gpt-4o`
- Temperatura: `0.3`
- Max Tokens: `4096`
- Concurrencia: `1`

**Payload**:
```json
{
  "runType": "full",
  "skipModules": ["links"],
  "triggeredBy": "manual"
}
```

**Resultado**:
```json
{
  "auditId": "uuid",
  "findings": 45,
  "severityCounts": {
    "critical": 2,
    "high": 15,
    "medium": 20,
    "low": 8
  },
  "metrics": {
    "pagesScanned": 200,
    "linksChecked": 150,
    "translationsChecked": 500,
    "executionTimeMs": 45000
  }
}
```

---

## Pipeline de Procesamiento de Artículos

El pipeline estándar procesa artículos en secuencia:

```
┌─────────────┐    ┌──────────────────┐    ┌─────────────────────┐    ┌───────────────┐
│  Formatter  │ -> │  MetadataLinker  │ -> │ PolyglotTranslator  │ -> │ SEOOptimizer  │
└─────────────┘    └──────────────────┘    └─────────────────────┘    └───────────────┘
      │                    │                        │                        │
      ▼                    ▼                        ▼                        ▼
 Limpia texto       Vincula autores          Traduce a 10           Optimiza SEO
 Genera excerpt     Asigna áreas             idiomas                Genera keywords
```

### Etapas del Pipeline

1. **FormatterAgent**: Limpia el texto extraído del PDF
2. **MetadataLinkerAgent**: Vincula con autores y áreas de práctica
3. **PolyglotTranslatorAgent**: Traduce a todos los idiomas
4. **SEOOptimizerAgent**: Optimiza para motores de búsqueda

### Ejecución del Pipeline

```typescript
// Pipeline para un artículo
const result = await orchestrator.runPipeline(articleId, [
  'formatter',
  'metadata_linker', 
  'polyglot_translator',
  'seo_optimizer'
]);
```

---

## API Endpoints

Base URL: `/api/agents`

### Estado del Sistema

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/status` | Estado general del orquestador |
| GET | `/stats/:agentType` | Estadísticas de un agente específico |
| GET | `/jobs` | Historial de trabajos |
| GET | `/jobs/failed` | Trabajos fallidos |

### Ejecución de Agentes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/run/:agentType` | Ejecutar agente manualmente |
| POST | `/queue` | Encolar trabajo |
| POST | `/processing/start` | Iniciar procesamiento |
| POST | `/processing/stop` | Detener procesamiento |

### Pipelines

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/pipeline/:articleId` | Pipeline para un artículo |
| POST | `/pipeline/batch` | Pipeline para múltiples artículos |
| POST | `/pipeline/process-all` | Procesar todos los artículos |

### Auditorías

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/audit` | Ejecutar auditoría de contenido |
| POST | `/analyze/:articleId` | Analizar artículo específico |
| GET | `/analyze/:articleId` | Obtener análisis existente |

### Sistema de Evolución

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/evolution/proposals` | Listar propuestas de evolución |
| POST | `/evolution/proposals/:id/status` | Actualizar estado de propuesta |
| POST | `/evolution/learning-cycle` | Ejecutar ciclo de aprendizaje |

### Base de Conocimiento

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/knowledge/:agentType` | Documentos de conocimiento |
| POST | `/knowledge/:agentType/search` | Buscar en conocimiento |

### Almacenamiento pCloud

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/pcloud/test` | Probar conexión |
| POST | `/pcloud/sync` | Sincronizar datos |
| POST | `/pcloud/load` | Cargar datos |

---

## Base de Datos

### Tablas del Sistema de Agentes

#### agent_jobs
Almacena todos los trabajos de agentes.

```sql
CREATE TABLE agent_jobs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',    -- pending, in_progress, completed, failed, cancelled
  priority TEXT NOT NULL DEFAULT 'normal',   -- low, normal, high, critical
  payload JSONB NOT NULL,
  result JSONB,
  error TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  parent_job_id VARCHAR
);
```

#### agent_events
Log de eventos de los agentes.

```sql
CREATE TABLE agent_events (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id VARCHAR NOT NULL,
  agent_type TEXT NOT NULL,
  event_type TEXT NOT NULL,    -- start, progress, complete, error, learning, evolution_proposal
  message TEXT NOT NULL,
  data JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

#### agent_knowledge
Documentos de conocimiento para los agentes.

```sql
CREATE TABLE agent_knowledge (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### agent_skills
Seguimiento de habilidades de los agentes.

```sql
CREATE TABLE agent_skills (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  expertise INTEGER DEFAULT 50,       -- 0-100
  usage_count INTEGER DEFAULT 0,
  success_rate INTEGER DEFAULT 100,   -- 0-100
  learnings JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### agent_evolution_proposals
Propuestas de mejora generadas por los agentes.

```sql
CREATE TABLE agent_evolution_proposals (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT NOT NULL,
  proposal_type TEXT NOT NULL,    -- skill_improvement, new_skill, config_change, knowledge_update
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  rationale TEXT,
  impact TEXT NOT NULL DEFAULT 'medium',    -- low, medium, high
  status TEXT NOT NULL DEFAULT 'pending',   -- pending, approved, rejected, implemented
  proposed_changes JSONB,
  metrics_before JSONB,
  metrics_after JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  implemented_at TIMESTAMP
);
```

---

## Ejecución de Auditorías y Pipelines

### Ejecutar Auditoría de Contenido

```bash
# Auditoría completa
curl -X POST http://localhost:5000/api/agents/audit \
  -H "Content-Type: application/json" \
  -d '{"scanType": "full"}'

# Solo traducciones
curl -X POST http://localhost:5000/api/agents/audit \
  -H "Content-Type: application/json" \
  -d '{"scanType": "translations"}'
```

### Ejecutar Pipeline para Artículo

```bash
# Pipeline completo
curl -X POST http://localhost:5000/api/agents/pipeline/ARTICLE_ID \
  -H "Content-Type: application/json" \
  -d '{"stages": ["formatter", "metadata_linker", "polyglot_translator", "seo_optimizer"]}'

# Solo formato y traducción
curl -X POST http://localhost:5000/api/agents/pipeline/ARTICLE_ID \
  -H "Content-Type: application/json" \
  -d '{"stages": ["formatter", "polyglot_translator"]}'
```

### Procesar Todos los Artículos

```bash
curl -X POST http://localhost:5000/api/agents/pipeline/process-all \
  -H "Content-Type: application/json" \
  -d '{"limit": 10}'
```

### Ejecutar Agente Individual

```bash
# FormatterAgent
curl -X POST http://localhost:5000/api/agents/run/formatter \
  -H "Content-Type: application/json" \
  -d '{"articleId": "ARTICLE_ID"}'

# SEOOptimizerAgent
curl -X POST http://localhost:5000/api/agents/run/seo_optimizer \
  -H "Content-Type: application/json" \
  -d '{"articleId": "ARTICLE_ID", "applyChanges": true}'
```

### Gestión del Procesamiento

```bash
# Iniciar procesamiento automático
curl -X POST http://localhost:5000/api/agents/processing/start

# Detener procesamiento
curl -X POST http://localhost:5000/api/agents/processing/stop

# Ver estado
curl http://localhost:5000/api/agents/status
```

---

## Sistema de Evolución

El sistema de evolución permite que los agentes mejoren automáticamente basándose en su rendimiento.

### Componentes

#### AgentEvolutionTracker
- Monitorea estadísticas de cada agente
- Genera propuestas de mejora automáticamente
- Ejecuta ciclos de aprendizaje

#### Tipos de Propuestas

| Tipo | Descripción |
|------|-------------|
| skill_improvement | Mejora de habilidad existente |
| new_skill | Nueva habilidad propuesta |
| config_change | Cambio de configuración |
| knowledge_update | Actualización de conocimiento |

#### Estados de Propuestas

| Estado | Descripción |
|--------|-------------|
| pending | Pendiente de revisión |
| approved | Aprobada para implementación |
| rejected | Rechazada |
| implemented | Implementada |

### Ciclo de Aprendizaje

El ciclo de aprendizaje analiza:
1. **Tasa de éxito**: Si es < 80%, genera propuesta de mejora
2. **Tiempo de ejecución**: Si > 30s promedio, sugiere optimización
3. **Propuestas pendientes**: Alerta si hay muchas sin revisar

```bash
# Ejecutar ciclo de aprendizaje
curl -X POST http://localhost:5000/api/agents/evolution/learning-cycle
```

### Gestión de Propuestas

```bash
# Listar propuestas pendientes
curl "http://localhost:5000/api/agents/evolution/proposals?status=pending"

# Aprobar propuesta
curl -X POST http://localhost:5000/api/agents/evolution/proposals/PROPOSAL_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "approved"}'

# Marcar como implementada con métricas
curl -X POST http://localhost:5000/api/agents/evolution/proposals/PROPOSAL_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "implemented", "afterMetrics": {"successRate": 0.95}}'
```

---

## Flujo de Datos

```
                    ┌──────────────────────────────────────────────────────┐
                    │                   AgentOrchestrator                   │
                    │  ┌─────────────┐  ┌───────────────┐  ┌────────────┐  │
                    │  │  jobQueue   │  │  activeJobs   │  │   agents   │  │
                    │  └─────────────┘  └───────────────┘  └────────────┘  │
                    └──────────────────────────────────────────────────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
                    ▼                      ▼                      ▼
            ┌───────────────┐      ┌───────────────┐      ┌───────────────┐
            │   Formatter   │      │   Translator  │      │   Auditor     │
            │    Agent      │      │     Agent     │      │    Agent      │
            └───────────────┘      └───────────────┘      └───────────────┘
                    │                      │                      │
                    └──────────────────────┴──────────────────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
                    ▼                      ▼                      ▼
            ┌───────────────┐      ┌───────────────┐      ┌───────────────┐
            │  agent_jobs   │      │agent_knowledge│      │agent_evolution│
            │               │      │               │      │  _proposals   │
            └───────────────┘      └───────────────┘      └───────────────┘
                                           │
                                           ▼
                                  ┌───────────────────┐
                                  │     PostgreSQL    │
                                  │     Database      │
                                  └───────────────────┘
```

---

## Consideraciones de Rendimiento

### Concurrencia por Agente

| Agente | Concurrencia | Razón |
|--------|--------------|-------|
| FormatterAgent | 3 | Procesamiento moderado |
| MetadataLinkerAgent | 5 | Consultas rápidas |
| PolyglotTranslatorAgent | 2 | Alto consumo de tokens |
| ContentAuditorAgent | 1 | Evita conflictos de BD |
| SEOOptimizerAgent | 3 | Procesamiento moderado |
| ImageSuggestionAgent | 2 | Límites de DALL-E |
| CategoryAgent | 3 | Procesamiento rápido |
| WebsiteAuditorAgent | 1 | Auditoría secuencial |

### Modelos LLM Utilizados

| Agente | Modelo Primario | Fallbacks |
|--------|-----------------|-----------|
| FormatterAgent | gpt-4o | gpt-4o-mini, gpt-3.5-turbo |
| MetadataLinkerAgent | gpt-4o | gpt-4o-mini, gpt-3.5-turbo |
| PolyglotTranslatorAgent | gpt-4o | gpt-4o-mini, gpt-3.5-turbo |
| ContentAuditorAgent | gpt-4o | gpt-4o-mini, gpt-3.5-turbo |
| SEOOptimizerAgent | gpt-4o | gpt-4o-mini, gpt-3.5-turbo |
| ImageSuggestionAgent | gpt-4o-mini | - |
| CategoryAgent | gpt-4o-mini | - |
| WebsiteAuditorAgent | gpt-4o | gpt-4o-mini, gpt-3.5-turbo |

---

## Mantenimiento

### Limpieza de Trabajos Antiguos

Los trabajos completados o fallidos se mantienen en la base de datos para análisis. Se recomienda:

1. Archivar trabajos > 30 días
2. Eliminar eventos > 90 días
3. Revisar propuestas pendientes semanalmente

### Monitoreo Recomendado

1. **Tasa de éxito por agente**: Alertar si < 80%
2. **Cola de trabajos pendientes**: Alertar si > 100
3. **Tiempo de ejecución promedio**: Alertar si > 60s
4. **Propuestas de evolución pendientes**: Revisar semanalmente

---

*Documentación generada el: Diciembre 2025*
*Versión del sistema: 1.0*
