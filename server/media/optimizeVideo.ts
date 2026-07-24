import { execFile } from "child_process";
import { promisify } from "util";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";

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

export type HeroVideoVariants = {
  desktopPath: string;
  mobilePath: string;
  posterPath: string;
  desktopBytes: number;
  mobileBytes: number;
  posterBytes: number;
};

const FFMPEG_TIMEOUT_MS = 4 * 60 * 1000;

async function runFfmpeg(args: string[]): Promise<void> {
  if (!(await hasFfmpeg())) throw new Error("FFmpeg no está disponible en este entorno.");
  await execFileAsync("ffmpeg", args, {
    timeout: FFMPEG_TIMEOUT_MS,
    maxBuffer: 2 * 1024 * 1024,
  });
}

/**
 * Crea las tres piezas atómicas que necesita el hero: escritorio, móvil y póster.
 * El archivo original permanece intacto. Solo después de producir las tres piezas
 * se mueven al directorio público definitivo.
 */
export async function generateHeroVideoVariants(
  sourcePath: string,
  outputDirectory: string,
  publicBase = "/uploads/hero",
): Promise<HeroVideoVariants> {
  const sourceStat = await fs.stat(sourcePath);
  const fingerprint = crypto
    .createHash("sha256")
    .update(`hero-hq-v2:${path.basename(sourcePath)}:${sourceStat.size}:${sourceStat.mtimeMs}`)
    .digest("hex")
    .slice(0, 16);
  const desktopName = `hero-${fingerprint}-desktop.mp4`;
  const mobileName = `hero-${fingerprint}-mobile.mp4`;
  const posterName = `hero-${fingerprint}-poster.webp`;
  const finalDesktop = path.join(outputDirectory, desktopName);
  const finalMobile = path.join(outputDirectory, mobileName);
  const finalPoster = path.join(outputDirectory, posterName);

  await fs.mkdir(outputDirectory, { recursive: true });
  try {
    const [desktop, mobile, poster] = await Promise.all([
      fs.stat(finalDesktop),
      fs.stat(finalMobile),
      fs.stat(finalPoster),
    ]);
    return {
      desktopPath: `${publicBase}/${desktopName}`,
      mobilePath: `${publicBase}/${mobileName}`,
      posterPath: `${publicBase}/${posterName}`,
      desktopBytes: desktop.size,
      mobileBytes: mobile.size,
      posterBytes: poster.size,
    };
  } catch {
    // Alguna variante no existe todavía: se vuelve a generar el conjunto completo.
  }

  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "vwb-hero-"));
  const temporaryDesktop = path.join(temporaryDirectory, desktopName);
  const temporaryMobile = path.join(temporaryDirectory, mobileName);
  const temporaryPng = path.join(temporaryDirectory, "poster.png");
  const temporaryPoster = path.join(temporaryDirectory, posterName);
  try {
    await runFfmpeg([
      "-y", "-ss", "1", "-i", sourcePath, "-an",
      "-vf", "scale=960:540:force_original_aspect_ratio=decrease:force_divisible_by=2",
      "-c:v", "libx264", "-profile:v", "high", "-level", "3.1",
      "-preset", "slow", "-crf", "21", "-pix_fmt", "yuv420p",
      "-movflags", "+faststart", temporaryDesktop,
    ]);
    await runFfmpeg([
      "-y", "-ss", "1", "-i", sourcePath, "-an",
      "-vf", "scale=640:360:force_original_aspect_ratio=decrease:force_divisible_by=2",
      "-c:v", "libx264", "-profile:v", "high", "-level", "3.0",
      "-preset", "slow", "-crf", "24", "-pix_fmt", "yuv420p",
      "-movflags", "+faststart", temporaryMobile,
    ]);
    await runFfmpeg([
      "-y", "-ss", "1", "-i", sourcePath, "-frames:v", "1",
      "-vf", "scale=960:540:force_original_aspect_ratio=decrease",
      temporaryPng,
    ]);
    await sharp(temporaryPng).webp({ quality: 76, effort: 5 }).toFile(temporaryPoster);

    await fs.rename(temporaryDesktop, finalDesktop);
    await fs.rename(temporaryMobile, finalMobile);
    await fs.rename(temporaryPoster, finalPoster);
    const [desktop, mobile, poster] = await Promise.all([
      fs.stat(finalDesktop),
      fs.stat(finalMobile),
      fs.stat(finalPoster),
    ]);
    return {
      desktopPath: `${publicBase}/${desktopName}`,
      mobilePath: `${publicBase}/${mobileName}`,
      posterPath: `${publicBase}/${posterName}`,
      desktopBytes: desktop.size,
      mobileBytes: mobile.size,
      posterBytes: poster.size,
    };
  } finally {
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
}
