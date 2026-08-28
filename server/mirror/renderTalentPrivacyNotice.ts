import { TALENT_PRIVACY_NOTICE_CANDIDATES_2026_ES } from "../content/talentPrivacyNoticeCandidates2026";
import { type ConfigMap } from "./siteConfig";
import { renderPage } from "./renderPage";

export const TALENT_PRIVACY_NOTICE_PATH = "/aviso-de-privacidad-candidaturas";
export const TALENT_PRIVACY_NOTICE_TITLE = "Aviso de Privacidad para Candidaturas";

/**
 * The supplied candidate notice is a Spanish-only legal source. The generic
 * privacy notice remains entirely separate; Talent forms point here instead.
 */
export function renderTalentPrivacyNotice(templateHtml: string, config: ConfigMap): string {
  const suppliedContent = config.page_talent_privacy_body?.value?.trim()
    || config.page_talent_privacy_body?.valueEs?.trim()
    || TALENT_PRIVACY_NOTICE_CANDIDATES_2026_ES;
  const localizedConfig: ConfigMap = {
    ...config,
    page_talent_privacy_body: {
      value: suppliedContent,
      valueEs: suppliedContent,
      type: "richtext",
    },
  };

  return renderPage(
    templateHtml,
    localizedConfig,
    "es",
    { body: "page_talent_privacy_body" },
    {
      path: TALENT_PRIVACY_NOTICE_PATH,
      title: `${TALENT_PRIVACY_NOTICE_TITLE} | Von Wobeser y Sierra`,
      description: "Aviso de privacidad aplicable a candidaturas y solicitudes de Talento de Von Wobeser y Sierra.",
      // Legal entregó sólo la versión española: no se debe declarar un
      // equivalente EN inexistente ni ofrecer una traducción no aprobada.
      availableLanguages: "es",
    },
    ($) => {
      $(".page__ttl--holder span,.page__ttl--holder h1,.page__ttl--holder h2").first().text(TALENT_PRIVACY_NOTICE_TITLE);
      $("body").addClass("vwb-talent-privacy-notice");
    },
  );
}
