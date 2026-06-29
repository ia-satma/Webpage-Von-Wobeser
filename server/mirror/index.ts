import express, { type Express, type Request, type Response, type NextFunction } from "express";
import fs from "fs";
import { eq, and } from "drizzle-orm";
import { getMirrorDir, mirrorPath } from "./config";
import { renderAttorney } from "./renderAttorney";
import { renderAttorneyList, CATEGORIES } from "./renderAttorneyList";
import { renderSingle } from "./renderSingle";
import { renderHome } from "./renderHome";
import { renderNewsList, renderNewsDetail } from "./renderNews";
import { buildIdMaps, type IdMaps } from "./idMap";
import { getConfigMap, seedConfigDefaults, upsertConfig } from "./siteConfig";
import { authMiddleware, requireRole } from "../auth";
import { storage } from "../storage";
import { db } from "../db";
import {
  teamMembers,
  teamMemberPracticeGroups,
  practiceGroups,
  teamMemberIndustryGroups,
  industryGroups,
} from "@shared/schema";

type Lang = "en" | "es";

/** Attorneys belonging to a practice group (reverse of the seeded relation). */
async function getAttorneysByPractice(practiceGroupId: string) {
  return db
    .select({ name: teamMembers.name, slug: teamMembers.slug, title: teamMembers.title, order: teamMembers.order })
    .from(teamMemberPracticeGroups)
    .innerJoin(teamMembers, eq(teamMemberPracticeGroups.teamMemberId, teamMembers.id))
    .where(and(eq(teamMemberPracticeGroups.practiceGroupId, practiceGroupId), eq(teamMembers.published, true)));
}

/** Attorneys belonging to an industry group. */
async function getAttorneysByIndustry(industryGroupId: string) {
  return db
    .select({ name: teamMembers.name, slug: teamMembers.slug, title: teamMembers.title, order: teamMembers.order })
    .from(teamMemberIndustryGroups)
    .innerJoin(teamMembers, eq(teamMemberIndustryGroups.teamMemberId, teamMembers.id))
    .where(and(eq(teamMemberIndustryGroups.industryGroupId, industryGroupId), eq(teamMembers.published, true)));
}

/** Fetch an attorney's practice & industry groups via the join tables. */
async function getAttorneyGroups(memberId: string) {
  const [pg, ig] = await Promise.all([
    db
      .select({ name: practiceGroups.name, nameEs: practiceGroups.nameEs, slug: practiceGroups.slug })
      .from(teamMemberPracticeGroups)
      .innerJoin(practiceGroups, eq(teamMemberPracticeGroups.practiceGroupId, practiceGroups.id))
      .where(and(eq(teamMemberPracticeGroups.teamMemberId, memberId), eq(practiceGroups.published, true))),
    db
      .select({ name: industryGroups.name, nameEs: industryGroups.nameEs, slug: industryGroups.slug })
      .from(teamMemberIndustryGroups)
      .innerJoin(industryGroups, eq(teamMemberIndustryGroups.industryGroupId, industryGroups.id))
      .where(and(eq(teamMemberIndustryGroups.teamMemberId, memberId), eq(industryGroups.published, true))),
  ]);
  return { practiceGroups: pg, industryGroups: ig };
}

// Canonical layouts from the mirror, EN + ES variants. The ES files carry the
// Spanish chrome (nav/footer/labels); selectors are identical, so the renderers
// work with either. Pick by language so the whole page (not just data) localizes.
const TEMPLATES = {
  attorney:   { en: "index.php/lawyer/l-134.html",            es: "index.php/abogado/l-134.html" },
  list:       { en: "index.php/attorneys/partners/index.html", es: "index.php/abogados/socios/index.html" },
  practice:   { en: "index.php/practice/p-46.html",           es: "index.php/practica/p-11.html" },
  industry:   { en: "index.php/industry/p-9.html",            es: "index.php/industria/p-10.html" },
  home:       { en: "index.html",                             es: "index.php/home/index.html" },
  newsList:   { en: "index.php/publications/news/index.html", es: "index.php/publicaciones/noticias/index.html" },
  newsDetail: { en: "index.php/publication/p_id-1.html",      es: "index.php/publicacion/p_id-1001.html" },
};

const tpl = (rel: string) => fs.readFileSync(mirrorPath(rel), "utf8");
const pick = (t: { en: string; es: string }, lang: Lang) => tpl(lang === "es" ? t.es : t.en);
// Español es el idioma PRINCIPAL (despacho mexicano); inglés solo con ?lang=en.
const langOf = (req: Request): Lang => (req.query.lang === "en" ? "en" : "es");

// Hace que el botón de idioma del header alterne ES⇄EN sobre la URL actual,
// en cualquier página, sin depender de las rutas originales del espejo.
const LANG_TOGGLE_SCRIPT = `<script>(function(){try{
  var isEn=new URLSearchParams(location.search).get('lang')==='en';
  document.querySelectorAll('.header__lang--item').forEach(function(a){
    var u=new URL(location.href);
    if(isEn){u.searchParams.delete('lang');a.textContent='ESP';}
    else{u.searchParams.set('lang','en');a.textContent='ENG';}
    a.setAttribute('href',u.pathname+(u.search||''));
  });
}catch(e){}})();</script>`;

// Inyecta el toggle de idioma antes de </body> y envía la página.
function sendPage(res: Response, html: string) {
  const out = html.includes("</body>")
    ? html.replace("</body>", `${LANG_TOGGLE_SCRIPT}</body>`)
    : html + LANG_TOGGLE_SCRIPT;
  res.status(200).type("html").send(out);
}

// ES attorney-listing category slugs → our canonical category keys.
const ES_CATEGORY: Record<string, string> = {
  socios: "partners",
  "of-counsel-sp": "of-counsel",
  "counsel-sp": "counsel",
  asociados: "associates",
};

/**
 * Wires the original (mirror) frontend to our backend.
 * Registered AFTER the API routes and BEFORE the SPA catch-all.
 */
export async function setupMirror(app: Express) {
  const mirrorDir = getMirrorDir();

  if (!fs.existsSync(mirrorPath(TEMPLATES.attorney.en))) {
    console.warn(
      `[mirror] Plantilla no encontrada en ${mirrorPath(TEMPLATES.attorney.en)} — ` +
        `define MIRROR_DIR si el espejo está en otra ruta. Rutas del espejo deshabilitadas.`,
    );
    return;
  }

  console.log(`[mirror] Sirviendo frontend del espejo desde: ${mirrorDir}`);
  try {
    await seedConfigDefaults();
  } catch (e) {
    console.warn("[mirror] No se pudo sembrar siteConfig:", (e as Error).message);
  }
  let ids: IdMaps = { attorney: new Map(), practice: new Map(), industry: new Map() };
  try {
    ids = await buildIdMaps();
    console.log(
      `[mirror] Mapa de URLs originales: ${ids.attorney.size} abogados, ${ids.practice.size} prácticas, ${ids.industry.size} industrias.`,
    );
  } catch (e) {
    console.warn("[mirror] No se pudo construir el mapa de IDs:", (e as Error).message);
  }

  // Mapa de publicaciones originales (p_id de Joomla → slug de news), para servir
  // las URLs originales /index.php/publication/p_id-X.html de forma dinámica.
  const pubIdMap = new Map<string, string>();
  try {
    for (const n of await storage.getNews()) {
      const lid = (n as any).legacyId;
      if (lid) pubIdMap.set(String(lid), n.slug);
    }
    console.log(`[mirror] Mapa de publicaciones originales: ${pubIdMap.size}`);
  } catch (e) {
    console.warn("[mirror] No se pudo construir pubIdMap:", (e as Error).message);
  }

  // ---------- Reusable serve helpers ------------------------------------
  const serveAttorney = async (slug: string | undefined, lang: Lang, res: Response, next: NextFunction) => {
    if (!slug) return next();
    let member = await storage.getTeamMemberBySlug(slug);
    if (!member) member = await storage.getTeamMemberById(slug);
    if (!member) return next();
    if ((member as any).published === false) return next(); // oculto
    const groups = await getAttorneyGroups(member.id);
    sendPage(res, renderAttorney(pick(TEMPLATES.attorney, lang), { ...member, ...groups }, lang));
  };

  const serveList = async (category: string, lang: Lang, res: Response, next: NextFunction) => {
    const cat = CATEGORIES[category];
    if (!cat) return next();
    const all = await storage.getTeamMembers();
    const attorneys = all
      .filter((m: any) => m.title === cat.title && m.published !== false)
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
    sendPage(res, renderAttorneyList(pick(TEMPLATES.list, lang), attorneys, category, lang));
  };

  const servePractice = async (slug: string | undefined, lang: Lang, res: Response, next: NextFunction) => {
    if (!slug) return next();
    const group = await storage.getPracticeGroupBySlug(slug);
    if (!group) return next();
    if ((group as any).published === false) return next(); // oculta
    const attorneys = await getAttorneysByPractice(group.id);
    sendPage(res, renderSingle(pick(TEMPLATES.practice, lang), group, attorneys, "practice", lang));
  };

  const serveIndustry = async (slug: string | undefined, lang: Lang, res: Response, next: NextFunction) => {
    if (!slug) return next();
    const group = await storage.getIndustryGroupBySlug(slug);
    if (!group) return next();
    if ((group as any).published === false) return next(); // oculta
    const attorneys = await getAttorneysByIndustry(group.id);
    sendPage(res, renderSingle(pick(TEMPLATES.industry, lang), group, attorneys, "industry", lang));
  };

  const serveNewsDetail = async (slug: string | undefined, lang: Lang, res: Response, next: NextFunction) => {
    if (!slug) return next();
    const item = await storage.getNewsBySlug(slug);
    if (!item) return next();
    sendPage(res, renderNewsDetail(pick(TEMPLATES.newsDetail, lang), item, lang));
  };

  const serveNewsList = async (lang: Lang, res: Response, page = 1) => {
    const all = await storage.getNews();
    const sorted = all.slice().sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    const perPage = 24;
    const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
    const p = Math.min(Math.max(1, page), totalPages);
    const slice = sorted.slice((p - 1) * perPage, p * perPage);
    sendPage(res, renderNewsList(pick(TEMPLATES.newsList, lang), slice, lang, { page: p, totalPages }));
  };

  const serveHome = async (lang: Lang, res: Response) => {
    const [news, config] = await Promise.all([storage.getNews(), getConfigMap()]);
    sendPage(res, renderHome(pick(TEMPLATES.home, lang), news, config, lang));
  };

  const wrap = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => fn(req, res, next).catch(next);

  // ---------- Clean dynamic routes --------------------------------------
  app.get("/", wrap((req, res) => serveHome(langOf(req), res)));
  app.get("/home", wrap((req, res) => serveHome(langOf(req), res)));
  app.get("/news", wrap((req, res) => serveNewsList(langOf(req), res, parseInt(String(req.query.page)) || 1)));
  app.get("/news/:slug", wrap((req, res, next) => serveNewsDetail(req.params.slug, langOf(req), res, next)));
  app.get("/attorneys", wrap((req, res, next) => serveList("partners", langOf(req), res, next)));
  app.get("/attorneys/:category", wrap((req, res, next) => serveList(req.params.category, langOf(req), res, next)));
  app.get("/lawyer/:slug", wrap((req, res, next) => serveAttorney(req.params.slug, langOf(req), res, next)));
  app.get("/abogado/:slug", wrap((req, res, next) => serveAttorney(req.params.slug, "es", res, next)));
  app.get("/practice/:slug", wrap((req, res, next) => servePractice(req.params.slug, langOf(req), res, next)));
  app.get("/industry/:slug", wrap((req, res, next) => serveIndustry(req.params.slug, langOf(req), res, next)));

  // ---------- Original mirror URLs (SEO preserved, nav coherent) --------
  // Home (ES) + news listings
  app.get("/index.php/home", wrap((_req, res) => serveHome("es", res)));
  app.get("/index.php/home/", wrap((_req, res) => serveHome("es", res)));
  // Logo / "inicio" links in the mirror chrome → dynamic home.
  app.get("/index.html", wrap((req, res) => serveHome(langOf(req), res)));
  app.get("/index.php/index.html", wrap((req, res) => serveHome(langOf(req), res)));
  app.get("/index.php/home/index.html", wrap((_req, res) => serveHome("es", res)));
  app.get("/index.php/publications/news/index.html", wrap((req, res) => serveNewsList(langOf(req), res)));
  app.get("/index.php/publicaciones/noticias/index.html", wrap((_req, res) => serveNewsList("es", res)));
  // Detalle de publicación por URL original (p_id) → versión dinámica desde la DB.
  app.get("/index.php/publication/p_id-:id.html", wrap((req, res, next) =>
    serveNewsDetail(pubIdMap.get(req.params.id), "en", res, next),
  ));
  app.get("/index.php/publicacion/p_id-:id.html", wrap((req, res, next) =>
    serveNewsDetail(pubIdMap.get(req.params.id), "es", res, next),
  ));

  // Attorney profiles (EN /lawyer, ES /abogado)
  app.get("/index.php/lawyer/l-:id.html", wrap((req, res, next) =>
    serveAttorney(ids.attorney.get(req.params.id), "en", res, next),
  ));
  app.get("/index.php/abogado/l-:id.html", wrap((req, res, next) =>
    serveAttorney(ids.attorney.get(req.params.id), "es", res, next),
  ));

  // Practice / industry
  app.get("/index.php/practice/p-:id.html", wrap((req, res, next) =>
    servePractice(ids.practice.get(req.params.id), "en", res, next),
  ));
  app.get("/index.php/industry/p-:id.html", wrap((req, res, next) =>
    serveIndustry(ids.industry.get(req.params.id), "en", res, next),
  ));

  // Attorney listings (EN + ES category slugs)
  app.get("/index.php/attorneys/:category/index.html", wrap((req, res, next) =>
    serveList(req.params.category, "en", res, next),
  ));
  app.get("/index.php/abogados/:category/index.html", wrap((req, res, next) =>
    serveList(ES_CATEGORY[req.params.category] || req.params.category, "es", res, next),
  ));

  // News detail (publication id → news slug not mapped; falls through to static
  // for legacy publications, while in-app /news/:slug links stay dynamic).

  // ---------- Admin: editable site config (texts, hero video, etc.) -----
  app.get("/api/admin/site-config", authMiddleware, requireRole("editor", "admin"), wrap(async (_req, res) => {
    res.json(await getConfigMap());
  }));
  app.put("/api/admin/site-config/:key", authMiddleware, requireRole("editor", "admin"), wrap(async (req, res) => {
    const { value, valueEs } = req.body || {};
    await upsertConfig(req.params.key, value ?? "", valueEs);
    res.json({ ok: true, key: req.params.key });
  }));

  // ---------- Static assets (css, js, vendor, images, fonts) ------------
  app.use(express.static(mirrorDir, { index: false }));

  // ---------- Public catch-all: ALWAYS the mirror, never the old React --
  // The old React redesign stays reachable ONLY at /admin (the CMS). Every
  // other unmatched public navigation falls back to the mirror home, so the
  // pre-mirror frontend never surfaces to visitors.
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    const p = req.path;
    // Admin app, API and Vite/React internals must reach the SPA.
    if (p.startsWith("/@") || /^\/(admin|api|src|node_modules|vite|assets)(\/|$)/.test(p) || p === "/__vite_ping") return next();
    // Asset-like requests (with a file extension) fall through to Vite/static.
    if (/\.[a-z0-9]+$/i.test(p)) return next();
    // Page navigation → dynamic mirror home (the old public frontend is gone).
    return serveHome(req.query.lang === "es" ? "es" : "en", res).catch(next);
  });
}
