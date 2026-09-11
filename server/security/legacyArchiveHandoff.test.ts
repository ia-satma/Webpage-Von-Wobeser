import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  PRIVATE_LEGACY_ARCHIVE_PREFIX,
  assertPrivateLegacyArchiveObjectName,
  validateLegacyArchivePackageManifest,
} from "../../scripts/handoff-legacy-archive.mjs";
import { LEGACY_PUBLICATION_PDF_PATHS, isLegacyPublicationPdfPath } from "@shared/legacyPublicationAssets";

test("el archivo histórico privado admite sólo manifiesto y páginas con hash", () => {
  const page = `${PRIVATE_LEGACY_ARCHIVE_PREFIX}/pages/${"a".repeat(64)}.html`;
  assert.equal(assertPrivateLegacyArchiveObjectName(page), page);
  assert.equal(assertPrivateLegacyArchiveObjectName(`${PRIVATE_LEGACY_ARCHIVE_PREFIX}/manifest.json`), `${PRIVATE_LEGACY_ARCHIVE_PREFIX}/manifest.json`);
  assert.throws(() => assertPrivateLegacyArchiveObjectName(`${PRIVATE_LEGACY_ARCHIVE_PREFIX}/pages/../../secret.html`));
  assert.throws(() => assertPrivateLegacyArchiveObjectName(`${PRIVATE_LEGACY_ARCHIVE_PREFIX}/page.html`));
});

test("el manifiesto histórico exige manifiesto privado, hashes y objetos únicos", () => {
  const manifest = {
    version: 1,
    createdAt: "2026-09-10T00:00:00.000Z",
    prefix: PRIVATE_LEGACY_ARCHIVE_PREFIX,
    objects: [
      { name: `${PRIVATE_LEGACY_ARCHIVE_PREFIX}/manifest.json`, bytes: 2, sha256: crypto.createHash("sha256").update("{}").digest("hex") },
      { name: `${PRIVATE_LEGACY_ARCHIVE_PREFIX}/pages/${"b".repeat(64)}.html`, bytes: 12, sha256: "a".repeat(64) },
    ],
  };
  assert.equal(validateLegacyArchivePackageManifest(manifest), manifest);
  assert.throws(() => validateLegacyArchivePackageManifest({ ...manifest, objects: [manifest.objects[1]] }), /Falta el manifiesto/i);
  assert.throws(() => validateLegacyArchivePackageManifest({ ...manifest, objects: [manifest.objects[0], manifest.objects[0]] }), /duplicado/i);
});

test("las nueve rutas públicas de PDFs son rutas locales administradas", () => {
  const paths = Object.values(LEGACY_PUBLICATION_PDF_PATHS);
  assert.equal(paths.length, 9);
  assert.equal(new Set(paths).size, 9);
  for (const path of paths) {
    assert.match(path, /^\/uploads\/legacy-publications\/[a-z0-9-]+\.pdf$/);
    assert.equal(isLegacyPublicationPdfPath(path), true);
  }
  assert.equal(isLegacyPublicationPdfPath("https://www.vonwobeser.com/images/PDF/file.pdf"), false);
});
