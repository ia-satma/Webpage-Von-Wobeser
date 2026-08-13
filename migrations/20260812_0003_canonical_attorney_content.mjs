import * as cheerio from "cheerio";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const RETIRED_MIRROR_ONLY_LEGACY_IDS = new Set(["406", "423"]);
// The official profile snapshots still mention this retired practice for a few
// historical biographies. It was intentionally removed from the active CMS
// catalogue, so no team-member relationship may be created for it.
const RETIRED_PRACTICE_NAMES = new Set(["administrativo y regulatorio"]);
const SNAPSHOT_SHA256 = "99e9e2790b61428fe22517758b754a308275cff6c79431c291907fc789e3aa7d";
const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
const key = (value) => clean(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const slugify = (value) => key(value).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const unsafe = /<\/?(?:script|iframe|object|embed)\b|\bon\w+\s*=|\bjavascript\s*:/i;

function mirrorDir() {
  const candidates = [process.env.MIRROR_DIR, path.resolve(process.cwd(), "frontend-mirror"), path.resolve(process.cwd(), "dist", "frontend-mirror")].filter(Boolean);
  return candidates.find((dir) => fs.existsSync(path.join(dir, "index.php", "abogado"))) || candidates[0];
}

function ids(dir) {
  return fs.readdirSync(path.join(dir, "index.php", "abogado"))
    .map((file) => file.match(/^l-(\d+)\.html$/)?.[1])
    .filter((id) => id && !RETIRED_MIRROR_ONLY_LEGACY_IDS.has(id))
    .sort((a, b) => Number(a) - Number(b));
}

function digest(dir) {
  const files = ids(dir).flatMap((id) => [
    fs.readFileSync(path.join(dir, "index.php", "abogado", `l-${id}.html`)),
    fs.readFileSync(path.join(dir, "index.php", "lawyer", `l-${id}.html`)),
  ]);
  return crypto.createHash("sha256").update(Buffer.concat(files)).digest("hex");
}

function absolute(value) {
  try {
    const url = new URL(String(value || ""), "https://vonwobeser.com/");
    return url.protocol === "https:" && /^(?:www\.)?vonwobeser\.com$/i.test(url.hostname) ? url.toString() : "";
  } catch { return ""; }
}

function paragraphize(value) {
  const $ = cheerio.load(`<div id="content">${value}</div>`, { decodeEntities: false });
  const blocks = [];
  $("#content").children().each((_, el) => {
    const pieces = ($(el).html() || "").split(/(?:\s*<br\s*\/?>(?:\s|&nbsp;)*){2,}/gi)
      .map((part) => part.replace(/^\s*<br\s*\/?>|<br\s*\/?>\s*$/gi, "").replace(/\s*<br\s*\/?>(?:\s|&nbsp;)*/gi, " ").trim())
      .filter((part) => clean(cheerio.load(`<div>${part}</div>`)("div").text()));
    pieces.forEach((part) => blocks.push(`<p>${part}</p>`));
  });
  const output = blocks.join("");
  if (!output || unsafe.test(output)) throw new Error("Invalid canonical attorney rich text");
  return output;
}

function entries($, labels) {
  const section = $(".attorney__meta--list > li").filter((_, element) => {
    const clone = $(element).clone(); clone.children("ul").remove();
    const label = key(clone.text());
    return labels.some((candidate) => label.includes(key(candidate)));
  }).first();
  return section.find(":scope > ul > li").map((_, item) => ({
    text: clean($(item).text()), href: absolute($(item).find("a").first().attr("href")),
  })).get().filter((item) => item.text && !["see more", "ver mas"].includes(key(item.text)));
}

function read(source) {
  const $ = cheerio.load(fs.readFileSync(source, "utf8"), { decodeEntities: false });
  const html = (selector) => {
    const value = $(selector).first().html()?.trim() || "";
    if (!value || unsafe.test(value)) throw new Error(`Missing canonical attorney content: ${source}`);
    return value;
  };
  const contact = $(".attorney__meta--txt").first();
  const phone = clean(contact.text()).match(/\+?[0-9][0-9()\s-]{6,}/)?.[0]?.trim() || "";
  const email = clean(contact.find('a[href^="mailto:"]').first().text());
  const imageUrl = absolute($(".attorney__meta--img img").first().attr("src"));
  if (!phone || !email || !imageUrl) throw new Error(`Missing canonical attorney contact data: ${source}`);
  return {
    name: clean($(".attorney__meta--name").first().text()), role: clean($(".attorney__meta--role").first().text()), email, phone, imageUrl,
    intro: html(".attorney__content--intro"), body: html(".attorney__content--txt"),
    practices: entries($, ["Practices", "Prácticas"]), industries: entries($, ["Industry Groups", "Grupos de Industria"]),
    education: entries($, ["Education & Experience", "Educación y Experiencia"]), affiliations: entries($, ["Affiliations & Academic Activities", "Afiliaciones y Actividades Académicas"]),
    rankings: entries($, ["Recognitions", "Reconocimientos"]), news: entries($, ["News", "Noticias"]), articles: entries($, ["Articles", "Artículos"]),
    languages: entries($, ["Languages", "Idiomas"]).flatMap((item) => clean(item.text.replace(/[.。]$/g, "")).split(/\s*(?:,|;|\band\b|\be\b|\by\b)\s*/i).map(clean).filter(Boolean)),
  };
}

function pair(en, es, mapper) {
  return Array.from({ length: Math.max(en.length, es.length) }, (_, index) => {
    const english = en[index] || {}; const spanish = es[index] || {};
    return mapper(english.text || spanish.text || "", spanish.text || english.text || "", english.href || spanish.href || "");
  });
}

const bernardo = {
  legacyId: "457", name: "Bernardo Zatarain", title: "Associate", titleEs: "Asociado", role: "Associate", roleEs: "Asociado",
  email: "bzatarain@vwys.com.mx", phone: "+52 (33) 2489-9408", imageUrl: "https://vonwobeser.com/images/Bernardo_Zatarain_2026-07-20.jpeg",
  bioIntro: "<p>Bernardo Zatarain is an associate at Von Wobeser y Sierra. He specializes in dispute resolution and has over four years of experience in civil and commercial litigation, commercial arbitration, and constitutional proceedings such as the juicio de amparo.</p>",
  bioIntroEs: "<p>Bernardo Zatarain es asociado en Von Wobeser y Sierra. Se especializa en resolución de controversias y cuenta con más de cuatro años de experiencia en litigio civil y mercantil, arbitraje comercial y procedimientos constitucionales como el juicio de amparo.</p>",
  bio: "<p>He has advised Mexican and foreign companies in disputes in the automotive, consumer goods, real estate, and energy sectors, both before state courts and leading Mexican and international arbitral institutions. He also has experience in preventive counseling, identification and mitigation of litigation risks, and negotiation of favorable settlements for his clients.</p><p>He has participated in amparo proceedings against acts of various administrative and judicial authorities, appearing before federal courts at all levels, from District Courts to the Supreme Court of Justice of Mexico. His practice includes a particular focus on the stay of the challenged act (suspensión del acto reclamado), having successfully obtained favorable rulings that have allowed his clients to maintain business continuity during legal proceedings.</p>",
  bioEs: "<p>Ha asesorado a empresas mexicanas y extranjeras en controversias en los sectores automotriz, bienes de consumo, inmobiliario y energía, tanto ante tribunales estatales como ante instituciones arbitrales mexicanas e internacionales de primer nivel. Cuenta también con experiencia en asesoría preventiva, identificación y mitigación de contingencias litigiosas, y negociación de arreglos favorables para sus clientes.</p><p>Ha intervenido en juicios de amparo contra actos de diversas autoridades administrativas y judiciales, compareciendo ante tribunales federales en todas las instancias, desde juzgados de distrito hasta la Suprema Corte de Justicia de la Nación. En su práctica se ha especializado en la suspensión del acto reclamado, obteniendo resoluciones favorables que han permitido a sus clientes mantener la continuidad de sus operaciones durante los procedimientos.</p>",
  practiceNames: ["Arbitraje", "Litigio"], industryNames: ["Automotriz, Movilidad y Manufactura", "Bienes de Consumo", "Energía y Recursos Naturales"],
  education: [{ degree: "Law Degree (J.D.) with honors, Universidad Panamericana, Campus Guadalajara.", degreeEs: "Título de Abogado (J.D.) con mención honorífica, Universidad Panamericana, Campus Guadalajara.", school: "" }, { degree: "Ceneval Award for Excellence in Performance EGEL 2024.", degreeEs: "Premio Ceneval al Desempeño de Excelencia EGEL 2024.", school: "" }],
  affiliations: [{ organization: "Winner of the XV edition of the CIARB Moot of Latin America with the Universidad Panamericana, Campus Guadalajara team.", organizationEs: "Ganador de la XV edición del Moot de Latinoamérica CIARB, con el equipo de la Universidad Panamericana, Campus Guadalajara." }, { organization: "Participated in the XXVIII edition of the Willem C. Vis International Commercial Arbitration Moot, receiving honorable mentions for both the Claimant and Respondent memoranda.", organizationEs: "Participó en la XXVIII edición del Willem C. Vis Moot, con menciones honoríficas para los memorándums de la Demandante y la Demandada." }, { organization: "Co-author of the article “Sports organizations’ duty to protect athletes’ dignity: a universal human rights analysis to comply with the prohibition of non-accidental violence in sports regulations”, published in the International Sports Law Journal.", organizationEs: "Coautor del artículo “El deber de las organizaciones deportivas de proteger la dignidad de los deportistas: un análisis desde la perspectiva de los derechos humanos universales para cumplir con la prohibición de la violencia no accidental en las normas deportivas”, publicado en la revista International Sports Law Journal." }],
  rankings: [], publications: [], languages: ["Spanish", "English"], languagesEs: ["Español", "inglés"],
};

function canonical(dir) {
  if (digest(dir) !== SNAPSHOT_SHA256) throw new Error("Canonical attorney snapshot changed unexpectedly");
  const rows = ids(dir).map((legacyId) => {
    const es = read(path.join(dir, "index.php", "abogado", `l-${legacyId}.html`));
    const en = read(path.join(dir, "index.php", "lawyer", `l-${legacyId}.html`));
    if (key(es.name) !== key(en.name)) throw new Error(`Bilingual name mismatch: ${legacyId}`);
    return {
      legacyId, name: es.name, title: en.role, titleEs: es.role, role: en.role, roleEs: es.role, email: es.email, phone: es.phone, imageUrl: es.imageUrl,
      bioIntro: paragraphize(en.intro), bioIntroEs: paragraphize(es.intro), bio: paragraphize(en.body), bioEs: paragraphize(es.body),
      practiceNames: es.practices.map((item) => item.text), industryNames: es.industries.map((item) => item.text),
      education: pair(en.education, es.education, (degree, degreeEs) => ({ degree, degreeEs, school: "" })),
      affiliations: pair(en.affiliations, es.affiliations, (organization, organizationEs) => ({ organization, organizationEs })),
      rankings: pair(en.rankings, es.rankings, (publication, rankingEs) => ({ publication, ranking: "", rankingEs })),
      publications: [...pair(en.news, es.news, (title, titleEs, url) => ({ title, titleEs, url, kind: "news" })), ...pair(en.articles, es.articles, (title, titleEs, url) => ({ title, titleEs, url, kind: "article" }))],
      languages: en.languages, languagesEs: es.languages,
    };
  });
  if (rows.length !== 132) throw new Error(`Expected 132 attorney snapshots, got ${rows.length}`);
  return [...rows, bernardo];
}

function resolveInternalResources(publications, newsRows) {
  const byTitle = new Map();
  for (const row of newsRows) {
    byTitle.set(key(row.title), row); byTitle.set(key(row.title_es), row);
  }
  return publications.map((resource) => {
    const match = byTitle.get(key(resource.title)) || byTitle.get(key(resource.titleEs));
    if (!match) return resource;
    const prefix = match.category === "articles" ? "/articles/" : "/news/";
    return { ...resource, url: `${prefix}${match.slug}` };
  });
}

function resolveGroupIds(names, groupsByName, retiredNames, kind, attorneyName) {
  const unresolved = names.filter((name) => !groupsByName.has(key(name)) && !retiredNames.has(key(name)));
  if (unresolved.length) {
    throw new Error(`Unresolved canonical ${kind} groups for ${attorneyName}: ${unresolved.join(", ")}`);
  }
  return names.map((name) => groupsByName.get(key(name))).filter(Boolean);
}

async function insertCanonicalMember(client, attorney, publications, usedSlugs) {
  const baseSlug = slugify(attorney.name);
  let slug = baseSlug;
  let suffix = 2;
  while (usedSlugs.has(slug)) slug = `${baseSlug}-${suffix++}`;
  const inserted = await client.query(`
    INSERT INTO team_members (name, slug, title, title_es, role, role_es, bio, bio_es, bio_intro, bio_intro_es, email, phone, image_url, is_partner, "order", published, education, affiliations, rankings, publications, languages, languages_es)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 9999, true, $15::jsonb, $16::jsonb, $17::jsonb, $18::jsonb, $19::jsonb, $20::jsonb)
    RETURNING id, slug
  `, [attorney.name, slug, attorney.title, attorney.titleEs, attorney.role, attorney.roleEs, attorney.bio, attorney.bioEs, attorney.bioIntro, attorney.bioIntroEs, attorney.email, attorney.phone, attorney.imageUrl, attorney.title === "Partner", JSON.stringify(attorney.education), JSON.stringify(attorney.affiliations), JSON.stringify(attorney.rankings), JSON.stringify(publications), JSON.stringify(attorney.languages), JSON.stringify(attorney.languagesEs)]);
  const member = inserted.rows[0];
  usedSlugs.add(member.slug || slug);
  return member;
}

export default async function migrateCanonicalAttorneyContent(client) {
  await client.query("ALTER TABLE team_members ADD COLUMN IF NOT EXISTS bio_intro text");
  await client.query("ALTER TABLE team_members ADD COLUMN IF NOT EXISTS bio_intro_es text");
  await client.query("ALTER TABLE team_members ADD COLUMN IF NOT EXISTS languages_es jsonb");

  const attorneys = canonical(mirrorDir());
  const [membersResult, practicesResult, industriesResult, newsResult] = await Promise.all([
    client.query("SELECT id, name, title_es, email, slug FROM team_members"),
    client.query("SELECT id, name_es FROM practice_groups"),
    client.query("SELECT id, name_es FROM industry_groups"),
    client.query("SELECT slug, title, title_es, category FROM news"),
  ]);
  const memberByIdentity = new Map(membersResult.rows.map((member) => [`${key(member.name)}|${key(member.title_es)}`, member]));
  const membersByName = new Map();
  const membersByEmail = new Map();
  const membersBySlug = new Map();
  for (const member of membersResult.rows) {
    const normalizedName = key(member.name);
    membersByName.set(normalizedName, [...(membersByName.get(normalizedName) || []), member]);
    if (member.email) membersByEmail.set(key(member.email), [...(membersByEmail.get(key(member.email)) || []), member]);
    if (member.slug) membersBySlug.set(key(member.slug), member);
  }
  const practiceByName = new Map(practicesResult.rows.map((group) => [key(group.name_es), group.id]));
  const industryByName = new Map(industriesResult.rows.map((group) => [key(group.name_es), group.id]));
  const canonicalExisting = attorneys.filter((attorney) => attorney.legacyId !== "457");
  const usedSlugs = new Set(membersResult.rows.map((member) => member.slug).filter(Boolean));
  const existingMembers = [];
  for (const attorney of canonicalExisting) {
    const identity = `${key(attorney.name)}|${key(attorney.titleEs)}`;
    const sameName = membersByName.get(key(attorney.name)) || [];
    const sameEmail = membersByEmail.get(key(attorney.email)) || [];
    // Names and gendered titles were abbreviated or stale in older CMS seeds.
    // Email and a unique name are safe fallbacks. A genuinely absent official
    // profile is created rather than blocking the entire deployment.
    const member = memberByIdentity.get(identity)
      || (sameEmail.length === 1 ? sameEmail[0] : undefined)
      || (sameName.length === 1 ? sameName[0] : undefined)
      || membersBySlug.get(key(slugify(attorney.name)));
    if (member) {
      existingMembers.push([attorney, member]);
      continue;
    }
    const publications = resolveInternalResources(attorney.publications, newsResult.rows);
    const inserted = await insertCanonicalMember(client, attorney, publications, usedSlugs);
    existingMembers.push([attorney, inserted]);
  }
  if (existingMembers.length !== 132) throw new Error("Expected 132 canonical attorney updates");

  const bernardoExisting = memberByIdentity.get(`${key(bernardo.name)}|${key(bernardo.titleEs)}`);
  let bernardoId = bernardoExisting?.id;
  if (!bernardoId) {
    const inserted = await client.query(`
      INSERT INTO team_members (name, slug, title, title_es, role, role_es, bio, bio_es, bio_intro, bio_intro_es, email, phone, image_url, is_partner, "order", published, education, affiliations, rankings, publications, languages, languages_es)
      VALUES ($1, 'bernardo-zatarain', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, false, 9999, true, $13::jsonb, $14::jsonb, $15::jsonb, $16::jsonb, $17::jsonb, $18::jsonb)
      RETURNING id
    `, [bernardo.name, bernardo.title, bernardo.titleEs, bernardo.role, bernardo.roleEs, bernardo.bio, bernardo.bioEs, bernardo.bioIntro, bernardo.bioIntroEs, bernardo.email, bernardo.phone, bernardo.imageUrl, JSON.stringify(bernardo.education), JSON.stringify(bernardo.affiliations), JSON.stringify(bernardo.rankings), JSON.stringify(bernardo.publications), JSON.stringify(bernardo.languages), JSON.stringify(bernardo.languagesEs)]);
    bernardoId = inserted.rows[0].id;
  }

  const allMembers = [...existingMembers, [bernardo, { id: bernardoId }]];
  for (const [attorney, member] of allMembers) {
    const publications = resolveInternalResources(attorney.publications, newsResult.rows);
    if (attorney.legacyId !== "457") {
      await client.query(`
        UPDATE team_members SET name = $1, title = $2, title_es = $3, role = $4, role_es = $5, bio = $6, bio_es = $7, bio_intro = $8, bio_intro_es = $9, email = $10, phone = $11, education = $12::jsonb, affiliations = $13::jsonb, rankings = $14::jsonb, publications = $15::jsonb, languages = $16::jsonb, languages_es = $17::jsonb
        WHERE id = $18
      `, [attorney.name, attorney.title, attorney.titleEs, attorney.role, attorney.roleEs, attorney.bio, attorney.bioEs, attorney.bioIntro, attorney.bioIntroEs, attorney.email, attorney.phone, JSON.stringify(attorney.education), JSON.stringify(attorney.affiliations), JSON.stringify(attorney.rankings), JSON.stringify(publications), JSON.stringify(attorney.languages), JSON.stringify(attorney.languagesEs), member.id]);
    }
    const practiceIds = resolveGroupIds(attorney.practiceNames, practiceByName, RETIRED_PRACTICE_NAMES, "practice", attorney.name);
    const industryIds = resolveGroupIds(attorney.industryNames, industryByName, new Set(), "industry", attorney.name);
    await client.query("DELETE FROM team_member_practice_groups WHERE team_member_id = $1", [member.id]);
    await client.query("DELETE FROM team_member_industry_groups WHERE team_member_id = $1", [member.id]);
    for (const practiceGroupId of practiceIds) await client.query("INSERT INTO team_member_practice_groups (team_member_id, practice_group_id) VALUES ($1, $2)", [member.id, practiceGroupId]);
    for (const industryGroupId of industryIds) await client.query("INSERT INTO team_member_industry_groups (team_member_id, industry_group_id) VALUES ($1, $2)", [member.id, industryGroupId]);
  }
}
