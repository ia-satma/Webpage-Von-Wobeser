import * as cheerio from "cheerio";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { getMirrorDir } from "../mirror/config";

/**
 * Snapshot editorial de las industrias públicas de Von Wobeser y Sierra.
 *
 * La fuente se verificó contra el sitio oficial el 12-ago-2026. El HTML
 * versionado bajo frontend-mirror conserva el contenido de ese snapshot.
 */
export const CANONICAL_INDUSTRIES_SNAPSHOT_DATE = "2026-08-12";

export type CanonicalIndustryManifest = {
  slug: string;
  legacyId: string;
  name: string;
  nameEs: string;
  contentSha256: string;
};

export type CanonicalIndustryContent = CanonicalIndustryManifest & {
  description: string;
  descriptionEs: string;
  fullDescription: string;
  fullDescriptionEs: string;
};

// Los slugs son contratos de URL y no se modifican. El orden queda en la
// semilla/base de datos, junto con la metadata visual de cada industria.
export const canonicalIndustryManifest: readonly CanonicalIndustryManifest[] = [
  { slug: "automotive-mobility-manufacturing", legacyId: "16", name: "Automotive, Mobility & Manufacturing", nameEs: "Automotriz, Movilidad y Manufactura", contentSha256: "87ecf18773f761b37718590550a5f77324c8d5adbe3941b052bf1b84dff6f304" },
  { slug: "consumer-goods", legacyId: "10", name: "Consumer Goods", nameEs: "Bienes de Consumo", contentSha256: "3aab25d93bbceeafbc05e7b82e3e4d34ff147e3de78cded66d929c59421ce8ac" },
  { slug: "energy-natural-resources-industry", legacyId: "9", name: "Energy & Natural Resources", nameEs: "Energía y Recursos Naturales", contentSha256: "0dcc25f2d1006189f0554e071fbeb6dff76868238e80fdac42e7094fa0403c1b" },
  { slug: "pharmaceutical-life-sciences", legacyId: "4", name: "Pharmaceutical & Life Sciences", nameEs: "Farmacéutica y Ciencias de la Salud", contentSha256: "6ba3ff20cf77ee2126b0e3a9a630e5272099789f4468aeec8cc98cdc1d0e5f21" },
  { slug: "real-estate-industry", legacyId: "19", name: "Real Estate", nameEs: "Inmobiliario", contentSha256: "b9d29f6812fe9bc353ded8df72890fac3796f0f60b002fcd9e6b121c8e65199c" },
  { slug: "financial-services", legacyId: "11", name: "Financial Services", nameEs: "Servicios Financieros", contentSha256: "f00e88b26c784de1f3e1a813e951f14a9e5b607b0da6504d19d65d923ce83c08" },
  { slug: "technology-industry", legacyId: "20", name: "Technology", nameEs: "Tecnología", contentSha256: "debc6d3defc3ff5c68b4dbb240b9439ea537fd37354984ca54e2fc0f9ecd51ea" },
] as const;

const unsafeContent = /<\/?(?:script|iframe|object|embed)\b|\bon\w+\s*=|\bjavascript\s*:/i;
const paragraphBreak = /(?:\s*<br\s*\/?>\s*){2,}/gi;
const inlineBreak = /\s*<br\s*\/?>\s*/gi;

function requiredHtml($: cheerio.CheerioAPI, selector: string, source: string): string {
  const html = $(selector).first().html()?.trim() || "";
  if (!html || unsafeContent.test(html)) {
    throw new Error(`Invalid canonical industry content in ${source}: ${selector}`);
  }
  return html;
}

function readIndustry(mirrorDir: string, languageDirectory: "industry" | "industria", legacyId: string) {
  const relative = path.join("index.php", languageDirectory, `p-${legacyId}.html`);
  const source = path.join(mirrorDir, relative);
  const $ = cheerio.load(fs.readFileSync(source, "utf8"));
  return {
    description: requiredHtml($, ".single__content--intro", relative),
    fullDescription: requiredHtml($, ".single__content--txt", relative),
  };
}

/** Converts the legacy break-based body into safe, semantic paragraph blocks. */
function paragraphBlocks(html: string): string[] {
  const $ = cheerio.load(`<div id="canonical-industry-body">${html}</div>`);
  const root = $("#canonical-industry-body");
  return (root.html() || "")
    .split(paragraphBreak)
    .map((block) => block.replace(inlineBreak, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function formatIndustryContent(description: string, fullDescription: string) {
  const $ = cheerio.load(`<div id="canonical-industry-intro">${description}</div>`);
  return {
    description: $("#canonical-industry-intro").html()?.trim() || "",
    fullDescription: paragraphBlocks(fullDescription).map((block) => `<p>${block}</p>`).join(""),
  };
}

/** Reads the checked-in official snapshot without making a network request. */
export function loadCanonicalIndustryContent(mirrorDir = getMirrorDir()): CanonicalIndustryContent[] {
  return canonicalIndustryManifest.map((industry) => {
    const en = readIndustry(mirrorDir, "industry", industry.legacyId);
    const es = readIndustry(mirrorDir, "industria", industry.legacyId);
    const sha256 = crypto.createHash("sha256")
      .update([industry.name, industry.nameEs, en.description, es.description, en.fullDescription, es.fullDescription].join("\u001f"))
      .digest("hex");
    if (sha256 !== industry.contentSha256) {
      throw new Error(`Canonical industry snapshot changed unexpectedly: ${industry.slug}`);
    }
    const formattedEn = formatIndustryContent(en.description, en.fullDescription);
    const formattedEs = formatIndustryContent(es.description, es.fullDescription);
    return {
      ...industry,
      description: formattedEn.description,
      descriptionEs: formattedEs.description,
      fullDescription: formattedEn.fullDescription,
      fullDescriptionEs: formattedEs.fullDescription,
    };
  });
}

type SeedIndustry = {
  slug: string;
  name: string;
  nameEs: string;
  description: string;
  descriptionEs: string;
  fullDescription: string | null;
  fullDescriptionEs: string | null;
};

/** Replaces only editorial fields, retaining seed-only presentation metadata. */
export function applyCanonicalIndustryContent<T extends SeedIndustry>(industries: readonly T[]): T[] {
  const bySlug = new Map(loadCanonicalIndustryContent().map((industry) => [industry.slug, industry]));
  return industries.map((industry) => {
    const canonical = bySlug.get(industry.slug);
    if (!canonical) return industry;
    const {
      legacyId: _legacyId,
      contentSha256: _contentSha256,
      slug: _slug,
      ...editorialFields
    } = canonical;
    return { ...industry, ...editorialFields };
  });
}
