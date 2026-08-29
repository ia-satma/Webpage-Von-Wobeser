# Contexto vigente — Von Wobeser y Sierra

Última actualización: **2026-08-28, America/Monterrey**.

Este archivo es el punto de entrada para continuar el proyecto. El estado completo de
arquitectura, contenido, CMS, agentes, seguridad, navegación, auditorías, Replit, despliegue y
pendientes se encuentra en
[`docs/CONTEXT-2026-08-28.md`](docs/CONTEXT-2026-08-28.md). El antecedente detallado anterior
permanece en [`docs/CONTEXT-2026-08-26.md`](docs/CONTEXT-2026-08-26.md).

## Estado breve

- Fuente de verdad: `ia-satma/Webpage-Von-Wobeser`, rama `main`.
- Commit vigente en `main`: `a6c2408` (`Add Talent privacy notice and refine public pages`),
  enviado a `origin/main` el 28-ago-2026. Replit descargó ese SHA, terminó la migración idempotente
  de nombre público de Edmond Grieger, reconcilió los 26 Socios y aprobó TypeScript, **528/528**
  pruebas de seguridad, rendimiento y build. Falta solamente que el operador pulse **Republish**.
- Sitio público: espejo editorial HTML/Joomla servido y enriquecido por Express; **no es React**.
- Administración: SPA React únicamente bajo `/admin/*`.
- Datos: PostgreSQL/Drizzle con migraciones versionadas, transaccionales e idempotentes. Cada
  perfil de abogado ya conserva `Nombre(s)`, `primer apellido` y `segundo apellido` como datos
  independientes; Edmond Grieger conserva su nombre legal completo internamente, pero el sitio
  público muestra sólo **Edmond Grieger**.
- Archivos persistentes: Replit App Storage; PostgreSQL conserva rutas y metadatos.
- Idiomas y tipografía: ES/EN; Gelasio para jerarquía editorial e Inter para cuerpo e interfaz.
- Contenido canónico: 18 prácticas, 7 industrias y 133 perfiles oficiales. El directorio
  público conserva 26 Socios, 6 Of Counsel, 9 Consejeros y 92 Asociados oficiales. Nueve
  Asociados históricos adicionales siguen en Administración, pero están ocultos por decisión
  editorial reversible.
- Avisos de Privacidad: el aviso general VWyS 2026 es bilingüe y administrable. Talento usa un
  aviso independiente para Candidaturas, también bilingüe, editable en Administración y enlazado
  por todos sus formularios sin alterar sus endpoints.
- Hero de Inicio: los medios actuales persisten en App Storage con historial administrativo; el
  video previo no se elimina del historial. Conservar derivados de escritorio, móvil y póster.
- Navegación activa: menú definitivo 2026, con `Insights` en ambos idiomas; el menú clásico
  continúa disponible como respaldo reversible desde el CMS.
- Publicaciones: 11 notas bilingües de 2026 incorporadas con 22 PDF y relaciones de autores;
  las consultas muestran primero contenido con fecha reciente y conservan después los registros
  sin fecha. Los Artículos no repiten H1 en extractos ni muestran URLs crudas: usan resumen
  bilingüe y, cuando aplica, una CTA de fuente original segura.
- Agentes: 14 agentes canónicos y un historial privado, permanente e inmutable de Copys IA.
- Seguridad: CSP obligatoria con nonce, SRI local, cookies propias seguras, CV privados y
  controles de suministro/dependencias.
- Apariencia administrable: menú definitivo/clásico, Pie central 2026/clásico y buscador
  editorial/clásico son presets reversibles desde Administración.
- La navegación persistente de Inicio se extrae del hero histórico antes de renderizar. Esto evita
  que las capas del video o de carruseles vuelvan transparente o inoperante al menú al hacer scroll.
- Nuevas oficinas ya usa la navegación, el mapa y el pie compartidos del sitio: no conserva
  configuraciones duplicadas de logo, redes o footer. Desde Administración → Oficinas se enlaza
  a Navegación, Pie de página y Apariencia pública; los datos de contacto/mapa permanecen en sus
  controles administrables vigentes.
- El mapa compartido ahora se administra desde Administración → Configuración del sitio → Contacto;
  Contacto, Inicio y Nuevas oficinas consumen esas mismas URLs seguras. Oficinas conserva los
  datos específicos de oficina y un enlace al editor único, sin campos duplicados.
- Insights deja activas por decisión editorial sólo Artículos, Comunicaciones y Suscríbete; las
  demás entradas se mantienen recuperables desde Administración. Artículos y Comunicaciones usan
  una cabecera editorial visible, buscador accesible centrado, imagen lateral de oficinas y seis
  filas por página; tarjetas, búsqueda, filtros, idioma y paginación siguen siendo responsivos.
- Fichas públicas de abogados: nombre como H1 único, biografía breve desplegable con transición
  suave y texto `Ver menos`/`Show less`, menú/acordeón gris completo a la izquierda y tres
  **Perspectivas relacionadas** en orden cronológico descendente. Educación, experiencia,
  afiliaciones, reconocimientos e idiomas se conservan en la columna lateral; nunca se inventan
  atribuciones. Perfiles sin autoría pueden mostrar sólo `Lecturas relacionadas` de sus prácticas.
- Industrias: la vista pública muestra exclusivamente Socios publicados en el orden editorial
  oficial; conserva, sin borrar, vínculos internos de Asociados, Counsel y Of Counsel.
- SEO de despliegue: `SITE_URL`/`PUBLIC_SITE_URL` o la configuración institucional determinan la
  URL canónica. Nunca inferir canonical, `hreflang`, `og:url`, JSON-LD, sitemap ni `robots.txt`
  desde `REPLIT_DOMAINS`, pues expone dominios temporales de Preview. El valor institucional actual
  `https://www.vonwobeser.com` responde públicamente y es el canónico correcto.
- Última validación local y en Replit: TypeScript, rendimiento, build, `git diff --check` y
  **528/528** pruebas de seguridad aprobadas. Los avisos de Vite por assets históricos de
  `templates/beez3` se resuelven en runtime y no son errores de compilación.

## Reglas de continuidad

1. Leer primero [`docs/CONTEXT-2026-08-28.md`](docs/CONTEXT-2026-08-28.md), su antecedente
   [`docs/CONTEXT-2026-08-26.md`](docs/CONTEXT-2026-08-26.md) y `replit.md`.
2. No incluir contraseñas, tokens, URLs de base, paquetes `.handoff` ni valores de Secrets en Git,
   notas, comandos compartidos o capturas.
3. No borrar ni mover `frontend-mirror/`: es un activo obligatorio de runtime.
4. No ejecutar migraciones destructivas ni aceptar SQL `DROP` generado por Replit sin una
   revisión explícita.
5. No procesar directamente una publicación publicada: crear un borrador de trabajo.
6. No publicar cambios sin confirmar rama, SHA, CI, Preview y alcance de migraciones.
7. Antes de cerrar un lote: `npm run check`, `npm run test:security`,
   `npm run test:performance`, `npm run build` y `git diff --check`.
8. Para una cuenta Replit nueva, usar el flujo `handoff:status` → `handoff:install`; no sustituir
   una restauración completa por `db:migrate` sobre una base vacía.
9. Para comprobar la conexión de Git de una Shell de Replit sin modificar archivos, usar
   `git remote get-url origin && git ls-remote origin HEAD`. Si devuelve un SHA, ejecutar el pull
   y build; no regenerar ni compartir tokens por Shell o chat.
10. Una migración ya registrada en `app_schema_migrations` es inmutable: nunca editar su archivo
    para corregir comportamiento. Restaurar su SHA exacto y aplicar cualquier adaptación desde el
    ejecutor o una migración nueva, con una prueba de regresión antes de Publishing.
11. Un Preview deployment de Replit no copia automáticamente la base ni App Storage de una
    instancia instalada. Si muestra “Instalación del cliente pendiente”, no ejecutar handoff ni
    configurar Secrets: volver al Promote de la instancia real una vez validada la migración.
12. Si un commit ya publicado fue **enmendado** (como `a6c2408`), Replit no debe intentar un
    rebase normal sobre su SHA previo. Conservar primero sus archivos locales mediante stash y,
    sólo con autorización explícita, sincronizar `origin/main` con `git fetch` +
    `git reset --hard origin/main`. Después ejecutar las validaciones del lote.
13. Para auditorías SEO de Replit usar la raíz pública
    `https://webpage-von-wobeser-2026.replit.app/`, nunca `/index.html` ni
    `/index.php/index.html`: esas rutas históricas redirigen intencionalmente a la portada limpia.
