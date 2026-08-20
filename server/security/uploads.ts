import { execFile } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";

export const privateUploadsDir = path.join(process.cwd(), "private_uploads");
export const cvQuarantineDir = path.join(privateUploadsDir, "quarantine");
export const privateCvDir = path.join(privateUploadsDir, "cvs");
export const privatePresentationDir = path.join(privateUploadsDir, "presentation-inputs");
export const publicMediaQuarantineDir = path.join(privateUploadsDir, "media-quarantine");

export async function ensurePrivateUploadDirectories(): Promise<void> {
  await Promise.all([
    fs.mkdir(cvQuarantineDir, { recursive: true, mode: 0o700 }),
    fs.mkdir(privateCvDir, { recursive: true, mode: 0o700 }),
    fs.mkdir(privatePresentationDir, { recursive: true, mode: 0o700 }),
    fs.mkdir(publicMediaQuarantineDir, { recursive: true, mode: 0o700 }),
  ]);
}

export function securePhysicalFilename(extension: string): string {
  return `${crypto.randomBytes(16).toString("hex")}${extension}`;
}

async function firstBytes(filePath: string, length = 64): Promise<Buffer> {
  const handle = await fs.open(filePath, "r");
  try {
    const buffer = Buffer.alloc(length);
    const { bytesRead } = await handle.read(buffer, 0, length, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}

function hasPrefix(buffer: Buffer, bytes: number[]): boolean {
  return bytes.every((byte, index) => buffer[index] === byte);
}

export async function validatePublicMediaSignature(filePath: string, mimeType: string): Promise<boolean> {
  const header = await firstBytes(filePath);
  switch (mimeType) {
    case "image/jpeg":
      return hasPrefix(header, [0xff, 0xd8, 0xff]);
    case "image/png":
      return hasPrefix(header, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/gif":
      return header.subarray(0, 6).toString("ascii") === "GIF87a"
        || header.subarray(0, 6).toString("ascii") === "GIF89a";
    case "image/webp":
      return header.subarray(0, 4).toString("ascii") === "RIFF"
        && header.subarray(8, 12).toString("ascii") === "WEBP";
    case "application/pdf":
      return header.subarray(0, 5).toString("ascii") === "%PDF-";
    case "video/mp4":
    case "video/quicktime":
      return header.subarray(4, 8).toString("ascii") === "ftyp";
    case "video/webm":
      return hasPrefix(header, [0x1a, 0x45, 0xdf, 0xa3]);
    case "video/ogg":
      return header.subarray(0, 4).toString("ascii") === "OggS";
    default:
      return false;
  }
}

export interface VideoContainerValidationOptions {
  ffprobePath?: string;
  ffmpegPath?: string;
  mimeType?: string;
}

export type VideoContainerValidationResult =
  | { valid: true; verifier: "ffprobe+ffmpeg" }
  | { valid: false; reason: "invalid" | "validator_unavailable" | "validation_timeout" };

export type ProbedVideoMetadata = {
  streamIndex: number;
  codecName: string;
  width: number;
  height: number;
  duration: number;
  formatName: string;
  attachedPicture: boolean;
};

const VIDEO_CODECS_BY_MIME: Readonly<Record<string, ReadonlySet<string>>> = {
  "video/mp4": new Set(["h264", "hevc", "av1", "vp9", "mpeg4", "mjpeg"]),
  "video/quicktime": new Set(["h264", "hevc", "av1", "vp9", "mpeg4", "mjpeg", "prores"]),
  "video/webm": new Set(["vp8", "vp9", "av1"]),
  "video/ogg": new Set(["theora"]),
};

function videoToolMissing(error: unknown): boolean {
  const systemError = error as NodeJS.ErrnoException;
  return systemError?.code === "ENOENT" || systemError?.code === "EACCES";
}

function videoToolTimedOut(error: unknown): boolean {
  const systemError = error as NodeJS.ErrnoException & { killed?: boolean; signal?: string | null };
  return systemError?.code === "ETIMEDOUT"
    || systemError?.killed === true
    || systemError?.signal === "SIGTERM";
}

function containerMatchesMime(mimeType: string, formatName: string): boolean {
  const formats = new Set(formatName.toLowerCase().split(",").map((format) => format.trim()));
  if (mimeType === "video/mp4" || mimeType === "video/quicktime") {
    return formats.has("mov") || formats.has("mp4");
  }
  if (mimeType === "video/webm") return formats.has("webm");
  if (mimeType === "video/ogg") return formats.has("ogg");
  return false;
}

function parseVideoFrameRate(value: unknown): number {
  const raw = String(value || "").trim();
  if (!raw) return 0;
  const [numeratorText, denominatorText] = raw.split("/", 2);
  const numerator = Number(numeratorText);
  const denominator = denominatorText === undefined ? 1 : Number(denominatorText);
  const frameRate = numerator / denominator;
  return Number.isFinite(frameRate) && frameRate > 0 ? frameRate : 0;
}

/** Política pura para poder probar formatos adversariales sin lanzar procesos. */
export function videoMetadataAllowed(mimeType: string, metadata: ProbedVideoMetadata): boolean {
  const allowedCodecs = VIDEO_CODECS_BY_MIME[mimeType];
  const pixels = metadata.width * metadata.height;
  return Boolean(
    allowedCodecs
    && allowedCodecs.has(metadata.codecName.toLowerCase())
    && containerMatchesMime(mimeType, metadata.formatName)
    && !metadata.attachedPicture
    && Number.isSafeInteger(metadata.streamIndex)
    && metadata.streamIndex >= 0
    && Number.isFinite(metadata.duration)
    && metadata.duration >= 0.1
    && metadata.duration <= 60 * 60
    && Number.isSafeInteger(metadata.width)
    && Number.isSafeInteger(metadata.height)
    && metadata.width > 0
    && metadata.height > 0
    && metadata.width <= 4096
    && metadata.height <= 4096
    && pixels <= 4096 * 2160
  );
}

const FRAMEHASH_LINE = /^\s*\d+,\s*-?\d+,\s*-?\d+,\s*\d+,\s*\d+,\s*[a-f0-9]{64}\s*$/im;

/**
 * Decodifica exactamente un cuadro y exige evidencia criptográfica del cuadro
 * producido. FFmpeg puede terminar con código 0 aun cuando no haya emitido
 * ningún cuadro (por ejemplo, ante un MP4 truncado o un binario sustituto que
 * simplemente devuelve éxito), por lo que el código de salida no basta.
 */
function decodeVideoFrameAt(
  filePath: string,
  ffmpegPath: string,
  streamIndex: number,
  seekSeconds = 0,
): Promise<VideoContainerValidationResult> {
  return new Promise((resolve) => {
    const seekArguments = seekSeconds > 0
      ? ["-ss", seekSeconds.toFixed(3)]
      : [];
    execFile(
      ffmpegPath,
      [
        "-v", "error",
        "-xerror",
        "-err_detect", "explode",
        "-nostdin",
        "-threads", "1",
        ...seekArguments,
        "-i", filePath,
        "-map", `0:${streamIndex}`,
        "-frames:v", "1",
        "-an",
        "-sn",
        "-dn",
        "-hash", "sha256",
        "-f", "framehash",
        "-",
      ],
      {
        timeout: 30_000,
        windowsHide: true,
        maxBuffer: 512 * 1024,
      },
      (error, stdout) => {
        if (!error && FRAMEHASH_LINE.test(String(stdout || ""))) {
          resolve({ valid: true, verifier: "ffprobe+ffmpeg" });
          return;
        }
        if (videoToolMissing(error)) {
          resolve({ valid: false, reason: "validator_unavailable" });
        } else if (videoToolTimedOut(error)) {
          resolve({ valid: false, reason: "validation_timeout" });
        } else {
          resolve({ valid: false, reason: "invalid" });
        }
      },
    );
  });
}

/**
 * Confirma que un video que ya pasó la firma mágica contiene al menos una pista
 * de video legible. ffprobe valida formato, códec y límites; ffmpeg decodifica
 * un cuadro real. Si cualquiera de los verificadores no está instalado se
 * responde como indisponibilidad temporal: nunca se acepta por una heurística
 * más débil ni se etiqueta falsamente al archivo como dañado.
 */
export function inspectVideoContainer(
  filePath: string,
  options: VideoContainerValidationOptions = {},
): Promise<VideoContainerValidationResult> {
  const ffprobePath = options.ffprobePath?.trim()
    || process.env.FFPROBE_PATH?.trim()
    || "ffprobe";
  const ffmpegPath = options.ffmpegPath?.trim()
    || process.env.FFMPEG_PATH?.trim()
    || "ffmpeg";
  return new Promise((resolve) => {
    execFile(
      ffprobePath,
      [
        "-v", "error",
        "-show_entries", "stream=index,codec_type,codec_name,width,height,duration,avg_frame_rate,r_frame_rate:stream_disposition=attached_pic:format=duration,format_name",
        "-of", "json",
        filePath,
      ],
      {
        timeout: 15_000,
        windowsHide: true,
        maxBuffer: 512 * 1024,
      },
      async (error, stdout) => {
        if (error) {
          if (videoToolMissing(error)) {
            resolve({ valid: false, reason: "validator_unavailable" });
          } else if (videoToolTimedOut(error)) {
            resolve({ valid: false, reason: "validation_timeout" });
          } else {
            resolve({ valid: false, reason: "invalid" });
          }
          return;
        }
        try {
          const parsed = JSON.parse(stdout) as {
            streams?: Array<{
              index?: number;
              codec_type?: string;
              codec_name?: string;
              width?: number;
              height?: number;
              duration?: string;
              avg_frame_rate?: string;
              r_frame_rate?: string;
              disposition?: { attached_pic?: number };
            }>;
            format?: { duration?: string; format_name?: string };
          };
          const video = parsed.streams?.find((stream) => (
            stream.codec_type === "video" && Number(stream.disposition?.attached_pic || 0) !== 1
          ));
          const metadata: ProbedVideoMetadata = {
            streamIndex: Number(video?.index ?? -1),
            codecName: String(video?.codec_name || ""),
            width: Number(video?.width || 0),
            height: Number(video?.height || 0),
            // Preferir la duración de la pista evita buscar más allá del video
            // cuando una pista de audio excepcionalmente más larga determina
            // la duración total del contenedor.
            duration: Number(video?.duration || parsed.format?.duration || 0),
            formatName: String(parsed.format?.format_name || ""),
            attachedPicture: Number(video?.disposition?.attached_pic || 0) === 1,
          };
          const mimeType = options.mimeType?.trim().toLowerCase() || "video/mp4";
          if (!videoMetadataAllowed(mimeType, metadata)) {
            resolve({ valid: false, reason: "invalid" });
            return;
          }

          const frameRate = parseVideoFrameRate(
            video?.avg_frame_rate || video?.r_frame_rate,
          );

          const firstFrame = await decodeVideoFrameAt(
            filePath,
            ffmpegPath,
            metadata.streamIndex,
          );
          if (!firstFrame.valid) {
            resolve(firstFrame);
            return;
          }

          // Revisar también el tramo final impide aceptar cargas parciales cuyo
          // encabezado y primer cuadro son válidos, pero cuyo contenido quedó
          // cortado durante la transferencia. En videos muy breves el primer
          // cuadro ya representa suficientemente el archivo completo.
          // La última marca de tiempo disponible suele ser duración - 1/fps.
          // Considerar ese intervalo evita rechazar videos válidos de baja
          // frecuencia (por ejemplo 1 fps), sin retroceder arbitrariamente en
          // un archivo truncado. Para videos normales se conserva la revisión
          // del último 5 % como barrera de integridad.
          const finalFrameInterval = frameRate > 0 ? 1 / frameRate : 0.5;
          const nearEndSeconds = Math.max(
            0,
            metadata.duration - Math.max(finalFrameInterval, metadata.duration * 0.05),
          );
          resolve(nearEndSeconds >= 0.1
            ? await decodeVideoFrameAt(
              filePath,
              ffmpegPath,
              metadata.streamIndex,
              nearEndSeconds,
            )
            : firstFrame);
        } catch {
          resolve({ valid: false, reason: "validator_unavailable" });
        }
      },
    );
  });
}

export async function validateVideoContainer(
  filePath: string,
  options: VideoContainerValidationOptions = {},
): Promise<boolean> {
  return (await inspectVideoContainer(filePath, options)).valid;
}

async function validateDocx(filePath: string): Promise<boolean> {
  const archive = await JSZip.loadAsync(await fs.readFile(filePath), {
    checkCRC32: true,
    createFolders: false,
  });
  const entries = Object.values(archive.files);
  if (entries.length === 0 || entries.length > 1_000) return false;
  if (!archive.file("[Content_Types].xml") || !archive.file("word/document.xml")) return false;
  if (entries.some((entry) => {
    const normalized = entry.name.replaceAll("\\", "/");
    return normalized.startsWith("/")
      || normalized.split("/").includes("..")
      || /(^|\/)vbaProject\.bin$/i.test(normalized)
      || /\.(exe|dll|js|html?|svg)$/i.test(normalized);
  })) return false;

  let totalDecoded = 0;
  for (const entry of entries) {
    if (entry.dir) continue;
    const declaredSize = Number((entry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize || 0);
    if (!Number.isSafeInteger(declaredSize) || declaredSize < 0 || declaredSize > 25 * 1024 * 1024 - totalDecoded) {
      return false;
    }
    const decoded = await entry.async("uint8array");
    totalDecoded += decoded.byteLength;
    if (totalDecoded > 25 * 1024 * 1024) return false;
  }
  return true;
}

async function validatePptx(filePath: string): Promise<boolean> {
  const archive = await JSZip.loadAsync(await fs.readFile(filePath), {
    checkCRC32: true,
    createFolders: false,
  });
  const entries = Object.values(archive.files);
  if (entries.length === 0 || entries.length > 2_000) return false;
  if (!archive.file("[Content_Types].xml") || !archive.file("ppt/presentation.xml")) return false;
  if (entries.some((entry) => {
    const normalized = entry.name.replaceAll("\\", "/");
    return normalized.startsWith("/")
      || normalized.split("/").includes("..")
      || /(^|\/)vbaProject\.bin$/i.test(normalized)
      || /\.(exe|dll|js|html?|svg)$/i.test(normalized);
  })) return false;
  let totalDecoded = 0;
  for (const entry of entries) {
    if (entry.dir) continue;
    const declaredSize = Number((entry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize || 0);
    if (!Number.isSafeInteger(declaredSize) || declaredSize < 0 || declaredSize > 75 * 1024 * 1024 - totalDecoded) {
      return false;
    }
    totalDecoded += (await entry.async("uint8array")).byteLength;
    if (totalDecoded > 75 * 1024 * 1024) return false;
  }
  return true;
}

export async function validateCvFile(filePath: string, mimeType: string): Promise<boolean> {
  const header = await firstBytes(filePath);
  if (mimeType === "application/pdf") {
    return header.subarray(0, 5).toString("ascii") === "%PDF-";
  }
  if (mimeType === "application/msword") {
    return hasPrefix(header, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  }
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    if (!hasPrefix(header, [0x50, 0x4b, 0x03, 0x04])) return false;
    return validateDocx(filePath).catch(() => false);
  }
  return false;
}

export async function validatePresentationInput(filePath: string, originalName: string): Promise<boolean> {
  const extension = path.extname(originalName).toLowerCase();
  const header = await firstBytes(filePath);
  if (extension === ".pdf") return header.subarray(0, 5).toString("ascii") === "%PDF-";
  if (extension === ".doc" || extension === ".ppt") {
    return hasPrefix(header, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  }
  if (extension === ".docx") {
    return validateDocx(filePath).catch(() => false);
  }
  if (extension === ".pptx") {
    return validatePptx(filePath).catch(() => false);
  }
  if (extension === ".tex" || extension === ".txt" || extension === ".md") {
    const content = await fs.readFile(filePath);
    if (content.includes(0)) return false;
    return !content.toString("utf8").includes("\uFFFD");
  }
  return false;
}

function runClamScan(
  filePath: string,
  timeoutMs = 60_000,
): Promise<"clean" | "infected" | "unavailable"> {
  return new Promise((resolve) => {
    execFile("clamscan", ["--no-summary", "--infected", filePath], {
      timeout: timeoutMs,
      windowsHide: true,
    }, (error) => {
      if (!error) return resolve("clean");
      const exitCode = (error as { code?: unknown }).code;
      if (Number(exitCode) === 1) return resolve("infected");
      resolve("unavailable");
    });
  });
}

export type ClamAvHealth = {
  available: boolean;
  required: boolean;
  version: string | null;
};

export function isClamAvRequired(
  env: { CLAMAV_REQUIRED?: string; NODE_ENV?: string } = process.env,
): boolean {
  return env.CLAMAV_REQUIRED === "true"
    || (env.NODE_ENV === "production" && env.CLAMAV_REQUIRED !== "false");
}

/** Read-only readiness probe. It never scans, opens, moves or removes a file. */
export async function checkClamAvHealth(timeoutMs = 5_000): Promise<ClamAvHealth> {
  const required = isClamAvRequired();
  return new Promise((resolve) => {
    execFile("clamscan", ["--version"], {
      timeout: timeoutMs,
      windowsHide: true,
      maxBuffer: 16 * 1024,
    }, (error, stdout) => {
      if (error) {
        resolve({ available: false, required, version: null });
        return;
      }
      const version = String(stdout || "").split(/\r?\n/, 1)[0].trim().slice(0, 160) || null;
      resolve({ available: true, required, version });
    });
  });
}

export async function scanFileForMalware(filePath: string, timeoutMs = 60_000): Promise<void> {
  const result = await runClamScan(filePath, timeoutMs);
  if (result === "infected") throw new Error("Malware detected");
  const required = isClamAvRequired();
  if (result === "unavailable" && required) {
    throw new Error("Malware scanner unavailable");
  }
}

export async function removeUploadQuietly(filePath?: string): Promise<void> {
  if (!filePath) return;
  await fs.unlink(filePath).catch(() => undefined);
}

export async function cleanExpiredPrivatePresentationInputs(maxAgeMs = 24 * 60 * 60 * 1000): Promise<number> {
  const cutoff = Date.now() - maxAgeMs;
  const entries = await fs.readdir(privatePresentationDir, { withFileTypes: true }).catch(() => []);
  let removed = 0;
  for (const entry of entries) {
    if (!entry.isFile() || !/^[a-f0-9]{32}\.[a-z0-9]{1,5}$/i.test(entry.name)) continue;
    const absolutePath = path.join(privatePresentationDir, entry.name);
    const stats = await fs.stat(absolutePath).catch(() => null);
    if (stats && stats.mtimeMs < cutoff) {
      await fs.unlink(absolutePath).catch(() => undefined);
      removed += 1;
    }
  }
  return removed;
}

export async function acceptQuarantinedCv(
  sourcePath: string,
  mimeType: string,
): Promise<{ absolutePath: string; storagePath: string }> {
  const extension = mimeType === "application/pdf"
    ? ".pdf"
    : mimeType === "application/msword"
      ? ".doc"
      : ".docx";
  const physicalName = securePhysicalFilename(extension);
  const absolutePath = path.join(privateCvDir, physicalName);
  await fs.rename(sourcePath, absolutePath);
  await fs.chmod(absolutePath, 0o600).catch(() => undefined);
  return { absolutePath, storagePath: `private:cvs/${physicalName}` };
}

export async function acceptQuarantinedPublicMedia(sourcePath: string, destinationDir: string): Promise<string> {
  const destination = path.join(destinationDir, path.basename(sourcePath));
  if (path.dirname(path.resolve(destination)) !== path.resolve(destinationDir)) {
    throw new Error("Invalid upload destination");
  }
  await fs.rename(sourcePath, destination);
  await fs.chmod(destination, 0o640).catch(() => undefined);
  return destination;
}

export function resolvePrivateCvStoragePath(storagePath: string): string | null {
  const prefix = "private:cvs/";
  if (!storagePath.startsWith(prefix)) return null;
  const filename = storagePath.slice(prefix.length);
  if (!/^[a-f0-9]{32}\.(pdf|doc|docx)$/.test(filename)) return null;
  const resolved = path.resolve(privateCvDir, filename);
  return path.dirname(resolved) === path.resolve(privateCvDir) ? resolved : null;
}
