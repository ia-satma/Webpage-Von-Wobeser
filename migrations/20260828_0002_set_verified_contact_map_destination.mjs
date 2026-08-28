const CONFIG_KEY = "office_map_directions";
const HISTORICAL_DIRECTIONS_URL = "https://www.google.com/maps/dir/?api=1&destination=19.427559,-99.195333";
const PREVIOUS_DIRECTIONS_URL = "https://www.google.com/maps/dir/?api=1&destination=Torre%20SOMA%20Chapultepec%2C%20Piso%2018%2C%20Campos%20El%C3%ADseos%20204%2C%20Polanco%2C%20acceso%20por%20Calle%20Arqu%C3%ADmedes%2010%2C%2011550%2C%20Ciudad%20de%20M%C3%A9xico";
export const VERIFIED_DIRECTIONS_URL = "https://www.google.com/maps/dir/?api=1&destination=Campos%20El%C3%ADseos%20204%2C%20Polanco%2C%20Polanco%20IV%20Secc%2C%20Miguel%20Hidalgo%2C%2011550%20Ciudad%20de%20M%C3%A9xico%2C%20CDMX";

/**
 * Ajusta sólo los dos destinos conocidos como incorrectos. Una edición distinta
 * hecha por Administración queda intacta y seguirá siendo la fuente editable.
 */
export default async function setVerifiedContactMapDestination(client) {
  const updated = await client.query(
    `UPDATE site_config
        SET value = $1,
            value_es = $1,
            updated_at = now()
      WHERE key = $2
        AND (value = ANY($3::text[]) OR value_es = ANY($3::text[]))
      RETURNING key, value, value_es`,
    [VERIFIED_DIRECTIONS_URL, CONFIG_KEY, [HISTORICAL_DIRECTIONS_URL, PREVIOUS_DIRECTIONS_URL]],
  );

  if (updated.rowCount > 1) {
    throw new Error(`Expected at most one ${CONFIG_KEY} row, found ${updated.rowCount}`);
  }
  if (updated.rowCount === 1) {
    const config = updated.rows[0];
    if (config?.key !== CONFIG_KEY || config.value !== VERIFIED_DIRECTIONS_URL || config.value_es !== VERIFIED_DIRECTIONS_URL) {
      throw new Error("Unable to persist the verified office directions URL");
    }
    console.log("[migrations] set the client-verified public office directions URL");
  }
}
