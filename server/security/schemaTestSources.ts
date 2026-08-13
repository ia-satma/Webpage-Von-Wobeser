import fs from "node:fs";
import path from "node:path";

/**
 * Security tests historically inspected the monolithic shared/schema.ts file.
 * Schema declarations now live in domain modules, so assertions inspect the
 * complete public schema surface instead of one physical source file.
 */
export function readSchemaSources(): string {
  const root = process.cwd();
  const modulesDirectory = path.join(root, "shared", "schema");
  const moduleSources = fs.readdirSync(modulesDirectory)
    .filter((name) => name.endsWith(".ts") && !name.startsWith("._"))
    .sort()
    .map((name) => fs.readFileSync(path.join(modulesDirectory, name), "utf8"));

  return [
    fs.readFileSync(path.join(root, "shared", "schema.ts"), "utf8"),
    ...moduleSources,
  ].join("\n");
}
