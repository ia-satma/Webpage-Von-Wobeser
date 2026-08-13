# Entrega del proyecto al Replit del cliente mediante GitHub

## Objetivo

El cliente recibirá el repositorio de GitHub e importará el proyecto en su propia
cuenta de Replit. No se transferirá el Repl actual.

GitHub contiene el código y los recursos versionados, pero **no** transporta:

- Secrets ni contraseñas.
- Bases de datos de desarrollo o producción.
- Archivos de Replit App Storage.
- Historial operativo administrado fuera del repositorio.

Por ello, la entrega completa consta de cuatro piezas: repositorio, respaldo cifrado de
PostgreSQL, paquete verificado de medios públicos de App Storage y paquete cifrado de
documentos privados.

> A diferencia de proyectos cuyo contenido inicial puede reconstruirse desde un
> manifiesto versionado, Von Wobeser ya contiene contenido editorial, usuarios,
> formularios e historiales reales. Omitir el respaldo de PostgreSQL o App Storage
> produciría una instalación incompleta.

## Instalación guiada y detectable

El repositorio incluye un instalador permanente para una cuenta nueva. No intenta
adivinar ni copiar credenciales: detecta Database, App Storage, paquete y migraciones,
y solo restaura cuando la Database está vacía y el cliente confirma explícitamente el
destino y su correo de Dueño.

Al importar el repositorio, un Repl sin datos no devuelve errores `500` ni expone el
sitio: muestra una pantalla de instalación pendiente. En el Shell del Repl del cliente,
usar primero:

```bash
npm run handoff:status -- --directory=.handoff
```

El resultado solo enumera estados y **nombres** de Secrets faltantes; nunca revela sus
valores, contraseñas, correos existentes ni URLs de conexión. Replit Agent puede correr
el mismo diagnóstico y pedir al cliente que configure los nombres faltantes desde
**Tools → Secrets**. No se deben pegar Secrets en el chat del agente, comandos, Git ni
capturas.

## 1. Preparar el paquete desde el Replit actual

No guardar el paquete dentro de Git. La carpeta `.handoff/` está excluida mediante
`.gitignore`.

### 1.1 Respaldo de la base productiva vigente

En el Shell del Replit actual:

```bash
mkdir -p "$PWD/.handoff/database"

env DATABASE_URL="$PRODUCTION_DATABASE_URL" \
  DB_MIGRATION_BACKUP_DIR="$PWD/.handoff/database" \
  nix-shell -I nixpkgs=https://github.com/NixOS/nixpkgs/archive/nixos-25.11.tar.gz \
  -p postgresql_18 \
  --run 'npm run db:replit-migrate -- backup-current --label=cliente-final --confirm-source=neondb'
```

El comando:

- usa la base administrada por Replit indicada en `DATABASE_URL`;
- exige confirmar el nombre de la base para evitar respaldar el destino equivocado;
- cifra el archivo con `DB_BACKUP_ENCRYPTION_KEY`;
- calcula y muestra SHA-256;
- no imprime la URL, usuario ni contraseña.

Conservar el archivo `.dump.enc` y su SHA-256. Compartir la clave de cifrado por un
canal distinto al utilizado para entregar el archivo.

### 1.2 Exportar los medios persistentes

```bash
npm run handoff:storage -- export --directory="$PWD/.handoff/app-storage"
```

La exportación incluye únicamente objetos bajo `von-wobeser/public/` y conserva sus
claves exactas. No incluye respaldos privados de la base ni cargas temporales. El
paquete genera:

- `app-storage-manifest.json`;
- `app-storage-manifest.sha256`;
- los objetos públicos con checksum individual.

Entregar la carpeta `.handoff/` mediante un canal privado y verificable. Nunca subirla
a GitHub, adjuntarla a un issue ni almacenarla en una rama.

### 1.3 Proteger y exportar documentos privados

Antes de exportar, migrar a App Storage los CV históricos que todavía puedan existir
en el filesystem efímero:

```bash
npm run media:migrate-private
npm run handoff:private -- export --directory="$PWD/.handoff/private-documents"
```

El paquete privado incluye únicamente objetos bajo `von-wobeser/private/cvs/`. Cada
archivo y su manifiesto se cifran con AES-256-GCM usando
`DB_BACKUP_ENCRYPTION_KEY`; los nombres físicos son aleatorios y no contienen datos
personales. La clave debe entregarse por un canal distinto y el paquete nunca debe
subirse a GitHub.

## 2. Crear la instalación del cliente

1. El cliente importa `ia-satma/Webpage-Von-Wobeser` desde GitHub en Replit.
2. En **Tools → Database**, crea la base de desarrollo.
3. En **Tools → App Storage**, crea o vincula un bucket del cliente.
4. Copia el paquete `.handoff/` al workspace por un canal privado.
5. Abre un Shell nuevo para que Replit inyecte las variables del nuevo proyecto.

La configuración `.replit` no contiene IDs de bucket ni credenciales de la cuenta
actual. Cada importación enlaza sus propios recursos.

## 3. Configurar Secrets del cliente

### Esenciales

| Secret | Uso |
|---|---|
| `ADMIN_EMAIL` | Correo inicial del propietario. |
| `ADMIN_BOOTSTRAP_PASSWORD` | Contraseña inicial de 12–16 caracteres; se usa solo si la cuenta no existe. |
| `DB_BACKUP_ENCRYPTION_KEY` | Descifrar el respaldo entregado. Puede eliminarse después de validar la restauración y conservarse fuera de Replit. |
| `SITE_URL` | URL pública definitiva del deployment. |
| `REPLIT_APP_STORAGE_BUCKET_ID` | Solo si Replit no inyecta automáticamente el bucket vinculado. |

`DATABASE_URL` debe ser la variable administrada e inyectada por la base del Replit del
cliente; no se copia la URL actual.

### Agentes de IA

| Secret | Uso |
|---|---|
| `OPENAI_API_KEY` | Modelos de texto, imagen y audio. |
| `OPENAI_IMAGE_API_KEY` | Opcional; clave separada para imágenes. |
| `AI_MONTHLY_BUDGET_USD` | Presupuesto mensual visible para Dueños y Administradores. |

La infraestructura MFA está desactivada; `MFA_ENCRYPTION_KEY` ya no es necesaria para
el acceso administrativo.

No copiar Secrets desde GitHub ni compartir sus **valores** en comandos, capturas,
documentos o registros. La contraseña se escribe solamente en el campo protegido de
Replit Secrets.

## 4. Restauración completa en un solo comando

Después de crear la Database y App Storage, cargar el paquete y configurar los cuatro
Secrets de instalación, el diagnóstico indicará `ready_to_restore`. Entonces ejecutar:

```bash
npm run handoff:install -- \
  --directory=.handoff \
  --confirm-database=heliumdb \
  --confirm-owner-email=correo-del-cliente@ejemplo.com
```

El comando valida que la Database no contiene tablas de aplicación y, en este orden:

1. restaura el respaldo cifrado de PostgreSQL en una transacción;
2. aplica las migraciones versionadas vigentes;
3. importa y verifica los medios públicos;
4. importa y verifica los documentos privados cifrados;
5. crea el Dueño del cliente solo si ese correo aún no existe, sin modificar las demás cuentas;
6. ejecuta la auditoría final de conteos, medios, CV y Dueño.

Si la Database tiene información parcial o existente, el instalador se detiene antes de
escribir. Esto evita una sobrescritura accidental y requiere una revisión explícita.

`heliumdb` es el nombre común de la Database administrada por Replit, pero el comando
de diagnóstico muestra el nombre real. Sustituirlo y usar exactamente el mismo correo
que se guardó en `ADMIN_EMAIL`.

## 5. Restauración manual de contingencia

Identificar el nombre del archivo cifrado entregado y confirmar que el destino sea la
base nueva de Replit:

```bash
node -e 'const u=new URL(process.env.DATABASE_URL); console.log("Destino:",u.hostname,decodeURIComponent(u.pathname.slice(1)))'
```

En Helium, el nombre esperado suele ser `heliumdb`. Restaurar:

```bash
nix-shell -I nixpkgs=https://github.com/NixOS/nixpkgs/archive/nixos-25.11.tar.gz \
  -p postgresql_18 \
  --run 'npm run db:replit-migrate -- restore --file=.handoff/database/RESPALDO.dump.enc --confirm-target=heliumdb'

npm run db:migrate
npm run db:replit-migrate -- audit target
```

Sustituir `RESPALDO.dump.enc` por el nombre real. No ejecutar la restauración si el
host o la base no corresponden al nuevo proyecto del cliente.

La restauración local no necesita `SOURCE_DATABASE_URL`: esa variable solo se usa al
comparar una migración entre dos bases conectadas. Así, la instalación del cliente no
depende de la antigua cuenta o URL de origen.

## 6. Restaurar y verificar App Storage

```bash
npm run handoff:storage -- import \
  --directory="$PWD/.handoff/app-storage" \
  --confirm-prefix=von-wobeser/public

npm run handoff:storage -- verify \
  --directory="$PWD/.handoff/app-storage"
```

La importación mantiene las rutas existentes en PostgreSQL y verifica cada objeto
después de subirlo. Así, imágenes, videos, audios y presentaciones siguen disponibles
sin modificar registros.

Restaurar después los documentos privados:

```bash
npm run handoff:private -- import \
  --directory="$PWD/.handoff/private-documents" \
  --confirm-prefix=von-wobeser/private/cvs

npm run handoff:private -- verify \
  --directory="$PWD/.handoff/private-documents"
```

Los CV no se exponen como medios públicos. Solo pueden descargarse mediante el endpoint
administrativo autenticado y con el permiso correspondiente a registros recibidos.

## 7. Validar antes de publicar

```bash
npm ci
npm run check
npm run test:security
npm run build
npm run handoff:readiness -- --confirm-database=heliumdb --owner-email=correo-del-cliente@ejemplo.com
```

Además, comprobar manualmente:

- acceso como Dueño y permisos del panel;
- Home ES/EN, menús, búsqueda y formularios;
- noticias, abogados, 18 prácticas e industrias;
- imágenes, video del Home y biblioteca de medios;
- historiales de imágenes, audios y presentaciones;
- ejecución controlada de los agentes con la API key del cliente.

El instalador crea el Dueño indicado por `ADMIN_EMAIL` si no existe en el respaldo, sin
modificar las demás cuentas. El cliente debe entrar con esa cuenta, confirmar sus
permisos y desactivar desde **Usuarios y accesos** todas las cuentas del proveedor que
ya no deban conservar acceso. Después puede retirar `ADMIN_BOOTSTRAP_PASSWORD` y
`DB_BACKUP_ENCRYPTION_KEY` de Replit y guardar las credenciales por el medio acordado.

## 8. Crear producción en la cuenta del cliente

Desde **Publishing**, crear la base de producción administrada por Replit y elegir la
opción de copiar los datos actuales de desarrollo. Replit inyectará el
`DATABASE_URL` productivo en el deployment.

Después de publicar:

1. confirmar que la base productiva contiene las tablas y datos esperados;
2. comprobar una lectura pública y una operación administrativa reversible;
3. republicar una segunda vez para demostrar persistencia;
4. verificar que el bucket y ambas bases aparecen en la cuenta del cliente;
5. retirar cualquier Secret temporal que ya no sea necesario.

## 9. Ensayo obligatorio en un Repl limpio

Antes de entregar al cliente, repetir el procedimiento completo en un Repl temporal
creado desde GitHub, con una base y un bucket nuevos. Restaurar los tres paquetes,
ejecutar `handoff:readiness`, validar el panel y los medios, publicar y republicar una
segunda vez. Este ensayo no debe usar ni sobrescribir la base o el bucket de producción
actuales. Su objetivo es demostrar que el proyecto puede reconstruirse sin depender del
Repl del proveedor.

## 10. Criterio de cierre

La entrega se considera independiente cuando:

- código y despliegue viven en la cuenta GitHub/Replit acordada con el cliente;
- Development Database y Production Database pertenecen al Replit del cliente;
- App Storage pertenece al cliente y todos los checksums públicos y privados coinciden;
- los CV permanecen cifrados durante la entrega y solo son descargables con autenticación;
- OpenAI se factura mediante una clave administrada por el cliente;
- únicamente permanecen activas las cuentas administrativas autorizadas por el cliente;
- no existe dependencia de la cuenta Replit ni de la antigua cuenta Neon del proveedor;
- el cliente conserva un respaldo cifrado y conoce el procedimiento de recuperación.

El cliente no necesita proporcionar una cuenta Neon externa: la base se crea y opera
desde Replit.
