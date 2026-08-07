import express, { type Express, type Request, type Response, type NextFunction } from "express";
import fs from "fs";
import path from "node:path";
import { eq, and } from "drizzle-orm";
import { getMirrorDir, mirrorPath } from "./config";
import { renderAttorney } from "./renderAttorney";
import { renderAttorneyList, CATEGORIES } from "./renderAttorneyList";
import { renderAttorneyResults } from "./renderAttorneyResults";
import { renderSingle } from "./renderSingle";
import { renderHome } from "./renderHome";
import { renderPage } from "./renderPage";
import { renderFirmLanding } from "./renderFirmLanding";
import { renderGroupList, type GroupListItem } from "./renderGroupList";
import { renderNotFound } from "./renderNotFound";
import { applyCareersFormFix, applyContactForm } from "./formsFix";
import * as cheerio from "cheerio";
import { renderNewsList, renderNewsDetail } from "./renderNews";
import { applyPublicationsSearch, renderGlobalSearch } from "./renderSearch";
import { buildIdMaps, type IdMaps } from "./idMap";
import { cfg, getConfigMap, getFirmPreviousVersion, restoreFirmPreviousVersion, seedConfigDefaults, upsertConfig, isRichTextConfigKey, isOfficeConfigKey, isConfigEnabled, invalidateConfigCache, type ConfigMap } from "./siteConfig";
import {
  setBaseUrl,
  setAnalyticsConfig,
  setFaviconConfig,
  getFaviconHref,
  applyA11y,
} from "./seo";
import { renderRichText, sanitizeCms } from "./sanitize";
import { renderOfficeShowcase } from "./renderOfficeShowcase";
import { applyDiversityVideoGallery } from "./diversityVideoGallery";
import { getCachedPublicPage, invalidatePublicPageCache } from "./pageCache";
import {
  cookieConsentSchema,
  getCookieConsentConfig,
  publicConsentPayload,
  saveCookieConsentConfig,
  seedCookiePolicy,
} from "../privacy/cookieConsent";
import {
  isPublicPracticeSlug,
  isVisiblePublicPractice,
} from "./publicPracticeGroups";
import {
  getPublicNavigationMenu,
  type PublicNavigationMenu,
} from "./navigationMenu";
import {
  legacyHtmlLanguage,
  legacyPaginationDestination,
  normalizeLegacyHtmlLanguage,
  normalizeLegacyTypography,
} from "./legacyHtml";
import { authMiddleware, requireRole, requirePermission } from "../auth";
import { storage } from "../storage";
import { db } from "../db";
import {
  teamMembers,
  teamMemberPracticeGroups,
  practiceGroups,
  teamMemberIndustryGroups,
  industryGroups,
  offices,
  siteConfig,
  insertOfficeSchema,
} from "@shared/schema";
import { z } from "zod";
import { isMigrationReadOnlyEnabled } from "../database/maintenance";
import { normalizeVideoSource } from "@shared/videoSource";

type Lang = "en" | "es";

const MANAGED_VIDEO_CONFIG_KEY = /^(?:hero_video(?:_mobile)?|firm_landing_hero_video|page_diversity_video_(?:main|[1-7])|office_video_[1-6])$/;
const VIDEO_SOURCE_ERROR = "Usa un archivo MP4, WebM, OGV o MOV, o una liga válida de YouTube o Vimeo.";

function normalizedManagedVideoValue(key: string, value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!MANAGED_VIDEO_CONFIG_KEY.test(key) || !raw) return raw;
  return normalizeVideoSource(raw);
}

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
  return { practiceGroups: pg.filter((group) => isPublicPracticeSlug(group.slug)), industryGroups: ig };
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
  offices:      { en: "new-offices/index.html",                    es: "nuevas-oficinas/index.html" },
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
    path: { en: "/about", es: "/acerca-de" },
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
    '/nuestra-firma':'/about','/our-firm':'/acerca-de',
    '/acerca-de':'/about','/about':'/acerca-de',
    '/contacto':'/contact','/contact':'/contacto',
    '/bolsa-de-trabajo':'/careers','/careers':'/bolsa-de-trabajo',
    '/bolsa-de-trabajo/pasantes':'/careers/interns','/careers/interns':'/bolsa-de-trabajo/pasantes',
    '/nuestra-firma/probono':'/our-firm/our-firm-probono','/our-firm/our-firm-probono':'/nuestra-firma/probono',
    '/nuestra-firma/diversidad':'/our-firm/diversity','/our-firm/diversity':'/nuestra-firma/diversidad',
    '/capacidades':'/capabilities','/capabilities':'/capacidades',
    '/capacidades/practicas':'/capabilities/practices','/capabilities/practices':'/capacidades/practicas',
    '/capacidades/industrias':'/capabilities/industries','/capabilities/industries':'/capacidades/industrias',
    '/publicaciones':'/publications','/publications':'/publicaciones',
    '/aviso':'/privacy','/privacy':'/aviso'
  };
  var isEn=(document.documentElement.lang||'').toLowerCase().indexOf('en')===0;
  var path=location.pathname.replace(/\\/$/,'')||'/';
  var targetLang=isEn?'es-MX':'en';
  var alternate=document.querySelector('link[rel="alternate"][hreflang="'+targetLang+'"]');
  var mapped='';
  if(alternate&&alternate.getAttribute('href')){
    var alternateUrl=new URL(alternate.getAttribute('href'),location.origin);
    mapped=alternateUrl.pathname+(alternateUrl.search||'');
  }
  if(!mapped)mapped=PAIRS[path]||'';
  // Una captura histórica sin hreflang conserva en el encabezado el enlace
  // original a su contraparte. Se usa como último recurso antes del fallback
  // por query string, porque una carpeta inglesa siempre volvería a inferir EN.
  var originalLanguageLink=document.querySelector('.header__lang--item[href]');
  if(!mapped&&originalLanguageLink){
    var originalUrl=new URL(originalLanguageLink.getAttribute('href'),location.origin);
    var originalTarget=originalUrl.pathname+(originalUrl.search||'');
    if(originalTarget!==path)mapped=originalTarget;
  }
  function preserveState(href){
    var u=new URL(href,location.origin);
    var current=new URL(location.href);
    ['q','page'].forEach(function(key){
      if(current.searchParams.has(key))u.searchParams.set(key,current.searchParams.get(key));
    });
    return u.pathname+(u.search||'');
  }
  document.querySelectorAll('.header__lang--item').forEach(function(a){
    a.textContent=isEn?'ESP':'ENG';
    if(mapped){a.setAttribute('href',preserveState(mapped));return;}
    var u=new URL(location.href);
    if(isEn){u.searchParams.delete('lang');}else{u.searchParams.set('lang','en');}
    a.setAttribute('href',u.pathname+(u.search||''));
  });
}catch(e){}})();</script>`;

// El buscador de la lupa vive en el encabezado compartido de las 2,253 páginas
// capturadas. Se normaliza al vuelo para que incluso una página estática aún cacheada
// deje de enviar a los endpoints Joomla retirados.
export const SEARCH_FORMS_SCRIPT = `<script>(function(){try{
  var isEn=(document.documentElement.lang||'').toLowerCase().indexOf('en')===0;
  var label=isEn?'Search':'Buscar';
  var minMessage=isEn?'Enter at least 2 characters.':'Escribe al menos 2 caracteres.';
  var navigateSearch=function(query){
    var params=new URLSearchParams();
    params.set('q',query);
    if(isEn)params.set('lang','en');
    window.location.assign('/search?'+params.toString());
  };
  document.querySelectorAll('form[action="/index.php/results"],form[action="/index.php/resultados"],.search_form_cont form[action="/search"]').forEach(function(form){
    var kind=form.querySelector('input[name="kind"]');
    if(kind&&kind.value!=='general')return;
    form.setAttribute('action','/search');
    form.setAttribute('method','get');
    form.querySelectorAll('input[type="hidden"]').forEach(function(input){input.remove();});
    if(isEn){
      var lang=document.createElement('input');lang.type='hidden';lang.name='lang';lang.value='en';form.appendChild(lang);
    }
    var input=form.querySelector('input[name="q"]');
    var container=form.closest('.search_form_cont');
    var trigger=container&&container.querySelector('.eyeglass');
    if(!input||!container||!trigger)return;
    input.setAttribute('type','search');
    input.setAttribute('autocomplete','off');
    input.setAttribute('enterkeyhint','search');
    input.setAttribute('aria-label',label);
    input.setAttribute('placeholder',label);
    trigger.setAttribute('aria-label',label);
    trigger.setAttribute('title',label);
    trigger.setAttribute('aria-controls',input.id||'search_q');
    trigger.setAttribute('aria-expanded','false');
    trigger.setAttribute('data-vw-search-ready','true');
    var button=form.querySelector('.vw-header-search__submit');
    if(!button){
      button=document.createElement('button');
      button.type='submit';
      button.className='vw-header-search__submit';
      button.setAttribute('aria-label',label);
      button.setAttribute('title',label);
      button.textContent='\\u2192';
      form.appendChild(button);
    }
    var header=container.closest('.header');
    var setOpen=function(open,focus){
      container.classList.toggle('vw-search-open',open);
      if(header)header.classList.toggle('vw-header-search-open',open);
      trigger.setAttribute('aria-expanded',open?'true':'false');
      input.style.display=open?'block':'none';
      if(open&&focus)window.requestAnimationFrame(function(){input.focus();input.select();});
    };
    container.vwSetSearchOpen=setOpen;
    container.vwSubmitSearch=function(){
      var query=(input.value||'').trim();
      if(query.length<2){
        setOpen(true,true);
        input.setCustomValidity(minMessage);
        input.reportValidity();
        return;
      }
      input.setCustomValidity('');
      input.value=query;
      navigateSearch(query);
    };
    input.addEventListener('input',function(){input.setCustomValidity('');});
    input.addEventListener('keydown',function(event){
      if(event.key==='Escape'){event.preventDefault();setOpen(false,false);trigger.focus();}
      else if(event.key==='Enter'){event.preventDefault();container.vwSubmitSearch();}
    });
    form.addEventListener('submit',function(event){
      event.preventDefault();
      container.vwSubmitSearch();
    });
    setOpen(false,false);
  });
  document.addEventListener('click',function(event){
    var submitButton=event.target&&event.target.closest?event.target.closest('.vw-header-search__submit'):null;
    if(submitButton){
      var submitContainer=submitButton.closest('.search_form_cont');
      if(submitContainer&&submitContainer.vwSubmitSearch){
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        submitContainer.vwSubmitSearch();
      }
      return;
    }
    var trigger=event.target&&event.target.closest?event.target.closest('.eyeglass'):null;
    if(!trigger)return;
    var container=trigger.closest('.search_form_cont');
    if(!container||!container.vwSetSearchOpen)return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    var isOpen=container.classList.contains('vw-search-open');
    var input=container.querySelector('input[name="q"]');
    if(isOpen&&input&&(input.value||'').trim().length>=2)container.vwSubmitSearch();
    else container.vwSetSearchOpen(!isOpen,true);
  },true);
  document.addEventListener('click',function(event){
    document.querySelectorAll('.search_form_cont.vw-search-open').forEach(function(container){
      if(!container.contains(event.target)&&container.vwSetSearchOpen)container.vwSetSearchOpen(false,false);
    });
  });
}catch(e){}})();</script>`;

// `von.css` y `functions.min.js` son el cromo compartido de todo el espejo.
// Se versionan desde el render para que los cambios de navegación no queden
// ocultos detrás de los 30 días de caché de los assets estáticos.
// Se incrementa junto con los estilos globales del espejo para que las
// navegaciones existentes no conserven una tipografía previa en caché.
const NAV_ASSET_VERSION = "20260807-home-banner-semibold-final";
function refreshNavigationAssets(html: string): string {
  return html
    .replace(/(href=["']\/templates\/beez3\/css\/style\.css)(?:\?[^"']*)?(["'])/gi, `$1?v=${NAV_ASSET_VERSION}$2`)
    .replace(/(href=["']\/templates\/beez3\/css\/von\.css)(?:\?[^"']*)?(["'])/gi, `$1?v=${NAV_ASSET_VERSION}$2`)
    .replace(/(src=["']\/templates\/beez3\/js\/min\/functions\.min\.js)(?:\?[^"']*)?(["'])/gi, `$1?v=${NAV_ASSET_VERSION}$2`)
    .replace(/(src=["']\/templates\/beez3\/js\/min\/slick\.min\.js)(?:\?[^"']*)?(["'])/gi, `$1?v=${NAV_ASSET_VERSION}$2`);
}

// El espejo carga dos versiones completas de jQuery, jQuery Migrate y el core
// público de Joomla en cada página. El HTML no usa ninguna API Joomla (comprobado
// sobre las 2,253 capturas) y el segundo jQuery es el que realmente consumen Slick
// y functions.min.js. Se conserva una sola versión actual, ya incluida localmente.
export function optimizeLegacyAssets(html: string): string {
  return html
    .replace(
      /<script\b[^>]*\bsrc=["']\/media\/(?:jui\/js\/(?:jquery(?:-migrate)?\.min\.js|jquery-noconflict\.js)|system\/js\/core\.js)["'][^>]*>\s*<\/script>/gi,
      "",
    )
    .replace(
      /(["'])\/templates\/beez3\/js\/min\/jquery_3\.3\.1\.min\.js(?:\?[^"']*)?\1/gi,
      `"/_vendor/jquery/jquery-3.7.1.min.js"`,
    )
    .replace(
      /<link\b[^>]*\bhref=["']\/_vendor\/fontawesome\/all\.css(?:\?[^"']*)?["'][^>]*>\s*/gi,
      "",
    )
    .replace(
      /<script\b[^>]*\bclass=["'][^"']*\bjoomla-script-options\b[^"']*["'][^>]*>[\s\S]*?<\/script>\s*/gi,
      "",
    )
    .replace(
      /<script(?![^>]*\bdefer\b)([^>]*\bsrc=["']\/(?:templates\/beez3\/js\/min\/(?:slick|functions)\.min\.js|_vendor\/slick\/slick\.min\.js)(?:\?[^"']*)?["'][^>]*)>/gi,
      "<script defer$1>",
    );
}

function injectPerformanceHints(html: string): string {
  if (!html.includes("</head>")) return html;
  const hints = [
    '<link rel="stylesheet" href="/templates/beez3/css/typography.css?v=20260807-inter-medium">',
    '<link rel="preload" href="/templates/beez3/webfont/Inter-Variable.woff2" as="font" type="font/woff2" crossorigin>',
    '<link rel="preload" href="/templates/beez3/webfont/Gelasio-Variable.woff2" as="font" type="font/woff2" crossorigin>',
  ].filter((hint) => !html.includes(hint.match(/href="([^"]+)"/)?.[1] || ""));
  return hints.length ? html.replace("</head>", `${hints.join("")}</head>`) : html;
}

type ResponsiveImageRecord = {
  width?: number;
  height?: number;
  variants?: Array<{ url: string; width: number }>;
};

let responsiveImageManifest: Record<string, ResponsiveImageRecord> = {};
try {
  responsiveImageManifest = JSON.parse(
    fs.readFileSync(mirrorPath("images", "optimized", "manifest.json"), "utf8"),
  ) as Record<string, ResponsiveImageRecord>;
} catch {
  // El manifiesto es una mejora progresiva: si aún no fue generado se sirven los originales.
}

function uploadedResponsiveVariants(source: string): Array<{ url: string; width: number }> {
  if (!source.startsWith("/uploads/") || source.includes("/optimized/")) return [];
  const clean = source.split(/[?#]/, 1)[0];
  const parsed = path.posix.parse(clean);
  return [640, 1280, 1920].flatMap((width) => {
    const filename = `${parsed.name}-${width}.webp`;
    const absolute = path.join(process.cwd(), "uploads", "optimized", filename);
    return fs.existsSync(absolute)
      ? [{ url: `/uploads/optimized/${filename}`, width }]
      : [];
  });
}

export function optimizePublicImageTags(html: string): string {
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const source = tag.match(/\bsrc=["']([^"']+)["']/i)?.[1] || "";
    const cleanSource = source.split(/[?#]/, 1)[0];
    const manifestEntry = responsiveImageManifest[cleanSource];
    const variants = manifestEntry?.variants?.length
      ? manifestEntry.variants
      : uploadedResponsiveVariants(cleanSource);
    const critical = /(?:logo|vonwobeser|vw40|vw2025|vw_2025)/i.test(source);
    let next = tag;
    const add = (attribute: string) => {
      next = next.replace(/\s*\/?>$/, (ending) => ` ${attribute}${ending.trimStart()}`);
    };
    if (!/\bdecoding=/i.test(next)) add('decoding="async"');
    if (variants.length && !/\bsrcset=/i.test(next)) {
      const srcset = variants.map((variant) => `${variant.url} ${variant.width}w`).join(", ");
      add(`srcset="${srcset}"`);
      if (!/\bsizes=/i.test(next)) add('sizes="(max-width: 680px) 100vw, 50vw"');
    }
    // Los logos del encabezado ya tienen límites de tamaño propios. Convertir sus
    // dimensiones intrínsecas en atributos HTML fija una altura desproporcionada
    // cuando el CSS solo limita el ancho.
    if (!critical && manifestEntry?.width && !/\bwidth=/i.test(next)) add(`width="${manifestEntry.width}"`);
    if (!critical && manifestEntry?.height && !/\bheight=/i.test(next)) add(`height="${manifestEntry.height}"`);
    if (critical) {
      if (!/\bfetchpriority=/i.test(next)) add('fetchpriority="high"');
    } else if (!/\bloading=/i.test(next)) {
      add('loading="lazy"');
    }
    return next;
  });
}

// Las plantillas capturadas comparten fragmentos de JavaScript legado que
// fallan en páginas donde el widget asociado no existe o Slick aún no ha sido
// inicializado. Se corrigen al servir el HTML para cubrir todo el espejo sin
// reescribir miles de archivos estáticos.
export function hardenLegacyClientScripts(html: string): string {
  return html
    .replace(
      /(\bconst btnCerrar = document\.getElementById\(['"]closeOverlay['"]\);\s*)(?!if\s*\(!iframe\s*\|\|\s*!btnCerrar\))/g,
      "$1if (!iframe || !btnCerrar) return;\n    ",
    )
    .replace(
      /\/\* Scroll - activacion de sliders \*\/[\s\S]*?(?=<\/script>|$)/,
      `/* Activación estable de carruseles según visibilidad */
          jQuery(function($){
            var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            var nodes = document.querySelectorAll('.home_slider_JS,.home_rec_JS');
            if (!nodes.length) return;
            function updatePlayback(node, active) {
              node.setAttribute('data-vw-in-view', active ? 'true' : 'false');
              var slider = $(node);
              if (!slider.hasClass('slick-initialized')) return;
              try { slider.slick(active && !reduceMotion ? 'slickPlay' : 'slickPause'); } catch (_error) {}
            }
            nodes.forEach(function(node){
              $(node).off('.vwViewport').on('init.vwViewport reInit.vwViewport', function(){
                updatePlayback(node, node.getAttribute('data-vw-in-view') === 'true');
              });
            });
            if ('IntersectionObserver' in window) {
              var observer = new IntersectionObserver(function(entries){
                entries.forEach(function(entry){
                  updatePlayback(entry.target, entry.isIntersecting && entry.intersectionRatio >= .35);
                });
              }, { threshold: [0, .35, .75] });
              nodes.forEach(function(node){ observer.observe(node); });
            } else {
              nodes.forEach(function(node){ updatePlayback(node, true); });
            }
          });
          `,
    )
    .replace(
      /jQuery\(function\(\$\)\{\s*\$\(["']\.hasTooltip["']\)\.tooltip\((\{[^;]*\})\);\s*\}\);/g,
      `jQuery(function($){ if ($.fn.tooltip) $(".hasTooltip").tooltip($1); });`,
    )
    .replaceAll(
      `var c_txt = counter.split(" ");`,
      `var c_txt = (counter || "").split(" ");`,
    );
}

// Estilo + comportamiento de los botones de acción de las publicaciones (Imprimir / Compartir).
// Se inyecta en TODAS las páginas del espejo (sendPage), así que funciona en todo el front sin
// depender de jQuery: el handler usa delegación de eventos y cubre tanto los botones nuevos
// (data-doc-action) como cualquier `.page--btn.print/.share` heredado del scrape.
const DOC_ACTIONS_SCRIPT = `<style id="vw-doc-actions">
.single__meta--btns{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px;align-items:center}
.single__meta--btns br{display:none}
.vw-doc-btn{display:inline-flex;align-items:center;gap:9px;cursor:pointer;border:1.5px solid #8a1622;background:transparent;color:#8a1622;font-family:"Inter",sans-serif;font-size:12px;font-weight:500;letter-spacing:1.5px;text-transform:uppercase;line-height:1;padding:11px 20px;border-radius:999px;transition:background-color .25s ease,color .25s ease,border-color .25s ease}
.vw-doc-btn svg{width:16px;height:16px;flex:0 0 auto;display:block}
.vw-doc-btn:hover,.vw-doc-btn:focus-visible{background:#8a1622;color:#fff;border-color:#8a1622}
.vw-doc-btn:focus-visible{outline:2px solid #8a1622;outline-offset:3px}
@media print{
  /* Oculta el cromo del sitio al imprimir (menú, pie, buscador, botones, migas). */
  #header,#footer,#breadcrumbs,header,footer,nav,.header,.footer,.header__nav,.header__lang,
  .search,.search__form,.pagination,.pagination-dyn,.attorney__content--btns,.single__meta--btns,
  .vw-doc-btn,.page--btn,#vw-admin-bar,.footer__social,.archive__nav{display:none!important}
  /* Expande TODAS las secciones del perfil (el acordeón las colapsa con max-height/overflow) y
     quita la flechita decorativa (blanca — invisible sobre papel de todas formas). */
  .attorney__meta--list>li{max-height:none!important;overflow:visible!important;padding-left:0!important}
  .attorney__meta--list>li>ul{display:block!important;max-height:none!important;overflow:visible!important}
  .attorney__meta--list>li:before{display:none!important}
  /* Layout lineal a todo el ancho para que el documento salga limpio. */
  .attorney,.attorney__meta,.attorney__content,.page--wrap,.single,.single__meta,.single__content{
    width:100%!important;max-width:100%!important;float:none!important;position:static!important}
  /* --- Ficha del abogado: la tarjeta oscura (fondo gris + texto blanco) no sobrevive al papel
     (los navegadores no imprimen fondos/colores por defecto) y el margin-top fijo que "adivinaba"
     la altura de la foto para no encimarse con el nombre es frágil. Se reemplaza por flujo normal:
     foto → nombre → puesto → contacto → secciones, cada uno debajo del anterior, sin necesitar
     ningún cálculo de altura. */
  .attorney__meta:after{display:none!important}
  .attorney__meta{background:none!important;padding:0!important;margin:0!important}
  .attorney__meta--img{height:auto!important;width:auto!important;max-width:150px!important;
    padding:0!important;margin:0 0 14px 0!important;background-image:none!important}
  #foto{display:block!important;width:150px!important;max-width:150px!important;height:auto!important}
  .attorney__meta--name{color:#111!important;margin:0 0 4px 0!important;font-size:22pt!important}
  .attorney__meta--role{display:block!important;color:#8a1622!important;margin:0 0 14px 0!important;
    font-size:11pt!important;letter-spacing:2px!important;white-space:normal!important}
  .attorney__meta--txt{display:block!important;color:#333!important;margin:0 0 16px 0!important;font-size:10pt!important}
  .attorney__meta--txt a{color:#333!important}
  .attorney__meta--txt a[download]{display:none!important} /* la vCard no sirve en papel */
  .attorney__meta--list,.attorney__meta--list a{color:#111!important}
  a{color:inherit!important;text-decoration:none!important}
  li,p,img,.attorney__meta--img{page-break-inside:avoid}
}
</style><script>(function(){
if(window.__vwDoc)return;window.__vwDoc=1;
function action(el){var a=el.getAttribute&&el.getAttribute('data-doc-action');if(a)return a;var c=el.classList;if(!c)return '';if(c.contains('print'))return 'print';if(c.contains('share'))return 'share';return '';}
document.addEventListener('click',function(e){
 var t=e.target;if(!t||!t.closest)return;
 var el=t.closest('[data-doc-action],a.page--btn.print,a.page--btn.share');
 if(!el)return;
 var a=action(el);if(!a)return;
 e.preventDefault();
 if(a==='print'){window.print();return;}
 if(a==='share'){
  var url=location.href,title=(document.title||'').replace(/\\s*\\|.*$/,'').trim();
  if(navigator.share){navigator.share({title:title,url:url}).catch(function(){});}
  else{window.open('https://www.linkedin.com/sharing/share-offsite/?url='+encodeURIComponent(url),'_blank','noopener,noreferrer,width=620,height=560');}
 }
},false);
})();</script>`;

const escHtml = (s: any) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Inyecta los datos del pie de página (dirección, teléfono, redes) desde siteConfig
// por reemplazo de string (sin re-parseo, muy barato). La plantilla en disco es
// inmutable, así que los selectores/URLs originales siempre están para reemplazar.
const FOOTER_SOCIAL_ANCHORS = {
  facebook: /<a\b[^>]*href=["']https?:\/\/(?:www\.)?facebook\.com[^"']*["'][^>]*>[\s\S]*?<\/a>/i,
  twitter: /<a\b[^>]*href=["']https?:\/\/(?:www\.)?(?:twitter|x)\.com[^"']*["'][^>]*>[\s\S]*?<\/a>/i,
  linkedin: /<a\b[^>]*href=["']https?:\/\/[^"']*linkedin\.com[^"']*["'][^>]*>[\s\S]*?<\/a>/i,
} as const;

const FOOTER_SOCIAL_LABELS: Record<keyof typeof FOOTER_SOCIAL_ANCHORS, string> = {
  facebook: "Facebook",
  twitter: "X",
  linkedin: "LinkedIn",
};

// SVG monocromos y nítidos: conservan el lenguaje sobrio del footer original,
// pero ya no dependen de los PNG históricos de 22 px. `currentColor` permite
// una respuesta sutil en hover/foco sin introducir otra paleta visual.
const FOOTER_SOCIAL_ICONS: Record<keyof typeof FOOTER_SOCIAL_ANCHORS, string> = {
  facebook: '<svg class="vw-footer-social__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M22 12.07C22 6.51 17.52 2 12 2S2 6.51 2 12.07C2 17.1 5.66 21.28 10.44 22v-7.03H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.9 3.78-3.9 1.09 0 2.24.19 2.24.19v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.77l-.44 2.9h-2.33V22C18.34 21.28 22 17.1 22 12.07Z"/></svg>',
  twitter: '<svg class="vw-footer-social__icon vw-footer-social__icon--x" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M18.24 2.25h3.31l-7.23 8.26 8.51 11.24h-6.66l-5.21-6.82-5.97 6.82H1.68l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.84L7.08 4.13H5.12l11.96 15.64Z"/></svg>',
  linkedin: '<svg class="vw-footer-social__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M5.34 3.5A1.84 1.84 0 1 1 5.33 7.2a1.84 1.84 0 0 1 .01-3.69ZM3.75 8.73h3.18V19H3.75V8.73Zm5.17 0h3.05v1.4h.04c.42-.81 1.46-1.66 3-1.66 3.22 0 3.81 2.12 3.81 4.87V19h-3.18v-5.02c0-1.2-.02-2.74-1.67-2.74-1.67 0-1.93 1.31-1.93 2.65V19H8.92V8.73Z"/></svg>',
};

function modernSocialHref(network: keyof typeof FOOTER_SOCIAL_ANCHORS, href: string): string {
  if (network !== "twitter") return href;
  try {
    const url = new URL(href);
    if (/^(?:www\.)?twitter\.com$/i.test(url.hostname)) url.hostname = "x.com";
    return url.toString();
  } catch {
    return href;
  }
}

function setAnchorAttribute(anchor: string, name: string, value: string): string {
  const escaped = escHtml(value);
  const pattern = new RegExp(`\\s${name}=(['\"])[\\s\\S]*?\\1`, "i");
  if (pattern.test(anchor)) return anchor.replace(pattern, ` ${name}="${escaped}"`);
  return anchor.replace(/^<a\b/i, `<a ${name}="${escaped}"`);
}

function updateFooterSocial(
  html: string,
  network: keyof typeof FOOTER_SOCIAL_ANCHORS,
  href: string,
  visible: boolean,
): string {
  const pattern = FOOTER_SOCIAL_ANCHORS[network];
  return html.replace(pattern, (anchor) => {
    if (!visible) return "";
    const configuredHref = modernSocialHref(network, href || anchor.match(/\bhref=(["'])([^"']*)\1/i)?.[2] || "");
    let normalized = anchor;
    if (configuredHref) normalized = setAnchorAttribute(normalized, "href", configuredHref);
    normalized = setAnchorAttribute(normalized, "class", `vw-footer-social vw-footer-social--${network === "twitter" ? "x" : network}`);
    normalized = setAnchorAttribute(normalized, "aria-label", FOOTER_SOCIAL_LABELS[network]);
    normalized = setAnchorAttribute(normalized, "title", FOOTER_SOCIAL_LABELS[network]);
    normalized = setAnchorAttribute(normalized, "target", "_blank");
    normalized = setAnchorAttribute(normalized, "rel", "noopener noreferrer");
    return normalized.replace(/(<a\b[^>]*>)[\s\S]*?(<\/a>)/i, `$1${FOOTER_SOCIAL_ICONS[network]}$2`);
  });
}

export function injectFooterString(html: string, config: ConfigMap, lang: Lang): string {
  const v = (k: string) => cfg(config, k, lang).trim();
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
  html = html.replace(/<footer\b[\s\S]*?<\/footer>/i, (footer) => {
    let socialFooter = footer.replace(
      /<div\b([^>]*style=["'][^"']*width\s*:\s*90px[^"']*["'][^>]*)>(?=\s*<a\b[^>]*facebook\.com)/i,
      '<div class="vw-footer-socials"$1>',
    );
    // Facebook parte oculto incluso cuando una instalación todavía no ha
    // sembrado la configuración. El administrador puede activarlo después.
    socialFooter = updateFooterSocial(socialFooter, "facebook", fb, isConfigEnabled(config, "footer_facebook_visible", false));
    socialFooter = updateFooterSocial(socialFooter, "twitter", tw, isConfigEnabled(config, "footer_twitter_visible"));
    socialFooter = updateFooterSocial(socialFooter, "linkedin", ln, isConfigEnabled(config, "footer_linkedin_visible"));
    return socialFooter.replace(/<div class="vw-footer-socials"[^>]*>\s*<\/div>/i, "");
  });
  return html;
}

function injectFooterESR(html: string, config: ConfigMap, lang: Lang): string {
  if (html.includes('class="vw-footer-esr"')) return html;
  const src = cfg(config, "footer_esr_image", lang).trim() || "/templates/beez3/img/esr.jpg";
  const alt = cfg(config, "footer_esr_alt", lang).trim() || (lang === "es" ? "Empresa Socialmente Responsable" : "Socially Responsible Company");
  const mark = `<aside class="vw-footer-esr" aria-label="${escHtml(alt)}"><img class="vw-footer-esr__img" src="${escHtml(src)}" alt="${escHtml(alt)}" loading="lazy" decoding="async"></aside>`;
  return html.replace(/(<div class="footer--copy">[\s\S]*?<\/div>)/, `$1${mark}`);
}

// Enlace discreto al panel de administración: candado pequeño, opacidad baja (sube al
// pasar el mouse), junto al copyright del pie. El SVG inline evita cargar toda la
// tipografía de Font Awesome solo para mostrar este icono.
const ADMIN_LINK_STYLE = '<style>.vwb-admin-link{color:#fff;opacity:.35;text-decoration:none;transition:opacity .2s;}.vwb-admin-link:hover{opacity:1;}</style>';
function injectAdminLink(html: string, lang: Lang): string {
  const label = lang === "es" ? "Panel de administración" : "Administration panel";
  const lock = '<svg width="11" height="11" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M4.5 7V5a3.5 3.5 0 1 1 7 0v2H13v8H3V7h1.5Zm1.4 0h4.2V5a2.1 2.1 0 1 0-4.2 0v2Z"/></svg>';
  const link = `${ADMIN_LINK_STYLE}<a class="vwb-admin-link" href="/admin" target="_blank" rel="noopener" title="${label}" aria-label="${label}">&nbsp;&nbsp;${lock}</a>`;
  return html.replace(/(<div class="footer--copy">[\s\S]*?)(<\/div>)/, (_m, inner, close) => `${inner}${link}${close}`);
}

// Las plantillas históricas todavía traen el enlace del Desk en el HTML. Se
// elimina antes de enviar cualquier página para evitar destellos, navegación por
// teclado y rastreo de una sección ya retirada; los datos siguen intactos en BD.
function stripRetiredDeskLinks(html: string): string {
  return html.replace(/<a\b[^>]*href=["'][^"']*\/(?:capacidades|capabilities)\/(?:capabilities-)?desks(?:\/index\.html|\/)?[^"']*["'][^>]*>[\s\S]*?<\/a>/gi, "");
}

export function navigationLabelsScript(
  config: ConfigMap,
  lang: Lang,
  items: PublicNavigationMenu = { practices: [], industries: [] },
): string {
  const labels = {
    firm: cfg(config, "nav_firm", lang),
    attorneys: cfg(config, "nav_attorneys", lang),
    practices: cfg(config, "nav_practices", lang),
    industries: cfg(config, "nav_industries", lang),
    publications: cfg(config, "nav_publications", lang),
    careers: cfg(config, "nav_careers", lang),
    contact: cfg(config, "nav_contact", lang),
    search: cfg(config, "nav_search", lang),
    more: cfg(config, "home_news_more", lang),
  };
  const visible = Object.fromEntries(
    ["firm", "attorneys", "practices", "industries", "publications", "careers", "contact"]
      .map((id) => [id, (config[`nav_visible_${id}`]?.value || "true").trim().toLowerCase() !== "false"]),
  );
  const payload = JSON.stringify({ labels, visible, items }).replace(/</g, "\\u003c");
  return `<script>(function(settings){
    var labels=settings.labels||{},visible=settings.visible||{};
    window.__VW_NAV_MENU_ITEMS__=settings.items||{practices:[],industries:[]};
    var identify=function(href,isSub){
      if(href.indexOf('/practicas/')>=0||href.indexOf('/practices/')>=0)return 'practices';
      if(href.indexOf('/industrias/')>=0||href.indexOf('/industries/')>=0)return 'industries';
      if(!isSub&&(href==='/acerca-de'||href==='/about'||href.indexOf('/nuestra-firma/')>=0||href.indexOf('/our-firm/')>=0))return 'firm';
      if(!isSub&&(href.indexOf('/abogados/')>=0||href.indexOf('/attorneys/')>=0))return 'attorneys';
      if(!isSub&&(href.indexOf('/publicaciones/')>=0||href.indexOf('/publications/')>=0))return 'publications';
      if(!isSub&&(href.indexOf('/bolsa-de-trabajo/')>=0||href.indexOf('/careers/')>=0))return 'careers';
      if(!isSub&&(href.indexOf('/contacto/')>=0||href.indexOf('/contact/')>=0))return 'contact';
      return '';
    };
    var links=document.querySelectorAll('.menu_JS a.nav__menu--link,.menu_JS a.nav__menu--sublink');
    for(var i=0;i<links.length;i++){
      var link=links[i],href=(link.getAttribute('href')||'').toLowerCase(),isSub=link.classList.contains('nav__menu--sublink'),key=identify(href,isSub);
      if(key&&visible[key]===false){
        if(isSub)link.remove();
        else{var item=link.closest('.nav__menu--item');if(item)item.remove();else link.remove();}
        continue;
      }
      if(key&&labels[key])link.textContent=labels[key];
    }
    var search=document.querySelector('.eyeglass');
    if(search&&labels.search){search.setAttribute('aria-label',labels.search);search.setAttribute('title',labels.search);}
    if(labels.more){
      var allLinks=document.querySelectorAll('a');
      for(var j=0;j<allLinks.length;j++){
        var raw=(allLinks[j].textContent||'').replace(/\s+/g,' ').trim().toUpperCase();
        if(raw==='VER MAS'||raw==='VER MÁS'||raw==='SEE MORE'){
          allLinks[j].textContent=labels.more;
          allLinks[j].classList.add('vw-read-more');
        }
      }
    }
  })(${payload});</script>`;
}

function applyProBonoMedia($: cheerio.CheerioAPI, config: ConfigMap): void {
  const logos = [1, 2, 3, 4]
    .map((index) => (config[`page_probono_logo_${index}`]?.value || "").trim())
    .filter(Boolean);
  if (!logos.length) return;
  const body = $(".page__content--body").first();
  body.find(".pro_img").remove();
  const widths = [156, 200, 130, 171];
  logos.forEach((url, index) => {
    const paragraph = $("<p>").addClass("pro_img");
    const image = $("<img>").attr({
      src: url,
      alt: `Pro Bono ${index + 1}`,
      decoding: "async",
      style: `display:block;width:min(${widths[index] || 180}px,100%);height:auto;margin:24px auto`,
    });
    paragraph.append(image);
    body.append(paragraph);
  });
}

function applyInternsContent($: cheerio.CheerioAPI, config: ConfigMap, lang: Lang): void {
  $("html").attr("lang", lang === "es" ? "es-mx" : "en-gb");
  const intros = $(".careers__content .page__content--intro");
  const bodies = $(".careers__content .page__content--body");
  const slots: Array<[cheerio.Cheerio<any>, string]> = [
    [intros.eq(0), "page_interns_intro"],
    [intros.eq(1), "page_interns_summer_title"],
    [bodies.eq(0), "page_interns_summer_body"],
    [intros.eq(2), "page_interns_offer_title"],
    [bodies.eq(1), "page_interns_offer_body"],
  ];
  for (const [$slot, key] of slots) {
    const value = cfg(config, key, lang).trim();
    if (value) $slot.html(renderRichText(value));
  }
}

// Inyecta el toggle de idioma antes de </body>, aplica el pie editable y envía.
// Cache-Control permite que navegador/CDN reutilicen la página (contenido público
// que cambia poco); stale-while-revalidate sirve la copia vieja mientras revalida.
// Backstop de accesibilidad (Lighthouse) a nivel string: garantiza `alt` en CUALQUIER
// <img> que haya escapado a applyA11y (p.ej. imgs que se materializan tras el render de
// cheerio — comentarios destapados / inyección tardía). Barato (una regex), sin re-parsear
// el documento (la perf de la home es sensible). Logo/redes reciben nombre real; el resto
// queda decorativo (alt="").
function ensureImgAlt(html: string): string {
  return html.replace(/<img\b(?![^>]*\balt=)[^>]*?>/gi, (tag) => {
    const src = (tag.match(/\bsrc=["']([^"']*)["']/i)?.[1] || "").toLowerCase();
    let alt = "";
    if (/logo|vonwobeser|vw40|vw2025|vw_/.test(src)) alt = "Von Wobeser y Sierra";
    else if (/facebook/.test(src)) alt = "Facebook";
    else if (/twitter|icon_tw/.test(src)) alt = "Twitter";
    else if (/linkedin/.test(src)) alt = "LinkedIn";
    else if (/instagram/.test(src)) alt = "Instagram";
    else if (/youtube/.test(src)) alt = "YouTube";
    return tag.replace(/\s*\/?>\s*$/, ` alt="${alt}">`);
  });
}

async function sendPage(res: Response, html: string, status = 200) {
  const lang: Lang = /<html\b[^>]*\blang=["']es(?:-|["'])/i.test(html) ? "es" : "en";
  const isOfficeShowcase = /<body\b[^>]*\boffice-showcase\b/i.test(html);
  let config: ConfigMap = {};
  let consentConfigScript = "";
  let navigationItems: PublicNavigationMenu = { practices: [], industries: [] };
  const [configResult, navigationResult, consentResult] = await Promise.allSettled([
    getConfigMap(),
    getPublicNavigationMenu(lang),
    getCookieConsentConfig(),
  ]);
  if (configResult.status === "fulfilled") config = configResult.value;
  if (navigationResult.status === "fulfilled") navigationItems = navigationResult.value;
  if (consentResult.status === "fulfilled") {
    const serialized = JSON.stringify(publicConsentPayload(consentResult.value))
      .replace(/</g, "\\u003c")
      .replace(/\u2028/g, "\\u2028")
      .replace(/\u2029/g, "\\u2029");
    consentConfigScript = `<script>window.__VWB_COOKIE_CONSENT_CONFIG__=${serialized};</script>`;
  }
  const inject = `${consentConfigScript}${navigationLabelsScript(config, lang, navigationItems)}${LANG_TOGGLE_SCRIPT}${SEARCH_FORMS_SCRIPT}${DOC_ACTIONS_SCRIPT}`;
  let out = normalizeLegacyTypography(hardenLegacyClientScripts(
    stripRetiredDeskLinks(refreshNavigationAssets(optimizeLegacyAssets(html))),
  ));
  out = injectPerformanceHints(optimizePublicImageTags(out));
  out = out.includes("</body>")
    ? out.replace("</body>", `${inject}</body>`)
    : out + inject;
  if (!isOfficeShowcase) {
    try {
      out = injectFooterString(out, config, lang);
    } catch { /* si la config falla, se sirve el pie original de la plantilla */ }
    out = injectFooterESR(out, config, lang);
    out = injectAdminLink(out, lang);
  }
  out = ensureImgAlt(out); // backstop a11y: alt en imgs que escaparon a applyA11y
  res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  res.status(status).type("html").send(out);
}

// ES attorney-listing category slugs → our canonical category keys.
const ES_CATEGORY: Record<string, string> = {
  socios: "partners",
  "of-counsel-sp": "of-counsel",
  "counsel-sp": "counsel",
  asociados: "associates",
};

const OFFICE_GALLERY_DEFAULTS = [
  ["/img/Collage/collage_01.jpg", "Tall view on the left side of the office gallery", "Vista alta en el lado izquierdo de la galería de oficinas"],
  ["/img/Collage/collage_02.jpg", "Upper wide view of the new offices", "Vista panorámica superior de las nuevas oficinas"],
  ["/img/Collage/collage_05.jpg", "Lower wide view of the new offices", "Vista panorámica inferior de las nuevas oficinas"],
  ["/img/Collage/collage_07.jpg", "Upper view of a collaboration area", "Vista superior de un área de colaboración"],
  ["/img/Collage/collage_04.jpg", "Lower view of a collaboration area", "Vista inferior de un área de colaboración"],
  ["/img/Collage/05.jpg", "Tall view on the right side of the office gallery", "Vista alta en el lado derecho de la galería de oficinas"],
  ["/img/Collage/collage_09.jpg", "Tall architectural detail of the offices", "Detalle arquitectónico vertical de las oficinas"],
  ["/img/Collage/collage_08.jpg", "Upper architectural detail of the offices", "Detalle arquitectónico superior de las oficinas"],
  ["/img/Collage/collage_03.jpg", "Lower architectural detail of the offices", "Detalle arquitectónico inferior de las oficinas"],
] as const;

const LEGACY_OFFICE_GALLERY_PLACEHOLDERS = new Set([
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80",
  "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80",
  "https://images.unsplash.com/photo-1600508774634-4e11d34730e2?w=800&q=80",
  "https://images.unsplash.com/photo-1497366858526-0766cadbe8fa?w=800&q=80",
  "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80",
  "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&q=80",
]);

async function ensureOfficeShowcaseData(): Promise<void> {
  const currentOffices = await storage.getOffices();
  if (!currentOffices.length) {
    await storage.createOffice({
      name: "Von Wobeser y Sierra — Mexico City",
      nameEs: "Von Wobeser y Sierra — Ciudad de México",
      city: "Mexico City",
      country: "Mexico",
      countryEs: "México",
      address: "Torre SOMA Chapultepec, 18th floor. Campos Elíseos 204, Polanco\nEntrance on Arquímedes Street No. 10\n11550 Mexico City",
      addressEs: "Torre SOMA Chapultepec Piso 18. Campos Elíseos 204, Polanco\nAcceso por Calle Arquímedes N.° 10\nC.P. 11550, Ciudad de México",
      phone: "+52 55 5258 1000",
      email: "info@vonwobeser.com",
      latitude: "19.427559",
      longitude: "-99.195333",
      timezone: "America/Mexico_City",
      description: "Headquarters and new offices in Polanco.",
      descriptionEs: "Sede principal y nuevas oficinas en Polanco.",
      imageUrl: "/img/Banner/03.jpg",
      isHeadquarters: true,
      published: true,
      order: 0,
    });
  }

  const currentImages = await storage.getOfficeImages();
  if (currentImages.length === 1 && currentImages[0].imageUrl === "https://vonwobeser.com/images/vonwobeser_2025.png") {
    const first = OFFICE_GALLERY_DEFAULTS[0];
    await storage.updateOfficeImage(currentImages[0].id, { imageUrl: first[0], alt: first[1], altEs: first[2], order: 0 });
    currentImages[0] = { ...currentImages[0], imageUrl: first[0], alt: first[1], altEs: first[2], order: 0 };
  }
  for (const image of currentImages) {
    if (!LEGACY_OFFICE_GALLERY_PLACEHOLDERS.has(image.imageUrl)) continue;
    const index = Math.max(0, Math.min(OFFICE_GALLERY_DEFAULTS.length - 1, image.order ?? 0));
    const item = OFFICE_GALLERY_DEFAULTS[index];
    await storage.updateOfficeImage(image.id, { imageUrl: item[0], alt: item[1], altEs: item[2], order: index });
    image.imageUrl = item[0];
    image.alt = item[1];
    image.altEs = item[2];
    image.order = index;
  }
  const occupiedOrders = new Set(currentImages.map((image) => image.order ?? 0));
  for (let index = 0; index < OFFICE_GALLERY_DEFAULTS.length; index += 1) {
    if (occupiedOrders.has(index)) continue;
    const item = OFFICE_GALLERY_DEFAULTS[index];
    await storage.createOfficeImage({ imageUrl: item[0], alt: item[1], altEs: item[2], order: index });
  }
}

const PRACTICE_HOME_IMAGES: Record<string, string> = {
  "administrative-law": "/images/banners/13.jpg",
  "antitrust-competition": "/images/banners/banner_competition.jpg",
  arbitration: "/images/banners/3.jpg",
  "banking-finance": "/images/banners/4.jpg",
  "bankruptcy-restructuring": "/images/banners/5.jpg",
  "corporate-ma": "/images/banners/7-a.jpg",
  "energy-natural-resources": "/images/banners/home-slider-01.jpg",
  environmental: "/images/banners/banner_environmental.jpg",
  esg: "/images/esg.jpeg",
  "immigration-global-mobility": "/images/banners/image.png",
  "intellectual-property": "/images/banners/banner_ip.jpg",
  "international-trade": "/images/banners/11.jpg",
  "investigations-anticorruption": "/images/banners/home-slider-02.jpg",
  "labor-employment": "/images/banners/12.jpg",
  litigation: "/images/banners/13.jpg",
  "projects-infrastructure": "/images/banners/18.jpg",
  "real-estate": "/images/banners/14.jpg",
  tax: "/images/banners/15.jpg",
  "telecommunications-media-technology": "/images/banners/16.jpg",
};

const INDUSTRY_HOME_IMAGES: Record<string, string> = {
  "automotive-mobility-manufacturing": "/images/banners/1_ind.jpg",
  "consumer-goods": "/images/banners/francesca-grima-vwZo1zAYPws-unsplash_1.jpg",
  "energy-natural-resources-industry": "/images/banners/3_ind.jpg",
  "financial-services": "/images/banners/4_ind.jpg",
  "pharmaceutical-life-sciences": "/images/banners/5_ind.jpg",
  "real-estate-industry": "/images/_banners/pexels-photo-3637943.jpeg",
  "technology-industry": "/images/_banners/pexels-googledeepmind-18069816.jpg",
};

/**
 * Completa únicamente huecos heredados del HTML capturado. Nunca pisa imágenes ni
 * testimonios administrados: después del primer arranque, el panel es la fuente de verdad.
 */
async function ensureHomeContentData(): Promise<void> {
  const [practices, industries, currentTestimonials] = await Promise.all([
    storage.getPracticeGroups(),
    storage.getIndustryGroups(),
    storage.getTestimonials(),
  ]);
  await Promise.all([
    ...practices
      .filter((group) => !group.imageUrl && PRACTICE_HOME_IMAGES[group.slug])
      .map((group) => storage.updatePracticeGroup(group.id, { imageUrl: PRACTICE_HOME_IMAGES[group.slug] })),
    ...industries
      .filter((group) => !group.imageUrl && INDUSTRY_HOME_IMAGES[group.slug])
      .map((group) => storage.updateIndustryGroup(group.id, { imageUrl: INDUSTRY_HOME_IMAGES[group.slug] })),
  ]);

  if (!currentTestimonials.length) {
    const defaults = [
      {
        quote: "Von Wobeser y Sierra, S.C. is a full-service law firm that has successfully blended elite corporate and disputes work. It is possibly the only firm in this market with perfectly balanced strength in both areas, making it well served to assist companies with the most challenging legal matters.",
        quoteEs: "Von Wobeser y Sierra, S.C. es una firma de servicio integral que ha combinado exitosamente trabajo corporativo y contencioso de élite. Es posiblemente la única firma de este mercado con una fortaleza perfectamente equilibrada en ambas áreas, lo que le permite asistir a empresas en los asuntos legales más desafiantes.",
        authorName: "Latin Lawyer",
        source: "Latin Lawyer",
        sourceEs: "Latin Lawyer",
        isFeatured: true,
        published: true,
        order: 1,
      },
      {
        quote: "With a high-profile client base across Latin America, Europe and the US, Von Wobeser y Sierra, S.C.'s service corresponds to that of a highly qualified, international firm.",
        quoteEs: "Con una destacada base de clientes en América Latina, Europa y Estados Unidos, el servicio de Von Wobeser y Sierra, S.C. corresponde al de una firma internacional altamente calificada.",
        authorName: "Legal 500",
        source: "Legal 500",
        sourceEs: "Legal 500",
        isFeatured: true,
        published: true,
        order: 2,
      },
      {
        quote: "This is a firm with the capacity to give comprehensive and practical advice. The lawyers are committed to the client and are always accessible.",
        quoteEs: "Es una firma con la capacidad de brindar asesoría integral y práctica. Los abogados están comprometidos con el cliente y siempre están disponibles.",
        authorName: "Chambers & Partners Latin America",
        source: "Chambers & Partners Latin America",
        sourceEs: "Chambers & Partners Latin America",
        isFeatured: true,
        published: true,
        order: 3,
      },
    ];
    for (const testimonial of defaults) await storage.createTestimonial(testimonial);
  }
}

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
    if (process.env.SECURITY_READ_ONLY_SMOKE !== "true" && !isMigrationReadOnlyEnabled()) {
      await seedConfigDefaults();
      await seedCookiePolicy();
      await ensureOfficeShowcaseData();
      await ensureHomeContentData();
    }
    // Base URL para canonical/OG/JSON-LD: env SITE_URL o la key editable site_url.
    const configAtStartup = await getConfigMap();
    setBaseUrl(process.env.SITE_URL || configAtStartup.site_url?.value);
    // GA4 / Search Console: igual que site_url, se lee una vez al arrancar — si se
    // editan en el panel después, el cambio aplica hasta el siguiente restart.
    setAnalyticsConfig({
      ga4MeasurementId: configAtStartup.ga4_measurement_id?.value,
      searchConsoleVerification: configAtStartup.google_site_verification?.value,
    });
    setFaviconConfig(configAtStartup.site_favicon?.value);
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
      .filter(isVisiblePublicPractice)
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
    if (!isPublicPracticeSlug(slug)) {
      res.status(410).type("html").send(lang === "es" ? "Esta sección fue retirada" : "This section has been retired");
      return;
    }
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

  const serveNewsList = async (lang: Lang, res: Response, page = 1, query = "") => {
    const perPage = 24;
    // Cuenta + una sola página en SQL, en vez de traer TODAS las noticias y paginar en memoria.
    const searched = query.length >= 2
      ? await storage.searchPublishedNewsPage({ query, limit: perPage, offset: Math.max(0, page - 1) * perPage })
      : null;
    const total = searched?.total ?? (query ? 0 : await storage.getPublishedNewsCount());
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const p = Math.min(Math.max(1, page), totalPages);
    const slice = query.length >= 2 && p !== page
      ? (await storage.searchPublishedNewsPage({ query, limit: perPage, offset: (p - 1) * perPage })).rows
      : searched?.rows ?? (query ? [] : await storage.getPublishedNewsPage(perPage, (p - 1) * perPage));
    sendPage(
      res,
      renderNewsList(pick(TEMPLATES.newsList, lang), slice, lang, { page: p, totalPages }, { query }),
    );
  };

  // "Artículos"/"Articles": antes HTML congelado (express.static), enlazando a las mismas
  // noticias legacy p_id-N.html que "Noticias" — resulta que en la DB ya conviven bajo la
  // MISMA tabla `news`, distinguidas por `category` ("news" vs "articles", ~284 filas). Se
  // reusa renderNewsList con opts distintos; Noticias sigue sin filtrar por categoría (no se
  // le quita nada de lo que ya mostraba), así que un artículo puede aparecer en ambos listados.
  const serveArticlesList = async (lang: Lang, res: Response, page = 1, query = "") => {
    const perPage = 24;
    const searched = query.length >= 2
      ? await storage.searchPublishedNewsPage({
          query,
          limit: perPage,
          offset: Math.max(0, page - 1) * perPage,
          category: "articles",
        })
      : null;
    const total = searched?.total ?? (query ? 0 : await storage.getPublishedNewsCount("articles"));
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const p = Math.min(Math.max(1, page), totalPages);
    const slice = query.length >= 2 && p !== page
      ? (await storage.searchPublishedNewsPage({ query, limit: perPage, offset: (p - 1) * perPage, category: "articles" })).rows
      : searched?.rows ?? (query ? [] : await storage.getPublishedNewsPage(perPage, (p - 1) * perPage, "articles"));
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
        query,
      }),
    );
  };

  const serveGlobalSearch = async (lang: Lang, res: Response, query: string) => {
    const normalized = normalizeStr(query);
    const empty = { team: [], practiceGroups: [], industryGroups: [], news: [] };
    if (normalized.length < 2) {
      return sendPage(res, renderGlobalSearch(pick(TEMPLATES.publications, lang), empty, query, lang));
    }
    const [teamRows, practiceRows, industryRows, newsRows] = await Promise.all([
      storage.getTeamMembers(),
      storage.getPracticeGroups(),
      storage.getIndustryGroups(),
      storage.searchNews(query, 20),
    ]);
    const contains = (...values: Array<string | null | undefined>) =>
      values.some((value) => normalizeStr(value || "").includes(normalized));
    const results = {
      team: teamRows
        .filter((item) => item.published !== false && contains(item.name, item.title, item.titleEs, item.role, item.roleEs, item.bio, item.bioEs))
        .slice(0, 20),
      practiceGroups: practiceRows
        .filter((item) => isVisiblePublicPractice(item) && contains(item.name, item.nameEs, item.description, item.descriptionEs))
        .slice(0, 12),
      industryGroups: industryRows
        .filter((item) => item.published !== false && contains(item.name, item.nameEs, item.description, item.descriptionEs))
        .slice(0, 12),
      news: newsRows,
    };
    return sendPage(res, renderGlobalSearch(pick(TEMPLATES.publications, lang), results, query, lang));
  };

  const serveHome = async (lang: Lang, res: Response, bypassCache = false) => {
    const build = async () => {
      const config = await getConfigMap();
      const configuredPages = Number.parseInt(cfg(config, "home_news_pages", "en"), 10);
      const newsLimit = (Number.isFinite(configuredPages)
        ? Math.min(10, Math.max(1, configuredPages))
        : 5) * 2;
      // Las destacadas van primero y el resto se completa con las publicadas más
      // recientes. La cantidad se administra como páginas de dos noticias.
      const [featured, rankings, practices, industries, testimonials] = await Promise.all([
        storage.getFeaturedNews(newsLimit),
        storage.getRankings(),
        storage.getPracticeGroups(),
        storage.getIndustryGroups(),
        storage.getTestimonials(),
      ]);
      let heroNews = featured;
      if (heroNews.length < newsLimit) {
        const recent = await storage.getRecentPublishedNews(newsLimit + featured.length);
        heroNews = [...featured, ...recent.filter((r) => !featured.some((f) => f.id === r.id))].slice(0, newsLimit);
      }
      return renderHome(pick(TEMPLATES.home, lang), heroNews, config, lang, rankings, practices, industries, testimonials);
    };
    const html = bypassCache ? await build() : await getCachedPublicPage(`home:${lang}`, build);
    await sendPage(res, html);
  };

  const serveOfficeShowcase = async (lang: Lang, res: Response) => {
    const [config, officeRows, gallery] = await Promise.all([
      getConfigMap(),
      storage.getOffices(),
      storage.getOfficeImages(),
    ]);
    const office = officeRows.find((item) => item.isHeadquarters && item.published !== false)
      || officeRows.find((item) => item.published !== false);
    if (config.office_published?.value === "false" || !office) {
      await sendPage(
        res,
        renderNotFound(pick(TEMPLATES.publications, lang), lang, lang === "es" ? "/nuevas-oficinas/" : "/new-offices/"),
        404,
      );
      return;
    }
    const html = renderOfficeShowcase(pick(TEMPLATES.offices, lang), config, lang, office, gallery);
    sendPage(res, html);
  };

  const serveFirmLanding = async (lang: Lang, res: Response) => {
    const [config, members, practices, industries] = await Promise.all([
      getConfigMap(),
      storage.getTeamMembers(),
      storage.getPracticeGroups(),
      storage.getIndustryGroups(),
    ]);
    sendPage(
      res,
      renderFirmLanding(pick(TEMPLATES.firm, lang), config, lang, {
        teamMembers: members,
        practices,
        industries,
      }),
    );
  };

  // Páginas institucionales del espejo: conservan su diseño capturado y reciben únicamente
  // el contenido editable de siteConfig. El resumen del video usa una ruta independiente.
  const servePage = async (which: keyof typeof PAGE_KEYS, lang: Lang, res: Response) => {
    const [config, contactPractices] = await Promise.all([
      getConfigMap(),
      which === "contact" ? storage.getPracticeGroups() : Promise.resolve([]),
    ]);
    const seo = PAGE_SEO[which];
    sendPage(
      res,
      renderPage(
        pick(TEMPLATES[which], lang),
        config,
        lang,
        PAGE_KEYS[which],
        { path: seo.path[lang], title: seo.title[lang], alternatePaths: seo.path },
        which === "careers"
          ? ($: cheerio.CheerioAPI) => applyCareersFormFix($, lang)
          : which === "contact"
            ? ($: cheerio.CheerioAPI) => applyContactForm($, lang, config, contactPractices)
            : which === "publications"
              ? ($: cheerio.CheerioAPI) => applyPublicationsSearch($, lang)
            : which === "diversity"
              ? ($: cheerio.CheerioAPI) => applyDiversityVideoGallery($, config, lang)
              : which === "proBono"
                ? ($: cheerio.CheerioAPI) => applyProBonoMedia($, config)
              : undefined,
        which === "diversity" || which === "proBono" ? { bodyMode: "prepend" } : undefined,
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
      .filter((r: any) => r.published !== false && (kind !== "practice" || isPublicPracticeSlug(r.slug)))
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

  const wrap = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => fn(req, res, next).catch(next);

  const publicSearchSchema = z.string().trim().max(200);
  const parsePublicSearch = (value: unknown, lang: Lang, res: Response): string | null => {
    const parsed = publicSearchSchema.safeParse(typeof value === "string" ? value : "");
    if (parsed.success) return parsed.data;
    res
      .status(400)
      .type("html")
      .send(
        `<!doctype html><html lang="${lang}"><meta charset="utf-8"><title>${lang === "es" ? "Búsqueda inválida" : "Invalid search"}</title>` +
        `<body><p>${lang === "es" ? "La búsqueda no puede superar 200 caracteres." : "Search cannot exceed 200 characters."}</p></body></html>`,
      );
    return null;
  };
  const parsePublicPage = (value: unknown): number => {
    const parsed = z.coerce.number().int().min(1).max(10_000).safeParse(value || 1);
    return parsed.success ? parsed.data : 1;
  };
  const searchRedirect = (rawKind: unknown, rawQuery: unknown, lang: Lang): string => {
    const kind = String(rawKind || "general").trim().toLowerCase();
    const query = String(rawQuery || "").trim().slice(0, 200);
    const path = ["noticias", "news"].includes(kind)
      ? "/news"
      : ["articulos", "articles"].includes(kind)
        ? "/articles"
        : "/search";
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (lang === "en") params.set("lang", "en");
    const suffix = params.toString();
    return suffix ? `${path}?${suffix}` : path;
  };

  // ---------- Clean dynamic routes --------------------------------------
  app.get("/api/public/site-branding", wrap(async (_req, res) => {
    const config = await getConfigMap();
    setFaviconConfig(config.site_favicon?.value);
    res
      .set("Cache-Control", "no-cache, must-revalidate")
      .json({ favicon: getFaviconHref() });
  }));
  app.get("/api/public/manifest.webmanifest", wrap(async (_req, res) => {
    const config = await getConfigMap();
    setFaviconConfig(config.site_favicon?.value);
    res
      .set("Cache-Control", "no-cache, must-revalidate")
      .type("application/manifest+json")
      .json({
        name: "Von Wobeser y Sierra",
        short_name: "Von Wobeser",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#AC162C",
        icons: [{ src: getFaviconHref(), sizes: "any", purpose: "any" }],
      });
  }));
  app.get("/api/public/navigation-menu", wrap(async (req, res) => {
    res
      .set("Cache-Control", "public, max-age=60, stale-while-revalidate=300")
      .json(await getPublicNavigationMenu(langOf(req)));
  }));
  app.get("/api/public/consent-config", wrap(async (_req, res) => {
    const payload = publicConsentPayload(await getCookieConsentConfig());
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300").json(payload);
  }));
  app.get("/vwb-cookie-consent-config.js", wrap(async (_req, res) => {
    const payload = publicConsentPayload(await getCookieConsentConfig());
    const serialized = JSON.stringify(payload)
      .replace(/</g, "\\u003c")
      .replace(/\u2028/g, "\\u2028")
      .replace(/\u2029/g, "\\u2029");
    res
      .type("application/javascript")
      .set("Cache-Control", "public, max-age=60, stale-while-revalidate=300")
      .send(`window.__VWB_COOKIE_CONSENT_CONFIG__=${serialized};`);
  }));
  app.get("/", wrap((req, res) => serveHome(langOf(req), res, typeof req.query.preview === "string")));
  app.get("/home", wrap((req, res) => serveHome(langOf(req), res, typeof req.query.preview === "string")));
  app.get("/nuevas-oficinas", wrap((_req, res) => serveOfficeShowcase("es", res)));
  app.get("/nuevas-oficinas/", wrap((_req, res) => serveOfficeShowcase("es", res)));
  app.get("/new-offices", wrap((_req, res) => serveOfficeShowcase("en", res)));
  app.get("/new-offices/", wrap((_req, res) => serveOfficeShowcase("en", res)));
  app.get("/nuevas-oficinas/index.html", (_req, res) => res.redirect(301, "/nuevas-oficinas/"));
  app.get("/new-offices/index.html", (_req, res) => res.redirect(301, "/new-offices/"));
  app.get("/search", wrap(async (req, res) => {
    const lang = langOf(req);
    const query = parsePublicSearch(req.query.q, lang, res);
    if (query === null) return;
    await serveGlobalSearch(lang, res, query);
  }));
  app.get("/publications/search", (req, res) => {
    const lang = langOf(req);
    const query = parsePublicSearch(req.query.q, lang, res);
    if (query === null) return;
    res.redirect(303, searchRedirect(req.query.kind, query, lang));
  });
  // Compatibilidad con formularios conservados en caché y páginas estáticas del espejo.
  // La redirección 303 convierte el POST heredado en un GET compartible y seguro.
  app.post(["/index.php/results", "/index.php/resultados"], (req, res) => {
    const requestedLang = req.body?.lang === "en" || req.query.lang === "en" ? "en" : "es";
    res.redirect(303, searchRedirect(req.body?.kind, req.body?.q, requestedLang));
  });
  app.get("/news", wrap(async (req, res) => {
    const lang = langOf(req);
    const query = parsePublicSearch(req.query.q, lang, res);
    if (query === null) return;
    await serveNewsList(lang, res, parsePublicPage(req.query.page), query);
  }));
  app.get("/news/:slug", wrap((req, res, next) => serveNewsDetail(req.params.slug, langOf(req), res, next)));
  app.get("/articles", wrap(async (req, res) => {
    const lang = langOf(req);
    const query = parsePublicSearch(req.query.q, lang, res);
    if (query === null) return;
    await serveArticlesList(lang, res, parsePublicPage(req.query.page), query);
  }));
  // Página general "Abogados" (a la que redirige el menú): ÚNICA con buscador.
  app.get("/attorneys", wrap((req, res, next) => serveList("partners", langOf(req), res, next, req.query, true)));
  // Resultados de búsqueda (debe ir ANTES de /attorneys/:category para no ser
  // tragada por el parámetro :category).
  app.get("/attorneys/buscar", wrap((req, res) => serveResults(langOf(req), res, req.query)));
  // Listados limpios de las cuatro categorías del submenu de Abogados. Antes
  // estas URLs no tenían handler y caían en el Home inglés del catch-all.
  app.get("/attorneys/:category", wrap((req, res, next) => {
    const lang = langOf(req);
    if (!CATEGORIES[req.params.category]) {
      return sendPage(
        res,
        renderNotFound(pick(TEMPLATES.publications, lang), lang, req.originalUrl),
        404,
      );
    }
    return serveList(req.params.category, lang, res, next, req.query);
  }));
  // El menú "Abogados"/"Attorneys" enlazaba a una página estática solo-buscador, sin
  // listado. Se redirige al listado dinámico, que ya trae el buscador integrado.
  app.get("/index.php/attorneys/index.html", wrap((_req, res) => { res.redirect(302, "/attorneys?lang=en"); return Promise.resolve(); }));
  app.get("/index.php/abogados/index.html", wrap((_req, res) => { res.redirect(302, "/attorneys"); return Promise.resolve(); }));
  app.get("/lawyer/:slug", wrap((req, res, next) => serveAttorney(req.params.slug, langOf(req), res, next)));
  app.get("/abogado/:slug", wrap((req, res, next) => serveAttorney(req.params.slug, "es", res, next)));
  app.get("/practice/:slug", wrap((req, res, next) => servePractice(req.params.slug, langOf(req), res, next)));
  app.get("/industry/:slug", wrap((req, res, next) => serveIndustry(req.params.slug, langOf(req), res, next)));

  // El Desk Alemán fue retirado de la experiencia pública. No se borran sus
  // filas ni relaciones; estas rutas sólo marcan explícitamente el retiro para
  // visitantes, buscadores y enlaces históricos.
  const deskRetired = (req: Request, res: Response) => {
    const en = /capabilities|german-desk/.test(req.path) || req.query.lang === "en";
    const title = en ? "Content retired" : "Contenido retirado";
    const message = en ? "This section is no longer available." : "Esta sección ya no está disponible.";
    res.set("X-Robots-Tag", "noindex");
    res.status(410).type("html").send(`<!doctype html><html lang="${en ? "en" : "es"}"><head><meta charset="utf-8"><title>${title}</title></head><body><p>${message}</p></body></html>`);
  };
  for (const p of [
    "/german-desk", "/desk", "/desk/:slug",
    "/index.php/capacidades/desks/index.html", "/index.php/capacidades/desks/", "/capacidades/desks",
    "/index.php/capabilities/desks/index.html", "/index.php/capabilities/desks/",
    "/index.php/capabilities/capabilities-desks/index.html", "/index.php/capabilities/capabilities-desks/", "/capabilities/desks",
  ]) app.get(p, deskRetired);

  const redirectLegacy = (target: string, lang?: Lang) => (req: Request, res: Response) => {
    const url = new URL(target, "https://local.invalid");
    const effectiveLang = lang || langOf(req);
    if (effectiveLang === "en" && !/^\/(?:our-firm|contact|careers|capabilities|publications|privacy|about)(?:\/|$)/.test(target)) {
      url.searchParams.set("lang", "en");
    }
    for (const key of ["q", "page"]) {
      const value = req.query[key];
      if (typeof value === "string" && value) url.searchParams.set(key, value);
    }
    res.redirect(301, url.pathname + url.search);
  };

  // Canonicaliza las páginas heredadas antes de registrar sus renderizadores de respaldo.
  // De esta forma un enlace o favorito viejo entra una vez a la ruta limpia y el selector
  // de idioma ya no queda atrapado en una URL que fuerza español o inglés.
  const legacyPageRedirects: Array<[string, string, Lang?]> = [
    ["/index.php/home", "/", "es"],
    ["/index.php/home/", "/", "es"],
    ["/index.php/home/index.html", "/", "es"],
    ["/index.html", "/", undefined],
    ["/index.php/index.html", "/", undefined],
    ["/index.php/nuestra-firma", "/acerca-de", "es"],
    ["/index.php/nuestra-firma/index.html", "/acerca-de", "es"],
    ["/index.php/nuestra-firma/", "/acerca-de", "es"],
    ["/index.php/our-firm", "/about", "en"],
    ["/index.php/our-firm/index.html", "/about", "en"],
    ["/index.php/our-firm/", "/about", "en"],
    ["/index.php/contacto/index.html", "/contacto", "es"],
    ["/index.php/contacto/", "/contacto", "es"],
    ["/index.php/contact/index.html", "/contact", "en"],
    ["/index.php/contact/", "/contact", "en"],
    ["/index.php/bolsa-de-trabajo/index.html", "/bolsa-de-trabajo", "es"],
    ["/index.php/bolsa-de-trabajo/", "/bolsa-de-trabajo", "es"],
    ["/index.php/careers/index.html", "/careers", "en"],
    ["/index.php/careers/", "/careers", "en"],
    ["/index.php/capacidades/index.html", "/capacidades", "es"],
    ["/index.php/capacidades/", "/capacidades", "es"],
    ["/index.php/capabilities/index.html", "/capabilities", "en"],
    ["/index.php/capabilities/", "/capabilities", "en"],
    ["/index.php/publicaciones/index.html", "/publicaciones", "es"],
    ["/index.php/publicaciones/", "/publicaciones", "es"],
    ["/index.php/publications/index.html", "/publications", "en"],
    ["/index.php/publications/", "/publications", "en"],
    ["/index.php/publicaciones/noticias/index.html", "/news", "es"],
    ["/index.php/publications/news/index.html", "/news", "en"],
    ["/index.php/publicaciones/articulos/index.html", "/articles", "es"],
    ["/index.php/publications/articles/index.html", "/articles", "en"],
    ["/index.php/aviso/index.html", "/aviso", "es"],
    ["/index.php/aviso/", "/aviso", "es"],
    ["/index.php/privacy/index.html", "/privacy", "en"],
    ["/index.php/privacy/", "/privacy", "en"],
    ["/index.php/capacidades/practicas/index.html", "/capacidades/practicas", "es"],
    ["/index.php/capacidades/practicas/", "/capacidades/practicas", "es"],
    ["/index.php/capabilities/practices/index.html", "/capabilities/practices", "en"],
    ["/index.php/capabilities/practices/", "/capabilities/practices", "en"],
    ["/index.php/capacidades/industrias/index.html", "/capacidades/industrias", "es"],
    ["/index.php/capacidades/industrias/", "/capacidades/industrias", "es"],
    ["/index.php/capabilities/industries/index.html", "/capabilities/industries", "en"],
    ["/index.php/capabilities/industries/", "/capabilities/industries", "en"],
  ];
  for (const [legacy, target, lang] of legacyPageRedirects) app.get(legacy, redirectLegacy(target, lang));

  // La paginación capturada de Joomla usaba offsets de diez elementos. El
  // listado actual pagina en PostgreSQL y es bilingüe; se conserva la posición
  // aproximada del visitante al llevarlo a la página dinámica correspondiente.
  app.get(
    /^\/index\.php\/(?:publications|publicaciones)\/(?:news|noticias|articles|articulos)\/start-\d+\.html$/i,
    (req, res, next) => {
      const destination = legacyPaginationDestination(req.path);
      if (!destination) return next();
      return res.redirect(301, destination);
    },
  );
  app.get("/index.php/publication/p_id-:id.html", (req, res, next) => {
    const slug = pubIdMap.get(req.params.id);
    if (!slug) return next();
    return redirectLegacy(`/news/${slug}`, "en")(req, res);
  });
  app.get("/index.php/publicacion/p_id-:id.html", (req, res, next) => {
    const slug = pubIdMap.get(req.params.id);
    if (!slug) return next();
    return redirectLegacy(`/news/${slug}`, "es")(req, res);
  });
  app.get("/index.php/lawyer/l-:id.html", (req, res, next) => {
    const slug = ids.attorney.get(req.params.id);
    if (!slug) return next();
    return redirectLegacy(`/lawyer/${slug}`, "en")(req, res);
  });
  app.get("/index.php/abogado/l-:id.html", (req, res, next) => {
    const slug = ids.attorney.get(req.params.id);
    if (!slug) return next();
    return redirectLegacy(`/abogado/${slug}`, "es")(req, res);
  });
  for (const [pathPattern, map, prefix, lang] of [
    ["/index.php/practice/p-:id.html", ids.practice, "/practice/", "en"],
    ["/index.php/practica/p-:id.html", ids.practice, "/practice/", "es"],
    ["/index.php/industry/p-:id.html", ids.industry, "/industry/", "en"],
    ["/index.php/industria/p-:id.html", ids.industry, "/industry/", "es"],
  ] as const) {
    app.get(pathPattern, (req, res, next) => {
      const slug = map.get(req.params.id);
      if (!slug) return next();
      return redirectLegacy(`${prefix}${slug}`, lang)(req, res);
    });
  }
  app.get("/index.php/attorneys/:category/index.html", (req, res) =>
    redirectLegacy(`/attorneys/${req.params.category}`, "en")(req, res),
  );
  app.get("/index.php/abogados/:category/index.html", (req, res) =>
    redirectLegacy(`/attorneys/${ES_CATEGORY[req.params.category] || req.params.category}`, "es")(req, res),
  );

  // ---------- Landing institucional (texto editable desde el panel) --------
  // El menú y el video del home comparten estas rutas canónicas.
  for (const p of ["/acerca-de", "/acerca-de/"])
    app.get(p, wrap((_req, res) => serveFirmLanding("es", res)));
  for (const p of ["/about", "/about/"])
    app.get(p, wrap((_req, res) => serveFirmLanding("en", res)));

  // Las raíces antiguas no vuelven a renderizar la página previa. Redirigen en
  // un único salto; las subpáginas de Pro Bono y Diversidad siguen registradas abajo.
  for (const p of ["/nuestra-firma", "/nuestra-firma/"])
    app.get(p, redirectLegacy("/acerca-de", "es"));
  for (const p of ["/our-firm", "/our-firm/"])
    app.get(p, redirectLegacy("/about", "en"));
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
  const serveCookiePolicy = async (lang: Lang, res: Response) => {
    const [config, consent] = await Promise.all([getConfigMap(), getCookieConsentConfig()]);
    const policyKey = "page_privacy_body";
    const policyConfig: ConfigMap = {
      ...config,
      [policyKey]: {
        value: consent.policyContent.en,
        valueEs: consent.policyContent.es,
        type: "richtext",
      },
    };
    const title = lang === "es" ? consent.policyTitle.es : consent.policyTitle.en;
    sendPage(res, renderPage(
      pick(TEMPLATES.privacy, lang),
      policyConfig,
      lang,
      { body: policyKey },
      {
        path: lang === "es" ? "/politica-de-cookies" : "/cookie-policy",
        alternatePaths: { es: "/politica-de-cookies", en: "/cookie-policy" },
        title: `${title} | Von Wobeser y Sierra`,
        description: lang === "es"
          ? "Conoce qué cookies y tecnologías utiliza Von Wobeser y Sierra y cómo puedes administrar tu consentimiento."
          : "Learn which cookies and technologies Von Wobeser y Sierra uses and how you can manage your consent.",
      },
      ($) => {
        $("body").addClass("vwb-cookie-policy");
        $(".page__ttl--holder span,.page__ttl--holder h1,.page__ttl--holder h2").first().text(title);
        const $policyBody = $(".page__content--body").first();
        const policyTableLabel = lang === "es" ? "Tecnologías y proveedores de cookies" : "Cookie technologies and providers";
        const policyMetaLabel = lang === "es" ? "Privacidad digital" : "Digital privacy";
        const policyVersionLabel = lang === "es" ? "Versión" : "Version";

        $policyBody.addClass("vwb-cookie-policy__body");
        $policyBody.children("p").first().addClass("vwb-cookie-policy__intro");
        $policyBody.children("h2").addClass("vwb-cookie-policy__section-title");
        $policyBody.children("p").last().addClass("vwb-cookie-policy__legal-note");
        const $policyMeta = $('<div class="vwb-cookie-policy__meta"><span></span><span></span></div>');
        $policyMeta.children().eq(0).text(policyMetaLabel);
        $policyMeta.children().eq(1).text(`${policyVersionLabel} ${consent.version}`);
        $policyBody.prepend($policyMeta);

        const $policyTable = $policyBody.children("table").first();
        if ($policyTable.length) {
          $policyTable.addClass("vwb-cookie-policy__table");
          $policyTable.wrap(
            `<div class="vwb-cookie-policy__table-shell" role="region" tabindex="0" aria-label="${policyTableLabel}"></div>`,
          );
        }
      },
    ));
  };
  app.get(["/politica-de-cookies", "/politica-de-cookies/"], wrap((_req, res) => serveCookiePolicy("es", res)));
  app.get(["/cookie-policy", "/cookie-policy/"], wrap((_req, res) => serveCookiePolicy("en", res)));
  for (const p of ["/index.php/capacidades/practicas/index.html", "/index.php/capacidades/practicas/", "/capacidades/practicas"])
    app.get(p, wrap((_req, res) => serveGroupList("practice", "es", res)));
  for (const p of ["/index.php/capabilities/practices/index.html", "/index.php/capabilities/practices/", "/capabilities/practices"])
    app.get(p, wrap((_req, res) => serveGroupList("practice", "en", res)));
  for (const p of ["/index.php/capacidades/industrias/index.html", "/index.php/capacidades/industrias/", "/capacidades/industrias"])
    app.get(p, wrap((_req, res) => serveGroupList("industry", "es", res)));
  for (const p of ["/index.php/capabilities/industries/index.html", "/index.php/capabilities/industries/", "/capabilities/industries"])
    app.get(p, wrap((_req, res) => serveGroupList("industry", "en", res)));
  // Subpáginas de "Pasantes" — a diferencia de las landings de arriba, estas NO pasan por
  // renderPage/siteConfig (no tienen texto editable), pero SÍ tienen el mismo formulario
  // roto, así que necesitan el mismo fix. Deben registrarse ANTES del express.static de
  // más abajo (si no, ese middleware serviría el HTML capturado tal cual, sin el fix).
  for (const p of ["/index.php/bolsa-de-trabajo/pasantes/index.html", "/index.php/bolsa-de-trabajo/pasantes/", "/bolsa-de-trabajo/pasantes"])
    app.get(p, wrap((_req, res) => {
      const $ = cheerio.load(tpl("index.php/bolsa-de-trabajo/pasantes/index.html"));
      applyCareersFormFix($, "es");
      return getConfigMap().then((config) => {
        applyInternsContent($, config, "es");
        applyA11y($, "es"); // estas subpáginas no pasan por applySeo
        return sendPage(res, $.html());
      });
    }));
  for (const p of ["/index.php/careers/interns/index.html", "/index.php/careers/interns/", "/careers/interns"])
    app.get(p, wrap((_req, res) => {
      const $ = cheerio.load(tpl("index.php/careers/interns/index.html"));
      applyCareersFormFix($, "en");
      return getConfigMap().then((config) => {
        applyInternsContent($, config, "en");
        applyA11y($, "en"); // estas subpáginas no pasan por applySeo
        return sendPage(res, $.html());
      });
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

  // ---------- Admin: micrositio de oficinas ----------------------------
  const officeConfigEntrySchema = z.object({
    value: z.string().max(25_000),
    valueEs: z.string().max(25_000).optional(),
  });
  const officeShowcaseUpdateSchema = z.object({
    config: z.record(officeConfigEntrySchema).optional(),
    office: z.record(z.unknown()).optional(),
  });

  app.get("/api/admin/office-showcase", authMiddleware, requirePermission("config"), wrap(async (_req, res) => {
    const [configMap, officeRows, gallery] = await Promise.all([
      getConfigMap(),
      storage.getOffices(),
      storage.getOfficeImages(),
    ]);
    const config = Object.fromEntries(Object.entries(configMap).filter(([key]) => isOfficeConfigKey(key)));
    const office = officeRows.find((item) => item.isHeadquarters) || officeRows[0] || null;
    res.json({ config, office, gallery: [...gallery].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) });
  }));

  app.put("/api/admin/office-showcase", authMiddleware, requirePermission("config"), wrap(async (req, res) => {
    const payload = officeShowcaseUpdateSchema.parse(req.body || {});
    const currentConfig = await getConfigMap();
    const configEntries = Object.entries(payload.config || {});
    for (const [key, entry] of configEntries) {
      if (!isOfficeConfigKey(key)) {
        res.status(400).json({ error: `Invalid office config key: ${key}` });
        return;
      }
      if (MANAGED_VIDEO_CONFIG_KEY.test(key)) {
        const normalized = normalizedManagedVideoValue(key, entry.value);
        const normalizedEs = normalizedManagedVideoValue(key, entry.valueEs ?? entry.value);
        if (normalized == null || normalizedEs == null) {
          res.status(400).json({ error: VIDEO_SOURCE_ERROR });
          return;
        }
        entry.value = normalized;
        entry.valueEs = normalizedEs;
      }
    }

    const officeInput = payload.office ? { ...payload.office } : null;
    const officeId = typeof officeInput?.id === "string" ? officeInput.id : undefined;
    if (officeInput) {
      delete officeInput.id;
      delete officeInput.createdAt;
    }
    const parsedOffice = officeInput ? insertOfficeSchema.partial().parse(officeInput) : null;

    await db.transaction(async (tx) => {
      for (const [key, entry] of configEntries) {
        const existing = currentConfig[key];
        const type = existing?.type || (/(_video_|_image|_logo|_pdf|_map_|_linkedin|_x$)/.test(key) ? "url" : "text");
        await tx.insert(siteConfig).values({
          key,
          value: entry.value,
          valueEs: entry.valueEs ?? entry.value,
          type,
          category: "offices",
          updatedAt: new Date(),
        }).onConflictDoUpdate({
          target: siteConfig.key,
          set: { value: entry.value, valueEs: entry.valueEs ?? entry.value, updatedAt: new Date() },
        });
      }

      if (parsedOffice && officeId) {
        await tx.update(offices).set(parsedOffice).where(eq(offices.id, officeId));
      } else if (parsedOffice) {
        const completeOffice = insertOfficeSchema.parse(parsedOffice);
        await tx.insert(offices).values(completeOffice);
      }
    });

    invalidateConfigCache();
    const [updatedConfig, updatedOffices, gallery] = await Promise.all([
      getConfigMap(), storage.getOffices(), storage.getOfficeImages(),
    ]);
    res.json({
      ok: true,
      config: Object.fromEntries(Object.entries(updatedConfig).filter(([key]) => isOfficeConfigKey(key))),
      office: updatedOffices.find((item) => item.isHeadquarters) || updatedOffices[0] || null,
      gallery: [...gallery].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    });
  }));

  // ---------- Admin: navegación pública y visibilidad ------------------
  const navigationItems = [
    { id: "firm", key: "nav_firm", pathEs: "/acerca-de", pathEn: "/about" },
    { id: "attorneys", key: "nav_attorneys", pathEs: "/attorneys", pathEn: "/attorneys?lang=en" },
    { id: "practices", key: "nav_practices", pathEs: "/capacidades/practicas", pathEn: "/capabilities/practices" },
    { id: "industries", key: "nav_industries", pathEs: "/capacidades/industrias", pathEn: "/capabilities/industries" },
    { id: "publications", key: "nav_publications", pathEs: "/publicaciones", pathEn: "/publications" },
    { id: "careers", key: "nav_careers", pathEs: "/bolsa-de-trabajo", pathEn: "/careers" },
    { id: "contact", key: "nav_contact", pathEs: "/contacto", pathEn: "/contact" },
  ] as const;
  const navigationIdSchema = z.enum(["firm", "attorneys", "practices", "industries", "publications", "careers", "contact"]);
  const navigationUpdateSchema = z.object({
    searchLabelEn: z.string().trim().min(1).max(120),
    searchLabelEs: z.string().trim().min(1).max(120),
    items: z.array(z.object({
      id: navigationIdSchema,
      labelEn: z.string().trim().min(1).max(120),
      labelEs: z.string().trim().min(1).max(120),
      visible: z.boolean(),
    })).length(navigationItems.length),
  }).superRefine(({ items }, ctx) => {
    const ids = new Set(items.map((item) => item.id));
    if (ids.size !== navigationItems.length || navigationItems.some((item) => !ids.has(item.id))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["items"], message: "Debes enviar exactamente las siete opciones de navegación." });
    }
  });
  const publicNavigationPayload = (config: ConfigMap) => ({
    items: navigationItems.map((item) => ({
      id: item.id,
      labelEn: config[item.key]?.value || "",
      labelEs: config[item.key]?.valueEs || config[item.key]?.value || "",
      visible: (config[`nav_visible_${item.id}`]?.value || "true").trim().toLowerCase() !== "false",
      pathEs: item.pathEs,
      pathEn: item.pathEn,
    })),
    fixed: {
      homeViaLogo: true,
      search: true,
      language: true,
      searchLabelEn: config.nav_search?.value || "Search",
      searchLabelEs: config.nav_search?.valueEs || config.nav_search?.value || "Buscar",
    },
  });

  app.get("/api/admin/site-navigation", authMiddleware, requirePermission("config"), wrap(async (_req, res) => {
    res.json(publicNavigationPayload(await getConfigMap()));
  }));

  app.put("/api/admin/site-navigation", authMiddleware, requirePermission("config"), wrap(async (req, res) => {
    const payload = navigationUpdateSchema.parse(req.body || {});
    const byId = new Map(payload.items.map((item) => [item.id, item]));
    await db.transaction(async (tx) => {
      for (const definition of navigationItems) {
        const item = byId.get(definition.id)!;
        await tx.insert(siteConfig).values({
          key: definition.key,
          value: item.labelEn,
          valueEs: item.labelEs,
          type: "text",
          category: "navigation",
          updatedAt: new Date(),
        }).onConflictDoUpdate({
          target: siteConfig.key,
          set: { value: item.labelEn, valueEs: item.labelEs, updatedAt: new Date() },
        });
        const visible = String(item.visible);
        await tx.insert(siteConfig).values({
          key: `nav_visible_${definition.id}`,
          value: visible,
          valueEs: visible,
          type: "boolean",
          category: "navigation",
          updatedAt: new Date(),
        }).onConflictDoUpdate({
          target: siteConfig.key,
          set: { value: visible, valueEs: visible, updatedAt: new Date() },
        });
      }
      await tx.insert(siteConfig).values({
        key: "nav_search",
        value: payload.searchLabelEn,
        valueEs: payload.searchLabelEs,
        type: "text",
        category: "navigation",
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: siteConfig.key,
        set: { value: payload.searchLabelEn, valueEs: payload.searchLabelEs, updatedAt: new Date() },
      });
    });
    invalidateConfigCache();
    res.json({ ok: true, ...publicNavigationPayload(await getConfigMap()) });
  }));

  // ---------- Admin: editable site config (texts, hero video, etc.) -----
  app.get("/api/admin/site-config", authMiddleware, requirePermission("config"), wrap(async (_req, res) => {
    res.json(await getConfigMap());
  }));
  // La versión anterior se conserva exclusivamente como respaldo editorial. Esta
  // previsualización requiere sesión administrativa y se marca explícitamente
  // como no indexable para que nunca vuelva a convertirse en una ruta pública.
  app.get("/api/admin/site-config/firma/previous-version/preview", authMiddleware, requirePermission("config"), wrap(async (req, res) => {
    const previous = await getFirmPreviousVersion();
    if (!previous) {
      res.status(404).json({ error: "No existe una versión anterior disponible." });
      return;
    }
    const lang: Lang = req.query.lang === "en" ? "en" : "es";
    const pick = (key: string) => {
      const content = previous.content[key];
      return escHtml(lang === "es" ? content?.valueEs : content?.value).replace(/\n/g, "<br>");
    };
    res.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    res.type("html").send(`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow,noarchive"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${lang === "es" ? "Versión anterior — Nuestra Firma" : "Previous version — Our Firm"}</title><style>body{margin:0;background:#f6f6f4;color:#3f3f3f;font-family:Inter,sans-serif}.vw-preview{max-width:940px;margin:0 auto;padding:56px 28px 72px}.vw-preview__eyebrow{margin:0 0 20px;color:#b71932;font-size:12px;font-weight:500;letter-spacing:.2em;text-transform:uppercase}.vw-preview h1{margin:0 0 34px;font:400 clamp(2.3rem,6vw,4.8rem)/1.02 Gelasio,serif;color:#333}.vw-preview__copy{max-width:760px;font-size:1.1rem;line-height:1.7}.vw-preview__copy p{margin:0 0 24px}</style></head><body><main class="vw-preview"><p class="vw-preview__eyebrow">${lang === "es" ? "Vista interna no indexable" : "Internal, non-indexable preview"}</p><h1>${lang === "es" ? "Versión anterior" : "Previous version"}</h1><section class="vw-preview__copy"><p>${pick("firm_landing_history_intro")}</p><p>${pick("firm_landing_history_body")}</p></section></main></body></html>`);
  }));
  app.post("/api/admin/site-config/firma/restore-previous", authMiddleware, requirePermission("config"), wrap(async (req, res) => {
    if (req.body?.confirm !== true) {
      res.status(400).json({ error: "Confirma la restauración de la versión anterior." });
      return;
    }
    if (!await restoreFirmPreviousVersion()) {
      res.status(404).json({ error: "No existe una versión anterior disponible." });
      return;
    }
    invalidatePublicPageCache();
    res.json({ ok: true });
  }));
  app.get("/api/admin/cookie-consent", authMiddleware, requirePermission("config"), wrap(async (_req, res) => {
    res.json(await getCookieConsentConfig());
  }));
  app.put("/api/admin/cookie-consent", authMiddleware, requirePermission("config"), wrap(async (req, res) => {
    const parsed = cookieConsentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Configuración de privacidad inválida", details: parsed.error.flatten() });
      return;
    }
    const saved = await saveCookieConsentConfig(parsed.data);
    invalidateConfigCache();
    invalidatePublicPageCache();
    res.json(saved);
  }));
  app.put("/api/admin/site-config/:key", authMiddleware, requirePermission("config"), wrap(async (req, res) => {
    let { value, valueEs } = req.body || {};
    if (req.params.key === "home_news_pages") {
      const parsedPages = z.coerce.number().int().min(1).max(10).safeParse(value);
      if (!parsedPages.success) {
        res.status(400).json({ error: "El número de páginas de noticias debe estar entre 1 y 10." });
        return;
      }
      value = String(parsedPages.data);
      valueEs = String(parsedPages.data);
    }
    // Solo las claves de prosa de páginas institucionales pasan por el editor de texto
    // enriquecido — el resto (URLs de video, banner corto, redes, teléfono) se guarda tal cual.
    if (isRichTextConfigKey(req.params.key)) {
      value = sanitizeCms(value ?? "");
      if (valueEs != null) valueEs = sanitizeCms(valueEs);
    }
    if (MANAGED_VIDEO_CONFIG_KEY.test(req.params.key)) {
      const normalized = normalizedManagedVideoValue(req.params.key, value);
      const normalizedEs = valueEs == null ? undefined : normalizedManagedVideoValue(req.params.key, valueEs);
      if (normalized == null || normalizedEs === null) {
        res.status(400).json({ error: VIDEO_SOURCE_ERROR });
        return;
      }
      value = normalized;
      if (normalizedEs !== undefined) valueEs = normalizedEs;
    }
    await upsertConfig(req.params.key, value ?? "", valueEs);
    const { analyzeLinguisticText } = await import("../audits/linguisticAudit");
    const linguisticWarnings = [
      ...analyzeLinguisticText(value ?? "", "en").map((finding) => ({ field: "value", lang: "en", ...finding })),
      ...analyzeLinguisticText(valueEs ?? "", "es").map((finding) => ({ field: "valueEs", lang: "es", ...finding })),
    ];
    let favicon: string | undefined;
    if (req.params.key === "site_favicon") {
      // El cambio debe verse en la siguiente navegación sin reiniciar Replit.
      // Se usa una revisión nueva para romper la caché especial de favicons.
      setFaviconConfig(value ?? "", Date.now());
      favicon = getFaviconHref();
    }
    res.json({ ok: true, key: req.params.key, linguisticWarnings, ...(favicon ? { favicon } : {}) });
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

  // El espejo registra su 404 antes de que Vite/serveStatic atienda `public/`.
  // Por eso los recursos globales del gestor de consentimiento deben salir de
  // forma explícita aquí; de otro modo el HTML los referencia correctamente,
  // pero el navegador recibe un 404 y el panel nunca puede aparecer.
  const consentAssets: Array<[string, string]> = [
    ["/vwb-cookie-consent.css", "vwb-cookie-consent.css"],
    ["/vwb-cookie-consent.js", "vwb-cookie-consent.js"],
  ];
  for (const [route, filename] of consentAssets) {
    app.get(route, (_req, res, next) => {
      const assetPath = path.resolve(process.cwd(), "public", filename);
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.sendFile(assetPath, (error) => {
        if (error && !res.headersSent) next(error);
      });
    });
  }

  // Backstop para cualquier captura HTML histórica que no tenga todavía una
  // ruta dinámica o redirección específica. A diferencia de express.static,
  // este paso la hace pasar por sendPage(), que aplica las dos fuentes vigentes,
  // navegación, idioma, accesibilidad y recursos versionados. Los archivos
  // binarios continúan debajo con su caché larga sin ninguna transformación.
  const mirrorRoot = fs.realpathSync(mirrorDir);
  app.use((req: Request, res: Response, next: NextFunction) => {
    if ((req.method !== "GET" && req.method !== "HEAD") || !/\.html$/i.test(req.path)) return next();

    let decodedPath: string;
    try {
      decodedPath = decodeURIComponent(req.path);
    } catch {
      return next();
    }
    const relativePath = decodedPath.replace(/^\/+/, "");
    if (!relativePath || relativePath.split("/").some((segment) => !segment || segment.startsWith("."))) return next();

    const candidate = path.resolve(mirrorRoot, relativePath);
    if (!candidate.startsWith(`${mirrorRoot}${path.sep}`)) return next();

    let resolved: string;
    try {
      resolved = fs.realpathSync(candidate);
      if (!resolved.startsWith(`${mirrorRoot}${path.sep}`) || !fs.statSync(resolved).isFile()) return next();
    } catch {
      return next();
    }

    const lang = legacyHtmlLanguage(decodedPath, req.query.lang);
    const relativeTemplate = path.relative(mirrorRoot, resolved).split(path.sep).join("/");
    const html = normalizeLegacyHtmlLanguage(tpl(relativeTemplate), lang);
    return sendPage(res, html).catch(next);
  });

  // ---------- Static assets (css, js, vendor, images, fonts) ------------
  // Antes se servían con max-age=0 → el navegador revalidaba CSS/JS/imágenes/fuentes
  // en CADA carga. Ahora se cachean fuerte: fuentes y librerías vendor son inmutables
  // (1 año), el resto 30 días. Gran ganancia en visitas repetidas y subrecursos.
  app.use(
    express.static(mirrorDir, {
      index: false,
      maxAge: "30d",
      setHeaders: (res, filePath) => {
        if (/[\\/]templates[\\/]beez3[\\/](?:css[\\/]von\.css|js[\\/]min[\\/](?:functions|slick)\.min\.js)$/i.test(filePath)) {
          // Estos assets cambian navegación y accesibilidad global en los HTML legacy
          // los referencian sin versión; no deben permanecer obsoletos 30 días.
          res.setHeader("Cache-Control", "public, max-age=300, must-revalidate");
        } else if (
          /([\\/]_vendor[\\/]|[\\/]images[\\/]optimized[\\/]|[\\/]images[\\/]home-hero-(?:desktop|mobile|poster)-v\d+\.|\.(?:woff2?|ttf|eot|otf))/i.test(filePath)
        ) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    }),
  );

  // ---------- Public catch-all: mirror 404, never Home/SPA with status 200 --
  // The old React redesign stays reachable ONLY at /admin. An unknown public
  // URL gets a real, branded 404 so crawlers, analytics and visitors can tell
  // it apart from Home. Missing mirror assets return plain text, not HTML.
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    const p = req.path;
    // Admin app, API and Vite/React internals must reach the SPA.
    if (p.startsWith("/@") || /^\/(admin|api|src|node_modules|vite|assets)(\/|$)/.test(p) || p === "/__vite_ping") return next();
    if (/\.[a-z0-9]+$/i.test(p)) {
      res.status(404).type("text").send("Not Found");
      return;
    }
    const lang = langOf(req);
    return sendPage(
      res,
      renderNotFound(pick(TEMPLATES.publications, lang), lang, req.originalUrl),
      404,
    ).catch(next);
  });
}
