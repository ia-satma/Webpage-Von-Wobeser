# Von Wobeser y Sierra — Plataforma Web

Plataforma web del despacho de abogados **Von Wobeser y Sierra**: sitio público + CMS + malla de agentes de IA, en un solo servidor Express (Node 20 + TypeScript).

> **Documentación completa para agentes/ingenieros:** ver [`replit.md`](./replit.md). Léelo antes de tocar el código — explica la arquitectura crítica que evita romper el sitio.

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
- `npm run start` → producción (`node dist/index.cjs`), lo que usa Replit en Deploy.
- `npm run db:push` → aplica el esquema Drizzle a Neon (manual).

## Variables de entorno

Única obligatoria para arrancar: **`DATABASE_URL`** (Neon). Las demás (IA, admin, imágenes, pCloud) son opcionales y degradan con gracia. Lista completa en [`replit.md`](./replit.md#secrets--variables-de-entorno).

## ⚠️ No borrar `frontend-mirror/`

Es el sitio público completo (~1.2 GB, dentro del repo). Si falta, `setupMirror()` se desactiva **en silencio** y toda navegación pública termina redirigida a `/admin/login`. Detalle en [`replit.md`](./replit.md).
