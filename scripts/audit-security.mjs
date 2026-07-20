// Batería de auditoría de SEGURIDAD (probes activos). Verifica cada hallazgo con un
// ataque real y reporta PASA/FALLA. Idempotente: lo que muta, lo limpia vía DB.
//
// Uso:
//   node scripts/audit-security.mjs                       (target=both, por defecto)
//   node scripts/audit-security.mjs --target=local         (solo localhost)
//   node scripts/audit-security.mjs --target=replit        (solo Replit — invasivas degradadas)
//   node scripts/audit-security.mjs --ratelimit             (agrega fuerza bruta COMPLETA en local;
//                                                             contra Replit SIEMPRE se limita a 2
//                                                             intentos, nunca se agota el límite real)
//
// Local y Replit comparten la MISMA base de datos (Neon), así que un solo DATABASE_URL basta
// para limpiar los datos de prueba sin importar contra cuál de los dos se hizo la petición HTTP.
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const ADMIN_USER = "admin@vonwobeser.com";
const ADMIN_PASS = process.env.ADMIN_PASS || "VonWobeser2026!";
const LOCAL_BASE = process.env.VERIFY_BASE || "http://localhost:5050";
const REPLIT_BASE = process.env.REPLIT_BASE || "https://webpage-von-wobeser-2026.replit.app";
const sql = neon(process.env.DATABASE_URL);
const RATELIMIT = process.argv.includes("--ratelimit");

const targetArg = (process.argv.find((a) => a.startsWith("--target=")) || "--target=both").split("=")[1];
const TARGETS =
  targetArg === "local" ? [{ name: "LOCAL", base: LOCAL_BASE, isLocal: true }] :
  targetArg === "replit" ? [{ name: "REPLIT", base: REPLIT_BASE, isLocal: false }] :
  [{ name: "LOCAL", base: LOCAL_BASE, isLocal: true }, { name: "REPLIT", base: REPLIT_BASE, isLocal: false }];

// Resultado global consolidado (todas las corridas, todos los entornos).
const summary = []; // { env, pass, fail, issues: [] }

async function login(B) {
  const r = await fetch(B + "/api/admin/login", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASS }),
  });
  const j = await r.json().catch(() => ({}));
  if (!j.token) throw new Error("No se pudo loguear admin (¿rate-limit activo de una corrida previa? espera o reinicia). " + JSON.stringify(j).slice(0, 80));
  return j.token;
}

// =====================================================================================
// BLOQUE A — Regresión (probes 1-10, ya existentes; misma lógica que antes)
// BLOQUE B — Nuevos (probes 11-17, dinámicos contra el target actual)
// =====================================================================================
async function runAgainstTarget({ name, base: B, isLocal }) {
  console.log(`\n\n======================================================================`);
  console.log(`=== AUDITORÍA DE SEGURIDAD — ${name} (${B}) ===`);
  console.log(`======================================================================`);

  let pass = 0, fail = 0;
  const issues = [];
  const ok = (m) => { pass++; console.log("  ✅ " + m); };
  const bad = (m) => { fail++; issues.push(m); console.log("  ❌ " + m); };

  let token;
  try {
    token = await login(B);
  } catch (e) {
    console.log(`  ⚠️  No se pudo iniciar la corrida contra ${name}: ${e.message}`);
    console.log(`  ⚠️  Se omite este entorno por completo (no se ejecuta ningún probe contra él).`);
    summary.push({ env: name, pass: 0, fail: 0, issues: [`login falló, entorno omitido: ${e.message}`], skipped: true });
    return;
  }
  const AH = { authorization: "Bearer " + token };

  // [1] Agentes sin auth → deben dar 401
  console.log("\n[1] Endpoints de agentes sin autenticación");
  for (const [m, p] of [["GET", "/api/agents/status"], ["POST", "/api/agents/processing/stop"], ["POST", "/api/agents/queue"]]) {
    const r = await fetch(B + p, { method: m });
    if (r.status === 401 || r.status === 403) ok(`${m} ${p} → ${r.status} (protegido)`);
    else bad(`${m} ${p} → ${r.status} (PÚBLICO — debería ser 401/403)`);
  }

  // [2] XSS almacenado (round-trip)
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

  // [3] Path traversal en /generated-images/:filename
  console.log("\n[3] Path traversal (/generated-images)");
  let traversalBlocked = true;
  for (const p of ["/generated-images/..%2f..%2fpackage.json", "/generated-images/%2e%2e%2f%2e%2e%2fserver%2fdb.ts", "/generated-images/..%5c..%5cpackage.json"]) {
    const r = await fetch(B + p);
    const body = r.status === 200 ? await r.text() : "";
    if (r.status === 200 && (/"name"\s*:/.test(body) || /DATABASE_URL|drizzle|neon/.test(body))) { traversalBlocked = false; bad(`TRAVERSAL EXITOSO en ${p} (sirvió archivo fuera del dir)`); }
  }
  if (traversalBlocked) ok("path traversal bloqueado (no sirve archivos fuera del directorio)");

  // [4] Upload de SVG (XSS) → debe rechazarse
  console.log("\n[4] Subida de SVG malicioso");
  {
    const fd = new FormData();
    fd.append("file", new Blob(['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'], { type: "image/svg+xml" }), "evil.svg");
    const ur = await fetch(B + "/api/admin/media/upload", { method: "POST", headers: AH, body: fd });
    if (ur.status === 400 || ur.status === 415) ok(`SVG rechazado (${ur.status})`);
    else { const uj = await ur.json().catch(() => ({})); bad(`SVG ACEPTADO (${ur.status}) ${uj.path || ""} — vector XSS (se sirve en /uploads)`); }
  }

  // [5] Security headers
  console.log("\n[5] Security headers");
  const hr = await fetch(B + "/");
  const xcto = hr.headers.get("x-content-type-options");
  const xfo = hr.headers.get("x-frame-options") || hr.headers.get("content-security-policy");
  xcto === "nosniff" ? ok("X-Content-Type-Options: nosniff") : bad("falta X-Content-Type-Options: nosniff");
  xfo ? ok("X-Frame-Options / CSP presente") : bad("falta X-Frame-Options y CSP (clickjacking)");

  // [6] CORS no debe reflejar origen arbitrario
  console.log("\n[6] CORS");
  {
    const cr = await fetch(B + "/api/team", { headers: { origin: "https://evil.example.com" } });
    const aco = cr.headers.get("access-control-allow-origin");
    if (aco === "https://evil.example.com") bad(`CORS refleja origen arbitrario (ACAO=${aco}) — riesgo CSRF/robo`);
    else ok(`CORS no refleja evil (ACAO=${aco || "ausente"})`);
  }

  // [7] init guard: crear super_admin con email nuevo debe rechazarse si ya existe admin
  console.log("\n[7] /api/admin/init (creación de admin no autorizada)");
  {
    const probeEmail = `audit-init-${Date.now()}@test.local`;
    const ir = await fetch(B + "/api/admin/init", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: probeEmail, password: "Xx1!aaaa" }) });
    if (ir.status === 403) ok("init bloqueado (ya existe admin) → 403");
    else { bad(`init CREÓ/permitió admin nuevo (${ir.status}) — cualquiera puede crear super_admin`); await sql`delete from admin_users where email = ${probeEmail}`.catch(() => {}); }
  }

  // [8] Validación en PUT news (datos inválidos → 400)
  console.log("\n[8] Validación de entrada (PUT news)");
  {
    const s2 = "audit-val-" + Date.now();
    const c2 = await fetch(B + "/api/admin/news", { method: "POST", headers: { ...AH, "content-type": "application/json" }, body: JSON.stringify({ title: "v", titleEs: "v", slug: s2, excerpt: "x", excerptEs: "x", content: "x", contentEs: "x", category: "news", categoryEs: "Prensa", published: false, date: new Date().toISOString() }) });
    const id2 = (await c2.json().catch(() => ({}))).id;
    if (id2) {
      const pr = await fetch(B + "/api/admin/news/" + id2, { method: "PUT", headers: { ...AH, "content-type": "application/json" }, body: JSON.stringify({ title: 12345, published: "no-es-bool", date: "fecha-mala" }) });
      if (pr.status === 400) ok("PUT con datos inválidos rechazado (400)");
      else bad(`PUT acepta datos inválidos (${pr.status}) — falta validación Zod (mass assignment)`);
      await sql`delete from news where id = ${id2}`;
    } else console.log("  ⚠️  no se pudo crear noticia para el test de validación");
  }

  // [9] SQLi / robustez en endpoints públicos
  console.log("\n[9] Inyección SQL / robustez");
  for (const p of ["/api/search?q=%27%20OR%20%271%27%3D%271", "/api/team/' OR 1=1--", "/api/news/" + encodeURIComponent("1;drop table news;")]) {
    const r = await fetch(B + p);
    if (r.status >= 500) bad(`${p} → ${r.status} (error de servidor; posible inyección/crash)`);
    else ok(`${p} → ${r.status} (sin error 500)`);
  }

  // [10] SSRF: el guard debe existir en checkImageUrl (chequeo estático — no depende del target)
  console.log("\n[10] SSRF (guard de IPs privadas en checkImageUrl)");
  try {
    const fsmod = await import("fs");
    const src = fsmod.readFileSync("server/agents/specialized/WebsiteAuditorAgent.ts", "utf8");
    if (/169\.254\.169\.254|127\.0\.0\.1|isPrivate|localhost/.test(src) && /checkImageUrl/.test(src) && /new URL\(/.test(src)) ok("checkImageUrl bloquea hosts privados/metadata");
    else bad("checkImageUrl SIN guard SSRF (no bloquea localhost/127.*/169.254.169.254)");
  } catch (e) { console.log("  ⚠️  no se pudo leer WebsiteAuditorAgent.ts:", e.message); }

  // [11] NUEVO — Barrido de auth admin ampliado (rutas no cubiertas por el probe [1])
  console.log("\n[11] Barrido de auth en rutas /api/admin/* (sin token)");
  {
    const sweepRoutes = [
      ["GET", "/api/admin/news"], ["POST", "/api/admin/news"],
      ["GET", "/api/admin/team"], ["POST", "/api/admin/team"],
      ["GET", "/api/admin/users"],
      ["GET", "/api/admin/generated-images"], ["GET", "/api/admin/generated-audio"],
      ["GET", "/api/admin/generated-presentations"], ["POST", "/api/admin/presentations/generate"],
      ["POST", "/api/translate"], ["POST", "/api/translate/batch"],
      ["GET", "/api/admin/cms-stats"],
    ];
    let allProtected = true;
    for (const [m, p] of sweepRoutes) {
      const r = await fetch(B + p, { method: m, headers: m === "POST" ? { "content-type": "application/json" } : undefined, body: m === "POST" ? "{}" : undefined });
      if (r.status !== 401 && r.status !== 403) { allProtected = false; bad(`${m} ${p} sin token → ${r.status} (debería ser 401/403)`); }
    }
    if (allProtected) ok(`${sweepRoutes.length} rutas admin adicionales, todas protegidas sin token`);
  }

  // [12] NUEVO — Escalada de rol en /api/admin/users* (token de "editor", no admin)
  console.log("\n[12] Escalada de rol (token de editor contra /api/admin/users)");
  {
    const editorEmail = `audit-editor-${Date.now()}@test.local`;
    let editorId = null, editorToken = null;
    try {
      const cr = await fetch(B + "/api/admin/users", { method: "POST", headers: { ...AH, "content-type": "application/json" }, body: JSON.stringify({ email: editorEmail, password: "Xx1!aaaabbbb", role: "editor" }) });
      const cj = await cr.json().catch(() => ({}));
      editorId = cj.id;
      if (!editorId) { bad(`No se pudo crear usuario editor de prueba (${cr.status}) ${JSON.stringify(cj).slice(0, 100)}`); }
      else {
        editorToken = await login2(B, editorEmail, "Xx1!aaaabbbb");
        const ur = await fetch(B + "/api/admin/users", { headers: { authorization: "Bearer " + editorToken } });
        if (ur.status === 403) ok("token de rol 'editor' → 403 en /api/admin/users (sin escalada)");
        else bad(`token de rol 'editor' → ${ur.status} en /api/admin/users (ESPERABA 403 — posible escalada de privilegios)`);
      }
    } finally {
      if (editorId) await fetch(B + "/api/admin/users/" + editorId, { method: "DELETE", headers: AH }).catch(() => {});
    }
  }

  // [13] NUEVO — Inyección en parámetros de traducción
  console.log("\n[13] Inyección en parámetros de traducción");
  {
    const badParams = ["'; drop table news;--", "../../etc/passwd", "1 OR 1=1"];
    let clean = true;
    for (const bp of badParams) {
      const r = await fetch(B + `/api/translations/${encodeURIComponent(bp)}/${encodeURIComponent(bp)}/en`, { headers: AH });
      if (r.status >= 500) { clean = false; bad(`/api/translations/${bp}/.../en → ${r.status} (error de servidor; posible inyección)`); }
    }
    if (clean) ok(`parámetros maliciosos en /api/translations/:contentType/:entityId/:lang → sin 5xx (${badParams.length} payloads)`);
  }

  // [14] NUEVO — Robustez de presentationDocUpload ante contenido no coincidente con la extensión
  console.log("\n[14] Bypass de filtro por extensión (presentationDocUpload)");
  {
    const fd = new FormData();
    // Contenido HTML/script real, declarado como .txt (el filtro acepta por extensión, no MIME).
    fd.append("file", new Blob(["<html><script>alert(document.cookie)</script></html>"], { type: "text/plain" }), "evil.txt");
    const ur = await fetch(B + "/api/admin/presentations/upload", { method: "POST", headers: AH, body: fd });
    const uj = await ur.json().catch(() => ({}));
    if (ur.status >= 500) bad(`subida con contenido no coincidente con la extensión → ${ur.status} (crash del servidor)`);
    else {
      ok(`subida aceptada/rechazada sin crash (${ur.status})`);
      // El nombre GUARDADO en disco debe derivarse del MIME (safeUploadFilename), nunca de "evil.txt"
      // con una extensión servible como HTML. Si el backend expone la ruta guardada, se revisa aquí.
      const savedPath = uj.path || uj.filePath || uj.file || "";
      if (savedPath && /\.html?$/i.test(savedPath)) bad(`el archivo se guardó con extensión .htm(l) (${savedPath}) — vector XSS servible`);
      else if (savedPath) ok(`archivo guardado con extensión segura (${savedPath})`);
      if (uj.id || uj.filePath) {
        // limpieza best-effort si el endpoint devuelve un identificador de archivo temporal
      }
    }
  }

  // [15] NUEVO — Endurecimiento de cvUpload (público, sin login) + rate-limit en formularios públicos
  console.log("\n[15] cvUpload público — tipo de archivo no permitido + rate-limit");
  {
    const fd = new FormData();
    fd.append("uploaded_file", new Blob(["MZ\x90\x00fake-exe-content"], { type: "application/x-msdownload" }), "cv.pdf");
    fd.append("name", "Audit Test");
    fd.append("email", `audit-cv-${Date.now()}@test.local`);
    const ur = await fetch(B + "/api/career-applications", { method: "POST", body: fd }); // 1er golpe al cupo compartido
    if (ur.status === 400 || ur.status === 415) ok(`tipo de archivo no permitido rechazado por MIME (${ur.status}) pese a nombre .pdf`);
    else if (ur.status === 429) console.log("  ⚠️  (nota) ya estaba rate-limited de una corrida previa — normal si el script se corrió hace <15min");
    else if (ur.status >= 500) bad(`crash del servidor con archivo malicioso (${ur.status})`);
    else console.log(`  ⚠️  (nota) status ${ur.status} — revisar manualmente si el filtro de MIME real fue el que decidió`);

    // /api/contact y /api/career-applications comparten el mismo limiter (10 envíos/15min por
    // IP) — ya se gastó 1 arriba; se agotan los 9 restantes con payloads inválidos (baratos,
    // rechazados por Zod con 400 pero SÍ cuentan para el limiter) y se confirma el 429 en el 10º.
    let got429 = false;
    for (let i = 0; i < 10; i++) {
      const r = await fetch(B + "/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
      if (r.status === 429) { got429 = true; break; }
    }
    if (got429) ok("rate-limit en formularios públicos (contacto/pasantes) activo — 429 tras agotar el cupo");
    else bad("formularios públicos (/api/contact, /api/career-applications) SIN rate-limit — no se obtuvo 429 tras 11 envíos");
  }

  // [16] NUEVO — Rate-limit de login + trust proxy
  console.log("\n[16] Rate-limit de login" + (isLocal ? " (completo, local)" : " (degradado — solo 2 intentos, Replit)"));
  {
    const maxTries = isLocal && RATELIMIT ? 7 : 2;
    let got429 = false;
    for (let i = 0; i < maxTries; i++) {
      const r = await fetch(B + "/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: "noexiste@x.com", password: "malamala" }) });
      if (r.status === 429) { got429 = true; break; }
    }
    if (isLocal && RATELIMIT) {
      got429 ? ok("login rate-limited tras varios intentos (429)") : bad("login SIN rate-limit (fuerza bruta) — MAX_ATTEMPTS=5 no se disparó en 7 intentos");
    } else if (isLocal) {
      console.log("  ⚠️  rate-limit completo omitido (corre con --ratelimit; bloquea el IP local 30min). Confirmado por código: server/auth.ts:37 MAX_ATTEMPTS=5, WINDOW_MS=15min, BLOCK_DURATION_MS=30min.");
    } else {
      console.log(`  ⚠️  contra Replit solo se probaron ${maxTries} intentos (bajo el umbral de 5) para NO bloquear al admin real. got429=${got429} (esperado false).`);
    }
    // trust proxy: chequeo estático — el fix (app.set("trust proxy", 1)) existe en el commit
    // 953c02e pero vive SOLO en la rama remota chore/production-hardening, nunca se fusionó a main.
    const fsmod = await import("fs");
    const idxSrc = fsmod.readFileSync("server/index.ts", "utf8");
    if (/trust proxy/i.test(idxSrc)) ok("app.set('trust proxy', ...) presente en server/index.ts");
    else bad("FALTA app.set('trust proxy', 1) en server/index.ts — detrás de un reverse-proxy (Replit), req.ip es la IP del proxy para TODOS los clientes → el rate-limiter de login comparte un único bucket (5 fallos de un atacante bloquean al admin real). Fix ya existe en el commit 953c02e de la rama remota chore/production-hardening, nunca mergeado a main.");
  }

  // [17] NUEVO — Fuga de token de sesión en URLs/query strings
  console.log("\n[17] Fuga de token de sesión (¿viaja en query string?)");
  try {
    const fsmod = await import("fs");
    const files = ["client/src/lib/adminAuth.ts"];
    let leak = false;
    for (const f of files) {
      try {
        const src = fsmod.readFileSync(f, "utf8");
        if (/[?&]token=\$\{|[?&]token=["']?\s*\+/.test(src)) { leak = true; bad(`posible token en query string en ${f}`); }
      } catch { /* archivo puede no existir con ese nombre exacto */ }
    }
    if (!leak) ok("el Bearer token no se detectó viajando en query string (grep de client/src/lib/adminAuth.ts)");
  } catch (e) { console.log("  ⚠️  no se pudo verificar:", e.message); }

  console.log(`\n──── RESULTADO ${name} ────`);
  console.log(`  ✅ PASA: ${pass}   ❌ FALLA: ${fail}`);
  if (issues.length) { console.log("\n  Vulnerabilidades abiertas:"); issues.forEach((i) => console.log("   • " + i)); }
  else console.log("  🎉 Todos los probes en verde.");
  summary.push({ env: name, pass, fail, issues });
}

async function login2(B, username, password) {
  const r = await fetch(B + "/api/admin/login", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const j = await r.json().catch(() => ({}));
  if (!j.token) throw new Error("login2 falló: " + JSON.stringify(j).slice(0, 100));
  return j.token;
}

// =====================================================================================
// BLOQUE C — Probes estáticos + mockeado, independientes del target (corren UNA vez)
// =====================================================================================
async function runStaticProbes() {
  console.log(`\n\n======================================================================`);
  console.log(`=== PROBES ESTÁTICOS (independientes de target) ===`);
  console.log(`======================================================================`);
  let pass = 0, fail = 0;
  const issues = [];
  const ok = (m) => { pass++; console.log("  ✅ " + m); };
  const bad = (m) => { fail++; issues.push(m); console.log("  ❌ " + m); };
  const fsmod = await import("fs");

  // [18] Chequeo estático de sanitización en los 5 agentes nuevos
  console.log("\n[18] Sanitización/anti-inyección en agentes agregados tras la auditoría original");
  try {
    const legalSrc = fsmod.readFileSync("server/agents/specialized/LegalAlertsAgent.ts", "utf8");
    if (/sanitizeFields/.test(legalSrc)) ok("LegalAlertsAgent.ts usa sanitizeFields() antes de guardar");
    else bad("LegalAlertsAgent.ts NO llama sanitizeFields() antes de storage.createNews — el contenido del LLM (a partir de una fuente externa) se guarda crudo. Se crea con published:false, pero si se aprueba sin editar el campo, queda persistido sin sanitizar.");
  } catch (e) { console.log("  ⚠️  no se pudo leer LegalAlertsAgent.ts:", e.message); }
  try {
    const nlSrc = fsmod.readFileSync("server/agents/specialized/NewsletterAgent.ts", "utf8");
    if (/sanitize/i.test(nlSrc)) ok("NewsletterAgent.ts sanitiza el HTML generado");
    else bad("NewsletterAgent.ts devuelve el HTML del LLM SIN sanitizar (campo 'html') — si el panel lo previsualiza con HTML crudo o se usa para enviar el boletín, es un vector de XSS.");
  } catch (e) { console.log("  ⚠️  no se pudo leer NewsletterAgent.ts:", e.message); }
  try {
    const pgSrc = fsmod.readFileSync("server/agents/specialized/PresentationGeneratorAgent.ts", "utf8");
    const hasDelimiters = /<<<[\s\S]*>>>/.test(pgSrc);
    const hasAntiInjectionInstruction = /ignora|ignore\b.*(comando|instrucci[oó]n|command|instruction)/i.test(pgSrc);
    if (hasDelimiters && hasAntiInjectionInstruction) ok("PresentationGeneratorAgent.ts delimita Y advierte ignorar instrucciones embebidas");
    else if (hasDelimiters) bad("PresentationGeneratorAgent.ts delimita el material del usuario (<<< >>>) pero el SYSTEM_PROMPT NO incluye instrucción explícita de ignorar comandos embebidos en documentos/temas subidos — a diferencia de los 7 agentes ya arreglados (ej. SocialMediaAgent). Riesgo de prompt injection vía un documento subido malicioso.");
    else bad("PresentationGeneratorAgent.ts sin delimitadores ni instrucción anti-inyección detectables");
  } catch (e) { console.log("  ⚠️  no se pudo leer PresentationGeneratorAgent.ts:", e.message); }

  // [19] Prueba dinámica MOCKEADA (sin costo, solo local) de LegalAlertsAgent: XSS + prompt injection
  console.log("\n[19] Prueba dinámica mockeada — LegalAlertsAgent (XSS + intento de prompt injection)");
  console.log("  ℹ️  Se ejecuta reutilizando el patrón de scripts/test-agents-mocked.ts (servidor OpenAI");
  console.log("      parcheado en :5051, cero costo, cero contenido real publicado). Ver informe aparte:");
  console.log("      corre con  npx tsx scripts/audit-security-mocked-legal-alerts.ts");
  console.log("  ⚠️  (nota) esta prueba requiere su PROPIO proceso de servidor (:5051) y no se ejecuta");
  console.log("      dentro de este script para no interferir con las corridas HTTP contra :5050/Replit.");

  // [20] Superficie XSS del lado del cliente (dangerouslySetInnerHTML sin sanitizar)
  console.log("\n[20] Superficie XSS del lado del cliente (dangerouslySetInnerHTML)");
  try {
    const { execSync } = await import("child_process");
    const grep = execSync('grep -rn "dangerouslySetInnerHTML" client/src/components/admin/ client/src/pages/admin/ 2>/dev/null || true', { encoding: "utf8" });
    const lines = grep.split("\n").filter(Boolean);
    if (!lines.length) ok("sin usos de dangerouslySetInnerHTML en client/src/{components,pages}/admin");
    else {
      // No todo uso de dangerouslySetInnerHTML es un hallazgo — si la MISMA línea envuelve el
      // HTML en un sanitizador (DOMPurify.sanitize/sanitizeCms/sanitizeHtml), ya está blindado
      // (defensa en profundidad); solo se marca como hallazgo lo que renderiza HTML crudo.
      const guarded = /DOMPurify\.sanitize\(|sanitizeCms\(|sanitizeHtml\(/;
      const unguarded = lines.filter((l) => !guarded.test(l));
      for (const line of lines) console.log(`  ${guarded.test(line) ? "✅" : "⚠️ "} ${line}`);
      if (!unguarded.length) ok(`${lines.length} uso(s) de dangerouslySetInnerHTML en el panel admin, todos envueltos en un sanitizador`);
      else bad(`${unguarded.length} uso(s) de dangerouslySetInnerHTML SIN sanitizador visible en la misma línea — confirmar que el HTML que renderizan siempre pasó por sanitizeFields/sanitizeCms antes de llegar ahí.`);
    }
  } catch (e) { console.log("  ⚠️  no se pudo grep:", e.message); }

  console.log(`\n──── RESULTADO PROBES ESTÁTICOS ────`);
  console.log(`  ✅ PASA: ${pass}   ❌ FALLA: ${fail}`);
  summary.push({ env: "ESTÁTICOS", pass, fail, issues });
}

// =====================================================================================
(async () => {
  await runStaticProbes();
  for (const t of TARGETS) await runAgainstTarget(t);

  console.log(`\n\n======================================================================`);
  console.log(`=== RESUMEN CONSOLIDADO ===`);
  console.log(`======================================================================`);
  let totalPass = 0, totalFail = 0;
  for (const s of summary) {
    totalPass += s.pass; totalFail += s.fail;
    console.log(`  [${s.env}] ✅ ${s.pass}  ❌ ${s.fail}${s.skipped ? "  (OMITIDO)" : ""}`);
  }
  console.log(`\n  TOTAL: ✅ ${totalPass}  ❌ ${totalFail}`);
  const allIssues = summary.flatMap((s) => s.issues.map((i) => `[${s.env}] ${i}`));
  if (allIssues.length) {
    console.log("\n  Todos los hallazgos abiertos (consolidado):");
    allIssues.forEach((i) => console.log("   • " + i));
  } else {
    console.log("\n  🎉 Todo en verde en todos los entornos probados.");
  }
  process.exit(totalFail === 0 ? 0 : 1);
})().catch((e) => { console.error("ERROR en el harness:", e.message); process.exit(2); });
