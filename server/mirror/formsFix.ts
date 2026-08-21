import * as cheerio from "cheerio";
import { isVisiblePublicPractice } from "./publicPracticeGroups";
import { cfg, cfgTypographyAttribute, type ConfigMap } from "./siteConfig";
import { contactLocationIcon, renderContactAddressLines, resolveContactLocation } from "./contactLocation";

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
 * mapa público de ubicación y formulario comercial conectado a PostgreSQL.
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
        title: "Estamos aquí para ayudarte",
        description: "Ponte en contacto con nosotros o visita nuestras oficinas en Ciudad de México.",
      }
    : {
        eyebrow: "CONTACT",
        title: "We are here to help",
        description: "Contact us or visit our offices in Mexico City.",
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
  const publicLocation = resolveContactLocation(config, lang);
  const page = {
    eyebrow: text("page_contact_eyebrow", pageDefaults.eyebrow),
    // La copia inicial llevaba un punto final; se trata como valor legado para
    // reflejar el ajuste editorial sin sobrescribir personalizaciones del CMS.
    title: text(
      "page_contact_title",
      pageDefaults.title,
      lang === "es" ? ["Estamos aquí para ayudarte."] : ["We are here to help."],
    ),
    description: text("page_contact_description", pageDefaults.description),
    email: publicLocation.email,
    phone: publicLocation.phone,
    address: publicLocation.address,
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

  const publicEmail = publicLocation.email;
  const phoneHref = publicLocation.phoneHref;
  const addressHtml = renderContactAddressLines(publicLocation.addressLines);

  // La plantilla aporta el iframe histórico; se conserva y solo se reemplaza
  // por el embed administrado cuando el origen de Google Maps es seguro.
  const $map = $wrap.find(".page__map").first().clone();
  const $mapFrame = $map.find("iframe").first();
  if (publicLocation.mapEmbed) {
    $mapFrame
      .attr("src", publicLocation.mapEmbed)
      .attr("data-vwb-contact-map", "always")
      .attr(
        "title",
        lang === "es" ? "Ubicación de Von Wobeser y Sierra en Google Maps" : "Von Wobeser y Sierra location on Google Maps",
      );
  } else {
    // Si la URL administrada es inválida, nunca se conserva un iframe heredado
    // con origen desconocido; las acciones seguras hacia Google Maps permanecen.
    $mapFrame.remove();
  }
  const location = publicLocation.labels;
  const mapLink = publicLocation.mapLink;

  const options = practices
    .filter(isVisiblePublicPractice)
    .sort((a, b) => (lang === "es" ? a.nameEs : a.name).localeCompare(lang === "es" ? b.nameEs : b.name))
    .map((practice) => `<option value="${esc(practice.slug)}">${esc(lang === "es" ? practice.nameEs || practice.name : practice.name)}</option>`)
    .join("");

  $wrap.empty().addClass("vw-contact-page");
  $wrap.append(`
<header class="vw-contact-page__header">
  <p class="vw-contact-page__eyebrow">${esc(page.eyebrow)}</p>
  <h1 class="vw-contact-page__title">${esc(page.title)}</h1>
  <div class="page__content--intro vw-contact-page__lede"><p>${esc(page.description)}</p></div>
</header>
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
</section>
<section class="vw-contact-location-section" aria-labelledby="vw-contact-location-title">
  <header class="vw-contact-location-section__heading">
    <p>${esc(location.eyebrow)}</p>
    <h2 id="vw-contact-location-title">${esc(location.title)}</h2>
  </header>
  <div class="vw-contact-page__location" aria-label="${esc(lang === "es" ? "Información de contacto y ubicación" : "Contact information and location")}">
    <div class="vw-contact-page__map-card"><div class="vw-contact-page__map-slot"></div></div>
    <aside class="vw-contact-page__details">
      <div class="vw-contact-location__row">
        ${contactLocationIcon("pin")}
        <div><h3>${esc(location.address)}</h3><address>${addressHtml}</address></div>
      </div>
      <div class="vw-contact-location__row">
        ${contactLocationIcon("phone")}
        <div><h3>${esc(location.phone)}</h3><a href="${esc(phoneHref)}">${esc(page.phone)}</a></div>
      </div>
      <div class="vw-contact-location__row">
        ${contactLocationIcon("mail")}
        <div><h3>${esc(location.email)}</h3><a href="mailto:${esc(publicEmail)}">${esc(publicEmail)}</a></div>
      </div>
      <div class="vw-contact-location__actions">
        <a class="vw-contact-location__action vw-contact-location__action--primary" href="${esc(mapLink)}" target="_blank" rel="noopener noreferrer">${contactLocationIcon("directions")}<span>${esc(location.directions)}</span></a>
        <a class="vw-contact-location__action" href="${esc(mapLink)}" target="_blank" rel="noopener noreferrer"><span>${esc(location.viewMap)}</span>${contactLocationIcon("external")}</a>
      </div>
    </aside>
  </div>
</section>`);
  if ($map.length) $wrap.find(".vw-contact-page__map-slot").append($map);
  $wrap.find(".vw-contact-page__title").attr(cfgTypographyAttribute(config, "page_contact_title", lang));
  $wrap.find(".vw-contact-page__lede").attr(cfgTypographyAttribute(config, "page_contact_description", lang));
  $wrap.find(".vw-contact-page__details").attr(cfgTypographyAttribute(config, "page_contact_address", lang));
  $wrap.find("#vw-contact-form-title").attr(cfgTypographyAttribute(config, "contact_form_title", lang));
  $wrap.find(".vw-contact-form-section__heading p").attr(cfgTypographyAttribute(config, "contact_form_description", lang));

  $("head").append(`
<style id="vw-contact-form-style">
.vw-contact-page{display:block!important;padding-top:clamp(44px,5vw,68px);padding-bottom:clamp(56px,7vw,96px)}
.vw-contact-page__header{display:flex;flex-direction:column;align-items:center;max-width:920px;margin:0 auto clamp(42px,5vw,68px);text-align:center}
.vw-contact-page__header .vw-contact-page__eyebrow,.vw-contact-page__header .vw-contact-page__title,.vw-contact-page__header .vw-contact-page__lede{float:none!important;width:100%;text-align:center!important}
.vw-contact-page__eyebrow,.vw-contact-location-section__heading p{margin:0 0 20px;color:#ac162c;font:500 12px/1.2 var(--vw-font-ui);letter-spacing:.28em;text-transform:uppercase}
.vw-contact-page__title{max-width:760px;margin:0;color:#565656;font:400 clamp(34px,3.25vw,46px)/1.14 var(--vw-font-editorial);letter-spacing:-.02em;text-transform:none}
.vw-contact-page__lede{max-width:760px;margin:18px auto 0!important;border-bottom:0!important;padding-bottom:0!important;color:#606060;font:400 clamp(16px,1.2vw,18px)/1.55 var(--vw-font-body)!important;text-transform:none}
.vw-contact-page__lede p{margin:0!important;color:inherit!important;font:inherit!important}
.vw-contact-form-section{width:100%;margin:0;padding-top:38px;border-top:0}
.vw-contact-form-section::before{content:"";display:block;width:100%;height:1px;margin:0 0 30px;background:#ac162c}
.vw-contact-form-section__heading{max-width:760px;margin:0 0 28px}
.vw-contact-form-section__heading h2{margin:0;color:#565656;font:400 clamp(34px,3.15vw,44px)/1.12 var(--vw-font-editorial);letter-spacing:-.02em;text-transform:none}
.vw-contact-form-section__heading p{max-width:680px;margin:16px 0 0;color:#606060;font:400 clamp(16px,1.15vw,18px)/1.55 var(--vw-font-body);text-transform:none}
.vw-contact-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px 28px;padding:clamp(24px,2.8vw,34px);border-radius:8px;background:#747473}
.vw-contact-field{display:grid;gap:8px;margin:0;color:#fff;font:500 14px/1.35 var(--vw-font-ui);letter-spacing:0;text-transform:none}
.vw-contact-field b{color:#fff;font-weight:500}
.vw-contact-field--full{grid-column:1/-1}
.vw-contact-field input,.vw-contact-field select,.vw-contact-field textarea{box-sizing:border-box;width:100%;min-width:0;min-height:52px;margin:0;border:1px solid transparent;border-radius:5px;background:#fff;color:#3f3f3f;padding:12px 14px;font:400 16px/1.4 var(--vw-font-ui);letter-spacing:0;text-transform:none;appearance:auto}
.vw-contact-field textarea{min-height:148px;resize:vertical}
.vw-contact-field input:focus-visible,.vw-contact-field select:focus-visible,.vw-contact-field textarea:focus-visible{outline:3px solid #ac162c;outline-offset:2px}
.vw-contact-field input[aria-invalid="true"],.vw-contact-field select[aria-invalid="true"],.vw-contact-field textarea[aria-invalid="true"]{border-color:#ac162c;box-shadow:0 0 0 2px #fff}
.vw-contact-privacy{display:flex;align-items:center;gap:14px;min-height:56px;margin:6px 0 0;border-radius:5px;background:#fff;color:#4f4f4f;padding:12px 16px;font:400 16px/1.45 var(--vw-font-ui);letter-spacing:0;text-transform:none}
.vw-contact-privacy input{width:20px;height:20px;flex:0 0 20px;margin:0;accent-color:#ac162c}
.vw-contact-privacy input:focus-visible,.vw-contact-privacy a:focus-visible{outline:3px solid #ac162c;outline-offset:3px}
.vw-contact-privacy a{color:#ac162c;font-weight:500;text-decoration:underline;text-decoration-color:#ac162c;text-decoration-thickness:2px;text-underline-offset:.18em}
.vw-contact-form__footer{display:grid;gap:14px;padding-top:0}
.vw-contact-form__feedback{color:#fff;font:400 15px/1.5 var(--vw-font-ui)}
.vw-contact-form__feedback:empty{display:none}
.vw-contact-form__feedback[data-state="success"]{font-weight:500}
.vw-contact-form button{display:inline-flex;align-items:center;justify-content:space-between;gap:30px;width:100%;min-height:52px;border:0;border-radius:5px;background:#ac162c;color:#fff;padding:0 20px;font:500 16px/1 var(--vw-font-ui);letter-spacing:0;text-transform:none;cursor:pointer;transition:transform .2s ease}
.vw-contact-form button>span:last-child{font-size:21px;transition:transform .2s ease}
.vw-contact-form button:focus-visible{outline:3px solid #fff;outline-offset:3px}
.vw-contact-form button:hover>span:last-child,.vw-contact-form button:focus-visible>span:last-child{transform:translateX(5px)}
.vw-contact-form button:active{transform:translateY(1px)}
.vw-contact-form button:disabled{cursor:wait;opacity:.7}
.vw-contact-location-section{margin-top:clamp(64px,8vw,104px)}
.vw-contact-location-section__heading{text-align:center}
.vw-contact-location-section__heading p{margin-bottom:16px}
.vw-contact-location-section__heading h2{margin:0;color:#565656;font:400 clamp(34px,3.15vw,44px)/1.12 var(--vw-font-editorial);letter-spacing:-.02em;text-transform:none}
.vw-contact-page__location{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(300px,.85fr);gap:24px;align-items:stretch;margin-top:34px}
.vw-contact-page__map-card{overflow:hidden;border:1px solid #d0d0ce;border-radius:6px;background:#dededb}
.vw-contact-page__map-slot,.vw-contact-page .page__map,.vw-contact-page .page__map--holder{width:100%;height:100%;min-height:430px;margin:0}
/* El CSS legado limita .page__map a 500px y crea el alto mediante padding.
   Dentro de la tarjeta nueva ambos valores dejan una franja gris y recortan el
   iframe; se neutralizan solo en la superficie de Contacto. */
.vw-contact-page .page__map{float:none;width:100%;max-width:none;margin:0}
.vw-contact-page .page__map--holder{position:relative;box-sizing:border-box;padding-top:0;background:#dededb}
.vw-contact-page .page__map--holder iframe{display:block;width:100%;height:100%;min-height:430px;border:0;filter:none!important}
.vw-contact-page__details{display:flex;flex-direction:column;gap:22px;border:1px solid #d0d0ce;border-radius:6px;background:#fff;color:#4f4f4f;padding:clamp(24px,3vw,34px);font-family:var(--vw-font-body)}
.vw-contact-location__row{display:grid;grid-template-columns:20px minmax(0,1fr);gap:14px;align-items:start}
.vw-contact-location__row+.vw-contact-location__row{border-top:1px solid #ddddda;padding-top:20px}
.vw-contact-icon{display:block;width:20px;height:20px;fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round;stroke-width:1.7}
.vw-contact-location__row>.vw-contact-icon{margin-top:3px;color:#ac162c}
.vw-contact-location__row h3{margin:0 0 6px;color:#4f4f4f;font:400 20px/1.2 var(--vw-font-editorial);text-transform:none}
.vw-contact-location__row address,.vw-contact-location__row a{display:block;margin:0;color:#5c5c5c;font:400 15px/1.55 var(--vw-font-body);font-style:normal;text-decoration:none}
.vw-contact-location__row a:hover,.vw-contact-location__row a:focus-visible{text-decoration:underline}
.vw-contact-location__row a:focus-visible,.vw-contact-location__action:focus-visible{outline:2px solid #ac162c;outline-offset:3px}
.vw-contact-page__details address span{display:block}
.vw-contact-location__actions{display:grid;gap:10px;margin-top:auto;padding-top:2px}
.vw-contact-location__action{display:flex;align-items:center;justify-content:center;gap:10px;min-height:48px;border:1px solid #c9c9c7;border-radius:5px;color:#4f4f4f;padding:0 16px;font:500 15px/1 var(--vw-font-ui);text-decoration:none;transition:transform .2s ease}
.vw-contact-location__action .vw-contact-icon{width:18px;height:18px}
.vw-contact-location__action--primary{border-color:#ac162c;background:#ac162c;color:#fff}
.vw-contact-location__action:active{transform:translateY(1px)}
@media(max-width:980px){.vw-contact-page__location{grid-template-columns:1fr}.vw-contact-page__map-slot,.vw-contact-page .page__map,.vw-contact-page .page__map--holder,.vw-contact-page .page__map--holder iframe{min-height:380px}}
/* La cabecera persistente móvil (logo + utilidades) ocupa la primera banda
   visual. Esta zona segura evita que cubra la etiqueta editorial en Chrome y
   Safari, sin alterar el flujo desktop. */
@media(max-width:720px){.vw-contact-page{padding-top:112px;padding-bottom:56px}.vw-contact-page__header{margin-bottom:42px}.vw-contact-page__eyebrow{margin-bottom:16px}.vw-contact-page__title{font-size:34px}.vw-contact-form-section{padding-top:24px}.vw-contact-form-section__heading{margin-bottom:24px}.vw-contact-form{grid-template-columns:1fr;gap:20px;padding:22px 18px}.vw-contact-field--full{grid-column:auto}.vw-contact-privacy{margin-top:8px;padding:12px 14px}.vw-contact-location-section{margin-top:64px}.vw-contact-page__location{margin-top:28px}.vw-contact-page__map-slot,.vw-contact-page .page__map,.vw-contact-page .page__map--holder,.vw-contact-page .page__map--holder iframe{min-height:320px}.vw-contact-page__details{padding:24px 20px}}
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
