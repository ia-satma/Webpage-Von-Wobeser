import sharp from "sharp";
import fs from "fs";

const MAX_WIDTH = 2000;
const THRESHOLD_BYTES = 1 * 1024 * 1024; // 1MB — por debajo no vale la pena procesar
const JPEG_QUALITY = 80;
const WEBP_QUALITY = 80;

const IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);

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
