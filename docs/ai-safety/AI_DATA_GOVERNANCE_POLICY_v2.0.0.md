# Política ejecutable de gobierno de datos para IA

**Versión:** 2.0.0
**Fecha:** 20 de agosto de 2026
**Clasificación:** uso interno
**Estado:** implementada en código; activación productiva sujeta a migración y Secrets
**Fuente canónica de runtime:** `shared/aiGovernance.ts`, `server/ai/policy.ts`,
`server/ai/dataGovernance.ts` y `server/ai/gateway.ts`

## Propósito

Impedir que los agentes, traducciones, generación de imágenes, voz o búsqueda web envíen
datos personales, confidenciales o amparados por secreto profesional a un proveedor externo
de IA. La política se evalúa antes de abrir la conexión con el proveedor y no sustituye la
clasificación humana, la revisión jurídica ni un programa formal de prevención de pérdida de
datos.

## Alcance real

El inventario canónico contiene 14 agentes. Doce pueden consumir un proveedor externo y dos
son deterministas:

| Agente | Proveedor externo | Finalidad aprobada |
|---|---:|---|
| `content_analyzer` | Sí | análisis editorial |
| `category_agent` | Sí | taxonomía legal |
| `metadata_linker` | Sí | metadatos editoriales |
| `legal_alerts` | Sí | borrador desde fuente oficial |
| `formatter` | Sí | formato editorial |
| `polyglot_translator` | Sí | traducción legal |
| `seo_optimizer` | Sí | propuesta SEO |
| `image_suggestion` | Sí | imagen editorial |
| `social_media` | Sí | borrador para redes |
| `newsletter` | Sí | borrador de boletín |
| `voice_agent` | Sí | texto a voz |
| `presentation_generator` | Sí | borrador de presentación |
| `content_auditor` | No | auditoría determinista de contenido |
| `website_auditor` | No | auditoría determinista del sitio |

Todo resultado generado requiere revisión humana. “Revisión automatizada de riesgo legal”
es la descripción correcta del servicio interno antes llamado “Legal Council”; no es un
dictamen jurídico independiente.

## Clasificación obligatoria

| Clasificación | Envío a proveedor externo | Regla |
|---|---:|---|
| `public` | Permitido | Información aprobada para difusión pública. |
| `internal` | Permitido con inspección | Material interno sin datos personales, secretos ni privilegio. |
| `personal` | Bloqueado | Datos que identifican o hacen identificable a una persona. |
| `confidential` | Bloqueado | Información reservada, contractual, estratégica o no divulgable. |
| `privileged` | Bloqueado | Comunicación abogado-cliente, secreto profesional o estrategia legal reservada. |

Una clasificación permitida no anula el escáner. Aun si una persona declara el material
`public` o `internal`, el runtime bloquea patrones de credenciales, correo, teléfono,
identificadores gubernamentales o financieros y marcadores explícitos de confidencialidad,
privilegio o expedientes sensibles. Los motivos se devuelven como códigos; no se refleja el
texto detectado.

## Puerta central de proveedores

Toda llamada de producción a OpenAI, Gemini o Cloudflare AI pasa por
`executeAiProviderCall()` y sigue este orden:

1. Canoniza e inspecciona el material en memoria; si excede el límite inspeccionable, lo
   bloquea en vez de truncarlo silenciosamente.
2. Determina si clasificación, agente y finalidad están permitidos.
3. Registra una decisión durable sin guardar el contenido.
4. Si la decisión es negativa o la auditoría no está disponible en producción, falla cerrado.
5. Comprueba el presupuesto para operaciones facturables.
6. Solo entonces invoca al proveedor.

Los eventos guardan proveedor, operación, finalidad, agente, clasificación, decisión,
códigos de motivo, tamaño, versión de política y una huella; no guardan prompt, respuesta,
correo, teléfono, secreto ni cuerpo documental. En producción la auditoría es obligatoria y
no existe una variable de bypass: si la tabla o la conexión no están disponibles, no se invoca
al proveedor. `AI_GOVERNANCE_AUDIT_ENABLED=true` sirve únicamente para ensayar esa
persistencia fuera de producción.

El script manual `scripts/test-claude.mjs` no forma parte del runtime y usa únicamente dos
prompts sintéticos fijos para comprobar conectividad. Nunca debe modificarse para recibir
archivos, argumentos o contenido real.

## Controles humanos en el panel

- Presentaciones, voz, alertas legales y texto libre del formateador requieren clasificación
  y confirmación explícita antes de usar IA.
- Cambiar tema, documentos, texto o clasificación invalida la confirmación anterior.
- Las presentaciones ejecutan una inspección sobre el tema y todo el texto extraído antes de
  crear prompts secundarios o imágenes.
- El conocimiento de agentes exige el permiso independiente `agent_knowledge_admin`.
- Crear, editar o cargar conocimiento en lote requiere clasificación, confirmación y escaneo.
- Los registros históricos de conocimiento reciben `unclassified` y quedan fuera de los
  prompts hasta que una persona autorizada los revise y apruebe.

## Persistencia y cifrado aditivo

La migración `20260820_0003_ai_data_governance.sql` solo añade columnas, tablas e índices.
No contiene `UPDATE`, `DELETE`, `DROP`, `TRUNCATE` ni cambios a tablas de abogados, noticias,
CV, contactos, medios o administradores.

`protected_field_envelopes` permite, en una fase posterior, conservar una copia cifrada
AES-256-GCM de campos de nuevos contactos y nuevas postulaciones. Sus reglas son:

- está desactivado salvo `APP_FIELD_ENCRYPTION_DUAL_WRITE=true`;
- requiere una clave de exactamente 32 bytes y un identificador de clave;
- usa IV aleatorio, etiqueta GCM y datos autenticados ligados a recurso, ID, campo y versión;
- la huella se calcula sobre el sobre cifrado, no sobre el dato personal;
- la inserción original y la copia cifrada ocurren en la misma transacción;
- no modifica filas históricas y no elimina las columnas originales.

La activación, rotación de llave, backfill y retiro futuro de columnas originales requieren
respaldo, restauración probada y autorización separada de Sistemas y Jurídico.

## Separación de roles PostgreSQL

El runtime acepta `DATABASE_APP_URL`; las migraciones aceptan `DATABASE_MIGRATION_URL`.
Mientras Sistemas no entregue credenciales separadas, ambos conservan compatibilidad con
`DATABASE_URL`. Al establecer `REQUIRE_SEPARATE_DATABASE_ROLES=true`, cada proceso exige su
credencial específica y rechaza que ambas URLs sean idénticas cuando están presentes. El
código no crea usuarios ni concede privilegios: esa operación corresponde a Sistemas y al
proveedor administrado.

## Limitaciones y riesgo residual

- La detección por patrones reduce riesgo, pero puede producir falsos positivos o negativos;
  no es un DLP empresarial ni una garantía de anonimización.
- `internal` significa “aprobado para el proveedor configurado y sin categorías bloqueadas”;
  no significa “secreto”.
- No existe autorización para enviar contenido de cliente, expedientes, CV o comunicaciones
  privilegiadas, aunque el proveedor declare no entrenar con los datos.
- La revisión humana es obligatoria antes de publicar o utilizar profesionalmente un resultado.
- MFA continúa desactivado por decisión vigente y permanece como riesgo alto independiente.
- La separación real de roles y el cifrado dual requieren Secrets que Sistemas todavía debe
  aprovisionar; su presencia en el código no significa que estén activados.
- La política no acredita cumplimiento normativo, pentest ni ausencia de vulnerabilidades.

## Respuesta a un bloqueo o incidente

1. No reetiquetar el material para evadir el bloqueo.
2. Retirar o anonimizar los datos en el sistema fuente autorizado, conservando la evidencia
   que corresponda.
3. Si se sospecha una exposición, rotar la credencial afectada y preservar los eventos de
   gobierno y auditoría administrativa.
4. Escalar a Sistemas, Jurídico y Privacidad según el runbook institucional.
5. Documentar proveedor, momento, finalidad y alcance; nunca copiar el contenido sensible al
   ticket o a los logs.

## Control de cambios

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 15-jul-2026 | Taxonomía documental para diez agentes; no estaba conectada al runtime completo. |
| 2.0.0 | 20-ago-2026 | Inventario de 14 agentes, clasificación previa, gateway central, auditoría sin contenido, permiso de conocimiento, cifrado aditivo y preparación para roles separados. |
