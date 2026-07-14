import * as cheerio from "cheerio";
import { practiceAreas } from "@shared/schema";

function esc(s: string): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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
 * El HTML capturado de "Contacto" nunca tuvo un formulario real (solo un buscador roto)
 * pero el backend SÍ tiene un endpoint funcional (POST /api/contact) sin nada que lo
 * invoque. Este fix construye el formulario e lo inyecta en `.page__content--body`,
 * reusando las clases visuales del formulario de Pasantes para no meter CSS nuevo.
 */
export function applyContactForm($: cheerio.CheerioAPI, lang: "es" | "en"): void {
  const $body = $(".page__content--body").first();
  if (!$body.length || $body.find("#vwContactForm").length) return;

  const t = lang === "es"
    ? { name: "Nombre completo", email: "Correo electrónico", phone: "Teléfono (opcional)", company: "Empresa (opcional)", practice: "Área de interés (opcional)", message: "Mensaje", send: "Enviar", selectOption: "Selecciona una opción", required: "Completa nombre, correo y mensaje.", ok: "Gracias, tu mensaje fue enviado correctamente.", err: "Ocurrió un error, intenta de nuevo.", netErr: "Ocurrió un error de red, intenta de nuevo." }
    : { name: "Full name", email: "Email", phone: "Phone (optional)", company: "Company (optional)", practice: "Area of interest (optional)", message: "Message", send: "Send", selectOption: "Select an option", required: "Please fill in name, email and message.", ok: "Thank you, your message was sent successfully.", err: "An error occurred, please try again.", netErr: "A network error occurred, please try again." };

  const options = practiceAreas
    .map((pa) => `<option value="${esc(pa.value)}">${esc(lang === "es" ? pa.es : pa.en)}</option>`)
    .join("");

  const formHtml = `
<form id="vwContactForm" class="careers__form" style="max-width:500px;">
  <label class="careers__form--label">${t.name}:
    <input class="careers__form--input" name="fullName" type="text" required>
  </label>
  <label class="careers__form--label">${t.email}:
    <input class="careers__form--input" name="email" type="email" required>
  </label>
  <label class="careers__form--label">${t.phone}:
    <input class="careers__form--input" name="phone" type="text">
  </label>
  <label class="careers__form--label">${t.company}:
    <input class="careers__form--input" name="company" type="text">
  </label>
  <label class="careers__form--label">${t.practice}:
    <select class="careers__form--input" name="practiceArea">
      <option value="">${t.selectOption}</option>
      ${options}
    </select>
  </label>
  <label class="careers__form--label">${t.message}:
    <textarea class="careers__form--input" name="message" rows="4" required></textarea>
  </label>
  <label class="careers__form--label submit" style="margin-top:10px;">
    <input class="careers__form--submit" type="submit" value="${t.send}">
  </label>
  <div data-vw-feedback="1" style="margin-top:10px; font-size:13px;"></div>
</form>`;

  $body.append(formHtml);

  const script = `
<script>
(function () {
  function init() {
    var form = document.getElementById('vwContactForm');
    if (!form) return;
    var feedback = form.querySelector('[data-vw-feedback]');
    var submitLabel = form.querySelector('.submit');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      feedback.textContent = '';
      feedback.style.color = '#fff';
      var data = {
        fullName: form.fullName.value,
        email: form.email.value,
        phone: form.phone.value || undefined,
        company: form.company.value || undefined,
        practiceArea: form.practiceArea.value || undefined,
        message: form.message.value,
      };
      if (!data.fullName.trim() || !data.email.trim() || !data.message.trim()) {
        feedback.textContent = ${JSON.stringify(t.required)};
        return;
      }
      if (submitLabel) submitLabel.style.display = 'none';
      fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (res) { return res.json().catch(function () { return {}; }).then(function (d) { return { ok: res.ok, data: d }; }); })
        .then(function (result) {
          if (result.ok) {
            feedback.style.color = '#7CFC7C';
            feedback.textContent = ${JSON.stringify(t.ok)};
            form.reset();
          } else {
            if (submitLabel) submitLabel.style.display = '';
            feedback.style.color = '#fff';
            feedback.textContent = (result.data && result.data.error) || ${JSON.stringify(t.err)};
          }
        })
        .catch(function () {
          if (submitLabel) submitLabel.style.display = '';
          feedback.style.color = '#fff';
          feedback.textContent = ${JSON.stringify(t.netErr)};
        });
    }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
</script>`;

  $("body").append(script);
}
