# Von Wobeser y Sierra — Plataforma Web

Plataforma web del despacho de abogados **Von Wobeser y Sierra**: sitio público + CMS + malla de agentes de IA, en un solo servidor Express (Node 24 + TypeScript).

> **Documentación completa para agentes/ingenieros:** ver [`replit.md`](./replit.md). Léelo antes de tocar el código — explica la arquitectura crítica que evita romper el sitio.

> **Contexto más reciente:** [`docs/CONTEXT-2026-08-18.md`](./docs/CONTEXT-2026-08-18.md) consolida
> arquitectura, contenido, CMS, agentes, seguridad, navegación, auditorías, Replit y pendientes.

## Arquitectura en 30 segundos

- **Sitio público** → un **espejo estático** (`frontend-mirror/`, HTML del sitio original) servido por Express + cheerio, que inyecta datos de la BD en cada request. **No es React.**
- **Panel de administración (CMS)** → app de React (`client/`, SPA con wouter), **solo** bajo `/admin/*`.
- **Backend** → Express + **PostgreSQL administrado por Replit** (Drizzle ORM y `pg`).
- **14 agentes ejecutables** → `gpt-5.4-mini` para texto, `gpt-image-2` para imágenes y OpenAI TTS para audio; los auditores estructurales no consumen un modelo de texto.

## Correr localmente

```bash
npm install
npm run dev      # NODE_ENV=development, tsx + Vite/HMR, puerto 5000 (o PORT)
```

- `npm run build` → produce `dist/index.cjs`.
- `npm run start` → inicia el build de producción (`node dist/index.cjs`).
- `npm run start:workspace` → en un Repl nuevo detecta una entrega pendiente y muestra una pantalla segura; cuando la base está lista inicia el modo de desarrollo.
- `npm run start:deploy` → detecta una entrega pendiente sin fallar el deployment; con una base completa aplica migraciones y después inicia producción.
- `npm run db:migrate` → aplica migraciones SQL versionadas e idempotentes.
- `npm run db:replit-migrate -- <comando>` → audita, respalda, restaura y compara la migración a las bases administradas por Replit. Procedimiento en [`docs/REPLIT_DATABASE_MIGRATION.md`](./docs/REPLIT_DATABASE_MIGRATION.md).
- `npm run media:migrate-storage` → copia imágenes, videos, audio y PDF públicos a Replit App Storage; excluye presentaciones.
- `npm run presentations:inventory -- --output=/ruta/privada/inventario.json` → inventaría en solo lectura las presentaciones históricas y entrega su SHA-256.
- `npm run presentations:quarantine -- --inventory=... --confirm-sha256=... --confirm-scope=generated-presentations-only` → cuarentena recuperable; no implementa purga definitiva.
- `npm run media:migrate-private` → mueve CV históricos a la zona privada de App Storage y corrige sus referencias de forma segura.
- `npm run handoff:storage -- <export|import|verify>` → crea o restaura el paquete portable de medios públicos para una entrega por GitHub.
- `npm run handoff:private -- <export|import|verify>` → cifra, transporta y verifica los documentos privados sin exponerlos en Git.
- `npm run handoff:status -- --directory=.handoff` → detecta de forma segura si faltan Database, Secrets, App Storage, paquete o migraciones.
- `npm run handoff:install -- --directory=.handoff --confirm-database=<base> --confirm-owner-email=<correo>` → restaura la entrega completa en una Database nueva, crea o valida solo el Dueño del cliente y verifica el resultado.
- `npm run handoff:readiness -- --confirm-database=<base>` → comprueba que una instalación nueva tiene datos, medios públicos y CV privados completos.
- `npm run admin:recover -- --confirm=<correo>` → recuperación manual usando exclusivamente los Secrets `ADMIN_EMAIL` y `ADMIN_BOOTSTRAP_PASSWORD`.

La instalación en una cuenta nueva del cliente está documentada en
[`docs/CLIENT_REPLIT_HANDOFF.md`](./docs/CLIENT_REPLIT_HANDOFF.md). GitHub transporta
el código, pero la base, App Storage y Secrets se reconstruyen de forma segura dentro
del Replit del cliente. El instalador detecta permanentemente una cuenta nueva y evita
publicar el sitio antes de terminar la restauración.

## Variables de entorno

Única obligatoria para arrancar: **`DATABASE_URL`**, inyectada por la base correspondiente de Replit. Las demás (IA, admin, imágenes, pCloud) son opcionales y degradan con gracia. Lista completa en [`replit.md`](./replit.md#secrets--variables-de-entorno).

## Medios administrados

Los archivos cargados desde el panel se conservan en **Replit App Storage**. PostgreSQL
guarda sus rutas y metadatos; `/uploads/*` sirve una copia local caliente cuando existe
y recupera automáticamente el objeto persistente después de reinicios o publicaciones.
En Replit, una carga falla de forma segura si el bucket no está conectado: nunca se
confirma un archivo que pueda desaparecer con el siguiente deployment.

Los CV de solicitudes se almacenan bajo `von-wobeser/private/cvs/`, no se sirven desde
`/uploads` y solo se recuperan mediante una ruta administrativa autenticada. PostgreSQL
guarda una referencia privada, nunca los bytes ni la ruta original del equipo del usuario.

Las presentaciones nuevas se almacenan bajo
`von-wobeser/private/generated-presentations/<uuid>/`. Solo se transmiten mediante rutas
administrativas con permiso `agents`; el prefijo HTTP histórico
`/generated-presentations/*` responde 404.

## ⚠️ No borrar `frontend-mirror/`

Es el sitio público completo (~1.2 GB, dentro del repo). Si falta, `setupMirror()` se desactiva **en silencio** y toda navegación pública termina redirigida a `/admin/login`. Detalle en [`replit.md`](./replit.md).
