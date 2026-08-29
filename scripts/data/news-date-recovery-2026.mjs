/**
 * Inventario inmutable para recuperar fechas de Noticias auditadas el 28-08-2026.
 *
 * Se fija contra el inventario primario de la auditoría, no contra los reportes
 * derivados que se regeneran al verificar cobertura. El subconjunto recuperable
 * contiene 597 evidencias directas para 597 filas únicas; las 56 contrapartes
 * ES/EN adicionales se
 * validan en la auditoría completa de 1,530 fuentes después de aplicar.
 */
export const NEWS_DATE_RECOVERY_20260828 = Object.freeze({
  inventoryPath: "output/audits/noticias-fechas-2026-08-28/VWYS_Auditoria_Fechas_Noticias_2026-08-28.inventario.csv",
  inventorySha256: "0cc9ad100a8cdbfe5fcec139f6d6095ef4f408b8bc5ecc215ae253e5d34316e2",
  officialOrigin: "https://www.vonwobeser.com",
  officialEvidenceEntries: 1530,
  recoverySourceEvidenceEntries: 597,
  verifiedLanguageCounterpartEvidenceEntries: 56,
  expectedProjectRows: 597,
  expectedProjectOnlyRows: 63,
  precision: "month",
});
