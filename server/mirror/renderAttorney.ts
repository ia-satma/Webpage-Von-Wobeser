import * as cheerio from "cheerio";
import { getLocalizedAttorneyRole, getLocalizedAttorneyTitle } from "@shared/attorneyTitles";
import { applySeo, personNode, breadcrumbNode, clip } from "./seo";
import { renderRichText } from "./sanitize";

type Lang = "en" | "es";

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
  return `${MONTHS[lang][date.getMonth()]}, ${date.getFullYear()}`;
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

  const articles: string[] = (a.publications || []).map((p: any) => {
    const title = esc(L(p, "title", lang));
    const journal = esc(p.journal || "");
    const year = esc(p.year || "");
    return [title, journal, year && `(${year})`].filter(Boolean).join(", ");
  });
  section(lang === "es" ? "Artículos" : "Articles", articles);

  const languages: string[] = a.languages || [];
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

/** Publicaciones propias del sitio. No se mezclan con la bibliografía externa del perfil. */
function buildRelatedInsights(attorney: any, lang: Lang): string {
  const relatedNews: any[] = attorney.relatedNews || [];
  if (!relatedNews.length) return "";

  const labels = lang === "es"
    ? { title: "Perspectivas relacionadas", more: "Ver todas las publicaciones", read: "Leer publicación" }
    : { title: "Related insights", more: "View all publications", read: "Read publication" };
  const langSuffix = lang === "en" ? "?lang=en" : "";
  const archiveParams = new URLSearchParams({ author: attorney.slug || "" });
  if (lang === "en") archiveParams.set("lang", "en");
  const archiveHref = `/news?${archiveParams.toString()}`;
  const cards = relatedNews.map((item) => {
    const title = esc(L(item, "title", lang));
    const category = esc(L(item, "category", lang));
    const excerpt = renderRichText(L(item, "excerpt", lang));
    const href = `/news/${encodeURIComponent(String(item.slug || ""))}${langSuffix}`;
    const image = publicInsightImage(item.imageUrl || item.image);
    const imageMarkup = image
      ? `<div class="attorney-related-insights__image"><img src="${esc(String(image))}" alt="" loading="lazy"></div>`
      : "";
    return `<article class="attorney-related-insights__item">${imageMarkup}` +
      `<div class="attorney-related-insights__body">` +
      `<div class="attorney-related-insights__meta">${category}${category && fmtDate(item.date, lang) ? " · " : ""}${esc(fmtDate(item.date, lang))}</div>` +
      `<h3><a href="${href}" aria-label="${esc(`${labels.read}: ${L(item, "title", lang)}`)}">${title}</a></h3>` +
      `<div class="attorney-related-insights__excerpt">${excerpt}</div>` +
      `</div></article>`;
  }).join("");

  return `<section class="attorney-related-insights" aria-labelledby="attorney-related-insights-title">` +
    `<div class="attorney-related-insights__wrap wrap">` +
    `<div class="attorney-related-insights__header">` +
    `<h2 id="attorney-related-insights-title">${labels.title}</h2>` +
    `<a class="attorney-related-insights__more" href="${archiveHref}">${labels.more}</a>` +
    `</div><div class="attorney-related-insights__grid">${cards}</div></div></section>`;
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
 * Takes the original mirror HTML of an attorney profile and injects the
 * given attorney record from our backend, preserving the original markup.
 */
export function renderAttorney(templateHtml: string, a: any, lang: Lang = "en"): string {
  const $ = cheerio.load(templateHtml);

  const name = a.name || "";
  const role = getLocalizedAttorneyTitle(a, lang) || getLocalizedAttorneyRole(a, lang);
  const phone = a.phone || "";
  const email = a.email || "";
  const img = a.imageUrl || "";

  // --- Header card -------------------------------------------------------
  $(".attorney__meta--name").text(name);
  $(".attorney__meta--role").text(role);

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
  const { first: bioIntro, rest: bioRest } = splitFirstBlock(renderRichText(bio));
  $(".attorney__content--intro").html(bioIntro);
  $(".attorney__content--txt").html(bioRest);
  const relatedInsights = buildRelatedInsights(a, lang);
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
