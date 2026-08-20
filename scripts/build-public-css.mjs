import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const root = process.cwd();
const publicCss = path.join(root, "frontend-mirror", "templates", "beez3", "css", "public.css");
const sources = [
  path.join(root, "frontend-mirror", "templates", "beez3", "css", "von.css"),
  path.join(root, "frontend-mirror", "templates", "beez3", "css", "style.css"),
  path.join(root, "frontend-mirror", "templates", "beez3", "css", "typography.css"),
  path.join(root, "frontend-mirror", "_vendor", "slick", "slick.css"),
  path.join(root, "public", "vwb-cookie-consent.css"),
];

const sections = await Promise.all(sources.map(async (source) => {
  const content = await fs.readFile(source, "utf8");
  const normalized = content.replace(/[ \t]+$/gm, "").replace(/^ +\t/gm, "\t").trim();
  return `/* source: ${path.relative(root, source)} */\n${normalized}\n`;
}));

await fs.writeFile(publicCss, `${sections.join("\n").trim()}\n`);

// `public.css` se entrega con SRI. El HTML usa ese mismo hash como versión de
// URL, por lo que ambos datos deben cambiar en la misma operación: de otra
// forma un navegador con la hoja anterior en caché la rechaza y cae al CSS
// legado de la captura original. También se actualizan las fuentes de CSS que
// aún pueden servirse de manera individual como respaldo.
const sriManifest = path.join(root, "server", "security", "sriManifest.ts");
const sriAssets = new Map([
  ["/templates/beez3/css/public.css", publicCss],
  ["/templates/beez3/css/von.css", sources[0]],
  ["/templates/beez3/css/style.css", sources[1]],
  ["/templates/beez3/css/typography.css", sources[2]],
  ["/_vendor/slick/slick.css", sources[3]],
  ["/vwb-cookie-consent.css", sources[4]],
  ["/vwb-privacy-preferences.css", sources[4]],
]);

let manifest = await fs.readFile(sriManifest, "utf8");
for (const [url, asset] of sriAssets) {
  const integrity = `sha384-${createHash("sha384").update(await fs.readFile(asset)).digest("base64")}`;
  const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const entry = new RegExp(`(^\\s*"${escapedUrl}":\\s*)"sha384-[^"]+",`, "m");
  if (!entry.test(manifest)) throw new Error(`[public-css] Falta la entrada SRI para ${url}.`);
  manifest = manifest.replace(entry, `$1"${integrity}",`);
}
await fs.writeFile(sriManifest, manifest);

console.log(`[public-css] ${path.relative(root, publicCss)} actualizado desde ${sources.length} hojas y SRI sincronizado.`);
