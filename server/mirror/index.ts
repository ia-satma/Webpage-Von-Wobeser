import express, { type Express, type Request, type Response, type NextFunction } from "express";
import fs from "fs";
import { eq, and } from "drizzle-orm";
import { getMirrorDir, mirrorPath } from "./config";
import { renderAttorney } from "./renderAttorney";
import { renderAttorneyList, CATEGORIES } from "./renderAttorneyList";
import { renderAttorneyResults } from "./renderAttorneyResults";
import { renderSingle } from "./renderSingle";
import { renderHome } from "./renderHome";
import { renderPage } from "./renderPage";
import { renderGroupList, type GroupListItem } from "./renderGroupList";
import { renderDeskDetail, renderDesksMap } from "./renderDesk";
import { applyCareersFormFix, applyContactForm } from "./formsFix";
import * as cheerio from "cheerio";
import { renderNewsList, renderNewsDetail } from "./renderNews";
import { buildIdMaps, type IdMaps } from "./idMap";
import { getConfigMap, seedConfigDefaults, upsertConfig, isRichTextConfigKey, type ConfigMap } from "./siteConfig";
import { setBaseUrl } from "./seo";
import { sanitizeCms } from "./sanitize";
import { authMiddleware, requireRole, requirePermission } from "../auth";
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
  articlesList: { en: "index.php/publications/articles/index.html", es: "index.php/publicaciones/articulos/index.html" },
  publications: { en: "index.php/publications/index.html",    es: "index.php/publicaciones/index.html" },
  privacy:      { en: "index.php/privacy/index.html",         es: "index.php/aviso/index.html" },
  firm:       { en: "index.php/our-firm/index.html",          es: "index.php/nuestra-firma/index.html" },
  contact:    { en: "index.php/contact/index.html",           es: "index.php/contacto/index.html" },
  careers:    { en: "index.php/careers/index.html",           es: "index.php/bolsa-de-trabajo/index.html" },
  proBono:    { en: "index.php/our-firm/our-firm-probono/index.html", es: "index.php/nuestra-firma/probono/index.html" },
  diversity:  { en: "index.php/our-firm/diversity/index.html",        es: "index.php/nuestra-firma/diversidad/index.html" },
  capabilities: { en: "index.php/capabilities/index.html",          es: "index.php/capacidades/index.html" },
  practiceList: { en: "index.php/capabilities/practices/index.html", es: "index.php/capacidades/practicas/index.html" },
  industryList: { en: "index.php/capabilities/industries/index.html", es: "index.php/capacidades/industrias/index.html" },
  desksList:    { en: "index.php/capabilities/capabilities-desks/index.html", es: "index.php/capacidades/desks/index.html" },
};

// Páginas institucionales con texto editable: qué keys de siteConfig inyecta cada una,
// + metadata SEO (ruta canónica y título por idioma).
const PAGE_KEYS = {
  firm:      { intro: "page_firm_intro",      body: "page_firm_body" },
  contact:   { intro: "page_contact_intro",   body: "page_contact_body" },
  careers:   { intro: "page_careers_intro",   body: "page_careers_body" },
  proBono:   { intro: "page_probono_intro",   body: "page_probono_body" },
  diversity: { intro: "page_diversity_intro", body: "page_diversity_body" },
  capabilities: { body: "page_capabilities_body" },
  // "Publicaciones" en la plantilla capturada es solo un título + un formulario de búsqueda
  // legacy de Joomla (POST a /index.php/results, inexistente en este backend) — no tiene
  // ningún texto real que editar, así que no lleva intro/body. Se conecta solo para que la
  // ruta corta funcione y tenga SEO dinámico como el resto de páginas institucionales.
  publications: {},
  // El Aviso de Privacidad capturado usa el mismo patrón simple (solo .page__content--body,
  // sin --intro) — texto legal completo, editable por si cambia el domicilio, el responsable
  // de los datos, o cualquier otro dato de cumplimiento (LFPDPPP).
  privacy: { body: "page_privacy_body" },
};
const PAGE_SEO: Record<keyof typeof PAGE_KEYS, { path: { en: string; es: string }; title: { en: string; es: string } }> = {
  firm: {
    path: { en: "/our-firm", es: "/nuestra-firma" },
    title: { en: "Our Firm | Von Wobeser y Sierra", es: "Nuestra Firma | Von Wobeser y Sierra" },
  },
  contact: {
    path: { en: "/contact", es: "/contacto" },
    title: { en: "Contact | Von Wobeser y Sierra", es: "Contacto | Von Wobeser y Sierra" },
  },
  careers: {
    path: { en: "/careers", es: "/bolsa-de-trabajo" },
    title: { en: "Careers | Von Wobeser y Sierra", es: "Bolsa de trabajo | Von Wobeser y Sierra" },
  },
  proBono: {
    path: { en: "/our-firm/our-firm-probono", es: "/nuestra-firma/probono" },
    title: { en: "Pro Bono | Von Wobeser y Sierra", es: "Pro Bono | Von Wobeser y Sierra" },
  },
  diversity: {
    path: { en: "/our-firm/diversity", es: "/nuestra-firma/diversidad" },
    title: { en: "Diversity & Inclusion | Von Wobeser y Sierra", es: "Diversidad e Inclusión | Von Wobeser y Sierra" },
  },
  capabilities: {
    path: { en: "/capabilities", es: "/capacidades" },
    title: { en: "Capabilities | Von Wobeser y Sierra", es: "Capacidades | Von Wobeser y Sierra" },
  },
  publications: {
    path: { en: "/publications", es: "/publicaciones" },
    title: { en: "Publications | Von Wobeser y Sierra", es: "Publicaciones | Von Wobeser y Sierra" },
  },
  privacy: {
    path: { en: "/privacy", es: "/aviso" },
    title: { en: "Privacy Notice | Von Wobeser y Sierra", es: "Aviso de Privacidad | Von Wobeser y Sierra" },
  },
};

// Las plantillas del espejo (HTML capturado de 23–181 KB) viven en un volumen
// externo LENTO y antes se leían con readFileSync EN CADA request → causa #1 de
// lentitud. Se memoizan en RAM: la primera lectura por archivo va a disco, el
// resto sale de memoria. warmTemplates() precarga todo al arranque.
const templateCache = new Map<string, string>();
const tpl = (rel: string): string => {
  let cached = templateCache.get(rel);
  if (cached === undefined) {
    cached = fs.readFileSync(mirrorPath(rel), "utf8");
    templateCache.set(rel, cached);
  }
  return cached;
};
const warmTemplates = () => {
  for (const t of Object.values(TEMPLATES)) {
    for (const rel of [t.en, t.es]) {
      try { tpl(rel); } catch { /* variante ausente: se resolverá on-demand */ }
    }
  }
};
const pick = (t: { en: string; es: string }, lang: Lang) => tpl(lang === "es" ? t.es : t.en);
// Español es el idioma PRINCIPAL (despacho mexicano); inglés solo con ?lang=en.
const langOf = (req: Request): Lang => (req.query.lang === "en" ? "en" : "es");

// Normaliza (sin acentos, minúsculas) para la búsqueda por apellido.
const normalizeStr = (s: string) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
// Última palabra del nombre = apellido (igual criterio que el sitio real).
const lastWord = (name: string) => {
  const parts = (name || "").trim().split(/\s+/);
  return parts[parts.length - 1] || "";
};

// Hace que el botón de idioma del header alterne ES⇄EN sobre la URL actual, en cualquier
// página, sin depender de las rutas originales del espejo.
//
// Bug real que esto corrige: la mayoría de las páginas del espejo comparten UNA sola ruta y
// alternan idioma con ?lang=en (/news, /attorneys, /practice/:slug, /lawyer/:slug, etc.) — para
// esas, alternar el query param en la URL actual basta. PERO las páginas institucionales
// (Nuestra Firma, Contacto, Carrera + Pasantes, Pro Bono, Diversidad, Capacidades + sus 3
// listados, Publicaciones, Aviso de Privacidad) usan una URL COMPLETAMENTE DISTINTA por idioma
// y esas rutas ignoran ?lang=en — el botón las dejaba viendo la misma URL con un query param
// inútil, sin cambiar de idioma. PAIRS mapea cada una a su URL real en el otro idioma. El
// idioma actual se detecta con document.documentElement.lang (ya seteado server-side en TODOS
// los renderers), no con el query string — así el botón muestra la etiqueta correcta incluso
// en las páginas de PAIRS, que nunca traen ?lang=en.
const LANG_TOGGLE_SCRIPT = `<script>(function(){try{
  var PAIRS={
    '/nuestra-firma':'/our-firm','/our-firm':'/nuestra-firma',
    '/contacto':'/contact','/contact':'/contacto',
    '/bolsa-de-trabajo':'/careers','/careers':'/bolsa-de-trabajo',
    '/bolsa-de-trabajo/pasantes':'/careers/interns','/careers/interns':'/bolsa-de-trabajo/pasantes',
    '/nuestra-firma/probono':'/our-firm/our-firm-probono','/our-firm/our-firm-probono':'/nuestra-firma/probono',
    '/nuestra-firma/diversidad':'/our-firm/diversity','/our-firm/diversity':'/nuestra-firma/diversidad',
    '/capacidades':'/capabilities','/capabilities':'/capacidades',
    '/capacidades/practicas':'/capabilities/practices','/capabilities/practices':'/capacidades/practicas',
    '/capacidades/industrias':'/capabilities/industries','/capabilities/industries':'/capacidades/industrias',
    '/capacidades/desks':'/capabilities/desks','/capabilities/desks':'/capacidades/desks',
    '/publicaciones':'/publications','/publications':'/publicaciones',
    '/aviso':'/privacy','/privacy':'/aviso'
  };
  var isEn=(document.documentElement.lang||'').toLowerCase().indexOf('en')===0;
  var path=location.pathname.replace(/\\/$/,'')||'/';
  var mapped=PAIRS[path];
  document.querySelectorAll('.header__lang--item').forEach(function(a){
    a.textContent=isEn?'ESP':'ENG';
    if(mapped){a.setAttribute('href',mapped);return;}
    var u=new URL(location.href);
    if(isEn){u.searchParams.delete('lang');}else{u.searchParams.set('lang','en');}
    a.setAttribute('href',u.pathname+(u.search||''));
  });
}catch(e){}})();</script>`;

const escHtml = (s: any) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Inyecta los datos del pie de página (dirección, teléfono, redes) desde siteConfig
// por reemplazo de string (sin re-parseo, muy barato). La plantilla en disco es
// inmutable, así que los selectores/URLs originales siempre están para reemplazar.
function injectFooterString(html: string, config: ConfigMap): string {
  const v = (k: string) => (config[k]?.value ?? "").trim();
  const firm = v("footer_firm"), address = v("footer_address"), phone = v("footer_phone"), website = v("footer_website");
  if (firm || address || phone || website) {
    const lines: string[] = [];
    if (firm) lines.push(`<p>${escHtml(firm)}</p>`);
    if (address) lines.push(escHtml(address).replace(/\r?\n/g, "<br>"));
    if (phone) lines.push(escHtml(phone));
    if (website) lines.push(escHtml(website));
    html = html.replace(/(<div class="footer--txt">)[\s\S]*?(<\/div>)/, `$1${lines.join("<br>")}$2`);
  }
  const fb = v("footer_facebook"), tw = v("footer_twitter"), ln = v("footer_linkedin");
  if (fb) html = html.replace(/href="https:\/\/(www\.)?facebook\.com[^"]*"/i, `href="${escHtml(fb)}"`);
  if (tw) html = html.replace(/href="https:\/\/(www\.)?twitter\.com[^"]*"/i, `href="${escHtml(tw)}"`);
  if (ln) html = html.replace(/href="https:\/\/[^"']*linkedin\.com[^"]*"/i, `href="${escHtml(ln)}"`);
  return html;
}

// Enlace discreto al panel de administración: candado pequeño, opacidad baja (sube al
// pasar el mouse), junto al copyright del pie. FontAwesome ya está cargado en toda plantilla
// (self-hosted en _vendor/fontawesome), así que no agrega ninguna petición extra.
const ADMIN_LINK_STYLE = '<style>.vwb-admin-link{color:#fff;opacity:.35;text-decoration:none;transition:opacity .2s;}.vwb-admin-link:hover{opacity:1;}</style>';
const ADMIN_LINK = `${ADMIN_LINK_STYLE}<a class="vwb-admin-link" href="/admin" target="_blank" rel="noopener" title="Panel de administración" aria-label="Panel de administración">&nbsp;&nbsp;<i class="fas fa-lock" style="font-size:11px;"></i></a>`;

function injectAdminLink(html: string): string {
  return html.replace(/(<div class="footer--copy">[\s\S]*?)(<\/div>)/, (_m, inner, close) => `${inner}${ADMIN_LINK}${close}`);
}

// Sustituye el texto de la línea que arma la URL del video en el swap de miniaturas
// ('/images/' + cual + '.mp4') por una que primero busca la URL editable en data-video,
// y solo cae a la ruta original si no hay ninguna configurada.
const DIVERSITY_SWAP_ORIGINAL = "salsa.setAttribute('src', '/images/' + cual + '.mp4');";
const DIVERSITY_SWAP_EDITABLE =
  "salsa.setAttribute('src', $(this).attr('data-video') || ('/images/' + cual + '.mp4'));";

// Video principal + 7 miniaturas de la galería "Diversidad e Inclusión" son archivos fijos
// en la plantilla capturada. Esto los hace editables desde el panel: reescribe el <source>
// inicial, agrega data-video a cada miniatura, y ajusta el único punto del script inline
// que decide qué video cargar al hacer clic (ver DIVERSITY_SWAP_ORIGINAL arriba).
// Del espejo capturado solo existe vw_vid_02.mp4 en disco; vid_01..vid_07 nunca se capturaron
// (huecos de la captura original, no de este código). Si un slot sigue apuntando a un archivo
// LOCAL que no existe, se cae al video principal en vez de "reproducir" el HTML de error de
// Vite (200 con content-type text/html) como si fuera un video roto. Un video ya subido desde
// el panel (URL /uploads/...) siempre es real, así que ese chequeo no le aplica.
const diversityLocalFileExists = (relUrl: string): boolean => {
  if (!relUrl.startsWith("/images/")) return true;
  try {
    return fs.existsSync(mirrorPath(relUrl.slice(1)));
  } catch {
    return false;
  }
};

function applyDiversityVideoGallery($: cheerio.CheerioAPI, config: ConfigMap): void {
  const v = (key: string, fallback: string) => (config[key]?.value || "").trim() || fallback;
  const mainUrl = v("page_diversity_video_main", "/images/vw_vid_02.mp4");
  const resolve = (url: string) => (diversityLocalFileExists(url) ? url : mainUrl);
  const slots: Record<string, string> = {
    vw_vid_02: mainUrl, // la miniatura "vw_vid_02" vuelve a mostrar el video principal
    vid_01: resolve(v("page_diversity_video_1", "/images/vid_01.mp4")),
    vid_02: resolve(v("page_diversity_video_2", "/images/vid_02.mp4")),
    vid_03: resolve(v("page_diversity_video_3", "/images/vid_03.mp4")),
    vid_04: resolve(v("page_diversity_video_4", "/images/vid_04.mp4")),
    vid_05: resolve(v("page_diversity_video_5", "/images/vid_05.mp4")),
    vid_06: resolve(v("page_diversity_video_6", "/images/vid_06.mp4")),
    vid_07: resolve(v("page_diversity_video_7", "/images/vid_07.mp4")),
  };
  $("#videoSource").attr("src", mainUrl);
  $(".thumb[name]").each((_, el) => {
    const name = $(el).attr("name") || "";
    if (slots[name]) $(el).attr("data-video", slots[name]);
  });
  $("script").each((_, el) => {
    const js = $(el).html();
    if (js && js.includes(DIVERSITY_SWAP_ORIGINAL)) {
      $(el).text(js.replace(DIVERSITY_SWAP_ORIGINAL, DIVERSITY_SWAP_EDITABLE));
    }
  });
}

// Inyecta el toggle de idioma antes de </body>, aplica el pie editable y envía.
// Cache-Control permite que navegador/CDN reutilicen la página (contenido público
// que cambia poco); stale-while-revalidate sirve la copia vieja mientras revalida.
async function sendPage(res: Response, html: string) {
  let out = html.includes("</body>")
    ? html.replace("</body>", `${LANG_TOGGLE_SCRIPT}</body>`)
    : html + LANG_TOGGLE_SCRIPT;
  try {
    out = injectFooterString(out, await getConfigMap()); // getConfigMap está cacheado
  } catch { /* si la config falla, se sirve el pie original de la plantilla */ }
  out = injectAdminLink(out);
  res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
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
  warmTemplates(); // precarga plantillas a RAM (evita I/O de disco por request)
  try {
    await seedConfigDefaults();
    // Base URL para canonical/OG/JSON-LD: env SITE_URL o la key editable site_url.
    setBaseUrl(process.env.SITE_URL || (await getConfigMap()).site_url?.value);
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
    const [groups, relatedNewsRaw] = await Promise.all([
      getAttorneyGroups(member.id),
      storage.getNewsByTeamMemberId(member.id).catch(() => []),
    ]);
    // Solo noticias publicadas, más recientes primero; se acota para no inflar el perfil.
    const relatedNews = relatedNewsRaw
      .filter((n: any) => n.published !== false)
      .sort((a: any, b: any) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime())
      .slice(0, 10);
    sendPage(res, renderAttorney(pick(TEMPLATES.attorney, lang), { ...member, ...groups, relatedNews }, lang));
  };

  const serveList = async (
    category: string,
    lang: Lang,
    res: Response,
    next: NextFunction,
    query: Record<string, any> = {},
    showSearch = false,
  ) => {
    // La búsqueda ahora vive en su propia página de resultados (como el sitio
    // real). Si llega un /attorneys?q=... (link viejo) se redirige a /buscar.
    const q = (query.q as string) || undefined;
    const position = (query.position as string) || undefined;
    const practiceSlug = (query.practice as string) || undefined;
    if (q || position || practiceSlug) {
      const p = new URLSearchParams();
      if (q) p.set("q", q);
      if (position) p.set("position", position);
      if (practiceSlug) p.set("practice", practiceSlug);
      if (lang === "en") p.set("lang", "en");
      return res.redirect(302, `/attorneys/buscar?${p.toString()}`);
    }

    const cat = CATEGORIES[category];
    if (!cat) return next();
    const all = await storage.getTeamMembers();
    const attorneys = all
      .filter((m: any) => m.title === cat.title && m.published !== false)
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));

    const practiceGroupsRaw = await storage.getPracticeGroups();
    const practiceGroups = practiceGroupsRaw
      .filter((pg: any) => pg.published !== false)
      .map((pg) => ({ slug: pg.slug, name: pg.name, nameEs: pg.nameEs }));

    sendPage(res, renderAttorneyList(pick(TEMPLATES.list, lang), attorneys, category, lang, { practiceGroups, showSearch }));
  };

  // Página de resultados de búsqueda (navegación, no inline) — réplica del flujo
  // real: por apellido (kind=letter) o por nombre/posición/práctica.
  const serveResults = async (lang: Lang, res: Response, query: Record<string, any>) => {
    const q = (query.q as string) || "";
    const kind = (query.kind as string) || "";
    const position = (query.position as string) || undefined;
    const practiceSlug = (query.practice as string) || undefined;

    let attorneys: any[];
    if (kind === "letter" && q) {
      const letter = normalizeStr(q);
      const all = await storage.getTeamMembers();
      attorneys = all.filter(
        (m: any) => m.published !== false && normalizeStr(lastWord(m.name)).startsWith(letter),
      );
    } else {
      const title = position && CATEGORIES[position] ? CATEGORIES[position].title : undefined;
      let practiceGroupId: string | undefined;
      if (practiceSlug) {
        const group = await storage.getPracticeGroupBySlug(practiceSlug);
        practiceGroupId = group?.id;
      }
      attorneys = await storage.searchTeamMembers({ q: q || undefined, title, practiceGroupId });
    }
    attorneys = attorneys.sort(
      (a: any, b: any) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name),
    );

    sendPage(res, renderAttorneyResults(pick(TEMPLATES.list, lang), attorneys, lang));
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

  // Un borrador (published=false) o un artículo programado a futuro (publishAt) NUNCA debe
  // ser públicamente alcanzable — antes no se comprobaba en la ruta de detalle ni en los
  // listados, así que una noticia sin publicar filtraba su URL con solo conocer el slug.
  const isPubliclyVisible = (n: { published?: boolean | null; publishAt?: Date | string | null }): boolean =>
    n.published === true && (!n.publishAt || new Date(n.publishAt) <= new Date());

  const serveNewsDetail = async (slug: string | undefined, lang: Lang, res: Response, next: NextFunction) => {
    if (!slug) return next();
    const item = await storage.getNewsBySlug(slug);
    if (!item || !isPubliclyVisible(item)) return next();
    sendPage(res, renderNewsDetail(pick(TEMPLATES.newsDetail, lang), item, lang));
  };

  const serveNewsList = async (lang: Lang, res: Response, page = 1) => {
    const perPage = 24;
    // Cuenta + una sola página en SQL, en vez de traer TODAS las noticias y paginar en memoria.
    const total = await storage.getPublishedNewsCount();
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const p = Math.min(Math.max(1, page), totalPages);
    const slice = await storage.getPublishedNewsPage(perPage, (p - 1) * perPage);
    sendPage(res, renderNewsList(pick(TEMPLATES.newsList, lang), slice, lang, { page: p, totalPages }));
  };

  // "Artículos"/"Articles": antes HTML congelado (express.static), enlazando a las mismas
  // noticias legacy p_id-N.html que "Noticias" — resulta que en la DB ya conviven bajo la
  // MISMA tabla `news`, distinguidas por `category` ("news" vs "articles", ~284 filas). Se
  // reusa renderNewsList con opts distintos; Noticias sigue sin filtrar por categoría (no se
  // le quita nada de lo que ya mostraba), así que un artículo puede aparecer en ambos listados.
  const serveArticlesList = async (lang: Lang, res: Response, page = 1) => {
    const perPage = 24;
    const total = await storage.getPublishedNewsCount("articles");
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const p = Math.min(Math.max(1, page), totalPages);
    const slice = await storage.getPublishedNewsPage(perPage, (p - 1) * perPage, "articles");
    sendPage(
      res,
      renderNewsList(pick(TEMPLATES.articlesList, lang), slice, lang, { page: p, totalPages }, {
        // Misma convención que "/news": una sola ruta corta, idioma por ?lang=en (no
        // /publicaciones/articulos como ruta "limpia" — esa forma queda solo como legacy).
        basePath: "/articles",
        title: { en: "Articles | Von Wobeser y Sierra", es: "Artículos | Von Wobeser y Sierra" },
        description: {
          en: "Legal articles and opinion pieces authored by Von Wobeser y Sierra attorneys.",
          es: "Artículos y columnas de opinión escritos por los abogados de Von Wobeser y Sierra.",
        },
        crumbLabel: { en: "Articles", es: "Artículos" },
      }),
    );
  };

  const serveHome = async (lang: Lang, res: Response) => {
    // El hero muestra 2 noticias: las DESTACADAS van primero (curadas desde el admin) y, si
    // sobran espacios, se rellenan con las publicadas más recientes → nunca se ve vacío.
    const [featured, config, rankings] = await Promise.all([storage.getFeaturedNews(2), getConfigMap(), storage.getRankings()]);
    let heroNews = featured;
    if (heroNews.length < 2) {
      const recent = await storage.getRecentPublishedNews(2 + featured.length);
      heroNews = [...featured, ...recent.filter((r) => !featured.some((f) => f.id === r.id))].slice(0, 2);
    }
    sendPage(res, renderHome(pick(TEMPLATES.home, lang), heroNews, config, lang, rankings));
  };

  // Páginas institucionales (Nuestra Firma, Contacto, Carrera): el texto es editable desde el
  // panel (siteConfig); si está vacío, se muestra el texto original de la plantilla.
  const servePage = async (which: keyof typeof PAGE_KEYS, lang: Lang, res: Response) => {
    const config = await getConfigMap();
    const seo = PAGE_SEO[which];
    sendPage(
      res,
      renderPage(
        pick(TEMPLATES[which], lang),
        config,
        lang,
        PAGE_KEYS[which],
        { path: seo.path[lang], title: seo.title[lang] },
        which === "careers"
          ? ($: cheerio.CheerioAPI) => applyCareersFormFix($, lang)
          : which === "contact"
            ? ($: cheerio.CheerioAPI) => applyContactForm($, lang)
            : which === "diversity"
              ? ($: cheerio.CheerioAPI) => applyDiversityVideoGallery($, config)
              : undefined,
        which === "diversity" ? { bodyMode: "prepend" } : undefined,
      ),
    );
  };

  // Listados "Prácticas" / "Grupos de práctica por industria": antes eran HTML estático
  // congelado (18/19-jun-2026), desconectado de la base de datos. Ahora se generan desde
  // storage.getPracticeGroups()/getIndustryGroups() en cada request, y enlazan a la ruta
  // dinámica /practice|industry/:slug (no a la vieja URL numérica legacy).
  const GROUP_LIST_SEO = {
    practice: {
      path: { en: "/capabilities/practices", es: "/capacidades/practicas" },
      title: { en: "Practices | Von Wobeser y Sierra", es: "Áreas de práctica | Von Wobeser y Sierra" },
      crumb: { en: "Practices", es: "Áreas de práctica" },
      desc: {
        en: "Explore the practice areas of Von Wobeser y Sierra, a full-service Mexican law firm.",
        es: "Conoce las áreas de práctica de Von Wobeser y Sierra, despacho mexicano de servicio integral.",
      },
      template: TEMPLATES.practiceList,
      linkPrefix: "/practice/" as const,
    },
    industry: {
      path: { en: "/capabilities/industries", es: "/capacidades/industrias" },
      title: { en: "Industry Groups | Von Wobeser y Sierra", es: "Grupos de práctica por industria | Von Wobeser y Sierra" },
      crumb: { en: "Industry Groups", es: "Grupos de práctica por industria" },
      desc: {
        en: "Explore the industry groups of Von Wobeser y Sierra, a full-service Mexican law firm.",
        es: "Conoce los grupos de práctica por industria de Von Wobeser y Sierra, despacho mexicano de servicio integral.",
      },
      template: TEMPLATES.industryList,
      linkPrefix: "/industry/" as const,
    },
  } as const;

  const serveGroupList = async (kind: keyof typeof GROUP_LIST_SEO, lang: Lang, res: Response) => {
    const seo = GROUP_LIST_SEO[kind];
    const rows = kind === "practice" ? await storage.getPracticeGroups() : await storage.getIndustryGroups();
    const items: GroupListItem[] = rows
      .filter((r: any) => r.published !== false)
      .map((r: any) => ({ slug: r.slug, name: r.name, nameEs: r.nameEs, order: r.order }));
    sendPage(
      res,
      renderGroupList(pick(seo.template, lang), items, seo.linkPrefix, lang, {
        path: seo.path[lang],
        title: seo.title[lang],
        description: seo.desc[lang],
        crumbLabel: seo.crumb[lang],
      }),
    );
  };

  // La página "Desks" del espejo es un mapa mundial interactivo (SVG), no una lista de texto —
  // ver renderDesk.ts. serveDesksMap rellena las regiones que tengan un desk real; serveDesk
  // sirve la página individual de cada desk, reusando el chrome de "Prácticas" (misma nav/pie
  // que toda la plantilla capturada) porque el mapa no tiene una vista de detalle propia.
  const serveDesksMap = async (lang: Lang, res: Response) => {
    const desks = await storage.getSpecializedDesks();
    const published = desks.filter((d: any) => d.published !== false);
    const teamByDeskId: Record<string, any[]> = {};
    await Promise.all(
      published.map(async (d: any) => {
        teamByDeskId[d.id] = await storage.getTeamMembersByDesk(d.id);
      }),
    );
    sendPage(res, renderDesksMap(pick(TEMPLATES.desksList, lang), desks, lang, teamByDeskId));
  };

  const serveDesk = async (slug: string | undefined, lang: Lang, res: Response, next: NextFunction) => {
    if (!slug) return next();
    const desks = await storage.getSpecializedDesks();
    const desk = desks.find((d) => d.slug === slug);
    if (!desk) return next();
    if ((desk as any).published === false) return next();
    sendPage(res, renderDeskDetail(pick(TEMPLATES.practiceList, lang), desk, lang));
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
  app.get("/articles", wrap((req, res) => serveArticlesList(langOf(req), res, parseInt(String(req.query.page)) || 1)));
  // Página general "Abogados" (a la que redirige el menú): ÚNICA con buscador.
  app.get("/attorneys", wrap((req, res, next) => serveList("partners", langOf(req), res, next, req.query, true)));
  // Resultados de búsqueda (debe ir ANTES de /attorneys/:category para no ser
  // tragada por el parámetro :category).
  app.get("/attorneys/buscar", wrap((req, res) => serveResults(langOf(req), res, req.query)));
  app.get("/attorneys/:category", wrap((req, res, next) => serveList(req.params.category, langOf(req), res, next, req.query)));
  // El menú "Abogados"/"Attorneys" enlazaba a una página estática solo-buscador, sin
  // listado. Se redirige al listado dinámico, que ya trae el buscador integrado.
  app.get("/index.php/attorneys/index.html", wrap((_req, res) => { res.redirect(302, "/attorneys?lang=en"); return Promise.resolve(); }));
  app.get("/index.php/abogados/index.html", wrap((_req, res) => { res.redirect(302, "/attorneys"); return Promise.resolve(); }));
  app.get("/lawyer/:slug", wrap((req, res, next) => serveAttorney(req.params.slug, langOf(req), res, next)));
  app.get("/abogado/:slug", wrap((req, res, next) => serveAttorney(req.params.slug, "es", res, next)));
  app.get("/practice/:slug", wrap((req, res, next) => servePractice(req.params.slug, langOf(req), res, next)));
  app.get("/industry/:slug", wrap((req, res, next) => serveIndustry(req.params.slug, langOf(req), res, next)));
  app.get("/desk/:slug", wrap((req, res, next) => serveDesk(req.params.slug, langOf(req), res, next)));

  // ---------- Páginas institucionales (texto editable desde el panel) ----
  // Variantes de URL del espejo: ES (nuestra-firma/contacto/bolsa-de-trabajo) y EN
  // (our-firm/contact/careers), con y sin index.html, más atajos cortos.
  for (const p of ["/index.php/nuestra-firma/index.html", "/index.php/nuestra-firma/", "/nuestra-firma"])
    app.get(p, wrap((_req, res) => servePage("firm", "es", res)));
  for (const p of ["/index.php/our-firm/index.html", "/index.php/our-firm/", "/our-firm"])
    app.get(p, wrap((_req, res) => servePage("firm", "en", res)));
  for (const p of ["/index.php/contacto/index.html", "/index.php/contacto/", "/contacto"])
    app.get(p, wrap((_req, res) => servePage("contact", "es", res)));
  for (const p of ["/index.php/contact/index.html", "/index.php/contact/", "/contact"])
    app.get(p, wrap((_req, res) => servePage("contact", "en", res)));
  for (const p of ["/index.php/bolsa-de-trabajo/index.html", "/index.php/bolsa-de-trabajo/", "/bolsa-de-trabajo"])
    app.get(p, wrap((_req, res) => servePage("careers", "es", res)));
  for (const p of ["/index.php/careers/index.html", "/index.php/careers/", "/careers"])
    app.get(p, wrap((_req, res) => servePage("careers", "en", res)));
  for (const p of ["/index.php/nuestra-firma/probono/index.html", "/index.php/nuestra-firma/probono/", "/nuestra-firma/probono"])
    app.get(p, wrap((_req, res) => servePage("proBono", "es", res)));
  for (const p of ["/index.php/our-firm/our-firm-probono/index.html", "/index.php/our-firm/our-firm-probono/", "/our-firm/our-firm-probono"])
    app.get(p, wrap((_req, res) => servePage("proBono", "en", res)));
  for (const p of ["/index.php/nuestra-firma/diversidad/index.html", "/index.php/nuestra-firma/diversidad/", "/nuestra-firma/diversidad"])
    app.get(p, wrap((_req, res) => servePage("diversity", "es", res)));
  for (const p of ["/index.php/our-firm/diversity/index.html", "/index.php/our-firm/diversity/", "/our-firm/diversity"])
    app.get(p, wrap((_req, res) => servePage("diversity", "en", res)));
  for (const p of ["/index.php/capacidades/index.html", "/index.php/capacidades/", "/capacidades"])
    app.get(p, wrap((_req, res) => servePage("capabilities", "es", res)));
  for (const p of ["/index.php/capabilities/index.html", "/index.php/capabilities/", "/capabilities"])
    app.get(p, wrap((_req, res) => servePage("capabilities", "en", res)));
  for (const p of ["/index.php/publicaciones/index.html", "/index.php/publicaciones/", "/publicaciones"])
    app.get(p, wrap((_req, res) => servePage("publications", "es", res)));
  for (const p of ["/index.php/publications/index.html", "/index.php/publications/", "/publications"])
    app.get(p, wrap((_req, res) => servePage("publications", "en", res)));
  for (const p of ["/index.php/aviso/index.html", "/index.php/aviso/", "/aviso"])
    app.get(p, wrap((_req, res) => servePage("privacy", "es", res)));
  for (const p of ["/index.php/privacy/index.html", "/index.php/privacy/", "/privacy"])
    app.get(p, wrap((_req, res) => servePage("privacy", "en", res)));
  for (const p of ["/index.php/capacidades/practicas/index.html", "/index.php/capacidades/practicas/", "/capacidades/practicas"])
    app.get(p, wrap((_req, res) => serveGroupList("practice", "es", res)));
  for (const p of ["/index.php/capabilities/practices/index.html", "/index.php/capabilities/practices/", "/capabilities/practices"])
    app.get(p, wrap((_req, res) => serveGroupList("practice", "en", res)));
  for (const p of ["/index.php/capacidades/industrias/index.html", "/index.php/capacidades/industrias/", "/capacidades/industrias"])
    app.get(p, wrap((_req, res) => serveGroupList("industry", "es", res)));
  for (const p of ["/index.php/capabilities/industries/index.html", "/index.php/capabilities/industries/", "/capabilities/industries"])
    app.get(p, wrap((_req, res) => serveGroupList("industry", "en", res)));
  for (const p of ["/index.php/capacidades/desks/index.html", "/index.php/capacidades/desks/", "/capacidades/desks"])
    app.get(p, wrap((_req, res) => serveDesksMap("es", res)));
  for (const p of ["/index.php/capabilities/capabilities-desks/index.html", "/index.php/capabilities/capabilities-desks/", "/capabilities/desks"])
    app.get(p, wrap((_req, res) => serveDesksMap("en", res)));

  // Subpáginas de "Pasantes" — a diferencia de las landings de arriba, estas NO pasan por
  // renderPage/siteConfig (no tienen texto editable), pero SÍ tienen el mismo formulario
  // roto, así que necesitan el mismo fix. Deben registrarse ANTES del express.static de
  // más abajo (si no, ese middleware serviría el HTML capturado tal cual, sin el fix).
  for (const p of ["/index.php/bolsa-de-trabajo/pasantes/index.html", "/index.php/bolsa-de-trabajo/pasantes/", "/bolsa-de-trabajo/pasantes"])
    app.get(p, wrap((_req, res) => {
      const $ = cheerio.load(tpl("index.php/bolsa-de-trabajo/pasantes/index.html"));
      applyCareersFormFix($, "es");
      sendPage(res, $.html());
      return Promise.resolve();
    }));
  for (const p of ["/index.php/careers/interns/index.html", "/index.php/careers/interns/", "/careers/interns"])
    app.get(p, wrap((_req, res) => {
      const $ = cheerio.load(tpl("index.php/careers/interns/index.html"));
      applyCareersFormFix($, "en");
      sendPage(res, $.html());
      return Promise.resolve();
    }));

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
  app.get("/index.php/publications/articles/index.html", wrap((req, res) => serveArticlesList(langOf(req), res)));
  app.get("/index.php/publicaciones/articulos/index.html", wrap((_req, res) => serveArticlesList("es", res)));
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

  // Practice / industry (EN legacy numeric path). The ES legacy path uses the SAME numeric
  // IDs (confirmed 1:1 against the captured mirror — p-3 is "Environmental"/"Ambiental" in
  // both folders), so both languages share the same ids.practice/ids.industry maps.
  app.get("/index.php/practice/p-:id.html", wrap((req, res, next) =>
    servePractice(ids.practice.get(req.params.id), "en", res, next),
  ));
  app.get("/index.php/industry/p-:id.html", wrap((req, res, next) =>
    serveIndustry(ids.industry.get(req.params.id), "en", res, next),
  ));
  app.get("/index.php/practica/p-:id.html", wrap((req, res, next) =>
    servePractice(ids.practice.get(req.params.id), "es", res, next),
  ));
  app.get("/index.php/industria/p-:id.html", wrap((req, res, next) =>
    serveIndustry(ids.industry.get(req.params.id), "es", res, next),
  ));

  // Attorney listings (EN + ES category slugs)
  app.get("/index.php/attorneys/:category/index.html", wrap((req, res, next) =>
    serveList(req.params.category, "en", res, next, req.query),
  ));
  app.get("/index.php/abogados/:category/index.html", wrap((req, res, next) =>
    serveList(ES_CATEGORY[req.params.category] || req.params.category, "es", res, next, req.query),
  ));

  // News detail (publication id → news slug not mapped; falls through to static
  // for legacy publications, while in-app /news/:slug links stay dynamic).

  // ---------- Admin: editable site config (texts, hero video, etc.) -----
  app.get("/api/admin/site-config", authMiddleware, requirePermission("config"), wrap(async (_req, res) => {
    res.json(await getConfigMap());
  }));
  app.put("/api/admin/site-config/:key", authMiddleware, requirePermission("config"), wrap(async (req, res) => {
    let { value, valueEs } = req.body || {};
    // Solo las claves de prosa de páginas institucionales pasan por el editor de texto
    // enriquecido — el resto (URLs de video, banner corto, redes, teléfono) se guarda tal cual.
    if (isRichTextConfigKey(req.params.key)) {
      value = sanitizeCms(value ?? "");
      if (valueEs != null) valueEs = sanitizeCms(valueEs);
    }
    await upsertConfig(req.params.key, value ?? "", valueEs);
    res.json({ ok: true, key: req.params.key });
  }));

  // ---------- Idiomas de traducción (config global + disparo con selección) --
  // El cliente elige a QUÉ idiomas se traduce el contenido, en vez de siempre a los 10.
  const ALL_LANGS = ["es", "en", "de", "zh", "ko", "ja", "ar", "ru", "fr", "it"];
  const parseLangs = (raw: string | undefined): string[] =>
    (raw || "es,en").split(",").map((s) => s.trim()).filter((c) => ALL_LANGS.includes(c));

  // Idiomas activos (config global): a qué idiomas se traduce por defecto.
  app.get("/api/admin/settings/languages", authMiddleware, requirePermission("config"), wrap(async (_req, res) => {
    const map = await getConfigMap();
    res.json({ activeLanguages: parseLangs(map.active_languages?.value), allLanguages: ALL_LANGS });
  }));
  app.post("/api/admin/settings/languages", authMiddleware, requirePermission("config"), wrap(async (req, res) => {
    const langs = Array.isArray(req.body?.languages)
      ? (req.body.languages as string[]).filter((c) => ALL_LANGS.includes(c))
      : [];
    if (langs.length === 0) { res.status(400).json({ error: "Selecciona al menos un idioma" }); return; }
    if (!langs.includes("es")) langs.unshift("es"); // español = idioma fuente, siempre presente
    const unique = Array.from(new Set(langs));
    await upsertConfig("active_languages", unique.join(","));
    res.json({ ok: true, activeLanguages: unique });
  }));

  // Traduce un artículo a los idiomas indicados (o a los activos globales por defecto).
  app.post("/api/admin/translate", authMiddleware, requirePermission("content"), wrap(async (req, res) => {
    const { articleId, languages } = req.body || {};
    if (!articleId) { res.status(400).json({ error: "articleId requerido" }); return; }
    const map = await getConfigMap();
    const active = parseLangs(map.active_languages?.value);
    const requested = Array.isArray(languages) && languages.length
      ? (languages as string[]).filter((c) => ALL_LANGS.includes(c))
      : active;
    const targetLanguages = requested.filter((c) => c !== "es"); // "es" es la fuente
    const { polyglotTranslatorAgent } = await import("../agents/specialized/PolyglotTranslatorAgent");
    const result = await polyglotTranslatorAgent.execute(
      { jobId: `translate-${articleId}`, agentType: "polyglot_translator", startTime: new Date(), metadata: { source: "admin" } } as any,
      { articleId, targetLanguages },
    );
    res.json(result);
  }));

  // ---------- Static assets (css, js, vendor, images, fonts) ------------
  // Antes se servían con max-age=0 → el navegador revalidaba CSS/JS/imágenes/fuentes
  // en CADA carga. Ahora se cachean fuerte: fuentes y librerías vendor son inmutables
  // (1 año), el resto 30 días. Gran ganancia en visitas repetidas y subrecursos.
  app.use(
    express.static(mirrorDir, {
      index: false,
      maxAge: "30d",
      setHeaders: (res, filePath) => {
        if (/([\\/]_vendor[\\/]|\.(?:woff2?|ttf|eot|otf))/i.test(filePath)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    }),
  );

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
