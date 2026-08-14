import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import {
  privateCvObjectName,
  privateCvStoragePathFromObjectName,
} from "../media/privateDocuments";
import {
  PRIVATE_DOCUMENT_PREFIX,
  assertPrivateDocumentObjectName,
  decryptPrivatePayload,
  encryptPrivatePayload,
  validatePrivateManifest,
} from "../../scripts/handoff-private-documents.mjs";
import { readRouteSources } from "./routeTestSources";

test("las rutas de CV privadas aceptan solo nombres físicos aleatorios", () => {
  const filename = `${"a".repeat(32)}.pdf`;
  const objectName = privateCvObjectName(`private:cvs/${filename}`);
  assert.equal(objectName, `${PRIVATE_DOCUMENT_PREFIX}/${filename}`);
  assert.equal(privateCvStoragePathFromObjectName(objectName), `private:cvs/${filename}`);
  assert.equal(assertPrivateDocumentObjectName(objectName), objectName);
  assert.equal(privateCvObjectName("private:cvs/curriculum-alejandro.pdf"), null);
  assert.throws(() => assertPrivateDocumentObjectName(`${PRIVATE_DOCUMENT_PREFIX}/../secret.pdf`));
});

test("el paquete privado cifra y autentica el contenido", () => {
  const previous = process.env.DB_BACKUP_ENCRYPTION_KEY;
  process.env.DB_BACKUP_ENCRYPTION_KEY = "clave-de-prueba-privada-con-32-caracteres";
  try {
    const original = Buffer.from("documento privado de prueba");
    const encrypted = encryptPrivatePayload(original);
    assert.notDeepEqual(encrypted, original);
    assert.deepEqual(decryptPrivatePayload(encrypted), original);

    const tampered = Buffer.from(encrypted);
    tampered[tampered.length - 1] ^= 1;
    assert.throws(() => decryptPrivatePayload(tampered));
  } finally {
    if (previous === undefined) delete process.env.DB_BACKUP_ENCRYPTION_KEY;
    else process.env.DB_BACKUP_ENCRYPTION_KEY = previous;
  }
});

test("el manifiesto privado exige nombres, hashes y archivos únicos", () => {
  const entry = {
    name: `${PRIVATE_DOCUMENT_PREFIX}/${"b".repeat(32)}.docx`,
    file: `${"b".repeat(32)}.docx.enc`,
    bytes: 123,
    encryptedBytes: 200,
    sha256: "a".repeat(64),
    encryptedSha256: "b".repeat(64),
  };
  const manifest = {
    version: 1,
    prefix: PRIVATE_DOCUMENT_PREFIX,
    createdAt: "2026-08-03T00:00:00.000Z",
    objects: [entry],
  };
  assert.equal(validatePrivateManifest(manifest), manifest);
  assert.throws(() => validatePrivateManifest({ ...manifest, objects: [entry, entry] }), /duplicado/i);
});

test("la ruta de solicitudes persiste y recupera CV privados", async () => {
  const routes = readRouteSources();
  const migration = await fs.readFile(
    path.join(process.cwd(), "scripts", "migrate-private-cvs-to-app-storage.ts"),
    "utf8",
  );
  assert.match(routes, /persistPrivateCvFile/);
  assert.match(routes, /openPersistentPrivateCvStream/);
  assert.match(routes, /deletePersistentPrivateCv/);
  assert.match(routes, /requirePermission\("career_applications"\)/);
  assert.match(migration, /VWB_PERSISTENT_MEDIA_REQUIRED/);
  assert.match(migration, /private:cvs\//);
  assert.doesNotMatch(migration, /console\.(?:log|error)\([^\n]*(?:email|name|originalName)/i);
});
