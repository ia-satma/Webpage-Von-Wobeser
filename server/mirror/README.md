# Espejo público

`index.ts` es únicamente el compositor del frontend público. Inicializa un
`MirrorRuntime` compartido y registra los módulos en el orden histórico.

Responsabilidades:

- `htmlPipeline.ts`: plantillas, idioma y transformación segura del HTML
  heredado (accesibilidad, navegación, CSP, SRI y caché de documentos).
- `runtime.ts`: inicialización, mapas de IDs y handlers de render reutilizables.
- `routes/publicRoutes.ts`: URLs públicas limpias y APIs públicas del espejo.
- `routes/legacyRedirectRoutes.ts`: canonicalización y redirecciones Joomla.
- `routes/institutionalRoutes.ts`: Firma, Contacto, Carrera, capacidades y
  políticas.
- `routes/originalRoutes.ts`: render dinámico de las URLs originales que deben
  seguir resolviendo.
- `routes/adminRoutes.ts`: configuración del espejo protegida por permisos.
- `routes/assetFallbackRoutes.ts`: assets históricos, HTML de respaldo y 404.

Reglas para cambios nuevos:

- No registrar handlers directamente en `index.ts` ni `runtime.ts`.
- Conservar el orden del compositor; varias rutas históricas se solapan de forma
  deliberada y Express resuelve la primera coincidencia.
- Mantener las transformaciones de HTML libres de consultas y mutaciones de BD.
- Si cambia un método, path u orden, actualizar deliberadamente el contrato de
  `server/security/mirrorRouteModularity.test.ts` después de revisar SEO,
  redirecciones y compatibilidad.
- El catch-all y `express.static` siempre deben permanecer al final.
