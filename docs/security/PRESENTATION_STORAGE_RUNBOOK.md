# Runbook seguro de presentaciones generadas

Fecha: 2026-08-20.
Clasificación: confidencial; no publicar inventarios ni manifiestos.

## Alcance y regla de autorización

Este procedimiento solo cubre objetos cuyo nombre empiece exactamente con:

`von-wobeser/public/generated-presentations/`

No autoriza operaciones sobre `uploads`, `generated-images`, `generated-audio`, CV,
fotografías, noticias, abogados ni documentos editoriales. La herramienta no implementa
purga definitiva. Ejecutar primero el inventario no autoriza ejecutar la cuarentena.

## 1. Preparación

1. Confirmar que el commit y la migración de Fase 3 fueron aprobados por Sistemas.
2. Activar la ventana operativa acordada y evitar nuevas generaciones durante el proceso.
3. Verificar que Replit tenga conectados la Database y el App Storage correctos sin imprimir
   `DATABASE_URL`, IDs privados ni Secrets.
4. Guardar toda evidencia fuera del repositorio y con permisos privados.

## 2. Inventario exclusivamente de lectura

Desde Replit Shell, elegir una ruta confidencial que no esté bajo Git y ejecutar:

```bash
npm run presentations:inventory -- --output=/ruta/confidencial/presentations-inventory.json
```

El modo predeterminado es `inventory`. PostgreSQL se abre con
`default_transaction_read_only=on`; App Storage solo se lista y se lee como stream para
calcular tamaño y SHA-256. No se crea, copia, mueve, actualiza ni elimina ningún registro u
objeto.

Revisar en el JSON:

- `state.prefix`: debe ser exactamente el prefijo autorizado;
- `state.rows`: filas y referencias de `generated_presentations`;
- `state.objects`: nombre, extensión, bytes, SHA-256 y filas que lo referencian;
- `state.totals`: filas, objetos y bytes;
- `digestSha256`: digest canónico de todo el alcance.

La herramienta aborta ante rutas, UUID, extensiones o referencias no permitidas. Si el
inventario muestra algo inesperado, detenerse y no editar el JSON.

## 3. Confirmación humana

Una persona autorizada debe confirmar por escrito:

- el número exacto de filas y objetos;
- el tamaño total;
- los nombres incluidos;
- cualquier objeto sin referencia o referencia sin objeto;
- el valor exacto de `digestSha256`;
- que el alcance corresponde únicamente a presentaciones de prueba.

Si PostgreSQL o App Storage cambian después del inventario, la cuarentena calcula de nuevo el
estado y aborta antes de retirar originales.

## 4. Cuarentena recuperable

Solo después de la confirmación anterior:

```bash
npm run presentations:quarantine -- \
  --inventory=/ruta/confidencial/presentations-inventory.json \
  --confirm-sha256=SHA256_CONFIRMADO \
  --confirm-scope=generated-presentations-only
```

El proceso:

1. valida el archivo y vuelve a capturar el inventario;
2. copia cada objeto con `Client.copy` al prefijo fechado de cuarentena;
3. comprueba existencia, tamaño y SHA-256 de cada copia;
4. escribe un manifiesto con retención de 30 días;
5. vuelve a comprobar el alcance;
6. retira únicamente cada nombre público exacto y marca como archivadas las filas exactas;
7. restaura realmente el primer objeto, verifica su SHA-256 y retira solo esa copia de prueba.

Si una retirada queda parcial, la herramienta intenta restaurar los originales ya retirados
desde sus copias verificadas. La cuarentena y el manifiesto permanecen disponibles para
recuperación. Un error exige detenerse y conservar toda la evidencia.

## 5. Retención y purga

La cuarentena se conserva al menos 30 días. Esta versión informa
`permanentDeletion: NOT_IMPLEMENTED`: no existe opción `purge` ni borrado definitivo. Una
purga futura requerirá otro cambio, respaldo verificable y autorización separada después del
plazo.

## Estado actual

Desde la rama de desarrollo no se ejecutó el inventario ni la cuarentena en Replit, no se
aplicó la migración a la base conectada y no se borró o movió ningún objeto real.
