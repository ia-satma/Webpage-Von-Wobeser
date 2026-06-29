import * as cheerio from "cheerio";

type Lang = "en" | "es";

function esc(s: any): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Mirror category slug -> DB `title` value + nav label.
export const CATEGORIES: Record<string, { title: string; en: string; es: string }> = {
  partners: { title: "Partner", en: "Partners", es: "Socios" },
  "of-counsel": { title: "Of Counsel", en: "Of Counsel", es: "Of Counsel" },
  counsel: { title: "Counsel", en: "Counsel", es: "Counsel" },
  associates: { title: "Associate", en: "Associates", es: "Asociados" },
};

/**
 * Renders the attorney directory (master-detail) for one category, injecting
 * DB attorneys into the original mirror layout. Links point to our dynamic
 * profile route (/lawyer/:slug) so the flow stays inside the app.
 */
export function renderAttorneyList(
  templateHtml: string,
  attorneys: any[],
  category: string,
  lang: Lang = "en",
): string {
  const $ = cheerio.load(templateHtml);
  const langSuffix = lang === "en" ? "?lang=en" : "";

  const metaItems: string[] = [];
  const listItems: string[] = [];

  attorneys.forEach((a, idx) => {
    const active = idx === 0 ? "active" : "";
    const di = idx + 1;
    const img = esc(a.imageUrl || "");
    const role = lang === "es" ? a.titleEs || a.title : a.title;
    const vcard = `/api/team/${esc(a.slug)}/vcard`;

    metaItems.push(
      `<div class="attorneys__meta--item attorney_meta_JS ${active}" data-item="${di}">` +
        `<div class="img" style="background-image:url(${img});"></div>` +
        `<div class="txt">` +
        `<p>${lang === "es" ? "Tel" : "Phone"}: ${esc(a.phone || "")}` +
        (a.email ? `<br><a href="mailto:${esc(a.email)}">${esc(a.email)}</a>` : "") +
        `</p>` +
        `<p><a download href="${vcard}">${lang === "es" ? "DESCARGAR VCARD" : "DOWNLOAD VCARD"}</a></p>` +
        `</div></div>`,
    );

    listItems.push(
      `<a class="attorneys__list--item attorney_item_JS ${active}" href="/lawyer/${esc(a.slug)}${langSuffix}" data-item="${di}">` +
        `<span class="img" style="background-image:url(${img});"></span>` +
        `<span class="name">${esc(a.name)}</span>` +
        `<span class="role">${esc(role)}</span>` +
        `</a>`,
    );
  });

  $(".attorneys__meta").html(metaItems.join("\n"));
  $(".attorneys__list").html(listItems.join("\n"));

  // Rewrite category sub-nav + main nav to our dynamic routes.
  $('a[href*="/index.php/attorneys/"]').each((_, el) => {
    const href = $(el).attr("href") || "";
    const m = href.match(/\/index\.php\/attorneys\/([a-z-]+)\//);
    if (m) $(el).attr("href", `/attorneys/${m[1]}${langSuffix}`);
    else if (/\/index\.php\/attorneys\/index\.html/.test(href)) $(el).attr("href", `/attorneys${langSuffix}`);
  });

  const label = lang === "es" ? CATEGORIES[category]?.es : CATEGORIES[category]?.en;
  $("title").text(`Von Wobeser - ${label || "Attorneys"}`);
  $("html").attr("lang", lang === "es" ? "es-mx" : "en-gb");

  return $.html();
}
