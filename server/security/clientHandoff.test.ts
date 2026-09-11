import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import os from "node:os";
import path from "node:path";
import {
  assertPortableObjectName,
  PORTABLE_STORAGE_PREFIX,
  relativePathForObject,
  validatePortableManifest,
} from "../../scripts/handoff-app-storage.mjs";
import {
  classifyDatabase,
  CORE_HANDOFF_TABLES,
  handoffDecision,
  HANDOFF_REQUIRED_SECRETS,
  inspectPackage,
  prepublishSecretsStatus,
  requiredSecretsStatus,
} from "../../scripts/client-handoff.mjs";

// Replit agrega este bloque al archivo de trabajo al vincular App Storage. No
// forma parte del repositorio ni debe confundirse con un bucket versionado.
// Cualquier otra aparición del ID sigue siendo un fallo de seguridad.
function withoutReplitManagedObjectStorage(config: string): string {
  return config.replace(
    /^\[objectStorage\]\r?\ndefaultBucketID\s*=\s*"replit-objstore-[a-f0-9-]+"\r?\n?/im,
    "",
  );
}

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
  assert.doesNotMatch(withoutReplitManagedObjectStorage(replit), /defaultBucketID|replit-objstore-/);
  assert.match(packageJson, /handoff:storage/);
  assert.match(packageJson, /handoff:private/);
  assert.match(packageJson, /handoff:legacy-archive/);
  assert.match(packageJson, /handoff:status/);
  assert.match(packageJson, /handoff:install/);
  assert.match(packageJson, /start:workspace/);
  assert.match(packageJson, /handoff:readiness/);
  assert.match(packageJson, /media:migrate-private/);
  assert.match(packageJson, /security:retire-legacy-users/);
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
  assert.match(guide, /von-wobeser\/private\/legacy-archive/);
  assert.match(guide, /handoff:readiness/);
  assert.match(guide, /handoff:install/);
  assert.match(guide, /ready_to_restore/);
  assert.match(guide, /Repl limpio/i);
  assert.match(guide, /no.*GitHub/is);
  assert.match(guide, /MFA_ENCRYPTION_KEY/);
  assert.match(guide, /retire-legacy-users/);
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
  assert.match(source, /practiceGroups < 18/);
  assert.match(source, /teamMembers < 142/);
  assert.match(source, /legacyPlaintextUsersTablePresent/);
  assert.match(source, /mfaEncryptionKeyConfigured/);
  assert.match(source, /privilegedMfaRequired/);
  assert.match(source, /legacyArchivePages < 108/);
  assert.match(source, /legacyArchiveManifestMatchesDatabase/);
  assert.match(source, /select exists\(select 1 from admin_users where lower\(email\)/i);
  assert.match(source, /legacyUsersTable\.rows\[0\]\.present/);
  assert.doesNotMatch(source, /case when to_regclass\('public\.users'\)[\s\S]*from public\.users/i);
  assert.doesNotMatch(source, /select\s+(?:first_name|last_name|cv_original_name)/i);
});

test("el detector distingue una base nueva, parcial, pendiente y lista", () => {
  assert.equal(classifyDatabase({ tables: [] }), "empty");
  assert.equal(classifyDatabase({ tables: ["admin_users"] }), "partial");
  assert.equal(
    classifyDatabase({ tables: CORE_HANDOFF_TABLES, appliedMigrations: [], expectedMigrations: ["20260812_0003_canonical_attorney_content.mjs"] }),
    "needs_migration",
  );
  assert.equal(
    classifyDatabase({ tables: CORE_HANDOFF_TABLES, appliedMigrations: ["20260812_0003_canonical_attorney_content.mjs"], expectedMigrations: ["20260812_0003_canonical_attorney_content.mjs"] }),
    "ready",
  );
});

test("el instalador exige Secrets, paquete y App Storage antes de restaurar", () => {
  const secrets = requiredSecretsStatus({
    DATABASE_URL: "postgresql://example",
    ADMIN_EMAIL: "owner@example.com",
  });
  assert.deepEqual(secrets.missing, ["ADMIN_BOOTSTRAP_PASSWORD", "DB_BACKUP_ENCRYPTION_KEY", "MFA_ENCRYPTION_KEY", "MFA_REQUIRED_FOR_PRIVILEGED"]);
  assert.deepEqual(HANDOFF_REQUIRED_SECRETS, ["DATABASE_URL", "ADMIN_EMAIL", "ADMIN_BOOTSTRAP_PASSWORD", "DB_BACKUP_ENCRYPTION_KEY", "MFA_ENCRYPTION_KEY", "MFA_REQUIRED_FOR_PRIVILEGED"]);
  assert.equal(handoffDecision({
    database: { state: "empty" },
    secrets,
    packageStatus: { complete: true },
    appStorage: { state: "available" },
  }).state, "needs_secrets");
  assert.equal(handoffDecision({
    database: { state: "empty" },
    secrets: { missing: [] },
    packageStatus: { complete: true },
    appStorage: { state: "available" },
  }).state, "ready_to_restore");
  assert.equal(handoffDecision({
    database: { state: "partial" },
    secrets: { missing: [] },
    packageStatus: { complete: true },
    appStorage: { state: "available" },
  }).state, "manual_review_required");
});

test("la entrega no acepta una configuración MFA vacía, inválida o desactivada", () => {
  const base = {
    DATABASE_URL: "postgresql://example",
    ADMIN_EMAIL: "owner@example.com",
    ADMIN_BOOTSTRAP_PASSWORD: "password",
    DB_BACKUP_ENCRYPTION_KEY: "backup-key",
  };
  assert.deepEqual(requiredSecretsStatus({
    ...base,
    MFA_ENCRYPTION_KEY: "not-32-bytes",
    MFA_REQUIRED_FOR_PRIVILEGED: "false",
  }).missing, ["MFA_ENCRYPTION_KEY", "MFA_REQUIRED_FOR_PRIVILEGED"]);
  assert.deepEqual(requiredSecretsStatus({
    ...base,
    MFA_ENCRYPTION_KEY: Buffer.alloc(32, 9).toString("base64"),
    MFA_REQUIRED_FOR_PRIVILEGED: "true",
  }).missing, []);
});

test("el diagnóstico enumera los Secrets de publicación sin exponer valores", () => {
  const status = prepublishSecretsStatus({
    SESSION_SECRET: "s".repeat(32),
    OPENAI_API_KEY: "configured-on-the-client",
  });
  assert.deepEqual(status.missingBeforePublish, ["SITE_URL"]);
  assert.deepEqual(status.recommendedSecurity, ["PRIVACY_HASH_KEY", "NEWSLETTER_UNSUBSCRIBE_SECRET"]);
  assert.equal(status.ai.configured, true);
  assert.equal(status.ai.imageGenerationConfigured, true);
  assert.deepEqual(status.doNotCopyFromSource, ["SOURCE_DATABASE_URL", "MIGRATION_READ_ONLY", "ADMIN_RESET_PASSWORD"]);
  assert.deepEqual(status.targetManagedResources, ["DATABASE_URL", "REPLIT_APP_STORAGE_BUCKET_ID"]);
});

test("la detección exige un paquete completo, pero no lee Secrets", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "vwb-handoff-package-"));
  try {
    await fs.mkdir(path.join(directory, "database"));
    await fs.mkdir(path.join(directory, "app-storage"));
    await fs.mkdir(path.join(directory, "private-documents"));
    await fs.mkdir(path.join(directory, "legacy-archive"));
    await fs.writeFile(path.join(directory, "database", "snapshot.dump.enc"), Buffer.concat([
      Buffer.from("VWBDB001", "ascii"), Buffer.alloc(48),
    ]));
    const manifest = `${JSON.stringify({ version: 1, prefix: PORTABLE_STORAGE_PREFIX, createdAt: "2026-08-12T00:00:00.000Z", objects: [] }, null, 2)}\n`;
    await fs.writeFile(path.join(directory, "app-storage", "app-storage-manifest.json"), manifest);
    await fs.writeFile(path.join(directory, "app-storage", "app-storage-manifest.sha256"), `${crypto.createHash("sha256").update(manifest).digest("hex")}\n`);
    await fs.writeFile(path.join(directory, "private-documents", "private-documents-manifest.enc"), "placeholder");
    await fs.writeFile(path.join(directory, "private-documents", "private-documents-manifest.sha256"), "a".repeat(64));
    await fs.writeFile(path.join(directory, "legacy-archive", "legacy-archive-manifest.enc"), "placeholder");
    await fs.writeFile(path.join(directory, "legacy-archive", "legacy-archive-manifest.sha256"), "a".repeat(64));
    const inspected = await inspectPackage(directory);
    assert.equal(inspected.complete, true);
    assert.equal(inspected.state, "complete");
    assert.equal(inspected.legacyArchive, true);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("un Repl vacío sirve el bootstrap de handoff en lugar de ejecutar migraciones", async () => {
  const [deployment, workspace, bootstrap] = await Promise.all([
    fs.readFile(path.join(process.cwd(), "scripts", "start-deploy.mjs"), "utf8"),
    fs.readFile(path.join(process.cwd(), "scripts", "start-workspace.mjs"), "utf8"),
    fs.readFile(path.join(process.cwd(), "scripts", "handoff-bootstrap-server.mjs"), "utf8"),
  ]);
  assert.match(deployment, /inspectDatabase/);
  assert.match(deployment, /handoff-bootstrap-server/);
  assert.match(workspace, /db:migrate/);
  assert.match(workspace, /handoff-bootstrap-server/);
  assert.match(bootstrap, /Tools → Secrets/);
  assert.match(bootstrap, /noindex/);
});
