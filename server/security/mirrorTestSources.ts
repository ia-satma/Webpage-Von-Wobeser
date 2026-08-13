import fs from "node:fs";
import path from "node:path";

const MIRROR_SOURCE_ORDER = [
  "htmlPipeline.ts",
  "runtime.ts",
  "routes/publicRoutes.ts",
  "routes/legacyRedirect.ts",
  "routes/legacyRedirectRoutes.ts",
  "routes/institutionalRoutes.ts",
  "routes/originalRoutes.ts",
  "routes/adminRoutes.ts",
  "routes/assetFallbackRoutes.ts",
  "index.ts",
] as const;

/**
 * Security tests inspect behavior across the complete public mirror. Keeping
 * this list in registration order avoids coupling those contracts back to a
 * monolithic index.ts file.
 */
export function readMirrorSources(): string {
  const directory = path.join(process.cwd(), "server", "mirror");
  return MIRROR_SOURCE_ORDER
    .map((relativePath) => fs.readFileSync(path.join(directory, relativePath), "utf8"))
    .join("\n");
}
