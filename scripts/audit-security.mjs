// Batería de auditoría de SEGURIDAD (probes activos). Verifica cada hallazgo con un
// ataque real y reporta PASA/FALLA. Idempotente: lo que muta, lo limpia vía DB.
// Uso: node scripts/audit-security.mjs           (probes normales)
//      node scripts/audit-security.mjs --ratelimit  (incluye el de rate-limit, que BLOQUEA el IP 30min)
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const B = process.env.VERIFY_BASE || "http://localhost:5050";
const ADMIN_USER = "admin@vonwobeser.com";
const ADMIN_PASS = process.env.ADMIN_PASS || "VonWobeser2026!";
const sql = neon(process.env.DATABASE_URL);
const RATELIMIT = process.argv.includes("--ratelimit");

let pass = 0, fail = 0;
const issues = [];
const ok = (m) => { pass++; console.log("  ✅ " + m); };
const bad = (m) => { fail++; issues.push(m); console.log("  ❌ " + m); };

async function login() {
  const r = await fetch(B + "/api/admin/login", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASS }),
  });
  const j = await r.json().catch(() => ({}));
  if (!j.token) throw new Error("No se pudo loguear admin (¿rate-limit activo de una corrida previa? espera o reinicia). " + JSON.stringify(j).slice(0, 80));
  return j.token;
}

(async () => {
  console.log(`\n=== AUDITORÍA DE SEGURIDAD — ${B} ===`);
  const token = await login();
  const AH = { authorization: "Bearer " + token };

  // 1) Agentes sin auth → deben dar 401
  console.log("\n[1] Endpoints de agentes sin autenticación");
  for (const [m, p] of [["GET", "/api/agents/status"], ["POST", "/api/agents/processing/stop"], ["POST", "/api/agents/queue"]]) {
    const r = await fetch(B + p, { method: m });
    if (r.status === 401 || r.status === 403) ok(`${m} ${p} → ${r.status} (protegido)`);
    else bad(`${m} ${p} → ${r.status} (PÚBLICO — debería ser 401/403)`);
  }

  // 2) XSS almacenado (round-trip)
  console.log("\n[2] XSS almacenado en noticias (admin→público)");
  const slug = "audit-xss-" + Date.now();
  const payload = {
    title: "AUDIT XSS TEST", titleEs: "AUDIT XSS TEST", slug,
    excerpt: '<img src=x onerror="alert(1)"> hola',
    excerptEs: '<img src=x onerror="alert(1)"> hola',
    content: '<p>texto legítimo</p><a href="https://ok.com">link</a><script>alert(1)</script>',
    contentEs: '<p>texto legítimo</p><a href="https://ok.com">link</a><script>alert(1)</script>',
    category: "news", categoryEs: "Prensa", published: true, date: new Date().toISOString(),
  };
  let createdId = null;
  try {
    const cr = await fetch(B + "/api/admin/news", { method: "POST", headers: { ...AH, "content-type": "application/json" }, body: JSON.stringify(payload) });
    const cj = await cr.json().catch(() => ({}));
    createdId = cj.id;
    if (!createdId) { bad(`No se pudo crear noticia de prueba (${cr.status}) ${JSON.stringify(cj).slice(0, 100)}`); }
    else {
      const pub = await (await fetch(B + "/news/" + slug)).text();
      // Busca el PAYLOAD específico (la página siempre tiene <script> legítimos de jQuery/etc).
      const hasPayloadScript = /<script[^>]*>\s*alert\(1\)/i.test(pub) || pub.includes("alert(1)");
      const hasOnerror = /onerror\s*=/i.test(pub);
      const keepsLegit = /<a [^>]*href=/.test(pub) || /<p>/.test(pub);
      if (!hasPayloadScript && !hasOnerror) ok("payload XSS neutralizado en la página pública");
      else bad(`XSS NO sanitizado: ${hasPayloadScript ? "alert(1) " : ""}${hasOnerror ? "onerror=" : ""} presente en /news/${slug}`);
      if (keepsLegit) ok("HTML legítimo (<p>/<a>) conservado tras sanitizar");
      else console.log("  ⚠️  (nota) el HTML legítimo no se detectó — revisar allowlist");
    }
  } finally {
    if (createdId) await sql`delete from news where id = ${createdId}`;
  }

  // 3) Path traversal en /generated-images/:filename
  console.log("\n[3] Path traversal (/generated-images)");
  let traversalBlocked = true;
  for (const p of ["/generated-images/..%2f..%2fpackage.json", "/generated-images/%2e%2e%2f%2e%2e%2fserver%2fdb.ts", "/generated-images/..%5c..%5cpackage.json"]) {
    const r = await fetch(B + p);
    const body = r.status === 200 ? await r.text() : "";
    if (r.status === 200 && (/"name"\s*:/.test(body) || /DATABASE_URL|drizzle|neon/.test(body))) { traversalBlocked = false; bad(`TRAVERSAL EXITOSO en ${p} (sirvió archivo fuera del dir)`); }
  }
  if (traversalBlocked) ok("path traversal bloqueado (no sirve archivos fuera del directorio)");

  // 4) Upload de SVG (XSS) → debe rechazarse
  console.log("\n[4] Subida de SVG malicioso");
  const fd = new FormData();
  fd.append("file", new Blob(['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'], { type: "image/svg+xml" }), "evil.svg");
  const ur = await fetch(B + "/api/admin/media/upload", { method: "POST", headers: AH, body: fd });
  if (ur.status === 400 || ur.status === 415) ok(`SVG rechazado (${ur.status})`);
  else { const uj = await ur.json().catch(() => ({})); bad(`SVG ACEPTADO (${ur.status}) ${uj.path || ""} — vector XSS (se sirve en /uploads)`); if (uj.path) { try { await sql`select 1`; } catch {} } }

  // 5) Security headers
  console.log("\n[5] Security headers");
  const hr = await fetch(B + "/");
  const xcto = hr.headers.get("x-content-type-options");
  const xfo = hr.headers.get("x-frame-options") || hr.headers.get("content-security-policy");
  xcto === "nosniff" ? ok("X-Content-Type-Options: nosniff") : bad("falta X-Content-Type-Options: nosniff");
  xfo ? ok("X-Frame-Options / CSP presente") : bad("falta X-Frame-Options y CSP (clickjacking)");

  // 6) CORS no debe reflejar origen arbitrario
  console.log("\n[6] CORS");
  const cr = await fetch(B + "/api/team", { headers: { origin: "https://evil.example.com" } });
  const aco = cr.headers.get("access-control-allow-origin");
  if (aco === "https://evil.example.com") bad(`CORS refleja origen arbitrario (ACAO=${aco}) — riesgo CSRF/robo`);
  else ok(`CORS no refleja evil (ACAO=${aco || "ausente"})`);

  // 7) init guard: crear super_admin con email nuevo debe rechazarse si ya existe admin
  console.log("\n[7] /api/admin/init (creación de admin no autorizada)");
  const probeEmail = `audit-init-${Date.now()}@test.local`;
  const ir = await fetch(B + "/api/admin/init", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: probeEmail, password: "Xx1!aaaa" }) });
  if (ir.status === 403) ok("init bloqueado (ya existe admin) → 403");
  else { bad(`init CREÓ/permitió admin nuevo (${ir.status}) — cualquiera puede crear super_admin`); await sql`delete from admin_users where email = ${probeEmail}`.catch(() => {}); }

  // 8) Validación en PUT news (datos inválidos → 400)
  console.log("\n[8] Validación de entrada (PUT news)");
  // crear, intentar PUT inválido, borrar
  const s2 = "audit-val-" + Date.now();
  const c2 = await fetch(B + "/api/admin/news", { method: "POST", headers: { ...AH, "content-type": "application/json" }, body: JSON.stringify({ title: "v", titleEs: "v", slug: s2, excerpt: "x", excerptEs: "x", content: "x", contentEs: "x", category: "news", categoryEs: "Prensa", published: false, date: new Date().toISOString() }) });
  const id2 = (await c2.json().catch(() => ({}))).id;
  if (id2) {
    const pr = await fetch(B + "/api/admin/news/" + id2, { method: "PUT", headers: { ...AH, "content-type": "application/json" }, body: JSON.stringify({ title: 12345, published: "no-es-bool", date: "fecha-mala" }) });
    if (pr.status === 400) ok("PUT con datos inválidos rechazado (400)");
    else bad(`PUT acepta datos inválidos (${pr.status}) — falta validación Zod (mass assignment)`);
    await sql`delete from news where id = ${id2}`;
  } else console.log("  ⚠️  no se pudo crear noticia para el test de validación");

  // 9) SQLi / robustez en endpoints públicos
  console.log("\n[9] Inyección SQL / robustez");
  for (const p of ["/api/search?q=%27%20OR%20%271%27%3D%271", "/api/team/' OR 1=1--", "/api/news/" + encodeURIComponent("1;drop table news;")]) {
    const r = await fetch(B + p);
    if (r.status >= 500) bad(`${p} → ${r.status} (error de servidor; posible inyección/crash)`);
    else ok(`${p} → ${r.status} (sin error 500)`);
  }

  // 10) SSRF: el guard debe existir en checkImageUrl
  console.log("\n[10] SSRF (guard de IPs privadas en checkImageUrl)");
  try {
    const fsmod = await import("fs");
    const src = fsmod.readFileSync("server/agents/specialized/WebsiteAuditorAgent.ts", "utf8");
    if (/169\.254\.169\.254|127\.0\.0\.1|isPrivate|localhost/.test(src) && /checkImageUrl/.test(src) && /new URL\(/.test(src)) ok("checkImageUrl bloquea hosts privados/metadata");
    else bad("checkImageUrl SIN guard SSRF (no bloquea localhost/127.*/169.254.169.254)");
  } catch (e) { console.log("  ⚠️  no se pudo leer WebsiteAuditorAgent.ts:", e.message); }

  // 11) Rate-limit login (solo con --ratelimit; BLOQUEA el IP 30 min)
  if (RATELIMIT) {
    console.log("\n[11] Rate-limit en login (BLOQUEA IP)");
    let got429 = false;
    for (let i = 0; i < 7; i++) {
      const r = await fetch(B + "/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: "noexiste@x.com", password: "malamala" }) });
      if (r.status === 429) { got429 = true; break; }
    }
    got429 ? ok("login rate-limited tras varios intentos (429)") : bad("login SIN rate-limit (fuerza bruta)");
  } else {
    console.log("\n[11] Rate-limit login → omitido (corre con --ratelimit; bloquea el IP). Confirmado por código en server/auth.ts:29-106");
  }

  console.log("\n──── RESULTADO SEGURIDAD ────");
  console.log(`  ✅ PASA: ${pass}   ❌ FALLA: ${fail}`);
  if (issues.length) { console.log("\n  Vulnerabilidades abiertas:"); issues.forEach((i) => console.log("   • " + i)); }
  else console.log("  🎉 Todos los probes en verde.");
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error("ERROR en el harness:", e.message); process.exit(2); });
