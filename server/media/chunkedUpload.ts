import { Client } from "@replit/object-storage";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { persistentMediaIsRequired } from "./persistentMedia";

export const MEDIA_CHUNK_BYTES = 4 * 1024 * 1024;
export const MAX_CHUNKED_MEDIA_BYTES = 200 * 1024 * 1024;
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;
const STORAGE_PREFIX = "von-wobeser/private/media-upload-chunks";
const localChunkRoot = path.join(process.cwd(), "private_uploads", "media-chunks");
const developmentSecret = crypto.randomBytes(32);

export const CHUNKED_MEDIA_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
]);

type UploadSession = {
  v: 1;
  id: string;
  userId: string;
  originalName: string;
  mimeType: string;
  size: number;
  chunkSize: number;
  totalChunks: number;
  expiresAt: number;
};

export class ChunkedMediaUploadError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "ChunkedMediaUploadError";
  }
}

let storageClient: Client | null = null;

function sharedStorageEnabled(): boolean {
  return persistentMediaIsRequired()
    || process.env.VWB_APP_STORAGE_ENABLED === "true"
    || Boolean(process.env.REPLIT_APP_STORAGE_BUCKET_ID);
}

function client(): Client {
  if (!storageClient) {
    const bucketId = process.env.REPLIT_APP_STORAGE_BUCKET_ID?.trim();
    storageClient = new Client(bucketId ? { bucketId } : undefined);
  }
  return storageClient;
}

function signingSecret(): Buffer {
  const configured = process.env.SESSION_SECRET?.trim();
  if (configured) return Buffer.from(configured, "utf8");
  if (persistentMediaIsRequired()) {
    throw new ChunkedMediaUploadError(
      "El servidor no tiene configurada la firma de cargas.",
      "CHUNK_UPLOAD_NOT_CONFIGURED",
      503,
    );
  }
  return developmentSecret;
}

function encodeSession(session: UploadSession): string {
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  const signature = crypto.createHmac("sha256", signingSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function readSession(token: string, expectedUserId: string): UploadSession {
  const [payload, suppliedSignature, extra] = token.split(".");
  if (!payload || !suppliedSignature || extra) {
    throw new ChunkedMediaUploadError("La sesión de carga no es válida.", "INVALID_CHUNK_SESSION", 401);
  }
  const expectedSignature = crypto.createHmac("sha256", signingSecret()).update(payload).digest();
  let supplied: Buffer;
  try {
    supplied = Buffer.from(suppliedSignature, "base64url");
  } catch {
    throw new ChunkedMediaUploadError("La sesión de carga no es válida.", "INVALID_CHUNK_SESSION", 401);
  }
  if (supplied.length !== expectedSignature.length || !crypto.timingSafeEqual(supplied, expectedSignature)) {
    throw new ChunkedMediaUploadError("La sesión de carga no es válida.", "INVALID_CHUNK_SESSION", 401);
  }

  let session: UploadSession;
  try {
    session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as UploadSession;
  } catch {
    throw new ChunkedMediaUploadError("La sesión de carga no es válida.", "INVALID_CHUNK_SESSION", 401);
  }
  const structurallyValid = session.v === 1
    && /^[a-f0-9]{32}$/.test(session.id)
    && session.userId === expectedUserId
    && CHUNKED_MEDIA_MIMES.has(session.mimeType)
    && Number.isSafeInteger(session.size)
    && session.size > 0
    && session.size <= MAX_CHUNKED_MEDIA_BYTES
    && session.chunkSize === MEDIA_CHUNK_BYTES
    && session.totalChunks === Math.ceil(session.size / session.chunkSize)
    && session.totalChunks >= 1
    && session.totalChunks <= 50
    && Number.isSafeInteger(session.expiresAt)
    && session.expiresAt > Date.now()
    && typeof session.originalName === "string"
    && session.originalName.length >= 1
    && session.originalName.length <= 180;
  if (!structurallyValid) {
    throw new ChunkedMediaUploadError("La sesión de carga expiró o fue alterada.", "INVALID_CHUNK_SESSION", 401);
  }
  return session;
}

function objectName(session: UploadSession, index: number): string {
  return `${STORAGE_PREFIX}/${session.id}/${String(index).padStart(3, "0")}.part`;
}

function localChunkPath(session: UploadSession, index: number): string {
  return path.join(localChunkRoot, session.id, `${String(index).padStart(3, "0")}.part`);
}

function expectedChunkBytes(session: UploadSession, index: number): number {
  if (!Number.isSafeInteger(index) || index < 0 || index >= session.totalChunks) {
    throw new ChunkedMediaUploadError("El fragmento está fuera de rango.", "INVALID_CHUNK_INDEX");
  }
  return index === session.totalChunks - 1
    ? session.size - index * session.chunkSize
    : session.chunkSize;
}

export function createChunkedMediaUpload(input: {
  userId: string;
  originalName: string;
  mimeType: string;
  size: number;
}): { token: string; chunkSize: number; totalChunks: number; expiresAt: string } {
  const originalName = path.basename(input.originalName).replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 180);
  if (!originalName || !CHUNKED_MEDIA_MIMES.has(input.mimeType)) {
    throw new ChunkedMediaUploadError("El formato del archivo no está permitido.", "INVALID_MEDIA_TYPE", 415);
  }
  if (!Number.isSafeInteger(input.size) || input.size <= 0 || input.size > MAX_CHUNKED_MEDIA_BYTES) {
    throw new ChunkedMediaUploadError("El archivo debe pesar como máximo 200 MB.", "MEDIA_FILE_TOO_LARGE", 413);
  }
  const session: UploadSession = {
    v: 1,
    id: crypto.randomBytes(16).toString("hex"),
    userId: input.userId,
    originalName,
    mimeType: input.mimeType,
    size: input.size,
    chunkSize: MEDIA_CHUNK_BYTES,
    totalChunks: Math.ceil(input.size / MEDIA_CHUNK_BYTES),
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  return {
    token: encodeSession(session),
    chunkSize: session.chunkSize,
    totalChunks: session.totalChunks,
    expiresAt: new Date(session.expiresAt).toISOString(),
  };
}

export async function storeChunkedMediaPart(
  token: string,
  userId: string,
  index: number,
  contents: Buffer,
): Promise<{ received: number; totalChunks: number }> {
  const session = readSession(token, userId);
  const expected = expectedChunkBytes(session, index);
  if (contents.length !== expected) {
    throw new ChunkedMediaUploadError("El fragmento llegó incompleto.", "INVALID_CHUNK_SIZE");
  }
  if (sharedStorageEnabled()) {
    const result = await client().uploadFromBytes(objectName(session, index), contents, { compress: false });
    if (!result.ok) {
      throw new ChunkedMediaUploadError("App Storage no pudo guardar el fragmento.", "CHUNK_STORAGE_UNAVAILABLE", 503);
    }
  } else {
    const destination = localChunkPath(session, index);
    await fs.mkdir(path.dirname(destination), { recursive: true, mode: 0o700 });
    await fs.writeFile(destination, contents, { mode: 0o600 });
  }
  return { received: index + 1, totalChunks: session.totalChunks };
}

async function loadPart(session: UploadSession, index: number): Promise<Buffer> {
  if (sharedStorageEnabled()) {
    const result = await client().downloadAsBytes(objectName(session, index), { decompress: false });
    if (!result.ok) {
      throw new ChunkedMediaUploadError("Falta un fragmento de la carga.", "MISSING_MEDIA_CHUNK", 409);
    }
    return result.value[0];
  }
  try {
    return await fs.readFile(localChunkPath(session, index));
  } catch {
    throw new ChunkedMediaUploadError("Falta un fragmento de la carga.", "MISSING_MEDIA_CHUNK", 409);
  }
}

export async function removeChunkedMediaUpload(token: string, userId: string): Promise<void> {
  let session: UploadSession;
  try {
    session = readSession(token, userId);
  } catch {
    return;
  }
  if (sharedStorageEnabled()) {
    await Promise.all(Array.from({ length: session.totalChunks }, async (_, index) => {
      await client().delete(objectName(session, index), { ignoreNotFound: true }).catch(() => undefined);
    }));
  } else {
    await fs.rm(path.join(localChunkRoot, session.id), { recursive: true, force: true });
  }
}

export async function assembleChunkedMediaUpload(
  token: string,
  userId: string,
  destinationPath: string,
): Promise<{ originalName: string; mimeType: string; size: number }> {
  const session = readSession(token, userId);
  await fs.mkdir(path.dirname(destinationPath), { recursive: true, mode: 0o700 });
  const handle = await fs.open(destinationPath, "w", 0o600);
  try {
    for (let index = 0; index < session.totalChunks; index += 1) {
      const contents = await loadPart(session, index);
      const expected = expectedChunkBytes(session, index);
      if (contents.length !== expected) {
        throw new ChunkedMediaUploadError("Un fragmento guardado está incompleto.", "INVALID_CHUNK_SIZE", 409);
      }
      await handle.write(contents, 0, contents.length, index * session.chunkSize);
    }
  } catch (error) {
    await handle.close().catch(() => undefined);
    await fs.rm(destinationPath, { force: true });
    throw error;
  }
  await handle.close();
  const assembled = await fs.stat(destinationPath);
  if (assembled.size !== session.size) {
    await fs.rm(destinationPath, { force: true });
    throw new ChunkedMediaUploadError("El archivo reconstruido está incompleto.", "INVALID_ASSEMBLED_MEDIA", 409);
  }
  return { originalName: session.originalName, mimeType: session.mimeType, size: session.size };
}
