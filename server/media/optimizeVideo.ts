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

type VideoProbe = {
  duration: number;
  width: number;
  height: number;
  codec: string;
  profile: string;
  pixelFormat: string;
  codecTag: string;
  hasAudio: boolean;
};

// Un maestro de hasta 200 MB puede tardar varios minutos en una instancia Autoscale.
// El preset `medium` conserva mejor el detalle del maestro Full HD sin llevar el
// tiempo de espera administrativo al coste del preset `slow`.
const FFMPEG_TIMEOUT_MS = 8 * 60 * 1000;

async function runFfmpeg(args: string[]): Promise<void> {
  if (!(await hasFfmpeg())) throw new Error("FFmpeg no está disponible en este entorno.");
  await execFileAsync("ffmpeg", args, {
    timeout: FFMPEG_TIMEOUT_MS,
    maxBuffer: 2 * 1024 * 1024,
  });
}

async function probeVideo(filePath: string): Promise<VideoProbe> {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration:stream=codec_type,codec_name,profile,width,height,pix_fmt,codec_tag_string",
    "-of", "json",
    filePath,
  ], {
    timeout: FFMPEG_TIMEOUT_MS,
    maxBuffer: 2 * 1024 * 1024,
  });
  const parsed = JSON.parse(stdout) as {
    format?: { duration?: string };
    streams?: Array<{
      codec_type?: string;
      codec_name?: string;
      profile?: string;
      width?: number;
      height?: number;
      pix_fmt?: string;
      codec_tag_string?: string;
    }>;
  };
  const video = parsed.streams?.find((stream) => stream.codec_type === "video");
  if (!video || !video.codec_name || !video.width || !video.height) {
    throw new Error("El video no contiene una pista de imagen reproducible o su contenedor está dañado.");
  }
  const duration = Number(parsed.format?.duration);
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("No fue posible leer la duración del video.");
  }
  return {
    duration,
    width: video.width,
    height: video.height,
    codec: video.codec_name,
    profile: video.profile ?? "",
    pixelFormat: video.pix_fmt ?? "",
    codecTag: video.codec_tag_string ?? "",
    hasAudio: Boolean(parsed.streams?.some((stream) => stream.codec_type === "audio")),
  };
}

async function assertHeroVariant(
  filePath: string,
  source: VideoProbe,
  variant: "desktop" | "mobile",
): Promise<void> {
  const probe = await probeVideo(filePath);
  const maxWidth = variant === "desktop" ? 1920 : 1280;
  const maxHeight = variant === "desktop" ? 1080 : 720;
  if (
    probe.codec !== "h264"
    || probe.pixelFormat !== "yuv420p"
    || probe.codecTag !== "avc1"
    || probe.hasAudio
    || probe.width > maxWidth
    || probe.height > maxHeight
    || probe.duration < source.duration - 1.5
    || probe.duration > source.duration + 1.5
  ) {
    throw new Error(`La variante ${variant} no cumple el formato de publicación del video.`);
  }
}

async function assertPoster(filePath: string): Promise<void> {
  const [metadata, stat] = await Promise.all([sharp(filePath).metadata(), fs.stat(filePath)]);
  if (metadata.format !== "webp" || !metadata.width || !metadata.height || stat.size > 160 * 1024) {
    throw new Error("El póster del video no pudo validarse.");
  }
}

/** Publica un derivado de forma atómica incluso cuando /tmp y el directorio
 * público están en volúmenes distintos (por ejemplo, disco externo o Replit). */
async function publishGeneratedFile(sourcePath: string, destinationPath: string): Promise<void> {
  try {
    await fs.rename(sourcePath, destinationPath);
    return;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EXDEV") throw error;
  }

  const stagedPath = `${destinationPath}.staged-${crypto.randomBytes(6).toString("hex")}`;
  try {
    await fs.copyFile(sourcePath, stagedPath);
    await fs.rename(stagedPath, destinationPath);
    await fs.unlink(sourcePath);
  } catch (error) {
    await fs.rm(stagedPath, { force: true }).catch(() => undefined);
    throw error;
  }
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
  const sourceProbe = await probeVideo(sourcePath);
  const fingerprint = crypto
    .createHash("sha256")
    .update(`hero-stream-v10-hd-mobile-bitrate-master:${path.basename(sourcePath)}:${sourceStat.size}:${sourceStat.mtimeMs}`)
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
    await Promise.all([
      assertHeroVariant(finalDesktop, sourceProbe, "desktop"),
      assertHeroVariant(finalMobile, sourceProbe, "mobile"),
      assertPoster(finalPoster),
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
      "-y", "-i", sourcePath, "-map", "0:v:0", "-an",
      "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease:force_divisible_by=2,fps=24",
      "-c:v", "libx264", "-profile:v", "high", "-level", "4.1",
      "-preset", "medium", "-crf", "20", "-maxrate", "3500k", "-bufsize", "7000k",
      "-pix_fmt", "yuv420p",
      "-tag:v", "avc1",
      "-movflags", "+faststart", temporaryDesktop,
    ]);

    const encodeMobile = async (crf: string, maxRate: string, bufferSize: string): Promise<void> => {
      await runFfmpeg([
        "-y", "-i", sourcePath, "-map", "0:v:0", "-an",
        "-vf", "scale=1280:720:force_original_aspect_ratio=decrease:force_divisible_by=2,fps=24",
        "-c:v", "libx264", "-profile:v", "high", "-level", "4.0",
        "-preset", "medium", "-crf", crf, "-maxrate", maxRate, "-bufsize", bufferSize,
        "-pix_fmt", "yuv420p",
        "-tag:v", "avc1",
        "-movflags", "+faststart", temporaryMobile,
      ]);
    };
    await encodeMobile("19", "3200k", "6400k");
    if ((await fs.stat(temporaryMobile)).size > 26 * 1024 * 1024) {
      await encodeMobile("21", "2600k", "5200k");
    }
    if ((await fs.stat(temporaryMobile)).size > 26 * 1024 * 1024) {
      throw new Error("No fue posible crear una variante móvil HD de alta tasa dentro del presupuesto de 26 MB.");
    }
    await runFfmpeg([
      "-y", "-ss", "1", "-i", sourcePath, "-frames:v", "1",
      "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease",
      temporaryPng,
    ]);
    await sharp(temporaryPng).webp({ quality: 68, effort: 5 }).toFile(temporaryPoster);

    await Promise.all([
      assertHeroVariant(temporaryDesktop, sourceProbe, "desktop"),
      assertHeroVariant(temporaryMobile, sourceProbe, "mobile"),
      assertPoster(temporaryPoster),
    ]);

    await publishGeneratedFile(temporaryDesktop, finalDesktop);
    await publishGeneratedFile(temporaryMobile, finalMobile);
    await publishGeneratedFile(temporaryPoster, finalPoster);
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
