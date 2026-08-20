import type { Request, Response } from "express";
import fs from "fs";
import path from "node:path";
import * as cheerio from "cheerio";
import { mirrorPath } from "./config";
import { cfg, getConfigMap, isConfigEnabled, type ConfigMap } from "./siteConfig";
import { renderRichText } from "./sanitize";
import { getCookieConsentConfig, publicConsentPayload } from "../privacy/cookieConsent";
import { getPublicNavigationMenu, type PublicNavigationMenu } from "./navigationMenu";
import { applyNavigationMarkup } from "./navigationMarkup";
import { normalizeLegacyTypography } from "./legacyHtml";
import { prepareTrustedHtmlForCsp } from "../security/csp";
import { renderPublicFooter } from "./renderFooter";
import { escapeHtmlAttribute, escapeHtmlText } from "./htmlEscape";

export type Lang = "en" | "es";

// Canonical layouts from the mirror, EN + ES variants. The ES files carry the
// Spanish chrome (nav/footer/labels); selectors are identical, so the renderers
// work with either. Pick by language so the whole page (not just data) localizes.
export const TEMPLATES = {
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
export const PAGE_KEYS = {
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
export const PAGE_SEO: Record<keyof typeof PAGE_KEYS, { path: { en: string; es: string }; title: { en: string; es: string } }> = {
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
export const tpl = (rel: string): string => {
  let cached = templateCache.get(rel);
  if (cached === undefined) {
    cached = fs.readFileSync(mirrorPath(rel), "utf8");
    templateCache.set(rel, cached);
  }
  return cached;
};
export const warmTemplates = () => {
  for (const t of Object.values(TEMPLATES)) {
    for (const rel of [t.en, t.es]) {
      try { tpl(rel); } catch { /* variante ausente: se resolverá on-demand */ }
    }
  }
};
export const pick = (t: { en: string; es: string }, lang: Lang) => tpl(lang === "es" ? t.es : t.en);
// Español es el idioma PRINCIPAL (despacho mexicano); inglés solo con ?lang=en.
export const langOf = (req: Request): Lang => (req.query.lang === "en" ? "en" : "es");

// Normaliza (sin acentos, minúsculas) para la búsqueda por apellido.
export const normalizeStr = (s: string) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
// Última palabra del nombre = apellido (igual criterio que el sitio real).
export const lastWord = (name: string) => {
  const parts = (name || "").trim().split(/\s+/);
  return parts[parts.length - 1] || "";
};

// Convierte el control histórico de idioma del header en un selector ES | EN sobre la URL
// actual, sin depender de las rutas originales del espejo. Ambos idiomas permanecen
// visibles y el activo se identifica semánticamente con aria-current.
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
export const LANG_TOGGLE_SCRIPT = `<script>(function(){try{
  var PAIRS={
    '/nuestra-firma':'/about','/our-firm':'/acerca-de',
    '/acerca-de':'/about','/about':'/acerca-de',
    '/contacto':'/contact','/contact':'/contacto',
    '/bolsa-de-trabajo':'/careers','/careers':'/bolsa-de-trabajo',
    '/bolsa-de-trabajo/pasantes':'/careers/interns','/careers/interns':'/bolsa-de-trabajo/pasantes',
    '/bolsa-de-trabajo/vacantes':'/careers/openings','/careers/openings':'/bolsa-de-trabajo/vacantes',
    '/nuestra-firma/probono':'/our-firm/our-firm-probono','/our-firm/our-firm-probono':'/nuestra-firma/probono',
    '/nuestra-firma/diversidad':'/our-firm/diversity','/our-firm/diversity':'/nuestra-firma/diversidad',
    '/nuestra-firma/alcance-internacional':'/our-firm/international-reach','/our-firm/international-reach':'/nuestra-firma/alcance-internacional',
    '/nuestra-firma/alumni':'/our-firm/alumni','/our-firm/alumni':'/nuestra-firma/alumni',
    '/capacidades':'/capabilities','/capabilities':'/capacidades',
    '/capacidades/practicas':'/capabilities/practices','/capabilities/practices':'/capacidades/practicas',
    '/capacidades/industrias':'/capabilities/industries','/capabilities/industries':'/capacidades/industrias',
    '/publicaciones':'/publications','/publications':'/publicaciones',
    '/perspectivas':'/insights','/insights':'/perspectivas',
    '/perspectivas/eventos':'/insights/events','/insights/events':'/perspectivas/eventos',
    '/perspectivas/reconocimientos':'/insights/recognitions','/insights/recognitions':'/perspectivas/reconocimientos',
    '/perspectivas/comunicaciones':'/insights/communications','/insights/communications':'/perspectivas/comunicaciones',
    '/perspectivas/analisis-y-actualizaciones':'/insights/analysis-and-updates','/insights/analysis-and-updates':'/perspectivas/analisis-y-actualizaciones',
    '/perspectivas/sala-de-prensa':'/insights/press-room','/insights/press-room':'/perspectivas/sala-de-prensa',
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
  if(!originalLanguageLink||!originalLanguageLink.parentElement)return;
  var languageHolder=originalLanguageLink.parentElement;
  if(languageHolder.dataset.vwbLanguageReady)return;
  languageHolder.dataset.vwbLanguageReady='true';
  var currentHref=preserveState(location.pathname+location.search);
  var alternateHref=originalLanguageLink.getAttribute('href')||currentHref;
  var esHref=isEn?alternateHref:currentHref;
  var enHref=isEn?currentHref:alternateHref;
  var widget=document.createElement('div');
  widget.className='vwb-language';
  widget.setAttribute('role','group');
  widget.setAttribute('aria-label',isEn?'Language':'Idioma');
  widget.innerHTML='<a class="vwb-language__option" lang="es" hreflang="es-MX" href="'+esHref+'" aria-label="Español"'+(isEn?'':' aria-current="page"')+'>ES</a><span class="vwb-language__separator" aria-hidden="true">|</span><a class="vwb-language__option" lang="en" hreflang="en" href="'+enHref+'" aria-label="English"'+(isEn?' aria-current="page"':'')+'>EN</a>';
  languageHolder.replaceChildren(widget);
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
const NAV_ASSET_VERSION = "20260818-footer-central";
const PUBLIC_STYLE_ASSET_VERSION = "20260819-mobile";
const PUBLIC_STYLE_PATH = "/templates/beez3/css/public.css";
const LEGACY_EVENTS_ASSET_VERSION = "20260813-csp";
const LEGACY_EVENTS_SCRIPT = `<script defer src="/vwb-legacy-events.js?v=${LEGACY_EVENTS_ASSET_VERSION}"></script>`;
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
  let out = html
    .replace(
      /<script\b[^>]*\bsrc=["']\/media\/(?:jui\/js\/(?:jquery(?:-migrate)?\.min\.js|jquery-noconflict\.js|bootstrap\.min\.js)|system\/js\/core\.js)["'][^>]*>\s*<\/script>/gi,
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
  // Las cinco hojas compartidas se descubrían como solicitudes bloqueantes
  // independientes. Se sirven como un único archivo en el mismo directorio
  // para conservar todas las rutas relativas de fuentes e iconos.
  const stylePaths = new Set([
    "/templates/beez3/css/von.css",
    "/templates/beez3/css/style.css",
    "/templates/beez3/css/typography.css",
    "/_vendor/slick/slick.css",
    "/vwb-privacy-preferences.css",
    "/vwb-cookie-consent.css",
  ]);
  let removedSharedStyle = false;
  out = out.replace(/<link\b[^>]*>/gi, (tag) => {
    const rel = tag.match(/\brel\s*=\s*(["'])([^"']*)\1/i)?.[2] || "";
    const href = tag.match(/\bhref\s*=\s*(["'])([^"']*)\1/i)?.[2]?.split(/[?#]/, 1)[0] || "";
    if (/\bstylesheet\b/i.test(rel) && stylePaths.has(href)) {
      removedSharedStyle = true;
      return "";
    }
    return tag;
  });
  const bundleHref = `${PUBLIC_STYLE_PATH}?v=${PUBLIC_STYLE_ASSET_VERSION}`;
  if ((removedSharedStyle || /<head\b/i.test(out)) && !out.includes(PUBLIC_STYLE_PATH)) {
    const bundle = `<link rel="stylesheet" href="${bundleHref}">`;
    out = out.includes("</head>") ? out.replace("</head>", `${bundle}</head>`) : `${bundle}${out}`;
  }
  return out;
}

function injectPerformanceHints(html: string): string {
  if (!html.includes("</head>")) return html;
  const usingPublicBundle = html.includes(PUBLIC_STYLE_PATH);
  const hints = [
    !usingPublicBundle && '<link rel="stylesheet" href="/templates/beez3/css/typography.css?v=20260812-attorney-profiles">',
    '<link rel="preload" href="/templates/beez3/webfont/Inter-Variable.woff2" as="font" type="font/woff2" crossorigin>',
    '<link rel="preload" href="/templates/beez3/webfont/Gelasio-Variable.woff2" as="font" type="font/woff2" crossorigin>',
  ].filter((hint): hint is string => typeof hint === "string")
    .filter((hint) => !html.includes(hint.match(/href="([^"]+)"/)?.[1] || ""));
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

/**
 * Los retratos del directorio viven fuera del espejo histórico, en
 * `attached_assets`. Sus originales pesan hasta 1.2 MB y son mostrados en
 * tarjetas de proporción 4:5. Se generan como recursos estáticos versionables
 * durante `media:optimize`; nunca se transforma una URL arbitraria en runtime.
 */
function attorneyPortraitResponsiveVariants(source: string): Array<{ url: string; width: number }> {
  const match = source.match(/^\/(partner_photos|associate_photos|of_counsel_photos)\/([A-Za-z0-9._-]+)$/);
  if (!match) return [];
  const [, group, filename] = match;
  const parsed = path.posix.parse(filename);
  return [320, 640].flatMap((width) => {
    const relative = path.join("public", "optimized-attorney-photos", group, `${parsed.name}-${width}.webp`);
    return fs.existsSync(path.join(process.cwd(), relative))
      ? [{ url: `/optimized-attorney-photos/${group}/${parsed.name}-${width}.webp`, width }]
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
      : [...uploadedResponsiveVariants(cleanSource), ...attorneyPortraitResponsiveVariants(cleanSource)];
    const critical = /(?:logo|vonwobeser|vw40|vw2025|vw_2025)/i.test(source);
    const displaySize = /\bhome__rec--item\b/i.test(tag)
      ? "156px"
      : /\bvwb-site-footer__logo\b/i.test(tag)
        ? "80px"
      : /\bheader__logo--img\b/i.test(tag)
        ? "220px"
        : /\bdata-vwb-image-kind=["']attorney-portrait["']/i.test(tag)
          ? "(max-width: 640px) calc(100vw - 32px), (max-width: 980px) calc(50vw - 48px), 280px"
        : "";
    let next = tag;
    const add = (attribute: string) => {
      next = next.replace(/\s*\/?>$/, (ending) => ` ${attribute}${ending.trimStart()}`);
    };
    if (!/\bdecoding=/i.test(next)) add('decoding="async"');
    if (variants.length && !/\bsrcset=/i.test(next)) {
      const srcset = variants.map((variant) => `${variant.url} ${variant.width}w`).join(", ");
      add(`srcset="${srcset}"`);
      if (!/\bsizes=/i.test(next)) add(`sizes="${displaySize || "(max-width: 680px) 100vw, 50vw"}"`);
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

export const escHtml = escapeHtmlText;

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
  const escaped = escapeHtmlAttribute(value);
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
  const mark = `<aside class="vw-footer-esr" aria-label="${escapeHtmlAttribute(alt)}"><img class="vw-footer-esr__img" src="${escapeHtmlAttribute(src)}" alt="${escapeHtmlAttribute(alt)}" loading="lazy" decoding="async"></aside>`;
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
  // Algunas instalaciones guardaron el nombre descriptivo completo antes de
  // que el cliente aprobara la etiqueta breve del menú. Lo normalizamos solo
  // cuando coincide exactamente con ese valor legado: un texto personalizado
  // desde Administración siempre se respeta.
  const industryLabel = cfg(config, "nav_industries", lang).trim();
  const legacyIndustryLabel = lang === "es"
    ? "Grupos de práctica por industria"
    : "Industry groups";
  const labels = {
    firm: cfg(config, "nav_firm", lang),
    attorneys: cfg(config, "nav_attorneys", lang),
    practices: cfg(config, "nav_practices", lang),
    industries: industryLabel === legacyIndustryLabel
      ? (lang === "es" ? "Industrias" : "Industries")
      : industryLabel,
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
    var isV2=!!document.querySelector('[data-vw-navigation-version="2"]');
    var links=isV2?[]:document.querySelectorAll('.menu_JS a.nav__menu--link,.menu_JS a.nav__menu--sublink');
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

export function applyProBonoMedia($: cheerio.CheerioAPI, config: ConfigMap): void {
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

export function applyInternsContent($: cheerio.CheerioAPI, config: ConfigMap, lang: Lang): void {
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

export async function sendPage(res: Response, html: string, status = 200) {
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
  const inject = `${consentConfigScript}${navigationLabelsScript(config, lang, navigationItems)}${LANG_TOGGLE_SCRIPT}${SEARCH_FORMS_SCRIPT}${DOC_ACTIONS_SCRIPT}${LEGACY_EVENTS_SCRIPT}`;
  let out = normalizeLegacyTypography(hardenLegacyClientScripts(
    stripRetiredDeskLinks(refreshNavigationAssets(optimizeLegacyAssets(html))),
  ));
  out = applyNavigationMarkup(out, navigationItems, lang);
  out = injectPerformanceHints(optimizePublicImageTags(out));
  out = out.includes("</body>")
    ? out.replace("</body>", `${inject}</body>`)
    : out + inject;
  if (!isOfficeShowcase) {
    try {
      out = renderPublicFooter(out, config, lang);
    } catch { /* si la config falla, se sirve el pie original de la plantilla */ }
  }
  out = ensureImgAlt(out); // backstop a11y: alt en imgs que escaparon a applyA11y
  const nonce = String(res.locals.cspNonce || "");
  if (!nonce) throw new Error("Missing CSP nonce for public HTML response");
  out = prepareTrustedHtmlForCsp(out, nonce);
  // Un nonce debe ser único por respuesta: el HTML no puede compartir caché.
  // Los assets estáticos siguen usando sus TTL largos en express.static.
  res.set("Cache-Control", "private, no-store");
  res.status(status).type("html").send(out);
}
