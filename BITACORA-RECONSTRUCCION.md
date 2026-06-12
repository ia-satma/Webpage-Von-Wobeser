# Bitácora de reconstrucción — Webpage-Von-Wobeser
> Generada por auditoría multi-agente (14 agentes, verificación adversarial). Cada lote: hallazgo verificado contra el código real + fix. Marca el estado conforme se aplica.

## Hallazgo transversal crítico (leer primero)

### SEGURIDAD — notas del verificador

Verifiqué los 10 lotes leyendo el código real. Toda la evidencia archivo:línea es correcta y los hallazgos son reales. Hay 3 imprecisiones importantes que corrijo en los lotes y que un agente de Replit necesita para no romper nada:

1) HALLAZGO TRANSVERSAL CRÍTICO (afecta P0-1, P0-3, P2-2): el sistema de roles está MAL en el código existente. shared/schema.ts:351 define role con .default('editor') y taxonomía válida 'super_admin, editor, author' — NO existe el rol 'admin'. Sin embargo, los 61 requireRole del codebase usan TODOS requireRole('editor','admin') y NINGUNO incluye 'super_admin'. El único usuario creado tiene role 'super_admin' (routes.ts:924, seed.ts:1210). requireRole (auth.ts:171) hace includes() estricto sin bypass de super_admin. CONCLUSIÓN: los 61 endpoints admin existentes YA ESTÁN ROTOS para el único usuario real (un super_admin recibe 403 en todos). Por eso el instinto del lote P0-1 de incluir 'super_admin' es correcto y urgente. Corregí el set de roles a requireRole('super_admin','editor','admin') en todos los lotes (mantengo 'admin' por consistencia con la convención existente aunque sea fantasma; 'super_admin' es el load-bearing). Añadí riesgo_replit señalando este bug latente preexistente.

2) P0-3 ROMPE EL PANEL ADMIN (corregido): /api/system/chronicler SÍ lo consume client/src/pages/admin/AdminGuide.tsx:417 y /api/health-check/run SÍ lo consume client/src/pages/admin/AdminHealthCheck.tsx:462 — AMBOS vía el getQueryFn por defecto (client/src/lib/queryClient.ts:31) que envía credentials:'include' (cookies) pero NO envía header Authorization Bearer. authMiddleware (auth.ts:117-163) solo lee Bearer y NO lee cookies. Por tanto, al poner authMiddleware en esos GET, ambas páginas admin recibirán 401. La corrección obligatoria es migrar esas dos llamadas del cliente a adminApiRequest (client/src/lib/adminAuth.ts:42, que sí adjunta Bearer desde localStorage) o el panel se rompe. Además health-check/run tiene un comentario explícito en routes.ts:3518-3519 que dice 'intentionally public (read-only diagnostic)' — lo documento.

3) P2-1 confirmado: el frontend (client/src/hooks/usePipelineProgress.ts:69) conecta a /ws/pipeline SIN token; tras el lote el panel deja de recibir progreso hasta actualizar esa llamada a /ws/pipeline?token=. storage.getAdminSession existe (storage.ts:642) y devuelve AdminSession con .expiresAt — la lógica del lote es válida.

Confirmaciones que dejan lotes SÓLIDOS sin cambio mayor: P1-1 (express-rate-limit NO está en package.json; /api/translate-entity y /api/translate-content sí son públicos del cliente, /api/translate y /api/translate/batch NO los llama el cliente público; el batch ya valida array en routes.ts:2644). P1-3 (los 6 archivos en public/generated-images/ cumplen ^[A-Za-z0-9._-]+$, el regex es seguro). P2-3 (.replit:47-49 exacto). P3-1 (index.ts:52-68 y routes.ts:661 exactos). P0-2 (routes.ts:2945/3179 y agentRoutes.ts:133/169 exactos). P1-2 (index.ts:15-20 exacto). Todos los imports requeridos (crypto, WebSocketServer, path, fs, express, authMiddleware/requireRole en routes.ts:68-69) existen.

### Capa de Datos / Drizzle ORM (shared/schema.ts, server/db.ts, server/seed.ts, drizzle.config.ts) — notas del verificador

Verifiqué los 6 lotes contra el código real. Los archivo:línea citados existen y dicen lo afirmado en la inmensa mayoría de los casos (verificado leyendo shared/schema.ts, server/storage.ts, server/routes.ts, server/seed.ts, server/db.ts, drizzle.config.ts, package.json, .gitignore).

HALLAZGOS QUE EXIGEN CORRECCIÓN:

1) P1-4 (CRÍTICO, el más serio): La premisa de que los índices sobre columnas de filtro acelerarán las rutas públicas es PARCIALMENTE FALSA. Verifiqué que routes.ts:683 filtra representative_matters con JavaScript (allMatters.filter(m => m.practiceAreaSlug === slug)) tras llamar storage.getRepresentativeMatters() que trae TODO; y routes.ts:391/402 filtran news por published/publishAt también en JS (allNews.filter(...)). storage.getNews() (línea 312) es un db.select().from(news) sin WHERE. NO existe ningún filtro SQL sobre news.published, news.publishAt ni blogPosts.status (grep devolvió cero). Por tanto: el criterio de aceptación 'EXPLAIN ANALYZE ... debe mostrar Index Scan en vez de Seq Scan' para representative_matters es INALCANZABLE con el código actual (la query no filtra en SQL), y los índices propuestos 2 (rep_matters), 6 (news_published_publishat_idx, blog_posts_status_idx) serían peso muerto hasta que se empujen los filtros a SQL. Corregí el lote: marqué esos índices como 'condicionados a refactor' y reescribí la aceptación para que valide solo los índices que SÍ se usan en SQL (pivotes en joins/cascada, newsTranslations(newsId,language) usado en storage.ts:1047-1051, websiteAuditFindings.auditId usado en storage.ts:1137, agentEvents.jobId, contentAnalysis.articleId). Nota adicional: events SÍ filtra published en SQL (storage 726/739) y sería un índice útil que el lote no propone.

2) P1-3 (MAYOR): Hechos núcleo verificados (no existe migrations/, package.json solo expone db:push, .gitignore NO ignora migrations/ así que esa parte ya está OK como no-op). Pero el paso 3 (manipular manualmente drizzle.__drizzle_migrations e 'insertar el hash del baseline' leyendo meta/_journal.json) es confuso y propenso a error: un agente de Replit podría adivinar mal el hash/formato y corromper el tracking. Lo reescribí a un procedimiento inequívoco usando 'drizzle-kit migrate' con el entendido de que drizzle-kit crea y rellena su tabla de tracking automáticamente, y la estrategia segura para una BD ya poblada (no correr migrate contra prod; dejar el baseline versionado). Confirmé que db.ts usa neon-http pero drizzle-kit migrate usa su propia conexión vía DATABASE_URL, independiente de db.ts, así que 'no cambies el driver' es correcto.

3) P1-1 (menor imprecisión): El hallazgo dice que storage borra blogPostTags 'línea 616'; la sentencia real está en storage.ts:617 (deleteBlogTag) y el delete de newsTeamMembers en storage.ts:342 (deleteNews). Corregí el número. El resto (líneas 220-236, 418-422, 911-921, 947-951, 1124-1129) verificado EXACTO. Razonamiento de orden de declaración es correcto: todas las tablas son const top-level en el mismo módulo y .references usa arrow function diferida, así que el orden no importa para .references().

4) Detalle menor en todos los lotes que tocan FK: el seed() corre en CADA arranque del servidor (routes.ts:179 await seed()) e inserta filas pivote; las FK con cascada son compatibles, pero los DELETE/UPDATE de limpieza de huérfanos deben correr ANTES del push o fallará — esto el lote ya lo dice, lo refuerzo.

P1-2, P1-5 y P1-6 quedan SÓLIDOS tras verificación (líneas exactas confirmadas: schema 90/96/98/276/309/400/401/447/672/700/713/969/1003; seed 1159-1222; blogPostFormSchema 468-485). Solo añadí matices de riesgo menores.

ORDEN DE EJECUCIÓN: el orden propuesto (P1-1 -> P1-2 -> P1-4 -> P1-3 al final) es correcto para que el baseline de migrations capture FKs e índices. P1-5 y P1-6 son independientes y no tocan la BD (P1-6 solo Zod), pueden ir en cualquier momento.

### Sistema de Agentes / Fachadas — notas del verificador

Verifiqué los 7 lotes contra el código real leyendo cada archivo:línea citado. Resumen del veredicto por lote:

SÓLIDOS (evidencia y prompt correctos, correcciones menores de precisión): P2-1, P2-3, P2-4, P2-5, P2-7.

CON OBSERVACIÓN MAYOR CORREGIDA: P2-2 contenía un error de hecho que habría hecho que el agente de Replit asignara mal el campo `kind`. La premisa "exactamente 9 cards = queued_agent" es FALSA. Hallazgos verificados: (a) los 9 agentes registrados en server/agents/index.ts:35-43 son formatter, metadata_linker, polyglot_translator, content_auditor, seo_optimizer, **image_suggestion** (línea 40, NO content_analyzer como dice el hallazgo original... en realidad content_analyzer SÍ está en línea 43; el hallazgo original OMITÍA image_suggestion y por eso desbalanceaba la cuenta), category_agent, website_auditor, content_analyzer. Total real registrado = 9. (b) PERO el AGENT_REGISTRY de SystemChronicler.ts NO tiene un card con id 'image_suggestion'; en su lugar tiene 'smart_image_generator' (línea 90), que NO se registra como agente en cola (grep en index.ts/agentRoutes.ts no lo encuentra). (c) 'image_suggestion' SÍ existe como entrada de traducción (adminTranslations.ts:86) pero NO como card del registro. Conclusión: solo 8 de los 14 cards del registro corresponden a agentes-en-cola reales (formatter, metadata_linker, polyglot_translator, content_auditor, seo_optimizer, category_agent, website_auditor, content_analyzer). El card 'smart_image_generator' es la cara de un agente cuya implementación en cola se llama 'image_suggestion'. Corregí el prompt de P2-2 para reflejar esto (8 queued_agent + smart_image_generator como 'service' con nota), ajusté el criterio de aceptación de "9 cards" a "8 cards", y añadí riesgo_replit sobre el desajuste de ids registro vs traducción.

OTRA IMPRECISIÓN MENOR DETECTADA Y CORREGIDA (afecta P2-2, P2-3): el esquema de ids difiere entre capas. El registro usa 'smart_image_generator' y 'auto_recovery'; la capa de traducción (adminTranslations.ts y getAgentCardTranslation, llamado por agent.id en NerveCenter.tsx:119) usa 'image_suggestion' y 'self_healing'. Esto es un bug latente preexistente (las traducciones de esos 2 cards probablemente no resuelven) — fuera de alcance de estos lotes, pero lo documenté como riesgo porque P2-2 toca esa capa.

P2-1: corregí la frase confusa de la evidencia ("el único caller relacionado es recordEvolution en routes.ts:3401" — routes.ts:3401 llama recordEvolution, NO updateAgentStatus; updateAgentStatus NO tiene ningún caller, confirmado por grep). Verifiqué que dbPersistence.getJobStatsByAgentType (línea 69), getRecentJobs (111), getRecentEvents (135), getSkillsByAgent (208) existen. Añadí riesgo sobre el desajuste card.id vs agentType (smart_image_generator/auto_recovery no tienen jobs porque su agentType en cola es image_suggestion/—): el mapeo "id del card → agentType de jobs" del prompt fallará para smart_image_generator y auto_recovery; lo aclaré.

P2-3: verificado. recordEvolution solo se invoca desde routes.ts:3401; getDefaultTimeline en 315-366; system_evolution.json tiene los 6 eventos dic-2025. Confirmé NO hay import circular (AgentEvolution no importa SystemChronicler y viceversa). Precisé que recordEvolution impact solo acepta 'major'|'minor'|'critical' (SystemChronicler.ts:33) — el prompt usa 'minor', válido.

P2-5: gpt-5 confirmado en líneas 36, 77, 108; comentario línea 5; baseURL del proxy líneas 6-9. Prompt sólido.

P2-7: switch en agentRoutes.ts:98-125 (no 98-124) con 8 cases, OMITE website_auditor, default 400 en línea 124. websiteAuditorAgent NO importado (imports 7-14). Doble initialize CONFIRMADO: index.ts:112 y agents/index.ts:33, ambos sin guard de idempotencia (AgentOrchestrator.initialize líneas 35-44 no tiene guard). IMPORTANTE: routes.ts:3573 llama initializeAgents() de forma fire-and-forget (.catch, NO await) ANTES del listen — la opción "alternativa segura" del guard `if (this.initialized) return;` es la MÁS recomendable porque el reorden propuesto en el prompt es arriesgado dado que initializeAgents corre sin await durante registerRoutes. Reforcé esa recomendación.

P2-4: depende de P2-1, verificado (interface frontend NerveCenter.tsx:6-16 NO tiene lastActive; isActive en 118; clases en 128-130; StatusIndicator 65-107). Sólido.

P2-6: runLearningCycle (227-280) sin caller programado, solo POST manual agentRoutes.ts:262; status 'pending' línea 249; umbrales 0.8/30000 confirmados. Sólido. Nota: el prompt importa 'evolutionTracker' — el export correcto es `evolutionTracker` desde './agents/core/AgentEvolution' (confirmado AgentEvolution.ts:316); index.ts ya importa orchestrator pero NO evolutionTracker, así que hay que añadir el import. Lo precisé.

### CONSTRUIR FEATURES HUÉRFANAS (P3) — cablear extremo a extremo tablas definidas pero nunca usadas — notas del verificador

Los 7 lotes están bien fundamentados en evidencia real: todas las tablas huérfanas, archivo:línea y patrones citados se verificaron contra el código. Pero hay defectos ejecutables que un agente de Replit reproduciría literalmente:

(1) P3-1 RATE-LIMIT ROTO (mayor): el mecanismo de rate-limit es de DOS partes. `checkRateLimit(id)` (auth.ts L41) solo verifica si YA está bloqueado y devuelve `allowed:true` si no existe entrada en el Map; quien INCREMENTA el contador es `recordLoginAttempt(id,false)` (auth.ts L75). El prompt solo llama `checkRateLimit('newsletter:'+ip)` y nunca `recordLoginAttempt`, así que el contador queda en 0 para siempre y el 429 NUNCA se dispara. El criterio de aceptación '>10 veces rápido → 429' es además incorrecto: MAX_ATTEMPTS=5 (no 10) y `recordLoginAttempt(id,true)` en éxito BORRA la entrada (resetea el límite). Corregido: añadir `recordLoginAttempt('newsletter:'+ip,false)` tras cada inserción y NO registrar éxito, y bajar el umbral del criterio a 5.

(2) P3-1 `z` NO IMPORTADO (mayor): routes.ts solo importa `{ ZodError }` de 'zod' (L53), NO `z`. El prompt instruye `z.string().email()` inline sin pedir importar `z` → ReferenceError / fallo de compilación. Corregido: usar validación de email por regex (sin dependencia de `z`), consistente con que /api/contact usa un schema pre-definido y no `z` inline.

(3) P3-2 y P3-3 DEPENDENCIA FALSA (menor): ambos dicen 'ASUME que el lote P1 de datos/FKs ya corrió; ejecútalo antes'. Verificado: proBonoProjects y diversityInitiatives NO tienen ningún `.references()`/FK (son tablas de contenido autónomas). `npm run db:push` solo las crea. Esa precondición es engañosa y podría hacer que el agente se detenga esperando un prerrequisito inexistente. Corregido: eliminada.

(4) P3-3 referencia imprecisa al array (menor): el array no es una variable top-level `initiatives` sino `t.initiatives` (anidado dentro de cada objeto de idioma content.en/es/de/fr en DiversityInclusion.tsx L46-67). Afilado en el prompt.

(5) P3-4 innerJoin sin precedente (menor): no hay ningún `innerJoin` en storage.ts. `db.select().from(teamMemberRankings).innerJoin(rankings,...)` devuelve filas con forma `{ team_member_rankings:{...}, rankings:{...} }`, NO un `FirmRanking[]` plano — hay que mapear `row.rankings`. Afilado. Además la tabla firma `rankings` NO tiene seed (verificado: las coincidencias 'rankings' en seed.ts son keys del JSONB de teamMembers y categorías de news, no la tabla). El prompt ya maneja esto omitiendo el seed de vínculos, pero el criterio de aceptación 'con un rankingId real' requiere crear primero un ranking vía el CRUD admin existente — añadido al criterio.

(6) P3-6 `onConflictDoUpdate` nuevo patrón (informativo): no existe en el código (solo `onConflictDoNothing` en seed.ts L1212). Es sintaxis Drizzle válida; añadido como nota de riesgo para que el agente no lo confunda.

P3-5 y P3-7 quedan sólidos sin cambios funcionales (solo verificados). Todos los patrones GET público con Cache-Control (routes.ts L502,528), CRUD admin con authMiddleware/requireRole (L1571+), seed idempotente length===0 (L1156+), seed() llamado en registerRoutes (L179), y el default queryFn que hace queryKey.join('/') (queryClient.ts L32) están confirmados.

### Calidad Frontend + Design System (client/src) — Von Wobeser y Sierra (Replit) — notas del verificador

Los 7 lotes son en su mayoría sólidos: verifiqué archivo:línea contra el código real y casi todas las citas coinciden. Hallazgos que requirieron corrección: (1) P4-5 tiene una INCONSISTENCIA real de conteo — la cifra 402 sólo se obtiene con el set de 9 prefijos (bg|text|border|ring|from|to|via|fill|stroke); la grep de evidencia y de aceptación usa sólo 4 prefijos (bg|text|border|ring) y arroja 393, no 402. Los conteos por archivo del lote (AdminTeamForm 150, Team 29, TeamMemberDetail 19, etc.) son correctos pero son conteos por OCURRENCIA (grep -roE | wc -l), no por línea (grep -cE da 116/27/16). Además el token --border es 0 0% 87% = #DEDEDE, NO #D9D8D7 como dice la evidencia. Corregí la aceptación y la evidencia. (2) P4-2: el endpoint /api/health-check/run NO es un descuido — tiene un comentario explícito en server/routes.ts:3518-3519 'Health check is intentionally public (read-only diagnostic)'. Suavicé la framing de 'fuga de datos' a nivel API. El guard de frontend sí es válido (las 4 páginas no importan useAdminAuth, confirmado, y las 4 están ruteadas en App.tsx:178-186). (3) P4-4: existen DOS archivos AdminAgents.tsx (pages/ y pages/admin/) que difieren; el ruteado es pages/AdminAgents.tsx (App.tsx:51,172) — el lote targetea el correcto, pero añadí riesgo de no editar el duplicado. La Parte B (queryFn explícito) es load-bearing: el fetcher por defecto hace queryKey.join('/') (queryClient.ts:32), así que cambiar el queryKey a [path,{limit}] SIN queryFn rompería la URL. (4) P4-1: el frontend lee isProcessing además de los 3 campos planos; y getJobCounts() ya expone completed/failed reales en el servidor (más directo que derivar de jobStatsByAgent). Añadí estas notas. P4-3, P4-6 y P4-7 quedaron sólidos sin correcciones de fondo (conteos 5 client / 111 server, 68 gray-*, 6 componentes, 4 rounded-full target + exenciones circulares — todo verificado exacto). Scripts del proyecto: build = 'tsx script/build.ts' (npm run build lo invoca), check = 'tsc' (npm run check).

### i18n + Accesibilidad + SEO (P5) — notas del verificador

Los 5 lotes describen gaps REALES y verificados contra el código, pero 3 contienen imprecisiones que un agente de Replit podría ejecutar mal o que harían fallar los criterios de aceptación. Correcciones aplicadas: (P5-1) El hallazgo mapeaba mal rutas a líneas de App.tsx (los números 143/145/147/149 son correctos pero las etiquetas de ruta estaban en orden equivocado: 143=/practice-groups/:slug, 145=/industry-groups/:slug, 147=/team/:slug, 149=/news/:slug). Además los 4 archivos YA importan useLanguage (no solo 2). El prompt no daba el patrón de traducción real: los registros tienen columna base (name/title/bio/description) + columna *Es (titleEs/bioEs/nameEs/descriptionEs) + hook useTranslatedContent para otros idiomas; sin esa guía el agente pondría descripción monolingüe. El campo de imagen es imageUrl y suele ser relativo (Open Graph exige URL absoluta). (P5-2) Sólido; única corrección: el robots.txt dinámico no solo carece de Disallow /admin/ sino también de la allowlist de AI-crawlers (GPTBot, Anthropic-AI, Claude-Web, etc.) y Crawl-delay que sí tiene el estático; el prompt original no instruía restaurarlos. (P5-3) Corrección MAYOR: Footer.tsx (785 líneas) NO usa NINGUNA clase física direccional (ml/mr/pl/pr/left/right/space-x/text-left) — solo usa gap-/items-/justify-/mx-/px- que son simétricas y RTL-safe vía flex+dir. Convertir Footer es casi un no-op; el trabajo real está en Header.tsx (text-left, left-0/right-0, pl-4). Además el left-0 right-0 de la línea 322 es la barra fija full-width (top-0 left-0 right-0), simétrica — NO debe convertirse a start/end. Tailwind 3.4.17 confirma soporte de utilidades lógicas, así que el fallback a variantes rtl: es innecesario. (P5-4) Corrección: el criterio de aceptación usa grep 'pt is not yet a supported' que devuelve 0 coincidencias (el texto real es '"pt") is not yet a supported UI language' con paréntesis+comilla entre pt e is); el grep correcto es 'is not yet a supported UI language' (2 coincidencias). El código usa la flecha Unicode → no '->'. (P5-5) Corrección MAYOR: NO existe ninguna config de ESLint en el repo (ni client/.eslintrc.cjs, ni root, ni eslint.config.js) NI dependencia eslint en package.json, y NO existe client/package.json (es monorepo de un solo package.json con Vite root=client). Los archivos citados client/.eslintrc.cjs y client/package.json NO EXISTEN. La ruta primaria (agregar plugin a un extends existente) es engañosa; agregar ESLint desde cero a un proyecto Vite sin lint es más invasivo y arriesga el build de Replit. Se reordena para que A11Y-GUIDELINES.md sea la ruta primaria segura y ESLint quede como opcional con caveat fuerte. Evidencia de accesibilidad confirmada exacta: 52 img / 0 sin alt / 20 alt="" / 74 aria-hidden.

### BUILD / CONFIG / CRUFT / REPLIT-ESPECÍFICO (P6) — notas del verificador

Verifiqué los 6 lotes contra el código real del repo en /Users/imacdesantiago/Desktop/Webpage-Von-Wobeser. La mayoría de la evidencia archivo:línea es correcta, pero hay DOS problemas que requieren corrección antes de ejecutar en Replit:

1) BLOQUEANTE en P6-1: La aceptación usaba `git ls-files "*.png" | grep -vE "client|public|server"` esperando vacío o solo image_1764710915519.png. FALSO: ese grep NO excluye `attached_assets/` ni `.canvas/`, así que devuelve ~250 PNGs de attached_assets MÁS 3 PNGs de `.canvas/assets/`. La aceptación nunca pasaría y un agente la interpretaría como fallo. CORREGIDO el filtro de aceptación y el paso de verificación.

2) HALLAZGO NUEVO en P6-1: Hay 3 archivos `.canvas/assets/asset_*.png` que están TRACKEADOS y que `git check-ignore` confirma NO están ignorados (la regla `/*.png` solo cubre PNGs en la raíz literal, no subcarpetas). El lote original no los mencionaba. Como `.canvas/` ya está en .gitignore (línea 12) pero estos quedaron trackeados antes, agregué su des-trackeo al prompt. El conteo "19 PNGs" del hallazgo original mezclaba 16 debug de raíz + 3 de .canvas; lo aclaré.

3) Imprecisión menor en P6-1 paso 3: la lista de comandos duplicaba `about-page.png`. CORREGIDO (16 archivos únicos, todos verificados como trackeados).

4) Imprecisión menor en P6-4 hallazgo: dice que "import-articles.ts genera extracted_articles.json"; en realidad es extract-articles.ts:260 quien lo ESCRIBE; import-articles.ts:157 solo lo LEE. Además extracted_articles.json SÍ está trackeado en git. CORREGIDO evidencia. La operación de borrado de P6-4 (solo archivos `^(image_|IMG_)`) la verifiqué SEGURA: de 185 archivos image_/IMG_, solo image_1764710915519.png está referenciado (Footer.tsx:7); el resto de assets referenciados — collages, vwys_branded/, chambers, mapa, logovw, Recurso_2, partner_photos — NO llevan prefijo image_/IMG_, así que el loop no los toca.

5) LIMITACIÓN DE ENTORNO (afecta P6-2 y P6-3): node_modules NO está instalado en este entorno de verificación, por lo que NO pude ejecutar empíricamente `npm run build` ni `npm run check`. Las afirmaciones de que el build compila y de que no hay errores de tipos preexistentes quedan SIN verificar localmente; deben validarse en Replit. Reforcé esto en riesgo_replit de ambos lotes. P6-3 además: confirmé que tsconfig `include` cubre solo client/src, shared, server — los .ts de scripts/ y script/ NO son type-chequeados por tsc, lo cual es consistente con el prompt.

6) P6-2 nota: nanoid SÍ se importa en server/vite.ts:7 (`import { nanoid } from "nanoid"`) aunque no esté en package.json (es dep transitiva de vite). Confirmé que quitarlo del allowlist es genuinamente no-op porque el filtro `externals` solo itera sobre deps de package.json; nanoid nunca entra a `allDeps`, así que esbuild lo bundlea igual. La lógica del lote es correcta. Añadí la nota para que el agente de Replit no se confunda al ver el import.

Verdicto: SÓLIDOS en evidencia y dirección P6-2, P6-3, P6-5, P6-6. P6-1 requería corrección de aceptación (era inejecutable). P6-4 con corrección menor de evidencia. Ninguno rompe funcionalidad si se siguen los prompts corregidos y se respeta el orden P6-1 → P6-4 → (P6-6 solo con aprobación).

---

## Lotes por prioridad

## P0 · Seguridad (crítico)

### ☐ P0-1 — Proteger el router de agentes (22 endpoints /api/agents/*) con authMiddleware + requireRole
- **Severidad:** critico · **Dominio:** SEGURIDAD
- **Hallazgo:** El router exportado por server/agents/api/agentRoutes.ts se monta en server/routes.ts:3569 con app.use('/api/agents', agentRoutes.default) sin ningun middleware de autenticacion. Sus ~22 rutas (GET /status, GET /stats/:agentType, GET /jobs, GET /jobs/failed, GET /evolution/proposals, GET /knowledge/:agentType, GET /analyze/:articleId, GET /pcloud/test, POST /run/:agentType, POST /pipeline/:articleId, POST /pipeline/batch, POST /pipeline/process-all, POST /audit, POST /queue, POST /processing/start, POST /processing/stop, POST /analyze/:articleId, POST /evolution/proposals/:id/status, POST /evolution/learning-cycle, POST /knowledge/:agentType/search, POST /pcloud/sync, POST /pcloud/load) quedan abiertas a internet. Cualquiera puede ejecutar agentes de IA (consumo OpenAI), arrancar/detener el procesamiento global, encolar trabajos, disparar el pipeline sobre TODOS los articulos (process-all) y leer la base de conocimiento interna. Es la exposicion mas grave del sistema. NOTA DEL VERIFICADOR: el frontend del panel (client/src/pages/admin/AdminAgents.tsx, AdminArticleProcessing.tsx, AdminPostForm.tsx) consume estas rutas SIEMPRE via adminApiRequest, que SI adjunta el header Authorization: Bearer (client/src/lib/adminAuth.ts:38-39), por lo que proteger el router con authMiddleware NO rompe el panel de agentes.
- **Evidencia:** server/routes.ts:3568-3569: 'const agentRoutes = await import(\'./agents/api/agentRoutes\');' seguido de 'app.use(\'/api/agents\', agentRoutes.default);' sin middleware (VERIFICADO literal). server/agents/api/agentRoutes.ts: router.get('/status') linea 21, router.post('/run/:agentType') linea 85, router.post('/pipeline/process-all') linea 169, router.post('/queue') linea 339, router.get('/knowledge/:agentType') linea 269 (TODAS VERIFICADAS). El patron de auth existe en server/auth.ts: authMiddleware lineas 117-163 (lee SOLO Authorization Bearer, NO cookies), requireRole lineas 165-177 (hace roles.includes(req.adminUser.role) estricto, SIN bypass de super_admin). Ya se usa en routes.ts (p.ej. linea 450). VERIFICADO sobre el codigo: el unico rol asignado en TODO el sistema es 'super_admin' (routes.ts:924, seed.ts:1210). La taxonomia valida segun shared/schema.ts:351 es 'super_admin, editor, author' con .default('editor') — NO existe el rol 'admin'. ADVERTENCIA VERIFICADA: los 61 requireRole existentes usan requireRole('editor','admin') y NINGUNO incluye 'super_admin', por lo que esos endpoints YA estan rotos para el unico usuario real (super_admin).
- **Archivos:** server/agents/api/agentRoutes.ts

**Fix / prompt:**

```
En el archivo server/agents/api/agentRoutes.ts vas a proteger TODAS las rutas con autenticacion, sin cambiar la logica de negocio. Pasos exactos:

1. Al inicio del archivo, junto a los imports existentes (despues de la linea 17 'import { news } from \'../../../shared/schema\';'), agrega:
   import { authMiddleware, requireRole } from '../../auth';
   (La ruta correcta desde server/agents/api/ hacia server/auth.ts es DOS niveles arriba: '../../auth'. NO uses '../auth'.)

2. Aplica authMiddleware a TODO el router. Justo despues de la linea 19 'const router = Router();' agrega:
   router.use(authMiddleware);

3. Para las rutas de EJECUCION/MUTACION agrega ademas requireRole. IMPORTANTE Y VERIFICADO: el unico rol real asignado en el sistema es 'super_admin'. Debes incluirlo SIEMPRE como primer rol o bloquearas al unico admin que existe. Usa EXACTAMENTE requireRole('super_admin','editor','admin') (incluye 'editor' y 'admin' por consistencia con la convencion del resto de routes.ts, aunque hoy ningun usuario los tenga; 'super_admin' es el que hace funcionar el panel real). Insertalo entre la ruta y el handler async en estas rutas POST:
   - router.post('/run/:agentType', requireRole('super_admin','editor','admin'), async (req, res) => { ... })
   - router.post('/pipeline/:articleId', requireRole('super_admin','editor','admin'), async ...)
   - router.post('/pipeline/batch', requireRole('super_admin','editor','admin'), async ...)
   - router.post('/pipeline/process-all', requireRole('super_admin','editor','admin'), async ...)
   - router.post('/audit', requireRole('super_admin','editor','admin'), async ...)
   - router.post('/queue', requireRole('super_admin','editor','admin'), async ...)
   - router.post('/processing/start', requireRole('super_admin','editor','admin'), async ...)
   - router.post('/processing/stop', requireRole('super_admin','editor','admin'), async ...)
   - router.post('/analyze/:articleId', requireRole('super_admin','editor','admin'), async ...)
   - router.post('/evolution/proposals/:id/status', requireRole('super_admin','editor','admin'), async ...)
   - router.post('/evolution/learning-cycle', requireRole('super_admin','editor','admin'), async ...)
   - router.post('/knowledge/:agentType/search', requireRole('super_admin','editor','admin'), async ...)
   - router.post('/pcloud/sync', requireRole('super_admin','editor','admin'), async ...)
   - router.post('/pcloud/load', requireRole('super_admin','editor','admin'), async ...)

4. Las rutas GET (status, stats/:agentType, jobs, jobs/failed, evolution/proposals, knowledge/:agentType, analyze/:articleId, pcloud/test) se quedan SOLO con el authMiddleware global del paso 2, sin requireRole.

NO toques la ruta POST /api/agents/pipeline/:articleId ni POST /api/agents/pipeline/process-all que ya estan definidas en server/routes.ts (lineas 2945 y 3179) con authMiddleware; esas las cubre routes.ts por orden de registro (ver lote P0-2). Solo modifica server/agents/api/agentRoutes.ts. Compila con 'npm run build' y confirma que no hay errores de TypeScript.
```

- **Aceptación:** 1) curl -s -X GET https://<dominio>/api/agents/status devuelve 401 con {"error":"Authentication required"} (antes devolvia 200 con datos). 2) curl -s -X POST https://<dominio>/api/agents/run/formatter -H 'Content-Type: application/json' -d '{}' devuelve 401. 3) Con un Bearer token valido de super_admin, GET /api/agents/status devuelve 200 y POST /api/agents/run/formatter ejecuta normalmente. 4) Con token valido pero rol fuera del set (p.ej. 'author'), los POST devuelven 403. 5) grep -n 'authMiddleware' server/agents/api/agentRoutes.ts muestra el import y router.use(authMiddleware). 6) El panel admin (AdminAgents) sigue funcionando porque usa adminApiRequest con Bearer. 7) 'npm run build' compila sin errores.
- **Riesgo / cuidado:** CRITICO: si Replit usa requireRole sin incluir 'super_admin', bloqueara al unico usuario real (rol super_admin) y el panel dejara de ejecutar agentes. 'super_admin' debe ir SIEMPRE primero en cada requireRole. NOTA DE BUG PREEXISTENTE (no resolver aqui, solo no replicarlo): los 61 requireRole ya existentes en routes.ts usan ('editor','admin') sin 'super_admin', por lo que esos endpoints YA estan rotos para el super_admin actual; este lote NO debe imitar ese error. El import debe ser '../../auth' (dos niveles desde server/agents/api/), no '../auth'. No convertir las rutas en arrow functions distintas ni reordenar handlers. El rol 'admin' es fantasma (la taxonomia real es super_admin/editor/author) pero se mantiene en el set por consistencia y es inofensivo.

### ☐ P0-2 — Resolver rutas duplicadas/sombreadas de /api/agents/pipeline entre routes.ts y agentRoutes.ts
- **Severidad:** mayor · **Dominio:** SEGURIDAD
- **Hallazgo:** Existe duplicidad de la ruta POST /api/agents/pipeline/:articleId: una version CON authMiddleware en server/routes.ts:2945 (registrada antes del montaje del router) y otra SIN auth en server/agents/api/agentRoutes.ts:133. Por el orden de registro de Express, la de routes.ts:2945 (con auth) gana para esa URL exacta, dejando la del router inalcanzable. Igualmente POST /api/agents/pipeline/process-all existe con auth en routes.ts:3179 y sin auth en agentRoutes.ts:169. El problema: si en el futuro alguien quita o reordena las rutas de routes.ts, las versiones sin auth del router quedarian expuestas. Tras aplicar el lote P0-1 ambas quedan protegidas por el router.use(authMiddleware) global, pero la duplicidad sigue siendo una bomba de tiempo y debe documentarse/consolidarse.
- **Evidencia:** server/routes.ts:2945 'app.post("/api/agents/pipeline/:articleId", authMiddleware, async (req: Request, res: Response) => {' (VERIFICADO literal) y server/routes.ts:3179 'app.post("/api/agents/pipeline/process-all", authMiddleware, async (req: Request, res: Response) => {' (VERIFICADO literal). server/agents/api/agentRoutes.ts:133 'router.post('/pipeline/:articleId', async ...)' y agentRoutes.ts:169 'router.post('/pipeline/process-all', async ...)' (VERIFICADAS). El router se monta en routes.ts:3569 DESPUES de esas definiciones, por eso routes.ts gana el match. NOTA: el frontend (AdminArticleProcessing.tsx:471/675) llama POST /api/agents/pipeline/${id} via adminApiRequest con Bearer, por lo que la version de routes.ts:2945 con authMiddleware es la que se ejecuta y funciona.
- **Archivos:** server/agents/api/agentRoutes.ts, server/routes.ts

**Fix / prompt:**

```
Aplica este lote DESPUES de haber aplicado el lote P0-1 (que ya pone authMiddleware global en el router). El objetivo es eliminar la ambiguedad de rutas duplicadas /api/agents/pipeline. Pasos:

1. Verifica que en server/routes.ts las rutas POST /api/agents/pipeline/:articleId (linea 2945) y POST /api/agents/pipeline/process-all (linea 3179) ya tienen authMiddleware. NO las elimines: son las versiones canonicas con la logica completa usada por el panel.

2. En server/agents/api/agentRoutes.ts, agrega un comentario justo encima de router.post('/pipeline/:articleId', ...) (linea 133) y de router.post('/pipeline/process-all', ...) (linea 169) que diga exactamente:
   // NOTA: esta ruta esta SOMBREADA por server/routes.ts (registrada antes del montaje del router en routes.ts:3569). Se mantiene aqui solo como fallback; requiere el authMiddleware global aplicado en este router (lote P0-1). No exponer sin auth.

3. Confirma que tras el lote P0-1 ambas rutas del router heredan router.use(authMiddleware), de modo que aunque alguna quedara alcanzable, exigiria sesion. NO dupliques logica ni borres las rutas del router en este paso (eso es un refactor mayor que puede romper el panel). Solo asegura el comentario y que el authMiddleware global este presente.

4. Ejecuta 'npm run build' y confirma compilacion limpia.
```

- **Aceptación:** 1) curl -s -X POST https://<dominio>/api/agents/pipeline/process-all sin token devuelve 401 (cubierto por routes.ts:3179 con authMiddleware). 2) grep -n 'SOMBREADA' server/agents/api/agentRoutes.ts muestra los dos comentarios agregados. 3) El panel admin sigue ejecutando el pipeline con un super_admin autenticado (200) via AdminArticleProcessing.tsx. 4) 'npm run build' compila sin errores.
- **Riesgo / cuidado:** No eliminar las rutas de routes.ts:2945/3179: contienen la logica de produccion del pipeline usada por el panel. Si Replit decide consolidar borrando una version, debe conservar la de routes.ts (la canonica con auth). Aplicar estrictamente despues de P0-1, que es lo que garantiza que las versiones del router tambien queden protegidas.

### ☐ P0-3 — Autenticar /api/system/chronicler y /api/health-check/run (filtran arquitectura interna) — REQUIERE actualizar el cliente
- **Severidad:** mayor · **Dominio:** SEGURIDAD
- **Hallazgo:** Los endpoints GET /api/system/chronicler (server/routes.ts:3363) y GET /api/health-check/run (server/routes.ts:3520) son publicos. El primero expone el inventario completo de agentes de IA, timeline de evolucion, estadisticas y categorias internas (brain/hands/shield). El segundo ejecuta runDeepAudit() y devuelve un reporte humano con detalles internos de salud, ademas de disparar trabajo costoso bajo demanda. CORRECCION DEL VERIFICADOR: health-check/run tiene en routes.ts:3518-3519 un comentario explicito 'Health check is intentionally public (read-only diagnostic)'; el autor lo dejo publico a proposito, asi que protegerlo es un cambio de decision deliberado (correcto por seguridad, pero hay que asumirlo). ADEMAS, AMBOS endpoints SI son consumidos por el panel admin via el getQueryFn por defecto, que NO envia token Bearer (solo cookies), por lo que protegerlos con authMiddleware ROMPE esas paginas salvo que se actualice tambien el cliente.
- **Evidencia:** server/routes.ts:3363 'app.get("/api/system/chronicler", async (req: Request, res: Response) => {' sin middleware (VERIFICADO). server/routes.ts:3520 'app.get("/api/health-check/run", async (req: Request, res: Response) => {' sin middleware (VERIFICADO); dentro llama systemHealthCheck.runDeepAudit() (linea 3523) y generateHumanReport (linea 3527). Comentario 'intentionally public' en routes.ts:3518-3519 (VERIFICADO). CONSUMO EN CLIENTE (VERIFICADO): client/src/pages/admin/AdminGuide.tsx:417 usa queryKey ['/api/system/chronicler'] y client/src/pages/admin/AdminHealthCheck.tsx:462 usa queryKey ['/api/health-check/run']; ambos van por el getQueryFn por defecto de client/src/lib/queryClient.ts:31-40, que hace fetch(queryKey.join('/')) con credentials:'include' pero SIN header Authorization. authMiddleware (auth.ts:124-131) exige Authorization: Bearer y NO lee cookies — por tanto esas dos paginas recibiran 401 tras el cambio. adminApiRequest (client/src/lib/adminAuth.ts:38-39) SI adjunta el Bearer desde localStorage. Los imports authMiddleware/requireRole ya existen en routes.ts (lineas 68-69).
- **Archivos:** server/routes.ts, client/src/pages/admin/AdminGuide.tsx, client/src/pages/admin/AdminHealthCheck.tsx

**Fix / prompt:**

```
Este lote tiene DOS partes: backend (proteger) y frontend (actualizar el cliente para que siga funcionando). Debes hacer LAS DOS o romperas el panel admin.

PARTE A — server/routes.ts (proteger), sin cambiar la logica de los handlers:
1. Localiza la linea 3363:
   app.get("/api/system/chronicler", async (req: Request, res: Response) => {
   y reemplaza la firma por:
   app.get("/api/system/chronicler", authMiddleware, async (req: Request, res: Response) => {
2. Localiza la linea 3520:
   app.get("/api/health-check/run", async (req: Request, res: Response) => {
   y reemplaza la firma por (dispara trabajo costoso, exige rol elevado):
   app.get("/api/health-check/run", authMiddleware, requireRole("super_admin","editor","admin"), async (req: Request, res: Response) => {
   Recuerda incluir 'super_admin' (es el unico rol real del sistema). Tambien actualiza/elimina el comentario de routes.ts:3518-3519 que dice 'Health check is intentionally public' porque ya no sera publico.

PARTE B — frontend (OBLIGATORIA): migra las dos llamadas del cliente para que envien el Bearer token.
3. En client/src/pages/admin/AdminGuide.tsx (linea ~417), la query a '/api/system/chronicler' usa el queryFn por defecto (sin token). Cambia su queryFn para que use adminApiRequest: importa adminApiRequest desde '@/lib/adminAuth' y define queryFn: async () => { const res = await adminApiRequest('GET','/api/system/chronicler'); return res.json(); }.
4. En client/src/pages/admin/AdminHealthCheck.tsx (linea ~462), la query a '/api/health-check/run' tambien usa el queryFn por defecto. Cambiala igual: queryFn: async () => { const res = await adminApiRequest('GET','/api/health-check/run'); return res.json(); }, importando adminApiRequest desde '@/lib/adminAuth'. (Nota: el handler real es app.get, no app.post; asegura que el metodo sea GET.)

Ejecuta 'npm run build' y confirma que compila.
```

- **Aceptación:** 1) curl -s https://<dominio>/api/system/chronicler sin token devuelve 401. 2) curl -s https://<dominio>/api/health-check/run sin token devuelve 401. 3) Con Bearer de super_admin, /api/system/chronicler devuelve 200 y /api/health-check/run devuelve 200. 4) La pagina admin AdminGuide carga el chronicler sin 401 (porque ahora manda Bearer). 5) La pagina admin AdminHealthCheck ejecuta el health-check sin 401. 6) grep -n 'system/chronicler' server/routes.ts muestra authMiddleware en la firma. 7) 'npm run build' compila sin errores.
- **Riesgo / cuidado:** CRITICO: si SOLO se aplica la Parte A (backend) y NO la Parte B (frontend), las paginas admin AdminGuide y AdminHealthCheck dejaran de cargar (401), porque consumen estos endpoints con el queryFn por defecto que NO envia Bearer (solo cookies, que authMiddleware ignora). Hay que migrar ambas llamadas a adminApiRequest. Incluir siempre 'super_admin' en requireRole del health-check. Verificar que no haya otros consumidores (paginas publicas) de estos endpoints: la busqueda confirma que solo los usan AdminGuide y AdminHealthCheck, ambas paginas admin, no publicas.

## P1 · Integridad de datos

### ☐ P1-1 — Rate limit + autenticacion ligera en endpoints de traduccion (ataque de costo OpenAI)
- **Severidad:** critico · **Dominio:** SEGURIDAD
- **Hallazgo:** Los endpoints POST /api/translate (routes.ts:2611), POST /api/translate/batch (routes.ts:2640) y POST /api/translate-entity (routes.ts:2809) son publicos y sin rate limit. Cada uno llama a OpenAI (translateLegalText / translateMultipleTexts). El batch acepta un array arbitrario de textos, multiplicando el costo por request. Un atacante puede generar gasto ilimitado contra la cuenta de OpenAI (denegacion de cartera) y agotar cuota. No hay autenticacion ni limite por IP. NOTA DEL VERIFICADOR: /api/translate-entity SI lo usa el cliente publico (client/src/hooks/useTranslatedContent.ts:61), por lo que NO debe llevar authMiddleware; el rate-limit por IP es la mitigacion correcta. /api/translate y /api/translate/batch NO aparecen llamados por el cliente publico (solo se usa /api/translate-content y /api/translate/suggest), asi que podrian protegerse mas, pero el rate-limit es un minimo seguro y suficiente.
- **Evidencia:** server/routes.ts:2611 'app.post("/api/translate", async (req: Request, res: Response) => {' sin middleware; llama translateLegalText (linea 2626) (VERIFICADO). routes.ts:2640 'app.post("/api/translate/batch", async ...)' extrae texts y valida que sea array en linea 2644 ('if (!texts || !Array.isArray(texts) ...)') y llama translateMultipleTexts (linea 2655) sin tope de tamano (VERIFICADO). routes.ts:2809 'app.post("/api/translate-entity", async ...)' sin auth (VERIFICADO). El unico rate limit del sistema es el de login (auth.ts:41-106) usado solo en routes.ts:949. VERIFICADO: express-rate-limit NO esta en package.json (solo cors y compression).
- **Archivos:** server/middleware/rateLimit.ts, server/routes.ts

**Fix / prompt:**

```
Vas a anadir rate limiting por IP a los tres endpoints de traduccion en server/routes.ts, con un middleware casero (sin dependencias externas, porque express-rate-limit NO esta instalado y queremos cero riesgo de lockfile). Pasos exactos:

1. Crea un nuevo archivo server/middleware/rateLimit.ts con este contenido:

   import type { Request, Response, NextFunction } from 'express';
   interface Bucket { count: number; resetAt: number; }
   export function rateLimit(opts: { windowMs: number; max: number; key?: (req: Request) => string }) {
     const store = new Map<string, Bucket>();
     const { windowMs, max } = opts;
     const keyFn = opts.key || ((req: Request) => req.ip || req.socket.remoteAddress || 'unknown');
     setInterval(() => { const now = Date.now(); for (const [k, b] of store) if (b.resetAt <= now) store.delete(k); }, windowMs).unref?.();
     return (req: Request, res: Response, next: NextFunction) => {
       const now = Date.now();
       const k = keyFn(req);
       let b = store.get(k);
       if (!b || b.resetAt <= now) { b = { count: 0, resetAt: now + windowMs }; store.set(k, b); }
       b.count++;
       if (b.count > max) {
         res.set('Retry-After', String(Math.ceil((b.resetAt - now) / 1000)));
         return res.status(429).json({ error: 'Too many requests' });
       }
       next();
     };
   }

2. En server/routes.ts, dentro de la funcion registerRoutes (justo despues de su apertura en linea ~178, antes de definir rutas), declara una instancia compartida. Agrega tambien el import arriba junto a los demas (cerca de la importacion de './auth' en linea 70):
   import { rateLimit } from './middleware/rateLimit';
   y dentro de registerRoutes:
   const translateLimiter = rateLimit({ windowMs: 60_000, max: 10 });

3. Agrega translateLimiter como primer middleware a los tres endpoints:
   - app.post("/api/translate", translateLimiter, async (req, res) => { ... })  (linea 2611)
   - app.post("/api/translate/batch", translateLimiter, async (req, res) => { ... })  (linea 2640)
   - app.post("/api/translate-entity", translateLimiter, async (req, res) => { ... })  (linea 2809)

4. En /api/translate/batch agrega validacion de tamano: el array ya se valida en linea 2644; justo despues de ese bloque agrega: if (texts.length > 50) return res.status(400).json({ error: 'Too many texts (max 50)' });

NO agregues authMiddleware a estos endpoints: /api/translate-entity lo usa el sitio publico multilingue (useTranslatedContent.ts:61). El rate limit por IP es la mitigacion correcta. Ejecuta 'npm run build' y confirma compilacion.
```

- **Aceptación:** 1) Hacer 11 POST seguidos a /api/translate desde la misma IP: el request 11 devuelve 429 con {"error":"Too many requests"} y header Retry-After. 2) POST /api/translate/batch con un array de 51 textos devuelve 400 'Too many texts (max 50)'. 3) Un solo POST normal a /api/translate sigue devolviendo 200 con la traduccion. 4) ls server/middleware/rateLimit.ts existe. 5) El sitio publico multilingue sigue traduciendo (no se rompe useTranslatedContent). 6) 'npm run build' compila sin errores.
- **Riesgo / cuidado:** No instalar express-rate-limit (no esta en package.json; puede romper el lockfile de Replit). Usar el middleware casero del paso 1. El store en memoria se reinicia con cada deploy (aceptable). 10/min por IP es razonable para no romper la traduccion legitima. Verificar que client/ no dispare rafagas masivas: useTranslatedContent cachea traducciones, asi que no deberia exceder el limite en navegacion normal.

### ☐ P1-2 — Restringir CORS para que no use wildcard (origin true) por defecto
- **Severidad:** mayor · **Dominio:** SEGURIDAD
- **Hallazgo:** En server/index.ts:15-20 el CORS se configura con origin: process.env.CORS_ORIGIN || true y credentials: true. Si CORS_ORIGIN no esta definida (caso por defecto), 'true' refleja cualquier Origin, permitiendo que cualquier sitio web haga requests con credenciales contra la API. Debe restringirse a una lista blanca explicita y fallar a un origen seguro, no a wildcard. NOTA DEL VERIFICADOR: el panel admin autentica con Bearer token (localStorage), no con cookies de sesion, por lo que el riesgo CSRF clasico via credentials:true es menor; aun asi el wildcard reflejado es mala practica y debe cerrarse.
- **Evidencia:** server/index.ts:15-20 (VERIFICADO literal): 'app.use(cors({ origin: process.env.CORS_ORIGIN || true, credentials: true, methods: ["GET","HEAD","PUT","PATCH","POST","DELETE","OPTIONS"], allowedHeaders: ["Content-Type", "Authorization"] }));'. CORS_ORIGIN solo se referencia aqui (VERIFICADO con grep).
- **Archivos:** server/index.ts

**Fix / prompt:**

```
En server/index.ts endurece la configuracion de CORS para que nunca use wildcard por defecto. Reemplaza el bloque actual (lineas 15-20):

   app.use(cors({
     origin: process.env.CORS_ORIGIN || true,
     credentials: true,
     methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
     allowedHeaders: ["Content-Type", "Authorization"],
   }));

por:

   const allowedOrigins = (process.env.CORS_ORIGIN || 'https://www.vonwobeser.com,https://vonwobeser.com')
     .split(',')
     .map(o => o.trim())
     .filter(Boolean);
   app.use(cors({
     origin: (origin, callback) => {
       if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
       return callback(new Error('Not allowed by CORS'));
     },
     credentials: true,
     methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
     allowedHeaders: ["Content-Type", "Authorization"],
   }));

Luego, en los Replit Secrets del proyecto, define CORS_ORIGIN con los dominios reales de produccion separados por coma (incluye el subdominio *.replit.app desde el que se sirve el frontend, p.ej. 'https://www.vonwobeser.com,https://vonwobeser.com,https://<tu-app>.replit.app'). Si no la defines, cae a los dominios vonwobeser por defecto, NUNCA a wildcard. Ejecuta 'npm run build' y confirma compilacion.
```

- **Aceptación:** 1) Una request con header 'Origin: https://malicioso.com' a /api/admin/me NO recibe Access-Control-Allow-Origin con ese valor (preflight OPTIONS falla). 2) Una request con Origin del dominio real (o el .replit.app configurado) si recibe Access-Control-Allow-Origin con ese origen. 3) curl sin Origin (server-to-server) sigue funcionando. 4) grep -n 'CORS_ORIGIN' server/index.ts ya no muestra '|| true'. 5) 'npm run build' compila sin errores.
- **Riesgo / cuidado:** Debe configurarse CORS_ORIGIN en Replit Secrets con el dominio real del deploy (incluyendo *.replit.app si el frontend se sirve desde ahi), o las requests del navegador con Origin desde ese dominio seran rechazadas. El fallback debe ser la lista vonwobeser, jamas 'true'. Probar el panel admin tras el cambio. Como el panel usa Bearer (no cookies), el impacto principal es sobre llamadas cross-origin del navegador, no sobre sesiones cookie.

### ☐ P1-3 — Corregir path traversal en GET /generated-images/:filename
- **Severidad:** mayor · **Dominio:** SEGURIDAD
- **Hallazgo:** En server/routes.ts:252-253 el handler construye filePath = path.join(generatedImagesDir, req.params.filename) sin sanitizar req.params.filename. Un atacante puede enviar un nombre con secuencias ../ y, via fs.existsSync + res.sendFile, leer archivos arbitrarios fuera del directorio publico de imagenes.
- **Evidencia:** server/routes.ts:252-258 (VERIFICADO literal): 'app.get('/generated-images/:filename', (req, res) => { const filePath = path.join(generatedImagesDir, req.params.filename); if (fs.existsSync(filePath)) { res.set('Cache-Control', ...); return res.sendFile(filePath); } res.status(404).json({ error: 'Image not found' }); });'. path/fs importados en routes.ts (lineas 7-8). generatedImagesDir definido en routes.ts:246. VERIFICADO: el express.static posterior esta en routes.ts:261. VERIFICADO: los 6 archivos en public/generated-images/ tienen nombres tipo 'article-8538474c-...-gemini-1774236375318.png', todos dentro de [A-Za-z0-9._-], por lo que el regex propuesto NO rechaza imagenes legitimas existentes.
- **Archivos:** server/routes.ts

**Fix / prompt:**

```
En server/routes.ts corrige el path traversal del handler de imagenes generadas (linea 252). Reemplaza el cuerpo del handler:

   app.get('/generated-images/:filename', (req, res) => {
     const filePath = path.join(generatedImagesDir, req.params.filename);
     if (fs.existsSync(filePath)) {
       res.set('Cache-Control', 'public, max-age=31536000, immutable');
       return res.sendFile(filePath);
     }
     res.status(404).json({ error: 'Image not found' });
   });

por esta version que sanitiza el nombre y verifica que el path resuelto quede DENTRO de generatedImagesDir:

   app.get('/generated-images/:filename', (req, res) => {
     const raw = req.params.filename;
     if (!/^[A-Za-z0-9._-]+$/.test(raw) || raw.includes('..')) {
       return res.status(400).json({ error: 'Invalid filename' });
     }
     const filePath = path.join(generatedImagesDir, raw);
     const resolved = path.resolve(filePath);
     if (!resolved.startsWith(path.resolve(generatedImagesDir) + path.sep)) {
       return res.status(400).json({ error: 'Invalid path' });
     }
     if (fs.existsSync(resolved)) {
       res.set('Cache-Control', 'public, max-age=31536000, immutable');
       return res.sendFile(resolved);
     }
     res.status(404).json({ error: 'Image not found' });
   });

No cambies el express.static de '/generated-images' que viene despues (routes.ts:261); express.static maneja traversal de forma segura por defecto. Ejecuta 'npm run build' y confirma compilacion.
```

- **Aceptación:** 1) curl -s 'https://<dominio>/generated-images/..%2f..%2fserver%2fauth.ts' devuelve 400, NO el contenido del archivo. 2) curl -s 'https://<dominio>/generated-images/foo/../../package.json' devuelve 400. 3) Una imagen legitima existente, p.ej. /generated-images/article-8538474c-2c4b-4beb-b1f9-6a012a04ecf1-gemini-1774236375318.png, sigue devolviendo 200 con la imagen. 4) grep -n 'Invalid filename' server/routes.ts muestra la validacion. 5) 'npm run build' compila sin errores.
- **Riesgo / cuidado:** VERIFICADO: los 6 archivos actuales en public/generated-images/ cumplen el patron [A-Za-z0-9._-]+, asi que el regex NO rompe imagenes existentes. Si en el futuro se generan nombres con espacios/acentos, habria que ampliar el regex; el pipeline actual genera nombres 'article-<uuid>-gemini-<timestamp>.png' que siempre cumplen. No tocar el express.static posterior (routes.ts:261).

### ☐ P1-1 — FK + cascada en las 9 tablas pivote (limpiar huérfanos primero)
- **Severidad:** critico · **Dominio:** Capa de Datos / Drizzle ORM (shared/schema.ts, server/db.ts, server/seed.ts, drizzle.config.ts)
- **Hallazgo:** Las 9 tablas pivote/de union definen sus columnas de relacion como varchar sueltos SIN .references(), sin foreign key ni cascada. Verificado en shared/schema.ts: teamMemberPracticeGroups (team_member_id 222, practice_group_id 223, tabla 220-224), teamMemberIndustryGroups (228-229, tabla 226-230), newsTeamMembers (news_id 234, team_member_id 235, tabla 232-236), blogPostTags (post_id 420, tag_id 421, tabla 418-422), teamMemberRankings (913-914, tabla 911-915), teamMemberAwards (919-920, tabla 917-921), clientPracticeGroups (client_id 949, practice_group_id 950, tabla 947-951), teamMemberDesks (team_member_id 1126, desk_id 1127, tabla 1124-1129). NOTA: son 8 tablas pivote listadas explicitamente (el titulo dice 9 contando que cada una tiene 2 columnas; el conteo real de TABLAS pivote sin FK es 8). Consecuencia: al borrar un team_member, practice_group, news, blog_post, tag, ranking, award, client o desk, las filas pivote quedan huerfanas. Hoy storage.ts borra a mano solo dos casos: deleteNews borra newsTeamMembers (storage.ts:342) y deleteBlogTag borra blogPostTags por tagId (storage.ts:617, CORREGIDO de 616). Las demas pivote nunca se limpian. La BD debe garantizar esta integridad, no el codigo.
- **Evidencia:** shared/schema.ts:222-223 teamMemberId/practiceGroupId son varchar(...).notNull() sin .references(); 234-235 newsId/teamMemberId idem; 420-421 postId/tagId idem; 913-914, 919-920, 949-950, 1126-1127 idem. Contraste verificado por grep: solo existen 2 .references() en todo el archivo, schema.ts:124 (newsTranslations.newsId -> news.id onDelete cascade) y schema.ts:808 (websiteAuditFindings.auditId -> websiteAudits.id onDelete cascade) - patron a replicar.
- **Archivos:** shared/schema.ts

**Fix / prompt:**

```
En shared/schema.ts agrega foreign keys con cascada a las 8 tablas pivote. Para cada columna de relacion cambia el varchar suelto por una referencia con .references(). Reemplaza EXACTAMENTE asi:

1) teamMemberPracticeGroups (linea ~220): teamMemberId -> varchar('team_member_id').notNull().references(() => teamMembers.id, { onDelete: 'cascade' }); practiceGroupId -> varchar('practice_group_id').notNull().references(() => practiceGroups.id, { onDelete: 'cascade' }).
2) teamMemberIndustryGroups (~226): teamMemberId -> teamMembers.id cascade; industryGroupId -> industryGroups.id cascade.
3) newsTeamMembers (~232): newsId -> news.id cascade; teamMemberId -> teamMembers.id cascade.
4) blogPostTags (~418): postId -> blogPosts.id cascade; tagId -> blogTags.id cascade.
5) teamMemberRankings (~911): teamMemberId -> teamMembers.id cascade; rankingId -> rankings.id cascade.
6) teamMemberAwards (~917): teamMemberId -> teamMembers.id cascade; awardId -> awards.id cascade.
7) clientPracticeGroups (~947): clientId -> representativeClients.id cascade; practiceGroupId -> practiceGroups.id cascade.
8) teamMemberDesks (~1124): teamMemberId -> teamMembers.id cascade; deskId -> specializedDesks.id cascade.

Manten .notNull() en cada una (todas las columnas pivote ya son .notNull()). Las tablas padre (teamMembers 189, practiceGroups 153, industryGroups 171, news 84, blogPosts 390, blogTags 378, rankings 862, awards 887, representativeClients 927, specializedDesks 1100) estan todas declaradas en el mismo modulo. Como .references() usa arrow function diferida (() => tabla.id), el orden de declaracion NO importa: la arrow no se evalua hasta despues de cargar el modulo. NUNCA reordenes bloques de tabla.

ANTES de aplicar el push, ejecuta en la consola SQL de la base de datos (Database tab de Replit) estas sentencias para borrar filas huerfanas que harian fallar la creacion de la FK:
DELETE FROM team_member_practice_groups t WHERE NOT EXISTS (SELECT 1 FROM team_members m WHERE m.id=t.team_member_id) OR NOT EXISTS (SELECT 1 FROM practice_groups g WHERE g.id=t.practice_group_id);
DELETE FROM team_member_industry_groups t WHERE NOT EXISTS (SELECT 1 FROM team_members m WHERE m.id=t.team_member_id) OR NOT EXISTS (SELECT 1 FROM industry_groups g WHERE g.id=t.industry_group_id);
DELETE FROM news_team_members t WHERE NOT EXISTS (SELECT 1 FROM news n WHERE n.id=t.news_id) OR NOT EXISTS (SELECT 1 FROM team_members m WHERE m.id=t.team_member_id);
DELETE FROM blog_post_tags t WHERE NOT EXISTS (SELECT 1 FROM blog_posts p WHERE p.id=t.post_id) OR NOT EXISTS (SELECT 1 FROM blog_tags g WHERE g.id=t.tag_id);
DELETE FROM team_member_rankings t WHERE NOT EXISTS (SELECT 1 FROM team_members m WHERE m.id=t.team_member_id) OR NOT EXISTS (SELECT 1 FROM rankings r WHERE r.id=t.ranking_id);
DELETE FROM team_member_awards t WHERE NOT EXISTS (SELECT 1 FROM team_members m WHERE m.id=t.team_member_id) OR NOT EXISTS (SELECT 1 FROM awards a WHERE a.id=t.award_id);
DELETE FROM client_practice_groups t WHERE NOT EXISTS (SELECT 1 FROM representative_clients c WHERE c.id=t.client_id) OR NOT EXISTS (SELECT 1 FROM practice_groups g WHERE g.id=t.practice_group_id);
DELETE FROM team_member_desks t WHERE NOT EXISTS (SELECT 1 FROM team_members m WHERE m.id=t.team_member_id) OR NOT EXISTS (SELECT 1 FROM specialized_desks d WHERE d.id=t.desk_id);

Despues corre 'npm run db:push'. Si drizzle-kit pregunta por truncar o pide confirmacion de cambios de constraint, acepta SOLO la adicion de las foreign keys (NO aceptes drops de columnas con datos). Confirma que el push termino sin errores.
```

- **Aceptación:** Tras el push, en la consola SQL: SELECT conname FROM pg_constraint WHERE contype='f' AND conrelid='team_member_practice_groups'::regclass; debe devolver 2 FKs. Repetir para las 7 tablas pivote restantes (cada una debe mostrar 2 FKs). Probar borrado en cascada: insertar un team_member DESECHABLE de prueba con sus filas pivote, borrarlo, y verificar que sus filas en team_member_practice_groups, team_member_desks, etc. desaparecen automaticamente (SELECT count(*) ... WHERE team_member_id='<id borrado>' = 0). NO usar un team_member real del seed para esta prueba.
- **Riesgo / cuidado:** Aplicar la FK sobre datos con huerfanos hace fallar el push; por eso el prompt exige correr los DELETE de limpieza ANTES. No aceptar que drizzle-kit haga drop+recreate de tablas pivote (perderia datos): solo debe agregar constraints. El orden de declaracion NO requiere accion: la arrow function diferida lo resuelve; nunca reordenar bloques. RIESGO ADICIONAL VERIFICADO: seed() corre en cada arranque (routes.ts:179) reinsertando filas pivote; si el seed insertara una fila pivote con FK rota fallaria el arranque, pero el seed actual solo siembra news/officeImages/practiceGroups/industryGroups/teamMembers/representativeMatters/events/admin (no las pivote), asi que no hay conflicto. Hacer ANTES que P1-3 (baseline de migrations) para que el baseline capture las FKs.

### ☐ P1-2 — FK en columnas de relacion de tablas maestras (onDelete set null)
- **Severidad:** mayor · **Dominio:** Capa de Datos / Drizzle ORM (shared/schema.ts, server/db.ts, server/seed.ts, drizzle.config.ts)
- **Hallazgo:** Varias tablas maestras guardan IDs de otras tablas en columnas varchar sueltas sin foreign key, permitiendo referencias colgantes. Verificado en shared/schema.ts: blogPosts.categoryId (400) y blogPosts.authorId (401) sin FK a blogCategories/adminUsers; news.authorId (98) sin FK a adminUsers; testimonials.practiceGroupId (969) sin FK a practiceGroups; jobOpenings.practiceGroupId (1003) sin FK; contentAnalysis.articleId (672, notNull) sin FK a news; adminSessions.userId (447, notNull) sin FK a adminUsers; agentEvents.jobId (713, notNull) y agentJobs.parentJobId (700) sin FK a agentJobs. A diferencia de las pivote, aqui conviene onDelete 'set null' (no borrar el post/testimonial si se borra su categoria) salvo en relaciones de dependencia fuerte (sesiones, content_analysis, agent_events -> cascade).
- **Evidencia:** shared/schema.ts:400 categoryId: varchar('category_id') sin .references(); 401 authorId idem; 969 practiceGroupId: varchar('practice_group_id') sin .references(); 1003 practiceGroupId idem; 98 authorId: varchar('author_id') sin .references(); 672 articleId: varchar('article_id').notNull() sin .references(); 447 userId: varchar('user_id').notNull() sin .references(); 700 parentJobId: varchar('parent_job_id') sin .references(); 713 jobId: varchar('job_id').notNull() sin .references(). Tablas padre confirmadas: adminUsers (346), blogCategories (362), news (84), agentJobs (690).
- **Archivos:** shared/schema.ts

**Fix / prompt:**

```
En shared/schema.ts agrega foreign keys a las columnas de relacion de tablas maestras. Cambia cada varchar suelto por una referencia, asi:

- blogPosts.categoryId (linea ~400): .references(() => blogCategories.id, { onDelete: 'set null' }).
- blogPosts.authorId (linea ~401): .references(() => adminUsers.id, { onDelete: 'set null' }).
- news.authorId (linea ~98): .references(() => adminUsers.id, { onDelete: 'set null' }).
- testimonials.practiceGroupId (linea ~969): .references(() => practiceGroups.id, { onDelete: 'set null' }).
- jobOpenings.practiceGroupId (linea ~1003): .references(() => practiceGroups.id, { onDelete: 'set null' }).
- adminSessions.userId (linea ~447, es notNull): .references(() => adminUsers.id, { onDelete: 'cascade' }).
- contentAnalysis.articleId (linea ~672, es notNull): .references(() => news.id, { onDelete: 'cascade' }).
- agentEvents.jobId (linea ~713, es notNull): .references(() => agentJobs.id, { onDelete: 'cascade' }).
- agentJobs.parentJobId (linea ~700): .references(() => agentJobs.id, { onDelete: 'set null' }) (auto-referencia: la arrow function diferida la resuelve; agentJobs ya esta en definicion en el mismo modulo).

NOTA: adminUsers (346), blogCategories (362) y agentJobs (690) se declaran ANTES o en la misma posicion que las tablas que las referencian, salvo no aplica problema porque .references usa arrow function diferida. NO toques news_translations.newsId (124) ni website_audit_findings.auditId (808) porque ya tienen .references() correcto.

ANTES de aplicar el push, en la consola SQL limpia referencias colgantes. Para columnas con set null pon en NULL los huerfanos; para cascade/notNull borra las filas huerfanas:
UPDATE blog_posts SET category_id=NULL WHERE category_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM blog_categories c WHERE c.id=category_id);
UPDATE blog_posts SET author_id=NULL WHERE author_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM admin_users u WHERE u.id=author_id);
UPDATE news SET author_id=NULL WHERE author_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM admin_users u WHERE u.id=author_id);
UPDATE testimonials SET practice_group_id=NULL WHERE practice_group_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM practice_groups g WHERE g.id=practice_group_id);
UPDATE job_openings SET practice_group_id=NULL WHERE practice_group_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM practice_groups g WHERE g.id=practice_group_id);
DELETE FROM admin_sessions WHERE NOT EXISTS (SELECT 1 FROM admin_users u WHERE u.id=user_id);
DELETE FROM content_analysis WHERE NOT EXISTS (SELECT 1 FROM news n WHERE n.id=article_id);
DELETE FROM agent_events WHERE NOT EXISTS (SELECT 1 FROM agent_jobs j WHERE j.id=job_id);
UPDATE agent_jobs SET parent_job_id=NULL WHERE parent_job_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM agent_jobs j WHERE j.id=parent_job_id);

Luego corre 'npm run db:push' y acepta solo la adicion de foreign keys. Confirma que termino sin errores.
```

- **Aceptación:** En la consola SQL: SELECT conname, confdeltype FROM pg_constraint WHERE contype='f' AND conrelid='blog_posts'::regclass; debe mostrar las 2 FKs con confdeltype='n' (set null). Repetir para testimonials, job_openings, news (set null), admin_sessions (confdeltype='c' cascade), content_analysis (cascade), agent_events (cascade), agent_jobs (parent_job_id confdeltype='n' set null). Probar: borrar una blog_category DE PRUEBA y verificar que los blog_posts que la usaban quedan con category_id=NULL en vez de error.
- **Riesgo / cuidado:** agentJobs.parentJobId es auto-referencia: la arrow function diferida (() => agentJobs.id) lo resuelve sin error. NO poner cascade en parentJobId (borraria jobs hijos en cascada de forma indeseada). Correr los UPDATE/DELETE de limpieza ANTES del push o fallara. RIESGO VERIFICADO: news.authorId -> adminUsers referencia una tabla declarada DESPUES (adminUsers en 346, news en 84); funciona igual por la arrow diferida, pero confirmar que no se reordene la declaracion de news. Ejecutar este lote DESPUES de P1-1 y ANTES de P1-3.

### ☐ P1-3 — Generar baseline de migrations versionadas (dejar de depender solo de db:push)
- **Severidad:** mayor · **Dominio:** Capa de Datos / Drizzle ORM (shared/schema.ts, server/db.ts, server/seed.ts, drizzle.config.ts)
- **Hallazgo:** drizzle.config.ts:7 declara out: './migrations' pero la carpeta migrations/ NO existe (verificado: 'ls migrations/' -> 'No such file or directory'). package.json solo expone 'db:push'='drizzle-kit push' (verificado: scripts = dev, build, start, check, db:push; sin db:generate ni db:migrate). db:push sincroniza el esquema de forma directa y potencialmente destructiva, sin historial versionado ni rollback. .gitignore NO ignora migrations/ (verificado), asi que esa parte ya esta OK. Esto impide auditar cambios de esquema, revertir, o reproducir el estado de la BD de forma determinista.
- **Evidencia:** drizzle.config.ts:7 out: './migrations'; package.json scripts solo {dev, build, start, check, db:push}; carpeta ./migrations inexistente; .gitignore sin regla migrations (verificado grep). server/db.ts usa drizzle-orm/neon-http + @neondatabase/serverless. drizzle-kit ^0.31.4, drizzle-orm ^0.39.1.
- **Archivos:** package.json, drizzle.config.ts, migrations/, .gitignore

**Fix / prompt:**

```
Establece un flujo de migraciones versionadas con drizzle-kit, manteniendo Neon/neon-http. NO cambies el driver de server/db.ts (usa neon-http y debe seguir asi; drizzle-kit usa su propia conexion via DATABASE_URL, independiente de db.ts).

1) En package.json, dentro de 'scripts', agrega DOS scripts nuevos junto al db:push existente (NO borres ni cambies db:push):
   "db:generate": "drizzle-kit generate",
   "db:migrate": "drizzle-kit migrate"

2) Genera el baseline. Como la BD YA tiene el esquema aplicado via db:push, corre 'npm run db:generate'. Esto crea la carpeta ./migrations con el primer archivo SQL (0000_*.sql) y la subcarpeta meta/ (con _journal.json y un snapshot). Este SQL es tu baseline.

3) NO corras 'npm run db:migrate' contra la BD que ya tiene el esquema: intentaria CREATE TABLE de tablas existentes y fallaria con 'relation already exists'. Para una BD ya poblada, el patron seguro es: deja el baseline generado en ./migrations SIN aplicarlo (sirve como punto de partida documentado y versionado). De aqui en adelante, los cambios FUTUROS de esquema se haran con 'npm run db:generate' (crea un nuevo 0001_*.sql con solo el delta) seguido de 'npm run db:migrate' (que SI aplicara solo los deltas nuevos, porque drizzle-kit crea y gestiona automaticamente su tabla de tracking drizzle.__drizzle_migrations la primera vez que corre migrate y registra que migraciones aplico). NO manipules manualmente la tabla drizzle.__drizzle_migrations ni edites _journal.json a mano.

   IMPORTANTE sobre el baseline ya aplicado: si en el futuro quieres que drizzle-kit considere el baseline 0000 como 'ya aplicado' sin re-ejecutarlo, la forma soportada es regenerar el esquema desde cero en un entorno limpio; en produccion con datos NO toques esto. Para este proyecto basta con: baseline generado + commiteado + db:migrate solo para deltas futuros.

4) Asegura que ./migrations (incluida migrations/meta/) quede versionada en git. Verificado: .gitignore actual NO ignora migrations/, asi que NO necesitas tocar .gitignore. Commitea la carpeta migrations/ completa.

Ejecuta este lote AL FINAL, DESPUES de P1-1, P1-2 y P1-4, para que el baseline capture ya las foreign keys e indices. Confirma que ./migrations existe con al menos un .sql y la subcarpeta meta/.
```

- **Aceptación:** 'ls migrations/' muestra al menos un archivo 0000_*.sql y la carpeta meta/ con _journal.json. El SQL del baseline (abrir el .sql generado) incluye las definiciones de FOREIGN KEY de P1-1/P1-2 (buscar 'FOREIGN KEY' y 'ON DELETE') y los CREATE INDEX de P1-4. 'cat package.json | grep db:' muestra db:push, db:generate y db:migrate. La app sigue arrancando con 'npm run dev' sin tocar la BD existente. NO se ejecuto db:migrate contra la BD de produccion.
- **Riesgo / cuidado:** RIESGO PRINCIPAL: correr 'drizzle-kit migrate' sobre una base que ya tiene el esquema aplicado por db:push fallaria con 'relation already exists'. El prompt instruye explicitamente NO correr migrate ahora; solo generar el baseline y versionarlo; migrate queda reservado para deltas futuros. CORRECCION DEL VERIFICADOR: el paso original de 'insertar manualmente el hash del baseline leyendo meta/_journal.json' era ambiguo y riesgoso (un agente podria corromper drizzle.__drizzle_migrations con un hash incorrecto); se elimino y se reemplazo por dejar que drizzle-kit gestione su tabla de tracking automaticamente. Hacer este lote AL FINAL. Nunca borrar la BD para 'empezar limpio'.

### ☐ P1-4 — Indices en columnas de busqueda, filtro y joins de pivote
- **Severidad:** mayor · **Dominio:** Capa de Datos / Drizzle ORM (shared/schema.ts, server/db.ts, server/seed.ts, drizzle.config.ts)
- **Hallazgo:** El esquema NO define NINGUN indice (verificado por grep: cero index()/uniqueIndex() en shared/schema.ts). Los joins de pivote y varios filtros SQL no estan indexados. PERO ATENCION (correccion del verificador): NO todos los filtros que cita el lote original ocurren en SQL. Verificado: representativeMatters se filtra por practiceAreaSlug en JAVASCRIPT (routes.ts:683 allMatters.filter(m => m.practiceAreaSlug === slug), tras storage.getRepresentativeMatters() que trae todo sin WHERE en storage.ts). news se filtra por published/publishAt tambien en JS (routes.ts:391 y 402, allNews.filter(...)); storage.getNews() (312) es db.select().from(news) sin WHERE; no existe ningun filtro SQL sobre news.published/publishAt ni blogPosts.status (grep cero). Por tanto los indices sobre esas columnas NO seran usados por las queries actuales hasta que se empujen los filtros a SQL. Los filtros que SI ocurren en SQL y se beneficiarian de indice: newsTranslations(newsId,language) en storage.ts:1047-1051, websiteAuditFindings.auditId en storage.ts:1137, y los joins/cascada de las tablas pivote. events.published SI se filtra en SQL (storage.ts:726,739) y seria un indice util que el lote no proponia.
- **Evidencia:** shared/schema.ts: cero index()/uniqueIndex() (grep -c = 0). routes.ts:683 filter JS por practiceAreaSlug; routes.ts:391/402 filter JS por publishAt/published; storage.ts:312 getNews sin WHERE; storage.ts:1047-1051 where newsId AND language (SQL real); storage.ts:1137 where auditId (SQL real); storage.ts:726/739 events.published (SQL real). Las columnas .unique() (slug, email, token) ya tienen indice implicito.
- **Archivos:** shared/schema.ts

**Fix / prompt:**

```
En shared/schema.ts agrega indices a las columnas de join/filtro. Importa 'index' desde 'drizzle-orm/pg-core' (agregalo a la lista de imports existente en la linea 2: pgTable, text, varchar, timestamp, integer, boolean, jsonb -> añade index). Drizzle define indices con el tercer argumento callback de pgTable: (table) => ({ nombreIdx: index('nombre_idx').on(table.columna) }). Agrega SOLO indices con uso comprobado y los de pivote (que aceleran joins y cascada):

GRUPO A (alto valor, usados en SQL o en joins/cascada de FK):
1) En las 8 tablas pivote (las de P1-1), un indice por cada columna FK: p.ej teamMemberPracticeGroups -> index('tmpg_team_member_idx').on(t.teamMemberId) e index('tmpg_practice_group_idx').on(t.practiceGroupId). Replica para teamMemberIndustryGroups, newsTeamMembers, blogPostTags, teamMemberRankings, teamMemberAwards, clientPracticeGroups, teamMemberDesks (un indice por cada una de sus 2 columnas de relacion).
2) newsTranslations: index('news_trans_news_lang_idx').on(t.newsId, t.language) (compuesto, es el filtro real de storage.ts:1047-1051).
3) websiteAuditFindings: index('findings_audit_idx').on(t.auditId) (filtro real de storage.ts:1137) e index('findings_entity_idx').on(t.entityType, t.entityId).
4) agentJobs: index('agent_jobs_type_status_idx').on(t.agentType, t.status). agentEvents: index('agent_events_job_idx').on(t.jobId). contentAnalysis: index('content_analysis_article_idx').on(t.articleId).
5) events: index('events_published_date_idx').on(t.published, t.date) (events.published SI se filtra en SQL, storage.ts:726/739).

GRUPO B (OPCIONAL, solo aplicar si TAMBIEN se refactoriza la query a SQL; HOY estas columnas se filtran en JavaScript y el indice quedaria inactivo - NO bloquean este lote):
6) representativeMatters: index('rep_matters_practice_area_idx').on(t.practiceAreaSlug) y index('rep_matters_industry_idx').on(t.industrySlug). SOLO util si se cambia routes.ts:683/storage para filtrar en SQL.
7) news: index('news_published_publishat_idx').on(t.published, t.publishAt). SOLO util si se cambia routes.ts:391/402/storage.getNews para filtrar en SQL. blogPosts: index('blog_posts_status_idx').on(t.status). SOLO util cuando exista una query SQL que filtre por status.

NO agregues indices sobre columnas que ya son .unique() (slug, email, token). Manten intactas las columnas existentes. Luego corre 'npm run db:push' y acepta la creacion de los indices. Crear indices sobre tablas con datos en Postgres es seguro y no destructivo. Confirma que termino sin errores.
```

- **Aceptación:** En la consola SQL: SELECT indexname FROM pg_indexes WHERE tablename='news_translations'; debe incluir 'news_trans_news_lang_idx'. Repetir para website_audit_findings (findings_audit_idx, findings_entity_idx), events (events_published_date_idx) y al menos una tabla pivote (p.ej tmpg_team_member_idx). EXPLAIN ANALYZE de getNewsTranslation (SELECT ... WHERE news_id=$1 AND language=$2) debe mostrar Index Scan usando news_trans_news_lang_idx (esta SI es una query SQL real). NO usar representative_matters como prueba de Index Scan: su filtro ocurre en JavaScript (routes.ts:683), no en SQL, asi que un EXPLAIN no reflejaria el index hasta refactorizar esa ruta.
- **Riesgo / cuidado:** Crear indices es no destructivo, pero el callback de pgTable debe devolverse correctamente o drizzle-kit no detecta los indices: respetar la firma (table) => ({...}). Nombres de indice unicos por esquema (por eso cada nombre lleva prefijo de tabla). CORRECCION DEL VERIFICADOR: la aceptacion original 'EXPLAIN ANALYZE de representative_matters debe mostrar Index Scan' era INALCANZABLE porque ese filtro corre en JS, no en SQL (verificado routes.ts:683); se cambio a una query SQL real (newsTranslations). Los indices del GRUPO B son inocuos pero inactivos hasta refactor; documentarlos como tales. Hacer este lote ANTES de P1-3 para que el baseline capture los indices. Compatible con neon-http, no requiere cambiar driver.

### ☐ P1-5 — Idempotencia del seed con onConflictDoNothing por slug/clave unica
- **Severidad:** menor · **Dominio:** Capa de Datos / Drizzle ORM (shared/schema.ts, server/db.ts, server/seed.ts, drizzle.config.ts)
- **Hallazgo:** El seed (server/seed.ts, funcion seed() lineas 1156-1224) cubre ~7-8 tablas (news, officeImages, practiceGroups, industryGroups, teamMembers, representativeMatters, events, adminUsers) y su idempotencia es por bloque, no por fila: patron 'const existing = await db.select().from(tabla); if (existing.length === 0) { insert }' (verificado lineas 1159-1163 news, 1165-1169 officeImages, 1171-1175 practiceGroups, 1177-1181 industryGroups, 1183-1187 teamMembers, 1189-1193 representativeMatters, 1218-1222 events). Si la tabla tiene aunque sea 1 fila, se salta TODO el bloque; si se interrumpe a mitad, al reintentar puede quedar incompleto. Solo el admin user usa onConflictDoNothing (linea 1212, ademas de su propia guarda length===0). seed() corre en CADA arranque (verificado routes.ts:179). news/practiceGroups/industryGroups/teamMembers tienen .unique() en slug (schema.ts:92,157,175,192), por lo que se puede hacer insert idempotente fila a fila.
- **Evidencia:** server/seed.ts:1159-1163 patron select-length-0-then-insert para news; 1165-1169 officeImages; 1171-1175 practiceGroups; 1177-1181 industryGroups; 1183-1187 teamMembers; 1189-1193 representativeMatters; 1218-1222 events. onConflictDoNothing en linea 1212 (admin). Slugs unicos: news.slug (92), practiceGroups.slug (157), industryGroups.slug (175), teamMembers.slug (192). seed importado/llamado en routes.ts:179. eq importado en seed.ts:2; tablas importadas en seed.ts:3.
- **Archivos:** server/seed.ts

**Fix / prompt:**

```
En server/seed.ts haz el seed idempotente fila a fila usando onConflict, en vez del patron 'si la tabla esta vacia, inserta todo'. Para las tablas cuya clave unica es el slug (news, practiceGroups, industryGroups, teamMembers) cambia el insert para que ignore filas ya existentes:

Para news (lineas ~1159-1163), reemplaza el bloque (incluida la guarda 'if (existingNews.length === 0)') por:
  await db.insert(news).values(newsData).onConflictDoNothing({ target: news.slug });
Replica el mismo cambio para:
- practiceGroups -> await db.insert(practiceGroups).values(practiceGroupsData).onConflictDoNothing({ target: practiceGroups.slug });
- industryGroups -> .onConflictDoNothing({ target: industryGroups.slug })
- teamMembers -> .onConflictDoNothing({ target: teamMembers.slug })
Puedes eliminar tambien las lineas 'const existingX = await db.select()...' que quedan sin uso para esas 4 tablas.

Para officeImages, representativeMatters y events (que NO tienen columna slug unica) conserva la guarda de tabla-vacia actual O agrega onConflictDoNothing() SIN target (omite duplicados exactos de PK). NO cambies el bloque del admin user (ya usa onConflictDoNothing y guarda por email).

No agregues seeds de tablas nuevas en este lote. Verifica que 'npm run dev' arranca y que correr el seed dos veces (reiniciar el server, que dispara seed() via routes.ts:179) no duplica filas ni lanza error de unique violation.
```

- **Aceptación:** Reiniciar el servidor dos veces consecutivas (cada arranque dispara seed()) NO produce error 'duplicate key value violates unique constraint' ni duplica filas: SELECT count(*) FROM practice_groups antes y despues de la 2da corrida debe ser identico. Insertar manualmente un practice_group con slug nuevo y volver a arrancar (seed) debe respetar el existente y solo agregar los faltantes del seed sin tocar el insertado a mano.
- **Riesgo / cuidado:** onConflictDoNothing({ target: ... }) requiere que la columna target tenga constraint UNIQUE (verificado: los 4 slug lo tienen). Si se pasa un target sin unique, Postgres lanza error; por eso solo se usa target en tablas con slug unico. No quitar la guarda en officeImages/representativeMatters/events si no se les pone onConflict, porque sin clave unica reinsertarian duplicados. Cambio acotado a seed.ts. drizzle-orm 0.39 soporta onConflictDoNothing({ target }) con la firma usada. Independiente de los demas lotes (no toca la BD ni el esquema).

### ☐ P1-6 — Limite de longitud en campos text() de entrada de usuario
- **Severidad:** menor · **Dominio:** Capa de Datos / Drizzle ORM (shared/schema.ts, server/db.ts, server/seed.ts, drizzle.config.ts)
- **Hallazgo:** Campos que reciben texto de usuario/editor estan definidos como text() sin limite en shared/schema.ts: news.content (90), news.contentEs (91), jobOpenings.description (994), jobOpenings.requirements (996), requirementsEs (997), representativeMatters.description (275), descriptionEs (276), contactSubmissions.message (309). Sin tope, una entrada maliciosa/accidental puede insertar payloads enormes (DoS por almacenamiento, lentitud en renders). La validacion Zod tampoco acota: insertNewsSchema (118), insertJobOpeningSchema (1011), insertRepresentativeMatterSchema (286), insertContactSubmissionSchema (315) derivan de createInsertSchema sin .max(). Contraste verificado: blogPostFormSchema (468-485) SI acota con .max().
- **Evidencia:** shared/schema.ts:90 content: text('content') sin limite; 91 contentEs idem; 994 description: text('description').notNull(); 996 requirements: text('requirements'); 275 description: text('description').notNull(); 309 message: text('message').notNull(). insertNewsSchema en 118 (omit id,date), insertJobOpeningSchema en 1011, insertRepresentativeMatterSchema en 286, insertContactSubmissionSchema en 315. blogPostFormSchema 468-485 SI usa .max(). NOTA: la linea de representativeMatters.description es 275 (no 276); descriptionEs es 276 (no 277) - corregido respecto al lote original.
- **Archivos:** shared/schema.ts

**Fix / prompt:**

```
Agrega validacion de longitud maxima a los campos de texto libre de entrada de usuario, a nivel de schema Zod (NO cambies el tipo de columna a varchar en la BD para no truncar datos existentes ni forzar un push riesgoso). En shared/schema.ts, encadena .extend() en cada createInsertSchema afectado:

1) news (linea ~118): export const insertNewsSchema = createInsertSchema(news).omit({ id: true, date: true }).extend({ content: z.string().max(50000).optional().nullable(), contentEs: z.string().max(50000).optional().nullable(), excerpt: z.string().max(2000), excerptEs: z.string().max(2000) }); (excerpt/excerptEs son .notNull() en la tabla, mantenlos requeridos; content/contentEs son nullable, mantenlos optional+nullable).
2) jobOpenings (linea ~1011): .extend({ description: z.string().max(20000), descriptionEs: z.string().max(20000), requirements: z.string().max(20000).optional().nullable(), requirementsEs: z.string().max(20000).optional().nullable() }); (description/descriptionEs son notNull, requeridos).
3) representativeMatters (linea ~286): .extend({ description: z.string().max(10000), descriptionEs: z.string().max(10000) }); (ambos notNull).
4) contactSubmissions (linea ~315): .extend({ message: z.string().max(5000) }); (message es notNull).

Usa los limites indicados (ajustables, pero pon un tope finito). NO cambies las definiciones pgTable (siguen siendo text()), asi no hace falta migracion ni hay riesgo de truncar datos. Verifica que 'npm run check' (tsc) compila sin errores de tipo y que enviar un mensaje de contacto normal sigue funcionando.
```

- **Aceptación:** 'npm run check' compila sin errores. Enviar por la API un POST de contacto con message de 6000 caracteres es rechazado por validacion Zod (400) con mensaje de longitud; uno de 200 caracteres pasa. Crear una news con content de 60000 caracteres es rechazado; uno normal pasa. Los datos existentes en la BD no se modifican (no se corrio db:push para estos campos).
- **Riesgo / cuidado:** Cambiar la columna text->varchar(n) en la BD SI seria riesgoso (truncaria/fallaria con datos existentes mas largos); por eso el prompt NO toca pgTable y solo refina el schema Zod. RIESGO VERIFICADO: cada createInsertSchema usa .omit() antes del .extend(); el .extend() debe ir DESPUES del .omit() (el resultado de createInsertSchema(...).omit(...) sigue siendo ZodObject y soporta .extend). Mantener .optional().nullable() en los campos nullable (content/contentEs/requirements/requirementsEs) para no romper inserts que los dejan vacios. Verificar que las rutas que usan estos schemas (routes.ts) sigan parseando OK con npm run check. Cambio puramente de validacion, sin push a la base. Independiente de los demas lotes.

## P2 · Sistema de agentes

### ☐ P2-1 — Autenticar el WebSocket /ws/pipeline (handshake sin verificacion) — REQUIERE actualizar el cliente
- **Severidad:** mayor · **Dominio:** SEGURIDAD
- **Hallazgo:** El servidor WebSocket en server/routes.ts:182 se crea con path '/ws/pipeline' y acepta cualquier conexion sin verificar token (routes.ts:204-225). Cualquier cliente puede conectarse y recibir el stream de progreso del pipeline interno, filtrando actividad interna y permitiendo consumo de recursos. VERIFICADO: el frontend (client/src/hooks/usePipelineProgress.ts:69) conecta a `${protocol}//${window.location.host}/ws/pipeline` SIN token, por lo que tras este lote el panel deja de recibir progreso hasta actualizar esa llamada.
- **Evidencia:** server/routes.ts:182 'const wss = new WebSocketServer({ server: httpServer, path: '/ws/pipeline' });' (VERIFICADO). routes.ts:204 'wss.on('connection', (ws, req) => {' NO es async actualmente; envia datos en linea 224 'ws.send(JSON.stringify({ type: 'connected', clientId }));' sin validar credenciales (VERIFICADO). authMiddleware de Express no aplica a WS. VERIFICADO: storage.getAdminSession existe (server/storage.ts:642) y devuelve AdminSession con .expiresAt. crypto, WebSocketServer y WebSocket estan importados en routes.ts (lineas 3 y 9). VERIFICADO consumo cliente: client/src/hooks/usePipelineProgress.ts:69 abre el WS sin query token.
- **Archivos:** server/routes.ts, client/src/hooks/usePipelineProgress.ts

**Fix / prompt:**

```
Este lote tiene backend (autenticar el handshake) y frontend (pasar el token), debes hacer ambos o el panel deja de ver el progreso del pipeline.

PARTE A — server/routes.ts:
1. Localiza 'wss.on('connection', (ws, req) => {' (linea 204). Al inicio del callback, antes de generar el clientId, agrega la verificacion del token y marca el callback como async:

   wss.on('connection', async (ws, req) => {
     try {
       const url = new URL(req.url || '', 'http://localhost');
       const token = url.searchParams.get('token');
       if (!token) { ws.close(1008, 'Authentication required'); return; }
       const session = await storage.getAdminSession(token);
       if (!session || new Date() > session.expiresAt) { ws.close(1008, 'Invalid or expired session'); return; }
     } catch (e) {
       ws.close(1011, 'Auth error');
       return;
     }
     // ... resto del codigo existente (clientId, registrar handlers, ws.send connected) SIN CAMBIOS
   });

   'storage' ya esta importado en routes.ts (se usa en todo el archivo). No cambies el heartbeat ni los handlers close/error/pong existentes (lineas 209-221).

PARTE B — frontend (OBLIGATORIA): en client/src/hooks/usePipelineProgress.ts (linea ~69), la URL del WS es `${protocol}//${window.location.host}/ws/pipeline`. Cambiala para anexar el token de sesion admin: lee el token con getToken() de '@/lib/adminAuth' y construye `${protocol}//${window.location.host}/ws/pipeline?token=${token}`. Si no hay token (usuario no admin), no abras la conexion.

Ejecuta 'npm run build' y confirma compilacion.
```

- **Aceptación:** 1) Conectar a wss://<dominio>/ws/pipeline SIN ?token= cierra la conexion con codigo 1008 y nunca envia {type:'connected'}. 2) Conectar con ?token=<sesion-valida> mantiene la conexion abierta y recibe {type:'connected', clientId}. 3) Conectar con ?token=basura cierra con 1008. 4) grep -n 'getAdminSession' server/routes.ts muestra la verificacion dentro del handler de connection. 5) El panel admin que usa usePipelineProgress sigue recibiendo progreso (porque ahora pasa el token). 6) 'npm run build' compila sin errores.
- **Riesgo / cuidado:** CRITICO: si SOLO se aplica la Parte A (backend) y no la Parte B, el panel (usePipelineProgress.ts:69, que hoy conecta SIN token) dejara de recibir progreso del pipeline. Hay que actualizar esa URL para incluir ?token=. No romper el heartbeatInterval ni los handlers close/error/pong existentes. El callback de connection debe quedar async.

### ☐ P2-2 — Rate limiting global y en endpoints caros (/api/contact y agentes)
- **Severidad:** mayor · **Dominio:** SEGURIDAD
- **Hallazgo:** El unico rate limiting del sistema es el de login (auth.ts checkRateLimit, usado solo en routes.ts:949). No hay limite global ni en endpoints abusables como POST /api/contact (routes.ts:630, sin limite, spam de submissions). Falta una capa de proteccion contra abuso generalizado.
- **Evidencia:** auth.ts:41 checkRateLimit y auth.ts:75 recordLoginAttempt solo se invocan en routes.ts:949/960/976/982/989/994 (login) (VERIFICADO). routes.ts:630 'app.post("/api/contact", async (req, res) => {' no tiene rate limit (VERIFICADO). No hay app.use con un limitador global en index.ts ni en routes.ts (VERIFICADO).
- **Archivos:** server/index.ts, server/routes.ts, server/middleware/rateLimit.ts

**Fix / prompt:**

```
Reutiliza el middleware rateLimit creado en el lote P1-1 (server/middleware/rateLimit.ts). Si ese lote aun no se aplico, crealo primero segun sus instrucciones. Luego:

1. En server/routes.ts, dentro de registerRoutes donde declaraste translateLimiter, declara: const contactLimiter = rateLimit({ windowMs: 60_000, max: 5 });

2. Aplica un limite global a TODAS las rutas /api en server/index.ts. Agrega el import arriba junto a los demas imports de index.ts (no en medio del archivo): import { rateLimit } from './middleware/rateLimit'; y justo despues del bloque de cors (linea 20) agrega: app.use('/api', rateLimit({ windowMs: 60_000, max: 120 }));

3. En server/routes.ts agrega contactLimiter al endpoint de contacto (linea 630): app.post("/api/contact", contactLimiter, async (req, res) => { ... })

El limite global de 120/min por IP no debe afectar la navegacion normal. El de contacto (5/min) frena el spam. Ejecuta 'npm run build' y confirma compilacion.
```

- **Aceptación:** 1) 6 POST seguidos a /api/contact desde la misma IP: el 6 devuelve 429. 2) Mas de 120 requests/min a cualquier /api desde una IP devuelven 429. 3) Navegacion normal del sitio (cargar paginas, ver noticias) no dispara 429. 4) grep -n "app.use('/api', rateLimit" server/index.ts muestra el limitador global. 5) 'npm run build' compila sin errores.
- **Riesgo / cuidado:** El limite global debe ser holgado (120/min) para no romper la carga de paginas que hacen varios fetch /api en paralelo. El middleware en memoria es por instancia; en autoscale con multiples instancias el limite es por instancia (aceptable como mitigacion). Aplicar despues o junto con P1-1 (depende del mismo archivo middleware). NOTA: ubicar el app.use('/api', rateLimit(...)) en index.ts ANTES de registerRoutes para que cubra todas las rutas; colocarlo justo tras cors (linea 20) lo logra, ya que registerRoutes se invoca dentro del IIFE en linea 76.

### ☐ P2-3 — Mover credenciales admin de .replit a Replit Secrets
- **Severidad:** mayor · **Dominio:** SEGURIDAD
- **Hallazgo:** El archivo .replit (versionado) contiene en [userenv.shared] las variables ADMIN_EMAIL='admin@vonwobeser.com' (linea 48) y ADMIN_PASSWORD_HASH=$2b$10$... (linea 49). Aunque es un hash bcrypt, exponerlo en un archivo versionado facilita ataques offline y revela el email del admin. Estas credenciales deben vivir en Replit Secrets, que es lo que server/seed.ts:1196-1197 ya espera leer via process.env.
- **Evidencia:** .replit lineas 47-49 (VERIFICADO literal): '[userenv.shared]', 'ADMIN_EMAIL = "admin@vonwobeser.com"', 'ADMIN_PASSWORD_HASH = "$2b$10$YjjklWJgO3RtE3iBZ2oKwek00bTZ/6oc0YppsuqItCx5mEAJqaQJu"'. server/seed.ts:1196-1197 lee 'process.env.ADMIN_EMAIL' y 'process.env.ADMIN_PASSWORD_HASH' para crear el admin (seed.ts:1199-1213, role 'super_admin', con onConflictDoNothing) (VERIFICADO).
- **Archivos:** .replit, server/seed.ts

**Fix / prompt:**

```
Vas a mover las credenciales admin de .replit a los Replit Secrets, SIN romper el seed del admin. El codigo ya lee estas variables via process.env (server/seed.ts:1196-1197). Pasos:

1. En el panel de Replit, abre Secrets (icono de candado) y crea dos secrets con EXACTAMENTE estos nombres y los valores actuales de .replit:
   - ADMIN_EMAIL = admin@vonwobeser.com
   - ADMIN_PASSWORD_HASH = $2b$10$YjjklWJgO3RtE3iBZ2oKwek00bTZ/6oc0YppsuqItCx5mEAJqaQJu

2. En el archivo .replit, ELIMINA las lineas 48-49 (ADMIN_EMAIL y ADMIN_PASSWORD_HASH). Si la seccion [userenv.shared] (linea 47) queda vacia y Replit se queja, elimina tambien ese encabezado y la linea 45 [userenv] si quedara huerfana. Deja el resto del archivo intacto.

3. Reinicia el repl. Verifica en los logs que el seed siga encontrando/creando el admin (seed.ts imprime 'Admin user created: ...' o nada si ya existe).

4. RECOMENDADO: tras confirmar que el login admin funciona con Secrets, rota la contrasena generando un nuevo hash bcrypt (rounds 12, como SALT_ROUNDS en auth.ts:7) y actualizando el secret ADMIN_PASSWORD_HASH, ya que el hash viejo estuvo en el historial de git.

No cambies server/seed.ts: ya lee process.env correctamente.
```

- **Aceptación:** 1) grep -n 'ADMIN_PASSWORD_HASH' .replit no devuelve resultados. 2) En Replit Secrets aparecen ADMIN_EMAIL y ADMIN_PASSWORD_HASH. 3) Tras reiniciar, el login admin con las credenciales funciona (POST /api/admin/login devuelve 200 con token). 4) Los logs del seed no muestran errores de admin faltante.
- **Riesgo / cuidado:** Si se borran .replit lineas 48-49 SIN antes crear los Secrets, el seed no creara el admin y el login fallara tras un reset de DB. Crear los Secrets PRIMERO, borrar despues. La seccion [userenv.shared] puede quedar vacia; eliminar el encabezado si Replit se queja.

### ☐ P2-1 — Status dinámico del chronicler desde datos reales (agent_jobs/agent_events/agent_skills)
- **Severidad:** mayor · **Dominio:** Sistema de Agentes / Fachadas
- **Hallazgo:** El endpoint GET /api/system/chronicler (routes.ts:3363-3386) devuelve el AGENT_REGISTRY estático donde cada uno de los 14 cards tiene status:"active" escrito a mano en el literal del array. updateAgentStatus() (SystemChronicler.ts:404-410) existe pero NO se llama desde ningún punto del código: grep 'updateAgentStatus' en server/ devuelve ÚNICAMENTE la definición (sin callers externos). Resultado: el dashboard siempre muestra 14/14 activos y nunca refleja si un agente realmente corrió, falló o está inactivo. lastActive y successRate de la interfaz AgentCapabilityCard nunca se llenan. La infraestructura real ya existe: DatabasePersistence expone getJobStatsByAgentType(), getRecentJobs(), getRecentEvents(), getSkillsByAgent() — solo falta atar el status a esos datos. ATENCIÓN: el id del card NO siempre coincide con el agentType de los jobs (ver riesgo_replit).
- **Evidencia:** server/agents/SystemChronicler.ts:52,69,86,103,121,138,155,172,189,206,223,240,257,274 — todos los cards llevan `status: "active"` hardcodeado. SystemChronicler.ts:404-410 define updateAgentStatus() que nunca se invoca (grep en server/ solo halla la definición; NINGÚN caller). SystemChronicler.ts:376-378 getAllAgents() retorna el registro estático tal cual. routes.ts:3367-3369 obtiene agents/timeline/stats sin consultar la DB; 3377-3379 sirve categorías vía getAgentsByCategory. DatabasePersistence (server/agents/storage/DatabasePersistence.ts) ofrece getJobStatsByAgentType() (línea 69), getRecentJobs() (111), getRecentEvents() (135), getSkillsByAgent() (208) — todas confirmadas. CORRECCIÓN vs lote original: routes.ts:3401 invoca recordEvolution(), NO updateAgentStatus(); updateAgentStatus no tiene ningún caller en absoluto.
- **Archivos:** server/agents/SystemChronicler.ts, server/routes.ts

**Fix / prompt:**

```
En el archivo server/agents/SystemChronicler.ts agrega un nuevo método async llamado getAllAgentsWithLiveStatus() que devuelva los mismos cards de getAllAgents() pero con el campo `status`, `lastActive` y `successRate` calculados dinámicamente desde la base de datos en lugar del valor hardcodeado. Implementación exacta: (1) importa dbPersistence desde './storage/DatabasePersistence'. (2) Dentro del método llama `const jobStats = await dbPersistence.getJobStatsByAgentType();` y `const recentEvents = await dbPersistence.getRecentEvents(200);`. (3) Construye un mapa explícito card.id -> agentType de jobs, porque NO coinciden para dos cards: el card 'smart_image_generator' NO tiene jobs propios (su agente en cola se llama 'image_suggestion'), y el card 'auto_recovery' NO se ejecuta como job en cola. Mapeo: para los 8 cards que SÍ son agentes en cola (formatter, metadata_linker, polyglot_translator, content_auditor, seo_optimizer, category_agent, website_auditor, content_analyzer) el agentType = card.id directamente. Para 'smart_image_generator' usa el agentType 'image_suggestion' al buscar jobStats. Para los demás cards (orchestrator, auto_recovery, legal_council, system_chronicler, system_health) NO esperes jobs en agent_jobs: trátalos como servicios/meta. (4) Calcula status así: para un card-agente-en-cola, si tuvo un job completado o un evento en las últimas 24h => 'active'; si tuvo jobs pero sin actividad reciente => 'dormant'; si nunca tuvo jobs ni eventos => 'dormant' (NO 'active'). Para los 5 cards de tipo servicio/meta (orchestrator, legal_council, smart_image_generator, system_chronicler, system_health) y auto_recovery, deja status 'active' SOLO si el servicio está efectivamente montado: orchestrator y system_chronicler siempre 'active'; legal_council, smart_image_generator, system_health, auto_recovery según disponibilidad real (por ahora puedes dejarlos 'active' si no tienes señal en DB, pero documenta con comentario que es estado de servicio, no de cola). (5) successRate = completed/total de jobStats[agentType] si total>0, si no undefined. (6) lastActive = timestamp del evento o job más reciente de ese agentType, si existe; si el card no tiene agentType en cola, déjalo undefined. NO borres getAllAgents() (getSystemStats, getAgentsByCategory, translateTechnicalToBusiness y validateInventory lo usan). Luego en server/routes.ts dentro del handler GET '/api/system/chronicler' (líneas 3363-3386) reemplaza `const agents = systemChronicler.getAllAgents();` (línea 3367) por `const agents = await systemChronicler.getAllAgentsWithLiveStatus();` y reemplaza las tres llamadas getAgentsByCategory('brain'|'hands'|'shield') (líneas 3377-3379) por un filtrado del array `agents` ya calculado (agents.filter(a => a.category === 'brain'), etc.) para que las categorías reflejen el status dinámico. Recalcula `stats` (línea 3369) filtrando ese mismo array `agents` para que activeAgents cuente solo los que quedaron 'active' (en vez de usar getSystemStats() que opera sobre el registro estático). El handler ya es `async`, así que el `await` es válido. NO cambies el shape del JSON de respuesta (mismas claves: success, agents, timeline, stats, categories). Verifica que el build de TypeScript pase y que el orquestador siga arrancando sin errores.
```

- **Aceptación:** curl http://localhost:5000/api/system/chronicler devuelve agents[] donde el campo status YA NO es siempre 'active' para todos: los cards de agentes-en-cola sin jobs registrados aparecen como 'dormant'. stats.activeAgents refleja el conteo real (menor o igual a 14) en vez de 14 fijo. Los cards cuyo agentType tuvo jobs recientes en agent_jobs muestran lastActive y successRate poblados. El card 'smart_image_generator' usa los jobs de 'image_suggestion' (no debe quedar siempre vacío por mal mapeo). grep 'getAllAgentsWithLiveStatus' server/agents/SystemChronicler.ts devuelve la nueva implementación. El servidor arranca sin errores de TypeScript.
- **Riesgo / cuidado:** NO eliminar getAllAgents() ni getSystemStats(): los usan getAgentsByCategory, validateInventory, translateTechnicalToBusiness. CRÍTICO: el card.id NO equivale 1:1 al agentType de los jobs. El card 'smart_image_generator' corresponde al agente en cola 'image_suggestion' (registrado en server/agents/index.ts:40); si mapeas por id directo, ese card siempre saldrá sin actividad. El card 'auto_recovery' tampoco corre como job en cola. Por eso el método debe usar un mapa explícito card.id->agentType y tratar los servicios/meta aparte, no un match ciego por id. El nuevo método es async: el handler de routes.ts ya es async function, usar await. No tocar el pipeline de la cola de jobs (AgentOrchestrator) ni los nombres de agentType en la DB. Mantener idéntico el shape del JSON para no romper el frontend (NerveCenter.tsx / AdminGuide que tipan la respuesta).

### ☐ P2-2 — Reconciliar inventario honesto: clasificar los 14 cards por naturaleza (8 agentes-en-cola + 6 servicios/meta), no inflar a 14 idénticos
- **Severidad:** mayor · **Dominio:** Sistema de Agentes / Fachadas
- **Hallazgo:** El inventario canónico (shared/agentConstants.ts:67) declara EXPECTED_AGENT_COUNTS.TOTAL=14 y validateAgentInventory() (líneas 85-119) lanza errores si no hay exactamente 14 cards con distribución 6 brain/4 hands/4 shield. Pero solo 9 BaseAgents reales se registran en el orquestador (server/agents/index.ts:35-43): formatter, metadata_linker, polyglot_translator, content_auditor, seo_optimizer, image_suggestion, category_agent, website_auditor, content_analyzer. CORRECCIÓN IMPORTANTE vs lote original: de esos 9 agentes en cola, solo 8 tienen un card homónimo en el AGENT_REGISTRY de SystemChronicler. El 9º agente en cola, 'image_suggestion', NO aparece como card; en su lugar el registro presenta el card 'smart_image_generator' (SystemChronicler.ts:90), que NO es un agente en cola sino un servicio (server/services/SmartImageGenerator.ts). Es decir: el card 'smart_image_generator' es la 'cara de marketing' del agente cuya implementación en cola se llama 'image_suggestion'. Por tanto, de los 14 cards: 8 son agentes-en-cola reales, y 6 son servicios/meta (orchestrator, auto_recovery, smart_image_generator, legal_council, system_chronicler, system_health). El Nerve Center los presenta a todos idénticos con status 'active'. La copy del card system_chronicler dice '14 agent capability registry' (adminTranslations.ts:1952). Hay que etiquetar honestamente la naturaleza de cada card, no inflar ni reducir el número.
- **Evidencia:** server/agents/index.ts:35-43 registra exactamente 9 agentes (incluye image_suggestion en línea 40, content_analyzer en línea 43); index.ts:45 imprime 'All 9 agents registered and ready'. shared/agentConstants.ts:67 EXPECTED_AGENT_COUNTS.TOTAL=14; líneas 91-93 validateAgentInventory exige length===14 y empuja error si no. SystemChronicler.ts:37-275 lista 14 cards con ids: orchestrator, auto_recovery, polyglot_translator, smart_image_generator, formatter, category_agent, metadata_linker, seo_optimizer, content_auditor, website_auditor, content_analyzer, legal_council, system_chronicler, system_health. NO existe card 'image_suggestion' en el registro (grep confirmado). 'smart_image_generator' NO está registrado como agente en cola (grep en index.ts/agentRoutes.ts no lo encuentra). Los agentType de los 9 agentes en cola (de los super(...) de cada specialized agent): formatter, metadata_linker, polyglot_translator, content_auditor, seo_optimizer, image_suggestion, category_agent, website_auditor, content_analyzer. legal_council es servicio (services/agents/LegalCouncilService.ts, importado en routes.ts:2578). smart_image_generator servicio (server/services/SmartImageGenerator.ts). system_health en server/agents/SystemHealthCheck.ts. client/src/lib/adminTranslations.ts:1952 copy '14 agent capability registry'. NOTA: adminTranslations usa ids 'image_suggestion' (línea 86) y 'self_healing' (línea ~122) para esos cards, distintos de los ids del registro 'smart_image_generator'/'auto_recovery'.
- **Archivos:** server/agents/SystemChronicler.ts, client/src/components/admin/NerveCenter.tsx, client/src/lib/adminTranslations.ts

**Fix / prompt:**

```
Objetivo: etiquetar honestamente la naturaleza de cada uno de los 14 cards sin cambiar conteos ni romper validateAgentInventory. PASO 1: en server/agents/SystemChronicler.ts agrega a la interfaz AgentCapabilityCard (líneas 14-26) un nuevo campo opcional `kind?: "queued_agent" | "service" | "meta";`. PASO 2: en el array AGENT_REGISTRY asigna kind a cada uno de los 14 cards usando su `id` EXACTO (verifica el id en el literal antes de asignar). kind:'queued_agent' para los 8 cards que SÍ se ejecutan como agente en cola y cuyo id coincide con un agentType registrado: formatter, metadata_linker, polyglot_translator, content_auditor, seo_optimizer, category_agent, website_auditor, content_analyzer. kind:'service' para: smart_image_generator (su implementación en cola es 'image_suggestion', pero el card representa el servicio), legal_council, system_health, auto_recovery. kind:'meta' para: orchestrator y system_chronicler. (Resultado: 8 queued_agent + 4 service + 2 meta = 14.) NO agregues un card nuevo 'image_suggestion' ni elimines 'smart_image_generator': mantener exactamente los 14 ids actuales para no romper validateAgentInventory ni el frontend. PASO 3: en client/src/components/admin/NerveCenter.tsx añade al interface AgentCapabilityCard (líneas 6-16) el mismo campo opcional `kind?: "queued_agent" | "service" | "meta";`. Dentro de AgentCard, debajo del rol (líneas 139-141), renderiza una etiqueta pequeña tipo <Badge> (ya está importado en línea 2) que muestre el kind en texto legible: 'Agente en cola' para queued_agent, 'Servicio' para service, 'Meta-sistema' para meta. Usa texto fijo en español condicionado al kind, o agrega claves a las translations si quieres i18n. PASO 4: en client/src/lib/adminTranslations.ts localiza la capability '14 agent capability registry' (línea 1952, dentro de system_chronicler.en.capabilities) y su equivalente en cada idioma del objeto system_chronicler, y cámbiala por la composición real, ej en: '14 capacidades: 8 agentes en cola + 6 servicios/meta'; es 'Registro de 14 capacidades: 8 agentes en cola + 6 servicios/meta'; etc. para de/zh/ko/ja/ar/ru/fr/it. NO toques la lógica del orquestador ni el registro de los 9 agentes en server/agents/index.ts. NO cambies EXPECTED_AGENT_COUNTS. El campo kind es aditivo y opcional.
```

- **Aceptación:** curl http://localhost:5000/api/system/chronicler muestra cada uno de los 14 agents con un campo `kind`. En el Nerve Center cada card muestra visualmente si es 'Agente en cola', 'Servicio' o 'Meta-sistema'. EXACTAMENTE 8 cards tienen kind:'queued_agent' (formatter, metadata_linker, polyglot_translator, content_auditor, seo_optimizer, category_agent, website_auditor, content_analyzer), 4 kind:'service' (smart_image_generator, legal_council, system_health, auto_recovery) y 2 kind:'meta' (orchestrator, system_chronicler). La copy del card system_chronicler ya no afirma 14 agentes genéricos sino la composición real (8 en cola + 6 servicios/meta). validateAgentInventory sigue pasando (14 cards, 6 brain/4 hands/4 shield).
- **Riesgo / cuidado:** NO reducir el array AGENT_REGISTRY de 14 a menos: validateAgentInventory() (agentConstants.ts:91-93) lanza Error y el constructor de SystemChronicler hace throw (línea 438), tumbando el módulo al importarse (se instancia como singleton en línea 452). Mantener exactamente 14 cards con sus ids actuales y distribución 6/4/4. El campo kind es aditivo y opcional. ATENCIÓN al desajuste de ids entre capas: el registro usa ids 'smart_image_generator' y 'auto_recovery', mientras adminTranslations.ts usa 'image_suggestion' (línea 86) y 'self_healing' para esos mismos cards; getAgentCardTranslation(agent.id,...) en NerveCenter.tsx:119 busca por el id del registro, así que esos 2 cards probablemente ya no resuelven traducción (bug preexistente fuera de alcance). NO 'arregles' ese desajuste en este lote salvo que el usuario lo pida; solo no lo empeores. El conteo correcto es 8 queued_agent, NO 9: el 9º agente en cola (image_suggestion) no tiene card propio.

### ☐ P2-3 — Eventos de evolución reales: persistir automáticamente en lugar de los 6 ficticios de dic-2025
- **Severidad:** mayor · **Dominio:** Sistema de Agentes / Fachadas
- **Hallazgo:** system_evolution.json contiene 6 eventos inventados fechados 2025-12-05 a 2025-12-10 (ej 'The Image Agent learned to bypass content policy filters...') que nunca se actualizan automáticamente. recordEvolution() persiste eventos reales pero SOLO se invoca desde el endpoint admin manual POST /api/system/chronicler/evolution (routes.ts:3401, protegido por authMiddleware) — ningún agente registra su propia evolución. getDefaultTimeline() (SystemChronicler.ts:315-366) regenera estos 6 eventos ficticios si el archivo no existe (se guarda vía saveEvolutionTimeline en loadEvolutionTimeline líneas 300-313). El Nerve Center pinta esta línea de tiempo como historia viva cuando es contenido estático de marketing. runLearningCycle() (AgentEvolution.ts:227-280) genera insights/proposals reales pero NO llama a systemChronicler.recordEvolution().
- **Evidencia:** system_evolution.json:1-50 (6 eventos hardcodeados dic-2025; verificado, incluye 'bypass content policy filters' en línea 5). server/agents/SystemChronicler.ts:315-366 getDefaultTimeline() los reproduce idénticos. SystemChronicler.ts:394-402 recordEvolution() es el único punto de escritura real (firma: recordEvolution(entry: Omit<SystemEvolutionEntry,'date'>): void). routes.ts:3389-3414 el único caller es el POST admin manual. AgentEvolution.ts:227-280 runLearningCycle() genera insights/improvements/newProposals pero NO llama a systemChronicler.recordEvolution(). Confirmado NO hay import circular: AgentEvolution.ts (imports líneas 1-2) no importa SystemChronicler, y SystemChronicler.ts no importa AgentEvolution.
- **Archivos:** server/agents/core/AgentEvolution.ts, server/agents/SystemChronicler.ts, system_evolution.json

**Fix / prompt:**

```
Objetivo: que la línea de tiempo de evolución se llene con eventos reales generados por el sistema, no con los 6 placeholders de diciembre 2025. PASO 1: en server/agents/core/AgentEvolution.ts, dentro de runLearningCycle(), justo antes del `return { insights, improvements, newProposals };` (línea ~279), importa systemChronicler (agrega al top del archivo `import { systemChronicler } from '../SystemChronicler';`) y registra UN solo evento resumen por ciclo (no uno por insight, para no inundar). Llama: `systemChronicler.recordEvolution({ title: 'Ciclo de aprendizaje ejecutado', description: `${insights.length} insights, ${improvements.length} mejoras, ${newProposals} propuestas nuevas`, impact: 'minor', category: 'performance' });`. OJO con el tipado: recordEvolution acepta Omit<SystemEvolutionEntry,'date'>, donde impact debe ser 'major'|'minor'|'critical' y category 'intelligence'|'security'|'performance'|'capability' (SystemChronicler.ts:33-34); agentId es opcional. Para evitar registrar ciclos vacíos sin valor, registra el evento SOLO cuando insights.length>0 || improvements.length>0 || newProposals>0. PASO 2: en server/agents/SystemChronicler.ts modifica getDefaultTimeline() (líneas 315-366) para que devuelva un array vacío `return [];` en vez de los 6 eventos ficticios, así un sistema nuevo arranca SIN historia falsa. PASO 3: reemplaza el contenido de system_evolution.json en la raíz del proyecto por un array vacío `[]`. NO toques la firma de recordEvolution() ni de getEvolutionTimeline(). NO cambies el endpoint admin manual POST /api/system/chronicler/evolution (sigue válido). Verifica que el servidor arranque, que getEvolutionTimeline() devuelva [] en limpio, y que tras ejecutar POST /api/agents/evolution/learning-cycle aparezca al menos un evento si hubo insights/proposals.
```

- **Aceptación:** Al arrancar limpio (con system_evolution.json = []), curl http://localhost:5000/api/system/chronicler devuelve timeline:[] (sin los eventos de dic-2025). Tras ejecutar `curl -X POST http://localhost:5000/api/agents/evolution/learning-cycle`, SI el ciclo produjo insights/improvements/proposals, system_evolution.json contiene al menos un evento nuevo fechado con la fecha actual ('Ciclo de aprendizaje ejecutado'). grep 'bypass content policy filters' system_evolution.json no devuelve nada. getDefaultTimeline() retorna [].
- **Riesgo / cuidado:** Verificado que NO hay dependencia circular directa (SystemChronicler no importa AgentEvolution; AgentEvolution no importa SystemChronicler hoy). Aun así, importar systemChronicler en AgentEvolution introduce una nueva arista de import; ambos son singletons instanciados al importar, así que valida que el orden de carga no produzca un undefined transitorio (si lo hubiera, usa import dinámico `const { systemChronicler } = await import('../SystemChronicler');` dentro de runLearningCycle en vez de import top-level). El tipado de recordEvolution es estricto: impact ∈ {major,minor,critical}, category ∈ {intelligence,security,performance,capability}; usar 'minor'/'performance' es válido. Si runLearningCycle se ejecuta muy seguido (ver P2-6, cada 6h), 1 evento por ciclo evita inundar. No borrar recordEvolution ni el endpoint POST. En Replit el filesystem persiste, así que dejar system_evolution.json=[] inicial es correcto (recordEvolution lo reescribe vía saveEvolutionTimeline/fs.writeFileSync).

### ☐ P2-4 — Animaciones 'pulsing' del Nerve Center atadas a status real, no decorativas permanentes
- **Severidad:** menor · **Dominio:** Sistema de Agentes / Fachadas
- **Hallazgo:** NerveCenter.tsx aplica las clases 'agent-pulse agent-breathing' (líneas 128-130) a todo card cuyo status sea 'active', y StatusIndicator (líneas 65-107) aplica 'animate-pulse' cuando config.pulse es true (status 'active' o 'evolving'). Como hoy TODOS los cards llegan con status:'active' hardcodeado (ver P2-1), la animación de latido/respiración es permanente y decorativa: sugiere actividad en vivo que no existe. Una vez que P2-1 haga el status dinámico, estas animaciones se atarán a actividad real — pero conviene además distinguir 'active reciente' (pulsa) de 'active histórico/dormant' (estático).
- **Evidencia:** client/src/components/admin/NerveCenter.tsx:118 `const isActive = agent.status === "active"`. NerveCenter.tsx:128-130 aplica 'agent-pulse agent-breathing' cuando isActive. NerveCenter.tsx:65-107 StatusIndicator: config.pulse=true para 'active' (línea 71) y 'evolving' (línea 77), y aplica 'animate-pulse' en línea 101. La interfaz AgentCapabilityCard del frontend (líneas 6-16) NO incluye lastActive: hay que añadirlo. Clases CSS 'agent-pulse' y 'agent-breathing' definidas en client/src/index.css:954 y :958 (no removerlas). Depende de P2-1 para que status y lastActive dejen de ser estáticos.
- **Archivos:** client/src/components/admin/NerveCenter.tsx

**Fix / prompt:**

```
Este lote depende de que P2-1 ya haya hecho el status dinámico y mande lastActive desde el backend. En client/src/components/admin/NerveCenter.tsx: (1) agrega al interface AgentCapabilityCard (líneas 6-16) el campo `lastActive?: string;` (el backend lo serializa como ISO string en JSON). (2) En AgentCard, debajo de `const isActive = agent.status === "active";` (línea 118) añade: `const isRecentlyActive = isActive && !!agent.lastActive && (Date.now() - new Date(agent.lastActive).getTime()) < 1000 * 60 * 60;` (actividad en la última hora). (3) En el className del Card (líneas 128-130) aplica 'agent-pulse agent-breathing' SOLO cuando isRecentlyActive, no cuando solo isActive. (4) Pasa la info de actividad reciente al StatusIndicator: cámbialo para recibir una prop booleana `recentlyActive` y que el punto use 'animate-pulse' únicamente cuando status==='active' && recentlyActive; para 'active' sin actividad reciente, punto verde fijo sin pulse; 'evolving' mantiene su pulse amarillo como hoy. NO inventes una animación nueva ni cambies los colores de status. Si agent.lastActive no viene del backend, isRecentlyActive es false y el card queda estático (comportamiento honesto por defecto). NO remuevas las clases CSS '.agent-pulse'/'.agent-breathing' de client/src/index.css (líneas 954/958).
```

- **Aceptación:** En el Nerve Center, solo los cards de agentes con actividad real en la última hora muestran latido; los demás aparecen estáticos aunque su status sea 'active'. Sin actividad en la DB, ningún card pulsa permanentemente. El interface del frontend acepta lastActive. La app compila (tsc/vite) y renderiza sin errores.
- **Riesgo / cuidado:** Ejecutar DESPUÉS de P2-1 (necesita que el backend mande lastActive y status dinámico; si no, todos quedan estáticos, lo cual es aceptable pero no demuestra el efecto). No remover las clases CSS '.agent-pulse'/'.agent-breathing' de client/src/index.css:954/958 (definidas globalmente). Cambio puramente visual: no toca lógica de datos. Si cambias la firma de StatusIndicator (añadir prop recentlyActive), revisa que sea el único callsite (lo es, dentro de AgentCard).

### ☐ P2-5 — Modelo 'gpt-5' en openai.ts: verificar y preparar fallback documentado a gpt-4o
- **Severidad:** mayor · **Dominio:** Sistema de Agentes / Fachadas
- **Hallazgo:** server/openai.ts invoca el modelo 'gpt-5' en tres llamadas (líneas 36, 77, 108) vía el proxy de Replit AI Integrations (baseURL=process.env.AI_INTEGRATIONS_OPENAI_BASE_URL, líneas 6-9). Si el proxy no expone 'gpt-5', translateLegalText (35-59), translateMultipleTexts (76-94) y suggestTranslation (107-126) lanzan excepción sin fallback y el pipeline de traducción (10 idiomas) se cae. No hay manejo de error de modelo-no-disponible ni modelo de respaldo. El comentario línea 5 afirma 'do not change this unless explicitly requested', pero no garantiza que el endpoint lo soporte.
- **Evidencia:** server/openai.ts:5 comentario 'the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user'. openai.ts:36 `model: "gpt-5"` en translateLegalText. openai.ts:77 en translateMultipleTexts. openai.ts:108 en suggestTranslation. Cliente con baseURL del proxy líneas 6-9. response_format:{type:'json_object'} en las tres (líneas 57, 90, 124); max_completion_tokens 4096 (58), 8192 (91), 4096 (125). No hay try/catch de fallback de modelo en ninguna función.
- **Archivos:** server/openai.ts

**Fix / prompt:**

```
En el archivo server/openai.ts haz robusto el uso del modelo sin cambiar el comportamiento cuando gpt-5 SÍ funciona. PASO 1: después de la creación del cliente openai (línea 9) define: `const PRIMARY_MODEL = process.env.OPENAI_PRIMARY_MODEL || "gpt-5";` y `const FALLBACK_MODEL = process.env.OPENAI_FALLBACK_MODEL || "gpt-4o";`. PASO 2: crea una función helper `async function chatWithFallback(params: Omit<Parameters<typeof openai.chat.completions.create>[0], 'model'>)` que intente primero `openai.chat.completions.create({ ...params, model: PRIMARY_MODEL })`, y si lanza un error de modelo (mensaje que incluya 'model' o status 404/400 de modelo no encontrado) reintente UNA vez con FALLBACK_MODEL y registre `console.warn('[openai] gpt-5 no disponible, usando fallback ' + FALLBACK_MODEL)`. Si el fallback también falla, relanza el error. NO captures errores que no sean de modelo (cuota, red, auth) — relánzalos directos para no enmascararlos ni reintentar infinito. PASO 3: reemplaza las tres llamadas directas openai.chat.completions.create({ model: "gpt-5", ... }) (líneas 35-59, 76-92, 107-126) por chatWithFallback({ ...mismos params sin el campo model }). Mantén messages, response_format:{type:'json_object'} y max_completion_tokens IDÉNTICOS (4096/8192/4096). NO cambies los prompts del sistema ni el parsing de result (JSON.parse de response.choices[0].message.content). Actualiza el comentario línea 5 para que diga que gpt-5 es el primario con fallback automático a gpt-4o vía variable de entorno. Verifica que el archivo compile y que las tres funciones sigan devolviendo el mismo tipo.
```

- **Aceptación:** grep 'chatWithFallback' server/openai.ts muestra la función helper y las tres llamadas usándola. Si se setea OPENAI_PRIMARY_MODEL a un modelo inexistente, los logs muestran '[openai] ... usando fallback gpt-4o' y la traducción devuelve texto en vez de tirar 500. Con gpt-5 disponible, comportamiento idéntico al actual. El tipado de translateLegalText/translateMultipleTexts/suggestTranslation no cambia y el build pasa.
- **Riesgo / cuidado:** No alterar response_format:{type:'json_object'} ni max_completion_tokens (4096/8192/4096): cambiarlos rompe el parsing JSON (las tres funciones hacen JSON.parse del content). El fallback solo debe dispararse ante error de modelo, no ante cualquier error (evita reintentos infinitos y enmascarar errores de cuota/auth). Mantener el cliente openai con baseURL del proxy de Replit intacto (líneas 6-9). El helper debe preservar el tipo de retorno de create para que JSON.parse(response.choices[0].message.content) siga compilando.

### ☐ P2-6 — 'Auto-evolución': convertir la heurística en ciclo programado real o ajustar el copy
- **Severidad:** mayor · **Dominio:** Sistema de Agentes / Fachadas
- **Hallazgo:** El sistema se promociona como auto-evolutivo, pero runLearningCycle() (AgentEvolution.ts:227-280) es una heurística pura de umbrales: si successRate<0.8 crea un proposal de texto fijo (líneas 239-254), si averageExecutionTime>30000ms sugiere caching (líneas 256-259). No hay LLM razonando, no hay auto-implementación (los proposals nacen status:'pending', línea 249, esperando aprobación humana manual), y NADIE invoca runLearningCycle automáticamente: el único trigger es POST /api/agents/evolution/learning-cycle (agentRoutes.ts:262). Sin intervención humana el sistema nunca corre el ciclo. La copy de varios cards sugiere autonomía (auto_recovery: 'autonomously repairs', SystemChronicler.ts:61).
- **Evidencia:** server/agents/core/AgentEvolution.ts:227-280 runLearningCycle() con umbrales hardcodeados (0.8 en línea 239, 30000ms en línea 256) y proposedChanges de texto fijo (línea 250). AgentEvolution.ts:249 los proposals nacen status:'pending'. server/agents/api/agentRoutes.ts:260-267 el único trigger es POST /evolution/learning-cycle. grep confirmó que runLearningCycle no se llama desde ningún setInterval ni en index.ts (solo agentRoutes.ts:262 y la definición). No hay llamada a openai ni a ningún LLM dentro del ciclo. El export del tracker es `evolutionTracker` (AgentEvolution.ts:316). Copy con lenguaje de autonomía: SystemChronicler.ts:61 ('autonomously repairs broken links'), :248-254 (system_chronicler), :95 (smart_image_generator).
- **Archivos:** server/index.ts, client/src/lib/adminTranslations.ts, server/agents/SystemChronicler.ts

**Fix / prompt:**

```
Implementa la OPCIÓN A (ciclo programado real) que es la honesta y de bajo riesgo. OPCIÓN A: en server/index.ts, dentro del callback async de httpServer.listen, después de `orchestrator.start(2000);` (línea 113) y antes del setInterval de mantenimiento horario (línea 120), agrega un setInterval que ejecute el ciclo de aprendizaje cada 6 horas. Importa el tracker al top del archivo: `import { evolutionTracker } from './agents/core/AgentEvolution';` (NOTA: index.ts hoy importa orchestrator pero NO evolutionTracker; hay que añadir este import). Dentro de un try/catch: `setInterval(async () => { try { const r = await evolutionTracker.runLearningCycle(); log(`[Evolution] Ciclo automático: ${r.insights.length} insights, ${r.newProposals} propuestas`, 'evolution'); } catch (err) { log(`[Evolution] Error en ciclo automático: ${err}`, 'evolution'); } }, 6 * 60 * 60 * 1000);`. Esto hace que el ciclo corra solo, sin intervención humana, cumpliendo 'auto-evolutivo' en la detección automática. PASO 2 obligatorio (copy honesto): en client/src/lib/adminTranslations.ts y en server/agents/SystemChronicler.ts, donde la descripción de agentes use lenguaje que implique auto-implementación de CÓDIGO (busca 'autonomously repairs' en SystemChronicler.ts:61, y términos equivalentes 'self-healing'/'auto-implementa'/'evolves itself' en adminTranslations.ts), matiza para que diga que el sistema DETECTA y PROPONE mejoras automáticamente y que las mejoras de código requieren aprobación, en vez de afirmar que se aplican solas. NO inventes auto-implementación de código real. NO cambies los umbrales 0.8/30000. Verifica que el setInterval esté DENTRO del callback de listen y en try/catch para no bloquear el arranque, y que el servidor siga respondiendo.
```

- **Aceptación:** Tras arrancar (o reduciendo temporalmente el intervalo para probar), los logs muestran '[Evolution] Ciclo automático...' sin que nadie llame al endpoint manualmente. La copy de los cards ya no afirma que el sistema implementa cambios de código por sí solo; describe detección/propuesta automática + aprobación. grep 'runLearningCycle' server/index.ts muestra la llamada dentro del setInterval. El servidor arranca sin bloqueos.
- **Riesgo / cuidado:** Añadir el import `evolutionTracker` en index.ts (hoy NO está importado allí). El setInterval debe ir DENTRO del callback async de httpServer.listen (líneas 107-130) y cada llamada envuelta en try/catch para no tumbar el proceso si un ciclo falla. NO disparar el ciclo en intervalos cortos (cada 6h está bien; menos satura la DB con proposals 'pending'). NO implementar auto-aplicación de cambios de código: el sistema solo debe proponer. No tocar la lógica interna de runLearningCycle más allá de invocarla (los umbrales 0.8/30000 quedan). Si combinas con P2-3 (que hace runLearningCycle escribir en system_evolution.json), el ciclo automático cada 6h dejará un evento real por ciclo — comportamiento deseado, pero tenerlo presente.

### ☐ P2-7 — website_auditor faltante en el switch de POST /run/:agentType y doble orchestrator.initialize()
- **Severidad:** menor · **Dominio:** Sistema de Agentes / Fachadas
- **Hallazgo:** Dos defectos de cableado del core: (1) El switch de POST /api/agents/run/:agentType (agentRoutes.ts:98-125) maneja 8 casos (formatter, metadata_linker, polyglot_translator, content_auditor, seo_optimizer, content_analyzer, image_suggestion, category_agent) pero OMITE website_auditor, que sí está registrado en el orquestador (index.ts:42) y es card 'shield' del inventario; pedir ejecutarlo manualmente devuelve 400 'Unknown agent type' (default línea 124). websiteAuditorAgent tampoco está importado en agentRoutes.ts (imports líneas 7-14). (2) orchestrator.initialize() se ejecuta DOS veces: una en server/index.ts:112 (dentro del callback de listen) y otra dentro de initializeAgents() en agents/index.ts:33 (invocado fire-and-forget desde routes.ts:3573, sin await). AgentOrchestrator.initialize() (líneas 35-44) NO tiene guard de idempotencia: recarga knowledgeStore.initialize(), addLegalGlossary(), evolutionTracker.initialize() y loadPendingJobsFromDatabase() (que llama resetInProgressJobsToPending), todo dos veces por arranque — desperdicio y posible doble-reset de jobs in_progress.
- **Evidencia:** server/agents/api/agentRoutes.ts:98-125 switch sin case 'website_auditor' (default return 400 en línea 124). websiteAuditorAgent NO importado en agentRoutes.ts (imports líneas 7-14 confirmados, no lo incluyen). server/agents/index.ts:42 registra websiteAuditorAgent. server/index.ts:112 `await orchestrator.initialize()` dentro del callback de httpServer.listen. server/agents/index.ts:33 `await orchestrator.initialize()` dentro de initializeAgents(). routes.ts:3572-3573 importa y llama initializeAgents() con .catch (fire-and-forget, NO await) durante registerRoutes, que corre ANTES del listen. AgentOrchestrator.initialize() (AgentOrchestrator.ts:35-44) sin guard `initialized`; loadPendingJobsFromDatabase (46-...) llama resetInProgressJobsToPending (línea 48). WebsiteAuditorAgent.execute(context, payload) confirmado en server/agents/specialized/WebsiteAuditorAgent.ts:70 (misma firma que FormatterAgent.execute línea 44). Export `websiteAuditorAgent` en WebsiteAuditorAgent.ts:696. Path de import correcto: '../specialized/WebsiteAuditorAgent'.
- **Archivos:** server/agents/api/agentRoutes.ts, server/agents/core/AgentOrchestrator.ts

**Fix / prompt:**

```
Dos cambios quirúrgicos. CAMBIO 1 (website_auditor en el switch): en server/agents/api/agentRoutes.ts añade al bloque de imports (líneas 7-14) `import { websiteAuditorAgent } from '../specialized/WebsiteAuditorAgent';`. Luego dentro del switch de POST '/run/:agentType' (líneas 98-125), agrega antes del default (línea 123): `case 'website_auditor': result = await websiteAuditorAgent.execute(context, payload); break;`. La firma WebsiteAuditorAgent.execute(context: ExecutionContext, payload: Record<string,unknown>) ya coincide con los demás agentes (verificado), así que no requiere ajuste. CAMBIO 2 (eliminar doble initialize) — usa la ALTERNATIVA SEGURA por guard idempotente, NO el reorden: en server/agents/core/AgentOrchestrator.ts, en initialize() (líneas 35-44), añade al inicio un guard. Agrega un campo privado `private initialized: boolean = false;` a la clase (junto a los otros campos privados, líneas 20-25) y al inicio de initialize() pon `if (this.initialized) return;` y al final (después de loadPendingJobsFromDatabase, antes del console.log final o justo después) pon `this.initialized = true;`. Esto neutraliza el doble init sin reordenar el arranque, lo cual es importante porque initializeAgents() se invoca fire-and-forget (sin await) desde routes.ts:3573 durante registerRoutes, ANTES del listen — un reorden manual sería frágil. Con el guard, la segunda llamada a initialize() (venga de index.ts:112 o de agents/index.ts:33) es no-op. NO elimines `await orchestrator.initialize()` de agents/index.ts:33 ni de index.ts:112: con el guard ambas son seguras y la primera que gane inicializa. NO toques los registerAgent (siguen siendo 9). Verifica en los logs que '[Orchestrator] Initializing agent system...' aparezca UNA sola vez al arrancar.
```

- **Aceptación:** curl -X POST http://localhost:5000/api/agents/run/website_auditor -H 'Content-Type: application/json' -d '{}' ya NO devuelve 400 'Unknown agent type' (ejecuta el agente). En los logs de arranque, '[Orchestrator] Initializing agent system...' (AgentOrchestrator.ts:36) aparece exactamente una vez. Los 9 agentes se registran (sigue saliendo '[Agents] All 9 agents registered and ready'). El pipeline de jobs sigue procesando cada 2s y resetInProgressJobsToPending corre una sola vez (sin doble-reset de jobs in_progress).
- **Riesgo / cuidado:** El guard idempotente (`if (this.initialized) return;` + `this.initialized = true;`) es la opción de MENOR riesgo: no requiere reordenar el arranque, lo cual es clave porque initializeAgents() corre fire-and-forget sin await desde routes.ts:3573 antes del listen — un reorden manual de los registerAgent (como planteaba la versión original del prompt) podría dejar agentes sin registrar si el timing cambia. CUIDADO: si hubiera lógica que dependa de RE-inicializar (recargar glossary tras cambios en runtime), el guard la bloquearía; en este código initialize() solo se llama al arranque, así que es seguro. Verificar que WebsiteAuditorAgent.execute acepta (context, payload) (confirmado, WebsiteAuditorAgent.ts:70). No eliminar registerAgent de ningún agente (siguen siendo 9). Archivo server/agents/index.ts y server/index.ts NO necesitan cambios con el enfoque del guard (puedes dejarlos como están).

## P3 · Features

### ☐ P3-1 — Eliminar PII y bodies completos de los logs (email en claro y response body)
- **Severidad:** menor · **Dominio:** SEGURIDAD
- **Hallazgo:** Fuga de PII y datos sensibles en logs. En server/routes.ts:661 se hace console.log con nombre y email del usuario en claro de cada contacto. En server/index.ts:52-68 el middleware de logging captura y serializa el response body COMPLETO de toda ruta /api (incluyendo login con tokens, datos admin, traducciones). Los logs de Replit pueden ser accesibles a terceros.
- **Evidencia:** server/routes.ts:661 (VERIFICADO literal): 'console.log(`[Contact] New submission from ${sanitizedData.fullName} <${sanitizedData.email}> saved with id ${submission.id}`);'. server/index.ts:52-68 (VERIFICADO literal): el middleware declara capturedJsonResponse (linea 52), sobreescribe res.json (lineas 54-58) y en res.on('finish') hace 'logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`' (lineas 64-66) logueando el body entero de cada respuesta /api.
- **Archivos:** server/routes.ts, server/index.ts

**Fix / prompt:**

```
Reduce la fuga de datos en logs en dos archivos.

1. En server/routes.ts linea 661, reemplaza el log que incluye email/nombre por uno que solo registre el id:
   console.log(`[Contact] New submission saved with id ${submission.id}`);

2. En server/index.ts, modifica el middleware de logging (lineas 49-73) para que NUNCA serialice el response body. El bloque del res.on('finish') debe quedar:

   res.on("finish", () => {
     const duration = Date.now() - start;
     if (path.startsWith("/api")) {
       const logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
       log(logLine);
     }
   });

   Y elimina la captura de capturedJsonResponse (lineas 52-58):
     let capturedJsonResponse: Record<string, any> | undefined = undefined;
     const originalResJson = res.json;
     res.json = function (bodyJson, ...args) {
       capturedJsonResponse = bodyJson;
       return originalResJson.apply(res, [bodyJson, ...args]);
     };
   El middleware debe seguir llamando next() al final.

Ejecuta 'npm run build' y confirma compilacion.
```

- **Aceptación:** 1) Tras enviar el formulario de contacto, los logs muestran '[Contact] New submission saved with id ...' SIN email ni nombre. 2) Tras un login exitoso, los logs muestran 'POST /api/admin/login 200 in XXms' SIN el token ni el body. 3) grep -n 'capturedJsonResponse' server/index.ts no devuelve resultados. 4) El middleware sigue llamando next() (la app responde normal). 5) 'npm run build' compila sin errores.
- **Riesgo / cuidado:** Quitar el body de los logs reduce capacidad de debug; es lo deseado en produccion. No romper la firma del middleware (debe seguir llamando next()). El override de res.json se elimina por completo; verificado que ninguna otra parte del codigo depende de capturedJsonResponse (no lo hace).

### ☐ P3-1 — Newsletter: capturar suscriptores reales (POST público con rate-limit)
- **Severidad:** mayor · **Dominio:** CONSTRUIR FEATURES HUÉRFANAS (P3) — cablear extremo a extremo tablas definidas pero nunca usadas
- **Hallazgo:** La página Newsletter ya tiene un formulario funcional que hace POST a /api/newsletter, pero ese endpoint NO EXISTE: apiRequest lanza error en respuestas no-2xx (queryClient.ts L22), así que cada suscripción al endpoint faltante devuelve 404→error→toast destructivo. La tabla newsletterSubscribers está definida en shared/schema.ts (L1256-1271) con email único (.notNull().unique()), name (NULLABLE, un solo campo), company, preferredLanguage (default 'es'), practiceInterests, isVerified, isActive — pero no hay método en storage.ts ni ruta en routes.ts (grep vacío, orphan total). El formulario envía { email, firstName, lastName } (NewsletterFormData L25-29) mientras la columna es 'name': hay que mapear firstName+lastName→name en el backend. Es el huérfano de mayor valor de demo porque la UI ya está lista y un cliente puede suscribirse en vivo.
- **Evidencia:** VERIFICADO. client/src/pages/Newsletter.tsx:70 `const response = await apiRequest("POST", "/api/newsletter", data);`; L25-29 interfaz NewsletterFormData { email; firstName?; lastName? }; L82-90 onError muestra toast destructivo. queryClient.ts:22 apiRequest llama throwIfResNotOk (lanza en !res.ok). shared/schema.ts:1256-1271 newsletterSubscribers con `name: text("name")` NULLABLE e insertNewsletterSubscriberSchema (L1269). grep en storage.ts y routes.ts de 'newsletterSubscribers'/'/api/newsletter' vacío. server/auth.ts:41 `checkRateLimit(identifier): { allowed; retryAfter? }` (solo CHEQUEA bloqueo, devuelve allowed:true si no hay entrada); server/auth.ts:75 `recordLoginAttempt(identifier, success)` es quien INCREMENTA/crea la entrada y bloquea tras MAX_ATTEMPTS=5; success=true BORRA la entrada. Ambos importados en routes.ts (L66-67) desde './auth'. routes.ts:630-668 patrón POST público /api/contact con sanitización, IP via IIFE x-forwarded-for||req.ip (L654-658) y try/catch — NOTA: /api/contact NO aplica rate-limit. routes.ts:53 importa SOLO `{ ZodError }` de 'zod'; `z` NO está importado. storage.ts:1 importa eq/desc/asc/and. DatabaseStorage cierra en L1191.
- **Archivos:** server/storage.ts, server/routes.ts, shared/schema.ts, client/src/pages/Newsletter.tsx, server/auth.ts

**Fix / prompt:**

```
En este proyecto Express+Drizzle, cablea de extremo a extremo la captura de suscriptores del newsletter usando la tabla `newsletterSubscribers` ya definida en shared/schema.ts (no la modifiques). Haz EXACTAMENTE esto:

1) En server/storage.ts: añade al import de '@shared/schema' los símbolos `newsletterSubscribers`, `type NewsletterSubscriber`, `type InsertNewsletterSubscriber`. En la interfaz `IStorage` (L91-271) añade las firmas:
   `createNewsletterSubscriber(data: InsertNewsletterSubscriber): Promise<NewsletterSubscriber>;`
   `getNewsletterSubscriberByEmail(email: string): Promise<NewsletterSubscriber | undefined>;`
   `getNewsletterSubscribers(): Promise<NewsletterSubscriber[]>;`
   Y en la clase `DatabaseStorage` (antes del `}` de cierre en ~L1191, junto a los demás métodos) implementa (eq y desc YA están importados en storage.ts L1):
   - getNewsletterSubscriberByEmail: `const [s] = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, email)); return s;`
   - createNewsletterSubscriber: `const [s] = await db.insert(newsletterSubscribers).values(data).returning(); return s;`
   - getNewsletterSubscribers: `return db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.subscribedAt));`

2) En server/routes.ts, dentro de `registerRoutes`, junto a la ruta pública `app.post("/api/contact", ...)` (~L630), añade un endpoint PÚBLICO con rate-limit. IMPORTANTE: el rate-limit de este proyecto es de DOS partes — `checkRateLimit(id)` solo verifica si la IP YA está bloqueada (devuelve allowed:true si no hay historial), y `recordLoginAttempt(id,false)` es el que INCREMENTA el contador y bloquea tras 5 intentos. Por eso debes llamar AMBOS. `checkRateLimit` y `recordLoginAttempt` YA están importados en routes.ts (L66-67) desde './auth'. NO importes `z` (no está disponible: routes.ts solo importa ZodError); valida el email con regex.
   `app.post("/api/newsletter", async (req, res) => {
     try {
       const fwd = req.headers["x-forwarded-for"]; const raw = Array.isArray(fwd)?fwd[0]:fwd; const ip = raw?.split(",")[0]?.trim() || req.ip || "unknown";
       const rateId = 'newsletter:' + ip;
       const rateCheck = checkRateLimit(rateId);
       if (!rateCheck.allowed) return res.status(429).json({ error: 'Too many requests', retryAfter: rateCheck.retryAfter });
       const body = req.body || {};
       const emailRaw = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
       const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw);
       if (!emailOk) { recordLoginAttempt(rateId, false); return res.status(400).json({ error: 'Validation failed' }); }
       const first = typeof body.firstName === 'string' ? body.firstName.trim() : '';
       const last = typeof body.lastName === 'string' ? body.lastName.trim() : '';
       const name = [first, last].filter(Boolean).join(' ') || null;
       const preferredLanguage = typeof body.preferredLanguage === 'string' ? body.preferredLanguage : 'es';
       const existing = await storage.getNewsletterSubscriberByEmail(emailRaw);
       if (existing) { recordLoginAttempt(rateId, false); return res.json({ success: true, message: 'Already subscribed' }); }
       await storage.createNewsletterSubscriber({ email: emailRaw, name, preferredLanguage });
       recordLoginAttempt(rateId, false); // cuenta el POST contra el límite; NO uses success=true (borraría el historial)
       return res.json({ success: true, message: 'Subscribed successfully' });
     } catch (error) { console.error('Newsletter error:', error); return res.status(500).json({ error: 'Failed to subscribe' }); }
   });`
   (El prefijo 'newsletter:' en el id evita colisionar con los intentos de login que usan la IP cruda.)

3) Añade un endpoint ADMIN para listar suscriptores (lectura protegida), junto a otras rutas admin (mismo patrón que /api/admin/team, authMiddleware y requireRole ya importados):
   `app.get("/api/admin/newsletter-subscribers", authMiddleware, requireRole("editor", "admin"), async (_req, res) => { try { const subs = await storage.getNewsletterSubscribers(); res.json(subs); } catch { res.status(500).json({ error: 'Failed to fetch subscribers' }); } });`

4) NO toques client/src/pages/Newsletter.tsx: el formulario ya envía { email, firstName, lastName } y muestra el toast de éxito; el backend ahora lo soporta.

Corre `npm run db:push` para crear la tabla newsletter_subscribers y reinicia el servidor.
```

- **Aceptación:** curl -s -X POST http://localhost:5000/api/newsletter -H 'Content-Type: application/json' -d '{"email":"demo@example.com","firstName":"Ana","lastName":"Lopez"}' devuelve {"success":true,"message":"Subscribed successfully"}. Repetir el mismo POST devuelve {"success":true,"message":"Already subscribed"} (no error de email único). En la app, abrir /newsletter, enviar el form y ver el toast de éxito (no el destructivo). curl con email inválido devuelve 400. Enviar 6+ POST rápidos desde la misma IP (límite real = 5 intentos por la config MAX_ATTEMPTS) eventualmente devuelve 429 con retryAfter. GET /api/admin/newsletter-subscribers sin token devuelve 401; con token de editor/admin devuelve la lista incluyendo el suscriptor demo (name='Ana Lopez').
- **Riesgo / cuidado:** BUG CORREGIDO vs versión original: el rate-limit NO funciona si solo llamas checkRateLimit — debes llamar recordLoginAttempt(rateId,false) para incrementar el contador (checkRateLimit devuelve allowed:true mientras no exista entrada en el Map). NO uses recordLoginAttempt(rateId,true) en éxito: borraría el historial y reiniciaría el límite. El umbral real es MAX_ATTEMPTS=5 (no 10). NO importes `z` en la validación: routes.ts NO importa `z`, solo ZodError — usa el regex de email indicado o fallará la compilación. No alterar la columna `name` del schema (es nullable, un solo campo): el backend mapea firstName+lastName→name. El constraint UNIQUE en email se evita con getNewsletterSubscriberByEmail ANTES de insertar. checkRateLimit usa un Map en memoria compartido con login; el prefijo 'newsletter:' evita colisión.

### ☐ P3-2 — Pro Bono: tabla proBonoProjects cableada y sección dinámica en la página
- **Severidad:** mayor · **Dominio:** CONSTRUIR FEATURES HUÉRFANAS (P3) — cablear extremo a extremo tablas definidas pero nunca usadas
- **Hallazgo:** La página ProBono.tsx renderiza TODO desde objetos `content` hardcodeados (en/es/de/fr) y no consulta ninguna API. La tabla proBonoProjects (shared/schema.ts L1135-1157) con title/titleEs, organization/organizationEs, description/descriptionEs, impact/impactEs, year, category/categoryEs, isFeatured, published (default true), order está completamente huérfana: sin método en storage, sin ruta, sin seed. Es una tabla de contenido AUTÓNOMA (sin FKs). Para hacerla feature real hay que crear GET público + CRUD admin + seed con proyectos reales y agregar una sección 'Proyectos Destacados' alimentada por la API, manteniendo el contenido estático como fallback/encabezados.
- **Evidencia:** VERIFICADO. client/src/pages/ProBono.tsx:802 `const t = content[language as keyof typeof content] || content.en;` único hook de contenido; grep useQuery/fetch/apiRequest vacío. shared/schema.ts:1135-1157 proBonoProjects e insertProBonoProjectSchema (L1155); sin .references()/FK (tabla autónoma). grep 'proBonoProjects'/'pro-bono' en storage.ts y routes.ts vacío. Patrón GET público con Cache-Control 'public, max-age=60' en routes.ts:502-510 (/api/practice-groups). Patrón seed idempotente (chequeo length===0 + db.insert) en seed.ts ~L1159-1162; registerRoutes llama `await seed()` en routes.ts:179. El default queryFn de react-query hace queryKey.join('/') (queryClient.ts:32) así que useQuery({queryKey:['/api/pro-bono']}) basta sin queryFn. CRUD admin con authMiddleware+requireRole('editor','admin')+insertXSchema.parse en routes.ts:1571+ (team). ZodError importado en routes.ts:53.
- **Archivos:** server/storage.ts, server/routes.ts, server/seed.ts, shared/schema.ts, client/src/pages/ProBono.tsx

**Fix / prompt:**

```
Cablea de extremo a extremo la feature Pro Bono usando la tabla `proBonoProjects` ya definida en shared/schema.ts (no modifiques el schema). NOTA: esta tabla es de contenido autónomo, NO tiene FKs ni depende de ningún otro lote; `npm run db:push` la crea directamente. Haz esto:

1) server/storage.ts: añade al import de '@shared/schema' `proBonoProjects`, `type ProBonoProject`, `type InsertProBonoProject`. En `IStorage` (L91-271) agrega:
   `getProBonoProjects(): Promise<ProBonoProject[]>;`
   `getProBonoProjectById(id: string): Promise<ProBonoProject | undefined>;`
   `createProBonoProject(p: InsertProBonoProject): Promise<ProBonoProject>;`
   `updateProBonoProject(id: string, p: Partial<InsertProBonoProject>): Promise<ProBonoProject | undefined>;`
   `deleteProBonoProject(id: string): Promise<boolean>;`
   Impleméntalos en `DatabaseStorage` (antes del cierre ~L1191) siguiendo el patrón de getRankings/createRanking (storage.ts:760-782). getProBonoProjects devuelve TODOS ordenados por `asc(proBonoProjects.order)` (el filtro published se hace en la ruta pública, no aquí). asc/eq ya están importados (storage.ts L1).

2) server/routes.ts: importa `insertProBonoProjectSchema` desde '@shared/schema' (junto a los otros insert*Schema en L35-51). Añade:
   - Ruta PÚBLICA: `app.get("/api/pro-bono", async (_req, res) => { try { const all = await storage.getProBonoProjects(); const pub = all.filter(p => p.published); res.set('Cache-Control','public, max-age=60'); res.json(pub); } catch { res.status(500).json({ error: 'Failed to fetch pro bono projects' }); } });`
   - CRUD ADMIN protegido con `authMiddleware, requireRole("editor", "admin")` (mismo patrón que /api/admin/team en routes.ts L1571-1601, con try/catch y `if (error instanceof ZodError) return ...400` — ZodError ya está importado): POST /api/admin/pro-bono (valida con `insertProBonoProjectSchema.parse(req.body)`), PUT /api/admin/pro-bono/:id (usa `.partial().parse`), DELETE /api/admin/pro-bono/:id, y GET /api/admin/pro-bono (lista completa incluyendo no publicados).

3) server/seed.ts: añade `proBonoProjects` al import de '@shared/schema' (L3). Define un array `proBonoProjectsData` con 4 proyectos REALES y bilingües (title/titleEs, organization/organizationEs, description/descriptionEs, impact/impactEs, year, category/categoryEs, isFeatured, order). Contenido coherente con la firma mexicana: 'Asesoría a organizaciones de la sociedad civil', 'Defensa de derechos humanos', 'Acceso a la justicia para comunidades vulnerables', 'Apoyo legal a fundaciones y empresas sociales'. Dentro de la función `seed()` (seed.ts:1156), siguiendo el patrón idempotente existente: `const existingProBono = await db.select().from(proBonoProjects); if (existingProBono.length === 0) { console.log('Seeding pro bono projects...'); await db.insert(proBonoProjects).values(proBonoProjectsData); }`.

4) client/src/pages/ProBono.tsx: NO borres el contenido estático. Importa `useQuery` de '@tanstack/react-query' (si no está) y añade dentro del componente: `const { data: projects } = useQuery<any[]>({ queryKey: ['/api/pro-bono'] });` (el default queryFn ya resuelve la URL desde el queryKey). Agrega una nueva sección 'Proyectos Destacados' / 'Featured Projects' que renderice `projects` en tarjetas (title con titleEs cuando language==='es', organization, description, impact, year, category) usando los mismos componentes Card/estilos de la página. Coloca la sección antes del bloque CTA final. Si `projects` está vacío o undefined, no renderices la sección (deja el contenido estático intacto).

Corre `npm run db:push` y reinicia para que seed() inserte los proyectos.
```

- **Aceptación:** curl -s http://localhost:5000/api/pro-bono devuelve un array con 4 proyectos reales (title, descriptionEs, impact, year, published=true). En /pro-bono se ve una nueva sección 'Proyectos Destacados' con esas 4 tarjetas; cambiar idioma a ES muestra titleEs/descriptionEs. POST /api/admin/pro-bono sin token devuelve 401. Crear un proyecto vía admin con published=true y luego GET /api/pro-bono lo incluye. El contenido estático previo de la página sigue visible.
- **Riesgo / cuidado:** CORREGIDO vs original: eliminada la falsa precondición 'ASUME que el lote P1 de FKs corrió' — proBonoProjects NO tiene FKs (verificado, sin .references()), db:push la crea sola; no esperes ningún prerrequisito. El seed corre en cada arranque dentro de registerRoutes; el chequeo `length === 0` lo hace idempotente — no dupliques el bloque ni quites el chequeo. La ruta pública debe filtrar published para no exponer borradores. getProBonoProjects devuelve la lista completa (la usa la ruta admin); el filtro published vive en la ruta pública.

### ☐ P3-3 — Diversity & Inclusion: tabla diversityInitiatives cableada y sección dinámica
- **Severidad:** mayor · **Dominio:** CONSTRUIR FEATURES HUÉRFANAS (P3) — cablear extremo a extremo tablas definidas pero nunca usadas
- **Hallazgo:** DiversityInclusion.tsx es 100% contenido hardcodeado por idioma; cada objeto de idioma incluye un array `initiatives` ({icon, title, text}) estático. La tabla diversityInitiatives (shared/schema.ts L1163-1183) con title/titleEs, description/descriptionEs, category (gender/disability/lgbtq/age/culture), categoryEs, impact/impactEs, year, isFeatured, published (default true), order está huérfana sin storage/ruta/seed, y es de contenido AUTÓNOMO (sin FKs). Igual que ProBono: crear GET público + CRUD admin + seed real y una sección de iniciativas alimentada por la API con fallback estático.
- **Evidencia:** VERIFICADO. client/src/pages/DiversityInclusion.tsx:46-67 array `initiatives` hardcodeado ANIDADO dentro del objeto content.en (objetos {icon, title, text}); se accede como `t.initiatives` (no variable top-level). Iconos importados como componentes: UserCheck, BarChart3, Sparkles, GraduationCap. grep useQuery/fetch/api en el archivo vacío. shared/schema.ts:1163-1183 diversityInitiatives e insertDiversityInitiativeSchema (L1181); sin .references()/FK. storage.ts/routes.ts no la referencian. Patrón GET público: routes.ts:528-536 (/api/industry-groups, con Cache-Control). Patrón seed idempotente: seed.ts ~L1177-1180. default queryFn join('/'): queryClient.ts:32.
- **Archivos:** server/storage.ts, server/routes.ts, server/seed.ts, shared/schema.ts, client/src/pages/DiversityInclusion.tsx

**Fix / prompt:**

```
Cablea de extremo a extremo la feature Diversidad e Inclusión con la tabla `diversityInitiatives` ya definida en shared/schema.ts (no la modifiques). NOTA: tabla de contenido autónomo, SIN FKs ni dependencias de otros lotes; `npm run db:push` la crea directamente. Haz esto:

1) server/storage.ts: añade al import `diversityInitiatives`, `type DiversityInitiative`, `type InsertDiversityInitiative`. En `IStorage` agrega getDiversityInitiatives, getDiversityInitiativeById, createDiversityInitiative, updateDiversityInitiative, deleteDiversityInitiative (mismas firmas que el patrón Pro Bono/rankings). Impleméntalos en `DatabaseStorage` copiando el patrón de getRankings (storage.ts:760-782), getDiversityInitiatives ordena por `asc(diversityInitiatives.order)` y devuelve TODOS (el filtro published vive en la ruta pública).

2) server/routes.ts: importa `insertDiversityInitiativeSchema` (junto a los insert*Schema en L35-51). Añade ruta PÚBLICA `app.get("/api/diversity", async (_req,res) => { try { const all = await storage.getDiversityInitiatives(); res.set('Cache-Control','public, max-age=60'); res.json(all.filter(i => i.published)); } catch { res.status(500).json({ error: 'Failed to fetch diversity initiatives' }); } });`. Añade CRUD admin protegido con `authMiddleware, requireRole("editor", "admin")` (patrón team L1571, con `if (error instanceof ZodError)`): POST /api/admin/diversity (`insertDiversityInitiativeSchema.parse`), PUT /api/admin/diversity/:id (`.partial().parse`), DELETE /api/admin/diversity/:id, GET /api/admin/diversity (lista completa).

3) server/seed.ts: añade `diversityInitiatives` al import (L3). Define `diversityInitiativesData` con 4-5 iniciativas REALES bilingües: 'Contratación Inclusiva' (category 'culture'), 'Igualdad de Género' (category 'gender'), 'Igualdad de Oportunidades', 'Programas de Mentoría', y opcionalmente una LGBTQ+ (category 'lgbtq'). Cada una con title/titleEs, description/descriptionEs, impact/impactEs, year, isFeatured, order. Reaprovecha los textos del array por idioma `t.initiatives` (DiversityInclusion.tsx L46-67, propiedades title y text) como base de description. En `seed()` añade el bloque idempotente: `const existingDiv = await db.select().from(diversityInitiatives); if (existingDiv.length === 0) { console.log('Seeding diversity initiatives...'); await db.insert(diversityInitiatives).values(diversityInitiativesData); }`.

4) client/src/pages/DiversityInclusion.tsx: NO borres el contenido estático. Importa useQuery y añade `const { data: initiativesDb } = useQuery<any[]>({ queryKey: ['/api/diversity'] });`. Reemplaza SOLO la fuente del bloque de iniciativas que hoy mapea `t.initiatives`: si `initiativesDb` tiene datos (length>0), renderiza esas tarjetas (title con titleEs cuando es ES, description, category como badge, impact, year) usando los mismos estilos/Card del bloque actual; si está vacío o undefined, conserva el array estático `t.initiatives` como fallback. Para las tarjetas dinámicas usa un icono genérico ya importado (Sparkles), ya que la DB no almacena icono.

Corre `npm run db:push` y reinicia.
```

- **Aceptación:** curl -s http://localhost:5000/api/diversity devuelve un array de iniciativas con title, descriptionEs, category, published=true. En /diversity-inclusion la sección de iniciativas se alimenta de la API y muestra badges de category; al cambiar a ES aparece titleEs. POST /api/admin/diversity sin token = 401. El resto de la página (stats, pro bono, etc.) intacto.
- **Riesgo / cuidado:** CORREGIDO: el array NO es una variable top-level `initiatives`, es `t.initiatives` (anidado por idioma, L46-67) — referénciate a él correctamente como fallback. Eliminada la falsa precondición de lote P1: diversityInitiatives no tiene FKs. No elimines el fallback estático: si la query falla en producción la sección quedaría vacía. Mantén el chequeo length===0 en seed para idempotencia. Las categorías (gender/disability/lgbtq/age/culture) son texto libre en el schema; sé consistente para que el badge se vea uniforme. Sparkles ya está importado en el archivo.

### ☐ P3-4 — Rankings/Awards de team members: join tables teamMemberRankings y teamMemberAwards
- **Severidad:** menor · **Dominio:** CONSTRUIR FEATURES HUÉRFANAS (P3) — cablear extremo a extremo tablas definidas pero nunca usadas
- **Hallazgo:** Las tablas firma `rankings` y `awards` SÍ están cableadas (storage.ts L760-806 CRUD completo). Pero las join tables `teamMemberRankings` (schema L911-915) y `teamMemberAwards` (L917-921) que vinculan un abogado con rankings/awards de firma están huérfanas. La página TeamMemberDetail YA muestra rankings/awards de cada abogado leyendo la columna JSONB `teamMembers.rankings` (schema L210, tipo Ranking[] — un tipo distinto de FirmRanking), NO estas join tables. Por eso es de menor severidad: el modelo normalizado es una alternativa redundante. Para darle valor sin duplicar, cablea las join tables como capa 'reconocimientos de firma asociados a un abogado' y expón un endpoint que devuelva, por team member, los rankings/awards de firma vinculados. IMPORTANTE: la tabla firma `rankings`/`awards` NO tiene seed (estará vacía al arrancar), así que los vínculos no se pueden sembrar y deben crearse vía admin.
- **Evidencia:** VERIFICADO. shared/schema.ts:911-921 teamMemberRankings y teamMemberAwards (solo teamMemberId + rankingId/awardId, SIN insertSchema generado). storage.ts:760-806 implementa rankings/awards CRUD; `rankings` y `awards` YA importados en storage.ts (L81-82). client/src/pages/TeamMemberDetail.tsx:227-297 y L1114 renderiza rankings desde `member.rankings` (JSONB) y `ranking.publication`/`ranking.rankingEs`, NO desde join tables. shared/schema.ts:210 `rankings: jsonb("rankings").$type<Ranking[]>()`; schema.ts:31 `interface Ranking` (distinto de FirmRanking L885). routes.ts ya tiene /api/team (L554), /api/team/:idOrSlug (L574), /api/team/:idOrSlug/vcard (L590), /api/team/:slug/news (L616) — añadir /api/team/:id/rankings no colisiona (Express matchea la ruta completa). NO hay seed de la tabla firma `rankings`/`awards` (las coincidencias 'rankings' en seed.ts son keys del JSONB de teamMembers en L314/L636 y categoría de news L799/L812, NO la tabla). `and`/`eq` importados en storage.ts L1. NO existe ningún innerJoin en storage.ts (patrón nuevo).
- **Archivos:** server/storage.ts, server/routes.ts, server/seed.ts, shared/schema.ts, client/src/pages/TeamMemberDetail.tsx

**Fix / prompt:**

```
Cablea las join tables `teamMemberRankings` y `teamMemberAwards` (shared/schema.ts L911-921) para asociar reconocimientos de FIRMA (tablas `rankings` y `awards`, que ya tienen CRUD en storage.ts L760-806) a abogados individuales. NO toques la columna JSONB `teamMembers.rankings` ni la página TeamMemberDetail (sigue mostrando los rankings personales del JSONB, que usan el tipo `Ranking`, distinto de `FirmRanking`). Esto añade una capa adicional. Haz esto:

1) server/storage.ts: añade al import `teamMemberRankings`, `teamMemberAwards` (rankings, awards, FirmRanking y Award YA están importados; solo agrega las join tables). En `IStorage` añade:
   `getRankingsByTeamMember(teamMemberId: string): Promise<FirmRanking[]>;`
   `getAwardsByTeamMember(teamMemberId: string): Promise<Award[]>;`
   `linkRankingToTeamMember(teamMemberId: string, rankingId: string): Promise<void>;`
   `unlinkRankingFromTeamMember(teamMemberId: string, rankingId: string): Promise<void>;`
   `linkAwardToTeamMember(teamMemberId: string, awardId: string): Promise<void>;`
   `unlinkAwardFromTeamMember(teamMemberId: string, awardId: string): Promise<void>;`
   Impleméntalos en DatabaseStorage. ATENCIÓN al shape del join: `db.select().from(teamMemberRankings).innerJoin(rankings, eq(teamMemberRankings.rankingId, rankings.id)).where(eq(teamMemberRankings.teamMemberId, teamMemberId))` NO devuelve un FirmRanking[] plano — devuelve filas con forma `{ team_member_rankings: {...}, rankings: {...} }`. Por eso debes mapear: `const rows = await db.select()...; return rows.map(r => r.rankings);`. Para link: `await db.insert(teamMemberRankings).values({ teamMemberId, rankingId });`. Para unlink: `await db.delete(teamMemberRankings).where(and(eq(teamMemberRankings.teamMemberId, teamMemberId), eq(teamMemberRankings.rankingId, rankingId)));`. Análogo para awards (innerJoin con `awards`, mapea `r.awards`). `and`/`eq` ya importados (storage.ts L1).

2) server/routes.ts: añade rutas PÚBLICAS de lectura (no colisionan con /api/team/:idOrSlug porque la ruta incluye el sufijo /rankings):
   `app.get("/api/team/:id/rankings", async (req,res) => { try { const r = await storage.getRankingsByTeamMember(req.params.id); res.json(r); } catch { res.status(500).json({ error: 'Failed' }); } });`
   `app.get("/api/team/:id/awards", async (req,res) => { try { const a = await storage.getAwardsByTeamMember(req.params.id); res.json(a); } catch { res.status(500).json({ error: 'Failed' }); } });`
   Y rutas ADMIN protegidas con `authMiddleware, requireRole("editor","admin")` para vincular/desvincular: POST /api/admin/team/:id/rankings (body { rankingId }), DELETE /api/admin/team/:id/rankings/:rankingId, y equivalentes para awards.

3) server/seed.ts: NO siembres vínculos. La tabla firma `rankings`/`awards` NO tiene seed (está vacía al arrancar), así que cualquier vínculo sembrado generaría FK colgante. Como salvaguarda, si quisieras añadir lógica condicional, primero verifica `(await db.select().from(rankings)).length === 0` y en ese caso solo haz un console.log indicando que se omiten los vínculos por falta de rankings. NO inventes IDs.

4) NO modifiques client/src/pages/TeamMemberDetail.tsx en este lote (los rankings personales del JSONB siguen igual). El cableado deja los endpoints listos para que un lote de UI posterior los consuma.

Corre `npm run db:push` y reinicia.
```

- **Aceptación:** GET /api/team/:id/rankings y /api/team/:id/awards devuelven [] (vacío) sin error cuando no hay vínculos. PRECONDICIÓN: como la tabla firma `rankings` no tiene seed, primero crea un ranking vía POST /api/admin/rankings (CRUD ya existente, con token admin) y copia su id. Luego POST /api/admin/team/:id/rankings (con token admin) con ese rankingId crea el vínculo y el GET público /api/team/:id/rankings devuelve ese ranking (objeto FirmRanking plano, no anidado). POST sin token = 401. La página TeamMemberDetail sigue mostrando los rankings del JSONB sin cambios.
- **Riesgo / cuidado:** teamMemberRankings/teamMemberAwards NO tienen insertSchema generado en el schema; inserta objetos planos { teamMemberId, rankingId }. CORREGIDO: el innerJoin NO devuelve un array plano de rankings — devuelve filas `{ team_member_rankings, rankings }`; mapea `.map(r => r.rankings)` o el endpoint devolverá objetos anidados y el criterio de aceptación fallará. No hay innerJoin previo en el código (patrón nuevo). Riesgo de FK: solo vincula IDs que existan en rankings/awards y team_members; por eso no se siembran vínculos (la tabla firma rankings está vacía sin seed). No dupliques la lógica del JSONB: son dos modelos distintos (Ranking vs FirmRanking) coexistiendo. `and` ya está importado en storage.ts L1.

### ☐ P3-5 — FAQs: tabla faqs cableada con GET público + CRUD admin + seed
- **Severidad:** menor · **Dominio:** CONSTRUIR FEATURES HUÉRFANAS (P3) — cablear extremo a extremo tablas definidas pero nunca usadas
- **Hallazgo:** La tabla faqs (shared/schema.ts L1189-1204: question/questionEs, answer/answerEs, category/categoryEs, published default true, order) está totalmente huérfana y NO hay ningún consumidor en el frontend (grep 'faq' en client/src no devuelve archivos). Es backend puro sin UI. Valor de demo medio: exponer GET público + CRUD admin + seed con FAQs reales para que el endpoint sea consultable, dejando opcionalmente lista la incorporación de una sección de FAQs en la página Contact.
- **Evidencia:** VERIFICADO. shared/schema.ts:1189-1204 faqs e insertFaqSchema (L1202). grep 'faqs'/'faq' en server/storage.ts, server/routes.ts y client/src: sin resultados (orphan total, sin consumidor). Patrón GET público con Cache-Control: routes.ts:502 (/api/practice-groups). Patrón seed idempotente: seed.ts ~L1171-1174. ZodError importado routes.ts:53. insert*Schema importados en routes.ts L35-51. Contact.tsx existe (48KB).
- **Archivos:** server/storage.ts, server/routes.ts, server/seed.ts, shared/schema.ts, client/src/pages/Contact.tsx

**Fix / prompt:**

```
Cablea la feature FAQs con la tabla `faqs` ya definida en shared/schema.ts (no la modifiques). Haz esto:

1) server/storage.ts: añade al import `faqs`, `type Faq`, `type InsertFaq`. En `IStorage`: getFaqs, getFaqById, createFaq, updateFaq, deleteFaq (mismo patrón que rankings storage.ts:760-782). Implementa en DatabaseStorage; getFaqs ordena por `asc(faqs.order)` y devuelve todos (el filtro published vive en la ruta pública).

2) server/routes.ts: importa `insertFaqSchema` (junto a los insert*Schema L35-51). Añade ruta PÚBLICA `app.get("/api/faqs", async (_req,res) => { try { const all = await storage.getFaqs(); res.set('Cache-Control','public, max-age=60'); res.json(all.filter(f => f.published)); } catch { res.status(500).json({ error: 'Failed to fetch faqs' }); } });`. Añade CRUD admin con `authMiddleware, requireRole("editor","admin")` (patrón team L1571, con `if (error instanceof ZodError)`): POST /api/admin/faqs (`insertFaqSchema.parse`), PUT /api/admin/faqs/:id (`.partial().parse`), DELETE /api/admin/faqs/:id, GET /api/admin/faqs.

3) server/seed.ts: añade `faqs` al import (L3). Define `faqsData` con 6 FAQs REALES bilingües de un despacho legal mexicano (p.ej.: '¿En qué áreas del derecho se especializa la firma?', '¿Atienden clientes internacionales?', '¿Cómo solicito una consulta?', '¿Tienen oficinas fuera de la Ciudad de México?', '¿Ofrecen servicios pro bono?', '¿En qué idiomas atienden?'), cada una con question/questionEs, answer/answerEs, category/categoryEs, order. En `seed()` añade el bloque idempotente: `const existingFaqs = await db.select().from(faqs); if (existingFaqs.length === 0) { console.log('Seeding faqs...'); await db.insert(faqs).values(faqsData); }`.

4) (Opcional, solo si es trivial) En client/src/pages/Contact.tsx añade una sección 'Preguntas Frecuentes' que haga `useQuery({ queryKey: ['/api/faqs'] })` (el default queryFn resuelve la URL) y renderice un acordeón simple. Si la página es grande o riesgosa, OMITE este paso 4 y deja solo el backend cableado.

Corre `npm run db:push` y reinicia.
```

- **Aceptación:** curl -s http://localhost:5000/api/faqs devuelve 6 FAQs con question, answerEs, category, published=true. POST /api/admin/faqs sin token = 401; con token admin crea una FAQ y aparece en el GET (si published=true). Si se implementó el paso 4, /contact muestra el acordeón de FAQs.
- **Riesgo / cuidado:** Como no hay consumidor previo, el paso 4 es el único con riesgo de UI; trátalo como opcional para no romper Contact.tsx (48KB). Mantén la idempotencia del seed (length===0). La ruta pública debe filtrar published. La tabla faqs no tiene FKs ni dependencias; db:push la crea directamente.

### ☐ P3-6 — siteConfig y banners: cablear key-value y banners con GET público + CRUD admin + seed
- **Severidad:** menor · **Dominio:** CONSTRUIR FEATURES HUÉRFANAS (P3) — cablear extremo a extremo tablas definidas pero nunca usadas
- **Hallazgo:** siteConfig (shared/schema.ts L1210-1223: key único, value/valueEs, type default 'text', category default 'general') y banners (L1229-1250: title/titleEs, subtitle, imageUrl, linkUrl/linkText, position default 'hero' hero/sidebar/popup/footer, startDate/endDate, published default true, order) están huérfanas: sin storage, sin ruta, sin seed, sin consumidor real (los 'Banner' del client son CookieBanner.tsx/ExperienceBanner.tsx estáticos, no DB-driven; no hay /api/site-config ni /api/banners). Features de infraestructura de bajo valor de demo inmediato, pero cablearlas deja el admin capaz de editar config global y promociones. Se agrupan por ser ambas key/config-like.
- **Evidencia:** VERIFICADO. shared/schema.ts:1210-1250 siteConfig (key .notNull().unique()) y banners con insertSiteConfigSchema (L1221) e insertBannerSchema (L1248). grep en storage.ts/routes.ts de 'siteConfig'/'banners' vacío. grep '/api/site-config'/'siteConfig'/'/api/banners' en client/src vacío. CookieBanner.tsx y ExperienceBanner.tsx existen en client/src/components (componentes estáticos). Patrón seed idempotente: seed.ts ~L1159-1163. NOTA: `onConflictDoUpdate` NO se usa en ningún sitio del código (solo `onConflictDoNothing` en seed.ts L1212) — es sintaxis Drizzle válida pero patrón nuevo aquí.
- **Archivos:** server/storage.ts, server/routes.ts, server/seed.ts, shared/schema.ts

**Fix / prompt:**

```
Cablea siteConfig y banners (ambas en shared/schema.ts, no las modifiques; ninguna tiene FKs, db:push las crea). Haz esto:

A) siteConfig (key-value bilingüe):
1) server/storage.ts: importa `siteConfig`, `type SiteConfig`, `type InsertSiteConfig`. En IStorage: `getSiteConfig(): Promise<SiteConfig[]>;`, `getSiteConfigByKey(key: string): Promise<SiteConfig | undefined>;`, `upsertSiteConfig(c: InsertSiteConfig): Promise<SiteConfig>;`, `deleteSiteConfig(key: string): Promise<boolean>;`. Implementa upsert con `const [row] = await db.insert(siteConfig).values(c).onConflictDoUpdate({ target: siteConfig.key, set: { value: c.value, valueEs: c.valueEs, updatedAt: new Date() } }).returning(); return row;` (onConflictDoUpdate es sintaxis Drizzle válida aunque no se use en otro sitio del repo; importa `desc`/`eq` ya disponibles en storage.ts L1).
2) server/routes.ts: importa `insertSiteConfigSchema`. Ruta PÚBLICA `app.get("/api/site-config", ...)` devuelve todos los registros con `res.set('Cache-Control','public, max-age=60')` y try/catch→500. Rutas admin con `authMiddleware, requireRole("admin")` (SOLO admin, no editor): PUT /api/admin/site-config (upsert con `insertSiteConfigSchema.parse(req.body)`, con `if (error instanceof ZodError)`), DELETE /api/admin/site-config/:key.
3) server/seed.ts: importa `siteConfig`. Define `siteConfigData` con 4-5 pares reales: contact_email ('info@vonwobeser.com'), contact_phone ('+52 55 5258 1000'), office_address (Torre SOMA Chapultepec Piso 18, Campos Elíseos 204, Polanco), linkedin_url, etc. (type 'text'/'url', category 'general'/'contact'). Bloque idempotente: `const existingConfig = await db.select().from(siteConfig); if (existingConfig.length === 0) { console.log('Seeding site config...'); await db.insert(siteConfig).values(siteConfigData); }`.

B) banners:
1) server/storage.ts: importa `banners`, `type Banner`, `type InsertBanner`. En IStorage: getBanners, getActiveBanners(position?: string), createBanner, updateBanner, deleteBanner. getActiveBanners filtra `published===true` y, si se pasa position, también por position; ordena por `asc(banners.order)`.
2) server/routes.ts: importa `insertBannerSchema`. Ruta PÚBLICA `app.get("/api/banners", ...)` con query opcional ?position= que llama getActiveBanners(req.query.position as string|undefined), Cache-Control, try/catch→500. CRUD admin con `authMiddleware, requireRole("editor","admin")`: POST/PUT/DELETE /api/admin/banners (valida con insertBannerSchema).
3) server/seed.ts: NO siembres banners por defecto (son promociones efímeras); deja la tabla vacía. Opcional: un banner de ejemplo position 'hero' published=false para demostrar el admin (bloque idempotente con length===0).

NO conectes ningún componente del frontend a estas tablas en este lote (CookieBanner/ExperienceBanner siguen estáticos). Corre `npm run db:push` y reinicia.
```

- **Aceptación:** curl -s http://localhost:5000/api/site-config devuelve los pares sembrados (contact_email, contact_phone, office_address). curl -s http://localhost:5000/api/banners devuelve [] (sin banners publicados). PUT /api/admin/site-config sin token = 401; con token admin (rol admin, no editor) hace upsert de un valor y el GET lo refleja. PUT con token de rol 'editor' debe devolver 403 (la ruta exige requireRole('admin')). POST /api/admin/banners con token crea un banner; si published=true aparece en /api/banners.
- **Riesgo / cuidado:** siteConfig.key tiene UNIQUE: usa onConflictDoUpdate (upsert), NO insert plano, para no fallar al re-guardar una key — es sintaxis Drizzle válida aunque sea patrón nuevo en este repo (verificado: solo existe onConflictDoNothing previamente). No conectes el frontend a banners/siteConfig en este lote para no alterar el layout actual. La ruta admin de site-config usa requireRole('admin') (más restrictiva que editor) porque afecta config global; verifica que un editor reciba 403 ahí. Ninguna de las dos tablas tiene FKs.

### ☐ P3-7 — legalDocuments: cablear documentos legales versionados (GET público por tipo + CRUD admin)
- **Severidad:** menor · **Dominio:** CONSTRUIR FEATURES HUÉRFANAS (P3) — cablear extremo a extremo tablas definidas pero nunca usadas
- **Hallazgo:** La tabla legalDocuments (shared/schema.ts L1277-1293: type privacy_policy/terms_of_use/cookie_policy/disclaimer, title/titleEs, content/contentEs, version default '1.0', effectiveDate default now, published default true) está huérfana. Hoy PrivacyPolicy.tsx (132KB) y Terms.tsx (135KB) renderizan texto hardcodeado, sin consumir esta tabla. Es la huérfana de menor prioridad de demo porque las páginas legales ya funcionan estáticas; cablear la tabla permite gestionar versiones desde el admin sin redeploy. Solo backend + endpoint, sin migrar el contenido gigante en este lote.
- **Evidencia:** VERIFICADO. shared/schema.ts:1277-1293 legalDocuments, insertLegalDocumentSchema (L1291) y legalDocumentTypes (L1295-1300, array const con privacy_policy/terms_of_use/cookie_policy/disclaimer). grep 'legalDocuments'/'/api/legal-documents' en storage.ts/routes.ts/client vacío. client/src/pages/PrivacyPolicy.tsx (132KB) y Terms.tsx (135KB) confirmados con contenido hardcodeado. Patrón CRUD admin: routes.ts:1117-1188 (posts) y team L1571+. desc/eq importados storage.ts L1. ZodError routes.ts:53.
- **Archivos:** server/storage.ts, server/routes.ts, server/seed.ts, shared/schema.ts, client/src/pages/PrivacyPolicy.tsx, client/src/pages/Terms.tsx

**Fix / prompt:**

```
Cablea legalDocuments (shared/schema.ts, no la modifiques; sin FKs, db:push la crea) como capa de gestión de documentos legales versionados, SIN migrar todavía el contenido estático de PrivacyPolicy.tsx/Terms.tsx. Haz esto:

1) server/storage.ts: importa `legalDocuments`, `type LegalDocument`, `type InsertLegalDocument`. En IStorage: `getLegalDocuments(): Promise<LegalDocument[]>;`, `getLegalDocumentByType(type: string): Promise<LegalDocument | undefined>;` (devuelve la versión published más reciente de ese type), createLegalDocument, updateLegalDocument, deleteLegalDocument. getLegalDocumentByType: `const [doc] = await db.select().from(legalDocuments).where(and(eq(legalDocuments.type, type), eq(legalDocuments.published, true))).orderBy(desc(legalDocuments.effectiveDate)); return doc;` (and/eq/desc ya importados storage.ts L1).

2) server/routes.ts: importa `insertLegalDocumentSchema` (y opcionalmente `legalDocumentTypes` para validar el type). Ruta PÚBLICA `app.get("/api/legal-documents/:type", async (req,res) => { ... })` que valida que `req.params.type` esté entre privacy_policy/terms_of_use/cookie_policy/disclaimer (si no, 400), busca el documento published de ese tipo (404 si no existe), con Cache-Control y try/catch→500. CRUD admin con `authMiddleware, requireRole("admin")` (solo admin): GET /api/admin/legal-documents (todos), POST /api/admin/legal-documents (`insertLegalDocumentSchema.parse`, con `if (error instanceof ZodError)`), PUT /api/admin/legal-documents/:id (`.partial().parse`), DELETE /api/admin/legal-documents/:id.

3) server/seed.ts: importa `legalDocuments`. Siembra 2 registros REALES mínimos como placeholder gestionable: type 'privacy_policy' (title 'Privacy Policy'/titleEs 'Aviso de Privacidad', content/contentEs con un resumen breve real de 2-3 párrafos — NO copies los 132KB, version '1.0') y type 'terms_of_use' (title 'Terms of Use'/'Términos de Uso'). Bloque idempotente: `const existingLegal = await db.select().from(legalDocuments); if (existingLegal.length === 0) { console.log('Seeding legal documents...'); await db.insert(legalDocuments).values(legalDocumentsData); }`.

4) NO modifiques PrivacyPolicy.tsx ni Terms.tsx en este lote: siguen sirviendo el contenido estático completo. El cableado deja el endpoint listo para una futura migración.

Corre `npm run db:push` y reinicia.
```

- **Aceptación:** curl -s http://localhost:5000/api/legal-documents/privacy_policy devuelve un documento con title 'Privacy Policy', contentEs y version '1.0'. curl con un type inválido (p.ej. /api/legal-documents/foo) devuelve 400. GET /api/admin/legal-documents sin token = 401; con token admin lista los 2 documentos. PUT con token de rol 'editor' devuelve 403 (la ruta exige requireRole('admin')). Las páginas /privacy-policy y /terms siguen mostrando su contenido estático sin cambios.
- **Riesgo / cuidado:** No intentes migrar el contenido de 132KB/135KB de las páginas legales aquí: el seed usa un resumen breve a propósito (content es .notNull() en el schema, así que sí debes proporcionar texto). Valida el :type contra la lista legalDocumentTypes (schema L1295) para no exponer queries arbitrarias. requireRole('admin') porque son documentos jurídicos sensibles; verifica que un editor reciba 403. La tabla no tiene FKs.

## P4 · Frontend/Diseño

### ☐ P4-1 — AdminPerformance: eliminar datos mock hardcoded y estados falsos; conectar a datos reales o mostrar vacíos honestos
- **Severidad:** mayor · **Dominio:** Calidad Frontend + Design System (client/src) — Von Wobeser y Sierra (Replit)
- **Hallazgo:** La página AdminPerformance muestra métricas inventadas. El objeto mockMetrics (client/src/pages/admin/AdminPerformance.tsx líneas 390-403) usa fallbacks que en la práctica SIEMPRE se renderizan: successRate cae a 98.5, cachedTranslations a 1250, articlesTranslated a 156 (constante, sin fuente), languagesCovered a 10 (constante), seoOptimizations a 142 (constante), avgTime '2.3s' (string fijo), articlesAnalyzed a 89 y avgQualityScore a 87 (también fallbacks fijos). La query a /api/agents/status lee campos planos del interface AgentStatus (queueLength, isProcessing, registeredAgents, totalJobsProcessed, successRate; líneas 366-372) pero el endpoint devuelve forma ANIDADA {orchestrator:{isRunning, queueLength, activeJobs, registeredAgents, recentJobs, recentEvents, jobStatsByAgent}, evolution, knowledge, database:{recentJobs(number), failedJobs(number), recentEvents(number)}}. Por eso isProcessing/totalJobsProcessed/successRate son siempre undefined → caen al mock; sólo queueLength y registeredAgents resuelven por casualidad de nombre. Las otras dos queries apuntan a /api/translations/stats y /api/content-analysis/stats que NO existen como rutas en el servidor (verificado: grep en server/ no devuelve nada), así translationStats y contentStats son siempre undefined. La sección 'Agent Activity' (líneas 571-585) tiene 3 filas totalmente hardcoded ('FormatterAgent processed 12 articles', '2h ago', etc.). Las barras de idioma (líneas 520-540: English 100%, Spanish 98%, German 85%, Other 72%) también son inventadas. Para un despacho legal esto es deshonesto. NOTA: getJobCounts() del orchestrator (DatabasePersistence.ts:86) ya retorna {pending, inProgress, completed, failed} reales, pero status sólo expone queueLength(=pending) y activeJobs(=inProgress); completed/failed reales NO se surfacean hoy en orchestrator (sí database.failedJobs como número).
- **Evidencia:** client/src/pages/admin/AdminPerformance.tsx:390-403 mockMetrics con `successRate: agentStatus?.successRate || 98.5`, `cachedTranslations: translationStats?.totalCached || 1250`, `articlesTranslated: 156`, `languagesCovered: 10`, `articlesAnalyzed: contentStats?.totalAnalyzed || 89`, `avgQualityScore: contentStats?.avgScore || 87`, `seoOptimizations: 142`, `avgTime: "2.3s"`; también `processing: agentStatus?.isProcessing ? 1 : 0` (línea 392). Líneas 382-388: useQuery sobre '/api/translations/stats' y '/api/content-analysis/stats' (rutas inexistentes; `grep -rn translations/stats server/` y content-analysis/stats devuelven 0). Líneas 571-585: filas de actividad hardcodeadas (FormatterAgent/SEOOptimizerAgent/WebsiteAuditorAgent). Líneas 520-540: barras de idioma fijas. Interface AgentStatus líneas 366-372 con campos planos (queueLength, isProcessing, registeredAgents, totalJobsProcessed, successRate). Forma real anidada: server/agents/api/agentRoutes.ts:32-44 res.json envuelve bajo orchestrator/evolution/knowledge/database; database.failedJobs/recentJobs/recentEvents son NÚMEROS (.length). orchestrator.getStatus() (server/agents/core/AgentOrchestrator.ts:506-553) retorna {isRunning, queueLength, activeJobs, registeredAgents, recentJobs(array de objetos con id, agentType, status, priority, payload, result, error, retryCount, maxRetries, createdAt, startedAt, completedAt, parentJobId), recentEvents(array con id, jobId, agentType, eventType, message, data, timestamp)}; jobStatsByAgent (Record<string,{total,completed,failed,pending}>) se añade en agentRoutes.ts:35. Ruta montada en server/routes.ts:3569 `app.use('/api/agents', agentRoutes.default)`. Página ruteada en client/src/App.tsx:57,179 (/admin/performance). 10 bloques de idioma en translations (10x 'loading:' y 'noActivity:').
- **Archivos:** client/src/pages/admin/AdminPerformance.tsx

**Fix / prompt:**

```
En el archivo client/src/pages/admin/AdminPerformance.tsx corrige el dashboard de rendimiento para que NO muestre datos inventados. Haz exactamente esto, sin tocar las traducciones (objeto translations) ni el JSX de layout más allá de lo indicado:

1) Corrige la forma de los datos. El endpoint GET /api/agents/status devuelve un objeto ANIDADO con esta forma: { orchestrator: { isRunning: boolean, queueLength: number, activeJobs: number, registeredAgents: string[], recentJobs: Array<{ id, agentType, status, createdAt, error? }>, recentEvents: Array<{ id, agentType, eventType, message, timestamp }>, jobStatsByAgent: Record<string,{ total, completed, failed, pending }> }, evolution, knowledge, database: { recentJobs: number, failedJobs: number, recentEvents: number } }. (database.* son CONTEOS numéricos, no arrays.) Reescribe el interface AgentStatus (líneas 366-372) para reflejar esa estructura anidada, y cambia el tipo del useQuery de la línea 378-380 a ese nuevo interface. Lee los valores desde agentStatus?.orchestrator?.queueLength, agentStatus?.orchestrator?.activeJobs, agentStatus?.orchestrator?.registeredAgents?.length, agentStatus?.orchestrator?.isRunning, etc.

2) Elimina las dos queries a endpoints inexistentes. Borra los useQuery de las líneas 382-384 (/api/translations/stats) y 386-388 (/api/content-analysis/stats), y todas las referencias a translationStats y contentStats.

3) Reemplaza el objeto mockMetrics (líneas 390-403) por un objeto realMetrics que SOLO use datos reales. Para cualquier métrica sin fuente real (cachedTranslations, articlesTranslated, articlesAnalyzed, avgQualityScore, seoOptimizations, avgTime, successRate), NO inventes un número: usa null. Define: pending = agentStatus?.orchestrator?.queueLength ?? 0; processing = agentStatus?.orchestrator?.activeJobs ?? 0; failed = agentStatus?.database?.failedJobs ?? null; completed = (deriva sumando los .completed de cada entrada de agentStatus?.orchestrator?.jobStatsByAgent si está disponible; si no, null); el resto en null. (Nota: si en el futuro el servidor expone orchestrator.getJobCounts() —que ya calcula {pending,inProgress,completed,failed} reales en DatabasePersistence.ts:86— preferir esos; hoy no está surfaceado, así que la derivación de jobStatsByAgent es la fuente disponible.)

4) En el JSX, donde una métrica sea null muestra un guion em '—' con una etiqueta 'Sin datos' en lugar del número. Agrega una nueva clave 'noData' a CADA uno de los 10 idiomas del objeto translations con su traducción correcta (TypeScript fallará si falta en alguno; la clave t.noActivity ya existe en los 10). No muestres barras de Progress con valores ficticios: elimina por completo el bloque de barras de idioma (líneas 520-540: English 100%, Spanish 98%, German 85%, Other 72%) o sustitúyelo por un estado vacío honesto.

5) Elimina por completo el bloque de 'Agent Activity' con filas hardcodeadas (líneas 571-585). Si quieres conservar la sección, renderiza agentStatus?.orchestrator?.recentEvents reales (mapea message y timestamp); si no hay eventos muestra t.noActivity.

6) El badge 'Operational' (líneas 449-452) no debe estar siempre verde: derívalo de agentStatus?.orchestrator?.isRunning (verde si true, gris/degraded si false o sin datos).

No crees endpoints nuevos en el servidor. No cambies otros archivos. Al terminar, compila con `npm run check` (tsc) y `npm run build` (= tsx script/build.ts), abre /admin/performance autenticado y confirma que las tarjetas sin fuente de datos muestran '—'/'Sin datos' y que las que sí tienen fuente muestran números provenientes de /api/agents/status.
```

- **Aceptación:** En /admin/performance (autenticado) ya no aparecen los números fijos 98.5%, 1250, 156, 142, '2.3s', 89, 87 cuando no hay datos reales; en su lugar se ve '—'/'Sin datos'. `grep -nE "1250|: 156|: 142|2.3s|98.5|: 89|: 87" client/src/pages/admin/AdminPerformance.tsx` no devuelve métricas hardcodeadas (cuidado: 156/142 podrían colisionar con números de línea u otros literales; valida visualmente que ningún fallback fijo siga). `grep -n "translations/stats\|content-analysis/stats" client/src/pages/admin/AdminPerformance.tsx` no devuelve nada. Las filas FormatterAgent/SEOOptimizerAgent hardcodeadas ya no existen. En DevTools Network, la respuesta de /api/agents/status se lee vía agentStatus.orchestrator.* y los números mostrados coinciden con esa respuesta. `npm run check` pasa sin errores nuevos.
- **Riesgo / cuidado:** Verificar que TODO el JSX que referenciaba mockMetrics.* se actualice a realMetrics.* para no dejar variables sin definir (romperá el build): hay referencias en líneas 466, 468, 479, 480, 490, 508, 512, 516, 556, 560, 564, 596, 607, 616, 625, 634. Conservar intactas las 10 secciones de idioma en translations; al agregar 'noData' debe agregarse a los 10 idiomas o tsc fallará (la clave t.noActivity ya existe en los 10). NO tocar el endpoint del servidor. OJO con la grep de aceptación de 156/142: son números genéricos que pueden aparecer como números de línea o en otros contextos; la verificación real es visual + lectura de realMetrics. El servidor expone completed/failed reales sólo vía database.failedJobs (número) y la derivación de jobStatsByAgent; activeJobs!=processing-count exacto pero es la mejor fuente disponible.

### ☐ P4-2 — Agregar guard de autenticación (client-side) a 4 páginas admin sin protección
- **Severidad:** mayor · **Dominio:** Calidad Frontend + Design System (client/src) — Von Wobeser y Sierra (Replit)
- **Hallazgo:** Cuatro páginas bajo /admin no usan ningún guard de auth client-side (no importan useAdminAuth): AdminGuide, AdminHealthCheck, AdminPerformance y SystemExplorer (verificado: grep -c useAdminAuth = 0 en las 4). Las 4 están ruteadas en client/src/App.tsx:178-186 (/admin/guide, /admin/health-check, /admin/performance, /admin/explorer), así que cualquier visitante que conozca la URL ve el contenido sin loguearse en el cliente. MATIZ IMPORTANTE sobre los endpoints: GET /api/health-check/run (server/routes.ts:3520) es PÚBLICO POR DISEÑO — hay un comentario explícito arriba (líneas 3518-3519): 'Health check is intentionally public (read-only diagnostic). Destructive operations like reset-zombies require auth.'. GET /api/system/chronicler (server/routes.ts:3363) también es público sin authMiddleware. No asumir que la falta de auth server-side es un bug accidental en health-check; en chronicler es discutible. Este lote sólo corrige el guard CLIENT-SIDE (UX: no mostrar el panel admin a anónimos). La decisión de proteger o no esos endpoints es de un lote de backend y debe decidirse explícitamente, no darse por sentada. El patrón correcto client-side ya existe en AdminDashboard: importa useAdminAuth, llama requireAuth() en useEffect cuando !authLoading, early-returns para loading y !isAuthenticated.
- **Evidencia:** client/src/pages/admin/AdminGuide.tsx, AdminHealthCheck.tsx, AdminPerformance.tsx, SystemExplorer.tsx: `grep -c useAdminAuth` = 0 en las 4. Rutas en client/src/App.tsx:178 (/admin/guide), :179 (/admin/performance), :185 (/admin/health-check), :186 (/admin/explorer). Patrón de referencia en client/src/pages/admin/AdminDashboard.tsx:602 `const { isAuthenticated, isLoading: authLoading, logout, requireAuth } = useAdminAuth();`, :605-609 useEffect que llama requireAuth(), :619 `enabled: isAuthenticated` en useQuery, :629-631 `if (!isAuthenticated) return null;`. Hook en client/src/lib/adminAuth.ts:79 useAdminAuth y :115 requireAuth (que en :65-66 redirige a /admin/login). Queries en las páginas: AdminHealthCheck.tsx:461-462 useQuery('/api/health-check/run'); AdminGuide.tsx:416-417 useQuery('/api/system/chronicler'); SystemExplorer.tsx NO tiene useQuery (sólo useState/useMemo, línea 1). Endpoints: server/routes.ts:3520 `app.get("/api/health-check/run"...)` (público, con comentario 'intentionally public' en :3518-3519) y :3363 `app.get("/api/system/chronicler"...)` (sin authMiddleware). Imports react actuales: AdminHealthCheck.tsx:1 `import { useState, useMutation... }` (sin useEffect), SystemExplorer.tsx:1 `import { useState, useMemo } from 'react'` (sin useEffect), AdminGuide.tsx y AdminPerformance.tsx NO importan nada de 'react' hoy.
- **Archivos:** client/src/pages/admin/AdminGuide.tsx, client/src/pages/admin/AdminHealthCheck.tsx, client/src/pages/admin/AdminPerformance.tsx, client/src/pages/admin/SystemExplorer.tsx

**Fix / prompt:**

```
Agrega el guard de autenticación de admin (CLIENT-SIDE) a estas cuatro páginas, replicando EXACTAMENTE el patrón de client/src/pages/admin/AdminDashboard.tsx (líneas 602-631). Archivos: client/src/pages/admin/AdminGuide.tsx, client/src/pages/admin/AdminHealthCheck.tsx, client/src/pages/admin/AdminPerformance.tsx, client/src/pages/admin/SystemExplorer.tsx.

En CADA uno de los cuatro archivos:
1) Agrega el import: import { useAdminAuth } from "@/lib/adminAuth";
2) Asegúrate de que useEffect esté importado desde 'react'. ATENCIÓN: AdminGuide.tsx y AdminPerformance.tsx NO importan nada de 'react' hoy (agrega `import { useEffect } from "react";`). AdminHealthCheck.tsx importa { useState, ... } de 'react' (agrega useEffect a ese import). SystemExplorer.tsx importa { useState, useMemo } de 'react' (agrega useEffect).
3) Dentro del componente principal exportado por default, al inicio del cuerpo agrega: const { isAuthenticated, isLoading: authLoading, requireAuth } = useAdminAuth();
4) Agrega este efecto: useEffect(() => { if (!authLoading) { requireAuth(); } }, [authLoading, requireAuth]);
5) Antes del return principal del JSX (y DESPUÉS de declarar todos los demás hooks: useQuery, useState, useMemo), agrega los dos early-returns: if (authLoading) { return (<div className="min-h-screen flex items-center justify-center"><div className="text-lg">Loading...</div></div>); } y if (!isAuthenticated) { return null; }
6) En las queries que llamen a endpoints protegidos, agrega `enabled: isAuthenticated` a las opciones del useQuery (igual que AdminDashboard:619). En concreto: AdminHealthCheck.tsx tiene useQuery en línea 461-462 (/api/health-check/run) y AdminGuide.tsx en 416-417 (/api/system/chronicler) — añade enabled: isAuthenticated a ambas. SystemExplorer.tsx NO tiene useQuery: basta el guard. AdminPerformance.tsx: agrega enabled: isAuthenticated a su useQuery de /api/agents/status.

No cambies el contenido visual ni las traducciones. No toques el servidor en este lote.

Al terminar, compila con `npm run check`, y en una ventana de incógnito (sin token) visita /admin/guide, /admin/health-check, /admin/performance y /admin/explorer y confirma que cada una redirige a /admin/login en lugar de mostrar contenido. Con token válido, las 4 siguen cargando.
```

- **Aceptación:** En incógnito sin token, visitar /admin/guide, /admin/health-check, /admin/performance, /admin/explorer redirige a /admin/login y no renderiza contenido admin. `grep -l useAdminAuth client/src/pages/admin/AdminGuide.tsx client/src/pages/admin/AdminHealthCheck.tsx client/src/pages/admin/AdminPerformance.tsx client/src/pages/admin/SystemExplorer.tsx` devuelve los 4 archivos. Con token válido, las 4 páginas cargan normalmente. `npm run check` (tsc) pasa.
- **Riesgo / cuidado:** Confirmar que useEffect quede importado en cada archivo (AdminGuide y AdminPerformance no importan nada de 'react' hoy; AdminHealthCheck y SystemExplorer importan de 'react' pero sin useEffect) para no romper el build. El early-return `if (!isAuthenticated) return null;` DEBE ir después de declarar todos los hooks (useQuery, useState, useMemo) para no violar las reglas de hooks de React. SystemExplorer no tiene queries; basta el guard. ALCANCE: este guard es sólo client-side (UX). La exposición server-side de /api/health-check/run es INTENCIONAL (comentario explícito en server/routes.ts:3518-3519 'intentionally public, read-only diagnostic'); /api/system/chronicler también es público. Si se quiere cerrar el acceso a nivel API, es una decisión de un lote de backend SEPARADO que debe tomarse explícitamente — no es un bug a corregir a ciegas, así que no prometas 'cierre de fuga de datos' con sólo este lote frontend.

### ☐ P4-3 — Eliminar 5 componentes huérfanos (NO PipelineProgressModal, que sí se usa)
- **Severidad:** menor · **Dominio:** Calidad Frontend + Design System (client/src) — Von Wobeser y Sierra (Replit)
- **Hallazgo:** Cinco componentes nunca se importan ni se renderizan en ningún lado del cliente: QuoteSection (155 líneas), ImageCollage (293), OfficeGallery (180), TeamMemberCard (141) y VisionSection (189). Verificado: grep externo (excluyendo el propio archivo) no devuelve imports/usos JSX para QuoteSection, ImageCollage, OfficeGallery ni VisionSection. CORRECCIÓN AL BRIEF (confirmada): PipelineProgressModal NO es huérfano — está importado y renderizado en client/src/pages/admin/AdminArticleProcessing.tsx (import en línea 14, render <PipelineProgressModal en línea 970), por lo que NO debe eliminarse. TeamMemberCard: la única coincidencia externa es la función LOCAL RelatedTeamMemberCard en client/src/pages/TeamMemberDetail.tsx:51 (nombre distinto, match por substring 'TeamMemberCard') usada en :1955; es independiente del componente client/src/components/TeamMemberCard.tsx (export default), que sigue siendo huérfano. Mantener componentes muertos infla el bundle y confunde el mapa del código.
- **Evidencia:** `grep -rn QuoteSection|ImageCollage|OfficeGallery|VisionSection client/src --include=*.tsx --include=*.ts` excluyendo cada propio archivo: 0 resultados externos. Conteos de líneas confirmados: QuoteSection.tsx 155, ImageCollage.tsx 293, OfficeGallery.tsx 180, TeamMemberCard.tsx 141, VisionSection.tsx 189. TeamMemberCard refs: client/src/components/TeamMemberCard.tsx:9 (interface), :21 (export default TeamMemberCard); client/src/pages/TeamMemberDetail.tsx:51 `function RelatedTeamMemberCard({` y :1955 `<RelatedTeamMemberCard` (componente distinto). PipelineProgressModal: client/src/pages/admin/AdminArticleProcessing.tsx:14 `import { PipelineProgressModal } from "@/components/PipelineProgressModal";` y :970 `<PipelineProgressModal`; también string descriptivo en client/src/lib/systemManifest.ts:1027.
- **Archivos:** client/src/components/QuoteSection.tsx, client/src/components/ImageCollage.tsx, client/src/components/OfficeGallery.tsx, client/src/components/TeamMemberCard.tsx, client/src/components/VisionSection.tsx

**Fix / prompt:**

```
Elimina cinco componentes React huérfanos que no se importan ni renderizan en ninguna parte de client/src. Borra estos archivos:
- client/src/components/QuoteSection.tsx
- client/src/components/ImageCollage.tsx
- client/src/components/OfficeGallery.tsx
- client/src/components/TeamMemberCard.tsx
- client/src/components/VisionSection.tsx

NO elimines client/src/components/PipelineProgressModal.tsx — ESE SÍ se usa (importado y renderizado en client/src/pages/admin/AdminArticleProcessing.tsx líneas 14 y 970). Tampoco toques la función local RelatedTeamMemberCard dentro de client/src/pages/TeamMemberDetail.tsx (líneas 51 y 1955), que es un componente distinto e independiente del archivo TeamMemberCard.tsx que vas a borrar.

Antes de borrar, verifica con grep que no haya imports vivos: `grep -rn "QuoteSection\|ImageCollage\|OfficeGallery\|VisionSection" client/src --include="*.tsx" --include="*.ts"` (deben aparecer sólo los propios archivos) y `grep -rn "from.*components/TeamMemberCard\|import.*TeamMemberCard" client/src` (no debe aparecer ningún import externo; RelatedTeamMemberCard NO es un import de TeamMemberCard). Si encuentras un import vivo inesperado, NO borres ese archivo y repórtalo.

Después de borrar, corre el build del proyecto: `npm run build` (que ejecuta `tsx script/build.ts`) y/o `npm run check` (tsc) para confirmar que no hay imports rotos. Si el build pasa, los componentes estaban efectivamente muertos.
```

- **Aceptación:** Los 5 archivos ya no existen. `npm run build` (tsx script/build.ts) y `npm run check` (tsc) compilan sin errores de import faltante. `grep -rn "PipelineProgressModal" client/src/pages/admin/AdminArticleProcessing.tsx` sigue devolviendo las líneas 14 y 970 (no se tocó). La app levanta y /team, / (home) renderizan igual que antes.
- **Riesgo / cuidado:** Riesgo bajo, pero el grep de verificación es obligatorio antes de borrar: si algún componente se importa dinámicamente o vía string, podría romperse (no se halló ninguno). NO borrar PipelineProgressModal.tsx bajo ninguna circunstancia. El build (`npm run build` = tsx script/build.ts) y el typecheck (tsc) deben pasar antes de dar por terminado el lote. La ruta /offices mencionada en briefs previos no necesariamente existe; verifica las rutas reales en client/src/App.tsx antes de afirmar 'renderizan igual'.

### ☐ P4-4 — Tipar correctamente AdminAgents (eliminar any[]) y canonizar queryKey de EventsSection
- **Severidad:** menor · **Dominio:** Calidad Frontend + Design System (client/src) — Von Wobeser y Sierra (Replit)
- **Hallazgo:** Dos problemas menores de tipos/convención. (1) En client/src/pages/AdminAgents.tsx (el archivo RUTEADO en App.tsx:51,172) hay tipos any: recentJobs: any[] y recentEvents: any[] en el interface OrchestratorStatus (líneas 75-76), recentCycles: any[] (línea 89), AGENT_ICONS: Record<string, any> (línea 98), onSuccess: (data: any) (líneas 175 y 192) y los .map (job: any) / (event: any) en líneas 600 y 657. ATENCIÓN: existe OTRO archivo client/src/pages/admin/AdminAgents.tsx que DIFIERE y NO está ruteado; NO lo edites. (2) En client/src/components/EventsSection.tsx el queryKey es ['/api/events/upcoming?limit=4'] (línea 130): la query string va embebida como literal. FUNCIONALMENTE FUNCIONA (el fetcher por defecto hace queryKey.join('/') en client/src/lib/queryClient.ts:32 y produce la URL correcta; el endpoint GET /api/events/upcoming existe en server/routes.ts:700 y soporta ?limit), pero es no canónico. CRÍTICO: si se canoniza el queryKey a [path, {params}] SIN agregar un queryFn explícito, el fetcher por defecto generaría /api/events/upcoming/[object Object] y ROMPERÍA la carga — por eso el queryFn explícito es obligatorio en la Parte B.
- **Evidencia:** client/src/pages/AdminAgents.tsx (ruteado: client/src/App.tsx:51 `const AdminAgents = lazy(() => import("@/pages/AdminAgents"))`, :172 `<Route path="/admin/agents" component={AdminAgents} />`):75 `recentJobs: any[];`, :76 `recentEvents: any[];`, :89 `recentCycles: any[];`, :98 `const AGENT_ICONS: Record<string, any>`, :175 y :192 `onSuccess: (data: any)`, :600 `...recentJobs?.slice().reverse().map((job: any, idx: number)`, :657 `...recentEvents?.slice().reverse().map((event: any, idx: number)`. (Las líneas 600/657 leen status?.orchestrator?.recentJobs/recentEvents, coherente con la API real.) Existe duplicado distinto en client/src/pages/admin/AdminAgents.tsx (diff -q confirma DIFFERENT) NO ruteado. client/src/components/EventsSection.tsx:130 `queryKey: ["/api/events/upcoming?limit=4"]` (useQuery<Event[]>, SIN queryFn). Endpoint en server/routes.ts:700 `app.get("/api/events/upcoming"...)`. Fetcher por defecto en client/src/lib/queryClient.ts:32 `fetch(queryKey.join("/") as string...)`. Forma real de recentJobs (orchestrator getStatus, AgentOrchestrator.ts:517-531): {id, agentType, status, priority, payload, result, error, retryCount, maxRetries, createdAt, startedAt, completedAt, parentJobId}. recentEvents (:533-541): {id, jobId, agentType, eventType, message, data, timestamp}. AdminAgents importa de 'lucide-react' (línea 35), así que LucideIcon es importable.
- **Archivos:** client/src/pages/AdminAgents.tsx, client/src/components/EventsSection.tsx

**Fix / prompt:**

```
Haz dos mejoras pequeñas de calidad de código. IMPORTANTE: edita SOLO client/src/pages/AdminAgents.tsx (el ruteado en App.tsx:51,172). NO toques client/src/pages/admin/AdminAgents.tsx (es un duplicado distinto que no se rutea).

PARTE A — Tipar AdminAgents. En client/src/pages/AdminAgents.tsx reemplaza los tipos `any` por tipos concretos:
1) En el interface OrchestratorStatus (líneas ~70-78), cambia `recentJobs: any[];` y `recentEvents: any[];` por interfaces propias. Define arriba interface AgentJob { id: string; agentType: string; status: string; createdAt: string | Date; error?: string; } y interface AgentEvent { id: string; jobId?: string; agentType: string; eventType: string; message: string; timestamp: string | Date; }. (La forma real es más rica —recentJobs trae priority, payload, result, retryCount, maxRetries, startedAt, completedAt, parentJobId; recentEvents trae data— pero basta tipar los campos que el JSX usa; añade los que falten si tsc lo pide.) Usa recentJobs: AgentJob[]; y recentEvents: AgentEvent[];.
2) En EvolutionSummary (línea ~89) cambia `recentCycles: any[];` por un tipo mínimo, p.ej. recentCycles: { id: string; status: string; createdAt: string | Date }[]; o, si la forma es incierta, unknown[].
3) En AGENT_ICONS (línea ~98) cambia Record<string, any> por Record<string, LucideIcon> (importa el tipo LucideIcon desde 'lucide-react'; el archivo ya importa de ese módulo en línea 35).
4) En los onSuccess (líneas ~175 y ~192) reemplaza (data: any) por el tipo del payload real de cada mutación, o (data: unknown) si data no se usa.
5) En los .map de líneas ~600 y ~657 cambia (job: any, idx: number) y (event: any, idx: number) por (job: AgentJob, idx: number) y (event: AgentEvent, idx: number).
Ajusta los accesos a propiedades en el JSX para respetar los nuevos tipos (no vuelvas a any).

PARTE B — Canonizar el queryKey de EventsSection. En client/src/components/EventsSection.tsx línea 130, cambia `queryKey: ["/api/events/upcoming?limit=4"]` por una clave estructurada Y AGREGA un queryFn explícito (OBLIGATORIO: sin él, el fetcher por defecto haría queryKey.join('/') = '/api/events/upcoming/[object Object]' y rompería la carga). Por ejemplo: queryKey: ["/api/events/upcoming", { limit: 4 }], queryFn: async () => { const res = await fetch("/api/events/upcoming?limit=4", { credentials: "include" }); if (!res.ok) throw new Error(`${res.status}`); return res.json(); }. Mantén el genérico <Event[]> del useQuery. La URL final fetcheada DEBE seguir siendo /api/events/upcoming?limit=4. No cambies el render de los eventos.

No modifiques el servidor. Corre `npm run check` (tsc) al terminar.
```

- **Aceptación:** `grep -nE ": any\[\]|Record<string, any>|: any\)" client/src/pages/AdminAgents.tsx` ya no devuelve las líneas señaladas (75,76,89,98,175,192,600,657). `npm run check` (tsc) pasa sin errores nuevos. La sección de eventos próximos en la home (/) sigue mostrando los mismos 4 eventos que antes (verificación visual). El panel /admin/agents renderiza recentJobs y recentEvents igual que antes. En DevTools Network, EventsSection sigue pidiendo exactamente /api/events/upcoming?limit=4 (no /api/events/upcoming/[object Object]).
- **Riesgo / cuidado:** Edita SOLO client/src/pages/AdminAgents.tsx (ruteado), NO el duplicado client/src/pages/admin/AdminAgents.tsx. Al introducir tipos concretos pueden aparecer errores de TypeScript antes ocultos por any — corrígelos ajustando los accesos a propiedades, no volviendo a any. La forma real de AgentJob/AgentEvent es más rica que el interface mínimo propuesto (recentJobs incluye priority/payload/result/retryCount/maxRetries/startedAt/completedAt/parentJobId; recentEvents incluye data); añade los campos que tsc reclame. La Parte B es load-bearing: el queryFn explícito es OBLIGATORIO porque el fetcher por defecto hace queryKey.join('/') (queryClient.ts:32); sin queryFn la URL se rompería. La URL final debe seguir siendo /api/events/upcoming?limit=4.

### ☐ P4-5 — Migrar hex inline a tokens semánticos del design system (402 ocurrencias con 9 prefijos / 393 con 4 prefijos; por lotes de archivos)
- **Severidad:** menor · **Dominio:** Calidad Frontend + Design System (client/src) — Von Wobeser y Sierra (Replit)
- **Hallazgo:** Hay colores hex inline (clases tipo bg-[#AA1A2E], text-[#1D1D1B], border-[#D9D8D7]) repartidos en client/src, cuando ya existen tokens semánticos en tailwind.config.ts (primary, foreground, muted-foreground, border, etc.) mapeados a variables CSS en client/src/index.css. CONTEO (importante para evitar confusión): con el set COMPLETO de 9 prefijos (bg|text|border|ring|from|to|via|fill|stroke) hay 402 ocurrencias (grep -roE | wc -l); con sólo 4 prefijos (bg|text|border|ring) hay 393. Los conteos por archivo del lote son por OCURRENCIA (grep -roE | wc -l), no por línea: AdminTeamForm.tsx 150 ocurrencias (116 líneas), Team.tsx 29, TeamMemberDetail.tsx 19, PracticeGroupDetail.tsx 18, CookieBanner.tsx 13, WorldMapSection.tsx 32, NewOfficesPopup.tsx 10, NewsSection.tsx 9. Mapeos limpios: #AA1A2E (text x96 + bg x77 + border x36 + ring x12 = ~221) = --primary (352 73% 38% = #AA1A2E, index.css:69) → usar primary; #1D1D1B (x21) y #171717 → foreground (--foreground 0 0% 9% ≈ #171717, comentado en index.css:53); #878A8E (x30)/#54565B (x9)/#5B5C5F (grises de texto) → muted-foreground (--muted-foreground 0 0% 42% ≈ #6B6B6B); #D9D8D7 (border x29) → border (PERO OJO: el token --border es 0 0% 87% = #DEDEDE, no exactamente #D9D8D7; son cercanos, validar visualmente). CUIDADO: hex oscuros hechos a mano para dark mode SIN token 1:1 (confirmados presentes): #1a1a19 (x42), #111110 (x6), #222220 (x5), #0a0a09 (x1), #16213e (x1), #0f3460 (x1), #1a1a2e (x1) — revisar caso por caso, no migrar a ciegas. El reemplazo debe preservar el render idéntico en claro y oscuro.
- **Evidencia:** `grep -rhoE "(bg|text|border|ring|from|to|via|fill|stroke)-\[#[0-9A-Fa-f]{3,8}\]" client/src | wc -l` = 402; con sólo (bg|text|border|ring) = 393. Distribución (ocurrencias): text-[#AA1A2E] x96, bg-[#AA1A2E] x77, bg-[#1a1a19] x39, border-[#AA1A2E] x36, text-[#878A8E] x30, border-[#D9D8D7] x29, text-[#1D1D1B] x21, ring-[#AA1A2E] x12, text-[#54565B] x9. Conteos por archivo (grep -roE 9-prefijos | wc -l): AdminTeamForm.tsx 150, WorldMapSection.tsx 32, Team.tsx 29, TeamMemberDetail.tsx 19, PracticeGroupDetail.tsx 18, CookieBanner.tsx 13, NewOfficesPopup.tsx 10, NewsSection.tsx 9. AA1A2E sólo con 4 prefijos en AdminTeamForm = 42 ocurrencias. Tokens en tailwind.config.ts:16 (foreground), :17 (border), :29-32 (primary), :39-42 (muted/muted-foreground). Valores CSS (light): index.css:69 `--primary: 352 73% 38%` (#AA1A2E), :53 `--foreground: 0 0% 9%` (≈#171717), :74 `--muted-foreground: 0 0% 42%` (≈#6B6B6B), :57 `--border: 0 0% 87%` (=#DEDEDE, NO #D9D8D7). Bloque .dark en index.css:132; valores dark distintos en :144 (--foreground 0 0% 93%), :148 (--border 0 0% 22%), :160 (--primary 352 73% 45%), :165 (--muted-foreground 0 0% 56%). Hex oscuros hechos a mano confirmados: [#1a1a19] x42, [#111110] x6, [#222220] x5, [#0a0a09] x1, [#16213e] x1, [#0f3460] x1, [#1a1a2e] x1.
- **Archivos:** client/src/pages/admin/AdminTeamForm.tsx, client/src/components/WorldMapSection.tsx, client/src/pages/Team.tsx, client/src/pages/TeamMemberDetail.tsx, client/src/pages/PracticeGroupDetail.tsx, client/src/components/CookieBanner.tsx, client/src/components/NewOfficesPopup.tsx, client/src/components/NewsSection.tsx

**Fix / prompt:**

```
Migra los colores hex inline de Tailwind a tokens semánticos del design system, preservando el render EXACTO en modo claro y oscuro. Trabaja por archivos, de mayor a menor conteo. Reglas de mapeo (aplican a prefijos bg-, text-, border-, ring-, from-, to-, via-, fill-, stroke-):

- [#AA1A2E] y [#8A1525]/[#8B1525]/[#8b1525] (rojo corporativo y su hover) → token `primary`. Ej: text-[#AA1A2E] → text-primary; bg-[#AA1A2E] → bg-primary; border-[#AA1A2E] → border-primary; ring-[#AA1A2E] → ring-primary. Para los tonos hover más oscuros usa hover:bg-primary/90, manteniendo el efecto visual.
- [#1D1D1B] y [#171717] (negro/casi negro de texto) → text-foreground (o bg-foreground según prefijo). (El token foreground es 0 0% 9% ≈ #171717; #1D1D1B es ligeramente distinto — valida visualmente.)
- [#878A8E], [#54565B], [#5B5C5F], [#8B8D89] (grises de texto secundario) → text-muted-foreground.
- [#D9D8D7], [#DEDEDE] (bordes/divisores gris claro) → border-border. (OJO: el token border es #DEDEDE; #D9D8D7 es muy cercano pero no idéntico — verifica que el divisor no cambie de tono perceptiblemente.)
- [#FAFAFA], [#F8F8F8], [#F0F0F0] (fondos claros) → bg-background o bg-muted según contexto.

NO migres automáticamente los hex oscuros [#1a1a19] (x42), [#111110] (x6), [#222220] (x5), [#0a0a09], [#16213e], [#0f3460], [#1a1a2e] (gradientes y fondos de dark mode hechos a mano): revísalos uno por uno; si tienen token equivalente úsalo, si no, DÉJALOS como están y anótalos para revisión manual. No inventes tokens nuevos.

Procede en este orden, un commit por archivo: 1) client/src/pages/admin/AdminTeamForm.tsx (150), 2) client/src/components/WorldMapSection.tsx (32), 3) client/src/pages/Team.tsx (29), 4) client/src/pages/TeamMemberDetail.tsx (19), 5) client/src/pages/PracticeGroupDetail.tsx (18), 6) client/src/components/CookieBanner.tsx (13), 7) client/src/components/NewOfficesPopup.tsx (10), 8) client/src/components/NewsSection.tsx (9). Para cada archivo: aplica los reemplazos, levanta la app y compara visualmente la página en modo CLARO y OSCURO contra el estado anterior (deben verse idénticas). Si algún reemplazo cambia el color percibido, revierte ese reemplazo puntual y déjalo con el hex original.

No toques tailwind.config.ts ni client/src/index.css (los tokens ya existen). No cambies estructura ni texto, sólo clases de color.
```

- **Aceptación:** Tras cada archivo, comparación visual lado a lado (claro y oscuro) confirma render idéntico. `grep -roE "(bg|text|border|ring)-\[#AA1A2E\]" client/src/pages/admin/AdminTeamForm.tsx | wc -l` devuelve 0 (hoy son 42; rojo corporativo migrado a primary). El conteo global con el MISMO set de 9 prefijos que define el total `grep -rhoE "(bg|text|border|ring|from|to|via|fill|stroke)-\[#[0-9A-Fa-f]{3,8}\]" client/src | wc -l` baja sustancialmente respecto a 402 (los hex oscuros de dark mode pueden quedar pendientes y eso está documentado). NOTA: si verificas con sólo 4 prefijos el baseline es 393, no 402 — usa el mismo set de prefijos para medir antes y después. La app compila (`npm run check`) y todas las páginas tocadas se ven igual que antes.
- **Riesgo / cuidado:** ALTO riesgo de regresión visual en modo oscuro: los tokens primary/foreground/muted-foreground/border tienen valores DISTINTOS en .dark (index.css: --foreground :144, --border :148, --primary :160, --muted-foreground :165) — un hex fijo se ve igual en ambos modos, pero el token cambia con el tema, así que el reemplazo puede alterar el dark mode. Verificación visual OBLIGATORIA en AMBOS modos por archivo, revirtiendo reemplazos puntuales que cambien el aspecto. Un commit por archivo para revertir granular. CUIDADO con la equivalencia inexacta: #D9D8D7→border(#DEDEDE) y #1D1D1B→foreground(#171717) NO son hex idénticos; si el divisor o el texto cambia de tono perceptiblemente, conserva el hex original. No migrar los hex oscuros hechos a mano sin revisión. No empezar este lote en automático masivo: file-by-file con checkpoint visual. INCONSISTENCIA DE CONTEO a tener en cuenta: 402 = 9 prefijos; 393 = 4 prefijos. Mide antes/después con el mismo set.

### ☐ P4-6 — Migrar 68 clases gray-* a tokens muted y corregir rounded-full en barras/tracks de ui/ (no en elementos circulares)
- **Severidad:** menor · **Dominio:** Calidad Frontend + Design System (client/src) — Von Wobeser y Sierra (Replit)
- **Hallazgo:** Dos limpiezas de design system. (1) Hay 68 clases gray-* hardcodeadas en client/src (text-gray-400 x17, bg-gray-900 x15, text-gray-500 x6, bg-gray-500 x6, text-gray-800 x4, bg-gray-100 x4, etc.; verificado: grep -rhoE '(bg|text|border)-gray-[0-9]{2,3}' = 68) que deberían usar tokens semánticos: grises de texto → text-muted-foreground; fondos grises oscuros → bg-muted/bg-card según contexto; bordes gris → border-border. (2) La política de design_guidelines.md (sección Border Radius, líneas 99-101: 'Esquinas rectas en todo el sitio (rounded-none). Excepto: Avatares y elementos circulares') se viola con rounded-full en BARRAS/TRACKS de componentes ui/ que deberían ser rectangulares: slider Track (slider.tsx:18), progress bar (progress.tsx:15), scroll-area thumb (scroll-area.tsx:41), drawer handle (drawer.tsx:51). CORRECCIÓN AL BRIEF (confirmada): switch (switch.tsx:12 track pill, :21 thumb), radio-group (radio-group.tsx:29 aspect-square h-4 w-4), avatar (avatar.tsx:15,16,43), carousel nav buttons (carousel.tsx:212,243 h-8 w-8) y el slider Thumb (slider.tsx:21 h-5 w-5) son elementos CIRCULARES legítimos, EXENTOS por la guía — NO cambiar. Sólo aplican los 4 tracks/barras listados.
- **Evidencia:** `grep -rhoE "(bg|text|border)-gray-[0-9]{2,3}" client/src | wc -l` = 68; top: text-gray-400 x17, bg-gray-900 x15, text-gray-500 x6, bg-gray-500 x6, text-gray-800 x4, bg-gray-100 x4, text-gray-600 x2, text-gray-300 x2, text-gray-200 x2, border-gray-500 x2. Política en design_guidelines.md:99-101. Violaciones (barras/tracks): client/src/components/ui/slider.tsx:18 `<SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">`, client/src/components/ui/progress.tsx:15 `"relative h-4 w-full overflow-hidden rounded-full bg-secondary"`, client/src/components/ui/scroll-area.tsx:41 `<ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />`, client/src/components/ui/drawer.tsx:51 `<div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />`. Exentos (circulares, NO tocar): slider.tsx:21 Thumb (h-5 w-5), switch.tsx:12 (track pill h-7 w-12) y :21 (thumb h-5 w-5), radio-group.tsx:29 (aspect-square h-4 w-4), avatar.tsx:15/16/43, carousel.tsx:212/243 (h-8 w-8).
- **Archivos:** client/src/components/ui/slider.tsx, client/src/components/ui/progress.tsx, client/src/components/ui/scroll-area.tsx, client/src/components/ui/drawer.tsx

**Fix / prompt:**

```
Dos limpiezas de design system.

PARTE A — Reemplazar clases gray-* por tokens semánticos en client/src (preservando claro y oscuro). Reglas: text-gray-300/400/500/600/700/800 → text-muted-foreground; bg-gray-900/800 → bg-card o bg-muted (elige según si es panel elevado=card o fondo de sección=muted, verificando visualmente); bg-gray-100/200 → bg-muted; bg-gray-500 → bg-muted-foreground sólo si es un punto/indicador, si no bg-muted; border-gray-100/300/500/700/800 → border-border. Aplica archivo por archivo (`grep -rl "gray-" client/src --include="*.tsx"` para listarlos) y verifica visualmente cada página tocada en modo claro y oscuro; si un reemplazo cambia el aspecto, revierte ese caso puntual.

PARTE B — Corregir rounded-full que viola rounded-none, SÓLO en barras y tracks (NO en circulares, exentos por design_guidelines.md:99-101). Cambia rounded-full a rounded-none ÚNICAMENTE en estas 4 ubicaciones:
- client/src/components/ui/slider.tsx línea 18: el SliderPrimitive.Track (la barra) → rounded-none. NO toques el Thumb de la línea 21 (circular h-5 w-5, debe quedar rounded-full).
- client/src/components/ui/progress.tsx línea 15: la barra de progreso (h-4 w-full) → rounded-none.
- client/src/components/ui/scroll-area.tsx línea 41: el ScrollAreaThumb → rounded-none.
- client/src/components/ui/drawer.tsx línea 51: el handle superior del drawer (h-2 w-[100px]) → rounded-none.

NO modifiques switch.tsx, radio-group.tsx, avatar.tsx, carousel.tsx ni el Thumb del slider: son circulares legítimos y la guía los exime.

Verifica visualmente: un Progress y un Slider deben mostrar la barra con esquinas rectas; el thumb del slider sigue redondo. No cambies colores ni tamaños, sólo el border-radius indicado. Compila con `npm run check`.
```

- **Aceptación:** `grep -rhoE "(bg|text|border)-gray-[0-9]" client/src | wc -l` baja claramente respecto a 68. `grep -n rounded-full client/src/components/ui/progress.tsx` no devuelve la barra (línea 15); `grep -n rounded-none client/src/components/ui/progress.tsx` sí. Idem slider.tsx línea 18 (Track) ahora rounded-none pero línea 21 (Thumb) sigue rounded-full; scroll-area.tsx:41 y drawer.tsx:51 rounded-none. Visualmente: barra de Progress y Track de Slider con esquinas rectas; thumb del slider, switch, radio y avatares siguen redondos. App compila (`npm run check`).
- **Riesgo / cuidado:** Igual que el lote de hex: los tokens muted/card/muted-foreground/border cambian de valor entre claro y oscuro (index.css .dark, bloque desde línea 132), así que verifica AMBOS modos al reemplazar gray-*. En la Parte B, NO confundir track con thumb: cambiar el thumb (slider.tsx:21, h-5 w-5) a rounded-none deformaría el control. Los componentes en ui/ son shadcn compartidos: un cambio aquí afecta TODOS los usos en la app, así que revisa un par de páginas que usen Slider/Progress/ScrollArea/Drawer antes de cerrar. El track del switch (switch.tsx:12) es un pill h-7 w-12 que por convención queda rounded-full — NO tocarlo.

### ☐ P4-7 — Reemplazar console.log de producción por logger con flag DEBUG (116 ocurrencias: 5 en client/src, 111 en server)
- **Severidad:** menor · **Dominio:** Calidad Frontend + Design System (client/src) — Von Wobeser y Sierra (Replit)
- **Hallazgo:** Hay 116 console.log en el repo (CORRECCIÓN AL BRIEF confirmada: no 118 en client; son 5 en client/src y 111 en server/). Estos logs corren en producción y ensucian la salida. Ya existe un helper log() en server/index.ts:38 que añade timestamp y source, pero internamente llama console.log incondicionalmente (línea 46). Solución: centralizar en un logger con flag DEBUG: en server, hacer que log() (y un debug() nuevo) respeten NODE_ENV/DEBUG; en client, crear un util mínimo que silencie en producción. Top server: routes.ts 16, AgentOrchestrator.ts 15, WebsiteAuditorAgent.ts 13, seed.ts 11, SystemHealthCheck.ts 9, PCloudStorage.ts 9, AutoRecoveryAgent.ts 8. Client (5): usePipelineProgress.ts:82,114; systemManifest.ts:1663; AdminArticleProcessing.tsx:558,566. NO tocar console.error (170 en server) ni console.warn (2 en server) — deben seguir visibles.
- **Evidencia:** `grep -rE "console\.log" client/src | wc -l` = 5; `grep -rE "console\.log" server | wc -l` = 111; total 116. Helper: server/index.ts:38 `export function log(message: string, source = "express") {` y :46 `console.log(...)` (incondicional). Client: client/src/hooks/usePipelineProgress.ts:82 `console.log('[Pipeline WS] Connected')`, :114 `console.log('[Pipeline WS] Disconnected')`, client/src/lib/systemManifest.ts:1663 `console.log(\`[SystemManifest] Agent inventory validated...\`)`, client/src/pages/admin/AdminArticleProcessing.tsx:558,566. Top server (grep -rcE): server/routes.ts 16, server/agents/core/AgentOrchestrator.ts 15, server/agents/specialized/WebsiteAuditorAgent.ts 13, server/seed.ts 11, server/agents/SystemHealthCheck.ts 9, server/agents/storage/PCloudStorage.ts 9, server/agents/AutoRecoveryAgent.ts 8. console.error server = 170, console.warn server = 2 (no tocar).
- **Archivos:** server/index.ts, server/routes.ts, server/agents/core/AgentOrchestrator.ts, server/agents/specialized/WebsiteAuditorAgent.ts, client/src/lib/logger.ts, client/src/hooks/usePipelineProgress.ts, client/src/pages/admin/AdminArticleProcessing.tsx

**Fix / prompt:**

```
Centraliza el logging detrás de un flag DEBUG para que los console.log no aparezcan en producción. Dos partes.

PARTE A — Servidor. En server/index.ts, modifica la función log() (línea 38) para que sólo escriba cuando el logging esté habilitado: al inicio agrega `const enabled = process.env.NODE_ENV !== 'production' || process.env.DEBUG === 'true'; if (!enabled) return;` antes del console.log de la línea 46. Crea y exporta en el mismo archivo: `export function debug(message: string, source = 'app') { if (process.env.DEBUG === 'true') { log(message, source); } }`. Luego reemplaza los console.log de depuración del servidor por log()/debug() importados desde './index' (o la ruta relativa correcta hacia server/index.ts). Prioriza por volumen: server/routes.ts (16), server/agents/core/AgentOrchestrator.ts (15), server/agents/specialized/WebsiteAuditorAgent.ts (13), server/seed.ts (11), server/agents/SystemHealthCheck.ts (9), server/agents/storage/PCloudStorage.ts (9), server/agents/AutoRecoveryAgent.ts (8). IMPORTANTE: NO toques console.error ni console.warn (errores deben seguir visibles); sólo migra console.log informativos/de depuración. Los console.log de eventos operativos importantes (arranque del servidor, migraciones, seed) pueden quedar como log() incondicional, no escondidos tras DEBUG.

PARTE B — Cliente. Crea client/src/lib/logger.ts con: `const isDev = import.meta.env.DEV; export const logger = { debug: (...a: unknown[]) => { if (isDev) console.log(...a); }, warn: (...a: unknown[]) => console.warn(...a), error: (...a: unknown[]) => console.error(...a) };`. (import.meta.env.DEV es de Vite; este proyecto usa Vite — válido sólo en código de cliente.) Reemplaza los 5 console.log de client/src por logger.debug(...): client/src/hooks/usePipelineProgress.ts:82 y :114; client/src/lib/systemManifest.ts:1663; client/src/pages/admin/AdminArticleProcessing.tsx:558 y :566. No toques console.error existentes en el cliente.

Verifica que el build pasa (`npm run build` = tsx script/build.ts, `npm run check` = tsc) y que en producción (NODE_ENV=production, sin DEBUG) la salida ya no muestra los logs de depuración.
```

- **Aceptación:** Con NODE_ENV=production y sin DEBUG, arrancar el servidor NO imprime los logs de depuración migrados; con DEBUG=true sí aparecen. `grep -rE "console\.log" client/src | wc -l` baja de 5 hacia 0 (los 5 migrados a logger.debug). `grep -rcE "console\.log" server/routes.ts server/agents/core/AgentOrchestrator.ts` baja respecto a 16 y 15. console.error y console.warn permanecen intactos (`grep -rE "console\.error" server | wc -l` sigue en 170; console.warn en 2). El build (`npm run build`) y el arranque (`npm run dev`) funcionan.
- **Riesgo / cuidado:** No silenciar console.error/console.warn — perder trazas de error en producción sería peor que el ruido (server tiene 170 console.error y 2 console.warn; déjalos). Verificar que los imports de log/debug en cada archivo del servidor usen la ruta relativa correcta hacia server/index.ts (p.ej. desde server/agents/core/ son '../../index') para no romper el build. En el cliente, import.meta.env.DEV es de Vite y sólo funciona en código del cliente; no usarlo en server/. Hazlo por tandas (server primero, client después) y compila entre tandas con tsc. Algunos console.log del servidor son logs de arranque/seed legítimos (server/index.ts, server/seed.ts): déjalos como log() incondicional, no los escondas tras DEBUG.

## P5 · i18n/SEO/A11y

### ☐ P5-1 — Páginas de detalle (4) sin metadata SEO: title, canonical, hreflang, Open Graph
- **Severidad:** mayor · **Dominio:** i18n + Accesibilidad + SEO (P5)
- **Hallazgo:** Las 4 páginas de detalle dinámicas — TeamMemberDetail, NewsDetail, PracticeGroupDetail, IndustryGroupDetail — NO usan el componente SEOHead, NO fijan document.title, y NO emiten canonical/hreflang/Open Graph (verificado: grep SEOHead=0 y document.title=0 en las 4). Son rutas reales y crawleables. CORRECCIÓN al mapeo de líneas de App.tsx: las líneas son 143/145/147/149 pero el orden real es 143=/practice-groups/:slug, 145=/industry-groups/:slug, 147=/team/:slug, 149=/news/:slug (el hallazgo original las listaba en orden equivocado). De hecho aparecen en el sitemap dinámico (routes.ts 835-874). Resultado: cada perfil/noticia/grupo comparte el <title> heredado de la página previa y carece de canónica y alternates. SEOHead ya existe y es sólido: genera 10 hreflang + x-default vía SUPPORTED_LANGUAGES (SEOHead.tsx 684-696), devuelve null y hace todo su trabajo en un useEffect, y acepta customTitle/customDescription/customPath/customImage (SEOHead.tsx 582-606). Solo falta cablearlo en estas 4 plantillas.
- **Evidencia:** client/src/pages/PracticeGroupDetail.tsx:224 'const { language } = useLanguage()'; IndustryGroupDetail.tsx:56 idem; TeamMemberDetail.tsx:535 'const { language } = useLanguage()' y <h1> en :1323 sin document.title; NewsDetail.tsx:83/152 useLanguage, sin document.title/SEOHead. CORRECCIÓN: los 4 archivos YA importan useLanguage (TeamMemberDetail:15, NewsDetail:16, PracticeGroupDetail:12, IndustryGroupDetail:10), no solo 2. Contraste: las páginas índice (About/Team/News) sí montan SEOHead. SEOHead.tsx:582-589 acepta customTitle/customDescription/customPath/customImage; seoConfig contiene las claves team(94), news(175), practiceGroups(121), industryGroups(148). Cada página tiene guards 'if (isLoading)' e 'if (error)' que retornan antes del return principal, así que el dato está garantizado cargado en el JSX principal.
- **Archivos:** client/src/pages/TeamMemberDetail.tsx, client/src/pages/NewsDetail.tsx, client/src/pages/PracticeGroupDetail.tsx, client/src/pages/IndustryGroupDetail.tsx, client/src/components/SEOHead.tsx

**Fix / prompt:**

```
En client/src/pages/, agrega metadata SEO por-página a las 4 plantillas de detalle que hoy NO la tienen: TeamMemberDetail.tsx, NewsDetail.tsx, PracticeGroupDetail.tsx, IndustryGroupDetail.tsx. NO crees un componente nuevo: reutiliza el existente client/src/components/SEOHead.tsx vía sus props customTitle, customDescription, customPath, customImage. SEOHead devuelve null y aplica los efectos en un useEffect, así que basta montarlo en el árbol. Para cada una de las 4 páginas: (1) importa SEOHead desde '@/components/SEOHead'. NO agregues import de useLanguage: las 4 páginas YA importan useLanguage y exponen 'const { language } = useLanguage()' (TeamMemberDetail:535, NewsDetail:83, PracticeGroupDetail:224, IndustryGroupDetail:56); reutiliza esa variable 'language'. (2) Coloca el <SEOHead> DENTRO del return JSX principal (el último 'return (...)', que está DESPUÉS de los guards 'if (isLoading)' y 'if (error)'), para que solo se monte cuando el registro ya cargó y nunca fije un title vacío. Pon <SEOHead page="team" language={language} customTitle={...} customDescription={...} customPath={...} customImage={...} /> al inicio de ese JSX. (3) Usa como prop page la clave de seoConfig correspondiente (existen exactamente: 'team' para TeamMemberDetail, 'news' para NewsDetail, 'practiceGroups' para PracticeGroupDetail, 'industryGroups' para IndustryGroupDetail) — sirve de fallback porque customTitle/customDescription/customPath lo sobrescriben. (4) customTitle: nombre/título real del registro + ' | Von Wobeser y Sierra'. Para TeamMemberDetail usa member.name (el nombre de persona NO se traduce): `${member.name} | Von Wobeser y Sierra`. Para NewsDetail usa el título traducido del idioma activo; para Practice/Industry el name traducido. PATRÓN DE TRADUCCIÓN OBLIGATORIO (el codebase usa columnas base inglesa + columna *Es + hook): para title de news usa `language === 'es' ? (newsArticle.titleEs || newsArticle.title) : (newsArticle.title || newsArticle.titleEs)`; para name de grupos `language === 'es' ? (group.nameEs || group.name) : (group.name || group.nameEs)`. NO uses únicamente la columna en español cruda para todos los idiomas. (5) customDescription: usa el campo descriptivo traducido del idioma activo, truncado a ~160 chars. Para TeamMemberDetail usa bio (`language === 'es' ? (member.bioEs || member.bio) : (member.bio || member.bioEs)`); para NewsDetail usa excerpt (excerptEs/excerpt con el mismo patrón); para Practice/Industry usa description (descriptionEs/description). Si el campo es null, cae a una descripción genérica traducida. (6) customPath: la ruta canónica EXACTA de ESE registro con el slug que ya consume la ruta wouter: `/team/${member.slug}`, `/news/${newsArticle.slug}`, `/practice-groups/${practiceGroup.slug}`, `/industry-groups/${industryGroup.slug}`. (7) customImage: el campo es imageUrl en todos los registros (member.imageUrl / newsArticle.imageUrl / practiceGroup.imageUrl / industryGroup.imageUrl). Open Graph exige URL ABSOLUTA: si imageUrl ya empieza por 'http' pásalo tal cual; si es ruta relativa (ej '/uploads/...') concaténala con 'https://www.vonwobeser.com' antes de pasarla; si es null/undefined OMITE la prop (SEOHead usará DEFAULT_IMAGE). NO toques SEOHead.tsx ni el resto de páginas.
```

- **Aceptación:** Navegar a un perfil (ej /team/<slug>) y verificar en DevTools que document.title contiene el nombre del abogado, que existe <link rel="canonical" href="https://www.vonwobeser.com/team/<slug>">, que hay 10 <link rel="alternate" hreflang=...> + x-default, y meta og:title/og:url/og:image correctos (og:image con URL absoluta). Repetir para /news/<slug>, /practice-groups/<slug>, /industry-groups/<slug>. Cambiar de idioma y confirmar que title (en news/grupos), description y og:locale se actualizan al idioma activo (no quedan en español crudo). Antes del fix los 4 mostraban el title heredado de la página anterior.
- **Riesgo / cuidado:** DEPENDENCIA B3: si B3 agregó nuevos campos o nuevas páginas de detalle, inclúyelas en el mismo patrón. RIESGO TRADUCCIÓN: si el agente usa la columna en español cruda (titleEs/bioEs/nameEs/descriptionEs) para TODOS los idiomas, la metadata quedará monolingüe — usar el patrón es/base mostrado. RIESGO IMAGEN RELATIVA: pasar imageUrl relativo a og:image produce una URL inválida para los crawlers; convertir a absoluta o omitir. RIESGO TITLE VACÍO: montar SEOHead antes de los guards isLoading/error fijaría un title vacío durante el loading — montarlo SOLO en el return principal (post-guards). Como member.name es nombre de persona, NO aplicarle el patrón de traducción.

### ☐ P5-2 — El sitemap.xml SERVIDO es dinámico, sin hreflang y le faltan 7 páginas; el sitemap estático con hreflang está muerto; el robots dinámico pierde Disallow /admin y la allowlist de AI-crawlers
- **Severidad:** mayor · **Dominio:** i18n + Accesibilidad + SEO (P5)
- **Hallazgo:** Hay DOS sitemaps en conflicto. El archivo estático public/sitemap.xml tiene hreflang rico (homepage con 10 alternates + x-default, líneas 9-19) PERO NUNCA se sirve: Vite usa client/ como root (vite.config.ts:29) por lo que su publicDir por defecto es client/public/ (verificado: client/public/ NO contiene sitemap.xml/robots.txt), y los archivos están en el public/ de nivel superior, así que NO se copian a dist/public (verificado: dist/public/sitemap.xml y dist/public/robots.txt NO existen). Además Express registra la ruta dinámica app.get('/sitemap.xml') en routes.ts:795 ANTES de serveStatic (server/index.ts:76 registerRoutes vs :90 serveStatic), de modo que la ruta dinámica gana. Ese sitemap dinámico (routes.ts:876-877) NO emite hreflang (urlset sin xmlns:xhtml) y su lista staticPages (routes.ts:800-814) OMITE 7 páginas que sí son rutas con SEOHead: /careers/interns, /diversity-inclusion, /pro-bono, /german-desk, /articles, /newsletter, /events. El robots.txt dinámico (routes.ts:780-792) hace Disallow /api/ pero NO bloquea /admin/ ni /api/admin/ y ADEMÁS pierde la allowlist de AI-crawlers (GPTBot, ChatGPT-User, Google-Extended, Anthropic-AI, Claude-Web, Bingbot, Googlebot) y el Crawl-delay que sí tiene el archivo estático public/robots.txt. La fuente de verdad real es la dinámica; hay que arreglar ESA.
- **Evidencia:** routes.ts:795 'app.get("/sitemap.xml", async (_req, res) => {'; routes.ts:800-814 staticPages omite las 7; routes.ts:876-877 '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' (sin xmlns:xhtml, sin hreflang); server/index.ts:76 registerRoutes antes de serveStatic :90; vite.config.ts:29 root=client; bash confirmó dist/public/sitemap.xml y robots.txt NO existen y client/public/ no los contiene; public/sitemap.xml estático con hreflang completo (líneas 9-19) queda inerte; routes.ts:780-792 robots dinámico solo con Disallow /api/ y Sitemap; public/robots.txt estático tiene Disallow /admin/, /api/admin/, Allow de secciones, Crawl-delay y 7 User-agents de AI-crawlers.
- **Archivos:** server/routes.ts, public/sitemap.xml, public/robots.txt

**Fix / prompt:**

```
Edita server/routes.ts para que el sitemap dinámico servido en app.get('/sitemap.xml') (línea ~795) sea completo y con hreflang, y el robots.txt dinámico (línea ~780) recupere las directivas del archivo estático. SITEMAP: (1) En el array staticPages (líneas ~800-814) AGREGA las 7 páginas faltantes: { loc: '/careers/interns', changefreq: 'monthly', priority: '0.6' }, { loc: '/diversity-inclusion', changefreq: 'monthly', priority: '0.6' }, { loc: '/pro-bono', changefreq: 'monthly', priority: '0.6' }, { loc: '/german-desk', changefreq: 'monthly', priority: '0.7' }, { loc: '/articles', changefreq: 'weekly', priority: '0.7' }, { loc: '/newsletter', changefreq: 'monthly', priority: '0.6' }, { loc: '/events', changefreq: 'weekly', priority: '0.7' }. (2) En la plantilla del urlset (línea ~877) declara el namespace xhtml: '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'. (3) Define al inicio del handler: const HREFLANGS = ['en','es-MX','de','zh-CN','ko','ja','ar','ru','fr','it']; (exactamente los valores de HREFLANG_CODES en SEOHead.tsx:7-18). (4) SOLO en el loop 'for (const page of staticPages)' (líneas ~825-833), dentro del bloque <url>, después de <loc> agrega una iteración sobre HREFLANGS que emita por cada code '<xhtml:link rel="alternate" hreflang="'+code+'" href="'+baseUrl+page.loc+'"/>' más una línea final '<xhtml:link rel="alternate" hreflang="x-default" href="'+baseUrl+page.loc+'"/>'. Todos los href apuntan a la misma loc (SPA con detección por cliente), igual que hace SEOHead. NO modifiques los loops de detalle (team/practice-groups/industry-groups/news, líneas ~835-874) — déjalos sin hreflang por ahora. Mantén el try/catch existente (líneas ~796/882). ROBOTS: (5) En app.get('/robots.txt') (línea ~780) reemplaza el template para que, bajo 'User-agent: *', incluya además de 'Disallow: /api/': 'Disallow: /admin/' y 'Disallow: /api/admin/', y RECUPERA del archivo estático las directivas perdidas: las líneas 'Allow: /practice-groups/', '/industry-groups/', '/team/', '/news/', '/events/', '/articles/', 'Crawl-delay: 1', y los bloques de User-agent para GPTBot, ChatGPT-User, Google-Extended, Anthropic-AI, Claude-Web, Bingbot y Googlebot (cada uno con 'Allow: /'). Mantén la línea 'Sitemap: https://www.vonwobeser.com/sitemap.xml'. (6) Tras el cambio, ELIMINA o renombra a .obsolete los archivos public/sitemap.xml y public/robots.txt para que nadie los confunda con la fuente servida.
```

- **Aceptación:** curl -s https://<deploy>/sitemap.xml | grep -c 'hreflang' debe ser > 0 (antes 0). curl -s https://<deploy>/sitemap.xml | grep -E '/german-desk|/events|/articles|/newsletter|/pro-bono|/diversity-inclusion|/careers/interns' debe listar las 7. curl -s https://<deploy>/sitemap.xml | head -2 debe contener xmlns:xhtml. curl -s https://<deploy>/robots.txt debe contener 'Disallow: /admin/' Y al menos un 'User-agent: Anthropic-AI'. Validar el XML en https://www.xml-sitemaps.com/validate-xml-sitemap.html sin errores.
- **Riesgo / cuidado:** NO agregar rutas /admin al sitemap. Mantener el try/catch y los template strings + Promise.all sobre storage existentes (routes.ts:816-821). Si B3 agregó nuevas páginas índice, añadirlas también a staticPages. El archivo estático public/sitemap.xml NO debe quedar como fuente alterna que alguien suba a producción por error. Al recuperar la allowlist de AI-crawlers en robots, respetar el orden: el bloque 'User-agent: *' primero con sus Disallow/Allow/Crawl-delay, luego el Sitemap, luego los User-agents específicos.

### ☐ P5-3 — RTL para árabe solo a nivel <html dir>; faltan inversiones de layout — el trabajo real es Header (Footer ya es RTL-safe)
- **Severidad:** menor · **Dominio:** i18n + Accesibilidad + SEO (P5)
- **Hallazgo:** El soporte RTL para árabe se limita a fijar dir='rtl' en <html> cuando language==='ar' (LanguageContext.tsx:158-162). Con Tailwind, las clases físicas (ml-/mr-/pl-/pr-/left-/right-/text-left/text-right) NO se invierten con dir='rtl'. CORRECCIÓN al alcance: Header.tsx SÍ usa clases físicas que quedan en el lado equivocado en árabe (text-left en :60/:100/:134/:168/:654/:664/:677, left-0 en dropdown :396, right-0 en panel de búsqueda :453, pl-4 en :651). PERO Footer.tsx (785 líneas) NO usa NINGUNA clase física direccional — solo gap-/items-/justify-/mx-/px-/grid, todas simétricas y RTL-safe vía flex+dir; convertir Footer sería un no-op. Por tanto el trabajo se concentra en Header.tsx; Footer solo necesita verificación visual. Solo not-found.tsx tiene dir a nivel componente (:76/:79). index.html:2 <html lang="en"> sin dir inicial. No existe checklist ni captura RTL.
- **Evidencia:** LanguageContext.tsx:158-162 setea dir rtl/ltr; Header.tsx clases físicas: text-left :60/:100/:134/:168/:654/:664/:677, left-0 :396, right-0 :453, pl-4 :651, y la barra fija full-width 'top-0 left-0 right-0' en :322 (esta ES simétrica, NO convertir). Footer.tsx: grep de ml-/mr-/pl-/pr-/left-/right-/space-x-/text-left/text-right = 0 coincidencias; solo gap-3/items-start/items-center/justify-center/mx-auto/px-* (líneas 530-640). not-found.tsx:76 'const isRTL = language === "ar"', :79 dir={isRTL?...}. index.html:2 '<html lang="en">'. package.json:116 tailwindcss ^3.4.17 (soporta utilidades lógicas ms-/me-/ps-/pe-/start-/end-, introducidas en 3.3).
- **Archivos:** client/src/components/Header.tsx, client/src/components/Footer.tsx, client/src/RTL-CHECKLIST.md

**Fix / prompt:**

```
Mejora el soporte RTL para árabe sin reescribir el layout, concentrándote en Header.tsx (Footer ya es RTL-safe). Paso 1 (CSS lógico en Header.tsx): reemplaza las utilidades FÍSICAS por sus equivalentes LÓGICAS de Tailwind para que respeten dir automáticamente — Tailwind 3.4.17 ya las soporta, NO instales nada: text-left -> text-start (líneas ~60, ~100, ~134, ~168, ~654, ~664, ~677), pl-4 -> ps-4 (~651). Paso 2 (posicionamiento de overlays): el dropdown de submenú con 'left-0' (~396) -> 'start-0', y el panel de búsqueda con 'right-0' (~453) -> 'end-0'. IMPORTANTE: NO conviertas la barra de header fija de la línea ~322 ('fixed top-0 left-0 right-0') — ese left-0 right-0 es full-width simétrico y debe quedar igual. NO cambies clases simétricas (justify-center, gap-X, mx-X, px-X, items-*) ni colores/tamaños. Paso 3 (Footer): solo VERIFICA visualmente Footer.tsx en árabe; NO necesita cambios de clases porque no usa utilidades físicas direccionales (su layout flex/grid se invierte solo con dir=rtl). Paso 4 (checklist): crea client/src/RTL-CHECKLIST.md con verificación visual para árabe que cubra: header (logo al lado correcto, nav fluye derecha-a-izquierda), dropdown de idioma (alineado al borde correcto), menú móvil (hamburguesa y panel del lado correcto), footer (columnas e iconos sociales), botones icono+texto (icono al lado correcto), y breadcrumbs/paginación. NO toques LanguageContext.tsx (el dir a nivel <html> ya es correcto). NO instales librerías ni apliques transform 'direction' por CSS que espeje iconos/imágenes.
```

- **Aceptación:** Cambiar idioma a árabe (العربية) y verificar en el navegador: (1) <html dir="rtl"> presente; (2) logo y navegación del header fluyen derecha-a-izquierda con espaciados correctos y el text-start alinea bien; (3) dropdown de idioma y menú móvil abren del lado correcto, el panel de búsqueda (antes right-0/ahora end-0) queda al borde correcto; (4) footer alinea columnas e iconos correctamente (sin cambios de código, debe verse bien por flex+dir); (5) la barra de header sigue full-width (no se rompió). Volver a es/en y confirmar que NADA cambió de aspecto (las utilidades lógicas son idénticas a las físicas en LTR). RTL-CHECKLIST.md existe y cubre los 6 puntos.
- **Riesgo / cuidado:** Riesgo de regresión en LTR: las utilidades lógicas (text-start/ps-/start-/end-) son idénticas a las físicas en LTR, así que NO deben cambiar el aspecto en es/en — verificar visualmente. NO convertir el 'left-0 right-0' de la barra fija (:322): es full-width simétrico y convertirlo no aporta y podría confundir. Tailwind 3.4.17 ya trae utilidades lógicas, así que NO se necesita el fallback de variantes rtl: explícitas ni instalar plugins. Limitar el alcance a Header.tsx (más el checklist) para no tocar 24 páginas.

### ☐ P5-4 — Fallback pt->es / PT->en YA está documentado; solo queda la recomendación de soportar portugués
- **Severidad:** menor · **Dominio:** i18n + Accesibilidad + SEO (P5)
- **Hallazgo:** El brief pedía 'documentar o resolver' el fallback de Brasil/Portugal en COUNTRY_TO_LANGUAGE. Verificado: YA está documentado de forma deliberada. BR→es lleva comentario explicando que portugués ('pt') aún no es idioma de UI y que se debe remapear cuando existan traducciones (routes.ts:269-270); PT→en lleva su propio comentario equivalente (routes.ts:294). Punto ya resuelto a nivel de documentación. Lo único pendiente es la decisión de producto: agregar 'pt' como 11º idioma (i18n.ts, schema SUPPORTED_LANGUAGES, parseAcceptLanguage, HREFLANG/OG codes). Trabajo mayor y opcional, no un bug. NOTA: el código usa la flecha Unicode '→' (BR→es), no '->'.
- **Evidencia:** server/routes.ts:269-270 '// BR→es is a deliberate fallback: Portuguese ("pt") is not yet a supported UI language. // When Portuguese translations are added, remap BR to "pt".'; routes.ts:273 'BR: "es"'; routes.ts:294 'PT: "en", // PT→en fallback: "pt" is not yet a supported UI language; remap when Portuguese translations are added'; parseAcceptLanguage routes.ts:303 lista 10 idiomas sin pt; shared/schema.ts:608-619 SUPPORTED_LANGUAGES con 10 entradas (líneas 609-618) sin pt. i18n.ts:548-567 tiene resources con es/en + supportedLngs de 10 idiomas (sin pt).
- **Archivos:** replit.md, server/routes.ts

**Fix / prompt:**

```
NO se requiere ningún cambio de código urgente: el fallback ya está correctamente documentado en server/routes.ts (líneas 269-270 para BR→es y línea 294 para PT→en). Solo registra esta decisión: edita replit.md y agrega una nota corta bajo una sección de i18n que diga: 'Portugués (pt) NO es idioma de UI soportado. Brasil (BR) hace fallback a español y Portugal (PT) a inglés, por diseño. Para soportar portugués en el futuro se debe: (1) agregar el bloque ptCommon en client/src/i18n.ts y registrarlo en resources + supportedLngs (hoy en i18n.ts:548-567), (2) agregar { code: "pt", name: "Portuguese", nameNative: "Português" } en shared/schema.ts SUPPORTED_LANGUAGES (hoy 10 entradas, líneas 609-618), (3) agregar "pt" al array supported de parseAcceptLanguage en routes.ts:303, (4) agregar pt a HREFLANG_CODES y OG_LOCALE_CODES en SEOHead.tsx:7-31 (pt-BR / pt_BR) y al HTML_LANG_CODES de LanguageContext.tsx, (5) remapear BR->pt y PT->pt en COUNTRY_TO_LANGUAGE (routes.ts:273 y :294).' NO agregues portugués ahora a menos que el cliente lo pida explícitamente — solo documenta la ruta de upgrade.
```

- **Aceptación:** replit.md contiene la nota de decisión sobre pt y los 5 pasos de upgrade. CORRECCIÓN del comando de verificación: grep 'is not yet a supported UI language' server/routes.ts debe seguir devolviendo 2 coincidencias (NO usar 'pt is not yet a supported', que devuelve 0 porque el texto real intercala '")' entre pt e is). No hay cambio funcional en /api/detect-language: un IP de Brasil sigue devolviendo language:'es' y uno de Portugal language:'en'.
- **Riesgo / cuidado:** NO agregar 'pt' a parseAcceptLanguage o a SUPPORTED_LANGUAGES sin crear el bloque ptCommon completo en i18n.ts: si se declara pt como soportado sin traducciones, i18next caería al fallback 'es' pero el dropdown ofrecería Português vacío — inconsistente. Tratar el soporte de portugués como tarea mayor separada. Al editar replit.md no toques los comentarios de routes.ts (deben permanecer las 2 coincidencias de 'is not yet a supported UI language').

### ☐ P5-5 — Accesibilidad alt/aria-hidden CONSISTENTE — sólido; el guard rail recomendado debe ser A11Y-GUIDELINES.md porque NO existe ESLint en el repo
- **Severidad:** menor · **Dominio:** i18n + Accesibilidad + SEO (P5)
- **Hallazgo:** Auditado el conjunto: 52 etiquetas <img> en client/src, CERO sin atributo alt (verificado con regex multilínea consciente de <img ... />). 20 imágenes decorativas usan alt="". Los iconos decorativos (lucide-react) usan aria-hidden="true" de forma consistente: 74 ocurrencias, incluyendo todos los iconos de Footer.tsx (:553/:563/:572/:583/:604/:614/:624) y Header.tsx (:64/:387/:447/:570/:607/:637). Los controles interactivos del header tienen aria-labels traducidos vía t('common.aria.*'), t('common.openMenu'), etc. (Header.tsx:334/:355/:403/:443/:456...). Conclusión: la accesibilidad de imágenes/iconos está bien y NO necesita rework. CORRECCIÓN al guard rail: el repo NO tiene NINGUNA config de ESLint (ni client/.eslintrc.cjs, ni root, ni eslint.config.js) ni dependencia 'eslint' en package.json, y NO existe client/package.json (es un único package.json raíz, Vite root=client). Por tanto los archivos client/.eslintrc.cjs y client/package.json que listaba el lote NO EXISTEN, y la ruta 'añade el plugin a tu extends existente' es inaplicable. La ruta segura es A11Y-GUIDELINES.md; agregar ESLint desde cero es trabajo mayor con riesgo de romper el build de Replit.
- **Evidencia:** Conteo verificado: 52 <img> totales en client/src, 0 sin alt, 20 con alt="" (regex multilínea Python sobre <img\b...>); 74 aria-hidden en client/src; Footer.tsx:553/563/572/583/604/614/624 iconos con aria-hidden="true"; Header.tsx:64/387/447/570/607/637 aria-hidden="true"; Header aria-labels traducidos :334/:355/:403/:443/:456/:467/:475; i18n.ts:156-178 bloque common con mainNav/mobileNav/openSearch/openMenu/closeMenu/aria.* traducido. CORRECCIÓN crítica: NO existe client/package.json, NI client/.eslintrc.cjs, NI eslint.config.js en client/ o raíz, NI dependencia 'eslint' en package.json (verificado con ls + grep).
- **Archivos:** client/src/A11Y-GUIDELINES.md

**Fix / prompt:**

```
NO se requiere reparación: la accesibilidad de imágenes e iconos ya es consistente (52 img, 0 sin alt, 20 decorativas con alt="", 74 aria-hidden, aria-labels traducidos). Para EVITAR regresiones cuando se agreguen componentes nuevos (incluidas features de B3), RUTA PRIMARIA (segura, recomendada): crea client/src/A11Y-GUIDELINES.md con las reglas: (1) 'Toda <img> debe tener atributo alt: descriptivo si aporta información, o alt="" si es puramente decorativa.' (2) 'Todo icono puramente decorativo (lucide-react dentro de botones/enlaces con texto) debe tener aria-hidden="true".' (3) 'Todo control interactivo sin texto visible (botón solo-icono) debe tener aria-label traducido vía t("common.aria.*") o equivalente; no hardcodear strings.' RUTA OPCIONAL (solo si el cliente quiere lint automatizado y acepta el riesgo): NOTA — el repo NO tiene ESLint configurado (no hay .eslintrc ni eslint.config.js ni dependencia eslint, y NO existe client/package.json; es monorepo de un package.json raíz). Configurar ESLint desde cero NO es trivial: requiere agregar eslint + @typescript-eslint + eslint-plugin-react + eslint-plugin-jsx-a11y al package.json raíz y crear un eslint.config.js (flat config) o .eslintrc.cjs en la raíz con parserOptions para TSX. Si se hace, activa al menos 'jsx-a11y/alt-text', 'jsx-a11y/aria-props', 'jsx-a11y/role-has-required-aria-props' y 'jsx-a11y/anchor-has-content' a nivel 'warn' (nunca 'error', para no bloquear el build por warnings preexistentes en componentes admin). Si la instalación falla o rompe el build de Replit, NO forzar: bastará con A11Y-GUIDELINES.md. NO modifiques componentes existentes en ningún caso.
```

- **Aceptación:** Ruta primaria: A11Y-GUIDELINES.md existe con las 3 reglas (img/alt, icono/aria-hidden, control/aria-label traducido). Ruta opcional (si se agregó ESLint): ejecutar el linter y confirmar 0 errores nuevos en el código actual (debe pasar limpio porque ya cumple), y que una <img> sin alt agregada deliberadamente dispara warning jsx-a11y/alt-text. En ambos casos, ningún componente existente cambia de comportamiento.
- **Riesgo / cuidado:** El repo no tiene ESLint: agregarlo es más invasivo de lo que sugería el lote original (toca package.json raíz, añade 4+ dependencias dev y un config nuevo) y puede chocar con la toolchain de Vite/TS del proyecto o ralentizar el build de Replit. Preferir A11Y-GUIDELINES.md por defecto. Si se agrega ESLint, NO subir reglas a 'error' (warnings preexistentes en admin bloquearían el build) y NO crear archivos en client/ (no hay package.json ahí). NO modificar componentes existentes — el objetivo es solo prevención en código futuro.

## P6 · Build/Config/Replit

### ☐ P6-1 — Des-trackear cruft ya commiteado (gitignore no basta) incluyendo .canvas/ y debug PNGs de raíz
- **Severidad:** mayor · **Dominio:** BUILD / CONFIG / CRUFT / REPLIT-ESPECÍFICO (P6)
- **Hallazgo:** El .gitignore (verificado, 42 líneas) ya contiene reglas para node_modules, dist, .env*, uploads/, .local/, .canvas/ (línea 12), exports/, *.tar.gz, *.zip, /*.png (línea 34, SOLO raíz), benchmarking JSON, Pasted txt, articles_extracted/, *.pdf y *.docx. PERO esas reglas no des-trackean archivos commiteados antes de existir la regla. Verificado con git ls-files: siguen TRACKEADOS 95 PDFs, 4 benchmarking-report JSON, 15 Pasted txt, 3 zips, 2 docx, 95 archivos en articles_extracted, 16 PNGs de debug en la raíz literal, y ADEMÁS 3 PNGs en .canvas/assets/ (asset_1322563969.png, asset_2030369146.png, asset_2104557484.png) que NO están git-ignored porque la regla /*.png solo cubre la raíz, no subcarpetas (confirmado con git check-ignore: devuelve 'not ignored'). La afirmación de '.gitignore incompleto' es parcialmente falsa: el archivo está bien redactado; el problema real es que faltó git rm --cached, MÁS que .canvas/assets/ quedó fuera de la cobertura de /*.png.
- **Evidencia:** .gitignore:12 '.canvas/'; .gitignore:34 '/*.png' (solo raíz); .gitignore:37-41 benchmarking/Pasted/articles_extracted/*.pdf/*.docx. git ls-files "attached_assets/*.pdf"=95; "attached_assets/benchmarking-report_*.json"=4; "attached_assets/Pasted--*.txt"=15; "attached_assets/*.zip"=3; "attached_assets/*.docx"=2; "attached_assets/articles_extracted"=95. git ls-files "*.png" SIN slash (raíz literal) = 16 archivos: about-page.png, after-escape.png, after-scroll.png, dropdown.png, events_section_ja.png, events_section_zh.png, footer_mobile.png, footer_mobile_clean.png, german_desk_mobile.png, header-screenshot.png, hero_mobile.png, language_dropdown_verify.png, mobile-logo-inspect.png, mobile_menu.png, page-after-logo-check.png, team-of-counsel.png. Además git ls-files ".canvas/" = 3 PNGs trackeados. 'git check-ignore .canvas/assets/asset_1322563969.png' devuelve no ignored.
- **Archivos:** .gitignore, attached_assets/, .canvas/assets/, about-page.png, header-screenshot.png

**Fix / prompt:**

```
En el repositorio Von Wobeser, varios archivos ya están (o deberían estar) ignorados por .gitignore pero SIGUEN trackeados en git porque se commitearon antes de existir la regla. .gitignore NO des-trackea archivos ya versionados; hay que usar 'git rm --cached'. Ejecuta EXACTAMENTE estos comandos en la raíz del proyecto, en este orden, SIN borrar los archivos del disco (la bandera --cached solo los saca del control de versiones):

1) git rm -r --cached --ignore-unmatch 'attached_assets/*.pdf' 'attached_assets/*.docx' 'attached_assets/*.zip' 'attached_assets/benchmarking-report_*.json' 'attached_assets/Pasted--*.txt'
2) git rm -r --cached --ignore-unmatch 'attached_assets/articles_extracted'
3) Des-trackea los 16 PNGs de debug en la raíz literal (lista exacta verificada, sin duplicados): git rm --cached --ignore-unmatch about-page.png after-escape.png after-scroll.png dropdown.png events_section_ja.png events_section_zh.png footer_mobile.png footer_mobile_clean.png german_desk_mobile.png header-screenshot.png hero_mobile.png language_dropdown_verify.png mobile-logo-inspect.png mobile_menu.png page-after-logo-check.png team-of-counsel.png
4) Des-trackea los 3 PNGs de .canvas/assets/ (están trackeados y NO los cubre la regla /*.png): git rm -r --cached --ignore-unmatch '.canvas'
5) Verifica que NINGÚN PNG indebido quede trackeado. Como image_1764710915519.png (que usa el Footer) DEBE seguir trackeado, usa este comando que excluye los assets legítimos y .canvas ya removido: 'git ls-files "*.png" | grep -vE "^(client|public|server|attached_assets)/"' y confirma que el resultado esté VACÍO (ya no debe quedar ningún .png ni en la raíz ni en .canvas).
6) NO toques nada dentro de client/, public/, server/ ni shared/. NO ejecutes git rm sobre 'attached_assets/image_1764710915519.png' (lo importa el Footer en client/src/components/Footer.tsx:7) ni sobre los demás assets de attached_assets referenciados por el código (collages, vwys_branded/, partner_photos/, mapa_*, logovw_*, chambers, Recurso_2, etc.).
7) Haz commit con mensaje 'chore: untrack ignored cruft (PDFs, debug PNGs, .canvas, articles_extracted, benchmarking, pasted)'. NO hagas git push hasta que el usuario lo apruebe.

IMPORTANTE: como --cached deja los archivos en el disco, el sitio sigue funcionando igual; solo dejan de versionarse a futuro.
```

- **Aceptación:** Tras los comandos: 'git ls-files "attached_assets/*.pdf"'=0; 'git ls-files "attached_assets/benchmarking-report_*.json"'=0; 'git ls-files "attached_assets/Pasted--*.txt"'=0; 'git ls-files "attached_assets/articles_extracted"'=0; 'git ls-files ".canvas/"'=0; 'git ls-files "*.png" | grep -vE "^(client|public|server|attached_assets)/"' devuelve VACÍO. 'git ls-files "attached_assets/image_1764710915519.png"' SIGUE devolviendo 1 (no se des-trackeó el asset del Footer). Los archivos siguen presentes en el disco ('ls attached_assets' y 'ls *.png' confirman). El sitio levanta con npm run dev sin errores de imports faltantes.
- **Riesgo / cuidado:** Usar SIEMPRE --cached: sin esa bandera borraría los archivos del disco y rompería scripts/extract-articles.ts (lee attached_assets/articles_extracted/) y el Footer (image_1764710915519.png). NUEVO: incluir el des-trackeo de .canvas/ (paso 4) porque la regla /*.png NO cubre subcarpetas y esos 3 PNGs quedaron versionados. NO confundir este lote con el borrado físico (P6-4): aquí los archivos PERMANECEN en disco. El git rm --cached NO reduce el tamaño del .git histórico (eso es P6-5), solo deja de versionar a futuro. La aceptación original usaba un grep que NO excluía attached_assets/ y por eso nunca habría pasado; usar el grep corregido del paso 5. No hacer push automático.

### ☐ P6-2 — Limpiar allowlist de script/build.ts: 9 deps fantasma + nombre de paquete genai roto
- **Severidad:** mayor · **Dominio:** BUILD / CONFIG / CRUFT / REPLIT-ESPECÍFICO (P6)
- **Hallazgo:** El allowlist de script/build.ts (lo que esbuild bundlea en lugar de marcar como external, para reducir cold start) contiene 9 entradas que NO están en package.json: axios, express-rate-limit, jsonwebtoken, nanoid, nodemailer, stripe, uuid, xlsx, y '@google/generative-ai'. Como esbuild calcula externals filtrando SOLO sobre deps de package.json (allDeps), esas 9 entradas no afectan el set de externals; son cruft que confunde. NOTA verificada: nanoid SÍ se importa en server/vite.ts:7 ('import { nanoid } from "nanoid"') pero como dep transitiva de vite (no está en package.json), nunca entra a allDeps, así que esbuild lo bundlea igual y quitarlo del allowlist es genuinamente no-op. PERO hay un bug real: el código usa '@google/genai' (server/services/SmartImageGenerator.ts:1) mientras el allowlist lista el nombre VIEJO '@google/generative-ai'. Como @google/genai SÍ está en package.json y NO está en el allowlist, esbuild lo marca como external en lugar de bundlearlo, anulando la optimización de cold start justo para el SDK de Gemini.
- **Evidencia:** script/build.ts:7-33 array allowlist. Líneas exactas: 8 '@google/generative-ai', 10 'axios', 17 'express-rate-limit', 19 'jsonwebtoken', 22 'nanoid', 23 'nodemailer', 27 'stripe', 28 'uuid', 30 'xlsx'. Verificado contra package.json: las 9 son PHANTOM (no aparecen). server/services/SmartImageGenerator.ts:1 'import { GoogleGenAI, Modality } from "@google/genai";'. package.json:14 '"@google/genai": "^1.32.0"' (existe) y NO existe '@google/generative-ai'. El filtro en script/build.ts:47 'const externals = allDeps.filter((dep) => !allowlist.includes(dep));' donde allDeps (líneas 43-46) = keys de dependencies + devDependencies de package.json. nanoid importado en server/vite.ts:7.
- **Archivos:** script/build.ts, package.json, server/services/SmartImageGenerator.ts, server/vite.ts

**Fix / prompt:**

```
Abre el archivo script/build.ts. En el array 'allowlist' (líneas 7 a 33) haz DOS cambios:

1) ELIMINA estas 9 líneas porque referencian paquetes que NO están en package.json (son cruft sin efecto sobre el cálculo de externals): 'axios', 'express-rate-limit', 'jsonwebtoken', 'nanoid', 'nodemailer', 'stripe', 'uuid', 'xlsx', y '@google/generative-ai'. (Aunque nanoid se importe en server/vite.ts, no está en package.json, así que no entra al filtro de externals y quitarlo no cambia nada: esbuild lo bundlea igual por ser dep transitiva.)

2) AGREGA en su lugar la entrada correcta '@google/genai', porque el servidor importa ese SDK en server/services/SmartImageGenerator.ts (import { GoogleGenAI, Modality } from "@google/genai") y debe ir bundleado para optimizar el cold start. El nombre '@google/generative-ai' que estaba era el del paquete viejo y no coincide con lo instalado.

El array final debe quedar SOLO con paquetes que SÍ existen en package.json: '@neondatabase/serverless', '@google/genai', 'connect-pg-simple', 'cors', 'date-fns', 'drizzle-orm', 'drizzle-zod', 'express', 'express-session', 'memorystore', 'multer', 'openai', 'passport', 'passport-local', 'ws', 'zod', 'zod-validation-error'.

No cambies nada más del archivo (la función buildAll y el filtro de externals en línea 47 se quedan igual). Después ejecuta 'npm run build' y confirma que compila sin errores y que dist/index.cjs se genera.
```

- **Aceptación:** Tras editar, cada entrada del allowlist en script/build.ts:7-33 existe en package.json. 'grep -c "@google/genai" script/build.ts' devuelve >=1; 'grep -c "@google/generative-ai" script/build.ts' devuelve 0. El allowlist tiene exactamente 17 entradas (las listadas). 'npm run build' termina con exit 0 y genera dist/index.cjs. El servidor de imágenes (SmartImageGenerator) sigue funcionando. NOTA: en este entorno de verificación node_modules no estaba instalado, así que 'npm run build' debe ejecutarse en Replit para confirmar exit 0 — no se validó empíricamente aquí.
- **Riesgo / cuidado:** No quitar del allowlist ningún paquete que SÍ esté en package.json y se use en el server (express, drizzle-orm, openai, @neondatabase/serverless, etc.), o el bundle se rompe o crece el cold start. Verificar que @google/genai quedó AGREGADO, no solo que se quitó el nombre viejo. NO añadir nanoid de vuelta aunque aparezca en un import: no está en package.json y no aplica. CRÍTICO: este lote NO pudo validarse con 'npm run build' en el entorno de verificación (sin node_modules); probar npm run build en Replit ANTES de dar por cerrado y confirmar que dist/index.cjs se genera sin errores.

### ☐ P6-3 — Agregar verificación de tipos (tsc) pre-build en script/build.ts
- **Severidad:** menor · **Dominio:** BUILD / CONFIG / CRUFT / REPLIT-ESPECÍFICO (P6)
- **Hallazgo:** Existe el script 'check': 'tsc' (package.json:10) pero no corre antes de buildear. script/build.ts llama directo a viteBuild() y esbuild() sin un paso previo de chequeo de tipos. En Replit, el deploy usa 'npm run build' (.replit:11 deployment.build = ['npm','run','build']), así que se puede deployar producción con errores de TypeScript silenciosos (esbuild no hace type-check, solo transpila). Conviene que el build falle rápido si hay errores TS. NOTA verificada: tsconfig.json 'include' = ['client/src/**/*','shared/**/*','server/**/*'], por lo que tsc NO type-chequea los .ts de scripts/ ni script/ (incluido el propio build.ts); el chequeo cubre app cliente + server + shared, que es lo relevante para producción.
- **Evidencia:** package.json:8 '"build": "tsx script/build.ts"' y :10 '"check": "tsc"'. script/build.ts: buildAll() (línea 35) cuya primera instrucción es 'await rm("dist", {recursive:true, force:true})' (línea 36), luego viteBuild() (39) y esbuild() (49-61); nunca llama tsc. catch con process.exit(1) en líneas 64-67. .replit:11 build=['npm','run','build']. tsconfig.json: 'noEmit': true (línea 7), 'strict': true (línea 9), include en línea 2 = client/src, shared, server.
- **Archivos:** script/build.ts, package.json, tsconfig.json

**Fix / prompt:**

```
Abre script/build.ts. Quiero que la verificación de tipos de TypeScript corra ANTES del build de cliente y servidor, para que el build falle si hay errores de tipos (esbuild no hace type-check). Haz esto:

1) Al inicio del archivo, junto a los otros imports (líneas 1-3), agrega: import { execSync } from "child_process";

2) Dentro de la función async buildAll(), como PRIMERA instrucción (antes de 'await rm("dist", { recursive: true, force: true });' en la línea 36), agrega:
   console.log("type-checking...");
   execSync("npm run check", { stdio: "inherit" });

Así, si 'tsc' encuentra errores, execSync lanzará una excepción, el catch de buildAll (líneas 64-67) la imprimirá y hará process.exit(1), abortando el build. No modifiques nada más. Después ejecuta 'npm run build' una vez para confirmar que primero corre el type-check y luego el build, y que termina en exit 0 si no hay errores TS.

IMPORTANTE: ANTES de hacer este cambio, corre 'npm run check' por separado. Si ya arroja errores de tipos preexistentes (en client/src, shared o server), NO los mezcles en este lote: repórtalos al usuario para decidir si se corrigen o si se difiere este cambio, porque con el cambio el build/deploy fallaría de inmediato.
```

- **Aceptación:** Al ejecutar 'npm run build', la salida muestra 'type-checking...' seguido del output de tsc ANTES de 'building client...'. Si se introduce un error de tipos a propósito en cualquier .ts incluido en tsconfig (client/src/**, shared/**, server/** — NO scripts/), 'npm run build' falla con exit code distinto de 0 y no genera dist/index.cjs. Con el código limpio y 'npm run check' pasando, build termina en exit 0. NOTA: en este entorno de verificación node_modules no estaba instalado, así que no se pudo correr 'npm run check' empíricamente; el estado de errores de tipos preexistentes DEBE comprobarse en Replit antes de aplicar.
- **Riesgo / cuidado:** Si el codebase actual YA tiene errores de tipos preexistentes, este cambio hará fallar el build/deploy de inmediato. En este entorno de verificación NO se pudo correr 'npm run check' (sin node_modules), así que el supuesto de 'codebase limpio' está SIN confirmar. Antes de cerrar, correr 'npm run check' por separado en Replit: si arroja errores preexistentes, NO mezclarlos en este lote; reportarlos al usuario. tsc NO chequea scripts/ ni script/build.ts (no están en tsconfig include), así que un error de tipos en el propio build.ts no sería detectado por este paso. No deployar a producción hasta confirmar que 'npm run check' pasa limpio.

### ☐ P6-4 — Borrar físicamente attached_assets huérfano con grep de verificación por archivo (MÁXIMO cuidado)
- **Severidad:** mayor · **Dominio:** BUILD / CONFIG / CRUFT / REPLIT-ESPECÍFICO (P6)
- **Hallazgo:** attached_assets pesa 306MB (verificado 'du -sh'). Hay 170 archivos con prefijo image_, 15 con prefijo IMG_ (185 en total con esos prefijos), más 1 PDF brand manual, 3 zips, 4 benchmarking JSON, 40 Pasted txt y 95 archivos en articles_extracted. Verificado: de los 185 archivos image_/IMG_, solo 1 está referenciado en código (image_1764710915519.png en client/src/components/Footer.tsx:7); los otros 184 son huérfanos. OJO: existen MUCHOS otros assets referenciados que NO llevan prefijo image_/IMG_ (collage_*.jpg, vwys_branded/*.png, partner_photos/*, associate_photos/*, of_counsel_photos/*, mapa_*, logovw_*, chambers, Recurso_2, hero_office.jpg, stock_images/) — el loop de borrado de este lote SOLO toca '^(image_|IMG_)', así que no los afecta. Eliminar los 184 huérfanos libera espacio, PERO es la operación más peligrosa. ADEMÁS scripts/extract-articles.ts LEE attached_assets/articles_extracted/ (:237) y ESCRIBE attached_assets/extracted_articles.json (:260); scripts/import-articles.ts LEE ese JSON (:157). Ese JSON SÍ está trackeado en git. Por eso articles_extracted y extracted_articles.json no deben borrarse a ciegas.
- **Evidencia:** 'du -sh attached_assets'=306M. Conteo disco: 170 image_*, 15 IMG_*. Solo 1 referenciado: 'grep -rl image_1764710915519 client server shared services' -> client/src/components/Footer.tsx (vía import '@assets/image_1764710915519.png' en línea 7). scripts/extract-articles.ts:237 'attached_assets/articles_extracted/Articulos Von Wobeser'; scripts/extract-articles.ts:260 ESCRIBE 'attached_assets/extracted_articles.json'; scripts/import-articles.ts:157 LEE 'attached_assets/extracted_articles.json'. 'git ls-files attached_assets/extracted_articles.json' confirma que está trackeado. vite.config.ts:26 alias '@assets' -> path.resolve(import.meta.dirname,'attached_assets') (Vite solo empaqueta los importados, no toda la carpeta). Brand manual en disco: attached_assets/Manual_de_imagen_VW_junio_2022_(Low_Res)_1765240624952.pdf (grep en código -> 0 referencias). Directorios de raíz verificados: client, server, shared, services TODOS existen (el loop grep es válido).
- **Archivos:** attached_assets/, client/src/components/Footer.tsx, scripts/extract-articles.ts, scripts/import-articles.ts, vite.config.ts

**Fix / prompt:**

```
Tarea de limpieza de disco en attached_assets/. Es DELICADA: borrar un asset que el código importa rompe el build de Vite. Procede con verificación archivo por archivo, NUNCA con un rm masivo:

1) ANTES de borrar nada, genera la lista de archivos image_* e IMG_* y, para CADA UNO, ejecuta un grep para ver si está referenciado en el código. Usa este bucle exacto desde la raíz (los 4 directorios client, server, shared, services existen y se verificó que son válidos):
   for f in $(ls attached_assets | grep -E '^(image_|IMG_)'); do if grep -rqF "$f" client server shared services; then echo "KEEP $f"; else echo "DELETE $f"; fi; done
   Esto debe marcar como KEEP únicamente image_1764710915519.png (lo usa client/src/components/Footer.tsx:7). Si marca KEEP algún otro archivo, NO lo borres.

2) Borra del disco SOLO los archivos marcados DELETE en el paso 1:
   for f in $(ls attached_assets | grep -E '^(image_|IMG_)'); do if ! grep -rqF "$f" client server shared services; then rm -f "attached_assets/$f"; fi; done

3) NO toques la carpeta attached_assets/articles_extracted/ ni el archivo attached_assets/extracted_articles.json: scripts/extract-articles.ts LEE la carpeta y ESCRIBE el JSON, y scripts/import-articles.ts LEE el JSON. El JSON además está trackeado en git. Antes de considerar borrarlos, confirma con el usuario que los artículos ya están importados a la base de datos; si no lo confirma, déjalos.

4) El PDF attached_assets/Manual_de_imagen_VW_junio_2022_(Low_Res)_1765240624952.pdf y los Pasted--*.txt / benchmarking-report_*.json puedes borrarlos del disco SI no están referenciados (verifica con 'grep -rqF "<nombre>" client server shared services' antes de cada rm; el brand manual ya verificado con 0 referencias). El brand manual NO debe quedar en el repo por confidencialidad.

5) Después de borrar, ejecuta 'npm run dev' y 'npm run build' y confirma que ambos arrancan/compilan SIN errores de 'module not found' o assets faltantes. Si algo falla por un asset borrado, restáuralo desde git (git checkout -- attached_assets/<archivo>).

6) Haz commit 'chore: remove orphaned attached_assets (verified unreferenced)'. NO hagas push hasta que el usuario lo apruebe.

ORDEN: si vas a ejecutar también P6-1 (git rm --cached), hazlo ANTES de este borrado físico para que git tenga registro de qué se des-trackeó; este lote borra del disco lo que P6-1 ya dejó de versionar.
```

- **Aceptación:** Tras la limpieza: 'grep -rqF image_1764710915519.png client && echo OK' confirma que el único asset image_/IMG_ referenciado sigue en client; 'ls attached_assets/image_1764710915519.png' confirma que sigue en disco. 'npm run build' termina exit 0 sin errores de assets faltantes. 'du -sh attached_assets' baja sustancialmente respecto a 306M. attached_assets/articles_extracted y attached_assets/extracted_articles.json siguen presentes salvo confirmación explícita de borrado. El brand manual PDF ya no aparece en 'ls attached_assets'. Los assets NO image_/IMG_ referenciados (collage_*.jpg, vwys_branded/*, partner_photos/*, mapa_*, logovw_*, chambers, Recurso_2, hero_office.jpg) siguen intactos. NOTA: 'npm run build' debe correrse en Replit (node_modules no estaba instalado en el entorno de verificación).
- **Riesgo / cuidado:** RIESGO MÁXIMO. Jamás un 'rm attached_assets/image_*' sin el grep -rqF previo por cada archivo: Vite importa por nombre exacto y un solo borrado equivocado rompe el build de producción. El loop SOLO toca prefijos image_/IMG_; NO ampliar el patrón a otros assets referenciados (collages, vwys_branded, partner_photos, mapa, logovw, chambers, Recurso_2). NO borrar articles_extracted ni extracted_articles.json sin confirmación (rompen scripts/; el JSON lo ESCRIBE extract-articles.ts:260, no import-articles.ts). Si tras borrar algo el build falla, restaurar con git checkout. No hacer push automático; mantener el commit local hasta validación del usuario.

### ☐ P6-5 — Agregar guarda de existencia al hook postMerge y consolidar carpetas script/ vs scripts/
- **Severidad:** menor · **Dominio:** BUILD / CONFIG / CRUFT / REPLIT-ESPECÍFICO (P6)
- **Hallazgo:** Dos problemas menores de organización. (a) .replit declara [postMerge] path='scripts/post-merge.sh' (líneas 51-52) con timeoutMs=90000 (línea 53); el script existe y solo hace 'npm install' + 'npm run db:push' (con set -e), sin guarda de DATABASE_URL: si la variable no está definida, db:push falla y aborta el merge. (b) Hay DOS carpetas casi homónimas: script/ (solo build.ts, el builder, 1439 bytes) y scripts/ (utilidades: extract-articles.ts, import-articles.ts, seed-office-images.ts, post-merge.sh). Esto confunde y package.json:8 'build' apunta a 'tsx script/build.ts' (singular).
- **Evidencia:** .replit:51-53 '[postMerge]' / 'path = "scripts/post-merge.sh"' / 'timeoutMs = 90000'. scripts/post-merge.sh contenido exacto: '#!/bin/bash' / 'set -e' / 'npm install' / 'npm run db:push'. 'ls script/' -> build.ts (único). 'ls scripts/' -> extract-articles.ts, import-articles.ts, post-merge.sh, seed-office-images.ts. package.json:8 '"build": "tsx script/build.ts"'. package.json:11 '"db:push": "drizzle-kit push"'.
- **Archivos:** .replit, scripts/post-merge.sh, script/build.ts, scripts/build.ts, package.json

**Fix / prompt:**

```
Dos arreglos de organización de bajo riesgo:

PARTE A — Robustecer el hook postMerge. El archivo scripts/post-merge.sh hace 'npm install' y 'npm run db:push'. Edítalo para que sea idempotente y verifique su entorno. Reemplaza su contenido por:
#!/bin/bash
set -euo pipefail
echo "[post-merge] running npm install..."
npm install
if [ -z "${DATABASE_URL:-}" ]; then
  echo "[post-merge] DATABASE_URL no definido, se omite db:push"
else
  echo "[post-merge] running db:push..."
  npm run db:push
fi
Luego asegúrate de que sea ejecutable: 'chmod +x scripts/post-merge.sh'. No cambies la referencia en .replit (sigue siendo path='scripts/post-merge.sh', timeoutMs=90000).

PARTE B — Consolidar las carpetas script/ y scripts/. Mueve el builder a scripts/ para tener una sola carpeta: ejecuta 'git mv script/build.ts scripts/build.ts' y luego 'rmdir script'. Después abre package.json y cambia la línea 8 del script de build de '"build": "tsx script/build.ts"' a '"build": "tsx scripts/build.ts"'. Verifica que ninguna otra parte del repo referencie la ruta vieja: ejecuta 'grep -rn "script/build.ts" . --include=*.json --include=*.ts --include=*.replit' (excluyendo node_modules y .git) y corrige cualquier coincidencia restante. Finalmente corre 'npm run build' para confirmar que el builder funciona desde la nueva ubicación.

Haz commit 'chore: harden post-merge hook and consolidate script/ into scripts/'. No hagas push hasta que el usuario lo apruebe.
```

- **Aceptación:** scripts/post-merge.sh tiene la guarda de DATABASE_URL y permiso de ejecución ('test -x scripts/post-merge.sh && echo OK'). La carpeta script/ ya no existe ('ls script' falla) y existe scripts/build.ts. package.json:8 apunta a 'tsx scripts/build.ts'. 'grep -rn "script/build.ts" --include=*.json --include=*.ts .' (fuera de node_modules y .git) devuelve vacío. 'npm run build' termina exit 0 generando dist/index.cjs. NOTA: 'npm run build' debe correrse en Replit (node_modules no estaba instalado en el entorno de verificación).
- **Riesgo / cuidado:** Usar 'git mv' (no mv + git add suelto) para preservar historial. Confirmar que package.json:8 quedó apuntando a scripts/build.ts ANTES de borrar la carpeta script/, o npm run build se rompe. La PARTE A no debe cambiar la ruta ni el timeoutMs en .replit. Verificar que ningún otro archivo (incluido .replit) referencie 'script/build.ts'. Probar npm run build al final. No hacer push automático.

### ☐ P6-6 — Reducir el tamaño del repositorio git (552MB) — SOLO con coordinación, no autónomo
- **Severidad:** menor · **Dominio:** BUILD / CONFIG / CRUFT / REPLIT-ESPECÍFICO (P6)
- **Hallazgo:** Aunque los lotes P6-1 y P6-4 dejan de versionar y borran del disco el cruft, el historial de git ya quedó permanentemente inflado: .git pesa 552MB en disco (verificado 'du -sh .git') y los objetos suman 472.91 MiB ('git count-objects -vH' -> size: 472.91 MiB, count: 5620, size-pack: 0), porque los blobs (PDFs, imágenes, zips) siguen en el historial de commits. Reducir esto requiere reescribir el historial con git-filter-repo o BFG, que es una operación destructiva y peligrosa en Replit (rompe checkpoints, requiere force-push, puede descoordinar el entorno celoso de Replit). NO debe hacerse de forma autónoma.
- **Evidencia:** 'du -sh .git'=552M. 'git count-objects -vH' -> size: 472.91 MiB, count: 5620, size-pack: 0 byte (nota: size-pack 0 indica que los objetos están sueltos/loose, no empaquetados aún; un 'git gc' los empaquetaría pero NO reduce el contenido histórico). Los blobs grandes (95 PDFs, 184 imágenes huérfanas, 3 zips) están en el historial aunque se hagan git rm --cached (P6-1) y rm físico (P6-4): esos comandos solo afectan commits futuros y el árbol de trabajo, no los blobs históricos.
- **Archivos:** .git/, attached_assets/

**Fix / prompt:**

```
NO ejecutes esto de forma autónoma: es una operación de reescritura de historial git que es destructiva y delicada en Replit. Solo realízala si el usuario lo aprueba explícitamente y tras haber completado P6-1 (git rm --cached) y P6-4 (borrado físico de assets huérfanos). El objetivo es reducir el tamaño del repositorio (.git pesa 552MB, objetos 472.91 MiB) purgando del historial los blobs grandes ya eliminados (PDFs, imágenes huérfanas, zips, brand manual confidencial).

Pasos recomendados, a confirmar con el usuario antes de cada uno:
1) Crea un respaldo completo del repo (copia de la carpeta entera) antes de tocar el historial.
2) Confirma con el usuario que existe un remoto de respaldo y que entiende que esto requerirá force-push y romperá clones/checkpoints existentes.
3) Usa git-filter-repo (preferido) para purgar del historial las rutas: attached_assets/*.pdf, attached_assets/articles_extracted/, attached_assets/*.zip, attached_assets/*.docx, los image_*/IMG_* huérfanos (excepto image_1764710915519.png, que el Footer importa), los PNGs de debug de la raíz y los .canvas/assets/*.png. Valida SIEMPRE primero con '--analyze' (genera reporte en .git/filter-repo/analysis) y/o '--dry-run' antes de aplicar nada destructivo. Construye los flags --path / --path-glob con cuidado y NUNCA inviertas la lógica de forma que se purgue image_1764710915519.png.
4) Tras reescribir, corre 'git count-objects -vH' para confirmar la reducción, valida que 'npm run build' sigue funcionando (image_1764710915519.png debe seguir presente y resolver desde client/src/components/Footer.tsx:7) y solo entonces, con aprobación, haz el force-push.

Si el usuario no aprueba la reescritura, NO la hagas: deja el repo como quedó tras P6-1/P6-4 (cruft des-trackeado pero aún en historial) y documenta que la reducción de .git queda pendiente.
```

- **Aceptación:** Solo si se ejecuta con aprobación: 'git count-objects -vH' muestra un 'size' significativamente menor a 472.91 MiB. 'npm run build' sigue en exit 0 y client/src/components/Footer.tsx:7 sigue resolviendo image_1764710915519.png. Si NO se aprueba, la aceptación es que quede documentado como pendiente y el repo intacto post-P6-1/P6-4.
- **Riesgo / cuidado:** OPERACIÓN DESTRUCTIVA Y NO AUTÓNOMA. Reescribir historial git en Replit puede romper checkpoints, history del agente y requerir force-push que descoordina colaboradores. Hacer respaldo completo antes. Nunca purgar image_1764710915519.png. Validar con '--analyze'/'--dry-run' antes de aplicar. No force-pushear sin aprobación explícita del usuario. Si hay duda, dejar pendiente en vez de arriesgar el repo. NOTA: el ejemplo de comando filter-repo del lote original mezclaba --path-glob 'client/*' con --invert-paths de forma confusa; en la práctica, definir explícitamente solo las rutas a purgar y confirmarlas con --analyze antes de aplicar.
