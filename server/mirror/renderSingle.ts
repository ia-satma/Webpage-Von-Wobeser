import * as cheerio from "cheerio";
import { applySeo, serviceNode, breadcrumbNode, clip } from "./seo";
import { renderRichText } from "./sanitize";
import { typographyAttribute, type TypographyStyles } from "@shared/editorialTypography";
import { escapeHtmlAttribute, escapeHtmlText } from "./htmlEscape";
import { getAttorneyPublicName } from "@shared/attorneyName";

type Lang = "en" | "es";
type Kind = "practice" | "industry";

const esc = escapeHtmlText;

function L(obj: any, base: string, lang: Lang): string {
  if (!obj) return "";
  return lang === "es" ? obj[base + "Es"] || obj[base] || "" : obj[base] || "";
}

const ROLE_GROUPS = [
  { title: "Partner", en: "Partners", es: "Socios" },
  { title: "Of Counsel", en: "Of Counsel", es: "Of Counsel" },
  { title: "Associate", en: "Associates", es: "Asociados" },
];

/** Build the accordion of attorneys grouped by role for the sidebar. */
function buildAttorneyAccordion(attorneys: any[], kind: Kind, lang: Lang): string {
  const langSuffix = lang === "en" ? "?lang=en" : "";
  const inThe =
    lang === "es"
      ? kind === "practice" ? "en la práctica" : "en el grupo"
      : kind === "practice" ? "in the Practice" : "in the Industry Group";

  const p = (a: any) =>
    `<p style="font-size:14px; margin-bottom:10px; margin-top:10px; line-height:18px;">` +
    `<a href="/lawyer/${escapeHtmlAttribute(a.slug)}${langSuffix}">${esc(getAttorneyPublicName(a))}</a></p>`;

  const blocks: string[] = [];
  for (const g of ROLE_GROUPS) {
    const members = attorneys.filter((a) => a.title === g.title);
    if (!members.length) continue;
    const label = `${lang === "es" ? g.es : g.en} ${inThe}`;
    blocks.push(
      `<li class="accordion">${label}</li>` +
        `<div style="padding:0 10px; background-color:#bdbcbc;" class="panel">${members.map(p).join("")}</div>`,
    );
  }
  return blocks.join("");
}

/**
 * Renders a practice or industry page from the mirror layout, injecting the
 * group's content + its attorneys (via the relations we seeded).
 */
export function renderSingle(
  templateHtml: string,
  group: any,
  attorneys: any[],
  kind: Kind,
  lang: Lang = "en",
  typography?: TypographyStyles,
): string {
  const $ = cheerio.load(templateHtml);
  $(".single").first().attr("data-vw-content-kind", kind);

  const name = L(group, "name", lang);
  $(".single__meta--name").first().attr(typographyAttribute(typography, lang === "es" ? "nameEs" : "name", lang)).text(name);
  $(".single__meta--list").html(buildAttorneyAccordion(attorneys, kind, lang));

  $(".single__content--intro").attr(typographyAttribute(typography, lang === "es" ? "descriptionEs" : "description", lang)).html(renderRichText(L(group, "description", lang)));
  $(".single__content--txt").attr(typographyAttribute(typography, lang === "es" ? "fullDescriptionEs" : "fullDescription", lang)).html(renderRichText(L(group, "fullDescription", lang)));

  // Las plantillas históricas de prácticas e industrias traen un script que
  // reúne intro y cuerpo al cargar. Las páginas dinámicas ya reciben ambos
  // campos separados, por lo que ese comportamiento heredado duplica o
  // desplaza el contenido.
  // Se retira únicamente de este HTML renderizado; los archivos estáticos no se
  // modifican y siguen disponibles como snapshot editorial.
  $("script").filter((_, script) => {
    const source = $(script).html() || "";
    return source.includes("txt_separado") && source.includes("single__content--intro");
  }).remove();

  // Keep the category nav working against our dynamic routes.
  $('a[href*="/index.php/practice/"], a[href*="/index.php/industry/"]').each((_, el) => {
    // Leave as-is for now (static mirror pages still resolve); profile links
    // inside the accordion are already pointed at /lawyer/:slug above.
  });

  $("html").attr("lang", lang === "es" ? "es-mx" : "en-gb");

  const path = `/${kind}/${group.slug}`;
  const desc =
    clip(L(group, "description", lang) || L(group, "fullDescription", lang)) ||
    (lang === "es"
      ? `${name} — área de práctica de Von Wobeser y Sierra, firma de abogados líder en México.`
      : `${name} — a practice area of Von Wobeser y Sierra, a leading Mexican law firm.`);
  const crumbLabel =
    kind === "practice" ? (lang === "es" ? "Áreas de práctica" : "Practices") : (lang === "es" ? "Industrias" : "Industries");
  applySeo($, {
    lang,
    path,
    title: `${name} | Von Wobeser y Sierra`,
    description: desc,
    type: "website",
    jsonLd: [
      serviceNode({ name, description: desc, path, lang }),
      breadcrumbNode(
        [
          { name: lang === "es" ? "Inicio" : "Home", path: "/" },
          { name: crumbLabel, path: "/" },
          { name, path },
        ],
        lang,
      ),
    ],
  });

  return $.html();
}
