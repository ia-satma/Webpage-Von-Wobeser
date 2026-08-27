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

/** Build the inner HTML of the `.attorney__meta--list` block from DB data. */
function buildMetaList(a: any, lang: Lang): string {
  const blocks: string[] = [];

  const section = (label: string, items: string[], ulAttrs = "") => {
    if (!items.length) return;
    blocks.push(
      `<li>${label}<ul${ulAttrs}>${items.map((i) => `<li>${i}</li>`).join("")}</ul></li>`,
    );
  };

  // Practices / Industries come from join tables (currently empty in DB) —
  // rendered when present so the section lights up once relations are seeded.
  const practices: string[] = (a.practiceGroups || []).map((p: any) =>
    esc(L(p, "name", lang)),
  );
  section(lang === "es" ? "Áreas de práctica" : "Practices", practices);

  const industries: string[] = (a.industryGroups || []).map((p: any) =>
    esc(L(p, "name", lang)),
  );
  section(lang === "es" ? "Grupos de industria" : "Industry Groups", industries);

  const education: string[] = (a.education || []).map((e: any) => {
    const deg = esc(L(e, "degree", lang));
    const sch = esc(L(e, "school", lang));
    return [deg, sch].filter(Boolean).join(", ");
  });
  section(
    lang === "es" ? "Educación y experiencia" : "Education & Experience",
    education,
  );

  const affiliations: string[] = (a.affiliations || []).map((f: any) => {
    const role = esc(L(f, "role", lang));
    const org = esc(L(f, "organization", lang));
    return role ? `${org} — ${role}` : org;
  });
  section(
    lang === "es" ? "Afiliaciones y actividades académicas" : "Affiliations & Academic Activities",
    affiliations,
    ' id="affiliations"',
  );

  const recognitions: string[] = (a.rankings || []).map((r: any) => {
    const rank = esc(r.ranking || "");
    const pub = esc(r.publication || "");
    return rank ? `${rank} — ${pub}` : pub;
  });
  section(
    lang === "es" ? "Reconocimientos" : "Recognitions",
    recognitions,
    ' id="recognitions"',
  );

  const resourceUrl = (value: unknown) => {
    const url = String(value || "").trim();
    return /^(?:\/news\/|\/articles\/|https:\/\/vonwobeser\.com\/)/i.test(url) ? url : "";
  };
  const renderResource = (p: any) => {
    const title = esc(L(p, "title", lang));
    const journal = esc(p.journal || "");
    const year = esc(p.year || "");
    const label = [title, journal, year && `(${year})`].filter(Boolean).join(", ");
    const url = resourceUrl(p.url);
    return url ? `<a href="${esc(url)}" rel="noopener noreferrer">${label}</a>` : label;
  };
  const resources = a.publications || [];
  // Las publicaciones internas se presentan en la franja editorial del perfil.
  // La columna conserva solamente bibliografía externa para no repetir títulos.
  const resourcesForMeta = (a.relatedNews || []).length
    ? resources.filter((resource: any) => !/^\/(?:news|articles)\//i.test(String(resource.url || "")))
    : resources;
  section(lang === "es" ? "Noticias" : "News", resourcesForMeta.filter((p: any) => p.kind === "news").map(renderResource));
  section(lang === "es" ? "Artículos" : "Articles", resourcesForMeta.filter((p: any) => p.kind !== "news").map(renderResource));

  const languages: string[] = (lang === "es" ? a.languagesEs : a.languages) || a.languages || [];
  if (languages.length) {
    blocks.push(
      `<li>${lang === "es" ? "Idiomas" : "Languages"}<ul><li>${esc(languages.join(", "))}.</li></ul></li>`,
    );
  }

  const tel = `<p class='tel_print'>${lang === "es" ? "Tel" : "Phone"}:${esc(a.phone || "")}<br>${esc(a.email || "")}</p>`;
  return tel + blocks.join("\n");
}

function publicInsightImage(value: unknown): string {
  const source = String(value || "").trim();

  // Algunos registros históricos conservan imágenes generadas que ya no están
  // disponibles en el sitio público. La imagen es complementaria: solo usamos
  // rutas que pertenecen al almacenamiento público o una URL externa completa.
  return /^(?:https?:\/\/|\/uploads\/)/i.test(source) ? source : "";
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
    const image = publicInsightImage(item.imageUrl || item.image);
    const imageMarkup = image
      ? `<div class="attorney-related-insights__image"><img src="${esc(String(image))}" alt="" loading="lazy"></div>`
      : "";
    return `<article class="attorney-related-insights__item">${imageMarkup}` +
      `<div class="attorney-related-insights__body">` +
      `<div class="attorney-related-insights__meta">${dateMarkup}</div>` +
      `<h3><a href="${href}" aria-label="${esc(`${labels.read}: ${L(item, "title", lang)}`)}">${title}</a></h3>` +
      `<div class="attorney-related-insights__excerpt">${excerpt}</div>` +
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
  return `<section class="attorney-related-insights" aria-labelledby="attorney-related-insights-title">` +
    `<div class="attorney-related-insights__wrap wrap">` +
    `<div class="attorney-related-insights__header">` +
    `<h2 id="attorney-related-insights-title">${esc(opts.title)}</h2>${description}` +
    `<a class="attorney-related-insights__more" href="${esc(opts.href)}">${esc(opts.more)}</a>` +
    `</div><div class="attorney-related-insights__grid">${insightCards(opts.items, opts, opts.lang)}</div></div></section>`;
}

/** Publicaciones propias del sitio, respaldadas por la relación editorial del perfil. */
function buildAuthoredInsights(attorney: any, lang: Lang): string {
  const relatedNews: any[] = attorney.relatedNews || [];
  if (!relatedNews.length) return "";

  const labels = lang === "es"
    ? { title: `Publicaciones de ${attorney.name || ""}`, more: "Ver todas las publicaciones", read: "Leer publicación" }
    : { title: `Publications by ${attorney.name || ""}`, more: "View all publications", read: "Read publication" };
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
    ? { title: "Lecturas relacionadas", more: "Ver todas las publicaciones", read: "Leer publicación" }
    : { title: "Related reading", more: "View all publications", read: "Read publication" };
  const description = practiceNames.length
    ? (lang === "es" ? `Contenido de integrantes de ${practiceNames.join(", ")}.` : `Published by members of ${practiceNames.join(", ")}.`)
    : undefined;
  return buildInsightsSection({ ...labels, items: readings, href: lang === "en" ? "/news?lang=en" : "/news", lang, description });
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
  $(".attorney__meta--name").attr(typographyAttribute(typography, "name", lang)).text(name);
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

  // --- Structured list ---------------------------------------------------
  $(".attorney__meta--list").html(buildMetaList(a, lang));

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
  $(".attorney__content--intro").attr(typographyAttribute(typography, lang === "es" ? "bioIntroEs" : "bioIntro", lang)).html(bioIntro);
  $(".attorney__content--txt").attr(typographyAttribute(typography, lang === "es" ? "bioEs" : "bio", lang)).html(bioRest);
  const relatedInsights = buildAuthoredInsights(a, lang) || buildPracticeReadings(a, lang);
  $(".attorney-related-insights").remove();
  if (relatedInsights) {
    // El perfil termina con una franja editorial completa, antes del footer. Así las
    // publicaciones no compiten con la biografía en la columna derecha del espejo.
    const $profileWrap = $(".page--wrap").first();
    if ($profileWrap.length) $profileWrap.after(relatedInsights);
    else $(".attorney__content--txt").after(relatedInsights);
  }

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
