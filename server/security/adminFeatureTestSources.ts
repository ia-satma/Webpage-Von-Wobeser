import fs from "node:fs";
import path from "node:path";

export function readAdminFeatureSources(
  feature: string,
  adapterFile: string,
  sharedFeatures: string[] = [],
): string {
  const root = process.cwd();
  const sources = [feature, ...sharedFeatures].flatMap((featureName) => {
    const directory = path.join(root, "client", "src", "features", "admin", featureName);
    return fs.readdirSync(directory)
      .filter((name) => name.endsWith(".ts") || name.endsWith(".tsx"))
      .sort()
      .map((name) => fs.readFileSync(path.join(directory, name), "utf8"));
  });
  const adapter = fs.readFileSync(
    path.join(root, "client", "src", "pages", "admin", adapterFile),
    "utf8",
  );
  return [adapter, ...sources].join("\n");
}
