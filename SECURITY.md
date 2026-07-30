# Seguridad

## Reporte responsable

No publiques vulnerabilidades, credenciales ni datos personales en Issues. Repórtalos
directamente al responsable técnico del proyecto, incluyendo la ruta afectada, impacto,
pasos mínimos de reproducción y una forma segura de contacto.

Nunca incluyas en el reporte contraseñas, cookies de sesión, `DATABASE_URL`,
claves de IA ni archivos reales de postulantes.

## Secretos requeridos en Replit

- `DATABASE_URL` (se conserva la conexión actual por decisión del propietario).
- `ADMIN_EMAIL`.
- `ADMIN_BOOTSTRAP_PASSWORD`: solo crea al propietario cuando `ADMIN_EMAIL` todavía no
  existe. Después se ignora; PostgreSQL almacena exclusivamente el hash.
- Claves de OpenAI, pCloud y cualquier proveedor externo usado por el despliegue.
- `AI_MONTHLY_BUDGET_USD` para ajustar el límite mensual (USD 100 si se omite).

No se aceptan secretos en `.env`, código, scripts, documentación, capturas, logs o
variables `VITE_*`. Las variables `VITE_*` son públicas por definición.

## Operación segura

- Aplicar cambios de esquema con `npm run db:migrate`; no usar `db:push` en producción.
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
- Ante sospecha de compromiso, revocar sesiones, cambiar la contraseña afectada y las
  claves pertinentes. `DATABASE_URL` no se rota automáticamente.
- El segundo factor TOTP está retirado del flujo activo. Sus tablas cifradas se
  conservan únicamente para permitir una reversión controlada.

Consulta [docs/security/SECURITY_TEST_PLAN.md](docs/security/SECURITY_TEST_PLAN.md) para
la matriz de pruebas y los gates de liberación.
