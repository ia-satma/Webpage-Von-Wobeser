import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const sourceRoot = path.join(root, "attached_assets");
const outputRoot = path.join(root, "public", "optimized-attorney-photos");
const groups = ["partner_photos", "associate_photos", "of_counsel_photos"];
const widths = [320, 640];
const supported = new Set([".jpg", ".jpeg", ".png", ".webp"]);

async function sourceFiles(group) {
  const directory = path.join(sourceRoot, group);
  const entries = await fs.readdir(directory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && !entry.name.startsWith("._") && supported.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => path.join(directory, entry.name));
}

let generated = 0;
let skipped = 0;
for (const group of groups) {
  const files = await sourceFiles(group);
  const directory = path.join(outputRoot, group);
  await fs.mkdir(directory, { recursive: true });

  for (const source of files) {
    const parsed = path.parse(source);
    const metadata = await sharp(source).rotate().metadata();
    if (!metadata.width || !metadata.height) {
      skipped += 1;
      continue;
    }
    for (const width of widths) {
      const target = path.join(directory, `${parsed.name}-${Math.min(width, metadata.width)}.webp`);
      await sharp(source)
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: width <= 320 ? 70 : 74, effort: 6, smartSubsample: true })
        .toFile(target);
      generated += 1;
    }
  }

  // Los volúmenes externos de macOS pueden acompañar cada WebP con un
  // AppleDouble `._*`. No es contenido web y tampoco debe contaminar el
  // presupuesto ni el artefacto de despliegue.
  const generatedEntries = await fs.readdir(directory);
  await Promise.all(generatedEntries
    .filter((entry) => entry.startsWith("._"))
    .map((entry) => fs.unlink(path.join(directory, entry))));
}

const outputEntries = await fs.readdir(outputRoot);
await Promise.all(outputEntries
  .filter((entry) => entry.startsWith("._"))
  .map((entry) => fs.unlink(path.join(outputRoot, entry))));

console.log(`[attorney-images] ${generated} variantes WebP creadas${skipped ? `; ${skipped} archivos omitidos` : ""}.`);
