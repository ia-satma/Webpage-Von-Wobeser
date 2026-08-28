const LEGACY_MAIN_THUMB = "/images/thumb_main_vid.png";

const replacements = [
  ...Array.from({ length: 6 }, (_, index) => {
    const number = index + 1;
    return {
      key: `page_diversity_video_${number}`,
      value: `/img/videos/video${number}.mp4`,
      legacy: [`/images/vid_0${number}.mp4`],
    };
  }),
  {
    key: "page_diversity_video_7",
    value: "",
    legacy: ["/images/vid_07.mp4"],
  },
  {
    key: "page_diversity_thumb_main",
    value: "/images/diversity-thumbnails/main.jpg",
    legacy: [LEGACY_MAIN_THUMB],
  },
  ...Array.from({ length: 6 }, (_, index) => {
    const number = index + 1;
    return {
      key: `page_diversity_thumb_${number}`,
      value: `/images/diversity-thumbnails/video-${number}.jpg`,
      legacy: [LEGACY_MAIN_THUMB, `/images/thumb_0${number}.jpg`],
    };
  }),
  {
    key: "page_diversity_thumb_7",
    value: "",
    legacy: [LEGACY_MAIN_THUMB, "/images/thumb_07.jpg"],
  },
];

/**
 * Recupera los seis videos reales conservados en el espejo y asocia a cada
 * uno un fotograma propio. Sólo sustituye las rutas heredadas conocidas, por
 * lo que una edición posterior hecha desde Administración no se sobrescribe.
 */
export default async function restoreDiversityVideoGallery(client) {
  let updatedCount = 0;
  for (const replacement of replacements) {
    const updated = await client.query(
      `UPDATE site_config
          SET value = $1,
              value_es = $1,
              updated_at = now()
        WHERE key = $2
          AND (value = ANY($3::text[]) OR value_es = ANY($3::text[]))
        RETURNING key, value, value_es`,
      [replacement.value, replacement.key, replacement.legacy],
    );
    if (updated.rowCount > 1) {
      throw new Error(`Expected at most one ${replacement.key} row, found ${updated.rowCount}`);
    }
    if (updated.rowCount === 1) {
      const row = updated.rows[0];
      if (row?.key !== replacement.key || row.value !== replacement.value || row.value_es !== replacement.value) {
        throw new Error(`Unable to restore Diversity gallery setting ${replacement.key}`);
      }
      updatedCount += 1;
    }
  }
  console.log(`[migrations] restored ${updatedCount} Diversity video gallery settings`);
}
