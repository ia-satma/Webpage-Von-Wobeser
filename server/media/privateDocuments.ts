import { Client } from "@replit/object-storage";
import fs from "node:fs/promises";
import type { Readable } from "node:stream";
import { persistentMediaIsRequired } from "./persistentMedia";

const PRIVATE_CV_STORAGE_ROOT = "von-wobeser/private/cvs";
const PRIVATE_CV_PATH_PREFIX = "private:cvs/";

let appStorageClient: Client | null = null;

export class PrivateDocumentStorageUnavailableError extends Error {
  constructor() {
    super("Private document storage is unavailable");
    this.name = "PrivateDocumentStorageUnavailableError";
  }
}

function shouldAttemptPrivateStorage(env: NodeJS.ProcessEnv = process.env): boolean {
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
 * Los CV nunca comparten el prefijo público. La base conserva una referencia
 * opaca y App Storage usa un prefijo privado que solo se sirve tras autenticar.
 */
export function privateCvObjectName(storagePath: string): string | null {
  if (!storagePath.startsWith(PRIVATE_CV_PATH_PREFIX)) return null;
  const filename = storagePath.slice(PRIVATE_CV_PATH_PREFIX.length);
  if (!/^[a-f0-9]{32}\.(pdf|doc|docx)$/.test(filename)) return null;
  return `${PRIVATE_CV_STORAGE_ROOT}/${filename}`;
}

export function privateCvStoragePathFromObjectName(objectName: string): string | null {
  const prefix = `${PRIVATE_CV_STORAGE_ROOT}/`;
  if (!objectName.startsWith(prefix)) return null;
  const storagePath = `${PRIVATE_CV_PATH_PREFIX}${objectName.slice(prefix.length)}`;
  return privateCvObjectName(storagePath) === objectName ? storagePath : null;
}

export async function persistentPrivateCvExists(storagePath: string): Promise<boolean> {
  const objectName = privateCvObjectName(storagePath);
  if (!objectName || !shouldAttemptPrivateStorage()) return false;
  try {
    const result = await getAppStorageClient().exists(objectName);
    return result.ok && result.value;
  } catch {
    return false;
  }
}

export async function persistPrivateCvFile(
  absolutePath: string,
  storagePath: string,
): Promise<{ persisted: boolean; objectName: string | null }> {
  const objectName = privateCvObjectName(storagePath);
  if (!objectName) throw new Error("Invalid private CV storage path");
  if (!shouldAttemptPrivateStorage()) {
    return { persisted: false, objectName: null };
  }

  try {
    await fs.access(absolutePath);
    const result = await getAppStorageClient().uploadFromFilename(objectName, absolutePath, {
      compress: false,
    });
    if (!result.ok) throw new PrivateDocumentStorageUnavailableError();
    return { persisted: true, objectName };
  } catch {
    if (persistentMediaIsRequired()) throw new PrivateDocumentStorageUnavailableError();
    return { persisted: false, objectName: null };
  }
}

export async function openPersistentPrivateCvStream(storagePath: string): Promise<Readable | null> {
  const objectName = privateCvObjectName(storagePath);
  if (!objectName || !shouldAttemptPrivateStorage()) return null;
  if (!await persistentPrivateCvExists(storagePath)) return null;
  try {
    return getAppStorageClient().downloadAsStream(objectName, { decompress: false });
  } catch {
    return null;
  }
}

export async function deletePersistentPrivateCv(storagePath: string): Promise<void> {
  const objectName = privateCvObjectName(storagePath);
  if (!objectName || !shouldAttemptPrivateStorage()) return;
  try {
    const result = await getAppStorageClient().delete(objectName, { ignoreNotFound: true });
    if (!result.ok && persistentMediaIsRequired()) {
      throw new PrivateDocumentStorageUnavailableError();
    }
  } catch (error) {
    if (persistentMediaIsRequired()) {
      if (error instanceof PrivateDocumentStorageUnavailableError) throw error;
      throw new PrivateDocumentStorageUnavailableError();
    }
  }
}

export async function listPersistentPrivateCvPaths(): Promise<Set<string> | null> {
  if (!shouldAttemptPrivateStorage()) return null;
  try {
    const result = await getAppStorageClient().list({ prefix: `${PRIVATE_CV_STORAGE_ROOT}/` });
    if (!result.ok) return null;
    const paths = new Set<string>();
    for (const item of result.value) {
      const storagePath = privateCvStoragePathFromObjectName(item.name);
      if (storagePath) paths.add(storagePath);
    }
    return paths;
  } catch {
    return null;
  }
}

export async function privateDocumentStorageStatus(): Promise<{
  required: boolean;
  available: boolean;
  provider: "replit_app_storage" | "local_development";
}> {
  const required = persistentMediaIsRequired();
  if (!shouldAttemptPrivateStorage()) {
    return { required, available: !required, provider: "local_development" };
  }
  try {
    const result = await getAppStorageClient().list({
      prefix: `${PRIVATE_CV_STORAGE_ROOT}/`,
      maxResults: 1,
    });
    return { required, available: result.ok, provider: "replit_app_storage" };
  } catch {
    return { required, available: false, provider: "replit_app_storage" };
  }
}

export const PRIVATE_CV_OBJECT_PREFIX = PRIVATE_CV_STORAGE_ROOT;
