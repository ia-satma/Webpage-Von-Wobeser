# Contexto vigente — Von Wobeser y Sierra

Última actualización: **2026-08-20, America/Monterrey**.

Este archivo es el punto de entrada para continuar el proyecto. El estado completo de
arquitectura, contenido, CMS, agentes, seguridad, navegación, auditorías, Replit, despliegue y
pendientes se encuentra en
[`docs/CONTEXT-2026-08-20.md`](docs/CONTEXT-2026-08-20.md).

## Estado breve

- Fuente de verdad: `ia-satma/Webpage-Von-Wobeser`, rama `main`.
- Commit vigente: `16c87c2` (`fix: stabilize home navigation outside hero`), enviado a
  `origin/main` el 20-ago-2026. La compilación de Replit terminó correctamente; confirmar
  Publishing desde su panel antes de considerar la entrega pública concluida.
- Sitio público: espejo editorial HTML/Joomla servido y enriquecido por Express; **no es React**.
- Administración: SPA React únicamente bajo `/admin/*`.
- Datos: PostgreSQL/Drizzle con **56 tablas y 627 columnas**; migraciones versionadas,
  transaccionales e idempotentes.
- Archivos persistentes: Replit App Storage; PostgreSQL conserva rutas y metadatos.
- Idiomas y tipografía: ES/EN; Gelasio para jerarquía editorial e Inter para cuerpo e interfaz.
- Contenido canónico: 18 prácticas, 7 industrias y 133 perfiles oficiales. El directorio
  público conserva 26 Socios, 6 Of Counsel, 9 Consejeros y 92 Asociados oficiales. Nueve
  Asociados históricos adicionales siguen en Administración, pero están ocultos por decisión
  editorial reversible.
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
- Última validación local: tipos, presupuesto de rendimiento, build y 460 pruebas de seguridad
  aprobadas; recorrido real de Inicio confirmó menú opaco, clicable y sin scroll horizontal.

## Reglas de continuidad

1. Leer primero [`docs/CONTEXT-2026-08-20.md`](docs/CONTEXT-2026-08-20.md) y `replit.md`.
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
