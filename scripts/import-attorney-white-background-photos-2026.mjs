import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";
import sharp from "sharp";
import { getPostgresConnectionConfig } from "../shared/postgres-config.mjs";

const root = process.cwd();
const expectedPcloudCode = "kZSAiJJZYvzCjfqcKhbUBKgbiY3tXzWNYwNk";
const expectedTargetCount = 131;
const expectedUnchangedSlugs = new Set([
  "pablo-saez-williams",
  "jaime-antonio-sanchez",
  "mariana-gomez-vallin",
  "mercedes-jimenez-roel",
  "ricardo-rosas",
  "juan-arturo-ramos-robles",
  "patricio-cortina",
  "miguel-angel-chinchilla",
  "victor-delgado",
  "margarita-lima",
  "maria-elisa-vera-madrigal",
]);

const roleConfig = {
  Partner: { pcloudFolder: "1. Socios", assetsDirectory: "partner_photos", route: "/partner_photos" },
  Associate: { pcloudFolder: "4. Asociados", assetsDirectory: "associate_photos", route: "/associate_photos" },
  "Of Counsel": { pcloudFolder: "2. Of Counsel", assetsDirectory: "of_counsel_photos", route: "/of_counsel_photos" },
  Counsel: { pcloudFolder: "3. Consejeros (counsel)", assetsDirectory: "counsel_photos", route: "/counsel_photos" },
};

// La única excepción editorial autorizada. Todas las demás coincidencias son
// estrictas por categoría y nombre normalizado.
const explicitSourceNameBySlug = new Map([
  ["edmond-grieger", "Edmond Grieger (para eventos).png"],
]);

const args = new Map(process.argv.slice(2).map((argument, index, values) => {
  if (!argument.startsWith("--")) return ["", ""];
  const [key, inlineValue] = argument.slice(2).split("=", 2);
  return [key, inlineValue ?? values[index + 1]];
}));
const sourceRoot = args.get("source-root");
const pcloudIndexPath = args.get("pcloud-index");
const shouldApply = args.has("apply");
const manifestPath = path.join(root, "server", "content", "attorneyPhotoRefresh2026.json");

function usage() {
  console.error("Usage: node scripts/import-attorney-white-background-photos-2026.mjs --source-root <extracted-pcloud-folder> --pcloud-index <publink-html> --apply");
  process.exitCode = 1;
}

function normalizeIdentity(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\.(?:png|jpe?g|webp)$/i, "")
    .replace(/^\s*\d+(?:\.\d+)*\.?\s*/, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function listFiles(directory, relative = "") {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const output = [];
  for (const entry of entries) {
    const nextRelative = path.join(relative, entry.name);
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      output.push(...await listFiles(absolute, nextRelative));
      continue;
    }
    if (entry.isFile()) output.push({ absolute, relative: nextRelative, filename: entry.name });
  }
  return output;
}

function categoryFromRelativePath(relativePath) {
  for (const [role, config] of Object.entries(roleConfig)) {
    if (relativePath.split(path.sep).includes(config.pcloudFolder)) return role;
  }
  return null;
}

function parsePcloudIndex(html) {
  const token = "var publinkData = ";
  const start = html.indexOf(token);
  const end = html.indexOf(";\n", start);
  if (start === -1 || end === -1) throw new Error("No se encontró publinkData en el índice de pCloud.");
  const data = JSON.parse(html.slice(start + token.length, end));
  if (data.code !== expectedPcloudCode) throw new Error("El índice de pCloud no corresponde a la carpeta aprobada.");

  const files = [];
  function walk(node, parents = []) {
    if (!node || typeof node !== "object") return;
    if (node.isfolder && Array.isArray(node.contents)) {
      for (const child of node.contents) walk(child, [...parents, node.name].filter(Boolean));
      return;
    }
    if (node.isfolder === false && node.fileid && node.name) {
      const role = Object.entries(roleConfig).find(([, config]) => parents.includes(config.pcloudFolder))?.[0] || null;
      files.push({
        role,
        filename: node.name,
        fileId: String(node.fileid),
        width: node.width,
        height: node.height,
        size: node.size,
        relativePath: [...parents, node.name].join("/"),
      });
    }
  }
  walk(data.metadata);
  return { data, files };
}

function indexByKey(items, keyFor) {
  const indexed = new Map();
  for (const item of items) {
    const key = keyFor(item);
    const values = indexed.get(key) || [];
    values.push(item);
    indexed.set(key, values);
  }
  return indexed;
}

if (!sourceRoot || !pcloudIndexPath || !shouldApply) usage();

const [sourceFiles, pcloudHtml] = await Promise.all([
  listFiles(sourceRoot),
  fs.readFile(pcloudIndexPath, "utf8"),
]);
const { data: pcloudData, files: pcloudFiles } = parsePcloudIndex(pcloudHtml);
const pngFiles = sourceFiles
  .filter((file) => file.filename.toLowerCase().endsWith(".png") && !file.filename.startsWith("._"))
  .map((file) => ({ ...file, role: categoryFromRelativePath(file.relative) }))
  .filter((file) => file.role);

if (pngFiles.length !== 172) throw new Error(`Inventario de PNG inesperado: ${pngFiles.length}; se esperaban 172.`);
if (pcloudFiles.filter((file) => file.filename.toLowerCase().endsWith(".png")).length !== 172) {
  throw new Error("El índice de pCloud no contiene los 172 PNG esperados.");
}

const filesByKey = indexByKey(pngFiles, (file) => `${file.role}:${normalizeIdentity(file.filename)}`);
const pcloudByKey = indexByKey(
  pcloudFiles.filter((file) => file.filename.toLowerCase().endsWith(".png")),
  (file) => `${file.role}:${normalizeIdentity(file.filename)}`,
);

const client = new pg.Client({
  ...getPostgresConnectionConfig(process.env.DATABASE_MIGRATION_URL || process.env.DATABASE_URL),
});
await client.connect();
const { rows: members } = await client.query(`
  SELECT slug, name, title, image_url, published
  FROM team_members
  WHERE title = ANY($1::text[])
  ORDER BY title, slug
`, [Object.keys(roleConfig)]);
await client.end();

if (members.length !== 142) throw new Error(`Directorio inesperado: ${members.length} perfiles; se esperaban 142.`);

const approved = [];
const unchanged = [];
for (const member of members) {
  const config = roleConfig[member.title];
  if (!config) throw new Error(`Categoría no admitida para ${member.slug}: ${member.title}`);
  const normalizedSource = explicitSourceNameBySlug.has(member.slug)
    ? normalizeIdentity(explicitSourceNameBySlug.get(member.slug))
    : normalizeIdentity(member.name);
  const key = `${member.title}:${normalizedSource}`;
  const fileMatches = filesByKey.get(key) || [];
  const pcloudMatches = pcloudByKey.get(key) || [];

  if (fileMatches.length === 1 && pcloudMatches.length === 1 && !expectedUnchangedSlugs.has(member.slug)) {
    approved.push({ member, config, source: fileMatches[0], pcloud: pcloudMatches[0] });
    continue;
  }
  unchanged.push({
    slug: member.slug,
    name: member.name,
    title: member.title,
    reason: expectedUnchangedSlugs.has(member.slug) ? "approved-omission" : "no-exact-approved-source",
  });
}

const unchangedSlugs = new Set(unchanged.map((item) => item.slug));
if (approved.length !== expectedTargetCount || unchanged.length !== 11 || unchangedSlugs.size !== expectedUnchangedSlugs.size || [...unchangedSlugs].some((slug) => !expectedUnchangedSlugs.has(slug))) {
  throw new Error(`Preflight no seguro: ${approved.length} aprobados y ${unchanged.length} sin cambio. Se esperaban ${expectedTargetCount} y 11.`);
}

const manifestProfiles = [];
for (const item of approved) {
  const sourceBuffer = await fs.readFile(item.source.absolute);
  const sourceMetadata = await sharp(sourceBuffer, { failOn: "error" }).metadata();
  if (!sourceMetadata.width || !sourceMetadata.height || sourceMetadata.format !== "png") {
    throw new Error(`PNG inválido: ${item.source.relative}`);
  }
  if (sourceMetadata.width !== item.pcloud.width || sourceMetadata.height !== item.pcloud.height) {
    throw new Error(`Dimensiones distintas a pCloud para ${item.member.slug}.`);
  }
  const targetFilename = `${item.member.slug}-2026-white-bg.png`;
  const targetAbsolute = path.join(root, "attached_assets", item.config.assetsDirectory, targetFilename);
  const targetImageUrl = `${item.config.route}/${targetFilename}`;
  const digest = sha256(sourceBuffer);
  try {
    const existing = await fs.readFile(targetAbsolute);
    if (sha256(existing) !== digest) throw new Error(`El destino versionado ya existe con contenido distinto: ${targetImageUrl}`);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      await fs.mkdir(path.dirname(targetAbsolute), { recursive: true });
      await fs.writeFile(targetAbsolute, sourceBuffer, { flag: "wx" });
    } else if (error?.message?.startsWith("El destino versionado")) {
      throw error;
    } else if (error?.code !== "ENOENT") {
      throw error;
    }
  }
  manifestProfiles.push({
    slug: item.member.slug,
    expectedName: item.member.name,
    role: item.member.title,
    previousImageUrl: item.member.image_url,
    targetImageUrl,
    source: {
      category: item.member.title,
      originalFilename: item.pcloud.filename,
      relativePath: item.pcloud.relativePath,
      fileId: item.pcloud.fileId,
      width: sourceMetadata.width,
      height: sourceMetadata.height,
      bytes: sourceBuffer.byteLength,
      sha256: digest,
    },
  });
}

manifestProfiles.sort((left, right) => left.slug.localeCompare(right.slug));
const manifest = {
  version: 1,
  generatedAt: "2026-08-29",
  source: {
    provider: "pcloud",
    publicLinkCode: pcloudData.code,
    folderName: pcloudData.metadata?.name || "Fotografías fondo blanco",
    downloadUrl: pcloudData.downloadlink,
  },
  approvedCount: manifestProfiles.length,
  unchangedCount: unchanged.length,
  profiles: manifestProfiles,
  unchangedProfiles: unchanged.sort((left, right) => left.slug.localeCompare(right.slug)),
};
await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

const byRole = Object.fromEntries(Object.keys(roleConfig).map((role) => [role, manifestProfiles.filter((profile) => profile.role === role).length]));
console.log(JSON.stringify({ status: "applied", approved: manifestProfiles.length, unchanged: unchanged.length, byRole, manifest: path.relative(root, manifestPath) }, null, 2));
