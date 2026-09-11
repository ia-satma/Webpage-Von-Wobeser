const ORIGINAL_DIVERSITY_ORIGIN = "https://vonwobeser.com/images";

const videoTargets = Array.from({ length: 7 }, (_, index) => {
  const number = index + 1;
  const localOriginal = `/images/vid_0${number}.mp4`;
  return {
    key: `page_diversity_video_${number}`,
    value: `${ORIGINAL_DIVERSITY_ORIGIN}/vid_0${number}.mp4`,
    legacy: ["", localOriginal, ...(number <= 6 ? [`/img/videos/video${number}.mp4`] : [])],
  };
});

const thumbnailTargets = Array.from({ length: 7 }, (_, index) => {
  const number = index + 1;
  return {
    key: `page_diversity_thumb_${number}`,
    value: `/images/diversity-thumbnails/video-${number}.jpg`,
    legacy: [""],
  };
});

/**
 * Restaura las referencias del carrusel original de Diversidad después de
 * separar las seis rutas que pertenecen a Nuevas oficinas. Sólo sustituye
 * valores vacíos o heredados conocidos, para conservar cambios hechos desde
 * Administración.
 */
export default async function restoreDiversityCarousel(client) {
  let restored = 0;
  for (const target of [...videoTargets, ...thumbnailTargets]) {
    const updated = await client.query(
      `UPDATE site_config
          SET value = $1,
              value_es = $1,
              updated_at = now()
        WHERE key = $2
          AND value = ANY($3::text[])
          AND COALESCE(value_es, '') = ANY($3::text[])
        RETURNING key, value, value_es`,
      [target.value, target.key, target.legacy],
    );
    if (updated.rowCount > 1) {
      throw new Error(`Expected at most one ${target.key} row, found ${updated.rowCount}`);
    }
    if (updated.rowCount === 1) {
      const row = updated.rows[0];
      if (row?.key !== target.key || row.value !== target.value || row.value_es !== target.value) {
        throw new Error(`Unable to restore the Diversity carousel setting ${target.key}`);
      }
      restored += 1;
    }
  }
  console.log(`[migrations] restored ${restored} Diversity carousel settings`);
}
