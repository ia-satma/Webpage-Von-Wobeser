/**
 * Smoke tests de la API — verifica seguridad, endpoints públicos y features.
 * Uso: con el server corriendo, `npx tsx scripts/smoke-test.ts [baseUrl]`
 * (baseUrl por defecto http://localhost:5001). Sale con código 1 si algo falla.
 *
 * No requiere framework de test: ejercita la API real y compara códigos/efectos.
 * Pensado como verificación rápida antes de desplegar.
 */

const BASE = process.argv[2] || process.env.SMOKE_BASE_URL || "http://localhost:5001";

type Result = { name: string; ok: boolean; detail: string };
const results: Result[] = [];

function record(name: string, ok: boolean, detail: string) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "✓" : "✗"} ${name} — ${detail}`);
}

async function status(path: string, init?: RequestInit): Promise<number> {
  const res = await fetch(`${BASE}${path}`, init);
  return res.status;
}

async function expectStatus(name: string, path: string, expected: number, init?: RequestInit) {
  try {
    const code = await status(path, init);
    record(name, code === expected, `${path} → ${code} (esperado ${expected})`);
  } catch (err) {
    record(name, false, `${path} → error: ${String(err)}`);
  }
}

async function run() {
  console.log(`Smoke tests contra ${BASE}\n`);

  // --- Seguridad: endpoints sensibles deben exigir auth ---
  await expectStatus("auth: agents status", "/api/agents/status", 401);
  await expectStatus("auth: agents run", "/api/agents/run/formatter", 401, { method: "POST" });
  await expectStatus("auth: chronicler", "/api/system/chronicler", 401);
  await expectStatus("auth: health-check", "/api/health-check/run", 401);
  await expectStatus("auth: admin newsletter", "/api/admin/newsletter/subscribers", 401);
  await expectStatus("auth: admin faqs", "/api/admin/faqs", 401);

  // --- Seguridad: path traversal bloqueado ---
  await expectStatus("traversal: ..%2f", "/generated-images/..%2f..%2fetc%2fpasswd", 400);
  await expectStatus("traversal: dotdot", "/generated-images/x..png", 400);

  // --- Control de costo: el batch translate rechaza arreglos enormes (cap 50) ---
  await expectStatus("cost: batch translate cap", "/api/translate/batch", 413, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      texts: Array.from({ length: 51 }, () => "x"),
      sourceLanguage: "en",
      targetLanguage: "es",
    }),
  });

  // --- Públicos: deben responder 200 ---
  await expectStatus("public: home", "/", 200);
  await expectStatus("public: team", "/api/team", 200);
  await expectStatus("public: news", "/api/news", 200);
  await expectStatus("public: faqs", "/api/faqs", 200);
  await expectStatus("public: pro-bono", "/api/pro-bono", 200);
  await expectStatus("public: diversity", "/api/diversity", 200);

  // --- Features con datos: deben traer items ---
  for (const [name, path] of [["faqs", "/api/faqs"], ["pro-bono", "/api/pro-bono"], ["diversity", "/api/diversity"]] as const) {
    try {
      const res = await fetch(`${BASE}${path}`);
      const data = await res.json();
      const n = Array.isArray(data) ? data.length : 0;
      record(`data: ${name}`, n > 0, `${path} → ${n} items`);
    } catch (err) {
      record(`data: ${name}`, false, `${path} → error: ${String(err)}`);
    }
  }

  // --- Newsletter: alta + idempotencia de duplicado ---
  const testEmail = `smoke-${Date.now()}@example.com`;
  try {
    const r1 = await fetch(`${BASE}/api/newsletter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, firstName: "Smoke", lastName: "Test" }),
    });
    record("newsletter: alta nueva", r1.status === 201 || r1.status === 200, `POST → ${r1.status}`);
    const r2 = await fetch(`${BASE}/api/newsletter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, firstName: "Smoke", lastName: "Test" }),
    });
    const body2 = await r2.json().catch(() => ({}));
    record("newsletter: duplicado sin crash", r2.status === 200 && body2?.duplicate === true, `POST repetido → ${r2.status} duplicate=${body2?.duplicate}`);
  } catch (err) {
    record("newsletter", false, `error: ${String(err)}`);
  }

  // --- Email inválido rechazado ---
  await expectStatus("newsletter: email inválido", "/api/newsletter", 400, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "no-es-email" }),
  });

  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;
  console.log(`\n${passed}/${results.length} pasaron${failed ? `, ${failed} fallaron` : ""}.`);
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error("Smoke test runner error:", err);
  process.exit(1);
});
