// Prueba EXHAUSTIVA de los 9 agentes: 5 rondas con artículos distintos (anti falso-positivo).
// Valida que la salida sea REAL (no solo success:true). Limpia los datos de prueba.
// Uso: node scripts/test-agents.mjs
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const B = process.env.VERIFY_BASE || "http://localhost:5050";
const sql = neon(process.env.DATABASE_URL);

const login = async () => {
  const r = await fetch(B + "/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: "admin@vonwobeser.com", password: process.env.ADMIN_PASS || "VonWobeser2026!" }) });
  return (await r.json()).token;
};
const run = async (token, agent, payload, ms = 170000) => {
  try {
    const r = await fetch(B + "/api/agents/run/" + agent, { method: "POST", headers: { authorization: "Bearer " + token, "content-type": "application/json" }, body: JSON.stringify(payload), signal: AbortSignal.timeout(ms) });
    return await r.json();
  } catch (e) { return { success: false, error: String(e).slice(0, 60) }; }
};
const nonEmpty = (s) => typeof s === "string" && s.trim().length > 0;

// Validadores: cada uno devuelve {ok, ev} (ev = evidencia real de la salida)
const V = {
  content_analyzer: (d) => { const k = d?.analysis?.seoRecommendations?.keywords; return { ok: Array.isArray(k) && k.length > 0, ev: k ? k.slice(0, 2).join(", ") : "" }; },
  formatter: (d) => ({ ok: nonEmpty(d?.content), ev: nonEmpty(d?.title) ? d.title.slice(0, 40) : (d?.content || "").slice(0, 40) }),
  seo_optimizer: (d) => ({ ok: nonEmpty(d?.optimization?.optimizedTitle), ev: `${d?.currentScore}→${d?.optimizedScore}` }),
  category_agent: (d) => ({ ok: nonEmpty(d?.primaryCategory), ev: d?.primaryCategory || "" }),
  metadata_linker: (d) => ({ ok: Array.isArray(d?.linkedPracticeGroups) || Array.isArray(d?.linkedAuthors), ev: `pract:${(d?.linkedPracticeGroups || []).length} aut:${(d?.linkedAuthors || []).length}` }),
  polyglot_translator: (d) => { const de = d?.translations?.de; return { ok: nonEmpty(de?.title) && nonEmpty(de?.content), ev: de?.title ? de.title.slice(0, 38) : (d?.errors?.[0] || "") }; },
  image_suggestion: (d) => ({ ok: nonEmpty(d?.imagePrompt), ev: (d?.imagePrompt || "").slice(0, 42) }),
};
const AI_AGENTS = ["content_analyzer", "formatter", "seo_optimizer", "category_agent", "metadata_linker", "polyglot_translator", "image_suggestion"];

(async () => {
  const token = await login();
  if (!token) { console.error("❌ login falló"); process.exit(1); }
  console.log("✅ Token admin OK\n");

  // 5 artículos DIVERSOS (cortos→largos, distintas categorías)
  const all = await sql`select id, title, char_length(content) len, category from news where content is not null and char_length(content) between 120 and 9000 order by char_length(content)`;
  const pick = [0, Math.floor(all.length * 0.25), Math.floor(all.length * 0.5), Math.floor(all.length * 0.75), all.length - 1].map((i) => all[i]);
  console.log("Artículos de prueba (5 diversos):");
  pick.forEach((a, i) => console.log(`  R${i + 1}: "${(a.title || "").slice(0, 42)}" (${a.len} chars, ${a.category})`));
  console.log("");

  const results = {}; // agent -> [r1..r5]
  const evidence = {}; // agent -> sample evidence
  for (const a of [...AI_AGENTS, "content_auditor", "website_auditor"]) results[a] = [];
  const auditIds = [];

  // --- 5 rondas: agentes de IA sobre artículos distintos ---
  for (let i = 0; i < 5; i++) {
    const art = pick[i];
    process.stdout.write(`Ronda ${i + 1} (artículo ${art.len} chars): `);
    for (const agent of AI_AGENTS) {
      const payload = agent === "polyglot_translator" ? { articleId: art.id, targetLanguages: ["de"] } : { articleId: art.id };
      const r = await run(token, agent, payload);
      const v = r.success ? V[agent](r.data) : { ok: false, ev: (r.error || "fallo").slice(0, 40) };
      results[agent].push(v.ok);
      if (v.ok && !evidence[agent]) evidence[agent] = v.ev;
      process.stdout.write(v.ok ? "·" : "✗");
    }
    console.log(" ok");
  }

  // --- content_auditor: 5 scanTypes distintos ---
  process.stdout.write("Auditor de contenido (5 scanTypes): ");
  for (const st of ["full", "metadata", "translations", "formatting", undefined]) {
    const r = await run(token, "content_auditor", st ? { scanType: st } : {});
    const ok = r.success && r.data?.stats?.articlesScanned > 0;
    results.content_auditor.push(ok);
    if (ok && !evidence.content_auditor) evidence.content_auditor = `${r.data.stats.articlesScanned} art. escaneados, ${r.data.totalGaps} huecos`;
    process.stdout.write(ok ? "·" : "✗");
  }
  console.log(" ok");

  // --- website_auditor: 5 variantes (módulos) ---
  process.stdout.write("Auditor del sitio (5 variantes): ");
  const variants = [{}, { skipModules: ["news"] }, { skipModules: ["attorneys"] }, { skipModules: ["practices", "industries"] }, { skipModules: ["seo"] }];
  for (const v of variants) {
    const r = await run(token, "website_auditor", { runType: "full", ...v }, 290000);
    const ok = r.success && typeof r.data?.auditId === "string" && typeof r.data?.findings === "number";
    results.website_auditor.push(ok);
    if (ok) auditIds.push(r.data.auditId);
    if (ok && !evidence.website_auditor) evidence.website_auditor = `${r.data.findings} hallazgos, ${r.data.metrics?.pagesScanned || "?"} páginas`;
    process.stdout.write(ok ? "·" : "✗");
  }
  console.log(" ok");

  // --- Limpieza de datos de prueba (auditorías del sitio) ---
  if (auditIds.length) { try { await sql`delete from website_audits where id = ANY(${auditIds})`; console.log(`\n🧹 Limpieza: ${auditIds.length} auditorías de prueba borradas (findings en cascada)`); } catch (e) { console.log("  (cleanup:", e.message, ")"); } }

  // --- REPORTE ---
  console.log("\n──── REPORTE DE PRUEBAS DE AGENTES (5 rondas) ────");
  console.log("  " + "Agente".padEnd(22) + "R1 R2 R3 R4 R5   Veredicto   Evidencia (salida real)");
  let allPass = true;
  for (const a of [...AI_AGENTS, "content_auditor", "website_auditor"]) {
    const rs = results[a];
    const cells = rs.map((x) => (x ? " ✅" : " ❌")).join("");
    const n = rs.filter(Boolean).length;
    if (n < 5) allPass = false;
    const verdict = n === 5 ? "5/5 PASA" : `${n}/5 ⚠️`;
    console.log("  " + a.padEnd(22) + cells + "   " + verdict.padEnd(11) + " " + (evidence[a] || "—"));
  }
  console.log("\n  " + (allPass ? "🎉 LOS 9 AGENTES PASARON LAS 5 PRUEBAS (sin falsos positivos)" : "⚠️ Revisar los agentes con <5/5 arriba"));
  console.log("  Nota: image_suggestion genera el PROMPT con IA; la imagen final usa DALL-E (Claude no genera imágenes).");
  process.exit(allPass ? 0 : 1);
})().catch((e) => { console.error("ERROR:", e); process.exit(2); });
