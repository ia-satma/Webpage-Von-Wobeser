# Rutas del servidor

`server/routes.ts` es únicamente el compositor: prepara parámetros globales,
WebSocket y registra los módulos en el orden histórico. Los handlers viven aquí,
agrupados por dominio.

Reglas para cambios nuevos:

- Registrar la ruta en el módulo de su dominio; no volver a agregar handlers al compositor.
- Conservar el orden cuando una ruta estática comparte método y prefijo con una ruta dinámica.
- Reutilizar `routeUtils.ts`, `uploadMiddleware.ts` y `managedMedia.ts` para no duplicar seguridad.
- Toda ruta administrativa debe declarar explícitamente autenticación y permiso.
- Si cambia un método, path u orden, actualizar deliberadamente el contrato de
  `server/security/routeModularity.test.ts` después de revisar compatibilidad.

Módulos principales:

- `public*`: APIs y archivos públicos.
- `admin*`: autenticación, CMS, catálogos, envíos y medios.
- `agent*`: pipelines e historiales generados.
- `translationRoutes.ts`, `newsWorkflowRoutes.ts` y `systemAuditRoutes.ts`:
  flujos especializados.
