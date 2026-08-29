# Runbook de tareas programadas en Replit

Estado al 2026-08-20: **código preparado; publicaciones programadas no activadas**.

Este documento no autoriza ejecutar tareas ni migraciones. Los tres Scheduled
Deployments se configuran únicamente después de fusionar las fases previas, publicar
la migración aditiva y obtener la aprobación indicada abajo.

Replit ejecuta el comando configurado en los horarios elegidos y permite indicar la
zona horaria. La referencia oficial consultada el 2026-08-20 es
[Scheduled Deployments](https://docs.replit.com/references/publishing/scheduled-deployments).
Replit también documenta que cada publicación es un snapshot separado y que los datos
persistentes deben quedar en Database o App Storage, no en el filesystem del proceso:
[Publishing](https://docs.replit.com/learn/projects-and-artifacts/replit-deployments).

## Controles incorporados

- Cada comando usa una ventana temporal determinista y una clave única
  `(task_name, scheduled_for)`; una ejecución ya completada no vuelve a correr.
- Un PostgreSQL advisory lock por tarea impide que dos máquinas ejecuten el mismo
  trabajo simultáneamente.
- Un intento fallido puede reintentarse en la misma ventana; el contador queda en
  `scheduled_task_runs`.
- Los resultados guardan solo números, booleanos e identificadores técnicos cortos.
  Nunca guardan cuerpos, nombres, correos, IP, prompts, documentos o secretos.
- El job de mantenimiento selecciona como máximo 500 sesiones vencidas y las retira
  una por una por `admin_sessions.id` exacto. No invoca el limpiador general y no toca
  abogados, noticias, contactos, CV, medios, usuarios ni presentaciones.
- La auditoría del sitio usa `applyChanges:false`: puede registrar auditoría y hallazgos,
  pero no reemplaza fotografías, cambia noticias ni encola correctores.
- Ningún comando inicia un servidor HTTP.

## Configuración propuesta

Crear tres publicaciones de tipo **Scheduled**, con zona horaria
`America/Monterrey`, una sola máquina por ejecución y los mismos Secrets de producción.
Los minutos están escalonados para reducir competencia por recursos.

| Tarea | Cron propuesto | Run command | Efecto autorizado |
|---|---:|---|---|
| Sesiones expiradas | `5 * * * *` | `npm run scheduled:security-maintenance` | Retira por ID exacto hasta 500 sesiones ya vencidas. |
| Auditoría del sitio | `20 3 * * *` | `npm run scheduled:website-audit` | Registra una auditoría diagnóstica diaria sin cambios editoriales. |
| Integridad de enlaces de Artículos | `40 3 * * *` | `npm run scheduled:article-link-integrity` | Comprueba fuentes externas y enlaces internos de contenido; despublica sólo Artículos cuya fuente no entrega contenido verificable. |
| Alertas legales | `35 6,18 * * *` | `npm run scheduled:legal-alerts` | Consulta fuentes permitidas, usa IA para relevancia y encola borradores para revisión humana. |

Build command recomendado para cada publicación: `npm ci`. El esquema debe haberse
migrado previamente desde el despliegue principal; no se configura `db:migrate` como
parte de cada tarea.

## Gates antes de activar

1. Confirmar que los PR de Fases 1 a 4 estén fusionados y que el deployment web se
   encuentre sano.
2. Ejecutar la migración en una base de prueba, comparar conteos y después aplicar el
   procedimiento productivo aprobado. La migración de Fase 4 solo crea tablas e índices.
3. Confirmar en producción la existencia de `scheduled_task_runs` y
   `deployment_artifacts`.
4. Publicar primero el job de sesiones; observar dos ventanas y verificar que solo
   cambie `admin_sessions` por identificadores vencidos exactos.
5. Publicar la auditoría con `applyChanges:false`; verificar que los conteos de abogados,
   noticias, contactos, CV y medios no cambien.
6. **No activar `legal-alerts` sin aprobación escrita del responsable**, porque consulta
   sitios externos, consume IA y crea trabajo persistente/borradores. Nunca autopublica.
7. Definir límite de costo, contacto operativo y procedimiento de desactivación.

## Verificación y respuesta

- Revisar el historial de cada Scheduled Deployment y las filas de
  `scheduled_task_runs`; una ventana debe tener una sola ejecución completada.
- Correlacionar `commit_sha` y `build_sha256` con `dist/build-provenance.json` y el
  artefacto de CI que contiene el SBOM.
- Ante una fila `failed`, revisar primero el log de la publicación. La tabla conserva un
  código genérico para no almacenar datos sensibles.
- Si una tarea se repite, cambia datos fuera de alcance o eleva errores, desactivar la
  publicación y conservar su evidencia. No ejecutar consultas de limpieza manuales.
- El monitoreo de uptime de Replit no cubre Scheduled Deployments; la documentación
  oficial consultada el 2026-08-20 indica que el historial se revisa en la pestaña de
  Schedule: [Monitoring a Deployment](https://docs.replit.com/references/publishing/monitoring-a-deployment).

## Estado contractual y operativo pendiente

La existencia de estos comandos en Git no demuestra que Replit los haya configurado.
Sistemas debe conservar capturas/exportes de la configuración real, plan, zona horaria,
historial, costos, Secrets vinculados y responsables. Para retención forense mayor que la
ofrecida en consola se requiere exportación a la herramienta corporativa aprobada.
