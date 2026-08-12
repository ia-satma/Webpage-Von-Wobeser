import * as cheerio from "cheerio";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// This migration deliberately reads the checked-in editorial snapshot instead
// of embedding a lossy copy in SQL. run-migrations.mjs wraps it in the same
// database transaction and records its checksum just like a SQL migration.
const practices = [
  ["corporate-ma", "17", "Corporate, Mergers & Acquisitions", "Corporativo, Fusiones y Adquisiciones", "2b8b792837e4fe11a9627c6c257fbe9a1372a618dfc4fc5d87af288b2f245a7f"],
  ["antitrust-competition", "14", "Competition & Antitrust", "Competencia Económica", "f22a67b90a5a99df4a81383dd4cfc88685f593013f98b4f57eb387bdde666fc9"],
  ["arbitration", "46", "Arbitration", "Arbitraje", "c582d43613bcf6ebefea1a5a6a6c4799ed590ab2c4480092430c84319793dc20"],
  ["litigation", "47", "Litigation", "Litigio", "7a954381df7eb24cfc0ba97388d1022829bcd9040e0ce19d0293e96ddc56c208"],
  ["investigations-anticorruption", "5", "Investigations, Anti-corruption & Compliance", "Investigaciones, Anticorrupción y Compliance", "74ca057bebbfc98ef0eaaaff15fd7e2bfd081274c3d5e43ac12e55be200b10f5"],
  ["bankruptcy-restructuring", "15", "Bankruptcy & Restructuring", "Concursos Mercantiles y Reestructuración", "f73f85b9eb075ae64b0aa6afedcc4449c5bba09fcd45bf717ddab5d78ea17dd3"],
  ["banking-finance", "9", "Banking & Finance", "Bancario y Financiero", "aaabe0d735a74e140a748d7b29deda832630fd1c28408bf55941795daf29e00f"],
  ["energy-natural-resources", "18", "Energy & Natural Resources", "Energía y Recursos Naturales", "f29deab3430794ea8e9df7fae60206edd85e7c71f278d347adbb02eb1081f954"],
  ["esg", "90", "ESG (Environmental, Social and Governance)", "ESG (Ambiental, Social y Gobierno Corporativo)", "e084d12fd2b9d094388d315f6972503541df469811aa59eea455ef2e34cc4bcc"],
  ["real-estate", "23", "Real Estate", "Inmobiliario", "7accfe527cc68353c49b21a69b8a9201569b0a4b32c732da4ec4be03030d0097"],
  ["intellectual-property", "33", "Industrial & Intellectual Property", "Propiedad Industrial e Intelectual", "a383fc8ea3ad814717046a6ee3754fff7d505a37a8bbeb4bb9ff6a52a4d77312"],
  ["labor-employment", "26", "Labor, Executive Compensations & Benefits", "Laboral, Compensación de Ejecutivos y Prestaciones", "f7c3788a42d706d4cd9964055076149df8113c553fc6450742d938f1020bbbc1"],
  ["tax", "20", "Tax (Consultancy, Controversy & Litigation)", "Fiscal (Consultoría, Controversias y Litigio)", "edd44cc464fc1f6c73716039d07d345877eff3bec3fdfaf92fa576ab7f65ca9f"],
  ["international-trade", "12", "International Trade & Customs", "Comercio Exterior y Aduanas", "386ca9bb51c481e37f5b986c21dbf80463aa6caaf4d9fbb4e168b25d85226868"],
  ["telecommunications-media-technology", "39", "Telecommunications, Media & Technology", "Telecomunicaciones, Medios y Tecnología", "bf647b1130c722d5c9823a6fcca0e84ddfb7cbed1456c5aa76d058fbde189a4e"],
  ["environmental", "3", "Environmental", "Ambiental", "5f73d659c4750d431d7c67b00146f25be7e76a1392a73c4430c68d3aba640bde"],
  ["immigration-global-mobility", "89", "Immigration & Global Mobility", "Migración y Movilidad Global", "12ba226a77703a541239dd07fe6ba3c5f4fd21a80023677ea1f9988992ac0529"],
  ["projects-infrastructure", "92", "Projects & Infrastructure", "Proyectos e Infraestructura", "3a94deb57dd923558b583bf8a56717eed870235052611ace52973bb1f9fbed6c"],
];
const paragraphBreak = /(?:\s*<br\s*\/?>\s*){2,}/gi;
const inlineBreak = /\s*<br\s*\/?>\s*/gi;

function mirrorDir() {
  const candidates = [
    process.env.MIRROR_DIR,
    path.resolve(process.cwd(), "frontend-mirror"),
    path.resolve(process.cwd(), "dist", "frontend-mirror"),
    path.resolve(process.cwd(), "..", "mirror"),
    path.resolve(process.cwd(), "mirror"),
  ].filter(Boolean);
  return candidates.find((dir) => fs.existsSync(path.join(dir, "index.html"))) || candidates[0];
}

function content(dir, languageDirectory, legacyId) {
  const source = path.join(dir, "index.php", languageDirectory, `p-${legacyId}.html`);
  const $ = cheerio.load(fs.readFileSync(source, "utf8"));
  const field = (selector) => {
    const value = $(selector).first().html()?.trim();
    if (!value) throw new Error(`Missing canonical practice content: ${source} ${selector}`);
    return value;
  };
  return { description: field(".single__content--intro"), fullDescription: field(".single__content--txt") };
}

function plainText(html) {
  return cheerio.load(`<div>${html}</div>`)("div").text().replace(/\s+/g, " ").trim();
}

function paragraphBlocks(html) {
  const $ = cheerio.load(`<div id="canonical-practice-body">${html}</div>`, { decodeEntities: false });
  const root = $("#canonical-practice-body");
  const spans = root.children("span");
  const onlyBlockSpans = spans.length > 0 && root.contents().toArray().every((node) =>
    node.type === "text" ? !$(node).text().trim() : node.type === "tag" && node.tagName === "span",
  );
  if (onlyBlockSpans) return spans.toArray().map((span) => $(span).html()?.trim() || "").filter(Boolean);
  return (root.html() || "").split(paragraphBreak)
    .map((block) => block.replace(inlineBreak, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function formatPracticeContent(description, fullDescription) {
  const blocks = paragraphBlocks(fullDescription);
  const $ = cheerio.load(`<div id="canonical-practice-intro">${description}</div>`, { decodeEntities: false });
  const intro = $("#canonical-practice-intro");
  const lastParagraph = intro.find("p").last();
  if (lastParagraph.length && /\bS\.$/.test(plainText(lastParagraph.html() || "")) && /^C\./.test(plainText(blocks[0] || ""))) {
    lastParagraph.append(blocks.shift() || "");
  }
  return {
    description: intro.html()?.trim() || "",
    fullDescription: blocks.map((block) => `<p>${block}</p>`).join(""),
  };
}

export default async function migrateCanonicalPracticeContent(client) {
  const dir = mirrorDir();
  const rows = practices.map(([slug, legacyId, name, nameEs, expectedSha256]) => {
    const en = content(dir, "practice", legacyId);
    const es = content(dir, "practica", legacyId);
    const sha256 = crypto.createHash("sha256")
      .update([name, nameEs, en.description, es.description, en.fullDescription, es.fullDescription].join("\u001f"))
      .digest("hex");
    if (sha256 !== expectedSha256) throw new Error(`Canonical practice snapshot changed unexpectedly: ${slug}`);
    const formattedEn = formatPracticeContent(en.description, en.fullDescription);
    const formattedEs = formatPracticeContent(es.description, es.fullDescription);
    return [slug, name, nameEs, formattedEn.description, formattedEs.description, formattedEn.fullDescription, formattedEs.fullDescription];
  });
  const values = rows.flat();
  const placeholders = rows.map((_, row) => {
    const offset = row * 7;
    return `(${Array.from({ length: 7 }, (_, column) => `$${offset + column + 1}`).join(", ")})`;
  }).join(", ");

  await client.query(`
    WITH canonical_practices (slug, name, name_es, description, description_es, full_description, full_description_es) AS (
      VALUES ${placeholders}
    )
    UPDATE practice_groups AS target
    SET
      name = source.name,
      name_es = source.name_es,
      description = source.description,
      description_es = source.description_es,
      full_description = source.full_description,
      full_description_es = source.full_description_es
    FROM canonical_practices AS source
    WHERE target.slug = source.slug
  `, values);
}
