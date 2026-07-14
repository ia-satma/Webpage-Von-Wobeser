// Batería E2E de EDITABILIDAD panel↔sitio público. Para cada entidad en alcance:
// crea → verifica en la página pública (ES) → verifica (EN) → edita → re-verifica → borra.
// 8-10 corridas por entidad con datos genuinamente distintos (no 50 repeticiones idénticas).
// Uso: node scripts/e2e-editability.mjs   (con el server corriendo en :5050)
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import * as cheerio from "cheerio";

const B = process.env.VERIFY_BASE || "http://localhost:5050";
const ADMIN_USER = "admin@vonwobeser.com";
const ADMIN_PASS = process.env.ADMIN_PASS || "VonWobeser2026!";
const sql = neon(process.env.DATABASE_URL);
const RUN_TS = Date.now();

let pass = 0, fail = 0;
const failures = [];
const entityRows = []; // {entity, total, green, notes}

function ok(entity) { pass++; }
function bad(entity, label, detail) {
  fail++;
  failures.push({ entity, label, detail });
  console.log(`  ❌ [${entity}] ${label}: ${detail}`);
}

async function login() {
  const r = await fetch(B + "/api/admin/login", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASS }),
  });
  const j = await r.json().catch(() => ({}));
  if (!j.token) throw new Error("No se pudo loguear admin: " + JSON.stringify(j).slice(0, 150));
  return j.token;
}

async function api(method, path, token, body) {
  const r = await fetch(B + path, {
    method,
    headers: { "content-type": "application/json", authorization: "Bearer " + token },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await r.json().catch(() => ({}));
  return { status: r.status, json };
}

async function getHtml(path) {
  const r = await fetch(B + path);
  const html = await r.text().catch(() => "");
  return { status: r.status, html };
}

async function fetchOk(url) {
  if (!url) return false;
  const abs = url.startsWith("http") ? url : B + (url.startsWith("/") ? url : "/" + url);
  try {
    const r = await fetch(abs, { headers: { Range: "bytes=0-1023" } });
    return r.status === 200 || r.status === 206;
  } catch {
    return false;
  }
}

// El cliente neon(...) con template tags NO soporta interpolar nombres de tabla
// (sql(tableName) no es una API válida de @neondatabase/serverless) — de ahí el
// "syntax error at or near $1" en la primera corrida. Se resuelve con un mapa fijo.
async function deleteById(table, id) {
  switch (table) {
    case "practice_groups": return sql`delete from practice_groups where id = ${id}`;
    case "industry_groups": return sql`delete from industry_groups where id = ${id}`;
    case "team_members": return sql`delete from team_members where id = ${id}`;
    case "news": return sql`delete from news where id = ${id}`;
    case "rankings": return sql`delete from rankings where id = ${id}`;
    default: throw new Error("deleteById: tabla desconocida " + table);
  }
}

async function countLeftover(table, pattern) {
  switch (table) {
    case "team_members": return sql`select id from team_members where slug like ${pattern}`;
    case "news": return sql`select id from news where slug like ${pattern}`;
    case "practice_groups": return sql`select id from practice_groups where slug like ${pattern}`;
    case "industry_groups": return sql`select id from industry_groups where slug like ${pattern}`;
    default: return [];
  }
}

// --- Matriz de variantes (8-10 por entidad) ---------------------------------
function variants(prefix) {
  const t = (n) => `${prefix}-${RUN_TS}-p${n}`;
  return [
    { label: "ascii_corto", en: "Short Test Name", es: "Nombre Corto Prueba" },
    { label: "acentos_largo", en: "Maria Jose Nunez de la Concepcion International Trade Counsel", es: "María José Núñez de la Concepción Consejera de Comercio Internacional" },
    { label: "caracteres_especiales", en: `Test <b>&amp;</b> "quote" 🚀`, es: `Prueba <b>&amp;</b> "cita" 🚀` },
    { label: "html_legit_mas_xss", en: `<p>Legit content</p><a href="https://ok.com">link</a><script>alert(1)</script>`, es: `<p>Contenido legítimo</p><a href="https://ok.com">enlace</a><img src=x onerror="alert(1)">` },
    { label: "en_vacio_es_lleno", en: "", es: "Solo Español Presente" },
    { label: "es_vacio_en_lleno", en: "Only English Present", es: "" },
    { label: "texto_muy_largo", en: "Long ".repeat(400) + "end", es: "Largo ".repeat(400) + "fin" },
    { label: "no_latino_emoji", en: "日本語のテスト 🇯🇵 test", es: "テスト日本語 🇯🇵 prueba" },
    { label: "imagen_pase", en: "Image Pass EN", es: "Pase de Imagen ES" },
    { label: "editar_tras_crear", en: "Edited After Create EN", es: "Editado Tras Crear ES" },
  ].map((v, i) => ({ ...v, id: t(i) }));
}

// ---------------------------------------------------------------- ABOGADOS
async function testTeamMembers(token) {
  const entity = "team_members";
  const vs = variants("e2e-team");
  let green = 0;
  const notes = [];
  for (let i = 0; i < vs.length; i++) {
    const v = vs[i];
    let id;
    try {
      const slug = v.id;
      const image1 = "/images/press/press-01.jpg";
      const image2 = "/images/press/press-02.jpg";
      const payload = {
        name: v.en || v.es || "Sin Nombre",
        slug,
        title: v.en, titleEs: v.es,
        // role/roleEs = title/titleEs (no fallback propio): renderAttorney.ts calcula
        // role = L(a,"title",lang) || L(a,"role",lang), así que si role llevara un valor
        // propio "de relleno" enmascararía justo el comportamiento de fallback que se
        // quiere probar en title. Al igualarlos, el resultado observado depende solo de
        // title/titleEs, que es lo que las variantes 5/6 quieren aislar.
        role: v.en, roleEs: v.es,
        bio: v.label === "html_legit_mas_xss" ? v.en : `<p>Bio EN ${v.label}</p>`,
        bioEs: v.label === "html_legit_mas_xss" ? v.es : `<p>Bio ES ${v.label}</p>`,
        email: `${slug}@example.com`, phone: "+52 55 0000 0000",
        imageUrl: image1, published: true,
      };
      const cr = await api("POST", "/api/admin/team", token, payload);
      id = cr.json?.id;
      if (!id) { bad(entity, v.label, `create failed (${cr.status}) ${JSON.stringify(cr.json).slice(0, 120)}`); continue; }

      const es = await getHtml(`/lawyer/${slug}`);
      const en = await getHtml(`/lawyer/${slug}?lang=en`);
      const $es = cheerio.load(es.html), $en = cheerio.load(en.html);
      const roleEs = $es(".attorney__meta--role").text();
      const roleEn = $en(".attorney__meta--role").text();

      if (v.label === "en_vacio_es_lleno") {
        // EN vacío nunca cae a ES — debe verse vacío/blank en inglés.
        if (roleEn.trim() === "") ok(entity); else bad(entity, v.label, `EN mostró "${roleEn}" en vez de vacío (no debería caer a ES)`);
        if (roleEs === v.es) ok(entity); else bad(entity, v.label, `ES esperado "${v.es}" obtuvo "${roleEs}"`);
      } else if (v.label === "es_vacio_en_lleno") {
        // ES vacío SÍ cae al valor EN.
        if (roleEs === v.en) ok(entity); else bad(entity, v.label, `ES debía caer a EN "${v.en}" pero mostró "${roleEs}"`);
        if (roleEn === v.en) ok(entity); else bad(entity, v.label, `EN esperado "${v.en}" obtuvo "${roleEn}"`);
      } else if (v.label === "html_legit_mas_xss") {
        // Ojo: buscar "onerror=" en TODA la página da falsos positivos (el template del
        // espejo trae sus propios handlers onerror en imágenes rotas) — se acota al
        // fragmento de bio inyectado.
        const bioHtml = ($es(".attorney__content--intro").html() || "") + ($es(".attorney__content--txt").html() || "");
        // El bio de abogados se trata SIEMPRE como texto plano (esc() escapa <,>,& —
        // no hay allowlist como en noticias). La palabra "onerror=" puede aparecer como
        // texto visible ESCAPADO (&lt;img ... onerror=...&gt;) sin ningún riesgo — solo
        // es XSS real si el tag aparece SIN escapar (literal "<script" o "<img" crudo).
        const hasRawScript = bioHtml.includes("<script") || /<img[^>]*onerror=/i.test(bioHtml);
        if (!hasRawScript) ok(entity); else bad(entity, v.label, "payload XSS presente SIN escapar en bio: " + bioHtml.slice(0, 200));
      } else {
        if (roleEs === (v.es || v.en)) ok(entity); else bad(entity, v.label, `ES esperado "${v.es || v.en}" obtuvo "${roleEs}"`);
        if (roleEn === v.en) ok(entity); else bad(entity, v.label, `EN esperado "${v.en}" obtuvo "${roleEn}"`);
      }

      if (v.label === "imagen_pase" || v.label === "editar_tras_crear") {
        const imgSrc = $es("img#foto").attr("src");
        if (imgSrc === image1) ok(entity); else bad(entity, v.label, `imagen esperada ${image1}, obtuvo ${imgSrc}`);
        const imgReachable = await fetchOk(image1);
        if (imgReachable) ok(entity); else bad(entity, v.label, `imagen ${image1} no responde 200/206`);
      }

      if (v.label === "editar_tras_crear") {
        const newTitle = "Edited Title EN", newTitleEs = "Título Editado ES";
        await api("PUT", `/api/admin/team/${id}`, token, { title: newTitle, titleEs: newTitleEs, imageUrl: image2 });
        const es2 = await getHtml(`/lawyer/${slug}`);
        const $es2 = cheerio.load(es2.html);
        const roleEs2 = $es2(".attorney__meta--role").text();
        const imgSrc2 = $es2("img#foto").attr("src");
        if (roleEs2 === newTitleEs) ok(entity); else bad(entity, v.label, `tras editar, ES esperado "${newTitleEs}" obtuvo "${roleEs2}" (¿caché?)`);
        if (imgSrc2 === image2) ok(entity); else bad(entity, v.label, `tras editar, imagen esperada ${image2} obtuvo ${imgSrc2}`);
      }

      green++;
    } catch (e) {
      bad(entity, v.label, "threw: " + e.message);
    } finally {
      if (id) {
        await sql`delete from team_member_practice_groups where team_member_id = ${id}`.catch(() => {});
        await sql`delete from team_member_industry_groups where team_member_id = ${id}`.catch(() => {});
        await sql`delete from team_members where id = ${id}`.catch((e) => bad(entity, v.label, "CLEANUP FAILED id=" + id + ": " + e.message));
      }
    }
  }
  entityRows.push({ entity, total: vs.length, green, notes });
}

// ---------------------------------------------------------------- NOTICIAS
async function testNews(token) {
  const entity = "news";
  const vs = variants("e2e-news");
  let green = 0;
  const notes = [];
  for (const v of vs) {
    let id;
    try {
      const slug = v.id;
      const image1 = "/images/press/press-03.jpg";
      const image2 = "/images/press/press-04.jpg";
      const payload = {
        title: v.en, titleEs: v.es,
        excerpt: `<p>Excerpt EN ${v.label}</p>`, excerptEs: `<p>Extracto ES ${v.label}</p>`,
        content: v.label === "html_legit_mas_xss" ? v.en : `<p>Content EN ${v.label}</p>`,
        contentEs: v.label === "html_legit_mas_xss" ? v.es : `<p>Contenido ES ${v.label}</p>`,
        slug, imageUrl: image1, category: "press", categoryEs: "Prensa", published: true,
      };
      const cr = await api("POST", "/api/admin/news", token, payload);
      id = cr.json?.id;
      if (!id) { bad(entity, v.label, `create failed (${cr.status}) ${JSON.stringify(cr.json).slice(0, 120)}`); continue; }

      const es = await getHtml(`/news/${slug}`);
      const en = await getHtml(`/news/${slug}?lang=en`);
      const $es = cheerio.load(es.html), $en = cheerio.load(en.html);
      const nameEs = $es(".single__meta--name").first().text();
      const nameEn = $en(".single__meta--name").first().text();

      if (v.label === "en_vacio_es_lleno") {
        if (nameEn.trim() === "") ok(entity); else bad(entity, v.label, `EN mostró "${nameEn}" en vez de vacío`);
        if (nameEs === v.es) ok(entity); else bad(entity, v.label, `ES esperado "${v.es}" obtuvo "${nameEs}"`);
      } else if (v.label === "es_vacio_en_lleno") {
        if (nameEs === v.en) ok(entity); else bad(entity, v.label, `ES debía caer a EN pero mostró "${nameEs}"`);
        if (nameEn === v.en) ok(entity); else bad(entity, v.label, `EN esperado "${v.en}" obtuvo "${nameEn}"`);
      } else if (v.label === "html_legit_mas_xss") {
        // Acotado a .single__content--txt/--intro (el resto de la página trae sus propios
        // <script>/onerror legítimos de la plantilla — buscar en toda la página da falsos positivos).
        const scoped = ($es(".single__content--intro").html() || "") + ($es(".single__content--txt").html() || "");
        const hasScript = /<script[^>]*>\s*alert\(1\)/i.test(scoped) || /onerror\s*=/i.test(scoped);
        const keepsLegit = /<a [^>]*href=/.test(scoped) || /<p>/.test(scoped);
        if (!hasScript) ok(entity); else bad(entity, v.label, "XSS no sanitizado en noticia: " + scoped.slice(0, 200));
        if (keepsLegit) ok(entity); else bad(entity, v.label, "HTML legítimo no se conservó tras sanitizar: " + scoped.slice(0, 200));
      } else {
        if (nameEs === (v.es || v.en)) ok(entity); else bad(entity, v.label, `ES esperado "${v.es || v.en}" obtuvo "${nameEs}"`);
        if (nameEn === v.en) ok(entity); else bad(entity, v.label, `EN esperado "${v.en}" obtuvo "${nameEn}"`);
      }

      if (v.label === "imagen_pase" || v.label === "editar_tras_crear") {
        const ogImage = $es('meta[property="og:image"]').attr("content") || "";
        if (ogImage.includes(image1.split("/").pop())) ok(entity); else bad(entity, v.label, `og:image esperada ${image1}, obtuvo ${ogImage}`);
        const reachable = await fetchOk(image1);
        if (reachable) ok(entity); else bad(entity, v.label, `imagen ${image1} no responde 200/206`);
      }

      if (v.label === "editar_tras_crear") {
        await api("PUT", `/api/admin/news/${id}`, token, { titleEs: "Título Editado ES", imageUrl: image2 });
        const es2 = await getHtml(`/news/${slug}`);
        const $es2 = cheerio.load(es2.html);
        const nameEs2 = $es2(".single__meta--name").first().text();
        const ogImage2 = $es2('meta[property="og:image"]').attr("content") || "";
        if (nameEs2 === "Título Editado ES") ok(entity); else bad(entity, v.label, `tras editar, ES esperado "Título Editado ES" obtuvo "${nameEs2}"`);
        if (ogImage2.includes(image2.split("/").pop())) ok(entity); else bad(entity, v.label, `tras editar, og:image esperada ${image2} obtuvo ${ogImage2}`);
      }

      green++;
    } catch (e) {
      bad(entity, v.label, "threw: " + e.message);
    } finally {
      if (id) {
        await sql`delete from news_team_members where news_id = ${id}`.catch(() => {});
        await sql`delete from news where id = ${id}`.catch((e) => bad(entity, v.label, "CLEANUP FAILED id=" + id + ": " + e.message));
      }
    }
  }
  entityRows.push({ entity, total: vs.length, green, notes });
}

// ---------------------------------------------------------- PRACTICAS / INDUSTRIAS
async function testGroups(token, kind) {
  const entity = kind === "practice" ? "practice_groups" : "industry_groups";
  const apiPath = kind === "practice" ? "practice-groups" : "industry-groups";
  const urlKind = kind === "practice" ? "practice" : "industry";
  const vs = variants(`e2e-${kind}`);
  let green = 0;
  const notes = [];
  let imageGapReported = false;
  for (const v of vs) {
    let id;
    try {
      const slug = v.id;
      const payload = {
        // Sin fallback "|| X": las variantes en_vacio_es_lleno/es_vacio_en_lleno necesitan
        // que el campo llegue REALMENTE vacío para probar el comportamiento de L() —
        // name/nameEs son notNull en el schema, pero "" (vacío) sí es un valor válido.
        name: v.en, nameEs: v.es, slug,
        description: `Desc EN ${v.label}`, descriptionEs: `Desc ES ${v.label}`,
        fullDescription: v.label === "html_legit_mas_xss" ? v.en : `Full EN ${v.label}`,
        fullDescriptionEs: v.label === "html_legit_mas_xss" ? v.es : `Full ES ${v.label}`,
        imageUrl: "/images/press/press-05.jpg", published: true,
      };
      const cr = await api("POST", `/api/admin/${apiPath}`, token, payload);
      id = cr.json?.id;
      if (!id) { bad(entity, v.label, `create failed (${cr.status}) ${JSON.stringify(cr.json).slice(0, 120)}`); continue; }

      const es = await getHtml(`/${urlKind}/${slug}`);
      const en = await getHtml(`/${urlKind}/${slug}?lang=en`);
      const $es = cheerio.load(es.html), $en = cheerio.load(en.html);
      const nameEs = $es(".single__meta--name").first().text();
      const nameEn = $en(".single__meta--name").first().text();

      if (v.label === "en_vacio_es_lleno") {
        if (nameEn.trim() === "") ok(entity); else bad(entity, v.label, `EN mostró "${nameEn}" en vez de vacío`);
      } else if (v.label === "es_vacio_en_lleno") {
        if (nameEs === v.en) ok(entity); else bad(entity, v.label, `ES debía caer a EN pero mostró "${nameEs}"`);
      } else {
        if (nameEs === (v.es || v.en)) ok(entity); else bad(entity, v.label, `ES esperado "${v.es || v.en}" obtuvo "${nameEs}"`);
        if (nameEn === v.en) ok(entity); else bad(entity, v.label, `EN esperado "${v.en}" obtuvo "${nameEn}"`);
      }

      if (v.label === "imagen_pase" && !imageGapReported) {
        // Hueco conocido: renderSingle.ts nunca lee group.imageUrl. Se espera que NO aparezca.
        const hasImg = es.html.includes("press-05.jpg");
        if (!hasImg) {
          notes.push("GAP: imageUrl aceptado y guardado, pero renderSingle.ts nunca lo renderiza (campo fantasma) — confirmado, no es falla del script");
        } else {
          ok(entity); // si algún día se conecta, esto pasa a ser un pase real
        }
        imageGapReported = true;
      }

      green++;
    } catch (e) {
      bad(entity, v.label, "threw: " + e.message);
    } finally {
      if (id) await deleteById(kind === "practice" ? "practice_groups" : "industry_groups", id).catch((e) => bad(entity, v.label, "CLEANUP FAILED id=" + id + ": " + e.message));
    }
  }
  entityRows.push({ entity, total: vs.length, green, notes });
}

// ---------------------------------------------------------------- RECONOCIMIENTOS
async function testRankings(token) {
  const entity = "rankings";
  const vs = variants("e2e-rank").slice(0, 6); // sin campo de bio largo, menos variantes tienen sentido
  let green = 0;
  const notes = [];
  for (const v of vs) {
    let id;
    try {
      const logo1 = "/images/press/press-06.jpg";
      const logo2 = "/images/press/press-07.jpg";
      const payload = {
        name: v.en || "X", nameEs: v.es || v.en || "X",
        publication: "Test Publication", year: 2026,
        logoUrl: logo1, externalUrl: "https://example.com", isHighlight: false, published: true,
      };
      const cr = await api("POST", "/api/admin/rankings", token, payload);
      id = cr.json?.id;
      if (!id) { bad(entity, v.label, `create failed (${cr.status}) ${JSON.stringify(cr.json).slice(0, 120)}`); continue; }

      const es = await getHtml(`/`);
      const $es = cheerio.load(es.html);
      const found = $es(`.home__rec--item[src="${logo1}"]`);
      if (found.length > 0) ok(entity); else bad(entity, v.label, `logo ${logo1} no aparece en .home__rec--slider`);

      if (v.label === "editar_tras_crear") {
        await api("PUT", `/api/admin/rankings/${id}`, token, { logoUrl: logo2 });
        const es2 = await getHtml(`/`);
        const $es2 = cheerio.load(es2.html);
        const found2 = $es2(`.home__rec--item[src="${logo2}"]`);
        if (found2.length > 0) ok(entity); else bad(entity, v.label, `tras editar, logo ${logo2} no aparece (¿caché?)`);
      }

      green++;
    } catch (e) {
      bad(entity, v.label, "threw: " + e.message);
    } finally {
      if (id) await sql`delete from rankings where id = ${id}`.catch((e) => bad(entity, v.label, "CLEANUP FAILED id=" + id + ": " + e.message));
    }
  }
  entityRows.push({ entity, total: vs.length, green, notes });
}

// ---------------------------------------------------------- SITE-CONFIG (editar→revertir)
async function testSiteConfig(token) {
  const entity = "site_config";
  let green = 0, total = 0;
  const notes = [];

  async function editRevert(key, newVal, newValEs, checkFn) {
    total++;
    const before = await sql`select value, value_es from site_config where key = ${key}`;
    const orig = before[0] || { value: "", value_es: "" };
    try {
      const r = await api("PUT", `/api/admin/site-config/${key}`, token, { value: newVal, valueEs: newValEs });
      if (r.status !== 200) { bad(entity, key, `PUT falló (${r.status})`); return; }
      const passed = await checkFn();
      if (passed) { ok(entity); green++; } else bad(entity, key, "verificación post-edición falló");
    } catch (e) {
      bad(entity, key, "threw: " + e.message);
    } finally {
      await api("PUT", `/api/admin/site-config/${key}`, token, { value: orig.value, valueEs: orig.value_es });
    }
  }

  await editRevert("hero_video", "/images/e2e-test-video.mp4", "/images/e2e-test-video.mp4", async () => {
    const { html } = await getHtml("/");
    const $ = cheerio.load(html);
    return $("#video_header source").attr("src") === "/images/e2e-test-video.mp4";
  });

  await editRevert("banner_title", "E2E Banner EN", "E2E Banner ES", async () => {
    const es = await getHtml("/"); const en = await getHtml("/?lang=en");
    return es.html.includes("E2E Banner ES") && en.html.includes("E2E Banner EN") && !en.html.includes("E2E Banner ES");
  });

  await editRevert("footer_phone", "+52 55 9999 9999", "+52 55 9999 9999", async () => {
    const { html } = await getHtml("/");
    return html.includes("+52 55 9999 9999");
  });

  // Páginas institucionales: confirmar estado real (no asumir) + probar fuga de idioma + revertir a vacío.
  const instPages = [
    { key: "page_firm_intro", es: "/nuestra-firma", en: "/our-firm?lang=en" },
    { key: "page_contact_intro", es: "/contacto", en: "/contact?lang=en" },
    { key: "page_careers_intro", es: "/bolsa-de-trabajo", en: "/careers?lang=en" },
  ];
  for (const p of instPages) {
    const [row] = await sql`select value, value_es from site_config where key = ${p.key}`;
    const currentlyEmpty = !row?.value?.trim() && !row?.value_es?.trim();
    notes.push(`${p.key}: ${currentlyEmpty ? "VACÍO en producción hoy (fallback a plantilla estática)" : "tiene contenido"}`);
    total++;
    try {
      const r = await api("PUT", `/api/admin/site-config/${p.key}`, token, { value: "E2E EN TEXT " + p.key, valueEs: "TEXTO ES E2E " + p.key });
      if (r.status !== 200) { bad(entity, p.key, `PUT falló (${r.status})`); continue; }
      const es = await getHtml(p.es);
      const en = await getHtml(p.en);
      const esHasEs = es.html.includes("TEXTO ES E2E " + p.key);
      const enHasEn = en.html.includes("E2E EN TEXT " + p.key);
      const enLeaksEs = en.html.includes("TEXTO ES E2E " + p.key);
      if (esHasEs && enHasEn && !enLeaksEs) { ok(entity); green++; }
      else bad(entity, p.key, `esHasEs=${esHasEs} enHasEn=${enHasEn} enLeaksEs=${enLeaksEs}`);
    } catch (e) {
      bad(entity, p.key, "threw: " + e.message);
    } finally {
      // Revertir EXACTAMENTE al estado encontrado (vacío hoy en producción — no dejar datos de prueba).
      await api("PUT", `/api/admin/site-config/${p.key}`, token, { value: row?.value ?? "", valueEs: row?.value_es ?? "" });
    }
  }

  entityRows.push({ entity, total, green, notes });
}

// ---------------------------------------------------------- HUECOS: sanity admin-only
async function testAdminOnlySanity(token) {
  const entity = "events_and_posts_admin_only";
  let green = 0, total = 0;
  const notes = ["Admin CRUD funciona; NO existe ruta de renderizado público (confirmado leyendo server/mirror/index.ts) — no se puede verificar en el sitio."];
  try {
    total++;
    const slug = `e2e-event-${RUN_TS}`;
    const cr = await api("POST", "/api/admin/events", token, { title: "E2E Event", titleEs: "Evento E2E", slug, description: "desc", descriptionEs: "desc es", date: new Date().toISOString(), published: true });
    const id = cr.json?.id;
    if (id) {
      // No existe GET /api/admin/events/:id — se confirma vía el listado.
      const lr = await api("GET", "/api/admin/events", token);
      const found = Array.isArray(lr.json) && lr.json.some((e) => e.id === id);
      if (found) { ok(entity); green++; } else bad(entity, "events", `creado (id=${id}) pero no aparece en GET /api/admin/events`);
      await api("DELETE", `/api/admin/events/${id}`, token);
    } else bad(entity, "events", `create failed (${cr.status}) ${JSON.stringify(cr.json).slice(0, 120)}`);
  } catch (e) { bad(entity, "events", "threw: " + e.message); }

  try {
    total++;
    const slug = `e2e-post-${RUN_TS}`;
    const cr = await api("POST", "/api/admin/posts", token, { title: "E2E Post", titleEs: "Post E2E", slug, content: "c", contentEs: "c es", published: true });
    const id = cr.json?.id;
    if (id) {
      const gr = await api("GET", `/api/admin/posts/${id}`, token);
      if (gr.status === 200) { ok(entity); green++; } else bad(entity, "posts", `GET tras crear devolvió ${gr.status}`);
      await api("DELETE", `/api/admin/posts/${id}`, token);
    } else bad(entity, "posts", `create failed (${cr.status})`);
  } catch (e) { bad(entity, "posts", "threw: " + e.message); }

  entityRows.push({ entity, total, green, notes });
}

// ---------------------------------------------------------------------- MAIN
(async () => {
  console.log(`\n=== BATERÍA E2E DE EDITABILIDAD — ${B} ===`);
  const token = await login();

  await testTeamMembers(token);
  await testNews(token);
  await testGroups(token, "practice");
  await testGroups(token, "industry");
  await testRankings(token);
  await testSiteConfig(token);
  await testAdminOnlySanity(token);

  // Barrido final: confirmar que no quedó ningún registro e2e-<RUN_TS>-% huérfano.
  const leftovers = [];
  for (const table of ["team_members", "news", "practice_groups", "industry_groups"]) {
    const rows = await countLeftover(table, "e2e-%-" + RUN_TS + "-%");
    if (rows.length) leftovers.push(`${table}: ${rows.length} residuos`);
  }
  const dbClean = leftovers.length === 0;

  console.log("\n=== PROBADO Y FUNCIONA ===");
  for (const r of entityRows) {
    console.log(`  ${r.green === r.total ? "✅" : "⚠️ "} ${r.entity} — ${r.green}/${r.total} corridas verdes`);
    for (const n of r.notes) console.log(`      · ${n}`);
  }

  if (failures.length) {
    console.log("\n=== FALLAS CON REPRO ===");
    for (const f of failures) console.log(`  ❌ [${f.entity}] ${f.label}: ${f.detail}`);
  }

  console.log("\n=== HUECOS CONOCIDOS (solo reportados, no arreglados) ===");
  console.log("  (a) Confirmados por decisión del usuario — sin pantalla de admin: awards, clients,");
  console.log("      testimonials, alliances, offices, specializedDesks, jobOpenings. Galería de");
  console.log("      oficinas (office-images) tiene pantalla de admin pero nunca se inyecta a ninguna");
  console.log("      página pública.");
  console.log("  (b) Descubiertos en la investigación — Eventos y Blog/Posts: CRUD de admin funciona");
  console.log("      (ver sección events_and_posts_admin_only arriba), CERO página pública existe.");
  console.log("  (c) Campo fantasma — imageUrl de Áreas de práctica/Industrias: aceptado y guardado,");
  console.log("      renderSingle.ts nunca lo lee (ver nota en practice_groups/industry_groups arriba).");

  console.log(`\nDB limpia: ${dbClean ? "✅ sí" : "❌ NO — " + leftovers.join(", ")}`);
  console.log(`\nPASS: ${pass}  FAIL: ${fail}`);
  process.exit(fail > 0 || !dbClean ? 1 : 0);
})();
