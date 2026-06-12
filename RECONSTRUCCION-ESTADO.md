# Estado de la reconstrucción — Webpage-Von-Wobeser

Rama: `reconstruccion`. Trabajo aplicado **en el código** y verificado en local (server en puerto 5001 contra `vonwobeser_dev`). Sin romper Replit: el driver de DB y el puerto detectan el entorno; los plugins de Vite de Replit y el driver Neon se conservan.

## Verificaciones globales
- **0 errores de TypeScript** en todo el proyecto (`npx tsc --noEmit`).
- **`npm run build` pasa** end-to-end: typecheck (nuevo gate) → vite (cliente) → esbuild (`dist/index.cjs`). Deployable.
- Server arranca limpio: 9 agentes registrados, seed idempotente, orquestador iniciado una sola vez.

## Olas aplicadas

### Ola 0 — Arranque local sin romper Replit
| Cambio | Archivo |
|---|---|
| Driver DB dual (Neon en Replit / node-postgres en local, por detección de entorno) | `server/db.ts` |
| Cliente OpenAI diferido (arranca sin API key) + modelo configurable `OPENAI_TRANSLATE_MODEL` (gpt-5 solo en Replit) | `server/openai.ts` |
| Carga de `.env` (dotenv, no-op en Replit) | `server/index.ts` |
| `reusePort` solo en Linux (ENOTSUP en macOS) | `server/index.ts` |
| Slug duplicado de dos abogados homónimos → `alejandro-torres-fiscal` | `server/seed.ts` |
| `.gitignore` completo, `.env.example`, `pg`/`dotenv` añadidos | varios |

### Ola 1 — Seguridad (P0) · verificada con curl
| Hallazgo | Estado |
|---|---|
| 22 endpoints `/api/agents/*` abiertos a internet | **Cerrados** (authMiddleware + requireRole) → 401 sin token |
| **Bug de roles**: super_admin recibía 403 en TODO el panel admin (61 endpoints rotos) | **Reparado** (bypass de super_admin en `requireRole`) |
| CORS `origin: true` (refleja cualquier origen con credenciales) | Allowlist desde `CORS_ORIGIN`, falla cerrado |
| Sin rate limiting salvo login | Limiters en traducción (OpenAI), contacto y agentes |
| Path traversal en `/generated-images/:filename` | Validación de nombre + contención de path → 400 |
| PII en logs (email de contacto, response body completo) | Removidos |
| `/api/system/chronicler`, `/api/health-check/run`, WebSocket `/ws/pipeline` abiertos | **Autenticados** (panel migrado a Bearer; WS válida token y no filtra) |

### Ola 2 — Sistema de agentes (P2): de fachada a honesto
| Hallazgo | Estado |
|---|---|
| Dashboard con `status:"active"` hardcodeado en los 14 agentes | **Estado real** derivado de la DB (jobs/eventos); sin actividad → `dormant` |
| `system_evolution.json` con 6 eventos ficticios (uno alarmante sobre "evadir filtros") | Reemplazado por hechos reales de la reconstrucción |
| `website_auditor` registrado pero inalcanzable en `/run` | Agregado al switch |
| Doble `initialize()` del orquestador en el boot | Idempotente |
| Modelo `gpt-5` hardcodeado | Configurable por entorno |

### Ola 3 — Datos (P1) + Frontend (P4) + Build (P6)
- **Datos**: 27 foreign keys (cascade en pivots, set-null en maestras) + 34 índices + límites de longitud (Zod). Migración `migrations/0000` generada y aplicada. Verificado que una FK **rechaza** datos huérfanos; seed idempotente (conteos estables).
- **Frontend**: AdminPerformance con **datos reales** (no mock; estados vacíos honestos donde no hay fuente); `queryKey` corregido; 5 componentes muertos eliminados; 8 `any` tipados; 3 errores TS preexistentes resueltos.
- **Design System**: 221 colores hex de marca → token `primary` (HSL verificado); `console.log` → logger con flag DEV; `rounded-full` decorativos corregidos.
- **Build**: allowlist limpio (deps muertas, nombre correcto `@google/genai`) + gate de typecheck pre-build.

## Pendiente / en curso
- **Features huérfanas (P3)** — en construcción: Newsletter (suscripción real), FAQs, Pro Bono, Diversity (conectar páginas existentes a datos reales + seed).
- **i18n (P5)** — refinamiento: cobertura 21/24 → 24/24 páginas, RTL real para árabe, hreflang consistente en sitemap.
- **Limpieza física de cruft** (~1.1 GB: `.local/`, screenshots, ZIPs, PDFs) — requiere tu confirmación para el borrado irreversible; ya está fuera del tracking vía `.gitignore`.

> Detalle completo de los 48 hallazgos con evidencia archivo:línea en `BITACORA-RECONSTRUCCION.md`.
