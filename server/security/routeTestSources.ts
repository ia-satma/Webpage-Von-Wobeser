import fs from "node:fs";
import path from "node:path";

/**
 * Security tests historically inspected the monolithic server/routes.ts file.
 * Route handlers now live in domain modules, so assertions must inspect the
 * complete route surface instead of assuming one physical source file.
 */
export function readRouteSources(): string {
  const root = process.cwd();
  const routesDirectory = path.join(root, "server", "routes");
  const moduleSources = fs.readdirSync(routesDirectory)
    .filter((name) => name.endsWith(".ts"))
    .sort()
    .map((name) => fs.readFileSync(path.join(routesDirectory, name), "utf8"));
  return [fs.readFileSync(path.join(root, "server", "routes.ts"), "utf8"), ...moduleSources].join("\n");
}
