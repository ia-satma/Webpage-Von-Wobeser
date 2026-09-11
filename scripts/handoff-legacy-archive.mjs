#!/usr/bin/env node
import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Client as AppStorageClient } from "@replit/object-storage";
import { decryptPrivatePayload, encryptPrivatePayload } from "./handoff-private-documents.mjs";

export const PRIVATE_LEGACY_ARCHIVE_PREFIX = "von-wobeser/private/legacy-archive";
const MANIFEST_FILENAME = "legacy-archive-manifest.enc";
const CHECKSUM_FILENAME = "legacy-archive-manifest.sha256";
const MANIFEST_VERSION = 1;
const MAX_OBJECTS = 1_000;

function option(name) {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

function requiredDirectory() {
  const value = option("directory")?.trim();
  if (!value) throw new Error("Indica --directory=/ruta/del-archivo-historico.");
  return path.resolve(value);
}

function sha256(contents) {
  return crypto.createHash("sha256").update(contents).digest("hex");
}

export function assertPrivateLegacyArchiveObjectName(objectName) {
  const normalized = String(objectName || "").trim();
  const prefix = `${PRIVATE_LEGACY_ARCHIVE_PREFIX}/`;
  if (!normalized.startsWith(prefix) || normalized.includes("\\") || normalized.includes("\0")) {
    throw new Error("Objeto fuera del prefijo de archivo histórico autorizado.");
  }
  const relative = normalized.slice(prefix.length);
  if (relative !== "manifest.json" && !/^pages\/[a-f0-9]{64}\.html$/.test(relative)) {
    throw new Error("Nombre de objeto histórico privado no válido.");
  }
  return normalized;
}

export function validateLegacyArchivePackageManifest(manifest) {
  if (!manifest || typeof manifest !== "object" || manifest.version !== MANIFEST_VERSION || manifest.prefix !== PRIVATE_LEGACY_ARCHIVE_PREFIX) {
    throw new Error("Manifiesto de archivo histórico inválido.");
  }
  if (!Array.isArray(manifest.objects) || manifest.objects.length < 1 || manifest.objects.length > MAX_OBJECTS) {
    throw new Error("Lista de archivo histórico inválida.");
  }
  const names = new Set();
  for (const entry of manifest.objects) {
    const name = assertPrivateLegacyArchiveObjectName(entry?.name);
    if (names.has(name)) throw new Error("Objeto histórico privado duplicado.");
    names.add(name);
    if (!Number.isSafeInteger(entry?.bytes) || entry.bytes < 1 || !/^[a-f0-9]{64}$/.test(entry?.sha256 || "")) {
      throw new Error("Metadatos de archivo histórico inválidos.");
    }
  }
  if (!names.has(`${PRIVATE_LEGACY_ARCHIVE_PREFIX}/manifest.json`)) {
    throw new Error("Falta el manifiesto histórico privado.");
  }
  return manifest;
}

function client() {
  const bucketId = process.env.REPLIT_APP_STORAGE_BUCKET_ID?.trim();
  return new AppStorageClient(bucketId ? { bucketId } : undefined);
}

async function listObjects(storage) {
  const result = await storage.list({ prefix: `${PRIVATE_LEGACY_ARCHIVE_PREFIX}/` });
  if (!result.ok) throw new Error("No se pudo listar el archivo histórico privado en App Storage.");
  if (result.value.length > MAX_OBJECTS) throw new Error("Demasiados objetos en el archivo histórico privado.");
  return result.value.map((item) => assertPrivateLegacyArchiveObjectName(item.name)).sort();
}

function encryptedObjectPath(directory, objectName) {
  const relative = assertPrivateLegacyArchiveObjectName(objectName).slice(`${PRIVATE_LEGACY_ARCHIVE_PREFIX}/`.length);
  return path.join(directory, "objects", `${relative}.enc`);
}

async function assertEmptyDirectory(directory) {
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  if ((await fs.readdir(directory)).length) throw new Error("La carpeta del paquete histórico debe estar vacía.");
}

async function exportArchive(directory) {
  await assertEmptyDirectory(directory);
  const storage = client();
  const names = await listObjects(storage);
  const objects = [];
  for (const [index, name] of names.entries()) {
    const result = await storage.downloadAsBytes(name, { decompress: false });
    if (!result.ok) throw new Error("No se pudo descargar un objeto del archivo histórico privado.");
    const plaintext = result.value[0];
    const filename = encryptedObjectPath(directory, name);
    await fs.mkdir(path.dirname(filename), { recursive: true, mode: 0o700 });
    await fs.writeFile(filename, encryptPrivatePayload(plaintext), { mode: 0o600 });
    objects.push({ name, bytes: plaintext.length, sha256: sha256(plaintext) });
    console.log(`[handoff-legacy] Protegido ${index + 1}/${names.length}.`);
  }
  const manifest = Buffer.from(JSON.stringify({
    version: MANIFEST_VERSION,
    createdAt: new Date().toISOString(),
    prefix: PRIVATE_LEGACY_ARCHIVE_PREFIX,
    objects,
  }));
  const encryptedManifest = encryptPrivatePayload(manifest);
  await Promise.all([
    fs.writeFile(path.join(directory, MANIFEST_FILENAME), encryptedManifest, { mode: 0o600 }),
    fs.writeFile(path.join(directory, CHECKSUM_FILENAME), `${sha256(encryptedManifest)}\n`, { mode: 0o600 }),
  ]);
  console.log(`[handoff-legacy] Exportación cifrada completa: ${objects.length} objetos.`);
}

async function readManifest(directory) {
  const [encrypted, checksum] = await Promise.all([
    fs.readFile(path.join(directory, MANIFEST_FILENAME)),
    fs.readFile(path.join(directory, CHECKSUM_FILENAME), "utf8"),
  ]);
  if (!/^[a-f0-9]{64}\s*$/i.test(checksum) || sha256(encrypted) !== checksum.trim().toLowerCase()) {
    throw new Error("El checksum del manifiesto histórico privado no coincide.");
  }
  return validateLegacyArchivePackageManifest(JSON.parse(decryptPrivatePayload(encrypted).toString("utf8")));
}

/** Valida el paquete local antes de escribir en App Storage. */
export async function validateLegacyArchivePackage(directory) {
  const manifest = await readManifest(directory);
  for (const entry of manifest.objects) {
    const plaintext = decryptPrivatePayload(await fs.readFile(encryptedObjectPath(directory, entry.name)));
    if (plaintext.length !== entry.bytes || sha256(plaintext) !== entry.sha256) {
      throw new Error("Un archivo histórico local no coincide.");
    }
  }
  return manifest;
}

async function verifyRemote(storage, entry) {
  const temporary = path.join(os.tmpdir(), `vwb-legacy-${crypto.randomUUID()}`);
  try {
    const result = await storage.downloadToFilename(entry.name, temporary, { decompress: false });
    if (!result.ok) throw new Error("No se pudo verificar un objeto histórico privado.");
    const contents = await fs.readFile(temporary);
    if (contents.length !== entry.bytes || sha256(contents) !== entry.sha256) throw new Error("Un objeto histórico privado no coincide.");
  } finally {
    await fs.rm(temporary, { force: true });
  }
}

async function importOrVerify(directory, verifyOnly) {
  const manifest = await validateLegacyArchivePackage(directory);
  const storage = client();
  for (const [index, entry] of manifest.objects.entries()) {
    const plaintext = decryptPrivatePayload(await fs.readFile(encryptedObjectPath(directory, entry.name)));
    if (!verifyOnly) {
      const result = await storage.uploadFromBytes(entry.name, plaintext, { compress: false });
      if (!result.ok) throw new Error("No se pudo importar un objeto histórico privado.");
    }
    await verifyRemote(storage, entry);
    console.log(`[handoff-legacy] ${verifyOnly ? "Verificado" : "Importado"} ${index + 1}/${manifest.objects.length}.`);
  }
  console.log(`[handoff-legacy] ${verifyOnly ? "Verificación" : "Importación"} completa: ${manifest.objects.length} objetos.`);
}

export async function main() {
  const command = process.argv[2];
  const directory = requiredDirectory();
  if (command === "export") return exportArchive(directory);
  if (command === "import") {
    if (option("confirm-prefix") !== PRIVATE_LEGACY_ARCHIVE_PREFIX) {
      throw new Error(`Confirma el destino con --confirm-prefix=${PRIVATE_LEGACY_ARCHIVE_PREFIX}.`);
    }
    return importOrVerify(directory, false);
  }
  if (command === "verify") return importOrVerify(directory, true);
  throw new Error("Uso: handoff:legacy-archive <export|import|verify> --directory=/ruta [--confirm-prefix=von-wobeser/private/legacy-archive]");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`[handoff-legacy] ${error instanceof Error ? error.message : "Error desconocido"}`);
    process.exitCode = 1;
  });
}
