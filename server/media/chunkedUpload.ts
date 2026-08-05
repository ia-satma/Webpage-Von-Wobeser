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
  v: 1 | 2;
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

/**
 * La primera publicación de la carga con integridad debe seguir emitiendo
 * sesiones v1: una petición /start puede llegar a la instancia nueva mientras
 * el siguiente fragmento todavía llega a una instancia anterior durante el
 * despliegue rodante de Replit. La v2 queda lista para activarse explícitamente
 * cuando todas las instancias ya ejecuten este código.
 */
function currentChunkProtocol(): 1 | 2 {
  return process.env.VWB_MEDIA_CHUNK_V2 === "true" ? 2 : 1;
}

function readSession(token: string, expectedUserId: string, allowExpired = false): UploadSession {
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
  /* Buffer acepta representaciones base64url no canónicas cuyos bits de relleno
     pueden decodificar al mismo HMAC. Exigir la recodificación exacta evita que
     una firma textual alterada siga siendo válida. */
  const canonicalSignature = supplied.toString("base64url");
  if (
    canonicalSignature !== suppliedSignature
    || supplied.length !== expectedSignature.length
    || !crypto.timingSafeEqual(supplied, expectedSignature)
  ) {
    throw new ChunkedMediaUploadError("La sesión de carga no es válida.", "INVALID_CHUNK_SESSION", 401);
  }

  let session: UploadSession;
  try {
    session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as UploadSession;
  } catch {
    throw new ChunkedMediaUploadError("La sesión de carga no es válida.", "INVALID_CHUNK_SESSION", 401);
  }
  const structurallyValid = (session.v === 1 || session.v === 2)
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
    && (allowExpired || session.expiresAt > Date.now())
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

function checksumObjectName(session: UploadSession, index: number): string {
  return `${objectName(session, index)}.sha256`;
}

function localChunkPath(session: UploadSession, index: number): string {
  return path.join(localChunkRoot, session.id, `${String(index).padStart(3, "0")}.part`);
}

function localChecksumPath(session: UploadSession, index: number): string {
  return `${localChunkPath(session, index)}.sha256`;
}

function chunkChecksum(contents: Buffer): string {
  return crypto.createHash("sha256").update(contents).digest("hex");
}

const V2_CHUNK_PREFIX = Buffer.from("VWBCHUNK2\n", "ascii");
const V2_CHUNK_HEADER_BYTES = V2_CHUNK_PREFIX.length + 64 + 1;

function encodeV2Chunk(contents: Buffer, checksum: string): Buffer {
  return Buffer.concat([
    V2_CHUNK_PREFIX,
    Buffer.from(checksum, "ascii"),
    Buffer.from("\n", "ascii"),
    contents,
  ]);
}

function decodeV2Chunk(stored: Buffer): Buffer {
  if (stored.length <= V2_CHUNK_HEADER_BYTES
    || !stored.subarray(0, V2_CHUNK_PREFIX.length).equals(V2_CHUNK_PREFIX)
    || stored[V2_CHUNK_HEADER_BYTES - 1] !== 0x0a) {
    throw new ChunkedMediaUploadError(
      "Un fragmento guardado no tiene el formato de integridad esperado.",
      "CORRUPTED_MEDIA_CHUNK",
      409,
    );
  }
  const expectedChecksum = stored
    .subarray(V2_CHUNK_PREFIX.length, V2_CHUNK_HEADER_BYTES - 1)
    .toString("ascii")
    .toLowerCase();
  const contents = stored.subarray(V2_CHUNK_HEADER_BYTES);
  if (!/^[a-f0-9]{64}$/.test(expectedChecksum) || chunkChecksum(contents) !== expectedChecksum) {
    throw new ChunkedMediaUploadError(
      "Un fragmento guardado no superó la comprobación de integridad.",
      "CORRUPTED_MEDIA_CHUNK",
      409,
    );
  }
  return contents;
}

function validateSuppliedChecksum(contents: Buffer, suppliedChecksum = ""): string {
  const actual = chunkChecksum(contents);
  // Compatibilidad durante despliegues: una pestaña abierta con el JavaScript
  // anterior no enviaba la cabecera. El servidor conserva la misma garantía al
  // calcular y guardar la huella directamente desde los bytes recibidos.
  if (!suppliedChecksum.trim()) return actual;
  const normalized = suppliedChecksum.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalized)) {
    throw new ChunkedMediaUploadError(
      "No se pudo verificar la integridad del fragmento.",
      "INVALID_CHUNK_CHECKSUM",
    );
  }
  if (!crypto.timingSafeEqual(Buffer.from(normalized, "hex"), Buffer.from(actual, "hex"))) {
    throw new ChunkedMediaUploadError(
      "El fragmento cambió durante la transferencia.",
      "CHUNK_CHECKSUM_MISMATCH",
      409,
    );
  }
  return actual;
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
    v: currentChunkProtocol(),
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
  suppliedChecksum = "",
): Promise<{ received: number; totalChunks: number }> {
  const session = readSession(token, userId);
  const expected = expectedChunkBytes(session, index);
  if (contents.length !== expected) {
    throw new ChunkedMediaUploadError("El fragmento llegó incompleto.", "INVALID_CHUNK_SIZE");
  }
  const checksum = validateSuppliedChecksum(contents, suppliedChecksum);
  if (session.v === 2) {
    const stored = encodeV2Chunk(contents, checksum);
    if (sharedStorageEnabled()) {
      const result = await client().uploadFromBytes(objectName(session, index), stored, { compress: false });
      if (!result.ok) {
        throw new ChunkedMediaUploadError("App Storage no pudo guardar el fragmento.", "CHUNK_STORAGE_UNAVAILABLE", 503);
      }
    } else {
      const destination = localChunkPath(session, index);
      await fs.mkdir(path.dirname(destination), { recursive: true, mode: 0o700 });
      await fs.writeFile(destination, stored, { mode: 0o600 });
    }
    return { received: index + 1, totalChunks: session.totalChunks };
  }

  // Sesión v1 en curso durante el despliegue: mantener su representación
  // anterior para que pueda terminar sin obligar al usuario a volver a cargar.
  if (sharedStorageEnabled()) {
    const [partResult, checksumResult] = await Promise.all([
      client().uploadFromBytes(objectName(session, index), contents, { compress: false }),
      client().uploadFromBytes(checksumObjectName(session, index), Buffer.from(checksum, "ascii"), { compress: false }),
    ]);
    if (!partResult.ok || !checksumResult.ok) {
      throw new ChunkedMediaUploadError("App Storage no pudo guardar el fragmento.", "CHUNK_STORAGE_UNAVAILABLE", 503);
    }
  } else {
    const destination = localChunkPath(session, index);
    await fs.mkdir(path.dirname(destination), { recursive: true, mode: 0o700 });
    await Promise.all([
      fs.writeFile(destination, contents, { mode: 0o600 }),
      fs.writeFile(localChecksumPath(session, index), checksum, { mode: 0o600 }),
    ]);
  }
  return { received: index + 1, totalChunks: session.totalChunks };
}

async function loadPart(session: UploadSession, index: number): Promise<Buffer> {
  if (session.v === 2) {
    let stored: Buffer;
    if (sharedStorageEnabled()) {
      const result = await client().downloadAsBytes(objectName(session, index), { decompress: false });
      if (!result.ok) {
        throw new ChunkedMediaUploadError("Falta un fragmento de la carga.", "MISSING_MEDIA_CHUNK", 409);
      }
      stored = result.value[0];
    } else {
      try {
        stored = await fs.readFile(localChunkPath(session, index));
      } catch {
        throw new ChunkedMediaUploadError("Falta un fragmento de la carga.", "MISSING_MEDIA_CHUNK", 409);
      }
    }
    return decodeV2Chunk(stored);
  }

  let contents: Buffer;
  let expectedChecksum = "";
  if (sharedStorageEnabled()) {
    const partResult = await client().downloadAsBytes(objectName(session, index), { decompress: false });
    if (!partResult.ok) {
      throw new ChunkedMediaUploadError("Falta un fragmento de la carga.", "MISSING_MEDIA_CHUNK", 409);
    }
    contents = partResult.value[0];
    const checksumResult = await client().downloadAsBytes(checksumObjectName(session, index), { decompress: false });
    if (checksumResult.ok) expectedChecksum = checksumResult.value[0].toString("ascii").trim().toLowerCase();
  } else {
    try {
      contents = await fs.readFile(localChunkPath(session, index));
    } catch {
      throw new ChunkedMediaUploadError("Falta un fragmento de la carga.", "MISSING_MEDIA_CHUNK", 409);
    }
    expectedChecksum = await fs.readFile(localChecksumPath(session, index), "utf8")
      .then((value) => value.trim().toLowerCase())
      .catch(() => "");
  }
  // Una sesión v1 creada antes del despliegue no tiene sidecar. El tamaño del
  // fragmento, el tamaño final y la decodificación real del video siguen siendo
  // obligatorios; si sí existe la huella, también debe coincidir.
  if (expectedChecksum
    && (!/^[a-f0-9]{64}$/.test(expectedChecksum) || chunkChecksum(contents) !== expectedChecksum)) {
    throw new ChunkedMediaUploadError(
      "Un fragmento guardado no superó la comprobación de integridad.",
      "CORRUPTED_MEDIA_CHUNK",
      409,
    );
  }
  return contents;
}

async function deleteStorageObject(name: string): Promise<boolean> {
  try {
    const result = await client().delete(name, { ignoreNotFound: true });
    return result.ok;
  } catch {
    return false;
  }
}

export async function removeChunkedMediaUpload(token: string, userId: string): Promise<boolean> {
  let session: UploadSession;
  try {
    session = readSession(token, userId, true);
  } catch {
    return false;
  }
  if (sharedStorageEnabled()) {
    const results = await Promise.all(Array.from({ length: session.totalChunks }, async (_, index) => (
      Promise.all([
        deleteStorageObject(objectName(session, index)),
        deleteStorageObject(checksumObjectName(session, index)),
      ])
    )));
    const removed = results.every(([part, checksum]) => part && checksum);
    if (!removed) console.warn(`[media-upload] No se pudieron limpiar todos los fragmentos de ${session.id}.`);
    return removed;
  } else {
    await fs.rm(path.join(localChunkRoot, session.id), { recursive: true, force: true });
    return true;
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
      let written = 0;
      while (written < contents.length) {
        const result = await handle.write(
          contents,
          written,
          contents.length - written,
          index * session.chunkSize + written,
        );
        if (result.bytesWritten <= 0) {
          throw new ChunkedMediaUploadError(
            "No se pudo reconstruir completamente el archivo.",
            "INCOMPLETE_MEDIA_WRITE",
            503,
          );
        }
        written += result.bytesWritten;
      }
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
