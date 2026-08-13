#!/usr/bin/env node
import "dotenv/config";
import crypto from "node:crypto";
import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Client as AppStorageClient } from "@replit/object-storage";

export const PORTABLE_STORAGE_PREFIX = "von-wobeser/public";
const MANIFEST_FILENAME = "app-storage-manifest.json";
const CHECKSUM_FILENAME = "app-storage-manifest.sha256";
const MANIFEST_VERSION = 1;
const PAGE_SIZE = 1000;
const MAX_OBJECTS = 100_000;

function storageClient() {
  const bucketId = process.env.REPLIT_APP_STORAGE_BUCKET_ID?.trim();
  return new AppStorageClient(bucketId ? { bucketId } : undefined);
}

function option(name) {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

function requiredDirectory() {
  const value = option("directory")?.trim();
  if (!value) throw new Error("Indica --directory=/ruta/del/paquete.");
  return path.resolve(value);
}

function sha256(contents) {
  return crypto.createHash("sha256").update(contents).digest("hex");
}

async function sha256File(filename) {
  const hash = crypto.createHash("sha256");
  for await (const chunk of createReadStream(filename)) hash.update(chunk);
  return hash.digest("hex");
}

export function assertPortableObjectName(objectName) {
  const normalized = String(objectName || "").trim();
  const prefix = `${PORTABLE_STORAGE_PREFIX}/`;
  if (
    !normalized.startsWith(prefix)
    || normalized.includes("\\")
    || normalized.includes("\0")
  ) {
    throw new Error(`El objeto no pertenece a ${prefix}.`);
  }
  const relative = normalized.slice(prefix.length);
  const segments = relative.split("/");
  if (
    !relative
    || segments.some((segment) => !segment || segment === "." || segment === "..")
    || !segments.every((segment) => /^[A-Za-z0-9._+-]+$/.test(segment))
  ) {
    throw new Error(`Ruta de objeto no portable: ${normalized}`);
  }
  return normalized;
}

export function relativePathForObject(objectName) {
  const safeName = assertPortableObjectName(objectName);
  return safeName.slice(`${PORTABLE_STORAGE_PREFIX}/`.length);
}

function localObjectPath(directory, objectName) {
  const relative = relativePathForObject(objectName);
  const candidate = path.resolve(directory, "objects", ...relative.split("/"));
  const root = `${path.resolve(directory, "objects")}${path.sep}`;
  if (!candidate.startsWith(root)) throw new Error("La ruta local saldría del paquete.");
  return candidate;
}

async function listAllObjects(client) {
  const objects = [];
  let startOffset;
  for (;;) {
    const result = await client.list({
      prefix: `${PORTABLE_STORAGE_PREFIX}/`,
      maxResults: PAGE_SIZE,
      ...(startOffset ? { startOffset } : {}),
    });
    if (!result.ok) throw new Error("No se pudo listar App Storage.");
    const page = result.value
      .map((item) => assertPortableObjectName(item.name))
      .filter((name) => !startOffset || name >= startOffset);
    objects.push(...page);
    if (objects.length > MAX_OBJECTS) {
      throw new Error(`La exportación supera el máximo de ${MAX_OBJECTS} objetos.`);
    }
    if (result.value.length < PAGE_SIZE) break;
    const lastName = result.value.at(-1)?.name;
    if (!lastName) break;
    startOffset = `${lastName}\0`;
  }
  return [...new Set(objects)].sort();
}

function serializedManifest(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export function validatePortableManifest(manifest) {
  if (!manifest || typeof manifest !== "object") throw new Error("Manifiesto inválido.");
  if (manifest.version !== MANIFEST_VERSION) throw new Error("Versión de manifiesto no compatible.");
  if (manifest.prefix !== PORTABLE_STORAGE_PREFIX) throw new Error("Prefijo de manifiesto inválido.");
  if (!Array.isArray(manifest.objects) || manifest.objects.length > MAX_OBJECTS) {
    throw new Error("Lista de objetos inválida.");
  }
  const names = new Set();
  for (const entry of manifest.objects) {
    if (!entry || typeof entry !== "object") throw new Error("Entrada de manifiesto inválida.");
    const name = assertPortableObjectName(entry.name);
    if (names.has(name)) throw new Error(`Objeto duplicado en el manifiesto: ${name}`);
    names.add(name);
    if (!Number.isSafeInteger(entry.bytes) || entry.bytes < 0) {
      throw new Error(`Tamaño inválido para ${name}.`);
    }
    if (!/^[a-f0-9]{64}$/i.test(entry.sha256 || "")) {
      throw new Error(`SHA-256 inválido para ${name}.`);
    }
  }
  return manifest;
}

async function readManifest(directory) {
  const manifestPath = path.join(directory, MANIFEST_FILENAME);
  const checksumPath = path.join(directory, CHECKSUM_FILENAME);
  const [contents, expected] = await Promise.all([
    fs.readFile(manifestPath, "utf8"),
    fs.readFile(checksumPath, "utf8"),
  ]);
  if (!/^[a-f0-9]{64}\s*$/i.test(expected) || sha256(contents) !== expected.trim().toLowerCase()) {
    throw new Error("El checksum del manifiesto no coincide.");
  }
  return validatePortableManifest(JSON.parse(contents));
}

async function assertEmptyExportDirectory(directory) {
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  const entries = await fs.readdir(directory);
  if (entries.length) {
    throw new Error("La carpeta de exportación debe estar vacía para evitar mezclar entregas.");
  }
}

async function verifyLocalFiles(directory, manifest) {
  for (const entry of manifest.objects) {
    const filename = localObjectPath(directory, entry.name);
    const stat = await fs.stat(filename);
    if (!stat.isFile() || stat.size !== entry.bytes) {
      throw new Error(`Tamaño local incorrecto: ${entry.name}`);
    }
    if (await sha256File(filename) !== entry.sha256.toLowerCase()) {
      throw new Error(`SHA-256 local incorrecto: ${entry.name}`);
    }
  }
}

/** Valida manifiesto y objetos locales antes de escribir en App Storage. */
export async function validatePortablePackage(directory) {
  const manifest = await readManifest(directory);
  await verifyLocalFiles(directory, manifest);
  return manifest;
}

async function exportStorage(directory) {
  await assertEmptyExportDirectory(directory);
  const client = storageClient();
  const names = await listAllObjects(client);
  const objects = [];
  for (const [index, name] of names.entries()) {
    const filename = localObjectPath(directory, name);
    await fs.mkdir(path.dirname(filename), { recursive: true, mode: 0o700 });
    const result = await client.downloadToFilename(name, filename, { decompress: false });
    if (!result.ok) throw new Error(`No se pudo exportar ${name}.`);
    const stat = await fs.stat(filename);
    objects.push({ name, bytes: stat.size, sha256: await sha256File(filename) });
    console.log(`[handoff-storage] Exportado ${index + 1}/${names.length}: ${name}`);
  }
  const manifest = {
    version: MANIFEST_VERSION,
    createdAt: new Date().toISOString(),
    prefix: PORTABLE_STORAGE_PREFIX,
    objects,
  };
  const contents = serializedManifest(manifest);
  await Promise.all([
    fs.writeFile(path.join(directory, MANIFEST_FILENAME), contents, { mode: 0o600 }),
    fs.writeFile(path.join(directory, CHECKSUM_FILENAME), `${sha256(contents)}\n`, { mode: 0o600 }),
  ]);
  console.log(`[handoff-storage] Exportación completa: ${objects.length} objetos.`);
}

async function verifyRemoteObject(client, entry) {
  const temporary = path.join(os.tmpdir(), `vwb-handoff-${crypto.randomUUID()}`);
  try {
    const result = await client.downloadToFilename(entry.name, temporary, { decompress: false });
    if (!result.ok) throw new Error(`No se pudo verificar ${entry.name} en App Storage.`);
    const stat = await fs.stat(temporary);
    if (stat.size !== entry.bytes || await sha256File(temporary) !== entry.sha256.toLowerCase()) {
      throw new Error(`El objeto importado no coincide: ${entry.name}`);
    }
  } finally {
    await fs.rm(temporary, { force: true });
  }
}

async function importStorage(directory, verifyOnly = false) {
  const manifest = await validatePortablePackage(directory);
  const client = storageClient();
  for (const [index, entry] of manifest.objects.entries()) {
    if (!verifyOnly) {
      const result = await client.uploadFromFilename(
        entry.name,
        localObjectPath(directory, entry.name),
        { compress: false },
      );
      if (!result.ok) throw new Error(`No se pudo importar ${entry.name}.`);
    }
    await verifyRemoteObject(client, entry);
    console.log(`[handoff-storage] ${verifyOnly ? "Verificado" : "Importado"} ${index + 1}/${manifest.objects.length}: ${entry.name}`);
  }
  console.log(`[handoff-storage] ${verifyOnly ? "Verificación" : "Importación"} completa: ${manifest.objects.length} objetos.`);
}

export async function main() {
  const command = process.argv[2];
  const directory = requiredDirectory();
  if (command === "export") return exportStorage(directory);
  if (command === "import") {
    if (option("confirm-prefix") !== PORTABLE_STORAGE_PREFIX) {
      throw new Error(`Confirma el destino con --confirm-prefix=${PORTABLE_STORAGE_PREFIX}.`);
    }
    return importStorage(directory, false);
  }
  if (command === "verify") return importStorage(directory, true);
  throw new Error(
    "Uso: handoff:storage <export|import|verify> --directory=/ruta "
      + `[--confirm-prefix=${PORTABLE_STORAGE_PREFIX}]`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`[handoff-storage] ${error instanceof Error ? error.message : "Error desconocido"}`);
    process.exitCode = 1;
  });
}
