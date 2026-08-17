/**
 * Actualiza únicamente la etiqueta del menú definitivo ya guardado en el CMS.
 * No modifica rutas, orden, visibilidad, submenús ni el preset clásico.
 */
export function normalizeDefinitiveInsightsLabel(raw) {
  try {
    const configuration = JSON.parse(String(raw || ""));
    if (!Array.isArray(configuration?.items)) return null;
    const insights = configuration.items.find((item) => item?.id === "perspectives");
    if (!insights || typeof insights !== "object") return null;
    insights.labelEs = "Insights";
    insights.labelEn = "Insights";
    return JSON.stringify(configuration);
  } catch {
    return null;
  }
}

export default async function migrateNavigationInsightsLabel(client) {
  const result = await client.query(
    "SELECT value, value_es FROM site_config WHERE key = $1 FOR UPDATE",
    ["nav_structure_v2"],
  );
  const row = result.rows[0];
  if (!row) return;

  const normalized = normalizeDefinitiveInsightsLabel(row.value)
    || normalizeDefinitiveInsightsLabel(row.value_es);
  if (!normalized) return;

  await client.query(
    `UPDATE site_config
       SET value = $1, value_es = $1, updated_at = now()
     WHERE key = $2`,
    [normalized, "nav_structure_v2"],
  );

  await client.query(
    `UPDATE site_config
       SET value = 'Insights', value_es = 'Insights', updated_at = now()
     WHERE key = 'nav_publications'
       AND value_es = 'Perspectivas'`,
  );
}
