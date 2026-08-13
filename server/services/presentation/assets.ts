import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import type { RenderOptions } from './contracts';
import { H, W } from './designSystem';

const VW_LOGO_PATH = path.join(process.cwd(), 'attached_assets', 'vonwobeser_logo_hd.png');

interface RasterSlideBuild {
  svg: string;
  image: { path: string; box: { x: number; y: number; w: number; h: number }; cover?: boolean; scrim?: number } | null;
}

export function resolveLocalAsset(url?: string | null): string | null {
  if (!url) return null;
  const clean = url.split('?')[0];
  const map: Record<string, string> = {
    '/uploads/': path.join(process.cwd(), 'uploads'),
    '/generated-images/': path.join(process.cwd(), 'public', 'generated-images'),
  };
  for (const [prefix, dir] of Object.entries(map)) {
    if (clean.startsWith(prefix)) {
      const resolved = path.join(dir, path.basename(clean));
      return fs.existsSync(resolved) ? resolved : null;
    }
  }
  return null;
}

export async function resolveLogoInfo(
  options: RenderOptions,
): Promise<{ path: string; aspect: number } | null> {
  let logoPath: string | null = null;
  if (options.branding === 'custom') logoPath = resolveLocalAsset(options.customLogoUrl);
  if (!logoPath && fs.existsSync(VW_LOGO_PATH)) logoPath = VW_LOGO_PATH;
  if (!logoPath) return null;
  try {
    const metadata = await sharp(logoPath).metadata();
    return { path: logoPath, aspect: (metadata.height || 1) / (metadata.width || 1) };
  } catch {
    return null;
  }
}

export async function rasterizeSlide(
  build: RasterSlideBuild,
  log: (message: string) => void,
): Promise<Buffer> {
  let base = await sharp(Buffer.from(build.svg)).png().toBuffer();
  if (build.image) {
    try {
      const box = build.image.box;
      const fit = build.image.cover ? 'cover' : 'inside';
      let image = sharp(build.image.path).resize(Math.round(box.w), Math.round(box.h), { fit });
      let buffer = await image.png().toBuffer();
      if (build.image.scrim) {
        const dark = await sharp({
          create: {
            width: Math.round(box.w),
            height: Math.round(box.h),
            channels: 4,
            background: { r: 29, g: 29, b: 27, alpha: build.image.scrim },
          },
        }).png().toBuffer();
        buffer = await sharp(buffer).composite([{ input: dark, top: 0, left: 0 }]).png().toBuffer();
      }
      const metadata = await sharp(buffer).metadata();
      const left = Math.round(box.x + (box.w - (metadata.width || box.w)) / 2);
      const top = Math.round(box.y + (box.h - (metadata.height || box.h)) / 2);
      const background = await sharp({
        create: {
          width: W,
          height: H,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
      }).png().toBuffer();
      base = await sharp(background)
        .composite([
          { input: buffer, top, left },
          { input: Buffer.from(build.svg), top: 0, left: 0 },
        ])
        .png()
        .toBuffer();
    } catch (error: any) {
      log(`No se pudo componer la imagen: ${error?.message}`);
    }
  }
  return base;
}

// Se conserva como helper interno aunque el diseño actual usa wordmark textual.
export async function composeLogo(
  buffer: Buffer,
  logo: { path: string; aspect: number } | null,
  _dark: boolean,
): Promise<Buffer> {
  if (!logo) return buffer;
  try {
    const width = 132;
    const height = Math.round(width * logo.aspect);
    const logoBuffer = await sharp(logo.path).resize(width, height, { fit: 'inside' }).png().toBuffer();
    return await sharp(buffer)
      .composite([{ input: logoBuffer, top: H - height - 26, left: W - width - 40 }])
      .png()
      .toBuffer();
  } catch {
    return buffer;
  }
}
