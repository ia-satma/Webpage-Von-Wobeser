import * as cheerio from "cheerio";
import { getLocalizedAttorneyRole, getLocalizedAttorneyTitle } from "@shared/attorneyTitles";
import { getAttorneyPublicName } from "@shared/attorneyName";
import { applySeo, personNode, breadcrumbNode, clip } from "./seo";
import { renderRichText } from "./sanitize";
import { typographyAttribute, type TypographyStyles } from "@shared/editorialTypography";

type Lang = "en" | "es";

type AttorneyRenderOptions = {
  /**
   * Global editorial control. It applies only to the Associate category and
   * leaves the bilingual source copy intact in the CMS.
   */
  associateExperienceVisible?: boolean;
};

/** Pick the EN or ES variant of a field, falling back to EN. */
function L(obj: any, base: string, lang: Lang): string {
  if (!obj) return "";
  if (lang === "es") return obj[base + "Es"] || obj[base] || "";
  return obj[base] || "";
}

function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const MONTHS: Record<Lang, string[]> = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  es: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
};

function fmtDate(value: unknown, lang: Lang): string {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  // Las fechas editoriales se guardan sin hora; leerlas en UTC evita que una
  // zona horaria occidental las recorra al mes anterior al renderizar.
  return `${MONTHS[lang][date.getUTCMonth()]}, ${date.getUTCFullYear()}`;
}

function profileEducation(a: any, lang: Lang): string[] {
  return (a.education || []).map((entry: any) => {
    const degree = esc(L(entry, "degree", lang));
    const school = esc(L(entry, "school", lang));
    return [degree, school].filter(Boolean).join(", ");
  }).filter(Boolean);
}

function profileRecognitions(a: any, lang: Lang): string[] {
  return (a.rankings || []).map((entry: any) => {
    const ranking = esc(L(entry, "ranking", lang));
    const publication = esc(L(entry, "publication", lang));
    return ranking ? `${ranking} — ${publication}` : publication;
  }).filter(Boolean);
}

function profileGroupLinks(groups: any[], kind: "practice" | "industry", lang: Lang): string[] {
  return groups.map((group) => {
    const name = esc(L(group, "name", lang));
    const slug = String(group?.slug || "").trim();
    if (!name) return "";
    const href = slug
      ? `/${kind}/${encodeURIComponent(slug)}${lang === "en" ? "?lang=en" : ""}`
      : "";
    return href ? `<a href="${href}">${name}</a>` : name;
  }).filter(Boolean);
}

/** The historic compact sidebar is intentionally preserved.  Its accordion
 * categories remain in the left grey column, while the new editorial content
 * lives only in the main reading column. */
function buildCompactSidebar(a: any, lang: Lang): string {
  const copy = lang === "es"
    ? {
      practices: "Áreas de práctica", industries: "Grupos de industria",
      education: "Educación y experiencia", affiliations: "Afiliaciones y actividades académicas",
      recognitions: "Reconocimientos", languages: "Idiomas",
    }
    : {
      practices: "Practices", industries: "Industry Groups",
      education: "Education & Experience", affiliations: "Affiliations & Academic Activities",
      recognitions: "Recognitions", languages: "Languages",
    };
  const section = (label: string, items: string[], attrs = "") =>
    items.length ? `<li>${esc(label)}<ul${attrs}>${items.map((item) => `<li>${item}</li>`).join("")}</ul></li>` : "";
  const education = profileEducation(a, lang);
  const recognitions = profileRecognitions(a, lang);
  const affiliations = (a.affiliations || []).map((entry: any) => {
    const organization = esc(L(entry, "organization", lang));
    const role = esc(L(entry, "role", lang));
    return organization ? (role ? `${organization} — ${role}` : organization) : "";
  }).filter(Boolean);
  const languages = ((lang === "es" ? a.languagesEs : a.languages) || a.languages || [])
    .map((entry: unknown) => esc(String(entry || "").trim()))
    .filter(Boolean);
  const items = [
    section(copy.practices, profileGroupLinks(a.practiceGroups || [], "practice", lang)),
    section(copy.industries, profileGroupLinks(a.industryGroups || [], "industry", lang)),
    section(copy.education, education),
    section(copy.affiliations, affiliations, ' id="affiliations"'),
    section(copy.recognitions, recognitions, ' id="recognitions"'),
    section(copy.languages, languages),
  ].join("");
  return `<div class="attorney__meta--list list_JS">` +
    `<p class="tel_print">${lang === "es" ? "Tel" : "Phone"}:${esc(a.phone || "")}<br>${esc(a.email || "")}</p>` +
    items +
    `</div>`;
}

/** Publicaciones propias: fecha descendente, con las sin fecha al final. El
 * repositorio aplica el mismo orden; esta capa lo mantiene incluso si un
 * llamador futuro entrega una colección ya materializada o reordenada. */
function chronologicalPublications(items: any[]): any[] {
  const dateValue = (item: any): number | null => {
    if (!item?.date) return null;
    const value = new Date(item.date).getTime();
    return Number.isNaN(value) ? null : value;
  };
  const stableKey = (item: any) => String(item?.legacyId || item?.id || item?.slug || "");
  return [...items].sort((left, right) => {
    const leftDate = dateValue(left);
    const rightDate = dateValue(right);
    if (leftDate !== null && rightDate !== null && leftDate !== rightDate) return rightDate - leftDate;
    if (leftDate !== null) return -1;
    if (rightDate !== null) return 1;
    return stableKey(right).localeCompare(stableKey(left), "en", { numeric: true });
  });
}

function insightCards(items: any[], labels: { read: string }, lang: Lang): string {
  return chronologicalPublications(items).map((item) => {
    const title = esc(L(item, "title", lang));
    const excerpt = renderRichText(L(item, "excerpt", lang));
    const href = `/news/${encodeURIComponent(String(item.slug || ""))}${lang === "en" ? "?lang=en" : ""}`;
    const date = fmtDate(item.date, lang);
    const dateTime = item.date && !Number.isNaN(new Date(item.date).getTime())
      ? new Date(item.date).toISOString().slice(0, 10)
      : "";
    const dateMarkup = date
      ? `<time datetime="${esc(dateTime)}">${esc(date)}</time>`
      : `<span>${lang === "es" ? "Fecha no disponible" : "Date unavailable"}</span>`;
    return `<article class="attorney-related-insights__item">` +
      `<div class="attorney-related-insights__body">` +
      `<div class="attorney-related-insights__meta">${dateMarkup}</div>` +
      `<h3><a href="${href}" aria-label="${esc(`${labels.read}: ${L(item, "title", lang)}`)}">${title}</a></h3>` +
      `<div class="attorney-related-insights__excerpt">${excerpt}</div>` +
      `<a class="attorney-related-insights__arrow" href="${href}" aria-hidden="true" tabindex="-1">→</a>` +
      `</div></article>`;
  }).join("");
}

function buildInsightsSection(opts: {
  items: any[];
  title: string;
  read: string;
  more: string;
  href: string;
  lang: Lang;
  description?: string;
}): string {
  if (!opts.items.length) return "";
  const description = opts.description ? `<p class="attorney-related-insights__description">${esc(opts.description)}</p>` : "";
  return `<section class="attorney-related-insights" id="attorney-publications" aria-labelledby="attorney-related-insights-title">` +
    `<div class="attorney-related-insights__header">` +
    `<h2 id="attorney-related-insights-title">${esc(opts.title)}</h2>${description}` +
    `<a class="attorney-related-insights__more" href="${esc(opts.href)}">${esc(opts.more)}</a>` +
    `</div><div class="attorney-related-insights__grid">${insightCards(opts.items, opts, opts.lang)}</div></section>`;
}

/** Publicaciones propias del sitio, respaldadas por la relación editorial del perfil. */
function buildAuthoredInsights(attorney: any, lang: Lang): string {
  const relatedNews: any[] = attorney.relatedNews || [];
  if (!relatedNews.length) return "";

  const labels = lang === "es"
    ? { title: "Perspectivas relacionadas", more: "Ver todas las publicaciones", read: "Leer publicación" }
    : { title: "Related insights", more: "View all publications", read: "Read publication" };
  const archiveParams = new URLSearchParams({ author: attorney.slug || "" });
  if (lang === "en") archiveParams.set("lang", "en");
  return buildInsightsSection({ ...labels, items: relatedNews, href: `/news?${archiveParams.toString()}`, lang });
}

/** Clearly labelled peer-practice reading for profiles without own publications. */
function buildPracticeReadings(attorney: any, lang: Lang): string {
  const readings: any[] = attorney.relatedReadings || [];
  if (!readings.length) return "";
  const practiceNames = (attorney.practiceGroups || []).map((practice: any) => L(practice, "name", lang)).filter(Boolean);
  const labels = lang === "es"
    ? { title: "Perspectivas relacionadas", more: "Ver todas las publicaciones", read: "Leer publicación" }
    : { title: "Related insights", more: "View all publications", read: "Read publication" };
  const description = practiceNames.length
    ? (lang === "es" ? `Contenido de integrantes de ${practiceNames.join(", ")}.` : `Published by members of ${practiceNames.join(", ")}.`)
    : undefined;
  return buildInsightsSection({ ...labels, items: readings, href: lang === "en" ? "/news?lang=en" : "/news", lang, description });
}

/** The full biography stays in the HTML and is revealed with native details.
 * The original sidebar keeps education, affiliations and recognitions. */
function buildBiographyDisclosure(opts: {
  bio: string;
  lang: Lang;
}): string {
  const copy = opts.lang === "es"
    ? { show: "Mostrar biografía completa", hide: "Ocultar biografía" }
    : { show: "Show full biography", hide: "Show less" };
  if (!opts.bio.trim()) return "";
  return `<details class="attorney-bio-disclosure" data-vw-attorney-bio>` +
    `<summary><span class="attorney-bio-disclosure__show">${esc(copy.show)}</span><span class="attorney-bio-disclosure__hide">${esc(copy.hide)}</span><span class="attorney-bio-disclosure__chevron" aria-hidden="true"></span></summary>` +
    `<div class="attorney-bio-disclosure__content"><div class="attorney__content--txt" id="attorney-experience">${opts.bio}</div></div></details>`;
}

/**
 * Separa el primer bloque (párrafo/lista/etc.) del resto de un HTML ya sanitizado — la
 * plantilla del perfil tiene dos zonas de texto distintas (intro destacada + cuerpo).
 */
function splitFirstBlock(html: string): { first: string; rest: string } {
  const $frag = cheerio.load(`<div>${html}</div>`);
  const $blocks = $frag("div").children();
  if (!$blocks.length) return { first: html, rest: "" };
  const first = $frag.html($blocks.first()) || "";
  const rest = $blocks
    .slice(1)
    .map((_, el) => $frag.html(el))
    .get()
    .join("");
  return { first, rest };
}

/**
 * Returns true when a sentence makes a quantified claim about the attorney's
 * experience. The canonical profiles use both digit and written numbers, so
 * the number itself is intentionally not restricted to a finite vocabulary.
 */
function hasExperienceYears(sentence: string, lang: Lang): boolean {
  const numberOrWord = "(?:\\d+|[A-Za-zÀ-ÖØ-öø-ÿ-]+)";
  const numberedYears = lang === "es"
    ? new RegExp(`\\b${numberOrWord}\\s+años?\\b[\\s\\S]{0,140}\\bexperiencia\\b`, "i")
    : new RegExp(`\\b${numberOrWord}\\s+years?\\b[\\s\\S]{0,140}\\b(?:professional\\s+)?experience\\b`, "i");
  if (numberedYears.test(sentence)) return true;

  // A small number of English biographies say “worked … years” rather than
  // “years of experience”. They represent the same claim and need to follow
  // the same visibility decision as their Spanish counterpart.
  return lang === "en" && new RegExp(`\\b(?:worked|working)\\b[\\s\\S]{0,50}\\b${numberOrWord}\\s+years?\\b`, "i").test(sentence);
}

/**
 * Hides only complete quantified-experience sentences at render time. The
 * stored bio remains untouched, so the Admin switch can restore it exactly.
 * Existing canonical copy uses plain paragraphs; for an edited rich-text
 * paragraph, the remaining text is safely serialized as text rather than
 * risking a partial HTML fragment after sentence removal.
 */
function hideAssociateExperienceYears(html: string, lang: Lang): string {
  if (!html.trim()) return html;

  const $fragment = cheerio.load(`<div data-vw-associate-bio>${html}</div>`);
  const $root = $fragment("[data-vw-associate-bio]");
  const segmenter = new Intl.Segmenter(lang === "es" ? "es" : "en", { granularity: "sentence" });

  $root.find("p, li").each((_, element) => {
    const text = $fragment(element).text().replace(/\s+/g, " ").trim();
    if (!text) return;

    const retained = Array.from(segmenter.segment(text), ({ segment }) => segment)
      .filter((sentence) => !hasExperienceYears(sentence, lang))
      .join("")
      .trim();

    if (retained === text) return;
    if (!retained) {
      $fragment(element).remove();
      return;
    }
    $fragment(element).text(retained);
  });

  return $root.html() || "";
}

/**
 * Takes the original mirror HTML of an attorney profile and injects the
 * given attorney record from our backend, preserving the original markup.
 */
export function renderAttorney(
  templateHtml: string,
  a: any,
  lang: Lang = "en",
  typography?: TypographyStyles,
  options: AttorneyRenderOptions = {},
): string {
  const $ = cheerio.load(templateHtml);
  $(".attorney").attr("data-vw-content-kind", "attorney");

  const name = getAttorneyPublicName(a);
  const role = getLocalizedAttorneyTitle(a, lang) || getLocalizedAttorneyRole(a, lang);
  const phone = a.phone || "";
  const email = a.email || "";
  const img = a.imageUrl || "";

  // --- Header card -------------------------------------------------------
  const $name = $(".attorney__meta--name").first();
  if ($name.length) {
    const nameAttributes = { ...($name.attr() || {}), ...typographyAttribute(typography, "name", lang) };
    $name.replaceWith($("<h1>").attr(nameAttributes).text(name));
  }
  $(".attorney__meta--role").attr(typographyAttribute(typography, lang === "es" ? "titleEs" : "title", lang)).text(role);

  const $img = $(".attorney__meta--img");
  if (img) {
    $img.attr("style", `background-image:url(${img});`);
    $img.find("img#foto").attr("src", img);
  }

  $(".attorney__meta--txt").html(
    `<p>${lang === "es" ? "Tel" : "Phone"}:${esc(phone)}<br>` +
      `<a href="mailto:${esc(email)}">${esc(email)}</a></p>`,
  );

  // --- Bio ---------------------------------------------------------------
  const bio = L(a, "bio", lang);
  const storedIntro = L(a, "bioIntro", lang);
  const hideExperienceYears = a.title === "Associate" && options.associateExperienceVisible === false;
  const renderBio = (value: string) => {
    const rendered = renderRichText(value);
    return hideExperienceYears ? hideAssociateExperienceYears(rendered, lang) : rendered;
  };
  const { first: legacyIntro, rest: legacyRest } = splitFirstBlock(renderBio(bio));
  const bioIntro = storedIntro ? renderBio(storedIntro) : legacyIntro;
  const bioRest = storedIntro ? renderBio(bio) : legacyRest;
  const disclosure = buildBiographyDisclosure({ bio: bioRest, lang });
  const $content = $(".attorney__content").first();
  const $intro = $content.find(".attorney__content--intro").first();
  $content.find(".attorney-bio-disclosure, .attorney-related-insights").remove();
  // La columna editorial queda reservada para la biografía y publicaciones;
  // no dejamos controles heredados debajo de ese bloque.
  $content.find(".attorney__content--btns").remove();
  $intro.attr(typographyAttribute(typography, lang === "es" ? "bioIntroEs" : "bioIntro", lang)).html(bioIntro);
  const $body = $content.find(".attorney__content--txt").first();
  if (disclosure) {
    $body.replaceWith(disclosure);
    $content.find(".attorney-bio-disclosure .attorney__content--txt")
      .attr(typographyAttribute(typography, lang === "es" ? "bioEs" : "bio", lang));
  } else {
    $body.attr(typographyAttribute(typography, lang === "es" ? "bioEs" : "bio", lang)).html(bioRest);
  }
  const relatedInsights = buildAuthoredInsights(a, lang) || buildPracticeReadings(a, lang);
  if (relatedInsights) {
    const $afterBiography = $content.find(".attorney-bio-disclosure").first().length
      ? $content.find(".attorney-bio-disclosure").first()
      : $body;
    $afterBiography.after(relatedInsights);
  }

  // --- Sidebar legado compacto ------------------------------------------
  const sidebar = buildCompactSidebar(a, lang);
  const $sidebar = $(".attorney__meta--list").first();
  if ($sidebar.length) $sidebar.replaceWith(sidebar);
  else $(".attorney__meta").append(sidebar);

  // --- Head metadata -----------------------------------------------------
  $('meta[name="Attorney"]').attr("content", name);
  $('meta[name="Position"]').attr("content", role);
  $('meta[name="Phone"]').attr("content", phone);
  $('meta[name="Mail"]').attr("content", email);
  $("html").attr("lang", lang === "es" ? "es-mx" : "en-gb");

  const path = `/lawyer/${a.slug}`;
  const desc =
    clip(bio) ||
    (lang === "es"
      ? `${name}${role ? `, ${role}` : ""} en Von Wobeser y Sierra, firma de abogados líder en México.`
      : `${name}${role ? `, ${role}` : ""} at Von Wobeser y Sierra, a leading Mexican law firm.`);
  applySeo($, {
    lang,
    path,
    title: `${name}${role ? ` — ${role}` : ""} | Von Wobeser y Sierra`,
    description: desc,
    image: img || undefined,
    type: "profile",
    jsonLd: [
      personNode({ name, jobTitle: role, image: img || undefined, path, email, telephone: phone, description: clip(bio) || undefined, lang }),
      breadcrumbNode(
        [
          { name: lang === "es" ? "Inicio" : "Home", path: "/" },
          { name: lang === "es" ? "Abogados" : "Attorneys", path: "/attorneys" },
          { name, path },
        ],
        lang,
      ),
    ],
  });

  return $.html();
}
