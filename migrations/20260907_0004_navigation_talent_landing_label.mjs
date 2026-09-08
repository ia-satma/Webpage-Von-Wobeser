/**
 * Actualiza la etiqueta histórica del enlace editorial de Talento sin tocar
 * rutas, orden ni visibilidad. Aplica a ambos presets administrables; una
 * etiqueta ya editada por Administración se conserva intacta.
 */
export function normalizeTalentLandingLabel(raw) {
  try {
    const configuration = JSON.parse(String(raw || ""));
    if (!Array.isArray(configuration?.items)) return null;
    const talent = configuration.items.find((item) => item?.id === "talent");
    const landing = talent?.children?.find((child) => child?.id === "talent-work");
    if (!landing || typeof landing !== "object") return null;
    const spanishChanged = landing.labelEs === "Trabaja con nosotros";
    const englishChanged = landing.labelEn === "Work with us";
    if (!spanishChanged && !englishChanged) return null;
    if (spanishChanged) landing.labelEs = "Tu carrera con nosotros";
    if (englishChanged) landing.labelEn = "Your career with us";
    return JSON.stringify(configuration);
  } catch {
    return null;
  }
}

export default async function migrateNavigationTalentLandingLabel(client) {
  const keys = ["nav_structure_v2", "nav_classic_structure_v2"];
  const result = await client.query(
    "SELECT key, value, value_es FROM site_config WHERE key = ANY($1::text[]) FOR UPDATE",
    [keys],
  );

  for (const row of result.rows) {
    const value = normalizeTalentLandingLabel(row.value);
    const valueEs = normalizeTalentLandingLabel(row.value_es);
    if (!value && !valueEs) continue;

    await client.query(
      `UPDATE site_config
         SET value = $1, value_es = $2, updated_at = now()
       WHERE key = $3`,
      [value || row.value, valueEs || row.value_es, row.key],
    );
  }
}
