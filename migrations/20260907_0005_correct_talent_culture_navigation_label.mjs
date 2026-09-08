/**
 * Corrige el destino exacto de la decisión editorial: "Tu carrera con
 * nosotros" pertenece al submenú de cultura. Restaura el enlace editorial de
 * cabecera sólo si conserva el valor introducido por la migración anterior.
 * No modifica rutas, orden, visibilidad ni etiquetas personalizadas desde
 * Administración.
 */
export function normalizeTalentCultureNavigationLabel(raw) {
  try {
    const configuration = JSON.parse(String(raw || ""));
    if (!Array.isArray(configuration?.items)) return null;
    const talent = configuration.items.find((item) => item?.id === "talent");
    const culture = talent?.children?.find((child) => child?.id === "talent-culture");
    const landing = talent?.children?.find((child) => child?.id === "talent-work");
    if (!culture || !landing || typeof culture !== "object" || typeof landing !== "object") return null;

    let changed = false;
    if (culture.labelEs === "Conoce nuestra cultura") {
      culture.labelEs = "Tu carrera con nosotros";
      changed = true;
    }
    if (culture.labelEn === "Discover our culture") {
      culture.labelEn = "Your career with us";
      changed = true;
    }
    if (landing.labelEs === "Tu carrera con nosotros") {
      landing.labelEs = "Trabaja con nosotros";
      changed = true;
    }
    if (landing.labelEn === "Your career with us") {
      landing.labelEn = "Work with us";
      changed = true;
    }
    return changed ? JSON.stringify(configuration) : null;
  } catch {
    return null;
  }
}

export default async function correctTalentCultureNavigationLabel(client) {
  const result = await client.query(
    "SELECT key, value, value_es FROM site_config WHERE key = ANY($1::text[]) FOR UPDATE",
    [["nav_structure_v2", "nav_classic_structure_v2"]],
  );

  for (const row of result.rows) {
    const value = normalizeTalentCultureNavigationLabel(row.value);
    const valueEs = normalizeTalentCultureNavigationLabel(row.value_es);
    if (!value && !valueEs) continue;
    await client.query(
      `UPDATE site_config
         SET value = $1, value_es = $2, updated_at = now()
       WHERE key = $3`,
      [value || row.value, valueEs || row.value_es, row.key],
    );
  }
}
