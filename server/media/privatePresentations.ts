import { Client } from "@replit/object-storage";
import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import type { Readable } from "node:stream";
import { persistentMediaIsRequired } from "./persistentMedia";

const PRIVATE_PRESENTATION_OBJECT_ROOT = "von-wobeser/private/generated-presentations";
const PRIVATE_PRESENTATION_PATH_PREFIX = "private:generated-presentations/";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let appStorageClient: Client | null = null;

export type PrivatePresentationFile = {
  absolutePath: string;
  storagePath: string;
};

export class PrivatePresentationStorageUnavailableError extends Error {
  constructor() {
    super("Private presentation storage is unavailable");
    this.name = "PrivatePresentationStorageUnavailableError";
  }
}

function shouldAttemptPrivatePresentationStorage(env: NodeJS.ProcessEnv = process.env): boolean {
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

function parsePrivatePresentationPath(storagePath: string): {
  presentationId: string;
  relativeName: string;
} | null {
  if (!storagePath.startsWith(PRIVATE_PRESENTATION_PATH_PREFIX)) return null;
  const relative = storagePath.slice(PRIVATE_PRESENTATION_PATH_PREFIX.length);
  if (relative.includes("\\") || relative.includes("\0")) return null;
  const segments = relative.split("/");
  if (!UUID_PATTERN.test(segments[0] || "")) return null;

  const relativeName = segments.slice(1).join("/");
  const validFile = relativeName === "presentation.pptx"
    || relativeName === "presentation.pdf"
    || /^slides\/[1-9][0-9]{0,2}\.png$/.test(relativeName);
  if (!validFile) return null;
  return { presentationId: segments[0].toLowerCase(), relativeName };
}

export function privatePresentationStoragePath(
  presentationId: string,
  format: "pptx" | "pdf" | "png",
  slideNumber?: number,
): string | null {
  if (!UUID_PATTERN.test(presentationId)) return null;
  const id = presentationId.toLowerCase();
  if (format === "png") {
    if (!Number.isSafeInteger(slideNumber) || (slideNumber || 0) < 1 || (slideNumber || 0) > 999) return null;
    return `${PRIVATE_PRESENTATION_PATH_PREFIX}${id}/slides/${slideNumber}.png`;
  }
  return `${PRIVATE_PRESENTATION_PATH_PREFIX}${id}/presentation.${format}`;
}

export function privatePresentationObjectName(storagePath: string): string | null {
  const parsed = parsePrivatePresentationPath(storagePath);
  if (!parsed) return null;
  return `${PRIVATE_PRESENTATION_OBJECT_ROOT}/${parsed.presentationId}/${parsed.relativeName}`;
}

export function privatePresentationPathBelongsTo(
  storagePath: string | null,
  presentationId: string,
): boolean {
  if (!storagePath || !UUID_PATTERN.test(presentationId)) return false;
  const parsed = parsePrivatePresentationPath(storagePath);
  return parsed?.presentationId === presentationId.toLowerCase();
}

export function privatePresentationMimeType(storagePath: string): string {
  if (storagePath.endsWith(".pptx")) {
    return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  }
  if (storagePath.endsWith(".pdf")) return "application/pdf";
  if (storagePath.endsWith(".png")) return "image/png";
  return "application/octet-stream";
}

export function privatePresentationLocalPath(storagePath: string): string | null {
  const parsed = parsePrivatePresentationPath(storagePath);
  if (!parsed) return null;
  const root = path.resolve(process.cwd(), "private", "generated-presentations");
  const candidate = path.resolve(root, parsed.presentationId, ...parsed.relativeName.split("/"));
  return candidate.startsWith(`${root}${path.sep}`) ? candidate : null;
}

export async function persistPrivatePresentationFiles(
  files: PrivatePresentationFile[],
): Promise<{ persisted: boolean; objectNames: string[] }> {
  if (!files.length) return { persisted: false, objectNames: [] };
  const entries = files.map((file) => {
    const objectName = privatePresentationObjectName(file.storagePath);
    const expectedLocalPath = privatePresentationLocalPath(file.storagePath);
    if (!objectName || !expectedLocalPath || path.resolve(file.absolutePath) !== expectedLocalPath) {
      throw new Error("Invalid private presentation path");
    }
    return { ...file, objectName };
  });

  if (!shouldAttemptPrivatePresentationStorage()) {
    return { persisted: false, objectNames: [] };
  }

  const uploaded: string[] = [];
  try {
    const client = getAppStorageClient();
    for (const entry of entries) {
      await fs.access(entry.absolutePath);
      const existing = await client.exists(entry.objectName);
      if (!existing.ok) throw new PrivatePresentationStorageUnavailableError();
      if (existing.value) throw new Error("Private presentation object collision");
      const result = await client.uploadFromFilename(entry.objectName, entry.absolutePath, {
        compress: false,
      });
      if (!result.ok) throw new PrivatePresentationStorageUnavailableError();
      uploaded.push(entry.objectName);
    }
    return { persisted: true, objectNames: uploaded };
  } catch (error) {
    await deletePrivatePresentationObjects(uploaded);
    if (error instanceof Error && error.message === "Private presentation object collision") throw error;
    if (persistentMediaIsRequired()) throw new PrivatePresentationStorageUnavailableError();
    return { persisted: false, objectNames: [] };
  }
}

/** Compensación exclusiva para objetos recién creados por la misma operación. */
export async function deletePrivatePresentationObjects(objectNames: string[]): Promise<void> {
  if (!objectNames.length || !shouldAttemptPrivatePresentationStorage()) return;
  const exactNames = objectNames.filter((name) => {
    const prefix = `${PRIVATE_PRESENTATION_OBJECT_ROOT}/`;
    if (!name.startsWith(prefix)) return false;
    const storagePath = `${PRIVATE_PRESENTATION_PATH_PREFIX}${name.slice(prefix.length)}`;
    return privatePresentationObjectName(storagePath) === name;
  });
  const client = getAppStorageClient();
  await Promise.all(exactNames.map(async (objectName) => {
    try {
      await client.delete(objectName, { ignoreNotFound: true });
    } catch {
      // La operación original conserva prioridad; nunca se amplía el prefijo.
    }
  }));
}

export async function privatePresentationExists(storagePath: string): Promise<boolean> {
  const objectName = privatePresentationObjectName(storagePath);
  const localPath = privatePresentationLocalPath(storagePath);
  if (!objectName || !localPath) return false;
  if (shouldAttemptPrivatePresentationStorage()) {
    try {
      const result = await getAppStorageClient().exists(objectName);
      if (result.ok && result.value) return true;
    } catch {
      // En producción no se cae al filesystem efímero como fuente autoritativa.
    }
    if (persistentMediaIsRequired()) return false;
  }
  try {
    return (await fs.stat(localPath)).isFile();
  } catch {
    return false;
  }
}

export async function openPrivatePresentationStream(storagePath: string): Promise<Readable | null> {
  const objectName = privatePresentationObjectName(storagePath);
  const localPath = privatePresentationLocalPath(storagePath);
  if (!objectName || !localPath) return null;
  if (shouldAttemptPrivatePresentationStorage()) {
    try {
      const result = await getAppStorageClient().exists(objectName);
      if (result.ok && result.value) {
        return getAppStorageClient().downloadAsStream(objectName, { decompress: false });
      }
    } catch {
      // El caller devuelve ausencia sin exponer detalles del proveedor.
    }
    if (persistentMediaIsRequired()) return null;
  }
  try {
    if (!(await fs.stat(localPath)).isFile()) return null;
    return createReadStream(localPath);
  } catch {
    return null;
  }
}

export const PRIVATE_PRESENTATION_STORAGE_PREFIX = PRIVATE_PRESENTATION_OBJECT_ROOT;
