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

/**
 * Confirma que un video que ya pasó la firma mágica contiene al menos una pista
 * de video legible. En Replit, ClamAV puede no tener su base de firmas disponible
 * durante un despliegue; ffprobe ofrece una segunda validación estructural sin
 * decodificar los 45-200 MB completos ni hacer que la carga tarde varios minutos.
 */
export function validateVideoContainer(filePath: string): Promise<boolean> {
  return new Promise((resolve) => {
    execFile(
      "ffprobe",
      [
        "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=codec_type,codec_name,width,height:format=duration,format_name",
        "-of", "json",
        filePath,
      ],
      {
        timeout: 45_000,
        windowsHide: true,
        maxBuffer: 512 * 1024,
      },
      (error, stdout) => {
        if (error) return resolve(false);
        try {
          const parsed = JSON.parse(stdout) as {
            streams?: Array<{ codec_type?: string; codec_name?: string; width?: number; height?: number }>;
            format?: { duration?: string; format_name?: string };
          };
          const video = parsed.streams?.find((stream) => stream.codec_type === "video");
          const duration = Number(parsed.format?.duration || 0);
          const width = Number(video?.width || 0);
          const height = Number(video?.height || 0);
          resolve(Boolean(
            video?.codec_name
            && Number.isFinite(duration)
            && duration > 0
            && duration <= 60 * 60
            && width > 0
            && height > 0
            && width <= 7680
            && height <= 4320,
          ));
        } catch {
          resolve(false);
        }
      },
    );
  });
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

export async function scanFileForMalware(filePath: string, timeoutMs = 60_000): Promise<void> {
  const result = await runClamScan(filePath, timeoutMs);
  if (result === "infected") throw new Error("Malware detected");
  const required = process.env.CLAMAV_REQUIRED === "true"
    || (process.env.NODE_ENV === "production" && process.env.CLAMAV_REQUIRED !== "false");
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
