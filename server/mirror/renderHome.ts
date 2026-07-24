import * as cheerio from "cheerio";
import { cfg, type ConfigMap } from "./siteConfig";
import { applySeo } from "./seo";

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
  quote: string;
  quoteEs: string;
  authorName: string;
  source?: string | null;
  sourceEs?: string | null;
  order?: number | null;
  isFeatured?: boolean | null;
  published?: boolean | null;
};

function esc(s: any): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escAttr(s: any): string {
  return esc(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
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

function paragraphs(value: string): string {
  return value
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `<p>${esc(part).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function renderGroupSlider(groups: HomeGroup[], kind: "practice" | "industry", config: ConfigMap, lang: Lang): string {
  const visible = groups
    .filter((group) => group.published !== false && group.slug !== "german-desk")
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
  if (!visible.length) return "";

  const isPractice = kind === "practice";
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
    const style = image ? ` style="background-image:url('${escAttr(image)}')"` : ` style="background-color:#777"`;
    const name = lang === "es" ? group.nameEs || group.name : group.name;
    return `<div class="home__slider--item"${style}><div class="color_banner"><div class="home__slider--wrap wrap"><span>${index + 1}</span><span>${esc(name)}</span><span><a style="color:#fff" href="/${kind}/${encodeURIComponent(group.slug)}${langSuffix}">${esc(seeMore)}</a></span></div></div></div>`;
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
    return `<div class="home__intro--item"><div><p>“${esc(quote).replace(/^\s*[“\"]|[”\"]\s*$/g, "")}”</p></div><div>—${esc(source)}</div></div>`;
  }).join("");
}

function renderNewsletter(config: ConfigMap, lang: Lang): string {
  const fallback = lang === "es"
    ? {
        eyebrow: "Newsletter",
        name: "Nombre",
        email: "Correo electrónico",
        company: "Empresa",
        privacy: "He leído y acepto el",
        privacyLink: "Aviso de Privacidad",
        privacyPath: "/aviso",
        required: "Complete los campos obligatorios y acepte el Aviso de Privacidad.",
      }
    : {
        eyebrow: "Newsletter",
        name: "Name",
        email: "Email address",
        company: "Company",
        privacy: "I have read and accept the",
        privacyLink: "Privacy Notice",
        privacyPath: "/privacy",
        required: "Please complete the required fields and accept the Privacy Notice.",
      };
  const copy = {
    eyebrow: cfg(config, "newsletter_eyebrow", lang) || fallback.eyebrow,
    name: cfg(config, "newsletter_name_label", lang) || fallback.name,
    email: cfg(config, "newsletter_email_label", lang) || fallback.email,
    company: cfg(config, "newsletter_company_label", lang) || fallback.company,
    privacy: cfg(config, "newsletter_privacy_intro", lang) || fallback.privacy,
    privacyLink: cfg(config, "newsletter_privacy_link", lang) || fallback.privacyLink,
    privacyPath: cfg(config, "newsletter_privacy_path", lang) || fallback.privacyPath,
    required: cfg(config, "newsletter_required", lang) || fallback.required,
  };
  const title = cfg(config, "newsletter_title", lang) || (lang === "es" ? "Manténgase informado" : "Stay informed");
  const description = cfg(config, "newsletter_description", lang) || (lang === "es" ? "Reciba novedades legales, publicaciones y noticias de la firma directamente en su correo." : "Receive relevant legal updates, publications and firm news directly in your inbox.");
  const cta = cfg(config, "newsletter_cta", lang) || (lang === "es" ? "SUSCRIBIRME" : "SUBSCRIBE");
  const success = cfg(config, "newsletter_success", lang) || (lang === "es" ? "Gracias. Hemos recibido su suscripción." : "Thank you. Your subscription has been received.");
  const error = cfg(config, "newsletter_error", lang) || (lang === "es" ? "No pudimos procesar su solicitud. Inténtelo de nuevo." : "We could not process your request. Please try again.");

  return `
    <section class="home__newsletter fade_JS" aria-labelledby="newsletter-title">
      <div class="home__newsletter--wrap wrap">
        <div class="home__newsletter--intro">
          <p class="home__newsletter--eyebrow">${esc(copy.eyebrow)}</p>
          <h2 id="newsletter-title">${esc(title)}</h2>
          <p class="home__newsletter--description">${esc(description)}</p>
        </div>
        <form id="vw-newsletter-form" class="home__newsletter--form" data-language="${lang}" data-success="${escAttr(success)}" data-error="${escAttr(error)}" data-required="${escAttr(copy.required)}" novalidate>
          <div class="home__newsletter--field">
            <label for="newsletter-name">${esc(copy.name)}</label>
            <input id="newsletter-name" name="name" type="text" autocomplete="name" required maxlength="120">
          </div>
          <div class="home__newsletter--field">
            <label for="newsletter-email">${esc(copy.email)}</label>
            <input id="newsletter-email" name="email" type="email" autocomplete="email" required maxlength="254">
          </div>
          <div class="home__newsletter--field">
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
      .home__newsletter{background:#f1f1ef;color:#626262;padding:9.5rem 0 8.5rem}.home__newsletter--wrap{display:grid;grid-template-columns:minmax(0,4fr) minmax(21rem,5fr);gap:9vw;align-items:start}.home__newsletter--eyebrow{margin:0 0 1.5rem;color:#b11d35;font-family:Geomanist,Arial,sans-serif;font-size:.74rem;font-weight:600;letter-spacing:.13em;text-transform:uppercase}.home__newsletter h2{margin:0;max-width:10ch;color:#666;font-family:Publico,Georgia,serif;font-size:clamp(3rem,5.3vw,5.55rem);font-weight:400;line-height:.98}.home__newsletter--description{max-width:31rem;margin:2rem 0 0;color:#666;font-family:Geomanist,Arial,sans-serif;font-size:1.04rem;line-height:1.55}.home__newsletter--form{display:grid;gap:1.6rem;padding-top:.35rem}.home__newsletter--field{display:grid;gap:.55rem}.home__newsletter--field label,.home__newsletter--privacy{font-family:Geomanist,Arial,sans-serif;font-size:.78rem;letter-spacing:.04em}.home__newsletter--field input{width:100%;box-sizing:border-box;border:0;border-bottom:1px solid #8f8f8f;border-radius:0;background:transparent;color:#4f4f4f;font-family:Geomanist,Arial,sans-serif;font-size:1.2rem;line-height:1.35;padding:.45rem 0 .7rem;outline:0;transition:border-color .18s ease}.home__newsletter--field input:focus{border-color:#b11d35}.home__newsletter--privacy{display:flex;align-items:flex-start;gap:.7rem;margin-top:.15rem;color:#666;line-height:1.45}.home__newsletter--privacy input{margin:.16rem 0 0;accent-color:#b11d35}.home__newsletter--privacy a{color:inherit;text-decoration-color:#b11d35;text-underline-offset:.18em}.home__newsletter--actions{display:flex;align-items:center;flex-wrap:wrap;gap:1.2rem;margin-top:.8rem}.home__newsletter--actions button{display:inline-flex;align-items:center;gap:1.2rem;min-height:3.1rem;border:1px solid #b11d35;background:#b11d35;color:#fff;cursor:pointer;font-family:Geomanist,Arial,sans-serif;font-size:.76rem;font-weight:600;letter-spacing:.1em;padding:0 1.25rem;text-transform:uppercase}.home__newsletter--actions button span:last-child{font-size:1.2rem;line-height:1;transition:transform .18s ease}.home__newsletter--actions button:hover span:last-child,.home__newsletter--actions button:focus-visible span:last-child{transform:translateX(4px)}.home__newsletter--actions button:disabled{cursor:wait;opacity:.7}.home__newsletter--feedback{margin:0;font-family:Geomanist,Arial,sans-serif;font-size:.88rem;line-height:1.4}.home__newsletter--feedback[data-state=error]{color:#a0102b}.home__newsletter--feedback[data-state=success]{color:#38563d}.home__newsletter input:focus-visible,.home__newsletter button:focus-visible,.home__newsletter a:focus-visible{outline:2px solid #b11d35;outline-offset:4px}@media(max-width:760px){.home__newsletter{padding:5.5rem 0}.home__newsletter--wrap{grid-template-columns:1fr;gap:3.25rem}.home__newsletter h2{font-size:clamp(2.7rem,13vw,4.5rem)}.home__newsletter--description{margin-top:1.5rem}.home__newsletter--form{gap:1.4rem}}@media(prefers-reduced-motion:reduce){.home__newsletter--field input,.home__newsletter--actions button span:last-child{transition:none}}
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
  const stories = news.slice(0, 6);
  const slides: string[] = [];
  for (let index = 0; index < stories.length; index += 2) {
    const cards = stories.slice(index, index + 2).map((item) => {
      const title = lang === "es" ? item.titleEs || item.title : item.title;
      return `<article class="news_item"><a class="vw-news-carousel__headline" href="/news/${esc(item.slug)}${langSuffix}"><h3>${esc(title)}</h3></a><a class="vw-news-carousel__more" href="/news${langSuffix}"><span>${copy.seeMore}</span></a></article>`;
    }).join("");
    slides.push(`<div class="vw-news-carousel__slide${index === 0 ? " is-active" : ""}" data-vw-news-slide aria-hidden="${index === 0 ? "false" : "true"}">${cards}</div>`);
  }
  if (!slides.length) return "";

  return `<div class="vw-news-carousel" data-vw-news-carousel role="region" aria-roledescription="carousel" aria-label="${escAttr(copy.title)}"><div class="vw-news-carousel__slides">${slides.join("")}</div><div class="vw-news-carousel__nav"${slides.length === 1 ? " hidden" : ""}><button type="button" data-vw-news-prev aria-label="${escAttr(copy.previous)}"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10.5 2.5 5 8l5.5 5.5"></path></svg></button><span class="vw-news-carousel__count" data-vw-news-count aria-live="polite">1 / ${slides.length}</span><button type="button" data-vw-news-next aria-label="${escAttr(copy.next)}"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m5.5 2.5L11 8l-5.5 5.5"></path></svg></button></div><button class="vw-news-carousel__toggle" type="button" data-vw-news-toggle aria-label="${escAttr(copy.minimize)}" aria-expanded="true"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 6.5 8 11l5-4.5"></path></svg><span class="sr-only" data-vw-news-toggle-label>${esc(copy.minimize)}</span></button></div>`;
}

const HERO_NEWS_CAROUSEL_STYLE = `<style id="vw-news-carousel-style">
  .covid_cont.vw-news-panel{box-sizing:border-box;min-height:300px;padding:13px 15px 48px}.covid_cont.vw-news-panel .covid_title{padding:0 34px 10px}.covid_cont.vw-news-panel .covid_title h2{margin:0}.covid_cont.vw-news-panel .covid_headlines{margin-top:18px}.vw-news-carousel{position:relative}.vw-news-carousel .sr-only{height:1px;margin:-1px;overflow:hidden;position:absolute;width:1px;clip:rect(0,0,0,0);white-space:nowrap}.vw-news-carousel__slides{min-height:206px}.vw-news-carousel__slide{display:none;grid-template-columns:minmax(0,1fr) minmax(0,1fr);min-height:206px;animation:vw-news-in .32s cubic-bezier(.16,1,.3,1) both}.vw-news-carousel__slide.is-active{display:grid}.vw-news-carousel .news_item{display:flex;float:none;width:auto;min-width:0;flex-direction:column;font-size:16px;padding:0 20px 0 0}.vw-news-carousel .news_item+.news_item{border-left:1px solid #969696;margin-left:0;padding:0 0 0 20px}.vw-news-carousel .news_item h3{display:-webkit-box;overflow:hidden;color:#666;font-family:"Publico-Roman",serif;font-size:18px;font-weight:500;letter-spacing:normal;line-height:1.27;margin:0;padding:0;-webkit-box-orient:vertical;-webkit-line-clamp:6}.vw-news-carousel__headline{color:inherit;text-decoration:none}.vw-news-carousel__headline:focus-visible,.vw-news-carousel__more:focus-visible,.vw-news-carousel__nav button:focus-visible,.vw-news-carousel__toggle:focus-visible{outline:2px solid #ac162c;outline-offset:3px}.covid_headlines .vw-news-carousel .news_item>a.vw-news-carousel__more{align-self:flex-end;border:0;color:#666;display:inline-flex;font-family:"Geomanist-Book",sans-serif;font-size:13px;letter-spacing:.04em;margin-top:auto;padding:15px 0 0;white-space:normal;text-decoration:none}.vw-news-carousel__more span{float:none!important;position:static!important;width:auto!important;text-align:left!important}.covid_headlines .vw-news-carousel .news_item>a.vw-news-carousel__more>span::after{content:none}.covid_headlines .vw-news-carousel .news_item>a.vw-news-carousel__more::after{content:"→";display:inline-block;margin-left:.45em;transition:transform .2s cubic-bezier(.16,1,.3,1)}.vw-news-carousel__more:hover{text-decoration:underline}.vw-news-carousel__more:hover::after,.vw-news-carousel__more:focus-visible::after{transform:translateX(3px)}.vw-news-carousel__nav{align-items:center;bottom:-35px;display:flex;gap:7px;position:absolute;right:0}.vw-news-carousel__nav button,.vw-news-carousel__toggle{align-items:center;background:transparent;border:0;color:#777;cursor:pointer;display:inline-flex;justify-content:center;padding:4px}.vw-news-carousel__nav button{height:24px;width:24px}.vw-news-carousel__nav button svg,.vw-news-carousel__toggle svg{fill:none;height:15px;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round;stroke-width:1.5;width:15px}.vw-news-carousel__nav button:hover,.vw-news-carousel__toggle:hover{color:#ac162c}.vw-news-carousel__count{color:#888;font-family:"Geomanist-Book",sans-serif;font-size:10px;letter-spacing:.08em;min-width:31px;text-align:center}.vw-news-carousel__toggle{height:28px;position:absolute;right:0;top:-47px;width:28px}.vw-news-carousel__toggle svg{transition:transform .2s cubic-bezier(.16,1,.3,1)}.covid_cont.vw-news-panel--minimized{min-height:0;padding:13px 15px;width:178px}.covid_cont.vw-news-panel--minimized .covid_title{border-bottom:0;padding:0 30px 0 0}.covid_cont.vw-news-panel--minimized .covid_title span{font-size:21px}.covid_cont.vw-news-panel--minimized .covid_headlines{display:none}.covid_cont.vw-news-panel--minimized .vw-news-carousel__toggle{top:-38px}.covid_cont.vw-news-panel--minimized .vw-news-carousel__toggle svg{transform:rotate(180deg)}@keyframes vw-news-in{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:translateX(0)}}@media(max-width:800px){.covid_cont.vw-news-panel{min-height:0;padding-bottom:44px}.vw-news-carousel__slides,.vw-news-carousel__slide{min-height:0}.vw-news-carousel__slide{grid-template-columns:1fr;gap:19px}.vw-news-carousel .news_item{min-height:116px;padding:0}.vw-news-carousel .news_item+.news_item{border-left:0;border-top:1px solid #969696;margin:0;padding:19px 0 0}.vw-news-carousel .news_item h3{-webkit-line-clamp:4}.vw-news-carousel__nav{bottom:-32px}.covid_cont.vw-news-panel--minimized{width:178px}.covid_cont.vw-news-panel--minimized .covid_headlines{display:none}}@media(prefers-reduced-motion:reduce){.vw-news-carousel__slide{animation:none}.vw-news-carousel__more::after,.vw-news-carousel__toggle svg{transition:none}}
</style><style id="vw-news-carousel-toggle-style">
  .covid_cont.vw-news-panel .covid_title{position:relative;}
  .covid_cont.vw-news-panel .covid_headlines .vw-news-carousel__toggle{display:none;}
  .covid_cont.vw-news-panel>.vw-news-panel__toggle{display:inline-flex;position:absolute;right:15px;top:10px;z-index:2;}
  .covid_cont.vw-news-panel.vw-news-panel--minimized>.vw-news-panel__toggle{top:10px;}
  .vw-news-panel .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}
  @media(max-width:767px){.covid_cont.vw-news-panel>.vw-news-panel__toggle{top:10px;}}
</style>`;

const HERO_NEWS_CAROUSEL_SCRIPT = `<script id="vw-news-carousel-script">
  (function(){
    if(window.__vwHeroNewsCarousel)return;window.__vwHeroNewsCarousel=true;
    document.querySelectorAll('[data-vw-news-carousel]').forEach(function(root){
      var panel=root.closest('.covid_cont'),slides=Array.prototype.slice.call(root.querySelectorAll('[data-vw-news-slide]')),prev=root.querySelector('[data-vw-news-prev]'),next=root.querySelector('[data-vw-news-next]'),toggle=panel&&panel.querySelector('.vw-news-panel__toggle'),count=root.querySelector('[data-vw-news-count]'),toggleLabel=toggle&&toggle.querySelector('[data-vw-news-toggle-label]');
      if(!panel||!slides.length)return;var index=0,timer=null,paused=false,reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches,key='vw-news-panel-minimized';
      function show(nextIndex){index=(nextIndex+slides.length)%slides.length;slides.forEach(function(slide,slideIndex){var active=slideIndex===index;slide.classList.toggle('is-active',active);slide.setAttribute('aria-hidden',active?'false':'true');});if(count)count.textContent=(index+1)+' / '+slides.length;}
      function stop(){if(timer){window.clearInterval(timer);timer=null;}}
      function start(){stop();if(slides.length>1&&!paused&&!reduced)timer=window.setInterval(function(){show(index+1);},7000);}
      function setMinimized(value){panel.classList.toggle('vw-news-panel--minimized',value);toggle.setAttribute('aria-expanded',String(!value));toggle.setAttribute('aria-label',value?(root.getAttribute('data-expand-label')||'Show news'):(root.getAttribute('data-minimize-label')||'Minimize news'));if(toggleLabel)toggleLabel.textContent=toggle.getAttribute('aria-label');try{localStorage.setItem(key,value?'1':'0');}catch(_error){}if(value)stop();else start();}
      try{setMinimized(localStorage.getItem(key)==='1');}catch(_error){setMinimized(false);}show(0);
      if(prev)prev.addEventListener('click',function(){show(index-1);start();});if(next)next.addEventListener('click',function(){show(index+1);start();});if(toggle)toggle.addEventListener('click',function(){setMinimized(!panel.classList.contains('vw-news-panel--minimized'));});
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

  // --- Hero video (editable via siteConfig hero_video) ------------------
  // preload="metadata": el navegador no descarga los 8.5 MB de golpe (importa en móvil);
  // el video igual se transmite por rango (206) al reproducir.
  const video = cfg(config, "hero_video", lang);
  if (video) $("#video_header source").attr("src", video);
  if (($("#video_header source").attr("src") || "").toLowerCase().endsWith(".mp4")) {
    $("#video_header source").attr("type", "video/mp4");
  }
  const configuredHeroLink = cfg(config, "hero_practice_link", lang).trim();
  const fallbackHeroLink = lang === "es" ? "/acerca-de" : "/about";
  const legacyHeroLinks = new Set(["/practice/arbitration", "/nuestra-firma", "/our-firm"]);
  const heroLink = !configuredHeroLink || legacyHeroLinks.has(configuredHeroLink)
    ? fallbackHeroLink
    : safeHref(configuredHeroLink, fallbackHeroLink);
  $("#video_header").parent("a").attr({
    href: heroLink,
    "aria-label": lang === "es" ? "Conoce Von Wobeser y Sierra" : "Discover Von Wobeser y Sierra",
  });
  $("#video_header").attr({
    preload: "metadata",
    poster: "/images/home-hero.webp",
  });
  const hero = $(".home__hero").first();
  const heroStyle = hero.attr("style") || "";
  if (heroStyle.includes("/images/home-hero.jpg")) {
    hero.attr("style", heroStyle.replaceAll("/images/home-hero.jpg", "/images/home-hero.webp"));
  }
  if ($('link[rel="preload"][href="/images/home-hero.webp"]').length === 0) {
    $("head").append('<link rel="preload" as="image" href="/images/home-hero.webp" fetchpriority="high">');
  }

  // --- Frases editoriales de la portada -------------------------------
  const grayStatements = $(".home__gray--txt");
  const experience = cfg(config, "home_experience", lang);
  const teamStats = cfg(config, "home_team_stats", lang);
  if (experience) grayStatements.eq(0).html(`<p>${esc(experience)}</p>`);
  if (teamStats) grayStatements.eq(1).html(`<p>${esc(teamStats)}</p>`);

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
  const bTitle = cfg(config, "banner_title", lang);
  const bSubtitle = cfg(config, "banner_subtitle", lang);
  if (bTitle || bSubtitle) {
    const seeMoreLink = $(".home__rojo--txt a").first().attr("href") || "/new-offices/index.html";
    $(".home__rojo--txt").html(
      `<p><span style="font-size: 1.4rem;"><strong>${esc(bTitle)}</strong></span></p>` +
        `<p><span style="font-size: 1.4rem;">${esc(bSubtitle)}</span></p>` +
        `<p style="text-align: right;"><span style="font-size: 1.4rem;">` +
        `<a href="${esc(seeMoreLink)}" target="_blank" rel="alternate noopener noreferrer">${seeMore}</a></span></p>`,
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
  const recognitionTitle = cfg(config, "home_recognitions_title", lang);
  const recognitionIntro = cfg(config, "home_recognitions_intro", lang);
  const recognitionBody = cfg(config, "home_recognitions_body", lang);
  if (recognitionTitle) editorialSections.eq(0).find(".home__rec--ttl").first().text(recognitionTitle);
  if (recognitionIntro) editorialSections.eq(0).find(".home__rec--top").first().html(paragraphs(recognitionIntro));
  if (recognitionBody) editorialSections.eq(0).find(".home__rec--txt").first().html(paragraphs(recognitionBody));

  const diversityTitle = cfg(config, "home_diversity_title", lang);
  const diversityBody = cfg(config, "home_diversity_body", lang);
  if (diversityTitle) editorialSections.eq(1).find(".home__rec--ttl").first().text(diversityTitle);
  if (diversityBody) editorialSections.eq(1).find(".home__rec--top").first().html(paragraphs(diversityBody));

  const proBonoTitle = cfg(config, "home_probono_title", lang);
  const proBonoBody = cfg(config, "home_probono_body", lang);
  if (proBonoTitle) editorialSections.eq(2).find(".home__rec--ttl").first().text(proBonoTitle);
  if (proBonoBody) editorialSections.eq(2).find(".home__rec--top").first().html(paragraphs(proBonoBody));

  const about = $("#footer-sub > #footer > .home__rec--wrap").first();
  const aboutTitle = cfg(config, "home_about_title", lang);
  const aboutLabels = ["home_vision_label", "home_mission_label", "home_values_label"];
  const aboutBodies = ["home_vision_body", "home_mission_body", "home_values_body"];
  if (aboutTitle) about.find(".home__rec--ttl").first().text(aboutTitle);
  about.find(".home__rec--top").each((index, element) => {
    const value = cfg(config, aboutLabels[index], lang);
    if (value) $(element).find("strong").first().text(value);
  });
  about.find(".home__rec--txt").each((index, element) => {
    const value = cfg(config, aboutBodies[index], lang);
    if (value) $(element).html(paragraphs(value));
  });

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
