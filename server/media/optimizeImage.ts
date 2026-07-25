import sharp from "sharp";
import fs from "fs";
import path from "path";

const MAX_WIDTH = 2000;
const THRESHOLD_BYTES = 1 * 1024 * 1024; // 1MB — por debajo no vale la pena procesar
const JPEG_QUALITY = 80;
const WEBP_QUALITY = 80;
const MAX_SANITIZED_INPUT_PIXELS = 25_000_000;
const MAX_SANITIZED_BYTES = 200 * 1024 * 1024;

const IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);
const RESPONSIVE_WIDTHS = [640, 1280, 1920] as const;

export function canSanitizeRasterMime(mimeType: string): boolean {
  return IMAGE_MIMES.has(mimeType);
}

/**
 * Decodifica y vuelve a codificar un raster antes de sacarlo de cuarentena.
 * Además de comprobar que la imagen es realmente decodificable, elimina EXIF,
 * perfiles y chunks auxiliares que podrían convertirla en un archivo políglota.
 *
 * Este paso permite aceptar PNG/JPEG/WebP saneados cuando ClamAV no está
 * disponible temporalmente. GIF, SVG, documentos y videos no usan este fallback.
 */
export async function sanitizeRasterImage(
  filePath: string,
  mimeType: string,
): Promise<number> {
  if (!canSanitizeRasterMime(mimeType)) {
    throw new Error("Unsupported raster format");
  }

  let pipeline = sharp(filePath, {
    failOn: "warning",
    limitInputPixels: MAX_SANITIZED_INPUT_PIXELS,
  }).rotate();
  const metadata = await pipeline.metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error("Invalid raster dimensions");
  }

  if (mimeType === "image/jpeg") {
    pipeline = pipeline.jpeg({ quality: 90, mozjpeg: true });
  } else if (mimeType === "image/png") {
    pipeline = pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
  } else {
    pipeline = pipeline.webp({ quality: 90, effort: 5 });
  }

  const sanitized = await pipeline.toBuffer();
  if (!sanitized.length || sanitized.length > MAX_SANITIZED_BYTES) {
    throw new Error("Sanitized raster exceeds size limit");
  }
  fs.writeFileSync(filePath, sanitized, { mode: 0o600 });
  return sanitized.length;
}

/**
 * Comprime en el mismo archivo una imagen recién subida si supera el umbral de tamaño:
 * reduce a un ancho máximo razonable (nunca agranda) y recomprime. sharp descarta los
 * metadatos EXIF por defecto (solo se conservan con .withMetadata(), que no se llama aquí).
 * GIF no se toca (podría romper animaciones). Devuelve el tamaño nuevo, o null si no se
 * aplicó ningún cambio (tipo no soportado, ya es chica, o el resultado no fue más pequeño).
 */
export async function optimizeImageIfNeeded(
  filePath: string,
  mimeType: string,
  originalSize: number,
): Promise<number | null> {
  if (!IMAGE_MIMES.has(mimeType) || originalSize <= THRESHOLD_BYTES) return null;
  try {
    let pipeline = sharp(filePath).rotate(); // aplica la orientación EXIF antes de descartarla
    const meta = await pipeline.metadata();
    if (meta.width && meta.width > MAX_WIDTH) {
      pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
    }
    if (mimeType === "image/jpeg") pipeline = pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });
    else if (mimeType === "image/png") pipeline = pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
    else if (mimeType === "image/webp") pipeline = pipeline.webp({ quality: WEBP_QUALITY });

    const buffer = await pipeline.toBuffer();
    if (buffer.length >= originalSize) return null; // el original ya era más chico, no sobrescribir
    fs.writeFileSync(filePath, buffer);
    return buffer.length;
  } catch (e) {
    console.warn("[optimizeImage] No se pudo optimizar", filePath, (e as Error).message);
    return null;
  }
}

/**
 * Genera derivados WebP para el frontend sin reemplazar el archivo maestro.
 * Se usa después de validar y aceptar una imagen pública; los nombres físicos
 * ya son aleatorios, por lo que los derivados tampoco revelan el nombre original.
 */
export async function generateResponsiveImageVariants(filePath: string, mimeType: string): Promise<string[]> {
  if (!IMAGE_MIMES.has(mimeType)) return [];
  try {
    const metadata = await sharp(filePath).metadata();
    if (!metadata.width) return [];
    const outputDirectory = path.join(path.dirname(filePath), "optimized");
    fs.mkdirSync(outputDirectory, { recursive: true });
    const parsed = path.parse(filePath);
    const generated: string[] = [];
    for (const requestedWidth of RESPONSIVE_WIDTHS) {
      if (requestedWidth > metadata.width && requestedWidth !== RESPONSIVE_WIDTHS[0]) continue;
      const width = Math.min(requestedWidth, metadata.width);
      const outputPath = path.join(outputDirectory, `${parsed.name}-${width}.webp`);
      await sharp(filePath)
        .rotate()
        .resize({ width: requestedWidth, withoutEnlargement: true })
        .webp({ quality: requestedWidth <= 640 ? 72 : 76, effort: 5, smartSubsample: true })
        .toFile(outputPath);
      generated.push(outputPath);
    }
    return generated;
  } catch (error) {
    console.warn("[optimizeImage] No se pudieron crear variantes responsivas", (error as Error).message);
    return [];
  }
}
