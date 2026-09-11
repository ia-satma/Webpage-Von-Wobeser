import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import { Client as AppStorageClient } from "@replit/object-storage";
import { getPostgresConnectionConfig } from "@shared/postgres-config.mjs";
import { LEGACY_PUBLICATION_PDF_PATHS } from "@shared/legacyPublicationAssets";
import { managedMediaObjectName, persistentMediaStorageStatus } from "../server/media/persistentMedia";
import { PRIVATE_LEGACY_ARCHIVE_PREFIX, assertPrivateLegacyArchiveObjectName } from "./handoff-legacy-archive.mjs";

type ArchiveEntry = {
  localPath: string;
  objectName: string;
  publicPath?: string;
  bytes: number;
  sha256: string;
};

type ArchiveManifest = {
  version: 1;
  publicDocuments: ArchiveEntry[];
  privateHtml: ArchiveEntry[];
};

const ROOT = path.resolve(process.cwd());
const ARCHIVE_DIR = path.join(ROOT, "legacy-archive");
const MANIFEST_PATH = path.join(ARCHIVE_DIR, "manifest.json");
const MARKER_KEY = "legacy_platform_archive_manifest_sha256";

function digest(bytes: Buffer): string {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function assertManifest(value: unknown): ArchiveManifest {
  const manifest = value as ArchiveManifest;
  if (!manifest || manifest.version !== 1 || !Array.isArray(manifest.publicDocuments) || !Array.isArray(manifest.privateHtml)) {
    throw new Error("El manifiesto local del archivo histórico no es válido.");
  }
  if (manifest.publicDocuments.length !== Object.keys(LEGACY_PUBLICATION_PDF_PATHS).length || manifest.privateHtml.length !== 108) {
    throw new Error("El manifiesto local no contiene los 9 PDFs y las 108 páginas históricas esperadas.");
  }
  const expectedPublicPaths = new Set(Object.values(LEGACY_PUBLICATION_PDF_PATHS));
  const seenPublicPaths = new Set<string>();
  for (const entry of manifest.publicDocuments) {
    if (!entry.publicPath || !expectedPublicPaths.has(entry.publicPath) || managedMediaObjectName(entry.publicPath) !== entry.objectName) {
      throw new Error("El manifiesto contiene una ruta pública de PDF no autorizada.");
    }
    seenPublicPaths.add(entry.publicPath);
  }
  if (seenPublicPaths.size !== expectedPublicPaths.size) throw new Error("El manifiesto no contiene todas las rutas públicas aprobadas.");
  for (const entry of manifest.privateHtml) assertPrivateLegacyArchiveObjectName(entry.objectName);
  for (const entry of [...manifest.publicDocuments, ...manifest.privateHtml]) {
    if (!entry.localPath || !/^[a-f0-9]{64}$/i.test(entry.sha256) || !Number.isSafeInteger(entry.bytes) || entry.bytes < 1) {
      throw new Error("El manifiesto contiene un objeto sin checksum verificable.");
    }
  }
  return manifest;
}

async function markerFor(url: string | undefined, readOnly: boolean): Promise<string | null> {
  if (!url) return null;
  const client = new pg.Client(getPostgresConnectionConfig(url, { readOnly }));
  await client.connect();
  try {
    const result = await client.query<{ value: string | null }>("SELECT value FROM site_config WHERE key = $1", [MARKER_KEY]);
    return result.rows[0]?.value?.trim() || null;
  } finally {
    await client.end();
  }
}

async function verifyRemoteObject(storage: AppStorageClient, entry: ArchiveEntry): Promise<void> {
  const local = path.resolve(ROOT, entry.localPath);
  if (!local.startsWith(`${ARCHIVE_DIR}${path.sep}`)) throw new Error(`Ruta local no autorizada: ${entry.localPath}`);
  const localBytes = await fs.readFile(local);
  if (localBytes.length !== entry.bytes || digest(localBytes) !== entry.sha256) {
    throw new Error(`Checksum local inválido: ${entry.localPath}`);
  }
  const remote = await storage.downloadAsBytes(entry.objectName, { decompress: false });
  if (!remote.ok) throw new Error(`No se pudo verificar ${entry.objectName} en App Storage.`);
  const remoteBytes = Buffer.from(remote.value[0]);
  if (remoteBytes.length !== entry.bytes || digest(remoteBytes) !== entry.sha256) {
    throw new Error(`Checksum remoto inválido: ${entry.objectName}`);
  }
}

async function writeMarker(hash: string): Promise<void> {
  const databaseUrl = process.env.DATABASE_MIGRATION_URL || process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_MIGRATION_URL o DATABASE_URL es necesario para reconciliar el archivo histórico.");
  const client = new pg.Client(getPostgresConnectionConfig(databaseUrl));
  await client.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO site_config (key, value, value_es, type, category, description, updated_at)
       VALUES ($1, $2, $2, 'text', 'internal', 'Checksum del manifiesto privado de migración del sitio retirado.', now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, value_es = EXCLUDED.value_es, updated_at = now()`,
      [MARKER_KEY, hash],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

async function main(): Promise<void> {
  const manifestBytes = await fs.readFile(MANIFEST_PATH);
  const manifest = assertManifest(JSON.parse(manifestBytes.toString("utf8")));
  const hash = digest(manifestBytes);
  const runtimeUrl = process.env.DATABASE_APP_URL || process.env.DATABASE_URL;
  if (await markerFor(runtimeUrl, true) === hash) {
    console.log(JSON.stringify({ mode: "already-reconciled", objects: 118 }, null, 2));
    return;
  }

  const status = await persistentMediaStorageStatus();
  if (!status.available || status.provider !== "replit_app_storage") {
    throw new Error("App Storage de Replit debe estar disponible para reconciliar el archivo histórico.");
  }
  const bucketId = process.env.REPLIT_APP_STORAGE_BUCKET_ID?.trim();
  const storage = new AppStorageClient(bucketId ? { bucketId } : undefined);
  const privateManifest: ArchiveEntry = {
    localPath: "legacy-archive/manifest.json",
    objectName: `${PRIVATE_LEGACY_ARCHIVE_PREFIX}/manifest.json`,
    bytes: manifestBytes.length,
    sha256: hash,
  };
  assertPrivateLegacyArchiveObjectName(privateManifest.objectName);
  const entries = [...manifest.publicDocuments, ...manifest.privateHtml, privateManifest];
  for (const [index, entry] of entries.entries()) {
    await verifyRemoteObject(storage, entry);
    console.log(`[legacy-reconcile] App Storage ${index + 1}/${entries.length} verificado.`);
  }
  await writeMarker(hash);
  if (await markerFor(runtimeUrl, true) !== hash) {
    throw new Error("La base del runtime no expone la marca verificada del manifiesto histórico.");
  }
  console.log(JSON.stringify({ mode: "verified-and-reconciled", objects: entries.length }, null, 2));
}

main().catch((error) => {
  console.error(`[legacy-reconcile] ${error instanceof Error ? error.message : "Error desconocido"}`);
  process.exitCode = 1;
});
