# Runbook de deploy a Replit — Von Wobeser (rama `chore/production-hardening`)

> Estado: **código pusheado a GitHub** (`ia-satma/Webpage-Von-Wobeser`, rama `chore/production-hardening`).
> Esta rama es la que trae el trabajo real listo para producción: robustecimiento, tests (vitest) y el **fix de seguridad crítico** que cerró el bypass de `/api/admin/init` (commit `953c02e`) más el hardening del sistema de agentes y los 3 fixes HIGH de frontend posteriores. La rama `feat/old-design-recreation` quedó **desfasada** y NO debe desplegarse.
> Lo que sigue **debe correr en Replit** (la DB de Replit es separada y los datos viven en la DB local; el mirror NO está en Replit, así que los scripts de migración no pueden correr allá — por eso se transfiere un **dump**).

## 0. Apuntar el deploy a la rama correcta
Replit por defecto deploya `origin/main` (viejo, ~18-may, SIN esta recreación). Hay que:
- En el workspace de Replit: `git fetch origin && git checkout chore/production-hardening` (o mergear la rama a la que Replit deploya).
- Confirmar que el deployment de Replit usa esa rama/commit. **HEAD debe ser `fb5325c` o posterior** y, de forma no negociable, **debe contener el fix de seguridad `953c02e`** (cierre del bypass de `/api/admin/init` + hardening de agentes). Si el commit desplegado NO incluye `953c02e`, ABORTAR el deploy: estarías exponiendo el endpoint de init sin auth.

## 1. Variables de entorno (Replit Secrets)
- `DATABASE_URL` → la inyecta Replit (Neon). **NO** uses la local.
- `NODE_ENV=production`, `PORT` → Replit lo maneja (mapea a 80).
- `ANTHROPIC_API_KEY` / `OPENAI_*` → **ya NO son necesarias para el i18n del sitio público** (la traducción ahora es estática EN/ES). Solo las usan features de agentes en /admin.

## 2. Esquema de DB
```bash
npm run db:push        # drizzle crea/sincroniza tablas en la DB de Replit
```

## 3. Restaurar los DATOS (lo que hace que las secciones no salgan vacías)
Sube `deploy/vonwobeser-db.sql.gz` al workspace y restaura:
```bash
gunzip -c deploy/vonwobeser-db.sql.gz | psql "$DATABASE_URL"
```
El dump trae 143 abogados (con bioEs), 18 prácticas, 7 industrias, **843 noticias bilingües**, matters, rankings, faqs, pro-bono, diversity, etc. (`--clean --if-exists`, así que recrea limpio).

## 4. Fotos de abogados (gitignored → van aparte)
Sube `deploy/partner_photos.tgz` (134 fotos) y extrae **antes del build** (Vite copia `client/public/` a `dist/public/`):
```bash
tar xzf deploy/partner_photos.tgz -C client/public/
# queda en client/public/partner_photos/<slug>.<ext>
```

## 5. Build + arranque
```bash
npm run build          # tsc + vite + esbuild → dist/
npm run start          # NODE_ENV=production node dist/index.cjs (sirve front + API mismo origen)
```
(El deployment autoscale de Replit ya está configurado con build=`npm run build`, run=`npm run start`.)

## 6. Verificación post-deploy
- Abrir la URL de Replit (NO localhost). Confirmar: Home con sliders de datos reales, Equipo con 143 abogados+fotos, Noticias con artículos.
- Alternar **EN↔ES** en el selector: el contenido debe cambiar (ej. "Partner"→"Socio").
- `GET /api/team` y `/api/news` deben devolver arrays no vacíos.

## Caveats / follow-ups (no bloquean el deploy)
- **PDFs de noticias:** los `pdf_url` apuntan a rutas del sitio viejo (`/images/PDF_news/...`). Para que descarguen, hay que servir esos PDFs (copiarlos del mirror a `client/public/images/` o reescribir el host). El **contenido/listado de noticias se ve sin ellos**.
- **Pro Bono / Diversidad:** páginas con texto fijo (bilingües y funcionan; no editables vía admin todavía).
- **iCloud/dataless:** mover el proyecto local fuera de `~/Desktop` (iCloud) evita timeouts de build/dev.
