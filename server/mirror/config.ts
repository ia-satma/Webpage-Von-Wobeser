import fs from "fs";
import path from "path";

/**
 * Resolves the directory that holds the static mirror of the live
 * Von Wobeser site (the original frontend we are wiring to our backend).
 *
 * Defaults to the sibling `mirror/` folder next to the repo (the layout on
 * the dev machine). Override with the MIRROR_DIR env var when the frontend
 * lives elsewhere (e.g. once it is packaged into the repo for deploy).
 */
export function getMirrorDir(): string {
  const fromEnv = process.env.MIRROR_DIR;
  const candidates = [
    fromEnv,
    path.resolve(process.cwd(), "frontend-mirror"), // packaged in-repo (deploy)
    path.resolve(process.cwd(), "dist", "frontend-mirror"),
    path.resolve(process.cwd(), "..", "mirror"), // sibling (dev machine)
    path.resolve(process.cwd(), "mirror"),
  ].filter(Boolean) as string[];

  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "index.html"))) return dir;
  }
  // Fall back to the first candidate so callers get a clear ENOENT path.
  return candidates[0];
}

export function mirrorPath(...segments: string[]): string {
  return path.join(getMirrorDir(), ...segments);
}
