import fs from "node:fs";
import path from "node:path";
import { persistentPublicMediaExists } from "../../media/persistentMedia";
import { getMirrorDir } from "../../mirror/config";

type MediaAuditDependencies = {
  cwd?: string;
  mirrorDir?: string;
  persistentExists?: (publicPath: string) => Promise<boolean>;
};

function safeRelativePublicPath(publicUrl: string): string | null {
  const clean = publicUrl.split(/[?#]/, 1)[0];
  if (!clean.startsWith("/") || clean.includes("\\") || clean.includes("\0")) return null;
  try {
    const decoded = decodeURIComponent(clean).replace(/^\/+/, "");
    if (!decoded || decoded.split("/").some((segment) => !segment || segment === "." || segment === "..")) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

function fileExistsInside(root: string, relativePath: string): boolean {
  const absoluteRoot = path.resolve(root);
  const candidate = path.resolve(absoluteRoot, relativePath);
  if (candidate === absoluteRoot || !candidate.startsWith(`${absoluteRoot}${path.sep}`)) return false;
  try {
    return fs.statSync(candidate).isFile();
  } catch {
    return false;
  }
}

/**
 * Comprueba una ruta pública con las mismas fuentes que usa Express: public,
 * uploads, fotografías en attached_assets, el espejo histórico y App Storage.
 * No hace una petición HTTP al propio servidor, por lo que también funciona en
 * pruebas, tareas programadas y durante el arranque.
 */
export async function publicImageAssetExists(
  publicUrl: string,
  dependencies: MediaAuditDependencies = {},
): Promise<boolean> {
  const relativePath = safeRelativePublicPath(publicUrl);
  if (!relativePath) return false;

  const cwd = dependencies.cwd || process.cwd();
  const firstSegment = relativePath.split("/", 1)[0];
  const routeRoots: Record<string, string> = {
    partner_photos: path.join(cwd, "attached_assets", "partner_photos"),
    associate_photos: path.join(cwd, "attached_assets", "associate_photos"),
    of_counsel_photos: path.join(cwd, "attached_assets", "of_counsel_photos"),
    uploads: path.join(cwd, "uploads"),
  };
  const routeRoot = routeRoots[firstSegment];
  if (routeRoot && fileExistsInside(routeRoot, relativePath.slice(firstSegment.length + 1))) {
    return true;
  }

  if (fileExistsInside(path.join(cwd, "public"), relativePath)) return true;

  const mirrorDir = dependencies.mirrorDir || getMirrorDir();
  if (mirrorDir && fileExistsInside(mirrorDir, relativePath)) return true;

  const persistentExists = dependencies.persistentExists || persistentPublicMediaExists;
  return persistentExists(`/${relativePath}`);
}
