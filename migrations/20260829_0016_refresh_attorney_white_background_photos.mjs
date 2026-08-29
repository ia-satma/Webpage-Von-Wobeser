import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import attorneyPhotoRefresh2026 from "../server/content/attorneyPhotoRefresh2026.json" with { type: "json" };

const EXPECTED_PROFILE_COUNT = 131;
const ASSET_DIRECTORY_BY_ROLE = {
  Partner: "partner_photos",
  Associate: "associate_photos",
  "Of Counsel": "of_counsel_photos",
  Counsel: "counsel_photos",
};

function digest(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function expectedAssetPath(profile) {
  const directory = ASSET_DIRECTORY_BY_ROLE[profile.role];
  if (!directory) throw new Error(`Unsupported profile role in photo manifest: ${profile.role}`);
  const prefix = `/${directory}/`;
  if (!profile.targetImageUrl.startsWith(prefix)) {
    throw new Error(`Photo route does not match the approved role for ${profile.slug}`);
  }
  const filename = profile.targetImageUrl.slice(prefix.length);
  if (!/^[a-z0-9][a-z0-9-]*-2026-white-bg\.png$/.test(filename)) {
    throw new Error(`Unexpected versioned photo filename for ${profile.slug}`);
  }
  return path.join(process.cwd(), "attached_assets", directory, filename);
}

/**
 * Repoints only the approved existing profiles to newly versioned, white
 * background source PNGs. The previous assets remain untouched on disk, while
 * a changed Administrator URL causes the transaction to stop rather than
 * overwriting an editorial adjustment.
 */
export default async function refreshAttorneyWhiteBackgroundPhotos(client) {
  const profiles = attorneyPhotoRefresh2026.profiles;
  if (
    attorneyPhotoRefresh2026.approvedCount !== EXPECTED_PROFILE_COUNT
    || profiles.length !== EXPECTED_PROFILE_COUNT
    || new Set(profiles.map((profile) => profile.slug)).size !== EXPECTED_PROFILE_COUNT
  ) {
    throw new Error("Attorney white-background photo manifest is incomplete or contains duplicate slugs.");
  }

  for (const profile of profiles) {
    const assetPath = expectedAssetPath(profile);
    const bytes = await fs.readFile(assetPath);
    if (digest(bytes) !== profile.source.sha256) {
      throw new Error(`Photo checksum mismatch for ${profile.slug}.`);
    }
  }

  const slugs = profiles.map((profile) => profile.slug);
  const located = await client.query(
    `SELECT id, slug, name, title, image_url, published
       FROM team_members
      WHERE slug = ANY($1::text[])
      FOR UPDATE`,
    [slugs],
  );
  if (located.rowCount !== EXPECTED_PROFILE_COUNT) {
    throw new Error(`Expected ${EXPECTED_PROFILE_COUNT} approved attorney profiles, found ${located.rowCount}.`);
  }

  const memberBySlug = new Map(located.rows.map((member) => [member.slug, member]));
  let changed = 0;
  for (const profile of profiles) {
    const member = memberBySlug.get(profile.slug);
    if (!member) throw new Error(`Missing approved attorney profile ${profile.slug}.`);
    if (member.name !== profile.expectedName || member.title !== profile.role) {
      throw new Error(`Identity mismatch for ${profile.slug}; the photo update was not applied.`);
    }
    if (member.image_url === profile.targetImageUrl) continue;
    if (member.image_url !== profile.previousImageUrl) {
      throw new Error(`Image URL for ${profile.slug} was changed in Administration; refusing to overwrite it.`);
    }

    const updated = await client.query(
      `UPDATE team_members
          SET image_url = $1
        WHERE id = $2
          AND slug = $3
          AND title = $4
          AND image_url = $5
        RETURNING id, slug, name, title, image_url, published`,
      [profile.targetImageUrl, member.id, profile.slug, profile.role, profile.previousImageUrl],
    );
    const result = updated.rows[0];
    if (
      updated.rowCount !== 1
      || result?.id !== member.id
      || result?.slug !== profile.slug
      || result?.name !== profile.expectedName
      || result?.title !== profile.role
      || result?.image_url !== profile.targetImageUrl
      || result?.published !== member.published
    ) {
      throw new Error(`Unable to update only the approved photo for ${profile.slug}.`);
    }
    changed += 1;
  }

  console.log(`[migrations] refreshed ${changed} approved attorney photos; ${EXPECTED_PROFILE_COUNT - changed} were already current`);
}
