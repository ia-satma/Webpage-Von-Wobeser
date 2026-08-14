import * as cheerio from "cheerio";
import { isVisiblePublicPractice } from "./publicPracticeGroups";
import { cfg, cfgTypographyAttribute, type ConfigMap } from "./siteConfig";

function esc(s: string): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function jsString(s: string): string {
  return JSON.stringify(s).replace(/</g, "\\u003c");
}

function safePublicHref(value: string, fallback: string): string {
  const href = String(value ?? "").trim();
  if (/^\/(?!\/)[a-z0-9_./%+@~:?&=#-]*$/i.test(href)) return href;
  if (/^https:\/\/[a-z0-9.-]+(?:[/:?#][^\s"'<>]*)?$/i.test(href)) return href;
  return fallback;
}

/**
 * La URL del mapa se administra desde Oficinas y se reutiliza en Contacto.
 * Al ser un iframe, restringimos el origen a embeds HTTPS de Google Maps: así
 * un valor accidental o una URL de otro proveedor no convierte Contacto en un
 * punto de carga de contenido arbitrario.
 */
function safeGoogleMapsEmbed(value: string): string | null {
  try {
    const url = new URL(String(value ?? "").trim());
    const googleHost = /(?:^|\.)google\.[a-z.]+$/i.test(url.hostname);
    if (url.protocol !== "https:" || !googleHost || !/^\/maps\/embed(?:\/|$)/i.test(url.pathname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * El formulario de "Pasantes" del sitio capturado es HTML crudo de Joomla con
 * action="" — al enviarse no llega a ningún backend (ni correo, ni BD, ni panel).
 * Este fix vive en código (no se edita el HTML capturado a mano) para sobrevivir a un
 * futuro re-scrape del sitio, igual que el toggle de idioma y el texto editable.
 *
 * Reemplaza el submit nativo por un fetch real a /api/career-applications. Usa
 * capture:true + stopImmediatePropagation para neutralizar el submitHandler de jQuery
 * Validate ya presente en el HTML (que solo hacía form.submit()), sin depender de que
 * jQuery/jQuery Validate estén cargados ni de su orden de inicialización.
 */
export function applyCareersFormFix($: cheerio.CheerioAPI, lang: "es" | "en" = "en"): void {
  // La abreviatura de marca en la etiqueta editorial se mantiene breve y es
  // independiente de los nombres largos usados en copys legales o SEO.
  $(".careers__meta .page__ttl--holder > span").first().text(lang === "es" ? "CARRERA EN VW" : "CAREER AT VW");

  // La plantilla en inglés capturada tiene un segundo enlace a "Privacy Notice." (pie de
  // página, fuera del formulario) que por un error del sitio original apunta al aviso en
  // ESPAÑOL (/index.php/aviso/) en vez de al propio (/index.php/privacy/). El enlace del
  // checkbox obligatorio ya estaba bien — este es solo el del copyright del pie.
  if (lang === "en") {
    $('a[href="/index.php/aviso/index.html"]').attr("href", "/index.php/privacy/index.html");
  }

  const $form = $("#careersForm");
  if (!$form.length) return;

  $form.attr("action", "/api/career-applications"); // defensivo, por si el JS no corre

  const script = `
<script>
(function () {
  function init() {
    var form = document.getElementById('careersForm');
    if (!form) return;
    var loader = form.querySelector('.loader');
    var submitLabel = form.querySelector('.submit');
    var feedback = document.createElement('div');
    feedback.setAttribute('data-vw-feedback', '1');
    feedback.style.marginTop = '10px';
    feedback.style.fontSize = '13px';
    (loader || form).parentNode.insertBefore(feedback, loader || null);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      feedback.textContent = '';
      feedback.style.color = '#fff';

      var name = (form.querySelector('[name="name"]') || {}).value || '';
      var lName = (form.querySelector('[name="l_name"]') || {}).value || '';
      var mail = (form.querySelector('[name="mail"]') || {}).value || '';
      var fileInput = form.querySelector('[name="uploaded_file"]');
      var accept = (form.querySelector('[name="accept"]') || {}).checked;

      if (!name.trim() || !lName.trim() || !mail.trim() || !fileInput || !fileInput.files || !fileInput.files.length || !accept) {
        feedback.textContent = 'Completa nombre, apellido, correo, adjunta tu CV y acepta el aviso de privacidad.';
        return;
      }

      if (submitLabel) submitLabel.style.display = 'none';
      if (loader) loader.style.display = 'block';

      fetch('/api/career-applications', { method: 'POST', body: new FormData(form) })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) { return { ok: res.ok, data: data }; });
        })
        .then(function (result) {
          if (loader) loader.style.display = 'none';
          if (result.ok) {
            feedback.style.color = '#7CFC7C';
            feedback.textContent = 'Gracias, tu solicitud fue enviada correctamente.';
            form.reset();
          } else {
            if (submitLabel) submitLabel.style.display = '';
            feedback.textContent = (result.data && result.data.error) || 'Ocurrió un error, intenta de nuevo.';
          }
        })
        .catch(function () {
          if (loader) loader.style.display = 'none';
          if (submitLabel) submitLabel.style.display = '';
          feedback.textContent = 'Ocurrió un error de red, intenta de nuevo.';
        });
    }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
</script>`;

  $("body").append(script);
}

/**
 * Reconstruye Contacto sobre la plantilla actual: cabecera editorial, datos,
 * mapa con consentimiento y formulario comercial conectado a PostgreSQL.
 */
export function applyContactForm(
  $: cheerio.CheerioAPI,
  lang: "es" | "en",
  config: ConfigMap = {},
  practices: Array<{ slug: string; name: string; nameEs: string; published?: boolean | null }> = [],
): void {
  const $wrap = $(".page .page--wrap").first();
  if (!$wrap.length || $wrap.find("#vwContactForm").length) return;

  const pageDefaults = lang === "es"
    ? {
        eyebrow: "CONTACTO",
        title: "Estamos aquí para ayudarte.",
        description: "Ponte en contacto con nosotros o visita nuestras oficinas en Ciudad de México.",
        email: "info@vwys.com.mx",
        phone: "+52 (55) 5258 1000",
        address: "Torre SOMA Chapultepec, piso 18\nCampos Elíseos 204, Polanco\nAcceso por Calle Arquímedes N.º 10\nC.P. 11550, Ciudad de México",
      }
    : {
        eyebrow: "CONTACT",
        title: "We are here to help.",
        description: "Contact us or visit our offices in Mexico City.",
        email: "info@vwys.com.mx",
        phone: "+52 (55) 5258 1000",
        address: "Torre SOMA Chapultepec, 18th floor\n204 Campos Elíseos, Polanco\nAccess via 10 Arquímedes Street\nC.P. 11550, Mexico City",
      };
  const defaults = lang === "es"
    ? {
        title: "Envíanos un mensaje",
        description: "Déjanos tus datos y cuéntanos cómo podemos ayudarte. Nuestro equipo se pondrá en contacto contigo.",
        name: "Nombre completo",
        email: "Correo electrónico",
        phone: "Teléfono (opcional)",
        company: "Empresa (opcional)",
        country: "País",
        practice: "Área de asesoría (opcional)",
        message: "Mensaje",
        send: "Enviar mensaje",
        sending: "Enviando…",
        selectOption: "Selecciona una opción",
        required: "Completa nombre, correo, país y mensaje, y acepta el Aviso de Privacidad.",
        invalidEmail: "Escribe un correo electrónico válido.",
        privacy: "He leído y acepto el",
        privacyLink: "Aviso de Privacidad",
        privacyPath: "/aviso",
        ok: "Gracias, tu mensaje fue enviado correctamente.",
        err: "No fue posible enviar tu mensaje. Intenta de nuevo.",
        netErr: "No pudimos conectarnos. Revisa tu conexión e intenta de nuevo.",
      }
    : {
        title: "Send us a message",
        description: "Share your details and tell us how we can help. Our team will contact you.",
        name: "Full name",
        email: "Email",
        phone: "Phone (optional)",
        company: "Company (optional)",
        country: "Country",
        practice: "Advisory area (optional)",
        message: "Message",
        send: "Send message",
        sending: "Sending…",
        selectOption: "Select an option",
        required: "Please fill in name, email, country and message, and accept the Privacy Notice.",
        invalidEmail: "Enter a valid email address.",
        privacy: "I have read and accept the",
        privacyLink: "Privacy Notice",
        privacyPath: "/privacy",
        ok: "Thank you, your message was sent successfully.",
        err: "Your message could not be sent. Please try again.",
        netErr: "We could not connect. Check your connection and try again.",
      };
  const text = (key: string, fallback: string, legacy: string[] = []) => {
    const configured = cfg(config, key, lang).trim();
    return !configured || legacy.includes(configured) ? fallback : configured;
  };
  const page = {
    eyebrow: text("page_contact_eyebrow", pageDefaults.eyebrow),
    title: text("page_contact_title", pageDefaults.title),
    description: text("page_contact_description", pageDefaults.description),
    email: text("page_contact_email", pageDefaults.email),
    phone: text("page_contact_phone", pageDefaults.phone),
    address: text("page_contact_address", pageDefaults.address),
  };
  const t = {
    title: text("contact_form_title", defaults.title),
    description: text("contact_form_description", defaults.description, lang === "es"
      ? ["Déjanos tus datos y el área en la que necesitas asesoría. Nuestro equipo se pondrá en contacto contigo."]
      : ["Share your details and the area in which you need advice. Our team will contact you."]),
    name: text("contact_form_name_label", defaults.name),
    email: text("contact_form_email_label", defaults.email),
    phone: text("contact_form_phone_label", defaults.phone),
    company: text("contact_form_company_label", defaults.company),
    country: text("contact_form_country_label", defaults.country),
    practice: text("contact_form_practice_label", defaults.practice, lang === "es"
      ? ["Área de interés (opcional)"]
      : ["Area of interest (optional)"]),
    message: text("contact_form_message_label", defaults.message),
    send: text("contact_form_submit_label", defaults.send),
    sending: text("contact_form_sending_label", defaults.sending),
    selectOption: text("contact_form_select_label", defaults.selectOption),
    required: text("contact_form_required_message", defaults.required, lang === "es"
      ? ["Completa nombre, correo y mensaje.", "Completa nombre, correo y mensaje, y acepta el Aviso de Privacidad."]
      : ["Please fill in name, email and message.", "Please fill in name, email and message, and accept the Privacy Notice."]),
    invalidEmail: text("contact_form_invalid_email_message", defaults.invalidEmail),
    privacy: text("contact_form_privacy_intro", defaults.privacy),
    privacyLink: text("contact_form_privacy_link", defaults.privacyLink),
    privacyPath: safePublicHref(text("contact_form_privacy_path", defaults.privacyPath), defaults.privacyPath),
    ok: text("contact_form_success_message", defaults.ok),
    err: text("contact_form_error_message", defaults.err),
    netErr: text("contact_form_network_error_message", defaults.netErr),
  };

  const publicEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(page.email) ? page.email : pageDefaults.email;
  const phoneHref = `tel:${page.phone.replace(/[^+\d]/g, "")}`;
  const addressLines = page.address.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 8);
  const addressHtml = addressLines.map((line) => `<span>${esc(line)}</span>`).join("");

  // La plantilla aporta el iframe histórico; se conserva y solo se reemplaza
  // por el embed administrado cuando el origen de Google Maps es seguro.
  const $map = $wrap.find(".page__map").first().clone();
  const mapEmbed = safeGoogleMapsEmbed(cfg(config, "office_map_embed", lang));
  if (mapEmbed) $map.find("iframe").first().attr("src", mapEmbed);
  $map.find("iframe").first().attr(
    "title",
    lang === "es" ? "Ubicación de Von Wobeser y Sierra en Google Maps" : "Von Wobeser y Sierra location on Google Maps",
  );

  $wrap.empty().addClass("vw-contact-page");
  $wrap.append(`
<header class="vw-contact-page__header">
  <p class="vw-contact-page__eyebrow">${esc(page.eyebrow)}</p>
  <h1 class="vw-contact-page__title">${esc(page.title)}</h1>
  <div class="page__content--intro vw-contact-page__lede"><p>${esc(page.description)}</p></div>
</header>
<section class="vw-contact-page__location" aria-label="${esc(lang === "es" ? "Información de contacto y ubicación" : "Contact information and location")}">
  <div class="vw-contact-page__details">
    <div class="vw-contact-page__links">
      <a href="mailto:${esc(publicEmail)}">${esc(publicEmail)}</a>
      <a href="${esc(phoneHref)}">${esc(page.phone)}</a>
    </div>
    <address>${addressHtml}</address>
  </div>
  <div class="vw-contact-page__map-slot"></div>
</section>`);
  if ($map.length) $wrap.find(".vw-contact-page__map-slot").append($map);
  $wrap.find(".vw-contact-page__title").attr(cfgTypographyAttribute(config, "page_contact_title", lang));
  $wrap.find(".vw-contact-page__lede").attr(cfgTypographyAttribute(config, "page_contact_description", lang));
  $wrap.find(".vw-contact-page__details").attr(cfgTypographyAttribute(config, "page_contact_address", lang));

  const options = practices
    .filter(isVisiblePublicPractice)
    .sort((a, b) => (lang === "es" ? a.nameEs : a.name).localeCompare(lang === "es" ? b.nameEs : b.name))
    .map((practice) => `<option value="${esc(practice.slug)}">${esc(lang === "es" ? practice.nameEs || practice.name : practice.name)}</option>`)
    .join("");

  $wrap.append(`
<section class="vw-contact-form-section" aria-labelledby="vw-contact-form-title">
  <div class="vw-contact-form-section__heading">
    <h2 id="vw-contact-form-title">${esc(t.title)}</h2>
    <p>${esc(t.description)}</p>
  </div>
  <form id="vwContactForm" class="vw-contact-form" action="/api/contact" method="post" novalidate>
    <label class="vw-contact-field">
      <span>${esc(t.name)} <b aria-hidden="true">*</b></span>
      <input name="fullName" type="text" autocomplete="name" maxlength="120" required>
    </label>
    <label class="vw-contact-field">
      <span>${esc(t.email)} <b aria-hidden="true">*</b></span>
      <input name="email" type="email" autocomplete="email" maxlength="254" required>
    </label>
    <label class="vw-contact-field">
      <span>${esc(t.phone)}</span>
      <input name="phone" type="tel" autocomplete="tel" maxlength="32">
    </label>
    <label class="vw-contact-field">
      <span>${esc(t.company)}</span>
      <input name="company" type="text" autocomplete="organization" maxlength="160">
    </label>
    <label class="vw-contact-field">
      <span>${esc(t.country)} <b aria-hidden="true">*</b></span>
      <input name="country" type="text" autocomplete="country-name" maxlength="120" required>
    </label>
    <label class="vw-contact-field">
      <span>${esc(t.practice)}</span>
      <select name="practiceArea">
        <option value="">${esc(t.selectOption)}</option>
        ${options}
      </select>
    </label>
    <label class="vw-contact-field vw-contact-field--full">
      <span>${esc(t.message)} <b aria-hidden="true">*</b></span>
      <textarea name="message" rows="6" maxlength="5000" required></textarea>
    </label>
    <label class="vw-contact-privacy vw-contact-field--full" for="vw-contact-privacy">
      <input id="vw-contact-privacy" name="acceptPrivacy" type="checkbox" required>
      <span>${esc(t.privacy)} <a href="${esc(t.privacyPath)}">${esc(t.privacyLink)}</a>.</span>
    </label>
    <div class="vw-contact-form__footer vw-contact-field--full">
      <div class="vw-contact-form__feedback" data-vw-feedback role="status" aria-live="polite"></div>
      <button type="submit" data-idle-label="${esc(t.send)}" data-loading-label="${esc(t.sending)}">
        <span>${esc(t.send)}</span><span aria-hidden="true">→</span>
      </button>
    </div>
  </form>
</section>`);
  $wrap.find("#vw-contact-form-title").attr(cfgTypographyAttribute(config, "contact_form_title", lang));
  $wrap.find(".vw-contact-form-section__heading p").attr(cfgTypographyAttribute(config, "contact_form_description", lang));

  $("head").append(`
<style id="vw-contact-form-style">
.vw-contact-page{display:block!important;padding-top:clamp(48px,5.5vw,76px);padding-bottom:clamp(48px,6vw,88px)}
.vw-contact-page__header{max-width:1040px;margin:0 0 clamp(40px,4.5vw,62px)}
.vw-contact-page__eyebrow{margin:0 0 24px;color:#ac162c;font:500 clamp(13px,1.15vw,17px)/1.2 var(--vw-font-ui);letter-spacing:.28em;text-transform:uppercase}
.vw-contact-page__title{max-width:960px;margin:0;color:#565656;font:400 clamp(36px,3.8vw,52px)/1.08 var(--vw-font-editorial);letter-spacing:-.02em}
.vw-contact-page__lede{max-width:720px;margin:20px 0 0!important;color:#606060;font:400 clamp(16px,1.25vw,19px)/1.55 var(--vw-font-body)!important}
.vw-contact-page__lede p{margin:0!important;font:inherit!important;color:inherit!important}
.vw-contact-page__location{display:grid;grid-template-columns:minmax(280px,.72fr) minmax(0,1.28fr);gap:clamp(42px,6vw,88px);align-items:stretch;padding-top:32px;border-top:2px solid #ac162c}
.vw-contact-page__details{display:flex;flex-direction:column;justify-content:space-between;gap:56px;padding:8px 0 12px;color:#5c5c5c;font-family:var(--vw-font-body)}
.vw-contact-page__links{display:grid;gap:8px}
.vw-contact-page__links a{width:max-content;max-width:100%;color:#ac162c;font:500 clamp(18px,1.6vw,23px)/1.45 var(--vw-font-body);text-decoration:none;text-decoration-thickness:1.5px;text-underline-offset:.25em}
.vw-contact-page__links a:hover,.vw-contact-page__links a:focus-visible{text-decoration:underline}
.vw-contact-page__links a:focus-visible{outline:2px solid #ac162c;outline-offset:4px}
.vw-contact-page__details address{display:grid;gap:5px;margin:0;color:#5c5c5c;font:400 clamp(16px,1.25vw,19px)/1.5 var(--vw-font-body);font-style:normal}
.vw-contact-page__details address span{display:block}
.vw-contact-page__map-slot,.vw-contact-page .page__map,.vw-contact-page .page__map--holder{width:100%;height:100%;min-height:430px;margin:0}
.vw-contact-page .page__map{float:none}
.vw-contact-page .page__map--holder{position:relative;background:#dededb}
.vw-contact-page .page__map--holder iframe{display:block;width:100%;height:100%;min-height:430px;border:0}
.vw-contact-form-section{width:100%;margin:clamp(68px,8vw,112px) 0 0;padding-top:34px;border-top:2px solid #ac162c}
.vw-contact-form-section__heading{display:grid;grid-template-columns:minmax(280px,.72fr) minmax(0,1.28fr);gap:clamp(42px,6vw,88px);align-items:start;margin-bottom:34px}
.vw-contact-form-section__heading h2{margin:0;color:#565656;font:400 clamp(36px,4.3vw,58px)/1.06 var(--vw-font-editorial)}
.vw-contact-form-section__heading p{max-width:650px;margin:7px 0 0;color:#606060;font:400 18px/1.55 var(--vw-font-body)}
.vw-contact-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:26px 34px;padding:clamp(30px,4vw,48px);background:#747473}
.vw-contact-field{display:grid;gap:10px;margin:0;color:#fff;font:500 12px/1.3 var(--vw-font-ui);letter-spacing:.14em;text-transform:uppercase}
.vw-contact-field b{color:#fff;font-weight:400}
.vw-contact-field--full{grid-column:1/-1}
.vw-contact-field input,.vw-contact-field select,.vw-contact-field textarea{box-sizing:border-box;width:100%;min-width:0;min-height:50px;margin:0;border:1px solid transparent;border-radius:0;background:#fff;color:#3f3f3f;padding:12px 14px;font:400 16px/1.4 var(--vw-font-ui);letter-spacing:0;text-transform:none;appearance:auto}
.vw-contact-field textarea{min-height:152px;resize:vertical}
.vw-contact-field input:focus-visible,.vw-contact-field select:focus-visible,.vw-contact-field textarea:focus-visible,.vw-contact-form button:focus-visible,.vw-contact-privacy input:focus-visible,.vw-contact-privacy a:focus-visible{outline:3px solid #fff;outline-offset:3px}
.vw-contact-field input[aria-invalid="true"],.vw-contact-field select[aria-invalid="true"],.vw-contact-field textarea[aria-invalid="true"]{border-color:#ac162c;box-shadow:0 0 0 2px #fff}
.vw-contact-privacy{display:flex;align-items:flex-start;gap:12px;margin:0;background:#fff;color:#4f4f4f;padding:15px 17px;font:400 16px/1.55 var(--vw-font-ui);letter-spacing:0;text-transform:none}
.vw-contact-privacy input{width:20px;height:20px;flex:0 0 20px;margin:2px 0 0;accent-color:#ac162c}
.vw-contact-privacy a{color:#a5102a;font-weight:500;text-decoration:underline;text-decoration-color:#a5102a;text-decoration-thickness:2px;text-underline-offset:.2em}
.vw-contact-form__footer{display:flex;align-items:center;justify-content:space-between;gap:30px;padding-top:6px}
.vw-contact-form__feedback{min-height:24px;color:#fff;font:400 15px/1.5 var(--vw-font-ui)}
.vw-contact-form__feedback[data-state="success"]{color:#fff;font-weight:500}
.vw-contact-form button{display:inline-flex;align-items:center;justify-content:space-between;gap:30px;min-width:220px;min-height:52px;border:0;border-radius:0;background:#ac162c;color:#fff;padding:0 24px;font:500 13px/1 var(--vw-font-ui);letter-spacing:.14em;text-transform:uppercase;cursor:pointer;transition:transform .2s ease,background-color .2s ease}
.vw-contact-form button>span:last-child{font-size:21px;transition:transform .2s ease}
.vw-contact-form button:hover,.vw-contact-form button:focus-visible{background:#971329}
.vw-contact-form button:hover>span:last-child,.vw-contact-form button:focus-visible>span:last-child{transform:translateX(5px)}
.vw-contact-form button:active{transform:translateY(1px)}
.vw-contact-form button:disabled{cursor:wait;opacity:.7}
@media(max-width:980px){.vw-contact-page__location,.vw-contact-form-section__heading{grid-template-columns:1fr;gap:28px}.vw-contact-page__details{gap:30px}.vw-contact-page__map-slot,.vw-contact-page .page__map,.vw-contact-page .page__map--holder,.vw-contact-page .page__map--holder iframe{min-height:380px}}
@media(max-width:720px){.vw-contact-page{padding-top:44px;padding-bottom:48px}.vw-contact-page__header{margin-bottom:42px}.vw-contact-page__eyebrow{margin-bottom:18px}.vw-contact-page__lede{margin-top:18px!important}.vw-contact-page__location{padding-top:24px}.vw-contact-page__map-slot,.vw-contact-page .page__map,.vw-contact-page .page__map--holder,.vw-contact-page .page__map--holder iframe{min-height:320px}.vw-contact-form-section{margin-top:58px;padding-top:26px}.vw-contact-form{grid-template-columns:1fr;gap:22px;padding:28px 22px}.vw-contact-field--full{grid-column:auto}.vw-contact-form__footer{align-items:stretch;flex-direction:column}.vw-contact-form button{width:100%;min-width:0;min-height:52px}}
@media(prefers-reduced-motion:reduce){.vw-contact-form button,.vw-contact-form button>span:last-child{transition:none}}
</style>`);

  const script = `
<script>
(function () {
  function init() {
    var form = document.getElementById('vwContactForm');
    if (!form) return;
    var feedback = form.querySelector('[data-vw-feedback]');
    var button = form.querySelector('button[type="submit"]');
    var buttonLabel = button && button.querySelector('span');
    function setInvalid(input, invalid) {
      if (!input) return;
      if (invalid) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      feedback.textContent = '';
      feedback.removeAttribute('data-state');
      feedback.style.color = '#fff';
      var data = {
        fullName: form.fullName.value,
        email: form.email.value,
        phone: form.phone.value || undefined,
        company: form.company.value || undefined,
        country: form.country.value,
        practiceArea: form.practiceArea.value || undefined,
        message: form.message.value,
        acceptPrivacy: !!form.acceptPrivacy.checked,
      };
      var missing = !data.fullName.trim() || !data.email.trim() || !data.country.trim() || !data.message.trim() || !data.acceptPrivacy;
      setInvalid(form.fullName, !data.fullName.trim());
      setInvalid(form.email, !data.email.trim() || !form.email.validity.valid);
      setInvalid(form.country, !data.country.trim());
      setInvalid(form.message, !data.message.trim());
      setInvalid(form.acceptPrivacy, !data.acceptPrivacy);
      if (missing) {
        feedback.textContent = ${jsString(t.required)};
        return;
      }
      if (!form.email.validity.valid) {
        feedback.textContent = ${jsString(t.invalidEmail)};
        form.email.focus();
        return;
      }
      if (button) {
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        if (buttonLabel) buttonLabel.textContent = button.getAttribute('data-loading-label') || '';
      }
      fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (res) { return res.json().catch(function () { return {}; }).then(function (d) { return { ok: res.ok, data: d }; }); })
        .then(function (result) {
          if (result.ok) {
            feedback.setAttribute('data-state', 'success');
            feedback.textContent = ${jsString(t.ok)};
            form.reset();
            form.querySelectorAll('[aria-invalid]').forEach(function (input) { input.removeAttribute('aria-invalid'); });
          } else {
            feedback.textContent = ${jsString(t.err)};
          }
        })
        .catch(function () {
          feedback.textContent = ${jsString(t.netErr)};
        })
        .finally(function () {
          if (button) {
            button.disabled = false;
            button.removeAttribute('aria-busy');
            if (buttonLabel) buttonLabel.textContent = button.getAttribute('data-idle-label') || '';
          }
        });
    }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
</script>`;

  $("body").append(script);
}
