import * as cheerio from "cheerio";
import { isVisiblePublicPractice } from "./publicPracticeGroups";
import { cfg, type ConfigMap } from "./siteConfig";

function esc(s: string): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function jsString(s: string): string {
  return JSON.stringify(s).replace(/</g, "\\u003c");
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
 * Inserta el formulario de Contacto como un bloque editorial independiente, debajo de la
 * información y el mapa. Sus textos vienen de siteConfig y sus áreas de interés de las
 * prácticas publicadas; no reutiliza el ancho rígido del formulario de Pasantes.
 */
export function applyContactForm(
  $: cheerio.CheerioAPI,
  lang: "es" | "en",
  config: ConfigMap = {},
  practices: Array<{ slug: string; name: string; nameEs: string; published?: boolean | null }> = [],
): void {
  const $wrap = $(".page .page--wrap").first();
  if (!$wrap.length || $wrap.find("#vwContactForm").length) return;
  // Corrige únicamente la frase híbrida exacta al renderizar español. No escribe en
  // site_config, de modo que el contenido personalizado del administrador permanece intacto.
  if (lang === "es") {
    const $contactCopy = $wrap.find(".page__content--body").first();
    const currentHtml = $contactCopy.html();
    if (currentHtml?.includes("Torre SOMA Chapultepec 18th floor.")) {
      $contactCopy.html(currentHtml.replaceAll("Torre SOMA Chapultepec 18th floor.", "Torre SOMA Chapultepec, piso 18."));
    }
  }

  const defaults = lang === "es"
    ? {
        title: "Envíanos un mensaje",
        description: "Déjanos tus datos y el área en la que necesitas asesoría. Nuestro equipo se pondrá en contacto contigo.",
        name: "Nombre completo",
        email: "Correo electrónico",
        phone: "Teléfono (opcional)",
        company: "Empresa (opcional)",
        practice: "Área de interés (opcional)",
        message: "Mensaje",
        send: "Enviar mensaje",
        sending: "Enviando…",
        selectOption: "Selecciona una opción",
        required: "Completa nombre, correo y mensaje.",
        invalidEmail: "Escribe un correo electrónico válido.",
        ok: "Gracias, tu mensaje fue enviado correctamente.",
        err: "No fue posible enviar tu mensaje. Intenta de nuevo.",
        netErr: "No pudimos conectarnos. Revisa tu conexión e intenta de nuevo.",
      }
    : {
        title: "Send us a message",
        description: "Share your details and the area in which you need advice. Our team will contact you.",
        name: "Full name",
        email: "Email",
        phone: "Phone (optional)",
        company: "Company (optional)",
        practice: "Area of interest (optional)",
        message: "Message",
        send: "Send message",
        sending: "Sending…",
        selectOption: "Select an option",
        required: "Please fill in name, email and message.",
        invalidEmail: "Enter a valid email address.",
        ok: "Thank you, your message was sent successfully.",
        err: "Your message could not be sent. Please try again.",
        netErr: "We could not connect. Check your connection and try again.",
      };
  const text = (key: string, fallback: string) => cfg(config, key, lang).trim() || fallback;
  const t = {
    title: text("contact_form_title", defaults.title),
    description: text("contact_form_description", defaults.description),
    name: text("contact_form_name_label", defaults.name),
    email: text("contact_form_email_label", defaults.email),
    phone: text("contact_form_phone_label", defaults.phone),
    company: text("contact_form_company_label", defaults.company),
    practice: text("contact_form_practice_label", defaults.practice),
    message: text("contact_form_message_label", defaults.message),
    send: text("contact_form_submit_label", defaults.send),
    sending: text("contact_form_sending_label", defaults.sending),
    selectOption: text("contact_form_select_label", defaults.selectOption),
    required: text("contact_form_required_message", defaults.required),
    invalidEmail: text("contact_form_invalid_email_message", defaults.invalidEmail),
    ok: text("contact_form_success_message", defaults.ok),
    err: text("contact_form_error_message", defaults.err),
    netErr: text("contact_form_network_error_message", defaults.netErr),
  };

  const options = practices
    .filter(isVisiblePublicPractice)
    .sort((a, b) => (lang === "es" ? a.nameEs : a.name).localeCompare(lang === "es" ? b.nameEs : b.name))
    .map((practice) => `<option value="${esc(practice.slug)}">${esc(lang === "es" ? practice.nameEs || practice.name : practice.name)}</option>`)
    .join("");

  const formHtml = `
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
    <label class="vw-contact-field vw-contact-field--full">
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
    <div class="vw-contact-form__footer vw-contact-field--full">
      <div class="vw-contact-form__feedback" data-vw-feedback role="status" aria-live="polite"></div>
      <button type="submit" data-idle-label="${esc(t.send)}" data-loading-label="${esc(t.sending)}">
        <span>${esc(t.send)}</span><span aria-hidden="true">→</span>
      </button>
    </div>
  </form>
</section>`;

  $wrap.append(formHtml);
  $("head").append(`
<style id="vw-contact-form-style">
.vw-contact-form-section{width:100%;flex:0 0 100%;margin:72px 0 30px;padding-top:34px;border-top:2px solid #b51d35}
.vw-contact-form-section__heading{display:grid;grid-template-columns:minmax(260px,.75fr) minmax(0,1fr);gap:48px;align-items:start;margin-bottom:32px}
.vw-contact-form-section__heading h2{margin:0;color:#606060;font:400 clamp(34px,4vw,54px)/1.04 "Publico-Roman",Georgia,serif}
.vw-contact-form-section__heading p{max-width:620px;margin:7px 0 0;color:#606060;font:400 17px/1.55 "Geomanist-Book",Arial,sans-serif}
.vw-contact-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:26px 34px;padding:42px;background:#858585}
.vw-contact-field{display:grid;gap:10px;margin:0;color:#fff;font:500 12px/1.3 "Geomanist-Book",Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase}
.vw-contact-field b{color:#fff;font-weight:400}
.vw-contact-field--full{grid-column:1/-1}
.vw-contact-field input,.vw-contact-field select,.vw-contact-field textarea{box-sizing:border-box;width:100%;min-width:0;min-height:48px;margin:0;border:1px solid transparent;border-radius:0;background:#fff;color:#3f3f3f;padding:12px 14px;font:400 16px/1.4 "Geomanist-Book",Arial,sans-serif;letter-spacing:0;text-transform:none;appearance:auto}
.vw-contact-field textarea{min-height:152px;resize:vertical}
.vw-contact-field input:focus-visible,.vw-contact-field select:focus-visible,.vw-contact-field textarea:focus-visible,.vw-contact-form button:focus-visible{outline:3px solid #fff;outline-offset:3px}
.vw-contact-field input[aria-invalid="true"],.vw-contact-field textarea[aria-invalid="true"]{border-color:#b51d35;box-shadow:0 0 0 2px #fff}
.vw-contact-form__footer{display:flex;align-items:center;justify-content:space-between;gap:30px;padding-top:6px}
.vw-contact-form__feedback{min-height:24px;color:#fff;font:400 15px/1.5 "Geomanist-Book",Arial,sans-serif}
.vw-contact-form__feedback[data-state="success"]{color:#fff;font-weight:600}
.vw-contact-form button{display:inline-flex;align-items:center;justify-content:space-between;gap:30px;min-width:220px;min-height:52px;border:0;border-radius:0;background:#b51d35;color:#fff;padding:0 24px;font:500 13px/1 "Geomanist-Book",Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;cursor:pointer}
.vw-contact-form button>span:last-child{font-size:21px;transition:transform .2s ease}
.vw-contact-form button:hover>span:last-child,.vw-contact-form button:focus-visible>span:last-child{transform:translateX(5px)}
.vw-contact-form button:disabled{cursor:wait;opacity:.7}
@media(max-width:1080px){.vw-contact-form-section{margin-top:52px}.vw-contact-form-section__heading{grid-template-columns:1fr;gap:12px}}
@media(max-width:720px){.vw-contact-form-section{margin-top:40px;padding-top:26px}.vw-contact-form{grid-template-columns:1fr;gap:22px;padding:28px 22px}.vw-contact-field--full{grid-column:auto}.vw-contact-form__footer{align-items:stretch;flex-direction:column}.vw-contact-form button{width:100%;min-width:0;min-height:52px}}
@media(prefers-reduced-motion:reduce){.vw-contact-form button>span:last-child{transition:none}}
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
        practiceArea: form.practiceArea.value || undefined,
        message: form.message.value,
      };
      var missing = !data.fullName.trim() || !data.email.trim() || !data.message.trim();
      setInvalid(form.fullName, !data.fullName.trim());
      setInvalid(form.email, !data.email.trim() || !form.email.validity.valid);
      setInvalid(form.message, !data.message.trim());
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
