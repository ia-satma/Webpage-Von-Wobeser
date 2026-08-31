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
export function applyCareersFormFix(
  $: cheerio.CheerioAPI,
  lang: "es" | "en" = "en",
  config: ConfigMap = {},
): void {
  // La abreviatura de marca en la etiqueta editorial se mantiene breve y es
  // independiente de los nombres largos usados en copys legales o SEO.
  const $legacyLabel = $(".careers__meta .page__ttl--holder > span").first();
  const isInterns = /pasantes|interns/i.test($legacyLabel.text());
  $legacyLabel.text(
    isInterns
      ? (lang === "es" ? "PASANTES" : "LEGAL INTERNS")
      : (lang === "es" ? "CARRERA EN VW" : "CAREER AT VW"),
  );

  // La plantilla en inglés capturada tiene un segundo enlace a "Privacy Notice." (pie de
  // página, fuera del formulario) que por un error del sitio original apunta al aviso en
  // ESPAÑOL (/index.php/aviso/) en vez de al propio (/index.php/privacy/). El enlace del
  // checkbox obligatorio ya estaba bien — este es solo el del copyright del pie.
  if (lang === "en") {
    $('a[href="/index.php/aviso/index.html"]').attr("href", "/index.php/privacy/index.html");
  }

  const $form = $("#careersForm");
  if (!$form.length) return;

  // El contenido y el formulario siguen siendo los heredados/editables. Solo
  // se promueve la primera introducción a una cabecera editorial común con
  // Contacto, Prácticas e Industrias. De ese modo Administración conserva una
  // única fuente para cada texto y no se duplica la introducción en pantalla.
  const $wrap = $form.parent(".careers--wrap").first();
  const $meta = $wrap.children(".careers__meta").first();
  if ($wrap.length && $meta.length && !$wrap.children(".vw-careers-header").length) {
    const headerCopy = isInterns
      ? (lang === "es"
        ? { eyebrow: "Talento", title: "Pasantes", fallback: "Conoce nuestro programa de pasantes." }
        : { eyebrow: "Talent", title: "Legal interns", fallback: "Learn about our legal interns program." })
      : (lang === "es"
        ? { eyebrow: "Talento", title: cfg(config, "page_careers_title", lang) || "Tu carrera en Von Wobeser y Sierra", fallback: "Conoce las oportunidades para formar parte de nuestro equipo." }
        : { eyebrow: "Talent", title: cfg(config, "page_careers_title", lang) || "Your career at Von Wobeser y Sierra", fallback: "Learn about opportunities to join our team." });
    const $content = $meta.children(".careers__content").first();
    const $lead = $content.children(".page__content--intro").first();
    const $header = $("<header>").addClass("vw-careers-header").attr("aria-labelledby", "vw-careers-page-title");
    const $description = $("<div>").addClass("vw-careers-header__description page__content--intro");

    if ($lead.length) {
      $description.html($lead.html() || "");
      $lead.remove();
    } else {
      $description.append($("<p>").text(headerCopy.fallback));
    }

    $header
      .append($("<p>").addClass("vw-careers-header__eyebrow").text(headerCopy.eyebrow))
      .append($("<h1>").attr("id", "vw-careers-page-title").text(headerCopy.title))
      .append($description)
      .append($("<span>").addClass("vw-careers-header__rule").attr("aria-hidden", "true"));

    $meta.children(".page__ttl").first().remove();
    $meta.addClass("vw-careers-copy");
    $wrap.addClass("vw-careers-layout");

    // En "Carrera en VW" el último destacado es un llamado al formulario,
    // no otro encabezado. Lo marcamos de forma semántica para que en móvil
    // conserve énfasis sin competir con el cuerpo del contenido ni quedar
    // separado del formulario. El contenido continúa siendo el heredado y
    // editable: no se sustituye ni se duplica ningún texto.
    if (!isInterns) {
      $content.children(".careers__content--intro, .page__content--intro").last().addClass("vw-careers-copy__cta");
    }

    $meta.before($header);
  }

  const copy = lang === "es"
    ? {
        required: "Completa nombre, apellido, correo, adjunta tu hoja de vida y acepta el Aviso de Privacidad para Candidaturas.",
        success: "Gracias, tu solicitud fue enviada correctamente.",
        error: "Ocurrió un error, intenta de nuevo.",
        network: "Ocurrió un error de red, intenta de nuevo.",
        fileEmpty: "Ningún archivo seleccionado",
        upload: "Adjunta tu hoja de vida",
        privacyIntro: "He leído y acepto el",
        // El destino es el aviso específico de candidaturas, pero dentro del
        // checkbox usamos la etiqueta legal breve para no romper la lectura.
        privacyLink: "Aviso de Privacidad",
      }
    : {
        required: "Complete your name, last name and email, attach your résumé, and accept the Privacy Notice for Candidates.",
        success: "Thank you, your application was sent successfully.",
        error: "Something went wrong. Please try again.",
        network: "A network error occurred. Please try again.",
        fileEmpty: "No file selected",
        upload: "Attach your résumé",
        privacyIntro: "I have read and accept the",
        privacyLink: "Privacy Notice",
      };

  // Conservamos nombres, campos y endpoint del formulario original. La clase es
  // intencionalmente específica: permite adoptar el sistema visual de Contacto
  // sin alterar formularios heredados de otras plantillas.
  $form
    .attr("action", "/api/career-applications") // defensivo, por si el JS no corre
    .attr("novalidate", "")
    .addClass("vw-careers-form");
  if (!isInterns) $form.addClass("vw-careers-form--culture");
  $form.find('[name="name"]').attr({ autocomplete: "given-name", required: "" });
  $form.find('[name="l_name"]').attr({ autocomplete: "family-name", required: "" });
  $form.find('[name="mail"]').attr({ autocomplete: "email", required: "" });
  $form.find('[name="tel"]').attr({ autocomplete: "tel" });
  $form.find('[name="accept"]').attr("required", "");
  // Dirección ya no se solicita en los formularios de Talento. Conservamos
  // las direcciones de solicitudes históricas en Administración, pero el
  // campo se retira completamente antes de que el formulario se renderice o
  // pueda enviarse.
  $form.find('[name="comment"]').each((_, field) => {
    const $field = $(field);
    const $fieldLabel = $field.closest(".careers__form--label, label");
    if ($fieldLabel.length) $fieldLabel.remove();
    else $field.remove();
  });
  $form.find(".careers__form--button")
    .addClass("vw-careers-form__upload")
    .find("span")
    .first()
    .text(copy.upload);
  const $privacyLabel = $form.find(".careers__form--label.checkbox").addClass("vw-careers-form__privacy");
  const $privacyText = $privacyLabel.find("span").first();
  if ($privacyText.length) {
    $privacyText.empty().append(`${copy.privacyIntro} `);
    $privacyText.append(
      $("<a>")
        .attr({
          href: "/aviso-de-privacidad-candidaturas",
          target: "_blank",
          rel: "noopener noreferrer",
          hreflang: "es",
        })
        .text(copy.privacyLink),
    );
    $privacyLabel.attr("data-vw-privacy-notice", "talent-candidates");
  }
  $form.find(".careers__form--label.submit").removeAttr("style").addClass("vw-careers-form__submit");
  $form.find("#filename")
    .removeAttr("style")
    .addClass("vw-careers-form__filename")
    .attr({ placeholder: copy.fileEmpty, "aria-live": "polite" });
  $form.find("p").last().removeAttr("style").addClass("vw-careers-form__help");
  $form.find(".loader").addClass("vw-careers-form__loader");

  if (!$("#vw-careers-form-style").length) {
    $("head").append(`
<style id="vw-careers-form-style">
.page.careers{padding:clamp(6rem,7vw,7.5rem) 0 64px!important;overflow-x:clip}
.page.careers .careers--wrap.vw-careers-layout{display:grid!important;box-sizing:border-box;width:min(100%,100vw)!important;inline-size:min(100%,100vw)!important;max-width:100%;max-inline-size:100vw;min-width:0;min-inline-size:0;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(34px,5vw,72px);align-items:start}
.page.careers .vw-careers-header{grid-column:1/-1;box-sizing:border-box;width:100%;max-width:100%;min-width:0;margin:0 0 clamp(30px,3.5vw,44px);padding:0;color:#5a5a5a;text-align:center}
.page.careers .vw-careers-header__eyebrow{margin:0 0 15px;color:#ac162c;font:500 12px/1.2 var(--vw-font-ui);letter-spacing:.24em;text-transform:uppercase}
.page.careers .vw-careers-header h1{margin:0;color:#595959;font:400 clamp(40px,4.5vw,58px)/1.08 var(--vw-font-editorial);letter-spacing:-.025em;text-transform:none}
.page.careers .vw-careers-header__description{max-width:720px!important;width:auto!important;margin:18px auto 0!important;border:0!important;color:#626262;font:400 clamp(16px,1.35vw,19px)/1.58 var(--vw-font-body);letter-spacing:0;text-align:center;text-transform:none}
.page.careers .vw-careers-header__description p{margin:0!important}
.page.careers .vw-careers-header__rule{display:block;width:100%;height:1px;margin:clamp(23px,2.4vw,32px) 0 0;background:#ac162c}
.page.careers .vw-careers-copy{grid-column:1;box-sizing:border-box;width:auto!important;max-width:none!important;min-width:0;margin:0!important;display:block!important}
.page.careers .vw-careers-copy .careers__content{width:100%!important;max-width:100%;min-width:0}
.page.careers .vw-careers-copy .careers__content p{max-width:100%;overflow-wrap:anywhere;margin:0 0 18px;color:#616161;font:400 16px/1.68 var(--vw-font-body);letter-spacing:0;text-transform:none}
.page.careers .vw-careers-copy .careers__content--intro{margin:0 0 18px;border:0!important;color:#565656;font:400 clamp(24px,2.25vw,31px)/1.18 var(--vw-font-editorial);letter-spacing:-.015em;text-transform:none}
.page.careers .vw-careers-copy .careers__content--intro p{color:inherit;font:inherit;line-height:inherit}
.page.careers .vw-careers-copy .vw-careers-copy__cta{margin:26px 0 0!important;border:0!important;color:#616161;font:400 16px/1.68 var(--vw-font-body);letter-spacing:0;text-transform:none}.page.careers .vw-careers-copy .vw-careers-copy__cta p{margin:0!important;color:inherit!important;font:inherit!important;line-height:inherit!important}
.page.careers .vw-careers-form{box-sizing:border-box;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px 20px;width:calc(50% - 30px)!important;max-width:540px!important;min-width:0;height:auto!important;align-self:flex-start;margin:0 0 0 auto!important;padding:clamp(24px,2.8vw,34px)!important;border-radius:8px;background:#747473;color:#fff;scroll-margin-top:104px}
.page.careers .vw-careers-layout>.vw-careers-form{grid-column:2;width:100%!important;justify-self:end}
.page.careers .vw-careers-form,.page.careers .vw-careers-form *,.page.careers .vw-careers-form *::before,.page.careers .vw-careers-form *::after{box-sizing:border-box}
.page.careers .vw-careers-form .careers__form--label{display:flex;flex-direction:column;width:auto!important;max-width:100%;min-width:0;min-inline-size:0;gap:8px;margin:0!important;float:none!important;color:#fff;font:500 14px/1.35 var(--vw-font-ui);letter-spacing:0;text-transform:none}
.page.careers .vw-careers-form .careers__form--input{box-sizing:border-box;display:block;width:100%!important;max-width:100%;min-width:0;min-inline-size:0;min-height:52px;margin:0!important;border:1px solid transparent;border-radius:5px;background:#fff;color:#3f3f3f;padding:12px 14px;font:400 16px/1.4 var(--vw-font-ui);letter-spacing:0;text-transform:none}
.page.careers .vw-careers-form .careers__form--input:focus-visible,.page.careers .vw-careers-form .careers__form--checkbox:focus-visible,.page.careers .vw-careers-form .careers__form--submit:focus-visible,.page.careers .vw-careers-form .vw-careers-form__upload:focus-within{outline:3px solid #ac162c;outline-offset:3px}
.page.careers .vw-careers-form .vw-careers-form__upload{grid-column:1/-1;display:flex;align-items:center;width:100%;min-height:52px;box-sizing:border-box;margin:0!important;border:1px solid transparent;border-radius:5px;background:#fff;color:#3f3f3f;padding:0 14px;font:400 16px/1.4 var(--vw-font-ui);letter-spacing:0;text-transform:none}
.page.careers .vw-careers-form .vw-careers-form__upload span{display:inline-flex;align-items:center;justify-content:center;min-height:32px;border-radius:4px;background:#ac162c;color:#fff;padding:0 13px;font:500 14px/1 var(--vw-font-ui);letter-spacing:0;text-transform:none}
.page.careers .vw-careers-form .vw-careers-form__filename{grid-column:1/-1;box-sizing:border-box;display:block;width:100%!important;min-height:24px;margin:-10px 0 0!important;border:0!important;background:transparent!important;color:#fff!important;padding:0!important;font:400 14px/1.45 var(--vw-font-ui)!important;letter-spacing:0!important;text-transform:none!important}
.page.careers .vw-careers-form .vw-careers-form__filename::placeholder{color:rgba(255,255,255,.78);opacity:1}
.page.careers .vw-careers-form .vw-careers-form__privacy{grid-column:1/-1;display:flex;flex-direction:row;align-items:center;justify-content:flex-start!important;gap:14px;min-height:56px;box-sizing:border-box;margin:2px 0 0!important;border-radius:5px;background:#fff;color:#4f4f4f;padding:12px 16px;font:400 16px/1.45 var(--vw-font-ui);letter-spacing:0;text-align:left!important;text-transform:none}
.page.careers .vw-careers-form .vw-careers-form__privacy .careers__form--checkbox{appearance:auto;width:20px;height:20px;flex:0 0 20px;margin:0;border:0;border-radius:0;accent-color:#ac162c}
.page.careers .vw-careers-form .vw-careers-form__privacy span{display:block;width:auto!important;max-width:100%;min-width:0;min-inline-size:0;margin:0!important;line-height:1.45;overflow-wrap:anywhere;text-align:left!important}.page.careers .vw-careers-form .vw-careers-form__privacy a{color:#ac162c;font-weight:500;text-decoration:underline;text-decoration-color:#ac162c;text-decoration-thickness:2px;text-underline-offset:.18em}
.page.careers .vw-careers-form .vw-careers-form__submit{grid-column:1/-1;display:block;position:relative;width:100%;margin:0!important;border:0!important;padding:0!important}
.page.careers .vw-careers-form .careers__form--submit{display:block;width:100%;min-height:52px;border:0;border-radius:5px;background:#ac162c;color:#fff;padding:0 56px 0 20px;font:500 16px/1 var(--vw-font-ui);letter-spacing:0;text-align:center;text-transform:none;cursor:pointer;transition:transform .2s ease}
.page.careers .vw-careers-form .vw-careers-form__submit::after{content:"→";position:absolute;right:20px;top:50%;font-size:21px;line-height:1;pointer-events:none;transform:translateY(-50%);transition:transform .2s ease}.page.careers .vw-careers-form .vw-careers-form__submit:hover::after,.page.careers .vw-careers-form .vw-careers-form__submit:focus-within::after{transform:translate(5px,-50%)}.page.careers .vw-careers-form .careers__form--submit:active{transform:translateY(1px)}
.page.careers .vw-careers-form .vw-careers-form__help{grid-column:1/-1;max-width:100%;min-width:0;min-inline-size:0;margin:0!important;color:#fff!important;font:400 14px/1.5 var(--vw-font-ui)!important;letter-spacing:0!important;overflow-wrap:anywhere;text-transform:none!important}.page.careers .vw-careers-form .vw-careers-form__help a{color:#fff!important;overflow-wrap:anywhere;text-decoration:underline;text-underline-offset:.18em}.page.careers .vw-careers-form .vw-careers-form__loader{grid-column:1/-1;width:30px;margin:0 auto!important}
.page.careers .vw-careers-form [data-vw-feedback]{grid-column:1/-1;margin:0;color:#fff;font:400 15px/1.5 var(--vw-font-ui)}.page.careers .vw-careers-form [data-vw-feedback]:empty{display:none}.page.careers .vw-careers-form input[aria-invalid="true"]{border-color:#ac162c;box-shadow:0 0 0 2px #fff}
@media(max-width:980px){.page.careers{padding:5.75rem 0 56px!important}.page.careers .careers--wrap.vw-careers-layout{grid-template-columns:1fr;gap:0}.page.careers .vw-careers-header{margin-bottom:2rem;padding-bottom:0}.page.careers .vw-careers-copy{grid-column:1}.page.careers .vw-careers-layout>.vw-careers-form{grid-column:1;justify-self:stretch}.page.careers .vw-careers-form{width:min(100%,600px)!important;max-width:600px!important;margin:2.5rem auto 0!important}}
@media(max-width:680px){.page.careers{padding:5.25rem 0 48px!important;overflow-x:clip}.page.careers .careers--wrap.vw-careers-layout{width:min(100%,100vw)!important;inline-size:min(100%,100vw)!important;max-width:100vw!important;max-inline-size:100vw!important;margin-left:0!important;margin-right:0!important;padding-inline:clamp(18px,5.65vw,22px)!important;min-width:0;min-inline-size:0}.page.careers .vw-careers-header,.page.careers .vw-careers-copy,.page.careers .vw-careers-copy .careers__content,.page.careers .vw-careers-form{min-width:0;min-inline-size:0;max-width:100%;max-inline-size:100%}.page.careers .vw-careers-copy .careers__content p,.page.careers .vw-careers-header__description{overflow-wrap:anywhere}.page.careers .vw-careers-form{grid-template-columns:minmax(0,1fr);gap:20px;width:100%!important;inline-size:100%!important;max-width:100%!important;max-inline-size:100%!important;margin-top:2.5rem!important;padding:22px 18px!important}.page.careers .vw-careers-form--culture{margin-top:1.5rem!important}.page.careers .vw-careers-form .careers__form--label,.page.careers .vw-careers-form .vw-careers-form__upload,.page.careers .vw-careers-form .vw-careers-form__filename,.page.careers .vw-careers-form .vw-careers-form__privacy,.page.careers .vw-careers-form .vw-careers-form__submit,.page.careers .vw-careers-form .vw-careers-form__help,.page.careers .vw-careers-form .vw-careers-form__loader,.page.careers .vw-careers-form [data-vw-feedback]{grid-column:auto;width:100%!important;inline-size:100%!important;max-width:100%!important;max-inline-size:100%!important;min-width:0;min-inline-size:0}.page.careers .vw-careers-form .careers__form--input,.page.careers .vw-careers-form .careers__form--submit{max-width:100%!important;max-inline-size:100%!important;min-width:0;min-inline-size:0}.page.careers .vw-careers-form .vw-careers-form__privacy{align-items:flex-start;font-size:15px}.page.careers .vw-careers-form .vw-careers-form__filename{margin-top:-8px!important}}
@media(prefers-reduced-motion:reduce){.page.careers .vw-careers-form .careers__form--submit,.page.careers .vw-careers-form .careers__form--submit::after{transition:none}}
</style>`);
  }

  const script = `
<script>
(function () {
  function init() {
    var form = document.getElementById('careersForm');
    if (!form) return;
    var loader = form.querySelector('.loader');
    var submitLabel = form.querySelector('.submit');
    var fileInput = form.querySelector('[name="uploaded_file"]');
    var fileName = form.querySelector('#filename');
    var feedback = document.createElement('div');
    feedback.setAttribute('data-vw-feedback', '1');
    (loader || form).parentNode.insertBefore(feedback, loader || null);

    if (fileInput && fileName) {
      fileInput.addEventListener('change', function () {
        fileName.value = fileInput.files && fileInput.files.length ? fileInput.files[0].name : '';
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      feedback.textContent = '';
      feedback.style.color = '#fff';

      var name = (form.querySelector('[name="name"]') || {}).value || '';
      var lName = (form.querySelector('[name="l_name"]') || {}).value || '';
      var mail = (form.querySelector('[name="mail"]') || {}).value || '';
      var accept = (form.querySelector('[name="accept"]') || {}).checked;

      if (!name.trim() || !lName.trim() || !mail.trim() || !fileInput || !fileInput.files || !fileInput.files.length || !accept) {
        feedback.textContent = ${jsString(copy.required)};
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
            feedback.textContent = ${jsString(copy.success)};
            form.reset();
            if (fileName) fileName.value = '';
          } else {
            if (submitLabel) submitLabel.style.display = '';
            feedback.textContent = (result.data && result.data.error) || ${jsString(copy.error)};
          }
        })
        .catch(function () {
          if (loader) loader.style.display = 'none';
          if (submitLabel) submitLabel.style.display = '';
          feedback.textContent = ${jsString(copy.network)};
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
