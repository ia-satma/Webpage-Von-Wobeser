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
  // Debe quedar al final: sus reglas son correcciones acotadas que neutralizan
  // colisiones de selectores del CSS heredado sin alterar su orden interno.
  path.join(root, "frontend-mirror", "templates", "beez3", "css", "vwb-stability.css"),
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
const adminShell = path.join(root, "client", "index.html");
const sriAssets = new Map([
  ["/templates/beez3/css/public.css", publicCss],
  ["/templates/beez3/css/von.css", sources[0]],
  ["/templates/beez3/css/style.css", sources[1]],
  ["/templates/beez3/css/typography.css", sources[2]],
  ["/_vendor/slick/slick.css", sources[3]],
  // Esta hoja se conserva como respaldo exclusivo de Nuevas oficinas. Al ser
  // pública e inmutable, su SRI debe avanzar junto con cualquier ajuste visual.
  ["/css/estilos_home.css", path.join(root, "frontend-mirror", "css", "estilos_home.css")],
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

// El panel carga la hoja tipográfica directamente para compartir las familias
// institucionales. Su SRI debe avanzar junto con el manifiesto; de otro modo
// los navegadores rechazan la hoja tras cualquier ajuste editorial público.
const typographyIntegrity = `sha384-${createHash("sha384").update(await fs.readFile(sources[2])).digest("base64")}`;
const adminHtml = await fs.readFile(adminShell, "utf8");
const typographyLinkPattern = /(<link\b[^>]*\bhref="\/templates\/beez3\/css\/typography\.css(?:\?[^\"]*)?"[^>]*\bintegrity=")sha384-[^"]+("[^>]*>)/i;
if (!typographyLinkPattern.test(adminHtml)) {
  throw new Error("[public-css] No se encontró el enlace tipográfico con SRI del panel.");
}
const updatedAdminHtml = adminHtml.replace(
  typographyLinkPattern,
  `$1${typographyIntegrity}$2`,
);
if (updatedAdminHtml !== adminHtml) await fs.writeFile(adminShell, updatedAdminHtml);

console.log(`[public-css] ${path.relative(root, publicCss)} actualizado desde ${sources.length} hojas y SRI sincronizado.`);
