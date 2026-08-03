#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const roots = ["node_modules", "scripts", "server", "shared", "client", "script"]
  .map((directory) => path.join(process.cwd(), directory));
let removed = 0;

async function clean(directory) {
  let entries;
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }

  await Promise.all(entries.map(async (entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.name.startsWith("._")) {
      await fs.rm(absolute, { recursive: true, force: true });
      removed += 1;
      return;
    }
    if (entry.isDirectory()) await clean(absolute);
  }));
}

for (const root of roots) await clean(root);
if (removed > 0) {
  console.log(`[appledouble] ${removed} metadatos temporales retirados del entorno local.`);
}
