import * as cheerio from "cheerio";
import { typographyAttribute, type TypographyStyles } from "@shared/editorialTypography";
import { isPublicPracticeSlug } from "./publicPracticeGroups";
import { applySeo, breadcrumbNode } from "./seo";
import { localizedGroupLabel, sortGroupsAlphabetically } from "./sortPublicGroups";

type Lang = "en" | "es";

function esc(s: any): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export type GroupListItem = { slug: string; name: string; nameEs: string; order?: number | null };
type GroupListConfig = Record<string, {
  value: string;
  valueEs: string;
  type: string;
  typography?: TypographyStyles;
}>;

/**
 * Renders a "Prácticas" / "Grupos de práctica por industria" style listing: a flat set of
 * `.page__content--item` links inside `.page__content--body`, sourced from the real DB rows
 * (not the frozen list baked into the captured HTML). Links point at the existing dynamic
 * detail route (linkPrefix + slug), so clicking through always lands on live, editable content.
 */
export function renderGroupList(
  templateHtml: string,
  items: GroupListItem[],
  linkPrefix: "/practice/" | "/industry/" | "/desk/",
  lang: Lang,
  meta: { path: string; title: string; description: string; crumbLabel: string },
  config: GroupListConfig = {},
): string {
  const $ = cheerio.load(templateHtml);
  const langSuffix = lang === "en" ? "?lang=en" : "";

  const sorted = linkPrefix === "/practice/"
    ? sortGroupsAlphabetically(items.filter((item) => isPublicPracticeSlug(item.slug)), lang)
    : [...items].sort(
      (a, b) => (
        (a.order ?? 0) - (b.order ?? 0)
        || localizedGroupLabel(a, lang).localeCompare(localizedGroupLabel(b, lang))
      ),
    );

  const linksHtml = sorted
    .map((it) => {
      const label = localizedGroupLabel(it, lang);
      return `<a class="page__content--item" href="${linkPrefix}${esc(it.slug)}${langSuffix}">${esc(label)}</a>`;
    })
    .join("");

  $(".page__content--body").first().html(linksHtml);

  // Los listados completos de Prácticas e Industrias sustituyen el rótulo
  // lateral histórico por la jerarquía editorial de Contacto: etiqueta breve
  // en Inter, título legible en Gelasio y una introducción. Cada superficie
  // conserva su catálogo, imagen y orden propios.
  const headingVariant = linkPrefix === "/practice/"
    ? {
        key: "practices",
        classStem: "practice",
        defaults: lang === "es"
          ? {
              eyebrow: "Prácticas",
              title: "Nuestras prácticas",
              description: "Conoce las áreas en las que ofrecemos asesoría legal especializada.",
            }
          : {
              eyebrow: "Practices",
              title: "Our practices",
              description: "Explore the areas in which we provide specialized legal advice.",
            },
      }
    : linkPrefix === "/industry/"
      ? {
          key: "industries",
          classStem: "industry",
          defaults: lang === "es"
            ? {
                eyebrow: "Industrias",
                title: "Nuestras industrias",
                description: "Conoce los grupos de práctica con los que atendemos las necesidades específicas de cada industria.",
              }
            : {
                eyebrow: "Industries",
                title: "Our industries",
                description: "Explore the industry groups with which we address the specific needs of every sector.",
              },
        }
      : null;

  if (headingVariant) {
    const text = (key: string, fallback: string) => {
      const value = config[key] ? (lang === "es" ? config[key].valueEs || config[key].value : config[key].value) : "";
      return value.trim() || fallback;
    };
    const heading = {
      eyebrow: text(`page_${headingVariant.key}_eyebrow`, headingVariant.defaults.eyebrow),
      title: text(`page_${headingVariant.key}_title`, headingVariant.defaults.title),
      description: text(`page_${headingVariant.key}_description`, headingVariant.defaults.description),
    };
    const className = `vw-${headingVariant.classStem}-list-page`;
    const $section = $(".page.practices").first().addClass(className);
    const $wrap = $section.find(".page--wrap").first();

    // La plantilla capturada contiene el título rotado dentro de la columna
    // de enlaces. Se elimina antes de insertar un único H1 centrado.
    $wrap.find(".capabilities__meta .page__ttl").first().remove();
    $wrap.prepend(`
      <header class="${className}__header">
        <p class="${className}__eyebrow">${esc(heading.eyebrow)}</p>
        <h1 class="${className}__title">${esc(heading.title)}</h1>
        <div class="${className}__lede"><p>${esc(heading.description)}</p></div>
      </header>
    `);
    $wrap.find(`.${className}__title`).attr(
      typographyAttribute(config[`page_${headingVariant.key}_title`]?.typography, lang === "es" ? "valueEs" : "value", lang),
    );
    $wrap.find(`.${className}__lede`).attr(
      typographyAttribute(config[`page_${headingVariant.key}_description`]?.typography, lang === "es" ? "valueEs" : "value", lang),
    );
  }

  $("html").attr("lang", lang === "es" ? "es-mx" : "en-gb");

  applySeo($, {
    lang,
    path: meta.path,
    title: meta.title,
    description: meta.description,
    type: "website",
    jsonLd: [
      breadcrumbNode(
        [
          { name: lang === "es" ? "Inicio" : "Home", path: "/" },
          { name: lang === "es" ? "Capacidades" : "Capabilities", path: lang === "es" ? "/capacidades" : "/capabilities" },
          { name: meta.crumbLabel, path: meta.path },
        ],
        lang,
      ),
    ],
  });

  return $.html();
}
