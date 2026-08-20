# Postura de seguridad vigente

Fecha de corte: 2026-08-20.
Referencia de código: `edb2e05d188834dc8b33b6a7b46bbefc9fefbc97` más la rama de remediación indicada en el PR vigente.

Este documento es la referencia operativa actual. Los archivos `docs/CONTEXT-*.md`
son registros históricos fechados y no deben usarse para inferir el estado presente.

## Estado comprobado

- El inventario ejecutable canónico contiene 14 agentes y se define en
  `shared/agentConstants.ts`.
- El acceso administrativo usa Argon2id, sesiones opacas almacenadas por hash,
  cookies HttpOnly/Secure/SameSite Strict en producción y CSRF para mutaciones.
- Las contraseñas nuevas aceptan de 15 a 128 caracteres. Las credenciales
  administrativas generadas tienen 20 caracteres. El login conserva compatibilidad
  con credenciales heredadas de 1 a 128 caracteres para no bloquear cuentas existentes.
- MFA TOTP está implementado, pero `MFA_REQUIRED_FOR_PRIVILEGED` permanece desactivado
  por decisión actual. Es un riesgo alto y bloquea el gate formal de entrega salvo
  aceptación temporal firmada por Sistemas.
- CSP se aplica en producción con nonce; desarrollo usa Report-Only. HSTS, `nosniff`,
  Referrer-Policy y Permissions-Policy se configuran en el servidor.
- El WebSocket exige sesión, origen válido, heartbeat y un máximo de tres conexiones por
  usuario. Todavía no exige de forma equivalente el permiso `agents`, no revalida la
  política MFA durante la conexión y difunde eventos globalmente. Su endurecimiento está
  pendiente para la Fase 2.
- El conector pCloud quedó retirado del runtime, de las rutas y del panel. Esta retirada
  no borra ni modifica archivos que ya existan en una cuenta pCloud.
- `SESSION_SECRET` no firma la cookie administrativa, pero sí es obligatorio en
  producción para firmar sesiones de carga fragmentada de medios.
- La revisión denominada históricamente `legal_council` es apoyo automatizado de tres
  agentes. No constituye asesoría ni dictamen jurídico y siempre requiere decisión humana.
- Las rutas públicas históricas de presentaciones y su almacenamiento privado están
  pendientes de la Fase 3. No se ha borrado, movido ni inventariado App Storage desde esta
  rama.

## Decisiones y excepciones vigentes

- MFA permanece desactivado y documentado como riesgo alto.
- El newsletter conserva el alta actual sin doble opt-in; la baja pública mediante token
  opaco queda para una fase posterior.
- No se publica `security.txt` hasta contar con un contacto institucional aprobado.
- La regla de dos aprobaciones de GitHub será configurada posteriormente por Sistemas.
- Ninguna presentación se elimina definitivamente en la primera ejecución.
- No se autoriza limpiar abogados, noticias, relaciones, CV, contactos, imágenes, audio,
  usuarios administrativos ni otras tablas o prefijos empresariales.

## GitHub al corte

- El repositorio es privado.
- Las alertas de vulnerabilidades y las actualizaciones automáticas de seguridad de
  Dependabot están activas.
- GitHub Actions usa permisos predeterminados de solo lectura y no puede aprobar PR.
- Secret scanning, push protection y Code Scanning no están disponibles para este
  repositorio privado con el plan actual. Los hallazgos CodeQL previos se conservan como
  evidencia histórica y deberán reanalizarse con un escáner disponible.

## Secrets operativos

- Base y bootstrap: `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD`.
- Cargas fragmentadas: `SESSION_SECRET`, generado aleatoriamente y distinto de cualquier
  contraseña humana.
- IA: claves del proveedor aprobado y `AI_MONTHLY_BUDGET_USD`.
- MFA, solo cuando Sistemas decida activarlo: `MFA_ENCRYPTION_KEY` y
  `MFA_REQUIRED_FOR_PRIVILEGED=true`.
- Migración, únicamente durante el procedimiento controlado: `SOURCE_DATABASE_URL` y
  `DB_BACKUP_ENCRYPTION_KEY`.

Los valores se configuran en Replit Secrets o el gestor equivalente. Nunca se incluyen en
Git, documentación, capturas, comandos compartidos, logs ni variables `VITE_*`.
