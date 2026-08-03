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

No se aceptan secretos en `.env`, código, scripts, documentación, capturas, logs o
variables `VITE_*`. Las variables `VITE_*` son públicas por definición.

## Operación segura

- Aplicar cambios de esquema con `npm run db:migrate`; no usar `db:push` en producción.
- Para migrar datos usar exclusivamente el procedimiento cifrado de
  [`docs/REPLIT_DATABASE_MIGRATION.md`](docs/REPLIT_DATABASE_MIGRATION.md). Los Secrets
  temporales `SOURCE_DATABASE_URL` y `DB_BACKUP_ENCRYPTION_KEY` nunca se registran.
- No ejecutar ZAP activo, SQLMap, pruebas de fuerza bruta ni restauraciones sobre
  producción. Se requiere un clon aislado y una base independiente.
- En producción, ClamAV falla de forma cerrada salvo decisión explícita mediante
  `CLAMAV_REQUIRED=false`. La única excepción automática son PNG/JPEG/WebP públicos
  que hayan sido decodificados y re-codificados completamente en cuarentena; GIF,
  videos, CV y documentos continúan bloqueados si el escáner no está disponible.
- Las imágenes y videos administrados deben persistirse en Replit App Storage antes de
  registrar su ruta. El filesystem de runtime solo funciona como caché y nunca como
  fuente de verdad en producción.
- Los CV son privados y solo se descargan desde el endpoint administrativo autenticado.
- Ante sospecha de compromiso, revocar sesiones y cambiar las credenciales pertinentes.
- El segundo factor TOTP está retirado del flujo activo. Sus tablas cifradas se
  conservan únicamente para permitir una reversión controlada.

Consulta [docs/security/SECURITY_TEST_PLAN.md](docs/security/SECURITY_TEST_PLAN.md) para
la matriz de pruebas y los gates de liberación.

## Riesgos de dependencias controlados

Auditoría del 3 de agosto de 2026:

- Cero vulnerabilidades críticas o altas en dependencias de producción.
- `undici` quedó fijado en 7.29.0 o posterior y `postcss` en 8.5.25 o posterior,
  corrigiendo los avisos que sí tenían actualización compatible.
- Permanecen seis avisos moderados transitivos dentro del SDK oficial
  `@replit/object-storage` (`@google-cloud/storage`, `gaxios`, `retry-request`,
  `teeny-request` y `uuid`). npm no ofrece actualmente una corrección compatible para
  esa cadena. La aplicación no invoca directamente las variantes UUID afectadas; se
  mantiene monitoreo mediante Dependabot y `npm audit` hasta que Replit publique una
  versión corregida.
