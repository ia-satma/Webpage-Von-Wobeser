import type { Express, Response } from "express";
import * as cheerio from "cheerio";
import { getCookieConsentConfig } from "../../privacy/cookieConsent";
import { applyCareersFormFix } from "../formsFix";
import { renderPage } from "../renderPage";
import { applyA11y } from "../seo";
import { getConfigMap, type ConfigMap } from "../siteConfig";
import type { Lang } from "../htmlPipeline";
import type { MirrorRuntime } from "../runtime";
import { createLegacyRedirect } from "./legacyRedirect";

export function registerMirrorInstitutionalRoutes(app: Express, runtime: MirrorRuntime): void {
  const {
    TEMPLATES,
    applyInternsContent,
    langOf,
    pick,
    sendPage,
    serveFirmLanding,
    serveGroupList,
    servePage,
    tpl,
    wrap,
  } = runtime;
  const redirectLegacy = createLegacyRedirect(langOf);

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

}
