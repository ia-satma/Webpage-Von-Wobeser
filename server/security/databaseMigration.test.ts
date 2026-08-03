import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  getPostgresConnectionConfig,
  isReplitInternalHost,
  redactedDatabaseIdentity,
} from "../../shared/postgres-config.mjs";
import { isMigrationReadOnlyEnabled, migrationReadOnlyGuard } from "../database/maintenance";
import { compileSqlTemplate } from "../../scripts/lib/postgres-sql.mjs";
import {
  assertBackupObjectName,
  assertPgDumpCompatibility,
  assertTargetConfirmation,
  compatibleRestoreSqlLine,
  decryptBackup,
  encryptBackup,
  postgresMajorFromVersion,
  postgresCliEnvironment,
} from "../../scripts/migrate-database-to-replit.mjs";

test("Helium y los hosts locales explícitos nunca fuerzan TLS", () => {
  assert.equal(isReplitInternalHost("helium"), true);
  assert.equal(isReplitInternalHost("postgres"), true);
  const helium = getPostgresConnectionConfig(
    "postgresql://user:pass@helium/db?sslmode=require&sslcert=legacy",
  );
  assert.equal(helium.ssl, false);
  assert.doesNotMatch(helium.connectionString, /sslmode|sslcert/);
  assert.deepEqual(
    getPostgresConnectionConfig("postgresql://user:pass@database.example.replit.com/db").ssl,
    { rejectUnauthorized: true },
  );
});

test("una base externa siempre valida TLS y no conserva parámetros que lo degraden", () => {
  const config = getPostgresConnectionConfig(
    "postgresql://user:secret@external.example.com:5432/app?sslmode=disable&sslcert=bad",
  );
  assert.deepEqual(config.ssl, { rejectUnauthorized: true });
  assert.doesNotMatch(config.connectionString, /sslmode|sslcert/);
  assert.equal(redactedDatabaseIdentity(config.connectionString).host, "external.example.com");
  assert.doesNotMatch(JSON.stringify(redactedDatabaseIdentity(config.connectionString)), /secret/);
});

test("pg_dump usa las CA del sistema para bases externas y omite TLS en Helium", () => {
  const external = postgresCliEnvironment(
    "postgresql://user:secret@external.example.com:5432/app",
  );
  assert.equal(external.PGSSLMODE, "verify-full");
  assert.equal(external.PGSSLROOTCERT, "system");

  const previousRootCert = process.env.PGSSLROOTCERT;
  process.env.PGSSLROOTCERT = "/tmp/legacy-root.crt";
  try {
    const helium = postgresCliEnvironment("postgresql://user:secret@helium/app");
    assert.equal(helium.PGSSLMODE, "disable");
    assert.equal(helium.PGSSLROOTCERT, undefined);
  } finally {
    if (previousRootCert === undefined) delete process.env.PGSSLROOTCERT;
    else process.env.PGSSLROOTCERT = previousRootCert;
  }
});

test("el respaldo exige un pg_dump igual o más nuevo que el servidor", () => {
  assert.equal(postgresMajorFromVersion("PostgreSQL 18.4 (df16b3c)"), 18);
  assert.equal(postgresMajorFromVersion("pg_dump (PostgreSQL) 18.1"), 18);
  assert.doesNotThrow(() => assertPgDumpCompatibility(
    "PostgreSQL 18.4 (df16b3c)",
    "pg_dump (PostgreSQL) 18.1",
  ));
  assert.throws(() => assertPgDumpCompatibility(
    "PostgreSQL 18.4 (df16b3c)",
    "pg_dump (PostgreSQL) 16.3",
  ), /postgresql_18/i);
});

test("la restauración desde App Storage solo admite respaldos privados esperados", () => {
  const objectName = "von-wobeser/private/database-backups/snapshot.dump.enc";
  assert.equal(assertBackupObjectName(objectName), objectName);
  assert.throws(() => assertBackupObjectName("generated-images/image.png"), /database-backups/i);
  assert.throws(() => assertBackupObjectName("von-wobeser/private/database-backups/../secret.dump.enc"));
  assert.throws(() => assertBackupObjectName("von-wobeser/private/database-backups/snapshot.sql"));
});

test("la restauración elimina únicamente el ajuste de PostgreSQL 18 incompatible con Helium 16", () => {
  assert.equal(compatibleRestoreSqlLine("SET transaction_timeout = 0;"), null);
  assert.equal(compatibleRestoreSqlLine("  SET transaction_timeout = 0;  "), null);
  assert.equal(compatibleRestoreSqlLine("SET statement_timeout = 0;"), "SET statement_timeout = 0;");
  assert.equal(compatibleRestoreSqlLine("select 1;"), "select 1;");
});

test("la conexión rechaza protocolos no PostgreSQL", () => {
  assert.throws(() => getPostgresConnectionConfig("https://example.com/database"), /postgres/i);
});

test("el adaptador SQL conserva valores como parámetros, nunca como texto ejecutable", () => {
  const malicious = "x'; drop table news; --";
  const strings = Object.assign(["select * from news where title = ", ""], {
    raw: ["select * from news where title = ", ""],
  });
  const compiled = compileSqlTemplate(strings as unknown as TemplateStringsArray, [malicious]);
  assert.equal(compiled.text, "select * from news where title = $1");
  assert.deepEqual(compiled.values, [malicious]);
  assert.doesNotMatch(compiled.text, /drop table/);
});

test("el respaldo cifrado recupera cada byte y rechaza una clave incorrecta", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "vwb-db-backup-test-"));
  const source = path.join(directory, "source.dump");
  const encrypted = path.join(directory, "source.dump.enc");
  const restored = path.join(directory, "restored.dump");
  const previous = process.env.DB_BACKUP_ENCRYPTION_KEY;
  process.env.DB_BACKUP_ENCRYPTION_KEY = "test-only-migration-key-32-characters";
  try {
    const bytes = Buffer.concat([Buffer.from("PGDMP"), Buffer.from(Array.from({ length: 512 }, (_, i) => i % 256))]);
    await fs.writeFile(source, bytes);
    const result = await encryptBackup(source, encrypted);
    assert.equal(result.sha256.length, 64);
    assert.notDeepEqual(await fs.readFile(encrypted), bytes);
    await decryptBackup(encrypted, restored);
    assert.deepEqual(await fs.readFile(restored), bytes);

    process.env.DB_BACKUP_ENCRYPTION_KEY = "different-test-only-key-32-characters";
    await assert.rejects(() => decryptBackup(encrypted, restored));
  } finally {
    if (previous === undefined) delete process.env.DB_BACKUP_ENCRYPTION_KEY;
    else process.env.DB_BACKUP_ENCRYPTION_KEY = previous;
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("el mantenimiento permite lectura y bloquea toda escritura con 503", () => {
  const original = process.env.MIGRATION_READ_ONLY;
  process.env.MIGRATION_READ_ONLY = "true";
  try {
    assert.equal(isMigrationReadOnlyEnabled(), true);
    let continued = false;
    migrationReadOnlyGuard({ method: "GET" } as any, {} as any, () => { continued = true; });
    assert.equal(continued, true);

    const state: { status?: number; body?: any; headers: Record<string, string> } = { headers: {} };
    const response = {
      setHeader(name: string, value: string) { state.headers[name] = value; },
      getHeader(name: string) { return name === "X-Request-Id" ? "request-test" : undefined; },
      status(value: number) { state.status = value; return this; },
      json(value: any) { state.body = value; return this; },
    };
    migrationReadOnlyGuard({ method: "POST" } as any, response as any, () => {
      throw new Error("POST no debe continuar");
    });
    assert.equal(state.status, 503);
    assert.equal(state.body.code, "MIGRATION_READ_ONLY");
    assert.equal(state.headers["Retry-After"], "300");
  } finally {
    if (original === undefined) delete process.env.MIGRATION_READ_ONLY;
    else process.env.MIGRATION_READ_ONLY = original;
  }
});

test("la aplicación y sus scripts no dependen del cliente HTTP de un proveedor", async () => {
  const forbiddenPackage = ["@neon", "database/serverless"].join("");
  const roots = ["server", "scripts", "shared", "script"];
  const offenders: string[] = [];
  async function visit(relative: string): Promise<void> {
    const absolute = path.join(process.cwd(), relative);
    const entries = await fs.readdir(absolute, { withFileTypes: true });
    for (const entry of entries) {
      const child = path.join(relative, entry.name);
      if (entry.isDirectory()) await visit(child);
      else if (/\.(?:ts|mjs|js)$/.test(entry.name) && !child.endsWith("databaseMigration.test.ts")) {
        const source = await fs.readFile(path.join(process.cwd(), child), "utf8");
        if (source.includes(forbiddenPackage) || source.includes("drizzle-orm/neon-http")) offenders.push(child);
      }
    }
  }
  for (const root of roots) await visit(root);
  assert.deepEqual(offenders, []);
});

test("la herramienta usa respaldos custom y restauración de una sola transacción", async () => {
  const source = await fs.readFile(
    path.join(process.cwd(), "scripts/migrate-database-to-replit.mjs"),
    "utf8",
  );
  assert.match(source, /--format=custom/);
  assert.match(source, /--single-transaction/);
  assert.match(source, /ON_ERROR_STOP=1/);
  assert.match(source, /transaction_timeout/);
  assert.match(source, /AES-256-GCM\+scrypt/);
  assert.match(source, /uploadFromFilename/);
  assert.match(source, /downloadToFilename/);
  assert.match(source, /downloadAsText/);
  assert.match(source, /confirm-target/);
  const replitConfig = await fs.readFile(path.join(process.cwd(), ".replit"), "utf8");
  assert.match(replitConfig, /postgresql_18/);
});

test("una restauración exige confirmar exactamente la base destino", () => {
  const target = "postgresql://user:secret@helium/replit_production";
  assert.doesNotThrow(() => assertTargetConfirmation(target, "replit_production"));
  assert.throws(() => assertTargetConfirmation(target, "otra_base"), /confirm-target/);
  assert.throws(() => assertTargetConfirmation(target, undefined), /confirm-target/);
});

test("el modo mantenimiento evita seeds y procesos de fondo además de bloquear HTTP", async () => {
  const [routes, mirror, index] = await Promise.all([
    fs.readFile(path.join(process.cwd(), "server/routes.ts"), "utf8"),
    fs.readFile(path.join(process.cwd(), "server/mirror/index.ts"), "utf8"),
    fs.readFile(path.join(process.cwd(), "server/index.ts"), "utf8"),
  ]);
  assert.match(routes, /!isMigrationReadOnlyEnabled\(\)/);
  assert.match(mirror, /!isMigrationReadOnlyEnabled\(\)/);
  assert.match(index, /Database migration maintenance active/);
});
