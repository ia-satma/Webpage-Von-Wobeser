# Von Wobeser y Sierra — Sitio + Panel + Agentes de IA

## Overview

Este proyecto es la plataforma web del despacho de abogados **Von Wobeser y Sierra**. Su arquitectura tiene cuatro piezas que conviven en un mismo servidor Express (Node 20 + TypeScript):

- **Sitio público = un ESPEJO estático**, no una app de React. El HTML del sitio original (Joomla) vive en `frontend-mirror/` y en cada request se re-parsea con **cheerio** para inyectarle datos frescos de la base de datos (abogados, noticias, grupos, configuración). Este es el frontend que ven los visitantes.
- **Backend Express** sobre **Neon PostgreSQL** (Drizzle ORM) que sirve la API, el espejo y el panel.
- **Panel de administración en React** (SPA con `wouter`), que existe **SOLO** bajo `/admin/*`. Es el CMS.
- **Malla de 13 agentes de IA** (OpenAI vía AI Integrations de Replit) que redactan, traducen, auditan, optimizan SEO, generan imágenes y voz.

---

## Arquitectura crítica que un agente DEBE entender antes de tocar nada

Lee esto completo antes de mover un solo archivo. Tres cosas rompen "todo el sitio" de forma silenciosa si no se entienden.

### (a) El sitio público NO es React. Es el ESPEJO.
La app de React de `client/` **no** contiene ninguna página pública. Un comentario explícito en `client/src/App.tsx` lo dice: *"The public site is served by the mirror frontend (Express, server/mirror). This React app is the ADMIN PANEL ONLY. Public redesign pages were removed."* Buscar la home, `/attorneys` o `/news` dentro de la app de React es en vano — se sirven desde `server/mirror` leyendo `frontend-mirror/`. Editar contenido público se hace por el panel (site-config, news, team...), que persiste a la BD que el espejo consume.

### (b) `setupMirror()` puede desactivar TODO el sitio público en silencio — y por eso `frontend-mirror/` NO se borra
`setupMirror()` (en `server/mirror/index.ts`) hace un **`return` temprano** si no encuentra la plantilla-guardia `frontend-mirror/index.php/lawyer/l-134.html`. Cuando eso pasa:
- **NO se registra NINGUNA ruta pública** (ni `/`, ni `/attorneys`, ni `/news`, ni los assets estáticos, ni el catch-all del espejo).
- El único rastro es un `console.warn: '[mirror] Plantilla no encontrada... Rutas del espejo deshabilitadas.'` — **no lanza excepción, no rompe el arranque**.
- **Consecuencia:** toda navegación pública cae hasta el catch-all de la SPA de React, cuyo `/` hace `Redirect` a `/admin/login`. **Síntoma observable: "todo el sitio manda al login".** La causa casi siempre es que `frontend-mirror/` no está presente en el deploy.

Por esto, **`frontend-mirror/` es un activo de runtime imprescindible que vive DENTRO del repo (~1.2 GB) y NO se debe borrar, mover ni "limpiar"**. Es distinto de `gh-pages` (ese es otro espejo estático manual, no este). Si necesitas apuntar a otra copia, usa la env `MIRROR_DIR`, pero esa copia debe contener `index.html` **y** `index.php/lawyer/l-134.html`.

- Matiz: `getMirrorDir()` decide el directorio por la existencia de `index.html`, pero la **guardia** de `setupMirror()` valida un archivo **distinto** (`index.php/lawyer/l-134.html`). Un directorio con `index.html` pero sin esa plantilla-guardia igual dispara el return temprano.
- Las plantillas del espejo (HTML de hasta ~181 KB) se memoizan en RAM (`templateCache` / `warmTemplates`). No romper ese cacheo.

### (c) La app de React es solo el admin y su `/` redirige a `/admin/login`
`client/src/App.tsx` usa `wouter`. La ruta raíz `/` hace `<Redirect to="/admin/login" />`. Por eso, si el espejo está caído, el único frontend vivo es esta SPA y su `/` manda al login. **Diagnostica el espejo (`server/mirror`), no el Router de React.**

### Orden de registro (load-bearing) en `server/index.ts`
El IIFE async registra en este orden EXACTO y no debe alterarse:
1. `registerRoutes(httpServer, app)` — API (`/api/*`).
2. `setupMirror(app)` — sitio público del espejo (importado dinámicamente).
3. Middleware de manejo de errores (4 args).
4. Según `NODE_ENV`: producción → `serveStatic(app)`; dev → `setupVite(httpServer, app)` (catch-all de la SPA con HMR).
5. `httpServer.listen(...)`.

El catch-all de la SPA (paso 4) DEBE ir al final: si se mueve antes de la API o del espejo, se traga esas peticiones. El espejo va después de la API y antes del catch-all para no ensombrecer `/api` ni ser ensombrecido. El orquestador de agentes y los schedulers arrancan **dentro del callback de `listen()`** — si el puerto no bindea, no se inicializan.

---

## Cómo correr

Scripts (`package.json`):

| Script | Comando | Uso |
|---|---|---|
| `dev` | `NODE_ENV=development tsx server/index.ts` | Desarrollo. `tsx` corre el TS directo; da Vite + HMR. **Es lo que Replit ejecuta en Run.** |
| `build` | `tsx script/build.ts` | Build custom. Produce `dist/index.cjs`. |
| `start` | `NODE_ENV=production node dist/index.cjs` | Producción. **Es lo que Replit ejecuta en Deploy.** Usa `serveStatic`. |
| `check` | `tsc` | Type-check. |
| `db:push` | `drizzle-kit push` | Migraciones de esquema contra Neon (manual). |

- **Puerto:** `process.env.PORT || 5000`. `.replit` fija `PORT=5000` y mapea `localPort 5000 → externalPort 80`. Bind a `0.0.0.0`.
- **Replit config (`.replit`):** `modules = ['nodejs-20','web']`; `run = 'npm run dev'`; `[deployment]` target `autoscale`, `build = ['npm','run','build']`, `run = ['npm','run','start']`; workflow "Start application" espera el puerto 5000.
- **Gotcha del build:** el script es `tsx script/build.ts` — carpeta **`script/` en SINGULAR**. No confundir con `scripts/` (que existe para `post-merge.sh` y scripts de verificación). Confundirlas rompe el build.
- **Gotcha macOS:** `reusePort` solo se pasa en Linux (`process.platform === 'linux'`); en Mac lanzaría `ENOTSUP`. Por eso correr local en Mac funciona.

---

## Los 13 agentes de IA

Disparo central: **`POST /api/agents/run/:agentType`** (`server/agents/api/agentRoutes.ts`), un `switch` de exactamente 13 casos que llama `<agent>.execute(...)` sobre singletons. El router se monta con `authMiddleware, requirePermission('agents')` — **todo requiere sesión admin autenticada + permiso `agents`**. Registro de los 13 en `server/agents/index.ts` (`orchestrator.registerAgent(...)`).

**Todos los agentes que usan LLM usan `gpt-4o` (fallback `gpt-4o-mini` solo ante error de cuota 429/rate-limit), vía el cliente OpenAI apuntando a AI Integrations de Replit. CERO Claude/Anthropic en código activo.** (La única mención a `claude-sonnet` es un comentario histórico ya muerto en `server/openai.ts`.)

| agentType | Nombre | LLM | Modelo | Disparador | Qué hace |
|---|---|---|---|---|---|
| `formatter` | Article Formatter | Sí | gpt-4o | botón panel + pipeline | Limpia/reformatea artículos legales de PDFs; devuelve title/content/excerpt. |
| `metadata_linker` | Metadata Linker | Sí | gpt-4o | run + auto (website_auditor) | Vincula artículo a autores, prácticas e industrias en la BD. |
| `polyglot_translator` | Polyglot Translator | Sí | gpt-4o | run + auto (auditores) | Traduce noticias (fuente ES) a idiomas activos con terminología legal; cachea. |
| `content_auditor` | Content Auditor | **No (estructural)** | n/a | run + `POST /api/agents/audit` | Escanea la BD con checks en código (regex/longitudes) y sugiere qué agente arregla. |
| `seo_optimizer` | SEO Optimizer | Sí | gpt-4o | run + auto | Optimiza título/meta/slug/keywords; aplica cambios si mejora el score. |
| `image_suggestion` | Image Suggestion | Sí | gpt-4o | botón + `generate-image/:articleId` | Genera prompt con marca y delega en SmartImageGenerator. |
| `category_agent` | Category Agent | Sí | gpt-4o | run | Clasifica el artículo (categoría, prácticas, industrias, tags) y la escribe en `news`. |
| `website_auditor` | Website Auditor | **No (estructural)** | n/a | run + **scheduler** | Audita enlaces/imágenes/traducciones/SEO; auto-fix de imágenes rotas; auto-encola fixers. |
| `content_analyzer` | Content Analyzer | Sí | gpt-4o | run + `analyze/:articleId` | Reporte integral del artículo (SEO, ortografía, abogados, industrias, quality score). |
| `social_media` | Social Media | Sí | gpt-4o | botón AgentTools | Convierte noticia en posts para LinkedIn y X (español) + imagen. |
| `newsletter` | Newsletter | Sí | gpt-4o | botón AgentTools | Compila noticias recientes en un boletín HTML con subject/preheader. |
| `legal_alerts` | Legal Alerts | Sí | gpt-4o | botón + scanner programado | Desde fuente oficial MX (.gob.mx/cofece, allowlist anti-SSRF) redacta un **borrador** bilingüe (noticia no publicada, `ready_for_approval`). |
| `voice_agent` | Voice Agent | **No (estructural)** | n/a | botones "Generar audio" | Toma texto ya generado y lo convierte a voz con OpenAI TTS (no llama a LLM de texto). |

- **3 son estructurales** (`content_auditor`, `website_auditor`, `voice_agent`): no gastan LLM de texto. Cuidado: `content_auditor` y `website_auditor` **declaran** `model:'gpt-4o'` en su config pero **nunca invocan `callLLM`**. El único indicador fiable de "estructural" es leer si `execute()` llama `this.callLLM()`, no la config.
- Cómo llaman al LLM: `BaseAgent.callLLM()` → cliente `openai` de `server/openai.ts` → modelo `gpt-4o`, fallback `gpt-4o-mini`.
- Otros disparadores en el mismo router: `POST /audit`, `POST|GET /analyze/:articleId`, `POST /pipeline/:articleId` + `/pipeline/batch` + `/pipeline/process-all`, `POST /queue`, `GET /status|/jobs|/jobs/failed`, `/evolution/*`, `/knowledge/:agentType`, `/pcloud/*`.
- Si `AI_INTEGRATIONS_OPENAI_*` no están inyectadas, el cliente es lazy (no crashea al importar) pero la **primera** llamada real de un agente-LLM falla; los estructurales siguen (salvo voice, que necesita la key del TTS).

---

## Servicios de IA

- **LegalCouncilService** (`services/agents/LegalCouncilService.ts`): "consejo legal" multi-agente que evalúa calidad/riesgo de un artículo. Corre 3 evaluadores en paralelo (Legal Scholar, Risk Analyst, Brand Guardian) con `Promise.allSettled`; cada uno devuelve `{score, decision, reasoning}` y se agregan en un `CouncilVerdict`. Usa **`fetch` crudo** a `${openaiBaseUrl}/chat/completions`, **model `gpt-4o`** (no el SDK, no Claude). Un evaluador que falla recibe abstención de sistema (score 50).
- **VoiceGenerator** (`server/services/VoiceGenerator.ts`): texto-a-voz con **OpenAI TTS `tts-1`** (voz `alloy`), vía el cliente `openai` compartido. Guarda mp3 en `public/generated-audio/` y registra el asset. **No usa ElevenLabs** (no está en AI Integrations de Replit). Si falta `AI_INTEGRATIONS_OPENAI_API_KEY` hace early-return con `not_configured`. Trunca a 4000 chars.
- **SmartImageGenerator** (`server/services/SmartImageGenerator.ts`): imágenes con marca Von Wobeser. Cascada real: **Cloudflare Workers AI (Flux, gratis) → Gemini `gemini-2.5-flash-image` (pago) → placeholder SVG**. Sanitiza términos legales sensibles y superpone el logo con `sharp`. Un `success:true` puede ser solo el placeholder (`fallbackUsed:true`), no una imagen real.

---

## Datos

- **BD = Neon PostgreSQL** con **Drizzle ORM** (driver `drizzle-orm/neon-http`). `server/db.ts` crea `db = drizzle(neon(process.env.DATABASE_URL!), { schema })` — punto de entrada único a la BD.
- **`DATABASE_URL` es la ÚNICA env estrictamente obligatoria para arrancar.** `db.ts` la usa con `!` (aserción, no salvaguarda): si falta, `neon()` lanza al importar y el proceso crashea antes de escuchar.
- **49 tablas** en `shared/schema.ts`, agrupadas en: **contenido público** (news, news_translations, practice_groups, industry_groups, team_members y relaciones, representative_matters, specialized_desks, rankings, awards, offices, alliances, faqs, events, banners, site_config, contact_submissions, career_applications, ...), **agentes de IA** (agent_jobs, agent_events, agent_knowledge, agent_skills, agent_evolution_proposals, content_analysis, website_audits, website_audit_findings, processed_official_sources, generated_images, generated_audio), y **sistema/auth** (admin_users, admin_login_events, admin_sessions, media_items, y una tabla `users` **legacy que NO usa el panel**).
- **El contenido es REAL** (extraído del sitio Von Wobeser y Sierra, migrado de Joomla — `news.legacyId` mapea el `p_id` original), NO mock. Volúmenes en prod: ~134 abogados, 18 prácticas, 7 industrias, ~1742 publicaciones.
- **Seed (`server/seed.ts`):** se invoca en CADA arranque desde `registerRoutes()`. Para cada tabla de contenido inserta datos semilla **solo si está vacía** (idempotente; en prod se salta). Es bootstrap para BD vacía, no la fuente de la data real; **nunca actualiza ni borra**.
- **Admin en el seed:** si `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH` están y el email no existe, crea `super_admin` (`onConflictDoNothing`, nunca sobreescribe). `ADMIN_RESET_PASSWORD` (botón de pánico) **sobreescribe la contraseña en texto plano en CADA arranque** — hay que **quitarla de Secrets** tras usarla o cada reinicio la reaplica.
- **Migraciones:** `npm run db:push` (`drizzle-kit push`, push directo sin archivos SQL versionados). El tooling de BD integrado de Replit **no** soporta push contra una BD externa como Neon — es normal, se corre manualmente.

---

## Panel de administración (`/admin/*`)

React 18 + `wouter`. Entrada `client/src/main.tsx` → `<App />`. Providers: QueryClientProvider (TanStack Query) > TooltipProvider > LanguageProvider > Router. Todas las páginas cargan con `React.lazy()` + `<Suspense fallback={null}>`.

Rutas principales:
- `/` → Redirect a `/admin/login` · `/admin` → Redirect a `/admin/dashboard`
- `/admin/login` (única ruta admin **sin** `AdminLayout` shell)
- `/admin/dashboard`, `/admin/manual`, `/admin/guide`, `/admin/coming-soon/:key`
- `/admin/site-config` y `/admin/site-config/:section`
- `/admin/users` (usuarios y roles), `/admin/submissions`, `/admin/recognitions`, `/admin/desks`
- `/admin/news` (+ `/new`, `/:id/edit`, `/:id`), `/admin/agents`, `/admin/processing`, `/admin/audits`
- `/admin/team` (+ `/new`, `/:id/edit`), `/admin/practice-groups`, `/admin/industry-groups`
- `/admin/knowledge`, `/admin/translations`, `/admin/events`, `/admin/health-check`, `/admin/explorer`, `/admin/performance`
- `/admin/gallery`, `/admin/generated-images`, `/admin/generated-audio`
- `*` → `NotFound` (404)

Login: el endpoint `POST /api/admin/login` espera el campo **`username`** (acepta el email como su valor), no `email`.

---

## Secrets / variables de entorno

**Obligatoria para arrancar (una sola):**
- `DATABASE_URL` — conexión a Neon. Sin ella el proceso crashea al importar.

**Opcionales (degradan con gracia; el server arranca sin ellas):**

*IA (integración administrada de Replit — AI Integrations / Model Farm):*
- `AI_INTEGRATIONS_OPENAI_API_KEY` y `AI_INTEGRATIONS_OPENAI_BASE_URL` — necesarias para los 10 agentes-LLM, el TTS de voz y LegalCouncilService. **Nota:** las inyecta el sistema de AI Integrations de Replit en runtime; **el aprovisionamiento de esta integración puede estar pendiente y hay que gestionarlo con el soporte de Replit** (declarar `javascript_openai_ai_integrations` en `.replit` es solo metadata, no inyecta las vars). Sin ellas la app arranca y solo fallan las features de IA/traducción/voz (con errorCode diferido, no crash).
- `AI_INTEGRATIONS_GEMINI_API_KEY` y `AI_INTEGRATIONS_GEMINI_BASE_URL` — fallback de imágenes (Gemini).
- `CLOUDFLARE_ACCOUNT_ID` y `CLOUDFLARE_API_TOKEN` — motor primario (gratis) de imágenes; si faltan, cae a Gemini.

*Admin (seed):*
- `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH` — crean el super_admin inicial si no existe.
- `ADMIN_RESET_PASSWORD` — botón de pánico; sobreescribe la contraseña en cada arranque. **Borrar de Secrets tras usarla.**

*Almacenamiento de agentes:* `PCLOUD_USERNAME`, `PCLOUD_PASSWORD` — pCloud; si faltan, `authenticate()` devuelve false.

*Red / runtime:* `PORT` (default 5000), `NODE_ENV`, `CORS_ORIGIN` (vacío = sin cross-origin; el admin es same-origin), `SITE_URL` (default `https://www.vonwobeser.com`; base de canonical/OG/sitemap, se lee una vez al arranque), `MIRROR_DIR` (override del directorio del espejo; casi nunca hace falta por los fallbacks).

Notas:
- **`SESSION_SECRET` NO se usa** en el código. Las sesiones del admin se respaldan en BD (`admin_sessions` con token), no con cookies firmadas.
- `site_url`, `ga4_measurement_id` y `google_site_verification` se leen **una vez al arranque**; editarlos en el panel requiere reiniciar.
- `helmet` corre con `contentSecurityPolicy:false` a propósito (el espejo usa scripts/estilos inline); no asumir CSP activa.
- El cliente OpenAI en `server/openai.ts` es lazy-init (envoltura `Proxy`), así que credenciales faltantes fallan por-request, no al arrancar.

---

## Preferencias del usuario

- **Comunicación en lenguaje simple y cotidiano**, sin jerga técnica innecesaria. Explicar el "qué" y el "por qué" con palabras llanas; reservar los detalles técnicos para cuando de verdad hagan falta.
