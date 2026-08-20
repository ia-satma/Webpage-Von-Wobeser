# Triage de alertas CodeQL Critical/High

Fecha de corte: 2026-08-20

Commit originalmente analizado: `edb2e05d188834dc8b33b6a7b46bbefc9fefbc97`

Alcance: 193 alertas abiertas (1 Critical y 192 High)

El inventario CSV confidencial de origen contiene 193 IDs únicos y tiene SHA-256
`f8aa9ffae6ba9e33ccfa5014827ceaae5bd16112246f3b03f3297aa0ad4ae8f7`.

Este registro conserva la decisión individual de las 193 alertas. No cierra ni descarta
alertas en GitHub. El repositorio ahora es privado y GitHub Code Security no está disponible
en el plan personal actual; por tanto, no se afirma que CodeQL haya reanalizado la rama.
Semgrep bloquea hallazgos nuevos en cada PR y Gitleaks bloquea secretos. Si la firma contrata
GitHub Code Security, deberá reejecutarse CodeQL y vincular el resultado a este registro.

Estados usados:

- **Corregida en código:** existe cambio y prueba en la rama de remediación.
- **Justificada:** el flujo señalado no constituye el sink indicado; se conserva la razón.
- **Aceptada de bajo impacto:** defecto real fuera del runtime servidor, documentado para
  mantenimiento posterior.

## Critical

- **#544 — corregida en código.** `storeChunkedMediaPart` ahora exige
  `Buffer.isBuffer(contents)` dentro del propio límite de confianza, antes de leer la sesión o
  escribir bytes. La frontera HTTP ya comprobaba `Buffer`, pero la precondición local elimina
  la dependencia de que todo caller futuro lo recuerde. Prueba negativa:
  `server/security/uploads.test.ts` con `INVALID_CHUNK_CONTENTS`.

## High — Missing rate limiting (143)

IDs inventariados individualmente:

`#415, #487, #527, #619, #620, #621, #622, #623, #624, #625, #626, #627,
#628, #629, #630, #631, #632, #633, #634, #635, #636, #637, #638, #639,
#640, #641, #642, #643, #645, #646, #647, #648, #649, #650, #651, #652,
#653, #654, #655, #656, #657, #658, #659, #660, #661, #662, #663, #664,
#665, #666, #667, #668, #669, #670, #671, #672, #673, #674, #675, #676,
#677, #678, #679, #680, #681, #682, #683, #684, #685, #686, #687, #688,
#689, #690, #691, #692, #693, #694, #695, #696, #697, #698, #699, #700,
#701, #702, #703, #704, #705, #706, #707, #708, #709, #710, #711, #712,
#713, #714, #715, #716, #717, #718, #719, #720, #721, #722, #723, #724,
#725, #726, #727, #728, #729, #730, #731, #732, #733, #734, #735, #736,
#737, #738, #739, #740, #741, #742, #743, #744, #745, #746, #747, #748,
#749, #750, #751, #752, #753, #766, #767, #769, #770, #771, #772`.

- **#487 — justificada:** middleware Vite exclusivo de desarrollo; no forma parte del runtime
  publicado.
- **#527, #619, #620, #726, #728 y #729 — justificadas:** son rutas de página pública,
  fallback o recursos estáticos/públicos (bundles, CSS/JS, placeholder, imágenes o audio), no
  operaciones API autenticadas por usuario. Algunas respuestas pueden cachearse y otras no;
  aplicar una consulta PostgreSQL por cada subrecurso empeoraría disponibilidad. Los controles
  adecuados son límites en el borde/WAF, caché cuando proceda, nombres no ejecutables y
  `nosniff`.
- **#730 — corregida en Fase 3:** la ruta pública de presentaciones responde 404. Las nuevas
  referencias son privadas, ligadas al UUID del registro, y solo se transmiten por rutas
  administrativas con sesión y permiso `agents`. La corrección queda pendiente de despliegue
  mientras el PR de Fase 3 siga abierto.
- **#642, #770, #771 y #772 — justificadas:** login/MFA ya consumen límites persistentes;
  CodeQL no modeló los helpers propios.
- **Las otras 131 — corregidas como una brecha sistémica común:**
  `server/security/apiRateLimit.ts` aplica una cuota persistente antes de todos los routers
  `/api`, con clave finita por familia de ruta y usuario autenticado o IP pública. Reutiliza
  `security_rate_limits`, por lo que todas las instancias Autoscale comparten estado. La
  comprobación y el incremento son atómicos bajo un advisory lock transaccional por clave.
  Hay políticas diferenciadas para lectura, escritura, IA/auditorías y cargas fragmentadas.
  El middleware falla cerrado si el control compartido no está disponible. No se crearon ni
  modificaron tablas de negocio.

## High — paths de archivos (17), todos justificados

- **#416, #417, #418, #419, #420, #421 y #422 (`uploads.ts`)**: nombres físicos aleatorios o entradas ya contenidas en
  cuarentena; validación de contención antes del acceso.
- **#517 (`optimizeImage.ts`)**: recibe exclusivamente una ruta física aceptada por el flujo de
  cuarentena, no una ruta HTTP arbitraria.
- **#599, #600, #601, #602, #603, #604, #605, #606 y #607 (`publicAssetRoutes.ts`)**: `path.resolve` más comprobación de directorio padre;
  no permite escapar del root autorizado.

La justificación depende de conservar esas precondiciones dentro de los helpers. Un caller
nuevo que acepte una ruta cruda invalida esta decisión y exige nueva revisión.

## High — sanitización textual (8), todos justificados

- **#265, #464, #615, #616, #617, #618, #773 y #774**: las expresiones señaladas normalizan o resumen texto
  para JSON, legibilidad o tooling; no son el sanitizador HTML autoritativo. HTML rico pasa por
  `sanitize-html`, y los atributos generados usan el escape contextual añadido en Fase 1.

## High — DOM (6), todos justificados

- **#457, #458, #459, #554, #588 y #589**: los valores terminan en `src` o navegación tras
  restricción de esquema/host/mismo origen y no se reinterpretan mediante `innerHTML`.

## High — doble escape (4), todos justificados

- **#461, #462, #577 y #584**: normalización/decodificación para comparación o texto plano;
  el valor marcado no se reinserta como HTML confiable.

## High — expresiones regulares (2)

- **#754 — corregida:** el extractor de PDF del auditor usa ahora un token lineal acotado a
  2,048 caracteres y valida la extensión mediante `URL.pathname`, eliminando la repetición
  anidada.
- **#488 — aceptada de bajo impacto:** expresión de `jquery.validate.js` heredado que corre en
  el navegador. No procesa una petición en Express ni puede bloquear el proceso servidor. Debe
  desaparecer al retirar la plantilla heredada; modificar vendor en esta fase elevaría el
  riesgo de regresión funcional.

## High — archivos temporales (2), ambos corregidos

- **#759 y #760:** el auditor manual dejó de usar una ruta `/tmp` predecible. El default se
  crea con `fs.mkdtemp` bajo `os.tmpdir()`, de modo que otra cuenta/proceso no puede preparar el
  mismo path. Una ruta explícita sigue siendo posible con `--cache=` y queda bajo control del
  operador.

## High — regex sin ancla (6), todos justificados

- **#535, #555, #568, #569 y #590:** aserciones exclusivas de pruebas, no validadores de una
  frontera productiva.
- **#567:** detector conservador de privacidad; una coincidencia de más bloquea una imagen
  externa, no concede acceso ni incorpora un origen.

## High — carrera de filesystem (2), ambas justificadas

- **#536 y #556:** operaciones dentro de `server/security/typography.test.ts`; no se empacan ni
  ejecutan en el servicio productivo.

## High — inyección de propiedad remota (1), corregida por protocolo

- **#493:** originalmente era un probable falso positivo porque el servidor emitía UUID. La
  Fase 2 agrega validación explícita de UUID tanto al mensaje del WebSocket como al evento del
  cliente y entrega solo al artículo suscrito. `__proto__` y claves arbitrarias se rechazan.

## High — hash de contraseña insuficiente (1), justificada

- **#768:** `hashOpaqueToken` aplica SHA-256 a un token opaco aleatorio de 256 bits para lookup,
  no a una contraseña humana. Las contraseñas usan Argon2id. Sustituir el lookup por Argon2
  añadiría costo sin corregir un riesgo de contraseña.

## Evidencia y criterio de cierre

- Pruebas negativas: `phase2ApiWebSocket.test.ts` y `uploads.test.ts`.
- Gate de PR: Semgrep con baseline y `--error`, Gitleaks y el workflow CI completo.
- ClamAV: endpoint administrativo `GET /api/health-check/clamav`, sin tocar archivos.
- WebSocket: autorización antes del upgrade, permiso `agents`, condición MFA futura,
  revalidación cada 30 segundos, máximo tres conexiones, máximo ocho suscripciones y difusión
  exclusivamente por UUID de artículo.
- Las alertas históricas no se cerrarán en GitHub sin reanálisis y revisión independiente.
