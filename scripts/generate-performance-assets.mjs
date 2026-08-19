import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const mirrorRoot = path.join(root, "frontend-mirror");
const imagesRoot = path.join(mirrorRoot, "images");
const outputRoot = path.join(imagesRoot, "optimized");
const widths = [640, 1280, 1920];
const recognitionWidths = [160, 320];
const brandLogoWidths = [80, 160];
const headerLogoWidths = [220, 440];
const minimumBytes = 256 * 1024;
const supported = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const sourceDirectories = [
  imagesRoot,
  path.join(mirrorRoot, "img"),
];

async function walk(directory) {
  const files = [];
  let entries = [];
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    if (entry.name.startsWith("._") || entry.name === "optimized") continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (supported.has(path.extname(entry.name).toLowerCase())) files.push(absolute);
  }
  return files;
}

function outputBase(source) {
  const relative = path.relative(mirrorRoot, source);
  const parsed = path.parse(relative);
  return path.join(outputRoot, parsed.dir, parsed.name);
}

function variantWidths(source) {
  const relative = path.relative(mirrorRoot, source).split(path.sep).join("/");
  if (relative.startsWith("images/recognitions/2026/")) return recognitionWidths;
  if (relative === "images/vw40F.png") return brandLogoWidths;
  if (relative === "images/vw40.png") return headerLogoWidths;
  return widths;
}

function shouldOptimize(source, stat) {
  const relative = path.relative(mirrorRoot, source).split(path.sep).join("/");
  return stat.size >= minimumBytes
    || relative.startsWith("images/recognitions/2026/")
    || relative === "images/vw40.png"
    || relative === "images/vw40F.png";
}

async function generate(source) {
  const stat = await fs.stat(source);
  const metadata = await sharp(source).metadata();
  if (!metadata.width || !metadata.height) return { generated: [], metadata };
  if (!shouldOptimize(source, stat)) return { generated: [], metadata };
  const base = outputBase(source);
  await fs.mkdir(path.dirname(base), { recursive: true });
  const generated = [];
  const sourceWidths = variantWidths(source);
  for (const width of sourceWidths) {
    if (width > metadata.width && width !== sourceWidths[0]) continue;
    const target = `${base}-${Math.min(width, metadata.width)}.webp`;
    await sharp(source)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: width <= 640 ? 72 : 76, effort: 6, smartSubsample: true })
      .toFile(target);
    generated.push(target);
  }
  return { generated, metadata };
}

const sourceFiles = [...new Set([
  ...(await Promise.all(sourceDirectories.map(walk))).flat(),
])];
let generatedCount = 0;
const manifest = {};
for (const source of sourceFiles) {
  const { generated, metadata } = await generate(source);
  generatedCount += generated.length;
  if (!metadata.width || !metadata.height) continue;
  const publicSource = `/${path.relative(mirrorRoot, source).split(path.sep).join("/")}`;
  manifest[publicSource] = {
    width: metadata.width,
    height: metadata.height,
    variants: generated.map((absolute) => {
      const match = absolute.match(/-(\d+)\.webp$/);
      return {
        url: `/${path.relative(mirrorRoot, absolute).split(path.sep).join("/")}`,
        width: Number(match?.[1] || 0),
      };
    }).filter((variant) => variant.width > 0),
  };
}
await fs.writeFile(
  path.join(outputRoot, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
console.log(`[performance-assets] ${generatedCount} variantes WebP generadas desde ${sourceFiles.length} imágenes.`);
