import type { SiteConfigField } from "./contracts";

const TECHNICAL_TEXT_KEY = /(?:^ga4_|verification|favicon|_url$|_path$|_video|_image$|_master$|facebook|twitter|linkedin|phone|email|website|tts_|_pages$|_order$|_visible$|_layout$|_value$)/i;

export function isPublicTextField(field: SiteConfigField): boolean {
  return !field.media && !field.control && !TECHNICAL_TEXT_KEY.test(field.key);
}

export function typographyRoleFor(
  field: SiteConfigField,
): "editorial" | "body" | "ui" {
  if (/(?:_label$|_cta$|_success$|_error$|_required$|_more$|_next$|_previous$|_minimize$|_expand$|eyebrow)/i.test(field.key)) {
    return "ui";
  }
  if (/(?:title|subtitle|intro|quote|experience|team_stats)/i.test(field.key)) {
    return "editorial";
  }
  return "body";
}
