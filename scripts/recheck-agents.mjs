// Re-test enfocado de los 2 agentes que salieron <5/5: confirma si son fallas reales
// o falsos negativos del harness (timeout). node scripts/recheck-agents.mjs
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const B = process.env.VERIFY_BASE || "http://localhost:5050";
const sql = neon(process.env.DATABASE_URL);
const login = async () => (await (await fetch(B + "/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: "admin@vonwobeser.com", password: "VonWobeser2026!" }) })).json()).token;
const run = async (token, agent, payload, ms = 280000) => {
  try { const r = await fetch(B + "/api/agents/run/" + agent, { method: "POST", headers: { authorization: "Bearer " + token, "content-type": "application/json" }, body: JSON.stringify(payload), signal: AbortSignal.timeout(ms) }); return await r.json(); }
  catch (e) { return { success: false, error: String(e).slice(0, 70) }; }
};

(async () => {
  const token = await login();

  // === A) polyglot_translator en artículos LARGOS (los que fallaron), 3 intentos c/u ===
  console.log("=== polyglot_translator — artículos largos (¿falla real o transitoria?) ===");
  const longs = await sql`select id, char_length(content) len from news where content is not null and char_length(content) between 5000 and 12000 order by char_length(content) desc limit 3`;
  for (const a of longs) {
    let okN = 0; const det = [];
    for (let i = 0; i < 3; i++) {
      const r = await run(token, "polyglot_translator", { articleId: a.id, targetLanguages: ["de"] });
      const de = r?.data?.translations?.de;
      const ok = r.success && de?.title && de?.content;
      if (ok) okN++; else det.push((r?.data?.errors?.[0] || r.error || "fallo").slice(0, 55));
    }
    console.log(`  art ${a.len} chars → ${okN}/3 OK ${det.length ? "| errores: " + det.join(" ; ") : ""}`);
  }

  // === B) website_auditor — 5 variantes con timeout amplio (280s) ===
  console.log("\n=== website_auditor — 5 variantes (timeout amplio, anti falso-negativo) ===");
  const variants = [
    ["completo (todos los módulos)", { runType: "full" }],
    ["sin noticias", { runType: "full", skipModules: ["news"] }],
    ["sin abogados", { runType: "full", skipModules: ["attorneys"] }],
    ["sin prácticas/industrias", { runType: "full", skipModules: ["practices", "industries"] }],
    ["sin SEO", { runType: "full", skipModules: ["seo"] }],
  ];
  const auditIds = []; let pass = 0;
  for (const [label, payload] of variants) {
    const t0 = Date.now();
    const r = await run(token, "website_auditor", payload);
    const ok = r.success && typeof r.data?.auditId === "string" && typeof r.data?.findings === "number";
    if (ok) { pass++; auditIds.push(r.data.auditId); }
    console.log(`  ${ok ? "✅" : "❌"} ${label.padEnd(28)} ${ok ? r.data.findings + " hallazgos, " + (r.data.metrics?.pagesScanned || "?") + " págs" : (r.error || "fallo")} (${Math.round((Date.now() - t0) / 1000)}s)`);
  }
  if (auditIds.length) { await sql`delete from website_audits where id = ANY(${auditIds})`.catch(() => {}); console.log(`  🧹 ${auditIds.length} auditorías de prueba borradas`); }
  console.log(`\n  website_auditor: ${pass}/5 variantes OK`);
})().catch((e) => { console.error("ERROR:", e); process.exit(2); });
