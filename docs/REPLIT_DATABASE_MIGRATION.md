# Migración de PostgreSQL a Replit

Fecha del procedimiento: 2026-08-03.

Este documento mueve la base PostgreSQL externa a la infraestructura administrada desde el proyecto de Replit. Desarrollo usa Helium y producción usa una base independiente creada desde Publishing. El procedimiento no cambia tablas, usuarios, permisos, contenido ni APIs.

## Reglas de seguridad

- Nunca pegues una URL de base de datos en código, Git, capturas o mensajes.
- `SOURCE_DATABASE_URL` y `DB_BACKUP_ENCRYPTION_KEY` son Secrets temporales.
- `DATABASE_URL` siempre representa el destino activo de la aplicación.
- El respaldo se cifra con AES-256-GCM antes de copiarse a App Storage.
- No elimines la base externa hasta completar siete días de observación.
- No ejecutes una restauración mientras el sitio acepte escrituras.

## Requisitos

Replit instala los clientes PostgreSQL 18 desde `.replit`, la misma versión mayor
del servidor origen auditado. Después de actualizar `.replit`, reinicia o recarga
el Shell para que Nix aplique el nuevo entorno. Antes de comenzar:

```bash
pg_dump --version
pg_restore --version
test -n "$REPLIT_APP_STORAGE_BUCKET_ID" && echo "App Storage: OK" || echo "App Storage: revisar"
```

Ambos comandos deben mostrar la versión 18. Si todavía muestran 16, usa la opción
de Replit para recargar el Shell antes de crear el respaldo. La herramienta también
detiene el proceso con una explicación si el cliente es más antiguo que el servidor.

Configura temporalmente en **Tools → Secrets**:

- `SOURCE_DATABASE_URL`: conexión externa actual.
- `DB_BACKUP_ENCRYPTION_KEY`: frase aleatoria de al menos 24 caracteres, distinta de cualquier contraseña del panel.

No cambies todavía `DATABASE_URL`.

## 1. Auditar el origen

```bash
npm run db:replit-migrate -- audit source
```

El reporte muestra únicamente host, puerto, nombre de base, versión, tamaño, número de tablas, filas, secuencias, extensiones y hashes. No imprime usuario, contraseña ni URL completa.

## 2. Crear el respaldo inicial

```bash
npm run db:replit-migrate -- backup --label=initial
```

El comando:

1. Ejecuta `pg_dump` en formato custom.
2. Cifra el archivo con AES-256-GCM y una clave derivada con scrypt.
3. Calcula SHA-256.
4. Guarda la copia cifrada y su manifiesto en `von-wobeser/private/database-backups/` de App Storage.
5. Elimina el dump temporal sin cifrar.

Descarga además la copia cifrada desde App Storage y consérvala fuera del proyecto durante 30 días.

## 3. Activar Helium como base de desarrollo

1. En Replit abre **Tools → Database** y crea/vincula la base de desarrollo.
2. Elimina únicamente el Secret manual `DATABASE_URL` que apunta a la cuenta externa.
3. Configura temporalmente `MIGRATION_READ_ONLY=true` en desarrollo o detén Run/Preview; el destino no debe recibir escrituras durante la restauración.
4. Reinicia el workspace para que Replit inyecte su `DATABASE_URL` de Helium.
5. Confirma sin imprimirla:

```bash
node -e 'const u=new URL(process.env.DATABASE_URL||""); console.log(u.hostname === "helium" ? "Helium: OK" : "Destino: revisar")'
```

La aplicación reconoce `helium` como red interna y no intenta usar TLS. Las conexiones externas sí validan certificado.

## 4. Restaurar en desarrollo

Usa la ruta local cifrada informada por el comando de respaldo:

```bash
npm run db:replit-migrate -- audit target
npm run db:replit-migrate -- restore --file=/ruta/segura/respaldo.dump.enc --confirm-target=NOMBRE_DE_LA_BASE_DESTINO
npm run db:migrate
npm run db:replit-migrate -- verify
```

`pg_restore` usa `--single-transaction`, `--clean`, `--if-exists`, `--no-owner`, `--no-acl` y `--exit-on-error`. Un error revierte toda la restauración.

Mantén Run/Preview detenido o `MIGRATION_READ_ONLY=true` hasta que `verify` apruebe. Después puedes desactivar el modo de mantenimiento en desarrollo para ejecutar las pruebas manuales.

## 5. Validar desarrollo

```bash
npm ci
npm run check
npm run test:security
npm run build
```

Además, comprobar manualmente:

- inicio de sesión y creación de una sesión nueva;
- portada ES/EN, noticias y abogados;
- 18 prácticas y siete grupos por industria;
- configuraciones del panel;
- mensajes, pasantías y newsletter;
- historiales de imágenes, audios y presentaciones;
- carga y recuperación de medios desde App Storage.

## 6. Corte final sin pérdida de escrituras

1. Configura `MIGRATION_READ_ONLY=true` en producción y republica.
2. Confirma que las páginas `GET` continúan visibles y que un formulario controlado recibe `503 MIGRATION_READ_ONLY`.
3. Confirma en logs que agentes y procesos programados están desactivados.
4. Crea el respaldo final:

```bash
npm run db:replit-migrate -- backup --label=final
```

5. Restaura el respaldo final en Helium y repite:

```bash
npm run db:replit-migrate -- restore --file=/ruta/segura/respaldo-final.dump.enc --confirm-target=NOMBRE_DE_LA_BASE_DESTINO
npm run db:migrate
npm run db:replit-migrate -- verify
```

No desactives mantenimiento todavía.

## 7. Crear la base de producción en Replit

1. Abre **Publishing**.
2. Crea la base de producción administrada por Replit.
3. Selecciona la opción de copiar los datos actuales de desarrollo.
4. Replit asignará el `DATABASE_URL` de producción sin compartir el Secret con desarrollo.
5. Republica manteniendo `MIGRATION_READ_ONLY=true`.
6. Repite las pruebas de lectura y revisa en **Database → Production** las tablas y conteos.

Desarrollo y producción deben quedar como bases distintas.

## 8. Liberar producción

1. Elimina `MIGRATION_READ_ONLY` o cámbialo a `false`.
2. Republica.
3. Prueba login, edición, contacto y newsletter.
4. Crea un registro reversible, comprueba su persistencia tras reiniciar y elimínalo desde el flujo autorizado.
5. Confirma que la aplicación no abre conexiones hacia el host externo.

## 9. Reversión y cierre

- Mantén la base externa sin escrituras durante siete días.
- Si la validación falla antes de liberar producción, conserva mantenimiento y vuelve a apuntar el Secret manual `DATABASE_URL` al origen; no mezcles escrituras entre ambas bases.
- Después de siete días aprobados, elimina `SOURCE_DATABASE_URL` de Secrets y cierra la dependencia externa.
- Después de 30 días, elimina el respaldo cifrado de retención conforme a la política acordada.
- `DB_BACKUP_ENCRYPTION_KEY` debe conservarse mientras exista cualquier respaldo cifrado y retirarse después de destruir la última copia.

## Qué compara la verificación

`npm run db:replit-migrate -- verify` exige igualdad exacta de:

- tablas y conteos por tabla;
- columnas y valores predeterminados;
- restricciones y llaves foráneas;
- índices;
- secuencias y valores actuales;
- extensiones;
- registro y hashes de migraciones.

Una diferencia devuelve código de error y detiene el procedimiento.
