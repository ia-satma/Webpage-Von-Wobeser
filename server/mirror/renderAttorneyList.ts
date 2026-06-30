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

export type AttorneyListOpts = {
  /** Prácticas reales (para poblar el <select> de búsqueda). */
  practiceGroups?: { slug: string; name: string; nameEs: string }[];
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
  opts: AttorneyListOpts = {},
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

  // Buscador: nombre + posición/práctica (desplegables) + "Búsqueda por Apellido"
  // (abecedario A-Z). TODO navega a /attorneys/buscar (página de resultados
  // aparte), igual que el sitio real — no despliega resultados en esta página.
  if (opts.practiceGroups) {
    const t = lang === "es"
      ? { ttl: "Buscar por:", name: "Nombre:", position: "Posición:", practice: "Práctica:", all: "Todas", submit: "Buscar", byLastName: "Búsqueda por Apellido:" }
      : { ttl: "Search by:", name: "Name:", position: "Position:", practice: "Practice:", all: "All", submit: "Search", byLastName: "Browse by Last Name:" };

    const positionOptions = Object.entries(CATEGORIES)
      .map(([slug, c]) => `<option value="${esc(slug)}">${esc(lang === "es" ? c.es : c.en)}</option>`)
      .join("");
    const practiceOptions = opts.practiceGroups
      .map((pg) => `<option value="${esc(pg.slug)}">${esc(lang === "es" ? pg.nameEs : pg.name)}</option>`)
      .join("");

    // El sitio no trae un ícono de flecha entre sus assets capturados; se usa un SVG
    // embebido (URL-encoded, sin comillas crudas) para que el <select> se note
    // claramente como desplegable, sin pelear con el escapado del atributo HTML.
    const arrowSvgRaw = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#878a8e" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`;
    const arrowSvg = `data:image/svg+xml,${encodeURIComponent(arrowSvgRaw)}`;
    const selectStyle = `appearance:none;-webkit-appearance:none;-moz-appearance:none;background-color:#fff;background-image:url(${arrowSvg});background-repeat:no-repeat;background-position:right 10px center;background-size:14px;padding-right:32px;cursor:pointer;`;

    // Abecedario: el sitio real navega a una página de resultados por apellido.
    // Se usan <a> (no <form>), que es lo que estiliza el CSS base (.search__form--alpha a).
    const langParam = lang === "en" ? "&amp;lang=en" : "";
    const alphaLinks = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
      .map((L) => `<a href="/attorneys/buscar?kind=letter&amp;q=${L.toLowerCase()}${langParam}">${L}</a>`)
      .join("");

    const formHtml =
      `<div class="search__form">` +
      `<form action="/attorneys/buscar" method="get">` +
      `<div class="search__form--ttl">${esc(t.ttl)}</div>` +
      `<label for="q" class="search__form--label">${esc(t.name)} ` +
      `<input class="search__form--input" type="text" name="q" id="q"></label>` +
      `<label for="position" class="search__form--label">${esc(t.position)} ` +
      `<select class="search__form--input" name="position" id="position" style="${selectStyle}"><option value="">${esc(t.all)}</option>${positionOptions}</select></label>` +
      `<label for="practice" class="search__form--label">${esc(t.practice)} ` +
      `<select class="search__form--input" name="practice" id="practice" style="${selectStyle}"><option value="">${esc(t.all)}</option>${practiceOptions}</select></label>` +
      `<input type="hidden" name="kind" value="lawyer">` +
      (lang === "en" ? `<input type="hidden" name="lang" value="en">` : "") +
      `<input class="search__form--submit" type="submit" value="${esc(t.submit)}">` +
      `</form>` +
      `<div class="search__form--ttl">${esc(t.byLastName)}</div>` +
      `<div class="search__form--alpha">${alphaLinks}</div>` +
      `</div>`;

    $(".attorneys__meta").before(formHtml);
  }

  const label = lang === "es" ? CATEGORIES[category]?.es : CATEGORIES[category]?.en;
  $("title").text(`Von Wobeser - ${label || "Attorneys"}`);
  $("html").attr("lang", lang === "es" ? "es-mx" : "en-gb");

  return $.html();
}
