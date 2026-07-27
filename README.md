# Von Wobeser y Sierra — Plataforma Web

Plataforma web del despacho de abogados **Von Wobeser y Sierra**: sitio público + CMS + malla de agentes de IA, en un solo servidor Express (Node 24 + TypeScript).

> **Documentación completa para agentes/ingenieros:** ver [`replit.md`](./replit.md). Léelo antes de tocar el código — explica la arquitectura crítica que evita romper el sitio.

> **Contexto más reciente:** [`docs/CONTEXT-2026-07-23.md`](./docs/CONTEXT-2026-07-23.md) resume
> la jornada de seguridad, acceso administrativo, landing institucional y sincronización con Replit.

## Arquitectura en 30 segundos

- **Sitio público** → un **espejo estático** (`frontend-mirror/`, HTML del sitio original) servido por Express + cheerio, que inyecta datos de la BD en cada request. **No es React.**
- **Panel de administración (CMS)** → app de React (`client/`, SPA con wouter), **solo** bajo `/admin/*`.
- **Backend** → Express + **Neon PostgreSQL** (Drizzle ORM).
- **13 agentes de IA** → OpenAI (`gpt-4o`) vía AI Integrations de Replit: redacción, traducción, SEO, auditoría, imágenes y voz (TTS).

## Correr localmente

```bash
npm install
npm run dev      # NODE_ENV=development, tsx + Vite/HMR, puerto 5000 (o PORT)
```

- `npm run build` → produce `dist/index.cjs`.
- `npm run start` → inicia el build de producción (`node dist/index.cjs`).
- `npm run start:deploy` → aplica migraciones y después inicia producción; es lo que usa Replit en Deploy.
- `npm run db:migrate` → aplica migraciones SQL versionadas e idempotentes.
- `npm run media:migrate-storage` → copia imágenes y videos históricos de runtime a Replit App Storage.
- `npm run admin:recover -- --confirm=<correo>` → recuperación manual usando exclusivamente los Secrets `ADMIN_EMAIL` y `ADMIN_BOOTSTRAP_PASSWORD`.

## Variables de entorno

Única obligatoria para arrancar: **`DATABASE_URL`** (Neon). Las demás (IA, admin, imágenes, pCloud) son opcionales y degradan con gracia. Lista completa en [`replit.md`](./replit.md#secrets--variables-de-entorno).

## Medios administrados

Los archivos cargados desde el panel se conservan en **Replit App Storage**. PostgreSQL
guarda sus rutas y metadatos; `/uploads/*` sirve una copia local caliente cuando existe
y recupera automáticamente el objeto persistente después de reinicios o publicaciones.
En Replit, una carga falla de forma segura si el bucket no está conectado: nunca se
confirma un archivo que pueda desaparecer con el siguiente deployment.

## ⚠️ No borrar `frontend-mirror/`

Es el sitio público completo (~1.2 GB, dentro del repo). Si falta, `setupMirror()` se desactiva **en silencio** y toda navegación pública termina redirigida a `/admin/login`. Detalle en [`replit.md`](./replit.md).
