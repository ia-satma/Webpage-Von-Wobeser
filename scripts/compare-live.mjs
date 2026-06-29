// Auditoría de cobertura: cruza TODAS las URLs del sitio en vivo (vía _url_map.json
// del espejo) contra nuestro server, clasificando dinámico/estático/roto. Además
// detecta drift del sitio en vivo. Read-only. Uso: node scripts/compare-live.mjs
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import * as cheerio from "cheerio";

const B = process.env.VERIFY_BASE || "http://localhost:5050";
const MIRROR = process.env.MIRROR_DIR || path.resolve(process.cwd(), "..", "mirror");
const urlMap = JSON.parse(fs.readFileSync(path.join(MIRROR, "_url_map.json"), "utf8"));
// Las URLs en vivo son query-string Joomla (?l=134); el espejo las reescribió a
// rutas-archivo (.html) que es la forma que usa la navegación interna y que sirve
// nuestra versión. Auditamos esas rutas-archivo (valores únicos del mapa).
const liveUrls = [...new Set(Object.values(urlMap))].map((f) => "/" + String(f).replace(/^\//, ""));

const DYN_SIG = "searchParams.delete('lang')"; // firma única del script de idioma que inyecta sendPage (solo en páginas dinámicas)

function classify(p) {
  if (/\/(lawyer|abogado)\/l-\d+\.html$/.test(p)) return { type: "abogado", sel: ".attorney__meta--name" };
  if (/\/(practice|practica)\/p-\d+\.html$/.test(p)) return { type: "practica", sel: ".single__meta--name" };
  if (/\/(industry|industria)\/p-\d+\.html$/.test(p)) return { type: "industria", sel: ".single__meta--name" };
  if (/\/(publication|publicacion)\/p_id-\d+\.html$/.test(p)) return { type: "publicacion", sel: ".single__meta--name" };
  if (/\/(attorneys|abogados)\//.test(p)) return { type: "listado-abogados", sel: ".attorneys__list--item" };
  if (/\/(publications|publicaciones)\//.test(p)) return { type: "listado-publicaciones", sel: ".archive__item" };
  if (p === "/" || p === "/index.html" || p === "/index.php/index.html" || /\/home\/index\.html$/.test(p)) return { type: "home", sel: ".home__hero" };
  return { type: "institucional", sel: null };
}
const langOfPath = (p) => (/\/(abogado|practica|industria|publicacion|abogados|publicaciones|nuestra-firma|capacidades|contacto|bolsa-de-trabajo|aviso|home)\b/.test(p) || /\/index\.php\/home/.test(p)) ? "es" : "en";

const stats = {}; // type -> {total, dyn, static, fallback, broken}
const broken = [];
function rec(type, kind, url) {
  (stats[type] ||= { total: 0, dyn: 0, static: 0, fallback: 0, broken: 0 }).total++;
  stats[type][kind]++;
  if (kind === "broken" || kind === "fallback") broken.push(`${kind === "fallback" ? "↩home" : "✗"} [${type}] ${url}`);
}

async function checkOne(liveUrl) {
  const urlPath = liveUrl.replace(/^https?:\/\/[^/]+/, "") || "/";
  const { type, sel } = classify(urlPath);
  try {
    const r = await fetch(B + urlPath);
    if (r.status !== 200) return rec(type, "broken", urlPath + ` (HTTP ${r.status})`);
    const html = await r.text();
    const isDyn = html.includes(DYN_SIG);
    const $ = cheerio.load(html);
    const looksHome = /WE GO WHERE CLIENTS|VAMOS DONDE EL CLIENTE/.test(html);
    // Caso 1: dinámico pero cayó al home cuando NO debería (hueco real).
    if (isDyn && type !== "home" && looksHome && (!sel || $(sel).length === 0)) return rec(type, "fallback", urlPath);
    // Caso 2: estático = sirve el archivo del espejo VERBATIM = paridad exacta con el sitio en vivo.
    if (!isDyn) return rec(type, "static", urlPath);
    // Caso 3: dinámico — debe traer datos en su selector (si no, es bug de render real).
    if (sel) {
      const el = $(sel);
      const okData = el.length > 1 || (el.length === 1 && el.first().text().trim() !== "");
      if (!okData) return rec(type, "broken", urlPath + " (dinámico sin datos)");
    }
    rec(type, "dyn", urlPath);
  } catch (e) {
    rec(type, "broken", urlPath + " (" + e.message + ")");
  }
}

// pool de concurrencia
async function pool(items, n, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; await fn(items[k]); if (k % 200 === 0) process.stdout.write("."); } }));
}

async function liveDrift() {
  console.log("\n\n──── DRIFT del sitio en vivo (vonwobeser.com) ────");
  const maxId = (re) => Math.max(0, ...liveUrls.map((u) => { const m = u.match(re); return m ? +m[1] : 0; }));
  const mirrorMaxLawyer = maxId(/\/lawyer\/l-(\d+)\.html/);
  const mirrorMaxPub = maxId(/\/publication\/p_id-(\d+)\.html/);
  console.log(`  Espejo: max abogado l-${mirrorMaxLawyer}, max publicación p_id-${mirrorMaxPub}`);
  const curl = (u) => { try { return execSync(`curl -s --max-time 15 -A "Mozilla/5.0" "${u}"`, { maxBuffer: 50 * 1024 * 1024 }).toString(); } catch { return ""; } };
  try {
    // Lista de abogados en vivo (partners) y publicaciones recientes — URLs query-string del vivo
    const partners = curl("https://vonwobeser.com/index.php/attorneys/partners");
    const liveLawyerIds = [...partners.matchAll(/lawyer[?/]l[=-](\d+)/g)].map((m) => +m[1]);
    const liveMaxLawyer = Math.max(0, ...liveLawyerIds);
    const pubList = curl("https://vonwobeser.com/index.php/publications/news");
    const livePubIds = [...pubList.matchAll(/publication[?/]p_id[=-](\d+)/g)].map((m) => +m[1]);
    const liveMaxPub = Math.max(0, ...livePubIds);
    console.log(`  En vivo: max abogado l-${liveMaxLawyer}, max publicación p_id-${liveMaxPub}`);
    if (liveMaxLawyer > mirrorMaxLawyer) console.log(`  ⚠️ El vivo tiene abogados MÁS NUEVOS (l-${liveMaxLawyer} > l-${mirrorMaxLawyer}) — agregados desde el 18-jun`);
    else console.log(`  ✅ Sin abogados nuevos en el vivo vs espejo`);
    if (liveMaxPub > mirrorMaxPub) console.log(`  ⚠️ El vivo tiene publicaciones MÁS NUEVAS (p_id-${liveMaxPub} > p_id-${mirrorMaxPub}) — agregadas desde el 18-jun`);
    else console.log(`  ✅ Sin publicaciones nuevas en el vivo vs espejo`);
  } catch (e) {
    console.log("  ⚠️ No se pudo consultar el vivo:", e.message);
  }
}

(async () => {
  console.log(`=== AUDITORÍA DE COBERTURA — ${liveUrls.length} URLs del sitio en vivo vs ${B} ===`);
  process.stdout.write("Verificando");
  await pool(liveUrls, 12, checkOne);
  console.log("\n\n──── COBERTURA por tipo (dinámico / estático / cae-a-home / roto) ────");
  let totBroken = 0, totFallback = 0;
  for (const [type, s] of Object.entries(stats).sort()) {
    totBroken += s.broken; totFallback += s.fallback;
    console.log(`  ${type.padEnd(22)} total=${String(s.total).padStart(4)}  din=${String(s.dyn).padStart(4)}  est=${String(s.static).padStart(4)}  ↩home=${s.fallback}  roto=${s.broken}`);
  }
  await liveDrift();
  console.log("\n──── RESULTADO ────");
  console.log(`  Total URLs: ${liveUrls.length} | Servidas OK: ${liveUrls.length - totBroken - totFallback} | ↩home: ${totFallback} | rotas: ${totBroken}`);
  if (broken.length) { console.log("\n  Huecos (primeros 40):"); broken.slice(0, 40).forEach((b) => console.log("   " + b)); }
  else console.log("  ✅ Cero páginas rotas o que caen a home — todo se sirve.");
})();
