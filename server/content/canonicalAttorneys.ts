import * as cheerio from "cheerio";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { Affiliation, Education, Publication, Ranking } from "@shared/schema";
import { getMirrorDir } from "../mirror/config";

/** Official attorney-directory snapshot verified on 12 August 2026. */
export const CANONICAL_ATTORNEYS_SNAPSHOT_DATE = "2026-08-12";

// The versioned mirror contains these two profiles, but they are no longer in
// the official directory. They remain untouched in the CMS by the migration.
const RETIRED_MIRROR_ONLY_LEGACY_IDS = new Set(["406", "423"]);
// The official directory has a partner and an associate with this same name.
// Existing records retain their database slug through the migration; a clean
// seed gives the associate a stable, historical-ID suffix.
const ATTORNEY_SLUG_OVERRIDES: Record<string, string> = {
  "333": "alejandro-torres-333",
};

// This is deliberately a single digest for the complete checked-in bilingual
// corpus. It prevents a silent content change in any of the 132 snapshots.
export const CANONICAL_ATTORNEYS_SNAPSHOT_SHA256 = "99e9e2790b61428fe22517758b754a308275cff6c79431c291907fc789e3aa7d";

export type AttorneyResource = Publication & { kind: "news" | "article" };

export type CanonicalAttorney = {
  legacyId: string;
  name: string;
  slug: string;
  title: string;
  titleEs: string;
  role: string;
  roleEs: string;
  email: string;
  phone: string;
  imageUrl: string;
  bioIntro: string;
  bioIntroEs: string;
  bio: string;
  bioEs: string;
  practiceNames: string[];
  industryNames: string[];
  education: Education[];
  affiliations: Affiliation[];
  rankings: Ranking[];
  publications: AttorneyResource[];
  languages: string[];
  languagesEs: string[];
};

type SnapshotProfile = {
  name: string;
  role: string;
  email: string;
  phone: string;
  imageUrl: string;
  intro: string;
  body: string;
  practices: Array<{ text: string; href: string }>;
  industries: Array<{ text: string; href: string }>;
  education: Array<{ text: string; href: string }>;
  affiliations: Array<{ text: string; href: string }>;
  rankings: Array<{ text: string; href: string }>;
  news: Array<{ text: string; href: string }>;
  articles: Array<{ text: string; href: string }>;
  languages: string[];
};

const unsafeContent = /<\/?(?:script|iframe|object|embed)\b|\bon\w+\s*=|\bjavascript\s*:/i;

const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
const normalizeKey = (value: string) => normalize(value)
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase();

function slugify(value: string) {
  return normalizeKey(value).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function absoluteOfficialUrl(value: string) {
  const href = value.trim();
  if (!href) return "";
  try {
    const url = new URL(href, "https://vonwobeser.com/");
    return url.protocol === "https:" && /^(?:www\.)?vonwobeser\.com$/i.test(url.hostname) ? url.toString() : "";
  } catch {
    return "";
  }
}

function paragraphize(value: string) {
  const $ = cheerio.load(`<div id="canonical-attorney-content">${value}</div>`);
  const root = $("#canonical-attorney-content");
  const blocks: string[] = [];

  root.children().each((_, element) => {
    const html = $(element).html() || "";
    const pieces = html
      .split(/(?:\s*<br\s*\/?>(?:\s|&nbsp;)*){2,}/gi)
      .map((piece) => piece.replace(/^\s*<br\s*\/?>|<br\s*\/?>\s*$/gi, "").replace(/\s*<br\s*\/?>(?:\s|&nbsp;)*/gi, " ").trim())
      .filter((piece) => normalize(cheerio.load(`<div>${piece}</div>`)("div").text()));
    for (const piece of pieces) blocks.push(`<p>${piece}</p>`);
  });

  if (!blocks.length) {
    const text = normalize(root.text());
    if (text) blocks.push(`<p>${text}</p>`);
  }
  const html = blocks.join("");
  if (!html || unsafeContent.test(html)) throw new Error("Unsafe or empty canonical attorney biography");
  return html;
}

function listEntries($: cheerio.CheerioAPI, labels: string[]) {
  const target = $(".attorney__meta--list > li").filter((_, element) => {
    const clone = $(element).clone();
    clone.children("ul").remove();
    const label = normalizeKey(clone.text());
    return labels.some((candidate) => label.includes(normalizeKey(candidate)));
  }).first();
  if (!target.length) return [];
  return target.find(":scope > ul > li").map((_, item) => ({
    text: normalize($(item).text()),
    href: absoluteOfficialUrl($(item).find("a").first().attr("href") || ""),
  })).get().filter((entry) => entry.text && !["see more", "ver mas"].includes(normalizeKey(entry.text)));
}

function parseLanguages(entries: Array<{ text: string }>) {
  return entries.flatMap(({ text }) => normalize(text.replace(/[.。]$/g, ""))
    .split(/\s*(?:,|;|\band\b|\be\b|\by\b)\s*/i)
    .map(normalize)
    .filter(Boolean));
}

function readSnapshotProfile(source: string): SnapshotProfile {
  const $ = cheerio.load(fs.readFileSync(source, "utf8"));
  const requiredText = (selector: string) => {
    const value = normalize($(selector).first().text());
    if (!value) throw new Error(`Missing canonical attorney field ${selector}: ${source}`);
    return value;
  };
  const requiredHtml = (selector: string) => {
    const value = $(selector).first().html()?.trim() || "";
    if (!value || unsafeContent.test(value)) throw new Error(`Invalid canonical attorney field ${selector}: ${source}`);
    return value;
  };
  const contact = $(".attorney__meta--txt").first();
  const phone = normalize(contact.text()).match(/\+?[0-9][0-9()\s-]{6,}/)?.[0]?.trim() || "";
  const email = normalize(contact.find('a[href^="mailto:"]').first().text());
  const imageUrl = absoluteOfficialUrl($(".attorney__meta--img img").first().attr("src") || "");
  if (!phone || !email || !imageUrl) throw new Error(`Missing canonical attorney contact data: ${source}`);

  return {
    name: requiredText(".attorney__meta--name"),
    role: requiredText(".attorney__meta--role"),
    email,
    phone,
    imageUrl,
    intro: requiredHtml(".attorney__content--intro"),
    body: requiredHtml(".attorney__content--txt"),
    practices: listEntries($, ["Practices", "Prácticas"]),
    industries: listEntries($, ["Industry Groups", "Grupos de Industria"]),
    education: listEntries($, ["Education & Experience", "Educación y Experiencia"]),
    affiliations: listEntries($, ["Affiliations & Academic Activities", "Afiliaciones y Actividades Académicas"]),
    rankings: listEntries($, ["Recognitions", "Reconocimientos"]),
    news: listEntries($, ["News", "Noticias"]),
    articles: listEntries($, ["Articles", "Artículos"]),
    languages: parseLanguages(listEntries($, ["Languages", "Idiomas"])),
  };
}

function zipEntries<T>(en: Array<{ text: string; href: string }>, es: Array<{ text: string; href: string }>, mapper: (english: string, spanish: string, href: string) => T) {
  // A few historical profiles have a resource in only one language. Retain it
  // instead of silently dropping it; the available text is used as the safe
  // editorial fallback for the missing translation.
  return Array.from({ length: Math.max(en.length, es.length) }, (_, index) => {
    const english = en[index];
    const spanish = es[index];
    return mapper(english?.text || spanish?.text || "", spanish?.text || english?.text || "", english?.href || spanish?.href || "");
  });
}

function snapshotIds(dir: string) {
  return fs.readdirSync(path.join(dir, "index.php", "abogado"))
    .map((file) => file.match(/^l-(\d+)\.html$/)?.[1])
    .filter((id): id is string => typeof id === "string" && !RETIRED_MIRROR_ONLY_LEGACY_IDS.has(id))
    .sort((a, b) => Number(a) - Number(b));
}

function snapshotDigest(dir: string) {
  const parts = snapshotIds(dir).flatMap((id) => [
    fs.readFileSync(path.join(dir, "index.php", "abogado", `l-${id}.html`)),
    fs.readFileSync(path.join(dir, "index.php", "lawyer", `l-${id}.html`)),
  ]);
  return crypto.createHash("sha256").update(Buffer.concat(parts)).digest("hex");
}

const bernardoZatarain: CanonicalAttorney = {
  legacyId: "457", name: "Bernardo Zatarain", slug: "bernardo-zatarain",
  title: "Associate", titleEs: "Asociado", role: "Associate", roleEs: "Asociado",
  email: "bzatarain@vwys.com.mx", phone: "+52 (33) 2489-9408",
  imageUrl: "https://vonwobeser.com/images/Bernardo_Zatarain_2026-07-20.jpeg",
  bioIntro: "<p>Bernardo Zatarain is an associate at Von Wobeser y Sierra. He specializes in dispute resolution and has over four years of experience in civil and commercial litigation, commercial arbitration, and constitutional proceedings such as the juicio de amparo.</p>",
  bioIntroEs: "<p>Bernardo Zatarain es asociado en Von Wobeser y Sierra. Se especializa en resolución de controversias y cuenta con más de cuatro años de experiencia en litigio civil y mercantil, arbitraje comercial y procedimientos constitucionales como el juicio de amparo.</p>",
  bio: "<p>He has advised Mexican and foreign companies in disputes in the automotive, consumer goods, real estate, and energy sectors, both before state courts and leading Mexican and international arbitral institutions. He also has experience in preventive counseling, identification and mitigation of litigation risks, and negotiation of favorable settlements for his clients.</p><p>He has participated in amparo proceedings against acts of various administrative and judicial authorities, appearing before federal courts at all levels, from District Courts to the Supreme Court of Justice of Mexico. His practice includes a particular focus on the stay of the challenged act (suspensión del acto reclamado), having successfully obtained favorable rulings that have allowed his clients to maintain business continuity during legal proceedings.</p>",
  bioEs: "<p>Ha asesorado a empresas mexicanas y extranjeras en controversias en los sectores automotriz, bienes de consumo, inmobiliario y energía, tanto ante tribunales estatales como ante instituciones arbitrales mexicanas e internacionales de primer nivel. Cuenta también con experiencia en asesoría preventiva, identificación y mitigación de contingencias litigiosas, y negociación de arreglos favorables para sus clientes.</p><p>Ha intervenido en juicios de amparo contra actos de diversas autoridades administrativas y judiciales, compareciendo ante tribunales federales en todas las instancias, desde juzgados de distrito hasta la Suprema Corte de Justicia de la Nación. En su práctica se ha especializado en la suspensión del acto reclamado, obteniendo resoluciones favorables que han permitido a sus clientes mantener la continuidad de sus operaciones durante los procedimientos.</p>",
  practiceNames: ["Arbitraje", "Litigio"], industryNames: ["Automotriz, Movilidad y Manufactura", "Bienes de Consumo", "Energía y Recursos Naturales"],
  education: [{ degree: "Law Degree (J.D.) with honors, Universidad Panamericana, Campus Guadalajara.", degreeEs: "Título de Abogado (J.D.) con mención honorífica, Universidad Panamericana, Campus Guadalajara.", school: "" }, { degree: "Ceneval Award for Excellence in Performance EGEL 2024.", degreeEs: "Premio Ceneval al Desempeño de Excelencia EGEL 2024.", school: "" }],
  affiliations: [
    { organization: "Winner of the XV edition of the CIARB Moot of Latin America with the Universidad Panamericana, Campus Guadalajara team.", organizationEs: "Ganador de la XV edición del Moot de Latinoamérica CIARB, con el equipo de la Universidad Panamericana, Campus Guadalajara." },
    { organization: "Participated in the XXVIII edition of the Willem C. Vis International Commercial Arbitration Moot, receiving honorable mentions for both the Claimant and Respondent memoranda.", organizationEs: "Participó en la XXVIII edición del Willem C. Vis Moot, con menciones honoríficas para los memorándums de la Demandante y la Demandada." },
    { organization: "Co-author of the article “Sports organizations’ duty to protect athletes’ dignity: a universal human rights analysis to comply with the prohibition of non-accidental violence in sports regulations”, published in the International Sports Law Journal.", organizationEs: "Coautor del artículo “El deber de las organizaciones deportivas de proteger la dignidad de los deportistas: un análisis desde la perspectiva de los derechos humanos universales para cumplir con la prohibición de la violencia no accidental en las normas deportivas”, publicado en la revista International Sports Law Journal." },
  ],
  rankings: [], publications: [], languages: ["Spanish", "English"], languagesEs: ["Español", "inglés"],
};

/** Reads the versioned source and returns the 133 official bilingual profiles. */
export function loadCanonicalAttorneyContent(mirrorDir = getMirrorDir()): CanonicalAttorney[] {
  const digest = snapshotDigest(mirrorDir);
  if (CANONICAL_ATTORNEYS_SNAPSHOT_SHA256 && digest !== CANONICAL_ATTORNEYS_SNAPSHOT_SHA256) {
    throw new Error("Canonical attorney snapshot changed unexpectedly");
  }
  const usedSlugs = new Set<string>();
  const attorneys = snapshotIds(mirrorDir).map((legacyId) => {
    const es = readSnapshotProfile(path.join(mirrorDir, "index.php", "abogado", `l-${legacyId}.html`));
    const en = readSnapshotProfile(path.join(mirrorDir, "index.php", "lawyer", `l-${legacyId}.html`));
    if (normalizeKey(es.name) !== normalizeKey(en.name)) throw new Error(`Name mismatch in attorney ${legacyId}`);
    const baseSlug = ATTORNEY_SLUG_OVERRIDES[legacyId] || slugify(es.name);
    // The official directory contains two distinct Alejandro Torres profiles.
    // A clean installation needs a deterministic unique slug; the migration
    // never changes the existing production slug for either record.
    const slug = usedSlugs.has(baseSlug) ? `${baseSlug}-${legacyId}` : baseSlug;
    usedSlugs.add(slug);
    return {
      legacyId,
      name: es.name,
      slug,
      title: en.role,
      titleEs: es.role,
      role: en.role,
      roleEs: es.role,
      email: es.email,
      phone: es.phone,
      imageUrl: es.imageUrl,
      bioIntro: paragraphize(en.intro),
      bioIntroEs: paragraphize(es.intro),
      bio: paragraphize(en.body),
      bioEs: paragraphize(es.body),
      practiceNames: es.practices.map((entry) => entry.text),
      industryNames: es.industries.map((entry) => entry.text),
      education: zipEntries(en.education, es.education, (degree, degreeEs) => ({ degree, degreeEs, school: "" })),
      affiliations: zipEntries(en.affiliations, es.affiliations, (organization, organizationEs) => ({ organization, organizationEs })),
      rankings: zipEntries(en.rankings, es.rankings, (publication, publicationEs) => ({ publication, ranking: "", rankingEs: publicationEs })),
      publications: [
        ...zipEntries(en.news, es.news, (title, titleEs, url) => ({ title, titleEs, url, kind: "news" as const })),
        ...zipEntries(en.articles, es.articles, (title, titleEs, url) => ({ title, titleEs, url, kind: "article" as const })),
      ],
      languages: en.languages,
      languagesEs: es.languages,
    } satisfies CanonicalAttorney;
  });
  if (attorneys.length !== 132) throw new Error(`Expected 132 versioned attorney profiles, found ${attorneys.length}`);
  return [...attorneys, bernardoZatarain];
}

export function canonicalAttorneySnapshotDigest(mirrorDir = getMirrorDir()) {
  return snapshotDigest(mirrorDir);
}

type SeedAttorney = {
  name: string;
  titleEs: string;
  [key: string]: unknown;
};

/**
 * Fresh installations receive the official directory rather than the old,
 * abbreviated seed. Presentation metadata remains where it already exists.
 */
export function applyCanonicalAttorneyContent<T extends SeedAttorney>(seed: readonly T[]): Array<T | (CanonicalAttorney & { isPartner: boolean; order: number; published: boolean })> {
  const canonical = loadCanonicalAttorneyContent();
  const byIdentity = new Map(canonical.map((attorney) => [`${normalizeKey(attorney.name)}|${normalizeKey(attorney.titleEs)}`, attorney]));
  // Keep the nine non-official records intact. They are intentionally retained
  // in the directory while the canonical profiles receive only editorial data.
  const usedSlugs = new Set<string>();
  const seeded: Array<T | (CanonicalAttorney & { isPartner: boolean; order: number; published: boolean })> = seed.flatMap((attorney) => {
    const source = byIdentity.get(`${normalizeKey(attorney.name)}|${normalizeKey(attorney.titleEs)}`);
    const currentSlug = typeof attorney.slug === "string" ? attorney.slug : "";
    if (!source && !preservedAdditionalAttorneySlugs.has(currentSlug)) return [];
    const stableSlug = currentSlug && !usedSlugs.has(currentSlug)
      ? currentSlug
      : source?.slug || currentSlug;
    if (stableSlug) usedSlugs.add(stableSlug);
    if (!source) return [attorney];
    // Slug, image, display order and publication state are presentation metadata
    // and must remain stable across a clean install just as in the migration.
    return [{
      ...attorney,
      ...(stableSlug ? { slug: stableSlug } : {}),
      name: source.name,
      title: source.title,
      titleEs: source.titleEs,
      role: source.role,
      roleEs: source.roleEs,
      email: source.email,
      phone: source.phone,
      bioIntro: source.bioIntro,
      bioIntroEs: source.bioIntroEs,
      bio: source.bio,
      bioEs: source.bioEs,
      education: source.education,
      affiliations: source.affiliations,
      rankings: source.rankings,
      publications: source.publications,
      languages: source.languages,
      languagesEs: source.languagesEs,
    }];
  });
  const seededIdentities = new Set(seeded.map((attorney) => `${normalizeKey(attorney.name)}|${normalizeKey(attorney.titleEs)}`));
  for (const attorney of canonical) {
    const identity = `${normalizeKey(attorney.name)}|${normalizeKey(attorney.titleEs)}`;
    if (!seededIdentities.has(identity)) {
      seeded.push({ ...attorney, isPartner: attorney.title === "Partner", order: 9999, published: true });
    }
  }
  return seeded;
}

export const preservedAdditionalAttorneySlugs = new Set([
  "adrian-rodriguez", "christopher-wilkerson", "jose-carlos-aguilar", "jose-luis-ortega",
  "juan-manuel-moran", "paola-hernandez", "raul-quintero", "regina-forte", "ruben-villegas",
]);
