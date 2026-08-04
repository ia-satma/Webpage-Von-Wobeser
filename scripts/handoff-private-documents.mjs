#!/usr/bin/env node
import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Client as AppStorageClient } from "@replit/object-storage";

export const PRIVATE_DOCUMENT_PREFIX = "von-wobeser/private/cvs";
const MAGIC = Buffer.from("VWBPRV01", "ascii");
const MANIFEST_FILENAME = "private-documents-manifest.enc";
const CHECKSUM_FILENAME = "private-documents-manifest.sha256";
const MANIFEST_VERSION = 1;
const MAX_OBJECTS = 100_000;

function option(name) {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

function requiredDirectory() {
  const value = option("directory")?.trim();
  if (!value) throw new Error("Indica --directory=/ruta/del-paquete-privado.");
  return path.resolve(value);
}

function encryptionKey(salt) {
  const secret = process.env.DB_BACKUP_ENCRYPTION_KEY || "";
  if (secret.length < 24) throw new Error("DB_BACKUP_ENCRYPTION_KEY debe tener al menos 24 caracteres.");
  return crypto.scryptSync(secret, salt, 32);
}

function sha256(contents) {
  return crypto.createHash("sha256").update(contents).digest("hex");
}

export function encryptPrivatePayload(plaintext) {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(salt), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return Buffer.concat([MAGIC, salt, iv, ciphertext, cipher.getAuthTag()]);
}

export function decryptPrivatePayload(payload) {
  if (!Buffer.isBuffer(payload) || payload.length < MAGIC.length + 16 + 12 + 16 || !payload.subarray(0, MAGIC.length).equals(MAGIC)) {
    throw new Error("El archivo privado no tiene el formato cifrado esperado.");
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
  return Buffer.concat([decipher.update(payload.subarray(bodyStart, tagStart)), decipher.final()]);
}

export function assertPrivateDocumentObjectName(objectName) {
  const normalized = String(objectName || "").trim();
  const prefix = `${PRIVATE_DOCUMENT_PREFIX}/`;
  if (!normalized.startsWith(prefix) || normalized.includes("\\") || normalized.includes("\0")) {
    throw new Error("Objeto fuera del prefijo privado autorizado.");
  }
  const filename = normalized.slice(prefix.length);
  if (!/^[a-f0-9]{32}\.(pdf|doc|docx)$/.test(filename)) {
    throw new Error("Nombre de CV privado no válido.");
  }
  return normalized;
}

export function validatePrivateManifest(manifest) {
  if (!manifest || typeof manifest !== "object" || manifest.version !== MANIFEST_VERSION || manifest.prefix !== PRIVATE_DOCUMENT_PREFIX) {
    throw new Error("Manifiesto privado inválido.");
  }
  if (!Array.isArray(manifest.objects) || manifest.objects.length > MAX_OBJECTS) throw new Error("Lista privada inválida.");
  const names = new Set();
  for (const entry of manifest.objects) {
    const name = assertPrivateDocumentObjectName(entry?.name);
    if (names.has(name)) throw new Error("Objeto privado duplicado.");
    names.add(name);
    if (!Number.isSafeInteger(entry?.bytes) || entry.bytes < 0 || !/^[a-f0-9]{64}$/.test(entry?.sha256 || "")) {
      throw new Error("Metadatos privados inválidos.");
    }
  }
  return manifest;
}

function client() {
  const bucketId = process.env.REPLIT_APP_STORAGE_BUCKET_ID?.trim();
  return new AppStorageClient(bucketId ? { bucketId } : undefined);
}

async function listObjects(storage) {
  const result = await storage.list({ prefix: `${PRIVATE_DOCUMENT_PREFIX}/` });
  if (!result.ok) throw new Error("No se pudo listar App Storage privado.");
  if (result.value.length > MAX_OBJECTS) throw new Error("Demasiados documentos privados.");
  return result.value.map((item) => assertPrivateDocumentObjectName(item.name)).sort();
}

function encryptedObjectPath(directory, objectName) {
  const filename = assertPrivateDocumentObjectName(objectName).slice(`${PRIVATE_DOCUMENT_PREFIX}/`.length);
  return path.join(directory, "objects", `${filename}.enc`);
}

async function assertEmptyDirectory(directory) {
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  if ((await fs.readdir(directory)).length) throw new Error("La carpeta del paquete privado debe estar vacía.");
}

async function exportPrivate(directory) {
  await assertEmptyDirectory(directory);
  const storage = client();
  const names = await listObjects(storage);
  const objects = [];
  await fs.mkdir(path.join(directory, "objects"), { recursive: true, mode: 0o700 });
  for (const [index, name] of names.entries()) {
    const result = await storage.downloadAsBytes(name, { decompress: false });
    if (!result.ok) throw new Error("No se pudo descargar un CV privado.");
    const plaintext = result.value[0];
    await fs.writeFile(encryptedObjectPath(directory, name), encryptPrivatePayload(plaintext), { mode: 0o600 });
    objects.push({ name, bytes: plaintext.length, sha256: sha256(plaintext) });
    console.log(`[handoff-private] Protegido ${index + 1}/${names.length}.`);
  }
  const manifest = Buffer.from(JSON.stringify({
    version: MANIFEST_VERSION,
    createdAt: new Date().toISOString(),
    prefix: PRIVATE_DOCUMENT_PREFIX,
    objects,
  }));
  const encryptedManifest = encryptPrivatePayload(manifest);
  await Promise.all([
    fs.writeFile(path.join(directory, MANIFEST_FILENAME), encryptedManifest, { mode: 0o600 }),
    fs.writeFile(path.join(directory, CHECKSUM_FILENAME), `${sha256(encryptedManifest)}\n`, { mode: 0o600 }),
  ]);
  console.log(`[handoff-private] Exportación cifrada completa: ${objects.length} documentos.`);
}

async function readManifest(directory) {
  const [encrypted, checksum] = await Promise.all([
    fs.readFile(path.join(directory, MANIFEST_FILENAME)),
    fs.readFile(path.join(directory, CHECKSUM_FILENAME), "utf8"),
  ]);
  if (!/^[a-f0-9]{64}\s*$/i.test(checksum) || sha256(encrypted) !== checksum.trim().toLowerCase()) {
    throw new Error("El checksum del manifiesto privado no coincide.");
  }
  return validatePrivateManifest(JSON.parse(decryptPrivatePayload(encrypted).toString("utf8")));
}

async function verifyRemote(storage, entry) {
  const temporary = path.join(os.tmpdir(), `vwb-private-${crypto.randomUUID()}`);
  try {
    const result = await storage.downloadToFilename(entry.name, temporary, { decompress: false });
    if (!result.ok) throw new Error("No se pudo verificar un CV privado.");
    const contents = await fs.readFile(temporary);
    if (contents.length !== entry.bytes || sha256(contents) !== entry.sha256) throw new Error("Un CV privado no coincide.");
  } finally {
    await fs.rm(temporary, { force: true });
  }
}

async function importOrVerify(directory, verifyOnly) {
  const manifest = await readManifest(directory);
  const storage = client();
  for (const [index, entry] of manifest.objects.entries()) {
    const plaintext = decryptPrivatePayload(await fs.readFile(encryptedObjectPath(directory, entry.name)));
    if (plaintext.length !== entry.bytes || sha256(plaintext) !== entry.sha256) throw new Error("Un archivo privado local no coincide.");
    if (!verifyOnly) {
      const result = await storage.uploadFromBytes(entry.name, plaintext, { compress: false });
      if (!result.ok) throw new Error("No se pudo importar un CV privado.");
    }
    await verifyRemote(storage, entry);
    console.log(`[handoff-private] ${verifyOnly ? "Verificado" : "Importado"} ${index + 1}/${manifest.objects.length}.`);
  }
  console.log(`[handoff-private] ${verifyOnly ? "Verificación" : "Importación"} completa: ${manifest.objects.length} documentos.`);
}

export async function main() {
  const command = process.argv[2];
  const directory = requiredDirectory();
  if (command === "export") return exportPrivate(directory);
  if (command === "import") {
    if (option("confirm-prefix") !== PRIVATE_DOCUMENT_PREFIX) {
      throw new Error(`Confirma el destino con --confirm-prefix=${PRIVATE_DOCUMENT_PREFIX}.`);
    }
    return importOrVerify(directory, false);
  }
  if (command === "verify") return importOrVerify(directory, true);
  throw new Error("Uso: handoff:private <export|import|verify> --directory=/ruta [--confirm-prefix=von-wobeser/private/cvs]");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`[handoff-private] ${error instanceof Error ? error.message : "Error desconocido"}`);
    process.exitCode = 1;
  });
}
