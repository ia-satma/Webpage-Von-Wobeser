const PREVIOUS_PLATFORM_ORIGIN = "https://vonwobeser.com/images";

const videoTargets = Array.from({ length: 7 }, (_, index) => {
  const number = index + 1;
  return {
    key: `page_diversity_video_${number}`,
    value: `/images/vid_0${number}.mp4`,
    previousValue: `${PREVIOUS_PLATFORM_ORIGIN}/vid_0${number}.mp4`,
  };
});

/**
 * Reubica los videos de Diversidad en el espejo local. Sólo sustituye las
 * siete rutas externas exactas creadas por la recuperación anterior y nunca
 * reemplaza una selección posterior del panel administrativo.
 */
export default async function localizeDiversityVideos(client) {
  let localized = 0;
  for (const target of videoTargets) {
    const updated = await client.query(
      `UPDATE site_config
          SET value = $1,
              value_es = $1,
              updated_at = now()
        WHERE key = $2
          AND value = $3
          AND COALESCE(value_es, '') IN ('', $3)
        RETURNING key, value, value_es`,
      [target.value, target.key, target.previousValue],
    );
    if (updated.rowCount > 1) {
      throw new Error(`Expected at most one ${target.key} row, found ${updated.rowCount}`);
    }
    if (updated.rowCount === 1) {
      const row = updated.rows[0];
      if (row?.key !== target.key || row.value !== target.value || row.value_es !== target.value) {
        throw new Error(`Unable to localize the Diversity video ${target.key}`);
      }
      localized += 1;
    }
  }
  console.log(`[migrations] localized ${localized} Diversity videos in the mirror`);
}
