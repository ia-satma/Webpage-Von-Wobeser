import * as cheerio from "cheerio";
import { getLocalizedAttorneyTitle } from "@shared/attorneyTitles";
import { applySeo, breadcrumbNode } from "./seo";

type Lang = "en" | "es";

function esc(s: any): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Mirror category slug -> DB `title` value + nav label.
export const CATEGORIES: Record<string, { title: string; en: string; es: string }> = {
  partners: { title: "Partner", en: "Partners", es: "Socios" },
  "of-counsel": { title: "Of Counsel", en: "Of Counsel", es: "Of Counsel" },
  counsel: { title: "Counsel", en: "Counsel", es: "Consejeros" },
  associates: { title: "Associate", en: "Associates", es: "Asociados" },
};

export type AttorneyListOpts = {
  /** Prácticas reales (para poblar el <select> de búsqueda). */
  practiceGroups?: { slug: string; name: string; nameEs: string }[];
  /** Muestra el buscador SOLO en la página general "Abogados", no en las categorías. */
  showSearch?: boolean;
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
    const role = getLocalizedAttorneyTitle(a, lang);
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

  // En los listados por categoría la lista de nombres puede ser mucho más alta
  // que la ficha. En escritorio la lista se desplaza dentro de su propia columna,
  // para que la fotografía y los datos del abogado siempre permanezcan visibles.
  // La búsqueda general conserva el flujo normal de la página.
  if (!opts.showSearch) {
    $(".attorneys").addClass("attorneys--directory");
    $(".attorneys__meta").addClass("attorneys__meta--directory");
    $(".attorneys__list").addClass("attorneys__list--directory").attr({
      role: "region",
      tabindex: "0",
      "aria-label": lang === "es" ? "Lista de abogados" : "Attorney list",
    });
  }

  // Rewrite category sub-nav + main nav to our dynamic routes.
  $('a[href*="/index.php/attorneys/"]').each((_, el) => {
    const href = $(el).attr("href") || "";
    const m = href.match(/\/index\.php\/attorneys\/([a-z-]+)\//);
    if (m) $(el).attr("href", `/attorneys/${m[1]}${langSuffix}`);
    else if (/\/index\.php\/attorneys\/index\.html/.test(href)) $(el).attr("href", `/attorneys${langSuffix}`);
  });

  // Buscador: nombre + posición/práctica (desplegables) + iniciales A-Z.
  // TODO navega a /attorneys/buscar (página de resultados
  // aparte), igual que el sitio real — no despliega resultados en esta página.
  // Solo se muestra en la página general "Abogados", NO en Socios/Of Counsel/Consejeros/Asociados.
  if (opts.showSearch && opts.practiceGroups) {
    const t = lang === "es"
      ? { ttl: "Buscar por:", name: "Nombre:", position: "Posición:", practice: "Práctica:", all: "Todas", submit: "Buscar", byLastName: "Búsqueda por inicial:" }
      : { ttl: "Search by:", name: "Name:", position: "Position:", practice: "Practice:", all: "All", submit: "Search", byLastName: "Browse by initial:" };

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

    // La landing general "Abogados" debe mostrar SOLO el buscador. Quitamos la lista
    // maestro-detalle (fotos + nombres) — esa sí aparece en las subpáginas por categoría
    // (Socios/Of Counsel/Counsel/Asociados), donde showSearch es false.
    $(".attorneys__meta").remove();
    $(".attorneys__list").remove();
  }

  const label = lang === "es" ? CATEGORIES[category]?.es : CATEGORIES[category]?.en;
  $("html").attr("lang", lang === "es" ? "es-mx" : "en-gb");

  const path = `/attorneys/${category}`;
  applySeo($, {
    lang,
    path,
    title: `${label || (lang === "es" ? "Abogados" : "Attorneys")} | Von Wobeser y Sierra`,
    description:
      lang === "es"
        ? `Conoce a los abogados (${label || "equipo"}) de Von Wobeser y Sierra, firma líder en México con reconocimiento internacional.`
        : `Meet the ${label || "attorneys"} of Von Wobeser y Sierra, a leading Mexican law firm with international recognition.`,
    type: "website",
    jsonLd: [
      breadcrumbNode(
        [
          { name: lang === "es" ? "Inicio" : "Home", path: "/" },
          { name: lang === "es" ? "Abogados" : "Attorneys", path: "/attorneys" },
          { name: label || (lang === "es" ? "Abogados" : "Attorneys"), path },
        ],
        lang,
      ),
    ],
  });

  return $.html();
}

/** Data prepared by the server for the unified /attorneys directory. */
export type AttorneyDirectoryItem = {
  id: string;
  slug: string;
  name: string;
  role: keyof typeof CATEGORIES;
  roleLabel: string;
  imageUrl: string;
  practiceSlugs: string[];
};

export type AttorneyDirectoryPractice = {
  slug: string;
  name: string;
};

export type AttorneyDirectoryFilters = {
  q: string;
  role: string;
  practice: string;
  letter: string;
};

const DIRECTORY_ROLE_ORDER = Object.keys(CATEGORIES) as Array<keyof typeof CATEGORIES>;

function normalizeDirectoryValue(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
}

/** Una letra A-Z puede localizar cualquiera de las partes del nombre. */
function directoryNameInitials(name: string): string[] {
  return Array.from(new Set(
    normalizeDirectoryValue(name)
      .split(/\s+/)
      .map((part) => part.charAt(0).toUpperCase())
      .filter(Boolean),
  ));
}

function attorneyMatchesDirectoryFilters(
  attorney: AttorneyDirectoryItem,
  filters: AttorneyDirectoryFilters,
): boolean {
  const name = normalizeDirectoryValue(attorney.name);
  const query = normalizeDirectoryValue(filters.q).trim();
  const initials = directoryNameInitials(attorney.name);

  return (!query || name.includes(query))
    && (!filters.role || attorney.role === filters.role)
    && (!filters.practice || attorney.practiceSlugs.includes(filters.practice))
    && (!filters.letter || initials.includes(filters.letter.toUpperCase()));
}

/**
 * Renders the root /attorneys route as a complete, progressively enhanced
 * directory.  Category pages deliberately continue to use renderAttorneyList
 * above because they retain the master-detail photographic experience.
 */
export function renderAttorneyDirectory(
  templateHtml: string,
  attorneys: AttorneyDirectoryItem[],
  practices: AttorneyDirectoryPractice[],
  filters: AttorneyDirectoryFilters,
  lang: Lang,
): string {
  const $ = cheerio.load(templateHtml);
  const isEs = lang === "es";
  const copy = isEs
    ? {
        title: "Abogados",
        intro: "Conoce a nuestro equipo y encuentra el perfil adecuado por nombre, cargo o área de práctica.",
        // Se conserva literalmente la nomenclatura del buscador que ya vive en
        // el espejo. El filtro sigue admitiendo nombre o apellido y las listas
        // desplegables alimentan el directorio unificado de esta página.
        searchBy: "Buscar por:",
        name: "Nombre:",
        role: "Posición:",
        practice: "Práctica:",
        initial: "Búsqueda por inicial:",
        allRoles: "Todas",
        allPractices: "Todas",
        allInitials: "Todas",
        search: "Buscar",
        clear: "Limpiar filtros",
        results: "resultados",
        empty: "No encontramos abogados que coincidan con los filtros seleccionados.",
        attorneys: "Abogados",
      }
    : {
        title: "Attorneys",
        intro: "Meet our team and find the right profile by name, role or practice area.",
        searchBy: "Search by:",
        name: "Name:",
        role: "Position:",
        practice: "Practice:",
        initial: "Browse by initial:",
        allRoles: "All",
        allPractices: "All",
        allInitials: "All",
        search: "Search",
        clear: "Clear filters",
        results: "results",
        empty: "We could not find attorneys matching the selected filters.",
        attorneys: "Attorneys",
      };
  const langSuffix = isEs ? "" : "?lang=en";
  const hasActiveFilters = Boolean(filters.q || filters.role || filters.practice || filters.letter);
  const matchedAttorneys = attorneys.filter((attorney) => attorneyMatchesDirectoryFilters(attorney, filters));
  const selected = (current: string, value: string) => (current === value ? " selected" : "");
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const roleOptions = DIRECTORY_ROLE_ORDER
    .map((role) => `<option value="${esc(role)}"${selected(filters.role, role)}>${esc(CATEGORIES[role][isEs ? "es" : "en"])}</option>`)
    .join("");
  const practiceOptions = practices
    .map((practice) => `<option value="${esc(practice.slug)}"${selected(filters.practice, practice.slug)}>${esc(practice.name)}</option>`)
    .join("");
  const letterButtons = ["", ...letters]
    .map((letter) => {
      const active = filters.letter === letter;
      const label = letter || copy.allInitials;
      return `<button class="attorney-directory__letter" type="submit" name="set-letter" value="${esc(letter)}" data-attorney-letter-option aria-pressed="${active ? "true" : "false"}">${esc(label)}</button>`;
    })
    .join("");

  const roleGroups = DIRECTORY_ROLE_ORDER
    .map((role) => {
      const people = attorneys.filter((attorney) => attorney.role === role);
      if (!people.length) return "";
      const matchingPeople = people.filter((attorney) => attorneyMatchesDirectoryFilters(attorney, filters));
      const items = people
        .map((attorney) => {
          const initials = directoryNameInitials(attorney.name);
          const profilePath = isEs
            ? `/abogado/${esc(attorney.slug)}`
            : `/lawyer/${esc(attorney.slug)}${langSuffix}`;
          const hidden = attorneyMatchesDirectoryFilters(attorney, filters) ? "" : " hidden";
          const image = attorney.imageUrl
            ? `<img src="${esc(attorney.imageUrl)}" alt="" loading="lazy" decoding="async">`
            : `<span class="attorney-directory__portrait--fallback" aria-hidden="true"></span>`;
          return `<li class="attorney-directory__result" data-attorney-result data-name="${esc(normalizeDirectoryValue(attorney.name))}" data-role="${esc(attorney.role)}" data-practices="${esc(attorney.practiceSlugs.join("|"))}" data-name-initials="${esc(initials.join("|"))}"${hidden}>` +
            `<a href="${profilePath}"><span class="attorney-directory__portrait">${image}</span><span class="attorney-directory__name">${esc(attorney.name)}</span><span class="attorney-directory__role">${esc(attorney.roleLabel)}</span></a>` +
          `</li>`;
        })
        .join("");
      return `<section class="attorney-directory__group" data-attorney-group data-role="${esc(role)}"${matchingPeople.length ? "" : " hidden"}>` +
        `<h2>${esc(CATEGORIES[role][isEs ? "es" : "en"])}</h2><ul class="attorney-directory__grid">${items}</ul></section>`;
    })
    .join("");

  const directory =
    `<main class="attorney-directory" data-attorney-directory>` +
      `<form class="attorney-directory__filters" action="/attorneys" method="get" data-attorney-filter-form>` +
        (isEs ? "" : `<input type="hidden" name="lang" value="en">`) +
        `<div class="attorney-directory__filter-main"><p class="attorney-directory__filter-title">${esc(copy.searchBy)}</p>` +
          `<label class="attorney-directory__field attorney-directory__field--query"><span>${esc(copy.name)}</span><input type="search" name="q" value="${esc(filters.q)}" autocomplete="off" data-attorney-q></label>` +
          `<label class="attorney-directory__field"><span>${esc(copy.role)}</span><select name="role" data-attorney-role><option value="">${esc(copy.allRoles)}</option>${roleOptions}</select></label>` +
          `<label class="attorney-directory__field"><span>${esc(copy.practice)}</span><select name="practice" data-attorney-practice><option value="">${esc(copy.allPractices)}</option>${practiceOptions}</select></label>` +
          `<div class="attorney-directory__actions"><button type="submit">${esc(copy.search)}</button><a class="attorney-directory__clear" href="/attorneys${langSuffix}" data-attorney-clear${hasActiveFilters ? "" : " hidden"}>${esc(copy.clear)}</a></div>` +
        `</div>` +
        `<div class="attorney-directory__initials"><span>${esc(copy.initial)}</span><input type="hidden" name="letter" value="${esc(filters.letter)}" data-attorney-letter><div class="attorney-directory__letters" role="group" aria-label="${esc(copy.initial)}">${letterButtons}</div></div>` +
      `</form>` +
      `<p class="attorney-directory__status" aria-live="polite" data-attorney-count data-singular="${isEs ? "resultado" : "result"}" data-plural="${esc(copy.results)}">${matchedAttorneys.length} ${matchedAttorneys.length === 1 ? (isEs ? "resultado" : "result") : copy.results}</p>` +
      `<p class="attorney-directory__empty" data-attorney-empty${matchedAttorneys.length ? " hidden" : ""}>${esc(copy.empty)}</p>` +
      `<div class="attorney-directory__groups" data-attorney-groups>${roleGroups}</div>` +
    `</main>`;

  // El HTML del espejo contiene cabecera y pie compartidos. Solo sustituimos el
  // área editorial de Abogados: nunca vaciamos <body>, porque eso eliminaría la
  // navegación, el selector de idioma y el footer de la página pública.
  const existingDirectory = $(".attorneys").first();
  if (existingDirectory.length) {
    existingDirectory.replaceWith(directory);
  } else {
    const main = $("main").first();
    if (main.length) main.html(directory);
    else $("body").append(directory);
  }
  $("html").attr("lang", isEs ? "es-mx" : "en-gb");
  if (!$("script[src='/attorney-directory.js']").length) {
    $("head").append(`<script src="/attorney-directory.js" defer></script>`);
  }
  applySeo($, {
    lang,
    path: "/attorneys",
    title: `${copy.title} | Von Wobeser y Sierra`,
    description: copy.intro,
    type: "website",
    jsonLd: [
      breadcrumbNode(
        [
          { name: isEs ? "Inicio" : "Home", path: "/" },
          { name: copy.title, path: "/attorneys" },
        ],
        lang,
      ),
    ],
  });

  return $.html();
}
