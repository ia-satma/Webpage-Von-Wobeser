// Genera un preview ESTÁTICO del diseño para GitHub Pages (docs/). Exporta páginas
// clave ya renderizadas (datos reales de la DB) y reescribe las rutas absolutas al
// subpath del Pages del proyecto. node scripts/build-preview.mjs
import fs from "fs";

const B = process.env.VERIFY_BASE || "http://localhost:5050";
const BASE = "/Webpage-Von-Wobeser"; // subpath del GitHub Pages del proyecto
const OUT = "docs";

const api = async (p) => (await fetch(B + p)).json();
const team = await api("/api/team");
const pg = await api("/api/practice-groups");
const ig = await api("/api/industry-groups");
const news = await api("/api/news");
const a = team.find((x) => x.imageUrl)?.slug || team[0].slug; // un abogado con foto si hay
const p = pg[0].slug, i = ig[0].slug;
const n = news.find((x) => x.slug)?.slug;

const PAGES = [
  ["/", "home-es.html", "Inicio (ES)"],
  ["/?lang=en", "home-en.html", "Home (EN)"],
  [`/lawyer/${a}`, "abogado-es.html", "Perfil de abogado (ES)"],
  [`/lawyer/${a}?lang=en`, "abogado-en.html", "Attorney profile (EN)"],
  [`/practice/${p}`, "practica-es.html", "Área de práctica (ES)"],
  [`/practice/${p}?lang=en`, "practica-en.html", "Practice area (EN)"],
  [`/industry/${i}`, "industria-es.html", "Industria/sector (ES)"],
  [`/industry/${i}?lang=en`, "industria-en.html", "Industry (EN)"],
  ["/news", "noticias-es.html", "Listado de noticias (ES)"],
  ["/news?lang=en", "noticias-en.html", "News list (EN)"],
  ...(n ? [[`/news/${n}`, "noticia-es.html", "Noticia (ES)"], [`/news/${n}?lang=en`, "noticia-en.html", "News detail (EN)"]] : []),
];

// Reescribe rutas absolutas "/x" → "/BASE/x" (no toca "//host" ni "https://").
const prefix = (html) =>
  html
    .replace(/(href|src|poster|data-src)="\/(?!\/)/g, `$1="${BASE}/`)
    .replace(/url\((['"]?)\/(?!\/)/g, `url($1${BASE}/`);

fs.mkdirSync(`${OUT}/p`, { recursive: true });
const imgRefs = new Set();
const items = [];
for (const [url, file, label] of PAGES) {
  const html = await (await fetch(B + url)).text();
  for (const m of html.matchAll(/\/(?:images|img|media)\/[^"')\s>]+/g)) imgRefs.add(m[0]);
  fs.writeFileSync(`${OUT}/p/${file}`, prefix(html));
  items.push({ file, label });
  console.log("✓", file);
}
fs.writeFileSync(`${OUT}/_imgrefs.txt`, [...imgRefs].join("\n"));
fs.writeFileSync(`${OUT}/_items.json`, JSON.stringify(items));
console.log(`\n${items.length} páginas exportadas | ${imgRefs.size} imágenes referenciadas`);
