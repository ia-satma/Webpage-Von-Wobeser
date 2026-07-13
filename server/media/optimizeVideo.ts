import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

// Compresión de video vía ffmpeg. APAGADA por decisión: ffmpeg está confirmado en esta máquina
// de desarrollo pero NO se ha verificado su disponibilidad en el servidor de producción (Replit).
// Se deja lista y con detección de binario para no romper la subida si el binario falta; se
// activa cambiando ENABLED a true una vez confirmado ffmpeg en el entorno real.
const ENABLED = false;

let ffmpegAvailable: boolean | null = null;

/** Detecta una sola vez si el binario ffmpeg existe en este entorno (no revienta si falta). */
async function hasFfmpeg(): Promise<boolean> {
  if (ffmpegAvailable != null) return ffmpegAvailable;
  try {
    await execFileAsync("ffmpeg", ["-version"]);
    ffmpegAvailable = true;
  } catch {
    ffmpegAvailable = false;
  }
  return ffmpegAvailable;
}

/**
 * Recomprime un video en el mismo archivo (H.264, CRF razonable) si ffmpeg está disponible.
 * No-op silencioso si ENABLED=false o si el binario no existe — nunca rompe la subida original.
 * Devuelve el tamaño nuevo, o null si no se aplicó ningún cambio.
 */
export async function optimizeVideoIfNeeded(
  filePath: string,
  mimeType: string,
  originalSize: number,
): Promise<number | null> {
  if (!ENABLED) return null;
  if (!mimeType.startsWith("video/")) return null;
  if (!(await hasFfmpeg())) {
    console.warn("[optimizeVideo] ffmpeg no disponible en este entorno; se omite la compresión.");
    return null;
  }
  const tmpPath = `${filePath}.optimized.mp4`;
  try {
    await execFileAsync("ffmpeg", [
      "-y", "-i", filePath,
      "-c:v", "libx264", "-crf", "26", "-preset", "veryfast",
      "-c:a", "aac", "-b:a", "128k",
      "-movflags", "+faststart",
      tmpPath,
    ]);
    const fs = await import("fs");
    const newSize = fs.statSync(tmpPath).size;
    if (newSize >= originalSize) { fs.unlinkSync(tmpPath); return null; }
    fs.renameSync(tmpPath, filePath);
    return newSize;
  } catch (e) {
    console.warn("[optimizeVideo] No se pudo optimizar", filePath, (e as Error).message);
    return null;
  }
}
