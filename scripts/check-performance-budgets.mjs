import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const mirror = path.join(root, "frontend-mirror");
const limits = {
  poster: 50 * 1024,
  mobileVideo: 1.5 * 1024 * 1024,
  desktopVideo: 4.5 * 1024 * 1024,
  responsiveImage: 850 * 1024,
  initialMobile: 2 * 1024 * 1024,
};

function size(relativePath) {
  return fs.statSync(path.join(mirror, relativePath)).size;
}

assert.ok(size("images/hero-092c5875ed80af62-poster.webp") <= limits.poster, "El póster del hero supera 50 KB.");
assert.ok(size("images/hero-092c5875ed80af62-mobile.mp4") <= limits.mobileVideo, "El video móvil supera 1.5 MB.");
assert.ok(size("images/hero-092c5875ed80af62-desktop.mp4") <= limits.desktopVideo, "El video de escritorio supera 4.5 MB.");

const initialMobileAssets = [
  "images/hero-092c5875ed80af62-mobile.mp4",
  "images/hero-092c5875ed80af62-poster.webp",
  "images/optimized/images/banners/7-a-640.webp",
  "images/optimized/images/banners/1_ind-640.webp",
  "templates/beez3/webfont/AtkinsonHyperlegible-Regular.woff2",
  "templates/beez3/webfont/Gelasio-Variable.woff2",
  "templates/beez3/css/von.css",
  "templates/beez3/css/typography.css",
  "templates/beez3/css/style.css",
  "_vendor/slick/slick.css",
  "templates/beez3/css/print.css",
  "_vendor/jquery/jquery-3.7.1.min.js",
  "templates/beez3/js/min/slick.min.js",
  "templates/beez3/js/min/functions.min.js",
  "images/vw40.png",
  "images/search83.svg",
  "templates/beez3/img/arrow-left.svg",
  "templates/beez3/img/arrow-right.svg",
  "img/favicon.ico",
];
const initialMobileBytes = initialMobileAssets.reduce((total, relativePath) => total + size(relativePath), 0);
assert.ok(
  initialMobileBytes <= limits.initialMobile,
  `La transferencia inicial móvil estimada supera 2 MB (${initialMobileBytes} bytes).`,
);

const optimizedRoot = path.join(mirror, "images", "optimized");
const oversized = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else if (entry.name.endsWith(".webp") && fs.statSync(absolute).size > limits.responsiveImage) {
      oversized.push(path.relative(mirror, absolute));
    }
  }
}
walk(optimizedRoot);
assert.deepEqual(oversized, [], `Variantes responsivas demasiado pesadas: ${oversized.join(", ")}`);
const manifest = JSON.parse(fs.readFileSync(path.join(optimizedRoot, "manifest.json"), "utf8"));
assert.ok(Object.keys(manifest).length >= 200, "El manifiesto responsivo no cubre suficientes imágenes públicas.");

const renderer = fs.readFileSync(path.join(root, "server", "mirror", "renderHome.ts"), "utf8");
assert.match(renderer, /data-bg-mobile=/, "El carrusel debe usar fondos diferidos.");
assert.doesNotMatch(renderer, /style="background-image:url/, "El renderer no debe cargar fondos pesados de forma anticipada.");
assert.match(renderer, /hero-092c5875ed80af62-mobile\.mp4/, "Falta la variante móvil predeterminada.");

console.log(`[performance] Presupuestos aprobados; transferencia móvil estimada: ${initialMobileBytes} bytes.`);
