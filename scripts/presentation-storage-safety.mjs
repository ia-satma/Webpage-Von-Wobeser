#!/usr/bin/env node
import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import pg from "pg";
import { Client as AppStorageClient } from "@replit/object-storage";
import { getPostgresConnectionConfig } from "../shared/postgres-config.mjs";

export const LEGACY_PRESENTATION_PREFIX = "von-wobeser/public/generated-presentations/";
export const QUARANTINE_PRESENTATION_PREFIX = "von-wobeser/quarantine/generated-presentations/";
const PRIVATE_PRESENTATION_PREFIX = "private:generated-presentations/";
const PUBLIC_REFERENCE_PREFIX = "/generated-presentations/";
const ALLOWED_EXTENSIONS = new Set([".pptx", ".pdf", ".png"]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PAGE_SIZE = 1000;
const MAX_OBJECTS = 10_000;
const INVENTORY_VERSION = 1;
const CONFIRM_SCOPE = "generated-presentations-only";

function option(name) {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function canonicalJson(value) {
  return JSON.stringify(value);
}

export function assertLegacyPresentationObjectName(value) {
  const name = String(value || "");
  if (!name.startsWith(LEGACY_PRESENTATION_PREFIX) || name.includes("\\") || name.includes("\0")) {
    throw new Error(`Objeto fuera del prefijo autorizado: ${name || "<vacío>"}`);
  }
  const filename = name.slice(LEGACY_PRESENTATION_PREFIX.length);
  if (!filename || filename.includes("/") || !/^[A-Za-z0-9._+-]+$/.test(filename)) {
    throw new Error(`Nombre de presentación no permitido: ${name}`);
  }
  const extension = path.posix.extname(filename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new Error(`Extensión fuera de alcance: ${name}`);
  }
  return name;
}

export function quarantinePresentationObjectName(sourceName, stamp) {
  const safeSource = assertLegacyPresentationObjectName(sourceName);
  if (!/^\d{4}-\d{2}-\d{2}T\d{6}Z$/.test(stamp)) {
    throw new Error("Fecha de cuarentena inválida.");
  }
  return `${QUARANTINE_PRESENTATION_PREFIX}${stamp}/${safeSource.slice(LEGACY_PRESENTATION_PREFIX.length)}`;
}

function validatePrivateReference(value) {
  if (!value.startsWith(PRIVATE_PRESENTATION_PREFIX)) return false;
  const relative = value.slice(PRIVATE_PRESENTATION_PREFIX.length);
  return new RegExp(`^${UUID_PATTERN.source.slice(1, -1)}/(?:presentation\\.(?:pptx|pdf)|slides/[1-9][0-9]{0,2}\\.png)$`, "i")
    .test(relative);
}

export function legacyObjectNameFromDatabaseReference(value) {
  if (value === null || value === undefined || value === "") return null;
  const reference = String(value);
  if (validatePrivateReference(reference)) return null;
  if (!reference.startsWith(PUBLIC_REFERENCE_PREFIX)) {
    throw new Error("Referencia de presentación inesperada en PostgreSQL.");
  }
  return assertLegacyPresentationObjectName(
    `${LEGACY_PRESENTATION_PREFIX}${reference.slice(PUBLIC_REFERENCE_PREFIX.length)}`,
  );
}

function normalizeDatabaseRows(rows) {
  return rows.map((row) => {
    const refs = [row.pptx_url, row.pdf_url, ...(Array.isArray(row.png_urls) ? row.png_urls : [])]
      .map(legacyObjectNameFromDatabaseReference)
      .filter(Boolean)
      .sort();
    const id = String(row.id || "").toLowerCase();
    if (!UUID_PATTERN.test(id)) throw new Error("ID inesperado en generated_presentations.");
    return {
      id,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
      status: String(row.status || "active"),
      legacyObjects: [...new Set(refs)],
    };
  }).sort((left, right) => left.id.localeCompare(right.id));
}

async function streamObjectMetadata(client, objectName) {
  const hash = crypto.createHash("sha256");
  let bytes = 0;
  const stream = client.downloadAsStream(objectName, { decompress: false });
  for await (const chunk of stream) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.length;
    hash.update(buffer);
  }
  return { bytes, sha256: hash.digest("hex") };
}

async function listLegacyObjectNames(client) {
  const names = [];
  let startOffset;
  for (;;) {
    const result = await client.list({
      prefix: LEGACY_PRESENTATION_PREFIX,
      maxResults: PAGE_SIZE,
      ...(startOffset ? { startOffset } : {}),
    });
    if (!result.ok) throw new Error("App Storage no permitió listar el prefijo de presentaciones.");
    for (const item of result.value) {
      const name = assertLegacyPresentationObjectName(item.name);
      if (!startOffset || name >= startOffset) names.push(name);
    }
    if (names.length > MAX_OBJECTS) throw new Error(`El inventario supera ${MAX_OBJECTS} objetos.`);
    if (result.value.length < PAGE_SIZE) break;
    const lastName = result.value.at(-1)?.name;
    if (!lastName) break;
    startOffset = `${lastName}\0`;
  }
  return [...new Set(names)].sort();
}

function storageClient() {
  const bucketId = process.env.REPLIT_APP_STORAGE_BUCKET_ID?.trim();
  return new AppStorageClient(bucketId ? { bucketId } : undefined);
}

async function generatedPresentationArchiveColumnsExist(client) {
  const result = await client.query(`
    SELECT count(*)::integer AS count
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'generated_presentations'
      AND column_name IN ('status', 'archived_at')
  `);
  return Number(result.rows[0]?.count || 0) === 2;
}

async function readDatabaseRows(readOnly = true) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL es obligatorio.");
  const client = new pg.Client(getPostgresConnectionConfig(databaseUrl, { readOnly }));
  await client.connect();
  try {
    const hasArchiveColumns = await generatedPresentationArchiveColumnsExist(client);
    const result = await client.query(`
      SELECT id, pptx_url, pdf_url, png_urls,
        ${hasArchiveColumns ? "status" : "'active'::text AS status"},
        created_at
      FROM generated_presentations
      ORDER BY id
    `);
    return normalizeDatabaseRows(result.rows);
  } finally {
    await client.end();
  }
}

export function buildPresentationInventoryState(rows, objects) {
  const normalizedObjects = objects.map((entry) => ({
    name: assertLegacyPresentationObjectName(entry.name),
    extension: path.posix.extname(entry.name).toLowerCase(),
    bytes: Number(entry.bytes),
    sha256: String(entry.sha256 || "").toLowerCase(),
    referencedBy: [...new Set(entry.referencedBy || [])].sort(),
  })).sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of normalizedObjects) {
    if (!Number.isSafeInteger(entry.bytes) || entry.bytes < 0 || !/^[a-f0-9]{64}$/.test(entry.sha256)) {
      throw new Error(`Metadatos inválidos para ${entry.name}.`);
    }
  }
  return {
    version: INVENTORY_VERSION,
    prefix: LEGACY_PRESENTATION_PREFIX,
    rows,
    objects: normalizedObjects,
    totals: {
      rows: rows.length,
      rowsWithLegacyObjects: rows.filter((row) => row.legacyObjects.length > 0).length,
      objects: normalizedObjects.length,
      bytes: normalizedObjects.reduce((total, entry) => total + entry.bytes, 0),
    },
  };
}

async function captureInventory() {
  const client = storageClient();
  const [rows, names] = await Promise.all([
    readDatabaseRows(true),
    listLegacyObjectNames(client),
  ]);
  const referencedBy = new Map();
  for (const row of rows) {
    for (const objectName of row.legacyObjects) {
      const ids = referencedBy.get(objectName) || [];
      ids.push(row.id);
      referencedBy.set(objectName, ids);
    }
  }
  const objects = [];
  for (const name of names) {
    const metadata = await streamObjectMetadata(client, name);
    objects.push({ ...metadata, name, referencedBy: referencedBy.get(name) || [] });
  }
  const state = buildPresentationInventoryState(rows, objects);
  return {
    capturedAt: new Date().toISOString(),
    digestSha256: sha256(canonicalJson(state)),
    state,
  };
}

export function validatePresentationInventory(inventory) {
  if (!inventory || typeof inventory !== "object" || typeof inventory.capturedAt !== "string") {
    throw new Error("Archivo de inventario inválido.");
  }
  const state = buildPresentationInventoryState(inventory.state?.rows || [], inventory.state?.objects || []);
  const digestSha256 = sha256(canonicalJson(state));
  if (inventory.digestSha256 !== digestSha256) throw new Error("El SHA-256 del inventario no coincide.");
  return { capturedAt: inventory.capturedAt, digestSha256, state };
}

async function writeInventory(filename, inventory) {
  const contents = `${JSON.stringify(inventory, null, 2)}\n`;
  if (!filename) {
    process.stdout.write(contents);
    return;
  }
  const target = path.resolve(filename);
  await fs.writeFile(target, contents, { mode: 0o600, flag: "wx" });
  console.log(`[presentations:inventory] Archivo creado: ${target}`);
  console.log(`[presentations:inventory] SHA-256: ${inventory.digestSha256}`);
}

async function copyAndVerify(client, source, destination, expectedSha256) {
  const destinationExists = await client.exists(destination);
  if (!destinationExists.ok) throw new Error(`No fue posible consultar ${destination}.`);
  if (destinationExists.value) throw new Error(`La cuarentena ya contiene ${destination}; no se sobrescribió.`);
  const copy = await client.copy(source, destination);
  if (!copy.ok) throw new Error(`No fue posible copiar ${source}.`);
  const exists = await client.exists(destination);
  if (!exists.ok || !exists.value) throw new Error(`La copia no quedó confirmada: ${destination}.`);
  const metadata = await streamObjectMetadata(client, destination);
  if (metadata.sha256 !== expectedSha256) throw new Error(`Checksum distinto en ${destination}.`);
  return metadata;
}

async function archiveExactRows(inventory) {
  const affectedRows = inventory.state.rows.filter((row) => row.legacyObjects.length > 0);
  if (!affectedRows.length) return [];
  const databaseUrl = process.env.DATABASE_URL;
  const client = new pg.Client(getPostgresConnectionConfig(databaseUrl));
  await client.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1)", [2026082003]);
    if (!await generatedPresentationArchiveColumnsExist(client)) {
      throw new Error("La migración aditiva de Fase 3 todavía no está aplicada; los originales permanecen intactos.");
    }
    await client.query("LOCK TABLE generated_presentations IN SHARE ROW EXCLUSIVE MODE");
    const current = await client.query(`
      SELECT id, pptx_url, pdf_url, png_urls, status, created_at
      FROM generated_presentations
      ORDER BY id
    `);
    const currentRows = normalizeDatabaseRows(current.rows);
    if (sha256(canonicalJson(currentRows)) !== sha256(canonicalJson(inventory.state.rows))) {
      throw new Error("generated_presentations cambió después del inventario; no se archivó ninguna fila.");
    }
    const ids = affectedRows.map((row) => row.id);
    const updated = await client.query(`
      UPDATE generated_presentations
      SET status = 'archived', archived_at = now()
      WHERE id = ANY($1::varchar[]) AND status = 'active'
      RETURNING id
    `, [ids]);
    const expectedUpdates = affectedRows.filter((row) => row.status === "active").length;
    if (updated.rowCount !== expectedUpdates) {
      throw new Error("El número de filas archivadas no coincide con el inventario.");
    }
    await client.query("COMMIT");
    return updated.rows.map((row) => row.id).sort();
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

async function quarantine(inventoryFilename) {
  if (!inventoryFilename) throw new Error("Indica --inventory=/ruta/inventario.json.");
  if (option("confirm-scope") !== CONFIRM_SCOPE) {
    throw new Error(`Confirma el alcance con --confirm-scope=${CONFIRM_SCOPE}.`);
  }
  const inventory = validatePresentationInventory(JSON.parse(await fs.readFile(path.resolve(inventoryFilename), "utf8")));
  if (option("confirm-sha256") !== inventory.digestSha256) {
    throw new Error(`Confirma exactamente --confirm-sha256=${inventory.digestSha256}.`);
  }
  const fresh = await captureInventory();
  if (fresh.digestSha256 !== inventory.digestSha256) {
    throw new Error("PostgreSQL o App Storage cambió después del inventario; no se copió ni retiró nada.");
  }
  if (!inventory.state.objects.length) {
    console.log("[presentations:quarantine] Inventario vacío; no había objetos que mover.");
    return;
  }

  const client = storageClient();
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")
    .replace(/^(\d{4})(\d{2})(\d{2})T/, "$1-$2-$3T");
  const copied = [];
  for (const entry of inventory.state.objects) {
    const destination = quarantinePresentationObjectName(entry.name, stamp);
    const metadata = await copyAndVerify(client, entry.name, destination, entry.sha256);
    copied.push({ source: entry.name, destination, ...metadata });
  }

  const manifest = {
    version: 1,
    createdAt: new Date().toISOString(),
    retainUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    inventorySha256: inventory.digestSha256,
    objects: copied,
    purgeImplemented: false,
  };
  const manifestName = `${QUARANTINE_PRESENTATION_PREFIX}${stamp}/manifest-${inventory.digestSha256}.json`;
  const manifestUpload = await client.uploadFromText(manifestName, `${JSON.stringify(manifest, null, 2)}\n`, { compress: false });
  if (!manifestUpload.ok) throw new Error("No se pudo guardar el manifiesto de cuarentena.");

  const namesBeforeRemoval = await listLegacyObjectNames(client);
  if (canonicalJson(namesBeforeRemoval) !== canonicalJson(inventory.state.objects.map((entry) => entry.name))) {
    throw new Error("El prefijo público cambió durante la copia; los originales permanecen intactos.");
  }

  const removedSources = [];
  let archivedIds = [];
  try {
    for (const entry of copied) {
      assertLegacyPresentationObjectName(entry.source);
      const currentMetadata = await streamObjectMetadata(client, entry.source);
      if (currentMetadata.sha256 !== entry.sha256 || currentMetadata.bytes !== entry.bytes) {
        throw new Error(`El original cambió después del inventario: ${entry.source}.`);
      }
      const removed = await client.delete(entry.source, { ignoreNotFound: false });
      if (!removed.ok) throw new Error(`No se pudo retirar el original exacto ${entry.source}.`);
      const exists = await client.exists(entry.source);
      if (!exists.ok || exists.value) throw new Error(`El original todavía existe: ${entry.source}.`);
      removedSources.push(entry);
    }
    archivedIds = await archiveExactRows(inventory);
  } catch (error) {
    // Recuperación conservadora: si la retirada quedó parcial, restaurar desde
    // las copias verificadas. La cuarentena permanece intacta.
    for (const entry of removedSources) {
      const restored = await client.copy(entry.destination, entry.source);
      if (!restored.ok) {
        throw new Error(`Retirada parcial y restauración fallida para ${entry.source}; usa el manifiesto ${manifestName}.`);
      }
    }
    throw error;
  }

  // Restauración real controlada del primer objeto. La ruta HTTP pública ya devuelve 404;
  // después de verificar bytes/checksum, se retira nuevamente la copia de prueba exacta.
  const restore = copied[0];
  const restored = await client.copy(restore.destination, restore.source);
  if (!restored.ok) throw new Error("La prueba de restauración no pudo copiar el objeto.");
  const restoredMetadata = await streamObjectMetadata(client, restore.source);
  if (restoredMetadata.sha256 !== restore.sha256) throw new Error("La restauración no conserva el checksum.");
  const removeRestore = await client.delete(restore.source, { ignoreNotFound: false });
  if (!removeRestore.ok) throw new Error("No se pudo retirar la copia pública usada en la prueba de restauración.");

  console.log(JSON.stringify({
    success: true,
    quarantinedObjects: copied.length,
    archivedRows: archivedIds.length,
    manifest: manifestName,
    retainUntil: manifest.retainUntil,
    restoreTest: { source: restore.source, sha256: restore.sha256, passed: true },
    permanentDeletion: "NOT_IMPLEMENTED",
  }, null, 2));
}

async function main() {
  const mode = option("mode") || "inventory";
  if (mode === "inventory") {
    const inventory = await captureInventory();
    await writeInventory(option("output"), inventory);
    return;
  }
  if (mode === "quarantine") {
    await quarantine(option("inventory"));
    return;
  }
  throw new Error("Modo no permitido. Usa inventory o quarantine; la purga definitiva no está implementada.");
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  main().catch((error) => {
    console.error(`[presentations:safety] ${error instanceof Error ? error.message : "Error desconocido"}`);
    process.exitCode = 1;
  });
}
