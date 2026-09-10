const SLUG = "bernardo-zatarain";
const EXPECTED_NAME = "Bernardo Zatarain";
const EXPECTED_TITLE = "Associate";
const PREVIOUS_IMAGE_URL = "/associate_photos/bernardo-zatarain-2026-white-bg.png";
const TARGET_IMAGE_URL = "/associate_photos/bernardo-zatarain-2026-white-bg.png?v=20260910";

/**
 * Publica exclusivamente el retrato editorial entregado para Bernardo
 * Zatarain. El query string versiona las tres rutas de imagen (original y
 * WebP) y evita que los navegadores sigan usando una copia inmutable previa.
 * Una edición posterior desde Administración nunca se sustituye.
 */
export default async function refreshBernardoZatarainPhoto(client) {
  const located = await client.query(
    `SELECT id, slug, name, title, image_url, published
       FROM team_members
      WHERE slug = $1
      FOR UPDATE`,
    [SLUG],
  );
  const member = located.rows[0];
  if (located.rowCount !== 1 || !member) {
    throw new Error("Expected exactly one Bernardo Zatarain profile.");
  }
  if (member.name !== EXPECTED_NAME || member.title !== EXPECTED_TITLE) {
    throw new Error("Bernardo Zatarain profile identity does not match the approved correction.");
  }
  if (member.image_url === TARGET_IMAGE_URL) {
    console.log("[migrations] Bernardo Zatarain photo is already current");
    return;
  }
  if (member.image_url !== PREVIOUS_IMAGE_URL) {
    throw new Error("Bernardo Zatarain photo was changed in Administration; refusing to overwrite it.");
  }

  const updated = await client.query(
    `UPDATE team_members
        SET image_url = $1
      WHERE id = $2
        AND slug = $3
        AND title = $4
        AND image_url = $5
      RETURNING id, slug, name, title, image_url, published`,
    [TARGET_IMAGE_URL, member.id, SLUG, EXPECTED_TITLE, PREVIOUS_IMAGE_URL],
  );
  const result = updated.rows[0];
  if (
    updated.rowCount !== 1
    || result?.id !== member.id
    || result?.slug !== SLUG
    || result?.name !== EXPECTED_NAME
    || result?.title !== EXPECTED_TITLE
    || result?.image_url !== TARGET_IMAGE_URL
    || result?.published !== member.published
  ) {
    throw new Error("Unable to update only Bernardo Zatarain's photo.");
  }
  console.log("[migrations] refreshed Bernardo Zatarain photo");
}
