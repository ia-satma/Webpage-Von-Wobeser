// Verificación exhaustiva (read-only) del sitio Von Wobeser: páginas (ES+EN sin
// falsos positivos), conteos DB↔API, ocultar, admin, y agentes registrados+corriendo.
// Uso: node scripts/verify-all.mjs
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import * as cheerio from "cheerio";

const B = process.env.VERIFY_BASE || "http://localhost:5050";
const ADMIN_USER = "admin@vonwobeser.com";
const ADMIN_PASS = process.env.ADMIN_PASS || "VonWobeser2026!";
const sql = neon(process.env.DATABASE_URL);

let pass = 0, fail = 0, warn = 0;
const issues = [];
const ok = (m) => { pass++; };
const bad = (m) => { fail++; issues.push("❌ " + m); };
const aviso = (m) => { warn++; issues.push("⚠️  " + m); };
const section = (t) => console.log(`\n──── ${t} ────`);

async function get(path) {
  try {
    const r = await fetch(B + path);
    return { status: r.status, html: await r.text() };
  } catch (e) {
    return { status: 0, html: "", err: e.message };
  }
}
async function getJson(path, headers) {
  try {
    const r = await fetch(B + path, { headers });
    return { status: r.status, json: await r.json().catch(() => null) };
  } catch (e) {
    return { status: 0, json: null, err: e.message };
  }
}

// Idioma confiable: <html lang> + texto del menú nav (no texto suelto de la página).
function langOf(html) {
  const lang = (html.match(/<html[^>]*lang="([^"]*)"/) || [])[1] || "";
  const navText = [...html.matchAll(/nav__menu--link[^>]*>([^<]+)/g)].map((m) => m[1].trim()).join(" | ");
  const navEs = /Nuestra Firma|Abogados|Capacidades/.test(navText) && !/Our Firm|Attorneys|Capabilities/.test(navText);
  const navEn = /Our Firm|Attorneys|Capabilities/.test(navText) && !/Nuestra Firma|Abogados|Capacidades/.test(navText);
  return { lang, navEs, navEn };
}
// Verifica una página: 200 + idioma esperado + selector con dato no vacío.
async function checkPage(label, path, expectLang, dataSelector) {
  const { status, html } = await get(path);
  if (status !== 200) return bad(`${label} [${path}] HTTP ${status}`);
  const $ = cheerio.load(html);
  if (!$("title").text().includes("Von Wobeser")) return bad(`${label} [${path}] sin <title> Von Wobeser`);
  const { lang, navEs, navEn } = langOf(html);
  const langOK = expectLang === "es" ? (lang.startsWith("es") && navEs) : (lang.startsWith("en") && navEn);
  if (!langOK) return bad(`${label} [${path}] idioma incorrecto (lang="${lang}", esperado ${expectLang})`);
  if (dataSelector) {
    const el = $(dataSelector);
    const hasData = el.length > 0 && (el.first().text().trim() || el.first().find("*").length > 0 || el.length > 1);
    if (!hasData) return bad(`${label} [${path}] selector "${dataSelector}" vacío/ausente (página rota)`);
  }
  ok(label);
}

(async () => {
  console.log(`\n=== VERIFICACIÓN EXHAUSTIVA — ${B} ===`);

  // 1) INFRA
  section("1. Infraestructura / conectividad");
  try { await sql`select 1`; ok("DB conecta"); console.log("  ✅ DB Neon conecta"); }
  catch (e) { bad("DB no conecta: " + e.message); console.log("  ❌ DB no conecta"); }
  const home = await get("/");
  if (home.status === 200 && /Von Wobeser/.test(home.html)) { ok("server"); console.log("  ✅ Server responde en " + B); }
  else { bad("Server no responde correctamente en " + B); console.log("  ❌ Server no responde"); }

  // 2) CONTEOS DB vs API
  section("2. Conteos DB ↔ API (datos conectados al sitio)");
  const dbTeam = (await sql`select count(*)::int n from team_members where published is not false`)[0].n;
  const dbPubFalse = (await sql`select count(*)::int n from team_members where published = false`)[0].n;
  const dbPg = (await sql`select count(*)::int n from practice_groups where published is not false`)[0].n;
  const dbIg = (await sql`select count(*)::int n from industry_groups where published is not false`)[0].n;
  const dbNews = (await sql`select count(*)::int n from news`)[0].n;
  const apiTeam = (await getJson("/api/team")).json?.length ?? -1;
  const apiPg = (await getJson("/api/practice-groups")).json?.length ?? -1;
  const apiIg = (await getJson("/api/industry-groups")).json?.length ?? -1;
  const apiNews = (await getJson("/api/news")).json?.length ?? -1;
  const cmp = (label, db, api) => {
    console.log(`  ${db === api ? "✅" : "❌"} ${label}: DB=${db} API=${api}`);
    db === api ? ok(label) : bad(`${label} desconectado: DB=${db} vs API=${api}`);
  };
  cmp("team_members↔/api/team", dbTeam, apiTeam);
  cmp("practice_groups↔/api/practice-groups", dbPg, apiPg);
  cmp("industry_groups↔/api/industry-groups", dbIg, apiIg);
  console.log(`  ℹ️  news: DB=${dbNews} API=${apiNews} | abogados ocultos (published=false): ${dbPubFalse}`);

  // 3) PÁGINAS — barrido completo ES + EN
  section("3. Páginas (barrido completo, ES + EN)");
  await checkPage("Home ES", "/", "es", ".home__hero");
  await checkPage("Home EN", "/?lang=en", "en", ".home__hero");
  await checkPage("News listado ES", "/news", "es", ".archive__item");
  await checkPage("News listado EN", "/news?lang=en", "en", ".archive__item");

  const team = (await getJson("/api/team")).json || [];
  const pgs = (await getJson("/api/practice-groups")).json || [];
  const igs = (await getJson("/api/industry-groups")).json || [];
  const news = (await getJson("/api/news")).json || [];

  if (news[0]) {
    await checkPage("News detalle ES", `/news/${news[0].slug}`, "es", ".single__meta--name");
    await checkPage("News detalle EN", `/news/${news[0].slug}?lang=en`, "en", ".single__meta--name");
  }

  // Directorio: 4 categorías + conteo == DB
  const catTitle = { partners: "Partner", "of-counsel": "Of Counsel", counsel: "Counsel", associates: "Associate" };
  for (const [cat, title] of Object.entries(catTitle)) {
    const dbN = (await sql`select count(*)::int n from team_members where title=${title} and published is not false`)[0].n;
    const { status, html } = await get(`/attorneys/${cat}`);
    if (status !== 200) { bad(`Directorio ${cat} HTTP ${status}`); continue; }
    const n = cheerio.load(html)(".attorneys__list--item").length;
    if (n === dbN) ok(`Directorio ${cat}`);
    else bad(`Directorio ${cat}: muestra ${n} pero DB tiene ${dbN}`);
  }
  console.log(`  Directorio: 4 categorías verificadas vs DB`);

  // TODOS los abogados (ES) + muestra EN
  let tOk = 0;
  for (const m of team) {
    const before = fail;
    await checkPage(`Abogado ${m.slug}`, `/lawyer/${m.slug}`, "es", ".attorney__meta--name");
    if (fail === before) tOk++;
  }
  if (team[0]) await checkPage(`Abogado EN ${team[0].slug}`, `/lawyer/${team[0].slug}?lang=en`, "en", ".attorney__meta--name");
  console.log(`  Perfiles de abogado: ${tOk}/${team.length} OK (ES)`);

  // TODAS las prácticas + industrias (ES) + muestra EN
  let pOk = 0;
  for (const p of pgs) { const b = fail; await checkPage(`Práctica ${p.slug}`, `/practice/${p.slug}`, "es", ".single__meta--name"); if (fail === b) pOk++; }
  if (pgs[0]) await checkPage(`Práctica EN ${pgs[0].slug}`, `/practice/${pgs[0].slug}?lang=en`, "en", ".single__meta--name");
  console.log(`  Prácticas: ${pOk}/${pgs.length} OK (ES)`);
  let iOk = 0;
  for (const i of igs) { const b = fail; await checkPage(`Industria ${i.slug}`, `/industry/${i.slug}`, "es", ".single__meta--name"); if (fail === b) iOk++; }
  if (igs[0]) await checkPage(`Industria EN ${igs[0].slug}`, `/industry/${igs[0].slug}?lang=en`, "en", ".single__meta--name");
  console.log(`  Industrias: ${iOk}/${igs.length} OK (ES)`);

  // URLs originales (SEO)
  const orig = [
    ["/index.php/lawyer/l-134.html", "en"], ["/index.php/abogado/l-134.html", "es"],
    ["/index.php/practice/p-46.html", "en"], ["/index.php/attorneys/partners/index.html", "en"],
    ["/index.php/abogados/socios/index.html", "es"],
  ];
  let oOk = 0;
  for (const [p, l] of orig) { const b = fail; await checkPage(`URL orig ${p}`, p, l, null); if (fail === b) oOk++; }
  console.log(`  URLs originales (SEO): ${oOk}/${orig.length} OK`);

  // Institucionales
  const inst = [
    ["/index.php/nuestra-firma/index.html", "es"], ["/index.php/our-firm/index.html", "en"],
    ["/index.php/capacidades/index.html", "es"], ["/index.php/capabilities/index.html", "en"],
    ["/index.php/contacto/index.html", "es"], ["/index.php/contact/index.html", "en"],
  ];
  let insOk = 0;
  for (const [p, l] of inst) {
    const { status, html } = await get(p);
    const langInfo = langOf(html);
    const good = status === 200 && (l === "es" ? langInfo.navEs : langInfo.navEn);
    if (good) { ok(`Inst ${p}`); insOk++; } else bad(`Institucional ${p} HTTP ${status} lang=${langInfo.lang}`);
  }
  console.log(`  Institucionales: ${insOk}/${inst.length} OK`);

  // 4) OCULTAR (published)
  section("4. Ocultar (published) respetado");
  if (dbPubFalse > 0) {
    const hidden = await sql`select slug from team_members where published = false limit 1`;
    const slug = hidden[0]?.slug;
    const inApi = (team || []).some((m) => m.slug === slug);
    if (!inApi) { ok("ocultar"); console.log(`  ✅ Abogado oculto (${slug}) NO aparece en /api/team`); }
    else bad(`Abogado oculto ${slug} SÍ aparece en /api/team`);
  } else {
    console.log("  ℹ️  No hay items ocultos ahora (N/A — no se muta para probar)");
  }

  // 5) ADMIN conectado
  section("5. Admin conectado");
  const login = await getJson("/api/admin/login");
  // login es POST:
  const lr = await fetch(B + "/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASS }) });
  const lj = await lr.json().catch(() => ({}));
  const token = lj.token;
  if (token) { ok("login"); console.log("  ✅ Login admin OK"); } else { bad("Login admin falló: " + JSON.stringify(lj).slice(0, 80)); }
  if (token) {
    const H = { authorization: "Bearer " + token };
    for (const [label, p] of [["/api/admin/me", "/api/admin/me"], ["site-config", "/api/admin/site-config"], ["team/stats", "/api/admin/team/stats"]]) {
      const r = await getJson(p, H);
      if (r.status === 200) { ok("admin " + label); console.log(`  ✅ ${p} → 200`); }
      else bad(`admin ${p} → ${r.status}`);
    }
  }

  // 6) AGENTES
  section("6. Agentes (registrados + corriendo, sin disparar)");
  const st = (await getJson("/api/agents/status")).json;
  const EXPECTED = ["formatter", "metadata_linker", "polyglot_translator", "content_auditor", "seo_optimizer", "image_suggestion", "category_agent", "website_auditor", "content_analyzer"];
  if (st?.orchestrator?.isRunning === true) { ok("orchestrator running"); console.log("  ✅ Orquestador corriendo (isRunning=true)"); }
  else bad("Orquestador NO está corriendo (isRunning != true)");
  const reg = st?.orchestrator?.registeredAgents || [];
  const missing = EXPECTED.filter((a) => !reg.includes(a));
  if (missing.length === 0) { ok("agents registered"); console.log(`  ✅ ${reg.length} agentes registrados: ${reg.join(", ")}`); }
  else bad(`Faltan agentes registrados: ${missing.join(", ")}`);

  // Jobs atorados / fallidos
  const jobStats = await sql`select status, count(*)::int n from agent_jobs group by status`;
  const byStatus = Object.fromEntries(jobStats.map((r) => [r.status, r.n]));
  console.log("  ℹ️  agent_jobs por estado:", JSON.stringify(byStatus));
  const stuck = (await sql`select count(*)::int n from agent_jobs where status='in_progress' and started_at < now() - interval '10 minutes'`)[0].n;
  if (stuck > 0) bad(`${stuck} jobs atorados en in_progress > 10 min (zombies)`);
  else { ok("no stuck jobs"); console.log("  ✅ Sin jobs atorados (zombies)"); }
  const failed = byStatus.failed || 0;
  if (failed > 0) aviso(`${failed} jobs en estado 'failed' (históricos; revisar si son recientes)`);

  // Dependencia OpenAI
  const hasKey = !!(process.env.AI_INTEGRATIONS_OPENAI_API_KEY && process.env.AI_INTEGRATIONS_OPENAI_API_KEY.trim());
  if (hasKey) { ok("openai key"); console.log("  ✅ AI_INTEGRATIONS_OPENAI_API_KEY configurada"); }
  else { aviso("AI_INTEGRATIONS_OPENAI_API_KEY VACÍA — agentes corren pero las tareas de IA nuevas fallarán hasta configurarla (config de deploy, no bug)"); console.log("  ⚠️  OpenAI key vacía: agentes registrados+corriendo, pero tareas IA nuevas requieren la key"); }

  // REPORTE FINAL
  section("RESULTADO");
  console.log(`  ✅ PASA: ${pass}   ❌ FALLA: ${fail}   ⚠️  AVISOS: ${warn}`);
  if (issues.length) { console.log("\n  Detalle:"); issues.slice(0, 60).forEach((i) => console.log("   " + i)); }
  else console.log("  🎉 Sin issues.");
  console.log(fail === 0 ? "\n  ✅ VERIFICACIÓN SUPERADA (0 fallas críticas)\n" : `\n  ❌ ${fail} FALLA(S) CRÍTICA(S) — revisar arriba\n`);
  process.exit(fail === 0 ? 0 : 1);
})();
