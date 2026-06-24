# AUDIT-REPORT — Von Wobeser y Sierra

> Examen integral multi-agente (9 auditores por dominio × todas las dimensiones) con verificación adversarial de cada hallazgo, reparación de HIGH+MEDIUM y verificación corriendo. Rama `chore/production-hardening`.

## Resumen ejecutivo

- **68 hallazgos brutos → 51 confirmados** tras filtro adversarial (17 falsos positivos/no-regresión descartados).
- **3 HIGH · 16 MEDIUM · 32 LOW**.
- **HIGH + MEDIUM (19) reparados y verificados corriendo.** LOW documentados abajo.
- Verificación: `tsc` 0 · `vitest` 18/18 · `smoke` 22/22 · navegador (Playwright) 6/6.
- Dos hallazgos resueltos por **decisión del usuario**: panel de traducciones recortado a EN/ES; secretos de `.replit` retirados (rotación pendiente del usuario).

## HIGH — reparados

| Sev | Dim | Ubicación | Hallazgo |
|---|---|---|---|
| HIGH | performance | `server/routes.ts:3564-3697` | /api/agents/pipeline/process-all ejecuta 5-6 llamadas LLM por artículo sobre TODOS los artículos (~843) de forma síncrona dentro de un solo request HTTP |
| HIGH | correctness | `client/src/pages/admin/AdminEvents.tsx:713-715` | Lista de eventos NUNCA carga: useQuery sin queryFn omite el token Bearer (401) — misma clase de bug que el panel de traducciones |
| HIGH | correctness | `DEPLOY-REPLIT.md:7-9` | El runbook apunta al commit/rama equivocados: el trabajo real vive en chore/production-hardening, no en feat/old-design-recreation |

## MEDIUM — reparados

| Sev | Dim | Ubicación | Hallazgo |
|---|---|---|---|
| MEDIUM | security | `server/index.ts:19-78` | No se aplica helmet ni Content-Security-Policy: faltan cabeceras de seguridad en toda la app |
| MEDIUM | correctness | `server/agents/core/AgentOrchestrator.ts:440-451` | Retry de jobs sin backoff: re-encola al frente y reintenta inmediatamente en el siguiente ciclo (2s), hot-loop sobre fallos deterministas |
| MEDIUM | security | `server/routes.ts:125-133` | Subida de SVG permitida y servida desde /uploads como estático → XSS almacenado |
| MEDIUM | correctness | `server/routes.ts:419-424` | Endpoint público /api/news expone borradores, fallidos y no publicados |
| MEDIUM | performance | `server/storage.ts:717-738` | N+1 en getNewsByTeamMemberId: un SELECT por cada noticia del abogado |
| MEDIUM | correctness | `server/agents/core/AgentOrchestrator.ts:325-347` | Legal Council fail-open: deadlocked/escalated/pending_revision todos mapean a 'ready_for_approval' |
| MEDIUM | correctness | `services/agents/LegalCouncilService.ts:179-193` | normalizeDecision por substring puede malclasificar votos (p.ej. 'approve' contiene 'pass'? no, pero 'disapprove'/'fail-safe' si) |
| MEDIUM | a11y-ux | `client/src/pages/Offices.tsx:952-974` | Lightbox modal sin Escape, sin focus trap, sin role/aria-modal y botón de cierre sin etiqueta |
| MEDIUM | a11y-ux | `client/src/components/CookieBanner.tsx:438-545` | Modal de preferencias de cookies sin role=dialog, sin Escape, sin focus trap ni scroll lock |
| MEDIUM | a11y-ux | `client/src/components/layout/SiteHeader.tsx:215-297` | Nav-overlay role=dialog aria-modal sin focus trap ni gestión de foco |
| MEDIUM | a11y-ux | `client/src/pages/Team.tsx:35-63` | searchQuery y filterLetter no se reflejan en la URL: el estado de filtro no es compartible ni sobrevive recarga; sólo 'type' (seniority) se lee desde la URL |
| MEDIUM | correctness | `server/routes.ts:3230-3233` | El feature "Traducir Faltantes" de AdminTranslations siempre devuelve 400 (idiomas no soportados) _(decisión usuario)_ |
| MEDIUM | performance | `server/routes.ts:1557-1567` | N+1 en /api/admin/cms-stats: una query por cada noticia (~844 queries) |
| MEDIUM | performance | `server/routes.ts:1488-1516` | Paginación falsa: cada página/búsqueda relee la tabla news completa (incluyendo `content`) desde la DB |
| MEDIUM | security | `.replit:48-49` | .replit está versionado y expone ADMIN_EMAIL + ADMIN_PASSWORD_HASH (bcrypt) del admin de producción _(decisión usuario)_ |
| MEDIUM | quality | `package.json:6-13` | No existe pipeline CI (.github ausente): tsc/test/smoke solo corren manualmente en local macOS, nunca en Linux |

## LOW — documentados (no reparados)


### a11y-ux (2)
- `client/src/components/team/AttorneyFilters.tsx:161-166` — Texto secundario con contraste insuficiente (text-vw-gray/50 ≈ 2.6:1) bajo WCAG AA
- `client/src/pages/admin/AdminTranslations.tsx:914-932` — Pestaña 'Recent Jobs' siempre muestra estado vacío hardcodeado — funcionalidad muerta/engañosa

### correctness (3)
- `server/agents/specialized/ContentAnalyzerAgent.ts:247` — JSON.parse(response) sin try/catch dedicado tras callLLM con salida potencialmente no-JSON
- `server/services/SmartImageGenerator.ts:82-89` — Sanitizador de prompts usa regex sin limites de palabra y corrompe terminos no relacionados
- `server/index.ts:56-78` — Rate-limiting y bloqueo de login usan stores en memoria por instancia → ineficaces bajo autoscale de Replit

### dead-code (9)
- `server/services/SmartImageGenerator.ts:199-249` — callDalle3 y todo el camino DALL-E nunca se invocan (engine 'dalle3' inalcanzable)
- `client/src/pages/GermanDesk.tsx:1-697` — GermanDesk.tsx (697 líneas) es código muerto: nunca se importa ni se rutea, y enlaza a una ruta inexistente
- `client/src/pages/News.tsx:100-220` — 8 bloques de idioma inalcanzables (de/zh/ko/ja/ar/ru/fr/it) en páginas públicas: i18n muerto
- `client/src/components/Header.tsx:1-880` — 15 componentes de nivel superior del diseño viejo son código muerto (~150KB), incluida colisión de nombre HeroSection
- `client/src/hooks/usePipelineProgress.ts:1` — Import useSyncExternalStore sin uso
- `client/src/lib/adminTranslations.ts:1-2077` — ~8 de 10 idiomas (de/zh/ko/ja/ar/ru/fr/it) son código muerto: el sistema sólo expone EN/ES
- `client/src/lib/translationUtils.ts:40-64` — Exports muertos: getFieldValue y getSourceLanguageForContent no se usan en ningún sitio
- `client/src/components/NewsSection.tsx:1-326` — 10 componentes de sección de nivel superior sin importadores (código muerto del diseño anterior)
- `dist/public 2:1` — Artefacto de duplicación de iCloud 'dist/public 2' presente junto a dist/public

### i18n (1)
- `client/src/lib/translationUtils.ts:100` — getDisplayValue en modo 'en' cae silenciosamente a español cuando el campo base inglés está vacío

### performance (6)
- `server/storage.ts:1090-1097` — getNewsTranslationCounts/Status cargan tablas completas a memoria para agregar en JS
- `server/agents/specialized/MetadataLinkerAgent.ts:104-118` — N+1 de queries dentro de doble loop al enlazar autores
- `client/src/pages/Team.tsx:50-57` — Team.tsx sondea window.location.search con setInterval cada 100ms en vez de usar el hook reactivo de wouter
- `client/src/pages/Team.tsx:50-57` — setInterval de 100ms permanente para detectar cambios de URL en la página de equipo
- `client/src/contexts/LanguageContext.tsx:170` — El value del LanguageContext es un objeto nuevo en cada render: invalida a TODOS los consumidores
- `client/src/pages/admin/AdminTranslations.tsx:847-908` — Tabla de traducciones sin paginación ni virtualización: renderiza todas las noticias x 10 badges

### quality (6)
- `server/agents/specialized/ImageSuggestionAgent.ts:46` — AgentConfig.model declara 'gpt-4o-mini' pero callLLM enruta a Claude — config enganosa e inerte
- `client/src/pages/PracticeGroupDetail.tsx:125-305` — Páginas de detalle de capacidad sin SEOHead ni JSON-LD: el <title> del documento nunca se actualiza
- `client/src/pages/TeamMemberDetail.tsx:431-457` — TeamMemberDetail y NewsDetail no actualizan document.title (solo emiten JSON-LD)
- `client/src/pages/admin/AdminTranslations.tsx:510-516` — queryKey incluye contentTypeFilter pero el queryFn lo ignora: caché duplicada y refetch innecesario
- `script/build.ts:11-26` — nanoid está en el allowlist de bundling pero no es dependency declarada (solo transitiva vía postcss)
- `scripts/smoke-test.ts:10` — Smoke por defecto apunta a :5001 (dev local); sin SMOKE_BASE_URL no valida el deploy real de Replit

### security (5)
- `server/agents/api/agentRoutes.ts:99-184` — /api/agents/run/:agentType y /pipeline/batch pasan req.body sin validar y batch no limita el tamaño del array → amplificación de coste
- `server/routes.ts:2986-3287` — Endpoints de traducción públicos (sin authMiddleware) sin tope de tamaño por texto: ataque de coste sobre el LLM
- `shared/schema.ts:499-504` — adminLoginSchema exige solo 6 caracteres de password y se reutiliza para crear el primer super_admin en /api/admin/init
- `services/agents/LegalCouncilService.ts:77-78` — Sin API key, el Consejo se vuelve un cascaron que aprueba todo en silencio
- `client/src/pages/admin/AdminPerformance.tsx:399-412` — AdminPerformance no tiene guard de auth de cliente: renderiza el panel completo antes de verificar sesión

## Detalle de reparaciones HIGH+MEDIUM

### [HIGH/performance] /api/agents/pipeline/process-all ejecuta 5-6 llamadas LLM por artículo sobre TODOS los artículos (~843) de forma síncrona dentro de un solo request HTTP
- **Ubicación:** `server/routes.ts:3564-3697`
- **Mecanismo:** El handler hace `const allNews = await storage.getNews()` y recorre TODOS los artículos en un for...of secuencial, ejecutando formatter+category+metadata+seo+translate (y opcional image) por cada uno, cada paso una o varias llamadas a Claude/OpenAI. Con ~843 noticias son miles de llamadas LLM seriadas en una única petición: el request supera con creces cualquier timeout de proxy/cliente (Replit ~60s), el cliente recibe 502/timeout pero el bucle SIGUE corriendo en el servidor consumiendo cuota, y monopoliza el orchestrator. Además solo está protegido por authMiddleware (sin requireRole), así que cualquier editor/author lo dispara. No hay parámetro de límite (a diferencia de agentRoutes.ts:188 que sí acepta `limit`).
- **Fix:** Convertir a trabajo asíncrono encolado (devolver 202 + jobId y procesar vía orchestrator.enqueueJob), aplicar requireRole('super_admin'), y aceptar un `limit`/paginación. Como mínimo, capar el número de artículos por invocación y responder de inmediato.

### [HIGH/correctness] Lista de eventos NUNCA carga: useQuery sin queryFn omite el token Bearer (401) — misma clase de bug que el panel de traducciones
- **Ubicación:** `client/src/pages/admin/AdminEvents.tsx:713-715`
- **Mecanismo:** El servidor autentica SOLO por header `Authorization: Bearer <token>` (server/auth.ts:124-129, sin fallback de cookie) y el token vive en localStorage; solo `adminApiRequest`/`getAuthHeaders` lo adjuntan. Este `useQuery<Event[]>({ queryKey: ["/api/admin/events"] })` NO define `queryFn`, así que cae en el `getQueryFn` por defecto (client/src/lib/queryClient.ts:32) que hace `fetch("/api/admin/events", { credentials: "include" })` SIN header Authorization. Pero `/api/admin/events` exige `authMiddleware` (server/routes.ts:1950) → devuelve 401 → el default queryFn está configurado `on401:"throw"` (queryClient.ts:50) → la query lanza y `events` queda `undefined` para siempre. Resultado runtime: la tabla de eventos del CMS aparece vacía y los contadores muestran 0 (events?.filter en línea 824, events?.length en 1194), aunque haya eventos en la BD. Es exactamente la clase de fallo que dejó el panel de traducciones vacío: el cliente llama un endpoint con un mecanismo (default fetch tokenless) que el contrato del server (Bearer requerido) no acepta.
- **Fix:** Agregar un `queryFn` explícito que use `adminApiRequest`, idéntico al patrón ya correcto en AdminCategories/AdminPostForm/AdminTranslations: `queryFn: async () => { const res = await adminApiRequest("GET", "/api/admin/events"); if (!res.ok) throw new Error("Failed to fetch events"); return res.json(); }` y opcionalmente `enabled: isAuthenticated`. Auditar también que ningún otro `useQuery` de páginas admin contra rutas con `authMiddleware` carezca de `queryFn` (las otras 3 sin queryFn — AdminArticleDetail:285 `/api/news/:idOrSlug`, AdminArticleProcessing:454 `/api/news`, GalleryAdmin:36 `/api/office-images` — apuntan a rutas PÚBLICAS, así que funcionan por casualidad; documentarlo o migrarlas igual para evitar regresión si esas rutas se protegen).

### [HIGH/correctness] El runbook apunta al commit/rama equivocados: el trabajo real vive en chore/production-hardening, no en feat/old-design-recreation
- **Ubicación:** `DEPLOY-REPLIT.md:7-9`
- **Mecanismo:** DEPLOY-REPLIT.md instruye `git checkout feat/old-design-recreation` y 'HEAD debe ser c3585d7 o posterior'. Pero la rama activa con TODOS los fixes de hardening es chore/production-hardening (git log: fb5325c fix admin translate, 4067f95 error boundary, 953c02e cierre del bypass /api/admin/init, etc.), HEAD muy posterior a c3585d7. Si Gate E sigue el runbook al pie de la letra, Replit desplegaría una rama SIN el fix de seguridad del bypass de /api/admin/init ni el resto del hardening → se re-introduce la vulnerabilidad crítica ya cerrada.
- **Fix:** Actualizar el runbook para apuntar a chore/production-hardening (o a la rama que finalmente se mergee) y al HEAD correcto antes de ejecutar el deploy. Confirmar que el commit desplegado contiene 953c02e.

### [MEDIUM/security] No se aplica helmet ni Content-Security-Policy: faltan cabeceras de seguridad en toda la app
- **Ubicación:** `server/index.ts:19-78`
- **Mecanismo:** Se montan compression, cors, json y rate-limit, pero NO hay helmet ni cabeceras de seguridad manuales (grep 'helmet' sobre server/ y package.json: 0 resultados). El servidor responde sin CSP, sin X-Content-Type-Options, sin X-Frame-Options/frame-ancestors, sin HSTS. Sirviendo un SPA + panel admin con tokens en el cliente, la ausencia de CSP y X-Frame-Options deja la puerta abierta a clickjacking del panel y a que cualquier XSS reflejado/almacenado (p.ej. vía SVG subido, ver hallazgo aparte) se ejecute sin mitigación de origen.
- **Fix:** Añadir `import helmet from 'helmet'` y `app.use(helmet({ contentSecurityPolicy: {...} }))` antes de las rutas, con una CSP que liste los orígenes reales (Anthropic/OpenAI/ipapi/fuentes) y frame-ancestors 'none' para el panel admin.

### [MEDIUM/correctness] Retry de jobs sin backoff: re-encola al frente y reintenta inmediatamente en el siguiente ciclo (2s), hot-loop sobre fallos deterministas
- **Ubicación:** `server/agents/core/AgentOrchestrator.ts:440-451`
- **Mecanismo:** En el catch de processNextJob, si retryCount<maxRetries se hace job.status='pending' y `this.jobQueue.unshift(job)` (lo pone al FRENTE). startProcessing corre cada 2s y toma el primer job de la cola, así que un job que falla por una causa determinista (payload inválido, artículo inexistente, error de parseo del LLM) se reintenta de inmediato 3 veces seguidas sin pausa, cada reintento gastando una llamada LLM completa. No hay delay exponencial ni jitter; con muchos jobs malos la cola entra en thrashing y agota cuota de Claude/OpenAI.
- **Fix:** Introducir backoff (p.ej. nextRetryAt = now + base*2^retryCount con jitter) y re-encolar al final, no al frente; saltar el job hasta que venza su nextRetryAt. Distinguir errores no-reintetables (validación/404) para fallar de una vez.

### [MEDIUM/security] Subida de SVG permitida y servida desde /uploads como estático → XSS almacenado
- **Ubicación:** `server/routes.ts:125-133`
- **Mecanismo:** El fileFilter de multer (línea 119) acepta 'image/svg+xml'. Los archivos se guardan en uploadsDir y se sirven con `app.use('/uploads', express.static(uploadsDir, ...))` (línea 1058) sin Content-Disposition ni sanitización. Un SVG puede contener <script>/onload; al abrirse directamente la URL /uploads/<archivo>.svg el navegador lo renderiza como documento y ejecuta el JS en el origen del sitio. Como el panel admin guarda su token en el cliente del mismo origen, un editor malicioso (o cualquiera que comprometa una cuenta editor) puede plantar un SVG que robe sesiones de otros admins. Sin CSP (ver hallazgo helmet) no hay mitigación.
- **Fix:** Quitar svg+xml de allowedMimes, o sanitizar SVG con DOMPurify al subir y servir /uploads con Content-Disposition: attachment y Content-Security-Policy restrictiva.

### [MEDIUM/correctness] Endpoint público /api/news expone borradores, fallidos y no publicados
- **Ubicación:** `server/routes.ts:419-424`
- **Mecanismo:** storage.getNews() (storage.ts:361-363) hace SELECT de toda la tabla news sin filtro de published, y el endpoint público /api/news solo filtra por publishAt (línea 423), NO por n.published ni por processingStatus. El schema (schema.ts:96) define published con default(true) y processingStatus con default('pending'/'failed'/'ready_for_approval'). Resultado: cualquier artículo creado por el pipeline de agentes que esté en estado pending/processing/failed o marcado published=false se sirve sin autenticación a través de /api/news y de /api/news/:idOrSlug (routes.ts:442-452, que tampoco verifica published). El endpoint hermano /api/news/published (línea 434) SÍ aplica n.published, lo que confirma que la omisión en /api/news es un bug, no diseño.
- **Fix:** En /api/news y en /api/news/:idOrSlug aplicar el mismo guard que /api/news/published: filtrar por n.published === true (y opcionalmente processingStatus === 'ready'). Idealmente añadir a IStorage un getPublishedNews() que filtre en SQL (WHERE published = true AND (publish_at IS NULL OR publish_at <= now())) en vez de cargar toda la tabla y filtrar en memoria.

### [MEDIUM/performance] N+1 en getNewsByTeamMemberId: un SELECT por cada noticia del abogado
- **Ubicación:** `server/storage.ts:717-738`
- **Mecanismo:** getNewsByTeamMemberId obtiene los pivotRows (línea 718-721) y luego itera newsIds ejecutando un db.select() individual por cada newsId dentro de un for (líneas 730-735). Para un socio con N noticias asociadas se disparan N+1 round-trips a Postgres en vez de un único WHERE id IN (...) o un JOIN. Lo consume routes.ts:655 (perfil de abogado). En socios con decenas de apariciones en prensa esto multiplica la latencia de la página de perfil. getTeamMembersByNewsId (740-761) tiene el mismo patrón aunque su cardinalidad (autores por nota) suele ser menor.
- **Fix:** Reemplazar el loop por un solo query con inArray(news.id, newsIds) (drizzle) o un INNER JOIN entre newsTeamMembers y news filtrando por teamMemberId, devolviendo todas las filas en un round-trip.

### [MEDIUM/correctness] Legal Council fail-open: deadlocked/escalated/pending_revision todos mapean a 'ready_for_approval'
- **Ubicación:** `server/agents/core/AgentOrchestrator.ts:325-347`
- **Mecanismo:** En runPipeline, newStatus solo distingue 'approved' vs 'rejected'; CUALQUIER otro veredicto (deadlocked, escalated, pending_revision) cae al else y queda 'ready_for_approval' (linea 328-329). El estado 'deadlocked' lo produce LegalCouncilService.calculateVerdict cuando validVotes.length===0, es decir cuando los 3 jueces abstienen o fallan (Promise.allSettled rejected -> SYSTEM_ABSTENTION_VOTE). Causas reales de fallo total: OPENAI_API_KEY ausente (constructor cae a '' -> 'Bearer ' -> 401 en los 3), red caida, o timeout de 30s en los 3. Resultado: un articulo que el Consejo NUNCA pudo evaluar avanza a aprobacion como si hubiera pasado. El comentario 'consolidatedFeedback: requiere revision manual' no cambia el processingStatus, que es lo que la UI usa para habilitar la publicacion (routes.ts:2904 solo bloquea si != 'ready_for_approval').
- **Fix:** Mapear explicitamente: solo 'approved' -> 'ready_for_approval'; 'deadlocked' y 'escalated' -> un estado que requiera intervencion humana (p.ej. 'needs_manual_review') que NO habilite publicacion automatica. Replicar el mismo mapeo en routes.ts:2957.

### [MEDIUM/correctness] normalizeDecision por substring puede malclasificar votos (p.ej. 'approve' contiene 'pass'? no, pero 'disapprove'/'fail-safe' si)
- **Ubicación:** `services/agents/LegalCouncilService.ts:179-193`
- **Mecanismo:** normalizeDecision baja a minusculas y, si no hay match exacto, usa includes(): 'approve'||'pass', 'reject'||'fail', 'revision'||'revise'. Si el modelo devuelve decision:'disapprove' -> includes('approve') es true -> se normaliza a 'approve' (invierte el voto). 'pass on this'/'fail-safe' tambien colisionan. Como el score/decision del juez alimenta directamente overallStatus (rejections>=2 -> rejected), una inversion de un voto puede mover el veredicto de rejected a approved. La probabilidad es baja (gpt-4o-mini con response_format json y enum en prompt suele dar valores limpios), pero el costo de un falso 'approve' en un firma legal es alto.
- **Fix:** Hacer matching estricto contra el enum (igualdad exacta tras trim/lowercase); si no coincide, ir directo a 'abstain' (ya es el default) en vez de adivinar por substring. Eliminar los includes() de pass/fail/disapprove.

### [MEDIUM/a11y-ux] Lightbox modal sin Escape, sin focus trap, sin role/aria-modal y botón de cierre sin etiqueta
- **Ubicación:** `client/src/pages/Offices.tsx:952-974`
- **Mecanismo:** Al hacer clic en una imagen de la galería se abre un overlay fijo (z-50). El cierre solo ocurre por onClick en el backdrop o en el botón. No hay useEffect que escuche 'keydown'/'Escape' (grep confirma 0 coincidencias de keydown/Escape en el archivo), no hay role="dialog"/aria-modal ni gestión de foco, y el botón de cierre (línea 965-971) tiene como único contenido el carácter decorativo '×' sin aria-label. Resultado: un usuario que navega por teclado no puede cerrar el modal con Escape ni recibe foco dentro de él, y un lector de pantalla anuncia un botón sin nombre accesible.
- **Fix:** Añadir un useEffect que registre 'keydown' para cerrar con Escape mientras selectedImage != null; poner role="dialog" aria-modal="true" en el contenedor, mover el foco al botón de cierre al abrir y restaurarlo al cerrar (focus trap), y dar aria-label (p.ej. 'Cerrar' / 'Close') al botón ×.

### [MEDIUM/a11y-ux] Modal de preferencias de cookies sin role=dialog, sin Escape, sin focus trap ni scroll lock
- **Ubicación:** `client/src/components/CookieBanner.tsx:438-545`
- **Mecanismo:** El overlay de preferencias (showPreferences) es un modal de facto (fixed inset-0 z-[70], cierra al click-outside en 446) pero el div carece de role="dialog", aria-modal="true" y aria-labelledby; el único modo de cierre por teclado no existe (no hay onKeyDown/Escape — solo onClick en el backdrop, inaccesible por teclado); no mueve el foco al abrir ni lo atrapa, de modo que con Tab el foco escapa al contenido de la página detrás del overlay; y no bloquea el scroll del body. Para un modal de consentimiento GDPR (contenido legal obligatorio) esto deja a usuarios de teclado y lectores de pantalla sin forma estándar de operarlo o cerrarlo. Contrasta con SiteHeader (SiteHeader.tsx:97-104) que sí maneja Escape y scroll lock.
- **Fix:** Reusar el componente Dialog de Radix (ya en ui/dialog.tsx) que aporta role/aria-modal/focus-trap/Escape/scroll-lock, o añadir manualmente: role="dialog" aria-modal aria-labelledby al div de 444/448, un useEffect con keydown Escape→closePreferences, mover foco al botón Close al montar y restaurarlo al cerrar, y bloquear document.body.style.overflow mientras está abierto.

### [MEDIUM/a11y-ux] Nav-overlay role=dialog aria-modal sin focus trap ni gestión de foco
- **Ubicación:** `client/src/components/layout/SiteHeader.tsx:215-297`
- **Mecanismo:** El overlay de navegación full-screen declara role="dialog" aria-modal="true" (216-222) y bloquea el scroll del body, pero al abrirlo el foco del teclado NO se mueve dentro del diálogo (no se enfoca el botón Cerrar ni el primer enlace) y NO hay focus trap: con Tab el foco recorre los enlaces del overlay y luego sigue hacia los elementos del <header> y del <main> que quedan detrás, contradiciendo la promesa de aria-modal. Un usuario de lector de pantalla/teclado puede 'salirse' del menú modal sin cerrarlo. El Escape sí cierra (97-104), lo cual es bueno, pero la gestión/atrapado de foco falta.
- **Fix:** Al abrir menuOpen, mover el foco al botón de cerrar (ref + focus en el useEffect del overlay), restaurarlo al disparador al cerrar, e implementar un focus trap (ciclar Tab/Shift+Tab dentro del overlay) o reusar Radix Dialog que ya lo provee.

### [MEDIUM/a11y-ux] searchQuery y filterLetter no se reflejan en la URL: el estado de filtro no es compartible ni sobrevive recarga; sólo 'type' (seniority) se lee desde la URL
- **Ubicación:** `client/src/pages/Team.tsx:35-63`
- **Mecanismo:** getFilterFromURL() (líneas 22-31) sólo lee ?type=. searchQuery (línea 35) y filterLetter (línea 38) viven en useState sin escribir nunca a la URL (los handlers en 333-337 sólo llaman setSearchQuery/setFilterLetter; no hay pushState/navigate). Recargar o compartir el enlace pierde la búsqueda y la letra. Además filterSeniority se lee de la URL pero los cambios locales (setFilterSeniority) tampoco la actualizan, así que el polling de URL puede pisar la selección del usuario si la URL no cambió. Divergencia URL<->estado.
- **Fix:** Persistir searchQuery/filterLetter/filterSeniority en query params (vía wouter useSearch/navigate) como única fuente, derivando el estado de la URL en ambos sentidos.

### [MEDIUM/correctness] El feature "Traducir Faltantes" de AdminTranslations siempre devuelve 400 (idiomas no soportados)
- **Ubicación:** `server/routes.ts:3230-3233`
- **Mecanismo:** Todos los endpoints de traducción validan `targetLanguage` contra `SUPPORTED_LANGUAGES` (shared/schema.ts:649-652), que solo contiene `en` y `es`. AdminTranslations.tsx:538 calcula `targets = languages.filter(l => l !== 'en' && l !== 'es')`, es decir SIEMPRE pide idiomas (de/zh/ko/ja/ar/ru/fr/it) que el endpoint rechaza con `res.status(400)('Invalid language code')` en routes.ts:3231-3232. El mutation hace throw en el primer target y dispara el toast de error. La funcionalidad del panel de traducción es inoperante de extremo a extremo: la UI ofrece 10 idiomas pero el backend solo acepta 2. Misma incoherencia en /api/translate-content (3146) y /api/translations (3091).
- **Fix:** Decidir y unificar el contrato i18n: o (a) ampliar `SUPPORTED_LANGUAGES` a los 10 idiomas que la UI muestra (y conectar la tabla `newsTranslations`/`translationCache`), o (b) eliminar/ocultar el panel AdminTranslations y los 8 idiomas no soportados de la UI para no exponer un botón que siempre falla. La validación y la UI deben leer la MISMA fuente de verdad.

### [MEDIUM/performance] N+1 en /api/admin/cms-stats: una query por cada noticia (~844 queries)
- **Ubicación:** `server/routes.ts:1557-1567`
- **Mecanismo:** Tras `storage.getNews()` (1548), el handler hace `for (const newsItem of allNews) { await storage.getNewsTranslations(newsItem.id) }`. Cada iteración ejecuta un `SELECT ... WHERE newsId = ?` (storage.ts:1083-1088). Con 843 noticias son 1 + 843 round-trips secuenciales a Postgres por cada carga del dashboard admin. Ya existe `getNewsTranslationStatus()` (storage.ts:1103) que resuelve lo mismo en 2 queries con un Map en memoria; el endpoint cms-stats no lo usa.
- **Fix:** Reemplazar el bucle por una sola query agregada: `SELECT newsId, language FROM news_translations` (como hace getNewsTranslationStatus en 1114-1117) y construir `translationsByLanguage`/`articlesWithTranslationsSet` en memoria. Pasa de 844 a 2 queries.

### [MEDIUM/performance] Paginación falsa: cada página/búsqueda relee la tabla news completa (incluyendo `content`) desde la DB
- **Ubicación:** `server/routes.ts:1488-1516`
- **Mecanismo:** `/api/admin/news` (1495), `/api/admin/team` (1705), y `/api/news` público (421) llaman `storage.getNews()`/`getTeamMembers()` que hacen `db.select().from(news)` SIN límite (storage.ts:361-363) trayendo las 843 filas con sus cuerpos `content` HTML completos, y SOLO DESPUÉS filtran y hacen `.slice(offset, offset+limit)` en JS (1516). El `limit=20` recorta el payload al cliente pero no la carga de DB ni la memoria del server: cada cambio de página y cada tecleo de búsqueda (queryKey incluye `search`) reejecuta un scan completo + transferencia de todos los `content`. El público `/api/news` ni siquiera pagina: manda las 843 filas enteras en cada visita.
- **Fix:** Empujar paginación/filtros/búsqueda a SQL (LIMIT/OFFSET + WHERE + count(*) en una query), y excluir columnas pesadas (`content`) de los listados con un `select({...})` de columnas. Para `/api/news` público devolver solo campos de tarjeta (title/slug/excerpt/date/imageUrl), no `content`.

### [MEDIUM/security] .replit está versionado y expone ADMIN_EMAIL + ADMIN_PASSWORD_HASH (bcrypt) del admin de producción
- **Ubicación:** `.replit:48-49`
- **Mecanismo:** `git show HEAD:.replit` confirma que el archivo está en el repo con ADMIN_EMAIL='admin@vonwobeser.com' y ADMIN_PASSWORD_HASH='$2b$10$Yjjkl...' en [userenv.shared]. server/seed.ts lee process.env.ADMIN_PASSWORD_HASH para bootstrap del super_admin, así que este hash es la credencial real del único admin. Aunque bcrypt es lento de romper, publicar el hash del admin de producción en un repo (privado pero compartido entre agentes/SATMA) permite ataque offline de diccionario sin rate-limit y revela el email del admin para credential-stuffing del login (POST /api/admin/login).
- **Fix:** Mover ADMIN_EMAIL/ADMIN_PASSWORD_HASH a Replit Secrets (no a [userenv.shared] versionado). Purgar del historial git y rotar la contraseña del admin tras desplegar.

### [MEDIUM/quality] No existe pipeline CI (.github ausente): tsc/test/smoke solo corren manualmente en local macOS, nunca en Linux
- **Ubicación:** `package.json:6-13`
- **Mecanismo:** No hay directorio .github ni workflow alguno (find vacío). Los gates (check=tsc, test=vitest, smoke) dependen de ejecución manual del operador. La MEMORY documenta el riesgo recurrente 'verde local macOS ≠ verde CI Linux' y el hazard iCloud que evicta chunks de dist/public/assets dejando un cascarón. Sin CI, una regresión de typecheck, un test roto o un build mutilado puede pushearse/desplegarse sin detección automática; el smoke anti-cascarón (la única defensa contra la página en blanco) solo corre si alguien se acuerda de lanzarlo.
- **Fix:** Añadir un workflow de GitHub Actions (ubuntu-latest, node 20) que corra npm ci, npm run check, npm test, npm run build y el smoke contra un server arrancado del build de prod. Esto cierra a la vez el gap de OS y el hazard del cascarón.



## Fase 6 — Regresiones detectadas (Cazador) y corregidas
Tras reparar, un escuadrón "Cazador de Regresiones" revisó el diff completo. Halló **5 regresiones introducidas por los fixes**, todas corregidas y verificadas corriendo:

| Sev | Archivo | Regresión introducida | Corrección |
|---|---|---|---|
| HIGH | server/index.ts | La CSP de helmet sin `frame-src` bloqueaba el iframe de Google Maps (Home/Contact/Offices) → mapa en blanco | + `frameSrc: ['self', 'https://www.google.com']`; verificado en navegador: 0 "Refused to frame" |
| HIGH | AdminArticleDetail.tsx | El filtro de borradores en GET /api/news/:idOrSlug devolvía 404 al detalle admin (la query no enviaba el Bearer) → flujo de revisión/publicación roto | queryFn con adminApiRequest (Bearer); verificado: 200 + Authorization |
| LOW | server/routes.ts | totalPages con limit sin capar vs storage que capa a 100 (filas inaccesibles si limit>100) | `Math.min(100, limit)` en la ruta |
| LOW | AdminArticleDetail.tsx | El nuevo estado needs_manual_review sin etiqueta/color (badge gris con string crudo) | + case con label bilingüe + color ámbar |
| LOW | CookieBanner.tsx | Restauración de foco a un nodo ya desmontado (foco caía al body) | guard `document.contains` |

## Verificación final (corriendo, no estática)
- **tsc**: verde sobre todo el código **tracked**. Los únicos errores residuales son de componentes **muertos UNTRACKED** que iCloud rematerializó (HeroSection/NewsSection/… raíz, 0 importadores) — no son parte de este trabajo, no se commitean; en checkout limpio/CI tsc pasa.
- **vitest** 18/18 · **smoke** 22/22.
- **Navegador (Playwright)**: la CSP no rompe el SPA; el iframe de Maps carga; la búsqueda del header sigue viva; AdminEvents carga (200, antes 401); el panel de traducciones recortado a EN/ES (843 filas, 0 botón Translate, 0 idiomas no soportados); el detalle admin autentica.

## Decisiones del usuario
- **Panel de traducciones**: recortado a **EN/ES** (no se revivieron los 10 idiomas).
- **Secretos de .replit**: retirados del archivo versionado. **Pendiente del usuario**: configurarlos en Replit → Secrets y **rotar la contraseña del admin**.

## Hazard recordado
- **iCloud/dataless** rematerializa componentes muertos en `client/src/components/*Section.tsx` (raíz) que rompen `tsc` local. Mover el repo fuera de `~/Desktop` lo evita. Estos archivos NO se commitearon.
