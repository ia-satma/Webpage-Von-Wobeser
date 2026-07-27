import { Client } from "@replit/object-storage";
import fs from "node:fs/promises";
import path from "node:path";
import type { Readable } from "node:stream";

const STORAGE_ROOT = "von-wobeser/public";
const MANAGED_PREFIXES = ["/uploads/", "/generated-images/"] as const;
const AVAILABILITY_TTL_MS = 60_000;

type Environment = NodeJS.ProcessEnv;
type StreamOptions = {
  decompress?: boolean;
  start?: number;
  end?: number;
};

let appStorageClient: Client | null = null;
const availabilityCache = new Map<string, { available: boolean; expiresAt: number }>();

export class PersistentMediaUnavailableError extends Error {
  constructor() {
    super("Persistent media storage is unavailable");
    this.name = "PersistentMediaUnavailableError";
  }
}

/**
 * Los despliegues de Replit no conservan archivos escritos durante la ejecución.
 * En Replit y en producción nunca se permite confirmar una carga que no haya
 * quedado primero en App Storage. En desarrollo local se conserva el fallback
 * de disco para poder trabajar sin el sidecar de Replit.
 */
export function persistentMediaIsRequired(env: Environment = process.env): boolean {
  return env.NODE_ENV === "production"
    || env.VWB_PERSISTENT_MEDIA_REQUIRED === "true"
    || Boolean(env.REPL_ID || env.REPLIT_DEPLOYMENT || env.REPLIT_ENVIRONMENT);
}

function shouldAttemptPersistentMedia(env: Environment = process.env): boolean {
  return persistentMediaIsRequired(env)
    || env.VWB_APP_STORAGE_ENABLED === "true"
    || Boolean(env.REPLIT_APP_STORAGE_BUCKET_ID);
}

function getAppStorageClient(): Client {
  if (!appStorageClient) {
    const bucketId = process.env.REPLIT_APP_STORAGE_BUCKET_ID?.trim();
    appStorageClient = new Client(bucketId ? { bucketId } : undefined);
  }
  return appStorageClient;
}

/**
 * Convierte una ruta pública administrada en una clave opaca dentro del bucket.
 * Rechaza traversal, barras invertidas y cualquier prefijo que no sea de medios.
 */
export function managedMediaObjectName(publicPath: string): string | null {
  const cleanPath = publicPath.split(/[?#]/, 1)[0];
  const prefix = MANAGED_PREFIXES.find((candidate) => cleanPath.startsWith(candidate));
  if (!prefix || cleanPath.includes("\\") || cleanPath.includes("\0")) return null;

  let decoded: string;
  try {
    decoded = decodeURIComponent(cleanPath);
  } catch {
    return null;
  }
  const segments = decoded.slice(1).split("/");
  if (
    segments.some((segment) => !segment || segment === "." || segment === "..")
    || !segments.every((segment) => /^[A-Za-z0-9._+-]+$/.test(segment))
  ) {
    return null;
  }
  return `${STORAGE_ROOT}/${segments.join("/")}`;
}

export function publicPathFromManagedObjectName(objectName: string): string | null {
  const prefix = `${STORAGE_ROOT}/`;
  if (!objectName.startsWith(prefix)) return null;
  const publicPath = `/${objectName.slice(prefix.length)}`;
  return managedMediaObjectName(publicPath) === objectName ? publicPath : null;
}

export function managedMediaMimeType(publicPath: string): string {
  switch (path.posix.extname(publicPath.split(/[?#]/, 1)[0]).toLowerCase()) {
    case ".png": return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".webp": return "image/webp";
    case ".gif": return "image/gif";
    case ".mp4": return "video/mp4";
    case ".webm": return "video/webm";
    case ".ogv":
    case ".ogg": return "video/ogg";
    case ".mov": return "video/quicktime";
    case ".pdf": return "application/pdf";
    default: return "application/octet-stream";
  }
}

function rememberAvailability(objectName: string, available: boolean): void {
  availabilityCache.set(objectName, {
    available,
    expiresAt: Date.now() + AVAILABILITY_TTL_MS,
  });
}

function cachedAvailability(objectName: string): boolean | null {
  const cached = availabilityCache.get(objectName);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    availabilityCache.delete(objectName);
    return null;
  }
  return cached.available;
}

async function removeObjectsQuietly(objectNames: string[]): Promise<void> {
  if (!objectNames.length || !shouldAttemptPersistentMedia()) return;
  const client = getAppStorageClient();
  await Promise.all(objectNames.map(async (objectName) => {
    try {
      await client.delete(objectName, { ignoreNotFound: true });
    } catch {
      // La limpieza es compensatoria; el error original conserva prioridad.
    }
    availabilityCache.delete(objectName);
  }));
}

export type PublicMediaFile = {
  absolutePath: string;
  publicPath: string;
};

/**
 * Sube un conjunto completo antes de permitir que el contenido apunte a él.
 * Si una pieza falla, elimina las ya subidas para evitar estados parciales.
 */
export async function persistPublicMediaFiles(
  files: PublicMediaFile[],
): Promise<{ persisted: boolean; objectNames: string[] }> {
  if (!files.length) return { persisted: false, objectNames: [] };
  const entries = files.map((file) => {
    const objectName = managedMediaObjectName(file.publicPath);
    if (!objectName) throw new Error("Invalid managed media path");
    return { ...file, objectName };
  });

  if (!shouldAttemptPersistentMedia()) {
    return { persisted: false, objectNames: [] };
  }

  const uploaded: string[] = [];
  try {
    const client = getAppStorageClient();
    for (const entry of entries) {
      await fs.access(entry.absolutePath);
      const result = await client.uploadFromFilename(entry.objectName, entry.absolutePath, {
        compress: false,
      });
      if (!result.ok) throw new PersistentMediaUnavailableError();
      uploaded.push(entry.objectName);
      rememberAvailability(entry.objectName, true);
    }
    return { persisted: true, objectNames: uploaded };
  } catch {
    await removeObjectsQuietly(uploaded);
    if (persistentMediaIsRequired()) throw new PersistentMediaUnavailableError();
    return { persisted: false, objectNames: [] };
  }
}

export async function deletePersistentMediaObjects(objectNames: string[]): Promise<void> {
  await removeObjectsQuietly(objectNames);
}

export async function persistentPublicMediaExists(publicPath: string): Promise<boolean> {
  const objectName = managedMediaObjectName(publicPath);
  if (!objectName || !shouldAttemptPersistentMedia()) return false;
  const cached = cachedAvailability(objectName);
  if (cached !== null) return cached;
  try {
    const result = await getAppStorageClient().exists(objectName);
    const available = result.ok && result.value;
    rememberAvailability(objectName, available);
    return available;
  } catch {
    return false;
  }
}

export async function listPersistentPublicMediaPaths(): Promise<Set<string> | null> {
  if (!shouldAttemptPersistentMedia()) return null;
  try {
    const result = await getAppStorageClient().list({ prefix: `${STORAGE_ROOT}/` });
    if (!result.ok) return null;
    const paths = new Set<string>();
    for (const item of result.value) {
      const publicPath = publicPathFromManagedObjectName(item.name);
      if (publicPath) {
        paths.add(publicPath);
        rememberAvailability(item.name, true);
      }
    }
    return paths;
  } catch {
    return null;
  }
}

export async function persistentMediaStorageStatus(): Promise<{
  required: boolean;
  available: boolean;
  provider: "replit_app_storage" | "local_development";
}> {
  const required = persistentMediaIsRequired();
  if (!shouldAttemptPersistentMedia()) {
    return {
      required,
      available: !required,
      provider: "local_development",
    };
  }
  try {
    const result = await getAppStorageClient().list({
      prefix: `${STORAGE_ROOT}/`,
      maxResults: 1,
    });
    return {
      required,
      available: result.ok,
      provider: "replit_app_storage",
    };
  } catch {
    return {
      required,
      available: false,
      provider: "replit_app_storage",
    };
  }
}

export async function openPersistentPublicMediaStream(
  publicPath: string,
  options: StreamOptions = {},
): Promise<Readable | null> {
  const objectName = managedMediaObjectName(publicPath);
  if (!objectName || !shouldAttemptPersistentMedia()) return null;
  if (!await persistentPublicMediaExists(publicPath)) return null;
  try {
    // El SDK pasa estas opciones a createReadStream de GCS. start/end permiten
    // rangos de video aunque todavía no formen parte de su tipo público.
    return getAppStorageClient().downloadAsStream(objectName, {
      decompress: options.decompress ?? false,
      ...(options.start !== undefined ? { start: options.start } : {}),
      ...(options.end !== undefined ? { end: options.end } : {}),
    } as { decompress?: boolean });
  } catch {
    return null;
  }
}

export async function hydratePersistentPublicMedia(
  publicPath: string,
  destinationPath: string,
): Promise<boolean> {
  const objectName = managedMediaObjectName(publicPath);
  if (!objectName || !shouldAttemptPersistentMedia()) return false;
  try {
    await fs.mkdir(path.dirname(destinationPath), { recursive: true });
    const result = await getAppStorageClient().downloadToFilename(
      objectName,
      destinationPath,
      { decompress: false },
    );
    if (!result.ok) return false;
    await fs.chmod(destinationPath, 0o640).catch(() => undefined);
    rememberAvailability(objectName, true);
    return true;
  } catch {
    return false;
  }
}
