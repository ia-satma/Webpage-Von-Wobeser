import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import manifest from "../content/attorneyPhotoRefresh2026.json";

const root = process.cwd();
const expectedByRole = { Partner: 25, Associate: 91, "Of Counsel": 6, Counsel: 9 } as const;
const expectedUnchanged = new Set([
  "pablo-saez-williams",
  "jaime-antonio-sanchez",
  "mariana-gomez-vallin",
  "mercedes-jimenez-roel",
  "ricardo-rosas",
  "juan-arturo-ramos-robles",
  "patricio-cortina",
  "miguel-angel-chinchilla",
  "victor-delgado",
  "margarita-lima",
  "maria-elisa-vera-madrigal",
]);

function sha256(filePath: string) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

test("el manifiesto de retratos con fondo blanco sólo contiene los 131 perfiles aprobados", () => {
  assert.equal(manifest.approvedCount, 131);
  assert.equal(manifest.unchangedCount, 11);
  assert.equal(manifest.profiles.length, 131);
  assert.equal(new Set(manifest.profiles.map((profile) => profile.slug)).size, 131);
  assert.deepEqual(
    new Set(manifest.unchangedProfiles.map((profile) => profile.slug)),
    expectedUnchanged,
  );
  for (const [role, expected] of Object.entries(expectedByRole)) {
    assert.equal(manifest.profiles.filter((profile) => profile.role === role).length, expected, role);
  }
  const edmond = manifest.profiles.find((profile) => profile.slug === "edmond-grieger");
  assert.equal(edmond?.source.originalFilename, "5.2. Edmond Grieger (para eventos).png");
});

test("cada retrato nuevo conserva un PNG verificable, versionado y una ruta de su propia categoría", () => {
  const directoryByRole: Record<string, string> = {
    Partner: "partner_photos",
    Associate: "associate_photos",
    "Of Counsel": "of_counsel_photos",
    Counsel: "counsel_photos",
  };
  for (const profile of manifest.profiles) {
    const directory = directoryByRole[profile.role];
    assert.ok(directory, `categoría ${profile.role}`);
    assert.match(profile.targetImageUrl, new RegExp(`^/${directory}/[a-z0-9-]+-2026-white-bg\\.png$`));
    const assetPath = path.join(root, "attached_assets", directory, path.basename(profile.targetImageUrl));
    assert.ok(fs.existsSync(assetPath), `falta ${profile.slug}`);
    assert.equal(sha256(assetPath), profile.source.sha256, `checksum ${profile.slug}`);
  }
});

test("Consejeros usa las mismas rutas estáticas, auditoría y variantes responsivas que el resto", () => {
  const publicAssets = fs.readFileSync(path.join(root, "server", "routes", "publicAssetRoutes.ts"), "utf8");
  const responsive = fs.readFileSync(path.join(root, "server", "mirror", "htmlPipeline.ts"), "utf8");
  const variants = fs.readFileSync(path.join(root, "scripts", "generate-attorney-image-variants.mjs"), "utf8");
  const mediaAudit = fs.readFileSync(path.join(root, "server", "agents", "specialized", "websiteAuditMedia.ts"), "utf8");
  const migration = fs.readFileSync(path.join(root, "migrations", "20260829_0016_refresh_attorney_white_background_photos.mjs"), "utf8");

  assert.match(publicAssets, /app\.use\('\/counsel_photos'/);
  assert.match(responsive, /counsel_photos/);
  assert.match(variants, /"counsel_photos"/);
  assert.match(mediaAudit, /counsel_photos/);
  assert.match(migration, /SET image_url = \$1/);
  assert.doesNotMatch(migration, /SET\s+published\s*=/i);
  assert.match(migration, /refusing to overwrite/);
});
