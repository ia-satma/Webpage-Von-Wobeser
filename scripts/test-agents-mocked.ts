// Batería de agentes de IA en LOCAL, sin gastar créditos reales.
// Levanta su PROPIA instancia del servidor en :5051 (no toca el :5050 de desarrollo),
// parcheando openai.chat.completions.create ANTES de importar server/index.ts — todo
// lo demás usa una base AISLADA indicada en AGENT_TEST_DATABASE_URL.
// Uso: AGENT_TEST_DATABASE_URL=... npx tsx scripts/test-agents-mocked.ts
import "dotenv/config";
import { adminSessionHeaders, requireIsolatedSecurityTarget } from "./lib/admin-session.mjs";

const isolatedDatabaseUrl = (process.env.AGENT_TEST_DATABASE_URL || "").trim();
if (!isolatedDatabaseUrl) {
  throw new Error("AGENT_TEST_DATABASE_URL es obligatoria; no se permite usar DATABASE_URL en esta prueba.");
}
if (isolatedDatabaseUrl === (process.env.DATABASE_URL || "").trim()) {
  throw new Error("AGENT_TEST_DATABASE_URL debe ser distinta de DATABASE_URL.");
}
process.env.DATABASE_URL = isolatedDatabaseUrl;
process.env.PORT = "5051";
const B = "http://localhost:5051";
requireIsolatedSecurityTarget(B);
const sessionHeaders = adminSessionHeaders();

const { createSqlClient } = await import("./lib/postgres-sql.mjs");
const sql = createSqlClient(process.env.DATABASE_URL!);

let pass = 0, fail = 0, unhandled = 0;
const failures: { agent: string; scenario: string; detail: string }[] = [];
const agentRows: { agent: string; total: number; green: number; notes: string[] }[] = [];

function ok() { pass++; }
function bad(agent: string, scenario: string, detail: string) {
  fail++;
  failures.push({ agent, scenario, detail });
  console.log(`  ❌ [${agent}] ${scenario}: ${detail}`);
}

process.on("unhandledRejection", (e: any) => { unhandled++; console.log("  ⚠️  unhandledRejection:", e?.message || e); });
process.on("uncaughtException", (e: any) => { unhandled++; console.log("  ⚠️  uncaughtException:", e?.message || e); });

// --- 1) Parchar el cliente openai ANTES de levantar el server ---------------
type MockSpec = { content?: string; errorStatus?: number; errorMessage?: string };
const mockQueue: MockSpec[] = [];
function pushMock(...specs: MockSpec[]) { mockQueue.push(...specs); }
function drainMockQueue(): number { const n = mockQueue.length; mockQueue.length = 0; return n; }

const { openai } = await import("../server/openai");
(openai.chat.completions as any).create = async (_args: any) => {
  const spec = mockQueue.shift();
  if (!spec) throw new Error("MockQueue vacía — el agente hizo más llamadas de las esperadas");
  if (spec.errorStatus) {
    const err: any = new Error(spec.errorMessage || "mocked error");
    err.status = spec.errorStatus;
    throw err;
  }
  return { choices: [{ message: { content: spec.content ?? "" } }] };
};

// --- 2) Levantar el servidor real (DB real, rutas reales) en :5051 ----------
await import("../server/index");

async function waitReady() {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(B + "/api/agents/status");
      if (r.status) return;
    } catch { /* aún arrancando */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("El servidor de prueba en :5051 nunca respondió");
}

async function api(method: string, path: string, token: string, body?: any) {
  const r = await fetch(B + path, {
    method, headers: { "content-type": "application/json", ...sessionHeaders },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await r.json().catch(() => ({}));
  return { status: r.status, json };
}

// --- 3) Escenarios genéricos reutilizados por los agentes basados en JSON ----
function jsonScenarios(makeGood: (opts?: { empty?: boolean; long?: boolean; nonAscii?: boolean }) => any) {
  const good = makeGood();
  const goodStr = JSON.stringify(good);
  return [
    { name: "well_formed_json", specs: [{ content: goodStr }] },
    { name: "markdown_fenced_json", specs: [{ content: "```json\n" + goodStr + "\n```" }] },
    { name: "json_extra_fields", specs: [{ content: JSON.stringify({ ...good, debug: { note: "campo inesperado" } }) }] },
    { name: "campos_opcionales_vacios", specs: [{ content: JSON.stringify(makeGood({ empty: true })) }] },
    { name: "texto_muy_largo", specs: [{ content: JSON.stringify(makeGood({ long: true })) }] },
    { name: "no_ascii", specs: [{ content: JSON.stringify(makeGood({ nonAscii: true })) }] },
    { name: "json_con_prosa_alrededor", specs: [{ content: "Claro, aquí está:\n" + goodStr + "\nEspero que ayude." }] },
    { name: "json_roto_guard", specs: [{ content: "Lo siento, no puedo completar esta tarea en este formato." }] },
    { name: "cuota_429_luego_fallback", specs: [{ errorStatus: 429, errorMessage: "Rate limit exceeded" }, { content: goodStr }] },
  ];
}

async function runJsonAgent(
  agentLabel: string, agentType: string, token: string,
  payloadBuilder: () => any,
  scenarios: ReturnType<typeof jsonScenarios>,
  assertFn: (scenarioName: string, r: any) => Promise<boolean | string>,
  cleanupFn?: () => Promise<void>,
) {
  let green = 0;
  for (const sc of scenarios) {
    pushMock(...(sc.specs as MockSpec[]));
    try {
      const r = await api("POST", `/api/agents/run/${agentType}`, token, payloadBuilder());
      const verdict = await assertFn(sc.name, r);
      if (verdict === true) { ok(); green++; }
      else bad(agentLabel, sc.name, typeof verdict === "string" ? verdict : `respuesta inesperada: ${JSON.stringify(r.json).slice(0, 200)}`);
    } catch (e: any) {
      bad(agentLabel, sc.name, "threw: " + e.message);
    } finally {
      const leftover = drainMockQueue();
      if (leftover) bad(agentLabel, sc.name, `cola de mocks con ${leftover} sobrantes (el agente hizo menos llamadas de las esperadas)`);
      await cleanupFn?.().catch(() => {});
    }
  }
  agentRows.push({ agent: agentLabel, total: scenarios.length, green, notes: [] });
}

// -----------------------------------------------------------------------------
(async () => {
  console.log(`\n=== BATERÍA DE AGENTES (IA SIMULADA) — ${B} ===`);
  await waitReady();
  const token = "cookie-session";

  // --- Fixtures --------------------------------------------------------------
  const sandboxTs = Date.now();
  const sandboxContent = "Contenido de prueba suficientemente largo para que los agentes tengan algo que analizar. ".repeat(5);
  const sandboxSlug = "mock-sandbox-" + sandboxTs;
  // OJO: TODOS los valores van interpolados con ${} — un literal SQL suelto (p.ej.
  // 'texto'.repeat(5) escrito directo en la plantilla, sin ${}) se manda tal cual a
  // Postgres como texto crudo y truena con "syntax error at or near .".
  const [sandbox] = await sql`
    insert into news (title, title_es, excerpt, excerpt_es, content, content_es, slug, category, category_es, published)
    values (${"Mock Sandbox Article"}, ${"Artículo Sandbox Mock"},
            ${"Excerpt for agent testing"}, ${"Extracto para pruebas de agentes"},
            ${sandboxContent}, ${sandboxContent},
            ${sandboxSlug}, ${"press"}, ${"Prensa"}, ${false})
    returning id, slug
  `;
  const SANDBOX_ID = sandbox.id;
  console.log(`Fixture: artículo sandbox id=${SANDBOX_ID}`);

  const [teamMember] = await sql`select name from team_members limit 1`;
  const REAL_LASTNAME = (teamMember?.name || "Barradas").trim().split(/\s+/).pop();
  console.log(`Fixture: apellido real para metadata_linker = "${REAL_LASTNAME}"`);

  const FIXED_CATEGORY_SLUG = "prueba-automatizada-mock-test";
  const FIXED_CATEGORY_NAME = "Prueba Automatizada Mock";

  // --- content_analyzer --------------------------------------------------
  await runJsonAgent("content_analyzer", "content_analyzer", token,
    () => ({ articleId: SANDBOX_ID }),
    jsonScenarios((o) => ({
      seoRecommendations: { keywords: o?.long ? Array(50).fill("palabra clave larga ".repeat(20)) : ["k1", "k2"], titleSuggestion: "t", metaDescription: "d", headingImprovements: [], contentGaps: [], internalLinkOpportunities: [] },
      categories: { primary: o?.nonAscii ? "日本語カテゴリ" : "Corporativo", secondary: [] },
      spellingGrammar: [], lawyersMentioned: [], legalBranches: { primary: [], secondary: [] },
      industries: { primary: "Legal", secondary: [] },
      qualityScore: o?.empty ? 0 : 85,
    })),
    async (name, r) => {
      if (name === "json_roto_guard") return r.json?.success === false;
      if (r.status !== 200 || r.json?.success !== true) return false;
      const [row] = await sql`select id from content_analysis where article_id = ${SANDBOX_ID}`;
      return !!row;
    },
    async () => { await sql`delete from content_analysis where article_id = ${SANDBOX_ID}`; },
  );

  // --- formatter --------------------------------------------------------
  // Se envía `content` directo (no articleId): FormatterAgent escribe result.content de
  // vuelta al artículo cuando se le da articleId — usar el sandbox compartido hubiera
  // hecho que cada pase corrompiera el contenido de entrada del siguiente pase (confirmado:
  // el pase con content:"x" dejaba el artículo en 1 carácter, tronando los pases siguientes
  // con "Content too short to format"). Con `content` no hay lectura/escritura de DB.
  await runJsonAgent("formatter", "formatter", token,
    () => ({ content: sandboxContent, title: "Sandbox Title" }),
    jsonScenarios((o) => ({
      title: o?.long ? "Título ".repeat(200) : "Título Formateado",
      content: o?.empty ? "x" : (o?.nonAscii ? "コンテンツ日本語 " + "<p>texto</p>".repeat(3) : "<p>Contenido formateado limpio</p>".repeat(3)),
      excerpt: o?.empty ? "" : "Extracto formateado",
    })),
    async (name, r) => {
      if (name === "json_roto_guard") return r.json?.success === false;
      return r.status === 200 && r.json?.success === true;
    },
  );

  // --- seo_optimizer ------------------------------------------------------
  await runJsonAgent("seo_optimizer", "seo_optimizer", token,
    () => ({ articleId: SANDBOX_ID, applyChanges: false }),
    jsonScenarios((o) => ({
      optimizedTitle: "Título SEO", optimizedTitleEs: "Título SEO ES",
      metaDescription: "meta", metaDescriptionEs: "meta es",
      suggestedSlug: "slug-seo-" + sandboxTs,
      keywords: o?.long ? Array(100).fill("k") : ["k1"], keywordsEs: ["k1es"],
      seoScore: o?.empty ? 0 : 90,
      improvements: [],
    })),
    async (name, r) => {
      if (name === "json_roto_guard") return r.json?.success === false;
      return r.status === 200 && r.json?.success === true;
    },
  );

  // --- category_agent (dedup: misma categoría en las 9 corridas) --------
  await runJsonAgent("category_agent", "category_agent", token,
    () => ({ articleId: SANDBOX_ID }),
    jsonScenarios((o) => ({
      primaryCategory: FIXED_CATEGORY_NAME, categorySlug: FIXED_CATEGORY_SLUG,
      practiceAreas: [], industrySectors: [],
      tags: o?.long ? Array(50).fill("tag") : ["tag1"],
      confidence: o?.empty ? 0 : 0.9,
      reasoning: o?.nonAscii ? "理由日本語" : "razón",
    })),
    async (name, r) => {
      if (name === "json_roto_guard") return r.json?.success === false;
      return r.status === 200 && r.json?.success === true;
    },
  );
  // CategoryAgent ya no persiste en una tabla de categorías (blog_categories se eliminó
  // junto con Blog) — ahora escribe category/categoryEs directo en el artículo. Verificamos eso.
  const [newsRow] = await sql`select category, category_es from news where id = ${SANDBOX_ID}`;
  if (newsRow?.category === FIXED_CATEGORY_NAME && newsRow?.category_es === FIXED_CATEGORY_NAME) ok();
  else bad("category_agent", "writes_news_category", `esperaba news.category/category_es = "${FIXED_CATEGORY_NAME}", encontró category="${newsRow?.category}" category_es="${newsRow?.category_es}"`);

  // --- polyglot_translator (formato de marcadores, NO JSON) --------------
  {
    const agentLabel = "polyglot_translator";
    let green = 0;
    const markerScenarios = [
      { name: "marcadores_bien_formados", content: "[[TITLE]]\nTitel DE\n[[EXCERPT]]\nAuszug DE\n[[CONTENT]]\n<p>Inhalt DE</p>" },
      { name: "marcadores_con_espacios", content: "[[TITLE]]\n  Titel DE 2  \n[[EXCERPT]]\n Auszug DE 2 \n[[CONTENT]]\n<p>Inhalt DE 2</p>\n" },
      { name: "texto_largo_en_content", content: "[[TITLE]]\nTitel Largo\n[[EXCERPT]]\nAuszug\n[[CONTENT]]\n" + "<p>Párrafo largo alemán simulado. </p>".repeat(100) },
      { name: "sin_marcadores_fallback", content: "Esto no trae ningún marcador especial." },
    ];
    for (const sc of markerScenarios) {
      pushMock({ content: sc.content });
      try {
        const r = await api("POST", "/api/agents/run/polyglot_translator", token, { articleId: SANDBOX_ID, targetLanguages: ["de"] });
        const passed = r.status === 200 && r.json?.success === true;
        if (passed) { ok(); green++; } else bad(agentLabel, sc.name, `respuesta inesperada: ${JSON.stringify(r.json).slice(0, 200)}`);
      } catch (e: any) {
        bad(agentLabel, sc.name, "threw: " + e.message);
      } finally {
        drainMockQueue();
      }
    }
    const [tc] = await sql`select id from translation_cache where content_type='news' and entity_id=${SANDBOX_ID} and target_language='de'`;
    if (tc) { ok(); green++; } else bad(agentLabel, "db_check", "no se creó translation_cache para de");
    await sql`delete from translation_cache where content_type='news' and entity_id=${SANDBOX_ID} and target_language='de'`;
    // news_translations cascada al borrar el sandbox al final — se confirma ahí.
    agentRows.push({ agent: agentLabel, total: markerScenarios.length + 1, green, notes: ["formato [[TITLE]]/[[EXCERPT]]/[[CONTENT]] confirmado — sin jsonMode"] });
  }

  // --- metadata_linker (real vs inexistente) ------------------------------
  {
    const agentLabel = "metadata_linker";
    let green = 0, total = 0;
    for (const [name, authorPattern] of [["apellido_real", REAL_LASTNAME], ["apellido_inexistente", "Zzzznoexiste"]] as const) {
      total++;
      pushMock({ content: JSON.stringify({ practiceAreas: [], industries: [], authorPatterns: [authorPattern] }) });
      try {
        const r = await api("POST", "/api/agents/run/metadata_linker", token, { articleId: SANDBOX_ID });
        const rows = await sql`select id from news_team_members where news_id = ${SANDBOX_ID}`;
        const expectLinked = name === "apellido_real";
        const passed = r.status === 200 && r.json?.success === true && (expectLinked ? rows.length > 0 : rows.length === 0);
        if (passed) { ok(); green++; } else bad(agentLabel, name, `esperaba ${expectLinked ? ">0" : "0"} filas en news_team_members, obtuvo ${rows.length}`);
        await sql`delete from news_team_members where news_id = ${SANDBOX_ID}`;
      } catch (e: any) {
        bad(agentLabel, name, "threw: " + e.message);
      } finally {
        drainMockQueue();
      }
    }
    agentRows.push({ agent: agentLabel, total, green, notes: [] });
  }

  // --- image_suggestion (solo se mockea el texto; la imagen real degrada a placeholder) ---
  await runJsonAgent("image_suggestion", "image_suggestion", token,
    () => ({ articleId: SANDBOX_ID }),
    jsonScenarios((o) => ({
      imagePrompt: o?.long ? "prompt ".repeat(200) : "corporate legal office, burgundy accent, elegant",
      themes: o?.empty ? [] : ["legal", "corporate"],
      style: o?.nonAscii ? "スタイル日本語" : "corporate",
    })),
    async (name, r) => {
      if (name === "json_roto_guard") return r.json?.success === false || r.json?.success === true; // ambos aceptables: puede degradar a placeholder sin tronar
      return r.status === 200; // el engine real (cloudflare/gemini/dalle/placeholder) puede variar según credenciales locales
    },
  );

  // --- social_media --------------------------------------------------------
  await runJsonAgent("social_media", "social_media", token,
    () => ({ articleId: SANDBOX_ID }),
    jsonScenarios((o) => ({
      linkedin: o?.empty ? "" : "Post de LinkedIn de prueba.",
      linkedinHashtags: ["#Legal"],
      twitter: o?.long ? "x".repeat(270) : "Post corto",
      twitterHashtags: ["#VWyS"],
      imagePrompt: o?.nonAscii ? "画像プロンプト" : "legal office image",
    })),
    async (name, r) => {
      if (name === "campos_opcionales_vacios") return r.json?.success === false; // linkedin vacío → guard explícito
      if (name === "json_roto_guard") return r.json?.success === false;
      return r.status === 200 && r.json?.success === true;
    },
  );

  // --- newsletter (sin DB writes) --------------------------------------------
  await runJsonAgent("newsletter", "newsletter", token,
    () => ({ limit: 5 }),
    jsonScenarios((o) => ({
      subject: o?.empty ? "" : "Boletín de prueba",
      preheader: "preview",
      html: o?.empty ? "" : "<p>Boletín</p>".repeat(o?.long ? 200 : 1),
    })),
    async (name, r) => {
      if (name === "campos_opcionales_vacios") return r.json?.success === false; // html vacío → guard explícito
      if (name === "json_roto_guard") return r.json?.success === false;
      return r.status === 200 && r.json?.success === true;
    },
  );

  // --- legal_alerts (disparo manual + regresión) -----------------------------
  {
    const agentLabel = "legal_alerts";
    let green = 0, total = 0;
    const draftScenarios = jsonScenarios((o) => ({
      titleEs: o?.empty ? "" : "Alerta legal de prueba",
      title: "Legal alert test", excerptEs: "Extracto", excerpt: "Excerpt",
      contentEs: o?.long ? "Contenido ".repeat(300) : "Contenido de la alerta",
      content: "Alert content", slug: "alerta-mock-" + sandboxTs,
    }));
    const createdIds: string[] = [];
    for (const sc of draftScenarios) {
      total++;
      pushMock(...(sc.specs as MockSpec[]));
      try {
        const r = await api("POST", "/api/agents/run/legal_alerts", token, { sourceText: "Texto de fuente oficial simulada para pruebas de agentes, con al menos cuarenta caracteres." });
        let passed: boolean;
        if (sc.name === "json_roto_guard" || sc.name === "campos_opcionales_vacios") {
          passed = r.json?.success === false;
        } else {
          passed = r.status === 200 && r.json?.success === true && !!r.json?.data?.newsId;
          if (passed) createdIds.push(r.json.data.newsId);
        }
        if (passed) { ok(); green++; } else bad(agentLabel, sc.name, `respuesta inesperada: ${JSON.stringify(r.json).slice(0, 200)}`);
      } catch (e: any) {
        bad(agentLabel, sc.name, "threw: " + e.message);
      } finally {
        drainMockQueue();
      }
    }
    for (const id of createdIds) await sql`delete from news where id = ${id}`.catch(() => {});

    // Regresión: isRelevantToPractice() — el bug real de esta sesión (!!parsed?.relevant
    // trataba el string "false" como verdadero). Se llama la función exportada directo.
    const { isRelevantToPractice } = await import("../server/agents/specialized/legalAlertsScanner");
    const regressionCases: [string, MockSpec, boolean][] = [
      ["relevant_string_false", { content: JSON.stringify({ relevant: "false", matchedPractice: "Litigio" }) }, false],
      ["relevant_boolean_true", { content: JSON.stringify({ relevant: true, matchedPractice: "Corporativo" }) }, true],
      ["relevant_boolean_false", { content: JSON.stringify({ relevant: false }) }, false],
      ["respuesta_no_json", { content: "no puedo evaluar esto" }, false],
    ];
    for (const [name, spec, expected] of regressionCases) {
      total++;
      pushMock(spec);
      try {
        const result = await isRelevantToPractice("texto de prueba", ["Litigio", "Corporativo"]);
        if (result.relevant === expected) { ok(); green++; }
        else bad(agentLabel, name, `esperaba relevant=${expected}, obtuvo ${result.relevant} — ¿regresó el bug !!parsed?.relevant?`);
      } catch (e: any) {
        bad(agentLabel, name, "threw: " + e.message);
      } finally {
        drainMockQueue();
      }
    }
    agentRows.push({ agent: agentLabel, total, green, notes: ["incluye la prueba de regresión relevant:\"false\" (string) del bug de esta sesión"] });
  }

  // --- content_auditor (estructural, sin IA — 5 variantes de scanType) -------
  {
    const agentLabel = "content_auditor";
    let green = 0;
    const scanTypes = [undefined, "full", "metadata", "translations", "formatting"];
    for (const scanType of scanTypes) {
      try {
        const r = await api("POST", "/api/agents/run/content_auditor", token, scanType ? { scanType } : {});
        if (r.status === 200 && r.json?.success !== false) { ok(); green++; }
        else bad(agentLabel, String(scanType), `status=${r.status} success=${r.json?.success}`);
      } catch (e: any) {
        bad(agentLabel, String(scanType), "threw: " + e.message);
      }
    }
    agentRows.push({ agent: agentLabel, total: scanTypes.length, green, notes: ["sin LLM, sin escritura — read-only y determinista: variación por scanType, no por repetición idéntica"] });
  }

  // --- website_auditor (estructural, sin IA — 5 variantes de skipModules) ---
  {
    const agentLabel = "website_auditor";
    let green = 0;
    const auditIds: string[] = [];
    const variants = [
      {}, { skipModules: ["news"] }, { skipModules: ["attorneys"] },
      { skipModules: ["practices", "industries"] }, { skipModules: ["seo"] },
    ];
    for (const v of variants) {
      try {
        const r = await api("POST", "/api/agents/run/website_auditor", token, v);
        if (r.status === 200 && r.json?.success !== false && r.json?.data?.auditId) { ok(); green++; auditIds.push(r.json.data.auditId); }
        else bad(agentLabel, JSON.stringify(v), `status=${r.status} ${JSON.stringify(r.json).slice(0, 150)}`);
      } catch (e: any) {
        bad(agentLabel, JSON.stringify(v), "threw: " + e.message);
      }
    }
    for (const id of auditIds) await sql`delete from website_audits where id = ${id}`.catch(() => {});
    agentRows.push({ agent: agentLabel, total: variants.length, green, notes: ["sin LLM — variación por skipModules (cada uno ejercita un scanner distinto)"] });
  }

  // --- Limpieza final del fixture + verificación de cascada -------------------
  await sql`delete from news where id = ${SANDBOX_ID}`;
  const [leftoverTranslations] = await sql`select count(*)::int as n from news_translations where news_id = ${SANDBOX_ID}`;
  const dbClean = (leftoverTranslations?.n ?? 0) === 0;

  // --- Reporte -----------------------------------------------------------
  console.log("\n=== PROBADO Y FUNCIONA ===");
  for (const r of agentRows) {
    console.log(`  ${r.green === r.total ? "✅" : "⚠️ "} ${r.agent} — ${r.green}/${r.total} escenarios verdes`);
    for (const n of r.notes) console.log(`      · ${n}`);
  }

  if (failures.length) {
    console.log("\n=== FALLAS CON REPRO ===");
    for (const f of failures) console.log(`  ❌ [${f.agent}] ${f.scenario}: ${f.detail}`);
  }

  console.log(`\nunhandledRejection/uncaughtException durante la corrida: ${unhandled}`);
  console.log(`DB limpia (news_translations cascada del sandbox): ${dbClean ? "✅ sí" : "❌ NO"}`);
  console.log(`\nPASS: ${pass}  FAIL: ${fail}`);
  process.exit(fail > 0 || unhandled > 0 || !dbClean ? 1 : 0);
})();
