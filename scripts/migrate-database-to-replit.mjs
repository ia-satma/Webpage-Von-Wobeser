#!/usr/bin/env node
import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import pg from "pg";
import { Client as AppStorageClient } from "@replit/object-storage";
import {
  getPostgresConnectionConfig,
  isReplitInternalHost,
  redactedDatabaseIdentity,
} from "../shared/postgres-config.mjs";

const execFileAsync = promisify(execFile);
const MAGIC = Buffer.from("VWBDB001", "ascii");
const BACKUP_PREFIX = "von-wobeser/private/database-backups";
const DEFAULT_DIR = path.join(os.tmpdir(), "von-wobeser-database-migration");

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Configura ${name} en Replit Secrets.`);
  return value;
}

function databaseUrlFor(role) {
  return role === "source"
    ? requiredEnv("SOURCE_DATABASE_URL")
    : requiredEnv("DATABASE_URL");
}

export function postgresCliEnvironment(connectionString) {
  const parsed = new URL(connectionString);
  const internal = isReplitInternalHost(parsed.hostname);
  const environment = {
    ...process.env,
    PGHOST: parsed.hostname,
    PGPORT: parsed.port || "5432",
    PGUSER: decodeURIComponent(parsed.username),
    PGPASSWORD: decodeURIComponent(parsed.password),
    PGDATABASE: decodeURIComponent(parsed.pathname.replace(/^\//, "")),
    PGSSLMODE: internal ? "disable" : "verify-full",
  };

  // libpq no siempre consulta el almacén de certificados del sistema por
  // defecto. En Replit esto provoca que pg_dump/pg_restore busquen
  // ~/.postgresql/root.crt aunque Node pueda validar la misma conexión. La
  // opción `system` conserva verify-full y usa las CA confiables del sistema.
  if (internal) delete environment.PGSSLROOTCERT;
  else environment.PGSSLROOTCERT = "system";

  return environment;
}

function safeFilename(label = "snapshot") {
  const clean = label.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `von-wobeser-${clean || "snapshot"}-${stamp}.dump.enc`;
}

function sha256(contents) {
  return crypto.createHash("sha256").update(contents).digest("hex");
}

function encryptionKey(salt) {
  const secret = requiredEnv("DB_BACKUP_ENCRYPTION_KEY");
  if (secret.length < 24) throw new Error("DB_BACKUP_ENCRYPTION_KEY debe tener al menos 24 caracteres.");
  return crypto.scryptSync(secret, salt, 32);
}

export async function encryptBackup(sourcePath, destinationPath) {
  const plaintext = await fs.readFile(sourcePath);
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(salt), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([MAGIC, salt, iv, encrypted, tag]);
  await fs.writeFile(destinationPath, payload, { mode: 0o600 });
  return { bytes: payload.length, sha256: sha256(payload) };
}

export async function decryptBackup(sourcePath, destinationPath) {
  const payload = await fs.readFile(sourcePath);
  if (payload.length < MAGIC.length + 16 + 12 + 16 || !payload.subarray(0, MAGIC.length).equals(MAGIC)) {
    throw new Error("El respaldo no tiene el formato cifrado esperado.");
  }
  const saltStart = MAGIC.length;
  const ivStart = saltStart + 16;
  const bodyStart = ivStart + 12;
  const tagStart = payload.length - 16;
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    encryptionKey(payload.subarray(saltStart, ivStart)),
    payload.subarray(ivStart, bodyStart),
  );
  decipher.setAuthTag(payload.subarray(tagStart));
  const plaintext = Buffer.concat([
    decipher.update(payload.subarray(bodyStart, tagStart)),
    decipher.final(),
  ]);
  await fs.writeFile(destinationPath, plaintext, { mode: 0o600 });
}

async function withClient(connectionString, callback) {
  const client = new pg.Client({
    ...getPostgresConnectionConfig(connectionString, { readOnly: true }),
    statement_timeout: 120_000,
  });
  await client.connect();
  try {
    return await callback(client);
  } finally {
    await client.end();
  }
}

function quoteIdentifier(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

async function catalogSnapshot(connectionString, includeCounts = true) {
  return withClient(connectionString, async (client) => {
    const [{ version, database_size: databaseSize }] = (await client.query(
      "select version(), pg_database_size(current_database())::text as database_size",
    )).rows;
    const tables = (await client.query(`
      select schemaname as schema, tablename as name
      from pg_tables where schemaname = 'public' order by tablename
    `)).rows;
    const counts = {};
    if (includeCounts) {
      for (const table of tables) {
        const result = await client.query(
          `select count(*)::text as count from ${quoteIdentifier(table.schema)}.${quoteIdentifier(table.name)}`,
        );
        counts[`${table.schema}.${table.name}`] = result.rows[0].count;
      }
    }
    const columns = (await client.query(`
      select table_schema, table_name, ordinal_position, column_name, data_type,
             is_nullable, coalesce(column_default, '') as column_default
      from information_schema.columns
      where table_schema = 'public'
      order by table_name, ordinal_position
    `)).rows;
    const constraints = (await client.query(`
      select c.conrelid::regclass::text as table_name, c.conname,
             pg_get_constraintdef(c.oid, true) as definition
      from pg_constraint c
      join pg_namespace n on n.oid = c.connamespace
      where n.nspname = 'public'
      order by table_name, c.conname
    `)).rows;
    const indexes = (await client.query(`
      select schemaname, tablename, indexname, indexdef
      from pg_indexes where schemaname = 'public'
      order by tablename, indexname
    `)).rows;
    const sequences = (await client.query(`
      select schemaname, sequencename, coalesce(last_value::text, '') as last_value
      from pg_sequences where schemaname = 'public'
      order by sequencename
    `)).rows;
    const extensions = (await client.query(
      "select extname, extversion from pg_extension order by extname",
    )).rows;
    const migrations = tables.some((table) => table.name === "app_schema_migrations")
      ? (await client.query(
          "select name, sha256 from app_schema_migrations order by name",
        )).rows
      : [];

    return {
      identity: redactedDatabaseIdentity(connectionString),
      version: String(version).split(" on ")[0],
      databaseSize,
      tables,
      counts,
      columns,
      constraints,
      indexes,
      sequences,
      extensions,
      migrations,
    };
  });
}

function fingerprint(value) {
  return sha256(Buffer.from(JSON.stringify(value)));
}

function comparableSnapshot(snapshot) {
  const { identity: _identity, version: _version, databaseSize: _size, ...comparable } = snapshot;
  return comparable;
}

async function audit(role) {
  const snapshot = await catalogSnapshot(databaseUrlFor(role));
  console.log(`[database-migration] Auditoría ${role}:`);
  console.log(JSON.stringify({
    identity: snapshot.identity,
    version: snapshot.version,
    databaseSizeBytes: snapshot.databaseSize,
    tables: snapshot.tables.length,
    totalRows: Object.values(snapshot.counts).reduce((sum, value) => sum + Number(value), 0),
    sequences: snapshot.sequences.length,
    extensions: snapshot.extensions.map((entry) => entry.extname),
    migrations: snapshot.migrations.length,
    catalogSha256: fingerprint(comparableSnapshot(snapshot)),
  }, null, 2));
}

async function uploadEncryptedBackup(filePath, checksum) {
  const bucketId = process.env.REPLIT_APP_STORAGE_BUCKET_ID?.trim();
  const client = new AppStorageClient(bucketId ? { bucketId } : undefined);
  const objectName = `${BACKUP_PREFIX}/${path.basename(filePath)}`;
  const result = await client.uploadFromFilename(objectName, filePath, { compress: false });
  if (!result.ok) throw new Error("App Storage rechazó el respaldo cifrado.");
  const manifest = Buffer.from(JSON.stringify({
    objectName,
    sha256: checksum,
    createdAt: new Date().toISOString(),
    encryption: "AES-256-GCM+scrypt",
  }, null, 2));
  const manifestResult = await client.uploadFromBytes(`${objectName}.sha256.json`, manifest, { compress: false });
  if (!manifestResult.ok) throw new Error("No se pudo guardar el manifiesto del respaldo.");
  return objectName;
}

async function backup(label) {
  const sourceUrl = databaseUrlFor("source");
  const directory = process.env.DB_MIGRATION_BACKUP_DIR?.trim() || DEFAULT_DIR;
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  const encryptedPath = path.join(directory, safeFilename(label));
  const rawPath = `${encryptedPath}.tmp.dump`;
  try {
    await execFileAsync("pg_dump", [
      "--format=custom",
      "--no-owner",
      "--no-acl",
      "--file", rawPath,
    ], { env: postgresCliEnvironment(sourceUrl), maxBuffer: 1024 * 1024 });
    const encrypted = await encryptBackup(rawPath, encryptedPath);
    const objectName = await uploadEncryptedBackup(encryptedPath, encrypted.sha256);
    console.log("[database-migration] Respaldo cifrado y verificado.");
    console.log(JSON.stringify({
      localEncryptedPath: encryptedPath,
      appStorageObject: objectName,
      bytes: encrypted.bytes,
      sha256: encrypted.sha256,
    }, null, 2));
  } finally {
    await fs.rm(rawPath, { force: true });
  }
}

export function assertTargetConfirmation(targetUrl, confirmation) {
  const target = redactedDatabaseIdentity(targetUrl);
  if (!confirmation || confirmation !== target.database) {
    throw new Error(
      `Confirma la base destino con --confirm-target=${target.database}.`,
    );
  }
}

async function restore(filePath, confirmation) {
  if (!filePath) throw new Error("Indica --file=/ruta/al/respaldo.dump.enc");
  const sourceUrl = databaseUrlFor("source");
  const targetUrl = databaseUrlFor("target");
  if (fingerprint(redactedDatabaseIdentity(sourceUrl)) === fingerprint(redactedDatabaseIdentity(targetUrl))) {
    throw new Error("Origen y destino apuntan a la misma base; restauración cancelada.");
  }
  assertTargetConfirmation(targetUrl, confirmation);
  const rawPath = path.join(os.tmpdir(), `vwb-restore-${crypto.randomUUID()}.dump`);
  try {
    await decryptBackup(path.resolve(filePath), rawPath);
    await execFileAsync("pg_restore", [
      "--clean",
      "--if-exists",
      "--single-transaction",
      "--no-owner",
      "--no-acl",
      "--exit-on-error",
      "--dbname", redactedDatabaseIdentity(targetUrl).database,
      rawPath,
    ], { env: postgresCliEnvironment(targetUrl), maxBuffer: 8 * 1024 * 1024 });
    console.log("[database-migration] Restauración transaccional completada.");
  } finally {
    await fs.rm(rawPath, { force: true });
  }
}

async function verify() {
  const sourceUrl = databaseUrlFor("source");
  const targetUrl = databaseUrlFor("target");
  const [source, target] = await Promise.all([
    catalogSnapshot(sourceUrl),
    catalogSnapshot(targetUrl),
  ]);
  const categories = ["tables", "counts", "columns", "constraints", "indexes", "sequences", "extensions", "migrations"];
  const results = categories.map((category) => ({
    category,
    sourceSha256: fingerprint(source[category]),
    targetSha256: fingerprint(target[category]),
  })).map((entry) => ({ ...entry, equal: entry.sourceSha256 === entry.targetSha256 }));
  console.log(JSON.stringify({ source: source.identity, target: target.identity, results }, null, 2));
  if (results.some((entry) => !entry.equal)) {
    throw new Error("La verificación encontró diferencias entre origen y destino.");
  }
  console.log("[database-migration] Verificación exacta aprobada.");
}

function option(name) {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

export async function main() {
  const command = process.argv[2];
  if (command === "audit") {
    const role = process.argv[3];
    if (role !== "source" && role !== "target") {
      throw new Error("Uso: db:replit-migrate audit <source|target>");
    }
    return audit(role);
  }
  if (command === "backup") return backup(option("label") || "snapshot");
  if (command === "restore") return restore(option("file"), option("confirm-target"));
  if (command === "verify") return verify();
  throw new Error(
    "Uso: db:replit-migrate <audit source|target|backup|restore|verify> "
      + "[--file=...] [--label=...] [--confirm-target=base]",
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`[database-migration] ${error instanceof Error ? error.message : "Error desconocido"}`);
    process.exitCode = 1;
  });
}
