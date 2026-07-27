import fs from "node:fs/promises";
import path from "node:path";

process.env.VWB_PERSISTENT_MEDIA_REQUIRED = "true";

const {
  persistPublicMediaFiles,
  persistentMediaStorageStatus,
} = await import("../server/media/persistentMedia");

const ALLOWED_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".webp", ".gif",
  ".mp4", ".webm", ".ogv", ".ogg", ".mov",
]);

async function walk(directory: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const nested = await Promise.all(entries.map(async (entry) => {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) return walk(absolutePath);
      if (!entry.isFile()) return [];
      return ALLOWED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())
        ? [absolutePath]
        : [];
    }));
    return nested.flat();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

const roots = [
  {
    absolute: path.join(process.cwd(), "uploads"),
    publicPrefix: "/uploads",
  },
  {
    absolute: path.join(process.cwd(), "public", "generated-images"),
    publicPrefix: "/generated-images",
  },
];

const status = await persistentMediaStorageStatus();
if (!status.available || status.provider !== "replit_app_storage") {
  throw new Error(
    "Replit App Storage no está conectado. Créalo o vincúlalo antes de migrar medios.",
  );
}

let migrated = 0;
for (const root of roots) {
  const files = await walk(root.absolute);
  for (const absolutePath of files) {
    const relative = path.relative(root.absolute, absolutePath);
    if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) continue;
    const publicPath = `${root.publicPrefix}/${relative.split(path.sep).join("/")}`;
    await persistPublicMediaFiles([{ absolutePath, publicPath }]);
    migrated += 1;
  }
}

console.log(`[media:migrate-storage] ${migrated} archivos protegidos en App Storage.`);
