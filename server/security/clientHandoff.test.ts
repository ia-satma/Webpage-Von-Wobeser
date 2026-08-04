import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import {
  assertPortableObjectName,
  PORTABLE_STORAGE_PREFIX,
  relativePathForObject,
  validatePortableManifest,
} from "../../scripts/handoff-app-storage.mjs";

test("el paquete de App Storage solo acepta medios públicos administrados", () => {
  const objectName = `${PORTABLE_STORAGE_PREFIX}/uploads/imagen-2026.webp`;
  assert.equal(assertPortableObjectName(objectName), objectName);
  assert.equal(relativePathForObject(objectName), "uploads/imagen-2026.webp");
  assert.throws(() => assertPortableObjectName("von-wobeser/private/database-backups/db.dump.enc"));
  assert.throws(() => assertPortableObjectName(`${PORTABLE_STORAGE_PREFIX}/../secret.txt`));
  assert.throws(() => assertPortableObjectName(`${PORTABLE_STORAGE_PREFIX}/uploads/a\\b.png`));
});

test("el manifiesto portable exige hashes, tamaños y nombres únicos", () => {
  const entry = {
    name: `${PORTABLE_STORAGE_PREFIX}/generated-images/example.png`,
    bytes: 123,
    sha256: "a".repeat(64),
  };
  const valid = {
    version: 1,
    prefix: PORTABLE_STORAGE_PREFIX,
    createdAt: "2026-08-03T00:00:00.000Z",
    objects: [entry],
  };
  assert.equal(validatePortableManifest(valid), valid);
  assert.throws(() => validatePortableManifest({ ...valid, objects: [entry, entry] }), /duplicado/i);
  assert.throws(() => validatePortableManifest({
    ...valid,
    objects: [{ ...entry, sha256: "no-es-un-hash" }],
  }), /SHA-256/);
});

test("el repositorio no versiona paquetes de entrega ni IDs de bucket", async () => {
  const [gitignore, replit, packageJson] = await Promise.all([
    fs.readFile(path.join(process.cwd(), ".gitignore"), "utf8"),
    fs.readFile(path.join(process.cwd(), ".replit"), "utf8"),
    fs.readFile(path.join(process.cwd(), "package.json"), "utf8"),
  ]);
  assert.match(gitignore, /^\.handoff\/$/m);
  assert.doesNotMatch(replit, /defaultBucketID|replit-objstore-/);
  assert.match(packageJson, /handoff:storage/);
  assert.match(packageJson, /handoff:private/);
  assert.match(packageJson, /handoff:readiness/);
  assert.match(packageJson, /media:migrate-private/);
});

test("la entrega por GitHub está documentada sin copiar Secrets ni DATABASE_URL", async () => {
  const guide = await fs.readFile(
    path.join(process.cwd(), "docs", "CLIENT_REPLIT_HANDOFF.md"),
    "utf8",
  );
  assert.match(guide, /importa.*GitHub/is);
  assert.match(guide, /App Storage/);
  assert.match(guide, /backup-current/);
  assert.match(guide, /OPENAI_API_KEY/);
  assert.match(guide, /von-wobeser\/private\/cvs/);
  assert.match(guide, /handoff:readiness/);
  assert.match(guide, /Repl limpio/i);
  assert.match(guide, /no.*GitHub/is);
});

test("la auditoría de entrega exige datos y medios sin imprimir información personal", async () => {
  const source = await fs.readFile(
    path.join(process.cwd(), "scripts", "verify-client-handoff.mjs"),
    "utf8",
  );
  assert.match(source, /confirm-database/);
  assert.match(source, /publicObjects < 1/);
  assert.match(source, /legacyCvReferences > 0/);
  assert.match(source, /missingPrivateCvRecords > 0/);
  assert.doesNotMatch(source, /select\s+(?:email|first_name|last_name|cv_original_name)/i);
});
