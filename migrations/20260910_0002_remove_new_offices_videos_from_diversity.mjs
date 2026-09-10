const OFFICE_VIDEO_PATHS = Array.from(
  { length: 6 },
  (_, index) => `/img/videos/video${index + 1}.mp4`,
);
const OFFICE_VIDEO_THUMBNAILS = Array.from(
  { length: 6 },
  (_, index) => `/images/diversity-thumbnails/video-${index + 1}.jpg`,
);

/**
 * Vacía únicamente las rutas heredadas del carrusel de Nuevas oficinas que
 * quedaron en Diversidad. Una URL o miniatura distinta introducida desde
 * Administración se conserva para no borrar contenido propio de Diversidad.
 */
export default async function removeNewOfficesVideosFromDiversity(client) {
  let removed = 0;
  const targets = [
    ...OFFICE_VIDEO_PATHS.map((value, index) => ({
      key: `page_diversity_video_${index + 1}`,
      value,
    })),
    ...OFFICE_VIDEO_THUMBNAILS.map((value, index) => ({
      key: `page_diversity_thumb_${index + 1}`,
      value,
    })),
  ];

  for (const target of targets) {
    const updated = await client.query(
      `UPDATE site_config
          SET value = '',
              value_es = '',
              updated_at = now()
        WHERE key = $1
          AND value = $2
          AND COALESCE(value_es, '') IN ('', $2)
        RETURNING key, value, value_es`,
      [target.key, target.value],
    );
    if (updated.rowCount > 1) {
      throw new Error(`Expected at most one ${target.key} row, found ${updated.rowCount}`);
    }
    if (updated.rowCount === 1) {
      const row = updated.rows[0];
      if (row?.key !== target.key || row.value !== '' || row.value_es !== '') {
        throw new Error(`Unable to remove the inherited New Offices asset from ${target.key}`);
      }
      removed += 1;
    }
  }
  console.log(`[migrations] removed ${removed} inherited New Offices assets from Diversity`);
}
