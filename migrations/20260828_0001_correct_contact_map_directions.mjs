const CONFIG_KEY = "office_map_directions";
const LEGACY_DIRECTIONS_URL = "https://www.google.com/maps/dir/?api=1&destination=19.427559,-99.195333";
export const OFFICE_DIRECTIONS_URL = "https://www.google.com/maps/dir/?api=1&destination=Torre%20SOMA%20Chapultepec%2C%20Piso%2018%2C%20Campos%20El%C3%ADseos%20204%2C%20Polanco%2C%20acceso%20por%20Calle%20Arqu%C3%ADmedes%2010%2C%2011550%2C%20Ciudad%20de%20M%C3%A9xico";

/**
 * Reemplaza exclusivamente el destino de coordenadas histórico que llevaba a
 * un punto distinto de Torre SOMA. Si Administración ya cambió este campo, la
 * migración no lo toca: el panel sigue siendo la fuente editable.
 */
export default async function correctContactMapDirections(client) {
  const updated = await client.query(
    `UPDATE site_config
        SET value = $1,
            value_es = $1,
            updated_at = now()
      WHERE key = $2
        AND (value = $3 OR value_es = $3)
      RETURNING key, value, value_es`,
    [OFFICE_DIRECTIONS_URL, CONFIG_KEY, LEGACY_DIRECTIONS_URL],
  );

  if (updated.rowCount > 1) {
    throw new Error(`Expected at most one ${CONFIG_KEY} row, found ${updated.rowCount}`);
  }

  if (updated.rowCount === 1) {
    const config = updated.rows[0];
    if (config?.key !== CONFIG_KEY || config.value !== OFFICE_DIRECTIONS_URL || config.value_es !== OFFICE_DIRECTIONS_URL) {
      throw new Error("Unable to persist the corrected office directions URL");
    }
    console.log("[migrations] corrected the public office directions URL");
  }
}
