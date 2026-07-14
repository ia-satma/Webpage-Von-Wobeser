import * as cheerio from "cheerio";
import { applySeo, breadcrumbNode } from "./seo";

type Lang = "en" | "es";

function esc(s: any): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export type GroupListItem = { slug: string; name: string; nameEs: string; order?: number | null };

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
): string {
  const $ = cheerio.load(templateHtml);
  const langSuffix = lang === "en" ? "?lang=en" : "";

  const sorted = [...items].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0) || (lang === "es" ? a.nameEs : a.name).localeCompare(lang === "es" ? b.nameEs : b.name),
  );

  const linksHtml = sorted
    .map((it) => {
      const label = lang === "es" ? it.nameEs || it.name : it.name;
      return `<a class="page__content--item" href="${linkPrefix}${esc(it.slug)}${langSuffix}">${esc(label)}</a>`;
    })
    .join("");

  $(".page__content--body").first().html(linksHtml);

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
