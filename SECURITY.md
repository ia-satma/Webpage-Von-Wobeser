# Seguridad

## Reporte responsable

No publiques vulnerabilidades, credenciales ni datos personales en Issues. Repórtalos
directamente al responsable técnico del proyecto, incluyendo la ruta afectada, impacto,
pasos mínimos de reproducción y una forma segura de contacto.

Nunca incluyas en el reporte contraseñas, cookies de sesión, `DATABASE_URL`,
claves de IA ni archivos reales de postulantes.

## Secretos requeridos en Replit

- `DATABASE_URL` (Replit inyecta una conexión distinta para desarrollo y producción).
- `ADMIN_EMAIL`.
- `ADMIN_BOOTSTRAP_PASSWORD`: solo crea al propietario cuando `ADMIN_EMAIL` todavía no
  existe. Después se ignora; PostgreSQL almacena exclusivamente el hash.
- Claves de OpenAI, pCloud y cualquier proveedor externo usado por el despliegue.
- `AI_MONTHLY_BUDGET_USD` para ajustar el límite mensual (USD 100 si se omite).
- `MFA_ENCRYPTION_KEY`: 32 bytes aleatorios en base64 o hexadecimal para cifrar
  los secretos TOTP con AES-256-GCM.
- `MFA_REQUIRED_FOR_PRIVILEGED=true`: obliga TOTP para las cuentas Dueño y
  Administrador. No se debe activar sin `MFA_ENCRYPTION_KEY`; el sistema rechaza
  el acceso privilegiado antes que degradarlo a contraseña sola.

En producción, los secretos solo se configuran en **Replit Secrets** (o en el
gestor equivalente del proveedor final). Para desarrollo local se permite un `.env`
ignorado por Git, nunca compartido ni usado para valores productivos. Nunca se
aceptan secretos en código, scripts, documentación, capturas, logs o variables
`VITE_*`; estas últimas son públicas por definición.

## Operación segura

- Aplicar cambios de esquema con `npm run db:migrate`; no usar `db:push` en producción.
- Para migrar datos usar exclusivamente el procedimiento cifrado de
  [`docs/REPLIT_DATABASE_MIGRATION.md`](docs/REPLIT_DATABASE_MIGRATION.md). Los Secrets
  temporales `SOURCE_DATABASE_URL` y `DB_BACKUP_ENCRYPTION_KEY` nunca se registran.
- No ejecutar ZAP activo, SQLMap, pruebas de fuerza bruta ni restauraciones sobre
  producción. Se requiere un clon aislado y una base independiente.
- En producción, ClamAV falla de forma cerrada salvo decisión explícita mediante
  `CLAMAV_REQUIRED=false`. Si se adopta esa excepción temporal, solo se aceptan
  imágenes PNG/JPEG/WebP re-codificadas por completo o videos que superen la
  validación estructural de medios; GIF, CV y documentos continúan bloqueados si el
  escáner no está disponible. Sistemas debe mantener `CLAMAV_REQUIRED` sin alterar
  en el despliegue final.
- Las imágenes y videos administrados deben persistirse en Replit App Storage antes de
  registrar su ruta. El filesystem de runtime solo funciona como caché y nunca como
  fuente de verdad en producción.
- Los CV son privados y solo se descargan desde el endpoint administrativo autenticado.
- Ante sospecha de compromiso, revocar sesiones y cambiar las credenciales pertinentes.
- TOTP está implementado para Dueño y Administradores: el alta se completa tras
  la contraseña, con secreto cifrado AES-256-GCM, desafío opaco HttpOnly de 10
  minutos, cinco intentos y códigos de recuperación de un solo uso almacenados
  únicamente como hashes. Debe quedar activado mediante los dos Secrets anteriores
  antes de aprobar la entrega.

Consulta [docs/security/SECURITY_TEST_PLAN.md](docs/security/SECURITY_TEST_PLAN.md) para
la matriz de pruebas y los gates de liberación.

## Riesgos de dependencias controlados

Auditoría local del 19 de agosto de 2026:

- `npm audit` no reporta vulnerabilidades para el `package-lock.json` versionado.
- Dependabot y los gates de CI mantienen la revisión de dependencias en cada cambio.
- La aprobación de un release requiere volver a ejecutar `npm audit` en el entorno
  que vaya a desplegarlo, porque el resultado puede cambiar con el tiempo.
