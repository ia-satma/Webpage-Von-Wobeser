import * as cheerio from "cheerio";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { getMirrorDir } from "../mirror/config";

/**
 * Snapshot editorial de las prácticas públicas de Von Wobeser y Sierra.
 *
 * La fuente se verificó contra el sitio oficial el 12-ago-2026. El HTML
 * versionado bajo frontend-mirror conserva el contenido de ese snapshot; este
 * manifiesto fija qué 18 páginas son públicas, su ruta histórica y los
 * nombres canónicos que se deben mostrar en cada idioma.
 */
export const CANONICAL_PRACTICES_SNAPSHOT_DATE = "2026-08-12";

export type CanonicalPracticeManifest = {
  slug: string;
  legacyId: string;
  name: string;
  nameEs: string;
  contentSha256: string;
};

export type CanonicalPracticeContent = CanonicalPracticeManifest & {
  description: string;
  descriptionEs: string;
  fullDescription: string;
  fullDescriptionEs: string;
};

// El orden coincide con la navegación pública. Los slugs son contratos de URL
// y no se modifican, aunque el nombre editorial haya sido corregido.
export const canonicalPracticeManifest: readonly CanonicalPracticeManifest[] = [
  { slug: "corporate-ma", legacyId: "17", name: "Corporate, Mergers & Acquisitions", nameEs: "Corporativo, Fusiones y Adquisiciones", contentSha256: "2b8b792837e4fe11a9627c6c257fbe9a1372a618dfc4fc5d87af288b2f245a7f" },
  { slug: "antitrust-competition", legacyId: "14", name: "Competition & Antitrust", nameEs: "Competencia Económica", contentSha256: "f22a67b90a5a99df4a81383dd4cfc88685f593013f98b4f57eb387bdde666fc9" },
  { slug: "arbitration", legacyId: "46", name: "Arbitration", nameEs: "Arbitraje", contentSha256: "c582d43613bcf6ebefea1a5a6a6c4799ed590ab2c4480092430c84319793dc20" },
  { slug: "litigation", legacyId: "47", name: "Litigation", nameEs: "Litigio", contentSha256: "7a954381df7eb24cfc0ba97388d1022829bcd9040e0ce19d0293e96ddc56c208" },
  { slug: "investigations-anticorruption", legacyId: "5", name: "Investigations, Anti-corruption & Compliance", nameEs: "Investigaciones, Anticorrupción y Compliance", contentSha256: "74ca057bebbfc98ef0eaaaff15fd7e2bfd081274c3d5e43ac12e55be200b10f5" },
  { slug: "bankruptcy-restructuring", legacyId: "15", name: "Bankruptcy & Restructuring", nameEs: "Concursos Mercantiles y Reestructuración", contentSha256: "f73f85b9eb075ae64b0aa6afedcc4449c5bba09fcd45bf717ddab5d78ea17dd3" },
  { slug: "banking-finance", legacyId: "9", name: "Banking & Finance", nameEs: "Bancario y Financiero", contentSha256: "aaabe0d735a74e140a748d7b29deda832630fd1c28408bf55941795daf29e00f" },
  { slug: "energy-natural-resources", legacyId: "18", name: "Energy & Natural Resources", nameEs: "Energía y Recursos Naturales", contentSha256: "f29deab3430794ea8e9df7fae60206edd85e7c71f278d347adbb02eb1081f954" },
  { slug: "esg", legacyId: "90", name: "ESG (Environmental, Social and Governance)", nameEs: "ESG (Ambiental, Social y Gobierno Corporativo)", contentSha256: "e084d12fd2b9d094388d315f6972503541df469811aa59eea455ef2e34cc4bcc" },
  { slug: "real-estate", legacyId: "23", name: "Real Estate", nameEs: "Inmobiliario", contentSha256: "7accfe527cc68353c49b21a69b8a9201569b0a4b32c732da4ec4be03030d0097" },
  { slug: "intellectual-property", legacyId: "33", name: "Industrial & Intellectual Property", nameEs: "Propiedad Industrial e Intelectual", contentSha256: "a383fc8ea3ad814717046a6ee3754fff7d505a37a8bbeb4bb9ff6a52a4d77312" },
  { slug: "labor-employment", legacyId: "26", name: "Labor, Executive Compensations & Benefits", nameEs: "Laboral, Compensación de Ejecutivos y Prestaciones", contentSha256: "f7c3788a42d706d4cd9964055076149df8113c553fc6450742d938f1020bbbc1" },
  { slug: "tax", legacyId: "20", name: "Tax (Consultancy, Controversy & Litigation)", nameEs: "Fiscal (Consultoría, Controversias y Litigio)", contentSha256: "edd44cc464fc1f6c73716039d07d345877eff3bec3fdfaf92fa576ab7f65ca9f" },
  { slug: "international-trade", legacyId: "12", name: "International Trade & Customs", nameEs: "Comercio Exterior y Aduanas", contentSha256: "386ca9bb51c481e37f5b986c21dbf80463aa6caaf4d9fbb4e168b25d85226868" },
  { slug: "telecommunications-media-technology", legacyId: "39", name: "Telecommunications, Media & Technology", nameEs: "Telecomunicaciones, Medios y Tecnología", contentSha256: "bf647b1130c722d5c9823a6fcca0e84ddfb7cbed1456c5aa76d058fbde189a4e" },
  { slug: "environmental", legacyId: "3", name: "Environmental", nameEs: "Ambiental", contentSha256: "5f73d659c4750d431d7c67b00146f25be7e76a1392a73c4430c68d3aba640bde" },
  { slug: "immigration-global-mobility", legacyId: "89", name: "Immigration & Global Mobility", nameEs: "Migración y Movilidad Global", contentSha256: "12ba226a77703a541239dd07fe6ba3c5f4fd21a80023677ea1f9988992ac0529" },
  { slug: "projects-infrastructure", legacyId: "92", name: "Projects & Infrastructure", nameEs: "Proyectos e Infraestructura", contentSha256: "3a94deb57dd923558b583bf8a56717eed870235052611ace52973bb1f9fbed6c" },
] as const;

const unsafeContent = /<\/?(?:script|iframe|object|embed)\b|\bon\w+\s*=|\bjavascript\s*:/i;
const paragraphBreak = /(?:\s*<br\s*\/?>\s*){2,}/gi;
const inlineBreak = /\s*<br\s*\/?>\s*/gi;

function requiredHtml($: cheerio.CheerioAPI, selector: string, source: string): string {
  const html = $(selector).first().html()?.trim() || "";
  if (!html || unsafeContent.test(html)) {
    throw new Error(`Invalid canonical practice content in ${source}: ${selector}`);
  }
  return html;
}

function readPractice(mirrorDir: string, languageDirectory: "practice" | "practica", legacyId: string) {
  const relative = path.join("index.php", languageDirectory, `p-${legacyId}.html`);
  const source = path.join(mirrorDir, relative);
  const $ = cheerio.load(fs.readFileSync(source, "utf8"));
  return {
    description: requiredHtml($, ".single__content--intro", relative),
    fullDescription: requiredHtml($, ".single__content--txt", relative),
  };
}

function plainText(html: string): string {
  return cheerio.load(`<div>${html}</div>`)("div").text().replace(/\s+/g, " ").trim();
}

/**
 * El espejo editorial usa tres formatos históricos para el cuerpo: texto con
 * pares de <br>, spans de bloque con estilos pegados y, excepcionalmente,
 * saltos simples dentro de un párrafo. El CMS necesita HTML semántico para que
 * el diseño pueda dar ritmo de lectura consistente a las 36 variantes.
 */
function paragraphBlocks(html: string): string[] {
  const $ = cheerio.load(`<div id="canonical-practice-body">${html}</div>`);
  const root = $("#canonical-practice-body");
  const spans = root.children("span");
  const onlyBlockSpans = spans.length > 0 && root.contents().toArray().every((node) =>
    node.type === "text" ? !$(node).text().trim() : node.type === "tag" && (node as any).tagName === "span",
  );

  if (onlyBlockSpans) {
    return spans.toArray()
      .map((span) => $(span).html()?.trim() || "")
      .filter(Boolean);
  }

  return (root.html() || "")
    .split(paragraphBreak)
    .map((block) => block.replace(inlineBreak, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function formatPracticeContent(description: string, fullDescription: string) {
  const blocks = paragraphBlocks(fullDescription);
  const $ = cheerio.load(`<div id="canonical-practice-intro">${description}</div>`);
  const intro = $("#canonical-practice-intro");
  const lastParagraph = intro.find("p").last();

  // Dos páginas del espejo separan tipográficamente la abreviatura "S.C.".
  // Se recompone en la introducción antes de crear los párrafos del cuerpo.
  if (lastParagraph.length && /\bS\.$/.test(plainText(lastParagraph.html() || "")) && /^C\./.test(plainText(blocks[0] || ""))) {
    lastParagraph.append(blocks.shift() || "");
  }

  return {
    description: intro.html()?.trim() || "",
    fullDescription: blocks.map((block) => `<p>${block}</p>`).join(""),
  };
}

/** Reads the checked-in official snapshot without making a network request. */
export function loadCanonicalPracticeContent(mirrorDir = getMirrorDir()): CanonicalPracticeContent[] {
  return canonicalPracticeManifest.map((practice) => {
    const en = readPractice(mirrorDir, "practice", practice.legacyId);
    const es = readPractice(mirrorDir, "practica", practice.legacyId);
    const rawContent = {
      ...practice,
      description: en.description,
      descriptionEs: es.description,
      fullDescription: en.fullDescription,
      fullDescriptionEs: es.fullDescription,
    };
    const sha256 = crypto.createHash("sha256")
      .update([rawContent.name, rawContent.nameEs, rawContent.description, rawContent.descriptionEs, rawContent.fullDescription, rawContent.fullDescriptionEs].join("\u001f"))
      .digest("hex");
    if (sha256 !== practice.contentSha256) {
      throw new Error(`Canonical practice snapshot changed unexpectedly: ${practice.slug}`);
    }
    const formattedEn = formatPracticeContent(en.description, en.fullDescription);
    const formattedEs = formatPracticeContent(es.description, es.fullDescription);
    return {
      ...practice,
      description: formattedEn.description,
      descriptionEs: formattedEs.description,
      fullDescription: formattedEn.fullDescription,
      fullDescriptionEs: formattedEs.fullDescription,
    };
  });
}

type SeedPractice = {
  slug: string;
  name: string;
  nameEs: string;
  description: string;
  descriptionEs: string;
  fullDescription: string | null;
  fullDescriptionEs: string | null;
};

/** Replaces only editorial fields, retaining seed-only presentation metadata. */
export function applyCanonicalPracticeContent<T extends SeedPractice>(practices: readonly T[]): T[] {
  const bySlug = new Map(loadCanonicalPracticeContent().map((practice) => [practice.slug, practice]));
  return practices.map((practice) => {
    const canonical = bySlug.get(practice.slug);
    if (!canonical) return practice;
    const {
      legacyId: _legacyId,
      contentSha256: _contentSha256,
      slug: _slug,
      ...editorialFields
    } = canonical;
    return { ...practice, ...editorialFields };
  });
}
