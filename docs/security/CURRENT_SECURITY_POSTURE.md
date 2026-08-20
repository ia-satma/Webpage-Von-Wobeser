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
- El WebSocket rechaza el upgrade antes de conectar si faltan sesión, origen mismo host,
  permiso `agents` o la futura condición MFA. Revalida sesión/usuario/permisos/MFA cada 30
  segundos, limita conexiones y suscripciones, y entrega eventos únicamente a la suscripción
  UUID del artículo correspondiente.
- Todas las familias `/api` consumen límites persistentes compartidos entre instancias, por
  usuario autenticado o IP pública. IA, traducción, auditorías y uploads tienen políticas
  diferenciadas; login, MFA y formularios conservan además sus límites específicos.
- ClamAV dispone de un health check administrativo de solo lectura. En producción es requerido
  salvo excepción explícita `CLAMAV_REQUIRED=false`; esa excepción debe ser aprobada.
- El conector pCloud quedó retirado del runtime, de las rutas y del panel. Esta retirada
  no borra ni modifica archivos que ya existan en una cuenta pCloud.
- `SESSION_SECRET` no firma la cookie administrativa, pero sí es obligatorio en
  producción para firmar sesiones de carga fragmentada de medios.
- La revisión denominada históricamente `legal_council` es apoyo automatizado de tres
  agentes. No constituye asesoría ni dictamen jurídico y siempre requiere decisión humana.
- Las rutas públicas históricas de presentaciones responden 404. Las presentaciones nuevas
  usan referencias opacas y el prefijo privado, y sus archivos solo se transmiten por API
  administrativa con permiso `agents` y `private, no-store`.
- La migración de Fase 3 es exclusivamente aditiva. El inventario y la cuarentena de objetos
  históricos siguen pendientes de ejecución en Replit; desde esta rama no se ha borrado,
  movido ni inventariado App Storage ni se ha aplicado una migración a la base conectada.
- Los nuevos registros de contacto, postulaciones y sesiones administrativas almacenan un
  pseudónimo HMAC de la dirección de red, o `null` si falta una clave segura. Las direcciones
  históricas no se modifican.
- Las acciones administrativas cubiertas por los routers modulares se registran en
  `admin_audit_events`. La bitácora acepta únicamente metadatos escalares saneados y no une
  ni copia correos, nombres, IP, contenidos, archivos, prompts o secretos.
- Los timers de negocio se retiraron del servidor Autoscale. Existen tres comandos
  idempotentes coordinados con PostgreSQL advisory locks y `scheduled_task_runs`; todavía no
  se han activado como Scheduled Deployments en la cuenta de Replit. La activación sigue el
  gate de `docs/security/REPLIT_SCHEDULED_DEPLOYMENTS.md`.
- Cada build genera un CycloneDX SBOM y un manifiesto que relaciona commit, lockfile, bundle,
  archivos públicos y SHA-256 del build. CI verifica y conserva ambos archivos por 30 días;
  al arrancar producción, el backend intenta registrar esa relación en
  `deployment_artifacts` sin bloquear el sitio si la evidencia no está disponible.

## Decisiones y excepciones vigentes

- MFA permanece desactivado y documentado como riesgo alto.
- El newsletter conserva el alta actual sin doble opt-in y añade una baja pública mediante
  token opaco firmado. Visitar el enlace no altera datos: la baja exige confirmación `POST`.
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
  evidencia histórica y deberán reanalizarse con un escáner disponible. Las 193 alertas
  Critical/High están individualizadas y justificadas o corregidas en
  `docs/security/CODEQL_CRITICAL_HIGH_TRIAGE_2026-08-20.md`; no se cerró ninguna en GitHub.
- Gitleaks, Semgrep con baseline y la verificación integral del proyecto son gates de cada PR.

## Secrets operativos

- Base y bootstrap: `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD`.
- Cargas fragmentadas: `SESSION_SECRET`, generado aleatoriamente y distinto de cualquier
  contraseña humana.
- IA: claves del proveedor aprobado y `AI_MONTHLY_BUDGET_USD`.
- MFA, solo cuando Sistemas decida activarlo: `MFA_ENCRYPTION_KEY` y
  `MFA_REQUIRED_FOR_PRIVILEGED=true`.
- Migración, únicamente durante el procedimiento controlado: `SOURCE_DATABASE_URL` y
  `DB_BACKUP_ENCRYPTION_KEY`.
- Privacidad: `PRIVACY_HASH_KEY` y `NEWSLETTER_UNSUBSCRIBE_SECRET`, ambas aleatorias con
  al menos 32 caracteres y separadas de contraseñas humanas. Si se omiten, el runtime usa
  `SESSION_SECRET` como respaldo criptográfico; es preferible separarlas en producción.

Los valores se configuran en Replit Secrets o el gestor equivalente. Nunca se incluyen en
Git, documentación, capturas, comandos compartidos, logs ni variables `VITE_*`.
