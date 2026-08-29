import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";
import sharp from "sharp";
import manifest from "../server/content/attorneyPhotoRefresh2026.json" with { type: "json" };
import { getPostgresConnectionConfig } from "../shared/postgres-config.mjs";

const root = process.cwd();
const directoryByRole = {
  Partner: "partner_photos",
  Associate: "associate_photos",
  "Of Counsel": "of_counsel_photos",
  Counsel: "counsel_photos",
};
const expectedByRole = { Partner: 25, Associate: 91, "Of Counsel": 6, Counsel: 9 };
const requireWebp = process.argv.includes("--require-webp");
const checkDatabase = process.argv.includes("--check-db");

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

if (manifest.approvedCount !== 131 || manifest.unchangedCount !== 11 || manifest.profiles.length !== 131) {
  throw new Error("The attorney photo manifest must contain exactly 131 approved and 11 unchanged profiles.");
}
if (new Set(manifest.profiles.map((profile) => profile.slug)).size !== 131) {
  throw new Error("The attorney photo manifest contains duplicate profile slugs.");
}

for (const [role, expected] of Object.entries(expectedByRole)) {
  const actual = manifest.profiles.filter((profile) => profile.role === role).length;
  if (actual !== expected) throw new Error(`Expected ${expected} ${role} photo updates, found ${actual}.`);
}

for (const profile of manifest.profiles) {
  const directory = directoryByRole[profile.role];
  const expectedPrefix = `/${directory}/`;
  if (!profile.targetImageUrl.startsWith(expectedPrefix)) throw new Error(`Incorrect category route for ${profile.slug}.`);
  const filename = profile.targetImageUrl.slice(expectedPrefix.length);
  const originalPath = path.join(root, "attached_assets", directory, filename);
  const original = await fs.readFile(originalPath);
  const metadata = await sharp(original, { failOn: "error" }).metadata();
  if (metadata.format !== "png" || metadata.width !== profile.source.width || metadata.height !== profile.source.height) {
    throw new Error(`Invalid original PNG dimensions for ${profile.slug}.`);
  }
  if (sha256(original) !== profile.source.sha256) throw new Error(`Invalid original PNG checksum for ${profile.slug}.`);
  if (requireWebp) {
    for (const width of [320, 640]) {
      const variant = path.join(root, "public", "optimized-attorney-photos", directory, `${path.parse(filename).name}-${width}.webp`);
      const variantBuffer = await fs.readFile(variant);
      const variantMetadata = await sharp(variantBuffer, { failOn: "error" }).metadata();
      if (variantMetadata.format !== "webp" || variantMetadata.width !== width) {
        throw new Error(`Invalid ${width}px WebP variant for ${profile.slug}.`);
      }
    }
  }
}

if (checkDatabase) {
  const client = new pg.Client({
    ...getPostgresConnectionConfig(process.env.DATABASE_MIGRATION_URL || process.env.DATABASE_URL),
  });
  await client.connect();
  const { rows } = await client.query(
    `SELECT slug, image_url, published FROM team_members WHERE slug = ANY($1::text[])`,
    [manifest.profiles.map((profile) => profile.slug)],
  );
  await client.end();
  const imagesBySlug = new Map(rows.map((row) => [row.slug, row.image_url]));
  if (rows.length !== 131) throw new Error(`Expected 131 profiles in the database, found ${rows.length}.`);
  for (const profile of manifest.profiles) {
    if (imagesBySlug.get(profile.slug) !== profile.targetImageUrl) {
      throw new Error(`Database route does not match the manifest for ${profile.slug}.`);
    }
  }
}

console.log(JSON.stringify({ status: "ok", profiles: 131, unchanged: 11, webp: requireWebp, database: checkDatabase }, null, 2));
