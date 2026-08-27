# Contexto vigente — Von Wobeser y Sierra

Última actualización: **2026-08-26, America/Monterrey**.

Este archivo es el punto de entrada para continuar el proyecto. El estado completo de
arquitectura, contenido, CMS, agentes, seguridad, navegación, auditorías, Replit, despliegue y
pendientes se encuentra en
[`docs/CONTEXT-2026-08-26.md`](docs/CONTEXT-2026-08-26.md).

## Estado breve

- Fuente de verdad: `ia-satma/Webpage-Von-Wobeser`, rama `main`.
- Commit vigente en `main`: `029911d` (`feat: separate attorney surnames for public directory`),
  enviado a `origin/main` el 26-ago-2026. Replit descargó el SHA, aplicó la migración aditiva de
  apellidos y terminó `npm run build` correctamente; Publishing sigue siendo una acción explícita
  desde su panel.
- Sitio público: espejo editorial HTML/Joomla servido y enriquecido por Express; **no es React**.
- Administración: SPA React únicamente bajo `/admin/*`.
- Datos: PostgreSQL/Drizzle con migraciones versionadas, transaccionales e idempotentes. Cada
  perfil de abogado ya conserva `Nombre(s)`, `primer apellido` y `segundo apellido` como datos
  independientes; el sitio muestra sólo nombre(s) y primer apellido.
- Archivos persistentes: Replit App Storage; PostgreSQL conserva rutas y metadatos.
- Idiomas y tipografía: ES/EN; Gelasio para jerarquía editorial e Inter para cuerpo e interfaz.
- Contenido canónico: 18 prácticas, 7 industrias y 133 perfiles oficiales. El directorio
  público conserva 26 Socios, 6 Of Counsel, 9 Consejeros y 92 Asociados oficiales. Nueve
  Asociados históricos adicionales siguen en Administración, pero están ocultos por decisión
  editorial reversible.
- Aviso de Privacidad: contenido VWyS 2026 bilingüe y administrable, actualizado a agosto de
  2026; los cambios siguen el flujo de Configuración del sitio.
- Hero de Inicio: los medios actuales persisten en App Storage con historial administrativo; el
  video previo no se elimina del historial. Conservar derivados de escritorio, móvil y póster.
- Navegación activa: menú definitivo 2026, con `Insights` en ambos idiomas; el menú clásico
  continúa disponible como respaldo reversible desde el CMS.
- Publicaciones: 11 notas bilingües de 2026 incorporadas con 22 PDF y relaciones de autores;
  las consultas muestran primero contenido con fecha reciente y conservan después los registros
  sin fecha.
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
  una cabecera editorial visible y el buscador accesible común, siempre contra contenido publicado
  administrado.
- Última validación local: tipos, build y **494** pruebas de seguridad aprobadas. La migración de
  apellidos fue aplicada localmente y validada en Replit; la consulta verificó 142 perfiles con
  nombres estructurados, cero fugas de segundo apellido en presentación pública y cero inversiones
  entre los 92 Asociados publicados ordenados por primer apellido. Replit confirmó el build
  posterior al pull.

## Reglas de continuidad

1. Leer primero [`docs/CONTEXT-2026-08-26.md`](docs/CONTEXT-2026-08-26.md), su antecedente
   [`docs/CONTEXT-2026-08-21.md`](docs/CONTEXT-2026-08-21.md) y `replit.md`.
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
