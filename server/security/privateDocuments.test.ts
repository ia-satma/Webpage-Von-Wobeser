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
  const adminRoutes = await fs.readFile(
    path.join(process.cwd(), "server", "routes", "adminSubmissionRoutes.ts"),
    "utf8",
  );
  const adminPage = await fs.readFile(
    path.join(process.cwd(), "client", "src", "pages", "admin", "AdminSubmissions.tsx"),
    "utf8",
  );
  const privateCvMigration = await fs.readFile(
    path.join(process.cwd(), "migrations", "20260902_0001_career_applications.sql"),
    "utf8",
  );
  const storageMigration = await fs.readFile(
    path.join(process.cwd(), "scripts", "migrate-private-cvs-to-app-storage.ts"),
    "utf8",
  );
  assert.match(routes, /persistPrivateCvFile/);
  assert.match(routes, /privateDocumentStorageStatus/);
  assert.match(routes, /CV_STORAGE_UNAVAILABLE/);
  assert.match(routes, /CAREER_APPLICATIONS_SCHEMA_PENDING/);
  assert.match(routes, /openPersistentPrivateCvStream/);
  assert.match(routes, /deletePersistentPrivateCv/);
  assert.match(routes, /requirePermission\("career_applications"\)/);
  assert.match(privateCvMigration, /CREATE TABLE IF NOT EXISTS career_applications/);
  assert.match(privateCvMigration, /CREATE TABLE IF NOT EXISTS processed_official_sources/);
  assert.match(privateCvMigration, /CREATE UNIQUE INDEX IF NOT EXISTS processed_official_sources_source_url_idx/);
  assert.match(storageMigration, /VWB_PERSISTENT_MEDIA_REQUIRED/);
  assert.match(storageMigration, /private:cvs\//);
  assert.doesNotMatch(storageMigration, /console\.(?:log|error)\([^\n]*(?:email|name|originalName)/i);

  // La descarga no puede servirse desde una URL pública: debe localizar la
  // solicitud, abrir el objeto privado y exigir ambos permisos antes de
  // enviar los bytes. El panel consume la misma lista y apunta al endpoint
  // autenticado, por lo que una candidatura exitosa queda visible y
  // descargable sin exponer su CV al sitio público.
  assert.match(adminRoutes, /getCareerApplications\(\)/);
  assert.match(adminRoutes, /getCareerApplication\(req\.params\.id\)/);
  assert.match(adminRoutes, /openPersistentPrivateCvStream\(application\.cvPath\)/);
  assert.match(adminRoutes, /requirePermission\("career_applications"\)[\s\S]{0,180}requirePermission\("private_downloads"\)/);
  assert.match(adminRoutes, /Content-Disposition/);
  assert.match(adminRoutes, /Cache-Control", "private, no-store/);
  assert.match(adminPage, /\/api\/admin\/career-applications/);
  assert.match(adminPage, /\/api\/admin\/career-applications\/\$\{c\.id\}\/cv/);
  assert.match(adminPage, /has\("private_downloads"\)/);
});
