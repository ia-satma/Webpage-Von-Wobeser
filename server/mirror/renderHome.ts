import * as cheerio from "cheerio";
import fs from "node:fs";
import path from "node:path";
import { cfg, isConfigEnabled, type ConfigMap } from "./siteConfig";
import { typographyAttribute, type TypographyStyles } from "@shared/editorialTypography";
import { applySeo } from "./seo";
import { getMirrorDir } from "./config";
import { isPublicPracticeSlug } from "./publicPracticeGroups";
import { sortGroupsAlphabetically } from "./sortPublicGroups";
import {
  buildVideoEmbedUrl,
  parseVideoSource,
  type VideoSource,
} from "@shared/videoSource";
import { hasCompatibleLocalizedNewsTitle } from "./newsLanguage";

type Lang = "en" | "es";

type HomeGroup = {
  slug: string;
  name: string;
  nameEs?: string | null;
  imageUrl?: string | null;
  order?: number | null;
  published?: boolean | null;
};

type HomeTestimonial = {
  id?: string;
  quote: string;
  quoteEs: string;
  authorName: string;
  source?: string | null;
  sourceEs?: string | null;
  order?: number | null;
  isFeatured?: boolean | null;
  published?: boolean | null;
  typography?: TypographyStyles;
};

function esc(s: any): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escAttr(s: any): string {
  return esc(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function normalizeLegacyBannerTitle(value: string, lang: Lang): string {
  const legacy = value.trim();
  if (lang === "es" && ["VAMOS DONDE EL CLIENTE NOS NECESITA", "VAMOS A DONDE LOS CLIENTES NOS NECESITAN"].includes(legacy)) {
    return "Vamos a donde los clientes nos necesitan";
  }
  if (lang === "en" && legacy === "WE GO WHERE CLIENTS NEED US") {
    return "We go where clients need us";
  }
  return value;
}

function safeMediaUrl(value: unknown): string {
  const url = String(value ?? "").trim();
  if (/^\/[a-z0-9_./%+@~:-]+$/i.test(url) || /^https:\/\/[a-z0-9.-]+(?:[/:?#][^\s"'<>]*)?$/i.test(url)) return url;
  return "";
}

function safeHref(value: unknown, fallback: string): string {
  const href = String(value ?? "").trim();
  if (/^\/(?!\/)[a-z0-9_./%+@~:?&=#-]*$/i.test(href)) return href;
  if (/^https:\/\/[a-z0-9.-]+(?:[/:?#][^\s"'<>]*)?$/i.test(href)) return href;
  return fallback;
}

function existingResponsiveVariant(sourceUrl: string, width: number): string {
  const cleanUrl = sourceUrl.split(/[?#]/, 1)[0];
  const parsed = path.posix.parse(cleanUrl);
  let publicUrl = "";
  let absolutePath = "";
  if (cleanUrl.startsWith("/uploads/") && !cleanUrl.includes("/optimized/")) {
    publicUrl = `/uploads/optimized/${parsed.name}-${width}.webp`;
    absolutePath = path.join(process.cwd(), "uploads", "optimized", `${parsed.name}-${width}.webp`);
  } else if ((cleanUrl.startsWith("/images/") || cleanUrl.startsWith("/img/")) && !cleanUrl.includes("/optimized/")) {
    const relative = cleanUrl.replace(/^\/+/, "");
    const relativeParsed = path.posix.parse(relative);
    publicUrl = `/images/optimized/${relativeParsed.dir}/${relativeParsed.name}-${width}.webp`;
    absolutePath = path.join(getMirrorDir(), publicUrl.replace(/^\/+/, ""));
  }
  return publicUrl && fs.existsSync(absolutePath) ? publicUrl : "";
}

function responsiveBackgroundUrls(sourceUrl: string): { mobile: string; desktop: string; fallback: string } {
  const fallback = safeMediaUrl(sourceUrl);
  if (!fallback) return { mobile: "", desktop: "", fallback: "" };
  const mobile = existingResponsiveVariant(fallback, 640) || fallback;
  const desktop = existingResponsiveVariant(fallback, 1920)
    || existingResponsiveVariant(fallback, 1280)
    || fallback;
  return { mobile, desktop, fallback };
}

const HERO_PERFORMANCE_STYLE = `<style id="vw-home-performance">
.home__slider--item.vw-lazy-bg{background-color:#777;background-position:center;background-size:cover}
.vw-home-video-facade{position:relative;width:100%;aspect-ratio:16/9;background-position:center;background-size:cover;background-color:#222;overflow:hidden}
.vw-home-video-facade__poster{position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:cover}
.vw-home-video-facade iframe,.vw-home-video-facade video{display:block;width:100%;height:100%;border:0;object-fit:cover}
.vw-home-video-facade__play{position:absolute;z-index:1;inset:0;width:100%;border:0;background:rgba(0,0,0,.12);color:#fff;cursor:pointer;display:grid;place-items:center}
.vw-home-video-facade__play span{display:grid;place-items:center;width:72px;height:72px;border:2px solid currentColor;border-radius:50%;background:rgba(0,0,0,.5);font:500 32px/1 var(--font-body,"Inter",sans-serif);padding-left:5px}
.vw-home-video-facade__play:focus-visible{outline:3px solid #b5122b;outline-offset:-4px}
.vw-home-video-retry{position:absolute;z-index:8;left:50%;top:50%;display:none;align-items:center;gap:12px;min-height:48px;padding:10px 18px;border:1px solid rgba(255,255,255,.82);background:rgba(20,20,20,.72);color:#fff;cursor:pointer;font:500 14px/1.2 var(--font-body,"Inter",sans-serif);letter-spacing:.02em;transform:translate(-50%,-50%);backdrop-filter:blur(4px)}
.vw-home-video-retry.is-visible{display:inline-flex}.vw-home-video-retry__icon{font-size:19px;line-height:1}.vw-home-video-retry:hover{background:rgba(20,20,20,.88)}.vw-home-video-retry:focus-visible{outline:3px solid #fff;outline-offset:3px}
@media (prefers-reduced-motion:reduce){.home__hero{background-position:center;background-size:cover}}
@media (max-width:800px){.vw-home-video-facade{margin-top:281px}}
@media (max-width:430px){.vw-home-video-facade{margin-top:354px}}
</style>`;

const HERO_PERFORMANCE_SCRIPT = `<script id="vw-home-performance-js">(function(){
  var video=document.getElementById('video_header');
  if(video){
    var retry=document.querySelector('[data-vw-home-video-retry]');
    var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var saveData=!!(navigator.connection&&navigator.connection.saveData);
    var showRetry=function(){if(retry)retry.classList.add('is-visible');};
    var hideRetry=function(){if(retry)retry.classList.remove('is-visible');};
    var hydrated=false;
    var hydrate=function(){
      if(hydrated)return;
      var sources=video.querySelectorAll('source[data-vwb-src]');
      for(var index=0;index<sources.length;index++){
        var source=sources[index];
        var url=source.getAttribute('data-vwb-src');
        if(url){source.setAttribute('src',url);source.removeAttribute('data-vwb-src');}
      }
      hydrated=true;
      video.setAttribute('data-vwb-hydrated','true');
      video.load();
    };
    var start=function(){
      hydrate();
      video.muted=true;video.defaultMuted=true;video.playsInline=true;
      var promise=video.play();
      if(promise&&promise.catch)promise.catch(showRetry);
    };
    video.addEventListener('playing',hideRetry);
    video.addEventListener('error',showRetry);
    if(reduced||saveData){video.autoplay=false;video.pause();video.preload='none';showRetry();}
    else{
      video.autoplay=true;
      var begin=function(){
        start();
        window.setTimeout(function(){if(video.paused&&!video.ended)showRetry();},3500);
      };
      if(window.requestAnimationFrame)window.requestAnimationFrame(function(){window.requestAnimationFrame(begin);});
      else window.setTimeout(begin,0);
    }
    if(retry)retry.addEventListener('click',function(){video.preload='auto';hideRetry();start();});
  }
  var facade=document.querySelector('[data-vw-home-video-facade]');
  if(facade){
    var play=facade.querySelector('[data-vw-home-video-play]');
    if(play)play.addEventListener('click',function(){
      var mobile=window.matchMedia&&window.matchMedia('(max-width: 680px)').matches;
      var embed=facade.getAttribute(mobile?'data-mobile-embed':'data-desktop-embed')||facade.getAttribute('data-desktop-embed');
      var file=facade.getAttribute(mobile?'data-mobile-file':'data-desktop-file')||facade.getAttribute('data-desktop-file');
      var title=facade.getAttribute('data-player-title')||'Video';
      var player;
      if(embed){
        player=document.createElement('iframe');
        player.src=embed;
        player.title=title;
        player.loading='eager';
        player.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';
        player.referrerPolicy='strict-origin-when-cross-origin';
        player.setAttribute('allowfullscreen','');
        player.setAttribute('sandbox','allow-scripts allow-same-origin allow-presentation');
      }else if(file){
        player=document.createElement('video');
        player.src=file;
        player.controls=true;
        player.autoplay=true;
        player.muted=true;
        player.playsInline=true;
      }
      if(player)facade.replaceChildren(player);
    });
  }
  function applyBackground(item,source){
    if(!item||!source)return;
    item.style.backgroundImage='url("'+source.replace(/"/g,'%22')+'")';
    item.setAttribute('data-vw-bg-source',source);
    item.setAttribute('data-vw-bg-loaded','true');
    item.removeAttribute('data-vw-bg-loading');
  }
  function loadBackground(item){
    if(!item)return;
    var mobile=window.matchMedia&&window.matchMedia('(max-width: 680px)').matches;
    var selected=item.getAttribute(mobile?'data-bg-mobile':'data-bg-desktop');
    var fallback=item.getAttribute('data-bg-fallback')||selected;
    var loadedSource=item.getAttribute('data-vw-bg-source')||selected;
    /* Slick puede conservar la marca de carga al clonar/recalcular una slide y,
       al mismo tiempo, eliminar su background inline. Restaurarlo aquí evita
       que la primera práctica o industria quede gris después de setPosition. */
    if(item.getAttribute('data-vw-bg-loaded')==='true'&&loadedSource){
      if(!item.style.backgroundImage)applyBackground(item,loadedSource);
      return;
    }
    if(item.getAttribute('data-vw-bg-loading')==='true')return;
    if(!selected)return;
    item.setAttribute('data-vw-bg-loading','true');
    var probe=new Image();
    probe.onload=function(){applyBackground(item,selected);};
    probe.onerror=function(){
      if(fallback&&fallback!==selected){
        var fallbackProbe=new Image();
        fallbackProbe.onload=function(){applyBackground(item,fallback);};
        fallbackProbe.onerror=function(){item.removeAttribute('data-vw-bg-loading');};
        fallbackProbe.src=fallback;
      }else item.removeAttribute('data-vw-bg-loading');
    };
    probe.src=selected;
  }
  function loadWindow(slider,index){
    var items=slider.querySelectorAll('.home__slider--item:not(.slick-cloned)');
    if(!items.length)return;
    var count=items.length;
    var current=((Number(index)||0)%count+count)%count;
    var next=(current+1)%count;
    loadBackground(items[current]);
    loadBackground(items[next]);
    /* Slick clona slides para el desplazamiento infinito. La imagen se debe
       aplicar también a las copias que representan el slide actual/siguiente;
       cargar solo el original deja cuadros grises aunque la ruta exista. */
    slider.querySelectorAll('.slick-cloned.vw-lazy-bg').forEach(function(item){
      var raw=Number(item.getAttribute('data-slick-index'));
      if(!Number.isFinite(raw))return;
      var logical=((raw%count)+count)%count;
      if(logical===current||logical===next)loadBackground(item);
    });
    slider.querySelectorAll('.slick-active.vw-lazy-bg,.slick-current.vw-lazy-bg').forEach(loadBackground);
  }
  function init(){
    document.querySelectorAll('.home_slider_JS').forEach(function(slider){
      if(window.jQuery){
        var instance=window.jQuery(slider);
        instance.off('.vwLazyBg')
          .on('init.vwLazyBg reInit.vwLazyBg setPosition.vwLazyBg',function(_event,slick){
            loadWindow(slider,slick&&Number.isFinite(slick.currentSlide)?slick.currentSlide:0);
          })
          .on('beforeChange.vwLazyBg',function(_event,_slick,_current,next){loadWindow(slider,next);})
          .on('afterChange.vwLazyBg',function(_event,_slick,current){loadWindow(slider,current);});
        var current=0;
        if(instance.hasClass('slick-initialized')){
          try{current=instance.slick('slickCurrentSlide')||0;}catch(_error){current=0;}
        }
        loadWindow(slider,current);
        window.requestAnimationFrame(function(){loadWindow(slider,current);});
      }else{
        loadWindow(slider,0);
      }
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();</script>`;

// La portada heredada revela sus bloques al desplazarse con una subida de 40 px,
// un segundo de transición y 200 ms de desfase. Esta versión es deliberadamente
// aislada: el contenido nace visible y solo se prepara para animarse cuando el
// navegador confirma que JavaScript, escritorio y movimiento normal están activos.
const HOME_ABOUT_EDITORIAL_REVEAL_SCRIPT = `<script id="vw-home-about-editorial-reveal">(function(){
  if(window.__vwHomeAboutEditorialReveal)return;
  window.__vwHomeAboutEditorialReveal=true;
  var roots=document.querySelectorAll('[data-home-about-reveal]');
  if(!roots.length)return;
  var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var compact=window.matchMedia&&window.matchMedia('(max-width: 980px)').matches;
  roots.forEach(function(root){
    var items=root.querySelectorAll('[data-home-about-reveal-item]');
    if(!items.length)return;
    var reveal=function(){root.classList.add('is-revealed');};
    if(reduced||compact||!('IntersectionObserver' in window)){reveal();return;}
    root.classList.add('is-motion-ready');
    var observer=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(!entry.isIntersecting)return;
        reveal();observer.unobserve(root);
      });
    },{rootMargin:'0px 0px -90px 0px',threshold:0});
    observer.observe(root);
  });
})();</script>`;

function paragraphs(value: string): string {
  return value
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `<p>${esc(part).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

type HomeValueItem = {
  title: string;
  body: string;
};

/**
 * El panel mantiene los Valores como prosa separada por una línea en blanco.
 * La presentación editorial aprovecha ese mismo contenido: el primer ":"
 * define el título de cada valor y todo lo demás conserva su descripción.
 */
function splitHomeValueItems(value: string): HomeValueItem[] {
  return value
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separator = part.indexOf(":");
      if (separator < 0) return { title: "", body: part };
      return {
        title: part.slice(0, separator).trim(),
        body: part.slice(separator + 1).trim(),
      };
    });
}

function renderHomeAboutEditorial(content: {
  title: string;
  intro: string;
  visionLabel: string;
  visionBody: string;
  missionLabel: string;
  missionBody: string;
  valuesLabel: string;
  valuesBody: string;
}): string {
  const values = splitHomeValueItems(content.valuesBody);
  let revealIndex = 0;
  const reveal = () => ` data-home-about-reveal-item="${++revealIndex}"`;
  const principles = [
    { index: "01", label: content.visionLabel, body: content.visionBody },
    { index: "02", label: content.missionLabel, body: content.missionBody },
  ].filter((item) => item.label || item.body);
  const valuesMarkup = () => values.length
    ? `<section class="home-about-editorial__values"${reveal()} aria-labelledby="home-about-values-title">` +
        `<h3 id="home-about-values-title">${esc(content.valuesLabel)}</h3>` +
        `<ol class="home-about-editorial__value-list">${values.map((value, index) =>
          `<li><span class="home-about-editorial__index">${String(index + 1).padStart(2, "0")}</span>` +
            `<div>${value.title ? `<h4>${esc(value.title)}</h4>` : ""}${value.body ? paragraphs(value.body) : ""}</div>` +
          `</li>`,
        ).join("")}</ol>` +
      `</section>`
    : "";

  return `<section class="home-about-editorial" data-home-about-reveal aria-labelledby="home-about-editorial-title">` +
    `<div class="home-about-editorial__container">` +
      `<header class="home-about-editorial__heading"${reveal()}>` +
        `<h2 id="home-about-editorial-title">${esc(content.title)}</h2>` +
        (content.intro ? `<p>${esc(content.intro)}</p>` : "") +
      `</header>` +
      (principles.length
        ? `<div class="home-about-editorial__principles"${reveal()}>${principles.map((principle) =>
            `<article><span class="home-about-editorial__index">${principle.index}</span>` +
              `<h3>${esc(principle.label)}</h3>${principle.body ? `<div class="home-about-editorial__copy">${paragraphs(principle.body)}</div>` : ""}` +
            `</article>`,
          ).join("")}</div>`
        : "") +
      valuesMarkup() +
    `</div>` +
  `</section>`;
}

function renderGroupSlider(groups: HomeGroup[], kind: "practice" | "industry", config: ConfigMap, lang: Lang): string {
  const isPractice = kind === "practice";
  const publicGroups = groups.filter((group) => (
      group.published !== false
      && (!isPractice || isPublicPracticeSlug(group.slug))
    ));
  const visible = isPractice
    ? sortGroupsAlphabetically(publicGroups, lang)
    : publicGroups.sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name),
    );
  if (!visible.length) return "";

  const label = cfg(config, isPractice ? "home_practices_label" : "home_industries_label", lang)
    || (lang === "es" ? (isPractice ? "Prácticas" : "Grupos de práctica por industria") : (isPractice ? "Practices" : "Industry Practice Groups"));
  const seeMore = cfg(config, "home_news_more", lang) || (lang === "es" ? "VER MÁS" : "SEE MORE");
  const langSuffix = lang === "en" ? "?lang=en" : "";
  const overview = isPractice
    ? (lang === "es" ? "/capacidades/practicas" : "/capabilities/practices?lang=en")
    : (lang === "es" ? "/capacidades/industrias" : "/capabilities/industries?lang=en");
  const intro = `<div class="home__slider--item" style="background-color:rgba(94,94,94,0.2)"><div class="home__slider--wrap wrap"><span class="industria_intro_1">${visible.length}</span><span class="industria_intro_2">${esc(label)}</span><span><a style="color:#fff" href="${overview}">${esc(seeMore)}</a></span></div></div>`;
  const items = visible.map((group, index) => {
    const image = safeMediaUrl(group.imageUrl);
    const responsive = responsiveBackgroundUrls(image);
    const media = image
      ? ` class="home__slider--item vw-lazy-bg" data-bg-mobile="${escAttr(responsive.mobile)}" data-bg-desktop="${escAttr(responsive.desktop)}" data-bg-fallback="${escAttr(responsive.fallback)}"`
      : ` class="home__slider--item" style="background-color:#777"`;
    const name = lang === "es" ? group.nameEs || group.name : group.name;
    return `<div${media}><div class="color_banner"><div class="home__slider--wrap wrap"><span>${index + 1}</span><span>${esc(name)}</span><span><a style="color:#fff" href="/${kind}/${encodeURIComponent(group.slug)}${langSuffix}">${esc(seeMore)}</a></span></div></div></div>`;
  }).join("");
  return intro + items;
}

function renderTestimonials(items: HomeTestimonial[], lang: Lang): string {
  const published = items
    .filter((item) => item.published !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const featured = published.filter((item) => item.isFeatured);
  const visible = featured.length ? featured : published;
  return visible.map((item) => {
    const quote = lang === "es" ? item.quoteEs || item.quote : item.quote;
    const source = lang === "es" ? item.sourceEs || item.source || item.authorName : item.source || item.authorName;
    const field = lang === "es" ? "quoteEs" : "quote";
    const sourceField = lang === "es" ? "sourceEs" : "source";
    const attr = (attrs: Record<string, string>) => Object.entries(attrs).map(([key, value]) => ` ${key}="${escAttr(value)}"`).join("");
    return `<div class="home__intro--item"><div${attr(typographyAttribute(item.typography, field, lang))}><p>“${esc(quote).replace(/^\s*[“\"]|[”\"]\s*$/g, "")}”</p></div><div${attr(typographyAttribute(item.typography, sourceField, lang))}>—${esc(source)}</div></div>`;
  }).join("");
}

function renderNewsletter(config: ConfigMap, lang: Lang): string {
  const fallback = lang === "es"
    ? {
        eyebrow: "",
        name: "Nombre",
        email: "Correo electrónico",
        company: "Empresa",
        privacy: "He leído y acepto el",
        privacyLink: "Aviso de Privacidad",
        privacyPath: "/aviso",
        required: "Completa los campos obligatorios y acepta el Aviso de Privacidad.",
      }
    : {
        eyebrow: "",
        name: "Name",
        email: "Email address",
        company: "Company",
        privacy: "I have read and accept the",
        privacyLink: "Privacy Notice",
        privacyPath: "/privacy",
        required: "Please complete the required fields and accept the Privacy Notice.",
      };
  const configuredEyebrow = cfg(config, "newsletter_eyebrow", lang).trim();
  // Compatibilidad con bases que todavía conservan la etiqueta sembrada
  // anteriormente. El bloque se oculta de inmediato aun antes de ejecutar la
  // migración; cualquier etiqueta distinta escrita desde el panel se muestra.
  const eyebrow = /^newsletter$/i.test(configuredEyebrow) ? "" : configuredEyebrow;
  const copy = {
    eyebrow: eyebrow || fallback.eyebrow,
    name: cfg(config, "newsletter_name_label", lang) || fallback.name,
    email: cfg(config, "newsletter_email_label", lang) || fallback.email,
    company: cfg(config, "newsletter_company_label", lang) || fallback.company,
    privacy: cfg(config, "newsletter_privacy_intro", lang) || fallback.privacy,
    privacyLink: cfg(config, "newsletter_privacy_link", lang) || fallback.privacyLink,
    privacyPath: safeHref(cfg(config, "newsletter_privacy_path", lang), fallback.privacyPath),
    required: cfg(config, "newsletter_required", lang) || fallback.required,
  };
  const title = cfg(config, "newsletter_title", lang) || (lang === "es" ? "Suscríbete" : "Subscribe");
  const configuredDescription = cfg(config, "newsletter_description", lang);
  const legacyDescription = lang === "es"
    ? "Recibe en tu correo análisis jurídicos, publicaciones y novedades de Von Wobeser y Sierra."
    : "Receive legal analysis, publications and news from Von Wobeser y Sierra directly in your inbox.";
  const defaultDescription = lang === "es"
    ? "Mantente al día sobre los cambios legales y regulatorios relevantes para tu negocio."
    : "Stay up to date on legal and regulatory changes relevant to your business.";
  const description = !configuredDescription || configuredDescription === legacyDescription
    ? defaultDescription
    : configuredDescription;
  const cta = cfg(config, "newsletter_cta", lang) || (lang === "es" ? "SUSCRIBIRME" : "SUBSCRIBE");
  const success = cfg(config, "newsletter_success", lang) || (lang === "es" ? "Gracias. Hemos recibido tu suscripción." : "Thank you. Your subscription has been received.");
  const error = cfg(config, "newsletter_error", lang) || (lang === "es" ? "No pudimos procesar tu solicitud. Inténtalo de nuevo." : "We could not process your request. Please try again.");

  return `
    <section class="home__newsletter vw-newsletter--compact fade_JS" id="newsletter" aria-labelledby="newsletter-title">
      <div class="home__newsletter--wrap wrap">
        <div class="home__newsletter--intro">
          ${copy.eyebrow ? `<p class="home__newsletter--eyebrow">${esc(copy.eyebrow)}</p>` : ""}
          <h2 id="newsletter-title">${esc(title)}</h2>
          <p class="home__newsletter--description">${esc(description)}</p>
        </div>
        <form id="vw-newsletter-form" class="home__newsletter--form" data-language="${lang}" data-success="${escAttr(success)}" data-error="${escAttr(error)}" data-required="${escAttr(copy.required)}" novalidate>
          <div class="home__newsletter--field home__newsletter--field--half">
            <label for="newsletter-name">${esc(copy.name)}</label>
            <input id="newsletter-name" name="name" type="text" autocomplete="name" required maxlength="120">
          </div>
          <div class="home__newsletter--field home__newsletter--field--half">
            <label for="newsletter-email">${esc(copy.email)}</label>
            <input id="newsletter-email" name="email" type="email" autocomplete="email" required maxlength="254">
          </div>
          <div class="home__newsletter--field home__newsletter--field--full">
            <label for="newsletter-company">${esc(copy.company)}</label>
            <input id="newsletter-company" name="company" type="text" autocomplete="organization" required maxlength="160">
          </div>
          <label class="home__newsletter--privacy" for="newsletter-privacy">
            <input id="newsletter-privacy" name="acceptPrivacy" type="checkbox" required>
            <span>${esc(copy.privacy)} <a href="${escAttr(copy.privacyPath)}">${esc(copy.privacyLink)}</a>.</span>
          </label>
          <div class="home__newsletter--actions">
            <button type="submit"><span>${esc(cta)}</span><span aria-hidden="true">→</span></button>
            <p class="home__newsletter--feedback" aria-live="polite" hidden></p>
          </div>
        </form>
      </div>
    </section>
    <style>
      .home__newsletter.vw-newsletter--compact{box-sizing:border-box;min-height:0;height:auto;background:#f1f1ef;color:#5f5f5d;padding:clamp(2.35rem,3.8vw,3.4rem) 0}
      .home__newsletter.vw-newsletter--compact .home__newsletter--wrap{display:grid;grid-template-columns:minmax(15rem,.7fr) minmax(34rem,1.3fr);gap:clamp(2.5rem,5vw,5.25rem);align-items:center}
      .vw-newsletter--compact .home__newsletter--intro{align-self:center}
      .vw-newsletter--compact .home__newsletter--eyebrow{margin:0 0 .65rem;color:#b11d35;font-family:var(--vw-font-ui);font-size:.72rem;font-weight:500;letter-spacing:.13em;text-transform:uppercase}
      .vw-newsletter--compact h2{margin:0;max-width:12ch;color:#5f5f5d;font-family:var(--vw-font-editorial);font-size:clamp(2.35rem,3.3vw,3.25rem);font-weight:400;line-height:1.02}
      .vw-newsletter--compact .home__newsletter--description{max-width:30rem;margin:.85rem 0 0;color:#5f5f5d;font-family:var(--vw-font-body);font-size:.96rem;line-height:1.5}
      .home__newsletter.vw-newsletter--compact .home__newsletter--form{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));column-gap:.8rem;row-gap:.9rem;padding:0}
      .vw-newsletter--compact .home__newsletter--field{display:grid;gap:.38rem;min-width:0}
      .vw-newsletter--compact .home__newsletter--field--full{grid-column:auto}
      .vw-newsletter--compact .home__newsletter--field label{color:#595957;font-family:var(--vw-font-ui);font-size:.74rem;font-weight:500;letter-spacing:.025em}
      .home__newsletter.vw-newsletter--compact .home__newsletter--field input{display:block;width:100%;min-height:3rem;height:3rem;box-sizing:border-box;border:1px solid #c7c7c3;border-bottom:1px solid #c7c7c3;border-radius:0;background:#fafaf8;color:#454543;font-family:var(--vw-font-ui);font-size:.95rem;line-height:1.35;padding:.68rem .82rem;outline:0;box-shadow:none;transition:border-color .18s ease,box-shadow .18s ease,background-color .18s ease}
      .vw-newsletter--compact .home__newsletter--field input:hover{border-color:#a5a5a1}
      .home__newsletter.vw-newsletter--compact .home__newsletter--field input:focus{border-color:#a5102a;background:#fff;box-shadow:inset 0 0 0 1px #a5102a}
      .vw-newsletter--compact .home__newsletter--privacy{grid-column:1/3;display:flex;align-items:center;gap:.65rem;min-height:3rem;margin:0;color:#50504e;font-family:var(--vw-font-ui);font-size:.91rem;letter-spacing:0;line-height:1.4}
      .vw-newsletter--compact .home__newsletter--privacy input{width:20px;height:20px;flex:0 0 20px;margin:0;accent-color:#b11d35}
      .vw-newsletter--compact .home__newsletter--privacy a{color:#a5102a;font-weight:500;text-decoration:underline;text-decoration-color:#a5102a;text-decoration-thickness:1.5px;text-underline-offset:.2em}
      .vw-newsletter--compact .home__newsletter--actions{grid-column:3;display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:.7rem;margin:0}
      .vw-newsletter--compact .home__newsletter--actions button{display:inline-flex;align-items:center;justify-content:center;gap:1rem;min-height:3rem;border:1px solid #b11d35;background:#b11d35;color:#fff;cursor:pointer;font-family:var(--vw-font-ui);font-size:.73rem;font-weight:500;letter-spacing:.09em;padding:0 1.15rem;text-transform:uppercase;transition:background-color .18s ease,transform .18s ease}
      .vw-newsletter--compact .home__newsletter--actions button span:last-child{font-size:1.1rem;line-height:1;transition:transform .18s ease}
      .vw-newsletter--compact .home__newsletter--actions button:hover,.vw-newsletter--compact .home__newsletter--actions button:focus-visible{background:#9f1830}
      .vw-newsletter--compact .home__newsletter--actions button:hover span:last-child,.vw-newsletter--compact .home__newsletter--actions button:focus-visible span:last-child{transform:translateX(3px)}
      .vw-newsletter--compact .home__newsletter--actions button:active{transform:translateY(1px)}
      .vw-newsletter--compact .home__newsletter--actions button:disabled{cursor:wait;opacity:.7}
      .vw-newsletter--compact .home__newsletter--feedback{flex-basis:100%;margin:0;font-family:var(--vw-font-ui);font-size:.84rem;line-height:1.35}
      .vw-newsletter--compact .home__newsletter--feedback[data-state=error]{color:#a0102b}
      .vw-newsletter--compact .home__newsletter--feedback[data-state=success]{color:#38563d}
      .vw-newsletter--compact input:focus-visible,.vw-newsletter--compact button:focus-visible,.vw-newsletter--compact a:focus-visible{outline:2px solid #b11d35;outline-offset:3px}
      @media(max-width:1100px){.home__newsletter.vw-newsletter--compact .home__newsletter--wrap{grid-template-columns:minmax(14rem,.75fr) minmax(25rem,1.25fr);gap:2.5rem}.home__newsletter.vw-newsletter--compact .home__newsletter--form{grid-template-columns:repeat(2,minmax(0,1fr))}.vw-newsletter--compact .home__newsletter--field--full,.vw-newsletter--compact .home__newsletter--privacy,.vw-newsletter--compact .home__newsletter--actions{grid-column:1/-1}.vw-newsletter--compact .home__newsletter--actions{justify-content:flex-start}}
      @media(max-width:760px){.home__newsletter.vw-newsletter--compact{padding:2.6rem 0}.home__newsletter.vw-newsletter--compact .home__newsletter--wrap{grid-template-columns:1fr;gap:1.75rem}.vw-newsletter--compact .home__newsletter--intro{max-width:34rem}.vw-newsletter--compact h2{font-size:clamp(2.3rem,9vw,3.15rem)}.vw-newsletter--compact .home__newsletter--description{margin-top:.75rem}.home__newsletter.vw-newsletter--compact .home__newsletter--form{grid-template-columns:1fr;row-gap:.9rem}.vw-newsletter--compact .home__newsletter--field--full,.vw-newsletter--compact .home__newsletter--privacy,.vw-newsletter--compact .home__newsletter--actions{grid-column:auto}.vw-newsletter--compact .home__newsletter--actions{align-items:stretch;flex-direction:column}.vw-newsletter--compact .home__newsletter--actions button{width:100%}.vw-newsletter--compact .home__newsletter--privacy{font-size:.9rem}}
      @media(prefers-reduced-motion:reduce){.vw-newsletter--compact .home__newsletter--field input,.vw-newsletter--compact .home__newsletter--actions button,.vw-newsletter--compact .home__newsletter--actions button span:last-child{transition:none}}
    </style>
    <script>
      (function(){
        if(window.__vwNewsletterListener)return;window.__vwNewsletterListener=true;
        document.addEventListener('submit',async function(event){
          var form=event.target;if(!form||form.id!=='vw-newsletter-form')return;event.preventDefault();
          var feedback=form.querySelector('.home__newsletter--feedback');var submit=form.querySelector('button[type="submit"]');
          var show=function(message,state){feedback.textContent=message;feedback.dataset.state=state;feedback.hidden=false;};
          if(!form.checkValidity()){form.reportValidity();show(form.dataset.required,'error');return;}
          submit.disabled=true;var original=submit.innerHTML;submit.setAttribute('aria-busy','true');
          try{var response=await fetch('/api/newsletter/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:form.elements.name.value,email:form.elements.email.value,company:form.elements.company.value,acceptPrivacy:form.elements.acceptPrivacy.checked,language:form.dataset.language})});if(!response.ok)throw new Error('subscribe');form.reset();show(form.dataset.success,'success');}
          catch(_error){show(form.dataset.error,'error');}
          finally{submit.disabled=false;submit.removeAttribute('aria-busy');submit.innerHTML=original;}
        });
      })();
    </script>`;
}

function renderHeroNewsCarousel(news: any[], config: ConfigMap, lang: Lang): string {
  const langSuffix = lang === "en" ? "?lang=en" : "";
  const fallback = lang === "es"
    ? {
        title: "Noticias", seeMore: "VER MÁS", previous: "Noticias anteriores", next: "Siguientes noticias",
        minimize: "Minimizar noticias", expand: "Mostrar noticias", position: "Grupo de noticias",
      }
    : {
        title: "News", seeMore: "SEE MORE", previous: "Previous news", next: "Next news",
        minimize: "Minimize news", expand: "Show news", position: "News group",
      };
  const copy = {
    title: cfg(config, "home_news_title", lang) || fallback.title,
    seeMore: cfg(config, "home_news_more", lang) || fallback.seeMore,
    previous: cfg(config, "home_news_previous", lang) || fallback.previous,
    next: cfg(config, "home_news_next", lang) || fallback.next,
    minimize: cfg(config, "home_news_minimize", lang) || fallback.minimize,
    expand: cfg(config, "home_news_expand", lang) || fallback.expand,
    position: fallback.position,
  };
  const configuredPages = Number.parseInt(cfg(config, "home_news_pages", "en"), 10);
  const pageCount = Number.isFinite(configuredPages) ? Math.min(10, Math.max(1, configuredPages)) : 5;
  const stories = news
    .filter((item) => hasCompatibleLocalizedNewsTitle(item, lang))
    .slice(0, pageCount * 2);
  const slides: string[] = [];
  for (let index = 0; index < stories.length; index += 2) {
    const cards = stories.slice(index, index + 2).map((item) => {
      const title = lang === "es" ? item.titleEs : item.title;
      return `<article class="news_item"><a class="vw-news-carousel__headline" href="/news/${esc(item.slug)}${langSuffix}"><h3>${esc(title)}</h3></a><a class="vw-news-carousel__more" href="/news${langSuffix}"><span>${copy.seeMore}</span></a></article>`;
    }).join("");
    slides.push(`<div class="vw-news-carousel__slide${index === 0 ? " is-active" : ""}" data-vw-news-slide aria-hidden="${index === 0 ? "false" : "true"}">${cards}</div>`);
  }
  if (!slides.length) return "";

  return `<div class="vw-news-carousel" data-vw-news-carousel role="region" aria-roledescription="carousel" aria-label="${escAttr(copy.title)}"><div class="vw-news-carousel__slides">${slides.join("")}</div><div class="vw-news-carousel__nav"${slides.length === 1 ? " hidden" : ""}><button type="button" data-vw-news-prev aria-label="${escAttr(copy.previous)}"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10.5 2.5 5 8l5.5 5.5"></path></svg></button><span class="vw-news-carousel__count" data-vw-news-count aria-live="polite">1 / ${slides.length}</span><button type="button" data-vw-news-next aria-label="${escAttr(copy.next)}"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m5.5 2.5L11 8l-5.5 5.5"></path></svg></button></div><button class="vw-news-carousel__toggle" type="button" data-vw-news-toggle aria-label="${escAttr(copy.minimize)}" aria-expanded="true"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 6.5 8 11l5-4.5"></path></svg><span class="sr-only" data-vw-news-toggle-label>${esc(copy.minimize)}</span></button></div>`;
}

const HERO_NEWS_CAROUSEL_STYLE = `<style id="vw-news-carousel-style">
  .covid_cont.vw-news-panel{box-sizing:border-box;min-height:300px;padding:13px 15px 60px;border-radius:7px;box-shadow:0 14px 34px rgba(42,42,40,.1);overflow:hidden;transform-origin:top left}.covid_cont.vw-news-panel .covid_title{padding:0 48px 10px}.covid_cont.vw-news-panel .covid_title h2{margin:0}.covid_cont.vw-news-panel .covid_headlines{margin-top:18px}.vw-news-carousel{position:relative}.vw-news-carousel .sr-only{height:1px;margin:-1px;overflow:hidden;position:absolute;width:1px;clip:rect(0,0,0,0);white-space:nowrap}.vw-news-carousel__slides{min-height:206px}.vw-news-carousel__slide{display:none;grid-template-columns:minmax(0,1fr) minmax(0,1fr);min-height:206px;animation:vw-news-in .32s cubic-bezier(.16,1,.3,1) both}.vw-news-carousel__slide.is-active{display:grid}.vw-news-carousel .news_item{display:flex;float:none;width:auto;min-width:0;flex-direction:column;font-size:16px;padding:0 20px 0 0}.vw-news-carousel .news_item+.news_item{border-left:1px solid #969696;margin-left:0;padding:0 0 0 20px}.vw-news-carousel .news_item h3{display:-webkit-box;overflow:hidden;color:#666;font-family:var(--vw-font-editorial);font-size:18px;font-weight:500;letter-spacing:normal;line-height:1.27;margin:0;padding:0;-webkit-box-orient:vertical;-webkit-line-clamp:6}.vw-news-carousel__headline{color:inherit;text-decoration:none}.vw-news-carousel__headline:focus-visible,.vw-news-carousel__more:focus-visible,.vw-news-carousel__nav button:focus-visible,.vw-news-carousel__toggle:focus-visible{outline:2px solid #ac162c;outline-offset:3px}.covid_headlines .vw-news-carousel .news_item>a.vw-news-carousel__more{align-self:flex-end;border:0;color:#666;display:inline-flex;font-family:var(--vw-font-ui);font-size:13px;letter-spacing:.04em;margin-top:auto;min-height:44px;padding:15px 0 0;white-space:normal;text-decoration:none}.vw-news-carousel__more span{float:none!important;position:static!important;width:auto!important;text-align:left!important}.covid_headlines .vw-news-carousel .news_item>a.vw-news-carousel__more>span::after{content:none}.covid_headlines .vw-news-carousel .news_item>a.vw-news-carousel__more::after{content:"→";display:inline-block;margin-left:.45em;transition:transform .2s cubic-bezier(.16,1,.3,1)}.vw-news-carousel__more:hover{text-decoration:underline}.vw-news-carousel__more:hover::after,.vw-news-carousel__more:focus-visible::after{transform:translateX(3px)}.vw-news-carousel__nav{align-items:center;bottom:-47px;display:flex;gap:3px;position:absolute;right:0}.vw-news-carousel__nav button,.vw-news-carousel__toggle{align-items:center;background:transparent;border:0;color:#777;cursor:pointer;display:inline-flex;justify-content:center;padding:4px}.vw-news-carousel__nav button{height:44px;width:44px}.vw-news-carousel__nav button svg,.vw-news-carousel__toggle svg{fill:none;height:15px;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round;stroke-width:1.5;width:15px}.vw-news-carousel__nav button:hover,.vw-news-carousel__toggle:hover{color:#ac162c}.vw-news-carousel__count{color:#888;font-family:var(--vw-font-ui);font-size:11px;letter-spacing:.08em;min-width:31px;text-align:center}.vw-news-carousel__toggle{height:44px;position:absolute;right:0;top:-55px;width:44px}.vw-news-carousel__toggle svg{transition:transform .34s cubic-bezier(.16,1,.3,1)}.covid_cont.vw-news-panel--minimized{min-height:0;padding:13px 15px;width:190px}.covid_cont.vw-news-panel--minimized .covid_title{border-bottom:0;padding:0 42px 0 0}.covid_cont.vw-news-panel--minimized .covid_title span{font-size:21px}.covid_cont.vw-news-panel--minimized .covid_headlines{display:none}.covid_cont.vw-news-panel--minimized .vw-news-carousel__toggle{top:-45px}.covid_cont.vw-news-panel--minimized .vw-news-carousel__toggle svg{transform:rotate(180deg)}@keyframes vw-news-in{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:translateX(0)}}@media(max-width:800px){.covid_cont.vw-news-panel{min-height:0;padding-bottom:56px}.vw-news-carousel__slides,.vw-news-carousel__slide{min-height:0}.vw-news-carousel__slide{grid-template-columns:1fr;gap:19px}.vw-news-carousel .news_item{min-height:116px;padding:0}.vw-news-carousel .news_item+.news_item{border-left:0;border-top:1px solid #969696;margin:0;padding:19px 0 0}.vw-news-carousel .news_item h3{-webkit-line-clamp:4}.vw-news-carousel__nav{bottom:-47px}.covid_cont.vw-news-panel--minimized{width:190px}.covid_cont.vw-news-panel--minimized .covid_headlines{display:none}}@media(prefers-reduced-motion:reduce){.vw-news-carousel__slide{animation:none}.vw-news-carousel__more::after,.vw-news-carousel__toggle svg{transition:none}}
</style><style id="vw-news-carousel-toggle-style">
  .covid_cont.vw-news-panel .covid_title{position:relative;}
  .covid_cont.vw-news-panel .covid_headlines .vw-news-carousel__toggle{display:none;}
  .covid_cont.vw-news-panel>.vw-news-panel__toggle{display:inline-flex;position:absolute;right:15px;top:10px;z-index:2;}
  .covid_cont.vw-news-panel.vw-news-panel--minimized>.vw-news-panel__toggle{top:10px;}
  .vw-news-panel .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}
  @media(max-width:767px){.covid_cont.vw-news-panel>.vw-news-panel__toggle{top:10px;}}
</style><style id="vw-news-carousel-responsive-style">
  /* El panel grande conserva sus proporciones. En laptops se compacta por
     ancho O por altura disponible, porque 450x300px ocupa demasiado del hero
     en pantallas 1366x768 aunque el viewport siga siendo "desktop". */
  @media (min-width:801px) and (max-width:1439px), (min-width:801px) and (max-height:819px) {
    .covid_cont.vw-news-panel:not(.vw-news-panel--minimized){
      width:clamp(360px,30vw,400px);
      min-height:245px;
      padding:10px 13px 48px;
    }
    .covid_cont.vw-news-panel:not(.vw-news-panel--minimized) .covid_title{padding:0 44px 8px;}
    .covid_cont.vw-news-panel:not(.vw-news-panel--minimized) .covid_title span{
      font-size:clamp(22px,1.8vw,24px);
      line-height:1.05;
    }
    .covid_cont.vw-news-panel:not(.vw-news-panel--minimized) .covid_headlines{margin-top:10px;}
    .covid_cont.vw-news-panel:not(.vw-news-panel--minimized) .vw-news-carousel__slides,
    .covid_cont.vw-news-panel:not(.vw-news-panel--minimized) .vw-news-carousel__slide{min-height:148px;}
    .covid_cont.vw-news-panel:not(.vw-news-panel--minimized) .vw-news-carousel .news_item{padding-right:15px;}
    .covid_cont.vw-news-panel:not(.vw-news-panel--minimized) .vw-news-carousel .news_item+.news_item{padding-left:15px;padding-right:0;}
    .covid_cont.vw-news-panel:not(.vw-news-panel--minimized) .vw-news-carousel .news_item h3{
      font-size:clamp(15px,1.15vw,16px);
      line-height:1.24;
      -webkit-line-clamp:4;
    }
    .covid_cont.vw-news-panel:not(.vw-news-panel--minimized) .covid_headlines .vw-news-carousel .news_item>a.vw-news-carousel__more{font-size:12px;padding-top:6px;}
    .covid_cont.vw-news-panel:not(.vw-news-panel--minimized) .vw-news-carousel__nav{bottom:-43px;}
  }

  /* Tablet y móvil conservan ambas noticias en dos columnas compactas: así el
     panel no crece verticalmente ni obliga a ocultar la segunda noticia. */
  @media (max-width:800px) {
    .covid_cont.vw-news-panel:not(.vw-news-panel--minimized){
      box-sizing:border-box;
      width:100%;
      min-height:0;
      padding:9px 14px 48px;
    }
    .covid_cont.vw-news-panel:not(.vw-news-panel--minimized) .covid_title{padding:0 44px 8px;}
    .covid_cont.vw-news-panel:not(.vw-news-panel--minimized) .covid_title span{font-size:22px;line-height:1.05;}
    .covid_cont.vw-news-panel:not(.vw-news-panel--minimized) .covid_headlines{margin-top:9px;}
    .covid_cont.vw-news-panel:not(.vw-news-panel--minimized) .vw-news-carousel__slide{
      grid-template-columns:minmax(0,1fr) minmax(0,1fr);
      gap:0;
    }
    .covid_cont.vw-news-panel:not(.vw-news-panel--minimized) .vw-news-carousel .news_item{min-height:92px;padding:0 13px 0 0;}
    .covid_cont.vw-news-panel:not(.vw-news-panel--minimized) .vw-news-carousel .news_item:nth-child(2){display:flex;}
    .covid_cont.vw-news-panel:not(.vw-news-panel--minimized) .vw-news-carousel .news_item+.news_item{
      border-left:1px solid #969696;
      border-top:0;
      padding:0 0 0 13px;
    }
    .covid_cont.vw-news-panel:not(.vw-news-panel--minimized) .vw-news-carousel .news_item h3{
      font-size:15px;
      line-height:1.25;
      -webkit-line-clamp:3;
    }
    .covid_cont.vw-news-panel:not(.vw-news-panel--minimized) .covid_headlines .vw-news-carousel .news_item>a.vw-news-carousel__more{font-size:12px;padding-top:5px;}
    .covid_cont.vw-news-panel:not(.vw-news-panel--minimized) .vw-news-carousel__nav{bottom:-43px;}
  }

  @media (max-width:430px) {
    .covid_cont.vw-news-panel:not(.vw-news-panel--minimized){padding:8px 12px 46px;}
    .covid_cont.vw-news-panel:not(.vw-news-panel--minimized) .covid_title{padding-bottom:7px;}
    .covid_cont.vw-news-panel:not(.vw-news-panel--minimized) .covid_title span{font-size:21px;}
    .covid_cont.vw-news-panel:not(.vw-news-panel--minimized) .covid_headlines{margin-top:8px;}
    .covid_cont.vw-news-panel:not(.vw-news-panel--minimized) .vw-news-carousel .news_item{min-height:84px;padding-right:10px;}
    .covid_cont.vw-news-panel:not(.vw-news-panel--minimized) .vw-news-carousel .news_item+.news_item{padding-left:10px;padding-right:0;}
    .covid_cont.vw-news-panel:not(.vw-news-panel--minimized) .vw-news-carousel .news_item h3{font-size:14px;}
  }
</style>`;

const HERO_NEWS_CAROUSEL_SCRIPT = `<script id="vw-news-carousel-script">
  (function(){
    if(window.__vwHeroNewsCarousel)return;window.__vwHeroNewsCarousel=true;
    document.querySelectorAll('[data-vw-news-carousel]').forEach(function(root){
      var panel=root.closest('.covid_cont'),slides=Array.prototype.slice.call(root.querySelectorAll('[data-vw-news-slide]')),prev=root.querySelector('[data-vw-news-prev]'),next=root.querySelector('[data-vw-news-next]'),toggle=panel&&panel.querySelector('.vw-news-panel__toggle'),count=root.querySelector('[data-vw-news-count]'),toggleLabel=toggle&&toggle.querySelector('[data-vw-news-toggle-label]');
      if(!panel||!slides.length)return;var index=0,timer=null,panelMotion=null,paused=false,reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches,key='vw-news-panel-minimized';
      function show(nextIndex){index=(nextIndex+slides.length)%slides.length;slides.forEach(function(slide,slideIndex){var active=slideIndex===index;slide.classList.toggle('is-active',active);slide.setAttribute('aria-hidden',active?'false':'true');});if(count)count.textContent=(index+1)+' / '+slides.length;}
      function stop(){if(timer){window.clearInterval(timer);timer=null;}}
      function start(){stop();if(slides.length>1&&!paused&&!reduced)timer=window.setInterval(function(){show(index+1);},7000);}
      function animatePanel(first){if(!first||reduced||typeof panel.animate!=='function')return;var last=panel.getBoundingClientRect();if(!last.width||!last.height)return;if(panelMotion)panelMotion.cancel();var dx=first.left-last.left,dy=first.top-last.top,sx=first.width/last.width,sy=first.height/last.height;panel.style.willChange='transform';panelMotion=panel.animate([{transform:'translate('+dx+'px,'+dy+'px) scale('+sx+','+sy+')',opacity:.96},{transform:'translate(0,0) scale(1,1)',opacity:1}],{duration:420,easing:'cubic-bezier(.16,1,.3,1)'});var current=panelMotion;var clean=function(){if(panelMotion===current){panelMotion=null;panel.style.willChange='';}};current.onfinish=clean;current.oncancel=clean;}
      function setMinimized(value,withMotion){var first=withMotion&&!reduced?panel.getBoundingClientRect():null;panel.classList.toggle('vw-news-panel--minimized',value);toggle.setAttribute('aria-expanded',String(!value));toggle.setAttribute('aria-label',value?(root.getAttribute('data-expand-label')||'Show news'):(root.getAttribute('data-minimize-label')||'Minimize news'));if(toggleLabel)toggleLabel.textContent=toggle.getAttribute('aria-label');animatePanel(first);try{localStorage.setItem(key,value?'1':'0');}catch(_error){}if(value)stop();else start();}
      try{setMinimized(localStorage.getItem(key)==='1',false);}catch(_error){setMinimized(false,false);}show(0);
      if(prev)prev.addEventListener('click',function(){show(index-1);start();});if(next)next.addEventListener('click',function(){show(index+1);start();});if(toggle)toggle.addEventListener('click',function(){setMinimized(!panel.classList.contains('vw-news-panel--minimized'),true);});
      root.addEventListener('mouseenter',function(){paused=true;stop();});root.addEventListener('mouseleave',function(){paused=false;start();});root.addEventListener('focusin',function(){paused=true;stop();});root.addEventListener('focusout',function(event){if(!root.contains(event.relatedTarget)){paused=false;start();}});document.addEventListener('visibilitychange',function(){if(document.hidden)stop();else start();});start();
    });
  })();
</script>`;

/**
 * Serves the original mirror home, injecting backend-editable content:
 * latest news (hero overlay), hero video, and the red-banner texts (siteConfig).
 */
export function renderHome(
  templateHtml: string,
  news: any[],
  config: ConfigMap,
  lang: Lang = "en",
  rankings: any[] = [],
  practices: HomeGroup[] = [],
  industries: HomeGroup[] = [],
  testimonials: HomeTestimonial[] = [],
): string {
  const $ = cheerio.load(templateHtml);
  const seeMore = lang === "es" ? "VER MÁS" : "SEE MORE";
  const newsTitle = cfg(config, "home_news_title", lang) || (lang === "es" ? "Noticias" : "News");
  const newsMinimize = cfg(config, "home_news_minimize", lang) || (lang === "es" ? "Minimizar noticias" : "Minimize news");
  const newsExpand = cfg(config, "home_news_expand", lang) || (lang === "es" ? "Mostrar noticias" : "Show news");

  // --- Hero news overlay (latest news in pairs) -------------------------
  const carousel = renderHeroNewsCarousel(news, config, lang);
  if (carousel) {
    $(".covid_cont").addClass("vw-news-panel");
    $(".covid_title h2 span").text(newsTitle);
    $(".covid_headlines").html(carousel);
    const root = $(".covid_headlines [data-vw-news-carousel]");
    root.attr("data-minimize-label", newsMinimize);
    root.attr("data-expand-label", newsExpand);
    $(".covid_cont").append(`<button class="vw-news-carousel__toggle vw-news-panel__toggle" type="button" data-vw-news-toggle aria-label="${escAttr(newsMinimize)}" aria-expanded="true"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 6.5 8 11l5-4.5"></path></svg><span class="sr-only" data-vw-news-toggle-label>${esc(newsMinimize)}</span></button>`);
    $("head").append(HERO_NEWS_CAROUSEL_STYLE);
    $("body").append(HERO_NEWS_CAROUSEL_SCRIPT);
  }

  // --- Hero video responsivo (editable via siteConfig) ------------------
  const legacyHeroVideos = new Set([
    "/images/dron_2026_40.mp4",
    "/images/home-hero-desktop-v1.mp4",
    "/images/home-hero-desktop-v2.mp4",
    "/images/hero-092c5875ed80af62-desktop.mp4",
  ]);
  const defaultDesktopVideo = "/images/hero-20260810-fullhd-desktop.mp4";
  const defaultMobileVideo = "/images/hero-20260810-fullhd-mobile.mp4";
  const configuredDesktop = parseVideoSource(cfg(config, "hero_video", lang));
  const desktopSource: VideoSource = !configuredDesktop
    || (configuredDesktop.kind === "file" && legacyHeroVideos.has(configuredDesktop.url))
    ? { kind: "file", url: defaultDesktopVideo }
    : configuredDesktop;
  const configuredMobile = parseVideoSource(cfg(config, "hero_video_mobile", lang));
  const legacyMobileVideos = new Set(["/images/home-hero-mobile-v1.mp4", "/images/home-hero-mobile-v2.mp4", "/images/hero-092c5875ed80af62-mobile.mp4"]);
  const mobileSource: VideoSource = !configuredMobile
    || (configuredMobile.kind === "file" && legacyMobileVideos.has(configuredMobile.url))
    ? (desktopSource.kind === "file" && desktopSource.url === defaultDesktopVideo
      ? { kind: "file", url: defaultMobileVideo }
      : desktopSource)
    : configuredMobile;
  const configuredPoster = safeMediaUrl(cfg(config, "hero_video_poster", lang));
  const legacyHeroPosters = new Set(["/images/home-hero-poster-v1.webp", "/images/home-hero-poster-v2.webp", "/images/hero-092c5875ed80af62-poster.webp"]);
  const heroPoster = !configuredPoster || legacyHeroPosters.has(configuredPoster)
    ? "/images/hero-20260810-fullhd-poster.webp"
    : configuredPoster;
  const videoElement = $("#video_header");
  const configuredHeroLink = cfg(config, "hero_practice_link", lang).trim();
  const fallbackHeroLink = lang === "es" ? "/acerca-de" : "/about";
  const legacyHeroLinks = new Set(["/practice/arbitration", "/nuestra-firma", "/our-firm"]);
  const heroLink = !configuredHeroLink || legacyHeroLinks.has(configuredHeroLink)
    ? fallbackHeroLink
    : safeHref(configuredHeroLink, fallbackHeroLink);
  const usesExternalPlayer = desktopSource.kind !== "file" || mobileSource.kind !== "file";
  if (usesExternalPlayer) {
    const desktopEmbed = buildVideoEmbedUrl(desktopSource, { autoplay: true, muted: true });
    const mobileEmbed = buildVideoEmbedUrl(mobileSource, { autoplay: true, muted: true });
    const playerTitle = lang === "es" ? "Video de portada de Von Wobeser y Sierra" : "Von Wobeser y Sierra homepage video";
    const playLabel = lang === "es" ? "Reproducir video de portada" : "Play homepage video";
    videoElement.parent("a").replaceWith(
      `<div class="vw-home-video-facade" data-vw-home-video-facade` +
      ` data-desktop-embed="${escAttr(desktopEmbed || "")}" data-mobile-embed="${escAttr(mobileEmbed || "")}"` +
      ` data-desktop-file="${escAttr(desktopSource.kind === "file" ? desktopSource.url : "")}"` +
      ` data-mobile-file="${escAttr(mobileSource.kind === "file" ? mobileSource.url : "")}"` +
      ` data-player-title="${escAttr(playerTitle)}">` +
      `<img class="vw-home-video-facade__poster" src="${escAttr(heroPoster)}" alt="" width="1920" height="1080" fetchpriority="high">` +
      `<button type="button" class="vw-home-video-facade__play" data-vw-home-video-play aria-label="${escAttr(playLabel)}"><span aria-hidden="true">▶</span></button>` +
      `</div>`,
    );
  } else {
    const mobileType = mobileSource.url.toLowerCase().split(/[?#]/, 1)[0].endsWith(".webm")
      ? "video/webm"
      : mobileSource.url.toLowerCase().split(/[?#]/, 1)[0].endsWith(".ogv")
        ? "video/ogg"
        : "video/mp4";
    const desktopType = desktopSource.url.toLowerCase().split(/[?#]/, 1)[0].endsWith(".webm")
      ? "video/webm"
      : desktopSource.url.toLowerCase().split(/[?#]/, 1)[0].endsWith(".ogv")
        ? "video/ogg"
        : "video/mp4";
    videoElement.empty()
      .append(`<source media="(max-width: 680px)" data-vwb-src="${escAttr(mobileSource.url)}" type="${mobileType}">`)
      .append(`<source data-vwb-src="${escAttr(desktopSource.url)}" type="${desktopType}">`);
    videoElement.parent("a").attr({
      href: heroLink,
      "aria-label": lang === "es" ? "Conoce Von Wobeser y Sierra" : "Discover Von Wobeser y Sierra",
    });
    videoElement.attr({
      width: "1920",
      height: "1080",
      preload: "metadata",
      poster: heroPoster,
      autoplay: "",
      muted: "",
      loop: "",
      playsinline: "",
    });
    const retryLabel = lang === "es" ? "Reproducir video" : "Play video";
    videoElement.parent("a").after(
      `<button type="button" class="vw-home-video-retry" data-vw-home-video-retry aria-label="${escAttr(retryLabel)}">` +
      `<span class="vw-home-video-retry__icon" aria-hidden="true">▶</span><span>${esc(retryLabel)}</span></button>`,
    );
  }
  const hero = $(".home__hero").first();
  const heroStyle = hero.attr("style") || "";
  if (/home-hero\.(?:jpg|webp)/.test(heroStyle)) {
    hero.attr("style", heroStyle.replace(/\/images\/home-hero\.(?:jpg|webp)/g, heroPoster));
  } else {
    hero.css("background-image", `url("${heroPoster}")`);
  }
  if ($(`link[rel="preload"][href="${heroPoster}"]`).length === 0) {
    $("head").append(`<link rel="preload" as="image" href="${escAttr(heroPoster)}" type="image/webp" fetchpriority="high">`);
  }
  $("head").append(HERO_PERFORMANCE_STYLE);
  $("body").append(HERO_PERFORMANCE_SCRIPT);

  // --- Frases editoriales de la portada -------------------------------
  const grayStatements = $(".home__gray--txt");
  const experience = cfg(config, "home_experience", lang);
  const teamStats = cfg(config, "home_team_stats", lang);
  const experienceBlock = grayStatements.eq(0).closest("section");
  const teamStatsBlock = grayStatements.eq(1).closest("section");
  const experienceVisible = isConfigEnabled(config, "home_experience_visible", false);
  if (experienceVisible) {
    if (experience) grayStatements.eq(0).html(`<p>${esc(experience)}</p>`);
  } else {
    experienceBlock.remove();
  }
  if (isConfigEnabled(config, "home_team_stats_visible", false)) {
    if (teamStats) grayStatements.eq(1).html(`<p>${esc(teamStats)}</p>`);
  } else {
    teamStatsBlock.remove();
  }

  // --- Carruseles editoriales del home (BD + panel) --------------------
  // Conservan exactamente las clases del espejo para que Slick y sus flechas sigan
  // funcionando. Nombre, traducción, orden, publicación e imagen vienen del panel.
  const homeSliders = $(".home_slider_JS");
  homeSliders.eq(0).attr({
    role: "region",
    "aria-roledescription": "carousel",
    "aria-label": lang === "es" ? "Prácticas" : "Practices",
  });
  homeSliders.eq(1).attr({
    role: "region",
    "aria-roledescription": "carousel",
    "aria-label": lang === "es" ? "Grupos de práctica por industria" : "Industry practice groups",
  });
  const industryCarouselSection = homeSliders.eq(1).closest("section");
  // Cuando la frase intermedia está oculta, mantenemos un corte editorial real
  // entre ambos carruseles. Es un elemento dentro del flujo del documento: no
  // se superpone sobre las imágenes ni depende de pseudo-elementos.
  $(".home__carousel-separator").remove();
  if (!experienceVisible && industryCarouselSection.length) {
    industryCarouselSection.before('<div class="home__carousel-separator" aria-hidden="true"></div>');
  }
  const practiceSlides = renderGroupSlider(practices, "practice", config, lang);
  const industrySlides = renderGroupSlider(industries, "industry", config, lang);
  if (practiceSlides) homeSliders.eq(0).html(practiceSlides);
  if (industrySlides) homeSliders.eq(1).html(industrySlides);

  const testimonialSlides = renderTestimonials(testimonials, lang);
  const testimonialCarousel = $(".home_intro_JS").attr({
    role: "region",
    "aria-roledescription": "carousel",
    "aria-label": lang === "es" ? "Testimonios" : "Testimonials",
  });
  if (testimonialSlides) testimonialCarousel.html(testimonialSlides);

  // --- Red banner texts (editable) --------------------------------------
  const bTitle = normalizeLegacyBannerTitle(cfg(config, "banner_title", lang), lang);
  const bSubtitle = cfg(config, "banner_subtitle", lang);
  if (bTitle || bSubtitle) {
    const seeMoreLink = $(".home__rojo--txt a").first().attr("href") || "/new-offices/index.html";
    $(".home__rojo--txt").html(
      `${bTitle ? `<h2 class="home__rojo--title">${esc(bTitle)}</h2>` : ""}` +
        `${bSubtitle ? `<p class="home__rojo--subtitle">${esc(bSubtitle)}</p>` : ""}` +
        `<p class="home__rojo--action"><a class="home__rojo--cta" href="${escAttr(seeMoreLink)}" target="_blank" rel="alternate noopener noreferrer">` +
        `<span>${seeMore}</span><span class="home__rojo--cta-arrow" aria-hidden="true">→</span></a></p>`,
    );
  }

  // El bloque heredado del Desk Alemán se sustituye en el mismo lugar del
  // recorrido de la portada. Los datos del Desk permanecen intactos en BD.
  $(".home__desk").replaceWith(renderNewsletter(config, lang));
  $(".desks__item").remove();

  // --- Reconocimientos de firma (editable: tabla rankings del panel) ----
  // El slider `.home__rec--slider` muestra logos de reconocimientos. Si el panel tiene
  // reconocimientos CON logo, se arma el slider desde ahí; si no, se deja el original.
  const withLogo = (rankings || []).filter((r) => r && (r.logoUrl || "").trim());
  $(".home_rec_JS").attr({
    role: "region",
    "aria-roledescription": "carousel",
    "aria-label": lang === "es" ? "Reconocimientos" : "Rankings and recognitions",
  });
  if (withLogo.length) {
    const slides = withLogo
      .map((r) => {
        const name = esc(lang === "es" ? r.nameEs || r.name : r.name);
        const img = `<img class="home__rec--item" src="${esc(r.logoUrl)}" alt="${name}" title="${name}" loading="lazy" decoding="async">`;
        return r.externalUrl ? `<a href="${esc(r.externalUrl)}" target="_blank" rel="noopener">${img}</a>` : img;
      })
      .join("");
    $(".home__rec--slider").html(slides);
  }

  // --- Secciones editoriales finales del home -------------------------
  const editorialSections = $("#bottom .home__rec");
  // Reconocimientos conserva la misma jerarquía editorial que Diversidad:
  // etiqueta institucional en Inter y texto principal en Gelasio.
  editorialSections.eq(0).addClass("home__rec--recognitions");
  const recognitionTitle = cfg(config, "home_recognitions_title", lang);
  const recognitionIntro = cfg(config, "home_recognitions_intro", lang);
  const recognitionBody = cfg(config, "home_recognitions_body", lang);
  if (recognitionTitle) editorialSections.eq(0).find(".home__rec--ttl").first().text(recognitionTitle);
  if (recognitionIntro) editorialSections.eq(0).find(".home__rec--top").first().html(paragraphs(recognitionIntro));
  const recognitionBodyElement = editorialSections.eq(0).find(".home__rec--txt").first();
  if (isConfigEnabled(config, "home_recognitions_body_visible", false)) {
    if (recognitionBody) recognitionBodyElement.html(paragraphs(recognitionBody));
  } else {
    recognitionBodyElement.remove();
  }

  const diversitySection = editorialSections.eq(1);
  if (isConfigEnabled(config, "home_diversity_visible", false)) {
    const diversityTitle = cfg(config, "home_diversity_title", lang);
    const diversityBody = cfg(config, "home_diversity_body", lang);
    if (diversityTitle) diversitySection.find(".home__rec--ttl").first().text(diversityTitle);
    if (diversityBody) diversitySection.find(".home__rec--top").first().html(paragraphs(diversityBody));
  } else {
    diversitySection.remove();
  }

  const proBonoSection = editorialSections.eq(2);
  if (isConfigEnabled(config, "home_probono_visible", false)) {
    const proBonoTitle = cfg(config, "home_probono_title", lang);
    const proBonoBody = cfg(config, "home_probono_body", lang);
    if (proBonoTitle) proBonoSection.find(".home__rec--ttl").first().text(proBonoTitle);
    if (proBonoBody) proBonoSection.find(".home__rec--top").first().html(paragraphs(proBonoBody));
  } else {
    proBonoSection.remove();
  }

  const about = $("#footer-sub > #footer > .home__rec--wrap").first();
  const aboutLabels = ["home_vision_label", "home_mission_label", "home_values_label"];
  const aboutBodies = ["home_vision_body", "home_mission_body", "home_values_body"];
  const legacyTitle = about.find(".home__rec--ttl").first().text().trim();
  const legacyLabels = about.find(".home__rec--top strong").map((_index, element) => $(element).text().trim()).get();
  const legacyBodies = about.find(".home__rec--txt").map((_index, element) => $(element).text().trim()).get();
  const aboutTitle = cfg(config, "home_about_title", lang) || legacyTitle;
  const labels = aboutLabels.map((key, index) => cfg(config, key, lang) || legacyLabels[index] || "");
  const bodies = aboutBodies.map((key, index) => cfg(config, key, lang) || legacyBodies[index] || "");
  const aboutLayout = cfg(config, "home_about_layout", lang).trim().toLowerCase() === "classic" ? "classic" : "editorial";

  if (aboutLayout === "classic") {
    if (aboutTitle) about.find(".home__rec--ttl").first().text(aboutTitle);
    about.find(".home__rec--top").each((index, element) => {
      const value = labels[index];
      if (value) $(element).find("strong").first().text(value);
    });
    about.find(".home__rec--txt").each((index, element) => {
      const value = bodies[index];
      if (value) $(element).html(paragraphs(value));
    });
  } else if (about.length) {
    about.replaceWith(renderHomeAboutEditorial({
      title: cfg(config, "home_about_editorial_title", lang) || (lang === "es" ? "Visión, misión y valores" : "Vision, mission and values"),
      intro: cfg(config, "home_about_editorial_intro", lang) || (lang === "es"
        ? "Los principios que guían nuestro trabajo y nuestra relación con los clientes."
        : "The principles that guide our work and our relationship with clients."),
      visionLabel: labels[0],
      visionBody: bodies[0],
      missionLabel: labels[1],
      missionBody: bodies[1],
      valuesLabel: labels[2],
      valuesBody: bodies[2],
    }));
  }

  if ($("[data-home-about-reveal]").length) {
    $("body").append(HOME_ABOUT_EDITORIAL_REVEAL_SCRIPT);
  }

  $("html").attr("lang", lang === "es" ? "es-mx" : "en-gb");
  applySeo($, {
    lang,
    path: "/",
    title:
      lang === "es"
        ? "Von Wobeser y Sierra — Firma de abogados líder en México"
        : "Von Wobeser y Sierra — Leading Law Firm in Mexico",
    type: "website",
  });
  return $.html();
}
