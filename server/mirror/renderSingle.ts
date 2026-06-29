import * as cheerio from "cheerio";

type Lang = "en" | "es";
type Kind = "practice" | "industry";

function esc(s: any): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function L(obj: any, base: string, lang: Lang): string {
  if (!obj) return "";
  return lang === "es" ? obj[base + "Es"] || obj[base] || "" : obj[base] || "";
}

function textToHtml(text: string): string {
  return esc(text || "")
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("\n");
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
    `<a href="/lawyer/${esc(a.slug)}${langSuffix}">${esc(a.name)}</a></p>`;

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
): string {
  const $ = cheerio.load(templateHtml);

  const name = L(group, "name", lang);
  $(".single__meta--name").first().text(name);
  $(".single__meta--list").html(buildAttorneyAccordion(attorneys, kind, lang));

  $(".single__content--intro").html(`<p>${esc(L(group, "description", lang))}</p>`);
  $(".single__content--txt").html(textToHtml(L(group, "fullDescription", lang)));

  // Keep the category nav working against our dynamic routes.
  $('a[href*="/index.php/practice/"], a[href*="/index.php/industry/"]').each((_, el) => {
    // Leave as-is for now (static mirror pages still resolve); profile links
    // inside the accordion are already pointed at /lawyer/:slug above.
  });

  $("title").text(`Von Wobeser - ${name}`);
  $("html").attr("lang", lang === "es" ? "es-mx" : "en-gb");

  return $.html();
}
