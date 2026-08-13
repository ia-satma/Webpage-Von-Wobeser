#!/usr/bin/env node
import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import pg from "pg";
import { Client as AppStorageClient } from "@replit/object-storage";
import { getPostgresConnectionConfig } from "../shared/postgres-config.mjs";
import { validatePortableManifest, validatePortablePackage } from "./handoff-app-storage.mjs";
import { validatePrivatePackage } from "./handoff-private-documents.mjs";
import { decryptBackup } from "./migrate-database-to-replit.mjs";

export const HANDOFF_REQUIRED_SECRETS = [
  "DATABASE_URL",
  "ADMIN_EMAIL",
  "ADMIN_BOOTSTRAP_PASSWORD",
  "DB_BACKUP_ENCRYPTION_KEY",
];

export const CORE_HANDOFF_TABLES = [
  "admin_users",
  "site_config",
  "team_members",
  "practice_groups",
  "industry_groups",
  "career_applications",
  "app_schema_migrations",
];

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DB_BACKUP_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*\.dump\.enc$/;
const PUBLIC_MANIFEST = "app-storage-manifest.json";
const PUBLIC_CHECKSUM = "app-storage-manifest.sha256";
const PRIVATE_MANIFEST = "private-documents-manifest.enc";
const PRIVATE_CHECKSUM = "private-documents-manifest.sha256";

function option(name) {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

function normalizedEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function databaseName(databaseUrl) {
  try {
    return decodeURIComponent(new URL(databaseUrl).pathname.replace(/^\//, ""));
  } catch {
    return "";
  }
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function exists(filename) {
  try {
    await fs.access(filename);
    return true;
  } catch {
    return false;
  }
}

async function migrationNames() {
  const directory = path.join(ROOT, "migrations");
  return (await fs.readdir(directory))
    .filter((name) => /^\d+_[a-z0-9_]+\.(?:sql|mjs)$/i.test(name))
    .sort();
}

/**
 * Esta clasificación es deliberadamente conservadora: una base parcialmente
 * inicializada jamás se restaura de forma automática. Solo una base sin tablas
 * de la aplicación puede pasar por el instalador de handoff.
 */
export function classifyDatabase({ tables = [], appliedMigrations = [], expectedMigrations = [] } = {}) {
  const tableSet = new Set(tables);
  if (tableSet.size === 0) return "empty";
  if (CORE_HANDOFF_TABLES.some((table) => !tableSet.has(table))) return "partial";
  const applied = new Set(appliedMigrations);
  if (expectedMigrations.some((migration) => !applied.has(migration))) return "needs_migration";
  return "ready";
}

export function requiredSecretsStatus(environment = process.env) {
  const present = HANDOFF_REQUIRED_SECRETS.filter((name) => String(environment[name] || "").trim());
  const missing = HANDOFF_REQUIRED_SECRETS.filter((name) => !present.includes(name));
  return { present, missing };
}

export function handoffDecision({ database, secrets, packageStatus, appStorage }) {
  if (database.state === "unavailable") {
    return database.configured
      ? { state: "needs_database_connection", next: "La Database está configurada, pero no se pudo consultar; revisa su vínculo y abre un Shell nuevo." }
      : { state: "needs_database", next: "Crea o vincula la Database del Repl y vuelve a ejecutar el diagnóstico." };
  }
  if (database.state === "empty") {
    if (secrets.missing.length) {
      return { state: "needs_secrets", next: "Configura los Secrets indicados desde Replit → Tools → Secrets." };
    }
    if (!packageStatus.complete) {
      return { state: "needs_package", next: "Carga el paquete cifrado .handoff por un canal privado, fuera de Git." };
    }
    if (appStorage.state !== "available") {
      return { state: "needs_app_storage", next: "Crea o vincula App Storage en la cuenta del cliente." };
    }
    return { state: "ready_to_restore", next: "Ejecuta npm run handoff:install con las dos confirmaciones." };
  }
  if (database.state === "partial") {
    return { state: "manual_review_required", next: "La base no está vacía pero tampoco es una instalación completa; no se restauró nada." };
  }
  if (database.state === "needs_migration") {
    return { state: "migration_required", next: "La base ya contiene datos; aplica npm run db:migrate y vuelve a revisar." };
  }
  return { state: "ready", next: "La instalación tiene esquema y migraciones vigentes." };
}

export async function inspectDatabase(databaseUrl = process.env.DATABASE_URL, ownerEmail = process.env.ADMIN_EMAIL) {
  if (!databaseUrl) {
    return { state: "unavailable", configured: false, name: "", tables: 0, appliedMigrations: 0, ownerPresent: false };
  }
  const expectedMigrations = await migrationNames();
  const client = new pg.Client({
    ...getPostgresConnectionConfig(databaseUrl, { readOnly: true }),
    statement_timeout: 15_000,
  });
  try {
    await client.connect();
    const tables = (await client.query(
      "select tablename from pg_tables where schemaname = 'public' order by tablename",
    )).rows.map((row) => row.tablename);
    const tableSet = new Set(tables);
    const appliedMigrations = tableSet.has("app_schema_migrations")
      ? (await client.query("select name from app_schema_migrations order by name")).rows.map((row) => row.name)
      : [];
    const coreCounts = {};
    for (const table of ["admin_users", "site_config", "team_members", "practice_groups", "industry_groups"]) {
      if (!tableSet.has(table)) continue;
      const result = await client.query(`select count(*)::int as count from ${table}`);
      coreCounts[table] = result.rows[0].count;
    }
    let ownerPresent = false;
    const expectedOwner = normalizedEmail(ownerEmail);
    if (expectedOwner && tableSet.has("admin_users")) {
      const result = await client.query(
        "select exists(select 1 from admin_users where lower(email) = $1) as present",
        [expectedOwner],
      );
      ownerPresent = Boolean(result.rows[0].present);
    }
    return {
      state: classifyDatabase({ tables, appliedMigrations, expectedMigrations }),
      configured: true,
      name: databaseName(databaseUrl),
      tables: tables.length,
      appliedMigrations: appliedMigrations.length,
      expectedMigrations: expectedMigrations.length,
      coreCounts,
      ownerPresent,
    };
  } catch {
    return { state: "unavailable", configured: true, name: databaseName(databaseUrl), tables: 0, appliedMigrations: 0, ownerPresent: false };
  } finally {
    await client.end().catch(() => undefined);
  }
}

export async function inspectPackage(directory) {
  const root = path.resolve(directory);
  if (!(await exists(root))) {
    return { complete: false, state: "absent", database: false, publicMedia: false, privateDocuments: false };
  }

  let database = false;
  try {
    const files = (await fs.readdir(path.join(root, "database")))
      .filter((name) => DB_BACKUP_PATTERN.test(name));
    if (files.length === 1) {
      const backup = await fs.readFile(path.join(root, "database", files[0]));
      database = backup.length > 48 && backup.subarray(0, 8).equals(Buffer.from("VWBDB001", "ascii"));
    }
  } catch {
    database = false;
  }

  let publicMedia = false;
  try {
    const [manifest, expected] = await Promise.all([
      fs.readFile(path.join(root, "app-storage", PUBLIC_MANIFEST), "utf8"),
      fs.readFile(path.join(root, "app-storage", PUBLIC_CHECKSUM), "utf8"),
    ]);
    if (/^[a-f0-9]{64}\s*$/i.test(expected) && sha256(manifest) === expected.trim().toLowerCase()) {
      validatePortableManifest(JSON.parse(manifest));
      publicMedia = true;
    }
  } catch {
    publicMedia = false;
  }

  const privateDocuments = await Promise.all([
    exists(path.join(root, "private-documents", PRIVATE_MANIFEST)),
    exists(path.join(root, "private-documents", PRIVATE_CHECKSUM)),
  ]).then((checks) => checks.every(Boolean));

  return {
    complete: database && publicMedia && privateDocuments,
    state: database && publicMedia && privateDocuments ? "complete" : (database || publicMedia || privateDocuments ? "incomplete" : "absent"),
    database,
    publicMedia,
    privateDocuments,
  };
}

async function inspectAppStorage() {
  try {
    const bucketId = process.env.REPLIT_APP_STORAGE_BUCKET_ID?.trim();
    const client = new AppStorageClient(bucketId ? { bucketId } : undefined);
    const result = await client.list({ prefix: "von-wobeser/", maxResults: 1 });
    return { state: result.ok ? "available" : "unavailable" };
  } catch {
    return { state: "unavailable" };
  }
}

export async function getHandoffStatus(directory = option("directory") || ".handoff") {
  const [database, packageStatus, appStorage] = await Promise.all([
    inspectDatabase(),
    inspectPackage(directory),
    inspectAppStorage(),
  ]);
  const secrets = requiredSecretsStatus();
  return {
    mode: "complete_client_handoff",
    decision: handoffDecision({ database, secrets, packageStatus, appStorage }),
    database,
    package: packageStatus,
    appStorage,
    secrets: {
      missingForInstall: secrets.missing,
      configuredForInstall: secrets.present,
      optionalForAgents: ["OPENAI_API_KEY", "OPENAI_IMAGE_API_KEY", "AI_MONTHLY_BUDGET_USD"].filter(
        (name) => !String(process.env[name] || "").trim(),
      ),
    },
    safeOwnerConfigured: Boolean(normalizedEmail(process.env.ADMIN_EMAIL)),
  };
}

function confirmationError(status, directory) {
  if (status.database.state !== "empty") {
    return "La restauración solo está permitida sobre una Database sin tablas de aplicación. No se modificó nada.";
  }
  if (status.secrets.missingForInstall.length) {
    return `Faltan Secrets de instalación: ${status.secrets.missingForInstall.join(", ")}. Configúralos en Replit → Tools → Secrets.`;
  }
  if (!status.package.complete) {
    return `El paquete ${path.resolve(directory)} no está completo o no pasó su validación local.`;
  }
  if (status.appStorage.state !== "available") {
    return "App Storage no está vinculado o no se puede consultar desde este Repl.";
  }
  const confirmation = option("confirm-database");
  if (!status.database.name || confirmation !== status.database.name) {
    return `Confirma la Database nueva con --confirm-database=${status.database.name || "NOMBRE"}.`;
  }
  const ownerConfirmation = normalizedEmail(option("confirm-owner-email"));
  if (!ownerConfirmation || ownerConfirmation !== normalizedEmail(process.env.ADMIN_EMAIL)) {
    return "Confirma el Dueño configurado en Secrets con --confirm-owner-email=correo.";
  }
  return "";
}

function runNode(script, args = [], nodeOptions = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [...nodeOptions, path.join(ROOT, script), ...args], {
      cwd: ROOT,
      stdio: "inherit",
      env: process.env,
    });
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${script} terminó con código ${String(code)}.`));
    });
  });
}

async function validateEncryptedBackup(backup) {
  const temporary = path.join(os.tmpdir(), `vwb-handoff-validate-${crypto.randomUUID()}.dump`);
  try {
    await decryptBackup(backup, temporary);
  } finally {
    await fs.rm(temporary, { force: true });
  }
}

async function install(directory) {
  const status = await getHandoffStatus(directory);
  const error = confirmationError(status, directory);
  if (error) throw new Error(error);

  const root = path.resolve(directory);
  const backupFiles = (await fs.readdir(path.join(root, "database"))).filter((name) => DB_BACKUP_PATTERN.test(name));
  const backup = path.join(root, "database", backupFiles[0]);
  const database = status.database.name;
  const owner = normalizedEmail(process.env.ADMIN_EMAIL);

  console.log("[handoff-install] Validando los tres paquetes antes de escribir en el destino...");
  await Promise.all([
    validateEncryptedBackup(backup),
    validatePortablePackage(path.join(root, "app-storage")),
    validatePrivatePackage(path.join(root, "private-documents")),
  ]);
  console.log("[handoff-install] Restaurando base cifrada en la Database confirmada...");
  await runNode("scripts/migrate-database-to-replit.mjs", [
    "restore",
    `--file=${backup}`,
    `--confirm-target=${database}`,
  ]);
  console.log("[handoff-install] Aplicando migraciones versionadas...");
  await runNode("scripts/run-migrations.mjs");
  console.log("[handoff-install] Restaurando medios públicos...");
  await runNode("scripts/handoff-app-storage.mjs", [
    "import",
    `--directory=${path.join(root, "app-storage")}`,
    "--confirm-prefix=von-wobeser/public",
  ]);
  console.log("[handoff-install] Restaurando documentos privados cifrados...");
  await runNode("scripts/handoff-private-documents.mjs", [
    "import",
    `--directory=${path.join(root, "private-documents")}`,
    "--confirm-prefix=von-wobeser/private/cvs",
  ]);
  console.log("[handoff-install] Verificando o creando únicamente el Dueño del cliente...");
  await runNode("scripts/bootstrap-client-owner.ts", [`--confirm=${owner}`], ["--import", "tsx"]);
  console.log("[handoff-install] Ejecutando revisión final sin datos personales...");
  await runNode("scripts/verify-client-handoff.mjs", [
    `--confirm-database=${database}`,
    `--owner-email=${owner}`,
  ]);
  console.log("[handoff-install] Entrega restaurada. Ahora puedes ejecutar o republicar el Repl.");
}

function usage() {
  console.log("Uso: npm run handoff:status -- [--directory=.handoff]");
  console.log("     npm run handoff:install -- --directory=.handoff --confirm-database=NOMBRE --confirm-owner-email=correo");
}

export async function main() {
  const command = process.argv[2] || "status";
  const directory = option("directory") || ".handoff";
  if (command === "status") {
    const status = await getHandoffStatus(directory);
    console.log("[handoff-status] Diagnóstico sin Secrets ni datos personales:");
    console.log(JSON.stringify(status, null, 2));
    return;
  }
  if (command === "install") return install(directory);
  usage();
  throw new Error("Comando de handoff no reconocido.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`[handoff] ${error instanceof Error ? error.message : "No se pudo completar la entrega."}`);
    process.exitCode = 1;
  });
}
