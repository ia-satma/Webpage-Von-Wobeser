import fs from "node:fs/promises";
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
console.log(`[public-css] ${path.relative(root, publicCss)} actualizado desde ${sources.length} hojas.`);
