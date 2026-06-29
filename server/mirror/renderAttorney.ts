import * as cheerio from "cheerio";

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
    .replace(/>/g, "&gt;");
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

/** Convert plaintext (with newlines) into simple paragraph/break HTML. */
function textToHtml(text: string): string {
  return esc(text || "")
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

/**
 * Takes the original mirror HTML of an attorney profile and injects the
 * given attorney record from our backend, preserving the original markup.
 */
export function renderAttorney(templateHtml: string, a: any, lang: Lang = "en"): string {
  const $ = cheerio.load(templateHtml);

  const name = a.name || "";
  const role = L(a, "title", lang) || L(a, "role", lang);
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
  const paras = (bio || "").split(/\n{2,}/);
  $(".attorney__content--intro").html(`<p>${esc(paras[0] || "")}</p>`);
  $(".attorney__content--txt").html(textToHtml(paras.slice(1).join("\n\n") || bio));

  // --- Head metadata -----------------------------------------------------
  $("title").text(`Von Wobeser - ${name}`);
  $('meta[name="Attorney"]').attr("content", name);
  $('meta[name="Position"]').attr("content", role);
  $('meta[name="Phone"]').attr("content", phone);
  $('meta[name="Mail"]').attr("content", email);
  $("html").attr("lang", lang === "es" ? "es-mx" : "en-gb");

  return $.html();
}
