import * as cheerio from "cheerio";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// This migration reads the versioned official snapshot. The migration runner
// executes it inside one transaction and records its source checksum.
const industries = [
  ["automotive-mobility-manufacturing", "16", "Automotive, Mobility & Manufacturing", "Automotriz, Movilidad y Manufactura", "87ecf18773f761b37718590550a5f77324c8d5adbe3941b052bf1b84dff6f304"],
  ["consumer-goods", "10", "Consumer Goods", "Bienes de Consumo", "3aab25d93bbceeafbc05e7b82e3e4d34ff147e3de78cded66d929c59421ce8ac"],
  ["energy-natural-resources-industry", "9", "Energy & Natural Resources", "Energía y Recursos Naturales", "0dcc25f2d1006189f0554e071fbeb6dff76868238e80fdac42e7094fa0403c1b"],
  ["pharmaceutical-life-sciences", "4", "Pharmaceutical & Life Sciences", "Farmacéutica y Ciencias de la Salud", "6ba3ff20cf77ee2126b0e3a9a630e5272099789f4468aeec8cc98cdc1d0e5f21"],
  ["real-estate-industry", "19", "Real Estate", "Inmobiliario", "b9d29f6812fe9bc353ded8df72890fac3796f0f60b002fcd9e6b121c8e65199c"],
  ["financial-services", "11", "Financial Services", "Servicios Financieros", "f00e88b26c784de1f3e1a813e951f14a9e5b607b0da6504d19d65d923ce83c08"],
  ["technology-industry", "20", "Technology", "Tecnología", "debc6d3defc3ff5c68b4dbb240b9439ea537fd37354984ca54e2fc0f9ecd51ea"],
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
    if (!value) throw new Error(`Missing canonical industry content: ${source} ${selector}`);
    return value;
  };
  return { description: field(".single__content--intro"), fullDescription: field(".single__content--txt") };
}

function paragraphBlocks(html) {
  const $ = cheerio.load(`<div id="canonical-industry-body">${html}</div>`, { decodeEntities: false });
  const root = $("#canonical-industry-body");
  return (root.html() || "").split(paragraphBreak)
    .map((block) => block.replace(inlineBreak, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function formatIndustryContent(description, fullDescription) {
  const $ = cheerio.load(`<div id="canonical-industry-intro">${description}</div>`, { decodeEntities: false });
  return {
    description: $("#canonical-industry-intro").html()?.trim() || "",
    fullDescription: paragraphBlocks(fullDescription).map((block) => `<p>${block}</p>`).join(""),
  };
}

export default async function migrateCanonicalIndustryContent(client) {
  const dir = mirrorDir();
  const rows = industries.map(([slug, legacyId, name, nameEs, expectedSha256]) => {
    const en = content(dir, "industry", legacyId);
    const es = content(dir, "industria", legacyId);
    const sha256 = crypto.createHash("sha256")
      .update([name, nameEs, en.description, es.description, en.fullDescription, es.fullDescription].join("\u001f"))
      .digest("hex");
    if (sha256 !== expectedSha256) throw new Error(`Canonical industry snapshot changed unexpectedly: ${slug}`);
    const formattedEn = formatIndustryContent(en.description, en.fullDescription);
    const formattedEs = formatIndustryContent(es.description, es.fullDescription);
    return [slug, name, nameEs, formattedEn.description, formattedEs.description, formattedEn.fullDescription, formattedEs.fullDescription];
  });
  const values = rows.flat();
  const placeholders = rows.map((_, row) => {
    const offset = row * 7;
    return `(${Array.from({ length: 7 }, (_, column) => `$${offset + column + 1}`).join(", ")})`;
  }).join(", ");

  await client.query(`
    WITH canonical_industries (slug, name, name_es, description, description_es, full_description, full_description_es) AS (
      VALUES ${placeholders}
    )
    UPDATE industry_groups AS target
    SET
      name = source.name,
      name_es = source.name_es,
      description = source.description,
      description_es = source.description_es,
      full_description = source.full_description,
      full_description_es = source.full_description_es
    FROM canonical_industries AS source
    WHERE target.slug = source.slug
  `, values);
}
