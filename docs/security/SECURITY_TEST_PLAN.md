# Plan de pruebas y evidencia de seguridad

Fecha de referencia: 2026-07-23.

## Alcance y reglas

La referencia es OWASP ASVS 5.0 nivel 2 y OWASP Top 10:2025. Las pruebas no destructivas
pueden ejecutarse localmente o contra un despliegue autorizado. Las pruebas activas
(ZAP autenticado, SQLMap, fuerza bruta, SSRF externo, malware y restauración) se ejecutan
exclusivamente en un clon aislado con una base independiente y datos sintéticos.

Decisiones del propietario:

- No rotar `DATABASE_URL` en esta entrega.
- No separar la cuenta de PostgreSQL.
- Guardar la contraseña inicial solo en Replit Secrets y usarla únicamente si el
  propietario aún no existe.

## Controles implementados

| Área ASVS / riesgo | Control | Evidencia automatizada |
| --- | --- | --- |
| V2 Autenticación | Argon2id 19 MiB/2/1, compatibilidad y migración de bcrypt, política 15–128, contraseña temporal | `server/security/auth.test.ts` |
| V3 Sesiones | Cookie `__Host-*` HttpOnly/Secure/Strict, token hasheado, inactividad 30 min, máximo 8 h, revocación y CSRF | TypeScript, revisión de rutas |
| V2 MFA | TOTP obligatorio para administradores, secreto AES-256-GCM y códigos de recuperación de un uso | `server/security/mfa.test.ts` |
| V4 Acceso | Permisos separados para registros, exportaciones, documentos, usuarios y agentes | matriz manual por rol |
| V5 Validación | Zod, límites de cuerpo/paginación/lotes, Drizzle parametrizado, comodines ILIKE escapados | TypeScript y pruebas de API |
| V5 CSV | Neutralización de `=`, `+`, `-`, `@`, tabulador y retorno de carro | revisión de exportación |
| V7 Errores/logs | ID de correlación, errores 500 genéricos, redacción de cookies/tokens/cuerpos | revisión y smoke test |
| V8 Datos | noticias públicas solo publicadas y no futuras; retención y CV privados | pruebas de API y revisión |
| V10 Comunicaciones | TLS validado para PostgreSQL externo; CORS explícito | configuración |
| V12 Archivos | cuarentena, nombres de 128 bits, firma real, ZIP seguro, límites y ClamAV | `server/security/uploads.test.ts` |
| V13 API | rate limit persistente, WebSocket autenticado/origen/límite, endpoints retirados | pruebas de API |
| V14 Configuración | CSP Report-Only, Helmet, HSTS, `nosniff`, referrer y permissions policy | smoke test de cabeceras |
| SSRF | allowlist, DNS previo y por redirección, bloqueo privado/metadata, timeout y tamaño | `server/security/network.test.ts` |
| IA / prompt injection | bloques no confiables, redacción de aprendizaje, límites, revisión humana y presupuesto mensual | TypeScript y revisión de agentes |
| Secretos/supply chain | Gitleaks en historial, CodeQL, Semgrep, Dependabot y `npm audit` | workflows de GitHub |

## Comandos seguros locales

```bash
npm ci
npm run check
npm run test:security
npm run build
npm audit --audit-level=high
git diff --check
```

Gitleaks debe ejecutarse sobre todo el historial y con valores redactados:

```bash
gitleaks git --config .gitleaks.toml --redact=100 --no-banner
```

## Batería aislada

Antes de iniciar:

1. Crear un clon efímero sin datos reales.
2. Usar una `DATABASE_URL` distinta, con datos sintéticos.
3. No copiar Replit Secrets de producción; usar claves desechables.
4. Establecer `NODE_ENV=production`, `CLAMAV_REQUIRED=true` y un origen de prueba.
5. Registrar versión, commit, fecha, herramienta y alcance.

Ejecutar en ese clon:

- ZAP baseline anónimo, después escaneo activo con una cuenta sintética de cada rol.
- SQLMap solo contra parámetros sintéticos permitidos; verificar que no haya 500,
  retrasos inducidos, lectura adicional ni cambios de esquema.
- Payloads XSS almacenados/reflejados/DOM, `javascript:`, HTML/CSS y fórmulas CSV.
- CSRF sin token, token incorrecto, origen incorrecto y métodos multipart.
- IDOR cruzando IDs entre permisos y roles.
- SSRF a loopback, RFC1918, link-local, metadata, IPv6 privado, DNS rebinding simulado
  y redirecciones.
- Traversal, doble extensión, MIME falso, SVG/HTML/ejecutable, ZIP bomb y muestra EICAR.
- Fuerza bruta, enumeración, expiración absoluta/inactividad, revocación y recuperación MFA.
- WebSocket sin cookie, origen incorrecto y exceso de conexiones.
- Límites y concurrencia de agentes, tamaño de prompts y presupuesto autorizado.
- Exportaciones masivas, alertas y ausencia de PII/secretos en logs.
- Restauración de un respaldo hacia otra base aislada y comparación de integridad.

## Gate de liberación

- Cero hallazgos críticos o altos abiertos.
- Medios corregidos o aceptados por escrito con responsable y fecha.
- `npm audit` sin vulnerabilidades altas.
- Gitleaks sin secretos reales en archivos, ramas, etiquetas o historial.
- TypeScript, pruebas, build y `git diff --check` exitosos.
- Evidencia ES/EN del sitio, panel, MFA, archivos y permisos.

## Riesgos residuales y pendientes externos

- `DATABASE_URL` no se rota por decisión explícita. Si algún escáner la encuentra en
  historial o terceros, el hallazgo debe documentarse sin imprimir su valor.
- Se conserva una sola cuenta PostgreSQL, por lo que la separación de privilegios queda
  fuera de alcance.
- CSP permanece inicialmente en Report-Only para recolectar violaciones antes de imponerla.
- ZAP activo, SQLMap y restauración requieren que el propietario provea un entorno aislado;
  no se ejecutan contra la base actual.
